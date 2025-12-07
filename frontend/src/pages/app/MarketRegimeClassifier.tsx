
import React, { useState, useMemo } from 'react';
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    ReferenceArea,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    AreaChart,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { MOCK_REGIME_DATA, REGIME_DEFINITIONS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/common/Card';
import type { MarketRegime, RegimeDataPoint } from '@/types';

const cryptoPairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

// --- Visual Components ---

// 1. The Regime Compass (Trend vs Volatility)
const RegimeCompass: React.FC<{ currentRegime: MarketRegime }> = ({ currentRegime }) => {
    // Map regimes to coordinates [x(Volatility), y(Trend)]
    // x: -1 (Stable) to 1 (Volatile)
    // y: -1 (Bear) to 1 (Bull)
    const getCoordinates = (regime: MarketRegime) => {
        switch (regime) {
            case 'Bull Stable': return { x: -0.5, y: 0.7, color: '#10B981' };
            case 'Bull Volatile': return { x: 0.7, y: 0.7, color: '#34D399' };
            case 'Bear Stable': return { x: -0.5, y: -0.7, color: '#F43F5E' };
            case 'Bear Volatile': return { x: 0.7, y: -0.7, color: '#FB7185' };
            case 'Ranging': return { x: 0, y: 0, color: '#FBBF24' };
            default: return { x: 0, y: 0, color: '#94A3B8' };
        }
    };

    const coords = getCoordinates(currentRegime);

    return (
        <div className="relative w-full h-64 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-slate-700/50"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-px bg-slate-700/50"></div>
            </div>

            {/* Labels */}
            <span className="absolute top-2 right-1/2 translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-emerald-500 bg-slate-900/80 px-2 rounded">Bullish Trend</span>
            <span className="absolute bottom-2 right-1/2 translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-rose-500 bg-slate-900/80 px-2 rounded">Bearish Trend</span>
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-blue-400 [writing-mode:vertical-lr] rotate-180 bg-slate-900/80 py-2 rounded">Stable</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-purple-400 [writing-mode:vertical-lr] bg-slate-900/80 py-2 rounded">Volatile</span>

            {/* The Puck */}
            <div 
                className="absolute w-6 h-6 rounded-full shadow-[0_0_20px_currentColor] transition-all duration-1000 ease-out flex items-center justify-center z-10"
                style={{ 
                    left: `calc(50% + ${coords.x * 40}%)`, 
                    top: `calc(50% - ${coords.y * 40}%)`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: coords.color,
                    color: coords.color
                }}
            >
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            </div>

            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.05)_360deg)] animate-[spin_4s_linear_infinite] rounded-full scale-150 opacity-30 pointer-events-none"></div>
        </div>
    );
};

// 2. Markov Transition Matrix (Mock Probability)
const MarkovMatrix: React.FC<{ currentRegime: MarketRegime }> = ({ currentRegime }) => {
    const regimes: MarketRegime[] = ['Bull Stable', 'Bull Volatile', 'Ranging', 'Bear Stable', 'Bear Volatile'];
    
    // Mock logic to generate probabilities based on current state
    // In a real app, this comes from the ML model's transition matrix
    const getProbabilities = (current: MarketRegime) => {
        return regimes.map(target => {
            let prob = 0.05; // Base noise
            if (target === current) prob = 0.6; // High chance to stay
            // Logic: Likely to move to adjacent states (e.g. Bull Stable -> Bull Volatile or Ranging)
            if (current === 'Bull Stable' && (target === 'Bull Volatile' || target === 'Ranging')) prob = 0.15;
            if (current === 'Bull Volatile' && (target === 'Bull Stable' || target === 'Bear Volatile')) prob = 0.15;
            if (current === 'Ranging' && target !== 'Ranging') prob = 0.1;
            if (current === 'Bear Stable' && (target === 'Bear Volatile' || target === 'Ranging')) prob = 0.15;
            if (current === 'Bear Volatile' && (target === 'Bear Stable' || target === 'Bull Volatile')) prob = 0.15;
            return { target, prob };
        });
    };

    const transitions = getProbabilities(currentRegime);

    return (
        <div className="space-y-3">
            {transitions.map((t) => (
                <div key={t.target} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${t.target === currentRegime ? 'bg-white animate-pulse' : 'bg-gray-400'}`}></div>
                         <span className={`${t.target === currentRegime ? 'text-slate-900 dark:text-white font-bold' : 'text-gray-500'}`}>{t.target}</span>
                    </div>
                    <div className="flex items-center gap-2 w-1/2">
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-700 ${t.target === currentRegime ? 'bg-brand-primary' : 'bg-gray-400 dark:bg-gray-600'}`} 
                                style={{ width: `${t.prob * 100}%` }}
                            ></div>
                        </div>
                        <span className="w-8 text-right font-mono text-gray-500 dark:text-gray-400">{(t.prob * 100).toFixed(0)}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 3. Volatility Distribution Curve
const VolatilityDistribution: React.FC<{ currentRegime: MarketRegime }> = ({ currentRegime }) => {
    // Simulate bell curve data based on regime
    const data = useMemo(() => {
        const points = [];
        let stdDev = 1;
        if (currentRegime.includes('Volatile')) stdDev = 2.5;
        if (currentRegime === 'Ranging') stdDev = 1.5;
        
        for (let i = -3; i <= 3; i += 0.2) {
            // Gaussian function
            const val = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(i / stdDev, 2));
            points.push({ x: i, val });
        }
        return points;
    }, [currentRegime]);

    return (
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Area 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#8B5CF6" 
                        strokeWidth={2} 
                        fill="url(#volGradient)" 
                        animationDuration={500}
                    />
                </AreaChart>
            </ResponsiveContainer>
            <p className="text-[10px] text-center text-gray-500 -mt-2">Return Distribution (Simulated)</p>
        </div>
    );
}

const RegimeHistoryChart: React.FC<{ data: RegimeDataPoint[] }> = ({ data }) => {
    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? '#64748B' : '#94A3B8';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';

    const regimeColors: Record<MarketRegime, string> = {
        'Bull Volatile': '#34D399', 
        'Bull Stable': '#10B981',   
        'Bear Volatile': '#FB7185', 
        'Bear Stable': '#F43F5E',   
        'Ranging': '#FBBF24',       
    };
    
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const dataPoint = payload[0].payload as RegimeDataPoint;
            const regimeInfo = REGIME_DEFINITIONS[dataPoint.regime];
            return (
                <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 dark:border-slate-700 text-xs">
                    <p className="text-gray-500 dark:text-gray-400 mb-1">{new Date(label).toLocaleDateString()} {new Date(label).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                    <div className="flex justify-between items-center gap-4 mb-2">
                        <span className="text-slate-900 dark:text-white font-bold text-lg">${dataPoint.price.toLocaleString()}</span>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase inline-block ${regimeInfo.color.replace('bg-', 'bg-opacity-20 text-')}`}>
                        {dataPoint.regime}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                     <linearGradient id="priceLine" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={1}/>
                        <stop offset="100%" stopColor="#A855F7" stopOpacity={1}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                    dataKey="time"
                    stroke={axisColor}
                    tickFormatter={(time) => new Date(time).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                />
                <YAxis
                    orientation="right"
                    stroke={axisColor}
                    domain={['auto', 'auto']}
                    tickFormatter={(price) => `$${(price/1000).toFixed(1)}k`}
                    tick={{ fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#64748B', strokeWidth: 1, strokeDasharray: '4 4' }} />
                
                {/* Regime Background Blocks */}
                {data.map((d, i) => {
                    if (i < data.length - 1) {
                        // Only draw a block if the NEXT point has the same regime, or simply fill strictly per point
                        return (
                            <ReferenceArea 
                                key={`regime-${i}`} 
                                x1={d.time} 
                                x2={data[i+1].time} 
                                fill={regimeColors[d.regime as MarketRegime]} 
                                fillOpacity={0.1}
                                strokeOpacity={0}
                            />
                        )
                    }
                    return null;
                })}

                <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="url(#priceLine)" 
                    strokeWidth={2} 
                    dot={false} 
                    activeDot={{ r: 6, fill: '#fff', strokeWidth: 0 }} 
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

const MarketRegimeClassifier: React.FC = () => {
    const [activePair, setActivePair] = useState(cryptoPairs[0]);
    const regimeData = MOCK_REGIME_DATA; 

    const currentRegime = useMemo(() => regimeData[regimeData.length - 1].regime, [regimeData]);
    const currentRegimeInfo = REGIME_DEFINITIONS[currentRegime];
    
    return (
        <div className="space-y-6 animate-fade-in-slide-up">
            
            {/* Header / Control Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-xl shadow-sm">
                 <div className="flex items-center gap-4">
                     <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Market Regime Classifier</h2>
                        <p className="text-xs text-gray-500">Real-time Hidden Markov Model (HMM) Analysis</p>
                     </div>
                </div>
                
                <div className="relative">
                    <select 
                        value={activePair}
                        onChange={(e) => setActivePair(e.target.value)}
                        className="bg-gray-100 dark:bg-brand-darkest border border-gray-200 dark:border-gray-700 rounded-lg py-2 pl-3 pr-10 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none appearance-none min-w-[150px]"
                    >
                        {cryptoPairs.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: The Compass & Stats */}
                <div className="lg:col-span-1 space-y-6">
                    
                    {/* Current Status Card */}
                    <Card className="relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${currentRegimeInfo.color}`}></div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold mb-1">Current State</p>
                        <h3 className={`text-2xl font-extrabold ${currentRegimeInfo.textColor} mb-2`}>{currentRegime}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{currentRegimeInfo.description}</p>
                    </Card>

                    {/* Regime Compass */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Regime Compass</h4>
                            <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-mono">LIVE</span>
                        </div>
                        <RegimeCompass currentRegime={currentRegime} />
                        <div className="mt-4 text-center text-[10px] text-gray-500">
                            X: Volatility Index | Y: Trend Strength
                        </div>
                    </Card>
                </div>

                {/* Middle Column: Chart */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <Card className="flex-1 flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Regime History</h3>
                            <div className="flex gap-4 text-xs font-medium">
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Bull</div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F43F5E]"></div> Bear</div>
                                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FBBF24]"></div> Range</div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                             <RegimeHistoryChart data={regimeData} />
                        </div>
                    </Card>

                    {/* Bottom Row: Matrix & Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">Next State Probability (Markov)</h4>
                            <MarkovMatrix currentRegime={currentRegime} />
                        </Card>
                        <Card>
                             <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-2">Risk Distribution</h4>
                             <VolatilityDistribution currentRegime={currentRegime} />
                             <div className="mt-2 p-2 bg-gray-100 dark:bg-white/5 rounded text-xs text-gray-500 flex justify-between">
                                 <span>Est. Volatility: <span className="text-slate-900 dark:text-white font-bold">High</span></span>
                                 <span>Tail Risk: <span className="text-slate-900 dark:text-white font-bold">Fat</span></span>
                             </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketRegimeClassifier;

