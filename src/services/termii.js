// src/services/termii.js

const API_KEY = import.meta.env.VITE_TERMII_API_KEY;

// Dev: Vite proxy → https://v3.api.termii.com
// Prod: Supabase Edge Function
const isDev = import.meta.env.DEV;
const TERMII_BASE = isDev
  ? "/termii-api"
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/termii-proxy`;

async function termiiPost(path, body) {
  const url     = isDev ? `${TERMII_BASE}${path}` : TERMII_BASE;
  const payload = isDev
    ? { ...body, api_key: API_KEY }
    : { path, body: { ...body, api_key: API_KEY } };

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }

  // Log the full response in dev so we can see Termii's actual error messages
  if (isDev) console.log("[Termii]", path, res.status, data);

  return { data, ok: res.ok || data?.code === "ok" };
}

export function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length >= 13) return digits;
  if (digits.startsWith("0")   && digits.length === 11) return "234" + digits.slice(1);
  if (digits.length === 10) return "234" + digits;
  return digits.length >= 7 ? digits : null;
}

export async function sendBulkSms({ recipients, message, senderId = "ChurchTrakr" }) {
  const results = { sent: 0, failed: 0, errors: [] };

  const valid = recipients
    .map(r => ({ ...r, formatted: formatPhone(r.phone) }))
    .filter(r => r.formatted);

  if (valid.length === 0) {
    return { ...results, failed: recipients.length, errors: ["No valid phone numbers"] };
  }

  const isPersonalized = message.includes("{name}");

  if (!isPersonalized) {
    const { data, ok } = await termiiPost("/api/sms/send/bulk", {
      to:      valid.map(r => r.formatted),
      from:    senderId,
      sms:     message,
      type:    "plain",
      channel: "generic",
    });
    if (ok) { results.sent = valid.length; }
    else    { results.failed = valid.length; results.errors.push(data?.message || "Send failed"); }
    return results;
  }

  // Personalized — one request per recipient
  for (const r of valid) {
    const sms = message.replace(/\{name\}/gi, r.name || "Member");
    try {
      const { data, ok } = await termiiPost("/api/sms/send", {
        to: r.formatted, from: senderId, sms, type: "plain", channel: "generic",
      });
      if (ok) results.sent++;
      else  { results.failed++; results.errors.push(`${r.name}: ${data?.message || "Failed"}`); }
    } catch (e) {
      results.failed++;
      results.errors.push(`${r.name}: ${e?.message || "Network error"}`);
    }
    await new Promise(res => setTimeout(res, 150));
  }

  return results;
}

// Not used from the browser — sender IDs are managed via Settings + super admin
export async function requestSenderId() {
  return { ok: false, error: "Register sender IDs at app.termii.com → Settings → Sender IDs" };
}