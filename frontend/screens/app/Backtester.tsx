import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area,
    BarChart, Bar, Rectangle
} from 'recharts';
import { EQUITY_CURVE_DATA, MOCK_BACKTEST_RESULTS, MOCK_STRATEGIES, MOCK_STRATEGY_PARAMS, MOCK_CUSTOM_MODELS } from '../../constants';
import { useTheme } from '../../contexts/ThemeContext';
import CodeEditor from '../../components/ui/CodeEditor';
import type { BacktestResult, Timeframe } from '../../types';

import { useToast } from '../../contexts/ToastContext';
import { syncMarketData, runBacktestApi, runOptimizationApi, getBacktestStatus, getExchangeList, getExchangeMarkets, uploadStrategyFile, generateStrategy, fetchCustomStrategyList, fetchStrategyCode, revokeBacktestTask, uploadBacktestDataFile, downloadCandles, downloadTrades, getDownloadStatus } from '../../services/backtester';
import { useBacktest } from '../../contexts/BacktestContext';
import { AIFoundryIcon } from '../../constants';
import SearchableSelect from '../../components/ui/SearchableSelect';
import BacktestChart from '../../components/ui/BacktestChart';
import UnderwaterChart from '../../components/ui/UnderwaterChart'; // ✅ Underwater Chart Import
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import MonthlyReturnsHeatmap from '../../components/ui/MonthlyReturnsHeatmap';

import { Activity, Layers, PlayIcon, CodeIcon, SaveIcon, UploadCloud, Download, X, AlertCircle, Settings, Info } from 'lucide-react';

// --- Constants ---
const TIMEFRAME_OPTIONS: Timeframe[] = [
    // Seconds
    "1s", "5s", "10s", "15s", "30s", "45s",

    // Minutes
    "1m", "3m", "5m", "15m", "30m", "45m",

    // Hours
    "1h", "2h", "3h", "4h", "6h", "8h", "12h",

    // Days & Weeks & Months
    "1d", "3d", "1w", "1M"
];

// --- Helper Functions ---
const parseParamsFromCode = (code: string): Record<string, any> => {
    const match = code.match(/#\s*@params\s*([\s\S]*?)#\s*@params_end/);
    if (match && match[1]) {
        try {
            const jsonString = match[1].replace(/^\s*#\s*/gm, '');
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse param config:", e);
            return {};
        }
    }
    return {};
};

// ✅ Helper to calculate simple drawdown from candle closes (Proxy for Equity)
const calculateDrawdownFromCandles = (candles: any[]) => {
    let peak = -Infinity;
    return candles.map(c => {
        if (c.close > peak) peak = c.close;
        const drawdown = ((c.close - peak) / peak) * 100;
        return { time: c.time, value: drawdown };
    });
};

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number; decimals?: number; prefix?: string; suffix?: string }> = ({ value, decimals = 2, prefix = '', suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        if (start === end) return;
        const duration = 1000;
        const startTime = performance.now();
        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = start + (end - start) * easeOut;
            setDisplayValue(current);
            if (progress < 1) requestAnimationFrame(animate);
            else setDisplayValue(end);
        };
        requestAnimationFrame(animate);
    }, [value]);

    return (
        <span className="animate-count-up">
            {prefix}{displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
        </span>
    );
};

const MetricCard: React.FC<{ label: string; value: number; prefix?: string; suffix?: string; positive?: boolean }> = ({ label, value, prefix = '', suffix = '', positive }) => (
    <Card className="text-center bg-gray-50 dark:bg-brand-dark/50 transform hover:scale-105 transition-transform duration-200">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${positive === true ? 'text-brand-success' : positive === false ? 'text-brand-danger' : 'text-slate-900 dark:text-white'}`}>
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={label.includes('Ratio') ? 2 : 1} />
        </p>
    </Card>
);

type OptimizationParamValue = { start: number | string; end: number | string; step: number | string; };
type OptimizationParams = Record<string, OptimizationParamValue>;

const RangeSliderInput: React.FC<{
    config: { label: string; min?: number; max?: number; step?: number };
    value: OptimizationParamValue;
    onChange: (newValue: OptimizationParamValue) => void;
    hideStepInput?: boolean;
}> = ({ config, value, onChange, hideStepInput = false }) => {
    const { min = 0, max = 100, step = 1 } = config;
    const { start, end, step: stepValue } = value;
    const startNum = Number(start);
    const endNum = Number(end);
    const rangeRef = useRef<HTMLDivElement>(null);
    const getPercent = useCallback((val: number) => Math.round(((val - min) / (max - min)) * 100), [min, max]);

    useEffect(() => {
        const startPercent = getPercent(startNum);
        const endPercent = getPercent(endNum);
        if (rangeRef.current) {
            rangeRef.current.style.left = `${startPercent}%`;
            rangeRef.current.style.width = `${endPercent - startPercent}%`;
        }
    }, [startNum, endNum, getPercent]);

    const handleValueChange = (field: 'start' | 'end' | 'step', val: string | number) => {
        const newValues = { ...value, [field]: val };
        let s = Number(newValues.start);
        let e = Number(newValues.end);
        if (field === 'start') s = Math.min(s, e);
        else if (field === 'end') e = Math.max(e, s);
        onChange({ ...newValues, start: s, end: e });
    };

    const handleRangeChange = (field: 'start' | 'end', e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (field === 'start') {
            const newStart = Math.min(val, endNum - Number(stepValue));
            if (newStart !== startNum) onChange({ ...value, start: newStart });
        } else {
            const newEnd = Math.max(val, startNum + Number(stepValue));
            if (newEnd !== endNum) onChange({ ...value, end: newEnd });
        }
    };

    const inputClasses = "w-24 bg-white dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-md p-1.5 text-slate-900 dark:text-white text-sm focus:ring-brand-primary focus:border-brand-primary";

    return (
        <div className="space-y-3">
            <div className="range-slider-container">
                <input type="range" min={min} max={max} step={step} value={startNum} onChange={(e) => handleRangeChange('start', e)} className="thumb thumb--left" aria-label="Start value" />
                <input type="range" min={min} max={max} step={step} value={endNum} onChange={(e) => handleRangeChange('end', e)} className="thumb thumb--right" aria-label="End value" />
                <div className="range-slider-track"></div>
                <div ref={rangeRef} className="range-slider-range"></div>
            </div>
            <div className={`flex items-center gap-2 ${hideStepInput ? 'justify-between' : 'justify-evenly'}`}>
                <div>
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">Start</label>
                    <input type="number" min={min} max={max} step={step} value={start} onChange={(e) => handleValueChange('start', e.target.value)} className={inputClasses} />
                </div>
                {!hideStepInput && (
                    <div>
                        <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1 text-center">Step</label>
                        <input type="number" min={step} step={step} value={stepValue} onChange={(e) => handleValueChange('step', e.target.value)} className={inputClasses} />
                    </div>
                )}
                <div className="text-right">
                    <label className="block text-xs text-gray-400 dark:text-gray-500 mb-1">End</label>
                    <input type="number" min={min} max={max} step={step} value={end} onChange={(e) => handleValueChange('end', e.target.value)} className={inputClasses} />
                </div>
            </div>
        </div>
    );
};

const CalendarIcon = () => (
    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const Backtester: React.FC = () => {
    const { theme } = useTheme();
    const { showToast } = useToast();

    // Context & States
    const {
        statusMessage,
        isLoading: isContextLoading,
        runBacktest: runContextBacktest,
        setStrategy: setContextStrategy,
        setSymbol: setContextSymbol,
        setTimeframe: setContextTimeframe,
        setStartDate: setContextStartDate,
        setEndDate: setContextEndDate,
        setParams: setContextParams,
        singleResult: contextResult,
        commission, setCommission,
        slippage, setSlippage
    } = useBacktest();

    // --- Tab State (NEW) ---
    const [activeTab, setActiveTab] = useState<'backtest' | 'editor'>('backtest');

    const [strategies, setStrategies] = useState(MOCK_STRATEGIES);
    const [strategy, setStrategy] = useState('RSI Crossover');
    const [symbol, setSymbol] = useState('');
    const [timeframe, setTimeframe] = useState('1h');
    const [exchanges, setExchanges] = useState<string[]>([]);
    const [markets, setMarkets] = useState<string[]>([]);
    const [selectedExchange, setSelectedExchange] = useState('binance');
    const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
    const [customStrategies, setCustomStrategies] = useState<string[]>([]);

    const [params, setParams] = useState<Record<string, any>>({});
    const [optimizationParams, setOptimizationParams] = useState<OptimizationParams>({});
    const [optimizableParams, setOptimizableParams] = useState<Record<string, any>>({});

    // Editor State
    const [currentStrategyCode, setCurrentStrategyCode] = useState('# Strategy code will appear here...');

    const [showResults, setShowResults] = useState(false);
    const [backtestMode, setBacktestMode] = useState<'single' | 'optimization'>('single');
    const [startDate, setStartDate] = useState('2023-01-01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPortfolioBacktest, setIsPortfolioBacktest] = useState(false);
    const [portfolioAssets, setPortfolioAssets] = useState(['BTC/USDT', 'ETH/USDT']);
    const [newPortfolioAsset, setNewPortfolioAsset] = useState('');
    const [optimizationMethod, setOptimizationMethod] = useState<'gridSearch' | 'geneticAlgorithm'>('gridSearch');
    const [gaParams, setGaParams] = useState({ populationSize: 50, generations: 20 });
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationProgress, setOptimizationProgress] = useState(0);
    const [isWalkForwardEnabled, setIsWalkForwardEnabled] = useState(true);
    const [walkForwardConfig, setWalkForwardConfig] = useState({ inSample: 6, outOfSample: 2 });
    const [isMultiObjectiveEnabled, setIsMultiObjectiveEnabled] = useState(false);
    const [multiObjectiveGoals, setMultiObjectiveGoals] = useState<string[]>(['Net Profit']);
    const [singleResult, setSingleResult] = useState<BacktestResult | null>(null);
    const [multiObjectiveResults, setMultiObjectiveResults] = useState<BacktestResult[] | null>(null);
    const [batchResults, setBatchResults] = useState<BacktestResult[] | null>(null);

    // AI Inputs
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');
    const [isBatchRunning, setIsBatchRunning] = useState(false);
    const [isReplayActive, setIsReplayActive] = useState(false);
    const [replayIndex, setReplayIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [replaySpeed, setReplaySpeed] = useState(1);
    const replayIntervalRef = useRef<number | null>(null);

    // ✅ নতুন স্টেট: ডাটা সোর্স সিলেকশন এবং ফাইলের নাম
    const [dataSource, setDataSource] = useState<'database' | 'csv'>('database');
    const [uploadedDataFile, setUploadedDataFile] = useState<string | null>(null);
    const [csvFileName, setCsvFileName] = useState<string>("");
    const [isUploadingData, setIsUploadingData] = useState(false);
    const dataFileInputRef = useRef<HTMLInputElement>(null);
    const [initialCash, setInitialCash] = useState(10000);
    const [isRunning, setIsRunning] = useState(false);
    const [backtestResult, setBacktestResult] = useState<any>(null);
    const [progress, setProgress] = useState(0);

    // Download Modal States
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadType, setDownloadType] = useState<'candles' | 'trades'>('candles');
    const [dlExchange, setDlExchange] = useState('binance');
    const [dlSymbol, setDlSymbol] = useState('BTC/USDT');
    const [dlTimeframe, setDlTimeframe] = useState('1h');
    const [dlStartDate, setDlStartDate] = useState('2024-01-01');
    const [dlEndDate, setDlEndDate] = useState(''); // ✅ ডিফল্ট ফাঁকা (মানে Till Now)

    // ✅ Running States
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null); // ✅ টাস্ক আইডি ট্র্যাক করার জন্য

    // ✅ ১. ডাউনলোড হ্যান্ডলার (Start)
    const handleStartDownload = async () => {
        setIsDownloading(true);
        setDownloadProgress(0);

        try {
            if (!dlStartDate) {
                showToast('Please select a Start Date', 'warning');
                setIsDownloading(false);
                return;
            }

            // End Date ফাঁকা থাকলে undefined পাঠাব, যাতে ব্যাকএন্ড "Till Now" ধরে নেয়
            const payload = {
                exchange: dlExchange,
                symbol: dlSymbol,
                start_date: `${dlStartDate} 00:00:00`,
                end_date: dlEndDate ? `${dlEndDate} 23:59:59` : undefined // ✅ Till Now লজিক
            };

            let res;
            if (downloadType === 'candles') {
                res = await downloadCandles({ ...payload, timeframe: dlTimeframe });
            } else {
                res = await downloadTrades(payload);
            }

            const taskId = res.task_id;
            setActiveTaskId(taskId); // টাস্ক আইডি সেভ

            // পোলিং শুরু
            const interval = setInterval(async () => {
                try {
                    const status = await getDownloadStatus(taskId);

                    if (status.status === 'Processing') {
                        setDownloadProgress(status.percent);
                    } else if (status.status === 'Completed') {
                        clearInterval(interval);
                        setIsDownloading(false);
                        setDownloadProgress(100);
                        setActiveTaskId(null);
                        showToast('Download Completed Successfully! 🎉', 'success');
                    } else if (status.status === 'Failed' || status.status === 'Revoked') {
                        clearInterval(interval);
                        setIsDownloading(false);
                        setActiveTaskId(null);

                        if (status.status === 'Revoked') {
                            showToast('Download Stopped by User.', 'info');
                        } else {
                            showToast(`Download Failed: ${status.error}`, 'error');
                        }
                    }
                } catch (e) {
                    clearInterval(interval);
                    setIsDownloading(false);
                }
            }, 1000);

        } catch (e) {
            console.error(e);
            setIsDownloading(false);
            showToast('Failed to start download', 'error');
        }
    };

    // ✅ ২. স্টপ হ্যান্ডলার (Stop Button Action)
    const handleStopDownload = async () => {
        if (!activeTaskId) return;

        try {
            // ব্যাকএন্ডে Stop সিগনাল পাঠানো
            await revokeBacktestTask(activeTaskId);
            showToast('Stopping download...', 'warning');

            // UI আপডেট (পোলিং এর মাধ্যমে ফাইনাল কনফার্মেশন আসবে)
        } catch (e) {
            console.error(e);
            showToast('Failed to stop task.', 'error');
        }
    };

    // ✅ ডাটা ফাইল আপলোড হ্যান্ডলার
    const handleDataFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsUploadingData(true);
            try {
                const res = await uploadBacktestDataFile(file);
                setUploadedDataFile(res.filename); // সার্ভারে সেভ হওয়া নাম
                setCsvFileName(file.name);         // দেখানোর জন্য নাম
                showToast(`File loaded: ${file.name}`, 'success');
            } catch (error) {
                console.error(error);
                showToast('Failed to upload CSV.', 'error');
            } finally {
                setIsUploadingData(false);
            }
        }
    };

    // Initial Data Fetching
    useEffect(() => {
        const initData = async () => {
            try {
                const cList = await fetchCustomStrategyList();
                setCustomStrategies(cList);
                const exList = await getExchangeList();
                setExchanges(exList);
                if (exList.length > 0) setSelectedExchange(exList[0]);
            } catch (e) { console.error(e); }
        };
        initData();
    }, []);

    useEffect(() => {
        const loadMarkets = async () => {
            if (!selectedExchange) return;
            setIsLoadingMarkets(true);
            try {
                const pairs = await getExchangeMarkets(selectedExchange);
                setMarkets(pairs);
                const defaultPair = pairs.includes('BTC/USDT') ? 'BTC/USDT' : pairs[0];
                setSymbol(defaultPair || '');
            } catch (error) { showToast('Failed to load market pairs', 'error'); }
            finally { setIsLoadingMarkets(false); }
        };
        loadMarkets();
    }, [selectedExchange]);

    useEffect(() => {
        return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    }, []);

    // Sync Context
    useEffect(() => {
        setContextStrategy(strategy);
        setContextSymbol(symbol);
        setContextTimeframe(timeframe);
        setContextStartDate(startDate);
        setContextEndDate(endDate);
        setContextParams(params);
    }, [strategy, symbol, timeframe, startDate, endDate, params]);

    useEffect(() => {
        if (contextResult) {
            setSingleResult(contextResult);
            setShowResults(true);
        }
    }, [contextResult]);

    // AI Generation Handler (Updated)
    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) {
            showToast('Please describe your strategy first.', 'warning');
            return;
        }
        setIsGenerating(true);
        try {
            const data = await generateStrategy(aiPrompt);

            // 1. Set Code to Editor
            setCurrentStrategyCode(data.code);

            // 2. Add to list
            const newStrategyName = data.filename.replace(/\.[^/.]+$/, "");
            if (!customStrategies.includes(newStrategyName)) {
                setCustomStrategies(prev => [...prev, newStrategyName]);
            }
            setStrategy(newStrategyName);

            // 3. Extract Params
            const extractedParams = parseParamsFromCode(data.code);
            const newOptParams: OptimizationParams = {};
            const newSimpleParams: Record<string, any> = {};

            Object.entries(extractedParams).forEach(([key, config]: [string, any]) => {
                newOptParams[key] = {
                    start: config.default,
                    end: config.max || config.default * 2,
                    step: config.step || 1
                };
                newSimpleParams[key] = config.default;
            });

            setOptimizationParams(newOptParams);
            setParams(newSimpleParams);
            setOptimizableParams(extractedParams);

            showToast('Strategy Generated & Loaded!', 'success');

            // **Auto Switch to Editor Tab to show code**
            setActiveTab('editor');
            setAiPrompt(''); // Clear prompt

        } catch (error) {
            console.error(error);
            showToast('Failed to generate strategy.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Load Strategy Code & Params
    useEffect(() => {
        const loadStrategyParams = async () => {
            if (customStrategies.includes(strategy)) {
                try {
                    setIsLoading(true);
                    const data = await fetchStrategyCode(strategy);

                    // Update Editor Code
                    setCurrentStrategyCode(data.code);

                    const code = data.code;
                    const backendDetectedParams = data.inferred_params || {};
                    let extractedParams = parseParamsFromCode(code);
                    if (Object.keys(extractedParams).length === 0) {
                        extractedParams = backendDetectedParams;
                    }
                    setOptimizableParams(extractedParams);

                    const newParams: Record<string, any> = {};
                    const newOptParams: OptimizationParams = {};
                    Object.entries(extractedParams).forEach(([key, config]: [string, any]) => {
                        newParams[key] = config.default;
                        newOptParams[key] = {
                            start: config.default,
                            end: config.max || config.default * 3,
                            step: config.step || (Number.isInteger(config.default) ? 1 : 0.1)
                        };
                    });
                    setParams(newParams);
                    setOptimizationParams(newOptParams);

                } catch (error) {
                    console.error("Failed to load strategy data", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Standard strategies - load MOCK params but clear editor code
                setCurrentStrategyCode(`# Source code not available for standard strategy: ${strategy}`);
                // ... (Existing param logic for standard strategies) ...
                const strategyParamsConfig = MOCK_STRATEGY_PARAMS[strategy as keyof typeof MOCK_STRATEGY_PARAMS];
                if (strategyParamsConfig) {
                    const defaultParams = Object.keys(strategyParamsConfig).reduce((acc, key) => {
                        acc[key] = strategyParamsConfig[key].defaultValue;
                        return acc;
                    }, {} as Record<string, any>);
                    setParams(defaultParams);
                    const defaultOptParams = Object.keys(strategyParamsConfig).reduce((acc, key) => {
                        acc[key] = {
                            start: strategyParamsConfig[key].min ?? strategyParamsConfig[key].defaultValue,
                            end: strategyParamsConfig[key].max ?? strategyParamsConfig[key].defaultValue,
                            step: strategyParamsConfig[key].step || 1,
                        };
                        return acc;
                    }, {} as OptimizationParams);
                    setOptimizationParams(defaultOptParams);
                    setOptimizableParams({});
                } else {
                    setParams({});
                    setOptimizationParams({});
                    setOptimizableParams({});
                }
            }
        };
        loadStrategyParams();
    }, [strategy, customStrategies]);

    // ... (Handler functions: ParamChange, GoalToggle, LoadParams, etc. kept same) ...
    const handleParamChange = (key: string, value: string) => {
        const numValue = Number(value);
        setParams(prev => ({ ...prev, [key]: isNaN(numValue) ? value : numValue }));
    };
    const handleOptimizationParamChange = (key: string, newValue: OptimizationParamValue) => {
        setOptimizationParams(prev => ({ ...prev, [key]: newValue }));
    };
    const handleGoalToggle = (goal: string) => {
        setMultiObjectiveGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };
    const handleLoadParams = (paramsToLoad: Record<string, number | string>) => {
        setParams(paramsToLoad);
        setBacktestMode('single');
        setActiveTab('backtest'); // Switch to backtest tab
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Polling Logic
    const pollOptimizationStatus = useCallback((taskId: string) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        const pollInterval = setInterval(async () => {
            try {
                const statusData = await getBacktestStatus(taskId);
                if (statusData.percent) setOptimizationProgress(statusData.percent);

                if (statusData.status === 'Completed') {
                    clearInterval(pollInterval);
                    setIsOptimizing(false);
                    setOptimizationProgress(100);
                    localStorage.removeItem('activeOptimizationId');
                    const rawResults = statusData.result;
                    const formattedResults: BacktestResult[] = rawResults.map((res: any, index: number) => ({
                        id: `opt-${index}`,
                        market: symbol || 'BTC/USDT',
                        strategy: strategy,
                        timeframe: timeframe,
                        date: endDate,
                        profitPercent: res.profitPercent,
                        maxDrawdown: res.maxDrawdown,
                        winRate: 0,
                        sharpeRatio: res.sharpeRatio,
                        profit_percent: res.profitPercent,
                        params: res.params
                    }));

                    if (isMultiObjectiveEnabled) setMultiObjectiveResults(formattedResults);
                    else setBatchResults(formattedResults);

                    setShowResults(true);
                    showToast('Optimization Completed!', 'success');
                } else if (statusData.status === 'Failed') {
                    clearInterval(pollInterval);
                    setIsOptimizing(false);
                    localStorage.removeItem('activeOptimizationId');
                    showToast(`Failed: ${statusData.error}`, 'error');
                }
            } catch (err) { console.error(err); }
        }, 2000);
        pollIntervalRef.current = pollInterval;
    }, [symbol, strategy, timeframe, endDate, isMultiObjectiveEnabled, showToast]);

    useEffect(() => {
        const savedTaskId = localStorage.getItem('activeOptimizationId');
        if (savedTaskId) {
            setIsOptimizing(true);
            pollOptimizationStatus(savedTaskId);
        }
    }, [pollOptimizationStatus]);

    const handleSyncData = async () => {
        setIsSyncing(true);
        try {
            await syncMarketData(symbol, timeframe, startDate, endDate);
            showToast(`Synced historical data for ${symbol}`, 'success');
        } catch (error) { console.error(error); showToast('Failed to sync market data.', 'error'); }
        finally { setIsSyncing(false); }
    };

    // ✅ ২. রান ব্যাকটেস্ট হ্যান্ডলার (আপডেটেড)
    const handleRunBacktest = async () => {
        setIsRunning(true);
        setBacktestResult(null);
        setProgress(0);

        // Optimization Mode Handling
        if (backtestMode === 'optimization') {
            setIsOptimizing(true);
            setOptimizationProgress(0);

            try {
                const payload = {
                    symbol: symbol,
                    timeframe: timeframe,
                    strategy: strategy,
                    initial_cash: initialCash,
                    start_date: startDate,
                    end_date: endDate,
                    params: optimizationParams, // Optimization Params
                    method: optimizationMethod === 'gridSearch' ? 'grid' : 'genetic',
                    population_size: gaParams.populationSize,
                    generations: gaParams.generations,
                    commission: commission,
                    slippage: slippage
                };

                const res = await runOptimizationApi(payload as any); // Type assertion if needed, or update interface
                const taskId = res.task_id;
                localStorage.setItem('activeOptimizationId', taskId);

                pollOptimizationStatus(taskId);
                showToast('Optimization Started!', 'success');

            } catch (error) {
                console.error(error);
                setIsOptimizing(false);
                showToast('Failed to start optimization.', 'error');
            } finally {
                setIsRunning(false);
            }
            return;
        }

        // Standard Backtest Mode
        try {
            let payloadSymbol = symbol;
            let payloadFile = null;

            // যদি CSV মোড হয়, তাহলে সিম্বল হিসেবে ফাইলের নাম পাঠাব
            if (dataSource === 'csv') {
                if (!uploadedDataFile) {
                    showToast('Please upload a CSV file first.', 'warning');
                    setIsRunning(false);
                    return;
                }
                payloadSymbol = `FILE: ${csvFileName}`; // রেজাল্টে এই নাম দেখাবে
                payloadFile = uploadedDataFile;
            }

            // API কল
            const initialRes = await runBacktestApi({
                symbol: payloadSymbol,
                timeframe: timeframe,
                strategy: strategy,
                initial_cash: initialCash,
                start_date: startDate,
                end_date: endDate,
                params: params, // আপনার প্যারামস স্টেট এখানে দিন
                custom_data_file: payloadFile // ✅ ফাইল নাম পাঠানো হচ্ছে
            });

            const taskId = initialRes.task_id;

            // পোলিং শুরু
            const interval = setInterval(async () => {
                try {
                    const statusRes = await getBacktestStatus(taskId);

                    if (statusRes.status === 'Processing') {
                        // ✅ এখানে পার্সেন্ট সেট করা হচ্ছে
                        // statusRes.percent ব্যাকএন্ড থেকে আসছে (0-100)
                        setProgress(statusRes.percent || 0);
                    } else if (statusRes.status === 'Completed') {
                        clearInterval(interval);
                        setBacktestResult(statusRes.result); // রেজাল্ট সেট করা
                        setSingleResult(statusRes.result); // For Chart
                        setIsRunning(false);
                        setProgress(100);
                        setShowResults(true);
                        showToast('Backtest Completed!', 'success');
                    } else if (statusRes.status === 'Failed') {
                        clearInterval(interval);
                        setIsRunning(false);
                        showToast(`Error: ${statusRes.error}`, 'error');
                    }
                } catch (e) {
                    clearInterval(interval);
                    setIsRunning(false);
                }
            }, 1000);

        } catch (error) {
            console.error(error);
            setIsRunning(false);
            showToast('Failed to start backtest.', 'error');
        }
    };

    const handleStopOptimization = async () => {
        const taskId = localStorage.getItem('activeOptimizationId');
        if (taskId) {
            try { await revokeBacktestTask(taskId); showToast('Optimization stopped by user.', 'warning'); }
            catch (error) { console.error("Error stopping task:", error); }
        }
        setIsOptimizing(false);
        setOptimizationProgress(0);
        localStorage.removeItem('activeOptimizationId');
    };

    const handleRunAllStrategies = () => {
        setIsBatchRunning(true);
        setShowResults(false);
        setBatchResults(null);
        setTimeout(() => {
            const allStrategies = MOCK_STRATEGIES.filter(s => s !== 'Custom ML Model');
            const newBatchResults = allStrategies.map((strategyName, index) => ({
                id: `${index + 1}`,
                market: 'BTC/USDT',
                strategy: strategyName,
                timeframe: '4h',
                date: new Date().toISOString().split('T')[0],
                profitPercent: (Math.random() * 150) - 25,
                maxDrawdown: Math.random() * 30,
                winRate: 40 + Math.random() * 50,
                sharpeRatio: Math.random() * 3,
                profit_percent: (Math.random() * 150) - 25,
            }));
            setBatchResults(newBatchResults as any);
            setIsBatchRunning(false);
            setShowResults(true);
        }, 1500);
    };

    // Replay Logic
    useEffect(() => {
        if (isPlaying) {
            replayIntervalRef.current = window.setInterval(() => {
                setReplayIndex(prev => {
                    if (prev < EQUITY_CURVE_DATA.length - 1) return prev + 1;
                    setIsPlaying(false);
                    return prev;
                });
            }, 1000 / replaySpeed);
        } else if (replayIntervalRef.current) clearInterval(replayIntervalRef.current);
        return () => { if (replayIntervalRef.current) clearInterval(replayIntervalRef.current); };
    }, [isPlaying, replaySpeed]);

    const handlePlayPause = () => {
        if (replayIndex >= EQUITY_CURVE_DATA.length - 1) setReplayIndex(0);
        setIsPlaying(!isPlaying);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) setFileName(e.target.files[0].name);
    };

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.[0]) return;
        const file = fileInputRef.current.files[0];
        setIsLoading(true);
        try {
            await uploadStrategyFile(file);
            const newStrategyName = file.name.replace(/\.[^/.]+$/, "");
            if (!customStrategies.includes(newStrategyName)) setCustomStrategies(prev => [...prev, newStrategyName]);
            setStrategy(newStrategyName);
            showToast(`Strategy "${newStrategyName}" uploaded!`, 'success');
            setFileName('');
        } catch (error) { console.error(error); showToast('Failed to upload strategy.', 'error'); }
        finally { setIsLoading(false); }
    };

    const inputBaseClasses = "w-full bg-white dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-md p-2 text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary";

    // --- Render Functions (Same as before, simplified calls) ---
    const renderSingleParams = () => {
        const activeParamsConfig = Object.keys(optimizableParams).length > 0 ? optimizableParams : MOCK_STRATEGY_PARAMS[strategy as keyof typeof MOCK_STRATEGY_PARAMS];
        if (!activeParamsConfig || Object.keys(activeParamsConfig).length === 0) return null;
        return (
            <div className="mt-6 pt-6 border-t border-brand-border-light dark:border-brand-border-dark animate-fade-in-down">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Strategy Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(activeParamsConfig).map(([key, config]: [string, any]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{config.label}</label>
                            <input type={config.type} value={params[key] || ''} onChange={(e) => handleParamChange(key, e.target.value)} className={inputBaseClasses} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderOptimizationParams = () => {
        const activeParamsConfig = Object.keys(optimizableParams).length > 0 ? optimizableParams : MOCK_STRATEGY_PARAMS[strategy as keyof typeof MOCK_STRATEGY_PARAMS];
        if (!activeParamsConfig || Object.keys(activeParamsConfig).length === 0) return null;
        return (
            <div className="mt-6 pt-6 border-t border-brand-border-light dark:border-brand-border-dark animate-fade-in-down">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Optimization Method</h3>
                    <div className="inline-flex bg-gray-100 dark:bg-brand-dark/50 rounded-lg p-1 space-x-1">
                        <button onClick={() => setOptimizationMethod('gridSearch')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${optimizationMethod === 'gridSearch' ? 'bg-white dark:bg-brand-dark shadow text-brand-primary' : 'text-gray-500'}`}>Grid Search</button>
                        <button onClick={() => setOptimizationMethod('geneticAlgorithm')} className={`px-3 py-1.5 text-xs font-semibold rounded-md ${optimizationMethod === 'geneticAlgorithm' ? 'bg-white dark:bg-brand-dark shadow text-brand-primary' : 'text-gray-500'}`}>Genetic Algorithm</button>
                    </div>
                </div>
                {optimizationMethod === 'gridSearch' ? (
                    Object.entries(activeParamsConfig).map(([key, config]: [string, any]) => (
                        <div key={key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-4">
                            <label className="md:col-span-1 block text-sm text-gray-500 pt-1.5">{config.label}</label>
                            <div className="md:col-span-3">{optimizationParams[key] && <RangeSliderInput config={config} value={optimizationParams[key]} onChange={(v) => handleOptimizationParamChange(key, v)} />}</div>
                        </div>
                    ))
                ) : (
                    <div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div><label className="block text-sm text-gray-500 mb-1">Pop. Size</label><input type="number" value={gaParams.populationSize} onChange={(e) => setGaParams(p => ({ ...p, populationSize: parseInt(e.target.value) }))} className={inputBaseClasses} /></div>
                            <div><label className="block text-sm text-gray-500 mb-1">Generations</label><input type="number" value={gaParams.generations} onChange={(e) => setGaParams(p => ({ ...p, generations: parseInt(e.target.value) }))} className={inputBaseClasses} /></div>
                        </div>
                        {Object.entries(activeParamsConfig).map(([key, config]: [string, any]) => (
                            <div key={key} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-4"><label className="md:col-span-1 block text-sm text-gray-500 pt-1.5">{config.label}</label><div className="md:col-span-3">{optimizationParams[key] && <RangeSliderInput config={config} value={optimizationParams[key]} onChange={(v) => handleOptimizationParamChange(key, v)} hideStepInput={true} />}</div></div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AIFoundryIcon className="text-brand-primary" />
                    Algo Backtester & AI Lab
                </h1>

                <div className="flex bg-gray-200 dark:bg-brand-dark p-1 rounded-lg">
                    <Button onClick={() => setIsDownloadModalOpen(true)} className="flex gap-2 mr-2" variant="secondary">
                        <Download size={16} /> Download Data
                    </Button>
                    <button
                        onClick={() => setActiveTab('backtest')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'backtest' ? 'bg-white dark:bg-brand-primary text-slate-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <PlayIcon /> Backtest Engine
                    </button>
                    <button
                        onClick={() => setActiveTab('editor')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'editor' ? 'bg-white dark:bg-brand-primary text-slate-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                    >
                        <CodeIcon /> AI Strategy Lab
                    </button>
                </div>
            </div>

            {/* TAB CONTENT: AI STRATEGY LAB */}
            {activeTab === 'editor' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Left: Idea Input */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="h-full flex flex-col">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <AIFoundryIcon className="text-purple-500" /> Idea to Strategy
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Describe your trading logic in plain English. AI will generate the Python code for you.
                            </p>
                            <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g. Buy when RSI(14) crosses above 30 and price is above SMA(200). Sell when RSI crosses below 70."
                                className="flex-1 w-full bg-gray-100 dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-lg p-4 text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary resize-none mb-4 min-h-[200px]"
                            />
                            <Button
                                onClick={handleAiGenerate}
                                disabled={isGenerating}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 border-none hover:opacity-90"
                            >
                                {isGenerating ? 'Generating...' : 'Generate Code'}
                            </Button>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upload Strategy</h2>
                            <div className="flex flex-col gap-3">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".py" />
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1">Choose File</Button>
                                    <Button onClick={handleUpload} disabled={!fileName}>Upload</Button>
                                </div>
                                <span className="text-xs text-center text-gray-400">{fileName || 'No file chosen'}</span>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Code Editor */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#1e1e1e] rounded-lg border border-gray-700 overflow-hidden h-[600px] flex flex-col">
                            <div className="bg-[#252526] px-4 py-2 border-b border-gray-700 flex justify-between items-center">
                                <span className="text-sm text-gray-300 font-mono flex items-center gap-2">
                                    <CodeIcon /> {strategy}.py
                                </span>
                                <Button size="sm" variant="outline" className="h-7 text-xs flex items-center gap-1 border-gray-600 text-gray-300">
                                    <SaveIcon /> Save
                                </Button>
                            </div>
                            <div className="flex-1 relative">
                                <CodeEditor
                                    value={currentStrategyCode}
                                    onChange={setCurrentStrategyCode}
                                    language="python"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: BACKTEST ENGINE */}
            {activeTab === 'backtest' && (
                <>
                    <Card className="staggered-fade-in" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Backtest Configuration</h2>

                            {/* ✅ Mode Switcher */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setBacktestMode('single')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${backtestMode === 'single' ? 'bg-white dark:bg-brand-primary text-slate-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    Single Backtest
                                </button>
                                <button
                                    onClick={() => setBacktestMode('optimization')}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${backtestMode === 'optimization' ? 'bg-white dark:bg-brand-primary text-slate-900 dark:text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                                >
                                    AI Optimization
                                </button>
                            </div>

                            <Button variant="secondary" onClick={handleSyncData} disabled={isSyncing}>
                                {isSyncing ? "Syncing..." : "☁ Sync Data"}
                            </Button>
                        </div>

                        {/* ✅ ডাটা সোর্স টগল */}
                        <div className="mb-6 border-b border-gray-200 pb-4">
                            <label className="text-sm font-semibold text-gray-500 mb-2 block">1. Select Data Source</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDataSource('database')}
                                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${dataSource === 'database' ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <span className="text-lg">🗄️</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">Exchange Database</div>
                                        <div className="text-xs text-gray-500">Sync from Binance/Bybit</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setDataSource('csv')}
                                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-all ${dataSource === 'csv' ? 'border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20' : 'border-gray-200 hover:bg-gray-50'}`}
                                >
                                    <span className="text-lg">📂</span>
                                    <div className="text-left">
                                        <div className="font-semibold text-sm">Upload CSV File</div>
                                        <div className="text-xs text-gray-500">Use your own data (OHLCV)</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            {/* ✅ কন্ডিশনাল রেন্ডারিং: ডাটাবেস মোড */}
                            {dataSource === 'database' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Exchange</label>
                                        <select className={inputBaseClasses} value={selectedExchange} onChange={(e) => setSelectedExchange(e.target.value)}>
                                            {exchanges.map(ex => <option key={ex} value={ex}>{ex.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <SearchableSelect label="Market Pair" options={markets} value={symbol} onChange={setSymbol} />
                                    </div>
                                </>
                            )}

                            {/* ✅ কন্ডিশনাল রেন্ডারিং: CSV মোড */}
                            {dataSource === 'csv' && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-500 mb-1">Upload Data File (CSV)</label>
                                    <div className="flex gap-2">
                                        <input type="file" ref={dataFileInputRef} onChange={handleDataFileUpload} className="hidden" accept=".csv" />
                                        <Button variant="outline" onClick={() => dataFileInputRef.current?.click()} className="w-full h-10 border-dashed border-2 flex items-center justify-center gap-2">
                                            <UploadCloud size={16} /> {isUploadingData ? 'Uploading...' : 'Choose CSV File'}
                                        </Button>
                                    </div>
                                    {csvFileName && <p className="text-xs text-green-600 mt-1">✅ Selected: {csvFileName}</p>}
                                </div>
                            )}

                            {/* কমন ফিল্ডস */}
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Timeframe</label>
                                <select className={inputBaseClasses} value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                                    {TIMEFRAME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* অন্যান্য প্যারামিটার */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Strategy</label>
                                <select className={inputBaseClasses} value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                                    <optgroup label="Standard"><option value="RSI Crossover">RSI Crossover</option></optgroup>
                                    {customStrategies.length > 0 && <optgroup label="Custom">{customStrategies.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                                <DatePicker selected={startDate ? new Date(startDate) : null} onChange={(date: Date | null) => setStartDate(date ? date.toISOString().split('T')[0] : '')} className={inputBaseClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                                <DatePicker selected={endDate ? new Date(endDate) : null} onChange={(date: Date | null) => setEndDate(date ? date.toISOString().split('T')[0] : '')} className={inputBaseClasses} />
                            </div>
                        </div>

                        {/* ✅ Execution Realism UI */}
                        <div className="mt-6 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Execution Realism (Fees & Slippage)
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Commission Input */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Trading Fee (Commission)
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={commission}
                                            onChange={(e) => setCommission(parseFloat(e.target.value))}
                                            className="w-full bg-white dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-l-md p-2 text-sm text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                        <span className="bg-gray-100 dark:bg-gray-800 border border-l-0 border-brand-border-light dark:border-brand-border-dark rounded-r-md px-3 py-2 text-xs text-gray-500">
                                            {(commission * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Slippage Input */}
                                <div className="relative">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Slippage Model
                                    </label>
                                    <div className="flex items-center">
                                        <input
                                            type="number"
                                            step="0.0001"
                                            value={slippage}
                                            onChange={(e) => setSlippage(parseFloat(e.target.value))}
                                            className="w-full bg-white dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-l-md p-2 text-sm text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary"
                                        />
                                        <span className="bg-gray-100 dark:bg-gray-800 border border-l-0 border-brand-border-light dark:border-brand-border-dark rounded-r-md px-3 py-2 text-xs text-gray-500">
                                            {(slippage * 100).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {backtestMode === 'single' ? renderSingleParams() : renderOptimizationParams()}

                        <div className="mt-8 pt-6 border-t border-brand-border-light dark:border-brand-border-dark flex items-center gap-4">
                            <Button onClick={handleRunBacktest} className="w-full md:w-auto" disabled={isContextLoading || isLoading || isSyncing || isOptimizing || isBatchRunning}>
                                {isContextLoading ? 'Processing...' : isOptimizing ? 'Optimizing...' : backtestMode === 'single' ? 'Run Backtest' : 'Run Optimization'}
                            </Button>
                            <Button variant="secondary" onClick={handleRunAllStrategies} disabled={isOptimizing || isBatchRunning}>
                                Run All Strategies
                            </Button>
                        </div>
                    </Card>

                    {/* SINGLE BACKTEST PROGRESS */}
                    {isRunning && (
                        <Card className="mt-6 border border-blue-500/20 bg-blue-500/5 animate-fade-in">
                            <div className="flex flex-col justify-center items-center py-12">
                                {/* Circular Loader */}
                                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>

                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Running Strategy...</h2>
                                <p className="text-blue-500 font-mono text-lg mt-2">{progress}% Completed</p>

                                {/* Linear Progress */}
                                <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* RESULTS SECTION */}
                    {isOptimizing && (
                        <Card className="mt-6 border border-brand-primary/20 bg-brand-primary/5">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold flex items-center gap-2">Optimization in Progress...</h2>
                                <Button variant="outline" className="text-red-500 border-red-500 h-8 px-3" onClick={handleStopOptimization}>Stop</Button>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 overflow-hidden relative">
                                <div className="bg-brand-primary h-4 rounded-full transition-all duration-500" style={{ width: `${optimizationProgress}%` }}></div>
                            </div>
                        </Card>
                    )}

                    {/* --- TRADINGVIEW STYLE RESULTS SECTION --- */}
                    {showResults && singleResult && !isOptimizing && (
                        <div className="animate-fade-in space-y-6 mt-6">

                            {/* A. Chart Section */}
                            {/* A. Main Chart Section */}
                            <div className="bg-[#131722] border border-[#2A2E39] rounded-lg overflow-hidden shadow-lg p-1">
                                {/* Main Price Chart */}
                                <div className="h-[450px]">
                                    <BacktestChart
                                        data={singleResult.candle_data}
                                        trades={singleResult.trades_log || []}
                                    />
                                </div>

                                {/* NEW: Underwater Drawdown Chart */}
                                <div className="h-[200px] border-t border-[#2A2E39] mt-1">
                                    <UnderwaterChart
                                        data={singleResult.underwater_data || calculateDrawdownFromCandles(singleResult.candle_data)}
                                        height={200}
                                    />
                                </div>
                            </div>

                            {/* B. Performance Summary Panel */}
                            <div className="bg-[#131722] border border-[#2A2E39] rounded-lg overflow-hidden shadow-lg">
                                {/* Header Tabs */}
                                <div className="flex border-b border-[#2A2E39] px-4 bg-[#1e222d]">
                                    <button className="px-4 py-3 text-sm font-medium text-[#2962FF] border-b-2 border-[#2962FF] hover:bg-[#2A2E39] transition-colors">
                                        Overview
                                    </button>
                                    <button className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-[#2A2E39] transition-colors">
                                        Performance Summary
                                    </button>
                                    <button className="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-[#2A2E39] transition-colors">
                                        List of Trades
                                    </button>
                                </div>

                                {/* Metrics Grid */}
                                <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">

                                    {/* 1. Net Profit */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Net Profit</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-xl font-bold font-mono ${singleResult.profitPercent && singleResult.profitPercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                                {singleResult.profitPercent && singleResult.profitPercent >= 0 ? '+' : ''}
                                                ${((singleResult.final_value || 0) - (singleResult.initial_cash || 10000)).toFixed(2)}
                                            </span>
                                            <span className={`text-xs ${singleResult.profitPercent && singleResult.profitPercent >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                                ({singleResult.profitPercent}%)
                                            </span>
                                        </div>
                                    </div>

                                    {/* 2. Total Trades */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Total Trades</span>
                                        <span className="text-xl font-bold text-gray-100 font-mono">
                                            {singleResult.total_trades}
                                        </span>
                                    </div>

                                    {/* 3. Percent Profitable */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Percent Profitable</span>
                                        <span className="text-xl font-bold text-gray-100 font-mono">
                                            {singleResult.winRate ? singleResult.winRate.toFixed(2) : singleResult.advanced_metrics?.win_rate?.toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* 4. Profit Factor */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Profit Factor</span>
                                        <span className="text-xl font-bold text-gray-100 font-mono">
                                            {singleResult.advanced_metrics?.profit_factor?.toFixed(2) || 'N/A'}
                                        </span>
                                    </div>

                                    {/* 5. Max Drawdown */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Max Drawdown</span>
                                        <span className="text-xl font-bold text-[#F23645] font-mono">
                                            {singleResult.maxDrawdown?.toFixed(2)}%
                                        </span>
                                    </div>

                                    {/* 6. Sharpe Ratio */}
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400 mb-1">Sharpe Ratio</span>
                                        <span className="text-xl font-bold text-[#2962FF] font-mono">
                                            {singleResult.sharpeRatio?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* C. Detailed Matrix & Trade Log */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                {/* Matrix Table */}
                                <div className="bg-[#131722] border border-[#2A2E39] rounded-lg overflow-hidden shadow-lg">
                                    <div className="px-6 py-4 border-b border-[#2A2E39] bg-[#1e222d] flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-[#2962FF]" />
                                        <h3 className="text-sm font-semibold text-gray-200">Key Metrics Matrix</h3>
                                    </div>
                                    <div className="p-0">
                                        <table className="w-full text-sm text-left">
                                            <tbody>
                                                {singleResult.advanced_metrics && Object.entries(singleResult.advanced_metrics).map(([key, value], index) => (
                                                    <tr key={key} className={`border-b border-[#2A2E39] last:border-0 ${index % 2 === 0 ? 'bg-[#1e222d]' : 'bg-[#131722]'}`}>
                                                        <td className="px-6 py-3 text-gray-400 capitalize font-medium">
                                                            {key.replace(/_/g, ' ')}
                                                        </td>
                                                        <td className="px-6 py-3 text-right text-gray-100 font-mono">
                                                            {(typeof value === 'number') ? value.toFixed(2) : value}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Trade Log Table */}
                                <div className="bg-[#131722] border border-[#2A2E39] rounded-lg overflow-hidden shadow-lg flex flex-col h-[400px]">
                                    <div className="px-6 py-4 border-b border-[#2A2E39] bg-[#1e222d] flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-[#2962FF]" />
                                        <h3 className="text-sm font-semibold text-gray-200">Trade List</h3>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-[#1e222d] text-gray-400 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-2 bg-[#1e222d]">Type</th>
                                                    <th className="px-4 py-2 bg-[#1e222d]">Price</th>
                                                    <th className="px-4 py-2 text-right bg-[#1e222d]">P/L</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {singleResult.trades_log?.map((trade: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-[#2A2E39] hover:bg-[#2A2E39] transition-colors">
                                                        <td className={`px-4 py-2 font-bold ${trade.side === 'BUY' ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                                            {trade.side || (trade.size > 0 ? 'BUY' : 'SELL')}
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-gray-300">
                                                            {trade.price?.toFixed(2)}
                                                        </td>
                                                        <td className={`px-4 py-2 text-right font-mono ${trade.pnl >= 0 ? 'text-[#089981]' : 'text-[#F23645]'}`}>
                                                            {trade.pnl ? trade.pnl.toFixed(2) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Batch/Optimization Results Table */}
                    {(batchResults || multiObjectiveResults) && (
                        <Card>
                            <h2 className="text-xl font-bold mb-6 text-purple-400">{batchResults ? 'Batch Results' : 'Optimization Report'}</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase">
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="px-4 py-3">Rank</th>
                                            <th className="px-4 py-3">Profit %</th>
                                            <th className="px-4 py-3">Sharpe Ratio</th>
                                            <th className="px-4 py-3">Max DD</th>
                                            <th className="px-4 py-3">Parameters</th>
                                            {multiObjectiveResults && <th className="px-4 py-3 text-center">Action</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {(batchResults || multiObjectiveResults)?.map((res: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-500">#{idx + 1}</td>
                                                <td className={`px-4 py-3 font-bold ${res.profitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>{res.profitPercent.toFixed(2)}%</td>
                                                <td className="px-4 py-3 font-mono">{res.sharpeRatio.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-red-500">-{res.maxDrawdown.toFixed(2)}%</td>
                                                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{JSON.stringify(res.params).replace(/"/g, '').replace(/{|}/g, '')}</td>
                                                {multiObjectiveResults && (
                                                    <td className="px-4 py-3 text-center"><Button size="sm" variant="outline" onClick={() => handleLoadParams(res.params)}>Load</Button></td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}


            {/* DOWNLOAD MODAL */}
            {/* ✅ DOWNLOAD MODAL */}
            {
                isDownloadModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <Card className="w-full max-w-md relative animate-fade-in">
                            <button
                                onClick={() => !isDownloading && setIsDownloadModalOpen(false)}
                                disabled={isDownloading}
                                className="absolute top-4 right-4 text-gray-500 hover:text-white disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>

                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Download className="text-brand-primary" /> Market Data Downloader
                            </h2>

                            <div className="space-y-4">
                                {/* Type Selection */}
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button onClick={() => setDownloadType('candles')} disabled={isDownloading} className={`flex-1 py-2 text-sm font-medium rounded transition-all ${downloadType === 'candles' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Candles (OHLCV)</button>
                                    <button onClick={() => setDownloadType('trades')} disabled={isDownloading} className={`flex-1 py-2 text-sm font-medium rounded transition-all ${downloadType === 'trades' ? 'bg-white shadow text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Trades (Tick Data)</button>
                                </div>

                                {/* Inputs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Exchange</label>
                                        <input value={dlExchange} onChange={(e) => setDlExchange(e.target.value)} disabled={isDownloading} className="w-full p-2 border rounded bg-transparent text-sm" placeholder="binance" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Symbol</label>
                                        <input value={dlSymbol} onChange={(e) => setDlSymbol(e.target.value)} disabled={isDownloading} className="w-full p-2 border rounded bg-transparent text-sm" placeholder="BTC/USDT" />
                                    </div>
                                </div>

                                {downloadType === 'candles' && (
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Timeframe</label>
                                        <select value={dlTimeframe} onChange={(e) => setDlTimeframe(e.target.value)} disabled={isDownloading} className="w-full p-2 border rounded bg-transparent text-sm">
                                            {TIMEFRAME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* ✅ এই অংশটি মিসিং ছিল: Start & End Date Inputs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                                        <input
                                            type="date"
                                            value={dlStartDate}
                                            onChange={(e) => setDlStartDate(e.target.value)}
                                            disabled={isDownloading}
                                            className="w-full p-2 border rounded bg-transparent text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 mb-1 block">End Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={dlEndDate}
                                            onChange={(e) => setDlEndDate(e.target.value)}
                                            disabled={isDownloading}
                                            className="w-full p-2 border rounded bg-transparent text-sm placeholder-gray-400"
                                        />
                                        {/* Till Now ব্যাজ */}
                                        {!dlEndDate && <span className="text-[10px] text-brand-primary absolute mt-[-28px] right-8 bg-white/80 px-1 rounded pointer-events-none">Till Now</span>}
                                    </div>
                                </div>
                                {/* ✅ ডেট ইনপুট অংশের শেষ */}

                                {/* Info Box */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md flex items-start gap-2">
                                    <AlertCircle size={16} className="text-blue-500 mt-0.5" />
                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                        {downloadType === 'trades'
                                            ? "Tick data files can be very large. Download supports auto-resume if stopped."
                                            : "Candle data is faster. Leave End Date empty to download up to the current moment."}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {isDownloading && (
                                <div className="space-y-2 pt-2 animate-fade-in">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-brand-primary animate-pulse">Downloading...</span>
                                        <span>{downloadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                                        <div className="bg-brand-primary h-2.5 rounded-full transition-all duration-300 relative" style={{ width: `${downloadProgress}%` }}>
                                            <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="pt-4 flex gap-3">
                                <Button variant="secondary" onClick={() => setIsDownloadModalOpen(false)} disabled={isDownloading} className="flex-1">
                                    Close
                                </Button>

                                {isDownloading ? (
                                    // ✅ STOP BUTTON
                                    <Button onClick={handleStopDownload} className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-red-500/20">
                                        ⏹ Stop Download
                                    </Button>
                                ) : (
                                    // ✅ START BUTTON
                                    <Button onClick={handleStartDownload} className="flex-1">
                                        Start Download
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div >
                )
            }
        </div >
    );
};

export default Backtester;
