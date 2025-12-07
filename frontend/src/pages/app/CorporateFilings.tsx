
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { generateNewFiling } from '@/constants';
import type { InsiderFiling } from '@/types';
import { useToast } from '@/context/ToastContext';

type InsiderFilingWithStatus = InsiderFiling & { isNew?: boolean };

// Icons
const BriefcaseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const TrendingUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
const TrendingDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);
const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const AddFilingModal: React.FC<{
    onClose: () => void;
    onAddFiling: (filing: InsiderFiling) => void;
}> = ({ onClose, onAddFiling }) => {
    const initialFormState = {
        ticker: '',
        insiderName: '',
        insiderRole: '',
        transactionType: 'Buy' as 'Buy' | 'Sell',
        transactionDate: new Date().toISOString().split('T')[0],
        shares: '',
        sharePrice: '',
    };
    const [formData, setFormData] = useState(initialFormState);

    const totalValue = useMemo(() => {
        const shares = parseFloat(formData.shares);
        const price = parseFloat(formData.sharePrice);
        return isNaN(shares) || isNaN(price) ? 0 : shares * price;
    }, [formData.shares, formData.sharePrice]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newFiling: InsiderFiling = {
            id: `manual_${new Date().getTime()}`,
            ticker: formData.ticker.toUpperCase(),
            insiderName: formData.insiderName,
            insiderRole: formData.insiderRole,
            transactionType: formData.transactionType,
            transactionDate: formData.transactionDate,
            shares: parseFloat(formData.shares),
            sharePrice: parseFloat(formData.sharePrice),
            totalValue: totalValue,
        };
        onAddFiling(newFiling);
        onClose();
    };

    const inputBaseClasses = "w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-primary outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-dark w-full max-w-2xl rounded-2xl shadow-2xl border border-brand-border-light dark:border-brand-border-dark flex flex-col overflow-hidden animate-modal-content-slide-down" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-brand-border-light dark:border-brand-border-dark flex justify-between items-center bg-gray-50 dark:bg-brand-darkest/50">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BriefcaseIcon className="text-brand-primary" />
                        Manual Filing Entry
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">&times;</button>
                </div>
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ticker Symbol</label>
                                <input type="text" name="ticker" value={formData.ticker} onChange={handleChange} required className={inputBaseClasses} placeholder="e.g. MSFT" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transaction Date</label>
                                <input type="date" name="transactionDate" value={formData.transactionDate} onChange={handleChange} required className={inputBaseClasses} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Insider Name</label>
                                <input type="text" name="insiderName" value={formData.insiderName} onChange={handleChange} required className={inputBaseClasses} placeholder="e.g. Satya Nadella" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role / Title</label>
                                <input type="text" name="insiderRole" value={formData.insiderRole} onChange={handleChange} required className={inputBaseClasses} placeholder="e.g. CEO" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Share Count</label>
                                <input type="number" name="shares" value={formData.shares} onChange={handleChange} required className={inputBaseClasses} placeholder="0" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price per Share ($)</label>
                                <input type="number" step="0.01" name="sharePrice" value={formData.sharePrice} onChange={handleChange} required className={inputBaseClasses} placeholder="0.00" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                                <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800/50 p-1">
                                    <button type="button" onClick={() => setFormData({ ...formData, transactionType: 'Buy' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.transactionType === 'Buy' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Buy</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, transactionType: 'Sell' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.transactionType === 'Sell' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>Sell</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Estimated Value</label>
                                <div className="w-full bg-gray-100 dark:bg-brand-darkest/50 rounded-xl p-3 text-slate-900 dark:text-white font-mono font-bold border border-transparent focus-within:border-brand-primary">
                                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button type="submit" variant="primary" className="shadow-lg shadow-brand-primary/20">Submit Filing</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


const CorporateFilings: React.FC = () => {
    const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'TSLA', 'MSFT', 'NVDA']);
    const [newTicker, setNewTicker] = useState('');
    const [filings, setFilings] = useState<InsiderFilingWithStatus[]>(() => [
        { ...generateNewFiling(['AAPL', 'TSLA', 'MSFT', 'NVDA']), isNew: false },
        { ...generateNewFiling(['AAPL', 'TSLA', 'MSFT', 'NVDA']), isNew: false },
        { ...generateNewFiling(['AAPL', 'TSLA', 'MSFT', 'NVDA']), isNew: false },
        { ...generateNewFiling(['AAPL', 'TSLA', 'MSFT', 'NVDA']), isNew: false },
        { ...generateNewFiling(['AAPL', 'TSLA', 'MSFT', 'NVDA']), isNew: false },
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<'All' | 'Buy' | 'Sell'>('All');

    const { showToast } = useToast();
    const timersRef = useRef<number[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (watchlist.length > 0) {
                const newFiling: InsiderFilingWithStatus = { ...generateNewFiling(watchlist), isNew: true };
                setFilings(currentFilings => [newFiling, ...currentFilings].slice(0, 50));

                showToast(`${newFiling.transactionType.toUpperCase()}: ${newFiling.insiderName} (${newFiling.ticker})`, newFiling.transactionType === 'Buy' ? 'success' : 'warning');

                const timerId = window.setTimeout(() => {
                    setFilings(current => current.map(f => f.id === newFiling.id ? { ...f, isNew: false } : f));
                }, 2000);
                timersRef.current.push(timerId);
            }
        }, 6000);

        return () => {
            clearInterval(interval);
            timersRef.current.forEach(clearTimeout);
            timersRef.current = [];
        };
    }, [watchlist, showToast]);

    const handleAddTicker = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTicker && !watchlist.includes(newTicker.toUpperCase())) {
            setWatchlist([...watchlist, newTicker.toUpperCase()]);
            setNewTicker('');
        }
    };

    const handleAddFiling = (newFilingData: InsiderFiling) => {
        const newFiling: InsiderFilingWithStatus = { ...newFilingData, isNew: true };
        setFilings(currentFilings => [newFiling, ...currentFilings]);
        showToast('Filing logged manually.', 'success');
        const timerId = window.setTimeout(() => {
            setFilings(current => current.map(f => f.id === newFiling.id ? { ...f, isNew: false } : f));
        }, 2000);
        timersRef.current.push(timerId);
    };

    const filteredFilings = useMemo(() => {
        return filings.filter(f => filterType === 'All' || f.transactionType === filterType);
    }, [filings, filterType]);

    // Sentiment Logic
    const sentimentStats = useMemo(() => {
        const buys = filings.filter(f => f.transactionType === 'Buy').reduce((acc, curr) => acc + curr.totalValue, 0);
        const sells = filings.filter(f => f.transactionType === 'Sell').reduce((acc, curr) => acc + curr.totalValue, 0);
        const total = buys + sells;
        const buyRatio = total > 0 ? (buys / total) * 100 : 50;
        return { buys, sells, total, buyRatio };
    }, [filings]);

    const maxFilingValue = useMemo(() => Math.max(...filings.map(f => f.totalValue)), [filings]);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
            {isModalOpen && <AddFilingModal onClose={() => setIsModalOpen(false)} onAddFiling={handleAddFiling} />}

            {/* Header / HUD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0 staggered-fade-in">
                <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-slate-700 !p-5 relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Insider Sentiment (30d)</p>
                            <h2 className={`text-2xl font-bold ${sentimentStats.buyRatio > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {sentimentStats.buyRatio > 50 ? 'Net Accumulation' : 'Net Distribution'}
                            </h2>
                        </div>
                        <div className={`p-3 rounded-full ${sentimentStats.buyRatio > 50 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {sentimentStats.buyRatio > 50 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        </div>
                    </div>

                    {/* Sentiment Bar */}
                    <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden flex">
                        <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${sentimentStats.buyRatio}%` }}></div>
                        <div className="h-full bg-rose-500 flex-1 transition-all duration-1000"></div>
                    </div>
                    <div className="flex justify-between text-[10px] mt-1 text-gray-400">
                        <span>${(sentimentStats.buys/1000000).toFixed(1)}M Bought</span>
                        <span>${(sentimentStats.sells/1000000).toFixed(1)}M Sold</span>
                    </div>
                </Card>

                <Card className="!p-5 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><BriefcaseIcon /></div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Total Volume</h3>
                    </div>
                    <p className="text-3xl font-mono font-bold text-slate-900 dark:text-white">
                        ${(sentimentStats.total/1000000).toFixed(2)}M
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Aggregate transaction value tracked</p>
                </Card>

                <div className="flex flex-col gap-3">
                    <div className="flex-1 bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-xl p-4 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700 dark:text-gray-300">Manual Entry</span>
                        <Button size="sm" onClick={() => setIsModalOpen(true)} className="text-xs h-8">Add Filing</Button>
                    </div>
                    <div className="flex-1 bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-xl p-1 flex">
                        {(['All', 'Buy', 'Sell'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`flex-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterType === type
                                    ? 'bg-brand-primary text-white shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">

                {/* Left: Watchlist Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-4 min-h-0 staggered-fade-in" style={{ animationDelay: '100ms' }}>
                    <Card className="flex-1 flex flex-col !p-0 overflow-hidden border-0 shadow-lg">
                        <div className="p-4 border-b border-gray-100 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Monitoring List</h3>
                        </div>

                        <div className="p-3">
                            <form onSubmit={handleAddTicker} className="relative">
                                <input
                                    type="text"
                                    value={newTicker}
                                    onChange={(e) => setNewTicker(e.target.value)}
                                    placeholder="Add Ticker..."
                                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-lg text-sm focus:ring-2 focus:ring-brand-primary outline-none"
                                />
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {watchlist.map(ticker => (
                                <div key={ticker} className="group flex justify-between items-center p-3 bg-white dark:bg-brand-dark border border-gray-100 dark:border-brand-border-dark rounded-xl hover:shadow-md transition-all hover:border-brand-primary/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                                            {ticker[0]}
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">{ticker}</span>
                                    </div>
                                    <button onClick={() => setWatchlist(watchlist.filter(t => t !== ticker))} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right: Filings Terminal */}
                <div className="lg:col-span-3 flex flex-col min-h-0 staggered-fade-in" style={{ animationDelay: '200ms' }}>
                    <Card className="flex-1 flex flex-col !p-0 border-0 shadow-xl overflow-hidden bg-white dark:bg-brand-dark">
                        <div className="grid grid-cols-12 bg-gray-50 dark:bg-brand-darkest/50 border-b border-gray-200 dark:border-brand-border-dark p-3 text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 z-20">
                            <div className="col-span-2">Ticker</div>
                            <div className="col-span-3">Insider</div>
                            <div className="col-span-2 text-center">Type</div>
                            <div className="col-span-2 text-right">Date</div>
                            <div className="col-span-3 text-right">Value</div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredFilings.length > 0 ? (
                                filteredFilings.map(filing => {
                                    const isBuy = filing.transactionType === 'Buy';
                                    const valuePercent = (filing.totalValue / maxFilingValue) * 100;

                                    return (
                                        <div
                                            key={filing.id}
                                            className={`relative grid grid-cols-12 items-center p-4 border-b border-gray-100 dark:border-brand-border-dark/50 hover:bg-gray-50 dark:hover:bg-brand-darkest/30 transition-all group overflow-hidden ${filing.isNew ? (isBuy ? 'animate-flash-green' : 'animate-flash-red') : ''}`}
                                        >
                                            {/* Volume Bar Background */}
                                            <div
                                                className={`absolute left-0 top-0 bottom-0 opacity-5 transition-all duration-500 pointer-events-none ${isBuy ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                                style={{ width: `${valuePercent}%` }}
                                            ></div>

                                            <div className="col-span-2 relative z-10">
                                                <span className="font-bold text-slate-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-xs">{filing.ticker}</span>
                                            </div>

                                            <div className="col-span-3 flex items-center gap-3 relative z-10">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                    {filing.insiderName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{filing.insiderName}</p>
                                                    <p className="text-xs text-gray-500 truncate">{filing.insiderRole}</p>
                                                </div>
                                            </div>

                                            <div className="col-span-2 text-center relative z-10">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isBuy ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                                                    {filing.transactionType}
                                                </span>
                                            </div>

                                            <div className="col-span-2 text-right text-sm text-gray-500 font-mono relative z-10">
                                                {filing.transactionDate}
                                            </div>

                                            <div className="col-span-3 text-right relative z-10">
                                                <p className="font-bold font-mono text-slate-900 dark:text-white">
                                                    ${filing.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {filing.shares.toLocaleString()} shares @ ${filing.sharePrice.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <BriefcaseIcon className="w-12 h-12 mb-2 stroke-1" />
                                    <p>No filings match criteria</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CorporateFilings;

