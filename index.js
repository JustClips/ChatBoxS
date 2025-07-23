const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const activeSessions = {};
let kickRequests = []; // Store kick requests for remote kicking

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
