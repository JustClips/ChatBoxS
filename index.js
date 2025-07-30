const express = require("express");
const cors    = require("cors");

const app      = express();
const PORT     = process.env.PORT || 8080;
const TIMEOUT  = 15_000; // 15 seconds

app.use(cors());
app.use(express.json());

// In-memory stores:
let messages = [];      // chat log (up to 200 messages)
const active = {};      // { [jobId]: { [userId]: { username, lastTime } } }

// — Chat endpoints —

// GET last 200 messages
app.get("/messages", (req, res) => {
  res.json(messages);
});

// POST a new message
app.post("/messages", (req, res) => {
  const { user, text } = req.body;
  if (typeof user !== "string" || typeof text !== "string") {
    return res.status(400).json({ error: "Invalid user/text" });
  }
  messages.push({ user, text, time: Date.now() });
  if (messages.length > 200) messages.shift();
  res.json({ success: true });
});

// — Beacon POST —
// Record heartbeat for a user in a server (with username)
app.post("/beacon", (req, res) => {
  const { userId, username, jobId } = req.body;
  if (!userId || !username || !jobId) {
    return res.status(400).json({ error: "Must include userId, username, jobId" });
  }

  if (!active[jobId]) active[jobId] = {};
  active[jobId][userId] = {
    username,
    lastTime: Date.now()
  };

  res.json({ success: true });
});

// — Per-server GET —
// Returns { count, users: [ { userId, username, jobId }… ] }
app.get("/beacon", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).json({ error: "Missing jobId" });

  const now    = Date.now();
  const bucket = active[jobId] || {};

  // expire stale
  for (const [uid, info] of Object.entries(bucket)) {
    if (now - info.lastTime > TIMEOUT) {
      delete bucket[uid];
    }
  }

  const users = Object.entries(bucket).map(([uid, info]) => ({
    userId:   uid,
    username: info.username,
    jobId
  }));

  res.json({
    count: users.length,
    users
  });
});

// — Global GET —
// Returns { count, users: [ { userId, username, jobId }… ] }
app.get("/beacon/all", (req, res) => {
  const now = Date.now();
  const all = [];

  for (const [jobId, bucket] of Object.entries(active)) {
    for (const [uid, info] of Object.entries(bucket)) {
      if (now - info.lastTime <= TIMEOUT) {
        all.push({
          userId:   uid,
          username: info.username,
          jobId
        });
      }
    }
  }

  res.json({
    count: all.length,
    users: all
  });
});

// Health check endpoint
app.get('/', (req, res) => res.send('Chat & Beacon backend running.'));

app.listen(PORT, () => {
  console.log(`Chat & Beacon server listening on port ${PORT}`);
});
