// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[ChurchTrakr] Missing Supabase env vars.\n' +
    'Create a .env file in your project root with:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Ensures a valid auth session exists before making a DB call.
 * This fixes the "stuck at saving / need to refresh" bug:
 *
 * On first load, supabase.auth.getSession() is async. If a DB call
 * fires before it resolves, Supabase has no JWT to attach, RLS rejects
 * it with a permission error, and the UI gets stuck.
 *
 * Call this before any write operation (save attendance, add member, etc.)
 * to guarantee the token is attached.
 */
export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  // Session not found — try refreshing once
  const { data: refreshed } = await supabase.auth.refreshSession();
  return refreshed.session;
}