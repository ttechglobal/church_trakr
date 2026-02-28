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

export const fmtBday = d => {
  if (!d) return "";
  // Handle MM-DD (no year) format
  const mmdd = d.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mmdd) {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const m = parseInt(mmdd[1]) - 1;
    return `${months[m] || "?"} ${parseInt(mmdd[2])}`;
  }
  return new Date(d + "T00:00:00").toLocaleDateString("en-NG", { month: "long", day: "numeric" });
};

/** Normalise a birthday value from import: accepts YYYY-MM-DD, MM-DD, MM/DD, D/M/YYYY, D-M-YYYY etc.
 *  Returns a canonical string: either "YYYY-MM-DD" or "MM-DD" (when no year), or "" if unparseable.
 */
export const normBirthday = (raw = "") => {
  if (!raw) return "";
  const s = raw.toString().trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
  // MM-DD or MM/DD (no year)
  const mmdd = s.match(/^(\d{1,2})[\/\-](\d{1,2})$/);
  if (mmdd) return `${mmdd[1].padStart(2,"0")}-${mmdd[2].padStart(2,"0")}`;
  // D/M/YYYY or M/D/YYYY (try D/M/YYYY common in Nigeria)
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,"0")}-${dmy[1].padStart(2,"0")}`;
  // Month name formats like "Jan 15" or "15 Jan"
  const months = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const mn1 = s.match(/^([a-zA-Z]{3,})\.?\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?$/);
  if (mn1) {
    const m = months[mn1[1].slice(0,3).toLowerCase()];
    if (m) {
      const day = mn1[2].padStart(2,"0");
      const mo = String(m).padStart(2,"0");
      return mn1[3] ? `${mn1[3]}-${mo}-${day}` : `${mo}-${day}`;
    }
  }
  const mn2 = s.match(/^(\d{1,2})\s+([a-zA-Z]{3,})\.?(?:\s*,?\s*(\d{4}))?$/);
  if (mn2) {
    const m = months[mn2[2].slice(0,3).toLowerCase()];
    if (m) {
      const day = mn2[1].padStart(2,"0");
      const mo = String(m).padStart(2,"0");
      return mn2[3] ? `${mn2[3]}-${mo}-${day}` : `${mo}-${day}`;
    }
  }
  return "";
};

export const uid = () => Date.now() + Math.floor(Math.random() * 9999);

/** Estimate SMS segments (160 chars per SMS) */
export const smsCount = (text = "") => Math.max(1, Math.ceil(text.length / 160));
