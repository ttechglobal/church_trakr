// src/pages/Settings.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";
import { ChevR, EditIco, LogoutIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";

// ── Church Profile Modal ──────────────────────────────────────────────────────
function ChurchProfileModal({ church, onClose, onSave }) {
  const [f, setF] = useState({
    name:    church?.name     || "",
    phone:   church?.phone    || "",
    address: church?.location || church?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    if (!f.name.trim()) { setErr("Church name is required"); return; }
    setSaving(true);
    const { error } = await onSave({ name: f.name.trim(), phone: f.phone.trim(), location: f.address.trim() });
    setSaving(false);
    if (error) { setErr(error.message || "Failed to save"); return; }
    onClose();
  };

  return (
    <Modal title="Church Profile" onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Church Name</label>
          <input className="fi" name="name" value={f.name} onChange={h} placeholder="e.g. Grace Chapel" />
        </div>
        <div className="fg">
          <label className="fl">Phone Number</label>
          <input className="fi" name="phone" type="tel" value={f.phone} onChange={h} placeholder="080xxxxxxxx" />
        </div>
        <div className="fg">
          <label className="fl">Address</label>
          <input className="fi" name="address" value={f.address} onChange={h} placeholder="Church location / address" />
        </div>
        {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── SMS Settings Modal ────────────────────────────────────────────────────────
function SmsSettingsModal({ church, onClose, onSave, showToast }) {
  const [f, setF] = useState({
    senderId: church?.sms_sender_id || "",
    apiKey:   church?.sms_api_key   || "",
  });
  const [saving, setSaving] = useState(false);
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    setSaving(true);
    const { error } = await onSave({ sms_sender_id: f.senderId, sms_api_key: f.apiKey });
    setSaving(false);
    if (error) { showToast("Failed to save SMS settings ❌"); return; }
    showToast("SMS settings saved ✅");
    onClose();
  };

  return (
    <Modal title="SMS Settings" onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Sender ID</label>
          <input className="fi" name="senderId" value={f.senderId} onChange={h} placeholder="Your SMS sender name" />
          <p className="fh">The name recipients see when they get your SMS</p>
        </div>
        <div className="fg">
          <label className="fl">API Key</label>
          <input className="fi" name="apiKey" type="password" value={f.apiKey} onChange={h} placeholder="Your SMS provider API key" />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────────
function ChangePasswordModal({ onClose, showToast }) {
  const [f,      setF]     = useState({ next: "", confirm: "" });
  const [err,    setErr]   = useState("");
  const [saving, setSaving] = useState(false);
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    setErr("");
    if (f.next.length < 6)    { setErr("New password must be at least 6 characters"); return; }
    if (f.next !== f.confirm)  { setErr("Passwords do not match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: f.next });
    setSaving(false);
    if (error) { setErr(error.message || "Failed to update password"); return; }
    showToast("Password updated ✅");
    onClose();
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">New Password</label>
          <input className="fi" name="next" type="password" value={f.next} onChange={h} placeholder="At least 6 characters" />
        </div>
        <div className="fg">
          <label className="fl">Confirm New Password</label>
          <input className="fi" name="confirm" type="password" value={f.confirm} onChange={h} placeholder="Repeat new password" />
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          You are already signed in — no need to enter your current password.
        </p>
        {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>
            {saving ? "Updating…" : "Update"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────────
export default function Settings({ showToast }) {
  const { signOut, church, user, updateChurch } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // "profile" | "sms" | "password"

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const handleSaveChurch = async (updates) => {
    const { error } = await updateChurch(updates);
    if (!error) showToast("Church profile saved ✅");
    return { error };
  };

  return (
    <div className="page">
      <div className="ph"><h1>Settings</h1><p>Manage your church account</p></div>
      <div className="pc">

        {/* ── Church card ── */}
        <div className="card" style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 16, padding: "20px 16px" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>⛪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{church?.name ?? "My Church"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{church?.location || church?.address || "No address set"}</div>
          </div>
          <button className="bico" onClick={() => setModal("profile")} aria-label="Edit profile">
            <EditIco />
          </button>
        </div>

        {/* ── CHURCH section ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, paddingLeft: 4 }}>CHURCH</div>
        <div className="stsec" style={{ marginBottom: 20 }}>
          <div className="strow" onClick={() => setModal("profile")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#d4f1e4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏛️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Church Profile</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Name, phone number, address</div>
              </div>
            </div>
            <ChevR />
          </div>
          <div className="strow" onClick={() => setModal("sms")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#cce8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>SMS Settings</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Sender ID and API key</div>
              </div>
            </div>
            <ChevR />
          </div>
        </div>

        {/* ── ACCOUNT section ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, paddingLeft: 4 }}>ACCOUNT</div>
        <div className="stsec" style={{ marginBottom: 32 }}>
          <div className="strow" onClick={() => setModal("password")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔒</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Change Password</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Update your login credentials</div>
              </div>
            </div>
            <ChevR />
          </div>
          <div className="strow" onClick={handleLogout}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fce8e8", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}>
                <LogoutIco />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--danger)" }}>Sign Out</div>
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginBottom: 16 }}>
          Logged in as {user?.email}
        </p>
      </div>

      {/* ── Modals ── */}
      {modal === "profile" && (
        <ChurchProfileModal
          church={church}
          onClose={() => setModal(null)}
          onSave={handleSaveChurch}
        />
      )}
      {modal === "sms" && (
        <SmsSettingsModal
          church={church}
          onClose={() => setModal(null)}
          onSave={async (updates) => { const { error } = await updateChurch(updates); return { error }; }}
          showToast={showToast}
        />
      )}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} showToast={showToast} />}
    </div>
  );
}