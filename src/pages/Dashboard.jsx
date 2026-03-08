// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SetIco } from "../components/ui/Icons";

export default function Dashboard({ groups, members, attendanceHistory }) {
  const navigate = useNavigate();
  const { church, user } = useAuth();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const adminName = church?.admin_name
    || user?.user_metadata?.full_name
    || "Pastor";

  const totalSessions = attendanceHistory?.length || 0;
  const avgRate = totalSessions > 0
    ? Math.round(attendanceHistory.reduce((acc, s) => {
        const p = s.records.filter(r => r.present === true).length;
        const t = s.records.length;
        return acc + (t ? p / t : 0);
      }, 0) / totalSessions * 100)
    : 0;

  const stats = [
    { label: "Groups",     value: groups.length,                             icon: "👥", bg: "#d4f1e4", nav: "/groups"     },
    { label: "Members",    value: members.length,                            icon: "👤", bg: "#fde8cc", nav: "/members"    },
    { label: "Attendance", value: totalSessions > 0 ? avgRate + "%" : "—",   icon: "✅", bg: "#e8d4f5", nav: "/attendance" },
    { label: "Sessions",   value: totalSessions,                             icon: "📊", bg: "#cce8ff", nav: "/attendance" },
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
      <div className="ph" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1>{greeting()}, {adminName} 🙏</h1>
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
            <div className="sico" style={{ background: s.bg }}><span style={{ fontSize: 18 }}>{s.icon}</span></div>
            <div className="sval">{s.value}</div>
            <div className="slbl">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="pc">
        {/* ── Quick Actions — prominent on mobile ── */}
        <div className="stitle" style={{ marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          <button
            className="btn bp"
            style={{ width: "100%", padding: "15px 18px", fontSize: 15, borderRadius: 14, justifyContent: "flex-start", gap: 12 }}
            onClick={() => navigate("/attendance")}
          >
            <span style={{ fontSize: 20 }}>✅</span>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Take Attendance</div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 400, marginTop: 1 }}>Mark members present or absent</div>
            </div>
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { icon: "💬", label: "Send SMS", sub: "Message members", nav: "/messaging/send" },
              { icon: "⭐", label: "First Timers", sub: "Record visitors", nav: "/firsttimers" },
              { icon: "📊", label: "Analytics", sub: "View trends", nav: "/analytics" },
              { icon: "📋", label: "Absentees", sub: "Follow up", nav: "/absentees" },
            ].map(a => (
              <button key={a.label}
                className="btn"
                style={{ padding: "13px 12px", fontSize: 13, borderRadius: 12, justifyContent: "flex-start", gap: 10, background: "var(--surface)", color: "var(--brand)", border: "1.5px solid var(--border)", flexDirection: "column", alignItems: "flex-start", height: "auto" }}
                onClick={() => navigate(a.nav)}
              >
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>{a.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Groups section ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div className="stitle" style={{ margin: 0 }}>Your Groups</div>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12, fontWeight: 700 }}
            onClick={() => navigate("/groups")}>
            See All →
          </button>
        </div>
        {groups.length === 0 ? (
          <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "16px 14px", marginBottom: 20, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>👥</div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>No groups yet</div>
            <button className="btn bp" style={{ fontSize: 12, padding: "8px 16px" }} onClick={() => navigate("/groups")}>
              + Create First Group
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {groups.slice(0, 4).map(g => {
              const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
              const sessions = attendanceHistory.filter(s => s.groupId === g.id);
              const lastSession = sessions.sort((a, b) => b.date.localeCompare(a.date))[0];
              const rate = lastSession
                ? Math.round(lastSession.records.filter(r => r.present).length / (lastSession.records.length || 1) * 100)
                : null;
              const av = g.name.charAt(0).toUpperCase();
              const colors = ["#d4f1e4","#fde8cc","#e8d4f5","#cce8ff","#fce8e8","#d4e8ff"];
              const bg = colors[g.name.charCodeAt(0) % colors.length];
              return (
                <div key={g.id} onClick={() => navigate("/groups")}
                  style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "12px 10px", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{av}</div>
                    <div style={{ fontWeight: 700, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{cnt} member{cnt !== 1 ? "s" : ""}</div>
                  {rate !== null && (
                    <div style={{ fontSize: 10, marginTop: 3, color: rate >= 70 ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
                      {rate}% last
                    </div>
                  )}
                </div>
              );
            })}
            {groups.length > 4 && (
              <div onClick={() => navigate("/groups")}
                style={{ background: "var(--surface2)", border: "1.5px dashed var(--border)", borderRadius: 12, padding: "12px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>👥</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--brand)" }}>+{groups.length - 4} more</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Recent Activity ── */}
        <div className="stitle" style={{ marginBottom: 8 }}>Recent Activity</div>
        {recentActivity.map((a, i) => (
          <div key={i} className="csm" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}