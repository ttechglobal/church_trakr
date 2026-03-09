// src/pages/messaging/MessagingHome.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ACTIONS = [
  { key: "absentees", label: "Absentees",     sub: "Members who missed last service", icon: "📋", accent: "#7c3aed" },
  { key: "attendees", label: "Attendees",     sub: "Members who came to service",     icon: "🙏", accent: "#059669" },
  { key: "group",     label: "A Group",       sub: "Everyone in a specific group",    icon: "👥", accent: "#0284c7" },
  { key: "all",       label: "All Members",   sub: "Broadcast to the whole church",   icon: "📣", accent: "#d97706" },
  { key: "single",    label: "One Person",    sub: "Send to a single number",         icon: "📱", accent: "#db2777" },
];

export default function MessagingHome() {
  const navigate = useNavigate();
  const { church } = useAuth();
  const credits  = church?.sms_credits ?? 0;
  const msgs     = Math.floor(credits / 10);
  const low      = credits < 50;

  return (
    <div className="page">
      <div style={{
        background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding: "max(env(safe-area-inset-top,32px),32px) 20px 20px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-30, width:160, height:160,
          borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#fff" }}>Messaging</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:4 }}>Send SMS to your church members</div>
          </div>
          <button onClick={() => navigate("/settings?tab=templates")} style={{
            background:"rgba(255,255,255,.18)", border:"1px solid rgba(255,255,255,.25)",
            color:"#fff", borderRadius:12, padding:"10px 12px", cursor:"pointer",
            fontFamily:"'DM Sans',sans-serif", display:"inline-flex", alignItems:"center", gap:5, fontSize:12,
          }}>⚙️ Templates</button>
        </div>
      </div>

      <div className="pc">
        {/* ── Credit balance card ── */}
        <div style={{
          background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
          borderRadius: 20, padding: "22px 20px", marginBottom: 24, color: "#fff",
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circle */}
          <div style={{ position: "absolute", right: -30, top: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ position: "absolute", right: 20, top: 20, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />

          <div style={{ fontSize: 11, fontWeight: 700, opacity: .7, textTransform: "uppercase", letterSpacing: ".1em" }}>SMS Credits</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, margin: "6px 0 2px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{credits.toLocaleString()}</div>
            <div style={{ fontSize: 14, opacity: .7, paddingBottom: 6 }}>credits</div>
          </div>
          <div style={{ fontSize: 13, opacity: .75, marginBottom: 18 }}>
            {msgs > 0 ? `≈ ${msgs.toLocaleString()} messages remaining` : "No credits — top up to start sending"}
          </div>

          {low && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 10, padding: "8px 12px", fontSize: 12, marginBottom: 14 }}>
              {credits === 0 ? "⚠️ Out of credits" : `⚠️ Running low (${credits} credits left)`}
            </div>
          )}

          <button onClick={() => navigate("/messaging/credits")} style={{
            background: "#fff", color: "var(--brand)", border: "none", borderRadius: 12,
            padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 6,
          }}>
            💳 Top Up Credits
          </button>
        </div>

        {/* ── Send SMS section ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
          Who do you want to message?
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {ACTIONS.map(a => (
            <div key={a.key} onClick={() => navigate(`/messaging/send?type=${a.key}`)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "var(--surface)", borderRadius: 16,
                padding: "14px 16px", cursor: "pointer",
                border: "1.5px solid var(--border)",
                transition: "all .12s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = a.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 14, flexShrink: 0,
                background: a.accent + "18",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
              }}>
                {a.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{a.sub}</div>
              </div>
              <div style={{
                width: 28, height: 28, borderRadius: 8, background: a.accent + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: a.accent, fontSize: 14, fontWeight: 700, flexShrink: 0,
              }}>›</div>
            </div>
          ))}
        </div>

        {/* ── Bottom links ── */}
        <div style={{ display: "flex", gap: 10 }}>
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