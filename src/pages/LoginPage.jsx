// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { signIn, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const h = e => setF(x => ({ ...x, [e.target.name]: e.target.value }));

  const go = async () => {
    if (!f.email || !f.password) { setErr("Enter email and password"); return; }
    setLoading(true);
    const { error } = await signIn(f.email, f.password);
    setLoading(false);
    if (error) { setErr("Invalid credentials"); return; }
    navigate("/");
  };

  const demo = () => { demoLogin(); navigate("/"); };

  return (
    <div className="auth">
      <div className="acard">
        <div className="alogo">⛪ ChurchTrack</div>
        <p className="asub">Sign in to your church dashboard</p>
        <div className="fstack">
          <div className="fg">
            <label className="fl">Email</label>
            <input className="fi" name="email" type="email" placeholder="admin@church.org" value={f.email} onChange={h} />
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input className="fi" name="password" type="password" placeholder="••••••••" value={f.password} onChange={h} />
          </div>
          {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span className="alink" style={{ fontSize: 13 }} onClick={() => navigate("/forgot")}>Forgot password?</span>
          </div>
          <button className="btn bp blg" onClick={go} disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <button className="btn bg blg" onClick={demo}>👁 Preview Demo (skip login)</button>
        </div>
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          New church? <span className="alink" onClick={() => navigate("/signup")}>Create account</span>
        </p>
      </div>
    </div>
  );
}
