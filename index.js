// Chatbox backend index.js for Railway/production

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow all origins (adjust in production if needed)
app.use(cors());
app.use(bodyParser.json());

let messages = []; // In-memory message store

// Endpoint to send a chat message
app.post('/chat/send', (req, res) => {
    const { user, message } = req.body;
    if (!user || !message) return res.status(400).json({ error: 'Invalid data' });
    const msg = { user, message, timestamp: Date.now() };
    messages.push(msg);
    // Keep only last 100 messages
    if (messages.length > 100) messages.shift();
    res.json({ success: true });
});

// Endpoint to fetch chat messages
app.get('/chat/fetch', (req, res) => {
    res.json(messages.slice(-50)); // Last 50 messages
});

// Health check
app.get('/', (req, res) => {
    res.send('Chatbox backend is running.');
});

app.listen(PORT, () => {
    console.log(`Chat backend running on port ${PORT}`);
});
