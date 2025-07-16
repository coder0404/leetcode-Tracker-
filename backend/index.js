const express = require('express');
const app = express();

// Railway will inject the PORT environment variable
const PORT = process.env.PORT || 8080;

// A simple, fast health check endpoint at the root path '/'
app.get('/', (req, res) => {
  console.log(`Health check request received at ${new Date().toISOString()}`);
  res.status(200).send('Hello from the healthy debug server!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal Debug Server is listening on port ${PORT}`);
});