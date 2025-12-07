
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Area, AreaChart } from 'recharts';
import { MOCK_MARKETPLACE_MODELS } from '@/constants';
import type { MarketplaceModel } from '@/types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

// --- Icons ---

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
);

const StarIcon: React.FC<{ filled: boolean; className?: string }> = ({ filled, className = "w-4 h-4" }) => (
    <svg className={`${className} ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const VerifiedBadge = () => (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold uppercase tracking-wider">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        Verified
    </div>
);

// --- Helper Components ---

const Rating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => <StarIcon key={i} filled={i < Math.floor(rating)} />)}
        <span className="ml-1 text-xs font-medium text-gray-500">{rating.toFixed(1)}</span>
    </div>
);

const MetricChip: React.FC<{ label: string; value: string; positive?: boolean; highlight?: boolean }> = ({ label, value, positive, highlight }) => (
    <div className={`flex flex-col px-3 py-2 rounded-lg border ${highlight ? 'bg-brand-primary/10 border-brand-primary/30' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10'}`}>
        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">{label}</span>
        <span className={`text-sm font-bold font-mono ${positive === true ? 'text-emerald-500' : positive === false ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
            {value}
        </span>
    </div>
);

// --- Core Components ---

const FeaturedModelHero: React.FC<{ model: MarketplaceModel; onSelect: () => void }> = ({ model, onSelect }) => (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl mb-12 group cursor-pointer" onClick={onSelect}>
        {/* Dynamic Background */}
        <div className="absolute inset-0">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/30 rounded-full blur-[128px] animate-pulse"></div>
             <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                        Algorithm of the Week
                    </span>
                    <VerifiedBadge />
                </div>
                
                <div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{model.name}</h2>
                    <p className="text-lg text-gray-400 flex items-center gap-2">
                        by <span className="text-white font-semibold border-b border-dashed border-gray-600">{model.author}</span>
                    </p>
                </div>

                <p className="text-gray-300 max-w-xl leading-relaxed text-sm md:text-base">
                    {model.description}
                </p>

                <div className="flex flex-wrap gap-4">
                    <MetricChip label="Win Rate" value={`${model.performance.winRate}%`} positive={true} highlight />
                    <MetricChip label="Sharpe" value={model.performance.sharpeRatio.toFixed(2)} />
                    <MetricChip label="Return" value={`+${model.performance.avgReturn}%`} positive={true} />
                </div>

                <Button className="rounded-full px-8 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-shadow">
                    View Strategy Details
                </Button>
            </div>

            {/* Visualizer for Hero */}
            <div className="w-full md:w-1/3 h-64 bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-4 relative overflow-hidden">
                <div className="absolute top-4 left-4 text-xs font-mono text-gray-400">LIVE_PERFORMANCE_PREVIEW</div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={model.performance.last12Months}>
                        <defs>
                            <linearGradient id="heroChart" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5}/>
                                <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="profit" stroke="#8B5CF6" strokeWidth={3} fill="url(#heroChart)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    </div>
);

const ModelCard: React.FC<{ model: MarketplaceModel; onSelect: () => void; delay: number }> = ({ model, onSelect, delay }) => (
    <div 
        onClick={onSelect}
        className="group relative flex flex-col bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer animate-fade-in-up"
        style={{ animationDelay: `${delay}ms` }}
    >
        {/* Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="p-6 flex-grow relative">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-lg font-bold text-slate-700 dark:text-white shadow-inner">
                        {model.name[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight group-hover:text-brand-primary transition-colors">{model.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{model.asset} • {model.timeframe}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-lg font-bold text-slate-900 dark:text-white">${model.price}</span>
                    <span className="text-[10px] text-gray-500 uppercase">{model.subscriptionType === 'Monthly' ? '/mo' : 'one-time'}</span>
                </div>
            </div>
            
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-4 h-8 leading-relaxed">
                {model.description}
            </p>

            {/* Mini Stats Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 dark:border-white/5 mb-4">
                <div className="text-center">
                    <p className="text-[10px] text-gray-400 uppercase">Win Rate</p>
                    <p className="text-sm font-bold text-emerald-500">{model.performance.winRate}%</p>
                </div>
                <div className="text-center border-l border-gray-100 dark:border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase">Sharpe</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{model.performance.sharpeRatio.toFixed(2)}</p>
                </div>
                <div className="text-center border-l border-gray-100 dark:border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase">Drawdown</p>
                    <p className="text-sm font-bold text-rose-500">{model.performance.maxDrawdown}%</p>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <Rating rating={model.avgRating} />
                <div className="flex gap-1">
                     {model.tags.slice(0, 2).map(tag => (
                         <span key={tag} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-gray-500 dark:text-gray-400">{tag}</span>
                     ))}
                </div>
            </div>
        </div>
        
        {/* Hover "Add" Action */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    </div>
);

const ModelDetailView: React.FC<{ model: MarketplaceModel; onBack: () => void }> = ({ model, onBack }) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    
    const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';

    return (
        <div className="animate-fade-in-up">
            <button 
                onClick={onBack} 
                className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-primary transition-colors group"
            >
                <span className="p-1 rounded-full bg-gray-200 dark:bg-white/10 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </span>
                Back to Marketplace
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left: Main Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-3xl p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <svg className="w-64 h-64 text-slate-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-brand-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-brand-primary/30">
                                    {model.name[0]}
                                </div>
                                <div>
                                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{model.name}</h1>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        <span>By {model.author}</span>
                                        <span>•</span>
                                        <span className="font-mono bg-gray-100 dark:bg-white/5 px-2 rounded text-xs py-0.5">{model.id}</span>
                                        <VerifiedBadge />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {model.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                            
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Strategy Logic</h3>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                {model.description}
                                <br/><br/>
                                This model utilizes a hybrid approach, combining technical indicators with proprietary machine learning signals. It is specifically tuned for the {model.asset} market on the {model.timeframe} timeframe, optimizing for volatility capture while maintaining strict risk controls.
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <MetricChip label="Avg Return" value={`${model.performance.avgReturn}%`} positive={model.performance.avgReturn > 0} />
                                <MetricChip label="Sharpe Ratio" value={model.performance.sharpeRatio.toFixed(2)} />
                                <MetricChip label="Max Drawdown" value={`${model.performance.maxDrawdown}%`} positive={false} />
                                <MetricChip label="Win Rate" value={`${model.performance.winRate}%`} positive={true} />
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <Card>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance History</h3>
                            <div className="flex gap-2">
                                <button className="text-xs font-bold text-brand-primary px-3 py-1 bg-brand-primary/10 rounded-lg">1Y</button>
                                <button className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-1">ALL</button>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={model.performance.last12Months}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#E2E8F0'} vertical={false} />
                                    <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis stroke={axisColor} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                    <Tooltip
                                        cursor={{ fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                                        contentStyle={theme === 'dark' ? { backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px' } : { borderRadius: '8px' }}
                                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Profit']}
                                    />
                                    <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                                        {model.performance.last12Months.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10B981' : '#F43F5E'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

                {/* Right: Checkout & Reviews */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary to-purple-500"></div>
                        <div className="relative z-10 text-center p-4">
                             <p className="text-gray-400 text-sm font-medium mb-2">Access this algorithm</p>
                             <div className="flex items-center justify-center gap-1 mb-1">
                                 <span className="text-5xl font-extrabold tracking-tight">${model.price}</span>
                                 <span className="text-gray-400 self-end mb-2">/{model.subscriptionType === 'Monthly' ? 'mo' : 'once'}</span>
                             </div>
                             <p className="text-xs text-emerald-400 mb-6 font-medium">Risk-free guarantee for 14 days</p>
                             
                             <Button 
                                className="w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-primary/30 hover:scale-[1.02] transition-transform"
                                onClick={() => showToast(`Subscribed to ${model.name}`, 'success')}
                             >
                                 Deploy Strategy
                             </Button>
                             
                             <p className="text-[10px] text-gray-500 mt-4">
                                 By subscribing, you agree to the <a href="#" className="underline hover:text-white">Terms of Service</a> for algo marketplace.
                             </p>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between">
                            User Reviews
                            <span className="text-xs font-normal text-gray-500">({model.reviews.length})</span>
                        </h3>
                        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                             {model.reviews.map(review => (
                                <div key={review.id} className="p-3 bg-gray-50 dark:bg-brand-darkest/50 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-slate-900 dark:text-white">{review.username}</span>
                                        <span className="text-[10px] text-gray-400">{review.date}</span>
                                    </div>
                                    <Rating rating={review.rating} />
                                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-snug">"{review.comment}"</p>
                                </div>
                             ))}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
};

const MLModelMarketplace: React.FC = () => {
    const [selectedModel, setSelectedModel] = useState<MarketplaceModel | null>(null);
    const [filter, setFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Select the highest rated or most subscribed model for the hero section
    const featuredModel = MOCK_MARKETPLACE_MODELS.reduce((prev, current) => (prev.performance.sharpeRatio > current.performance.sharpeRatio) ? prev : current);

    const filteredModels = useMemo(() => {
        return MOCK_MARKETPLACE_MODELS.filter(m => {
            const matchesFilter = filter === 'All' || m.asset === filter;
            const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
            // Don't show the featured model in the grid to avoid duplication if you want, but usually it's fine.
            // Let's exclude it from grid if it's the exact same ID
            return matchesFilter && matchesSearch && m.id !== featuredModel.id;
        });
    }, [filter, searchQuery, featuredModel]);

    if (selectedModel) {
        return <ModelDetailView model={selectedModel} onBack={() => setSelectedModel(null)} />;
    }

    return (
        <div className="space-y-8 animate-fade-in-slide-up pb-10">
            
            {/* Search & Filter Deck */}
            <Card className="!p-3 sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-brand-dark/90 border-b border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <input 
                            type="text" 
                            placeholder="Search algos, authors, or tags..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-brand-darkest border-transparent focus:border-brand-primary focus:bg-white dark:focus:bg-black rounded-xl text-sm transition-all outline-none"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                        <div className="p-2 bg-gray-100 dark:bg-brand-darkest rounded-lg text-gray-500">
                            <FilterIcon />
                        </div>
                        {['All', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => setFilter(opt)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                                    filter === opt 
                                        ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25' 
                                        : 'bg-white dark:bg-brand-darkest border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-primary/50'
                                }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Hero Section */}
            {filter === 'All' && !searchQuery && (
                <FeaturedModelHero model={featuredModel} onSelect={() => setSelectedModel(featuredModel)} />
            )}

            {/* Models Grid */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {searchQuery ? `Results for "${searchQuery}"` : 'Explore Algorithms'}
                    </h2>
                    <span className="text-xs text-gray-500">{filteredModels.length} models available</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredModels.map((model, index) => (
                        <ModelCard 
                            key={model.id} 
                            model={model} 
                            onSelect={() => setSelectedModel(model)}
                            delay={index * 100}
                        />
                    ))}
                </div>
                
                {filteredModels.length === 0 && (
                    <div className="text-center py-20 opacity-50">
                        <p className="text-lg text-gray-500 font-medium">No models found matching your criteria.</p>
                        <Button variant="secondary" className="mt-4" onClick={() => {setFilter('All'); setSearchQuery('')}}>Clear Filters</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MLModelMarketplace;

