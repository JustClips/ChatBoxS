const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Store active users: jobId -> { userId -> lastHeartbeatTimestamp }
const activeUsers = {};
const TIMEOUT_MS = 15000; // 15 seconds timeout

// Chat messages storage (simple in-memory)
let messages = [];

app.post('/beacon', (req, res) => {
  const { userId, jobId } = req.body;
  if (!userId || !jobId) return res.status(400).send('Missing userId or jobId');

  if (!activeUsers[jobId]) activeUsers[jobId] = {};
  activeUsers[jobId][userId] = Date.now();

  res.json({ success: true });
});

app.get('/beacon', (req, res) => {
  const jobId = req.query.jobId;
  if (!jobId) return res.status(400).send('Missing jobId');

  if (!activeUsers[jobId]) return res.json({ count: 0 });

  const now = Date.now();

  // Remove expired users
  Object.entries(activeUsers[jobId]).forEach(([userId, lastTime]) => {
    if (now - lastTime > TIMEOUT_MS) {
      delete activeUsers[jobId][userId];
    }
  });

  res.json({ count: Object.keys(activeUsers[jobId]).length });
});

// Chat endpoints
app.get('/messages', (req, res) => {
  res.json(messages);
});

app.post('/messages', (req, res) => {
  const { user, text } = req.body;
  if (typeof user !== 'string' || typeof text !== 'string') {
    return res.status(400).json({ error: 'Invalid user or text' });
  }
  messages.push({ user, text, time: Date.now() });
  if (messages.length > 100) messages.shift();
  res.json({ success: true });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Beacon server running on port ${port}`);
});
