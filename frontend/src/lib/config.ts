// Base URL of the backend API. Set VITE_API_URL when deploying;
// local development falls back to the backend's default port.
export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000'
