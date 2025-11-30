import apiClient from './client';

// রেজিস্ট্রেশন যেমন ছিল তেমনই থাকবে (JSON)
export const registerUser = async (userData: any) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
};

// লগইন আপডেট করুন (Form Data ফরম্যাটে)
// লগইন ফাংশন (আপডেট করা হয়েছে)
export const loginUser = async (credentials: any) => {
  // ব্যাকএন্ড এখন Form Data আশা করে (OAuth2 Standard)
  const formData = new URLSearchParams();
  formData.append('username', credentials.email); // ব্যাকএন্ড 'username' ফিল্ড খুঁজবে
  formData.append('password', credentials.password);

  const response = await apiClient.post('/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data;
};

// বর্তমান ইউজারের তথ্য আনার জন্য
export const fetchCurrentUser = async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
};

// ১. পাসওয়ার্ড রিসেট ইমেইল পাঠানো
export const sendForgotPasswordRequest = async (email: string) => {
    const response = await apiClient.post('/forgot-password', { email });
    return response.data;
};

// ২. নতুন পাসওয়ার্ড সেট করা
export const resetUserPassword = async (token: string, newPassword: string) => {
    const response = await apiClient.post('/reset-password', {
        token,
        new_password: newPassword
    });
    return response.data;
};
