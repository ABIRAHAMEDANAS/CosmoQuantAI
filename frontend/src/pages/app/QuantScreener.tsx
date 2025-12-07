
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import Card from '@/components/common/Card';
import { MOCK_SCREENER_RESULTS, MOCK_SECTOR_PERFORMANCE } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import type { ScreenerResult } from '@/types';

// Icons
const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.536a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);

const FilterSlider: React.FC<{
    label: string;
    filterKey: string;
    min: number;
    max: number;
    step: number;
    values: { min: number; max: number };
    onChange: (key: string, type: 'min' | 'max', val: number) => void;
}> = ({ label, filterKey, min, max, step, values, onChange }) => {
    // Calculate percentage for gradient track
    const minPos = ((values.min - min) / (max - min)) * 100;
    const maxPos = ((values.max - min) / (max - min)) * 100;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
                <div className="flex gap-2 font-mono text-xs text-brand-primary font-bold">
                    <span>{values.min}</span>
                    <span className="text-gray-400">-</span>
                    <span>{values.max}</span>
                </div>
            </div>
            <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-brand-dark">
                <div 
                    className="absolute h-full bg-brand-primary/50 rounded-full" 
                    style={{ left: `${minPos}%`, right: `${100 - maxPos}%` }}
                ></div>
                
                {/* Invisible sliders on top */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={values.min}
                    onChange={(e) => {
                        const val = Math.min(Number(e.target.value), values.max - step);
                        onChange(filterKey, 'min', val);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                />
                 <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={values.max}
                    onChange={(e) => {
                        const val = Math.max(Number(e.target.value), values.min + step);
                        onChange(filterKey, 'max', val);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto"
                />
                
                {/* Visual Thumbs */}
                <div 
                    className="absolute top-1/2 w-4 h-4 bg-white border-2 border-brand-primary rounded-full shadow-md transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ left: `${minPos}%` }}
                ></div>
                <div 
                    className="absolute top-1/2 w-4 h-4 bg-white border-2 border-brand-primary rounded-full shadow-md transform -translate-y-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ left: `${maxPos}%` }}
                ></div>
            </div>
        </div>
    );
};

const Screener: React.FC = () => {
    const [showFilters, setShowFilters] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        marketCap: { min: 0, max: 4000 },
        peRatio: { min: 0, max: 80 },
        rsi: { min: 0, max: 100 },
    });

    const handleFilterChange = (filterName: string, type: 'min' | 'max', value: number) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: { ...prev[filterName as keyof typeof filters], [type]: value }
        }));
    };

    const filteredResults = useMemo(() => {
        return MOCK_SCREENER_RESULTS.filter(stock =>
            stock.ticker.toLowerCase().includes(searchQuery.toLowerCase()) &&
            stock.marketCap >= filters.marketCap.min &&
            stock.marketCap <= filters.marketCap.max &&
            stock.peRatio >= filters.peRatio.min &&
            stock.peRatio <= filters.peRatio.max &&
            stock.rsi >= filters.rsi.min &&
            stock.rsi <= filters.rsi.max
        );
    }, [filters, searchQuery]);

    const maxMarketCap = Math.max(...MOCK_SCREENER_RESULTS.map(s => s.marketCap));

    return (
        <div className="flex flex-col gap-6">
            {/* Filter Command Deck */}
            <Card className="!p-0 overflow-hidden border border-gray-200 dark:border-brand-border-dark bg-white dark:bg-brand-dark shadow-lg transition-all duration-300">
                <div className="p-4 flex flex-wrap items-center justify-between gap-4 bg-gray-50 dark:bg-brand-darkest/50 border-b border-gray-200 dark:border-brand-border-dark">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                            <FilterIcon />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Quant Filter Deck</h3>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-grow justify-end">
                        <div className="relative max-w-xs w-full">
                            <input 
                                type="text" 
                                placeholder="Search Ticker..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <SearchIcon />
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors border ${showFilters ? 'bg-brand-primary text-white border-brand-primary' : 'bg-transparent text-gray-500 border-gray-200 dark:border-gray-700'}`}
                        >
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                    </div>
                </div>

                {showFilters && (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in-down">
                        <FilterSlider 
                            label="Market Cap ($B)" 
                            filterKey="marketCap" 
                            min={0} max={4000} step={10} 
                            values={filters.marketCap}
                            onChange={handleFilterChange}
                        />
                        <FilterSlider 
                            label="P/E Ratio" 
                            filterKey="peRatio" 
                            min={0} max={100} step={1} 
                            values={filters.peRatio}
                            onChange={handleFilterChange}
                        />
                        <FilterSlider 
                            label="RSI (14)" 
                            filterKey="rsi" 
                            min={0} max={100} step={1} 
                            values={filters.rsi}
                            onChange={handleFilterChange}
                        />
                    </div>
                )}
            </Card>

            {/* Results Grid */}
            <Card className="flex-1 !p-0 overflow-hidden border-0 shadow-xl bg-white dark:bg-brand-dark">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-brand-darkest/50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-brand-border-dark">
                            <tr>
                                <th className="p-5">Ticker</th>
                                <th className="p-5 w-1/5">Market Cap</th>
                                <th className="p-5 text-right">P/E Ratio</th>
                                <th className="p-5 text-right">Div Yield</th>
                                <th className="p-5 w-1/5">RSI Strength</th>
                                <th className="p-5 text-right">Volume</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-brand-border-dark">
                            {filteredResults.map((stock, idx) => (
                                <tr key={stock.id} className="group hover:bg-gray-50 dark:hover:bg-brand-darkest/30 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md`} style={{ backgroundColor: `hsl(${idx * 40}, 70%, 50%)` }}>
                                                {stock.ticker[0]}
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white text-base">{stock.ticker}</span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-mono text-xs text-gray-600 dark:text-gray-300 text-right">${stock.marketCap.toLocaleString()}B</span>
                                            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-brand-primary" 
                                                    style={{ width: `${(stock.marketCap / maxMarketCap) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-mono font-bold ${stock.peRatio < 20 ? 'bg-emerald-500/10 text-emerald-500' : stock.peRatio > 50 ? 'bg-rose-500/10 text-rose-500' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                                            {stock.peRatio.toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="p-5 text-right font-mono text-gray-600 dark:text-gray-300">
                                        {stock.dividendYield.toFixed(2)}%
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-mono font-bold w-6 ${stock.rsi > 70 ? 'text-rose-500' : stock.rsi < 30 ? 'text-emerald-500' : 'text-gray-500'}`}>{stock.rsi}</span>
                                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                                {/* Zones */}
                                                <div className="absolute left-0 w-[30%] h-full bg-emerald-500/20"></div>
                                                <div className="absolute right-0 w-[30%] h-full bg-rose-500/20"></div>
                                                {/* Indicator */}
                                                <div 
                                                    className={`absolute top-0 bottom-0 w-1.5 rounded-full transition-all duration-500 ${stock.rsi > 70 ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.5)]' : stock.rsi < 30 ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-gray-400'}`}
                                                    style={{ left: `${stock.rsi}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                        {stock.volume.toFixed(1)}M
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredResults.length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                            No assets match your criteria. Adjust filters to explore more.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
};

const CorrelationTracker: React.FC = () => {
    const assets = MOCK_SCREENER_RESULTS.map(s => s.ticker);
    const [asset1, setAsset1] = useState(assets[0]);
    const [asset2, setAsset2] = useState(assets[1]);
    
    // Mock correlation calculation
    const correlation = useMemo(() => {
        if (asset1 === asset2) return 1.0;
        const combined = [asset1, asset2].sort().join('');
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            hash = combined.charCodeAt(i) + ((hash << 5) - hash);
        }
        return ((hash % 2000) / 1000) - 1;
    }, [asset1, asset2]);

    const getCorrelationColor = (value: number) => {
        if (value > 0.75) return 'text-emerald-500';
        if (value > 0.25) return 'text-emerald-400';
        if (value < -0.75) return 'text-rose-500';
        if (value < -0.25) return 'text-rose-400';
        return 'text-gray-400';
    };
    
    const pulseSpeed = Math.max(0.5, 2 - Math.abs(correlation) * 1.5); // Faster pulse for higher correlation

    return (
        <Card className="relative overflow-hidden">
            {/* Background Graph Paper Effect */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-8 text-center">Correlation Network</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 relative z-10 py-10">
                {/* Asset 1 */}
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-white dark:bg-brand-dark border-4 border-gray-200 dark:border-brand-border-dark flex flex-col items-center justify-center shadow-xl z-20 relative">
                        <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xl mb-2">
                            {asset1[0]}
                        </div>
                        <select 
                            value={asset1} 
                            onChange={e => setAsset1(e.target.value)} 
                            className="bg-transparent text-center font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none hover:text-brand-primary transition-colors"
                        >
                            {assets.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    {/* Glow */}
                    <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Connection Line & Data */}
                <div className="flex-1 flex flex-col items-center relative w-full md:w-auto">
                    {/* The Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full overflow-hidden">
                        {/* Animated Pulse */}
                         <div 
                            className={`absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50 animate-shimmer`}
                            style={{ animationDuration: `${pulseSpeed}s` }}
                        ></div>
                    </div>

                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark px-6 py-3 rounded-2xl shadow-lg flex flex-col items-center">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Pearson Correlation</span>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-mono font-bold ${getCorrelationColor(correlation)}`}>
                                {correlation > 0 ? '+' : ''}{correlation.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    
                    <div className={`mt-4 text-xs font-bold px-3 py-1 rounded-full border ${Math.abs(correlation) > 0.7 ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'}`}>
                        {Math.abs(correlation) > 0.75 ? 'Strong Correlation' : Math.abs(correlation) > 0.3 ? 'Moderate Correlation' : 'Weak / No Correlation'}
                    </div>
                </div>

                {/* Asset 2 */}
                <div className="relative group">
                     <div className="w-32 h-32 rounded-full bg-white dark:bg-brand-dark border-4 border-gray-200 dark:border-brand-border-dark flex flex-col items-center justify-center shadow-xl z-20 relative">
                         <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold text-xl mb-2">
                            {asset2[0]}
                        </div>
                        <select 
                            value={asset2} 
                            onChange={e => setAsset2(e.target.value)} 
                            className="bg-transparent text-center font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none hover:text-purple-500 transition-colors"
                        >
                            {assets.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
            </div>
            
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                .animate-shimmer {
                    animation-name: shimmer;
                    animation-iteration-count: infinite;
                    animation-timing-function: linear;
                }
            `}</style>
        </Card>
    );
};

const SectorAnalysis: React.FC = () => {
    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
    
    const sortedData = [...MOCK_SECTOR_PERFORMANCE].sort((a,b) => a.performance - b.performance);

    return (
        <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sector Alpha (YTD)</h3>
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded font-bold">LIVE</span>
            </div>
            <div className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        layout="vertical" 
                        data={sortedData} 
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        barSize={20}
                    >
                        <defs>
                            <linearGradient id="posBar" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#10B981" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
                            </linearGradient>
                            <linearGradient id="negBar" x1="1" y1="0" x2="0" y2="0">
                                <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.6}/>
                                <stop offset="100%" stopColor="#F43F5E" stopOpacity={1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                        <XAxis type="number" stroke={axisColor} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke={axisColor} width={120} tick={{fontSize: 11}} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' } : { borderRadius: '8px' }}
                            cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Performance']}
                        />
                        <Bar dataKey="performance" radius={[0, 4, 4, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.performance >= 0 ? 'url(#posBar)' : 'url(#negBar)'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const QuantScreener: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'screener' | 'correlation' | 'sector'>('screener');

    const renderContent = () => {
        switch (activeTab) {
            case 'screener': return <Screener />;
            case 'correlation': return <CorrelationTracker />;
            case 'sector': return <SectorAnalysis />;
            default: return <Screener />;
        }
    };
    
    const TabButton: React.FC<{
        tabId: 'screener' | 'correlation' | 'sector';
        label: string;
        icon?: React.ReactNode;
    }> = ({ tabId, label, icon }) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`relative group flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all duration-300 ${
                activeTab === tabId
                    ? 'text-brand-primary'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            {icon}
            {label}
            {activeTab === tabId && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full"></span>
            )}
             {/* Hover glow */}
             <span className="absolute inset-0 bg-gray-100 dark:bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10 scale-90"></span>
        </button>
    );

    return (
        <div className="space-y-8 h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-dark rounded-t-2xl px-2">
                <nav className="flex space-x-2">
                    <TabButton tabId="screener" label="Multi-Factor Screener" icon={<FilterIcon />} />
                    <TabButton tabId="correlation" label="Correlation Matrix" icon={<LinkIcon />} />
                    <TabButton tabId="sector" label="Sector Heatmap" />
                </nav>
            </div>
            
            <div className="flex-1 min-h-0 animate-fade-in-slide-up" key={activeTab}>
                {renderContent()}
            </div>
        </div>
    );
};

export default QuantScreener;

