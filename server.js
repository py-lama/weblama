const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 80;

// Serve static files from the static directory
app.use(express.static(path.join(__dirname, 'static')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`WebLama app listening at http://localhost:${port}`);
});
