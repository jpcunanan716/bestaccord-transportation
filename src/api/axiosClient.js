import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Create a configured Axios instance
export const axiosClient = axios.create({
    baseURL: baseURL, // This baseURL will be used for all requests made with this instance
    timeout: 10000, // Optional: Set a request timeout
    headers: {
        'Content-Type': 'application/json',
    },
});
