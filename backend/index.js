const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

console.log('Starting server...');
console.log('Port:', PORT);

app.use(cors({
  origin: [
    'https://leetcode-tracker-gamma.vercel.app',
    'http://localhost:3000' 
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

app.get('/', (req, res) => {
  console.log('Health check requested');
  res.json({ message: 'LeetCode Tracker API is running!', status: 'healthy' });
});

app.post('/leetcode', async (req, res) => {
  console.log('LeetCode request received for username:', req.body.username);
  
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Your existing GraphQL query code...
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          ranking
          userAvatar
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        submissionCalendar
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query,
        variables: { username },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    );

    if (response.data.errors) {
      console.error('GraphQL errors:', response.data.errors);
      return res.status(400).json({ error: 'Invalid username or user not found' });
    }

    if (!response.data.data.matchedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(response.data.data.matchedUser);
  } catch (error) {
    console.error('Error fetching from LeetCode:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    res.status(500).json({ error: 'Something went wrong fetching data from LeetCode' });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server successfully running on port ${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received');
  server.close(() => {
    console.log('Process terminated');
  });
});