// src/pages/Analytics.jsx
import { useState, useMemo } from "react";
import { fmtDate } from "../lib/helpers";

const MONTHS_FULL  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pct(n, d) { return d ? Math.round((n / d) * 100) : 0; }

const rateColor = r => r >= 80 ? "#1a7a44" : r >= 65 ? "var(--brand)" : r >= 50 ? "#c07a00" : "#c0392b";
const rateBg    = r => r >= 80 ? "#d4f5e4" : r >= 65 ? "#dff0ea" : r >= 50 ? "#fff3cc" : "#fce8e8";

// ── Rate ring ──────────────────────────────────────────────────────────────────
function RateRing({ rate, size = 90, label }) {
  const r    = (size / 2) - 9;
  const circ = 2 * Math.PI * r;
  const dash = circ * (rate / 100);
  const color = rateColor(rate);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
      <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={8} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition:"stroke-dasharray .8s ease" }} />
      </svg>
      <div style={{ marginTop:-size/2-10, textAlign:"center", lineHeight:1 }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:size*0.22, color }}>{rate}%</div>
      </div>
      <div style={{ marginTop:size/2-14, fontSize:11, color:"var(--muted)", fontWeight:600, textAlign:"center" }}>{label}</div>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ label, value, max, sub, highlight }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  const color = rateColor(value);
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
        <div style={{ fontWeight:highlight?700:600, fontSize:14, color:highlight?"var(--brand)":"var(--text)" }}>{label}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {sub && <span style={{ fontSize:11, color:"var(--muted)" }}>{sub}</span>}
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:16, color }}>{value}%</span>
        </div>
      </div>
      <div style={{ background:"var(--surface2)", borderRadius:8, overflow:"hidden", height:10 }}>
        <div style={{ width:`${w}%`, height:"100%", background:color, borderRadius:8, transition:"width .7s ease" }} />
      </div>
    </div>
  );
}

// ── Sunday-by-Sunday bar chart ────────────────────────────────────────────────
function SundayChart({ sessions }) {
  if (!sessions.length) return (
    <p style={{ fontSize:13, color:"var(--muted)", textAlign:"center", padding:"16px 0" }}>No sessions this month</p>
  );

  // Group by date, sum across all groups
  const byDate = {};
  sessions.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = { present:0, total:0 };
    byDate[s.date].present += s.records.filter(r => r.present===true).length;
    byDate[s.date].total   += s.records.length;
  });

  const sorted = Object.entries(byDate).sort(([a],[b]) => a.localeCompare(b));
  const maxH = 80;

  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, padding:"8px 0 4px" }}>
      {sorted.map(([date, d], i) => {
        const rate  = pct(d.present, d.total);
        const color = rateColor(rate);
        const h     = d.total ? Math.max(14, Math.round(rate / 100 * maxH)) : 6;
        // Label: "Sun 2", "Sun 9" etc from date
        const dayNum = parseInt(date.slice(8), 10);
        const sunLabel = `Sun ${dayNum}`;
        return (
          <div key={date} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:13, color }}>{rate}%</div>
            <div
              title={`${fmtDate(date)}: ${d.present} present / ${d.total} total`}
              style={{ width:"100%", height:h, borderRadius:"6px 6px 0 0", background:color,
                transition:"height .6s ease", cursor:"default", minHeight:6 }}
            />
            <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, textAlign:"center",
              letterSpacing:".02em" }}>{sunLabel}</div>
            <div style={{ fontSize:9, color:"var(--muted)", opacity:.7 }}>{d.present}/{d.total}</div>
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
  const [selMonth, setSelMonth] = useState(currentDate.getMonth());
  const [selGroup, setSelGroup] = useState("all");
  const [view,     setView]     = useState("monthly");

  const followUpData = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(attendanceHistory.map(s => s.date.slice(0,4)));
    years.add(String(currentDate.getFullYear()));
    return [...years].sort().reverse().map(Number);
  }, [attendanceHistory]);

  const filteredHistory = useMemo(() => {
    let h = attendanceHistory;
    if (selGroup !== "all") h = h.filter(s => String(s.groupId) === String(selGroup));
    return h;
  }, [attendanceHistory, selGroup]);

  const monthKey = `${selYear}-${String(selMonth+1).padStart(2,"0")}`;
  const monthSessions = useMemo(() =>
    filteredHistory.filter(s => s.date.startsWith(monthKey)),
    [filteredHistory, monthKey]);

  // ── Follow-up stats for month ──
  const followUpStats = useMemo(() => {
    // All absentees this month (unique members)
    const absentSet = new Set();
    const absentList = [];
    monthSessions.forEach(s => {
      s.records.filter(r => r.present === false).forEach(r => {
        const key = String(r.memberId || r.name);
        if (!absentSet.has(key)) {
          absentSet.add(key);
          absentList.push({ key, name: r.name, sessionId: s.id });
        }
      });
    });
    const totalAbsent = absentSet.size;

    // How many were followed up (SMS sent) — check ct_followup keys
    const followedUp = absentList.filter(a => {
      // Check any session for this member
      return monthSessions.some(s =>
        followUpData[`${s.id}_${a.key}`]?.reached
      );
    }).length;

    const followUpRate = pct(followedUp, totalAbsent);
    return { totalAbsent, followedUp, notFollowedUp: totalAbsent - followedUp, followUpRate };
  }, [monthSessions, followUpData]);

  const monthStats = useMemo(() => {
    const total   = monthSessions.reduce((s,x) => s + x.records.length, 0);
    const present = monthSessions.reduce((s,x) => s + x.records.filter(r => r.present===true).length, 0);
    const absent  = total - present;
    return { total, present, absent, rate: pct(present, total), sessions: monthSessions.length };
  }, [monthSessions]);

  const groupMonthBreakdown = useMemo(() => {
    if (selGroup !== "all") return [];
    return groups.map(g => {
      const sess    = monthSessions.filter(s => s.groupId === g.id);
      const total   = sess.reduce((s,x) => s + x.records.length, 0);
      const present = sess.reduce((s,x) => s + x.records.filter(r => r.present===true).length, 0);
      return { group:g, sessions:sess.length, total, present, rate:pct(present,total) };
    }).filter(x => x.sessions > 0).sort((a,b) => b.rate - a.rate);
  }, [groups, monthSessions, selGroup]);

  const yearBreakdown = useMemo(() =>
    MONTHS_SHORT.map((label, mi) => {
      const mk   = `${selYear}-${String(mi+1).padStart(2,"0")}`;
      const sess = filteredHistory.filter(s => s.date.startsWith(mk));
      const total   = sess.reduce((s,x) => s + x.records.length, 0);
      const present = sess.reduce((s,x) => s + x.records.filter(r => r.present===true).length, 0);
      return { label, month:mi, sessions:sess.length, total, present, rate:pct(present,total) };
    }),
    [filteredHistory, selYear]);

  const chronicAbsentees = useMemo(() => {
    const counts = {};
    monthSessions.forEach(s => {
      s.records.filter(r => r.present===false).forEach(r => {
        const key = r.memberId || r.name;
        counts[key] = counts[key] || { name:r.name, count:0 };
        counts[key].count++;
      });
    });
    return Object.values(counts).sort((a,b) => b.count - a.count).slice(0,8);
  }, [monthSessions]);

  const prevMonth = () => { if (selMonth===0) { setSelMonth(11); setSelYear(y=>y-1); } else setSelMonth(m=>m-1); };
  const nextMonth = () => { if (selMonth===11) { setSelMonth(0); setSelYear(y=>y+1); } else setSelMonth(m=>m+1); };
  const isCurrentMonth = selYear===currentDate.getFullYear() && selMonth===currentDate.getMonth();

  return (
    <div className="page">
      <div style={{
        background:"linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding:"max(env(safe-area-inset-top,32px),32px) 22px 24px",
        position:"relative", overflow:"hidden",
      }}>
        <div style={{ position:"absolute", top:-50, right:-40, width:200, height:200,
          borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-30, left:-20, width:120, height:120,
          borderRadius:"50%", background:"rgba(201,168,76,.05)", pointerEvents:"none" }} />
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:27, fontWeight:800, color:"#fff", letterSpacing:"-.015em" }}>Analytics</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.52)", marginTop:5, fontWeight:500 }}>Attendance &amp; follow-up insights</div>
      </div>

      <div className="pc">

        {/* Controls */}
        <div style={{ display:"flex", gap:8, marginBottom:16, alignItems:"center" }}>
          <select className="fi" value={selGroup} onChange={e => setSelGroup(e.target.value)} style={{ flex:1, minWidth:0 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="fi" value={selYear} onChange={e => setSelYear(Number(e.target.value))} style={{ width:90 }}>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* View tabs */}
        <div className="tabs" style={{ marginBottom:16 }}>
          <button className={`tab ${view==="monthly"?"act":""}`} onClick={() => setView("monthly")}>📅 Monthly</button>
          <button className={`tab ${view==="overall"?"act":""}`} onClick={() => setView("overall")}>📊 Year</button>
        </div>

        {/* ══ MONTHLY ══════════════════════════════════════════════════════ */}
        {view === "monthly" && (
          <>
            {/* Month navigator */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
              <button onClick={prevMonth}
                style={{ width:40, height:40, borderRadius:10, border:"1px solid var(--border)", background:"var(--surface)", fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"var(--transition)", boxShadow:"var(--sh)", flexShrink:0 }}>‹</button>
              <div style={{ flex:1, textAlign:"center", padding:"10px 14px", borderRadius:12, background:"var(--brand)", color:"#fff" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:18 }}>
                  {MONTHS_FULL[selMonth]} {selYear}
                </div>
                {monthStats.sessions > 0 && (
                  <div style={{ fontSize:11, opacity:.75, marginTop:2 }}>{monthStats.sessions} session{monthStats.sessions!==1?"s":""}</div>
                )}
              </div>
              <button onClick={nextMonth} disabled={isCurrentMonth}
                style={{ width:40, height:40, borderRadius:10, border:"1px solid var(--border)", background:"var(--surface)", fontSize:20, cursor:isCurrentMonth?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity:isCurrentMonth?.3:1, transition:"var(--transition)", boxShadow:"var(--sh)", flexShrink:0 }}>›</button>
            </div>

            {monthStats.sessions === 0 ? (
              <div className="empty">
                <div className="empty-ico">📅</div>
                <p style={{ fontWeight:700, fontSize:16, color:"var(--text)", marginBottom:8 }}>No data for {MONTHS_FULL[selMonth]} {selYear}</p>
                <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>Mark some attendance for this month to see reports here.</p>
              </div>
            ) : (
              <>
                {/* Rate ring */}
                <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
                  <RateRing rate={monthStats.rate} size={110} label="Attendance Rate" />
                </div>

                {/* Stats strip */}
                <div className="smbar" style={{ marginBottom:20 }}>
                  {[
                    ["Present",  monthStats.present, "var(--success)"],
                    ["Absent",   monthStats.absent,  "var(--danger)"],
                    ["Sessions", monthStats.sessions, "var(--brand)"],
                  ].map(([l,v,c]) => (
                    <div key={l} className="smbox">
                      <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:26, color:c }}>{v}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>{l}</div>
                    </div>
                  ))}
                </div>

                {/* ── Sunday-by-Sunday chart ── */}
                <div className="card" style={{ marginBottom:16 }}>
                  <div className="stitle" style={{ marginBottom:4 }}>Sunday by Sunday</div>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:14 }}>
                    Attendance rate per Sunday this month
                  </p>
                  <SundayChart sessions={monthSessions} />
                </div>

                {/* Per-group breakdown */}
                {groupMonthBreakdown.length > 0 && (
                  <div className="card" style={{ marginBottom:16 }}>
                    <div className="stitle" style={{ marginBottom:14 }}>By Group</div>
                    {groupMonthBreakdown.map(({ group, sessions, total, present, rate }) => (
                      <HBar key={group.id} label={group.name} value={rate} max={100}
                        sub={`${present}/${total} · ${sessions} session${sessions!==1?"s":""}`} />
                    ))}
                  </div>
                )}

                {/* ── Follow-up Report ── */}
                <div className="card" style={{ marginBottom:16 }}>
                  <div className="stitle" style={{ marginBottom:4 }}>Follow-up Report</div>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>
                    Of those absent this month, how many were followed up?
                  </p>

                  {followUpStats.totalAbsent === 0 ? (
                    <div style={{ textAlign:"center", padding:"12px 0", fontSize:13, color:"var(--muted)" }}>
                      🎉 No absentees this month
                    </div>
                  ) : (
                    <>
                      {/* Follow-up rate ring */}
                      <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                        <RateRing rate={followUpStats.followUpRate} size={90} label="Follow-up Rate" />
                      </div>

                      {/* Follow-up stat strip */}
                      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                        {[
                          ["Absent",       followUpStats.totalAbsent,    "var(--danger)",  "#fce8e8"],
                          ["Followed Up",  followUpStats.followedUp,     "var(--success)", "#d4f5e4"],
                          ["Not Reached",  followUpStats.notFollowedUp,  "#c07a00",        "#fff3cc"],
                        ].map(([l,v,c,bg]) => (
                          <div key={l} style={{ flex:1, background:bg, borderRadius:12, padding:"12px 8px", textAlign:"center",
                            border:`1px solid ${c}22` }}>
                            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:22, color:c, lineHeight:1 }}>{v}</div>
                            <div style={{ fontSize:10, color:c, fontWeight:600, marginTop:4, opacity:.8,
                              letterSpacing:".03em", textTransform:"uppercase" }}>{l}</div>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:12, color:"var(--muted)" }}>Follow-up progress</span>
                          <span style={{ fontSize:12, fontWeight:700, color: rateColor(followUpStats.followUpRate) }}>
                            {followUpStats.followedUp}/{followUpStats.totalAbsent}
                          </span>
                        </div>
                        <div style={{ background:"var(--surface2)", borderRadius:8, height:10, overflow:"hidden" }}>
                          <div style={{ width:`${followUpStats.followUpRate}%`, height:"100%",
                            background: rateColor(followUpStats.followUpRate),
                            borderRadius:8, transition:"width .7s ease" }} />
                        </div>
                        {followUpStats.notFollowedUp > 0 && (
                          <p style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>
                            💡 {followUpStats.notFollowedUp} absent member{followUpStats.notFollowedUp!==1?"s":""} not yet followed up — go to Absentees to send SMS
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Absentees list */}
                {chronicAbsentees.length > 0 && (
                  <div className="card" style={{ marginBottom:16 }}>
                    <div className="stitle" style={{ marginBottom:4 }}>Most Absent Members</div>
                    <p style={{ fontSize:12, color:"var(--muted)", marginBottom:12 }}>Members who missed the most sessions</p>
                    {chronicAbsentees.map((x,i) => (
                      <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                        padding:"9px 0", borderBottom: i < chronicAbsentees.length-1 ? "1px solid var(--border)" : "none" }}>
                        <div style={{ fontWeight:600, fontSize:14 }}>{x.name}</div>
                        <span style={{ background:x.count>=3?"#fce8e8":"#fff8e6", color:x.count>=3?"var(--danger)":"#8a5a00",
                          fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:20 }}>
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

        {/* ══ YEAR OVERVIEW ════════════════════════════════════════════════ */}
        {view === "overall" && (
          <>
            <div style={{ marginBottom:16, padding:"10px 14px", background:"var(--surface2)", borderRadius:12 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"var(--brand)", marginBottom:2 }}>{selYear} Summary</div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>
                {filteredHistory.filter(s => s.date.startsWith(String(selYear))).length} total sessions
              </div>
            </div>

            {/* 12-month bar chart */}
            <div className="card" style={{ marginBottom:16 }}>
              <div className="stitle" style={{ marginBottom:14 }}>Monthly Attendance Rate</div>
              <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:110 }}>
                {yearBreakdown.map(({ label, month, sessions, rate }) => {
                  const isThis = month===currentDate.getMonth() && selYear===currentDate.getFullYear();
                  const isSel  = month===selMonth;
                  const color  = rateColor(rate);
                  const h      = sessions ? Math.max(12, Math.round(rate*.82)) : 4;
                  return (
                    <div key={month} onClick={() => { setSelMonth(month); setView("monthly"); }}
                      style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:sessions?"pointer":"default" }}>
                      {sessions > 0 && <div style={{ fontSize:8, fontWeight:700, color }}>{rate}%</div>}
                      <div style={{ width:"100%", height:h, borderRadius:"4px 4px 0 0",
                        background:sessions?color:"var(--surface2)",
                        outline:isSel?`2px solid var(--brand)`:isThis?`2px solid var(--accent)`:"none",
                        transition:"height .5s" }} />
                      <div style={{ fontSize:9, fontWeight:isThis?700:400, color:isThis?"var(--brand)":"var(--muted)", textAlign:"center" }}>
                        {label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:12, marginTop:10, flexWrap:"wrap" }}>
                {[["80%+","#1a7a44"],["65–79%","var(--brand)"],["50–64%","#c07a00"],["<50%","#c0392b"]].map(([l,c]) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"var(--muted)" }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:c }} />{l}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-group year averages */}
            {groups.filter(g => attendanceHistory.some(s => s.groupId===g.id && s.date.startsWith(String(selYear)))).length > 0 && (
              <div className="card" style={{ marginBottom:16 }}>
                <div className="stitle" style={{ marginBottom:14 }}>Group Averages — {selYear}</div>
                {groups.map(g => {
                  const sess    = filteredHistory.filter(s => s.groupId===g.id && s.date.startsWith(String(selYear)));
                  if (!sess.length) return null;
                  const total   = sess.reduce((s,x) => s + x.records.length, 0);
                  const present = sess.reduce((s,x) => s + x.records.filter(r => r.present===true).length, 0);
                  const rate    = pct(present, total);
                  const mCount  = members.filter(m => (m.groupIds||[]).includes(g.id)).length;
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