import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:7002',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;

