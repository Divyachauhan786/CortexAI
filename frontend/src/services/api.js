import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8000",
    withCredentials: true,
});

// Response interceptor to handle expired sessions
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response &&
            error.response.status === 401 &&
            typeof window !== "undefined"
        ) {
            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/register") {
                console.warn("[Auth] Session expired or unauthorized. Redirecting to /login");
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;