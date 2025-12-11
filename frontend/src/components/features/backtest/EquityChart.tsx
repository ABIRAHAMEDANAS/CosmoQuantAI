import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, Time, AreaSeries } from 'lightweight-charts';

interface EquityChartProps {
    data: { time: number; value: number }[];
}

const EquityChart: React.FC<EquityChartProps> = ({ data }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current || !data || data.length === 0) return;

        // 1. Chart তৈরি করা
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' }, // ট্রান্সপারেন্ট ব্যাকগ্রাউন্ড
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: '#1E293B' }, // খুব হালকা গ্রিড লাইন
                horzLines: { color: '#1E293B' },
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#1E293B',
            },
            rightPriceScale: {
                borderColor: '#1E293B',
            },
            crosshair: {
                vertLine: {
                    color: '#6366f1', // কার্সারের কালার
                    width: 1,
                    style: 3, // Dashed style
                    labelBackgroundColor: '#6366f1',
                },
                horzLine: {
                    color: '#6366f1',
                    width: 1,
                    style: 3,
                    labelBackgroundColor: '#6366f1',
                },
            },
            autoSize: true, // ✅ Auto size
        });
        chartRef.current = chart;

        // 2. Area Series যোগ করা (TradingView স্টাইল)
        // ✅ ফিক্স: v4+ Syntax
        const areaSeries = chart.addSeries(AreaSeries, {
            topColor: 'rgba(59, 130, 246, 0.5)', // উপরে গাঢ় নীল (Blue-500)
            bottomColor: 'rgba(59, 130, 246, 0.0)', // নিচে স্বচ্ছ
            lineColor: '#3b82f6', // লাইনের কালার
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
        });

        // 3. ডাটা সেট করা (Time অবশ্যই Ascending হতে হবে)
        const sortedData = [...data].sort((a, b) => a.time - b.time).map(d => ({
            time: d.time as Time,
            value: d.value
        }));

        areaSeries.setData(sortedData);
        chart.timeScale().fitContent();

        // 4. রেসপন্সিভ হ্যান্ডলার
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
    }, [data]);

    return (
        <div className="w-full bg-[#131722] border border-[#2A2E39] rounded-lg p-4 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 ml-1">Account Equity Curve</h3>
            <div ref={chartContainerRef} className="w-full h-[300px]" />
        </div>
    );
};

export default EquityChart;
