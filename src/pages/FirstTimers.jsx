// src/pages/FirstTimers.jsx
// Visitor tracking — record first timers, track repeat visits, convert to members.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../components/ui/Modal";
import { PlusIco, ChevL, ChevR, SmsIco, PhoneIco, PinIco, EditIco } from "../components/ui/Icons";
import { getAv, fmtDate } from "../lib/helpers";

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function FirstTimerModal({ existing, onClose, onSave }) {
  const [f, setF] = useState({
    name:    existing?.name    || "",
    phone:   existing?.phone   || "",
    address: existing?.address || "",
    date:    existing?.date    || new Date().toISOString().split("T")[0],
  });
  const [err, setErr] = useState("");
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));
  const go = () => {
    if (!f.name.trim()) { setErr("Name is required"); return; }
    onSave({ ...f, name: f.name.trim(), phone: f.phone.trim(), address: f.address.trim() });
  };
  return (
    <Modal title={existing ? "Edit Visitor" : "Record First Timer"} onClose={onClose}>
      <div className="fstack">
        <div className="fg"><label className="fl">Full Name *</label><input className="fi" name="name" value={f.name} onChange={h} placeholder="Visitor's full name" autoFocus /></div>
        <div className="fg"><label className="fl">Phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label><input className="fi" name="phone" type="tel" value={f.phone} onChange={h} placeholder="080xxxxxxxx" /></div>
        <div className="fg"><label className="fl">Address <span style={{ fontWeight: 400, color: "var(--muted)" }}>optional</span></label><input className="fi" name="address" value={f.address} onChange={h} placeholder="Area or full address" /></div>
        <div className="fg"><label className="fl">Date of first visit</label><input className="fi" name="date" type="date" value={f.date} onChange={h} /></div>
        {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={go}>{existing ? "Save" : "Record"}</button>
        </div>
      </div>
    </Modal>
  );
}

// ── SMS Modal ─────────────────────────────────────────────────────────────────
function SmsModal({ people, defaultMsg, onClose, showToast }) {
  const [sel, setSel] = useState(people.map(p => p.id));
  const [txt, setTxt] = useState(defaultMsg);
  const all = sel.length === people.length;
  return (
    <Modal title="Send Message" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>Recipients ({sel.length}/{people.length})</p>
          <button className="btn bg" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => setSel(all ? [] : people.map(p => p.id))}>
            {all ? "Deselect All" : "Select All"}
          </button>
        </div>
        {people.map(p => (
          <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
            <input type="checkbox" checked={sel.includes(p.id)}
              onChange={() => setSel(s => s.includes(p.id) ? s.filter(x => x !== p.id) : [...s, p.id])}
              style={{ width: 18, height: 18, accentColor: "var(--brand)", flexShrink: 0 }} />
            <div><div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>{p.phone}</div></div>
          </label>
        ))}
      </div>
      <div className="fg" style={{ marginBottom: 16 }}>
        <label className="fl">Message</label>
        <textarea className="fi" rows={4} value={txt} onChange={e => setTxt(e.target.value)} style={{ resize: "vertical" }} />
        <p className="fh">Use {"{name}"} to personalise</p>
      </div>
      <button className="btn bp blg" disabled={sel.length === 0}
        onClick={() => { showToast(`SMS sent to ${sel.length} person${sel.length !== 1 ? "s" : ""}! ✉️`); onClose(); }}>
        <SmsIco s={18} /> Send to {sel.length}
      </button>
    </Modal>
  );
}

// ── Convert to Member Modal ───────────────────────────────────────────────────
function ConvertModal({ person, groups, onClose, onConvert }) {
  const [selGroup, setSelGroup] = useState(groups[0]?.id || "");
  return (
    <Modal title="Convert to Member" onClose={onClose}>
      <div className="fstack">
        <div style={{ background: "#d4f1e4", borderRadius: 12, padding: "13px 15px", marginBottom: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "var(--success)", marginBottom: 4 }}>🎉 {person.name} is becoming a member!</div>
          <div style={{ fontSize: 13, color: "#1a5c3a" }}>They'll be added to your members list and can be included in attendance tracking.</div>
        </div>
        {groups.length > 0 ? (
          <div className="fg">
            <label className="fl">Assign to Group</label>
            <select className="fi" value={selGroup} onChange={e => setSelGroup(e.target.value)}>
              <option value="">— No group yet —</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>No groups yet — you can assign them to a group later.</p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => onConvert(selGroup || null)}>Convert →</button>
        </div>
      </div>
    </Modal>
  );
}

// ── First Timer Profile ───────────────────────────────────────────────────────
function FirstTimerProfile({ person, groups, onBack, onEdit, onDelete, onRecordVisit, onConvert, showToast }) {
  const av      = getAv(person.name);
  const [smsOpen,     setSmsOpen]     = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const visits   = (person.visits || [person.date]).filter(Boolean).sort((a, b) => b.localeCompare(a));
  const lastVisit = visits[0];
  const daysSince = lastVisit ? Math.floor((Date.now() - new Date(lastVisit + "T00:00:00")) / 86400000) : null;
  const followUp  =
    daysSince === null ? null
    : daysSince <= 7   ? { label: "Recent visitor ✓",               color: "var(--success)", bg: "#d1f5e4" }
    : daysSince <= 14  ? { label: `${daysSince} days since last visit`, color: "#8a5a00",    bg: "#fff0cc" }
    :                    { label: `${daysSince} days — follow up!`,  color: "var(--danger)",  bg: "#fce8e8" };

  return (
    <div className="page">
      <div className="phero">
        <button onClick={onBack} style={{ background: "rgba(255,255,255,.15)", border: "none", color: "#fff", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
          <ChevL /> Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="av avlg" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{av.initials}</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>{person.name}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 3 }}>First visit: {fmtDate(person.date)}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 1 }}>{visits.length} total visit{visits.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
      </div>

      <div className="pc">
        {/* Action row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={() => setSmsOpen(true)}><SmsIco s={15} /> SMS</button>
          <button className="btn bg" style={{ flex: 1 }} onClick={onEdit}><EditIco s={14} /> Edit</button>
          <button className="btn bg" style={{ flex: 1 }} onClick={onRecordVisit}>+ Visit</button>
        </div>

        {/* Convert to member CTA */}
        <button onClick={() => setConvertOpen(true)}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 14, marginBottom: 16, cursor: "pointer", textAlign: "left", background: "linear-gradient(135deg,#1a3a2a,#2d6a4a)", color: "#fff", border: "none", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🎉</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Convert to Member</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Add to members list & track attendance</div>
          </div>
          <ChevR />
        </button>

        {followUp && (
          <div style={{ background: followUp.bg, borderRadius: 14, padding: "13px 16px", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: followUp.color }}>{followUp.label}</div>
          </div>
        )}

        <div className="card" style={{ marginBottom: 14 }}>
          <div className="stitle" style={{ marginBottom: 8 }}>Contact</div>
          <div className="prow"><PhoneIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Phone</div><div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{person.phone || "—"}</div></div></div>
          {person.address && <div className="prow"><PinIco /><div style={{ marginLeft: 10 }}><div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Address</div><div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{person.address}</div></div></div>}
        </div>

        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div className="stitle" style={{ margin: 0 }}>Visits ({visits.length})</div>
            <button className="btn bg" style={{ padding: "7px 12px", fontSize: 12 }} onClick={onRecordVisit}>+ Add</button>
          </div>
          {visits.map((v, i) => (
            <div key={v + i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtDate(v)}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {i === 0 && <span className="bdg bg-green">Latest</span>}
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{v === person.date ? "First" : "Return"}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="btn bg" style={{ width: "100%", color: "var(--danger)", borderColor: "#f5c8c8" }} onClick={onDelete}>
          Delete Record
        </button>
      </div>

      {smsOpen && (
        <SmsModal people={[person]}
          defaultMsg="Dear {name}, it was wonderful having you at our service! We'd love to see you again this Sunday. God bless you! 🙏"
          onClose={() => setSmsOpen(false)} showToast={showToast} />
      )}
      {convertOpen && (
        <ConvertModal person={person} groups={groups}
          onClose={() => setConvertOpen(false)}
          onConvert={onConvert} />
      )}
    </div>
  );
}

// ── Record Visit Modal ────────────────────────────────────────────────────────
function RecordVisitModal({ person, onClose, onSave, showToast }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const sundays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() - i * 7);
    return d.toISOString().split("T")[0];
  });
  const existing = new Set(person.visits || [person.date]);
  return (
    <Modal title={`Record Visit — ${person.name}`} onClose={onClose}>
      <div className="fstack">
        <p style={{ fontSize: 13, color: "var(--muted)" }}>Select the Sunday they visited:</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sundays.map(d => {
            const already = existing.has(d);
            return (
              <div key={d} onClick={() => !already && setDate(d)} style={{ padding: "13px 14px", borderRadius: 10, cursor: already ? "default" : "pointer", background: already ? "var(--surface2)" : date === d ? "var(--brand)" : "var(--surface)", color: already ? "var(--muted)" : date === d ? "#fff" : "var(--text)", border: `1.5px solid ${already ? "var(--border)" : date === d ? "var(--brand)" : "var(--border)"}`, fontWeight: 600, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {fmtDate(d)}
                {already && <span style={{ fontSize: 11, fontWeight: 700, opacity: 0.6 }}>Already recorded</span>}
              </div>
            );
          })}
        </div>
        <div className="fg"><label className="fl">Or pick a specific date</label><input className="fi" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn bg" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn bp" style={{ flex: 1 }} onClick={() => { onSave(date); showToast("Visit recorded! ✅"); onClose(); }}>Record Visit</button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function FirstTimers({
  firstTimers, addFirstTimer, editFirstTimer, removeFirstTimer,
  addMember, groups, showToast
}) {
  const navigate = useNavigate();
  const [addModal,   setAddModal]   = useState(false);
  const [viewPerson, setViewPerson] = useState(null);
  const [editPerson, setEditPerson] = useState(null);
  const [visitModal, setVisitModal] = useState(null);
  const [smsAll,     setSmsAll]     = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [saving,     setSaving]     = useState(false);

  const handleAdd = async (f) => {
    setSaving(true);
    const { error } = await addFirstTimer(f);
    setSaving(false);
    if (error) { showToast("Failed to record visitor ❌"); return; }
    setAddModal(false);
    showToast("First timer recorded! ⭐");
  };

  const handleEdit = async (f) => {
    setSaving(true);
    const { error } = await editFirstTimer(editPerson.id, f);
    setSaving(false);
    if (error) { showToast("Failed to update ❌"); return; }
    setEditPerson(null);
    showToast("Updated! ✅");
  };

  const handleRecordVisit = async (date, person) => {
    const newVisits = [...new Set([...(person.visits || [person.date]), date])].sort((a, b) => b.localeCompare(a));
    await editFirstTimer(person.id, { visits: newVisits });
  };

  const handleDelete = async (id) => {
    setSaving(true);
    const { error } = await removeFirstTimer(id);
    setSaving(false);
    if (error) { showToast("Failed to delete ❌"); return; }
    setViewPerson(null);
    setDelConfirm(null);
    showToast("Record deleted.");
  };

  const handleConvert = async (person, groupId) => {
    // Add as a full member
    const memberData = {
      name:     person.name,
      phone:    person.phone || "",
      address:  person.address || "",
      groupIds: groupId ? [groupId] : [],
      status:   "active",
    };
    const { error } = await addMember(memberData);
    if (error) { showToast("Failed to convert ❌"); return; }
    // Optionally delete from first timers
    await removeFirstTimer(person.id);
    setViewPerson(null);
    showToast(`${person.name} is now a member! 🎉`);
  };

  const enriched = firstTimers.map(p => {
    const visits = [...new Set([...(p.visits || []), p.date].filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const lastVisit = visits[0];
    const daysSince = lastVisit ? Math.floor((Date.now() - new Date(lastVisit + "T00:00:00")) / 86400000) : 999;
    return { ...p, visits, lastVisit, daysSince };
  }).sort((a, b) => (a.lastVisit || "").localeCompare(b.lastVisit || "") * -1);

  const needsFollowUp = enriched.filter(p => p.daysSince > 14);
  const livePerson = viewPerson ? enriched.find(p => p.id === viewPerson.id) || viewPerson : null;

  // ── Profile view ─────────────────────────────────────────────────────────
  if (livePerson) {
    return (
      <>
        <FirstTimerProfile
          person={livePerson}
          groups={groups}
          onBack={() => setViewPerson(null)}
          onEdit={() => setEditPerson(livePerson)}
          onDelete={() => setDelConfirm(livePerson.id)}
          onRecordVisit={() => setVisitModal(livePerson)}
          onConvert={(groupId) => handleConvert(livePerson, groupId)}
          showToast={showToast}
        />
        {editPerson && <FirstTimerModal existing={editPerson} onClose={() => setEditPerson(null)} onSave={handleEdit} />}
        {visitModal && (
          <RecordVisitModal person={visitModal} onClose={() => setVisitModal(null)}
            onSave={(date) => handleRecordVisit(date, visitModal)} showToast={showToast} />
        )}
        {delConfirm && (
          <Modal title="Delete Record?" onClose={() => { if (!saving) setDelConfirm(null); }}>
            <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>
              Permanently delete {livePerson.name}'s visitor record?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn bg" style={{ flex: 1 }} onClick={() => setDelConfirm(null)} disabled={saving}>Cancel</button>
              <button className="btn bd" style={{ flex: 1 }} onClick={() => handleDelete(delConfirm)} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </Modal>
        )}
      </>
    );
  }

  // ── Main list ─────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="ph">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1>First Timers</h1>
            <p>{firstTimers.length} recorded · {needsFollowUp.length} need follow-up</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {enriched.length > 0 && (
              <button className="bico" onClick={() => setSmsAll(true)} title="Send SMS to all"><SmsIco s={18} /></button>
            )}
            <button className="btn bp" onClick={() => setAddModal(true)}><PlusIco s={16} /> Add</button>
          </div>
        </div>
      </div>

      <div className="pc">
        {needsFollowUp.length > 0 && (
          <div style={{ background: "#fce8e8", border: "1.5px solid #f5c8c8", borderRadius: 14, padding: "13px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--danger)" }}>⚡ {needsFollowUp.length} need follow-up</div>
              <div style={{ fontSize: 12, color: "#b03030", marginTop: 2 }}>Haven't visited in 2+ weeks</div>
            </div>
            <button className="btn" style={{ fontSize: 12, padding: "8px 12px", background: "var(--danger)", color: "#fff", borderRadius: 10, flexShrink: 0 }}
              onClick={() => setSmsAll(true)}>Message</button>
          </div>
        )}

        {/* Attendance shortcut */}
        <button onClick={() => navigate("/attendance")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, marginBottom: 16, background: "var(--surface)", border: "1.5px solid var(--border)", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", textAlign: "left" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Mark Attendance</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>Track who came — go to Attendance → First Timers</div>
          </div>
          <ChevR />
        </button>

        {enriched.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">⭐</div>
            <p>No first timers recorded yet</p>
            <button className="btn bp" style={{ marginTop: 14 }} onClick={() => setAddModal(true)}>Record First Timer</button>
          </div>
        ) : enriched.map(p => {
          const av          = getAv(p.name);
          const statusColor = p.daysSince <= 7 ? "var(--success)" : p.daysSince <= 14 ? "#8a5a00" : "var(--danger)";
          const statusBg    = p.daysSince <= 7 ? "#d1f5e4"        : p.daysSince <= 14 ? "#fff0cc"  : "#fce8e8";
          const statusText  = p.daysSince <= 7 ? "Recent"         : p.daysSince < 999 ? `${p.daysSince}d ago` : "New";
          const phone       = p.phone || "";
          const intlPhone   = phone.replace(/\D/g, "").replace(/^0/, "234");
          const waMsg       = encodeURIComponent(`Dear ${p.name}, we missed you! We'd love to see you again this Sunday 🙏`);
          return (
            <div key={p.id} style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", cursor: "pointer" }} onClick={() => setViewPerson(p)}>
                <div className="av" style={{ background: av.bg, color: av.color, flexShrink: 0 }}>{av.initials}</div>
                <div className="li-info">
                  <div className="li-name">{p.name}</div>
                  <div className="li-sub">{phone || "No phone"} · {p.visits.length} visit{p.visits.length !== 1 ? "s" : ""}</div>
                </div>
                <span style={{ background: statusBg, color: statusColor, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>{statusText}</span>
                <ChevR />
              </div>
              {phone && (
                <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
                  <a href={`tel:${phone}`} onClick={e => e.stopPropagation()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 4px", fontSize: 13, fontWeight: 700, color: "#1a6fa8", textDecoration: "none", borderRight: "1px solid var(--border)" }}>
                    📞 Call
                  </a>
                  <a href={`https://wa.me/${intlPhone}?text=${waMsg}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 4px", fontSize: 13, fontWeight: 700, color: "#128c5e", textDecoration: "none" }}>
                    💚 WhatsApp
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addModal && <FirstTimerModal onClose={() => setAddModal(false)} onSave={handleAdd} />}
      {smsAll && (
        <SmsModal people={enriched}
          defaultMsg="Dear {name}, we're so glad you visited us! We'd love to see you again this Sunday. God bless! 🙏"
          onClose={() => setSmsAll(false)} showToast={showToast} />
      )}
    </div>
  );
}