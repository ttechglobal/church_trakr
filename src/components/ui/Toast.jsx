// src/components/ui/Toast.jsx
import { useEffect } from "react";

export function Toast({ msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return <div className="toast" onClick={onClose}>{msg}</div>;
}
