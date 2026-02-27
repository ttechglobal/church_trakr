// src/pages/FirstTimers.jsx
import { useState } from "react";
import { Modal } from "../components/ui/Modal";
import { PlusIco } from "../components/ui/Icons";
import { getAv, uid } from "../lib/helpers";

export default function FirstTimers({ firstTimers, setFirstTimers, showToast }) {
  const [modal, setModal] = useState(false);
  const [f, setF] = useState({ name: "", phone: "" });

  const add = () => {
    if (!f.name) return;
    setFirstTimers(t => [...t, { id: uid(), ...f, date: new Date().toISOString().split("T")[0], church_id: "church_001" }]);
    setModal(false); setF({ name: "", phone: "" }); showToast("First-timer recorded!");
  };

  return (
    <div className="page">
      <div className="ph">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div><h1>First Timers</h1><p>{firstTimers.length} recorded this month</p></div>
          <button className="btn bp" onClick={() => setModal(true)}><PlusIco /> Add</button>
        </div>
      </div>
      <div className="pc">
        <div className="card" style={{ marginBottom: 18, background: "linear-gradient(135deg,#fff8e7,#ffecd2)", boxShadow: "none", border: "none" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ fontSize: 36 }}>⭐</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Welcome new visitors!</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>Track first-timers and follow up warmly</div>
            </div>
          </div>
        </div>
        {firstTimers.map(t => {
          const av = getAv(t.name);
          return (
            <div key={t.id} className="li">
              <div className="av" style={{ background: av.bg, color: av.color }}>{av.initials}</div>
              <div className="li-info">
                <div className="li-name">{t.name}</div>
                <div className="li-sub">{t.phone} · {t.date}</div>
              </div>
              <span className="bdg bg-orange">New</span>
            </div>
          );
        })}
        {firstTimers.length === 0 && <div className="empty"><div className="empty-ico">⭐</div><p>No first timers recorded yet</p></div>}
      </div>
      {modal && (
        <Modal title="Record First Timer" onClose={() => setModal(false)}>
          <div className="fstack">
            <div className="fg"><label className="fl">Full Name</label><input className="fi" value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} placeholder="Visitor's full name" /></div>
            <div className="fg"><label className="fl">Phone</label><input className="fi" value={f.phone} onChange={e => setF(x => ({ ...x, phone: e.target.value }))} placeholder="080xxxxxxxx" /></div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn bg" style={{ flex: 1 }} onClick={() => setModal(false)}>Cancel</button>
              <button className="btn bp" style={{ flex: 1 }} onClick={add}>Record</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
