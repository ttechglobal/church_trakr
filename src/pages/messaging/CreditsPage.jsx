// src/pages/messaging/CreditsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ChevL } from "../../components/ui/Icons";

// ── Pricing ──────────────────────────────────────────────────────────────────
const CREDITS_PER_MSG  = 10;           // 10 credits per SMS
const NAIRA_PER_CREDIT = 1.2;         // ₦1.20 per credit

const PACKAGES = [
  { credits: 100,  msgs: 10,   naira: 120,  label: "Starter",  popular: false },
  { credits: 500,  msgs: 50,   naira: 600,  label: "Basic",    popular: false },
  { credits: 1000, msgs: 100,  naira: 1200, label: "Standard", popular: true  },
  { credits: 2000, msgs: 200,  naira: 2400, label: "Growth",   popular: false },
  { credits: 5000, msgs: 500,  naira: 6000, label: "Church",   popular: false },
];

const BANK = {
  name:    "OPay",
  account: "8050340350",
  holder:  "Golden Iroka",
  ref:     "Bulk SMS",
};
const WHATSAPP = "08050340350";

export default function CreditsPage({ showToast }) {
  const navigate = useNavigate();
  const { church } = useAuth();
  const currentCredits = church?.sms_credits ?? 0;

  const [msgs,      setMsgs]   = useState("");   // user enters number of messages
  const [selected,  setSelected] = useState(null); // selected package
  const [step,      setStep]   = useState("calc");  // "calc" | "pay"

  // Derived from messages input
  const msgCount    = Number(msgs) || 0;
  const creditCount = msgCount * CREDITS_PER_MSG;
  const nairaTotal  = Math.ceil(creditCount * NAIRA_PER_CREDIT);

  // What they're actually buying (package or custom)
  const buying = selected
    ? selected
    : msgCount > 0
    ? { credits: creditCount, msgs: msgCount, naira: nairaTotal }
    : null;

  const handleProceed = () => {
    if (!buying || buying.credits < 10) { showToast("Enter how many messages you want to send"); return; }
    setStep("pay");
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text).then(() => showToast("Copied! ✅")).catch(() => showToast(text));
  };

  // ── Payment screen ────────────────────────────────────────────────────────
  if (step === "pay" && buying) return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14 }} onClick={() => setStep("calc")}><ChevL /> Back</button>
        <h1>Complete Payment</h1>
        <p>Transfer to receive your credits instantly</p>
      </div>
      <div className="pc">

        {/* Order summary */}
        <div style={{
          background: "linear-gradient(135deg, var(--brand) 0%, var(--brand-mid) 100%)",
          borderRadius: 20, padding: "22px 20px", marginBottom: 24, color: "#fff",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", right: -20, top: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .7, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Your Order</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 4 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 44, fontWeight: 700, lineHeight: 1 }}>{buying.msgs.toLocaleString()}</div>
            <div style={{ opacity: .8, paddingBottom: 6 }}>messages</div>
          </div>
          <div style={{ fontSize: 14, opacity: .75, marginBottom: 20 }}>{buying.credits.toLocaleString()} credits</div>

          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13 }}>Amount to transfer</span>
            <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700 }}>
              ₦{buying.naira.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bank details */}
        <div className="stitle">Bank Transfer Details</div>
        <div className="stsec" style={{ marginBottom: 20 }}>
          {[["Bank", BANK.name], ["Account Number", BANK.account], ["Account Name", BANK.holder], ["Description / Narration", BANK.ref]].map(([label, value]) => (
            <div key={label} className="strow" onClick={() => handleCopy(value)} style={{ cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{value}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--brand)", fontWeight: 700 }}>Copy</div>
            </div>
          ))}
        </div>

        {/* WhatsApp */}
        <div style={{ background: "#f0fdf6", border: "1.5px solid #a7f3d0", borderRadius: 16, padding: "18px 16px", marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>📲 After paying</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
            Send your <strong>payment screenshot</strong> to WhatsApp so we can credit your account:
          </div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "var(--brand)", marginBottom: 16 }}>{WHATSAPP}</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
            Please include: <strong>{church?.name || "your church name"}</strong> + amount paid
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn bg" style={{ flex: 1 }} onClick={() => handleCopy(WHATSAPP)}>Copy Number</button>
            <a
              href={`https://wa.me/234${WHATSAPP.replace(/^0/, "")}?text=${encodeURIComponent(
                `Hi! I just paid ₦${buying.naira.toLocaleString()} for ${buying.credits} ChurchTrakr SMS credits (${buying.msgs} messages).\nChurch: ${church?.name || ""}\nPlease credit my account. Thank you!`
              )}`}
              target="_blank" rel="noreferrer"
              className="btn bs"
              style={{ flex: 1, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              💬 Open WhatsApp
            </a>
          </div>
        </div>

        <div style={{ background: "#fff8e6", border: "1.5px solid var(--accent)", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#8a5a00", lineHeight: 1.6 }}>
          ⏱ Credits are added within <strong>1–2 hours</strong>, Mon–Fri, 9am–6pm WAT.
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
        <p>Current balance: <strong>{currentCredits.toLocaleString()} credits</strong></p>
      </div>

      <div className="pc">
        {/* ── Current balance card ── */}
        <div style={{ background: "var(--surface2)", borderRadius: 16, padding: "16px 18px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Current Balance</div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 700, color: "var(--brand)", marginTop: 2 }}>{currentCredits.toLocaleString()}</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>≈ {Math.floor(currentCredits / CREDITS_PER_MSG)} messages left</div>
          </div>
          <div style={{ fontSize: 40 }}>💬</div>
        </div>

        {/* ── Packages ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
          Choose a Package
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {PACKAGES.map(pkg => {
            const isSel = selected?.credits === pkg.credits;
            return (
              <div key={pkg.credits}
                onClick={() => { setSelected(isSel ? null : pkg); setMsgs(""); }}
                style={{
                  borderRadius: 16, padding: "16px", cursor: "pointer",
                  border: `2px solid ${isSel ? "var(--brand)" : pkg.popular ? "var(--brand)" : "var(--border)"}`,
                  background: isSel ? "var(--brand)" : "var(--surface)",
                  color: isSel ? "#fff" : "var(--text)",
                  transition: "all .12s",
                  position: "relative",
                }}>
                {pkg.popular && !isSel && (
                  <div style={{ position: "absolute", top: -1, right: 14, background: "var(--brand)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "0 0 8px 8px", letterSpacing: ".04em" }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{pkg.label}</div>
                    <div style={{ fontSize: 13, opacity: isSel ? .85 : undefined, color: isSel ? undefined : "var(--muted)", marginTop: 2 }}>
                      {pkg.msgs} messages · {pkg.credits.toLocaleString()} credits
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700 }}>₦{pkg.naira.toLocaleString()}</div>
                    <div style={{ fontSize: 11, opacity: .7 }}>₦{NAIRA_PER_CREDIT}/credit</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Custom calculator ── */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
          Or enter how many messages you need
        </div>
        <div style={{ background: "var(--surface)", borderRadius: 16, padding: "18px", border: "1.5px solid var(--border)", marginBottom: 20 }}>
          <div className="fg" style={{ marginBottom: 0 }}>
            <label className="fl">Number of messages</label>
            <input className="fi" type="number" min="1" placeholder="e.g. 150"
              value={msgs}
              onChange={e => { setMsgs(e.target.value); setSelected(null); }}
              style={{ fontSize: 20, fontWeight: 700, textAlign: "center" }} />
          </div>
          {msgCount > 0 && (
            <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>CREDITS NEEDED</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--brand)" }}>{creditCount.toLocaleString()}</div>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>TOTAL COST</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "var(--success)" }}>₦{nairaTotal.toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Summary + proceed */}
        {buying && (
          <div style={{ background: "var(--surface2)", borderRadius: 14, padding: "14px 16px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>You're buying</div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{buying.msgs.toLocaleString()} messages · {buying.credits.toLocaleString()} credits</div>
            </div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "var(--brand)" }}>₦{buying.naira.toLocaleString()}</div>
          </div>
        )}

        <button className="btn bp blg" onClick={handleProceed}
          disabled={!buying}
          style={{ opacity: buying ? 1 : .4 }}>
          Proceed to Payment →
        </button>

        {/* Pricing note */}
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
          ₦1.20 per credit · 10 credits per SMS · No expiry
        </p>
      </div>
    </div>
  );
}