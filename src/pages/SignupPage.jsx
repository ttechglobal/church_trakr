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

const Field = ({ label, children }) => (
  <div style={{ marginBottom:14 }}>
    <label style={{ fontFamily:S, fontSize:11, fontWeight:700, letterSpacing:".07em",
      textTransform:"uppercase", color:MUTED, display:"block", marginBottom:7 }}>
      {label}
    </label>
    {children}
  </div>
);

const inp = (extra = {}) => ({
  width:"100%", padding:"13px 16px", borderRadius:11,
  border:`1.5px solid ${BORDER}`, fontFamily:S, fontSize:14.5,
  color:TEXT, background:"#fff", outline:"none",
  transition:"border .2s", boxSizing:"border-box",
  ...extra,
});

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
      if (m.includes("already registered")) setErr("This email is already registered. Try signing in.");
      else if (m.includes("Password should be")) setErr("Password must be at least 6 characters.");
      else if (m.includes("valid email")) setErr("Please enter a valid email address.");
      else setErr(m || "Registration failed. Please try again.");
      return;
    }
    if (needsEmailConfirm) { setConfirmed(true); return; }
    navigate("/", { replace: true });
  };

  if (confirmed) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#faf9f5", padding:"24px" }}>
      <div style={{ maxWidth:460, width:"100%", textAlign:"center",
        background:"#fff", borderRadius:24, padding:"56px 40px",
        border:`1px solid ${BORDER}`, boxShadow:"0 4px 40px rgba(0,0,0,.07)" }}>
        <div style={{ width:72, height:72, borderRadius:20, margin:"0 auto 24px",
          background:"#f0fdf4", border:"1px solid #bbf7d0",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"2.2rem" }}>📧</div>
        <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.6rem",
          color:TEXT, marginBottom:12 }}>Check Your Inbox</div>
        <p style={{ fontFamily:S, fontSize:14, color:MUTED, lineHeight:1.8, marginBottom:8 }}>
          We sent a confirmation link to <strong style={{ color:TEXT }}>{email}</strong>
        </p>
        <p style={{ fontFamily:S, fontSize:13, color:MUTED, lineHeight:1.8, marginBottom:32 }}>
          Click the link to activate your account, then come back and sign in.
        </p>
        <button onClick={() => navigate("/login")} style={{
          width:"100%", padding:"15px", borderRadius:12,
          background:FOREST, color:"#fff", border:"none",
          fontFamily:S, fontWeight:700, fontSize:15, cursor:"pointer",
          boxShadow:`0 4px 18px rgba(26,58,42,.25)`,
        }}>Go to Sign In</button>
        <p style={{ marginTop:18, fontFamily:S, fontSize:12, color:MUTED }}>
          Didn't receive it? Check spam, or{" "}
          <span onClick={() => setConfirmed(false)}
            style={{ color:FOREST, cursor:"pointer", fontWeight:700 }}>try again</span>
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex",
      background:`linear-gradient(150deg, ${FOREST} 0%, ${FM} 60%, #1e4a34 100%)`,
      position:"relative", overflow:"hidden" }}>
      {/* Orbs */}
      <div style={{ position:"absolute", top:-100, right:-100, width:500, height:500,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-80, width:400, height:400,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(61,122,88,.3) 0%, transparent 65%)" }} />

      {/* Left panel */}
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"60px 56px", position:"relative", zIndex:2, minWidth:0 }}>
        <div onClick={() => navigate("/")} style={{ cursor:"pointer",
          display:"inline-flex", alignItems:"center", gap:10, marginBottom:64 }}>
          <div style={{ width:36, height:36, borderRadius:10,
            background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:F, fontWeight:700, fontSize:15, color:"#fff" }}>CT</div>
          <span style={{ fontFamily:F, fontWeight:700, fontSize:19, color:"#fff" }}>Church Tracker</span>
        </div>

        <div style={{ maxWidth:400 }}>
          <div style={{ fontFamily:F, fontSize:"2.4rem", fontWeight:900, color:"#fff",
            lineHeight:1.15, letterSpacing:"-.025em", marginBottom:20 }}>
            Start managing your church{" "}
            <span style={{ color:GOLD_L, fontStyle:"italic" }}>the right way.</span>
          </div>
          <p style={{ fontFamily:S, fontSize:14.5, color:"rgba(255,255,255,.52)",
            lineHeight:1.8, marginBottom:40 }}>
            Join hundreds of churches who use Church Tracker to track attendance,
            follow up with members, and grow their congregations with confidence.
          </p>
          {["Free to start, no credit card required",
            "Set up your church in under 5 minutes",
            "Works on mobile, tablet, or desktop",
            "SMS follow-up for absentees built in",
          ].map(item => (
            <div key={item} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
              <div style={{ width:18, height:18, borderRadius:"50%",
                background:"rgba(201,168,76,.2)", border:"1px solid rgba(201,168,76,.35)",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="8" height="7" viewBox="0 0 8 7" fill="none">
                  <path d="M1 3.5L3 5.5L7 1" stroke={GOLD_L} strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontFamily:S, fontSize:13.5,
                color:"rgba(255,255,255,.55)" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div style={{ width:"100%", maxWidth:500, background:"#faf9f5",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"48px 48px", position:"relative", zIndex:2, overflowY:"auto",
        boxShadow:"-24px 0 80px rgba(0,0,0,.25)" }}>

        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.7rem",
            color:TEXT, letterSpacing:"-.02em", marginBottom:8 }}>Create Your Account</div>
          <p style={{ fontFamily:S, fontSize:14, color:MUTED }}>
            Already registered?{" "}
            <span onClick={() => navigate("/login")} style={{ color:FOREST,
              fontWeight:700, cursor:"pointer", textDecoration:"underline",
              textUnderlineOffset:3 }}>Sign in</span>
          </p>
        </div>

        <Field label="Church Name">
          <input value={churchName} onChange={e => setChurchName(e.target.value)}
            placeholder="Grace Baptist Church" style={inp()} />
        </Field>

        <Field label="Your Full Name">
          <input value={adminName} onChange={e => setAdminName(e.target.value)}
            placeholder="Pastor James Okon" style={inp()} />
        </Field>

        <Field label="Email Address">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="pastor@church.org"
            autoCapitalize="none" style={inp()} />
        </Field>

        <Field label="Password">
          <div style={{ position:"relative" }}>
            <input type={showPw ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              style={inp({ paddingRight:52 })} />
            <button onClick={() => setShowPw(!showPw)}
              style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                background:"none", border:"none", cursor:"pointer",
                fontFamily:S, fontSize:11, fontWeight:700, color:MUTED, letterSpacing:".04em" }}>
              {showPw ? "HIDE" : "SHOW"}
            </button>
          </div>
        </Field>

        <Field label="Confirm Password">
          <input type="password" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            onKeyDown={e => e.key === "Enter" && submit()}
            style={inp()} />
        </Field>

        {err && (
          <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10,
            padding:"12px 14px", fontFamily:S, fontSize:13, color:"#dc2626",
            fontWeight:500, marginBottom:14 }}>{err}</div>
        )}

        <button onClick={submit} disabled={busy} style={{
          width:"100%", padding:"15px", borderRadius:12,
          background: busy ? FM : FOREST, color:"#fff", border:"none",
          fontFamily:S, fontWeight:700, fontSize:15,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.8 : 1, letterSpacing:".01em",
          boxShadow:`0 4px 20px rgba(26,58,42,.28)`, marginTop:4,
        }}>
          {busy ? "Creating account…" : "Create Church Account"}
        </button>

        <p style={{ textAlign:"center", marginTop:18, fontFamily:S,
          fontSize:12, color:MUTED, lineHeight:1.6 }}>
          By creating an account you agree to our{" "}
          <span style={{ color:FOREST, cursor:"pointer" }}>Terms of Service</span>
          {" & "}
          <span style={{ color:FOREST, cursor:"pointer" }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}