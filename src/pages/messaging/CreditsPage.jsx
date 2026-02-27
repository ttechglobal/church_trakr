// src/pages/messaging/CreditsPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ChevL } from "../../components/ui/Icons";

const PACKAGES = [
  { credits: 100,  price: "₦1,500",  tag: null           },
  { credits: 500,  price: "₦6,500",  tag: "Popular"      },
  { credits: 1000, price: "₦11,000", tag: "Best Value"   },
  { credits: 5000, price: "₦45,000", tag: "Enterprise"   },
];

const TRANSACTIONS = [
  { id: 1, type: "purchase",  amount: 500,  date: "Feb 10, 2025", note: "Top-up — ₦6,500" },
  { id: 2, type: "spend",     amount: -8,   date: "Feb 16, 2025", note: "Group SMS · Youth Ministry" },
  { id: 3, type: "spend",     amount: -3,   date: "Feb 16, 2025", note: "Absentee SMS" },
  { id: 4, type: "purchase",  amount: 100,  date: "Jan 20, 2025", note: "Top-up — ₦1,500" },
  { id: 5, type: "spend",     amount: -12,  date: "Jan 15, 2025", note: "All Members broadcast" },
];

export default function CreditsPage({ showToast }) {
  const navigate = useNavigate();
  const { church } = useAuth();
  const credits = church?.sms_credits ?? 247;
  const creditPct = Math.min(100, Math.round((credits / 500) * 100));

  return (
    <div className="page">
      <div className="ph">
        <button className="btn bg" style={{ marginBottom: 14, padding: "8px 14px" }} onClick={() => navigate("/messaging")}>
          <ChevL /> Back
        </button>
        <h1>Credits & Billing</h1>
        <p>Manage your SMS credits</p>
      </div>
      <div className="pc">

        {/* ── Current balance ── */}
        <div className="card" style={{ marginBottom: 24, background: "linear-gradient(135deg,var(--brand),var(--brand-mid))", color: "#fff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, opacity: .7, textTransform: "uppercase", letterSpacing: ".05em" }}>Current Balance</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginTop: 6 }}>{credits}</div>
          <div style={{ fontSize: 14, opacity: .75, marginTop: 2 }}>SMS credits</div>
          <div className="credit-bar" style={{ marginTop: 14, background: "rgba(255,255,255,.2)" }}>
            <div className="credit-fill" style={{ width: `${creditPct}%`, background: "rgba(255,255,255,.65)" }} />
          </div>
          <div style={{ fontSize: 12, opacity: .65, marginTop: 6 }}>{credits} of 500 starting credits remaining</div>
        </div>

        {/* ── Buy credits ── */}
        <div className="stitle">Buy More Credits</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {PACKAGES.map(p => (
            <div
              key={p.credits}
              className="card"
              style={{ cursor: "pointer", position: "relative", padding: "18px 16px", transition: "transform .15s, box-shadow .15s" }}
              onClick={() => showToast("Payment integration coming soon!")}
            >
              {p.tag && (
                <div style={{ position: "absolute", top: -8, right: 12, background: "var(--accent)", color: "var(--brand)", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  {p.tag}
                </div>
              )}
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: "var(--brand)" }}>{p.credits}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>credits</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text)", marginTop: 8 }}>{p.price}</div>
              <button className="btn bp" style={{ width: "100%", marginTop: 12, padding: "8px", fontSize: 13 }}>
                Buy
              </button>
            </div>
          ))}
        </div>

        {/* ── Transaction history ── */}
        <div className="stitle">Transaction History</div>
        <div className="stsec">
          {TRANSACTIONS.map(t => (
            <div key={t.id} className="strow" style={{ cursor: "default" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{t.note}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{t.date}</div>
              </div>
              <span style={{
                fontWeight: 700, fontSize: 15,
                color: t.amount > 0 ? "var(--success)" : "var(--danger)",
              }}>
                {t.amount > 0 ? "+" : ""}{t.amount}
              </span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: 12 }}>
          Payment processing powered by Paystack · Coming soon
        </p>
      </div>
    </div>
  );
}
