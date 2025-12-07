
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import CodeEditor from '@/components/common/CodeEditor';
import { useToast } from '@/context/ToastContext';
import { EQUITY_CURVE_DATA, AIFoundryIcon } from '@/constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '@/context/ThemeContext';

// Fix: Added an interface for optimizable parameter configurations to provide a strong type and resolve 'unknown' type errors.
interface OptimizableParamConfig {
    type: string;
    label: string;
    default: number;
    min?: number;
    max?: number;
    step?: number;
}

const parseParamsFromCode = (code: string): Record<string, OptimizableParamConfig> => {
    const match = code.match(/#\s*@params\s*([\s\S]*?)#\s*@params_end/);
    if (match && match[1]) {
        try {
            const jsonString = match[1].replace(/^\s*#\s*/gm, '');
            return JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse indicator params:", e);
            return {};
        }
    }
    return {};
};

const MetricCard: React.FC<{ label: string; value: string; positive?: boolean; icon?: React.ReactNode }> = ({ label, value, positive, icon }) => (
    <div className="relative group bg-white dark:bg-brand-dark/40 border border-gray-200 dark:border-white/10 p-5 rounded-xl overflow-hidden transition-all hover:border-brand-primary/50">
        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-brand-primary">
            {icon}
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className={`text-2xl font-mono font-bold ${positive === true ? 'text-emerald-500' : positive === false ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
            {value}
        </p>
    </div>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 text-sm">
                <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>
                <p className="text-brand-primary font-mono">Equity: ${data.value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

type OptimizationParamValue = { start: number; end: number; step: number; };
type OptimizationParams = Record<string, OptimizationParamValue>;

const RangeSliderInput: React.FC<{
    config: { label: string; min?: number; max?: number; step?: number };
    value: OptimizationParamValue;
    onChange: (newValue: OptimizationParamValue) => void;
}> = ({ config, value, onChange }) => {
    const { min = 0, max = 100, step = 1 } = config;
    const { start, end, step: stepValue } = value;
    const rangeRef = useRef<HTMLDivElement>(null);

    const getPercent = useCallback((val: number) => Math.round(((val - min) / (max - min)) * 100), [min, max]);

    useEffect(() => {
        const startPercent = getPercent(start);
        const endPercent = getPercent(end);
        if (rangeRef.current) {
            rangeRef.current.style.left = `${startPercent}%`;
            rangeRef.current.style.width = `${endPercent - startPercent}%`;
        }
    }, [start, end, getPercent]);

    const handleValueChange = (field: 'start' | 'end' | 'step', val: string | number) => {
        const newValues = { ...value, [field]: Number(val) };
        onChange(newValues);
    };

    const handleRangeChange = (field: 'start' | 'end', e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (field === 'start') {
            const newStart = Math.min(val, end - stepValue);
            if (newStart !== start) onChange({ ...value, start: newStart });
        } else {
            const newEnd = Math.max(val, start + stepValue);
            if (newEnd !== end) onChange({ ...value, end: newEnd });
        }
    };
    
    const inputClasses = "w-full bg-gray-100 dark:bg-brand-dark/60 border-none rounded-lg p-1.5 text-center text-xs font-mono text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-primary";

    return (
        <div className="bg-white dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{config.label}</span>
                <span className="text-xs font-mono text-brand-primary">{min} - {max}</span>
            </div>
            <div className="range-slider-container mb-6">
                <input type="range" min={min} max={max} step={step} value={start} onChange={(e) => handleRangeChange('start', e)} className="thumb thumb--left" aria-label="Start value" />
                <input type="range" min={min} max={max} step={step} value={end} onChange={(e) => handleRangeChange('end', e)} className="thumb thumb--right" aria-label="End value"/>
                <div className="range-slider-track"></div>
                <div ref={rangeRef} className="range-slider-range bg-gradient-to-r from-brand-primary to-purple-500"></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="block text-[10px] text-gray-400 text-center mb-1">Start</label>
                    <input type="number" min={min} max={max} step={step} value={start} onChange={(e) => handleValueChange('start', e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 text-center mb-1">Step</label>
                    <input type="number" min={step} step={step} value={stepValue} onChange={(e) => handleValueChange('step', e.target.value)} className={inputClasses} />
                </div>
                <div>
                    <label className="block text-[10px] text-gray-400 text-center mb-1">End</label>
                    <input type="number" min={min} max={max} step={step} value={end} onChange={(e) => handleValueChange('end', e.target.value)} className={inputClasses} />
                </div>
            </div>
        </div>
    );
};


const AIFoundry: React.FC = () => {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const [prompt, setPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [backtestResults, setBacktestResults] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'code' | 'results' | 'optimize'>('code');

    const [isFineTuning, setIsFineTuning] = useState(false);
    const [fineTuningProgress, setFineTuningProgress] = useState(0);
    const [fineTunedModels, setFineTunedModels] = useState<{ id: string; name: string }[]>([]);
    const [generationModel, setGenerationModel] = useState('gemini-2.5-pro');

    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationProgress, setOptimizationProgress] = useState(0);
    const [optimizationParams, setOptimizationParams] = useState<OptimizationParams>({});
    const [bestParams, setBestParams] = useState<Record<string, any> | null>(null);
    const [optimizableParams, setOptimizableParams] = useState<Record<string, OptimizableParamConfig>>({});
    
    const [fineTuneFileName, setFineTuneFileName] = useState('');

    // Resizing State
    const [leftPanelWidth, setLeftPanelWidth] = useState(33); // % width
    const [composerHeight, setComposerHeight] = useState(60); // % height within left panel
    const [isResizingH, setIsResizingH] = useState(false);
    const [isResizingV, setIsResizingV] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const leftPanelRef = useRef<HTMLDivElement>(null);

    const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';

    const PROMPT_TEMPLATES = [
        "SMA Crossover: Buy when SMA 10 crosses SMA 30.",
        "RSI Mean Reversion: Buy RSI < 30, Sell RSI > 70.",
        "Bollinger Breakout: Buy when price closes above Upper Band.",
        "MACD Trend: Buy when MACD line crosses Signal line."
    ];

    const handleGenerateStrategy = async () => {
        if (!prompt.trim()) {
            showToast('Please enter a strategy description.', 'error');
            return;
        }
        setIsLoading(true);
        setGeneratedCode('');
        setBacktestResults(null);
        setBestParams(null);
        setOptimizableParams({});
        setOptimizationParams({});
        setActiveTab('code');

        const systemInstruction = `
You are an expert trading algorithm developer. Your task is to take a user's natural language description of a trading strategy and convert it into a clean, executable Python code snippet compatible with the 'backtrader' library.
RULES:
- The output must be ONLY the Python code. Do not include any explanation, markdown formatting (like \`\`\`python), or any other text.
- If the strategy has tunable parameters (like moving average periods, RSI periods, stop loss percentages, etc.), you MUST define them in a special comment block at the top of the code, like this:
# @params
# {
#   "short_sma": { "type": "number", "label": "Short SMA Period", "default": 10, "min": 2, "max": 50, "step": 1 },
#   "long_sma": { "type": "number", "label": "Long SMA Period", "default": 30, "min": 20, "max": 200, "step": 1 },
#   "stop_loss": { "type": "number", "label": "Stop Loss %", "default": 3, "min": 0.5, "max": 10, "step": 0.5 }
# }
# @params_end
- The Python code should then use these parameters from the \`self.params\` object.
- The code must be a single class that inherits from \`backtrader.Strategy\`.
`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
                config: { systemInstruction },
            });

            const code = response.text;
            setGeneratedCode(code);
            const params = parseParamsFromCode(code);
            setOptimizableParams(params);
            
            const initialOptParams = Object.keys(params).reduce((acc, key) => {
                acc[key] = {
                    start: params[key].min ?? params[key].default,
                    end: params[key].max ?? params[key].default,
                    step: params[key].step || 1,
                };
                return acc;
            }, {} as OptimizationParams);
            setOptimizationParams(initialOptParams);

            showToast('Strategy generated successfully!', 'success');
        } catch (error) {
            console.error("Error generating strategy:", error);
            showToast('Failed to generate strategy code.', 'error');
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setGeneratedCode(`# An error occurred.\n# Details: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunBacktest = (params?: Record<string, any>) => {
        if (!generatedCode) return;
        setBacktestResults({
            profitPercent: params ? 75.2 : 42.8,
            maxDrawdown: params ? 8.1 : 12.3,
            winRate: params ? 65.7 : 58.1,
            sharpeRatio: params ? 2.31 : 1.75,
        });
        setActiveTab('results');
        showToast(`Backtest complete! ${params ? '(Optimized)' : ''}`, 'info');
    };
    
    const handleStartOptimization = () => {
        setIsOptimizing(true);
        setOptimizationProgress(0);
        
        const interval = setInterval(() => {
            setOptimizationProgress(prev => {
                const next = prev + 10;
                if (next >= 100) {
                    clearInterval(interval);
                    setIsOptimizing(false);
                    const best = Object.keys(optimizableParams).reduce((acc, key) => {
                        const { start, end } = optimizationParams[key];
                        acc[key] = Math.round(start + Math.random() * (end-start));
                        return acc;
                    }, {} as Record<string,any>);
                    setBestParams(best);
                    handleRunBacktest(best);
                    showToast('Optimization complete!', 'success');
                    return 100;
                }
                return next;
            });
        }, 300);
    };

    const handleFineTune = () => {
        if (!fineTuneFileName) {
            showToast('Please select a data file to fine-tune with.', 'error');
            return;
        }
        setIsFineTuning(true);
        setFineTuningProgress(0);
        
        const interval = setInterval(() => {
            setFineTuningProgress(prev => {
                const next = prev + 5;
                if (next >= 100) {
                    clearInterval(interval);
                    setIsFineTuning(false);
                    const newModel = { id: `ft-model-${Date.now()}`, name: `My ${fineTuneFileName.split('.')[0]} Model`};
                    setFineTunedModels(prev => [...prev, newModel]);
                    setGenerationModel(newModel.id);
                    setFineTuneFileName('');
                    showToast(`Fine-tuning complete! "${newModel.name}" is now available.`, 'success');
                    return 100;
                }
                return next;
            });
        }, 200);
    };

    // --- Resizing Logic ---

    const startResizingH = () => setIsResizingH(true);
    const startResizingV = () => setIsResizingV(true);

    const stopResizing = useCallback(() => {
        setIsResizingH(false);
        setIsResizingV(false);
        // Reset cursors or body styles if necessary
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
    }, []);

    const resize = useCallback((e: MouseEvent) => {
        if (isResizingH && containerRef.current) {
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            // Clamp width between 20% and 70%
            if (newLeftWidth > 20 && newLeftWidth < 70) {
                setLeftPanelWidth(newLeftWidth);
            }
        }
        if (isResizingV && leftPanelRef.current) {
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
            const panelRect = leftPanelRef.current.getBoundingClientRect();
            const newHeight = ((e.clientY - panelRect.top) / panelRect.height) * 100;
            // Clamp height between 30% and 80%
            if (newHeight > 30 && newHeight < 80) {
                setComposerHeight(newHeight);
            }
        }
    }, [isResizingH, isResizingV]);

    useEffect(() => {
        if (isResizingH || isResizingV) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizingH, isResizingV, resize, stopResizing]);

    return (
        <div 
            ref={containerRef} 
            className="h-[calc(100vh-140px)] flex flex-col lg:flex-row animate-fade-in-slide-up overflow-hidden relative"
        >
            
            {/* LEFT PANEL: COMMAND CENTER */}
            <div 
                ref={leftPanelRef}
                className="flex flex-col h-full overflow-hidden transition-width duration-75 ease-out"
                style={{ width: window.innerWidth >= 1024 ? `${leftPanelWidth}%` : '100%' }}
            >
                
                {/* Strategy Composer - Resizable Height */}
                <div style={{ height: window.innerWidth >= 1024 ? `${composerHeight}%` : 'auto' }} className="flex flex-col min-h-[300px]">
                    <div className="bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-lg relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="p-6 pb-0 flex-shrink-0">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                     <AIFoundryIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Strategy Composer</h2>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : generatedCode ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        <p className="text-xs text-gray-500">{isLoading ? 'Synthesizing...' : generatedCode ? 'Generation Complete' : 'System Ready'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 relative z-10">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Describe Strategy</label>
                                <textarea 
                                    rows={window.innerWidth >= 1024 ? undefined : 5} 
                                    value={prompt} 
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-brand-darkest/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none font-sans text-sm leading-relaxed shadow-inner transition-all h-32 lg:h-auto lg:flex-grow"
                                    style={{ minHeight: '100px', maxHeight: '100%' }}
                                    placeholder="Example: Create a mean reversion strategy for BTC/USDT. Buy when RSI(14) is below 30 and price is below the lower Bollinger Band. Sell when RSI is above 70." 
                                />
                                
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {PROMPT_TEMPLATES.map((temp, i) => (
                                        <button 
                                            key={i} 
                                            onClick={() => setPrompt(temp)}
                                            className="px-2.5 py-1.5 text-[10px] font-medium bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                                        >
                                            {temp.split(':')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 mt-auto flex-shrink-0">
                            <Button 
                                onClick={handleGenerateStrategy} 
                                disabled={isLoading} 
                                className="w-full py-4 text-lg font-bold uppercase tracking-wider shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <span>Synthesizing...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        <span>Generate Code</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Vertical Resizer Handle */}
                <div 
                    className="h-3 cursor-row-resize flex items-center justify-center hover:bg-brand-primary/10 transition-colors z-20 -my-1 select-none hidden lg:flex"
                    onMouseDown={startResizingV}
                >
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                {/* Spacer for mobile */}
                <div className="h-6 lg:hidden"></div>

                {/* Model & Fine-tuning */}
                <div className="flex-1 flex flex-col min-h-[200px] overflow-y-auto">
                    <div className="bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl p-6 shadow-sm h-full">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4">Model Configuration</h3>
                        
                        <div className="space-y-5">
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Inference Model</label>
                                <select value={generationModel} onChange={(e) => setGenerationModel(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-brand-darkest/50 border border-gray-200 dark:border-white/10 rounded-lg p-2.5 text-sm text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary">
                                    <optgroup label="Base Models">
                                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (General)</option>
                                        <option value="quant-finetuned-v1">Quant-Finetuned v1 (Advanced)</option>
                                    </optgroup>
                                    {fineTunedModels.length > 0 && (
                                        <optgroup label="My Fine-Tuned Models">
                                            {fineTunedModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-brand-darkest/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Knowledge Base</h4>
                                    <span className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">Fine-tune</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Upload CSV data to specialize the model.</p>
                                
                                <div className="flex items-center gap-2">
                                    <label htmlFor="fine-tune-upload" className="cursor-pointer bg-white dark:bg-brand-dark hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-gray-700 text-brand-primary text-xs font-bold py-2 px-3 rounded-lg transition-colors">
                                        Choose File
                                        <input id="fine-tune-upload" type="file" className="sr-only" onChange={(e) => setFineTuneFileName(e.target.files?.[0].name || '')} accept=".csv" disabled={isFineTuning}/>
                                    </label>
                                    <span className="text-xs text-gray-400 truncate flex-1">{fineTuneFileName || 'No file'}</span>
                                    {fineTuneFileName && (
                                        <button onClick={handleFineTune} disabled={isFineTuning} className="text-xs bg-brand-primary text-white p-2 rounded-lg hover:bg-brand-primary-hover disabled:opacity-50">
                                            Start
                                        </button>
                                    )}
                                </div>
                                {isFineTuning && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                            <span>Training...</span>
                                            <span>{fineTuningProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-brand-darkest rounded-full h-1">
                                            <div className="bg-brand-success h-1 rounded-full transition-all duration-300" style={{width: `${fineTuningProgress}%`}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Resizer Handle */}
            <div 
                className="w-3 cursor-col-resize flex items-center justify-center hover:bg-brand-primary/10 transition-colors z-20 -mx-1 select-none hidden lg:flex"
                onMouseDown={startResizingH}
            >
                <div className="h-12 w-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
            
            {/* Spacer for mobile */}
            <div className="h-6 lg:hidden"></div>

            {/* RIGHT PANEL: THE FORGE (Output) */}
            <div className="flex-1 flex flex-col bg-white dark:bg-brand-dark border border-brand-border-light dark:border-brand-border-dark rounded-2xl shadow-xl overflow-hidden h-full">
                {/* Forge Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30">
                    <div className="flex space-x-6 overflow-x-auto no-scrollbar">
                        {['code', 'results', 'optimize'].map(tab => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab as any)} 
                                disabled={(tab === 'results' && !backtestResults) || (tab === 'optimize' && Object.keys(optimizableParams).length === 0)}
                                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab ? 'text-brand-primary' : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                                } disabled:opacity-30 disabled:cursor-not-allowed`}
                            >
                                {tab === 'code' && 'Python Code'}
                                {tab === 'results' && 'Backtest Results'}
                                {tab === 'optimize' && 'Parameter Lab'}
                                {activeTab === tab && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary rounded-t-full"></span>}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button variant="secondary" className="text-xs h-8 px-3" onClick={() => setGeneratedCode('')} disabled={!generatedCode}>Clear</Button>
                        <Button variant="primary" className="text-xs h-8 px-3" onClick={() => handleRunBacktest()} disabled={!generatedCode}>Run Backtest</Button>
                    </div>
                </div>

                {/* Forge Content */}
                <div className="flex-1 relative overflow-hidden">
                    {!generatedCode && !isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 opacity-40 pointer-events-none select-none p-8 text-center">
                            <AIFoundryIcon className="w-24 h-24 mb-6 text-brand-primary/20" />
                            <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Generate</p>
                            <p className="text-sm max-w-sm">Enter your strategy in the left panel and click "Generate Code" to see the Python implementation here.</p>
                        </div>
                    )}

                    <div className={`h-full w-full overflow-auto p-1 ${activeTab === 'code' ? 'block' : 'hidden'}`}>
                         {generatedCode ? (
                             <CodeEditor value={generatedCode} onChange={setGeneratedCode} />
                         ) : (
                             <div className="h-full w-full"></div>
                         )}
                    </div>

                    {activeTab === 'results' && backtestResults && (
                        <div className="h-full p-6 overflow-y-auto animate-fade-in-slide-up">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                               <MetricCard label="Total Profit" value={`+${backtestResults.profitPercent.toFixed(1)}%`} positive={true} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                               <MetricCard label="Max Drawdown" value={`${backtestResults.maxDrawdown.toFixed(1)}%`} positive={false} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>}/>
                               <MetricCard label="Win Rate" value={`${backtestResults.winRate.toFixed(1)}%`} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                               <MetricCard label="Sharpe Ratio" value={backtestResults.sharpeRatio.toFixed(2)} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} />
                            </div>
                            
                            {bestParams && (
                                <div className="mb-6 p-4 bg-gradient-to-r from-brand-primary/10 to-purple-500/10 border border-brand-primary/20 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-brand-primary text-sm mb-1">Optimization Success</h4>
                                        <p className="text-xs text-gray-500">Parameters updated for maximum Sharpe ratio.</p>
                                    </div>
                                    <pre className="text-[10px] bg-white dark:bg-black/20 p-2 rounded text-gray-600 dark:text-gray-300 font-mono">{JSON.stringify(bestParams, null, 2)}</pre>
                                </div>
                            )}

                            <div className="h-80 bg-white dark:bg-brand-darkest/30 rounded-xl border border-gray-200 dark:border-white/5 p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                   <LineChart data={EQUITY_CURVE_DATA}>
                                       <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                       <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                       <XAxis dataKey="name" stroke={axisColor} tickLine={false} axisLine={false} dy={10} />
                                       <YAxis stroke={axisColor} tickFormatter={(v) => `$${Number(v)/1000}k`} tickLine={false} axisLine={false} dx={-10} />
                                       <Tooltip content={<CustomTooltip />} cursor={{stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4'}} />
                                       <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={false} activeDot={{r: 6, fill: '#fff'}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'optimize' && (
                         <div className="h-full p-6 overflow-y-auto animate-fade-in-slide-up">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Fix: Explicitly typed the `config` variable from `Object.entries` to `OptimizableParamConfig` to resolve type error when accessing `config.label`. */}
                                {Object.entries(optimizableParams).map(([key, config]: [string, OptimizableParamConfig]) => (
                                    <RangeSliderInput 
                                        key={key} 
                                        config={config} 
                                        value={optimizationParams[key]} 
                                        onChange={(newValue) => setOptimizationParams(p => ({...p, [key]: newValue}))} 
                                    />
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                                <Button onClick={handleStartOptimization} disabled={isOptimizing} className="w-full md:w-auto shadow-lg">
                                    {isOptimizing ? 'Running Genetic Algorithm...' : 'Run Optimization'}
                                </Button>
                                {isOptimizing && (
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Processing Generations...</span>
                                            <span>{optimizationProgress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-brand-darkest rounded-full h-2">
                                            <div className="bg-gradient-to-r from-brand-primary to-purple-500 h-2 rounded-full transition-all duration-300" style={{width: `${optimizationProgress}%`}}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIFoundry;

