import { useEffect, useRef, useState } from "react";
import AvatarScene, {
  AvatarArtwork,
  AVATAR_OPTIONS,
  DEFAULT_APPEARANCE,
  normalizeAppearance,
} from "./AvatarScene";
import "./AvatarCreator.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");
export async function avatarEndpoint(
  path = "",
  { method = "GET", body, signal } = {},
) {
  const token = localStorage.getItem("facequest-token");
  if (!token) throw new Error("Your session expired. Please log in again.");
  const response = await fetch(`${API_BASE}/api/avatar${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(60000)])
      : AbortSignal.timeout(60000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Please try again.");
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data;
}
export function avatarRequest(method = "GET", config, signal) {
  return avatarEndpoint("", {
    method,
    body: config ? { config } : undefined,
    signal,
  });
}
// Earth tones for new characters; existing saved colours remain unchanged.
const EDITOR_DEFAULTS = {
  ...DEFAULT_APPEARANCE,
  outfitColor: "#59634E",
  backgroundColor: "#E7E1D1",
};
const TABS = [
  { id: "face", label: "Face", icon: "face" },
  { id: "hair", label: "Hair", icon: "hair" },
  { id: "outfit", label: "Outfit", icon: "outfit" },
  { id: "extras", label: "Extras", icon: "extras" },
  { id: "scene", label: "Vibe", icon: "scene" },
  { id: "shop", label: "Shop", icon: "extras" },
];
const LABELS = {
  skinColor: "Skin tone",
  hairColor: "Hair colour",
  outfitColor: "Outfit colour",
  eyeColor: "Eye colour",
  backgroundColor: "Backdrop colour",
  accessoryColor: "Jewellery colour",
  hairstyle: "Hairstyle",
  faceShape: "Face shape",
  eyeShape: "Eyes",
  eyebrows: "Brows",
  facialHair: "Facial hair",
  outfitStyle: "Your wardrobe",
  accessories: "The finishing touch",
  backdrop: "Background style",
  pose: "Strike a pose",
  expression: "Expression",
};
const PALETTES = {
  skinColor: [
    "#F5D8C5",
    "#E8BA99",
    "#D9A17D",
    "#C98F69",
    "#AC7351",
    "#8B563E",
    "#673C2C",
    "#472D26",
  ],
  hairColor: [
    "#30251F",
    "#252720",
    "#6F4636",
    "#A8643E",
    "#CFAB71",
    "#AEA99D",
    "#89715D",
    "#667154",
  ],
  outfitColor: [
    "#59634E",
    "#887452",
    "#474B40",
    "#606D50",
    "#B58A69",
    "#AD785E",
    "#D7C8A3",
    "#353B30",
  ],
  eyeColor: ["#5C4334", "#29282E", "#779064", "#6588A0", "#9B885D", "#8A7659"],
  backgroundColor: [
    "#E7E1D1",
    "#F3DED3",
    "#DEE8D8",
    "#DFDDD1",
    "#F2E9CF",
    "#EADDD0",
    "#E3E2D6",
    "#E3DDCF",
  ],
  accessoryColor: ["#CDA85C", "#B7B7C2", "#BC7B78", "#34303F"],
};
const PRESETS = [
  {
    name: "Soft launch",
    subtitle: "Easy layers & quiet confidence",
    appearance: {
      ...EDITOR_DEFAULTS,
      hairstyle: "swept",
      outfitStyle: "hoodie",
      accessories: "glasses",
    },
  },
  {
    name: "Golden hour",
    subtitle: "Warm, easy, a little bold",
    appearance: {
      ...EDITOR_DEFAULTS,
      skinColor: "#8B563E",
      hairColor: "#252720",
      hairstyle: "curly",
      outfitColor: "#606D50",
      outfitStyle: "varsity",
      backgroundColor: "#F3DED3",
      expression: "grin",
      pose: "peace",
      accessories: "earrings",
    },
  },
  {
    name: "Daydream club",
    subtitle: "For your main-character era",
    appearance: {
      ...EDITOR_DEFAULTS,
      skinColor: "#E8BA99",
      hairColor: "#A8643E",
      hairstyle: "long",
      eyeShape: "cat",
      outfitColor: "#D7C8A3",
      outfitStyle: "knit",
      backgroundColor: "#DEE8D8",
      accessories: "chain",
      pose: "wave",
    },
  },
];
function Icon({ kind }) {
  const paths = {
    face: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 15q4 4 8 0M8 10h.1M16 10h.1" />
      </>
    ),
    hair: (
      <>
        <path d="M4 17V10a8 8 0 0116 0v7M5 10q6 1 9-6 2 5 6 6M6 17l2 3M18 17l-2 3" />
      </>
    ),
    outfit: <path d="M8 4l4 2 4-2 6 5-4 4-2-2v10H8V11l-2 2-4-4Z" />,
    extras: (
      <>
        <circle cx="6" cy="13" r="4" />
        <circle cx="18" cy="13" r="4" />
        <path d="M10 12h4M2 12V9M22 12V9" />
      </>
    ),
    scene: (
      <>
        <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />
        <path d="M20 2v4M18 4h4" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[kind]}
    </svg>
  );
}

export default function AvatarCreator({
  onComplete,
  onBack,
  initialAppearance,
  editing = false,
  onSaved,
  onDraftChange,
  headerAction,
  onWalletChange,
  initialTab = "face",
}) {
  const [appearance, setAppearance] = useState(() =>
    normalizeAppearance({ ...EDITOR_DEFAULTS, ...initialAppearance }),
  );
  const [tab, setTab] = useState(initialTab);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [purchaseError, setPurchaseError] = useState("");
  const [info, setInfo] = useState("");
  const [shopFilter, setShopFilter] = useState("all");
  const purchaseDialog = useRef(null);
  const busy = useRef(false);
  const request = useRef(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  function updateShop(data) {
    if (!data.wallet || !Array.isArray(data.catalog))
      throw new Error(
        "The XP shop is not ready. Please update the backend and run its database setup.",
      );
    setShop(data);
    onWalletChange?.(data.wallet);
  }
  async function refreshShop() {
    setShopLoading(true);
    try {
      const data = await avatarEndpoint();
      if (mounted.current) updateShop(data);
    } catch (err) {
      if (mounted.current) setError(err.message);
    } finally {
      if (mounted.current) setShopLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    avatarEndpoint("", { signal: controller.signal })
      .then((data) => {
        if (!active) return;
        updateShop(data);
        if (editing && !initialAppearance)
          setAppearance(normalizeAppearance(data.avatar || EDITOR_DEFAULTS));
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setShopLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const dialog = purchaseDialog.current;
    if (selectedItem && !dialog.open) dialog.showModal();
    else if (!selectedItem && dialog.open) dialog.close();
  }, [selectedItem]);
  const owned = (item, data = shop) =>
    !item || item.cost === 0 || data?.ownedItemIds?.includes(item.id);
  const optionItem = (key, value) =>
    shop?.catalog.find((item) => item.category === key && item.value === value);
  function commit(next) {
    const normalized = normalizeAppearance(next);
    setHistory((current) => [...current.slice(-19), appearance]);
    setAppearance(normalized);
    setSaved(false);
    setError("");
    onDraftChange?.(normalized);
  }
  function change(next) {
    if (busy.current) return;
    const normalized = normalizeAppearance(next);
    const locked =
      shop?.catalog.filter(
        (item) =>
          item.cost > 0 &&
          normalized[item.category] === item.value &&
          !owned(item),
      ) || [];
    for (const item of locked)
      normalized[item.category] = owned(
        optionItem(item.category, appearance[item.category]),
      )
        ? appearance[item.category]
        : EDITOR_DEFAULTS[item.category];
    commit(normalized);
    setInfo(
      locked.length
        ? "Applied the free and owned parts of this look. Unlock premium items to use the full style."
        : "",
    );
  }
  function update(key, value) {
    const item = optionItem(key, value);
    if (item && !owned(item)) {
      setPurchaseError("");
      setSelectedItem(item);
      return;
    }
    change({ ...appearance, [key]: value });
  }
  async function purchaseSelected() {
    if (!selectedItem || busy.current) return;
    busy.current = true;
    setBuying(true);
    setPurchaseError("");
    try {
      const data = await avatarEndpoint("/purchase", {
        method: "POST",
        body: { itemId: selectedItem.id, expectedCost: selectedItem.cost },
      });
      if (!mounted.current) return;
      updateShop(data);
      commit({ ...appearance, [selectedItem.category]: selectedItem.value });
      setInfo(
        data.alreadyOwned
          ? "You already own this item. Save your look to equip it."
          : "Unlocked permanently! Save your look to equip your new item.",
      );
      setSelectedItem(null);
    } catch (err) {
      if (mounted.current) {
        if (err.data?.wallet && err.data?.catalog) updateShop(err.data);
        setPurchaseError(
          err.message || "Purchase was not confirmed. You can safely retry.",
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setBuying(false);
    }
  }
  function undo() {
    if (!history.length || busy.current) return;
    const previous = history.at(-1);
    setAppearance(previous);
    setHistory((current) => current.slice(0, -1));
    setSaved(false);
    onDraftChange?.(previous);
  }
  function randomize() {
    const next = { ...appearance };
    for (const key of [
      "skinColor",
      "hairColor",
      "outfitColor",
      "eyeColor",
      "backgroundColor",
    ]) {
      const options = PALETTES[key];
      next[key] = options[Math.floor(Math.random() * options.length)];
    }
    for (const key of [
      "hairstyle",
      "outfitStyle",
      "accessories",
      "expression",
      "pose",
    ]) {
      const options = AVATAR_OPTIONS[key].filter((value) =>
        owned(optionItem(key, value)),
      );
      next[key] = options[Math.floor(Math.random() * options.length)];
    }
    change(next);
  }
  function swatches(key) {
    return (
      <fieldset
        className="fqav-field"
        disabled={saving || buying || shopLoading}
      >
        <legend>{LABELS[key]}</legend>
        <div className="fqav-swatches">
          {PALETTES[key].map((color, index) => (
            <button
              key={color}
              type="button"
              className={
                appearance[key].toLowerCase() === color.toLowerCase()
                  ? "is-selected"
                  : ""
              }
              style={{ backgroundColor: color }}
              aria-label={`${LABELS[key]} ${index + 1} ${color}`}
              title={color}
              aria-pressed={
                appearance[key].toLowerCase() === color.toLowerCase()
              }
              onClick={() => update(key, color)}
            >
              <span>
                {appearance[key].toLowerCase() === color.toLowerCase()
                  ? "✓"
                  : ""}
              </span>
            </button>
          ))}
          <label className="fqav-custom-colour" title={`Custom ${LABELS[key]}`}>
            <span>+</span>
            <input
              type="color"
              value={appearance[key]}
              aria-label={`Custom ${LABELS[key]}`}
              onChange={(event) => update(key, event.target.value)}
            />
          </label>
        </div>
      </fieldset>
    );
  }
  function choices(key, visual = false) {
    return (
      <fieldset
        className="fqav-field"
        disabled={saving || buying || shopLoading}
      >
        <legend>{LABELS[key]}</legend>
        <div className={visual ? "fqav-option-grid" : "fqav-pills"}>
          {AVATAR_OPTIONS[key].map((value) => (
            <button
              type="button"
              key={value}
              className={appearance[key] === value ? "is-selected" : ""}
              aria-label={`${LABELS[key]}: ${value}`}
              aria-pressed={appearance[key] === value}
              disabled={saving || buying || !shop}
              onClick={() => update(key, value)}
            >
              {visual && (
                <span className="fqav-option-art" aria-hidden="true">
                  <AvatarArtwork
                    appearance={{
                      ...appearance,
                      [key]: value,
                      pose: "relaxed",
                    }}
                    transparent
                    view={
                      key === "outfitStyle"
                        ? "outfit"
                        : key === "accessories"
                          ? "full"
                          : "head"
                    }
                    title={`${value} preview`}
                  />
                </span>
              )}
              <span>{value}</span>
              <small
                className={`fqav-item-badge ${owned(optionItem(key, value)) ? "" : "is-locked"}`}
              >
                {!shop
                  ? "Loading…"
                  : !optionItem(key, value)?.cost
                    ? "Free"
                    : owned(optionItem(key, value))
                      ? "Owned"
                      : `${optionItem(key, value).cost} XP`}
              </small>
              {visual && appearance[key] === value && (
                <i aria-hidden="true">✓</i>
              )}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }
  async function save() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError("");
    setSaved(false);
    const controller = new AbortController();
    request.current = controller;
    try {
      const data = await avatarRequest("PUT", appearance, controller.signal);
      if (!mounted.current) return;
      const confirmed = normalizeAppearance(data.avatar?.config || data.avatar);
      setAppearance(confirmed);
      setSaved(true);
      updateShop(data);
      onSaved?.(confirmed);
      if (!editing) onComplete?.(confirmed);
    } catch (err) {
      if (mounted.current)
        setError(
          err.name === "AbortError" || err.name === "TimeoutError"
            ? "The save timed out. Your look is still here; please retry."
            : err.message,
        );
    } finally {
      busy.current = false;
      request.current = null;
      if (mounted.current) setSaving(false);
    }
  }
  return (
    <main className="fqav-page">
      <header className="fqav-nav">
        <a className="fqav-brand" href="/">
          FACEQUEST<span>.</span>
        </a>
        <span className="fqav-nav-note">THE CHARACTER STUDIO</span>
        <div className="fqav-nav-actions">
          {headerAction}
          {onBack && (
            <button
              type="button"
              className="fqav-button fqav-secondary"
              disabled={saving || buying || shopLoading}
              onClick={onBack}
            >
              ← {editing ? "Dashboard" : "Go back"}
            </button>
          )}
        </div>
      </header>
      <div className="fqav-heading">
        <div>
          <p className="fqav-eyebrow">A LITTLE PERSONALITY GOES A LONG WAY</p>
          <h1>
            A whole new <em>kind of you.</em>
          </h1>
          <p>
            Play with your look. Find your vibe. Make a character that feels
            like home.
          </p>
        </div>
        <div className="fqav-wallet" aria-live="polite">
          <strong>
            {shop ? shop.wallet.availableXP.toLocaleString() : "…"} XP
          </strong>
          <span>AVAILABLE TO SPEND</span>
          {shop && (
            <small>
              {shop.wallet.totalXP.toLocaleString()} earned · Level{" "}
              {shop.wallet.level}
            </small>
          )}
        </div>
      </div>
      <div className="fqav-layout">
        <section className="fqav-preview-card">
          <div className="fqav-card-heading">
            <span>YOUR MAIN CHARACTER</span>
            <span className="fqav-live">● LIVE PREVIEW</span>
          </div>
          <div className={saving ? "fqav-preview-busy" : ""}>
            <AvatarScene
              appearance={appearance}
              onAppearanceChange={change}
              disabled={saving || buying || shopLoading}
            />
          </div>
          <div className="fqav-presets">
            <div>
              <span className="fqav-eyebrow">A LITTLE INSPIRATION</span>
              <p>Start with a feeling.</p>
            </div>
            <div className="fqav-preset-grid">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => change(preset.appearance)}
                  disabled={saving || buying || shopLoading}
                  title={preset.subtitle}
                >
                  <AvatarArtwork
                    appearance={preset.appearance}
                    view="head"
                    transparent
                    title={preset.name}
                  />
                  <strong>{preset.name}</strong>
                  <small>{preset.subtitle}</small>
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className="fqav-controls">
          <div className="fqav-control-heading">
            <div>
              <span className="fqav-eyebrow">THE DETAILS MAKE YOU, YOU</span>
              <h2>Make it yours.</h2>
            </div>
            <span className="fqav-control-star" aria-hidden="true">
              ✦
            </span>
          </div>
          <div
            className="fqav-tabs"
            role="tablist"
            aria-label="Avatar categories"
          >
            {TABS.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`fqav-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls="fqav-appearance-panel"
                tabIndex={tab === item.id ? 0 : -1}
                disabled={saving || buying || shopLoading}
                onClick={() => setTab(item.id)}
                onKeyDown={(event) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    event.preventDefault();
                    const next =
                      event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? TABS.length - 1
                          : (index +
                              (event.key === "ArrowRight"
                                ? 1
                                : TABS.length - 1)) %
                            TABS.length;
                    setTab(TABS[next].id);
                    document
                      .getElementById(`fqav-tab-${TABS[next].id}`)
                      ?.focus();
                  }
                }}
              >
                <Icon kind={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <div
            className="fqav-tab-panel"
            id="fqav-appearance-panel"
            role="tabpanel"
            aria-labelledby={`fqav-tab-${tab}`}
          >
            {tab === "face" && (
              <>
                {swatches("skinColor")}
                {choices("faceShape", true)}
                {choices("eyeShape")}
                {swatches("eyeColor")}
                {choices("eyebrows")}
                {choices("facialHair")}
              </>
            )}
            {tab === "hair" && (
              <>
                {choices("hairstyle", true)}
                {swatches("hairColor")}
              </>
            )}
            {tab === "outfit" && (
              <>
                {choices("outfitStyle", true)}
                {swatches("outfitColor")}
              </>
            )}
            {tab === "extras" && (
              <>
                {choices("accessories", true)}
                {swatches("accessoryColor")}
                {choices("pose")}
              </>
            )}
            {tab === "scene" && (
              <>
                {swatches("backgroundColor")}
                {choices("backdrop")}
                {choices("expression")}
              </>
            )}
            {tab === "shop" && (
              <>
                <div className="fqav-shop-heading">
                  <div>
                    <h3>Earn it. Wear it.</h3>
                    <p>Buy once. Equip forever. Your level stays yours.</p>
                  </div>
                  <button
                    type="button"
                    className="fqav-button fqav-secondary"
                    disabled={saving || buying || shopLoading}
                    onClick={refreshShop}
                  >
                    Refresh XP
                  </button>
                </div>
                <div
                  className="fqav-shop-filters"
                  aria-label="Filter avatar items"
                >
                  {["all", "free", "owned", "premium"].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={shopFilter === filter}
                      onClick={() => setShopFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                {shopLoading && <p role="status">Loading your collection…</p>}
                <div className="fqav-shop-grid">
                  {shop?.catalog
                    .filter(
                      (item) =>
                        shopFilter === "all" ||
                        (shopFilter === "free" && !item.cost) ||
                        (shopFilter === "owned" && item.cost && owned(item)) ||
                        (shopFilter === "premium" && item.cost > 0),
                    )
                    .map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`fqav-shop-card ${owned(item) ? "" : "is-locked"}`}
                        disabled={saving || buying}
                        onClick={() => update(item.category, item.value)}
                        aria-label={`${item.name}, ${!item.cost ? "free" : owned(item) ? "owned" : item.cost + " XP, locked"}`}
                      >
                        <AvatarArtwork
                          appearance={{
                            ...appearance,
                            [item.category]: item.value,
                          }}
                          transparent
                          view={
                            item.category === "outfitStyle"
                              ? "outfit"
                              : item.category === "hairstyle"
                                ? "head"
                                : "full"
                          }
                          title={item.name}
                        />
                        <strong>{item.name}</strong>
                        <small className="fqav-item-badge">
                          {!item.cost
                            ? "Free · Try it"
                            : owned(item)
                              ? "Owned · Try it"
                              : `Unlock · ${item.cost} XP`}
                        </small>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
          <div className="fqav-edit-actions">
            <button
              type="button"
              disabled={saving || buying || shopLoading}
              onClick={randomize}
            >
              ↝ Surprise me
            </button>
            <button
              type="button"
              disabled={saving || buying || !history.length}
              onClick={undo}
            >
              ↶ Undo
            </button>
            <button
              type="button"
              disabled={saving || buying || shopLoading}
              onClick={() => change(EDITOR_DEFAULTS)}
            >
              Reset
            </button>
          </div>
          {info && (
            <p className="fqav-shop-info" role="status">
              {info}
            </p>
          )}
          {shopLoading && tab !== "shop" && (
            <p className="fqav-shop-info" role="status">
              Loading your XP and owned items…
            </p>
          )}
          {!shop && !shopLoading && (
            <button
              type="button"
              className="fqav-button fqav-secondary"
              onClick={refreshShop}
            >
              Retry shop connection
            </button>
          )}
          {error && (
            <p className="fqav-error" role="alert">
              {error}
            </p>
          )}
          {saved && (
            <p className="fqav-saved" role="status">
              ✓ Your new look is saved to your account.
            </p>
          )}
          <button
            type="button"
            className="fqav-button fqav-primary fqav-save"
            onClick={save}
            disabled={saving || buying || shopLoading || !shop}
          >
            {saving
              ? "Saving your character…"
              : editing
                ? "Save my new look →"
                : "This is me. Let’s explore →"}
          </button>
          <p className="fqav-save-note">
            An original character, made by you. Saved to your FaceQuest account.
          </p>
        </section>
      </div>

      <dialog
        ref={purchaseDialog}
        className="fqav-purchase-dialog"
        aria-labelledby="fqav-purchase-title"
        onClose={() => setSelectedItem(null)}
        onCancel={(event) => {
          if (buying) event.preventDefault();
        }}
      >
        {selectedItem && (
          <>
            <button
              type="button"
              className="fqav-button fqav-secondary fqav-purchase-close"
              disabled={buying}
              onClick={() => setSelectedItem(null)}
            >
              Close ×
            </button>
            <div className="fqav-purchase-preview">
              <AvatarArtwork
                appearance={{
                  ...appearance,
                  [selectedItem.category]: selectedItem.value,
                }}
                title={`${selectedItem.name} preview`}
              />
            </div>
            <p className="fqav-eyebrow">A LITTLE UPGRADE, FOREVER YOURS</p>
            <h2 id="fqav-purchase-title">Unlock {selectedItem.name}</h2>
            <p>
              Pay once to own this item permanently. Save your look afterwards
              to equip it.
            </p>
            <div className="fqav-purchase-price">
              <strong>{selectedItem.cost} XP</strong>
              <span>{shop?.wallet.availableXP ?? 0} XP available</span>
            </div>
            {purchaseError && (
              <p className="fqav-error" role="alert">
                {purchaseError}
              </p>
            )}
            {(shop?.wallet.availableXP ?? 0) < selectedItem.cost && (
              <p className="fqav-shop-info">
                Earn {selectedItem.cost - (shop?.wallet.availableXP ?? 0)} more
                XP from missions or daily rewards.
              </p>
            )}
            <button
              type="button"
              className="fqav-button fqav-primary fqav-save"
              disabled={
                buying || (shop?.wallet.availableXP ?? 0) < selectedItem.cost
              }
              onClick={purchaseSelected}
            >
              {buying ? "Unlocking…" : `Unlock for ${selectedItem.cost} XP`}
            </button>
            <button
              type="button"
              className="fqav-button fqav-secondary"
              disabled={buying}
              onClick={() => setSelectedItem(null)}
            >
              Keep exploring
            </button>
          </>
        )}
      </dialog>
      <footer className="fqav-footer">
        <span>EXPLORE. EXPRESS. BE YOURSELF.</span>
        <span>A LITTLE MORE YOU, EVERY DAY.</span>
      </footer>
    </main>
  );
}
