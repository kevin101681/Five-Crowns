import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not set. Skipping DB initialization.");
    return;
  }
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    client.release();
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

  await initDb();

  // API Routes
  app.get("/api/players", async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.json([]); // Return empty list if no DB configured
    }
    try {
      const result = await pool.query("SELECT * FROM players ORDER BY created_at DESC");
      res.json(result.rows.map(row => ({
        id: row.id,
        name: row.name,
        avatarUrl: row.avatar_url
      })));
    } catch (err) {
      console.error("Error fetching players:", err);
      res.status(500).json({ error: "Failed to fetch players" });
    }
  });

  app.post("/api/players", async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true, warning: "Database not configured. Player not persisted." });
    }
    const { id, name, avatarUrl } = req.body;
    try {
      await pool.query(
        "INSERT INTO players (id, name, avatar_url) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = $2, avatar_url = $3",
        [id, name, avatarUrl]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error saving player:", err);
      res.status(500).json({ error: "Failed to save player" });
    }
  });

  app.delete("/api/players/:id", async (req, res) => {
    if (!process.env.DATABASE_URL) {
      return res.json({ success: true });
    }
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM players WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting player:", err);
      res.status(500).json({ error: "Failed to delete player" });
    }
  });

  app.get("/api/db-status", (req, res) => {
    res.json({ configured: !!process.env.DATABASE_URL });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
