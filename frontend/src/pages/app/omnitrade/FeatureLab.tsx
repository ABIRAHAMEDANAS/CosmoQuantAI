import React, { useMemo } from 'react';
import { TrendingUp, Layers, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ReferenceLine, AreaChart, Area } from 'recharts';
import { IndicatorData } from '@/types';

interface FeatureLabProps {
    data: IndicatorData[];
}

export const FeatureLab: React.FC<FeatureLabProps> = ({ data }) => {
    // Calculate Feature Importance (Mock)
    const featureImportance = useMemo(() => [
        { name: 'RSI (14)', importance: 0.85, correlation: 0.65 },
        { name: 'MACD Hist', importance: 0.72, correlation: 0.45 },
        { name: 'Bollinger Width', importance: 0.68, correlation: -0.32 },
        { name: 'Volume SMA', importance: 0.55, correlation: 0.28 },
        { name: 'Price ROC', importance: 0.45, correlation: 0.55 },
    ], []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Feature Importance Chart */}
                <div className="lg:col-span-2 bg-omni-panel border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Layers size={20} className="text-omni-accent" /> Feature Importance (SHAP Values)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={featureImportance} layout="vertical">
                                <defs>
                                    <linearGradient id="impGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" domain={[0, 1]} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                />
                                <Area type="monotone" dataKey="importance" stroke="#38bdf8" fill="url(#impGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Correlation Matrix (Simplified) */}
                <div className="bg-omni-panel border border-slate-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-omni-success" /> Target Correlation
                    </h3>
                    <div className="space-y-4">
                        {featureImportance.map((feature) => (
                            <div key={feature.name} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">{feature.name}</span>
                                    <span className={`font-mono ${feature.correlation > 0 ? 'text-omni-success' : 'text-omni-danger'}`}>
                                        {feature.correlation > 0 ? '+' : ''}{feature.correlation}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                    <div className="w-1/2 flex justify-end">
                                        {feature.correlation < 0 && (
                                            <div
                                                className="h-full bg-omni-danger rounded-l-full"
                                                style={{ width: `${Math.abs(feature.correlation) * 100}%` }}
                                            ></div>
                                        )}
                                    </div>
                                    <div className="w-1/2 flex justify-start">
                                        {feature.correlation > 0 && (
                                            <div
                                                className="h-full bg-omni-success rounded-r-full"
                                                style={{ width: `${feature.correlation * 100}%` }}
                                            ></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature Engineering Playground */}
            <div className="bg-omni-panel border border-slate-700 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChart3 size={20} className="text-purple-400" /> Feature Engineering Lab
                    </h3>
                    <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-sm font-bold transition-all">
                        + Auto-Generate Features
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Log Returns', 'Volatility Scaling', 'Lagged Features (t-1, t-2)', 'Fourier Transform', 'Wavelet Denoising', 'Sentiment Embedding'].map((method) => (
                        <div key={method} className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-purple-500/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded border border-slate-500 group-hover:bg-purple-500 group-hover:border-purple-500 transition-colors"></div>
                                <span className="text-sm text-slate-300 group-hover:text-white">{method}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

