
import React, { useState, useEffect, useRef, useMemo, useCallback, FormEvent } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import Card from '@/components/common/Card';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/common/Button';
import { ExpandIcon, CollapseIcon } from '@/constants';

interface LiquidationEvent {
    id: number;
    time: string;
    type: 'Long' | 'Short';
    amount: number;
    price: number;
    isNew?: boolean;
    isWhale?: boolean;
}

interface CldData {
    time: number;
    value: number;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const SkullIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a7 7 0 0 0-7 7v1.53a4.004 4.004 0 0 0 .994 2.634L7.96 16H6a1 1 0 0 0 0 2h12a1 1 0 0 0 0-2h-1.96l1.966-2.836A4.004 4.004 0 0 0 19 10.53V9a7 7 0 0 0-7-7Zm-2.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/>
        <path d="M8 20a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2H8Z"/>
    </svg>
);

const FireIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
    </svg>
);

const getBasePriceForSymbol = (symbol: string): number => {
    const s = symbol.toUpperCase();
    if (s.includes('ETH')) return 3500;
    if (s.includes('SOL')) return 170;
    if (s.includes('ADA')) return 0.45;
    if (s.includes('BTC')) return 68500;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 1000) + 10;
};

// Custom component for the "Kill Feed" items
const KillFeedItem: React.FC<{ event: LiquidationEvent }> = ({ event }) => {
    const isLong = event.type === 'Long';
    const bgColor = isLong ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20';
    const textColor = isLong ? 'text-rose-500' : 'text-emerald-500';
    const label = isLong ? 'Long Rekt' : 'Short Rekt';
    
    return (
        <div className={`relative flex items-center justify-between p-3 mb-2 rounded-lg border-l-4 ${isLong ? 'border-l-rose-500' : 'border-l-emerald-500'} ${bgColor} ${event.isNew ? 'animate-fade-in-right shadow-lg' : ''}`}>
            {/* Flash effect overlay */}
            {event.isNew && <div className={`absolute inset-0 opacity-20 ${isLong ? 'bg-rose-500' : 'bg-emerald-500'} animate-ping rounded-lg`}></div>}
            
            <div className="flex items-center gap-3 relative z-10">
                <div className={`p-1.5 rounded-full ${isLong ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
                    {event.isWhale ? <SkullIcon className={`w-5 h-5 ${textColor}`} /> : <FireIcon className={`w-4 h-4 ${textColor}`} />}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${textColor}`}>{label}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">{event.time}</span>
                    </div>
                    <div className="text-sm font-mono text-slate-900 dark:text-white">
                        ${event.price.toLocaleString()}
                    </div>
                </div>
            </div>
            
            <div className="text-right relative z-10">
                <div className={`font-bold font-mono ${event.isWhale ? 'text-lg' : 'text-sm'} ${textColor}`}>
                    ${(event.amount/1000).toFixed(1)}K
                </div>
                {event.isWhale && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1 rounded uppercase font-bold border border-yellow-500/30">Whale</span>}
            </div>
        </div>
    );
};

const LiquidationMap: React.FC = () => {
    const { theme } = useTheme();
    const widgetRef = useRef<any>(null);
    const chartApiRef = useRef<any>(null);
    const drawnLinesRef = useRef<any[]>([]);

    const [activePair, setActivePair] = useState('BTC/USDT');
    const [symbolInput, setSymbolInput] = useState('BTC/USDT');
    const [currentPrice, setCurrentPrice] = useState(68500);
    const [liveFeed, setLiveFeed] = useState<LiquidationEvent[]>([]);
    const [cldData, setCldData] = useState<CldData[]>([]);
    const [aggregatedStats, setAggregatedStats] = useState({ longLiqs: 0, shortLiqs: 0, totalVol: 0 });

    const [isResizing, setIsResizing] = useState(false);
    const [chartWidth, setChartWidth] = useState(70);
    const [rightPanelTab, setRightPanelTab] = useState<'feed' | 'cld'>('feed');
    const containerRef = useRef<HTMLDivElement>(null);

    const [isChartFullScreen, setIsChartFullScreen] = useState(false);
    const [widgetKey, setWidgetKey] = useState(Date.now());
    
    const [priceUpdateStatus, setPriceUpdateStatus] = useState<'up' | 'down' | 'none'>('none');
    const [highlightedLevels, setHighlightedLevels] = useState<number[]>([]);
    const [highlightLevelInput, setHighlightLevelInput] = useState('');

    // ... (Existing Resizing & FullScreen Handlers remain same for functionality) ...
    // Keeping standard logic for brevity, assume handlers from previous version are here.
    const toggleFullScreen = () => { setIsChartFullScreen(prev => !prev); setWidgetKey(Date.now()); };
    useEffect(() => { document.body.classList.toggle('body-no-scroll', isChartFullScreen); }, [isChartFullScreen]);
    const handleMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);
    const handleMouseUp = useCallback(() => { setIsResizing(false); }, []);
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const bounds = containerRef.current.getBoundingClientRect();
            const newWidth = ((e.clientX - bounds.left) / bounds.width) * 100;
            if (newWidth > 50 && newWidth < 90) setChartWidth(newWidth);
        }
    }, [isResizing]);
    useEffect(() => {
        if (isResizing) { document.addEventListener('mousemove', handleMouseMove); document.addEventListener('mouseup', handleMouseUp); }
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // ... (Data Generation Logic) ...
    useEffect(() => {
        const newPrice = getBasePriceForSymbol(activePair);
        setCurrentPrice(newPrice);
        setLiveFeed([]);
        setCldData([]);
        setAggregatedStats({ longLiqs: 0, shortLiqs: 0, totalVol: 0 });
        setWidgetKey(Date.now());
    }, [activePair]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPrice(prevPrice => {
                const basePrice = getBasePriceForSymbol(activePair);
                const priceMultiplier = basePrice * 0.001;
                const priceChange = (Math.random() - 0.5) * priceMultiplier;
                const newPrice = prevPrice + priceChange;

                setPriceUpdateStatus(priceChange > 0 ? 'up' : 'down');
                setTimeout(() => setPriceUpdateStatus('none'), 500);

                if (Math.random() > 0.5) {
                    const isLong = Math.random() > 0.5;
                    const amount = Math.random() * 100000 + 10000;
                    const newEvent: LiquidationEvent = {
                        id: Date.now(),
                        time: new Date().toLocaleTimeString(),
                        type: isLong ? 'Long' : 'Short',
                        amount: amount,
                        price: newPrice,
                        isNew: true,
                        isWhale: amount > 75000,
                    };
                
                    setLiveFeed(feed => [newEvent, ...feed.map(f => ({...f, isNew: false}))].slice(0, 30));
                    setAggregatedStats(prev => ({
                        longLiqs: prev.longLiqs + (isLong ? amount : 0),
                        shortLiqs: prev.shortLiqs + (!isLong ? amount : 0),
                        totalVol: prev.totalVol + amount
                    }));
        
                    setCldData(data => {
                        const lastValue = data[data.length - 1]?.value || 0;
                        // Long liq = sell pressure (-), Short liq = buy pressure (+)
                        const change = isLong ? -amount : amount;
                        const newValue = lastValue + change;
                        return [...data.slice(-99), { time: Date.now(), value: newValue }];
                    });
                }
                return newPrice;
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [activePair]);

    // TradingView Widget
    useEffect(() => {
        const containerId = isChartFullScreen ? `tradingview_fullscreen_liquidation_chart_${widgetKey}` : `tradingview_liquidation_chart_${widgetKey}`;
        const createWidget = () => {
            const container = document.getElementById(containerId);
            if (!container) return;
            if (widgetRef.current) { try { widgetRef.current.remove(); } catch(e) {} widgetRef.current = null; }
            
            const widget = new window.TradingView.widget({
                symbol: `BINANCE:${activePair.replace('/', '')}`,
                interval: '15',
                autosize: true,
                container_id: containerId,
                theme: theme === 'dark' ? 'Dark' : 'Light',
                style: '1',
                locale: 'en',
                toolbar_bg: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                enable_publishing: false,
                hide_side_toolbar: false,
                allow_symbol_change: false,
                studies: ["Volume@tv-basicstudies"],
                onready: () => { chartApiRef.current = widget.chart(); },
            });
            widgetRef.current = widget;
        };
        const checkLibraryAndCreate = () => { if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) createWidget(); else setTimeout(checkLibraryAndCreate, 100); }
        checkLibraryAndCreate();
        return () => { if (widgetRef.current) { try { widgetRef.current.remove(); widgetRef.current = null; chartApiRef.current = null; } catch(e) {} } };
    }, [activePair, theme, widgetKey, isChartFullScreen]);

    // Drawing Lines
    const handleAddHighlight = useCallback((level: number) => {
        if (!isNaN(level) && !highlightedLevels.includes(level)) {
            setHighlightedLevels(prev => [...prev, level].sort((a, b) => b - a));
        }
    }, [highlightedLevels]);
    const handleRemoveHighlight = (level: number) => { setHighlightedLevels(prev => prev.filter(l => l !== level)); };
    const handleHighlightSubmit = (e: FormEvent) => {
        e.preventDefault();
        const level = parseFloat(highlightLevelInput);
        if (!isNaN(level)) { handleAddHighlight(level); setHighlightLevelInput(''); }
    };
    
    useEffect(() => {
        if (chartApiRef.current) {
            drawnLinesRef.current.forEach(line => { try { chartApiRef.current.removeEntity(line.id); } catch(e) {} });
            drawnLinesRef.current = [];
            highlightedLevels.forEach(level => {
                try {
                    const line = chartApiRef.current.createHorzLine({
                        price: level, text: `$${level.toLocaleString()}`, lineStyle: 2, lineColor: '#FBBF24', textColor: '#000000', backgroundColor: '#FBBF24', showLabel: true
                    });
                    drawnLinesRef.current.push(line);
                } catch(e) {}
            });
        }
    }, [highlightedLevels, chartApiRef.current]);

    const handleSymbolSearch = (e: FormEvent) => {
        e.preventDefault();
        if (symbolInput.trim()) setActivePair(symbolInput.trim().toUpperCase());
    };

    // Calculate Ratio
    const totalLiq = aggregatedStats.longLiqs + aggregatedStats.shortLiqs;
    const longRatio = totalLiq > 0 ? (aggregatedStats.longLiqs / totalLiq) * 100 : 50;

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            
            {/* High-Tech HUD */}
            <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4 staggered-fade-in">
                {/* Search & Price */}
                <Card className="md:col-span-1 flex flex-col justify-center !p-4 bg-gradient-to-br from-brand-dark to-brand-darkest border-brand-border-dark relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-primary/5 animate-pulse"></div>
                    <form onSubmit={handleSymbolSearch} className="flex gap-2 items-center relative z-10 mb-2">
                        <input
                            type="text"
                            value={symbolInput}
                            onChange={(e) => setSymbolInput(e.target.value)}
                            className="bg-black/30 border border-white/10 rounded-md py-1 px-2 text-xs font-mono text-white w-full focus:border-brand-primary outline-none uppercase"
                        />
                        <button type="submit" className="text-brand-primary hover:text-white"><SearchIcon /></button>
                    </form>
                    <div className="relative z-10">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Oracle Price</p>
                        <p className={`text-2xl font-mono font-bold transition-colors duration-300 ${priceUpdateStatus === 'up' ? 'text-emerald-400' : priceUpdateStatus === 'down' ? 'text-rose-400' : 'text-white'}`}>
                            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                </Card>

                {/* Stats: Total Vol */}
                <Card className="flex flex-col justify-center !p-4">
                    <div className="flex items-center gap-3">
                         <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><FireIcon className="w-5 h-5" /></div>
                         <div>
                             <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Rekt (Session)</p>
                             <p className="text-xl font-bold text-slate-900 dark:text-white">${(aggregatedStats.totalVol/1000000).toFixed(2)}M</p>
                         </div>
                    </div>
                </Card>

                {/* Stats: Ratio Bar */}
                <Card className="md:col-span-2 flex flex-col justify-center !p-4">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-xs font-bold text-rose-500 uppercase">Longs Rekt</p>
                            <p className="text-lg font-mono text-slate-900 dark:text-white">${(aggregatedStats.longLiqs/1000).toFixed(0)}k</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-emerald-500 uppercase">Shorts Rekt</p>
                            <p className="text-lg font-mono text-slate-900 dark:text-white">${(aggregatedStats.shortLiqs/1000).toFixed(0)}k</p>
                        </div>
                    </div>
                    {/* The Ratio Bar */}
                    <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden relative flex">
                        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${longRatio}%` }}></div>
                        <div className="h-full bg-emerald-500 flex-1 transition-all duration-500"></div>
                        {/* Center Marker */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50 z-10"></div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area */}
            <div ref={containerRef} className="flex-1 flex gap-3 relative min-h-0 staggered-fade-in" style={{animationDelay: '100ms'}}>
                 {isResizing && <div className="absolute inset-0 z-50 cursor-col-resize" />}
                
                {/* Left: Chart */}
                <div className="h-full flex flex-col transition-all duration-75" style={{ width: `${chartWidth}%` }}>
                    <Card className="flex-1 min-h-0 relative p-0 overflow-hidden border-0 shadow-xl bg-white dark:bg-brand-dark">
                        <div id={`tradingview_liquidation_chart_${widgetKey}`} className="w-full h-full" />
                        
                        {/* Floating Toolbar for Highlights */}
                        <div className="absolute bottom-4 left-4 right-4 z-10">
                            <div className="bg-white/90 dark:bg-brand-darkest/90 backdrop-blur-md border border-gray-200 dark:border-brand-border-dark rounded-xl p-2 flex items-center gap-3 shadow-lg max-w-2xl mx-auto">
                                <span className="text-xs font-bold text-gray-500 uppercase px-2">Liquidation Levels</span>
                                <div className="h-4 w-px bg-gray-300 dark:bg-gray-700"></div>
                                <form onSubmit={handleHighlightSubmit} className="flex gap-2">
                                    <input 
                                        type="number" 
                                        value={highlightLevelInput}
                                        onChange={(e) => setHighlightLevelInput(e.target.value)}
                                        placeholder="Add Price Level..."
                                        className="bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-white focus:border-brand-primary outline-none w-32 font-mono"
                                    />
                                    <button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white px-2 py-1 rounded text-xs font-bold">+</button>
                                </form>
                                <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[300px]">
                                    {highlightedLevels.map(level => (
                                        <span key={level} className="flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 rounded px-2 py-0.5 text-[10px] font-mono whitespace-nowrap">
                                            ${level}
                                            <button onClick={() => handleRemoveHighlight(level)} className="hover:text-red-500">&times;</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button onClick={toggleFullScreen} className="absolute top-3 right-3 z-20 p-2 bg-white/20 dark:bg-black/20 backdrop-blur-sm rounded-full text-slate-800 dark:text-slate-200 hover:bg-white/40 dark:hover:bg-black/40 transition-colors">
                            <ExpandIcon />
                        </button>
                    </Card>
                </div>

                {/* Dragger */}
                <div 
                    className="w-1.5 cursor-col-resize flex items-center justify-center group flex-shrink-0 hover:scale-x-150 transition-transform"
                    onMouseDown={handleMouseDown}
                >
                    <div className={`h-16 w-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-brand-primary transition-colors ${isResizing ? 'bg-brand-primary' : ''}`}></div>
                </div>

                {/* Right: Kill Feed & CLD */}
                <div className="h-full flex flex-col gap-3" style={{ width: `calc(${100 - chartWidth}% - 12px)` }}>
                    <Card className="flex-1 flex flex-col min-h-0 !p-0 border-0 shadow-lg bg-white dark:bg-brand-dark overflow-hidden">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-gray-100 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30">
                            <button onClick={() => setRightPanelTab('feed')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${rightPanelTab === 'feed' ? 'text-brand-primary border-b-2 border-brand-primary bg-white dark:bg-brand-dark' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                                Live Feed
                            </button>
                            <button onClick={() => setRightPanelTab('cld')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${rightPanelTab === 'cld' ? 'text-brand-primary border-b-2 border-brand-primary bg-white dark:bg-brand-dark' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
                                CVD Analytics
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0 relative bg-slate-50/50 dark:bg-[#0B1120]">
                            {rightPanelTab === 'feed' ? (
                                <div className="absolute inset-0 overflow-y-auto p-3 custom-scrollbar">
                                    {liveFeed.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
                                            <span className="text-xs uppercase tracking-widest">Scanning Network...</span>
                                        </div>
                                    )}
                                    {liveFeed.map(e => (
                                        <KillFeedItem key={e.id} event={e} />
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col p-4">
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Cumulative Liq Delta</h3>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={cldData}>
                                                <defs>
                                                    <linearGradient id="cldGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <Tooltip 
                                                    contentStyle={theme === 'dark' ? { backgroundColor: '#1E293B', border: '1px solid #334155' } : {}} 
                                                    formatter={(v: number) => [`$${(v/1000).toFixed(0)}k`, 'Delta']}
                                                    labelFormatter={() => ''}
                                                />
                                                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="value" 
                                                    stroke="#F43F5E" 
                                                    strokeWidth={2} 
                                                    fill="url(#cldGradient)" 
                                                    isAnimationActive={false}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-[10px] text-gray-400">Positive = More Shorts Rekt (Buy Pressure)</p>
                                        <p className="text-[10px] text-gray-400">Negative = More Longs Rekt (Sell Pressure)</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Fullscreen Chart Portal */}
             {isChartFullScreen && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-brand-darkest p-0 animate-modal-fade-in">
                    <div id={`tradingview_fullscreen_liquidation_chart_${widgetKey}`} className="w-full h-full" />
                    <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-20 p-2 bg-brand-darkest/50 backdrop-blur-md rounded-lg text-white hover:bg-brand-darkest transition-colors">
                        <CollapseIcon />
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper for ReferenceLine (Recharts doesn't export it by default in some versions, mocking simple line if needed, but usually available)
import { ReferenceLine } from 'recharts';

export default LiquidationMap;

