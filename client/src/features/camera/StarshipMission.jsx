
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const GATES = [
  { name: "Launch Gate", direction: "LEFT", symbol: "✦" },
  { name: "Asteroid Field", direction: "RIGHT", symbol: "✧" },
  { name: "Nebula Gate", direction: "LEFT", symbol: "★" },
  { name: "Comet Crossing", direction: "RIGHT", symbol: "✦" },
  { name: "Home Portal", direction: "CENTER", symbol: "◎" },
];

export default function StarshipMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const stableSinceRef = useRef(0);
  const lastCheckRef = useRef(0);
  const busyRef = useRef(false);
  const gateRef = useRef(0);
  const capturesRef = useRef([]);

  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [gate, setGate] = useState(0);
  const [position, setPosition] = useState(50);
  const [captures, setCaptures] = useState([]);
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("Prepare for launch, pilot.");
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const current = GATES[gate] || GATES[0];
  const reward = 250;

  useEffect(() => {
    gateRef.current = gate;
    capturesRef.current = captures;
  }, [gate, captures]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.close();
    };
  }, []);

  async function startGame() {
    if (!consent) {
      setError("Please accept the camera notice first.");
      return;
    }

    try {
      setError("");
      setMessage("Calibrating ship systems…");

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        minDetectionConfidence: 0.6,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setCameraReady(true);
      setMessage("Steer your ship by moving your face left, right, or center.");
    } catch (err) {
      console.error("Starship startup error:", err);
      detectorRef.current?.close();
      detectorRef.current = null;
      stopCamera();
      setError(`${err.name || "Error"}: ${err.message || "Could not start camera."}`);
    }
  }

  useEffect(() => {
    if (!cameraReady || finished) return;

    let raf;
    let cancelled = false;

    function trackPilot() {
      if (cancelled) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const now = performance.now();

      if (
        video?.readyState >= 2 &&
        detector &&
        !busyRef.current &&
        now - lastCheckRef.current >= 150
      ) {
        lastCheckRef.current = now;

        try {
          const result = detector.detectForVideo(video, now);
          const detection = result.detections?.[0];

          if (detection?.boundingBox) {
            const box = detection.boundingBox;
            const centerX = box.originX + box.width / 2;
            const mirroredX = 1 - centerX / video.videoWidth;

            setFaceFound(true);
            setPosition(Math.max(8, Math.min(92, mirroredX * 100)));

            const direction =
              mirroredX < 0.38 ? "LEFT" :
              mirroredX > 0.62 ? "RIGHT" : "CENTER";

            const activeGate = GATES[gateRef.current];

            if (direction === activeGate.direction) {
              if (!stableSinceRef.current) stableSinceRef.current = now;

              const elapsed = (now - stableSinceRef.current) / 1000;

              setMessage(
                elapsed >= 2
                  ? "Gate aligned! Jumping to hyperspace…"
                  : `Aligning with ${activeGate.name}…`
              );

              if (elapsed >= 2) {
                busyRef.current = true;

                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext("2d").drawImage(
                  video, 0, 0, canvas.width, canvas.height
                );

                const image = canvas.toDataURL("image/jpeg", 0.85);
                const next = [
                  ...capturesRef.current,
                  { gate: gateRef.current + 1, image },
                ];

                capturesRef.current = next;
                setCaptures(next);
                setStars((value) => value + 100);
                stableSinceRef.current = 0;

                if (gateRef.current >= GATES.length - 1) {
                  setFinished(true);
                  setMessage("Mission accomplished! Welcome home, pilot.");
                  streamRef.current?.getTracks().forEach((track) => track.stop());
                  streamRef.current = null;
                  setCameraReady(false);
                } else {
                  const nextGate = gateRef.current + 1;
                  gateRef.current = nextGate;
                  setGate(nextGate);
                  setMessage("Gate cleared! Navigate to the next checkpoint.");
                }

                window.setTimeout(() => {
                  busyRef.current = false;
                }, 900);
              }
            } else {
              stableSinceRef.current = 0;
              setMessage(`Move your face ${activeGate.direction.toLowerCase()} to align the ship.`);
            }
          } else {
            setFaceFound(false);
            stableSinceRef.current = 0;
            setMessage("Pilot not detected. Move into the camera frame.");
          }
        } catch (err) {
          console.error("Starship face tracking error:", err);
        }
      }

      raf = requestAnimationFrame(trackPilot);
    }

    raf = requestAnimationFrame(trackPilot);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cameraReady, finished, gate]);

  function exitGame() {
    stopCamera();
    onBack?.();
  }

  return (
    <main className="starship-game">
      <header className="starship-header">
        <button onClick={exitGame}>← Missions</button>
        <div>
          <span>FACEQUEST / SPACE FRONTIER</span>
          <h1>STARSHIP NAVIGATOR</h1>
        </div>
        <strong>✦ {reward} XP</strong>
      </header>

      <section className="starship-gates">
        {GATES.map((item, index) => (
          <div
            key={item.name}
            className={
              index < captures.length
                ? "starship-gate completed"
                : index === gate && !finished
                  ? "starship-gate active"
                  : "starship-gate"
            }
          >
            <span>{index < captures.length ? "✓" : item.symbol}</span>
            <small>{item.name}</small>
          </div>
        ))}
      </section>

      <div className="starship-layout">
        <section className="starship-world">
          <div className="starship-stars">✦　 ·　 ✧　　★　 ·　 ✦</div>

          <div className="starship-planet planet-one" />
          <div className="starship-planet planet-two" />

          <div className="starship-asteroid asteroid-one">◆</div>
          <div className="starship-asteroid asteroid-two">✦</div>
          <div className="starship-asteroid asteroid-three">●</div>

          <div
            className="starship-ship"
            style={{ left: `${position}%` }}
          >
            🚀
          </div>

          <div className="starship-gate-art">
            <span>{current.symbol}</span>
            <small>{current.name}</small>
          </div>

          <div className="starship-world-message">
            <h2>{finished ? "MISSION COMPLETE!" : `GATE ${gate + 1}: ${current.name}`}</h2>
            <p>
              {finished
                ? "You navigated every gate successfully."
                : `Move your face ${current.direction.toLowerCase()} and hold for 2 seconds.`}
            </p>
            <strong>{message}</strong>
          </div>
        </section>

        <aside className="starship-control">
          <div className="starship-camera">
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraReady && (
              <div className="starship-camera-placeholder">
                <span>◎</span>
                PILOT CAMERA OFFLINE
              </div>
            )}
            {cameraReady && faceFound && (
              <div className="starship-face-status">● PILOT DETECTED</div>
            )}
          </div>

          <p className={faceFound ? "starship-found" : ""}>
            {faceFound ? "Navigation controls active" : "Waiting for pilot"}
          </p>

          <div className="starship-radar">
            <span>LEFT</span>
            <div>
              <i style={{ left: `${position}%` }} />
            </div>
            <span>RIGHT</span>
          </div>

          <div className="starship-score">
            <span>STARS COLLECTED</span>
            <strong>✦ {stars}</strong>
          </div>

          {!cameraReady && !finished && (
            <>
              <p className="starship-note">
                Face position controls the ship. At each gate, hold the required
                position for two seconds to capture a frame. Images remain in
                browser memory and are not uploaded. Eye gaze is not measured.
              </p>
              <label className="starship-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                I agree to camera use for this demo.
              </label>
              <button
                className="starship-start"
                disabled={!consent}
                onClick={startGame}
              >
                LAUNCH STARSHIP →
              </button>
            </>
          )}

          {error && <p className="starship-error">{error}</p>}

          <div className="starship-captures">
            {GATES.map((item, index) => (
              <div key={item.name}>
                {captures[index] ? (
                  <img src={captures[index].image} alt={`${item.name} capture`} />
                ) : (
                  <span>◎</span>
                )}
                <small>{index + 1}</small>
              </div>
            ))}
          </div>

          {finished && (
            <button
              className="starship-start"
              onClick={() => onComplete?.(reward)}
            >
              CLAIM {reward} XP →
            </button>
          )}
        </aside>
      </div>
    </main>
  );
}
