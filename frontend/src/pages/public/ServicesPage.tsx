
import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { 
    AIFoundryIcon, 
    BacktesterIcon, 
    BotLabIcon,
    TradingIcon,
    PortfolioIcon, 
    AlphaEngineIcon,
    IdeaIcon,
    TestIcon,
    DeployIcon
} from '@/constants';

const ServiceCard: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    description: string; 
    delay: number;
}> = ({ icon, title, description, delay }) => (
  <div 
    className="group relative p-6 bg-white/5 dark:bg-white/5 backdrop-blur-md border border-gray-200/50 dark:border-white/10 rounded-2xl hover:bg-white/10 dark:hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Hover Glow Effect */}
    <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-primary/20 rounded-full blur-3xl group-hover:bg-brand-primary/30 transition-all duration-500"></div>
    
    <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-4 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

const ProcessStep: React.FC<{ number: string; title: string; desc: string }> = ({ number, title, desc }) => (
    <div className="relative pl-8 border-l-2 border-brand-primary/30 last:border-0 pb-8 last:pb-0">
        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-brand-primary border-4 border-brand-darkest"></div>
        <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-400">{desc}</p>
    </div>
);

const ServicesPage: React.FC = () => {
    const platformFeatures = [
        {
            icon: <AIFoundryIcon />,
            title: "AI Foundry",
            description: "Natural language processing turns your trading ideas into Python code instantly. No syntax errors, just logic."
        },
        {
            icon: <BacktesterIcon />,
            title: "Backtesting Engine",
            description: "Validate strategies against terabytes of historical data. Visualize equity curves, drawdowns, and Sharpe ratios."
        },
        {
            icon: <BotLabIcon />,
            title: "Visual Strategy Builder",
            description: "A node-based drag-and-drop interface for constructing complex logic without writing a single line of code."
        },
        {
            icon: <TradingIcon />,
            title: "Cloud Execution",
            description: "Deploy your bots to our low-latency cloud infrastructure. Run 24/7 with 99.99% uptime guarantee."
        },
        {
            icon: <PortfolioIcon />,
            title: "Portfolio Command",
            description: "Unified tracking across Binance, Coinbase, and DeFi wallets. Real-time P&L and risk exposure analysis."
        },
        {
            icon: <AlphaEngineIcon />,
            title: "Alpha Signals",
            description: "Alternative data feeds including sentiment analysis, on-chain whale movements, and dark pool prints."
        },
    ];

    return (
        <div className="relative bg-gray-50 dark:bg-brand-darkest overflow-hidden">
            
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 text-center px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                    Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-500">Edge</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Whether you want to build it yourself with our advanced tools or need a bespoke solution engineered for you, we have the infrastructure.
                </p>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: SaaS Platform (The Engine) */}
                    <div className="lg:col-span-7 flex flex-col">
                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">The Quant Engine</h2>
                                <p className="text-sm text-brand-primary font-semibold uppercase tracking-wider mt-1">Self-Service Platform</p>
                            </div>
                            <div className="hidden sm:block px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">
                                LIVE ACCESS
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            {platformFeatures.map((feature, index) => (
                                <ServiceCard 
                                    key={index} 
                                    {...feature} 
                                    delay={index * 100} 
                                />
                            ))}
                        </div>

                        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-brand-primary to-purple-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-bold">Start Building Today</h3>
                                <p className="text-white/80 text-sm mt-1">Free tier available. No credit card required.</p>
                            </div>
                            <Button variant="secondary" className="whitespace-nowrap shadow-lg">
                                Launch App
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Freelance Services (The Architect) */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-24 h-full">
                            <div className="relative h-full bg-slate-900 rounded-3xl border border-brand-border-dark p-8 shadow-2xl overflow-hidden flex flex-col">
                                {/* Abstract Circuit Pattern Background */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                
                                <div className="relative z-10 mb-8">
                                    <h2 className="text-2xl font-bold text-white">Custom Engineering</h2>
                                    <p className="text-sm text-purple-400 font-semibold uppercase tracking-wider mt-1">Freelance & Consulting</p>
                                    <p className="text-gray-400 mt-4 text-sm leading-relaxed">
                                        Need something unique? I provide white-glove development services for hedge funds, prop desks, and serious individual traders.
                                    </p>
                                </div>

                                {/* Process Timeline */}
                                <div className="relative z-10 flex-grow space-y-2 mb-8">
                                    <ProcessStep 
                                        number="01" 
                                        title="Strategy Discovery" 
                                        desc="We analyze your alpha hypothesis and define technical requirements." 
                                    />
                                    <ProcessStep 
                                        number="02" 
                                        title="Quantitative Development" 
                                        desc="I build your custom algo using Rust or Python with institutional-grade risk controls." 
                                    />
                                    <ProcessStep 
                                        number="03" 
                                        title="Backtesting & Optimization" 
                                        desc="Rigorous stress testing across multiple market regimes to ensure robustness." 
                                    />
                                    <ProcessStep 
                                        number="04" 
                                        title="Production Deployment" 
                                        desc="Live deployment on AWS/GCP with monitoring dashboards." 
                                    />
                                </div>

                                <div className="relative z-10 mt-auto">
                                    <Button variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-colors">
                                        Book a Consultation
                                    </Button>
                                    <p className="text-center text-xs text-gray-500 mt-4">Limited availability for new clients.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ServicesPage;

