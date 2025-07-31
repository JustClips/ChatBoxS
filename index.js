const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");

const app      = express();
const PORT     = process.env.PORT || 8080;
const TIMEOUT  = 15_000; // 15 seconds

app.use(cors());
app.use(express.json());

// In-memory stores:
let messages = [];      // chat log (up to 200 messages)
const active = {};      // { [jobId]: { [userId]: { username, placeId, lastTime } } }

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
  const { userId, username, jobId, placeId } = req.body;
  if (!userId || !username || !jobId || !placeId) {
    return res.status(400).json({ error: "Must include userId, username, jobId, placeId" });
  }

  if (!active[jobId]) active[jobId] = {};
  active[jobId][userId] = {
    username,
    placeId,
    lastTime: Date.now()
  };

  res.json({ success: true });
});

// — Per-server GET —
// Returns { count, users: [ { userId, username, jobId, placeId }… ] }
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
    jobId,
    placeId: info.placeId
  }));

  res.json({
    count: users.length,
    users
  });
});

// — Global GET —
// Returns { count, users: [ { userId, username, jobId, placeId }… ] }
app.get("/beacon/all", (req, res) => {
  const now = Date.now();
  const all = [];

  for (const [jobId, bucket] of Object.entries(active)) {
    const toDelete = [];
    for (const [uid, info] of Object.entries(bucket)) {
      if (now - info.lastTime > TIMEOUT) {
        toDelete.push(uid);
      } else {
        all.push({
          userId:   uid,
          username: info.username,
          jobId,
          placeId: info.placeId
        });
      }
    }
    for (const uid of toDelete) {
      delete bucket[uid];
    }
    if (Object.keys(bucket).length === 0) {
      delete active[jobId];
    }
  }

  res.json({
    count: all.length,
    users: all
  });
});

// — Proxy for Roblox APIs to bypass in-game restrictions —

// GET universeId from placeId
app.get("/proxy/universe", (req, res) => {
  const placeId = req.query.placeId;
  if (!placeId) return res.status(400).json({ error: "Missing placeId" });

  const url = `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`;
  fetch(url, { headers: { Accept: "application/json" } })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
});

// GET game details from universeId
app.get("/proxy/game", (req, res) => {
  const universeId = req.query.universeId;
  if (!universeId) return res.status(400).json({ error: "Missing universeId" });

  const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
  fetch(url, { headers: { Accept: "application/json" } })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Health check endpoint
app.get('/', (req, res) => res.send('Chat & Beacon backend running.'));

app.listen(PORT, () => {
  console.log(`Chat & Beacon server listening on port ${PORT}`);
});
