import axios from "axios";

export async function fetchProfile(username) {
    try {
        const response = await axios.post("http://localhost:5000/leetcode", {
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