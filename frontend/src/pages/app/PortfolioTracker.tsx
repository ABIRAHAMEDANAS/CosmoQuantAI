
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MOCK_ASSETS, SUPPORTED_EXCHANGES, PORTFOLIO_ALLOCATION_DATA } from '@/constants';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import type { Asset, Exchange } from '@/types';

const COLORS = ['#6366F1', '#818CF8', '#A78BFA', '#F472B6', '#F87171', '#FBBF24'];

const ExchangeStatusIndicator: React.FC<{ connected: boolean }> = ({ connected }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${connected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
        <span>{connected ? 'Live' : 'Offline'}</span>
    </div>
);

const MiniSparkline: React.FC<{ data: { time: string, value: number }[], color: string }> = ({ data, color }) => {
    const isPositive = data[data.length - 1].value >= data[0].value;
    const strokeColor = isPositive ? '#10B981' : '#F43F5E';
    
    return (
        <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <Line type="monotone" dataKey="value" stroke={strokeColor} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const generateSimulationData = (baseData: Asset[], scenario: 'Normal' | 'Recession' | 'High Inflation' | 'Stagflation') => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let currentValue = baseData.reduce((sum, asset) => sum + asset.value, 0);
    const data = [{ month: 'Start', value: currentValue }];

    let trend = 0.01; // Normal growth
    let volatility = 0.03;

    switch(scenario) {
        case 'Recession':
            trend = -0.05;
            volatility = 0.08;
            break;
        case 'High Inflation':
            trend = 0.005;
            volatility = 0.06;
            break;
        case 'Stagflation':
            trend = -0.01;
            volatility = 0.07;
            break;
    }

    for (const month of months) {
        const change = (Math.random() - 0.5 + trend/0.8) * volatility; // Skew towards trend
        currentValue *= (1 + change);
        data.push({ month, value: Math.round(currentValue) });
    }

    return data;
};

const ConnectExchangeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    exchanges: Exchange[];
    onToggleConnect: (id: string) => void;
}> = ({ isOpen, onClose, exchanges, onToggleConnect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-modal-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark w-full max-w-2xl rounded-2xl shadow-2xl border border-brand-border-light dark:border-brand-border-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manage Data Sources</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">&times;</button>
                </header>
                <div className="p-8 space-y-4">
                    {exchanges.map(exchange => (
                        <div key={exchange.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-brand-darkest/50 border border-brand-border-light dark:border-brand-border-dark rounded-xl hover:border-brand-primary/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white dark:bg-brand-dark rounded-lg shadow-sm">
                                    {exchange.logo}
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-900 dark:text-white">{exchange.name}</span>
                                    <span className="text-xs text-gray-500">API Integration</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {exchange.isConnected ? (
                                    <Button variant="outline" className="text-xs border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white" onClick={() => onToggleConnect(exchange.id)}>
                                        Disconnect
                                    </Button>
                                ) : (
                                    <Button variant="primary" className="text-xs" onClick={() => onToggleConnect(exchange.id)}>
                                        Connect
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const PortfolioTracker: React.FC = () => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const [riskTolerance, setRiskTolerance] = useState(50);
    const [scenario, setScenario] = useState<'Normal' | 'Recession' | 'High Inflation' | 'Stagflation'>('Normal');
    
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [recommendations, setRecommendations] = useState<string[]>([]);
    
    const [exchanges, setExchanges] = useState<Exchange[]>(SUPPORTED_EXCHANGES);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const totalPortfolioValue = useMemo(() => MOCK_ASSETS.reduce((sum, asset) => sum + asset.value, 0), []);
    
    const portfolio24hChange = useMemo(() => {
        const totalValue24hAgo = MOCK_ASSETS.reduce((sum, asset) => sum + (asset.price24h * asset.amount), 0);
        return totalPortfolioValue - totalValue24hAgo;
    }, [totalPortfolioValue]);
    
    const portfolio24hChangePercent = useMemo(() => {
        const totalValue24hAgo = MOCK_ASSETS.reduce((sum, asset) => sum + (asset.price24h * asset.amount), 0);
        return (portfolio24hChange / totalValue24hAgo) * 100;
    }, [portfolio24hChange]);
    
    const portfolioHistory = useMemo(() => {
        const historyMap: { [key: string]: number } = {};
        MOCK_ASSETS.forEach(asset => {
            asset.history.forEach(point => {
                historyMap[point.time] = (historyMap[point.time] || 0) + point.value;
            });
        });
        return Object.entries(historyMap).map(([time, value]) => ({ time, value }));
    }, []);

    const chartData = selectedAsset ? selectedAsset.history : portfolioHistory;
    const chartColor = selectedAsset ? '#A78BFA' : '#6366F1';
    
    const simulationData = useMemo(() => generateSimulationData(MOCK_ASSETS, scenario), [scenario]);
    const simulationResult = useMemo(() => {
        const startValue = simulationData[0].value;
        const endValue = simulationData[simulationData.length - 1].value;
        const minValue = Math.min(...simulationData.map(d => d.value));
        return {
            projectedReturn: ((endValue - startValue) / startValue) * 100,
            maxDrawdown: ((startValue - minValue) / startValue) * 100,
        };
    }, [simulationData]);

    const handleOptimize = useCallback(async () => {
        setIsOptimizing(true);
        setRecommendations([]);

        const riskProfile = riskTolerance < 33 ? 'Conservative' : riskTolerance > 66 ? 'Aggressive' : 'Moderate';
        const portfolioString = MOCK_ASSETS.map(a => `${a.name} (${a.symbol}): ${((a.value / totalPortfolioValue) * 100).toFixed(1)}%`).join(', ');

        const prompt = `
            Analyze the following crypto portfolio with a ${riskProfile} risk profile.
            Portfolio: ${portfolioString}.

            Based on this, provide 3-4 actionable recommendations to optimize the portfolio. Suggestions should be concise, clear, and in a bulleted list format. 
            Focus on diversification, risk management, and potential opportunities.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const parsedRecommendations = response.text.split(/[-*]/).map(s => s.trim()).filter(Boolean);
            setRecommendations(parsedRecommendations);
            showToast('Portfolio optimization complete!', 'success');
        } catch (error) {
            console.error('Error fetching optimization:', error);
            showToast('Failed to get optimization suggestions.', 'error');
            setRecommendations([
                `**Error:** Could not generate recommendations.`,
            ]);
        } finally {
            setIsOptimizing(false);
        }

    }, [riskTolerance, totalPortfolioValue, showToast]);
    
    const handleToggleConnect = (id: string) => {
        setExchanges(prev => prev.map(ex => ex.id === id ? { ...ex, isConnected: !ex.isConnected } : ex));
    };

    const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
    const tooltipStyle = theme === 'dark' 
        ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' } 
        : { backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px' };

    const getRiskLabel = (value: number) => {
        if (value < 33) return 'Conservative';
        if (value > 66) return 'Aggressive';
        return 'Moderate';
    };

    return (
        <div className="space-y-8">
             <ConnectExchangeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                exchanges={exchanges}
                onToggleConnect={handleToggleConnect}
            />

            {/* Wealth Command Header */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 shadow-2xl animate-fade-in-slide-up">
                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                     <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/20 rounded-full blur-[100px]"></div>
                     
                     <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-400 font-medium mb-1">Total Net Worth</p>
                                <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                                    ${totalPortfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </h1>
                                <div className={`flex items-center mt-3 text-sm font-bold ${portfolio24hChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    <span className="px-2 py-0.5 rounded bg-white/10 mr-2">{portfolio24hChange >= 0 ? '▲' : '▼'} {Math.abs(portfolio24hChangePercent).toFixed(2)}%</span>
                                    <span>${Math.abs(portfolio24hChange).toLocaleString()} (24h)</span>
                                </div>
                            </div>
                            <div className="hidden sm:block">
                                 <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm" onClick={() => setIsModalOpen(true)}>
                                    + Add Source
                                 </Button>
                            </div>
                        </div>
                        
                        <div className="mt-8 h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="headerGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
                                    <Area type="monotone" dataKey="value" stroke="#818CF8" strokeWidth={3} fill="url(#headerGradient)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                     </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    {/* Allocation Card */}
                    <Card className="h-full flex flex-col justify-center animate-fade-in-slide-up" style={{ animationDelay: '100ms' }}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Asset Allocation</h3>
                        <div className="flex-1 min-h-[200px]">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={PORTFOLIO_ALLOCATION_DATA} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60}
                                        outerRadius={80} 
                                        fill="#8884d8" 
                                        paddingAngle={5}
                                        dataKey="value" 
                                    >
                                        {PORTFOLIO_ALLOCATION_DATA.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={tooltipStyle} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 flex-wrap mt-4">
                            {PORTFOLIO_ALLOCATION_DATA.map((entry, index) => (
                                <div key={entry.name} className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
            
            {/* Connected Exchanges Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 staggered-fade-in" style={{ animationDelay: '200ms' }}>
                 {exchanges.filter(e => e.isConnected).map(exchange => (
                     <div key={exchange.id} className="bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark p-4 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center">{exchange.logo}</div>
                            <span className="font-bold text-slate-900 dark:text-white">{exchange.name}</span>
                        </div>
                        <ExchangeStatusIndicator connected={exchange.isConnected} />
                    </div>
                 ))}
            </div>

            {/* Holdings Matrix */}
            <Card className="staggered-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Holdings Matrix</h3>
                    {selectedAsset && (
                         <Button variant="secondary" onClick={() => setSelectedAsset(null)} className="px-3 py-1 text-xs">Clear Selection</Button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-brand-border-light dark:border-brand-border-dark">
                                <th className="p-4 font-medium uppercase tracking-wider">Asset</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-right">Price</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-right">Balance</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-right">Value</th>
                                <th className="p-4 font-medium uppercase tracking-wider text-right">24h Change</th>
                                <th className="p-4 font-medium uppercase tracking-wider w-32">7d Trend</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border-light dark:divide-brand-border-dark">
                            {MOCK_ASSETS.map(asset => {
                                const change24h = (asset.price - asset.price24h) / asset.price24h * 100;
                                const isPos = change24h >= 0;
                                return (
                                    <tr 
                                        key={asset.id} 
                                        onClick={() => setSelectedAsset(asset)}
                                        className={`group cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-brand-darkest/50 ${selectedAsset?.id === asset.id ? 'bg-brand-primary/5' : ''}`}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center p-1">
                                                    {asset.logo}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">{asset.symbol}</p>
                                                    <p className="text-xs text-gray-500">{asset.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono text-slate-900 dark:text-white">${asset.price.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono text-gray-600 dark:text-gray-300">{asset.amount} {asset.symbol}</td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">${asset.value.toLocaleString()}</td>
                                        <td className="p-4 text-right">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${isPos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {isPos ? '+' : ''}{change24h.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <MiniSparkline data={asset.history} color={isPos ? '#10B981' : '#F43F5E'} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Intelligence Layer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 staggered-fade-in" style={{ animationDelay: '400ms' }}>
                 <Card className="flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Risk Simulator</h3>
                    </div>
                    
                    <div className="space-y-6 flex-grow">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Tolerance</label>
                                <span className="text-xs font-bold px-2 py-1 bg-brand-primary/10 text-brand-primary rounded uppercase">{getRiskLabel(riskTolerance)}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={riskTolerance}
                                onChange={(e) => setRiskTolerance(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-brand-darkest slider-thumb"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">Stress Test Scenario:</label>
                            <div className="grid grid-cols-2 gap-2">
                                 {(['Normal', 'Recession', 'High Inflation', 'Stagflation'] as const).map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setScenario(s)} 
                                        className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 ${scenario === s ? 'bg-brand-primary text-white border-transparent shadow-md' : 'bg-transparent border-brand-border-light dark:border-brand-border-dark text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-darkest'}`}
                                    >
                                        {s}
                                    </button>
                                 ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-brand-border-light dark:border-brand-border-dark">
                             <div className="flex justify-between items-center mb-2">
                                 <span className="text-sm text-gray-500">Projected Impact (12m)</span>
                             </div>
                             <div className="flex items-end gap-4">
                                 <div>
                                     <p className="text-xs text-gray-400 uppercase">Return</p>
                                     <p className={`text-2xl font-bold ${simulationResult.projectedReturn >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                         {simulationResult.projectedReturn >= 0 ? '+' : ''}{simulationResult.projectedReturn.toFixed(2)}%
                                     </p>
                                 </div>
                                 <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                                 <div>
                                     <p className="text-xs text-gray-400 uppercase">Max Drawdown</p>
                                     <p className="text-2xl font-bold text-rose-500">
                                         {simulationResult.maxDrawdown.toFixed(2)}%
                                     </p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </Card>

                <Card className="flex flex-col bg-gradient-to-br from-white to-gray-50 dark:from-brand-dark dark:to-brand-darkest border border-brand-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                         <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary animate-pulse">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Portfolio Architect</h3>
                            <p className="text-xs text-gray-500">Powered by Gemini 2.5</p>
                        </div>
                    </div>
                    
                    <div className="flex-grow mb-6 relative min-h-[200px]">
                        {isOptimizing ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-brand-primary font-medium animate-pulse">Analyzing Correlation Matrix...</p>
                                <p className="text-xs text-gray-400 mt-2">Checking volatility exposure against risk profile...</p>
                            </div>
                        ) : recommendations.length > 0 ? (
                            <div className="space-y-3 animate-fade-in-up">
                                {recommendations.map((rec, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-brand-dark rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                                         <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">{index + 1}</div>
                                         <p className="text-sm text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.*?)\*\*/g, '<strong class="text-brand-primary">$1</strong>') }}></p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">No active recommendations.</p>
                                <p className="text-xs text-gray-400 max-w-xs">Click below to let our AI analyze your current holdings against your selected risk profile.</p>
                            </div>
                        )}
                    </div>

                    <Button onClick={handleOptimize} disabled={isOptimizing} className="w-full shadow-lg shadow-brand-primary/20">
                        {isOptimizing ? 'Processing...' : 'Generate Optimization Report'}
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default PortfolioTracker;

