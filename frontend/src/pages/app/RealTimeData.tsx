
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis } from 'recharts';
import Card from '@/components/common/Card';
import { MOCK_FINANCIALS, MOCK_ECONOMIC_CALENDAR, MOCK_NEWS_FEED } from '@/constants';
import type { FinancialStatementRow, EconomicEvent, NewsArticle } from '@/types';
import { useTheme } from '@/context/ThemeContext';

// --- Utility Components ---

const AnimatedNumber: React.FC<{ value: number; currency?: boolean; percentage?: boolean }> = ({ value, currency, percentage }) => {
    const [displayValue, setDisplayValue] = useState(value);
    
    useEffect(() => {
        setDisplayValue(value);
    }, [value]);

    return (
        <span className="transition-all duration-500 ease-out font-mono">
            {currency ? '$' : ''}{displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{percentage ? '%' : ''}
        </span>
    );
};

const ImpactOrb: React.FC<{ impact: EconomicEvent['impact'] }> = ({ impact }) => {
    let colorClass = 'bg-gray-500 shadow-gray-500/50';
    let pulseClass = '';
    
    if (impact === 'High') {
        colorClass = 'bg-rose-500 shadow-rose-500/50';
        pulseClass = 'animate-pulse';
    } else if (impact === 'Medium') {
        colorClass = 'bg-amber-400 shadow-amber-400/50';
    }

    return (
        <div className={`relative w-3 h-3 rounded-full ${colorClass} shadow-[0_0_8px_currentColor] ${pulseClass}`}>
            <div className="absolute inset-0 rounded-full bg-white opacity-20"></div>
        </div>
    );
};

// --- Mock Data Augmentation ---

const MOCK_STOCKS_WITH_PRICES: Record<string, { price: number; change: number; percent: number; name: string }> = {
    'AAPL': { price: 190.58, change: 1.25, percent: 0.66, name: 'Apple Inc.' },
    'TSLA': { price: 177.48, change: -2.31, percent: -1.28, name: 'Tesla, Inc.' },
    'MSFT': { price: 427.87, change: 2.11, percent: 0.49, name: 'Microsoft Corp.' },
    'NVDA': { price: 120.91, change: -4.17, percent: -3.33, name: 'NVIDIA Corp.' },
};

// --- Sub-Components ---

const VisualFinancialTable: React.FC<{ data: FinancialStatementRow[] }> = ({ data }) => {
    if (!data || data.length === 0) return <p className="text-gray-500 p-4">No data available.</p>;

    const headers = Object.keys(data[0]).filter(key => key !== 'metric');
    
    // Helper to parse currency string to number for visualization
    const parseVal = (str: string | number) => {
        if (typeof str === 'number') return str;
        const num = parseFloat(str.replace(/[^0-9.-]+/g,""));
        const multiplier = str.includes('B') ? 1e9 : str.includes('M') ? 1e6 : 1;
        return num * multiplier;
    };

    // Find max value in the dataset to scale bars
    const maxValue = Math.max(...data.map(row => 
        Math.max(...headers.map(h => parseVal(row[h] as string)))
    ));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold w-1/3">Metric</th>
                        {headers.map(header => (
                            <th key={header} className="p-4 font-semibold text-right">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={row.metric} className="group border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <td className="p-4 font-medium text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                                {row.metric}
                            </td>
                            {headers.map(header => {
                                const val = parseVal(row[header] as string);
                                const widthPercent = Math.min(100, Math.max(0, (Math.abs(val) / maxValue) * 100));
                                
                                return (
                                    <td key={header} className="p-4 text-right font-mono relative">
                                        {/* Visual Bar Background */}
                                        <div 
                                            className={`absolute top-3 bottom-3 right-4 opacity-10 rounded-sm transition-all duration-500 ${val < 0 ? 'bg-rose-500' : 'bg-brand-primary'}`}
                                            style={{ width: `${widthPercent}%`, maxWidth: '60%' }}
                                        ></div>
                                        <span className="relative z-10 text-gray-600 dark:text-gray-300">{row[header]}</span>
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const EconomicTimeline: React.FC = () => {
    return (
        <div className="relative pl-4 border-l border-gray-200 dark:border-gray-800 space-y-8 py-2">
            {MOCK_ECONOMIC_CALENDAR.map((event, idx) => (
                <div key={event.id} className="relative pl-6 group">
                    {/* Timeline Connector */}
                    <div className="absolute -left-[21px] top-1 flex items-center justify-center bg-white dark:bg-brand-dark">
                        <ImpactOrb impact={event.impact} />
                    </div>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-xs font-mono text-gray-400 block mb-0.5">{event.time}</span>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">{event.event}</h4>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            event.impact === 'High' ? 'border-rose-500/30 text-rose-500 bg-rose-500/10' : 
                            event.impact === 'Medium' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 
                            'border-gray-500/30 text-gray-500 bg-gray-500/10'
                        }`}>
                            {event.impact.toUpperCase()}
                        </span>
                    </div>

                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs bg-gray-50 dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5">
                        <div className="text-center">
                            <span className="block text-gray-500 text-[10px] uppercase">Actual</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">{event.actual}</span>
                        </div>
                        <div className="text-center border-l border-gray-200 dark:border-white/10">
                            <span className="block text-gray-500 text-[10px] uppercase">Forecast</span>
                            <span className="font-mono text-gray-600 dark:text-gray-400">{event.forecast}</span>
                        </div>
                        <div className="text-center border-l border-gray-200 dark:border-white/10">
                            <span className="block text-gray-500 text-[10px] uppercase">Prev</span>
                            <span className="font-mono text-gray-600 dark:text-gray-400">{event.previous}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RealTimeData: React.FC = () => {
    const { theme } = useTheme();
    const [activeStock, setActiveStock] = useState('AAPL');
    const [stockData, setStockData] = useState(MOCK_STOCKS_WITH_PRICES[activeStock]);
    const [activeFinancialTab, setActiveFinancialTab] = useState<'income' | 'balance' | 'cashFlow'>('income');
    
    // Simulated Sparkline Data
    const [sparkData, setSparkData] = useState<{i: number, v: number}[]>(
        Array.from({length: 40}, (_, i) => ({i, v: MOCK_STOCKS_WITH_PRICES[activeStock].price + Math.random() * 2}))
    );

    useEffect(() => {
        // Reset data when stock changes
        setStockData(MOCK_STOCKS_WITH_PRICES[activeStock]);
        setSparkData(Array.from({length: 40}, (_, i) => ({i, v: MOCK_STOCKS_WITH_PRICES[activeStock].price + Math.random() * 2})));

        const interval = setInterval(() => {
            setStockData(prevData => {
                const volatility = prevData.price * 0.002;
                const priceChange = (Math.random() - 0.5) * volatility;
                const newPrice = prevData.price + priceChange;
                const newChange = newPrice - (prevData.price - prevData.change);
                const newPercent = (newChange / (newPrice - newChange)) * 100;
                
                // Update sparkline
                setSparkData(prevSpark => [...prevSpark.slice(1), { i: prevSpark[prevSpark.length-1].i + 1, v: newPrice }]);

                return { ...prevData, price: newPrice, change: newChange, percent: newPercent };
            });
        }, 1000); // Faster tick for "Real-time" feel

        return () => clearInterval(interval);
    }, [activeStock]);
    
    const financialData = useMemo(() => MOCK_FINANCIALS[activeStock] || MOCK_FINANCIALS['TSLA'], [activeStock]);
    const newsData = useMemo(() => MOCK_NEWS_FEED[activeStock] || [], [activeStock]);
    
    const isPositive = stockData.change >= 0;
    const trendColor = isPositive ? '#10B981' : '#F43F5E'; // Emerald vs Rose

    return (
        <div className="flex flex-col gap-6 h-full overflow-hidden animate-fade-in-slide-up">
            
            {/* The Pulse Header */}
            <div className="relative rounded-2xl bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark overflow-hidden shadow-lg flex-shrink-0">
                 {/* Background Sparkline Area */}
                 <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparkData}>
                            <defs>
                                <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={trendColor} stopOpacity={0.8}/>
                                    <stop offset="100%" stopColor={trendColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="v" stroke={trendColor} strokeWidth={2} fill="url(#pulseGradient)" isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                 </div>

                 <div className="relative z-10 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    
                    {/* Asset Selector & Info */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative">
                            <select
                                value={activeStock}
                                onChange={(e) => setActiveStock(e.target.value)}
                                className="appearance-none bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-10 text-2xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                            >
                                {Object.keys(MOCK_STOCKS_WITH_PRICES).map(stock => <option key={stock} value={stock}>{stock}</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stockData.name}</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-xs text-green-500 font-mono font-bold">MARKET OPEN</span>
                            </div>
                        </div>
                    </div>

                    {/* Big Price Display */}
                    <div className="flex flex-col items-end">
                        <div className={`text-5xl md:text-6xl font-mono font-bold tracking-tighter transition-colors duration-300 ${isPositive ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                            <AnimatedNumber value={stockData.price} currency />
                        </div>
                        <div className={`flex items-center gap-2 text-lg font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                             <span>{isPositive ? '▲' : '▼'} <AnimatedNumber value={Math.abs(stockData.change)} currency /></span>
                             <span className="bg-current opacity-20 w-px h-4"></span>
                             <span><AnimatedNumber value={Math.abs(stockData.percent)} percentage /></span>
                        </div>
                    </div>

                 </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* Left Column: Financial X-Ray */}
                <div className="xl:col-span-2 flex flex-col min-h-0">
                    <Card className="flex-1 flex flex-col !p-0 overflow-hidden border border-gray-200 dark:border-brand-border-dark shadow-lg">
                        <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-200 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                Financial X-Ray
                            </h2>
                            
                            <div className="flex p-1 bg-gray-200 dark:bg-white/10 rounded-lg">
                                {(['income', 'balance', 'cashFlow'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveFinancialTab(tab)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                            activeFinancialTab === tab
                                                ? 'bg-white dark:bg-brand-primary text-slate-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                                        }`}
                                    >
                                        {tab === 'income' ? 'Income' : tab === 'balance' ? 'Balance' : 'Cash Flow'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-brand-dark">
                            <VisualFinancialTable data={financialData[activeFinancialTab]} />
                        </div>
                    </Card>
                </div>

                {/* Right Column: Calendar & Feed */}
                <div className="xl:col-span-1 flex flex-col gap-6 min-h-0">
                    
                    {/* Economic Radar */}
                    <Card className="flex-1 flex flex-col !p-0 border border-gray-200 dark:border-brand-border-dark shadow-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Economic Radar
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                            <EconomicTimeline />
                        </div>
                    </Card>

                    {/* Flash Feed */}
                    <Card className="flex-1 flex flex-col !p-0 border border-gray-200 dark:border-brand-border-dark shadow-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/50">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                Flash Feed
                            </h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {newsData.map(article => (
                                <a 
                                    href={article.link} 
                                    key={article.id} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="block p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded">{article.source}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{article.timestamp}</span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-gray-200 group-hover:text-brand-primary transition-colors leading-snug">
                                        {article.headline}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default RealTimeData;

