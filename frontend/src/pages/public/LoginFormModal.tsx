import React, { useState } from 'react';
import Button from '@/components/common/Button';
import { loginUser } from '@/services/auth';
import { Logo, GoogleLogo, GithubLogo } from '@/constants';

interface LoginFormModalProps {
    onClose: () => void;
    onLoginSuccess: () => void;
    onSwitchToSignup: () => void;
    onSwitchToForgotPassword: () => void;
}

const LoginFormModal: React.FC<LoginFormModalProps> = ({ onClose, onLoginSuccess, onSwitchToSignup, onSwitchToForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    // ক্লোজ এনিমেশন হ্যান্ডেলার
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    // লগইন হ্যান্ডেলার
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // ১. ব্যাকএন্ডে রিকোয়েস্ট পাঠানো
            const data = await loginUser({
                email: email,
                password: password
            });

            // ২. টোকেন লোকাল স্টোরেজে সেভ করা (গুরুত্বপূর্ণ)
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);

            console.log('Login Successful!', data);

            // ৩. সফল হলে অ্যাপে লগইন করানো
            onLoginSuccess();

        } catch (err: any) {
            console.error(err);
            let errMsg = err.response?.data?.detail || 'Invalid email or password.';
            if (typeof errMsg !== 'string') {
                errMsg = JSON.stringify(errMsg);
            }
            setError(errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // কমন ইনপুট স্টাইল
    const inputClasses = "w-full bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-10 text-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all duration-300";

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
            role="dialog"
            aria-modal="true"
        >
            {/* ব্লার ব্যাকগ্রাউন্ড */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={handleClose}></div>

            {/* মডাল কার্ড */}
            <div
                className={`relative w-full max-w-md bg-white dark:bg-brand-darkest rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 translate-y-4' : 'scale-100 translate-y-0 animate-modal-content-slide-down'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* ক্লোজ বাটন */}
                <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5 z-10">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <Logo />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your credentials to access the terminal.</p>
                    </div>

                    {/* ইরর মেসেজ */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* ইমেইল ফিল্ড */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary transition-colors">
                                {/* Note: Ensure MailIcon is imported correctly or replace with SVG */}
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={inputClasses}
                                placeholder="Email Address"
                            />
                        </div>

                        {/* পাসওয়ার্ড ফিল্ড */}
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743z" /></svg>
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={inputClasses}
                                placeholder="Password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                                {showPassword ?
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> :
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                }
                            </button>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                <span className="text-gray-500 dark:text-gray-400">Remember me</span>
                            </label>
                            <button type="button" onClick={onSwitchToForgotPassword} className="text-brand-primary hover:underline font-medium">Forgot Password?</button>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-xl text-base font-bold shadow-lg shadow-brand-primary/25 hover:shadow-brand-primary/40 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Authenticating...' : 'Log In'}
                        </Button>
                    </form>

                    {/* সোস্যাল এবং ফুটার */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-wider">
                            <span className="bg-white dark:bg-brand-darkest px-4 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            <GoogleLogo />
                        </button>
                        <button className="flex items-center justify-center py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-slate-900 dark:text-white">
                            <GithubLogo />
                        </button>
                    </div>

                    <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        Don't have an account?{' '}
                        <button onClick={onSwitchToSignup} className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline">
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginFormModal;
