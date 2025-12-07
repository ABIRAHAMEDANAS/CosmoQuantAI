import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, Scale } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Dashboard: React.FC = () => {
    // Cumulative PnL Data (Total Equity)
    const pnlData = Array.from({ length: 20 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: 5000 + Math.random() * 2000 - 500 + (i * 150)
    }));

    // Daily PnL Data (Discrete Gains/Losses)
    const dailyPerformance = Array.from({ length: 14 }, (_, i) => ({
        day: new Date(Date.now() - (14 - i) * 86400000).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
        pnl: Math.floor(Math.random() * 1200) - 400 // Mix of profit and loss
    }));

    // Calculate Sharpe Ratio (Annualized)
    const calculateSharpeRatio = () => {
        const returns = dailyPerformance.map(d => d.pnl);
        if (returns.length === 0) return "0.00";

        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / returns.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev === 0) return "0.00";

        // Annualized Sharpe = (Mean / StdDev) * sqrt(252 trading days)
        const dailySharpe = meanReturn / stdDev;
        const annualizedSharpe = dailySharpe * Math.sqrt(252);

        return annualizedSharpe.toFixed(2);
    };

    const sharpeRatio = calculateSharpeRatio();
    const sharpeValue = parseFloat(sharpeRatio);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Portfolio Value" value="$24,592.40" sub="+12.5%" icon={DollarSign} trend="up" />
                <StatCard title="Daily PnL" value="$1,240.50" sub="+5.2%" icon={TrendingUp} trend="up" />
                <StatCard title="Sharpe Ratio" value={sharpeRatio} sub="Annualized" icon={Scale} trend={sharpeValue > 2 ? "up" : sharpeValue > 1 ? "neutral" : "down"} />
                <StatCard title="Active Positions" value="3" sub="2 Long/1 Short" icon={Activity} trend="neutral" />
                <StatCard title="Drawdown" value="-1.2%" sub="Within Limits" icon={TrendingDown} trend="down" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-omni-panel border border-slate-700 rounded-xl p-6 h-[400px]">
                    <h3 className="text-lg font-semibold text-white mb-4">Cumulative PnL Performance</h3>
                    <ResponsiveContainer width="100%" height="100%" className="!h-[320px]">
                        <AreaChart data={pnlData}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="name" hide />
                            <YAxis stroke="#94a3b8" domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                                itemStyle={{ color: '#38bdf8' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#38bdf8" fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
                    <div className="space-y-4 flex-1">
                        <HealthItem label="API Latency" value="45ms" status="good" />
                        <HealthItem label="CPU Load" value="32%" status="good" />
                        <HealthItem label="Memory" value="1.2GB / 8GB" status="good" />
                        <HealthItem label="Model Drift" value="0.04" status="warning" />
                        <HealthItem label="Execution Queue" value="Idle" status="good" />
                    </div>
                    <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <h4 className="text-xs text-slate-400 uppercase font-bold mb-2">Latest Alert</h4>
                        <p className="text-sm text-white">Feature Lab: RSI divergence detected on BTC/USDT [15m]</p>
                    </div>
                </div>
            </div>

            {/* New Section: Daily Profit & Loss Analysis */}
            <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 h-[350px]">
                <h3 className="text-lg font-semibold text-white mb-4">Daily Profit & Loss Analysis (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height="100%" className="!h-[270px]">
                    <BarChart data={dailyPerformance}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                            cursor={{ fill: '#334155', opacity: 0.4 }}
                            formatter={(value: number) => [`$${value}`, 'PnL']}
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

const StatCard = ({ title, value, sub, icon: Icon, trend }: any) => {
    const trendColor = trend === 'up' ? 'text-omni-success' : trend === 'down' ? 'text-omni-danger' : 'text-omni-accent';
    return (
        <div className="bg-omni-panel border border-slate-700 rounded-xl p-6 flex items-start justify-between hover:border-slate-500 transition-colors">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h4 className="text-2xl font-bold text-white mb-1">{value}</h4>
                <span className={`text-xs font-mono ${trendColor}`}>{sub}</span>
            </div>
            <div className={`p-3 rounded-lg bg-slate-800 ${trendColor}`}>
                <Icon size={24} />
            </div>
        </div>
    );
};

const HealthItem = ({ label, value, status }: any) => (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
        <span className="text-slate-400 text-sm">{label}</span>
        <div className="flex items-center gap-2">
            <span className="text-white font-mono text-sm">{value}</span>
            <div className={`w-2 h-2 rounded-full ${status === 'good' ? 'bg-omni-success' : status === 'warning' ? 'bg-omni-warning' : 'bg-omni-danger'}`}></div>
        </div>
    </div>
);

