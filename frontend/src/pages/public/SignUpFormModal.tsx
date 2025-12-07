import React, { useState } from 'react';
import Button from '@/components/common/Button';
import { registerUser } from '@/services/auth';
import { Logo, GoogleLogo, GithubLogo, AppleLogo, UserCircleIcon, KeyIcon } from '@/constants';

const MailIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

interface InputFieldProps {
    id: string;
    type: string;
    placeholder: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    icon: React.ReactNode;
}

const InputField: React.FC<InputFieldProps> = ({ id, type, placeholder, value, onChange, icon }) => (
    <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary transition-colors">
            {icon}
        </div>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            required
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all duration-300"
            placeholder={placeholder}
        />
    </div>
);

interface SignUpFormModalProps {
    onClose: () => void;
    onRegister: () => void;
}

const SignUpFormModal: React.FC<SignUpFormModalProps> = ({ onClose, onRegister }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await registerUser({
                full_name: fullName,
                email: email,
                password: password
            });
            console.log('Registration Successful!');
            onRegister();
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.detail || 'Registration failed. Please try again.';
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            role="dialog"
            aria-modal="true"
        >
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={handleClose}></div>

            <div
                className={`relative w-full max-w-4xl bg-white dark:bg-brand-darkest rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0 animate-modal-content-slide-down'}`}
                onClick={e => e.stopPropagation()}
            >

                {/* Left Side - Creative Panel */}
                <div className="hidden md:flex md:w-5/12 relative bg-slate-900 overflow-hidden flex-col justify-between p-8 text-white">
                    <div className="absolute inset-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/40 to-purple-900/40 z-0"></div>
                        <div className="absolute top-0 left-0 w-full h-full opacity-30"
                            style={{ backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-primary rounded-full blur-[80px] opacity-40"></div>
                        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600 rounded-full blur-[100px] opacity-30"></div>
                    </div>

                    <div className="relative z-10">
                        <Logo className="!text-white" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold leading-tight">Welcome to the Future of <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-purple-400">Algo Trading</span></h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Join thousands of quants building, testing, and deploying strategies on the most advanced AI-powered infrastructure.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                                <p className="text-2xl font-bold text-white">99.9%</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Uptime</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">&lt;10ms</p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Latency</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 text-xs text-gray-500">
                        © 2024 CosmoQuantAI Inc.
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full md:w-7/12 p-8 md:p-12 bg-white dark:bg-brand-darkest relative">
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get started with your free Hobbyist plan today.</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField
                            id="fullName"
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            icon={<UserCircleIcon />}
                        />
                        <InputField
                            id="email"
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<MailIcon />}
                        />
                        <InputField
                            id="password"
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<KeyIcon />}
                        />

                        <Button type="submit" variant="primary" disabled={isLoading} className="w-full py-3.5 rounded-xl text-base font-bold shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                            {isLoading ? 'Creating Account...' : 'Start Quantifying'}
                        </Button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider">
                            <span className="bg-white dark:bg-brand-darkest px-4 text-gray-400">
                                Or join with
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <button className="flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <GoogleLogo className="grayscale group-hover:grayscale-0 transition-all" />
                        </button>
                        <button className="flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <GithubLogo className="text-slate-800 dark:text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                        </button>
                        <button className="flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                            <AppleLogo className="text-slate-800 dark:text-white opacity-70 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Already a member?{' '}
                        <button onClick={handleClose} className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline">
                            Log in
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpFormModal;

