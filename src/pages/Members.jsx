// src/pages/Members.jsx
import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate, fmtBday, uid } from "../lib/helpers";
import { PlusIco, SrchIco, ChevL, EditIco, TrashIco, PhoneIco, PinIco, CakeIco } from "../components/ui/Icons";

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
              <button key={g.id} onClick={() => togGrp(g.id)} className="btn" style={{ padding: "6px 14px", fontSize: 12, borderRadius: 20, background: f.groupIds.includes(g.id) ? "var(--brand)" : "var(--surface2)", color: f.groupIds.includes(g.id) ? "#fff" : "var(--muted)" }}>{g.name}</button>
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

function AddMemberModal({ onClose, onAdd }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", address: "", birthday: "" });
  const [err, setErr] = useState("");
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const go = () => {
    if (!f.firstName || !f.phone) { setErr("First name and phone are required"); return; }
    onAdd({ name: `${f.firstName} ${f.lastName}`.trim(), phone: f.phone, address: f.address, birthday: f.birthday });
  };
  return (
    <Modal title="Add Member" onClose={onClose}>
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

function MemberProfile({ member, groups, attendanceHistory, onBack, onEdit }) {
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
        <div style={{ marginBottom: 20 }}><button className="btn bp" style={{ width: "100%" }} onClick={onEdit}><EditIco s={15} /> Edit Member</button></div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle" style={{ marginBottom: 8 }}>Contact Info</div>
          <div className="prow"><PhoneIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Phone</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{member.phone}</div></div></div>
          {member.address && <div className="prow"><PinIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Address</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{member.address}</div></div></div>}
          {member.birthday && <div className="prow"><CakeIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Birthday</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{fmtBday(member.birthday)}</div></div></div>}
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle" style={{ marginBottom: 10 }}>Groups</div>
          {mGroups.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)" }}>Not assigned to any group</p>
            : mGroups.map(g => (<div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}><span style={{ fontSize: 18 }}>👥</span><span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span></div>))}
        </div>
        <div className="card">
          <div className="stitle" style={{ marginBottom: 10 }}>Attendance History</div>
          {history.length === 0 ? <p style={{ fontSize: 13, color: "var(--muted)" }}>No records yet</p>
            : history.map(s => {
              const rec = s.records.find(r => r.memberId === member.id);
              const g = groups.find(g => g.id === s.groupId);
              return (<div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}><div><div style={{ fontWeight: 600, fontSize: 13 }}>{fmtDate(s.date)}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{g?.name}</div></div><span className={`bdg ${rec?.present ? "bg-green" : "bg-red"}`}>{rec?.present ? "Present" : "Absent"}</span></div>);
            })}
        </div>
      </div>
    </div>
  );
}

export default function Members({ members, setMembers, groups, attendanceHistory, showToast }) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [addModal, setAddModal] = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [editingMember, setEditingMember] = useState(false);
  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (m.name.toLowerCase().includes(q) || m.phone.includes(q)) && (tab === "all" || m.status === tab);
  });
  const handleAdd = ({ name, phone, address, birthday }) => {
    setMembers(ms => [...ms, { id: uid(), name, phone, address, birthday, groupIds: [], status: "active", church_id: "church_001" }]);
    setAddModal(false); showToast("Member added!");
  };
  const handleSave = updated => {
    setMembers(ms => ms.map(m => m.id === updated.id ? updated : m));
    setViewMember(updated); setEditingMember(false); showToast("Member updated!");
  };
  if (viewMember) {
    const live = members.find(m => m.id === viewMember.id) || viewMember;
    return (<><MemberProfile member={live} groups={groups} attendanceHistory={attendanceHistory} onBack={() => setViewMember(null)} onEdit={() => setEditingMember(true)} />{editingMember && <EditMemberModal member={live} groups={groups} onClose={() => setEditingMember(false)} onSave={handleSave} />}</>);
  }
  return (
    <div className="page">
      <div className="ph">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h1>Members</h1><p>{members.length} total</p></div>
          <button className="btn bp" onClick={() => setAddModal(true)}><PlusIco /> Add</button>
        </div>
      </div>
      <div className="pc">
        <div className="sw" style={{ marginBottom: 14 }}><div className="si"><SrchIco /></div><input className="fi" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <div className="tabs" style={{ marginBottom: 14 }}>{["all", "active", "inactive"].map(t => (<button key={t} className={`tab ${tab === t ? "act" : ""}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>))}</div>
        {filtered.map(m => { const av = getAv(m.name); const mg = groups.filter(g => (m.groupIds || []).includes(g.id)); return (<div key={m.id} className="li" onClick={() => setViewMember(m)}><div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div><div className="li-info"><div className="li-name">{m.name}</div><div className="li-sub">{m.phone}{mg.length > 0 ? " · " + mg.map(g => g.name).join(", ") : ""}</div></div><span className={`bdg ${m.status === "active" ? "bg-green" : "bg-gray"}`}>{m.status}</span></div>); })}
        {filtered.length === 0 && <div className="empty"><div className="empty-ico">🔍</div><p>No members found</p></div>}
      </div>
      {addModal && <AddMemberModal onClose={() => setAddModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
