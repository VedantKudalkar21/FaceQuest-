
import { useState } from "react";
import AvatarScene from "./AvatarScene";
import "./AvatarCreator.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_APPEARANCE = {
  skinColor: "#C98F69",
  hairColor: "#30251F",
  outfitColor: "#7657F6",
  hairstyle: "swept",
  faceShape: "oval",
  accessories: "none",
};

const skinTones = [
  { name: "Porcelain", color: "#F4D5C2" },
  { name: "Light", color: "#E8B99A" },
  { name: "Warm", color: "#C98F69" },
  { name: "Tan", color: "#A96E4D" },
  { name: "Deep", color: "#75452F" },
  { name: "Rich", color: "#4D2D25" },
];

const hairColors = [
  { name: "Espresso", color: "#30251F" },
  { name: "Black", color: "#171923" },
  { name: "Chestnut", color: "#75452F" },
  { name: "Blonde", color: "#D9B56D" },
  { name: "Silver", color: "#BFC5D2" },
  { name: "Violet", color: "#9B5DE5" },
];

const outfitColors = [
  { name: "Cosmic Purple", color: "#7657F6" },
  { name: "Electric Blue", color: "#2878F0" },
  { name: "Mint", color: "#36BFA5" },
  { name: "Sunset", color: "#F07854" },
  { name: "Rose", color: "#E85D9E" },
  { name: "Midnight", color: "#293047" },
];

const hairstyles = [
  { name: "Swept", value: "swept" },
  { name: "Curly", value: "curly" },
  { name: "Spiky", value: "spiky" },
  { name: "Undercut", value: "undercut" },
];

const faceShapes = [
  { name: "Oval", value: "oval" },
  { name: "Round", value: "round" },
  { name: "Square", value: "square" },
];

const accessoryOptions = [
  { name: "None", value: "none" },
  { name: "Glasses", value: "glasses" },
  { name: "Chain", value: "chain" },
];

export default function AvatarCreator({ onComplete, onBack }) {
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateAppearance(key, value) {
    setAppearance((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function renderChoiceOptions(options, property) {
    return (
      <div className="avatar-choice-options">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={
              appearance[property] === option.value
                ? "avatar-choice selected"
                : "avatar-choice"
            }
            aria-pressed={appearance[property] === option.value}
            onClick={() => updateAppearance(property, option.value)}
          >
            {option.name}
          </button>
        ))}
      </div>
    );
  }

  function renderColorOptions(options, property) {
    return (
      <div className="avatar-color-options">
        {options.map((option) => (
          <button
            key={option.color}
            type="button"
            className={`avatar-color-swatch ${
              appearance[property] === option.color ? "selected" : ""
            }`}
            style={{ "--swatch-color": option.color }}
            aria-label={option.name}
            title={option.name}
            aria-pressed={appearance[property] === option.color}
            onClick={() => updateAppearance(property, option.color)}
          />
        ))}
      </div>
    );
  }

  async function saveAvatar() {
    const token = localStorage.getItem("facequest-token");

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config: appearance }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Could not save your avatar.");
      }

      onComplete?.(data.avatar || appearance);
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to FaceQuest. Check that the server is running."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="avatar-creator-page">
      <header className="avatar-creator-header">
        <div>
          <div className="avatar-eyebrow">FACEQUEST IDENTITY LAB</div>
          <h1>Create your avatar</h1>
          <p>
            Your journey starts here. Build a character that represents you.
          </p>
        </div>

        <div className="avatar-step-pill">
          <span>01</span> CHARACTER CREATION
        </div>
      </header>

      <div className="avatar-creator-layout">
        <section className="avatar-preview-panel">
          <div className="avatar-preview-heading">
            <div>
              <span className="avatar-section-label">LIVE PREVIEW</span>
              <h2>Your character</h2>
            </div>

            <span className="avatar-live-indicator">
              <span /> LIVE
            </span>
          </div>

          <AvatarScene appearance={appearance} />

          <p className="avatar-preview-hint">
            Drag to rotate your character. Scroll or pinch to zoom.
          </p>

          <div className="avatar-preview-footer">
            <div>
              <span className="avatar-section-label">YOUR STARTING FORM</span>
              <strong>Explorer · Level 1</strong>
            </div>

            <button
              type="button"
              className="avatar-reset-button"
              onClick={() => {
                setAppearance({ ...DEFAULT_APPEARANCE });
                setError("");
              }}
            >
              Reset
            </button>
          </div>
        </section>

        <section className="avatar-custom-panel">
          <div className="avatar-custom-heading">
            <span className="avatar-section-label">MAKE IT YOURS</span>
            <h2>Appearance</h2>
            <p>Customize your character before entering FaceQuest.</p>
          </div>

          <div className="avatar-option-group">
            <div className="avatar-option-title">
              <span>01</span>
              <div>
                <strong>Skin tone</strong>
                <small>Choose your character's skin tone</small>
              </div>
            </div>
            {renderColorOptions(skinTones, "skinColor")}
          </div>

          <div className="avatar-option-group">
            <div className="avatar-option-title">
              <span>02</span>
              <div>
                <strong>Hair color</strong>
                <small>Pick your character's hair color</small>
              </div>
            </div>
            {renderColorOptions(hairColors, "hairColor")}
          </div>

          <div className="avatar-option-group">
            <div className="avatar-option-title">
              <span>03</span>
              <div>
                <strong>Outfit color</strong>
                <small>Your first explorer outfit</small>
              </div>
            </div>
            {renderColorOptions(outfitColors, "outfitColor")}
          </div>

          <div className="avatar-option-group">
            <div className="avatar-option-title">
              <span>04</span>
              <div>
                <strong>Hairstyle</strong>
                <small>Choose your signature look</small>
              </div>
            </div>
            {renderChoiceOptions(hairstyles, "hairstyle")}
          </div>

          <div className="avatar-option-group">
            <div className="avatar-option-title">
              <span>05</span>
              <div>
                <strong>Face shape</strong>
                <small>Customize your character's face</small>
              </div>
            </div>
            {renderChoiceOptions(faceShapes, "faceShape")}
          </div>

          <div className="avatar-option-group">
            <div className="avatar-option-title">
              <span>06</span>
              <div>
                <strong>Accessories</strong>
                <small>Add glasses or a necklace</small>
              </div>
            </div>
            {renderChoiceOptions(accessoryOptions, "accessories")}
          </div>

          {error && (
            <div className="avatar-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            className="avatar-save-button"
            onClick={saveAvatar}
            disabled={saving}
          >
            {saving ? "Saving your avatar..." : "Save & enter FaceQuest"}
          </button>

          <p className="avatar-save-note">
            Your avatar is saved to your FaceQuest account when the server
            confirms the save.
          </p>

          {onBack && (
            <button
              type="button"
              className="avatar-back-button"
              onClick={onBack}
            >
              Go back
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
