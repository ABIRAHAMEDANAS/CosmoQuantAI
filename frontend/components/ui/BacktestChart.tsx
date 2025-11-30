import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries, SeriesMarker, Time, createSeriesMarkers } from 'lightweight-charts';

interface TradeMarker {
    time: number; // এখন আমরা নিশ্চিত যে ব্যাকএন্ড থেকে number আসছে
    type: 'buy' | 'sell';
    price: number;
}

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface BacktestChartProps {
    data: CandleData[];
    trades: TradeMarker[];
}

const BacktestChart: React.FC<BacktestChartProps> = ({ data = [], trades = [] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // ১. চার্ট তৈরি
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#1E293B' },
                textColor: '#D9D9D9',
            },
            grid: {
                vertLines: { color: '#334155' },
                horzLines: { color: '#334155' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 400,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            }
        });
        chartRef.current = chart;

        // ২. ক্যান্ডেলস্টিক সিরিজ যোগ
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#F43F5E',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#F43F5E',
        });

        // ৩. ডেটা সর্ট করে সেট করা
        // ডুপ্লিকেট সময় থাকলে রিমুভ করা জরুরি, লাইব্রেরি ক্রাশ করতে পারে
        const uniqueDataMap = new Map();
        data.forEach(item => uniqueDataMap.set(item.time, item));
        const sortedData = Array.from(uniqueDataMap.values()).sort((a, b) => a.time - b.time);

        candlestickSeries.setData(sortedData as any);

        // ৪. ট্রেড মার্কার "Snap" করা (সবচেয়ে গুরুত্বপূর্ণ অংশ)
        // প্রতিটি ট্রেডকে তার নিকটতম ক্যান্ডেলের সময়ের সাথে ম্যাচ করানো হবে
        const validMarkers: SeriesMarker<Time>[] = [];

        trades.forEach(trade => {
            const tradeTime = Number(trade.time);

            // ট্রেড টাইমের সাথে মিলে এমন বা তার খুব কাছের ক্যান্ডেল খোঁজা
            // (সহজ লজিক: আমরা এক্স্যাক্ট ম্যাচ বা পরবর্তী ক্লোজেস্ট ক্যান্ডেল খুঁজব)
            let matchedTime = null;

            // অপশন ১: সরাসরি ক্যান্ডেল লিস্টে খোঁজা
            const exactMatch = sortedData.find(c => c.time === tradeTime);

            if (exactMatch) {
                matchedTime = exactMatch.time;
            } else {
                // অপশন ২: যদি এক্স্যাক্ট ম্যাচ না পাওয়া যায়, তবে সবচেয়ে কাছের ক্যান্ডেল খুঁজে বের করা
                // এটি টাইমজোন বা সেকেন্ডের পার্থক্যের সমস্যা সমাধান করবে
                const closest = sortedData.reduce((prev, curr) => {
                    return (Math.abs(curr.time - tradeTime) < Math.abs(prev.time - tradeTime) ? curr : prev);
                });

                // যদি পার্থক্য খুব বেশি হয় (যেমন ১ দিনের বেশি), তবে ইগনোর করব (ভুল ডেটা হতে পারে)
                // এখানে আমরা ধরে নিচ্ছি ১ ঘন্টার ক্যান্ডেল (৩৬০০ সেকেন্ড)
                if (Math.abs(closest.time - tradeTime) <= 86400) {
                    matchedTime = closest.time;
                }
            }

            if (matchedTime) {
                validMarkers.push({
                    time: matchedTime as Time, // ক্যান্ডেলের আসল সময় ব্যবহার করছি
                    position: trade.type === 'buy' ? 'belowBar' : 'aboveBar',
                    color: trade.type === 'buy' ? '#10B981' : '#F43F5E',
                    shape: trade.type === 'buy' ? 'arrowUp' : 'arrowDown',
                    text: trade.type.toUpperCase() + ` @ ${trade.price.toFixed(2)}`,
                    size: 2 // সাইজ একটু বড় করে দিলাম যাতে চোখে পড়ে
                });
            }
        });

        // মার্কারগুলোকেও সময়ের ক্রমানুসারে সাজাতে হবে
        validMarkers.sort((a, b) => (a.time as number) - (b.time as number));

        // সেফটির জন্য ডুপ্লিকেট টাইমের মার্কার থাকলে শুধুমাত্র শেষেরটা রাখা (লাইব্রেরির সীমাবদ্ধতা)
        // অথবা একই ক্যান্ডেলে একাধিক ট্রেড থাকলে টেক্সট যোগ করা যেতে পারে, আপাতত সিম্পল রাখা হলো
        createSeriesMarkers(candlestickSeries, validMarkers);

        chart.timeScale().fitContent();

        // রেসপন্সিভ হ্যান্ডলার
        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, trades]);

    return (
        <div className="relative w-full h-[400px]">
            <div ref={chartContainerRef} className="w-full h-full rounded-xl overflow-hidden border border-brand-border-dark" />
            {/* যদি কোনো ট্রেড না থাকে বা ডেটা লোড না হয় */}
            {!data.length && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm pointer-events-none">
                    No Chart Data
                </div>
            )}
        </div>
    );
};

export default BacktestChart;