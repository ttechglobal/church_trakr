// src/pages/ForgotPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPage() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  return (
    <div className="auth">
      <div className="acard">
        <div className="alogo">🔑 Reset Password</div>
        <p className="asub">Enter your email to receive a reset link</p>
        {sent
          ? <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 48 }}>📧</div>
              <p style={{ fontWeight: 600, marginTop: 12, color: "var(--success)" }}>Check your inbox!</p>
              <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>Sent to {email}</p>
            </div>
          : <div className="fstack">
              <div className="fg">
                <label className="fl">Email Address</label>
                <input className="fi" type="email" placeholder="admin@church.org" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button className="btn bp blg" onClick={() => email && setSent(true)}>Send Reset Link</button>
            </div>
        }
        {/* TODO: supabase.auth.resetPasswordForEmail(email) */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
          <span className="alink" onClick={() => navigate("/login")}>← Back to Sign In</span>
        </p>
      </div>
    </div>
  );
}
