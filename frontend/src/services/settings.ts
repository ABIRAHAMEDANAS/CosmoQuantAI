import apiClient from './client';

export interface ApiKeyPayload {
    exchange: string;
    api_key: string;
    secret_key: string;
}

// ✅ ফিক্স: পাথগুলো '/users' এবং '/v1' সহ আপডেট করা হয়েছে

export const fetchApiKeys = async () => {
    // আগে ছিল: '/api-keys' অথবা '/users/api-keys'
    // এখন হবে:
    const response = await apiClient.get('/v1/users/api-keys');
    return response.data;
};

export const saveApiKey = async (data: ApiKeyPayload) => {
    const response = await apiClient.post('/v1/users/api-keys', data);
    return response.data;
};
