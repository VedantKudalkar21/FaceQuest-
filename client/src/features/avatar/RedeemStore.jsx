
import { useEffect, useState } from "react";
import "./RedeemStore.css";

const COUPONS = [
  {
    id: "welcome10",
    title: "Explorer Discount",
    description: "A demo 10% discount coupon.",
    benefit: "10% OFF",
    cost: 100,
    code: "FQ-EXPLORER10",
    icon: "🎟️",
  },
  {
    id: "shipping",
    title: "Free Shipping Pass",
    description: "A demo free-shipping coupon.",
    benefit: "FREE SHIPPING",
    cost: 150,
    code: "FQ-FREESHIP",
    icon: "📦",
  },
  {
    id: "special20",
    title: "Legendary Deal",
    description: "A demo 20% discount coupon.",
    benefit: "20% OFF",
    cost: 250,
    code: "FQ-LEGEND20",
    icon: "🌟",
  },
  {
    id: "mystery",
    title: "Mystery Reward",
    description: "A bonus coupon for your next adventure.",
    benefit: "BONUS DEAL",
    cost: 200,
    code: "FQ-MYSTERY",
    icon: "🎁",
  },
];

export default function RedeemStore({ playerXP = 0, onXPChange, onBack }) {
  const [xp, setXP] = useState(playerXP);
  const [ownedCoupons, setOwnedCoupons] = useState([]);
  const [tab, setTab] = useState("store");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setXP(playerXP);
  }, [playerXP]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("facequest-owned-coupons") || "[]"
      );
      setOwnedCoupons(Array.isArray(saved) ? saved : []);
    } catch {
      setOwnedCoupons([]);
    }
  }, []);

  function buyCoupon(coupon) {
    setNotice("");
    setError("");

    if (ownedCoupons.some((item) => item.id === coupon.id)) {
      setError("You already own this demo coupon.");
      return;
    }

    if (xp < coupon.cost) {
      setError(`You need ${coupon.cost - xp} more XP to buy this coupon.`);
      return;
    }

    const nextXP = xp - coupon.cost;
    const purchased = {
      ...coupon,
      purchasedAt: new Date().toISOString(),
    };
    const nextCoupons = [...ownedCoupons, purchased];

    setXP(nextXP);
    setOwnedCoupons(nextCoupons);
    onXPChange?.(nextXP);

    localStorage.setItem("facequest-owned-coupons", JSON.stringify(nextCoupons));
    setNotice(`${coupon.title} purchased! Find its code in My Coupons.`);
    setTab("owned");
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`Copied coupon code: ${code}`);
      setError("");
    } catch {
      setNotice(`Your coupon code is: ${code}`);
      setError("Automatic copy was unavailable. Select and copy the code.");
    }
  }

  return (
    <main className="redeem-page">
      <header className="redeem-header">
        <button type="button" className="redeem-back" onClick={onBack}>
          ← Dashboard
        </button>

        <div className="redeem-eyebrow">FACEQUEST REWARD EXCHANGE</div>
        <h1>Redeem <span>Store</span></h1>
        <p>Turn the XP you earn into optional demo coupons.</p>

        <div className="redeem-wallet">
          <span>✧</span>
          <div>
            <small>YOUR XP BALANCE</small>
            <strong>{xp.toLocaleString()} XP</strong>
          </div>
        </div>
      </header>

      <nav className="redeem-tabs" aria-label="Coupon store sections">
        <button
          type="button"
          className={tab === "store" ? "active" : ""}
          onClick={() => { setTab("store"); setNotice(""); setError(""); }}
        >
          Coupon Store
        </button>
        <button
          type="button"
          className={tab === "owned" ? "active" : ""}
          onClick={() => { setTab("owned"); setNotice(""); setError(""); }}
        >
          My Coupons ({ownedCoupons.length})
        </button>
      </nav>

      {notice && <div className="redeem-notice" role="status">{notice}</div>}
      {error && <div className="redeem-error" role="alert">{error}</div>}

      {tab === "store" ? (
        <section className="redeem-grid">
          {COUPONS.map((coupon) => {
            const owned = ownedCoupons.some((item) => item.id === coupon.id);

            return (
              <article className="redeem-card" key={coupon.id}>
                <div className="redeem-card-top">
                  <span className="redeem-icon">{coupon.icon}</span>
                  <span className="redeem-cost">✧ {coupon.cost} XP</span>
                </div>

                <div className="redeem-benefit">{coupon.benefit}</div>
                <h2>{coupon.title}</h2>
                <p>{coupon.description}</p>

                <button
                  type="button"
                  className="redeem-buy"
                  disabled={owned}
                  onClick={() => buyCoupon(coupon)}
                >
                  {owned ? "Already Purchased ✓" : "Buy with XP →"}
                </button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="owned-coupons">
          {ownedCoupons.length === 0 ? (
            <div className="redeem-empty">
              <span>🎟️</span>
              <h2>No coupons yet</h2>
              <p>Visit the Coupon Store and spend XP to collect your first reward.</p>
              <button type="button" onClick={() => setTab("store")}>
                Browse coupons
              </button>
            </div>
          ) : (
            ownedCoupons.map((coupon, index) => (
              <article className="owned-coupon" key={`${coupon.id}-${index}`}>
                <div className="redeem-icon">{coupon.icon}</div>
                <div className="owned-coupon-info">
                  <span>{coupon.benefit}</span>
                  <h2>{coupon.title}</h2>
                  <p>{coupon.description}</p>
                  <code>{coupon.code}</code>
                  <small>Demo coupon · Not valid for real purchases</small>
                </div>
                <button type="button" onClick={() => copyCode(coupon.code)}>
                  Copy code
                </button>
              </article>
            ))
          )}
        </section>
      )}

      <footer className="redeem-disclaimer">
        Demo rewards only. Coupon codes are examples for testing the FaceQuest
        experience and are not connected to a real retailer.
      </footer>
    </main>
  );
}
