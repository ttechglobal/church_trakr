// src/pages/SuperAdmin.jsx
// ChurchTrakr Super Admin — completely separate from the church app
// Access: /superadmin  (private URL, not linked anywhere in the app)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const SUPER_ADMIN_EMAIL = "admin@churchtrackr.com";
const WHATSAPP_NUMBER   = "2348050340350"; // 234 = Nigeria country code

// ─── Design tokens ─────────────────────────────────────────────────────────
const T = {
  bg:      "#f8fafc",
  surface: "#ffffff",
  card:    "#ffffff",
  sidebar: "#1e293b",
  sideHov: "#334155",
  sideAct: "#3b82f6",
  border:  "#e2e8f0",
  text:    "#0f172a",
  muted:   "#64748b",
  dim:     "#94a3b8",
  brand:   "#3b82f6",
  green:   "#16a34a",
  yellow:  "#d97706",
  red:     "#dc2626",
  purple:  "#7c3aed",
};

const inp = (extra = {}) => ({
  width: "100%", background: "#f8fafc", border: `1.5px solid ${T.border}`,
  borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14,
  fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box", ...extra,
});

const btn = (bg, col = "#fff", pad = "9px 18px") => ({
  background: bg, border: "none", color: col, borderRadius: 8,
  padding: pad, cursor: "pointer", fontSize: 13, fontWeight: 600,
  fontFamily: "'DM Sans',sans-serif", transition: "opacity .15s",
  display: "inline-flex", alignItems: "center", gap: 6,
});

function Badge({ status }) {
  const map = {
    pending:  { bg: "#fef3c7", color: "#92400e" },
    approved: { bg: "#dcfce7", color: "#166534" },
    rejected: { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: T.muted };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{sub}</span>
      </div>
      <div style={{ fontWeight: 800, fontSize: 28, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ModalWrap({ children, onClose, title, width = 440 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: T.card, borderRadius: 18, padding: "26px 24px", width: "100%",
        maxWidth: width, boxShadow: "0 20px 60px rgba(0,0,0,.2)", border: `1px solid ${T.border}` }}>
        {title && <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 20 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function Overview({ churches, requests, usageLogs }) {
  const totalCredits = churches.reduce((s, c) => s + (c.sms_credits || 0), 0);
  const pending      = requests.filter(r => r.status === "pending").length;
  const thisMonth    = churches.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalSmsSent = usageLogs.filter(l => l.event_type === "sms_sent")
    .reduce((s, l) => s + (l.recipient_count || 0), 0);

  const recent = [...churches].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { icon:"⛪", label:"Total Churches",     value:churches.length,                color:T.brand,                          sub:"registered" },
          { icon:"✨", label:"New This Month",     value:thisMonth,                      color:T.green,                          sub:"joined" },
          { icon:"⏳", label:"Pending Sender IDs", value:pending,                        color:pending > 0 ? T.yellow : T.green, sub:pending > 0 ? "need action" : "all clear" },
          { icon:"💬", label:"SMS Sent (All Time)",value:totalSmsSent.toLocaleString(),  color:T.purple,                         sub:"messages" },
        ].map(s => (
          <div key={s.label} style={{ flex:"1 1 130px", background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <span style={{ fontSize:11, color:T.muted, fontWeight:600 }}>{s.sub}</span>
            </div>
            <div style={{ fontWeight:800, fontSize:28, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>
            Recently Joined Churches
          </div>
          {recent.map((c, i) => (
            <div key={c.id} style={{ padding: "12px 20px", borderBottom: i < recent.length-1 ? `1px solid ${T.border}` : "none",
              display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⛪</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || "Unnamed"}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{c.admin_name || "—"}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: (c.sms_credits||0) < 50 ? T.red : T.green }}>{(c.sms_credits||0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: T.muted }}>credits</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14,
            display: "flex", alignItems: "center", gap: 8 }}>
            Pending Sender IDs
            {pending > 0 && <span style={{ background: T.yellow, color: "#fff", fontSize: 11, fontWeight: 700,
              padding: "2px 8px", borderRadius: 20 }}>{pending}</span>}
          </div>
          {requests.filter(r => r.status === "pending").length === 0
            ? <div style={{ padding: "30px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>✅ No pending requests</div>
            : requests.filter(r => r.status === "pending").slice(0, 5).map((req, i, arr) => (
              <div key={req.id} style={{ padding: "12px 20px", borderBottom: i < arr.length-1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{req.sender_id}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{req.churches?.name || "Unknown"}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Church Detail Modal ────────────────────────────────────────────────────
function ChurchDetail({ church, usageLogs, onClose, onSetPassword, onUpdateCredits, showToast }) {
  const [tab, setTab] = useState("info"); // info | usage
  const logs = usageLogs.filter(l => l.church_id === church.id);
  const smsSent = logs.filter(l => l.event_type === "sms_sent").reduce((s, l) => s + (l.recipient_count||0), 0);
  const attSessions = logs.filter(l => l.event_type === "attendance_saved").length;

  return (
    <ModalWrap onClose={onClose} width={540}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "#ede9fe",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⛪</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{church.name || "Unnamed"}</div>
          <div style={{ fontSize: 13, color: T.muted }}>{church.admin_name || "—"}</div>
        </div>
        <button onClick={onClose} style={{ ...btn("#f1f5f9", T.muted, "8px 12px"), fontSize: 18 }}>✕</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 20 }}>
        {[["info","ℹ️ Info"], ["usage","📈 Usage"]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer",
            background: tab === k ? "#fff" : "transparent",
            color: tab === k ? T.brand : T.muted, fontWeight: 700, fontSize: 13,
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,.1)" : "none",
          }}>{l}</button>
        ))}
      </div>

      {tab === "info" ? (
        <div>
          {/* Info rows */}
          {[
            ["📞 Phone",    church.phone    || "—"],
            ["📍 Location", church.location || "—"],
            ["✉️ Email",    church.email    || "—"],
            ["🔖 Sender ID", `${church.sms_sender_id || "ChurchTrakr (default)"}`],
            ["💳 Credits",  `${(church.sms_credits||0).toLocaleString()} credits`],
            ["📅 Joined",   church.created_at ? new Date(church.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"long", year:"numeric" }) : "—"],
          ].map(([k,v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0",
              borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <span style={{ color: T.muted, fontWeight: 600 }}>{k}</span>
              <span style={{ fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{v}</span>
            </div>
          ))}

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
            <button style={{ ...btn("#eff6ff", T.brand, "11px"), justifyContent: "center" }}
              onClick={onUpdateCredits}>💳 Update Credits</button>
            <button style={{ ...btn("#fef9c3", "#854d0e", "11px"), justifyContent: "center" }}
              onClick={onSetPassword}>🔑 Set Password</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#eff6ff", borderRadius: 12, padding: "14px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 24, color: T.purple }}>{smsSent.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>SMS sent</div>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "14px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 24, color: T.green }}>{attSessions}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>Attendance sessions</div>
            </div>
          </div>
          {logs.length === 0
            ? <div style={{ padding: "20px", textAlign: "center", color: T.muted, fontSize: 13 }}>No activity recorded yet</div>
            : <div style={{ maxHeight: 280, overflowY: "auto" }}>
                {logs.slice(0, 30).map((l, i) => (
                  <div key={l.id||i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0",
                    borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 16 }}>{l.event_type === "sms_sent" ? "💬" : "✅"}</span>
                    <div style={{ flex: 1, fontSize: 13 }}>
                      {l.event_type === "sms_sent"
                        ? `SMS sent to ${l.recipient_count||0} recipients`
                        : `Attendance session — ${l.recipient_count||0} members`}
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {l.created_at ? new Date(l.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short" }) : "—"}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}
    </ModalWrap>
  );
}

// ─── Churches ────────────────────────────────────────────────────────────────
function Churches({ churches, setChurches, usageLogs, showToast }) {
  const [search,    setSearch]    = useState("");
  const [viewC,     setViewC]     = useState(null);
  const [editC,     setEditC]     = useState(null);
  const [newCreds,  setNewCreds]  = useState("");
  const [pwC,       setPwC]       = useState(null);
  const [newPw,     setNewPw]     = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [saving,    setSaving]    = useState(false);

  const filtered = churches.filter(c =>
    [c.name, c.admin_name, c.phone, c.location].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const saveCredits = async () => {
    const n = parseInt(newCreds);
    if (isNaN(n) || n < 0) { showToast("Enter a valid number"); return; }
    setSaving(true);
    const { error } = await supabase.from("churches").update({ sms_credits: n }).eq("id", editC.id);
    setSaving(false);
    if (error) { showToast("Failed ❌"); return; }
    setChurches(cs => cs.map(c => c.id === editC.id ? { ...c, sms_credits: n } : c));
    showToast(`✅ Credits set to ${n.toLocaleString()} for ${editC.name}`);
    setEditC(null); setNewCreds("");
  };

  const setPassword = async () => {
    if (newPw.length < 6) { showToast("Password must be at least 6 characters"); return; }
    if (!pwC?.admin_user_id) { showToast("No user ID for this church ❌"); return; }
    setSaving(true);
    // Uses Supabase admin endpoint via Edge Function if available, otherwise note limitation
    const { error } = await supabase.functions.invoke("admin-set-password", {
      body: { user_id: pwC.admin_user_id, password: newPw },
    });
    setSaving(false);
    if (error) {
      showToast("⚠️ Edge function not deployed — see note");
      return;
    }
    showToast(`✅ Password updated for ${pwC.name}`);
    setPwC(null); setNewPw(""); setShowPw(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
        <input style={inp({ flex: 1 })} value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${churches.length} churches…`} />
        <div style={{ fontSize: 13, color: T.muted, whiteSpace: "nowrap" }}>{filtered.length} shown</div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No churches found</div>
          : filtered.map((c, i) => (
            <div key={c.id} style={{ padding: "14px 16px", borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none",
              display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.name || "Unnamed"}</div>
                  <div style={{ fontSize: 12, color: T.muted, display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                    {c.admin_name && <span>👤 {c.admin_name}</span>}
                    {c.phone      && <span>📞 {c.phone}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 20, color: (c.sms_credits||0) < 50 ? T.red : T.green }}>
                    {(c.sms_credits||0).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted }}>credits</div>
                </div>
              </div>
              <button style={{ ...btn("#eff6ff", T.brand, "10px 16px"), width: "100%", justifyContent: "center", fontSize: 14 }}
                onClick={() => setViewC(c)}>
                View Church →
              </button>
            </div>
          ))
        }
      </div>

      {/* Church detail modal */}
      {viewC && (
        <ChurchDetail
          church={viewC}
          usageLogs={usageLogs}
          onClose={() => setViewC(null)}
          onUpdateCredits={() => { setEditC(viewC); setNewCreds(String(viewC.sms_credits||0)); setViewC(null); }}
          onSetPassword={() => { setPwC(viewC); setViewC(null); }}
          showToast={showToast}
        />
      )}

      {/* Credits modal */}
      {editC && (
        <ModalWrap onClose={() => { setEditC(null); setNewCreds(""); }} title={`Update Credits — ${editC.name}`}>
          <input type="number" min="0" value={newCreds} onChange={e => setNewCreds(e.target.value)}
            style={inp({ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 8 })} />
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginBottom: 16 }}>
            = {Math.floor((parseInt(newCreds)||0)/10).toLocaleString()} SMS messages
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 20 }}>
            {[100, 500, 1000, 5000].map(n => (
              <button key={n} style={{ ...btn("#eff6ff", T.brand, "9px 4px"), justifyContent: "center", width: "100%", fontSize: 12 }}
                onClick={() => setNewCreds(String((parseInt(newCreds)||0)+n))}>+{n}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...btn("#f1f5f9", T.muted, "12px"), flex: 1, justifyContent: "center" }}
              onClick={() => { setEditC(null); setNewCreds(""); }}>Cancel</button>
            <button style={{ ...btn(T.brand, "#fff", "12px"), flex: 1, justifyContent: "center" }}
              onClick={saveCredits} disabled={saving}>{saving ? "Saving…" : "Save Credits"}</button>
          </div>
        </ModalWrap>
      )}

      {/* Set password modal */}
      {pwC && (
        <ModalWrap onClose={() => { setPwC(null); setNewPw(""); setShowPw(false); }} title={`Set Password — ${pwC.name}`}>
          <div style={{ background: "#fef9c3", border: "1px solid #fde047", borderRadius: 10,
            padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#854d0e", lineHeight: 1.6 }}>
            <strong>Note:</strong> This requires the <code>admin-set-password</code> edge function to be deployed.
            Alternatively, share a temporary password with the church directly via WhatsApp.
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.muted, marginBottom: 6 }}>NEW PASSWORD</div>
          <div style={{ position: "relative", marginBottom: 20 }}>
            <input type={showPw ? "text" : "password"} value={newPw} onChange={e => setNewPw(e.target.value)}
              style={inp()} placeholder="Enter new password (min 6 chars)" />
            <button onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%",
              transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer",
              fontSize: 14, color: T.muted }}>{showPw ? "🙈" : "👁️"}</button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...btn("#f1f5f9", T.muted, "12px"), flex: 1, justifyContent: "center" }}
              onClick={() => { setPwC(null); setNewPw(""); setShowPw(false); }}>Cancel</button>
            <button style={{ ...btn(T.brand, "#fff", "12px"), flex: 1, justifyContent: "center" }}
              onClick={setPassword} disabled={saving || newPw.length < 6}>
              {saving ? "Setting…" : "Set Password"}
            </button>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ─── Add Credits ──────────────────────────────────────────────────────────────
function AddCredits({ churches, setChurches, showToast }) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [amount,   setAmount]   = useState("");
  const [saving,   setSaving]   = useState(false);

  const filtered = churches.filter(c =>
    !search.trim() || [c.name, c.admin_name, c.phone].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAdd = async () => {
    const n = parseInt(amount);
    if (!selected) { showToast("Select a church first"); return; }
    if (isNaN(n) || n <= 0) { showToast("Enter a valid amount"); return; }
    const newTotal = (selected.sms_credits || 0) + n;
    setSaving(true);
    const { error } = await supabase.from("churches").update({ sms_credits: newTotal }).eq("id", selected.id);
    setSaving(false);
    if (error) { showToast("Failed ❌"); return; }
    const updated = { ...selected, sms_credits: newTotal };
    setChurches(cs => cs.map(c => c.id === selected.id ? updated : c));
    setSelected(updated);
    showToast(`✅ Added ${n.toLocaleString()} credits → ${selected.name} (now ${newTotal.toLocaleString()})`);
    setAmount("");
  };

  const isMobile = window.innerWidth < 768;
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: 20, alignItems: "flex-start" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>1. Select Church</div>
        <input style={inp({ marginBottom: 12 })} value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Search churches…" />
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14,
          overflow: "hidden", maxHeight: 500, overflowY: "auto" }}>
          {filtered.map((c, i) => (
            <div key={c.id} onClick={() => setSelected(c)} style={{
              padding: "13px 16px", borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none",
              display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
              background: selected?.id === c.id ? "#eff6ff" : "transparent",
              borderLeft: `3px solid ${selected?.id === c.id ? T.brand : "transparent"}`,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || "Unnamed"}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{c.admin_name || "—"}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: (c.sms_credits||0) < 50 ? T.red : T.green }}>{(c.sms_credits||0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: T.muted }}>credits</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
        padding: "22px 20px", position: "sticky", top: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>2. Add Credits</div>
        {selected
          ? <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12,
              padding: "12px 14px", marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.brand }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                Balance: <strong style={{ color: T.text }}>{(selected.sms_credits||0).toLocaleString()} credits</strong>
              </div>
            </div>
          : <div style={{ background: "#f8fafc", border: `1px dashed ${T.border}`, borderRadius: 12,
              padding: "16px 14px", marginBottom: 18, textAlign: "center", color: T.muted, fontSize: 13 }}>
              ← Select a church first
            </div>
        }
        <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Credits to add</label>
        <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
          style={inp({ fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 6 })} placeholder="0" />
        {amount && parseInt(amount) > 0 && (
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginBottom: 10 }}>
            = {Math.floor(parseInt(amount)/10).toLocaleString()} SMS messages
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 18 }}>
          {[100, 500, 1000, 5000].map(n => (
            <button key={n} style={{ ...btn("#eff6ff", T.brand, "9px 4px"), justifyContent: "center", width: "100%", fontSize: 12 }}
              onClick={() => setAmount(String((parseInt(amount)||0)+n))}>+{n}</button>
          ))}
        </div>
        {selected && amount && parseInt(amount) > 0 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10,
            padding: "10px 14px", fontSize: 13, marginBottom: 16, color: "#15803d" }}>
            New balance: <strong>{((selected.sms_credits||0) + parseInt(amount)).toLocaleString()}</strong> credits
          </div>
        )}
        <button style={{ ...btn(T.brand, "#fff", "13px 20px"), width: "100%", justifyContent: "center",
          opacity: (!selected || !amount || parseInt(amount) <= 0) ? .4 : 1 }}
          onClick={handleAdd} disabled={saving || !selected || !amount || parseInt(amount) <= 0}>
          {saving ? "Adding…" : "✅ Add Credits"}
        </button>
      </div>
    </div>
  );
}

// ─── Sender IDs ───────────────────────────────────────────────────────────────
function SenderIDs({ requests, setRequests, churches, setChurches, showToast }) {
  const [filter, setFilter] = useState("pending");
  const [saving, setSaving] = useState(null);
  const [copied, setCopied] = useState(null);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(id); setTimeout(() => setCopied(null), 1500); });
  };

  const approve = async (req) => {
    setSaving(req.id);
    const [r1, r2] = await Promise.all([
      supabase.from("sender_id_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", req.id),
      supabase.from("churches").update({ sms_sender_id: req.sender_id, sms_sender_id_status: "approved" }).eq("id", req.church_id),
    ]);
    setSaving(null);
    if (r1.error || r2.error) { showToast("Error ❌"); return; }
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "approved", reviewed_at: new Date().toISOString() } : r));
    setChurches(cs => cs.map(c => c.id === req.church_id ? { ...c, sms_sender_id: req.sender_id, sms_sender_id_status: "approved" } : c));
    showToast(`✅ "${req.sender_id}" approved`);
  };

  const reject = async (req) => {
    setSaving(req.id);
    const { error } = await supabase.from("sender_id_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", req.id);
    setSaving(null);
    if (error) { showToast("Error ❌"); return; }
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    showToast(`Rejected "${req.sender_id}"`);
  };

  const shown   = filter === "pending" ? requests.filter(r => r.status === "pending") : requests;
  const pending = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 14,
        padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#1e40af", lineHeight: 1.7 }}>
        <strong>📋 Workflow:</strong> Church submits request → Copy the Sender ID →
        Go to <a href="https://app.termii.com" target="_blank" rel="noreferrer" style={{ color: T.brand }}>app.termii.com</a> →
        Request it (Termii takes 24–48 hrs) → Come back and click Approve.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["pending", `Pending${pending > 0 ? ` (${pending})` : ""}`], ["all", "All Requests"]].map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            ...btn(filter === k ? T.brand : "#f8fafc", filter === k ? "#fff" : T.muted, "8px 18px"),
            border: `1px solid ${filter === k ? T.brand : T.border}`,
          }}>{l}</button>
        ))}
      </div>

      {shown.length === 0
        ? <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
            padding: 48, textAlign: "center", color: T.muted }}>
            {filter === "pending" ? "✅ No pending requests!" : "No requests yet"}
          </div>
        : <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
            {shown.map((req, i) => (
              <div key={req.id} style={{ padding: "14px 16px", borderBottom: i < shown.length-1 ? `1px solid ${T.border}` : "none",
                display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 800, fontSize: 18 }}>{req.sender_id}</span>
                    <Badge status={req.status} />
                    <button onClick={() => copy(req.sender_id, req.id)} style={{
                      ...btn("#f8fafc", T.muted, "3px 10px"), fontSize: 11, border: `1px solid ${T.border}` }}>
                      {copied === req.id ? "✓ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <div style={{ fontSize: 13, color: T.muted }}>
                    {req.churches?.name || "Unknown"} · {req.churches?.admin_name || ""}
                    {req.churches?.phone ? ` · ${req.churches.phone}` : ""}
                  </div>
                  <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>
                    {req.created_at ? new Date(req.created_at).toLocaleDateString("en-NG",
                      { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                  </div>
                </div>
                {req.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, width: "100%" }}>
                    <button style={{ ...btn("#dcfce7", T.green, "8px 14px"), border: "1px solid #bbf7d0" }}
                      onClick={() => approve(req)} disabled={saving === req.id}>
                      {saving === req.id ? "…" : "✓ Approve"}
                    </button>
                    <button style={{ ...btn("#fee2e2", T.red, "8px 14px"), border: "1px solid #fecaca" }}
                      onClick={() => reject(req)} disabled={saving === req.id}>✗ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─── Usage ────────────────────────────────────────────────────────────────────
function Usage({ usageLogs, churches }) {
  const [filter, setFilter] = useState("all");

  const enriched = usageLogs.map(l => ({
    ...l, churchName: churches.find(c => c.id === l.church_id)?.name || "Unknown",
  }));

  const shown = filter === "sms"        ? enriched.filter(l => l.event_type === "sms_sent")
              : filter === "attendance" ? enriched.filter(l => l.event_type === "attendance_saved")
              : enriched;

  const smsSessions  = enriched.filter(l => l.event_type === "sms_sent");
  const attSessions  = enriched.filter(l => l.event_type === "attendance_saved");
  const totalSmsSent = smsSessions.reduce((s, l) => s + (l.recipient_count || 0), 0);

  const byChurch = {};
  enriched.forEach(l => {
    if (!byChurch[l.church_id]) byChurch[l.church_id] = { name: l.churchName, sms: 0, att: 0, total: 0 };
    if (l.event_type === "sms_sent")         byChurch[l.church_id].sms += l.recipient_count || 0;
    if (l.event_type === "attendance_saved") byChurch[l.church_id].att += 1;
    byChurch[l.church_id].total += 1;
  });
  const topChurches = Object.values(byChurch).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { icon:"📊", label:"Total Events",        value:enriched.length,          color:T.brand,  sub:"all time" },
          { icon:"💬", label:"SMS Sends",           value:smsSessions.length,       color:T.purple, sub:`${totalSmsSent.toLocaleString()} recipients` },
          { icon:"✅", label:"Attendance Sessions", value:attSessions.length,       color:T.green,  sub:"recorded" },
        ].map(s => (
          <div key={s.label} style={{ flex:"1 1 120px", background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ fontSize:20 }}>{s.icon}</span>
              <span style={{ fontSize:11, color:T.muted, fontWeight:600 }}>{s.sub}</span>
            </div>
            <div style={{ fontWeight:800, fontSize:26, color:s.color, lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:13, color:T.muted, marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Activity Log</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[["all","All"],["sms","SMS"],["attendance","Attendance"]].map(([k,l]) => (
                <button key={k} onClick={() => setFilter(k)} style={{
                  ...btn(filter === k ? T.brand : "#f8fafc", filter === k ? "#fff" : T.muted, "5px 10px"),
                  fontSize: 12, border: `1px solid ${filter === k ? T.brand : T.border}`,
                }}>{l}</button>
              ))}
            </div>
          </div>
          {shown.length === 0
            ? <div style={{ padding: "30px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                No events yet — events are logged when churches send SMS or save attendance
              </div>
            : <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {shown.map((l, i) => (
                  <div key={l.id||i} style={{ padding: "11px 20px", borderBottom: `1px solid ${T.border}`,
                    display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{l.event_type === "sms_sent" ? "💬" : "✅"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.churchName}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted }}>
                        {l.event_type === "sms_sent"
                          ? `Sent SMS to ${l.recipient_count||0} recipients`
                          : `Attendance — ${l.recipient_count||0} members`}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>
                      {l.created_at ? new Date(l.created_at).toLocaleDateString("en-NG",
                        { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>
            Most Active Churches
          </div>
          {topChurches.length === 0
            ? <div style={{ padding: "30px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>No data yet</div>
            : topChurches.map((c, i) => (
              <div key={i} style={{ padding: "12px 20px", borderBottom: i < topChurches.length-1 ? `1px solid ${T.border}` : "none",
                display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, background: "#eff6ff", borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 13, color: T.brand, flexShrink: 0 }}>#{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>💬 {c.sms} sent · ✅ {c.att} sessions</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: T.brand }}>{c.total}</div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Support Messages ─────────────────────────────────────────────────────────
function SupportMessages({ showToast }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [viewMsg,  setViewMsg]  = useState(null);

  useEffect(() => {
    supabase.from("support_messages").select("*")
      .order("created_at", { ascending: false })
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return; }
        // Fetch church info separately to avoid FK join 400 errors
        const churchIds = [...new Set(data.map(m => m.church_id).filter(Boolean))];
        let churchMap = {};
        if (churchIds.length) {
          for (const cid of churchIds) {
            const { data: ch } = await supabase.from("churches")
              .select("id, name, admin_name, phone, email")
              .eq("id", cid).single();
            if (ch) churchMap[ch.id] = ch;
          }
        }
        setMessages(data.map(m => ({ ...m, churches: churchMap[m.church_id] || null })));
        setLoading(false);
      });
  }, []);

  const markRead = async (id) => {
    await supabase.from("support_messages").update({ read: true }).eq("id", id);
    setMessages(ms => ms.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const unread = messages.filter(m => !m.read).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Support Messages</div>
        {unread > 0 && <span style={{ background: T.red, color: "#fff", fontSize: 11, fontWeight: 700,
          padding: "3px 9px", borderRadius: 20 }}>{unread} unread</span>}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: T.muted }}>Loading…</div>
      ) : messages.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16,
          padding: 48, textAlign: "center", color: T.muted }}>No messages yet</div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          {messages.map((m, i) => (
            <div key={m.id} onClick={() => { setViewMsg(m); markRead(m.id); }}
              style={{ padding: "14px 20px", borderBottom: i < messages.length-1 ? `1px solid ${T.border}` : "none",
                display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
                background: m.read ? "transparent" : "#eff6ff" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: m.read ? "transparent" : T.brand }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: m.read ? 600 : 700, fontSize: 14, marginBottom: 2 }}>
                  {m.churches?.name || "Unknown Church"}
                </div>
                <div style={{ fontSize: 13, color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.message}
                </div>
              </div>
              <div style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>
                {m.created_at ? new Date(m.created_at).toLocaleDateString("en-NG",
                  { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMsg && (
        <ModalWrap onClose={() => setViewMsg(null)} title="Support Message" width={480}>
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{viewMsg.churches?.name || "Unknown"}</div>
            <div style={{ fontSize: 13, color: T.muted, display: "flex", flexDirection: "column", gap: 4 }}>
              {viewMsg.churches?.admin_name && <span>👤 {viewMsg.churches.admin_name}</span>}
              {viewMsg.churches?.phone      && <span>📞 {viewMsg.churches.phone}</span>}
              {viewMsg.churches?.email      && <span>✉️ {viewMsg.churches.email}</span>}
            </div>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: T.text, marginBottom: 20,
            background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 16px" }}>
            {viewMsg.message}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {viewMsg.churches?.phone && (
              <a href={`https://wa.me/${viewMsg.churches.phone.replace(/\D/g,"").replace(/^0/,"234")}?text=${encodeURIComponent(`Hi ${viewMsg.churches.admin_name || ""}, thank you for reaching out to ChurchTrakr support.`)}`}
                target="_blank" rel="noreferrer" style={{ ...btn("#dcfce7", "#15803d", "11px 14px"), textDecoration: "none", flex: 1, justifyContent: "center" }}>
                💚 Reply on WhatsApp
              </a>
            )}
            <button style={{ ...btn("#f1f5f9", T.muted, "11px 14px"), flex: 1, justifyContent: "center" }}
              onClick={() => setViewMsg(null)}>Close</button>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail] = useState(SUPER_ADMIN_EMAIL);
  const [pass,  setPass]  = useState("");
  const [err,   setErr]   = useState("");
  const [busy,  setBusy]  = useState(false);

  const go = async () => {
    setBusy(true); setErr("");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error || data.user?.email !== SUPER_ADMIN_EMAIL) {
      setErr("Invalid credentials or not an admin account"); return;
    }
    onLogin(data.user);
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 24 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20,
        padding: "36px 32px", width: "100%", maxWidth: 400,
        boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: T.brand, borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⛪</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>ChurchTrakr</div>
            <div style={{ fontSize: 12, color: T.muted }}>Admin Console</div>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6 }}>EMAIL</label>
          <input style={inp()} value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6 }}>PASSWORD</label>
          <input style={inp()} value={pass} onChange={e => setPass(e.target.value)} type="password"
            onKeyDown={e => e.key === "Enter" && go()} />
        </div>
        {err && <div style={{ background: "#fee2e2", color: T.red, borderRadius: 10,
          padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{err}</div>}
        <button style={{ ...btn(T.brand, "#fff", "13px"), width: "100%", justifyContent: "center", fontSize: 15 }}
          onClick={go} disabled={busy}>{busy ? "Signing in…" : "Sign In →"}</button>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
function AdminDashboard({ user, onLogout }) {
  const [tab,       setTab]       = useState("overview");
  const [churches,  setChurches]  = useState([]);
  const [requests,  setRequests]  = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [toast,     setToast]     = useState("");
  const [sideOpen,  setSideOpen]  = useState(true);
  const [mobile,    setMobile]    = useState(window.innerWidth < 768);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); }, []);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [
      { data: ch, error: e1 },
      { data: sr, error: e2 },
      { data: ul, error: e3 },
    ] = await Promise.all([
      supabase.from("churches").select("*").order("created_at", { ascending: false }),
      supabase.from("sender_id_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("usage_logs").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (e1) console.error("churches:", e1.message);
    if (e2) console.error("sender_id_requests:", e2.message);
    if (e3) console.error("usage_logs:", e3.message);
    if (ch) setChurches(ch);
    // Enrich sender_id_requests with church info from already-fetched churches
    if (sr && ch) {
      const churchMap = {};
      ch.forEach(c => { churchMap[c.id] = c; });
      setRequests(sr.map(r => ({ ...r, churches: churchMap[r.church_id] || null })));
    } else if (sr) {
      setRequests(sr);
    }
    if (ul) setUsageLogs(ul);
    if (e2 || e3) {
      showToast("⚠️ Some data couldn't load — RLS policies may need updating. See console.");
    }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const sub = supabase.channel("admin-rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "churches" }, p => {
        setChurches(cs => cs.map(c => c.id === p.new.id ? { ...c, ...p.new } : c));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sender_id_requests" }, p => {
        setRequests(rs => [p.new, ...rs]);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "usage_logs" }, p => {
        setUsageLogs(ul => [p.new, ...ul]);
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const pending = requests.filter(r => r.status === "pending").length;

  const NAV = [
    { key: "overview",  icon: "📊", label: "Overview" },
    { key: "churches",  icon: "⛪", label: "Churches",    badge: churches.length },
    { key: "credits",   icon: "💳", label: "Add Credits" },
    { key: "senderids", icon: "🔖", label: "Sender IDs",  badge: pending > 0 ? pending : null, badgeColor: T.yellow },
    { key: "usage",     icon: "📈", label: "Usage" },
    { key: "support",   icon: "💬", label: "Support" },
  ];

  // On mobile: hamburger menu drawer
  if (mobile) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", color: T.text }}>
        {/* Mobile top bar */}
        <div style={{ background: T.sidebar, padding: "14px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setSideOpen(v => !v)} style={{
              background: "rgba(255,255,255,.1)", border: "none", borderRadius: 8,
              padding: "8px 10px", cursor: "pointer", color: "#fff", fontSize: 18, lineHeight: 1,
            }}>☰</button>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>
              {NAV.find(n => n.key === tab)?.icon} {NAV.find(n => n.key === tab)?.label || "Admin"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btn("#334155", "#fff", "7px 11px")} onClick={loadAll}>↻</button>
            <button style={btn("#7f1d1d", "#fca5a5", "7px 11px")} onClick={onLogout}>Sign Out</button>
          </div>
        </div>

        {/* Hamburger drawer overlay */}
        {sideOpen && (
          <>
            <div onClick={() => setSideOpen(false)} style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 300,
            }} />
            <div style={{
              position: "fixed", top: 0, left: 0, bottom: 0, width: 260,
              background: T.sidebar, zIndex: 400, display: "flex", flexDirection: "column",
              boxShadow: "4px 0 24px rgba(0,0,0,.3)",
            }}>
              {/* Drawer header */}
              <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid rgba(255,255,255,.08)",
                display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, background: T.brand, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⛪</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>ChurchTrakr</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Admin Console</div>
                </div>
                <button onClick={() => setSideOpen(false)} style={{
                  marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,.4)",
                  fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 4,
                }}>✕</button>
              </div>

              {/* Nav items */}
              <div style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
                {NAV.map(n => (
                  <button key={n.key} onClick={() => { setTab(n.key); setSideOpen(false); }} style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                    borderRadius: 10, border: "none", cursor: "pointer",
                    background: tab === n.key ? "rgba(59,130,246,.2)" : "transparent",
                    color: tab === n.key ? "#60a5fa" : "rgba(255,255,255,.65)",
                    fontWeight: tab === n.key ? 700 : 500, fontSize: 14,
                    fontFamily: "'DM Sans',sans-serif", marginBottom: 2, textAlign: "left",
                  }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
                    <span style={{ flex: 1 }}>{n.label}</span>
                    {n.badge != null && (
                      <span style={{ background: n.badgeColor || T.brand, color: "#fff",
                        fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 20 }}>{n.badge}</span>
                    )}
                  </button>
                ))}
              </div>

              <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.08)",
                fontSize: 11, color: "rgba(255,255,255,.3)" }}>{user.email}</div>
            </div>
          </>
        )}

        {/* Content */}
        <div style={{ padding: 16 }}>
          {loading ? <div style={{ textAlign: "center", padding: 60, color: T.muted }}>Loading…</div>
            : tab === "overview"  ? <Overview      churches={churches} requests={requests} usageLogs={usageLogs} />
            : tab === "churches"  ? <Churches      churches={churches} setChurches={setChurches} usageLogs={usageLogs} showToast={showToast} />
            : tab === "credits"   ? <AddCredits    churches={churches} setChurches={setChurches} showToast={showToast} />
            : tab === "senderids" ? <SenderIDs     requests={requests} setRequests={setRequests} churches={churches} setChurches={setChurches} showToast={showToast} />
            : tab === "usage"     ? <Usage         usageLogs={usageLogs} churches={churches} />
            :                       <SupportMessages showToast={showToast} />
          }
        </div>

        {toast && (
          <div style={{ position:"fixed", bottom:20, left:"50%", transform:"translateX(-50%)",
            background:T.text, color:"#fff", padding:"12px 20px", borderRadius:12,
            fontSize:14, fontWeight:500, zIndex:9999, whiteSpace:"nowrap",
            boxShadow:"0 8px 30px rgba(0,0,0,.25)" }}>{toast}</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans',sans-serif", color: T.text }}>

      {/* ── Sidebar ── */}
      <div style={{ width: sideOpen ? 220 : 64, flexShrink: 0, background: T.sidebar,
        display: "flex", flexDirection: "column", transition: "width .2s", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: "22px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.08)",
          display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: T.brand, borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⛪</div>
          {sideOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>ChurchTrakr</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Admin Console</div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
              borderRadius: 10, border: "none", cursor: "pointer",
              background: tab === n.key ? "rgba(59,130,246,.2)" : "transparent",
              color: tab === n.key ? "#60a5fa" : "rgba(255,255,255,.55)",
              fontWeight: tab === n.key ? 700 : 500, fontSize: 13,
              fontFamily: "'DM Sans',sans-serif", marginBottom: 2, transition: "all .12s", textAlign: "left",
            }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && (
                <>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.label}</span>
                  {n.badge != null && (
                    <span style={{ background: n.badgeColor || T.brand, color: "#fff", fontSize: 10,
                      fontWeight: 800, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{n.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => setSideOpen(v => !v)} style={{ width: "100%", padding: "8px 10px",
            borderRadius: 10, border: "none", cursor: "pointer", background: "transparent",
            color: "rgba(255,255,255,.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, textAlign: "left" }}>
            {sideOpen ? "← Collapse" : "→"}
          </button>
          {sideOpen && <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", padding: "4px 10px 0" }}>{user.email}</div>}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px",
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{NAV.find(n => n.key === tab)?.label || ""}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btn("#f1f5f9", T.muted, "7px 14px")} onClick={loadAll}>↻ Refresh</button>
            <button style={btn("#fee2e2", T.red, "7px 14px")} onClick={onLogout}>Sign Out</button>
          </div>
        </div>

        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: T.muted }}>Loading…</div>
          ) : tab === "overview"  ? <Overview      churches={churches} requests={requests} usageLogs={usageLogs} />
            : tab === "churches"  ? <Churches      churches={churches} setChurches={setChurches} usageLogs={usageLogs} showToast={showToast} />
            : tab === "credits"   ? <AddCredits    churches={churches} setChurches={setChurches} showToast={showToast} />
            : tab === "senderids" ? <SenderIDs     requests={requests} setRequests={setRequests} churches={churches} setChurches={setChurches} showToast={showToast} />
            : tab === "usage"     ? <Usage         usageLogs={usageLogs} churches={churches} />
            :                       <SupportMessages showToast={showToast} />
          }
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: T.text, color: "#fff", padding: "12px 22px", borderRadius: 12,
          fontSize: 14, fontWeight: 500, zIndex: 9999, whiteSpace: "nowrap",
          boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>{toast}</div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function SuperAdmin() {
  const [user,     setUser]     = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === SUPER_ADMIN_EMAIL) setUser(session.user);
      setChecking(false);
    });
  }, []);

  if (checking) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: T.muted }}>Loading…</div>
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;
  return <AdminDashboard user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); }} />;
}