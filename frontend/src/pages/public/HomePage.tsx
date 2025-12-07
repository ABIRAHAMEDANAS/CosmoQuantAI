
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Button from '@/components/common/Button';
import {
    BacktesterIcon, BotLabIcon, AIFoundryIcon,
    InteractiveBrokersLogo, CoinbaseLogo, BitfinexLogo, TradierLogo, TradingTechnologiesLogo, TerminalLinkLogo, AlpacaLogo,
    TradeStationLogo, CharlesSchwabLogo, KrakenLogo, SscEzeLogo, SamcoLogo, ZerodhaLogo, TdAmeritradeLogo, BinanceLogo,
    IdeaIcon, TestIcon, DeployIcon,
    MOCK_CRYPTO_NEWS
} from '@/constants';
import Card from '@/components/common/Card';
import { useTheme } from '@/context/ThemeContext';
import MarketTicker from '@/components/features/market/MarketTicker';
import { useToast } from '@/context/ToastContext';

// Animation Hook
const useScrollAnimation = (threshold = 0.1) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            },
            { threshold }
        );
        if (ref.current) observer.observe(ref.current);
        return () => { if (ref.current) observer.unobserve(ref.current); };
    }, [threshold]);
    return ref;
};

// Spotlight Card Component - Updated for Glassmorphism/Transparency
const SpotlightCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-3xl border border-white/10 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl shadow-xl ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.1), transparent 40%)`,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
};

const InteractiveCanvasBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: any[] = [];
        const mouse = { x: -1000, y: -1000 }; // Start off screen

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        const isDark = theme === 'dark';
        const particleColor = isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.4)';
        const lineColor = isDark ? 'rgba(79, 70, 229, 0.15)' : 'rgba(129, 140, 248, 0.15)';

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.speedY = (Math.random() - 0.5) * 0.3;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx!.fillStyle = particleColor;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        const init = () => {
            particles = [];
            const count = Math.min(100, window.innerWidth/15);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx!.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                // Connect
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 120) {
                        ctx!.strokeStyle = lineColor;
                        ctx!.lineWidth = 0.5;
                        ctx!.beginPath();
                        ctx!.moveTo(particles[i].x, particles[i].y);
                        ctx!.lineTo(particles[j].x, particles[j].y);
                        ctx!.stroke();
                    }
                }
                // Mouse interaction
                const dx = particles[i].x - mouse.x;
                const dy = particles[i].y - mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 200) {
                    ctx!.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)';
                    ctx!.lineWidth = 1;
                    ctx!.beginPath();
                    ctx!.moveTo(particles[i].x, particles[i].y);
                    ctx!.lineTo(mouse.x, mouse.y);
                    ctx!.stroke();
                }
            }
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        resizeCanvas();
        init();
        animate();

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };

    }, [theme]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 w-full h-full pointer-events-none" />;
};

const LandingPageNewsTicker: React.FC = () => {
    const [selectedNews, setSelectedNews] = useState<any>(null);

    return (
        <>
            <div className="w-full bg-[#0B1120] border-t border-white/5 py-2 px-4 overflow-hidden flex items-center relative z-20">
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg flex-shrink-0 mr-4">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider whitespace-nowrap">Breaking News</span>
                </div>
                <div className="flex-1 overflow-hidden relative h-6">
                    <div className="animate-marquee-slow whitespace-nowrap absolute top-0 left-0 flex items-center h-full text-sm text-gray-300" style={{ animationDuration: '120s' }}>
                        {[...MOCK_CRYPTO_NEWS, ...MOCK_CRYPTO_NEWS, ...MOCK_CRYPTO_NEWS, ...MOCK_CRYPTO_NEWS].map((news, i) => (
                            <div
                                key={`${news.id}-${i}`}
                                className="mx-8 flex flex-shrink-0 items-center cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={() => setSelectedNews(news)}
                            >
                                <span className="font-bold text-gray-500 text-xs mr-2">[{news.source}]</span>
                                {news.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* News Popup Modal */}
            {selectedNews && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-fade-in" onClick={() => setSelectedNews(null)}>
                    <div
                        className="bg-white dark:bg-[#0F172A] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-modal-content-slide-down"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 relative">
                            <button
                                onClick={() => setSelectedNews(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-2.5 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
                                    {selectedNews.source}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                    {new Date().toLocaleTimeString()}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mb-4">
                                {selectedNews.text}
                            </h3>

                            <div className="p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                    <strong className="block mb-1 text-slate-900 dark:text-white text-xs uppercase tracking-wider">Summary</strong>
                                    This is a mock detail view for the selected news item. In a production environment, this area would display the full article summary, key takeaways, or related market impact analysis fetched from the live API.
                                    <br /><br />
                                    Sentiment Analysis: <span className={`font-bold capitalize ${selectedNews.sentiment === 'positive' ? 'text-green-500' : selectedNews.sentiment === 'negative' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedNews.sentiment}</span>
                                </p>
                            </div>

                            <Button className="w-full" size="sm" onClick={() => setSelectedNews(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const MarketIntelligenceSection: React.FC = () => {
    const ref = useScrollAnimation();
    const [activeSignal, setActiveSignal] = useState(0);

    const signals = [
        { pair: 'BTC/USDT', signal: 'BULLISH DIV', conf: 88, type: 'long' },
        { pair: 'SOL/USDT', signal: 'BREAKOUT', conf: 92, type: 'long' },
        { pair: 'PEPE/USDT', signal: 'VOL SPIKE', conf: 75, type: 'short' },
        { pair: 'ETH/BTC', signal: 'SUPPORT HIT', conf: 81, type: 'long' },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSignal(prev => (prev + 1) % signals.length);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div ref={ref} className="py-20 bg-white dark:bg-brand-darkest/50 fade-in-up border-b border-gray-100 dark:border-white/5">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Metric 1: Market Mood */}
                    <div className="bg-gray-50 dark:bg-brand-dark border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg className="w-16 h-16 text-brand-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                        </div>
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">Market Mood</h4>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-extrabold text-brand-success">68</span>
                            <span className="text-lg font-medium text-brand-success mb-1">Greed</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
                            <div className="h-full bg-brand-success w-[68%] relative">
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"></div>
                            </div>
                        </div>
                    </div>

                    {/* Metric 2: AI Signals */}
                    <div className="bg-gray-50 dark:bg-brand-dark border border-gray-200 dark:border-white/10 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">AI Signal Stream</h4>
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                        </div>
                        <div className="space-y-3">
                            {signals.map((sig, idx) => (
                                <div key={idx} className={`flex items-center justify-between p-2 rounded-lg transition-all duration-500 ${idx === activeSignal ? 'bg-white dark:bg-white/10 shadow-md scale-105 border-l-4 border-brand-primary' : 'opacity-50'}`}>
                                    <span className="font-mono font-bold text-sm text-slate-700 dark:text-white">{sig.pair}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sig.type === 'long' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{sig.signal}</span>
                                    <span className="text-xs font-mono text-gray-500">{sig.conf}%</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Metric 3: Hot Sectors */}
                    <div className="bg-gray-50 dark:bg-brand-dark border border-gray-200 dark:border-white/10 rounded-2xl p-6 flex flex-col">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Sector Flow (24h)</h4>
                        <div className="flex-1 flex items-end gap-2">
                            {[{ n: 'AI', v: 85 }, { n: 'DeFi', v: 45 }, { n: 'L1', v: 60 }, { n: 'Game', v: 30 }, { n: 'Meme', v: 95 }].map((sec, i) => (
                                <div key={sec.n} className="flex-1 flex flex-col items-center group">
                                    <div className="w-full bg-brand-primary/10 dark:bg-brand-primary/20 rounded-t-lg relative overflow-hidden transition-all duration-300 group-hover:bg-brand-primary/30" style={{ height: `${sec.v}%` }}>
                                        <div className="absolute bottom-0 left-0 w-full bg-brand-primary opacity-50 h-1 group-hover:h-full transition-all duration-500"></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500 mt-2">{sec.n}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

const StatsSection: React.FC = () => {
    const ref = useScrollAnimation();

    return (
        <div ref={ref} className="py-20 border-t border-gray-100 dark:border-white/5 fade-in-up">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { label: 'Strategies Backtested', value: '2.5M+' },
                        { label: 'Trading Volume Processed', value: '$12B+' },
                        { label: 'Live Bots Active', value: '15,000+' },
                        { label: 'System Uptime', value: '99.99%' }
                    ].map((stat, i) => (
                        <div key={i} className="p-4">
                            <h3 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-800 to-slate-500 dark:from-white dark:to-gray-500 mb-2">
                                {stat.value}
                            </h3>
                            <p className="text-sm font-bold text-brand-primary uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const BentoGrid: React.FC = () => {
    const ref = useScrollAnimation(0.1);

    return (
        <div ref={ref} className="py-32 relative fade-in-up">
            {/* Background - kept minimal to allow glass effect to shine */}
            <div className="absolute top-0 left-0 w-full h-full opacity-40 z-0 pointer-events-none"></div>
            <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[150px] -z-10"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] -z-10"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-brand-primary text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
                        Features
                    </div>
                    <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                        Everything you need to <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-500">Build Alpha.</span>
                    </h3>
                    <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
                        A unified ecosystem replacing fragmented tools. From idea to execution in minutes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lg:gap-8">

                    {/* Item 1: AI Foundry (Large, Wide) */}
                    <SpotlightCard className="md:col-span-4 group min-h-[320px] flex flex-col">
                        <div className="p-8 pb-0 flex-grow relative z-20">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary to-indigo-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-brand-primary/20 group-hover:scale-110 transition-transform duration-300">
                                <AIFoundryIcon />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">AI Foundry</h4>
                            <p className="text-gray-600 dark:text-gray-400 max-w-md text-base leading-relaxed">
                                Convert natural language into production-grade Python code. Describe your strategy, and our fine-tuned LLM builds the logic automatically.
                            </p>
                        </div>

                        {/* Visual representation of Code */}
                        <div className="relative h-40 mt-6 overflow-hidden border-t border-white/10 bg-black/5 dark:bg-black/20">
                            <div className="absolute top-4 left-6 right-6 bottom-0 bg-white/50 dark:bg-black/40 backdrop-blur-md rounded-t-xl shadow-2xl p-4 border border-white/20 dark:border-white/5 transform translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                                <div className="flex gap-2 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                </div>
                                <div className="font-mono text-xs text-slate-800 dark:text-blue-200 opacity-90 leading-5">
                                    <span className="text-purple-600 dark:text-purple-400">def</span> <span className="text-yellow-600 dark:text-yellow-300">on_tick</span>(self, data):<br />
                                    &nbsp;&nbsp;<span className="text-gray-500"># Generated Logic</span><br />
                                    &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400">if</span> data.rsi &lt; <span className="text-green-600 dark:text-green-300">30</span>:<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;self.buy(size=<span className="text-green-600 dark:text-green-300">0.1</span>)<br />
                                    &nbsp;&nbsp;<span className="text-purple-600 dark:text-purple-400">elif</span> data.rsi &gt; <span className="text-green-600 dark:text-green-300">70</span>:<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;self.close_position()
                                </div>
                            </div>
                        </div>
                    </SpotlightCard>

                    {/* Item 2: Bot Lab (Tall) */}
                    <SpotlightCard className="md:col-span-2 group min-h-[320px] flex flex-col">
                        <div className="p-8 relative z-20">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/20 group-hover:scale-110 transition-transform duration-300">
                                <BotLabIcon />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Bot Lab</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                                Deploy strategies to the cloud with 99.9% uptime. Monitor active PnL from a single glass dashboard.
                            </p>
                        </div>
                        <div className="flex-grow relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center">
                                {/* Animated Nodes */}
                                <div className="relative w-40 h-40">
                                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-green-500 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.6)] z-10 -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                                    {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                                        <div key={i} className="absolute top-1/2 left-1/2 w-24 h-[1px] bg-gradient-to-r from-green-500/50 to-transparent origin-left" style={{ transform: `rotate(${deg}deg)` }}>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-400/50 rounded-full border border-green-500/50"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </SpotlightCard>

                    {/* Item 3: Backtester (Tall) */}
                    <SpotlightCard className="md:col-span-2 group min-h-[320px] flex flex-col">
                        <div className="p-8 relative z-20">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                                <BacktesterIcon />
                            </div>
                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Backtesting</h4>
                            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                                Validate logic against TBs of historical data. Visualize equity curves and max drawdown instantly.
                            </p>
                        </div>
                        <div className="mt-auto h-32 w-full relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-blue-500/10 to-transparent"></div>
                            <svg className="absolute bottom-0 left-0 right-0 w-full h-24 text-blue-500" preserveAspectRatio="none" viewBox="0 0 100 40">
                                <path d="M0 40 Q 20 35, 40 20 T 100 5" fill="none" stroke="currentColor" strokeWidth="2" className="drop-shadow-md" />
                                <path d="M0 40 L0 40 Q 20 35, 40 20 T 100 5 V 40 H 0 Z" fill="currentColor" fillOpacity="0.2" />
                            </svg>
                        </div>
                    </SpotlightCard>

                    {/* Item 4: Visual Builder (Wide) */}
                    <SpotlightCard className="md:col-span-4 group min-h-[320px] flex flex-col">
                        <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        <div className="grid md:grid-cols-2 h-full">
                            <div className="p-8 flex flex-col justify-center z-20">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-purple-600/20 group-hover:scale-110 transition-transform duration-300">
                                    <IdeaIcon className="w-6 h-6" />
                                </div>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Visual Strategy Builder</h4>
                                <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-6">
                                    No code? No problem. Use our node-based editor to drag, drop, and connect indicators, triggers, and actions. Logic visualization made simple.
                                </p>
                                <div>
                                    <Button variant="outline" className="text-xs border-gray-300 dark:border-white/20 hover:bg-white/10">Try Builder Demo</Button>
                                </div>
                            </div>
                            <div className="relative min-h-[200px] bg-white/5 dark:bg-black/10 border-l border-white/10 overflow-hidden flex items-center justify-center">
                                {/* Abstract Node Graph UI */}
                                <div className="relative w-full max-w-xs opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105 transform">
                                    <div className="absolute top-0 left-8 w-24 h-12 rounded-lg bg-white/10 dark:bg-black/40 backdrop-blur border border-blue-500/50 shadow-lg flex items-center justify-center text-[10px] font-mono text-blue-400">
                                        Data Input
                                    </div>
                                    <svg className="absolute top-12 left-20 w-1 h-12" overflow="visible">
                                        <path d="M0 0 V 48" stroke="#64748B" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                    <div className="absolute top-24 left-0 w-28 h-14 rounded-lg bg-white/10 dark:bg-black/40 backdrop-blur border border-yellow-500/50 shadow-lg flex flex-col items-center justify-center p-2">
                                        <span className="text-[10px] font-mono text-yellow-500 dark:text-yellow-400">RSI Condition</span>
                                        <div className="w-full h-1 bg-gray-700 mt-1 rounded-full overflow-hidden"><div className="w-2/3 h-full bg-yellow-500"></div></div>
                                    </div>
                                    <svg className="absolute top-[130px] left-14 w-12 h-12" overflow="visible">
                                        <path d="M0 0 Q 0 24, 24 24" stroke="#64748B" strokeWidth="2" fill="none" />
                                    </svg>
                                    <div className="absolute top-36 left-28 w-24 h-12 rounded-lg bg-white/10 dark:bg-black/40 backdrop-blur border border-green-500/50 shadow-lg flex items-center justify-center text-[10px] font-mono text-green-400">
                                        Execute Buy
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SpotlightCard>

                </div>
            </div>
        </div>
    );
};

const AIStrategyGenerator: React.FC = () => {
    const { showToast } = useToast();
    const ref = useScrollAnimation(0.2);
    const [prompt, setPrompt] = useState('Buy BTC when RSI(14) crosses below 30 and sell when it crosses above 70.');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const highlightSyntax = (code: string) => {
        const pythonKeywords = ['def', 'return', 'import', 'from', 'class', 'if', 'else', 'elif', 'for', 'while', 'in', 'and', 'or', 'not', 'is', 'None', 'True', 'False'];
        return code
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/(#.*$)/gm, '<span class="token-comment">$1</span>')
            .replace(/('.*?'|".*?")/g, '<span class="token-string">$1</span>')
            .replace(new RegExp(`\\b(${pythonKeywords.join('|')})\\b`, 'g'), '<span class="token-keyword">$1</span>')
            .replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>')
            .replace(/([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="token-function">$1</span>');
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) { showToast('Please enter a description.', 'error'); return; }
        setIsLoading(true);
        setGeneratedCode('');

        const systemInstruction = "You are an expert trading algorithm developer. Take a natural language strategy description and output concise Python pseudocode using a 'backtrader' style class structure. Do not include markdown blocks, just the code.";

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { systemInstruction, maxOutputTokens: 300 }
            });
            setGeneratedCode(response.text);
        } catch (error) {
            console.error(error);
            setGeneratedCode("# Error generating code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div ref={ref} className="py-24 bg-white dark:bg-brand-darkest fade-in-up">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        {/* Mock Terminal Window */}
                        <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-[#1e1e1e]">
                            <div className="bg-[#252526] px-4 py-2 flex items-center gap-2 border-b border-[#333]">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <div className="ml-4 text-xs text-gray-400 font-mono">strategy_gen.py</div>
                            </div>
                            <div className="p-6 h-[400px] overflow-y-auto font-mono text-sm text-gray-300">
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-brand-primary animate-pulse">Synthesizing Alpha...</p>
                                    </div>
                                ) : generatedCode ? (
                                    <code dangerouslySetInnerHTML={{ __html: highlightSyntax(generatedCode) }} />
                                ) : (
                                    <div className="text-gray-500">
                                        <p># Waiting for input...</p>
                                        <p># Describe your strategy on the right to generate code.</p>
                                        <p className="mt-4"><span className="text-brand-primary">&gt;&gt;</span> Ready for prompt.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2">
                        <div className="inline-block px-4 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm font-bold mb-6">
                            Powered by Gemini 2.5
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">
                            Talk Trading. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-500">Get Code.</span>
                        </h2>
                        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            Skip the boilerplate. Describe any technical indicator, entry/exit logic, or risk parameter in plain English, and let our fine-tuned AI models build the foundation of your algorithm instantly.
                        </p>

                        <div className="bg-gray-100 dark:bg-brand-dark/50 p-2 rounded-2xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 ring-brand-primary transition-all shadow-sm">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder-gray-400 resize-none p-3"
                                placeholder="E.g., Buy Ethereum when MACD crosses signal line..."
                            />
                            <div className="flex justify-end px-2 pb-2">
                                <Button onClick={handleGenerate} disabled={isLoading} className="rounded-xl shadow-lg shadow-brand-primary/20">
                                    {isLoading ? 'Generating...' : 'Generate Strategy'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PartnersSection: React.FC = () => {
    const logos = [
        { name: "Binance", component: <BinanceLogo className="h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "Coinbase", component: <CoinbaseLogo className="h-6 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "Kraken", component: <KrakenLogo className="h-6 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "Alpaca", component: <AlpacaLogo className="h-6 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "Bitfinex", component: <BitfinexLogo className="h-6 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "Interactive", component: <InteractiveBrokersLogo className="h-6 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "Schwab", component: <CharlesSchwabLogo className="h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
        { name: "TD", component: <TdAmeritradeLogo className="h-6 w-auto grayscale hover:grayscale-0 transition-all duration-300" /> },
    ];

    return (
        <div className="py-16 bg-white dark:bg-brand-darkest border-y border-gray-100 dark:border-gray-800">
            <div className="text-center mb-8">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Integrated with leading platforms</p>
            </div>
            <div className="relative w-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-brand-darkest to-transparent z-10"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-brand-darkest to-transparent z-10"></div>

                <div className="flex animate-marquee-slow whitespace-nowrap">
                    {[...logos, ...logos, ...logos, ...logos].map((logo, index) => (
                        <div key={index} className="mx-12 flex flex-shrink-0 items-center justify-center opacity-60 hover:opacity-100 transition-opacity">
                            {logo.component}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CustomServicesSection: React.FC = () => {
    const ref = useScrollAnimation();
    return (
        <div ref={ref} className="py-24 relative overflow-hidden fade-in-up">
            <div className="absolute inset-0 bg-brand-primary/5 dark:bg-brand-primary/5 -skew-y-3 transform origin-top-left scale-110"></div>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6">
                        Need a Custom Solution?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">
                        Leverage my freelance expertise to design, build, and deploy a high-performance trading algorithm tailored specifically to your needs. From HFT bots to complex arbitrage systems.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="primary" className="px-8 py-4 text-lg rounded-full shadow-xl shadow-brand-primary/20">Book Consultation</Button>
                        <Button variant="outline" className="px-8 py-4 text-lg rounded-full">View Portfolio</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const HomePage: React.FC<{ onLogin: () => void; onSignUp: () => void; }> = ({ onLogin, onSignUp }) => {
    const { theme } = useTheme();
    const [activeSymbol, setActiveSymbol] = useState('BTCUSDT');

    useEffect(() => {
        const createWidget = () => {
            const container = document.getElementById('homepage_chart');
            if (!container || !window.TradingView) return;
            container.innerHTML = '';
            new window.TradingView.widget({
                symbol: `BINANCE:${activeSymbol}`,
                interval: '60',
                autosize: true,
                container_id: 'homepage_chart',
                theme: theme === 'dark' ? 'Dark' : 'Light',
                style: '1',
                locale: 'en',
                toolbar_bg: '#f1f3f6',
                enable_publishing: false,
                allow_symbol_change: true,
                // Updated config for full features on landing page
                hide_top_toolbar: false,
                hide_legend: false,
                hide_side_toolbar: false,
                withdateranges: true,
                hotlist: true,
                calendar: true,
                save_image: false,
                studies: [
                    "MASimple@tv-basicstudies",
                    "RSI@tv-basicstudies"
                ]
            });
        };
        // Delay slightly to ensure DOM is ready
        setTimeout(createWidget, 500);
    }, [theme, activeSymbol]);

    const handleTickerClick = (symbol: string) => {
        // Assuming standard USDT pairing for ticker items
        setActiveSymbol(`${symbol.toUpperCase()}USDT`);
    };

    return (
        <div className="overflow-hidden">
            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-brand-light dark:bg-brand-darkest">
                <InteractiveCanvasBackground />

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center pt-20 pb-32">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wide mb-8 animate-fade-in-down">
                        <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
                        Now in Public Beta
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-slate-900 dark:text-white mb-6 animate-fade-in-down" style={{ animationDelay: '0.1s' }}>
                        Stop Guessing. <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-purple-500 to-pink-500">Start Quantifying.</span>
                    </h1>

                    <p className="max-w-2xl text-xl text-gray-600 dark:text-gray-300 mb-10 leading-relaxed animate-fade-in-down" style={{ animationDelay: '0.2s' }}>
                        The all-in-one platform for algorithmic trading. Build, backtest, and deploy strategies without managing infrastructure.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-down" style={{ animationDelay: '0.3s' }}>
                        <Button variant="primary" onClick={onSignUp} className="px-8 py-4 text-lg rounded-full shadow-xl shadow-brand-primary/30 hover:scale-105 transition-transform">
                            Get Started for Free
                        </Button>
                        <Button variant="secondary" onClick={() => { }} className="px-8 py-4 text-lg rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
                            See How It Works
                        </Button>
                    </div>

                    {/* Floating Chart Preview */}
                    <div className="mt-32 w-full max-w-6xl h-[500px] md:h-[600px] bg-white dark:bg-brand-dark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-1 relative animate-fade-in-slide-up overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-purple-500 to-pink-500 z-20"></div>
                        <div id="homepage_chart" className="w-full h-full rounded-xl overflow-hidden"></div>

                        {/* Note: Overlays removed to allow full interaction with the TradingView widget */}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full z-20 flex flex-col">
                    <div className="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-brand-darkest/80 backdrop-blur-md">
                        <MarketTicker variant="overlay" onCoinClick={handleTickerClick} />
                    </div>
                    <LandingPageNewsTicker />
                </div>
            </div>

            <PartnersSection />
            <MarketIntelligenceSection />
            <BentoGrid />
            <AIStrategyGenerator />
            <StatsSection />
            <CustomServicesSection />
        </div>
    );
};

export default HomePage;

