// src/pages/messaging/MessageComposer.jsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabaseClient";
import { sendSms } from "../../services/sms";
import { SMS_TEMPLATES } from "../../data/seed";
import { smsCount } from "../../lib/helpers";
import { ChevL } from "../../components/ui/Icons";

const CREDITS_PER_SMS = 5;

const RECIPIENT_TYPES = [
  { key: "absentees", label: "Absentees",      icon: "📋", desc: "Members absent from last service" },
  { key: "attendees", label: "Attendees",       icon: "🙏", desc: "Members who came to service"     },
  { key: "group",     label: "A Group",         icon: "👥", desc: "All members of a specific group" },
  { key: "single",    label: "Single Number",   icon: "📱", desc: "One person by phone number"      },
  { key: "all",       label: "All Members",     icon: "📣", desc: "Your entire member list"         },
];

export default function MessageComposer({ groups = [], members = [], attendanceHistory = [], showToast }) {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const { church, updateChurch } = useAuth();

  const [recipientType,    setRecipientType]   = useState(params.get("type") || "absentees");
  const [selectedGroupId,  setSelectedGroupId] = useState("");
  const [singlePhone,      setSinglePhone]     = useState("");
  const [singleName,       setSingleName]      = useState("");
  const [message,          setMessage]         = useState("");
  const [templateId,       setTemplateId]      = useState("");
  const [sending,          setSending]         = useState(false);
  const [result,           setResult]          = useState(null); // { sent, failed }

  // ── Sender ID — driven by church approval status ─────────────────────────
  const approvedId    = church?.sms_sender_id_status === "approved" ? church.sms_sender_id : null;
  const pendingId     = church?.sms_sender_id_status === "pending"  ? church.sms_sender_id : null;
  // Active sender ID: use approved custom ID if available, else ChurchTrakr
  const activeSenderId = approvedId || "ChurchTrakr";

  // ── Compute recipients ─────────────────────────────────────────────────────
  const computeRecipients = () => {
    switch (recipientType) {
      case "absentees": {
        const last = [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!last) return [];
        return last.records
          .filter(r => !r.present)
          .map(r => ({ name: r.name, phone: members.find(m => m.id === r.memberId)?.phone ?? "" }))
          .filter(r => r.phone);
      }
      case "attendees": {
        const last = [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date))[0];
        if (!last) return [];
        return last.records
          .filter(r => r.present === true)
          .map(r => ({ name: r.name, phone: members.find(m => m.id === r.memberId)?.phone ?? "" }))
          .filter(r => r.phone);
      }
      case "group":
        if (!selectedGroupId) return [];
        return members
          .filter(m => (m.groupIds || []).includes(selectedGroupId) || (m.groupIds || []).includes(Number(selectedGroupId)))
          .map(m => ({ name: m.name, phone: m.phone }))
          .filter(r => r.phone);
      case "single":
        return singlePhone ? [{ name: singleName || "Member", phone: singlePhone }] : [];
      case "all":
        return members.filter(m => m.status === "active" && m.phone).map(m => ({ name: m.name, phone: m.phone }));
      default:
        return [];
    }
  };

  const recipients  = computeRecipients();
  const segCount    = smsCount(message);
  const creditCost  = recipients.length * segCount * CREDITS_PER_SMS;
  const credits     = church?.sms_credits ?? 0;
  const hasEnough   = credits >= creditCost;

  const handleTemplate = (id) => {
    setTemplateId(id);
    const t = SMS_TEMPLATES.find(t => t.id === id);
    if (t) setMessage(t.text);
  };

  // Sender ID is managed in Settings — no request flow needed here

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim())        { showToast("Please write a message first"); return; }
    if (recipients.length === 0){ showToast("No recipients found with phone numbers"); return; }
    if (!hasEnough)             { showToast(`Not enough credits. Need ${creditCost}, have ${credits}`); return; }

    setSending(true);
    try {
      const raw = await sendSms({ recipients, message, senderId: activeSenderId, type: recipientType });
      const res = {
        sent:   raw.sent   ?? 0,
        failed: raw.failed ?? 0,
        errors: raw.error  ? [raw.error] : [],
      };
      if (!raw.success && raw.error) throw new Error(raw.error);

      // Deduct credits from Supabase
      const newCredits = Math.max(0, credits - (res.sent * segCount * CREDITS_PER_SMS));
      await supabase.from("churches").update({ sms_credits: newCredits }).eq("id", church.id);
      await updateChurch({ sms_credits: newCredits });

      // Log to sms_logs — wrapped in try/catch so a logging failure never blocks the send
      try {
        const { error: logErr } = await supabase.from("sms_logs").insert({
          church_id:       church.id,
          recipient_type:  recipientType,
          recipient_count: res.sent,
          message,
          sender_id:       activeSenderId,
          credits_used:    res.sent * segCount * CREDITS_PER_SMS,
          status:          res.failed === 0 ? "sent" : res.sent > 0 ? "partial" : "failed",
        });
        if (logErr) console.warn("[sms_logs insert]", logErr.message, "— run migration_sms_logs_fix.sql in Supabase");
      } catch (e) {
        console.warn("[sms_logs insert]", e.message);
      }

      setResult({ sent: res.sent, failed: res.failed, errors: res.errors });
      if (res.sent > 0) showToast(`✅ Sent to ${res.sent} recipient${res.sent !== 1 ? "s" : ""}!`);
      if (res.failed > 0) showToast(`⚠️ ${res.failed} failed to send`);
    } catch (e) {
      showToast("Send failed — please try again ❌");
    } finally {
      setSending(false);
    }
  };

  // ── Result screen ──────────────────────────────────────────────────────────
  if (result) return (
    <div className="page">
      <div style={{ textAlign: "center", padding: "60px 24px 24px" }}>
        <div style={{ fontSize: 72 }}>{result.failed === 0 ? "✅" : "⚠️"}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: result.failed === 0 ? "var(--success)" : "var(--accent)", marginTop: 16 }}>
          {result.failed === 0 ? "Messages Sent!" : "Partially Sent"}
        </div>
        <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: "var(--success)" }}>{result.sent}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Sent</div>
          </div>
          {result.failed > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 700, color: "var(--danger)" }}>{result.failed}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Failed</div>
            </div>
          )}
        </div>
        <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 13 }}>
          Credits remaining: {church?.sms_credits ?? 0}
        </p>
        {result.errors.length > 0 && (
          <div style={{ background: "#fce8e8", borderRadius: 12, padding: 14, marginTop: 16, textAlign: "left", fontSize: 12 }}>
            <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 6 }}>Failed numbers:</div>
            {result.errors.slice(0, 5).map((e, i) => <div key={i} style={{ color: "var(--danger)" }}>{e}</div>)}
          </div>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center" }}>
          <button className="btn bg" onClick={() => navigate("/messaging/history")}>View History</button>
          <button className="btn bp" onClick={() => { setResult(null); setMessage(""); }}>Send Another</button>
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
        <p>Credits available: <strong>{credits}</strong></p>
      </div>
      <div className="pc">

        {/* ── No credits warning ── */}
        {credits === 0 && (
          <div style={{ background: "#fce8e8", border: "1.5px solid var(--danger)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>⚠️ No credits</div>
            <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 10 }}>You need credits to send SMS. Buy some first.</div>
            <button className="btn bd" style={{ fontSize: 13, padding: "9px 16px" }} onClick={() => navigate("/messaging/credits")}>
              💳 Buy Credits
            </button>
          </div>
        )}

        {/* ── Step 1: Recipients ── */}
        <div className="stitle">1. Who are you messaging?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {RECIPIENT_TYPES.map(rt => (
            <div key={rt.key} onClick={() => setRecipientType(rt.key)} style={{
              background: "var(--surface)", borderRadius: 12, padding: "12px 10px", cursor: "pointer",
              border: `2px solid ${recipientType === rt.key ? "var(--brand)" : "var(--border)"}`,
              transition: "all .12s",
            }}>
              <div style={{ fontSize: 22, marginBottom: 5 }}>{rt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{rt.label}</div>
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div className="fg">
              <label className="fl">Name</label>
              <input className="fi" placeholder="Full name" value={singleName} onChange={e => setSingleName(e.target.value)} />
            </div>
            <div className="fg">
              <label className="fl">Phone *</label>
              <input className="fi" placeholder="08012345678" value={singlePhone} onChange={e => setSinglePhone(e.target.value)} />
            </div>
          </div>
        )}

        {recipients.length > 0 && (
          <div className="csm" style={{ marginBottom: 16, background: "#f0fdf6", border: "1px solid #c8ebd8" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "var(--success)" }}>
              ✓ {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} selected
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
              {recipients.slice(0, 3).map(r => r.name).join(", ")}
              {recipients.length > 3 ? ` +${recipients.length - 3} more` : ""}
            </div>
          </div>
        )}

        {/* ── Step 2: Sender ID ── */}
        <div className="stitle">2. Sender ID</div>
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: "var(--brand)" }}>{activeSenderId}</span>
              {approvedId
                ? <span style={{ background: "#d4f1e4", color: "#1a6640", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>Custom · Approved</span>
                : <span style={{ background: "var(--surface)", color: "var(--muted)", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>Default</span>
              }
            </div>
            {pendingId && (
              <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>
                ⏳ "{pendingId}" pending approval (4–6 days)
              </div>
            )}
            {!approvedId && !pendingId && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                Want a custom sender ID? Request one in Settings.
              </div>
            )}
          </div>
          <button className="btn bg" style={{ fontSize: 12, padding: "6px 12px", flexShrink: 0 }}
            onClick={() => navigate("/settings")}>
            Change
          </button>
        </div>

        {/* ── Step 3: Template ── */}
        <div className="stitle">3. Choose a Template (optional)</div>
        <div className="fg" style={{ marginBottom: 16 }}>
          <select className="fi" value={templateId} onChange={e => handleTemplate(e.target.value)}>
            <option value="">— Write your own message —</option>
            {SMS_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>

        {/* ── Step 4: Message ── */}
        <div className="stitle">4. Your Message</div>
        <div className="fg" style={{ marginBottom: 8 }}>
          <textarea className="fi" rows={5}
            placeholder="Type your message… Use {name} to personalise each message"
            value={message} onChange={e => setMessage(e.target.value)}
            style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <span className="fh">Use {"{name}"} to personalise</span>
          <span style={{ fontSize: 12, color: message.length > 320 ? "var(--danger)" : "var(--muted)", fontWeight: 600 }}>
            {message.length} chars · {segCount} SMS segment{segCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── Credit cost ── */}
        {recipients.length > 0 && message && (
          <div className="card" style={{ marginBottom: 20, background: hasEnough ? "var(--surface2)" : "#fce8e8", boxShadow: "none", border: `1.5px solid ${hasEnough ? "var(--border)" : "var(--danger)"}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Cost estimate</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {recipients.length} recipients × {segCount} segment{segCount !== 1 ? "s" : ""} × {CREDITS_PER_SMS} credits
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: hasEnough ? "var(--brand)" : "var(--danger)" }}>
                  {creditCost}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>credits</div>
              </div>
            </div>
            {!hasEnough && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 13, color: "var(--danger)", marginBottom: 8 }}>
                  Need {creditCost - credits} more credits.
                </div>
                <button className="btn bd" style={{ fontSize: 13, padding: "8px 14px" }} onClick={() => navigate("/messaging/credits")}>
                  💳 Buy Credits
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Send button ── */}
        <button className="btn bp blg"
          disabled={!message.trim() || recipients.length === 0 || !hasEnough || sending}
          onClick={handleSend}
          style={{ opacity: (!message.trim() || recipients.length === 0 || !hasEnough) ? .5 : 1 }}>
          {sending
            ? `Sending to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}…`
            : `📤 Send to ${recipients.length > 0 ? recipients.length : "—"} Recipient${recipients.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}