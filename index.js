const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let messages = []; // In-memory message list (use a database for production)

// Get chat messages
app.get('/messages', (req, res) => {
    res.json(messages.slice(-50)); // last 50 messages
});

// Post a new message
app.post('/messages', (req, res) => {
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: 'Missing user or text' });
    const msg = { user, text, time: Date.now() };
    messages.push(msg);
    res.json({ success: true });
});

// Health check
app.get('/', (req, res) => res.send('Chat backend running.'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
