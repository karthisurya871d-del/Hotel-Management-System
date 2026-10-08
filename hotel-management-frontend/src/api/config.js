// In development, falls back to http://localhost:3000
// In production on Render (or other hosts), uses VITE_API_URL set in environment variables
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");
export const API_BASE_URL = `${API_ORIGIN}/api/hotels`;
export const IMAGE_BASE = API_ORIGIN;
