// src/components/layout/AppLayout.jsx
// Mobile: hamburger → slide-in full sidebar
// Desktop: persistent sidebar (unchanged)
import { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  HomeIco, GrpIco, MemIco, AttIco, MsgIco, SetIco, StarIco, LogoutIco,
} from "../ui/Icons";

const NAV = [
  { to: "/",            label: "Home",         icon: "🏠", Icon: HomeIco },
  { to: "/attendance",  label: "Attendance",   icon: "✅", Icon: AttIco  },
  { to: "/attendees",   label: "Attendees",    icon: "🙏", Icon: () => null },
  { to: "/absentees",   label: "Absentees",    icon: "📋", Icon: () => null },
  { to: "/firsttimers", label: "First Timers", icon: "⭐", Icon: StarIco },
  { to: "/groups",      label: "Groups",       icon: "🏘️", Icon: GrpIco  },
  { to: "/members",     label: "Members",      icon: "👤", Icon: MemIco  },
  { to: "/messaging",   label: "Messaging",    icon: "💬", Icon: MsgIco  },
  { to: "/analytics",   label: "Analytics",    icon: "📊", Icon: () => null },
  { to: "/report",      label: "Reports",      icon: "📄", Icon: () => null },
  { to: "/settings",    label: "Settings",     icon: "⚙️", Icon: SetIco  },
];

const F = "'DM Sans', system-ui, sans-serif";
const S = "'Playfair Display', serif";
const FOREST = "#1a3a2a";
const MID    = "#2d5a42";

export function AppLayout({ children }) {
  const { signOut, church } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleLogout = () => { setOpen(false); signOut(); navigate("/login"); };
  const navCls = ({ isActive }) => `ni ${isActive ? "act" : ""}`;

  return (
    <div className="shell">
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <nav className="sb">
        <div className="sb-logo" onClick={() => navigate("/")} style={{ cursor:"pointer" }}>
          <div className="sb-logo-icon">
            <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
              <path d="M1.5 6.5L5.5 10.5L14.5 1.5" stroke="#c9a84c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sb-logo-text">
            <h2>ChurchTrakr</h2>
            <p>{church?.name ?? "Loading…"}</p>
          </div>
        </div>
        <div className="sb-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"} className={navCls}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </div>
        <div className="sb-foot">
          <button className="ni" onClick={handleLogout}>
            <LogoutIco /> Sign Out
          </button>
        </div>
      </nav>

      {/* ── Mobile header bar ── */}
      <header className="mob-hdr">
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:9,
            background:"rgba(255,255,255,.14)", border:"1px solid rgba(255,255,255,.18)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="11" viewBox="0 0 16 13" fill="none">
              <path d="M1.5 6.5L5.5 10.5L14.5 1.5" stroke="#c9a84c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:S, fontWeight:700, fontSize:15, color:"#fff", lineHeight:1.1 }}>ChurchTrakr</div>
            {church?.name && <div style={{ fontSize:10, color:"rgba(255,255,255,.4)", marginTop:1 }}>{church.name}</div>}
          </div>
        </div>
        {/* Hamburger */}
        <button onClick={() => setOpen(true)} className="hamburger" aria-label="Open menu">
          <span /><span /><span />
        </button>
      </header>

      {/* ── Mobile drawer backdrop ── */}
      {open && (
        <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      )}

      {/* ── Mobile drawer ── */}
      <div className={`drawer ${open ? "drawer-open" : ""}`}>
        {/* Drawer header */}
        <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,.08)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10,
              background:"rgba(255,255,255,.14)", border:"1px solid rgba(255,255,255,.18)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
                <path d="M1.5 6.5L5.5 10.5L14.5 1.5" stroke="#c9a84c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily:S, fontWeight:700, fontSize:16, color:"#fff" }}>ChurchTrakr</div>
              {church?.name && <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>{church.name}</div>}
            </div>
          </div>
          <button onClick={() => setOpen(false)} style={{
            width:34, height:34, borderRadius:9,
            background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.12)",
            color:"rgba(255,255,255,.7)", fontSize:18, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            ×
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex:1, padding:"10px 12px", overflowY:"auto" }}>
          {NAV.map(n => {
            const active = n.to === "/" ? location.pathname === "/" : location.pathname.startsWith(n.to);
            return (
              <NavLink key={n.to} to={n.to} end={n.to === "/"}
                style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"11px 14px", borderRadius:11, marginBottom:2,
                  background: active ? "rgba(255,255,255,.13)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,.58)",
                  textDecoration:"none", fontFamily:F, fontWeight: active ? 700 : 500,
                  fontSize:14, transition:"all .15s",
                }}>
                <span style={{ fontSize:18, width:24, textAlign:"center", flexShrink:0 }}>{n.icon}</span>
                {n.label}
                {active && <div style={{ marginLeft:"auto", width:6, height:6, borderRadius:"50%", background:"#c9a84c" }} />}
              </NavLink>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding:"12px 12px calc(env(safe-area-inset-bottom,0px)+12px)",
          borderTop:"1px solid rgba(255,255,255,.08)" }}>
          <button onClick={handleLogout} style={{
            width:"100%", display:"flex", alignItems:"center", gap:12,
            padding:"12px 14px", borderRadius:11, border:"none",
            background:"rgba(220,38,38,.15)", color:"#fca5a5",
            fontFamily:F, fontWeight:700, fontSize:14, cursor:"pointer" }}>
            <LogoutIco /> Sign Out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="main">{children}</main>
    </div>
  );
}