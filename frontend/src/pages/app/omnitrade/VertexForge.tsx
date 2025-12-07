import React, { useState, useEffect, useRef } from 'react';
import { CloudLightning, UploadCloud, ShieldCheck, Database, Zap, ChevronDown, Cpu, Activity, Terminal, Square, Play, Download } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, AreaChart, Area } from 'recharts';
import { TradingBot } from '@/types';

interface TrainingMetric {
    epoch: number;
    loss: number;
    valLoss: number;
    accuracy: number;
}

interface VertexForgeProps {
    bots: TradingBot[];
    onDeploy: (botId: string, modelVersion: string, computeNode: string) => void;
}

export const VertexForge: React.FC<VertexForgeProps> = ({ bots, onDeploy }) => {
    const [activeTab, setActiveTab] = useState<'TRAIN' | 'DEPLOY' | 'MONITOR'>('TRAIN');
    const [selectedBotId, setSelectedBotId] = useState<string>(bots[0]?.id || '');
    const [isTraining, setIsTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
    const [metrics, setMetrics] = useState<TrainingMetric[]>([]);

    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [trainingLogs]);

    const startTraining = async () => {
        setIsTraining(true);
        setProgress(0);
        setTrainingLogs(['[INIT] Initializing TensorFlow backend...', '[DATA] Loading historical dataset (50GB)...']);
        setMetrics([]);

        let epoch = 0;
        const interval = setInterval(() => {
            epoch++;
            const loss = Math.max(0.1, 0.8 - (epoch * 0.05) + (Math.random() * 0.1));
            const valLoss = Math.max(0.15, loss + 0.1 + (Math.random() * 0.05));
            const acc = Math.min(0.99, 0.5 + (epoch * 0.04));

            setMetrics(prev => [...prev, { epoch, loss, valLoss, accuracy: acc }]);
            setTrainingLogs(prev => [...prev, `[EPOCH ${epoch}] Loss: ${loss.toFixed(4)} | Val_Loss: ${valLoss.toFixed(4)} | Acc: ${(acc * 100).toFixed(2)}%`]);
            setProgress(epoch * 10);

            if (epoch >= 10) {
                clearInterval(interval);
                setIsTraining(false);
                setTrainingLogs(prev => [...prev, '[COMPLETE] Model successfully trained and serialized.', '[SAVE] Saved to gs:/omni-models/v4.2.0']);
            }
        }, 800);
    };

    return (
        <div className="space-y-6">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                    {['TRAIN', 'DEPLOY', 'MONITOR'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === tab ? 'bg-omni-accent text-omni-bg shadow-lg' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Compute Node:</span>
                    <span className="flex items-center gap-1 text-xs font-mono text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/30">
                        <Cpu size={12} /> NVIDIA A100 (x8)
                    </span>
                </div>
            </div>

            {activeTab === 'TRAIN' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Configuration Panel */}
                    <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <CloudLightning size={20} className="text-omni-accent" /> Model Config
                        </h3>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Target Bot / Strategy</label>
                            <div className="relative">
                                <select
                                    value={selectedBotId}
                                    onChange={(e) => setSelectedBotId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white appearance-none focus:border-omni-accent outline-none"
                                >
                                    {bots.map(b => <option key={b.id} value={b.id}>{b.name} ({b.pair})</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" size={16} />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Architecture</label>
                            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-omni-accent outline-none">
                                <option>Transformer (Time-Series)</option>
                                <option>LSTM + Attention</option>
                                <option>Deep Q-Network (RL)</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-slate-400 block mb-1">Hyperparameters</label>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" placeholder="Learning Rate (1e-4)" className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" />
                                <input type="text" placeholder="Batch Size (64)" className="bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                            <button
                                onClick={startTraining}
                                disabled={isTraining}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isTraining
                                    ? 'bg-slate-700 text-slate-400 cursor-wait'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-900/20'
                                    }`}
                            >
                                {isTraining ? <Activity className="animate-spin" /> : <Zap fill="currentColor" />}
                                {isTraining ? 'Training in Progress...' : 'Initialize Training Run'}
                            </button>
                        </div>
                    </div>

                    {/* Visualization & Terminal */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Training Metrics Chart */}
                        <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 h-[300px]">
                            <h3 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                                <Activity size={16} /> Real-time Loss / Accuracy
                            </h3>
                            {metrics.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="epoch" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                                        <Line type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="valLoss" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={false} yAxisId={0} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-600 border border-dashed border-slate-700 rounded-lg">
                                    Waiting for training metrics...
                                </div>
                            )}
                        </div>

                        {/* Terminal Output */}
                        <div className="bg-black rounded-xl border border-slate-800 p-4 font-mono text-xs h-[200px] overflow-hidden flex flex-col">
                            <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-800 pb-2">
                                <Terminal size={12} />
                                <span>vertex-cli output</span>
                            </div>
                            <div ref={terminalRef} className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                                {trainingLogs.map((log, i) => (
                                    <div key={i} className="break-all">
                                        <span className="text-slate-600 mr-2">$</span>
                                        {log}
                                    </div>
                                ))}
                                {isTraining && <div className="animate-pulse text-omni-accent">_</div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'DEPLOY' && (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-500 animate-in fade-in">
                    <UploadCloud size={48} className="mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-white mb-2">Model Registry</h3>
                    <p>Select a trained model artifact to deploy to the production fleet.</p>
                </div>
            )}
        </div>
    );
};

