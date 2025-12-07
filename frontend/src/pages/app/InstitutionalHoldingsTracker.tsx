
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Card from '@/components/common/Card';
import { MOCK_GURUS, MOCK_HOLDINGS, MOCK_SECTOR_ALLOCATION, MOCK_AGGREGATE_MOVERS } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import type { Holding } from '@/types';

// Icons
const BriefcaseIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
);
const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);
const TrendingDownIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>
);
const UserGroupIcon = ({ className = "w-5 h-5" }) => (
     <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const HoldingDetailModal: React.FC<{ holding: Holding; onClose: () => void }> = ({ holding, onClose }) => {
  const { theme } = useTheme();
  const axisColor = theme === 'dark' ? '#9CA3AF' : '#6B7280';
  const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';

  const historyData = holding.history.slice().reverse(); // Reverse for chronological chart

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-backdrop-fade-in" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-brand-dark w-full max-w-3xl rounded-2xl shadow-2xl border border-brand-border-light dark:border-brand-border-dark flex flex-col overflow-hidden animate-modal-content-slide-down" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-center p-6 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/50">
            <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-lg">
                    {holding.ticker[0]}
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{holding.ticker}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{holding.company}</p>
                 </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </header>
        
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-brand-darkest/50 p-4 rounded-xl border border-brand-border-light dark:border-brand-border-dark">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Shares Held</p>
                  <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">{holding.shares.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-brand-darkest/50 p-4 rounded-xl border border-brand-border-light dark:border-brand-border-dark">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Market Value</p>
                  <p className="text-xl font-mono font-bold text-brand-primary">${(holding.marketValue/1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-gray-50 dark:bg-brand-darkest/50 p-4 rounded-xl border border-brand-border-light dark:border-brand-border-dark">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold mb-1">Portfolio %</p>
                  <p className="text-xl font-mono font-bold text-slate-900 dark:text-white">{holding.portfolioPercentage.toFixed(2)}%</p>
              </div>
              <div className={`p-4 rounded-xl border border-transparent ${holding.action === 'Added' || holding.action === 'New' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : holding.action === 'Reduced' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-gray-100 dark:bg-brand-darkest/50 text-gray-600 dark:text-gray-300'}`}>
                  <p className="text-xs uppercase tracking-wider font-semibold mb-1 opacity-80">Last Action</p>
                  <p className="text-xl font-bold">{holding.action}</p>
              </div>
          </div>

          <div className="bg-white dark:bg-brand-dark rounded-xl border border-brand-border-light dark:border-brand-border-dark p-4">
            <h3 className="text-sm font-bold mb-4 text-slate-900 dark:text-white uppercase tracking-wider">Historical Position Size</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="quarter" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={axisColor} fontSize={10} tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Shares']} 
                    contentStyle={theme === 'dark' ? { backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px'} : { borderRadius: '8px' }}
                    cursor={{fill: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                  />
                  <Bar dataKey="shares" radius={[4, 4, 0, 0]}>
                    {historyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.action === 'Added' || entry.action === 'New' ? '#10B981' : entry.action === 'Reduced' || entry.action === 'Sold Out' ? '#F43F5E' : '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InstitutionalHoldingsTracker: React.FC = () => {
    const [selectedGuruId, setSelectedGuruId] = useState(MOCK_GURUS[0].id);
    const [activeTab, setActiveTab] = useState<'holdings' | 'sector' | 'movers'>('holdings');
    const [selectedHolding, setSelectedHolding] = useState<Holding | null>(null);

    const selectedGuru = useMemo(() => MOCK_GURUS.find(g => g.id === selectedGuruId), [selectedGuruId]);
    const holdingsData = useMemo(() => MOCK_HOLDINGS[selectedGuruId as keyof typeof MOCK_HOLDINGS] || [], [selectedGuruId]);
    const sectorData = useMemo(() => MOCK_SECTOR_ALLOCATION[selectedGuruId as keyof typeof MOCK_SECTOR_ALLOCATION] || [], [selectedGuruId]);

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'New': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">NEW</span>;
            case 'Added': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">ADDED</span>;
            case 'Reduced': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">REDUCED</span>;
            case 'Sold Out': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-500/10 text-gray-500 border border-gray-500/20">SOLD</span>;
            default: return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">HOLD</span>;
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
            {selectedHolding && <HoldingDetailModal holding={selectedHolding} onClose={() => setSelectedHolding(null)} />}

            {/* Guru Selector Deck */}
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x flex-shrink-0 staggered-fade-in">
                {MOCK_GURUS.map((guru, index) => (
                    <button 
                        key={guru.id}
                        onClick={() => setSelectedGuruId(guru.id)}
                        className={`flex-shrink-0 snap-start w-72 p-5 rounded-2xl border transition-all duration-300 text-left group ${
                            selectedGuruId === guru.id 
                            ? 'bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/25 scale-[1.02]' 
                            : 'bg-white dark:bg-brand-dark border-brand-border-light dark:border-brand-border-dark hover:border-brand-primary/50'
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-lg truncate">{guru.name}</h3>
                                <p className={`text-xs ${selectedGuruId === guru.id ? 'text-white/80' : 'text-gray-500'}`}>{guru.manager}</p>
                            </div>
                            <BriefcaseIcon className={`w-5 h-5 ${selectedGuruId === guru.id ? 'text-white' : 'text-gray-400'}`} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4">
                             <div>
                                 <p className={`text-[10px] uppercase tracking-wider font-bold ${selectedGuruId === guru.id ? 'text-white/60' : 'text-gray-400'}`}>AUM</p>
                                 <p className="font-mono font-bold text-sm">${(guru.portfolioValue/1_000_000_000).toFixed(1)}B</p>
                             </div>
                             <div className="text-right">
                                 <p className={`text-[10px] uppercase tracking-wider font-bold ${selectedGuruId === guru.id ? 'text-white/60' : 'text-gray-400'}`}>Holdings</p>
                                 <p className="font-mono font-bold text-sm">{guru.stockCount}</p>
                             </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                
                {/* Left: Holdings Table */}
                <div className="lg:col-span-2 flex flex-col min-h-0 staggered-fade-in" style={{ animationDelay: '200ms' }}>
                    <Card className="flex-1 flex flex-col !p-0 border-0 shadow-xl overflow-hidden bg-white dark:bg-brand-dark">
                        <div className="flex justify-between items-center p-4 border-b border-brand-border-light dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30">
                            <div className="flex gap-4">
                                <button onClick={() => setActiveTab('holdings')} className={`text-sm font-bold transition-colors ${activeTab === 'holdings' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Holdings</button>
                                <button onClick={() => setActiveTab('movers')} className={`text-sm font-bold transition-colors ${activeTab === 'movers' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}>Top Movers</button>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">Filing: {selectedGuru?.latestFiling}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                             {activeTab === 'holdings' && (
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-white dark:bg-brand-dark z-10 shadow-sm text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Ticker</th>
                                            <th className="p-4 text-right">Shares</th>
                                            <th className="p-4 text-right">Value</th>
                                            <th className="p-4 text-right">% Port</th>
                                            <th className="p-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-brand-border-dark">
                                        {holdingsData.map((holding) => (
                                            <tr 
                                                key={holding.ticker} 
                                                onClick={() => setSelectedHolding(holding)}
                                                className="hover:bg-gray-50 dark:hover:bg-brand-darkest/50 transition-colors cursor-pointer group"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-xs text-gray-500 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                                                            {holding.ticker[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{holding.ticker}</p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[120px]">{holding.company}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-mono text-sm text-gray-600 dark:text-gray-300">
                                                    {holding.shares.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">
                                                    ${(holding.marketValue/1_000_000).toFixed(1)}M
                                                </td>
                                                <td className="p-4 text-right text-sm text-gray-600 dark:text-gray-300">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>{holding.portfolioPercentage.toFixed(2)}%</span>
                                                        <div className="w-12 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-brand-primary" style={{ width: `${holding.portfolioPercentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    {getActionBadge(holding.action)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             )}
                             
                             {activeTab === 'movers' && (
                                 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div>
                                         <h4 className="text-sm font-bold text-emerald-500 mb-4 flex items-center gap-2"><TrendingUpIcon /> Most Buying</h4>
                                         <div className="space-y-3">
                                             {MOCK_AGGREGATE_MOVERS.topBuys.map(mover => (
                                                 <div key={mover.ticker} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-lg bg-white dark:bg-brand-dark flex items-center justify-center font-bold text-emerald-600 shadow-sm">{mover.ticker[0]}</div>
                                                         <div>
                                                             <p className="font-bold text-slate-900 dark:text-white">{mover.ticker}</p>
                                                             <p className="text-xs text-gray-500">{mover.company}</p>
                                                         </div>
                                                     </div>
                                                     <div className="text-right">
                                                         <p className="font-bold text-emerald-600 dark:text-emerald-400">${(mover.totalValue/1_000_000_000).toFixed(1)}B</p>
                                                         <p className="text-xs text-gray-400">{mover.funds} funds</p>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                     <div>
                                         <h4 className="text-sm font-bold text-rose-500 mb-4 flex items-center gap-2"><TrendingDownIcon /> Most Selling</h4>
                                         <div className="space-y-3">
                                             {MOCK_AGGREGATE_MOVERS.topSells.map(mover => (
                                                 <div key={mover.ticker} className="flex items-center justify-between p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-lg bg-white dark:bg-brand-dark flex items-center justify-center font-bold text-rose-600 shadow-sm">{mover.ticker[0]}</div>
                                                         <div>
                                                             <p className="font-bold text-slate-900 dark:text-white">{mover.ticker}</p>
                                                             <p className="text-xs text-gray-500">{mover.company}</p>
                                                         </div>
                                                     </div>
                                                     <div className="text-right">
                                                         <p className="font-bold text-rose-600 dark:text-rose-400">${(mover.totalValue/1_000_000_000).toFixed(1)}B</p>
                                                         <p className="text-xs text-gray-400">{mover.funds} funds</p>
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </Card>
                </div>

                {/* Right: Sector & Stats */}
                <div className="flex flex-col gap-6 min-h-0 staggered-fade-in" style={{ animationDelay: '300ms' }}>
                    <Card className="flex-1 flex flex-col !p-0 border-0 shadow-lg bg-white dark:bg-brand-dark overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-brand-border-dark">
                            <h3 className="font-bold text-slate-900 dark:text-white">Sector Allocation</h3>
                        </div>
                        <div className="flex-1 p-4 relative">
                             <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={sectorData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={60} 
                                        outerRadius={80} 
                                        paddingAngle={5}
                                    >
                                        {sectorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#64748B'][index % 6]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{sectorData.length}</p>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Sectors</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t border-gray-100 dark:border-brand-border-dark bg-gray-50 dark:bg-brand-darkest/30">
                            <div className="flex flex-wrap gap-3 justify-center">
                                {sectorData.map((entry, index) => (
                                    <div key={entry.name} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#6366F1', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#64748B'][index % 6] }}></div>
                                        {entry.name} ({entry.value}%)
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>
                    
                    <div className="bg-gradient-to-br from-brand-primary to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                             <UserGroupIcon className="w-6 h-6 text-white/80" />
                             <h3 className="font-bold text-lg">Crowd Wisdom</h3>
                        </div>
                        <p className="text-sm text-white/80 mb-4 leading-relaxed">
                            Institutions are heavily accumulating <span className="font-bold text-white">Technology</span> and <span className="font-bold text-white">AI</span> stocks this quarter, while reducing exposure to Energy.
                        </p>
                        <button className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-colors">
                            View Deep Dive Report
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InstitutionalHoldingsTracker;

