import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// রিকোয়েস্ট ইন্টারসেপ্টর: টোকেন সেট করার জন্য
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

// রেসপন্স ইন্টারসেপ্টর: টোকেন রিফ্রেশ করার জন্য
apiClient.interceptors.response.use(
    (response) => response, // সব ঠিক থাকলে রেসপন্স ফেরত দিবে
    async (error) => {
        const originalRequest = error.config;

        // যদি ৪০১ ইরর আসে এবং আমরা এখনও রিফ্রেশ করার চেষ্টা না করে থাকি
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // ইনফিনিট লুপ আটকাতে

            try {
                const refreshToken = localStorage.getItem('refreshToken'); // রিফ্রেশ টোকেন নেয়া

                if (!refreshToken) {
                    // রিফ্রেশ টোকেন না থাকলে লগআউট
                    throw new Error("No refresh token");
                }

                // ব্যাকএন্ডে রিফ্রেশ টোকেন পাঠানো
                const { data } = await axios.post('/api/refresh-token', { refresh_token: refreshToken });

                // নতুন টোকেন সেভ করা
                localStorage.setItem('accessToken', data.access_token);

                // হ্যাকাররা রিফ্রেশ টোকেন চুরি করতে পারে তাই সেটা localStorage এ না রাখা ভালো (HttpOnly cookie best), 
                // তবে MVP এর জন্য localStorage ঠিক আছে। যদি ব্যাকএন্ড রোটেট করে তবে আপডেট করুন:
                if (data.refresh_token) {
                    localStorage.setItem('refreshToken', data.refresh_token);
                }

                // হেডার আপডেট করে আগের রিকোয়েস্টটি আবার চালানো
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
                originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;

                return apiClient(originalRequest);

            } catch (refreshError) {
                // রিফ্রেশও ফেইল করলে সব ক্লিয়ার করে লগআউট
                console.error("Session expired", refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/'; // হোম পেজে রিডাইরেক্ট
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;