
import { useState } from "react";
import "../../index.css";

const TARGET = [2, 0, 3, 1];

export default function PortalRestoration({ onBack, onComplete }) {
  const [sequence, setSequence] = useState([]);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);

  function activate(index) {
    if (solved) return;

    const next = [...sequence, index];

    if (index !== TARGET[sequence.length]) {
      setSequence([]);
      setWrong(true);
      return;
    }

    setWrong(false);
    setSequence(next);

    if (next.length === TARGET.length) {
      setSolved(true);
    }
  }

  return (
    <main className="portal-game">
      <header className="portal-header">
        <button className="portal-back" onClick={onBack}>
          ← Back to missions
        </button>
        <span className="portal-status">PORTAL OFFLINE</span>
      </header>

      <section className="portal-panel">
        <div className="portal-kicker">ANCIENT SYSTEM · PROTOCOL 03</div>
        <h1>Restore the <span>Portal</span></h1>
        <p className="portal-description">
          The portal's energy core has lost its sequence. Activate
          the four runes in the correct order to restore the gateway.
        </p>

        <div className={`portal-ring ${solved ? "portal-ring-active" : ""}`}>
          <div className="portal-ring-inner">
            <span>{solved ? "✦" : "◇"}</span>
            <small>{solved ? "ONLINE" : "DORMANT"}</small>
          </div>
        </div>

        <div className="portal-progress">
          <span>ENERGY SEQUENCE</span>
          <strong>{sequence.length} / {TARGET.length}</strong>
        </div>

        <div className="portal-progress-track">
          <div
            className="portal-progress-fill"
            style={{ width: `${(sequence.length / TARGET.length) * 100}%` }}
          />
        </div>

        {!solved ? (
          <>
            <h2>Activate the runes</h2>
            <p className="portal-hint">
              Hint: begin with the third rune, then the first.
            </p>

            <div className="portal-runes">
              {["✧", "☼", "◇", "✦"].map((rune, index) => (
                <button
                  key={rune}
                  className={`portal-rune ${
                    sequence.includes(index) ? "portal-rune-lit" : ""
                  }`}
                  onClick={() => activate(index)}
                  aria-label={`Activate rune ${index + 1}`}
                >
                  <span>{rune}</span>
                  <small>RUNE 0{index + 1}</small>
                </button>
              ))}
            </div>

            {wrong && (
              <p className="portal-error" role="status">
                Wrong sequence! The runes reset. Try again.
              </p>
            )}
          </>
        ) : (
          <div className="portal-success">
            <div className="portal-success-icon">✦</div>
            <h2>Portal restored!</h2>
            <p>
              The ancient gateway is online. Your journey to the next
              world can begin.
            </p>
            <div className="portal-reward">✧ +200 XP · PORTAL SHARD</div>
            <button
              className="portal-claim"
              onClick={() => onComplete(200)}
            >
              CLAIM REWARD →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
