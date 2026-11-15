(() => {
'use strict';
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;
const $ = (s) => document.querySelector(s);

const S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
const ICONS = {
  general: `<circle ${S} cx="12" cy="12" r="3"/><path ${S} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>`,
  appearance: `<path ${S} d="M12 3a9 9 0 1 0 9 9 2 2 0 0 1-2-2 2.5 2.5 0 0 0-2.5-2.5H15a3 3 0 0 1-3-3z"/><circle fill="currentColor" cx="8.5" cy="10.5" r="1.1"/><circle fill="currentColor" cx="8" cy="14.5" r="1.1"/><circle fill="currentColor" cx="12" cy="16.5" r="1.1"/>`,
  layout: `<rect ${S} x="3" y="6" width="18" height="12" rx="6"/><path ${S} d="M8 12h.01M12 12h.01M16 12h.01"/>`,
  smart: `<path ${S} d="M12 3l2.2 5.4L20 10l-4.4 3.8L17 20l-5-3-5 3 1.4-6.2L4 10l5.8-1.6z"/>`,
  screenshot: `<path ${S} d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle ${S} cx="12" cy="12" r="2.6"/>`,
  clip: `<rect ${S} x="6" y="5" width="12" height="15.5" rx="2.5"/><path ${S} d="M9.5 5V4.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V5M9.2 11h5.6M9.2 15h3.4"/>`,
  notes: `<path ${S} d="M6 4h12a2 2 0 0 1 2 2v8l-6 6H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM20 14h-4a2 2 0 0 0-2 2v4M8 9h8M8 13h4"/>`,
  shelf: `<path ${S} d="M4 13l2.2-7a2 2 0 0 1 1.9-1.4h7.8A2 2 0 0 1 17.8 6L20 13v4.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>`,
  notifs: `<path ${S} d="M9.5 19.5a2.6 2.6 0 0 0 5 0M6 16.5h12c-1-1.3-1.6-2.6-1.6-5V10a4.4 4.4 0 0 0-8.8 0v1.5c0 2.4-.6 3.7-1.6 5z"/>`,
  track: `<path ${S} d="M9 18V6l10-2v12"/><circle ${S} cx="6.5" cy="18" r="2.5"/><circle ${S} cx="16.5" cy="16" r="2.5"/>`,
  play: `<polygon fill="currentColor" points="7,5 19,12 7,19"/>`,
  settings: `<circle ${S} cx="12" cy="12" r="2.8"/><path ${S} d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2"/>`,
};
const svg = (name) => `<svg viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;

const STR = {
  en: {
    nav_general: 'General', sub_general: 'Language, clock, startup and alerts',
    nav_appearance: 'Styles & Skins', sub_appearance: 'Island shapes, skins, presets and rhythm pulse',
    nav_layout: 'Notch Layout', sub_layout: 'Drag and drop icons anywhere on the left, right or hide them',
    nav_smart: 'Smart & Behavior', sub_smart: 'Automation, smart copy, clipboard and visibility rules',
    lang: 'Language', lang_desc: 'Interface language across Notch & Settings',
    face: 'Resting notch shows', face_eyes: 'Live Eyes', face_clock: 'Digital Clock',
    calendar: 'Calendar', notifSec: 'Notification stay time',
    autostart: 'Start with Windows', autostart_desc: 'Launch Notchly automatically on sign-in',
    autoupdate: 'Auto updates', autoupdate_desc: 'Install new releases automatically when idle',
    deviceAlerts: 'Battery & Bluetooth alerts', downloadAlerts: 'Download finished alerts',
    dnd: 'Windows Do Not Disturb', dnd_desc: 'Open Windows notification settings to hide duplicate banners', dnd_btn: 'Open Settings',
    style_sec: 'Island Style', presets_sec: 'Quick Signature Presets',
    preset_iphone: 'iPhone Classic', preset_iphone_s: 'OLED Pitch Black',
    preset_glass: 'Frosted Acrylic', preset_glass_s: 'Ice & Glass',
    preset_neon: 'Cyber Pulse', preset_neon_s: 'Neon + Cyber',
    preset_minimal: 'Minimal Focus', preset_minimal_s: 'Clean Matte',
    style_iphone: 'iPhone Dynamic', style_iphone_desc: 'Pure OLED black, rounded capsule & springy bounce',
    style_glass: 'Frosted Glass', style_glass_desc: 'Translucent blur with soft light border',
    style_minimal: 'Minimal Matte', style_minimal_desc: 'Clean flat squircle, fast crisp transitions',
    style_neon: 'Cyber Neon', style_neon_desc: 'Obsidian core with glowing accent outline',
    skin: 'Normal Skin', musicTheme: 'Music Skin', live_dock: 'Live Notchly Preview',
    musicReact: 'Audio-reactive float', musicReact_desc: 'Pulse elevation & glow gently with music bass',
    visuals: 'Music background canvas', visuals_desc: 'Animated shaders & night sky behind now-playing',
    preview_lbl: 'Live Notch Bar Preview',
    zone_left: 'Left Side', zone_right: 'Right Side', zone_hide: 'Hidden Tools',
    drop_empty: 'Drag an icon here', reset_layout: 'Reset Default',
    ic_screenshot: 'Screenshot', ic_clip: 'Clipboard', ic_track: 'Music Mode', ic_play: 'Play / Pause', ic_notes: 'Quick Notes',
    ic_shelf: 'File Shelf', ic_notifs: 'Notifications', ic_settings: 'Settings',
    smartMode: 'Smart Mode', smartMode_desc: 'Peek briefly on track switch & keep interactions responsive',
    smartCopy: 'Smart Copy', smartCopy_desc: 'Auto-detect links, math equations, Shamshi/Gregorian dates & hex colors',
    clipHistory: 'Clipboard History', copyPreview: 'Copy Preview HUD',
    shelf: 'File Shelf', shelf_desc: 'Drop files on the notch to hold & drag them out anywhere',
    noteHotkey: 'Quick Note Shortcut', noteHotkey_desc: 'Ctrl + Alt + N opens instant note input',
    autoHide: 'Auto-hide under windows', hideVideo: 'Hide on fullscreen videos & games',
    check_upd: 'Check for Updates', checking: 'Checking…', up_to_date: 'Up to date', install_upd: 'Install v{v}',
  },
  fa: {
    nav_general: 'عمومی', sub_general: 'زبان برنامه، ساعت، تقویم و هشدارها',
    nav_appearance: 'استایل و اسکین', sub_appearance: 'شکل ظاهری ناچ، اسکین‌ها، پریست‌ها و واکنش به صدا',
    nav_layout: 'چیدمان آیکون‌ها', sub_layout: 'آیکون‌ها را راحت بکشید و بین چپ، راست یا بخش مخفی جابه‌جا کنید',
    nav_smart: 'هوشمند و رفتار', sub_smart: 'حالت هوشمند، کپی هوشمند، کلیپ‌بورد و قوانین نمایش',
    lang: 'زبان برنامه', lang_desc: 'زبان ناچ بالا و پنجره تنظیمات',
    face: 'حالت استراحت ناچ', face_eyes: 'چشم‌های زنده', face_clock: 'ساعت دیجیتال',
    calendar: 'تقویم', notifSec: 'مدت نمایش اعلان',
    autostart: 'اجرا همراه با ویندوز', autostart_desc: 'اجرای خودکار ناچلی هنگام روشن شدن سیستم',
    autoupdate: 'آپدیت خودکار', autoupdate_desc: 'نصب خودکار نسخه‌های جدید در زمان بیکاری',
    deviceAlerts: 'هشدار شارژ و بلوتوث', downloadAlerts: 'اطلاع پایان دانلود مرورگر',
    dnd: 'مخفی کردن اعلان تکراری ویندوز', dnd_desc: 'باز کردن تنظیمات ویندوز برای حالت مزاحم نشوید', dnd_btn: 'باز کردن',
    style_sec: 'استایل ناچ', presets_sec: 'پریست‌های آماده و خاص',
    preset_iphone: 'کلاسیک آیفون', preset_iphone_s: 'مشکی خالص OLED',
    preset_glass: 'شیشه‌ای یخی', preset_glass_s: 'شیشه مات + یخ',
    preset_neon: 'سایبر نئون', preset_neon_s: 'درخشش نئونی',
    preset_minimal: 'مینیمال تمرکز', preset_minimal_s: 'ساده و بی‌حاشیه',
    style_iphone: 'داینامیک آیفون', style_iphone_desc: 'مشکی خالص OLED با حاشیه کپسولی و انیمیشن فنری',
    style_glass: 'شیشه‌ای مات', style_glass_desc: 'پس‌زمینه بلور شفاف با لبه درخشان',
    style_minimal: 'مینیمال تخت', style_minimal_desc: 'طراحی ساده، سریع و بدون حاشیه اضافه',
    style_neon: 'نئون سایبری', style_neon_desc: 'بدنه تیره با حاشیه و درخشش هم‌رنگ تم',
    skin: 'اسکین حالت عادی', musicTheme: 'اسکین حالت موزیک', live_dock: 'پیش‌نمایش زنده ناچلی',
    musicReact: 'شناور هماهنگ با ریتم', musicReact_desc: 'حرکت و درخشش ظریف ناچ با باس آهنگ',
    visuals: 'پس‌زمینه گرافیکی موزیک', visuals_desc: 'نمایش انیمیشن و آسمان شب پشت موزیک‌پلیر',
    preview_lbl: 'پیش‌نمایش زنده نوار ناچ',
    zone_left: 'سمت چپ', zone_right: 'سمت راست', zone_hide: 'مخفی‌شده',
    drop_empty: 'آیکونی را به اینجا بکشید', reset_layout: 'بازگشت به پیش‌فرض',
    ic_screenshot: 'اسکرین‌شات', ic_clip: 'کلیپ‌بورد', ic_track: 'حالت موزیک', ic_play: 'پخش / توقف', ic_notes: 'یادداشت سریع',
    ic_shelf: 'قفسه فایل', ic_notifs: 'اعلان‌ها', ic_settings: 'تنظیمات',
    smartMode: 'حالت هوشمند (Smart)', smartMode_desc: 'نمایش کوتاه هنگام عوض شدن آهنگ و مدیریت هوشمند پنجره',
    smartCopy: 'کپی هوشمند', smartCopy_desc: 'تشخیص خودکار لینک، محاسبات ریاضی، تبدیل تاریخ و کد رنگ',
    clipHistory: 'تاریخچه کلیپ‌بورد', copyPreview: 'نمایش متن کپی‌شده روی ناچ',
    shelf: 'قفسه فایل', shelf_desc: 'فایل را روی ناچ بیندازید تا نگه داشته شود',
    noteHotkey: 'کلید میانبر یادداشت', noteHotkey_desc: 'ترکیب Ctrl + Alt + N برای ثبت سریع یادداشت',
    autoHide: 'مخفی شدن زیر پنجره‌ها', hideVideo: 'مخفی شدن در ویدیو و بازی تمام‌صفحه',
    check_upd: 'بررسی آپدیت', checking: 'در حال بررسی…', up_to_date: 'به‌روز است', install_upd: 'نصب نسخه {v}',
  },
  fingilish: {
    nav_general: 'General', sub_general: 'Language, saat, taghvim va alert-ha',
    nav_appearance: 'Style & Skin', sub_appearance: 'Zaher notch, skin-ha, preset-ha va harekat ba ritm',
    nav_layout: 'Icon Layout', sub_layout: 'Icon-ha ro rahat drag & drop konid be chap, rast ya hide',
    nav_smart: 'Smart Mode', sub_smart: 'Halat smart, smart copy va clipboard',
    lang: 'Zaban Barname', lang_desc: 'Zaban notch va safhe settings',
    face: 'Halat Adi Notch', face_eyes: 'Cheshm-ha', face_clock: 'Clock',
    calendar: 'Calendar', notifSec: 'Modat namayesh notification',
    autostart: 'Ejra ba Windows', autostart_desc: 'Start khodkar ba roshan shodan system',
    autoupdate: 'Auto Update', autoupdate_desc: 'Install khodkar version jadid',
    deviceAlerts: 'Alert Battery & Bluetooth', downloadAlerts: 'Alert Download-ha',
    dnd: 'Bastan Notification Windows', dnd_desc: 'Settings Do Not Disturb Windows', dnd_btn: 'Open',
    style_sec: 'Notch Style', presets_sec: 'Preset-haye Amade',
    preset_iphone: 'iPhone Classic', preset_iphone_s: 'Meshki Khales',
    preset_glass: 'Shishei Ice', preset_glass_s: 'Glass + Ice',
    preset_neon: 'Cyber Neon', preset_neon_s: 'Noor Neon',
    preset_minimal: 'Minimal Focus', preset_minimal_s: 'Sade va Tamiz',
    style_iphone: 'iPhone Dynamic', style_iphone_desc: 'Meshki khales ba animation fanari',
    style_glass: 'Shishei (Glass)', style_glass_desc: 'Blur shafaf ba hashiye noorani',
    style_minimal: 'Minimal', style_minimal_desc: 'Sade, sari va tamiz',
    style_neon: 'Cyber Neon', style_neon_desc: 'Hashiye neon hamrang ba theme',
    skin: 'Skin Halat Adi', musicTheme: 'Skin Halat Music', live_dock: 'Live Notchly Preview',
    musicReact: 'Shenavar ba Ritm', musicReact_desc: 'Harekat va noor hamahang ba bass ahang',
    visuals: 'Background Graphic Music', visuals_desc: 'Namayesh animation posht music player',
    preview_lbl: 'Live Notch Preview',
    zone_left: 'Samt Chap', zone_right: 'Samt Rast', zone_hide: 'Hide',
    drop_empty: 'Icon ro inja drag konid', reset_layout: 'Reset Default',
    ic_screenshot: 'Screenshot', ic_clip: 'Clipboard', ic_track: 'Music Mode', ic_play: 'Play / Pause', ic_notes: 'Quick Notes',
    ic_shelf: 'File Shelf', ic_notifs: 'Notifications', ic_settings: 'Settings',
    smartMode: 'Smart Mode', smartMode_desc: 'Namayesh kootah vaghti ahang avaz mishe',
    smartCopy: 'Smart Copy', smartCopy_desc: 'Tashkhis link, riazi, tarikh va rang-ha',
    clipHistory: 'Clipboard History', copyPreview: 'Namayesh matn copy shode',
    shelf: 'File Shelf', shelf_desc: 'File ro rooye notch bendazid ta negah dare',
    noteHotkey: 'Shortcut Note', noteHotkey_desc: 'Ctrl + Alt + N baraye note sari',
    autoHide: 'Hide zire panjere-ha', hideVideo: 'Hide dar video va fullscreen',
    check_upd: 'Check Update', checking: 'Dar hal check…', up_to_date: 'Update ast', install_upd: 'Install {v}',
  },
};

const THEME_DEFS = {
  none:    { name: 'None (Style)', swatch: 'linear-gradient(135deg,rgba(255,255,255,.16),rgba(0,0,0,.85))', acc: '#7c5cff', acc2: '#a98bff', rgb: '124, 92, 255' },
  black:   { name: 'Black',       swatch: '#09090b',                                                  acc: '#7c5cff', acc2: '#a98bff', rgb: '124, 92, 255' },
  sky:     { name: 'Night Sky',   swatch: 'linear-gradient(135deg,#2d1896,#6c47ff)',                  acc: '#6c47ff', acc2: '#9a7dff', rgb: '108, 71, 255' },
  nebula:  { name: 'Nebula',      swatch: 'radial-gradient(circle at 30% 35%,#ff4f9a,#7a1fd1 60%,#12051f)', acc: '#c0269a', acc2: '#ff4f9a', rgb: '255, 79, 154' },
  crystal: { name: 'Sapphire',    swatch: 'linear-gradient(135deg,#2b36d9,#9a6bff)',                  acc: '#5a48f0', acc2: '#9a6bff', rgb: '154, 107, 255' },
  ember:   { name: 'Ember',       swatch: 'linear-gradient(135deg,#5a050f,#ff4a3d)',                  acc: '#dc1230', acc2: '#ff4a3d', rgb: '255, 74, 61' },
  crimson: { name: 'Crimson',     swatch: 'linear-gradient(135deg,#660714,#ff5978)',                  acc: '#d91b38', acc2: '#ff5978', rgb: '255, 89, 120' },
  cyber:   { name: 'Cyber',       swatch: 'linear-gradient(135deg,#006d77,#00b4d8,#ff007f)',          acc: '#00b4d8', acc2: '#ff007f', rgb: '0, 180, 216' },
  reactor: { name: 'Reactor',     swatch: 'linear-gradient(135deg,#1d5c0b,#b6ff3a)',                  acc: '#6fd61f', acc2: '#b6ff3a', rgb: '182, 255, 58' },
  venom:   { name: 'Venom',       swatch: 'radial-gradient(circle at 32% 30%,#e6eaf2 0 12%,#3a3d47 35%,#050507)', acc: '#8a8f9c', acc2: '#e6eaf2', rgb: '230, 234, 242' },
  cloud:   { name: 'Storm Cloud', swatch: 'linear-gradient(135deg,#566885,#b9c8e0,#ffffff)',          acc: '#7f93b3', acc2: '#d5e1f5', rgb: '185, 200, 224' },
  water:   { name: 'Water',       swatch: 'linear-gradient(135deg,#0b49b8,#5fe0e6)',                  acc: '#1aa6e8', acc2: '#5fe0e6', rgb: '95, 224, 230' },
  lava:    { name: 'Lava',        swatch: 'linear-gradient(160deg,#2c0803,#e24a0e,#ffd24a)',          acc: '#ff7a18', acc2: '#ffd24a', rgb: '255, 122, 24' },
  ice:     { name: 'Ice',         swatch: 'linear-gradient(160deg,#f4fbff,#5aa9e6)',                  acc: '#5aa9e6', acc2: '#9fd3f7', rgb: '159, 211, 247' },
};

const DEFAULT_ORDER = [
  { id: 'screenshot', side: 'left' }, { id: 'clip', side: 'left' },
  { id: 'track', side: 'left' }, { id: 'play', side: 'left' },
  { id: 'notes', side: 'right' }, { id: 'shelf', side: 'right' },
  { id: 'notifs', side: 'right' }, { id: 'settings', side: 'right' },
];
const CANON = { shot: 'screenshot', clips: 'clip', inbox: 'notifs', gear: 'settings' };

let cfg = {};
let activeTab = 'general';
let updateVer = '';
let dragId = null;

function T(k, vars) {
  const lang = ['en', 'fa', 'fingilish'].includes(cfg.lang) ? cfg.lang : 'en';
  let s = (STR[lang] && STR[lang][k]) || STR.en[k] || k;
  if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
  return s;
}
function setPref(key, value) {
  cfg[key] = value;
  invoke('settings_set', { key, value }).catch(() => {});
  renderAll();
}
function normalizeOrder(raw) {
  const seen = new Set(), out = [];
  if (Array.isArray(raw)) {
    for (const r of raw) {
      const id = CANON[r.id] || r.id;
      if (!ICONS[id] || seen.has(id)) continue;
      seen.add(id);
      const side = ['left', 'right', 'hide'].includes(r.side || r.pos) ? (r.side || r.pos) : 'left';
      out.push({ id, side });
    }
  }
  for (const d of DEFAULT_ORDER) {
    if (!seen.has(d.id)) out.push({ ...d });
  }
  return out;
}

function makeCard(rows) {
  const c = document.createElement('div');
  c.className = 'card';
  rows.forEach((r) => c.appendChild(r));
  return c;
}
function rowToggle(title, desc, key, getVal = () => cfg[key] !== false) {
  const row = document.createElement('div'); row.className = 'srow';
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = `<div class="title">${title}</div>` + (desc ? `<div class="desc">${desc}</div>` : '');
  const on = !!getVal();
  const sw = document.createElement('button'); sw.className = 'sw' + (on ? ' on' : '');
  sw.addEventListener('click', () => setPref(key, !on));
  row.append(meta, sw);
  return row;
}
function rowSeg(title, desc, key, opts) {
  const row = document.createElement('div'); row.className = 'srow';
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = `<div class="title">${title}</div>` + (desc ? `<div class="desc">${desc}</div>` : '');
  const seg = document.createElement('div'); seg.className = 'seg';
  const cur = cfg[key] || opts[0][0];
  opts.forEach(([val, lbl]) => {
    const bt = document.createElement('button'); bt.textContent = lbl;
    if (cur === val) bt.className = 'on';
    bt.addEventListener('click', () => setPref(key, val));
    seg.appendChild(bt);
  });
  row.append(meta, seg);
  return row;
}
function rowStep(title, key, min, max, unit) {
  const row = document.createElement('div'); row.className = 'srow';
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = `<div class="title">${title}</div>`;
  const cur = Math.max(min, Math.min(max, Number(cfg[key]) || 4));
  const box = document.createElement('div'); box.className = 'step';
  const m = document.createElement('button'); m.textContent = '−';
  const v = document.createElement('span'); v.textContent = cur + unit;
  const p = document.createElement('button'); p.textContent = '+';
  m.addEventListener('click', () => setPref(key, Math.max(min, cur - 1)));
  p.addEventListener('click', () => setPref(key, Math.min(max, cur + 1)));
  box.append(m, v, p);
  row.append(meta, box);
  return row;
}
function rowBtn(title, desc, btnText, onClick) {
  const row = document.createElement('div'); row.className = 'srow';
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = `<div class="title">${title}</div>` + (desc ? `<div class="desc">${desc}</div>` : '');
  const bt = document.createElement('button'); bt.className = 'btn-pill'; bt.textContent = btnText;
  bt.addEventListener('click', onClick);
  row.append(meta, bt);
  return row;
}

function renderGeneral(body) {
  body.appendChild(makeCard([
    rowSeg(T('lang'), T('lang_desc'), 'lang', [['en', 'English'], ['fa', 'فارسی'], ['fingilish', 'Fingilish']]),
    rowSeg(T('face'), '', 'face', [['eyes', T('face_eyes')], ['clock', T('face_clock')]]),
    rowSeg(T('calendar'), '', 'calendar', [['gregorian', 'Gregorian'], ['shamsi', 'Shamsi'], ['shamsi-fa', 'شمسی'], ['both', 'Both']]),
    rowStep(T('notifSec'), 'notifSeconds', 2, 15, 's'),
  ]));
  body.appendChild(makeCard([
    rowToggle(T('autostart'), T('autostart_desc'), 'autoStart', () => !!cfg.autoStartOn),
    rowToggle(T('autoupdate'), T('autoupdate_desc'), 'autoUpdate'),
    rowToggle(T('deviceAlerts'), '', 'deviceAlerts'),
    rowToggle(T('downloadAlerts'), '', 'downloadAlerts'),
    rowBtn(T('dnd'), T('dnd_desc'), T('dnd_btn'), () => invoke('action', { name: 'dnd' }).catch(() => {})),
  ]));
}

function renderAppearance(body) {
  const ph = document.createElement('div'); ph.className = 'sec-title'; ph.textContent = T('presets_sec');
  body.appendChild(ph);
  const prow = document.createElement('div'); prow.className = 'presets-row';
  [
    ['iphone', 'black', 'sky', 'preset_iphone', 'preset_iphone_s'],
    ['glass', 'ice', 'water', 'preset_glass', 'preset_glass_s'],
    ['neon', 'cyber', 'nebula', 'preset_neon', 'preset_neon_s'],
    ['minimal', 'venom', 'black', 'preset_minimal', 'preset_minimal_s'],
  ].forEach(([stVal, skVal, muVal, tKey, sKey]) => {
    const pb = document.createElement('button'); pb.className = 'preset-btn';
    pb.innerHTML = `<div class="pt">${T(tKey)}</div><div class="ps">${T(sKey)}</div>`;
    pb.addEventListener('click', () => {
      cfg.style = stVal; cfg.skin = skVal; cfg.musicTheme = muVal;
      invoke('settings_set', { key: 'style', value: stVal }).catch(() => {});
      invoke('settings_set', { key: 'skin', value: skVal }).catch(() => {});
      invoke('settings_set', { key: 'musicTheme', value: muVal }).catch(() => {});
      renderAll();
    });
    prow.appendChild(pb);
  });
  body.appendChild(prow);

  const h = document.createElement('div'); h.className = 'sec-title'; h.textContent = T('style_sec');
  body.appendChild(h);
  const grid = document.createElement('div'); grid.className = 'styles-grid';
  const curStyle = cfg.style || 'iphone';
  for (const id of ['iphone', 'glass', 'minimal', 'neon']) {
    const card = document.createElement('button');
    card.className = 'style-card' + (curStyle === id ? ' on' : '');
    card.innerHTML = `
      <div class="style-preview">
        <div class="mock-pill ${id}"><span>18:30</span><span class="mock-dots"><i></i><i></i></span></div>
      </div>
      <div>
        <div class="style-name">${T('style_' + id)}</div>
        <div class="style-desc">${T('style_' + id + '_desc')}</div>
      </div>`;
    card.addEventListener('click', () => setPref('style', id));
    grid.appendChild(card);
  }
  body.appendChild(grid);

  const allThemes = Object.keys(THEME_DEFS);
  const skinName = (id) => id === 'none' ? (cfg.lang === 'fa' ? 'پیش‌فرض استایل' : 'None (Default)') : THEME_DEFS[id].name;
  const skinCard = document.createElement('div'); skinCard.className = 'card';
  skinCard.innerHTML = `<div class="srow"><div class="meta"><div class="title">${T('skin')}</div></div></div>`;
  const s1 = document.createElement('div'); s1.className = 'swatches';
  allThemes.forEach((id) => {
    const bt = document.createElement('button');
    bt.className = 'swatch' + ((cfg.skin || 'none') === id ? ' on' : '');
    bt.innerHTML = `<i style="background:${THEME_DEFS[id].swatch}"></i><span>${skinName(id)}</span>`;
    bt.addEventListener('click', () => setPref('skin', id));
    s1.appendChild(bt);
  });
  skinCard.appendChild(s1);
  body.appendChild(skinCard);

  const musCard = document.createElement('div'); musCard.className = 'card';
  musCard.innerHTML = `<div class="srow"><div class="meta"><div class="title">${T('musicTheme')}</div></div></div>`;
  const s2 = document.createElement('div'); s2.className = 'swatches';
  allThemes.forEach((id) => {
    const bt = document.createElement('button');
    bt.className = 'swatch' + ((cfg.musicTheme || 'sky') === id ? ' on' : '');
    bt.innerHTML = `<i style="background:${THEME_DEFS[id].swatch}"></i><span>${skinName(id)}</span>`;
    bt.addEventListener('click', () => setPref('musicTheme', id));
    s2.appendChild(bt);
  });
  musCard.appendChild(s2);
  body.appendChild(musCard);

  body.appendChild(makeCard([
    rowToggle(T('musicReact'), T('musicReact_desc'), 'musicReact'),
    rowToggle(T('visuals'), T('visuals_desc'), 'visuals'),
  ]));
}

function renderLayout(body) {
  let order = normalizeOrder(cfg.iconOrder);
  const saveOrder = (next) => {
    order = next;
    setPref('iconOrder', next);
  };

  // Visual live preview bar
  const pWrap = document.createElement('div'); pWrap.className = 'preview-notch-wrap';
  const pLbl = document.createElement('div'); pLbl.className = 'preview-label'; pLbl.textContent = T('preview_lbl');
  const pBar = document.createElement('div'); pBar.className = 'preview-notch';
  const pLeft = document.createElement('div'); pLeft.className = 'pn-side';
  const pClock = document.createElement('div'); pClock.className = 'pn-clock'; pClock.textContent = '18:30';
  const pRight = document.createElement('div'); pRight.className = 'pn-side';
  order.forEach((it) => {
    if (it.side === 'left') pLeft.innerHTML += svg(it.id);
    else if (it.side === 'right') pRight.innerHTML += svg(it.id);
  });
  pBar.append(pLeft, pClock, pRight);
  pWrap.append(pLbl, pBar);
  body.appendChild(pWrap);

  const moveItemTo = (id, targetSide, beforeId) => {
    const idx = order.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const [moved] = order.splice(idx, 1);
    moved.side = targetSide;
    if (beforeId) {
      const bIdx = order.findIndex((x) => x.id === beforeId);
      if (bIdx >= 0) order.splice(bIdx, 0, moved);
      else order.push(moved);
    } else {
      order.push(moved);
    }
    saveOrder(order);
  };

  const stepItem = (id, dir) => {
    const item = order.find((x) => x.id === id);
    if (!item) return;
    const sameSide = order.filter((x) => x.side === item.side);
    const pos = sameSide.findIndex((x) => x.id === id);
    const swapWith = sameSide[pos + dir];
    if (!swapWith) return;
    const a = order.indexOf(item), b = order.indexOf(swapWith);
    order[a] = swapWith; order[b] = item;
    saveOrder(order);
  };

  const grid = document.createElement('div'); grid.className = 'dnd-grid';
  for (const [side, titleKey, full] of [['left', 'zone_left', false], ['right', 'zone_right', false], ['hide', 'zone_hide', true]]) {
    const zone = document.createElement('div');
    zone.className = 'dnd-zone' + (full ? ' full' : '');
    const head = document.createElement('div'); head.className = 'dnd-zone-head';
    head.innerHTML = `<span>${T(titleKey)}</span>`;
    if (side === 'hide') {
      const rst = document.createElement('button'); rst.className = 'btn-pill'; rst.style.padding = '3px 9px'; rst.style.fontSize = '11px';
      rst.textContent = T('reset_layout');
      rst.addEventListener('click', () => saveOrder(DEFAULT_ORDER.map((x) => ({ ...x }))));
      head.appendChild(rst);
    }
    const list = document.createElement('div'); list.className = 'dnd-list';
    const items = order.filter((x) => x.side === side);
    if (!items.length) {
      const em = document.createElement('div'); em.className = 'dnd-empty'; em.textContent = T('drop_empty');
      list.appendChild(em);
    }
    items.forEach((it, i) => {
      const chip = document.createElement('div'); chip.className = 'chip-item'; chip.draggable = true;
      chip.innerHTML = `${svg(it.id)}<span>${T('ic_' + it.id)}</span>`;
      const arrows = document.createElement('span'); arrows.className = 'chip-arrows';
      const bL = document.createElement('button'); bL.textContent = '◀'; bL.disabled = i === 0;
      const bR = document.createElement('button'); bR.textContent = '▶'; bR.disabled = i === items.length - 1;
      bL.addEventListener('click', (e) => { e.stopPropagation(); stepItem(it.id, -1); });
      bR.addEventListener('click', (e) => { e.stopPropagation(); stepItem(it.id, 1); });
      arrows.append(bL, bR);
      chip.appendChild(arrows);

      chip.addEventListener('dragstart', (e) => {
        dragId = it.id; chip.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', it.id);
      });
      chip.addEventListener('dragend', () => { dragId = null; chip.classList.remove('dragging'); });
      chip.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); chip.classList.add('drag-over'); });
      chip.addEventListener('dragleave', () => chip.classList.remove('drag-over'));
      chip.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation(); chip.classList.remove('drag-over');
        const id = dragId || e.dataTransfer.getData('text/plain');
        if (id && id !== it.id) moveItemTo(id, side, it.id);
      });
      list.appendChild(chip);
    });

    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('over');
      const id = dragId || e.dataTransfer.getData('text/plain');
      if (id) moveItemTo(id, side, null);
    });
    zone.append(head, list);
    grid.appendChild(zone);
  }
  body.appendChild(grid);
}

function renderSmart(body) {
  body.appendChild(makeCard([
    rowToggle(T('smartMode'), T('smartMode_desc'), 'smartMode'),
    rowToggle(T('smartCopy'), T('smartCopy_desc'), 'smartCopy'),
    rowToggle(T('clipHistory'), '', 'clipHistory'),
    rowToggle(T('copyPreview'), '', 'copyPreview'),
    rowToggle(T('shelf'), T('shelf_desc'), 'shelf'),
    rowToggle(T('noteHotkey'), T('noteHotkey_desc'), 'noteHotkey'),
  ]));
  body.appendChild(makeCard([
    rowToggle(T('autoHide'), '', 'autoHide'),
    rowToggle(T('hideVideo'), '', 'hideVideo'),
  ]));
}

function applyThemeToWindow() {
  document.body.dataset.style = cfg.style || 'iphone';
  const pal = THEME_DEFS[cfg.skin] || THEME_DEFS.black;
  const r = document.documentElement.style;
  r.setProperty('--acc', pal.acc);
  r.setProperty('--acc2', pal.acc2);
  r.setProperty('--acc-rgb', pal.rgb);
}

function renderAll() {
  const lang = ['en', 'fa', 'fingilish'].includes(cfg.lang) ? cfg.lang : 'en';
  document.documentElement.lang = lang === 'fa' ? 'fa' : 'en';
  document.body.dir = lang === 'fa' ? 'rtl' : 'ltr';
  applyThemeToWindow();
  $('#ver').textContent = 'v' + (cfg.version || '1.0.0');
  const tbTitle = $('#tb-title');
  if (tbTitle) tbTitle.textContent = lang === 'fa' ? 'تنظیمات ناچلی' : 'Notchly Settings';
  const ln = $('#live-notch'), lnClk = $('#ln-clock');
  if (ln) ln.classList.toggle('clock', cfg.face === 'clock');
  if (lnClk) {
    const d = new Date();
    lnClk.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  const dockLbl = $('#dock-lbl'), dockPill = $('#dock-pill'), dockL = $('#dock-left'), dockR = $('#dock-right'), dockClk = $('#dc-clock');
  if (dockLbl) dockLbl.textContent = T('live_dock');
  if (dockPill) {
    dockPill.classList.toggle('clock', cfg.face === 'clock');
    const sk = THEME_DEFS[cfg.skin];
    dockPill.style.background = (cfg.skin && cfg.skin !== 'none' && cfg.skin !== 'black' && sk) ? sk.swatch : '';
  }
  if (dockClk) {
    const d = new Date();
    dockClk.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  if (dockL && dockR) {
    dockL.innerHTML = ''; dockR.innerHTML = '';
    normalizeOrder(cfg.iconOrder).forEach((it) => {
      if (it.side === 'left') dockL.innerHTML += svg(it.id);
      else if (it.side === 'right') dockR.innerHTML += svg(it.id);
    });
  }

  const nav = $('#nav'); nav.textContent = '';
  for (const id of ['general', 'appearance', 'layout', 'smart']) {
    const b = document.createElement('button');
    b.className = 'nav-item' + (activeTab === id ? ' on' : '');
    b.innerHTML = `${svg(id)}<span>${T('nav_' + id)}</span>`;
    b.addEventListener('click', () => { activeTab = id; renderAll(); });
    nav.appendChild(b);
  }

  $('#page-title').textContent = T('nav_' + activeTab);
  $('#page-sub').textContent = T('sub_' + activeTab);

  const upd = $('#upd-btn');
  upd.className = 'upd-btn' + (updateVer ? ' ready' : '');
  upd.textContent = updateVer ? T('install_upd', { v: updateVer }) : T('check_upd');

  const body = $('#body'); body.textContent = '';
  if (activeTab === 'general') renderGeneral(body);
  else if (activeTab === 'appearance') renderAppearance(body);
  else if (activeTab === 'layout') renderLayout(body);
  else renderSmart(body);
}

$('#upd-btn').addEventListener('click', async () => {
  const upd = $('#upd-btn');
  if (updateVer) { invoke('update_install').catch(() => {}); return; }
  upd.textContent = T('checking');
  const r = await invoke('update_check').catch(() => 'failed');
  if (typeof r === 'string' && r.startsWith('ready')) { updateVer = r.slice(6); renderAll(); }
  else upd.textContent = r === 'none' ? T('up_to_date') : 'Error';
});

const curWin = window.__TAURI__?.window?.getCurrentWindow?.();
$('#win-min')?.addEventListener('click', () => curWin?.minimize());
$('#win-max')?.addEventListener('click', () => curWin?.toggleMaximize());
$('#win-close')?.addEventListener('click', () => curWin?.close());

let resizeT = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    if (window.innerWidth < 700 || window.innerHeight < 480) return;
    invoke('settings_set', { key: 'settingsW', value: Math.round(window.innerWidth) }).catch(() => {});
    invoke('settings_set', { key: 'settingsH', value: Math.round(window.innerHeight) }).catch(() => {});
  }, 260);
});

// Interactive live mini-notch eyes & clock in titlebar
const ln = $('#live-notch'), lnEyes = $('#ln-eyes'), e1 = $('#ln-e1'), e2 = $('#ln-e2');
document.addEventListener('pointermove', (ev) => {
  if (!ln || cfg.face === 'clock') return;
  const r = ln.getBoundingClientRect();
  const dx = Math.max(-3.5, Math.min(3.5, (ev.clientX - (r.left + r.width / 2)) / 65));
  const dy = Math.max(-2.2, Math.min(2.2, (ev.clientY - (r.top + r.height / 2)) / 65));
  if (e1) e1.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
  if (e2) e2.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
});
setInterval(() => {
  if (!lnEyes || cfg.face === 'clock') return;
  lnEyes.classList.add('blink');
  setTimeout(() => lnEyes.classList.remove('blink'), 130);
}, 3800);
setInterval(() => {
  const lnClk = $('#ln-clock');
  if (lnClk && cfg.face === 'clock') {
    const d = new Date();
    lnClk.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
}, 15000);
ln?.addEventListener('click', () => {
  ln.classList.add('pop');
  setTimeout(() => ln.classList.remove('pop'), 360);
});

// Custom themed tooltip for Settings elements (no native browser tooltip)
const stTip = $('#st-tip');
let stTipT = 0;
document.addEventListener('pointerover', (e) => {
  const el = e.target.closest('[data-st-tip]');
  if (!el || !stTip) return;
  clearTimeout(stTipT);
  stTipT = setTimeout(() => {
    const r = el.getBoundingClientRect();
    stTip.textContent = el.dataset.stTip;
    stTip.style.left = Math.round(r.left + r.width / 2) + 'px';
    stTip.style.top = Math.round(r.bottom + 8) + 'px';
    stTip.classList.add('on');
  }, 160);
});
document.addEventListener('pointerout', (e) => {
  if (e.target.closest('[data-st-tip]') && stTip) { clearTimeout(stTipT); stTip.classList.remove('on'); }
});

listen('settings', (e) => { cfg = e.payload || {}; renderAll(); });
listen('helper', (e) => {
  if (e.payload && e.payload.t === 'update') { updateVer = e.payload.version || ''; renderAll(); }
});
invoke('settings_get').then((s) => { cfg = s || {}; renderAll(); });
})();
