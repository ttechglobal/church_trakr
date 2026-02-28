// src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [church,   setChurch]   = useState("");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [confirming, setConfirming] = useState(false); // waiting for email confirm

  const go = async () => {
    setErr("");
    if (!church.trim())         { setErr("Enter your church name"); return; }
    if (!name.trim())           { setErr("Enter your full name"); return; }
    if (!email.trim())          { setErr("Enter your email address"); return; }
    if (password.length < 6)    { setErr("Password must be at least 6 characters"); return; }
    if (password !== confirm)   { setErr("Passwords don't match"); return; }

    setBusy(true);
    const { error, needsEmailConfirm } = await signUp(
      email.trim(), password, church.trim(), name.trim()
    );
    setBusy(false);

    if (error) {
      const m = error.message ?? "";
      if (m.includes("already registered") || m.includes("already been registered") || m.includes("User already registered"))
        setErr("This email is already registered. Try signing in.");
      else if (m.includes("Password should be"))
        setErr("Password must be at least 6 characters.");
      else if (m.includes("valid email"))
        setErr("Please enter a valid email address.");
      else
        setErr(m || "Registration failed. Please try again.");
      return;
    }

    if (needsEmailConfirm) {
      // Email confirmation required — show instructions
      setConfirming(true);
      return;
    }

    // Auto-confirmed (email confirm disabled in Supabase) — go straight to dashboard
    navigate("/", { replace: true });
  };

  // ── Email confirm screen ───────────────────────────────────────────────────
  if (confirming) {
    return (
      <div className="auth">
        <div className="acard" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>📧</div>
          <div className="alogo" style={{ marginBottom: 8 }}>Check your inbox</div>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
            We sent a confirmation link to <strong>{email}</strong>.
          </p>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7, marginBottom: 24 }}>
            Click the link in the email to activate your account, then come back and sign in.
          </p>
          <button className="btn bp blg" onClick={() => navigate("/login")}>
            Go to Sign In
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>
            Didn't receive it? Check your spam folder, or{" "}
            <span className="alink" onClick={() => setConfirming(false)}>try again</span>.
          </p>
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <div className="auth">
      <div className="acard">
        <div className="alogo">⛪ ChurchTrack</div>
        <p className="asub">Register your church — free to start</p>

        <div className="fstack">
          <div className="fg">
            <label className="fl">Church Name</label>
            <input
              className="fi" placeholder="Grace Baptist Church"
              value={church} onChange={e => setChurch(e.target.value)}
            />
          </div>
          <div className="fg">
            <label className="fl">Your Full Name</label>
            <input
              className="fi" placeholder="Pastor James Okon"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div className="fg">
            <label className="fl">Email Address</label>
            <input
              className="fi" type="email" placeholder="pastor@church.org"
              value={email} onChange={e => setEmail(e.target.value)}
              autoCapitalize="none"
            />
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input
              className="fi" type="password" placeholder="At least 6 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="fg">
            <label className="fl">Confirm Password</label>
            <input
              className="fi" type="password" placeholder="Repeat password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              onKeyDown={e => e.key === "Enter" && go()}
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

          <button className="btn bp blg" onClick={go} disabled={busy}>
            {busy ? "Creating account…" : "Create Account"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          Already registered?{" "}
          <span className="alink" onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}