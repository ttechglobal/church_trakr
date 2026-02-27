// src/pages/Groups.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate, fmtBday, uid } from "../lib/helpers";
import { PlusIco, SrchIco, TrashIco, ChevR, ChevL, UpIco, EditIco, PhoneIco, PinIco, CakeIco, SmsIco } from "../components/ui/Icons";

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

// ── Import Modal (group-scoped) ───────────────────────────────────────────────
function ImportModal({ group, onClose, onImport }) {
  const [step, setStep] = useState(0);
  const steps = ["Upload", "Map Columns", "Preview", "Done"];
  const [nameMode, setNameMode] = useState("full");
  const cols = ["A", "B", "C", "D", "E", "—"];
  const [mp, setMp] = useState({ fullName: "A", firstName: "A", lastName: "B", phone: "B", address: "C", birthday: "D" });
  const rows = [
    { A: "Chioma Eze",    B: "08011223344", C: "10 Aba Rd",   D: "1994-06-12" },
    { A: "Musa Ibrahim",  B: "09022334455", C: "",            D: ""           },
    { A: "Bola Adewale",  B: "07033445566", C: "3 Benin St",  D: "1988-09-01" },
    { A: "Grace Okoro",   B: "08177665544", C: "",            D: "2001-03-25" },
    { A: "Emeka Nkosi",   B: "07099887766", C: "7 Enugu Ave", D: ""           },
  ];
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
          <div className="upz" onClick={() => setStep(1)}><UpIco /><div style={{ fontWeight: 700, fontSize: 15 }}>Tap to upload CSV or XLSX</div><div style={{ fontSize: 13, color: "var(--muted)" }}>or drag and drop here</div><span className="chip" style={{ marginTop: 4 }}>members_list.csv</span></div>
          <p style={{ textAlign: "center", marginTop: 14, fontSize: 13, color: "var(--muted)" }}>Download our <span className="alink">template file</span> to get started</p>
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
          <div className="dvd" />
          <div className="fstack">
            {nameMode === "full"
              ? <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>Full Name *</div><select className="fi" style={{ flex: 1 }} value={mp.fullName} onChange={e => setMp(m => ({ ...m, fullName: e.target.value }))}>{cols.map(c => <option key={c}>{c}</option>)}</select></div>
              : <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>First Name *</div><select className="fi" style={{ flex: 1 }} value={mp.firstName} onChange={e => setMp(m => ({ ...m, firstName: e.target.value }))}>{cols.map(c => <option key={c}>{c}</option>)}</select></div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>Last Name</div><select className="fi" style={{ flex: 1 }} value={mp.lastName} onChange={e => setMp(m => ({ ...m, lastName: e.target.value }))}>{cols.map(c => <option key={c}>{c}</option>)}</select></div>
                </>}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontWeight: 600, fontSize: 13 }}>Phone *</div><select className="fi" style={{ flex: 1 }} value={mp.phone} onChange={e => setMp(m => ({ ...m, phone: e.target.value }))}>{cols.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontSize: 13, color: "var(--muted)" }}>Address</div><select className="fi" style={{ flex: 1 }} value={mp.address} onChange={e => setMp(m => ({ ...m, address: e.target.value }))}>{cols.map(c => <option key={c}>{c}</option>)}</select></div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ width: 110, fontSize: 13, color: "var(--muted)" }}>Birthday</div><select className="fi" style={{ flex: 1 }} value={mp.birthday} onChange={e => setMp(m => ({ ...m, birthday: e.target.value }))}>{cols.map(c => <option key={c}>{c}</option>)}</select></div>
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
            <span className="bdg bg-blue">24 total rows</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="csm" style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{r.A}</div>
              <div style={{ display: "flex", gap: 14, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>📱 {r.B}</span>
                {r.C && <span style={{ fontSize: 12, color: "var(--muted)" }}>📍 {r.C}</span>}
                {r.D && <span style={{ fontSize: 12, color: "var(--muted)" }}>🎂 {r.D}</span>}
              </div>
            </div>
          ))}
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "12px 0 20px" }}>All 24 → <strong>{group.name}</strong></p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
            <button className="btn bs" style={{ flex: 1 }} onClick={() => { setStep(3); onImport(24); }}>Import 24 Members ✓</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div style={{ textAlign: "center", padding: "20px 0 10px" }}>
          <div style={{ fontSize: 60 }}>🎉</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--success)", marginTop: 14 }}>Import Complete!</div>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 8 }}>24 members added to <strong>{group.name}</strong></p>
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

// ── Group Detail ──────────────────────────────────────────────────────────────
function GroupDetail({ group, groups, members, setMembers, attendanceHistory, onBack, showToast }) {
  const [addModal, setAddModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [search, setSearch] = useState("");
  const [viewMember, setViewMember] = useState(null);
  const [editingMember, setEditingMember] = useState(false);

  const gm = members.filter(m => (m.groupIds || []).includes(group.id));
  const filtered = gm.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search));
  const sessions = attendanceHistory.filter(h => h.groupId === group.id);
  const avg = sessions.length > 0 ? Math.round(sessions.reduce((s, x) => s + (x.records.filter(r => r.present).length / (x.records.length || 1)), 0) / sessions.length * 100) : 0;

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
      <div className="pc">
        <div className="smbar" style={{ marginBottom: 16 }}>
          {[["Members", gm.length, "var(--brand)"], ["Avg Attend.", avg + "%", "var(--success)"], ["Sessions", sessions.length, "var(--accent)"]].map(([l, v, c]) => (
            <div key={l} className="smbox"><div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: c }}>{v}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{l}</div></div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => setAddModal(true)}><PlusIco s={16} /> Add Member</button>
          <button className="btn bg" style={{ flex: 1 }} onClick={() => setImportModal(true)}><UpIco /> Import</button>
        </div>
        <div className="sw" style={{ marginBottom: 14 }}>
          <div className="si"><SrchIco /></div>
          <input className="fi" placeholder={`Search ${group.name}…`} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="stitle">Members ({filtered.length})</div>
        {filtered.length === 0 && <div className="empty"><div className="empty-ico">👥</div><p>{search ? "No members match" : "No members yet"}</p>{!search && <button className="btn bp" style={{ marginTop: 14 }} onClick={() => setAddModal(true)}>Add First Member</button>}</div>}
        {filtered.map(m => {
          const av = getAv(m.name);
          return (
            <div key={m.id} className="li" onClick={() => setViewMember(m)}>
              <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
              <div className="li-info"><div className="li-name">{m.name}</div><div className="li-sub">{m.phone}{m.address ? " · " + m.address.split(",")[0] : ""}</div></div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button className="bico dng" onClick={() => setRemoveId(m.id)}><TrashIco s={14} /></button>
              </div>
              <ChevR />
            </div>
          );
        })}
      </div>
      {addModal && <AddMemberModal onClose={() => setAddModal(false)} onAdd={handleAdd} groupName={group.name} />}
      {importModal && <ImportModal group={group} onClose={() => setImportModal(false)} onImport={n => showToast(`${n} members imported into ${group.name}!`)} />}
      {removeId && (
        <Modal title="Remove from Group?" onClose={() => setRemoveId(null)}>
          <p style={{ color: "var(--muted)", marginBottom: 20, fontSize: 14 }}>This member will remain in the system but removed from <strong>{group.name}</strong>.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => setRemoveId(null)}>Cancel</button>
            <button className="btn bd" style={{ flex: 1 }} onClick={() => handleRemove(removeId)}>Remove</button>
          </div>
        </Modal>
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

  return (
    <div className="page">
      <div className="ph">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h1>Groups</h1><p>{groups.length} active groups</p></div>
          <button className="btn bp" onClick={() => setAddModal(true)}><PlusIco /> New Group</button>
        </div>
      </div>
      <div className="pc">
        {groups.map(g => {
          const cnt = members.filter(m => (m.groupIds || []).includes(g.id)).length;
          const av = getAv(g.name);
          return (
            <div key={g.id} className="li" onClick={() => setViewGrp(g)}>
              <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
              <div className="li-info"><div className="li-name">{g.name}</div><div className="li-sub">{cnt} members · {g.leader}</div></div>
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
