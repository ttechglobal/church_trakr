// src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SignupPage() {
  const { signUp, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ church: "", name: "", email: "", password: "" });
  const [ok, setOk] = useState(false);
  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    setOk(true);
    await signUp(f.email, f.password, f.church);
    setTimeout(() => { demoLogin(); navigate("/"); }, 1500);
  };

  return (
    <div className="auth">
      <div className="acard">
        <div className="alogo">⛪ ChurchTrack</div>
        <p className="asub">Register your church today</p>
        {ok
          ? <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48 }}>✅</div>
              <p style={{ fontWeight: 600, marginTop: 12, color: "var(--success)" }}>Account created! Redirecting…</p>
            </div>
          : <div className="fstack">
              <div className="fg"><label className="fl">Church Name</label><input className="fi" name="church" placeholder="Grace Baptist Church" value={f.church} onChange={h} /></div>
              <div className="fg"><label className="fl">Your Full Name</label><input className="fi" name="name" placeholder="Pastor James Okon" value={f.name} onChange={h} /></div>
              <div className="fg"><label className="fl">Email</label><input className="fi" name="email" type="email" placeholder="pastor@church.org" value={f.email} onChange={h} /></div>
              <div className="fg"><label className="fl">Password</label><input className="fi" name="password" type="password" placeholder="Create strong password" value={f.password} onChange={h} /></div>
              <button className="btn bp blg" onClick={go}>Create Account</button>
            </div>
        }
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          Already registered? <span className="alink" onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}
