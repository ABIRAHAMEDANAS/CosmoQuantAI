
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import Toast from '@/components/common/Toast';
import type { ToastMessage } from '@/types';

interface ToastContextType {
    showToast: (message: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
        const newToast: ToastMessage = {
            id: Date.now(),
            message,
            type,
        };
        setToasts(prevToasts => [...prevToasts, newToast]);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-8 right-8 z-[100] w-full max-w-sm space-y-3">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

