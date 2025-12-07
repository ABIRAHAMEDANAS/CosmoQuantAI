import React, { useState, useMemo } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { MOCK_BLOG_POSTS, MOCK_STRATEGY_OF_THE_WEEK, StrategyIcon, TutorialIcon, AnalysisIcon, AiMlIcon } from '@/constants';
import type { BlogPost } from '@/types';

type Category = 'All' | 'Strategies' | 'Tutorials' | 'Market Analysis' | 'AI & ML';

const categoryIcons: Record<Category, React.ReactNode> = {
    'All': <></>,
    'Strategies': <StrategyIcon />,
    'Tutorials': <TutorialIcon />,
    'Market Analysis': <AnalysisIcon />,
    'AI & ML': <AiMlIcon />,
};

const BlogCard: React.FC<{ post: BlogPost; featured?: boolean }> = ({ post, featured }) => (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-brand-dark border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${featured ? 'md:flex-row md:col-span-2 md:h-96' : 'h-full'}`}>
        <div className={`relative overflow-hidden ${featured ? 'md:w-1/2 h-64 md:h-full' : 'h-52'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <span className="absolute top-4 left-4 z-20 text-[10px] font-bold uppercase tracking-widest bg-white/90 dark:bg-black/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-brand-primary">
                {post.category}
            </span>
        </div>

        <div className={`p-8 flex flex-col flex-grow relative z-10 ${featured ? 'md:w-1/2 justify-center' : ''}`}>
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                <span className="flex items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-primary to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {post.author[0]}
                    </div>
                    {post.author}
                </span>
                <span>•</span>
                <span>{post.date}</span>
            </div>

            <h3 className={`${featured ? 'text-3xl' : 'text-xl'} font-bold text-slate-900 dark:text-white mb-3 group-hover:text-brand-primary transition-colors leading-tight`}>
                {post.title}
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3 leading-relaxed">
                {post.excerpt}
            </p>

            <div className="mt-auto">
                <span className="text-sm font-semibold text-brand-primary group-hover:underline flex items-center gap-1">
                    Read Article
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </span>
            </div>
        </div>
    </div>
);

const NewsletterSection: React.FC = () => (
    <div className="relative my-16 rounded-3xl overflow-hidden bg-slate-900 px-6 py-12 sm:px-12 sm:py-16 lg:flex lg:items-center lg:p-20 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

        <div className="lg:w-1/2 lg:pr-16 relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Direct Alpha to your Inbox.
            </h2>
            <p className="mt-4 text-lg text-gray-300">
                Join 15,000+ quants receiving our weekly breakdown of market structure, new algo strategies, and machine learning research.
            </p>
        </div>
        <div className="mt-8 lg:mt-0 lg:w-1/2 relative z-10">
            <form className="sm:flex gap-2">
                <input
                    type="email"
                    required
                    className="w-full rounded-full border-white/10 bg-white/5 px-5 py-3 text-white placeholder-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-slate-900 backdrop-blur-sm transition-all"
                    placeholder="Enter your email"
                />
                <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Button type="submit" variant="primary" className="w-full rounded-full py-3 px-6 shadow-lg shadow-brand-primary/25">
                        Subscribe
                    </Button>
                </div>
            </form>
            <p className="mt-3 text-sm text-gray-400">
                We care about your data. Read our <a href="#" className="text-white underline">Privacy Policy</a>.
            </p>
        </div>
    </div>
);

const BlogPage: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<Category>('All');

    // Get the very first featured post for the hero section
    const heroPost = useMemo(() => MOCK_BLOG_POSTS.find(p => p.isFeatured), []);

    // Filter the rest, excluding the hero post if visible
    const filteredPosts = useMemo(() => {
        let posts = MOCK_BLOG_POSTS;
        if (activeCategory !== 'All') {
            posts = posts.filter(p => p.category === activeCategory);
        }
        // If displaying 'All', exclude the hero post from the grid to avoid duplication
        if (activeCategory === 'All' && heroPost) {
            return posts.filter(p => p.id !== heroPost.id);
        }
        return posts;
    }, [activeCategory, heroPost]);

    const categories: Category[] = ['All', 'Strategies', 'Tutorials', 'Market Analysis', 'AI & ML'];

    return (
        <div className="bg-gray-50 dark:bg-brand-darkest min-h-screen">

            {/* Header Background */}
            <div className="relative bg-slate-900 pt-32 pb-48 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 to-slate-900"></div>
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent"></div>
                </div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6">
                        The Quant <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400">Log</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Deep dives into algorithmic trading, machine learning, and market microstructure.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-20 pb-24">

                {/* Category Navigation */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-full shadow-lg overflow-x-auto max-w-full">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${activeCategory === category
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                    }`}
                            >
                                {categoryIcons[category]}
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Hero Article (Only visible on 'All') */}
                {activeCategory === 'All' && heroPost && (
                    <div className="mb-12 animate-fade-in-slide-up">
                        <BlogCard post={heroPost} featured={true} />
                    </div>
                )}

                {/* Strategy of the Week - "The Black Box" Look */}
                <section className="mb-16 animate-fade-in-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="rounded-3xl bg-slate-950 border border-brand-primary/20 overflow-hidden shadow-2xl relative group">
                        {/* Code Background Effect */}
                        <div className="absolute inset-0 opacity-10 font-mono text-xs text-brand-primary p-4 overflow-hidden leading-relaxed select-none pointer-events-none">
                            {Array(20).fill("if self.rsi < 30: self.buy() \n elif self.rsi > 70: self.sell()").join("\n")}
                        </div>

                        <div className="grid md:grid-cols-2 relative z-10">
                            <div className="p-10 flex flex-col justify-center border-b md:border-b-0 md:border-r border-brand-primary/10 bg-slate-900/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Strategy of the Week</span>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">{MOCK_STRATEGY_OF_THE_WEEK.title}</h2>
                                <p className="text-gray-400 mb-8 leading-relaxed">{MOCK_STRATEGY_OF_THE_WEEK.description}</p>

                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Backtest Profit</p>
                                        <p className="text-2xl font-mono font-bold text-green-400">+{MOCK_STRATEGY_OF_THE_WEEK.results.profit}%</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Max Drawdown</p>
                                        <p className="text-2xl font-mono font-bold text-red-400">{MOCK_STRATEGY_OF_THE_WEEK.results.drawdown}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-black/40 flex flex-col">
                                <div className="flex items-center justify-between text-gray-500 text-xs font-mono mb-2 px-2">
                                    <span>ai_foundry_prompt.txt</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                    </div>
                                </div>
                                <div className="flex-grow bg-slate-900 rounded-xl p-4 border border-white/5 font-mono text-sm text-gray-300 overflow-hidden relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary/50"></div>
                                    <p className="pl-4">
                                        <span className="text-purple-400">Prompt:</span><br />
                                        "{MOCK_STRATEGY_OF_THE_WEEK.aiPrompt}"
                                    </p>
                                    <p className="pl-4 mt-4 text-brand-primary animate-pulse">_</p>
                                </div>
                                <div className="mt-4 text-right">
                                    <Button variant="outline" className="text-xs py-2 border-white/20 text-white hover:bg-white hover:text-black">Run in Backtester</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Main Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {filteredPosts.map((post, index) => (
                        <div key={post.id} className="animate-fade-in-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                            <BlogCard post={post} />
                        </div>
                    ))}
                </div>

                <NewsletterSection />
            </div>
        </div>
    );
};

export default BlogPage;
