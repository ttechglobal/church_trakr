// src/pages/Attendance.jsx
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { fmtDate } from "../lib/helpers";
import { ChevL, ChevR } from "../components/ui/Icons";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  forest:    "#1a3a2a",
  forestMid: "#2d5a42",
  forestDim: "#1e4a34",
  green:     "#16a34a",
  greenSoft: "#dcfce7",
  red:       "#dc2626",
  redSoft:   "#fef2f2",
  redBorder: "#fecaca",
  ivory:     "#fafaf8",
  warm:      "#f5f4f0",
  muted:     "#9ca3af",
  border:    "#e8e6e1",
  text:      "#1c1917",
  serif:     "'Playfair Display', Georgia, serif",
  sans:      "'DM Sans', sans-serif",
};

const rateColor = r => r >= 80 ? T.green : r >= 60 ? "#d97706" : T.red;

// ── Reusable luxury back button (text-only, minimal) ─────────────────────────
const BackBtn = ({ label = "Back", onClick, light = false }) => (
  <button onClick={onClick} style={{
    background: light ? "rgba(255,255,255,.12)" : "none",
    border: light ? "1px solid rgba(255,255,255,.2)" : "none",
    color: light ? "rgba(255,255,255,.8)" : T.muted,
    cursor: "pointer", padding: light ? "7px 14px" : "6px 0",
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: T.sans, fontWeight: 500, fontSize: 13,
    borderRadius: light ? 10 : 0, letterSpacing: ".02em",
  }}>
    <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
      <path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {label}
  </button>
);

// ── Luxury gradient header ────────────────────────────────────────────────────
const GreenHeader = ({ children }) => (
  <div style={{
    background: `linear-gradient(150deg, ${T.forest} 0%, ${T.forestMid} 60%, ${T.forestDim} 100%)`,
    padding: "max(env(safe-area-inset-top,32px),32px) 24px 24px",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200,
      borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />
    <div style={{ position:"absolute", bottom:-30, left:-20, width:120, height:120,
      borderRadius:"50%", background:"rgba(255,255,255,.02)", pointerEvents:"none" }} />
    {children}
  </div>
);

// ── Session Summary ───────────────────────────────────────────────────────────
function SessionSummary({ session, group, onBack, onContinueMarking }) {
  const recs       = session.records;
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);
  const rate       = recs.length ? Math.round((presentCnt / recs.length) * 100) : 0;
  const rc         = rateColor(rate);

  return (
    <div className="page" style={{ background: T.ivory, minHeight:"100vh" }}>
      <GreenHeader>
        <BackBtn label="Back" onClick={onBack} light />

        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginTop:14 }}>
          <div>
            <div style={{ fontFamily: T.serif, fontSize:22, fontWeight:700, color:"#fff",
              letterSpacing:"-.01em" }}>Attendance Report</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", marginTop:4,
              fontFamily: T.sans }}>{group?.name} · {fmtDate(session.date)}</div>
          </div>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily: T.serif, fontSize:44, fontWeight:700, lineHeight:1,
              color: rate >= 80 ? "#6ee7b7" : rate >= 60 ? "#fcd34d" : "#fca5a5" }}>{rate}%</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:3,
              letterSpacing:".08em", textTransform:"uppercase", fontFamily: T.sans }}>attendance</div>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, marginTop:20 }}>
          {[["Present", presentCnt, "#6ee7b7", "rgba(110,231,183,.1)"],
            ["Absent",  absentCnt,  "#fca5a5", "rgba(252,165,165,.1)"],
            ["Total",   recs.length,"rgba(255,255,255,.45)","rgba(255,255,255,.06)"]
          ].map(([l, v, col, bg]) => (
            <div key={l} style={{ flex:1, background:bg, borderRadius:12,
              padding:"12px 8px", textAlign:"center",
              border:"1px solid rgba(255,255,255,.07)" }}>
              <div style={{ fontFamily: T.serif, fontWeight:700, fontSize:22,
                color:col, lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:10, color:col, fontWeight:600, marginTop:4,
                opacity:0.75, letterSpacing:".04em", textTransform:"uppercase",
                fontFamily: T.sans }}>{l}</div>
            </div>
          ))}
        </div>
      </GreenHeader>

      <div style={{ padding:"20px 20px 32px" }}>
        <div style={{ display:"flex", gap:10, marginBottom:24 }}>
          {onContinueMarking && (
            <button onClick={onContinueMarking} style={{
              flex:1, padding:"14px 10px", borderRadius:14,
              background:"#fff", border:`1.5px solid ${T.border}`,
              fontFamily: T.sans, fontWeight:700, fontSize:14,
              color: T.text, cursor:"pointer",
              boxShadow:"0 1px 4px rgba(0,0,0,.05)",
            }}>Edit Attendance</button>
          )}
          <button onClick={onBack} style={{
            flex:1, padding:"14px 10px", borderRadius:14,
            background: T.forest, border:"none",
            fontFamily: T.sans, fontWeight:700, fontSize:14,
            color:"#fff", cursor:"pointer",
            boxShadow:`0 4px 16px rgba(26,58,42,.3)`,
          }}>Done</button>
        </div>

        {absentList.length > 0 ? (
          <div style={{ background:"#fff", borderRadius:18, overflow:"hidden",
            border:`1px solid ${T.border}`, marginBottom:14,
            boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background: T.red, flexShrink:0 }} />
              <div style={{ fontFamily: T.sans, fontWeight:700, fontSize:13,
                color: T.red, letterSpacing:".02em",
                textTransform:"uppercase" }}>Absent · {absentList.length}</div>
              <div style={{ marginLeft:"auto", fontSize:11, color:T.muted, fontFamily:T.sans,
                fontWeight:600, letterSpacing:".03em" }}>Needs follow-up</div>
            </div>
            {absentList.map((r, i) => (
              <div key={r.memberId} style={{
                padding:"14px 18px",
                borderBottom: i < absentList.length - 1 ? `1px solid ${T.border}` : "none",
                display:"flex", alignItems:"center", justifyContent:"space-between",
              }}>
                <div style={{ fontWeight:600, fontSize:14, fontFamily: T.sans,
                  color: T.text }}>{r.name}</div>
                <div style={{ width:6, height:6, borderRadius:"50%",
                  background: T.red, opacity:0.6 }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: T.greenSoft, borderRadius:18, padding:"28px 20px",
            textAlign:"center", marginBottom:14,
            border:`1px solid rgba(22,163,74,.15)` }}>
            <div style={{ fontSize:36, marginBottom:10 }}>✦</div>
            <div style={{ fontFamily: T.serif, fontWeight:700, color: T.green,
              fontSize:18 }}>Full attendance</div>
            <div style={{ fontSize:13, color: T.green, marginTop:4,
              opacity:0.7, fontFamily: T.sans }}>Everyone was present</div>
          </div>
        )}

        {presentCnt > 0 && (
          <div style={{ background:"#fff", borderRadius:18, overflow:"hidden",
            border:`1px solid ${T.border}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ padding:"14px 18px", borderBottom:`1px solid ${T.border}`,
              display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%",
                background: T.green, flexShrink:0 }} />
              <div style={{ fontFamily: T.sans, fontWeight:700, fontSize:13,
                color: T.green, letterSpacing:".02em",
                textTransform:"uppercase" }}>Present · {presentCnt}</div>
            </div>
            {recs.filter(r => r.present === true).map((r, i, arr) => (
              <div key={r.memberId} style={{
                padding:"14px 18px",
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none",
                display:"flex", alignItems:"center", justifyContent:"space-between",
              }}>
                <div style={{ fontWeight:500, fontSize:14, fontFamily: T.sans,
                  color: T.text }}>{r.name}</div>
                <div style={{ width:6, height:6, borderRadius:"50%",
                  background: T.green, opacity:0.5 }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Retry helper ─────────────────────────────────────────────────────────────
// Retries up to 3 times with increasing delay.
// IMPORTANT: we no longer break early on permission/auth errors.
// On first load, the Supabase session token may not be attached yet,
// so the first attempt gets a permission error. Retrying after 800ms
// gives the session time to restore and the second attempt succeeds.
// withRetry removed — saveAttendance in App.jsx already handles:
// 1. ensureSession() before the call
// 2. token refresh + one retry on auth errors
// 3. offline queue on network errors
// Adding a second retry layer here caused "saves on first tap don't stick"
// because the stacked retries raced each other and the UI showed the
// first attempt's error while the second was still running server-side.

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Attendance({ groups, members, attendanceHistory, saveAttendance, showToast }) {
  const { church } = useAuth();
  const [step,             setStep]             = useState("group");
  const [selGrp,           setSelGrp]           = useState(null);
  const [selDate,          setSelDate]          = useState(new Date().toISOString().split("T")[0]);
  const [recs,             setRecs]             = useState([]);
  const [viewingSession,   setViewingSession]   = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [saveErr,          setSaveErr]          = useState("");
  const [markMode,         setMarkMode]         = useState("mark_present"); // "mark_present" | "mark_absent"

  const startMarking = (g) => {
    // Always fully reset session state before starting a new group.
    // Without this, editingSessionId from a previous session persists in memory
    // (React doesn't unmount the page between navigations), causing the save
    // to attempt updating the wrong session ID.
    setSelGrp(g);
    setEditingSessionId(null);
    setRecs([]);
    setSaveErr("");
    setStep("date");
  };
  const togglePresent  = (id) => setRecs(rs => rs.map(r => r.memberId === id ? { ...r, present: !r.present } : r));
  const presentCnt     = recs.filter(r => r.present === true).length;
  const absentCnt      = recs.filter(r => r.present === false).length;

  const proceedFromDate = () => {
    setSaveErr("");
    const existing = attendanceHistory.find(h => h.groupId === selGrp.id && h.date === selDate);
    if (existing) {
      setRecs(existing.records.map(r => ({ ...r })));
      setEditingSessionId(existing.id);
    } else {
      const gm   = members.filter(m => (m.groupIds || []).includes(selGrp.id));
      // Read marking mode preference from Settings (default: mark_present)
      const mode = (church?.id ? localStorage.getItem(`attendance_mode_${church.id}`) : null) || "mark_present";
      setMarkMode(mode);
      // mark_present (default) → everyone starts ABSENT, tap = mark present
      // mark_absent → everyone starts PRESENT, tap = mark absent
      const defaultPresent = mode === "mark_absent";
      setRecs(gm.map(m => ({ memberId: m.id, name: m.name, present: defaultPresent })));
      setEditingSessionId(null);
    }
    setStep("mark");
  };

  const save = async () => {
    setSaveErr(""); setSaving(true);
    try {
      const session = { id: editingSessionId || undefined, groupId: selGrp.id, date: selDate, records: recs.map(r => ({ ...r })) };
      const { data, error, offline } = await saveAttendance(session);
      if (error) { setSaveErr(error?.message || "Unknown error"); showToast("Save failed ❌"); return; }
      const savedId = data?.id || editingSessionId;
      if (!editingSessionId && savedId) setEditingSessionId(savedId);
      if (offline) {
        showToast("📶 Saved offline — will sync when back online");
      } else {
        showToast("Attendance saved ✅");
      }
      setStep("summary");
    } catch (e) {
      setSaveErr(e?.message || "Unexpected error");
      showToast("Save failed ❌");
    } finally { setSaving(false); }
  };

  const currentSession = editingSessionId
    ? attendanceHistory.find(s => s.id === editingSessionId) || { id: editingSessionId, groupId: selGrp?.id, date: selDate, records: recs }
    : { id: null, groupId: selGrp?.id, date: selDate, records: recs };

  // ── Viewing past session ─────────────────────────────────────────────────
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
      />
    );
  }

  // ── Step 1: Group selection ──────────────────────────────────────────────
  if (step === "group") return (
    <div className="page" style={{ background: T.ivory, minHeight:"100vh" }}>
      <GreenHeader>
        <div style={{ fontFamily: T.serif, fontSize:29, fontWeight:800, color:"#fff",
          letterSpacing:"-.02em" }}>Attendance</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.48)", marginTop:5,
          fontFamily: T.sans, fontWeight:500 }}>Select a group to mark</div>
      </GreenHeader>

      <div style={{ padding:"20px 20px 32px" }}>
        {groups.length === 0 && (
          <div style={{ background:"#fff", borderRadius:20, padding:"40px 24px", textAlign:"center",
            border:`1px solid ${T.border}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize:52, marginBottom:16, lineHeight:1 }}>👥</div>
            <div style={{ fontFamily:T.serif, fontWeight:700, fontSize:18, marginBottom:8, color:T.text }}>
              No groups yet
            </div>
            <p style={{ fontSize:13.5, color:T.muted, lineHeight:1.7, marginBottom:20 }}>
              Create a group first, then you can mark attendance for it.
            </p>
          </div>
        )}
        {groups.map(g => {
          const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
          const lastSess = [...attendanceHistory].filter(h => h.groupId === g.id)
            .sort((a, b) => b.date.localeCompare(a.date))[0];
          const rate = lastSess && lastSess.records.length
            ? Math.round((lastSess.records.filter(r => r.present).length / lastSess.records.length) * 100)
            : null;
          return (
            <div key={g.id} onClick={() => startMarking(g)}
              onMouseEnter={e => { e.currentTarget.style.boxShadow="0 4px 20px rgba(26,58,42,.12)"; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.borderColor=T.forest+"44"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.04)"; e.currentTarget.style.transform=""; e.currentTarget.style.borderColor=T.border; }}
              style={{
              display:"flex", alignItems:"center", gap:16,
              background:"#fff", border:`1px solid ${T.border}`,
              borderRadius:18, padding:"18px 20px", marginBottom:10,
              cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,.04)",
              transition:"all .18s cubic-bezier(.4,0,.2,1)",
            }}>
              <div style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background:`linear-gradient(135deg, ${T.forestMid}, ${T.forest})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily: T.serif, fontWeight:700, fontSize:18, color:"rgba(255,255,255,.85)",
              }}>{g.name.charAt(0)}</div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:16, fontFamily: T.sans,
                  color: T.text, letterSpacing:"-.01em" }}>{g.name}</div>
                <div style={{ fontSize:12, color: T.muted, marginTop:3, fontFamily: T.sans }}>
                  {cnt} member{cnt !== 1 ? "s" : ""}
                  {lastSess ? ` · ${fmtDate(lastSess.date)}` : " · No sessions yet"}
                </div>
              </div>

              {rate !== null && (
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily: T.serif, fontWeight:700, fontSize:18,
                    color:rateColor(rate) }}>{rate}%</div>
                  <div style={{ fontSize:10, color: T.muted, letterSpacing:".04em",
                    textTransform:"uppercase", fontFamily: T.sans, marginTop:1 }}>last</div>
                </div>
              )}
              <svg width="6" height="11" viewBox="0 0 6 11" fill="none" style={{ opacity:0.25, flexShrink:0 }}>
                <path d="M1 1l4 4.5L1 10" stroke={T.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Date selection ───────────────────────────────────────────────
  if (step === "date") {
    const sessForGrp = attendanceHistory.filter(h => h.groupId === selGrp.id);
    const selSess    = sessForGrp.find(s => s.date === selDate);
    const thisSun = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split("T")[0]; })();
    const lastSun = (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay() - 7); return d.toISOString().split("T")[0]; })();

    return (
      <div className="page" style={{ background: T.ivory, minHeight:"100vh" }}>
        <GreenHeader>
          <BackBtn label="All Groups" onClick={() => setStep("group")} light />
          <div style={{ fontFamily: T.serif, fontSize:24, fontWeight:700, color:"#fff",
            letterSpacing:"-.01em", marginTop:14 }}>{selGrp.name}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4,
            fontFamily: T.sans }}>Choose a date to mark</div>
        </GreenHeader>

        <div style={{ padding:"20px 20px 32px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            {[thisSun, lastSun].map((d, i) => {
              const s   = sessForGrp.find(x => x.date === d);
              const sel = selDate === d;
              return (
                <div key={d} onClick={() => setSelDate(d)} style={{
                  padding:"18px 14px", borderRadius:16, cursor:"pointer", textAlign:"center",
                  background: sel ? T.forest : "#fff",
                  color: sel ? "#fff" : T.text,
                  border:`1.5px solid ${sel ? T.forest : s ? T.green : T.border}`,
                  boxShadow: sel ? `0 4px 18px rgba(26,58,42,.25)` : "0 1px 4px rgba(0,0,0,.04)",
                  transition:"all .18s",
                }}>
                  <div style={{ fontSize:10, fontWeight:700, opacity:0.6, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:".08em", fontFamily: T.sans }}>
                    {i === 0 ? "This Sunday" : "Last Sunday"}
                  </div>
                  <div style={{ fontFamily: T.serif, fontWeight:700, fontSize:16 }}>{fmtDate(d)}</div>
                  {s  && <div style={{ fontSize:11, marginTop:6, fontWeight:600, fontFamily: T.sans,
                    color: sel ? "rgba(255,255,255,.7)" : T.green }}>
                    ✓ {s.records.filter(r => r.present).length}/{s.records.length}
                  </div>}
                  {!s && <div style={{ fontSize:11, marginTop:6, opacity:0.4, fontFamily: T.sans }}>Not marked yet</div>}
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:11, color: T.muted, fontFamily: T.sans,
              letterSpacing:".05em", textTransform:"uppercase", fontWeight:600,
              marginBottom:8 }}>Or choose a date</div>
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
              style={{
                width:"100%", padding:"13px 16px", borderRadius:12, fontSize:14,
                fontFamily: T.sans, fontWeight:500, color: T.text,
                background:"#fff", border:`1px solid ${T.border}`,
                boxSizing:"border-box", outline:"none",
              }} />
          </div>

          {selSess ? (
            <div style={{ background:"#fffbeb", border:`1px solid #fde68a`,
              borderRadius:16, padding:"16px 18px", marginBottom:4 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#92400e",
                fontFamily: T.sans, marginBottom:4, letterSpacing:".01em" }}>
                Already recorded for this date
              </div>
              <div style={{ fontSize:13, color:"#92400e", fontFamily: T.sans, opacity:0.8 }}>
                {selSess.records.filter(r => r.present).length} present
                · {selSess.records.filter(r => !r.present).length} absent
              </div>
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <button onClick={() => setViewingSession(selSess)} style={{
                  flex:1, padding:"12px", borderRadius:12, background:"#fff",
                  border:`1px solid #fde68a`, fontFamily: T.sans, fontWeight:600,
                  fontSize:13, color:"#92400e", cursor:"pointer",
                }}>View</button>
                <button onClick={proceedFromDate} style={{
                  flex:1, padding:"12px", borderRadius:12, background:T.forest,
                  border:"none", fontFamily: T.sans, fontWeight:700,
                  fontSize:13, color:"#fff", cursor:"pointer",
                }}>Edit</button>
              </div>
            </div>
          ) : (
            <button onClick={proceedFromDate} style={{
              width:"100%", padding:"17px", borderRadius:14,
              background: T.forest, border:"none",
              fontFamily: T.sans, fontWeight:700, fontSize:15,
              color:"#fff", cursor:"pointer", letterSpacing:".01em",
              boxShadow:`0 4px 18px rgba(26,58,42,.3)`,
            }}>Begin Marking →</button>
          )}
        </div>
      </div>
    );
  }

  // ── Step 3: Mark attendance ──────────────────────────────────────────────
  if (step === "mark") {
    const pct         = recs.length ? Math.round((presentCnt / recs.length) * 100) : 0;
    const barColor    = pct >= 80 ? T.green : pct >= 60 ? "#d97706" : T.red;
    const isMarkAbsent = markMode === "mark_absent";

    return (
      <div style={{ background: T.ivory, minHeight:"100vh", paddingBottom:110 }}>

        {/* ── Sticky header ── */}
        <div className="att-top" style={{ background: T.ivory }}>

          {/* Nav */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <BackBtn label="Back" onClick={() => setStep("date")} />
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:700, fontSize:15, color: T.text,
                fontFamily: T.sans, letterSpacing:"-.01em" }}>{selGrp.name}</div>
              <div style={{ fontSize:12, color: T.muted, marginTop:1,
                fontFamily: T.sans }}>{fmtDate(selDate)}</div>
            </div>
          </div>

          {/* ── Mode banner ── */}
          <div style={{
            background: isMarkAbsent ? "#fff8f0" : "#f0fdf6",
            border:`1px solid ${isMarkAbsent ? "#fed7aa" : "#bbf7d0"}`,
            borderRadius:12, padding:"10px 14px", marginBottom:12,
          }}>
            <div style={{ fontFamily: T.sans, fontWeight:700, fontSize:13,
              color: isMarkAbsent ? "#c2410c" : T.green, marginBottom:3 }}>
              {isMarkAbsent
                ? "✕  Marking absent members"
                : "✅  Marking present members (default)"}
            </div>
            <div style={{ fontFamily: T.sans, fontSize:11, color: T.muted, lineHeight:1.6 }}>
              {isMarkAbsent
                ? "Everyone starts as present. Tap ✕ to mark someone absent."
                : "Everyone starts as absent. Tap ✓ next to each person who is here."}
              {" "}
              <span
                onClick={() => showToast("Go to Settings → Attendance to change this")}
                style={{ color: T.forest, fontWeight:600, cursor:"pointer",
                  textDecoration:"underline", textDecorationStyle:"dotted" }}>
                Change in Settings
              </span>
            </div>
          </div>

          {/* Stat strip */}
          <div style={{
            display:"flex", alignItems:"center",
            background:"#fff", borderRadius:16, padding:"14px 22px",
            border:`1px solid ${T.border}`,
            boxShadow:"0 1px 6px rgba(0,0,0,.04)",
            marginBottom:12,
          }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily: T.serif, fontWeight:700, fontSize:30,
                color: T.green, lineHeight:1 }}>{presentCnt}</div>
              <div style={{ fontSize:11, color: T.green, fontWeight:600, marginTop:3,
                letterSpacing:".05em", textTransform:"uppercase", fontFamily: T.sans }}>Present</div>
            </div>
            <div style={{ width:1, height:36, background: T.border, flexShrink:0, margin:"0 20px" }} />
            <div style={{ flex:1, textAlign:"right" }}>
              <div style={{ fontFamily: T.serif, fontWeight:700, fontSize:30, lineHeight:1,
                color: absentCnt > 0 ? T.red : T.muted,
                transition:"color .2s" }}>{absentCnt}</div>
              <div style={{ fontSize:11, fontWeight:600, marginTop:3,
                letterSpacing:".05em", textTransform:"uppercase", fontFamily: T.sans,
                color: absentCnt > 0 ? T.red : T.muted,
                transition:"color .2s" }}>Absent</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background: T.border, borderRadius:99, height:4, overflow:"hidden", marginBottom:7 }}>
            <div style={{
              width:`${pct}%`, height:"100%", borderRadius:99, background:barColor,
              transition:"width .35s ease",
            }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:12, color: T.muted, fontFamily: T.sans }}>
              {isMarkAbsent
                ? `${recs.length} members · tap ✕ to mark absent`
                : `${recs.length} members · tap ✓ to mark present`}
            </span>
            <span style={{ fontSize:12, fontWeight:700, color:barColor,
              fontFamily: T.sans }}>{pct}%</span>
          </div>
        </div>

        {/* ── Member list ── */}
        <div style={{ padding:"10px 16px 0" }}>
          {recs.length === 0 && (
            <div className="empty"><div className="empty-ico">👥</div><p>No members in this group.</p></div>
          )}

          {recs.map((r, idx) => {
            const isPresent = r.present === true;
            const isAbsent  = r.present === false;

            // mark_present mode (default): tap = mark PRESENT → row goes green
            // mark_absent  mode:           tap = mark ABSENT  → row goes red
            const rowHighlighted = isMarkAbsent ? isAbsent : isPresent;
            const rowBg     = rowHighlighted ? (isMarkAbsent ? T.redSoft   : T.greenSoft) : "#fff";
            const rowBorder = rowHighlighted ? (isMarkAbsent ? T.redBorder : "rgba(22,163,74,.25)") : T.border;
            const rowShadow = rowHighlighted ? (isMarkAbsent ? "0 2px 10px rgba(220,38,38,.07)" : "0 2px 10px rgba(22,163,74,.07)") : "0 1px 3px rgba(0,0,0,.03)";
            const nameColor = rowHighlighted ? (isMarkAbsent ? T.red : T.green) : T.muted;
            const btnActive = rowHighlighted;
            const btnBg     = btnActive ? (isMarkAbsent ? T.red : T.green) : "transparent";
            const btnBorder = btnActive ? (isMarkAbsent ? T.red : T.green) : "#e2e0da";

            return (
              <div key={r.memberId} style={{
                display:"flex", alignItems:"center",
                padding:"17px 18px", borderRadius:16, marginBottom:8,
                background: rowBg, border:`1px solid ${rowBorder}`,
                gap:14, transition:"all .2s",
                boxShadow: rowShadow,
              }}>
                {/* Row number */}
                <div style={{
                  flexShrink:0, width:22, textAlign:"right",
                  fontFamily: T.sans, fontSize:11, color: T.muted,
                  fontWeight:400, opacity:0.5, userSelect:"none",
                }}>{idx + 1}</div>

                {/* Name */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontWeight:600, fontSize:15, lineHeight:1.3,
                    fontFamily: T.sans, letterSpacing:"-.01em",
                    color: nameColor, transition:"color .2s",
                  }}>{r.name}</div>
                </div>

                {/* Action button — ✓ for present, ✕ for absent */}
                <button
                  onClick={() => togglePresent(r.memberId)}
                  style={{
                    flexShrink:0, width:36, height:36, borderRadius:10,
                    border:`1.5px solid ${btnBorder}`,
                    background: btnBg,
                    cursor:"pointer", display:"flex", alignItems:"center",
                    justifyContent:"center", padding:0,
                    transition:"all .2s",
                  }}
                  aria-label={isPresent ? "Mark absent" : "Mark present"}
                >
                  {btnActive ? (
                    isMarkAbsent ? (
                      /* Red ✕ for marking absent */
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform:"rotate(5deg)" }}>
                        <line x1="1" y1="1" x2="11" y2="11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="11" y1="1" x2="1" y2="11" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      /* Green ✓ for marking present */
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                        <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )
                  ) : isMarkAbsent ? (
                    /* Inactive ✓ for mark_absent mode (everyone starts present) */
                    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
                      <path d="M1.5 5L5 8.5L11.5 1.5" stroke="#c8c4bb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    /* Inactive ✕ for default mark_present mode (everyone starts absent) */
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform:"rotate(5deg)" }}>
                      <line x1="1" y1="1" x2="11" y2="11" stroke="#c8c4bb" strokeWidth="2" strokeLinecap="round"/>
                      <line x1="11" y1="1" x2="1" y2="11" stroke="#c8c4bb" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
          <div style={{ height:16 }} />
        </div>

        {/* ── Save bar ── */}
        <div className="att-bot" style={{ background: T.ivory, borderTop:`1px solid ${T.border}` }}>
          {saveErr && (
            <div style={{ background:"#fce8e8", borderRadius:10, padding:"9px 14px",
              marginBottom:10, fontSize:12, color: T.red, fontFamily: T.sans }}>
              ⚠ {saveErr}
            </div>
          )}
          <button onClick={save} disabled={saving} style={{
            width:"100%", borderRadius:14, padding:"17px",
            fontSize:15, fontWeight:700, fontFamily: T.sans, letterSpacing:".01em",
            background: saving ? T.forestMid : T.forest,
            color:"#fff", border:"none",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.75 : 1,
            boxShadow:`0 4px 18px rgba(26,58,42,.28)`,
            transition:"opacity .2s",
          }}>
            {saving ? "Saving…" : saveErr
              ? "Retry"
              : `Save · ${presentCnt} present${absentCnt > 0 ? `, ${absentCnt} absent` : ""}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Summary ──────────────────────────────────────────────────────
  if (step === "summary") return (
    <SessionSummary session={currentSession} group={selGrp}
      onBack={() => setStep("group")}
      onContinueMarking={() => { setSaveErr(""); setStep("mark"); }}
    />
  );
}