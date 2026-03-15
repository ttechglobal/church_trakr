// src/pages/ForgotPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const F      = "'Playfair Display', Georgia, serif";
const S      = "'DM Sans', system-ui, sans-serif";
const FOREST = "#1a3a2a";
const FM     = "#2d5a42";
const GOLD_L = "#e8d5a0";
const BORDER = "#e7e4dc";
const MUTED  = "#78716c";
const TEXT   = "#1c1917";

export default function ForgotPage() {
  const navigate = useNavigate();
  const [email,  setEmail]  = useState("");
  const [busy,   setBusy]   = useState(false);
  const [sent,   setSent]   = useState(false);
  const [err,    setErr]    = useState("");

  const go = async () => {
    setErr("");
    const e = email.trim();
    if (!e) { setErr("Please enter your email address"); return; }
    setBusy(true);
    // Send a password reset request to the support_messages table
    // SuperAdmin will see it and reach out manually
    const { error } = await supabase.from("support_messages").insert({
      church_id: null,
      message: `PASSWORD RESET REQUEST\nEmail: ${e}\nPlease reset this user's password or reach out to them directly.`,
    });
    setBusy(false);
    if (error) {
      setErr("Could not send request. Please contact support on WhatsApp.");
      return;
    }
    setSent(true);
  };

  const inputStyle = {
    width:"100%", padding:"14px 16px", borderRadius:12,
    border:`1.5px solid ${BORDER}`, fontFamily:S, fontSize:15,
    color:TEXT, background:"#fff", outline:"none",
    transition:"border .2s", boxSizing:"border-box",
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", flexDirection:"row", flexWrap:"wrap",
      background:`linear-gradient(150deg, ${FOREST} 0%, ${FM} 60%, #1e4a34 100%)`,
      position:"relative", overflow:"hidden",
    }}>
      <style>{`@media(max-width:640px){.ct-brand-panel{display:none!important}.ct-form-panel{max-width:100%!important;box-shadow:none!important;padding:48px 28px!important}}`}</style>

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
            We've got<br/>
            <span style={{ color:GOLD_L, fontStyle:"italic" }}>you covered.</span>
          </div>
          <p style={{ fontFamily:S, fontSize:14.5, color:"rgba(255,255,255,.52)",
            lineHeight:1.8 }}>
            Send a password reset request and our team will reach out to help you regain access.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="ct-form-panel" style={{ width:"100%", maxWidth:480, background:"#faf9f5",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"60px 48px", position:"relative", zIndex:2,
        boxShadow:"-24px 0 80px rgba(0,0,0,.25)" }}>

        {/* Back button */}
        <button onClick={() => navigate("/login")} style={{
          background:"none", border:"none", cursor:"pointer", padding:0,
          display:"inline-flex", alignItems:"center", gap:6,
          fontFamily:S, fontSize:13, fontWeight:600, color:MUTED,
          marginBottom:32, alignSelf:"flex-start",
        }}>
          <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
            <path d="M5 1L1 5.5L5 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Sign In
        </button>

        {sent ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:16 }}>✅</div>
            <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.6rem",
              color:TEXT, letterSpacing:"-.02em", marginBottom:12 }}>Request sent!</div>
            <p style={{ fontFamily:S, fontSize:14, color:MUTED, lineHeight:1.7, marginBottom:8 }}>
              Our team has received your password reset request for <strong>{email}</strong>.
            </p>
            <p style={{ fontFamily:S, fontSize:13, color:MUTED, lineHeight:1.7, marginBottom:28 }}>
              We'll reach out to you shortly via email or WhatsApp to help you regain access.
            </p>
            <button onClick={() => navigate("/login")} style={{
              width:"100%", padding:"16px", borderRadius:12,
              background:FOREST, color:"#fff", border:"none",
              fontFamily:S, fontWeight:700, fontSize:15, cursor:"pointer",
              boxShadow:`0 4px 20px rgba(26,58,42,.28)`,
            }}>Back to Sign In</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom:28 }}>
              <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.8rem",
                color:TEXT, letterSpacing:"-.02em", marginBottom:8 }}>Reset Password</div>
              <p style={{ fontFamily:S, fontSize:14, color:MUTED, lineHeight:1.6 }}>
                Enter your email and we'll send a password reset request to our admin team. They'll reach out to you directly.
              </p>
            </div>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontFamily:S, fontSize:12, fontWeight:700,
                letterSpacing:".06em", textTransform:"uppercase", color:MUTED,
                display:"block", marginBottom:8 }}>Email Address</label>
              <input type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && go()}
                placeholder="pastor@church.org"
                autoCapitalize="none" autoComplete="email"
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

            <button onClick={go} disabled={busy || !email.trim()} style={{
              width:"100%", padding:"16px", borderRadius:12,
              background: busy ? FM : FOREST, color:"#fff", border:"none",
              fontFamily:S, fontWeight:700, fontSize:15,
              cursor: busy || !email.trim() ? "not-allowed" : "pointer",
              opacity: busy || !email.trim() ? 0.7 : 1, letterSpacing:".01em",
              boxShadow:`0 4px 20px rgba(26,58,42,.28)`, transition:"all .2s",
            }}>
              {busy ? "Sending request…" : "Request Password Reset"}
            </button>

            <div style={{ marginTop:28, paddingTop:20, borderTop:`1px solid ${BORDER}`,
              textAlign:"center" }}>
              <p style={{ fontFamily:S, fontSize:13, color:MUTED }}>
                Remember your password?{" "}
                <span onClick={() => navigate("/login")} style={{ color:FOREST,
                  fontWeight:700, cursor:"pointer", textDecoration:"underline",
                  textUnderlineOffset:3 }}>Sign in</span>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}