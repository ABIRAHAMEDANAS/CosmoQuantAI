import React, { useState, useMemo } from 'react';
import { BacktestResult } from '@/types';

interface ParameterHeatmapProps {
    results: BacktestResult[];
}

const ParameterHeatmap: React.FC<ParameterHeatmapProps> = ({ results }) => {
    // ১. রেজাল্ট ভ্যালিডেশন
    if (!results || results.length === 0) return null;

    // ২. প্যারামিটার আছে কি না চেক করা (Batch Test এ params নাও থাকতে পারে)
    const firstValidResult = results.find(r => r.params && Object.keys(r.params).length > 0);
    const availableParams = firstValidResult ? Object.keys(firstValidResult.params || {}) : [];

    // যদি কোনো প্যারামিটার না থাকে (যেমন Batch Test এর ক্ষেত্রে), তবে হিটম্যাপ দেখানো যাবে না
    if (availableParams.length < 2) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Not enough parameters for heatmap visualization.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    (Heatmap requires optimization results with at least 2 parameters)
                </p>
            </div>
        );
    }

    const metrics = [
        { label: 'Net Profit (%)', key: 'profitPercent' },
        { label: 'Sharpe Ratio', key: 'sharpeRatio' },
        { label: 'Max Drawdown (%)', key: 'maxDrawdown' },
    ];

    const [xAxisParam, setXAxisParam] = useState<string>(availableParams[0] || '');
    const [yAxisParam, setYAxisParam] = useState<string>(availableParams[1] || availableParams[0] || '');
    const [selectedMetric, setSelectedMetric] = useState<string>('profitPercent');

    // ৩. ডেটা প্রসেসিং (Safe Version)
    const { matrix, xValues, yValues, minValue, maxValue } = useMemo(() => {
        const xSet = new Set<number>();
        const ySet = new Set<number>();
        const dataMap = new Map<string, number>();

        let min = Infinity;
        let max = -Infinity;

        results.forEach(res => {
            // ✅ FIX: params চেক করা হচ্ছে
            if (!res.params) return;

            const xVal = Number(res.params[xAxisParam]);
            const yVal = Number(res.params[yAxisParam]);

            // NaN চেক
            if (isNaN(xVal) || isNaN(yVal)) return;

            xSet.add(xVal);
            ySet.add(yVal);

            const val = res[selectedMetric as keyof BacktestResult] as number;

            // ✅ FIX: ভ্যালু সেফটি
            const cleanVal = (val === undefined || val === null || isNaN(val)) ? 0 : val;

            if (cleanVal < min) min = cleanVal;
            if (cleanVal > max) max = cleanVal;

            dataMap.set(`${xVal}-${yVal}`, cleanVal);
        });

        const sortedX = Array.from(xSet).sort((a, b) => a - b);
        const sortedY = Array.from(ySet).sort((a, b) => b - a);

        return { matrix: dataMap, xValues: sortedX, yValues: sortedY, minValue: min, maxValue: max };
    }, [results, xAxisParam, yAxisParam, selectedMetric]);

    // ৪. কালার জেনারেশন
    const getCellColor = (value: number) => {
        if (value > 0) {
            const intensity = Math.min(0.2 + (value / Math.max(maxValue, 1)) * 0.8, 1);
            return `rgba(16, 185, 129, ${intensity})`;
        } else {
            const intensity = Math.min(0.2 + (Math.abs(value) / Math.max(Math.abs(minValue), 1)) * 0.8, 1);
            return `rgba(244, 63, 94, ${intensity})`;
        }
    };

    return (
        <div className="bg-white dark:bg-[#131722] p-6 rounded-lg border border-gray-200 dark:border-[#2A2E39] shadow-sm animate-fade-in">
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
            <div className="overflow-x-auto custom-scrollbar">
                <div className="inline-block min-w-full">
                    <div className="flex">
                        <div className="flex flex-col justify-end pb-2 pr-2">
                            <div className="h-full flex items-center justify-center">
                                <span className="transform -rotate-90 text-xs font-bold text-gray-400 whitespace-nowrap w-4">
                                    {yAxisParam} ➜
                                </span>
                            </div>
                        </div>

                        <div>
                            {yValues.map((yVal) => (
                                <div key={yVal} className="flex items-center">
                                    <div className="w-16 text-right pr-2 text-xs text-gray-500 font-mono py-1">{yVal}</div>
                                    {xValues.map((xVal) => {
                                        const val = matrix.get(`${xVal}-${yVal}`);
                                        const hasVal = val !== undefined;

                                        return (
                                            <div
                                                key={`${xVal}-${yVal}`}
                                                className="w-16 h-12 m-0.5 rounded flex items-center justify-center relative group cursor-pointer transition-transform hover:scale-105 hover:z-10"
                                                style={{
                                                    backgroundColor: hasVal ? getCellColor(val) : 'transparent',
                                                    border: hasVal ? 'none' : '1px dashed #334155'
                                                }}
                                            >
                                                {hasVal ? (
                                                    <>
                                                        <span className="text-[10px] font-bold text-white drop-shadow-md">
                                                            {val?.toFixed(1)}
                                                        </span>
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

                            <div className="flex ml-16 mt-2">
                                {xValues.map((xVal) => (
                                    <div key={xVal} className="w-16 text-center text-xs text-gray-500 font-mono transform -rotate-45 origin-top-left translate-y-2">
                                        {xVal}
                                    </div>
                                ))}
                            </div>

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
