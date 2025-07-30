// Eps1llon Chatbox Backend - Updated for Executor GUI
// Endpoints: /chat/send (POST), /chat/fetch (GET)

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let messages = [];

// Send a chat message
app.post('/chat/send', (req, res) => {
    const { user, message } = req.body;
    if (
        typeof user !== "string" ||
        typeof message !== "string" ||
        !user.trim() ||
        !message.trim()
    ) {
        return res.status(400).json({ error: 'Invalid data' });
    }
    const msg = {
        user: user.trim().substring(0, 32),       // Limit username length
        message: message.trim().substring(0, 256),// Limit message length
        timestamp: Date.now()
    };
    messages.push(msg);
    if (messages.length > 200) messages.shift(); // Keep last 200 messages
    console.log(`[${new Date().toISOString()}] ${msg.user}: ${msg.message}`);
    res.json({ success: true });
});

// Get recent chat messages
app.get('/chat/fetch', (req, res) => {
    res.json(messages.slice(-100)); // Return last 100 messages
});

// Health check
app.get('/', (req, res) => {
    res.send('Chatbox backend is running.');
});

// (Optional) Clear messages endpoint for admin/testing only
app.post('/chat/clear', (req, res) => {
    messages = [];
    res.json({ success: true, cleared: true });
});

app.listen(PORT, () => {
    console.log(`Chat backend running on port ${PORT}`);
});
