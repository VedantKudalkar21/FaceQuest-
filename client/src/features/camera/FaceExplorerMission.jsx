
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const STEPS = [
  { title: "Face Forward", instruction: "Look straight into the camera.", angle: "FRONT" },
  { title: "Look Left", instruction: "Slowly turn your face to your left.", angle: "LEFT" },
  { title: "Look Right", instruction: "Slowly turn your face to your right.", angle: "RIGHT" },
  { title: "Left Profile", instruction: "Turn further left to show your side profile.", angle: "LEFT PROFILE" },
  { title: "Right Profile", instruction: "Turn further right to show your side profile.", angle: "RIGHT PROFILE" },
  { title: "Look Up", instruction: "Gently tilt your face upward.", angle: "UP" },
];

export default function FaceExplorerMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [step, setStep] = useState(0);
  const [captures, setCaptures] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  const current = STEPS[step];

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

  async function startCamera() {
    setError("");

    if (!consent) {
      setError("Please read and accept the participation notice.");
      return;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      detectorRef.current = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.6,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera permission was denied. Allow camera access in your browser."
          : "Could not start the camera or load face detection. Check your connection and try again."
      );
      stopCamera();
    }
  }

  async function captureCheckpoint() {
    const video = videoRef.current;
    const detector = detectorRef.current;

    if (!video || !detector || !video.videoWidth || busy) return;

    setBusy(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const result = detector.detect(canvas);

      if (!result.detections?.length) {
        setError("No face detected. Center your face and try again.");
        return;
      }

      const image = canvas.toDataURL("image/jpeg", 0.85);
      const nextCaptures = [...captures, { angle: current.angle, image }];
      setCaptures(nextCaptures);

      if (step === STEPS.length - 1) {
        stopCamera();
        setComplete(true);
      } else {
        setStep((value) => value + 1);
      }
    } catch {
      setError("Capture failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function finishMission() {
    // Images remain in memory and are not uploaded or persisted.
    onComplete?.(nextXP);
  }

  const nextXP = STEPS.length * 50;

  return (
    <main className="camera-mission">
      <header className="camera-header">
        <button className="camera-back" onClick={() => {
          stopCamera();
          onBack?.();
        }}>
          ← Back to command center
        </button>
        <div className="camera-brand">
          FACE<span>QUEST</span>
          <small>FACE EXPLORER</small>
        </div>
        <span className="camera-status">
          {cameraReady ? "CAMERA ACTIVE" : "STANDBY"}
        </span>
      </header>

      <section className="camera-content">
        <div className="camera-kicker">EXPLORATION NETWORK / FACE QUEST</div>
        <h1>The Face <span>Explorer.</span></h1>
        <p className="camera-intro">
          Complete six guided face-angle checkpoints to earn your Explorer reward.
        </p>

        {!complete && (
          <>
            <div className="camera-steps">
              <span className="active">CONSENT</span>
              <span className={cameraReady ? "active" : ""}>CAPTURE</span>
              <span>COMPLETE</span>
            </div>

            {!cameraReady && (
              <section className="camera-consent-panel">
                <h2>Your face. Your choice.</h2>
                <p>
                  This demo checks for a face in each captured frame.
                  It does not verify the requested angle or identify you.
                  Images stay in browser memory and are not uploaded.
                </p>
                <label className="camera-consent-check">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  I understand this demo's camera and image-processing behavior
                  and want to participate.
                </label>
                <button
                  className="camera-primary-button"
                  onClick={startCamera}
                  disabled={!consent}
                >
                  START FACE QUEST →
                </button>
              </section>
            )}

            <section className="camera-preview-panel">
              <div className="camera-panel-top">
                <span>CHECKPOINT {step + 1} / {STEPS.length}</span>
                <span>{captures.length} CAPTURED</span>
              </div>

              <div className="camera-viewport">
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  muted
                  playsInline
                />
                {!cameraReady && (
                  <div className="camera-placeholder">
                    <strong>CAMERA STANDBY</strong>
                    <span>Accept the notice to begin.</span>
                  </div>
                )}
                {cameraReady && (
                  <div className="camera-guides" aria-hidden="true">
                    <div className="camera-face-frame" />
                    <span className="camera-guide-text">
                      FOLLOW THE ANGLE INSTRUCTIONS
                    </span>
                  </div>
                )}
              </div>

              {cameraReady && (
                <div className="camera-review">
                  <div className="camera-panel-label">{current.angle}</div>
                  <h2>{current.title}</h2>
                  <p>{current.instruction}</p>
                  <p>
                    <strong>{captures.length} of {STEPS.length}</strong> checkpoints captured
                  </p>
                  <button
                    className="camera-primary-button"
                    onClick={captureCheckpoint}
                    disabled={busy}
                  >
                    {busy ? "CHECKING FACE..." : "CAPTURE CHECKPOINT"}
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {complete && (
          <section className="camera-consent-panel">
            <h2>Explorer mission complete!</h2>
            <p>
              You captured a frame with a detected face at each of the six
              prompted checkpoints. Requested angles were not automatically
              verified by this prototype.
            </p>
            <p><strong>Reward: {nextXP} XP</strong></p>
            <button className="camera-primary-button" onClick={finishMission}>
              CLAIM {nextXP} XP →
            </button>
          </section>
        )}

        {error && <div className="camera-error" role="alert">{error}</div>}
        <p className="camera-privacy-note">
          CAMERA ACCESS REQUIRES PERMISSION · IMAGES ARE NOT UPLOADED
        </p>
      </section>
    </main>
  );
}
