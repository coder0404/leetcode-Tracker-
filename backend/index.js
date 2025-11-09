require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const redis = require('redis');

const app = express();
const PORT = 5000;
  
console.log('Starting server...');
console.log('Port:', PORT);

app.use(cors({
  origin: [
    'https://leetcode-tracker-gamma.vercel.app',
    'https://www.lctracker.app',
    'https://lctracker.app',
    'http://localhost:3000' 
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

app.get('/', (req, res) => {
  console.log('Health check requested');
  res.json({ message: 'LeetCode Tracker API is running!', status: 'healthy' });
});

app.post('/leetcode', async (req, res) => {
  console.log('LeetCode request received for username:', req.body.username);
  
  const { username, refresh } = req.body; // We can now accept a 'refresh' flag
  const cacheKey = `leetcode:${username}`;
  const CACHE_EXPIRATION_SECONDS = 3600; // 1 hour

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // --- Caching Logic ---
  if (!refresh) {
    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        console.log(`CACHE HIT for ${username}`);
        return res.json(JSON.parse(cachedData));
      }
      console.log(`CACHE MISS for ${username}`);
    } catch (err) {
      console.error('Redis GET error:', err);
      // If Redis fails, we proceed to fetch from API anyway
    }
  } else {
    console.log(`REFRESH requested for ${username}, bypassing cache.`);
  }

  // GraphQL query
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

    const userData = response.data.data.matchedUser;

    //Calculation for Weekly Solves
    const currentTotalSolves = userData.submitStats.acSubmissionNum.find(
      item => item.difficulty === 'All'
    )?.count || 0;

    // Create a unique Redis key for this user's Monday baseline
    const mondayKey = `monday_baseline:${username}`;
    let mondayBaseline = await redisClient.get(mondayKey);

    if (!mondayBaseline) {
      mondayBaseline = currentTotalSolves;

      const now = new Date();
      const currentDay = now.getUTCDay(); 
      const daysUntilMonday = (8 - currentDay) % 7 || 7;
      const nextMonday = new Date(now);
      nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
      nextMonday.setUTCHours(0, 0, 0, 0); 
      const secondsUntilMonday = Math.floor((nextMonday - now) / 1000);
      
      // Store baseline in Redis with auto-expiration
      await redisClient.set(mondayKey, mondayBaseline.toString(), {
        EX: secondsUntilMonday
      });
      console.log(`Set Monday baseline for ${username}: ${mondayBaseline} (expires in ${secondsUntilMonday}s)`);
    } else {
      mondayBaseline = parseInt(mondayBaseline);
      console.log(`Using existing Monday baseline for ${username}: ${mondayBaseline}`);
    }

    userData.weeklySolves = Math.max(0, currentTotalSolves - mondayBaseline);
    console.log(`${username} weekly solves: ${userData.weeklySolves} (current: ${currentTotalSolves}, baseline: ${mondayBaseline})`);


    // --- Store in Cache ---
    try {
      await redisClient.set(cacheKey, JSON.stringify(userData), {
        EX: CACHE_EXPIRATION_SECONDS,
      });
      console.log(`SAVED to cache: ${username}`);
    } catch (err) {
      console.error('Redis SET error:', err);
    }
    // ----------------------

    res.json(userData);
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