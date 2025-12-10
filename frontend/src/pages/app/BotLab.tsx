import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { MOCK_ACTIVE_BOTS, MOCK_BACKTEST_RESULTS, MOCK_STRATEGIES, REGIME_DEFINITIONS, RegimeIcon, MOCK_CUSTOM_MODELS, MLModelIcon, EQUITY_CURVE_DATA } from '@/constants';
import type { MarketRegime, CustomMLModel, ActiveBot, BacktestResult } from '@/types';
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, Cell } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useSettings } from '@/context/SettingsContext';
import { marketDataService } from '@/services/marketData';
import { botService } from '@/services/botService';
import SearchableSelect from '@/components/common/SearchableSelect';
import { strategyService } from '@/services/strategyService';
import client from '@/services/client';

// Icons
const PlayIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

const PauseIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
    </svg>
);

const SettingsIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const ChartIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
    </svg>
);

const BuildIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const PlusIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number; decimals?: number; prefix?: string; suffix?: string }> = ({ value, decimals = 2, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;

        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out function
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const current = start + (end - start) * easeOut;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setDisplayValue(end);
            }
        };

        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span className="animate-count-up inline-block">
            {prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </span>
    );
};

const MiniEquityChart: React.FC<{ isPositive: boolean; id: string }> = ({ isPositive, id }) => {
    const data = useMemo(() => {
        let val = 100;
        const volatility = isPositive ? 2 : 3;
        const trend = isPositive ? 1 : -0.8;

        return Array.from({ length: 20 }, (_, i) => {
            val = val + trend + (Math.random() - 0.5) * volatility * 5;
            return { i, value: val };
        });
    }, [isPositive, id]);

    const color = isPositive ? '#10B981' : '#F43F5E';

    return (
        <div className="h-20 w-full absolute bottom-0 left-0 right-0 opacity-40 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${id})`}
                        isAnimationActive={true}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const BotCard: React.FC<{
    bot: ActiveBot;
    index: number;
    onRunBacktest: (bot: ActiveBot) => void;
    onToggleStatus: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ bot, index, onRunBacktest, onToggleStatus, onDelete }) => {
    const isPositive = bot.pnl >= 0;
    const statusColor = bot.status === 'active' ? 'bg-brand-success' : 'bg-gray-400';
    const statusGlow = bot.status === 'active' ? 'shadow-[0_0_10px_rgba(16,185,129,0.5)]' : '';

    return (
        <div
            className="relative group bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl overflow-hidden hover:shadow-2xl hover:border-brand-primary/50 transition-all duration-300 transform hover:-translate-y-1 flex flex-col staggered-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            {/* Status Line Top */}
            <div className={`absolute top-0 left-0 w-full h-1 ${bot.status === 'active' ? 'bg-brand-success' : 'bg-gray-300 dark:bg-gray-600'}`} />

            <div className="p-6 relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">{bot.name}</h3>
                            {bot.isRegimeAware && <div className="text-brand-primary" title="Regime Aware"><RegimeIcon /></div>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-brand-darkest/50 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{bot.market}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px]">{bot.strategy}</span>
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleStatus(bot.id); }}
                        className={`relative w-8 h-5 rounded-full transition-colors duration-300 focus:outline-none ${bot.status === 'active' ? 'bg-brand-success/20' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                        <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform duration-300 ${statusColor} ${statusGlow} ${bot.status === 'active' ? 'translate-x-3' : ''}`}></div>
                    </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 z-10">
                    <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Net PnL</p>
                        <div className={`text-2xl font-bold mt-0.5 ${isPositive ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {isPositive ? '+' : '-'}<AnimatedNumber value={Math.abs(bot.pnl)} prefix="$" />
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">ROI</p>
                        <div className={`text-lg font-bold mt-1 ${isPositive ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {isPositive ? '▲' : '▼'} {Math.abs(bot.pnlPercent).toFixed(2)}%
                        </div>
                    </div>
                </div>

                {/* Spacer for Chart */}
                <div className="flex-grow min-h-[60px]"></div>

                {/* Actions Footer */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-brand-border-light/50 dark:border-brand-border-dark/50 z-20 relative">
                    <div className="flex gap-2">
                        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-brand-darkest text-gray-500 dark:text-gray-400 transition-colors" title="Settings">
                            <SettingsIcon />
                        </button>

                        {/* 🔴 DELETE BUTTON */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(bot.id); }}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                            title="Delete Bot"
                        >
                            <TrashIcon />
                        </button>
                    </div>

                    <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs px-3 h-8 bg-white dark:bg-brand-darkest border border-gray-200 dark:border-brand-border-dark shadow-sm hover:shadow-md"
                        onClick={() => onRunBacktest(bot)}
                    >
                        Run Backtest
                    </Button>
                </div>
            </div>

            {/* Background Chart */}
            <MiniEquityChart isPositive={isPositive} id={bot.id} />
        </div>
    );
};

const BotLabHeader: React.FC<{ bots: ActiveBot[], onOpenCreate: () => void }> = ({ bots, onOpenCreate }) => {
    const totalPnL = bots.reduce((acc, bot) => acc + bot.pnl, 0);
    const activeCount = bots.filter(b => b.status === 'active').length;
    const winRate = 68.5;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 staggered-fade-in">
            <div className="bg-gradient-to-br from-brand-primary/80 to-brand-primary rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-xs font-medium text-white/80 uppercase">Total Active PnL</p>
                    <p className="text-2xl font-bold mt-1">
                        {totalPnL >= 0 ? '+' : '-'}<AnimatedNumber value={Math.abs(totalPnL)} prefix="$" />
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-2 translate-y-2">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
                </div>
            </div>

            <div className="bg-white dark:bg-brand-dark rounded-xl p-4 border border-brand-border-light dark:border-brand-border-dark shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Active Bots</p>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                    <span className="text-xs text-gray-400">/ {bots.length} total</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-brand-darkest rounded-full h-1.5 mt-3">
                    <div className="bg-brand-success h-1.5 rounded-full" style={{ width: `${(activeCount / bots.length) * 100}%` }}></div>
                </div>
            </div>

            <div className="bg-white dark:bg-brand-dark rounded-xl p-4 border border-brand-border-light dark:border-brand-border-dark shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Avg. Win Rate</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{winRate}%</p>
                <p className="text-xs text-brand-success mt-1 flex items-center">
                    <span className="mr-1">▲</span> 2.4% vs last week
                </p>
            </div>

            <div onClick={onOpenCreate} className="bg-white dark:bg-brand-dark rounded-xl p-4 border border-brand-border-light dark:border-brand-border-dark shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-brand-darkest/50 transition-colors group">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <p className="text-sm font-bold text-brand-primary">Deploy New Bot</p>
            </div>
        </div>
    )
}

const VisualStrategyBuilderModal: React.FC<{ onClose: () => void; onSave: (name: string) => void; }> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-brand-darkest w-full h-full max-w-7xl rounded-xl shadow-2xl border border-brand-border-dark flex flex-col overflow-hidden animate-modal-content-slide-down" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="h-16 border-b border-brand-border-dark flex items-center justify-between px-6 bg-brand-dark flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-primary/20 p-2 rounded-lg">
                            <BuildIcon className="text-brand-primary w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Visual Strategy Builder</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="Strategy Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-brand-darkest border border-brand-border-dark rounded-md px-3 py-1.5 text-white text-sm focus:border-brand-primary outline-none"
                        />
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={() => { if (name) onSave(name); }}>Save & Deploy</Button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-brand-dark border-r border-brand-border-dark p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Triggers</h3>
                            <div className="space-y-2">
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Market Data
                                </div>
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Time Interval
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Indicators & Logic</h3>
                            <div className="space-y-2">
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div> RSI
                                </div>
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div> MACD
                                </div>
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Moving Avg
                                </div>
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> Compare ( &gt; // &lt; )
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Actions</h3>
                            <div className="space-y-2">
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500"></div> Buy Market
                                </div>
                                <div className="bg-brand-darkest border border-brand-border-dark p-3 rounded-lg cursor-move hover:border-brand-primary transition-colors text-sm text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Sell Market
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 bg-[#0B1120] relative overflow-hidden">
                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>

                        {/* Connecting Lines (Static Mock) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none">
                            <line x1="150" y1="100" x2="150" y2="200" stroke="#4B5563" strokeWidth="2" />
                            <line x1="150" y1="250" x2="150" y2="350" stroke="#4B5563" strokeWidth="2" />
                        </svg>

                        {/* Nodes */}
                        <div className="p-10 relative w-full h-full">
                            {/* Static Layout for Demo */}
                            <div className="absolute top-12 left-12 bg-brand-dark border border-brand-border-dark rounded-xl shadow-lg p-4 w-64 border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white text-sm">Trigger</span>
                                    <span className="text-xs text-gray-500">1m Candle</span>
                                </div>
                                <p className="text-gray-300 text-sm">BTC/USDT Price Update</p>
                            </div>

                            <div className="absolute top-48 left-12 bg-brand-dark border border-brand-border-dark rounded-xl shadow-lg p-4 w-64 border-l-4 border-l-yellow-500">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white text-sm">Condition</span>
                                </div>
                                <p className="text-gray-300 text-sm">RSI(14) &lt; 30</p>
                            </div>

                            <div className="absolute top-[22rem] left-12 bg-brand-dark border border-brand-border-dark rounded-xl shadow-lg p-4 w-64 border-l-4 border-l-green-500">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white text-sm">Action</span>
                                </div>
                                <p className="text-gray-300 text-sm">Place Buy Market Order</p>
                                <p className="text-xs text-gray-500 mt-1">Size: 5% Equity</p>
                            </div>

                            <div className="absolute top-12 right-12 bg-brand-dark/50 border border-brand-border-dark p-4 rounded-lg max-w-xs">
                                <h4 className="text-white font-bold mb-2 text-sm">Builder Hint</h4>
                                <p className="text-gray-400 text-xs">Drag blocks from the left sidebar to build your logic flow. Connect triggers to actions to automate your strategy.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const BacktestResultModal: React.FC<{
    bot: ActiveBot;
    result: BacktestResult;
    onClose: () => void;
}> = ({ bot, result, onClose }) => {
    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';

    const StatBox = ({ label, value, isPositive }: any) => (
        <div className="bg-gray-50 dark:bg-brand-darkest/50 p-4 rounded-lg text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">{label}</p>
            <p className={`text-xl font-bold ${isPositive === true ? 'text-brand-success' : isPositive === false ? 'text-brand-danger' : 'text-slate-900 dark:text-white'}`}>
                {value}
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark w-full max-w-4xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col animate-modal-content-slide-down overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Backtest Results</h2>
                        <p className="text-sm text-gray-500">{bot.name} • {result.date}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatBox label="Total Profit" value={`${result.profitPercent > 0 ? '+' : ''}${result.profitPercent.toFixed(2)}%`} isPositive={result.profitPercent >= 0} />
                        <StatBox label="Max Drawdown" value={`${result.maxDrawdown.toFixed(2)}%`} isPositive={false} />
                        <StatBox label="Win Rate" value={`${result.winRate.toFixed(1)}%`} />
                        <StatBox label="Sharpe Ratio" value={result.sharpeRatio.toFixed(2)} />
                    </div>
                    <div>
                        <h3 className="text-md font-semibold text-slate-900 dark:text-white mb-4">Equity Curve</h3>
                        <div className="h-80 w-full bg-gray-50 dark:bg-brand-darkest/30 rounded-xl p-4 border border-brand-border-light dark:border-brand-border-dark">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={EQUITY_CURVE_DATA}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                    <XAxis dataKey="name" stroke={axisColor} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke={axisColor} tickFormatter={(value) => `$${Number(value) / 1000}k`} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip
                                        contentStyle={theme === 'dark'
                                            ? { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }
                                            : { borderRadius: '8px' }}
                                    />
                                    <Line type="monotone" dataKey="value" name="Equity" stroke="#6366F1" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t border-brand-border-light dark:border-brand-border-dark flex justify-end bg-gray-50 dark:bg-brand-darkest/30">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
};

const CreateBotModal: React.FC<{
    onClose: () => void;
    onCreateBot: (newBot: ActiveBot) => void;
    showToast: (message: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}> = ({ onClose, onCreateBot, showToast }) => {

    const { apiKeys } = useSettings();
    const [botName, setBotName] = useState('');
    const [tradeValue, setTradeValue] = useState('100');
    const [unit, setUnit] = useState('QUOTE');
    const [apiKeyId, setApiKeyId] = useState('');

    // ✅ ডাইনামিক এক্সচেঞ্জ এবং পেয়ার স্টেট
    const [exchange, setExchange] = useState('');
    const [assetPair, setAssetPair] = useState('');
    const [availableExchanges, setAvailableExchanges] = useState<string[]>([]);
    const [availablePairs, setAvailablePairs] = useState<string[]>([]);
    const [isLoadingExchanges, setIsLoadingExchanges] = useState(false);
    const [isLoadingPairs, setIsLoadingPairs] = useState(false);

    // ✅ Strategy & Parameter Management
    const [strategies, setStrategies] = useState<string[]>([]);
    const [strategy, setStrategy] = useState('');
    const [isLoadingStrategies, setIsLoadingStrategies] = useState(false);

    // 🔥 New: Dynamic Parameter State
    const [dynamicParamsSchema, setDynamicParamsSchema] = useState<Record<string, any>>({});
    const [paramValues, setParamValues] = useState<Record<string, any>>({});
    const [isLoadingParams, setIsLoadingParams] = useState(false);

    const [timeframe, setTimeframe] = useState('1h');
    const [deploymentTarget, setDeploymentTarget] = useState<'Spot' | 'Futures' | 'Margin'>('Spot');
    const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
    const [limitPrice, setLimitPrice] = useState('');

    // Risk Management
    const [riskParams, setRiskParams] = useState({
        stopLoss: 5,
        takeProfit: 10,
        positionSize: 2
    });

    // Advanced & Notifications
    const [advanced, setAdvanced] = useState({
        trailingSl: false,
        trailingSlVal: 0.02,
        dailyLoss: false,
        dailyLossVal: 0.03,
        regimeFilter: false,
        sentiment: false
    });
    const [notifications, setNotifications] = useState({ telegram: false });

    // Populate API Keys
    const availableApiKeys = useMemo(() => Object.keys(apiKeys).filter(k => apiKeys[k].isEnabled), [apiKeys]);

    // ✅ ১. এক্সচেঞ্জ লিস্ট লোড করা
    useEffect(() => {
        const fetchExchanges = async () => {
            setIsLoadingExchanges(true);
            try {
                const exList = await marketDataService.getAllExchanges();
                setAvailableExchanges(exList);
            } catch (error) {
                console.error("Failed to load exchanges", error);
                showToast('Failed to load exchange list', 'error');
            } finally {
                setIsLoadingExchanges(false);
            }
        };
        fetchExchanges();
    }, []);

    // ✅ ৩. স্ট্র্যাটেজি লিস্ট ফেচ করা
    useEffect(() => {
        const fetchStrategies = async () => {
            setIsLoadingStrategies(true);
            try {
                // API call to get strategy list
                const { data } = await client.get('/v1/strategies/list');
                setStrategies(data);
                if (data.length > 0) setStrategy(data[0]);
            } catch (error) {
                console.error("Failed to load strategies", error);
                showToast('Failed to load strategies', 'error');
                // Fallback mock data
                setStrategies(MOCK_STRATEGIES);
                setStrategy(MOCK_STRATEGIES[0]);
            } finally {
                setIsLoadingStrategies(false);
            }
        };
        fetchStrategies();
    }, []);

    // 🔥 New: Load strategy parameters when strategy changes
    useEffect(() => {
        if (!strategy) return;

        const fetchStrategyParams = async () => {
            setIsLoadingParams(true);
            try {
                const { data } = await client.get(`/v1/strategies/source/${strategy}`);

                if (data.inferred_params && Object.keys(data.inferred_params).length > 0) {
                    setDynamicParamsSchema(data.inferred_params);

                    // Set default values for input fields
                    const defaults: Record<string, any> = {};
                    Object.entries(data.inferred_params).forEach(([key, config]: [string, any]) => {
                        defaults[key] = config.default;
                    });
                    setParamValues(defaults);
                } else {
                    // If no params found
                    setDynamicParamsSchema({});
                    setParamValues({});
                }
            } catch (error) {
                console.error("Failed to load strategy params", error);
                setDynamicParamsSchema({});
                setParamValues({});
            } finally {
                setIsLoadingParams(false);
            }
        };

        fetchStrategyParams();
    }, [strategy]);

    // ✅ ২. পেয়ার লোড করা (যখন এক্সচেঞ্জ সিলেক্ট হবে)
    useEffect(() => {
        if (exchange) {
            const fetchPairs = async () => {
                setIsLoadingPairs(true);
                setAvailablePairs([]);
                try {
                    const pairs = await marketDataService.getExchangePairs(exchange);
                    setAvailablePairs(pairs);
                    if (pairs.length > 0) setAssetPair(pairs[0]);
                } catch (error) {
                    console.error("Failed to load pairs", error);
                    showToast(`Failed to load pairs for ${exchange}`, 'error');
                } finally {
                    setIsLoadingPairs(false);
                }
            };
            fetchPairs();
        }
    }, [exchange]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // ভ্যালিডেশন
        if (!botName.trim()) { showToast('Enter a name', 'error'); return; }
        if (!exchange) { showToast('Select an exchange', 'error'); return; }
        if (!assetPair) { showToast('Select an asset pair', 'error'); return; }
        // if (!apiKeyId) { showToast('Select an API Key Configuration', 'warning'); } // অপশনাল হতে পারে

        // ✅ সব ডাটা দিয়ে অবজেক্ট তৈরি
        const newBotData = {
            name: botName,
            exchange: exchange,
            market: assetPair,
            strategy: strategy,
            timeframe: timeframe,
            trade_value: Number(tradeValue),
            trade_unit: unit,
            api_key_id: apiKeyId,
            is_regime_aware: advanced.regimeFilter,
            config: {
                strategyParams: paramValues,
                riskParams,
                advanced,
                notifications,
                deploymentTarget,
                orderType,
                limitPrice: orderType === 'Limit' && limitPrice ? Number(limitPrice) : null
            }
        };

        onCreateBot(newBotData as any);
        onClose();
    };

    const inputClasses = "w-full bg-gray-100 dark:bg-brand-darkest/50 border border-gray-200 dark:border-brand-border-dark rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all outline-none";
    const labelClasses = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2";
    const sectionTitleClasses = "text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2";

    const Checkbox = ({ checked, onChange, label }: { checked: boolean, onChange: (v: boolean) => void, label: string }) => (
        <div className="flex items-center cursor-pointer" onClick={() => onChange(!checked)}>
            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${checked ? 'bg-brand-primary border-brand-primary' : 'border-gray-300 dark:border-gray-600 bg-transparent'}`}>
                {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium select-none">{label}</span>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark w-full max-w-3xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-modal-content-slide-down overflow-hidden border border-gray-200 dark:border-brand-border-dark" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-brand-border-dark flex justify-between items-center bg-gray-50 dark:bg-brand-darkest/30">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create New Trading Bot</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">&times;</button>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="create-bot-form" onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: General & Config */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <label className={labelClasses}>Bot Name</label>
                                <input type="text" className={inputClasses} value={botName} onChange={e => setBotName(e.target.value)} placeholder="e.g. My BTC Scalper" />
                            </div>
                            <div className="md:col-span-1">
                                <label className={labelClasses}>Trade Value (in {unit})</label>
                                <input type="number" className={inputClasses} value={tradeValue} onChange={e => setTradeValue(e.target.value)} />
                            </div>
                            <div className="md:col-span-1">
                                <label className={labelClasses}>Unit</label>
                                <select className={inputClasses} value={unit} onChange={e => setUnit(e.target.value)}>
                                    <option value="QUOTE">QUOTE</option>
                                    <option value="ASSET">ASSET</option>
                                </select>
                            </div>

                            <div className="md:col-span-1">
                                <label className={labelClasses}>API Key Configuration</label>
                                <select className={inputClasses} value={apiKeyId} onChange={e => setApiKeyId(e.target.value)}>
                                    <option value="">Select a saved API key...</option>
                                    {availableApiKeys.map(key => <option key={key} value={key}>{key}</option>)}
                                </select>
                            </div>

                            {/* ✅ Searchable Exchange Selection */}
                            <div className="md:col-span-1">
                                <SearchableSelect
                                    label={`Market / Exchange ${isLoadingExchanges ? '(Loading...)' : ''}`}
                                    options={availableExchanges}
                                    value={exchange}
                                    onChange={setExchange}
                                    placeholder="Select Exchange"
                                    disabled={isLoadingExchanges}
                                />
                            </div>

                            {/* ✅ Searchable Asset Pair Selection */}
                            <div className="md:col-span-1">
                                <SearchableSelect
                                    label={`Asset Pair ${isLoadingPairs ? '(Fetching...)' : ''}`}
                                    options={availablePairs}
                                    value={assetPair}
                                    onChange={setAssetPair}
                                    placeholder={!exchange ? "Select Exchange First" : "Select Pair"}
                                    disabled={!exchange || isLoadingPairs}
                                />
                            </div>

                            {/* Strategy Select Box Updated */}
                            <div className="md:col-span-1">
                                <label className={labelClasses}>
                                    Strategy {isLoadingStrategies && <span className="text-xs text-brand-primary lowercase ml-1">(syncing...)</span>}
                                </label>
                                <select
                                    className={inputClasses}
                                    value={strategy}
                                    onChange={e => setStrategy(e.target.value)}
                                    disabled={isLoadingStrategies}
                                >
                                    {strategies.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Timeframe</label>
                                <select className={inputClasses} value={timeframe} onChange={e => setTimeframe(e.target.value)}>
                                    {['1s', '5s', '10s', '15s', '30s', '45s', '1m', '3m', '5m', '15m', '30m', '45m', '1h', '2h', '3h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Deployment Target & Order Type Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {/* Deployment Target (আগের কোড) */}
                            <div>
                                <label className={labelClasses}>Deployment Target</label>
                                <div className="flex p-1 bg-gray-100 dark:bg-brand-darkest/50 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                    {(['Spot', 'Futures', 'Margin'] as const).map(target => (
                                        <button
                                            key={target}
                                            type="button"
                                            onClick={() => setDeploymentTarget(target)}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${deploymentTarget === target ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                                        >
                                            {target}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Order Type & Limit Price */}
                            <div className="space-y-3">
                                <div>
                                    <label className={labelClasses}>Order Type</label>
                                    <div className="flex p-1 bg-gray-100 dark:bg-brand-darkest/50 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                        {(['Market', 'Limit'] as const).map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setOrderType(type)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${orderType === type ? 'bg-brand-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ✅ ম্যানুয়াল লিমিট প্রাইস ইনপুট (শুধুমাত্র Limit এর জন্য) */}
                                {orderType === 'Limit' && (
                                    <div className="animate-fade-in-down">
                                        <label className={labelClasses}>Manual Limit Price (Optional)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                            <input
                                                type="number"
                                                className={`${inputClasses} pl-6`}
                                                value={limitPrice}
                                                onChange={e => setLimitPrice(e.target.value)}
                                                placeholder="Signal Price"
                                            />
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-1">Leave empty to use Strategy Signal Price</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-brand-border-dark my-6"></div>

                        {/* 🔥 Section 2: Dynamic Strategy Parameters */}
                        <div>
                            <h3 className={sectionTitleClasses}>
                                Strategy Parameters ({strategy})
                                {isLoadingParams && <span className="text-xs text-brand-primary font-normal ml-2 animate-pulse">Loading params...</span>}
                            </h3>

                            {Object.keys(dynamicParamsSchema).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {Object.entries(dynamicParamsSchema).map(([key, config]: [string, any]) => (
                                        <div key={key}>
                                            <label className={labelClasses} title={key}>{config.label || key}</label>
                                            <input
                                                type="number" // Currently handling all as number
                                                className={inputClasses}
                                                value={paramValues[key] ?? config.default}
                                                onChange={e => setParamValues({ ...paramValues, [key]: Number(e.target.value) })}
                                                step={config.step || "any"}
                                                min={config.min}
                                                max={config.max}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 bg-gray-100 dark:bg-brand-darkest/50 rounded-xl text-center text-gray-500 text-sm">
                                    {isLoadingParams ? "Fetching parameters..." : "No configurable parameters detected for this strategy."}
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-brand-border-dark my-6"></div>

                        {/* Section 3: Risk Management */}
                        <div>
                            <h3 className={sectionTitleClasses}>Risk Management</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className={labelClasses}>Static Stop Loss %</label>
                                    <input type="number" className={inputClasses} value={riskParams.stopLoss} onChange={e => setRiskParams({ ...riskParams, stopLoss: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Static Take Profit %</label>
                                    <input type="number" className={inputClasses} value={riskParams.takeProfit} onChange={e => setRiskParams({ ...riskParams, takeProfit: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className={labelClasses}>Position Size % of Portfolio</label>
                                    <input type="number" className={inputClasses} value={riskParams.positionSize} onChange={e => setRiskParams({ ...riskParams, positionSize: Number(e.target.value) })} />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-brand-border-dark my-6"></div>

                        {/* Section 4: Advanced Tools */}
                        <div>
                            <h3 className={sectionTitleClasses}>Advanced Tools</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                    <Checkbox checked={advanced.trailingSl} onChange={v => setAdvanced({ ...advanced, trailingSl: v })} label="Enable Trailing Stop Loss" />
                                    {advanced.trailingSl && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Trail %:</span>
                                            <input type="number" className={`${inputClasses} !w-24 !py-1`} value={advanced.trailingSlVal} onChange={e => setAdvanced({ ...advanced, trailingSlVal: Number(e.target.value) })} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                    <Checkbox checked={advanced.dailyLoss} onChange={v => setAdvanced({ ...advanced, dailyLoss: v })} label="Enable Daily Loss Limit" />
                                    {advanced.dailyLoss && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Limit %:</span>
                                            <input type="number" className={`${inputClasses} !w-24 !py-1`} value={advanced.dailyLossVal} onChange={e => setAdvanced({ ...advanced, dailyLossVal: Number(e.target.value) })} />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                    <Checkbox checked={advanced.regimeFilter} onChange={v => setAdvanced({ ...advanced, regimeFilter: v })} label="Enable Market Regime Filter (using EMA)" />
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                    <Checkbox checked={advanced.sentiment} onChange={v => setAdvanced({ ...advanced, sentiment: v })} label="Enable Sentiment Analysis" />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-200 dark:bg-brand-border-dark my-6"></div>

                        {/* Section 5: Notifications */}
                        <div>
                            <h3 className={sectionTitleClasses}>Notification Settings</h3>
                            <div className="p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-gray-200 dark:border-brand-border-dark">
                                <Checkbox checked={notifications.telegram} onChange={v => setNotifications({ ...notifications, telegram: v })} label="Enable Telegram Notifications" />
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30 flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="create-bot-form" variant="primary" className="shadow-lg shadow-brand-primary/20">Create Bot</Button>
                </div>
            </div>
        </div>
    );
}


const BotLab: React.FC = () => {
    const [isCreating, setIsCreating] = useState(false);
    const [isVisualBuilderOpen, setIsVisualBuilderOpen] = useState(false);
    const [bots, setBots] = useState<ActiveBot[]>([]);
    const { showToast } = useToast();

    const [isBacktestModalOpen, setIsBacktestModalOpen] = useState(false);
    const [selectedBot, setSelectedBot] = useState<ActiveBot | null>(null);
    const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

    // ✅ ১. পেজ লোড হলে ব্যাকএন্ড থেকে বট লোড করা
    useEffect(() => {
        loadBots();
    }, []);

    const loadBots = async () => {
        try {
            const data = await botService.getAllBots();
            setBots(data);
        } catch (error) {
            console.error("Failed to load bots", error);
            showToast("Failed to load bots", "error");
        }
    };

    // লাইভ PnL আপডেট পাওয়ার জন্য (Polling)
    useEffect(() => {
        const interval = setInterval(() => {
            if (bots.some(b => b.status === 'active')) {
                loadBots();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [bots]);

    const handleRunBacktest = (bot: ActiveBot) => {
        showToast(`Starting backtest for ${bot.name}...`, 'info');
        setTimeout(() => {
            const mockResult: BacktestResult = {
                ...MOCK_BACKTEST_RESULTS[0],
                id: `backtest_${bot.id}`,
                market: bot.market,
                strategy: bot.strategy,
                date: new Date().toISOString().split('T')[0],
                profitPercent: (Math.random() * 120) - 20,
                maxDrawdown: Math.random() * 30,
                winRate: 40 + Math.random() * 50,
                sharpeRatio: Math.random() * 3,
            };
            setBacktestResult(mockResult);
            setSelectedBot(bot);
            setIsBacktestModalOpen(true);
        }, 1500);
    };

    // ✅ ২. নতুন বট তৈরি হ্যান্ডলার আপডেট
    const handleCreateBot = async (newBotData: any) => {
        try {
            const createdBot = await botService.createBot(newBotData);
            setBots(prev => [createdBot, ...prev]);
            showToast(`Bot "${createdBot.name}" launched successfully!`, 'success');
        } catch (error) {
            console.error(error);
            showToast("Failed to create bot", "error");
        }
    };

    const handleSaveVisualStrategy = (name: string) => {
        const newBot: ActiveBot = {
            id: `bot_visual_${Date.now()}`,
            name: name,
            market: 'BTC/USDT',
            strategy: 'Custom Visual Strategy',
            pnl: 0,
            pnlPercent: 0,
            status: 'active',
            isRegimeAware: true,
        };
        // ভিজ্যুয়াল স্ট্র্যাটেজির জন্য এখনো ব্যাকএন্ড তৈরি হয়নি, তাই এটি আগের মতোই থাকল
        setBots(prev => [newBot, ...prev]);
        setIsVisualBuilderOpen(false);
        showToast(`Visual Strategy "${name}" deployed!`, 'success');
    };

    // ✅ ৩. স্ট্যাটাস টগল (Start/Stop) হ্যান্ডলার আপডেট
    const handleToggleStatus = async (id: string) => {
        const bot = bots.find(b => b.id === id);
        if (!bot) return;

        const action = bot.status === 'active' ? 'stop' : 'start';

        try {
            // অপটিমিস্টিক আপডেট
            setBots(prev => prev.map(b => b.id === id ? { ...b, status: action === 'start' ? 'active' : 'inactive' } : b));

            await botService.controlBot(id, action);

            showToast(`${bot.name} is now ${action === 'start' ? 'Running' : 'Stopped'}.`, 'success');
        } catch (error) {
            loadBots();
            showToast(`Failed to ${action} bot`, "error");
        }
    };

    // ✅ ৪. ডিলেট হ্যান্ডলার
    const handleDeleteBot = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
            return;
        }

        try {
            await botService.deleteBot(id);
            setBots(prev => prev.filter(b => b.id !== id));
            showToast("Bot deleted successfully", "success");
        } catch (error) {
            console.error(error);
            showToast("Failed to delete bot", "error");
        }
    };

    return (
        <div className="space-y-8">
            {isCreating && <CreateBotModal onClose={() => setIsCreating(false)} onCreateBot={handleCreateBot} showToast={showToast} />}
            {isVisualBuilderOpen && <VisualStrategyBuilderModal onClose={() => setIsVisualBuilderOpen(false)} onSave={handleSaveVisualStrategy} />}

            {isBacktestModalOpen && selectedBot && backtestResult && (
                <BacktestResultModal
                    bot={selectedBot}
                    result={backtestResult}
                    onClose={() => setIsBacktestModalOpen(false)}
                />
            )}

            <div className="flex justify-between items-end staggered-fade-in" style={{ animationDelay: '50ms' }}>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bot Laboratory</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor, manage, and deploy your algorithmic trading fleet.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setIsVisualBuilderOpen(true)} className="flex items-center gap-2">
                        <BuildIcon /> Visual Builder
                    </Button>
                    <Button variant="primary" onClick={() => setIsCreating(true)} className="shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-shadow flex items-center gap-2">
                        <PlusIcon /> New Bot
                    </Button>
                </div>
            </div>

            <BotLabHeader bots={bots} onOpenCreate={() => setIsCreating(true)} />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {bots.map((bot, index) => (
                    <BotCard
                        key={bot.id}
                        bot={bot}
                        index={index}
                        onRunBacktest={handleRunBacktest}
                        onToggleStatus={handleToggleStatus}
                        onDelete={handleDeleteBot}
                    />
                ))}

                {/* Add New Placeholder Card */}
                <button
                    onClick={() => setIsCreating(true)}
                    className="group relative h-full min-h-[320px] border-2 border-dashed border-gray-300 dark:border-brand-border-dark rounded-2xl flex flex-col items-center justify-center text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-300 staggered-fade-in"
                    style={{ animationDelay: `${bots.length * 100}ms` }}
                >
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-brand-darkest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:bg-brand-primary/10">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 group-hover:text-brand-primary transition-colors">Deploy New Bot</h3>
                    <p className="text-sm text-gray-400 max-w-[200px] mt-2">Launch a pre-built strategy or connect a custom model.</p>
                </button>
            </div>
        </div>
    );
};

export default BotLab;
