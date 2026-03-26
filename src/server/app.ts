import express from "express";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        games_played INT DEFAULT 0,
        games_won INT DEFAULT 0,
        total_score INT DEFAULT 0,
        best_score INT
      );
    `);
    await client.query(`
      ALTER TABLE players
        ADD COLUMN IF NOT EXISTS games_played INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS games_won INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_score INT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS best_score INT;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        players JSONB NOT NULL,
        rounds JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_complete BOOLEAN DEFAULT FALSE
      );
    `);
    client.release();
    dbInitialized = true;
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
}

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(async (req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  await initDb();
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});

// -- Players ------------------------------------------------------------------

app.get("/api/players", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json([]);
  try {
    const result = await pool.query("SELECT * FROM players ORDER BY created_at DESC");
    res.json(result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      stats: {
        gamesPlayed: row.games_played ?? 0,
        gamesWon: row.games_won ?? 0,
        totalScore: row.total_score ?? 0,
        bestScore: row.best_score ?? null,
      },
    })));
  } catch (err) {
    console.error("Error fetching players:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

app.post("/api/players", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.json({ success: true, warning: "Database not configured." });
  }
  const { id, name, avatarUrl } = req.body;
  try {
    await pool.query(
      `INSERT INTO players (id, name, avatar_url)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = $2, avatar_url = $3`,
      [id, name, avatarUrl]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving player:", err);
    res.status(500).json({ error: "Failed to save player" });
  }
});

app.delete("/api/players/:id", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json({ success: true });
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM players WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting player:", err);
    res.status(500).json({ error: "Failed to delete player" });
  }
});

// -- Game results / stats -----------------------------------------------------

app.post("/api/game-results", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json({ success: true });
  const { results } = req.body as {
    results: Array<{ playerId: string; score: number; isWinner: boolean }>;
  };
  try {
    for (const { playerId, score, isWinner } of results) {
      await pool.query(
        `UPDATE players SET
           games_played = games_played + 1,
           games_won    = games_won + $2,
           total_score  = total_score + $3,
           best_score   = CASE
             WHEN best_score IS NULL THEN $3
             WHEN $3 < best_score   THEN $3
             ELSE best_score
           END
         WHERE id = $1`,
        [playerId, isWinner ? 1 : 0, score]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving game results:", err);
    res.status(500).json({ error: "Failed to save game results" });
  }
});

// -- Game sessions (in-progress game persistence) -----------------------------

app.get("/api/sessions/active", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json(null);
  try {
    const result = await pool.query(
      `SELECT * FROM game_sessions WHERE is_complete = FALSE ORDER BY updated_at DESC LIMIT 1`
    );
    if (result.rows.length === 0) return res.json(null);
    const row = result.rows[0];
    res.json({ id: row.id, players: row.players, rounds: row.rounds });
  } catch (err) {
    console.error("Error fetching active session:", err);
    res.status(500).json({ error: "Failed to fetch active session" });
  }
});

app.post("/api/sessions", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json({ id: null });
  const { players, rounds } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO game_sessions (players, rounds) VALUES ($1, $2) RETURNING id`,
      [JSON.stringify(players), JSON.stringify(rounds)]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.put("/api/sessions/:id", async (req, res) => {
  if (!process.env.DATABASE_URL) return res.json({ success: true });
  const { rounds, isComplete } = req.body;
  try {
    await pool.query(
      `UPDATE game_sessions SET rounds = $1, is_complete = $2, updated_at = NOW() WHERE id = $3`,
      [JSON.stringify(rounds), isComplete ?? false, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(500).json({ error: "Failed to update session" });
  }
});

app.get("/api/db-status", (req, res) => {
  res.json({ configured: !!process.env.DATABASE_URL });
});

export default app;
