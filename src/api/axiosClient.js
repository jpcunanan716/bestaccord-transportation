import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL;

// Create a configured Axios instance
export const axiosClient = axios.create({
    baseURL: baseURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
