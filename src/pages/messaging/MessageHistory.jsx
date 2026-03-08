// src/pages/messaging/MessageHistory.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabaseClient";
import { ChevL } from "../../components/ui/Icons";

const TYPE_LABELS = {
  absentees: { label: "Absentees",   icon: "📋" },
  attendees: { label: "Attendees",   icon: "🙏" },
  group:     { label: "Group",       icon: "👥" },
  single:    { label: "Single",      icon: "📱" },
  all:       { label: "All Members", icon: "📣" },
};

function StatusBadge({ status }) {
  const cfg = {
    sent:    { bg: "#d4f1e4", color: "#1a7a48", label: "✓ Sent"    },
    partial: { bg: "#fff3cd", color: "#856404", label: "⚠ Partial" },
    failed:  { bg: "#fce8e8", color: "#c0392b", label: "✗ Failed"  },
  }[status] ?? { bg: "#f0f0f0", color: "#666", label: status ?? "—" };

  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MessageHistory({ showToast }) {
  const navigate   = useNavigate();
  const { church } = useAuth();

  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!church?.id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("sms_logs")
      .select("*")
      .eq("church_id", church.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("[MessageHistory]", err);
          setError(err.message);
          showToast?.("Failed to load message history ❌");
        }
        setHistory(data ?? []);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [church?.id]);

  // Normalise a row — handle both old and new column naming conventions
  const normalise = (m) => ({
    ...m,
    // recipient count: try both column names
    recipientCount: m.recipient_count ?? m.recipients ?? 0,
    // recipient type: try both column names
    recipientType:  m.recipient_type  ?? m.type ?? "all",
    // sender ID
    senderId: m.sender_id || "ChurchTrakr",
  });

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selected) {
    const m  = normalise(selected);
    const tl = TYPE_LABELS[m.recipientType] || { label: m.recipientType, icon: "💬" };

    return (
      <div className="page">
        <div className="ph">
          <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => setSelected(null)}>
            <ChevL /> Back
          </button>
          <h1>Message Detail</h1>
          <p>{formatDate(m.created_at)}</p>
        </div>
        <div className="pc">
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{tl.icon} {tl.label} Broadcast</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{formatDate(m.created_at)}</div>
              </div>
              <StatusBadge status={m.status} />
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Recipients</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--brand)" }}>{m.recipientCount}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Credits Used</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{m.credits_used ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Sender ID</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{m.senderId}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 10, letterSpacing: ".04em" }}>
              Message Content
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)", fontStyle: "italic" }}>"{m.message}"</p>
          </div>

          <button className="btn bp blg" onClick={() => navigate(`/messaging/send?type=${m.recipientType}`)}>
            📤 Send Similar Message
          </button>
        </div>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => navigate("/messaging")}>
          <ChevL /> Back
        </button>
        <h1>Message History</h1>
        <p>{loading ? "Loading…" : `${history.length} message${history.length !== 1 ? "s" : ""} sent`}</p>
      </div>

      <div className="pc">
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            Loading history…
          </div>
        )}

        {!loading && error && (
          <div style={{ background: "#fce8e8", borderRadius: 12, padding: "16px", textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>Failed to load</div>
            <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 12 }}>{error}</div>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              If this is your first time, the <code>sms_logs</code> table may not exist yet. Run the SQL migration in Supabase.
            </p>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="empty">
            <div className="empty-ico">💬</div>
            <p>No messages sent yet</p>
            <button className="btn bp" style={{ marginTop: 12 }} onClick={() => navigate("/messaging/send")}>
              Send Your First SMS
            </button>
          </div>
        )}

        {!loading && !error && history.map(row => {
          const m  = normalise(row);
          const tl = TYPE_LABELS[m.recipientType] || { label: m.recipientType || "Message", icon: "💬" };
          return (
            <div key={m.id} className="li" onClick={() => setSelected(row)}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                {tl.icon}
              </div>
              <div className="li-info">
                <div className="li-name">
                  {tl.label}
                  {m.recipientCount > 0 && <span style={{ color: "var(--muted)", fontWeight: 400 }}> · {m.recipientCount} recipient{m.recipientCount !== 1 ? "s" : ""}</span>}
                </div>
                <div className="li-sub">{m.message?.slice(0, 60)}{m.message?.length > 60 ? "…" : ""}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{formatDate(m.created_at)}</div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          );
        })}
      </div>
    </div>
  );
}