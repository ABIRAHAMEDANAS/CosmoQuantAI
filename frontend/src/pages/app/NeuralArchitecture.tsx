// frontend/screens/app/NeuralArchitecture.tsx

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, Activity, Scale,
    BrainCircuit, Cpu, Zap, MessageSquare, ShieldCheck,
    Network, Globe, Crosshair, BarChart4, Clock, AlertOctagon,
    CheckCircle2, RefreshCw, Loader2, Power, RotateCcw, Trash2, Plus, Undo2, X, Layers
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// --- Types & Interfaces ---
interface Agent {
    id: string;
    name: string;
    type: string;
    model: string;
    status: 'Optimal' | 'Active' | 'Idle' | 'Training' | 'Stopped' | 'Booting' | 'Error';
    description: string;
}

// --- Main Component ---
const NeuralArchitecture: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'brain'>('monitor');

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Tab Switcher */}
            <div className="flex space-x-4 border-b border-gray-200 dark:border-slate-700 pb-2 mb-6">
                <button
                    onClick={() => setActiveTab('monitor')}
                    className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'monitor'
                            ? 'border-b-2 border-brand-primary text-brand-primary'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                >
                    System Monitor
                </button>
                <button
                    onClick={() => setActiveTab('brain')}
                    className={`pb-2 px-4 font-bold text-sm transition-all ${activeTab === 'brain'
                            ? 'border-b-2 border-brand-primary text-brand-primary'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                >
                    Brain Visualizer (Neural Grid)
                </button>
            </div>

            {activeTab === 'monitor' ? <SystemMonitor /> : <BrainVisualizer />}
        </div>
    );
};

// --- Sub-Component: System Monitor (Charts) ---
const SystemMonitor = () => {
    // Mock Data
    const pnlData = Array.from({ length: 20 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: 5000 + Math.random() * 2000 - 500 + (i * 150)
    }));

    const dailyPerformance = Array.from({ length: 14 }, (_, i) => ({
        day: new Date(Date.now() - (14 - i) * 86400000).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        pnl: Math.floor(Math.random() * 1200) - 400
    }));

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Portfolio Value" value="$24,592.40" sub="+12.5%" icon={DollarSign} trend="up" />
                <StatCard title="Daily PnL" value="$1,240.50" sub="+5.2%" icon={TrendingUp} trend="up" />
                <StatCard title="Sharpe Ratio" value="2.45" sub="Annualized" icon={Scale} trend="up" />
                <StatCard title="Active Agents" value="9/9" sub="All Systems Go" icon={Activity} trend="neutral" />
                <StatCard title="Drawdown" value="-1.2%" sub="Within Limits" icon={TrendingDown} trend="down" />
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl p-6 h-[400px] shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Cumulative Performance</h3>
                    <ResponsiveContainer width="100%" height="100%" className="!h-[320px]">
                        <AreaChart data={pnlData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                            <XAxis dataKey="name" hide />
                            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Health Panel */}
                <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">System Health</h3>
                    <div className="space-y-4 flex-1">
                        <HealthItem label="API Latency" value="45ms" status="good" />
                        <HealthItem label="CPU Load" value="32%" status="good" />
                        <HealthItem label="Memory" value="1.2GB / 8GB" status="good" />
                        <HealthItem label="Model Drift" value="0.04" status="warning" />
                        <HealthItem label="Execution Queue" value="Idle" status="good" />
                    </div>
                    <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <h4 className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-2">Latest Alert</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-200">Feature Lab: RSI divergence detected on BTC/USDT [15m]</p>
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl p-6 h-[350px] shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Daily Profit & Loss Analysis</h3>
                <ResponsiveContainer width="100%" height="100%" className="!h-[270px]">
                    <BarChart data={dailyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} vertical={false} />
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                            cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }}
                            contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <ReferenceLine y={0} stroke="#64748b" />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                            {dailyPerformance.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Sub-Component: Brain Visualizer (Agents) ---
const BrainVisualizer = () => {
    const [agents, setAgents] = useState<Agent[]>([
        { id: 'A', name: "Agent A", type: "Time-Series", model: "LSTM/GRU", status: "Optimal", description: "Specializes in Time-Series forecasting using LSTM/GRU networks." },
        { id: 'B', name: "Agent B", type: "NLP Sentiment", model: "FinBERT", status: "Active", description: "Scans global news, Twitter, and Reddit to quantify market sentiment." },
        { id: 'C', name: "Agent C", type: "Decision Core", model: "PPO/RL", status: "Active", description: "The Central Command Node. Uses PPO Deep Reinforcement Learning." },
        { id: 'D', name: "Agent D", type: "Risk Guardian", model: "VaR/MonteCarlo", status: "Optimal", description: "Calculates Value-at-Risk (VaR) and enforces stop-loss limits." },
        { id: 'E', name: "Agent E", type: "Whale Watcher", model: "GraphNN", status: "Active", description: "Monitors Mempools for large transactions." },
        { id: 'F', name: "Agent F", type: "Macro Analyst", model: "Vector AR", status: "Idle", description: "Tracks interest rates and inflation prints." },
        { id: 'G', name: "Agent G", type: "Crash Sim", model: "GANs", status: "Idle", description: "Generates synthetic 'Black Swan' crash scenarios." },
        { id: 'H', name: "Agent H", type: "Arb Hunter", model: "Cointegration", status: "Idle", description: "Scans for pricing inefficiencies across exchanges." },
        { id: 'I', name: "Agent I", type: "Order Router", model: "TWAP/VWAP", status: "Active", description: "Minimizes market impact and slippage." },
    ]);

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Stopped' ? 'Booting' : 'Stopped' } : a));
        if (agents.find(a => a.id === id)?.status === 'Stopped') {
            setTimeout(() => {
                setAgents(curr => curr.map(a => a.id === id ? { ...a, status: 'Active' } : a));
            }, 1500);
        }
    };

    const runAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => setIsAnalyzing(false), 3000);
    };

    const getIconForAgent = (id: string) => {
        switch (id) {
            case 'A': return <Activity size={12} />;
            case 'B': return <MessageSquare size={12} />;
            case 'C': return <BrainCircuit size={12} />;
            case 'D': return <ShieldCheck size={12} />;
            case 'E': return <Network size={12} />;
            case 'F': return <Globe size={12} />;
            case 'G': return <Zap size={12} />;
            case 'H': return <Crosshair size={12} />;
            case 'I': return <BarChart4 size={12} />;
            default: return <Cpu size={12} />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Grid Side */}
            <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <BrainCircuit size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Neural Ensemble Grid</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Distributed Swarm Intelligence</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                    {agents.map(agent => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            icon={getIconForAgent(agent.id)}
                            onToggle={() => toggleAgent(agent.id)}
                        />
                    ))}
                </div>

                <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all mb-4 flex items-center justify-center gap-2 ${isAnalyzing
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                        }`}
                >
                    {isAnalyzing ? (
                        <> <Cpu className="animate-spin" /> SYNTHESIZING CONSENSUS... </>
                    ) : (
                        <> <Zap /> TRIGGER SWARM ANALYSIS </>
                    )}
                </button>
            </div>

            {/* Output Side (Simulated) */}
            <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex flex-col shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Layers size={18} /> Strategic Output
                </h3>

                {isAnalyzing ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 size={48} className="text-brand-primary animate-spin" />
                        <p className="text-slate-500 animate-pulse">Running Monte Carlo Simulations...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="p-6 rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-center">
                            <span className="block text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Swarm Consensus</span>
                            <span className="text-4xl font-black text-emerald-600 dark:text-emerald-500">BUY</span>
                            <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Confidence: 87.4%</div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                            <h4 className="text-sm font-semibold text-indigo-500 mb-2">Reasoning</h4>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                Agent A detects a local minimum with high probability. Agent B reports positive sentiment surge on Twitter regarding ETF approvals.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Helper Components ---

const StatCard = ({ title, value, sub, icon: Icon, trend }: any) => {
    const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-amber-500';
    return (
        <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl p-6 flex items-start justify-between hover:border-brand-primary/50 transition-colors shadow-sm">
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</h4>
                <span className={`text-xs font-mono ${trendColor}`}>{sub}</span>
            </div>
            <div className={`p-3 rounded-lg bg-slate-50 dark:bg-slate-800 ${trendColor}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

const HealthItem = ({ label, value, status }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
        <span className="text-slate-600 dark:text-slate-400 text-sm">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-slate-900 dark:text-white font-mono text-sm">{value}</span>
            <div className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-emerald-500' : status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`}></div>
        </div>
    </div>
);

const AgentCard = ({ agent, icon, onToggle }: any) => {
    const isStopped = agent.status === 'Stopped';

    // Dynamic styles based on Light/Dark + Status
    let statusColor = 'text-slate-500';
    let borderColor = 'border-gray-200 dark:border-slate-700';
    let bgColor = 'bg-white dark:bg-slate-800';

    if (agent.status === 'Optimal' || agent.status === 'Active') {
        statusColor = 'text-emerald-500';
        borderColor = 'border-emerald-200 dark:border-emerald-500/30';
        bgColor = 'bg-emerald-50/50 dark:bg-emerald-500/5';
    } else if (agent.status === 'Booting' || agent.status === 'Training') {
        statusColor = 'text-amber-500';
        borderColor = 'border-amber-200 dark:border-amber-500/30';
    } else if (agent.status === 'Stopped') {
        statusColor = 'text-red-500';
        borderColor = 'border-red-200 dark:border-red-500/30';
    }

    return (
        <div className={`p-4 rounded-xl border relative group transition-all duration-300 ${bgColor} ${borderColor} hover:shadow-lg`}>
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-slate-100 dark:bg-slate-700 ${statusColor}`}>
                        {icon}
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Protocol</div>
                        <div className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{agent.name}</div>
                    </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${statusColor === 'text-emerald-500' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
            </div>

            <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Role:</span> <span className="text-slate-700 dark:text-slate-300">{agent.type}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Model:</span> <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-600 dark:text-slate-300">{agent.model}</span></div>
            </div>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-slate-900/10 dark:bg-black/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                    onClick={onToggle}
                    className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg text-slate-900 dark:text-white hover:scale-110 transition-transform"
                >
                    <Power size={18} />
                </button>
            </div>
        </div>
    );
};

export default NeuralArchitecture;
