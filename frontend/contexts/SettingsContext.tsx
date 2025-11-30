import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { fetchApiKeys, saveApiKey as apiSaveApiKey } from '../services/settings';
import { fetchCurrentUser } from '../services/auth';
import { useToast } from './ToastContext';

// টাইপ ডেফিনিশন
export interface ApiKeyConfig {
    apiKey: string;
    secretKey: string; // এটি খালি থাকবে ডাটাবেস থেকে লোড করার পর (সিকিউরিটির জন্য)
    isEnabled: boolean;
    isSaved?: boolean; // UI তে বোঝানোর জন্য যে এটি ডাটাবেসে আছে
}

export interface UserProfile {
    fullName: string;
    email: string;
    username: string;
    timezone: string;
    currency: string;
}

interface SettingsContextType {
    apiKeys: Record<string, ApiKeyConfig>;
    updateLocalApiKeyInput: (exchange: string, config: Partial<ApiKeyConfig>) => void; // ইনপুট টাইপ করার জন্য
    saveApiKeyToBackend: (exchange: string) => Promise<void>; // ডাটাবেসে পাঠানোর জন্য
    isLoading: boolean;
    userProfile: UserProfile;
    updateUserProfile: (profile: Partial<UserProfile>) => void;
    is2faEnabled: boolean;
    set2faEnabled: (enabled: boolean) => void;
}

// ডিফল্ট প্রোফাইল (অথবা চাইলে পরে ইউজারের ডাটা API থেকেও আনতে পারেন)
const defaultProfile: UserProfile = {
    fullName: 'Abir Ahamed', // লগইন API থেকে আসল নাম আপডেট করা যাবে
    email: 'user@example.com',
    username: 'abir',
    timezone: 'UTC',
    currency: 'USD'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>({
        'Binance': { apiKey: '', secretKey: '', isEnabled: false, isSaved: false },
        'KuCoin': { apiKey: '', secretKey: '', isEnabled: false, isSaved: false },
    });

    // ডিফল্ট ভ্যালু ফাঁকা রাখুন, লোড হলে পূর্ণ হবে
    const [userProfile, setUserProfile] = useState<UserProfile>({
        fullName: 'Loading...',
        email: '...',
        username: '...',
        timezone: 'UTC',
        currency: 'USD'
    });

    const [is2faEnabled, set2faEnabled] = useState(false);

    // মেইন ডেটা লোডিং ফাংশন
    const loadUserData = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            // ১. প্যারালাল রিকোয়েস্ট (API Key এবং User Profile একসাথে)
            const [keysFromDB, userData] = await Promise.all([
                fetchApiKeys().catch(() => []), // ইরর হলে খালি অ্যারে
                fetchCurrentUser().catch(() => null)
            ]);

            // ২. API Keys সেটআপ
            if (keysFromDB && Array.isArray(keysFromDB)) {
                setApiKeys(prev => {
                    const newKeys = { ...prev };
                    keysFromDB.forEach((k: any) => {
                        if (newKeys[k.exchange]) {
                            newKeys[k.exchange] = {
                                apiKey: k.api_key,
                                secretKey: '••••••••',
                                isEnabled: k.is_enabled,
                                isSaved: true
                            };
                        }
                    });
                    return newKeys;
                });
            }

            // ৩. ইউজার প্রোফাইল সেটআপ (backend snake_case পাঠায়, আমরা camelCase এ কনভার্ট করবো)
            if (userData) {
                setUserProfile({
                    fullName: userData.full_name || 'Trader',
                    email: userData.email,
                    username: userData.email.split('@')[0], // ইউজারনেম না থাকলে ইমেইল থেকে বানানো
                    timezone: 'UTC', // ডিফল্ট
                    currency: 'USD'
                });
            }

        } catch (error) {
            console.error("Error loading user data", error);
            // টোকেন অবৈধ হলে লগআউট করে দেয়া ভালো (অপশনাল)
            // localStorage.removeItem('accessToken');
        }
    }, []);

    // অ্যাপ মাউন্ট হলে কল হবে
    useEffect(() => {
        loadUserData();
    }, [loadUserData]);

    // ২. ইউজার ইনপুট দিলে লোকাল স্টেটে আপডেট হবে
    const updateLocalApiKeyInput = (exchange: string, updates: Partial<ApiKeyConfig>) => {
        setApiKeys(prev => ({
            ...prev,
            [exchange]: { ...prev[exchange], ...updates }
        }));
    };

    // ৩. "Save" বাটন চাপলে এটি কল হবে
    const saveApiKeyToBackend = async (exchange: string) => {
        const config = apiKeys[exchange];
        if (!config.apiKey || !config.secretKey || config.secretKey === '••••••••') {
            showToast('Please enter valid API and Secret keys', 'warning');
            return;
        }

        setIsLoading(true);
        try {
            await apiSaveApiKey({
                exchange: exchange,
                api_key: config.apiKey,
                secret_key: config.secretKey
            });

            // সেভ হওয়ার পর স্টেট আপডেট
            setApiKeys(prev => ({
                ...prev,
                [exchange]: { ...prev[exchange], isSaved: true, secretKey: '••••••••' }
            }));
            showToast(`${exchange} API keys connected successfully!`, 'success');
        } catch (error: any) {
            console.error(error);
            showToast('Failed to save API keys.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const updateUserProfile = (updates: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...updates }));
    };

    return (
        <SettingsContext.Provider value={{
            apiKeys,
            updateLocalApiKeyInput,
            saveApiKeyToBackend,
            isLoading,
            userProfile,
            updateUserProfile,
            is2faEnabled,
            set2faEnabled
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
