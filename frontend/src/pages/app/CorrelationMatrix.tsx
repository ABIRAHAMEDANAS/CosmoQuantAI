
import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import Card from '@/components/common/Card';
import { MOCK_CORRELATION_MATRIX, MOCK_CORRELATION_ASSETS, MOCK_COINTEGRATED_PAIRS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import type { CointegratedPair } from '@/types';

// --- Utility Functions ---

const getCorrelationColor = (value: number, opacity: number = 1) => {
    const absVal = Math.abs(value);
    // 1.0 = Indigo (Self), Positive = Emerald, Negative = Rose
    if (value === 1) return `rgba(99, 102, 241, ${opacity})`; // Brand Primary
    
    if (value > 0) {
        // Green intensity based on value
        if (value > 0.75) return `rgba(16, 185, 129, ${opacity})`;
        if (value > 0.5) return `rgba(52, 211, 153, ${opacity})`;
        return `rgba(110, 231, 183, ${opacity})`;
    } else {
        // Red intensity based on value
        if (value < -0.75) return `rgba(244, 63, 94, ${opacity})`;
        if (value < -0.5) return `rgba(251, 113, 133, ${opacity})`;
        return `rgba(253, 164, 175, ${opacity})`;
    }
};

const getCorrelationTextColor = (value: number) => {
    if (Math.abs(value) > 0.5 || value === 1) return 'text-white';
    return 'text-slate-900 dark:text-white';
};

// --- Visual Components ---

// 1. Z-Score Horizon Gauge
const ZScoreGauge: React.FC<{ zScore: number }> = ({ zScore }) => {
    // Clamp value between -3 and 3 for display
    const clampedScore = Math.max(-3, Math.min(3, zScore));
    // Convert to percentage (0% at -3, 50% at 0, 100% at 3)
    const percent = ((clampedScore + 3) / 6) * 100;

    return (
        <div className="w-full mt-4">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                <span>Buy Pair (-2σ)</span>
                <span>Mean (0)</span>
                <span>Sell Pair (+2σ)</span>
            </div>
            <div className="relative h-3 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
                {/* Zones */}
                <div className="absolute left-0 w-[16.66%] h-full bg-emerald-500/30"></div> {/* Buy Zone */}
                <div className="absolute right-0 w-[16.66%] h-full bg-rose-500/30"></div>   {/* Sell Zone */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-600 transform -translate-x-1/2"></div> {/* Mean */}

                {/* The Indicator Puck */}
                <div 
                    className={`absolute top-0 bottom-0 w-1.5 h-full rounded-full shadow-[0_0_10px_currentColor] transition-all duration-500 ease-out transform -translate-x-1/2 ${
                        zScore > 1.5 ? 'bg-rose-500 shadow-rose-500' : zScore < -1.5 ? 'bg-emerald-500 shadow-emerald-500' : 'bg-blue-400'
                    }`}
                    style={{ left: `${percent}%` }}
                ></div>
            </div>
            <div className="text-center mt-1 font-mono text-xs font-bold">
                Z: <span className={zScore > 1.5 ? 'text-rose-500' : zScore < -1.5 ? 'text-emerald-500' : 'text-gray-500'}>{zScore.toFixed(2)}</span>
            </div>
        </div>
    );
};

// 2. The Quantum Grid Cell
const MatrixCell: React.FC<{ 
    value: number; 
    row: string; 
    col: string; 
    isHovered: boolean; 
    onHover: (r: string, c: string) => void; 
    onLeave: () => void;
}> = ({ value, row, col, isHovered, onHover, onLeave }) => {
    const bg = getCorrelationColor(value, isHovered ? 1 : 0.8);
    const text = getCorrelationTextColor(value);
    
    return (
        <div 
            onMouseEnter={() => onHover(row, col)}
            onMouseLeave={onLeave}
            className={`relative h-14 flex items-center justify-center text-sm font-bold transition-all duration-200 cursor-pointer border border-transparent hover:border-white/20 hover:scale-105 hover:z-10 rounded-lg ${text}`}
            style={{ backgroundColor: bg }}
        >
            {value.toFixed(2)}
        </div>
    );
};

const PairCard: React.FC<{ pairData: CointegratedPair; index: number }> = ({ pairData, index }) => {
    const { theme } = useTheme();
    const axisColor = theme === 'dark' ? '#64748B' : '#94A3B8';
    
    const isOpportunity = Math.abs(pairData.zScore) > 1.5;
    const signalColor = pairData.signal === 'Buy Pair' ? 'text-emerald-500' : pairData.signal === 'Sell Pair' ? 'text-rose-500' : 'text-gray-400';
    const signalBg = pairData.signal === 'Buy Pair' ? 'bg-emerald-500/10 border-emerald-500/20' : pairData.signal === 'Sell Pair' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10';

    return (
        <div className={`staggered-fade-in bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isOpportunity ? 'ring-1 ring-brand-primary/50' : ''}`} style={{ animationDelay: `${index * 100}ms` }}>
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-brand-dark">{pairData.pair[0]}</div>
                            <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold border-2 border-white dark:border-brand-dark">{pairData.pair[1]}</div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{pairData.pair.join(' / ')}</h3>
                            <p className="text-[10px] text-gray-500 uppercase">Cointegration: {(pairData.cointegrationScore * 100).toFixed(0)}%</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${signalBg} ${signalColor}`}>
                        {pairData.signal}
                    </span>
                </div>

                <div className="h-24 w-full opacity-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pairData.spreadHistory}>
                            <defs>
                                <linearGradient id={`grad-${pairData.id}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['dataMin', 'dataMax']} hide />
                            <Tooltip 
                                contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155' } : {}}
                                formatter={(value: number) => [value.toFixed(4), 'Spread']}
                                labelFormatter={() => ''}
                            />
                            <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fill={`url(#grad-${pairData.id})`} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <ZScoreGauge zScore={pairData.zScore} />
            </div>
        </div>
    );
};

const CorrelationMatrix: React.FC = () => {
    const [hoveredCell, setHoveredCell] = useState<{ r: string, c: string } | null>(null);

    return (
        <div className="space-y-8 animate-fade-in-slide-up">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Statistical Arbitrage</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
                        Advanced correlation analysis and cointegration scanner to identify mean-reversion opportunities between assets.
                    </p>
                </div>
                <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Pos Correl</div>
                     <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Neg Correl</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                
                {/* Left Column: The Quantum Grid */}
                <div className="xl:col-span-7">
                    <Card className="h-full bg-slate-50 dark:bg-brand-dark border-0 shadow-xl p-6">
                        <div className="overflow-x-auto">
                            <div className="min-w-[500px]">
                                {/* Matrix Header */}
                                <div className="grid grid-cols-6 gap-2 mb-2">
                                    <div className="h-10"></div> {/* Empty corner */}
                                    {MOCK_CORRELATION_ASSETS.map(asset => (
                                        <div key={asset} className={`h-10 flex items-center justify-center font-bold text-slate-700 dark:text-gray-300 transition-opacity ${hoveredCell && hoveredCell.c !== asset ? 'opacity-30' : 'opacity-100'}`}>
                                            {asset}
                                        </div>
                                    ))}
                                </div>

                                {/* Matrix Rows */}
                                {MOCK_CORRELATION_ASSETS.map(rowAsset => (
                                    <div key={rowAsset} className="grid grid-cols-6 gap-2 mb-2">
                                        <div className={`h-14 flex items-center justify-start pl-2 font-bold text-slate-700 dark:text-gray-300 transition-opacity ${hoveredCell && hoveredCell.r !== rowAsset ? 'opacity-30' : 'opacity-100'}`}>
                                            {rowAsset}
                                        </div>
                                        {MOCK_CORRELATION_ASSETS.map(colAsset => (
                                            <MatrixCell 
                                                key={`${rowAsset}-${colAsset}`}
                                                row={rowAsset}
                                                col={colAsset}
                                                value={MOCK_CORRELATION_MATRIX[rowAsset as keyof typeof MOCK_CORRELATION_MATRIX][colAsset]}
                                                isHovered={hoveredCell ? (hoveredCell.r === rowAsset || hoveredCell.c === colAsset) : false}
                                                onHover={(r, c) => setHoveredCell({ r, c })}
                                                onLeave={() => setHoveredCell(null)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 text-center text-xs text-gray-500 italic">
                            Hover over cells to cross-reference. Click to analyze pair deep-dive.
                        </div>
                    </Card>
                </div>

                {/* Right Column: Cointegration Scanner */}
                <div className="xl:col-span-5 flex flex-col gap-6">
                     <div className="flex items-center justify-between bg-white dark:bg-brand-dark p-4 rounded-xl border border-gray-200 dark:border-brand-border-dark shadow-sm">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-primary"></span>
                            </span>
                            Live Pairs Scanner
                        </h3>
                        <span className="text-xs font-mono text-gray-500">Updated: 12s ago</span>
                     </div>

                    <div className="space-y-6">
                        {MOCK_COINTEGRATED_PAIRS.map((pair, index) => (
                            <PairCard key={pair.id} pairData={pair} index={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorrelationMatrix;

