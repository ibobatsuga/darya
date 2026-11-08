import './style.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import { createIcons, icons } from 'lucide';
import { previewProducts, previewArticles, foods, goals, previewFoodLogs, exerciseOptions } from './data.js';
import { bodyMetrics, validProfile, safetyCheck, lifestyleScore, sharePayload, escapeHTML as esc, DISCLAIMER, localDay } from './domain.js';
import { api, supabase, session, initializeAuth, loadUserData, signIn, signUp, googleSignIn, resetPassword } from './api.js';

const app = document.querySelector('#app');
const overlay = document.querySelector('#overlay-root');
const state = {
  route: location.hash.slice(1).split('?')[0] || 'home', theme: document.documentElement.dataset.theme || 'light',
  profile: null, products: [...previewProducts], articles: [...previewArticles], bookmarks: new Set(), foodLogs: [...previewFoodLogs],
  exercises: [], weights: [], supplements: [], water: 5, connected_accounts: [], messages: [], planDone: new Set(), search: '', category: 'Semua',
  articleCategory: 'Semua', chartPeriod: 'Minggu', chartMetric: 'Berat badan', notificationsRead: false, loading: false, remaining: null,
};
let modalFocus = null;
let modalCleanup = null;
let onboardingDraft = null;
let onboardingStep = 0;
const icon = (name, cls = '', size = 20) => `<i data-lucide="${name}" class="${cls}" width="${size}" height="${size}" aria-hidden="true"></i>`;
const chevron = () => icon('arrow-up-right', '', 16);
const isPreview = () => !session;
const num = n => new Intl.NumberFormat('id-ID').format(n);
const name = () => state.profile?.name?.split(' ')[0] || 'Sahabat';
const score = () => state.profile ? lifestyleScore(state.profile) : 78;
const target = () => state.profile ? bodyMetrics(state.profile)?.tdee || 2000 : 2000;
const consumed = () => state.foodLogs.reduce((s, f) => s + Number(f.calories), 0);
const dateLabel = () => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date());
const badge = (text, type = 'blue') => `<span class="badge ${type}">${text}</span>`;
const sectionHead = (title, action = '', actionAttr = '') => `<div class="section-heading"><h2>${title}</h2>${action ? `<button class="text-button" ${actionAttr}>${action}${icon('arrow-right', '', 15)}</button>` : ''}</div>`;
const empty = (title, desc, action = '') => `<div class="empty">${icon('sprout', '', 36)}<h3>${title}</h3><p>${desc}</p>${action}</div>`;

function hydrateIcons() { createIcons({ icons, attrs: { 'stroke-width': 1.7 } }); }
function toast(message, type = 'success') {
  const node = document.createElement('div'); node.className = `toast ${type}`;
  node.innerHTML = `${icon(type === 'error' ? 'circle-alert' : 'circle-check', '', 19)}<span>${esc(message)}</span>`;
  document.querySelector('#toast-root').append(node); hydrateIcons();
  setTimeout(() => node.remove(), 5000);
}

const navItems = [
  ['home', 'layout-dashboard', 'Beranda'], ['assistant', 'bot', 'Darya AI'], ['nutrition', 'utensils', 'Catat Gizi'],
  ['insights', 'chart-no-axes-combined', 'Insight Kesehatan'], ['products', 'pill', 'Jelajahi Produk'], ['plan', 'calendar-check-2', 'Rencana Sehat'],
];
const titles = { home: 'Beranda', assistant: 'Darya AI', nutrition: 'Catat Gizi', insights: 'Insight Kesehatan', products: 'Jelajahi Produk', plan: 'Rencana Sehat', saved: 'Tersimpan', profile: 'Profil & Pengaturan' };

function shell() {
  app.innerHTML = `<aside class="sidebar">
    <a href="#home" class="brand" aria-label="Daryapedia beranda"><img class="brand-logo" src="/logo-daryapedia.svg" alt="Daryapedia"><span>daryapedia<span class="brand-dot">.</span></span></a>
    <div class="sidebar-caption">YOUR WELLNESS SPACE</div>
    <nav aria-label="Navigasi utama">${navItems.map(([id, i, label]) => `<a href="#${id}" class="nav-item ${state.route === id ? 'active' : ''}" ${state.route === id ? 'aria-current="page"' : ''}>${icon(i)}<span>${label}</span>${id === 'assistant' ? '<span class="ai-badge">AI</span>' : ''}${state.route === id ? '<span class="nav-dot"></span>' : ''}</a>`).join('')}</nav>
    <div class="nav-divider"></div><div class="sidebar-caption">PERSONAL</div>
    <nav aria-label="Menu pribadi"><a class="nav-item ${state.route === 'saved' ? 'active' : ''}" href="#saved">${icon('bookmark')}<span>Tersimpan</span><span class="count-badge">${state.bookmarks.size}</span></a><a class="nav-item ${state.route === 'profile' ? 'active' : ''}" href="#profile">${icon('settings-2')}<span>Pengaturan</span></a></nav>
    <div class="sidebar-bottom"><div class="companion-card"><span class="mini-orb">${icon('sparkles', '', 20)}</span><h3>Langkah kecil.<br>Dampak besar.</h3><p>Teman sehatmu, setiap hari.</p><button class="button compact" data-go="assistant">Sapa Darya AI ${icon('arrow-up-right', '', 15)}</button></div>
    <button class="sidebar-user" data-go="profile"><span class="avatar">${esc(name().slice(0, 1))}</span><span><strong>${session ? esc(name()) : 'Halo, Sahabat'}</strong><small>${session ? 'Perjalanan sehatmu' : 'Jelajahi Daryapedia'}</small></span>${icon('chevrons-up-down', '', 16)}</button></div>
  </aside>
  <div class="workspace"><header class="topbar"><div class="breadcrumb"><span class="mobile-brand"><img class="brand-logo small" src="/logo-daryapedia.svg" alt="Daryapedia">daryapedia<span class="brand-dot">.</span></span><span class="desktop-breadcrumb">Wellness space ${icon('chevron-right', '', 13)}<strong>${titles[state.route] || 'Beranda'}</strong></span></div>
    <div class="top-actions"><label class="global-search">${icon('search', '', 17)}<input id="global-search" type="search" placeholder="Cari sesuatu untuk sehatmu..." aria-label="Cari produk"/><span>⌘ K</span></label>${isPreview() ? '<span class="preview-pill"><span></span>Pratinjau</span>' : '<span class="connected-pill">Terhubung</span>'}
    <button class="icon-button theme-toggle" data-action="theme" aria-label="${state.theme === 'light' ? 'Aktifkan tema gelap' : 'Aktifkan tema terang'}">${icon(state.theme === 'light' ? 'moon' : 'sun', '', 19)}</button><button class="icon-button notification-button" data-action="notifications" aria-label="Notifikasi">${icon('bell', '', 19)}${!state.notificationsRead ? '<b></b>' : ''}</button><button class="avatar avatar-small" data-go="profile" aria-label="Buka profil">${esc(name().slice(0, 1))}</button></div>
  </header><main id="main-content" tabindex="-1">${renderPage()}</main><footer class="page-footer"><span>© ${new Date().getFullYear()} Daryapedia</span><span>${icon('heart', '', 12)} Teman perjalanan sehatmu</span><button data-action="privacy">Privasi & keamanan</button></footer></div>
  <nav class="mobile-nav" aria-label="Navigasi mobile"><a href="#home" class="${state.route === 'home' ? 'active' : ''}">${icon('house')}<span>Beranda</span></a><a href="#insights" class="${state.route === 'insights' ? 'active' : ''}">${icon('chart-no-axes-combined')}<span>Insight</span></a><button class="quick-add" data-action="quick-add" aria-label="Catat aktivitas">${icon('plus', '', 26)}</button><a href="#assistant" class="${state.route === 'assistant' ? 'active' : ''}">${icon('bot')}<span>Darya AI</span></a><a href="#profile" class="${state.route === 'profile' ? 'active' : ''}">${icon('user-round')}<span>Profil</span></a></nav>`;
  hydrateIcons();
  bindPageInputs();
  handleSocialCallback();
}

function renderPage() {
  switch (state.route) {
    case 'assistant': return assistantPage(); case 'nutrition': return nutritionPage(); case 'insights': return insightsPage();
    case 'products': return productsPage(); case 'plan': return planPage(); case 'saved': return savedPage(); case 'profile': return profilePage(); default: return homePage();
  }
}

function greeting(title, subtitle, right = '') {
  return `<div class="page-intro"><div><div class="eyebrow">${state.route === 'home' ? `${icon('sun', '', 15)} SELAMAT DATANG KEMBALI` : 'DARYAPEDIA · TEMAN SEHATMU'}</div><h1>${title}</h1><p>${subtitle}</p></div>${right}</div>`;
}

function progressRing(value, label, sub, cls = '', size = 126) {
  const radius = 51; const length = 2 * Math.PI * radius;
  return `<div class="progress-ring ${cls}" style="width:${size}px;height:${size}px"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="${radius}" class="progress-ring-track"/><circle cx="60" cy="60" r="${radius}" class="progress-ring-progress" stroke-dasharray="${length}" stroke-dashoffset="${length * (1 - Math.min(value, 100) / 100)}"/></svg><div class="progress-ring-label"><strong>${label}</strong><span>${sub}</span></div></div>`;
}

function sparkline(type = 'blue', points = '0,44 12,46 23,34 34,39 46,22 58,28 70,12 82,19 94,10 108,15 120,4') {
  return `<svg class="sparkline ${type}" viewBox="0 0 120 55" preserveAspectRatio="none" aria-hidden="true"><path d="M${points.replaceAll(' ', ' L')}" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/><path d="M${points.replaceAll(' ', ' L')} L120,55 L0,55Z" fill="currentColor" opacity=".07"/></svg>`;
}

function homePage() {
  const bmi = state.profile ? bodyMetrics(state.profile)?.bmi : 22.6;
  return `${greeting(`Halo, ${esc(name())}`, 'Yuk, beri tubuhmu perhatian yang pantas hari ini.', `<div class="date-chip">${icon('calendar-days', '', 16)}${dateLabel()}</div>`)}
  <div class="dashboard-grid"><div class="dashboard-main">
    <section class="hero-card"><div class="hero-copy"><div class="hero-tag"><span class="live-dot"></span>YOUR EVERYDAY WELLNESS COMPANION</div><h2>Lebih sehat,<br>satu langkah setiap hari.</h2><p>Kenali kebutuhan tubuhmu.<br>Bangun kebiasaan baik bersama Darya.</p><button class="button white" data-go="assistant">${icon('sparkles', '', 17)}Mulai konsultasi${icon('arrow-up-right', '', 17)}</button></div><div class="hero-visual">${progressRing(score(), `${score()}<small>/100</small>`, 'Skor gaya hidup', 'hero-ring', 164)}<div class="hero-score-label">${icon('leaf', '', 13)} Langkah baik untuk dirimu</div></div><div class="hero-footer">${icon('shield-check', '', 14)} Personal untukmu. Aman jadi prioritas.</div></section>
    ${sectionHead('Sekilas kesehatanmu', 'Lihat insight', 'data-go="insights"')}
    <section class="metric-grid" aria-label="Ringkasan kesehatan"><button class="metric-card" data-go="nutrition"><span class="metric-icon orange">${icon('flame', '', 19)}</span><span class="metric-title">Asupan kalori</span><div class="metric-value">${num(consumed())}<small> / ${num(target())} kkal</small></div><div class="small-progress orange"><span style="width:${Math.min(consumed() / target() * 100, 100)}%"></span></div><span class="metric-note">${Math.round(consumed() / target() * 100)}% dari target harian</span></button>
    <button class="metric-card" data-action="weight"><span class="metric-icon blue">${icon('scale', '', 19)}</span><span class="metric-title">Berat badan</span><div class="metric-value">${state.weights.at(-1)?.weight || state.profile?.weight || '65,3'}<small> kg</small></div>${sparkline('blue', '0,10 12,19 23,15 34,29 46,22 58,35 70,30 82,44 94,38 108,43 120,40')}<span class="metric-note">${state.profile ? `BMI ${bmi}` : 'Contoh catatan berat'}</span></button>
    <button class="metric-card" data-action="exercise"><span class="metric-icon green">${icon('footprints', '', 19)}</span><span class="metric-title">Aktivitas hari ini</span><div class="metric-value">${state.exercises.length ? state.exercises.reduce((s, e) => s + e.minutes, 0) : isPreview() ? 32 : 0}<small> menit</small></div><div class="mini-bars">${[35, 55, 38, 72, 54, 85, 65, 100, 75, 87, 65, 90].map((h, i) => `<span style="height:${h}%;opacity:${i > 8 ? '.35' : '1'}"></span>`).join('')}</div><span class="metric-note green-text">${icon('trending-up', '', 12)} Bergerak, sedikit demi sedikit</span></button></section>
    <section class="quick-log-section">${sectionHead('Catat langkah baikmu')}<div class="quick-log-grid">${[['food', 'utensils', 'Makanan', 'blue'], ['weight', 'scale', 'Berat badan', 'purple'], ['exercise', 'dumbbell', 'Exercise', 'orange'], ['supplement', 'pill', 'Suplemen', 'green']].map(([act, i, text, color]) => `<button data-action="${act}" class="quick-log"><span class="metric-icon ${color}">${icon(i, '', 20)}</span><span>${text}</span>${icon('plus', '', 14)}</button>`).join('')}</div></section>
    ${sectionHead('Bacaan baik untukmu', 'Lihat semua', 'data-action="articles"')}
    <div class="article-filters">${['Semua', 'Gaya hidup', 'Daya tahan tubuh', 'Gerak & kebugaran'].map(c => `<button class="filter-pill ${state.articleCategory === c ? 'active' : ''}" data-article-filter="${c}">${c}</button>`).join('')}</div>
    <section class="articles-grid">${state.articles.filter(a => state.articleCategory === 'Semua' || a.category === state.articleCategory).slice(0, 3).map(articleCard).join('') || empty('Belum ada artikel', 'Artikel yang sudah ditinjau akan hadir di sini.')}</section>
    ${isPreview() ? '<p class="data-caption">Ringkasan dan bacaan pada pratinjau menggunakan data ilustrasi. Artikel contoh menunggu peninjauan.</p>' : ''}
  </div><aside class="dashboard-rail">
    <section class="card plan-summary"><div class="rail-title"><h2>Rencana hari ini</h2><span class="streak-chip">${icon('flame', '', 14)} ${isPreview() ? '7' : state.planDone.size} hari</span></div><p class="muted small">Sedikit konsisten, banyak perubahan.</p><div class="week-strip">${['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((d, i) => `<div class="${i === 6 ? 'today' : ''}"><span>${d}</span><b>${i < 5 ? icon('check', '', 13) : i === 6 ? '8' : '7'}</b></div>`).join('')}</div><div class="rail-divider"></div><div class="plan-items">${planItems(true)}</div><button class="button secondary full" data-go="plan">Lihat rencana sehat ${icon('arrow-right', '', 15)}</button></section>
    <section class="card hydration-card"><div class="rail-title"><h2>Waktunya minum</h2><span class="metric-icon blue small-icon">${icon('droplet', '', 17)}</span></div><p class="muted small">Beri tubuhmu jeda yang menyegarkan.</p><div class="water-value">${state.water}<span> / 8 gelas</span><small>Target contoh · sesuaikan kebutuhan</small></div><div class="water-glasses">${Array.from({ length: 8 }, (_, i) => `<span class="${i < state.water ? 'filled' : ''}">${icon('glass-water', '', 22)}</span>`).join('')}</div><button class="button secondary full" data-action="water">${icon('plus', '', 16)} Tambah satu gelas</button></section>
    <section class="discovery-card"><div class="discovery-icon">${icon('pill', '', 24)}</div>${badge('KENALI PILIHANMU', 'plain')}<h3>Yang tepat,<br>untuk kebutuhanmu.</h3><p>Jelajahi produk Darya Varia dan kenali manfaatnya.</p><button class="text-button" data-go="products">Jelajahi produk ${icon('arrow-up-right', '', 16)}</button><span class="discovery-leaf">${icon('leaf', '', 94)}</span></section>
    <div class="trust-note">${icon('shield-check', '', 23)}<p>Ruang aman untuk sehatmu.<br><span>Data pribadi tetap milikmu.</span></p></div>
  </aside></div>`;
}

function articleArt(type) {
  if (type === 'run') return `<div class="article-art run-art"><span class="art-sun"></span><span class="art-hill h1"></span><span class="art-hill h2"></span><svg viewBox="0 0 260 135" aria-hidden="true"><path d="M10 119C71 85 117 146 260 75" fill="none" stroke="#e6f0ce" stroke-width="23"/><circle cx="153" cy="35" r="9" fill="#e9b99b"/><path d="M148 48l-12 26 21 14" stroke="#245de7" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M140 57l-19-3-12-14M147 57l19 9 11-9" stroke="#e9b99b" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M140 76l-24 18-16 20M154 87l20 2 13 16" stroke="#1c2c42" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M98 114l-10 1M187 106l10 3" stroke="#fff" stroke-width="8" stroke-linecap="round"/></svg><span class="art-label">MOVE A LITTLE. FEEL BETTER.</span></div>`;
  if (type === 'water') return `<div class="article-art water-art"><span class="water-circle"></span><span class="water-ring"></span><svg viewBox="0 0 260 135" aria-hidden="true"><path d="M112 29h43l-4 86h-35z" fill="#ffffff" opacity=".8"/><path d="M116 62q19 9 35-3l-2 51h-31z" fill="#70b0f4"/><path d="M135 48l17-39" stroke="#f3c77d" stroke-width="4"/><ellipse cx="134" cy="29" rx="22" ry="4" fill="none" stroke="#fff" stroke-width="2"/><path d="M181 113c-13-32 8-40 21-54-1 24 5 44-21 54" fill="#629b74"/><path d="M181 113l15-42" stroke="#fff" fill="none"/></svg><span class="art-label">A LITTLE MOMENT TO REFRESH.</span></div>`;
  return `<div class="article-art balance-art"><span class="balance-disc"></span><span class="balance-shadow"></span><svg viewBox="0 0 260 135" aria-hidden="true"><ellipse cx="132" cy="108" rx="56" ry="12" fill="#d2bca2"/><rect x="98" y="69" width="69" height="34" rx="17" fill="#e5cbb7" transform="rotate(-8 130 80)"/><rect x="111" y="43" width="45" height="30" rx="15" fill="#f7f1e7" transform="rotate(10 130 60)"/><path d="M177 83c5-35 23-37 32-42-3 26-10 41-32 42" fill="#91a989"/><path d="M174 102l27-54" stroke="#617e59" fill="none" stroke-width="2"/></svg><span class="art-label">FIND YOUR EVERYDAY BALANCE.</span></div>`;
}
function articleCard(a) {
  return `<article class="article-card"><button class="article-cover" data-article="${esc(a.id)}" aria-label="Baca ${esc(a.title)}">${articleArt(a.art)}<span class="reading-badge">${a.read_time} menit baca</span></button><div class="article-card-body"><div class="article-meta"><span>${esc(a.category)}</span><button class="bookmark-button ${state.bookmarks.has(a.id) ? 'is-saved' : ''}" data-bookmark="${esc(a.id)}" aria-label="${state.bookmarks.has(a.id) ? 'Hapus simpanan' : 'Simpan artikel'} ${esc(a.title)}">${icon('bookmark', '', 17)}</button></div><button class="article-title" data-article="${esc(a.id)}"><h3>${esc(a.title)}</h3></button><p>${esc(a.summary)}</p></div></article>`;
}

const planTasks = [
  { id: 'breakfast', title: 'Sarapan penuh energi', sub: 'Awali hari dengan gizi seimbang', icon: 'sun', color: 'orange', time: '07.00' },
  { id: 'move', title: 'Bergerak 30 menit', sub: 'Jalan santai juga berarti', icon: 'footprints', color: 'blue', time: '16.00' },
  { id: 'rest', title: 'Istirahat yang cukup', sub: 'Beri waktu tubuh memulihkan diri', icon: 'moon', color: 'purple', time: '22.00' },
];
function planItems(compact = false) {
  return planTasks.map(t => `<div class="plan-item ${state.planDone.has(t.id) ? 'completed' : ''}"><span class="metric-icon ${t.color}">${icon(t.icon, '', 18)}</span><div><strong>${t.title}</strong><span>${compact ? t.time : t.sub}</span></div><button class="task-check ${state.planDone.has(t.id) ? 'checked' : ''}" data-task="${t.id}" aria-label="${state.planDone.has(t.id) ? 'Batalkan' : 'Selesaikan'} ${t.title}" aria-pressed="${state.planDone.has(t.id)}">${state.planDone.has(t.id) ? icon('check', '', 13) : ''}</button></div>`).join('');
}

function assistantPage() {
  return `${greeting('Ada yang ingin kamu ceritakan?', 'Darya siap menemani langkah sehatmu. Mulai dari hal yang paling kamu butuhkan.')}
  <div class="assistant-layout"><section class="card chat-card"><div class="chat-header"><span class="ai-avatar">${icon('sparkles', '', 23)}</span><div><h2>Darya AI ${badge('WELLNESS COMPANION', 'blue')}</h2><p><span class="online-dot"></span>${session ? 'Terhubung dengan profilmu' : 'Pratinjau pengalaman konsultasi'}</p></div><button class="icon-button" data-action="clear-chat" aria-label="Bersihkan percakapan">${icon('rotate-ccw', '', 18)}</button></div>
  <div class="chat-messages" id="chat-messages" role="log" aria-live="polite">${state.messages.length ? state.messages.map(messageHTML).join('') : `<div class="chat-welcome"><div class="welcome-orb">${icon('sparkles', '', 40)}</div><h2>Halo ${esc(name())}, aku Darya.</h2><p>Teman untuk mengenal kebutuhan tubuhmu<br>dan membangun kebiasaan yang lebih baik.</p><div class="prompt-grid">${[['shield-check', 'Jaga daya tahan tubuh'], ['sparkles', 'Kenali nutrisi kulit'], ['zap', 'Bangun rutinitas aktif'], ['utensils', 'Mulai makan seimbang']].map(([i, t]) => `<button data-prompt="${t}">${icon(i, '', 20)}<span>${t}</span>${icon('arrow-up-right', '', 15)}</button>`).join('')}</div></div>`}</div>
  <form class="chat-compose" id="chat-form"><div class="chat-input-row"><input id="chat-input" name="message" maxlength="2000" placeholder="Ceritakan tujuan sehatmu..." autocomplete="off" required aria-label="Pesan untuk Darya AI"/><button type="button" class="icon-button" data-action="voice" aria-label="Gunakan suara">${icon('mic', '', 20)}</button><button class="send-button" aria-label="Kirim pesan" ${state.loading ? 'disabled' : ''}>${icon(state.loading ? 'loader-circle' : 'arrow-up', state.loading ? 'spin' : '', 20)}</button></div><p>${icon('shield-check', '', 12)}${DISCLAIMER}</p></form></section>
  <aside class="assistant-rail"><section class="card"><div class="metric-icon blue">${icon('user-round', '', 21)}</div><h3>Lebih kenal, lebih personal.</h3><p class="muted">Lengkapi profilmu agar percakapan mempertimbangkan tujuan dan batas keamananmu.</p><button class="button secondary full" data-action="onboarding">${state.profile ? 'Perbarui profil sehat' : 'Lengkapi profil sehat'} ${icon('arrow-right', '', 16)}</button></section><section class="card safety-card">${icon('shield-check', '', 24)}<h3>Aman jadi prioritas.</h3><ul><li>Informasi, tanpa diagnosis.</li><li>Hanya OTC & suplemen terverifikasi.</li><li>Kondisi khusus diarahkan ke tenaga kesehatan.</li></ul></section>${state.remaining !== null ? `<div class="quota-note">${icon('messages-square', '', 17)} ${state.remaining} konsultasi tersisa hari ini</div>` : ''}</aside></div>`;
}
function messageHTML(m) {
  if (m.role === 'user') return `<div class="message user-message"><div>${esc(m.text)}</div><span class="message-avatar">${esc(name().slice(0, 1))}</span></div>`;
  return `<div class="message ai-message"><span class="message-ai-icon">${icon('sparkles', '', 17)}</span><div><div class="message-content">${esc(m.text).replaceAll('\n', '<br>')}</div>${m.products?.length ? `<div class="chat-recommendations">${m.products.map(p => `<div class="recommendation"><strong>${esc(p.name)}</strong><p>${esc(p.reason || '')}</p><p><b>Dosis:</b> ${esc(p.dosage)}</p><p><b>Perhatian:</b> ${esc(p.warnings)}</p><button class="text-button" data-product="${esc(p.id)}">Lihat informasi ${icon('arrow-right', '', 14)}</button><small>${DISCLAIMER}</small></div>`).join('')}</div>` : ''}${m.preview ? '<div class="message-label">Pratinjau alur · AI langsung belum terhubung</div>' : ''}</div></div>`;
}

function nutritionPage() {
  const total = consumed(); const macros = [['Protein', 'protein', 80, 'blue'], ['Karbohidrat', 'carbs', 250, 'orange'], ['Lemak', 'fat', 65, 'pink']];
  return `${greeting('Makan baik, rasakan bedanya.', 'Catat asupanmu tanpa perlu mengejar sempurna.', `<button class="button" data-action="food">${icon('plus', '', 18)} Catat makanan</button>`)}<div class="nutrition-layout"><div><section class="card nutrition-overview"><div><div class="eyebrow">ASUPAN HARI INI</div><h2>Setiap porsi punya cerita.</h2><p class="muted">Kenali pola makanmu, satu catatan setiap hari.</p>${progressRing(total / target() * 100, num(total), `dari ${num(target())} kkal`, 'nutrition-ring', 210)}<span class="estimation-label">${icon('info', '', 13)} Angka gizi merupakan estimasi</span></div><div class="macro-list">${macros.map(([title, key, max, color]) => { const n = state.foodLogs.reduce((s, f) => s + Number(f[key] || 0), 0); return `<div class="macro-item"><div><span class="macro-dot ${color}"></span><strong>${title}</strong><span>${Math.round(n)} <small>/ ${max} g</small></span></div><div class="small-progress ${color}"><span style="width:${Math.min(n / max * 100, 100)}%"></span></div></div>`; }).join('')}<div class="nutrition-tip">${icon('leaf', '', 24)}<p>Warna-warni di piringmu,<br>ragam kebaikan untuk tubuhmu.</p></div></div></section>
  ${sectionHead('Catatan makan hari ini', 'Tambah catatan', 'data-action="food"')}<section class="card food-log-list">${state.foodLogs.length ? state.foodLogs.map(f => `<div class="food-log-item"><span class="food-icon">${icon(f.icon || 'utensils', '', 24)}</span><div><small>${esc(f.meal || 'Makanan')} · ${esc(f.time || '')}${f.example ? ' · Contoh' : ''}</small><h3>${esc(f.name)}</h3><p>Estimasi · P ${Number(f.protein || 0)} g · K ${Number(f.carbs || 0)} g · L ${Number(f.fat || 0)} g</p></div><strong>${num(f.calories)}<small>kkal</small></strong>${!f.example ? `<button class="icon-button" data-remove-food="${esc(f.id)}" aria-label="Hapus ${esc(f.name)}">${icon('trash-2', '', 16)}</button>` : ''}</div>`).join('') : empty('Belum ada catatan hari ini', 'Mulai dari makanan pertama yang kamu nikmati.')}</section></div><aside>
  <section class="card"><h2>Caramu mencatat</h2><p class="muted small">Pilih yang paling nyaman untukmu.</p><div class="log-method-list">${[['food', 'text-cursor-input', 'Tulis bebas', 'Ceritakan isi piringmu'], ['photo', 'camera', 'Foto piring', 'Foto, periksa, lalu koreksi'], ['food-search', 'search', 'Manual cari', 'Pilih makanan & porsinya'], ['barcode', 'scan-barcode', 'Pindai barcode', 'Kenali makanan atau produk']].map(([act, i, title, sub]) => `<button data-action="${act}"><span class="metric-icon blue">${icon(i, '', 20)}</span><span><strong>${title}</strong><small>${sub}</small></span>${icon('chevron-right', '', 16)}</button>`).join('')}</div></section>
  <section class="card supplement-summary"><div class="rail-title"><h2>Suplemen harian</h2>${icon('pill', 'green-text', 21)}</div><p class="muted small">Catat sesuai petunjuk pada kemasan.</p>${state.supplements.length ? state.supplements.map(s => `<div class="supplement-log">${icon('circle-check', 'green-text', 18)}<span>${esc(s.name)}<small>${esc(s.time)}</small></span></div>`).join('') : '<div class="mini-empty">Belum ada catatan suplemen hari ini.</div>'}<button class="button secondary full" data-action="supplement">${icon('plus', '', 16)} Catat suplemen</button></section></aside></div>`;
}

function pastDayKeys(n) {
  const [y, m, d] = localDay().split('-').map(Number);
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  return out;
}
function chartPoints() {
  if (isPreview()) return { points: [], unit: '', note: 'Masuk untuk melihat tren dari catatanmu.' };
  const days = state.chartPeriod === 'Minggu' ? 7 : 30;
  const keys = pastDayKeys(days);
  const today = localDay();
  const labelFor = key => {
    const dt = new Date(`${key}T00:00:00+07:00`);
    return state.chartPeriod === 'Minggu'
      ? new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' }).format(dt)
      : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' }).format(dt);
  };
  if (state.chartMetric === 'Berat badan') {
    const byDay = new Map();
    for (const w of state.weights) byDay.set(w.date, Number(w.weight));
    const points = keys.filter(k => byDay.has(k)).map(k => ({ label: labelFor(k), value: byDay.get(k) }));
    return { points, unit: 'kg', note: points.length ? `Dari ${state.weights.length} catatan berat` : '' };
  }
  if (state.chartMetric === 'Kalori') {
    const total = state.foodLogs.reduce((s, f) => s + Number(f.calories || 0), 0);
    return { points: total > 0 ? [{ label: labelFor(today), value: total }] : [], unit: 'kkal', note: 'Catatan kalori hanya tersedia untuk hari ini' };
  }
  const minutes = state.exercises.reduce((s, e) => s + Number(e.minutes || 0), 0);
  return { points: minutes > 0 ? [{ label: labelFor(today), value: minutes }] : [], unit: 'menit', note: 'Catatan aktivitas hanya tersedia untuk hari ini' };
}
function chartSVG() {
  const { points } = chartPoints();
  if (!points.length) return '';
  const metric = state.chartMetric;
  const values = points.map(p => p.value);
  const max = Math.max(...values), min = Math.min(...values); const span = max - min || 1;
  const x = i => points.length === 1 ? 350 : 50 + i * (600 / (points.length - 1));
  const y = v => 205 - (v - min) / span * 140;
  const coords = points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
  return `<svg class="main-chart" viewBox="0 0 710 275" role="img" aria-label="${esc(metric)} ${esc(state.chartPeriod)}: ${points.length} titik data dari catatanmu"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2463eb" stop-opacity=".18"/><stop offset="1" stop-color="#2463eb" stop-opacity="0"/></linearGradient></defs>${[55, 105, 155, 205].map((gy, i) => `<line x1="50" x2="650" y1="${gy}" y2="${gy}" stroke="currentColor" opacity=".08"/><text x="10" y="${gy + 4}" fill="currentColor" opacity=".45" font-size="11">${Math.round(max - i * span / 3)}</text>`).join('')}${points.length > 1 ? `<polygon points="50,230 ${coords} 650,230" fill="url(#chartFill)"/><polyline points="${coords}" fill="none" stroke="#3474f6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : ''}${points.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="${i === points.length - 1 ? 6 : 4}" fill="${i === points.length - 1 ? '#2463eb' : 'var(--card)'}" stroke="#3474f6" stroke-width="2"/><text x="${x(i)}" y="260" text-anchor="middle" fill="currentColor" opacity=".45" font-size="11">${esc(p.label)}</text>`).join('')}</svg>`;
}
function insightsPage() {
  const metrics = state.profile ? bodyMetrics(state.profile) : { bmi: 22.6, bmr: 1432, tdee: 2219 };
  const chart = chartPoints();
  return `${greeting('Lihat seberapa jauh kamu melangkah.', 'Setiap catatan membantu kamu lebih mengenal diri sendiri.', `<button class="button secondary" data-action="export">${icon('download', '', 17)} Unduh data</button>`)}<div class="insights-top"><section class="card lifestyle-card">${progressRing(score(), score(), 'Skor gaya hidup', '', 142)}<div><span class="eyebrow">KEBIASAAN BAIKMU</span><h2>Terus bertumbuh,<br>setiap hari.</h2><p class="muted">Indikator kebiasaan, bukan penilaian medis.</p></div></section><section class="card insight-stat"><span class="metric-icon purple">${icon('ruler', '', 22)}</span><span>Indeks massa tubuh</span><strong>${metrics.bmi}<small> BMI</small></strong><p>Indikator umum untuk orang dewasa</p></section><section class="card insight-stat"><span class="metric-icon orange">${icon('flame', '', 22)}</span><span>Estimasi energi harian</span><strong>${num(metrics.tdee)}<small> kkal</small></strong><p>BMR ${num(metrics.bmr)} kkal · Mifflin-St Jeor</p></section></div>
  <div class="insights-grid"><section class="card chart-card"><div class="rail-title"><div><h2>Tren kesehatanmu</h2><p class="muted small">${chart.note || 'Dari catatanmu'}</p></div><div class="segmented">${['Minggu', 'Bulan'].map(p => `<button data-period="${p}" class="${state.chartPeriod === p ? 'active' : ''}">${p}</button>`).join('')}</div></div><div class="chart-tabs">${['Berat badan', 'Kalori', 'Aktivitas'].map(m => `<button data-metric="${m}" class="${state.chartMetric === m ? 'active' : ''}">${m}</button>`).join('')}</div>${chart.points.length ? chartSVG() : empty('Belum ada catatan', isPreview() ? 'Masuk untuk melihat tren dari catatanmu.' : `Belum ada catatan ${state.chartMetric.toLowerCase()} pada periode ini.`, `<button class="button secondary" data-action="${state.chartMetric === 'Berat badan' ? 'weight' : state.chartMetric === 'Kalori' ? 'food' : 'exercise'}">Catat sekarang</button>`)}<div class="chart-caption"><span><b></b>${state.chartMetric}</span><small>${chart.points.length ? `Terakhir: ${num(chart.points.at(-1).value)} ${chart.unit} · ${esc(chart.points.at(-1).label)}` : 'Belum ada data pada periode ini'}</small></div></section><section class="card"><h2>Catatan berat badan</h2><p class="muted small">Perubahan kecil juga kemajuan.</p>${state.weights.length ? state.weights.slice(-5).reverse().map(w => `<div class="weight-row"><span>${esc(w.date)}</span><strong>${w.weight} kg</strong></div>`).join('') : empty('Mulai catatan pertamamu', 'Kenali pola dari waktu ke waktu.')}<button class="button secondary full" data-action="weight">${icon('plus', '', 16)} Catat berat</button></section></div><section class="card achievement-banner"><span class="achievement-icon">${icon('award', '', 37)}</span><div><div class="eyebrow">RAYAKAN LANGKAH KECIL</div><h2>Konsistensi layak dirayakan.</h2><p class="muted">Bagikan pencapaianmu, dengan privasi tetap terjaga.</p></div><button class="button" data-action="share">${icon('share-2', '', 17)} Buat kartu pencapaian</button></section>`;
}

function productVisual(p, large = false) {
  return `<div class="product-visual ${p.color || 'blue'} ${large ? 'large' : ''}"><div class="product-orbit"></div><div class="product-pack"><span class="pack-top">DARYA VARIA</span><strong>${esc(p.brand || p.name)}</strong><span class="pack-variant">${esc(p.variant || p.form || '')}</span><span class="pack-line"></span><span class="pack-bottom">ILUSTRASI PRODUK</span></div><span class="product-symbol">${icon(p.icon || 'pill', '', large ? 58 : 35)}</span></div>`;
}
function productCard(p) {
  return `<article class="card product-card"><button class="product-cover" data-product="${esc(p.id)}" aria-label="Lihat ${esc(p.name)}">${productVisual(p)}<span class="product-kind">${p.kind === 'prescription' ? 'Resep dokter' : esc(p.category)}</span></button><div class="product-body"><div class="product-meta">${esc(p.form || 'Informasi produk')}${p.verified ? `<span>${icon('badge-check', '', 13)} Terverifikasi</span>` : '<span>Pratinjau</span>'}</div><h3>${esc(p.name)}</h3><p>${esc(p.subtitle || p.benefits || '')}</p><button class="button secondary full" data-product="${esc(p.id)}">Kenali produk ${icon('arrow-up-right', '', 16)}</button></div></article>`;
}
function productsPage() {
  const filtered = state.products.filter(p => (state.category === 'Semua' || p.category === state.category) && `${p.name} ${p.subtitle || ''} ${p.category}`.toLowerCase().includes(state.search.toLowerCase()));
  return `${greeting('Kenali pilihan untuk kebutuhanmu.', 'Informasi yang jelas membantu kamu memilih dengan lebih bijak.')}<section class="catalog-banner"><span class="catalog-banner-icon">${icon('pill', '', 35)}</span><div><span class="eyebrow">DARYA VARIA CONSUMER HEALTH</span><h2>Kebaikan yang dimulai dari memahami.</h2><p>Nutrisi kulit, daya tahan tubuh, dan keseharian yang lebih aktif.</p></div>${icon('sparkles', 'catalog-spark', 45)}</section><div class="catalog-controls"><div class="filter-list">${['Semua', 'Vitamin', 'Nutrisi kulit', 'Pernapasan', 'Pertolongan harian'].map(c => `<button class="filter-pill ${state.category === c ? 'active' : ''}" data-category="${c}">${c}</button>`).join('')}</div><label class="search-box">${icon('search', '', 18)}<input id="product-search" placeholder="Cari nama produk..." value="${esc(state.search)}" aria-label="Cari nama produk"/></label></div><div class="result-count">${filtered.length} produk ${isPreview() ? 'dalam pratinjau' : 'ditemukan'}<span>${icon('sliders-horizontal', '', 14)} Sesuai kategori pilihanmu</span></div><section class="products-grid">${filtered.length ? filtered.map(productCard).join('') : empty('Belum ada produk yang sesuai', 'Coba kata kunci lain atau pilih kategori Semua.', '<button class="button secondary" data-action="reset-products">Reset pencarian</button>')}</section><div class="catalog-disclaimer">${icon('shield-check', '', 22)}<p>${isPreview() ? 'Katalog ini adalah pratinjau desain. Komposisi, dosis, peringatan, dan tautan pemesanan menunggu data resmi yang terverifikasi.' : DISCLAIMER} Produk resep tidak pernah direkomendasikan oleh Darya AI.</p></div>`;
}

function planPage() {
  return `${greeting('Sehat itu perjalanan, bukan perlombaan.', 'Bangun rencana yang terasa pas untuk keseharianmu.', `<button class="button secondary" data-action="onboarding">${icon('sliders-horizontal', '', 17)} Sesuaikan tujuan</button>`)}<div class="plan-layout"><section class="card month-plan"><div class="eyebrow">RENCANA 30 HARI</div><h2>Satu hari lebih baik.<br>Satu langkah lebih dekat.</h2><p class="muted">Mulai dengan tiga kebiasaan sederhana. Evaluasi bagaimana tubuhmu terasa setiap minggu.</p><div class="month-days">${Array.from({ length: 30 }, (_, i) => `<span class="${i < state.planDone.size ? 'done' : ''} ${i === state.planDone.size ? 'current' : ''}">${i < state.planDone.size ? icon('check', '', 16) : i + 1}</span>`).join('')}</div><div class="plan-completion"><span>Langkah hari ini</span><strong>${state.planDone.size} dari 3 selesai</strong></div><div class="small-progress blue"><span style="width:${state.planDone.size / 3 * 100}%"></span></div><small class="muted">Rencana kebiasaan umum · sesuaikan dengan kemampuanmu.</small></section><section class="card daily-plan"><div class="rail-title"><h2>Hari ini untuk dirimu</h2>${badge('HARI 1')}</div><div class="plan-items">${planItems()}</div><div class="plan-advice">${icon('heart-handshake', '', 27)}<h3>Pelan-pelan juga sampai.</h3><p>Tidak apa-apa kalau hari ini belum semua. Kamu bisa mencoba lagi besok.</p></div><button class="button full" data-action="share">${icon('share-2', '', 17)} Rayakan kemajuanmu</button></section></div><section class="card supplement-plan"><div class="metric-icon green">${icon('pill', '', 24)}</div><div><h3>Rencana suplemenmu</h3><p class="muted">Rencana konsumsi mengikuti dosis resmi produk terverifikasi, setelah profil keamanan ditinjau.</p></div><button class="button secondary" data-go="assistant">Konsultasikan dulu ${icon('arrow-up-right', '', 16)}</button></section>`;
}
function savedPage() {
  const saved = state.articles.filter(a => state.bookmarks.has(a.id));
  return `${greeting('Simpan yang baik untuk nanti.', 'Ruang kecil untuk bacaan yang ingin kamu kunjungi kembali.')}<section class="articles-grid saved-grid">${saved.length ? saved.map(articleCard).join('') : empty('Belum ada artikel tersimpan', 'Tekan ikon bookmark pada bacaan yang kamu suka.', '<button class="button" data-go="home">Temukan bacaan</button>')}</section>`;
}
function socialRow(platform, label, iconName) {
  const acc = (state.connected_accounts || []).find(a => a.platform === platform && a.status !== 'disconnected');
  const connectedAt = acc?.connected_at ? new Date(acc.connected_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  if (acc) return `<div class="setting-row"><span class="metric-icon neutral">${icon(iconName, '', 21)}</span><span><strong>${label}</strong><small>Terhubung${connectedAt ? ` · ${connectedAt}` : ''}</small></span>${badge('TERHUBUNG', 'green')}<button class="button secondary social-connect" data-social-disconnect="${platform}">Putuskan</button></div>`;
  return `<div class="setting-row"><span class="metric-icon neutral">${icon(iconName, '', 21)}</span><span><strong>${label}</strong><small>${session ? 'Belum terhubung' : 'Masuk terlebih dahulu untuk menghubungkan'}</small></span><button class="button secondary social-connect" data-social-connect="${platform}">Hubungkan</button></div>`;
}
async function connectSocial(platform) {
  try {
    const data = await api(`social/${platform}`, { method: 'POST' });
    if (data?.url) location.href = data.url;
    else toast('Tautan penyambungan belum tersedia.', 'error');
  } catch (err) { toast(err.message, 'error'); }
}
async function disconnectSocial(platform) {
  try {
    await api(`social/${platform}`, { method: 'DELETE' });
    state.connected_accounts = (state.connected_accounts || []).filter(a => a.platform !== platform);
    shell(); toast(`Akun ${platform === 'instagram' ? 'Instagram' : 'Threads'} diputuskan.`);
  } catch (err) { toast(err.message, 'error'); }
}
function handleSocialCallback() {
  const params = new URLSearchParams(location.search);
  const connected = params.get('social_connected');
  const error = params.get('social_error');
  if (!connected && !error) return;
  if (connected) toast(`${connected === 'instagram' ? 'Instagram' : connected === 'threads' ? 'Threads' : connected} terhubung.`);
  else toast(error, 'error');
  history.replaceState(null, '', location.pathname + location.hash);
}
function profilePage() {
  return `${greeting('Ruang yang sepenuhnya milikmu.', 'Atur profil, tampilan, dan privasimu dengan nyaman.')}<div class="profile-layout"><section class="card profile-overview"><span class="avatar profile-avatar">${esc(name().slice(0, 1))}</span><h2>${session ? esc(state.profile?.name || 'Profil sehatmu') : 'Halo, Sahabat'}</h2><p>${session ? esc(session.user.email) : 'Mulai perjalanan sehat yang lebih personal.'}</p>${session ? badge('AKUN TERHUBUNG', 'green') : badge('PRATINJAU APLIKASI')}<button class="button full" data-action="${session ? 'onboarding' : 'login'}">${icon(session ? 'user-round-pen' : 'log-in', '', 17)} ${session ? 'Edit profil sehat' : 'Masuk / Buat akun'}</button><div class="profile-note">${icon('shield-check', '', 18)}Data kesehatan tidak disimpan di browser saat pratinjau.</div></section><div class="settings-groups"><section class="card"><h2>Personalisasi</h2><button class="setting-row" data-action="onboarding"><span class="metric-icon blue">${icon('clipboard-list', '', 20)}</span><span><strong>Profil & tujuan sehat</strong><small>${state.profile ? 'Perbarui 6 langkah profilmu' : 'Kenalan lebih dekat dalam 6 langkah'}</small></span>${icon('chevron-right', '', 17)}</button><div class="setting-row"><span class="metric-icon purple">${icon('paintbrush', '', 20)}</span><span><strong>Tampilan aplikasi</strong><small>Pilih suasana yang nyaman di mata</small></span><div class="segmented">${['light', 'dark'].map(t => `<button data-theme="${t}" class="${state.theme === t ? 'active' : ''}" aria-label="Tema ${t === 'light' ? 'terang' : 'gelap'}">${icon(t === 'light' ? 'sun' : 'moon', '', 17)}</button>`).join('')}</div></div></section><section class="card"><h2>Privasi & data</h2><button class="setting-row" data-action="export"><span class="metric-icon green">${icon('download', '', 20)}</span><span><strong>Unduh datamu</strong><small>Salinan catatanmu dalam format JSON</small></span>${icon('chevron-right', '', 17)}</button><button class="setting-row" data-action="privacy"><span class="metric-icon blue">${icon('shield-check', '', 20)}</span><span><strong>Privasi & keamanan</strong><small>Ketahui bagaimana datamu digunakan</small></span>${icon('chevron-right', '', 17)}</button><button class="setting-row" data-action="delete-account"><span class="metric-icon pink">${icon('trash-2', '', 20)}</span><span><strong class="danger-text">Hapus akun & data</strong><small>Kamu memegang kendali atas datamu</small></span>${icon('chevron-right', '', 17)}</button></section><section class="card"><h2>Akun terhubung</h2><p class="muted small">Bagikan pencapaian lewat share sheet perangkat saat ini.</p>${socialRow('instagram', 'Instagram', 'instagram')}${socialRow('threads', 'Threads', 'at-sign')}</section>${session ? '<button class="button secondary" data-action="logout">Keluar dari akun</button>' : ''}</div></div>`;
}

function go(route) { if (state.route === route) { shell(); window.scrollTo(0, 0); } else location.hash = route; }
window.addEventListener('hashchange', () => { state.route = location.hash.slice(1).split('?')[0] || 'home'; shell(); window.scrollTo(0, 0); if (location.hash.includes('recovery=1')) recoveryModal(); });

function openModal(content, { wide = false, title = 'Daryapedia', className = '' } = {}) {
  if (modalCleanup) modalCleanup();
  modalFocus = document.activeElement;
  overlay.innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? 'modal-wide' : ''} ${className}" role="dialog" aria-modal="true" aria-label="${esc(title)}" tabindex="-1"><button class="modal-close icon-button" data-action="close-modal" aria-label="Tutup">${icon('x', '', 21)}</button>${content}</section></div>`;
  document.body.classList.add('modal-open'); hydrateIcons();
  const first = overlay.querySelector('input:not([type="hidden"]), select, textarea, button:not(.modal-close)');
  requestAnimationFrame(() => (first || overlay.querySelector('.modal')).focus());
}
function closeModal() {
  if (modalCleanup) { modalCleanup(); modalCleanup = null; }
  overlay.innerHTML = ''; document.body.classList.remove('modal-open'); modalFocus?.focus();
}
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector('#global-search')?.focus(); }
  if (!overlay.children.length) return;
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key === 'Tab') {
    const focusable = [...overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), select, textarea, a[href], [tabindex="0"]')].filter(el => el.offsetParent !== null);
    const first = focusable[0], last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
});
overlay.addEventListener('click', e => { if (e.target.classList.contains('modal-backdrop')) closeModal(); });

function setTheme(theme) {
  state.theme = theme; document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('darya-theme', theme); } catch { /* Private browsing may disable storage. */ }
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0a1120' : '#2463eb'; shell();
}

function bindPageInputs() {
  document.querySelector('#global-search')?.addEventListener('keydown', e => { if (e.key === 'Enter') { state.search = e.target.value; go('products'); } });
  document.querySelector('#product-search')?.addEventListener('input', e => { const pos = e.target.selectionStart; state.search = e.target.value; shell(); const input = document.querySelector('#product-search'); input.focus(); input.setSelectionRange(pos, pos); });
  document.querySelector('#chat-form')?.addEventListener('submit', e => { e.preventDefault(); sendMessage(new FormData(e.target).get('message')); });
  const messages = document.querySelector('#chat-messages'); if (messages && state.messages.length) messages.scrollTop = messages.scrollHeight;
}

document.addEventListener('click', async e => {
  const el = e.target.closest('button, a[data-action]'); if (!el) return;
  if (el.dataset.go) { closeModal(); go(el.dataset.go); }
  if (el.dataset.theme) setTheme(el.dataset.theme);
  if (el.dataset.category) { state.category = el.dataset.category; shell(); }
  if (el.dataset.articleFilter) { state.articleCategory = el.dataset.articleFilter; shell(); }
  if (el.dataset.period) { state.chartPeriod = el.dataset.period; shell(); }
  if (el.dataset.metric) { state.chartMetric = el.dataset.metric; shell(); }
  if (el.dataset.article) articleModal(el.dataset.article);
  if (el.dataset.bookmark) await toggleBookmark(el.dataset.bookmark);
  if (el.dataset.product) productModal(el.dataset.product);
  if (el.dataset.prompt) await sendMessage(el.dataset.prompt);
  if (el.dataset.task) {
    const id = el.dataset.task, done = !state.planDone.has(id);
    try { if (session) await api('habit', { method: 'POST', body: { id, done } }); done ? state.planDone.add(id) : state.planDone.delete(id); shell(); if (done) toast('Satu langkah baik tercatat. Teruskan!'); } catch (err) { toast(err.message, 'error'); }
  }
  if (el.dataset.removeFood) {
    try { if (session) await api(`logs/food/${encodeURIComponent(el.dataset.removeFood)}`, { method: 'DELETE' }); state.foodLogs = state.foodLogs.filter(f => f.id !== el.dataset.removeFood); shell(); toast('Catatan dihapus.'); } catch (err) { toast(err.message, 'error'); }
  }
  if (el.dataset.socialConnect) { await connectSocial(el.dataset.socialConnect); return; }
  if (el.dataset.socialDisconnect) { await disconnectSocial(el.dataset.socialDisconnect); return; }
  if (!el.dataset.action) return;
  const actions = {
    theme: () => setTheme(state.theme === 'light' ? 'dark' : 'light'), 'close-modal': closeModal,
    notifications: notificationsModal, 'quick-add': quickAddModal, food: () => foodModal('text'), 'food-search': () => foodModal('search'),
    photo: photoModal, barcode: barcodeModal, weight: weightModal, exercise: exerciseModal, supplement: supplementModal,
    onboarding: () => { onboardingDraft = structuredClone(state.profile || { name: '', age: '', sex: 'female', activity: 'moderate', weight: '', height: '', goals: [], safety: {}, sleep: 7, exercise: 'sometimes', stress: 'moderate', form: 'Tablet', consent: false }); onboardingStep = 0; onboardingModal(); },
    login: () => authModal(), 'google-login': async () => { try { await googleSignIn(); } catch (err) { toast(err.message, 'error'); } },
    privacy: privacyModal, export: exportData, share: shareModal, 'delete-account': deleteModal,
    articles: () => { state.articleCategory = 'Semua'; openModal(`<div class="modal-heading"><span class="eyebrow">RUANG BACA</span><h2>Bacaan baik untukmu.</h2><p>Ide sederhana untuk keseharian yang lebih sehat.</p></div><div class="articles-grid modal-articles">${state.articles.map(articleCard).join('')}</div>`, { wide: true, title: 'Semua artikel' }); },
    water: async () => { try { if (session) await api('water', { method: 'POST', body: { glasses: state.water + 1 } }); state.water += 1; shell(); toast('Satu gelas tercatat. Sesuaikan minum dengan kebutuhanmu.'); } catch (err) { toast(err.message, 'error'); } },
    'clear-chat': () => { state.messages = []; shell(); },
    'reset-products': () => { state.category = 'Semua'; state.search = ''; shell(); },
    voice: voiceInput,
    logout: async () => { await supabase?.auth.signOut(); state.profile = null; state.foodLogs = [...previewFoodLogs]; state.messages = []; state.weights = []; state.exercises = []; state.supplements = []; state.connected_accounts = []; state.bookmarks.clear(); state.planDone.clear(); state.water = 5; shell(); toast('Kamu sudah keluar.'); },
  };
  if (actions[el.dataset.action]) await actions[el.dataset.action]();
});

async function sendMessage(text) {
  if (!String(text || '').trim() || state.loading) return;
  state.messages.push({ role: 'user', text: String(text).trim() }); state.loading = true; shell();
  try {
    if (!session) {
      const safety = safetyCheck(state.profile, text);
      state.messages.push({ role: 'assistant', preview: true, text: !state.profile ? 'Hai, aku Darya. Untuk mengenal tujuan dan batas keamananmu, lengkapi profil sehat melalui tombol di samping. Ini pratinjau pengalaman; konsultasi AI personal tersedia setelah layanan dihubungkan dan kamu masuk. Tidak ada rekomendasi produk yang diberikan dalam pratinjau.' : !safety.allowed ? safety.message : `Terima kasih sudah bercerita, ${name()}. Profil sehatmu sudah siap untuk pengalaman yang lebih personal. Di versi terhubung, aku akan membaca tujuanmu, memeriksa batas keamanan, dan hanya memakai katalog yang terverifikasi. Masuk ke akun untuk menggunakan konsultasi AI langsung.` });
    } else {
      const data = await api('consult', { method: 'POST', body: { message: String(text).trim(), history: state.messages.slice(-6).map(m => ({ role: m.role, text: m.text })) } });
      state.messages.push({ role: 'assistant', text: data.message, products: data.products }); state.remaining = data.remaining;
    }
  } catch (err) { state.messages.push({ role: 'assistant', text: err.message }); }
  finally { state.loading = false; shell(); }
}

function quickAddModal() {
  openModal(`<div class="modal-heading"><span class="eyebrow">SATU CATATAN, SATU LANGKAH</span><h2>Apa yang ingin kamu catat?</h2><p>Hal kecil hari ini layak kamu perhatikan.</p></div><div class="quick-add-options">${[['food', 'utensils', 'Makanan', 'Catat isi piringmu', 'blue'], ['weight', 'scale', 'Berat badan', 'Kenali perubahanmu', 'purple'], ['exercise', 'dumbbell', 'Exercise', 'Rayakan gerakmu', 'orange'], ['supplement', 'pill', 'Suplemen', 'Catat rutinitas harian', 'green']].map(([act, i, title, sub, color]) => `<button data-action="${act}"><span class="metric-icon ${color}">${icon(i, '', 24)}</span><strong>${title}</strong><small>${sub}</small></button>`).join('')}</div>`, { title: 'Catat aktivitas' });
}

function notificationsModal() {
  state.notificationsRead = true; shell();
  openModal(`<div class="modal-heading"><span class="eyebrow">SEBUAH PENGINGAT KECIL</span><h2>Waktu untuk dirimu.</h2></div><div class="notification-item"><span class="metric-icon blue">${icon('droplets', '', 22)}</span><div><h3>Sudah minum hari ini?</h3><p>Ambil jeda sebentar dan dengarkan kebutuhan tubuhmu.</p><small>Pengingat di dalam aplikasi</small></div></div><div class="notification-item"><span class="metric-icon purple">${icon('moon', '', 22)}</span><div><h3>Istirahat juga produktif.</h3><p>Usahakan jam tidur yang konsisten dan sesuai kebutuhanmu.</p><small>Pengingat di dalam aplikasi</small></div></div><p class="form-note">Pengingat ini tampil saat aplikasi dibuka. Notifikasi perangkat belum diaktifkan.</p>`, { title: 'Notifikasi' });
}

async function toggleBookmark(id) {
  const value = !state.bookmarks.has(id);
  try { if (session) await api('bookmark', { method: 'POST', body: { article_id: id, saved: value } }); value ? state.bookmarks.add(id) : state.bookmarks.delete(id); shell(); toast(value ? (session ? 'Artikel disimpan.' : 'Disimpan untuk sesi pratinjau ini.') : 'Artikel dihapus dari simpanan.'); if (overlay.querySelector('.article-reader')) articleModal(id); }
  catch (err) { toast(err.message, 'error'); }
}

function articleModal(id) {
  const a = state.articles.find(a => a.id === id); if (!a) return;
  openModal(`<article class="article-reader">${articleArt(a.art)}<div class="article-reader-body"><div class="article-meta">${badge(esc(a.category))}<span>${a.read_time} menit baca</span></div><h2>${esc(a.title)}</h2><p class="article-deck">${esc(a.summary)}</p>${!a.reviewed ? '<div class="notice">Contoh konten untuk pratinjau desain. Menunggu peninjauan sebelum diterbitkan.</div>' : ''}${(Array.isArray(a.body) ? a.body : [a.body]).map(p => `<p>${esc(p)}</p>`).join('')}<div class="reader-actions"><button class="button secondary" data-bookmark="${esc(a.id)}">${icon('bookmark', '', 17)} ${state.bookmarks.has(a.id) ? 'Tersimpan' : 'Simpan artikel'}</button><button class="button secondary" id="share-article">${icon('share-2', '', 17)} Bagikan</button></div>${a.related_products?.length ? `<div class="related-products"><h3>Kenali juga</h3><p class="muted small">Informasi produk terkait, bukan rekomendasi personal.</p>${a.related_products.map(id => { const p = state.products.find(p => p.id === id); return p ? `<button data-product="${esc(p.id)}">${icon('pill', '', 17)}${esc(p.name)}${icon('arrow-up-right', '', 16)}</button>` : ''; }).join('')}</div>` : ''}</div></article>`, { title: a.title, className: 'reader-modal' });
  document.querySelector('#share-article').onclick = async () => { try { if (navigator.share) await navigator.share({ title: a.title, text: `${a.title} — Daryapedia`, url: location.origin }); else { await navigator.clipboard.writeText(`${a.title}\n${location.origin}`); toast('Judul dan tautan disalin.'); } } catch (err) { if (err.name !== 'AbortError') toast('Berbagi belum tersedia di perangkat ini.', 'error'); } };
}

function productModal(id) {
  const p = state.products.find(p => p.id === id); if (!p) return;
  openModal(`<div class="product-detail">${productVisual(p, true)}<div class="product-detail-body"><div class="product-meta">${badge(esc(p.category))}<span>${p.verified ? 'Data terverifikasi' : 'Ilustrasi · data belum terverifikasi'}</span></div><h2>${esc(p.name)}</h2><p class="muted">${esc(p.subtitle || p.benefits || '')}</p><dl><div><dt>Komposisi</dt><dd>${esc(p.composition || 'Menunggu data resmi terverifikasi.')}</dd></div><div><dt>Manfaat</dt><dd>${esc(p.benefits || 'Informasi lengkap akan tersedia setelah verifikasi katalog.')}</dd></div><div><dt>Dosis & cara konsumsi</dt><dd>${esc(p.dosage || 'Belum tersedia. Jangan menentukan dosis dari pratinjau ini.')}</dd></div><div><dt>Peringatan</dt><dd>${esc(p.warnings || 'Baca kemasan dan konsultasikan dengan apoteker, terutama bila memiliki kondisi khusus.')}</dd></div></dl><div class="notice">${icon('shield-check', '', 18)}${DISCLAIMER}</div><button class="button full" id="order-product" ${!p.order_url || !p.verified || p.kind === 'prescription' ? 'disabled' : ''}>${icon('external-link', '', 17)} ${p.order_url && p.verified && p.kind !== 'prescription' ? 'Pesan melalui kanal resmi' : 'Link resmi belum tersedia'}</button><p class="form-note">Pembelian dilakukan di luar Daryapedia. Tidak ada checkout di aplikasi.</p></div></div>`, { title: p.name });
  document.querySelector('#order-product').onclick = async () => { const win = window.open('about:blank', '_blank'); try { const result = await api('order-click', { method: 'POST', body: { product_id: p.id, source: state.route === 'assistant' ? 'consultation' : 'catalogue' } }); if (win) { win.opener = null; win.location.replace(result.url); } else location.assign(result.url); } catch (err) { win?.close(); toast(err.message, 'error'); } };
}

const field = (label, input, hint = '') => `<label class="form-field"><span>${label}</span>${input}${hint ? `<small>${hint}</small>` : ''}</label>`;
const input = (name, value = '', extra = '') => `<input name="${name}" value="${esc(value ?? '')}" ${extra}/>`;
const select = (name, value, options) => `<select name="${name}">${options.map(([v, t]) => `<option value="${v}" ${value === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
const modalHead = (eyebrow, title, sub = '') => `<div class="modal-heading"><span class="eyebrow">${eyebrow}</span><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;

function onboardingModal() {
  const p = onboardingDraft;
  const steps = ['Kenalan dulu', 'Tubuh & target', 'Tujuan sehatmu', 'Utamakan keamanan', 'Keseharianmu', 'Pilihan untukmu'];
  const subtitles = ['Sedikit tentang dirimu untuk perjalanan yang lebih personal.', 'Untuk menghitung estimasi kebutuhan energi, bukan penilaian medis.', 'Pilih maksimal dua hal yang paling berarti untukmu.', 'Jawaban ini wajib. Tidak perlu menuliskan detail medis.', 'Kebiasaan sehari-hari membantu Darya memahami ritmemu. Opsional.', 'Preferensi memudahkan pilihan. Kamu bisa mengubahnya nanti.'];
  let content = '';
  if (onboardingStep === 0) content = `${field('Nama panggilan', input('name', p.name, 'required maxlength="80" placeholder="Kami boleh panggil kamu siapa?"'))}<div class="form-grid">${field('Usia', input('age', p.age, 'type="number" min="18" max="100" required placeholder="Tahun"'))}${field('Jenis kelamin biologis', select('sex', p.sex, [['female', 'Perempuan'], ['male', 'Laki-laki']]), 'Digunakan pada rumus energi.')}</div>${field('Pekerjaan (opsional)', input('occupation', p.occupation, 'maxlength="80" placeholder="Contoh: pekerja kantoran"'))}${field('Pola kerja (opsional)', select('shift', p.shift || 'regular', [['regular', 'Jam kerja teratur'], ['shift', 'Bekerja shift'], ['flexible', 'Fleksibel']]))}${field('Aktivitas harian', select('activity', p.activity, [['low', 'Rendah · lebih banyak duduk'], ['moderate', 'Sedang · cukup bergerak'], ['high', 'Tinggi · sering aktif']]))}`;
  if (onboardingStep === 1) content = `<div class="form-grid">${field('Berat badan (kg)', input('weight', p.weight, 'type="number" step="0.1" min="25" max="350" required placeholder="65"'))}${field('Tinggi badan (cm)', input('height', p.height, 'type="number" step="0.1" min="100" max="250" required placeholder="165"'))}</div>${field('Target berat (opsional, kg)', input('targetWeight', p.targetWeight, 'type="number" min="25" max="350" step="0.1" placeholder="Boleh dikosongkan"'))}<div class="notice">${icon('heart', '', 20)}Angka hanyalah salah satu bagian dari dirimu. Fokus kita adalah kebiasaan yang mendukung kesehatan.</div>`;
  if (onboardingStep === 2) content = `<div class="goal-options">${goals.map(g => `<label class="goal-option"><input type="checkbox" name="goals" value="${g.id}" ${p.goals.includes(g.id) ? 'checked' : ''}/><span>${icon(g.icon, '', 23)}<strong>${g.name}</strong>${icon('check', 'goal-check', 16)}</span></label>`).join('')}</div><p class="form-error" id="goal-error" role="alert"></p>`;
  if (onboardingStep === 3) content = `${[['allergy', 'Ada alergi obat atau makanan?'], ['condition', 'Ada kondisi kesehatan yang sedang dialami?'], ['medication', 'Sedang mengonsumsi obat rutin?'], ['pregnancy', 'Sedang hamil atau menyusui?', 'Pilih Tidak jika tidak berlaku untukmu.'], ['restriction', 'Ada pantangan bahan tertentu?']].map(([key, text, hint]) => `<fieldset class="safety-question"><legend>${text}</legend>${hint ? `<small>${hint}</small>` : ''}<div>${[['no', 'Tidak'], ['yes', 'Ya'], ['unsure', 'Belum yakin']].map(([v, label]) => `<label><input type="radio" name="${key}" value="${v}" ${p.safety[key] === v ? 'checked' : ''} required/><span>${label}</span></label>`).join('')}</div></fieldset>`).join('')}<div class="notice">${icon('shield-check', '', 20)}Jika ada risiko atau jawaban belum pasti, Darya akan mengarahkanmu ke apoteker atau dokter tanpa rekomendasi produk.</div>`;
  if (onboardingStep === 4) content = `${field('Pola makan', select('diet', p.diet || 'mixed', [['mixed', 'Beragam / tidak khusus'], ['vegetarian', 'Vegetarian'], ['other', 'Lainnya']]))}${field('Frekuensi olahraga', select('exercise', p.exercise, [['rarely', 'Jarang'], ['sometimes', '1–3 kali per minggu'], ['often', '4 kali atau lebih per minggu']]))}${field('Rata-rata tidur (jam)', input('sleep', p.sleep, 'type="number" min="1" max="14" step="0.5"'))}${field('Tingkat stres', select('stress', p.stress, [['low', 'Rendah'], ['moderate', 'Sedang'], ['high', 'Tinggi']]))}${field('Anggaran suplemen / bulan (opsional)', select('budget', p.budget || '', [['', 'Belum menentukan'], ['low', 'Di bawah Rp100.000'], ['medium', 'Rp100.000–250.000'], ['high', 'Di atas Rp250.000']]))}`;
  if (onboardingStep === 5) content = `${field('Bentuk sediaan yang disukai', select('form', p.form, [['Tablet', 'Tablet'], ['Kapsul', 'Kapsul'], ['Sirup', 'Sirup'], ['Effervescent', 'Effervescent'], ['Gummy', 'Gummy'], ['Bebas', 'Tidak ada preferensi']]))}${field('Produk yang pernah dipakai (opsional)', input('previousProducts', p.previousProducts, 'maxlength="150" placeholder="Contoh: Natur-E, Enervon-C"'))}<div class="onboarding-summary"><h3>Ini awal perjalananmu.</h3><div>${Object.entries(bodyMetrics(p) || {}).map(([k, v]) => `<span><small>${k.toUpperCase()}</small><strong>${num(v)}</strong></span>`).join('')}</div><p>Estimasi untuk orang dewasa. Target energi dapat berbeda sesuai kondisi dan kebutuhan individu.</p></div><label class="checkbox-field"><input type="checkbox" name="consent" required ${p.consent ? 'checked' : ''}/><span>Saya menyetujui pemrosesan profil kesehatan untuk personalisasi dan memahami <button type="button" class="inline-button" id="onboarding-privacy">kebijakan privasi</button>.</span></label>`;
  openModal(`${modalHead(`LANGKAH ${onboardingStep + 1} DARI 6`, steps[onboardingStep], subtitles[onboardingStep])}<div class="onboarding-progress">${steps.map((_, i) => `<span class="${i <= onboardingStep ? 'active' : ''}"></span>`).join('')}</div><form id="onboarding-form">${content}<div class="onboarding-actions">${onboardingStep > 0 ? '<button type="button" class="button secondary" id="onboarding-back">Kembali</button>' : ''}${[4].includes(onboardingStep) ? '<button type="button" class="text-button" id="onboarding-skip">Lewati</button>' : ''}<button class="button">${onboardingStep === 5 ? 'Simpan profil sehat' : 'Lanjutkan'}${icon('arrow-right', '', 16)}</button></div><p class="form-note">${isPreview() ? 'Pratinjau: profil hanya ada selama sesi ini, tanpa disimpan di browser.' : 'Profil dilindungi akses akunmu dan dapat dihapus kapan saja.'}</p></form>`, { title: `Profil sehat: ${steps[onboardingStep]}` });
  document.querySelector('#onboarding-back')?.addEventListener('click', () => { captureOnboarding(false); onboardingStep--; onboardingModal(); });
  document.querySelector('#onboarding-skip')?.addEventListener('click', () => { onboardingStep++; onboardingModal(); });
  document.querySelector('#onboarding-privacy')?.addEventListener('click', () => { const note = document.createElement('p'); note.className = 'notice'; note.textContent = 'Profil dipakai untuk personalisasi dan pemeriksaan keamanan. Tidak dijual atau dibagikan ke media sosial. Konsultasi mengirim tujuan dan kandidat produk ke penyedia AI, tanpa detail kesehatan pribadi. Kamu dapat mengunduh dan menghapus data melalui Pengaturan.'; document.querySelector('.checkbox-field').after(note); });
  document.querySelector('#onboarding-form').onsubmit = async e => {
    e.preventDefault(); if (!captureOnboarding(true)) return;
    if (onboardingStep < 5) { onboardingStep++; onboardingModal(); return; }
    if (!validProfile(p)) { toast('Lengkapi biodata, tujuan, dan semua pertanyaan keamanan.', 'error'); return; }
    const submit = e.target.querySelector('button[type="submit"], .onboarding-actions .button:last-child'); submit.disabled = true;
    try {
      if (session) await api('profile', { method: 'PUT', body: p });
      state.profile = structuredClone(p); closeModal(); shell();
      openModal(`${modalHead('SENANG MENGENALMU', `Halo, ${esc(name())}. Ini awal yang baik.`, 'Profil sehatmu sudah siap. Yuk, mulai dari langkah yang sederhana.')}<div class="profile-result">${progressRing(lifestyleScore(p), lifestyleScore(p), 'Skor gaya hidup', '', 155)}<div><span>BMI <strong>${bodyMetrics(p).bmi}</strong></span><span>Estimasi energi <strong>${num(bodyMetrics(p).tdee)} kkal</strong></span></div></div><div class="notice">${safetyCheck(p).allowed ? 'Rekomendasi produk tersedia setelah masuk dan katalog resmi terverifikasi. Kamu dapat mulai melihat rencana kebiasaan 30 hari.' : safetyCheck(p).message}</div><button class="button full" data-go="plan">Lihat rencana sehatku ${icon('arrow-right', '', 17)}</button>`, { title: 'Profil sehat selesai' });
    } catch (err) { submit.disabled = false; toast(err.message, 'error'); }
  };
}
function captureOnboarding(validate) {
  const form = document.querySelector('#onboarding-form'); const fd = new FormData(form); const p = onboardingDraft;
  if (onboardingStep === 2) {
    const selected = fd.getAll('goals'); if (validate && (selected.length < 1 || selected.length > 2)) { document.querySelector('#goal-error').textContent = 'Pilih satu atau maksimal dua tujuan.'; return false; } p.goals = selected;
  } else if (onboardingStep === 3) {
    for (const k of ['allergy', 'condition', 'medication', 'pregnancy', 'restriction']) if (fd.has(k)) p.safety[k] = fd.get(k);
  } else {
    for (const [k, v] of fd) if (k !== 'consent') p[k] = ['age', 'weight', 'height', 'sleep', 'targetWeight'].includes(k) ? (v ? Number(v) : '') : String(v).trim();
    if (onboardingStep === 5) p.consent = fd.has('consent');
  }
  return true;
}

function foodModal(mode = 'text', preset = null, photoURL = '') {
  let selection = preset;
  openModal(`${modalHead('CATAT GIZI', (mode === 'search' ? 'Apa yang kamu nikmati?' : mode === 'product' ? 'Produk Darya Varia yang mana?' : 'Ceritakan isi piringmu.'), 'Estimasi bisa kamu periksa dan koreksi sebelum disimpan.')}<div class="segmented food-tabs"><button id="food-text-tab" class="${mode === 'text' ? 'active' : ''}">Tulis bebas</button><button id="food-search-tab" class="${mode === 'search' ? 'active' : ''}">Manual cari</button><button id="food-product-tab" class="${mode === 'product' ? 'active' : ''}">Cari Produk Darya Varia</button></div>${photoURL ? `<img src="${photoURL}" alt="Foto piring yang dipilih" class="food-photo-preview"/>` : ''}${mode === 'text' ? `<form id="estimate-food-form">${field('Makanan yang kamu nikmati', '<textarea name="description" placeholder="Contoh: nasi putih, ayam panggang, dan satu telur rebus" maxlength="1000" rows="3" required></textarea>')}<button class="button secondary full">${icon('sparkles', '', 17)} Estimasi gizi</button></form>` : mode === 'search' ? `<label class="search-box">${icon('search', '', 18)}<input id="food-search-input" placeholder="Cari nasi, ayam, telur..." aria-label="Cari makanan"/></label><p class="form-note">${isPreview() ? 'Basis data ilustrasi untuk pratinjau; nilai perkiraan per porsi.' : 'Basis data makanan terverifikasi.'}</p><div class="food-search-results" id="food-results"></div>` : `<label class="search-box">${icon('search', '', 18)}<input id="product-search-input" placeholder="Cari Enervon-C, Natur-E..." aria-label="Cari produk Darya Varia"/></label><p class="form-note">Hanya produk non-resep dari katalog Darya Varia.</p><div class="food-search-results" id="product-results"></div>`}<div id="food-editor"></div>`, { title: 'Catat makanan' });
  document.querySelector('#food-text-tab').onclick = () => foodModal('text');
  document.querySelector('#food-search-tab').onclick = () => foodModal('search');
  document.querySelector('#food-product-tab').onclick = () => foodModal('product');
  const showEditor = f => {
    selection = f;
    document.querySelector('#food-editor').innerHTML = `<form id="food-log-form"><div class="editor-divider"></div><div class="rail-title"><h3>Periksa estimasinya</h3>${badge('BISA DIKOREKSI', 'orange')}</div>${field('Nama makanan', input('name', f.name, 'required maxlength="160"'))}<div class="form-grid">${field('Porsi (pengali)', input('portions', 1, 'type="number" min="0.1" max="20" step="0.1" required'))}${field('Waktu makan', select('meal', 'Makan siang', [['Sarapan', 'Sarapan'], ['Makan siang', 'Makan siang'], ['Makan malam', 'Makan malam'], ['Camilan', 'Camilan']]))}</div><div class="form-grid">${field('Kalori (kkal)', input('calories', f.calories, 'type="number" min="0" max="10000" required'))}${field('Protein (g)', input('protein', f.protein || 0, 'type="number" min="0" max="1000" step="0.1" required'))}${field('Karbohidrat (g)', input('carbs', f.carbs || 0, 'type="number" min="0" max="1000" step="0.1" required'))}${field('Lemak (g)', input('fat', f.fat || 0, 'type="number" min="0" max="1000" step="0.1" required'))}</div><p class="form-note">Nilai di atas untuk satu porsi. Total dikalikan jumlah porsi saat disimpan.</p><button class="button full">${icon('check', '', 17)} Simpan catatan</button></form>`; hydrateIcons();
    document.querySelector('#food-log-form').onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(e.target), portions = Number(fd.get('portions'));
      const log = { name: fd.get('name').trim(), meal: fd.get('meal'), calories: Math.round(Number(fd.get('calories')) * portions), protein: Number(fd.get('protein')) * portions, carbs: Number(fd.get('carbs')) * portions, fat: Number(fd.get('fat')) * portions, source: photoURL ? 'photo' : mode === 'search' ? 'manual' : 'text', estimated: true, corrected: true };
      try { const saved = session ? await api('logs/food', { method: 'POST', body: log }) : { ...log, id: crypto.randomUUID() }; state.foodLogs.push({ ...saved, time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), icon: selection.icon || 'utensils' }); closeModal(); go('nutrition'); toast(session ? 'Catatan makanan tersimpan.' : 'Catatan ditambahkan untuk sesi pratinjau ini.'); } catch (err) { toast(err.message, 'error'); }
    };
  };
  if (mode === 'search') {
    const renderResults = async q => {
      try {
        const list = session ? (await api(`foods?q=${encodeURIComponent(q)}`)).items : foods.filter(f => f.name.toLowerCase().includes(q.toLowerCase()));
        document.querySelector('#food-results').innerHTML = list.length ? list.map((f, i) => `<button data-food-index="${i}"><span class="food-icon">${icon(f.icon || 'utensils', '', 20)}</span><span><strong>${esc(f.name)}</strong><small>${esc(f.portion || '')} · ${f.calories} kkal</small></span>${icon('plus', '', 17)}</button>`).join('') : '<p class="mini-empty">Makanan belum ditemukan. Gunakan Tulis bebas atau masukkan gizi dari kemasan.</p>';
        document.querySelectorAll('[data-food-index]').forEach(b => b.onclick = () => showEditor(list[Number(b.dataset.foodIndex)])); hydrateIcons();
      } catch (err) { toast(err.message, 'error'); }
    };
    let timer; document.querySelector('#food-search-input').oninput = e => { clearTimeout(timer); timer = setTimeout(() => renderResults(e.target.value), 220); }; renderResults('');
  } else if (mode === 'product') {
    const renderProducts = q => {
      const list = state.products.filter(p => p.kind !== 'prescription' && `${p.name} ${p.subtitle || ''} ${p.category || ''}`.toLowerCase().includes(q.toLowerCase()));
      document.querySelector('#product-results').innerHTML = list.length ? list.map(p => `<button data-product-result="${esc(p.id)}"><span class="food-icon">${icon(p.icon || 'pill', '', 20)}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.dosage || p.form || p.category || '')}</small></span>${icon('chevron-right', '', 17)}</button>`).join('') : '<p class="mini-empty">Produk tidak ditemukan. Produk resep tidak ditampilkan di sini.</p>';
      document.querySelectorAll('[data-product-result]').forEach(b => b.onclick = () => productModal(b.dataset.productResult)); hydrateIcons();
    };
    let timer; document.querySelector('#product-search-input').oninput = e => { clearTimeout(timer); timer = setTimeout(() => renderProducts(e.target.value), 220); }; renderProducts('');
  } else document.querySelector('#estimate-food-form').onsubmit = async e => {
    e.preventDefault(); const description = new FormData(e.target).get('description'); const button = e.target.querySelector('button'); button.disabled = true;
    try {
      if (session) { const data = await api('food-estimate', { method: 'POST', body: { description } }); showEditor(data); }
      else {
        const matches = foods.filter(f => description.toLowerCase().includes(f.name.toLowerCase().split(' ')[0]));
        const totals = matches.reduce((s, f) => ({ calories: s.calories + f.calories, protein: s.protein + f.protein, carbs: s.carbs + f.carbs, fat: s.fat + f.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
        showEditor({ name: description, ...totals }); toast(matches.length ? 'Estimasi dari basis data ilustrasi. Periksa porsi dan nilainya.' : 'Belum dikenali. Masukkan nilai gizi dari kemasan atau sumbermu.');
      }
    } catch (err) { toast(err.message, 'error'); } finally { button.disabled = false; }
  };
  if (preset) showEditor(preset);
}

function photoModal() {
  openModal(`${modalHead('AI FOTO PIRING', 'Satu foto, awal sebuah catatan.', 'Foto diproses hanya setelah kamu memilihnya. Hasilnya selalu estimasi dan dapat dikoreksi.')}<label class="photo-dropzone" for="food-photo">${icon('camera', '', 42)}<strong>Pilih atau ambil foto makanan</strong><span>JPG, PNG, atau WebP · maksimal 5 MB</span><input id="food-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"/></label><div class="notice">${icon('info', '', 18)}${session ? 'Hindari wajah, dokumen, atau informasi pribadi di foto.' : 'AI foto belum terhubung dalam pratinjau. Kamu tetap dapat melihat foto dan mengisi gizi secara manual.'}</div><div id="photo-status" role="status"></div>`, { title: 'Foto piring' });
  document.querySelector('#food-photo').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast('Pilih gambar JPG, PNG, atau WebP maksimal 5 MB.', 'error'); return; }
    const previewURL = URL.createObjectURL(file);
    if (!session) { foodModal('text', { name: 'Makanan dari foto', calories: 0 }, previewURL); modalCleanup = () => URL.revokeObjectURL(previewURL); return; }
    document.querySelector('#photo-status').innerHTML = `<p class="form-note">${icon('loader-circle', 'spin', 17)} Memeriksa isi piringmu...</p>`; hydrateIcons();
    try {
      const compressed = await compressImage(file); const data = await api('food-estimate', { method: 'POST', body: { image: compressed } });
      foodModal('text', data, previewURL); modalCleanup = () => URL.revokeObjectURL(previewURL);
    } catch (err) { URL.revokeObjectURL(previewURL); toast(err.message, 'error'); }
  };
}
async function compressImage(file) {
  const bitmap = await createImageBitmap(file); const canvas = document.createElement('canvas'); const factor = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
  canvas.width = bitmap.width * factor; canvas.height = bitmap.height * factor; canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  return canvas.toDataURL('image/jpeg', .8);
}

function barcodeModal() {
  openModal(`${modalHead('PINDAI BARCODE', 'Kenali yang ada di tanganmu.', 'Cari makanan kemasan atau produk dari kode barcode.')}<div class="scanner-box"><video id="scanner-video" autoplay muted playsinline hidden></video><div class="scanner-reticle">${icon('scan-barcode', '', 62)}</div><p id="scanner-status">Gunakan kamera atau ketik kode secara manual.</p></div><button class="button secondary full" id="start-scan">${icon('camera', '', 18)} Aktifkan kamera</button><form id="barcode-form">${field('Nomor barcode', input('barcode', '', 'inputmode="numeric" pattern="[0-9]{8,14}" required placeholder="Ketik 8–14 digit barcode"'))}<button class="button full">Cari barcode ${icon('search', '', 17)}</button></form><div id="barcode-result" role="status"></div>`, { title: 'Pindai barcode' });
  let stream, stopped = false, frame;
  modalCleanup = () => { stopped = true; clearTimeout(frame); stream?.getTracks().forEach(t => t.stop()); };
  const lookup = async code => {
    const result = document.querySelector('#barcode-result'); if (!result) return;
    try {
      if (!session) { result.innerHTML = '<div class="notice">Basis data barcode belum dihubungkan pada pratinjau. Gunakan Manual cari untuk mencatat makanan.</div><button class="button secondary full" data-action="food-search">Manual cari</button>'; return; }
      const data = await api(`barcode/${encodeURIComponent(code)}`);
      if (data.type === 'product') productModal(data.item.id); else foodModal('search', data.item);
    } catch (err) { result.textContent = err.message; }
  };
  document.querySelector('#barcode-form').onsubmit = e => { e.preventDefault(); lookup(new FormData(e.target).get('barcode')); };
  document.querySelector('#start-scan').onclick = async () => {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) { toast('Pemindaian otomatis belum didukung browser ini. Ketik nomor barcode.', 'error'); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const video = document.querySelector('#scanner-video'); if (!video) { stream.getTracks().forEach(t => t.stop()); return; } video.srcObject = stream; video.hidden = false; await video.play();
      const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'] });
      const scan = async () => { if (stopped) return; try { const codes = await detector.detect(video); if (codes[0]) { modalCleanup(); await lookup(codes[0].rawValue); return; } } catch { /* Continue until user stops camera. */ } frame = setTimeout(scan, 400); }; scan();
    } catch { toast('Kamera tidak dapat dibuka. Izinkan akses atau ketik kode manual.', 'error'); }
  };
}

function weightModal() {
  const last = state.weights.at(-1)?.weight || state.profile?.weight || 65.3;
  openModal(`${modalHead('JAGA BERAT BADAN', 'Kenali perubahanmu.', 'Catat secara berkala, tanpa perlu terburu-buru.')}<form id="weight-form"><div class="weight-input-wrap"><input name="weight" aria-label="Berat badan dalam kg" type="number" value="${last}" min="25" max="350" step="0.1" required/><span>kg</span></div><div class="weight-ruler"></div>${field('Tanggal catatan', input('date', localDay(), `type="date" max="${localDay()}" required`))}<p class="form-note">Angka berat badan tidak menentukan nilai dirimu.</p><button class="button full">${icon('plus', '', 18)} Simpan catatan</button></form>`, { title: 'Catat berat badan' });
  document.querySelector('#weight-form').onsubmit = async e => { e.preventDefault(); const fd = new FormData(e.target), log = { weight: Number(fd.get('weight')), date: fd.get('date') }; try { const saved = session ? await api('logs/weight', { method: 'POST', body: log }) : { ...log, id: crypto.randomUUID() }; state.weights.push(saved); closeModal(); shell(); toast('Catatan berat ditambahkan.'); } catch (err) { toast(err.message, 'error'); } };
}
let exerciseCatalog = null;
let exerciseCatalogFailed = false;
function catalogActivityKey(ex) {
  const cat = String(ex.category || '').toLowerCase();
  if (cat.includes('strength') || cat.includes('powerlifting') || cat.includes('olympic') || cat.includes('strongman')) return 'strength';
  if (cat.includes('stretching')) return 'yoga';
  if (cat.includes('cardio') || cat.includes('plyometrics')) return 'running';
  return 'walking';
}
async function loadExerciseCatalog() {
  if (exerciseCatalog || exerciseCatalogFailed) return exerciseCatalog;
  try {
    const res = await fetch('/exercises.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    exerciseCatalog = Array.isArray(data) ? data : [];
  } catch { exerciseCatalog = null; exerciseCatalogFailed = true; }
  return exerciseCatalog;
}
function exerciseModal() {
  let selectedCatalog = null;
  openModal(`${modalHead('EXERCISE', 'Setiap gerak berarti.', 'Pilih aktivitas yang membuatmu merasa lebih baik.')}<form id="exercise-form"><div class="catalog-picker"><label class="search-box">${icon('search', '', 18)}<input id="catalog-search-input" placeholder="Cari latihan dari katalog (contoh: squat, plank...)" aria-label="Cari latihan"/></label><div class="form-grid"><label class="form-field"><span>Grup otot</span><select id="catalog-muscle-filter"><option value="">Semua grup otot</option></select></label><label class="form-field"><span>Peralatan</span><select id="catalog-equipment-filter"><option value="">Semua peralatan</option></select></label></div><p class="form-note" id="catalog-status">Memuat katalog latihan...</p><div class="food-search-results" id="catalog-results"></div><div id="catalog-chosen"></div></div>${field('Aktivitas', select('activity', 'walking', exerciseOptions))}${field('Durasi (menit)', input('minutes', 30, 'type="number" min="1" max="600" required'))}<div class="notice">${icon('info', '', 18)}Energi yang digunakan merupakan estimasi berdasarkan durasi dan berat badan.</div><button class="button full">${icon('check', '', 18)} Catat aktivitasku</button></form>`, { title: 'Catat exercise' });
  const renderCatalog = () => {
    const box = document.querySelector('#catalog-results'); if (!box) return;
    const q = (document.querySelector('#catalog-search-input')?.value || '').toLowerCase();
    const muscle = document.querySelector('#catalog-muscle-filter')?.value || '';
    const equip = document.querySelector('#catalog-equipment-filter')?.value || '';
    const status = document.querySelector('#catalog-status');
    if (exerciseCatalogFailed) { status.textContent = 'Katalog latihan belum dapat dimuat. Pilih aktivitas di bawah ini.'; box.innerHTML = ''; return; }
    if (!exerciseCatalog) { status.textContent = 'Memuat katalog latihan...'; return; }
    const list = exerciseCatalog.filter(ex => (!q || ex.name.toLowerCase().includes(q)) && (!muscle || (ex.primaryMuscles || []).includes(muscle)) && (!equip || ex.equipment === equip)).slice(0, 12);
    status.textContent = (q || muscle || equip) ? `${list.length} latihan ditemukan` : `Ketik untuk mencari dari ${exerciseCatalog.length} latihan.`;
    box.innerHTML = list.length ? list.map(ex => `<button type="button" data-catalog-id="${esc(ex.id)}"><span class="food-icon">${icon('dumbbell', '', 20)}</span><span><strong>${esc(ex.name)}</strong><small>${esc((ex.primaryMuscles || []).join(', ') || ex.category || '')}${ex.equipment ? ` · ${esc(ex.equipment)}` : ''}</small></span>${icon('plus', '', 17)}</button>`).join('') : '<p class="mini-empty">Latihan tidak ditemukan. Coba kata kunci lain.</p>';
    box.querySelectorAll('[data-catalog-id]').forEach(b => b.onclick = () => {
      selectedCatalog = exerciseCatalog.find(x => x.id === b.dataset.catalogId); if (!selectedCatalog) return;
      const sel = document.querySelector('#exercise-form select[name="activity"]');
      if (sel) sel.value = catalogActivityKey(selectedCatalog);
      document.querySelector('#catalog-chosen').innerHTML = `<div class="notice">${icon('check', '', 18)}Latihan terpilih: <strong>${esc(selectedCatalog.name)}</strong> · dicatat sebagai ${esc(sel?.selectedOptions?.[0]?.textContent || '')}. <button type="button" class="inline-button" id="catalog-clear">Batalkan pilihan</button></div>`; hydrateIcons();
      document.querySelector('#catalog-clear').onclick = () => { selectedCatalog = null; document.querySelector('#catalog-chosen').innerHTML = ''; };
    }); hydrateIcons();
  };
  const fillCatalogFilters = () => {
    const muscles = [...new Set(exerciseCatalog.flatMap(ex => ex.primaryMuscles || []))].sort();
    const equipments = [...new Set(exerciseCatalog.map(ex => ex.equipment).filter(Boolean))].sort();
    document.querySelector('#catalog-muscle-filter').innerHTML = '<option value="">Semua grup otot</option>' + muscles.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
    document.querySelector('#catalog-equipment-filter').innerHTML = '<option value="">Semua peralatan</option>' + equipments.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('');
  };
  document.querySelector('#catalog-search-input').oninput = renderCatalog;
  document.querySelector('#catalog-search-input').onkeydown = e => { if (e.key === 'Enter') e.preventDefault(); };
  document.querySelector('#catalog-muscle-filter').onchange = renderCatalog;
  document.querySelector('#catalog-equipment-filter').onchange = renderCatalog;
  loadExerciseCatalog().then(() => { if (exerciseCatalog) fillCatalogFilters(); renderCatalog(); });
  document.querySelector('#exercise-form').onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(e.target), activity = fd.get('activity'), minutes = Number(fd.get('minutes'));
    const met = { walking: 3.5, running: 7, cycling: 6, swimming: 6.5, yoga: 2.5, strength: 5, hiit: 8, pilates: 3.8, aerobics: 5.5, 'jump-rope': 9, badminton: 5.5 }[activity] || 4;
    const log = { activity, minutes, calories: Math.round(met * 3.5 * Number(state.profile?.weight || 65) / 200 * minutes), estimated: true };
    try { const saved = session ? await api('logs/exercise', { method: 'POST', body: log }) : { ...log, id: crypto.randomUUID() }; state.exercises.push({ ...saved, label: selectedCatalog?.name }); closeModal(); shell(); toast(`${minutes} menit gerakmu tercatat. Bagus untuk konsistensimu!`); } catch (err) { toast(err.message, 'error'); }
  };
}
function supplementModal() {
  const list = state.products.filter(p => p.kind !== 'prescription');
  openModal(`${modalHead('SUPLEMEN HARIAN', 'Catat rutinitas baikmu.', 'Hanya catatan konsumsi, bukan anjuran memulai suplemen.')}<form id="supplement-form">${field('Produk yang dikonsumsi', select('product_id', list[0]?.id, list.map(p => [p.id, p.name])))}${field('Waktu konsumsi', input('time', new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), 'type="time" required'))}<div class="notice">${icon('shield-check', '', 20)}Ikuti dosis dan petunjuk resmi pada kemasan atau tenaga kesehatan. Jangan menggandakan dosis.</div><label class="checkbox-field"><input type="checkbox" name="confirmed" required/><span>Saya mencatat konsumsi yang sudah dilakukan sesuai petunjuk pada kemasan.</span></label><button class="button full" ${!list.length ? 'disabled' : ''}>${icon('check', '', 17)} Catat sudah diminum</button></form>`, { title: 'Catat suplemen' });
  document.querySelector('#supplement-form').onsubmit = async e => { e.preventDefault(); const fd = new FormData(e.target), product = list.find(p => p.id === fd.get('product_id')); try { const log = { product_id: product.id, time: fd.get('time'), taken: true }; const saved = session ? await api('logs/supplement', { method: 'POST', body: log }) : { ...log, id: crypto.randomUUID() }; state.supplements.push({ ...saved, name: product.name }); closeModal(); go('nutrition'); toast('Rutinitas suplemen tercatat.'); } catch (err) { toast(err.message, 'error'); } };
}

const googleIcon = `<svg width="20" height="20" viewBox="0 0 24 24" class="google-icon" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`;

function authModal(mode = 'login') {
  openModal(`${modalHead('SELAMAT DATANG DI DARYAPEDIA', mode === 'signup' ? 'Awal baik untuk versi sehatmu.' : mode === 'reset' ? 'Kita bantu kamu kembali.' : 'Senang bertemu lagi.', mode === 'reset' ? 'Tautan pengaturan ulang akan dikirim ke emailmu.' : 'Satu akun untuk perjalanan sehat yang lebih personal.')}<div class="auth-brand"><img src="/assets/darya-logo.svg" alt="Darya Varia"/></div>${!supabase ? '<div class="notice">Layanan akun belum dihubungkan. Seluruh fitur desain dapat dijelajahi dalam pratinjau; tidak ada akun atau login pengganti.</div>' : ''}${mode !== 'reset' ? `<button class="button secondary full google-button" data-action="google-login">${googleIcon} <span>Lanjutkan dengan Google</span></button><div class="auth-divider"><span>atau dengan email</span></div>` : ''}<form id="auth-form">${field('Email', input('email', '', 'type="email" autocomplete="email" required placeholder="nama@email.com"'))}${mode !== 'reset' ? field('Kata sandi', '<div class="password-field"><input name="password" type="password" minlength="8" maxlength="128" autocomplete="' + (mode === 'signup' ? 'new-password' : 'current-password') + '" required placeholder="Minimal 8 karakter"/><button type="button" class="icon-button" id="toggle-password" aria-label="Tampilkan kata sandi">' + icon('eye', '', 18) + '</button></div>') : ''}<p class="form-error" id="auth-error" role="alert"></p><button class="button full" ${!supabase ? 'disabled' : ''}>${mode === 'signup' ? 'Buat akun' : mode === 'reset' ? 'Kirim tautan pemulihan' : 'Masuk'}</button></form>${mode === 'login' ? '<button class="inline-button auth-forgot" id="forgot-password">Lupa kata sandi?</button>' : ''}<p class="auth-switch">${mode === 'login' ? 'Baru di sini?' : 'Sudah punya akun?'} <button class="inline-button" id="switch-auth">${mode === 'login' ? 'Buat akun' : 'Masuk'}</button></p>`, { title: mode === 'signup' ? 'Buat akun' : 'Masuk akun' });
  document.querySelector('#switch-auth').onclick = () => authModal(mode === 'login' ? 'signup' : 'login');
  document.querySelector('#forgot-password')?.addEventListener('click', () => authModal('reset'));
  document.querySelector('#toggle-password')?.addEventListener('click', e => { const input = e.currentTarget.previousElementSibling; input.type = input.type === 'password' ? 'text' : 'password'; e.currentTarget.setAttribute('aria-label', input.type === 'password' ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'); });
  document.querySelector('#auth-form').onsubmit = async e => { e.preventDefault(); const fd = new FormData(e.target), button = e.target.querySelector('.button'); button.disabled = true; try { if (mode === 'signup') { await signUp(fd.get('email'), fd.get('password')); closeModal(); toast('Periksa email untuk memverifikasi akunmu.'); } else if (mode === 'reset') { await resetPassword(fd.get('email')); closeModal(); toast('Jika email terdaftar, tautan pemulihan akan dikirim.'); } else { await signIn(fd.get('email'), fd.get('password')); closeModal(); await refreshUser(); toast('Selamat datang kembali.'); } } catch (err) { document.querySelector('#auth-error').textContent = err.message; } finally { button.disabled = false; } };
}
function recoveryModal() {
  if (!session || !supabase) return;
  openModal(`${modalHead('PEMULIHAN AKUN', 'Buat kata sandi baru.')}<form id="recovery-form">${field('Kata sandi baru', input('password', '', 'type="password" autocomplete="new-password" minlength="8" required'))}<button class="button full">Simpan kata sandi</button></form>`, { title: 'Kata sandi baru' });
  document.querySelector('#recovery-form').onsubmit = async e => { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password: new FormData(e.target).get('password') }); if (error) toast(error.message, 'error'); else { closeModal(); history.replaceState(null, '', '/#profile'); toast('Kata sandi diperbarui.'); } };
}

function privacyModal() {
  openModal(`${modalHead('PRIVASI & KEAMANAN', 'Data pribadimu tetap milikmu.', 'Daryapedia dirancang dengan pembatasan akses per pengguna.')}<div class="privacy-copy"><h3>Apa yang digunakan?</h3><p>Profil, jawaban keamanan berupa penanda, dan catatan harian digunakan untuk personalisasi. Aplikasi tidak meminta rekam medis lengkap.</p><h3>Bagaimana AI bekerja?</h3><p>Server memeriksa profil keamanan terlebih dahulu. Tujuan, pertanyaan konsultasi, dan kandidat produk terverifikasi dapat dikirim ke penyedia AI yang dikonfigurasi. Detail jawaban keamanan tidak dikirim ke model. Hindari memasukkan identitas atau detail medis dalam chat.</p><h3>Kendali ada di tanganmu.</h3><p>Data akun dilindungi Row Level Security. Kamu dapat mengunduh data dan menghapus akun. Tidak ada pembagian otomatis ke media sosial.</p><h3>Saat pratinjau</h3><p>Catatan dan profil hanya ada dalam memori sesi dan hilang saat halaman dimuat ulang. Hanya pilihan tema yang disimpan di browser. Tidak ada login atau rekomendasi medis tiruan.</p><h3>Batas layanan</h3><p>${DISCLAIMER} Daryapedia tidak memberikan diagnosis, resep, atau anjuran obat resep.</p></div>`, { title: 'Privasi & keamanan' });
}
function downloadBlob(blob, filename) { const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
async function exportData() {
  try { const data = session ? await api('export') : { preview: true, profile: state.profile, food_logs: state.foodLogs.filter(f => !f.example), weight_logs: state.weights, exercise_logs: state.exercises, supplement_logs: state.supplements, bookmarks: [...state.bookmarks] }; downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `daryapedia-data-${localDay()}.json`); toast('Data pribadi diunduh. Simpan di tempat yang aman.'); } catch (err) { toast(err.message, 'error'); }
}
function deleteModal() {
  openModal(`${modalHead('KENDALI DATAMU', session ? 'Hapus akun dan seluruh data?' : 'Bersihkan data pratinjau?', session ? 'Tindakan ini permanen. Catatan kesehatan, profil, dan akses akun akan dihapus.' : 'Profil dan catatan sesi ini akan dihapus. Tidak ada akun yang dibuat.')}<form id="delete-form">${field('Ketik HAPUS untuk melanjutkan', input('confirm', '', 'required pattern="HAPUS" autocomplete="off" placeholder="HAPUS"'))}<button class="button danger full">${session ? 'Hapus akun & data secara permanen' : 'Bersihkan sesi pratinjau'}</button></form>`, { title: 'Hapus data' });
  document.querySelector('#delete-form').onsubmit = async e => { e.preventDefault(); const button = e.target.querySelector('button'); button.disabled = true; try { if (session) { await api('account', { method: 'DELETE' }); await supabase.auth.signOut(); } state.profile = null; state.messages = []; state.foodLogs = []; state.weights = []; state.exercises = []; state.supplements = []; state.connected_accounts = []; state.planDone.clear(); state.bookmarks.clear(); state.water = 0; closeModal(); shell(); toast('Akun dan data sesi sudah dibersihkan.'); } catch (err) { toast(err.message, 'error'); button.disabled = false; } };
}
function shareModal() {
  const data = sharePayload({ streak: state.planDone.size === 3 ? 1 : 0, completed: state.planDone.size });
  openModal(`${modalHead('RAYAKAN KEMAJUANMU', 'Kebaikan layak dibagikan.', 'Periksa pratinjau kartu sebelum kamu membagikannya.')}<div class="share-preview"><div class="share-brand">${icon('plus', '', 19)} daryapedia.</div><span class="share-spark">✦</span><h3>Langkah kecil,<br>sehat setiap hari.</h3><div class="share-number">${data.completed}<span>kebiasaan baik hari ini</span></div><p>Sehat itu perjalanan.<br>Dan aku sudah mulai.</p><div class="share-card-footer">MY WELLNESS JOURNEY</div></div><p class="form-note">Kartu hanya memuat jumlah kebiasaan. Tidak ada berat badan, alergi, kondisi kesehatan, atau isi konsultasi.</p><button class="button full" id="share-confirm">${icon('share-2', '', 18)} Bagikan kartu ini</button>`, { title: 'Pratinjau kartu pencapaian' });
  document.querySelector('#share-confirm').onclick = async () => {
    try {
      const canvas = document.createElement('canvas'); canvas.width = 720; canvas.height = 1000; const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 720, 1000); gradient.addColorStop(0, '#2f74f6'); gradient.addColorStop(1, '#1345c4'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 720, 1000);
      ctx.fillStyle = '#fff'; ctx.font = '600 28px sans-serif'; ctx.fillText('+ daryapedia.', 62, 86); ctx.font = '56px sans-serif'; ctx.fillText('✦', 62, 210); ctx.font = 'bold 54px sans-serif'; ctx.fillText('Langkah kecil,', 62, 302); ctx.fillText('sehat setiap hari.', 62, 370); ctx.font = 'bold 150px sans-serif'; ctx.fillText(String(data.completed), 62, 598); ctx.font = '28px sans-serif'; ctx.fillText('kebiasaan baik hari ini', 62, 660); ctx.font = '26px sans-serif'; ctx.fillText('Sehat itu perjalanan.', 62, 800); ctx.fillText('Dan aku sudah mulai.', 62, 843); ctx.font = '18px sans-serif'; ctx.fillText('DARYAPEDIA · MY WELLNESS JOURNEY', 62, 950);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); const file = new File([blob], 'daryapedia-pencapaian.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ title: data.title, files: [file] }); else downloadBlob(blob, file.name);
      if (session) await api('share', { method: 'POST', body: { completed: data.completed, channel: 'device' } }); toast('Kartu pencapaian siap dibagikan.');
    } catch (err) { if (err.name !== 'AbortError') toast('Kartu belum dapat dibagikan. Coba lagi.', 'error'); }
  };
}
function voiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { toast('Input suara belum didukung browser ini. Kamu tetap bisa mengetik.', 'error'); return; }
  const recognition = new SpeechRecognition(); recognition.lang = 'id-ID'; recognition.interimResults = false;
  recognition.onresult = e => { const input = document.querySelector('#chat-input'); if (input) { input.value = e.results[0][0].transcript; input.focus(); } }; recognition.onerror = () => toast('Suara belum tertangkap. Coba lagi atau ketik pesanmu.', 'error'); recognition.start(); toast('Mendengarkan. Pesan akan ditampilkan sebelum dikirim.');
}

async function refreshUser() {
  if (!session) return;
  try {
    const data = await loadUserData(); state.profile = data.profile; state.products = data.products; state.articles = data.articles; state.bookmarks = new Set(data.bookmarks); state.foodLogs = data.food_logs; state.weights = data.weight_logs; state.exercises = data.exercise_logs; state.supplements = data.supplement_logs; state.planDone = new Set(data.habits); state.water = data.water; state.connected_accounts = data.connected_accounts || []; shell();
  } catch (err) { toast(err.message, 'error'); }
}
shell();
initializeAuth(value => { if (value) setTimeout(refreshUser, 0); else shell(); }).then(async () => { if (session) { await refreshUser(); if (location.hash.includes('recovery=1')) recoveryModal(); } }).catch(() => toast('Sesi belum dapat diperiksa. Coba masuk kembali.', 'error'));
if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => {});
