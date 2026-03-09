// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const NAV_TILES = [
  { icon: "👥", label: "Groups",      sub: "Manage your cell groups",      nav: "/groups",      accent: "#7c3aed", bg: "#f3eeff" },
  { icon: "👤", label: "Members",     sub: "View & edit member profiles",  nav: "/members",     accent: "#0284c7", bg: "#e0f2fe" },
  { icon: "✅", label: "Attendance",  sub: "Mark who came to service",     nav: "/attendance",  accent: "#059669", bg: "#d1fae5" },
  { icon: "📋", label: "Absentees",   sub: "Follow up on missing members", nav: "/absentees",   accent: "#dc2626", bg: "#fee2e2" },
  { icon: "⭐", label: "First Timers",sub: "Track & convert visitors",     nav: "/firsttimers", accent: "#d97706", bg: "#fef3c7" },
  { icon: "💬", label: "Messaging",   sub: "Send SMS to your members",     nav: "/messaging",   accent: "#7c3aed", bg: "#f3eeff" },
  { icon: "📊", label: "Analytics",   sub: "Trends & attendance reports",  nav: "/analytics",   accent: "#0284c7", bg: "#e0f2fe" },
  { icon: "⚙️", label: "Settings",   sub: "Church profile & preferences", nav: "/settings",    accent: "#475569", bg: "#f1f5f9" },
];

export default function Dashboard({ groups, members, attendanceHistory }) {
  const navigate = useNavigate();
  const { church, user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const adminName = church?.admin_name || user?.user_metadata?.full_name || "Pastor";

  // Stats
  const totalSessions = attendanceHistory?.length || 0;
  const avgRate = totalSessions > 0
    ? Math.round(attendanceHistory.reduce((acc, s) => {
        const p = s.records.filter(r => r.present === true).length;
        const t = s.records.length;
        return acc + (t ? p / t : 0);
      }, 0) / totalSessions * 100)
    : null;

  // Most recent attendance
  const recentSessions = [...(attendanceHistory || [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)
    .map(s => {
      const g = groups.find(gr => gr.id === s.groupId);
      const present = s.records.filter(r => r.present === true).length;
      const total = s.records.length;
      const rate = total ? Math.round(present / total * 100) : 0;
      return { group: g?.name || "Group", present, total, rate, date: s.date };
    });

  // Absentees count from most recent sessions
  const recentAbsentees = (attendanceHistory || []).length > 0
    ? [...attendanceHistory].sort((a,b) => b.date.localeCompare(a.date))
        .slice(0, groups.length || 1)
        .reduce((sum, s) => sum + s.records.filter(r => !r.present).length, 0)
    : 0;

  return (
    <div className="page">
      {/* ── Header ── */}
      <div className="ph">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500, marginBottom: 2 }}>{greeting} 🙏</div>
            <h1 style={{ fontSize: 22, lineHeight: 1.2, wordBreak: "break-word" }}>{adminName}</h1>
            <p style={{ marginTop: 3 }}>{church?.name || "ChurchTrackr"}</p>
          </div>
          <button onClick={() => navigate("/settings")}
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px", cursor: "pointer", fontSize: 20, flexShrink: 0, lineHeight: 1 }}>
            ⚙️
          </button>
        </div>
      </div>

      <div className="pc">
        {/* ── Key stats strip ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "Members",    value: members.length,                  color: "var(--brand)",   bg: "#f3eeff" },
            { label: "Groups",     value: groups.length,                   color: "#0284c7",         bg: "#e0f2fe" },
            { label: "Attendance", value: avgRate != null ? `${avgRate}%` : "—", color: "var(--success)", bg: "#d1fae5" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 16, padding: "14px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 26, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 4, opacity: .8 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Absentees alert if any ── */}
        {recentAbsentees > 0 && (
          <div onClick={() => navigate("/absentees")}
            style={{ background: "#fff0f0", border: "1.5px solid #fca5a5", borderRadius: 16, padding: "14px 16px", marginBottom: 20, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--danger)" }}>{recentAbsentees} absentee{recentAbsentees !== 1 ? "s" : ""} need follow-up</div>
              <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>Tap to see who missed last service</div>
            </div>
            <div style={{ color: "var(--danger)", fontSize: 18 }}>›</div>
          </div>
        )}

        {/* ── Primary action ── */}
        <div onClick={() => navigate("/attendance")}
          style={{ background: "linear-gradient(135deg, var(--brand), #7c3aed)", borderRadius: 18, padding: "18px 20px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>✅</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>Take Attendance</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 3 }}>Mark members present or absent</div>
          </div>
          <div style={{ marginLeft: "auto", color: "rgba(255,255,255,.7)", fontSize: 22 }}>›</div>
        </div>

        {/* ── All pages grid ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
          All Features
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          {NAV_TILES.map(t => (
            <div key={t.label} onClick={() => navigate(t.nav)}
              style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "14px 12px", cursor: "pointer", transition: "border-color .12s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = t.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{ width: 40, height: 40, borderRadius: 12, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 8 }}>{t.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3, lineHeight: 1.4 }}>{t.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Recent sessions ── */}
        {recentSessions.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
              Recent Attendance
            </div>
            {recentSessions.map((s, i) => (
              <div key={i} onClick={() => navigate("/attendance")}
                style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: s.rate >= 70 ? "#d1fae5" : s.rate >= 50 ? "#fef3c7" : "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: s.rate >= 70 ? "var(--success)" : s.rate >= 50 ? "var(--accent)" : "var(--danger)", flexShrink: 0 }}>
                  {s.rate}%
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.group}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{s.date} · {s.present}/{s.total} present</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {totalSessions === 0 && members.length === 0 && (
          <div style={{ background: "var(--surface2)", borderRadius: 16, padding: "24px 16px", textAlign: "center", marginTop: 8 }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>⛪</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Welcome to ChurchTrackr!</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
              Start by creating a group, then add your members.
            </div>
            <button className="btn bp" onClick={() => navigate("/groups")}>Get Started →</button>
          </div>
        )}
      </div>
    </div>
  );
}