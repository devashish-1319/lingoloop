import { axiosInstance, BASE_URL } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    // 401 just means "not logged in"; anything else (network/server) must not look like a logout
    if (error.response?.status === 401) return null;
    throw error;
  }
};

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers(params) {
  const response = await axiosInstance.get("/users", { params });
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export async function createChatChannel(friendId) {
  const response = await axiosInstance.post(`/chat/channel/${friendId}`);
  return response.data;
}

export async function getCallToken(callId) {
  const response = await axiosInstance.get(`/chat/call-token/${callId}`);
  return response.data;
}

export async function deleteFriendRequest(requestId) {
  const response = await axiosInstance.delete(`/users/friend-request/${requestId}`);
  return response.data;
}

// ---- recommendations with filters ----
// (getRecommendedUsers above accepts any of: page, limit, language, learning, location, search)

// ---- social ----
export async function unfriend(friendId) {
  const response = await axiosInstance.delete(`/users/friends/${friendId}`);
  return response.data;
}

export async function blockUser(userId) {
  const response = await axiosInstance.post(`/users/block/${userId}`);
  return response.data;
}

export async function unblockUser(userId) {
  const response = await axiosInstance.delete(`/users/block/${userId}`);
  return response.data;
}

export async function getBlockedUsers() {
  const response = await axiosInstance.get("/users/blocked");
  return response.data;
}

export async function reportUser({ userId, reason, details }) {
  const response = await axiosInstance.post(`/users/report/${userId}`, { reason, details });
  return response.data;
}

// ---- settings ----
export async function updateProfile(data) {
  const response = await axiosInstance.put("/auth/profile", data);
  return response.data;
}

export async function changePassword(data) {
  const response = await axiosInstance.put("/auth/password", data);
  return response.data;
}

// ---- calls ----
export async function ringFriend(friendId) {
  const response = await axiosInstance.post(`/chat/call/${friendId}/ring`);
  return response.data;
}

// ---- AI ----
export async function translateText({ text, targetLanguage }) {
  const response = await axiosInstance.post("/ai/translate", { text, targetLanguage });
  return response.data;
}

export async function getConversationTopics(friendId) {
  const response = await axiosInstance.post("/ai/topics", { friendId });
  return response.data;
}

// ---- practice ----
export async function startPracticeSession(callId) {
  const response = await axiosInstance.post("/practice", { callId });
  return response.data;
}

export async function endPracticeSession(sessionId) {
  const response = await axiosInstance.put(`/practice/${sessionId}/end`);
  return response.data;
}

export async function pingPracticeSession(sessionId) {
  const response = await axiosInstance.put(`/practice/${sessionId}/ping`);
  return response.data;
}

// used when the page is being closed/reloaded: keepalive lets the request outlive the page
export function endPracticeSessionOnUnload(sessionId) {
  fetch(`${BASE_URL}/practice/${sessionId}/end`, {
    method: "PUT",
    credentials: "include",
    keepalive: true,
  }).catch(() => {});
}

export async function getPracticeStats() {
  const response = await axiosInstance.get("/practice/stats");
  return response.data;
}
