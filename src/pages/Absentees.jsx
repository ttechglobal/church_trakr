// src/pages/Absentees.jsx
import { useState, useMemo } from "react";
import { getAv, fmtDate } from "../lib/helpers";
import { CallIco, SmsIco, WaIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";

// ── Note modal (optional extra context) ──────────────────────────────────────
function NoteModal({ name, current, onClose, onSave }) {
  const [note, setNote] = useState(current || "");
  return (
    <Modal title={`Note — ${name}`} onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Notes <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <textarea className="fi" rows={3}
            placeholder="e.g. Called, no answer. Will try again Sunday."
            value={note} onChange={e => setNote(e.target.value)} style={{ resize: "vertical" }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => { onSave(note); onClose(); }}>Save Note</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Single absentee card ──────────────────────────────────────────────────────
function AbsenteeCard({ record, member, followUp, onUpdateFollowUp }) {
  const [showNote, setShowNote] = useState(false);
  const av       = getAv(record.name);
  const phone    = member?.phone || "";
  const hasPhone = !!phone;
  const reached  = !!followUp?.reached;

  const call = (e) => {
    e.stopPropagation();
    if (!hasPhone) return;
    window.location.href = `tel:${phone}`;
  };

  const sms = (e) => {
    e.stopPropagation();
    if (!hasPhone) return;
    const msg = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);
    window.location.href = `sms:${phone}?body=${msg}`;
  };

  const whatsapp = (e) => {
    e.stopPropagation();
    if (!hasPhone) return;
    const clean = phone.replace(/\D/g, "");
    const intl  = clean.startsWith("0") ? "234" + clean.slice(1) : clean;
    const msg   = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);
    window.open(`https://wa.me/${intl}?text=${msg}`, "_blank");
  };

  const toggleReached = (e) => {
    e.stopPropagation();
    onUpdateFollowUp({ ...followUp, reached: !reached });
  };

  return (
    <>
      <div style={{
        background: reached ? "#f0fdf6" : "var(--surface)",
        border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
        borderRadius: 14, padding: "13px 14px 11px", marginBottom: 10,
        transition: "all .15s",
        opacity: reached ? 0.75 : 1,
      }}>
        {/* Top row: avatar + name + reached checkbox */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="av" style={{ background: av.bg, color: av.color, width: 38, height: 38, borderRadius: 10, fontSize: 13, flexShrink: 0 }}>{av.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textDecoration: reached ? "line-through" : "none", color: reached ? "var(--muted)" : "var(--text)" }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{phone || "No phone"}</div>
          </div>

          {/* Reached checkbox + label */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}
            onClick={e => e.stopPropagation()}>
            <label style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7, border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
                background: reached ? "var(--success)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .12s",
              }}>
                {reached && <span style={{ color: "#fff", fontSize: 15, fontWeight: 900 }}>✓</span>}
              </div>
              <input type="checkbox" checked={reached} onChange={toggleReached} style={{ display: "none" }} />
            </label>
            <span style={{ fontSize: 9, fontWeight: 700, color: reached ? "var(--success)" : "var(--muted)", textTransform: "uppercase", letterSpacing: ".03em" }}>
              {reached ? "Done" : "Reached?"}
            </span>
          </div>
        </div>

        {/* Note preview */}
        {followUp?.note && (
          <div style={{ fontSize: 12, color: "var(--muted)", background: "var(--surface2)", borderRadius: 8, padding: "6px 10px", marginBottom: 10, fontStyle: "italic" }}>
            "{followUp.note}"
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={call} disabled={!hasPhone} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: hasPhone ? "#e8f4ff" : "var(--surface2)", color: hasPhone ? "#1a6fa8" : "var(--muted)", border: `1.5px solid ${hasPhone ? "#1a6fa8" : "var(--border)"}`, cursor: hasPhone ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
            <CallIco s={13} /> Call
          </button>
          <button onClick={sms} disabled={!hasPhone} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: hasPhone ? "#e8f4ff" : "var(--surface2)", color: hasPhone ? "var(--brand)" : "var(--muted)", border: `1.5px solid ${hasPhone ? "var(--brand)" : "var(--border)"}`, cursor: hasPhone ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
            <SmsIco s={13} /> SMS
          </button>
          <button onClick={whatsapp} disabled={!hasPhone} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: hasPhone ? "#dcf7e3" : "var(--surface2)", color: hasPhone ? "#128c5e" : "var(--muted)", border: `1.5px solid ${hasPhone ? "#128c5e" : "var(--border)"}`, cursor: hasPhone ? "pointer" : "not-allowed", fontFamily: "'DM Sans',sans-serif" }}>
            <WaIco s={13} /> WhatsApp
          </button>
          <button onClick={e => { e.stopPropagation(); setShowNote(true); }} style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", padding: "9px 4px", borderRadius: 10, fontSize: 16, background: "var(--surface2)", border: "1.5px solid var(--border)", cursor: "pointer" }}>
            📝
          </button>
        </div>
      </div>

      {showNote && (
        <NoteModal name={record.name} current={followUp?.note}
          onClose={() => setShowNote(false)}
          onSave={note => onUpdateFollowUp({ ...followUp, note })} />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Absentees({ groups, members, attendanceHistory }) {
  const [followUpData, setFollowUpData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  });
  const [selGroupId,    setSelGroupId]   = useState("all");
  const [filterStatus,  setFilterStatus] = useState("all"); // "all" | "pending" | "reached"

  const saveFollowUp = (key, data) => {
    setFollowUpData(prev => {
      const next = { ...prev, [key]: data };
      try { localStorage.setItem("ct_followup", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const absenteeRows = useMemo(() => {
    const rows = [];
    const filteredGroups = selGroupId === "all"
      ? groups
      : groups.filter(g => String(g.id) === String(selGroupId));

    for (const group of filteredGroups) {
      const session = [...attendanceHistory]
        .filter(s => s.groupId === group.id)
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      if (!session) continue;
      const absent = session.records.filter(r => r.present === false);
      if (!absent.length) continue;
      rows.push({ group, session, absentees: absent });
    }
    return rows;
  }, [groups, attendanceHistory, selGroupId]);

  const totalAbsent  = absenteeRows.reduce((s, r) => s + r.absentees.length, 0);
  const totalReached = absenteeRows.reduce((s, r) =>
    s + r.absentees.filter(a => followUpData[`${r.session.id}_${a.memberId}`]?.reached).length, 0);

  const getFiltered = (absentees, session) =>
    absentees.filter(a => {
      if (filterStatus === "all") return true;
      const reached = !!followUpData[`${session.id}_${a.memberId}`]?.reached;
      return filterStatus === "pending" ? !reached : reached;
    });

  return (
    <div className="page">
      <div className="ph">
        <h1>Absentees</h1>
        <p>Follow up with members who missed service</p>
      </div>

      <div className="pc">
        {/* Summary */}
        <div className="smbar" style={{ marginBottom: 16 }}>
          <div className="smbox">
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: "var(--danger)" }}>{totalAbsent}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Total Absent</div>
          </div>
          <div className="smbox">
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: "var(--success)" }}>{totalReached}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Reached Out</div>
          </div>
          <div className="smbox">
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: "var(--muted)" }}>{totalAbsent - totalReached}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Still Pending</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <select className="fi" value={selGroupId} onChange={e => setSelGroupId(e.target.value)} style={{ flex: 1 }}>
            <option value="all">All Groups</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="fi" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: 1 }}>
            <option value="all">All</option>
            <option value="pending">Pending only</option>
            <option value="reached">Reached only</option>
          </select>
        </div>

        {/* Empty state */}
        {absenteeRows.length === 0 && (
          <div className="empty">
            <div className="empty-ico">🎉</div>
            <p style={{ fontWeight: 700, fontSize: 16, color: "var(--success)" }}>No absentees!</p>
            <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
              {attendanceHistory.length === 0 ? "Mark attendance first to see absentees here." : "Everyone was present in the last session."}
            </p>
          </div>
        )}

        {/* Group sections */}
        {absenteeRows.map(({ group, session, absentees }) => {
          const filtered   = getFiltered(absentees, session);
          if (!filtered.length) return null;
          const reachedCnt = absentees.filter(a => followUpData[`${session.id}_${a.memberId}`]?.reached).length;

          return (
            <div key={group.id} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {fmtDate(session.date)} · {absentees.length} absent · {reachedCnt} reached
                  </div>
                </div>
                {reachedCnt === absentees.length && absentees.length > 0 && (
                  <span className="bdg bg-green">✅ All reached</span>
                )}
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
    </div>
  );
}