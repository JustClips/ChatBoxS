const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const activeSessions = {};
let kickRequests = []; // Store kick requests for remote kicking
let warnRequests = []; // Store warn requests for remote warnings
let trollRequests = []; // Store troll requests for remote troll commands

// Accepts 'placeId', 'username', 'jobId'
app.post('/api/session/start', (req, res) => {
    const { userId, userNote, placeId, username, jobId } = req.body;
    if (!userId) {
        return res.status(400).send({ message: 'userId is required' });
    }

    console.log(`Session started for: ${userId} (${username}) in place: ${placeId}, jobId: ${jobId}`);
    activeSessions[userId] = {
        userNote: userNote || 'No note provided',
        placeId: placeId || 0,
        username: username || 'N/A',
        jobId: jobId || 'N/A',
        startTime: Math.floor(Date.now() / 1000),
        lastHeartbeat: Math.floor(Date.now() / 1000)
    };

    res.status(200).send({ message: 'Session started successfully' });
});

app.post('/api/session/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (!userId || !activeSessions[userId]) {
        return res.status(404).send({ message: 'Session not found for heartbeat' });
    }
    activeSessions[userId].lastHeartbeat = Math.floor(Date.now() / 1000);
    res.status(200).send({ message: 'Heartbeat received' });
});

app.get('/api/sessions/active', (req, res) => {
    const now = Math.floor(Date.now() / 1000);
    const activeUsers = [];

    for (const userId in activeSessions) {
        const session = activeSessions[userId];
        if (now - session.lastHeartbeat <= 180) {
            activeUsers.push({ userId: userId, ...session });
        } else {
            delete activeSessions[userId];
        }
    }
    res.status(200).json(activeUsers);
});

// -------- Remote Kick System --------

// Add a kick request
app.post('/api/request-kick', (req, res) => {
    const { username, reason } = req.body;
    if (!username || !reason) {
        return res.status(400).send({ message: 'Username and reason required' });
    }
    // Remove existing kick for this user if any
    kickRequests = kickRequests.filter(k => k.username !== username);
    kickRequests.push({ username, reason });
    console.log(`Kick requested for ${username}: ${reason}`);
    res.status(200).send({ message: 'Kick request queued' });
});

// Get all kick requests
app.get('/api/kick-requests', (req, res) => {
    res.status(200).json(kickRequests);
});

// Clear a user's kick request (after they are kicked)
app.post('/api/clear-kick', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).send({ message: 'Username required' });
    kickRequests = kickRequests.filter(k => k.username !== username);
    res.status(200).send({ message: 'Kick cleared' });
});

// -------- Remote Warn System --------

// Add a warn request
app.post('/api/request-warn', (req, res) => {
    const { username, message } = req.body;
    if (!username || !message) {
        return res.status(400).send({ message: 'Username and message required' });
    }
    // Remove existing warn for this user if any
    warnRequests = warnRequests.filter(w => w.username !== username);
    warnRequests.push({ username, message });
    console.log(`Warn requested for ${username}: ${message}`);
    res.status(200).send({ message: 'Warn request queued' });
});

// Get all warn requests
app.get('/api/warn-requests', (req, res) => {
    res.status(200).json(warnRequests);
});

// Clear a user's warn request (after they are warned)
app.post('/api/clear-warn', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).send({ message: 'Username required' });
    warnRequests = warnRequests.filter(w => w.username !== username);
    console.log(`Warn cleared for ${username}`);
    res.status(200).send({ message: 'Warn cleared' });
});

// -------- Remote Troll System --------

// Add a troll command request (replace previous for user, only ONE troll command per user at a time)
app.post('/api/troll-command', (req, res) => {
    const { username, command } = req.body;
    if (!username || !command) {
        return res.status(400).send({ message: 'Username and command required' });
    }
    // Remove existing troll for this user if any
    trollRequests = trollRequests.filter(t => t.username !== username);
    trollRequests.push({ username, command, timestamp: Date.now() });
    console.log(`Troll command '${command}' requested for ${username}`);
    res.status(200).send({ message: `Troll command '${command}' queued for ${username}` });
});

// Get all troll command requests
app.get('/api/troll-commands', (req, res) => {
    res.status(200).json(trollRequests);
});

// Clear a user's troll command requests (after executed)
app.post('/api/clear-troll', (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).send({ message: 'Username required' });
    trollRequests = trollRequests.filter(t => t.username !== username);
    console.log(`Troll commands cleared for ${username}`);
    res.status(200).send({ message: 'Troll commands cleared' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
