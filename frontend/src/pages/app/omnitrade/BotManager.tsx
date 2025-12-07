import React, { useState } from 'react';
import { DollarSign, TrendingUp, Activity, Share2, Crown, ShieldAlert, Lock, Unlock, AlertTriangle, Cpu, Network, Bot, Search, Plus, CloudLightning, BarChart3, Pause, Play, ArrowUpRight, Square, XCircle, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TradingBot } from '@/types';

interface SwarmAgent {
    id: string;
    name: string;
    role: string;
    isActive: boolean;
}

interface BotManagerProps {
    bots: TradingBot[];
    setBots: React.Dispatch<React.SetStateAction<TradingBot[]>>;
}

export const BotManager: React.FC<BotManagerProps> = ({ bots, setBots }) => {
    // --- STATE MANAGEMENT ---
    const [showSwarmModal, setShowSwarmModal] = useState(false);
    const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
    const [systemLocked, setSystemLocked] = useState(false);

    // Mock Swarm Configuration for the Super Bot
    const [swarmConfig, setSwarmConfig] = useState<SwarmAgent[]>([
        { id: 'A', name: 'Agent A', role: 'Time-Series Forecast', isActive: true },
        { id: 'B', name: 'Agent B', role: 'NLP Sentiment', isActive: true },
        { id: 'C', name: 'Agent C', role: 'Decision Core (RL)', isActive: true },
        { id: 'D', name: 'Agent D', role: 'Risk Guardian', isActive: true },
        { id: 'E', name: 'Agent E', role: 'Whale Watcher', isActive: true },
        { id: 'F', name: 'Agent F', role: 'Macro Analyst', isActive: true },
        { id: 'G', name: 'Agent G', role: 'Crash Simulator', isActive: true },
        { id: 'H', name: 'Agent H', role: 'Arb Hunter', isActive: true },
        { id: 'I', name: 'Agent I', role: 'Order Router', isActive: true },
    ]);

    const [architectLog, setArchitectLog] = useState<string[]>([
        "[SYSTEM_INIT] The Architect is online.",
        "[OVERSIGHT] Connected to GENESIS-01 Omni-Link.",
        "[RISK_CHECK] Global exposure within safe variance limits (0.42).",
        "[DIRECTIVE] Awaiting user command input..."
    ]);

    // Architect Control Actions
    const handleArchitectAction = (action: string) => {
        const timestamp = new Date().toLocaleTimeString();

        switch (action) {
            case 'LOCK':
                setSystemLocked(!systemLocked);
                setArchitectLog(prev => [`[${timestamp}] SYSTEM ${!systemLocked ? 'LOCKED' : 'UNLOCKED'} BY ADMIN OVERRIDE.`, ...prev]);
                break;
            case 'LIQUIDATE':
                setArchitectLog(prev => [`[${timestamp}] EMERGENCY LIQUIDATION PROTOCOL INITIATED. SELLING ALL ASSETS.`, ...prev]);
                setBots(prev => prev.map(b => ({ ...b, status: 'STOPPED', pnl: b.pnl * 0.9 }))); // Simulate loss on forced sale
                break;
            case 'INJECT':
                setArchitectLog(prev => [`[${timestamp}] CAPITAL INJECTION CONFIRMED. +$50,000 USDT ALLOCATED.`, ...prev]);
                break;
            case 'RESET':
                setArchitectLog(prev => [`[${timestamp}] NEURAL WEIGHTS FLUSHED. RE-INITIALIZING SWARM MEMORY...`, ...prev]);
                break;
        }
    };

    // Swarm Management
    const toggleSwarmAgent = (agentId: string) => {
        setSwarmConfig(prev => prev.map(a =>
            a.id === agentId ? { ...a, isActive: !a.isActive } : a
        ));
        setArchitectLog(prev => [`[CONFIG] Agent ${agentId} ${swarmConfig.find(a => a.id === agentId)?.isActive ? 'detached from' : 'linked to'} GENESIS-01.`, ...prev]);
    };

    const toggleStatus = (id: string) => {
        if (systemLocked) {
            setArchitectLog(prev => ["[DENIED] System is locked. Unlock to modify bot state.", ...prev]);
            return;
        }
        setBots(prev => prev.map(bot => {
            if (bot.id === id) {
                const newStatus = bot.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
                return { ...bot, status: newStatus };
            }
            return bot;
        }));
    };

    const stopBot = (id: string) => {
        if (systemLocked) return;
        setBots(prev => prev.map(bot => {
            if (bot.id === id) {
                return { ...bot, status: 'STOPPED', uptime: '-' };
            }
            return bot;
        }));
    }

    // Helper for small chart data
    const generateMiniChartData = () => Array.from({ length: 15 }, () => ({ val: Math.random() * 100 }));

    // Aggregate Stats
    const totalPnL = bots.reduce((acc, bot) => acc + bot.pnl, 0);
    const activeCount = bots.filter(b => b.status === 'RUNNING').length;
    const totalAllocated = bots.reduce((acc, bot) => acc + bot.allocation, 0);

    return (
        <div className="space-y-8 relative">

            {/* --- FLEET ANALYTICS BAR --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                <div className="bg-omni-panel border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Total AUM</div>
                        <div className="text-xl font-mono font-bold text-white">${totalAllocated.toLocaleString()}</div>
                    </div>
                </div>
                <div className="bg-omni-panel border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Fleet Alpha</div>
                        <div className="text-xl font-mono font-bold text-emerald-400">+12.4%</div>
                    </div>
                </div>
                <div className="bg-omni-panel border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Active Nodes</div>
                        <div className="text-xl font-mono font-bold text-white">{activeCount}/{bots.length}</div>
                    </div>
                </div>
                <div className="bg-omni-panel border border-slate-700 rounded-xl p-4 flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                        <Share2 size={24} />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 font-bold uppercase">Sharpe Ratio</div>
                        <div className="text-xl font-mono font-bold text-white">2.85</div>
                    </div>
                </div>
            </div>

            {/* --- THE ARCHITECT (SYSTEM FATHER) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Architect Control Panel */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl relative overflow-hidden shadow-2xl shadow-amber-900/10">
                    {/* Background FX */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 animate-pulse pointer-events-none">
                        <Activity size={150} strokeWidth={1} />
                    </div>

                    <div className="p-8 relative z-10">
                        <div className="flex flex-col gap-6">
                            {/* Header */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/50 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Crown size={32} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                        THE ARCHITECT
                                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30 font-mono">ROOT ACCESS</span>
                                    </h2>
                                    <p className="text-amber-200/60 font-mono text-sm mt-1">
                                        System Father & Omni-Directional Oversight
                                    </p>
                                </div>
                            </div>

                            {/* GOD MODE COMMAND GRID */}
                            <div className="bg-black/40 rounded-xl p-4 border border-amber-500/10">
                                <div className="text-[10px] font-bold text-amber-500/50 uppercase mb-3 flex items-center gap-2">
                                    <ShieldAlert size={12} /> System Override Protocols
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <button
                                        onClick={() => handleArchitectAction('LOCK')}
                                        className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${systemLocked
                                            ? 'bg-amber-500 text-black border-amber-500 font-bold'
                                            : 'bg-slate-800/50 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                                            }`}
                                    >
                                        {systemLocked ? <Lock size={20} /> : <Unlock size={20} />}
                                        <span className="text-[10px] uppercase font-bold">{systemLocked ? 'UNLOCK SYS' : 'LOCK SYS'}</span>
                                    </button>

                                    <button
                                        onClick={() => handleArchitectAction('LIQUIDATE')}
                                        className="p-3 bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded-lg flex flex-col items-center justify-center gap-2 transition-all group"
                                    >
                                        <AlertTriangle size={20} />
                                        <span className="text-[10px] uppercase font-bold group-hover:hidden">Panic Sell</span>
                                        <span className="text-[10px] uppercase font-bold hidden group-hover:block">CONFIRM?</span>
                                    </button>

                                    <button
                                        onClick={() => handleArchitectAction('INJECT')}
                                        className="p-3 bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white rounded-lg flex flex-col items-center justify-center gap-2 transition-all"
                                    >
                                        <DollarSign size={20} />
                                        <span className="text-[10px] uppercase font-bold">Add Liquidity</span>
                                    </button>

                                    <button
                                        onClick={() => handleArchitectAction('RESET')}
                                        className="p-3 bg-blue-900/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg flex flex-col items-center justify-center gap-2 transition-all"
                                    >
                                        <Cpu size={20} />
                                        <span className="text-[10px] uppercase font-bold">Flush Neural</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Neural Mesh Topology Visualizer */}
                <div className="lg:col-span-1 bg-black/60 border border-amber-500/20 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent opacity-50"></div>
                    <h3 className="text-amber-500 font-bold text-sm mb-4 flex items-center gap-2 relative z-10">
                        <Network size={16} /> Neural Mesh Topology
                    </h3>
                    <div className="flex-1 flex items-center justify-center relative z-10">
                        {/* CSS Only Neural Mesh */}
                        <div className="relative w-48 h-48">
                            {/* Center Node (Architect) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] z-20 animate-pulse">
                                <Crown size={20} className="text-black" />
                            </div>

                            {/* Orbiting Nodes */}
                            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                                <div key={i} className="absolute w-full h-full top-0 left-0 animate-[spin_10s_linear_infinite]" style={{ animationDelay: `-${i}s` }}>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                                    {/* Connection Line */}
                                    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-blue-500/50 to-amber-500/50"></div>
                                </div>
                            ))}

                            {/* Radar Scan Effect */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-amber-500/30 rounded-full opacity-30 animate-ping"></div>
                        </div>
                    </div>
                    <div className="text-center text-[10px] text-amber-500/60 font-mono mt-4 relative z-10">
                        Swarm Synchronization: 99.98%
                    </div>
                </div>
            </div>

            {/* --- BOT FLEET GRID --- */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Bot size={24} className="text-slate-400" /> Subordinate Fleet
                    </h3>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search units..."
                                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
                            />
                        </div>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20">
                            <Plus size={18} /> Deploy New Unit
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {bots.map((bot) => (
                        <div key={bot.id} className={`bg-omni-panel border rounded-xl overflow-hidden hover:border-slate-500 transition-all duration-300 group relative ${bot.id === 'BOT-OMEGA' ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'border-slate-700'
                            }`}>

                            {/* Special Header for Super Bot */}
                            {bot.id === 'BOT-OMEGA' && (
                                <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1 flex items-center gap-2 justify-center">
                                    <Crown size={12} className="text-amber-500" />
                                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Flagship Omni-Link</span>
                                </div>
                            )}

                            {/* Status Line */}
                            <div className={`h-1 w-full ${bot.status === 'RUNNING' ? 'bg-omni-success' :
                                bot.status === 'PAUSED' ? 'bg-omni-warning' :
                                    'bg-slate-600'
                                }`}></div>

                            <div className="p-6">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${bot.id === 'BOT-OMEGA' ? 'bg-amber-500/20 text-amber-400' :
                                            bot.strategy === 'Scalping' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-slate-700/50 text-slate-400'
                                            }`}>
                                            {bot.id === 'BOT-OMEGA' ? <Network size={24} /> : <Bot size={20} />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg ${bot.id === 'BOT-OMEGA' ? 'text-amber-100' : 'text-white'}`}>{bot.name}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                                                <span>{bot.pair}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                                <span>{bot.strategy}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`px-2 py-1 rounded text-xs font-bold border flex items-center gap-1.5 ${bot.status === 'RUNNING' ? 'bg-omni-success/10 text-omni-success border-omni-success/30' :
                                        bot.status === 'PAUSED' ? 'bg-omni-warning/10 text-omni-warning border-omni-warning/30' :
                                            'bg-slate-700 text-slate-400 border-slate-600'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'RUNNING' ? 'bg-omni-success animate-pulse' :
                                            bot.status === 'PAUSED' ? 'bg-omni-warning' :
                                                'bg-slate-500'
                                            }`}></span>
                                        {bot.status}
                                    </div>
                                </div>

                                {/* Vertex Model Version Chip */}
                                {bot.modelVersion && (
                                    <div className="mb-4 bg-slate-900/50 border border-slate-700/50 rounded-lg p-2 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 flex items-center gap-1">
                                            <CloudLightning size={12} /> Vertex AI Core
                                        </span>
                                        <span className="font-mono text-purple-400 bg-purple-900/20 px-1.5 py-0.5 rounded border border-purple-500/20">
                                            {bot.modelVersion}
                                        </span>
                                    </div>
                                )}

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                                            <DollarSign size={12} /> Total PnL
                                        </div>
                                        <div className={`text-lg font-mono font-bold ${bot.pnl >= 0 ? 'text-omni-success' : 'text-omni-danger'}`}>
                                            {bot.pnl >= 0 ? '+' : ''}{bot.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                        <div className="text-xs text-slate-400 flex items-center gap-1 mb-1">
                                            <BarChart3 size={12} /> Win Rate
                                        </div>
                                        <div className="text-lg font-mono font-bold text-white">
                                            {bot.winRate}%
                                        </div>
                                    </div>
                                </div>

                                {/* Mini Sparkline Chart Area */}
                                <div className="h-12 mb-4 opacity-50 group-hover:opacity-100 transition-opacity relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={generateMiniChartData()}>
                                            <defs>
                                                <linearGradient id={`grad-${bot.id}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={bot.pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor={bot.pnl >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Area
                                                type="monotone"
                                                dataKey="val"
                                                stroke={bot.pnl >= 0 ? '#10b981' : '#ef4444'}
                                                strokeWidth={2}
                                                fill={`url(#grad-${bot.id})`}
                                                isAnimationActive={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-slate-700/50">
                                    {bot.status === 'RUNNING' ? (
                                        <button
                                            onClick={() => toggleStatus(bot.id)}
                                            className="flex-1 bg-omni-warning/10 hover:bg-omni-warning/20 text-omni-warning border border-omni-warning/30 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Pause size={16} /> Pause
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleStatus(bot.id)}
                                            disabled={bot.status === 'STOPPED'}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors ${bot.status === 'STOPPED'
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'bg-omni-success/10 hover:bg-omni-success/20 text-omni-success border border-omni-success/30'
                                                }`}
                                        >
                                            <Play size={16} /> Start
                                        </button>
                                    )}

                                    {/* Special "Configure Swarm" Button for Omni-Bot */}
                                    {bot.id === 'BOT-OMEGA' && (
                                        <button
                                            onClick={() => { setSelectedBotId(bot.id); setShowSwarmModal(true); }}
                                            className="px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors flex items-center justify-center"
                                            title="Configure Neural Swarm"
                                        >
                                            <Share2 size={16} />
                                        </button>
                                    )}

                                    {/* Deep Dive Button */}
                                    <button
                                        className="px-3 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors flex items-center justify-center"
                                        title="Deep Dive Analytics"
                                    >
                                        <ArrowUpRight size={16} />
                                    </button>

                                    <button
                                        onClick={() => stopBot(bot.id)}
                                        disabled={bot.status === 'STOPPED'}
                                        className={`px-3 rounded-lg border flex items-center justify-center transition-colors ${bot.status === 'STOPPED'
                                            ? 'bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-omni-danger hover:border-omni-danger/50'
                                            }`}
                                    >
                                        <Square size={16} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- SWARM CONFIGURATION MODAL (For Omni-Bot) --- */}
            {showSwarmModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-omni-panel border border-slate-600 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                                    <Network size={20} className="text-amber-500" /> Neural Swarm Configuration
                                </h3>
                                <p className="text-xs text-slate-400">Manage active agents for GENESIS-01 [Omni-Link]</p>
                            </div>
                            <button onClick={() => setShowSwarmModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {swarmConfig.map((agent) => (
                                    <div key={agent.id} className={`p-4 rounded-lg border flex items-center justify-between transition-all ${agent.isActive
                                        ? 'bg-indigo-500/10 border-indigo-500/50'
                                        : 'bg-slate-900 border-slate-700 opacity-60'
                                        }`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${agent.isActive ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}`}>
                                                <Cpu size={18} />
                                            </div>
                                            <div>
                                                <div className={`font-bold text-sm ${agent.isActive ? 'text-white' : 'text-slate-400'}`}>{agent.name}</div>
                                                <div className="text-xs text-slate-500">{agent.role}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleSwarmAgent(agent.id)}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${agent.isActive ? 'bg-indigo-500' : 'bg-slate-700'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${agent.isActive ? 'translate-x-6' : 'translate-x-0'
                                                }`}></div>
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-2 text-amber-500 font-bold text-sm mb-2">
                                    <AlertTriangle size={14} /> Swarm Intelligence Impact
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Linking fewer than 3 agents may result in suboptimal decision-making variance.
                                    Current configuration utilizes <strong>{swarmConfig.filter(a => a.isActive).length}/9</strong> available neural cores.
                                    Projected Model Accuracy: <span className="text-white font-mono">{Math.min(99.9, swarmConfig.filter(a => a.isActive).length * 11)}%</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setShowSwarmModal(false)} className="px-4 py-2 text-slate-300 hover:text-white text-sm font-bold">Cancel</button>
                            <button onClick={() => { setArchitectLog(p => ["[CONFIG] SWARM UPDATE CONFIRMED.", ...p]); setShowSwarmModal(false); }} className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} /> Confirm Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

