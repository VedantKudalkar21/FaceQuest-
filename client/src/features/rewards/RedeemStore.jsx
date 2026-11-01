import { useEffect, useRef, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const number = (value) => Number(value || 0).toLocaleString();

async function request(path = "", body, signal) {
  const response = await fetch(`${API_BASE}/api/avatar/coupons${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("facequest-token")}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: signal || AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Could not load the Redeem Store.");
  return data;
}

function Confirmation({ coupon, busy, onClose, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog ref={dialog} className="fq-coupon-dialog" aria-labelledby="fq-redeem-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
      <span className="fq-coupon-eyebrow">CONFIRM REDEMPTION</span>
      <h2 id="fq-redeem-title">Make it yours.</h2>
      <p>{coupon.title}</p>
      <strong className="fq-coupon-price">{number(coupon.cost)} XP</strong>
      <p>This demo coupon unlocks once per account. Your available XP will decrease; your earned level stays the same.</p>
      <div className="fq-coupon-actions">
        <button type="button" autoFocus disabled={busy} onClick={onClose}>Keep exploring</button>
        <button type="button" className="fq-coupon-primary" disabled={busy} onClick={onConfirm}>
          {busy ? "Redeeming…" : `Confirm · ${number(coupon.cost)} XP`}
        </button>
      </div>
    </dialog>
  );
}

export default function RedeemStore({ onBack, onWalletChange }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("browse");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const purchasing = useRef(false);
  const walletCallback = useRef(onWalletChange);
  walletCallback.current = onWalletChange;

  function apply(next) {
    setData(next);
    walletCallback.current?.(next.wallet);
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    request("", undefined, controller.signal)
      .then((next) => { if (!controller.signal.aborted) apply(next); })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [retry]);

  async function redeem() {
    if (!selected || purchasing.current) return;
    purchasing.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await request("/redeem", { couponId: selected.id, expectedCost: selected.cost });
      apply(next);
      setSelected(null);
      setTab("mine");
      setNotice(next.alreadyRedeemed ? "This coupon is already in My Coupons. You were not charged again." : "Coupon unlocked. Your code is saved in My Coupons.");
    } catch (failure) {
      setSelected(null);
      setError(`${failure.message} Refresh the store to check My Coupons before retrying.`);
    } finally {
      purchasing.current = false;
      setBusy(false);
    }
  }

  async function copy(code) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice("Coupon code copied.");
    } catch {
      setNotice("Select the coupon code below and copy it manually.");
    }
  }

  const owned = new Set((data?.redemptions || []).map((item) => item.coupon_id));
  const catalog = data?.coupons || [];
  const categories = ["All", ...new Set(catalog.map((item) => item.category))];
  return (
    <main className="fq-coupon-page">
      <header className="fq-coupon-header">
        <button type="button" onClick={onBack} disabled={busy}>← Dashboard</button>
        <a className="fq-coupon-brand" href="#redeem-store">FACE<span>QUEST</span></a>
        <span className="fq-coupon-balance">{data ? `${number(data.wallet.availableXP)} XP` : "Loading…"}</span>
      </header>
      <div className="fq-coupon-container" id="redeem-store">
        <section className="fq-coupon-hero">
          <div>
            <span className="fq-coupon-eyebrow">THE REWARDS COLLECTION</span>
            <h1>A little adventure.<br /><em>A little reward.</em></h1>
            <p>Turn the XP you earn into something to look forward to.</p>
          </div>
          <div className="fq-coupon-wallet">
            <span>AVAILABLE TO REDEEM</span>
            <strong>{data ? number(data.wallet.availableXP) : "…"}<small> XP</small></strong>
            <p>{number(data?.wallet.totalXP)} lifetime XP · Level {data?.wallet.level || "—"}</p>
            <small>Redeeming keeps your earned level.</small>
          </div>
        </section>
        <p className="fq-coupon-demo"><b>Project demo collection.</b> These sample coupons demonstrate XP redemption. They have no cash value and cannot be used with real merchants.</p>
        <div className="fq-coupon-tabs" role="group" aria-label="Coupon views">
          <button type="button" aria-pressed={tab === "browse"} onClick={() => setTab("browse")}>Explore coupons</button>
          <button type="button" aria-pressed={tab === "mine"} onClick={() => setTab("mine")}>My Coupons ({data?.redemptions.length || 0})</button>
          <button type="button" disabled={loading || busy} onClick={() => setRetry((value) => value + 1)}>Refresh store ↻</button>
        </div>
        {notice && <p role="status" className="fq-coupon-notice">{notice}</p>}
        {error && <p role="alert" className="fq-coupon-error">{error}</p>}
        {loading && <p role="status">Opening the collection…</p>}
        {!loading && data && tab === "browse" && <>
          <div className="fq-coupon-filters" role="group" aria-label="Coupon categories">
            {categories.map((item) => <button type="button" key={item} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <section className="fq-coupon-grid" aria-label="Available coupons">
            {catalog.filter((item) => category === "All" || item.category === category).map((item) => {
              const isOwned = owned.has(item.id);
              const shortfall = Math.max(0, item.cost - data.wallet.availableXP);
              return <article className={`fq-coupon-card fq-coupon-${item.category.toLowerCase()}`} key={item.id}>
                <div className="fq-coupon-art"><span>{item.category}</span><b>{item.offer}</b><small>FACEQUEST · DEMO COUPON</small></div>
                <div className="fq-coupon-copy">
                  <h2>{item.title}</h2><p>{item.description}</p>
                  <div className="fq-coupon-meta"><strong>{number(item.cost)} XP</strong><span>Valid for 90 days</span></div>
                  <button type="button" className="fq-coupon-primary" disabled={busy || (!isOwned && shortfall > 0)}
                    onClick={() => isOwned ? setTab("mine") : setSelected(item)}>
                    {isOwned ? "View in My Coupons →" : shortfall ? `Earn ${number(shortfall)} more XP` : "Redeem coupon →"}
                  </button>
                  <small>One per account · Demo reward</small>
                </div>
              </article>;
            })}
          </section>
        </>}
        {!loading && data && tab === "mine" && <section aria-label="My Coupons" className="fq-coupon-owned-list">
          {!data.redemptions.length && <div className="fq-coupon-empty"><span>▱</span><h2>Your collection starts here.</h2><p>Complete missions, earn XP, and unlock your first demo coupon.</p><button type="button" onClick={() => setTab("browse")}>Explore coupons →</button></div>}
          {data.redemptions.map((item) => {
            const coupon = catalog.find((entry) => entry.id === item.coupon_id);
            const expired = new Date(item.expires_at).getTime() <= Date.now();
            return <article className="fq-coupon-owned" key={item.id}>
              <div><span className="fq-coupon-eyebrow">{expired ? "EXPIRED DEMO COUPON" : "YOUR DEMO COUPON"}</span><h2>{coupon?.title || "FaceQuest reward"}</h2><p>{number(item.xp_cost)} XP · {expired ? "Expired" : "Valid until"} {new Date(item.expires_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p></div>
              <div className="fq-coupon-code"><code>{item.code}</code><button type="button" disabled={expired} onClick={() => copy(item.code)}>Copy code</button></div>
            </article>;
          })}
        </section>}
        <footer className="fq-coupon-footer">FACEQUEST / EARN. EXPLORE. ENJOY.<span>Avatar items are available inside Avatar Studio.</span></footer>
      </div>
      {selected && <Confirmation coupon={selected} busy={busy} onClose={() => setSelected(null)} onConfirm={redeem} />}
    </main>
  );
}