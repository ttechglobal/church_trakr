// src/pages/messaging/MessageComposer.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SMS_TEMPLATES } from "../../data/seed";
import { smsCount } from "../../lib/helpers";
import { ChevL } from "../../components/ui/Icons";

const RECIPIENT_TYPES = [
  { key: "absentees",  label: "Absentees",       icon: "📋", desc: "Members absent from last service"  },
  { key: "attendees",  label: "Attendees",        icon: "🙏", desc: "Members who came to last service"  },
  { key: "group",      label: "A Group",          icon: "👥", desc: "All members of a specific group"   },
  { key: "single",     label: "Single Number",    icon: "📱", desc: "One person by phone number"        },
  { key: "all",        label: "All Members",      icon: "📣", desc: "Your entire member list"           },
];

export default function MessageComposer({ groups = [], members = [], attendanceHistory = [], showToast }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initType = params.get("type") || "absentees";

  const [recipientType, setRecipientType] = useState(initType);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [singlePhone, setSinglePhone] = useState("");
  const [singleName, setSingleName] = useState("");
  const [message, setMessage] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [sent, setSent] = useState(false);

  // Compute recipients based on type
  const computeRecipients = () => {
    switch (recipientType) {
      case "absentees": {
        const lastSession = attendanceHistory[0];
        if (!lastSession) return [];
        return lastSession.records
          .filter(r => !r.present)
          .map(r => ({ name: r.name, phone: members.find(m => m.id === r.memberId)?.phone ?? "—" }));
      }
      case "attendees": {
        const lastSession = attendanceHistory[0];
        if (!lastSession) return [];
        return lastSession.records
          .filter(r => r.present === true)
          .map(r => ({ name: r.name, phone: members.find(m => m.id === r.memberId)?.phone ?? "—" }));
      }
      case "group": {
        if (!selectedGroupId) return [];
        return members
          .filter(m => (m.groupIds || []).includes(Number(selectedGroupId)))
          .map(m => ({ name: m.name, phone: m.phone }));
      }
      case "single":
        return singlePhone ? [{ name: singleName || "Member", phone: singlePhone }] : [];
      case "all":
        return members.filter(m => m.status === "active").map(m => ({ name: m.name, phone: m.phone }));
      default:
        return [];
    }
  };

  const recipients = computeRecipients();
  const charCount = message.length;
  const segCount = smsCount(message);
  const creditCost = recipients.length * segCount;

  const handleTemplate = (id) => {
    setTemplateId(id);
    const t = SMS_TEMPLATES.find(t => t.id === id);
    if (t) setMessage(t.text);
  };

  const handleSend = () => {
    if (!message.trim() || recipients.length === 0) {
      showToast("Add a message and at least one recipient.");
      return;
    }
    // TODO: call sendSms() from services/api when Supabase is integrated
    setSent(true);
    showToast(`✅ SMS sent to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}!`);
  };

  if (sent) return (
    <div className="page">
      <div style={{ textAlign: "center", padding: "80px 24px" }}>
        <div style={{ fontSize: 72 }}>✅</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--success)", marginTop: 16 }}>
          Messages Sent!
        </div>
        <p style={{ color: "var(--muted)", marginTop: 10, fontSize: 14 }}>
          {recipients.length} SMS dispatched · {creditCost} credits used
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center" }}>
          <button className="btn bg" onClick={() => navigate("/messaging/history")}>View History</button>
          <button className="btn bp" onClick={() => { setSent(false); setMessage(""); }}>Send Another</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => navigate("/messaging")}>
          <ChevL /> Back
        </button>
        <h1>Compose Message</h1>
        <p>Select recipients and write your message</p>
      </div>
      <div className="pc">

        {/* ── Step 1: Recipient type ── */}
        <div className="stitle">1. Who are you messaging?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {RECIPIENT_TYPES.map(rt => (
            <div
              key={rt.key}
              onClick={() => setRecipientType(rt.key)}
              style={{
                background: "var(--surface)", borderRadius: 12, padding: "14px 12px", cursor: "pointer",
                border: `2px solid ${recipientType === rt.key ? "var(--brand)" : "var(--border)"}`,
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{rt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{rt.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{rt.desc}</div>
            </div>
          ))}
        </div>

        {/* Conditional sub-fields */}
        {recipientType === "group" && (
          <div className="fg" style={{ marginBottom: 16 }}>
            <label className="fl">Select Group</label>
            <select className="fi" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
              <option value="">Choose a group…</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}
        {recipientType === "single" && (
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div className="fg" style={{ flex: 1 }}>
              <label className="fl">Name</label>
              <input className="fi" placeholder="Full name" value={singleName} onChange={e => setSingleName(e.target.value)} />
            </div>
            <div className="fg" style={{ flex: 1 }}>
              <label className="fl">Phone *</label>
              <input className="fi" placeholder="08012345678" value={singlePhone} onChange={e => setSinglePhone(e.target.value)} />
            </div>
          </div>
        )}

        {/* Recipients preview */}
        {recipients.length > 0 && (
          <div className="csm" style={{ marginBottom: 20, background: "#f0fdf6", border: "1px solid #c8ebd8" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--success)" }}>
              ✓ {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} selected
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {recipients.slice(0, 3).map(r => r.name).join(", ")}
              {recipients.length > 3 ? ` +${recipients.length - 3} more` : ""}
            </div>
          </div>
        )}

        {/* ── Step 2: Template ── */}
        <div className="stitle">2. Choose a Template (optional)</div>
        <div className="fg" style={{ marginBottom: 16 }}>
          <select className="fi" value={templateId} onChange={e => handleTemplate(e.target.value)}>
            <option value="">— Write your own message —</option>
            {SMS_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* ── Step 3: Message ── */}
        <div className="stitle">3. Your Message</div>
        <div className="fg" style={{ marginBottom: 8 }}>
          <textarea
            className="fi"
            rows={5}
            placeholder='Type your message here… Use {name} for personalization'
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span className="fh">Use {"{name}"} to personalize each message</span>
          <span style={{ fontSize: 12, color: charCount > 320 ? "var(--danger)" : "var(--muted)", fontWeight: 600 }}>
            {charCount} chars · {segCount} SMS
          </span>
        </div>

        {/* ── Cost estimate ── */}
        {recipients.length > 0 && message && (
          <div className="card" style={{ marginBottom: 20, background: "var(--surface2)", boxShadow: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Estimated cost</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "var(--brand)" }}>
                {creditCost} credits
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              {recipients.length} recipients × {segCount} SMS segment{segCount !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* ── Send button ── */}
        <button
          className="btn bp blg"
          disabled={!message.trim() || recipients.length === 0}
          onClick={handleSend}
          style={{ opacity: (!message.trim() || recipients.length === 0) ? .5 : 1 }}
        >
          📤 Send to {recipients.length > 0 ? recipients.length : "—"} Recipient{recipients.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}