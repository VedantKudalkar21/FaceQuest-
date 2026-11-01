import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

// Basic sharpness estimate using Laplacian variance.
function estimateSharpness({ data, width, height }) {
  const gray = new Float32Array(width * height);

  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;

    gray[i] =
      0.299 * data[p] +
      0.587 * data[p + 1] +
      0.114 * data[p + 2];
  }

  let sum = 0;
  let squared = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = y * width + x;

      const value =
        gray[i - width] +
        gray[i + width] +
        gray[i - 1] +
        gray[i + 1] -
        4 * gray[i];

      sum += value;
      squared += value * value;
      count++;
    }
  }

  return count ? squared / count - (sum / count) ** 2 : 0;
}

export default function CameraMission({ onBack, onComplete }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const completedRef = useRef(false);
  const uploadRef = useRef(null);

  const [consent, setConsent] = useState(false);
  const [saveConsent, setSaveConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [quality, setQuality] = useState(null);
  const [faceDetected, setFaceDetected] = useState(null);
  const [checkingFace, setCheckingFace] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [error, setError] = useState("");

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (mountedRef.current) {
      setCameraReady(false);
    }
  }

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      streamRef.current?.getTracks().forEach((track) => track.stop());
      detectorRef.current?.close();
      uploadRef.current?.abort();
    };
  }, []);

  // Attach the stream after the video element mounts.
  // This also handles restarting the camera after a retake.
  useEffect(() => {
    const video = videoRef.current;

    if (
      !cameraReady ||
      capturedImage ||
      !video ||
      !streamRef.current
    ) {
      return;
    }

    let active = true;

    video.srcObject = streamRef.current;

    video.play().catch(() => {
      if (!active) return;

      stopCamera();
      setError(
        "Could not play the camera preview. Please activate it again."
      );
    });

    return () => {
      active = false;
    };
  }, [cameraReady, capturedImage]);

  async function startCamera() {
    if (busyRef.current || completedRef.current) return;

    if (!consent) {
      setError("Please accept the camera notice first.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera access requires HTTPS or localhost and a supported browser."
      );
      return;
    }

    busyRef.current = true;

    setStarting(true);
    setError("");
    stopCamera();

    setCapturedImage("");
    setQuality(null);
    setFaceDetected(null);
    setAccepted(false);
    setSaveConsent(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      // Stop a late permission response if the player already left.
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      setCameraReady(true);
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera access was denied. Enable it in your browser settings."
            : "Unable to start the camera. Check that another app is not using it."
        );
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setStarting(false);
      }
    }
  }

  async function detectFace(imageDataUrl) {
    // Reuse the detector instead of downloading it for every capture.
    if (!detectorRef.current) {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      if (!mountedRef.current) return null;

      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.5,
      });

      if (!mountedRef.current) {
        detector.close();
        return null;
      }

      detectorRef.current = detector;
    }

    const image = new Image();
    image.src = imageDataUrl;
    await image.decode();

    if (!mountedRef.current) return null;

    const result = detectorRef.current.detect(image);

    return result.detections.length > 0;
  }

  async function captureImage() {
    if (busyRef.current || !cameraReady) return;

    const video = videoRef.current;

    if (
      !video?.videoWidth ||
      !video.videoHeight ||
      video.readyState < 2
    ) {
      setError(
        "The camera is still getting ready. Please try again."
      );
      return;
    }

    busyRef.current = true;

    setCheckingFace(true);
    setFaceDetected(null);
    setAccepted(false);
    setSaveConsent(false);
    setError("");

    try {
      const canvas = document.createElement("canvas");

      // Bound the image dimensions before processing.
      const scale = Math.min(
        1,
        1280 / Math.max(video.videoWidth, video.videoHeight)
      );

      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);

      const context = canvas.getContext("2d", {
        willReadFrequently: true,
      });

      if (!context) {
        throw new Error("Unable to process the camera image.");
      }

      context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      let totalBrightness = 0;
      let samples = 0;

      const step = Math.max(
        4,
        Math.floor(imageData.data.length / 48000) * 4
      );

      for (let i = 0; i < imageData.data.length; i += step) {
        totalBrightness +=
          0.299 * imageData.data[i] +
          0.587 * imageData.data[i + 1] +
          0.114 * imageData.data[i + 2];

        samples++;
      }

      const brightness = Math.round(totalBrightness / samples);
      const sharpness = estimateSharpness(imageData);

      setQuality({
        width: canvas.width,
        height: canvas.height,
        brightness,
        blurScore: Math.round(sharpness * 100) / 100,
        enoughResolution:
          Math.max(canvas.width, canvas.height) >= 640 &&
          Math.min(canvas.width, canvas.height) >= 480,
        acceptableBrightness:
          brightness >= 45 && brightness <= 215,
        acceptableSharpness: sharpness >= 80,
      });

      const photo = canvas.toDataURL("image/jpeg", 0.85);

      setCapturedImage(photo);
      stopCamera();

      try {
        const found = await detectFace(photo);

        if (mountedRef.current) {
          setFaceDetected(found);
        }
      } catch {
        if (mountedRef.current) {
          setError(
            "Face detection could not load. Check your internet connection and retake the photo."
          );
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || "Could not capture this photo.");
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setCheckingFace(false);
      }
    }
  }

  const checksPassed = Boolean(
    capturedImage &&
      quality?.enoughResolution &&
      quality.acceptableBrightness &&
      quality.acceptableSharpness &&
      faceDetected === true &&
      !checkingFace
  );

  function acceptCapture() {
    if (!checksPassed) return;

    setAccepted(true);
    setError("");
  }

  async function finishMission() {
    if (
      !accepted ||
      !checksPassed ||
      busyRef.current ||
      completedRef.current
    ) {
      return;
    }

    busyRef.current = true;
    setError("");

    let timeout;

    try {
      if (saveConsent) {
        const token = localStorage.getItem("facequest-token");

        if (!token) {
          throw new Error(
            "Your session expired. Please log in again."
          );
        }

        setSavingImage(true);

        // Compress the reviewed photo before uploading it.
        const image = new Image();
        image.src = capturedImage;
        await image.decode();

        if (!mountedRef.current) return;

        const canvas = document.createElement("canvas");
        const scale = Math.min(
          1,
          960 / Math.max(image.width, image.height)
        );

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Could not prepare this photo for upload."
          );
        }

        context.drawImage(
          image,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const controller = new AbortController();
        uploadRef.current = controller;

        timeout = window.setTimeout(
          () => controller.abort(),
          60000
        );

        const response = await fetch(`${API_BASE}/api/images`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            image: canvas.toDataURL("image/jpeg", 0.82),
            mission: "light-seeker",
            consent: true,
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Could not save your photo."
          );
        }
      }

      if (!mountedRef.current) return;

      completedRef.current = true;
      stopCamera();
      onComplete?.();
    } catch (err) {
      if (mountedRef.current) {
        setError(
          err.name === "AbortError"
            ? "The upload timed out. Your photo is still here. Please retry."
            : `${err.message || "Upload failed."} You can retry or finish without saving.`
        );
      }
    } finally {
      window.clearTimeout(timeout);
      uploadRef.current = null;
      busyRef.current = false;

      if (mountedRef.current) {
        setSavingImage(false);
      }
    }
  }

  function leaveMission() {
    if (savingImage) return;

    stopCamera();
    onBack?.();
  }

  return (
    <main className="camera-mission">
      <header className="camera-header">
        <button
          type="button"
          className="camera-back"
          onClick={leaveMission}
          disabled={savingImage}
        >
          ← Back to command center
        </button>

        <div className="camera-brand">
          FACE<span>QUEST</span>
          <small>CAPTURE PROTOCOL 01</small>
        </div>

        <span className="camera-status">
          <i />
          {savingImage ? "SAVING PHOTO" : "CAPTURE MISSION"}
        </span>
      </header>

      <section className="camera-content">
        <div className="camera-kicker">
          EXPLORATION NETWORK / DATA MISSION
        </div>

        <h1>
          Restore the <span>signal.</span>
        </h1>

        <p className="camera-intro">
          Capture a clear photo, review it, and choose whether to
          save it to your account.
        </p>

        <div className="camera-steps">
          <span className="active">01 · CONSENT</span>

          <span
            className={cameraReady || capturedImage ? "active" : ""}
          >
            02 · CAPTURE
          </span>

          <span className={capturedImage ? "active" : ""}>
            03 · REVIEW
          </span>
        </div>

        {!capturedImage && (
          <section className="camera-consent-panel">
            <div className="camera-panel-label">
              BEFORE YOU BEGIN
            </div>

            <h2>Your image. Your choice.</h2>

            <p>
              Face detection and basic image-quality checks run in
              your browser. No photo is uploaded until you explicitly
              choose to save it.
            </p>

            <ul>
              <li>
                Your browser asks permission to access the camera.
              </li>
              <li>You can review and retake your photo.</li>
              <li>
                You can claim the reward without saving the photo.
              </li>
              <li>
                If you choose to save, the photo is stored in the
                FaceQuest database and linked to your account.
              </li>
            </ul>

            <label className="camera-consent-check">
              <input
                type="checkbox"
                checked={consent}
                disabled={starting || cameraReady}
                onChange={(event) =>
                  setConsent(event.target.checked)
                }
              />

              <span>
                I agree to use my camera for this mission. Saving
                my photo is a separate choice after review.
              </span>
            </label>

            <button
              type="button"
              className="camera-primary-button"
              onClick={startCamera}
              disabled={!consent || starting || cameraReady}
            >
              {starting
                ? "STARTING CAMERA..."
                : cameraReady
                  ? "CAMERA ACTIVE"
                  : "ACTIVATE CAMERA ↗"}
            </button>
          </section>
        )}

        <section className="camera-preview-panel">
          <div className="camera-panel-top">
            <span>CAPTURE FEED</span>

            <span>
              {capturedImage
                ? "IMAGE READY"
                : cameraReady
                  ? "CAMERA ACTIVE"
                  : "STANDBY"}
            </span>
          </div>

          <div className="camera-viewport">
            {capturedImage ? (
              <img
                className="camera-captured-image"
                src={capturedImage}
                alt="Your captured photo for review"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay
                  muted
                  playsInline
                  aria-label="Live camera preview"
                />

                {!cameraReady && (
                  <div className="camera-placeholder">
                    <span className="camera-placeholder-icon">
                      ⌖
                    </span>
                    <strong>CAMERA STANDBY</strong>
                    <span>Accept the notice to begin.</span>
                  </div>
                )}

                {cameraReady && (
                  <div
                    className="camera-guides"
                    aria-hidden="true"
                  >
                    <div className="camera-face-frame" />

                    <span className="camera-guide-text">
                      CENTER YOUR FACE IN THE FRAME
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {cameraReady && !capturedImage && (
            <button
              type="button"
              className="camera-primary-button camera-capture-button"
              onClick={captureImage}
              disabled={starting || checkingFace}
            >
              CAPTURE IMAGE ◎
            </button>
          )}

          {capturedImage && quality && (
            <div className="camera-review">
              <div className="camera-panel-label">
                IMAGE REVIEW
              </div>

              <h3>Review your capture</h3>

              <div className="camera-quality-grid">
                <div>
                  <span>RESOLUTION</span>

                  <strong>
                    {quality.width} × {quality.height}
                  </strong>

                  <small
                    className={
                      quality.enoughResolution ? "good" : "bad"
                    }
                  >
                    {quality.enoughResolution
                      ? "Resolution check passed"
                      : "Resolution too low"}
                  </small>
                </div>

                <div>
                  <span>BRIGHTNESS</span>
                  <strong>{quality.brightness}/255</strong>

                  <small
                    className={
                      quality.acceptableBrightness ? "good" : "bad"
                    }
                  >
                    {quality.acceptableBrightness
                      ? "Lighting check passed"
                      : "Retake with better lighting"}
                  </small>
                </div>
              </div>

              <div className="camera-blur-result">
                <span>IMAGE SHARPNESS</span>

                <strong
                  className={
                    quality.acceptableSharpness ? "good" : "bad"
                  }
                >
                  {quality.acceptableSharpness
                    ? "✓ Sharpness check passed"
                    : "✕ Image may be blurry — retake"}
                </strong>

                <small>
                  Sharpness score: {quality.blurScore}
                </small>
              </div>

              <div
                className="camera-face-result"
                aria-live="polite"
              >
                <span>FACE DETECTION</span>

                <strong
                  className={
                    faceDetected === true
                      ? "good"
                      : faceDetected === false
                        ? "bad"
                        : ""
                  }
                >
                  {checkingFace
                    ? "Checking image..."
                    : faceDetected === true
                      ? "✓ Face detected"
                      : faceDetected === false
                        ? "✕ No face detected — retake"
                        : "Detection unavailable — retake to retry"}
                </strong>
              </div>

              <p className="camera-disclaimer">
                These are basic technical checks. Face detection
                does not identify you or verify your pose.
                Brightness and sharpness scores are estimates.
              </p>

              <div className="camera-review-actions">
                <button
                  type="button"
                  className="camera-secondary-button"
                  onClick={startCamera}
                  disabled={
                    checkingFace || starting || savingImage
                  }
                >
                  RETAKE IMAGE
                </button>

                <button
                  type="button"
                  className="camera-primary-button"
                  onClick={acceptCapture}
                  disabled={
                    !checksPassed || accepted || savingImage
                  }
                >
                  {accepted
                    ? "CAPTURE ACCEPTED ✓"
                    : "ACCEPT CAPTURE"}
                </button>
              </div>

              {accepted && (
                <div className="camera-success">
                  <p role="status">
                    Photo accepted. Choose whether to save it
                    before claiming your reward.
                  </p>

                  <label className="camera-consent-check">
                    <input
                      type="checkbox"
                      checked={saveConsent}
                      disabled={savingImage}
                      onChange={(event) =>
                        setSaveConsent(event.target.checked)
                      }
                    />

                    <span>
                      I agree to save this photo to my FaceQuest
                      account.
                    </span>
                  </label>

                  <button
                    type="button"
                    className="camera-primary-button"
                    onClick={finishMission}
                    disabled={savingImage}
                  >
                    {savingImage
                      ? "SAVING PHOTO..."
                      : saveConsent
                        ? "SAVE PHOTO & CLAIM REWARD →"
                        : "CLAIM WITHOUT SAVING →"}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="camera-error" role="alert">
            {error}
          </div>
        )}

        <p className="camera-privacy-note">
          CAMERA ACCESS IS CONTROLLED BY YOUR BROWSER · PHOTOS
          UPLOAD ONLY WHEN YOU CHOOSE TO SAVE
        </p>
      </section>
    </main>
  );
}