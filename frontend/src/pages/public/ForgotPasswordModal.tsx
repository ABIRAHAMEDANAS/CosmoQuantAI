import React, { useState } from 'react';
import Button from '@/components/common/Button';
import { sendForgotPasswordRequest } from '@/services/auth';
import { MailIcon } from '@/constants';

interface ForgotPasswordModalProps {
    onClose: () => void;
    onBackToLogin: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ onClose, onBackToLogin }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');

        try {
            await sendForgotPasswordRequest(email);
            setStatus('success');
            setMessage(`Check your inbox! We've sent a reset link to ${email}.`);
        } catch (err: any) {
            setStatus('error');
            setMessage('Something went wrong. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-brand-darkest rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden p-8 animate-modal-fade-in">

                <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Forgot Password?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                    No worries! Enter your email and we will send you a reset instructions.
                </p>

                {status === 'success' ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-green-500 text-center text-sm mb-4">
                        {message}
                        <div className="mt-4">
                            <Button variant="outline" className="w-full" onClick={onBackToLogin}>Back to Login</Button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-400 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                                placeholder="Enter your email"
                            />
                        </div>

                        {status === 'error' && <p className="text-xs text-red-500 text-center">{message}</p>}

                        <Button type="submit" variant="primary" disabled={isLoading} className="w-full py-3 rounded-xl shadow-lg">
                            {isLoading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <button onClick={onBackToLogin} className="text-sm text-gray-500 hover:text-brand-primary transition-colors flex items-center justify-center gap-1 w-full">
                        ← Back to Log In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
