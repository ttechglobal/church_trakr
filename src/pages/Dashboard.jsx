// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const TILES = [
  { icon: "👥", label: "Groups",       sub: "Cell groups",        nav: "/groups",      bg: "#f3eeff" },
  { icon: "👤", label: "Members",      sub: "Member profiles",    nav: "/members",     bg: "#dbeafe" },
  { icon: "📋", label: "Absentees",    sub: "Follow up",          nav: "/absentees",   bg: "#fee2e2" },
  { icon: "⭐", label: "First Timers", sub: "Track visitors",     nav: "/firsttimers", bg: "#fef3c7" },
  { icon: "💬", label: "Messaging",    sub: "Send SMS",           nav: "/messaging",   bg: "#f3eeff" },
  { icon: "📊", label: "Analytics",    sub: "Reports",            nav: "/analytics",   bg: "#dbeafe" },
];

export default function Dashboard({ groups, members, attendanceHistory }) {
  const navigate  = useNavigate();
  const { church, user } = useAuth();

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const adminName = church?.admin_name || user?.user_metadata?.full_name || "Pastor";
  const firstName = adminName.split(" ")[0];

  const totalSessions = attendanceHistory?.length || 0;
  const avgRate = totalSessions > 0
    ? Math.round(attendanceHistory.reduce((acc, s) => {
        const p = s.records.filter(r => r.present === true).length;
        const t = s.records.length;
        return acc + (t ? p / t : 0);
      }, 0) / totalSessions * 100)
    : null;

  const recentSessions = [...(attendanceHistory || [])]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
    .map(s => {
      const g       = groups.find(gr => gr.id === s.groupId);
      const present = s.records.filter(r => r.present === true).length;
      const total   = s.records.length;
      return { group: g?.name || "Group", present, total,
        rate: total ? Math.round(present / total * 100) : 0, date: s.date };
    });

  const recentAbsentees = attendanceHistory?.length > 0
    ? [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, Math.max(groups.length, 1))
        .reduce((sum, s) => sum + s.records.filter(r => !r.present).length, 0)
    : 0;

  return (
    <div className="page">

      {/* ── Hero header ── */}
      <div style={{
        background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding: "max(env(safe-area-inset-top,32px),32px) 20px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-30, width:200, height:200,
          borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-30, left:20, width:100, height:100,
          borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          position:"relative", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.55)", fontWeight:600,
              letterSpacing:".04em", marginBottom:5 }}>{greeting} 🙏</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700,
              color:"#fff", lineHeight:1.15 }}>{firstName}</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4 }}>
              {church?.name || "ChurchTrackr"}
            </div>
          </div>
          <button onClick={() => navigate("/settings")} style={{
            background:"rgba(255,255,255,.12)", border:"1px solid rgba(255,255,255,.18)",
            borderRadius:14, padding:"10px 12px", cursor:"pointer", fontSize:20,
            lineHeight:1, color:"#fff", fontFamily:"'DM Sans',sans-serif", flexShrink:0,
          }}>⚙️</button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, position:"relative" }}>
          {[
            { v: members.length,                         l: "Members",    c: "#86efac" },
            { v: groups.length,                          l: "Groups",     c: "#93c5fd" },
            { v: avgRate != null ? `${avgRate}%` : "—", l: "Attendance", c: "#fde68a" },
          ].map(s => (
            <div key={s.l} style={{ background:"rgba(255,255,255,.1)", borderRadius:14,
              padding:"13px 10px", textAlign:"center",
              border:"1px solid rgba(255,255,255,.08)" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:800,
                fontSize:26, color:s.c, lineHeight:1 }}>{s.v}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.55)",
                marginTop:5, fontWeight:600 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pc" style={{ paddingTop:18 }}>

        {/* ── Absentee alert ── */}
        {recentAbsentees > 0 && (
          <div onClick={() => navigate("/absentees")} style={{
            background:"#fff1f2", border:"1.5px solid #fda4af", borderRadius:16,
            padding:"13px 16px", marginBottom:16, cursor:"pointer",
            display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"#ffe4e6",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, flexShrink:0 }}>📋</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#be123c" }}>
                {recentAbsentees} absentee{recentAbsentees !== 1 ? "s" : ""} need follow-up
              </div>
              <div style={{ fontSize:12, color:"#e11d48", marginTop:2, opacity:.8 }}>
                Tap to see who missed last service
              </div>
            </div>
            <span style={{ color:"#e11d48", fontSize:22, fontWeight:200 }}>›</span>
          </div>
        )}

        {/* ── Attendance CTA ── */}
        <div onClick={() => navigate("/attendance")} style={{
          background:"linear-gradient(135deg, #059669, #047857)", borderRadius:18,
          padding:"18px 20px", marginBottom:22, cursor:"pointer",
          display:"flex", alignItems:"center", gap:14,
          boxShadow:"0 6px 24px rgba(5,150,105,.28)",
        }}>
          <div style={{ width:52, height:52, borderRadius:16,
            background:"rgba(255,255,255,.18)", display:"flex",
            alignItems:"center", justifyContent:"center",
            fontSize:26, flexShrink:0 }}>✅</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:17, color:"#fff" }}>Take Attendance</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.72)", marginTop:3 }}>
              Mark members present or absent
            </div>
          </div>
          <span style={{ color:"rgba(255,255,255,.6)", fontSize:24, fontWeight:200 }}>›</span>
        </div>

        {/* ── Quick access grid ── */}
        <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)",
          textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>
          Quick Access
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
          {TILES.map(t => (
            <div key={t.label} onClick={() => navigate(t.nav)} style={{
              background:"var(--surface)", border:"1.5px solid var(--border)",
              borderRadius:16, padding:"14px 10px", cursor:"pointer", textAlign:"center",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--sh-lg)"; e.currentTarget.style.transform="translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow=""; e.currentTarget.style.transform=""; }}
            >
              <div style={{ width:42, height:42, borderRadius:12, background:t.bg,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:20, margin:"0 auto 9px" }}>{t.icon}</div>
              <div style={{ fontWeight:700, fontSize:12, lineHeight:1.3 }}>{t.label}</div>
              <div style={{ fontSize:10, color:"var(--muted)", marginTop:3 }}>{t.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Recent attendance ── */}
        {recentSessions.length > 0 && (
          <>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)",
              textTransform:"uppercase", letterSpacing:".08em", marginBottom:12 }}>
              Recent Attendance
            </div>
            {recentSessions.map((s, i) => {
              const rc = s.rate >= 70 ? "#059669" : s.rate >= 50 ? "#d97706" : "#dc2626";
              const rb = s.rate >= 70 ? "#d1fae5" : s.rate >= 50 ? "#fef3c7" : "#fee2e2";
              return (
                <div key={i} onClick={() => navigate("/attendance")} style={{
                  display:"flex", alignItems:"center", gap:12,
                  background:"var(--surface)", border:"1.5px solid var(--border)",
                  borderRadius:14, padding:"13px 14px", marginBottom:8, cursor:"pointer",
                }}>
                  <div style={{ width:46, height:46, borderRadius:13, background:rb,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:800, fontSize:14, color:rc, flexShrink:0 }}>{s.rate}%</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14, overflow:"hidden",
                      textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.group}</div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>
                      {s.date} · {s.present}/{s.total} present
                    </div>
                  </div>
                  <span style={{ color:"var(--muted)", fontSize:20, fontWeight:200 }}>›</span>
                </div>
              );
            })}
          </>
        )}

        {/* ── Empty / onboarding ── */}
        {totalSessions === 0 && members.length === 0 && (
          <div style={{ background:"var(--surface)", border:"1.5px solid var(--border)",
            borderRadius:20, padding:"32px 20px", textAlign:"center", marginTop:8 }}>
            <div style={{ fontSize:52, marginBottom:14 }}>⛪</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700,
              fontSize:19, marginBottom:8 }}>Welcome to ChurchTrackr!</div>
            <div style={{ fontSize:13, color:"var(--muted)", lineHeight:1.7,
              marginBottom:20, maxWidth:260, margin:"0 auto 20px" }}>
              Start by creating a group and adding your members.
            </div>
            <button className="btn bp" style={{ borderRadius:12 }}
              onClick={() => navigate("/groups")}>Create First Group →</button>
          </div>
        )}
      </div>
    </div>
  );
}