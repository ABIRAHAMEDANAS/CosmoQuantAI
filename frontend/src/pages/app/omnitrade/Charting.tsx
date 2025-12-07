import React, { useState, useEffect } from 'react';
import { CandlestickChart, Activity, Settings, Maximize2 } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line } from 'recharts';

export const Charting = () => {
    const [timeframe, setTimeframe] = useState('1H');
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        // Simulate OHLC Data Generation
        const generateData = () => {
            let price = 64200;
            const arr = [];
            for (let i = 0; i < 100; i++) {
                const volatility = Math.random() * 100;
                const change = (Math.random() - 0.5) * 200;
                const open = price;
                const close = price + change;
                const high = Math.max(open, close) + Math.random() * 50;
                const low = Math.min(open, close) - Math.random() * 50;
                const volume = Math.floor(Math.random() * 5000);

                arr.push({
                    time: new Date(Date.now() - (100 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    open,
                    high,
                    low,
                    close,
                    volume
                });
                price = close;
            }
            return arr;
        };
        setData(generateData());
    }, [timeframe]);

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Chart Toolbar */}
            <div className="bg-omni-panel border border-slate-700 rounded-xl p-4 flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-white font-bold">
                        <span className="bg-orange-500/20 text-orange-400 p-1.5 rounded-lg"><CandlestickChart size={20} /></span>
                        <span>BTC/USDT</span>
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        {['15m', '1H', '4H', '1D', '1W'].map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${timeframe === tf ? 'bg-omni-accent text-omni-bg' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <Activity size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <Settings size={20} />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <Maximize2 size={20} />
                    </button>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="flex-1 bg-omni-panel border border-slate-700 rounded-xl p-4 relative min-h-[500px]">
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-omni-success bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-omni-success"></span> O: {data[data.length - 1]?.open.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-omni-success bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-omni-success"></span> H: {data[data.length - 1]?.high.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-omni-danger bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-omni-danger"></span> L: {data[data.length - 1]?.low.toFixed(2)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white bg-slate-900/80 px-2 py-1 rounded backdrop-blur-sm border border-slate-700">
                        <span className="w-2 h-2 rounded-full bg-white"></span> C: {data[data.length - 1]?.close.toFixed(2)}
                    </div>
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                        <defs>
                            <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" orientation="left" stroke="#64748b" domain={[0, 'auto']} hide />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8', marginBottom: '5px' }}
                        />

                        {/* Volume Bars */}
                        <Bar yAxisId="left" dataKey="volume" fill="url(#volGradient)" barSize={4} />

                        {/* Price Line (Simulating Candle Movement) */}
                        <Line yAxisId="right" type="monotone" dataKey="close" stroke="#38bdf8" strokeWidth={2} dot={false} />

                        {/* Bollinger Bands (Simulated) */}
                        <Line yAxisId="right" type="monotone" dataKey={(d) => d.close * 1.005} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                        <Line yAxisId="right" type="monotone" dataKey={(d) => d.close * 0.995} stroke="#38bdf8" strokeWidth={1} strokeDasharray="3 3" dot={false} opacity={0.5} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

