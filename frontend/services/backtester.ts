import apiClient from './client';

export interface BacktestRequest {
    symbol: string;
    timeframe: string;
    strategy: string;
    initial_cash: number;
    start_date?: string;
    end_date?: string;
    params: Record<string, any>;
    custom_data_file?: string | null;
    commission?: number;
    slippage?: number;
}

export interface OptimizationRequest {
    symbol: string;
    timeframe: string;
    strategy: string;
    initial_cash: number;
    start_date?: string;
    end_date?: string;
    params: Record<string, { start: number; end: number; step: number }>;
    method: 'grid' | 'genetic';
    population_size?: number;
    generations?: number;
    commission?: number;
    slippage?: number;
}

export interface BatchBacktestParams {
    strategies: string[];
    symbol: string;
    timeframe: string;
    initial_cash: number;
    start_date?: string;
    end_date?: string;
    commission?: number;
    slippage?: number;
}

export const runBacktestApi = async (payload: BacktestRequest) => {
    const response = await apiClient.post('/backtest/run', payload);
    return response.data;
};

export const runBatchBacktest = async (params: BatchBacktestParams) => {
    const response = await apiClient.post('/backtest/batch-run', params);
    return response.data;
};

export const runOptimizationApi = async (payload: OptimizationRequest) => {
    const response = await apiClient.post('/backtest/optimize', payload);
    return response.data;
};

export const getBacktestStatus = async (taskId: string) => {
    const response = await apiClient.get(`/backtest/status/${taskId}`);
    return response.data;
};

export const getTaskStatus = async (taskId: string) => {
    const response = await apiClient.get(`/backtest/status/${taskId}`);
    return response.data;
};

export const getExchangeList = async () => {
    const response = await apiClient.get('/exchanges');
    return response.data;
};

export const getExchangeMarkets = async (exchangeId: string) => {
    const response = await apiClient.get(`/markets/${exchangeId}`);
    return response.data;
};

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

export const uploadBacktestDataFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/backtest/upload-data', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const generateStrategy = async (prompt: string) => {
    const response = await apiClient.post('/strategies/generate', { prompt });
    return response.data;
};

export const fetchCustomStrategyList = async () => {
    const response = await apiClient.get('/strategies/list');
    return response.data;
};

export const fetchStrategyCode = async (strategyName: string) => {
    const response = await apiClient.get(`/strategies/source/${strategyName}`);
    return response.data;
};

export const revokeBacktestTask = async (taskId: string) => {
    const response = await apiClient.post(`/backtest/revoke/${taskId}`);
    return response.data;
};

export const downloadCandles = async (payload: { exchange: string; symbol: string; timeframe: string; start_date: string }) => {
    const response = await apiClient.post('/download/candles', payload);
    return response.data;
};

export const downloadTrades = async (payload: { exchange: string; symbol: string; start_date: string }) => {
    const response = await apiClient.post('/download/trades', payload);
    return response.data;
};

export const getDownloadStatus = async (taskId: string) => {
    const response = await apiClient.get(`/download/status/${taskId}`);
    return response.data;
};

export const syncMarketData = async (symbol: string, timeframe: string, start_date: string, end_date: string) => {
    const response = await apiClient.post('/market-data/sync', null, {
        params: { symbol, timeframe, start_date, end_date }
    });
    return response.data;
};

// ✅ নতুন ফাংশন: স্ট্যান্ডার্ড স্ট্র্যাটেজি প্যারামস ফেচ করা
export const fetchStandardStrategyParams = async () => {
    // ব্যাকএন্ড রুট: /api/strategies/standard-params
    const response = await apiClient.get('/strategies/standard-params');
    return response.data;
};