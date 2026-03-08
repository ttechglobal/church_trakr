// src/pages/messaging/MessagingHome.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ACTIONS = [
  { label: "Send to Absentees",    sub: "Reach members who missed service",  icon: "📋", bg: "#fde8cc", to: "/messaging/send?type=absentees" },
  { label: "Send to Attendees",    sub: "Thank members who came to service", icon: "🙏", bg: "#d4f1e4", to: "/messaging/send?type=attendees" },
  { label: "Send to a Group",      sub: "Message an entire group at once",   icon: "👥", bg: "#e8d4f5", to: "/messaging/send?type=group"     },
  { label: "Send to Single Number",sub: "Message one person directly",       icon: "📱", bg: "#cce8ff", to: "/messaging/send?type=single"    },
  { label: "Send to All Members",  sub: "Broadcast to your full member list",icon: "📣", bg: "#f5e8cc", to: "/messaging/send?type=all"       },
];

export default function MessagingHome() {
  const navigate = useNavigate();
  const { church } = useAuth();
  const credits    = church?.sms_credits ?? 0;
  const maxRef     = 1000;
  const creditPct  = Math.min(100, Math.round((credits / maxRef) * 100));
  const msgs       = Math.floor(credits / 5);  // 5 credits per message

  return (
    <div className="page">
      <div className="ph">
        <h1>Messaging</h1>
        <p>Send SMS to your church members</p>
      </div>
      <div className="pc">

        {/* ── SMS Credits card ── */}
        <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg,var(--brand) 0%,var(--brand-mid) 100%)", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, opacity: .7, textTransform: "uppercase", letterSpacing: ".05em" }}>SMS Credits</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>{credits}</div>
              <div style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>≈ {msgs} message{msgs !== 1 ? "s" : ""} remaining</div>
            </div>
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>💬</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: .8 }}>5 credits/SMS</div>
            </div>
          </div>

          <div className="credit-bar" style={{ marginTop: 16, background: "rgba(255,255,255,.2)" }}>
            <div className="credit-fill" style={{ width: `${creditPct}%`, background: "rgba(255,255,255,.7)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 12, opacity: .7 }}>{credits} credits</span>
            <span style={{ fontSize: 12, opacity: .7 }}>5 credits per SMS</span>
          </div>

          {credits === 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", background: "rgba(255,255,255,.15)", borderRadius: 10, fontSize: 13 }}>
              ⚠️ You have no credits. Buy some to start sending SMS.
            </div>
          )}

          <button
            className="btn"
            style={{ marginTop: 14, background: "rgba(255,255,255,.18)", color: "#fff", border: "1px solid rgba(255,255,255,.3)", width: "100%" }}
            onClick={() => navigate("/messaging/credits")}
          >
            💳 Buy Credits
          </button>
        </div>

        {/* ── Quick action cards ── */}
        <div className="stitle">Send SMS</div>
        {ACTIONS.map(a => (
          <div key={a.label} className="msg-action-card" onClick={() => navigate(a.to)}>
            <div className="msg-action-icon" style={{ background: a.bg }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{a.label}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{a.sub}</div>
            </div>
            <div style={{ color: "var(--muted)" }}>›</div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={() => navigate("/messaging/history")}>
            📜 Message History
          </button>
          <button className="btn bg" style={{ flex: 1 }} onClick={() => navigate("/messaging/credits")}>
            💳 Buy Credits
          </button>
        </div>
      </div>
    </div>
  );
}