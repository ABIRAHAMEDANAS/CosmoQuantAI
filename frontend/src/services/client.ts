import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api', // এটি ঠিক আছে, কারণ Nginx /api কে হ্যান্ডেল করছে
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

                // **FIX:** এখানে পাথ আপডেট করা হয়েছে
                // আগে ছিল: '/api/refresh-token'
                // এখন হবে: '/api/v1/auth/refresh-token'
                const { data } = await axios.post('/api/v1/auth/refresh-token', { refresh_token: refreshToken });

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
