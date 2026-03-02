// src/pages/Absentees.jsx
import { useState, useMemo } from "react";
import { getAv, fmtDate } from "../lib/helpers";
import { CallIco, SmsIco, WaIco } from "../components/ui/Icons";
import { Modal } from "../components/ui/Modal";

function NoteModal({ name, current, onClose, onSave }) {
  const [note, setNote] = useState(current || "");
  return (
    <Modal title={`Note — ${name}`} onClose={onClose}>
      <div className="fstack">
        <div className="fg">
          <label className="fl">Notes <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <textarea className="fi" rows={3} placeholder="e.g. Called, no answer. Will try again Sunday."
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

function AbsenteeCard({ record, member, followUp, onUpdateFollowUp }) {
  const [showNote, setShowNote] = useState(false);
  const av       = getAv(record.name);
  const phone    = member?.phone || record.phone || "";
  const hasPhone = !!phone;
  const reached  = !!followUp?.reached;
  const intlPhone = phone.replace(/\D/g, "").replace(/^0/, "234");
  const msg = encodeURIComponent(`Dear ${record.name}, we missed you at service. We love you and look forward to seeing you soon! 🙏`);

  const toggleReached = e => { e.stopPropagation(); onUpdateFollowUp({ ...followUp, reached: !reached }); };

  return (
    <>
      <div style={{
        background: reached ? "#f0fdf6" : "var(--surface)",
        border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
        borderRadius: 14, padding: "13px 14px 11px", marginBottom: 10,
        opacity: reached ? 0.78 : 1, transition: "all .15s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div className="av" style={{ background: av.bg, color: av.color, width: 38, height: 38, borderRadius: 10, fontSize: 13, flexShrink: 0 }}>{av.initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              textDecoration: reached ? "line-through" : "none", color: reached ? "var(--muted)" : "var(--text)" }}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{phone || "No phone"}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <label style={{ cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${reached ? "var(--success)" : "var(--border)"}`,
                background: reached ? "var(--success)" : "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s" }}>
                {reached && <span style={{ color: "#fff", fontSize: 16, fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </div>
              <input type="checkbox" checked={reached} onChange={toggleReached} style={{ display: "none" }} />
            </label>
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

        <div style={{ display: "flex", gap: 6 }}>
          {[
            { href: `tel:${phone}`, label: "Call",  Icon: CallIco, bg: "#e8f4ff", color: "#1a6fa8" },
            { href: `sms:${phone}?body=${msg}`, label: "SMS",  Icon: SmsIco, bg: "#e8f4ff", color: "var(--brand)" },
            { href: `https://wa.me/${intlPhone}?text=${msg}`, label: "WA",   Icon: WaIco,  bg: "#dcf7e3", color: "#128c5e", target: "_blank" },
          ].map(({ href, label, Icon, bg, color, target }) => (
            <a key={label} href={hasPhone ? href : undefined} target={target} rel={target ? "noreferrer" : undefined}
              onClick={e => !hasPhone && e.preventDefault()}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                padding: "9px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, textDecoration: "none",
                background: hasPhone ? bg : "var(--surface2)", color: hasPhone ? color : "var(--muted)",
                border: `1.5px solid ${hasPhone ? color : "var(--border)"}`, opacity: hasPhone ? 1 : 0.4,
                pointerEvents: hasPhone ? "auto" : "none" }}>
              <Icon s={13} /> {label}
            </a>
          ))}
          <button onClick={e => { e.stopPropagation(); setShowNote(true); }}
            style={{ width: 38, display: "flex", alignItems: "center", justifyContent: "center",
              padding: "9px 4px", borderRadius: 10, fontSize: 15,
              background: followUp?.note ? "#fff8e6" : "var(--surface2)",
              border: `1.5px solid ${followUp?.note ? "var(--accent)" : "var(--border)"}`, cursor: "pointer" }}>
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

export default function Absentees({ groups, members, attendanceHistory }) {
  const [followUpData, setFollowUpData] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ct_followup") || "{}"); } catch { return {}; }
  });
  const [selDate,        setSelDate]        = useState(null); // null = latest per group
  const [selGroupId,     setSelGroupId]     = useState("all");
  const [filterStatus,   setFilterStatus]   = useState("all");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const saveFollowUp = (key, data) => {
    setFollowUpData(prev => {
      const next = { ...prev, [key]: data };
      try { localStorage.setItem("ct_followup", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  // All available dates — Sundays + dates from attendance history
  const allDates = useMemo(() => {
    const fromHistory = new Set(attendanceHistory.map(s => s.date));
    const sundays = getSundays(12);
    const combined = [...new Set([...sundays, ...fromHistory])].sort((a, b) => b.localeCompare(a));
    return combined;
  }, [attendanceHistory]);

  const datesWithData = useMemo(() => new Set(attendanceHistory.map(s => s.date)), [attendanceHistory]);

  const dateIdx = selDate ? allDates.indexOf(selDate) : -1;

  const absenteeRows = useMemo(() => {
    const filteredGroups = selGroupId === "all" ? groups : groups.filter(g => String(g.id) === String(selGroupId));
    const rows = [];
    for (const group of filteredGroups) {
      const sessions = [...attendanceHistory].filter(s => s.groupId === group.id).sort((a, b) => b.date.localeCompare(a.date));
      if (!sessions.length) continue;
      let session;
      if (selDate) {
        session = sessions.find(s => s.date === selDate);
        if (!session) continue;
      } else {
        session = sessions[0];
      }
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

  return (
    <div className="page">
      <div className="ph">
        <h1>Absentees</h1>
        <p>Follow up with members who missed service</p>
      </div>

      <div className="pc">
        {/* Stats */}
        <div className="smbar" style={{ marginBottom: 16 }}>
          {[["Absent", totalAbsent, "var(--danger)"], ["Reached", totalReached, "var(--success)"], ["Pending", totalAbsent - totalReached, "var(--muted)"]].map(([l, v, c]) => (
            <div key={l} className="smbox">
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 28, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{l}</div>
            </div>
          ))}
        </div>

        {/* ── DATE SELECTOR ── */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>
            Viewing absentees for
          </div>

          <div style={{ display: "flex", alignItems: "stretch", gap: 6, marginBottom: datePickerOpen ? 10 : 0 }}>
            {/* Older */}
            <button onClick={() => {
              const next = selDate ? Math.min(dateIdx + 1, allDates.length - 1) : 0;
              setSelDate(allDates[next]);
            }} style={{ width: 40, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>

            {/* Current date pill — tap to open picker */}
            <button onClick={() => setDatePickerOpen(v => !v)}
              style={{ flex: 1, padding: "11px 14px", borderRadius: 10,
                border: `2px solid ${selDate ? "var(--brand)" : "var(--border)"}`,
                background: selDate ? "var(--brand)" : "var(--surface)",
                color: selDate ? "#fff" : "var(--text)",
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans',sans-serif",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span>{selDate ? fmtDate(selDate) : "📅 Latest per group"}</span>
              {!selDate && <span style={{ fontSize: 10, opacity: 0.6, fontWeight: 400 }}>tap to pick a date</span>}
            </button>

            {/* Newer */}
            <button onClick={() => {
              if (!selDate) return;
              const prev = dateIdx <= 0 ? null : allDates[dateIdx - 1];
              setSelDate(prev);
            }} disabled={!selDate}
              style={{ width: 40, borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--surface)", fontSize: 20, cursor: selDate ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: selDate ? 1 : 0.3 }}>›</button>
          </div>

          {/* Date picker grid */}
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
                      <div style={{ fontSize: 10, marginTop: 2, fontWeight: 600,
                        color: isSel ? "rgba(255,255,255,.75)" : hasData ? "var(--success)" : "var(--muted)" }}>
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
            <option value="all">All status</option>
            <option value="pending">Pending only</option>
            <option value="reached">Reached only</option>
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
                : selDate
                  ? "No groups had absentees on this date."
                  : "Everyone present in the latest sessions 🎉"}
            </p>
            {selDate && <button className="btn bp" style={{ marginTop: 14 }} onClick={() => setSelDate(null)}>View latest</button>}
          </div>
        )}

        {/* Group sections */}
        {absenteeRows.map(({ group, session, absentees }) => {
          const filtered   = getFiltered(absentees, session);
          if (!filtered.length) return null;
          const reachedCnt = absentees.filter(a => followUpData[`${session.id}_${a.memberId}`]?.reached).length;
          return (
            <div key={group.id} style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    {fmtDate(session.date)} · {absentees.length} absent · {reachedCnt} reached
                  </div>
                </div>
                {reachedCnt === absentees.length && absentees.length > 0 && <span className="bdg bg-green">✅ All reached</span>}
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