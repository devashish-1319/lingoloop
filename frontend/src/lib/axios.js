import axios from "axios";
import { queryClient } from "./queryClient";

export const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send cookies with the request
});

// endpoints where a 401 is an expected answer rather than an expired session
const AUTH_ENDPOINTS = /\/auth\/(login|signup|me)$/;

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !AUTH_ENDPOINTS.test(error.config?.url ?? "")) {
      // session expired: drop the cached user so the route guards send us to /login
      queryClient.setQueryData(["authUser"], null);
    }
    return Promise.reject(error);
  }
);
