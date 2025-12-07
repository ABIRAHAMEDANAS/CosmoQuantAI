import React, { useMemo } from 'react';

interface HeatmapDataPoint {
    year: number;
    month: number;
    value: number;
}

interface MonthlyReturnsHeatmapProps {
    data: HeatmapDataPoint[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyReturnsHeatmap: React.FC<MonthlyReturnsHeatmapProps> = ({ data }) => {
    const processedData = useMemo(() => {
        const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => b - a);
        const map = new Map<number, Record<number, number>>();

        data.forEach(d => {
            if (!map.has(d.year)) map.set(d.year, {});
            map.get(d.year)![d.month] = d.value;
        });

        return { years, map };
    }, [data]);

    return (
        <div className="overflow-x-auto custom-scrollbar pb-2">
            {/* min-w বাড়িয়ে 900px করা হলো যাতে চার্টটি চ্যাপ্টা না হয়ে যায় */}
            <div className="min-w-[900px]">

                {/* Header Row */}
                {/* gap-1 থেকে বাড়িয়ে gap-2 করা হয়েছে */}
                <div className="grid grid-cols-13 gap-2 mb-2">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider">Year</div>
                    {MONTHS.map(m => (
                        // টেক্সট সাইজ text-xs থেকে বাড়িয়ে text-sm করা হয়েছে
                        <div key={m} className="text-sm font-bold text-center text-gray-500 dark:text-gray-400">{m}</div>
                    ))}
                </div>

                {/* Data Rows */}
                <div className="space-y-2"> {/* সারিগুলোর মাঝের গ্যাপ বাড়ানো হয়েছে */}
                    {processedData.years.map(year => {
                        const yearData = processedData.map.get(year) || {};
                        const yearReturns = Object.values(yearData);
                        const ytd = yearReturns.reduce((acc, val) => (1 + acc/100) * (1 + val/100) - 1, 0) * 100;

                        return (
                            <div key={year} className="grid grid-cols-13 gap-2 items-center">
                                {/* Year Label - ফন্ট বড় করা হয়েছে */}
                                <div className="text-sm font-bold text-slate-700 dark:text-gray-300 font-mono flex flex-col">
                                    <span>{year}</span>
                                    <span className={`text-[10px] ${ytd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {ytd > 0 ? '+' : ''}{ytd.toFixed(1)}%
                                    </span>
                                </div>

                                {/* Month Cells */}
                                {Array.from({ length: 12 }).map((_, i) => {
                                    const monthIndex = i + 1;
                                    const value = yearData[monthIndex];
                                    const hasValue = value !== undefined;

                                    return (
                                        <div
                                            key={i}
                                            className={`
                                                h-14 rounded-lg flex items-center justify-center text-sm font-mono font-bold transition-all hover:scale-105 cursor-default relative group
                                                ${!hasValue ? 'bg-gray-50 dark:bg-white/5 text-gray-300/20' : ''}
                                                ${hasValue && value >= 0 ? 'bg-emerald-500' : ''}
                                                ${hasValue && value < 0 ? 'bg-rose-500' : ''}
                                            `}
                                            // h-8 থেকে h-14 করা হয়েছে (উচ্চতা বৃদ্ধি)
                                            // text-[10px] থেকে text-sm করা হয়েছে (ফন্ট বৃদ্ধি)
                                            // rounded-md থেকে rounded-lg করা হয়েছে
                                            style={hasValue ? { backgroundColor: value >= 0 ? `rgba(16, 185, 129, ${Math.min(0.2 + value/30, 1)})` : `rgba(244, 63, 94, ${Math.min(0.2 + Math.abs(value) / 30, 1)})`, color: 'white' } : {}}
                                        >
                                            {hasValue ? (
                                                <>
                                                    {value.toFixed(1)}%
                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 bg-slate-900 text-white text-xs p-2 rounded whitespace-nowrap shadow-xl border border-slate-700">
                                                        <span className="font-bold">{MONTHS[i]} {year}</span>: {value > 0 ? '+' : ''}{value.toFixed(2)}%
                                                    </div>
                                                </>
                                            ) : '-'}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MonthlyReturnsHeatmap;

