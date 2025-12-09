import client from "./client";

export const strategyService = {
    getStrategies: async (): Promise<string[]> => {
        try {
            const response = await client.get("/v1/strategies/list");
            return response.data;
        } catch (error) {
            console.error("Error fetching strategies:", error);
            throw error;
        }
    },
};
