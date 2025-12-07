
import React from 'react';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import { MOCK_PORTFOLIO_PROJECTS, MOCK_CLIENT_TESTIMONIALS, CheckCircleIcon } from '@/constants';
import type { PortfolioProject } from '@/types';

interface PortfolioPageProps {
    onSignUp: () => void;
}

const MetricBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2 text-center min-w-[80px]">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-sm font-bold text-brand-primary">{value}</span>
    </div>
);

const ProjectCard: React.FC<{ project: PortfolioProject; index: number }> = ({ project, index }) => (
    <div 
        className="group relative bg-white dark:bg-brand-dark border border-gray-200 dark:border-brand-border-dark rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full staggered-fade-in"
        style={{ animationDelay: `${index * 100}ms` }}
    >
        {/* Image Overlay Effect */}
        <div className="relative h-56 overflow-hidden">
            <div className="absolute inset-0 bg-brand-darkest/20 group-hover:bg-brand-darkest/0 transition-colors z-10"></div>
            <img 
                src={project.imageUrl} 
                alt={project.title} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
            />
            <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 text-xs font-bold bg-white/90 dark:bg-brand-darkest/90 backdrop-blur-sm rounded-full shadow-sm text-brand-primary border border-brand-primary/20">
                    {project.category}
                </span>
            </div>
        </div>

        <div className="p-6 flex flex-col flex-grow relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-brand-primary transition-colors">
                {project.title}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6 flex-grow">
                {project.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                {project.metrics.map((metric, idx) => (
                    <MetricBadge key={idx} label={metric.label} value={metric.value} />
                ))}
            </div>

            {/* Tags & Action */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs font-mono text-gray-500 dark:text-gray-400">#{tag}</span>
                    ))}
                </div>
                <button className="text-sm font-semibold text-brand-primary hover:underline flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Case Study &rarr;
                </button>
            </div>
        </div>
    </div>
);

const SkillCategory: React.FC<{ title: string; skills: string[] }> = ({ title, skills }) => (
    <div className="bg-white dark:bg-brand-dark/50 border border-gray-200 dark:border-brand-border-dark rounded-xl p-6">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
            {title}
        </h4>
        <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
                <span key={skill} className="px-3 py-1.5 bg-gray-100 dark:bg-brand-darkest border border-gray-200 dark:border-white/10 rounded-md text-xs font-medium text-gray-700 dark:text-gray-300">
                    {skill}
                </span>
            ))}
        </div>
    </div>
);

const PortfolioPage: React.FC<PortfolioPageProps> = ({ onSignUp }) => {
    const coreSkills = ['Python (Pandas, NumPy)', 'Rust', 'C++', 'Quantitative Analysis', 'Statistical Arbitrage'];
    const mlSkills = ['TensorFlow', 'PyTorch', 'LSTM / GRU Networks', 'Reinforcement Learning', 'Sentiment NLP'];
    const infraSkills = ['Docker & Kubernetes', 'AWS / GCP', 'WebSocket APIs', 'Low Latency Systems', 'PostgreSQL / TimescaleDB'];

    return (
        <div className="bg-gray-50 dark:bg-brand-darkest min-h-screen">
            
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-20 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-widest uppercase mb-4">
                        Freelance Portfolio
                    </span>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
                        Architecting <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-500">Alpha</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                        I design institutional-grade algorithmic trading systems, custom machine learning models, and high-frequency execution engines for discerning clients.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-24">
                
                {/* Featured Projects */}
                <section>
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Selected Works</h2>
                        <div className="hidden md:block h-px flex-1 bg-gray-200 dark:bg-brand-border-dark ml-8"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {MOCK_PORTFOLIO_PROJECTS.map((project, index) => (
                            <ProjectCard key={project.id} project={project} index={index} />
                        ))}
                    </div>
                </section>
                
                {/* Tech Stack Radar */}
                <section>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center">Technical Arsenal</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SkillCategory title="Core Quant" skills={coreSkills} />
                        <SkillCategory title="AI & Machine Learning" skills={mlSkills} />
                        <SkillCategory title="Infrastructure & DevOps" skills={infraSkills} />
                    </div>
                </section>
                
                {/* Testimonials */}
                <section className="relative">
                    <div className="absolute inset-0 bg-brand-primary/5 -skew-y-2 transform origin-left scale-110 rounded-3xl z-0"></div>
                    <div className="relative z-10 py-12">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 text-center">Client Success Stories</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {MOCK_CLIENT_TESTIMONIALS.map((testimonial, i) => (
                                <div key={testimonial.id} className="bg-white dark:bg-brand-dark p-8 rounded-xl shadow-lg border border-gray-100 dark:border-brand-border-dark relative">
                                    <div className="text-4xl text-brand-primary/20 font-serif absolute top-4 left-4">"</div>
                                    <p className="text-gray-600 dark:text-gray-300 italic relative z-10 mb-6">
                                        {testimonial.quote}
                                    </p>
                                    <div className="flex items-center gap-4 border-t border-gray-100 dark:border-white/5 pt-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300">
                                            {testimonial.author[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-900 dark:text-white">{testimonial.author}</p>
                                            <p className="text-xs text-brand-primary">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                
                {/* CTA Section */}
                <section className="relative rounded-3xl overflow-hidden bg-slate-900 text-white py-16 px-8 text-center shadow-2xl">
                    {/* Abstract Tech Background */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/30 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/30 rounded-full blur-[100px]"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Build Your Edge?</h2>
                        <p className="text-lg text-gray-300 mb-10">
                            Whether you need a custom HFT bot, a risk management system, or a full-stack trading platform, let's engineer a solution that fits your strategy.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="primary" className="px-8 py-4 text-lg rounded-full shadow-lg shadow-brand-primary/30">
                                Schedule Consultation
                            </Button>
                            <Button variant="outline" className="px-8 py-4 text-lg rounded-full border-white/30 text-white hover:bg-white hover:text-slate-900" onClick={onSignUp}>
                                Try SaaS Platform
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PortfolioPage;

