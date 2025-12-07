
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { generateInitialSentimentData, generateNewSentimentPoint, generateNewSentimentSource, generatePriceDataForSentiment } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import type { SentimentData, SentimentSource, SentimentLabel } from '@/types';
import { useToast } from '@/context/ToastContext';

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
const PIE_COLORS = { 'Positive': '#10B981', 'Negative': '#F43F5E', 'Neutral': '#64748B' };

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number; toFixed?: number; }> = ({ value, toFixed = 0 }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;
        const duration = 800; // ms
        let startTime: number | null = null;

        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsedTime = currentTime - startTime;
            const progress = Math.min(elapsedTime / duration, 1);
            // Ease out quartic
            const ease = 1 - Math.pow(1 - progress, 4);

            const animatedValue = startValue + (endValue - startValue) * ease;
            setDisplayValue(animatedValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                prevValueRef.current = endValue;
            }
        };

        requestAnimationFrame(animate);
        return () => { prevValueRef.current = value; };
    }, [value]);

    return <span>{displayValue.toFixed(toFixed)}</span>;
};

// "Holographic" Sentiment Orb
const SentimentOrb: React.FC<{ score: number }> = ({ score }) => {
    // Score is -1 to 1.
    // Map to color: -1 (Red) -> 0 (Blue/Grey) -> 1 (Green)

    let colorShadow = '';
    let coreColor = '';
    let label = '';

    if (score > 0.2) {
        colorShadow = 'shadow-[0_0_50px_rgba(16,185,129,0.6)]'; // Emerald glow
        coreColor = 'bg-gradient-to-br from-emerald-400 to-emerald-600';
        label = 'Bullish';
    } else if (score < -0.2) {
        colorShadow = 'shadow-[0_0_50px_rgba(244,63,94,0.6)]'; // Rose glow
        coreColor = 'bg-gradient-to-br from-rose-400 to-rose-600';
        label = 'Bearish';
    } else {
        colorShadow = 'shadow-[0_0_30px_rgba(148,163,184,0.4)]'; // Slate glow
        coreColor = 'bg-gradient-to-br from-slate-400 to-slate-600';
        label = 'Neutral';
    }

    return (
        <div className="flex flex-col items-center justify-center py-6">
            <div className="relative">
                {/* Outer Ring (Spinning) */}
                <div className="absolute inset-[-10px] rounded-full border border-dashed border-gray-300 dark:border-gray-700 animate-[spin_10s_linear_infinite]"></div>

                {/* The Orb */}
                <div className={`w-32 h-32 rounded-full ${coreColor} ${colorShadow} flex items-center justify-center relative overflow-hidden transition-all duration-1000`}>
                    {/* Inner sheen */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-sm rounded-t-full pointer-events-none"></div>
                    <div className="text-white text-3xl font-bold drop-shadow-md z-10">
                        <AnimatedNumber value={score} toFixed={2} />
                    </div>
                </div>

                {/* Pulsing Ring */}
                <div className={`absolute inset-0 rounded-full border-2 border-white/50 animate-ping opacity-20`}></div>
            </div>
            <div className="mt-4 text-center">
                <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">Social Sentiment</p>
                <p className={`text-lg font-bold mt-1 transition-colors duration-500 ${score > 0.2 ? 'text-emerald-500' : score < -0.2 ? 'text-rose-500' : 'text-slate-500'}`}>
                    {label}
                </p>
            </div>
        </div>
    );
};

// Modern Linear Flux Meter for Fear & Greed
const FearGreedFlux: React.FC<{ score: number }> = ({ score }) => {
    let label = 'Neutral';
    let colorClass = 'bg-yellow-500';

    if (score >= 75) { label = 'Extreme Greed'; colorClass = 'bg-green-500'; }
    else if (score >= 55) { label = 'Greed'; colorClass = 'bg-emerald-400'; }
    else if (score <= 25) { label = 'Extreme Fear'; colorClass = 'bg-red-600'; }
    else if (score <= 45) { label = 'Fear'; colorClass = 'bg-rose-400'; }

    return (
        <div className="flex flex-col justify-center h-full px-4 py-6">
            <div className="flex justify-between items-end mb-2">
                <span className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 font-semibold">Fear & Greed Index</span>
                <span className={`text-2xl font-bold ${colorClass.replace('bg-', 'text-')}`}>
                    <AnimatedNumber value={score} toFixed={0} />
                </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-4 flex gap-1">
                {[...Array(20)].map((_, i) => {
                    const threshold = (i + 1) * 5;
                    const isActive = score >= threshold;
                    // Gradient color logic for segments
                    let segColor = 'bg-gray-200 dark:bg-gray-800';
                    if (isActive) {
                        if (i < 5) segColor = 'bg-red-500';
                        else if (i < 10) segColor = 'bg-orange-400';
                        else if (i < 15) segColor = 'bg-yellow-400';
                        else segColor = 'bg-green-500';
                    }

                    return (
                        <div
                            key={i}
                            className={`flex-1 rounded-sm transition-colors duration-300 ${segColor} ${isActive ? 'shadow-[0_0_5px_currentColor]' : ''}`}
                        ></div>
                    )
                })}
            </div>
            <p className="text-right text-xs mt-2 text-gray-400 font-mono">{label}</p>
        </div>
    );
};

const SentimentEngine: React.FC = () => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const [activePair, setActivePair] = useState(pairs[0]);
    const [sentimentData, setSentimentData] = useState<SentimentData[]>(() => generateInitialSentimentData(50));
    const [sentimentSources, setSentimentSources] = useState<SentimentSource[]>(() => Array.from({ length: 5 }, generateNewSentimentSource));
    const [priceData, setPriceData] = useState(() => generatePriceDataForSentiment(sentimentData, 68000, 300));
    const [fearGreedIndex, setFearGreedIndex] = useState(55);
    const [activeFilter, setActiveFilter] = useState<'All' | SentimentLabel>('All');
    const [aiSummary, setAiSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [newSourceId, setNewSourceId] = useState<string | null>(null);

    const timersRef = useRef<number[]>([]);

    useEffect(() => {
        const dataInterval = setInterval(() => {
            setSentimentData(currentData => [...currentData.slice(1), generateNewSentimentPoint(currentData[currentData.length - 1])]);
        }, 3000);

        const sourceInterval = setInterval(() => {
            const newSource = generateNewSentimentSource();
            setNewSourceId(newSource.id);
            setSentimentSources(currentSources => [newSource, ...currentSources].slice(0, 15));
            const timerId = window.setTimeout(() => {
                setNewSourceId(null);
            }, 1000);
            timersRef.current.push(timerId);
        }, 5000);

        const fgInterval = setInterval(() => {
            setFearGreedIndex(prev => Math.round(Math.max(0, Math.min(100, prev + (Math.random() - 0.5) * 10))));
        }, 4000);

        return () => {
            clearInterval(dataInterval);
            clearInterval(sourceInterval);
            clearInterval(fgInterval);
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, []);

    useEffect(() => {
        const initialPrice = activePair === 'BTC/USDT' ? 68000 : activePair === 'ETH/USDT' ? 3500 : 170;
        const volatility = initialPrice * 0.005;
        setPriceData(generatePriceDataForSentiment(sentimentData, initialPrice, volatility));
    }, [sentimentData, activePair]);

    const handleGenerateSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        setAiSummary('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const headlines = sentimentSources.slice(0, 5).map(s => `"${s.content}" (${s.sentiment})`).join('; ');
            const prompt = `Based on these recent headlines for ${activePair.split('/')[0]}, provide a concise 2-sentence summary of the current market sentiment: ${headlines}.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAiSummary(response.text);
        } catch (error) {
            console.error("Error generating summary:", error);
            showToast('Failed to generate AI summary.', 'error');
            setAiSummary("System Error: Unable to connect to Neural Core.");
        } finally {
            setIsSummaryLoading(false);
        }
    }, [sentimentSources, activePair, showToast]);

    const currentScore = useMemo(() => sentimentData[sentimentData.length - 1]?.score ?? 0, [sentimentData]);
    const combinedData = useMemo(() => sentimentData.map((sd, i) => ({ ...sd, price: priceData[i]?.price })), [sentimentData, priceData]);
    const sourceCounts = useMemo(() => sentimentSources.reduce((acc, s) => ({ ...acc, [s.sentiment]: (acc[s.sentiment] || 0) + 1 }), {} as Record<SentimentLabel, number>), [sentimentSources]);
    const sourceBreakdownData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
    const filteredSources = useMemo(() => activeFilter === 'All' ? sentimentSources : sentimentSources.filter(s => s.sentiment === activeFilter), [activeFilter, sentimentSources]);

    const axisColor = theme === 'dark' ? '#94A3B8' : '#64748B';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
    const getSentimentColor = (sentiment: SentimentLabel) => PIE_COLORS[sentiment] || '#64748B';

    return (
        <div className="space-y-8 animate-fade-in-slide-up">

            {/* Header */}
            <Card className="!p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary animate-pulse">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sentiment Engine</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Real-time social & news analysis</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-100 dark:bg-brand-darkest/50 p-1 rounded-xl">
                    {pairs.map(p => (
                        <button
                            key={p}
                            onClick={() => setActivePair(p)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activePair === p
                                    ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </Card>

            {/* Intelligence Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Metrics */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="h-64 !p-0 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                        <SentimentOrb score={currentScore} />
                    </Card>
                    <Card className="h-40 !p-0 overflow-hidden">
                        <FearGreedFlux score={fearGreedIndex} />
                    </Card>
                </div>

                {/* Center Column: Main Chart */}
                <Card className="lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Sentiment vs Price Correlation</h3>
                            <p className="text-xs text-gray-500">Overlaying social sentiment score against asset price action.</p>
                        </div>
                        <div className="flex gap-4 text-xs font-mono">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-brand-primary"></div> Sentiment
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-400"></div> Price
                            </div>
                        </div>
                    </div>
                    <div className="flex-grow min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={combinedData}>
                                <defs>
                                    <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} opacity={0.4} />
                                <XAxis dataKey="time" stroke={axisColor} tickFormatter={time => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 10 }} minTickGap={50} axisLine={false} tickLine={false} dy={10} />
                                <YAxis yAxisId="left" orientation="left" stroke="#6366F1" domain={[-1.2, 1.2]} tick={{ fontSize: 10 }} hide />
                                <YAxis yAxisId="right" orientation="right" stroke="#10B981" domain={['auto', 'auto']} tickFormatter={val => `$${Math.round(val/1000)}k`} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px' } : { borderRadius: '8px' }}
                                    labelStyle={{ color: theme === 'dark' ? '#94A3B8' : '#64748B', marginBottom: '5px' }}
                                />
                                <Area yAxisId="left" type="monotone" dataKey="score" stroke="#6366F1" strokeWidth={2} fill="url(#sentimentGrad)" />
                                <Line yAxisId="right" type="monotone" dataKey="price" stroke="#10B981" strokeWidth={2} dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Breakdown */}
                <Card className="flex flex-col">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Signal Sources</h3>
                    <div className="flex items-center justify-between h-full">
                        <div className="h-48 w-48 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceBreakdownData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        stroke="none"
                                    >
                                        {sourceBreakdownData.map(entry => <Cell key={`cell-${entry.name}`} fill={getSentimentColor(entry.name as SentimentLabel)} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{sentimentSources.length}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">Signals</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 ml-8 space-y-3">
                            {sourceBreakdownData.map(entry => (
                                <div key={entry.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getSentimentColor(entry.name as SentimentLabel) }}></div>
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* AI Intelligence Unit */}
                <Card className="flex flex-col bg-slate-900 border-slate-800 relative overflow-hidden">
                    {/* Scanline effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                AI Intelligence Stream
                            </h3>
                            <Button size="sm" variant="outline" className="text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10" onClick={handleGenerateSummary} disabled={isSummaryLoading}>
                                {isSummaryLoading ? 'Analyzing...' : 'Synthesize Summary'}
                            </Button>
                        </div>

                        <div className="flex-grow bg-black/40 rounded-xl p-4 border border-white/5 font-mono text-sm text-blue-300 overflow-y-auto custom-scrollbar min-h-[150px]">
                            {isSummaryLoading ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-bounce">.</span>
                                    <span className="animate-bounce [animation-delay:0.1s]">.</span>
                                    <span className="animate-bounce [animation-delay:0.2s]">.</span>
                                    <span>Processing Neural Data</span>
                                </div>
                            ) : aiSummary ? (
                                <div className="animate-fade-in-up">
                                    <span className="text-blue-500 mr-2">{">"}</span>
                                    {aiSummary}
                                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                                </div>
                            ) : (
                                <div className="text-gray-500 italic">
                                    <span className="text-blue-500 mr-2">{">"}</span>
                                    System Ready. Awaiting command to analyze market sentiment.
                                    <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Live Feed */}
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Live Data Stream</h3>
                    <div className="flex gap-2">
                        {(['All', 'Positive', 'Negative', 'Neutral'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-1 text-xs font-bold uppercase rounded-full transition-colors border ${activeFilter === filter
                                        ? 'bg-brand-primary text-white border-brand-primary'
                                        : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-brand-primary'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    {filteredSources.map((source) => {
                        const isNew = source.id === newSourceId;
                        const borderColor = source.sentiment === 'Positive' ? 'border-l-emerald-500' : source.sentiment === 'Negative' ? 'border-l-rose-500' : 'border-l-gray-400';

                        return (
                            <div
                                key={source.id}
                                className={`relative bg-white dark:bg-brand-dark border border-gray-100 dark:border-brand-border-dark rounded-lg p-4 pl-5 border-l-4 shadow-sm hover:shadow-md transition-all duration-500 ${borderColor} ${isNew ? 'animate-fade-in-right bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{source.source}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-xs text-gray-500 font-mono">{source.timestamp}</span>
                                        </div>
                                        <p className="text-slate-800 dark:text-slate-200 font-medium">{source.content}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${source.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500' :
                                            source.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500' :
                                                'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {source.sentiment}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default SentimentEngine;

