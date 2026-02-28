// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SetIco } from "../components/ui/Icons";

export default function Dashboard({ groups, members, attendanceHistory }) {
  const navigate = useNavigate();
  const { church } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Real attendance stat from history
  const totalSessions = attendanceHistory?.length || 0;
  const avgRate = totalSessions > 0
    ? Math.round(attendanceHistory.reduce((acc, s) => {
        const p = s.records.filter(r => r.present === true).length;
        const t = s.records.length;
        return acc + (t ? p / t : 0);
      }, 0) / totalSessions * 100)
    : 0;

  const stats = [
    { label: "Groups",     value: groups.length,               icon: "👥", bg: "#d4f1e4", nav: "/groups"     },
    { label: "Members",    value: members.length,              icon: "👤", bg: "#fde8cc", nav: "/members"    },
    { label: "Attendance", value: totalSessions > 0 ? avgRate + "%" : "—", icon: "✅", bg: "#e8d4f5", nav: "/attendance" },
    { label: "Sessions",   value: totalSessions,               icon: "📊", bg: "#cce8ff", nav: "/attendance" },
  ];

  const recentActivity = attendanceHistory
    ? [...attendanceHistory]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
        .map(s => {
          const g = groups.find(gr => gr.id === s.groupId);
          const present = s.records.filter(r => r.present === true).length;
          const total = s.records.length;
          return { text: `${g?.name || "Group"} — ${present}/${total} present`, time: s.date, icon: "✅" };
        })
    : [];

  if (recentActivity.length === 0) {
    recentActivity.push(
      { text: `${members.length} members registered`, time: "Active", icon: "👤" },
      { text: "Welcome to ChurchTrackr!", time: "Get started below", icon: "⛪" },
    );
  }

  return (
    <div className="page">
      {/* ── Page header with settings shortcut ── */}
      <div className="ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>{greeting()}, Pastor 🙏</h1>
          <p>{church?.name ?? "ChurchTrackr"} · Overview</p>
        </div>
        <button
          className="bico"
          style={{ marginTop: 4, flexShrink: 0 }}
          onClick={() => navigate("/settings")}
          aria-label="Settings"
        >
          <SetIco />
        </button>
      </div>

      {/* ── Stats grid ── */}
      <div className="sgrid">
        {stats.map(s => (
          <div key={s.label} className="sc" onClick={() => s.nav && navigate(s.nav)}>
            <div className="sico" style={{ background: s.bg }}><span style={{ fontSize: 22 }}>{s.icon}</span></div>
            <div className="sval">{s.value}</div>
            <div className="slbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="pc">
        {/* ── Primary Actions — BIG, MOBILE-FIRST, above recent activity ── */}
        <div className="stitle" style={{ marginBottom: 12 }}>Quick Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          <button
            className="btn bp"
            style={{ width: "100%", padding: "18px 20px", fontSize: 16, borderRadius: 16, justifyContent: "flex-start", gap: 14 }}
            onClick={() => navigate("/attendance")}
          >
            <span style={{ fontSize: 22 }}>✅</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Take Attendance</div>
              <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 400, marginTop: 1 }}>Mark members present or absent</div>
            </div>
          </button>
          <button
            className="btn"
            style={{ width: "100%", padding: "18px 20px", fontSize: 16, borderRadius: 16, justifyContent: "flex-start", gap: 14, background: "var(--surface2)", color: "var(--brand)", border: "1.5px solid var(--border)" }}
            onClick={() => navigate("/messaging/send")}
          >
            <span style={{ fontSize: 22 }}>💬</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Send SMS</div>
              <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 400, marginTop: 1 }}>Message members or absentees</div>
            </div>
          </button>
          <button
            className="btn"
            style={{ width: "100%", padding: "18px 20px", fontSize: 16, borderRadius: 16, justifyContent: "flex-start", gap: 14, background: "var(--surface2)", color: "var(--brand)", border: "1.5px solid var(--border)" }}
            onClick={() => navigate("/firsttimers")}
          >
            <span style={{ fontSize: 22 }}>⭐</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>First Timers</div>
              <div style={{ fontSize: 12, opacity: 0.65, fontWeight: 400, marginTop: 1 }}>Record & track new visitors</div>
            </div>
          </button>
        </div>

        {/* ── Recent Activity ── */}
        <div className="stitle" style={{ marginBottom: 10 }}>Recent Activity</div>
        {recentActivity.map((a, i) => (
          <div key={i} className="csm" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
