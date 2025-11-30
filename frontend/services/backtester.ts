import apiClient from './client';

interface BacktestRequest {
    symbol: string;
    timeframe: string;
    strategy: string;
    initial_cash: number;
    start_date?: string;
    end_date?: string;
    params: Record<string, any>;
    custom_data_file?: string | null; // ✅ এই লাইনটি থাকতে হবে
}

export interface OptimizationRequest {
    symbol: string;
    timeframe: string;
    strategy: string;
    initial_cash: number;
    start_date?: string;
    end_date?: string;
    params: Record<string, { start: number; end: number; step: number }>;
    // 👇 নতুন ফিল্ডগুলো যোগ করা হয়েছে
    method: 'grid' | 'genetic';
    population_size?: number;
    generations?: number;
}

// সিঙ্ক ফাংশন আপডেট: start_date প্যারামিটার যোগ
export const syncMarketData = async (symbol: string, timeframe: string, startDate?: string, endDate?: string) => {
    // ডিফল্ট URL
    let url = `/market-data/sync?symbol=${symbol}&timeframe=${timeframe}`;

    // প্যারামিটার যোগ
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;

    const response = await apiClient.post(url);
    return response.data;
};

// ✅ নতুন: সরাসরি API কল করার জন্য এই ফাংশনটি ব্যবহার করা হবে
export const runBacktestApi = async (payload: BacktestRequest) => {
    const response = await apiClient.post('/backtest/run', payload);
    return response.data;
};

// ✅ নতুন: অপটিমাইজেশন রান করার ফাংশন
export const runOptimizationApi = async (payload: OptimizationRequest) => {
    const response = await apiClient.post('/backtest/optimize', payload);
    return response.data; // রিটার্ন করবে: { task_id: "...", status: "Processing" }
};

// ২. নতুন: টাস্ক স্ট্যাটাস চেক করার ফাংশন
export const getBacktestStatus = async (taskId: string) => {
    const response = await apiClient.get(`/backtest/status/${taskId}`);
    return response.data; // { status: "Processing" | "Completed" | "Failed", result: ... }
};

// ৩. এক্সচেঞ্জ লিস্ট পাওয়ার জন্য
export const getExchangeList = async () => {
    const response = await apiClient.get('/exchanges');
    return response.data;
};

// ৪. নির্দিষ্ট এক্সচেঞ্জের মার্কেট/সিম্বল পাওয়ার জন্য
export const getExchangeMarkets = async (exchangeId: string) => {
    const response = await apiClient.get(`/markets/${exchangeId}`);
    return response.data;
};

// ৫. নতুন স্ট্র্যাটেজি আপলোড করার জন্য
export const uploadStrategyFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/strategies/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// ✅ নতুন: ডাটা ফাইল আপলোডের ফাংশন
export const uploadBacktestDataFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/backtest/upload-data', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data; // { filename: "btc_1m.csv", ... }
};

// ৬. AI দিয়ে স্ট্র্যাটেজি জেনারেট করার জন্য
export const generateStrategy = async (prompt: string) => {
    const response = await apiClient.post('/strategies/generate', { prompt });
    return response.data;
};

// ৭. কাস্টম স্ট্র্যাটেজি লিস্ট আনার জন্য
export const fetchCustomStrategyList = async () => {
    const response = await apiClient.get('/strategies/list');
    return response.data; // returns array of strings ['AI_Strat_1', 'My_Strat']
};

// ৮. নির্দিষ্ট স্ট্র্যাটেজির কোড আনার জন্য
export const fetchStrategyCode = async (strategyName: string) => {
    const response = await apiClient.get(`/strategies/source/${strategyName}`);
    return response.data; // returns { code: "..." }
};

// ✅ নতুন: টাস্ক স্টপ করার ফাংশন
export const revokeBacktestTask = async (taskId: string) => {
    const response = await apiClient.post(`/backtest/revoke/${taskId}`);
    return response.data;
};