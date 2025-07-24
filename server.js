
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Database setup
const dbPath = path.resolve(__dirname, "data.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Failed to connect to SQLite DB:", err);
  } else {
    console.log("✅ Connected to SQLite DB");
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Homepage route
app.get("/", (req, res) => {
  res.send("🎮 Welcome to Rhys Coin Flip!");
});

// Health check
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Get player balance
app.get("/balance/:player", (req, res) => {
  const player = req.params.player;
  db.get("SELECT balance FROM balances WHERE player = ?", [player], (err, row) => {
    if (err) return res.status(500).json({ error: "DB error" });
    res.json({ player, balance: row ? row.balance : 0 });
  });
});

// Update balance after win
app.post("/win", (req, res) => {
  const { player, amount } = req.body;
  db.run("INSERT INTO results (player, result, amount) VALUES (?, 'win', ?)", [player, amount]);
  db.run("INSERT INTO balances (player, balance) VALUES (?, ?) ON CONFLICT(player) DO UPDATE SET balance = balance + ?",
    [player, amount, amount],
    (err) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ success: true });
    }
  );
});

// Cash out
app.post("/cashout", (req, res) => {
  const { player } = req.body;
  db.get("SELECT balance FROM balances WHERE player = ?", [player], (err, row) => {
    if (err || !row) return res.status(500).json({ error: "DB error" });
    const cashoutAmount = row.balance;
    db.run("INSERT INTO cashouts (player, amount) VALUES (?, ?)", [player, cashoutAmount]);
    db.run("UPDATE balances SET balance = 0 WHERE player = ?", [player]);
    res.json({ player, cashedOut: cashoutAmount });
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
