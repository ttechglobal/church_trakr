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
 * Ensures a valid auth session before any DB write.
 *
 * Three outcomes:
 *   1. Session already live → returns immediately (~1ms)
 *   2. Session needs refresh → refreshes and returns (~200ms)
 *   3. No session at all → throws, so callers show "please reload" immediately
 *      rather than waiting 12s for a timeout.
 *
 * This is the primary fix for "stuck at saving — need to refresh the page".
 */
export async function ensureSession() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;

    // No live session — try a refresh
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (refreshed?.session) return refreshed.session;

    // Still nothing — session is truly gone. Throw so the caller can
    // show an immediate "please reload" message instead of waiting for timeout.
    throw new Error("SESSION_EXPIRED");
  } catch (err) {
    // Re-throw SESSION_EXPIRED as-is; wrap other errors
    if (err?.message === "SESSION_EXPIRED") throw err;
    throw new Error("SESSION_EXPIRED");
  }
}