import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("❌ API_BASE_URL is not defined. Check your .env file!");
}

const api = {
  registerUser: async (user) => {
    console.log("📩 Sending Data:", user);
    const response = await axios.post(`${API_BASE_URL}/user/register`, user, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  loginUser: async (values) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/user/login`, values);
      return response.data;
    } catch (error) {
      console.error("❌ API Login Error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },
};

export default api;
