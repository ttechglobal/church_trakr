// src/pages/Absentees.jsx
// Dedicated follow-up tracker — shows all absentees from the last session
// per group, with call / SMS / WhatsApp buttons and status tracking.
import { useState, useMemo } from "react";
import { getAv, fmtDate } from "../lib/helpers";
import { CallIco, SmsIco, WaIco, ChevR, ChevL } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";

// ── Follow-up status badge ────────────────────────────────────────────────────
const STATUS_OPTS = [
  { key: "pending",  label: "Pending",   bg: "#f5f5f5",   color: "#888",           dot: "⬜" },
  { key: "called",   label: "Called",    bg: "#d1f5e4",   color: "var(--success)", dot: "📞" },
  { key: "sms",      label: "SMS Sent",  bg: "#cce8ff",   color: "#1a6fa8",        dot: "💬" },
  { key: "wa",       label: "WhatsApp",  bg: "#dcf7e3",   color: "#128c5e",        dot: "💚" },
  { key: "reached",  label: "Reached",   bg: "#d4f1e4",   color: "var(--success)", dot: "✅" },
];
const getStatus = key => STATUS_OPTS.find(s => s.key === key) || STATUS_OPTS[0];

// ── Feedback Modal ────────────────────────────────────────────────────────────
function FeedbackModal({ member, current, onClose, onSave }) {
  const [status, setStatus]   = useState(current?.status || "pending");
  const [note,   setNote]     = useState(current?.note   || "");

  return (
    <Modal title={`Follow-up — ${member.name}`} onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Status</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {STATUS_OPTS.map(s => (
              <button key={s.key}
                onClick={() => setStatus(s.key)}
                style={{
                  padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                  border: `2px solid ${status === s.key ? s.color : "var(--border)"}`,
                  background: status === s.key ? s.bg : "var(--surface)",
                  color: status === s.key ? s.color : "var(--muted)",
                  cursor: "pointer",
                }}>
                {s.dot} {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fg">
          <label className="fl">Notes <span style={{ fontWeight:400,color:"var(--muted)" }}>optional</span></label>
          <textarea className="fi" rows={3} placeholder="e.g. Called, no answer. Will try again Sunday."
            value={note} onChange={e => setNote(e.target.value)}
            style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => { onSave({ status, note }); onClose(); }}>Save</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Single absentee card ──────────────────────────────────────────────────────
function AbsenteeCard({ record, member, followUp, onUpdateFollowUp }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const av     = getAv(record.name);
  const st     = getStatus(followUp?.status);
  const phone  = member?.phone || "";
  const hasPhone = !!phone;

  const call = (e) => {
    e.stopPropagation();
    if (!hasPhone) return;
    onUpdateFollowUp({ status: "called", note: followUp?.note || "" });
    window.location.href = `tel:${phone}`;
  };

  const sms = (e) => {
    e.stopPropagation();
    if (!hasPhone) return;
    onUpdateFollowUp({ status: "sms", note: followUp?.note || "" });
    const msg = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);
    window.location.href = `sms:${phone}?body=${msg}`;
  };

  const whatsapp = (e) => {
    e.stopPropagation();
    if (!hasPhone) return;
    onUpdateFollowUp({ status: "wa", note: followUp?.note || "" });
    const clean = phone.replace(/\D/g, "");
    const intl  = clean.startsWith("0") ? "234" + clean.slice(1) : clean;
    const msg   = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);
    window.open(`https://wa.me/${intl}?text=${msg}`, "_blank");
  };

  return (
    <>
      <div
        onClick={() => setShowFeedback(true)}
        style={{
          background: st.key !== "pending" ? st.bg : "var(--surface)",
          border: `2px solid ${st.key !== "pending" ? st.color : "var(--border)"}`,
          borderRadius: 14, padding: "14px 14px 12px", marginBottom: 10, cursor: "pointer",
          transition: "all .15s",
        }}>
        {/* Top row: avatar + name + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="av" style={{ background: av.bg, color: av.color, width: 38, height: 38, borderRadius: 10, fontSize: 13, flexShrink: 0 }}>{av.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{record.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{phone || "No phone"}</div>
          </div>
          <span style={{ background: st.bg, color: st.color, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, flexShrink: 0, border: `1px solid ${st.color}30` }}>
            {st.dot} {st.label}
          </span>
        </div>

        {/* Note preview */}
        {followUp?.note && (
          <div style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontStyle: "italic" }}>
            "{followUp.note}"
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8 }} onClick={e => e.stopPropagation()}>
          <button
            onClick={call}
            disabled={!hasPhone}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: hasPhone ? "#e8f4ff" : "var(--surface2)",
              color: hasPhone ? "#1a6fa8" : "var(--muted)",
              border: `1.5px solid ${hasPhone ? "#1a6fa8" : "var(--border)"}`,
              cursor: hasPhone ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif",
            }}>
            <CallIco s={13} /> Call
          </button>
          <button
            onClick={sms}
            disabled={!hasPhone}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: hasPhone ? "#e8f4ff" : "var(--surface2)",
              color: hasPhone ? "var(--brand)" : "var(--muted)",
              border: `1.5px solid ${hasPhone ? "var(--brand)" : "var(--border)"}`,
              cursor: hasPhone ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif",
            }}>
            <SmsIco s={13} /> SMS
          </button>
          <button
            onClick={whatsapp}
            disabled={!hasPhone}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: hasPhone ? "#dcf7e3" : "var(--surface2)",
              color: hasPhone ? "#128c5e" : "var(--muted)",
              border: `1.5px solid ${hasPhone ? "#128c5e" : "var(--border)"}`,
              cursor: hasPhone ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif",
            }}>
            <WaIco s={13} /> WhatsApp
          </button>
        </div>
      </div>

      {showFeedback && (
        <FeedbackModal
          member={record}
          current={followUp}
          onClose={() => setShowFeedback(false)}
          onSave={onUpdateFollowUp}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Absentees({ groups, members, attendanceHistory }) {
  // followUpData: { [sessionId_memberId]: { status, note } }
  // Stored in localStorage for persistence across sessions
  const [followUpData, setFollowUpData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  });

  const [selGroupId, setSelGroupId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "pending" | "reached"
  const [selSession, setSelSession] = useState(null); // null = auto (latest per group)

  const saveFollowUp = (key, data) => {
    setFollowUpData(prev => {
      const next = { ...prev, [key]: data };
      try { localStorage.setItem("ct_followup", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // Build the absentee list
  // For each group, grab the most recent session and extract absentees
  const absenteeRows = useMemo(() => {
    const rows = [];
    const filteredGroups = selGroupId === "all"
      ? groups
      : groups.filter(g => String(g.id) === String(selGroupId));

    for (const group of filteredGroups) {
      const sessions = attendanceHistory
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date));

      const session = sessions[0];
      if (!session) continue;

      const absent = session.records.filter(r => r.present === false);
      if (!absent.length) continue;

      rows.push({ group, session, absentees: absent });
    }
    return rows;
  }, [groups, attendanceHistory, selGroupId]);

  const totalAbsent  = absenteeRows.reduce((s, r) => s + r.absentees.length, 0);
  const totalReached = absenteeRows.reduce((s, r) =>
    s + r.absentees.filter(a => {
      const key = `${r.session.id}_${a.memberId}`;
      const st  = followUpData[key]?.status;
      return st && st !== "pending";
    }).length, 0);

  const getFilteredAbsentees = (absentees, session) =>
    absentees.filter(a => {
      if (filterStatus === "all") return true;
      const key = `${session.id}_${a.memberId}`;
      const st  = followUpData[key]?.status || "pending";
      if (filterStatus === "pending") return st === "pending";
      if (filterStatus === "reached") return st !== "pending";
      return true;
    });

  return (
    <div className="page">
      <div className="ph">
        <h1>Absentees</h1>
        <p>Follow up with members who missed service</p>
      </div>

      <div className="pc">
        {/* ── Summary bar ── */}
        <div className="smbar" style={{ marginBottom: 16 }}>
          <div className="smbox">
            <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:28,color:"var(--danger)" }}>{totalAbsent}</div>
            <div style={{ fontSize:12,color:"var(--muted)" }}>Total Absent</div>
          </div>
          <div className="smbox">
            <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:28,color:"var(--success)" }}>{totalReached}</div>
            <div style={{ fontSize:12,color:"var(--muted)" }}>Reached Out</div>
          </div>
          <div className="smbox">
            <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:28,color:"var(--muted)" }}>{totalAbsent - totalReached}</div>
            <div style={{ fontSize:12,color:"var(--muted)" }}>Still Pending</div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {/* Group filter */}
          <select className="fi" value={selGroupId} onChange={e => setSelGroupId(e.target.value)}
            style={{ flex:1, minWidth:120 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {/* Status filter */}
          <select className="fi" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ flex:1, minWidth:110 }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending Only</option>
            <option value="reached">Reached Only</option>
          </select>
        </div>

        {/* ── Empty state ── */}
        {absenteeRows.length === 0 && (
          <div className="empty">
            <div className="empty-ico">🎉</div>
            <p style={{ fontWeight:700,fontSize:16,color:"var(--success)" }}>No absentees!</p>
            <p style={{ color:"var(--muted)",fontSize:13,marginTop:6 }}>
              {attendanceHistory.length === 0
                ? "Mark attendance first to see absentees here."
                : "Everyone was present in the last session."}
            </p>
          </div>
        )}

        {/* ── Group sections ── */}
        {absenteeRows.map(({ group, session, absentees }) => {
          const filtered = getFilteredAbsentees(absentees, session);
          if (!filtered.length) return null;
          const reachedCnt = absentees.filter(a => {
            const st = followUpData[`${session.id}_${a.memberId}`]?.status;
            return st && st !== "pending";
          }).length;

          return (
            <div key={group.id} style={{ marginBottom: 24 }}>
              {/* Group header */}
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:15 }}>{group.name}</div>
                  <div style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>
                    {fmtDate(session.date)} · {absentees.length} absent · {reachedCnt} reached
                  </div>
                </div>
                {reachedCnt === absentees.length && absentees.length > 0 && (
                  <span className="bdg bg-green">✅ All reached</span>
                )}
              </div>

              {/* Progress bar */}
              {absentees.length > 0 && (
                <div style={{ background:"var(--surface2)",borderRadius:8,overflow:"hidden",height:6,marginBottom:12 }}>
                  <div style={{ width:`${(reachedCnt/absentees.length)*100}%`,height:"100%",background:"var(--success)",borderRadius:8,transition:"width .4s" }}/>
                </div>
              )}

              {filtered.map(a => {
                const key    = `${session.id}_${a.memberId}`;
                const member = members.find(m => m.id === a.memberId);
                return (
                  <AbsenteeCard
                    key={key}
                    record={a}
                    member={member}
                    followUp={followUpData[key]}
                    onUpdateFollowUp={(data) => saveFollowUp(key, data)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}