import React, { useState } from 'react';
import Button from '@/components/common/Button';
import { resetUserPassword } from '@/services/auth';
import { Logo, KeyIcon } from '@/constants';

interface ResetPasswordScreenProps {
    token: string;
    onResetSuccess: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ token, onResetSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await resetUserPassword(token, newPassword);
            // সফল হলে লজিক অ্যাপ.tsx হ্যান্ডেল করবে
            alert('Password reset successful! Please login with your new password.');
            onResetSuccess();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Link expired or invalid.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-light dark:bg-brand-darkest p-4">
            <div className="mb-8 animate-bounce"><Logo /></div>

            <div className="w-full max-w-md bg-white dark:bg-brand-dark rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-fade-in-up">
                <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-6">Reset Password</h2>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743z" /></svg>
                        </div>
                        <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-400 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            placeholder="New Password"
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-10 pr-4 text-slate-900 dark:text-white placeholder-gray-400 outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            placeholder="Confirm New Password"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <Button type="submit" variant="primary" disabled={isLoading} className="w-full py-3 rounded-xl shadow-lg">
                        {isLoading ? 'Resetting...' : 'Set New Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordScreen;
