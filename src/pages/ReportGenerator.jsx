// src/pages/ReportGenerator.jsx
// Sunday Attendance Report Generator
// Produces a branded JPEG (WhatsApp-optimised) and a hand-built PDF.
// Zero external dependencies — native Canvas API only.
//
// KEY ARCHITECTURE NOTE:
// The <canvas> element is always mounted but hidden until generation is complete.
// This ensures canvasRef.current is never null when drawReport() runs.
// The previous bug was: canvas inside {generated && (...)} so ref = null on first draw.

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { fmtDate } from "../lib/helpers";
import { fetchFollowUpData, fetchAttendeeFollowUp } from "../services/api";

const F = "'DM Sans', system-ui, sans-serif";
const S = "'Playfair Display', Georgia, serif";

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

function shadeHex(hex, amt) {
  const n = parseInt(hex.replace("#",""), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

// ── Report drawing ────────────────────────────────────────────────────────────
// Draws a crisp 1080×1350 (4:5) image at 2× scale for retina/WhatsApp quality.
function drawReport(canvas, data) {
  const SCALE = 2;
  const W = 1080 * SCALE;
  const H = 1350 * SCALE;
  const P = 72  * SCALE;  // horizontal padding

  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#f7f5f0";
  ctx.fillRect(0, 0, W, H);

  // ── Header gradient ─────────────────────────────────────────────────────
  const headerH = 280 * SCALE;
  const hGrad = ctx.createLinearGradient(0, 0, W * 0.6, headerH);
  hGrad.addColorStop(0,   "#1a3a2a");
  hGrad.addColorStop(0.6, "#2d5a42");
  hGrad.addColorStop(1,   "#1e4a34");
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, W, headerH);

  // Decorative circle
  ctx.beginPath();
  ctx.arc(W + 80 * SCALE, -60 * SCALE, 380 * SCALE, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.04)";
  ctx.fill();

  // ── Logo mark ───────────────────────────────────────────────────────────
  const lx = P, ly = 48 * SCALE, lsz = 54 * SCALE, lr = 14 * SCALE;
  roundRect(ctx, lx, ly, lsz, lsz, lr);
  ctx.fillStyle = "rgba(255,255,255,.13)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = 1.5 * SCALE;
  ctx.stroke();

  // Gold checkmark
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 3.8 * SCALE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(lx + lsz * 0.22, ly + lsz * 0.52);
  ctx.lineTo(lx + lsz * 0.43, ly + lsz * 0.73);
  ctx.lineTo(lx + lsz * 0.78, ly + lsz * 0.27);
  ctx.stroke();

  // App name
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${30 * SCALE}px ${S}`;
  ctx.textBaseline = "middle";
  ctx.fillText("ChurchTrakr", lx + lsz + 16 * SCALE, ly + 20 * SCALE);
  ctx.fillStyle = "rgba(255,255,255,.42)";
  ctx.font = `500 ${14 * SCALE}px ${F}`;
  ctx.fillText("Attendance Report", lx + lsz + 16 * SCALE, ly + 42 * SCALE);
  ctx.textBaseline = "alphabetic";

  // ── Church name + date ──────────────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.font = `800 ${40 * SCALE}px ${S}`;
  ctx.fillText(
    truncateText(ctx, data.churchName, W - P * 2),
    P, 168 * SCALE
  );
  ctx.fillStyle = "rgba(255,255,255,.5)";
  ctx.font = `500 ${16 * SCALE}px ${F}`;
  ctx.fillText(`Sunday Service  ·  ${data.dateLabel}`, P, 196 * SCALE);

  // Timestamp (right-aligned)
  ctx.fillStyle = "rgba(255,255,255,.25)";
  ctx.font = `400 ${12 * SCALE}px ${F}`;
  ctx.textAlign = "right";
  ctx.fillText(`Generated ${data.generatedAt}`, W - P, 196 * SCALE);
  ctx.textAlign = "left";

  // ── Stat cards ──────────────────────────────────────────────────────────
  const GAP   = 14 * SCALE;
  const cY    = 310 * SCALE;
  const cH    = 162 * SCALE;
  const cW    = (W - P * 2 - GAP * 2) / 3;

  [
    { label:"Present", value: data.present, sub:`of ${data.total}`,       color:"#16a34a", bg:"#f0fdf4", border:"#86efac" },
    { label:"Absent",  value: data.absent,  sub:"not present",            color:"#dc2626", bg:"#fef2f2", border:"#fca5a5" },
    { label:"Total",   value: data.total,   sub:"expected",               color:"#1a3a2a", bg:"#f7f5f0", border:"#d1cfc9" },
  ].forEach((s, i) => {
    const cx = P + i * (cW + GAP);
    roundRect(ctx, cx, cY, cW, cH, 20 * SCALE);
    ctx.fillStyle = s.bg;
    ctx.fill();
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 1.5 * SCALE;
    ctx.stroke();

    ctx.fillStyle = s.color;
    ctx.font = `700 ${58 * SCALE}px ${S}`;
    ctx.textAlign = "center";
    ctx.fillText(String(s.value), cx + cW / 2, cY + 80 * SCALE);

    ctx.font = `700 ${11 * SCALE}px ${F}`;
    ctx.fillText(s.label.toUpperCase(), cx + cW / 2, cY + 102 * SCALE);

    ctx.font = `400 ${11 * SCALE}px ${F}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(s.sub, cx + cW / 2, cY + 120 * SCALE);
    ctx.textAlign = "left";
  });

  // ── Attendance rate bar ──────────────────────────────────────────────────
  const rate      = data.total ? Math.round(data.present / data.total * 100) : 0;
  const rateCol   = rate >= 80 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626";
  const barSecY   = cY + cH + 30 * SCALE;

  ctx.font = `700 ${11 * SCALE}px ${F}`;
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("ATTENDANCE RATE", P, barSecY + 14 * SCALE);

  ctx.textAlign = "right";
  ctx.fillStyle = rateCol;
  ctx.font = `700 ${13 * SCALE}px ${F}`;
  ctx.fillText(`${rate}%`, W - P, barSecY + 14 * SCALE);
  ctx.textAlign = "left";

  const barY = barSecY + 26 * SCALE;
  const barH = 12 * SCALE;
  const barW = W - P * 2;

  roundRect(ctx, P, barY, barW, barH, barH / 2);
  ctx.fillStyle = "#e2e0da";
  ctx.fill();

  if (rate > 0) {
    const fillW = Math.max(barH, barW * (rate / 100)); // min width = height (pill end cap)
    const fGrad = ctx.createLinearGradient(P, 0, P + barW, 0);
    fGrad.addColorStop(0, rateCol);
    fGrad.addColorStop(1, shadeHex(rateCol, 24));
    roundRect(ctx, P, barY, fillW, barH, barH / 2);
    ctx.fillStyle = fGrad;
    ctx.fill();
  }

  // ── Follow-up section ────────────────────────────────────────────────────
  const fuSecY = barY + barH + 40 * SCALE;

  // Divider line
  ctx.beginPath();
  ctx.moveTo(P, fuSecY); ctx.lineTo(W - P, fuSecY);
  ctx.strokeStyle = "#e2e0da";
  ctx.lineWidth = 1 * SCALE;
  ctx.stroke();

  ctx.font = `700 ${14 * SCALE}px ${F}`;
  ctx.fillStyle = "#1a3a2a";
  ctx.fillText("Follow-Up Summary", P, fuSecY + 32 * SCALE);

  const fuY = fuSecY + 48 * SCALE;
  const fuH = 128 * SCALE;
  const fuW = (W - P * 2 - GAP) / 2;

  [
    { label:"Absentees Reached",   value: data.absenteesReached,  total: data.absent,  color:"#1d4ed8", bg:"#eff6ff", border:"#bfdbfe", icon:"📋" },
    { label:"Attendees Messaged",  value: data.attendeesMessaged, total: data.present, color:"#16a34a", bg:"#f0fdf4", border:"#86efac", icon:"🙏" },
  ].forEach((s, i) => {
    const cx = P + i * (fuW + GAP);
    roundRect(ctx, cx, fuY, fuW, fuH, 18 * SCALE);
    ctx.fillStyle = s.bg;
    ctx.fill();
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 1.5 * SCALE;
    ctx.stroke();

    // Emoji icon
    ctx.font = `${24 * SCALE}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(s.icon, cx + fuW / 2, fuY + 36 * SCALE);

    // Value
    ctx.font = `700 ${38 * SCALE}px ${S}`;
    ctx.fillStyle = s.color;
    ctx.fillText(`${s.value}/${s.total}`, cx + fuW / 2, fuY + 80 * SCALE);

    // Label
    ctx.font = `600 ${10 * SCALE}px ${F}`;
    ctx.fillText(s.label.toUpperCase(), cx + fuW / 2, fuY + 98 * SCALE);

    // Rate
    const pct = s.total ? Math.round(s.value / s.total * 100) : 0;
    ctx.font = `400 ${11 * SCALE}px ${F}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(`${pct}% follow-up rate`, cx + fuW / 2, fuY + 116 * SCALE);
    ctx.textAlign = "left";
  });

  // ── Group breakdown ──────────────────────────────────────────────────────
  if (data.groups?.length > 0) {
    const grpSecY = fuY + fuH + 40 * SCALE;

    ctx.beginPath();
    ctx.moveTo(P, grpSecY); ctx.lineTo(W - P, grpSecY);
    ctx.strokeStyle = "#e2e0da";
    ctx.lineWidth = 1 * SCALE;
    ctx.stroke();

    ctx.font = `700 ${14 * SCALE}px ${F}`;
    ctx.fillStyle = "#1a3a2a";
    ctx.fillText("Breakdown by Group", P, grpSecY + 32 * SCALE);

    let rowY  = grpSecY + 50 * SCALE;
    const rowH = 54 * SCALE;

    data.groups.slice(0, 6).forEach((g, i) => {
      const gRate = g.total ? Math.round(g.present / g.total * 100) : 0;
      const gCol  = gRate >= 80 ? "#16a34a" : gRate >= 60 ? "#d97706" : "#dc2626";

      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(P, rowY); ctx.lineTo(W - P, rowY);
        ctx.strokeStyle = "#ece9e4";
        ctx.lineWidth = 0.5 * SCALE;
        ctx.stroke();
      }

      ctx.font = `600 ${14 * SCALE}px ${F}`;
      ctx.fillStyle = "#1c1917";
      ctx.fillText(truncateText(ctx, g.name, 380 * SCALE), P, rowY + 22 * SCALE);

      ctx.font = `400 ${11 * SCALE}px ${F}`;
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(`${g.present} of ${g.total} present`, P, rowY + 40 * SCALE);

      // Mini bar
      const mbW = 230 * SCALE, mbH = 7 * SCALE;
      const mbX = W - P - mbW, mbY = rowY + 14 * SCALE;
      roundRect(ctx, mbX, mbY, mbW, mbH, mbH / 2);
      ctx.fillStyle = "#e2e0da";
      ctx.fill();
      if (gRate > 0) {
        roundRect(ctx, mbX, mbY, Math.max(mbH, mbW * gRate / 100), mbH, mbH / 2);
        ctx.fillStyle = gCol;
        ctx.fill();
      }

      ctx.font = `700 ${13 * SCALE}px ${F}`;
      ctx.fillStyle = gCol;
      ctx.textAlign = "right";
      ctx.fillText(`${gRate}%`, mbX - 14 * SCALE, rowY + 25 * SCALE);
      ctx.textAlign = "left";

      rowY += rowH;
    });
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const footY = H - 56 * SCALE;
  ctx.fillStyle = "#e2e0da";
  ctx.fillRect(0, footY, W, 1 * SCALE);

  ctx.font = `400 ${11 * SCALE}px ${F}`;
  ctx.fillStyle = "#b0aba3";
  ctx.fillText("Generated by ChurchTrakr  ·  Attendance Management for Ministry Leaders", P, footY + 24 * SCALE);

  ctx.textAlign = "right";
  ctx.fillText(data.generatedAt, W - P, footY + 24 * SCALE);
  ctx.textAlign = "left";
}

// ── Minimal hand-built PDF (no dependencies) ─────────────────────────────────
function buildPdf(jpegB64, imgW, imgH) {
  const pageW = 595, pageH = 842;
  const margin = 20;
  const scale  = Math.min((pageW - margin * 2) / imgW, (pageH - margin * 2) / imgH);
  const dstW   = Math.round(imgW * scale);
  const dstH   = Math.round(imgH * scale);
  const xOff   = Math.round((pageW - dstW) / 2);
  const yOff   = Math.round((pageH - dstH) / 2);

  const jpegBytes = atob(jpegB64);
  const jLen      = jpegBytes.length;
  const stream    = `q ${dstW} 0 0 ${dstH} ${xOff} ${yOff} cm /I Do Q`;

  const objs = {
    1: `<< /Type /Catalog /Pages 2 0 R >>`,
    2: `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    3: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /I 5 0 R >> >> >>`,
    4: `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    5: `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jLen} >>\nstream\n${jpegBytes}\nendstream`,
  };

  const offsets = {};
  let body = "%PDF-1.4\n";
  for (let i = 1; i <= 5; i++) {
    offsets[i] = body.length;
    body += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const xref = body.length;
  body += `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) body += `${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i) & 0xff;
  return bytes;
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ReportGenerator({ groups, members, attendanceHistory, showToast }) {
  const { church }  = useAuth();
  const canvasRef   = useRef(null);

  const [selDate,   setSelDate]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [generated, setGenerated] = useState(false);
  const [summary,   setSummary]   = useState(null);

  // Most-recent dates with recorded attendance
  const dates = [...new Set(attendanceHistory.map(s => s.date))]
    .sort((a, b) => b.localeCompare(a)).slice(0, 16);

  useEffect(() => {
    if (!selDate && dates.length > 0) setSelDate(dates[0]);
  }, [dates.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate ─────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!selDate || !church?.id) return;
    setLoading(true);
    setGenerated(false);

    try {
      const [absentFollowUp, attFollowUp] = await Promise.all([
        fetchFollowUpData(church.id).catch(() => ({})),
        fetchAttendeeFollowUp(church.id).catch(() => ({})),
      ]);

      const daySessions = attendanceHistory.filter(s => s.date === selDate);
      let total = 0, present = 0, absent = 0, absenteesReached = 0, attendeesMessaged = 0;
      const breakdown = [];

      for (const sess of daySessions) {
        const grp = groups.find(g => g.id === sess.groupId);
        if (!grp) continue;
        const sp = sess.records.filter(r => r.present).length;
        const sa = sess.records.filter(r => !r.present).length;
        const st = sess.records.length;
        total += st; present += sp; absent += sa;
        absenteesReached  += sess.records.filter(r => !r.present && absentFollowUp[`${sess.id}_${r.memberId}`]?.reached).length;
        attendeesMessaged += sess.records.filter(r =>  r.present && attFollowUp[`att_${sess.id}_${r.memberId}`]?.messaged).length;
        breakdown.push({ name: grp.name, total: st, present: sp, absent: sa });
      }

      const data = {
        churchName:   church.name || "My Church",
        dateLabel:    fmtDate(selDate),
        generatedAt:  new Date().toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }),
        total, present, absent, absenteesReached, attendeesMessaged,
        groups: breakdown.sort((a, b) => b.present - a.present),
      };
      setSummary(data);

      // ── Draw to canvas ──
      // The canvas is ALWAYS rendered in the DOM (visibility:hidden until done).
      // This means canvasRef.current is never null here.
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas ref not ready");
      drawReport(canvas, data);
      setGenerated(true);

    } catch (err) {
      console.error("[Report]", err);
      showToast("Failed to generate report ❌");
    } finally {
      setLoading(false);
    }
  }, [selDate, church?.id, attendanceHistory, groups]);

  // ── Downloads ─────────────────────────────────────────────────────────────
  const saveJpeg = () => {
    const url  = canvasRef.current.toDataURL("image/jpeg", 0.93);
    const link = Object.assign(document.createElement("a"), {
      download: `churchtrakr-${selDate}.jpg`, href: url,
    });
    link.click();
    showToast("Image saved ✅");
  };

  const savePdf = () => {
    const canvas  = canvasRef.current;
    const jpegB64 = canvas.toDataURL("image/jpeg", 0.93).split(",")[1];
    const pdf     = buildPdf(jpegB64, canvas.width, canvas.height);
    const url     = URL.createObjectURL(new Blob([pdf], { type:"application/pdf" }));
    const link    = Object.assign(document.createElement("a"), {
      download: `churchtrakr-${selDate}.pdf`, href: url,
    });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 8000);
    showToast("PDF saved ✅");
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  const FOREST = "#1a3a2a";
  const MID    = "#2d5a42";
  const GREEN  = "#16a34a";
  const BORDER = "#e8e6e1";
  const MUTED  = "#9ca3af";
  const TEXT   = "#1c1917";
  const F_UI   = "'DM Sans', system-ui, sans-serif";
  const S_UI   = "'Playfair Display', serif";

  return (
    <div className="page" style={{ background:"#f7f5f0", minHeight:"100vh" }}>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        background:`linear-gradient(150deg,${FOREST} 0%,${MID} 60%,#1e4a34 100%)`,
        padding:"28px 22px 24px", position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-50, right:-30, width:200, height:200,
          borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />
        <div style={{ fontFamily:S_UI, fontSize:25, fontWeight:800, color:"#fff", letterSpacing:"-.02em" }}>
          Report Generator
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.42)", marginTop:4, fontFamily:F_UI }}>
          Branded summaries · JPEG & PDF
        </div>
      </div>

      <div style={{ padding:"18px 16px 48px" }}>

        {/* ── Date list ── */}
        <div style={{ background:"#fff", borderRadius:18, border:`1px solid ${BORDER}`,
          overflow:"hidden", marginBottom:14, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
          <div style={{ padding:"14px 18px", borderBottom:`1px solid ${BORDER}` }}>
            <div style={{ fontFamily:F_UI, fontWeight:700, fontSize:13.5, color:TEXT }}>Select Date</div>
            <div style={{ fontFamily:F_UI, fontSize:12, color:MUTED, marginTop:2 }}>
              Dates with recorded attendance
            </div>
          </div>
          <div style={{ padding:"10px 14px" }}>
            {dates.length === 0 ? (
              <div style={{ padding:"28px 0", textAlign:"center" }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📋</div>
                <div style={{ fontSize:13, color:MUTED, fontFamily:F_UI }}>
                  No attendance sessions yet
                </div>
              </div>
            ) : dates.map(d => {
              const sessions = attendanceHistory.filter(s => s.date === d);
              const total   = sessions.reduce((s,x) => s + x.records.length, 0);
              const present = sessions.reduce((s,x) => s + x.records.filter(r=>r.present).length, 0);
              const rate    = total ? Math.round(present/total*100) : 0;
              const active  = selDate === d;
              const rateCol = rate>=80?"#16a34a":rate>=60?"#a16207":"#dc2626";
              const rateBg  = rate>=80?"#dcfce7":rate>=60?"#fef9c3":"#fee2e2";
              return (
                <div key={d} onClick={() => { setSelDate(d); setGenerated(false); }}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"11px 14px", borderRadius:12, marginBottom:6, cursor:"pointer",
                    background: active ? FOREST : "#f9f8f5",
                    border:`1.5px solid ${active ? FOREST : BORDER}`,
                    transition:"all .15s",
                  }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:F_UI, fontWeight:700, fontSize:14,
                      color: active ? "#fff" : TEXT }}>{fmtDate(d)}</div>
                    <div style={{ fontFamily:F_UI, fontSize:11.5, marginTop:2,
                      color: active ? "rgba(255,255,255,.5)" : MUTED }}>
                      {sessions.length} group{sessions.length!==1?"s":""} · {total} members
                    </div>
                  </div>
                  <div style={{
                    padding:"3px 10px", borderRadius:20,
                    background: active ? "rgba(255,255,255,.15)" : rateBg,
                    color: active ? "#fff" : rateCol,
                    fontFamily:F_UI, fontWeight:700, fontSize:12,
                  }}>{rate}%</div>
                  {active && (
                    <svg width="13" height="10" viewBox="0 0 14 11" fill="none">
                      <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Generate button ── */}
        <button onClick={generate} disabled={loading || !selDate}
          style={{
            width:"100%", padding:"16px", borderRadius:14, marginBottom:16,
            background: loading ? MID : FOREST, border:"none",
            fontFamily:F_UI, fontWeight:700, fontSize:15, color:"#fff",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.8 : 1,
            boxShadow:"0 4px 18px rgba(26,58,42,.26)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            transition:"opacity .2s",
          }}>
          {loading ? (
            <>
              <div style={{ width:17, height:17,
                border:"2px solid rgba(255,255,255,.25)", borderTop:"2px solid #fff",
                borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Building report…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 21V9"/>
              </svg>
              {generated ? "Regenerate" : "Generate Report"}
            </>
          )}
        </button>

        {/* ── Canvas — ALWAYS mounted, hidden until generated ── */}
        {/* This is the core fix: ref is valid before AND after generation */}
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            visibility: generated ? "visible" : "hidden",
            position: generated ? "static" : "absolute",
            pointerEvents: generated ? "auto" : "none",
          }}
        />

        {/* ── Preview chrome + downloads (shown after generation) ── */}
        {generated && summary && (
          <div style={{ animation:"slideUp .3s ease" }}>
            {/* Header above canvas */}
            <div style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:10, marginTop:0,
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:GREEN }} />
                <span style={{ fontFamily:F_UI, fontWeight:700, fontSize:11.5,
                  color:GREEN, textTransform:"uppercase", letterSpacing:".05em" }}>
                  Preview
                </span>
              </div>
              <span style={{ fontFamily:F_UI, fontSize:11, color:MUTED }}>
                {summary.churchName} · {summary.dateLabel}
              </span>
            </div>

            {/* Quick stats recap */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8,
              marginTop:16, marginBottom:14 }}>
              {[
                { label:"Present", v:summary.present,           col:GREEN,     bg:"#f0fdf4" },
                { label:"Absent",  v:summary.absent,            col:"#dc2626", bg:"#fef2f2" },
                { label:"Reached", v:summary.absenteesReached,  col:"#1d4ed8", bg:"#eff6ff" },
              ].map(s => (
                <div key={s.label} style={{ background:s.bg, borderRadius:12,
                  padding:"10px 8px", textAlign:"center" }}>
                  <div style={{ fontFamily:S_UI, fontWeight:700, fontSize:22,
                    color:s.col, lineHeight:1 }}>{s.v}</div>
                  <div style={{ fontFamily:F_UI, fontSize:10, color:s.col,
                    fontWeight:700, marginTop:4, textTransform:"uppercase",
                    letterSpacing:".04em", opacity:.8 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Download buttons */}
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              <button onClick={saveJpeg} style={{
                flex:1, padding:"14px 10px", borderRadius:14,
                background:"#f0fdf4", border:"1.5px solid #86efac",
                fontFamily:F_UI, fontWeight:700, fontSize:14, color:GREEN,
                cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", gap:7,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Save Image
              </button>
              <button onClick={savePdf} style={{
                flex:1, padding:"14px 10px", borderRadius:14,
                background:FOREST, border:"none",
                fontFamily:F_UI, fontWeight:700, fontSize:14, color:"#fff",
                cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", gap:7,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
                Save PDF
              </button>
            </div>

            {/* WhatsApp tip */}
            <div style={{ padding:"11px 14px", borderRadius:12,
              background:"#f0fdf4", border:"1px solid #86efac",
              display:"flex", alignItems:"flex-start", gap:8 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
              <span style={{ fontFamily:F_UI, fontSize:12, color:"#15803d", lineHeight:1.55 }}>
                Save the image, then share directly to your WhatsApp group. JPEG is optimised for mobile viewing.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}