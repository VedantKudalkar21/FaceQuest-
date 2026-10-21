
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const PORTRAITS = [
  { name: "The Royal Portrait", pose: "Look straight at the camera.", symbol: "♔" },
  { name: "The Moon Guardian", pose: "Turn your head slightly to your left.", symbol: "☾" },
  { name: "The Sun Guardian", pose: "Turn your head slightly to your right.", symbol: "☀" },
  { name: "The Mystic", pose: "Move a little farther from the camera.", symbol: "✧" },
  { name: "The Lost Heir", pose: "Return to a comfortable, front-facing position.", symbol: "♕" },
];

export default function LostPortraitsMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const stableSinceRef = useRef(0);
  const lastCheckRef = useRef(0);
  const busyRef = useRef(false);
  const capturesRef = useRef([]);
  const indexRef = useRef(0);

  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [portraitIndex, setPortraitIndex] = useState(0);
  const [captures, setCaptures] = useState([]);
  const [reviewImage, setReviewImage] = useState(null);
  const [message, setMessage] = useState("Enter the gallery to begin.");
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const current = PORTRAITS[portraitIndex];
  const reward = 250;

  useEffect(() => {
    capturesRef.current = captures;
    indexRef.current = portraitIndex;
  }, [captures, portraitIndex]);

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

  async function startGallery() {
    if (!consent) {
      setError("Please agree to the camera notice first.");
      return;
    }

    try {
      setError("");
      setMessage("Opening the enchanted gallery…");

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
      setMessage("Follow the portrait instructions. Captures happen automatically.");
    } catch (err) {
      console.error("Lost Portraits startup error:", err);
      detectorRef.current?.close();
      detectorRef.current = null;
      stopCamera();
      setError(`${err.name || "Error"}: ${err.message || "Could not start camera."}`);
    }
  }

  useEffect(() => {
    if (!cameraReady || finished || reviewImage) return;

    let raf;
    let cancelled = false;

    function scan() {
      if (cancelled) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const now = performance.now();

      if (
        video?.readyState >= 2 &&
        detector &&
        !busyRef.current &&
        now - lastCheckRef.current >= 180
      ) {
        lastCheckRef.current = now;

        try {
          const result = detector.detectForVideo(video, now);
          const detection = result.detections?.[0];

          if (detection?.boundingBox) {
            setFaceFound(true);

            const box = detection.boundingBox;
            const faceWidth = box.width / video.videoWidth;
            const faceHeight = box.height / video.videoHeight;

            if (faceWidth < 0.12 || faceHeight < 0.12) {
              stableSinceRef.current = 0;
              setMessage("Move a little closer so your face is clear.");
            } else if (faceWidth > 0.75) {
              stableSinceRef.current = 0;
              setMessage("Move a little farther away to fit your face in frame.");
            } else {
              if (!stableSinceRef.current) stableSinceRef.current = now;

              const elapsed = (now - stableSinceRef.current) / 1000;

              setMessage(
                elapsed >= 2.5
                  ? "Portrait captured! Review your image."
                  : `Hold your pose… ${Math.max(0, 2.5 - elapsed).toFixed(1)} seconds`
              );

              if (elapsed >= 2.5) {
                busyRef.current = true;

                const canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext("2d").drawImage(
                  video, 0, 0, canvas.width, canvas.height
                );

                setReviewImage(canvas.toDataURL("image/jpeg", 0.9));
                stableSinceRef.current = 0;
              }
            }
          } else {
            setFaceFound(false);
            stableSinceRef.current = 0;
            setMessage("Move into the camera frame to begin.");
          }
        } catch (err) {
          console.error("Portrait face detection error:", err);
        }
      }

      raf = requestAnimationFrame(scan);
    }

    raf = requestAnimationFrame(scan);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cameraReady, finished, reviewImage, portraitIndex]);

  function retake() {
    setReviewImage(null);
    stableSinceRef.current = 0;
    busyRef.current = false;
    setMessage("Try again. Follow the portrait pose instructions.");
  }

  function acceptCapture() {
    if (!reviewImage) return;

    const next = [
      ...capturesRef.current,
      { name: current.name, image: reviewImage },
    ];

    capturesRef.current = next;
    setCaptures(next);
    setReviewImage(null);
    stableSinceRef.current = 0;
    busyRef.current = false;

    if (indexRef.current >= PORTRAITS.length - 1) {
      setFinished(true);
      setMessage("The portrait gallery has been restored!");
      stopCamera();
    } else {
      const nextIndex = indexRef.current + 1;
      indexRef.current = nextIndex;
      setPortraitIndex(nextIndex);
      setMessage("Portrait saved in this session. On to the next one!");
    }
  }

  function exitGame() {
    stopCamera();
    onBack?.();
  }

  return (
    <main className="portraits-game">
      <header className="portraits-header">
        <button onClick={exitGame}>← Missions</button>
        <div>
          <span>FACEQUEST / MEMORY GALLERY</span>
          <h1>THE LOST PORTRAITS</h1>
        </div>
        <strong>✧ {reward} XP</strong>
      </header>

      <section className="portraits-progress">
        {PORTRAITS.map((portrait, index) => (
          <div
            key={portrait.name}
            className={
              index < captures.length
                ? "portrait-step done"
                : index === portraitIndex && !finished
                  ? "portrait-step active"
                  : "portrait-step"
            }
          >
            <span>{index < captures.length ? "✓" : portrait.symbol}</span>
            <small>{portrait.name}</small>
          </div>
        ))}
      </section>

      <div className="portraits-layout">
        <section className="portraits-gallery">
          <div className="portraits-gallery-heading">
            <span>THE ROYAL ARCHIVE</span>
            <h2>{finished ? "A Gallery Restored" : current.name}</h2>
            <p>
              {finished
                ? "Every frame has been reviewed and accepted."
                : current.pose}
            </p>
          </div>

          <div className="portrait-wall">
            {PORTRAITS.map((portrait, index) => (
              <div
                className={`portrait-frame ${
                  index < captures.length ? "portrait-filled" : ""
                } ${index === portraitIndex && !finished ? "portrait-current" : ""}`}
                key={portrait.name}
              >
                <div className="portrait-art">
                  {captures[index] ? (
                    <img src={captures[index].image} alt={portrait.name} />
                  ) : (
                    <span>{portrait.symbol}</span>
                  )}
                </div>
                <small>{portrait.name}</small>
              </div>
            ))}
          </div>

          <div className="portraits-story">
            <span>ARCHIVE STATUS</span>
            <strong>{captures.length} / {PORTRAITS.length} portraits restored</strong>
            <div className="portraits-meter">
              <span style={{ width: `${(captures.length / PORTRAITS.length) * 100}%` }} />
            </div>
          </div>
        </section>

        <aside className="portraits-control">
          <div className="portraits-camera">
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraReady && (
              <div className="portraits-camera-placeholder">
                <span>◎</span>
                CAMERA STANDBY
              </div>
            )}
            {cameraReady && faceFound && (
              <div className="portraits-face-label">● FACE DETECTED</div>
            )}
          </div>

          <p className={faceFound ? "portrait-face-found" : ""}>
            {faceFound ? "Face visible in frame" : "Waiting for face"}
          </p>

          {reviewImage && (
            <div className="portrait-review">
              <h3>Review your portrait</h3>
              <img src={reviewImage} alt="Portrait preview for review" />
              <p>Keep this image or retake it before continuing.</p>
              <div className="portrait-review-actions">
                <button onClick={retake}>RETAKE</button>
                <button onClick={acceptCapture}>ACCEPT & CONTINUE</button>
              </div>
            </div>
          )}

          {!cameraReady && !finished && (
            <>
              <p className="portraits-note">
                Follow each pose prompt and hold still. A frame is captured
                automatically when a face is detected at a suitable size.
                You can review or retake it. Images stay in browser memory and
                are not uploaded. The prompts guide head poses but do not verify
                exact angles.
              </p>
              <label className="portraits-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                I agree to camera use for this demo.
              </label>
              <button
                className="portraits-start"
                disabled={!consent}
                onClick={startGallery}
              >
                ENTER THE GALLERY →
              </button>
            </>
          )}

          {error && <p className="portraits-error">{error}</p>}
          <p className="portraits-status" role="status">{message}</p>

          {finished && (
            <button
              className="portraits-start"
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
