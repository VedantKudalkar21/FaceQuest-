import CameraMission from "../features/camera/CameraMission";
import CrystalPuzzle from "../features/games/CrystalPuzzle";
import FaceExplorerMission from "../features/camera/FaceExplorerMission";
import FocusBridgeMission from "../features/camera/FocusBridgeMission";
import DragonsEyeMission from "../features/camera/DragonsEyeMission";
import MirrorMazeMission from "../features/camera/MirrorMazeMission";
import StarshipMission from "../features/camera/StarshipMission";
import LostPortraitsMission from "../features/camera/LostPortraitsMission";
import RhythmRealmMission from "../features/camera/RhythmRealmMission";
import AvatarStudio from "../features/avatar/AvatarStudio";
import "./DashboardPolish.css";
import FrontierExplorer from "../features/games/FrontierExplorer";
import PortalRestoration from "../features/games/PortalRestoration";
import { useEffect, useRef, useState } from "react";
import GalleryPage from "../features/gallery/GalleryPage";
import RedeemStore from "../features/rewards/RedeemStore";

const initialMissions = [
  {
    id: 1,
    title: "The Crystal Puzzle",
    world: "The Lost Temple",
    description:
      "Decode an ancient signal and recover the energy crystal hidden inside the temple.",
    xp: 300,
    reward: "Crystal Key",
    icon: "◇",
    difficulty: "EASY",
    type: "PUZZLE",
  },
  {
    id: 2,
    title: "Explore the Frontier",
    world: "The Neon Frontier",
    description:
      "Scan an unexplored sector and discover a new artifact for your collection.",
    xp: 150,
    reward: "Neon Badge",
    icon: "⌘",
    difficulty: "MEDIUM",
    type: "EXPLORATION",
  },
  {
    id: 3,
    title: "Restore the Portal",
    world: "The Lost Temple",
    description:
      "Reactivate the dormant portal and prepare for your next interstellar journey.",
    xp: 200,
    reward: "Portal Shard",
    icon: "✧",
    difficulty: "HARD",
    type: "MISSION",
  },
  {
    id: 4,
    title: "Light Seeker",
    world: "The Solar Spire",
    description:
      "Capture a clear image with balanced lighting to calibrate optical sensors.",
    xp: 200,
    reward: "Radiant Crystal",
    icon: "☀",
    difficulty: "EASY",
    type: "camera",
  },
  {
    id: 5,
    title: "The Face Explorer",
    world: "The Neon Frontier",
    description: "Complete six guided face-angle checkpoints.",
    xp: 300,
    reward: "Explorer Badge",
    icon: "◎",
    difficulty: "MEDIUM",
    type: "face-explorer",
  },
  {
    id: 6,
    title: "Focus Bridge",
    world: "The Neon Frontier",
    description: "Focus on checkpoints and cross the glowing bridge.",
    xp: 200,
    reward: "Focus Crystal",
    icon: "✦",
    difficulty: "EASY",
    type: "focus-bridge",
  },
  {
    id: 7,
    title: "Dragon's Eye",
    world: "The Crystal Caverns",
    description: "Charge magical fireballs and defeat the crystal guardian.",
    xp: 250,
    reward: "Dragon Crystal",
    icon: "🐉",
    difficulty: "MEDIUM",
    type: "dragons-eye",
  },
  {
    id: 8,
    title: "Mirror Maze",
    world: "The Enchanted Labyrinth",
    description: "Guide a magical beam through five mirror checkpoints.",
    xp: 250,
    reward: "Mirror Shard",
    icon: "🪞",
    difficulty: "MEDIUM",
    type: "mirror-maze",
  },
  {
    id: 9,
    title: "Starship Navigator",
    world: "The Cosmic Frontier",
    description: "Steer through five gates and navigate the galaxy.",
    xp: 250,
    reward: "Starship Badge",
    icon: "🚀",
    difficulty: "MEDIUM",
    type: "starship",
  },
  {
    id: 10,
    title: "The Lost Portraits",
    world: "The Royal Archive",
    description:
      "Restore five magical portraits with guided camera challenges.",
    xp: 250,
    reward: "Royal Portrait Badge",
    icon: "🖼️",
    difficulty: "MEDIUM",
    type: "lost-portraits",
  },
  {
    id: 11,
    title: "Rhythm of the Realm",
    world: "The Musical Realm",
    description: "Hit glowing beats, build combos, and restore five melodies.",
    xp: 250,
    reward: "Rhythm Crown",
    icon: "🎵",
    difficulty: "MEDIUM",
    type: "rhythm-realm",
  },
];

function MissionSymbol({ id }) {
  const paths = {
    1: (
      <>
        <path d="m12 3 8 9-8 9-8-9 8-9Z" />
        <path d="m12 7 4 5-4 5-4-5 4-5Z" />
      </>
    ),
    2: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z" />
      </>
    ),
    3: (
      <>
        <path d="M6 21V9a6 6 0 0 1 12 0v12H6Z" />
        <path d="M9 21V9a3 3 0 0 1 6 0v12M4 21h16" />
      </>
    ),
    4: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
    5: (
      <>
        <rect x="4" y="6" width="16" height="14" rx="3" />
        <circle cx="12" cy="13" r="4" />
        <path d="m8 6 2-3h4l2 3" />
      </>
    ),
    6: (
      <>
        <path d="M3 18h18M4 18V9m16 9V9M4 10q8 8 16 0M8 13v5m4-3v3m4-5v5" />
      </>
    ),
    7: (
      <>
        <path d="M2 12q10-13 20 0-10 13-20 0Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    8: (
      <>
        <path d="M3 3h18v18H3V3Zm4 0v10h6v4h8M7 7h10v6M3 17h6m4 4v-4" />
      </>
    ),
    9: (
      <>
        <path d="m12 3 5 10-5-2-5 2 5-10Zm0 8v10M3 7l2 2m14 7 2 2M3 19h3m13-15h2" />
      </>
    ),
    10: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <circle cx="12" cy="9" r="3" />
        <path d="M7 18v-2a5 5 0 0 1 10 0v2" />
      </>
    ),
    11: (
      <>
        <path d="M9 18V5l10-2v13M9 8l10-2" />
        <ellipse cx="6" cy="18" rx="3" ry="2" />
        <ellipse cx="16" cy="16" rx="3" ry="2" />
      </>
    ),
  };
  return (
    <svg
      className="fq-mission-symbol"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[id] || paths[1]}
    </svg>
  );
}

export default function DashboardPage({
  playerId,
  playerName = "Explorer",
  playerEmail = "",
  playerXP = 0,
  playerLevel = 1,
  onLogout,
  onBack,
}) {
  const accountKey = String(playerId || playerEmail || "guest").toLowerCase();

  const [missions, setMissions] = useState(initialMissions);
  const [xp, setXp] = useState(0);
  const [availableXP, setAvailableXP] = useState(0);
  const [progressError, setProgressError] = useState("");
  const [pendingClaims, setPendingClaims] = useState([]);
  const [claimingRewards, setClaimingRewards] = useState(false);
  const pendingRef = useRef([]);
  const draining = useRef(false);
  const alive = useRef(false);
  const pendingKey = `facequest-pending-claims-${accountKey}`;
  const [rewards, setRewards] = useState([]);
  const [notice, setNotice] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [activeCameraMission, setActiveCameraMission] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);
  const [showCrystalPuzzle, setShowCrystalPuzzle] = useState(false);
  const [activeGameMission, setActiveGameMission] = useState(null);
  const [showFaceExplorer, setShowFaceExplorer] = useState(false);
  const [showFocusBridge, setShowFocusBridge] = useState(false);
  const [showDragonsEye, setShowDragonsEye] = useState(false);
  const [showMirrorMaze, setShowMirrorMaze] = useState(false);
  const [showStarship, setShowStarship] = useState(false);
  const [showLostPortraits, setShowLostPortraits] = useState(false);
  const [showRhythmRealm, setShowRhythmRealm] = useState(false);
  const [showAvatarStudio, setShowAvatarStudio] = useState(false);
  const [showRedeemStore, setShowRedeemStore] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [weeklyRewardStatus, setWeeklyRewardStatus] = useState(null);
  const [dailyRewardLoading, setDailyRewardLoading] = useState(false);
  const [dailyRewardError, setDailyRewardError] = useState("");
  const [showFrontierExplorer, setShowFrontierExplorer] = useState(false);
  const [showPortalRestoration, setShowPortalRestoration] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const API_BASE = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
  ).replace(/\/+$/, "");

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [dailyReward, setDailyReward] = useState(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardError, setRewardError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    if (!profileOpen) return;
    function dismiss(event) {
      if (!accountMenuRef.current?.contains(event.target)) setProfileOpen(false);
    }
    function escape(event) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        accountButtonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [profileOpen]);

  function applyWallet(wallet) {
    setXp(wallet.totalXP);
    setAvailableXP(wallet.availableXP);
  }

  function applyProgress(data) {
    applyWallet(data.wallet);
    setRewards(data.rewards);
    setMissions(
      initialMissions.filter(
        (mission) => !data.completedMissionIds.includes(mission.id),
      ),
    );
    setProgressLoaded(true);
  }

  async function progressRequest(
    path = "/progress",
    body,
    token = localStorage.getItem("facequest-token"),
  ) {
    const response = await fetch(`${API_BASE}/api/avatar${path}`, {
      method: body ? "POST" : "GET",
      signal: AbortSignal.timeout(60000),
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(data.message || "Could not sync your XP. Please retry.");
    if (!data.wallet || !Array.isArray(data.completedMissionIds))
      throw new Error(
        "Update the avatar backend and run avatar_shop.sql first.",
      );
    return data;
  }

  async function refreshProgress() {
    try {
      const data = await progressRequest();
      if (alive.current) {
        applyProgress(data);
        setProgressError("");
      }
    } catch (error) {
      if (alive.current) setProgressError(error.message);
    }
  }

  function savePending(ids) {
    pendingRef.current = ids;
    setPendingClaims(ids);
    try {
      localStorage.setItem(pendingKey, JSON.stringify(ids));
    } catch {
      setProgressError(
        "Keep this page open until your pending reward is synced.",
      );
    }
  }

  async function drainClaims() {
    if (draining.current || !alive.current) return;
    draining.current = true;
    setClaimingRewards(true);
    const token = localStorage.getItem("facequest-token");
    try {
      while (pendingRef.current.length && alive.current) {
        const id = pendingRef.current[0];
        const data = await progressRequest(
          "/mission-reward",
          { missionId: id },
          token,
        );
        if (!alive.current) return;
        applyProgress(data);
        savePending(pendingRef.current.filter((value) => value !== id));
        setProgressError("");
        setNotice(
          data.awardedXP
            ? `${data.mission.title} completed! +${data.awardedXP} XP saved.`
            : `${data.mission.title}: today's XP was already claimed. Thanks for playing again!`,
        );
      }
    } catch (error) {
      if (alive.current)
        setProgressError(
          `${error.message} Your mission reward is pending; retry below.`,
        );
    } finally {
      draining.current = false;
      if (alive.current) setClaimingRewards(false);
    }
  }

  useEffect(() => {
    alive.current = true;
    setProgressLoaded(false);
    // Historical browser-only XP stays untouched in its original localStorage key.
    // Only server-issued rewards can fund the new wallet.
    try {
      const saved = JSON.parse(localStorage.getItem(pendingKey) || "[]");
      pendingRef.current = Array.isArray(saved)
        ? [
            ...new Set(
              saved.filter((id) => Number.isInteger(id) && id >= 1 && id <= 11),
            ),
          ]
        : [];
      setPendingClaims(pendingRef.current);
    } catch {
      pendingRef.current = [];
    }
    refreshProgress().then(() => {
      if (alive.current) drainClaims();
    });
    const sync = () => {
      if (document.visibilityState === "visible" && !draining.current)
        refreshProgress();
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    const timer = window.setInterval(sync, 60000);
    return () => {
      alive.current = false;
      clearInterval(timer);
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [pendingKey]);

  useEffect(() => {
    if (!progressLoaded) return;

    const token = localStorage.getItem("facequest-token");
    if (!token) return;

    let cancelled = false;

    async function checkDailyReward() {
      try {
        const response = await fetch(
          `${API_BASE}/api/auth/daily-reward/status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not check daily reward.");
        }

        if (cancelled) return;

        setDailyReward(data);
        setRewardClaimed(!data.canClaim);
        setShowDailyReward(data.canClaim);
        console.log("Daily reward status:", data);
      } catch (error) {
        if (!cancelled) {
          setRewardError(error.message || "Could not load daily reward.");
        }
      }
    }

    checkDailyReward();

    return () => {
      cancelled = true;
    };
  }, [progressLoaded, accountKey]);

  async function claimDailyReward() {
    const token = localStorage.getItem("facequest-token");
    if (!token || rewardLoading) return;

    setRewardLoading(true);
    setRewardError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/daily-reward/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to claim reward.");
      }

      await refreshProgress();
      setDailyReward(data);
      setRewardClaimed(true);
      setShowDailyReward(false);
    } catch (error) {
      setRewardError(error.message || "Unable to claim reward.");
    } finally {
      setRewardLoading(false);
    }
  }

  async function openReferral() {
    const token = localStorage.getItem("facequest-token");

    setShowReferral(true);
    setRewardError("");
    setReferralCode("");

    if (!token) {
      setRewardError("Please log in again to view your referral code.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not load referral code.");
      }

      const code = data.user?.referralCode || data.user?.referral_code;

      if (!code) {
        setRewardError(
          "Your account has no referral code yet. Please check your account in the database.",
        );
        return;
      }

      setReferralCode(code);
    } catch (error) {
      setRewardError(error.message || "Could not load referral code.");
    }
  }

  const completedCount = rewards.length;
  const totalMissionsCount = initialMissions.length;
  const level = Math.floor(xp / 300) + 1;
  const currentLevelXP = xp % 300;
  const progress = (currentLevelXP / 300) * 100;
  const featuredMission = missions[0];

  function completeMission(mission) {
    if (!mission || !alive.current) return;
    if (!pendingRef.current.includes(mission.id))
      savePending([...pendingRef.current, mission.id]);
    setNotice("Mission completed. Saving your XP…");
    drainClaims();
  }

  function startMission(mission) {
    if (!progressLoaded) {
      setProgressError("Load your XP balance before starting a mission.");
      return;
    }
    if (mission.type === "camera") {
      setActiveCameraMission(mission);
      setShowCamera(true);
      return;
    }

    if (mission.id === 5) {
      setShowFaceExplorer(true);
      return;
    }

    if (mission.id === 6) {
      setShowFocusBridge(true);
      return;
    }

    if (mission.id === 7) {
      setShowDragonsEye(true);
      return;
    }

    if (mission.id === 8) {
      setShowMirrorMaze(true);
      return;
    }

    if (mission.id === 9) {
      setShowStarship(true);
      return;
    }

    if (mission.id === 10) {
      setShowLostPortraits(true);
      return;
    }

    if (mission.id === 11) {
      setShowRhythmRealm(true);
      return;
    }

    if (mission.id === 1) {
      setActiveGameMission(mission);
      setShowCrystalPuzzle(true);
      return;
    }

    if (mission.id === 2) {
      setShowFrontierExplorer(true);
      return;
    }

    if (mission.id === 3) {
      setShowPortalRestoration(true);
      return;
    }

    completeMission(mission);
  }

  function replayMissions() {
    setMissions(initialMissions);
    setNotice(
      "Practice missions restored. Each mission awards XP once per UTC day; replays do not award extra XP.",
    );
  }

  if (showCrystalPuzzle) {
    return (
      <CrystalPuzzle
        onBack={() => {
          setShowCrystalPuzzle(false);
          setActiveGameMission(null);
        }}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 1));
          setShowCrystalPuzzle(false);
          setActiveGameMission(null);
        }}
      />
    );
  }

  if (showFaceExplorer) {
    return (
      <FaceExplorerMission
        onBack={() => setShowFaceExplorer(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 5));
          setShowFaceExplorer(false);
        }}
      />
    );
  }

  if (showFocusBridge) {
    return (
      <FocusBridgeMission
        onBack={() => setShowFocusBridge(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 6));
          setShowFocusBridge(false);
        }}
      />
    );
  }

  if (showDragonsEye) {
    return (
      <DragonsEyeMission
        onBack={() => setShowDragonsEye(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 7));
          setShowDragonsEye(false);
        }}
      />
    );
  }

  if (showMirrorMaze) {
    return (
      <MirrorMazeMission
        onBack={() => setShowMirrorMaze(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 8));
          setShowMirrorMaze(false);
        }}
      />
    );
  }

  if (showStarship) {
    return (
      <StarshipMission
        onBack={() => setShowStarship(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 9));
          setShowStarship(false);
        }}
      />
    );
  }

  if (showLostPortraits) {
    return (
      <LostPortraitsMission
        onBack={() => setShowLostPortraits(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 10));
          setShowLostPortraits(false);
        }}
      />
    );
  }

  if (showRhythmRealm) {
    return (
      <RhythmRealmMission
        onBack={() => setShowRhythmRealm(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 11));
          setShowRhythmRealm(false);
        }}
      />
    );
  }

  if (showFrontierExplorer) {
    return (
      <FrontierExplorer
        onBack={() => setShowFrontierExplorer(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 2));
          setShowFrontierExplorer(false);
        }}
      />
    );
  }

  if (showPortalRestoration) {
    return (
      <PortalRestoration
        onBack={() => setShowPortalRestoration(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 3));
          setShowPortalRestoration(false);
        }}
      />
    );
  }

  if (showCamera) {
    return (
      <CameraMission
        onBack={() => setShowCamera(false)}
        onComplete={() => {
          completeMission(initialMissions.find((mission) => mission.id === 4));
          setShowCamera(false);
          setActiveCameraMission(null);
        }}
      />
    );
  }

  if (showGallery) {
    return <GalleryPage onBack={() => setShowGallery(false)} />;
  }

  if (showAvatarStudio) {
    return (
      <AvatarStudio
        onWalletChange={applyWallet}
        onBack={() => {
          setShowAvatarStudio(false);
          refreshProgress();
        }}
      />
    );
  }

  if (showRedeemStore) {
    return (
      <RedeemStore
        onWalletChange={applyWallet}
        onBack={() => {
          setShowRedeemStore(false);
          refreshProgress();
        }}
      />
    );
  }

  return (
    <main className="dashboard sci-dashboard" id="dashboard">
      {showDailyReward && (
        <div className="fq-reward-overlay">
          <section className="fq-reward-modal" role="dialog" aria-modal="true">
            <div className="fq-reward-icon">🎁</div>
            <p className="fq-reward-kicker">DAILY LOGIN BONUS</p>
            <h2>Your daily reward is ready!</h2>
            <p>Claim your reward and keep your adventure going.</p>
            <div className="fq-reward-amount">+{dailyReward?.dailyXP ?? 50} XP</div>
            {dailyReward?.streakBonusXP > 0 && (
              <p>Streak bonus available: +{dailyReward.streakBonusXP} XP</p>
            )}
            {rewardError && <p role="alert">{rewardError}</p>}
            <button onClick={claimDailyReward} disabled={rewardLoading}>
              {rewardLoading ? "CLAIMING..." : "CLAIM DAILY REWARD"}
            </button>
            <button className="fq-reward-later" type="button" onClick={() => setShowDailyReward(false)}>
              Maybe later
            </button>
          </section>
        </div>
      )}

      <header className="dashboard-header sci-header">
        <div className="sci-header-left">
          <button className="back-button sci-back" onClick={onBack}>
            <span aria-hidden="true">←</span> Home
          </button>

          <div className="sci-online">
            <span className="sci-online-dot" />
            READY TO EXPLORE
          </div>
        </div>

        <a className="logo sci-logo" href="#dashboard">
          <div>
            FACE<span>QUEST</span>
          </div>
          <small>THE EXPLORER’S JOURNAL</small>
        </a>

        <div className="sci-header-right">
          {/* PLAYER PROFILE MENU */}
          <div className="sci-account" ref={accountMenuRef}>
            <button
              type="button"
              className="sci-account-button"
              ref={accountButtonRef}
              aria-controls="fq-account-panel"
              aria-label={`Player account: ${playerName}`}
              onClick={() => setProfileOpen((open) => !open)}
              aria-expanded={profileOpen}
            >
              <span className="sci-account-avatar">
                {(playerName || "E").charAt(0).toUpperCase()}
              </span>

              <span className="sci-account-label">
                <strong>{playerName}</strong>
                <small>LEVEL {level}</small>
              </span>

              <span className="sci-account-chevron">
                {profileOpen ? "▲" : "▼"}
              </span>
            </button>

            {profileOpen && (
              <nav className="sci-account-menu" id="fq-account-panel" aria-label="Player account">
                <div className="sci-account-details">
                  <strong>{playerName}</strong>
                  <span>{playerEmail || "No email available"}</span>
                  <span className="sci-account-xp-badge">
                    ✧ {xp} XP · Level {level}
                  </span>
                </div>

                <button
                  type="button"
                  className="sci-account-avatar-link"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowAvatarStudio(true);
                  }}
                >
                  <span>✦</span>
                  <span>
                    <strong>Avatar Studio</strong>
                    <small>Customize your look with XP</small>
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="sci-account-avatar-link"
                  onClick={() => {
                    setProfileOpen(false);
                    setShowRedeemStore(true);
                  }}
                >
                  <span aria-hidden="true">▱</span>
                  <span>
                    <strong>Redeem Store</strong>
                    <small>Exchange XP for demo coupons</small>
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="sci-account-avatar-link"
                  onClick={async () => {
                    setProfileOpen(false);
                    setDailyRewardError("");
                    setShowDailyRewards(true);
                    setDailyRewardLoading(true);

                    try {
                      const token = localStorage.getItem("facequest-token");
                      const response = await fetch(
                        `${API_BASE}/api/auth/daily-reward/status`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Could not load rewards.",
                        );
                      }

                      setWeeklyRewardStatus(data);
                    } catch (error) {
                      setDailyRewardError(error.message);
                    } finally {
                      setDailyRewardLoading(false);
                    }
                  }}
                >
                  <span aria-hidden="true">◇</span>
                  <span>
                    <strong>Daily Rewards</strong>
                    <small>Build your 7-day streak</small>
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="sci-account-avatar-link"
                  onClick={() => {
                    setProfileOpen(false);
                    setRewardError("");
                    openReferral();
                  }}
                >
                  <span aria-hidden="true">♧</span>
                  <span>
                    <strong>Refer a Friend</strong>
                    <small>Share your code and invite friends</small>
                  </span>
                  <span>→</span>
                </button>

                <button
                  type="button"
                  className="sci-account-logout"
                  onClick={onLogout}
                >
                  <span>↪</span> LOG OUT
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>

      <div className="sci-dashboard-content">
        <section className="fq-wallet-strip" aria-label="XP wallet">
          <div>
            <small>AVAILABLE TO SPEND</small>
            <strong>
              {progressLoaded ? availableXP.toLocaleString() : "…"} XP
            </strong>
          </div>
          <p>
            {xp.toLocaleString()} XP earned · Level {level}
            <br />
            Purchases keep your level. Mission XP resets daily at 00:00 UTC.
          </p>
          <button
            type="button"
            disabled={!progressLoaded}
            onClick={() => setShowRedeemStore(true)}
          >
            Visit Redeem Store →
          </button>
        </section>
        {progressError && (
          <div className="fq-progress-error" role="alert">
            {progressError}{" "}
            <button
              type="button"
              onClick={() => {
                refreshProgress();
                drainClaims();
              }}
            >
              Retry sync
            </button>
          </div>
        )}
        {!!pendingClaims.length && (
          <div className="fq-reward-sync" role="status">
            {pendingClaims.length} mission reward(s) pending.{" "}
            {claimingRewards ? (
              "Saving…"
            ) : (
              <button type="button" onClick={drainClaims}>
                Retry rewards
              </button>
            )}
          </div>
        )}
        <div className="fq-gallery-link-row">
          <button
            type="button"
            className="fq-gallery-button secondary"
            onClick={() => setShowGallery(true)}
          >
            ◎ My Gallery
          </button>
        </div>
        <section className="sci-welcome">
          <div className="sci-kicker">
            <span className="sci-kicker-line" />
            YOUR EXPLORER’S JOURNAL
          </div>

          <div className="sci-welcome-row">
            <div>
              <h1>
                Welcome back,
                <br />
                <span>{playerName}.</span>
              </h1>

              <p>
                Your next discovery is waiting. Choose a mission, collect
                artifacts, and expand your digital universe.
              </p>
            </div>

            <div className="sci-player-emblem" aria-label="Explorer emblem">
              <div className="sci-emblem-orbit sci-orbit-one" />
              <div className="sci-emblem-orbit sci-orbit-two" />
              <div className="sci-emblem-core">FQ</div>
              <span className="sci-emblem-label">EXPLORER</span>
            </div>
          </div>
        </section>

        {showReferral && (
          <section className="fq-referral-panel">
            <h2>Refer a Friend</h2>
            <p>Share your personal referral code with a friend.</p>

            <div className="fq-referral-code">
              {referralCode || "No referral code available"}
            </div>

            <button
              type="button"
              disabled={!referralCode}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(referralCode);
                  setNotice("Referral code copied!");
                } catch {
                  setRewardError(
                    "Couldn't copy the code. Please select and copy it.",
                  );
                }
              }}
            >
              Copy Referral Code
            </button>

            {rewardError && <p role="alert">{rewardError}</p>}

            <button type="button" onClick={() => setShowReferral(false)}>
              Close
            </button>
          </section>
        )}

        {showDailyRewards && (
          <section className="fq-weekly-rewards">
            <h2>Your 7-Day Reward Streak</h2>
            <p>Miss a day and your next claim starts again at Day 1.</p>

            {dailyRewardError && <p role="alert">{dailyRewardError}</p>}

            {dailyRewardLoading ? (
              <p>Loading rewards...</p>
            ) : (
              <>
                <div className="fq-week-grid">
                  {[50, 75, 100, 125, 150, 200, 300].map((amount, index) => {
                    const day = index + 1;
                    const currentDay = weeklyRewardStatus?.day || 1;
                    const claimedToday = weeklyRewardStatus?.claimedToday;
                    const completed = claimedToday
                      ? day <= currentDay
                      : day < currentDay;

                    return (
                      <article
                        className={`fq-week-day ${completed ? "is-complete" : ""}`}
                        key={day}
                      >
                        <strong>Day {day}</strong>
                        <span aria-hidden="true">◇</span>
                        <b>+{amount} XP</b>
                        <small>
                          {completed
                            ? "Claimed"
                            : day === currentDay && !claimedToday
                              ? "Ready to claim"
                              : "Locked"}
                        </small>
                      </article>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={dailyRewardLoading || !weeklyRewardStatus?.canClaim}
                  onClick={async () => {
                    setDailyRewardLoading(true);
                    setDailyRewardError("");

                    try {
                      const token = localStorage.getItem("facequest-token");
                      const response = await fetch(
                        `${API_BASE}/api/auth/daily-reward/claim`,
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        },
                      );
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          data.message || "Could not claim reward.",
                        );
                      }

                      await refreshProgress();
                      setWeeklyRewardStatus({
                        canClaim: false,
                        claimedToday: true,
                        day: data.day,
                        dailyXP: data.dailyXP,
                        loginStreak: data.user.login_streak,
                      });
                      setNotice(
                        `Day ${data.day} reward claimed! +${data.dailyXP} XP.`,
                      );
                    } catch (error) {
                      setDailyRewardError(error.message);
                    } finally {
                      setDailyRewardLoading(false);
                    }
                  }}
                >
                  {weeklyRewardStatus?.canClaim
                    ? `Claim Day ${weeklyRewardStatus?.day || 1} Reward`
                    : "Today's Reward Claimed"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDailyRewards(false)}
                >
                  Close
                </button>
              </>
            )}
          </section>
        )}

        <section className="sci-stats" aria-label="Player statistics">
          <article className="sci-stat">
            <div className="sci-stat-top">
              <span>YOUR LEVEL</span>
              <span className="sci-stat-symbol">◈</span>
            </div>
            <strong>{String(level).padStart(2, "0")}</strong>
            <span className="sci-stat-caption">GROWING WITH EVERY QUEST</span>
          </article>

          <article className="sci-stat">
            <div className="sci-stat-top">
              <span>EXPERIENCE</span>
              <span className="sci-stat-symbol">✧</span>
            </div>
            <strong>{xp.toLocaleString()}</strong>
            <span className="sci-stat-caption">LIFETIME XP EARNED</span>
          </article>

          <article className="sci-stat">
            <div className="sci-stat-top">
              <span>MISSIONS</span>
              <span className="sci-stat-symbol">⌘</span>
            </div>
            <strong>
              {completedCount}
              <small> / {totalMissionsCount}</small>
            </strong>
            <span className="sci-stat-caption">MISSIONS COMPLETED</span>
          </article>

          <article className="sci-stat">
            <div className="sci-stat-top">
              <span>ARTIFACTS</span>
              <span className="sci-stat-symbol">◇</span>
            </div>
            <strong>{rewards.length}</strong>
            <span className="sci-stat-caption">ITEMS DISCOVERED</span>
          </article>
        </section>

        <section className="sci-progress-panel">
          <div className="sci-progress-header">
            <div>
              <span className="sci-section-label">
                ONE LITTLE STEP AT A TIME
              </span>
              <h2>Your next chapter</h2>
            </div>

            <div className="sci-xp-number">
              <strong>{currentLevelXP}</strong>
              <span> / 300 XP</span>
            </div>
          </div>

          <div
            className="sci-progress-track"
            role="progressbar"
            aria-label="Progress to next level"
            aria-valuemin={0}
            aria-valuemax={300}
            aria-valuenow={currentLevelXP}
          >
            <div
              className="sci-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="sci-progress-footer">
            <span>LVL {level}</span>
            <span>{300 - currentLevelXP} XP TO NEXT RANK</span>
            <span>LVL {level + 1}</span>
          </div>
        </section>

        <section className="sci-capture-launch">
          <div className="sci-capture-symbol">◎</div>

          <div className="sci-capture-copy">
            <span>A DIFFERENT WAY TO EXPLORE</span>
            <h2>See the world a little differently</h2>
            <p>
              Follow a guided camera quest, review your photos, and choose the
              moments you want to keep.
            </p>
          </div>

          <button
            className="sci-capture-button"
            onClick={() =>
              startMission(initialMissions.find((mission) => mission.id === 4))
            }
          >
            Explore with your camera <span>↗</span>
          </button>
        </section>

        {featuredMission && (
          <section className="sci-featured">
            <div className="sci-featured-art">
              <div className="sci-art-grid" />
              <div className="sci-art-ring sci-ring-one" />
              <div className="sci-art-ring sci-ring-two" />
              <div className="sci-art-ring sci-ring-three" />
              <div className="sci-art-core">
                <span>
                  <MissionSymbol id={featuredMission.id} />
                </span>
              </div>
              <div className="sci-art-coordinate">FIELD NOTES / 01</div>
              <div className="sci-art-status">
                <span className="sci-online-dot" />
                CURIOSITY CALLING
              </div>
            </div>

            <div className="sci-featured-info">
              <div className="sci-kicker">
                <span className="sci-kicker-line" />
                PICKED FOR YOUR NEXT ADVENTURE
              </div>

              <span className="sci-featured-world">
                {featuredMission.world || "Active Sector"}
              </span>

              <h2>{featuredMission.title}</h2>

              <p>{featuredMission.description}</p>

              <div className="sci-featured-meta">
                <span>✧ {featuredMission.xp} XP</span>
                <span>{featuredMission.difficulty || "NORMAL"}</span>
                {featuredMission.reward && (
                  <span>REWARD: {featuredMission.reward}</span>
                )}
              </div>

              <button
                className="mission-button sci-primary-button"
                onClick={() => startMission(featuredMission)}
              >
                Begin this quest <span>↗</span>
              </button>

              <span className="sci-demo-note">
                A LITTLE CHALLENGE. A NEW DISCOVERY.
              </span>
            </div>
          </section>
        )}

        <section className="missions-section sci-missions">
          <div className="sci-section-heading">
            <div>
              <span className="sci-section-label">FOLLOW YOUR CURIOSITY</span>
              <h2>Your next adventure</h2>
              <p>
                A little challenge, a new discovery, and XP to make it your own.
              </p>
            </div>

            <span className="sci-remaining">{missions.length} AVAILABLE</span>
          </div>

          {notice && (
            <div className="success-notice sci-notice" role="status">
              <span>✓</span>
              <span>{notice}</span>
            </div>
          )}

          {missions.length > 0 ? (
            <div className="mission-grid sci-mission-grid">
              {missions.map((mission) => (
                <article
                  className="mission-card sci-mission-card"
                  key={mission.id}
                >
                  <div className="sci-card-top">
                    <div className="mission-icon sci-mission-icon">
                      <MissionSymbol id={mission.id} />
                    </div>
                    <span className="sci-card-number">
                      OP-{String(mission.id).padStart(3, "0")}
                    </span>
                  </div>

                  <span className="mission-world sci-mission-world">
                    {mission.world || "Uncharted Sector"}
                  </span>

                  <h3>{mission.title}</h3>
                  <p>{mission.description}</p>

                  <div className="sci-card-tags">
                    <span>{(mission.type || "MISSION").toUpperCase()}</span>
                    <span>{mission.difficulty || "STANDARD"}</span>
                  </div>

                  <div className="mission-reward sci-mission-reward">
                    <span>✧ {mission.xp} XP</span>
                    <span>REWARD: {mission.reward || "Artifact"}</span>
                  </div>

                  <button
                    className="mission-button sci-secondary-button"
                    onClick={() => startMission(mission)}
                  >
                    Explore this quest <span>→</span>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state sci-empty-state">
              <div className="sci-empty-icon">✧</div>
              <span className="sci-section-label">SECTOR CLEARED</span>
              <h3>All operations complete.</h3>
              <p>
                Every available artifact has been recovered. Your next
                expedition awaits.
              </p>
              <button
                className="mission-button sci-primary-button"
                onClick={replayMissions}
              >
                Play again ↻
              </button>
            </div>
          )}
        </section>

        <section className="collection-panel sci-collection">
          <div className="sci-collection-heading">
            <div>
              <span className="sci-section-label">COLLECTED ALONG THE WAY</span>
              <h2>Your discoveries</h2>
            </div>
            <span className="sci-archive-count">{rewards.length} ITEMS</span>
          </div>

          {rewards.length === 0 ? (
            <div className="sci-archive-empty">
              <span>◇</span>
              <p>
                Archive empty. Complete an operation to acquire your first
                artifact.
              </p>
            </div>
          ) : (
            <div className="reward-list sci-reward-list">
              {rewards.map((reward, index) => (
                <span
                  className="reward-chip sci-reward-chip"
                  key={`${reward}-${index}`}
                >
                  <span>◇</span> {reward}
                </span>
              ))}
            </div>
          )}
        </section>

        <footer className="sci-footer">
          <span>FACEQUEST THE EXPLORER’S JOURNAL</span>
          <span>
            MAKE A LITTLE ROOM FOR ADVENTURE <b>✦</b>
          </span>
        </footer>
      </div>
    </main>
  );
}