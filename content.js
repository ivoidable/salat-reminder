// ─── Prayer Blocker – Content Script ─────────────────────────────────────────
// Injects the full-screen Islamic overlay whenever prayer time begins.

(function () {
  'use strict';

  let overlay = null;
  let timerInterval = null;
  let btnUnlockInterval = null;
  const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  // ── Listen for messages from background ──────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_BLOCK') showOverlay(msg.prayer, 'prayer');
    if (msg.type === 'SHOW_TASK_BLOCK') showOverlay(msg.taskName, 'task');
    if (msg.type === 'SHOW_WARNING') showWarning(msg.prayer);
    if (msg.type === 'HIDE_BLOCK') removeOverlay();
  });

  // ── On page load: check if we're already in blocked state ───────────────────
  chrome.runtime.sendMessage({ type: 'IS_BLOCKED' }, (resp) => {
    if (chrome.runtime.lastError) return;
    if (resp && resp.blocked) {
      chrome.storage.local.get(['currentPrayer', 'currentTask'], (d) => {
        if (d.currentPrayer) showOverlay(d.currentPrayer, 'prayer');
        else if (d.currentTask) showOverlay(d.currentTask, 'task');
      });
    }
  });


  const TRANSLATIONS = {
    en: {
      prayerTime: (p) => `${p} Prayer Time`,
      ayah: "Indeed, prayer has been decreed upon the believers a decree of specified times.",
      quranRef: "— Quran 4:103",
      currentTime: "Current Time",
      elapsed: "Elapsed",
      step1: "Make Wudu (Ablution)",
      step2: "Face the Qiblah",
      step3: "Perform Your Prayer",
      btnPrayed: "I Have Prayed &ndash; Resume Work",
      btnPrayedDone: "جزاك الله خيراً · Jazākallāhu Khayran",
      hadith: '"The five daily prayers expiate what is between them."',
      hadithRef: "— Sahih Muslim 233",
      taskReminder: "Task Reminder",
      btnTaskDone: "I Have Finished &ndash; Resume Work",
      btnTaskCompleted: "Task Completed!",
      warnTitle: "Prayer Reminder",
      warnMsg: (p) => `<strong>${p}</strong> prayer is in 5 minutes.`,
      warnSub: "Prepare yourself for prayer – Allahu Akbar.",
      btnDismiss: "Dismiss"
    },
    ar: {
      prayerTime: (p) => `حان الآن موعد صلاة ${p}`,
      ayah: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
      quranRef: "— سورة النساء: 103",
      currentTime: "الوقت الحالي",
      elapsed: "الوقت المنقضي",
      step1: "توضأ",
      step2: "استقبل القبلة",
      step3: "أقم صلاتك",
      btnPrayed: "لقد صليت – متابعة العمل",
      btnPrayedDone: "جزاك الله خيراً",
      hadith: '"الصلوات الخمس كفارة لما بينهن"',
      hadithRef: "— صحيح مسلم ٢٣٣",
      taskReminder: "تذكير بمهمة",
      btnTaskDone: "لقد انتهيت – متابعة العمل",
      btnTaskCompleted: "اكتملت المهمة!",
      warnTitle: "تذكير بالصلاة",
      warnMsg: (p) => `بقي 5 دقائق على صلاة <strong>${p}</strong>.`,
      warnSub: "تجهز للصلاة – الله أكبر.",
      btnDismiss: "إخفاء"
    },
    fr: {
      prayerTime: (p) => `Heure de la prière de ${p}`,
      ayah: "La prière est une obligation pour les croyants et doit avoir lieu à des heures déterminées.",
      quranRef: "— Coran 4:103",
      currentTime: "Heure Actuelle",
      elapsed: "Écoulé",
      step1: "Faites les Ablutions (Wudu)",
      step2: "Faites face à la Qiblah",
      step3: "Accomplissez votre prière",
      btnPrayed: "J'ai prié &ndash; Reprendre le travail",
      btnPrayedDone: "Qu'Allah vous récompense en bien",
      hadith: '"Les cinq prières quotidiennes expient les péchés commis entre elles."',
      hadithRef: "— Sahih Muslim 233",
      taskReminder: "Rappel de Tâche",
      btnTaskDone: "J'ai terminé &ndash; Reprendre le travail",
      btnTaskCompleted: "Tâche Terminée !",
      warnTitle: "Rappel de Prière",
      warnMsg: (p) => `La prière de <strong>${p}</strong> est dans 5 minutes.`,
      warnSub: "Préparez-vous pour la prière – Allahu Akbar.",
      btnDismiss: "Fermer"
    }
  };

  // ── Build & inject overlay ───────────────────────────────────────────────────
  let overlayType = 'prayer';

  function showOverlay(title, type = 'prayer') {
    if (overlay) return;
    overlayType = type;

    // Prevent scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    overlay = document.createElement('div');
    overlay.id = '__prayer_blocker_overlay__';

    // Read current theme
    chrome.storage.local.get(['settings'], (res) => {
      const theme = res.settings?.theme || 'sage';
      const lang = res.settings?.language || 'en';
      overlay.className = `theme-${theme} lang-${lang}`;
      overlay.innerHTML = type === 'prayer' ? buildHTML(title, lang) : buildTaskHTML(title, lang);
      applyStyles(overlay);
      document.documentElement.appendChild(overlay);

      // Prevent clicks from reaching underlying page (but let button be clicked)
      overlay.addEventListener('click', (e) => e.stopPropagation());
      overlay.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') e.stopPropagation();
      });

      // Animate in
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
      });

      // Live elapsed timer
      const startTime = Date.now();
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const ss = String(elapsed % 60).padStart(2, '0');
        const el = overlay.querySelector('#pb-timer');
        if (el) el.textContent = `${mm}:${ss}`;
      }, 1000);

      // 15-minute lock on the "I Have Prayed" button (prayer type only)
      const prayedBtn = overlay.querySelector('#pb-prayed-btn');
      if (type === 'prayer') {
        prayedBtn.disabled = true;
        prayedBtn.style.opacity = '0.6';
        prayedBtn.style.cursor = 'not-allowed';

        if (btnUnlockInterval) clearInterval(btnUnlockInterval);
        btnUnlockInterval = setInterval(() => {
          const remaining = LOCK_DURATION_MS - (Date.now() - startTime);
          if (remaining <= 0) {
            clearInterval(btnUnlockInterval);
            btnUnlockInterval = null;
            if (prayedBtn) {
              prayedBtn.disabled = false;
              prayedBtn.style.opacity = '';
              prayedBtn.style.cursor = '';
              // Restore original label
              chrome.storage.local.get(['settings'], (res) => {
                const lang = res.settings?.language || 'en';
                const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
                prayedBtn.innerHTML = t.btnPrayed;
              });
            }
          } else {
            const rm = Math.floor(remaining / 1000);
            const rmm = String(Math.floor(rm / 60)).padStart(2, '0');
            const rss = String(rm % 60).padStart(2, '0');
            prayedBtn.textContent = `Wait ${rmm}:${rss}`;
          }
        }, 1000);
      }

      // Attach "I have prayed" button
      prayedBtn.addEventListener('click', handlePrayed);
    });
  }

  function removeOverlay() {
    if (!overlay) return;
    clearInterval(timerInterval);
    timerInterval = null;
    if (btnUnlockInterval) { clearInterval(btnUnlockInterval); btnUnlockInterval = null; }

    overlay.style.opacity = '0';
    setTimeout(() => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      overlay = null;
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }, 600);
  }

  function handlePrayed() {
    chrome.storage.local.get(['settings'], (res) => {
      const lang = res.settings?.language || 'en';
      const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
      const btn = overlay.querySelector('#pb-prayed-btn');
      if (btn) {
        btn.textContent = overlayType === 'prayer' ? t.btnPrayedDone : t.btnTaskCompleted;
      btn.style.background = 'var(--btn-primary-bg)';
      btn.disabled = true;
      }
      setTimeout(() => {
        chrome.runtime.sendMessage({ type: overlayType === 'prayer' ? 'PRAYED' : 'TASK_DONE' });
        removeOverlay();
      }, 1400);
    });
  }

  let warningOverlay = null;

  function showWarning(prayer) {
    if (warningOverlay) return;
    
    warningOverlay = document.createElement('div');
    warningOverlay.id = '__prayer_blocker_warning__';
    
    chrome.storage.local.get(['settings'], (res) => {
      const theme = res.settings?.theme || 'sage';
      const lang = res.settings?.language || 'en';
      const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
      const arabicName = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' }[prayer] || prayer;
      const pName = lang === 'ar' ? arabicName : prayer;
      
      warningOverlay.className = `theme-${theme} lang-${lang}`;
      
      warningOverlay.innerHTML = `
        <div class="pb-warn-bg" style="direction: ${lang === 'ar' ? 'rtl' : 'ltr'}">
          <div class="pb-warn-card">
            <h2 class="pb-warn-title">${t.warnTitle}</h2>
            <p class="pb-warn-text">${t.warnMsg(pName)}</p>
            <p class="pb-warn-subtext">${t.warnSub}</p>
            <button class="pb-warn-btn">${t.btnDismiss}</button>
          </div>
        </div>
      `;
      
      applyStyles(warningOverlay);
      document.documentElement.appendChild(warningOverlay);
      
      requestAnimationFrame(() => {
        warningOverlay.style.opacity = '1';
      });
      
      warningOverlay.querySelector('.pb-warn-btn').addEventListener('click', () => {
        warningOverlay.style.opacity = '0';
        setTimeout(() => {
          if (warningOverlay && warningOverlay.parentNode) warningOverlay.parentNode.removeChild(warningOverlay);
          warningOverlay = null;
        }, 500);
      });
    });
  }

  // ── HTML template ────────────────────────────────────────────────────────────
  function buildTaskHTML(taskName, lang = 'en') {
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div id="pb-task-bg">
        <div id="pb-card">
          <h1 id="pb-title" style="direction: ${lang === 'ar' ? 'rtl' : 'ltr'}; font-size: 2.2rem; margin-bottom: 12px;">${t.taskReminder}</h1>
          <h2 id="pb-subtitle" style="font-size: 1.4rem; color: var(--text-main); font-weight: 600; text-transform: none; letter-spacing: normal;">${taskName}</h2>
          
          <div id="pb-divider"></div>

          <div id="pb-time-row">
            <div class="pb-time-box">
              <span class="pb-time-label">${t.currentTime}</span>
              <span class="pb-time-val" id="pb-clock">${timeStr}</span>
            </div>
            <div class="pb-time-box">
              <span class="pb-time-label">${t.elapsed}</span>
              <span class="pb-time-val" id="pb-timer">00:00</span>
            </div>
          </div>

          <button id="pb-prayed-btn">
            ${t.btnTaskDone}
          </button>
        </div>
      </div>
    `;
  }
  function buildHTML(prayer, lang = 'en') {
    const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
    const arabic = {
      Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء'
    };
    const arabicName = arabic[prayer] || prayer;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <div id="pb-bg">
        <!-- Geometric SVG pattern -->
        <svg id="pb-geo" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          ${generateGeometry()}
        </svg>

        <!-- Stars shimmer -->
        <div id="pb-stars"></div>

        <div id="pb-card">
          <!-- Crescent + Star -->
          <div id="pb-emblem">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="90" height="90">
              <defs>
                <radialGradient id="moonGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="var(--star-color)"/>
                  <stop offset="100%" stop-color="var(--moon-dark)"/>
                </radialGradient>
              </defs>
              <!-- Crescent -->
              <circle cx="50" cy="50" r="38" fill="url(#moonGrad)"/>
              <circle cx="68" cy="40" r="30" fill="var(--moon-cover)"/>
              <!-- Star -->
              <polygon points="82,22 84,28 90,28 85,32 87,38 82,34 77,38 79,32 74,28 80,28"
                       fill="var(--star-color)"/>
            </svg>
          </div>

          <h1 id="pb-title">صلاة ${arabicName}</h1>
          <h2 id="pb-subtitle">${t.prayerTime(prayer)}</h2>

          <div id="pb-divider"></div>

          <p id="pb-ayah">
            ﴿ إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا ﴾
          </p>
          <p id="pb-ayah-trans">
            "${t.ayah}"
            <span id="pb-ref">${t.quranRef}</span>
          </p>

          <div id="pb-time-row">
            <div class="pb-time-box">
              <span class="pb-time-label">${t.currentTime}</span>
              <span class="pb-time-val" id="pb-clock">${timeStr}</span>
            </div>
            <div class="pb-time-box">
              <span class="pb-time-label">${t.elapsed}</span>
              <span class="pb-time-val" id="pb-timer">00:00</span>
            </div>
          </div>

          <div id="pb-steps">
            <div class="pb-step">${t.step1}</div>
            <div class="pb-step">${t.step2}</div>
            <div class="pb-step">${t.step3}</div>
          </div>

          <button id="pb-prayed-btn">
            ${t.btnPrayed}
          </button>

          <p id="pb-hadith">
            ${t.hadith}
            <br><em>${t.hadithRef}</em>
          </p>
        </div>
      </div>
    `;
  }

  function generateGeometry() {
    // Build a repeating Islamic star-polygon pattern
    let paths = '';
    const cols = 8, rows = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * 110 + (r % 2 === 0 ? 0 : 55);
        const cy = r * 95;
        paths += starPolygon(cx, cy, 40, 12, 0.45);
      }
    }
    return paths;
  }

  function starPolygon(cx, cy, r, points, innerRatio) {
    const inner = r * innerRatio;
    let d = '';
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? r : inner;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      d += (i === 0 ? 'M' : 'L') + `${x.toFixed(2)},${y.toFixed(2)}`;
    }
    d += 'Z';
    return `<path class="pb-geo-path" d="${d}" fill="none" stroke-width="0.8"/>`;
  }

  // ── Styles injected inline (no external CSS needed) ──────────────────────────
  function applyStyles(el) {
    const FONT = "'Inter', 'Segoe UI', 'Amiri', 'Noto Naskh Arabic', serif";

    const css = `
      #__prayer_blocker_overlay__, #__prayer_blocker_warning__ {
        --bg-gradient: radial-gradient(ellipse at 30% 20%, #5a8a6a 0%, #7D9E87 50%, #6b9278 100%);
        --text-main: #2D2D2D;
        --text-muted: rgba(26,61,43,0.55);
        --text-muted-alt: rgba(26,61,43,0.65);
        --accent-color: #C9A03C;
        --card-bg: linear-gradient(145deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.78) 100%);
        --card-border: rgba(26,61,43,0.18);
        --btn-primary-bg: linear-gradient(135deg, #1A3D2B 0%, #2d6a4f 50%, #1A3D2B 100%);
        --btn-primary-hover-shadow: rgba(26,61,43,0.35);
        --box-bg: rgba(255,255,255,0.6);
        --box-bg-hover: rgba(255,255,255,0.8);
        --star-color: #f9d423;
        --moon-dark: #c8860a;
        --moon-cover: #7D9E87;
        --geo-stroke: rgba(26,61,43,0.18);
        --emblem-glow: rgba(201,160,60,0.6);
        --text-shadow: rgba(26,61,43,0.2);

        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        opacity: 0;
        transition: opacity 0.5s ease;
        font-family: \${FONT};
        pointer-events: all !important;
      }
      #__prayer_blocker_overlay__.theme-night, #__prayer_blocker_warning__.theme-night {
        --bg-gradient: radial-gradient(ellipse at 30% 20%, #1A2430 0%, #131A22 50%, #0d1218 100%);
        --text-main: #E6E6E6;
        --text-muted: rgba(255,255,255,0.5);
        --text-muted-alt: rgba(255,255,255,0.6);
        --accent-color: #D34545;
        --card-bg: linear-gradient(145deg, rgba(30,40,55,0.88) 0%, rgba(20,28,40,0.78) 100%);
        --card-border: rgba(255,255,255,0.1);
        --btn-primary-bg: linear-gradient(135deg, #1A2430 0%, #243040 50%, #1A2430 100%);
        --btn-primary-hover-shadow: rgba(0,0,0,0.5);
        --box-bg: rgba(255,255,255,0.05);
        --box-bg-hover: rgba(255,255,255,0.1);
        --star-color: #E6E6E6;
        --moon-dark: #0d1218;
        --moon-cover: #131A22;
        --geo-stroke: rgba(255,255,255,0.05);
        --emblem-glow: rgba(211,69,69,0.4);
        --text-shadow: rgba(0,0,0,0.5);
      }
      #__prayer_blocker_overlay__.theme-desert, #__prayer_blocker_warning__.theme-desert {
        --bg-gradient: radial-gradient(ellipse at 30% 20%, #F8F0E5 0%, #EADBC8 50%, #DAC0A3 100%);
        --text-main: #4A3A2A;
        --text-muted: rgba(74,58,42,0.55);
        --text-muted-alt: rgba(74,58,42,0.65);
        --accent-color: #B28350;
        --card-bg: linear-gradient(145deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 100%);
        --card-border: rgba(74,58,42,0.15);
        --btn-primary-bg: linear-gradient(135deg, #A8815C 0%, #8C6A48 50%, #A8815C 100%);
        --btn-primary-hover-shadow: rgba(140,106,72,0.35);
        --box-bg: rgba(255,255,255,0.5);
        --box-bg-hover: rgba(255,255,255,0.8);
        --star-color: #B28350;
        --moon-dark: #8C6A48;
        --moon-cover: #EADBC8;
        --geo-stroke: rgba(74,58,42,0.1);
        --emblem-glow: rgba(178,131,80,0.4);
        --text-shadow: rgba(74,58,42,0.15);
      }

      #pb-bg {
        width: 100%;
        height: 100%;
        background: var(--bg-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      #pb-task-bg {
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .pb-warn-bg {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
      }
      .pb-warn-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        padding: 32px 44px;
        text-align: center;
        box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        max-width: 420px;
        width: 90%;
        animation: floatCard 6s ease-in-out infinite;
      }
      .pb-warn-title {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-main);
        margin: 0 0 12px;
      }
      .pb-warn-text {
        font-size: 1.15rem;
        color: var(--text-main);
        margin: 0 0 8px;
      }
      .pb-warn-subtext {
        font-size: 0.95rem;
        color: var(--text-muted);
        margin: 0 0 28px;
        font-style: italic;
      }
      .pb-warn-btn {
        display: inline-block;
        padding: 14px 32px;
        background: var(--btn-primary-bg);
        color: #fff;
        border: none;
        border-radius: 12px;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }
      .pb-warn-btn:hover {
        box-shadow: 0 6px 20px var(--btn-primary-hover-shadow);
        transform: translateY(-2px);
      }
      #pb-geo {
        position: absolute;
        inset: -5%;
        width: 110%;
        height: 110%;
        opacity: 1;
        pointer-events: none;
      }
      .pb-geo-path {
        stroke: var(--geo-stroke);
      }
      #pb-stars {
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.7) 0%, transparent 100%),
          radial-gradient(1px 1px at 70% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1.5px 1.5px at 40% 70%, rgba(255,255,255,0.6) 0%, transparent 100%),
          radial-gradient(1px 1px at 85% 50%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 5%  80%, rgba(255,255,255,0.5) 0%, transparent 100%),
          radial-gradient(1px 1px at 55% 35%, rgba(255,255,255,0.3) 0%, transparent 100%),
          radial-gradient(1px 1px at 92% 88%, rgba(255,255,255,0.4) 0%, transparent 100%),
          radial-gradient(1px 1px at 25% 55%, rgba(255,255,255,0.3) 0%, transparent 100%);
        animation: twinkle 4s ease-in-out infinite alternate;
        pointer-events: none;
      }
      @keyframes twinkle {
        from { opacity: 0.6; }
        to   { opacity: 1; }
      }
      #pb-card {
        background: var(--card-bg);
        backdrop-filter: blur(24px);
        -webkit-backdrop-filter: blur(24px);
        border: 1px solid var(--card-border);
        border-radius: 24px;
        padding: 44px 52px 36px;
        max-width: 600px;
        width: 90%;
        text-align: center;
        box-shadow:
          0 0 60px rgba(0,0,0,0.1),
          0 30px 60px rgba(0,0,0,0.15),
          inset 0 1px 0 rgba(255,255,255,0.3);
        animation: floatCard 6s ease-in-out infinite;
        position: relative;
        z-index: 2;
      }
      @keyframes floatCard {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-8px); }
      }
      #pb-emblem {
        margin: 0 auto 16px;
        filter: drop-shadow(0 0 18px var(--emblem-glow));
        animation: glow 3s ease-in-out infinite alternate;
      }
      @keyframes glow {
        from { filter: drop-shadow(0 0 12px var(--emblem-glow)); }
        to   { filter: drop-shadow(0 0 28px var(--accent-color)); }
      }
      #pb-title {
        font-size: 2.6rem;
        font-weight: 700;
        color: var(--text-main);
        margin: 0 0 6px;
        text-shadow: 0 0 30px var(--text-shadow);
        letter-spacing: 0.05em;
      }
      .lang-ar #pb-title { direction: rtl; }
      .lang-ar #pb-subtitle, .lang-ar #pb-steps { direction: rtl; }
      
      #pb-subtitle {
        font-size: 1.1rem;
        color: var(--text-muted-alt);
        margin: 0 0 20px;
        font-weight: 400;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }
      #pb-divider {
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, transparent, var(--text-main), transparent);
        margin: 0 auto 22px;
      }
      #pb-ayah {
        font-size: 1.3rem;
        color: var(--text-main);
        direction: rtl;
        line-height: 1.9;
        margin: 0 0 8px;
        font-style: normal;
      }
      #pb-ayah-trans {
        font-size: 0.82rem;
        color: var(--text-muted);
        margin: 0 0 22px;
        line-height: 1.5;
        font-style: italic;
      }
      #pb-ref {
        display: block;
        color: var(--accent-color);
        font-style: normal;
        font-size: 0.75rem;
        margin-top: 4px;
      }
      #pb-time-row {
        display: flex;
        gap: 16px;
        justify-content: center;
        margin-bottom: 22px;
      }
      .pb-time-box {
        background: var(--box-bg);
        border: 1px solid var(--card-border);
        border-radius: 12px;
        padding: 12px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .pb-time-label {
        font-size: 0.7rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .pb-time-val {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-main);
        font-variant-numeric: tabular-nums;
      }
      #pb-steps {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 28px;
      }
      .pb-step {
        background: var(--box-bg);
        border-left: 3px solid var(--accent-color);
        border-radius: 8px;
        padding: 10px 16px;
        color: var(--text-main);
        font-size: 0.88rem;
        text-align: left;
        transition: background 0.2s;
      }
      .pb-step:hover {
        background: var(--box-bg-hover);
      }
      #pb-prayed-btn {
        display: block;
        width: 100%;
        padding: 16px;
        background: var(--btn-primary-bg);
        background-size: 200% auto;
        color: #ffffff;
        font-size: 1rem;
        font-weight: 700;
        border: none;
        border-radius: 14px;
        cursor: pointer;
        letter-spacing: 0.05em;
        transition: all 0.3s ease;
        box-shadow: 0 4px 20px var(--btn-primary-hover-shadow);
        animation: shimmer 3s linear infinite;
        margin-bottom: 20px;
      }
      @keyframes shimmer {
        0%   { background-position: 0% center; }
        100% { background-position: 200% center; }
      }
      #pb-prayed-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px var(--btn-primary-hover-shadow);
      }
      #pb-prayed-btn:active {
        transform: translateY(0);
      }
      #pb-prayed-btn:disabled {
        cursor: default;
        animation: none;
        transform: none;
      }
      #pb-hadith {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-style: italic;
        line-height: 1.6;
        margin: 0;
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    overlay.appendChild(style);
  }
})();
