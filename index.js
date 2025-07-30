const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let messages = [];

app.post('/chat/send', (req, res) => {
    const { user, message } = req.body;
    if (!user || !message) return res.status(400).json({ error: 'Invalid data' });
    const msg = { user, message, timestamp: Date.now() };
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    console.log("New message:", msg);
    console.log("All messages:", messages);
    res.json({ success: true });
});

app.get('/chat/fetch', (req, res) => {
    res.json(messages.slice(-50));
});

app.get('/', (req, res) => {
    res.send('Chatbox backend is running.');
});

app.listen(PORT, () => {
    console.log(`Chat backend running on port ${PORT}`);
});
