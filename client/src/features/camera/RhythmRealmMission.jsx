
import { useEffect, useRef, useState } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";


const audioRef = { current: null };

function playRhythmSound(frequency = 440, duration = 0.15, type = "sine") {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioRef.current) {
      audioRef.current = new AudioContextClass();
    }

    const ctx = audioRef.current;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.warn("Audio playback unavailable:", error);
  }
}


const BEATS = [
  { name: "Moonlight Melody", note: "♪", color: "#9c9cff" },
  { name: "Crystal Rhythm", note: "♫", color: "#63edff" },
  { name: "Forest Symphony", note: "♬", color: "#72ffbd" },
  { name: "Starlight Chorus", note: "♩", color: "#ff9bd7" },
  { name: "The Grand Finale", note: "★", color: "#ffd578" },
];

export default function RhythmRealmMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const stableSinceRef = useRef(0);
  const lastCheckRef = useRef(0);
  const busyRef = useRef(false);
  const roundRef = useRef(0);
  const capturesRef = useRef([]);

  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [faceFound, setFaceFound] = useState(false);
  const [round, setRound] = useState(0);
  const [captures, setCaptures] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [beatActive, setBeatActive] = useState(false);
  const [message, setMessage] = useState("Ready to find your rhythm?");
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  const current = BEATS[round] || BEATS[0];
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
      setError("Please agree to camera use first.");
      return;
    }

    try {
      setError("");
      setMessage("Tuning the magical instruments…");

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
      setMessage("Keep your face visible and tap the beat when the ring glows.");
    } catch (err) {
      console.error("Rhythm Realm startup error:", err);
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

    function monitorFace() {
      if (cancelled) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const now = performance.now();

      if (
        video?.readyState >= 2 &&
        detector &&
        now - lastCheckRef.current >= 180
      ) {
        lastCheckRef.current = now;

        try {
          const result = detector.detectForVideo(video, now);
          setFaceFound((result.detections?.length || 0) > 0);
        } catch (err) {
          console.error("Rhythm face detection error:", err);
        }
      }

      raf = requestAnimationFrame(monitorFace);
    }

    raf = requestAnimationFrame(monitorFace);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [cameraReady, finished]);

  useEffect(() => {
    if (!cameraReady || finished) return;

    const interval = window.setInterval(() => {
      setBeatActive(true);
      playRhythmSound(523, 0.3, "sine");

      window.setTimeout(() => setBeatActive(false), 550);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [cameraReady, finished, round]);

  function hitBeat() {
    if (!cameraReady || finished || busyRef.current) return;

    if (!faceFound) {
      setMessage("Keep your face visible to play the rhythm.");
      setCombo(0);
      return;
    }

    if (!beatActive) {
      setMessage("Missed the beat! Wait for the ring to glow.");
      setCombo(0);
      setScore((value) => Math.max(0, value - 5));
      return;
    }

    setScore((value) => value + 20 + Math.min(combo * 5, 30));
    setCombo((value) => value + 1);
    setMessage("Perfect beat! Keep the combo going.");
    playRhythmSound(784, 0.2, "triangle");

    const nextCombo = combo + 1;

    if (nextCombo >= 3) {
      captureCheckpoint();
    }
  }

  function captureCheckpoint() {
    if (busyRef.current || !videoRef.current || !faceFound) return;

    const video = videoRef.current;

    if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      setMessage("Camera is still warming up. Hit the next beat.");
      return;
    }

    busyRef.current = true;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/jpeg", 0.85);
    const next = [
      ...capturesRef.current,
      { name: BEATS[roundRef.current].name, image },
    ];

    capturesRef.current = next;
    setCaptures(next);
    setCombo(0);

    if (roundRef.current >= BEATS.length - 1) {
      setFinished(true);
      setMessage("The Realm sings with your rhythm! Quest complete.");
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setCameraReady(false);
    } else {
      const nextRound = roundRef.current + 1;
      roundRef.current = nextRound;
      setRound(nextRound);
      setMessage("Checkpoint captured! A new melody awaits.");
    }

    window.setTimeout(() => {
      busyRef.current = false;
    }, 900);
  }

  function exitGame() {
    stopCamera();
    onBack?.();
  }

  return (
    <main className="rhythm-game">
      <header className="rhythm-header">
        <button onClick={exitGame}>← Missions</button>
        <div>
          <span>FACEQUEST / MUSICAL REALM</span>
          <h1>RHYTHM OF THE REALM</h1>
        </div>
        <strong>★ {reward} XP</strong>
      </header>

      <section className="rhythm-rounds">
        {BEATS.map((beat, index) => (
          <div
            key={beat.name}
            className={
              index < captures.length
                ? "rhythm-round done"
                : index === round && !finished
                  ? "rhythm-round active"
                  : "rhythm-round"
            }
          >
            <span>{index < captures.length ? "✓" : beat.note}</span>
            <small>{beat.name}</small>
          </div>
        ))}
      </section>

      <div className="rhythm-layout">
        <section
          className="rhythm-stage"
          style={{ "--beat-color": current.color }}
        >
          <div className="rhythm-stars">♫　✧　♪　✦　♬</div>

          <div className={`rhythm-orb ${beatActive ? "glowing" : ""}`}>
            {current.note}
          </div>

          <div className={`rhythm-ring ${beatActive ? "ring-active" : ""}`}>
            <span>{beatActive ? "HIT!" : "WAIT"}</span>
          </div>

          <div className="rhythm-stage-copy">
            <span>TRACK {round + 1} / {BEATS.length}</span>
            <h2>{current.name}</h2>
            <p>Tap the beat when the glowing ring appears.</p>
          </div>

          <div className="rhythm-scoreboard">
            <div>
              <small>SCORE</small>
              <strong>{score}</strong>
            </div>
            <div>
              <small>COMBO</small>
              <strong>×{combo}</strong>
            </div>
            <div>
              <small>PORTRAITS</small>
              <strong>{captures.length}/{BEATS.length}</strong>
            </div>
          </div>
        </section>

        <aside className="rhythm-panel">
          <div className="rhythm-camera">
            <video ref={videoRef} autoPlay muted playsInline />
            {!cameraReady && (
              <div className="rhythm-camera-placeholder">
                <span>◎</span>
                CAMERA STANDBY
              </div>
            )}
            {cameraReady && faceFound && (
              <div className="rhythm-face-label">● FACE DETECTED</div>
            )}
          </div>

          <p className={faceFound ? "rhythm-face-found" : ""}>
            {faceFound ? "Performer detected" : "Waiting for performer"}
          </p>

          {!cameraReady && !finished && (
            <>
              <p className="rhythm-note">
                Tap the beat during the glow. Three successful hits in a row
                capture a frame and advance the song. Face detection checks
                visibility, not musical timing or eye gaze. Captures stay in
                browser memory and are not uploaded.
              </p>

              <label className="rhythm-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                I agree to camera use for this demo.
              </label>

              <button
                className="rhythm-primary"
                disabled={!consent}
                onClick={startGame}
              >
                ENTER THE MUSICAL REALM →
              </button>
            </>
          )}

          {cameraReady && (
            <button
              className={`rhythm-hit ${beatActive ? "hit-active" : ""}`}
              onClick={hitBeat}
            >
              {beatActive ? "♫ HIT THE BEAT! ♫" : "WAIT FOR THE BEAT"}
            </button>
          )}

          <p className="rhythm-status" role="status">{message}</p>
          {error && <p className="rhythm-error">{error}</p>}

          <div className="rhythm-captures">
            {BEATS.map((beat, index) => (
              <div key={beat.name}>
                {captures[index] ? (
                  <img src={captures[index].image} alt={`${beat.name} capture`} />
                ) : (
                  <span>{beat.note}</span>
                )}
              </div>
            ))}
          </div>

          {finished && (
            <button
              className="rhythm-primary"
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
