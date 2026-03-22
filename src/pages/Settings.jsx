// src/pages/Settings.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { usePWA } from "../hooks/usePWA";
import { supabase } from "../services/supabaseClient";
import { ChevR, EditIco, LogoutIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";

// ── Template helpers ──────────────────────────────────────────────────────────
function loadCustomTemplates() {
  try { return JSON.parse(localStorage.getItem("ct_sms_templates") || "[]"); } catch { return []; }
}
function saveCustomTemplates(tpls) {
  localStorage.setItem("ct_sms_templates", JSON.stringify(tpls));
}

const BUILT_IN_TEMPLATES = [
  { id: "t1",    label: "We missed you",         text: "Dear {name}, we missed you at service this Sunday. We love you and look forward to seeing you next week. God bless! 🙏" },
  { id: "t2",    label: "First Timer Welcome",    text: "Dear {name}, thank you for visiting us! You are welcome here. We'd love to see you again this Sunday!" },
  { id: "t3",    label: "Service Reminder",       text: "Dear {name}, this is a reminder that Sunday service holds at 9:00 AM. We look forward to worshipping with you. God bless!" },
  { id: "t-att1",label: "Thanks for Attending",   text: "Hi {name}! 🙏 Thank you for being with us today. Your presence blesses our church family. See you next Sunday!" },
  { id: "t-att2",label: "Attendee Follow-up",     text: "Dear {name}, it was wonderful worshipping with you today. We pray God's blessings on your week ahead!" },
  { id: "t-rem1",label: "Sunday Reminder",        text: "Hi {name}! Reminder — Sunday service is at 9:00 AM this week. We look forward to seeing you. God bless! 🙏" },
  { id: "t-eve1",label: "Upcoming Event",          text: "Dear {name}, we have a special event this week. Don't miss it! Check with your cell leader for details. Blessings!" },
];

// ── Templates Tab ─────────────────────────────────────────────────────────────
function TemplatesTab({ showToast }) {
  const [templates, setTemplates] = useState(loadCustomTemplates);
  const [editId,    setEditId]    = useState(null);
  const [addMode,   setAddMode]   = useState(false);
  const [form,      setForm]      = useState({ label: "", text: "" });

  const persist = (updated) => { setTemplates(updated); saveCustomTemplates(updated); };

  const startEdit = (t) => { setEditId(t.id); setAddMode(false); setForm({ label: t.label, text: t.text }); };
  const startAdd  = ()  => { setAddMode(true); setEditId(null); setForm({ label: "", text: "" }); };
  const cancel    = ()  => { setEditId(null); setAddMode(false); };

  const saveEdit = () => {
    if (!form.label.trim() || !form.text.trim()) { showToast("Name and message are required"); return; }
    persist(templates.map(t => t.id === editId ? { ...t, ...form } : t));
    showToast("Template updated ✅"); cancel();
  };
  const saveNew = () => {
    if (!form.label.trim() || !form.text.trim()) { showToast("Name and message are required"); return; }
    persist([...templates, { id: `custom-${Date.now()}`, label: form.label.trim(), text: form.text.trim() }]);
    showToast("Template saved ✅"); cancel();
  };
  const remove = (id) => { persist(templates.filter(t => t.id !== id)); showToast("Template deleted"); };

  const EditForm = ({ onSave, saveLabel }) => (
    <div style={{ background: "var(--surface2)", borderRadius: 12, padding: 14, marginTop: 8 }}>
      <div className="fg" style={{ marginBottom: 10 }}>
        <label className="fl">Template name</label>
        <input className="fi" placeholder='e.g. "New Year Greeting"'
          value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
      </div>
      <div className="fg" style={{ marginBottom: 12 }}>
        <label className="fl">Message text</label>
        <textarea className="fi" rows={4} placeholder="Use {name} to personalise each message"
          value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
          style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} to personalise · {form.text.length} chars</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn bg" style={{ flex: 1 }} onClick={cancel}>Cancel</button>
        <button className="btn bp" style={{ flex: 1 }} onClick={onSave}>{saveLabel}</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>My Templates ({templates.length})</div>
        {!addMode && !editId && (
          <button className="btn bp" style={{ padding: "7px 14px", fontSize: 13 }} onClick={startAdd}>+ Add New</button>
        )}
      </div>

      {addMode && <EditForm onSave={saveNew} saveLabel="Save Template" />}

      {templates.length === 0 && !addMode && (
        <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "24px 16px", textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>No custom templates yet</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.5 }}>
            Create reusable message templates to save time when sending SMS
          </div>
          <button className="btn bp" style={{ fontSize: 13 }} onClick={startAdd}>+ Create First Template</button>
        </div>
      )}

      {templates.map(t => (
        <div key={t.id} style={{ background: "var(--surface)", border: `2px solid ${editId === t.id ? "var(--brand)" : "var(--border)"}`, borderRadius: 14, padding: "13px 14px", marginBottom: 8 }}>
          {editId === t.id ? (
            <EditForm onSave={saveEdit} saveLabel="Update" />
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)", flex: 1 }}>{t.label}</div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(t)}
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                    Edit
                  </button>
                  <button onClick={() => remove(t.id)}
                    style={{ background: "#fce8e8", border: "1px solid #f5c8c8", borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", color: "var(--danger)", fontWeight: 600 }}>
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, wordBreak: "break-word" }}>{t.text}</div>
            </>
          )}
        </div>
      ))}

      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, marginTop: templates.length > 0 ? 20 : 8 }}>
        Built-in Templates <span style={{ fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>(read-only)</span>
      </div>
      {BUILT_IN_TEMPLATES.map(t => (
        <div key={t.id} style={{ background: "var(--surface2)", borderRadius: 12, padding: "11px 14px", marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: "var(--muted)" }}>{t.label}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, wordBreak: "break-word" }}>{t.text}</div>
        </div>
      ))}
    </div>
  );
}

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
    setErr(""); setSaving(true);
    const { error } = await onSave({ name: f.name.trim(), admin_name: f.admin_name.trim(), phone: f.phone.trim(), location: f.address.trim() });
    setSaving(false);
    if (error) { setErr(error.message || "Failed to save — please try again"); return; }
    onClose();
  };

  return (
    <Modal title="Church Profile" onClose={saving ? undefined : onClose}>
      <div className="fstack">
        <div className="fg"><label className="fl">Church Name *</label><input className="fi" name="name" value={f.name} onChange={h} placeholder="e.g. Grace Chapel" /></div>
        <div className="fg"><label className="fl">Pastor / Admin Name</label><input className="fi" name="admin_name" value={f.admin_name} onChange={h} placeholder="e.g. Pastor James Okon" /><p className="fh">Appears on your dashboard greeting</p></div>
        <div className="fg"><label className="fl">Phone Number</label><input className="fi" name="phone" type="tel" value={f.phone} onChange={h} placeholder="080xxxxxxxx" /></div>
        <div className="fg"><label className="fl">Address</label><input className="fi" name="address" value={f.address} onChange={h} placeholder="Church location / address" /></div>
        {err && <div style={{ background: "#fce8e8", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--danger)" }}>⚠️ {err}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── SMS / Sender ID Modal ─────────────────────────────────────────────────────
function SmsSettingsModal({ church, onClose, onSave, showToast }) {
  const approvedId  = church?.sms_sender_id_status === "approved" ? church.sms_sender_id : null;
  const pendingId   = church?.sms_sender_id_status === "pending"  ? church.sms_sender_id : null;
  const [newId,     setNewId]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving,    setSaving]    = useState(false);

  const handleRequest = async () => {
    const id = newId.trim();
    if (!id)            { showToast("Enter a sender ID name"); return; }
    if (id.length > 11) { showToast("Sender ID must be 11 characters or less"); return; }
    setSaving(true);
    const { error: e1 } = await supabase.from("sender_id_requests").insert({ church_id: church.id, sender_id: id, status: "pending" });
    const { error: e2 } = await onSave({ sms_sender_id: id, sms_sender_id_status: "pending" });
    setSaving(false);
    if (e1 || e2) { showToast("Failed to submit request ❌"); return; }
    setSubmitted(true);
    showToast("Sender ID request submitted ✅");
  };

  return (
    <Modal title="Messaging Settings" onClose={onClose}>
      <div className="fstack">
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Current Sender ID</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "var(--brand)" }}>{approvedId || "ChurchTrakr"}</div>
            {approvedId ? <span style={{ background: "#d4f1e4", color: "#1a6640", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Active</span>
                        : <span style={{ background: "var(--surface)", color: "var(--muted)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>Default</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>This is what recipients see when they receive your SMS</div>
        </div>
        {pendingId && !submitted && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 4 }}>⏳ Pending: "{pendingId}"</div>
            <div style={{ fontSize: 12, color: "#92400e" }}>Your request is being reviewed. Allow 4–6 business days.</div>
          </div>
        )}
        {submitted ? (
          <div style={{ background: "#f0fdf6", border: "1px solid #c8ebd8", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 6 }}>✅ Request Submitted!</div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>Your request for <strong>"{newId.trim()}"</strong> has been submitted. Allow <strong>4–6 business days</strong> for approval.</div>
          </div>
        ) : (
          <>
            <div style={{ height: 1, background: "var(--border)" }} />
            <div style={{ fontWeight: 700, fontSize: 14 }}>{approvedId ? "Request a New Sender ID" : "Request a Custom Sender ID"}</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -4, lineHeight: 1.6 }}>Use your church name. After submission, allow 4–6 business days for approval.</p>
            <div className="fg">
              <label className="fl">Sender ID (max 11 characters)</label>
              <input className="fi" maxLength={11} placeholder="e.g. GraceChapel" value={newId} onChange={e => setNewId(e.target.value)} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <p className="fh">Max 11 characters. This is what recipients will see.</p>
                <span style={{ fontSize: 12, color: newId.length > 9 ? "var(--brand)" : "var(--muted)", fontWeight: 600 }}>{newId.length}/11</span>
              </div>
            </div>
            <button className="btn bp" onClick={handleRequest} disabled={saving || !newId.trim()} style={{ opacity: !newId.trim() ? .5 : 1 }}>
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
  const [f, setF] = useState({ next: "", confirm: "" });
  const [err, setErr] = useState("");
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
    showToast("Password updated ✅"); onClose();
  };

  return (
    <Modal title="Change Password" onClose={onClose}>
      <div className="fstack">
        <div className="fg"><label className="fl">New Password</label><input className="fi" name="next" type="password" value={f.next} onChange={h} placeholder="At least 6 characters" /></div>
        <div className="fg"><label className="fl">Confirm New Password</label><input className="fi" name="confirm" type="password" value={f.confirm} onChange={h} placeholder="Repeat new password" /></div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>You are already signed in — no need to enter your current password.</p>
        {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>{saving ? "Updating…" : "Update"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Contact Support Modal ─────────────────────────────────────────────────────
const WHATSAPP_SUPPORT = "2348050340350";

function SupportModal({ church, onClose, showToast }) {
  const [msg,     setMsg]     = useState("");
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSend = async () => {
    if (!msg.trim()) { showToast("Please write a message"); return; }
    setSending(true);
    const { error } = await supabase.from("support_messages").insert({
      church_id: church?.id || null,
      message:   msg.trim(),
    });
    setSending(false);
    if (error) { showToast("Failed to send — please use WhatsApp ❌"); return; }
    setSent(true);
    showToast("Message sent! ✅");
  };

  const waText = encodeURIComponent(
    `Hi ChurchTrakr Support!\n\nChurch: ${church?.name || "—"}\nAdmin: ${church?.admin_name || "—"}\nPhone: ${church?.phone || "—"}\n\nMessage:\n${msg}`
  );

  return (
    <Modal title="Contact Support" onClose={onClose}>
      <div className="fstack">
        {sent ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Message sent!</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
              We'll get back to you soon via WhatsApp or email.
            </div>
            <button className="btn bg" style={{ width: "100%" }} onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 14px",
              fontSize: 13, color: "var(--muted)" }}>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                {church?.name || "Your church"}
              </div>
              <div>{church?.admin_name || ""} {church?.phone ? `· ${church.phone}` : ""}</div>
            </div>
            <div className="fg">
              <label className="fl">Your message</label>
              <textarea className="fi" rows={4} value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="Describe your issue or question…"
                style={{ resize: "vertical", minHeight: 110 }} />
            </div>
            <button className="btn bp blg" onClick={handleSend} disabled={sending || !msg.trim()}>
              {sending ? "Sending…" : "Send Message"}
            </button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>or chat directly on WhatsApp</div>
              <a href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${waText}`}
                target="_blank" rel="noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#128c5e",
                  color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
                  textDecoration: "none" }}>
                💚 Open WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Attendance Mode Modal ─────────────────────────────────────────────────────
function AttendanceModeModal({ churchId, onClose, showToast }) {
  const key  = `attendance_mode_${churchId}`;
  const [mode, setMode] = useState(localStorage.getItem(key) || "mark_present");

  const save = () => {
    localStorage.setItem(key, mode);
    showToast("Attendance preference saved ✅");
    onClose();
  };

  const Opt = ({ value, title, desc, icon }) => (
    <div onClick={() => setMode(value)} style={{
      border: `2px solid ${mode === value ? "var(--brand)" : "var(--border)"}`,
      borderRadius: 14, padding: "16px 18px", cursor: "pointer",
      background: mode === value ? "var(--brand-pale, #edf7f1)" : "var(--surface)",
      marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 14,
      transition: "all .15s",
    }}>
      <div style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4,
          color: mode === value ? "var(--brand)" : "var(--text)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{desc}</div>
      </div>
      <div style={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
        border: `2px solid ${mode === value ? "var(--brand)" : "var(--border)"}`,
        background: mode === value ? "var(--brand)" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {mode === value && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
      </div>
    </div>
  );

  return (
    <Modal title="Attendance Marking Mode" onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18, lineHeight: 1.7 }}>
        Choose how you prefer to mark attendance. This affects all groups.
      </p>
      <Opt
        value="mark_present"
        icon="✅"
        title="Mark Who Was Present (Default)"
        desc="Everyone starts as present. Tap ✕ next to anyone who was absent. Best for most churches — fastest when most people attend."
      />
      <Opt
        value="mark_absent"
        icon="✕"
        title="Mark Who Was Absent"
        desc="Everyone starts as absent. Tap ✕ next to each person who attended to mark them present. Better for large congregations."
      />
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        <button className="btn bp" style={{ flex: 1 }} onClick={save}>Save Preference</button>
      </div>
    </Modal>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings({ showToast }) {
  const { signOut, church, user, updateChurch } = useAuth();
  const navigate = useNavigate();
  const [searchParams]      = useSearchParams();
  const [modal,    setModal]    = useState(null);
  const [activeTab, setActiveTab] = useState("general");

  const { pushPermission, pushSubscription, subscribePush, unsubscribePush, isInstalled, showInstallBanner, promptInstall } = usePWA(church?.id);
  const [pushLoading, setPushLoading] = useState(false);

  const handleTogglePush = async () => {
    setPushLoading(true);
    if (pushSubscription) {
      await unsubscribePush();
      showToast("Push notifications disabled");
    } else {
      const result = await subscribePush();
      if (result.ok) {
        showToast("Push notifications enabled ✅");
      } else if (result.reason === "denied") {
        showToast("Notifications blocked — go to your browser/phone Settings and allow notifications for this site");
      } else if (result.reason === "no_vapid_key") {
        showToast("Push not configured yet — VAPID key missing. See setup guide.");
      } else if (result.reason === "unsupported") {
        showToast("Your browser does not support push notifications");
      } else {
        showToast("Could not enable notifications — try again or check browser settings ❌");
      }
    }
    setPushLoading(false);
  };

  useEffect(() => {
    if (searchParams.get("tab") === "templates") setActiveTab("templates");
  }, [searchParams]);

  const handleLogout = async () => { await signOut(); navigate("/login"); };
  const handleSaveChurch = async (updates) => {
    const { error } = await updateChurch(updates);
    if (!error) showToast("Saved ✅");
    else showToast(`Save failed: ${error?.message || "Unknown error"} ❌`);
    return { error };
  };

  const adminName  = church?.admin_name || user?.user_metadata?.full_name || "";
  const churchName = church?.name || "My Church";

  // Read current attendance mode for display in the settings row
  const currentAttMode = church?.id
    ? (localStorage.getItem(`attendance_mode_${church.id}`) || "mark_present")
    : "mark_present";
  const attModeLabel = currentAttMode === "mark_absent"
    ? "Currently: Mark who is absent"
    : "Currently: Mark who is present (default)";

  return (
    <div className="page">
      <div style={{
        background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding: "max(env(safe-area-inset-top,32px),32px) 22px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-30, width:160, height:160,
          borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }} />
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:27, fontWeight:800, color:"#fff", letterSpacing:"-.015em" }}>Settings</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.52)", marginTop:5, fontWeight:500 }}>Manage your church account</div>
      </div>

      <div className="pc">
        {/* Tab switcher */}
        <div className="tabs" style={{ marginBottom: 20 }}>
          {[["general", "⚙️ General"], ["templates", "📄 Templates"]].map(([key, label]) => (
            <button key={key} className={`tab ${activeTab === key ? "act" : ""}`}
              onClick={() => setActiveTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "templates" ? (
          <TemplatesTab showToast={showToast} />
        ) : (
          <>
            {/* Church hero card */}
            <div style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-mid))", borderRadius: 18, padding: "20px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>⛪</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: "#fff", lineHeight: 1.3, wordBreak: "break-word" }}>{churchName}</div>
                {adminName && <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 3 }}>{adminName}</div>}
                {church?.location && <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 2 }}>📍 {church.location}</div>}
              </div>
              <button onClick={() => setModal("profile")}
                style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: "'DM Sans',sans-serif" }}>
                <EditIco s={14} /> Edit
              </button>
            </div>

            {/* CHURCH section */}
            <div className="st-label">CHURCH</div>
            <div className="stsec" style={{ marginBottom: 20 }}>
              <div className="strow" onClick={() => setModal("profile")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#d4f1e4" }}>🏛️</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>Church Profile</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Name, pastor name, phone, address</div></div>
                </div><ChevR />
              </div>
              <div className="strow" onClick={() => setModal("sms")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#cce8ff" }}>💬</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>SMS & Sender ID</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                      {church?.sms_sender_id_status === "approved" ? `Sending as: ${church.sms_sender_id}` : church?.sms_sender_id_status === "pending" ? `Pending: ${church.sms_sender_id}` : "Sending as: ChurchTrakr (default)"}
                    </div>
                  </div>
                </div><ChevR />
              </div>
              <div className="strow" onClick={() => setActiveTab("templates")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#f0e6ff" }}>📄</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>SMS Templates</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Manage reusable message templates</div></div>
                </div><ChevR />
              </div>
            </div>

            {/* ── ATTENDANCE section — NEW ── */}
            <div className="st-label">ATTENDANCE</div>
            <div className="stsec" style={{ marginBottom: 20 }}>
              <div className="strow" onClick={() => setModal("attendance")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#d4f1e4" }}>✅</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Marking Mode</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{attModeLabel}</div>
                  </div>
                </div><ChevR />
              </div>
            </div>

            {/* ACCOUNT section */}
            <div className="st-label">ACCOUNT</div>
            <div className="stsec" style={{ marginBottom: 32 }}>
              <div className="strow" style={{ pointerEvents: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "var(--surface2)" }}>✉️</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>Email</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{user?.email}</div></div>
                </div>
              </div>
              <div className="strow" onClick={() => setModal("password")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "var(--surface2)" }}>🔒</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>Change Password</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Update your login credentials</div></div>
                </div><ChevR />
              </div>
              <div className="strow" onClick={handleLogout}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#fce8e8" }}><LogoutIco /></div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--danger)" }}>Sign Out</div>
                </div>
              </div>
            </div>

            {/* NOTIFICATIONS section */}
            <div className="st-label" style={{ marginTop: 4 }}>NOTIFICATIONS</div>
            <div className="stsec" style={{ marginBottom: 16 }}>
              <div className="strow" onClick={pushLoading ? undefined : handleTogglePush}
                style={{ cursor: pushLoading ? "not-allowed" : "pointer", opacity: pushLoading ? 0.6 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: pushSubscription ? "#dcfce7" : "var(--surface2)" }}>
                    {pushSubscription ? "🔔" : "🔕"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {pushLoading ? "Updating…" : pushSubscription ? "Push Notifications On" : "Enable Push Notifications"}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                      {pushPermission === "denied"
                        ? "Blocked in browser — tap to open settings"
                        : pushSubscription
                          ? "Reminders for Sunday, birthdays, follow-ups"
                          : "Get reminders for Sunday, birthdays, absentees"}
                    </div>
                  </div>
                </div>
                <div style={{
                  width: 38, height: 22, borderRadius: 11, flexShrink: 0,
                  background: pushSubscription ? "var(--success, #16a34a)" : "var(--border)",
                  position: "relative", transition: "background .2s",
                }}>
                  <div style={{
                    position: "absolute", top: 3, left: pushSubscription ? 19 : 3,
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  }} />
                </div>
              </div>
            </div>

            {/* APP INSTALL section */}
            {!isInstalled && (
              <>
                <div className="st-label" style={{ marginTop: 4 }}>APP</div>
                <div className="stsec" style={{ marginBottom: 16 }}>
                  <div className="strow" onClick={promptInstall || undefined}
                    style={{ cursor: showInstallBanner ? "pointer" : "default" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="st-ico" style={{ background: "#e0f2fe" }}>📲</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>Add to Home Screen</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>
                          {showInstallBanner ? "Tap to install ChurchTrakr as an app" : "Open this page in your browser to install"}
                        </div>
                      </div>
                    </div>
                    {showInstallBanner && <ChevR />}
                  </div>
                </div>
              </>
            )}

            {/* SUPPORT section */}
            <div className="st-label" style={{ marginTop: 4 }}>SUPPORT</div>
            <div className="stsec" style={{ marginBottom: 32 }}>
              <div className="strow" onClick={() => setModal("support")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#e0f2fe" }}>💬</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Contact Support</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Send a message to the ChurchTrakr team</div>
                  </div>
                </div>
                <ChevR />
              </div>
              <div className="strow" onClick={() => window.open("https://whatsapp.com/channel/ChurchTrakr", "_blank", "noopener,noreferrer")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="st-ico" style={{ background: "#dcfce7" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Join WhatsApp Community</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>Get updates & reach the admin for help</div>
                  </div>
                </div>
                <ChevR />
              </div>
            </div>
          </>
        )}
      </div>

      {modal === "profile"    && <ChurchProfileModal church={church} onClose={() => setModal(null)} onSave={handleSaveChurch} />}
      {modal === "sms"        && <SmsSettingsModal church={church} onClose={() => setModal(null)} onSave={async (u) => { const { error } = await updateChurch(u); return { error }; }} showToast={showToast} />}
      {modal === "password"   && <ChangePasswordModal onClose={() => setModal(null)} showToast={showToast} />}
      {modal === "support"    && <SupportModal church={church} onClose={() => setModal(null)} showToast={showToast} />}
      {modal === "attendance" && <AttendanceModeModal churchId={church?.id} onClose={() => setModal(null)} showToast={showToast} />}
    </div>
  );
}