// src/pages/messaging/CreditsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ChevL } from "../../components/ui/Icons";

const CREDITS_PER_NAIRA = 1;      // 1 credit = ₦1
const CREDITS_PER_MSG   = 5;      // 5 credits per SMS
const NAIRA_PER_MSG     = CREDITS_PER_MSG / CREDITS_PER_NAIRA;  // ₦5 per SMS (matches Termii ₦5/msg)

const BANK = {
  name:    "OPay",
  account: "8050340350",
  holder:  "Golden Iroka",
  ref:     "Bulk SMS",
};
const WHATSAPP = "08050340350";

const PRESETS = [100, 250, 500, 1000, 2000, 5000];

export default function CreditsPage({ showToast }) {
  const navigate = useNavigate();
  const { church } = useAuth();
  const credits = church?.sms_credits ?? 0;

  // Calculator mode: "credits" | "messages"
  const [mode,     setMode]    = useState("credits");
  const [amount,   setAmount]  = useState("");
  const [step,     setStep]    = useState("calc"); // "calc" | "pay"

  const creditsVal  = mode === "credits"  ? Number(amount) || 0 : (Number(amount) || 0) * CREDITS_PER_MSG;
  const messagesVal = mode === "messages" ? Number(amount) || 0 : Math.floor((Number(amount) || 0) / CREDITS_PER_MSG);
  const nairaVal    = creditsVal * CREDITS_PER_NAIRA;

  const handlePreset = (n) => {
    setMode("credits");
    setAmount(String(n));
  };

  const handleProceed = () => {
    if (creditsVal < 10) { showToast("Minimum purchase is 10 credits"); return; }
    setStep("pay");
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text).then(() => showToast("Copied! ✅")).catch(() => showToast(text));
  };

  // ── Payment details screen ─────────────────────────────────────────────────
  if (step === "pay") return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={() => setStep("calc")}><ChevL /> Back</button>
        <h1>Complete Payment</h1>
        <p>Transfer ₦{nairaVal.toLocaleString()} to receive {creditsVal} credits</p>
      </div>
      <div className="pc">

        {/* Order summary */}
        <div className="card" style={{ marginBottom: 20, background: "linear-gradient(135deg,var(--brand),var(--brand-mid))", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: .7, textTransform: "uppercase", letterSpacing: ".05em" }}>Your Order</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, marginTop: 4 }}>
            {creditsVal.toLocaleString()} credits
          </div>
          <div style={{ fontSize: 14, opacity: .8, marginTop: 4 }}>≈ {messagesVal.toLocaleString()} SMS messages</div>
          <div style={{ marginTop: 16, padding: "12px", background: "rgba(255,255,255,.15)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14 }}>Amount to pay</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700 }}>₦{nairaVal.toLocaleString()}</span>
          </div>
        </div>

        {/* Bank details */}
        <div className="stitle">Bank Transfer Details</div>
        <div className="stsec" style={{ marginBottom: 20 }}>
          {[
            ["Bank",           BANK.name],
            ["Account Number", BANK.account],
            ["Account Name",   BANK.holder],
            ["Description",    BANK.ref],
          ].map(([label, value]) => (
            <div key={label} className="strow" onClick={() => handleCopy(value)} style={{ cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--brand)", fontWeight: 600 }}>Copy</div>
            </div>
          ))}
        </div>

        {/* WhatsApp proof */}
        <div className="card" style={{ marginBottom: 20, background: "#f0fdf6", border: "1.5px solid #c8ebd8" }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>📲 After paying</div>
          <div style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.5 }}>
            Send your <strong>payment proof (screenshot)</strong> to WhatsApp:
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--brand)", margin: "12px 0" }}>
            {WHATSAPP}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>
            Include your church name: <strong>{church?.name || "your church"}</strong> and the number of credits you purchased.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => handleCopy(WHATSAPP)}>
              Copy Number
            </button>
            <a
              href={`https://wa.me/234${WHATSAPP.replace(/^0/, "")}?text=${encodeURIComponent(`Hi! I just paid ₦${nairaVal.toLocaleString()} for ${creditsVal} ChurchTrackr SMS credits.\nChurch: ${church?.name || ""}\nPlease credit my account. Thank you!`)}`}
              target="_blank" rel="noreferrer"
              className="btn bs"
              style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              💬 Open WhatsApp
            </a>
          </div>
        </div>

        <div style={{ background: "#fff8e6", border: "1.5px solid var(--accent)", borderRadius: 12, padding: 14, fontSize: 13, color: "#8a5a00" }}>
          ⏱ Credits are usually added within <strong>1–2 hours</strong> during business hours (Mon–Fri, 9am–6pm WAT).
        </div>
      </div>
    </div>
  );

  // ── Calculator screen ──────────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={() => navigate("/messaging")}><ChevL /> Back</button>
        <h1>Buy Credits</h1>
        <p>Current balance: <strong>{credits} credits</strong></p>
      </div>
      <div className="pc">

        {/* How it works */}
        <div className="card" style={{ marginBottom: 20, background: "var(--surface2)", boxShadow: "none" }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>How credits work</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, textAlign: "center" }}>
            {[
              { icon: "💳", top: "₦1", bot: "= 1 credit" },
              { icon: "💬", top: "5 credits", bot: "= 1 SMS"  },
              { icon: "📲", top: "₦5", bot: "per message" },
            ].map(s => (
              <div key={s.top} style={{ background: "var(--surface)", borderRadius: 10, padding: "10px 6px" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--brand)" }}>{s.top}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.bot}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick presets */}
        <div className="stitle" style={{ marginBottom: 10 }}>Quick amounts</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
          {PRESETS.map(n => (
            <div key={n} onClick={() => handlePreset(n)} style={{
              padding: "12px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center",
              background: creditsVal === n && mode === "credits" ? "var(--brand)" : "var(--surface)",
              color:      creditsVal === n && mode === "credits" ? "#fff" : "var(--text)",
              border: `1.5px solid ${creditsVal === n && mode === "credits" ? "var(--brand)" : "var(--border)"}`,
              transition: "all .12s",
            }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{n}</div>
              <div style={{ fontSize: 11, marginTop: 2, opacity: .7 }}>credits</div>
              <div style={{ fontSize: 11, marginTop: 1, fontWeight: 600, opacity: .8 }}>
                ₦{n.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Custom calculator */}
        <div className="stitle" style={{ marginBottom: 10 }}>Or calculate exactly</div>

        {/* Mode toggle */}
        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 11, padding: 4, marginBottom: 14 }}>
          {[
            { key: "credits",  label: "Enter credits"  },
            { key: "messages", label: "Enter messages" },
          ].map(m => (
            <button key={m.key} onClick={() => { setMode(m.key); setAmount(""); }}
              style={{
                flex: 1, padding: "9px 4px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                background: mode === m.key ? "var(--surface)" : "transparent",
                color:      mode === m.key ? "var(--brand)" : "var(--muted)",
                boxShadow:  mode === m.key ? "var(--sh)" : "none",
                transition: "all .15s",
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <div className="fg" style={{ marginBottom: 16 }}>
          <label className="fl">
            {mode === "credits" ? "How many credits?" : "How many messages do you want to send?"}
          </label>
          <input className="fi" type="number" min="1" placeholder={mode === "credits" ? "e.g. 500" : "e.g. 100"}
            value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        {/* Live conversion */}
        {(Number(amount) > 0) && (
          <div className="card" style={{ marginBottom: 20, border: "1.5px solid var(--brand-light)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Credits</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--brand)" }}>
                {creditsVal.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>SMS messages</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--brand-mid)" }}>
                ≈ {messagesVal.toLocaleString()}
              </span>
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Total to pay</span>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "var(--success)" }}>
                ₦{nairaVal.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <button className="btn bp blg" onClick={handleProceed}
          disabled={creditsVal < 10}
          style={{ opacity: creditsVal < 10 ? .5 : 1 }}>
          Proceed to Payment →
        </button>

        {creditsVal < 10 && Number(amount) > 0 && (
          <p style={{ fontSize: 12, color: "var(--danger)", textAlign: "center", marginTop: 8 }}>
            Minimum purchase is 10 credits (₦10)
          </p>
        )}
      </div>
    </div>
  );
}