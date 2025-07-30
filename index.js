// Eps1llon Chatbox Backend - Persistent Chat & Script User Beacon (for Roblox Executor GUI)
// Endpoints:
//   POST   /messages    {user, text}         -> stores message (persistent)
//   GET    /messages                        -> array of last 100 messages [{user, text, time}]
//   POST   /beacon     {userId, jobId}      -> presence beacon (script user count)
//   GET    /beacon?jobId=...                -> {count: number} for current server/jobId
//   POST   /clear                           -> (optional) clears chat (admin/test)

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

/** ===== Chat Message Persistence ===== **/
const MESSAGES_FILE = path.join(__dirname, 'messages.json');
let messages = [];

// Load messages from disk
function loadMessages() {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
            if (!Array.isArray(messages)) messages = [];
        }
    } catch (err) {
        console.error("Failed to load messages from file:", err);
        messages = [];
    }
}
// Save messages to disk
function saveMessages() {
    try {
        fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    } catch (err) {
        console.error("Failed to save messages to file:", err);
    }
}
loadMessages();

/** ===== In-memory Script User Beacon ===== **/
let beacons = {}; // { jobId: { userId: lastSeen } }
const BEACON_EXPIRY = 10; // seconds

function pruneOldBeacons() {
    const now = Date.now() / 1000;
    for (const jobId in beacons) {
        for (const userId in beacons[jobId]) {
            if (now - beacons[jobId][userId] > BEACON_EXPIRY) {
                delete beacons[jobId][userId];
            }
        }
        if (Object.keys(beacons[jobId]).length === 0) {
            delete beacons[jobId];
        }
    }
}

/** ===== Chat API ===== **/

// Send a chat message
app.post('/messages', (req, res) => {
    const { user, text } = req.body;
    if (
        typeof user !== "string" ||
        typeof text !== "string" ||
        !user.trim() ||
        !text.trim()
    ) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    const msg = {
        user: user.trim().substring(0, 32),
        text: text.trim().substring(0, 256),
        time: Date.now()
    };
    messages.push(msg);
    if (messages.length > 200) messages.shift();
    saveMessages();
    res.json({ success: true });
});

// Get recent chat messages
app.get('/messages', (req, res) => {
    res.json(messages.slice(-100));
});

// Clear all messages (optional, for testing/admin)
app.post('/clear', (req, res) => {
    messages = [];
    saveMessages();
    res.json({ success: true, cleared: true });
});

/** ===== Beacon API ===== **/

// Post beacon (script presence)
app.post('/beacon', (req, res) => {
    const { userId, jobId } = req.body;
    if (!userId || !jobId) return res.status(400).json({ error: "userId and jobId required" });
    if (!beacons[jobId]) beacons[jobId] = {};
    beacons[jobId][userId] = Date.now() / 1000;
    res.json({ success: true });
});

// Get beacon count for a jobId (how many users running script in same server)
app.get('/beacon', (req, res) => {
    pruneOldBeacons();
    const jobId = req.query.jobId;
    if (!jobId) return res.json({ count: 0 });
    const jobBeacons = beacons[jobId] || {};
    res.json({ count: Object.keys(jobBeacons).length });
});

/** ===== Root Health Check ===== **/
app.get('/', (req, res) => {
    res.send('Eps1llon Chatbox backend is running.');
});

app.listen(PORT, () => {
    console.log(`Chat backend running on port ${PORT}`);
});
