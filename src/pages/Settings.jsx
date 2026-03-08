// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    setErr("");
    setSaving(true);
    const { error } = await onSave({
      name:       f.name.trim(),
      admin_name: f.admin_name.trim(),
      phone:      f.phone.trim(),
      location:   f.address.trim(),
    });
    setSaving(false);
    if (error) {
      setErr(error.message || "Failed to save — please try again");
      return;
    }
    onClose();
  };

  return (
    <Modal title="Church Profile" onClose={saving ? undefined : onClose}>
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
        {err && (
          <div style={{ background: "#fce8e8", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--danger)" }}>
            ⚠️ {err}
          </div>
        )}
        {saving && (
          <div style={{ background: "#f0fdf6", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--success)" }}>
            ⏳ Saving… this may take a few seconds
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── SMS / Sender ID Modal ─────────────────────────────────────────────────────
function SmsSettingsModal({ church, onClose, onSave, showToast }) {
  const approvedId   = church?.sms_sender_id_status === "approved" ? church.sms_sender_id : null;
  const pendingId    = church?.sms_sender_id_status === "pending"  ? church.sms_sender_id : null;

  const [newId,    setNewId]    = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const handleRequest = async () => {
    const id = newId.trim();
    if (!id)            { showToast("Enter a sender ID name"); return; }
    if (id.length > 11) { showToast("Sender ID must be 11 characters or less"); return; }

    setSaving(true);
    // Save request to sender_id_requests table
    const { error: e1 } = await supabase
      .from("sender_id_requests")
      .insert({ church_id: church.id, sender_id: id, status: "pending" });
    // Mark on church record as pending
    const { error: e2 } = await onSave({ sms_sender_id: id, sms_sender_id_status: "pending" });
    setSaving(false);

    if (e1 || e2) {
      showToast("Failed to submit request ❌");
      return;
    }
    setSubmitted(true);
    showToast("Sender ID request submitted ✅");
  };

  return (
    <Modal title="Messaging Settings" onClose={onClose}>
      <div className="fstack">

        {/* Current active sender ID */}
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>
            Current Sender ID
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>
              {approvedId || "ChurchTrakr"}
            </div>
            {approvedId
              ? <span style={{ background: "#d4f1e4", color: "#1a6640", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Active</span>
              : <span style={{ background: "var(--surface)", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Default</span>
            }
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            This is what recipients see when they get your SMS
          </div>
        </div>

        {/* Pending request status */}
        {pendingId && !submitted && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 4 }}>
              ⏳ Pending: "{pendingId}"
            </div>
            <div style={{ fontSize: 12, color: "#92400e" }}>
              Your request is being reviewed. Allow 4–6 business days for approval.
            </div>
          </div>
        )}

        {/* Success state */}
        {submitted && (
          <div style={{ background: "#f0fdf6", border: "1px solid #c8ebd8", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 6 }}>✅ Request Submitted!</div>
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6 }}>
              Your request for <strong>"{newId.trim()}"</strong> has been submitted.
              Allow <strong>4–6 business days</strong> for approval. You'll be able to use it once approved.
              Until then, your messages will send as <strong>ChurchTrakr</strong>.
            </div>
          </div>
        )}

        {/* Request new sender ID form */}
        {!submitted && (
          <>
            <div style={{ height: 1, background: "var(--border)" }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
              {approvedId ? "Request a New Sender ID" : "Request a Custom Sender ID"}
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -4, lineHeight: 1.6 }}>
              Use your church name or a short brand name. After submission, allow <strong>4–6 business days</strong> for approval.
            </p>
            <div className="fg">
              <label className="fl">Sender ID (max 11 characters)</label>
              <input
                className="fi"
                maxLength={11}
                placeholder="e.g. Grace Chapel"
                value={newId}
                onChange={e => setNewId(e.target.value)}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <p className="fh">Max 11 characters. This is what recipients will see.</p>
                <span style={{ fontSize: 12, color: newId.length > 9 ? "var(--brand)" : "var(--muted)", fontWeight: 600 }}>
                  {newId.length}/11
                </span>
              </div>
            </div>
            <button
              className="btn bp"
              onClick={handleRequest}
              disabled={saving || !newId.trim()}
              style={{ opacity: !newId.trim() ? .5 : 1 }}
            >
              {saving ? "Submitting…" : "📨 Request Sender ID"}
            </button>
          </>
        )}

        <button className="btn bg" onClick={onClose}>Close</button>
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
    if (f.next.length < 6)    { setErr("New password must be at least 6 characters"); return; }
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

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  const handleSaveChurch = async (updates) => {
    const { error } = await updateChurch(updates);
    if (!error) {
      showToast("Saved ✅");
    } else {
      const msg = error?.message || "Failed to save";
      showToast(`Save failed: ${msg} ❌`);
    }
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
                <div style={{ fontWeight: 600, fontSize: 14 }}>SMS & Sender ID</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                  {church?.sms_sender_id_status === "approved"
                    ? `Sending as: ${church.sms_sender_id}`
                    : church?.sms_sender_id_status === "pending"
                    ? `Pending approval: ${church.sms_sender_id}`
                    : "Sending as: ChurchTrakr (default)"}
                </div>
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