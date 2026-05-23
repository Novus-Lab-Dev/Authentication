
import { api } from "./api";
import { getAccessToken, setAccessToken } from "./auth";

export async function login(email, password) {
    const res = await api.post("/login", { email, password });

    setAccessToken(res.data.accessToken);
}