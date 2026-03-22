// src/pages/Absentees.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { fmtDate } from "../lib/helpers";
import { CallIco, WaIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";
import { sendSms } from "../services/sms";
import { useAuth } from "../hooks/useAuth";
import { fetchFollowUpData, saveFollowUpData } from "../services/api";

const CREDITS_PER_SMS = 10;
const WA_COMMUNITY = "https://whatsapp.com/channel/0029VbCBzbWJ3juwNfyjIn3Y";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSundays(count = 12) {
  const result = [];
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  for (let i = 0; i < count; i++) {
    result.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - 7);
  }
  return result;
}

// ── SMS Modal ─────────────────────────────────────────────────────────────────
function SmsModal({ absentees, members, church, onClose, showToast, onCreditUpdate }) {
  const [sel, setSel] = useState(absentees.map(a => a.memberId));
  const [txt, setTxt] = useState("Dear {name}, we missed you at service this Sunday. We love you and look forward to seeing you soon! 🙏");
  const [sending, setSending] = useState(false);

  const credits    = church?.sms_credits ?? 0;
  const recipients = absentees
    .filter(a => sel.includes(a.memberId))
    .map(a => ({ name: a.name, phone: members.find(m => m.id === a.memberId)?.phone || "" }))
    .filter(r => r.phone);
  const creditCost = recipients.length * CREDITS_PER_SMS;
  const hasEnough  = credits >= creditCost;
  const allSel     = sel.length === absentees.length;

  const handleSend = async () => {
    if (!txt.trim())             { showToast("Please write a message"); return; }
    if (recipients.length === 0) { showToast("No recipients have phone numbers saved"); return; }
    if (!hasEnough)              { showToast(`Need ${creditCost} credits — you have ${credits}`); return; }
    setSending(true);
    try {
      const result = await sendSms({ recipients, message: txt, type: "absentees" });
      if (result.success === false && result.error) throw new Error(result.error);
      const sent = result.sent ?? recipients.length;
      if (sent > 0 && onCreditUpdate) onCreditUpdate(Math.max(0, credits - sent * CREDITS_PER_SMS));
      showToast(`✅ Sent to ${sent} absentee${sent !== 1 ? "s" : ""}!`);
      onClose();
    } catch (e) {
      showToast("Send failed — please try again ❌");
    } finally { setSending(false); }
  };

  return (
    <Modal title="Message Absentees" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
            Recipients <span style={{ color: "var(--muted)", fontWeight: 500 }}>({sel.length}/{absentees.length})</span>
          </p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12, minHeight: 32 }}
            onClick={() => setSel(allSel ? [] : absentees.map(a => a.memberId))}>
            {allSel ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div style={{ maxHeight: 200, overflowY: "auto", borderRadius: 10, border: "1px solid var(--border)" }}>
          {absentees.map((a, i) => {
            const hasPhone = !!members.find(m => m.id === a.memberId)?.phone;
            const checked  = sel.includes(a.memberId);
            return (
              <label key={a.memberId} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px",
                borderBottom: i < absentees.length - 1 ? "1px solid var(--border)" : "none",
                cursor: "pointer",
                background: checked ? "rgba(26,58,42,.03)" : "transparent",
              }}>
                <input type="checkbox" checked={checked}
                  onChange={() => setSel(s => s.includes(a.memberId) ? s.filter(x => x !== a.memberId) : [...s, a.memberId])}
                  style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  {!hasPhone && <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 2 }}>⚠️ No phone number</div>}
                </div>
                {checked && hasPhone && <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700 }}>✓</span>}
              </label>
            );
          })}
        </div>
      </div>

      <div className="fg" style={{ marginBottom: 14 }}>
        <label className="fl">Message</label>
        <textarea className="fi" rows={4} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} to personalise each message</p>
      </div>

      {recipients.length > 0 && (
        <div style={{
          background: hasEnough ? "var(--surface2)" : "var(--danger-bg)",
          borderRadius: 10, padding: "10px 14px", marginBottom: 14,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          border: `1px solid ${hasEnough ? "var(--border)" : "var(--danger)"}`,
        }}>
          <span style={{ fontSize: 13, color: hasEnough ? "var(--muted)" : "var(--danger)" }}>
            {recipients.length} recipient{recipients.length !== 1 ? "s" : ""} × {CREDITS_PER_SMS} credits
          </span>
          <span style={{ fontWeight: 800, fontSize: 15, color: hasEnough ? "var(--brand)" : "var(--danger)" }}>
            {creditCost} credits
          </span>
        </div>
      )}

      {!hasEnough && recipients.length > 0 && (
        <div style={{ background: "var(--danger-bg)", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--danger)", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠️ Not enough credits</div>
          <div>You have <strong>{credits}</strong> but need <strong>{creditCost}</strong>. Top up to continue.</div>
        </div>
      )}

      <button className="btn ba blg"
        disabled={sel.length === 0 || sending || !hasEnough || recipients.length === 0}
        onClick={handleSend}>
        {sending ? `Sending to ${recipients.length}…` : `📤 Send to ${recipients.length} Member${recipients.length !== 1 ? "s" : ""}`}
      </button>
    </Modal>
  );
}

// ── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({ name, current, onClose, onSave, saving }) {
  const [note, setNote] = useState(current || "");
  return (
    <Modal title={`Note — ${name}`} onClose={onClose}>
      <div className="fstack" style={{ paddingBottom: 8 }}>
        <div className="fg">
          <label className="fl">Follow-up note</label>
          <textarea className="fi" rows={4}
            placeholder="e.g. Called at 3pm, no answer. Will try again Sunday."
            value={note} onChange={e => setNote(e.target.value)}
            style={{ resize: "vertical" }}
            autoFocus
          />
          <p className="fh">This note is visible to all admins on your account</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => onSave(note)} disabled={saving}>
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Absentee Card ─────────────────────────────────────────────────────────────
function AbsenteeCard({ record, member, followUp, onToggleReached, onSaveNote }) {
  const [showNote,  setShowNote]  = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [toggling, setToggling]   = useState(false);

  const phone     = member?.phone || record.phone || "";
  const hasPhone  = !!phone;
  const reached   = !!followUp?.reached;
  const intlPhone = phone.replace(/\D/g, "").replace(/^0/, "234");
  const waMsg     = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    await onToggleReached(!reached);
    setToggling(false);
  };

  const handleSaveNote = async (note) => {
    setSavingNote(true);
    await onSaveNote(note);
    setSavingNote(false);
    setShowNote(false);
  };

  return (
    <>
      <div style={{
        background: reached ? "#f0fdf6" : "var(--surface)",
        border: `1.5px solid ${reached ? "var(--success)" : "var(--border)"}`,
        borderRadius: 16, padding: "14px 15px", marginBottom: 10,
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        boxShadow: reached ? "none" : "var(--sh)",
        opacity: reached ? 0.82 : 1,
      }}>
        {/* Top row: name + reached toggle */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          {/* Avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: reached ? "var(--success-bg)" : "var(--surface2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 16, color: reached ? "var(--success)" : "var(--muted)",
            border: `1.5px solid ${reached ? "var(--success)" : "var(--border)"}`,
          }}>
            {record.name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontWeight: 700, fontSize: 15, lineHeight: 1.3,
              color: reached ? "var(--muted)" : "var(--text)",
              textDecoration: reached ? "line-through" : "none",
            }}>
              {record.name}
            </div>
            {phone
              ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{phone}</div>
              : <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 2, fontWeight: 600 }}>No phone saved</div>
            }
          </div>

          {/* Reached toggle button */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
              background: reached ? "var(--success)" : "var(--surface2)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              cursor: toggling ? "wait" : "pointer",
              transition: "all .2s cubic-bezier(.4,0,.2,1)",
              gap: 2,
            }}>
            {toggling
              ? <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
              : <span style={{ fontSize: 18, lineHeight: 1, color: reached ? "#fff" : "var(--muted)" }}>
                  {reached ? "✓" : "○"}
                </span>
            }
            <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: reached ? "rgba(255,255,255,.9)" : "var(--muted)", lineHeight: 1 }}>
              {reached ? "Done" : "Mark"}
            </span>
          </button>
        </div>

        {/* Note display */}
        {followUp?.note && (
          <div style={{
            fontSize: 12.5, color: "var(--text-2)", background: "#fffbeb",
            border: "1px solid #fde68a", borderRadius: 10,
            padding: "8px 12px", marginBottom: 10,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>📝</span>
            <span style={{ lineHeight: 1.5, fontStyle: "italic" }}>{followUp.note}</span>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 7 }}>
          {hasPhone && (
            <>
              <a href={`tel:${phone}`}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 5, padding: "9px 6px", borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                  textDecoration: "none", background: "#eff6ff", color: "#1d4ed8",
                  border: "1.5px solid #bfdbfe", transition: "var(--transition)",
                }}>
                <CallIco s={13} /> Call
              </a>
              <a href={`https://wa.me/${intlPhone}?text=${waMsg}`} target="_blank" rel="noreferrer"
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 5, padding: "9px 6px", borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                  textDecoration: "none", background: "#f0fdf4", color: "#15803d",
                  border: "1.5px solid #86efac", transition: "var(--transition)",
                }}>
                <WaIco s={13} /> WhatsApp
              </a>
            </>
          )}
          <button onClick={() => setShowNote(true)}
            style={{
              flex: hasPhone ? 0 : 1, width: hasPhone ? 44 : undefined,
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: hasPhone ? 0 : 6, padding: "9px",
              borderRadius: 10, fontSize: hasPhone ? 16 : 12.5, fontWeight: 600,
              background: followUp?.note ? "#fffbeb" : "var(--surface2)",
              border: `1.5px solid ${followUp?.note ? "#fde68a" : "var(--border)"}`,
              cursor: "pointer", color: followUp?.note ? "#92400e" : "var(--muted)",
              transition: "var(--transition)",
            }}>
            📝
            {!hasPhone && <span>{followUp?.note ? "Edit note" : "Add note"}</span>}
          </button>
        </div>
      </div>

      {showNote && (
        <NoteModal
          name={record.name}
          current={followUp?.note}
          onClose={() => setShowNote(false)}
          onSave={handleSaveNote}
          saving={savingNote}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Absentees({ groups, members, attendanceHistory, showToast }) {
  const { church, updateChurch } = useAuth();

  // ── Follow-up state — loaded from Supabase, synced back on every change ──
  const [followUpData, setFollowUpData] = useState({});
  const [fuLoading, setFuLoading]       = useState(true);
  const saveTimer = useRef(null);

  // Load follow-up data from DB on mount
  useEffect(() => {
    if (!church?.id) return;
    setFuLoading(true);
    fetchFollowUpData(church.id).then(data => {
      setFollowUpData(data || {});
      setFuLoading(false);
    });
  }, [church?.id]);

  // Debounced save — batches rapid toggles into one DB write
  const persistFollowUp = useCallback((nextData) => {
    if (!church?.id) return;
    // Always write to localStorage immediately
    try { localStorage.setItem("ct_followup", JSON.stringify(nextData)); } catch {}
    // Debounce Supabase write by 600ms to batch rapid taps
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveFollowUpData(church.id, nextData);
    }, 600);
  }, [church?.id]);

  const updateFollowUpKey = useCallback((key, updater) => {
    setFollowUpData(prev => {
      const current = prev[key] || {};
      const next = { ...prev, [key]: { ...current, ...updater(current), updatedAt: new Date().toISOString() } };
      persistFollowUp(next);
      return next;
    });
  }, [persistFollowUp]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selDate, setSelDate] = useState(() => {
    if (attendanceHistory?.length > 0) {
      return [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date))[0].date;
    }
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  });
  const [selGroupId,   setSelGroupId]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [smsModal,     setSmsModal]     = useState(null);
  const [dateOpen,     setDateOpen]     = useState(false);

  const allDates = useMemo(() => {
    const fromHistory = new Set(attendanceHistory.map(s => s.date));
    const sundays = getSundays(12);
    return [...new Set([...sundays, ...fromHistory])].sort((a, b) => b.localeCompare(a));
  }, [attendanceHistory]);

  const datesWithData = useMemo(() => new Set(attendanceHistory.map(s => s.date)), [attendanceHistory]);
  const dateIdx = selDate ? allDates.indexOf(selDate) : -1;

  const absenteeRows = useMemo(() => {
    const filteredGroups = selGroupId === "all" ? groups : groups.filter(g => String(g.id) === String(selGroupId));
    const rows = [];
    for (const group of filteredGroups) {
      const sessions = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (!sessions.length) continue;
      const session = selDate ? sessions.find(s => s.date === selDate) : sessions[0];
      if (!session) continue;
      const absent = session.records.filter(r => r.present === false);
      if (!absent.length) continue;
      rows.push({ group, session, absentees: absent });
    }
    return rows;
  }, [groups, attendanceHistory, selGroupId, selDate]);

  const totalAbsent  = absenteeRows.reduce((s, r) => s + r.absentees.length, 0);
  const totalReached = absenteeRows.reduce((s, r) =>
    s + r.absentees.filter(a => followUpData[`${r.session.id}_${a.memberId}`]?.reached).length, 0);
  const totalPending = totalAbsent - totalReached;
  const followUpRate = totalAbsent > 0 ? Math.round((totalReached / totalAbsent) * 100) : 0;

  const getFiltered = (absentees, session) => absentees.filter(a => {
    if (filterStatus === "all") return true;
    const reached = !!followUpData[`${session.id}_${a.memberId}`]?.reached;
    return filterStatus === "pending" ? !reached : reached;
  });

  return (
    <div className="page">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Hero header ── */}
      <div style={{
        background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding: "max(env(safe-area-inset-top,32px),32px) 22px 26px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(201,168,76,.05)", pointerEvents: "none" }} />

        <div style={{ position: "relative" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, fontWeight: 800, color: "#fff", letterSpacing: "-.015em" }}>Absentees</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.52)", marginTop: 5, fontWeight: 500 }}>
            Follow up with members who missed service
          </div>

          {/* Progress ring summary */}
          {totalAbsent > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
              {/* Mini progress ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width={64} height={64} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={32} cy={32} r={26} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={6} />
                  <circle cx={32} cy={32} r={26} fill="none"
                    stroke={followUpRate >= 80 ? "#6ee7b7" : followUpRate >= 50 ? "#fcd34d" : "#fca5a5"}
                    strokeWidth={6}
                    strokeDasharray={`${2 * Math.PI * 26 * followUpRate / 100} ${2 * Math.PI * 26}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray .6s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 14, color: "#fff" }}>{followUpRate}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                  {totalReached} of {totalAbsent} followed up
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
                  {totalPending > 0 ? `${totalPending} still need a check-in` : "All absentees reached! 🎉"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pc">

        {/* ── Stat chips ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Absent",  val: totalAbsent,  color: "var(--danger)",  bg: "var(--danger-bg)",  border: "#fca5a5" },
            { label: "Reached", val: totalReached, color: "var(--success)", bg: "var(--success-bg)", border: "#86efac" },
            { label: "Pending", val: totalPending, color: "var(--warning)", bg: "#fef3c7",           border: "#fcd34d" },
          ].map(s => (
            <div key={s.label} onClick={() => {
              if (s.label === "Reached") setFilterStatus(filterStatus === "reached" ? "all" : "reached");
              if (s.label === "Pending") setFilterStatus(filterStatus === "pending" ? "all" : "pending");
            }} style={{
              background: s.bg, borderRadius: 14, padding: "13px 10px", textAlign: "center",
              border: `1.5px solid ${s.border}`,
              cursor: s.label !== "Absent" ? "pointer" : "default",
              transform: filterStatus === s.label.toLowerCase() ? "scale(.97)" : "scale(1)",
              transition: "var(--transition)",
              boxShadow: filterStatus === s.label.toLowerCase() ? `0 0 0 2px ${s.color}` : "none",
            }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 26, color: s.color, lineHeight: 1, letterSpacing: "-.02em" }}>{s.val}</div>
              <div style={{ fontSize: 10.5, color: s.color, marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", opacity: .85 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Date navigator ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
            Viewing service date
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => { const next = Math.min(dateIdx + 1, allDates.length - 1); setSelDate(allDates[next]); }}
              disabled={dateIdx >= allDates.length - 1}
              style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: dateIdx >= allDates.length - 1 ? .3 : 1, flexShrink: 0, boxShadow: "var(--sh)" }}>‹</button>
            <button onClick={() => setDateOpen(v => !v)} style={{
              flex: 1, padding: "11px 14px", borderRadius: 10,
              border: `2px solid var(--brand)`,
              background: "var(--brand)", color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "var(--transition)",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span>
                <span>{selDate ? fmtDate(selDate) : "All dates"}</span>
                {datesWithData.has(selDate) && (
                  <span style={{ fontSize: 10, background: "rgba(255,255,255,.2)", borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>Has data</span>
                )}
              </span>
              <span style={{ fontSize: 10, opacity: .7, fontWeight: 400 }}>{dateOpen ? "▲" : "▼"}</span>
            </button>
            <button
              onClick={() => { if (dateIdx > 0) setSelDate(allDates[dateIdx - 1]); }}
              disabled={dateIdx <= 0}
              style={{ width: 42, height: 42, borderRadius: 10, border: "1px solid var(--border)", background: "var(--surface)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: dateIdx <= 0 ? .3 : 1, flexShrink: 0, boxShadow: "var(--sh)" }}>›</button>
          </div>

          {/* Date picker dropdown */}
          {dateOpen && (
            <div style={{
              marginTop: 8, background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 16, padding: 16, boxShadow: "var(--sh-lg)",
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {allDates.slice(0, 10).map(d => {
                  const hasData = datesWithData.has(d);
                  const isSel   = selDate === d;
                  return (
                    <button key={d} onClick={() => { setSelDate(d); setDateOpen(false); }}
                      style={{
                        padding: "11px 10px", borderRadius: 12, cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif", textAlign: "center",
                        background: isSel ? "var(--brand)" : hasData ? "#f0fdf6" : "var(--surface2)",
                        border: `1.5px solid ${isSel ? "var(--brand)" : hasData ? "var(--success)" : "var(--border)"}`,
                        color: isSel ? "#fff" : "var(--text)",
                        transition: "var(--transition)",
                      }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtDate(d)}</div>
                      <div style={{ fontSize: 10, marginTop: 3, fontWeight: 600, color: isSel ? "rgba(255,255,255,.7)" : hasData ? "var(--success)" : "var(--muted)" }}>
                        {hasData ? "✓ has data" : "no data"}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="fg">
                <label className="fl" style={{ fontSize: 11 }}>Custom date</label>
                <input className="fi" type="date" style={{ minHeight: 42, fontSize: 14 }}
                  onChange={e => { if (e.target.value) { setSelDate(e.target.value); setDateOpen(false); } }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <select className="fi" value={selGroupId} onChange={e => setSelGroupId(e.target.value)}
            style={{ flex: 1, minHeight: 42, fontSize: 13 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: 10, padding: 3, flexShrink: 0 }}>
            {["all", "pending", "reached"].map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                style={{
                  padding: "7px 12px", borderRadius: 8, border: "none",
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 12, cursor: "pointer",
                  background: filterStatus === f ? "var(--surface)" : "transparent",
                  color: filterStatus === f ? "var(--brand)" : "var(--muted)",
                  boxShadow: filterStatus === f ? "var(--sh)" : "none",
                  transition: "var(--transition)",
                  textTransform: "capitalize",
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Loading indicator for follow-up data */}
        {fuLoading && (
          <div style={{ textAlign: "center", padding: "8px 0 14px", fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, border: "2px solid var(--border)", borderTop: "2px solid var(--brand)", borderRadius: "50%", animation: "spin .6s linear infinite" }} />
            Loading follow-up data…
          </div>
        )}

        {/* ── Empty state ── */}
        {absenteeRows.length === 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>
              {attendanceHistory.length === 0 ? "📋" : "🎉"}
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 19, color: "var(--brand)", marginBottom: 8 }}>
              {attendanceHistory.length === 0
                ? "No attendance data yet"
                : selDate
                  ? `No absentees on ${fmtDate(selDate)}`
                  : "No absentees!"}
            </div>
            <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7, maxWidth: 280, margin: "0 auto" }}>
              {attendanceHistory.length === 0
                ? "Mark attendance first to see absentees here."
                : "Everyone attended this service. Great work! 🙌"}
            </p>
          </div>
        )}

        {/* ── Group sections ── */}
        {absenteeRows.map(({ group, session, absentees }) => {
          const filtered   = getFiltered(absentees, session);
          if (!filtered.length) return null;
          const reachedCnt = absentees.filter(a => followUpData[`${session.id}_${a.memberId}`]?.reached).length;
          const rate       = absentees.length ? Math.round(reachedCnt / absentees.length * 100) : 0;

          return (
            <div key={group.id} style={{ marginBottom: 28 }}>
              {/* Group header */}
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 14, padding: "13px 15px", marginBottom: 10,
                boxShadow: "var(--sh)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--brand)" }}>{group.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {fmtDate(session.date)} · {absentees.length} absent · {reachedCnt} reached
                    </div>
                  </div>
                  <button className="btn ba" style={{ padding: "7px 13px", fontSize: 12, minHeight: 36 }}
                    onClick={() => setSmsModal({ absentees, session, group })}>
                    📤 SMS
                  </button>
                </div>
                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Follow-up progress</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--muted)" }}>{rate}%</span>
                  </div>
                  <div style={{ background: "var(--surface2)", borderRadius: 6, overflow: "hidden", height: 6 }}>
                    <div style={{
                      width: `${rate}%`, height: "100%", borderRadius: 6,
                      background: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--muted)",
                      transition: "width .4s cubic-bezier(.4,0,.2,1)",
                    }} />
                  </div>
                </div>
              </div>

              {/* Member cards */}
              {filtered.map(a => {
                const key = `${session.id}_${a.memberId}`;
                return (
                  <AbsenteeCard
                    key={key}
                    record={a}
                    member={members.find(m => m.id === a.memberId)}
                    followUp={followUpData[key]}
                    onToggleReached={async (reached) => {
                      updateFollowUpKey(key, (cur) => ({ ...cur, reached }));
                    }}
                    onSaveNote={async (note) => {
                      updateFollowUpKey(key, (cur) => ({ ...cur, note }));
                      showToast("✅ Note saved");
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* ── Community banner ── */}
        <a href={WA_COMMUNITY} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
          <div style={{
            background: "linear-gradient(135deg, #075e54, #128c7e)",
            borderRadius: 16, padding: "16px 18px", marginTop: 8,
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 4px 20px rgba(7,94,84,.25)",
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <WaIco s={22} style={{ color: "#fff" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", letterSpacing: "-.01em" }}>Join our WhatsApp Community</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 3 }}>
                Tips, updates & support for ChurchTrakr users
              </div>
            </div>
            <svg width="6" height="12" viewBox="0 0 6 12" fill="none"><path d="M1 1l4 5-4 5" stroke="rgba(255,255,255,.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </a>
      </div>

      {smsModal && (
        <SmsModal
          absentees={smsModal.absentees}
          members={members}
          church={church}
          onClose={() => setSmsModal(null)}
          showToast={showToast}
          onCreditUpdate={async (newVal) => { await updateChurch({ sms_credits: newVal }); }}
        />
      )}
    </div>
  );
}