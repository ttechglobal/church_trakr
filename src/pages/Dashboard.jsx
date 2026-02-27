// src/pages/Dashboard.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Dashboard({ groups, members }) {
  const navigate = useNavigate();
  const { church } = useAuth();

  const stats = [
    { label: "Groups",     value: groups.length,  icon: "👥", bg: "#d4f1e4", nav: "/groups"     },
    { label: "Members",    value: members.length,  icon: "👤", bg: "#fde8cc", nav: "/members"    },
    { label: "Attendance", value: "74%",            icon: "✅", bg: "#e8d4f5", nav: "/attendance" },
    { label: "Analytics",  value: "—",              icon: "📊", bg: "#cce8ff", nav: null          },
  ];

  return (
    <div className="page">
      <div className="ph">
        <h1>Good morning, Pastor 🙏</h1>
        <p>{church?.name ?? "ChurchTrack"} · Sunday Overview</p>
      </div>
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
        <div className="stitle">Recent Activity</div>
        {[
          { text: "Youth Ministry attendance recorded", time: "Today, 10:30am", icon: "✅" },
          { text: `${members.length} members registered`,                time: "Active",        icon: "👤" },
          { text: "SMS sent to 12 absentees",                            time: "Feb 9",         icon: "💬" },
        ].map((a, i) => (
          <div key={i} className="csm" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>{a.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.text}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{a.time}</div>
            </div>
          </div>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
          <button className="btn bp" onClick={() => navigate("/attendance")}>✅ Take Attendance</button>
          <button className="btn bg" onClick={() => navigate("/messaging")}>💬 Send SMS</button>
        </div>
      </div>
    </div>
  );
}
