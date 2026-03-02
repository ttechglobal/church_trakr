// src/pages/Analytics.jsx
import { useState, useMemo } from "react";
import { fmtDate } from "../lib/helpers";

const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

const rateColor = r =>
  r >= 80 ? "#1a7a44" : r >= 65 ? "var(--brand)" : r >= 50 ? "#c07a00" : "#c0392b";
const rateBg = r =>
  r >= 80 ? "#d4f5e4" : r >= 65 ? "#dff0ea" : r >= 50 ? "#fff3cc" : "#fce8e8";

// ── Big bold attendance rate ring ──────────────────────────────────────────────
function RateRing({ rate, size = 90, label }) {
  const r = (size / 2) - 9;
  const circ = 2 * Math.PI * r;
  const dash = circ * (rate / 100);
  const color = rateColor(rate);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray .8s ease" }} />
      </svg>
      <div style={{ marginTop: -size/2 - 10, textAlign: "center", lineHeight: 1 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: size * 0.22, color }}>{rate}%</div>
      </div>
      <div style={{ marginTop: size/2 - 14, fontSize: 11, color: "var(--muted)", fontWeight: 600, textAlign: "center" }}>{label}</div>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ label, value, max, sub, highlight }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  const color = rateColor(value);
  const bg    = rateBg(value);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <div style={{ fontWeight: highlight ? 700 : 600, fontSize: 14, color: highlight ? "var(--brand)" : "var(--text)" }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {sub && <span style={{ fontSize: 11, color: "var(--muted)" }}>{sub}</span>}
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color }}>{value}%</span>
        </div>
      </div>
      <div style={{ background: "var(--surface2)", borderRadius: 8, overflow: "hidden", height: 10 }}>
        <div style={{ width: `${w}%`, height: "100%", background: color, borderRadius: 8, transition: "width .7s ease" }} />
      </div>
    </div>
  );
}

// ── Small week dot chart ──────────────────────────────────────────────────────
function WeekDots({ sessions, limit = 8 }) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date)).slice(-limit);
  if (!sorted.length) return <p style={{ fontSize: 12, color: "var(--muted)" }}>No sessions yet</p>;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 5 }}>
      {sorted.map((s, i) => {
        const total   = s.records.length;
        const present = s.records.filter(r => r.present === true).length;
        const rate    = pct(present, total);
        const color   = rateColor(rate);
        const h       = Math.max(16, Math.round(rate * 0.56));
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color }}>{rate}%</div>
            <div title={`${fmtDate(s.date)}: ${present}/${total}`}
              style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0", background: color, cursor: "default", transition: "height .5s" }} />
            <div style={{ fontSize: 8, color: "var(--muted)", textAlign: "center" }}>{s.date.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Analytics({ groups, members, attendanceHistory }) {
  const currentDate = new Date();
  const [selYear,  setSelYear]  = useState(currentDate.getFullYear());
  const [selMonth, setSelMonth] = useState(currentDate.getMonth()); // 0-indexed
  const [selGroup, setSelGroup] = useState("all");
  const [view,     setView]     = useState("monthly"); // "monthly" | "overall"

  const followUpData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  }, []);

  // Years available in data
  const availableYears = useMemo(() => {
    const years = new Set(attendanceHistory.map(s => s.date.slice(0, 4)));
    years.add(String(currentDate.getFullYear()));
    return [...years].sort().reverse().map(Number);
  }, [attendanceHistory]);

  const filteredHistory = useMemo(() => {
    let h = attendanceHistory;
    if (selGroup !== "all") h = h.filter(s => String(s.groupId) === String(selGroup));
    return h;
  }, [attendanceHistory, selGroup]);

  // Sessions for selected month
  const monthKey = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`;
  const monthSessions = useMemo(() =>
    filteredHistory.filter(s => s.date.startsWith(monthKey)),
    [filteredHistory, monthKey]);

  // Monthly stats
  const monthStats = useMemo(() => {
    const total   = monthSessions.reduce((s, x) => s + x.records.length, 0);
    const present = monthSessions.reduce((s, x) => s + x.records.filter(r => r.present === true).length, 0);
    const absent  = total - present;
    const reached = monthSessions.reduce((s, x) =>
      s + x.records.filter(r => r.present === false && followUpData[`${x.id}_${r.memberId}`]?.reached).length, 0);
    return { total, present, absent, reached, rate: pct(present, total), sessions: monthSessions.length };
  }, [monthSessions, followUpData]);

  // Per-group breakdown for selected month
  const groupMonthBreakdown = useMemo(() => {
    if (selGroup !== "all") return [];
    return groups.map(g => {
      const sess = monthSessions.filter(s => s.groupId === g.id);
      const total   = sess.reduce((s, x) => s + x.records.length, 0);
      const present = sess.reduce((s, x) => s + x.records.filter(r => r.present === true).length, 0);
      return { group: g, sessions: sess.length, total, present, rate: pct(present, total) };
    }).filter(x => x.sessions > 0).sort((a, b) => b.rate - a.rate);
  }, [groups, monthSessions, selGroup]);

  // All-months breakdown for the year (for the "overall" tab)
  const yearBreakdown = useMemo(() => {
    return MONTHS_SHORT.map((label, mi) => {
      const mk   = `${selYear}-${String(mi + 1).padStart(2, "0")}`;
      const sess = filteredHistory.filter(s => s.date.startsWith(mk));
      const total   = sess.reduce((s, x) => s + x.records.length, 0);
      const present = sess.reduce((s, x) => s + x.records.filter(r => r.present === true).length, 0);
      return { label, month: mi, sessions: sess.length, total, present, rate: pct(present, total) };
    });
  }, [filteredHistory, selYear]);

  // Chronic absentees for selected month
  const chronicAbsentees = useMemo(() => {
    const counts = {};
    monthSessions.forEach(s => {
      s.records.filter(r => r.present === false).forEach(r => {
        const key = r.memberId || r.name;
        counts[key] = counts[key] || { name: r.name, count: 0 };
        counts[key].count++;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [monthSessions]);

  // Prev / next month
  const prevMonth = () => {
    if (selMonth === 0) { setSelMonth(11); setSelYear(y => y - 1); }
    else setSelMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selMonth === 11) { setSelMonth(0); setSelYear(y => y + 1); }
    else setSelMonth(m => m + 1);
  };
  const isCurrentMonth = selYear === currentDate.getFullYear() && selMonth === currentDate.getMonth();

  return (
    <div className="page">
      <div className="ph">
        <h1>Analytics</h1>
        <p>Attendance insights by month &amp; group</p>
      </div>

      <div className="pc">

        {/* ── Controls row ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <select className="fi" value={selGroup} onChange={e => setSelGroup(e.target.value)} style={{ flex: 1 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="fi" value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={{ width: 90 }}>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* ── View tabs ── */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${view === "monthly" ? "act" : ""}`} onClick={() => setView("monthly")}>📅 Monthly</button>
          <button className={`tab ${view === "overall" ? "act" : ""}`} onClick={() => setView("overall")}>📊 Year Overview</button>
        </div>

        {/* ══ MONTHLY VIEW ══════════════════════════════════════════════════ */}
        {view === "monthly" && (
          <>
            {/* Month navigator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <button onClick={prevMonth}
                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
              <div style={{ flex: 1, textAlign: "center", padding: "10px 14px", borderRadius: 12, background: "var(--brand)", color: "#fff" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18 }}>
                  {MONTHS_FULL[selMonth]} {selYear}
                </div>
                {monthStats.sessions > 0 && (
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{monthStats.sessions} session{monthStats.sessions !== 1 ? "s" : ""}</div>
                )}
              </div>
              <button onClick={nextMonth} disabled={isCurrentMonth}
                style={{ width: 38, height: 38, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 18, cursor: isCurrentMonth ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: isCurrentMonth ? 0.3 : 1 }}>›</button>
            </div>

            {monthStats.sessions === 0 ? (
              <div className="empty">
                <div className="empty-ico">📅</div>
                <p>No attendance data for {MONTHS_FULL[selMonth]} {selYear}</p>
                <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Try another month or mark some attendance</p>
              </div>
            ) : (
              <>
                {/* Big rate display */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                  <RateRing rate={monthStats.rate} size={110} label="Attendance Rate" />
                </div>

                {/* Stats row */}
                <div className="smbar" style={{ marginBottom: 20 }}>
                  {[
                    ["Present",  monthStats.present, "var(--success)"],
                    ["Absent",   monthStats.absent,  "var(--danger)"],
                    ["Followed", monthStats.reached, "var(--brand)"],
                  ].map(([l, v, c]) => (
                    <div key={l} className="smbox">
                      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 26, color: c }}>{v}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* Session-by-session dots */}
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="stitle" style={{ marginBottom: 12 }}>Sessions this month</div>
                  <WeekDots sessions={monthSessions} limit={8} />
                </div>

                {/* Per-group breakdown */}
                {groupMonthBreakdown.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="stitle" style={{ marginBottom: 14 }}>By Group</div>
                    {groupMonthBreakdown.map(({ group, sessions, total, present, rate }) => (
                      <HBar key={group.id} label={group.name} value={rate} max={100}
                        sub={`${present}/${total} · ${sessions} session${sessions !== 1 ? "s" : ""}`} />
                    ))}
                  </div>
                )}

                {/* Absentees for month */}
                {chronicAbsentees.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div className="stitle" style={{ marginBottom: 4 }}>Absentees this month</div>
                    <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Members who missed at least one session</p>
                    {chronicAbsentees.map((x, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < chronicAbsentees.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{x.name}</div>
                        <span style={{ background: x.count >= 3 ? "#fce8e8" : "#fff8e6", color: x.count >= 3 ? "var(--danger)" : "#8a5a00", fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                          Missed {x.count}×
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══ YEAR OVERVIEW ═════════════════════════════════════════════════ */}
        {view === "overall" && (
          <>
            <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--surface2)", borderRadius: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)", marginBottom: 2 }}>{selYear} Summary</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {filteredHistory.filter(s => s.date.startsWith(String(selYear))).length} total sessions
              </div>
            </div>

            {/* 12-month bar chart */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="stitle" style={{ marginBottom: 14 }}>Monthly Attendance Rate</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110 }}>
                {yearBreakdown.map(({ label, month, sessions, rate }) => {
                  const isThis = month === currentDate.getMonth() && selYear === currentDate.getFullYear();
                  const isSel  = month === selMonth;
                  const color  = rateColor(rate);
                  const h      = sessions ? Math.max(12, Math.round(rate * 0.82)) : 4;
                  return (
                    <div key={month} onClick={() => { setSelMonth(month); setView("monthly"); }}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: sessions ? "pointer" : "default" }}>
                      {sessions > 0 && <div style={{ fontSize: 8, fontWeight: 700, color }}>{rate}%</div>}
                      <div style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0",
                        background: sessions ? color : "var(--surface2)",
                        outline: isSel ? `2px solid var(--brand)` : isThis ? `2px solid var(--accent)` : "none",
                        transition: "height .5s" }} />
                      <div style={{ fontSize: 9, fontWeight: isThis ? 700 : 400, color: isThis ? "var(--brand)" : "var(--muted)", textAlign: "center" }}>
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                {[["80%+", "#1a7a44"], ["65–79%", "var(--brand)"], ["50–64%", "#c07a00"], ["<50%", "#c0392b"]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-group full-year averages */}
            {groups.filter(g => attendanceHistory.some(s => s.groupId === g.id && s.date.startsWith(String(selYear)))).length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="stitle" style={{ marginBottom: 14 }}>Group Averages — {selYear}</div>
                {groups.map(g => {
                  const sess    = filteredHistory.filter(s => s.groupId === g.id && s.date.startsWith(String(selYear)));
                  if (!sess.length) return null;
                  const total   = sess.reduce((s, x) => s + x.records.length, 0);
                  const present = sess.reduce((s, x) => s + x.records.filter(r => r.present === true).length, 0);
                  const rate    = pct(present, total);
                  const mCount  = members.filter(m => (m.groupIds || []).includes(g.id)).length;
                  return (
                    <HBar key={g.id} label={g.name} value={rate} max={100}
                      sub={`${mCount} members · ${sess.length} sessions`} />
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}