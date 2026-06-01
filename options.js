// ─── Options Script ───────────────────────────────────────────────────────────

const ARABIC = { Fajr:'الفجر', Dhuhr:'الظهر', Asr:'العصر', Maghrib:'المغرب', Isha:'العشاء' };
const ORDER  = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const TRANSLATIONS = {
  en: {
    pageTitle: "Salah Time Settings",
    tabLocation: "Location",
    tabCalculation: "Calculation",
    tabAppearance: "Appearance",
    tabNotifications: "Notifications",
    tabTasks: "Tasks",
    cardLocation: "Location",
    labelCity: "City",
    labelCountry: "Country",
    btnDetect: "Auto-detect my location",
    cardCalculation: "Calculation Method",
    labelMethod: "Method",
    labelSchool: "Asr Juristic Method",
    cardAppearance: "Appearance",
    labelTheme: "Color Theme",
    labelLayout: "Popup Layout",
    labelLanguage: "Language",
    cardNotifications: "Notifications & Blocking",
    labelWarn: "Warn before prayer",
    subWarn: "Show a reminder N minutes before each prayer",
    labelWarningTime: "Warning time (minutes before prayer)",
    labelBlock: "Block screen at prayer time",
    subBlock: "Covers all tabs with the prayer overlay",
    cardCustomTasks: "Custom Task Reminders",
    labelTaskName: "Task Name",
    labelTaskType: "Reminder Type",
    optInterval: "Every X Minutes",
    optTime: "Specific Time",
    labelMinutes: "Minutes",
    labelTime: "Time",
    btnAddReminder: "+ Add Reminder",
    cardActiveReminders: "Active Reminders",
    msgNoReminders: "No reminders set",
    cardPreview: "Today's Prayer Times Preview",
    msgSaveToLoad: "Save settings to load today's times",
    btnCancel: "Cancel",
    btnSave: "Save & Apply",
    toastSaved: "Settings saved! Prayer times updated.",
    layoutList: "List",
    layoutVertical: "Vertical",
    layoutHorizontal: "Horizontal",
    placeholderCity: "e.g. Cairo, London, New York…",
    placeholderCountry: "e.g. Egypt, UK, USA…",
    placeholderTaskName: "e.g. Drink water, Jump rope…",
    btnDetecting: "⏳ Detecting…",
    btnDetected: "Location detected!",
    btnDetectFailed: "Detection failed",
    btnSaving: "Saving...",
    testBtn: "Test"
  },
  ar: {
    pageTitle: "إعدادات أوقات الصلاة",
    tabLocation: "الموقع",
    tabCalculation: "الحساب",
    tabAppearance: "المظهر",
    tabNotifications: "الإشعارات",
    tabTasks: "المهام",
    cardLocation: "الموقع",
    labelCity: "المدينة",
    labelCountry: "البلد",
    btnDetect: "تحديد موقعي تلقائياً",
    cardCalculation: "طريقة الحساب",
    labelMethod: "الطريقة",
    labelSchool: "المذهب الفقهي لصلاة العصر",
    cardAppearance: "المظهر",
    labelTheme: "مظهر الألوان",
    labelLayout: "تخطيط النافذة المنبثقة",
    labelLanguage: "اللغة",
    cardNotifications: "الإشعارات والحظر",
    labelWarn: "تنبيه قبل الصلاة",
    subWarn: "عرض تذكير قبل N دقيقة من كل صلاة",
    labelWarningTime: "وقت التنبيه (دقائق قبل الصلاة)",
    labelBlock: "حظر الشاشة في وقت الصلاة",
    subBlock: "يغطي جميع علامات التبويب بشاشة الصلاة",
    cardCustomTasks: "تذكيرات المهام المخصصة",
    labelTaskName: "اسم المهمة",
    labelTaskType: "نوع التذكير",
    optInterval: "كل X دقيقة",
    optTime: "وقت محدد",
    labelMinutes: "دقائق",
    labelTime: "وقت",
    btnAddReminder: "+ إضافة تذكير",
    cardActiveReminders: "التذكيرات النشطة",
    msgNoReminders: "لا توجد تذكيرات",
    cardPreview: "معاينة أوقات الصلاة لليوم",
    msgSaveToLoad: "احفظ الإعدادات لتحميل أوقات اليوم",
    btnCancel: "إلغاء",
    btnSave: "حفظ وتطبيق",
    toastSaved: "تم حفظ الإعدادات! تم تحديث أوقات الصلاة.",
    layoutList: "قائمة",
    layoutVertical: "عمودي",
    layoutHorizontal: "أفقي",
    placeholderCity: "مثل القاهرة، لندن، نيويورك...",
    placeholderCountry: "مثل مصر، بريطانيا، أمريكا...",
    placeholderTaskName: "مثل شرب الماء، قفز الحبل...",
    btnDetecting: "⏳ جاري التحديد...",
    btnDetected: "تم تحديد الموقع!",
    btnDetectFailed: "فشل التحديد",
    btnSaving: "جاري الحفظ...",
    testBtn: "تجربة"
  },
  fr: {
    pageTitle: "Paramètres des Heures de Prière",
    tabLocation: "Emplacement",
    tabCalculation: "Calcul",
    tabAppearance: "Apparence",
    tabNotifications: "Notifications",
    tabTasks: "Tâches",
    cardLocation: "Emplacement",
    labelCity: "Ville",
    labelCountry: "Pays",
    btnDetect: "Détecter ma position automatiquement",
    cardCalculation: "Méthode de Calcul",
    labelMethod: "Méthode",
    labelSchool: "Méthode Juridique (Asr)",
    cardAppearance: "Apparence",
    labelTheme: "Thème de Couleur",
    labelLayout: "Disposition du Popup",
    labelLanguage: "Langue",
    cardNotifications: "Notifications et Blocage",
    labelWarn: "Avertir avant la prière",
    subWarn: "Afficher un rappel N minutes avant chaque prière",
    labelWarningTime: "Temps d'avertissement (minutes avant)",
    labelBlock: "Bloquer l'écran à l'heure de la prière",
    subBlock: "Couvre tous les onglets avec l'écran de prière",
    cardCustomTasks: "Rappels de Tâches Personnalisés",
    labelTaskName: "Nom de la Tâche",
    labelTaskType: "Type de Rappel",
    optInterval: "Toutes les X Minutes",
    optTime: "Heure Spécifique",
    labelMinutes: "Minutes",
    labelTime: "Temps",
    btnAddReminder: "+ Ajouter un Rappel",
    cardActiveReminders: "Rappels Actifs",
    msgNoReminders: "Aucun rappel défini",
    cardPreview: "Aperçu des Heures de Prière d'Aujourd'hui",
    msgSaveToLoad: "Enregistrez pour charger les heures du jour",
    btnCancel: "Annuler",
    btnSave: "Enregistrer et Appliquer",
    toastSaved: "Paramètres enregistrés ! Heures mises à jour.",
    layoutList: "Liste",
    layoutVertical: "Vertical",
    layoutHorizontal: "Horizontal",
    placeholderCity: "ex. Le Caire, Londres, Paris...",
    placeholderCountry: "ex. Égypte, Royaume-Uni, France...",
    placeholderTaskName: "ex. Boire de l'eau, Faire de l'exercice...",
    btnDetecting: "⏳ Détection...",
    btnDetected: "Position détectée !",
    btnDetectFailed: "Échec de la détection",
    btnSaving: "Enregistrement...",
    testBtn: "Tester"
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
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });

  const taskType = document.getElementById('taskType');
  const taskValLabel = document.getElementById('taskValueLabel');
  if (taskType && taskValLabel) {
    if (taskType.value === 'interval') {
      taskValLabel.textContent = t.labelMinutes || 'Minutes';
    } else {
      taskValLabel.textContent = t.labelTime || 'Time';
    }
  }
  
  // Update test buttons
  document.querySelectorAll('.btn-test-task').forEach(btn => {
    btn.textContent = t.testBtn || 'Test';
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPreview();

  document.getElementById('btn-save').addEventListener('click', saveSettings);
  document.getElementById('btn-cancel').addEventListener('click', () => window.close());
  document.getElementById('btn-detect').addEventListener('click', detectLocation);

  document.getElementById('language').addEventListener('change', (e) => {
    currentLang = e.target.value;
    applyTranslations(currentLang);
  });

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
      taskValLabel.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].labelMinutes) ? TRANSLATIONS[currentLang].labelMinutes : 'Minutes';
    } else {
      taskValInt.style.display = 'none';
      taskValTime.style.display = 'block';
      taskValLabel.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].labelTime) ? TRANSLATIONS[currentLang].labelTime : 'Time';
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

  if (s.language) {
    document.getElementById('language').value = s.language;
    currentLang = s.language;
  }
  applyTranslations(currentLang);

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
  btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnSaving) ? TRANSLATIONS[currentLang].btnSaving : 'Saving...';
  btn.disabled = true;

  const settings = {
    city:          document.getElementById('city').value.trim(),
    country:       document.getElementById('country').value.trim(),
    method:        parseInt(document.getElementById('method').value),
    school:        parseInt(document.getElementById('school').value),
    theme:         document.querySelector('input[name="theme"]:checked').value,
    layout:        document.querySelector('input[name="layout"]:checked').value,
    language:      document.getElementById('language').value,
    notifyBefore:  parseInt(document.getElementById('notifyBefore').value) || 5,
    blockEnabled:  document.getElementById('toggle-block').checked,
    warnEnabled:   document.getElementById('toggle-warn').checked,
    tasks:         (await chrome.storage.local.get('settings')).settings?.tasks || []
  };

  chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, async () => {
    await loadPreview();
    showToast();
    btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnSave) ? TRANSLATIONS[currentLang].btnSave : 'Save & Apply';
    btn.disabled = false;
  });
}

async function detectLocation() {
  const btn = document.getElementById('btn-detect');
  btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnDetecting) ? TRANSLATIONS[currentLang].btnDetecting : '⏳ Detecting…';
  btn.disabled = true;

  try {
    // Use IP-based location (no browser permissions needed in extension options page)
    const geo = await fetch('https://ipapi.co/json/').then(r => r.json());
    document.getElementById('city').value      = geo.city || '';
    document.getElementById('country').value   = geo.country_name || '';
    btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnDetected) ? TRANSLATIONS[currentLang].btnDetected : 'Location detected!';
    setTimeout(() => { btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnDetect) ? TRANSLATIONS[currentLang].btnDetect : 'Auto-detect my location'; btn.disabled = false; }, 2000);
  } catch (_) {
    btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnDetectFailed) ? TRANSLATIONS[currentLang].btnDetectFailed : 'Detection failed';
    setTimeout(() => { btn.textContent = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].btnDetect) ? TRANSLATIONS[currentLang].btnDetect : 'Auto-detect my location'; btn.disabled = false; }, 2000);
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
    
    let timeStr = t.type === 'interval' 
      ? (currentLang === 'ar' ? `كل ${t.value} دقيقة` : currentLang === 'fr' ? `Toutes les ${t.value} min` : `Every ${t.value} min`)
      : (currentLang === 'ar' ? `في ${t.value}` : currentLang === 'fr' ? `À ${t.value}` : `At ${t.value}`);
    
    el.innerHTML = `
      <span>${t.name}</span>
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:0.75rem; color:rgba(26,61,43,0.6); font-weight:normal; margin-right:4px;">${timeStr}</span>
        <button class="btn-test-task" data-id="${t.id}" data-name="${t.name}" style="background:rgba(26,61,43,0.1); border:1px solid rgba(26,61,43,0.2); border-radius:6px; color:#1A3D2B; cursor:pointer; font-size:0.7rem; padding:4px 8px; font-weight:600;" title="Test this reminder">${(TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].testBtn) ? TRANSLATIONS[currentLang].testBtn : 'Test'}</button>
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
