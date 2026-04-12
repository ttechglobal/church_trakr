// src/components/layout/AppLayout.jsx
import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  HomeIco, GrpIco, MemIco, AttIco, MsgIco, SetIco, StarIco, LogoutIco,
} from "../ui/Icons";

const AbsenteesIco = () => <span style={{ fontSize: 18 }}>📋</span>;
const ReportIco    = () => <span style={{ fontSize: 16 }}>📄</span>;
const AnalyticsIco = () => <span style={{ fontSize: 16 }}>📊</span>;

const SERIF = "'Playfair Display', Georgia, serif";
const SANS  = "'DM Sans', system-ui, sans-serif";
const GOLD  = "#c9a84c";

// All nav items — used in desktop sidebar and mobile drawer
const MAIN_NAV = [
  { to: "/",            label: "Home",         Icon: HomeIco      },
  { to: "/attendance",  label: "Attendance",   Icon: AttIco       },
  { to: "/absentees",   label: "Absentees",    Icon: AbsenteesIco },
  { to: "/firsttimers", label: "First Timers", Icon: StarIco      },
  { to: "/groups",      label: "Groups",       Icon: GrpIco       },
  { to: "/members",     label: "Members",      Icon: MemIco       },
  { to: "/messaging",   label: "Messaging",    Icon: MsgIco       },
  { to: "/analytics",   label: "Analytics",    Icon: AnalyticsIco },
  { to: "/report",      label: "Reports",      Icon: ReportIco    },
  { to: "/settings",    label: "Settings",     Icon: SetIco       },
];

// ── Sidebar nav content (shared between desktop sidebar and mobile drawer) ────
function SidebarContent({ church, onLogout, closeDrawer }) {
  const location = useLocation();

  return (
    <>
      {/* Logo */}
      <div style={{
        padding: "22px 20px 18px",
        borderBottom: "1px solid rgba(255,255,255,.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
              <path d="M1.5 6.5L5.5 10.5L14.5 1.5" stroke={GOLD} strokeWidth="2.4"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 15,
              color: "#fff", lineHeight: 1.1 }}>ChurchTrakr</div>
            {church?.name && (
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.38)",
                marginTop: 2, fontFamily: SANS }}>{church.name}</div>
            )}
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "10px 12px", overflowY: "auto" }}>
        {MAIN_NAV.map(n => {
          const active = n.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(n.to);
          return (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              onClick={closeDrawer}
              style={{
                position: "relative",
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 10, marginBottom: 2,
                color: active ? "#fff" : "rgba(255,255,255,.52)",
                background: active ? "rgba(255,255,255,.12)" : "transparent",
                fontFamily: SANS, fontWeight: active ? 700 : 500, fontSize: 13.5,
                textDecoration: "none", transition: "all .15s",
              }}
            >
              {active && (
                <div style={{
                  position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 20, borderRadius: "0 3px 3px 0", background: GOLD,
                }} />
              )}
              <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>
                <n.Icon />
              </span>
              {n.label}
              {active && (
                <div style={{
                  marginLeft: "auto", width: 5, height: 5,
                  borderRadius: "50%", background: GOLD,
                }} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sign out */}
      <div style={{
        padding: "12px 12px calc(env(safe-area-inset-bottom,0px) + 12px)",
        borderTop: "1px solid rgba(255,255,255,.07)",
      }}>
        <button
          onClick={onLogout}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", borderRadius: 10, border: "none",
            background: "rgba(220,38,38,.14)", color: "#fca5a5",
            fontFamily: SANS, fontWeight: 700, fontSize: 13.5, cursor: "pointer",
          }}
        >
          <LogoutIco /> Sign Out
        </button>
      </div>
    </>
  );
}

export function AppLayout({ children }) {
  const { signOut, church } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = () => { signOut(); navigate("/login"); };

  return (
    <div className="shell">
      {/* ── Desktop sidebar ── */}
      <nav className="sb" style={{
        background: "linear-gradient(170deg, #1a3a2a 0%, #1d4535 100%)",
        display: "flex", flexDirection: "column",
      }}>
        <SidebarContent church={church} onLogout={handleLogout} closeDrawer={() => {}} />
      </nav>

      {/* ── Mobile header bar ── */}
      <header style={{
        display: "none", // shown via CSS .mob-hdr class
        position: "fixed", top: 0, left: 0, right: 0,
        height: "calc(58px + env(safe-area-inset-top, 0px))",
        padding: "calc(env(safe-area-inset-top,0px) + 9px) 18px 9px",
        background: "#1a3a2a",
        borderBottom: "1px solid rgba(255,255,255,.06)",
        boxShadow: "0 2px 20px rgba(0,0,0,.3)",
        zIndex: 200,
        alignItems: "center", justifyContent: "space-between",
      }} className="mob-hdr">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="10" viewBox="0 0 16 13" fill="none">
              <path d="M1.5 6.5L5.5 10.5L14.5 1.5" stroke={GOLD} strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 15,
              color: "#fff", lineHeight: 1.1 }}>ChurchTrakr</div>
            {church?.name && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.38)", marginTop: 1 }}>
                {church.name}
              </div>
            )}
          </div>
        </div>

        {/* Hamburger button */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          style={{
            width: 40, height: 40, borderRadius: 10,
            background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.14)",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 5, cursor: "pointer", padding: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span style={{ display: "block", width: 18, height: 1.5,
            background: "rgba(255,255,255,.9)", borderRadius: 2 }} />
          <span style={{ display: "block", width: 18, height: 1.5,
            background: "rgba(255,255,255,.9)", borderRadius: 2 }} />
          <span style={{ display: "block", width: 18, height: 1.5,
            background: "rgba(255,255,255,.9)", borderRadius: 2 }} />
        </button>
      </header>

      {/* ── Drawer backdrop ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,.6)", backdropFilter: "blur(2px)",
            animation: "fadeBackdrop .2s ease",
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: 290, zIndex: 600,
        background: "linear-gradient(170deg, #1a3a2a 0%, #1d4535 100%)",
        display: "flex", flexDirection: "column",
        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform .3s cubic-bezier(.4,0,.2,1)",
        boxShadow: "6px 0 40px rgba(0,0,0,.4)",
      }}>
        {/* Drawer close button */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          padding: "12px 14px 0",
        }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: 34, height: 34, borderRadius: 9,
              background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.12)",
              color: "rgba(255,255,255,.7)", fontSize: 20, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >×</button>
        </div>

        <SidebarContent
          church={church}
          onLogout={() => { setDrawerOpen(false); handleLogout(); }}
          closeDrawer={() => setDrawerOpen(false)}
        />
      </div>

      {/* ── Main content ── */}
      <main className="main">
        {children}
      </main>

      <style>{`
        @keyframes fadeBackdrop { from { opacity:0; } to { opacity:1; } }

        /* Desktop sidebar */
        .sb {
          width: 256px;
          position: fixed; top: 0; left: 0;
          height: 100vh; height: 100dvh;
          z-index: 100;
          border-right: 1px solid rgba(255,255,255,.05);
        }

        /* Main area offset */
        .main { margin-left: 256px; }

        /* Mobile overrides */
        @media (max-width: 768px) {
          .sb { display: none !important; }
          .mob-hdr { display: flex !important; }
          .main {
            margin-left: 0 !important;
            padding-top: calc(58px + env(safe-area-inset-top, 0px));
          }
        }

        @media (min-width: 769px) {
          .mob-hdr { display: none !important; }
        }
      `}</style>
    </div>
  );
}