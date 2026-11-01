import express from "express";
import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();
const DEFAULT_AVATAR = {
  skinColor: "#C98F69",
  hairColor: "#30251F",
  outfitColor: "#795548",
  hairstyle: "swept",
  faceShape: "oval",
  accessories: "none",
  eyeColor: "#5C4334",
  eyeShape: "almond",
  eyebrows: "soft",
  expression: "smile",
  facialHair: "none",
  outfitStyle: "hoodie",
  backgroundColor: "#F1E4CE",
  accessoryColor: "#C7A76C",
  backdrop: "halo",
  pose: "relaxed",
};
const OPTIONS = {
  hairstyle: [
    "swept",
    "curly",
    "spiky",
    "undercut",
    "long",
    "bob",
    "bun",
    "braids",
    "bald",
  ],
  faceShape: ["oval", "round", "square", "heart"],
  accessories: [
    "none",
    "glasses",
    "sunglasses",
    "headphones",
    "chain",
    "earrings",
  ],
  eyeShape: ["almond", "round", "cat"],
  eyebrows: ["soft", "bold", "arched"],
  expression: ["smile", "grin", "calm", "wink"],
  facialHair: ["none", "stubble", "beard", "moustache"],
  outfitStyle: ["hoodie", "tee", "varsity", "knit", "jacket"],
  backdrop: ["halo", "sparkle", "grid"],
  pose: ["relaxed", "wave", "peace"],
};
function normalize(config) {
  const result = { ...DEFAULT_AVATAR };
  for (const key of Object.keys(result)) {
    const value = config?.[key];
    if (key.endsWith("Color")) {
      if (typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value))
        result[key] = value;
    } else if (OPTIONS[key]?.includes(value)) result[key] = value;
  }
  return result;
}
function validConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config))
    return false;
  return Object.keys(config).every((key) => {
    if (!Object.hasOwn(DEFAULT_AVATAR, key)) return false;
    return key.endsWith("Color")
      ? typeof config[key] === "string" && /^#[0-9a-f]{6}$/i.test(config[key])
      : OPTIONS[key]?.includes(config[key]);
  });
}
function authenticate(req, res, next) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  try {
    if (!token) throw new Error("Missing token");
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const id = payload.sub ?? payload.id ?? payload.userId;
    if (!/^\d+$/.test(String(id))) throw new Error("Invalid user ID");
    req.userId = String(id);
    next();
  } catch {
    res.status(401).json({
      message: "Your session expired or is invalid. Please log in again.",
    });
  }
}

// Prices are authoritative here; clients cannot submit their own price or XP award.
const PRICES = {
  "hairstyle:curly": 150,
  "hairstyle:spiky": 200,
  "hairstyle:bun": 150,
  "hairstyle:braids": 250,
  "outfitStyle:varsity": 250,
  "outfitStyle:knit": 200,
  "outfitStyle:jacket": 175,
  "accessories:sunglasses": 180,
  "accessories:headphones": 250,
  "accessories:chain": 150,
  "accessories:earrings": 100,
  "backdrop:sparkle": 120,
  "backdrop:grid": 100,
  "pose:peace": 100,
};
const CATEGORIES = [
  "hairstyle",
  "outfitStyle",
  "accessories",
  "backdrop",
  "pose",
];
const NAMES = {
  hairstyle: "Hair",
  outfitStyle: "Outfit",
  accessories: "Accessory",
  backdrop: "Backdrop",
  pose: "Pose",
};
const CATALOG = CATEGORIES.flatMap((category) =>
  OPTIONS[category].map((value) => ({
    id: `${category}:${value}`,
    category,
    value,
    name: `${value.charAt(0).toUpperCase() + value.slice(1)} ${NAMES[category]}`,
    cost: PRICES[`${category}:${value}`] || 0,
  })),
);
const MISSIONS = [
  { id: 1, title: "The Crystal Puzzle", xp: 300, reward: "Crystal Key" },
  { id: 2, title: "Explore the Frontier", xp: 150, reward: "Neon Badge" },
  { id: 3, title: "Restore the Portal", xp: 200, reward: "Portal Shard" },
  { id: 4, title: "Light Seeker", xp: 200, reward: "Radiant Crystal" },
  { id: 5, title: "The Face Explorer", xp: 300, reward: "Explorer Badge" },
  { id: 6, title: "Focus Bridge", xp: 200, reward: "Focus Crystal" },
  { id: 7, title: "Dragon's Eye", xp: 250, reward: "Dragon Crystal" },
  { id: 8, title: "Mirror Maze", xp: 250, reward: "Mirror Shard" },
  { id: 9, title: "Starship Navigator", xp: 250, reward: "Starship Badge" },
  {
    id: 10,
    title: "The Lost Portraits",
    xp: 250,
    reward: "Royal Portrait Badge",
  },
  { id: 11, title: "Rhythm of the Realm", xp: 250, reward: "Rhythm Crown" },
];
class RequestError extends Error {
  constructor(status, message, data = {}) {
    super(message);
    this.status = status;
    this.data = data;
  }
}
function respondError(res, error) {
  if (error instanceof RequestError)
    return res
      .status(error.status)
      .json({ message: error.message, ...error.data });
  console.error("Avatar economy error:", error.message);
  return res
    .status(500)
    .json({ message: "The avatar shop is unavailable. Please try again." });
}
function wallet(user) {
  const totalXP = Number(user.xp),
    spentXP = Number(user.xp_spent);
  return {
    totalXP,
    spentXP,
    availableXP: Math.max(0, totalXP - spentXP),
    level: Math.floor(totalXP / 300) + 1,
  };
}
async function readShop(client, userId) {
  const account = await client.query(
    "SELECT xp,xp_spent FROM users WHERE id=$1",
    [userId],
  );
  if (!account.rowCount)
    throw new RequestError(401, "Account not found. Please log in again.");
  const owned = await client.query(
    "SELECT item_id FROM avatar_items WHERE user_id=$1 ORDER BY item_id",
    [userId],
  );
  const avatar = await client.query(
    "SELECT config FROM avatars WHERE user_id=$1",
    [userId],
  );
  return {
    avatar: avatar.rows[0] ? normalize(avatar.rows[0].config) : null,
    wallet: wallet(account.rows[0]),
    ownedItemIds: owned.rows.map((row) => row.item_id),
    catalog: CATALOG,
  };
}
async function readProgress(client, userId) {
  const account = await client.query(
    "SELECT xp,xp_spent FROM users WHERE id=$1",
    [userId],
  );
  if (!account.rowCount)
    throw new RequestError(401, "Account not found. Please log in again.");
  const day = (
    await client.query("SELECT (NOW() AT TIME ZONE 'UTC')::date::text AS day")
  ).rows[0].day;
  const today = await client.query(
    "SELECT mission_id FROM mission_xp_claims WHERE user_id=$1 AND reward_day=$2::date ORDER BY mission_id",
    [userId, day],
  );
  const earned = await client.query(
    "SELECT DISTINCT mission_id FROM mission_xp_claims WHERE user_id=$1 ORDER BY mission_id",
    [userId],
  );
  return {
    wallet: wallet(account.rows[0]),
    day,
    completedMissionIds: today.rows.map((row) => Number(row.mission_id)),
    rewards: earned.rows
      .map(
        (row) =>
          MISSIONS.find((mission) => mission.id === Number(row.mission_id))
            ?.reward,
      )
      .filter(Boolean),
  };
}
async function withUserLock(userId, action) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const user = await client.query(
      "SELECT id,xp,xp_spent FROM users WHERE id=$1 FOR UPDATE",
      [userId],
    );
    if (!user.rowCount)
      throw new RequestError(401, "Account not found. Please log in again.");
    const result = await action(client, user.rows[0]);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
router.use(authenticate);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/", async (req, res) => {
  try {
    res.json(await readShop(pool, req.userId));
  } catch (error) {
    respondError(res, error);
  }
});
router.get("/progress", async (req, res) => {
  try {
    res.json(await readProgress(pool, req.userId));
  } catch (error) {
    respondError(res, error);
  }
});
router.put("/", async (req, res) => {
  if (!validConfig(req.body?.config))
    return res
      .status(400)
      .json({
        message:
          "Invalid avatar settings. Check your colours and style choices.",
      });
  const config = normalize(req.body.config);
  try {
    const data = await withUserLock(req.userId, async (client) => {
      const ownership = await client.query(
        "SELECT item_id FROM avatar_items WHERE user_id=$1",
        [req.userId],
      );
      const owned = new Set(ownership.rows.map((row) => row.item_id));
      const locked = CATALOG.filter(
        (item) =>
          item.cost > 0 &&
          config[item.category] === item.value &&
          !owned.has(item.id),
      );
      if (locked.length)
        throw new RequestError(
          403,
          `Unlock ${locked.map((item) => item.name).join(", ")} before equipping.`,
          { lockedItemIds: locked.map((item) => item.id) },
        );
      await client.query(
        `INSERT INTO avatars(user_id,config) VALUES($1,$2::jsonb)
        ON CONFLICT(user_id) DO UPDATE SET config=EXCLUDED.config,updated_at=NOW()`,
        [req.userId, JSON.stringify(config)],
      );
      return readShop(client, req.userId);
    });
    res.json({ message: "Your look is saved.", ...data });
  } catch (error) {
    respondError(res, error);
  }
});
router.post("/purchase", async (req, res) => {
  const item = CATALOG.find((entry) => entry.id === req.body?.itemId);
  if (!item)
    return res
      .status(400)
      .json({ message: "That avatar item does not exist." });
  try {
    const data = await withUserLock(req.userId, async (client, user) => {
      const existing = await client.query(
        "SELECT item_id FROM avatar_items WHERE user_id=$1 AND item_id=$2",
        [req.userId, item.id],
      );
      if (item.cost === 0 || existing.rowCount)
        return { alreadyOwned: true, ...(await readShop(client, req.userId)) };
      if (req.body.expectedCost !== item.cost)
        throw new RequestError(
          409,
          "The item price changed. Refresh the shop before purchasing.",
          await readShop(client, req.userId),
        );
      if (Number(user.xp) - Number(user.xp_spent) < item.cost)
        throw new RequestError(
          409,
          "You need more available XP for this item.",
          await readShop(client, req.userId),
        );
      await client.query(
        "INSERT INTO avatar_items(user_id,item_id,xp_cost) VALUES($1,$2,$3)",
        [req.userId, item.id, item.cost],
      );
      await client.query("UPDATE users SET xp_spent=xp_spent+$1 WHERE id=$2", [
        item.cost,
        req.userId,
      ]);
      return { alreadyOwned: false, ...(await readShop(client, req.userId)) };
    });
    res.json({
      message: data.alreadyOwned
        ? "You already own this item."
        : "Unlocked! Save your look to equip it.",
      itemId: item.id,
      ...data,
    });
  } catch (error) {
    respondError(res, error);
  }
});
// Gameplay runs in the browser. The server fixes the award and limits each mission
// to one XP claim per UTC day; this is not proof that the game was played.
router.post("/mission-reward", async (req, res) => {
  const id = req.body?.missionId;
  const mission = Number.isInteger(id)
    ? MISSIONS.find((entry) => entry.id === id)
    : null;
  if (!mission) return res.status(400).json({ message: "Invalid mission." });
  try {
    const data = await withUserLock(req.userId, async (client) => {
      const claim = await client.query(
        `INSERT INTO mission_xp_claims(user_id,mission_id,xp_awarded)
        VALUES($1,$2,$3) ON CONFLICT(user_id,mission_id,reward_day) DO NOTHING RETURNING mission_id`,
        [req.userId, id, mission.xp],
      );
      if (claim.rowCount)
        await client.query(
          `UPDATE users SET xp=xp+$1,
        level=FLOOR((xp+$1)/300.0)::integer+1 WHERE id=$2`,
          [mission.xp, req.userId],
        );
      return {
        awardedXP: claim.rowCount ? mission.xp : 0,
        alreadyClaimed: !claim.rowCount,
        mission,
        ...(await readProgress(client, req.userId)),
      };
    });
    res.json(data);
  } catch (error) {
    respondError(res, error);
  }
});
// Demo offers only. Replace with verified merchant offers before real redemption.
const COUPONS = [
  { id: "coffee-50", category: "Cafe", title: "A coffee break, on your quest.",
    offer: "₹50 OFF", cost: 300,
    description: "Sample café offer on a ₹200 order. For project demonstration only." },
  { id: "learn-15", category: "Learning", title: "Invest in your next chapter.",
    offer: "15% OFF", cost: 450,
    description: "Sample learning offer, up to ₹150 on a ₹500 course. Demo only." },
  { id: "cinema-100", category: "Lifestyle", title: "Make room for movie night.",
    offer: "₹100 OFF", cost: 650,
    description: "Sample cinema offer on a ₹400 booking. No real merchant acceptance." },
  { id: "weekend-20", category: "Lifestyle", title: "A little weekend treat.",
    offer: "20% OFF", cost: 800,
    description: "Sample lifestyle offer, up to ₹200 on a ₹700 order. Demo only." },
];

async function readCoupons(client, userId) {
  const account = await client.query("SELECT xp, xp_spent FROM users WHERE id=$1", [userId]);
  if (!account.rowCount) throw new RequestError(401, "Account not found. Please log in again.");
  const redeemed = await client.query(
    `SELECT id, coupon_id, code, xp_cost, redeemed_at, expires_at
     FROM coupon_redemptions WHERE user_id=$1 ORDER BY redeemed_at DESC, id DESC`, [userId]);
  return { coupons: COUPONS, redemptions: redeemed.rows, wallet: wallet(account.rows[0]) };
}

router.get("/coupons", async (req, res) => {
  try {
    const data = await withUserLock(req.userId, (client) => readCoupons(client, req.userId));
    return res.json(data);
  } catch (error) {
    return respondError(res, error);
  }
});

// One coupon per account. The same account lock protects both stores.
router.post("/coupons/redeem", async (req, res) => {
  const coupon = COUPONS.find((entry) => entry.id === req.body?.couponId);
  if (!coupon) return res.status(400).json({ message: "That coupon does not exist." });
  try {
    const data = await withUserLock(req.userId, async (client, user) => {
      const existing = await client.query(
        "SELECT id FROM coupon_redemptions WHERE user_id=$1 AND coupon_id=$2", [req.userId, coupon.id]);
      if (existing.rowCount) return { alreadyRedeemed: true, ...(await readCoupons(client, req.userId)) };
      if (req.body.expectedCost !== coupon.cost)
        throw new RequestError(409, "The coupon price changed. Refresh the store.");
      if (Number(user.xp) - Number(user.xp_spent) < coupon.cost)
        throw new RequestError(409, "You need more available XP for this coupon.");
      const code = `FQ-DEMO-${randomBytes(8).toString("hex").toUpperCase()}`;
      await client.query(
        "INSERT INTO coupon_redemptions(user_id,coupon_id,code,xp_cost) VALUES($1,$2,$3,$4)",
        [req.userId, coupon.id, code, coupon.cost]);
      await client.query("UPDATE users SET xp_spent=xp_spent+$1 WHERE id=$2", [coupon.cost, req.userId]);
      return { alreadyRedeemed: false, ...(await readCoupons(client, req.userId)) };
    });
    return res.json(data);
  } catch (error) {
    return respondError(res, error);
  }
});

export default router;