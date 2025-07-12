// index.js
const express = require("express");
const cors    = require("cors");

const app      = express();
const PORT     = process.env.PORT || 8080;
const TIMEOUT  = 15_000; // 15 seconds before a heartbeat expires

app.use(cors());
app.use(express.json());

// In-memory stores
let messages = [];           // { user, text, time }
const active = {};           // { [jobId]: { [userId]: { username, lastTime } } }

// — Chat endpoints —

// GET all chat
app.get("/messages", (req, res) => {
  res.json(messages);
});

// POST a chat message
app.post("/messages", (req, res) => {
  const { user, text } = req.body;
  if (typeof user !== "string" || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  messages.push({ user, text, time: Date.now() });
  if (messages.length > 200) messages.shift();
  res.json({ success: true });
});

// — Beacon POST —
// Records a heartbeat with username
app.post("/beacon", (req, res) => {
  const { userId, username, jobId } = req.body;
  if (!userId || !username || !jobId) {
    return res.status(400).json({ error: "Missing userId, username or jobId" });
  }

  if (!active[jobId]) active[jobId] = {};
  active[jobId][userId] = { username, lastTime: Date.now() };

  res.json({ success: true });
});

// — Per-server GET —
// Returns count + list of active users for this jobId
app.get("/beacon", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).json({ error: "Missing jobId" });

  const now    = Date.now();
  const bucket = active[jobId] || {};

  // expire old
  for (const [uid, info] of Object.entries(bucket)) {
    if (now - info.lastTime > TIMEOUT) {
      delete bucket[uid];
    }
  }

  const users = Object.entries(bucket).map(([uid, info]) => ({
    userId:   uid,
    username: info.username,
    jobId,
  }));

  res.json({
    count: users.length,
    users,
  });
});

// — Global GET —
// Returns count + list of all active users across *all* jobIds
app.get("/beacon/all", (req, res) => {
  const now = Date.now();
  const all = [];

  for (const [jobId, bucket] of Object.entries(active)) {
    for (const [uid, info] of Object.entries(bucket)) {
      if (now - info.lastTime <= TIMEOUT) {
        all.push({
          userId:   uid,
          username: info.username,
          jobId,
        });
      }
    }
  }

  res.json({
    count: all.length,
    users: all,
  });
});

app.listen(PORT, () => {
  console.log(`Chat/Beacon server listening on port ${PORT}`);
});
