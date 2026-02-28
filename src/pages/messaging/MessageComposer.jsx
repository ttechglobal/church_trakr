// src/pages/messaging/MessageComposer.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { SMS_TEMPLATES } from "../../data/seed";
import { smsCount } from "../../lib/helpers";
import { sendSms } from "../../services/sms";
import { ChevL } from "../../components/ui/Icons";

const RECIPIENT_TYPES = [
  { key: "absentees", label: "Absentees",     icon: "📋", desc: "Members absent from last service" },
  { key: "group",     label: "A Group",        icon: "👥", desc: "All members of a specific group"  },
  { key: "single",    label: "Single Number",  icon: "📱", desc: "One person by phone number"       },
  { key: "all",       label: "All Members",    icon: "📣", desc: "Your entire member list"          },
];

function SendResults({ results, sent, failed, creditsUsed, onDone, onAnother }) {
  const delivered = results.filter(r => r.status === "SENT" || r.status === "DND_SENT");
  const rejected  = results.filter(r => r.status !== "SENT" && r.status !== "DND_SENT");

  return (
    <div className="page">
      <div style={{ textAlign: "center", padding: "48px 24px 24px" }}>
        <div style={{ fontSize: 64 }}>
          {rejected.length === 0 ? "✅" : sent > 0 ? "⚠️" : "❌"}
        </div>
        <div style={{
          fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, marginTop: 14,
          color: rejected.length === 0 ? "var(--success)" : sent > 0 ? "var(--accent)" : "var(--danger)",
        }}>
          {rejected.length === 0 ? "All Messages Sent!" : sent > 0 ? "Partially Sent" : "Send Failed"}
        </div>
        <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 14 }}>
          {sent} sent · {failed} failed · {creditsUsed} credits used
        </p>
      </div>

      <div className="pc">
        {delivered.length > 0 && (
          <div className="card" style={{ marginBottom: 12, border: "1px solid #c8ebd8", background: "#f0fdf6" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--success)", marginBottom: 8 }}>
              ✓ Delivered ({delivered.length})
            </div>
            {delivered.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "3px 0" }}>
                {r.phone} — {r.description || r.status}
              </div>
            ))}
          </div>
        )}

        {rejected.length > 0 && (
          <div className="card" style={{ marginBottom: 20, border: "1px solid #f5c8c8", background: "#fdf0f0" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--danger)", marginBottom: 8 }}>
              ✗ Failed / Rejected ({rejected.length})
            </div>
            {rejected.map((r, i) => (
              <div key={i} style={{ fontSize: 12, color: "var(--muted)", padding: "3px 0" }}>
                {r.phone} — {r.description || r.status}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onDone}>View History</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={onAnother}>Send Another</button>
        </div>
      </div>
    </div>
  );
}

export default function MessageComposer({ groups = [], members = [], attendanceHistory = [], showToast }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { church, refreshChurch } = useAuth();

  const [recipientType,   setRecipientType]   = useState(params.get("type") || "absentees");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [singlePhone,     setSinglePhone]     = useState("");
  const [singleName,      setSingleName]      = useState("");
  const [message,         setMessage]         = useState("");
  const [templateId,      setTemplateId]      = useState("");
  const [sending,         setSending]         = useState(false);
  const [sendResult,      setSendResult]      = useState(null);
  const [sendError,       setSendError]       = useState("");

  // ── Compute recipients ───────────────────────────────────────────────────
  const computeRecipients = () => {
    switch (recipientType) {
      case "absentees": {
        const last = attendanceHistory[0];
        if (!last) return [];
        return last.records
          .filter(r => !r.present)
          .map(r => {
            const m = members.find(x => x.id === r.memberId);
            return { name: r.name, phone: m?.phone ?? "" };
          })
          .filter(r => r.phone);
      }
      case "group": {
        if (!selectedGroupId) return [];
        return members
          .filter(m => (m.groupIds || []).includes(Number(selectedGroupId)) || (m.groupIds || []).includes(selectedGroupId))
          .map(m => ({ name: m.name, phone: m.phone }))
          .filter(r => r.phone);
      }
      case "single":
        return singlePhone ? [{ name: singleName || "Member", phone: singlePhone }] : [];
      case "all":
        return members
          .filter(m => m.status === "active" && m.phone)
          .map(m => ({ name: m.name, phone: m.phone }));
      default:
        return [];
    }
  };

  const recipients = computeRecipients();
  const charCount  = message.length;
  const segCount   = smsCount(message);
  const creditCost = recipients.length * segCount;
  const credits    = church?.sms_credits ?? 0;

  const handleTemplate = (id) => {
    setTemplateId(id);
    const t = SMS_TEMPLATES.find(t => t.id === id);
    if (t) setMessage(t.text);
  };

  // ── Send ─────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    setSendError("");
    if (!message.trim())        { setSendError("Please write a message first."); return; }
    if (recipients.length === 0) { setSendError("No valid recipients found."); return; }

    setSending(true);
    const result = await sendSms({ recipients, message, type: recipientType });
    setSending(false);

    if (!result.success && !result.results?.length) {
      setSendError(result.error || "Send failed. Please try again.");
      return;
    }

    // Refresh credit balance shown in the UI
    await refreshChurch();
    setSendResult(result);
  };

  // ── Results screen ───────────────────────────────────────────────────────
  if (sendResult) {
    return (
      <SendResults
        results={sendResult.results ?? []}
        sent={sendResult.sent ?? 0}
        failed={sendResult.failed ?? 0}
        creditsUsed={sendResult.credits_used ?? 0}
        onDone={() => navigate("/messaging/history")}
        onAnother={() => { setSendResult(null); setMessage(""); setTemplateId(""); }}
      />
    );
  }

  // ── Composer ─────────────────────────────────────────────────────────────
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

        {/* Step 1 */}
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

        {/* Step 2 */}
        <div className="stitle">2. Choose a Template (optional)</div>
        <div className="fg" style={{ marginBottom: 16 }}>
          <select className="fi" value={templateId} onChange={e => handleTemplate(e.target.value)}>
            <option value="">— Write your own message —</option>
            {SMS_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* Step 3 */}
        <div className="stitle">3. Your Message</div>
        <div className="fg" style={{ marginBottom: 8 }}>
          <textarea
            className="fi"
            rows={5}
            placeholder="Type your message… Use {name} to personalize"
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, fontSize: 12 }}>
          <span style={{ color: "var(--muted)" }}>Use {"{name}"} to insert each person's name</span>
          <span style={{ color: charCount > 320 ? "var(--danger)" : "var(--muted)", fontWeight: 600 }}>
            {charCount} chars · {segCount} SMS
          </span>
        </div>

        {/* Cost estimate */}
        {recipients.length > 0 && message && (
          <div className="card" style={{ marginBottom: 16, background: "var(--surface2)", boxShadow: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Estimated cost</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} × {segCount} segment{segCount !== 1 ? "s" : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--brand)" }}>
                  {creditCost} credits
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {credits} available
                </div>
              </div>
            </div>
          </div>
        )}

        {sendError && (
          <div style={{
            background: "#fce8e8", border: "1.5px solid #f5c8c8", borderRadius: 10,
            padding: "10px 14px", fontSize: 13, color: "var(--danger)", fontWeight: 500, marginBottom: 16,
          }}>
            {sendError}
          </div>
        )}

        <button
          className="btn bp blg"
          disabled={sending || !message.trim() || recipients.length === 0}
          onClick={handleSend}
          style={{ opacity: (sending || !message.trim() || recipients.length === 0) ? 0.5 : 1 }}
        >
          {sending ? "⏳ Sending…" : `📤 Send to ${recipients.length || "—"} Recipient${recipients.length !== 1 ? "s" : ""}`}
        </button>


      </div>
    </div>
  );
}