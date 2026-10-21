
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const ROUNDS = [
  { name: "Awaken the Dragon", target: "💎", instruction: "Hold your face steady to charge the fireball." },
  { name: "Break the Crystal", target: "🔮", instruction: "Keep your face visible while the magic charges." },
  { name: "Defeat the Guardian", target: "🐲", instruction: "Stay steady to launch your next fireball." },
  { name: "Open the Vault", target: "🏆", instruction: "Charge your final attack." },
  { name: "Dragon Master", target: "👑", instruction: "One last steady focus to claim victory." },
];

export default function DragonsEyeMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const stableSinceRef = useRef(0);
  const lastCheckRef = useRef(0);
  const busyRef = useRef(false);
  const capturesRef = useRef([]);
  const roundRef = useRef(0);

  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [round, setRound] = useState(0);
  const [charge, setCharge] = useState(0);
  const [captures, setCaptures] = useState([]);
  const [shots, setShots] = useState(0);
  const [message, setMessage] = useState("Prepare to awaken the dragon.");
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const current = ROUNDS[round];
  const reward = 250;

  useEffect(() => {
    roundRef.current = round;
    capturesRef.current = captures;
  }, [round, captures]);

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
      setMessage("Loading dragon vision…");

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
      setMessage("Keep your face visible and steady to charge.");
    } catch (err) {
      console.error("Dragon's Eye startup error:", err);
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

    function trackFace() {
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
          const found = (result.detections?.length || 0) > 0;
          setFaceFound(found);

          if (found) {
            if (!stableSinceRef.current) stableSinceRef.current = now;

            const elapsed = (now - stableSinceRef.current) / 1000;
            const amount = Math.min(100, (elapsed / 2.5) * 100);
            setCharge(amount);

            if (elapsed >= 2.5) {
              busyRef.current = true;

              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              const context = canvas.getContext("2d");
              context.drawImage(video, 0, 0, canvas.width, canvas.height);

              const image = canvas.toDataURL("image/jpeg", 0.85);
              const completedRound = roundRef.current;
              const nextCaptures = [
                ...capturesRef.current,
                { round: completedRound + 1, image },
              ];

              capturesRef.current = nextCaptures;
              setCaptures(nextCaptures);
              setShots((value) => value + 1);
              stableSinceRef.current = 0;
              setCharge(0);

              if (completedRound >= ROUNDS.length - 1) {
                setFinished(true);
                setMessage("Dragon defeated! You are the Dragon Master!");
                streamRef.current?.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                setCameraReady(false);
              } else {
                setRound(completedRound + 1);
                setMessage("Fireball launched! The next crystal awakens.");
              }

              window.setTimeout(() => {
                busyRef.current = false;
              }, 1000);
            } else {
              setMessage("Charging fireball… hold steady!");
            }
          } else {
            stableSinceRef.current = 0;
            setCharge(0);
            setMessage("Find the camera to charge your fireball.");
          }
        } catch (err) {
          console.error("Dragon face tracking error:", err);
        }
      }

      raf = requestAnimationFrame(trackFace);
    }

    raf = requestAnimationFrame(trackFace);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cameraReady, finished]);

  function exitGame() {
    stopCamera();
    onBack?.();
  }

  return (
    <main className="dragons-game">
      <header className="dragons-header">
        <button onClick={exitGame}>← Missions</button>
        <div>
          <span>FACEQUEST / MINI GAME 02</span>
          <h1>DRAGON'S EYE</h1>
        </div>
        <strong>★ {reward} XP</strong>
      </header>

      <section className="dragons-rounds">
        {ROUNDS.map((item, index) => (
          <div
            key={item.name}
            className={
              index < captures.length
                ? "dragon-round completed"
                : index === round && !finished
                  ? "dragon-round active"
                  : "dragon-round"
            }
          >
            <span>{index < captures.length ? "✓" : item.target}</span>
            <small>ROUND {index + 1}</small>
          </div>
        ))}
      </section>

      <div className="dragons-layout">
        <section className="dragons-arena">
          <div className="dragon-stars">✦　　 ·　　 ✧　　 ·　　 ✦</div>

          <div className="dragon-character">
            <span>🐉</span>
            <small>THE CRYSTAL GUARDIAN</small>
          </div>

          <div className={`dragon-target ${charge >= 100 ? "charged" : ""}`}>
            {current.target}
          </div>

          <div className="dragon-fireball" key={shots}>
            {charge >= 100 ? "🔥" : "✦"}
          </div>

          <div className="dragon-arena-message">
            <h2>{finished ? "VICTORY!" : current.name}</h2>
            <p>{finished ? "The treasure is yours." : current.instruction}</p>
          </div>
        </section>

        <aside className="dragons-control">
          <div className="dragon-camera">
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraReady && (
              <div className="dragon-camera-placeholder">
                <span>◎</span>
                CAMERA STANDBY
              </div>
            )}
            {cameraReady && faceFound && (
              <div className="dragon-face-label">● FACE DETECTED</div>
            )}
          </div>

          <div className="dragon-charge">
            <div>
              <span>FIREBALL CHARGE</span>
              <strong>{Math.round(charge)}%</strong>
            </div>
            <div className="dragon-charge-track">
              <span style={{ width: `${charge}%` }} />
            </div>
          </div>

          <p className="dragon-status" role="status">{message}</p>

          {!cameraReady && !finished && (
            <>
              <p className="dragon-notice">
                The game captures a frame after your face remains visible for
                2.5 seconds. Images stay in browser memory and are not uploaded.
                This prototype does not measure eye gaze.
              </p>
              <label className="dragon-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                I agree to camera use for this demo.
              </label>
              <button
                className="dragon-start"
                disabled={!consent}
                onClick={startGame}
              >
                AWAKEN THE DRAGON →
              </button>
            </>
          )}

          {error && <p className="dragon-error">{error}</p>}

          <div className="dragon-captures">
            {ROUNDS.map((item, index) => (
              <div key={item.name}>
                {captures[index] ? (
                  <img src={captures[index].image} alt={`Round ${index + 1} capture`} />
                ) : (
                  <span>◎</span>
                )}
                <small>{index + 1}</small>
              </div>
            ))}
          </div>

          {finished && (
            <button
              className="dragon-start"
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
