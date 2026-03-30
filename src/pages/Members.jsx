// src/pages/Members.jsx
import { useState, useMemo } from "react";
import { Modal } from "../components/ui/Modal";
import { getAv, fmtDate, fmtBday, handleSaveError } from "../lib/helpers";
import { PlusIco, SrchIco, ChevL, EditIco, TrashIco, PhoneIco, PinIco, CakeIco } from "../components/ui/Icons";

// ── Shared header style ──────────────────────────────────────────────────────
const PAGE_HERO = {
  background: "linear-gradient(150deg, #1a3a2a 0%, #2d5a42 55%, #1e4a34 100%)",
  padding: "max(env(safe-area-inset-top,32px),32px) 22px 22px",
  position: "relative", overflow: "hidden",
};

// ── Edit Member Modal ────────────────────────────────────────────────────────
function EditMemberModal({ member, groups, onClose, onSave, saving }) {
  const [f, setF] = useState({
    name: member.name, phone: member.phone || "",
    address: member.address || "", birthday: member.birthday || "",
    groupIds: member.groupIds || [], status: member.status || "active",
  });
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const togGrp = id => setF(x => ({
    ...x,
    groupIds: x.groupIds.includes(id) ? x.groupIds.filter(g => g !== id) : [...x.groupIds, id],
  }));

  return (
    <Modal title="Edit Member" onClose={onClose}>
      <div className="fstack" style={{ paddingBottom: 8 }}>
        <div className="fg">
          <label className="fl">Full Name *</label>
          <input className="fi" name="name" value={f.name} onChange={h} placeholder="Enter full name" />
        </div>
        <div className="fg">
          <label className="fl">
            Phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span>
          </label>
          <input className="fi" name="phone" value={f.phone} onChange={h} placeholder="08012345678" inputMode="tel" />
        </div>
        <div className="fg">
          <label className="fl">Address <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <input className="fi" name="address" placeholder="14 Lagos Rd, Ikeja" value={f.address} onChange={h} />
        </div>
        <div className="fg">
          <label className="fl">Birthday <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <input className="fi" name="birthday" type="date" value={f.birthday} onChange={h} />
        </div>
        <div className="fg">
          <label className="fl">Status</label>
          <select className="fi" name="status" value={f.status} onChange={h}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="fg">
          <label className="fl">Groups</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            {groups.map(g => (
              <button key={g.id} onClick={() => togGrp(g.id)}
                className="btn"
                style={{
                  padding: "7px 14px", fontSize: 12.5, borderRadius: 20, minHeight: 36,
                  background: f.groupIds.includes(g.id) ? "var(--brand)" : "var(--surface2)",
                  color: f.groupIds.includes(g.id) ? "#fff" : "var(--muted)",
                  border: f.groupIds.includes(g.id) ? "none" : "1px solid var(--border)",
                  transition: "var(--transition)",
                }}>
                {f.groupIds.includes(g.id) ? "✓ " : ""}{g.name}
              </button>
            ))}
            {groups.length === 0 && <p style={{ fontSize: 13, color: "var(--muted)" }}>No groups created yet</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => onSave({ ...member, ...f })} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd, saving }) {
  const [f, setF] = useState({ firstName: "", lastName: "", phone: "", address: "", birthday: "" });
  const [err, setErr] = useState("");
  const h = e => { setErr(""); setF(x => ({ ...x, [e.target.name]: e.target.value })); };

  const go = () => {
    if (!f.firstName.trim()) { setErr("First name is required"); return; }
    onAdd({ name: `${f.firstName.trim()} ${f.lastName.trim()}`.trim(), phone: f.phone, address: f.address, birthday: f.birthday });
  };

  return (
    <Modal title="Add Member" onClose={onClose}>
      <div className="fstack" style={{ paddingBottom: 8 }}>
        <div className="frow">
          <div className="fg">
            <label className="fl">First Name *</label>
            <input className="fi" name="firstName" placeholder="Adaeze" value={f.firstName} onChange={h} autoFocus />
          </div>
          <div className="fg">
            <label className="fl">Last Name</label>
            <input className="fi" name="lastName" placeholder="Okafor" value={f.lastName} onChange={h} />
          </div>
        </div>
        <div className="fg">
          <label className="fl">Phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <input className="fi" name="phone" placeholder="08012345678" value={f.phone} onChange={h} inputMode="tel" />
        </div>
        <div className="fg">
          <label className="fl">Address <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <input className="fi" name="address" placeholder="14 Lagos Rd, Ikeja" value={f.address} onChange={h} />
        </div>
        <div className="fg">
          <label className="fl">Birthday <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label>
          <input className="fi" name="birthday" type="date" value={f.birthday} onChange={h} />
        </div>
        {err && (
          <div style={{ background: "var(--danger-bg)", border: "1px solid #fca5a5", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--danger)", fontWeight: 500 }}>
            ⚠️ {err}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go} disabled={saving}>
            {saving ? "Adding…" : "Add Member"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Member Profile ────────────────────────────────────────────────────────────
function MemberProfile({ member, groups, attendanceHistory, onBack, onEdit, onDelete }) {
  const av = getAv(member.name);
  const mGroups = groups.filter(g => (member.groupIds || []).includes(g.id));
  const history = attendanceHistory
    .filter(h => h.records.some(r => r.memberId === member.id))
    .sort((a, b) => b.date.localeCompare(a.date));

  const presentCount = history.filter(h => h.records.find(r => r.memberId === member.id)?.present).length;
  const attendRate = history.length ? Math.round(presentCount / history.length * 100) : null;

  return (
    <div className="page">
      <div style={PAGE_HERO}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <button onClick={onBack} style={{
          background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.2)",
          color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer",
          fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5,
          marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6,
          transition: "background .15s",
        }}>
          <ChevL /> Back to Members
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="av avlg" style={{ background: "rgba(255,255,255,.18)", color: "#fff", fontSize: 22 }}>
            {av.initials}
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" }}>{member.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", marginTop: 4 }}>
              {mGroups.map(g => g.name).join(" · ") || "No group assigned"}
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <span className={`bdg ${member.status === "active" ? "bg-green" : "bg-gray"}`}>
                {member.status === "active" ? "Active" : "Inactive"}
              </span>
              {attendRate !== null && (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)", fontWeight: 600 }}>
                  {attendRate}% attendance
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pc">
        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button className="btn bp" style={{ flex: 1 }} onClick={onEdit}><EditIco s={15} /> Edit</button>
          <button className="btn bod" style={{ minWidth: 46, padding: "12px 14px" }} onClick={onDelete}><TrashIco s={15} /></button>
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
            {[
              { v: history.length, l: "Sessions", c: "var(--brand)" },
              { v: presentCount,   l: "Present",  c: "var(--success)" },
              { v: `${attendRate}%`, l: "Rate",   c: attendRate >= 70 ? "var(--success)" : attendRate >= 50 ? "var(--warning)" : "var(--danger)" },
            ].map(s => (
              <div key={s.l} className="card" style={{ textAlign: "center", padding: "14px 8px" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 22, color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Info */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle">Contact Info</div>
          {member.phone ? (
            <div className="prow" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><PhoneIco /></div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Phone</div>
                <a href={`tel:${member.phone}`} style={{ fontSize: 14.5, fontWeight: 600, color: "var(--brand)", marginTop: 2, display: "block" }}>{member.phone}</a>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--muted)", padding: "6px 0" }}>No phone number saved</p>
          )}
          {member.address && (
            <div className="prow" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><PinIco /></div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Address</div>
                <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 2 }}>{member.address}</div>
              </div>
            </div>
          )}
          {member.birthday && (
            <div className="prow" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CakeIco /></div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em" }}>Birthday</div>
                <div style={{ fontSize: 14.5, fontWeight: 500, marginTop: 2 }}>{fmtBday(member.birthday)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Groups */}
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle">Groups</div>
          {mGroups.length === 0
            ? <p style={{ fontSize: 13, color: "var(--muted)" }}>Not assigned to any group</p>
            : mGroups.map(g => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👥</div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
              </div>
            ))
          }
        </div>

        {/* Attendance History */}
        <div className="card">
          <div className="stitle">Attendance History</div>
          {history.length === 0
            ? <p style={{ fontSize: 13, color: "var(--muted)" }}>No attendance records yet</p>
            : history.slice(0, 20).map(s => {
              const rec = s.records.find(r => r.memberId === member.id);
              const g = groups.find(gr => gr.id === s.groupId);
              const present = rec?.present;
              return (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{fmtDate(s.date)}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{g?.name || "Unknown group"}</div>
                  </div>
                  <span className={`bdg ${present ? "bg-green" : "bg-red"}`}>
                    {present ? "✓ Present" : "✗ Absent"}
                  </span>
                </div>
              );
            })
          }
          {history.length > 20 && (
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", paddingTop: 10 }}>
              Showing 20 of {history.length} records
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Members page ────────────────────────────────────────────────────────
export default function Members({ members, groups, attendanceHistory, addMember, editMember, removeMember, showToast }) {
  const [search, setSearch]         = useState("");
  const [tab, setTab]               = useState("all");
  const [addModal, setAddModal]     = useState(false);
  const [viewMember, setViewMember] = useState(null);
  const [editingMember, setEditingMember] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving]         = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return members.filter(m =>
      (m.name.toLowerCase().includes(q) || (m.phone || "").includes(q)) &&
      (tab === "all" || m.status === tab)
    );
  }, [members, search, tab]);

  const activeCount   = members.filter(m => m.status === "active").length;
  const inactiveCount = members.filter(m => m.status === "inactive").length;

  const handleAdd = async (data) => {
    setSaving(true);
    const { error } = await addMember({ ...data, groupIds: [], status: "active" });
    setSaving(false);
    if (error) { handleSaveError(error, showToast, "Failed to add member"); return; }
    setAddModal(false);
    showToast("✅ Member added!");
  };

  const handleSave = async (updated) => {
    setSaving(true);
    const { data, error } = await editMember(updated.id, updated);
    setSaving(false);
    if (error) { handleSaveError(error, showToast, "Failed to update member"); return; }
    setViewMember(data || updated);
    setEditingMember(false);
    showToast("✅ Member updated!");
  };

  const handleDelete = async () => {
    if (!viewMember) return;
    const { error } = await removeMember(viewMember.id);
    if (error) { handleSaveError(error, showToast, "Failed to delete member"); return; }
    setConfirmDelete(false);
    setViewMember(null);
    showToast("✅ Member removed");
  };

  // ── Profile view ──────────────────────────────────────────────────────────
  if (viewMember) {
    const live = members.find(m => m.id === viewMember.id) || viewMember;
    return (
      <>
        <MemberProfile
          member={live} groups={groups} attendanceHistory={attendanceHistory}
          onBack={() => setViewMember(null)}
          onEdit={() => setEditingMember(true)}
          onDelete={() => setConfirmDelete(true)}
        />
        {editingMember && (
          <EditMemberModal
            member={live} groups={groups}
            onClose={() => setEditingMember(false)}
            onSave={handleSave} saving={saving}
          />
        )}
        {confirmDelete && (
          <Modal title="Delete Member" onClose={() => setConfirmDelete(false)}>
            <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🗑️</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "var(--text)" }}>
                Remove {live.name}?
              </div>
              <p style={{ fontSize: 13.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
                This will permanently delete their profile and attendance records. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn bg" style={{ flex: 1 }} onClick={() => setConfirmDelete(false)}>Cancel</button>
                <button className="btn bd" style={{ flex: 1 }} onClick={handleDelete}>Yes, Delete</button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Hero header */}
      <div style={PAGE_HERO}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 27, fontWeight: 800, color: "#fff", letterSpacing: "-.015em" }}>Members</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.55)", marginTop: 5 }}>
              {activeCount} active · {inactiveCount} inactive
            </div>
          </div>
          <button onClick={() => setAddModal(true)} style={{
            background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.22)",
            color: "#fff", borderRadius: 12, padding: "10px 16px", cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13.5,
            display: "inline-flex", alignItems: "center", gap: 7, transition: "background .15s",
          }}>
            <PlusIco /> Add
          </button>
        </div>
      </div>

      <div className="pc">
        {/* Search */}
        <div className="sw" style={{ marginBottom: 13 }}>
          <div className="si"><SrchIco /></div>
          <input className="fi" placeholder="Search by name or phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 16 }}>
          {[
            { key: "all",      label: `All (${members.length})` },
            { key: "active",   label: `Active (${activeCount})` },
            { key: "inactive", label: `Inactive (${inactiveCount})` },
          ].map(t => (
            <button key={t.key} className={`tab ${tab === t.key ? "act" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.map(m => {
          const av = getAv(m.name);
          const mg = groups.filter(g => (m.groupIds || []).includes(g.id));
          return (
            <div key={m.id} className="li" onClick={() => setViewMember(m)}>
              <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
              <div className="li-info">
                <div className="li-name">{m.name}</div>
                <div className="li-sub">
                  {m.phone || "No phone"}{mg.length > 0 ? " · " + mg.map(g => g.name).join(", ") : ""}
                </div>
              </div>
              <span className={`bdg ${m.status === "active" ? "bg-green" : "bg-gray"}`}>{m.status}</span>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-ico">{search ? "🔍" : "👥"}</div>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color:"var(--text)" }}>
              {search ? "No members match" : "No members yet"}
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight:1.6 }}>
              {search ? "Try a different name or phone number" : "Add your first member to get started"}
            </p>
            {!search && (
              <button className="btn bp" style={{ marginTop:16, borderRadius:12 }}
                onClick={() => setAddModal(true)}>
                Add First Member
              </button>
            )}
          </div>
        )}
      </div>

      {addModal && <AddMemberModal onClose={() => setAddModal(false)} onAdd={handleAdd} saving={saving} />}
    </div>
  );
}