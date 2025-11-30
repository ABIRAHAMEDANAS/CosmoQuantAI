
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Logo, DashboardIcon, PortfolioIcon, BacktesterIcon, BotLabIcon, MarketIcon, SentimentIcon, FilingsIcon, SettingsIcon, LogoutIcon, OnChainIcon, RegimeIcon, CorrelationIcon, MLModelIcon, IndicatorStudioIcon, EducationIcon, AIFoundryIcon, AlternativeDataIcon, MLModelMarketplaceIcon, RealTimeDataIcon, QuantScreenerIcon, AlertsWatchlistIcon, AnalystResearchIcon, InstitutionalHoldingsIcon, BlockTradeDetectorIcon, UnusualOptionsActivityIcon, LiquidationMapIcon, PineScriptIcon, TokenUnlockIcon, AssistantIcon, GeneralIcon, TradingIcon, AlphaEngineIcon, StudioIcon, ChevronDownIcon, UserCircleIcon, CreditCardIcon, KeyIcon, TaskManagerIcon } from '../../constants';
// FIX: Updated AppView import to break circular dependency.
import { AppView, TradingBot, IndicatorData } from '../../types';
import { Cpu, LayoutDashboard, Database, Activity, LineChart, BrainCircuit, CloudLightning, Bot, Zap, History } from 'lucide-react';
import Dashboard from './Dashboard';
import { Dashboard as OmniDashboard } from './omnitrade/Dashboard.tsx';
import { DataNexus } from './omnitrade/DataNexus.tsx';
import { FeatureLab } from './omnitrade/FeatureLab.tsx';
import { Charting as ProCharts } from './omnitrade/Charting.tsx';
import { BrainCore } from './omnitrade/BrainCore.tsx';
import { VertexForge } from './omnitrade/VertexForge.tsx';
import { BotManager } from './omnitrade/BotManager.tsx';
import { ExecutionEngine } from './omnitrade/ExecutionEngine.tsx';

import PortfolioTracker from './PortfolioTracker';
import Market from './Market';
import SentimentEngine from './SentimentEngine';
import CorporateFilings from './CorporateFilings';
import Settings from './Settings';
import OnChainAnalyzer from './OnChainAnalyzer';
import MarketRegimeClassifier from './MarketRegimeClassifier';
import CorrelationMatrix from './CorrelationMatrix';
import CustomMLModels from './CustomMLModels';
import CustomIndicatorStudio from './CustomIndicatorStudio';
import EducationHub from './EducationHub';
import Button from '../../components/ui/Button';
import AIFoundry from './AIFoundry';
import AlternativeData from './AlternativeData';
import MLModelMarketplace from './MLModelMarketplace';
import RealTimeData from './RealTimeData';
import QuantScreener from './QuantScreener';
import AlertsWatchlist from './AlertsWatchlist';
import AnalystResearch from './AnalystResearch';
import InstitutionalHoldingsTracker from './InstitutionalHoldingsTracker';
import BlockTradeDetector from './BlockTradeDetector';
import UnusualOptionsActivity from './UnusualOptionsActivity';
import LiquidationMap from './LiquidationMap';
import PineScriptStudio from './PineScriptStudio';
import TokenUnlockCalendar from './TokenUnlockCalendar';
import AIAssistantModal from './AIAssistantModal';
import ThemeToggle from '../../components/ui/ThemeToggle';
import MarketTicker from '../../components/ui/MarketTicker';
import TaskManager from './TaskManager';
import NeuralArchitecture from './NeuralArchitecture';
import Backtester from './Backtester';
import BotLab from './BotLab';
import { useSettings } from '../../contexts/SettingsContext';

interface AppDashboardProps {
    currentView: AppView;
    onNavigate: (view: AppView, section?: string) => void;
    onLogout: () => void;
    activeSettingsSection: string | null;
}

// Ultra-Modern NavItem Component
const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`group relative flex items-center w-full px-4 py-3 mb-2 rounded-2xl transition-all duration-300 ease-out overflow-hidden
            ${isActive
                ? 'text-white shadow-lg shadow-brand-primary/25 translate-x-1'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
            }`}
    >
        {/* Active Background with Gradient */}
        {isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-indigo-600 opacity-100 transition-opacity duration-300"></div>
        )}

        {/* Hover Background (Subtle) */}
        {!isActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        )}

        {/* Icon Container */}
        <span className={`relative z-10 w-6 h-6 flex items-center justify-center rounded-lg transition-colors duration-300 
            ${isActive ? 'bg-white/20 text-white' : 'bg-transparent text-slate-400 group-hover:text-brand-primary group-hover:bg-brand-primary/10'}`}>
            {icon}
        </span>

        {/* Label */}
        <span className="relative z-10 ml-3 text-sm font-medium tracking-wide truncate">{label}</span>

        {/* Active Indicator Dot */}
        {isActive && (
            <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white] z-10"></span>
        )}
    </button>
);

const Sidebar: React.FC<{
    currentView: AppView;
    onNavigate: (view: AppView, section?: string) => void;
    onLogout: () => void;
}> = ({ currentView, onNavigate, onLogout }) => {
    const { userProfile } = useSettings();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const DropdownMenuItem: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
        <button onClick={onClick} className="flex items-center w-full px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-dark/50 hover:text-brand-primary transition-all rounded-lg group">
            <span className="w-5 h-5 mr-3 text-gray-400 group-hover:text-brand-primary transition-colors">{icon}</span>
            {label}
        </button>
    );

    const navCategories = useMemo(() => [
        {
            title: 'Operations',
            items: [
                { view: AppView.DASHBOARD, icon: <DashboardIcon />, label: 'Dashboard' },
                { view: AppView.PORTFOLIO, icon: <PortfolioIcon />, label: 'Portfolio' },
                { view: AppView.MARKET, icon: <MarketIcon />, label: 'Live Market' },
                { view: AppView.ALERTS_WATCHLIST, icon: <AlertsWatchlistIcon />, label: 'Sentinels' },
                { view: AppView.TASK_MANAGER, icon: <TaskManagerIcon />, label: 'Task Command' },
            ]
        },
        {
            title: 'Nural AI Bot',
            items: [
                { view: AppView.OMNI_DASHBOARD, icon: <LayoutDashboard />, label: 'Command Center' },
                { view: AppView.OMNI_NEXUS, icon: <Database size={20} />, label: 'Data Nexus' },
                { view: AppView.OMNI_FEATURE_LAB, icon: <Activity size={20} />, label: 'Feature Lab' },
                { view: AppView.OMNI_CHARTS, icon: <LineChart size={20} />, label: 'Pro Charts' },
                { view: AppView.OMNI_BRAIN, icon: <BrainCircuit size={20} />, label: 'The Brain AI' },
                { view: AppView.OMNI_VERTEX, icon: <CloudLightning size={20} />, label: 'Vertex Forge' },
                { view: AppView.OMNI_BOTS, icon: <Bot size={20} />, label: 'Bot Fleet' },
                { view: AppView.OMNI_EXECUTION, icon: <Zap size={20} />, label: 'Execution' },

            ]
        },
        {
            title: 'Core Engines',
            items: [
                { view: AppView.BACKTESTER, icon: <BacktesterIcon />, label: 'Backtester' },
                { view: AppView.BOT_LAB, icon: <BotLabIcon />, label: 'Bot Laboratory' },
                { view: AppView.AI_FOUNDRY, icon: <AIFoundryIcon />, label: 'AI Foundry' },
            ]
        },
        {
            title: 'Alpha Intelligence',
            items: [
                { view: AppView.SENTIMENT_ENGINE, icon: <SentimentIcon />, label: 'Sentiment AI' },
                { view: AppView.BLOCK_TRADE_DETECTOR, icon: <BlockTradeDetectorIcon />, label: 'Block Trades' },
                { view: AppView.UNUSUAL_OPTIONS_ACTIVITY, icon: <UnusualOptionsActivityIcon />, label: 'Unusual Options' },
                { view: AppView.LIQUIDATION_MAP, icon: <LiquidationMapIcon />, label: 'Liquidation Map' },
                { view: AppView.CORPORATE_FILINGS, icon: <FilingsIcon />, label: 'Insider Filings' },
                { view: AppView.INSTITUTIONAL_HOLDINGS, icon: <InstitutionalHoldingsIcon />, label: 'Guru Holdings' },
                { view: AppView.TOKEN_UNLOCK_CALENDAR, icon: <TokenUnlockIcon />, label: 'Token Unlocks' },
                { view: AppView.ANALYST_RESEARCH, icon: <AnalystResearchIcon />, label: 'Analyst Ratings' },
                { view: AppView.REAL_TIME_DATA, icon: <RealTimeDataIcon />, label: 'Fundamental Data' },
                { view: AppView.MARKET_REGIME_CLASSIFIER, icon: <RegimeIcon />, label: 'Regime Classifier' },
                { view: AppView.CORRELATION_MATRIX, icon: <CorrelationIcon />, label: 'Correlation Matrix' },
                { view: AppView.ON_CHAIN_ANALYZER, icon: <OnChainIcon />, label: 'On-Chain Data' },
                { view: AppView.QUANT_SCREENER, icon: <QuantScreenerIcon />, label: 'Quant Screener' },
                { view: AppView.ALTERNATIVE_DATA, icon: <AlternativeDataIcon />, label: 'Alternative Data' },
            ]
        },
        {
            title: 'Developer Studio',
            items: [
                { view: AppView.NURAL_CORE, icon: <Cpu size={20} />, label: 'Neural Core' },
                { view: AppView.CUSTOM_ML_MODELS, icon: <MLModelIcon />, label: 'ML Registry' },
                { view: AppView.ML_MODEL_MARKETPLACE, icon: <MLModelMarketplaceIcon />, label: 'Algo Marketplace' },
                { view: AppView.CUSTOM_INDICATOR_STUDIO, icon: <IndicatorStudioIcon />, label: 'Indicator Studio' },
                { view: AppView.PINE_SCRIPT_STUDIO, icon: <PineScriptIcon />, label: 'Pine Editor' },
            ]
        },
        {
            title: 'Knowledge',
            items: [
                { view: AppView.EDUCATION_HUB, icon: <EducationIcon />, label: 'Academy' },
            ]
        },
    ], []);

    return (
        <aside className="w-72 bg-[#F8FAFC] dark:bg-[#050B14] border-r border-gray-200 dark:border-white/5 flex flex-col h-screen transition-colors duration-300 shadow-[5px_0_20px_rgba(0,0,0,0.05)] z-20 relative">

            {/* Glowing Background Effect */}
            <div className="absolute top-0 left-0 w-full h-96 bg-brand-primary/5 dark:bg-brand-primary/10 blur-[80px] pointer-events-none"></div>

            <div className="p-6 pb-4 relative z-10">
                <div className="flex items-center justify-center mb-2 transform hover:scale-105 transition-transform duration-300">
                    <Logo />
                </div>
                {/* Stylish Divider */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent my-6"></div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-4 custom-scrollbar pb-4 relative z-10">
                {navCategories.map(category => (
                    <div key={category.title} className="mb-8 last:mb-0">
                        {/* Gradient Text Header */}
                        <h3 className="px-4 mb-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-slate-500 to-slate-400 dark:from-gray-400 dark:to-gray-600 select-none">
                            {category.title}
                        </h3>
                        <div className="space-y-1">
                            {category.items.map(item => (
                                <NavItem
                                    key={item.view}
                                    icon={item.icon}
                                    label={item.label}
                                    isActive={currentView === item.view}
                                    onClick={() => onNavigate(item.view)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Profile Section */}
            <div className="p-4 relative z-20" ref={profileRef}>
                {/* Dropdown Menu */}
                <div className={`absolute bottom-[85px] w-[calc(100%-32px)] left-4 bg-white dark:bg-[#161e2e] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 z-50 origin-bottom transition-all duration-200 ease-out transform ${isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}>
                    <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Account</p>
                    </div>
                    <DropdownMenuItem icon={<UserCircleIcon />} label="Profile" onClick={() => { onNavigate(AppView.SETTINGS, 'profile'); setIsProfileOpen(false); }} />
                    <DropdownMenuItem icon={<CreditCardIcon />} label="Billing" onClick={() => { onNavigate(AppView.SETTINGS, 'billing'); setIsProfileOpen(false); }} />
                    <DropdownMenuItem icon={<KeyIcon />} label="API Keys" onClick={() => { onNavigate(AppView.SETTINGS, 'api-keys'); setIsProfileOpen(false); }} />
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>
                    <DropdownMenuItem icon={<LogoutIcon />} label="Logout" onClick={onLogout} />
                </div>

                {/* Profile Button */}
                <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center w-full p-3 rounded-2xl border transition-all duration-300 group
                        ${isProfileOpen
                            ? 'bg-white dark:bg-[#161e2e] border-brand-primary shadow-lg shadow-brand-primary/10'
                            : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 hover:border-brand-primary/50 hover:bg-gray-50 dark:hover:bg-white/10'
                        }`}
                >
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white dark:ring-[#0B1120]">AA</div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0B1120] rounded-full"></div>
                    </div>
                    <div className="ml-3 flex-1 min-w-0 text-left">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">{userProfile.fullName}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-warning"></span>
                            Pro Trader Plan
                        </p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${isProfileOpen ? 'bg-brand-primary/10 text-brand-primary rotate-180' : 'bg-transparent text-gray-400 group-hover:text-brand-primary'}`}>
                        <ChevronDownIcon className="h-5 w-5" />
                    </div>
                </button>
            </div>
        </aside>
    );
};

const MODAL_VIEWS: AppView[] = [];

import { BacktestProvider } from '../../contexts/BacktestContext';

const AppDashboard: React.FC<AppDashboardProps> = ({ currentView, onNavigate, onLogout, activeSettingsSection }) => {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [modalView, setModalView] = useState<AppView | null>(null);
    const prevViewRef = useRef<AppView>(AppView.DASHBOARD);

    // OmniTrade State
    const [bots, setBots] = useState<TradingBot[]>([
        { id: 'BOT-OMEGA', name: 'Omega Prime', strategy: 'Reinforcement Learning', pair: 'BTC/USDT', status: 'RUNNING', pnl: 12500.50, winRate: 78.5, allocation: 50000, modelVersion: 'v4.2.0' },
        { id: 'BOT-ALPHA', name: 'Alpha Scalper', strategy: 'Scalping', pair: 'ETH/USDT', status: 'RUNNING', pnl: 3450.20, winRate: 65.2, allocation: 15000 },
        { id: 'BOT-BETA', name: 'Beta Trend', strategy: 'Trend Following', pair: 'SOL/USDT', status: 'PAUSED', pnl: -120.50, winRate: 45.0, allocation: 10000 },
    ]);

    const dummyIndicatorData: IndicatorData[] = [
        { price: 100, rsi: 55, macd: { histogram: 0.5, signal: 1.2, macd: 1.7 }, bollinger: { upper: 105, middle: 100, lower: 95 } },
        { price: 102, rsi: 60, macd: { histogram: 0.6, signal: 1.3, macd: 1.9 }, bollinger: { upper: 106, middle: 101, lower: 96 } },
    ];

    const handleDeploy = (botId: string, modelVersion: string, computeNode: string) => {
        console.log(`Deploying ${modelVersion} to ${botId} on ${computeNode}`);
    };

    useEffect(() => {
        if (MODAL_VIEWS.includes(currentView)) {
            setModalView(currentView);
        } else {
            // Only update prevView if it's a main page navigation, not a modal opening
            prevViewRef.current = currentView;
            setModalView(null);
        }
    }, [currentView]);

    const handleConnectWallet = async () => {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) {
                    setWalletAddress(accounts[0]);
                }
            } catch (error) {
                console.error("User rejected wallet connection request:", error);
            }
        } else {
            alert("Please install a Web3 wallet like MetaMask or use a Web3-enabled browser.");
        }
    };

    const handleDisconnectWallet = () => {
        setWalletAddress(null);
    };

    const viewToRender = modalView ? prevViewRef.current : currentView;

    const renderContent = () => {
        switch (viewToRender) {
            case AppView.DASHBOARD: return <Dashboard />;

            // OmniTrade Views
            case AppView.OMNI_DASHBOARD: return <div className="dark text-slate-200"><OmniDashboard /></div>;
            case AppView.OMNI_NEXUS: return <div className="dark text-slate-200"><DataNexus /></div>;
            case AppView.OMNI_FEATURE_LAB: return <div className="dark text-slate-200"><FeatureLab data={dummyIndicatorData} /></div>;
            case AppView.OMNI_CHARTS: return <div className="dark text-slate-200"><ProCharts /></div>;
            case AppView.OMNI_BRAIN: return <div className="dark text-slate-200"><BrainCore currentData={null} /></div>;
            case AppView.OMNI_VERTEX: return <div className="dark text-slate-200"><VertexForge bots={bots} onDeploy={handleDeploy} /></div>;
            case AppView.OMNI_BOTS: return <div className="dark text-slate-200"><BotManager bots={bots} setBots={setBots} /></div>;
            case AppView.OMNI_EXECUTION: return <div className="dark text-slate-200"><ExecutionEngine /></div>;


            case AppView.PORTFOLIO: return <PortfolioTracker />;
            case AppView.BACKTESTER: return <Backtester />;
            case AppView.BOT_LAB: return <BotLab />;
            case AppView.AI_FOUNDRY: return <AIFoundry />;
            case AppView.MARKET: return <Market />;
            case AppView.SENTIMENT_ENGINE: return <SentimentEngine />;
            case AppView.CORPORATE_FILINGS: return <CorporateFilings />;
            case AppView.INSTITUTIONAL_HOLDINGS: return <InstitutionalHoldingsTracker />;
            case AppView.BLOCK_TRADE_DETECTOR: return <BlockTradeDetector />;
            case AppView.UNUSUAL_OPTIONS_ACTIVITY: return <UnusualOptionsActivity />;
            case AppView.ON_CHAIN_ANALYZER: return <OnChainAnalyzer />;
            case AppView.LIQUIDATION_MAP: return <LiquidationMap />;
            case AppView.MARKET_REGIME_CLASSIFIER: return <MarketRegimeClassifier />;
            case AppView.CORRELATION_MATRIX: return <CorrelationMatrix />;
            case AppView.TOKEN_UNLOCK_CALENDAR: return <TokenUnlockCalendar />;
            case AppView.ALTERNATIVE_DATA: return <AlternativeData />;
            case AppView.REAL_TIME_DATA: return <RealTimeData />;
            case AppView.QUANT_SCREENER: return <QuantScreener />;
            case AppView.ALERTS_WATCHLIST: return <AlertsWatchlist />;
            case AppView.ANALYST_RESEARCH: return <AnalystResearch />;
            case AppView.CUSTOM_ML_MODELS: return <CustomMLModels />;
            case AppView.ML_MODEL_MARKETPLACE: return <MLModelMarketplace />;
            case AppView.CUSTOM_INDICATOR_STUDIO: return <CustomIndicatorStudio />;
            case AppView.PINE_SCRIPT_STUDIO: return <PineScriptStudio />;
            case AppView.EDUCATION_HUB: return <EducationHub />;
            case AppView.NURAL_CORE: return <NeuralArchitecture />;
            case AppView.TASK_MANAGER: return <TaskManager />;
            case AppView.SETTINGS: return <Settings initialSection={activeSettingsSection} />;
            default: return <Dashboard />;
        }
    };

    const showWalletConnect = [AppView.DASHBOARD, AppView.PORTFOLIO, AppView.ON_CHAIN_ANALYZER].includes(viewToRender);

    return (
        <BacktestProvider>
            <div className="flex h-screen bg-brand-light dark:bg-brand-darkest">
                <Sidebar currentView={currentView} onNavigate={onNavigate} onLogout={onLogout} />
                <div className="flex-1 flex flex-col overflow-hidden relative z-0">
                    <header className="flex-shrink-0 bg-white/80 dark:bg-brand-darkest/80 backdrop-blur-md border-b border-gray-200 dark:border-brand-border-dark/50 z-10">
                        <div className="flex justify-between items-center px-8 h-16">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                {viewToRender}
                            </h1>
                            <div className="flex items-center gap-4">
                                {showWalletConnect && (
                                    <div>
                                        {walletAddress ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono bg-gray-100 dark:bg-brand-dark/50 px-2 py-1 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                    {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                                                </span>
                                                <Button variant="secondary" onClick={handleDisconnectWallet} className="px-3 py-1 text-xs h-8">Disconnect</Button>
                                            </div>
                                        ) : (
                                            <Button variant="secondary" onClick={handleConnectWallet} className="px-3 py-1 text-xs h-8 shadow-sm bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10">Connect Wallet</Button>
                                        )}
                                    </div>
                                )}
                                <Button variant="outline" onClick={() => setIsAssistantOpen(true)} className="!p-2 rounded-full border-gray-200 dark:border-gray-700 text-gray-500 hover:text-brand-primary">
                                    <AssistantIcon className="h-5 w-5" />
                                </Button>
                                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                <ThemeToggle />
                            </div>
                        </div>
                        {viewToRender === AppView.MARKET && <div className="border-t border-gray-100 dark:border-gray-800"><MarketTicker /></div>}
                    </header>
                    <main className="flex-1 overflow-y-auto p-8 relative">
                        {renderContent()}
                    </main>
                </div>
                <AIAssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} currentView={viewToRender} />
            </div>
        </BacktestProvider>
    );
};

export default AppDashboard;
