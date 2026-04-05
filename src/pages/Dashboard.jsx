// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { fmtDate } from "../lib/helpers";

const F = "'DM Sans', system-ui, sans-serif";
const S = "'Playfair Display', serif";
const FOREST = "#1a3a2a";
const GREEN  = "#16a34a";

const rateColor = r => r >= 70 ? "#059669" : r >= 50 ? "#d97706" : "#dc2626";
const rateBg    = r => r >= 70 ? "#d1fae5" : r >= 50 ? "#fef3c7" : "#fee2e2";

// Quick action cards
const ACTIONS = [
  { icon:"✅", label:"Attendance",   sub:"Mark service",      to:"/attendance",  bg:"#dcfce7", ic:GREEN      },
  { icon:"🙏", label:"Attendees",    sub:"Send thank-you",    to:"/attendees",   bg:"#dbeafe", ic:"#1d4ed8"  },
  { icon:"📋", label:"Absentees",    sub:"Follow up",         to:"/absentees",   bg:"#fee2e2", ic:"#dc2626"  },
  { icon:"⭐", label:"First Timers", sub:"New visitors",      to:"/firsttimers", bg:"#fef3c7", ic:"#d97706"  },
  { icon:"💬", label:"Messaging",    sub:"Send SMS",          to:"/messaging",   bg:"#ede9fe", ic:"#7c3aed"  },
  { icon:"📄", label:"Reports",      sub:"Download & share",  to:"/report",      bg:"#f0fdf4", ic:GREEN      },
];

export default function Dashboard({ groups, members, attendanceHistory }) {
  const navigate = useNavigate();
  const { church, user } = useAuth();

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const adminName = church?.admin_name || user?.user_metadata?.full_name || "Pastor";
  const firstName = adminName.split(" ")[0];
  const today     = new Date().toLocaleDateString("en-NG", { weekday:"long", month:"long", day:"numeric" });

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalSessions = attendanceHistory?.length || 0;

  const avgRate = totalSessions > 0
    ? Math.round(attendanceHistory.reduce((acc, s) => {
        const p = s.records.filter(r => r.present).length;
        const t = s.records.length;
        return acc + (t ? p / t : 0);
      }, 0) / totalSessions * 100)
    : null;

  // Most recent session per group → pending absentees
  const recentAbsentees = (() => {
    if (!attendanceHistory?.length || !groups.length) return 0;
    let total = 0;
    for (const group of groups) {
      const latest = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (latest) total += latest.records.filter(r => !r.present).length;
    }
    return total;
  })();

  // Last Sunday's total
  const lastSunSessions = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    const last = d.toISOString().split("T")[0];
    return attendanceHistory.filter(s => s.date === last);
  })();
  const lastSunPresent = lastSunSessions.reduce((s, x) => s + x.records.filter(r => r.present).length, 0);
  const lastSunTotal   = lastSunSessions.reduce((s, x) => s + x.records.length, 0);

  // Recent 4 sessions
  const recentSessions = [...(attendanceHistory || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map(s => {
      const g = groups.find(gr => gr.id === s.groupId);
      const p = s.records.filter(r => r.present).length;
      const t = s.records.length;
      return { group: g?.name || "Group", present:p, total:t,
               rate: t ? Math.round(p/t*100) : 0, date: s.date };
    });

  const isEmpty = totalSessions === 0 && members.length === 0;

  return (
    <div className="page" style={{ background:"#f7f5f0", minHeight:"100vh" }}>

      {/* ── Hero ── */}
      <div style={{
        background:"linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding:"28px 22px 24px",
        position:"relative", overflow:"hidden",      }}>
        {/* Decorations */}
        <div style={{ position:"absolute", top:-70, right:-50, width:240, height:240,
          borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-30, left:-10, width:120, height:120,
          borderRadius:"50%", background:"rgba(201,168,76,.06)", pointerEvents:"none" }} />

        {/* Greeting row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          position:"relative", marginBottom:22 }}>
          <div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.42)", fontWeight:700,
              letterSpacing:".07em", textTransform:"uppercase", marginBottom:5 }}>
              {greeting} 🙏
            </div>
            <div style={{ fontFamily:S, fontSize:28, fontWeight:800,
              color:"#fff", lineHeight:1.1, letterSpacing:"-.02em" }}>
              {firstName}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.38)", marginTop:5, fontWeight:500 }}>
              {church?.name || "ChurchTrakr"} · {today}
            </div>
          </div>
          <button onClick={() => navigate("/settings")} style={{
            width:40, height:40, borderRadius:11, flexShrink:0,
            background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.14)",
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:17, transition:"background .15s",
          }}>⚙️</button>
        </div>

        {/* Stat pills */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9, position:"relative" }}>
          {[
            { v: members.length,                        l:"Members",   c:"#86efac", e:"👥" },
            { v: lastSunTotal ? `${lastSunPresent}/${lastSunTotal}` : `${groups.length} grp${groups.length!==1?"s":""}`,
              l: lastSunTotal ? "Last Sunday" : "Groups",
              c:"#93c5fd", e: lastSunTotal ? "📅" : "🏘️" },
            { v: avgRate != null ? `${avgRate}%` : "—", l:"Avg. Rate",  c:"#fde68a", e:"📈" },
          ].map(s => (
            <div key={s.l} style={{
              background:"rgba(255,255,255,.09)", border:"1px solid rgba(255,255,255,.07)",
              borderRadius:14, padding:"13px 8px", textAlign:"center",
            }}>
              <div style={{ fontSize:15, marginBottom:4, lineHeight:1 }}>{s.e}</div>
              <div style={{ fontFamily:S, fontWeight:900, fontSize:22,
                color:s.c, lineHeight:1, letterSpacing:"-.02em" }}>{s.v}</div>
              <div style={{ fontSize:9.5, color:"rgba(255,255,255,.42)", marginTop:4,
                fontWeight:700, textTransform:"uppercase", letterSpacing:".04em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px 16px 32px" }}>

        {/* ── Absentee alert ── */}
        {recentAbsentees > 0 && (
          <div onClick={() => navigate("/absentees")} style={{
            background:"linear-gradient(135deg, #fff1f2, #fff5f5)",
            border:"1.5px solid #fda4af", borderRadius:16,
            padding:"13px 16px", marginBottom:14, cursor:"pointer",
            display:"flex", alignItems:"center", gap:12,
            animation:"fadeUp .25s ease",
          }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"#ffe4e6",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:19, flexShrink:0 }}>📋</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13.5, color:"#be123c" }}>
                {recentAbsentees} member{recentAbsentees!==1?"s":""} need follow-up
              </div>
              <div style={{ fontSize:12, color:"#e11d48", marginTop:2, opacity:.7 }}>
                Tap to see who missed service
              </div>
            </div>
            <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
              <path d="M1 1l4 5-4 5" stroke="#e11d48" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* ── Primary CTA ── */}
        <div onClick={() => navigate("/attendance")} style={{
          background:"linear-gradient(135deg, #059669, #047857)",
          borderRadius:18, padding:"18px 20px", marginBottom:18, cursor:"pointer",
          display:"flex", alignItems:"center", gap:14,
          boxShadow:"0 6px 28px rgba(5,150,105,.28)",
          transition:"transform .15s, box-shadow .15s",
          animation:"fadeUp .25s ease .05s both",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 10px 36px rgba(5,150,105,.35)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 6px 28px rgba(5,150,105,.28)"; }}>
          <div style={{ width:50, height:50, borderRadius:14,
            background:"rgba(255,255,255,.18)", display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>✅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-.01em" }}>
              Mark Attendance
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.65)", marginTop:3 }}>
              Record who attended service today
            </div>
          </div>
          <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
            <path d="M1 1l4 5-4 5" stroke="rgba(255,255,255,.65)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* ── Quick actions grid ── */}
        <div style={{ marginBottom:6 }}>
          <div style={{ fontSize:10.5, color:"#9ca3af", fontWeight:700,
            textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>
            Quick Actions
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9,
            animation:"fadeUp .25s ease .1s both" }}>
            {ACTIONS.map(a => (
              <div key={a.label} onClick={() => navigate(a.to)} style={{
                background:"#fff", border:"1px solid #e8e6e1",
                borderRadius:16, padding:"14px 8px", cursor:"pointer", textAlign:"center",
                transition:"all .15s cubic-bezier(.4,0,.2,1)",
                boxShadow:"0 1px 4px rgba(0,0,0,.04)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.04)"; }}>
                <div style={{ width:42, height:42, borderRadius:12, background:a.bg,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:19, margin:"0 auto 9px" }}>{a.icon}</div>
                <div style={{ fontFamily:F, fontWeight:700, fontSize:12, lineHeight:1.25,
                  color:"#1c1917", marginBottom:3 }}>{a.label}</div>
                <div style={{ fontFamily:F, fontSize:10.5, color:"#9ca3af" }}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent sessions ── */}
        {recentSessions.length > 0 && (
          <div style={{ animation:"fadeUp .25s ease .15s both" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, marginTop:20 }}>
              <div style={{ fontSize:10.5, color:"#9ca3af", fontWeight:700,
                textTransform:"uppercase", letterSpacing:".08em" }}>Recent Attendance</div>
              <button onClick={() => navigate("/analytics")} style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:12, fontWeight:700, color:"#2d5a42",
                padding:"3px 0", fontFamily:F }}>View analytics →</button>
            </div>
            <div style={{ background:"#fff", borderRadius:18, overflow:"hidden",
              border:"1px solid #e8e6e1", boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
              {recentSessions.map((s, i) => (
                <div key={i} onClick={() => navigate("/attendance")} style={{
                  display:"flex", alignItems:"center", gap:13,
                  padding:"13px 16px", cursor:"pointer",
                  borderBottom: i < recentSessions.length - 1 ? "1px solid #f0eeea" : "none",
                  transition:"background .12s",
                }}
                onMouseEnter={e => e.currentTarget.style.background="#f9f8f5"}
                onMouseLeave={e => e.currentTarget.style.background=""}>
                  {/* Rate circle */}
                  <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
                    background:rateBg(s.rate),
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:S, fontWeight:900, fontSize:13,
                    color:rateColor(s.rate) }}>{s.rate}%</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:F, fontWeight:700, fontSize:14,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                      color:"#1c1917" }}>{s.group}</div>
                    <div style={{ fontFamily:F, fontSize:11.5, color:"#9ca3af", marginTop:2 }}>
                      {fmtDate(s.date)} · {s.present} of {s.total} present
                    </div>
                  </div>
                  <svg width="5" height="10" viewBox="0 0 6 12" fill="none" style={{ opacity:.25, flexShrink:0 }}>
                    <path d="M1 1l4 5-4 5" stroke="#1c1917" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty / onboarding state ── */}
        {isEmpty && (
          <div style={{ background:"#fff", border:"1px solid #e8e6e1",
            borderRadius:20, padding:"40px 24px", textAlign:"center",
            marginTop:8, animation:"fadeUp .3s ease .2s both" }}>
            <div style={{ fontSize:52, marginBottom:14, lineHeight:1 }}>⛪</div>
            <div style={{ fontFamily:S, fontWeight:700, fontSize:20,
              marginBottom:10, color:FOREST }}>Welcome to ChurchTrakr!</div>
            <div style={{ fontFamily:F, fontSize:13.5, color:"#9ca3af",
              lineHeight:1.75, maxWidth:260, margin:"0 auto 22px" }}>
              Start by creating a group and adding your members. It takes about 2 minutes.
            </div>
            <button style={{
              background:FOREST, color:"#fff", border:"none",
              borderRadius:12, padding:"13px 28px",
              fontFamily:F, fontWeight:700, fontSize:14, cursor:"pointer",
              boxShadow:"0 4px 16px rgba(26,58,42,.25)",
            }} onClick={() => navigate("/groups")}>
              Create Your First Group →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}