import apiClient from './client';

// ইউজারের সেভ করা API Key গুলো নিয়ে আসা
export const fetchApiKeys = async () => {
    const response = await apiClient.get('/api-keys');
    return response.data;
};

// নতুন API Key সেভ করা
export const saveApiKey = async (data: { exchange: string; api_key: string; secret_key: string }) => {
    const response = await apiClient.post('/api-keys', data);
    return response.data;
};