export function setAccessToken(token) {
    return localStorage.setItem("accessToken", token);
}

export function getAccessToken() {
    return localStorage.getItem("accessToken");
}