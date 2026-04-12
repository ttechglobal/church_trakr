// src/pages/ReportGenerator.jsx
// Report Generator — Sunday Report + Monthly Report
// DOM-based templates captured with html2canvas at scale:3 for WhatsApp-quality output.
// No canvas drawing API — uses real HTML/CSS for crisp text, emoji, and layout.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { fmtDate } from "../lib/helpers";
import { fetchFollowUpData } from "../services/api";

// ── Design tokens ─────────────────────────────────────────────────────────────
const FOREST  = "#1a3a2a";
const MID     = "#2d5a42";
const DIM     = "#1e4a34";
const GREEN   = "#16a34a";
const GOLD    = "#c9a84c";
const GOLD_L  = "#e8d5a0";
const RED     = "#dc2626";
const AMBER   = "#d97706";
const BLUE    = "#1d4ed8";
const IVORY   = "#f7f5f0";
const WARM    = "#f0eeea";
const MUTED   = "#9ca3af";
const BORDER  = "#e2e0da";
const TEXT    = "#1c1917";
const SERIF   = "'Playfair Display', Georgia, serif";
const SANS    = "'DM Sans', system-ui, sans-serif";

const rateColor = r => r >= 80 ? GREEN : r >= 60 ? AMBER : RED;
const rateLabel = r => r >= 80 ? "Strong" : r >= 60 ? "Fair" : "Low";

// ── SVG circular progress ring ────────────────────────────────────────────────
function Ring({ rate, size = 120, stroke = 10, color, label, sublabel }) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const col = color || rateColor(rate);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BORDER} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
            strokeDasharray={`${c * rate / 100} ${c}`} strokeLinecap="round" />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: size * 0.22, color: col, lineHeight: 1 }}>
            {rate}%
          </div>
          {sublabel && (
            <div style={{ fontFamily: SANS, fontSize: size * 0.09, color: MUTED, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>
              {sublabel}
            </div>
          )}
        </div>
      </div>
      {label && (
        <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: MUTED,
          textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, color, bg, border: bdr }) {
  return (
    <div style={{
      flex: 1, background: bg, border: `1.5px solid ${bdr}`,
      borderRadius: 16, padding: "18px 12px", textAlign: "center",
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 38, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, color,
        textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 5 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

// ── Brand header ──────────────────────────────────────────────────────────────
function BrandHeader({ churchName, subtitle }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${FOREST} 0%, ${MID} 60%, ${DIM} 100%)`,
      padding: "28px 32px 22px", position: "relative", overflow: "hidden",
    }}>
      {/* Decorative orb */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220,
        borderRadius: "50%", background: "rgba(201,168,76,.1)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -40, left: -20, width: 140, height: 140,
        borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />

      {/* Logo row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, position: "relative" }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: "rgba(255,255,255,.13)", border: "1.5px solid rgba(255,255,255,.2)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M2 7L6.5 11.5L16 2" stroke={GOLD} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 15, color: "#fff",
            letterSpacing: "-0.01em", lineHeight: 1.1 }}>ChurchTrakr</div>
          <div style={{ fontFamily: SANS, fontSize: 10, color: "rgba(255,255,255,.45)",
            fontWeight: 600, letterSpacing: "0.04em", marginTop: 1 }}>ATTENDANCE REPORT</div>
        </div>
        {/* Gold accent line */}
        <div style={{ marginLeft: "auto", height: 2, width: 40, background: GOLD,
          borderRadius: 99, opacity: 0.6 }} />
      </div>

      {/* Church name */}
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 26,
        color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, position: "relative" }}>
        {churchName}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 13, color: "rgba(255,255,255,.5)",
        marginTop: 5, fontWeight: 500, position: "relative" }}>
        {subtitle}
      </div>
    </div>
  );
}

// ── SUNDAY REPORT TEMPLATE ────────────────────────────────────────────────────
function SundayTemplate({ data }) {
  const rate        = data.total ? Math.round(data.present / data.total * 100) : 0;
  const rCol        = rateColor(rate);
  const absentRate  = data.total ? Math.round(data.absent  / data.total * 100) : 0;
  const reachedRate = data.absent ? Math.round(data.absenteesReached / data.absent * 100) : 0;
  const msgRate     = data.present ? Math.round(data.attendeesMessaged / data.present * 100) : 0;

  return (
    <div style={{ width: 800, background: IVORY, fontFamily: SANS }}>
      <BrandHeader churchName={data.churchName} subtitle={`Sunday Service · ${data.dateLabel}`} />

      <div style={{ padding: "24px 28px" }}>

        {/* ── Main stats row ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
          <StatCard icon="✅" value={data.present} label="Present"
            sub={`${rate}% of ${data.total}`}
            color={GREEN} bg="#f0fdf4" border="#86efac" />
          <StatCard icon="❌" value={data.absent} label="Absent"
            sub={`${absentRate}% of ${data.total}`}
            color={RED} bg="#fef2f2" border="#fca5a5" />
          <StatCard icon="👥" value={data.total} label="Expected"
            sub="total members" color={FOREST} bg="#f7f5f0" border={BORDER} />
        </div>

        {/* ── Attendance rate ring + label ── */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20,
          padding: "22px 28px", marginBottom: 18,
          display: "flex", alignItems: "center", gap: 28,
        }}>
          <Ring rate={rate} size={130} stroke={11} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700,
              color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
              Attendance Rate
            </div>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 42,
              color: rCol, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {rate}%
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: rCol,
              fontWeight: 700, marginTop: 4 }}>
              {rateLabel(rate)} attendance this Sunday
            </div>
            {/* Mini bar */}
            <div style={{ marginTop: 14, height: 8, background: BORDER,
              borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: `${rate}%`, height: "100%",
                background: `linear-gradient(90deg, ${rCol}, ${rateColor(Math.min(100, rate + 10))})`,
                borderRadius: 99, transition: "width .5s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between",
              marginTop: 5, fontFamily: SANS, fontSize: 10, color: MUTED }}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>

        {/* ── Follow-up section ── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700,
            color: MUTED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
            Follow-Up
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Absentees reached */}
            <div style={{
              flex: 1, background: "#eff6ff", border: "1.5px solid #bfdbfe",
              borderRadius: 16, padding: "16px 14px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <Ring rate={reachedRate} size={72} stroke={7} color={BLUE} />
              <div>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26,
                  color: BLUE, lineHeight: 1 }}>
                  {data.absenteesReached}/{data.absent}
                </div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11,
                  color: BLUE, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                  Absentees Reached
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {reachedRate}% follow-up rate
                </div>
              </div>
            </div>
            {/* Attendees messaged */}
            <div style={{
              flex: 1, background: "#f0fdf4", border: "1.5px solid #86efac",
              borderRadius: 16, padding: "16px 14px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <Ring rate={msgRate} size={72} stroke={7} color={GREEN} />
              <div>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 26,
                  color: GREEN, lineHeight: 1 }}>
                  {data.attendeesMessaged}/{data.present}
                </div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11,
                  color: GREEN, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 4 }}>
                  Attendees Thanked
                </div>
                <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {msgRate}% message rate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Group breakdown ── */}
        {data.groups?.length > 0 && (
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`,
            borderRadius: 18, overflow: "hidden", marginBottom: 18,
          }}>
            <div style={{ padding: "13px 18px", borderBottom: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: FOREST }} />
              <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11,
                color: FOREST, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                By Group
              </span>
            </div>
            {data.groups.slice(0, 6).map((g, i) => {
              const gr = g.total ? Math.round(g.present / g.total * 100) : 0;
              const gc = rateColor(gr);
              return (
                <div key={g.name} style={{
                  padding: "12px 18px",
                  borderBottom: i < Math.min(data.groups.length, 6) - 1 ? `1px solid #f0eeea` : "none",
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13,
                      color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.name}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {g.present} of {g.total} present
                    </div>
                  </div>
                  {/* Mini ring */}
                  <Ring rate={gr} size={44} stroke={5} color={gc} />
                  <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 18,
                    color: gc, width: 42, textAlign: "right" }}>
                    {gr}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 28px 18px", borderTop: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="12" height="10" viewBox="0 0 16 13" fill="none">
            <path d="M2 6.5L6 10.5L14 2" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: SANS, fontSize: 11, color: MUTED, fontWeight: 600 }}>
            ChurchTrakr
          </span>
        </div>
        <span style={{ fontFamily: SANS, fontSize: 10, color: MUTED }}>
          Generated {data.generatedAt}
        </span>
      </div>
    </div>
  );
}

// ── MONTHLY REPORT TEMPLATE ───────────────────────────────────────────────────
function MonthlyTemplate({ data }) {
  const trendColor = data.trend > 2 ? GREEN : data.trend < -2 ? RED : AMBER;
  const trendLabel = data.trend > 2 ? "Growing ↑" : data.trend < -2 ? "Declining ↓" : "Stable →";
  const trendBg    = data.trend > 2 ? "#f0fdf4" : data.trend < -2 ? "#fef2f2" : "#fefce8";
  const trendBdr   = data.trend > 2 ? "#86efac" : data.trend < -2 ? "#fca5a5" : "#fde68a";

  // ordinal labels for Sundays
  const ordinals = ["1st","2nd","3rd","4th","5th"];

  return (
    <div style={{ width: 800, background: IVORY, fontFamily: SANS }}>
      <BrandHeader
        churchName={data.churchName}
        subtitle={`Monthly Report · ${data.monthLabel}`}
      />

      <div style={{ padding: "24px 28px" }}>

        {/* ── Top summary row ── */}
        <div style={{ display: "flex", gap: 14, marginBottom: 22, alignItems: "stretch" }}>
          {/* Big ring */}
          <div style={{
            background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20,
            padding: "20px 22px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 8, minWidth: 160,
          }}>
            <Ring rate={data.avgRate} size={120} stroke={10} label="Avg. Rate" />
          </div>

          {/* Stats column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flex: 1 }}>
              <div style={{ flex: 1, background: "#f0fdf4", border: "1.5px solid #86efac",
                borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 32, color: GREEN, lineHeight: 1 }}>
                  {data.totalPresent}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700,
                  color: GREEN, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                  Total Present
                </div>
              </div>
              <div style={{ flex: 1, background: "#fef2f2", border: "1.5px solid #fca5a5",
                borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 32, color: RED, lineHeight: 1 }}>
                  {data.totalPossible - data.totalPresent}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700,
                  color: RED, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                  Total Absent
                </div>
              </div>
            </div>

            {/* Trend badge */}
            <div style={{ background: trendBg, border: `1.5px solid ${trendBdr}`,
              borderRadius: 14, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10 }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700,
                  color: trendColor, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Monthly Trend
                </div>
                <div style={{ fontFamily: SERIF, fontWeight: 800, fontSize: 22,
                  color: trendColor, marginTop: 2 }}>
                  {trendLabel}
                </div>
              </div>
              {Math.abs(data.trend) > 0 && (
                <div style={{ marginLeft: "auto", fontFamily: SERIF, fontWeight: 800,
                  fontSize: 20, color: trendColor }}>
                  {data.trend > 0 ? "+" : ""}{data.trend}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sunday-by-Sunday breakdown ── */}
        <div style={{
          background: "#fff", border: `1px solid ${BORDER}`,
          borderRadius: 18, overflow: "hidden", marginBottom: 18,
        }}>
          <div style={{ padding: "13px 18px", borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11,
              color: FOREST, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              Sunday Breakdown
            </span>
          </div>
          {data.sundayStats.map((s, i) => {
            const rc = rateColor(s.rate);
            return (
              <div key={s.date} style={{
                padding: "13px 18px",
                borderBottom: i < data.sundayStats.length - 1 ? `1px solid #f0eeea` : "none",
                display: "flex", alignItems: "center", gap: 14,
              }}>
                {/* Ordinal label */}
                <div style={{
                  width: 48, flexShrink: 0, fontFamily: SANS,
                  fontSize: 11, fontWeight: 700, color: MUTED,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  {ordinals[i] || `${i+1}th`}<br/>
                  <span style={{ fontWeight: 400, fontSize: 10 }}>Sun</span>
                </div>

                {/* Date */}
                <div style={{ width: 70, flexShrink: 0, fontFamily: SANS,
                  fontSize: 12, color: TEXT, fontWeight: 600 }}>
                  {new Date(s.date + "T00:00:00").toLocaleDateString("en-NG",
                    { month: "short", day: "numeric" })}
                </div>

                {/* Bar */}
                <div style={{ flex: 1, height: 10, background: BORDER,
                  borderRadius: 99, overflow: "hidden" }}>
                  <div style={{
                    width: `${s.rate}%`, height: "100%",
                    background: `linear-gradient(90deg, ${rc}, ${rc}dd)`,
                    borderRadius: 99,
                  }} />
                </div>

                {/* Stats */}
                <div style={{ display: "flex", alignItems: "center", gap: 10,
                  flexShrink: 0, minWidth: 110, justifyContent: "flex-end" }}>
                  <span style={{ fontFamily: SANS, fontSize: 12, color: TEXT, fontWeight: 600 }}>
                    {s.present}/{s.total}
                  </span>
                  <div style={{
                    background: s.rate >= 80 ? "#dcfce7" : s.rate >= 60 ? "#fef9c3" : "#fee2e2",
                    color: rc, borderRadius: 20, padding: "2px 10px",
                    fontFamily: SANS, fontWeight: 800, fontSize: 12,
                    minWidth: 52, textAlign: "center",
                  }}>
                    {s.rate}%
                  </div>
                </div>
              </div>
            );
          })}

          {/* Monthly average row */}
          <div style={{
            padding: "13px 18px", background: WARM,
            borderTop: `2px solid ${BORDER}`,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 48, flexShrink: 0, fontFamily: SANS, fontSize: 11,
              fontWeight: 700, color: FOREST, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Avg
            </div>
            <div style={{ width: 70, flexShrink: 0, fontFamily: SANS, fontSize: 12,
              color: FOREST, fontWeight: 700 }}>Monthly</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: SANS, fontSize: 12, color: FOREST, fontWeight: 700 }}>
                {data.totalPresent}/{data.totalPossible}
              </span>
              <div style={{
                background: rateColor(data.avgRate) === GREEN ? "#dcfce7"
                          : rateColor(data.avgRate) === AMBER ? "#fef9c3" : "#fee2e2",
                color: rateColor(data.avgRate), borderRadius: 20, padding: "2px 10px",
                fontFamily: SANS, fontWeight: 800, fontSize: 12, minWidth: 52, textAlign: "center",
              }}>
                {data.avgRate}%
              </div>
            </div>
          </div>
        </div>

        {/* ── Notable members sections ── */}
        {data.repeatedAbsentees?.length > 0 && (
          <div style={{
            background: "#fff8f0", border: "1.5px solid #fed7aa",
            borderRadius: 16, padding: "14px 18px", marginBottom: 14,
          }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11,
              color: "#c2410c", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              ⚠️ Absent More Than Once
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {data.repeatedAbsentees.slice(0, 8).map(m => (
                <div key={m.id} style={{
                  background: "#fff", border: "1px solid #fed7aa",
                  borderRadius: 20, padding: "4px 12px",
                  fontFamily: SANS, fontSize: 12, color: "#c2410c", fontWeight: 600,
                }}>
                  {m.name}
                  <span style={{ opacity: .6, fontWeight: 400, marginLeft: 4 }}>×{m.count}</span>
                </div>
              ))}
              {data.repeatedAbsentees.length > 8 && (
                <div style={{ background: "#fff", border: "1px solid #fed7aa",
                  borderRadius: 20, padding: "4px 12px",
                  fontFamily: SANS, fontSize: 12, color: MUTED }}>
                  +{data.repeatedAbsentees.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}

        {data.neverAttended?.length > 0 && (
          <div style={{
            background: "#fef2f2", border: "1.5px solid #fca5a5",
            borderRadius: 16, padding: "14px 18px", marginBottom: 18,
          }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11,
              color: RED, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
              ❌ No Attendance This Month
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {data.neverAttended.slice(0, 8).map(m => (
                <div key={m.id} style={{
                  background: "#fff", border: "1px solid #fca5a5",
                  borderRadius: 20, padding: "4px 12px",
                  fontFamily: SANS, fontSize: 12, color: RED, fontWeight: 600,
                }}>
                  {m.name}
                </div>
              ))}
              {data.neverAttended.length > 8 && (
                <div style={{ background: "#fff", border: "1px solid #fca5a5",
                  borderRadius: 20, padding: "4px 12px",
                  fontFamily: SANS, fontSize: 12, color: MUTED }}>
                  +{data.neverAttended.length - 8} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "12px 28px 18px", borderTop: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="12" height="10" viewBox="0 0 16 13" fill="none">
            <path d="M2 6.5L6 10.5L14 2" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily: SANS, fontSize: 11, color: MUTED, fontWeight: 600 }}>ChurchTrakr</span>
        </div>
        <span style={{ fontFamily: SANS, fontSize: 10, color: MUTED }}>
          Generated {data.generatedAt}
        </span>
      </div>
    </div>
  );
}

// ── Monthly data builder ──────────────────────────────────────────────────────
function buildMonthlyData(church, groups, members, attendance, year, month) {
  const startDate = `${year}-${String(month).padStart(2,"0")}-01`;
  const endDate   = `${year}-${String(month).padStart(2,"0")}-31`;

  const sessions = attendance.filter(s => s.date >= startDate && s.date <= endDate);
  const sundays  = [...new Set(sessions.map(s => s.date))].sort();

  const sundayStats = sundays.map(date => {
    const daySess = sessions.filter(s => s.date === date);
    const total   = daySess.reduce((s,x) => s + x.records.length, 0);
    const present = daySess.reduce((s,x) => s + x.records.filter(r=>r.present).length, 0);
    return { date, present, total, rate: total ? Math.round(present/total*100) : 0 };
  });

  // Absent counts per member this month
  const absentCounts = {};
  sessions.forEach(s => {
    s.records.filter(r => !r.present).forEach(r => {
      absentCounts[r.memberId] = (absentCounts[r.memberId] || 0) + 1;
    });
  });
  const repeatedAbsentees = Object.entries(absentCounts)
    .filter(([, c]) => c > 1)
    .map(([id, count]) => ({ id, name: members.find(m=>m.id===id)?.name || "Unknown", count }))
    .sort((a,b) => b.count - a.count);

  const presentIds = new Set(sessions.flatMap(s => s.records.filter(r=>r.present).map(r=>r.memberId)));
  const neverAttended = members.filter(m => !presentIds.has(m.id) &&
    sessions.some(s => s.records.some(r => r.memberId === m.id)));

  const totalPresent   = sundayStats.reduce((s,x) => s+x.present, 0);
  const totalPossible  = sundayStats.reduce((s,x) => s+x.total, 0);
  const avgRate        = totalPossible ? Math.round(totalPresent/totalPossible*100) : 0;

  const half       = Math.floor(sundayStats.length / 2);
  const firstAvg   = half ? Math.round(sundayStats.slice(0,half).reduce((s,x)=>s+x.rate,0)/half) : 0;
  const secondAvg  = sundayStats.slice(half).length
    ? Math.round(sundayStats.slice(half).reduce((s,x)=>s+x.rate,0)/sundayStats.slice(half).length) : 0;
  const trend      = sundayStats.length >= 2 ? secondAvg - firstAvg : 0;

  const monthName = new Date(year, month-1, 1).toLocaleDateString("en-NG", { month:"long", year:"numeric" });

  return {
    churchName: church?.name || "My Church",
    monthLabel: monthName,
    generatedAt: new Date().toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }),
    sundayStats, repeatedAbsentees, neverAttended,
    totalPresent, totalPossible, avgRate, trend,
  };
}

// ── Sunday data builder ───────────────────────────────────────────────────────
function buildSundayData(church, groups, attendance, selDate, absentFollowUp, attFollowUp) {
  const daySessions = attendance.filter(s => s.date === selDate);
  let total=0, present=0, absent=0, absenteesReached=0, attendeesMessaged=0;
  const breakdown = [];

  for (const sess of daySessions) {
    const grp = groups.find(g => g.id === sess.groupId);
    if (!grp) continue;
    const sp = sess.records.filter(r=>r.present).length;
    const sa = sess.records.filter(r=>!r.present).length;
    const st = sess.records.length;
    total+=st; present+=sp; absent+=sa;
    absenteesReached  += sess.records.filter(r=>!r.present && absentFollowUp[`${sess.id}_${r.memberId}`]?.reached).length;
    attendeesMessaged += sess.records.filter(r=> r.present && attFollowUp[`att_${sess.id}_${r.memberId}`]?.messaged).length;
    breakdown.push({ name: grp.name, total: st, present: sp });
  }

  return {
    churchName: church?.name || "My Church",
    dateLabel:  fmtDate(selDate),
    generatedAt: new Date().toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }),
    total, present, absent, absenteesReached, attendeesMessaged,
    groups: breakdown.sort((a,b) => b.present - a.present),
  };
}

// ── Capture helper ────────────────────────────────────────────────────────────
async function captureElement(el) {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(el, {
    scale:        3,
    useCORS:      true,
    logging:      false,
    backgroundColor: IVORY,
    windowWidth:  800,
    onclone: (doc) => {
      // Ensure Google Fonts are loaded in cloned doc
      const link = doc.createElement("link");
      link.rel  = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap";
      doc.head.appendChild(link);
    },
  });
  return canvas;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReportGenerator({ groups, members, attendanceHistory, showToast }) {
  const { church } = useAuth();

  // Tab: "sunday" | "monthly"
  const [tab,        setTab]       = useState("sunday");
  const [loading,    setLoading]   = useState(false);
  const [generated,  setGenerated] = useState(false);
  const [imgUrl,     setImgUrl]    = useState(null);
  const [imgCanvas,  setImgCanvas] = useState(null);

  // Sunday state
  const [selDate,    setSelDate]   = useState("");
  const [sundayData, setSundayData]= useState(null);

  // Monthly state
  const [selYear,    setSelYear]   = useState(new Date().getFullYear());
  const [selMonth,   setSelMonth]  = useState(new Date().getMonth() + 1);
  const [monthlyData,setMonthlyData]=useState(null);

  // Hidden render target
  const renderRef  = useRef(null);

  // Available dates
  const dates = useMemo(() =>
    [...new Set(attendanceHistory.map(s => s.date))]
      .sort((a,b) => b.localeCompare(a)).slice(0, 20),
    [attendanceHistory]
  );

  // Available months derived from attendance
  const months = useMemo(() => {
    const set = new Set(attendanceHistory.map(s => s.date.slice(0,7)));
    return [...set].sort((a,b) => b.localeCompare(a)).slice(0, 12);
  }, [attendanceHistory]);

  useEffect(() => {
    if (!selDate && dates.length > 0) setSelDate(dates[0]);
  }, [dates.join(",")]); // eslint-disable-line

  useEffect(() => {
    if (months.length > 0) {
      const [y, m] = months[0].split("-");
      setSelYear(+y); setSelMonth(+m);
    }
  }, [months.join(",")]); // eslint-disable-line

  // Reset when tab or selection changes
  useEffect(() => { setGenerated(false); setImgUrl(null); }, [tab, selDate, selYear, selMonth]);

  // ── Generate ──────────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!church?.id) return;
    setLoading(true); setGenerated(false); setImgUrl(null);

    try {
      // Fetch follow-up data (only needed for Sunday report)
      let absentFU = {}, attFU = {};
      if (tab === "sunday") {
        [absentFU, attFU] = await Promise.all([
          fetchFollowUpData(church.id).catch(() => ({})),
          // fetchAttendeeFollowUp not in this version of api — graceful fallback
          Promise.resolve({}),
        ]);
      }

      // Build data
      let data;
      if (tab === "sunday") {
        if (!selDate) { showToast("Select a date first"); setLoading(false); return; }
        data = buildSundayData(church, groups, attendanceHistory, selDate, absentFU, attFU);
        setSundayData(data);
      } else {
        data = buildMonthlyData(church, groups, members, attendanceHistory, selYear, selMonth);
        if (!data.sundayStats.length) {
          showToast("No attendance data for that month");
          setLoading(false); return;
        }
        setMonthlyData(data);
      }

      // Wait a tick for React to render the hidden template
      await new Promise(r => setTimeout(r, 80));

      // Capture
      const el = renderRef.current;
      if (!el) throw new Error("Render target not ready");

      const canvas = await captureElement(el);
      setImgCanvas(canvas);
      setImgUrl(canvas.toDataURL("image/jpeg", 0.95));
      setGenerated(true);

    } catch (err) {
      console.error("[Report]", err);
      showToast("Failed to generate report ❌");
    } finally {
      setLoading(false);
    }
  }, [tab, selDate, selYear, selMonth, church, groups, members, attendanceHistory]);

  // ── Download ──────────────────────────────────────────────────────────────
  const saveJpeg = () => {
    if (!imgUrl) return;
    const name = tab === "sunday"
      ? `churchtrakr-sunday-${selDate}.jpg`
      : `churchtrakr-monthly-${selYear}-${String(selMonth).padStart(2,"0")}.jpg`;
    Object.assign(document.createElement("a"), { href: imgUrl, download: name }).click();
    showToast("Image saved ✅");
  };

  const savePdf = () => {
    if (!imgCanvas) return;
    const b64  = imgCanvas.toDataURL("image/jpeg", 0.95).split(",")[1];
    const name = tab === "sunday"
      ? `churchtrakr-sunday-${selDate}.pdf`
      : `churchtrakr-monthly-${selYear}-${String(selMonth).padStart(2,"0")}.pdf`;

    // Hand-built minimal PDF
    const iW = imgCanvas.width, iH = imgCanvas.height;
    const pW = 595, pH = Math.round(pW * iH / iW);
    const sc = (pW - 0) / iW;
    const dW = Math.round(iW * sc), dH = Math.round(iH * sc);
    const jb = atob(b64), jl = jb.length;
    const st = `q ${dW} 0 0 ${dH} 0 0 cm /I Do Q`;
    const objs = {
      1: `<< /Type /Catalog /Pages 2 0 R >>`,
      2: `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
      3: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pW} ${pH}] /Contents 4 0 R /Resources << /XObject << /I 5 0 R >> >> >>`,
      4: `<< /Length ${st.length} >>\nstream\n${st}\nendstream`,
      5: `<< /Type /XObject /Subtype /Image /Width ${iW} /Height ${iH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jl} >>\nstream\n${jb}\nendstream`,
    };
    const offsets = {}; let body = "%PDF-1.4\n";
    for (let i=1;i<=5;i++){ offsets[i]=body.length; body+=`${i} 0 obj\n${objs[i]}\nendobj\n`; }
    const xr = body.length;
    body += `xref\n0 6\n0000000000 65535 f \n`;
    for (let i=1;i<=5;i++) body+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
    body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`;
    const bytes = new Uint8Array(body.length);
    for (let i=0;i<body.length;i++) bytes[i]=body.charCodeAt(i)&0xff;
    const url = URL.createObjectURL(new Blob([bytes],{type:"application/pdf"}));
    Object.assign(document.createElement("a"),{href:url,download:name}).click();
    setTimeout(()=>URL.revokeObjectURL(url),8000);
    showToast("PDF saved ✅");
  };

  // ── Months selector data ──────────────────────────────────────────────────
  const monthOptions = months.map(ym => {
    const [y, m] = ym.split("-");
    const sess   = attendanceHistory.filter(s => s.date.startsWith(ym));
    const tot    = sess.reduce((s,x) => s+x.records.length, 0);
    const pres   = sess.reduce((s,x) => s+x.records.filter(r=>r.present).length, 0);
    const label  = new Date(+y, +m-1, 1).toLocaleDateString("en-NG", { month:"long", year:"numeric" });
    return { ym, y:+y, m:+m, label, sessions: sess.length, rate: tot?Math.round(pres/tot*100):0 };
  });

  // UI constants
  const FOREST_U = "#1a3a2a", MID_U = "#2d5a42", GREEN_U = "#16a34a";
  const BORDER_U = "#e8e6e1", MUTED_U = "#9ca3af", TEXT_U = "#1c1917";
  const FUI = "'DM Sans',system-ui,sans-serif", SUI = "'Playfair Display',serif";

  return (
    <div className="page" style={{ background: "#f7f5f0", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .rpt-tab:hover{background:rgba(255,255,255,.08)!important}
        .rpt-date:hover{background:#f0eeea!important}
      `}</style>

      {/* ── Hidden off-screen render target ── */}
      {/* Always mounted at 800px so captureElement always finds it */}
      <div
        ref={renderRef}
        style={{
          position: "fixed",
          top: 0, left: "-9999px",
          width: 800,
          zIndex: -1,
          pointerEvents: "none",
          fontFamily: FUI,
        }}
      >
        {tab === "sunday" && sundayData && <SundayTemplate data={sundayData} />}
        {tab === "monthly" && monthlyData && <MonthlyTemplate data={monthlyData} />}
      </div>

      {/* ── Page header ── */}
      <div style={{
        background: `linear-gradient(150deg,${FOREST_U} 0%,${MID_U} 60%,#1e4a34 100%)`,
        padding: "28px 22px 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-50, right:-30, width:200, height:200,
          borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />
        <div style={{ fontFamily:SUI, fontSize:25, fontWeight:800, color:"#fff", letterSpacing:"-.02em" }}>
          Report Generator
        </div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.42)", marginTop:4, fontFamily:FUI }}>
          WhatsApp-quality attendance summaries
        </div>
      </div>

      <div style={{ padding: "16px 16px 48px" }}>

        {/* ── Report type tabs ── */}
        <div style={{ display:"flex", background:"#fff", borderRadius:14, padding:4,
          border:`1px solid ${BORDER_U}`, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,.04)" }}>
          {[["sunday","☀️ Sunday Report"],["monthly","📅 Monthly Report"]].map(([key,label]) => (
            <button key={key} className="rpt-tab" onClick={()=>setTab(key)} style={{
              flex:1, padding:"10px 8px", borderRadius:11,
              background: tab===key ? FOREST_U : "transparent",
              color: tab===key ? "#fff" : MUTED_U,
              border:"none", fontFamily:FUI, fontWeight:700, fontSize:13.5,
              cursor:"pointer", transition:"all .18s",
            }}>{label}</button>
          ))}
        </div>

        {/* ── Sunday: date selector ── */}
        {tab === "sunday" && (
          <div style={{ background:"#fff", borderRadius:18, border:`1px solid ${BORDER_U}`,
            overflow:"hidden", marginBottom:14, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ padding:"13px 18px", borderBottom:`1px solid ${BORDER_U}` }}>
              <div style={{ fontFamily:FUI, fontWeight:700, fontSize:13, color:TEXT_U }}>
                Select Sunday
              </div>
              <div style={{ fontFamily:FUI, fontSize:12, color:MUTED_U, marginTop:2 }}>
                Sundays with recorded attendance
              </div>
            </div>
            <div style={{ padding:"8px 12px" }}>
              {dates.length === 0 ? (
                <div style={{ padding:"28px 0", textAlign:"center", fontSize:13, color:MUTED_U }}>
                  No attendance sessions yet
                </div>
              ) : dates.map(d => {
                const sess = attendanceHistory.filter(s=>s.date===d);
                const tot  = sess.reduce((s,x)=>s+x.records.length,0);
                const pres = sess.reduce((s,x)=>s+x.records.filter(r=>r.present).length,0);
                const rate = tot ? Math.round(pres/tot*100) : 0;
                const active = selDate===d;
                const rc   = rate>=80?"#16a34a":rate>=60?"#a16207":"#dc2626";
                const rb   = rate>=80?"#dcfce7":rate>=60?"#fef9c3":"#fee2e2";
                return (
                  <div key={d} className="rpt-date"
                    onClick={()=>setSelDate(d)}
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"10px 14px", borderRadius:12, marginBottom:4,
                      cursor:"pointer", transition:"background .15s",
                      background: active ? FOREST_U : "transparent",
                      border: `1.5px solid ${active ? FOREST_U : "transparent"}`,
                    }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:FUI, fontWeight:700, fontSize:14,
                        color: active ? "#fff" : TEXT_U }}>{fmtDate(d)}</div>
                      <div style={{ fontFamily:FUI, fontSize:11.5, color: active?"rgba(255,255,255,.5)":MUTED_U, marginTop:1 }}>
                        {sess.length} group{sess.length!==1?"s":""} · {tot} members
                      </div>
                    </div>
                    <div style={{
                      padding:"3px 10px", borderRadius:20,
                      background: active?"rgba(255,255,255,.15)":rb,
                      color: active?"#fff":rc,
                      fontFamily:FUI, fontWeight:700, fontSize:12,
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
        )}

        {/* ── Monthly: month selector ── */}
        {tab === "monthly" && (
          <div style={{ background:"#fff", borderRadius:18, border:`1px solid ${BORDER_U}`,
            overflow:"hidden", marginBottom:14, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ padding:"13px 18px", borderBottom:`1px solid ${BORDER_U}` }}>
              <div style={{ fontFamily:FUI, fontWeight:700, fontSize:13, color:TEXT_U }}>
                Select Month
              </div>
            </div>
            <div style={{ padding:"8px 12px" }}>
              {monthOptions.length === 0 ? (
                <div style={{ padding:"28px 0", textAlign:"center", fontSize:13, color:MUTED_U }}>
                  No attendance data yet
                </div>
              ) : monthOptions.map(opt => {
                const active = opt.y===selYear && opt.m===selMonth;
                const rc = opt.rate>=80?"#16a34a":opt.rate>=60?"#a16207":"#dc2626";
                const rb = opt.rate>=80?"#dcfce7":opt.rate>=60?"#fef9c3":"#fee2e2";
                return (
                  <div key={opt.ym} className="rpt-date"
                    onClick={()=>{ setSelYear(opt.y); setSelMonth(opt.m); }}
                    style={{
                      display:"flex", alignItems:"center", gap:12,
                      padding:"10px 14px", borderRadius:12, marginBottom:4,
                      cursor:"pointer", transition:"background .15s",
                      background: active ? FOREST_U : "transparent",
                      border:`1.5px solid ${active ? FOREST_U : "transparent"}`,
                    }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:FUI, fontWeight:700, fontSize:14,
                        color: active?"#fff":TEXT_U }}>{opt.label}</div>
                      <div style={{ fontFamily:FUI, fontSize:11.5,
                        color:active?"rgba(255,255,255,.5)":MUTED_U, marginTop:1 }}>
                        {opt.sessions} Sunday{opt.sessions!==1?"s":""}
                      </div>
                    </div>
                    <div style={{ padding:"3px 10px", borderRadius:20,
                      background:active?"rgba(255,255,255,.15)":rb,
                      color:active?"#fff":rc, fontFamily:FUI, fontWeight:700, fontSize:12 }}>
                      {opt.rate}%
                    </div>
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
        )}

        {/* ── Generate button ── */}
        <button onClick={generate} disabled={loading}
          style={{
            width:"100%", padding:"16px", borderRadius:14, marginBottom:16,
            background: loading ? MID_U : FOREST_U, border:"none",
            fontFamily:FUI, fontWeight:700, fontSize:15, color:"#fff",
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.8 : 1,
            boxShadow:"0 4px 18px rgba(26,58,42,.26)",
            display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            transition:"opacity .2s",
          }}>
          {loading ? (
            <>
              <div style={{ width:17, height:17, border:"2px solid rgba(255,255,255,.25)",
                borderTop:"2px solid #fff", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
              Generating…
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4Z"/>
              </svg>
              {generated ? "Regenerate Report" : "Generate Report"}
            </>
          )}
        </button>

        {/* ── Preview + downloads ── */}
        {generated && imgUrl && (
          <div style={{ animation:"fadeUp .3s ease" }}>
            {/* Preview label */}
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:GREEN_U }} />
              <span style={{ fontFamily:FUI, fontWeight:700, fontSize:11.5,
                color:GREEN_U, textTransform:"uppercase", letterSpacing:".05em" }}>
                Preview
              </span>
              <span style={{ marginLeft:"auto", fontFamily:FUI, fontSize:11, color:MUTED_U }}>
                {tab==="sunday" ? `${sundayData?.churchName} · ${sundayData?.dateLabel}`
                                : monthlyData?.monthLabel}
              </span>
            </div>

            {/* Image preview */}
            <div style={{ background:"#fff", borderRadius:18, overflow:"hidden",
              border:`1px solid ${BORDER_U}`, marginBottom:14,
              boxShadow:"0 2px 16px rgba(0,0,0,.06)" }}>
              <img src={imgUrl} alt="Report preview"
                style={{ display:"block", width:"100%", height:"auto" }} />
            </div>

            {/* Download buttons */}
            <div style={{ display:"flex", gap:10, marginBottom:12 }}>
              <button onClick={saveJpeg} style={{
                flex:1, padding:"14px 10px", borderRadius:14,
                background:"#f0fdf4", border:"1.5px solid #86efac",
                fontFamily:FUI, fontWeight:700, fontSize:14, color:GREEN_U,
                cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", gap:7,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke={GREEN_U} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Save Image
              </button>
              <button onClick={savePdf} style={{
                flex:1, padding:"14px 10px", borderRadius:14,
                background:FOREST_U, border:"none",
                fontFamily:FUI, fontWeight:700, fontSize:14, color:"#fff",
                cursor:"pointer", display:"flex", alignItems:"center",
                justifyContent:"center", gap:7,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6"/>
                </svg>
                Save PDF
              </button>
            </div>

            {/* Tip */}
            <div style={{ padding:"11px 14px", borderRadius:12,
              background:"#f0fdf4", border:"1px solid #86efac",
              display:"flex", alignItems:"flex-start", gap:8 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
              <span style={{ fontFamily:FUI, fontSize:12, color:"#15803d", lineHeight:1.55 }}>
                Save the image and share directly to your WhatsApp group.
                The JPEG is optimised at 3× resolution for crisp mobile viewing.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}