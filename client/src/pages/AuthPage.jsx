
import { useState } from "react";

export default function AuthPage({ onSuccess }) {
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");


    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        const cleanEmail = email.trim().toLowerCase();
        const cleanUsername = name.trim();

        if (
            mode === "register" &&
            !/^[a-zA-Z0-9_]{3,50}$/.test(cleanUsername)
        ) {
            setError("Username must be 3–50 letters, numbers, or underscores.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError("Enter a valid email address.");
            return;
        }

        if (password.length < 8 || password.length > 72) {
            setError("Password must be 8–72 characters.");
            return;
        }

        try {
            const endpoint =
            mode === "register"
                ? "/api/auth/register"
                : "/api/auth/login";

            const payload =
            mode === "register"
                ? {
                    username: cleanUsername,
                    email: cleanEmail,
                    password,
                    referralCode: referralCode.trim().toUpperCase(),
                  }
                : { email: cleanEmail, password };

            const response = await fetch(
            `http://localhost:5000${endpoint}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(data.message || "Authentication failed.");
            }

            if (!data.token || !data.user) {
            throw new Error("The server returned an invalid response.");
            }

            const profile = {
            id: data.user.id,
            name: data.user.username,
            username: data.user.username,
            email: data.user.email,
            xp: data.user.xp,
            level: data.user.level,
            };

            localStorage.setItem("facequest-token", data.token);
            localStorage.setItem(
            "facequest-demo-profile",
            JSON.stringify(profile)
            );

            onSuccess(profile);
        } catch (error) {
            setError(
            error.message === "Failed to fetch"
                ? "Cannot reach FaceQuest server. Make sure the backend is running."
                : error.message || "Something went wrong."
            );
        } finally {
            setLoading(false);
        }   
    }


  return (
    <main className="auth-page">
      <nav className="auth-nav">
        <a className="auth-logo" href="/">
          FACEQUEST<span>.</span>
        </a>
        <span className="auth-nav-label">
          PLAYER IDENTITY SYSTEM
        </span>
      </nav>

      <section className="auth-layout">
        <div className="auth-story">
          <div className="auth-kicker">
            <span /> THE NEXT LEVEL STARTS HERE
          </div>

          <h1>
            Your legend.
            <br />
            <span>Your universe.</span>
          </h1>

          <p>
            Enter a world of exploration, puzzles, digital
            artifacts, and personalized avatar rewards.
            Every mission brings you closer to your next level.
          </p>

          <div className="auth-stats">
            <div>
              <strong>EXPLORE</strong>
              <span>Unknown worlds</span>
            </div>
            <div>
              <strong>COLLECT</strong>
              <span>Rare artifacts</span>
            </div>
            <div>
              <strong>LEVEL UP</strong>
              <span>Earn your legend</span>
            </div>
          </div>
        </div>

        <section className="auth-card">
          <div className="auth-card-top">
            <span>PLAYER ACCESS</span>
            <span>PROTOCOL 01</span>
          </div>

          <h2>
            {mode === "register"
              ? "Create your account"
              : "Welcome back"}
          </h2>

          <p className="auth-subtitle">
            {mode === "register"
              ? "Build your identity and begin your quest."
              : "Your next adventure is waiting."}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === "login" ? "selected" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              LOGIN
            </button>

            <button
              type="button"
              className={mode === "register" ? "selected" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              REGISTER
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <label className="auth-field">
                PLAYER NAME
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </label>
            )}

            <label className="auth-field">
              EMAIL ADDRESS
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="auth-field">
              PASSWORD
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete={
                  mode === "register"
                    ? "new-password"
                    : "current-password"
                }
                minLength={8}
                required
              />
            </label>

            {mode === "register" && (
              <label className="auth-field">
                REFERRAL CODE (OPTIONAL)
                <input
                  value={referralCode}
                  onChange={(event) => setReferralCode(event.target.value)}
                  placeholder="Enter a friend's code"
                  autoComplete="off"
                />
              </label>
            )}

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
                { loading
                ? "CONNECTING..."
                :mode === "register"
                    ? "CREATE PLAYER PROFILE"
                    : "ENTER FACEQUEST"}
              <span>↗</span>
            </button>
          </form>

          <p className="auth-privacy">
            DEMO ACCESS · NO PASSWORD IS SAVED
          </p>
        </section>
      </section>
    </main>
  );
}
