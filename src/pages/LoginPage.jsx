// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);

  const go = async () => {
    setErr("");
    const e = email.trim();
    if (!e)        { setErr("Enter your email address"); return; }
    if (!password) { setErr("Enter your password"); return; }

    setBusy(true);
    const { error } = await signIn(e, password);
    setBusy(false);

    if (error) {
      const m = error.message ?? "";
      if (m.includes("Invalid login") || m.includes("invalid_credentials"))
        setErr("Incorrect email or password.");
      else if (m.includes("Email not confirmed"))
        setErr("Please confirm your email first — check your inbox.");
      else
        setErr(m || "Sign in failed. Please try again.");
      return;
    }

    // Explicitly navigate so we don't rely solely on auth state re-render
    navigate("/", { replace: true });
  };

  return (
    <div className="auth">
      <div className="acard">
        <div className="alogo">⛪ ChurchTrack</div>
        <p className="asub">Sign in to your church dashboard</p>

        <div className="fstack">
          <div className="fg">
            <label className="fl">Email</label>
            <input
              className="fi" type="email"
              placeholder="pastor@church.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()}
              autoComplete="email" autoCapitalize="none"
            />
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input
              className="fi" type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && go()}
              autoComplete="current-password"
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

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <span
              className="alink" style={{ fontSize: 13 }}
              onClick={() => navigate("/forgot")}
            >
              Forgot password?
            </span>
          </div>

          <button className="btn bp blg" onClick={go} disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted)" }}>
          New church?{" "}
          <span className="alink" onClick={() => navigate("/signup")}>Create account</span>
        </p>
      </div>
    </div>
  );
}