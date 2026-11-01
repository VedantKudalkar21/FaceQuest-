import { useEffect, useRef, useState } from "react";
import "./MissionPhotoSave.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

async function preparePhoto(source) {
  const image = new Image();
  image.src = source;
  await image.decode();

  const scale = Math.min(
    1,
    960 / Math.max(image.width, image.height)
  );

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare a photo for upload.");
  }

  context.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function MissionPhotoSave({
  captures = [],
  mission,
  reward = 0,
  onComplete,
}) {
  const photos = captures.filter(
    (capture) =>
      typeof capture?.image === "string" &&
      capture.image
  );

  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState("");

  const savedIndexes = useRef(new Set());
  const busyRef = useRef(false);
  const completedRef = useRef(false);
  const mountedRef = useRef(true);
  const requestRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  async function finishMission() {
    if (busyRef.current || completedRef.current) return;

    busyRef.current = true;
    setSaving(true);
    setError("");

    try {
      if (consent) {
        const token = localStorage.getItem("facequest-token");

        if (!token) {
          throw new Error(
            "Please log in again to save your photos."
          );
        }

        for (let index = 0; index < photos.length; index++) {
          // On retry, skip photos already confirmed as saved.
          if (savedIndexes.current.has(index)) continue;

          const image = await preparePhoto(
            photos[index].image
          );

          if (!mountedRef.current) return;

          const controller = new AbortController();
          requestRef.current = controller;

          const timeout = window.setTimeout(
            () => controller.abort(),
            60000
          );

          try {
            const response = await fetch(
              `${API_BASE}/api/images`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                signal: controller.signal,
                body: JSON.stringify({
                  image,
                  mission,
                  consent: true,
                }),
              }
            );

            if (!response.ok) {
              const data = await response
                .json()
                .catch(() => ({}));

              throw new Error(
                data.message || "Could not save a photo."
              );
            }

            savedIndexes.current.add(index);

            if (mountedRef.current) {
              setSavedCount(savedIndexes.current.size);
            }
          } finally {
            window.clearTimeout(timeout);
            requestRef.current = null;
          }
        }
      }

      if (!mountedRef.current) return;

      completedRef.current = true;
      onComplete?.(reward);
    } catch (err) {
      if (mountedRef.current) {
        const reason =
          err.name === "AbortError"
            ? "The upload timed out."
            : err.message || "Upload failed.";

        setError(
          `${reason} Retry to save the remaining photos, ` +
            "or uncheck the save option and claim your reward. " +
            "Photos already saved will remain in your gallery."
        );
      }
    } finally {
      busyRef.current = false;

      if (mountedRef.current) {
        setSaving(false);
      }
    }
  }

  return (
    <section
      className="mission-photo-save"
      aria-label="Save mission photos"
    >
      <span className="mission-photo-kicker">
        MISSION COMPLETE
      </span>

      <h3>Your mission moments.</h3>

      <p>
        Review your {photos.length} captured photos before
        claiming your reward.
      </p>

      <div className="mission-photo-thumbs">
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo.image}
            alt={`Captured checkpoint ${index + 1}`}
          />
        ))}
      </div>

      <label className="mission-photo-consent">
        <input
          type="checkbox"
          checked={consent}
          disabled={saving || !photos.length}
          onChange={(event) =>
            setConsent(event.target.checked)
          }
        />

        <span>
          I agree to save these photos to my FaceQuest
          account. I can view and delete them in My Gallery.
        </span>
      </label>

      {savedCount > 0 && (
        <p
          className="mission-photo-progress"
          role="status"
        >
          {savedCount} / {photos.length} photos saved.
        </p>
      )}

      {error && (
        <p className="mission-photo-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="mission-photo-button"
        onClick={finishMission}
        disabled={saving}
      >
        {saving
          ? `Saving ${savedCount} / ${photos.length}…`
          : consent
            ? `Save photos & claim ${reward} XP →`
            : savedCount > 0
              ? `Claim ${reward} XP without saving remaining photos →`
              : `Claim ${reward} XP without saving photos →`}
      </button>

      <small>
        Photos upload only when you choose to save.
        Leaving the mission discards captures that have
        not been saved.
      </small>
    </section>
  );
}