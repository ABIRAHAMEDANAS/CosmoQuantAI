
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { MOCK_WATCHLISTS, MOCK_ALERTS, ChevronDownIcon } from '@/constants';
import type { Watchlist, Alert } from '@/types';
import { useToast } from '@/context/ToastContext';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

type AssetPrice = {
    price: number;
    history: { value: number }[];
    lastUpdate: 'up' | 'down' | 'none';
};

// Enhanced Sparkline with Gradient Area
const AssetSparkline: React.FC<{ data: { value: number }[]; isPositive: boolean; id: string }> = ({ data, isPositive, id }) => {
    const color = isPositive ? '#10B981' : '#F43F5E';

    return (
        <div className="h-16 w-full absolute bottom-0 left-0 right-0 opacity-30 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.5}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#gradient-${id})`}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

const CreateAlertModal: React.FC<{
    onClose: () => void;
    onAddAlert: (alert: Alert) => void;
    assets: string[];
}> = ({ onClose, onAddAlert, assets }) => {
    const { showToast } = useToast();
    const [asset, setAsset] = useState(assets[0] || '');
    const [triggerType, setTriggerType] = useState<Alert['triggerType']>('Price');
    const [priceCondition, setPriceCondition] = useState('>');
    const [priceValue, setPriceValue] = useState('');
    const [rsiValue, setRsiValue] = useState('70');
    const [notificationChannels, setNotificationChannels] = useState<Alert['notificationChannels']>(['Push']);

    const handleChannelToggle = (channel: 'Email' | 'SMS' | 'Push') => {
        setNotificationChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };

    const getConditionString = (): string => {
        switch (triggerType) {
            case 'Price': return `Price ${priceCondition} $${priceValue}`;
            case 'RSI': return `RSI(14) < ${rsiValue}`;
            case 'SMA Cross': return 'SMA(50) crosses over SMA(200)';
            case 'Volume Spike': return 'Volume > 2x 20-period Average';
            default: return 'Unknown Condition';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset) {
            showToast('Please select an asset for the alert.', 'error');
            return;
        }
        if (triggerType === 'Price' && (!priceValue || parseFloat(priceValue) <= 0)) {
            showToast('Please enter a valid, positive price for the alert.', 'error');
            return;
        }
        
        const newAlert: Alert & { isNew?: boolean } = {
            id: `alert_${new Date().getTime()}`,
            asset,
            triggerType,
            condition: getConditionString(),
            status: 'Active',
            notificationChannels,
            isNew: true,
        };
        onAddAlert(newAlert);
        onClose();
    };
    
    const inputBaseClasses = "w-full bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-modal-fade-in" onClick={onClose}>
            <div className="w-full max-w-lg bg-white dark:bg-brand-dark rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-modal-content-slide-down" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set New Sentinel</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Asset</label>
                            <select value={asset} onChange={e => setAsset(e.target.value)} className={inputBaseClasses}>
                                {assets.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Trigger</label>
                            <select value={triggerType} onChange={e => setTriggerType(e.target.value as any)} className={inputBaseClasses}>
                                <option value="Price">Price Level</option>
                                <option value="RSI">RSI Threshold</option>
                                <option value="SMA Cross">Golden/Death Cross</option>
                                <option value="Volume Spike">Volume Spike</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700/50">
                         <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Condition</label>
                        {triggerType === 'Price' && (
                            <div className="flex items-center gap-3">
                                <select value={priceCondition} onChange={e => setPriceCondition(e.target.value)} className={`${inputBaseClasses} !w-32`}>
                                    <option value=">">Above</option>
                                    <option value="<">Below</option>
                                </select>
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-3 text-gray-400">$</span>
                                    <input type="number" value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="0.00" required className={`${inputBaseClasses} pl-7`} />
                                </div>
                            </div>
                        )}
                         {triggerType === 'RSI' && (
                            <div className="flex items-center gap-3">
                                 <span className="text-sm text-gray-500 dark:text-gray-400">RSI (14) crosses:</span>
                                <input type="number" value={rsiValue} onChange={e => setRsiValue(e.target.value)} placeholder="30" required className={inputBaseClasses} />
                            </div>
                        )}
                         {triggerType === 'SMA Cross' && <p className="text-sm text-gray-500 italic">Triggers when SMA(50) crosses SMA(200).</p>}
                         {triggerType === 'Volume Spike' && <p className="text-sm text-gray-500 italic">Triggers when current volume exceeds 2x the 20-period average.</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Notification Channels</label>
                        <div className="flex flex-wrap gap-3">
                            {(['Push', 'Email', 'SMS'] as const).map(channel => (
                                <button
                                    key={channel}
                                    type="button"
                                    onClick={() => handleChannelToggle(channel)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-full border transition-all active:scale-95 ${
                                        notificationChannels.includes(channel)
                                            ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20'
                                            : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {channel}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button type="submit" variant="primary" className="w-full py-3.5 rounded-xl text-base font-bold shadow-xl shadow-brand-primary/25">Create Alert</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AlertsWatchlist: React.FC = () => {
    const [watchlists, setWatchlists] = useState<Watchlist[]>(MOCK_WATCHLISTS);
    const [alerts, setAlerts] = useState<(Alert & { isNew?: boolean, justTriggered?: boolean, isDeleting?: boolean })[]>(MOCK_ALERTS);
    const [selectedWatchlistId, setSelectedWatchlistId] = useState(watchlists[0]?.id || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { showToast } = useToast();
    const [assetPrices, setAssetPrices] = useState<Record<string, AssetPrice>>({});
    const [isWatchlistDropdownOpen, setIsWatchlistDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedWatchlist = useMemo(() => watchlists.find(w => w.id === selectedWatchlistId), [watchlists, selectedWatchlistId]);

    // Initialize prices for watchlist
    useEffect(() => {
        if (!selectedWatchlist) return;

        setAssetPrices(prevPrices => {
            const newPricesState = { ...prevPrices };
            selectedWatchlist.assets.forEach(asset => {
                if (!newPricesState[asset]) {
                    const priceRanges: { [key: string]: number } = { 'BTC': 68000, 'ETH': 3500, 'SOL': 170, 'ADA': 0.45, 'AAPL': 190, 'MSFT': 420, 'GOOGL': 175, 'NVDA': 120, 'PFE': 28, 'TSLA': 175 };
                    const baseSymbol = asset.split('/')[0];
                    const basePrice = priceRanges[baseSymbol] || 500;
                    const initialPrice = basePrice + (Math.random() - 0.5) * (basePrice * 0.05);
                    newPricesState[asset] = { 
                        price: initialPrice, 
                        history: Array.from({length: 20}, () => ({ value: initialPrice + (Math.random() - 0.5) * (initialPrice * 0.02) })), 
                        lastUpdate: 'none' 
                    };
                }
            });
            return newPricesState;
        });
    }, [selectedWatchlist]);

    // Live Price Simulation
    useEffect(() => {
        const interval = setInterval(() => {
            setAssetPrices(currentPrices => {
                const updatedPrices: Record<string, AssetPrice> = {};
                for (const asset in currentPrices) {
                    const current = currentPrices[asset];
                    const priceChange = (Math.random() - 0.5) * (current.price * 0.005);
                    const newPrice = current.price + priceChange;
                    updatedPrices[asset] = {
                        price: newPrice,
                        history: [...current.history.slice(1), { value: newPrice }],
                        lastUpdate: priceChange > 0 ? 'up' : 'down'
                    };
                }
                return { ...currentPrices, ...updatedPrices };
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsWatchlistDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleAddAlert = (newAlert: Alert) => {
        setAlerts(prev => [newAlert as any, ...prev]);
        showToast(`Alert created for ${newAlert.asset}`, 'success');
        setTimeout(() => {
            setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, isNew: false } : a));
        }, 500);
    };

    const handleDeleteAlert = (id: string) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isDeleting: true } : a));
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== id));
            showToast('Alert deleted', 'info');
        }, 400);
    };
    
    const allAssets = useMemo(() => Array.from(new Set(watchlists.flatMap(w => w.assets))), [watchlists]);

    return (
        <div className="h-full flex flex-col gap-6">
            {isModalOpen && <CreateAlertModal onClose={() => setIsModalOpen(false)} onAddAlert={handleAddAlert} assets={allAssets} />}
            
            <div className="flex justify-between items-end staggered-fade-in" style={{ animationDelay: '50ms' }}>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Market Sentinel</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor assets and manage your alert triggers in real-time.</p>
                </div>
                <Button variant="primary" onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-brand-primary/20 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    New Alert
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0 flex-1">
                {/* Watchlist Section */}
                <div className="lg:col-span-1 flex flex-col gap-4 staggered-fade-in" style={{ animationDelay: '150ms' }}>
                    <div ref={dropdownRef} className="relative z-20">
                         <button 
                            onClick={() => setIsWatchlistDropdownOpen(!isWatchlistDropdownOpen)} 
                            className="w-full flex items-center justify-between bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark p-4 rounded-2xl shadow-sm hover:border-brand-primary/50 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Watchlist</p>
                                    <p className="font-bold text-slate-900 dark:text-white">{selectedWatchlist?.name}</p>
                                </div>
                            </div>
                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isWatchlistDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isWatchlistDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-brand-dark rounded-2xl shadow-xl border border-gray-200 dark:border-brand-border-dark overflow-hidden animate-dropdown-enter">
                                {watchlists.map(w => (
                                    <button 
                                        key={w.id} 
                                        onClick={() => { setSelectedWatchlistId(w.id); setIsWatchlistDropdownOpen(false); }} 
                                        className="w-full text-left px-6 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center justify-between group"
                                    >
                                        <span className={selectedWatchlistId === w.id ? 'text-brand-primary' : 'text-slate-700 dark:text-gray-300'}>{w.name}</span>
                                        {selectedWatchlistId === w.id && <span className="w-2 h-2 rounded-full bg-brand-primary"></span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                        {selectedWatchlist?.assets.map((asset, index) => {
                            const priceData = assetPrices[asset];
                            if (!priceData) return null;
                            
                            const historyValues = priceData.history.map(d => d.value);
                            const change = priceData.price - historyValues[0];
                            const isPositive = change >= 0;
                            const changePercent = (change / historyValues[0]) * 100;
                            
                            return (
                                <div 
                                    key={asset} 
                                    className="relative overflow-hidden bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 staggered-fade-in"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <AssetSparkline data={priceData.history} isPositive={isPositive} id={asset} />
                                    
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{asset}</h3>
                                            <p className="text-xs text-gray-500 font-mono mt-0.5">Vol: 2.4M</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-lg font-bold text-slate-900 dark:text-white transition-colors duration-300">
                                                ${priceData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                            <p className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Alerts Grid Section */}
                <div className="lg:col-span-2 flex flex-col gap-4 staggered-fade-in" style={{ animationDelay: '300ms' }}>
                    <div className="bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl p-6 flex-1 flex flex-col shadow-sm">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Active Sentinels</h3>
                             <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-full text-xs font-bold text-gray-500">{alerts.length}</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 content-start">
                            {alerts.map((alert) => {
                                const isActive = alert.status === 'Active';
                                const animationClass = alert.isNew ? 'animate-slide-in-top' : alert.isDeleting ? 'animate-fade-out-shrink' : '';
                                const flashClass = alert.justTriggered ? 'animate-flash-red' : '';

                                return (
                                    <div 
                                        key={alert.id} 
                                        className={`relative group p-5 bg-gray-50 dark:bg-brand-darkest/30 border border-gray-200 dark:border-brand-border-dark rounded-2xl transition-all duration-300 hover:shadow-lg hover:border-brand-primary/30 ${animationClass} ${flashClass}`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">{alert.asset}</span>
                                                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded text-gray-500">{alert.triggerType}</span>
                                            </div>
                                            <div className={`relative flex items-center justify-center w-3 h-3`}>
                                                {isActive && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping"></span>}
                                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                                            </div>
                                        </div>
                                        
                                        <p className="font-mono text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">{alert.condition}</p>
                                        
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/5">
                                            <div className="flex gap-1">
                                                {alert.notificationChannels.map(channel => (
                                                    <span key={channel} className="text-[10px] bg-white dark:bg-brand-dark border border-gray-200 dark:border-white/10 px-2 py-1 rounded text-gray-500">{channel}</span>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteAlert(alert.id)} 
                                                className="text-gray-400 hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 opacity-0 group-hover:opacity-100"
                                                title="Delete Alert"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Add New Placeholder */}
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-400 hover:text-brand-primary hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all min-h-[160px] group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </div>
                                <span className="text-sm font-medium">Add New Sentinel</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertsWatchlist;

