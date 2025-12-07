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

// --- API Calls Updated with '/v1' prefix and correct router paths ---

export const runBacktestApi = async (payload: BacktestRequest) => {
    // আগে ছিল: '/backtest/run' -> এখন: '/v1/backtest/run'
    const response = await apiClient.post('/v1/backtest/run', payload);
    return response.data;
};

export const runBatchBacktest = async (params: BatchBacktestParams) => {
    // আগে ছিল: '/backtest/batch-run' -> এখন: '/v1/backtest/batch-run'
    const response = await apiClient.post('/v1/backtest/batch-run', params);
    return response.data;
};

export const runOptimizationApi = async (payload: OptimizationRequest) => {
    // আগে ছিল: '/backtest/optimize' -> এখন: '/v1/backtest/optimize'
    const response = await apiClient.post('/v1/backtest/optimize', payload);
    return response.data;
};

export const getBacktestStatus = async (taskId: string) => {
    // আগে ছিল: `/backtest/status/${taskId}` -> এখন: `/v1/backtest/status/${taskId}`
    const response = await apiClient.get(`/v1/backtest/status/${taskId}`);
    return response.data;
};

export const getTaskStatus = async (taskId: string) => {
    // এটি getBacktestStatus এর মতোই
    const response = await apiClient.get(`/v1/backtest/status/${taskId}`);
    return response.data;
};

export const getExchangeList = async () => {
    // আগে ছিল: '/exchanges' -> এখন: '/v1/market-data/exchanges'
    const response = await apiClient.get('/v1/market-data/exchanges');
    return response.data;
};

export const getExchangeMarkets = async (exchangeId: string) => {
    // আগে ছিল: `/markets/${exchangeId}` -> এখন: `/v1/market-data/markets/${exchangeId}`
    const response = await apiClient.get(`/v1/market-data/markets/${exchangeId}`);
    return response.data;
};

export const uploadStrategyFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // আগে ছিল: '/strategies/upload' -> এখন: '/v1/strategies/upload'
    const response = await apiClient.post('/v1/strategies/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const uploadBacktestDataFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    // আগে ছিল: '/backtest/upload-data' (যা ভুল ছিল)
    // এখন: '/v1/market-data/upload' (কারণ market_data.py তে upload হ্যান্ডলার আছে)
    const response = await apiClient.post('/v1/market-data/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const generateStrategy = async (prompt: string) => {
    // আগে ছিল: '/strategies/generate' -> এখন: '/v1/strategies/generate'
    const response = await apiClient.post('/v1/strategies/generate', { prompt });
    return response.data;
};

export const fetchCustomStrategyList = async () => {
    // আগে ছিল: '/strategies/list' -> এখন: '/v1/strategies/list'
    const response = await apiClient.get('/v1/strategies/list');
    return response.data;
};

export const fetchStrategyCode = async (strategyName: string) => {
    // আগে ছিল: `/strategies/source/${strategyName}` -> এখন: `/v1/strategies/source/${strategyName}`
    const response = await apiClient.get(`/v1/strategies/source/${strategyName}`);
    return response.data;
};

export const revokeBacktestTask = async (taskId: string) => {
    // আগে ছিল: `/backtest/revoke/${taskId}` -> এখন: `/v1/backtest/revoke/${taskId}`
    const response = await apiClient.post(`/v1/backtest/revoke/${taskId}`);
    return response.data;
};

export const downloadCandles = async (payload: { exchange: string; symbol: string; timeframe: string; start_date: string }) => {
    // আগে ছিল: '/download/candles' -> এখন: '/v1/backtest/download/candles'
    const response = await apiClient.post('/v1/backtest/download/candles', payload);
    return response.data;
};

export const downloadTrades = async (payload: { exchange: string; symbol: string; start_date: string }) => {
    // আগে ছিল: '/download/trades' -> এখন: '/v1/backtest/download/trades'
    const response = await apiClient.post('/v1/backtest/download/trades', payload);
    return response.data;
};

export const getDownloadStatus = async (taskId: string) => {
    // আগে ছিল: `/download/status/${taskId}` -> এখন: `/v1/backtest/download/status/${taskId}`
    const response = await apiClient.get(`/v1/backtest/download/status/${taskId}`);
    return response.data;
};

export const syncMarketData = async (symbol: string, timeframe: string, start_date: string, end_date: string) => {
    // আগে ছিল: '/market-data/sync' -> এখন: '/v1/market-data/sync'
    const response = await apiClient.post('/v1/market-data/sync', null, {
        params: { symbol, timeframe, start_date, end_date }
    });
    return response.data;
};

export const fetchStandardStrategyParams = async () => {
    // আগে ছিল: '/strategies/standard-params' -> এখন: '/v1/strategies/standard-params'
    const response = await apiClient.get('/v1/strategies/standard-params');
    return response.data;
};

// **নতুন ফাংশন** (আপনার লগের 404 এরর ফিক্স করার জন্য)
// ব্যাকএন্ডে এটি `backtest.py` তে `/trade-files` হিসেবে আছে
export const fetchTradeFiles = async () => {
    const response = await apiClient.get('/v1/backtest/trade-files');
    return response.data;
};
