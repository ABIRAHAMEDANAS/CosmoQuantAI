import React, { useState, useEffect, useRef } from 'react';
import { Clock, TrendingDown, CheckCircle, Layers, AlertOctagon, Activity, TrendingUp, ArrowRightLeft, Crosshair, BookOpen, Zap, StopCircle, PlayCircle, Globe, Shield, Brain, Calculator, Flame, Info, FileText, Download, ArrowUpDown, ArrowUp, ArrowDown, Microscope, ChevronUp, ChevronDown, RefreshCcw, Lock } from 'lucide-react';
import { Trade } from '@/types';

export const ExecutionEngine = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ key: keyof Trade | 'pnl', direction: 'asc' | 'desc' } | null>(null);

    // Manual Entry State
    const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP'>('LIMIT');
    const [manualPrice, setManualPrice] = useState(64250.00);
    const [manualAmount, setManualAmount] = useState(0.1);

    // New: Strategy Profile State
    const [executionStrategy, setExecutionStrategy] = useState<'STANDARD' | 'SCALPER_AI' | 'WHALE_GPT'>('STANDARD');

    // Advanced Risk Configuration
    const [riskConfig, setRiskConfig] = useState({
        stopLossBase: 2.5, // %
        takeProfitBase: 5.0, // %
        maxDrawdown: 10.0,
        leverage: 20,
        dynamicMode: 'ATR', // 'FIXED', 'VOLATILITY', 'ATR'
        atrMultiplier: 2.0, // Stop loss at 2x ATR
        trailingStop: false,
        trailingCallback: 1.5, // %
        slippageTolerance: 0.5, // %
        volatilityDampener: true,
        autoBreakeven: false,
        autoBreakevenTrigger: 1.0, // % profit to trigger BE
        portfolioHeatLimit: 50, // Max % of equity at risk
    });

    // Position Sizing Configuration
    const [positionConfig, setPositionConfig] = useState({
        baseSize: 1000,
        maxSize: 50000,
        model: 'AI_CONFIDENCE',
        aiTrustFactor: 1.0, // Multiplier
        aggressiveness: 3.0, // Exponent (Scaling Curve)
    });

    // Simulated Market Data
    const [marketMetrics, setMarketMetrics] = useState({
        volatilityIndex: 1.0,
        atr: 145.50,
        currentPrice: 64230.50,
        trend: 0,
        latency: 45, // ms
        slippage: 0.02, // %
    });

    // Simulated Order Book State
    const [orderBook, setOrderBook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });

    const [trades, setTrades] = useState<Trade[]>([
        {
            id: 'T-10023',
            symbol: 'BTC/USDT',
            side: 'BUY',
            amount: 0.5,
            price: 64230.50,
            timestamp: '10:42:05',
            status: 'FILLED',
            pnl: 120.50,
            confidence: 85,
            leverage: 20,
            marketSnapshot: { volatilityIndex: 1.1, atr: 150.2, trend: 0.4 }
        },
        {
            id: 'T-10024',
            symbol: 'ETH/USDT',
            side: 'SELL',
            amount: 4.2,
            price: 3450.20,
            timestamp: '10:45:12',
            status: 'FILLED',
            pnl: -45.20,
            confidence: 62,
            leverage: 20,
            marketSnapshot: { volatilityIndex: 0.9, atr: 45.1, trend: -0.2 }
        },
    ]);

    const priceRef = useRef(marketMetrics.currentPrice);
    const trendRef = useRef(0);

    // Simulation loop for volatility, ATR, PRICE TREND, and Order Book
    useEffect(() => {
        const interval = setInterval(() => {
            setMarketMetrics(prev => {
                const volatilityChange = (Math.random() - 0.5) * 0.1;
                const newVol = Math.max(0.8, Math.min(2.5, prev.volatilityIndex + volatilityChange));

                const trendShift = (Math.random() - 0.5) * 0.2;
                const newTrend = Math.max(-1, Math.min(1, prev.trend + trendShift));
                trendRef.current = newTrend;

                const noise = (Math.random() - 0.5) * 100 * newVol;
                const drift = newTrend * 50;
                const newPrice = prev.currentPrice + drift + noise;
                priceRef.current = newPrice;

                const newAtr = 145.50 * newVol + (Math.random() - 0.5) * 10;

                return {
                    ...prev,
                    volatilityIndex: newVol,
                    atr: newAtr,
                    trend: newTrend,
                    currentPrice: newPrice,
                    latency: 40 + Math.random() * 20,
                    slippage: 0.01 + Math.random() * 0.03
                };
            });

            // Update Order Book
            const current = priceRef.current;
            const generateDepth = (basePrice: number, type: 'bid' | 'ask') => {
                return Array.from({ length: 5 }, (_, i) => ({
                    price: type === 'ask' ? basePrice + (i + 1) * 5 + Math.random() * 2 : basePrice - (i + 1) * 5 - Math.random() * 2,
                    amount: (Math.random() * 2).toFixed(4),
                    total: (Math.random() * 5).toFixed(4)
                }));
            };
            setOrderBook({
                asks: generateDepth(current, 'ask').reverse(),
                bids: generateDepth(current, 'bid')
            });

        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const calculatePositionSize = (confidence: number) => {
        if (positionConfig.model === 'FIXED') return positionConfig.baseSize;

        // Strategy Logic Modifiers
        let strategyMultiplier = 1.0;
        // Use user-defined aggressiveness for the curve power
        let scalingCurve = positionConfig.aggressiveness;
        let threshold = 60;

        if (executionStrategy === 'SCALPER_AI') {
            scalingCurve += 1; // Make it steeper
            strategyMultiplier = 1.5;
            threshold = 65;
        } else if (executionStrategy === 'WHALE_GPT') {
            scalingCurve = Math.max(1.5, scalingCurve - 1); // Make it smoother
            strategyMultiplier = 3.0;
            threshold = 50;
        }

        if (positionConfig.model === 'AI_CONFIDENCE') {
            const t = Math.max(0, (confidence - threshold) / (100 - threshold));
            let curve = Math.pow(t, scalingCurve);

            // Apply AI Trust Factor (Aggressiveness)
            let size = Math.floor(positionConfig.baseSize + (positionConfig.maxSize - positionConfig.baseSize) * curve);
            size = size * positionConfig.aiTrustFactor * strategyMultiplier;

            // Apply Volatility Dampener
            if (riskConfig.volatilityDampener && marketMetrics.volatilityIndex > 1.5) {
                const dampener = 1 / marketMetrics.volatilityIndex;
                size = size * dampener;
            }

            return Math.min(positionConfig.maxSize * strategyMultiplier, size);
        }
        return positionConfig.baseSize;
    };

    // Trade Execution Simulation
    useEffect(() => {
        if (!isRunning) return;

        const tradeInterval = setInterval(() => {
            if (Math.random() < 0.3) {
                const confidence = 60 + Math.floor(Math.random() * 38);
                const currentTrend = trendRef.current;
                let side: 'BUY' | 'SELL';
                const correctSide = currentTrend > 0 ? 'BUY' : 'SELL';
                const isSmartMove = Math.random() < (confidence / 100);

                if (isSmartMove) side = correctSide;
                else side = correctSide === 'BUY' ? 'SELL' : 'BUY';

                const baseMargin = calculatePositionSize(confidence);
                const effectiveNotional = baseMargin * riskConfig.leverage;
                const price = priceRef.current;
                const amount = effectiveNotional / price;

                const newTrade: Trade = {
                    id: `T-${Math.floor(10000 + Math.random() * 90000)}`,
                    symbol: 'BTC/USDT',
                    side: side,
                    amount: parseFloat(amount.toFixed(4)),
                    price: parseFloat(price.toFixed(2)),
                    timestamp: new Date().toLocaleTimeString(),
                    status: 'FILLED',
                    pnl: 0,
                    confidence: confidence,
                    leverage: riskConfig.leverage,
                    marketSnapshot: {
                        volatilityIndex: marketMetrics.volatilityIndex,
                        atr: marketMetrics.atr,
                        trend: trendRef.current
                    }
                };

                setTrades(prev => [newTrade, ...prev].slice(0, 15));
            }
        }, 3000);

        return () => clearInterval(tradeInterval);
    }, [isRunning, riskConfig.leverage, positionConfig, executionStrategy, riskConfig.volatilityDampener]);

    // Real-time PnL Updates
    useEffect(() => {
        setTrades(prev => prev.map(trade => {
            if (trade.status !== 'FILLED') return trade;
            const priceDiff = marketMetrics.currentPrice - trade.price;
            const direction = trade.side === 'BUY' ? 1 : -1;
            const pnl = priceDiff * trade.amount * direction;
            return { ...trade, pnl: parseFloat(pnl.toFixed(2)) };
        }));
    }, [marketMetrics.currentPrice]);

    // SORTING LOGIC
    const handleSort = (key: keyof Trade | 'pnl') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTrades = [...trades].sort((a, b) => {
        if (!sortConfig) return 0;
        const aValue = a[sortConfig.key] ?? 0;
        const bValue = b[sortConfig.key] ?? 0;

        // Handle MarketSnapshot separately if needed, but for top-level keys:
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleExportCSV = () => {
        const headers = ['Order ID', 'Time', 'Symbol', 'Side', 'Confidence', 'Price', 'Amount', 'Status', 'PnL'];
        const rows = sortedTrades.map(t => [
            t.id,
            t.timestamp,
            t.symbol,
            t.side,
            `${t.confidence}%`,
            t.price.toFixed(2),
            t.amount,
            t.status,
            t.pnl ? t.pnl.toFixed(2) : '0.00'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `omnitrade_blotter_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const calculateDynamicStops = () => {
        let sl = riskConfig.stopLossBase;
        let tp = riskConfig.takeProfitBase;

        // Strategy Modifiers for Stops
        if (executionStrategy === 'SCALPER_AI') {
            sl = sl * 0.6; // Tighter stops
            tp = tp * 0.8; // Quicker takes
        } else if (executionStrategy === 'WHALE_GPT') {
            sl = sl * 1.5; // Wider stops
            tp = tp * 2.0; // Trend following targets
        }

        if (riskConfig.dynamicMode === 'VOLATILITY') {
            sl *= marketMetrics.volatilityIndex;
            tp *= marketMetrics.volatilityIndex;
        } else if (riskConfig.dynamicMode === 'ATR') {
            const slDistance = marketMetrics.atr * riskConfig.atrMultiplier;
            const tpDistance = slDistance * 2;
            sl = (slDistance / marketMetrics.currentPrice) * 100;
            tp = (tpDistance / marketMetrics.currentPrice) * 100;
        }
        return { sl: sl.toFixed(2), tp: tp.toFixed(2) };
    };

    const { sl: effectiveSL, tp: effectiveTP } = calculateDynamicStops();
    const slPercentage = parseFloat(effectiveSL);

    // Liquidation Logic
    // Liquidation happens when loss ~= Margin. Margin = 1/Leverage.
    const liquidationDistancePercent = (100 / riskConfig.leverage);
    // Approx Liquidation Price for Longs: Entry * (1 - 1/Lev)
    const liquidationPrice = marketMetrics.currentPrice * (1 - (liquidationDistancePercent / 100));

    // Proximity Check
    const marginHealth = (liquidationDistancePercent - slPercentage) / liquidationDistancePercent; // crude check
    const isApproachingLiquidation = liquidationDistancePercent < 2.0; // Less than 2% move kills you

    // Visual Alarm States
    const isHighRisk = riskConfig.leverage > 50;
    const isCriticalRisk = riskConfig.leverage > 100 || isApproachingLiquidation;
    const isFlashingRed = liquidationDistancePercent < 1.0; // Less than 1% room

    const toggleExpand = (tradeId: string) => {
        setExpandedTradeId(expandedTradeId === tradeId ? null : tradeId);
    };

    // Manual Trade Handler
    const handleManualTrade = (side: 'BUY' | 'SELL') => {
        const confidence = 100; // Manual = 100% human confidence
        const baseMargin = calculatePositionSize(confidence);
        const effectiveNotional = baseMargin * riskConfig.leverage;
        const price = orderType === 'MARKET' ? marketMetrics.currentPrice : manualPrice;
        const amount = manualAmount > 0 ? manualAmount : (effectiveNotional / price);

        const newTrade: Trade = {
            id: `M-${Math.floor(1000 + Math.random() * 9000)}`,
            symbol: 'BTC/USDT',
            side: side,
            amount: parseFloat(amount.toFixed(4)),
            price: price,
            timestamp: new Date().toLocaleTimeString(),
            status: 'FILLED',
            pnl: 0,
            confidence: confidence,
            leverage: riskConfig.leverage,
            marketSnapshot: {
                volatilityIndex: marketMetrics.volatilityIndex,
                atr: marketMetrics.atr,
                trend: marketMetrics.trend
            }
        };
        setTrades(prev => [newTrade, ...prev]);
    };

    // Calculated Stats for Kelly
    const winRate = 0.65; // Simulated
    const profitRatio = 2.0; // Simulated R:R
    const kellyFraction = winRate - ((1 - winRate) / profitRatio);

    const SortIcon = ({ colKey }: { colKey: keyof Trade | 'pnl' }) => {
        if (sortConfig?.key !== colKey) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-omni-accent" /> : <ArrowDown size={12} className="text-omni-accent" />;
    };

    // Determine Market Regime Label
    const getMarketRegime = () => {
        if (marketMetrics.volatilityIndex > 1.8) return { label: 'EXTREME VOLATILITY', color: 'text-omni-danger', bg: 'bg-omni-danger/10', icon: AlertOctagon };
        if (marketMetrics.volatilityIndex < 0.9 && Math.abs(marketMetrics.trend) < 0.2) return { label: 'LOW VOLATILITY', color: 'text-slate-400', bg: 'bg-slate-800', icon: Activity };
        if (marketMetrics.trend > 0.6) return { label: 'STRONG UPTREND', color: 'text-omni-success', bg: 'bg-omni-success/10', icon: TrendingUp };
        if (marketMetrics.trend < -0.6) return { label: 'STRONG DOWNTREND', color: 'text-omni-danger', bg: 'bg-omni-danger/10', icon: TrendingDown };
        return { label: 'SIDEWAYS / CHOP', color: 'text-omni-warning', bg: 'bg-omni-warning/10', icon: ArrowRightLeft };
    };

    const regime = getMarketRegime();

    return (
        <div className="space-y-6">

            {/* Execution Quality Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-omni-panel border border-slate-700 rounded-xl p-4">
                <div className="flex items-center gap-3 border-r border-slate-700/50">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400"><Clock size={16} /></div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase">Fill Latency</div>
                        <div className="text-lg font-mono font-bold text-white">{marketMetrics.latency.toFixed(1)}ms</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-700/50">
                    <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400"><TrendingDown size={16} /></div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase">Avg Slippage</div>
                        <div className="text-lg font-mono font-bold text-white">{marketMetrics.slippage.toFixed(3)}%</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-700/50">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><CheckCircle size={16} /></div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase">Fill Rate</div>
                        <div className="text-lg font-mono font-bold text-white">99.98%</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 border-r border-slate-700/50">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Layers size={16} /></div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase">Smart Routes</div>
                        <div className="text-lg font-mono font-bold text-white">3 Active</div>
                    </div>
                </div>

                {/* Market Regime Indicator */}
                <div className={`flex items-center gap-3 rounded-lg p-2 ${regime.bg} border border-white/5`}>
                    <div className={`p-1.5 rounded bg-black/20 ${regime.color}`}>
                        <regime.icon size={16} />
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Market Regime</div>
                        <div className={`text-xs font-bold ${regime.color}`}>{regime.label}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* --- LEFT COL: DIRECT MARKET ACCESS (MANUAL) & ORDER BOOK --- */}
                <div className="lg:col-span-4 bg-omni-panel border border-slate-700 rounded-xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Crosshair size={20} className="text-blue-400" /> Direct Market Access
                        </h3>
                    </div>

                    <div className="p-6 space-y-6 flex-1">
                        {/* Controls */}
                        <div className="flex bg-slate-800 p-1 rounded-lg">
                            {['LIMIT', 'MARKET', 'STOP'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setOrderType(type as any)}
                                    className={`flex-1 py-2 text-xs font-bold rounded transition-all ${orderType === type ? 'bg-blue-500 text-white shadow' : 'text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div className={`transition-all duration-300 ${orderType === 'MARKET' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                <label className="text-xs text-slate-400 block mb-1">Limit Price (USDT)</label>
                                <input
                                    type="number"
                                    value={manualPrice}
                                    onChange={(e) => setManualPrice(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 block mb-1">Amount (BTC)</label>
                                <input
                                    type="number"
                                    value={manualAmount}
                                    onChange={(e) => setManualAmount(Number(e.target.value))}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white font-mono text-sm focus:border-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleManualTrade('BUY')}
                                className="py-3 bg-omni-success hover:bg-green-600 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 active:scale-95 transition-all"
                            >
                                BUY / LONG
                            </button>
                            <button
                                onClick={() => handleManualTrade('SELL')}
                                className="py-3 bg-omni-danger hover:bg-red-600 text-white font-bold rounded-lg shadow-lg shadow-red-900/20 active:scale-95 transition-all"
                            >
                                SELL / SHORT
                            </button>
                        </div>

                        {/* LIVE ORDER BOOK (L2) */}
                        <div className="mt-4 pt-4 border-t border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><BookOpen size={12} /> Live Book (L2)</span>
                                <span className="text-[10px] text-slate-500 font-mono">Spread: 0.05%</span>
                            </div>
                            <div className="bg-black/30 rounded-lg p-2 font-mono text-[10px]">
                                {/* Asks */}
                                <div className="space-y-0.5 mb-1">
                                    {orderBook.asks.map((ask, i) => (
                                        <div key={i} className="flex justify-between text-red-400/80 hover:bg-red-900/20 px-1 rounded">
                                            <span>{ask.price.toFixed(2)}</span>
                                            <span>{ask.amount}</span>
                                        </div>
                                    ))}
                                </div>
                                {/* Spread */}
                                <div className="text-center text-slate-500 py-1 border-y border-slate-800 my-1">
                                    {marketMetrics.currentPrice.toFixed(2)}
                                </div>
                                {/* Bids */}
                                <div className="space-y-0.5">
                                    {orderBook.bids.map((bid, i) => (
                                        <div key={i} className="flex justify-between text-green-400/80 hover:bg-green-900/20 px-1 rounded">
                                            <span>{bid.price.toFixed(2)}</span>
                                            <span>{bid.amount}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MIDDLE COL: ALGO ENGINE & ROUTER --- */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 flex flex-col justify-between shadow-lg h-full relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                <Zap size={20} className="text-amber-500" /> Algorithmic Engine
                            </h3>

                            <button
                                onClick={() => setIsRunning(!isRunning)}
                                className={`w-full py-6 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl transform active:scale-95 border border-white/10 ${isRunning
                                    ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-red-900/20'
                                    : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-900/20'
                                    }`}
                            >
                                {isRunning ? <><StopCircle size={24} /> HALT SYSTEM</> : <><PlayCircle size={24} /> ENGAGE AUTO</>}
                            </button>
                        </div>

                        {/* Smart Order Router Visualization */}
                        <div className="mt-6 pt-6 border-t border-slate-700 relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                    <Globe size={14} /> Smart Order Router
                                </div>
                                <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">OPTIMIZED</span>
                            </div>

                            <div className="space-y-3">
                                {/* Binance Route */}
                                <div className="relative">
                                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                                        <span>Binance Liquidity</span>
                                        <span className="font-mono">45%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-yellow-500 rounded-full transition-all duration-1000 ${isRunning ? 'w-[45%] animate-pulse' : 'w-0'}`}></div>
                                    </div>
                                </div>

                                {/* Coinbase Route */}
                                <div className="relative">
                                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                                        <span>Coinbase Prime</span>
                                        <span className="font-mono">30%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-blue-500 rounded-full transition-all duration-1000 ${isRunning ? 'w-[30%] animate-pulse' : 'w-0'}`}></div>
                                    </div>
                                </div>

                                {/* Kraken Route */}
                                <div className="relative">
                                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                                        <span>Kraken Dark Pool</span>
                                        <span className="font-mono">25%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full bg-purple-500 rounded-full transition-all duration-1000 ${isRunning ? 'w-[25%] animate-pulse' : 'w-0'}`}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COL: RISK MANAGEMENT & SIZING --- */}
                <div className="lg:col-span-4 bg-omni-panel border border-slate-700 rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield size={20} className="text-omni-accent" /> Dynamic Risk & Sizing
                    </h3>

                    {/* Strategy Profile Selector */}
                    <div className="mb-4">
                        <label className="text-xs text-slate-400 font-bold uppercase mb-2 block">Execution Strategy Profile</label>
                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-lg border border-slate-700">
                            {[
                                { id: 'STANDARD', label: 'Std PPO', icon: Brain },
                                { id: 'SCALPER_AI', label: 'Scalper', icon: Zap },
                                { id: 'WHALE_GPT', label: 'Whale', icon: Layers }
                            ].map((strat) => (
                                <button
                                    key={strat.id}
                                    onClick={() => setExecutionStrategy(strat.id as any)}
                                    className={`flex flex-col items-center justify-center py-2 rounded transition-all ${executionStrategy === strat.id
                                        ? 'bg-indigo-500 text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                        }`}
                                >
                                    <strat.icon size={14} className="mb-1" />
                                    <span className="text-[10px] font-bold">{strat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Risk Mode Selector */}
                    <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 mb-4">
                        {['FIXED', 'VOLATILITY', 'ATR'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setRiskConfig({ ...riskConfig, dynamicMode: mode })}
                                className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${riskConfig.dynamicMode === mode
                                    ? 'bg-omni-accent text-omni-bg shadow-sm'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 flex-1">
                        {/* ATR Manual Tuning */}
                        {riskConfig.dynamicMode === 'ATR' && (
                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 animate-in fade-in slide-in-from-top-1">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-omni-accent" />
                                        <span className="text-xs text-slate-300 font-bold">ATR Multiplier</span>
                                    </div>
                                    <span className="text-xs font-mono text-omni-accent bg-omni-accent/10 px-1.5 py-0.5 rounded">
                                        {riskConfig.atrMultiplier.toFixed(1)}x
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="1.0" max="5.0" step="0.1"
                                    value={riskConfig.atrMultiplier}
                                    onChange={(e) => setRiskConfig({ ...riskConfig, atrMultiplier: Number(e.target.value) })}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-omni-accent"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <RiskCard
                                label="Effective SL"
                                base={riskConfig.stopLossBase}
                                effective={effectiveSL}
                                isDynamic={riskConfig.dynamicMode !== 'FIXED'}
                                unit="%"
                                color="text-omni-danger"
                                icon={<ArrowRightLeft size={14} />}
                            />
                            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-1">
                                    <label className="text-xs text-slate-400">Kelly Size</label>
                                    <div className="text-slate-600"><Calculator size={14} /></div>
                                </div>
                                <div className="text-xl font-mono font-bold text-blue-400">
                                    {(kellyFraction * 100).toFixed(1)}%
                                </div>
                                <div className="mt-1 text-[10px] text-slate-500 flex justify-between">
                                    <span>Win: {(winRate * 100).toFixed(0)}%</span>
                                    <span>R:R: {profitRatio}</span>
                                </div>
                            </div>
                        </div>

                        {/* AI Position Sizing Tuner */}
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 space-y-3">
                            {/* Trust Factor */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <Brain size={14} className="text-purple-400" />
                                        <span className="text-xs text-slate-300 font-bold">AI Trust (Base)</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-purple-400">{positionConfig.aiTrustFactor.toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range" min="0.5" max="2.0" step="0.1"
                                    value={positionConfig.aiTrustFactor}
                                    onChange={(e) => setPositionConfig({ ...positionConfig, aiTrustFactor: Number(e.target.value) })}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                />
                            </div>
                            {/* Aggressiveness (Exponent) */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-pink-400" />
                                        <span className="text-xs text-slate-300 font-bold">Scaling Aggression</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-pink-400">^{positionConfig.aggressiveness.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="1.0" max="6.0" step="0.5"
                                    value={positionConfig.aggressiveness}
                                    onChange={(e) => setPositionConfig({ ...positionConfig, aggressiveness: Number(e.target.value) })}
                                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                />
                                <div className="flex justify-between text-[9px] text-slate-500 mt-1">
                                    <span>Linear</span>
                                    <span>Exponential</span>
                                </div>
                            </div>
                        </div>

                        {/* Portfolio Heat Shield */}
                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                    <Flame size={12} className="text-red-400" /> Portfolio Heat Shield
                                </label>
                                <span className="text-xs font-mono text-red-400">{riskConfig.portfolioHeatLimit}%</span>
                            </div>
                            <input
                                type="range"
                                min="10" max="90" step="5"
                                value={riskConfig.portfolioHeatLimit}
                                onChange={(e) => setRiskConfig({ ...riskConfig, portfolioHeatLimit: Number(e.target.value) })}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                        </div>

                        {/* Leverage Slider (Up to 200x) */}
                        <div className={`bg-slate-800 rounded-lg p-3 border transition-all duration-300 relative overflow-hidden group ${isFlashingRed ? 'border-omni-danger animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                            isCriticalRisk ? 'border-omni-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                                isHighRisk ? 'border-omni-warning' : 'border-slate-700'
                            }`}>
                            {/* DEGEN MODE BACKGROUND FX */}
                            {riskConfig.leverage > 100 && (
                                <div className="absolute inset-0 bg-red-500/10 z-0 animate-pulse pointer-events-none"></div>
                            )}

                            <div className="flex justify-between items-center mb-2 relative z-10">
                                <span className="text-xs text-slate-400 flex items-center gap-2">
                                    Leverage (Cross)
                                    {riskConfig.leverage > 100 && <span className="text-[9px] font-black text-red-500 bg-red-900/20 px-1 rounded animate-pulse">DEGEN MODE</span>}
                                </span>
                                <span className={`text-sm font-bold font-mono ${isCriticalRisk ? 'text-omni-danger' : 'text-white'}`}>{riskConfig.leverage}x</span>
                            </div>
                            <input
                                type="range"
                                min="1" max="200" step="1"
                                value={riskConfig.leverage}
                                onChange={(e) => setRiskConfig({ ...riskConfig, leverage: Number(e.target.value) })}
                                className={`w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer relative z-10 ${isCriticalRisk ? 'accent-omni-danger' : isHighRisk ? 'accent-omni-warning' : 'accent-blue-500'
                                    }`}
                            />

                            {/* Liquidation Price Display */}
                            <div className="mt-3 bg-black/40 rounded p-2 flex items-center justify-between border border-white/5 relative z-10 group/liq">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 cursor-help">
                                    Est. Liq Price <Info size={10} />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-slate-600 rounded text-[10px] text-slate-300 hidden group-hover/liq:block z-50 shadow-xl">
                                        Estimated liquidation price based on current entry and {riskConfig.leverage}x leverage.
                                        Liquidation occurs when loss exceeds margin collateral.
                                    </div>
                                </div>
                                <div className={`font-mono font-bold text-sm ${isApproachingLiquidation ? 'text-omni-danger animate-pulse' : 'text-omni-warning'}`}>
                                    ${liquidationPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                            </div>

                            <div className="flex justify-between text-[10px] text-slate-500 mt-1 relative z-10">
                                <span>1x</span>
                                <span>200x</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Blotter with Sorting */}
            <div className="bg-omni-panel border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <FileText size={18} className="text-slate-400" /> Order Blotter
                    </h3>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Filled: {trades.filter(t => t.status === 'FILLED').length}</span>
                        <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">Pending: {trades.filter(t => t.status === 'PENDING').length}</span>
                        <button
                            onClick={handleExportCSV}
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white border border-slate-600 flex items-center gap-1 transition-colors"
                            title="Export Visible Rows to CSV"
                        >
                            <Download size={12} /> CSV
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('id')}>
                                    <div className="flex items-center gap-1">Order ID <SortIcon colKey="id" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('timestamp')}>
                                    <div className="flex items-center gap-1">Time <SortIcon colKey="timestamp" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('symbol')}>
                                    <div className="flex items-center gap-1">Symbol <SortIcon colKey="symbol" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('side')}>
                                    <div className="flex items-center gap-1">Side <SortIcon colKey="side" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('confidence')}>
                                    <div className="flex items-center justify-end gap-1">Confidence <SortIcon colKey="confidence" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                                    <div className="flex items-center justify-end gap-1">Price <SortIcon colKey="price" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center justify-end gap-1">Amount <SortIcon colKey="amount" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-1">Status <SortIcon colKey="status" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('pnl')}>
                                    <div className="flex items-center justify-end gap-1">PnL <SortIcon colKey="pnl" /></div>
                                </th>
                                <th className="px-6 py-3 font-medium text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {sortedTrades.map((trade) => (
                                <React.Fragment key={trade.id}>
                                    <tr
                                        onClick={() => toggleExpand(trade.id)}
                                        className={`hover:bg-slate-700/30 transition-colors font-mono cursor-pointer ${expandedTradeId === trade.id ? 'bg-slate-700/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-slate-500">{trade.id}</td>
                                        <td className="px-6 py-4 text-slate-400">{trade.timestamp}</td>
                                        <td className="px-6 py-4 font-bold text-white">{trade.symbol}</td>
                                        <td className={`px-6 py-4 font-bold ${trade.side === 'BUY' ? 'text-omni-success' : 'text-omni-danger'}`}>
                                            {trade.side}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className={`text-xs ${trade.confidence >= 80 ? 'text-purple-400' : 'text-slate-400'}`}>{trade.confidence}%</span>
                                                <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full ${trade.confidence >= 90 ? 'bg-omni-success' : trade.confidence >= 75 ? 'bg-purple-500' : 'bg-slate-500'}`} style={{ width: `${trade.confidence}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-300">{trade.price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-slate-300">{trade.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs ${trade.status === 'FILLED' ? 'bg-green-500/20 text-green-400' :
                                                trade.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {trade.status}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${(trade.pnl || 0) > 0 ? 'text-omni-success' : (trade.pnl || 0) < 0 ? 'text-omni-danger' : 'text-slate-500'
                                            }`}>
                                            {trade.pnl ? `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500">
                                            {expandedTradeId === trade.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </td>
                                    </tr>

                                    {/* Expandable Detail View */}
                                    {expandedTradeId === trade.id && (
                                        <tr className="bg-slate-800/20 animate-in fade-in duration-200">
                                            <td colSpan={10} className="p-0">
                                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-700/50 shadow-inner">

                                                    {/* Execution Analysis */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-omni-accent uppercase tracking-wider flex items-center gap-2">
                                                            <Microscope size={14} /> Execution Analysis
                                                        </h4>
                                                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-2">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-400">Effective Notional:</span>
                                                                <span className="text-white font-mono">
                                                                    ${((trade.amount || 0) * trade.price).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-400">Leverage Used:</span>
                                                                <span className="text-purple-400 font-mono">{trade.leverage || '1'}x</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-400">Entry Price:</span>
                                                                <span className="text-slate-200 font-mono">{trade.price.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Market Snapshot */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-omni-warning uppercase tracking-wider flex items-center gap-2">
                                                            <Activity size={14} /> Market Context (At Execution)
                                                        </h4>
                                                        {trade.marketSnapshot ? (
                                                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700 space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-slate-400">Volatility Index:</span>
                                                                    <span className={`font-mono ${trade.marketSnapshot.volatilityIndex > 1.2 ? 'text-omni-warning' : 'text-omni-success'}`}>
                                                                        {(trade.marketSnapshot.volatilityIndex * 100).toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-slate-400">Market Trend:</span>
                                                                    <span className="font-mono text-slate-200">{trade.marketSnapshot.trend > 0 ? 'Bullish' : 'Bearish'} ({trade.marketSnapshot.trend.toFixed(2)})</span>
                                                                </div>
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="text-slate-400">ATR:</span>
                                                                    <span className="font-mono text-slate-200">{trade.marketSnapshot.atr.toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-slate-500 italic p-3">Snapshot data unavailable for historical orders.</div>
                                                        )}
                                                    </div>

                                                    {/* Strategy Trigger */}
                                                    <div className="space-y-3">
                                                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                                                            <Brain size={14} /> AI Logic Tag
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30">
                                                                {trade.confidence > 80 ? 'High Conviction' : 'Standard'}
                                                            </span>
                                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-500/30">
                                                                {trade.marketSnapshot && Math.abs(trade.marketSnapshot.trend) > 0.5 ? 'Trend Following' : 'Mean Reversion'}
                                                            </span>
                                                            <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded border border-slate-600">
                                                                {trade.side} Signal
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                                            AI Model "Agent C" authorized this trade based on a {trade.confidence}% probability of success, aligning with {trade.marketSnapshot && trade.marketSnapshot.trend > 0 ? 'bullish' : 'bearish'} momentum.
                                                        </p>
                                                    </div>

                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const RiskCard = ({ label, base, effective, isDynamic, unit, color, icon }: any) => (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 relative overflow-hidden group hover:border-slate-500 transition-colors">
        <div className="flex justify-between items-start mb-1">
            <label className="text-xs text-slate-400">{label}</label>
            <div className="text-slate-600">{icon}</div>
        </div>
        <div className={`text-xl font-mono font-bold ${color}`}>
            {effective}{unit}
        </div>
        {isDynamic ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                <span className="line-through opacity-50">Base: {base}{unit}</span>
                <span className="text-omni-accent font-medium flex items-center ml-auto bg-omni-accent/10 px-1.5 py-0.5 rounded">
                    <RefreshCcw size={10} className="mr-1" /> Dynamic
                </span>
            </div>
        ) : (
            <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                <span>Static Rate</span>
                <Lock size={10} />
            </div>
        )}
    </div>
);

// Helper CheckCircle
const CheckCircleHelper = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
