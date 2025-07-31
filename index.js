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
const placeToUniverse = {};
const placeNames = {};

// Common headers for Roblox API requests
const robloxHeaders = {
  Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
};

// Async function to get universeId
async function getUniverseId(placeId) {
  if (placeToUniverse[placeId]) return placeToUniverse[placeId];
  try {
    const url = `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`;
    const response = await fetch(url, { headers: robloxHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const uni = data[0]?.universeId;
    if (uni) placeToUniverse[placeId] = uni;
    return uni;
  } catch (e) {
    console.error(`Error fetching universeId for ${placeId}: ${e.message}`);
    return null;
  }
}

// Async function to get place name
async function getPlaceName(placeId) {
  if (placeNames[placeId]) return placeNames[placeId];
  try {
    const uni = await getUniverseId(placeId);
    if (!uni) throw new Error('No universeId');
    const url = `https://games.roblox.com/v1/games?universeIds=${uni}`;
    const response = await fetch(url, { headers: robloxHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const name = data.data?.[0]?.name;
    if (name) placeNames[placeId] = name;
    return name || "Unknown";
  } catch (e) {
    console.error(`Error fetching placeName for ${placeId}: ${e.message}`);
    return "Unknown";
  }
}

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
// Returns { count, users: [ { userId, username, jobId, placeId, gameName }… ] }
app.get("/beacon", async (req, res) => {
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

  const users = [];
  for (const [uid, info] of Object.entries(bucket)) {
    const gameName = await getPlaceName(info.placeId);
    users.push({
      userId:   uid,
      username: info.username,
      jobId,
      placeId: info.placeId,
      gameName
    });
  }

  res.json({
    count: users.length,
    users
  });
});

// — Global GET —
// Returns { count, users: [ { userId, username, jobId, placeId, gameName }… ] }
app.get("/beacon/all", async (req, res) => {
  const now = Date.now();
  const all = [];

  for (const [jobId, bucket] of Object.entries(active)) {
    const toDelete = [];
    for (const [uid, info] of Object.entries(bucket)) {
      if (now - info.lastTime > TIMEOUT) {
        toDelete.push(uid);
      } else {
        const gameName = await getPlaceName(info.placeId);
        all.push({
          userId:   uid,
          username: info.username,
          jobId,
          placeId: info.placeId,
          gameName
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
app.get("/proxy/universe", async (req, res) => {
  const placeId = req.query.placeId;
  if (!placeId) return res.status(400).json({ error: "Missing placeId" });

  try {
    const url = `https://games.roblox.com/v1/games/multiget-place-details?placeIds=${placeId}`;
    const response = await fetch(url, { headers: robloxHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET game details from universeId
app.get("/proxy/game", async (req, res) => {
  const universeId = req.query.universeId;
  if (!universeId) return res.status(400).json({ error: "Missing universeId" });

  try {
    const url = `https://games.roblox.com/v1/games?universeIds=${universeId}`;
    const response = await fetch(url, { headers: robloxHeaders });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => res.send('Chat & Beacon backend running.'));

app.listen(PORT, () => {
  console.log(`Chat & Beacon server listening on port ${PORT}`);
});
