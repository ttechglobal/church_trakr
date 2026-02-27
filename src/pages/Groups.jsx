// src/pages/Groups.jsx
import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate, fmtBday, uid } from "../lib/helpers";
import { PlusIco, SrchIco, TrashIco, ChevR, ChevL, UpIco, EditIco, PhoneIco, PinIco, CakeIco, SmsIco, SetIco } from "../components/ui/Icons";

// ── Birthday SMS Modal ────────────────────────────────────────────────────────
function BdaySmsModal({ celebrants, template, onClose, showToast }) {
  const [sel, setSel] = useState(celebrants.map(m => m.id));
  const [txt, setTxt] = useState(template);
  const allSel = sel.length === celebrants.length;
  return (
    <Modal title="🎂 Send Birthday Messages" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Recipients ({sel.length}/{celebrants.length})</p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12 }}
            onClick={() => setSel(allSel ? [] : celebrants.map(m => m.id))}>
            {allSel ? "Deselect All" : "Select All"}
          </button>
        </div>
        {celebrants.map(m => (
          <label key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <input type="checkbox" checked={sel.includes(m.id)}
              onChange={() => setSel(s => s.includes(m.id) ? s.filter(x => x !== m.id) : [...s, m.id])}
              style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
            <span style={{ fontSize: 18 }}>🎂</span>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
          </label>
        ))}
      </div>
      <div className="fg" style={{ marginBottom: 16 }}>
        <label className="fl">Birthday Message</label>
        <textarea className="fi" rows={5} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} for the member's name</p>
      </div>
      <button className="btn ba blg" disabled={sel.length === 0}
        onClick={() => { showToast(`🎂 Birthday messages sent to ${sel.length} member${sel.length !== 1 ? "s" : ""}!`); onClose(); }}>
        <SmsIco s={18} /> Send to {sel.length} Member{sel.length !== 1 ? "s" : ""}
      </button>
    </Modal>
  );
}

// ── Birthday Settings Modal ───────────────────────────────────────────────────
function BdaySettingsModal({ groupName, currentTemplate, onClose, onSave }) {
  const [txt, setTxt] = useState(currentTemplate);
  return (
    <Modal title={`Birthday Message — ${groupName}`} onClose={onClose}>
      <div className="fstack">
        <p style={{ fontSize: 13, color: "var(--muted)" }}>
          This message will be used when sending birthday greetings to members of <strong>{groupName}</strong>.
        </p>
        <div className="fg">
          <label className="fl">Message Template</label>
          <textarea className="fi" rows={6} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
          <p className="fh">Use {"{name}"} to personalise with the member's name</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => onSave(txt)}>Save Message</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd, groupName }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", address: "", birthday: "" });
  const [err, setErr] = useState("");
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const go = () => {
    if (!f.firstName || !f.phone) { setErr("First name and phone are required"); return; }
    onAdd({ name: `${f.firstName} ${f.lastName}`.trim(), phone: f.phone, address: f.address, birthday: f.birthday });
  };
  return (
    <Modal title={groupName ? `Add Member to ${groupName}` : "Add Member"} onClose={onClose}>
      <div className="fstack">
        <div className="frow">
          <div className="fg"><label className="fl">First Name *</label><input className="fi" name="firstName" placeholder="Adaeze" value={f.firstName} onChange={h} /></div>
          <div className="fg"><label className="fl">Last Name</label><input className="fi" name="lastName" placeholder="Okafor" value={f.lastName} onChange={h} /></div>
        </div>
        <div className="fg"><label className="fl">Phone Number *</label><input className="fi" name="phone" placeholder="08012345678" value={f.phone} onChange={h} /></div>
        <div className="fg"><label className="fl">Address <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label><input className="fi" name="address" placeholder="14 Lagos Rd, Ikeja" value={f.address} onChange={h} /></div>
        <div className="fg"><label className="fl">Birthday <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label><input className="fi" name="birthday" type="date" value={f.birthday} onChange={h} /></div>
        {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go}>Add Member</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Import Modal ──────────────────────────────────────────────────────────────
function ImportModal({ group, onClose, onImport }) {
  const [step, setStep] = useState(0);
  const steps = ["Upload", "Map Columns", "Preview", "Done"];
  const [nameMode, setNameMode] = useState("full");
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [mp, setMp] = useState({ fullName: "", firstName: "", lastName: "", phone: "", address: "", birthday: "" });
  const NONE = "— skip —";

  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cols[i] || ""; });
      return obj;
    });
    return { headers, rows };
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const { headers, rows } = parseCSV(e.target.result);
          if (headers.length === 0) { setParseError("Could not read file. Make sure it's a valid CSV."); return; }
          setParsedHeaders(headers);
          setParsedRows(rows);
          const guess = (keywords) => headers.find(h => keywords.some(k => h.toLowerCase().includes(k))) || "";
          setMp({
            fullName: guess(["full", "name"]),
            firstName: guess(["first"]),
            lastName: guess(["last", "surname"]),
            phone: guess(["phone", "mobile", "tel", "number"]),
            address: guess(["address", "location"]),
            birthday: guess(["birth", "dob", "birthday"]),
          });
          setStep(1);
        } catch (err) { setParseError("Failed to parse file."); }
      };
      reader.readAsText(file);
    } else {
      setParseError("Please export your Excel file as CSV and upload that. (File → Save As → CSV)");
    }
  };

  const buildPreview = () => parsedRows.slice(0, 5).map(row => ({
    name: nameMode === "full" ? (row[mp.fullName] || "") : `${row[mp.firstName] || ""} ${row[mp.lastName] || ""}`.trim(),
    phone: row[mp.phone] || "",
    address: mp.address !== NONE ? row[mp.address] || "" : "",
    birthday: mp.birthday !== NONE ? row[mp.birthday] || "" : ""
  })).filter(r => r.name || r.phone);

  const doImport = () => {
    const mems = parsedRows.map(row => ({
      name: nameMode === "full" ? (row[mp.fullName] || "").trim() : `${row[mp.firstName] || ""} ${row[mp.lastName] || ""}`.trim(),
      phone: (row[mp.phone] || "").trim(),
      address: mp.address !== NONE ? (row[mp.address] || "").trim() : "",
      birthday: mp.birthday !== NONE ? (row[mp.birthday] || "").trim() : ""
    })).filter(r => r.name && r.phone);
    onImport(mems);
    setStep(3);
  };

  const colOpts = [NONE, ...parsedHeaders];
  const preview = step === 2 ? buildPreview() : [];

  const Prog = () => (
    <div className="srow">
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div className="sdot" style={{ background: i <= step ? "var(--brand)" : "var(--surface2)", color: i <= step ? "#fff" : "var(--muted)" }}>{i < step ? "✓" : i + 1}</div>
          {i < steps.length - 1 && <div className={`sline${i < step ? " done" : ""}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <Modal title={`Import → ${group.name}`} onClose={onClose}>
      <Prog />
      {step === 0 && (
        <div>
          <label style={{ display: "block", cursor: "pointer" }}>
            <div className="upz">
              <UpIco />
              <div style={{ fontWeight: 700, fontSize: 15 }}>{fileName || "Tap to upload CSV file"}</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{fileName ? "Tap to change file" : "Supports .csv files"}</div>
            </div>
            <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </label>
          {parseError && <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 12 }}>{parseError}</p>}
          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>
            Your CSV should have a header row: <strong>Name, Phone, Address</strong>
          </p>
        </div>
      )}
      {step === 1 && (
        <div>
          <p style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Map your columns</p>
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Name format:</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={`btn ${nameMode === "full" ? "bp" : "bg"}`} style={{ flex: 1, fontSize: 13 }} onClick={() => setNameMode("full")}>Full Name (1 col)</button>
              <button className={`btn ${nameMode === "split" ? "bp" : "bg"}`} style={{ flex: 1, fontSize: 13 }} onClick={() => setNameMode("split")}>First + Last</button>
            </div>
          </div>
          <div className="fstack">
            {nameMode === "full"
              ? <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>Full Name *</div><select className="fi" style={{ flex: 1 }} value={mp.fullName} onChange={e => setMp(m => ({ ...m, fullName: e.target.value }))}>{colOpts.map(c => <option key={c}>{c}</option>)}</select></div>
              : <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>First Name *</div><select className="fi" style={{ flex: 1 }} value={mp.firstName} onChange={e => setMp(m => ({ ...m, firstName: e.target.value }))}>{colOpts.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>Last Name</div><select className="fi" style={{ flex: 1 }} value={mp.lastName} onChange={e => setMp(m => ({ ...m, lastName: e.target.value }))}>{colOpts.map(c => <option key={c}>{c}</option>)}</select></div>
                </>}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>Phone *</div><select className="fi" style={{ flex: 1 }} value={mp.phone} onChange={e => setMp(m => ({ ...m, phone: e.target.value }))}>{colOpts.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontSize: 13, color: "var(--muted)" }}>Address</div><select className="fi" style={{ flex: 1 }} value={mp.address} onChange={e => setMp(m => ({ ...m, address: e.target.value }))}>{colOpts.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontSize: 13, color: "var(--muted)" }}>Birthday</div><select className="fi" style={{ flex: 1 }} value={mp.birthday} onChange={e => setMp(m => ({ ...m, birthday: e.target.value }))}>{colOpts.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setStep(0)}>Back</button>
            <button className="btn bp" style={{ flex: 1 }} onClick={() => setStep(2)}>Preview →</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Preview (first 5 rows)</p>
            <span className="bdg bg-blue">{parsedRows.length} total rows</span>
          </div>
          {preview.map((r, i) => (
            <div key={i} className="csm" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name || <span style={{ color: "var(--muted)" }}>—</span>}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
                {r.phone && <span style={{ fontSize: 12, color: "var(--muted)" }}>📱 {r.phone}</span>}
                {r.address && <span style={{ fontSize: 12, color: "var(--muted)" }}>📍 {r.address}</span>}
                {r.birthday && <span style={{ fontSize: 12, color: "var(--muted)" }}>🎂 {r.birthday}</span>}
              </div>
            </div>
          ))}
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "12px 0 20px" }}>All {parsedRows.length} rows → <strong>{group.name}</strong></p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
            <button className="btn bs" style={{ flex: 1 }} onClick={doImport}>Import {parsedRows.length} Members ✓</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
          <div style={{ fontSize: 60 }}>🎉</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--success)", marginTop: 14 }}>Import Complete!</div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>{parsedRows.length} members added to <strong>{group.name}</strong></p>
          <button className="btn bp blg" style={{ marginTop: 24 }} onClick={onClose}>Done</button>
        </div>
      )}
    </Modal>
  );
}

// ── Edit Member Modal ─────────────────────────────────────────────────────────
function EditMemberModal({ member, groups, onClose, onSave }) {
  const [f, setF] = useState({ name: member.name, phone: member.phone, address: member.address || "", birthday: member.birthday || "", groupIds: member.groupIds || [] });
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const togGrp = id => setF(x => ({ ...x, groupIds: x.groupIds.includes(id) ? x.groupIds.filter(g => g !== id) : [...x.groupIds, id] }));
  return (
    <Modal title="Edit Member" onClose={onClose}>
      <div className="fstack">
        <div className="fg"><label className="fl">Full Name *</label><input className="fi" name="name" value={f.name} onChange={h} /></div>
        <div className="fg"><label className="fl">Phone *</label><input className="fi" name="phone" value={f.phone} onChange={h} /></div>
        <div className="fg"><label className="fl">Address</label><input className="fi" name="address" placeholder="Enter address…" value={f.address} onChange={h} /></div>
        <div className="fg"><label className="fl">Birthday</label><input className="fi" name="birthday" type="date" value={f.birthday} onChange={h} /></div>
        <div className="fg">
          <label className="fl">Groups</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {groups.map(g => (
              <button key={g.id} onClick={() => togGrp(g.id)} className="btn" style={{ padding: "6px 14px", fontSize: 12, borderRadius: 20, background: f.groupIds.includes(g.id) ? "var(--brand)" : "var(--surface2)", color: f.groupIds.includes(g.id) ? "#fff" : "var(--muted)" }}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => onSave({ ...member, ...f })}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Member Profile ────────────────────────────────────────────────────────────
function MemberProfile({ member, groups, attendanceHistory, onBack, onEdit, onRemoveFromGroup, currentGroupId }) {
  const av = getAv(member.name);
  const mGroups = groups.filter(g => (member.groupIds || []).includes(g.id));
  const history = attendanceHistory.filter(h => h.records.some(r => r.memberId === member.id));
  return (
    <div className="page">
      <div className="phero">
        <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevL /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="av avlg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{av.initials}</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#fff" }}>{member.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{mGroups.map(g => g.name).join(" · ") || "No group"}</div>
            <span className={`bdg ${member.status === "active" ? "bg-green" : "bg-gray"}`} style={{ marginTop: 8 }}>{member.status}</span>
          </div>
        </div>
      </div>
      <div className="pc">
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button className="btn bp" style={{ flex: 1 }} onClick={onEdit}><EditIco s={15} /> Edit</button>
          {currentGroupId && <button className="btn bod" style={{ flex: 1 }} onClick={onRemoveFromGroup}><TrashIco s={15} /> Remove from Group</button>}
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle" style={{ marginBottom: 8 }}>Contact Info</div>
          <div className="prow"><PhoneIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Phone</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{member.phone}</div></div></div>
          {member.address && <div className="prow"><PinIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Address</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{member.address}</div></div></div>}
          {member.birthday && <div className="prow"><CakeIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Birthday</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{fmtBday(member.birthday)}</div></div></div>}
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle" style={{ marginBottom: 10 }}>Groups ({mGroups.length})</div>
          {mGroups.length === 0
            ? <p style={{ fontSize: 13, color: "var(--muted)" }}>Not assigned to any group</p>
            : mGroups.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 18 }}>👥</span><span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
              </div>
            ))}
        </div>
        <div className="card">
          <div className="stitle" style={{ marginBottom: 10 }}>Attendance History</div>
          {history.length === 0
            ? <p style={{ fontSize: 13, color: "var(--muted)" }}>No attendance records yet</p>
            : history.map(s => {
              const rec = s.records.find(r => r.memberId === member.id);
              const g = groups.find(g => g.id === s.groupId);
              return (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(s.date)}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{g?.name}</div></div>
                  <span className={`bdg ${rec?.present ? "bg-green" : "bg-red"}`}>{rec?.present ? "Present" : "Absent"}</span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ── Attendance Report View (full session detail from Reports tab) ──────────────
function SessionReportView({ session, group, onBack, showToast }) {
  const [smsModal, setSmsModal] = useState(false);
  const recs = session.records;
  const presentCnt = recs.filter(r => r.present === true).length;
  const absentCnt  = recs.filter(r => r.present === false).length;
  const absentList = recs.filter(r => r.present === false);
  const rate = recs.length ? Math.round((presentCnt / recs.length) * 100) : 0;

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={onBack}><ChevL /> Back to Reports</button>
        <h1>{fmtDate(session.date)}</h1>
        <p>{group.name} · Attendance Report</p>
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
          <div style={{ background: "var(--surface2)", borderRadius: 12, overflow: "hidden", height: 14 }}>
            <div style={{ width: `${rate}%`, height: "100%", background: "linear-gradient(90deg,var(--success),#5ad98a)", borderRadius: 12 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Attendance rate</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand)" }}>{rate}%</span>
          </div>
        </div>
        {absentList.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="stitle" style={{ margin: 0 }}>Absentees ({absentList.length})</div>
              <button className="btn ba" style={{ padding: "7px 12px", fontSize: 13 }} onClick={() => setSmsModal(true)}><SmsIco s={14} /> SMS</button>
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
        )}
        {presentCnt > 0 && (
          <div className="card">
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
      </div>
      {smsModal && (
        <Modal title="Send SMS to Absentees" onClose={() => setSmsModal(false)}>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>Sending to {absentList.length} absentees from {fmtDate(session.date)}.</p>
          <button className="btn ba blg" onClick={() => { showToast(`SMS sent to ${absentList.length} members! ✉️`); setSmsModal(false); }}>
            <SmsIco s={18} /> Send Now
          </button>
        </Modal>
      )}
    </div>
  );
}

// ── Group Detail ──────────────────────────────────────────────────────────────
const DEFAULT_BDAY_MSG = "Dear {name}, wishing you a wonderful birthday filled with God's blessings! 🎂🙏 From all of us at {group}.";

function GroupDetail({ group, groups, members, setMembers, attendanceHistory, onBack, showToast }) {
  const [tab, setTab] = useState("members"); // "members" | "reports" | "birthdays"
  const [addModal, setAddModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMember, setViewMember] = useState(null);
  const [editingMember, setEditingMember] = useState(false);
  const [viewSession, setViewSession] = useState(null);
  const [bdayMsg, setBdayMsg] = useState(group.bdayMsg || DEFAULT_BDAY_MSG.replace("{group}", group.name));
  const [bdaySettingsOpen, setBdaySettingsOpen] = useState(false);
  const [bdaySmsOpen, setBdaySmsOpen] = useState(false);

  const gm = members.filter(m => (m.groupIds || []).includes(group.id));
  const filtered = gm.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search));
  const sessions = attendanceHistory.filter(h => h.groupId === group.id).sort((a, b) => b.date.localeCompare(a.date));
  const avg = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + (x.records.filter(r => r.present).length / (x.records.length || 1)), 0) / sessions.length * 100)
    : 0;

  // Birthday logic — members whose birthday is today (month + day match)
  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const birthdayToday = gm.filter(m => {
    if (!m.birthday) return false;
    const parts = m.birthday.split("-"); // YYYY-MM-DD
    if (parts.length < 3) return false;
    return `${parts[1]}-${parts[2]}` === todayMD;
  });
  // Upcoming birthdays within 7 days
  const upcomingBdays = gm.filter(m => {
    if (!m.birthday) return false;
    const parts = m.birthday.split("-");
    if (parts.length < 3) return false;
    const bday = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (bday < today) bday.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
    return diff > 0 && diff <= 7;
  }).sort((a, b) => {
    const getNext = (m) => {
      const p = m.birthday.split("-");
      const d = new Date(today.getFullYear(), parseInt(p[1]) - 1, parseInt(p[2]));
      if (d < today) d.setFullYear(today.getFullYear() + 1);
      return d;
    };
    return getNext(a) - getNext(b);
  });

  const handleAdd = ({ name, phone, address, birthday }) => {
    const ex = members.find(m => m.phone === phone);
    if (ex) setMembers(ms => ms.map(m => m.id === ex.id ? { ...m, groupIds: [...new Set([...(m.groupIds || []), group.id])] } : m));
    else setMembers(ms => [...ms, { id: uid(), name, phone, address, birthday, groupIds: [group.id], status: "active", church_id: group.church_id }]);
    setAddModal(false); showToast("Member added!");
  };
  const handleRemove = id => {
    setMembers(ms => ms.map(m => m.id === id ? { ...m, groupIds: (m.groupIds || []).filter(g => g !== group.id) } : m));
    setRemoveId(null); showToast("Member removed from group.");
  };
  const handleSaveMember = updated => {
    setMembers(ms => ms.map(m => m.id === updated.id ? updated : m));
    setViewMember(members.find(m => m.id === updated.id) || updated);
    setEditingMember(false); showToast("Member updated!");
  };

  if (viewSession) {
    return <SessionReportView session={viewSession} group={group} onBack={() => setViewSession(null)} showToast={showToast} />;
  }

  if (viewMember) {
    const live = members.find(m => m.id === viewMember.id) || viewMember;
    return (
      <>
        <MemberProfile member={live} groups={groups} attendanceHistory={attendanceHistory}
          onBack={() => setViewMember(null)} onEdit={() => setEditingMember(true)}
          currentGroupId={group.id}
          onRemoveFromGroup={() => { handleRemove(live.id); setViewMember(null); }}
        />
        {editingMember && <EditMemberModal member={live} groups={groups} onClose={() => setEditingMember(false)} onSave={handleSaveMember} />}
      </>
    );
  }

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={onBack}><ChevL /> All Groups</button>
        <h1>{group.name}</h1><p>Leader: {group.leader}</p>
      </div>
      <div style={{ padding: "0 20px 12px" }}>
        <div className="smbar" style={{ marginBottom: 16 }}>
          {[["Members", gm.length, "var(--brand)"], ["Avg Attend.", avg + "%", "var(--success)"], ["Sessions", sessions.length, "var(--accent)"]].map(([l, v, c]) => (
            <div key={l} className="smbox"><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{l}</div></div>
          ))}
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === "members" ? "act" : ""}`} onClick={() => setTab("members")}>👥 Members</button>
          <button className={`tab ${tab === "reports" ? "act" : ""}`} onClick={() => setTab("reports")}>
            📊 Reports {sessions.length > 0 && <span style={{ marginLeft: 4, background: "var(--brand)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{sessions.length}</span>}
          </button>
          <button className={`tab ${tab === "birthdays" ? "act" : ""}`} onClick={() => setTab("birthdays")}>
            🎂 Birthdays {birthdayToday.length > 0 && <span style={{ marginLeft: 4, background: "var(--danger)", color: "#fff", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{birthdayToday.length}</span>}
          </button>
        </div>
      </div>

      {/* ── MEMBERS TAB ── */}
      {tab === "members" && (
        <div className="pc" style={{ paddingTop: 8 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button className="btn bp" style={{ flex: 1 }} onClick={() => setAddModal(true)}><PlusIco s={16} /> Add Member</button>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setImportModal(true)}><UpIco /> Import</button>
          </div>
          <div className="sw" style={{ marginBottom: 14 }}>
            <div className="si"><SrchIco /></div>
            <input className="fi" placeholder={`Search ${group.name}…`} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="stitle">Members ({filtered.length})</div>
          {filtered.length === 0 && (
            <div className="empty">
              <div className="empty-ico">👥</div>
              <p>{search ? "No members match" : "No members yet"}</p>
              {!search && <button className="btn bp" style={{ marginTop: 14 }} onClick={() => setAddModal(true)}>Add First Member</button>}
            </div>
          )}
          {filtered.map(m => {
            const av = getAv(m.name);
            const isBday = birthdayToday.some(b => b.id === m.id);
            return (
              <div key={m.id} className="li" onClick={() => setViewMember(m)}>
                <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
                <div className="li-info">
                  <div className="li-name">{m.name} {isBday && "🎂"}</div>
                  <div className="li-sub">{m.phone}{m.address ? " · " + m.address.split(",")[0] : ""}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                  <button className="bico dng" onClick={() => setRemoveId(m.id)}><TrashIco s={14} /></button>
                </div>
                <ChevR />
              </div>
            );
          })}
        </div>
      )}

      {/* ── REPORTS TAB ── */}
      {tab === "reports" && (
        <div className="pc" style={{ paddingTop: 8 }}>
          {sessions.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">📊</div>
              <p>No attendance sessions yet.</p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Go to Attendance to start marking.</p>
            </div>
          ) : (
            <>
              {/* Summary across all sessions */}
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="stitle" style={{ marginBottom: 10 }}>Overall Attendance</div>
                <div style={{ background: "var(--surface2)", borderRadius: 12, overflow: "hidden", height: 12, marginBottom: 8 }}>
                  <div style={{ width: `${avg}%`, height: "100%", background: "linear-gradient(90deg,var(--success),#5ad98a)", borderRadius: 12 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--muted)" }}>{sessions.length} session{sessions.length !== 1 ? "s" : ""} recorded</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: avg >= 70 ? "var(--success)" : avg >= 50 ? "var(--accent)" : "var(--danger)" }}>{avg}% avg</span>
                </div>
              </div>

              <div className="stitle" style={{ marginBottom: 10 }}>Sessions ({sessions.length})</div>
              {sessions.map(s => {
                const presentCnt = s.records.filter(r => r.present === true).length;
                const total = s.records.length;
                const rate = total ? Math.round((presentCnt / total) * 100) : 0;
                return (
                  <div key={s.id} className="li" onClick={() => setViewSession(s)}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: rate >= 70 ? "#d1f5e4" : rate >= 50 ? "#fff0cc" : "#fce8e8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: rate >= 70 ? "var(--success)" : rate >= 50 ? "#8a5a00" : "var(--danger)", flexShrink: 0 }}>
                      {rate}%
                    </div>
                    <div className="li-info">
                      <div className="li-name">{fmtDate(s.date)}</div>
                      <div className="li-sub">{presentCnt}/{total} present · {s.records.filter(r => r.present === null).length} unmarked</div>
                    </div>
                    <ChevR />
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── BIRTHDAYS TAB ── */}
      {tab === "birthdays" && (
        <div className="pc" style={{ paddingTop: 8 }}>
          {/* Birthday message settings */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div className="stitle" style={{ margin: 0 }}>Birthday Message</div>
              <button className="btn bg" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setBdaySettingsOpen(true)}>
                <EditIco s={14} /> Edit
              </button>
            </div>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5, fontStyle: "italic" }}>"{bdayMsg}"</p>
          </div>

          {/* Today's birthdays */}
          {birthdayToday.length > 0 && (
            <div style={{ background: "linear-gradient(135deg, #fff8e6, #fff0cc)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "16px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>🎂 Today's Birthdays!</div>
                  <div style={{ fontSize: 13, color: "#8a5a00", marginTop: 2 }}>{birthdayToday.length} member{birthdayToday.length !== 1 ? "s" : ""} celebrating today</div>
                </div>
                <button className="btn ba" style={{ fontSize: 13, padding: "8px 14px" }} onClick={() => setBdaySmsOpen(true)}>
                  <SmsIco s={14} /> Send
                </button>
              </div>
              {birthdayToday.map(m => {
                const av = getAv(m.name);
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(240,165,0,.2)" }}>
                    <div className="av" style={{ background: av.bg, color: av.color, width: 38, height: 38, borderRadius: 10, fontSize: 13 }}>{av.initials}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "#8a5a00" }}>🎉 Today!</div>
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <button className="btn ba" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => setBdaySmsOpen(true)}>
                        <SmsIco s={12} /> Wish
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Upcoming birthdays */}
          {upcomingBdays.length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="stitle" style={{ marginBottom: 12 }}>Coming Up (next 7 days)</div>
              {upcomingBdays.map(m => {
                const av = getAv(m.name);
                const parts = m.birthday.split("-");
                const bday = new Date(today.getFullYear(), parseInt(parts[1]) - 1, parseInt(parts[2]));
                if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                const daysLeft = Math.ceil((bday - today) / (1000 * 60 * 60 * 24));
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div className="av" style={{ background: av.bg, color: av.color, width: 38, height: 38, borderRadius: 10, fontSize: 13 }}>{av.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>🎂 {fmtBday(m.birthday)}</div>
                    </div>
                    <span className="bdg bg-orange">In {daysLeft}d</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* All members with birthdays */}
          <div className="card">
            <div className="stitle" style={{ marginBottom: 12 }}>All Birthdays ({gm.filter(m => m.birthday).length})</div>
            {gm.filter(m => m.birthday).length === 0
              ? <p style={{ fontSize: 13, color: "var(--muted)" }}>No birthdays recorded yet. Edit members to add birthdays.</p>
              : gm.filter(m => m.birthday).sort((a, b) => {
                  const md = m => m.birthday.slice(5); // MM-DD
                  return md(a).localeCompare(md(b));
                }).map(m => {
                  const av = getAv(m.name);
                  const isToday = birthdayToday.some(b => b.id === m.id);
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                      <div className="av" style={{ background: av.bg, color: av.color, width: 36, height: 36, borderRadius: 10, fontSize: 12 }}>{av.initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name} {isToday && "🎂"}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtBday(m.birthday)}</div>
                      </div>
                      {isToday && <span className="bdg bg-orange">Today!</span>}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {addModal && <AddMemberModal onClose={() => setAddModal(false)} onAdd={handleAdd} groupName={group.name} />}
      {importModal && <ImportModal group={group} onClose={() => setImportModal(false)} onImport={importedMembers => {
        importedMembers.forEach(({ name, phone, address, birthday }) => {
          const ex = members.find(m => m.phone === phone);
          if (ex) setMembers(ms => ms.map(m => m.id === ex.id ? { ...m, groupIds: [...new Set([...(m.groupIds || []), group.id])] } : m));
          else setMembers(ms => [...ms, { id: uid(), name, phone, address: address || "", birthday: birthday || "", groupIds: [group.id], status: "active", church_id: group.church_id }]);
        });
        showToast(`${importedMembers.length} members imported into ${group.name}! ✅`);
      }} />}
      {removeId && (
        <Modal title="Remove from Group?" onClose={() => setRemoveId(null)}>
          <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: 14 }}>This member will remain in the system but removed from <strong>{group.name}</strong>.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setRemoveId(null)}>Cancel</button>
            <button className="btn bd" style={{ flex: 1 }} onClick={() => handleRemove(removeId)}>Remove</button>
          </div>
        </Modal>
      )}
      {bdaySettingsOpen && (
        <BdaySettingsModal
          groupName={group.name}
          currentTemplate={bdayMsg}
          onClose={() => setBdaySettingsOpen(false)}
          onSave={t => { setBdayMsg(t); setBdaySettingsOpen(false); showToast("Birthday message updated! 🎂"); }}
        />
      )}
      {bdaySmsOpen && birthdayToday.length > 0 && (
        <BdaySmsModal
          celebrants={birthdayToday}
          template={bdayMsg}
          onClose={() => setBdaySmsOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ── Groups List ───────────────────────────────────────────────────────────────
export default function Groups({ groups, setGroups, members, setMembers, attendanceHistory, showToast }) {
  const [viewGrp, setViewGrp] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [f, setF] = useState({ name: "", leader: "" });

  const addGroup = () => {
    if (!f.name) return;
    setGroups(g => [...g, { id: uid(), name: f.name, leader: f.leader, church_id: "church_001" }]);
    setAddModal(false); setF({ name: "", leader: "" }); showToast("Group created!");
  };

  if (viewGrp) {
    const live = groups.find(g => g.id === viewGrp.id) || viewGrp;
    return <GroupDetail group={live} groups={groups} members={members} setMembers={setMembers} attendanceHistory={attendanceHistory} onBack={() => setViewGrp(null)} showToast={showToast} />;
  }

  // Church-wide birthday check for today
  const today = new Date();
  const todayMD = `${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const totalBdaysToday = members.filter(m => {
    if (!m.birthday) return false;
    const p = m.birthday.split("-");
    return p.length >= 3 && `${p[1]}-${p[2]}` === todayMD;
  }).length;

  return (
    <div className="page">
      <div className="ph">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>Groups</h1>
            <p>{groups.length} active group{groups.length !== 1 ? "s" : ""}</p>
          </div>
          <button className="btn bp" onClick={() => setAddModal(true)}><PlusIco /> New Group</button>
        </div>
      </div>

      <div className="pc">
        {totalBdaysToday > 0 && (
          <div style={{ background: "linear-gradient(135deg,#fff8e6,#fff0cc)", border: "1.5px solid var(--accent)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🎂</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#8a5a00" }}>{totalBdaysToday} birthday{totalBdaysToday !== 1 ? "s" : ""} today!</div>
              <div style={{ fontSize: 13, color: "#8a5a00" }}>Open a group to send birthday greetings</div>
            </div>
          </div>
        )}

        {groups.map(g => {
          const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
          const av = getAv(g.name);
          const bdays = members.filter(m => (m.groupIds || []).includes(g.id) && m.birthday && (() => { const p = m.birthday.split("-"); return p.length >= 3 && `${p[1]}-${p[2]}` === todayMD; })()).length;
          return (
            <div key={g.id} className="li" onClick={() => setViewGrp(g)}>
              <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
              <div className="li-info">
                <div className="li-name">{g.name} {bdays > 0 && "🎂"}</div>
                <div className="li-sub">{cnt} members · {g.leader}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="bico dng" onClick={() => setDelConfirm(g.id)}><TrashIco s={14} /></button>
              </div>
              <ChevR />
            </div>
          );
        })}
        {groups.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>No groups yet</p></div>}
      </div>

      {addModal && (
        <Modal title="New Group" onClose={() => setAddModal(false)}>
          <div className="fstack">
            <div className="fg"><label className="fl">Group Name *</label><input className="fi" placeholder="e.g. Youth Ministry" value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} /></div>
            <div className="fg"><label className="fl">Leader</label><input className="fi" placeholder="Leader's name" value={f.leader} onChange={e => setF(x => ({ ...x, leader: e.target.value }))} /></div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn bg" style={{ flex: 1 }} onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn bp" style={{ flex: 1 }} onClick={addGroup}>Create</button>
            </div>
          </div>
        </Modal>
      )}
      {delConfirm && (
        <Modal title="Delete Group?" onClose={() => setDelConfirm(null)}>
          <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: 14 }}>Members remain. The group will be permanently removed.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setDelConfirm(null)}>Cancel</button>
            <button className="btn bd" style={{ flex: 1 }} onClick={() => { setGroups(g => g.filter(x => x.id !== delConfirm)); setDelConfirm(null); showToast("Group deleted."); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
