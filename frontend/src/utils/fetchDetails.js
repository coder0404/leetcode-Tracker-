import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export async function fetchProfile(username) {
    try {
        const response = await axios.post(`${API_URL}/leetcode`, {
            username,
        });

        return response.data;
    } catch (error) {
        console.error(`Error fetching LeetCode data for ${username}:`, error);
        
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        
        return null;
    }
}