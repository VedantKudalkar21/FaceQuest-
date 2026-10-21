
import { useState } from "react";
import "../../index.css";

const TOTAL_SCANS = 12;

export default function FrontierExplorer({ onBack, onComplete }) {
  const [artifactTile] = useState(
    () => Math.floor(Math.random() * TOTAL_SCANS)
  );
  const [scanned, setScanned] = useState([]);
  const [found, setFound] = useState(false);

  function scanTile(index) {
    if (found || scanned.includes(index)) return;

    const nextScanned = [...scanned, index];
    setScanned(nextScanned);

    if (index === artifactTile) {
      setFound(true);
    }
  }

  return (
    <main className="frontier-game">
      <header className="frontier-header">
        <button className="frontier-back" onClick={onBack}>
          ← Back to missions
        </button>
        <span className="frontier-status">SECTOR ONLINE</span>
      </header>

      <section className="frontier-panel">
        <div className="frontier-kicker">
          EXPLORATION PROTOCOL · 02
        </div>

        <h1>
          Explore the <span>Frontier</span>
        </h1>

        <p className="frontier-description">
          An unknown signal has been detected. Scan the sector tiles
          to locate the hidden artifact and recover the Neon Badge.
        </p>

        <div className="frontier-stats">
          <div>
            <small>SECTOR SCANS</small>
            <strong>{scanned.length} / {TOTAL_SCANS}</strong>
          </div>
          <div>
            <small>ARTIFACT</small>
            <strong>{found ? "RECOVERED" : "UNKNOWN"}</strong>
          </div>
          <div>
            <small>REWARD</small>
            <strong>+150 XP</strong>
          </div>
        </div>

        {!found ? (
          <>
            <h2 className="frontier-instruction">
              Select a scan location
            </h2>

            <div className="frontier-grid">
              {Array.from({ length: TOTAL_SCANS }, (_, index) => {
                const isScanned = scanned.includes(index);

                return (
                  <button
                    key={index}
                    className={`frontier-tile ${
                      isScanned ? "frontier-tile-scanned" : ""
                    }`}
                    onClick={() => scanTile(index)}
                    disabled={isScanned || found}
                    aria-label={`Scan sector tile ${index + 1}`}
                  >
                    {isScanned ? "✓" : "⌖"}
                    <small>
                      {String(index + 1).padStart(2, "0")}
                    </small>
                  </button>
                );
              })}
            </div>

            <p className="frontier-hint">
              Each tile can be scanned once. Find the hidden artifact!
            </p>
          </>
        ) : (
          <div className="frontier-success">
            <div className="frontier-success-icon">✦</div>
            <h2>Artifact recovered!</h2>
            <p>
              You discovered the Neon Badge and completed the
              Frontier exploration mission.
            </p>
            <div className="frontier-reward">✧ +150 XP · NEON BADGE</div>
            <button
              className="frontier-complete"
              onClick={() => onComplete(150)}
            >
              CLAIM REWARD →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
