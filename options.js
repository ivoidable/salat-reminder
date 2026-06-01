// ─── Options Script ───────────────────────────────────────────────────────────

const ARABIC = { Fajr:'الفجر', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
const ORDER  = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPreview();

  document.getElementById('btn-save').addEventListener('click', saveSettings);
  document.getElementById('btn-cancel').addEventListener('click', () => window.close());
  document.getElementById('btn-detect').addEventListener('click', detectLocation);

  // Tab Logic
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Task UI Logic
  const taskType = document.getElementById('taskType');
  const taskValInt = document.getElementById('taskValueInterval');
  const taskValTime = document.getElementById('taskValueTime');
  const taskValLabel = document.getElementById('taskValueLabel');

  taskType.addEventListener('change', () => {
    if (taskType.value === 'interval') {
      taskValInt.style.display = 'block';
      taskValTime.style.display = 'none';
      taskValLabel.textContent = 'Minutes';
    } else {
      taskValInt.style.display = 'none';
      taskValTime.style.display = 'block';
      taskValLabel.textContent = 'Time';
    }
  });

  document.getElementById('btn-add-task').addEventListener('click', addTask);
});

async function loadSettings() {
  const data = await chrome.storage.local.get('settings');
  const s    = data.settings || {};

  if (s.city)              document.getElementById('city').value         = s.city;
  if (s.country)           document.getElementById('country').value      = s.country;
  if (s.method)            document.getElementById('method').value       = s.method;
  if (s.school != null)    document.getElementById('school').value       = s.school;
  if (s.notifyBefore)      document.getElementById('notifyBefore').value = s.notifyBefore;

  if (s.theme) {
    const el = document.querySelector(`input[name="theme"][value="${s.theme}"]`);
    if (el) el.checked = true;
  }
  if (s.layout) {
    const el = document.querySelector(`input[name="layout"][value="${s.layout}"]`);
    if (el) el.checked = true;
  }

  // Restore toggle states (default both to true if not yet set)
  document.getElementById('toggle-block').checked = s.blockEnabled !== false;
  document.getElementById('toggle-warn').checked  = s.warnEnabled  !== false;

  renderTasks(s.tasks || []);
}

async function loadPreview() {
  const data   = await chrome.storage.local.get('prayerTimes');
  const times  = data.prayerTimes || {};
  const preview = document.getElementById('prayer-preview');

  if (!Object.keys(times).length) return;

  preview.innerHTML = ORDER
    .filter(n => times[n])
    .map(name => {
      const [h, m] = times[name].split(':').map(Number);
      const ampm   = h >= 12 ? 'PM' : 'AM';
      const hh     = h % 12 || 12;
      const time   = `${hh}:${String(m).padStart(2,'0')} ${ampm}`;
      return `
        <div class="preview-row">
          <span>${name} · ${ARABIC[name]}</span>
          <span>${time}</span>
        </div>`;
    }).join('');
}

async function saveSettings() {
  const btn = document.getElementById('btn-save');
  btn.textContent = 'Saving...';
  btn.disabled = true;

  const settings = {
    city:          document.getElementById('city').value.trim(),
    country:       document.getElementById('country').value.trim(),
    method:        parseInt(document.getElementById('method').value),
    school:        parseInt(document.getElementById('school').value),
    theme:         document.querySelector('input[name="theme"]:checked').value,
    layout:        document.querySelector('input[name="layout"]:checked').value,
    notifyBefore:  parseInt(document.getElementById('notifyBefore').value) || 5,
    blockEnabled:  document.getElementById('toggle-block').checked,
    warnEnabled:   document.getElementById('toggle-warn').checked,
    tasks:         (await chrome.storage.local.get('settings')).settings?.tasks || []
  };

  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, async () => {
    await loadPreview();
    showToast();
    btn.textContent = 'Save & Apply';
    btn.disabled = false;
  });
}

async function detectLocation() {
  const btn = document.getElementById('btn-detect');
  btn.textContent = '⏳ Detecting…';
  btn.disabled = true;

  try {
    // Use IP-based location (no browser permissions needed in extension options page)
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
    document.getElementById('city').value      = geo.city || '';
    document.getElementById('country').value   = geo.country_name || '';
    btn.textContent = 'Location detected!';
    setTimeout(() => { btn.textContent = 'Auto-detect my location'; btn.disabled = false; }, 2000);
  } catch (_) {
    btn.textContent = 'Detection failed';
    setTimeout(() => { btn.textContent = 'Auto-detect my location'; btn.disabled = false; }, 2000);
  }
}

function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Tasks Logic ──
async function addTask() {
  const name = document.getElementById('taskName').value.trim();
  const type = document.getElementById('taskType').value;
  let value;

  if (!name) return alert('Please enter a task name.');
  
  if (type === 'interval') {
    value = parseInt(document.getElementById('taskValueInterval').value);
    if (!value || value < 1) return alert('Please enter a valid interval in minutes.');
  } else {
    value = document.getElementById('taskValueTime').value;
    if (!value) return alert('Please select a time.');
  }

  const data = await chrome.storage.local.get('settings');
  const settings = data.settings || {};
  if (!settings.tasks) settings.tasks = [];

  const newTask = {
    id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 5),
    name,
    type,
    value
  };

  settings.tasks.push(newTask);

  await chrome.storage.local.set({ settings });
  
  // Clear inputs
  document.getElementById('taskName').value = '';
  document.getElementById('taskValueInterval').value = '30';
  document.getElementById('taskValueTime').value = '';

  renderTasks(settings.tasks);
  
  // Tell background to update alarms
  chrome.runtime.sendMessage({ type: 'UPDATE_TASKS', settings });
}

function renderTasks(tasks) {
  const list = document.getElementById('tasks-list');
  const msg = document.getElementById('no-tasks-msg');
  
  if (!tasks || tasks.length === 0) {
    list.innerHTML = '';
    list.appendChild(msg);
    msg.style.display = 'block';
    return;
  }
  
  msg.style.display = 'none';
  list.innerHTML = '';
  
  tasks.forEach(t => {
    const el = document.createElement('div');
    el.className = 'preview-row';
    el.style.alignItems = 'center';
    
    let timeStr = t.type === 'interval' ? `Every ${t.value} min` : `At ${t.value}`;
    
    el.innerHTML = `
      <span>${t.name}</span>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:0.75rem; color:rgba(26,61,43,0.6); font-weight:normal; margin-right:4px;">${timeStr}</span>
        <button class="btn-test-task" data-id="${t.id}" data-name="${t.name}" style="background:rgba(26,61,43,0.1); border:1px solid rgba(26,61,43,0.2); border-radius:6px; color:#1A3D2B; cursor:pointer; font-size:0.7rem; padding:4px 8px; font-weight:600;" title="Test this reminder">Test</button>
        <button class="btn-delete-task" data-id="${t.id}" style="background:none; border:none; color:#D34545; cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Delete">&times;</button>
      </div>
    `;
    list.appendChild(el);
  });
  
  document.querySelectorAll('.btn-test-task').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const name = e.target.dataset.name;
      chrome.runtime.sendMessage({ type: 'TEST_TASK', taskName: name });
    });
  });

  document.querySelectorAll('.btn-delete-task').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const data = await chrome.storage.local.get('settings');
      if (!data.settings || !data.settings.tasks) return;
      
      data.settings.tasks = data.settings.tasks.filter(t => t.id !== id);
      await chrome.storage.local.set({ settings: data.settings });
      
      renderTasks(data.settings.tasks);
      chrome.runtime.sendMessage({ type: 'UPDATE_TASKS', settings: data.settings });
    });
  });
}
