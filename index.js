const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // <- Enable CORS for all requests
app.use(express.json());

const activeSessions = {};

// Accepts 'placeId'
app.post('/api/session/start', (req, res) => {
    const { userId, userNote, placeId } = req.body;
    if (!userId) {
        return res.status(400).send({ message: 'userId is required' });
    }

    console.log(`Session started for: ${userId} in place: ${placeId}`);
    activeSessions[userId] = {
        userNote: userNote || 'No note provided',
        placeId: placeId || 0,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
