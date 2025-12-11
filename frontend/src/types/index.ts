// Fix: Imported React to use React.ReactNode type.
import React from 'react';

// Add this to avoid TS errors for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
    TradingView?: any;
  }
}

export type Timeframe =
  | '1s' | '5s' | '10s' | '15s' | '30s' | '45s'
  | '1m' | '3m' | '5m' | '15m' | '30m' | '45m'
  | '1h' | '2h' | '3h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  logo: React.ReactNode;
  amount: number;
  price: number;
  value: number;
  price24h: number;
  history: { time: string; value: number }[];
}

export interface ActiveBot {
  id: string;
  name: string;
  exchange?: string; // ✅ নতুন
  market: string;
  strategy: string;
  timeframe?: string; // ✅ নতুন
  tradeValue?: number; // ✅ নতুন
  trade_value?: number; // ✅ For backend compatibility
  tradeUnit?: string; // ✅ নতুন
  trade_unit?: string; // ✅ For backend compatibility
  apiKeyId?: string; // ✅ নতুন
  pnl: number;
  pnlPercent: number;
  status: 'active' | 'inactive' | 'paused';
  isRegimeAware?: boolean;
  regimeStrategies?: Partial<Record<MarketRegime, string>>;
  customModelId?: string;
  sentimentScore?: number;
  staticStopLoss?: number;
  config?: {
    strategyParams: Record<string, any>;
    riskParams?: any;
    deploymentTarget?: string;
    [key: string]: any;
  };
}

export interface BacktestMetrics {
  net_profit: number;
  net_profit_percent: number;
  total_closed_trades: number;
  percent_profitable: number;
  profit_factor: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  avg_trade: number;
  avg_trade_percent: number;
  sharpe_ratio: number;
}

export interface TradeAnalysisMetrics {
  total_closed: number;
  total_open: number;
  total_won: number;
  total_lost: number;
  win_rate: number;
  long_trades_total: number;
  long_trades_won: number;
  short_trades_total: number;
  short_trades_won: number;
  gross_profit: number;
  net_profit: number;
  avg_pnl: number;
  avg_win: number;
  avg_loss: number;
  ratio_avg_win_loss: number;
  largest_win_value: number;
  largest_loss_value: number;
  largest_win_percent: number;
  largest_loss_percent: number;
}

export interface BacktestResult {
  id?: string;
  market: string;
  strategy: string;
  timeframe?: string;
  date?: string;

  // বেসিক
  profit_percent: number;
  final_value?: number;
  total_trades?: number;
  initial_cash?: number;

  // অ্যাডভান্সড মেট্রিক্স অবজেক্ট
  advanced_metrics?: {
    sharpe: number;
    sortino: number;
    calmar: number;
    max_drawdown: number;
    volatility: number;
    win_rate: number;
    profit_factor: number;
    expectancy: number;
    cagr: number;
  };

  // New Metrics for TradingView Style Panel
  metrics?: BacktestMetrics;
  trade_analysis?: TradeAnalysisMetrics;
  equity_curve?: { time: number; value: number }[]; // ✅ Add this line

  // ভিজ্যুয়ালাইজেশন ডেটা
  heatmap_data?: { year: number; month: number; value: number }[];
  underwater_data?: { time: number; value: number }[];
  histogram_data?: { range: string; frequency: number }[];

  trades_log?: any[];
  candle_data?: any[];

  // লিগ্যাসি ফিল্ডস (Optional রাখুন যাতে আগের কোড না ভাঙ্গে)
  maxDrawdown?: number;
  winRate?: number;
  sharpeRatio?: number;
  profitPercent?: number;
  totalTrades?: number;
  finalValue?: number;
  params?: Record<string, number | string>;
}

export interface PricingTier {
  name: string;
  price: string;
  priceUnit: string;
  features: string[];
  cta: string;
  isFeatured: boolean;
}

export interface Candle {
  time: number; // timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  // Optional keys for custom indicators
  [key: string]: number | undefined;
}

export interface SentimentData {
  time: number;
  score: number; // -1 (negative) to 1 (positive)
}

export type SentimentLabel = 'Positive' | 'Negative' | 'Neutral';

export interface SentimentSource {
  id: string;
  source: 'Twitter' | 'Reddit' | 'News';
  content: string;
  sentiment: SentimentLabel;
  timestamp: string;
}

export interface InsiderFiling {
  id: string;
  ticker: string;
  insiderName: string;
  insiderRole: string;
  transactionType: 'Buy' | 'Sell';
  transactionDate: string;
  shares: number;
  sharePrice: number;
  totalValue: number;
}

export interface OnChainMetric {
  time: number;
  value: number;
}

// FIX: Added 'Ranging' to MarketRegime type.
export type MarketRegime = 'Bull Volatile' | 'Bull Stable' | 'Bear Volatile' | 'Bear Stable' | 'Ranging';

// New types for Token Unlock Calendar
export interface VestingPoint {
  date: string; // ISO date string
  unlockedPercentage: number;
}

export interface Allocation {
  name: string;
  value: number; // percentage
}

export interface TokenUnlockEvent {
  id: string;
  tokenName: string;
  tokenSymbol: string;
  logo: React.ReactNode;
  unlockDate: string; // ISO date string
  unlockAmount: number;
  unlockAmountUSD: number;
  unlockPercentageOfCirculating: number;
  impactScore: number; // 1-10
  description: string;
  vestingSchedule: VestingPoint[];
  allocation: Allocation[];
}

// FIX: Added missing type definitions from constants.tsx
export interface RegimeDataPoint {
  time: number;
  price: number;
  regime: MarketRegime;
}

export interface CointegratedPair {
  id: string;
  pair: [string, string];
  cointegrationScore: number;
  zScore: number;
  signal: 'Buy Pair' | 'Sell Pair' | 'Hold';
  spreadHistory: { time: number; value: number }[];
}

export interface ModelVersion {
  id: string;
  version: number;
  fileName: string;
  uploadDate: string;
  status: 'Ready' | 'Processing' | 'Error';
  description: string;
}
export interface CustomMLModel {
  id: string;
  name: string;
  modelType: 'LSTM' | 'Random Forest' | 'ARIMA' | 'Other';
  activeVersionId: string;
  versions: ModelVersion[];
}

export interface MarketplaceModelReview {
  id: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MarketplaceModel {
  id: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  asset: string;
  timeframe: string;
  performance: {
    winRate: number;
    avgReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    last12Months: { month: string, profit: number }[];
  };
  price: number;
  subscriptionType: 'Monthly' | 'One-Time';
  reviews: MarketplaceModelReview[];
  avgRating: number;
}

export interface FinancialStatementRow {
  metric: string;
  [year: string]: string | number;
}

export interface FinancialStatementData {
  income: FinancialStatementRow[];
  balance: FinancialStatementRow[];
  cashFlow: FinancialStatementRow[];
}

export interface EconomicEvent {
  id: string;
  time: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  actual: string;
  forecast: string;
  previous: string;
}

export interface NewsArticle {
  id: string;
  source: string;
  headline: string;
  timestamp: string;
  link: string;
}

export interface ScreenerResult {
  id: string;
  ticker: string;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  rsi: number;
  volume: number;
}

export interface SectorPerformance {
  name: string;
  performance: number;
}

export interface Watchlist {
  id: string;
  name: string;
  assets: string[];
}

export interface Alert {
  id: string;
  asset: string;
  condition: string;
  triggerType: 'Price' | 'RSI' | 'Volume Spike' | 'SMA Cross';
  status: 'Active' | 'Triggered';
  notificationChannels: ('Email' | 'Push' | 'SMS')[];
}

export interface AnalystRating {
  id: string;
  firm: string;
  rating: 'Overweight' | 'Buy' | 'Neutral' | 'Underweight';
  priceTarget: number | null;
  date: string;
}

export interface ResearchReport {
  id: string;
  source: string;
  title: string;
  summary: string;
  date: string;
  link: string;
}

export interface BlockTrade {
  id: string;
  ticker: string;
  time: string;
  size: number;
  price: number;
  value: number;
  exchange: string;
  condition: 'At Ask' | 'At Bid' | 'Between';
}

export interface DarkPoolPrint {
  id: string;
  ticker: string;
  time: string;
  totalVolume: number;
  totalValue: number;
  numberOfTrades: number;
}

export interface UnusualVolumeSpike {
  ticker: string;
  currentVolume: number;
  avgVolume: number;
  volumeRatio: number;
  lastPrice: number;
}

export interface UnusualOptionTrade {
  id: string;
  ticker: string;
  time: string;
  strike: number;
  expiry: string;
  type: 'Call' | 'Put';
  volume: number;
  openInterest: number;
  premium: number;
  tradeType: 'Sweep' | 'Block' | 'Split';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  details: 'At Ask' | 'Above Ask' | 'At Bid' | 'Below Bid' | 'Mid-Market';
}

export interface SavedIndicator {
  name: string;
  code: string;
  baseType: 'SMA' | 'RSI' | 'MACD' | 'BB';
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface StrategyTemplate {
  name: string;
  title: string;
  description: string;
  tags: string[];
  params?: Record<string, any>;
  strategy_type?: string;
}
export interface SampleJob {
  title: string;
  department: string;
}

export interface HoldingHistory {
  quarter: string;
  shares: number;
  action: 'Added' | 'Reduced' | 'Hold' | 'New' | 'Sold Out';
}

export interface Holding {
  ticker: string;
  company: string;
  shares: number;
  marketValue: number;
  portfolioPercentage: number;
  action: 'Added' | 'Reduced' | 'Hold' | 'New' | 'Sold Out';
  change: number;
  history: HoldingHistory[];
}

export interface Trade {
  id: string;
  time?: string;
  timestamp?: string;
  price: number;
  amount: number;
  type?: 'buy' | 'sell';
  side?: 'BUY' | 'SELL';
  symbol?: string;
  status?: 'FILLED' | 'PENDING' | 'CANCELLED';
  pnl?: number;
  confidence?: number;
  leverage?: number;
  marketSnapshot?: {
    volatilityIndex: number;
    atr: number;
    trend: number;
  };
}

export interface Exchange {
  id: string;
  name: string;
  logo: React.ReactNode;
  isConnected: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  category: 'Strategies' | 'Tutorials' | 'Market Analysis' | 'AI & ML';
  excerpt: string;
  imageUrl: string;
  isFeatured: boolean;
  author: string;
  date: string;
}

export interface StrategyOfTheWeek {
  id: string;
  title: string;
  description: string;
  aiPrompt: string;
  results: {
    profit: number;
    drawdown: number;
  };
  imageUrl: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  imageUrl: string;
  metrics: { label: string; value: string }[];
}

export interface ClientTestimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
}

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  category: 'Getting Started' | 'Technical Analysis' | 'Risk Management' | 'AI & ML' | 'DeFi (Decentralized Finance)' | 'On-Chain Analysis' | 'Trading Psychology' | 'Blockchain Fundamentals' | 'NFTs & Web3' | 'Security';
  type: 'Concept' | 'Article' | 'Video' | 'Course' | 'Book' | 'Social' | 'Podcast' | 'Tool';
  link?: string;
  source?: string;
}

export interface CmcArticle {
  id: string;
  title: string;
  description: string;
  link: string;
}

export interface CmcTrendingCoin {
  id: string;
  name: string;
  symbol: string;
  logo: React.ReactNode;
  price: number;
  change24h: number;
}

export interface CmcGlossaryTerm {
  term: string;
  definition: string;
}

export interface CmcLearnCampaign {
  id: string;
  title: string;
  project: string;
  logo: React.ReactNode;
  reward: string;
  link: string;
}
// FIX: Moved AppView enum here from App.tsx to resolve a circular dependency.
export enum AppView {
  DASHBOARD = 'Dashboard',
  PORTFOLIO = 'Portfolio Tracker',
  BACKTESTER = 'Backtesting Engine',
  BOT_LAB = 'Bot Lab',
  AI_FOUNDRY = 'AI Foundry',
  MARKET = 'Market',
  SENTIMENT_ENGINE = 'Market Sentiment',
  CORPORATE_FILINGS = 'Corporate Filings',
  INSTITUTIONAL_HOLDINGS = 'Institutional Holdings',
  BLOCK_TRADE_DETECTOR = 'Block Trade Detector',
  UNUSUAL_OPTIONS_ACTIVITY = 'Unusual Options Activity',
  ON_CHAIN_ANALYZER = 'On-Chain Analyzer',
  LIQUIDATION_MAP = 'Liquidation Map',
  MARKET_REGIME_CLASSIFIER = 'Market Regime Classifier',
  CORRELATION_MATRIX = 'Correlation Matrix',
  TOKEN_UNLOCK_CALENDAR = 'Token Unlocks',
  ALTERNATIVE_DATA = 'Alternative Data',
  CUSTOM_ML_MODELS = 'Custom ML Models',
  ML_MODEL_MARKETPLACE = 'ML Model Marketplace',
  REAL_TIME_DATA = 'Real-time & Fundamental Data Tools',
  QUANT_SCREENER = 'Quant Screener',
  ALERTS_WATCHLIST = 'Alerts & Watchlist',
  ANALYST_RESEARCH = 'Analyst Research',
  CUSTOM_INDICATOR_STUDIO = 'Indicator Studio',
  PINE_SCRIPT_STUDIO = 'Pine Script Studio',
  NURAL_CORE = 'Neural Architecture',
  EDUCATION_HUB = 'Education Hub',
  TASK_MANAGER = 'Task Manager',
  SETTINGS = 'Settings',

  // OmniTrade Views
  OMNI_DASHBOARD = 'Omni Dashboard',
  OMNI_NEXUS = 'Data Nexus (UDN)',
  OMNI_FEATURE_LAB = 'Feature Lab',
  OMNI_CHARTS = 'Pro Charts',
  OMNI_BRAIN = 'The Brain (AI)',
  OMNI_VERTEX = 'Vertex Forge',
  OMNI_BOTS = 'Bot Fleet',
  OMNI_EXECUTION = 'Execution Engine',

}

export interface AiAnalysisResult {
  decision: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  riskAssessment: string;
  shapValues?: { feature: string; impact: number }[];
}

export interface IndicatorData {
  price: number;
  rsi?: number;
  macd?: {
    histogram: number;
    signal: number;
    macd: number;
  };
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
  };
  [key: string]: any;
}

export interface TradingBot {
  id: string;
  name: string;
  strategy: string;
  pair: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED' | 'active' | 'inactive' | 'training';
  modelVersion?: string;
  pnl: number;
  winRate: number;
  allocation: number;
  uptime?: string;
  performance?: {
    pnl: number;
    winRate: number;
  };
}

