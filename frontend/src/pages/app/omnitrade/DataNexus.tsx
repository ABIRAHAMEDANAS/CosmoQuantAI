import React, { useState, useEffect } from 'react';
import { Server, CloudLightning, ArrowRight, Activity, Globe, Database as LucideDatabase, Wifi, RefreshCw } from 'lucide-react';

interface TickerData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    timestamp: string;
}

interface DataNexusProps {
    onNavigate?: (view: string) => void;
}

export const DataNexus: React.FC<DataNexusProps> = ({ onNavigate }) => {
    const [tickers, setTickers] = useState<TickerData[]>([]);

    // Simulate data stream
    useEffect(() => {
        const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'AAPL', 'NVDA', 'EUR/USD'];

        const generateTickers = () => {
            return symbols.map(sym => ({
                symbol: sym,
                price: Math.random() * 1000 + 100, // Dummy logic
                change: (Math.random() - 0.5) * 10,
                changePercent: (Math.random() - 0.5) * 2,
                volume: Math.floor(Math.random() * 1000000),
                timestamp: new Date().toLocaleTimeString()
            }));
        };

        setTickers(generateTickers()); // Initial
        const interval = setInterval(() => {
            setTickers(generateTickers());
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const sources = [
        { name: 'Binance API', type: 'Crypto', status: 'Connected', latency: '45ms', icon: Activity },
        { name: 'Yahoo Finance', type: 'Stocks', status: 'Connected', latency: '120ms', icon: Globe },
        { name: 'Finnhub', type: 'News/Forex', status: 'Connected', latency: '85ms', icon: Server },
        { name: 'Fred API', type: 'Macro', status: 'Idle', latency: '-', icon: DatabaseIcon },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Server className="text-omni-accent" /> Universal Data Nexus
                </h2>
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('vertex')}
                        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex items-center gap-2 transition-all font-bold text-sm"
                    >
                        <CloudLightning size={16} /> Push Datasets to Vertex Forge <ArrowRight size={16} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sources.map((source) => (
                    <div key={source.name} className="bg-omni-panel border border-slate-700 rounded-xl p-4 flex flex-col justify-between hover:border-omni-accent transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-slate-800 rounded-lg text-omni-accent">
                                <source.icon size={20} />
                            </div>
                            <div className={`flex items-center space-x-1 text-xs font-mono ${source.status === 'Connected' ? 'text-omni-success' : 'text-slate-500'}`}>
                                <Wifi size={12} />
                                <span>{source.status}</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-200">{source.name}</h3>
                            <div className="flex justify-between mt-2 text-xs text-slate-400">
                                <span>{source.type}</span>
                                <span>Latency: {source.latency}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-omni-panel border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                        <Activity size={18} className="text-omni-accent" />
                        Live Ingestion Stream
                    </h3>
                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                        <RefreshCw size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-800/50 text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Symbol</th>
                                <th className="px-6 py-3 font-medium text-right">Price</th>
                                <th className="px-6 py-3 font-medium text-right">Change %</th>
                                <th className="px-6 py-3 font-medium text-right">Volume</th>
                                <th className="px-6 py-3 font-medium text-right">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {tickers.map((ticker) => (
                                <tr key={ticker.symbol} className="hover:bg-slate-700/30 transition-colors font-mono">
                                    <td className="px-6 py-4 font-semibold text-white">{ticker.symbol}</td>
                                    <td className="px-6 py-4 text-right text-slate-300">${ticker.price.toFixed(2)}</td>
                                    <td className={`px-6 py-4 text-right font-medium ${ticker.changePercent >= 0 ? 'text-omni-success' : 'text-omni-danger'}`}>
                                        {ticker.changePercent > 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-400">{ticker.volume.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-slate-500">{ticker.timestamp}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Helper for icon
const DatabaseIcon = ({ size, className }: { size: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
);

