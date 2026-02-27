// src/pages/Settings.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ChevR, EditIco, LogoutIco } from "../components/ui/Icons";

const SECTIONS = [
  { title: "CHURCH",        rows: [{ ico:"🏛️", l:"Church Profile",       s:"Name, address, logo, denomination" }, { ico:"⚙️", l:"Church Settings",       s:"Timezone, language, currency" }] },
  { title: "COMMUNICATION", rows: [{ ico:"💬", l:"SMS Settings",          s:"Sender ID, API key, SMS balance"  }, { ico:"🔔", l:"Notification Settings",  s:"Email & push notification preferences" }] },
  { title: "TEAM",          rows: [{ ico:"👤", l:"Team Members",          s:"Invite admins, pastors, leaders"  }, { ico:"🔐", l:"Role Permissions",        s:"Set access levels and capabilities" }] },
  { title: "ACCOUNT",       rows: [{ ico:"💳", l:"Subscription",          s:"Pro Plan · Renews March 2025"     }, { ico:"🔒", l:"Change Password",          s:"Update your login credentials" }] },
];

export default function Settings({ showToast }) {
  const { signOut, church, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { signOut(); navigate("/login"); };

  return (
    <div className="page">
      <div className="ph"><h1>Settings</h1><p>Manage your church account</p></div>
      <div className="pc">
        <div className="card" style={{ marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 20px" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, marginBottom: 14 }}>⛪</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 18 }}>{church?.name}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{church?.location}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <span className="bdg bg-green">Pro Plan</span>
            <span className="bdg bg-blue">{user?.role}</span>
          </div>
          <button className="btn bg" style={{ marginTop: 14, fontSize: 13 }} onClick={() => showToast("Profile edit coming soon")}>
            <EditIco /> Edit Profile
          </button>
        </div>

        {SECTIONS.map(sec => (
          <div key={sec.title} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8, paddingLeft: 4 }}>{sec.title}</div>
            <div className="stsec">
              {sec.rows.map(row => (
                <div key={row.l} className="strow" onClick={() => showToast(`${row.l} — coming soon`)}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{row.ico}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{row.l}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{row.s}</div>
                    </div>
                  </div>
                  <ChevR />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="stsec" style={{ marginBottom: 32 }}>
          <div className="strow" onClick={handleLogout}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fce8e8", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}>
                <LogoutIco />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "var(--danger)" }}>Sign Out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
