import { Router } from "express";
import jwt from "jsonwebtoken";
import sharp from "sharp";
import { randomUUID, createHash } from "node:crypto";
import pool from "../db.js";

const router = Router();
const MAX_BYTES = 3 * 1024 * 1024;

// Every image route requires a logged-in user.
router.use((req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];

  try {
    if (!token) throw new Error("Missing token");

    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (!/^\d+$/.test(String(payload.sub))) {
      throw new Error("Invalid user");
    }

    req.userId = String(payload.sub);
    next();
  } catch (error) {
    console.error(
        "Image authentication failed:",
        error.name,
        error.message
    );

    return res.status(401).json({
        message:
        error.name === "TokenExpiredError"
            ? "Your session expired. Please log in again."
            : "Your login token is invalid. Please log in again.",
    });
  }
});

// Save one photo.
router.post("/", async (req, res) => {
  const { image, mission, consent } = req.body ?? {};

  if (consent !== true) {
    return res.status(400).json({
      message: "Please agree to save this photo to your account.",
    });
  }

  if (
    typeof mission !== "string" ||
    !/^[a-z0-9-]{1,60}$/.test(mission)
  ) {
    return res.status(400).json({
      message: "Invalid mission.",
    });
  }

  if (
    typeof image !== "string" ||
    image.length > Math.ceil((MAX_BYTES * 4) / 3) + 100
  ) {
    return res.status(400).json({
      message: "Photo must be smaller than 3 MB.",
    });
  }

  const match =
    /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      image
    );

  if (!match || match[2].length % 4 !== 0) {
    return res.status(400).json({
      message: "Use a valid JPEG, PNG, or WebP photo.",
    });
  }

  const input = Buffer.from(match[2], "base64");

  if (!input.length || input.length > MAX_BYTES) {
    return res.status(400).json({
      message: "Photo must be smaller than 3 MB.",
    });
  }

  let processed;

  try {
    const source = sharp(input, {
      limitInputPixels: 20_000_000,
    });

    const metadata = await source.metadata();

    if (
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages ?? 1) > 1
    ) {
      throw new Error("Unsupported image");
    }

    processed = await source
      .rotate()
      .resize(960, 960, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return res.status(400).json({
      message: "Could not process this photo. Please retake it.",
    });
  }

  try {
    const hash = createHash("sha256").update(input).digest("hex");

    const result = await pool.query(
      `INSERT INTO mission_images
         (id, user_id, mission, image_data, sha256)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, mission, sha256)
       DO UPDATE SET sha256 = EXCLUDED.sha256
       RETURNING id, mission, created_at`,
      [randomUUID(), req.userId, mission, processed, hash]
    );

    return res.json({
      message: "Photo saved to your account.",
      image: result.rows[0],
    });
  } catch (error) {
    console.error("Save photo failed:", error.message);

    return res.status(500).json({
      message: "Could not save your photo. Please try again.",
    });
  }
});

// Prevent private photo responses from being cached.
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Validate IDs before sending them to PostgreSQL.
router.param("imageId", (req, res, next, imageId) => {
  const valid =
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      imageId
    );

  if (!valid) {
    return res.status(400).json({
      message: "Invalid photo ID.",
    });
  }

  next();
});

// List the logged-in user's photos.
// Actual image bytes are loaded separately.
router.get("/", async (req, res) => {
  const offset = Number(req.query.offset ?? 0);

  if (
    !Number.isSafeInteger(offset) ||
    offset < 0 ||
    offset > 10000
  ) {
    return res.status(400).json({
      message: "Invalid gallery page.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, mission, created_at
       FROM mission_images
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 13 OFFSET $2`,
      [req.userId, offset]
    );

    return res.json({
      images: result.rows.slice(0, 12),
      nextOffset:
        result.rows.length > 12 ? offset + 12 : null,
    });
  } catch (error) {
    console.error("Load gallery failed:", error.message);

    return res.status(500).json({
      message: "Could not load your gallery.",
    });
  }
});

// Read a photo only if it belongs to the logged-in user.
router.get("/:imageId/content", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT image_data
       FROM mission_images
       WHERE id = $1 AND user_id = $2`,
      [req.params.imageId, req.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Photo not found.",
      });
    }

    res.set({
      "Content-Type": "image/jpeg",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition":
        'inline; filename="facequest-photo.jpg"',
    });

    return res.send(result.rows[0].image_data);
  } catch (error) {
    console.error("Load photo failed:", error.message);

    return res.status(500).json({
      message: "Could not load this photo.",
    });
  }
});

// Delete only the logged-in user's photo.
router.delete("/:imageId", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM mission_images
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.imageId, req.userId]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Photo not found.",
      });
    }

    return res.status(204).end();
  } catch (error) {
    console.error("Delete photo failed:", error.message);

    return res.status(500).json({
      message: "Could not delete this photo.",
    });
  }
});

export default router;