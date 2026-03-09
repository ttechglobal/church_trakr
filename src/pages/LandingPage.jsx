// src/pages/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const F      = "'Playfair Display', Georgia, serif";
const S      = "'DM Sans', system-ui, sans-serif";
const FOREST = "#1a3a2a";
const FM     = "#2d5a42";
const GOLD   = "#c9a84c";
const GOLD_L = "#e8d5a0";
const IVORY  = "#faf9f5";
const WARM   = "#f3f1eb";
const BORDER = "#e7e4dc";
const MUTED  = "#78716c";
const TEXT   = "#1c1917";

// ── Mobile detection hook ─────────────────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ── Tiny components ───────────────────────────────────────────────────────────
const Label = ({ children, light }) => (
  <div style={{ fontFamily:S, fontSize:11, fontWeight:700, letterSpacing:".12em",
    textTransform:"uppercase", color:light ? GOLD_L : GOLD, marginBottom:14 }}>
    {children}
  </div>
);

const CheckItem = ({ children }) => (
  <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:12 }}>
    <div style={{ width:20, height:20, borderRadius:"50%", background:FOREST,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
        <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
    <span style={{ fontFamily:S, fontSize:14, color:MUTED, lineHeight:1.6 }}>{children}</span>
  </div>
);

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ onLogin, onSignup }) {
  const isMobile = useIsMobile();
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      background:"rgba(250,249,245,.94)", backdropFilter:"blur(18px)",
      borderBottom:`1px solid ${BORDER}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 20px", height:60,
    }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
        <div style={{ width:30, height:30, borderRadius:8,
          background:`linear-gradient(135deg, ${FM}, ${FOREST})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:F, fontWeight:700, fontSize:12, color:"#fff" }}>CT</div>
        <span style={{ fontFamily:F, fontWeight:700, fontSize:16, color:FOREST }}>
          Church Tracker
        </span>
      </div>

      {/* Desktop nav buttons — hidden on mobile */}
      {!isMobile && (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onLogin} style={{
            background:"none", border:`1.5px solid ${BORDER}`, borderRadius:10,
            padding:"8px 18px", fontFamily:S, fontWeight:600, fontSize:13,
            color:TEXT, cursor:"pointer" }}>Sign In</button>
          <button onClick={onSignup} style={{
            background:FOREST, border:"none", borderRadius:10,
            padding:"9px 20px", fontFamily:S, fontWeight:700, fontSize:13,
            color:"#fff", cursor:"pointer",
            boxShadow:`0 2px 12px rgba(26,58,42,.28)` }}>
            Get Started Free
          </button>
        </div>
      )}

      {/* Mobile: single compact sign-in link */}
      {isMobile && (
        <button onClick={onLogin} style={{
          background:"none", border:"none", fontFamily:S, fontWeight:700,
          fontSize:13, color:FOREST, cursor:"pointer", padding:"8px 4px" }}>
          Sign In
        </button>
      )}
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onSignup, onLogin }) {
  const isMobile = useIsMobile();
  return (
    <section style={{
      minHeight:"100vh", display:"flex", alignItems:"center",
      background:FOREST, position:"relative", overflow:"hidden", paddingTop:60,
    }}>
      <div style={{ position:"absolute", top:-100, right:-120, width:500, height:500,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.13) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-60, width:380, height:380,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(61,122,88,.3) 0%, transparent 65%)" }} />

      <div style={{ maxWidth:1100, margin:"0 auto",
        padding: isMobile ? "60px 20px 70px" : "80px 24px 80px",
        width:"100%", position:"relative", zIndex:2 }}>

        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(201,168,76,.12)", border:"1px solid rgba(201,168,76,.28)",
          borderRadius:99, padding:"6px 16px", marginBottom:24,
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:GOLD }} />
          <span style={{ fontFamily:S, fontSize:10, fontWeight:700,
            letterSpacing:".1em", textTransform:"uppercase", color:GOLD_L }}>
            Purpose-Built for Churches
          </span>
        </div>

        <h1 style={{
          fontFamily:F, fontWeight:900, lineHeight:1.1, letterSpacing:"-.025em",
          color:"#fff", marginBottom:20,
          fontSize: isMobile ? "2.4rem" : "clamp(2.8rem, 6.5vw, 5rem)",
          maxWidth: isMobile ? "100%" : 820,
        }}>
          Your Church Deserves More Than{isMobile ? " " : <br/>}
          <span style={{ color:GOLD_L, fontStyle:"italic" }}>a Spreadsheet.</span>
        </h1>

        <p style={{
          fontFamily:S, color:"rgba(255,255,255,.62)", lineHeight:1.75,
          maxWidth:540, marginBottom:36,
          fontSize: isMobile ? "1rem" : "1.15rem",
        }}>
          Church Tracker helps pastors and administrators mark attendance, track members,
          follow up with absentees, and never lose a first-time visitor — all in one
          beautifully simple platform.
        </p>

        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
          <button onClick={onSignup} style={{
            background:GOLD, color:FOREST, border:"none", borderRadius:12,
            padding: isMobile ? "14px 28px" : "16px 34px",
            fontFamily:S, fontWeight:700, fontSize: isMobile ? 15 : 16,
            cursor:"pointer", boxShadow:`0 4px 28px rgba(201,168,76,.45)`,
          }}>
            Create Your Free Account →
          </button>
          {!isMobile && (
            <button onClick={onLogin} style={{
              background:"rgba(255,255,255,.1)", color:"#fff",
              border:"1.5px solid rgba(255,255,255,.22)", borderRadius:12,
              padding:"16px 34px", fontFamily:S, fontWeight:600, fontSize:16,
              cursor:"pointer", backdropFilter:"blur(8px)",
            }}>Sign In</button>
          )}
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {["No credit card required", "Set up in 5 minutes", "Works on any device"].map((t, i) => (
            <span key={t} style={{ display:"flex", alignItems:"center", gap:8 }}>
              {i > 0 && <span style={{ width:3, height:3, borderRadius:"50%",
                background:"rgba(255,255,255,.2)", display:"inline-block" }} />}
              <span style={{ fontFamily:S, fontSize:12, color:"rgba(255,255,255,.4)", fontWeight:500 }}>{t}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats (honest, no inflated numbers) ──────────────────────────────────────
function Stats() {
  const isMobile = useIsMobile();
  const items = [
    { num:"< 2",  suffix:"min",  l:"To Mark Attendance" },
    { num:"1",    suffix:" tap", l:"To Follow Up Absentees" },
    { num:"100",  suffix:"%",    l:"Attendance Accuracy" },
    { num:"Zero", suffix:"",     l:"Members Lost to Silence" },
  ];
  return (
    <div style={{ background:"#fff", borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px",
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)" }}>
        {items.map((item, i) => {
          const isLastRow = isMobile && i >= 2;
          const isRight   = i % 2 === 1;
          return (
            <div key={item.l} style={{
              padding: isMobile ? "28px 16px" : "36px 24px",
              textAlign:"center",
              borderRight:  !isRight ? `1px solid ${BORDER}` : "none",
              borderBottom: isLastRow ? "none" : (isMobile && i < 2) ? `1px solid ${BORDER}` : "none",
              borderTop:    isLastRow ? `1px solid ${BORDER}` : "none",
              ...((!isMobile && i < 3) ? { borderRight:`1px solid ${BORDER}` } : {}),
              ...((!isMobile) ? { borderBottom:"none", borderTop:"none" } : {}),
            }}>
              <div style={{ fontFamily:F, fontWeight:900,
                fontSize: isMobile ? "1.8rem" : "2.2rem",
                color:FOREST, lineHeight:1 }}>
                {item.num}<span style={{ color:GOLD, fontSize: isMobile ? "1.2rem" : "1.5rem" }}>{item.suffix}</span>
              </div>
              <div style={{ fontFamily:S, fontSize:12, color:MUTED, marginTop:7, fontWeight:500 }}>{item.l}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Problem ───────────────────────────────────────────────────────────────────
function Problem() {
  const isMobile = useIsMobile();
  const cards = [
    { icon:"📋", t:"Chaotic Attendance Records", d:"Paper registers get lost. Spreadsheets become inconsistent. After a few weeks, nobody truly knows who's been showing up." },
    { icon:"👤", t:"First-Time Visitors Forgotten", d:"Someone walks through your doors. Without a system, they leave and are never followed up with — and quietly never return." },
    { icon:"😔", t:"Absentees Go Unnoticed", d:"A member misses three Sundays. No one notices. No one reaches out. They drift away from the congregation in silence." },
    { icon:"⏰", t:"Administrative Overload", d:"Pastors spend hours compiling registers, identifying absentees, and writing messages — tasks that should take under ten minutes." },
    { icon:"📊", t:"No Insight Into Growth", d:"Without data you can't tell if your congregation is growing or declining. Decisions become guesswork instead of wisdom." },
    { icon:"📱", t:"Disconnected Communication", d:"WhatsApp broadcasts, manual texts, phone calls — follow-up is scattered, inconsistent, and exhausting for your team." },
  ];
  return (
    <section style={{ background:WARM, padding: isMobile ? "70px 20px" : "100px 24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", maxWidth:600, margin:"0 auto 48px" }}>
          <Label>The Challenge</Label>
          <h2 style={{ fontFamily:F, fontSize: isMobile ? "1.8rem" : "clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em" }}>
            The Challenges Many Churches Face
          </h2>
        </div>
        <div style={{ display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:14 }}>
          {cards.map(c => (
            <div key={c.t} style={{
              background:"#fff", borderRadius:18, padding:"26px 22px",
              border:`1px solid ${BORDER}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)",
            }}>
              <div style={{ fontSize:"1.6rem", marginBottom:12 }}>{c.icon}</div>
              <div style={{ fontFamily:F, fontWeight:600, fontSize:"1rem",
                color:TEXT, marginBottom:8 }}>{c.t}</div>
              <p style={{ fontFamily:S, fontSize:13, lineHeight:1.7, color:MUTED, margin:0 }}>{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Solution ──────────────────────────────────────────────────────────────────
function Solution() {
  const isMobile = useIsMobile();
  const rows = [
    { name:"Sister Grace Okafor",     badge:"Present",    bc:"rgba(110,231,183,.2)", tc:"#6ee7b7" },
    { name:"Brother Emmanuel Nwosu",  badge:"Absent",     bc:"rgba(252,165,165,.2)", tc:"#fca5a5" },
    { name:"Mrs. Blessing Ihejirika", badge:"First Timer",bc:"rgba(201,168,76,.22)", tc:GOLD_L },
    { name:"Deacon Samuel Kalu",      badge:"Present",    bc:"rgba(110,231,183,.2)", tc:"#6ee7b7" },
    { name:"Pastor James Adebayo",    badge:"Present",    bc:"rgba(110,231,183,.2)", tc:"#6ee7b7" },
  ];
  return (
    <section style={{ background:"#fff", padding: isMobile ? "70px 20px" : "100px 24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto",
        display:"grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 40 : 80, alignItems:"center" }}>

        {/* Live mock */}
        <div style={{
          background:`linear-gradient(150deg, ${FOREST} 0%, ${FM} 100%)`,
          borderRadius:22, padding: isMobile ? "28px 20px" : "36px 28px",
          boxShadow:`0 20px 70px rgba(26,58,42,.2)`,
          position:"relative", overflow:"hidden",
          order: isMobile ? 2 : 1,
        }}>
          <div style={{ position:"absolute", top:-60, right:-60, width:200, height:200,
            borderRadius:"50%", pointerEvents:"none",
            background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 65%)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14,
            background:"rgba(255,255,255,.08)", borderRadius:10, padding:"11px 14px",
            border:"1px solid rgba(255,255,255,.08)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,.55)" strokeWidth="2"/>
            </svg>
            <span style={{ fontFamily:S, fontSize:12, color:"rgba(255,255,255,.65)", fontWeight:600 }}>
              Sunday Service · 9 Mar 2025
            </span>
          </div>
          {rows.map(r => (
            <div key={r.name} style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(255,255,255,.07)", borderRadius:9, padding:"11px 14px",
              marginBottom:7, border:"1px solid rgba(255,255,255,.05)",
            }}>
              <span style={{ fontFamily:S, fontSize:13, color:"rgba(255,255,255,.82)", fontWeight:500 }}>{r.name}</span>
              <span style={{ background:r.bc, color:r.tc, fontSize:10, fontWeight:700,
                padding:"3px 10px", borderRadius:99, fontFamily:S, letterSpacing:".04em",
                textTransform:"uppercase", flexShrink:0 }}>{r.badge}</span>
            </div>
          ))}
          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            {[["22","Present","#6ee7b7","rgba(110,231,183,.1)"],
              ["3","Absent","#fca5a5","rgba(252,165,165,.1)"],
              ["2","New",GOLD_L,"rgba(201,168,76,.1)"]].map(([n,l,col,bg]) => (
              <div key={l} style={{ flex:1, background:bg, borderRadius:10, padding:"11px 6px",
                textAlign:"center", border:"1px solid rgba(255,255,255,.07)" }}>
                <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.4rem", color:col, lineHeight:1 }}>{n}</div>
                <div style={{ fontFamily:S, fontSize:9, color:col, marginTop:3,
                  opacity:.75, letterSpacing:".05em", textTransform:"uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Copy */}
        <div style={{ order: isMobile ? 1 : 2 }}>
          <Label>The Solution</Label>
          <h2 style={{ fontFamily:F, fontSize: isMobile ? "1.9rem" : "clamp(1.8rem,3.5vw,2.7rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:18 }}>
            One Platform.<br/>Complete Clarity.
          </h2>
          <p style={{ fontFamily:S, color:MUTED, lineHeight:1.8, fontSize:14.5, marginBottom:24 }}>
            Church Tracker replaces scattered registers and forgotten spreadsheets with one
            intelligent, purpose-built platform. Mark attendance in seconds, reach out to
            absentees in one tap, and never lose a first-time visitor again.
          </p>
          <CheckItem>Mark full congregation attendance in under 2 minutes</CheckItem>
          <CheckItem>Automatic SMS follow-up sent to absentees</CheckItem>
          <CheckItem>First-time visitors captured and welcomed immediately</CheckItem>
          <CheckItem>Real-time growth analytics and attendance trends</CheckItem>
          <CheckItem>Every member, group, and record in one secure place</CheckItem>
        </div>
      </div>
    </section>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────
function Features() {
  const isMobile = useIsMobile();
  const feats = [
    { icon:"📅", t:"Smart Attendance Tracking", d:"Mark attendance for any group in seconds. Scroll your list, tap to mark absent — everyone else is automatically present. Fast, intuitive, built for real Sunday mornings." },
    { icon:"🙌", t:"First-Timer Management", d:"Log new visitors during or after service. Capture their details and trigger an immediate personalised welcome. Turn a one-time visit into a lasting connection." },
    { icon:"📡", t:"Absentee Detection", d:"Church Tracker automatically identifies members absent for consecutive Sundays. Send bulk SMS follow-up in one tap — no member should feel forgotten." },
    { icon:"💬", t:"SMS Messaging", d:"Reach your members where they already are. Target absentees, first-timers, or your entire congregation. One message, sent to many." },
    { icon:"📈", t:"Growth Insights", d:"See attendance trends over time. Understand which groups are growing and where follow-up is needed. Data-informed pastoral care, made simple." },
    { icon:"👥", t:"Member Records", d:"Every member, every group, every interaction in one secure searchable place. Organise into ministry groups and always find what you need." },
  ];
  return (
    <section style={{ background:WARM, padding: isMobile ? "70px 20px" : "100px 24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", maxWidth:580, margin:"0 auto 48px" }}>
          <Label>Features</Label>
          <h2 style={{ fontFamily:F, fontSize: isMobile ? "1.8rem" : "clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:12 }}>
            Everything Your Church Needs
          </h2>
          <p style={{ fontFamily:S, color:MUTED, lineHeight:1.75, fontSize:14.5, margin:0 }}>
            Purpose-built tools for church leaders who want to spend less time on admin
            and more time on ministry.
          </p>
        </div>
        <div style={{ display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:16 }}>
          {feats.map(f => (
            <div key={f.t} style={{
              background:"#fff", borderRadius:18, padding: isMobile ? "24px 20px" : "30px 24px",
              border:`1px solid ${BORDER}`, boxShadow:"0 1px 5px rgba(0,0,0,.04)",
              display:"flex", gap:16, alignItems:"flex-start",
            }}>
              <div style={{ width:46, height:46, borderRadius:12, flexShrink:0,
                background:`linear-gradient(135deg, ${FM}, ${FOREST})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.3rem", boxShadow:`0 3px 12px rgba(26,58,42,.2)` }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily:F, fontWeight:600, fontSize:"1rem",
                  color:TEXT, marginBottom:7 }}>{f.t}</div>
                <p style={{ fontFamily:S, fontSize:13, lineHeight:1.7, color:MUTED, margin:0 }}>{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks({ onSignup }) {
  const isMobile = useIsMobile();
  const steps = [
    { n:"1", t:"Create Your Account", d:"Sign up in under 2 minutes. Enter your church name and details. No credit card required." },
    { n:"2", t:"Add Members & Groups", d:"Add your members and organise them into ministry groups — youth, choir, cells, departments." },
    { n:"3", t:"Mark Attendance", d:"Open the app before or after service. Select your group, scroll through members, tap once to mark." },
    { n:"4", t:"Follow Up & Grow", d:"Send SMS to absentees. Welcome first-timers. Review weekly insights. Let Church Tracker handle the admin." },
  ];
  return (
    <section style={{ background:FOREST, padding: isMobile ? "70px 20px" : "100px 24px",
      position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-200, right:-150, width:600, height:600,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.1) 0%, transparent 65%)" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center", maxWidth:560, margin:"0 auto 56px" }}>
          <Label light>How It Works</Label>
          <h2 style={{ fontFamily:F, fontSize: isMobile ? "1.8rem" : "clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:14 }}>
            Up and Running in Minutes
          </h2>
          <p style={{ fontFamily:S, color:"rgba(255,255,255,.5)", lineHeight:1.75, fontSize:14.5, margin:0 }}>
            No complicated setup. No technical knowledge required.
          </p>
        </div>

        <div style={{ display:"grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap:20 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ textAlign:"center", padding: isMobile ? "0" : "0 8px",
              display:"flex", flexDirection: isMobile ? "row" : "column",
              alignItems: isMobile ? "flex-start" : "center", gap: isMobile ? 16 : 0,
              ...(isMobile ? {
                background:"rgba(255,255,255,.05)", borderRadius:14,
                padding:"20px 18px", border:"1px solid rgba(255,255,255,.07)"
              } : {}),
            }}>
              <div style={{ width: isMobile ? 52 : 72, height: isMobile ? 52 : 72,
                borderRadius:"50%", flexShrink:0,
                margin: isMobile ? "0" : "0 auto 22px",
                background:"rgba(201,168,76,.1)", border:"1.5px solid rgba(201,168,76,.28)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:F, fontSize: isMobile ? "1.5rem" : "2rem",
                fontWeight:700, color:GOLD_L,
              }}>{s.n}</div>
              <div style={{ textAlign: isMobile ? "left" : "center" }}>
                <div style={{ fontFamily:F, fontSize:"1rem", color:"#fff",
                  fontWeight:600, marginBottom:8 }}>{s.t}</div>
                <p style={{ fontFamily:S, fontSize:13, color:"rgba(255,255,255,.48)",
                  lineHeight:1.7, margin:0 }}>{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:52 }}>
          <button onClick={onSignup} style={{
            background:GOLD, color:FOREST, border:"none", borderRadius:12,
            padding: isMobile ? "14px 32px" : "16px 40px",
            fontFamily:S, fontWeight:700, fontSize:15,
            cursor:"pointer", boxShadow:`0 4px 28px rgba(201,168,76,.4)`,
          }}>Start Free Today →</button>
        </div>
      </div>
    </section>
  );
}

// ── Story / Our Why ───────────────────────────────────────────────────────────
function Story() {
  const isMobile = useIsMobile();
  return (
    <section style={{ background:WARM, padding: isMobile ? "70px 20px" : "100px 24px" }}>
      <div style={{ maxWidth:760, margin:"0 auto", textAlign:"center" }}>
        <Label>Our Why</Label>
        <h2 style={{ fontFamily:F, fontSize: isMobile ? "1.9rem" : "clamp(1.9rem,4vw,2.8rem)",
          fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:28 }}>
          Built Out of Pain.<br/>
          <span style={{ fontStyle:"italic", color:FM }}>And Real Love for the Church.</span>
        </h2>

        {/* Pull stat — visual anchor */}
        <div style={{ display:"flex", justifyContent:"center", gap: isMobile ? 16 : 40,
          margin:"0 auto 40px", flexWrap:"wrap" }}>
          {[["Empty chairs.","Week after week."],["No follow-up.","No system."],["People leaving.","Nobody noticed."]].map(([a,b]) => (
            <div key={a} style={{ textAlign:"center" }}>
              <div style={{ fontFamily:F, fontWeight:700, fontSize:"1rem", color:TEXT }}>{a}</div>
              <div style={{ fontFamily:S, fontSize:12.5, color:MUTED, marginTop:2 }}>{b}</div>
            </div>
          ))}
        </div>

        <p style={{ fontFamily:S, color:MUTED, lineHeight:1.9, fontSize:15, marginBottom:18 }}>
          Church Tracker was born from a real, painful observation — people were coming to church,
          then quietly disappearing, and <strong style={{ color:TEXT }}>no one was reaching out.</strong> Not
          because they didn't care. But because there was no system. There was no structure.
          There was no way to even know who was missing.
        </p>
        <p style={{ fontFamily:S, color:MUTED, lineHeight:1.9, fontSize:15, marginBottom:18 }}>
          Empty chairs every Sunday. Members who used to sit in the third row — gone.
          First-time visitors who never came back. And the saddest part? <strong style={{ color:TEXT }}>Nobody
          even knew to check.</strong> Everyone was busy. There was no alert, no reminder, no list.
          Just silence.
        </p>
        <p style={{ fontFamily:S, color:MUTED, lineHeight:1.9, fontSize:15, marginBottom:40 }}>
          But here is what we discovered: <strong style={{ color:TEXT }}>when you reach out, people feel loved.</strong> A
          simple message — "We missed you this Sunday" — can be the thing that brings someone
          back. It tells them they were seen. That their presence mattered. That the church noticed
          their absence. That is pastoral care. And Church Tracker exists to make it effortless.
        </p>

        <div style={{
          background:"#fff", borderRadius:20, padding: isMobile ? "28px 24px" : "36px 40px",
          border:`1px solid ${BORDER}`, position:"relative",
          boxShadow:"0 2px 16px rgba(0,0,0,.05)", textAlign:"left",
        }}>
          <div style={{ position:"absolute", top:12, left:26,
            fontFamily:F, fontSize:"5rem", fontWeight:900, color:GOLD, opacity:.18, lineHeight:1 }}>"</div>
          <p style={{ fontFamily:F, fontStyle:"italic", fontSize: isMobile ? "1.05rem" : "1.15rem",
            color:TEXT, lineHeight:1.7, paddingLeft:8, margin:0 }}>
            We built Church Tracker because we believe every member who walks through those doors
            deserves to be seen — and every member who doesn't show up deserves to be missed.
            Not by chance. By design.
          </p>
          <div style={{ marginTop:20, fontFamily:S, fontSize:13, color:MUTED, fontWeight:600 }}>
            — The Church Tracker Team
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials — COMMENTED OUT (uncomment when real testimonials available) ──
/*
function Testimonials() {
  const tests = [
    { q:"Before Church Tracker, our attendance register was a notebook that went missing every other Sunday. Now our admin marks attendance before the closing prayer is finished. It changed everything.", name:"Pastor Philip Eze", role:"Senior Pastor · Grace Assembly, Lagos", init:"P" },
    { q:"We had a first-timer in March who almost slipped through the cracks. Because of Church Tracker, we followed up with her the same week. She became a member a month later.", name:"Admin Sister Adaeze Nkemdirim", role:"Church Admin · Fountain of Life, Abuja", init:"A" },
    { q:"The SMS follow-up for absentees alone is worth everything. We sent messages to 12 members who had been absent for three weeks. Eight of them came back the following Sunday.", name:"Deacon Chukwuemeka Obi", role:"Ministry Coordinator · Light Chapel, Port Harcourt", init:"D" },
  ];
  return (
    <section style={{ background:"#fff", padding:"100px 24px" }}>
      ...
    </section>
  );
}
*/

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ() {
  const isMobile = useIsMobile();
  const faqs = [
    { q:"Is Church Tracker free to use?", a:"Yes — get started completely free. Create your church account, add members, and mark attendance with no upfront cost. SMS messaging credits are available as an affordable add-on when you're ready." },
    { q:"Do my members need to download an app?", a:"No. Church Tracker is used by your administrators and leaders only. Your congregation doesn't need to install anything or create accounts." },
    { q:"How does the SMS follow-up feature work?", a:"After marking attendance, Church Tracker identifies members absent for consecutive Sundays. Send personalised SMS messages to those members in a single tap — choosing your message and sending to the whole list at once." },
    { q:"Is our member data safe and private?", a:"Absolutely. Your data belongs to your church only. We use industry-standard encryption and secure cloud infrastructure. We will never sell or share your members' information." },
    { q:"Can I use it for multiple groups or services?", a:"Yes. Church Tracker supports multiple groups — track attendance separately for different services, departments, cell groups, youth ministry, choir, and more." },
    { q:"How long does it take to set up?", a:"Most churches are fully set up in under 5 minutes. Create your account, add your first group, add members, and you're ready to mark attendance at your very next service." },
    { q:"What if my church is small?", a:"Church Tracker is just as valuable for a church of 30 as one of 3,000. In smaller churches, every single member matters deeply — knowing exactly who is present or absent makes all the difference." },
  ];
  const [open, setOpen] = useState(null);
  return (
    <section style={{ background:"#fff", padding: isMobile ? "70px 20px" : "100px 24px" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <Label>FAQ</Label>
          <h2 style={{ fontFamily:F, fontSize: isMobile ? "1.8rem" : "clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em" }}>
            Questions Pastors Ask
          </h2>
        </div>
        {faqs.map((f, i) => (
          <div key={f.q} style={{
            background:WARM, borderRadius:14, marginBottom:10,
            border:`1px solid ${BORDER}`, overflow:"hidden",
          }}>
            <div onClick={() => setOpen(open === i ? null : i)} style={{
              padding: isMobile ? "16px 18px" : "20px 24px", cursor:"pointer",
              display:"flex", justifyContent:"space-between", alignItems:"center", gap:12,
              fontFamily:S, fontWeight:600, fontSize: isMobile ? 14 : 15, color:TEXT, userSelect:"none",
            }}>
              <span>{f.q}</span>
              <div style={{ width:26, height:26, borderRadius:"50%", flexShrink:0,
                background:open === i ? FOREST : "#fff",
                border:`1px solid ${open === i ? FOREST : BORDER}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .2s", transform:open === i ? "rotate(180deg)" : "none",
              }}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke={open === i ? "#fff" : MUTED}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {open === i && (
              <div style={{ padding: isMobile ? "0 18px 18px" : "0 24px 20px",
                fontFamily:S, fontSize:13.5, color:MUTED, lineHeight:1.8 }}>
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function FinalCTA({ onSignup }) {
  const isMobile = useIsMobile();
  return (
    <section style={{ background:FOREST, padding: isMobile ? "70px 20px" : "100px 24px",
      position:"relative", overflow:"hidden", textAlign:"center" }}>
      <div style={{ position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)", width:600, height:600, borderRadius:"50%",
        pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 60%)" }} />
      <div style={{ maxWidth:680, margin:"0 auto", position:"relative", zIndex:2 }}>
        <Label light>Get Started Today</Label>
        <h2 style={{ fontFamily:F, fontWeight:900, color:"#fff", letterSpacing:"-.025em",
          marginBottom:18, fontSize: isMobile ? "2rem" : "clamp(2rem,5vw,3.2rem)" }}>
          Your Church Is Ready for This.
        </h2>
        <p style={{ fontFamily:S, color:"rgba(255,255,255,.58)", lineHeight:1.8,
          fontSize:15, maxWidth:480, margin:"0 auto 40px" }}>
          Start managing attendance, following up with members, and growing your congregation
          with confidence. It takes less than 5 minutes to set up.
        </p>
        <button onClick={onSignup} style={{
          background:GOLD, color:FOREST, border:"none", borderRadius:12,
          padding: isMobile ? "15px 32px" : "17px 44px",
          fontFamily:S, fontWeight:700, fontSize: isMobile ? 15 : 16,
          cursor:"pointer", boxShadow:`0 4px 28px rgba(201,168,76,.42)`,
        }}>Create Your Church Account →</button>
        <p style={{ fontFamily:S, fontSize:12, color:"rgba(255,255,255,.25)", marginTop:18 }}>
          Free to start · No credit card required · Works on any device
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ onLogin, onSignup }) {
  const isMobile = useIsMobile();
  return (
    <footer style={{ background:"#111a14", padding: isMobile ? "44px 20px 28px" : "56px 24px 32px",
      borderTop:"1px solid rgba(255,255,255,.06)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        {/* Top grid */}
        <div style={{
          display:"grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
          gap: isMobile ? 32 : 48, marginBottom:40,
        }}>
          {/* Brand — full width on mobile */}
          <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
              <div style={{ width:30, height:30, borderRadius:8,
                background:`linear-gradient(135deg, ${FM}, ${FOREST})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:F, fontWeight:700, fontSize:12, color:"#fff" }}>CT</div>
              <span style={{ fontFamily:F, fontWeight:700, fontSize:16, color:"#fff" }}>Church Tracker</span>
            </div>
            <p style={{ fontFamily:S, fontSize:13, color:"rgba(255,255,255,.32)",
              lineHeight:1.75, maxWidth:240, margin:0 }}>
              The church management platform built for pastors and ministry leaders who believe
              every member matters.
            </p>
          </div>

          {/* Link columns */}
          {[
            { h:"Product",      links:["Features","How It Works","Pricing"] },
            { h:"Church Tools", links:["Attendance","Member Management","Visitor Tracking","SMS Follow-Up"] },
            { h:"Support",      links:["Help Centre","Contact Us","Privacy Policy"] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontFamily:S, fontSize:10, fontWeight:700, letterSpacing:".1em",
                textTransform:"uppercase", color:"rgba(255,255,255,.35)", marginBottom:14 }}>
                {col.h}
              </div>
              {col.links.map(l => (
                <div key={l} style={{ fontFamily:S, fontSize:13,
                  color:"rgba(255,255,255,.32)", marginBottom:9, cursor:"pointer" }}>{l}</div>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:22,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          flexWrap:"wrap", gap:10 }}>
          <span style={{ fontFamily:S, fontSize:11.5, color:"rgba(255,255,255,.22)" }}>
            © 2025 Church Tracker. All rights reserved.
          </span>
          <span style={{ fontFamily:S, fontSize:11.5, color:"rgba(255,255,255,.18)" }}>
            Built with purpose · Designed for ministry
          </span>
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const goLogin  = () => navigate("/login");
  const goSignup = () => navigate("/signup");

  return (
    <div style={{ fontFamily:S }}>
      <Nav      onLogin={goLogin}   onSignup={goSignup} />
      <Hero     onSignup={goSignup} onLogin={goLogin} />
      <Stats />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks onSignup={goSignup} />
      {/* <Testimonials /> — uncomment when real church feedback is available */}
      <Story />
      <FAQ />
      <FinalCTA onSignup={goSignup} />
      <Footer   onLogin={goLogin}   onSignup={goSignup} />
    </div>
  );
}