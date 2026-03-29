// src/lib/helpers.js

const PAL = [
  ["#d4f1e4","#1a6640"],["#fde8cc","#8a4d00"],["#e8d4f5","#6a2a8a"],
  ["#cce8ff","#0a4a8a"],["#ffd6d6","#8a2020"],["#d4eef5","#0a5a6a"],
  ["#f5f0d4","#6a5a0a"],["#f5d4e8","#6a0a3a"],
];

export const getAv = (n = "") => {
  const i = (n.charCodeAt(0) || 0) % PAL.length;
  return {
    bg: PAL[i][0],
    color: PAL[i][1],
    initials: n.split(" ").slice(0, 2).map(x => x[0] || "").join("").toUpperCase(),
  };
};

export const fmtDate = d =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" }) : "";

/**
 * Normalise a birthday value from any source.
 * Defined BEFORE fmtBday so fmtBday can use it as a fallback for bad DB values.
 *
 * Accepts every common format used in Nigerian churches:
 *   YYYY-MM-DD, YYYY/MM/DD, D/M/YYYY, D-M-YYYY, M/D/YYYY,
 *   D-Mon-YYYY, D-Mon-YY, Mon D YYYY, Mon D, D Mon, D/M, MM-DD,
 *   and raw Excel numeric serials.
 * Returns "YYYY-MM-DD" when year is known, "MM-DD" otherwise, or "" if unparseable.
 */
export const normBirthday = (raw = "") => {
  if (!raw) return "";
  const s = raw.toString().trim();
  const MONTHS = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };

  const pad = n => String(n).padStart(2, "0");
  const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const md  = (m, d) => `${pad(m)}-${pad(d)}`;
  const mon = str => MONTHS[str.slice(0, 3).toLowerCase()] || 0;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;

  // YYYY/MM/DD
  const yslash = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yslash) return ymd(yslash[1], yslash[2], yslash[3]);

  // Excel numeric serial (unformatted date cells). Epoch = Dec 30 1899.
  // Use getFullYear/getMonth/getDate (LOCAL) — not UTC — so Lagos UTC+1 gets
  // the correct local date, not the UTC date which is 1 day behind.
  const serial = Number(s);
  if (/^\d+$/.test(s) && serial >= 1 && serial <= 60000) {
    const epoch = new Date(1899, 11, 30); // local midnight Dec 30 1899
    const dt = new Date(epoch.getTime() + serial * 86400000);
    if (!isNaN(dt.getTime())) return ymd(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  // D/M/YYYY or D-M-YYYY (Nigerian standard).
  // first > 12 → must be day (D/M). second > 12 → must be day (M/D). Both ≤ 12 → D/M default.
  const dmy4 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy4) {
    const [, a, b, y] = dmy4;
    const ai = parseInt(a), bi = parseInt(b);
    if (ai > 12) return ymd(y, b, a);
    if (bi > 12) return ymd(y, a, b);
    return ymd(y, b, a); // D/M Nigerian default
  }

  // D/M/YY or M/D/YY (2-digit year)
  const dmy2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmy2) {
    const [, a, b, yy] = dmy2;
    const ai = parseInt(a), bi = parseInt(b);
    const y = parseInt(yy) <= 30 ? `20${yy}` : `19${yy}`;
    if (ai > 12) return ymd(y, b, a);
    if (bi > 12) return ymd(y, a, b);
    return ymd(y, b, a);
  }

  // D-Mon-YYYY or D Mon YYYY (e.g. "14-May-1990", "14 May 1990")
  const dmon4 = s.match(/^(\d{1,2})[\s\/\-]([a-zA-Z]{3,})[\s\/\-,]*(\d{4})$/);
  if (dmon4) { const m = mon(dmon4[2]); if (m) return ymd(dmon4[3], m, dmon4[1]); }

  // D-Mon-YY (e.g. "14-May-90")
  const dmon2 = s.match(/^(\d{1,2})[\s\/\-]([a-zA-Z]{3,})[\s\/\-,]*(\d{2})$/);
  if (dmon2) {
    const m = mon(dmon2[2]);
    if (m) {
      const y = parseInt(dmon2[3]) <= 30 ? `20${dmon2[3]}` : `19${dmon2[3]}`;
      return ymd(y, m, dmon2[1]);
    }
  }

  // Mon D YYYY or Mon D, YYYY (e.g. "May 14, 1990")
  const mon4 = s.match(/^([a-zA-Z]{3,})\.?\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/);
  if (mon4) { const m = mon(mon4[1]); if (m) return mon4[3] ? ymd(mon4[3], m, mon4[2]) : md(m, mon4[2]); }

  // D-Mon or D Mon no year (e.g. "5-May", "14-Mar", "14 May")
  // This is the format Excel produces when raw:false is used on date cells
  // formatted as "D-MMM" in the spreadsheet (e.g. "5-May", "14-Mar").
  const dmonNoYear = s.match(/^(\d{1,2})[\s\-]([a-zA-Z]{3,})$/);
  if (dmonNoYear) { const m = mon(dmonNoYear[2]); if (m) return md(m, dmonNoYear[1]); }

  // D Mon or D Mon YYYY (e.g. "14 May", "14 May 1990")
  const dmon = s.match(/^(\d{1,2})\s+([a-zA-Z]{3,})\.?(?:\s*,?\s*(\d{4}))?$/);
  if (dmon) { const m = mon(dmon[2]); if (m) return dmon[3] ? ymd(dmon[3], m, dmon[1]) : md(m, dmon[1]); }

  // Two-part no-year: if first > 12 it's D/M → swap to MM-DD. Otherwise MM-DD as-is.
  const twopart = s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (twopart) {
    const [, a, b] = twopart;
    if (parseInt(a) > 12) return md(b, a);
    return md(a, b);
  }

  return "";
};

/**
 * Format a birthday for display (e.g. "May 14").
 * Deliberately avoids the Date constructor to prevent UTC-offset day shifts.
 * Falls back to normBirthday so existing members with bad DB values
 * (raw strings like "14/05/1990" stored before the normalisation fix) still display correctly.
 */
export const fmtBday = d => {
  if (!d) return "";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  // YYYY-MM-DD
  const full = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (full) return `${months[parseInt(full[2]) - 1] || "?"} ${parseInt(full[3])}`;
  // MM-DD (no year)
  const mmdd = d.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mmdd) return `${months[parseInt(mmdd[1]) - 1] || "?"} ${parseInt(mmdd[2])}`;
  // Fallback: normalise first, then re-display.
  const normed = normBirthday(d);
  if (normed && normed !== d) return fmtBday(normed);
  return d;
};

export const uid = () => Date.now() + Math.floor(Math.random() * 9999);

/** Estimate SMS segments (160 chars per SMS) */
export const smsCount = (text = "") => Math.max(1, Math.ceil(text.length / 160));

/**
 * Add exactly 1 day to a normalised birthday string.
 * Handles month-end rollover (Jan 31 → Feb 1, Dec 31 → Jan 1) and leap years.
 * Works on both "YYYY-MM-DD" and "MM-DD" formats. Returns "" for invalid input.
 * Used to correct the Excel import -1 day offset.
 */
export const addOneDay = (dateStr = "") => {
  if (!dateStr) return "";

  // YYYY-MM-DD
  const full = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) {
    const daysInMonth = [0, 31, 0, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let y = parseInt(full[1]), m = parseInt(full[2]), d = parseInt(full[3]);
    // Leap year check for February
    const isLeap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    daysInMonth[2] = isLeap ? 29 : 28;
    d += 1;
    if (d > daysInMonth[m]) { d = 1; m += 1; }
    if (m > 12)              { m = 1; y += 1; }
    const pad = n => String(n).padStart(2, "0");
    return `${y}-${pad(m)}-${pad(d)}`;
  }

  // MM-DD (no year — use a leap year as base so Feb 29 is valid)
  const mmdd = dateStr.match(/^(\d{2})-(\d{2})$/);
  if (mmdd) {
    const daysInMonth = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // leap year base
    let m = parseInt(mmdd[1]), d = parseInt(mmdd[2]);
    d += 1;
    if (d > daysInMonth[m]) { d = 1; m += 1; }
    if (m > 12)              { m = 1; }
    const pad = n => String(n).padStart(2, "0");
    return `${pad(m)}-${pad(d)}`;
  }

  return dateStr; // unrecognised format — return unchanged
};
/**
 * Normalise a Nigerian phone number to international format for wa.me links.
 * Handles every format people actually store numbers in:
 *   08012345678   → 2348012345678  (most common - 080/070/090 prefix)
 *   8012345678    → 2348012345678  (10-digit, no leading zero)
 *   +2348012345678→ 2348012345678  (already international with +)
 *   2348012345678 → 2348012345678  (already correct)
 *   0801 234 5678 → 2348012345678  (spaces)
 * Returns empty string if the number can't be normalised.
 */
export const toWhatsAppNumber = (phone = "") => {
  const d = phone.replace(/\D/g, ""); // strip everything except digits
  if (!d) return "";
  // Already correct international format: 234 + 10 digits = 13 digits
  if (d.startsWith("234") && d.length === 13) return d;
  // Nigerian local format: 0 + 10 digits = 11 digits (080xxx, 070xxx, 090xxx)
  if (d.startsWith("0") && d.length === 11) return "234" + d.slice(1);
  // 10-digit without leading zero (8012345678)
  if (d.length === 10 && !d.startsWith("0")) return "234" + d;
  // Fallback: return as-is (let wa.me handle it)
  return d;
};