// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const F      = "'Playfair Display', Georgia, serif";
const S      = "'DM Sans', system-ui, sans-serif";
const FOREST = "#1a3a2a";
const FM     = "#2d5a42";
const GOLD   = "#c9a84c";
const GOLD_L = "#e8d5a0";
const BORDER = "#e7e4dc";
const MUTED  = "#78716c";
const TEXT   = "#1c1917";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [err,      setErr]      = useState("");
  const [busy,     setBusy]     = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  const submit = async () => {
    setErr("");
    if (!email.trim()) { setErr("Enter your email address"); return; }
    if (!password)     { setErr("Enter your password"); return; }
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) {
      const m = error.message ?? "";
      if (m.includes("Invalid login") || m.includes("invalid_credentials"))
        setErr("Incorrect email or password.");
      else if (m.includes("Email not confirmed"))
        setErr("Please confirm your email first — check your inbox.");
      else setErr(m || "Sign in failed. Please try again.");
      return;
    }
    navigate("/", { replace: true });
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex",
      background:`linear-gradient(150deg, ${FOREST} 0%, ${FM} 60%, #1e4a34 100%)`,
      position:"relative", overflow:"hidden",
    }}>
      {/* Orbs */}
      <div style={{ position:"absolute", top:-100, right:-100, width:500, height:500,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-80, width:400, height:400,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(61,122,88,.3) 0%, transparent 65%)" }} />

      {/* Left brand panel — hidden on small screens */}
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"60px 56px", position:"relative", zIndex:2,
        minWidth:0 }}>
        <div onClick={() => navigate("/")} style={{ cursor:"pointer",
          display:"inline-flex", alignItems:"center", gap:10, marginBottom:64 }}>
          <div style={{ width:36, height:36, borderRadius:10,
            background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:F, fontWeight:700, fontSize:15, color:"#fff" }}>CT</div>
          <span style={{ fontFamily:F, fontWeight:700, fontSize:19,
            color:"#fff" }}>Church Tracker</span>
        </div>

        <div style={{ maxWidth:400 }}>
          <div style={{ fontFamily:F, fontSize:"2.6rem", fontWeight:900,
            color:"#fff", lineHeight:1.15, letterSpacing:"-.025em", marginBottom:20 }}>
            Welcome back,<br/>
            <span style={{ color:GOLD_L, fontStyle:"italic" }}>Pastor.</span>
          </div>
          <p style={{ fontFamily:S, fontSize:14.5, color:"rgba(255,255,255,.52)",
            lineHeight:1.8, marginBottom:40 }}>
            Your church, your members, your records — all in one place. Sign in to continue
            managing your congregation with care.
          </p>

          {/* Mini stats */}
          <div style={{ display:"flex", gap:24 }}>
            {[["500+","Churches"],["10k+","Members"],["3×","Faster"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily:F, fontWeight:900, fontSize:"1.5rem",
                  color:GOLD_L, lineHeight:1 }}>{n}</div>
                <div style={{ fontFamily:S, fontSize:11, color:"rgba(255,255,255,.38)",
                  marginTop:4, letterSpacing:".04em", textTransform:"uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width:"100%", maxWidth:480, background:"#faf9f5",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 48px", position:"relative", zIndex:2,
        boxShadow:"-24px 0 80px rgba(0,0,0,.25)" }}>

        <div style={{ marginBottom:36 }}>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.8rem",
            color:TEXT, letterSpacing:"-.02em", marginBottom:8 }}>Sign In</div>
          <p style={{ fontFamily:S, fontSize:14, color:MUTED }}>
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")} style={{ color:FOREST,
              fontWeight:700, cursor:"pointer", textDecoration:"underline",
              textUnderlineOffset:3 }}>Create one free</span>
          </p>
        </div>

        {/* Email */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontFamily:S, fontSize:12, fontWeight:700,
            letterSpacing:".06em", textTransform:"uppercase", color:MUTED,
            display:"block", marginBottom:8 }}>Email Address</label>
          <input type="email" value={email} autoFocus
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="pastor@church.org"
            autoCapitalize="none" autoComplete="email"
            style={{ width:"100%", padding:"14px 16px", borderRadius:12,
              border:`1.5px solid ${BORDER}`, fontFamily:S, fontSize:15,
              color:TEXT, background:"#fff", outline:"none",
              transition:"border .2s", boxSizing:"border-box" }}
            onFocus={e => e.target.style.borderColor = FOREST}
            onBlur={e  => e.target.style.borderColor = BORDER}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:12 }}>
          <label style={{ fontFamily:S, fontSize:12, fontWeight:700,
            letterSpacing:".06em", textTransform:"uppercase", color:MUTED,
            display:"block", marginBottom:8 }}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPw ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ width:"100%", padding:"14px 46px 14px 16px", borderRadius:12,
                border:`1.5px solid ${BORDER}`, fontFamily:S, fontSize:15,
                color:TEXT, background:"#fff", outline:"none",
                transition:"border .2s", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor = FOREST}
              onBlur={e  => e.target.style.borderColor = BORDER}
            />
            <button onClick={() => setShowPw(!showPw)}
              style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer",
                color:MUTED, fontSize:12, fontFamily:S, fontWeight:600, padding:4 }}>
              {showPw ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div style={{ textAlign:"right", marginBottom:20 }}>
          <span onClick={() => navigate("/forgot")} style={{ fontFamily:S, fontSize:13,
            color:FOREST, cursor:"pointer", fontWeight:600 }}>Forgot password?</span>
        </div>

        {err && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10,
            padding:"12px 14px", fontFamily:S, fontSize:13, color:"#dc2626",
            fontWeight:500, marginBottom:16 }}>{err}</div>
        )}

        <button onClick={submit} disabled={busy} style={{
          width:"100%", padding:"16px", borderRadius:12,
          background: busy ? FM : FOREST, color:"#fff", border:"none",
          fontFamily:S, fontWeight:700, fontSize:15, cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.8 : 1, letterSpacing:".01em",
          boxShadow:`0 4px 20px rgba(26,58,42,.28)`,
          transition:"all .2s",
        }}>
          {busy ? "Signing in…" : "Sign In"}
        </button>

        <div style={{ marginTop:32, paddingTop:24, borderTop:`1px solid ${BORDER}`,
          textAlign:"center" }}>
          <span style={{ fontFamily:S, fontSize:12, color:MUTED }}>
            By signing in you agree to our{" "}
            <span style={{ color:FOREST, cursor:"pointer" }}>Terms of Service</span>
            {" & "}
            <span style={{ color:FOREST, cursor:"pointer" }}>Privacy Policy</span>
          </span>
        </div>
      </div>
    </div>
  );
}