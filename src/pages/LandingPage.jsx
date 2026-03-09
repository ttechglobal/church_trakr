// src/pages/LandingPage.jsx
import { useNavigate } from "react-router-dom";

// ── Inline styles as constants ────────────────────────────────────────────────
const F = "'Playfair Display', Georgia, serif";
const S = "'DM Sans', system-ui, sans-serif";
const FOREST   = "#1a3a2a";
const FOREST_M = "#2d5a42";
const GOLD     = "#c9a84c";
const GOLD_L   = "#e8d5a0";
const IVORY    = "#faf9f5";
const WARM     = "#f3f1eb";
const BORDER   = "#e7e4dc";
const MUTED    = "#78716c";
const TEXT     = "#1c1917";

// ── Tiny components ───────────────────────────────────────────────────────────
const Label = ({ children, light }) => (
  <div style={{ fontFamily:S, fontSize:11, fontWeight:700, letterSpacing:".12em",
    textTransform:"uppercase", color: light ? GOLD_L : GOLD, marginBottom:14 }}>
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
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:100,
      background:"rgba(250,249,245,.92)", backdropFilter:"blur(18px)",
      borderBottom:`1px solid ${BORDER}`,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 24px", height:64,
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ width:32, height:32, borderRadius:9,
          background:`linear-gradient(135deg, ${FOREST_M}, ${FOREST})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:F, fontWeight:700, fontSize:13, color:"#fff" }}>CT</div>
        <span style={{ fontFamily:F, fontWeight:700, fontSize:17, color:FOREST }}>
          Church Tracker
        </span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onLogin} style={{
          background:"none", border:`1.5px solid ${BORDER}`, borderRadius:10,
          padding:"9px 20px", fontFamily:S, fontWeight:600, fontSize:13,
          color:TEXT, cursor:"pointer" }}>Sign In</button>
        <button onClick={onSignup} style={{
          background:FOREST, border:"none", borderRadius:10,
          padding:"10px 22px", fontFamily:S, fontWeight:700, fontSize:13,
          color:"#fff", cursor:"pointer",
          boxShadow:`0 2px 12px rgba(26,58,42,.28)` }}>
          Get Started Free
        </button>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ onSignup, onLogin }) {
  return (
    <section style={{
      minHeight:"100vh", display:"flex", alignItems:"center",
      background:FOREST, position:"relative", overflow:"hidden",
      paddingTop:64,
    }}>
      {/* Orbs */}
      <div style={{ position:"absolute", top:-100, right:-120, width:600, height:600,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.13) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", bottom:-80, left:-60, width:400, height:400,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(61,122,88,.3) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", top:"40%", left:"55%", width:300, height:300,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(255,255,255,.025) 0%, transparent 65%)" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"80px 24px 80px",
        width:"100%", position:"relative", zIndex:2 }}>

        {/* Badge */}
        <div style={{
          display:"inline-flex", alignItems:"center", gap:8,
          background:"rgba(201,168,76,.12)", border:"1px solid rgba(201,168,76,.28)",
          borderRadius:99, padding:"7px 18px", marginBottom:30,
        }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:GOLD }} />
          <span style={{ fontFamily:S, fontSize:11, fontWeight:700,
            letterSpacing:".1em", textTransform:"uppercase", color:GOLD_L }}>
            Purpose-Built for Churches
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily:F, fontSize:"clamp(2.8rem, 6.5vw, 5rem)",
          fontWeight:900, lineHeight:1.1, letterSpacing:"-.025em",
          color:"#fff", maxWidth:820, marginBottom:24,
        }}>
          Your Church Deserves More Than&nbsp;
          <span style={{ color:GOLD_L, fontStyle:"italic" }}>a Spreadsheet.</span>
        </h1>

        {/* Sub */}
        <p style={{
          fontFamily:S, fontSize:"clamp(1rem, 2vw, 1.2rem)",
          color:"rgba(255,255,255,.62)", lineHeight:1.75,
          maxWidth:560, marginBottom:40,
        }}>
          Church Tracker helps pastors and administrators mark attendance, track members,
          follow up with absentees, and never lose a first-time visitor — all in one
          beautifully simple platform.
        </p>

        {/* CTAs */}
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:48 }}>
          <button onClick={onSignup} style={{
            background:GOLD, color:FOREST, border:"none", borderRadius:12,
            padding:"16px 34px", fontFamily:S, fontWeight:700, fontSize:16,
            cursor:"pointer", boxShadow:`0 4px 28px rgba(201,168,76,.45)`,
            letterSpacing:".01em",
          }}>
            Create Your Free Account →
          </button>
          <button onClick={onLogin} style={{
            background:"rgba(255,255,255,.1)", color:"#fff",
            border:"1.5px solid rgba(255,255,255,.22)", borderRadius:12,
            padding:"16px 34px", fontFamily:S, fontWeight:600, fontSize:16,
            cursor:"pointer", backdropFilter:"blur(8px)",
          }}>
            Sign In
          </button>
        </div>

        {/* Trust strip */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {["No credit card required", "Set up in 5 minutes", "Works on any device"].map((t, i) => (
            <span key={t} style={{ display:"flex", alignItems:"center", gap:8 }}>
              {i > 0 && <span style={{ width:3, height:3, borderRadius:"50%",
                background:"rgba(255,255,255,.2)", display:"inline-block" }} />}
              <span style={{ fontFamily:S, fontSize:12.5, color:"rgba(255,255,255,.4)",
                fontWeight:500 }}>{t}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function Stats() {
  const items = [
    { num:"500", suffix:"+",  l:"Churches Onboarded" },
    { num:"98",  suffix:"%",  l:"Attendance Accuracy" },
    { num:"3",   suffix:"×",  l:"Faster Follow-Up" },
    { num:"10k", suffix:"+",  l:"Members Tracked" },
  ];
  return (
    <div style={{ background:"#fff", borderBottom:`1px solid ${BORDER}` }}>
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 24px",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)" }}>
        {items.map((item, i) => (
          <div key={item.num} style={{
            padding:"36px 24px", textAlign:"center",
            borderRight: i < 3 ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{ fontFamily:F, fontWeight:900, fontSize:"2.4rem",
              color:FOREST, lineHeight:1 }}>
              {item.num}<span style={{ color:GOLD }}>{item.suffix}</span>
            </div>
            <div style={{ fontFamily:S, fontSize:13, color:MUTED,
              marginTop:7, fontWeight:500 }}>{item.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Problem ───────────────────────────────────────────────────────────────────
function Problem() {
  const cards = [
    { icon:"📋", t:"Chaotic Attendance Records", d:"Paper registers get lost. Spreadsheets become inconsistent. After a few weeks, nobody truly knows who's been showing up." },
    { icon:"👤", t:"First-Time Visitors Forgotten", d:"Someone walks through your doors. Without a system, they leave and are never followed up with — and quietly never return." },
    { icon:"😔", t:"Absentees Go Unnoticed", d:"A member misses three Sundays. No one notices. No one reaches out. They drift away from the congregation in silence." },
    { icon:"⏰", t:"Administrative Overload", d:"Pastors spend hours compiling registers, identifying absentees, writing messages — tasks that should take under ten minutes." },
    { icon:"📊", t:"No Insight Into Growth", d:"Without data you can't tell if your congregation is growing or declining. Decisions become guesswork instead of vision." },
    { icon:"📱", t:"Disconnected Communication", d:"WhatsApp broadcasts, manual texts, phone calls — follow-up is scattered, inconsistent, and exhausting for your team." },
  ];
  return (
    <section style={{ background:WARM, padding:"100px 24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", maxWidth:600, margin:"0 auto 64px" }}>
          <Label>The Challenge</Label>
          <h2 style={{ fontFamily:F, fontSize:"clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:16 }}>
            Does This Sound Familiar?
          </h2>
          <p style={{ fontFamily:S, color:MUTED, lineHeight:1.75, fontSize:15 }}>
            Running a church is a calling. But the administration that comes with it
            often works against you.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:18 }}>
          {cards.map(c => (
            <div key={c.t} style={{
              background:"#fff", borderRadius:20, padding:"30px 26px",
              border:`1px solid ${BORDER}`,
              boxShadow:"0 1px 8px rgba(0,0,0,.04)",
            }}>
              <div style={{ fontSize:"1.8rem", marginBottom:14 }}>{c.icon}</div>
              <div style={{ fontFamily:F, fontWeight:600, fontSize:"1.05rem",
                color:TEXT, marginBottom:10 }}>{c.t}</div>
              <p style={{ fontFamily:S, fontSize:13.5, lineHeight:1.7, color:MUTED }}>{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Solution ──────────────────────────────────────────────────────────────────
function Solution() {
  const rows = [
    { name:"Sister Grace Okafor",     badge:"Present", bc:"rgba(110,231,183,.2)", tc:"#6ee7b7" },
    { name:"Brother Emmanuel Nwosu",  badge:"Absent",  bc:"rgba(252,165,165,.2)", tc:"#fca5a5" },
    { name:"Mrs. Blessing Ihejirika", badge:"First Timer", bc:"rgba(201,168,76,.22)", tc:GOLD_L },
    { name:"Deacon Samuel Kalu",      badge:"Present", bc:"rgba(110,231,183,.2)", tc:"#6ee7b7" },
    { name:"Pastor James Adebayo",    badge:"Present", bc:"rgba(110,231,183,.2)", tc:"#6ee7b7" },
  ];
  return (
    <section style={{ background:"#fff", padding:"100px 24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>

        {/* Live mock */}
        <div style={{
          background:`linear-gradient(150deg, ${FOREST} 0%, ${FOREST_M} 100%)`,
          borderRadius:24, padding:"36px 28px",
          boxShadow:`0 24px 80px rgba(26,58,42,.22)`,
          position:"relative", overflow:"hidden",
        }}>
          <div style={{ position:"absolute", top:-80, right:-80, width:280, height:280,
            borderRadius:"50%", pointerEvents:"none",
            background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 65%)" }} />

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18,
            background:"rgba(255,255,255,.08)", borderRadius:12, padding:"12px 16px",
            border:"1px solid rgba(255,255,255,.08)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="rgba(255,255,255,.55)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="rgba(255,255,255,.55)" strokeWidth="2"/>
            </svg>
            <span style={{ fontFamily:S, fontSize:13, color:"rgba(255,255,255,.65)",
              fontWeight:600 }}>Sunday Service · 9 Mar 2025</span>
          </div>

          {rows.map(r => (
            <div key={r.name} style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              background:"rgba(255,255,255,.07)", borderRadius:10, padding:"13px 16px",
              marginBottom:8, border:"1px solid rgba(255,255,255,.05)",
            }}>
              <span style={{ fontFamily:S, fontSize:13.5, color:"rgba(255,255,255,.82)",
                fontWeight:500 }}>{r.name}</span>
              <span style={{ background:r.bc, color:r.tc, fontSize:11, fontWeight:700,
                padding:"3px 11px", borderRadius:99, fontFamily:S, letterSpacing:".04em",
                textTransform:"uppercase" }}>{r.badge}</span>
            </div>
          ))}

          <div style={{ display:"flex", gap:8, marginTop:20 }}>
            {[["22","Present","#6ee7b7","#052e16"],["3","Absent","#fca5a5","#450a0a"],["2","New",GOLD_L,"rgba(201,168,76,.15)"]].map(([n,l,col,bg]) => (
              <div key={l} style={{ flex:1, background:bg, borderRadius:12, padding:"12px 8px",
                textAlign:"center", border:"1px solid rgba(255,255,255,.07)" }}>
                <div style={{ fontFamily:F, fontWeight:700, fontSize:"1.6rem",
                  color:col, lineHeight:1 }}>{n}</div>
                <div style={{ fontFamily:S, fontSize:10, color:col, marginTop:4,
                  opacity:.75, letterSpacing:".05em", textTransform:"uppercase" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Copy */}
        <div>
          <Label>The Solution</Label>
          <h2 style={{ fontFamily:F, fontSize:"clamp(1.8rem,3.5vw,2.7rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:20 }}>
            One Platform.<br/>Complete Clarity.
          </h2>
          <p style={{ fontFamily:S, color:MUTED, lineHeight:1.8, fontSize:15, marginBottom:28 }}>
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
  const feats = [
    { icon:"📅", t:"Smart Attendance Tracking", d:"Mark attendance for any group in seconds. Scroll your list, tap to mark absent — everyone else is automatically present. Fast, intuitive, built for real Sunday mornings." },
    { icon:"🙌", t:"First-Timer Management", d:"Log new visitors during or after service. Capture their details and trigger an immediate personalised welcome. Turn a one-time visit into a lasting connection." },
    { icon:"📡", t:"Absentee Detection", d:"Church Tracker automatically identifies members absent for consecutive Sundays. Send bulk SMS follow-up in one tap — no member should feel forgotten." },
    { icon:"💬", t:"SMS Messaging", d:"Reach your members where they already are — on their phones. Target absentees, first-timers, or your entire congregation. One message, sent to many." },
    { icon:"📈", t:"Growth Insights", d:"See attendance trends over time. Understand which groups are growing and where follow-up is needed. Data-informed pastoral care, made simple." },
    { icon:"👥", t:"Member Records", d:"Every member, every group, every interaction in one secure searchable place. Add members, organise into ministry groups, always find what you need." },
  ];
  return (
    <section style={{ background:WARM, padding:"100px 24px" }} id="features">
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", maxWidth:580, margin:"0 auto 64px" }}>
          <Label>Features</Label>
          <h2 style={{ fontFamily:F, fontSize:"clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:14 }}>
            Everything Your Church Needs
          </h2>
          <p style={{ fontFamily:S, color:MUTED, lineHeight:1.75, fontSize:15 }}>
            Purpose-built tools for church leaders who want to spend less time on admin
            and more time on ministry.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {feats.map(f => (
            <div key={f.t} style={{
              background:"#fff", borderRadius:20, padding:"32px 26px",
              border:`1px solid ${BORDER}`, boxShadow:"0 1px 6px rgba(0,0,0,.04)",
              position:"relative", overflow:"hidden",
            }}>
              <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
                background:`linear-gradient(90deg, ${FOREST}, ${GOLD})`,
                opacity:0, transition:"opacity .3s" }} />
              <div style={{ width:50, height:50, borderRadius:14,
                background:`linear-gradient(135deg, ${FOREST_M}, ${FOREST})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.4rem", marginBottom:20,
                boxShadow:`0 4px 14px rgba(26,58,42,.22)` }}>{f.icon}</div>
              <div style={{ fontFamily:F, fontWeight:600, fontSize:"1.05rem",
                color:TEXT, marginBottom:10 }}>{f.t}</div>
              <p style={{ fontFamily:S, fontSize:13.5, lineHeight:1.7, color:MUTED }}>{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────────────
function HowItWorks({ onSignup }) {
  const steps = [
    { n:"1", t:"Create Your Account", d:"Sign up in under 2 minutes. Enter your church name and details. No credit card required." },
    { n:"2", t:"Add Members & Groups", d:"Add your members and organise them into ministry groups — youth, choir, cells, departments." },
    { n:"3", t:"Mark Attendance", d:"Open the app before or after service. Select your group, scroll through members, tap once to mark absent." },
    { n:"4", t:"Follow Up & Grow", d:"Send SMS to absentees. Welcome first-timers. Review weekly insights. Let Church Tracker handle the admin." },
  ];
  return (
    <section style={{ background:FOREST, padding:"100px 24px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:-200, right:-150, width:700, height:700,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.1) 0%, transparent 65%)" }} />
      <div style={{ position:"absolute", bottom:-150, left:-100, width:500, height:500,
        borderRadius:"50%", pointerEvents:"none",
        background:"radial-gradient(circle, rgba(61,122,88,.25) 0%, transparent 65%)" }} />

      <div style={{ maxWidth:1100, margin:"0 auto", position:"relative", zIndex:2 }}>
        <div style={{ textAlign:"center", maxWidth:560, margin:"0 auto 70px" }}>
          <Label light>How It Works</Label>
          <h2 style={{ fontFamily:F, fontSize:"clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:"#fff", letterSpacing:"-.02em", marginBottom:16 }}>
            Up and Running in Minutes
          </h2>
          <p style={{ fontFamily:S, color:"rgba(255,255,255,.5)", lineHeight:1.75, fontSize:15 }}>
            No complicated setup. No technical knowledge required.
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ textAlign:"center", padding:"0 8px", position:"relative" }}>
              {i < 3 && (
                <div style={{ position:"absolute", top:38, left:"60%", right:"-40%", height:1,
                  background:"linear-gradient(90deg, rgba(201,168,76,.3), transparent)" }} />
              )}
              <div style={{ width:76, height:76, borderRadius:"50%", margin:"0 auto 24px",
                background:"rgba(201,168,76,.1)", border:"1.5px solid rgba(201,168,76,.28)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:F, fontSize:"2rem", fontWeight:700, color:GOLD_L,
                position:"relative", zIndex:1 }}>{s.n}</div>
              <div style={{ fontFamily:F, fontSize:"1.05rem", color:"#fff",
                fontWeight:600, marginBottom:10 }}>{s.t}</div>
              <p style={{ fontFamily:S, fontSize:13, color:"rgba(255,255,255,.48)",
                lineHeight:1.7 }}>{s.d}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign:"center", marginTop:60 }}>
          <button onClick={onSignup} style={{
            background:GOLD, color:FOREST, border:"none", borderRadius:12,
            padding:"16px 40px", fontFamily:S, fontWeight:700, fontSize:15,
            cursor:"pointer", boxShadow:`0 4px 28px rgba(201,168,76,.4)`,
          }}>Start Free Today →</button>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function Testimonials() {
  const tests = [
    { q:"Before Church Tracker, our attendance register was a notebook that went missing every other Sunday. Now our admin marks attendance before the closing prayer is finished. It changed everything.", name:"Pastor Philip Eze", role:"Senior Pastor · Grace Assembly, Lagos", init:"P" },
    { q:"We had a first-timer in March who almost slipped through the cracks. Because of Church Tracker, we followed up with her the same week. She became a member a month later. That's the power of this platform.", name:"Admin Sister Adaeze Nkemdirim", role:"Church Admin · Fountain of Life, Abuja", init:"A" },
    { q:"The SMS follow-up for absentees alone is worth everything. We sent messages to 12 members who had been absent for three weeks. Eight of them came back the following Sunday.", name:"Deacon Chukwuemeka Obi", role:"Ministry Coordinator · Light Chapel, Port Harcourt", init:"D" },
  ];
  return (
    <section style={{ background:"#fff", padding:"100px 24px" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", maxWidth:520, margin:"0 auto 60px" }}>
          <Label>Trusted by Churches</Label>
          <h2 style={{ fontFamily:F, fontSize:"clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em" }}>
            What Church Leaders Say
          </h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
          {tests.map(t => (
            <div key={t.name} style={{
              background:WARM, borderRadius:20, padding:"30px 26px",
              border:`1px solid ${BORDER}`,
            }}>
              <div style={{ color:GOLD, fontSize:"1.1rem", letterSpacing:3, marginBottom:16 }}>★★★★★</div>
              <p style={{ fontFamily:F, fontStyle:"italic", fontSize:"1rem",
                color:TEXT, lineHeight:1.75, marginBottom:24 }}>"{t.q}"</p>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0,
                  background:`linear-gradient(135deg, ${FOREST_M}, ${FOREST})`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontFamily:F, fontWeight:700, color:"#fff", fontSize:"1rem" }}>{t.init}</div>
                <div>
                  <div style={{ fontFamily:S, fontWeight:700, fontSize:13.5, color:TEXT }}>{t.name}</div>
                  <div style={{ fontFamily:S, fontSize:12, color:MUTED, marginTop:2 }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Story ─────────────────────────────────────────────────────────────────────
function Story() {
  return (
    <section style={{ background:WARM, padding:"100px 24px" }}>
      <div style={{ maxWidth:740, margin:"0 auto", textAlign:"center" }}>
        <Label>Our Why</Label>
        <h2 style={{ fontFamily:F, fontSize:"clamp(1.9rem,4vw,2.8rem)",
          fontWeight:700, color:TEXT, letterSpacing:"-.02em", marginBottom:28 }}>
          Built From the Heart of a Church
        </h2>
        <p style={{ fontFamily:S, color:MUTED, lineHeight:1.85, fontSize:15, marginBottom:18 }}>
          Church Tracker was not built in a corporate boardroom. It was born out of a real frustration
          felt by church workers who watched members quietly drift away — not because the church stopped
          caring, but because there was no system in place to notice in time.
        </p>
        <p style={{ fontFamily:S, color:MUTED, lineHeight:1.85, fontSize:15, marginBottom:18 }}>
          We watched dedicated administrators spend their Sunday afternoons hunched over spreadsheets,
          manually counting rows and composing follow-up messages one by one. We watched first-time
          visitors leave without a single follow-up call. We watched pastors make decisions without
          the data to back them up.
        </p>
        <p style={{ fontFamily:S, color:MUTED, lineHeight:1.85, fontSize:15, marginBottom:40 }}>
          So we built the tool we wished existed. A platform that treats church administration
          not as a chore but as an act of care — because every name on that register is a real
          person who chose to walk through your doors.
        </p>
        <div style={{
          background:"#fff", borderRadius:20, padding:"36px 40px",
          border:`1px solid ${BORDER}`, position:"relative",
          boxShadow:"0 2px 16px rgba(0,0,0,.05)", textAlign:"left",
        }}>
          <div style={{ position:"absolute", top:14, left:28,
            fontFamily:F, fontSize:"5rem", fontWeight:900,
            color:GOLD, opacity:.2, lineHeight:1 }}>"</div>
          <p style={{ fontFamily:F, fontStyle:"italic", fontSize:"1.2rem",
            color:TEXT, lineHeight:1.65, paddingLeft:8 }}>
            Every member who shows up deserves to be seen. And every member who doesn't show up
            deserves to be missed. Church Tracker exists to make both of those things possible.
          </p>
          <div style={{ marginTop:20, fontFamily:S, fontSize:13,
            color:MUTED, fontWeight:600 }}>— The Church Tracker Team</div>
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    { q:"Is Church Tracker free to use?", a:"Yes — get started completely free. Create your church account, add members, and mark attendance with no upfront cost. SMS messaging credits are available as an affordable add-on when you're ready." },
    { q:"Do my members need to download an app?", a:"No. Church Tracker is used by your administrators and leaders only. Your congregation doesn't need to install anything or create accounts." },
    { q:"How does the SMS follow-up feature work?", a:"After marking attendance, Church Tracker identifies members absent for consecutive Sundays. Send personalised SMS messages to those members in a single tap — choosing your message and sending to the whole list at once." },
    { q:"Is our member data safe and private?", a:"Absolutely. Your data belongs to your church only. We use industry-standard encryption and secure cloud infrastructure. We will never sell or share your members' information." },
    { q:"Can I use it for multiple groups or services?", a:"Yes. Church Tracker supports multiple groups — track attendance separately for different services, departments, cell groups, youth ministry, choir, and more." },
    { q:"How long does it take to set up?", a:"Most churches are fully set up in under 5 minutes. Create your account, add your first group, add members, and you're ready to mark attendance at your very next service." },
    { q:"What if my church has very few members?", a:"Church Tracker is just as valuable for a church of 30 as one of 3,000. In small churches, every member matters deeply — knowing exactly who is present or absent makes all the difference." },
  ];

  const [open, setOpen] = React.useState(null);

  return (
    <section style={{ background:"#fff", padding:"100px 24px" }}>
      <div style={{ maxWidth:760, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <Label>FAQ</Label>
          <h2 style={{ fontFamily:F, fontSize:"clamp(1.9rem,4vw,2.8rem)",
            fontWeight:700, color:TEXT, letterSpacing:"-.02em" }}>
            Questions Pastors Ask
          </h2>
        </div>
        {faqs.map((f, i) => (
          <div key={f.q} style={{
            background:WARM, borderRadius:16, marginBottom:10,
            border:`1px solid ${BORDER}`, overflow:"hidden",
          }}>
            <div onClick={() => setOpen(open === i ? null : i)} style={{
              padding:"20px 24px", cursor:"pointer",
              display:"flex", justifyContent:"space-between", alignItems:"center", gap:16,
              fontFamily:S, fontWeight:600, fontSize:15, color:TEXT, userSelect:"none",
            }}>
              {f.q}
              <div style={{ width:28, height:28, borderRadius:"50%",
                background: open === i ? FOREST : "#fff",
                border:`1px solid ${open === i ? FOREST : BORDER}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0, transition:"all .2s",
                transform: open === i ? "rotate(180deg)" : "none",
              }}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke={open === i ? "#fff" : MUTED}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {open === i && (
              <div style={{ padding:"4px 24px 20px",
                fontFamily:S, fontSize:14, color:MUTED, lineHeight:1.8 }}>
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
  return (
    <section style={{ background:FOREST, padding:"100px 24px",
      position:"relative", overflow:"hidden", textAlign:"center" }}>
      <div style={{ position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)", width:700, height:700, borderRadius:"50%",
        pointerEvents:"none",
        background:"radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 60%)" }} />

      <div style={{ maxWidth:700, margin:"0 auto", position:"relative", zIndex:2 }}>
        <Label light>Get Started Today</Label>
        <h2 style={{ fontFamily:F, fontSize:"clamp(2rem,5vw,3.5rem)",
          fontWeight:900, color:"#fff", letterSpacing:"-.025em", marginBottom:20 }}>
          Your Church Is Ready for This.
        </h2>
        <p style={{ fontFamily:S, color:"rgba(255,255,255,.58)",
          lineHeight:1.8, fontSize:15, maxWidth:500, margin:"0 auto 44px" }}>
          Join hundreds of churches already using Church Tracker to manage attendance,
          follow up with members, and grow with confidence. It takes less than 5 minutes.
        </p>

        <div style={{ display:"flex", gap:14, justifyContent:"center",
          flexWrap:"wrap", marginBottom:20 }}>
          <button onClick={onSignup} style={{
            background:GOLD, color:FOREST, border:"none", borderRadius:12,
            padding:"17px 40px", fontFamily:S, fontWeight:700, fontSize:16,
            cursor:"pointer", boxShadow:`0 4px 28px rgba(201,168,76,.42)`,
          }}>Create Your Church Account →</button>
        </div>
        <p style={{ fontFamily:S, fontSize:12.5, color:"rgba(255,255,255,.28)" }}>
          Free to start · No credit card required · Works on any device
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer({ onLogin, onSignup }) {
  return (
    <footer style={{ background:"#111a14", padding:"56px 24px 32px",
      borderTop:"1px solid rgba(255,255,255,.06)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto",
        display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:48 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <div style={{ width:32, height:32, borderRadius:9,
              background:`linear-gradient(135deg, ${FOREST_M}, ${FOREST})`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:F, fontWeight:700, fontSize:13, color:"#fff" }}>CT</div>
            <span style={{ fontFamily:F, fontWeight:700, fontSize:17, color:"#fff" }}>Church Tracker</span>
          </div>
          <p style={{ fontFamily:S, fontSize:13, color:"rgba(255,255,255,.35)",
            lineHeight:1.75, maxWidth:240 }}>
            The church management platform built for pastors, administrators, and ministry
            leaders who believe every member matters.
          </p>
        </div>
        {[
          { h:"Product", links:["Features","How It Works","Pricing"] },
          { h:"Church Tools", links:["Attendance Tracking","Member Management","Visitor Tracking","SMS Follow-Up"] },
          { h:"Support", links:["Help Centre","Contact Us","Privacy Policy"] },
        ].map(col => (
          <div key={col.h}>
            <div style={{ fontFamily:S, fontSize:11, fontWeight:700, letterSpacing:".1em",
              textTransform:"uppercase", color:"rgba(255,255,255,.4)", marginBottom:18 }}>
              {col.h}
            </div>
            {col.links.map(l => (
              <div key={l} style={{ fontFamily:S, fontSize:13.5,
                color:"rgba(255,255,255,.35)", marginBottom:10, cursor:"pointer" }}>{l}</div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:24,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        flexWrap:"wrap", gap:12 }}>
        <span style={{ fontFamily:S, fontSize:12, color:"rgba(255,255,255,.25)" }}>
          © 2025 Church Tracker. All rights reserved.
        </span>
        <span style={{ fontFamily:S, fontSize:12, color:"rgba(255,255,255,.2)" }}>
          Built with purpose · Designed for ministry
        </span>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
import React from "react";

export default function LandingPage() {
  const navigate = useNavigate();
  const goLogin  = () => navigate("/login");
  const goSignup = () => navigate("/signup");

  return (
    <div style={{ fontFamily:S }}>
      <Nav    onLogin={goLogin}  onSignup={goSignup} />
      <Hero   onSignup={goSignup} onLogin={goLogin} />
      <Stats />
      <Problem />
      <Solution />
      <Features />
      <HowItWorks onSignup={goSignup} />
      <Testimonials />
      <Story />
      <FAQ />
      <FinalCTA onSignup={goSignup} />
      <Footer onLogin={goLogin} onSignup={goSignup} />
    </div>
  );
}