import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

export default function CameraMission({ onBack, onComplete }) {
    function finishMission() {
        if (typeof onComplete === "function") {
            onComplete();
        }
    }
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [consent, setConsent] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [quality, setQuality] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [faceDetected, setFaceDetected] = useState(null);
  const [checkingFace, setCheckingFace] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startCamera() {
    setError("");
    setMessage("");
    setCapturedImage("");
    setQuality(null);

    if (!consent) {
      setError("Please read and accept the contribution notice first.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is unavailable. Use HTTPS or localhost in a supported browser.");
      return;
    }

    try {
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera access was denied. You can enable it in your browser settings."
          : "Unable to start the camera. Check that it is connected and not being used by another app."
      );
    }
  }

  async function detectFace(imageDataUrl) {
  setCheckingFace(true);
  setFaceDetected(null);

  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    const detector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "CPU",
      },
      runningMode: "IMAGE",
      minDetectionConfidence: 0.5,
    });

    const image = new Image();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = imageDataUrl;
    });

    const result = detector.detect(image);
    const found = result.detections.length > 0;

    setFaceDetected(found);
    detector.close();

    return found;
  } catch (error) {
    console.error("Face detection failed:", error);
    setError(
      "Face detection could not load. Check your internet connection and try again."
    );
    return null;
  } finally {
    setCheckingFace(false);
  }
 }

 function estimateBlur(imageData) {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);

  // Convert image pixels to grayscale.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      gray[y * width + x] =
        0.299 * data[i] +
        0.587 * data[i + 1] +
        0.114 * data[i + 2];
    }
  }

  // Estimate sharpness using the variance of the Laplacian.
  let sum = 0;
  let sumSquared = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const i = y * width + x;

      const laplacian =
        gray[i - width] +
        gray[i + width] +
        gray[i - 1] +
        gray[i + 1] -
        4 * gray[i];

      sum += laplacian;
      sumSquared += laplacian * laplacian;
      count++;
    }
  }

  const mean = sum / count;
  return sumSquared / count - mean * mean;
 }


  async function captureImage() {
    const video = videoRef.current;

    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("The camera is not ready yet. Please wait and try again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!context) {
      setError("Unable to process this image in your browser.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const pixels = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;

    // Sample pixels to estimate overall image brightness.
    // This does not detect faces or prove image quality.
    let totalBrightness = 0;
    let samples = 0;
    const step = Math.max(4, Math.floor(pixels.length / 12000 / 4) * 4);

    for (let i = 0; i < pixels.length; i += step) {
      totalBrightness +=
        0.299 * pixels[i] +
        0.587 * pixels[i + 1] +
        0.114 * pixels[i + 2];
      samples++;
    }

    const brightness = Math.round(totalBrightness / samples);
    const blurScore = estimateBlur(
        context.getImageData(0, 0, canvas.width, canvas.height)
    );

    const acceptableSharpness = blurScore >= 80;
    const enoughResolution =
      canvas.width >= 640 && canvas.height >= 480;
    const acceptableBrightness =
      brightness >= 45 && brightness <= 215;

    setQuality({
      width: canvas.width,
      height: canvas.height,
      brightness,
      enoughResolution,
      acceptableBrightness,
      blurScore: Math.round(blurScore * 100) / 100,
      acceptableSharpness,
    });

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageDataUrl);
    await detectFace(imageDataUrl);
    setError("");
    stopCamera();
  }

  function retakeImage() {
    setCapturedImage("");
    setQuality(null);
    setMessage("");
  }

  
    function submitDemoCapture() {
        if (!capturedImage || !quality || checkingFace) return;

        if (faceDetected !== true) {
            setError("Please make sure a face is detected before continuing.");
            return;
        }

        if (!quality.enoughResolution || !quality.acceptableBrightness || !quality.acceptableSharpness) {
            setError("Please retake the image after correcting the quality warnings.");
            return;
        }

        setError("");
        setMessage("Capture accepted successfully! Your image passed all demo checks.");
    }


  return (
    <main className="camera-mission">
      <header className="camera-header">
        <button className="camera-back" onClick={onBack}>
          ← Back to command center
        </button>

        <div className="camera-brand">
          FACE<span>QUEST</span>
          <small>CAPTURE PROTOCOL 01</small>
        </div>

        <span className="camera-status">
          <i /> SECURE SESSION
        </span>
      </header>

      <section className="camera-content">
        <div className="camera-kicker">EXPLORATION NETWORK / DATA MISSION</div>
        <h1>
          Restore the <span>signal.</span>
        </h1>
        <p className="camera-intro">
          Complete this guided capture mission to earn an artifact.
          You can leave at any time.
        </p>

        <div className="camera-steps">
          <span className="active">01 · CONSENT</span>
          <span className={cameraReady || capturedImage ? "active" : ""}>
            02 · CAPTURE
          </span>
          <span className={capturedImage ? "active" : ""}>
            03 · REVIEW
          </span>
        </div>

        {!capturedImage && (
          <section className="camera-consent-panel">
            <div className="camera-panel-label">BEFORE YOU BEGIN</div>
            <h2>Your image. Your choice.</h2>
            <p>
              This prototype demonstrates a facial image contribution
              flow. The image will be processed in your browser for this
              demo and will not be sent to a company server.
            </p>
            <ul>
              <li>The browser will ask permission to access your camera.</li>
              <li>You can review the captured image and retake it.</li>
              <li>This version does not upload or persist your image.</li>
              <li>Real collection requires a defined purpose, retention
                policy, secure storage and authorized processing.</li>
            </ul>

            <label className="camera-consent-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                I have read this notice and agree to participate in this
                demo capture. I understand that camera access is requested
                separately by my browser.
              </span>
            </label>

            <button
              className="camera-primary-button"
              onClick={startCamera}
              disabled={!consent || cameraReady}
            >
              ACTIVATE CAMERA <span>↗</span>
            </button>
          </section>
        )}

        <section className="camera-preview-panel">
          <div className="camera-panel-top">
            <span>LIVE CAPTURE FEED</span>
            <span>{capturedImage ? "IMAGE READY" : cameraReady ? "CAMERA ACTIVE" : "STANDBY"}</span>
          </div>

          <div className="camera-viewport">
            {capturedImage ? (
              <img
                className="camera-captured-image"
                src={capturedImage}
                alt="Your captured image for review"
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
                    <span className="camera-placeholder-icon">⌖</span>
                    <strong>CAMERA STANDBY</strong>
                    <span>Accept the notice to begin.</span>
                  </div>
                )}

                {cameraReady && (
                  <div className="camera-guides" aria-hidden="true">
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
              className="camera-primary-button camera-capture-button"
              onClick={captureImage}
            >
              CAPTURE IMAGE <span>◎</span>
            </button>
          )}

          {capturedImage && quality && (
            <div className="camera-review">
              <div className="camera-panel-label">IMAGE REVIEW</div>
              <h3>Review your capture</h3>

              <div className="camera-quality-grid">
                <div>
                  <span>RESOLUTION</span>
                  <strong>
                    {quality.width} × {quality.height}
                  </strong>
                  <small className={quality.enoughResolution ? "good" : "bad"}>
                    {quality.enoughResolution ? "Meets demo threshold" : "Resolution too low"}
                  </small>
                </div>
                <div>
                  <span>BRIGHTNESS</span>
                  <strong>{quality.brightness}/255</strong>
                  <small className={quality.acceptableBrightness ? "good" : "bad"}>
                    {quality.acceptableBrightness ? "Within demo range" : "Retake with better lighting"}
                  </small>
                </div>
              </div>

              <div className="camera-blur-result">
                <span>IMAGE SHARPNESS</span>
                <strong className={quality.acceptableSharpness ? "good" : "bad"}>
                    {quality.acceptableSharpness
                    ? "✓ Sharpness check passed"
                    : "✕ Image may be blurry — retake"}
                </strong>
                <small>Sharpness score: {quality.blurScore}</small>
              </div>

              <div className="camera-face-result">
                    <span>FACE DETECTION</span>

                    {checkingFace ? (
                        <strong>Checking image...</strong>
                    ) : faceDetected === true ? (
                        <strong className="good">✓ Face detected</strong>
                    ) : faceDetected === false ? (
                        <strong className="bad">✕ No face detected — retake image</strong>
                    ) : (
                        <strong>Waiting for detection</strong>
                    )}
              </div>

              <p className="camera-disclaimer">
                These are basic technical checks only. This version does
                not detect faces or assess blur, pose or identity.
              </p>

              <div className="camera-review-actions">
                <button className="camera-secondary-button" onClick={retakeImage}>
                  RETAKE IMAGE
                </button>

                <button
                  className="camera-primary-button"
                  onClick={submitDemoCapture}
                  disabled={
                    checkingFace ||
                    faceDetected !== true ||
                    !quality.enoughResolution ||
                    !quality.acceptableBrightness ||
                    !quality.acceptableSharpness
                  }
                >
                  ACCEPT DEMO CAPTURE
                </button>
              </div>

              {message && (
                <div className="camera-success" role="status">
                  {message}
                  <button onClick={finishMission}>
                    CLAIM MISSION REWARD →
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
          CAMERA ACCESS IS CONTROLLED BY YOUR BROWSER · THIS DEMO DOES NOT UPLOAD IMAGES
        </p>
      </section>
    </main>
  );
}
