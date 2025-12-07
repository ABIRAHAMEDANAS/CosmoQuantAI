
import React, { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import { Logo } from '@/constants';
import HomePage from './HomePage';
import ServicesPage from './ServicesPage';
import PricingPage from './PricingPage';
import ThemeToggle from '@/components/common/ThemeToggle';
import BlogPage from './BlogPage';
import PortfolioPage from './PortfolioPage';

type PublicView = 'Home' | 'Services' | 'Pricing' | 'Portfolio' | 'Blog';

interface PublicWebsiteProps {
    onLogin: () => void;
    onSignUp: () => void;
}

const NavLink: React.FC<{
    children: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
}> = ({ children, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`relative px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${isActive
                ? 'text-white bg-brand-primary shadow-lg shadow-brand-primary/25'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/10'
            }`}
    >
        {children}
    </button>
);

const PublicHeader: React.FC<{
    onLogin: () => void;
    onSignUp: () => void;
    currentView: PublicView;
    setCurrentView: (view: PublicView) => void;
}> = ({ onLogin, onSignUp, currentView, setCurrentView }) => {
    const navItems: PublicView[] = ['Services', 'Portfolio', 'Pricing', 'Blog'];
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center pt-6 px-4 pointer-events-none`}>
            <nav className={`pointer-events-auto w-full max-w-[95%] rounded-full transition-all duration-500 border flex items-center justify-between ${scrolled
                    ? 'bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl border-gray-200 dark:border-white/10 shadow-2xl py-3 px-6'
                    : 'bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/20 dark:border-white/10 shadow-lg py-4 px-8'
                }`}>
                <div className="flex items-center gap-4 lg:gap-8">
                    <button onClick={() => setCurrentView('Home')} className="transform hover:scale-105 transition-transform">
                        <Logo className="!text-xl" />
                    </button>

                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <NavLink key={item} onClick={() => setCurrentView(item)} isActive={currentView === item}>
                                {item}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="hidden lg:block flex-1 max-w-md mx-8">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400 group-focus-within:text-brand-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search assets, strategies..."
                            className="w-full bg-gray-100/50 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white dark:focus:bg-black/40 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <ThemeToggle />
                    <div className="hidden md:block w-px h-5 bg-gray-300 dark:bg-white/20 mx-1"></div>
                    <div className="hidden md:flex items-center space-x-3">
                        <button onClick={onLogin} className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-primary dark:hover:text-brand-primary transition-colors px-2">
                            Log In
                        </button>
                        <Button variant="primary" onClick={onSignUp} className="!py-2 !px-6 !rounded-full text-sm shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40">
                            Get Started
                        </Button>
                    </div>
                </div>
            </nav>
        </header>
    );
};

const PublicFooter: React.FC = () => (
    <footer className="bg-white dark:bg-brand-dark border-t border-brand-border-light dark:border-brand-border-dark pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="col-span-2 md:col-span-1">
                    <Logo />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        Empowering traders with institutional-grade algorithms and AI-driven insights. Stop guessing, start quantifying.
                    </p>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Platform</h3>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <li><a href="#" className="hover:text-brand-primary transition-colors">AI Foundry</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Backtester</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Bot Lab</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Portfolio</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Resources</h3>
                    <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Documentation</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">API Reference</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Blog</a></li>
                        <li><a href="#" className="hover:text-brand-primary transition-colors">Community</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Stay Updated</h3>
                    <div className="flex flex-col gap-2">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="bg-gray-100 dark:bg-brand-darkest border border-transparent focus:border-brand-primary rounded-lg px-4 py-2 text-sm outline-none transition-colors"
                        />
                        <Button variant="secondary" className="!py-2 text-sm w-full">Subscribe</Button>
                    </div>
                </div>
            </div>
            <div className="border-t border-brand-border-light dark:border-brand-border-dark/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} CosmoQuantAI. All rights reserved.</p>
                <div className="flex gap-6 text-sm text-gray-400">
                    <a href="#" className="hover:text-brand-primary">Privacy Policy</a>
                    <a href="#" className="hover:text-brand-primary">Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
);


const PublicWebsite: React.FC<PublicWebsiteProps> = ({ onLogin, onSignUp }) => {
    const [currentView, setCurrentView] = useState<PublicView>('Home');

    const renderContent = () => {
        switch (currentView) {
            case 'Services': return <ServicesPage />;
            case 'Pricing': return <PricingPage />;
            case 'Blog': return <BlogPage />;
            case 'Portfolio': return <PortfolioPage onSignUp={onSignUp} />;
            case 'Home':
            default:
                return <HomePage onLogin={onLogin} onSignUp={onSignUp} />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-brand-light dark:bg-brand-darkest text-slate-900 dark:text-white selection:bg-brand-primary/30">
            <PublicHeader onLogin={onLogin} onSignUp={onSignUp} currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-grow pt-20">
                {renderContent()}
            </main>
            {currentView === 'Home' && <PublicFooter />}
        </div>
    );
};

export default PublicWebsite;

