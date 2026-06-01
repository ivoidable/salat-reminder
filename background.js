// ─── Prayer Blocker – Background Service Worker ───────────────────────────────

const PRAYER_NAMES = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const ALARM_PREFIX = 'prayer_';
const API_BASE = 'https://api.aladhan.com/v1/timingsByCity';

// ──────────────────────────────────────────────────────────────────────────────
// Initialise on install / startup
// ──────────────────────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
  // Only initialise storage fields that don't exist yet (preserve existing user settings)
  const existing = await chrome.storage.local.get(null);
  const defaults = {};
  if (existing.blocked      === undefined) defaults.blocked      = false;
  if (existing.currentPrayer === undefined) defaults.currentPrayer = null;
  if (existing.prayerTimes  === undefined) defaults.prayerTimes  = {};
  if (existing.lastFetch    === undefined) defaults.lastFetch    = null;
  if (!existing.settings) {
    defaults.settings = {
      method: 4,           // Umm Al-Qura (Morocco default)
      school: 0,
      city: '',
      country: 'Morocco',
      notifyBefore: 5,
      blockEnabled: true,
      warnEnabled:  true,
    };
  }
  if (Object.keys(defaults).length) {
    await chrome.storage.local.set(defaults);
  }
  await scheduleDailyRefresh();
  await fetchAndSchedule();
});

chrome.runtime.onStartup.addListener(async () => {
  await fetchAndSchedule();
});

// ──────────────────────────────────────────────────────────────────────────────
// Alarm listener
// ──────────────────────────────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily_refresh') {
    await fetchAndSchedule();
    return;
  }

  if (alarm.name.startsWith('warn_')) {
    const prayer = alarm.name.replace('warn_', '');
    
    // Notify all tabs to show the warning modal
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome')) {
        chrome.tabs.sendMessage(tab.id, { type: 'SHOW_WARNING', prayer }).catch(() => { });
      }
    }

    chrome.notifications.create(`warn_${prayer}`, {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `${prayer} prayer in 5 minutes`,
      message: 'Prepare yourself for prayer – Allahu Akbar.',
      priority: 2
    });
    return;
  }

  if (alarm.name.startsWith('task_')) {
    const data = await chrome.storage.local.get('settings');
    const settings = data.settings || {};
    const tasks = settings.tasks || [];
    const task = tasks.find(t => t.id === alarm.name);
    if (task) {
      await triggerTaskBlock(task.name);
    }
    return;
  }

  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const prayer = alarm.name.replace(ALARM_PREFIX, '');
    await triggerBlock(prayer);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Message listener (from popup / block page)
// ──────────────────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATE') {
    chrome.storage.local.get(null, (data) => sendResponse(data));
    return true;
  }

  if (msg.type === 'PRAYED' || msg.type === 'TASK_DONE') {
    unblock().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'REFRESH_TIMES') {
    fetchAndSchedule().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'SAVE_SETTINGS') {
    chrome.storage.local.set({ settings: msg.settings }, () => {
      fetchAndSchedule().then(() => sendResponse({ ok: true }));
    });
    return true;
  }

  if (msg.type === 'UPDATE_TASKS') {
    scheduleTasks(msg.settings).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'TEST_TASK') {
    triggerTaskBlock(msg.taskName).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'FORCE_FETCH') {
    fetchAndSchedule().then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'IS_BLOCKED') {
    chrome.storage.local.get('blocked', (d) => sendResponse({ blocked: d.blocked }));
    return true;
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Core: fetch times from Aladhan API and schedule alarms
// ──────────────────────────────────────────────────────────────────────────────
async function fetchAndSchedule() {
  const data = await chrome.storage.local.get('settings');
  const settings = data.settings || {};

  // Determine city — fall back to IP geolocation if not set
  let city = (settings.city || '').trim();
  let country = (settings.country || '').trim();

  if (!city || !country) {
    try {
      const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
      city = geo.city || '';
      country = geo.country_name || '';
      await chrome.storage.local.set({
        settings: { ...settings, city, country }
      });
    } catch (_) {
      console.warn('[PrayerBlocker] Could not determine city from IP.');
      return;
    }
  }

  if (!city || !country) {
    console.warn('[PrayerBlocker] No city configured.');
    return;
  }

  const method = settings.method || 4;
  const school = settings.school || 0;
  const url = `${API_BASE}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}&school=${school}&iso8601=true`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();
    if (json.code !== 200) throw new Error(`API error: ${json.status}`);

    const timings = json.data.timings;
    const times = {};

    for (const name of PRAYER_NAMES) {
      if (!timings[name]) continue;
      if (timings[name].includes('T')) {
        // Absolute ISO time -> convert exactly to the user's local timezone
        const d = new Date(timings[name]);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        times[name] = `${hh}:${mm}`;
      } else {
        // Fallback if ISO format is missing for any reason
        times[name] = timings[name].split(' ')[0];
      }
    }

    await chrome.storage.local.set({ prayerTimes: times, lastFetch: Date.now() });
    await clearPrayerAlarms();
    await setAlarms(times, settings);
    await scheduleTasks(settings);
    console.log('[PrayerBlocker] Times scheduled:', times);
  } catch (err) {
    console.error('[PrayerBlocker] Fetch error:', err);
  }
}

async function setAlarms(times, settings) {
  const warnBefore = (settings.notifyBefore || 5) * 60 * 1000;

  for (const [name, timeStr] of Object.entries(times)) {
    if (name === 'Sunrise') continue;

    const [h, m] = timeStr.split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(h, m, 0, 0);

    const now = Date.now();
    if (prayerDate.getTime() > now) {
      chrome.alarms.create(`${ALARM_PREFIX}${name}`, { when: prayerDate.getTime() });

      const warnTime = prayerDate.getTime() - warnBefore;
      if (warnTime > now) {
        chrome.alarms.create(`warn_${name}`, { when: warnTime });
      }
    }
  }
}

async function clearPrayerAlarms() {
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith(ALARM_PREFIX) || alarm.name.startsWith('warn_')) {
      await chrome.alarms.clear(alarm.name);
    }
  }
}

async function scheduleTasks(settings) {
  // Clear existing task alarms
  const alarms = await chrome.alarms.getAll();
  for (const alarm of alarms) {
    if (alarm.name.startsWith('task_')) {
      await chrome.alarms.clear(alarm.name);
    }
  }

  if (!settings || !settings.tasks) return;

  for (const task of settings.tasks) {
    if (task.type === 'interval') {
      chrome.alarms.create(task.id, { delayInMinutes: task.value, periodInMinutes: task.value });
    } else if (task.type === 'time') {
      const [h, m] = task.value.split(':').map(Number);
      const now = new Date();
      let alarmTime = new Date();
      alarmTime.setHours(h, m, 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (alarmTime.getTime() <= now.getTime()) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }
      
      chrome.alarms.create(task.id, { 
        when: alarmTime.getTime(),
        periodInMinutes: 24 * 60 // repeat daily
      });
    }
  }
}

async function scheduleDailyRefresh() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 1, 0, 0);
  chrome.alarms.create('daily_refresh', {
    when: tomorrow.getTime(),
    periodInMinutes: 24 * 60
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Block / Unblock
// ──────────────────────────────────────────────────────────────────────────────
async function triggerBlock(prayer) {
  await chrome.storage.local.set({ blocked: true, currentPrayer: prayer });

  // Notify all tabs to show the overlay
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url && !tab.url.startsWith('chrome')) {
      chrome.tabs.sendMessage(tab.id, { type: 'SHOW_BLOCK', prayer }).catch(() => { });
    }
  }

  // Show system notification
  chrome.notifications.create('prayer_time', {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `Time for ${prayer} Prayer`,
    message: 'All work is paused. Please perform your prayer.',
    priority: 2,
    requireInteraction: true
  });
}

async function unblock() {
  await chrome.storage.local.set({ blocked: false, currentPrayer: null, currentTask: null });

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url && !tab.url.startsWith('chrome')) {
      chrome.tabs.sendMessage(tab.id, { type: 'HIDE_BLOCK' }).catch(() => { });
    }
  }
}

async function triggerTaskBlock(taskName) {
  await chrome.storage.local.set({ blocked: true, currentTask: taskName, currentPrayer: null });

  // Notify all tabs to show the overlay
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url && !tab.url.startsWith('chrome')) {
      chrome.tabs.sendMessage(tab.id, { type: 'SHOW_TASK_BLOCK', taskName }).catch(() => { });
    }
  }

  // Show system notification
  chrome.notifications.create('task_time_' + Date.now(), {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: `Task Reminder`,
    message: taskName,
    priority: 2,
    requireInteraction: true
  });
}
