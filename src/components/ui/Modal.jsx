// src/components/ui/Modal.jsx
import { XIco } from "./Icons";

export function Modal({ title, onClose, children }) {
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="msh">
        <div className="mhw"><div className="mh" /></div>
        <div className="mhead">
          <div className="mtitle">{title}</div>
          <button className="bico" onClick={onClose}><XIco /></button>
        </div>
        <div className="msh-in">{children}</div>
      </div>
    </div>
  );
}
