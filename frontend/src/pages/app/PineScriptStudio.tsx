
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import CodeEditor from '@/components/common/CodeEditor';
import { useToast } from '@/context/ToastContext';
import { MOCK_INDICATOR_CODE } from '@/constants';

// --- Icons ---
const PlayIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const CopyIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const EraserIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);
const TerminalIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
);
const CodeBracketIcon = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
);

// --- Snippets ---
const PINE_SNIPPETS = [
    { label: 'Study', code: '/@version=5\nindicator("My Script")\nplot(close)' },
    { label: 'Strategy', code: '/@version=5\nstrategy("My Strategy", overlay=true)\n' },
    { label: 'Plot', code: 'plot(close, color=color.blue)' },
    { label: 'SMA', code: 'ta.sma(close, 14)' },
    { label: 'RSI', code: 'ta.rsi(close, 14)' },
    { label: 'If/Else', code: 'if close > open\n    strategy.entry("Long", strategy.long)\nelse\n    strategy.close("Long")' },
];

const PineScriptStudio: React.FC = () => {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const widgetRef = useRef<any>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const splitPaneRef = useRef<HTMLDivElement>(null);

    const [isResizing, setIsResizing] = useState(false);
    const [topPaneHeight, setTopPaneHeight] = useState(55);
    const [code, setCode] = useState(MOCK_INDICATOR_CODE['SMA']);
    const [widgetKey, setWidgetKey] = useState(Date.now());
    const [activeTab, setActiveTab] = useState<'editor' | 'console'>('editor');
    const [consoleLogs, setConsoleLogs] = useState<string[]>(['> System initialized.', '> Pine Script Engine v5.0 ready.']);

    // Resizing logic
    const handleMouseDown = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);
    const handleMouseUp = useCallback(() => { setIsResizing(false); }, []);
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isResizing && splitPaneRef.current) {
            const bounds = splitPaneRef.current.getBoundingClientRect();
            const newHeight = ((e.clientY - bounds.top) / bounds.height) * 100;
            if (newHeight > 20 && newHeight < 80) setTopPaneHeight(newHeight);
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
    
    // TradingView Widget Logic
    useEffect(() => {
        const createWidget = () => {
            if (!chartContainerRef.current || !window.TradingView) return;
            chartContainerRef.current.innerHTML = '';
            const widgetOptions = {
                symbol: 'BINANCE:BTCUSDT',
                interval: '60',
                autosize: true,
                container_id: chartContainerRef.current.id,
                theme: theme === 'dark' ? 'Dark' : 'Light',
                locale: 'en',
                toolbar_bg: theme === 'dark' ? '#0B1120' : '#f1f3f6',
                enable_publishing: false,
                hide_side_toolbar: false,
                allow_symbol_change: true,
                studies: ["MASimple@tv-basicstudies"],
                disabled_features: ['header_symbol_search'],
            };
            const widget = new window.TradingView.widget(widgetOptions);
            widgetRef.current = widget;
        };
        const checkLibraryAndCreate = () => {
            if (typeof window.TradingView !== 'undefined' && window.TradingView.widget) createWidget();
            else setTimeout(checkLibraryAndCreate, 100);
        }
        checkLibraryAndCreate();
        return () => { if (widgetRef.current) { try { widgetRef.current.remove(); } catch(e) {} } };
    }, [theme, widgetKey]);

    const handleApplyToChart = () => {
        // Simulate compilation
        setConsoleLogs(prev => [...prev, `> Compiling script...`, `> Success: Script added to chart.`]);
        navigator.clipboard.writeText(code).then(() => {
            showToast('Code copied to clipboard! Paste in TV chart.', 'success');
        });
        setActiveTab('console');
    };

    const handleClearPlot = () => {
        setWidgetKey(Date.now());
        setConsoleLogs(prev => [...prev, `> Plot cleared. Chart reset.`]);
        showToast('Chart plot cleared.', 'info');
    };

    const insertSnippet = (snippetCode: string) => {
        setCode(prev => prev + '\n' + snippetCode);
        showToast('Snippet inserted', 'info');
    };

    return (
        <div ref={splitPaneRef} className="flex flex-col h-full relative bg-[#0B1120] rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
            {isResizing && <div className="absolute inset-0 z-50 cursor-row-resize" />}
            
            {/* Top Pane: Chart */}
            <div className="relative min-h-0 transition-all duration-75" style={{ height: `${topPaneHeight}%` }}>
                <div className="absolute top-4 right-4 z-10 bg-[#0B1120]/80 backdrop-blur-md border border-gray-700 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-mono text-green-400 shadow-lg">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    LIVE PREVIEW
                </div>
                <div ref={chartContainerRef} id={`pine_script_studio_chart_${widgetKey}`} className="w-full h-full bg-[#0B1120]" />
            </div>
            
            {/* Resizer */}
            <div 
                className="h-1.5 cursor-row-resize flex items-center justify-center bg-gray-900 border-y border-gray-800 hover:bg-brand-primary hover:border-brand-primary transition-colors z-20 group"
                onMouseDown={handleMouseDown}
            >
                <div className="w-16 h-1 rounded-full bg-gray-600 group-hover:bg-white transition-colors"></div>
            </div>

            {/* Bottom Pane: Editor IDE */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#0F172A] relative">
                
                {/* IDE Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 bg-[#0B1120] border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setActiveTab('editor')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'editor' ? 'bg-[#0F172A] text-brand-primary border-t-2 border-brand-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <CodeBracketIcon /> Script.pine
                        </button>
                        <button 
                            onClick={() => setActiveTab('console')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'console' ? 'bg-[#0F172A] text-brand-primary border-t-2 border-brand-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <TerminalIcon /> Console
                        </button>
                    </div>

                    {activeTab === 'editor' && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {PINE_SNIPPETS.map((snip, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => insertSnippet(snip.code)}
                                    className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded text-[10px] font-mono transition-colors whitespace-nowrap"
                                >
                                    {snip.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative overflow-hidden">
                    {/* Editor */}
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'editor' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                         <div className="h-full w-full relative">
                             <CodeEditor value={code} onChange={setCode} />
                             
                             {/* Floating Actions */}
                             <div className="absolute bottom-4 right-6 flex gap-3">
                                 <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={handleClearPlot}
                                    className="h-9 text-xs bg-[#0B1120]/80 backdrop-blur border border-gray-700 hover:border-red-500 hover:text-red-500"
                                 >
                                    <EraserIcon />
                                 </Button>
                                 <Button 
                                    size="sm" 
                                    variant="primary" 
                                    onClick={handleApplyToChart}
                                    className="h-9 text-xs shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] flex items-center gap-2"
                                 >
                                     <PlayIcon className="w-3 h-3" /> Compile & Run
                                 </Button>
                             </div>
                         </div>
                    </div>

                    {/* Console */}
                    <div className={`absolute inset-0 bg-[#0F172A] p-4 overflow-y-auto font-mono text-xs transition-opacity duration-300 ${activeTab === 'console' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        {consoleLogs.map((log, i) => (
                            <div key={i} className="mb-1 text-gray-400 border-l-2 border-transparent hover:border-gray-600 pl-2">
                                <span className="text-gray-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log}
                            </div>
                        ))}
                        <div className="animate-pulse text-brand-primary mt-2">_</div>
                    </div>
                </div>
                
                {/* Status Bar */}
                <div className="h-6 bg-[#0B1120] border-t border-gray-800 flex items-center justify-between px-4 text-[10px] text-gray-500 font-mono">
                     <div className="flex gap-4">
                        <span>Ln 1, Col 1</span>
                        <span>UTF-8</span>
                        <span>Pine Script v5</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${code.length > 0 ? 'bg-blue-500' : 'bg-gray-500'}`}></div>
                        <span>{code.length > 0 ? 'Edited' : 'Ready'}</span>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default PineScriptStudio;

