
import React, { useState, useEffect, useMemo } from 'react';
import { BtcLogo, EthLogo, SolLogo, BinanceLogo, AptosLogo, SeiLogo, SuiLogo, UsdtLogo, MOCK_CRYPTO_NEWS } from '@/constants';

interface TickerItemProps {
    coin: any;
    onClick?: () => void;
}

// A generic style for the ticker items
const TickerItem: React.FC<TickerItemProps> = ({ coin, onClick }) => (
    <div
        className={`flex items-center mx-4 py-2 transition-opacity ${onClick ? 'cursor-pointer hover:opacity-70' : ''}`}
        onClick={onClick}
    >
        {coin.logo}
        <span className="ml-2 font-semibold text-sm text-slate-800 dark:text-slate-200">{coin.symbol}</span>
        <span className="ml-3 font-mono text-sm text-slate-700 dark:text-slate-300">
            ${coin.price > 100 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
        </span>
        <span className={`ml-2 font-mono text-xs font-semibold ${coin.change >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
            {coin.change >= 0 ? '▲' : '▼'} {Math.abs(coin.change).toFixed(2)}%
        </span>
    </div>
);

// Special styled item for HomePage overlay
const TickerItemOverlay: React.FC<TickerItemProps> = ({ coin, onClick }) => (
    <div
        className={`flex items-center mx-4 py-2 px-4 rounded-lg bg-white/10 dark:bg-black/20 backdrop-blur-sm border border-white/10 dark:border-white/5 transition-colors ${onClick ? 'cursor-pointer hover:bg-white/20' : ''}`}
        onClick={onClick}
    >
        {coin.logo}
        <span className="ml-2 font-semibold text-sm text-slate-800 dark:text-slate-200">{coin.symbol}</span>
        <span className="ml-3 font-mono text-sm text-slate-700 dark:text-slate-300">
            ${coin.price > 100 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
        </span>
        <span className={`ml-2 font-mono text-xs font-semibold ${coin.change >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
            {coin.change >= 0 ? '▲' : '▼'} {Math.abs(coin.change).toFixed(2)}%
        </span>
    </div>
);

interface MarketTickerProps {
    variant?: 'default' | 'overlay';
    onCoinClick?: (symbol: string) => void;
}

const MarketTicker: React.FC<MarketTickerProps> = ({ variant = 'default', onCoinClick }) => {
    const initialCoins = useMemo(() => [
        { id: 'BTC', logo: <BtcLogo className="h-5 w-5" />, symbol: 'BTC', price: 68123.45, change: 1.25 },
        { id: 'ETH', logo: <EthLogo className="h-5 w-5" />, symbol: 'ETH', price: 3543.21, change: -0.55 },
        { id: 'SOL', logo: <SolLogo className="h-5 w-5" />, symbol: 'SOL', price: 171.88, change: 2.78 },
        { id: 'BNB', logo: <BinanceLogo className="h-5 w-5" />, symbol: 'BNB', price: 589.50, change: 0.15 },
        { id: 'APT', logo: <AptosLogo className="h-5 w-5" />, symbol: 'APT', price: 8.95, change: -3.12 },
        { id: 'SEI', logo: <SeiLogo className="h-5 w-5" />, symbol: 'SEI', price: 0.5532, change: 5.60 },
        { id: 'SUI', logo: <SuiLogo className="h-5 w-5" />, symbol: 'SUI', price: 1.03, change: 1.99 },
        { id: 'DOGE', logo: <UsdtLogo className="h-5 w-5" />, symbol: 'DOGE', price: 0.1614, change: 4.20 },
        { id: 'ADA', logo: <UsdtLogo className="h-5 w-5" />, symbol: 'ADA', price: 0.4587, change: -1.10 },
    ], []);

    const [coins, setCoins] = useState(initialCoins);

    useEffect(() => {
        const interval = setInterval(() => {
            setCoins(prevCoins =>
                prevCoins.map(coin => {
                    const changeFactor = (Math.random() - 0.5) * 0.005; // Smaller price change
                    const newPrice = coin.price * (1 + changeFactor);
                    const newChange = coin.change + (Math.random() - 0.5) * 0.2;
                    return { ...coin, price: newPrice, change: newChange };
                })
            );
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    const tickerItems = [...coins, ...coins]; // Duplicate for seamless long scroll
    const ItemComponent = variant === 'overlay' ? TickerItemOverlay : TickerItem;

    return (
        <div className="w-full overflow-hidden">
            <div className="animate-marquee-slow">
                <div className="flex whitespace-nowrap">
                    {tickerItems.map((coin, index) => (
                        <ItemComponent
                            key={`${coin.id}-${index}`}
                            coin={coin}
                            onClick={onCoinClick ? () => onCoinClick(coin.symbol) : undefined}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketTicker;
