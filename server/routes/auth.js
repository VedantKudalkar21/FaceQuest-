
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { pool } from "../db.js";

const router = Router();

const WEEKLY_DAILY_REWARDS = [50, 75, 100, 125, 150, 200, 300];
const REFERRAL_XP = 200;

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    xp: user.xp,
    level: user.level,
    referralCode: user.referral_code,
    loginStreak: user.login_streak ?? 0,
  };
}

function calculateLevel(xp) {
  return Math.floor(Number(xp) / 300) + 1;
}

async function generateReferralCode(client) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomBytes(5).toString("hex").toUpperCase();

    const result = await client.query(
      `SELECT 1 FROM users WHERE referral_code = $1`,
      [code]
    );

    if (result.rowCount === 0) return code;
  }

  throw new Error("Could not generate a unique referral code.");
}

router.post("/register", async (req, res) => {
  const client = await pool.connect();

  try {
    const username = String(req.body.username ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");
    const referralCode = String(req.body.referralCode ?? "")
      .trim()
      .toUpperCase();

    if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
      return res.status(400).json({
        message: "Username must be 3–50 letters, numbers, or underscores.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
      return res.status(400).json({
        message: "Enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must be 8–72 characters.",
      });
    }

    await client.query("BEGIN");

    let inviter = null;

    if (referralCode) {
      const inviterResult = await client.query(
        `SELECT id FROM users WHERE referral_code = $1`,
        [referralCode]
      );

      inviter = inviterResult.rows[0];

      if (!inviter) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "That referral code is invalid.",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const ownReferralCode = await generateReferralCode(client);

    const result = await client.query(
      `INSERT INTO users
        (username, email, password_hash, xp, level, referral_code, referred_by)
       VALUES ($1, $2, $3, 0, 1, $4, $5)
       RETURNING id, username, email, xp, level,
                 referral_code, login_streak`,
      [
        username,
        email,
        passwordHash,
        ownReferralCode,
        inviter?.id ?? null,
      ]
    );

    let user = result.rows[0];

    if (inviter) {
      await client.query(
        `INSERT INTO referral_rewards (inviter_id, invitee_id)
         VALUES ($1, $2)`,
        [inviter.id, user.id]
      );

      await client.query(
        `UPDATE users
         SET xp = xp + $1,
             level = FLOOR((xp + $1) / 300.0)::integer + 1
         WHERE id = $2`,
        [REFERRAL_XP, inviter.id]
      );

      const updatedUser = await client.query(
        `UPDATE users
         SET xp = xp + $1,
             level = FLOOR((xp + $1) / 300.0)::integer + 1
         WHERE id = $2
         RETURNING id, username, email, xp, level,
                   referral_code, login_streak`,
        [REFERRAL_XP, user.id]
      );

      user = updatedUser.rows[0];
    }

    await client.query("COMMIT");

    return res.status(201).json({
      user: publicUser(user),
      token: createToken(user),
      rewards: {
        referralXP: inviter ? REFERRAL_XP : 0,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    if (error.code === "23505") {
      return res.status(409).json({
        message: "That username or email is already registered.",
      });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({
      message: "Registration failed.",
    });
  } finally {
    client.release();
  }
});



router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    const result = await pool.query(
      `SELECT id, username, email, password_hash, xp, level,
              referral_code, login_streak
       FROM users
       WHERE email = $1`,
      [email]
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    return res.json({
      user: publicUser(user),
      token: createToken(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Login failed.",
    });
  }
});



router.get("/daily-reward/status", async (req, res) => {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT login_streak,
              last_login_reward_date::text AS last_date,
              CURRENT_DATE::text AS today,
              (CURRENT_DATE - 1)::text AS yesterday
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    const rewards = [50, 75, 100, 125, 150, 200, 300];
    const streak = Number(user.login_streak || 0);
    const claimedToday = user.last_date === user.today;

    let day;

    if (claimedToday) {
      day = streak || 1;
    } else if (user.last_date === user.yesterday) {
      day = (streak % 7) + 1;
    } else {
      day = 1;
    }

    return res.json({
      canClaim: !claimedToday,
      day,
      dailyXP: rewards[day - 1],
      loginStreak: streak,
      claimedToday,
    });
  } catch (error) {
    console.error("Daily reward status failed:", error.message);
    return res.status(401).json({
      message: "Invalid or expired session.",
    });
  }
});

router.post("/daily-reward/claim", async (req, res) => {
  const client = await pool.connect();

  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, username, email, xp, level,
              referral_code, login_streak,
              last_login_reward_date::text AS last_date,
              CURRENT_DATE::text AS today,
              (CURRENT_DATE - 1)::text AS yesterday
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [payload.sub]
    );

    const user = result.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Account not found." });
    }

    if (user.last_date === user.today) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Today's reward has already been claimed.",
      });
    }

    const rewards = [50, 75, 100, 125, 150, 200, 300];
    const previousStreak = Number(user.login_streak || 0);

    const day =
      user.last_date === user.yesterday
        ? (previousStreak % 7) + 1
        : 1;

    const earnedXP = rewards[day - 1];

    const updated = await client.query(
      `UPDATE users
       SET xp = xp + $1,
           level = FLOOR((xp + $1) / 300.0)::integer + 1,
           login_streak = $2,
           last_login_reward_date = CURRENT_DATE
       WHERE id = $3
       RETURNING id, username, email, xp, level,
                 referral_code, login_streak`,
      [earnedXP, day, user.id]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      day,
      dailyXP: earnedXP,
      totalXP: earnedXP,
      user: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Daily reward claim failed:", error.message);

    return res.status(500).json({
      message: "Unable to claim daily reward.",
    });
  } finally {
    client.release();
  }
});



router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ")
      ? header.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `SELECT id, username, email, xp, level,
              referral_code, login_streak
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    if (!result.rows[0]) {
      return res.status(401).json({
        message: "Account not found.",
      });
    }

    return res.json({ user: publicUser(result.rows[0]) });
  } catch {
    return res.status(401).json({
      message: "Invalid or expired session.",
    });
  }
});

export default router;
