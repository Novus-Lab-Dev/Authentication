import axios from "axios";
import { getAccessToken, setAccessToken } from "./auth";

export const api = axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true,
});





api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (original?.url === "/refresh") {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      const res = await api.post("/refresh");

      setAccessToken(res.data.accessToken);

      original.headers.Authorization = `Bearer ${res.data.accessToken}`;

      return api(original);
    }

    return Promise.reject(err);
  }
);