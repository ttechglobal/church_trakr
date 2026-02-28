// src/services/sms.js
// The app NEVER holds SMS credentials.
// All sending goes through the Supabase Edge Function which holds them server-side.

import { supabase } from "./supabaseClient";

/**
 * Send SMS via the secure Edge Function.
 * Credentials stay on the server — this function only sends recipients + message.
 *
 * @param {object} opts
 * @param {object[]} opts.recipients  - [{name, phone}]
 * @param {string}   opts.message     - SMS text (may contain {name})
 * @param {string}   opts.type        - absentees | group | single | all
 *
 * @returns {{ success, sent, failed, credits_used, new_balance, results, error }}
 */
export async function sendSms({ recipients, message, type }) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: "Not logged in", results: [] };

  try {
    const res = await supabase.functions.invoke("send-sms", {
      body: { recipients, message, type },
    });

    if (res.error) {
      const msg = res.error?.context?.error || res.error?.message || "Send failed";
      return { success: false, error: msg, results: [] };
    }

    return res.data;

  } catch (err) {
    return { success: false, error: "Network error: " + err.message, results: [] };
  }
}