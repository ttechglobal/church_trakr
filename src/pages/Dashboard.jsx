// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const TILES = [
  { icon: "👥", label: "Groups",       sub: "Cell groups",     nav: "/groups",      bg: "#eef0fe", ic: "#4f46e5" },
  { icon: "👤", label: "Members",      sub: "All profiles",    nav: "/members",     bg: "#dbeafe", ic: "#1d4ed8" },
  { icon: "📋", label: "Absentees",    sub: "Follow up",       nav: "/absentees",   bg: "#fee2e2", ic: "#dc2626" },
  { icon: "⭐", label: "First Timers", sub: "New visitors",    nav: "/firsttimers", bg: "#fef3c7", ic: "#d97706" },
  { icon: "💬", label: "Messaging",    sub: "Send SMS",        nav: "/messaging",   bg: "#d1fae5", ic: "#065f46" },
  { icon: "📊", label: "Analytics",    sub: "Reports",         nav: "/analytics",   bg: "#ede9fe", ic: "#6d28d9" },
];

export default function Dashboard({ groups, members, attendanceHistory }) {
  const navigate  = useNavigate();
  const { church, user } = useAuth();

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const adminName = church?.admin_name || user?.user_metadata?.full_name || "Pastor";
  const firstName = adminName.split(" ")[0];

  // Attendance stats
  const totalSessions = attendanceHistory?.length || 0;
  const avgRate = totalSessions > 0
    ? Math.round(
        attendanceHistory.reduce((acc, s) => {
          const p = s.records.filter(r => r.present === true).length;
          const t = s.records.length;
          return acc + (t ? p / t : 0);
        }, 0) / totalSessions * 100
      )
    : null;

  const recentSessions = [...(attendanceHistory || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
    .map(s => {
      const g       = groups.find(gr => gr.id === s.groupId);
      const present = s.records.filter(r => r.present === true).length;
      const total   = s.records.length;
      return {
        group: g?.name || "Group",
        present, total,
        rate: total ? Math.round(present / total * 100) : 0,
        date: s.date,
      };
    });

  const recentAbsentees = attendanceHistory?.length > 0
    ? [...attendanceHistory]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, Math.max(groups.length, 1))
        .reduce((sum, s) => sum + s.records.filter(r => !r.present).length, 0)
    : 0;

  // Today's date
  const today = new Date().toLocaleDateString("en-NG", { weekday: "long", month: "long", day: "numeric" });

  const rateColor = r => r >= 70 ? "#059669" : r >= 50 ? "#d97706" : "#dc2626";
  const rateBg    = r => r >= 70 ? "#d1fae5" : r >= 50 ? "#fef3c7" : "#fee2e2";

  return (
    <div className="page">

      {/* ── Hero header ── */}
      <div style={{
        background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding: "max(env(safe-area-inset-top, 32px), 32px) 22px 28px",
        position: "relative", overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: -60, right: -40, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(255,255,255,.035)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 130, height: 130,
          borderRadius: "50%", background: "rgba(255,255,255,.025)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "40%", right: "15%", width: 80, height: 80,
          borderRadius: "50%", background: "rgba(201,168,76,.07)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          position: "relative", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 700,
              letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 6 }}>
              {greeting} 🙏
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800,
              color: "#fff", lineHeight: 1.1, letterSpacing: "-.02em" }}>
              {firstName}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.42)", marginTop: 5, fontWeight: 500 }}>
              {church?.name || "ChurchTrakr"} · {today}
            </div>
          </div>
          <button onClick={() => navigate("/settings")} style={{
            width: 42, height: 42,
            background: "rgba(255,255,255,.1)",
            border: "1px solid rgba(255,255,255,.16)",
            borderRadius: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0, transition: "background .15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.16)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
          >⚙️</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, position: "relative" }}>
          {[
            { v: members.length,                           l: "Members",    c: "#86efac", icon: "👥" },
            { v: groups.length,                            l: "Groups",     c: "#93c5fd", icon: "🏘️" },
            { v: avgRate != null ? `${avgRate}%` : "—",   l: "Avg. Rate",  c: "#fde68a", icon: "📈" },
          ].map(s => (
            <div key={s.l} style={{
              background: "rgba(255,255,255,.09)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: 14, padding: "14px 10px", textAlign: "center",
              transition: "background .15s", cursor: "default",
            }}>
              <div style={{ fontSize: 17, marginBottom: 5, lineHeight: 1 }}>{s.icon}</div>
              <div style={{
                fontFamily: "'Playfair Display', serif", fontWeight: 900,
                fontSize: 26, color: s.c, lineHeight: 1, letterSpacing: "-.02em",
              }}>{s.v}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.45)",
                marginTop: 5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pc" style={{ paddingTop: 20 }}>

        {/* ── Absentee alert ── */}
        {recentAbsentees > 0 && (
          <div onClick={() => navigate("/absentees")} className="fade-up" style={{
            background: "linear-gradient(135deg, #fff1f2, #fff5f5)",
            border: "1.5px solid #fda4af",
            borderRadius: 16, padding: "14px 16px", marginBottom: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ffe4e6",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0 }}>📋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#be123c" }}>
                {recentAbsentees} absentee{recentAbsentees !== 1 ? "s" : ""} need follow-up
              </div>
              <div style={{ fontSize: 12, color: "#e11d48", marginTop: 2, opacity: .75 }}>
                Tap to see who missed service
              </div>
            </div>
            <svg width="7" height="14" viewBox="0 0 7 14" fill="none">
              <path d="M1 1l5 6-5 6" stroke="#e11d48" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* ── Take Attendance CTA ── */}
        <div onClick={() => navigate("/attendance")} className="fade-up fade-up-d1" style={{
          background: "linear-gradient(135deg, #059669, #047857)",
          borderRadius: 18, padding: "18px 20px", marginBottom: 24, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 6px 28px rgba(5,150,105,.3)",
          transition: "transform .15s, box-shadow .15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(5,150,105,.35)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 6px 28px rgba(5,150,105,.3)"; }}
        >
          <div style={{ width: 52, height: 52, borderRadius: 15,
            background: "rgba(255,255,255,.18)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>✅</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: "#fff", letterSpacing: "-.01em" }}>Take Attendance</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.68)", marginTop: 3 }}>
              Mark members present or absent
            </div>
          </div>
          <svg width="7" height="14" viewBox="0 0 7 14" fill="none">
            <path d="M1 1l5 6-5 6" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* ── Quick access ── */}
        <div className="sec-hd fade-up fade-up-d2">
          <div className="sec-label">Quick Access</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 26 }} className="fade-up fade-up-d2">
          {TILES.map(t => (
            <div key={t.label} onClick={() => navigate(t.nav)} style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16, padding: "15px 10px", cursor: "pointer", textAlign: "center",
              transition: "var(--transition)",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--border-dark)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: t.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, margin: "0 auto 10px" }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12.5, lineHeight: 1.3, color: "var(--text)" }}>{t.label}</div>
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>{t.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Recent Attendance ── */}
        {recentSessions.length > 0 && (
          <div className="fade-up fade-up-d3">
            <div className="sec-hd">
              <div className="sec-label">Recent Attendance</div>
              <button onClick={() => navigate("/attendance")} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 700, color: "var(--brand-light)",
                padding: "4px 0", fontFamily: "'DM Sans', sans-serif",
              }}>View all →</button>
            </div>
            {recentSessions.map((s, i) => (
              <div key={i} onClick={() => navigate("/attendance")} style={{
                display: "flex", alignItems: "center", gap: 13,
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "12px 14px", marginBottom: 9, cursor: "pointer",
                transition: "var(--transition)",
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ""; e.currentTarget.style.transform = ""; }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 13, flexShrink: 0,
                  background: rateBg(s.rate),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontFamily: "'Playfair Display', serif",
                  fontSize: 14, color: rateColor(s.rate),
                }}>{s.rate}%</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.group}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {s.date} · {s.present}/{s.total} present
                  </div>
                </div>
                <svg width="6" height="12" viewBox="0 0 6 12" fill="none">
                  <path d="M1 1l4 5-4 5" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))}
          </div>
        )}

        {/* ── Onboarding empty state ── */}
        {totalSessions === 0 && members.length === 0 && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 20, padding: "36px 24px", textAlign: "center", marginTop: 10,
          }}>
            <div style={{ fontSize: 56, marginBottom: 16, lineHeight: 1 }}>⛪</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700,
              fontSize: 20, marginBottom: 10, color: "var(--brand)" }}>
              Welcome to ChurchTrakr!
            </div>
            <div style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.75,
              maxWidth: 270, margin: "0 auto 22px" }}>
              Start by creating a group and adding your members. It only takes a few minutes.
            </div>
            <button className="btn bp" style={{ borderRadius: 12, minWidth: 180 }}
              onClick={() => navigate("/groups")}>
              Create Your First Group →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}