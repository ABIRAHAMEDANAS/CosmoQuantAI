export interface IndicatorData {
    rsi: number;
    macis: {
        macd: number;
        signal: number;
        histogram: number;
    };
    bollinger: {
        upper: number;
        middle: number;
        lower: number;
    };
    price: number;
    volume: number;
    change: number;
}

export interface AiAnalysisResult {
    decision: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
    riskAssessment: string;
    shapValues?: { feature: string; impact: number }[];
}

export interface TradingBot {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'stopped';
    pnl: number;
    winRate: number;
    uptime: string;
    strategy: string;
    modelVersion: string;
}

export interface BacktestResult {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    trades: number;
    equityCurve: { time: string; value: number }[];
}
