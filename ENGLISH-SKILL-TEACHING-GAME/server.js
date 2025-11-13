const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname)));
app.use('/shared-css', express.static(path.join(__dirname, 'shared-css')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('=== SERVER STARTED SUCCESSFULLY ===');
    console.log(`Main directory server running at http://localhost:${PORT}`);
    console.log('Word Classification game runs at http://localhost:5002');
    console.log('Press Ctrl+C to stop the server');
});