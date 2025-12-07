import React, { useState } from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { useToast } from '@/context/ToastContext';
import type { Alert } from '@/types';

interface CreateAlertModalProps {
    onClose: () => void;
    onAddAlert: (alert: Alert) => void;
    assets: string[];
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ onClose, onAddAlert, assets }) => {
    const { showToast } = useToast();
    const [asset, setAsset] = useState(assets[0] || '');
    const [triggerType, setTriggerType] = useState<Alert['triggerType']>('Price');
    const [priceCondition, setPriceCondition] = useState('>');
    const [priceValue, setPriceValue] = useState('');
    const [rsiValue, setRsiValue] = useState('70');
    const [notificationChannels, setNotificationChannels] = useState<Alert['notificationChannels']>(['Push']);

    const handleChannelToggle = (channel: 'Email' | 'SMS' | 'Push') => {
        setNotificationChannels(prev =>
            prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
        );
    };

    const getConditionString = (): string => {
        switch (triggerType) {
            case 'Price': return `Price ${priceCondition} $${priceValue}`;
            case 'RSI': return `RSI(14) < ${rsiValue}`;
            case 'SMA Cross': return 'SMA(50) crosses over SMA(200)';
            case 'Volume Spike': return 'Volume > 2x 20-period Average';
            default: return 'Unknown Condition';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!asset) {
            showToast('Please select an asset for the alert.', 'error');
            return;
        }
        if (triggerType === 'Price' && (!priceValue || parseFloat(priceValue) <= 0)) {
            showToast('Please enter a valid, positive price for the alert.', 'error');
            return;
        }
        if (triggerType === 'RSI' && (!rsiValue || parseFloat(rsiValue) < 0 || parseFloat(rsiValue) > 100)) {
            showToast('Please enter a valid RSI value between 0 and 100.', 'error');
            return;
        }
        if (notificationChannels.length === 0) {
            showToast('Please select at least one notification channel.', 'error');
            return;
        }
        
        const newAlert: Alert & { isNew?: boolean } = {
            id: `alert_${new Date().getTime()}`,
            asset,
            triggerType,
            condition: getConditionString(),
            status: 'Active',
            notificationChannels,
            isNew: true, // For animation
        };
        onAddAlert(newAlert);
        onClose();
    };
    
    const inputBaseClasses = "w-full bg-white dark:bg-slate-700 border border-brand-border-light dark:border-brand-border-dark rounded-md p-2 text-slate-900 dark:text-white";

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-modal-fade-in" onClick={onClose}>
            <Card className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Alert</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <fieldset className="space-y-4">
                        <legend className="text-sm font-semibold text-gray-400 mb-2">Asset & Trigger</legend>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Asset</label>
                            <select value={asset} onChange={e => setAsset(e.target.value)} className={inputBaseClasses}>
                                {assets.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Trigger Type</label>
                            <select value={triggerType} onChange={e => setTriggerType(e.target.value as any)} className={inputBaseClasses}>
                                <option value="Price">Price</option>
                                <option value="RSI">RSI</option>
                                <option value="SMA Cross">SMA Cross</option>
                                <option value="Volume Spike">Volume Spike</option>
                            </select>
                        </div>
                    </fieldset>
                    
                    <fieldset className="space-y-4">
                         <legend className="text-sm font-semibold text-gray-400 mb-2">Condition</legend>
                        {triggerType === 'Price' && (
                            <div className="flex items-center gap-2">
                                <select value={priceCondition} onChange={e => setPriceCondition(e.target.value)} className={inputBaseClasses}>
                                    <option value=">">Greater than</option>
                                    <option value="<">Less than</option>
                                </select>
                                <input type="number" value={priceValue} onChange={e => setPriceValue(e.target.value)} placeholder="e.g., 70000" required className={inputBaseClasses} />
                            </div>
                        )}
                         {triggerType === 'RSI' && (
                            <div className="flex items-center gap-2">
                                 <span className="text-gray-500 dark:text-gray-400">RSI(14) is less than:</span>
                                <input type="number" value={rsiValue} onChange={e => setRsiValue(e.target.value)} placeholder="e.g., 30" required className={inputBaseClasses} />
                            </div>
                        )}
                         {triggerType === 'SMA Cross' && <p className="text-sm text-gray-400">Triggers on SMA(50) crossover of SMA(200).</p>}
                         {triggerType === 'Volume Spike' && <p className="text-sm text-gray-400">Triggers when volume exceeds 2x the 20-period average.</p>}
                    </fieldset>

                    <fieldset>
                        <legend className="block text-sm font-semibold text-gray-400 mb-2">Notify Me Via:</legend>
                        <div className="flex flex-wrap gap-3">
                            {(['Push', 'Email', 'SMS'] as const).map(channel => (
                                <button
                                    key={channel}
                                    type="button"
                                    onClick={() => handleChannelToggle(channel)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all active:scale-95 ${
                                        notificationChannels.includes(channel)
                                            ? 'bg-brand-primary border-transparent text-white'
                                            : 'bg-transparent border-brand-border-light dark:border-brand-border-dark text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-brand-dark'
                                    }`}
                                >
                                    {channel} Notification
                                </button>
                            ))}
                        </div>
                    </fieldset>
                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary">Create Alert</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CreateAlertModal;

