// Eps1llon Chatbox Backend - Persistent Version for Exploit Executor Chat
// Endpoints: /chat/send (POST), /chat/fetch (GET)
// Persists messages to disk (messages.json) so chat history is saved across server restarts

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const MESSAGES_FILE = path.join(__dirname, 'messages.json');
let messages = [];

// Load messages from disk if available
function loadMessages() {
    try {
        if (fs.existsSync(MESSAGES_FILE)) {
            const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
            messages = JSON.parse(data);
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
    saveMessages();
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
    saveMessages();
    res.json({ success: true, cleared: true });
});

app.listen(PORT, () => {
    console.log(`Chat backend running on port ${PORT}`);
});
