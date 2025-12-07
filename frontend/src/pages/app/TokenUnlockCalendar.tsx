
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { GoogleGenAI } from '@google/genai';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { MOCK_TOKEN_UNLOCK_EVENTS, ClockIcon, ExclamationCircleIcon } from '@/constants';
import type { TokenUnlockEvent } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

// --- Sub-Components ---

// 1. Radial Impact Gauge
const ImpactGauge: React.FC<{ score: number }> = ({ score }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score/10) * circumference;

    let color = '#10B981'; // Green
    if (score >= 5) color = '#FBBF24'; // Yellow
    if (score >= 8) color = '#F43F5E'; // Red

    return (
        <div className="relative flex items-center justify-center w-12 h-12">
            <svg className="transform -rotate-90 w-full h-full">
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                <circle
                    cx="24" cy="24" r={radius}
                    stroke={color}
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <span className={`absolute text-[10px] font-bold ${score >= 8 ? 'text-rose-500' : score >= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {score}
            </span>
        </div>
    );
};

// 2. Mini Vesting Sparkline
const VestingSparkline: React.FC<{ data: any[], color: string }> = ({ data, color }) => (
    <div className="h-12 w-24 opacity-70">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <Area type="stepAfter" dataKey="unlockedPercentage" stroke={color} strokeWidth={2} fill={`url(#grad-${color})`} isAnimationActive={false} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

// 3. Countdown Timer
const UnlockCountdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTime = () => {
            const diff = new Date(targetDate).getTime() - new Date().getTime();
            if (diff <= 0) return "UNLOCKED";

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days}d ${hours}h`;
            return `${hours}h ${mins}m`;
        };

        setTimeLeft(calculateTime());
        const timer = setInterval(() => setTimeLeft(calculateTime()), 60000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-black/40 px-2 py-1 rounded-md border border-gray-200 dark:border-white/10">
            <ClockIcon className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-mono font-medium text-slate-700 dark:text-gray-300">{timeLeft}</span>
        </div>
    );
};

const EventDetailModal: React.FC<{ event: TokenUnlockEvent; onClose: () => void; }> = ({ event, onClose }) => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');

    const allocationData = useMemo(() => Array.isArray(event.allocation) ? event.allocation : [], [event.allocation]);
    const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
    const ALLOCATION_COLORS = ['#6366F1', '#818CF8', '#A78BFA', '#F472B6', '#F87171', '#FBBF24'];

    const handleGenerateSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        setAiSummary('');
        const prompt = `
            Analyze the following token unlock event and provide a concise, 2-sentence summary of its potential market impact.
            - Token: ${event.tokenName} (${event.tokenSymbol})
            - Unlock Amount: ${event.unlockAmount.toLocaleString()} tokens (valued at $${event.unlockAmountUSD.toLocaleString()})
            - Percentage of Circulating Supply: ${event.unlockPercentageOfCirculating.toFixed(2)}%
            - Allocation: ${allocationData.map(a => `${a.name} (${a.value}%)`).join(', ')}
            - Description: ${event.description}
            
            Focus on whether this is a high-risk event for price and why.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAiSummary(response.text);
        } catch (error) {
            console.error("Error generating summary:", error);
            showToast('Failed to generate AI summary.', 'error');
            setAiSummary("An error occurred while generating the summary. Please check the console for details and try again.");
        } finally {
            setIsSummaryLoading(false);
        }
    }, [event, allocationData, showToast]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-[#0B1120] w-full max-w-5xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-modal-content-slide-down overflow-hidden" onClick={e => e.stopPropagation()}>

                {/* Modal Header */}
                <div className="relative overflow-hidden p-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A]">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-white dark:bg-black/20 rounded-2xl p-3 shadow-sm border border-gray-200 dark:border-white/10">
                                {event.logo}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{event.tokenName} <span className="text-gray-400 font-normal">/ {event.tokenSymbol}</span></h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-400">
                            <span className="sr-only">Close</span>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-[#0B1120]">

                    {/* Top Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-5 rounded-xl bg-gray-50 dark:bg-brand-darkest/50 border border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Unlock Value</p>
                            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white mt-1">${event.unlockAmountUSD.toLocaleString()}</p>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-50 dark:bg-brand-darkest/50 border border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Supply Impact</p>
                            <p className="text-2xl font-mono font-bold text-brand-primary mt-1">{event.unlockPercentageOfCirculating.toFixed(2)}%</p>
                            <p className="text-xs text-gray-400">of circulating supply</p>
                        </div>
                        <div className="p-5 rounded-xl bg-gray-50 dark:bg-brand-darkest/50 border border-gray-100 dark:border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Risk Score</p>
                            <div className="flex items-center gap-2 mt-1">
                                <ImpactGauge score={event.impactScore} />
                                <span className="text-sm text-gray-400">/ 10</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Vesting Chart */}
                        <Card className="border border-gray-200 dark:border-white/5 shadow-none bg-transparent">
                            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                                Emission Schedule
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={event.vestingSchedule.map(d => ({ ...d, date: new Date(d.date).getTime() }))}>
                                        <defs>
                                            <linearGradient id="vestingGradientModal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                        <XAxis dataKey="date" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(time) => new Date(time).toLocaleDateString('en-US', { year: '2-digit', month: 'short' })} stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke={axisColor} fontSize={10} tickFormatter={(val) => `${val}%`} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip
                                            contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' } : { borderRadius: '8px' }}
                                            labelFormatter={(time) => new Date(time).toLocaleDateString()}
                                            formatter={(val: number) => [`${val.toFixed(1)}%`, 'Unlocked']}
                                        />
                                        <Area type="stepAfter" dataKey="unlockedPercentage" stroke="#6366F1" strokeWidth={3} fill="url(#vestingGradientModal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Allocation Pie */}
                        <Card className="border border-gray-200 dark:border-white/5 shadow-none bg-transparent">
                            <h3 className="text-lg font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                                Token Distribution
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData as any}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                        >
                                            {allocationData.map((entry, index) => <Cell key={`cell-${index}`} fill={ALLOCATION_COLORS[index % ALLOCATION_COLORS.length]} stroke="none" />)}
                                        </Pie>
                                        <Tooltip contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' } : { borderRadius: '8px' }} formatter={(value: number) => `${value}%`} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* AI Terminal */}
                    <Card className="bg-slate-900 border border-slate-800 text-blue-400 font-mono relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-blue-500/30">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                    QUANT_AI_ANALYSIS_MODULE
                                </h3>
                                <Button size="sm" variant="secondary" className="text-xs h-7 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-none" onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                                    {isSummaryLoading ? 'PROCESSING...' : 'RUN_SIMULATION'}
                                </Button>
                            </div>

                            <div className="min-h-[100px] text-sm leading-relaxed">
                                {aiSummary ? (
                                    <div className="animate-fade-in-up">
                                        <span className="text-purple-400">root@cosmo-quant:~$</span> analysis_complete<br />
                                        <span className="text-white/90">{aiSummary}</span>
                                        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                                    </div>
                                ) : (
                                    <div className="text-blue-500/50">
                                        <span className="text-purple-400">root@cosmo-quant:~$</span> waiting_for_command...<br />
                                        Initialize impact assessment protocols.
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F172A] flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Dismiss</Button>
                    <Button onClick={() => { showToast(`Alert set for ${event.tokenName} unlock`, 'success'); onClose(); }} variant="primary" className="shadow-lg shadow-brand-primary/25">
                        Set Smart Alert
                    </Button>
                </div>
            </div>
        </div>
    );
};

const TokenUnlockCalendar: React.FC = () => {
    const [selectedEvent, setSelectedEvent] = useState<TokenUnlockEvent | null>(null);
    const [minImpact, setMinImpact] = useState(0);

    const filteredEvents = useMemo(() => {
        return MOCK_TOKEN_UNLOCK_EVENTS
            .filter(event => event.impactScore >= minImpact)
            .sort((a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime());
    }, [minImpact]);

    const groupedEvents = useMemo(() => {
        const groups: { [key: string]: TokenUnlockEvent[] } = {
            'Imminent (7 Days)': [],
            'Upcoming (30 Days)': [],
            'Horizon': [],
        };
        const now = new Date();
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        filteredEvents.forEach(event => {
            const eventDate = new Date(event.unlockDate);
            if (eventDate <= sevenDays) groups['Imminent (7 Days)'].push(event);
            else if (eventDate <= thirtyDays) groups['Upcoming (30 Days)'].push(event);
            else groups['Horizon'].push(event);
        });

        return groups;
    }, [filteredEvents]);

    const getImpactColor = (score: number) => {
        if (score >= 8) return '#F43F5E'; // Red
        if (score >= 5) return '#FBBF24'; // Amber
        return '#10B981'; // Emerald
    };

    return (
        <div className="space-y-10">
            {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

            {/* Header / Filter Bar */}
            <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in-down">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><ClockIcon className="w-6 h-6" /></span>
                        Supply Shock Radar
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">Monitor vesting schedules to anticipate sell pressure.</p>
                </div>

                <div className="flex items-center gap-4 bg-gray-100 dark:bg-brand-darkest/50 p-2 rounded-xl w-full md:w-auto">
                    <div className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500">Impact Filter</div>
                    <div className="flex-1 flex items-center gap-3 px-2">
                        <span className="text-xs font-mono text-slate-600 dark:text-gray-300">0</span>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={minImpact}
                            onChange={(e) => setMinImpact(Number(e.target.value))}
                            className="w-full md:w-48 h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb accent-brand-primary"
                        />
                        <span className="text-xs font-mono text-slate-600 dark:text-gray-300">10</span>
                    </div>
                    <div className="px-3 py-1 bg-brand-primary text-white text-xs font-bold rounded-lg min-w-[3rem] text-center">
                        {minImpact}+
                    </div>
                </div>
            </div>

            {/* Event Groups */}
            <div className="space-y-12">
                {Object.entries(groupedEvents).map(([groupName, events], groupIndex) => (
                    Array.isArray(events) && events.length > 0 && (
                        <div key={groupName} className="staggered-fade-in" style={{ animationDelay: `${100 + groupIndex * 100}ms` }}>
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{groupName}</h2>
                                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {events.map((event, idx) => {
                                    const impactColor = getImpactColor(event.impactScore);
                                    // Mock linear data for the sparkline based on impact
                                    const sparklineData = event.vestingSchedule.map(d => ({ ...d, date: new Date(d.date).getTime() }));

                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            className="group relative bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl p-1 cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Top Glow Border */}
                                            <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${impactColor}, transparent)` }}></div>

                                            <div className="p-5 relative z-10">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-gray-50 dark:bg-brand-darkest rounded-xl flex items-center justify-center p-2 shadow-sm border border-gray-100 dark:border-gray-800">
                                                            {event.logo}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">{event.tokenName}</h3>
                                                            <p className="text-xs font-mono text-gray-500">{event.tokenSymbol}</p>
                                                        </div>
                                                    </div>
                                                    <ImpactGauge score={event.impactScore} />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Unlock Value</p>
                                                        <p className="text-base font-mono font-bold text-slate-800 dark:text-gray-200">${(event.unlockAmountUSD / 1000000).toFixed(1)}M</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Circ. Supply</p>
                                                        <p className="text-base font-mono font-bold text-slate-800 dark:text-gray-200">{event.unlockPercentageOfCirculating.toFixed(2)}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between">
                                                    <div className="flex flex-col gap-1.5">
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Schedule</p>
                                                        <VestingSparkline data={sparklineData} color={impactColor} />
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <UnlockCountdown targetDate={event.unlockDate} />
                                                        <p className="text-[10px] text-gray-400">{new Date(event.unlockDate).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Hover Background Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default TokenUnlockCalendar;

