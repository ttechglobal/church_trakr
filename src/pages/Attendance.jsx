// src/pages/Attendance.jsx
import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate, uid } from "../lib/helpers";
import { ChevL, ChevR, SrchIco, SmsIco } from "../components/ui/Icons";

// ── SMS Modal ─────────────────────────────────────────────────────────────────
function SmsModal({ absentees, onClose, showToast }) {
  const [sel, setSel] = useState(absentees.map(a => a.memberId));
  const [txt, setTxt] = useState("Dear {name}, we missed you at service this Sunday. God bless you! 🙏");
  const allSel = sel.length === absentees.length;
  return (
    <Modal title="Send SMS to Absentees" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Recipients ({sel.length}/{absentees.length})</p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => setSel(allSel ? [] : absentees.map(a => a.memberId))}>
            {allSel ? "Deselect All" : "Select All"}
          </button>
        </div>
        {absentees.map(m => (
          <label key={m.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <input type="checkbox" checked={sel.includes(m.memberId)}
              onChange={() => setSel(s => s.includes(m.memberId) ? s.filter(x => x !== m.memberId) : [...s, m.memberId])}
              style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
          </label>
        ))}
      </div>
      <div className="fg" style={{ marginBottom: 16 }}>
        <label className="fl">Message Template</label>
        <textarea className="fi" rows={4} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} for personalization</p>
      </div>
      <button className="btn ba blg" disabled={sel.length === 0}
        onClick={() => { showToast(`SMS sent to ${sel.length} member${sel.length !== 1 ? "s" : ""}! ✉️`); onClose(); }}>
        <SmsIco s={18} /> Send to {sel.length} Member{sel.length !== 1 ? "s" : ""}
      </button>
    </Modal>
  );
}

// ── Session Summary View (reusable for viewing past sessions) ─────────────────
function SessionSummary({ session, group, onBack, onContinueMarking, showToast }) {
  const [smsModal, setSmsModal] = useState(false);
  const recs = session.records;
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={onBack}><ChevL /> Back</button>
        <h1>Attendance Summary</h1>
        <p>{group?.name} · {fmtDate(session.date)}</p>
      </div>
      <div className="pc">
        {/* Stats */}
        <div className="smbar" style={{ marginBottom: 20 }}>
          {[["Total", recs.length, "var(--brand)"], ["Present", presentCnt, "var(--success)"], ["Absent", absentCnt, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} className="smbox">
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 30, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Attendance rate bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ background: "var(--surface2)", borderRadius: 12, overflow: "hidden", height: 14 }}>
            <div style={{
              width: recs.length ? `${(presentCnt / recs.length) * 100}%` : "0%",
              height: "100%", background: "linear-gradient(90deg,var(--success),#5ad98a)",
              borderRadius: 12, transition: "width .8s cubic-bezier(.34,1.2,.64,1)"
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Attendance rate</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}>
              {recs.length ? Math.round((presentCnt / recs.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Absentees */}
        {absentList.length > 0 ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="stitle" style={{ margin: 0 }}>Absentees ({absentList.length})</div>
              <button className="btn ba" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => setSmsModal(true)}>
                <SmsIco s={14} /> SMS
              </button>
            </div>
            {absentList.map(r => {
              const av = getAv(r.name);
              return (
                <div key={r.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="av" style={{ background: av.bg, color: av.color, width: 36, height: 36, borderRadius: 10, fontSize: 12 }}>{av.initials}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <span className="bdg bg-red" style={{ marginLeft: "auto" }}>Absent</span>
                </div>
              );
            })}
            <button className="btn ba blg" style={{ marginTop: 16 }} onClick={() => setSmsModal(true)}>
              <SmsIco s={18} /> Send Message to Absentees
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0", background: "#f0fdf6", borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 44 }}>🎉</div>
            <div style={{ fontWeight: 700, color: "var(--success)", marginTop: 10, fontSize: 18 }}>Full attendance!</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Everyone was present that day</p>
          </div>
        )}

        {/* Who attended */}
        {presentCnt > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="stitle" style={{ marginBottom: 12 }}>Who Attended ({presentCnt})</div>
            {recs.filter(r => r.present === true).map(r => {
              const av = getAv(r.name);
              return (
                <div key={r.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div className="av" style={{ background: av.bg, color: av.color, width: 36, height: 36, borderRadius: 10, fontSize: 12 }}>{av.initials}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                  <span className="bdg bg-green" style={{ marginLeft: "auto" }}>Present</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {onContinueMarking && (
            <button className="btn bg" style={{ flex: 1 }} onClick={onContinueMarking}>
              ✏️ Continue Marking
            </button>
          )}
          <button className="btn bp" style={{ flex: 1 }} onClick={onBack}>Done</button>
        </div>
      </div>
      {smsModal && <SmsModal absentees={absentList} onClose={() => setSmsModal(false)} showToast={showToast} />}
    </div>
  );
}

// ── Main Attendance Page ──────────────────────────────────────────────────────
export default function Attendance({ groups, members, attendanceHistory, setAttendanceHistory, showToast }) {
  const [step, setStep] = useState("group");
  const [selGrp, setSelGrp] = useState(null);
  const [selDate, setSelDate] = useState(new Date().toISOString().split("T")[0]);
  const [recs, setRecs] = useState([]);
  const [search, setSearch] = useState("");
  // For viewing a past session from the date picker
  const [viewingSession, setViewingSession] = useState(null);
  // sessionId being edited (for update vs insert)
  const [editingSessionId, setEditingSessionId] = useState(null);

  const startMarking = (g) => {
    setSelGrp(g);
    setSearch("");
    setStep("date");
  };

  // When user picks a date — check if session exists
  const proceedFromDate = () => {
    const existing = attendanceHistory.find(
      h => h.groupId === selGrp.id && h.date === selDate
    );
    if (existing) {
      // Load existing records so they can continue marking
      setRecs(existing.records.map(r => ({ ...r })));
      setEditingSessionId(existing.id);
    } else {
      // Fresh session
      const gm = members.filter(m => (m.groupIds || []).includes(selGrp.id));
      setRecs(gm.map(m => ({ memberId: m.id, name: m.name, present: null })));
      setEditingSessionId(null);
    }
    setStep("mark");
  };

  const toggle = (id, val) => setRecs(rs => rs.map(r => r.memberId === id ? { ...r, present: r.present === val ? null : val } : r));
  const markAll = val => setRecs(rs => rs.map(r => ({ ...r, present: val })));
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);
  const filtered   = recs.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const save = () => {
    if (editingSessionId) {
      // Update existing session
      setAttendanceHistory(h => h.map(s =>
        s.id === editingSessionId ? { ...s, records: recs.map(r => ({ ...r })) } : s
      ));
    } else {
      // New session
      const newSession = { id: uid(), groupId: selGrp.id, date: selDate, church_id: "church_001", records: recs.map(r => ({ ...r })) };
      setAttendanceHistory(h => [newSession, ...h]);
      setEditingSessionId(newSession.id);
    }
    showToast("Attendance saved! ✅");
    setStep("summary");
  };

  // Build the saved session for the summary view
  const currentSession = editingSessionId
    ? attendanceHistory.find(s => s.id === editingSessionId) || { id: editingSessionId, groupId: selGrp?.id, date: selDate, records: recs }
    : { id: null, groupId: selGrp?.id, date: selDate, records: recs };

  // ── Viewing a past session from the date screen ───────────────────────────
  if (viewingSession) {
    const grp = groups.find(g => g.id === viewingSession.groupId);
    return (
      <SessionSummary
        session={viewingSession}
        group={grp}
        onBack={() => setViewingSession(null)}
        onContinueMarking={() => {
          setSelGrp(grp);
          setSelDate(viewingSession.date);
          setRecs(viewingSession.records.map(r => ({ ...r })));
          setEditingSessionId(viewingSession.id);
          setSearch("");
          setViewingSession(null);
          setStep("mark");
        }}
        showToast={showToast}
      />
    );
  }

  // ── GROUP SELECTION ───────────────────────────────────────────────────────
  if (step === "group") {
    // Build "recent sessions" across all groups for quick access
    const recentSessions = [...attendanceHistory]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return (
      <div className="page">
        <div className="ph"><h1>Attendance</h1><p>Select a group to begin</p></div>
        <div className="pc">
          {/* Recent sessions quick-access */}
          {recentSessions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="stitle" style={{ marginBottom: 10 }}>Recent Sessions</div>
              {recentSessions.map(s => {
                const grp = groups.find(g => g.id === s.groupId);
                const presentCount = s.records.filter(r => r.present === true).length;
                const total = s.records.length;
                const rate = total ? Math.round((presentCount / total) * 100) : 0;
                return (
                  <div key={s.id} className="li" onClick={() => setViewingSession(s)}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
                    <div className="li-info">
                      <div className="li-name">{grp?.name || "Unknown Group"}</div>
                      <div className="li-sub">{fmtDate(s.date)} · {presentCount}/{total} present</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: rate >= 70 ? "var(--success)" : rate >= 50 ? "var(--accent)" : "var(--danger)" }}>{rate}%</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>rate</div>
                    </div>
                  </div>
                );
              })}
              <div className="stitle" style={{ marginTop: 20, marginBottom: 10 }}>Mark New Session</div>
            </div>
          )}

          {groups.map(g => {
            const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
            const av = getAv(g.name);
            // Count sessions for this group
            const sessionCount = attendanceHistory.filter(h => h.groupId === g.id).length;
            return (
              <div key={g.id} className="li" onClick={() => startMarking(g)}>
                <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
                <div className="li-info">
                  <div className="li-name">{g.name}</div>
                  <div className="li-sub">{cnt} members · {sessionCount} session{sessionCount !== 1 ? "s" : ""}</div>
                </div>
                <ChevR />
              </div>
            );
          })}
          {groups.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No groups yet</p></div>}
        </div>
      </div>
    );
  }

  // ── DATE SELECTION ────────────────────────────────────────────────────────
  if (step === "date") {
    // Generate last 8 Sundays dynamically
    const sundays = Array.from({ length: 8 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() - (i * 7));
      return d.toISOString().split("T")[0];
    });

    // Which of those sundays already have a session for this group?
    const sessionsForGroup = attendanceHistory.filter(h => h.groupId === selGrp.id);
    const sessionDates = new Set(sessionsForGroup.map(s => s.date));

    const selectedSession = sessionsForGroup.find(s => s.date === selDate);

    return (
      <div className="page">
        <div className="ph">
          <button className="btn bg" style={{ marginBottom: 14 }} onClick={() => setStep("group")}><ChevL /> All Groups</button>
          <h1>{selGrp.name}</h1><p>Select date to mark attendance</p>
        </div>
        <div className="pc">
          <div className="fg" style={{ marginBottom: 16 }}>
            <label className="fl">Date</label>
            <input className="fi" type="date" value={selDate} onChange={e => setSelDate(e.target.value)} />
          </div>

          {/* Show existing session info if selected date has one */}
          {selectedSession && (
            <div style={{ background: "#fff8e6", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#8a5a00", marginBottom: 4 }}>⚡ Attendance already recorded</div>
              <div style={{ fontSize: 13, color: "#8a5a00" }}>
                {selectedSession.records.filter(r => r.present === true).length} present · {selectedSession.records.filter(r => r.present === false).length} absent · {selectedSession.records.filter(r => r.present === null).length} unmarked
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn bg" style={{ flex: 1, fontSize: 13 }}
                  onClick={() => setViewingSession(selectedSession)}>
                  👁 View Summary
                </button>
                <button className="btn ba" style={{ flex: 1, fontSize: 13 }}
                  onClick={proceedFromDate}>
                  ✏️ Continue Marking
                </button>
              </div>
            </div>
          )}

          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>Recent Sundays</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {sundays.map(d => {
              const hasSess = sessionDates.has(d);
              const sess = sessionsForGroup.find(s => s.date === d);
              const isSelected = selDate === d;
              return (
                <div key={d}
                  onClick={() => setSelDate(d)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 14px",
                    background: isSelected ? "var(--brand)" : "var(--surface)",
                    color: isSelected ? "#fff" : "var(--text)",
                    borderRadius: 12, cursor: "pointer",
                    border: `1.5px solid ${isSelected ? "var(--brand)" : hasSess ? "var(--success)" : "var(--border)"}`,
                    boxShadow: "var(--sh)", transition: "all .12s"
                  }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(d)}</div>
                    {hasSess && (
                      <div style={{ fontSize: 12, marginTop: 2, color: isSelected ? "rgba(255,255,255,.75)" : "var(--success)" }}>
                        ✓ {sess.records.filter(r => r.present === true).length}/{sess.records.length} recorded
                      </div>
                    )}
                  </div>
                  {hasSess && !isSelected && (
                    <span className="bdg bg-green" style={{ fontSize: 11 }}>Done</span>
                  )}
                </div>
              );
            })}
          </div>

          {!selectedSession ? (
            <button className="btn bp blg" onClick={proceedFromDate}>Start Marking →</button>
          ) : (
            <button className="btn bp blg" onClick={proceedFromDate}>✏️ Continue Marking</button>
          )}
        </div>
      </div>
    );
  }

  // ── MARK ATTENDANCE ───────────────────────────────────────────────────────
  if (step === "mark") return (
    <div style={{ paddingBottom: 160 }}>
      <div className="att-top">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button className="btn bg" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => setStep("date")}><ChevL /> Back</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>{selGrp.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(selDate)}</div>
          </div>
        </div>
        <div className="sw" style={{ marginBottom: 10 }}>
          <div className="si"><SrchIco /></div>
          <input className="fi" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn bos" style={{ flex: 1, padding: "8px", fontSize: 12 }} onClick={() => markAll(true)}>✓ Mark All Present</button>
          <button className="btn bod" style={{ flex: 1, padding: "8px", fontSize: 12 }} onClick={() => markAll(false)}>✗ Mark All Absent</button>
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {recs.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No members in this group.</p></div>}
        {filtered.map(r => (
          <div key={r.memberId}
            className={`att-item ${r.present === true ? "pr" : r.present === false ? "ab" : ""}`}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div>
              <div style={{ fontSize: 12, marginTop: 2, color: r.present === true ? "var(--success)" : r.present === false ? "var(--danger)" : "var(--muted)" }}>
                {r.present === true ? "✓ Present" : r.present === false ? "✗ Absent" : "— Not marked"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`tbtn ${r.present === true ? "tp" : "tpi"}`}
                style={{ flex: 1, minWidth: 0, padding: "10px 8px" }}
                onClick={() => toggle(r.memberId, true)}>✓ Present</button>
              <button className={`tbtn ${r.present === false ? "ta" : "tai"}`}
                style={{ flex: 1, minWidth: 0, padding: "10px 8px" }}
                onClick={() => toggle(r.memberId, false)}>✗ Absent</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && search && <div className="empty"><p>No match for "{search}"</p></div>}
      </div>

      <div className="att-bot">
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 12, background: "var(--surface2)", borderRadius: 12, padding: "10px 0" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--success)" }}>{presentCnt}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Present</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--danger)" }}>{absentCnt}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Absent</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--muted)" }}>{recs.length - presentCnt - absentCnt}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Unmarked</div>
          </div>
        </div>
        <button className="btn bp" style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 16 }} onClick={save}>
          Save Attendance
        </button>
      </div>
    </div>
  );

  // ── SUMMARY (after saving) ────────────────────────────────────────────────
  if (step === "summary") {
    return (
      <SessionSummary
        session={currentSession}
        group={selGrp}
        onBack={() => setStep("group")}
        onContinueMarking={() => setStep("mark")}
        showToast={showToast}
      />
    );
  }
}
