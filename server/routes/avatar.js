
import express from "express";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

const DEFAULT_AVATAR = {
  skinColor: "#C98F69",
  hairColor: "#30251F",
  outfitColor: "#7657F6",
  hairstyle: "swept",
  faceShape: "oval",
  accessories: "none",
};

const VALID_HAIRSTYLES = ["swept", "curly", "spiky", "undercut"];
const VALID_FACE_SHAPES = ["oval", "round", "square"];
const VALID_ACCESSORIES = ["none", "glasses", "chain"];

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: "Please log in to access your avatar.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id ?? decoded.userId ?? decoded.sub;

    if (!userId || !/^\d+$/.test(String(userId))) {
      return res.status(401).json({
        message: "Your login token does not contain a valid user ID.",
      });
    }

    req.userId = String(userId);
    next();
  } catch {
    return res.status(401).json({
      message: "Your session is invalid or expired. Please log in again.",
    });
  }
}

function isValidAvatar(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return false;
  }

  const allowedKeys = Object.keys(DEFAULT_AVATAR);

  // Reject unknown fields rather than silently saving unexpected data.
  if (!Object.keys(config).every((key) => allowedKeys.includes(key))) {
    return false;
  }

  // Accept older saved avatars that have only the three color fields.
  const avatar = { ...DEFAULT_AVATAR, ...config };

  const isHexColor = (value) =>
    typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);

  return (
    isHexColor(avatar.skinColor) &&
    isHexColor(avatar.hairColor) &&
    isHexColor(avatar.outfitColor) &&
    VALID_HAIRSTYLES.includes(avatar.hairstyle) &&
    VALID_FACE_SHAPES.includes(avatar.faceShape) &&
    VALID_ACCESSORIES.includes(avatar.accessories)
  );
}

// Get the logged-in player's avatar.
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT config FROM avatars WHERE user_id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ avatar: null });
    }

    // Fill defaults for avatars saved before the new options existed.
    const avatar = {
      ...DEFAULT_AVATAR,
      ...result.rows[0].config,
    };

    return res.json({ avatar });
  } catch (error) {
    console.error("Get avatar failed:", error.message);

    return res.status(500).json({
      message: "Could not load your avatar.",
    });
  }
});

// Create or update the logged-in player's avatar.
router.put("/", authenticateToken, async (req, res) => {
  const config = req.body?.config;

  if (!isValidAvatar(config)) {
    return res.status(400).json({
      message:
        "Invalid avatar settings. Check your colors, hairstyle, face shape, and accessories.",
    });
  }

  const avatarToSave = {
    ...DEFAULT_AVATAR,
    ...config,
  };

  try {
    const result = await pool.query(
      `INSERT INTO avatars (user_id, config)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (user_id)
       DO UPDATE SET
         config = EXCLUDED.config,
         updated_at = NOW()
       RETURNING config`,
      [req.userId, JSON.stringify(avatarToSave)]
    );

    return res.json({
      message: "Avatar saved successfully.",
      avatar: result.rows[0].config,
    });
  } catch (error) {
    console.error("Save avatar failed:", error.message);

    return res.status(500).json({
      message: "Could not save your avatar.",
    });
  }
});

export default router;
