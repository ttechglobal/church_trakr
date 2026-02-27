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

export const fmtBday = d =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-NG", { month: "long", day: "numeric" }) : "";

export const uid = () => Date.now() + Math.floor(Math.random() * 9999);

/** Estimate SMS segments (160 chars per SMS) */
export const smsCount = (text = "") => Math.max(1, Math.ceil(text.length / 160));
