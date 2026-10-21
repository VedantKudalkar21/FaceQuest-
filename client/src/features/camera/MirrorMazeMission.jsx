
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const CHECKPOINTS = [
  { name: "Moon Mirror", target: "LEFT", symbol: "☾" },
  { name: "Prism Hall", target: "RIGHT", symbol: "◇" },
  { name: "Crystal Gate", target: "LEFT", symbol: "✧" },
  { name: "Portal Mirror", target: "RIGHT", symbol: "✦" },
  { name: "Maze Exit", target: "CENTER", symbol: "✺" },
];

export default function MirrorMazeMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const busyRef = useRef(false);
  const lastCheckRef = useRef(0);
  const stableSinceRef = useRef(0);
  const capturesRef = useRef([]);
  const checkpointRef = useRef(0);

  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [facePosition, setFacePosition] = useState(0);
  const [checkpoint, setCheckpoint] = useState(0);
  const [captures, setCaptures] = useState([]);
  const [message, setMessage] = useState("Activate the camera to enter the maze.");
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const reward = CHECKPOINTS.length * 50;
  const current = CHECKPOINTS[checkpoint] || CHECKPOINTS[0];

  useEffect(() => {
    capturesRef.current = captures;
    checkpointRef.current = checkpoint;
  }, [captures, checkpoint]);

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
      setMessage("Loading the magic mirrors…");

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
      setMessage("Move your face left, right, or center to guide the beam.");
    } catch (err) {
      console.error("Mirror Maze startup error:", err);
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
        now - lastCheckRef.current > 180
      ) {
        lastCheckRef.current = now;

        try {
          const result = detector.detectForVideo(video, now);
          const detection = result.detections?.[0];

          if (detection?.boundingBox) {
            const box = detection.boundingBox;
            const centerX = box.originX + box.width / 2;
            const normalizedX = centerX / video.videoWidth;

            // Mirror the horizontal direction to match the selfie preview.
            const mirroredPosition = 1 - normalizedX;
            const direction =
              mirroredPosition < 0.38
                ? "LEFT"
                : mirroredPosition > 0.62
                  ? "RIGHT"
                  : "CENTER";

            setFaceFound(true);
            setFacePosition(mirroredPosition);
            setMessage(
              direction === current.target
                ? `Mirror aligned! Hold ${direction.toLowerCase()}…`
                : `Move your face ${current.target.toLowerCase()} to align the beam.`
            );

            if (direction === current.target) {
              if (!stableSinceRef.current) stableSinceRef.current = now;

              if (now - stableSinceRef.current >= 1800) {
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
                  {
                    checkpoint: checkpointRef.current + 1,
                    image,
                  },
                ];

                capturesRef.current = next;
                setCaptures(next);
                stableSinceRef.current = 0;

                if (checkpointRef.current >= CHECKPOINTS.length - 1) {
                  setFinished(true);
                  setMessage("The portal is open! Maze completed.");
                  streamRef.current?.getTracks().forEach((track) => track.stop());
                  streamRef.current = null;
                  setCameraReady(false);
                } else {
                  const nextCheckpoint = checkpointRef.current + 1;
                  checkpointRef.current = nextCheckpoint;
                  setCheckpoint(nextCheckpoint);
                  setMessage("Mirror activated! Follow the next beam.");
                }

                window.setTimeout(() => {
                  busyRef.current = false;
                }, 900);
              }
            } else {
              stableSinceRef.current = 0;
            }
          } else {
            setFaceFound(false);
            setFacePosition(0.5);
            stableSinceRef.current = 0;
            setMessage("Move your face into the camera view.");
          }
        } catch (err) {
          console.error("Mirror Maze tracking error:", err);
        }
      }

      raf = requestAnimationFrame(trackFace);
    }

    raf = requestAnimationFrame(trackFace);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cameraReady, finished, checkpoint, current.target]);

  function exitGame() {
    stopCamera();
    onBack?.();
  }

  return (
    <main className="mirror-game">
      <header className="mirror-header">
        <button onClick={exitGame}>← Missions</button>
        <div>
          <span>FACEQUEST / PUZZLE WORLD</span>
          <h1>MIRROR MAZE</h1>
        </div>
        <strong>✧ {reward} XP</strong>
      </header>

      <section className="mirror-checkpoints">
        {CHECKPOINTS.map((item, index) => (
          <div
            key={item.name}
            className={
              index < captures.length
                ? "mirror-checkpoint done"
                : index === checkpoint && !finished
                  ? "mirror-checkpoint active"
                  : "mirror-checkpoint"
            }
          >
            <span>{index < captures.length ? "✓" : item.symbol}</span>
            <small>{item.name}</small>
          </div>
        ))}
      </section>

      <div className="mirror-layout">
        <section className="mirror-world">
          <div className="mirror-stars">✦ · · ✧ · · ✦ · · ✧</div>

          <div className="mirror-maze-art">
            <div className="mirror-wall wall-left" />
            <div className="mirror-wall wall-right" />

            <div className="mirror-beam" />

            <div className="mirror-object mirror-one">◇</div>
            <div className="mirror-object mirror-two">✧</div>
            <div className="mirror-object mirror-three">✦</div>

            <div
              className="mirror-player-beam"
              style={{ left: `${15 + facePosition * 70}%` }}
            >
              ◎
            </div>

            <div className="mirror-exit">PORTAL</div>
          </div>

          <div className="mirror-instructions">
            <span>CHECKPOINT {Math.min(checkpoint + 1, CHECKPOINTS.length)} / {CHECKPOINTS.length}</span>
            <h2>{finished ? "Portal Unlocked!" : current.name}</h2>
            <p>
              {finished
                ? "You have solved the mirror maze."
                : `Move your face ${current.target.toLowerCase()} and hold steady for 1.8 seconds.`}
            </p>
            <strong>{message}</strong>
          </div>
        </section>

        <aside className="mirror-camera-panel">
          <div className="mirror-camera">
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraReady && (
              <div className="mirror-camera-placeholder">
                <span>◎</span>
                CAMERA STANDBY
              </div>
            )}
            {cameraReady && faceFound && (
              <div className="mirror-face-status">● FACE DETECTED</div>
            )}
          </div>

          <p className={faceFound ? "mirror-found" : ""}>
            {faceFound ? "Face tracking active" : "Waiting for face"}
          </p>

          {!cameraReady && !finished && (
            <>
              <p className="mirror-note">
                This game uses face position in the camera frame to guide the beam.
                It does not identify you or measure eye gaze. Checkpoint images
                stay in browser memory and are not uploaded.
              </p>
              <label className="mirror-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                I agree to camera use for this demo.
              </label>
              <button
                className="mirror-start"
                disabled={!consent}
                onClick={startGame}
              >
                ENTER THE MAZE →
              </button>
            </>
          )}

          {error && <p className="mirror-error">{error}</p>}

          <div className="mirror-captures">
            {CHECKPOINTS.map((item, index) => (
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
              className="mirror-start"
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
