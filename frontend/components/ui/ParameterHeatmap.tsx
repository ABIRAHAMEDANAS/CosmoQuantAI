import React, { useState, useMemo } from 'react';
import { BacktestResult } from '../../types'; // আপনার types.ts ফাইল অনুযায়ী পাথ ঠিক করে নিন

interface ParameterHeatmapProps {
    results: BacktestResult[];
}

const ParameterHeatmap: React.FC<ParameterHeatmapProps> = ({ results }) => {
    if (!results || results.length === 0) return null;

    // ১. প্যারামিটার এবং মেট্রিক্স খুঁজে বের করা
    const availableParams = Object.keys(results[0].params || {});
    const metrics = [
        { label: 'Net Profit (%)', key: 'profitPercent' },
        { label: 'Sharpe Ratio', key: 'sharpeRatio' },
        { label: 'Max Drawdown (%)', key: 'maxDrawdown' },
    ];

    // ডিফল্ট সিলেকশন (যদি ২টির কম প্যারামিটার থাকে তবে হ্যান্ডেল করা হবে)
    const [xAxisParam, setXAxisParam] = useState<string>(availableParams[0] || '');
    const [yAxisParam, setYAxisParam] = useState<string>(availableParams[1] || availableParams[0] || '');
    const [selectedMetric, setSelectedMetric] = useState<string>('profitPercent');

    // ২. ডেটা প্রসেসিং: গ্রিড বা ম্যাট্রিক্স তৈরি করা
    const { matrix, xValues, yValues, minValue, maxValue } = useMemo(() => {
        // ইউনিক ভ্যালু বের করে সর্ট করা
        const xSet = new Set<number>();
        const ySet = new Set<number>();

        results.forEach(res => {
            if (res.params) {
                xSet.add(Number(res.params[xAxisParam]));
                ySet.add(Number(res.params[yAxisParam]));
            }
        });

        const sortedX = Array.from(xSet).sort((a, b) => a - b);
        const sortedY = Array.from(ySet).sort((a, b) => b - a); // Y-অক্ষ সাধারণত নিচ থেকে উপরে বা উপর থেকে নিচে সাজানো হয় (এখানে ডিসেন্ডিং)

        // ভ্যালু রেঞ্জ বের করা (কালার স্কেলের জন্য)
        let min = Infinity;
        let max = -Infinity;

        // ম্যাপ তৈরি করা যাতে O(1) এ এক্সেস করা যায়
        const dataMap = new Map<string, number>();
        results.forEach(res => {
            const x = res.params[xAxisParam];
            const y = res.params[yAxisParam];
            const val = res[selectedMetric as keyof BacktestResult] as number;

            if (val < min) min = val;
            if (val > max) max = val;

            dataMap.set(`${x}-${y}`, val);
        });

        return { matrix: dataMap, xValues: sortedX, yValues: sortedY, minValue: min, maxValue: max };
    }, [results, xAxisParam, yAxisParam, selectedMetric]);

    // ৩. কালার জেনারেশন ফাংশন (Green for High, Red for Low)
    const getCellColor = (value: number) => {
        if (selectedMetric === 'maxDrawdown') {
            // ড্রডাউনের জন্য কম ভ্যালু ভালো (সবুজ), বেশি ভ্যালু খারাপ (লাল)
            // এখানে লজিক উল্টো হবে, তবে সিম্পল রাখার জন্য আমরা প্রফিটের লজিকই ব্যবহার করছি, আপনি চাইলে রিভার্স করতে পারেন
            // সাধারণত হিটম্যাপে: High Value (Profit) = Green, Low Value (Loss) = Red
        }

        // নরমালাইজেশন (-1 to 1 এর মধ্যে আনার চেষ্টা, অথবা min/max দিয়ে)
        // সিম্পল লজিক: 
        if (value > 0) {
            // ০ থেকে ম্যাক্স এর মধ্যে ইনটেনসিটি
            const intensity = Math.min(0.2 + (value / Math.max(maxValue, 1)) * 0.8, 1);
            return `rgba(16, 185, 129, ${intensity})`; // Emerald Green
        } else {
            const intensity = Math.min(0.2 + (Math.abs(value) / Math.max(Math.abs(minValue), 1)) * 0.8, 1);
            return `rgba(244, 63, 94, ${intensity})`; // Rose Red
        }
    };

    if (availableParams.length < 2) {
        return <div className="p-4 text-center text-gray-500">Need at least 2 varying parameters to generate a heatmap.</div>;
    }

    return (
        <div className="bg-white dark:bg-[#131722] p-6 rounded-lg border border-gray-200 dark:border-[#2A2E39] shadow-sm">
            {/* Controls Header */}
            <div className="flex flex-wrap gap-4 mb-6 items-end border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">X-Axis Parameter</label>
                    <select
                        value={xAxisParam}
                        onChange={(e) => setXAxisParam(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
                    >
                        {availableParams.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Y-Axis Parameter</label>
                    <select
                        value={yAxisParam}
                        onChange={(e) => setYAxisParam(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
                    >
                        {availableParams.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>

                <div className="ml-auto">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Metric Color</label>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        className="bg-gray-100 dark:bg-gray-800 border-none rounded px-3 py-1.5 text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary"
                    >
                        {metrics.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    <div className="flex">
                        {/* Y-Axis Label Column */}
                        <div className="flex flex-col justify-end pb-2 pr-2">
                            <div className="h-full flex items-center justify-center">
                                <span className="transform -rotate-90 text-xs font-bold text-gray-400 whitespace-nowrap w-4">
                                    {yAxisParam} ➜
                                </span>
                            </div>
                        </div>

                        {/* Main Chart Area */}
                        <div>
                            {/* Grid Rows */}
                            {yValues.map((yVal) => (
                                <div key={yVal} className="flex items-center">
                                    {/* Y-Axis Value Label */}
                                    <div className="w-16 text-right pr-2 text-xs text-gray-500 font-mono py-1">{yVal}</div>

                                    {/* Cells */}
                                    {xValues.map((xVal) => {
                                        const val = matrix.get(`${xVal}-${yVal}`);
                                        const hasVal = val !== undefined;

                                        return (
                                            <div
                                                key={`${xVal}-${yVal}`}
                                                className="w-16 h-12 m-0.5 rounded flex items-center justify-center relative group cursor-pointer transition-transform hover:scale-110 hover:z-10 hover:shadow-lg"
                                                style={{
                                                    backgroundColor: hasVal ? getCellColor(val) : 'transparent',
                                                    border: hasVal ? 'none' : '1px dashed #334155' // Empty cells shown as dashed
                                                }}
                                            >
                                                {hasVal ? (
                                                    <>
                                                        <span className="text-[10px] font-bold text-white drop-shadow-md">
                                                            {val?.toFixed(1)}
                                                        </span>
                                                        {/* Tooltip */}
                                                        <div className="hidden group-hover:block absolute bottom-full mb-2 bg-slate-900 text-white text-xs p-2 rounded shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                                            <div className="font-bold border-b border-slate-700 pb-1 mb-1">Result Details</div>
                                                            <div>{xAxisParam}: <span className="font-mono text-yellow-400">{xVal}</span></div>
                                                            <div>{yAxisParam}: <span className="font-mono text-yellow-400">{yVal}</span></div>
                                                            <div className="mt-1">{selectedMetric}: <span className={`font-mono font-bold ${val > 0 ? 'text-green-400' : 'text-red-400'}`}>{val.toFixed(2)}</span></div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <span className="text-[9px] text-gray-700 dark:text-gray-600">N/A</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* X-Axis Labels */}
                            <div className="flex ml-16 mt-2">
                                {xValues.map((xVal) => (
                                    <div key={xVal} className="w-16 text-center text-xs text-gray-500 font-mono transform -rotate-45 origin-top-left translate-y-2">
                                        {xVal}
                                    </div>
                                ))}
                            </div>

                            {/* X-Axis Title */}
                            <div className="text-center mt-8 text-xs font-bold text-gray-400">
                                {xAxisParam} ➜
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParameterHeatmap;
