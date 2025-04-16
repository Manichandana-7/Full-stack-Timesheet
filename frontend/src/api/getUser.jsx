import api from "../api/axios";

const getUser = async () => {
  try {
    const response = await api.get("/auth/check-session", { withCredentials: true });
    return response.data.user; // ✅ Return user details
  } catch (error) {
    console.error("Error fetching user:", error);
    return null; // No user found
  }
};
export default getUser;