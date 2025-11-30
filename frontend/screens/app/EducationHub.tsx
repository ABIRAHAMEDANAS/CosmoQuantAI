
import React, { useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import { EDUCATION_CONTENT, BookOpenIcon, PlayIcon, GlobeIcon, ArticleIcon, PodcastIcon, SocialIcon, ToolIcon, CoinMarketCapLogo, MOCK_CMC_ARTICLES, MOCK_CMC_TRENDING_COINS, MOCK_CMC_GLOSSARY_TERMS, MOCK_CMC_LEARN_CAMPAIGNS, StrategyIcon } from '../../constants';
import type { EducationResource, CmcArticle, CmcTrendingCoin, CmcGlossaryTerm, CmcLearnCampaign } from '../../types';
import Button from '../../components/ui/Button';
import { useToast } from '../../contexts/ToastContext';

// --- Icons ---

const SearchIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const TrophyIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const FireIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
    </svg>
);

// --- Component Configurations ---

const resourceTypeConfig: Record<EducationResource['type'], { icon: React.ReactNode, color: string, bg: string }> = {
    'Concept': { icon: <BookOpenIcon className="h-4 w-4" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'Article': { icon: <ArticleIcon className="h-4 w-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    'Video': { icon: <PlayIcon className="h-4 w-4" />, color: 'text-red-500', bg: 'bg-red-500/10' },
    'Course': { icon: <GlobeIcon className="h-4 w-4" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    'Book': { icon: <BookOpenIcon className="h-4 w-4" />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'Social': { icon: <SocialIcon className="h-4 w-4" />, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    'Podcast': { icon: <PodcastIcon className="h-4 w-4" />, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    'Tool': { icon: <ToolIcon className="h-4 w-4" />, color: 'text-gray-500', bg: 'bg-gray-500/10' },
};

const LearningTrackCard: React.FC<{ title: string; desc: string; progress: number; level: string; color: string }> = ({ title, desc, progress, level, color }) => (
    <div className="group relative min-w-[280px] p-5 rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-brand-dark hover:border-brand-primary/50 transition-all duration-300 cursor-pointer hover:shadow-xl">
        <div className={`absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${color}`}></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300">{level}</span>
                <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
                    <PlayIcon className="h-4 w-4" />
                </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-primary transition-colors">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">{desc}</p>
            
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>PROGRESS</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    </div>
);

const ResourceCard: React.FC<{ resource: EducationResource }> = ({ resource }) => {
    const config = resourceTypeConfig[resource.type];
    
    const cardContent = (
        <div className="flex flex-col h-full p-5 bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl hover:shadow-lg hover:border-brand-primary/30 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            {/* Decorative Gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent group-hover:via-brand-primary transition-all duration-500"></div>
            
            <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg ${config.bg} ${config.color}`}>
                    {config.icon}
                </div>
                {resource.source && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 border border-gray-100 dark:border-white/10 px-2 py-0.5 rounded-full">
                        {resource.source}
                    </span>
                )}
            </div>
            
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-brand-primary transition-colors">
                {resource.title}
            </h3>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 flex-grow leading-relaxed">
                {resource.description}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-auto">
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-1 rounded">
                    {resource.category}
                </span>
                {resource.link && (
                    <span className="text-xs font-bold text-brand-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        Open <ExternalLinkIcon />
                    </span>
                )}
            </div>
        </div>
    );

    return resource.link ? (
        <a href={resource.link} target="_blank" rel="noopener noreferrer" className="block h-full">{cardContent}</a>
    ) : (
        <div className="h-full">{cardContent}</div>
    );
};

const CoinMarketCapCorner: React.FC = () => {
    const { showToast } = useToast();
    const [glossarySearch, setGlossarySearch] = useState('');
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

    const filteredGlossary = useMemo(() => MOCK_CMC_GLOSSARY_TERMS.filter(item => 
        item.term.toLowerCase().includes(glossarySearch.toLowerCase()) || 
        item.definition.toLowerCase().includes(glossarySearch.toLowerCase())
    ), [glossarySearch]);
    
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-slide-up">
            {/* Trending Section */}
            <Card className="!p-0 overflow-hidden border-0 shadow-lg bg-white dark:bg-brand-dark">
                 <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center">
                     <div className="flex items-center gap-2">
                         <FireIcon className="text-orange-300 animate-pulse" />
                         <h3 className="font-bold">Trending Now</h3>
                     </div>
                     <CoinMarketCapLogo className="h-4 w-auto text-white opacity-80" />
                 </div>
                 <div className="divide-y divide-gray-100 dark:divide-white/5">
                     {MOCK_CMC_TRENDING_COINS.map((coin, i) => (
                         <div key={coin.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-brand-darkest/30 transition-colors">
                             <div className="flex items-center gap-3">
                                 <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                                 {coin.logo}
                                 <div>
                                     <p className="text-sm font-bold text-slate-900 dark:text-white">{coin.symbol}</p>
                                     <p className="text-[10px] text-gray-500">{coin.name}</p>
                                 </div>
                             </div>
                             <div className="text-right">
                                 <p className="text-sm font-mono font-medium text-slate-900 dark:text-white">${coin.price.toFixed(2)}</p>
                                 <p className={`text-xs font-bold ${coin.change24h >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                     {coin.change24h > 0 ? '+' : ''}{coin.change24h}%
                                 </p>
                             </div>
                         </div>
                     ))}
                 </div>
            </Card>

            {/* Learn & Earn Section */}
            <Card className="!p-0 overflow-hidden border-0 shadow-lg bg-white dark:bg-brand-dark relative">
                <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none"></div>
                <div className="p-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrophyIcon className="text-yellow-500" /> Learn & Earn
                    </h3>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-500/20">
                        Rewards Live
                    </span>
                </div>
                <div className="p-4 space-y-3">
                    {MOCK_CMC_LEARN_CAMPAIGNS.map(campaign => (
                        <div key={campaign.id} className="group bg-white dark:bg-brand-darkest/50 border border-gray-200 dark:border-white/5 rounded-xl p-3 hover:border-brand-primary/30 transition-all cursor-pointer relative overflow-hidden">
                             <div className="absolute right-0 top-0 w-16 h-16 bg-brand-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                             <div className="relative z-10 flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-white dark:bg-brand-dark p-1 shadow-sm flex items-center justify-center">
                                         {campaign.logo}
                                     </div>
                                     <div>
                                         <p className="text-xs font-bold text-slate-900 dark:text-white">{campaign.project}</p>
                                         <p className="text-[10px] text-brand-primary font-bold">{campaign.reward}</p>
                                     </div>
                                 </div>
                                 <Button size="sm" className="text-[10px] h-6 px-2" onClick={() => showToast('Starting Lesson...', 'info')}>Start</Button>
                             </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Glossary */}
            <Card className="!p-0 overflow-hidden border-0 shadow-lg bg-white dark:bg-brand-dark">
                <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-brand-darkest/30">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Crypto Lexicon</h3>
                </div>
                <div className="p-4 flex flex-col h-[300px]">
                     <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="Define term..."
                            value={glossarySearch}
                            onChange={(e) => setGlossarySearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-brand-darkest border border-transparent focus:border-brand-primary rounded-lg text-xs text-slate-900 dark:text-white outline-none transition-all"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <SearchIcon className="w-3 h-3" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                         {filteredGlossary.length > 0 ? filteredGlossary.map(item => (
                            <div key={item.term} className="group">
                                <button 
                                    onClick={() => setExpandedTerm(prev => prev === item.term ? null : item.term)} 
                                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex justify-between items-center ${expandedTerm === item.term ? 'bg-brand-primary/10 text-brand-primary' : 'bg-gray-50 dark:bg-white/5 text-slate-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                                >
                                    <span className="text-xs font-bold">{item.term}</span>
                                    <span className="text-[10px] opacity-50">{expandedTerm === item.term ? '−' : '+'}</span>
                                </button>
                                {expandedTerm === item.term && (
                                    <div className="p-3 text-xs text-gray-600 dark:text-gray-400 leading-relaxed animate-fade-in-down">
                                        {item.definition}
                                    </div>
                                )}
                            </div>
                         )) : (
                             <p className="text-center text-xs text-gray-400 mt-10">No terms found.</p>
                         )}
                    </div>
                </div>
            </Card>
        </div>
    );
}

const EducationHub: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<EducationResource['category'] | 'All'>('All');

    const categories: Array<EducationResource['category'] | 'All'> = ['All', 'Getting Started', 'Blockchain Fundamentals', 'DeFi (Decentralized Finance)', 'Technical Analysis', 'On-Chain Analysis', 'AI & ML', 'Risk Management', 'Trading Psychology', 'NFTs & Web3', 'Security'];

    const filteredResources = useMemo(() => {
        return EDUCATION_CONTENT.filter(item => {
            const categoryMatch = activeCategory === 'All' || item.category === activeCategory;
            const searchMatch = searchTerm === '' || 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.description.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [searchTerm, activeCategory]);

    return (
        <div className="space-y-12 pb-10">
            
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white p-10 md:p-16 shadow-2xl text-center">
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-primary/30 via-transparent to-purple-600/30 pointer-events-none"></div>
                 <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>

                 <div className="relative z-10 max-w-3xl mx-auto">
                     <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-widest mb-6 text-blue-300">
                         Cosmo Academy
                     </span>
                     <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                         Master the Markets. <br/>
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Quantify Your Edge.</span>
                     </h1>
                     <p className="text-lg text-gray-300 mb-8">
                         From blockchain basics to advanced algorithmic strategies. 
                         Curated resources to take you from novice to institutional-grade quant.
                     </p>
                     <div className="max-w-lg mx-auto relative">
                        <input
                            type="text"
                            placeholder="What do you want to learn today?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-xl"
                        />
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <SearchIcon className="text-gray-400" />
                        </div>
                     </div>
                 </div>
            </div>

            {/* Learning Tracks (Horizontal Scroll) */}
            <div className="staggered-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="flex justify-between items-end mb-6 px-2">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Curated Learning Paths</h2>
                        <p className="text-sm text-gray-500">Structured curriculums to fast-track your growth.</p>
                    </div>
                    <button className="text-sm font-bold text-brand-primary hover:underline">View All Paths</button>
                </div>
                
                <div className="flex gap-6 overflow-x-auto pb-6 px-2 snap-x custom-scrollbar">
                    <LearningTrackCard title="Zero to Algo Trader" desc="The complete roadmap from setting up your environment to deploying your first bot." progress={15} level="Beginner" color="bg-green-500" />
                    <LearningTrackCard title="DeFi Yield Master" desc="Advanced strategies for liquidity provision, farming, and risk management." progress={0} level="Intermediate" color="bg-purple-500" />
                    <LearningTrackCard title="On-Chain Forensics" desc="Learn to read the blockchain like a book using Dune and Nansen." progress={42} level="Advanced" color="bg-orange-500" />
                    <LearningTrackCard title="Technical Analysis 101" desc="Master candlesticks, indicators, and price action patterns." progress={88} level="Beginner" color="bg-blue-500" />
                </div>
            </div>

            {/* Market Intelligence (CMC) */}
            <div className="staggered-fade-in" style={{ animationDelay: '200ms' }}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 px-2">Market Intelligence</h2>
                <CoinMarketCapCorner />
            </div>

            {/* Library Grid */}
            <section className="staggered-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="sticky top-4 z-20 bg-white/90 dark:bg-brand-darkest/90 backdrop-blur-md py-4 border-b border-gray-100 dark:border-white/5 mb-8">
                     <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-4 py-2 text-xs font-bold rounded-full border transition-all whitespace-nowrap ${
                                    activeCategory === category 
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-md' 
                                        : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredResources.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
                        {filteredResources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                        <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">No resources found matching your criteria.</p>
                        <Button variant="secondary" className="mt-4" onClick={() => { setSearchTerm(''); setActiveCategory('All'); }}>Clear Filters</Button>
                    </div>
                )}
            </section>
        </div>
    );
};

export default EducationHub;
