
import React, { useState, useMemo } from 'react';
import Card from '@/components/common/Card';
import { MOCK_ANALYST_RATINGS, MOCK_RESEARCH_REPORTS } from '@/constants';
import type { AnalystRating } from '@/types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useTheme } from '@/context/ThemeContext';

const MOCK_STOCKS = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL'];

// Mock current prices for the visualization
const MOCK_PRICES: Record<string, number> = {
    'AAPL': 190.50,
    'TSLA': 175.20,
    'MSFT': 425.00,
    'NVDA': 120.00,
    'GOOGL': 175.00
};

// --- Sub-Components ---

const ConsensusRing: React.FC<{ data: any[], dominantRating: string }> = ({ data, dominantRating }) => {
    const { theme } = useTheme();
    return (
        <div className="relative h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' } : { borderRadius: '8px' }}
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                    />
                </PieChart>
            </ResponsiveContainer>
            
            {/* Center Stats */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Consensus</span>
                <span className={`text-xl font-extrabold ${
                    dominantRating.includes('Buy') ? 'text-emerald-500' : 
                    dominantRating.includes('Sell') ? 'text-rose-500' : 'text-amber-500'
                }`}>
                    {dominantRating.toUpperCase()}
                </span>
            </div>
        </div>
    );
};

const PriceTargetVisualizer: React.FC<{ low: number, avg: number, high: number, current: number }> = ({ low, avg, high, current }) => {
    // Calculate positions as percentages relative to the range [min(low, current) * 0.9, max(high, current) * 1.1]
    const minVal = Math.min(low, current) * 0.85;
    const maxVal = Math.max(high, current) * 1.1;
    const range = maxVal - minVal;

    const getPercent = (val: number) => ((val - minVal) / range) * 100;

    const lowPct = getPercent(low);
    const highPct = getPercent(high);
    const avgPct = getPercent(avg);
    const currentPct = getPercent(current);

    return (
        <div className="relative h-24 w-full mt-6 select-none">
            {/* Background Track */}
            <div className="absolute top-10 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>

            {/* Target Range Bar */}
            <div 
                className="absolute top-10 h-2 bg-gradient-to-r from-emerald-500/40 to-emerald-500 rounded-full"
                style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
            ></div>

            {/* Markers */}
            
            {/* Low */}
            <div className="absolute top-5 flex flex-col items-center transform -translate-x-1/2" style={{ left: `${lowPct}%` }}>
                <span className="text-[10px] font-bold text-rose-500 mb-1">${low}</span>
                <div className="w-px h-8 bg-rose-500/50"></div>
                <span className="text-[10px] text-gray-400 mt-1">Low</span>
            </div>

            {/* High */}
            <div className="absolute top-5 flex flex-col items-center transform -translate-x-1/2" style={{ left: `${highPct}%` }}>
                <span className="text-[10px] font-bold text-emerald-500 mb-1">${high}</span>
                <div className="w-px h-8 bg-emerald-500/50"></div>
                <span className="text-[10px] text-gray-400 mt-1">High</span>
            </div>

            {/* Average (Diamond) */}
            <div className="absolute top-8 flex flex-col items-center transform -translate-x-1/2 z-10" style={{ left: `${avgPct}%` }}>
                 <div className="w-4 h-4 bg-white dark:bg-brand-dark border-2 border-brand-primary rotate-45 transform translate-y-1.5 shadow-lg"></div>
                 <span className="text-xs font-bold text-brand-primary mt-4">${avg}</span>
                 <span className="text-[10px] text-gray-400">Avg</span>
            </div>

            {/* Current Price (Pulsing Dot) */}
            <div className="absolute top-9 flex flex-col items-center transform -translate-x-1/2 z-20" style={{ left: `${currentPct}%` }}>
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white dark:border-brand-darkest"></span>
                </span>
                <div className="mt-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    Now: ${current}
                </div>
            </div>
        </div>
    );
};

const RatingCard: React.FC<{ rating: AnalystRating }> = ({ rating }) => {
    let borderColor = 'border-l-gray-400';
    let badgeColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    
    const r = rating.rating.toLowerCase();
    if (r.includes('buy') || r.includes('overweight')) {
        borderColor = 'border-l-emerald-500';
        badgeColor = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    } else if (r.includes('sell') || r.includes('underweight')) {
        borderColor = 'border-l-rose-500';
        badgeColor = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    } else {
        borderColor = 'border-l-amber-500';
        badgeColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    }

    return (
        <div className={`group relative p-4 bg-white dark:bg-brand-dark border-y border-r border-gray-100 dark:border-brand-border-dark rounded-r-xl border-l-4 ${borderColor} shadow-sm hover:shadow-md hover:translate-x-1 transition-all duration-200`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{rating.firm}</h4>
                    <p className="text-xs text-gray-400 font-mono">{rating.date}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${badgeColor}`}>
                    {rating.rating}
                </span>
            </div>
            <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">Target</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {rating.priceTarget ? `$${rating.priceTarget.toFixed(2)}` : 'N/A'}
                </span>
            </div>
        </div>
    );
};

// --- Main Component ---

const AnalystResearch: React.FC = () => {
    const [activeStock, setActiveStock] = useState(MOCK_STOCKS[0]);

    const ratingsData = useMemo(() => MOCK_ANALYST_RATINGS[activeStock] || [], [activeStock]);
    const reportsData = useMemo(() => MOCK_RESEARCH_REPORTS[activeStock] || [], [activeStock]);
    const currentPrice = MOCK_PRICES[activeStock] || 150; // Fallback

    // Calculate Stats
    const ratingsSummary = useMemo(() => {
        const summary = { 'Buy': 0, 'Hold': 0, 'Sell': 0 };
        ratingsData.forEach(r => {
            const rating = r.rating.toLowerCase();
            if (rating.includes('buy') || rating.includes('overweight')) summary['Buy']++;
            else if (rating.includes('sell') || rating.includes('underweight')) summary['Sell']++;
            else summary['Hold']++;
        });
        
        const total = ratingsData.length;
        let dominant = 'Neutral';
        if (summary.Buy > summary.Hold && summary.Buy > summary.Sell) dominant = 'Strong Buy';
        else if (summary.Sell > summary.Buy && summary.Sell > summary.Hold) dominant = 'Strong Sell';
        else if (summary.Hold > 0) dominant = 'Hold';

        return {
            data: [
                { name: 'Buy', value: summary.Buy, color: '#10B981' },
                { name: 'Hold', value: summary.Hold, color: '#FBBF24' },
                { name: 'Sell', value: summary.Sell, color: '#F43F5E' },
            ].filter(d => d.value > 0),
            dominant
        };
    }, [ratingsData]);

    const priceTargetStats = useMemo(() => {
        const targets = ratingsData.map(r => r.priceTarget).filter((pt): pt is number => pt !== null);
        if (targets.length === 0) return { high: 0, avg: 0, low: 0, upside: 0 };
        
        const avg = targets.reduce((a, b) => a + b, 0) / targets.length;
        return {
            high: Math.max(...targets),
            avg: Number(avg.toFixed(2)),
            low: Math.min(...targets),
            upside: ((avg - currentPrice) / currentPrice) * 100
        };
    }, [ratingsData, currentPrice]);

    return (
        <div className="space-y-8 animate-fade-in-slide-up">
            
            {/* Header & Selector */}
            <Card className="!p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                            <svg className="w-8 h-8 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Analyst Intelligence</h2>
                            <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Institutional Consensus Engine</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-black/30 p-1.5 rounded-xl border border-white/10">
                         <span className="text-xs font-bold text-gray-400 px-2">TICKER:</span>
                         <select
                            value={activeStock}
                            onChange={(e) => setActiveStock(e.target.value)}
                            className="bg-transparent text-lg font-bold text-brand-primary focus:outline-none cursor-pointer"
                        >
                            {MOCK_STOCKS.map(stock => <option key={stock} value={stock} className="text-black">{stock}</option>)}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Top Section: Consensus & Targets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Consensus Ring */}
                <Card className="flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Wall St. Consensus</h3>
                        <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded text-xs font-mono">{ratingsData.length} Ratings</span>
                    </div>
                    <ConsensusRing data={ratingsSummary.data} dominantRating={ratingsSummary.dominant} />
                    <div className="flex justify-around mt-4 pt-4 border-t border-gray-100 dark:border-white/10 text-xs font-bold">
                        <div className="text-emerald-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> {ratingsSummary.data.find(d => d.name === 'Buy')?.value || 0} Buy</div>
                        <div className="text-amber-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> {ratingsSummary.data.find(d => d.name === 'Hold')?.value || 0} Hold</div>
                        <div className="text-rose-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> {ratingsSummary.data.find(d => d.name === 'Sell')?.value || 0} Sell</div>
                    </div>
                </Card>

                {/* 2. Upside Potential */}
                <Card className="flex flex-col justify-center items-center text-center relative overflow-hidden">
                     <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${priceTargetStats.upside > 0 ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-red-500'}`}></div>
                     
                     <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Implied Upside (12m)</p>
                     
                     <div className="relative">
                        <h3 className={`text-5xl font-extrabold ${priceTargetStats.upside > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {priceTargetStats.upside > 0 ? '+' : ''}{priceTargetStats.upside.toFixed(1)}%
                        </h3>
                        {priceTargetStats.upside > 15 && (
                            <span className="absolute -top-2 -right-4 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        )}
                     </div>
                     
                     <p className="text-sm text-gray-500 mt-4">
                         Based on avg target of <span className="font-bold text-slate-900 dark:text-white">${priceTargetStats.avg}</span>
                     </p>
                </Card>

                {/* 3. Price Target Visualizer */}
                <Card className="flex flex-col">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Price Target Spectrum</h3>
                     <div className="flex-grow flex items-center">
                        <PriceTargetVisualizer 
                            low={priceTargetStats.low} 
                            avg={priceTargetStats.avg} 
                            high={priceTargetStats.high} 
                            current={currentPrice} 
                        />
                     </div>
                     <div className="mt-6 text-center">
                         <p className="text-[10px] text-gray-400 italic">
                             Visual representation of analyst target range relative to current spot price.
                         </p>
                     </div>
                </Card>
            </div>

            {/* Bottom Section: Feed & Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Ratings Feed */}
                <div className="lg:col-span-1">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Analyst Feed</h3>
                        <button className="text-xs text-brand-primary hover:underline">View All</button>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {ratingsData.map((rating, i) => (
                            <RatingCard key={rating.id} rating={rating} />
                        ))}
                    </div>
                </div>

                {/* Right: Research Reports */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deep Dive Intelligence</h3>
                        <button className="text-xs text-brand-primary hover:underline">Access Archive</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {reportsData.map(report => (
                            <a href={report.link} key={report.id} target="_blank" rel="noopener noreferrer" className="group block p-5 bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-xl hover:shadow-lg transition-all hover:border-brand-primary/50">
                                <div className="flex flex-col sm:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase rounded border border-blue-500/20">Report</span>
                                            <span className="text-xs text-gray-400 font-mono">{report.date}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">{report.title}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{report.summary}</p>
                                    </div>
                                    <div className="flex flex-col justify-between items-end min-w-[100px]">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded">{report.source}</span>
                                        <span className="text-sm font-semibold text-brand-primary flex items-center gap-1 mt-4 sm:mt-0 group-hover:translate-x-1 transition-transform">
                                            Read Brief <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AnalystResearch;

