// frontend/components/ui/BacktestChart.tsx

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickSeries, SeriesMarker, Time, createSeriesMarkers } from 'lightweight-charts';

interface TradeMarker {
    time: number;
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

// ✅ Binary Search Helper Function (Eta main component er baire rakho)
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

const BacktestChart: React.FC<BacktestChartProps> = ({ data = [], trades = [] }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

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

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#10B981',
            downColor: '#F43F5E',
            borderVisible: false,
            wickUpColor: '#10B981',
            wickDownColor: '#F43F5E',
        });

        // Data sorting (Duplication remove kora valo)
        const uniqueDataMap = new Map();
        data.forEach(item => uniqueDataMap.set(item.time, item));
        const sortedData = Array.from(uniqueDataMap.values()).sort((a, b) => a.time - b.time);

        candlestickSeries.setData(sortedData as any);

        // ✅ Updated Marker Logic using Binary Search
        const validMarkers: SeriesMarker<Time>[] = [];

        trades.forEach(trade => {
            const tradeTime = Number(trade.time);

            // Binary search use kore closest candle khuje ber kora
            const closest = findClosestCandle(sortedData, tradeTime);

            // Jodi time difference 24 ghonta (86400 seconds) er kom hoy, tobei marker dekhabo
            if (closest && Math.abs(closest.time - tradeTime) <= 86400) {
                validMarkers.push({
                    time: closest.time as Time,
                    position: trade.type === 'buy' ? 'belowBar' : 'aboveBar',
                    color: trade.type === 'buy' ? '#10B981' : '#F43F5E',
                    shape: trade.type === 'buy' ? 'arrowUp' : 'arrowDown',
                    text: trade.type.toUpperCase() + ` @ ${trade.price.toFixed(2)}`,
                    size: 2
                });
            }
        });

        validMarkers.sort((a, b) => (a.time as number) - (b.time as number));
        createSeriesMarkers(candlestickSeries, validMarkers);
        chart.timeScale().fitContent();

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
            {!data.length && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm pointer-events-none">
                    No Chart Data
                </div>
            )}
        </div>
    );
};

export default BacktestChart;