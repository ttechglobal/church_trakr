// src/pages/Absentees.jsx
import { useState, useMemo } from "react";
import { fmtDate } from "../lib/helpers";
import { CallIco, WaIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";
import { sendSms } from "../services/sms";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";

const CREDITS_PER_SMS = 10;

// ── Real SMS Modal — calls the actual edge function ──────────────────────────
function SmsModal({ absentees, members, church, onClose, showToast, onCreditUpdate }) {
  const [sel,     setSel]     = useState(absentees.map(a => a.memberId));
  const [txt,     setTxt]     = useState("Dear {name}, we missed you at service this Sunday. We love you and look forward to seeing you soon! 🙏");
  const [sending, setSending] = useState(false);

  const credits     = church?.sms_credits ?? 0;
  const recipients  = absentees
    .filter(a => sel.includes(a.memberId))
    .map(a => ({ name: a.name, phone: members.find(m => m.id === a.memberId)?.phone || "" }))
    .filter(r => r.phone);

  const creditCost  = recipients.length * CREDITS_PER_SMS;
  const hasEnough   = credits >= creditCost;
  const allSel      = sel.length === absentees.length;

  const handleSend = async () => {
    if (!txt.trim())              { showToast("Please write a message"); return; }
    if (recipients.length === 0)  { showToast("No recipients have phone numbers saved"); return; }
    if (!hasEnough)               { showToast(`Need ${creditCost} credits — you have ${credits}`); return; }

    setSending(true);
    try {
      const result = await sendSms({
        recipients,
        message: txt,
        type:    "absentees",
      });
      if (result.success === false && result.error) throw new Error(result.error);

      const sent = result.sent ?? recipients.length;
      // Optimistically update local credit count
      if (sent > 0 && onCreditUpdate) {
        onCreditUpdate(Math.max(0, (church?.sms_credits ?? 0) - sent * CREDITS_PER_SMS));
      }
      showToast(`✅ Sent to ${sent} absentee${sent !== 1 ? "s" : ""}!`);
      onClose();
    } catch (e) {
      showToast("Send failed — please try again ❌");
      console.error("[Absentees SmsModal]", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title="Message Absentees" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Recipients ({sel.length}/{absentees.length})</p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => setSel(allSel ? [] : absentees.map(a => a.memberId))}>
            {allSel ? "Deselect All" : "Select All"}
          </button>
        </div>
        {absentees.map(a => {
          const hasPhone = !!members.find(m => m.id === a.memberId)?.phone;
          return (
            <label key={a.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
              <input type="checkbox" checked={sel.includes(a.memberId)}
                onChange={() => setSel(s => s.includes(a.memberId) ? s.filter(x => x !== a.memberId) : [...s, a.memberId])}
                style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                {!hasPhone && <div style={{ fontSize: 11, color: "var(--danger)" }}>No phone number</div>}
              </div>
            </label>
          );
        })}
      </div>

      <div className="fg" style={{ marginBottom: 12 }}>
        <label className="fl">Message</label>
        <textarea className="fi" rows={4} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} to personalise each message</p>
      </div>

      {/* Cost preview */}
      {recipients.length > 0 && (
        <div style={{ background: hasEnough ? "var(--surface2)" : "#fce8e8", borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${hasEnough ? "var(--border)" : "var(--danger)"}` }}>
          <span style={{ fontSize: 13, color: hasEnough ? "var(--muted)" : "var(--danger)" }}>
            {recipients.length} recipients × {CREDITS_PER_SMS} credits
          </span>
          <span style={{ fontWeight: 700, fontSize: 15, color: hasEnough ? "var(--brand)" : "var(--danger)" }}>
            {creditCost} credits
          </span>
        </div>
      )}

      {!hasEnough && recipients.length > 0 && (
        <div style={{ background: "#fce8e8", border: "1px solid #f5c8c8", borderRadius: 10, padding: "10px 12px", fontSize: 13, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 700 }}>Not enough credits</div>
            <div style={{ fontSize: 12, marginTop: 2 }}>You have <strong>{credits}</strong> credits but need <strong>{creditCost}</strong>. Top up to send this message.</div>
          </div>
        </div>
      )}
      <button className="btn ba blg" disabled={sel.length === 0 || sending || !hasEnough || recipients.length === 0}
        style={{ opacity: (sel.length === 0 || !hasEnough || recipients.length === 0) ? .5 : 1 }}
        onClick={handleSend}>
        {sending ? `Sending to ${recipients.length}…` : `📤 Send to ${recipients.length} Member${recipients.length !== 1 ? "s" : ""}`}
      </button>
    </Modal>
  );
}

function NoteModal({ name, current, onClose, onSave }) {
  const [note, setNote] = useState(current || "");
  return (
    <Modal title={`Note — ${name}`} onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Notes</label>
          <textarea className="fi" rows={3} placeholder="e.g. Called, no answer. Will try again Sunday."
            value={note} onChange={e => setNote(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => { onSave(note); onClose(); }}>Save</button>
        </div>
      </div>
    </Modal>
  );
}

function AbsenteeCard({ record, member, followUp, onUpdateFollowUp }) {
  const [showNote, setShowNote] = useState(false);
  const phone      = member?.phone || record.phone || "";
  const hasPhone   = !!phone;
  const reached    = !!followUp?.reached;
  const intlPhone  = phone.replace(/\D/g, "").replace(/^0/, "234");
  const waMsg      = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);

  return (
    <>
      <div style={{
        background: reached ? "#f0fdf6" : "var(--surface)",
        border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
        borderRadius: 14, padding: "13px 14px", marginBottom: 8,
        opacity: reached ? 0.78 : 1, transition: "all .15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: hasPhone ? 10 : 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, wordBreak: "break-word", lineHeight: 1.3,
              textDecoration: reached ? "line-through" : "none", color: reached ? "var(--muted)" : "var(--text)" }}>
              {record.name}
            </div>
            {phone && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{phone}</div>}
            {!phone && <div style={{ fontSize: 12, color: "var(--danger)", marginTop: 2 }}>No phone number</div>}
          </div>
          {/* Reached toggle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <div onClick={() => onUpdateFollowUp({ ...followUp, reached: !reached })}
              style={{ width: 32, height: 32, borderRadius: 8, border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
                background: reached ? "var(--success)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all .12s" }}>
              {reached && <span style={{ color: "#fff", fontSize: 17, fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: reached ? "var(--success)" : "var(--muted)" }}>
              {reached ? "Done" : "Reached?"}
            </span>
          </div>
        </div>

        {followUp?.note && (
          <div style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontStyle: "italic" }}>
            "{followUp.note}"
          </div>
        )}

        {hasPhone && (
          <div style={{ display: "flex", gap: 6 }}>
            <a href={`tel:${phone}`}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", background: "#e8f4ff", color: "#1a6fa8", border: "1.5px solid #1a6fa8" }}>
              <CallIco s={13} /> Call
            </a>
            <a href={`https://wa.me/${intlPhone}?text=${waMsg}`} target="_blank" rel="noreferrer"
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none", background: "#dcf7e3", color: "#128c5e", border: "1.5px solid #128c5e" }}>
              <WaIco s={13} /> WA
            </a>
            <button onClick={() => setShowNote(true)}
              style={{ width: 38, display: "flex", alignItems: "center", justifyContent: "center", padding: "9px", borderRadius: 10, fontSize: 15, background: followUp?.note ? "#fff8e6" : "var(--surface2)", border: `1.5px solid ${followUp?.note ? "var(--accent)" : "var(--border)"}`, cursor: "pointer" }}>
              📝
            </button>
          </div>
        )}
        {!hasPhone && (
          <button onClick={() => setShowNote(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: followUp?.note ? "#fff8e6" : "var(--surface2)", border: `1.5px solid ${followUp?.note ? "var(--accent)" : "var(--border)"}`, cursor: "pointer", color: "var(--muted)" }}>
            📝 {followUp?.note ? "Edit note" : "Add note"}
          </button>
        )}
      </div>
      {showNote && (
        <NoteModal name={record.name} current={followUp?.note}
          onClose={() => setShowNote(false)}
          onSave={note => onUpdateFollowUp({ ...followUp, note })} />
      )}
    </>
  );
}

function getSundays(count = 10) {
  const result = [];
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  for (let i = 0; i < count; i++) {
    result.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - 7);
  }
  return result;
}

export default function Absentees({ groups, members, attendanceHistory, showToast }) {
  const { church, updateChurch } = useAuth();
  const [followUpData,   setFollowUpData]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  });
  // Auto-select: most recent Sunday that has attendance data, else most recent Sunday
  const [selDate, setSelDate] = useState(() => {
    if (attendanceHistory && attendanceHistory.length > 0) {
      const sorted = [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date));
      return sorted[0].date;
    }
    // Fall back to last Sunday
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split("T")[0];
  });
  const [selGroupId,     setSelGroupId]     = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [smsModal,       setSmsModal]       = useState(null); // { absentees, session }

  const saveFollowUp = (key, data) => {
    setFollowUpData(prev => {
      const next = { ...prev, [key]: data };
      try { localStorage.setItem("ct_followup", JSON.stringify(next)); } catch {}
      return next;
    });
  };

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
      const sessions = [...attendanceHistory].filter(s => s.groupId === group.id).sort((a, b) => b.date.localeCompare(a.date));
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

  const getFiltered = (absentees, session) => absentees.filter(a => {
    if (filterStatus === "all") return true;
    const reached = !!followUpData[`${session.id}_${a.memberId}`]?.reached;
    return filterStatus === "pending" ? !reached : reached;
  });

  // Build all absentees list for group-level SMS modal
  const buildSmsAbsentees = (absentees) => absentees;

  return (
    <div className="page">
      <div style={{
        background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
        padding: "max(env(safe-area-inset-top,32px),32px) 22px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position:"absolute", top:-40, right:-30, width:160, height:160,
          borderRadius:"50%", background:"rgba(255,255,255,.04)", pointerEvents:"none" }} />
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:"#fff" }}>Absentees</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", marginTop:4 }}>Follow up with members who missed service</div>
      </div>

      <div className="pc">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[["Absent", totalAbsent, "var(--danger)"], ["Reached", totalReached, "var(--success)"], ["Pending", totalAbsent - totalReached, "var(--muted)"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--surface)", borderRadius: 14, padding: "12px 10px", textAlign: "center", border: "1.5px solid var(--border)" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 26, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Date selector */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Viewing absentees for
          </div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 6, marginBottom: datePickerOpen ? 10 : 0 }}>
            <button onClick={() => { const next = selDate ? Math.min(dateIdx + 1, allDates.length - 1) : 0; setSelDate(allDates[next]); }}
              style={{ width: 40, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
            <button onClick={() => setDatePickerOpen(v => !v)}
              style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "2px solid var(--brand)",
                background: "var(--brand)", color: "#fff",
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span>📅 {selDate ? fmtDate(selDate) : "Pick a date"}</span>
              <span style={{ fontSize: 10, opacity: 0.75, fontWeight: 400 }}>tap to change date</span>
            </button>
            <button onClick={() => { if (!selDate) return; const prev = dateIdx <= 0 ? null : allDates[dateIdx - 1]; setSelDate(prev); }}
              disabled={!selDate}
              style={{ width: 40, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 20, cursor: selDate ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: selDate ? 1 : 0.3 }}>›</button>
          </div>

          {datePickerOpen && (
            <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: 14, marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Pick a date</span>
                <button onClick={() => { setSelDate(null); setDatePickerOpen(false); }}
                  style={{ fontSize: 12, color: "var(--brand)", fontWeight: 700, border: "none", background: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
                  Show latest
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {allDates.slice(0, 12).map(d => {
                  const hasData = datesWithData.has(d);
                  const isSel   = selDate === d;
                  return (
                    <button key={d} onClick={() => { setSelDate(d); setDatePickerOpen(false); }}
                      style={{ padding: "10px 8px", borderRadius: 10, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "center",
                        background: isSel ? "var(--brand)" : hasData ? "#f0fdf6" : "var(--surface2)",
                        border: `1.5px solid ${isSel ? "var(--brand)" : hasData ? "var(--success)" : "var(--border)"}`,
                        color: isSel ? "#fff" : "var(--text)" }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{fmtDate(d)}</div>
                      <div style={{ fontSize: 10, marginTop: 2, fontWeight: 600, color: isSel ? "rgba(255,255,255,.75)" : hasData ? "var(--success)" : "var(--muted)" }}>
                        {hasData ? "✓ has data" : "no data"}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="fg">
                <label className="fl" style={{ fontSize: 11 }}>Custom date</label>
                <input className="fi" type="date" onChange={e => { if (e.target.value) { setSelDate(e.target.value); setDatePickerOpen(false); } }} />
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <select className="fi" value={selGroupId} onChange={e => setSelGroupId(e.target.value)} style={{ flex: 1 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="fi" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1 }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reached">Reached</option>
          </select>
        </div>

        {/* Empty */}
        {absenteeRows.length === 0 && (
          <div className="empty">
            <div className="empty-ico">{selDate ? "📅" : "🎉"}</div>
            <p style={{ fontWeight: 700, fontSize: 15, color: selDate ? "var(--muted)" : "var(--success)" }}>
              {selDate ? `No absentees on ${fmtDate(selDate)}` : "No absentees!"}
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              {attendanceHistory.length === 0
                ? "Mark attendance first to see absentees here."
                : selDate ? "No groups had absentees on this date."
                : "Everyone present in the latest sessions 🎉"}
            </p>
            {selDate && <button className="btn bp" style={{ marginTop: 14 }} onClick={() => setSelDate(null)}>View latest</button>}
          </div>
        )}

        {/* Group sections */}
        {absenteeRows.map(({ group, session, absentees }) => {
          const filtered    = getFiltered(absentees, session);
          if (!filtered.length) return null;
          const reachedCnt  = absentees.filter(a => followUpData[`${session.id}_${a.memberId}`]?.reached).length;
          return (
            <div key={group.id} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {fmtDate(session.date)} · {absentees.length} absent · {reachedCnt} reached
                  </div>
                </div>
                <button
                  className="btn ba"
                  style={{ padding: "7px 12px", fontSize: 12, flexShrink: 0 }}
                  onClick={() => setSmsModal({ absentees, session, group })}>
                  📤 SMS
                </button>
              </div>

              {absentees.length > 0 && (
                <div style={{ background: "var(--surface2)", borderRadius: 8, overflow: "hidden", height: 5, marginBottom: 12 }}>
                  <div style={{ width: `${(reachedCnt / absentees.length) * 100}%`, height: "100%", background: "var(--success)", borderRadius: 8, transition: "width .4s" }} />
                </div>
              )}

              {filtered.map(a => {
                const key = `${session.id}_${a.memberId}`;
                return (
                  <AbsenteeCard key={key} record={a}
                    member={members.find(m => m.id === a.memberId)}
                    followUp={followUpData[key]}
                    onUpdateFollowUp={data => saveFollowUp(key, data)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {smsModal && (
        <SmsModal
          absentees={smsModal.absentees}
          members={members}
          church={church}
          onClose={() => setSmsModal(null)}
          showToast={showToast}
          onCreditUpdate={async (newVal) => {
            await updateChurch({ sms_credits: newVal });
          }}
        />
      )}
    </div>
  );
}