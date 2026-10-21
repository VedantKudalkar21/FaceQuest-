
import { useEffect, useState } from "react";
import AvatarScene from "./AvatarScene";
import "./AvatarCreator.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT = {
  skinColor: "#C98F69",
  hairColor: "#30251F",
  outfitColor: "#7657F6",
  hairstyle: "swept",
  faceShape: "oval",
  accessories: "none",
};

const ITEMS = [
  { id: "hair-violet", name: "Galactic Hair", category: "hairColor", value: "#9B5DE5", cost: 100, icon: "🟣" },
  { id: "hair-silver", name: "Starlight Hair", category: "hairColor", value: "#BFC5D2", cost: 150, icon: "✨" },
  { id: "outfit-blue", name: "Neon Suit", category: "outfitColor", value: "#2878F0", cost: 100, icon: "🔷" },
  { id: "outfit-rose", name: "Cosmic Rose Suit", category: "outfitColor", value: "#E85D9E", cost: 150, icon: "🌸" },
  { id: "hair-curly", name: "Curly Style", category: "hairstyle", value: "curly", cost: 100, icon: "🌀" },
  { id: "hair-spiky", name: "Supernova Spikes", category: "hairstyle", value: "spiky", cost: 150, icon: "⚡" },
  { id: "glasses", name: "Explorer Glasses", category: "accessories", value: "glasses", cost: 100, icon: "🕶️" },
  { id: "chain", name: "Stellar Chain", category: "accessories", value: "chain", cost: 200, icon: "📿" },
];

export default function AvatarStudio({ playerXP = 0, onXPChange, onBack }) {
  const [appearance, setAppearance] = useState(DEFAULT);
  const [xp, setXP] = useState(playerXP);
  const [unlocked, setUnlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setXP(playerXP);
  }, [playerXP]);

  useEffect(() => {
    let active = true;

    async function loadAvatar() {
      const token = localStorage.getItem("facequest-token");
      const savedUnlocked = localStorage.getItem("facequest-avatar-unlocks");

      if (savedUnlocked) {
        try {
          setUnlocked(JSON.parse(savedUnlocked));
        } catch {
          setUnlocked([]);
        }
      }

      if (!token) {
        setError("Please log in again to load your avatar.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/api/avatar`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || "Could not load your avatar.");
        }

        if (active && data.avatar?.config) {
          setAppearance({ ...DEFAULT, ...data.avatar.config });
        } else if (active && data.avatar) {
          setAppearance({ ...DEFAULT, ...data.avatar });
        }
      } catch (err) {
        if (active) setError(err.message || "Could not connect to FaceQuest.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAvatar();
    return () => {
      active = false;
    };
  }, []);

  async function saveAppearance(nextAppearance) {
    const token = localStorage.getItem("facequest-token");
    if (!token) throw new Error("Your session expired. Please log in again.");

    const response = await fetch(`${API}/api/avatar`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ config: nextAppearance }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Could not save your avatar.");
    }
  }

  async function buyItem(item) {
    if (unlocked.includes(item.id)) {
      setAppearance((current) => ({ ...current, [item.category]: item.value }));
      setMessage(`${item.name} equipped!`);
      return;
    }

    if (xp < item.cost) {
      setMessage(`You need ${item.cost - xp} more XP for ${item.name}.`);
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const nextAppearance = {
      ...appearance,
      [item.category]: item.value,
    };

    try {
      await saveAppearance(nextAppearance);

      const nextXP = xp - item.cost;
      const nextUnlocked = [...unlocked, item.id];

      setAppearance(nextAppearance);
      setXP(nextXP);
      setUnlocked(nextUnlocked);
      localStorage.setItem("facequest-avatar-unlocks", JSON.stringify(nextUnlocked));
      onXPChange?.(nextXP);
      setMessage(`${item.name} unlocked and equipped!`);
    } catch (err) {
      setError(err.message || "Purchase could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCurrentAvatar() {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await saveAppearance(appearance);
      setMessage("Avatar saved successfully!");
    } catch (err) {
      setError(err.message || "Could not save your avatar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="avatar-creator-page avatar-studio-page">
      <header className="avatar-creator-header">
        <div>
          <div className="avatar-eyebrow">FACEQUEST · PLAYER IDENTITY</div>
          <h1>Avatar Studio ✦</h1>
          <p>Upgrade your style with the XP you earn on missions.</p>
        </div>
        <div className="avatar-step-pill">✧ {xp.toLocaleString()} XP AVAILABLE</div>
      </header>

      <div className="avatar-creator-layout">
        <section className="avatar-preview-panel">
          <div className="avatar-preview-heading">
            <div>
              <span className="avatar-section-label">LIVE PREVIEW</span>
              <h2>Your explorer</h2>
            </div>
            <span className="avatar-live-indicator"><span /> LIVE</span>
          </div>

          {loading ? (
            <p>Loading your saved avatar...</p>
          ) : (
            <AvatarScene appearance={appearance} />
          )}

          <div className="avatar-preview-footer">
            <div>
              <span className="avatar-section-label">YOUR XP BALANCE</span>
              <strong>✧ {xp.toLocaleString()} XP</strong>
            </div>
            <button className="avatar-save-button" type="button" onClick={saveCurrentAvatar} disabled={busy || loading}>
              {busy ? "Saving..." : "Save avatar"}
            </button>
          </div>

          <button className="avatar-back-button" type="button" onClick={onBack}>
            ← Back to dashboard
          </button>
        </section>

        <section className="avatar-custom-panel">
          <div className="avatar-custom-heading">
            <span className="avatar-section-label">THE COSMETIC VAULT</span>
            <h2>Unlock upgrades</h2>
            <p>Purchase an item once, then equip it again whenever you want.</p>
          </div>

          {error && <div className="avatar-error" role="alert">{error}</div>}
          {message && <p role="status">{message}</p>}

          <div className="avatar-studio-items">
            {ITEMS.map((item) => {
              const owned = unlocked.includes(item.id);
              const equipped = appearance[item.category] === item.value;

              return (
                <article className="avatar-studio-item" key={item.id}>
                  <div className="avatar-studio-item-icon">{item.icon}</div>
                  <div className="avatar-studio-item-info">
                    <strong>{item.name}</strong>
                    <small>{owned ? "Unlocked" : `${item.cost} XP`}</small>
                  </div>
                  <button
                    type="button"
                    disabled={busy || loading}
                    onClick={() => buyItem(item)}
                  >
                    {equipped ? "Equipped" : owned ? "Equip" : "Unlock"}
                  </button>
                </article>
              );
            })}
          </div>

          <p className="avatar-save-note">
            Earn XP by completing missions, then return here to personalize your explorer.
          </p>
        </section>
      </div>
    </main>
  );
}
