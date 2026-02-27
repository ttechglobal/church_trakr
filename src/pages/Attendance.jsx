// src/pages/Attendance.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate, uid } from "../lib/helpers";
import { ChevL, ChevR, SrchIco, SmsIco } from "../components/ui/Icons";

function SmsModal({ absentees, onClose, showToast }) {
  const [sel, setSel] = useState(absentees.map(a => a.memberId));
  const [txt, setTxt] = useState("Dear {name}, we missed you at service this Sunday. God bless you! 🙏");
  const allSel = sel.length === absentees.length;
  return (
    <Modal title="Send SMS to Absentees" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Recipients ({sel.length}/{absentees.length})</p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setSel(allSel ? [] : absentees.map(a => a.memberId))}>{allSel ? "Deselect All" : "Select All"}</button>
        </div>
        {absentees.map(m => (
          <label key={m.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <input type="checkbox" checked={sel.includes(m.memberId)} onChange={() => setSel(s => s.includes(m.memberId) ? s.filter(x => x !== m.memberId) : [...s, m.memberId])} style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
          </label>
        ))}
      </div>
      <div className="fg" style={{ marginBottom: 16 }}>
        <label className="fl">Message Template</label>
        <textarea className="fi" rows={4} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} for personalization</p>
      </div>
      <button className="btn ba blg" disabled={sel.length === 0} onClick={() => { showToast(`SMS sent to ${sel.length} member${sel.length !== 1 ? "s" : ""}! ✉️`); onClose(); }}>
        <SmsIco s={18} /> Send to {sel.length} Member{sel.length !== 1 ? "s" : ""}
      </button>
    </Modal>
  );
}

export default function Attendance({ groups, members, attendanceHistory, setAttendanceHistory, showToast }) {
  const [step, setStep] = useState("group");
  const [selGrp, setSelGrp] = useState(null);
  const [selDate, setSelDate] = useState(new Date().toISOString().split("T")[0]);
  const [recs, setRecs] = useState([]);
  const [search, setSearch] = useState("");
  const [smsModal, setSmsModal] = useState(false);

  const startMarking = (g) => {
    setSelGrp(g);
    const gm = members.filter(m => (m.groupIds || []).includes(g.id));
    setRecs(gm.map(m => ({ memberId: m.id, name: m.name, present: null })));
    setSearch(""); setStep("date");
  };
  const toggle = (id, val) => setRecs(rs => rs.map(r => r.memberId === id ? { ...r, present: r.present === val ? null : val } : r));
  const markAll = val => setRecs(rs => rs.map(r => ({ ...r, present: val })));
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);
  const filtered   = recs.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));
  const save = () => {
    setAttendanceHistory(h => [{ id: uid(), groupId: selGrp.id, date: selDate, church_id: "church_001", records: recs.map(r => ({ ...r })) }, ...h]);
    showToast("Attendance saved! ✅"); setStep("summary");
  };

  if (step === "group") return (
    <div className="page">
      <div className="ph"><h1>Attendance</h1><p>Select a group to begin</p></div>
      <div className="pc">
        {groups.map(g => { const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length; const av = getAv(g.name); return (<div key={g.id} className="li" onClick={() => startMarking(g)}><div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div><div className="li-info"><div className="li-name">{g.name}</div><div className="li-sub">{cnt} members</div></div><ChevR /></div>); })}
        {groups.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No groups yet</p></div>}
      </div>
    </div>
  );

  if (step === "date") return (
    <div className="page">
      <div className="ph"><button className="btn bg" style={{ marginBottom: 14 }} onClick={() => setStep("group")}><ChevL /> All Groups</button><h1>{selGrp.name}</h1><p>Select date</p></div>
      <div className="pc">
        <div className="fg" style={{ marginBottom: 20 }}><label className="fl">Date</label><input className="fi" type="date" value={selDate} onChange={e => setSelDate(e.target.value)} /></div>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 12 }}>Recent Sundays</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
          {["2025-02-16","2025-02-09","2025-02-02","2025-01-26"].map(d => (<button key={d} className={`btn ${selDate === d ? "bp" : "bg"}`} style={{ fontSize: 13 }} onClick={() => setSelDate(d)}>{fmtDate(d)}</button>))}
        </div>
        <button className="btn bp blg" onClick={() => setStep("mark")}>Start Marking →</button>
      </div>
    </div>
  );

  if (step === "mark") return (
    <div style={{ paddingBottom: 130 }}>
      <div className="att-top">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <button className="btn bg" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => setStep("date")}><ChevL /> Back</button>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: 700, fontSize: 14, color: "var(--brand)" }}>{selGrp.name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtDate(selDate)}</div></div>
        </div>
        <div className="sw" style={{ marginBottom: 10 }}><div className="si"><SrchIco /></div><input className="fi" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn bos" style={{ flex: 1, padding: "8px", fontSize: 12 }} onClick={() => markAll(true)}>✓ Mark All Present</button>
          <button className="btn bod" style={{ flex: 1, padding: "8px", fontSize: 12 }} onClick={() => markAll(false)}>✗ Mark All Absent</button>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        {recs.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No members in this group.</p></div>}
        {filtered.map(r => (
          <div key={r.memberId} className={`att-item ${r.present === true ? "pr" : r.present === false ? "ab" : ""}`}>
            <div><div style={{ fontWeight: 700, fontSize: 15 }}>{r.name}</div><div style={{ fontSize: 12, marginTop: 2, color: r.present === true ? "var(--success)" : r.present === false ? "var(--danger)" : "var(--muted)" }}>{r.present === true ? "✓ Present" : r.present === false ? "✗ Absent" : "— Not marked"}</div></div>
            <div className="tgl">
              <button className={`tbtn ${r.present === true ? "tp" : "tpi"}`} onClick={() => toggle(r.memberId, true)}>✓</button>
              <button className={`tbtn ${r.present === false ? "ta" : "tai"}`} onClick={() => toggle(r.memberId, false)}>✗</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && search && <div className="empty"><p>No match for "{search}"</p></div>}
      </div>
      <div className="att-bot">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "center", minWidth: 54 }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--success)" }}>{presentCnt}</div><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Present</div></div>
          <div style={{ textAlign: "center", minWidth: 54 }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--danger)" }}>{absentCnt}</div><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Absent</div></div>
          <div style={{ textAlign: "center", minWidth: 54 }}><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--muted)" }}>{recs.length - presentCnt - absentCnt}</div><div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Unmarked</div></div>
          <button className="btn bp" style={{ flex: 1, borderRadius: 12, padding: "14px" }} onClick={save}>Save Attendance</button>
        </div>
      </div>
    </div>
  );

  if (step === "summary") return (
    <div className="page">
      <div className="ph"><h1>Summary</h1><p>{selGrp.name} · {fmtDate(selDate)}</p></div>
      <div className="pc">
        <div className="smbar" style={{ marginBottom: 20 }}>
          {[["Total", recs.length, "var(--brand)"], ["Present", presentCnt, "var(--success)"], ["Absent", absentCnt, "var(--danger)"]].map(([l, v, c]) => (<div key={l} className="smbox"><div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 30, color: c }}>{v}</div><div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{l}</div></div>))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ background: "var(--surface2)", borderRadius: 12, overflow: "hidden", height: 14 }}>
            <div style={{ width: recs.length ? `${(presentCnt / recs.length) * 100}%` : "0%", height: "100%", background: "linear-gradient(90deg,var(--success),#5ad98a)", borderRadius: 12, transition: "width .8s cubic-bezier(.34,1.2,.64,1)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Attendance rate</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}>{recs.length ? Math.round((presentCnt / recs.length) * 100) : 0}%</span>
          </div>
        </div>
        {absentList.length > 0 ? (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="stitle" style={{ margin: 0 }}>Absentees ({absentList.length})</div>
              <button className="btn ba" style={{ padding: "8px 14px", fontSize: 13 }} onClick={() => setSmsModal(true)}><SmsIco /> Send SMS</button>
            </div>
            {absentList.map(r => { const av = getAv(r.name); return (<div key={r.memberId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}><div className="av" style={{ background: av.bg, color: av.color, width: 36, height: 36, borderRadius: 10, fontSize: 12 }}>{av.initials}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div><span className="bdg bg-red" style={{ marginLeft: "auto" }}>Absent</span></div>); })}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0", background: "#f0fdf6", borderRadius: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 40 }}>🎉</div>
            <div style={{ fontWeight: 700, color: "var(--success)", marginTop: 8 }}>Full attendance!</div>
            <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Everyone was present today</p>
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={() => setStep("group")}>New Session</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => setStep("group")}>Done</button>
        </div>
      </div>
      {smsModal && <SmsModal absentees={absentList} onClose={() => setSmsModal(false)} showToast={showToast} />}
    </div>
  );
}
