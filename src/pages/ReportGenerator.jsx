// src/pages/ReportGenerator.jsx
// Sunday Attendance Report Generator
// Produces a branded JPEG (WhatsApp-ready) and PDF from attendance + follow-up data.
// Uses native Canvas API — no external libraries required.

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { fmtDate } from "../lib/helpers";
import { fetchFollowUpData, fetchAttendeeFollowUp } from "../services/api";

const F = "'DM Sans', system-ui, sans-serif";
const S = "'Playfair Display', Georgia, serif";

const T = {
  forest:  "#1a3a2a",
  mid:     "#2d5a42",
  green:   "#16a34a",
  gold:    "#c9a84c",
  ivory:   "#fafaf8",
  muted:   "#9ca3af",
  border:  "#e8e6e1",
  text:    "#1c1917",
};

// ── Canvas report renderer ────────────────────────────────────────────────────
// Draws a 1080×1350px image (4:5 ratio, optimal for WhatsApp/Instagram).
// Returns a data URL.
function drawReport(ctx, data, scale = 1) {
  const W = 1080 * scale;
  const H = 1350 * scale;
  const p = 72 * scale; // padding

  // ── Background ──
  ctx.fillStyle = "#f7f5f0";
  ctx.fillRect(0, 0, W, H);

  // ── Dark green header band ──
  const grad = ctx.createLinearGradient(0, 0, W, 260 * scale);
  grad.addColorStop(0, "#1a3a2a");
  grad.addColorStop(0.6, "#2d5a42");
  grad.addColorStop(1, "#1e4a34");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, 260 * scale);

  // Subtle circle decoration
  ctx.beginPath();
  ctx.arc(W + 60 * scale, -40 * scale, 320 * scale, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.04)";
  ctx.fill();

  // ── Logo mark ──
  const lx = p, ly = 44 * scale, lsz = 52 * scale, lr = 14 * scale;
  roundRect(ctx, lx, ly, lsz, lsz, lr);
  ctx.fillStyle = "rgba(255,255,255,.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.2)";
  ctx.lineWidth = 1.5 * scale;
  ctx.stroke();

  // Checkmark inside logo
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 3.5 * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(lx + lsz * 0.24, ly + lsz * 0.52);
  ctx.lineTo(lx + lsz * 0.44, ly + lsz * 0.72);
  ctx.lineTo(lx + lsz * 0.76, ly + lsz * 0.28);
  ctx.stroke();

  // App name
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${28 * scale}px ${S}`;
  ctx.fillText("ChurchTrakr", lx + lsz + 14 * scale, ly + 32 * scale);
  ctx.fillStyle = "rgba(255,255,255,.45)";
  ctx.font = `500 ${15 * scale}px ${F}`;
  ctx.fillText("Attendance Report", lx + lsz + 14 * scale, ly + 52 * scale);

  // ── Church name ──
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.font = `700 ${38 * scale}px ${S}`;
  ctx.fillText(truncate(ctx, data.churchName, W - p * 2, `700 ${38 * scale}px ${S}`), p, 162 * scale);

  // ── Date + service label ──
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.font = `500 ${16 * scale}px ${F}`;
  ctx.fillText(`Sunday Service  ·  ${data.dateLabel}`, p, 194 * scale);

  // ── Generated timestamp ──
  ctx.fillStyle = "rgba(255,255,255,.28)";
  ctx.font = `400 ${12 * scale}px ${F}`;
  ctx.textAlign = "right";
  ctx.fillText(`Generated ${data.generatedAt}`, W - p, 194 * scale);
  ctx.textAlign = "left";

  // ── Main stat cards ──
  const cardY    = 296 * scale;
  const cardH    = 160 * scale;
  const cardGap  = 14 * scale;
  const cardW    = (W - p * 2 - cardGap * 2) / 3;

  const stats = [
    { label: "Present",  value: data.present,  sub: `of ${data.total} expected`, color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
    { label: "Absent",   value: data.absent,   sub: "not in attendance",          color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
    { label: "Total",    value: data.total,    sub: "expected members",           color: "#1a3a2a", bg: "#f7f5f0", border: "#e8e6e1" },
  ];

  stats.forEach((s, i) => {
    const cx = p + i * (cardW + cardGap);
    roundRect(ctx, cx, cardY, cardW, cardH, 20 * scale);
    ctx.fillStyle = s.bg;
    ctx.fill();
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Value
    ctx.fillStyle = s.color;
    ctx.font = `700 ${54 * scale}px ${S}`;
    ctx.textAlign = "center";
    ctx.fillText(String(s.value), cx + cardW / 2, cardY + 74 * scale);

    // Label
    ctx.font = `700 ${12 * scale}px ${F}`;
    ctx.fillStyle = s.color;
    ctx.fillText(s.label.toUpperCase(), cx + cardW / 2, cardY + 96 * scale);

    // Sub
    ctx.font = `400 ${11 * scale}px ${F}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(s.sub, cx + cardW / 2, cardY + 116 * scale);
  });
  ctx.textAlign = "left";

  // ── Attendance rate bar ──
  const barSectionY = cardY + cardH + 28 * scale;
  const rate = data.total ? Math.round(data.present / data.total * 100) : 0;
  const rateColor = rate >= 80 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626";

  // Section label
  ctx.font = `700 ${11 * scale}px ${F}`;
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("ATTENDANCE RATE", p, barSectionY + 14 * scale);

  ctx.font = `700 ${11 * scale}px ${F}`;
  ctx.textAlign = "right";
  ctx.fillStyle = rateColor;
  ctx.fillText(`${rate}%`, W - p, barSectionY + 14 * scale);
  ctx.textAlign = "left";

  const barY   = barSectionY + 26 * scale;
  const barH   = 10 * scale;
  const barW   = W - p * 2;

  // Track
  roundRect(ctx, p, barY, barW, barH, barH / 2);
  ctx.fillStyle = "#e8e6e1";
  ctx.fill();

  // Fill
  if (rate > 0) {
    roundRect(ctx, p, barY, barW * (rate / 100), barH, barH / 2);
    const fillGrad = ctx.createLinearGradient(p, 0, p + barW, 0);
    fillGrad.addColorStop(0, rateColor);
    fillGrad.addColorStop(1, shadeColor(rateColor, 20));
    ctx.fillStyle = fillGrad;
    ctx.fill();
  }

  // ── Follow-up section ──
  const fuY = barY + barH + 36 * scale;

  // Divider
  ctx.strokeStyle = "#e8e6e1";
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(p, fuY); ctx.lineTo(W - p, fuY);
  ctx.stroke();

  ctx.font = `700 ${13 * scale}px ${F}`;
  ctx.fillStyle = T.forest;
  ctx.fillText("Follow-Up Summary", p, fuY + 30 * scale);

  const fuCardY = fuY + 46 * scale;
  const fuCardH = 120 * scale;
  const fuCardW = (W - p * 2 - cardGap) / 2;

  const fuStats = [
    {
      label: "Absentees Reached",
      value: data.absenteesReached,
      total: data.absent,
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      icon: "📋",
    },
    {
      label: "Attendees Messaged",
      value: data.attendeesMessaged,
      total: data.present,
      color: "#16a34a",
      bg: "#f0fdf4",
      border: "#86efac",
      icon: "🙏",
    },
  ];

  fuStats.forEach((s, i) => {
    const cx = p + i * (fuCardW + cardGap);
    roundRect(ctx, cx, fuCardY, fuCardW, fuCardH, 16 * scale);
    ctx.fillStyle = s.bg;
    ctx.fill();
    ctx.strokeStyle = s.border;
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();

    // Icon
    ctx.font = `${22 * scale}px sans-serif`;
    ctx.fillText(s.icon, cx + 18 * scale, fuCardY + 36 * scale);

    // Value / total
    ctx.font = `700 ${36 * scale}px ${S}`;
    ctx.fillStyle = s.color;
    ctx.textAlign = "center";
    ctx.fillText(`${s.value}/${s.total}`, cx + fuCardW / 2, fuCardY + 74 * scale);

    // Label
    ctx.font = `600 ${11 * scale}px ${F}`;
    ctx.fillStyle = s.color;
    ctx.fillText(s.label.toUpperCase(), cx + fuCardW / 2, fuCardY + 94 * scale);

    // Pct
    const pct = s.total ? Math.round(s.value / s.total * 100) : 0;
    ctx.font = `400 ${11 * scale}px ${F}`;
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(`${pct}% follow-up rate`, cx + fuCardW / 2, fuCardY + 112 * scale);
  });
  ctx.textAlign = "left";

  // ── Groups breakdown ──
  if (data.groups && data.groups.length > 0) {
    const grpY = fuCardY + fuCardH + 36 * scale;

    ctx.strokeStyle = "#e8e6e1";
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(p, grpY); ctx.lineTo(W - p, grpY);
    ctx.stroke();

    ctx.font = `700 ${13 * scale}px ${F}`;
    ctx.fillStyle = T.forest;
    ctx.fillText("Breakdown by Group", p, grpY + 30 * scale);

    let rowY = grpY + 50 * scale;
    const rowH = 52 * scale;

    data.groups.slice(0, 6).forEach((g, i) => {
      const gRate = g.total ? Math.round(g.present / g.total * 100) : 0;
      const gColor = gRate >= 80 ? "#16a34a" : gRate >= 60 ? "#d97706" : "#dc2626";

      if (i > 0) {
        ctx.strokeStyle = "#e8e6e1";
        ctx.lineWidth = 0.5 * scale;
        ctx.beginPath();
        ctx.moveTo(p, rowY); ctx.lineTo(W - p, rowY);
        ctx.stroke();
      }

      // Group name
      ctx.font = `600 ${14 * scale}px ${F}`;
      ctx.fillStyle = T.text;
      ctx.fillText(truncate(ctx, g.name, 400 * scale, `600 ${14 * scale}px ${F}`), p, rowY + 22 * scale);

      // Members count
      ctx.font = `400 ${11 * scale}px ${F}`;
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(`${g.present} of ${g.total} present`, p, rowY + 40 * scale);

      // Mini bar
      const mbW = 220 * scale;
      const mbX = W - p - mbW;
      const mbY = rowY + 14 * scale;
      const mbH = 6 * scale;
      roundRect(ctx, mbX, mbY, mbW, mbH, mbH / 2);
      ctx.fillStyle = "#e8e6e1";
      ctx.fill();
      if (gRate > 0) {
        roundRect(ctx, mbX, mbY, mbW * (gRate / 100), mbH, mbH / 2);
        ctx.fillStyle = gColor;
        ctx.fill();
      }

      // Rate label
      ctx.font = `700 ${13 * scale}px ${F}`;
      ctx.fillStyle = gColor;
      ctx.textAlign = "right";
      ctx.fillText(`${gRate}%`, mbX - 12 * scale, rowY + 24 * scale);
      ctx.textAlign = "left";

      rowY += rowH;
    });
  }

  // ── Footer ──
  const footY = H - 52 * scale;
  ctx.fillStyle = "#e8e6e1";
  ctx.fillRect(0, footY - 1 * scale, W, 1 * scale);

  ctx.font = `400 ${11 * scale}px ${F}`;
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("Generated by ChurchTrakr  ·  churchtrakr.com", p, footY + 22 * scale);

  ctx.textAlign = "right";
  ctx.fillText("Attendance Management for Ministry Leaders", W - p, footY + 22 * scale);
  ctx.textAlign = "left";
}

// ── Canvas helpers ────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
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

function truncate(ctx, text, maxWidth, font) {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

function shadeColor(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReportGenerator({ groups, members, attendanceHistory, showToast }) {
  const { church } = useAuth();
  const canvasRef  = useRef(null);

  const [selDate,    setSelDate]    = useState("");
  const [loading,    setLoading]    = useState(false);
  const [generated,  setGenerated]  = useState(false);
  const [reportData, setReportData] = useState(null);

  // ── Build list of available Sundays from history ──────────────────────────
  const availableDates = [...new Set(
    attendanceHistory.map(s => s.date)
  )].sort((a, b) => b.localeCompare(a)).slice(0, 20);

  // Default to most recent session
  useEffect(() => {
    if (!selDate && availableDates.length > 0) setSelDate(availableDates[0]);
  }, [availableDates, selDate]);

  // ── Generate the report data ──────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!selDate || !church?.id) return;
    setLoading(true);
    setGenerated(false);

    try {
      // Fetch both follow-up datasets in parallel
      const [absenteeFollowUp, attendeeFollowUp] = await Promise.all([
        fetchFollowUpData(church.id),
        fetchAttendeeFollowUp(church.id),
      ]);

      // Sessions on the selected date
      const daySessions = attendanceHistory.filter(s => s.date === selDate);

      // Aggregate across all groups
      let total   = 0;
      let present = 0;
      let absent  = 0;
      let absenteesReached  = 0;
      let attendeesMessaged = 0;

      const groupBreakdown = [];

      for (const sess of daySessions) {
        const grp = groups.find(g => g.id === sess.groupId);
        if (!grp) continue;

        const sessPresent = sess.records.filter(r => r.present === true).length;
        const sessAbsent  = sess.records.filter(r => r.present === false).length;
        const sessTotal   = sess.records.length;

        total   += sessTotal;
        present += sessPresent;
        absent  += sessAbsent;

        // Absentees reached (key format: `${session.id}_${memberId}`)
        const sessAbsenteeReached = sess.records
          .filter(r => r.present === false)
          .filter(r => absenteeFollowUp[`${sess.id}_${r.memberId}`]?.reached)
          .length;
        absenteesReached += sessAbsenteeReached;

        // Attendees messaged (key format: `att_${session.id}_${memberId}`)
        const sessAttendeeMessaged = sess.records
          .filter(r => r.present === true)
          .filter(r => attendeeFollowUp[`att_${sess.id}_${r.memberId}`]?.messaged)
          .length;
        attendeesMessaged += sessAttendeeMessaged;

        groupBreakdown.push({
          name:    grp.name,
          total:   sessTotal,
          present: sessPresent,
          absent:  sessAbsent,
        });
      }

      const data = {
        churchName:        church.name || "My Church",
        dateLabel:         fmtDate(selDate),
        generatedAt:       new Date().toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }),
        total, present, absent,
        absenteesReached,
        attendeesMessaged,
        groups: groupBreakdown.sort((a, b) => b.present - a.present),
      };

      setReportData(data);

      // Draw to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const scale = 2; // retina
        canvas.width  = 1080 * scale;
        canvas.height = 1350 * scale;
        canvas.style.width  = "100%";
        canvas.style.height = "auto";
        const ctx = canvas.getContext("2d");

        // Load fonts first
        await document.fonts.ready;
        drawReport(ctx, data, scale);
        setGenerated(true);
      }
    } catch (e) {
      console.error("[ReportGenerator]", e);
      showToast("Failed to generate report ❌");
    } finally {
      setLoading(false);
    }
  }, [selDate, church, attendanceHistory, groups, members]);

  // ── Download as JPEG ──────────────────────────────────────────────────────
  const downloadJpeg = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url  = canvas.toDataURL("image/jpeg", 0.92);
    const link = document.createElement("a");
    link.download = `churchtrakr-attendance-${selDate}.jpg`;
    link.href = url;
    link.click();
    showToast("Image downloaded! ✅");
  };

  // ── Download as PDF ───────────────────────────────────────────────────────
  const downloadPdf = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Build a minimal single-image PDF by hand (no library needed)
    const jpeg = canvas.toDataURL("image/jpeg", 0.92).split(",")[1];
    const W_PT = 595, H_PT = 842; // A4 in points

    const pdf = buildPdf(jpeg, canvas.width, canvas.height, W_PT, H_PT);
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `churchtrakr-attendance-${selDate}.pdf`;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast("PDF downloaded! ✅");
  };

  // ── Minimal PDF builder (single JPEG page, no dependencies) ──────────────
  function buildPdf(jpegBase64, imgW, imgH, pageW, pageH) {
    const jpegBytes = atob(jpegBase64);
    const jpegLen   = jpegBytes.length;

    // Scale image to fit page with margins
    const margin  = 20;
    const maxW    = pageW - margin * 2;
    const maxH    = pageH - margin * 2;
    const scale   = Math.min(maxW / imgW, maxH / imgH);
    const dstW    = Math.round(imgW * scale);
    const dstH    = Math.round(imgH * scale);
    const xOff    = Math.round((pageW - dstW) / 2);
    const yOff    = Math.round(pageH - dstH - (pageH - dstH) / 2);

    // PDF objects
    const objs = [];
    const offsets = [];

    const obj = (n, content) => { objs[n] = content; };

    obj(1, `<< /Type /Catalog /Pages 2 0 R >>`);
    obj(2, `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`);
    obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Img 5 0 R >> >> >>`);

    const stream = `q ${dstW} 0 0 ${dstH} ${xOff} ${yOff} cm /Img Do Q`;
    obj(4, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    obj(5, `<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegLen} >>\nstream\n${jpegBytes}\nendstream`);

    // Assemble
    let out = "%PDF-1.4\n";
    for (let i = 1; i <= 5; i++) {
      offsets[i] = out.length;
      out += `${i} 0 obj\n${objs[i]}\nendobj\n`;
    }

    const xrefPos = out.length;
    out += `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) {
      out += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    out += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

    // Convert to Uint8Array to preserve binary JPEG bytes
    const bytes = [];
    for (let i = 0; i < out.length; i++) bytes.push(out.charCodeAt(i) & 0xff);
    return new Uint8Array(bytes);
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="page" style={{ background: T.ivory, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(150deg, ${T.forest} 0%, ${T.mid} 60%, #1e4a34 100%)`,
        padding: "max(env(safe-area-inset-top,32px),32px) 22px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-50, right:-30, width:180, height:180,
          borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />
        <div style={{ fontFamily: S, fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>
          Report Generator
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginTop: 4, fontFamily: F }}>
          Branded attendance summaries for sharing
        </div>
      </div>

      <div style={{ padding: "22px 18px 40px" }}>

        {/* ── Date selector ── */}
        <div style={{ background: "#fff", borderRadius: 18, border: `1px solid ${T.border}`,
          boxShadow: "0 1px 6px rgba(0,0,0,.04)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: F, fontWeight: 700, fontSize: 13, color: T.text }}>Select Service Date</div>
            <div style={{ fontFamily: F, fontSize: 12, color: T.muted, marginTop: 2 }}>
              Only dates with recorded attendance are shown
            </div>
          </div>
          <div style={{ padding: "14px 18px" }}>
            {availableDates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13, color: T.muted, fontFamily: F }}>
                  No attendance sessions recorded yet
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {availableDates.map(d => {
                  const sessions = attendanceHistory.filter(s => s.date === d);
                  const total    = sessions.reduce((s, x) => s + x.records.length, 0);
                  const present  = sessions.reduce((s, x) => s + x.records.filter(r => r.present).length, 0);
                  const rate     = total ? Math.round(present/total*100) : 0;
                  const active   = selDate === d;
                  return (
                    <div key={d} onClick={() => { setSelDate(d); setGenerated(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 14,
                        padding: "12px 16px", borderRadius: 12, cursor: "pointer",
                        background: active ? T.forest : "#f9f8f5",
                        border: `1.5px solid ${active ? T.forest : T.border}`,
                        transition: "all .15s",
                      }}>
                      {/* Date */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: F, fontWeight: 700, fontSize: 14,
                          color: active ? "#fff" : T.text }}>
                          {fmtDate(d)}
                        </div>
                        <div style={{ fontFamily: F, fontSize: 11, color: active ? "rgba(255,255,255,.55)" : T.muted, marginTop: 2 }}>
                          {sessions.length} group{sessions.length!==1?"s":""} · {total} members
                        </div>
                      </div>
                      {/* Rate badge */}
                      <div style={{
                        padding: "4px 10px", borderRadius: 20,
                        background: active ? "rgba(255,255,255,.15)" : rate >= 80 ? "#dcfce7" : rate >= 60 ? "#fef9c3" : "#fee2e2",
                        fontFamily: F, fontWeight: 700, fontSize: 12,
                        color: active ? "#fff" : rate >= 80 ? "#16a34a" : rate >= 60 ? "#a16207" : "#dc2626",
                      }}>
                        {rate}%
                      </div>
                      {active && (
                        <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
                          <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Generate button ── */}
        {availableDates.length > 0 && (
          <button onClick={generate} disabled={loading || !selDate}
            style={{
              width: "100%", padding: "16px", borderRadius: 14, marginBottom: 20,
              background: loading ? "#2d5a42" : T.forest, border: "none",
              fontFamily: F, fontWeight: 700, fontSize: 15, color: "#fff",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1,
              boxShadow: "0 4px 18px rgba(26,58,42,.28)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "opacity .2s",
            }}>
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.25)",
                  borderTop: "2px solid #fff", borderRadius: "50%",
                  animation: "spin .7s linear infinite" }} />
                Generating report…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
                </svg>
                {generated ? "Regenerate Report" : "Generate Report"}
              </>
            )}
          </button>
        )}

        {/* ── Preview + download ── */}
        {generated && (
          <div style={{ animation: "fadeIn .3s ease" }}>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
            `}</style>

            {/* Preview */}
            <div style={{ background: "#fff", borderRadius: 18, overflow: "hidden",
              border: `1px solid ${T.border}`, boxShadow: "0 2px 16px rgba(0,0,0,.06)",
              marginBottom: 14 }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green }} />
                <span style={{ fontFamily: F, fontWeight: 700, fontSize: 12,
                  color: T.green, letterSpacing: ".05em", textTransform: "uppercase" }}>
                  Preview
                </span>
                <span style={{ marginLeft: "auto", fontFamily: F, fontSize: 11, color: T.muted }}>
                  {reportData?.churchName} · {reportData?.dateLabel}
                </span>
              </div>
              <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "auto" }} />
            </div>

            {/* Download buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={downloadJpeg} style={{
                flex: 1, padding: "14px 10px", borderRadius: 14,
                background: "#f0fdf4", border: "1.5px solid #86efac",
                fontFamily: F, fontWeight: 700, fontSize: 13.5, color: T.green,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.green}
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Save Image
              </button>
              <button onClick={downloadPdf} style={{
                flex: 1, padding: "14px 10px", borderRadius: 14,
                background: T.forest, border: "none",
                fontFamily: F, fontWeight: 700, fontSize: 13.5, color: "#fff",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
                Save PDF
              </button>
            </div>

            {/* WhatsApp tip */}
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12,
              background: "#f0fdf4", border: "1px solid #86efac",
              display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
              <span style={{ fontFamily: F, fontSize: 12, color: "#15803d", lineHeight: 1.5 }}>
                Download the image, then share directly to your WhatsApp group. The JPEG is optimised for mobile viewing.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}