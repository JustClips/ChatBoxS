const express = require('express');
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// This object will store the active sessions in memory.
// For a production app, you might want to use a database like Redis instead.
const activeSessions = {};

// Endpoint for the script to "check in" when it starts
app.post('/api/session/start', (req, res) => {
    const { userId, userNote } = req.body;
    if (!userId) {
        return res.status(400).send({ message: 'userId is required' });
    }

    console.log(`Session started for: ${userId}`);
    activeSessions[userId] = {
        userNote: userNote || 'No note provided',
        startTime: Math.floor(Date.now() / 1000), // Current time in seconds
        lastHeartbeat: Math.floor(Date.now() / 1000)
    };

    res.status(200).send({ message: 'Session started successfully' });
});

// Endpoint for the script to send its periodic "I'm still here" signal
app.post('/api/session/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).send({ message: 'userId is required' });
    }

    if (activeSessions[userId]) {
        // console.log(`Heartbeat received for: ${userId}`); // Optional: can be noisy
        activeSessions[userId].lastHeartbeat = Math.floor(Date.now() / 1000);
        res.status(200).send({ message: 'Heartbeat received' });
    } else {
        // If we get a heartbeat for a user not in our list, treat it as a new session start
        console.log(`Heartbeat for unknown session, starting new one for: ${userId}`);
        activeSessions[userId] = {
            userNote: 'N/A (reconnected)',
            startTime: Math.floor(Date.now() / 1000),
            lastHeartbeat: Math.floor(Date.now() / 1000)
        };
        res.status(200).send({ message: 'Session started on heartbeat' });
    }
});

// Endpoint for your admin GUI to get the list of currently active users
app.get('/api/sessions/active', (req, res) => {
    const now = Math.floor(Date.now() / 1000);
    const activeUsers = [];

    for (const userId in activeSessions) {
        const session = activeSessions[userId];
        // If the last heartbeat was within the last 3 minutes (180 seconds), consider them active.
        if (now - session.lastHeartbeat <= 180) {
            activeUsers.push({
                userId: userId,
                ...session
            });
        } else {
            // Clean up inactive sessions to save memory
            console.log(`Session timed out for: ${userId}. Removing.`);
            delete activeSessions[userId];
        }
    }
    
    console.log(`Returning ${activeUsers.length} active users.`);
    res.status(200).json(activeUsers);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
