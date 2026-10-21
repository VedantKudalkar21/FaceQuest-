
import { useState } from "react";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import AvatarCreator from "./features/avatar/AvatarCreator";
import "./index.css";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [started, setStarted] = useState(false);
  const [showAvatarCreator, setShowAvatarCreator] = useState(false);
  const [avatarChecking, setAvatarChecking] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profile, setProfile] = useState(() => {
    try {
      if (!localStorage.getItem("facequest-token")) return null;

      const saved = localStorage.getItem("facequest-demo-profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  async function handleAuthSuccess(userProfile) {
    setAvatarChecking(true);
    setAvatarError("");

    try {
      const token = localStorage.getItem("facequest-token");

      if (!token) {
        throw new Error("Login session not found. Please log in again.");
      }

      const response = await fetch(`${API_BASE}/api/avatar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to check your saved avatar."
        );
      }

      setProfile(userProfile);
      setStarted(true);
      setShowAvatarCreator(!data.avatar);
    } catch (error) {
      setAvatarError(
        error.message || "Unable to connect to the FaceQuest server."
      );
    } finally {
      setAvatarChecking(false);
    }
  }

  function handleAvatarComplete() {
    setShowAvatarCreator(false);
    setAvatarError("");
  }

  function handleLogout() {
    setProfile(null);
    setStarted(false);
    setShowAvatarCreator(false);
    setAvatarError("");
    localStorage.removeItem("facequest-token");
    localStorage.removeItem("facequest-demo-profile");
  }

  // Restore an existing session and check whether its avatar exists.
  // This also handles refreshing the page while logged in.
  async function checkExistingSession() {
    const token = localStorage.getItem("facequest-token");

    if (!token || !profile) return;

    setAvatarChecking(true);
    setAvatarError("");

    try {
      const response = await fetch(`${API_BASE}/api/avatar`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to check your avatar.");
      }

      setStarted(true);
      setShowAvatarCreator(!data.avatar);
    } catch (error) {
      setAvatarError(
        error.message || "Unable to connect to the FaceQuest server."
      );
    } finally {
      setAvatarChecking(false);
    }
  }

  // A saved session should be checked when the app first opens.
  // The effect is intentionally not used here; session restoration
  // is handled by the initial screen below.

  if (avatarChecking) {
    return (
      <main className="app-loading">
        <p>Preparing your FaceQuest adventure...</p>
      </main>
    );
  }

  if (avatarError) {
    return (
      <main className="app-loading">
        <h2>Couldn't load your avatar</h2>
        <p>{avatarError}</p>
        <button
          className="start-button"
          onClick={() => {
            setAvatarError("");
            if (profile) {
              checkExistingSession();
            } else {
              setStarted(true);
            }
          }}
        >
          Try again
        </button>
        <button
          className="avatar-back-button"
          onClick={handleLogout}
        >
          Log out
        </button>
      </main>
    );
  }

  if (started && profile && showAvatarCreator) {
    return (
      <AvatarCreator
        onComplete={handleAvatarComplete}
        onBack={handleLogout}
      />
    );
  }

  if (started && profile) {
    return (
      <DashboardPage
       playerId={
        profile.id ??
        profile.userId ??
        profile._id ??
        profile.email
       }
        playerName={profile.name}
        playerEmail={profile.email}
        playerXP={profile.xp}
        playerLevel={profile.level}
        onLogout={handleLogout}
        onBack={() => setStarted(false)}
      />
    );
  }

  if (started) {
    return <AuthPage onSuccess={handleAuthSuccess} />;
  }

  return (
    <main className="app">
      <nav className="navbar">
        <a className="logo" href="/">
          FACEQUEST<span>.</span>
        </a>
        <span className="nav-label">YOUR NEXT ADVENTURE</span>
      </nav>

      <section className="hero">
        <div className="eyebrow">✦ YOUR STORY STARTS HERE</div>

        <h1>
          Explore worlds.
          <br />
          <span>Forge your legend.</span>
        </h1>

        <p className="description">
          Solve mysteries, discover lost artifacts, unlock
          legendary outfits, and build your own digital identity.
        </p>

        <button
          className="start-button"
          onClick={() => setStarted(true)}
        >
          Start your adventure →
        </button>

        <div className="features">
          <div className="feature">
            <span>01</span>
            <h3>Explore</h3>
            <p>Discover mysterious worlds.</p>
          </div>

          <div className="feature">
            <span>02</span>
            <h3>Complete</h3>
            <p>Master quests and earn XP.</p>
          </div>

          <div className="feature">
            <span>03</span>
            <h3>Collect</h3>
            <p>Unlock unique avatar rewards.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
