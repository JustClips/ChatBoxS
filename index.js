const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const activeSessions = {};
const messages = []; // Store chat messages

// Accepts 'username', 'jobId'
app.post('/api/session/start', (req, res) => {
    const { username, jobId } = req.body;
    if (!username) {
        return res.status(400).send({ message: 'username is required' });
    }

    console.log(`Session started for: ${username} in jobId: ${jobId}`);
    activeSessions[username] = {
        jobId: jobId || 'N/A',
        startTime: Math.floor(Date.now() / 1000),
        lastHeartbeat: Math.floor(Date.now() / 1000)
    };

    res.status(200).send({ message: 'Session started successfully' });
});

app.post('/api/session/heartbeat', (req, res) => {
    const { username } = req.body;
    if (!username || !activeSessions[username]) {
        return res.status(404).send({ message: 'Session not found for heartbeat' });
    }
    activeSessions[username].lastHeartbeat = Math.floor(Date.now() / 1000);
    res.status(200).send({ message: 'Heartbeat received' });
});

app.get('/api/sessions/active', (req, res) => {
    const now = Math.floor(Date.now() / 1000);
    const activeUsers = [];

    for (const username in activeSessions) {
        const session = activeSessions[username];
        if (now - session.lastHeartbeat <= 180) {
            activeUsers.push({ username, ...session });
        } else {
            delete activeSessions[username];
        }
    }
    res.status(200).json(activeUsers);
});

// -------- Chat System --------

// Send a chat message (expects: username, jobId, message)
app.post('/api/chat/send', (req, res) => {
    const { username, jobId, message } = req.body;
    if (!username || !message) {
        return res.status(400).send({ message: 'username and message are required' });
    }
    const msgObj = {
        username,
        jobId: jobId || null,
        message,
        timestamp: Date.now()
    };
    messages.push(msgObj);
    res.status(200).send({ message: 'Message sent successfully' });
});

// Get all messages (optionally filter by jobId)
app.get('/api/chat/messages', (req, res) => {
    const { jobId } = req.query;
    let filteredMessages = messages;
    if (jobId) {
        filteredMessages = messages.filter(m => m.jobId === jobId);
    }
    res.status(200).json(filteredMessages);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
