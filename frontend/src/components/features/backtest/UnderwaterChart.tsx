import React, { useEffect, useRef } from 'react';
// ১. AreaSeries ইম্পোর্ট করা হয়েছে (v5 এর জন্য জরুরি)
import { createChart, ColorType, IChartApi, AreaSeries } from 'lightweight-charts';

interface DrawdownData {
    time: string | number;
    value: number; // e.g., -5.25 (percentage)
}

interface UnderwaterChartProps {
    data: DrawdownData[];
    height?: number;
}

const UnderwaterChart: React.FC<UnderwaterChartProps> = ({ data = [], height = 200 }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        // চার্ট তৈরি
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: '#131722' },
                textColor: '#9CA3AF',
            },
            grid: {
                vertLines: { color: '#1F2937' },
                horzLines: { color: '#1F2937' },
            },
            width: chartContainerRef.current.clientWidth,
            height: height,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#374151',
            },
            rightPriceScale: {
                borderColor: '#374151',
                scaleMargins: {
                    top: 0.1,
                    bottom: 0.1,
                },
            },
        });
        chartRef.current = chart;

        // ২. ফিক্স: chart.addAreaSeries() এর বদলে chart.addSeries(AreaSeries, ...) ব্যবহার করা হয়েছে
        const drawdownSeries = chart.addSeries(AreaSeries, {
            topColor: 'rgba(239, 68, 68, 0)',     // উপরে স্বচ্ছ
            bottomColor: 'rgba(239, 68, 68, 0.5)', // নিচে লাল আভা
            lineColor: '#EF4444',                  // লাল বর্ডার
            lineWidth: 2,
        });

        // ৩. ডেটা ফরম্যাটিং (নেগেটিভ ভ্যালু নিশ্চিত করা)
        const formattedData = data.map(d => ({
            time: d.time,
            value: d.value > 0 ? -d.value : d.value
        }));

        drawdownSeries.setData(formattedData as any);
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
    }, [data, height]);

    return (
        <div className="relative w-full">
            <div className="absolute top-2 left-4 z-10">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Drawdown (Underwater)</h3>
            </div>
            <div ref={chartContainerRef} className="w-full rounded-lg overflow-hidden border border-[#2A2E39]" />

            {!data.length && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-gray-500 text-sm">
                    No Drawdown Data
                </div>
            )}
        </div>
    );
};

export default UnderwaterChart;
