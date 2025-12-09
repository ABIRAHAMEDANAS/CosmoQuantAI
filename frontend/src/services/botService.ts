import apiClient from './client'; // আপনার client.ts এর এক্সপোর্ট নাম (default export হলে apiClient)
import { ActiveBot } from '@/types';

export const botService = {
    // ✅ ফিক্স: '/bots/' এর বদলে '/v1/bots/' ব্যবহার করা হয়েছে
    getAllBots: async (): Promise<ActiveBot[]> => {
        const response = await apiClient.get('/v1/bots/');
        return response.data;
    },

    createBot: async (botData: any): Promise<ActiveBot> => {
        const response = await apiClient.post('/v1/bots/', botData);
        return response.data;
    },

    controlBot: async (botId: string | number, action: 'start' | 'stop' | 'pause'): Promise<ActiveBot> => {
        const response = await apiClient.post(`/v1/bots/${botId}/action`, null, {
            params: { action }
        });
        return response.data;
    },

    deleteBot: async (botId: string | number): Promise<void> => {
        await apiClient.delete(`/v1/bots/${botId}`);
    }
};
