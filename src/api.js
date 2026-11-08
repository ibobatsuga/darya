import { createClient } from '@supabase/supabase-js';

// Kunci publishable Supabase bersifat publik (aman tampil di kode frontend,
// sama seperti di CalorAI). Dipakai sebagai fallback supaya build apa pun
// — termasuk auto-deploy Cloudflare tanpa env VITE — tetap terhubung.
// Override via env build bila perlu: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
const FALLBACK_URL = 'https://yxydabqmsjijgnrymkle.supabase.co';
const FALLBACK_KEY = 'sb_publishable_jXjCgAT5zqBtbr3pA3qNOQ_YBpo4gh6';
const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export let session = null;
export async function initializeAuth(onChange) {
  if (!supabase) return;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  session = data.session;
  supabase.auth.onAuthStateChange((_event, value) => { session = value; onChange(value); });
}
export async function api(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
  const response = await fetch(`/api/${path}`, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Layanan belum dapat dihubungi. Coba lagi.');
  return data;
}
export async function loadUserData() {
  return api('dashboard');
}
export async function signIn(email, password) {
  if (!supabase) throw new Error('Layanan akun belum dihubungkan. Silakan jelajahi pratinjau aplikasi.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function signUp(email, password) {
  if (!supabase) throw new Error('Layanan akun belum dihubungkan.');
  const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: location.origin } });
  if (error) throw error;
}
export async function googleSignIn() {
  if (!supabase) throw new Error('Layanan Google belum dihubungkan.');
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } });
  if (error) throw error;
}
export async function resetPassword(email) {
  if (!supabase) throw new Error('Layanan akun belum dihubungkan.');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/#profile?recovery=1` });
  if (error) throw error;
}
