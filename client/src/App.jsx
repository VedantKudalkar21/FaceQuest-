import { lazy, Suspense, useEffect, useRef, useState } from "react";
import AuthPage from "./pages/AuthPage";
import { AvatarArtwork } from "./features/avatar/AvatarScene";
import "./index.css";
import "./App.css";
import "./PremiumTheme.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const AvatarCreator = lazy(() => import("./features/avatar/AvatarCreator"));
const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function Compass({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="1.2" />
      <path d="m26 14-4 8-8 4 4-8 8-4Z" fill="currentColor" />
      <path d="M20 1v5m0 28v5M1 20h5m28 0h5" stroke="currentColor" />
    </svg>
  );
}

function QuestArt({ kind }) {
  return (
    <svg viewBox="0 0 360 240" fill="none" aria-hidden="true">
      <circle cx="180" cy="120" r="90" stroke="currentColor" opacity=".12" />
      <circle cx="180" cy="120" r="65" stroke="currentColor" opacity=".15" />
      {kind === "puzzle" ? (
        <g stroke="currentColor" strokeWidth="1.5">
          <path d="m180 55 65 65-65 65-65-65 65-65Z" />
          <path d="m180 78 42 42-42 42-42-42 42-42Z" />
          <path
            d="M180 55v130m-65-65h130M134 74l92 92m-92 0 92-92"
            opacity=".4"
          />
          <circle cx="180" cy="120" r="12" fill="currentColor" stroke="none" />
        </g>
      ) : kind === "camera" ? (
        <g stroke="currentColor" strokeWidth="1.5">
          <rect x="112" y="77" width="136" height="90" rx="16" />
          <path d="m147 77 9-15h48l9 15" />
          <circle cx="180" cy="122" r="29" />
          <circle cx="180" cy="122" r="17" opacity=".4" />
          <path d="M228 91h5" />
          <path
            d="M105 65H90v20m165-20h15v20M90 155v20h15m150 0h15v-20"
            opacity=".4"
          />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="1.5">
          <path d="M133 182V96a47 47 0 0 1 94 0v86H133Z" />
          <path d="M149 182V98a31 31 0 0 1 62 0v84" opacity=".5" />
          <path d="M118 182h124m-118 11h112M180 82v65m-23-32h46" />
          <path d="m180 104 11 11-11 11-11-11 11-11Z" fill="currentColor" />
        </g>
      )}
      <path
        d="M65 55v14m-7-7h14m218 101v14m-7-7h14"
        stroke="currentColor"
        opacity=".4"
      />
    </svg>
  );
}

const CHARACTERS = [
  {
    name: "The daydreamer",
    note: "A softer side of adventure.",
    appearance: {
      hairstyle: "bob",
      skinColor: "#E8BA99",
      hairColor: "#493A2D",
      outfitStyle: "knit",
      outfitColor: "#B89A77",
      accessories: "earrings",
      accessoryColor: "#AD8951",
      backgroundColor: "#E7DDCB",
      backdrop: "halo",
      expression: "calm",
      pose: "relaxed",
    },
  },
  {
    name: "The explorer",
    note: "Made for the unexpected.",
    appearance: {
      hairstyle: "curly",
      skinColor: "#8B563E",
      hairColor: "#33241E",
      outfitStyle: "jacket",
      outfitColor: "#795548",
      accessories: "none",
      backgroundColor: "#E7D2AF",
      backdrop: "halo",
      expression: "grin",
      pose: "wave",
    },
  },
  {
    name: "The original",
    note: "A little character. All yours.",
    appearance: {
      hairstyle: "swept",
      skinColor: "#D9A17D",
      hairColor: "#392C25",
      outfitStyle: "hoodie",
      outfitColor: "#9A6850",
      accessories: "glasses",
      accessoryColor: "#A1865A",
      backgroundColor: "#E9D9CD",
      backdrop: "halo",
      expression: "smile",
      pose: "relaxed",
    },
  },
];

function LandingPage({ onStart, signedIn }) {
  const root = useRef(null);
  useEffect(() => {
    if (
      !root.current ||
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const nodes = root.current.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove("fq-waiting");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    nodes.forEach((node) => {
      node.classList.add("fq-waiting");
      observer.observe(node);
    });
    return () => {
      observer.disconnect();
      nodes.forEach((node) => node.classList.remove("fq-waiting"));
    };
  }, []);

  return (
    <main className="fq-home" ref={root}>
      <a className="fq-skip-link" href="#fq-main">
        Skip to content
      </a>
      <header className="fq-home-header">
        <nav className="fq-home-nav" aria-label="Main navigation">
          <a href="#" className="fq-wordmark" aria-label="FaceQuest home">
            <Compass />
            FACEQUEST<span>®</span>
          </a>
          <div className="fq-home-links">
            <a href="#experiences">The experience</a>
            <a href="#characters">Your character</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <button className="fq-home-nav-cta" onClick={onStart}>
            {signedIn ? "My dashboard" : "Enter FaceQuest"}
            <span aria-hidden="true">↗</span>
          </button>
        </nav>
      </header>

      <section className="fq-home-hero fq-home-container" id="fq-main">
        <div className="fq-home-copy" data-reveal>
          <span className="fq-editorial-label">
            <i /> A WORLD OF LITTLE DISCOVERIES
          </span>
          <h1>
            A little adventure.
            <br />
            <em>A lot more you.</em>
          </h1>
          <p>
            Step out of the ordinary. Follow your curiosity, take on a quest,
            and create a character that’s unmistakably yours.
          </p>
          <div className="fq-home-actions">
            <button className="fq-home-button" onClick={onStart}>
              Start your adventure <span aria-hidden="true">↗</span>
            </button>
            <a className="fq-home-text-link" href="#experiences">
              Take a look around <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="fq-home-micro">
            <span className="fq-home-mini-seal">
              <Compass />
            </span>
            <span>
              A small escape.
              <br />
              <strong>A world of possibility.</strong>
            </span>
          </div>
        </div>
        <div className="fq-hero-art" data-reveal>
          <div className="fq-hero-art-top">
            <span>THE ART OF BEING YOU</span>
            <span>EST. 2026</span>
          </div>
          <div className="fq-hero-orbit" />
          <div className="fq-hero-orbit fq-hero-orbit-inner" />
          <span className="fq-hero-star" aria-hidden="true">
            ✳
          </span>
          <div className="fq-hero-character">
            <AvatarArtwork
              appearance={CHARACTERS[1].appearance}
              transparent
              title="An explorer with curly hair and an olive jacket"
            />
          </div>
          <div className="fq-hero-note">
            <span>YOUR NEXT CHAPTER</span>
            <strong>
              Curiosity looks
              <br />
              <em>good on you.</em>
            </strong>
          </div>
          <div className="fq-hero-xp">
            <span aria-hidden="true">✧</span>
            <div>
              <strong>Play. Discover. Grow.</strong>
              <small>Collect XP with every new quest.</small>
            </div>
          </div>
          <span className="fq-hero-coordinate">01 / ENDLESS POSSIBILITIES</span>
        </div>
      </section>

      <div className="fq-home-band">
        <div className="fq-home-container">
          <span>FOLLOW YOUR CURIOSITY</span>
          <b aria-hidden="true">✳</b>
          <span>MAKE IT YOUR OWN</span>
          <b aria-hidden="true">✳</b>
          <span>A LITTLE MORE EVERY DAY</span>
          <b aria-hidden="true">✳</b>
        </div>
      </div>

      <section
        className="fq-home-experiences fq-home-container"
        id="experiences"
      >
        <div className="fq-home-section-heading" data-reveal>
          <div>
            <span className="fq-editorial-label">
              01 / SOMETHING TO GET LOST IN
            </span>
            <h2>
              Ordinary day.
              <br />
              <em>Extraordinary detour.</em>
            </h2>
          </div>
          <p>
            A puzzle to solve. A moment to capture. A door to somewhere new.
            There’s always another way to play.
          </p>
        </div>
        <div className="fq-experience-grid">
          {[
            {
              kind: "puzzle",
              number: "01",
              tag: "THINK A LITTLE",
              title: "A curious challenge",
              copy: "Follow the pattern, piece it together, and discover what’s waiting on the other side.",
              meta: "Memory & puzzle quests",
            },
            {
              kind: "camera",
              number: "02",
              tag: "SEE THINGS DIFFERENTLY",
              title: "A moment worth keeping",
              copy: "Explore through guided camera missions. Choose the moments you want to save to your gallery.",
              meta: "Camera adventures",
            },
            {
              kind: "portal",
              number: "03",
              tag: "GO SOMEWHERE NEW",
              title: "One more discovery",
              copy: "Find hidden artifacts, restore a portal, and let one small quest lead to the next.",
              meta: "Exploration & rewards",
            },
          ].map((item) => (
            <button
              className={`fq-experience-card fq-experience-${item.kind}`}
              key={item.kind}
              onClick={onStart}
              data-reveal
            >
              <div className="fq-experience-art">
                <span>{item.number} / FIELD NOTES</span>
                <QuestArt kind={item.kind} />
                <i aria-hidden="true">↗</i>
              </div>
              <div className="fq-experience-copy">
                <small>{item.tag}</small>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
                <span>
                  {item.meta} <b aria-hidden="true">→</b>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="fq-home-character-section" id="characters">
        <div className="fq-home-container">
          <div className="fq-home-section-heading" data-reveal>
            <div>
              <span className="fq-editorial-label">
                02 / A CHARACTER ALL YOUR OWN
              </span>
              <h2>
                Same you.
                <br />
                <em>A little more character.</em>
              </h2>
            </div>
            <div>
              <p>
                Pick the hair. Find your style. Add the finishing touch. Start
                with free pieces and unlock more with the XP you earn.
              </p>
              <button className="fq-home-text-link" onClick={onStart}>
                Find your look <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
          <div className="fq-character-grid">
            {CHARACTERS.map((character, index) => (
              <article
                className={`fq-character-card fq-character-${index}`}
                key={character.name}
                data-reveal
              >
                <div className="fq-character-frame">
                  <span>CHARACTER STUDY / 0{index + 1}</span>
                  <AvatarArtwork
                    appearance={character.appearance}
                    transparent
                    title={character.name}
                  />
                  <span className="fq-character-stamp" aria-hidden="true">
                    ✳
                  </span>
                </div>
                <div>
                  <h3>{character.name}</h3>
                  <p>{character.note}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="fq-character-footnote">
            A few possibilities, for inspiration. Some styles unlock with XP.
          </p>
        </div>
      </section>

      <section className="fq-home-how fq-home-container" id="how-it-works">
        <div className="fq-home-section-heading" data-reveal>
          <div>
            <span className="fq-editorial-label">
              03 / AN EASY PLACE TO BEGIN
            </span>
            <h2>
              Your next chapter,
              <br />
              <em>in three little steps.</em>
            </h2>
          </div>
          <p>
            No perfect strategy required.
            <br />
            Just a little curiosity.
          </p>
        </div>
        <ol className="fq-how-grid">
          {[
            [
              "Make an entrance.",
              "Create your account and a character that feels like you.",
            ],
            [
              "Follow a little curiosity.",
              "Choose a mission, explore something new, and earn XP along the way.",
            ],
            [
              "Make it your own.",
              "Unlock avatar pieces, exchange XP for demo coupons, and keep your favourite moments in a private gallery.",
            ],
          ].map(([title, copy], index) => (
            <li key={title} data-reveal>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="fq-home-invitation fq-home-container" data-reveal>
        <Compass />
        <span className="fq-editorial-label">
          THERE’S A LITTLE EXPLORER IN EVERYONE
        </span>
        <h2>
          Go on.
          <br />
          <em>See where it takes you.</em>
        </h2>
        <button className="fq-home-button" onClick={onStart}>
          {signedIn ? "Back to your adventure" : "Begin your story"}
          <span aria-hidden="true">↗</span>
        </button>
        <p>Your character. Your curiosity. Your quest.</p>
      </section>
      <footer className="fq-home-footer fq-home-container">
        <a className="fq-wordmark" href="#">
          <Compass />
          FACEQUEST<span>®</span>
        </a>
        <p>Made for curious minds & a little escape.</p>
        <a href="#fq-main">Back to the beginning ↑</a>
      </footer>
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="app-loading fq-premium-loading">
      <Compass />
      <span className="fq-editorial-label">A LITTLE ADVENTURE AWAITS</span>
      <h2>Opening your next chapter.</h2>
      <span
        className="fq-loading-line"
        role="status"
        aria-label="Loading FaceQuest"
      />
    </main>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      return localStorage.getItem("facequest-token")
        ? JSON.parse(localStorage.getItem("facequest-demo-profile") || "null")
        : null;
    } catch {
      return null;
    }
  });
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [avatarChecking, setAvatarChecking] = useState(() =>
    Boolean(localStorage.getItem("facequest-token")),
  );
  const [avatarError, setAvatarError] = useState("");

  async function loadAvatar(userProfile, signal) {
    const token = localStorage.getItem("facequest-token");
    if (!token) throw new Error("Please log in again to continue.");
    const response = await fetch(`${API_BASE}/api/avatar`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(60000)])
        : AbortSignal.timeout(60000),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(
        data.message || "Could not load your avatar. Please retry.",
      );
    if (signal?.aborted) return;
    setProfile(userProfile);
    setShowAvatarCreator(!data.avatar);
    setStarted(true);
  }
  async function handleAuthSuccess(userProfile) {
    setProfile(userProfile);
    setAvatarChecking(true);
    setAvatarError("");
    try {
      await loadAvatar(userProfile);
    } catch (error) {
      setAvatarError(error.message);
    } finally {
      setAvatarChecking(false);
    }
  }
  function handleLogout() {
    localStorage.removeItem("facequest-token");
    localStorage.removeItem("facequest-demo-profile");
    setProfile(null);
    setStarted(false);
    setShowAvatarCreator(false);
    setAvatarError("");
    setAvatarChecking(false);
  }
  useEffect(() => {
    const token = localStorage.getItem("facequest-token");
    if (!token) return;
    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(60000),
          ]),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.user)
          throw new Error(data.message || "Please log in again to continue.");
        const restored = {
          ...data.user,
          name: data.user.username || data.user.name,
        };
        localStorage.setItem(
          "facequest-demo-profile",
          JSON.stringify(restored),
        );
        await loadAvatar(restored, controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) setAvatarError(error.message);
      } finally {
        if (!controller.signal.aborted) setAvatarChecking(false);
      }
    })();
    return () => controller.abort();
  }, []);

  let screen;
  if (avatarChecking) screen = <LoadingScreen />;
  else if (avatarError)
    screen = (
      <main className="app-loading fq-premium-loading">
        <Compass />
        <h2>Let’s pick up where you left off.</h2>
        <p role="alert">{avatarError}</p>
        <button
          className="fq-home-button"
          onClick={() =>
            profile ? handleAuthSuccess(profile) : handleLogout()
          }
        >
          Try again ↗
        </button>
        <button className="fq-home-text-link" onClick={handleLogout}>
          Log out
        </button>
      </main>
    );
  else if (started && profile && showAvatarCreator)
    screen = (
      <AvatarCreator
        onComplete={() => setShowAvatarCreator(false)}
        onBack={handleLogout}
      />
    );
  else if (started && profile)
    screen = (
      <DashboardPage
        key={profile.id ?? profile.email}
        playerId={profile.id ?? profile.userId ?? profile._id ?? profile.email}
        playerName={profile.name || profile.username}
        playerEmail={profile.email}
        playerXP={profile.xp}
        playerLevel={profile.level}
        onLogout={handleLogout}
        onBack={() => setStarted(false)}
      />
    );
  else if (started) screen = <AuthPage onSuccess={handleAuthSuccess} />;
  else
    screen = (
      <LandingPage
        onStart={() => setStarted(true)}
        signedIn={Boolean(profile)}
      />
    );
  return <Suspense fallback={<LoadingScreen />}>{screen}</Suspense>;
}