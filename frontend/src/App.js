import React, { useEffect, useState } from "react";
import { fetchProfile } from "./utils/fetchDetails";

const usernames = ["reaper_04","aayushbarhate","Phineas_Phreak","KDOT2809","tanishq_kochar"];

function countWeeklySolves(submissionCalendar) {
  if (!submissionCalendar) return 0;
  
  // submissionCalendar is a JSON string with timestamps and submission counts
  const calendar = JSON.parse(submissionCalendar);
  const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  
  let weeklyCount = 0;
  for (const [timestamp, count] of Object.entries(calendar)) {
    if (parseInt(timestamp) >= oneWeekAgo) {
      weeklyCount += count;
    }
  }
  
  return weeklyCount;
}

function getRecentWeeklySolves(recentList) {
  // iska calc badme kro
  return [];
}

// Function to get difficulty color
function getDifficultyColor(difficulty) {
  const colors = {
    Easy: '#00b8a3',
    Medium: '#ffc01e', 
    Hard: '#ff375f'
  };
  return colors[difficulty] || '#6c757d';
}

async function fetchAllProfiles(usernames) {
  const results = await Promise.all(
    usernames.map((username) => fetchProfile(username))
  );
  return results
    .filter((profile) => profile !== null)
    .map((profile) => ({
      ...profile,
      weeklySolves: countWeeklySolves(profile.submissionCalendar),
      weeklySubmissions: getRecentWeeklySolves(profile.recentSubmissions),
    }))
    .sort((a, b) => b.weeklySolves - a.weeklySolves);
}

function App() {
  const [userProfiles, setUserProfiles] = useState([]);
  const [showRecent, setShowRecent] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        setError(null);
        const profiles = await fetchAllProfiles(usernames);
        setUserProfiles(profiles);
      } catch (err) {
        setError("Failed to fetch user profiles");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const toggleRecent = (username) => {
    setShowRecent((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const currentStyles = darkMode ? darkStyles : lightStyles;

  // Apply dark mode to entire page
  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? '#0d1117' : '#f8f9fa';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, [darkMode]);

  if (loading) {
    return (
      <div style={currentStyles.container}>
        <div style={currentStyles.loading}>Loading LeetCode profiles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={currentStyles.container}>
        <div style={currentStyles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={currentStyles.container}>
      <div style={currentStyles.header}>
        <h1 style={currentStyles.title}> LeetCode Tracker</h1>
        <button onClick={toggleDarkMode} style={currentStyles.themeToggle}>
          {darkMode ? '☀︎' : '⏾'}
        </button>
      </div>
      
      {/* Leaderboard */}
      <div style={currentStyles.leaderboard}>
        <h2 style={currentStyles.sectionTitle}>🏆 Weekly Leaderboard</h2>
        <div style={currentStyles.leaderboardList}>
          {userProfiles.map((user, index) => (
            <div key={index} style={currentStyles.leaderboardItem}>
              <div style={index === 0 ? currentStyles.rankFirst : currentStyles.rank}>
                {index === 0 ? '👑 #1' : `#${index + 1}`}
              </div>
              <img
                src={user.profile.userAvatar}
                alt="avatar"
                style={currentStyles.leaderboardAvatar}
              />
              <div style={currentStyles.leaderboardInfo}>
                <div style={index === 0 ? currentStyles.leaderboardNameFirst : currentStyles.leaderboardName}>
                  {user.username}
                </div>
                <div style={currentStyles.leaderboardSolves}>
                  {user.weeklySolves} solves this week
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Cards */}
      <div style={currentStyles.userGrid}>
        {userProfiles.map((userData) => (
          <div key={userData.username} style={currentStyles.userCard}>
            <div style={currentStyles.userHeader}>
              <img
                src={userData.profile.userAvatar}
                alt="avatar"
                style={currentStyles.userAvatar}
              />
              <div>
                <h3 style={currentStyles.userName}>
                  {userData.username}
                </h3>
                <p style={currentStyles.userRealName}>
                  {userData.profile.realName || 'Name not available'}
                </p>
                <p style={currentStyles.userRanking}>
                  Ranking: #{userData.profile.ranking}
                </p>
              </div>
            </div>

            <div style={currentStyles.statsSection}>
              <h4 style={currentStyles.statsTitle}>Problem Statistics</h4>
              <div style={currentStyles.statsGrid}>
                {userData.submitStats.acSubmissionNum.map((item) => (
                  <div key={item.difficulty} style={currentStyles.statItem}>
                    <span style={{
                      ...currentStyles.statLabel,
                      color: getDifficultyColor(item.difficulty)
                    }}>
                      {item.difficulty}:
                    </span>
                    <span style={currentStyles.statValue}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={currentStyles.weeklySection}>
              <div style={currentStyles.weeklyBadge}>
                <span style={currentStyles.weeklyCount}>{userData.weeklySolves}</span>
                <span style={currentStyles.weeklyLabel}>Weekly Solves</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const lightStyles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: {
    color: "#2c3e50",
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: "0",
  },
  themeToggle: {
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "1.5rem",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "1.2rem",
    color: "#6c757d",
  },
  error: {
    textAlign: "center",
    padding: "50px",
    fontSize: "1.2rem",
    color: "#dc3545",
    backgroundColor: "#f8d7da",
    borderRadius: "10px",
    border: "1px solid #f5c6cb",
  },
  leaderboard: {
    backgroundColor: "#ffffff",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "30px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  sectionTitle: {
    color: "#2c3e50",
    marginBottom: "20px",
    fontSize: "1.8rem",
    textAlign: "center",
  },
  leaderboardList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  leaderboardItem: {
    display: "flex",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    border: "1px solid #e9ecef",
  },
  rank: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#6c757d",
    marginRight: "15px",
    minWidth: "60px",
  },
  rankFirst: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#ffd700",
    marginRight: "15px",
    minWidth: "60px",
  },
  leaderboardAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    marginRight: "15px",
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#2c3e50",
  },
  leaderboardNameFirst: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#ffd700",
  },
  leaderboardSolves: {
    color: "#6c757d",
    fontSize: "0.9rem",
  },
  userGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e9ecef",
  },
  userHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  userAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    marginRight: "15px",
  },
  userName: {
    margin: "0",
    color: "#2c3e50",
    fontSize: "1.3rem",
  },
  userRealName: {
    margin: "5px 0",
    color: "#6c757d",
    fontSize: "0.9rem",
  },
  userRanking: {
    margin: "5px 0 0 0",
    color: "#6c757d",
    fontSize: "0.9rem",
  },
  statsSection: {
    marginBottom: "15px",
  },
  statsTitle: {
    color: "#2c3e50",
    marginBottom: "10px",
    fontSize: "1.1rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "8px",
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "6px",
    fontSize: "0.9rem",
  },
  statLabel: {
    color: "#6c757d",
    textTransform: "capitalize",
    fontWeight: "bold",
  },
  statValue: {
    fontWeight: "bold",
    color: "#2c3e50",
  },
  weeklySection: {
    marginBottom: "0px",
    textAlign: "center",
  },
  weeklyBadge: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: "15px 20px",
    borderRadius: "10px",
    border: "2px solid #2196f3",
  },
  weeklyCount: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#1976d2",
  },
  weeklyLabel: {
    fontSize: "0.9rem",
    color: "#1976d2",
    marginTop: "5px",
  },
  toggleButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.3s",
  },
  recentSolves: {
    marginTop: "15px",
    padding: "15px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  noSolves: {
    textAlign: "center",
    color: "#6c757d",
    fontStyle: "italic",
  },
  solveItem: {
    padding: "10px",
    borderBottom: "1px solid #e9ecef",
  },
  solveTitle: {
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: "5px",
  },
  solveTime: {
    fontSize: "0.8rem",
    color: "#6c757d",
  },
};

const darkStyles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#0d1117",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
  },
  title: {
    color: "#f0f6fc",
    fontSize: "2.5rem",
    fontWeight: "bold",
    margin: "0",
  },
  themeToggle: {
    backgroundColor: "#238636",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    fontSize: "1.5rem",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "1.2rem",
    color: "#8b949e",
  },
  error: {
    textAlign: "center",
    padding: "50px",
    fontSize: "1.2rem",
    color: "#f85149",
    backgroundColor: "#21262d",
    borderRadius: "10px",
    border: "1px solid #30363d",
  },
  leaderboard: {
    backgroundColor: "#161b22",
    borderRadius: "15px",
    padding: "25px",
    marginBottom: "30px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
    border: "1px solid #30363d",
  },
  sectionTitle: {
    color: "#f0f6fc",
    marginBottom: "20px",
    fontSize: "1.8rem",
    textAlign: "center",
  },
  leaderboardList: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  leaderboardItem: {
    display: "flex",
    alignItems: "center",
    padding: "15px",
    backgroundColor: "#21262d",
    borderRadius: "10px",
    border: "1px solid #30363d",
  },
  rank: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#8b949e",
    marginRight: "15px",
    minWidth: "60px",
  },
  rankFirst: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#ffd700",
    marginRight: "15px",
    minWidth: "60px",
  },
  leaderboardAvatar: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    marginRight: "15px",
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#f0f6fc",
  },
  leaderboardNameFirst: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#ffd700",
  },
  leaderboardSolves: {
    color: "#8b949e",
    fontSize: "0.9rem",
  },
  userGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  userCard: {
    backgroundColor: "#161b22",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
    border: "1px solid #30363d",
  },
  userHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
  },
  userAvatar: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    marginRight: "15px",
  },
  userName: {
    margin: "0",
    color: "#f0f6fc",
    fontSize: "1.3rem",
  },
  userRealName: {
    margin: "5px 0",
    color: "#8b949e",
    fontSize: "0.9rem",
  },
  userRanking: {
    margin: "5px 0 0 0",
    color: "#8b949e",
    fontSize: "0.9rem",
  },
  statsSection: {
    marginBottom: "15px",
  },
  statsTitle: {
    color: "#f0f6fc",
    marginBottom: "10px",
    fontSize: "1.1rem",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "8px",
  },
  statItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "#21262d",
    borderRadius: "6px",
    fontSize: "0.9rem",
    border: "1px solid #30363d",
  },
  statLabel: {
    color: "#8b949e",
    textTransform: "capitalize",
    fontWeight: "bold",
  },
  statValue: {
    fontWeight: "bold",
    color: "#f0f6fc",
  },
  weeklySection: {
    marginBottom: "0px",
    textAlign: "center",
  },
  weeklyBadge: {
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#0d419d",
    padding: "15px 20px",
    borderRadius: "10px",
    border: "2px solid #1f6feb",
  },
  weeklyCount: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#58a6ff",
  },
  weeklyLabel: {
    fontSize: "0.9rem",
    color: "#58a6ff",
    marginTop: "5px",
  },
  toggleButton: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#238636",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.3s",
  },
  recentSolves: {
    marginTop: "15px",
    padding: "15px",
    backgroundColor: "#21262d",
    borderRadius: "8px",
    border: "1px solid #30363d",
  },
  noSolves: {
    textAlign: "center",
    color: "#8b949e",
    fontStyle: "italic",
  },
  solveItem: {
    padding: "10px",
    borderBottom: "1px solid #30363d",
  },
  solveTitle: {
    fontWeight: "bold",
    color: "#f0f6fc",
    marginBottom: "5px",
  },
  solveTime: {
    fontSize: "0.8rem",
    color: "#8b949e",
  },
};

export default App;