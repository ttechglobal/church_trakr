// src/pages/SuperAdmin.jsx
// ChurchTrackr Super Admin — completely separate from the church app
// Access: /superadmin  (private URL, not linked anywhere in the app)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const SUPER_ADMIN_EMAIL = "admin@churchtrackr.com";

// ─── Design tokens ────────────────────────────────────────────────────────────
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

const inp = {
  width: "100%", background: "#f8fafc", border: `1.5px solid ${T.border}`,
  borderRadius: 10, padding: "10px 14px", color: T.text, fontSize: 14,
  fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box",
};

const btn = (bg, col = "#fff", pad = "9px 18px") => ({
  background: bg, border: "none", color: col, borderRadius: 8,
  padding: pad, cursor: "pointer", fontSize: 13, fontWeight: 600,
  fontFamily: "'DM Sans',sans-serif", transition: "opacity .15s", display: "inline-flex", alignItems: "center", gap: 6,
});

function Badge({ status }) {
  const map = {
    pending:  { bg: "#fef3c7", color: "#92400e", label: "Pending"  },
    approved: { bg: "#dcfce7", color: "#166534", label: "Approved" },
    rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
  };
  const s = map[status] || { bg: "#f1f5f9", color: T.muted, label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700,
      padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>{sub}</div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 28, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ModalWrap({ children, onClose, title }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.6)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.card, borderRadius: 18, padding: "26px 24px", width: "100%",
        maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.25)", border: `1px solid ${T.border}` }}>
        {title && <div style={{ fontWeight: 800, fontSize: 17, color: T.text, marginBottom: 20 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ churches, requests, usageLogs }) {
  const totalCredits = churches.reduce((s, c) => s + (c.sms_credits || 0), 0);
  const pending      = requests.filter(r => r.status === "pending").length;
  const thisMonth    = churches.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at), now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalSms = usageLogs.reduce((s, l) => s + (l.recipient_count || 0), 0);

  const recent = [...churches].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard icon="⛪" label="Total Churches"  value={churches.length} color={T.brand} sub="registered" />
        <StatCard icon="✨" label="New This Month"  value={thisMonth}       color={T.green} sub="joined" />
        <StatCard icon="⏳" label="Pending Sender IDs" value={pending}     color={pending > 0 ? T.yellow : T.green} sub={pending > 0 ? "need action" : "all clear"} />
        <StatCard icon="💬" label="SMS Sent (All Time)" value={totalSms.toLocaleString()} color={T.purple} sub="messages" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* Recent churches */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>
            Recently Joined Churches
          </div>
          {recent.map((c, i) => (
            <div key={c.id} style={{ padding: "12px 20px", borderBottom: i < recent.length-1 ? `1px solid ${T.border}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⛪</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || "Unnamed"}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{c.admin_name || "—"}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontWeight: 700, color: (c.sms_credits||0) < 50 ? T.red : T.green, fontSize: 15 }}>{(c.sms_credits||0).toLocaleString()}</div>
                <div style={{ fontSize: 11, color: T.muted }}>credits</div>
              </div>
            </div>
          ))}
        </div>

        {/* Pending sender IDs */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            Pending Sender IDs
            {pending > 0 && <span style={{ background: T.yellow, color: "#fff", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{pending}</span>}
          </div>
          {requests.filter(r => r.status === "pending").length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>✅ No pending requests</div>
          ) : (
            requests.filter(r => r.status === "pending").slice(0, 5).map((req, i, arr) => (
              <div key={req.id} style={{ padding: "12px 20px", borderBottom: i < arr.length-1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, marginBottom: 2 }}>{req.sender_id}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{req.churches?.name || "Unknown church"}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Churches ─────────────────────────────────────────────────────────────────
function Churches({ churches, setChurches, showToast }) {
  const [search,   setSearch]   = useState("");
  const [editC,    setEditC]    = useState(null);
  const [newCreds, setNewCreds] = useState("");
  const [resetC,   setResetC]   = useState(null);
  const [saving,   setSaving]   = useState(false);

  const filtered = churches.filter(c =>
    [c.name, c.admin_name, c.phone, c.location].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const saveCredits = async () => {
    const n = parseInt(newCreds);
    if (isNaN(n) || n < 0) { showToast("Enter a valid number"); return; }
    setSaving(true);
    const { error } = await supabase.from("churches").update({ sms_credits: n }).eq("id", editC.id);
    setSaving(false);
    if (error) { showToast("Failed to update credits ❌"); return; }
    setChurches(cs => cs.map(c => c.id === editC.id ? { ...c, sms_credits: n } : c));
    showToast(`✅ Credits set to ${n.toLocaleString()} for ${editC.name}`);
    setEditC(null); setNewCreds("");
  };

  const sendPasswordReset = async () => {
    if (!resetC?.email) { showToast("No email found for this church"); return; }
    setSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetC.email, { redirectTo: `${window.location.origin}/login` });
    setSaving(false);
    if (error) { showToast(`Failed: ${error.message} ❌`); return; }
    showToast(`✅ Password reset email sent to ${resetC.email}`);
    setResetC(null);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center" }}>
        <input style={{ ...inp, flex: 1 }} value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${churches.length} churches…`} />
        <div style={{ fontSize: 13, color: T.muted, whiteSpace: "nowrap" }}>{filtered.length} shown</div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No churches found</div>
        ) : filtered.map((c, i) => (
          <div key={c.id} style={{ padding: "14px 20px", borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⛪</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{c.name || "Unnamed"}</div>
              <div style={{ fontSize: 12, color: T.muted, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {c.admin_name && <span>👤 {c.admin_name}</span>}
                {c.phone      && <span>📞 {c.phone}</span>}
                {c.location   && <span>📍 {c.location}</span>}
              </div>
              <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>
                Sender: <strong style={{ color: c.sms_sender_id_status === "approved" ? T.green : T.dim }}>
                  {c.sms_sender_id || "ChurchTrakr (default)"}
                </strong>
                {c.sms_sender_id_status && <> · <Badge status={c.sms_sender_id_status} /></>}
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0, minWidth: 64 }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: (c.sms_credits||0) < 50 ? T.red : T.green }}>{(c.sms_credits||0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: T.muted }}>credits</div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button style={btn("#eff6ff", T.brand, "7px 12px")} onClick={() => { setEditC(c); setNewCreds(String(c.sms_credits || 0)); }}>
                💳 Credits
              </button>
              <button style={btn("#f8fafc", T.muted, "7px 12px")} onClick={() => setResetC(c)}>
                🔑 Reset PW
              </button>
            </div>
          </div>
        ))}
      </div>

      {editC && (
        <ModalWrap onClose={() => { setEditC(null); setNewCreds(""); }} title={`Update Credits — ${editC.name}`}>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 6 }}>Current: <strong>{(editC.sms_credits||0).toLocaleString()}</strong> credits</div>
          <input type="number" min="0" value={newCreds} onChange={e => setNewCreds(e.target.value)}
            style={{ ...inp, fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 8 }} />
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginBottom: 16 }}>
            = {Math.floor((parseInt(newCreds)||0)/10).toLocaleString()} SMS messages
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 20 }}>
            {[100, 500, 1000, 5000].map(n => (
              <button key={n} style={{ ...btn("#eff6ff", T.brand, "9px 4px"), justifyContent: "center", fontSize: 12, width: "100%" }}
                onClick={() => setNewCreds(String((parseInt(newCreds)||0)+n))}>+{n}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...btn("#f1f5f9", T.muted, "12px"), flex: 1, justifyContent: "center" }} onClick={() => { setEditC(null); setNewCreds(""); }}>Cancel</button>
            <button style={{ ...btn(T.brand, "#fff", "12px"), flex: 1, justifyContent: "center" }} onClick={saveCredits} disabled={saving}>{saving ? "Saving…" : "Save Credits"}</button>
          </div>
        </ModalWrap>
      )}

      {resetC && (
        <ModalWrap onClose={() => setResetC(null)} title={`Send Password Reset — ${resetC.name}`}>
          <div style={{ background: "#f8fafc", border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Reset email will be sent to:</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{resetC.email || "No email on record"}</div>
          </div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>
            This sends a password reset link to the church admin's email address.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...btn("#f1f5f9", T.muted, "12px"), flex: 1, justifyContent: "center" }} onClick={() => setResetC(null)}>Cancel</button>
            <button style={{ ...btn(T.brand, "#fff", "12px"), flex: 1, justifyContent: "center" }} onClick={sendPasswordReset} disabled={saving || !resetC?.email}>
              {saving ? "Sending…" : "Send Reset Email"}
            </button>
          </div>
        </ModalWrap>
      )}
    </div>
  );
}

// ─── Add Credits (dedicated tab) ──────────────────────────────────────────────
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
    showToast(`✅ Added ${n.toLocaleString()} credits to ${selected.name} (now ${newTotal.toLocaleString()})`);
    setAmount("");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20, alignItems: "flex-start" }}>
      {/* Church selector */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: T.text }}>1. Select Church</div>
        <input style={{ ...inp, marginBottom: 12 }} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search churches…" />
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", maxHeight: 500, overflowY: "auto" }}>
          {filtered.map((c, i) => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{ padding: "13px 16px", borderBottom: i < filtered.length-1 ? `1px solid ${T.border}` : "none",
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                background: selected?.id === c.id ? "#eff6ff" : "transparent",
                borderLeft: `3px solid ${selected?.id === c.id ? T.brand : "transparent"}` }}>
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

      {/* Credit entry */}
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: "22px 20px", position: "sticky", top: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>2. Add Credits</div>
        {selected ? (
          <div style={{ background: "#eff6ff", border: `1px solid #bfdbfe`, borderRadius: 12, padding: "12px 14px", marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.brand }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>Current balance: <strong style={{ color: T.text }}>{(selected.sms_credits||0).toLocaleString()} credits</strong></div>
          </div>
        ) : (
          <div style={{ background: "#f8fafc", border: `1px dashed ${T.border}`, borderRadius: 12, padding: "16px 14px", marginBottom: 18, textAlign: "center", color: T.muted, fontSize: 13 }}>
            ← Select a church first
          </div>
        )}

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.muted, display: "block", marginBottom: 6 }}>Credits to add</label>
          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
            style={{ ...inp, fontSize: 26, fontWeight: 800, textAlign: "center" }} placeholder="0" />
          {amount && parseInt(amount) > 0 && (
            <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginTop: 6 }}>
              = {Math.floor(parseInt(amount)/10).toLocaleString()} SMS messages
            </div>
          )}
        </div>

        {/* Quick amounts */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 18 }}>
          {[100, 500, 1000, 5000].map(n => (
            <button key={n} style={{ ...btn("#eff6ff", T.brand, "9px 4px"), justifyContent: "center", width: "100%", fontSize: 12 }}
              onClick={() => setAmount(String((parseInt(amount)||0)+n))}>+{n}</button>
          ))}
        </div>

        {selected && amount && parseInt(amount) > 0 && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16, color: "#15803d" }}>
            New balance: <strong>{((selected.sms_credits||0) + parseInt(amount)).toLocaleString()}</strong> credits
          </div>
        )}

        <button style={{ ...btn(T.brand, "#fff", "13px 20px"), width: "100%", justifyContent: "center", opacity: (!selected || !amount || parseInt(amount) <= 0) ? .4 : 1 }}
          onClick={handleAdd} disabled={saving || !selected || !amount || parseInt(amount) <= 0}>
          {saving ? "Adding…" : "✅ Add Credits"}
        </button>
      </div>
    </div>
  );
}

// ─── Sender ID Requests ────────────────────────────────────────────────────────
function SenderIDs({ requests, setRequests, churches, setChurches, showToast }) {
  const [filter,  setFilter]  = useState("pending");
  const [saving,  setSaving]  = useState(null); // request id being saved
  const [copied,  setCopied]  = useState(null);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const approve = async (req) => {
    setSaving(req.id);
    const [r1, r2] = await Promise.all([
      supabase.from("sender_id_requests").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", req.id),
      supabase.from("churches").update({ sms_sender_id: req.sender_id, sms_sender_id_status: "approved" }).eq("id", req.church_id),
    ]);
    setSaving(null);
    if (r1.error || r2.error) { showToast("Error — check Supabase ❌"); return; }
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "approved", reviewed_at: new Date().toISOString() } : r));
    setChurches(cs => cs.map(c => c.id === req.church_id ? { ...c, sms_sender_id: req.sender_id, sms_sender_id_status: "approved" } : c));
    showToast(`✅ "${req.sender_id}" approved for ${req.churches?.name}`);
  };

  const reject = async (req) => {
    setSaving(req.id);
    const { error } = await supabase.from("sender_id_requests").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", req.id);
    setSaving(null);
    if (error) { showToast("Error ❌"); return; }
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    showToast(`Rejected "${req.sender_id}"`);
  };

  const shown = filter === "pending" ? requests.filter(r => r.status === "pending") : requests;
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div>
      {/* Workflow banner */}
      <div style={{ background: "#eff6ff", border: `1px solid #bfdbfe`, borderRadius: 14, padding: "16px 18px", marginBottom: 20, lineHeight: 1.7, fontSize: 13, color: "#1e40af" }}>
        <strong>📋 Workflow:</strong> A church submits a sender ID request →
        Copy the ID below → Go to <a href="https://app.termii.com" target="_blank" rel="noreferrer" style={{ color: T.brand }}>app.termii.com</a> →
        Request it from Termii (24–48 hrs) → Come back here and click Approve once Termii confirms.
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["pending", `Pending${pendingCount > 0 ? ` (${pendingCount})` : ""}`], ["all", "All Requests"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            ...btn(filter === k ? T.brand : "#f8fafc", filter === k ? "#fff" : T.muted, "8px 18px"),
            border: `1px solid ${filter === k ? T.brand : T.border}`,
          }}>{l}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 48, textAlign: "center", color: T.muted }}>
          {filter === "pending" ? "✅ No pending requests!" : "No requests yet"}
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          {shown.map((req, i) => (
            <div key={req.id} style={{ padding: "16px 20px", borderBottom: i < shown.length-1 ? `1px solid ${T.border}` : "none", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 18, fontFamily: "'Playfair Display',serif" }}>{req.sender_id}</span>
                  <Badge status={req.status} />
                  <button onClick={() => copy(req.sender_id, req.id)}
                    style={{ ...btn("#f8fafc", T.muted, "3px 10px"), fontSize: 11, border: `1px solid ${T.border}` }}>
                    {copied === req.id ? "✓ Copied!" : "📋 Copy"}
                  </button>
                </div>
                <div style={{ fontSize: 13, color: T.muted }}>
                  {req.churches?.name || "Unknown"} · {req.churches?.admin_name || ""} {req.churches?.phone ? `· ${req.churches.phone}` : ""}
                </div>
                <div style={{ fontSize: 11, color: T.dim, marginTop: 3 }}>
                  Requested {req.created_at ? new Date(req.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                  {req.reviewed_at ? ` · Reviewed ${new Date(req.reviewed_at).toLocaleDateString("en-NG", { day:"numeric", month:"short" })}` : ""}
                </div>
              </div>
              {req.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button style={{ ...btn("#dcfce7", T.green, "8px 14px"), border: `1px solid #bbf7d0` }} onClick={() => approve(req)} disabled={saving === req.id}>
                    {saving === req.id ? "…" : "✓ Approve"}
                  </button>
                  <button style={{ ...btn("#fee2e2", T.red, "8px 14px"), border: `1px solid #fecaca` }} onClick={() => reject(req)} disabled={saving === req.id}>
                    ✗ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Usage / Analytics ────────────────────────────────────────────────────────
function Usage({ usageLogs, churches }) {
  const [filter, setFilter] = useState("all"); // "all" | "sms" | "attendance"

  // Enrich logs with church name
  const enriched = usageLogs.map(l => ({
    ...l,
    churchName: churches.find(c => c.id === l.church_id)?.name || "Unknown",
  }));

  const shown = filter === "sms"        ? enriched.filter(l => l.event_type === "sms_sent")
              : filter === "attendance" ? enriched.filter(l => l.event_type === "attendance_saved")
              : enriched;

  const smsSessions  = enriched.filter(l => l.event_type === "sms_sent");
  const attSessions  = enriched.filter(l => l.event_type === "attendance_saved");
  const totalSmsSent = smsSessions.reduce((s, l) => s + (l.recipient_count || 0), 0);

  // Top churches by activity
  const byChurch = {};
  enriched.forEach(l => {
    if (!byChurch[l.church_id]) byChurch[l.church_id] = { name: l.churchName, sms: 0, att: 0, total: 0 };
    if (l.event_type === "sms_sent")          byChurch[l.church_id].sms += l.recipient_count || 0;
    if (l.event_type === "attendance_saved")  byChurch[l.church_id].att += 1;
    byChurch[l.church_id].total += 1;
  });
  const topChurches = Object.values(byChurch).sort((a,b) => b.total - a.total).slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard icon="📊" label="Total Events"      value={enriched.length}           color={T.brand}  sub="all time" />
        <StatCard icon="💬" label="SMS Sends"         value={smsSessions.length}        color={T.purple} sub={`${totalSmsSent.toLocaleString()} recipients`} />
        <StatCard icon="✅" label="Attendance Sessions" value={attSessions.length}      color={T.green}  sub="recorded" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18, marginBottom: 24 }}>
        {/* Activity log */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
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
          {shown.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>No events recorded yet</div>
          ) : (
            <div style={{ maxHeight: 480, overflowY: "auto" }}>
              {shown.map((l, i) => (
                <div key={l.id || i} style={{ padding: "11px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{l.event_type === "sms_sent" ? "💬" : "✅"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.churchName}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {l.event_type === "sms_sent"
                        ? `Sent SMS to ${l.recipient_count || 0} recipients`
                        : `Attendance session — ${l.recipient_count || 0} members`}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: T.dim, flexShrink: 0 }}>
                    {l.created_at ? new Date(l.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top churches */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>Most Active Churches</div>
          {topChurches.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: T.muted, fontSize: 13 }}>No data yet</div>
          ) : topChurches.map((c, i) => (
            <div key={i} style={{ padding: "12px 20px", borderBottom: i < topChurches.length-1 ? `1px solid ${T.border}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 28, height: 28, background: "#eff6ff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: T.brand, flexShrink: 0 }}>#{i+1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.muted }}>💬 {c.sms} sent · ✅ {c.att} sessions</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: T.brand }}>{c.total}</div>
            </div>
          ))}
        </div>
      </div>
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
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400, boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, background: T.brand, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⛪</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: T.text }}>ChurchTrackr</div>
            <div style={{ fontSize: 12, color: T.muted }}>Admin Console</div>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6 }}>EMAIL</label>
          <input style={inp} value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6 }}>PASSWORD</label>
          <input style={inp} value={pass} onChange={e => setPass(e.target.value)} type="password" onKeyDown={e => e.key === "Enter" && go()} />
        </div>
        {err && <div style={{ background: "#fee2e2", color: T.red, borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{err}</div>}
        <button style={{ ...btn(T.brand, "#fff", "13px"), width: "100%", justifyContent: "center", fontSize: 15 }} onClick={go} disabled={busy}>
          {busy ? "Signing in…" : "Sign In →"}
        </button>
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
  const [sideOpen,  setSideOpen]  = useState(true); // collapsible on small screens

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ch }, { data: sr }, { data: ul }] = await Promise.all([
      supabase.from("churches").select("*").order("created_at", { ascending: false }),
      supabase.from("sender_id_requests").select("*, churches(name, admin_name, phone)").order("created_at", { ascending: false }),
      supabase.from("usage_logs").select("*").order("created_at", { ascending: false }).limit(500),
    ]);
    if (ch) setChurches(ch);
    if (sr) setRequests(sr);
    if (ul) setUsageLogs(ul);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Real-time updates
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
    { key: "overview",   icon: "📊", label: "Overview" },
    { key: "churches",   icon: "⛪", label: "Churches",   badge: churches.length },
    { key: "credits",    icon: "💳", label: "Add Credits" },
    { key: "senderids",  icon: "🔖", label: "Sender IDs",  badge: pending > 0 ? pending : null, badgeColor: T.yellow },
    { key: "usage",      icon: "📈", label: "Usage",        badge: usageLogs.length > 0 ? usageLogs.length : null, badgeColor: T.purple },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: "'DM Sans', sans-serif", color: T.text }}>
      {/* ── Sidebar ── */}
      <div style={{ width: sideOpen ? 220 : 64, flexShrink: 0, background: T.sidebar, display: "flex", flexDirection: "column", transition: "width .2s", overflow: "hidden" }}>
        {/* Logo */}
        <div style={{ padding: "22px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: T.brand, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>⛪</div>
          {sideOpen && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>ChurchTrackr</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Admin Console</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "12px 8px" }}>
          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", borderRadius: 10, border: "none", cursor: "pointer",
                background: tab === n.key ? "rgba(59,130,246,.2)" : "transparent",
                color: tab === n.key ? "#60a5fa" : "rgba(255,255,255,.55)",
                fontWeight: tab === n.key ? 700 : 500, fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                marginBottom: 2, transition: "all .12s", textAlign: "left" }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && (
                <>
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.label}</span>
                  {n.badge != null && (
                    <span style={{ background: n.badgeColor || T.brand, color: "#fff", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 20, flexShrink: 0 }}>{n.badge}</span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <button onClick={() => setSideOpen(v => !v)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,.4)", fontFamily: "'DM Sans',sans-serif", fontSize: 12, textAlign: "left" }}>
            {sideOpen ? "← Collapse" : "→"}
          </button>
          {sideOpen && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", padding: "4px 10px 0" }}>{user.email}</div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text }}>
            {NAV.find(n => n.key === tab)?.label || ""}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={btn("#f1f5f9", T.muted, "7px 14px")} onClick={loadAll}>↻ Refresh</button>
            <button style={btn("#fee2e2", T.red, "7px 14px")} onClick={onLogout}>Sign Out</button>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto", maxWidth: 1100 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 80, color: T.muted }}>Loading…</div>
          ) : tab === "overview"  ? <Overview   churches={churches} requests={requests} usageLogs={usageLogs} />
            : tab === "churches"  ? <Churches   churches={churches} setChurches={setChurches} showToast={showToast} />
            : tab === "credits"   ? <AddCredits churches={churches} setChurches={setChurches} showToast={showToast} />
            : tab === "senderids" ? <SenderIDs  requests={requests} setRequests={setRequests} churches={churches} setChurches={setChurches} showToast={showToast} />
            :                       <Usage      usageLogs={usageLogs} churches={churches} />
          }
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
          background: T.text, color: "#fff", padding: "12px 22px", borderRadius: 12,
          fontSize: 14, fontWeight: 500, zIndex: 9999, whiteSpace: "nowrap",
          boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>
          {toast}
        </div>
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