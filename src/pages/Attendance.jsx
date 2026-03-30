// src/pages/Attendance.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ensureSession } from "../services/supabaseClient";
import { fmtDate } from "../lib/helpers";

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

// ── Back button ───────────────────────────────────────────────────────────────
const BackBtn = ({ label = "Back", onClick, light = false }) => (
  <button onClick={onClick} style={{
    background: light ? "rgba(255,255,255,.12)" : "none",
    border: light ? "1px solid rgba(255,255,255,.2)" : "none",
    color: light ? "rgba(255,255,255,.8)" : T.muted,
    cursor: "pointer", padding: light ? "7px 14px" : "6px 0",
    display: "inline-flex", alignItems: "center", gap: 6,
    fontFamily: T.sans, fontWeight: 500, fontSize: 13,
    borderRadius: light ? 10 : 0,
  }}>
    <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
      <path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
    {label}
  </button>
);

const GreenHeader = ({ children }) => (
  <div style={{
    background: `linear-gradient(150deg, ${T.forest} 0%, ${T.forestMid} 60%, ${T.forestDim} 100%)`,
    padding: "max(env(safe-area-inset-top,32px),32px) 24px 24px",
    position: "relative", overflow: "hidden",
  }}>
    <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200,
      borderRadius:"50%", background:"rgba(255,255,255,.03)", pointerEvents:"none" }} />
    {children}
  </div>
);

// ── Collapsible member list (summary screen) ──────────────────────────────────
const SHOW = 6;
function MemberList({ items, color, label, badge }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, SHOW);
  const more  = items.length - SHOW;
  return (
    <div style={{ background:"#fff", borderRadius:18, overflow:"hidden",
      border:`1px solid ${T.border}`, marginBottom:14,
      boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
      <div style={{ padding:"13px 18px", borderBottom:`1px solid ${T.border}`,
        display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:color, flexShrink:0 }} />
        <span style={{ fontFamily:T.sans, fontWeight:700, fontSize:12,
          color, letterSpacing:".05em", textTransform:"uppercase" }}>
          {label} · {items.length}
        </span>
        {badge && <span style={{ marginLeft:"auto", fontSize:11, color:T.muted,
          fontFamily:T.sans, fontWeight:600 }}>{badge}</span>}
      </div>
      {shown.map((r, i) => (
        <div key={r.memberId || r.name} style={{
          padding:"12px 18px",
          borderBottom: i < shown.length - 1 || more > 0 ? `1px solid ${T.border}` : "none",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          animation: open && i >= SHOW ? "fadeRowIn .18s ease both" : "none",
          animationDelay: open ? `${(i-SHOW)*0.025}s` : "0s",
        }}>
          <span style={{ fontSize:14, fontFamily:T.sans, color:T.text,
            fontWeight: color === T.green ? 400 : 600 }}>{r.name}</span>
          <div style={{ width:5, height:5, borderRadius:"50%", background:color, opacity:.5 }} />
        </div>
      ))}
      {items.length > SHOW && (
        <button onClick={() => setOpen(o => !o)} style={{
          width:"100%", padding:"12px 18px", background: open ? T.warm : "#f9f8f5",
          border:"none", borderTop:`1px solid ${T.border}`,
          fontFamily:T.sans, fontWeight:700, fontSize:12.5,
          color:T.forest, cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>
          {open
            ? <><svg width="11" height="7" viewBox="0 0 12 8" fill="none"><path d="M1 7l5-5 5 5" stroke={T.forest} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>Show less</>
            : <><svg width="11" height="7" viewBox="0 0 12 8" fill="none"><path d="M1 1l5 5 5-5" stroke={T.forest} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>Show {more} more</>
          }
        </button>
      )}
    </div>
  );
}

// ── Session Summary ───────────────────────────────────────────────────────────
function SessionSummary({ session, group, onBack, onEdit }) {
  const navigate   = useNavigate();
  const recs       = session.records;
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);
  const presentList= recs.filter(r => r.present === true);
  const rate       = recs.length ? Math.round(presentCnt / recs.length * 100) : 0;
  const rCol       = rate >= 80 ? "#6ee7b7" : rate >= 60 ? "#fcd34d" : "#fca5a5";

  return (
    <div className="page" style={{ background:T.ivory, minHeight:"100vh" }}>
      <style>{`@keyframes fadeRowIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }`}</style>

      <GreenHeader>
        <BackBtn label="Back" onClick={onBack} light />
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginTop:14 }}>
          <div>
            <div style={{ fontFamily:T.serif, fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-.01em" }}>
              Attendance Report
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4, fontFamily:T.sans }}>
              {group?.name} · {fmtDate(session.date)}
            </div>
          </div>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <div style={{ fontFamily:T.serif, fontSize:46, fontWeight:700, lineHeight:1, color:rCol }}>{rate}%</div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.35)", marginTop:3,
              letterSpacing:".1em", textTransform:"uppercase", fontFamily:T.sans }}>attendance</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, marginTop:18 }}>
          {[["Present", presentCnt, "#6ee7b7", "rgba(110,231,183,.1)"],
            ["Absent",  absentCnt,  "#fca5a5", "rgba(252,165,165,.1)"],
            ["Total",   recs.length,"rgba(255,255,255,.4)","rgba(255,255,255,.05)"]
          ].map(([l,v,col,bg]) => (
            <div key={l} style={{ flex:1, background:bg, borderRadius:12, padding:"11px 6px",
              textAlign:"center", border:"1px solid rgba(255,255,255,.07)" }}>
              <div style={{ fontFamily:T.serif, fontWeight:700, fontSize:22, color:col, lineHeight:1 }}>{v}</div>
              <div style={{ fontSize:9, color:col, fontWeight:600, marginTop:4,
                opacity:.7, letterSpacing:".05em", textTransform:"uppercase", fontFamily:T.sans }}>{l}</div>
            </div>
          ))}
        </div>
      </GreenHeader>

      <div style={{ padding:"20px 20px 32px" }}>
        {/* Actions */}
        <div style={{ display:"flex", gap:10, marginBottom:20 }}>
          {onEdit && (
            <button onClick={onEdit} style={{
              flex:1, padding:"13px", borderRadius:14,
              background:"#fff", border:`1.5px solid ${T.border}`,
              fontFamily:T.sans, fontWeight:700, fontSize:14,
              color:T.text, cursor:"pointer", boxShadow:"0 1px 4px rgba(0,0,0,.05)",
            }}>Edit</button>
          )}
          <button onClick={onBack} style={{
            flex:1, padding:"13px", borderRadius:14,
            background:T.forest, border:"none",
            fontFamily:T.sans, fontWeight:700, fontSize:14,
            color:"#fff", cursor:"pointer", boxShadow:`0 4px 16px rgba(26,58,42,.28)`,
          }}>Done</button>
        </div>

        {/* Message attendees shortcut */}
        {presentCnt > 0 && (
          <button onClick={() => navigate("/attendees")} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center",
            gap:8, padding:"13px 16px", borderRadius:14, marginBottom:20, cursor:"pointer",
            background: "#f0fdf4", border:"1.5px solid #86efac",
            fontFamily:T.sans, fontWeight:700, fontSize:13.5, color:T.green,
          }}>
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M1.5 5.5L5.5 9.5L12.5 1.5" stroke={T.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Message {presentCnt} attendee{presentCnt !== 1 ? "s" : ""} →
          </button>
        )}

        {/* Absent list */}
        {absentList.length > 0 ? (
          <MemberList items={absentList} color={T.red} label="Absent" badge="Follow up" />
        ) : (
          <div style={{ background:T.greenSoft, borderRadius:18, padding:"28px 20px",
            textAlign:"center", marginBottom:14, border:`1px solid rgba(22,163,74,.12)` }}>
            <div style={{ fontSize:32, marginBottom:8 }}>✦</div>
            <div style={{ fontFamily:T.serif, fontWeight:700, color:T.green, fontSize:17 }}>Full attendance</div>
            <div style={{ fontSize:13, color:T.green, marginTop:4, opacity:.7, fontFamily:T.sans }}>Everyone was present</div>
          </div>
        )}
        {presentCnt > 0 && (
          <MemberList items={presentList} color={T.green} label="Present" />
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Attendance({ groups, members, attendanceHistory, saveAttendance, refreshAttendance, showToast }) {
  const { church } = useAuth();

  useEffect(() => {
    ensureSession().catch(() => {});
    refreshAttendance?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [step,             setStep]             = useState("group");
  const [selGrp,           setSelGrp]           = useState(null);
  const [selDate,          setSelDate]          = useState(new Date().toISOString().split("T")[0]);
  const [recs,             setRecs]             = useState([]);
  const [viewingSession,   setViewingSession]   = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [saving,           setSaving]           = useState(false);
  const [saveErr,          setSaveErr]          = useState("");
  const [needsReload,      setNeedsReload]      = useState(false);
  const [markMode,         setMarkMode]         = useState("mark_present");
  const [search,           setSearch]           = useState("");

  const reset = () => { setSaveErr(""); setNeedsReload(false); setSearch(""); };

  const startMarking = (g) => {
    setSelGrp(g); setEditingSessionId(null); setRecs([]); reset(); setStep("date");
  };

  const togglePresent = (id) => setRecs(rs => rs.map(r => r.memberId === id ? { ...r, present: !r.present } : r));
  const presentCnt    = recs.filter(r => r.present === true).length;
  const absentCnt     = recs.filter(r => r.present === false).length;

  const filteredRecs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? recs.filter(r => r.name.toLowerCase().includes(q)) : recs;
  }, [recs, search]);

  const proceedFromDate = () => {
    reset();
    const existing = attendanceHistory.find(h => h.groupId === selGrp.id && h.date === selDate);
    if (existing) {
      setRecs(existing.records.map(r => ({ ...r })));
      setEditingSessionId(existing.id);
    } else {
      const mode = (church?.id ? localStorage.getItem(`attendance_mode_${church.id}`) : null) || "mark_present";
      setMarkMode(mode);
      setRecs(members.filter(m => (m.groupIds || []).includes(selGrp.id))
        .map(m => ({ memberId: m.id, name: m.name, present: mode === "mark_absent" })));
      setEditingSessionId(null);
    }
    setStep("mark");
  };

  const save = async () => {
    reset(); setSaving(true);
    const timeoutId = setTimeout(() => {
      setSaving(false);
      setSaveErr("Taking too long — please reload and try again.");
      setNeedsReload(true);
    }, 12000);
    try {
      const { data, error, offline } = await saveAttendance({
        id: editingSessionId || undefined,
        groupId: selGrp.id, date: selDate,
        records: recs.map(r => ({ ...r })),
      });
      clearTimeout(timeoutId);
      if (error) {
        const isSession = error?.message === "SESSION_EXPIRED" || (error?.message||"").toLowerCase().includes("session");
        setSaveErr(isSession
          ? "Session expired — please reload the app. Your marks are still here."
          : "Could not save — please reload the app. Your marks are still here.");
        setNeedsReload(true);
        showToast("Save failed ❌");
        return;
      }
      const savedId = data?.id || editingSessionId;
      if (!editingSessionId && savedId) setEditingSessionId(savedId);
      showToast(offline ? "📶 Saved offline — will sync when online" : "Attendance saved ✅");
      setStep("summary");
    } catch {
      clearTimeout(timeoutId);
      setSaveErr("Could not save — please reload the app. Your marks are still here.");
      setNeedsReload(true);
      showToast("Save failed ❌");
    } finally {
      clearTimeout(timeoutId);
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
        onEdit={() => {
          setSelGrp(grp); setSelDate(viewingSession.date);
          setRecs(viewingSession.records.map(r => ({ ...r })));
          setEditingSessionId(viewingSession.id);
          setViewingSession(null); setStep("mark");
        }}
      />
    );
  }

  // ── Step 1: Group list ────────────────────────────────────────────────────
  if (step === "group") return (
    <div className="page" style={{ background:T.ivory, minHeight:"100vh" }}>
      <style>{`@keyframes fadeRowIn { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }`}</style>
      <GreenHeader>
        <div style={{ fontFamily:T.serif, fontSize:28, fontWeight:800, color:"#fff", letterSpacing:"-.02em" }}>Attendance</div>
        <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4, fontFamily:T.sans }}>Select a group to mark</div>
      </GreenHeader>

      <div style={{ padding:"20px 18px 32px" }}>
        {groups.length === 0 ? (
          <div style={{ background:"#fff", borderRadius:20, padding:"48px 24px", textAlign:"center",
            border:`1px solid ${T.border}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)" }}>
            <div style={{ fontSize:48, marginBottom:14, lineHeight:1 }}>🏘️</div>
            <div style={{ fontFamily:T.serif, fontWeight:700, fontSize:18, marginBottom:8, color:T.text }}>No groups yet</div>
            <p style={{ fontSize:13.5, color:T.muted, lineHeight:1.7 }}>Create a group in Groups, then return here to mark attendance.</p>
          </div>
        ) : groups.map(g => {
          const memberCnt  = members.filter(m => (m.groupIds||[]).includes(g.id)).length;
          const sessions   = [...attendanceHistory].filter(h => h.groupId === g.id).sort((a,b) => b.date.localeCompare(a.date));
          const lastSess   = sessions[0];
          const rate       = lastSess?.records.length ? Math.round(lastSess.records.filter(r=>r.present).length/lastSess.records.length*100) : null;
          // Trend: compare last two sessions
          const prevSess   = sessions[1];
          const prevRate   = prevSess?.records.length ? Math.round(prevSess.records.filter(r=>r.present).length/prevSess.records.length*100) : null;
          const trend      = rate !== null && prevRate !== null ? rate - prevRate : null;

          return (
            <div key={g.id}
              onClick={() => startMarking(g)}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 24px rgba(26,58,42,.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.04)"; }}
              style={{ display:"flex", alignItems:"center", gap:14, background:"#fff",
                border:`1px solid ${T.border}`, borderRadius:18, padding:"17px 18px",
                marginBottom:10, cursor:"pointer",
                boxShadow:"0 1px 4px rgba(0,0,0,.04)",
                transition:"all .18s cubic-bezier(.4,0,.2,1)" }}>

              {/* Group icon */}
              <div style={{ width:42, height:42, borderRadius:12, flexShrink:0,
                background:`linear-gradient(135deg, ${T.forestMid}, ${T.forest})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:T.serif, fontWeight:700, fontSize:17, color:"rgba(255,255,255,.9)" }}>
                {g.name.charAt(0)}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:15.5, fontFamily:T.sans, color:T.text, letterSpacing:"-.01em" }}>
                  {g.name}
                </div>
                <div style={{ fontSize:12, color:T.muted, marginTop:2, fontFamily:T.sans }}>
                  {memberCnt} member{memberCnt!==1?"s":""}
                  {lastSess ? ` · ${fmtDate(lastSess.date)}` : " · No sessions yet"}
                </div>
              </div>

              {/* Rate + trend */}
              {rate !== null && (
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontFamily:T.serif, fontWeight:700, fontSize:19, color:rateColor(rate), lineHeight:1 }}>{rate}%</div>
                  {trend !== null && (
                    <div style={{ fontSize:10, fontFamily:T.sans, fontWeight:600, marginTop:2,
                      color: trend > 0 ? T.green : trend < 0 ? T.red : T.muted }}>
                      {trend > 0 ? `▲ ${trend}%` : trend < 0 ? `▼ ${Math.abs(trend)}%` : "— same"}
                    </div>
                  )}
                </div>
              )}

              <svg width="5" height="10" viewBox="0 0 6 11" fill="none" style={{ opacity:.2, flexShrink:0 }}>
                <path d="M1 1l4 4.5L1 10" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Step 2: Date selection ────────────────────────────────────────────────
  if (step === "date") {
    const sessForGrp = attendanceHistory.filter(h => h.groupId === selGrp.id);
    const selSess    = sessForGrp.find(s => s.date === selDate);
    const thisSun    = (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()); return d.toISOString().split("T")[0]; })();
    const lastSun    = (() => { const d = new Date(); d.setDate(d.getDate()-d.getDay()-7); return d.toISOString().split("T")[0]; })();

    return (
      <div className="page" style={{ background:T.ivory, minHeight:"100vh" }}>
        <GreenHeader>
          <BackBtn label="All Groups" onClick={() => setStep("group")} light />
          <div style={{ fontFamily:T.serif, fontSize:23, fontWeight:700, color:"#fff", letterSpacing:"-.01em", marginTop:14 }}>{selGrp.name}</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", marginTop:4, fontFamily:T.sans }}>Choose a service date</div>
        </GreenHeader>

        <div style={{ padding:"20px 18px 32px" }}>
          {/* Quick date tiles */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            {[thisSun, lastSun].map((d, i) => {
              const s = sessForGrp.find(x => x.date === d);
              const active = selDate === d;
              const pct = s?.records.length ? Math.round(s.records.filter(r=>r.present).length/s.records.length*100) : null;
              return (
                <div key={d} onClick={() => setSelDate(d)} style={{
                  padding:"18px 14px", borderRadius:16, cursor:"pointer", textAlign:"center",
                  background: active ? T.forest : "#fff",
                  border:`1.5px solid ${active ? T.forest : s ? T.green : T.border}`,
                  boxShadow: active ? "0 4px 18px rgba(26,58,42,.25)" : "0 1px 4px rgba(0,0,0,.04)",
                  transition:"all .18s",
                }}>
                  <div style={{ fontSize:9.5, fontWeight:700, marginBottom:6,
                    textTransform:"uppercase", letterSpacing:".08em", fontFamily:T.sans,
                    color: active ? "rgba(255,255,255,.55)" : T.muted }}>
                    {i===0 ? "This Sunday" : "Last Sunday"}
                  </div>
                  <div style={{ fontFamily:T.serif, fontWeight:700, fontSize:15,
                    color: active ? "#fff" : T.text }}>{fmtDate(d)}</div>
                  {pct !== null
                    ? <div style={{ fontSize:11, marginTop:6, fontWeight:600, fontFamily:T.sans,
                        color: active ? "rgba(255,255,255,.7)" : T.green }}>✓ {pct}% attended</div>
                    : <div style={{ fontSize:11, marginTop:6, fontFamily:T.sans,
                        color: active ? "rgba(255,255,255,.4)" : T.muted }}>Not recorded yet</div>
                  }
                </div>
              );
            })}
          </div>

          {/* Custom date */}
          <div style={{ marginBottom:18 }}>
            <div style={{ fontSize:10.5, color:T.muted, fontFamily:T.sans,
              letterSpacing:".06em", textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>
              Other date
            </div>
            <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
              style={{ width:"100%", padding:"12px 16px", borderRadius:12, fontSize:14,
                fontFamily:T.sans, fontWeight:500, color:T.text, background:"#fff",
                border:`1px solid ${T.border}`, boxSizing:"border-box", outline:"none" }} />
          </div>

          {selSess ? (
            <div style={{ background:"#fffbeb", border:"1px solid #fde68a",
              borderRadius:16, padding:"16px 18px" }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#92400e", fontFamily:T.sans, marginBottom:3 }}>
                Already recorded
              </div>
              <div style={{ fontSize:13, color:"#92400e", fontFamily:T.sans, opacity:.8 }}>
                {selSess.records.filter(r=>r.present).length} present
                · {selSess.records.filter(r=>!r.present).length} absent
              </div>
              <div style={{ display:"flex", gap:8, marginTop:14 }}>
                <button onClick={() => setViewingSession(selSess)} style={{
                  flex:1, padding:"11px", borderRadius:11, background:"#fff",
                  border:"1px solid #fde68a", fontFamily:T.sans, fontWeight:600,
                  fontSize:13, color:"#92400e", cursor:"pointer" }}>View report</button>
                <button onClick={proceedFromDate} style={{
                  flex:1, padding:"11px", borderRadius:11, background:T.forest,
                  border:"none", fontFamily:T.sans, fontWeight:700,
                  fontSize:13, color:"#fff", cursor:"pointer" }}>Edit marks</button>
              </div>
            </div>
          ) : (
            <button onClick={proceedFromDate} style={{
              width:"100%", padding:"16px", borderRadius:14,
              background:T.forest, border:"none",
              fontFamily:T.sans, fontWeight:700, fontSize:15,
              color:"#fff", cursor:"pointer", letterSpacing:".01em",
              boxShadow:"0 4px 18px rgba(26,58,42,.28)" }}>
              Begin Marking →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Step 3: Mark attendance ───────────────────────────────────────────────
  if (step === "mark") {
    const pct          = recs.length ? Math.round(presentCnt/recs.length*100) : 0;
    const barColor     = pct >= 80 ? T.green : pct >= 60 ? "#d97706" : T.red;
    const isMarkAbsent = markMode === "mark_absent";

    return (
      <div style={{ background:T.ivory, minHeight:"100vh", paddingBottom:110 }}>

        {/* ── Sticky compact header ── */}
        <div className="att-top" style={{ background:T.ivory }}>
          {/* Nav row */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <BackBtn label="Back" onClick={() => setStep("date")} />
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:700, fontSize:14, color:T.text, fontFamily:T.sans }}>{selGrp.name}</div>
              <div style={{ fontSize:11, color:T.muted, marginTop:1, fontFamily:T.sans }}>{fmtDate(selDate)}</div>
            </div>
          </div>

          {/* Mode pill + live counters */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <div style={{
              padding:"5px 10px", borderRadius:9, flexShrink:0,
              background: isMarkAbsent ? "#fff8f0" : "#f0fdf6",
              border:`1px solid ${isMarkAbsent ? "#fed7aa" : "#bbf7d0"}`,
              display:"flex", alignItems:"center", gap:5,
            }}>
              <span style={{ fontSize:11 }}>{isMarkAbsent ? "✕" : "✅"}</span>
              <span style={{ fontFamily:T.sans, fontSize:11, fontWeight:600,
                color: isMarkAbsent ? "#c2410c" : T.green }}>
                {isMarkAbsent ? "Marking absent" : "Marking present"}
              </span>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", gap:10, flexShrink:0 }}>
              <span style={{ fontFamily:T.sans, fontSize:12, fontWeight:700, color:T.green }}>✓ {presentCnt}</span>
              {absentCnt > 0 && <span style={{ fontFamily:T.sans, fontSize:12, fontWeight:700, color:T.red }}>✕ {absentCnt}</span>}
              <span style={{ fontFamily:T.sans, fontSize:12, fontWeight:700, color:barColor }}>{pct}%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ background:T.border, borderRadius:99, height:3, overflow:"hidden", marginBottom:8 }}>
            <div style={{ width:`${pct}%`, height:"100%", borderRadius:99, background:barColor, transition:"width .3s ease" }} />
          </div>

          {/* Search */}
          <div style={{ position:"relative" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.muted}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${recs.length} member${recs.length!==1?"s":""}…`}
              style={{ width:"100%", boxSizing:"border-box", padding:"8px 12px 8px 32px",
                borderRadius:10, border:`1px solid ${T.border}`, background:"#fff",
                fontFamily:T.sans, fontSize:13, color:T.text, outline:"none" }} />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position:"absolute", right:9, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer", color:T.muted,
                fontSize:16, lineHeight:1, padding:2 }}>×</button>
            )}
          </div>
        </div>

        {/* ── Member list ── */}
        <div style={{ padding:"8px 14px 0" }}>
          {recs.length === 0 && (
            <div className="empty"><div className="empty-ico">👥</div><p>No members in this group.</p></div>
          )}
          {filteredRecs.length === 0 && search && (
            <div style={{ padding:"32px 20px", textAlign:"center" }}>
              <div style={{ fontSize:13, color:T.muted, fontFamily:T.sans }}>No members match "{search}"</div>
            </div>
          )}
          {filteredRecs.map(r => {
            const isPresent = r.present === true;
            const highlighted = isMarkAbsent ? !isPresent : isPresent;
            const rowBg     = highlighted ? (isMarkAbsent ? T.redSoft   : T.greenSoft) : "#fff";
            const rowBorder = highlighted ? (isMarkAbsent ? T.redBorder : "rgba(22,163,74,.22)") : T.border;
            const nameColor = highlighted ? (isMarkAbsent ? T.red : T.green) : T.text;
            const btnBg     = highlighted ? (isMarkAbsent ? T.red : T.green) : "transparent";
            const btnBorder = highlighted ? (isMarkAbsent ? T.red : T.green) : "#dddbd6";
            return (
              <div key={r.memberId} style={{
                display:"flex", alignItems:"center",
                padding:"12px 14px", borderRadius:12, marginBottom:6,
                background:rowBg, border:`1px solid ${rowBorder}`,
                gap:10, transition:"background .15s, border .15s",
              }}>
                <div style={{ flex:1, minWidth:0,
                  fontWeight:600, fontSize:15, fontFamily:T.sans,
                  color:nameColor, transition:"color .15s",
                  letterSpacing:"-.01em" }}>
                  {r.name}
                </div>
                <button onClick={() => togglePresent(r.memberId)} style={{
                  flexShrink:0, width:36, height:36, borderRadius:10,
                  border:`1.5px solid ${btnBorder}`, background:btnBg,
                  cursor:"pointer", display:"flex", alignItems:"center",
                  justifyContent:"center", padding:0, transition:"all .15s" }}
                  aria-label={isPresent ? "Mark absent" : "Mark present"}>
                  {highlighted ? (
                    isMarkAbsent
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                      : <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : isMarkAbsent
                    ? <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><path d="M1.5 5L5 8.5L11.5 1.5" stroke="#c8c4bb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="#c8c4bb" strokeWidth="2" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="#c8c4bb" strokeWidth="2" strokeLinecap="round"/></svg>
                  }
                </button>
              </div>
            );
          })}
          <div style={{ height:16 }} />
        </div>

        {/* ── Save bar ── */}
        <div className="att-bot" style={{ background:T.ivory, borderTop:`1px solid ${T.border}` }}>
          {saveErr && (
            <div style={{ background:"#fef2f2", borderRadius:10, padding:"10px 14px",
              marginBottom:10, fontSize:12.5, color:T.red, fontFamily:T.sans,
              display:"flex", alignItems:"flex-start", gap:7 }}>
              <span style={{ flexShrink:0, marginTop:1 }}>⚠</span>
              <div style={{ flex:1, lineHeight:1.5 }}>
                {saveErr}
                {needsReload && (
                  <div style={{ marginTop:6 }}>
                    <button onClick={() => window.location.reload()} style={{
                      background:T.red, color:"#fff", border:"none",
                      borderRadius:7, padding:"5px 14px", cursor:"pointer",
                      fontFamily:T.sans, fontWeight:700, fontSize:12 }}>
                      Reload app →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <button onClick={save} disabled={saving || needsReload} style={{
            width:"100%", borderRadius:14, padding:"16px",
            fontSize:15, fontWeight:700, fontFamily:T.sans, letterSpacing:".01em",
            background: (saving||needsReload) ? T.forestMid : T.forest,
            color:"#fff", border:"none",
            cursor: (saving||needsReload) ? "not-allowed" : "pointer",
            opacity: (saving||needsReload) ? 0.7 : 1,
            boxShadow:"0 4px 18px rgba(26,58,42,.25)",
            transition:"opacity .2s",
          }}>
            {saving ? "Saving…"
              : needsReload ? "Reload required"
              : `Save · ${presentCnt} present${absentCnt > 0 ? `, ${absentCnt} absent` : ""}`}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 4: Summary ───────────────────────────────────────────────────────
  if (step === "summary") return (
    <SessionSummary
      session={currentSession} group={selGrp}
      onBack={() => setStep("group")}
      onEdit={() => { reset(); setStep("mark"); }}
    />
  );
}