
import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Bar,
    Line,
    Area,
    AreaChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Cell
} from 'recharts';
import { MOCK_BTC_ONCHAIN_DATA, MOCK_ETH_ONCHAIN_DATA, BtcLogo, EthLogo } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/common/Card';
import type { OnChainMetric } from '@/types';

const cryptoAssets = [
    { id: 'BTC/USDT', name: 'Bitcoin', symbol: 'BTC', logo: <BtcLogo className="w-6 h-6" /> },
    { id: 'ETH/USDT', name: 'Ethereum', symbol: 'ETH', logo: <EthLogo className="w-6 h-6" /> }
];

// --- Specialized UI Components ---

const SignalGauge: React.FC<{ score: number }> = ({ score }) => {
    // Score -100 (Bearish) to 100 (Bullish)
    const rotation = (score/100) * 90; // -90deg to 90deg

    let statusText = "Neutral";
    let statusColor = "text-gray-400";
    let gaugeColor = "stroke-gray-600";

    if (score > 20) { statusText = "Accumulation"; statusColor = "text-emerald-400"; gaugeColor = "stroke-emerald-500"; }
    if (score > 60) { statusText = "Strong Buy"; statusColor = "text-emerald-400"; gaugeColor = "stroke-emerald-400"; }
    if (score < -20) { statusText = "Distribution"; statusColor = "text-rose-400"; gaugeColor = "stroke-rose-500"; }
    if (score < -60) { statusText = "Strong Sell"; statusColor = "text-rose-400"; gaugeColor = "stroke-rose-400"; }

    return (
        <div className="relative flex flex-col items-center justify-center h-32 w-full">
            {/* Gauge SVG */}
            <svg viewBox="0 0 200 100" className="w-48 h-24 overflow-visible">
                {/* Track */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
                {/* Active Arc (Dynamic) */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    className={`${gaugeColor} transition-all duration-1000 ease-out`}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="251" // Approx circumference of half circle r=80
                    strokeDashoffset={251 - ((score + 100) / 200) * 251}
                    style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                />
                {/* Needle */}
                <g className="transition-transform duration-1000 ease-out origin-bottom" style={{ transform: `translateX(100px) translateY(100px) rotate(${rotation}deg)` }}>
                    <path d="M -4 0 L 4 0 L 0 -75 Z" fill="currentColor" className="text-white" />
                    <circle cx="0" cy="0" r="6" fill="currentColor" className="text-brand-primary" />
                </g>
            </svg>
            <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Net Signal</span>
                <span className={`text-lg font-bold ${statusColor} transition-colors duration-300`}>{statusText}</span>
            </div>
        </div>
    );
};

const StatBlock: React.FC<{ label: string; value: string; trend?: 'up' | 'down' | 'neutral'; subtext?: string }> = ({ label, value, trend, subtext }) => (
    <div className="bg-gray-50 dark:bg-brand-darkest/40 border border-gray-200 dark:border-white/5 p-4 rounded-xl flex flex-col justify-center relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            {trend === 'up' ? (
                <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            ) : trend === 'down' ? (
                <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            ) : null}
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{label}</p>
        <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{value}</p>
        {subtext && <p className={`text-xs mt-1 font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-gray-400'}`}>{subtext}</p>}
    </div>
);

const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-3 bg-[#0B1120]/90 backdrop-blur-md rounded-lg shadow-xl border border-brand-border-dark text-xs">
                <p className="font-bold text-gray-300 mb-2 border-b border-white/10 pb-1">{new Date(label).toLocaleString()}</p>
                {payload.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between gap-4 mb-1">
                        <span style={{ color: p.color }} className="capitalize">{p.name}:</span>
                        <span className="font-mono text-white">{Number(p.value).toLocaleString()}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};


// --- Main Component ---

const OnChainAnalyzer: React.FC = () => {
    const { theme } = useTheme();
    const [activePair, setActivePair] = useState(cryptoAssets[0].id);

    const activeAsset = cryptoAssets.find(c => c.id === activePair) || cryptoAssets[0];

    const onChainData = useMemo(() => {
        return activePair === 'ETH/USDT' ? MOCK_ETH_ONCHAIN_DATA : MOCK_BTC_ONCHAIN_DATA;
    }, [activePair]);

    // Derive some mock stats for the UI
    const stats = useMemo(() => {
        const netflow = onChainData.exchangeFlow[onChainData.exchangeFlow.length - 1].value;
        const whaleActivity = onChainData.whaleTransactions[onChainData.whaleTransactions.length - 1].value;
        const avgWhale = 65; // mock avg
        const sentimentScore = (whaleActivity > avgWhale ? 20 : 0) + (netflow < 0 ? 40 : -30); // Simple logic: Outflow (neg) is bullish

        return {
            netflow,
            whaleActivity,
            hashRate: onChainData.hashRate[onChainData.hashRate.length - 1].value,
            sentimentScore: Math.max(-100, Math.min(100, sentimentScore))
        };
    }, [onChainData]);

    const axisColor = theme === 'dark' ? '#64748B' : '#94A3B8';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';

    return (
        <div className="space-y-6 h-full flex flex-col">

            {/* Control Deck */}
            <div className="flex flex-col md:flex-row gap-6 staggered-fade-in">
                {/* Asset Selector */}
                <Card className="md:w-1/3 !p-0 bg-gradient-to-br from-white to-gray-50 dark:from-[#1E293B] dark:to-[#0F172A] overflow-hidden relative border-brand-primary/20">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Network Scanner</p>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                                    {activeAsset.logo} {activeAsset.name}
                                </h2>
                            </div>
                            <div className="relative">
                                <select
                                    value={activePair}
                                    onChange={(e) => setActivePair(e.target.value)}
                                    className="appearance-none bg-gray-200 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-lg py-1 pl-3 pr-8 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-primary cursor-pointer hover:bg-gray-300 dark:hover:bg-white/10 transition-colors"
                                >
                                    {cryptoAssets.map(p => <option key={p.id} value={p.id}>{p.symbol}</option>)}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">▼</div>
                            </div>
                        </div>

                        {/* Gauge Area */}
                        <SignalGauge score={stats.sentimentScore} />
                    </div>
                </Card>

                {/* Key Metrics */}
                <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatBlock
                        label="Net Exchange Flow"
                        value={`${stats.netflow > 0 ? '+' : ''}${stats.netflow.toLocaleString()}`}
                        subtext={stats.netflow < 0 ? "Outflow (Bullish)" : "Inflow (Bearish)"}
                        trend={stats.netflow < 0 ? 'up' : 'down'}
                    />
                    <StatBlock
                        label="Whale Tx Count"
                        value={stats.whaleActivity.toLocaleString()}
                        subtext="Large Tier (> $100k)"
                        trend={stats.whaleActivity > 70 ? 'up' : 'neutral'}
                    />
                    <StatBlock
                        label="Network Hashrate"
                        value={`${stats.hashRate} EH/s`}
                        subtext="Network Security"
                        trend="up"
                    />
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* Exchange Netflow Chart */}
                <Card className="flex flex-col relative overflow-hidden bg-white dark:bg-[#0B1120] border-gray-200 dark:border-brand-border-dark shadow-lg staggered-fade-in" style={{ animationDelay: '100ms' }}>
                    <div className="absolute top-0 right-0 p-4 pointer-events-none opacity-20">
                        <svg className="w-24 h-24 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 17v-7h-2v7h-8v2h8v7h2v-7h8v-2zM8 7V0H6v7H0v2h6v7h2V9h8V7z" /></svg>
                    </div>
                    <div className="mb-6 z-10">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            Exchange Netflow
                        </h3>
                        <p className="text-xs text-gray-500">Inflows (Red) vs Outflows (Green) to Exchanges</p>
                    </div>

                    <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={onChainData.exchangeFlow}>
                                <defs>
                                    <linearGradient id="netflowGradPositive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.2} />
                                    </linearGradient>
                                    <linearGradient id="netflowGradNegative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.2} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.5} />
                                <XAxis dataKey="time" stroke={axisColor} tickFormatter={(time) => new Date(time).getHours() + 'h'} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis stroke={axisColor} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomTooltipContent />} cursor={{ fill: 'transparent' }} />
                                <ReferenceLine y={0} stroke={axisColor} strokeOpacity={0.5} />
                                <Bar dataKey="value" name="Netflow">
                                    {onChainData.exchangeFlow.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'url(#netflowGradPositive)' : 'url(#netflowGradNegative)'} />
                                    ))}
                                </Bar>
                                {/* Simulated Price Line Overlay */}
                                <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} dot={false} opacity={0.3} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <div className="flex flex-col gap-6">
                    {/* Whale Activity (Sonar) */}
                    <Card className="flex-1 relative overflow-hidden bg-[#001e3c] border-none shadow-lg staggered-fade-in" style={{ animationDelay: '200ms' }}>
                        {/* Sonar Background */}
                        <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle, rgba(14, 165, 233, 0.1) 1px, transparent 1px)',
                            backgroundSize: '20px 20px',
                            opacity: 0.3
                        }}></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-4 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-sky-400">Whale Sonar</h3>
                                    <p className="text-xs text-sky-400/60">Large Transaction Count (&gt; $100k)</p>
                                </div>
                                <div className="animate-ping w-2 h-2 bg-sky-400 rounded-full"></div>
                            </div>

                            <div className="flex-1 min-h-[150px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={onChainData.whaleTransactions}>
                                        <defs>
                                            <linearGradient id="whaleGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(14, 165, 233, 0.1)" vertical={false} />
                                        <XAxis dataKey="time" hide />
                                        <YAxis hide />
                                        <Tooltip content={<CustomTooltipContent />} cursor={{ stroke: '#0EA5E9', strokeWidth: 1, strokeDasharray: '3 3' }} />
                                        <Area type="step" dataKey="value" name="Whale Tx" stroke="#0EA5E9" strokeWidth={2} fill="url(#whaleGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    {/* Hashrate (System Load) */}
                    <Card className="flex-1 bg-slate-900 border border-slate-800 staggered-fade-in" style={{ animationDelay: '300ms' }}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Network Security</h3>
                                <p className="text-[10px] text-gray-400">Hashrate (EH/s)</p>
                            </div>
                            <div className="px-2 py-1 bg-slate-800 rounded text-xs font-mono text-cyan-400 border border-cyan-500/30">
                                {stats.hashRate} EH/s
                            </div>
                        </div>
                        <div className="h-[100px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={onChainData.hashRate}>
                                    <defs>
                                        <linearGradient id="hashGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22D3EE" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#22D3EE" strokeWidth={2} fill="url(#hashGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

export default OnChainAnalyzer;

