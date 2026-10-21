
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const CHECKPOINTS = [
  { label: "Crystal Gate", color: "#52edff" },
  { label: "Amber Stone", color: "#ffc15a" },
  { label: "Mystic Orb", color: "#c6a0ff" },
  { label: "Emerald Point", color: "#62ffbb" },
  { label: "Portal Gate", color: "#ff7e9e" },
];

export default function FocusBridgeMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const busyRef = useRef(false);
  const stableSinceRef = useRef(0);
  const lastCheckRef = useRef(0);
  const finishedRef = useRef(false);

  const [consent, setConsent] = useState(false);
  const [ready, setReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [checkpoint, setCheckpoint] = useState(0);
  const [captures, setCaptures] = useState([]);
  const [focusTime, setFocusTime] = useState(0);
  const [status, setStatus] = useState("Accept the notice to begin.");
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const reward = CHECKPOINTS.length * 40;

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setReady(false);
  }

  useEffect(() => {
    if (!ready) return;

    let raf;
    let cancelled = false;

    async function monitor() {
      if (cancelled) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const now = performance.now();

      if (
        video?.readyState >= 2 &&
        detector &&
        !busyRef.current &&
        !finishedRef.current &&
        now - lastCheckRef.current >= 180
      ) {
        lastCheckRef.current = now;

        try {
          const result = detector.detectForVideo(video, now);
          const found = result.detections?.length > 0;
          setFaceFound(found);

          if (found) {
            if (!stableSinceRef.current) stableSinceRef.current = now;

            const elapsed = (now - stableSinceRef.current) / 1000;
            setFocusTime(Math.min(elapsed, 3));

            if (elapsed >= 3) {
              busyRef.current = true;
              setStatus("Checkpoint reached! Capturing image…");

              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              canvas.getContext("2d").drawImage(
                video, 0, 0, canvas.width, canvas.height
              );

              const image = canvas.toDataURL("image/jpeg", 0.85);
              const next = [...captures, {
                checkpoint: CHECKPOINTS[checkpoint].label,
                image,
              }];

              setCaptures(next);
              stableSinceRef.current = 0;
              setFocusTime(0);

              if (checkpoint === CHECKPOINTS.length - 1) {
                finishedRef.current = true;
                setFinished(true);
                setStatus("You crossed the bridge!");
                stopCamera();
              } else {
                setCheckpoint((value) => value + 1);
                setStatus("Checkpoint captured! Focus on the next crystal.");
              }

              window.setTimeout(() => {
                busyRef.current = false;
              }, 900);
            } else {
              setStatus("Keep your face steady to cross…");
            }
          } else {
            stableSinceRef.current = 0;
            setFocusTime(0);
            setStatus("Move your face into view to continue.");
          }
        } catch (err) {
          console.error("Face tracking error:", err);
        }
      }

      raf = requestAnimationFrame(monitor);
    }

    raf = requestAnimationFrame(monitor);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [ready, checkpoint, captures]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.close();
    };
  }, []);

  async function startGame() {
    setError("");

    if (!consent) {
      setError("Please accept the camera notice first.");
      return;
    }

    try {
      setStatus("Loading face detector…");

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
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setReady(true);
      setStatus("Look toward the camera and hold steady for 3 seconds.");
    } catch (err) {
      console.error("Focus Bridge startup error:", err);
      detectorRef.current?.close();
      detectorRef.current = null;
      stopCamera();
      setError(`${err.name || "Error"}: ${err.message || "Could not start camera."}`);
    }
  }

  function exitGame() {
    stopCamera();
    onBack?.();
  }

  return (
    <main className="fb-game">
      <header className="fb-header">
        <button onClick={exitGame}>← Missions</button>
        <div>
          <strong>FACE<span>QUEST</span></strong>
          <small>FOCUS BRIDGE · LOOK · FOCUS · CROSS</small>
        </div>
        <b>★ {reward} XP</b>
      </header>

      <section className="fb-progress">
        {CHECKPOINTS.map((point, index) => (
          <div
            key={point.label}
            className={index < captures.length ? "done" : index === checkpoint ? "current" : ""}
          >
            <span>{index < captures.length ? "✓" : "◆"}</span>
            <small>{point.label}</small>
          </div>
        ))}
      </section>

      <div className="fb-layout">
        <aside className="fb-side">
          <div className="fb-camera">
            <video ref={videoRef} autoPlay muted playsInline />
            {!ready && <div className="fb-camera-overlay">CAMERA STANDBY</div>}
          </div>
          <p className={faceFound ? "fb-good" : ""}>
            {faceFound ? "● FACE DETECTED" : "● WAITING FOR FACE"}
          </p>
          <h3>HOW TO PLAY</h3>
          <p>1. Allow camera access.</p>
          <p>2. Keep your face visible and steady.</p>
          <p>3. Hold for 3 seconds at each crystal.</p>
          <p>4. Captures happen automatically.</p>

          {!ready && !finished && (
            <>
              <label className="fb-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                I agree to this demo's camera use. Images stay in memory and are not uploaded.
              </label>
              <button className="fb-button" disabled={!consent} onClick={startGame}>
                START CROSSING
              </button>
            </>
          )}
          {error && <p className="fb-error">{error}</p>}
        </aside>

        <section className="fb-world">
          <div className="fb-sky">
            <span className="fb-mountain one" />
            <span className="fb-mountain two" />
            <div className="fb-portal">✧</div>
            <div className="fb-bridge">
              {CHECKPOINTS.map((point, index) => (
                <div className="fb-stone" key={point.label}>
                  <span style={{ color: point.color }}>{point.color && "◆"}</span>
                </div>
              ))}
            </div>
            <div
              className="fb-player"
              style={{ left: `${5 + (captures.length / CHECKPOINTS.length) * 82}%` }}
            >
              🧙
            </div>
          </div>

          <div className="fb-message">
            <strong>{finished ? "Bridge crossed! ✨" : status}</strong>
            {!finished && ready && (
              <>
                <div className="fb-meter">
                  <span style={{ width: `${(focusTime / 3) * 100}%` }} />
                </div>
                <small>{focusTime.toFixed(1)} / 3.0 seconds</small>
              </>
            )}
            {finished && (
              <button
                className="fb-button"
                onClick={() => onComplete?.(reward)}
              >
                CLAIM {reward} XP
              </button>
            )}
          </div>

          <div className="fb-captures">
            {CHECKPOINTS.map((point, index) => (
              <div key={point.label}>
                {captures[index] ? (
                  <img src={captures[index].image} alt={`Captured ${point.label}`} />
                ) : (
                  <span>◎</span>
                )}
                <small>{point.label}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
      <p className="fb-privacy">
        CAMERA REQUIRES PERMISSION · CAPTURES STAY IN BROWSER MEMORY · NO UPLOAD
      </p>
    </main>
  );
}
