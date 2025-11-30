
import React, { useEffect } from 'react';
import type { ToastMessage } from '../../types';

const SuccessIcon = () => (
    <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const InfoIcon = () => (
    <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const ErrorIcon = () => (
    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

const WarningIcon = () => (
    <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);


const ICONS: Record<ToastMessage['type'], React.ReactNode> = {
    success: <SuccessIcon />,
    info: <InfoIcon />,
    error: <ErrorIcon />,
    warning: <WarningIcon />,
};

interface ToastProps {
    toast: ToastMessage;
    onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [toast.id, onClose]);

    return (
        <div className="bg-white dark:bg-brand-dark shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden flex items-start p-4 space-x-3 animate-fade-in-right">
            <div className="flex-shrink-0">{ICONS[toast.type]}</div>
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{toast.message}</p>
            </div>
            <div className="flex-shrink-0">
                <button onClick={() => onClose(toast.id)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    <span className="sr-only">Close</span>
                    &times;
                </button>
            </div>
        </div>
    );
};

export default Toast;