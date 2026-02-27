// src/pages/messaging/MessageHistory.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { INIT_MESSAGE_HISTORY } from "../../data/seed";
import { ChevL } from "../../components/ui/Icons";

const TYPE_LABELS = {
  absentees: { label: "Absentees",   icon: "📋" },
  group:     { label: "Group",       icon: "👥" },
  single:    { label: "Single",      icon: "📱" },
  all:       { label: "All Members", icon: "📣" },
};

function StatusBadge({ status }) {
  return <span className={`msg-status ${status}`}>{status === "sent" ? "✓ Sent" : status === "pending" ? "⏳ Pending" : "✗ Failed"}</span>;
}

export default function MessageHistory() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const history = INIT_MESSAGE_HISTORY;

  if (selected) return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => setSelected(null)}>
          <ChevL /> Back
        </button>
        <h1>Message Detail</h1>
        <p>{selected.date}</p>
      </div>
      <div className="pc">
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{TYPE_LABELS[selected.type]?.label} Broadcast</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{selected.date}</div>
            </div>
            <StatusBadge status={selected.status} />
          </div>
          <div className="dvd" style={{ margin: "12px 0" }} />
          <div style={{ display: "flex", gap: 20 }}>
            <div><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Recipients</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--brand)" }}>{selected.recipients}</div></div>
            <div><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Credits Used</div><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{selected.credits_used}</div></div>
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 10, letterSpacing: ".04em" }}>Message Content</div>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", fontStyle: "italic" }}>"{selected.message}"</p>
        </div>
        {selected.status === "failed" && (
          <button className="btn ba blg" style={{ marginTop: 16 }} onClick={() => navigate(`/messaging/send?type=${selected.type}`)}>
            🔄 Retry This Message
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => navigate("/messaging")}>
          <ChevL /> Back
        </button>
        <h1>Message History</h1>
        <p>{history.length} messages sent</p>
      </div>
      <div className="pc">
        {history.length === 0 && (
          <div className="empty"><div className="empty-ico">💬</div><p>No messages sent yet</p></div>
        )}
        {history.map(m => {
          const tl = TYPE_LABELS[m.type] || { label: m.type, icon: "💬" };
          return (
            <div key={m.id} className="li" onClick={() => setSelected(m)}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {tl.icon}
              </div>
              <div className="li-info">
                <div className="li-name">{tl.label} · {m.recipients} recipients</div>
                <div className="li-sub">{m.message.slice(0, 55)}…</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{m.date}</div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
