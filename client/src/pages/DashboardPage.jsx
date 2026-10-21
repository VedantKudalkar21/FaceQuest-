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
import RedeemStore from "../features/avatar/RedeemStore";
import "./DashboardPolish.css";
import FrontierExplorer from "../features/games/FrontierExplorer";
import PortalRestoration from "../features/games/PortalRestoration";
import { useEffect, useState } from "react";

const initialMissions = [
  {
    id: 1,
    title: "The Crystal Puzzle",
    world: "The Lost Temple",
    description:
      "Decode an ancient signal and recover the energy crystal hidden inside the temple.",
    xp: 100,
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
    description: "Capture a clear image with balanced lighting to calibrate optical sensors.",
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
    description: "Restore five magical portraits with guided camera challenges.",
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

export default function DashboardPage({
  playerId,
  playerName = "Explorer",
  playerEmail = "",
  playerXP = 0,
  playerLevel = 1,
  onLogout,
  onBack,
}) {
  const accountKey = String(
    playerId || playerEmail || "guest"
  ).toLowerCase();

  const progressKey = `facequest-progress-${accountKey}`;

  const getToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const [missions, setMissions] = useState(initialMissions);
  const [xp, setXp] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [notice, setNotice] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [activeCameraMission, setActiveCameraMission] = useState(null);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
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
  
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [dailyReward, setDailyReward] = useState(null);
  const [rewardLoading, setRewardLoading] = useState(false);
  const [rewardError, setRewardError] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);


  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(progressKey);

      if (saved) {
        const savedProgress = JSON.parse(saved);

        if (
          typeof savedProgress.xp === "number" &&
          savedProgress.xp >= 0
        ) {
          setXp(savedProgress.xp);
        }

        if (
          Array.isArray(savedProgress.rewards) &&
          savedProgress.rewards.every(
            (reward) => typeof reward === "string"
          )
        ) {
          setRewards(savedProgress.rewards);
        }

        if (savedProgress.lastMissionDate === getToday()) {
          if (Array.isArray(savedProgress.missions)) {
            setMissions(savedProgress.missions);
          } else {
            setMissions(initialMissions);
          }
        } else {
          setMissions(initialMissions);
        }
      } else {
        setXp(0);
        setRewards([]);
        setMissions(initialMissions);
      }
    } catch (error) {
      console.error("Could not load FaceQuest progress:", error);
      setXp(0);
      setRewards([]);
      setMissions(initialMissions);
    } finally {
      setProgressLoaded(true);
    }
  }, [progressKey]);

  
  useEffect(() => {
    if (!progressLoaded) return;

    localStorage.setItem(
      progressKey,
      JSON.stringify({
        xp,
        missions,
        rewards,
        lastMissionDate: getToday(),
      })
    );
  }, [xp, missions, rewards, progressLoaded, progressKey]);

  
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
          }
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
    const response = await fetch(
      `${API_BASE}/api/auth/daily-reward/claim`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to claim reward.");
    }

    setXp(Number(data.user.xp));
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
          "Your account has no referral code yet. Please check your account in the database."
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
    if (!missions.some((item) => item.id === mission.id)) {
      return;
    }

    setMissions((current) =>
      current.filter((item) => item.id !== mission.id)
    );

    setXp((current) => current + mission.xp);
    setRewards((current) => [...current, mission.reward]);
    setNotice(
      `${mission.title} completed. +${mission.xp} XP earned. ${mission.reward} unlocked.`
    );
  }

  function startMission(mission) {
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
    setNotice("Missions restored. Ready for another run.");
  }

  if (showCrystalPuzzle) {
    return (
      <CrystalPuzzle
        onBack={() => {
          setShowCrystalPuzzle(false);
          setActiveGameMission(null);
        }}
        onComplete={(earnedXP) => {
          const mission = activeGameMission;

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Crystal Key",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== mission.id)
            );
            setNotice(`${mission.title} completed! +${earnedXP} XP earned.`);
          }

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
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 5);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Explorer Badge",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== 5)
            );
            setNotice(`Face Explorer completed! +${earnedXP} XP earned.`);
          }

          setShowFaceExplorer(false);
        }}
      />
    );
  }

  if (showFocusBridge) {
    return (
      <FocusBridgeMission
        onBack={() => setShowFocusBridge(false)}
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 6);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Focus Crystal",
            ]);
            setMissions((current) => current.filter((item) => item.id !== 6));
            setNotice(`Focus Bridge completed! +${earnedXP} XP earned.`);
          }

          setShowFocusBridge(false);
        }}
      />
    );
  }

  if (showDragonsEye) {
    return (
      <DragonsEyeMission
        onBack={() => setShowDragonsEye(false)}
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 7);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Dragon Crystal",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== 7)
            );
            setNotice(`Dragon's Eye completed! +${earnedXP} XP earned.`);
          }

          setShowDragonsEye(false);
        }}
      />
    );
  }

  if (showMirrorMaze) {
    return (
      <MirrorMazeMission
        onBack={() => setShowMirrorMaze(false)}
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 8);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Mirror Shard",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== 8)
            );
            setNotice(`Mirror Maze completed! +${earnedXP} XP earned.`);
          }

          setShowMirrorMaze(false);
        }}
      />
    );
  }

  if (showStarship) {
    return (
      <StarshipMission
        onBack={() => setShowStarship(false)}
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 9);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Starship Badge",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== 9)
            );
            setNotice(`Starship Navigator completed! +${earnedXP} XP earned.`);
          }

          setShowStarship(false);
        }}
      />
    );
  }

  if (showLostPortraits) {
    return (
      <LostPortraitsMission
        onBack={() => setShowLostPortraits(false)}
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 10);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Royal Portrait Badge",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== 10)
            );
            setNotice(`Lost Portraits completed! +${earnedXP} XP earned.`);
          }

          setShowLostPortraits(false);
        }}
      />
    );
  }

  if (showRhythmRealm) {
    return (
      <RhythmRealmMission
        onBack={() => setShowRhythmRealm(false)}
        onComplete={(earnedXP) => {
          const mission = missions.find((item) => item.id === 11);

          if (mission) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [
              ...current,
              mission.reward || "Rhythm Crown",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== 11)
            );
            setNotice(`Rhythm of the Realm completed! +${earnedXP} XP earned.`);
          }

          setShowRhythmRealm(false);
        }}
      />
    );
  }

  if (showFrontierExplorer) {
    return (
      <FrontierExplorer
        onBack={() => setShowFrontierExplorer(false)}
        onComplete={(earnedXP) => {
          const mission = initialMissions.find(
            (item) => item.id === 2
          );

          if (mission && missions.some((item) => item.id === 2)) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [...current, mission.reward]);
            setMissions((current) =>
              current.filter((item) => item.id !== 2)
            );
            setNotice(
              `${mission.title} completed! +${earnedXP} XP earned.`
            );
          }

          setShowFrontierExplorer(false);
        }}
      />
    );
  }

  if (showPortalRestoration) {
    return (
      <PortalRestoration
        onBack={() => setShowPortalRestoration(false)}
        onComplete={(earnedXP) => {
          const mission = initialMissions.find(
            (item) => item.id === 3
          );

          if (mission && missions.some((item) => item.id === 3)) {
            setXp((current) => current + earnedXP);
            setRewards((current) => [...current, mission.reward]);
            setMissions((current) =>
              current.filter((item) => item.id !== 3)
            );
            setNotice(
              `${mission.title} completed! +${earnedXP} XP earned.`
            );
          }

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
          const mission = activeCameraMission;

          if (mission) {
            setXp((current) => current + mission.xp);
            setRewards((current) => [
              ...current,
              mission.title === "Light Seeker"
                ? "Radiant Crystal"
                : "Signal Fragment",
            ]);
            setMissions((current) =>
              current.filter((item) => item.id !== mission.id)
            );
            setNotice(`${mission.title} completed! +${mission.xp} XP earned.`);
          }

          setActiveCameraMission(null);
          setShowCamera(false);
        }}
      />
    );
  }

  if (showAvatarStudio) {
    return (
      <AvatarStudio
        playerXP={xp}
        onXPChange={(nextXP) => setXp(nextXP)}
        onBack={() => setShowAvatarStudio(false)}
      />
    );
  }

  if (showRedeemStore) {
    return (
      <RedeemStore
        playerXP={xp}
        onXPChange={(nextXP) => setXp(nextXP)}
        onBack={() => setShowRedeemStore(false)}
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
              <div className="fq-reward-amount">+50 XP</div>
              {dailyReward?.streakBonusXP > 0 && (
                <p>Streak bonus available: +{dailyReward.streakBonusXP} XP</p>
              )}
              {rewardError && <p role="alert">{rewardError}</p>}
              <button onClick={claimDailyReward} disabled={rewardLoading}>
                {rewardLoading ? "CLAIMING..." : "CLAIM DAILY REWARD"}
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
            SYSTEM ONLINE
          </div>
        </div>

        <a className="logo sci-logo" href="#dashboard">
          <div>
            FACE<span>QUEST</span>
          </div>
          <small>EXPLORATION NETWORK</small>
        </a>

        <div className="sci-header-right">
          {/* PLAYER PROFILE MENU */}
          <div className="sci-account">
            <button
              type="button"
              className="sci-account-button"
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
              <div className="sci-account-menu">
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
                  <span>🎟️</span>
                  <span>
                    <strong>Redeem Store</strong>
                    <small>Exchange XP for coupons</small>
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
                        }
                      );
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.message || "Could not load rewards.");
                      }

                      setWeeklyRewardStatus(data);
                    } catch (error) {
                      setDailyRewardError(error.message);
                    } finally {
                      setDailyRewardLoading(false);
                    }
                  }}
                >
                  <span>🎁</span>
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
                  <span>👥</span>
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
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="sci-dashboard-content">
        <section className="sci-welcome">
          <div className="sci-kicker">
            <span className="sci-kicker-line" />
            EXPLORER COMMAND CENTER
          </div>

          <div className="sci-welcome-row">
            <div>
              <h1>
                READY TO
                <br />
                <span>EXPLORE?</span>
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
                  setRewardError("Couldn't copy the code. Please select and copy it.");
                }
              }}
            >
              Copy Referral Code
            </button>

            {rewardError && <p role="alert">{rewardError}</p>}

            <button
              type="button"
              onClick={() => setShowReferral(false)}
            >
              Close
            </button>
          </section>
        )}

        
        {showDailyRewards && (
          <section className="fq-weekly-rewards">
            <h2>Your 7-Day Reward Streak</h2>
            <p>Miss a day and your next claim starts again at Day 1.</p>

            {dailyRewardError && (
              <p role="alert">{dailyRewardError}</p>
            )}

            {dailyRewardLoading ? (
              <p>Loading rewards...</p>
            ) : (
              <>
                <div className="fq-week-grid">
                  {[50, 75, 100, 125, 150, 200, 300].map((amount, index) => {
                    const day = index + 1;
                    const currentDay = weeklyRewardStatus?.day || 1;
                    const claimedToday = weeklyRewardStatus?.claimedToday;
                    const completed =
                      claimedToday
                        ? day <= currentDay
                        : day < currentDay;

                    return (
                      <article
                        className={`fq-week-day ${completed ? "is-complete" : ""}`}
                        key={day}
                      >
                        <strong>Day {day}</strong>
                        <span>🎁</span>
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
                  disabled={
                    dailyRewardLoading ||
                    !weeklyRewardStatus?.canClaim
                  }
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
                        }
                      );
                      const data = await response.json();

                      if (!response.ok) {
                        throw new Error(data.message || "Could not claim reward.");
                      }

                      setXp(Number(data.user.xp));
                      setWeeklyRewardStatus({
                        canClaim: false,
                        claimedToday: true,
                        day: data.day,
                        dailyXP: data.dailyXP,
                        loginStreak: data.user.login_streak,
                      });
                      setNotice(`Day ${data.day} reward claimed! +${data.dailyXP} XP.`);
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
              <span>RANK LEVEL</span>
              <span className="sci-stat-symbol">◈</span>
            </div>
            <strong>{String(level).padStart(2, "0")}</strong>
            <span className="sci-stat-caption">EXPLORER CLASS</span>
          </article>

          <article className="sci-stat">
            <div className="sci-stat-top">
              <span>EXPERIENCE</span>
              <span className="sci-stat-symbol">✧</span>
            </div>
            <strong>{xp.toLocaleString()}</strong>
            <span className="sci-stat-caption">TOTAL XP ACQUIRED</span>
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
              <span className="sci-section-label">PLAYER DEVELOPMENT</span>
              <h2>Level progression</h2>
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
            <span>OPTIONAL DATA MISSION · PROTOCOL 01</span>
            <h2>Restore the signal</h2>
            <p>
              Complete a guided camera capture, review your image, and recover a
              rare Signal Fragment.
            </p>
          </div>

          <button
            className="sci-capture-button"
            onClick={() => setShowCamera(true)}
          >
            START CAPTURE <span>↗</span>
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
                <span>{featuredMission.icon || "◈"}</span>
              </div>
              <div className="sci-art-coordinate">SECTOR 01 / 07</div>
              <div className="sci-art-status">
                <span className="sci-online-dot" />
                SIGNAL DETECTED
              </div>
            </div>

            <div className="sci-featured-info">
              <div className="sci-kicker">
                <span className="sci-kicker-line" />
                PRIORITY TRANSMISSION
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
                LAUNCH PRIORITY MISSION <span>↗</span>
              </button>

              <span className="sci-demo-note">
                INTERACTIVE SIMULATION · READY FOR DEPLOYMENT
              </span>
            </div>
          </section>
        )}

        <section className="missions-section sci-missions">
          <div className="sci-section-heading">
            <div>
              <span className="sci-section-label">MISSION DATABASE</span>
              <h2>Available operations</h2>
              <p>Select an operation to earn XP and unlock artifacts.</p>
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
                      {mission.icon || "◈"}
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
                    LAUNCH OPERATION <span>→</span>
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
                RESET SIMULATION ↻
              </button>
            </div>
          )}
        </section>

        <section className="collection-panel sci-collection">
          <div className="sci-collection-heading">
            <div>
              <span className="sci-section-label">PERSONAL INVENTORY</span>
              <h2>Artifact archive</h2>
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
          <span>FACEQUEST EXPLORATION NETWORK</span>
          <span>
            BUILD YOUR OWN UNIVERSE <b>✦</b>
          </span>
        </footer>
      </div>
    </main>
  );
}