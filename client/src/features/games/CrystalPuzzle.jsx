
import { useEffect, useState } from "react";

const PATTERNS = [
  [0, 4, 8, 2],
  [6, 1, 7, 3, 5],
  [2, 5, 0, 7, 4, 1],
];

export default function CrystalPuzzle({ onBack, onComplete }) {
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [activeTile, setActiveTile] = useState(-1);
  const [phase, setPhase] = useState("ready");
  const [message, setMessage] = useState("Memorize the crystal sequence.");

  const pattern = PATTERNS[round];

  function playSequence() {
    setPlayerSequence([]);
    setActiveTile(-1);
    setPhase("showing");
    setMessage("Watch the crystals carefully!");

    let step = 0;
    setSequence(pattern);

    const interval = window.setInterval(() => {
      if (step >= pattern.length) {
        window.clearInterval(interval);
        setActiveTile(-1);
        setPhase("playing");
        setMessage("Your turn! Repeat the sequence.");
        return;
      }

      setActiveTile(pattern[step]);
      window.setTimeout(() => setActiveTile(-1), 420);
      step += 1;
    }, 700);
  }

  useEffect(() => {
    return () => {};
  }, []);

  function chooseTile(index) {
    if (phase !== "playing") return;

    const next = [...playerSequence, index];
    setPlayerSequence(next);

    if (pattern[next.length - 1] !== index) {
      setPhase("failed");
      setMessage("Wrong crystal! Try the pattern again.");
      return;
    }

    if (next.length === pattern.length) {
      if (round === PATTERNS.length - 1) {
        setPhase("won");
        setMessage("Portal stabilized! You solved every sequence.");
      } else {
        setPhase("roundwon");
        setMessage("Correct! The next sequence is harder.");
      }
    }
  }

  function nextRound() {
    setRound((current) => current + 1);
    setPlayerSequence([]);
    setPhase("ready");
    setMessage("Get ready for the next sequence.");
  }

  const earnedXP = (round + 1) * 100;

  return (
    <main className="crystal-game">
      <button className="crystal-back" onClick={onBack}>
        ← Back to missions
      </button>

      <section className="crystal-panel">
        <div className="crystal-kicker">FACEQUEST // MINI GAME 01</div>
        <h1>THE CRYSTAL PUZZLE</h1>
        <p className="crystal-subtitle">
          Memorize the glowing crystals, then repeat their order.
        </p>

        <div className="crystal-stats">
          <span>ROUND <strong>{round + 1}/3</strong></span>
          <span>REWARD <strong>{earnedXP} XP</strong></span>
        </div>

        <div className="crystal-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <button
              key={index}
              className={`crystal-tile ${
                activeTile === index ? "crystal-active" : ""
              } ${playerSequence.includes(index) ? "crystal-selected" : ""}`}
              onClick={() => chooseTile(index)}
              disabled={phase !== "playing"}
              aria-label={`Crystal ${index + 1}`}
            >
              ◈
            </button>
          ))}
        </div>

        <p className="crystal-message" aria-live="polite">{message}</p>

        {phase === "ready" && (
          <button className="crystal-action" onClick={playSequence}>
            START SEQUENCE
          </button>
        )}

        {phase === "failed" && (
          <button className="crystal-action" onClick={playSequence}>
            TRY AGAIN
          </button>
        )}

        {phase === "roundwon" && (
          <button className="crystal-action" onClick={nextRound}>
            NEXT ROUND →
          </button>
        )}

        {phase === "won" && (
          <button
            className="crystal-action"
            onClick={() => onComplete?.(earnedXP)}
          >
            CLAIM {earnedXP} XP
          </button>
        )}
      </section>
    </main>
  );
}
