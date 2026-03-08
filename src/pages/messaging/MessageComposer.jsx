// src/pages/messaging/MessageComposer.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../services/supabaseClient";
import { sendSms } from "../../services/sms";
import { SMS_TEMPLATES } from "../../data/seed";
import { smsCount } from "../../lib/helpers";
import { ChevL } from "../../components/ui/Icons";

const CREDITS_PER_SMS = 10;

const RECIPIENT_TYPES = [
  { key: "absentees", label: "Absentees",   icon: "📋", desc: "Absent from last service" },
  { key: "attendees", label: "Attendees",   icon: "🙏", desc: "Came to last service"     },
  { key: "group",     label: "Group",       icon: "👥", desc: "A specific group"         },
  { key: "all",       label: "All Members", icon: "📣", desc: "Entire member list"       },
  { key: "single",    label: "One Person",  icon: "📱", desc: "Single phone number"      },
];

// ── Custom template storage ───────────────────────────────────────────────────
function loadCustomTemplates() {
  try { return JSON.parse(localStorage.getItem("ct_sms_templates") || "[]"); }
  catch { return []; }
}
function saveCustomTemplates(tpls) {
  localStorage.setItem("ct_sms_templates", JSON.stringify(tpls));
}

export default function MessageComposer({ groups = [], members = [], attendanceHistory = [], showToast }) {
  const navigate           = useNavigate();
  const [params, setParams] = useSearchParams();
  const { church, updateChurch } = useAuth();

  const [recipientType,    setRecipientType]   = useState(params.get("type") || "absentees");
  const [selectedGroupId,  setSelectedGroupId] = useState("");
  const [singlePhone,      setSinglePhone]     = useState("");
  const [singleName,       setSingleName]      = useState("");
  const [message,          setMessage]         = useState("");
  const [sending,          setSending]         = useState(false);
  const [result,           setResult]          = useState(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName,     setTemplateName]    = useState("");
  const [customTemplates,  setCustomTemplates] = useState(loadCustomTemplates);
  const [showTemplates,    setShowTemplates]   = useState(false);

  // ── Keep URL in sync with recipientType without remounting ───────────────
  useEffect(() => {
    const current = params.get("type");
    if (current !== recipientType) {
      setParams({ type: recipientType }, { replace: true });
    }
  }, [recipientType]);

  // ── Sender ID ─────────────────────────────────────────────────────────────
  const approvedId   = church?.sms_sender_id_status === "approved" ? church.sms_sender_id : null;
  const pendingId    = church?.sms_sender_id_status === "pending"  ? church.sms_sender_id : null;
  const activeSender = approvedId || "ChurchTrakr";

  // ── Compute recipients ────────────────────────────────────────────────────
  const recipients = useMemo(() => {
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
  }, [recipientType, selectedGroupId, singlePhone, singleName, members, attendanceHistory]);

  const segCount   = smsCount(message);
  const creditCost = recipients.length * segCount * CREDITS_PER_SMS;
  const credits    = church?.sms_credits ?? 0;
  const hasEnough  = credits >= creditCost;

  // ── All templates (built-in + custom) ────────────────────────────────────
  const allTemplates = [
    ...SMS_TEMPLATES,
    { id: "t-att1", label: "Thanks for attending",      text: "Hi {name}! 🙏 Thank you for being with us today. Your presence blesses our church family. See you next Sunday!" },
    { id: "t-att2", label: "Attendee follow-up",        text: "Dear {name}, it was wonderful worshipping with you today. We pray God's blessings on your week ahead!" },
    { id: "t-rem1", label: "Sunday reminder",           text: "Hi {name}! Just a reminder — Sunday service is at 9:00 AM this week. We look forward to seeing you. God bless! 🙏" },
    { id: "t-eve1", label: "Upcoming event",            text: "Dear {name}, we have a special event this week. Don't miss it! Check with your cell leader for details. Blessings!" },
    ...customTemplates.map(t => ({ ...t, isCustom: true })),
  ];

  const applyTemplate = (tpl) => {
    setMessage(tpl.text);
    setShowTemplates(false);
  };

  const saveTemplate = () => {
    if (!templateName.trim() || !message.trim()) return;
    const tpl = { id: `custom-${Date.now()}`, label: templateName.trim(), text: message.trim(), isCustom: true };
    const updated = [...customTemplates, tpl];
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
    showToast("Template saved! ✅");
    setShowSaveTemplate(false);
    setTemplateName("");
  };

  const deleteCustomTemplate = (id) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    saveCustomTemplates(updated);
    showToast("Template deleted");
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim())          { showToast("Please write a message first"); return; }
    if (recipients.length === 0)  { showToast("No recipients with phone numbers found"); return; }
    if (!hasEnough)               { showToast(`Not enough credits — need ${creditCost}, have ${credits}`); return; }

    setSending(true);
    try {
      const raw = await sendSms({ recipients, message, senderId: activeSender, type: recipientType });
      const res = { sent: raw.sent ?? 0, failed: raw.failed ?? 0, errors: raw.error ? [raw.error] : [] };
      if (!raw.success && raw.error) throw new Error(raw.error);

      // Update credits locally (edge function also updates server-side)
      const newCredits = Math.max(0, credits - (res.sent * segCount * CREDITS_PER_SMS));
      await updateChurch({ sms_credits: newCredits });

      setResult({ sent: res.sent, failed: res.failed, errors: res.errors });
    } catch (e) {
      showToast("Send failed — please try again ❌");
      console.error("[MessageComposer]", e);
    } finally {
      setSending(false);
    }
  };

  // ── Result screen ─────────────────────────────────────────────────────────
  if (result) return (
    <div className="page">
      <div style={{ textAlign: "center", padding: "60px 24px 24px" }}>
        <div style={{ fontSize: 64 }}>{result.failed === 0 ? "✅" : "⚠️"}</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: result.failed === 0 ? "var(--success)" : "var(--accent)", marginTop: 12 }}>
          {result.failed === 0 ? "Messages Sent!" : "Partially Sent"}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: "var(--success)" }}>{result.sent}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Delivered</div>
          </div>
          {result.failed > 0 && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: "var(--danger)" }}>{result.failed}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Failed</div>
            </div>
          )}
        </div>
        <p style={{ color: "var(--muted)", marginTop: 14, fontSize: 13 }}>
          {(credits).toLocaleString()} credits remaining
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 28, justifyContent: "center" }}>
          <button className="btn bg" onClick={() => navigate("/messaging/history")}>View History</button>
          <button className="btn bp" onClick={() => { setResult(null); setMessage(""); }}>Send Another</button>
        </div>
      </div>
    </div>
  );

  const currentType = RECIPIENT_TYPES.find(t => t.key === recipientType);

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => navigate("/messaging")}>
          <ChevL /> Back
        </button>
        <h1>Compose Message</h1>
        <p style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--brand)", fontWeight: 700 }}>{credits.toLocaleString()}</span> credits available
        </p>
      </div>

      <div className="pc">
        {/* ── No credits warning ── */}
        {credits === 0 && (
          <div style={{ background: "#fce8e8", border: "1.5px solid var(--danger)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, color: "var(--danger)", marginBottom: 6 }}>⚠️ No credits</div>
            <button className="btn bd" style={{ fontSize: 13 }} onClick={() => navigate("/messaging/credits")}>
              💳 Buy Credits
            </button>
          </div>
        )}

        {/* ── Step 1: Who ── */}
        <div className="stitle">1 · Who are you messaging?</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {RECIPIENT_TYPES.map(rt => (
            <div key={rt.key}
              onClick={() => setRecipientType(rt.key)}
              style={{
                background: "var(--surface)", borderRadius: 14, padding: "12px 10px", cursor: "pointer",
                border: `2px solid ${recipientType === rt.key ? "var(--brand)" : "var(--border)"}`,
                transition: "all .12s",
              }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{rt.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{rt.label}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{rt.desc}</div>
            </div>
          ))}
        </div>

        {/* Group picker */}
        {recipientType === "group" && (
          <div className="fg" style={{ marginBottom: 12 }}>
            <label className="fl">Select Group</label>
            <select className="fi" value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
              <option value="">Choose a group…</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        )}

        {/* Single fields */}
        {recipientType === "single" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
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

        {/* Recipients count badge */}
        {recipients.length > 0 && (
          <div style={{ background: "#f0fdf6", border: "1px solid #c8ebd8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--success)" }}>
                {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
              </span>
              <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>
                {recipients.slice(0, 2).map(r => r.name).join(", ")}{recipients.length > 2 ? ` +${recipients.length - 2} more` : ""}
              </span>
            </div>
          </div>
        )}

        {/* ── Step 2: Message ── */}
        <div className="stitle" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>2 · Your Message</span>
          <button
            style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "var(--brand)", fontFamily: "'DM Sans',sans-serif" }}
            onClick={() => setShowTemplates(!showTemplates)}>
            {showTemplates ? "Hide" : "📄 Templates"}
          </button>
        </div>

        {/* Template picker */}
        {showTemplates && (
          <div style={{ background: "var(--surface2)", borderRadius: 14, padding: 12, marginBottom: 14, maxHeight: 320, overflowY: "auto" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Built-in</div>
            {allTemplates.filter(t => !t.isCustom).map(t => (
              <div key={t.id} onClick={() => applyTemplate(t)}
                style={{ padding: "11px 12px", borderRadius: 10, marginBottom: 6, cursor: "pointer", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, wordBreak: "break-word" }}>{t.text}</div>
              </div>
            ))}
            {customTemplates.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", margin: "12px 0 8px" }}>My Templates</div>
                {customTemplates.map(t => (
                  <div key={t.id} style={{ padding: "11px 12px", borderRadius: 10, marginBottom: 6, background: "var(--surface)", border: "1px solid var(--brand)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ flex: 1, cursor: "pointer" }} onClick={() => applyTemplate(t)}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, wordBreak: "break-word" }}>{t.text}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(t.id); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 16, flexShrink: 0, padding: "0 4px" }}>🗑</button>
                  </div>
                ))}
              </>
            )}
            {/* Link to manage templates in settings */}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 10, paddingTop: 10, textAlign: "center" }}>
              <button
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--brand)", cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}
                onClick={() => { setShowTemplates(false); navigate("/settings?tab=templates"); }}>
                ⚙️ Manage Templates in Settings
              </button>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="fg" style={{ marginBottom: 6 }}>
          <textarea className="fi" rows={5}
            placeholder={"Write your message…\n\nUse {name} to personalise each message"}
            value={message} onChange={e => setMessage(e.target.value)}
            style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span className="fh">Use {"{name}"} to personalise each message</span>
          <span style={{ fontSize: 12, color: message.length > 320 ? "var(--danger)" : "var(--muted)", fontWeight: 600 }}>
            {message.length} · {segCount} seg
          </span>
        </div>

        {/* Save as template */}
        {message.trim().length > 10 && (
          <div style={{ marginBottom: 16 }}>
            {!showSaveTemplate
              ? <button style={{ background: "none", border: "none", fontSize: 12, color: "var(--brand)", cursor: "pointer", fontWeight: 600, padding: 0, fontFamily: "'DM Sans',sans-serif" }}
                  onClick={() => setShowSaveTemplate(true)}>
                  + Save as template
                </button>
              : <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="fi" placeholder="Template name…" value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    style={{ flex: 1, padding: "7px 12px", fontSize: 13 }} />
                  <button className="btn bp" style={{ padding: "7px 14px", fontSize: 12 }} onClick={saveTemplate}>Save</button>
                  <button className="btn bg" style={{ padding: "7px 10px", fontSize: 12 }} onClick={() => setShowSaveTemplate(false)}>✕</button>
                </div>
            }
          </div>
        )}

        {/* ── Sender ID row ── */}
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13 }}>
            Sending as <strong style={{ color: "var(--brand)" }}>{activeSender}</strong>
            {approvedId && <span style={{ marginLeft: 6, background: "#d4f1e4", color: "#1a6640", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>Custom</span>}
            {pendingId && <span style={{ marginLeft: 6, fontSize: 12, color: "#92400e" }}>· "{pendingId}" pending</span>}
          </div>
          <button className="btn bg" style={{ fontSize: 11, padding: "5px 10px" }} onClick={() => navigate("/settings")}>Change</button>
        </div>

        {/* ── Credit cost ── */}
        {recipients.length > 0 && message && (
          <div style={{
            borderRadius: 14, padding: "14px 16px", marginBottom: 20,
            background: hasEnough ? "var(--surface2)" : "#fce8e8",
            border: `1.5px solid ${hasEnough ? "var(--border)" : "var(--danger)"}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Cost</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {recipients.length} × {segCount} seg × {CREDITS_PER_SMS} credits
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: hasEnough ? "var(--brand)" : "var(--danger)" }}>
                  {creditCost.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>credits</div>
              </div>
            </div>
            {!hasEnough && (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--danger)" }}>Need {(creditCost - credits).toLocaleString()} more</span>
                <button className="btn bd" style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => navigate("/messaging/credits")}>Buy Credits</button>
              </div>
            )}
          </div>
        )}

        {/* ── Send ── */}
        <button className="btn bp blg"
          disabled={!message.trim() || recipients.length === 0 || !hasEnough || sending}
          onClick={handleSend}
          style={{ opacity: (!message.trim() || recipients.length === 0 || !hasEnough || sending) ? .5 : 1 }}>
          {sending
            ? `⏳ Sending to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}…`
            : `📤 Send to ${recipients.length || "—"} Recipient${recipients.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}