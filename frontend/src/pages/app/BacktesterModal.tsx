import React from 'react';
import Backtester from './Backtester';

interface BacktesterModalProps {
    onClose: () => void;
}

const BacktesterModal: React.FC<BacktesterModalProps> = ({ onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="backtester-modal-title"
        >
            <div 
                className="w-full h-[95%] max-w-7xl flex flex-col bg-white dark:bg-brand-darkest rounded-xl shadow-2xl animate-modal-content-slide-down overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-brand-border-light dark:border-brand-border-dark flex-shrink-0">
                    <h2 id="backtester-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">Backtesting Engine</h2>
                    <button onClick={onClose} className="text-3xl font-light text-gray-400 hover:text-gray-600 dark:hover:text-white" aria-label="Close">&times;</button>
                </header>
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-brand-darkest/95">
                    <Backtester />
                </div>
            </div>
        </div>
    );
};

export default BacktesterModal;
