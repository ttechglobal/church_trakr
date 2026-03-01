// src/pages/Attendance.jsx
import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate } from "../lib/helpers";
import { ChevL, ChevR, SmsIco } from "../components/ui/Icons";

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
        <label className="fl">Message</label>
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

// ── Session Summary ───────────────────────────────────────────────────────────
function SessionSummary({ session, group, onBack, onContinueMarking, showToast }) {
  const [smsModal, setSmsModal] = useState(false);
  const recs       = session.records;
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={onBack}><ChevL /> Back</button>
        <h1>Summary</h1>
        <p>{group?.name} · {fmtDate(session.date)}</p>
      </div>
      <div className="pc">
        <div className="smbar" style={{ marginBottom: 20 }}>
          {[["Total", recs.length, "var(--brand)"], ["Present", presentCnt, "var(--success)"], ["Absent", absentCnt, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} className="smbox">
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 30, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ background: "var(--surface2)", borderRadius: 12, overflow: "hidden", height: 10 }}>
            <div style={{ width: recs.length ? `${(presentCnt / recs.length) * 100}%` : "0%", height: "100%", background: "linear-gradient(90deg,var(--success),#5ad98a)", borderRadius: 12, transition: "width .8s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Attendance rate</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}>
              {recs.length ? Math.round((presentCnt / recs.length) * 100) : 0}%
            </span>
          </div>
        </div>

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
              <SmsIco s={18} /> Message Absentees
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0", background: "#f0fdf6", borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 44 }}>🎉</div>
            <div style={{ fontWeight: 700, color: "var(--success)", marginTop: 10, fontSize: 18 }}>Full attendance!</div>
          </div>
        )}

        {presentCnt > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="stitle" style={{ marginBottom: 12 }}>Attended ({presentCnt})</div>
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

        <div style={{ display: "flex", gap: 10 }}>
          {onContinueMarking && <button className="btn bg" style={{ flex: 1 }} onClick={onContinueMarking}>✏️ Edit</button>}
          <button className="btn bp" style={{ flex: 1 }} onClick={onBack}>Done</button>
        </div>
      </div>
      {smsModal && <SmsModal absentees={absentList} onClose={() => setSmsModal(false)} showToast={showToast} />}
    </div>
  );
}

// ── Main Attendance Page ──────────────────────────────────────────────────────
export default function Attendance({ groups, members, attendanceHistory, saveAttendance, showToast }) {
  const [step, setStep] = useState("group");
  const [selGrp, setSelGrp] = useState(null);
  const [selDate, setSelDate] = useState(new Date().toISOString().split("T")[0]);
  const [recs, setRecs] = useState([]);
  const [viewingSession, setViewingSession] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const startMarking = (g) => { setSelGrp(g); setStep("date"); };

  const proceedFromDate = () => {
    setSaveErr("");
    const existing = attendanceHistory.find(h => h.groupId === selGrp.id && h.date === selDate);
    if (existing) {
      setRecs(existing.records.map(r => ({ ...r })));
      setEditingSessionId(existing.id);
    } else {
      const gm = members.filter(m => (m.groupIds || []).includes(selGrp.id));
      // Default ALL to present — user taps to flip absent
      setRecs(gm.map(m => ({ memberId: m.id, name: m.name, present: true })));
      setEditingSessionId(null);
    }
    setStep("mark");
  };

  // Single tap flips present ↔ absent
  const toggleAbsent = (id) =>
    setRecs(rs => rs.map(r => r.memberId === id ? { ...r, present: !r.present } : r));

  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;

  const save = async () => {
    setSaveErr("");
    setSaving(true);
    try {
      const session = {
        id:       editingSessionId || undefined,
        groupId:  selGrp.id,
        date:     selDate,
        church_id: undefined, // filled in by App.jsx wrapper
        records:  recs.map(r => ({ ...r })),
      };
      const { data, error } = await saveAttendance(session);
      if (error) {
        const msg = error?.message || JSON.stringify(error) || "Unknown error";
        setSaveErr(msg);
        showToast("Save failed: " + msg + " ❌");
        return;
      }
      const savedId = data?.id || editingSessionId;
      if (!editingSessionId && savedId) setEditingSessionId(savedId);
      showToast("Attendance saved! ✅");
      setStep("summary");
    } catch (e) {
      const msg = e?.message || "Unexpected error";
      setSaveErr(msg);
      showToast("Save failed: " + msg + " ❌");
    } finally {
      setSaving(false);
    }
  };

  const currentSession = editingSessionId
    ? attendanceHistory.find(s => s.id === editingSessionId) || { id: editingSessionId, groupId: selGrp?.id, date: selDate, records: recs }
    : { id: null, groupId: selGrp?.id, date: selDate, records: recs };

  // ── Viewing a past session ────────────────────────────────────────────────
  if (viewingSession) {
    const grp = groups.find(g => g.id === viewingSession.groupId);
    return (
      <SessionSummary session={viewingSession} group={grp}
        onBack={() => setViewingSession(null)}
        onContinueMarking={() => {
          setSelGrp(grp); setSelDate(viewingSession.date);
          setRecs(viewingSession.records.map(r => ({ ...r })));
          setEditingSessionId(viewingSession.id);
          setViewingSession(null); setStep("mark");
        }}
        showToast={showToast}
      />
    );
  }

  // ── GROUP SELECTION ───────────────────────────────────────────────────────
  if (step === "group") {
    const recent = [...attendanceHistory].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    return (
      <div className="page">
        <div className="ph"><h1>Attendance</h1><p>Select a group to mark</p></div>
        <div className="pc">
          {recent.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div className="stitle" style={{ marginBottom: 10 }}>Recent Sessions</div>
              {recent.map(s => {
                const grp = groups.find(g => g.id === s.groupId);
                const pc  = s.records.filter(r => r.present === true).length;
                const tot = s.records.length;
                const rate = tot ? Math.round((pc / tot) * 100) : 0;
                return (
                  <div key={s.id} className="li" onClick={() => setViewingSession(s)}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
                    <div className="li-info">
                      <div className="li-name">{grp?.name || "Unknown Group"}</div>
                      <div className="li-sub">{fmtDate(s.date)} · {pc}/{tot} present</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: rate >= 70 ? "var(--success)" : rate >= 50 ? "var(--accent)" : "var(--danger)" }}>{rate}%</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>rate</div>
                    </div>
                  </div>
                );
              })}
              <div className="stitle" style={{ marginTop: 20, marginBottom: 10 }}>Groups</div>
            </div>
          )}
          {groups.map(g => {
            const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
            const av  = getAv(g.name);
            const sc  = attendanceHistory.filter(h => h.groupId === g.id).length;
            return (
              <div key={g.id} className="li" onClick={() => startMarking(g)}>
                <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
                <div className="li-info">
                  <div className="li-name">{g.name}</div>
                  <div className="li-sub">{cnt} members · {sc} session{sc !== 1 ? "s" : ""}</div>
                </div>
                <ChevR />
              </div>
            );
          })}
          {groups.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No groups yet. Create one in Groups.</p></div>}
        </div>
      </div>
    );
  }

  // ── DATE SELECTION ────────────────────────────────────────────────────────
  if (step === "date") {
    const sessForGrp = attendanceHistory.filter(h => h.groupId === selGrp.id);
    const selSess    = sessForGrp.find(s => s.date === selDate);
    const thisSun = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split("T")[0]; })();
    const lastSun = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() - 7); return d.toISOString().split("T")[0]; })();

    return (
      <div className="page">
        <div className="ph">
          <button className="btn bg" style={{ marginBottom: 14 }} onClick={() => setStep("group")}><ChevL /> All Groups</button>
          <h1>{selGrp.name}</h1><p>Pick a date</p>
        </div>
        <div className="pc">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[thisSun, lastSun].map((d, i) => {
              const s   = sessForGrp.find(x => x.date === d);
              const sel = selDate === d;
              return (
                <div key={d} onClick={() => setSelDate(d)} style={{ padding: "14px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: sel ? "var(--brand)" : "var(--surface)", color: sel ? "#fff" : "var(--text)", border: `2px solid ${sel ? "var(--brand)" : s ? "var(--success)" : "var(--border)"}`, transition: "all .12s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginBottom: 4, textTransform: "uppercase" }}>{i === 0 ? "This Sunday" : "Last Sunday"}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtDate(d)}</div>
                  {s   && <div style={{ fontSize: 11, marginTop: 4, color: sel ? "rgba(255,255,255,.8)" : "var(--success)", fontWeight: 600 }}>✓ {s.records.filter(r => r.present).length}/{s.records.length}</div>}
                  {!s  && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.5 }}>Not marked</div>}
                </div>
              );
            })}
          </div>
          <div className="fg" style={{ marginBottom: 16 }}>
            <label className="fl">Or pick a different date</label>
            <input className="fi" type="date" value={selDate} onChange={e => setSelDate(e.target.value)} />
          </div>
          {selSess ? (
            <div style={{ background: "#fff8e6", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#8a5a00", marginBottom: 4 }}>⚡ Already recorded</div>
              <div style={{ fontSize: 13, color: "#8a5a00" }}>{selSess.records.filter(r => r.present).length} present · {selSess.records.filter(r => !r.present).length} absent</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className="btn bg" style={{ flex: 1, fontSize: 13 }} onClick={() => setViewingSession(selSess)}>👁 View</button>
                <button className="btn ba" style={{ flex: 1, fontSize: 13 }} onClick={proceedFromDate}>✏️ Edit</button>
              </div>
            </div>
          ) : (
            <button className="btn bp blg" onClick={proceedFromDate}>Start Marking →</button>
          )}
        </div>
      </div>
    );
  }

  // ── MARK ATTENDANCE ───────────────────────────────────────────────────────
  if (step === "mark") return (
    <div style={{ paddingBottom: 160 }}>
      {/* ── Sticky header: back + group/date + absent count ── */}
      <div className="att-top">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button className="btn bg" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => setStep("date")}>
            <ChevL /> Back
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>{selGrp.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(selDate)}</div>
          </div>
        </div>

        {/* Compact absent count + hint */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "8px 12px", background: absentCnt > 0 ? "#fff0f0" : "#f0fdf6", borderRadius: 10, border: `1px solid ${absentCnt > 0 ? "#f5c8c8" : "#c3f0d8"}` }}>
          <span style={{ fontSize: 13, color: absentCnt > 0 ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
            {absentCnt === 0 ? "✓ All present — tap ✗ to mark absent" : `✗ ${absentCnt} absent · ${presentCnt} present`}
          </span>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: absentCnt > 0 ? "var(--danger)" : "var(--success)" }}>
            {absentCnt > 0 ? absentCnt : "✓"}
          </span>
        </div>
      </div>

      {/* ── Member list ── */}
      <div style={{ padding: "12px 16px" }}>
        {recs.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No members in this group.</p></div>}
        {recs.map(r => {
          const av       = getAv(r.name);
          const isAbsent = r.present === false;
          return (
            <div key={r.memberId} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 14px", borderRadius: 14, marginBottom: 8,
              background: isAbsent ? "#fff0f0" : "var(--surface)",
              border: `1.5px solid ${isAbsent ? "var(--danger)" : "var(--border)"}`,
              transition: "all .1s",
            }}>
              <div className="av" style={{ background: av.bg, color: av.color, width: 38, height: 38, borderRadius: 10, fontSize: 13, flexShrink: 0 }}>{av.initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                <div style={{ fontSize: 12, marginTop: 2, color: isAbsent ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                  {isAbsent ? "Absent" : "Present"}
                </div>
              </div>
              {/* Single action button on right — always shows the opposite of current state */}
              <button
                onClick={() => toggleAbsent(r.memberId)}
                style={{
                  flexShrink: 0, minWidth: 72, padding: "9px 14px",
                  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", transition: "all .1s",
                  background: isAbsent ? "var(--danger)" : "var(--surface2)",
                  color: isAbsent ? "#fff" : "var(--muted)",
                  border: `1.5px solid ${isAbsent ? "var(--danger)" : "var(--border)"}`,
                }}>
                {isAbsent ? "✗ Absent" : "✗ Absent"}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Fixed bottom: error + save ── */}
      <div className="att-bot">
        {saveErr && (
          <div style={{ background: "#fce8e8", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "var(--danger)" }}>
            ⚠️ {saveErr}
          </div>
        )}
        <button className="btn bp" style={{ width: "100%", borderRadius: 12, padding: "14px", fontSize: 16 }}
          onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Attendance"}
        </button>
      </div>
    </div>
  );

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  if (step === "summary") {
    return (
      <SessionSummary session={currentSession} group={selGrp}
        onBack={() => setStep("group")}
        onContinueMarking={() => { setSaveErr(""); setStep("mark"); }}
        showToast={showToast}
      />
    );
  }
}