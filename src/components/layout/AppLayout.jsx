// src/components/layout/AppLayout.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  HomeIco, GrpIco, MemIco, AttIco, MsgIco, SetIco, StarIco, LogoutIco,
} from "../ui/Icons";

const MAIN_NAV = [
  { to: "/",            label: "Home",         Icon: HomeIco },
  { to: "/groups",      label: "Groups",       Icon: GrpIco  },
  { to: "/members",     label: "Members",      Icon: MemIco  },
  { to: "/attendance",  label: "Attendance",   Icon: AttIco  },
  { to: "/firsttimers", label: "First Timers", Icon: StarIco },
  { to: "/messaging",   label: "Messaging",    Icon: MsgIco  },
  { to: "/settings",    label: "Settings",     Icon: SetIco  },
];

// Bottom nav — 5 most used pages on mobile
const BOTTOM_NAV = [
  { to: "/",            label: "Home",    Icon: HomeIco },
  { to: "/groups",      label: "Groups",  Icon: GrpIco  },
  { to: "/attendance",  label: "Attend",  Icon: AttIco  },
  { to: "/firsttimers", label: "Visitors",Icon: StarIco },
  { to: "/messaging",   label: "Message", Icon: MsgIco  },
];

export function AppLayout({ children }) {
  const { signOut, church } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { signOut(); navigate("/login"); };

  const navCls = ({ isActive }) => `ni ${isActive ? "act" : ""}`;
  const bnCls  = ({ isActive }) => `bni ${isActive ? "act" : ""}`;

  return (
    <div className="shell">
      {/* ── Desktop Sidebar ── */}
      <nav className="sb">
        <div className="sb-logo">
          <h2>⛪ ChurchTrack</h2>
          <p>{church?.name ?? "Loading…"}</p>
        </div>
        <div className="sb-nav">
          {MAIN_NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={navCls}>
              <n.Icon /> {n.label}
            </NavLink>
          ))}
        </div>
        <div className="sb-foot">
          <button className="ni" onClick={handleLogout}>
            <LogoutIco /> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="main">{children}</main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bnav">
        <div className="bnav-inner">
          {BOTTOM_NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={bnCls}>
              <n.Icon />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
