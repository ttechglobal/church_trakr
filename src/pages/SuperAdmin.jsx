// src/pages/SuperAdmin.jsx
// ChurchTrackr Super Admin — completely separate from the church app
// Access: /superadmin  (private URL, not linked anywhere in the app)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";

const SUPER_ADMIN_EMAIL = "admin@churchtrackr.com";

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens — dark professional, nothing like the church UI
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  bg:      "#080f17",
  surface: "#111b27",
  card:    "#162236",
  border:  "#1e3147",
  text:    "#e2e8f0",
  muted:   "#64748b",
  dim:     "#94a3b8",
  brand:   "#3b82f6",
  green:   "#22c55e",
  yellow:  "#f59e0b",
  red:     "#ef4444",
};

const css = {
  page:   { minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans', sans-serif" },
  input:  { width: "100%", background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 10,
            padding: "11px 14px", color: T.text, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
            outline: "none", boxSizing: "border-box" },
  btn:    (bg, col="#fff", pad="9px 18px") => ({
            background: bg, border: "none", color: col, borderRadius: 8,
            padding: pad, cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans',sans-serif", transition: "opacity .15s" }),
  card:   (extra={}) => ({ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden", ...extra }),
  row:    (last) => ({ padding: "13px 20px", borderBottom: last ? "none" : `1px solid ${T.border}`,
                       display: "flex", alignItems: "center", gap: 14 }),
  badge:  (color, bg) => ({ background: bg, color, fontSize: 11, fontWeight: 700,
                             padding: "3px 9px", borderRadius: 20, textTransform: "capitalize", whiteSpace: "nowrap" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function Badge({ s }) {
  const map = {
    pending:  [T.yellow, "#2d1f00"],
    approved: [T.green,  "#0a2a14"],
    rejected: [T.red,    "#2a0a0a"],
    active:   [T.green,  "#0a2a14"],
    free:     [T.dim,    T.surface],
  };
  const [color, bg] = map[s] || [T.dim, T.surface];
  return <span style={css.badge(color, bg)}>{s}</span>;
}

function Stat({ label, value, color, sub }) {
  return (
    <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, padding: "20px 22px" }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: color || T.brand }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr]           = useState("");
  const [busy, setBusy]         = useState(false);

  const go = async () => {
    setErr("");
    if (!email || !password) { setErr("Email and password required"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (data?.user?.email !== SUPER_ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setErr("Access denied");
      return;
    }
    onLogin(data.user);
  };

  return (
    <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: T.brand, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⛪</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text }}>ChurchTrackr</div>
            <div style={{ fontSize: 11, color: T.muted }}>Admin Console</div>
          </div>
        </div>
        <div style={{ height: 1, background: T.border, margin: "20px 0" }} />
        {[["Email", "email", email, setEmail], ["Password", "password", password, setPassword]].map(([label, type, val, set]) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.dim, display: "block", marginBottom: 6 }}>{label}</label>
            <input style={css.input} type={type} value={val} onChange={e => set(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()} placeholder={type === "email" ? "admin@churchtrackr.com" : "••••••••"} />
          </div>
        ))}
        {err && <div style={{ background: "#2a0a0a", color: T.red, borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div>}
        <button style={{ ...css.btn(T.brand), width: "100%", padding: "13px", fontSize: 15, borderRadius: 10, marginTop: 4 }}
          onClick={go} disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview tab
// ─────────────────────────────────────────────────────────────────────────────
function Overview({ churches, requests }) {
  const totalCredits   = churches.reduce((s, c) => s + (c.sms_credits || 0), 0);
  const pending        = requests.filter(r => r.status === "pending").length;
  const thisMonth      = churches.filter(c => {
    if (!c.created_at) return false;
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recent = [...churches]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        <Stat label="Total Churches"   value={churches.length}              color={T.brand} />
        <Stat label="New This Month"   value={thisMonth}                    color={T.green} />
        <Stat label="Pending IDs"      value={pending} color={pending > 0 ? T.yellow : T.green}
              sub={pending > 0 ? "Need manual approval" : "All clear"} />
        <Stat label="Total Credits"    value={totalCredits.toLocaleString()} color="#a78bfa"
              sub={`~${Math.floor(totalCredits/5).toLocaleString()} SMS remaining`} />
      </div>

      <div style={{ ...css.card(), marginBottom: 24 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 14 }}>
          Recently Joined Churches
        </div>
        {recent.map((c, i) => (
          <div key={c.id} style={css.row(i === recent.length - 1)}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⛪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name || "Unnamed"}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{c.admin_name || "—"} {c.phone ? `· ${c.phone}` : ""}</div>
            </div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {c.created_at ? new Date(c.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, color: T.green }}>{(c.sms_credits || 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: T.muted }}>credits</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Churches tab
// ─────────────────────────────────────────────────────────────────────────────
function Churches({ churches, setChurches, showToast }) {
  const [search,    setSearch]    = useState("");
  const [editC,     setEditC]     = useState(null); // credit edit
  const [newCreds,  setNewCreds]  = useState("");
  const [resetC,    setResetC]    = useState(null); // password reset
  const [newPass,   setNewPass]   = useState("");
  const [saving,    setSaving]    = useState(false);

  const filtered = churches.filter(c =>
    [c.name, c.admin_name, c.phone, c.location].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Add / set credits ────────────────────────────────────────────────────
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

  // ── Password reset (sends reset email via Supabase) ──────────────────────
  const sendPasswordReset = async () => {
    if (!resetC?.email) { showToast("No email found for this church"); return; }
    setSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetC.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setSaving(false);
    if (error) { showToast(`Failed: ${error.message} ❌`); return; }
    showToast(`✅ Password reset email sent to ${resetC.email}`);
    setResetC(null);
  };

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: T.muted }}>🔍</span>
        <input style={{ ...css.input, paddingLeft: 42 }} value={search}
          onChange={e => setSearch(e.target.value)} placeholder={`Search ${churches.length} churches…`} />
      </div>

      <div style={css.card()}>
        {filtered.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No churches found</div>
          : filtered.map((c, i) => (
            <div key={c.id} style={css.row(i === filtered.length - 1)}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⛪</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name || "Unnamed"}</div>
                <div style={{ fontSize: 12, color: T.dim, marginTop: 2, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {c.admin_name && <span>👤 {c.admin_name}</span>}
                  {c.phone      && <span>📞 {c.phone}</span>}
                  {c.location   && <span>📍 {c.location}</span>}
                </div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                  Sender: <strong style={{ color: c.sms_sender_id_status === "approved" ? T.green : T.dim }}>
                    {c.sms_sender_id || "ChurchTrackr"}
                  </strong>
                  {c.sms_sender_id_status ? ` · ` : ""}
                  {c.sms_sender_id_status && <Badge s={c.sms_sender_id_status} />}
                  <span style={{ marginLeft: 10 }}>Joined: {c.created_at ? new Date(c.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" }) : "—"}</span>
                </div>
              </div>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: (c.sms_credits||0) < 50 ? T.red : T.green }}>
                  {(c.sms_credits||0).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>credits</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button style={css.btn("#1e3a5f", "#60a5fa", "7px 12px")}
                  onClick={() => { setEditC(c); setNewCreds(String(c.sms_credits || 0)); }}>
                  💳 Credits
                </button>
                <button style={css.btn(T.surface, T.dim, "7px 12px")}
                  onClick={() => setResetC(c)}>
                  🔑 Reset PW
                </button>
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Credits modal ── */}
      {editC && (
        <Modal onClose={() => { setEditC(null); setNewCreds(""); }}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Update Credits</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>{editC.name}</div>
          <input type="number" min="0" value={newCreds} onChange={e => setNewCreds(e.target.value)}
            style={{ ...css.input, fontSize: 26, fontWeight: 700, textAlign: "center", marginBottom: 6 }} />
          <div style={{ fontSize: 12, color: T.muted, textAlign: "center", marginBottom: 18 }}>
            ~{Math.floor((parseInt(newCreds)||0)/5).toLocaleString()} SMS messages
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[100, 500, 1000, 5000].map(n => (
              <button key={n} style={{ ...css.btn("#1e3a5f","#60a5fa","8px 4px"), flex: 1, fontSize: 12 }}
                onClick={() => setNewCreds(String((parseInt(newCreds)||0)+n))}>+{n}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...css.btn(T.surface, T.muted, "12px"), flex: 1 }}
              onClick={() => { setEditC(null); setNewCreds(""); }}>Cancel</button>
            <button style={{ ...css.btn(T.brand, "#fff", "12px"), flex: 1, fontSize: 14 }}
              onClick={saveCredits} disabled={saving}>{saving ? "Saving…" : "Save Credits"}</button>
          </div>
        </Modal>
      )}

      {/* ── Password reset modal ── */}
      {resetC && (
        <Modal onClose={() => setResetC(null)}>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>Send Password Reset</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 20 }}>{resetC.name}</div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Reset email will be sent to:</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{resetC.email || "No email on record"}</div>
          </div>
          <p style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>
            This sends a password reset link to the church admin's email. They'll click the link and set a new password.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...css.btn(T.surface, T.muted, "12px"), flex: 1 }}
              onClick={() => setResetC(null)}>Cancel</button>
            <button style={{ ...css.btn(T.brand, "#fff", "12px"), flex: 1 }}
              onClick={sendPasswordReset} disabled={saving || !resetC?.email}>
              {saving ? "Sending…" : "Send Reset Email"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sender ID Requests tab
// ─────────────────────────────────────────────────────────────────────────────
function SenderIDRequests({ requests, setRequests, churches, setChurches, showToast }) {
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("pending"); // "pending" | "all"

  const approve = async (req) => {
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from("sender_id_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", req.id),
      supabase.from("churches")
        .update({ sms_sender_id: req.sender_id, sms_sender_id_status: "approved" })
        .eq("id", req.church_id),
    ]);
    setSaving(false);
    if (r1.error || r2.error) { showToast("Error — check Supabase ❌"); return; }
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
    setChurches(cs => cs.map(c => c.id === req.church_id
      ? { ...c, sms_sender_id: req.sender_id, sms_sender_id_status: "approved" } : c));
    showToast(`✅ "${req.sender_id}" approved for ${req.churches?.name}`);
  };

  const reject = async (req) => {
    setSaving(true);
    const { error } = await supabase.from("sender_id_requests")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", req.id);
    setSaving(false);
    if (error) { showToast("Error ❌"); return; }
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    showToast(`Rejected "${req.sender_id}"`);
  };

  const shown = filter === "pending" ? requests.filter(r => r.status === "pending") : requests;

  return (
    <div>
      {/* Info banner */}
      <div style={{ background: "#0a1e33", border: `1px solid #1e3a5f`, borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: T.dim, lineHeight: 1.7 }}>
        <strong style={{ color: T.brand }}>Manual process:</strong> When you approve a request here, go to{" "}
        <a href="https://app.termii.com" target="_blank" rel="noreferrer" style={{ color: T.brand }}>app.termii.com</a>{" "}
        → Sender IDs → Request Sender ID and submit it there. Termii takes 24–48 hrs. Tell the church to expect 4–6 days total.
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["pending", "Pending"], ["all", "All Requests"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            ...css.btn(filter === k ? T.brand : T.surface, filter === k ? "#fff" : T.muted, "8px 18px"),
            border: `1px solid ${filter === k ? T.brand : T.border}`,
          }}>{l}</button>
        ))}
      </div>

      {shown.length === 0
        ? <div style={{ ...css.card(), padding: 40, textAlign: "center", color: T.muted }}>
            {filter === "pending" ? "No pending requests 🎉" : "No requests yet"}
          </div>
        : <div style={css.card()}>
            {shown.map((req, i) => (
              <div key={req.id} style={css.row(i === shown.length - 1)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18 }}>{req.sender_id}</span>
                    <Badge s={req.status} />
                  </div>
                  <div style={{ fontSize: 13, color: T.dim }}>
                    {req.churches?.name || "Unknown"} · {req.churches?.admin_name || ""} · {req.churches?.phone || ""}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>
                    Requested {req.created_at ? new Date(req.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—"}
                    {req.reviewed_at ? ` · Reviewed ${new Date(req.reviewed_at).toLocaleDateString("en-NG", { day:"numeric", month:"short" })}` : ""}
                  </div>
                </div>
                {req.status === "pending" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={css.btn("#0a2a14", T.green, "8px 14px")} onClick={() => approve(req)} disabled={saving}>✓ Approve</button>
                    <button style={css.btn("#2a0a0a", T.red,   "8px 14px")} onClick={() => reject(req)}  disabled={saving}>✗ Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 400 }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard shell
// ─────────────────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [tab,      setTab]      = useState("overview");
  const [churches, setChurches] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toast,    setToast]    = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [{ data: ch }, { data: sr }] = await Promise.all([
      supabase.from("churches").select("*").order("created_at", { ascending: false }),
      supabase.from("sender_id_requests")
        .select("*, churches(name, admin_name, phone)")
        .order("created_at", { ascending: false }),
    ]);
    if (ch) setChurches(ch);
    if (sr) setRequests(sr);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Real-time credit updates — churches see it immediately when admin adds credits
  useEffect(() => {
    const sub = supabase
      .channel("admin-churches")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "churches" }, (payload) => {
        setChurches(cs => cs.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const pending = requests.filter(r => r.status === "pending").length;

  const TABS = [
    { key: "overview",   label: "Overview" },
    { key: "churches",   label: `Churches (${churches.length})` },
    { key: "senderids",  label: `Sender IDs${pending > 0 ? ` · ${pending} pending` : ""}` },
  ];

  return (
    <div style={css.page}>
      {/* Top bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, background: T.brand, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⛪</div>
          <span style={{ fontWeight: 800, fontSize: 15, color: T.text }}>ChurchTrackr</span>
          <span style={{ fontSize: 12, color: T.muted, background: T.card, border: `1px solid ${T.border}`, padding: "2px 8px", borderRadius: 20 }}>Admin Console</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: T.muted }}>{user.email}</span>
          <button style={css.btn(T.surface, T.muted, "6px 14px")} onClick={loadAll}>↻</button>
          <button style={css.btn(T.surface, T.muted, "6px 14px")} onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 28px", display: "flex", gap: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? T.brand : "transparent"}`,
            color: tab === t.key ? T.brand : T.muted,
            padding: "14px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans',sans-serif", transition: "all .15s",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 24px" }}>
        {loading
          ? <div style={{ textAlign: "center", padding: 60, color: T.muted }}>Loading…</div>
          : tab === "overview"
          ? <Overview  churches={churches} requests={requests} />
          : tab === "churches"
          ? <Churches  churches={churches} setChurches={setChurches} showToast={showToast} />
          : <SenderIDRequests requests={requests} setRequests={setRequests}
              churches={churches} setChurches={setChurches} showToast={showToast} />
        }
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1e3a5f", color: "#fff", padding: "12px 22px", borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 9999, border: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root — own session management, zero dependency on app auth
// ─────────────────────────────────────────────────────────────────────────────
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
    <div style={{ ...css.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: T.muted }}>Loading…</div>
    </div>
  );

  if (!user) return <Login onLogin={setUser} />;
  return <Dashboard user={user} onLogout={async () => { await supabase.auth.signOut(); setUser(null); }} />;
}