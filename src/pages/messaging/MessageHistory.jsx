// src/pages/messaging/MessageHistory.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabaseClient";
import { ChevL } from "../../components/ui/Icons";

const TYPE_LABELS = {
  absentees: { label: "Absentees",   icon: "📋" },
  group:     { label: "Group",       icon: "👥" },
  single:    { label: "Single",      icon: "📱" },
  all:       { label: "All Members", icon: "📣" },
};

function StatusBadge({ status }) {
  const cfg = {
    sent:    { bg: "#d4f1e4", color: "#1a7a48", label: "✓ Sent"    },
    partial: { bg: "#fff3cd", color: "#856404", label: "⚠ Partial" },
    failed:  { bg: "#fce8e8", color: "#c0392b", label: "✗ Failed"  },
  }[status] ?? { bg: "#f0f0f0", color: "#666", label: status };

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 700, padding: "3px 9px",
      borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function MessageHistory({ showToast }) {
  const navigate = useNavigate();
  const { church } = useAuth();

  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!church?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sms_logs")
        .select("*")
        .eq("church_id", church.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) showToast?.("Failed to load message history");
      setHistory(data ?? []);
      setLoading(false);
    })();
  }, [church?.id]);

  // ── Detail view ──────────────────────────────────────────────────────────
  if (selected) {
    const tl = TYPE_LABELS[selected.type] || { label: selected.type, icon: "💬" };
    const results = selected.results ?? [];
    const sent     = results.filter(r => r.status === "SENT" || r.status === "DND_SENT");
    const rejected = results.filter(r => r.status !== "SENT" && r.status !== "DND_SENT");

    return (
      <div className="page">
        <div className="ph">
          <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => setSelected(null)}>
            <ChevL /> Back
          </button>
          <h1>Message Detail</h1>
          <p>{formatDate(selected.created_at)}</p>
        </div>
        <div className="pc">
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{tl.icon} {tl.label} Broadcast</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{formatDate(selected.created_at)}</div>
              </div>
              <StatusBadge status={selected.status} />
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            <div style={{ display: "flex", gap: 28 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Recipients</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--brand)" }}>{selected.recipients}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Credits Used</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>{selected.credits_used}</div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 10, letterSpacing: ".04em" }}>
              Message Content
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text)", fontStyle: "italic" }}>"{selected.message}"</p>
          </div>

          {results.length > 0 && (
            <div className="card" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
                Delivery Breakdown
              </div>
              {sent.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)", marginBottom: 6 }}>✓ Sent ({sent.length})</div>
                  {sent.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "3px 0" }}>
                      {r.phone} — {r.description || r.status}
                    </div>
                  ))}
                </div>
              )}
              {rejected.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--danger)", marginBottom: 6 }}>✗ Failed ({rejected.length})</div>
                  {rejected.map((r, i) => (
                    <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "3px 0" }}>
                      {r.phone} — {r.description || r.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected.status === "failed" && (
            <button className="btn bp blg" onClick={() => navigate(`/messaging/send?type=${selected.type}`)}>
              🔄 Retry This Message
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => navigate("/messaging")}>
          <ChevL /> Back
        </button>
        <h1>Message History</h1>
        <p>{loading ? "Loading…" : `${history.length} messages sent`}</p>
      </div>
      <div className="pc">
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>Loading…</div>
        )}
        {!loading && history.length === 0 && (
          <div className="empty">
            <div className="empty-ico">💬</div>
            <p>No messages sent yet</p>
          </div>
        )}
        {history.map(m => {
          const tl = TYPE_LABELS[m.type] || { label: m.type, icon: "💬" };
          return (
            <div key={m.id} className="li" onClick={() => setSelected(m)}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: "var(--surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {tl.icon}
              </div>
              <div className="li-info">
                <div className="li-name">{tl.label} · {m.recipients} recipient{m.recipients !== 1 ? "s" : ""}</div>
                <div className="li-sub">{m.message?.slice(0, 55)}{m.message?.length > 55 ? "…" : ""}</div>
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