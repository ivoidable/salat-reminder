// ─── Popup Script ─────────────────────────────────────────────────────────────

const ARABIC = { Fajr:'الفجر', Sunrise:'الشروق', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
const ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];


const TRANSLATIONS = {
  en: {
    title: "Salah Time",
    subtitle: "Prayer Reminder & Blocker",
    settingsTitle: "Settings",
    checking: "Checking prayer times…",
    detecting: "Detecting location…",
    todaysPrayers: "Today's Prayer Times",
    nextPrayer: "Next Prayer",
    btnRefresh: "Refresh",
    btnSettings: "Settings",
    wBtnRefresh: "↻ Refresh",
    wBtnSettings: "⚙ Settings",
    refreshing: "Refreshing...",
    wRefreshing: "↻...",
    blockedMsg: (p) => `${p} prayer time – screen blocked`,
    activeMsg: "Active – monitoring prayer times",
    noLocation: "Location not set – visit Settings",
    badgeNext: "Next",
    timeLeftMsg: "Time left for",
    timeLeftAzan: "Time left for Azan",
    Fajr: "Fajr", Sunrise: "Sunrise", Dhuhr: "Dhuhr", Asr: "Asr", Maghrib: "Maghrib", Isha: "Isha"
  },
  ar: {
    title: "أوقات الصلاة",
    subtitle: "تذكير وحظر وقت الصلاة",
    settingsTitle: "الإعدادات",
    checking: "جاري التحقق من أوقات الصلاة...",
    detecting: "جاري تحديد الموقع...",
    todaysPrayers: "أوقات الصلاة لليوم",
    nextPrayer: "الصلاة القادمة",
    btnRefresh: "تحديث",
    btnSettings: "الإعدادات",
    wBtnRefresh: "↻ تحديث",
    wBtnSettings: "⚙ الإعدادات",
    refreshing: "جاري التحديث...",
    wRefreshing: "↻...",
    blockedMsg: (p) => `وقت صلاة ${p} - تم حظر الشاشة`,
    activeMsg: "نشط - مراقبة أوقات الصلاة",
    noLocation: "الموقع غير محدد - قم بزيارة الإعدادات",
    badgeNext: "التالية",
    timeLeftMsg: "بقى على",
    timeLeftAzan: "تبقى على الأذان",
    Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء"
  },
  fr: {
    title: "Heures de Prière",
    subtitle: "Rappel et Blocage",
    settingsTitle: "Paramètres",
    checking: "Vérification des heures de prière...",
    detecting: "Détection de l'emplacement...",
    todaysPrayers: "Heures de Prière du Jour",
    nextPrayer: "Prochaine Prière",
    btnRefresh: "Actualiser",
    btnSettings: "Paramètres",
    wBtnRefresh: "↻ Actualiser",
    wBtnSettings: "⚙ Paramètres",
    refreshing: "Actualisation...",
    wRefreshing: "↻...",
    blockedMsg: (p) => `Heure de prière ${p} – écran bloqué`,
    activeMsg: "Actif – surveillance des heures de prière",
    noLocation: "Emplacement non défini – allez aux paramètres",
    badgeNext: "Prochaine",
    timeLeftMsg: "Temps restant",
    timeLeftAzan: "Temps avant l'Adhan",
    Fajr: "Fajr", Sunrise: "Chourouq", Dhuhr: "Dhouhr", Asr: "Asr", Maghrib: "Maghrib", Isha: "Isha"
  }
};

let currentLang = 'en';

function applyTranslations(lang) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (t[key]) {
      el.title = t[key];
    }
  });
}

let countdownInterval = null;
let currentLayout = 'list';

document.addEventListener('DOMContentLoaded', () => {
  loadState();

  document.getElementById('btn-refresh').addEventListener('click', forceFetch);
  document.getElementById('widget-btn-refresh').addEventListener('click', forceFetch);
  
  document.getElementById('btn-settings').addEventListener('click', openSettings);
  document.getElementById('btn-settings-full').addEventListener('click', openSettings);
  document.getElementById('widget-btn-settings').addEventListener('click', openSettings);
});

function forceFetch() {
  const btn = document.getElementById('btn-refresh');
  const wbtn = document.getElementById('widget-btn-refresh');
  const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
  btn.textContent = t.refreshing;
  wbtn.textContent = t.wRefreshing;
  btn.disabled = true; wbtn.disabled = true;
  chrome.runtime.sendMessage({ type: 'FORCE_FETCH' }, () => {
    loadState();
    btn.textContent = t.btnRefresh;
    wbtn.textContent = t.wBtnRefresh;
    btn.disabled = false; wbtn.disabled = false;
  });
}

function openSettings() {
  chrome.runtime.openOptionsPage();
}

async function loadState() {
  chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
    if (!state) return;
    
    currentLayout = state.settings?.layout || 'list';
    currentLang = state.settings?.language || 'en';
    applyTranslations(currentLang);
    
    if (currentLayout !== 'list') {
      document.getElementById('main-view').style.display = 'none';
      document.getElementById('widget-view').style.display = 'block';
      
      document.getElementById('widget-location').textContent = state.settings?.city || 'Unknown';
      const dayName = new Date().toLocaleDateString('ar-EG', { weekday: 'long' });
      const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {day: 'numeric', month: 'long', year : 'numeric'}).format(new Date());
      document.getElementById('widget-date').textContent = `${dayName} ${hijriDate}`;
    } else {
      document.getElementById('main-view').style.display = 'block';
      document.getElementById('widget-view').style.display = 'none';
    }

    renderStatus(state);
    renderLocation(state.settings);
    renderTheme(state.settings);
    renderPrayers(state.prayerTimes, state.blocked, currentLayout);
    startCountdown(state.prayerTimes, currentLayout);
  });
}

function renderStatus(state) {
  const bar  = document.getElementById('status-bar');
  const text = document.getElementById('status-text');

  if (state.blocked) {
    bar.className = 'blocked';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const pName = currentLang === 'ar' ? (ARABIC[state.currentPrayer] || state.currentPrayer) : (t[state.currentPrayer] || state.currentPrayer);
    text.textContent = t.blockedMsg(pName);
  } else {
    bar.className = 'ok';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    text.textContent = t.activeMsg;
  }
}

function renderLocation(settings) {
  const el = document.getElementById('location-text');
  if (settings?.city) {
    el.textContent = `${settings.city}, ${settings.country}`;
  } else {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    el.textContent = t.noLocation;
  }
}

function renderTheme(settings) {
  if (settings?.theme) {
    document.body.className = settings.theme === 'sage' ? '' : `theme-${settings.theme}`;
  }
}

function renderPrayers(times, blocked, layout = 'list') {
  if (!times || !Object.keys(times).length) return;
  const now  = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  let nextFound = false;

  if (layout === 'list') {
    const grid = document.getElementById('prayers-grid');
    grid.innerHTML = ORDER
      .filter(n => times[n])
      .map(name => {
        const [h, m] = times[name].split(':').map(Number);
        const prayerM = h * 60 + m;
        const passed  = prayerM < nowM;
        const isNext  = !passed && !nextFound && (nextFound = true);

        return `
          <div class="prayer-row ${isNext ? 'next' : passed ? 'passed' : ''}">
            <span class="prayer-name">
              ${(TRANSLATIONS[currentLang] || TRANSLATIONS['en'])[name] || name}
              <span class="prayer-name-ar">${ARABIC[name] || ''}</span>
            </span>
            <span class="prayer-time">${formatTime(times[name])}</span>
            ${isNext ? `<span class="prayer-badge">${(TRANSLATIONS[currentLang] || TRANSLATIONS['en']).badgeNext}</span>` : ''}
          </div>`;
      }).join('');
  } else {
    const grid = document.getElementById('widget-prayers-grid');
    let html = `<div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: var(--widget-border);"></div>`;
    
    ORDER.forEach(name => {
      if (!times[name]) return;
      const [h, m] = times[name].split(':').map(Number);
      const prayerM = h * 60 + m;
      const passed  = prayerM < nowM;
      const isNext  = !passed && !nextFound && (nextFound = true);
      
      let colorClass = isNext ? 'color: var(--accent-color);' : (passed ? 'opacity: 0.6;' : 'opacity: 0.95;');
      
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 8px; ${isNext ? 'font-weight: 700;' : ''}">
          <span style="font-size: 1.15rem; ${colorClass}">${currentLang === 'ar' ? ARABIC[name] : (TRANSLATIONS[currentLang] || TRANSLATIONS['en'])[name] || name}</span>
          <span style="font-size: 1.05rem; font-variant-numeric: tabular-nums; ${colorClass}">${formatTimeShort(times[name])}</span>
        </div>
      `;
    });
    grid.innerHTML = html;
  }
}

function startCountdown(times, layout = 'list') {
  if (countdownInterval) clearInterval(countdownInterval);

  function tick() {
    const now  = new Date();
    const nowM = now.getHours() * 60 + now.getMinutes();

    let nextName = null, nextMin = Infinity;
    for (const name of ORDER) {
      if (!times[name]) continue;
      const [h, m] = times[name].split(':').map(Number);
      const diff = h * 60 + m - nowM;
      if (diff > 0 && diff < nextMin) { nextMin = diff; nextName = name; }
    }

    if (nextName) {
      const hh = Math.floor(nextMin / 60);
      const mm = nextMin % 60;
      const timeStr = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
      
      if (layout === 'list') {
        const section = document.getElementById('next-section');
        section.style.display = 'flex';
        document.getElementById('next-prayer-name').textContent = currentLang === 'ar' ? ARABIC[nextName] : `${(TRANSLATIONS[currentLang] || TRANSLATIONS['en'])[nextName] || nextName} · ${ARABIC[nextName]}`;
        document.getElementById('countdown').textContent = hh > 0 ? `${hh}h ${mm}m` : `${mm}m`;
      } else {
        const wc = document.getElementById('widget-countdown-container');
        if (layout === 'ring') {
          // Calculate approx dash offset for circular progress (100% = 282.7)
          let percent = 100 - (nextMin / 180 * 100);
          if (percent < 0) percent = 0; if (percent > 100) percent = 100;
          const dash = percent * 2.827;
          
          wc.innerHTML = `
            <div style="position: relative; width: 140px; height: 140px; margin: 0 auto;">
              <svg viewBox="0 0 100 100" style="transform: rotate(-90deg); width: 100%; height: 100%; overflow: visible;">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--widget-border)" stroke-width="5"></circle>
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent-color)" stroke-width="5" stroke-dasharray="282.7" stroke-dashoffset="${282.7 - dash}" stroke-linecap="round"></circle>
              </svg>
              <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px;">${(TRANSLATIONS[currentLang] || TRANSLATIONS['en']).timeLeftMsg}</div>
                <div style="font-size: 1.25rem; font-weight: 600; margin-bottom: 2px;">${currentLang === 'ar' ? ARABIC[nextName] : ((TRANSLATIONS[currentLang] || TRANSLATIONS['en'])[nextName] || nextName)}</div>
                <div style="font-size: 2rem; font-weight: 700; font-variant-numeric: tabular-nums;">${timeStr}</div>
              </div>
              <div style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--accent-color); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px var(--widget-bg);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>
              </div>
            </div>
          `;
        } else if (layout === 'bar') {
          wc.innerHTML = `
            <div style="background: var(--widget-border); border-radius: 12px; display: flex; align-items: stretch; overflow: hidden; direction: ltr;">
              <div style="background: rgba(0,0,0,0.1); padding: 16px 20px; font-size: 1.8rem; font-weight: 700; font-variant-numeric: tabular-nums; flex-shrink: 0; min-width: 90px; text-align: center;">
                ${timeStr}
              </div>
              <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end; padding: 0 20px; direction: rtl; gap: 8px;">
                <span style="font-size: 1.4rem; font-weight: 700;">${currentLang === 'ar' ? ARABIC[nextName] : ((TRANSLATIONS[currentLang] || TRANSLATIONS['en'])[nextName] || nextName)}</span>
                <span style="opacity: 0.8; font-size: 0.9rem;">${(TRANSLATIONS[currentLang] || TRANSLATIONS['en']).timeLeftAzan}</span>
              </div>
            </div>
          `;
        }
      }
    } else {
      if (layout === 'list') document.getElementById('next-section').style.display = 'none';
      else document.getElementById('widget-countdown-container').innerHTML = '';
    }
  }

  if (times && Object.keys(times).length) {
    tick();
    countdownInterval = setInterval(tick, 30000);
  }
}

function formatTime(str) {
  const [h, m] = str.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh   = h % 12 || 12;
  return `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
}

function formatTimeShort(str) {
  const [h, m] = str.split(':').map(Number);
  const hh   = h % 12 || 12;
  return `${String(hh).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}
