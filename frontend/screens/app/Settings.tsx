
import React, { useState, useRef, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { useSettings, ApiKeyConfig } from '../../contexts/SettingsContext';
import { BinanceLogo, KucoinLogo } from '../../constants';

const EyeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

const Settings: React.FC<{ initialSection?: string | null }> = ({ initialSection }) => {
    const { theme, setTheme } = useTheme();
    const { showToast } = useToast();
    const {
        userProfile, updateUserProfile,
        apiKeys, updateLocalApiKeyInput, saveApiKeyToBackend,
        is2faEnabled, set2faEnabled, isLoading
    } = useSettings();

    // State for editable profile fields, initialized from context
    const [fullName, setFullName] = useState(userProfile.fullName);
    const [email, setEmail] = useState(userProfile.email);
    const [username, setUsername] = useState(userProfile.username);
    const [timezone, setTimezone] = useState(userProfile.timezone);
    const [currency, setCurrency] = useState(userProfile.currency);

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});

    // Refs for scrolling
    const profileRef = useRef<HTMLDivElement>(null);
    const billingRef = useRef<HTMLDivElement>(null);
    const securityRef = useRef<HTMLDivElement>(null);
    const apiKeysRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Update local state if context changes
        setFullName(userProfile.fullName);
        setEmail(userProfile.email);
        setUsername(userProfile.username);
        setTimezone(userProfile.timezone);
        setCurrency(userProfile.currency);
    }, [userProfile]);

    useEffect(() => {
        // Allow state to settle before scrolling
        setTimeout(() => {
            let targetRef: React.RefObject<HTMLDivElement> | null = null;
            switch (initialSection) {
                case 'profile': targetRef = profileRef; break;
                case 'billing': targetRef = billingRef; break;
                case 'api-keys': targetRef = apiKeysRef; break;
                // Add more cases for other sections if needed
            }
            if (targetRef?.current) {
                targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }, [initialSection]);

    const isDarkMode = theme === 'dark';

    const handleThemeChange = () => {
        setTheme(isDarkMode ? 'light' : 'dark');
    };

    const hasProfileChanges =
        fullName !== userProfile.fullName ||
        email !== userProfile.email ||
        username !== userProfile.username ||
        timezone !== userProfile.timezone ||
        currency !== userProfile.currency;

    const handleSaveChanges = () => {
        if (!hasProfileChanges) return;
        setSaveStatus('saving');
        setTimeout(() => {
            updateUserProfile({
                fullName,
                email,
                username,
                timezone,
                currency
            });
            setSaveStatus('saved');
            showToast('Profile settings saved!', 'success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1000);
    };

    const handleApiKeyChange = (exchange: string, field: keyof ApiKeyConfig, value: string | boolean) => {
        // শুধুমাত্র লোকাল ইনপুট আপডেট করবে
        updateLocalApiKeyInput(exchange, { [field]: value });
    };

    const handleSaveApiKeys = async (exchange: string) => {
        await saveApiKeyToBackend(exchange);
    };

    const handleDeleteApiKeys = (exchange: string) => {
        updateLocalApiKeyInput(exchange, { apiKey: '', secretKey: '', isEnabled: false });
        showToast(`${exchange} API keys deleted locally.`, 'info');
    };

    const toggleSecretVisibility = (exchange: string) => {
        setVisibleSecrets(prev => ({ ...prev, [exchange]: !prev[exchange] }));
    };

    const exchangeLogos: Record<string, React.ReactNode> = {
        'Binance': <BinanceLogo />,
        'KuCoin': <KucoinLogo />,
    };

    const inputBaseClasses = "w-full max-w-md bg-white dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-md p-2 text-slate-900 dark:text-white focus:ring-brand-primary focus:border-brand-primary transition-colors";

    const timezones = ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney', 'UTC'];
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'BTC'];

    return (
        <div className="space-y-8 max-w-4xl animate-fade-in-slide-up">
            <Card>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-brand-border-light dark:border-brand-border-dark pb-4">Appearance</h2>
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Theme</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-2xl">
                        Switch between light and dark mode for the entire application.
                    </p>
                    <div className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-brand-dark/50 rounded-lg">
                        <label htmlFor="theme-toggle" className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    id="theme-toggle"
                                    className="sr-only"
                                    checked={isDarkMode}
                                    onChange={handleThemeChange}
                                />
                                <div className={`block w-14 h-8 rounded-full ${isDarkMode ? 'bg-brand-primary' : 'bg-slate-400'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isDarkMode ? 'transform translate-x-6' : ''}`}></div>
                            </div>
                        </label>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                    </div>
                </div>
            </Card>

            <div ref={profileRef}>
                <Card>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-brand-border-light dark:border-brand-border-dark pb-4">Profile Settings</h2>
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold text-3xl flex-shrink-0">
                                {fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <Button variant="secondary">Change Avatar</Button>
                                <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Full Name</label>
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputBaseClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Username</label>
                                <div className="relative max-w-md">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">@</span>
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputBaseClasses} pl-8`} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email Address</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBaseClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Timezone</label>
                                <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputBaseClasses}>
                                    {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Preferred Currency</label>
                                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputBaseClasses}>
                                    {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 pt-4 border-t border-brand-border-light dark:border-brand-border-dark">
                            <Button
                                variant="primary"
                                onClick={handleSaveChanges}
                                disabled={!hasProfileChanges || saveStatus === 'saving'}
                            >
                                {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                            </Button>
                            {saveStatus === 'saved' && (
                                <span className="text-sm text-brand-success font-medium">Changes saved successfully!</span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            <div ref={billingRef}>
                <Card>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-brand-border-light dark:border-brand-border-dark pb-4">Billing & Subscription</h2>
                    <div className="mt-6 p-6 bg-gray-100 dark:bg-brand-dark/50 rounded-lg">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Pro Trader Plan</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Renews on July 15, 2024</p>
                            </div>
                            <p className="font-bold text-lg text-slate-900 dark:text-white">$49/mo</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-brand-border-light dark:border-brand-border-dark flex flex-wrap gap-4">
                            <Button variant="primary">Manage Subscription</Button>
                            <Button variant="secondary">View Invoices</Button>
                        </div>
                    </div>
                </Card>
            </div>

            <div ref={securityRef}>
                <Card>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-brand-border-light dark:border-brand-border-dark pb-4">Security</h2>

                    {/* 2FA Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Two-Factor Authentication (2FA)</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-2xl">
                            Add an extra layer of security to your account. Once enabled, you'll be required to enter a code from your authenticator app when you log in.
                        </p>

                        <div className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-brand-dark/50 rounded-lg">
                            <label htmlFor="2fa-toggle" className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="2fa-toggle"
                                        className="sr-only"
                                        checked={is2faEnabled}
                                        onChange={() => set2faEnabled(!is2faEnabled)}
                                    />
                                    <div className={`block w-14 h-8 rounded-full ${is2faEnabled ? 'bg-brand-primary' : 'bg-slate-400'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${is2faEnabled ? 'transform translate-x-6' : ''}`}></div>
                                </div>
                            </label>
                            <span className="font-medium text-slate-900 dark:text-white">
                                {is2faEnabled ? '2FA is Enabled' : '2FA is Disabled'}
                            </span>
                        </div>

                        {is2faEnabled && (
                            <div className="mt-6 pt-6 border-t border-brand-border-light dark:border-brand-border-dark">
                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Set Up Your Authenticator App</h4>
                                <div className="flex flex-col md:flex-row items-start gap-8">
                                    <div className="flex-shrink-0">
                                        {/* Placeholder for QR Code */}
                                        <div className="w-40 h-40 bg-white flex items-center justify-center rounded-lg">
                                            <p className="text-slate-900 font-mono text-sm p-2 text-center">QR Code Placeholder</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4">Scan the QR code with an authenticator app (e.g., Google Authenticator, Authy).</p>
                                        <div>
                                            <label htmlFor="2fa-code" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Enter 6-Digit Code</label>
                                            <input
                                                id="2fa-code"
                                                type="text"
                                                maxLength={6}
                                                placeholder="123456"
                                                className="w-48 bg-white dark:bg-brand-dark/50 border border-brand-border-light dark:border-brand-border-dark rounded-md p-2 text-slate-900 dark:text-white text-lg tracking-widest text-center"
                                            />
                                        </div>
                                        <Button variant="primary" className="mt-4">Verify & Enable</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            <div ref={apiKeysRef}>
                <Card>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 border-b border-brand-border-light dark:border-brand-border-dark pb-4">API Key Management</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
                        Manage your API connections to exchanges for live trading and portfolio tracking. Your keys are encrypted and stored securely.
                    </p>
                    <div className="space-y-8">
                        {/* Fix: Explicitly typed the [exchange, config] tuple to resolve 'unknown' type errors. This ensures TypeScript correctly infers the type of 'config' as ApiKeyConfig. */}
                        {Object.entries(apiKeys).map(([exchange, config]: [string, ApiKeyConfig]) => (
                            <div key={exchange} className="p-4 bg-gray-100 dark:bg-brand-dark/50 rounded-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        {exchangeLogos[exchange]}
                                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{exchange}</h3>
                                    </div>
                                    <label htmlFor={`${exchange}-toggle`} className="flex items-center cursor-pointer">
                                        <div className="relative">
                                            <input type="checkbox" id={`${exchange}-toggle`} className="sr-only" checked={config.isEnabled} onChange={(e) => handleApiKeyChange(exchange, 'isEnabled', e.target.checked)} />
                                            <div className={`block w-12 h-6 rounded-full ${config.isEnabled ? 'bg-brand-primary' : 'bg-slate-400 dark:bg-slate-600'}`}></div>
                                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${config.isEnabled ? 'transform translate-x-6' : ''}`}></div>
                                        </div>
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
                                        <input type="text" value={config.apiKey} onChange={(e) => handleApiKeyChange(exchange, 'apiKey', e.target.value)} className={inputBaseClasses} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Secret Key</label>
                                        <div className="relative max-w-md">
                                            <input type={visibleSecrets[exchange] ? 'text' : 'password'} value={config.secretKey} onChange={(e) => handleApiKeyChange(exchange, 'secretKey', e.target.value)} className={`${inputBaseClasses} pr-10`} />
                                            <button type="button" onClick={() => toggleSecretVisibility(exchange)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                                {visibleSecrets[exchange] ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Button variant="primary" onClick={() => handleSaveApiKeys(exchange)} disabled={isLoading}>
                                            {isLoading ? 'Saving...' : 'Save Connection'}
                                        </Button>
                                        <Button variant="secondary" onClick={() => handleDeleteApiKeys(exchange)}>Delete</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
