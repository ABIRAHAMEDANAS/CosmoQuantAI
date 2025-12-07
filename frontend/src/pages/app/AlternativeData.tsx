
import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ComposedChart, Area, AreaChart } from 'recharts';
import Card from '@/components/common/Card';
import { useTheme } from '@/context/ThemeContext';
import { MOCK_JOB_POSTINGS_DATA, MOCK_SAMPLE_JOBS } from '@/constants';
import Button from '@/components/common/Button';

// --- ICONS ---
const SatelliteIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 11a7 7 0 0 1-7 7m0 0a7 7 0 0 1-7-7m7 7v4m0 0H8m4 0h4" /></svg>
);

const CardIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
);

const MapPinIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
);

const BriefcaseIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

// --- MOCK DATA ---

const MOCK_STOCKS = ['TSLA', 'WMT', 'AAPL', 'AMZN'];

const MOCK_SATELLITE_DATA = [
    { week: 'W-5', count: 4200, confidence: 88 },
    { week: 'W-4', count: 4350, confidence: 89 },
    { week: 'W-3', count: 4500, confidence: 92 },
    { week: 'W-2', count: 4800, confidence: 90 },
    { week: 'W-1', count: 4650, confidence: 94 },
    { week: 'Current', count: 5100, confidence: 96 },
];

const MOCK_TRANSACTION_DATA = [
    { date: '2023-10-01', credit_card_spend: 4500, official_revenue: 4400 },
    { date: '2023-10-08', credit_card_spend: 4700, official_revenue: 4600 },
    { date: '2023-10-15', credit_card_spend: 4600, official_revenue: 4550 },
    { date: '2023-10-22', credit_card_spend: 5200, official_revenue: 4900 },
    { date: '2023-10-29', credit_card_spend: 5800, official_revenue: 5500 },
    { date: '2023-11-05', credit_card_spend: 6100, official_revenue: null }, // Leading indicator
    { date: '2023-11-12', credit_card_spend: 6300, official_revenue: null },
];

const MOCK_FOOT_TRAFFIC = [
    { hour: '8AM', traffic: 12 }, { hour: '10AM', traffic: 45 }, { hour: '12PM', traffic: 85 },
    { hour: '2PM', traffic: 65 }, { hour: '4PM', traffic: 90 }, { hour: '6PM', traffic: 55 },
    { hour: '8PM', traffic: 30 },
];

// --- ANIMATIONS & STYLES ---

const ScanLine = () => (
    <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-scan z-10 pointer-events-none"></div>
);

const DataMetric: React.FC<{ label: string; value: string; trend?: number; sub?: string }> = ({ label, value, trend, sub }) => (
    <div className="bg-white/80 dark:bg-brand-darkest/60 backdrop-blur-md border border-gray-200 dark:border-brand-border-dark p-4 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-brand-primary/30 transition-all">
        {/* Hover glow */}
        <div className="absolute -right-10 -top-10 w-24 h-24 bg-brand-primary/10 rounded-full blur-2xl group-hover:bg-brand-primary/20 transition-all duration-500"></div>

        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold z-10">{label}</p>
        <div className="mt-2 z-10">
            <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{value}</p>
            <div className="flex items-center gap-2 mt-1">
                {trend !== undefined && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
                {sub && <span className="text-xs text-gray-400">{sub}</span>}
            </div>
        </div>
    </div>
);

// --- VIEWS ---

const SatelliteView: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Visual Map Panel */}
            <div className="lg:col-span-2 relative bg-slate-900 rounded-2xl overflow-hidden border border-brand-border-dark shadow-2xl group">
                {/* Simulated Satellite Map Background */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30"></div>
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(51, 65, 85, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(51, 65, 85, 0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: 'perspective(500px) rotateX(10deg) scale(1.1)'
                }}></div>

                {/* "Parking Lot" Rectangles simulating cars */}
                <div className="absolute top-1/4 left-1/4 w-32 h-24 border-2 border-brand-primary/30 rounded bg-brand-primary/5 flex flex-wrap content-start p-1 gap-0.5">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div key={i} className={`w-2 h-3 rounded-sm ${Math.random() > 0.3 ? 'bg-white/80 shadow-[0_0_5px_white]' : 'bg-transparent'}`}></div>
                    ))}
                </div>
                <div className="absolute bottom-1/3 right-1/3 w-40 h-28 border-2 border-yellow-500/30 rounded bg-yellow-500/5 flex flex-wrap content-start p-1 gap-0.5">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div key={i} className={`w-2 h-3 rounded-sm ${Math.random() > 0.4 ? 'bg-white/80 shadow-[0_0_5px_white]' : 'bg-transparent'}`}></div>
                    ))}
                </div>

                <ScanLine />

                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 rounded text-xs font-mono text-brand-primary">
                    <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 animate-pulse"></span>
                    LIVE FEED: ORBITAL-4
                </div>
                <div className="absolute bottom-4 right-4 text-right">
                    <p className="text-[10px] text-gray-400 font-mono">LAT: 34.0522 N | LON: 118.2437 W</p>
                    <p className="text-xs font-bold text-white font-mono">OBJECT_COUNT: 5,102</p>
                </div>
            </div>

            {/* Analytics Panel */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                <DataMetric label="Car Count (Est)" value="5,102" trend={12.4} sub="vs last week" />
                <DataMetric label="Mall Footfall" value="~14.5k" trend={8.1} sub="Daily avg" />

                <Card className="flex-1 flex flex-col !p-4">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Capacity Utilization Trend</h4>
                    <div className="flex-1 min-h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={MOCK_SATELLITE_DATA}>
                                <defs>
                                    <linearGradient id="satGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="week" hide />
                                <YAxis hide domain={['dataMin - 100', 'dataMax + 100']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fill="url(#satGradient)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>Correlation to Revenue:</span>
                        <span className="font-bold text-brand-primary">0.82 (High)</span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const TransactionView: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Consumer Spending Pulse</h3>
                            <p className="text-xs text-gray-500">Aggregated credit card data (Lag: T-2 days)</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded font-bold">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                            </span>
                            Leading Indicator
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={MOCK_TRANSACTION_DATA}>
                                <defs>
                                    <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                                <XAxis dataKey="date" stroke="#94A3B8" tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }}
                                    labelStyle={{ color: '#94A3B8' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="credit_card_spend" name="Alt Data Spend" stroke="#10B981" fill="url(#spendGradient)" strokeWidth={2} />
                                <Line type="step" dataKey="official_revenue" name="Consensus Rev" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col gap-4">
                <DataMetric label="Est. Revenue (QTD)" value="$42.5B" trend={3.2} sub="vs consensus" />
                <DataMetric label="Avg Ticket Size" value="$84.20" trend={-1.5} sub="YoY" />

                <Card className="flex-1 !p-0 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20"></div>
                    <div className="p-5 relative z-10">
                        <h4 className="text-sm font-bold text-white mb-2">Signal Strength</h4>
                        <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-green-400 w-[85%]"></div>
                            </div>
                            <span className="text-green-400 font-bold text-sm">85%</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Based on historical correlation, current spend data predicts an earnings beat with high confidence.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const GeolocationView: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-brand-border-light dark:border-brand-border-dark shadow-xl">
                    {/* Map Base */}
                    <div className="absolute inset-0 bg-gray-200 dark:bg-slate-800">
                        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
                            <defs>
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                    </div>

                    {/* Heatmap overlay using radial gradients */}
                    <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-red-500/40 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-yellow-500/30 rounded-full blur-3xl mix-blend-screen"></div>
                    <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl mix-blend-screen"></div>

                    <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur p-3 rounded-xl border border-gray-200 dark:border-white/10">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">Traffic Density</h4>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                            <span>Low</span>
                            <div className="w-24 h-2 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"></div>
                            <span>High</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-4">
                    <Card>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Intraday Foot Traffic</h4>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={MOCK_FOOT_TRAFFIC}>
                                    <Bar dataKey="traffic" fill="#F472B6" radius={[4, 4, 0, 0]} />
                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                    <DataMetric label="Avg Dwell Time" value="42 min" trend={5.2} sub="MoM" />
                    <DataMetric label="Cross-Shopping" value="High" sub="Target <> Starbucks" />
                </div>
            </div>
        </div>
    );
};

const JobPostingsView: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            <Card className="lg:col-span-2 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Talent Demand (Hiring)</h3>
                    <span className="text-xs bg-purple-500/10 text-purple-500 px-2 py-1 rounded font-bold">Growth Signal</span>
                </div>
                <div className="flex-1 min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_JOB_POSTINGS_DATA} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="dept" type="category" width={100} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' }} />
                            <Bar dataKey="openings" radius={[0, 4, 4, 0]}>
                                {MOCK_JOB_POSTINGS_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE'][index % 4]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-4 flex-1 overflow-hidden flex flex-col">
                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3 font-mono">&gt;&gt; LIVE_FEED: POSTINGS</h4>
                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar font-mono text-xs">
                        {MOCK_SAMPLE_JOBS.map((job, i) => (
                            <div key={i} className="p-2 bg-white/5 rounded border-l-2 border-purple-500">
                                <span className="text-white block mb-1">{job.title}</span>
                                <span className="text-gray-500">{job.department}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

const AlternativeData: React.FC = () => {
    const [activeSource, setActiveSource] = useState<'satellite' | 'transactions' | 'geolocation' | 'jobs'>('satellite');
    const [activeStock, setActiveStock] = useState(MOCK_STOCKS[0]);

    const navItems = [
        { id: 'satellite', label: 'Satellite Imagery', icon: <SatelliteIcon /> },
        { id: 'transactions', label: 'Card Transactions', icon: <CardIcon /> },
        { id: 'geolocation', label: 'Geolocation', icon: <MapPinIcon /> },
        { id: 'jobs', label: 'Hiring Trends', icon: <BriefcaseIcon /> },
    ];

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 animate-fade-in-slide-up">

            {/* Control Deck */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark p-2 rounded-2xl shadow-sm flex-shrink-0">
                <div className="flex p-1 bg-gray-100 dark:bg-brand-darkest/50 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveSource(item.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 whitespace-nowrap ${activeSource === item.id
                                ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/5'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4 md:mt-0 flex items-center gap-3 px-4">
                    <span className="text-xs font-bold text-gray-400 uppercase">Asset:</span>
                    <select
                        value={activeStock}
                        onChange={(e) => setActiveStock(e.target.value)}
                        className="bg-transparent text-lg font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                    >
                        {MOCK_STOCKS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Content Stage */}
            <div className="flex-1 min-h-0 relative">
                {activeSource === 'satellite' && <SatelliteView />}
                {activeSource === 'transactions' && <TransactionView />}
                {activeSource === 'geolocation' && <GeolocationView />}
                {activeSource === 'jobs' && <JobPostingsView />}
            </div>

            {/* Style for scan animation */}
            <style>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default AlternativeData;

