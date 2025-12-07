
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MOCK_INDICATOR_CODE, ExpandIcon, CollapseIcon, PlayIcon } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import CodeEditor from '@/components/common/CodeEditor';
import type { SavedIndicator } from '@/types';
import { useToast } from '@/context/ToastContext';

// Additional Icons
const CodeIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
);
const SlidersIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
);
const FolderIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
);
const SaveIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

const parseParamsFromCode = (code: string): Record<string, any> => {
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

const CustomIndicatorStudio: React.FC = () => {
    const { theme } = useTheme();
    const { showToast } = useToast();

    const [savedIndicators, setSavedIndicators] = useState<SavedIndicator[]>(() => {
        try {
            const saved = localStorage.getItem('customIndicators');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading saved indicators from localStorage:', error);
            return [];
        }
    });
    
    useEffect(() => {
        try {
            localStorage.setItem('customIndicators', JSON.stringify(savedIndicators));
        } catch (error) {
            console.error('Error saving indicators to localStorage:', error);
        }
    }, [savedIndicators]);

    const [code, setCode] = useState<string>(MOCK_INDICATOR_CODE['SMA']);
    const [loadedIndicatorType, setLoadedIndicatorType] = useState<'SMA' | 'RSI' | 'MACD' | 'BB'>('SMA');
    const [indicatorName, setIndicatorName] = useState('');
    
    const [indicatorParams, setIndicatorParams] = useState<Record<string, any>>({});
    const [paramValues, setParamValues] = useState<Record<string, number>>({});
    const [activeStudyConfig, setActiveStudyConfig] = useState<any>(null);

    // Studio State
    const [activeTab, setActiveTab] = useState<'editor' | 'config' | 'library'>('editor');
    const [isResizing, setIsResizing] = useState(false);
    const [topPaneHeight, setTopPaneHeight] = useState(60);
    const splitPaneRef = useRef<HTMLDivElement>(null);
    
    const [isChartFullScreen, setIsChartFullScreen] = useState(false);
    const [widgetKey, setWidgetKey] = useState(Date.now());

    useEffect(() => {
        if (isChartFullScreen) {
            document.body.classList.add('body-no-scroll');
        } else {
            document.body.classList.remove('body-no-scroll');
        }
        return () => document.body.classList.remove('body-no-scroll');
    }, [isChartFullScreen]);

    const toggleFullScreen = () => {
        setIsChartFullScreen(prev => !prev);
        setWidgetKey(Date.now());
    };

    useEffect(() => {
        const params = parseParamsFromCode(code);
        setIndicatorParams(params);
        const defaultValues: Record<string, number> = {};
        for (const key in params) {
            if (params[key].default !== undefined) {
                defaultValues[key] = params[key].default;
            }
        }
        setParamValues(defaultValues);
    }, [code]);

    useEffect(() => {
        const createWidget = () => {
            const containerId = isChartFullScreen ? `indicator_chart_fullscreen_${widgetKey}` : `indicator_chart_container_${widgetKey}`;
            const container = document.getElementById(containerId);
            if (!container) return;
            
            container.innerHTML = '';
            
            const widgetOptions: any = {
                symbol: 'BINANCE:BTCUSDT',
                interval: '60',
                autosize: true,
                container_id: containerId,
                theme: theme === 'dark' ? 'Dark' : 'Light',
                style: '1',
                locale: 'en',
                toolbar_bg: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                enable_publishing: false,
                hide_side_toolbar: false,
                allow_symbol_change: true,
                save_image: false,
            };

            if (activeStudyConfig) {
                widgetOptions.studies = [activeStudyConfig.id];
                widgetOptions.studies_overrides = activeStudyConfig.overrides;
            }
            
            new window.TradingView.widget(widgetOptions);
        };

        const checkLibraryAndCreate = () => {
            if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) {
                createWidget();
            } else {
                setTimeout(checkLibraryAndCreate, 100);
            }
        }
        
        checkLibraryAndCreate();

    }, [theme, activeStudyConfig, isChartFullScreen, widgetKey]);
    
    const handleRunScript = () => {
        let studyConfig = null;
        const overrides: Record<string, any> = {};

        // Map paramValues to overrides based on type
        if (loadedIndicatorType === 'SMA') {
             overrides['moving average.length'] = paramValues['period'] || 20;
        } else if (loadedIndicatorType === 'RSI') {
             overrides['relative strength index.length'] = paramValues['period'] || 14;
        } else if (loadedIndicatorType === 'MACD') {
             overrides['fast length'] = paramValues['fast_period'] || 12;
             overrides['slow length'] = paramValues['slow_period'] || 26;
             overrides['signal length'] = paramValues['signal_period'] || 9;
        } else if (loadedIndicatorType === 'BB') {
             overrides['length'] = paramValues['period'] || 20;
             overrides['StdDev'] = paramValues['std_dev'] || 2;
        }

        switch (loadedIndicatorType) {
            case 'SMA': studyConfig = { id: 'MASimple@tv-basicstudies', overrides }; break;
            case 'RSI': studyConfig = { id: 'RSI@tv-basicstudies', overrides }; break;
            case 'MACD': studyConfig = { id: 'MACD@tv-basicstudies', overrides }; break;
            case 'BB': studyConfig = { id: 'BollingerBands@tv-basicstudies', overrides }; break;
        }
        setActiveStudyConfig(studyConfig);
        showToast('Script Compiled & Applied', 'success');
    };

    const handleClearPlot = () => {
        setActiveStudyConfig(null);
    };
    
    const handleLoadPreset = (key: string) => {
        const templateTypeMap: Record<string, 'SMA' | 'RSI' | 'MACD' | 'BB'> = {
            'SMA': 'SMA', 'RSI': 'RSI', 'MACD': 'MACD', 'Bollinger Bands': 'BB',
        };

        if (key in MOCK_INDICATOR_CODE) {
            setCode(MOCK_INDICATOR_CODE[key as keyof typeof MOCK_INDICATOR_CODE]);
            setLoadedIndicatorType(templateTypeMap[key]);
            setIndicatorName(`My ${key}`);
            setActiveStudyConfig(null);
            setActiveTab('editor');
            showToast(`Loaded template: ${key}`, 'info');
        }
    };

    const handleLoadSaved = (indicator: SavedIndicator) => {
        setCode(indicator.code);
        setLoadedIndicatorType(indicator.baseType);
        setIndicatorName(indicator.name);
        setActiveStudyConfig(null);
        setActiveTab('editor');
        showToast(`Loaded saved indicator: ${indicator.name}`, 'info');
    };

    const handleDeleteSaved = (name: string) => {
        setSavedIndicators(prev => prev.filter(i => i.name !== name));
        showToast('Indicator deleted', 'info');
    };
    
    const handleSaveIndicator = () => {
        if (!indicatorName.trim()) {
            showToast('Please enter an indicator name.', 'error');
            return;
        }
        // Allow overwriting or new save
        const newIndicator: SavedIndicator = {
            name: indicatorName.trim(),
            code,
            baseType: loadedIndicatorType,
        };
        
        setSavedIndicators(prev => {
            const exists = prev.some(i => i.name === newIndicator.name);
            if (exists) {
                return prev.map(i => i.name === newIndicator.name ? newIndicator : i);
            }
            return [...prev, newIndicator];
        });
        
        showToast(`Indicator "${newIndicator.name}" saved!`, 'success');
    };

    const handleParamChange = (key: string, value: number) => {
        setParamValues(prev => ({ ...prev, [key]: value }));
    };

    // Resizing logic
    const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); };
    const handleMouseUp = useCallback(() => { setIsResizing(false); }, []);
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing && splitPaneRef.current) {
            const bounds = splitPaneRef.current.getBoundingClientRect();
            const newHeight = ((e.clientY - bounds.top) / bounds.height) * 100;
            if (newHeight > 30 && newHeight < 85) {
                setTopPaneHeight(newHeight);
            }
        }
    }, [isResizing]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return (
        <div ref={splitPaneRef} className="flex flex-col h-[calc(100vh-140px)] relative overflow-hidden bg-gray-100 dark:bg-[#0F172A] rounded-2xl border border-brand-border-light dark:border-brand-border-dark shadow-2xl">
            {isResizing && <div className="absolute inset-0 z-50 cursor-row-resize" />}

            {/* Top Pane: Chart */}
            <div className="min-h-0 relative group transition-all ease-out duration-75" style={{ height: `${topPaneHeight}%` }}>
                <div className="absolute inset-0 bg-white dark:bg-brand-dark">
                    <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                         <button 
                            onClick={toggleFullScreen} 
                            className="p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-brand-primary transition-colors shadow-lg"
                            title={isChartFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            <ExpandIcon />
                        </button>
                    </div>
                    
                    {/* Compilation Status Overlay (Visual Mock) */}
                    {activeStudyConfig && (
                        <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-full flex items-center gap-2 text-xs font-bold text-emerald-500 animate-fade-in-right">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            LIVE SCRIPT ACTIVE
                        </div>
                    )}

                    <div className="w-full h-full" id={`indicator_chart_container_${widgetKey}`}></div>
                </div>
            </div>

            {/* Resizer Bar */}
            <div 
                className="h-3 cursor-row-resize flex items-center justify-center bg-gray-200 dark:bg-[#0B1120] border-y border-gray-300 dark:border-white/10 hover:bg-brand-primary/10 transition-colors z-10"
                onMouseDown={handleMouseDown}
            >
                <div className="w-16 h-1 rounded-full bg-gray-400 dark:bg-gray-600"></div>
            </div>

            {/* Bottom Pane: Studio */}
            <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-[#0B1120] relative">
                
                {/* Studio Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0B1120]">
                    <div className="flex gap-1 bg-gray-200 dark:bg-white/5 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'editor' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                        >
                            <CodeIcon className="w-4 h-4" /> Editor
                        </button>
                        <button 
                            onClick={() => setActiveTab('config')}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'config' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                        >
                            <SlidersIcon className="w-4 h-4" /> Config
                        </button>
                        <button 
                            onClick={() => setActiveTab('library')}
                            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === 'library' ? 'bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'}`}
                        >
                            <FolderIcon className="w-4 h-4" /> Library
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-1.5 border border-transparent focus-within:border-brand-primary/50 transition-all">
                            <input 
                                type="text" 
                                value={indicatorName} 
                                onChange={(e) => setIndicatorName(e.target.value)} 
                                placeholder="Script Name..."
                                className="bg-transparent text-xs text-slate-900 dark:text-white outline-none w-32 placeholder-gray-500"
                            />
                            <button onClick={handleSaveIndicator} className="ml-2 text-gray-400 hover:text-brand-primary"><SaveIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="h-6 w-px bg-gray-300 dark:bg-white/10"></div>
                        <Button size="sm" variant="secondary" onClick={handleClearPlot} className="text-xs h-8" disabled={!activeStudyConfig}>Clear</Button>
                        <Button size="sm" variant="primary" onClick={handleRunScript} className="text-xs h-8 flex items-center gap-2 shadow-lg shadow-brand-primary/20">
                            <PlayIcon className="w-3 h-3" /> Run Script
                        </Button>
                    </div>
                </div>

                {/* Studio Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {/* Editor Tab */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <CodeEditor value={code} onChange={setCode} />
                    </div>

                    {/* Config Tab */}
                    <div className={`absolute inset-0 overflow-y-auto p-6 transition-opacity duration-300 ${activeTab === 'config' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <div className="max-w-2xl mx-auto">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Runtime Parameters</h3>
                            <p className="text-xs text-gray-500 mb-6">Adjust values to see real-time changes when you re-compile.</p>
                            
                            {Object.keys(indicatorParams).length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {Object.entries(indicatorParams).map(([key, config]: [string, any]) => (
                                        <div key={key} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">{config.label}</label>
                                                <span className="text-xs font-mono bg-white dark:bg-black/40 px-2 py-1 rounded text-brand-primary font-bold">{paramValues[key]}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={config.min}
                                                max={config.max}
                                                step={config.step}
                                                value={paramValues[key] || config.default}
                                                onChange={(e) => handleParamChange(key, Number(e.target.value))}
                                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb accent-brand-primary"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                                                <span>{config.min}</span>
                                                <span>{config.max}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
                                    <p className="text-gray-500 text-sm">No configurable parameters found.</p>
                                    <p className="text-xs text-gray-400 mt-1">Add <code className="bg-gray-100 dark:bg-white/10 px-1 rounded"># @params</code> block to your code.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Library Tab */}
                    <div className={`absolute inset-0 overflow-y-auto p-6 transition-opacity duration-300 ${activeTab === 'library' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Indicator Library</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Templates */}
                            {Object.keys(MOCK_INDICATOR_CODE).map(key => (
                                <div key={key} onClick={() => handleLoadPreset(key)} className="group cursor-pointer bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl hover:border-brand-primary/50 hover:bg-gray-50 dark:hover:bg-white/10 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary group-hover:scale-110 transition-transform">
                                            <CodeIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-black/40 px-2 py-0.5 rounded">Template</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{key}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Standard implementation.</p>
                                </div>
                            ))}

                            {/* Saved */}
                            {savedIndicators.map((ind, idx) => (
                                <div key={idx} className="group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl hover:border-brand-primary/50 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 group-hover:scale-110 transition-transform">
                                            <FolderIcon className="w-5 h-5" />
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSaved(ind.name); }} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div onClick={() => handleLoadSaved(ind)} className="cursor-pointer">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{ind.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">Based on {ind.baseType}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {isChartFullScreen && (
                <div className="fixed inset-0 z-[100] bg-white dark:bg-brand-darkest p-0 animate-modal-fade-in">
                    <div id={`indicator_chart_fullscreen_${widgetKey}`} className="w-full h-full" />
                    <button 
                        onClick={toggleFullScreen} 
                        className="absolute top-4 right-4 z-[110] p-2 bg-black/40 backdrop-blur-md rounded-lg text-white hover:bg-black/60 transition-colors"
                    >
                        <CollapseIcon />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomIndicatorStudio;

