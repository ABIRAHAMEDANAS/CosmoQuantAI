
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';
import apiClient from '../../services/client';
import { useTheme } from '../../contexts/ThemeContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { generateTrade, SUPPORTED_EXCHANGES, ExpandIcon, CollapseIcon, MOCK_CRYPTO_NEWS } from '../../constants';
import type { Trade, Exchange, Timeframe } from '../../types';

const timeframes: Timeframe[] = [
    '1s', '5s', '10s', '15s', '30s', '45s',
    '1m', '3m', '5m', '15m', '30m', '45m',
    '1h', '2h', '3h', '4h', '6h', '8h', '12h',
    '1d', '3d', '1w', '1M'
];

interface OrderBookEntry {
    price: number;
    amount: number;
    total: number;
}
type TradeWithStatus = Trade & { isNew?: boolean };

const NewsTickerBar: React.FC = () => {
    const [selectedNews, setSelectedNews] = useState<any>(null);

    return (
        <>
            <div className="flex items-center gap-4 overflow-hidden bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark rounded-xl p-2 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg flex-shrink-0">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider whitespace-nowrap">Breaking News</span>
                </div>

                <div className="flex-1 overflow-hidden relative h-6">
                    <div className="animate-marquee-slow whitespace-nowrap absolute top-0 left-0 flex items-center h-full" style={{ animationDuration: '80s' }}>
                        {[...MOCK_CRYPTO_NEWS, ...MOCK_CRYPTO_NEWS].map((news, i) => (
                            <div
                                key={`${news.id}-${i}`}
                                className="flex items-center mx-8 cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={() => setSelectedNews(news)}
                            >
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-2">[{news.source}]</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{news.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* News Modal */}
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
                                    This is a mock detail view. In a live environment, the full story content would be fetched here.
                                    <br /><br />
                                    Sentiment Analysis: <span className={`font-bold capitalize ${selectedNews.sentiment === 'positive' ? 'text-green-500' : selectedNews.sentiment === 'negative' ? 'text-red-500' : 'text-yellow-500'}`}>{selectedNews.sentiment}</span>
                                </p>
                            </div>

                            <Button className="w-full" onClick={() => setSelectedNews(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

const OrderBook: React.FC<{ bids: OrderBookEntry[], asks: OrderBookEntry[], spread: number, spreadPercent: number }> = ({ bids, asks, spread, spreadPercent }) => {
    const maxTotal = Math.max(
        bids[0]?.total || 0,
        asks[0]?.total || 0,
        1 // prevent division by zero
    );

    const OrderRow: React.FC<OrderBookEntry & { type: 'bid' | 'ask' }> = ({ price, amount, total, type }) => {
        const depth = (total / maxTotal) * 100;
        // Modern gradient depth bars
        const bgStyle = type === 'bid'
            ? { background: `linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.15) ${100 - depth}%, rgba(16, 185, 129, 0.3) 100%)` }
            : { background: `linear-gradient(90deg, transparent 0%, rgba(244, 63, 94, 0.15) ${100 - depth}%, rgba(244, 63, 94, 0.3) 100%)` };

        const textColor = type === 'bid' ? 'text-emerald-400' : 'text-rose-400';

        return (
            <div className="relative grid grid-cols-3 text-xs font-mono py-1 px-2 hover:bg-white/5 cursor-pointer group transition-colors">
                {/* Depth Bar */}
                <div className="absolute top-0 bottom-0 right-0 transition-all duration-300" style={{ ...bgStyle, width: '100%' }}></div>

                <span className={`relative z-10 ${textColor} font-semibold group-hover:brightness-110`}>{price.toFixed(2)}</span>
                <span className="relative z-10 text-right text-gray-500 dark:text-gray-400 group-hover:text-gray-300">{amount.toFixed(4)}</span>
                <span className="relative z-10 text-right text-gray-400 dark:text-gray-500 group-hover:text-gray-300">{total.toFixed(2)}</span>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-brand-darkest/30 rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider text-gray-400 p-2 border-b border-gray-200 dark:border-white/5 font-semibold">
                <span>Price (USDT)</span>
                <span className="text-right">Amt (BTC)</span>
                <span className="text-right">Total</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="flex flex-col-reverse">
                    {asks.map((ask, index) => <OrderRow key={index} {...ask} type="ask" />)}
                </div>
                <div className="py-1.5 my-0.5 text-center border-y border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-white/5 backdrop-blur-sm sticky top-0 bottom-0 z-20">
                    <span className={`text-xs font-bold font-mono ${spread > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        Spread: {spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)
                    </span>
                </div>
                <div>
                    {bids.map((bid, index) => <OrderRow key={index} {...bid} type="bid" />)}
                </div>
            </div>
        </div>
    );
};

const RecentTrades: React.FC<{ trades: TradeWithStatus[] }> = ({ trades }) => (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-brand-darkest/30 rounded-lg overflow-hidden">
        <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider text-gray-400 p-2 border-b border-gray-200 dark:border-white/5 font-semibold">
            <span>Time</span>
            <span className="text-right">Price</span>
            <span className="text-right">Amount</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {trades.map(trade => (
                <div key={trade.id} className={`grid grid-cols-3 text-xs font-mono py-1 px-2 hover:bg-white/5 transition-colors ${trade.isNew ? 'animate-row-flash bg-white/10' : ''}`}>
                    <span className="text-gray-500">{trade.time}</span>
                    <span className={`text-right font-medium ${trade.type === 'buy' ? 'text-emerald-400' : 'text-rose-400'}`}>{trade.price.toFixed(2)}</span>
                    <span className={`text-right ${trade.amount > 0.1 ? 'text-white font-bold' : 'text-gray-400'}`}>{trade.amount.toFixed(4)}</span>
                </div>
            ))}
        </div>
    </div>
);

const ConnectExchangeModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    exchanges: Exchange[];
    onToggleConnect: (id: string) => void;
    onSetActive: (id: string) => void;
    activeExchangeId: string;
}> = ({ isOpen, onClose, exchanges, onToggleConnect, onSetActive, activeExchangeId }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-modal-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-darkest w-full max-w-2xl rounded-2xl shadow-2xl border border-brand-border-light dark:border-brand-border-dark flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-6 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-white/5">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Manage Exchanges</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">&times;</button>
                </header>
                <div className="p-6 space-y-3">
                    {exchanges.map(exchange => (
                        <div key={exchange.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${exchange.id === activeExchangeId ? 'bg-brand-primary/10 border-brand-primary/50' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-brand-primary/30'}`}>
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white dark:bg-brand-dark rounded-lg shadow-sm">
                                    {exchange.logo}
                                </div>
                                <div>
                                    <span className="block font-bold text-slate-900 dark:text-white">{exchange.name}</span>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        {exchange.isConnected ? <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> : <span className="w-2 h-2 rounded-full bg-gray-500"></span>}
                                        {exchange.isConnected ? 'Connected' : 'Disconnected'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {exchange.isConnected ? (
                                    <>
                                        <Button
                                            variant="secondary"
                                            className={`text-xs px-3 py-1.5 ${activeExchangeId === exchange.id ? 'bg-brand-primary text-white hover:bg-brand-primary-hover' : ''}`}
                                            onClick={() => onSetActive(exchange.id)}
                                            disabled={activeExchangeId === exchange.id}
                                        >
                                            {activeExchangeId === exchange.id ? 'Active' : 'Set Active'}
                                        </Button>
                                        <button className="text-xs text-rose-500 hover:text-rose-400 hover:underline px-2" onClick={() => onToggleConnect(exchange.id)}>
                                            Disconnect
                                        </button>
                                    </>
                                ) : (
                                    <Button variant="primary" className="text-xs px-4 py-2" onClick={() => onToggleConnect(exchange.id)}>
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

const Market: React.FC = () => {
    const { theme } = useTheme();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<IChartApi | null>(null);
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

    const [activePair, setActivePair] = useState('BTC/USDT');
    const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1h');
    const [lastPrice, setLastPrice] = useState(68543.21);
    const [priceUpdateStatus, setPriceUpdateStatus] = useState<'up' | 'down' | 'none'>('none');
    const [price24hAgo, setPrice24hAgo] = useState(68123.45);
    const [volume24h, setVolume24h] = useState(45231.87);
    const [high24h, setHigh24h] = useState(69123.45);
    const [low24h, setLow24h] = useState(67543.21);
    const [orderBookData, setOrderBookData] = useState<{ bids: OrderBookEntry[], asks: OrderBookEntry[] }>({ bids: [], asks: [] });
    const [recentTrades, setRecentTrades] = useState<TradeWithStatus[]>([]);
    const [activeSidePanelTab, setActiveSidePanelTab] = useState<'trade' | 'orderBook' | 'trades'>('trade');
    const [activeOrderFormTab, setActiveOrderFormTab] = useState<'buy' | 'sell'>('buy');
    const [activeOrderType, setActiveOrderType] = useState<'Market' | 'Limit' | 'Stop-Limit'>('Market');
    const [orderAmount, setOrderAmount] = useState('');
    const [orderPrice, setOrderPrice] = useState('');
    const [orderAmountSlider, setOrderAmountSlider] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [exchanges, setExchanges] = useState<Exchange[]>(SUPPORTED_EXCHANGES);
    const [activeExchangeId, setActiveExchangeId] = useState('binance');

    const [isChartFullScreen, setIsChartFullScreen] = useState(false);
    const [widgetKey, setWidgetKey] = useState(Date.now());
    const [isResizing, setIsResizing] = useState(false);
    const [leftPaneWidth, setLeftPaneWidth] = useState(75);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeExchange = exchanges.find(ex => ex.id === activeExchangeId);

    // ... (Resizing logic remains the same)
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing && containerRef.current) {
            const bounds = containerRef.current.getBoundingClientRect();
            const newWidth = ((e.clientX - bounds.left) / bounds.width) * 100;
            if (newWidth > 40 && newWidth < 90) {
                setLeftPaneWidth(newWidth);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    const toggleFullScreen = () => {
        setIsChartFullScreen(prev => !prev);
        setWidgetKey(Date.now());
    };

    useEffect(() => {
        if (isChartFullScreen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => document.body.classList.remove('body-no-scroll');
    }, [isChartFullScreen]);

    const handleToggleConnect = (id: string) => {
        setExchanges(prev => prev.map(ex => {
            if (ex.id === id) {
                const nowConnected = !ex.isConnected;
                if (nowConnected && !activeExchangeId) {
                    setActiveExchangeId(id);
                } else if (!nowConnected && activeExchangeId === id) {
                    const nextAvailable = prev.find(p => p.isConnected && p.id !== id);
                    setActiveExchangeId(nextAvailable?.id || '');
                }
                return { ...ex, isConnected: nowConnected };
            }
            return ex;
        }));
    };

    const handleSetActive = (id: string) => {
        setActiveExchangeId(id);
        setIsModalOpen(false);
    };

    // ... (OrderBook and Trade generation logic same as before)
    const generateOrderBookData = (centerPrice: number): { bids: OrderBookEntry[], asks: OrderBookEntry[] } => {
        const bids: OrderBookEntry[] = [];
        const asks: OrderBookEntry[] = [];
        let currentPrice = centerPrice - 0.5;
        let totalAmount = 0;
        for (let i = 0; i < 30; i++) { // Reduced count for better visuals
            const amount = Math.random() * 0.5;
            totalAmount += amount;
            bids.push({ price: currentPrice, amount, total: totalAmount });
            currentPrice -= (Math.random() * 2.5);
        }
        currentPrice = centerPrice + 0.5;
        totalAmount = 0;
        for (let i = 0; i < 30; i++) {
            const amount = Math.random() * 0.5;
            totalAmount += amount;
            asks.push({ price: currentPrice, amount, total: totalAmount });
            currentPrice += (Math.random() * 2.5);
        }
        return { bids, asks: asks.sort((a, b) => b.price - a.price) };
    };

    // WebSocket এর জন্য রেফ
    const ws = useRef<WebSocket | null>(null);

    // ✅ নতুন: WebSocket কানেকশন লজিক
    useEffect(() => {
        let socket: WebSocket | null = null;
        let timeoutId: NodeJS.Timeout;

        const connect = () => {
            // ১. WebSocket কানেকশন তৈরি (আপনার ব্যাকএন্ড URL অনুযায়ী)
            // লোকালহোস্টে Docker এ ব্যাকএন্ড 8000 পোর্টে চলছে
            socket = new WebSocket(`ws://localhost:8000/ws/market-data/${activePair.replace('/', '')}`);
            ws.current = socket;

            socket.onopen = () => {
                console.log(`Connected to live feed for ${activePair}`);
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                // ২. রিয়েল-টাইম প্রাইস আপডেট
                setLastPrice(prev => {
                    const newPrice = data.price;
                    // প্রাইস বাড়লে বা কমলে কালার ইন্ডিকেটরের জন্য স্ট্যাটাস সেট করা
                    const change = newPrice - prev;
                    setPriceUpdateStatus(change > 0 ? 'up' : change < 0 ? 'down' : 'none');
                    setTimeout(() => setPriceUpdateStatus('none'), 500);

                    return newPrice;
                });

                // ৩. ট্রেড ফিড আপডেট (অপশনাল: রিয়েল ট্রেড ডাটা না থাকলে প্রাইস দিয়ে জেনারেট করা যেতে পারে)
                // লাইভ এফেক্টের জন্য আমরা নতুন প্রাইস দিয়ে একটি ট্রেড অবজেক্ট বানাচ্ছি
                const newTrade = { ...generateTrade(data.price), isNew: true };
                setRecentTrades(prevTrades => {
                    const updatedTrades = [newTrade, ...prevTrades.map(t => ({ ...t, isNew: false }))].slice(0, 50);
                    return updatedTrades;
                });

                // ৪. চার্ট আপডেট (Lightweight Charts)
                if (candlestickSeriesRef.current) {
                    const time = new Date(data.timestamp).getTime() / 1000 as any; // Convert to unix timestamp
                    candlestickSeriesRef.current.update({
                        time: time,
                        open: data.price, // For real-time, we might just update close, but for simplicity using price
                        high: data.price,
                        low: data.price,
                        close: data.price,
                    });
                }
            };

            socket.onerror = (error) => {
                console.error("WebSocket Error:", error);
            };

            socket.onclose = () => {
                console.log("Disconnected from live feed");
            };
        };

        // React Strict Mode এ ডাবল মাউন্ট এড়াতে সামান্য ডিলে
        timeoutId = setTimeout(connect, 100);

        // ক্লিনআপ: কম্পোনেন্ট আনমাউন্ট বা পেয়ার চেঞ্জ হলে কানেকশন বন্ধ করা
        return () => {
            clearTimeout(timeoutId);
            if (socket) {
                socket.close();
            }
        };
    }, [activePair]); // activePair বদলালে নতুন কানেকশন হবে

    useEffect(() => {
        setOrderBookData(generateOrderBookData(lastPrice));
    }, [Math.round(lastPrice / 10)]);

    // Chart Initialization
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartInstanceRef.current && chartContainerRef.current) {
                chartInstanceRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: theme === 'dark' ? '#0F172A' : '#FFFFFF' },
                textColor: theme === 'dark' ? '#94A3B8' : '#334155',
            },
            grid: {
                vertLines: { color: theme === 'dark' ? '#1E293B' : '#E2E8F0' },
                horzLines: { color: theme === 'dark' ? '#1E293B' : '#E2E8F0' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });

        chartInstanceRef.current = chart;

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#F43F5E',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#F43F5E',
        });

        candlestickSeriesRef.current = candlestickSeries;

        // Fetch Historical Data
        const fetchHistory = async () => {
            try {
                const response = await apiClient.get('/market-data', {
                    params: { symbol: activePair, timeframe: activeTimeframe }
                });

                const formattedData = response.data.map((d: any) => ({
                    time: new Date(d.time).getTime() / 1000,
                    open: d.open,
                    high: d.high,
                    low: d.low,
                    close: d.close,
                }));

                // Sort by time just in case
                formattedData.sort((a: any, b: any) => a.time - b.time);

                candlestickSeries.setData(formattedData);
            } catch (error) {
                console.error("Failed to fetch historical data", error);
            }
        };

        fetchHistory();

        window.addEventListener('resize', handleResize);

        // ResizeObserver for container resize (e.g. split pane)
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
            chart.remove();
        };
    }, [theme, activePair, activeTimeframe]);

    // Update chart options when theme changes
    useEffect(() => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.applyOptions({
                layout: {
                    background: { type: ColorType.Solid, color: theme === 'dark' ? '#0F172A' : '#FFFFFF' },
                    textColor: theme === 'dark' ? '#94A3B8' : '#334155',
                },
                grid: {
                    vertLines: { color: theme === 'dark' ? '#1E293B' : '#E2E8F0' },
                    horzLines: { color: theme === 'dark' ? '#1E293B' : '#E2E8F0' },
                },
            });
        }
    }, [theme]);

    const change24h = lastPrice - price24hAgo;
    const changePercent24h = (change24h / price24hAgo) * 100;
    const isPositive = change24h >= 0;
    const { bids, asks } = orderBookData;
    const spread = (asks[asks.length - 1]?.price || 0) - (bids[0]?.price || 0);
    const spreadPercent = bids[0]?.price ? (spread / bids[0].price) * 100 : 0;

    // --- UI Helpers ---
    const inputClasses = "w-full bg-white dark:bg-brand-darkest border border-brand-border-light dark:border-white/10 rounded-md px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition font-mono";
    const activeColorClass = activeOrderFormTab === 'buy' ? 'text-emerald-500 border-emerald-500' : 'text-rose-500 border-rose-500';
    const activeBgClass = activeOrderFormTab === 'buy' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600';
    const activeGradientClass = activeOrderFormTab === 'buy' ? 'from-emerald-500/20 to-emerald-500/5' : 'from-rose-500/20 to-rose-500/5';

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            {isModalOpen && (
                <ConnectExchangeModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    exchanges={exchanges}
                    onToggleConnect={handleToggleConnect}
                    onSetActive={handleSetActive}
                    activeExchangeId={activeExchangeId}
                />
            )}

            {/* News Ticker */}
            <NewsTickerBar />

            {/* Market HUD */}
            <div className="flex-shrink-0 staggered-fade-in bg-white dark:bg-brand-dark rounded-2xl border border-brand-border-light dark:border-brand-border-dark p-4 shadow-lg relative overflow-hidden">
                {/* Ambient Glow based on price movement */}
                <div className={`absolute top-0 right-0 w-96 h-full bg-gradient-to-l ${isPositive ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent pointer-events-none`}></div>

                <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
                    {/* Left: Symbol & Selector */}
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
                            <div className={`w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center transition-all ${activeExchange?.isConnected ? 'border-2 border-emerald-500/50' : ''}`}>
                                {activeExchange?.logo}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-brand-dark"></div>
                            <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/5 transition-colors"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                {activePair}
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">PERP</span>
                            </h2>
                            <p className="text-xs text-gray-400 font-mono">Oracle Price</p>
                        </div>
                    </div>

                    {/* Center: Price Ticker */}
                    <div className="flex-1 text-center md:text-left flex items-center justify-center md:justify-start gap-8">
                        <div>
                            <p className={`text-3xl font-mono font-bold transition-colors duration-300 ${priceUpdateStatus === 'up' ? 'text-emerald-400' : priceUpdateStatus === 'down' ? 'text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                                ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm font-medium flex items-center gap-1 justify-center md:justify-start ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isPositive ? '▲' : '▼'} ${Math.abs(change24h).toFixed(2)} ({Math.abs(changePercent24h).toFixed(2)}%)
                            </p>
                        </div>
                        <div className="hidden lg:flex gap-8 text-sm">
                            <div>
                                <p className="text-gray-400 text-xs uppercase">24h High</p>
                                <p className="font-mono text-slate-900 dark:text-white">${high24h.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase">24h Low</p>
                                <p className="font-mono text-slate-900 dark:text-white">${low24h.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-xs uppercase">24h Vol (BTC)</p>
                                <p className="font-mono text-slate-900 dark:text-white">{volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" className="!p-2.5" onClick={() => {/* Add alert logic */ }}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </Button>
                        <Button variant="primary" className="shadow-lg shadow-brand-primary/20" onClick={() => setActiveSidePanelTab('trade')}>Trade Now</Button>
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div ref={containerRef} className="flex-1 flex gap-3 min-h-0 relative staggered-fade-in" style={{ animationDelay: '100ms' }}>
                {isResizing && <div className="absolute inset-0 z-50 cursor-col-resize" />}

                {/* Chart Area */}
                <div className="h-full flex flex-col transition-all duration-75" style={{ width: `${leftPaneWidth}%` }}>
                    <Card className="h-full p-0 overflow-hidden border-0 shadow-xl bg-white dark:bg-brand-dark relative group flex flex-col">
                        {/* Timeframe Toolbar */}
                        <div className="flex items-center gap-1 p-2 border-b border-gray-200 dark:border-white/5 overflow-x-auto no-scrollbar">
                            {['1m', '5m', '15m', '1h', '4h', '1d', '1w'].map((tf) => (
                                <button
                                    key={tf}
                                    onClick={() => setActiveTimeframe(tf as Timeframe)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeTimeframe === tf
                                        ? 'bg-brand-primary/10 text-brand-primary'
                                        : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                        <div ref={chartContainerRef} className="flex-1 w-full min-h-0" />
                        <button onClick={toggleFullScreen} className="absolute top-3 right-3 z-20 p-2 bg-white/10 dark:bg-black/30 backdrop-blur-sm rounded-lg text-slate-800 dark:text-white opacity-0 group-hover:opacity-100 hover:bg-white/20 dark:hover:bg-black/50 transition-all">
                            {isChartFullScreen ? <CollapseIcon /> : <ExpandIcon />}
                        </button>
                    </Card>
                </div>

                {/* Dragger */}
                <div
                    className="w-1.5 cursor-col-resize flex items-center justify-center group flex-shrink-0 hover:scale-x-150 transition-transform"
                    onMouseDown={handleMouseDown}
                >
                    <div className={`h-16 w-1 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-brand-primary transition-colors ${isResizing ? 'bg-brand-primary' : ''}`}></div>
                </div>

                {/* Right Panel (Order Book & Trade) */}
                <div className="h-full flex flex-col gap-3" style={{ width: `calc(${100 - leftPaneWidth}% - 12px)` }}>

                    {/* Tab Switcher */}
                    <div className="flex p-1 bg-gray-200 dark:bg-brand-dark rounded-xl">
                        {(['trade', 'orderBook', 'trades'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveSidePanelTab(tab)}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all duration-200 ${activeSidePanelTab === tab
                                    ? 'bg-white dark:bg-brand-darkest text-brand-primary shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                                    }`}
                            >
                                {tab === 'orderBook' ? 'Book' : tab}
                            </button>
                        ))}
                    </div>

                    {/* Panel Content */}
                    <Card className="flex-1 flex flex-col p-0 overflow-hidden border-0 shadow-lg relative">
                        {/* Background Ambient */}
                        {activeSidePanelTab === 'trade' && (
                            <div className={`absolute inset-0 bg-gradient-to-b ${activeGradientClass} pointer-events-none opacity-20`}></div>
                        )}

                        <div className="flex-1 min-h-0 p-4 overflow-y-auto">
                            {activeSidePanelTab === 'trade' && (
                                <div className="h-full flex flex-col">
                                    {/* Buy/Sell Toggle */}
                                    <div className="flex mb-6 bg-gray-100 dark:bg-brand-darkest/50 p-1 rounded-xl">
                                        <button onClick={() => setActiveOrderFormTab('buy')} className={`flex-1 py-3 text-center font-bold rounded-lg transition-all duration-200 ${activeOrderFormTab === 'buy' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-gray-500 hover:bg-white/5'}`}>Buy / Long</button>
                                        <button onClick={() => setActiveOrderFormTab('sell')} className={`flex-1 py-3 text-center font-bold rounded-lg transition-all duration-200 ${activeOrderFormTab === 'sell' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25' : 'text-gray-500 hover:bg-white/5'}`}>Sell / Short</button>
                                    </div>

                                    {/* Order Type */}
                                    <div className="flex gap-4 mb-6 overflow-x-auto pb-2 no-scrollbar">
                                        {(['Market', 'Limit', 'Stop-Limit'] as const).map(type => (
                                            <button
                                                key={type}
                                                onClick={() => setActiveOrderType(type)}
                                                className={`whitespace-nowrap text-xs font-bold uppercase border-b-2 pb-1 transition-colors ${activeOrderType === type ? activeColorClass : 'border-transparent text-gray-400 hover:text-gray-300'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Inputs */}
                                    <div className="space-y-5">
                                        <div className={`transition-all duration-300 ${activeOrderType !== 'Market' ? 'opacity-100 h-auto' : 'opacity-50 h-auto grayscale'}`}>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Price (USDT)</label>
                                            <div className="relative">
                                                <input type="number" value={activeOrderType === 'Market' ? '' : orderPrice} onChange={(e) => setOrderPrice(e.target.value)} placeholder={activeOrderType === 'Market' ? 'Market Price' : lastPrice.toFixed(2)} disabled={activeOrderType === 'Market'} className={inputClasses} />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-mono">USDT</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Amount ({activePair.split('/')[0]})</label>
                                            <div className="relative">
                                                <input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} className={inputClasses} placeholder="0.00" />
                                                <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-mono">{activePair.split('/')[0]}</span>
                                            </div>
                                        </div>

                                        {/* Slider */}
                                        <div className="pt-2">
                                            <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-2">
                                                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="25"
                                                value={orderAmountSlider}
                                                onChange={e => setOrderAmountSlider(Number(e.target.value))}
                                                className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb accent-brand-primary"
                                                style={{
                                                    background: `linear-gradient(to right, ${activeOrderFormTab === 'buy' ? '#10B981' : '#F43F5E'} ${orderAmountSlider}%, #334155 ${orderAmountSlider}%)`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-6">
                                        <div className="flex justify-between text-xs text-gray-500 mb-4">
                                            <span>Est. Fee</span>
                                            <span className="font-mono">0.00 USDT</span>
                                        </div>
                                        <Button className={`w-full py-4 text-lg font-bold shadow-xl transition-transform active:scale-95 ${activeBgClass}`}>
                                            {activeOrderFormTab === 'buy' ? 'Buy / Long' : 'Sell / Short'} {activePair.split('/')[0]}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeSidePanelTab === 'orderBook' && (
                                <OrderBook bids={bids} asks={asks} spread={spread} spreadPercent={spreadPercent} />
                            )}

                            {activeSidePanelTab === 'trades' && (
                                <RecentTrades trades={recentTrades} />
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {isChartFullScreen && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-brand-darkest p-0 animate-modal-fade-in">
                    {/* Fullscreen chart not implemented for lightweight-charts yet, reusing same ref logic would require moving the ref, which is complex. For now, we just show the chart in the main view. */}
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Fullscreen mode temporarily disabled for local charts.
                    </div>
                    <button onClick={toggleFullScreen} className="absolute top-4 right-4 z-20 p-2 bg-brand-darkest/50 backdrop-blur-md rounded-lg text-white hover:bg-brand-darkest transition-colors">
                        <CollapseIcon />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Market;
