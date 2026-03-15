// src/pages/SignupPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const F      = "'Playfair Display', Georgia, serif";
const S      = "'DM Sans', system-ui, sans-serif";
const FOREST = "#1a3a2a";
const FM     = "#2d5a42";
const GOLD_L = "#e8d5a0";
const BORDER = "#e7e4dc";
const MUTED  = "#78716c";
const TEXT   = "#1c1917";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate   = useNavigate();

  const [churchName, setChurchName] = useState("");
  const [adminName,  setAdminName]  = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [err,        setErr]        = useState("");
  const [busy,       setBusy]       = useState(false);
  const [confirmed,  setConfirmed]  = useState(false);
  const [showPw,     setShowPw]     = useState(false);

  const submit = async () => {
    setErr("");
    if (!churchName.trim()) { setErr("Enter your church name"); return; }
    if (!adminName.trim())  { setErr("Enter your full name"); return; }
    if (!email.trim())      { setErr("Enter your email address"); return; }
    if (password.length < 6){ setErr("Password must be at least 6 characters"); return; }
    if (password !== confirm){ setErr("Passwords don't match"); return; }

    setBusy(true);
    const { error, needsEmailConfirm } = await signUp(
      email.trim(), password, churchName.trim(), adminName.trim()
    );
    setBusy(false);

    if (error) {
      const m = error.message ?? "";
      if (m.includes("already registered") || m.includes("User already registered"))
        setErr("This email is already registered. Try signing in.");
      else if (m.includes("Password should be"))
        setErr("Password must be at least 6 characters.");
      else if (m.includes("valid email"))
        setErr("Please enter a valid email address.");
      else
        setErr(m || "Registration failed. Please try again.");
      return;
    }

    if (needsEmailConfirm) { setConfirmed(true); return; }
    navigate("/", { replace: true });
  };

  const inputStyle = {
    width:"100%", padding:"14px 16px", borderRadius:12,
    border:`1.5px solid ${BORDER}`, fontFamily:S, fontSize:15,
    color:TEXT, background:"#fff", outline:"none",
    transition:"border .2s", boxSizing:"border-box",
  };
  const labelStyle = {
    fontFamily:S, fontSize:12, fontWeight:700,
    letterSpacing:".06em", textTransform:"uppercase", color:MUTED,
    display:"block", marginBottom:8,
  };

  if (confirmed) {
    return (
      <div style={{
        minHeight:"100vh", display:"flex", flexDirection:"row", flexWrap:"wrap",
        background:`linear-gradient(150deg, ${FOREST} 0%, ${FM} 60%, #1e4a34 100%)`,
        position:"relative", overflow:"hidden",
      }}>
        <style>{`@media(max-width:640px){.ct-brand-panel{display:none!important}.ct-form-panel{max-width:100%!important;box-shadow:none!important;padding:48px 28px!important}}`}</style>
        <div className="ct-brand-panel" style={{ flex:1, display:"flex", flexDirection:"column",
          justifyContent:"center", padding:"60px 56px", position:"relative", zIndex:2, minWidth:0 }}>
          <div onClick={() => navigate("/")} style={{ cursor:"pointer",
            display:"inline-flex", alignItems:"center", gap:10, marginBottom:64 }}>
            <div style={{ width:36, height:36, borderRadius:10,
              background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.2)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:F, fontWeight:700, fontSize:15, color:"#fff" }}>CT</div>
            <span style={{ fontFamily:F, fontWeight:700, fontSize:19, color:"#fff" }}>ChurchTrakr</span>
          </div>
          <div style={{ fontFamily:F, fontSize:"2.4rem", fontWeight:900,
            color:"#fff", lineHeight:1.15, letterSpacing:"-.025em" }}>
            Almost there,<br/>
            <span style={{ color:GOLD_L, fontStyle:"italic" }}>Pastor.</span>
          </div>
        </div>
        <div className="ct-form-panel" style={{ width:"100%", maxWidth:480, background:"#faf9f5",
          display:"flex", flexDirection:"column", justifyContent:"center",
          padding:"60px 48px", position:"relative", zIndex:2,
          boxShadow:"-24px 0 80px rgba(0,0,0,.25)" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>📧</div>
            <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.6rem",
              color:TEXT, letterSpacing:"-.02em", marginBottom:12 }}>Check your inbox</div>
            <p style={{ fontFamily:S, fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:8 }}>
              We sent a confirmation link to <strong>{email}</strong>.
            </p>
            <p style={{ fontFamily:S, fontSize:13, color:MUTED, lineHeight:1.7, marginBottom:28 }}>
              Click the link to activate your account, then come back and sign in.
            </p>
            <button onClick={() => navigate("/login")} style={{
              width:"100%", padding:"16px", borderRadius:12,
              background:FOREST, color:"#fff", border:"none",
              fontFamily:S, fontWeight:700, fontSize:15, cursor:"pointer",
              boxShadow:`0 4px 20px rgba(26,58,42,.28)`,
            }}>Go to Sign In</button>
            <p style={{ marginTop:16, fontFamily:S, fontSize:12, color:MUTED }}>
              Didn't receive it? Check your spam folder, or{" "}
              <span onClick={() => setConfirmed(false)} style={{ color:FOREST, fontWeight:700, cursor:"pointer" }}>try again</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"row", flexWrap:"wrap",
      background:`linear-gradient(150deg, ${FOREST} 0%, ${FM} 60%, #1e4a34 100%)`,
      position:"relative", overflow:"hidden",
    }}>
      <style>{`@media(max-width:640px){.ct-brand-panel{display:none!important}.ct-form-panel{max-width:100%!important;box-shadow:none!important;padding:40px 24px!important}}`}</style>

      {/* Orbs */}
      <div style={{ position:"absolute", top:-100, right:-100, width:500, height:500,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-80, width:400, height:400,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(61,122,88,.3) 0%, transparent 65%)" }} />

      {/* Left brand panel */}
      <div className="ct-brand-panel" style={{ flex:1, display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"60px 56px", position:"relative", zIndex:2, minWidth:0 }}>
        <div onClick={() => navigate("/")} style={{ cursor:"pointer",
          display:"inline-flex", alignItems:"center", gap:10, marginBottom:64 }}>
          <div style={{ width:36, height:36, borderRadius:10,
            background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:F, fontWeight:700, fontSize:15, color:"#fff" }}>CT</div>
          <span style={{ fontFamily:F, fontWeight:700, fontSize:19, color:"#fff" }}>ChurchTrakr</span>
        </div>

        <div style={{ maxWidth:400 }}>
          <div style={{ fontFamily:F, fontSize:"2.6rem", fontWeight:900,
            color:"#fff", lineHeight:1.15, letterSpacing:"-.025em", marginBottom:20 }}>
            Join thousands of<br/>
            <span style={{ color:GOLD_L, fontStyle:"italic" }}>growing churches.</span>
          </div>
          <p style={{ fontFamily:S, fontSize:14.5, color:"rgba(255,255,255,.52)",
            lineHeight:1.8, marginBottom:40 }}>
            Track attendance, follow up on members, and send SMS — all from one simple app.
            Set up in under 2 minutes.
          </p>
          <div style={{ display:"flex", gap:24 }}>
            {[["Free","To start"],["2 min","Setup"],["100%","Yours"]].map(([n,l]) => (
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
      <div className="ct-form-panel" style={{ width:"100%", maxWidth:480, background:"#faf9f5",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 48px", position:"relative", zIndex:2,
        boxShadow:"-24px 0 80px rgba(0,0,0,.25)", overflowY:"auto" }}>

        {/* Back button */}
        <button onClick={() => navigate("/")} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          display:"inline-flex", alignItems:"center", gap:6,
          fontFamily:S, fontSize:13, fontWeight:600, color:MUTED,
          marginBottom:32, alignSelf:"flex-start",
        }}>
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
            <path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.8rem",
            color:TEXT, letterSpacing:"-.02em", marginBottom:8 }}>Create Account</div>
          <p style={{ fontFamily:S, fontSize:14, color:MUTED }}>
            Already registered?{" "}
            <span onClick={() => navigate("/login")} style={{ color:FOREST,
              fontWeight:700, cursor:"pointer", textDecoration:"underline",
              textUnderlineOffset:3 }}>Sign in</span>
          </p>
        </div>

        {/* Church Name */}
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Church Name</label>
          <input value={churchName} onChange={e => setChurchName(e.target.value)}
            placeholder="Grace Baptist Church"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = FOREST}
            onBlur={e  => e.target.style.borderColor = BORDER}
          />
        </div>

        {/* Admin Name */}
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Your Full Name</label>
          <input value={adminName} onChange={e => setAdminName(e.target.value)}
            placeholder="Pastor James Okon"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = FOREST}
            onBlur={e  => e.target.style.borderColor = BORDER}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="pastor@church.org"
            autoCapitalize="none" autoComplete="email"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = FOREST}
            onBlur={e  => e.target.style.borderColor = BORDER}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom:16 }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPw ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              style={{ ...inputStyle, paddingRight:52 }}
              onFocus={e => e.target.style.borderColor = FOREST}
              onBlur={e  => e.target.style.borderColor = BORDER}
            />
            <button onClick={() => setShowPw(!showPw)} style={{
              position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
              background:"none", border:"none", cursor:"pointer",
              color:MUTED, fontSize:12, fontFamily:S, fontWeight:600, padding:4,
            }}>{showPw ? "Hide" : "Show"}</button>
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom:20 }}>
          <label style={labelStyle}>Confirm Password</label>
          <input type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder="Repeat password"
            autoComplete="new-password"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = FOREST}
            onBlur={e  => e.target.style.borderColor = BORDER}
          />
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
          boxShadow:`0 4px 20px rgba(26,58,42,.28)`, transition:"all .2s",
        }}>
          {busy ? "Creating account…" : "Create Account"}
        </button>

        <div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${BORDER}`,
          textAlign:"center" }}>
          <span style={{ fontFamily:S, fontSize:12, color:MUTED }}>
            By signing up you agree to our{" "}
            <span style={{ color:FOREST, cursor:"pointer" }}>Terms of Service</span>
            {" & "}
            <span style={{ color:FOREST, cursor:"pointer" }}>Privacy Policy</span>
          </span>
        </div>
      </div>
    </div>
  );
}