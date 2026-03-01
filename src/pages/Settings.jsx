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
    name:       church?.name       || "",
    admin_name: church?.admin_name || "",
    phone:      church?.phone      || "",
    address:    church?.location   || church?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    if (!f.name.trim()) { setErr("Church name is required"); return; }
    setSaving(true);
    const { error } = await onSave({
      name:       f.name.trim(),
      admin_name: f.admin_name.trim(),
      phone:      f.phone.trim(),
      location:   f.address.trim(),
    });
    setSaving(false);
    if (error) { setErr(error.message || "Failed to save"); return; }
    onClose();
  };

  return (
    <Modal title="Church Profile" onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Church Name *</label>
          <input className="fi" name="name" value={f.name} onChange={h} placeholder="e.g. Grace Chapel" />
        </div>
        <div className="fg">
          <label className="fl">Pastor / Admin Name</label>
          <input className="fi" name="admin_name" value={f.admin_name} onChange={h} placeholder="e.g. Pastor James Okon" />
          <p className="fh">This name appears on your dashboard greeting</p>
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
          <p className="fh">The name recipients see when they receive your SMS</p>
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
  const [f,      setF]      = useState({ next: "", confirm: "" });
  const [err,    setErr]    = useState("");
  const [saving, setSaving] = useState(false);
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    setErr("");
    if (f.next.length < 6)   { setErr("New password must be at least 6 characters"); return; }
    if (f.next !== f.confirm) { setErr("Passwords do not match"); return; }
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
        <p style={{ fontSize: 12, color: "var(--muted)" }}>You are already signed in — no need to enter your current password.</p>
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

  const handleLogout  = async () => { await signOut(); navigate("/login"); };
  const handleSaveChurch = async (updates) => {
    const { error } = await updateChurch(updates);
    if (!error) showToast("Saved ✅");
    return { error };
  };

  const adminName  = church?.admin_name || user?.user_metadata?.full_name || "";
  const churchName = church?.name || "My Church";

  return (
    <div className="page">
      <div className="ph">
        <h1>Settings</h1>
        <p>Manage your church account</p>
      </div>

      <div className="pc">
        {/* ── Church hero card ── */}
        <div style={{
          background: "linear-gradient(135deg, var(--brand), #7c3aed)",
          borderRadius: 18, padding: "20px 16px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, flexShrink: 0,
          }}>⛪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display',serif", fontWeight: 700,
              fontSize: 17, color: "#fff",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{churchName}</div>
            {adminName && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 3 }}>
                {adminName}
              </div>
            )}
            {church?.location && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
                📍 {church.location}
              </div>
            )}
          </div>
          <button
            onClick={() => setModal("profile")}
            style={{
              background: "rgba(255,255,255,.2)", border: "none",
              color: "#fff", borderRadius: 10, padding: "8px 12px",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
              flexShrink: 0,
            }}
          >
            <EditIco s={14} /> Edit
          </button>
        </div>

        {/* ── CHURCH section ── */}
        <div className="st-label">CHURCH</div>
        <div className="stsec" style={{ marginBottom: 20 }}>
          <div className="strow" onClick={() => setModal("profile")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="st-ico" style={{ background: "#d4f1e4" }}>🏛️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Church Profile</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                  Name, pastor name, phone, address
                </div>
              </div>
            </div>
            <ChevR />
          </div>
          <div className="strow" onClick={() => setModal("sms")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="st-ico" style={{ background: "#cce8ff" }}>💬</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>SMS Settings</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Sender ID and API key</div>
              </div>
            </div>
            <ChevR />
          </div>
        </div>

        {/* ── ACCOUNT section ── */}
        <div className="st-label">ACCOUNT</div>
        <div className="stsec" style={{ marginBottom: 32 }}>
          <div className="strow" style={{ pointerEvents: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="st-ico" style={{ background: "var(--surface2)" }}>✉️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Email</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{user?.email}</div>
              </div>
            </div>
          </div>
          <div className="strow" onClick={() => setModal("password")}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="st-ico" style={{ background: "var(--surface2)" }}>🔒</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Change Password</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Update your login credentials</div>
              </div>
            </div>
            <ChevR />
          </div>
          <div className="strow" onClick={handleLogout}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="st-ico" style={{ background: "#fce8e8" }}>
                <LogoutIco />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--danger)" }}>Sign Out</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === "profile" && (
        <ChurchProfileModal church={church} onClose={() => setModal(null)} onSave={handleSaveChurch} />
      )}
      {modal === "sms" && (
        <SmsSettingsModal
          church={church} onClose={() => setModal(null)}
          onSave={async (u) => { const { error } = await updateChurch(u); return { error }; }}
          showToast={showToast}
        />
      )}
      {modal === "password" && (
        <ChangePasswordModal onClose={() => setModal(null)} showToast={showToast} />
      )}
    </div>
  );
}