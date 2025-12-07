
import React, { useState, useEffect } from 'react';
import { BrainCircuit, Cpu, Zap, MessageSquare, AlertTriangle, RefreshCw, GitBranch, Layers, ShieldCheck, Globe, Activity, Network, BarChart4, Crosshair, Info, CheckCircle2, Clock, AlertOctagon, Loader2, Power, RotateCcw, Play, Pause, Trash2, Plus, X, Undo2, CloudLightning } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { analyzeMarketData } from '@/services/geminiService';
import { AiAnalysisResult, IndicatorData, TradingBot } from '@/types';

interface BrainCoreProps {
    currentData: IndicatorData;
    genesisBot?: TradingBot;
}

interface Agent {
    id: string;
    name: string;
    type: string;
    model: string;
    status: 'Optimal' | 'Active' | 'Idle' | 'Training' | 'Stopped' | 'Booting' | 'Error';
    description: string;
}

export const BrainCore: React.FC<BrainCoreProps> = ({ currentData, genesisBot }) => {
    const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [trainingProgress, setTrainingProgress] = useState(0);

    // Agent Management State
    const [showAddModal, setShowAddModal] = useState(false);
    const [deletedHistory, setDeletedHistory] = useState<Agent[]>([]);
    const [newAgentForm, setNewAgentForm] = useState({ name: '', type: '', model: '', description: '' });

    // Agent State Management
    const [agents, setAgents] = useState<Agent[]>([
        { id: 'A', name: "Agent A", type: "Time-Series", model: "LSTM/GRU", status: "Optimal", description: "Specializes in Time-Series forecasting using LSTM/GRU networks. Identifies local minima/maxima and predicts short-term price trajectories." },
        { id: 'B', name: "Agent B", type: "NLP Sentiment", model: "FinBERT", status: "Active", description: "Natural Language Processing (NLP) unit using FinBERT. Scans global news, Twitter, and Reddit to quantify market sentiment polarity." },
        { id: 'C', name: "Agent C", type: "Decision Core", model: "PPO/RL", status: "Active", description: "The Central Command Node. Uses Proximal Policy Optimization (PPO) Deep Reinforcement Learning to aggregate inputs and execute trades." },
        { id: 'D', name: "Agent D", type: "Risk Guardian", model: "VaR/MonteCarlo", status: "Optimal", description: "Calculates Value-at-Risk (VaR) and Expected Shortfall. Enforces dynamic stop-loss limits and position sizing constraints." },
        { id: 'E', name: "Agent E", type: "Whale Watcher", model: "GraphNN", status: "Active", description: "Monitors Mempools and DEX liquidity using Graph Neural Networks to detect 'Whale' accumulation or distribution patterns." },
        { id: 'F', name: "Agent F", type: "Macro Analyst", model: "Vector AR", status: "Idle", description: "Tracks interest rates, inflation prints (CPI/PPI), and bond yields to determine the broader market regime." },
        { id: 'G', name: "Agent G", type: "Crash Sim", model: "GANs", status: "Idle", description: "Generative Adversarial Network (GAN) simulator. Continually generates synthetic 'Black Swan' crash scenarios to stress-test positions." },
        { id: 'H', name: "Agent H", type: "Arb Hunter", model: "Cointegration", status: "Idle", description: "Scans for cointegration pairs and pricing inefficiencies across multiple exchanges to capture risk-free spreads." },
        { id: 'I', name: "Agent I", type: "Order Router", model: "TWAP/VWAP", status: "Active", description: "Uses TWAP and VWAP algorithms to slice large orders, minimizing market impact and slippage." },
    ]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
    };

    // Agent Control Handlers
    const toggleAgent = (id: string) => {
        setAgents(prev => prev.map(agent => {
            if (agent.id === id) {
                const newStatus = agent.status === 'Stopped' ? 'Booting' : 'Stopped';
                addLog(`[MANUAL OVERRIDE] ${agent.name} switched to ${newStatus.toUpperCase()}.`);

                // Simulate boot sequence
                if (newStatus === 'Booting') {
                    setTimeout(() => {
                        setAgents(curr => curr.map(a => a.id === id ? { ...a, status: 'Active' } : a));
                        addLog(`[SYSTEM] ${agent.name} is now ONLINE.`);
                    }, 2000);
                }

                return { ...agent, status: newStatus };
            }
            return agent;
        }));
    };

    const restartAgent = (id: string) => {
        addLog(`[MANUAL OVERRIDE] Rebooting ${agents.find(a => a.id === id)?.name}...`);
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'Booting' } : a));

        setTimeout(() => {
            setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'Optimal' } : a));
            addLog(`[SYSTEM] ${agents.find(a => a.id === id)?.name} reboot complete. All systems nominal.`);
        }, 2500);
    };

    const deleteAgent = (id: string) => {
        const agentToDelete = agents.find(a => a.id === id);
        if (agentToDelete) {
            setDeletedHistory(prev => [...prev, agentToDelete]);
            setAgents(prev => prev.filter(a => a.id !== id));
            addLog(`[SYSTEM] Agent ${agentToDelete.name} terminated and removed from grid.`);
        }
    };

    const undoDelete = () => {
        if (deletedHistory.length === 0) return;
        const lastDeleted = deletedHistory[deletedHistory.length - 1];

        setAgents(prev => [...prev, lastDeleted]);
        setDeletedHistory(prev => prev.slice(0, -1));
        addLog(`[SYSTEM] Restoration complete. Agent ${lastDeleted.name} re-initialized.`);
    };

    const handleAddAgent = () => {
        if (!newAgentForm.name || !newAgentForm.type) return;

        const newAgent: Agent = {
            id: `CUSTOM-${Date.now()}`,
            name: newAgentForm.name,
            type: newAgentForm.type,
            model: newAgentForm.model || 'Custom Model',
            description: newAgentForm.description || 'Custom deployed neural unit.',
            status: 'Booting'
        };

        setAgents(prev => [...prev, newAgent]);
        addLog(`[DEPLOY] New unit ${newAgent.name} injected into Neural Mesh.`);
        setShowAddModal(false);
        setNewAgentForm({ name: '', type: '', model: '', description: '' });

        // Simulate boot
        setTimeout(() => {
            setAgents(prev => prev.map(a => a.id === newAgent.id ? { ...a, status: 'Active' } : a));
        }, 1500);
    };

    // --------------------------------------------------------------------------
    // PLACEHOLDER: PPO Reinforcement Learning Training Logic
    // --------------------------------------------------------------------------
    const trainPPOAgent = async () => {
        if (isTraining) return;
        setIsTraining(true);
        setTrainingProgress(0);

        // Update Agent C status
        setAgents(prev => prev.map(a => a.id === 'C' ? { ...a, status: 'Training' } : a));

        const steps = [
            "Initializing OmniTradeEnv (Gymnasium)...",
            "Loading Historical Tick Data for Replay Buffer...",
            "Defining Reward Function (PnL - VolatilityPenalty)...",
            "Configuring PPO Policy (MlpPolicy, LR=0.0003)...",
            "Starting Training Loop (Ep 1/100)...",
            "Optimizing Policy Loss...",
            "Evaluating on Validation Set...",
            "Saving Model Weights to Registry."
        ];

        for (let i = 0; i < steps.length; i++) {
            addLog(`[TRAINING-RL] ${steps[i]}`);
            setTrainingProgress(((i + 1) / steps.length) * 100);
            await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        }

        addLog("[SUCCESS] Agent C successfully retrained. New version deployed.");
        setAgents(prev => prev.map(a => a.id === 'C' ? { ...a, status: 'Optimal' } : a));
        setIsTraining(false);
    };

    // --------------------------------------------------------------------------
    // PLACEHOLDER: LSTM Time-Series Training Logic
    // --------------------------------------------------------------------------
    const trainLstmAgent = async () => {
        if (isTraining) return;
        setIsTraining(true);
        setTrainingProgress(0);

        // Update Agent A status
        setAgents(prev => prev.map(a => a.id === 'A' ? { ...a, status: 'Training' } : a));

        const steps = [
            "Accessing Data Nexus: Retrieving 5-Year OHLCV (1h)...",
            "Preprocessing: Log Returns & Z-Score Normalization...",
            "Generating Tensor Sequences (Window=60, Horizon=1)...",
            "Building Architecture: LSTM(128) -> Dropout(0.2) -> Dense(1)...",
            "Compiling Model (Optimizer=Adam, Loss=MSE)...",
            "Training Epoch 1/50 (Loss: 0.0452)...",
            "Training Epoch 25/50 (Loss: 0.0104)...",
            "Validating on Hold-out Set (Accuracy: 87.4%)...",
            "Quantizing Model for TensorRT Inference...",
            "Deploying Weights to Agent A Container."
        ];

        for (let i = 0; i < steps.length; i++) {
            addLog(`[TRAINING-LSTM] ${steps[i]}`);
            setTrainingProgress(((i + 1) / steps.length) * 100);
            await new Promise(r => setTimeout(r, 800 + Math.random() * 500));
        }

        addLog("[SUCCESS] Agent A (Time-Series) upgraded to v3.0.1.");
        setAgents(prev => prev.map(a => a.id === 'A' ? { ...a, status: 'Optimal' } : a));
        setIsTraining(false);
    };

    const runAnalysis = async () => {
        if (!currentData) {
            addLog("[ERROR] No market data stream detected. Analysis aborted.");
            return;
        }

        // Check if critical agents are online
        const criticalAgents = ['A', 'B', 'C'];
        const offline = agents.filter(a => criticalAgents.includes(a.id) && a.status === 'Stopped');

        if (offline.length > 0) {
            addLog(`[ERROR] Analysis failed. Critical agents (${offline.map(a => a.name).join(', ')}) are OFFLINE.`);
            return;
        }

        setIsAnalyzing(true);
        addLog("Broadcasting state vector to Neural Mesh...");
        await new Promise(r => setTimeout(r, 600));
        addLog("Agent A (Time-Series) predicting local minima...");
        addLog("Agent E (Whale Watcher) scanning mempool for large txs...");
        await new Promise(r => setTimeout(r, 800));
        addLog("Agent B (NLP) fusing sentiment scores from FinBERT...");

        const result = await analyzeMarketData('BTC/USDT', currentData.price, currentData);

        setAnalysis(result);
        addLog(`Agent C (Decision) Consensus Reached: ${result.decision} (${result.confidence}% Confidence)`);
        setIsAnalyzing(false);
    };

    const getIconForAgent = (id: string) => {
        if (id.startsWith('CUSTOM')) return <Cpu size={12} />;
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full relative">
            {/* Visualizer Side */}
            <div className="space-y-6">
                <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-400 animate-pulse">
                                <BrainCircuit size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Neural Ensemble Grid</h2>
                                <p className="text-sm text-slate-400">Distributed Swarm Intelligence</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {deletedHistory.length > 0 && (
                                <button
                                    onClick={undoDelete}
                                    className="p-2 bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                    title="Undo Last Deletion"
                                >
                                    <Undo2 size={16} /> UNDO
                                </button>
                            )}
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold shadow-lg shadow-indigo-900/20"
                            >
                                <Plus size={16} /> DEPLOY UNIT
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6 relative">
                        {agents.map(agent => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                icon={getIconForAgent(agent.id)}
                                onToggle={() => toggleAgent(agent.id)}
                                onRestart={() => restartAgent(agent.id)}
                                onDelete={() => deleteAgent(agent.id)}
                            />
                        ))}
                    </div>

                    <button
                        onClick={runAnalysis}
                        disabled={isAnalyzing || isTraining || !currentData}
                        className={`w-full py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all mb-4 ${isAnalyzing
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                            }`}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                                <Cpu className="animate-spin" /> SYNTHESIZING CONSENSUS...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Zap /> TRIGGER SWARM ANALYSIS
                            </span>
                        )}
                    </button>

                    {/* Continuous Learning Panel */}
                    <div className="border-t border-slate-700 pt-4 mt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                <GitBranch size={16} /> Continuous Learning Pipeline
                            </h3>
                            {isTraining && <span className="text-xs text-omni-accent animate-pulse">OPTIMIZING... {Math.round(trainingProgress)}%</span>}
                        </div>

                        <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex flex-col gap-3">
                            {/* PPO Control - LINKED TO GENESIS BOT */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                        Agent C (Decision)
                                        {genesisBot?.modelVersion && (
                                            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded flex items-center gap-1">
                                                <CloudLightning size={8} /> VERTEX LINKED
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs font-mono text-white">
                                        {genesisBot?.modelVersion || 'v2.4.1-PPO'}
                                    </div>
                                </div>
                                <button
                                    onClick={trainPPOAgent}
                                    disabled={isTraining || isAnalyzing}
                                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors ${isTraining
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-omni-accent/10 text-omni-accent hover:bg-omni-accent/20 border border-omni-accent/50'
                                        }`}
                                >
                                    <RefreshCw size={12} className={isTraining ? "animate-spin" : ""} />
                                    {isTraining ? "TRAINING" : "RETRAIN PPO"}
                                </button>
                            </div>

                            {/* LSTM Control */}
                            <div className="flex items-center justify-between border-t border-slate-700 pt-2">
                                <div>
                                    <div className="text-xs text-slate-400">Agent A (Time-Series)</div>
                                    <div className="text-xs font-mono text-white">v1.8.0-LSTM</div>
                                </div>
                                <button
                                    onClick={trainLstmAgent}
                                    disabled={isTraining || isAnalyzing}
                                    className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-colors ${isTraining
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/50'
                                        }`}
                                >
                                    <Activity size={12} className={isTraining ? "animate-pulse" : ""} />
                                    {isTraining ? "TRAINING" : "RETRAIN LSTM"}
                                </button>
                            </div>
                        </div>
                        {isTraining && (
                            <div className="w-full h-1 bg-slate-700 mt-2 rounded-full overflow-hidden">
                                <div className="h-full bg-omni-accent transition-all duration-300" style={{ width: `${trainingProgress}%` }}></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-black/40 border border-slate-800 rounded-xl p-4 font-mono text-sm h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {logs.length === 0 ? (
                        <span className="text-slate-600">System idle. Neural swarm awaiting input vectors...</span>
                    ) : (
                        logs.map((log, i) => (
                            <div key={i} className="mb-1 text-slate-300 border-l-2 border-slate-700 pl-2 text-xs">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Results Side */}
            <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageSquare size={18} /> Strategic Output
                </h3>

                {analysis ? (
                    <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className={`p-6 rounded-xl border-2 text-center ${analysis.decision === 'BUY' ? 'border-omni-success bg-omni-success/10' :
                            analysis.decision === 'SELL' ? 'border-omni-danger bg-omni-danger/10' :
                                'border-omni-warning bg-omni-warning/10'
                            }`}>
                            <span className="block text-sm text-slate-400 uppercase tracking-widest mb-1">Swarm Consensus</span>
                            <span className={`text-4xl font-black ${analysis.decision === 'BUY' ? 'text-omni-success' :
                                analysis.decision === 'SELL' ? 'text-omni-danger' :
                                    'text-omni-warning'
                                }`}>{analysis.decision}</span>
                            <div className="mt-2 text-sm font-medium text-slate-300">
                                Confidence: {analysis.confidence}%
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-omni-accent mb-2">Reasoning</h4>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {analysis.reasoning}
                                </p>
                            </div>

                            <div className="bg-slate-800/50 p-4 rounded-lg">
                                <h4 className="text-sm font-semibold text-omni-danger mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Risk Assessment
                                </h4>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {analysis.riskAssessment}
                                </p>
                            </div>

                            {/* SHAP Feature Importance Visualization (Recharts) */}
                            {analysis.shapValues && (
                                <div className="bg-slate-800/50 p-4 rounded-lg h-80 flex flex-col">
                                    <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                                        <Layers size={14} /> XAI Feature Importance (SHAP)
                                    </h4>
                                    <div className="flex-1 w-full min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                layout="vertical"
                                                data={analysis.shapValues}
                                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                                <XAxis type="number" domain={[-1, 1]} hide />
                                                <YAxis dataKey="feature" type="category" width={100} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                                <RechartsTooltip
                                                    cursor={{ fill: '#334155', opacity: 0.2 }}
                                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#e2e8f0', fontSize: '12px' }}
                                                />
                                                <ReferenceLine x={0} stroke="#64748b" />
                                                <Bar dataKey="impact" name="Impact Score" radius={[0, 4, 4, 0]}>
                                                    {analysis.shapValues.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#10b981' : '#ef4444'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-2 text-center">
                                        SHAP values explain the marginal contribution of each feature to the final output. Green = Bullish, Red = Bearish.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                        <Cpu size={48} className="mb-4 opacity-50" />
                        <p>Run analysis to generate strategy</p>
                    </div>
                )}
            </div>

            {/* --- ADD AGENT MODAL --- */}
            {showAddModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-omni-panel border border-slate-600 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <Cpu size={18} className="text-indigo-400" /> Deploy New Neural Unit
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Agent Designation (Name)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Agent X - Volatility Hunter"
                                    value={newAgentForm.name}
                                    onChange={(e) => setNewAgentForm({ ...newAgentForm, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Role Type</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        placeholder="e.g. Risk Analyst"
                                        value={newAgentForm.type}
                                        onChange={(e) => setNewAgentForm({ ...newAgentForm, type: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Model Architecture</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                        placeholder="e.g. Transformer"
                                        value={newAgentForm.model}
                                        onChange={(e) => setNewAgentForm({ ...newAgentForm, model: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Protocol Description</label>
                                <textarea
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 outline-none h-24 resize-none"
                                    placeholder="Describe the agent's function..."
                                    value={newAgentForm.description}
                                    onChange={(e) => setNewAgentForm({ ...newAgentForm, description: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                onClick={handleAddAgent}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <Zap size={16} /> INITIALIZE DEPLOYMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AgentCardProps {
    agent: Agent;
    icon: React.ReactNode;
    onToggle: () => void;
    onRestart: () => void;
    onDelete: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, icon, onToggle, onRestart, onDelete }) => {
    // Enhanced Status Visualization Logic
    const getStatusConfig = (s: string) => {
        switch (s) {
            case 'Optimal':
                return {
                    borderColor: 'border-emerald-500',
                    bgColor: 'bg-emerald-500/10',
                    textColor: 'text-emerald-400',
                    iconColor: 'text-emerald-500',
                    shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]',
                    statusIcon: <CheckCircle2 size={14} className="text-emerald-500" />
                };
            case 'Active':
                return {
                    borderColor: 'border-cyan-500',
                    bgColor: 'bg-cyan-500/10',
                    textColor: 'text-cyan-400',
                    iconColor: 'text-cyan-500',
                    shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
                    statusIcon: <Activity size={14} className="text-cyan-500 animate-pulse" />
                };
            case 'Training':
                return {
                    borderColor: 'border-violet-500',
                    bgColor: 'bg-violet-500/10',
                    textColor: 'text-violet-400',
                    iconColor: 'text-violet-500',
                    shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]',
                    statusIcon: <Loader2 size={14} className="text-violet-500 animate-spin" />
                };
            case 'Booting':
                return {
                    borderColor: 'border-amber-500',
                    bgColor: 'bg-amber-500/10',
                    textColor: 'text-amber-400',
                    iconColor: 'text-amber-500',
                    shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
                    statusIcon: <RefreshCw size={14} className="text-amber-500 animate-spin" />
                };
            case 'Idle':
                return {
                    borderColor: 'border-slate-600',
                    bgColor: 'bg-slate-800/50',
                    textColor: 'text-slate-400',
                    iconColor: 'text-slate-500',
                    shadow: '',
                    statusIcon: <Clock size={14} className="text-slate-500" />
                };
            case 'Error':
            case 'Stopped':
                return {
                    borderColor: 'border-red-500',
                    bgColor: 'bg-red-500/10',
                    textColor: 'text-red-400',
                    iconColor: 'text-red-500',
                    shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
                    statusIcon: <AlertOctagon size={14} className="text-red-500" />
                };
            default:
                return {
                    borderColor: 'border-slate-700',
                    bgColor: 'bg-slate-800',
                    textColor: 'text-slate-400',
                    iconColor: 'text-slate-400',
                    shadow: '',
                    statusIcon: <Info size={14} />
                };
        }
    };

    const config = getStatusConfig(agent.status);
    const isStopped = agent.status === 'Stopped';

    return (
        <div className={`p-4 rounded-xl border relative group transition-all duration-300 ${config.bgColor} ${config.borderColor} ${config.shadow} hover:scale-[1.02]`}>

            {/* Background Pulse for Active/Training */}
            {(agent.status === 'Training' || agent.status === 'Active') && (
                <div className={`absolute inset-0 rounded-xl opacity-20 animate-pulse ${config.bgColor}`}></div>
            )}

            {/* Header Section */}
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md bg-black/30 border border-white/10 ${config.iconColor}`}>
                        {icon}
                    </div>
                    <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Protocol</div>
                        <div className="font-bold text-sm text-white leading-tight">{agent.name}</div>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-sm`}>
                    {config.statusIcon}
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>{agent.status}</span>
                </div>
            </div>

            {/* Details Section */}
            <div className="relative z-10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Function:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[120px]">{agent.type}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Architecture:</span>
                    <span className="font-mono text-xs bg-black/30 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700/50">{agent.model}</span>
                </div>
            </div>

            {/* Manual Control Overlay (Visible on Hover) */}
            <div className="absolute inset-0 bg-slate-900/90 rounded-xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 backdrop-blur-sm border border-slate-500/50">
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className={`p-3 rounded-full border transition-all transform hover:scale-110 shadow-lg ${isStopped
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500 hover:text-white'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500 hover:text-white'
                        }`}
                    title={isStopped ? "Activate Protocol" : "Suspend Protocol"}
                >
                    <Power size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onRestart(); }}
                    className="p-3 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                    title="Reboot System"
                >
                    <RotateCcw size={18} />
                </button>

                {/* Delete Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 shadow-lg"
                    title="Terminate Agent"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 w-72 bg-slate-900/95 border border-slate-600 rounded-xl p-4 shadow-2xl z-50 hidden group-hover:block backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                    <div className={`p-1.5 rounded-md bg-slate-800 ${config.iconColor}`}>{icon}</div>
                    <div>
                        <span className="block font-bold text-white text-sm">{agent.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide">System Description</span>
                    </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 font-sans">
                    {agent.description}
                </p>
                <div className="flex justify-between items-center text-[10px] font-mono bg-black/30 p-2 rounded border border-white/5">
                    <span className="text-slate-500">Current State</span>
                    <div className={`flex items-center gap-1.5 ${config.textColor}`}>
                        {config.statusIcon}
                        <span className="font-bold">{agent.status.toUpperCase()}</span>
                    </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-r border-slate-600 rotate-45"></div>
            </div>
        </div>
    );
};

