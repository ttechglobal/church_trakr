// src/pages/Absentees.jsx
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { fmtDate, toWhatsAppNumber } from "../lib/helpers";
import { CallIco, WaIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";
import { sendSms } from "../services/sms";
import { useAuth } from "../hooks/useAuth";
import { fetchFollowUpData, saveFollowUpData } from "../services/api";

const CREDITS_PER_SMS = 10;
const WA_COMMUNITY    = "https://whatsapp.com/channel/0029VbCBzbWJ3juwNfyjIn3Y";
const LS_KEY          = "ct_followup";
const SYNC_INTERVAL   = 30_000; // background sync every 30s

// ── Local-first sync strategy ─────────────────────────────────────────────────
// 1. On mount: load from localStorage instantly (zero wait, UI is responsive immediately)
// 2. Then fetch from Supabase in the background and merge (remote wins for conflicts)
// 3. Every toggle/note: update localStorage immediately + queue a debounced DB write
// 4. Background sync every 30s pushes any pending writes
// 5. On tab focus: re-sync from DB to pick up changes from other devices/admins

function readLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); } catch { return {}; }
}
function writeLocal(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getSundays(count = 16) {
  const result = [];
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  for (let i = 0; i < count; i++) {
    result.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() - 7);
  }
  return result;
}

function getLatestSessionDate(attendanceHistory) {
  if (!attendanceHistory?.length) return null;
  return [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date))[0].date;
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
    } catch { showToast("Send failed — please try again ❌"); }
    finally { setSending(false); }
  };

  return (
    <Modal title="Message Absentees" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 700, fontSize: 14 }}>Recipients <span style={{ color: "var(--muted)", fontWeight: 500 }}>({sel.length}/{absentees.length})</span></p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12, minHeight: 32 }}
            onClick={() => setSel(allSel ? [] : absentees.map(a => a.memberId))}>
            {allSel ? "Deselect All" : "Select All"}
          </button>
        </div>
        <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
          {absentees.map((a, i) => {
            const hasPhone = !!members.find(m => m.id === a.memberId)?.phone;
            return (
              <label key={a.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: i < absentees.length - 1 ? "1px solid var(--border)" : "none", cursor: "pointer" }}>
                <input type="checkbox" checked={sel.includes(a.memberId)}
                  onChange={() => setSel(s => s.includes(a.memberId) ? s.filter(x => x !== a.memberId) : [...s, a.memberId])}
                  style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                  {!hasPhone && <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 1 }}>⚠️ No phone</div>}
                </div>
              </label>
            );
          })}
        </div>
      </div>
      <div className="fg" style={{ marginBottom: 12 }}>
        <label className="fl">Message</label>
        <textarea className="fi" rows={4} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} to personalise</p>
      </div>
      {recipients.length > 0 && (
        <div style={{ background: hasEnough ? "var(--surface2)" : "var(--danger-bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", border: `1px solid ${hasEnough ? "var(--border)" : "var(--danger)"}` }}>
          <span style={{ fontSize: 13, color: hasEnough ? "var(--muted)" : "var(--danger)" }}>{recipients.length} × {CREDITS_PER_SMS} credits</span>
          <span style={{ fontWeight: 800, fontSize: 15, color: hasEnough ? "var(--brand)" : "var(--danger)" }}>{creditCost} credits</span>
        </div>
      )}
      {!hasEnough && recipients.length > 0 && (
        <div style={{ background: "var(--danger-bg)", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--danger)", marginBottom: 14 }}>
          <strong>Not enough credits.</strong> You have {credits}, need {creditCost}.
        </div>
      )}
      <button className="btn ba blg" disabled={sel.length === 0 || sending || !hasEnough || recipients.length === 0} onClick={handleSend}>
        {sending ? `Sending to ${recipients.length}…` : `📤 Send to ${recipients.length} member${recipients.length !== 1 ? "s" : ""}`}
      </button>
    </Modal>
  );
}

// ── Note Modal ────────────────────────────────────────────────────────────────
function NoteModal({ name, current, onClose, onSave }) {
  const [note, setNote] = useState(current || "");
  const [saving, setSaving] = useState(false);
  return (
    <Modal title={`Note — ${name}`} onClose={onClose}>
      <div className="fstack" style={{ paddingBottom: 8 }}>
        <div className="fg">
          <label className="fl">Follow-up note</label>
          <textarea className="fi" rows={4} autoFocus
            placeholder="e.g. Called at 3pm, no answer. Will try again next Sunday."
            value={note} onChange={e => setNote(e.target.value)} style={{ resize: "vertical" }} />
          <p className="fh">Visible to all admins on your account</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} disabled={saving}
            onClick={async () => { setSaving(true); await onSave(note); setSaving(false); onClose(); }}>
            {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Absentee Card ─────────────────────────────────────────────────────────────
function AbsenteeCard({ record, member, followUp, onToggleReached, onSaveNote }) {
  const [showNote, setShowNote] = useState(false);
  const [toggling, setToggling] = useState(false);

  const phone     = member?.phone || record.phone || "";
  const hasPhone  = !!phone;
  const reached   = !!followUp?.reached;
  const intlPhone = toWhatsAppNumber(phone);
  const waMsg     = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    await onToggleReached(!reached);
    setToggling(false);
  };

  return (
    <>
      <div style={{
        background: reached ? "#f0fdf6" : "var(--surface)",
        border: `1.5px solid ${reached ? "#86efac" : "var(--border)"}`,
        borderRadius: 16, padding: "13px 14px", marginBottom: 9,
        opacity: reached ? 0.8 : 1,
        transition: "all .2s cubic-bezier(.4,0,.2,1)",
        boxShadow: reached ? "none" : "var(--sh)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: (hasPhone || followUp?.note) ? 10 : 0 }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: reached ? "var(--success-bg)" : "var(--surface2)",
            border: `1.5px solid ${reached ? "#86efac" : "var(--border)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 15,
            color: reached ? "var(--success)" : "var(--muted)",
          }}>
            {record.name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: reached ? "var(--muted)" : "var(--text)", textDecoration: reached ? "line-through" : "none", lineHeight: 1.3 }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: phone ? "var(--muted)" : "var(--danger)", marginTop: 2, fontWeight: phone ? 400 : 600 }}>
              {phone || "No phone saved"}
            </div>
          </div>

          {/* Reached toggle */}
          <button onClick={handleToggle} disabled={toggling}
            aria-label={reached ? "Mark as not reached" : "Mark as reached"}
            style={{
              width: 46, height: 46, flexShrink: 0, borderRadius: 12,
              border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
              background: reached ? "var(--success)" : "var(--surface2)",
              cursor: toggling ? "wait" : "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 2, transition: "all .18s cubic-bezier(.4,0,.2,1)",
            }}>
            {toggling
              ? <div style={{ width: 15, height: 15, border: "2px solid rgba(0,0,0,.15)", borderTop: `2px solid ${reached ? "#fff" : "var(--brand)"}`, borderRadius: "50%", animation: "abspin .6s linear infinite" }} />
              : <span style={{ fontSize: 17, lineHeight: 1, color: reached ? "#fff" : "var(--muted)" }}>{reached ? "✓" : "○"}</span>
            }
            <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: reached ? "rgba(255,255,255,.85)" : "var(--muted)", lineHeight: 1 }}>
              {reached ? "Done" : "Reach?"}
            </span>
          </button>
        </div>

        {/* Note preview */}
        {followUp?.note && (
          <div style={{ fontSize: 12.5, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "7px 11px", marginBottom: 9, display: "flex", gap: 7, alignItems: "flex-start" }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>📝</span>
            <span style={{ color: "var(--text-2)", lineHeight: 1.5, fontStyle: "italic" }}>{followUp.note}</span>
          </div>
        )}

        {/* Action row */}
        {(hasPhone || true) && (
          <div style={{ display: "flex", gap: 6 }}>
            {hasPhone && (
              <>
                <a href={`tel:${phone}`}
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none", background: "#eff6ff", color: "#1d4ed8", border: "1.5px solid #bfdbfe" }}>
                  <CallIco s={13} /> Call
                </a>
                <a href={`https://wa.me/${intlPhone}?text=${waMsg}`} target="_blank" rel="noreferrer"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 6px", borderRadius: 9, fontSize: 12.5, fontWeight: 700, textDecoration: "none", background: "#f0fdf4", color: "#15803d", border: "1.5px solid #86efac" }}>
                  <WaIco s={13} /> WhatsApp
                </a>
              </>
            )}
            <button onClick={() => setShowNote(true)}
              style={{
                width: hasPhone ? 42 : "100%", display: "flex", alignItems: "center", justifyContent: "center",
                gap: hasPhone ? 0 : 6, padding: "9px",
                borderRadius: 9, fontSize: hasPhone ? 15 : 12.5, fontWeight: 600, cursor: "pointer",
                background: followUp?.note ? "#fffbeb" : "var(--surface2)",
                border: `1.5px solid ${followUp?.note ? "#fde68a" : "var(--border)"}`,
                color: followUp?.note ? "#92400e" : "var(--muted)",
              }}>
              📝 {!hasPhone && <span>{followUp?.note ? "Edit note" : "Add note"}</span>}
            </button>
          </div>
        )}
      </div>

      {showNote && (
        <NoteModal name={record.name} current={followUp?.note}
          onClose={() => setShowNote(false)}
          onSave={async (note) => { await onSaveNote(note); }} />
      )}
    </>
  );
}

// ── Week Report Row (for history tab) ─────────────────────────────────────────
function WeekRow({ group, session, absentees, followUpData, onClick }) {
  const reached = absentees.filter(a => followUpData[`${session.id}_${a.memberId}`]?.reached).length;
  const rate    = absentees.length ? Math.round(reached / absentees.length * 100) : 0;
  return (
    <div onClick={onClick} style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14,
      padding: "13px 15px", marginBottom: 8, cursor: "pointer", boxShadow: "var(--sh)",
      display: "flex", alignItems: "center", gap: 12,
      transition: "var(--transition)",
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--sh-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--sh)"; e.currentTarget.style.transform = ""; }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>{group.name}</div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{fmtDate(session.date)} · {absentees.length} absent</div>
      </div>
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 18, color: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--muted)" }}>{rate}%</div>
        <div style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>followed up</div>
      </div>
      <div style={{ width: 4, height: 40, borderRadius: 2, background: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--border)", flexShrink: 0 }} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Absentees({ groups, members, attendanceHistory, showToast }) {
  const { church, updateChurch } = useAuth();

  // ── Local-first follow-up data ────────────────────────────────────────────
  // Load from localStorage immediately — no spinner, instant UI
  const [followUpData, setFollowUpData] = useState(readLocal);
  const [syncing,      setSyncing]      = useState(false);
  const dirtyRef   = useRef(false);  // tracks if local has unsaved changes
  const saveTimer  = useRef(null);
  const latestData = useRef(followUpData);

  // Keep ref in sync for use inside timers/effects
  useEffect(() => { latestData.current = followUpData; }, [followUpData]);

  // Background sync: fetch from DB, merge (remote wins for conflicts)
  const syncFromDB = useCallback(async (quiet = true) => {
    if (!church?.id) return;
    if (!quiet) setSyncing(true);
    try {
      const remote = await fetchFollowUpData(church.id);
      if (remote && typeof remote === "object") {
        setFollowUpData(local => {
          // Merge: for each key, take the entry with the newer updatedAt
          const merged = { ...remote };
          for (const [k, v] of Object.entries(local)) {
            if (!remote[k]) { merged[k] = v; continue; }
            const remoteTs = new Date(remote[k]?.updatedAt || 0).getTime();
            const localTs  = new Date(v?.updatedAt || 0).getTime();
            if (localTs > remoteTs) merged[k] = v;
          }
          writeLocal(merged);
          return merged;
        });
      }
    } catch {}
    finally { if (!quiet) setSyncing(false); }
  }, [church?.id]);

  // Push local changes to DB (debounced)
  const pushToDB = useCallback((data) => {
    if (!church?.id) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveFollowUpData(church.id, data);
      dirtyRef.current = false;
    }, 800);
  }, [church?.id]);

  // On mount: initial DB sync after localStorage hydration
  useEffect(() => {
    syncFromDB(true);
  }, [syncFromDB]);

  // Background sync every 30s — picks up changes from other admins
  useEffect(() => {
    const id = setInterval(() => syncFromDB(true), SYNC_INTERVAL);
    return () => clearInterval(id);
  }, [syncFromDB]);

  // Sync when tab regains focus (another admin may have made changes)
  useEffect(() => {
    const onFocus = () => syncFromDB(true);
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [syncFromDB]);

  // Update a single key — instant local, debounced remote
  const updateKey = useCallback((key, updater) => {
    setFollowUpData(prev => {
      const cur  = prev[key] || {};
      const next = { ...prev, [key]: { ...cur, ...updater(cur), updatedAt: new Date().toISOString() } };
      writeLocal(next);
      dirtyRef.current = true;
      pushToDB(next);
      return next;
    });
  }, [pushToDB]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab,        setTab]        = useState("now");     // "now" | "history"
  const [selGroupId, setSelGroupId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [smsModal,   setSmsModal]   = useState(null);
  const [historyOpen, setHistoryOpen] = useState(null);   // { group, session, absentees }

  // ── Most recent session per group ─────────────────────────────────────────
  // "This week's follow-up" = the very latest session for each group
  const latestRows = useMemo(() => {
    const filtered = selGroupId === "all" ? groups : groups.filter(g => String(g.id) === String(selGroupId));
    return filtered.flatMap(group => {
      const sessions = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      if (!sessions.length) return [];
      const session = sessions[0]; // most recent only
      const absent  = session.records.filter(r => r.present === false);
      if (!absent.length) return [];
      return [{ group, session, absentees: absent }];
    });
  }, [groups, attendanceHistory, selGroupId]);

  // ── History: all sessions grouped by week (for history tab) ───────────────
  const historyRows = useMemo(() => {
    const filtered = selGroupId === "all" ? groups : groups.filter(g => String(g.id) === String(selGroupId));
    const rows = [];
    for (const group of filtered) {
      const sessions = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(1); // skip the most recent (shown in "now" tab)
      for (const session of sessions) {
        const absent = session.records.filter(r => r.present === false);
        if (absent.length) rows.push({ group, session, absentees: absent });
      }
    }
    return rows.sort((a, b) => b.session.date.localeCompare(a.session.date));
  }, [groups, attendanceHistory, selGroupId]);

  // ── Stats for current tab ─────────────────────────────────────────────────
  const totalAbsent  = latestRows.reduce((s, r) => s + r.absentees.length, 0);
  const totalReached = latestRows.reduce((s, r) =>
    s + r.absentees.filter(a => followUpData[`${r.session.id}_${a.memberId}`]?.reached).length, 0);
  const totalPending = totalAbsent - totalReached;
  const followUpRate = totalAbsent > 0 ? Math.round(totalReached / totalAbsent * 100) : 0;

  const getFiltered = (absentees, session) => absentees.filter(a => {
    if (filterStatus === "all") return true;
    const r = !!followUpData[`${session.id}_${a.memberId}`]?.reached;
    return filterStatus === "pending" ? !r : r;
  });

  return (
    <div className="page">
      <style>{`
        @keyframes abspin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)", padding: "max(env(safe-area-inset-top,32px),32px) 22px 26px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -50, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(201,168,76,.05)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, fontWeight: 800, color: "#fff", letterSpacing: "-.015em" }}>Absentees</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.52)", marginTop: 5, fontWeight: 500 }}>Follow up with members who missed service</div>
            </div>
            {syncing && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "5px 10px" }}>
                <div style={{ width: 10, height: 10, border: "1.5px solid rgba(255,255,255,.3)", borderTop: "1.5px solid #fff", borderRadius: "50%", animation: "abspin .6s linear infinite" }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>Syncing</span>
              </div>
            )}
          </div>

          {/* Progress ring */}
          {totalAbsent > 0 && tab === "now" && (
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, padding: "14px 16px", background: "rgba(255,255,255,.08)", borderRadius: 16, border: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width={60} height={60} style={{ transform: "rotate(-90deg)" }}>
                  <circle cx={30} cy={30} r={23} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth={5} />
                  <circle cx={30} cy={30} r={23} fill="none"
                    stroke={followUpRate >= 80 ? "#6ee7b7" : followUpRate >= 50 ? "#fcd34d" : "#fca5a5"}
                    strokeWidth={5}
                    strokeDasharray={`${2 * Math.PI * 23 * followUpRate / 100} ${2 * Math.PI * 23}`}
                    strokeLinecap="round" style={{ transition: "stroke-dasharray .6s ease" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 13, color: "#fff" }}>{followUpRate}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{totalReached}/{totalAbsent} followed up</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
                  {totalPending > 0 ? `${totalPending} still need a check-in` : "All reached! 🎉"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tab-wrap">
        <div className="tabs">
          <button className={`tab ${tab === "now" ? "act" : ""}`} onClick={() => setTab("now")}>
            📋 This Week {totalPending > 0 && tab !== "now" && <span style={{ marginLeft: 4, background: "var(--danger)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{totalPending}</span>}
          </button>
          <button className={`tab ${tab === "history" ? "act" : ""}`} onClick={() => setTab("history")}>
            📅 Weekly History
          </button>
        </div>
      </div>

      <div className="pc">

        {/* ── Filters ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          <select className="fi" value={selGroupId} onChange={e => setSelGroupId(e.target.value)}
            style={{ flex: 1, minHeight: 40, fontSize: 13 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {tab === "now" && (
            <div style={{ display: "flex", gap: 3, background: "var(--surface2)", borderRadius: 9, padding: 3, flexShrink: 0 }}>
              {["all", "pending", "reached"].map(f => (
                <button key={f} onClick={() => setFilterStatus(f)}
                  style={{
                    padding: "6px 10px", borderRadius: 7, border: "none", cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 11.5,
                    background: filterStatus === f ? "var(--surface)" : "transparent",
                    color: filterStatus === f ? "var(--brand)" : "var(--muted)",
                    boxShadow: filterStatus === f ? "var(--sh)" : "none",
                    transition: "var(--transition)", textTransform: "capitalize",
                  }}>
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Stat chips (now tab only) ── */}
        {tab === "now" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Absent",  val: totalAbsent,  color: "var(--danger)",  bg: "var(--danger-bg)",  border: "#fca5a5" },
              { label: "Reached", val: totalReached, color: "var(--success)", bg: "var(--success-bg)", border: "#86efac" },
              { label: "Pending", val: totalPending, color: totalPending > 0 ? "var(--warning)" : "var(--muted)", bg: totalPending > 0 ? "#fef3c7" : "var(--surface2)", border: totalPending > 0 ? "#fcd34d" : "var(--border)" },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "13px 10px", textAlign: "center", border: `1.5px solid ${s.border}` }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: 26, color: s.color, lineHeight: 1, letterSpacing: "-.02em" }}>{s.val}</div>
                <div style={{ fontSize: 10.5, color: s.color, marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", opacity: .85 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ══ NOW TAB ══════════════════════════════════════════════════════ */}
        {tab === "now" && (
          <>
            {latestRows.length === 0 && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 52, marginBottom: 14, lineHeight: 1 }}>
                  {attendanceHistory.length === 0 ? "📋" : "🎉"}
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 19, color: "var(--brand)", marginBottom: 8 }}>
                  {attendanceHistory.length === 0 ? "No attendance data yet" : "No absentees this week!"}
                </div>
                <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.7 }}>
                  {attendanceHistory.length === 0
                    ? "Mark attendance to start tracking absentees."
                    : "Everyone who was marked attended. Great work! 🙌"}
                </p>
              </div>
            )}

            {latestRows.map(({ group, session, absentees }) => {
              const filtered   = getFiltered(absentees, session);
              if (!filtered.length && filterStatus !== "all") return null;
              const reachedCnt = absentees.filter(a => followUpData[`${session.id}_${a.memberId}`]?.reached).length;
              const rate       = absentees.length ? Math.round(reachedCnt / absentees.length * 100) : 0;

              return (
                <div key={group.id} style={{ marginBottom: 28 }}>
                  {/* Group header */}
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "13px 15px", marginBottom: 10, boxShadow: "var(--sh)" }}>
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
                        <span style={{ fontSize: 11, fontWeight: 700, color: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--muted)" }}>{reachedCnt}/{absentees.length}</span>
                      </div>
                      <div style={{ background: "var(--surface2)", borderRadius: 6, overflow: "hidden", height: 6 }}>
                        <div style={{ width: `${rate}%`, height: "100%", borderRadius: 6, background: rate >= 80 ? "var(--success)" : rate >= 50 ? "var(--warning)" : "var(--muted)", transition: "width .4s cubic-bezier(.4,0,.2,1)" }} />
                      </div>
                    </div>
                  </div>

                  {filtered.length === 0 && filterStatus !== "all" && (
                    <div style={{ textAlign: "center", padding: "14px 0", fontSize: 13, color: "var(--muted)" }}>
                      No {filterStatus} members in this group
                    </div>
                  )}

                  {filtered.map(a => {
                    const key = `${session.id}_${a.memberId}`;
                    return (
                      <AbsenteeCard key={key} record={a}
                        member={members.find(m => m.id === a.memberId)}
                        followUp={followUpData[key]}
                        onToggleReached={async (reached) => updateKey(key, cur => ({ ...cur, reached }))}
                        onSaveNote={async (note) => { updateKey(key, cur => ({ ...cur, note })); showToast("✅ Note saved"); }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </>
        )}

        {/* ══ HISTORY TAB ══════════════════════════════════════════════════ */}
        {tab === "history" && (
          <>
            {historyRows.length === 0 ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "36px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📅</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18, color: "var(--brand)", marginBottom: 8 }}>No history yet</div>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>Past weeks' absentee data will appear here.</p>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
                  Past sessions — tap to review follow-up
                </div>
                {historyRows.map(row => (
                  <WeekRow
                    key={`${row.group.id}_${row.session.id}`}
                    {...row}
                    followUpData={followUpData}
                    onClick={() => setHistoryOpen(row)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── Community banner ── */}
        <a href={WA_COMMUNITY} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block", marginTop: 20 }}>
          <div style={{ background: "linear-gradient(135deg, #075e54, #128c7e)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 20px rgba(7,94,84,.2)" }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <WaIco s={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>Join our WhatsApp Community</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", marginTop: 2 }}>Tips, updates & support for ChurchTrakr users</div>
            </div>
            <svg width="6" height="12" viewBox="0 0 6 12" fill="none"><path d="M1 1l4 5-4 5" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </a>
      </div>

      {/* ── History drill-down modal ── */}
      {historyOpen && (
        <Modal title={`${historyOpen.group.name} — ${fmtDate(historyOpen.session.date)}`} onClose={() => setHistoryOpen(null)}>
          <div style={{ paddingBottom: 8 }}>
            {historyOpen.absentees.map(a => {
              const key = `${historyOpen.session.id}_${a.memberId}`;
              return (
                <AbsenteeCard key={key} record={a}
                  member={members.find(m => m.id === a.memberId)}
                  followUp={followUpData[key]}
                  onToggleReached={async (reached) => updateKey(key, cur => ({ ...cur, reached }))}
                  onSaveNote={async (note) => { updateKey(key, cur => ({ ...cur, note })); showToast("✅ Note saved"); }}
                />
              );
            })}
          </div>
        </Modal>
      )}

      {/* ── SMS modal ── */}
      {smsModal && (
        <SmsModal
          absentees={smsModal.absentees} members={members} church={church}
          onClose={() => setSmsModal(null)} showToast={showToast}
          onCreditUpdate={async (newVal) => { await updateChurch({ sms_credits: newVal }); }}
        />
      )}
    </div>
  );
}