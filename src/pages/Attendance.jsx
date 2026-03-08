// src/pages/Attendance.jsx
import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { fmtDate } from "../lib/helpers";
import { ChevL, ChevR } from "../components/ui/Icons";

function SessionSummary({ session, group, onBack, onContinueMarking, showToast }) {
  const recs       = session.records;
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);
  const rate       = recs.length ? Math.round((presentCnt / recs.length) * 100) : 0;

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={onBack}><ChevL /> Back</button>
        <h1>Summary</h1>
        <p>{group?.name} · {fmtDate(session.date)}</p>
      </div>
      <div className="pc">
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[["Total", recs.length, "var(--brand)"], ["Present", presentCnt, "var(--success)"], ["Absent", absentCnt, "var(--danger)"]].map(([l, v, c]) => (
            <div key={l} style={{ background: "var(--surface)", borderRadius: 14, padding: "14px 10px", textAlign: "center", border: "1.5px solid var(--border)" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 30, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Attendance bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>Attendance rate</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: rate >= 70 ? "var(--success)" : rate >= 50 ? "var(--accent)" : "var(--danger)" }}>{rate}%</span>
          </div>
          <div style={{ background: "var(--surface2)", borderRadius: 12, overflow: "hidden", height: 10 }}>
            <div style={{ width: `${rate}%`, height: "100%", background: `linear-gradient(90deg, ${rate >= 70 ? "var(--success), #5ad98a" : rate >= 50 ? "var(--accent), #f5c842" : "var(--danger), #f87171"})`, borderRadius: 12, transition: "width .8s" }} />
          </div>
        </div>

        {/* Absentees */}
        {absentList.length > 0 ? (
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1.5px solid var(--border)", marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Absent ({absentList.length})</div>
            </div>
            {absentList.map((r, i) => (
              <div key={r.memberId} style={{ padding: "12px 16px", borderBottom: i < absentList.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <span style={{ background: "#fce8e8", color: "var(--danger)", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Absent</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0", background: "#f0fdf6", borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 44 }}>🎉</div>
            <div style={{ fontWeight: 700, color: "var(--success)", marginTop: 10, fontSize: 18 }}>Full attendance!</div>
          </div>
        )}

        {/* Present list */}
        {presentCnt > 0 && (
          <div style={{ background: "var(--surface)", borderRadius: 16, border: "1.5px solid var(--border)", marginBottom: 16, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Present ({presentCnt})</div>
            </div>
            {recs.filter(r => r.present === true).map((r, i, arr) => (
              <div key={r.memberId} style={{ padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <span style={{ background: "#d4f1e4", color: "#1a6640", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>Present</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          {onContinueMarking && <button className="btn bg" style={{ flex: 1 }} onClick={onContinueMarking}>✏️ Edit</button>}
          <button className="btn bp" style={{ flex: 1 }} onClick={onBack}>Done</button>
        </div>
      </div>
    </div>
  );
}

async function withRetry(fn, maxAttempts = 3, delayMs = 800) {
  let lastError;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await fn();
      if (!result.error) return result;
      lastError = result.error;
      const msg = lastError?.message || "";
      if (msg.includes("permission") || msg.includes("policy") || msg.includes("auth")) break;
      if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    } catch (e) {
      lastError = { message: e?.message || "Unexpected error" };
      if (i < maxAttempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  return { data: null, error: lastError };
}

export default function Attendance({ groups, members, attendanceHistory, saveAttendance, showToast }) {
  const [step,             setStep]             = useState("group");
  const [selGrp,           setSelGrp]           = useState(null);
  const [selDate,          setSelDate]          = useState(new Date().toISOString().split("T")[0]);
  const [recs,             setRecs]             = useState([]);
  const [viewingSession,   setViewingSession]   = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [saveErr,          setSaveErr]          = useState("");
  const [search,           setSearch]           = useState("");

  const startMarking = (g) => { setSelGrp(g); setStep("date"); };

  const proceedFromDate = () => {
    setSaveErr("");
    const existing = attendanceHistory.find(h => h.groupId === selGrp.id && h.date === selDate);
    if (existing) {
      setRecs(existing.records.map(r => ({ ...r })));
      setEditingSessionId(existing.id);
    } else {
      const gm = members.filter(m => (m.groupIds || []).includes(selGrp.id));
      setRecs(gm.map(m => ({ memberId: m.id, name: m.name, present: true })));
      setEditingSessionId(null);
    }
    setSearch("");
    setStep("mark");
  };

  const toggleAbsent = (id) =>
    setRecs(rs => rs.map(r => r.memberId === id ? { ...r, present: !r.present } : r));

  const markAll = (present) => setRecs(rs => rs.map(r => ({ ...r, present })));

  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;

  const filteredRecs = search.trim()
    ? recs.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : recs;

  const save = async () => {
    setSaveErr("");
    setSaving(true);
    try {
      const session = {
        id:      editingSessionId || undefined,
        groupId: selGrp.id,
        date:    selDate,
        records: recs.map(r => ({ ...r })),
      };
      const { data, error } = await withRetry(() => saveAttendance(session));
      if (error) {
        setSaveErr(error?.message || "Unknown error");
        showToast("Save failed — tap Retry ❌");
        return;
      }
      const savedId = data?.id || editingSessionId;
      if (!editingSessionId && savedId) setEditingSessionId(savedId);
      showToast("Attendance saved! ✅");
      setStep("summary");
    } catch (e) {
      setSaveErr(e?.message || "Unexpected error");
      showToast("Save failed — tap Retry ❌");
    } finally {
      setSaving(false);
    }
  };

  const currentSession = editingSessionId
    ? attendanceHistory.find(s => s.id === editingSessionId) || { id: editingSessionId, groupId: selGrp?.id, date: selDate, records: recs }
    : { id: null, groupId: selGrp?.id, date: selDate, records: recs };

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

  // ── GROUP SELECTION ──────────────────────────────────────────────────────
  if (step === "group") return (
    <div className="page">
      <div className="ph"><h1>Attendance</h1><p>Select a group to mark</p></div>
      <div className="pc">
        {groups.length === 0 && (
          <div className="empty"><div className="empty-ico">👥</div><p>No groups yet. Create one in Groups.</p></div>
        )}
        {groups.map(g => {
          const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
          const lastSess = [...attendanceHistory].filter(h => h.groupId === g.id).sort((a, b) => b.date.localeCompare(a.date))[0];
          const rate = lastSess && lastSess.records.length
            ? Math.round((lastSess.records.filter(r => r.present).length / lastSess.records.length) * 100)
            : null;
          return (
            <div key={g.id}
              onClick={() => startMarking(g)}
              style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "16px", marginBottom: 10, cursor: "pointer" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                  {cnt} members{lastSess ? ` · Last: ${fmtDate(lastSess.date)}` : " · No sessions yet"}
                </div>
              </div>
              {rate !== null && (
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: rate >= 70 ? "var(--success)" : rate >= 50 ? "var(--accent)" : "var(--danger)" }}>{rate}%</div>
                  <div style={{ fontSize: 10, color: "var(--muted)" }}>last</div>
                </div>
              )}
              <ChevR />
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── DATE SELECTION ───────────────────────────────────────────────────────
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
              const s = sessForGrp.find(x => x.date === d);
              const sel = selDate === d;
              return (
                <div key={d} onClick={() => setSelDate(d)} style={{ padding: "16px 12px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: sel ? "var(--brand)" : "var(--surface)", color: sel ? "#fff" : "var(--text)", border: `2px solid ${sel ? "var(--brand)" : s ? "var(--success)" : "var(--border)"}`, transition: "all .12s" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, marginBottom: 4, textTransform: "uppercase" }}>{i === 0 ? "This Sunday" : "Last Sunday"}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtDate(d)}</div>
                  {s  && <div style={{ fontSize: 11, marginTop: 4, color: sel ? "rgba(255,255,255,.8)" : "var(--success)", fontWeight: 600 }}>✓ {s.records.filter(r => r.present).length}/{s.records.length}</div>}
                  {!s && <div style={{ fontSize: 11, marginTop: 4, opacity: 0.5 }}>Not marked</div>}
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

  // ── MARK ATTENDANCE ──────────────────────────────────────────────────────
  if (step === "mark") return (
    <div style={{ paddingBottom: 160 }}>

      {/* Sticky top bar */}
      <div className="att-top">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button className="btn bg" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => setStep("date")}>
            <ChevL /> Back
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>{selGrp.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(selDate)}</div>
          </div>
        </div>

        {/* Live counter */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, background: "#f0fdf6", border: "1px solid #c3f0d8", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--success)" }}>{presentCnt}</div>
            <div style={{ fontSize: 11, color: "var(--success)", fontWeight: 600 }}>Present</div>
          </div>
          <div style={{ flex: 1, background: absentCnt > 0 ? "#fff0f0" : "var(--surface2)", border: `1px solid ${absentCnt > 0 ? "#f5c8c8" : "var(--border)"}`, borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: absentCnt > 0 ? "var(--danger)" : "var(--muted)" }}>{absentCnt}</div>
            <div style={{ fontSize: 11, color: absentCnt > 0 ? "var(--danger)" : "var(--muted)", fontWeight: 600 }}>Absent</div>
          </div>
          <div style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--muted)" }}>{recs.length}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Total</div>
          </div>
        </div>

        {/* Search + mark all */}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="fi"
            placeholder="Search name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: "9px 12px", fontSize: 14 }}
          />
          <button onClick={() => markAll(true)}
            style={{ background: "#f0fdf6", border: "1px solid var(--success)", borderRadius: 10, padding: "0 12px", fontSize: 12, fontWeight: 700, color: "var(--success)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
            All ✓
          </button>
          <button onClick={() => markAll(false)}
            style={{ background: "#fff0f0", border: "1px solid var(--danger)", borderRadius: 10, padding: "0 12px", fontSize: 12, fontWeight: 700, color: "var(--danger)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
            All ✗
          </button>
        </div>
      </div>

      {/* Member list */}
      <div style={{ padding: "12px 16px" }}>
        {recs.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No members in this group.</p></div>}
        {filteredRecs.length === 0 && search && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: 14 }}>No results for "{search}"</div>
        )}

        {filteredRecs.map(r => {
          const isAbsent = r.present === false;
          return (
            <div
              key={r.memberId}
              onClick={() => toggleAbsent(r.memberId)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 16px", borderRadius: 14, marginBottom: 8,
                background: isAbsent ? "#fff0f0" : "var(--surface)",
                border: `2px solid ${isAbsent ? "var(--danger)" : "var(--border)"}`,
                cursor: "pointer", transition: "all .1s", gap: 12,
              }}>
              {/* Name — wraps freely */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, wordBreak: "break-word", lineHeight: 1.3 }}>{r.name}</div>
                <div style={{ fontSize: 12, marginTop: 3, color: isAbsent ? "var(--danger)" : "var(--success)", fontWeight: 600 }}>
                  {isAbsent ? "✗ Absent" : "✓ Present"}
                </div>
              </div>

              {/* Big toggle button */}
              <div style={{
                flexShrink: 0,
                width: 52, height: 52, borderRadius: 14,
                background: isAbsent ? "var(--danger)" : "#f0fdf6",
                border: `2px solid ${isAbsent ? "var(--danger)" : "var(--success)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, transition: "all .1s",
              }}>
                {isAbsent ? "✗" : "✓"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save bar */}
      <div className="att-bot">
        {saveErr && (
          <div style={{ background: "#fce8e8", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "var(--danger)" }}>
            ⚠️ {saveErr}
          </div>
        )}
        <button className="btn bp" style={{ width: "100%", borderRadius: 12, padding: "16px", fontSize: 16, fontWeight: 700 }}
          onClick={save} disabled={saving}>
          {saving ? "Saving…" : saveErr ? "🔄 Retry" : `Save Attendance · ${presentCnt} Present`}
        </button>
      </div>
    </div>
  );

  if (step === "summary") return (
    <SessionSummary session={currentSession} group={selGrp}
      onBack={() => setStep("group")}
      onContinueMarking={() => { setSaveErr(""); setStep("mark"); }}
      showToast={showToast}
    />
  );
}