import apiClient from './client';

export const marketDataService = {
    // ১. সব এক্সচেঞ্জের লিস্ট আনা
    getAllExchanges: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/v1/market-data/exchanges');
        return response.data;
    },

    // ২. নির্দিষ্ট এক্সচেঞ্জের সব পেয়ার আনা
    getExchangePairs: async (exchangeId: string): Promise<string[]> => {
        const response = await apiClient.get<string[]>(`/v1/market-data/pairs/${exchangeId}`);
        return response.data;
    }
};
