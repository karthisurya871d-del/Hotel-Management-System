let origin = (import.meta.env.VITE_API_URL || "http://localhost:3000").trim();

// Ensure protocol if only hostname is provided
if (origin && !origin.startsWith("http://") && !origin.startsWith("https://")) {
    origin = `https://${origin}`;
}

export const API_ORIGIN = origin.replace(/\/$/, "");
export const API_BASE_URL = `${API_ORIGIN}/api/hotels`;
export const IMAGE_BASE = API_ORIGIN;
