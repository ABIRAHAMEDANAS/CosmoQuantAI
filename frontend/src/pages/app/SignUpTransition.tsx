
import React, { useEffect, useState } from 'react';
import { Logo } from '@/constants';

interface SignUpTransitionProps {
    onAnimationComplete: () => void;
}

const LoadingStep: React.FC<{ text: string; done: boolean }> = ({ text, done }) => (
    <div className={`flex items-center space-x-3 text-sm font-mono transition-opacity duration-300 ${done ? 'text-green-400 opacity-50' : 'text-brand-primary opacity-100'}`}>
        <span className={`w-2 h-2 rounded-full ${done ? 'bg-green-400' : 'bg-brand-primary animate-pulse'}`}></span>
        <span>{text}</span>
        {done && <span className="ml-auto text-xs">[OK]</span>}
    </div>
);

const SignUpTransition: React.FC<SignUpTransitionProps> = ({ onAnimationComplete }) => {
    const [steps, setSteps] = useState([
        { text: 'Initializing Environment...', done: false },
        { text: 'Allocating Cloud Resources...', done: false },
        { text: 'Connecting to Exchanges...', done: false },
        { text: 'Booting AI Foundry...', done: false },
    ]);
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        if (activeStep < steps.length) {
            const timeout = setTimeout(() => {
                setSteps(prev => prev.map((s, i) => i === activeStep ? { ...s, done: true } : s));
                setActiveStep(prev => prev + 1);
            }, 500); // Duration per step
            return () => clearTimeout(timeout);
        } else {
             const timeout = setTimeout(() => {
                onAnimationComplete();
            }, 800);
             return () => clearTimeout(timeout);
        }
    }, [activeStep, steps.length, onAnimationComplete]);

    return (
        <div className="fixed inset-0 bg-[#0B1120] flex flex-col items-center justify-center overflow-hidden z-[100]">
            {/* Matrix/Grid Background */}
            <div className="absolute inset-0 opacity-20" 
                 style={{ 
                     backgroundImage: 'linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)',
                     backgroundSize: '40px 40px',
                     transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)'
                 }}>
            </div>

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="flex justify-center mb-12 animate-bounce">
                    <Logo />
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md border border-brand-border-dark rounded-xl p-6 shadow-2xl">
                    <div className="space-y-4 mb-6">
                        {steps.map((step, index) => (
                            index <= activeStep ? (
                                <LoadingStep key={index} text={step.text} done={step.done} />
                            ) : null
                        ))}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-brand-primary shadow-[0_0_10px_rgba(99,102,241,0.8)] transition-all duration-300 ease-linear"
                            style={{ width: `${(activeStep / steps.length) * 100}%` }}
                        ></div>
                    </div>
                </div>
                
                <p className="text-center text-xs text-gray-500 mt-6 font-mono animate-pulse">
                    ESTABLISHING SECURE CONNECTION...
                </p>
            </div>
        </div>
    );
};

export default SignUpTransition;

