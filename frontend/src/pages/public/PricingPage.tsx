
import React, { useState } from 'react';
import Button from '@/components/common/Button';
import { CheckCircleIcon } from '@/constants';

type BillingCycle = 'monthly' | 'yearly';

interface PricingTier {
    name: string;
    monthlyPrice: string;
    yearlyPrice: string;
    description: string;
    features: string[];
    cta: string;
    isFeatured: boolean;
    highlightColor: string;
}

const PRICING_TIERS: PricingTier[] = [
    {
        name: "Hobbyist",
        monthlyPrice: "$0",
        yearlyPrice: "$0",
        description: "Perfect for learning the ropes and testing basic strategies.",
        features: ["1 Connected Exchange", "10 Backtests / month", "1 Active Bot (Pre-made)", "Basic Portfolio Tracking", "Community Support"],
        cta: "Start for Free",
        isFeatured: false,
        highlightColor: "border-gray-200 dark:border-gray-700"
    },
    {
        name: "Pro Trader",
        monthlyPrice: "$49",
        yearlyPrice: "$39",
        description: "For serious traders who demand power, speed, and AI insights.",
        features: ["5 Connected Exchanges", "Unlimited Backtests", "10 Active Bots (Custom & AI)", "AI Foundry Access (GPT-4)", "Real-time Sentiment Analysis", "Priority Support"],
        cta: "Go Pro",
        isFeatured: true,
        highlightColor: "border-brand-primary shadow-[0_0_30px_rgba(99,102,241,0.3)]"
    },
    {
        name: "Enterprise",
        monthlyPrice: "Custom",
        yearlyPrice: "Custom",
        description: "Tailored infrastructure for funds and high-frequency desks.",
        features: ["Unlimited Exchanges", "Dedicated Cloud Node", "Custom Algorithm Development", "White-glove Onboarding", "SLA & 24/7 Phone Support", "Direct Market Access (DMA)"],
        cta: "Contact Sales",
        isFeatured: false,
        highlightColor: "border-purple-500 dark:border-purple-500"
    }
];

const COMPARISON_FEATURES = [
    { name: "Backtesting Engine", free: "Standard", pro: "High-Speed Parallel", ent: "Dedicated Server" },
    { name: "AI Strategy Generation", free: "Limited (3/mo)", pro: "Unlimited", ent: "Unlimited + Fine-tuning" },
    { name: "Data Granularity", free: "1 Hour", pro: "1 Minute", ent: "Tick Level" },
    { name: "API Access", free: "Read-only", pro: "Full Access", ent: "High Rate Limits" },
    { name: "Support", free: "Community", pro: "Email (24h)", ent: "Dedicated Account Manager" },
];

const FAQS = [
    { q: "Can I switch plans later?", a: "Absolutely. You can upgrade or downgrade your plan at any time from your settings dashboard." },
    { q: "Is my API key secure?", a: "Yes. We use AES-256 encryption to store your keys and they never leave our secure enclave. We only use them to execute trades you authorize." },
    { q: "Do you offer a refund?", a: "We offer a 14-day money-back guarantee for the Pro plan if you're not satisfied with the platform." },
    { q: "What exchanges do you support?", a: "We currently support Binance, Coinbase, Kraken, and KuCoin. More integrations are added monthly." },
];

const PricingPage: React.FC = () => {
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    return (
        <div className="bg-gray-50 dark:bg-brand-darkest min-h-screen font-sans">
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                        Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-500">Trading Edge</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
                        Powerful tools shouldn't be reserved for Wall Street. Choose a plan that scales with your ambition.
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex justify-center items-center gap-4 mb-16">
                        <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-gray-500'}`}>Monthly</span>
                        <button 
                            onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                            className="relative w-16 h-8 bg-gray-200 dark:bg-brand-dark rounded-full p-1 transition-colors focus:outline-none"
                        >
                            <div className={`w-6 h-6 bg-brand-primary rounded-full shadow-md transform transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-8' : ''}`}></div>
                        </button>
                        <span className={`text-sm font-semibold ${billingCycle === 'yearly' ? 'text-slate-900 dark:text-white' : 'text-gray-500'}`}>
                            Yearly <span className="ml-2 inline-block bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Save 20%</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {PRICING_TIERS.map((tier, index) => (
                        <div 
                            key={tier.name} 
                            className={`relative bg-white dark:bg-brand-dark/40 backdrop-blur-xl border rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${tier.highlightColor} ${tier.isFeatured ? 'z-10 scale-105 shadow-xl' : ''}`}
                        >
                            {tier.isFeatured && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-primary to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{tier.name}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 h-10">{tier.description}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline">
                                    <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                                        {billingCycle === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                                    </span>
                                    {tier.monthlyPrice !== 'Custom' && (
                                        <span className="text-gray-500 dark:text-gray-400 ml-2">/ month</span>
                                    )}
                                </div>
                                {billingCycle === 'yearly' && tier.monthlyPrice !== 'Custom' && tier.monthlyPrice !== '$0' && (
                                    <p className="text-xs text-green-500 mt-2 font-semibold">Billed ${parseInt(tier.yearlyPrice.replace('$','')) * 12} yearly</p>
                                )}
                            </div>

                            <Button 
                                variant={tier.isFeatured ? 'primary' : 'outline'} 
                                className={`w-full py-4 rounded-xl text-sm font-bold mb-8 ${tier.isFeatured ? 'shadow-lg shadow-brand-primary/30' : ''}`}
                            >
                                {tier.cta}
                            </Button>

                            <div className="flex-grow">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">What's included</p>
                                <ul className="space-y-4">
                                    {tier.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${tier.isFeatured ? 'bg-brand-primary/20 text-brand-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white dark:bg-brand-dark border-y border-gray-200 dark:border-brand-border-dark py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-12">Detailed Comparison</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-brand-border-dark">
                                    <th className="py-4 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">Features</th>
                                    <th className="py-4 px-4 text-center font-bold text-slate-900 dark:text-white w-1/5">Hobbyist</th>
                                    <th className="py-4 px-4 text-center font-bold text-brand-primary w-1/5">Pro Trader</th>
                                    <th className="py-4 px-4 text-center font-bold text-purple-500 w-1/5">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-brand-border-dark">
                                {COMPARISON_FEATURES.map((row, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-brand-darkest/50 transition-colors">
                                        <td className="py-4 px-4 text-sm font-medium text-gray-900 dark:text-white">{row.name}</td>
                                        <td className="py-4 px-4 text-sm text-center text-gray-500 dark:text-gray-400">{row.free}</td>
                                        <td className="py-4 px-4 text-sm text-center font-semibold text-brand-primary">{row.pro}</td>
                                        <td className="py-4 px-4 text-sm text-center text-gray-500 dark:text-gray-400">{row.ent}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-24 max-w-3xl">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <div key={index} className="border border-gray-200 dark:border-brand-border-dark rounded-xl overflow-hidden bg-white dark:bg-brand-dark">
                            <button 
                                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                            >
                                <span className="font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                                <svg 
                                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${openFaqIndex === index ? 'rotate-180' : ''}`} 
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className={`px-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed overflow-hidden transition-all duration-300 ${openFaqIndex === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                                {faq.a}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPage;

