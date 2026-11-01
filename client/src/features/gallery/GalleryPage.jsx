import { useEffect, useRef, useState } from "react";
import "./GalleryPage.css";

const IMAGE_API = `${(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "")}/api/images`;

async function galleryRequest(path = "", options = {}) {
  const token = localStorage.getItem("facequest-token");

  if (!token) {
    throw new Error("Please log in again to open your gallery.");
  }

  const response = await fetch(`${IMAGE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: options.signal || AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      data.message || "The request failed. Please try again."
    );
  }

  return response;
}

// Protected images need an Authorization header.
// Fetch the image first, then display a temporary browser URL.
function PrivatePhoto({ id, alt }) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectURL;

    const controller = new AbortController();

    async function loadPhoto() {
      try {
        const response = await galleryRequest(
          `/${id}/content`,
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(60000),
            ]),
          }
        );

        const blob = await response.blob();

        if (!active) return;

        objectURL = URL.createObjectURL(blob);
        setSrc(objectURL);
      } catch {
        if (active) setFailed(true);
      }
    }

    loadPhoto();

    return () => {
      active = false;
      controller.abort();

      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [id]);

  if (failed) {
    return (
      <span className="fq-photo-placeholder">
        Photo unavailable. Close and reopen to retry.
      </span>
    );
  }

  if (!src) {
    return (
      <span className="fq-photo-placeholder">
        Loading photo…
      </span>
    );
  }

  return <img src={src} alt={alt} />;
}

function missionName(value) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function GalleryPage({ onBack }) {
  const [images, setImages] = useState([]);
  const [nextOffset, setNextOffset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dialogRef = useRef(null);
  const loadVersion = useRef(0);

  async function loadImages(offset = 0) {
    const version = ++loadVersion.current;

    setLoading(true);
    setError("");

    try {
      const response = await galleryRequest(
        `?offset=${offset}`
      );

      const data = await response.json();

      // Ignore a response if a newer request has replaced it.
      if (version !== loadVersion.current) return;

      setImages((current) => {
        const combined =
          offset === 0
            ? data.images
            : [...current, ...data.images];

        return [
          ...new Map(
            combined.map((image) => [image.id, image])
          ).values(),
        ];
      });

      setNextOffset(data.nextOffset);
    } catch (err) {
      if (version === loadVersion.current) {
        setError(err.message);
      }
    } finally {
      if (version === loadVersion.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadImages();

    return () => {
      loadVersion.current++;
    };
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (selected && !dialog.open) {
      dialog.showModal();
    } else if (!selected && dialog.open) {
      dialog.close();
    }
  }, [selected]);

  async function deletePhoto() {
    if (!selected || deleting) return;

    setDeleting(true);
    setError("");

    try {
      await galleryRequest(`/${selected.id}`, {
        method: "DELETE",
      });

      setSelected(null);
      setConfirmDelete(false);

      await loadImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="fq-gallery">
      <header className="fq-gallery-header">
        <span className="fq-gallery-brand">
          FACEQUEST<span>.</span>
        </span>

        <button
          className="fq-gallery-button secondary"
          onClick={onBack}
          disabled={deleting}
        >
          ← Dashboard
        </button>
      </header>

      <section className="fq-gallery-heading">
        <span>YOUR PERSONAL CAPTURE ARCHIVE</span>

        <h1>
          Your moments.
          <br />
          <em>Your universe.</em>
        </h1>

        <p>
          Photos you chose to save from your missions.
          Only your account can access them.
        </p>
      </section>

      {error && (
        <div className="fq-gallery-error" role="alert">
          {error}

          <button
            className="fq-gallery-button secondary"
            disabled={loading || deleting}
            onClick={() => loadImages()}
          >
            Retry gallery
          </button>
        </div>
      )}

      {!loading && !images.length && !error && (
        <section className="fq-gallery-empty">
          <span>◎</span>
          <h2>Your collection starts here.</h2>

          <p>
            Complete Light Seeker and choose “Save photo &
            claim reward” to add your first photo.
          </p>

          <button
            className="fq-gallery-button"
            onClick={onBack}
          >
            Explore missions →
          </button>
        </section>
      )}

      <div className="fq-gallery-grid">
        {images.map((image) => (
          <article
            className="fq-photo-card"
            key={image.id}
          >
            <button
              className="fq-photo-preview"
              aria-label={`View ${missionName(image.mission)} photo`}
              onClick={() => {
                setSelected(image);
                setConfirmDelete(false);
                setError("");
              }}
            >
              <PrivatePhoto
                id={image.id}
                alt={`${missionName(image.mission)} capture`}
              />
            </button>

            <div className="fq-photo-caption">
              <strong>{missionName(image.mission)}</strong>

              <time dateTime={image.created_at}>
                {new Date(image.created_at).toLocaleDateString(
                  undefined,
                  { dateStyle: "medium" }
                )}
              </time>
            </div>
          </article>
        ))}
      </div>

      {loading && (
        <p role="status">Loading your photos…</p>
      )}

      {nextOffset !== null && (
        <button
          className="fq-gallery-button secondary"
          disabled={loading || deleting}
          onClick={() => loadImages(nextOffset)}
        >
          Load more photos
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="fq-photo-dialog"
        aria-labelledby="fq-photo-title"
        onClose={() => setSelected(null)}
        onCancel={(event) => {
          if (deleting) event.preventDefault();
        }}
      >
        {selected && (
          <>
            <button
              className="fq-gallery-button secondary fq-photo-close"
              disabled={deleting}
              onClick={() => setSelected(null)}
            >
              Close ×
            </button>

            <PrivatePhoto
              key={selected.id}
              id={selected.id}
              alt={`${missionName(selected.mission)} capture`}
            />

            <h2 id="fq-photo-title">
              {missionName(selected.mission)}
            </h2>

            <p>
              {new Date(selected.created_at).toLocaleString()}
            </p>

            {error && (
              <p className="fq-gallery-error" role="alert">
                {error}
              </p>
            )}

            {confirmDelete ? (
              <div className="fq-photo-delete-confirm">
                <p>
                  Permanently delete this photo from your account?
                </p>

                <button
                  className="fq-gallery-button danger"
                  disabled={deleting}
                  onClick={deletePhoto}
                >
                  {deleting
                    ? "Deleting…"
                    : "Delete permanently"}
                </button>

                <button
                  className="fq-gallery-button secondary"
                  disabled={deleting}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep photo
                </button>
              </div>
            ) : (
              <button
                className="fq-gallery-button secondary"
                onClick={() => setConfirmDelete(true)}
              >
                Delete photo
              </button>
            )}
          </>
        )}
      </dialog>
    </main>
  );
}