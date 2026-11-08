export const DISCLAIMER = 'Informasi produk, bukan pengganti nasihat dokter atau apoteker.';

export function bodyMetrics({ weight, height, age, sex, activity = 'moderate' }) {
  const [w, h, a] = [weight, height, age].map(Number);
  if (![w, h, a].every(Number.isFinite) || w < 25 || w > 350 || h < 100 || h > 250 || a < 18 || a > 100 || !['female', 'male'].includes(sex)) return null;
  const bmi = w / ((h / 100) ** 2);
  const bmr = 10 * w + 6.25 * h - 5 * a + (sex === 'male' ? 5 : -161);
  const factor = { low: 1.2, moderate: 1.55, high: 1.725 }[activity] || 1.55;
  return { bmi: Math.round(bmi * 10) / 10, bmr: Math.round(bmr), tdee: Math.round(bmr * factor) };
}

export function validProfile(p) {
  return !!(p && typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 80 && bodyMetrics(p) &&
    Array.isArray(p.goals) && p.goals.length > 0 && p.goals.length <= 2 && p.safety &&
    ['allergy', 'condition', 'medication', 'pregnancy', 'restriction'].every(k => ['yes', 'no', 'unsure'].includes(p.safety[k])) && p.consent === true);
}

export function safetyCheck(profile, text = '') {
  if (!validProfile(profile)) return { allowed: false, reason: 'profile_incomplete', message: 'Lengkapi profil dan pertanyaan keamanan terlebih dahulu agar konsultasi lebih sesuai denganmu.' };
  if (Object.values(profile.safety).some(v => v !== 'no')) return { allowed: false, reason: 'safety_flag', message: 'Terima kasih sudah melengkapi profilmu. Karena ada kondisi yang perlu ditinjau, rekomendasi produk belum dapat diberikan. Konsultasikan pilihan produk dengan apoteker atau dokter.' };
  // Conservative triage happens before any model call. Never use model output to override it.
  if (/(sesak|sulit\s+bernapas|nyeri\s+dada|pingsan|kejang|overdosis|muntah\s+darah|bunuh\s+diri|suicid|hamil|menyusui|alergi|obat\s+(rutin|resep)|warfarin|antikoagulan|diabetes|ginjal|jantung|kanker|anak\s+(saya|usia)|bayi)/i.test(text)) {
    return { allowed: false, reason: 'message_flag', message: 'Keluhan atau kondisi yang kamu sebutkan perlu ditinjau oleh tenaga kesehatan. Saya tidak dapat memberikan rekomendasi produk untuk kondisi ini. Hubungi dokter atau apoteker; bila gejalanya berat atau mendadak, segera cari pertolongan medis.' };
  }
  return { allowed: true, reason: null };
}

export function eligibleProducts(products, profile, text = '') {
  if (!safetyCheck(profile, text).allowed) return [];
  return products.filter(p => p.verified === true && ['supplement', 'otc'].includes(p.kind) && p.composition && p.dosage && p.warnings &&
    Array.isArray(p.goals) && p.goals.some(g => profile.goals.includes(g))).slice(0, 2);
}

export function sharePayload({ streak = 0, completed = 0 } = {}) {
  // Explicit allowlist: never spread a profile or consultation into a share card.
  return { title: 'Langkah kecil, sehat setiap hari.', streak: Math.max(0, Math.floor(Number(streak) || 0)), completed: Math.max(0, Math.floor(Number(completed) || 0)), brand: 'Daryapedia' };
}

export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

export function safeOrderUrl(url, allowedHosts = []) {
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && !parsed.username && !parsed.password && allowedHosts.includes(parsed.hostname) ? parsed.href : null; } catch { return null; }
}

export function lifestyleScore({ sleep = 7, exercise = 'sometimes', stress = 'moderate' } = {}) {
  // Habit indicator only; no clinical or diagnostic meaning.
  return Math.min(100, Math.max(0, Math.round(Math.min(Number(sleep) / 8, 1) * 40 + ({ rarely: 10, sometimes: 25, often: 40 }[exercise] || 10) + ({ high: 5, moderate: 12, low: 20 }[stress] || 12))));
}

export const localDay = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
