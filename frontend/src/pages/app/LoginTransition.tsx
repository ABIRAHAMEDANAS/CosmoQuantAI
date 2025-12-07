
import React, { useEffect, useState } from 'react';
import { Logo } from '@/constants';

interface LoginTransitionProps {
    onAnimationComplete: () => void;
}

const LOADING_STEPS = [
    "Establishing Secure Handshake...",
    "Verifying Biometric Hash...",
    "Decrypting Portfolio Data...",
    "Syncing with Liquidity Providers...",
    "Initializing Quant Engine...",
    "Access Granted."
];

const LoginTransition: React.FC<LoginTransitionProps> = ({ onAnimationComplete }) => {
    const [progress, setProgress] = useState(0);
    const [stepIndex, setStepIndex] = useState(0);

    useEffect(() => {
        const duration = 1500; // Total animation time in ms (Reduced from 2500)
        const intervalTime = 20;
        const totalSteps = duration / intervalTime;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const newProgress = Math.min(100, (currentStep / totalSteps) * 100);
            setProgress(newProgress);

            // Calculate which text message to show based on progress
            const totalMessages = LOADING_STEPS.length;
            const msgIndex = Math.min(
                totalMessages - 1,
                Math.floor((newProgress/100) * totalMessages)
            );
            setStepIndex(msgIndex);

            if (currentStep >= totalSteps) {
                clearInterval(timer);
                setTimeout(onAnimationComplete, 200); // Reduced delay at 100% before unmounting
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [onAnimationComplete]);

    return (
        <div className="fixed inset-0 bg-[#050b14] flex flex-col items-center justify-center z-[100] overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-primary/10 rounded-full blur-[100px] animate-pulse"></div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Reactor / Core Animation */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-10">
                    {/* Outer Spinning Ring */}
                    <div className="absolute inset-0 rounded-full border border-brand-primary/20 border-t-brand-primary border-r-brand-primary/50 animate-[spin_2s_linear_infinite]"></div>

                    {/* Middle Counter-Spinning Ring */}
                    <div className="absolute inset-4 rounded-full border border-purple-500/20 border-b-purple-500 border-l-purple-500/50 animate-[spin_1.5s_linear_infinite_reverse]"></div>

                    {/* Inner Pulsing Ring */}
                    <div className="absolute inset-8 rounded-full border-2 border-brand-primary/30 animate-pulse"></div>

                    {/* Center Logo */}
                    <div className="relative z-20 scale-125">
                        <Logo />
                    </div>
                </div>

                {/* Status Text */}
                <div className="h-8 mb-2 flex items-center">
                    <p className="text-brand-primary font-mono text-sm tracking-wider uppercase animate-fade-in-up key={stepIndex}">
                        {`> ${LOADING_STEPS[stepIndex]}`}
                        <span className="animate-pulse">_</span>
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden relative">
                    <div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary to-purple-500 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    ></div>
                    {/* Moving shine effect on progress bar */}
                    <div className="absolute top-0 left-0 h-full w-full bg-white/20 -translate-x-full animate-[shimmer_1s_infinite]"></div>
                </div>

                {/* Percentage */}
                <p className="mt-2 text-gray-500 text-xs font-mono">
                    {Math.round(progress)}% COMPLETE
                </p>
            </div>

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
};

export default LoginTransition;

