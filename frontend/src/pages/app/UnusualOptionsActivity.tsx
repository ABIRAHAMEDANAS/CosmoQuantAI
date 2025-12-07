
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from '@/components/common/Card';
import { generateUnusualOptionTrade } from '@/constants';
import type { UnusualOptionTrade } from '@/types';

type TradeWithStatus = UnusualOptionTrade & { isNew?: boolean };

// Visual Meter for Put/Call Ratio
const PutCallMeter: React.FC<{ ratio: number }> = ({ ratio }) => {
    // Clamp ratio between 0.5 (Very Bullish) and 1.5 (Very Bearish) for visualization
    const percentage = Math.max(0, Math.min(100, ((ratio - 0.4) / 1.2) * 100));

    return (
        <div className="w-full">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">
                <span className="text-emerald-500">Bullish (Calls)</span>
                <span className="text-rose-500">Bearish (Puts)</span>
            </div>
            <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 opacity-30"></div>
                {/* Marker */}
                <div
                    className="absolute top-0 bottom-0 w-1.5 bg-slate-900 dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all duration-500"
                    style={{ left: `${percentage}%` }}
                ></div>
            </div>
            <div className="mt-2 text-center">
                <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{ratio.toFixed(2)}</span>
                <span className="text-xs text-gray-500 ml-2">P/C Ratio</span>
            </div>
        </div>
    );
};

// Live Status Indicator
const LiveIndicator: React.FC<{ isLive: boolean }> = ({ isLive }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${isLive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-400'}`}>
        <span className={`relative flex h-2 w-2`}>
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
        </span>
        {isLive ? 'Live Feed' : 'Paused'}
    </div>
);

const formatValue = (value: number) => {
    if (value >= 1_000_000) return `$${(value/1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value/1_000).toFixed(0)}k`;
    return `$${value.toFixed(0)}`;
};

const UnusualOptionsActivity: React.FC = () => {
    const [trades, setTrades] = useState<TradeWithStatus[]>(() =>
        Array.from({ length: 25 }, generateUnusualOptionTrade)
            .map(trade => ({ ...trade, isNew: false }))
            .sort((a, b) => b.time.localeCompare(a.time))
    );
    const [isLive, setIsLive] = useState(true);
    const [filters, setFilters] = useState({
        sentiment: 'All',
        type: 'All',
        ticker: ''
    });
    const timersRef = useRef<number[]>([]);

    useEffect(() => {
        if (!isLive) return;

        const interval = setInterval(() => {
            const newTrade: TradeWithStatus = { ...generateUnusualOptionTrade(), isNew: true };
            setTrades(prev => [newTrade, ...prev].slice(0, 100));
            const timerId = window.setTimeout(() => {
                setTrades(current => current.map(t => (t.id === newTrade.id ? { ...t, isNew: false } : t)));
            }, 1000);
            timersRef.current.push(timerId);
        }, 2000);

        return () => {
            clearInterval(interval);
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, [isLive]);

    const filteredTrades = useMemo(() => {
        return trades.filter(trade => {
            const sentimentMatch = filters.sentiment === 'All' || trade.sentiment === filters.sentiment;
            const typeMatch = filters.type === 'All' || trade.type === filters.type;
            const tickerMatch = filters.ticker === '' || trade.ticker.toLowerCase().includes(filters.ticker.toLowerCase());
            return sentimentMatch && typeMatch && tickerMatch;
        });
    }, [trades, filters]);

    const stats = useMemo(() => {
        const bullishPrem = filteredTrades.reduce((acc, t) => t.sentiment === 'Bullish' ? acc + t.premium : acc, 0);
        const bearishPrem = filteredTrades.reduce((acc, t) => t.sentiment === 'Bearish' ? acc + t.premium : acc, 0);
        const totalPrem = bullishPrem + bearishPrem;
        const largestTrade = filteredTrades.reduce((max, t) => t.premium > max.premium ? t : max, filteredTrades[0] || {
            id: 'mock',
            ticker: 'N/A',
            time: '',
            strike: 0,
            expiry: '',
            type: 'Call',
            volume: 0,
            openInterest: 0,
            premium: 0,
            tradeType: 'Block',
            sentiment: 'Neutral',
            details: 'Mid-Market',
            isNew: false
        } as TradeWithStatus);

        // Calculate dynamic P/C Ratio based on visible volume
        const callVol = filteredTrades.reduce((acc, t) => t.type === 'Call' ? acc + t.volume : acc, 0);
        const putVol = filteredTrades.reduce((acc, t) => t.type === 'Put' ? acc + t.volume : acc, 0);
        const pcRatio = callVol > 0 ? putVol / callVol : 1;

        return { bullishPrem, bearishPrem, totalPrem, largestTrade, pcRatio };
    }, [filteredTrades]);

    const getSentimentStyle = (sentiment: UnusualOptionTrade['sentiment']) => {
        switch (sentiment) {
            case 'Bullish': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'Bearish': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10';
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 overflow-hidden">

            {/* Top HUD Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0 staggered-fade-in">

                {/* Sentiment Meter Card */}
                <Card className="flex items-center justify-center">
                    <PutCallMeter ratio={stats.pcRatio} />
                </Card>

                {/* Flow Analysis Card */}
                <Card className="flex flex-col justify-center">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Premium Flow Sentiment</h3>
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <span className="text-xl font-bold text-emerald-500">{formatValue(stats.bullishPrem)}</span>
                            <span className="text-xs text-gray-400 ml-1">Bullish</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xl font-bold text-rose-500">{formatValue(stats.bearishPrem)}</span>
                            <span className="text-xs text-gray-400 ml-1">Bearish</span>
                        </div>
                    </div>
                    {/* Gradient Bar */}
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.bullishPrem / stats.totalPrem) * 100}%` }}></div>
                        <div className="h-full bg-rose-500 transition-all duration-500 flex-1"></div>
                    </div>
                </Card>

                {/* Whale Spotlight Card */}
                <Card className="relative overflow-hidden bg-slate-900 text-white border-slate-800">
                    {/* Background Effect */}
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Largest Whale Flow
                            </h3>
                        </div>
                        {stats.largestTrade.ticker !== 'N/A' ? (
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <h2 className="text-3xl font-bold">{stats.largestTrade.ticker}</h2>
                                    <span className={`text-lg font-bold ${stats.largestTrade.type === 'Call' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {stats.largestTrade.type}
                                    </span>
                                </div>
                                <div className="flex justify-between mt-3 text-sm font-mono text-gray-300">
                                    <span>Strike: ${stats.largestTrade.strike}</span>
                                    <span className="font-bold text-white">{formatValue(stats.largestTrade.premium)} Prem</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">Scanning for whales...</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Main Data Feed */}
            <Card className="flex-1 flex flex-col min-h-0 !p-0 overflow-hidden border border-gray-200 dark:border-brand-border-dark shadow-lg staggered-fade-in" style={{ animationDelay: '150ms' }}>

                {/* Controls Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-brand-border-dark bg-white dark:bg-brand-dark flex flex-wrap gap-4 justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-6 bg-brand-primary rounded-full"></span>
                        Live Option Flow
                    </h2>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Ticker..."
                                value={filters.ticker}
                                onChange={(e) => setFilters(f => ({ ...f, ticker: e.target.value }))}
                                className="pl-9 pr-4 py-1.5 bg-gray-100 dark:bg-brand-darkest/50 border border-transparent focus:border-brand-primary rounded-lg text-sm text-slate-900 dark:text-white outline-none transition-all w-40"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        <select
                            value={filters.sentiment}
                            onChange={(e) => setFilters(f => ({ ...f, sentiment: e.target.value }))}
                            className="px-3 py-1.5 bg-gray-100 dark:bg-brand-darkest/50 border border-transparent focus:border-brand-primary rounded-lg text-sm text-slate-700 dark:text-gray-300 outline-none cursor-pointer"
                        >
                            <option value="All">All Sentiments</option>
                            <option value="Bullish">Bullish Only</option>
                            <option value="Bearish">Bearish Only</option>
                        </select>

                        <button onClick={() => setIsLive(!isLive)}>
                            <LiveIndicator isLive={isLive} />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-brand-dark z-10 shadow-sm">
                            <tr className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                <th className="p-4">Time</th>
                                <th className="p-4">Ticker</th>
                                <th className="p-4 text-right">Strike / Exp</th>
                                <th className="p-4 text-center">Type</th>
                                <th className="p-4">Spot Price</th>
                                <th className="p-4">Details</th>
                                <th className="p-4">Sentiment</th>
                                <th className="p-4">Vol / OI</th>
                                <th className="p-4 text-right">Premium</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100 dark:divide-brand-border-dark">
                            {filteredTrades.map(trade => (
                                <tr key={trade.id} className={`hover:bg-gray-50 dark:hover:bg-brand-darkest/30 transition-colors ${trade.isNew ? 'animate-row-flash bg-brand-primary/5' : ''}`}>
                                    <td className="p-4 font-mono text-gray-500 text-xs">{trade.time}</td>
                                    <td className="p-4">
                                        <span className="font-bold text-slate-900 dark:text-white">{trade.ticker}</span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="font-mono font-semibold text-slate-900 dark:text-white">${trade.strike}</div>
                                        <div className="text-xs text-gray-500">{trade.expiry}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`font-bold ${trade.type === 'Call' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {trade.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-gray-600 dark:text-gray-300">
                                        $245.30 <span className="text-[10px] text-gray-400">(Mock)</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-medium text-slate-700 dark:text-gray-300">{trade.tradeType}</span>
                                            <span className="text-[10px] text-gray-500">{trade.details}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${getSentimentStyle(trade.sentiment)}`}>
                                            {trade.sentiment}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 w-24">
                                            <div className="flex justify-between text-[10px] text-gray-500">
                                                <span>{trade.volume}</span>
                                                <span className="text-yellow-500 font-bold">{(trade.volume / trade.openInterest).toFixed(1)}x</span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${trade.volume > trade.openInterest ? 'bg-brand-warning' : 'bg-brand-primary'}`}
                                                    style={{ width: `${Math.min(100, (trade.volume / (trade.openInterest + 1)) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                        {formatValue(trade.premium)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default UnusualOptionsActivity;

