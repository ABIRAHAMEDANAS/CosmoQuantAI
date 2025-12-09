import axios from 'axios';

// ✅ FIX 2: Base URL Direct to Backend Port 8000
// ডেভেলপমেন্টে সরাসরি ব্যাকএন্ড পোর্টে হিট করা নিরাপদ
const apiClient = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // পাথ আপডেট: /v1/auth/refresh-token
                const { data } = await axios.post('http://localhost:8000/api/v1/auth/refresh-token', { refresh_token: refreshToken });

                localStorage.setItem('accessToken', data.access_token);

                if (data.refresh_token) {
                    localStorage.setItem('refreshToken', data.refresh_token);
                }

                apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
                originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;

                return apiClient(originalRequest);

            } catch (refreshError) {
                console.error("Session expired", refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
