import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, SeriesMarker, Time, createSeriesMarkers } from 'lightweight-charts';

// ✅ Interface আপডেট করা হয়েছে যাতে Array এবং Object দুটোই সাপোর্ট করে
interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface TradeMarker {
    time: number;
    type: 'buy' | 'sell';
    price: number;
}

interface BacktestChartProps {
    data: any[]; // 'any[]' দেওয়া হলো কারণ এটি এখন Object বা Array দুটোই হতে পারে
    trades: TradeMarker[];
}

// ✅ Binary Search Helper Function
const findClosestCandle = (sortedData: CandleData[], targetTime: number) => {
    let left = 0;
    let right = sortedData.length - 1;
    let closest = sortedData[0];
    let minDiff = Infinity;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const candle = sortedData[mid];
        const diff = Math.abs(candle.time - targetTime);

        if (diff < minDiff) {
            minDiff = diff;
            closest = candle;
        }

        if (candle.time < targetTime) {
            left = mid + 1;
        } else if (candle.time > targetTime) {
            right = mid - 1;
        } else {
            return candle; // Exact match
        }
    }
    return closest;
};

// ✅ Data Formatting Function (Array to Object Conversion)
// এটি ব্রাউজারের সাইডে ডেটা প্রসেস করবে, ফলে নেটওয়ার্ক ফাস্ট থাকবে।
const formatChartData = (rawData: any[]): CandleData[] => {
    if (!rawData || rawData.length === 0) return [];

    // যদি ডেটা ইতিমধ্যে অবজেক্ট হয় (পুরাতন ফরম্যাট)
    if (!Array.isArray(rawData[0])) {
        return rawData as CandleData[];
    }

    // যদি ডেটা অ্যারে হয় (নতুন অপ্টিমাইজড ফরম্যাট) [time, open, high, low, close, volume]
    return rawData.map((c: any[]) => ({
        time: c[0] as number,
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        // volume: c[5] // ভলিউম লাগলে আলাদা হ্যান্ডেল করা যাবে
    }));
};

const BacktestChart: React.FC<BacktestChartProps> = ({ data = [], trades = [] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // 1. Chart Initialization
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#1E293B' }, // Dark Theme
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
                borderColor: '#475569',
            },
            rightPriceScale: {
                borderColor: '#475569',
            },
        });
        chartRef.current = chart;

        // 2. Add Series
        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#F43F5E',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#F43F5E',
        });

        // 3. Process Data
        const formattedData = formatChartData(data);

        // Duplicate remove & sort
        const uniqueDataMap = new Map();
        formattedData.forEach(item => uniqueDataMap.set(item.time, item));
        const sortedData = Array.from(uniqueDataMap.values()).sort((a, b) => a.time - b.time);

        // Set Data to Chart
        candlestickSeries.setData(sortedData as any);

        // 4. Marker Logic
        const validMarkers: SeriesMarker<Time>[] = [];
        trades.forEach(trade => {
            const tradeTime = Number(trade.time);
            const closest = findClosestCandle(sortedData, tradeTime);

            // 24 ঘন্টার কম পার্থক্য হলে মার্কার দেখাবে
            if (closest && Math.abs(closest.time - tradeTime) <= 86400) {
                validMarkers.push({
                    time: closest.time as Time,
                    position: trade.type === 'buy' ? 'belowBar' : 'aboveBar',
                    color: trade.type === 'buy' ? '#10B981' : '#F43F5E',
                    shape: trade.type === 'buy' ? 'arrowUp' : 'arrowDown',
                    text: trade.type.toUpperCase() + ` @ ${trade.price.toFixed(2)}`,
                    size: 1 // ছোট মার্কার সাইজ
                });
            }
        });

        // মার্কার টাইম অনুযায়ী সর্ট করা আবশ্যিক
        validMarkers.sort((a, b) => (a.time as number) - (b.time as number));
        createSeriesMarkers(candlestickSeries, validMarkers);

        // Fit Content
        chart.timeScale().fitContent();

        // 5. Resize Handler
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
            <div ref={chartContainerRef} className="w-full h-full rounded-xl overflow-hidden border border-brand-border-dark shadow-lg" />
            {!data.length && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm pointer-events-none rounded-xl">
                    No Chart Data Available
                </div>
            )}
        </div>
    );
};

export default BacktestChart;
