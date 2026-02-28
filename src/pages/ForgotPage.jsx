// src/pages/ForgotPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function ForgotPage() {
  const navigate = useNavigate();
  const [sent,  setSent]  = useState(false);
  const [email, setEmail] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");

  const go = async () => {
    setErr("");
    const e = email.trim();
    if (!e) { setErr("Please enter your email address"); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(e, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      setErr(error.message || "Could not send reset email. Try again.");
      return;
    }
    setSent(true);
  };

  return (
    <div className="auth">
      <div className="acard">
        <div className="alogo">🔑 Reset Password</div>
        <p className="asub">Enter your email to receive a reset link</p>
        {sent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48 }}>📧</div>
            <p style={{ fontWeight: 600, marginTop: 12, color: "var(--success)" }}>Check your inbox!</p>
            <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>
              We sent a password reset link to <strong>{email}</strong>.<br />
              Check your spam folder if you don't see it.
            </p>
          </div>
        ) : (
          <div className="fstack">
            <div className="fg">
              <label className="fl">Email Address</label>
              <input
                className="fi" type="email" placeholder="admin@church.org"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go()}
                autoCapitalize="none"
              />
            </div>
            {err && (
              <div style={{
                background: "#fce8e8", border: "1.5px solid #f5c8c8",
                borderRadius: 10, padding: "10px 14px",
                fontSize: 13, color: "var(--danger)", fontWeight: 500,
              }}>
                {err}
              </div>
            )}
            <button className="btn bp blg" onClick={go} disabled={busy || !email.trim()}>
              {busy ? "Sending…" : "Send Reset Link"}
            </button>
          </div>
        )}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14 }}>
          <span className="alink" onClick={() => navigate("/login")}>← Back to Sign In</span>
        </p>
      </div>
    </div>
  );
}