
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";
import { testDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import avatarRouter from "./routes/avatar.js";

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

app.use(cors({ origin: [
  "http://localhost:5173",
  "https://facequest.vercel.app",
 ]
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/avatar", avatarRouter);

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      message: "FaceQuest API is running!",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error.message);
    res.status(503).json({
      success: false,
      database: "disconnected",
    });
  }
});

async function startServer() {
  try {
    const db = await testDatabase();
    console.log("Neon PostgreSQL connected:", db.database);

    app.listen(PORT, () => {
      console.log(`FaceQuest server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
