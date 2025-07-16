const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'https://leetcode-tracker-pnubpybtp-reapers-projects-d03fad26.vercel.app', 
    'http://localhost:3000' 
  ]
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'LeetCode Tracker API is running!', status: 'healthy' });
});

app.post('/leetcode', async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
})