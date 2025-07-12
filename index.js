const express = require("express");
const cors    = require("cors");

const app       = express();
const PORT      = process.env.PORT || 8080;
const TIMEOUT  = 15_000; // 15s

app.use(cors());
app.use(express.json());

// Store active users per server:
//   active[jobId] = { [userId]: { username, lastTime } }
const active = {};

// Simple in-memory chat log
let messages = [];

// --- Chat endpoints ---
app.get("/messages", (req, res) => {
  res.json(messages);
});
app.post("/messages", (req, res) => {
  const { user, text } = req.body;
  if (typeof user !== "string" || typeof text !== "string")
    return res.status(400).json({ error: "Invalid user or text" });

  messages.push({ user, text, time: Date.now() });
  if (messages.length > 200) messages.shift();
  res.json({ success: true });
});

// --- Beacon POST ---
app.post("/beacon", (req, res) => {
  const { userId, username, jobId } = req.body;
  if (!userId || !username || !jobId)
    return res.status(400).json({ error: "Missing userId, username or jobId" });

  if (!active[jobId]) active[jobId] = {};
  active[jobId][userId] = {
    username,
    lastTime: Date.now()
  };
  res.json({ success: true });
});

// --- GET per-server list ---
app.get("/beacon", (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).json({ error: "Missing jobId" });

  const now = Date.now();
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

// --- GET global list ---
app.get("/beacon/all", (req, res) => {
  const now = Date.now();
  const allUsers = [];

  for (const [jobId, bucket] of Object.entries(active)) {
    for (const [uid, info] of Object.entries(bucket)) {
      if (now - info.lastTime <= TIMEOUT) {
        allUsers.push({
          userId:   uid,
          username: info.username,
          jobId
        });
      }
    }
  }

  res.json({
    count: allUsers.length,
    users: allUsers
  });
});

app.listen(PORT, () => {
  console.log(`Beacon & Chat server listening on port ${PORT}`);
});
