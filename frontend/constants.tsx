
import React from 'react';
// FIX: Added all missing type imports to resolve 'Cannot find name' errors.
import type { Asset, ActiveBot, BacktestResult, PricingTier, Candle, SentimentData, SentimentSource, SentimentLabel, InsiderFiling, OnChainMetric, MarketRegime, TokenUnlockEvent, RegimeDataPoint, CointegratedPair, CustomMLModel, ModelVersion, MarketplaceModel, FinancialStatementData, FinancialStatementRow, EconomicEvent, NewsArticle, ScreenerResult, SectorPerformance, Watchlist, Alert, AnalystRating, ResearchReport, BlockTrade, DarkPoolPrint, UnusualVolumeSpike, UnusualOptionTrade, StrategyTemplate, SampleJob, Holding, Trade, Exchange, BlogPost, StrategyOfTheWeek, PortfolioProject, ClientTestimonial, EducationResource, CmcArticle, CmcTrendingCoin, CmcGlossaryTerm, CmcLearnCampaign } from './types';

// New Logo Components
export const BtcLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="currentColor" color="#f7931a"><path d="M30,16A14,14,0,1,1,16,2,14,14,0,0,1,30,16ZM21.5,16.21h-2.3a1.5,1.5,0,0,0-1.29-1.32l.73-2.93-1.7-.42-.71,2.84a1.51,1.51,0,0,0-1.28-.73h-.5V10.87l4.47-1.12-1.12-4.47-4.47,1.12v.11h-.64a1.5,1.5,0,0,0-1.48,1.38l-1,4.21a1.5,1.5,0,0,0,0,.2,1.5,1.5,0,0,0-1.45-1.58H10.5v2.36h.28a1.5,1.5,0,0,0,1.48-1.38l1-4.21a1.5,1.5,0,0,0,0-.2,1.5,1.5,0,0,0,1.45-1.58h.64V8.58L10.5,7.46l1.12-4.47L16.09,4.1v-.1h.5a1.5,1.5,0,0,0,1.48-1.38l.73-2.93,1.7.42-.73,2.93A1.5,1.5,0,0,0,21.07,7h.14l4.47-1.12L24.56,10.4,21.5,11.12V13.5h.3a1.5,1.5,0,0,0,1.47-1.34l.36-1.43,1.71.43-.36,1.43a1.5,1.5,0,0,0-1.47,1.64v.94Zm-4.14,2.36h-4v4.72h4a2.36,2.36,0,0,0,0-4.72Zm.59,2.36a.59.59,0,0,1,0,1.18h-2.22V19.39h2.22a.59.59,0,0,1,0,1.18Z" /></svg>
);
export const EthLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="#8a92b2" d="M16 2L15.5 17.5 16 20.5 24.5 12z"></path><path fill="#627eea" d="M16 2L7.5 12 16 20.5V2z"></path><path fill="#8a92b2" d="M16 22.5L15.5 24.5 16 30 24.5 14z"></path><path fill="#627eea" d="M16 30V22.5L7.5 14z"></path><path fill="#465785" d="M16 20.5L24.5 12 16 8z"></path><path fill="#8a92b2" d="M7.5 12L16 20.5V8z"></path></svg>
);
export const SolLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sol-gradient" x1="53.8%" x2="53.8%" y1="0%" y2="100%"><stop offset="0%" stopColor="#00FFA3"></stop><stop offset="100%" stopColor="#DC1FFF"></stop></linearGradient></defs><path fill="url(#sol-gradient)" d="M1024 288.525c-51.2 0-89.6 25.6-115.2 51.2-25.6 25.6-51.2 64-115.2 64s-89.6-25.6-115.2-51.2c-25.6-25.6-51.2-64-115.2-64-64 0-89.6 25.6-115.2 51.2-25.6 25.6-51.2 64-115.2 64-64 0-89.6-25.6-115.2-51.2C89.6 256.425 64 224.425 0 224.425v511.9c51.2 0 89.6-25.6 115.2-51.2 25.6-25.6 51.2-64 115.2-64s89.6 25.6 115.2 51.2c25.6 25.6 51.2 64 115.2 64 64 0 89.6-25.6 115.2-51.2 25.6-25.6 51.2-64 115.2-64s89.6 25.6 115.2 51.2c25.6 25.6 51.2 64 115.2 64 64 0 89.6-25.6 115.2-51.2 25.6-25.6 51.2-64 115.2-64v-512c-51.2 0-89.6 25.6-115.2 51.2-25.6 25.6-51.2 64-115.2 64z"></path></svg>
);
export const UsdtLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="currentColor" color="#26A17B"><circle cx="64" cy="64" r="64"></circle><path fill="#fff" d="M79.5 32.3h-31c-6.9 0-12.5 5.6-12.5 12.5v.2h14.4v-6h19v6h14.4v-.2c.1-6.9-5.5-12.5-12.3-12.5zM36 49.2c-6.9 0-12.5 5.6-12.5 12.5v.3h14.4v29.5h6.2V62h13.2v29.5h6.2V62h13.2v29.5h6.2V62h14.4v-.3c0-6.9-5.6-12.5-12.5-12.5H36z"></path></svg>
);
export const BinanceLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="12" fill="#F0B90B" />
        <path fill="black" d="M16.624 13.92l3.377-3.378-3.377-3.378-3.377 3.378 3.377 3.378zm-4.624-6.578L10.252 9.1 12 10.848l1.748-1.748-1.748-1.748zM12 15.672l-1.748-1.75-3.378 3.378 1.748 1.75 3.378-3.378zm0-7.344l1.748 1.75 3.378-3.378-1.748-1.75-3.378 3.378zM7.376 13.92l-3.377-3.378 3.377-3.378 3.377 3.378-3.377 3.378zm4.624 4.624L10.252 16.8 12 18.548l1.748-1.748-1.748-1.748zM12 12l1.748 1.748L15.496 12l-1.748-1.748L12 12zM12 21.943l1.748-1.75L12 18.445l-1.748 1.748L12 21.943zm0-19.886l-1.748 1.75L12 5.555l1.748-1.748L12 2.057z" />
    </svg>
);
export const KucoinLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill="#24AE8F" d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10,10S17.52,2,12,2z M17,16.2L12.79,12l4.21-4.21l-0.71-0.71 L12.08,11.29l-2.4-2.4V8.18h-1.42v3.82l3.11,3.11l-3.11,3.11v0.71h1.42v-0.71l2.4-2.4l0.71,0.71l-0.71,0.71l-2.4-2.4l-0.71,0.71 l3.11,3.11h4.53V16.2z"></path>
    </svg>
);
export const AptosLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" color="#000000" strokeWidth="1.5">
        <path d="M7.75 2.5L2.5 7.75V16.25L7.75 21.5H16.25L21.5 16.25V7.75L16.25 2.5H7.75Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 7.75L17.25 16.25H6.75L12 7.75Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.875 13.375H14.125" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
export const SeiLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 12L12 4L20 12L12 20L4 12Z" fill="#9945FF" />
    </svg>
);
export const SuiLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48,2,2,6.48,2,12s4.48,10,10,10 10-4.48,10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#0288D1" />
        <path d="M12 7l-4 4h8l-4-4z" fill="#0288D1" />
        <path d="M12 17l4-4h-8l4 4z" fill="#0288D1" />
    </svg>
);

// New logos for partners section
export const InteractiveBrokersLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 200 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">InteractiveBrokers</text>
    </svg>
);

export const CoinbaseLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 110 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">coinbase</text>
    </svg>
);

export const BitfinexLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">BITFINEX</text>
    </svg>
);

export const TradierLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">tradier</text>
    </svg>
);

export const TradingTechnologiesLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 200 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold">TRADING TECHNOLOGIES</text>
    </svg>
);

export const TerminalLinkLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 150 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold">TERMINAL LINK</text>
    </svg>
);

export const AlpacaLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">Alpaca</text>
    </svg>
);

export const TradeStationLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 150 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">TradeStation</text>
    </svg>
);

export const CharlesSchwabLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="12" fontFamily="Garamond, serif" fontSize="14" fontStyle="italic">charles</text>
        <text x="0" y="27" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold">SCHWAB</text>
    </svg>
);

export const KrakenLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">kraken</text>
    </svg>
);

export const SscEzeLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">SS&C | EZE</text>
    </svg>
);

export const SamcoLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">SAMCO</text>
    </svg>
);

export const ZerodhaLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 100 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">ZERODHA</text>
    </svg>
);

export const TdAmeritradeLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 120 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="20" height="20" />
        <text x="3" y="15" fill="white" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold">TD</text>
        <text x="25" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">Ameritrade</text>
    </svg>
);

// Social Login Icons
export const GoogleLogo = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);
export const GithubLogo = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
);
export const AppleLogo = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.228 15.352a2.333 2.333 0 01-.873.111c-.927 0-1.613-.533-2.347-1.6-.733-1.067-1.28-2.427-1.64-4.08h.027c.907.027 1.947-.4 2.827-1.12.827-.667 1.293-1.493 1.4-2.48h.026c-.453 1.04-.32 2.213.4 3.52.333.613.787 1.213 1.36 1.8.187-.107.4-.2.64-.28a.42.42 0 00.107-.213c-.08-.027-.187-.053-.32-.08a1.294 1.294 0 00-.586-.107c-1.147 0-2.147.533-3 1.6zm-3.36-4.48c.107.027.213.04.32.04.053 0 .107-.013.16-.04.48-.107.88-.307 1.2-.613.293-.294.507-.693.64-1.174-.133-.027-.267-.04-.4-.04-.987 0-1.84.453-2.56 1.36-.027.026-.08.066-.16.12-.24.16-.427.266-.56.32a.16.16 0 00-.053.106c.053.027.107.027.16.027zM12.001 0C10.2 0 8.561.427 7.081 1.28a6.38 6.38 0 00-2.72 2.72C3.5 5.467 3.074 7.107 3.074 8.907c0 1.546.334 2.986.974 4.32.64 1.333 1.546 2.413 2.72 3.24.053 0 .08-.027.08-.08a.19.19 0 00-.08-.16c-.16-.08-.347-.187-.56-.32a.57.57 0 01-.267-.427c0-.106.027-.213.08-.32.053-.106.133-.213.24-.32.053-.053.107-.106.16-.16.053-.053.107-.093.16-.133.453-.347.88-.587 1.28-.72.4-.133.8-.2 1.2-.2H12a2.44 2.44 0 01.666-.08c.507-.053.987-.2 1.44-.453.453-.253.84-.573 1.16-.96.32-.387.56-.813.72-1.28.16-.467.24-.96.24-1.48 0-1.8-1.013-3.32-3.04-4.56a4.42 4.42 0 00-1.2-2.346C13.28 1.467 12.08 1.2 10.76 1.12a.304.304 0 00-.187-.026A3.483 3.483 0 008.4 1.627a.122.122 0 01-.133.026c.267-.213.56-.373.88-.48a2.6 2.6 0 011.013-.16c.347 0 .68.053 1 .16s.613.267.88.48c.267.213.48.48.64.8s.24.68.24 1.067c0 .346-.053.68-.16.986a1.6 1.6 0 01-.48.747c-.24.213-.533.36-.88.44-.347.08-.72.12-1.12.12-.133 0-.267 0-.4-.027a.2.2 0 00-.134.027c.054.08.08.133.08.16a.42.42 0 01-.133.32c-.107.08-.24.12-.4.12s-.293-.04-.4-.12a.42.42 0 01-.133-.32c0-.027.026-.08.08-.16a.2.2 0 00-.133-.027c-.134.027-.267.027-.4.027-.347 0-.68-.053-1-.16a2.027 2.027 0 01-.88-.48c-.267-.213-.48-.48-.64-.8a2.12 2.12 0 01-.24-1.067c0-.347.053-.68.16-1a1.693 1.693 0 01.48-.746c.24-.214.533-.36.88-.44.346-.08.72-.12 1.12-.12h.026a.204.204 0 00.134-.027c.053-.08.08-.133.08-.16a.42.42 0 01-.133-.32.42.42 0 01.133-.32c.107-.08.24-.12.4-.12s.293.04.4.12a.42.42 0 01.133.32c0 .027-.027.08-.08.16a.2.2 0 00.133.027c.107 0 .214.013.32.04zm-.347 16.426a4.42 4.42 0 003.147-1.306c.72-.747 1.253-1.667 1.6-2.76.346-1.093.52-2.266.52-3.52 0-.613-.08-1.213-.24-1.813a.14.14 0 00-.16-.106c-1.067.453-1.92.973-2.56 1.56-.64.587-1.12 1.28-1.44 2.08-.32.8-.48 1.68-.48 2.64 0 1.2.226 2.293.666 3.28z" />
    </svg>
);

export const CoinMarketCapLogo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 112 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <text x="0" y="15" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">CoinMarketCap</text>
    </svg>
);

export const PolkadotLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#E6007A" />
        <circle cx="12" cy="6" r="2" fill="white" />
        <circle cx="12" cy="18" r="2" fill="white" />
        <circle cx="6" cy="12" r="2" fill="white" />
        <circle cx="18" cy="12" r="2" fill="white" />
    </svg>
);

export const ChainlinkLogo = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.68 13.39L8.2 9.87a3 3 0 014.24 0l2.12 2.12-4.24 4.24a3 3 0 01-4.24 0l-.36-.36z" fill="#375BD2" />
        <path d="M19.32 10.61l-3.52 3.52a3 3 0 01-4.24 0L9.44 12l4.24-4.24a3 3 0 014.24 0l1.4 1.4z" fill="#375BD2" />
    </svg>
);

export const MailIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);


export const MOCK_ASSETS: Asset[] = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', logo: <BtcLogo />, amount: 0.5, price: 68000, value: 34000, price24h: 67500, history: [{ time: 'Jan', value: 21000 }, { time: 'Feb', value: 25000 }, { time: 'Mar', value: 30000 }, { time: 'Apr', value: 28000 }, { time: 'May', value: 32000 }, { time: 'Jun', value: 34000 }] },
    { id: '2', name: 'Ethereum', symbol: 'ETH', logo: <EthLogo />, amount: 10, price: 3500, value: 35000, price24h: 3550, history: [{ time: 'Jan', value: 20000 }, { time: 'Feb', value: 22000 }, { time: 'Mar', value: 28000 }, { time: 'Apr', value: 27000 }, { time: 'May', value: 33000 }, { time: 'Jun', value: 35000 }] },
    { id: '3', name: 'Solana', symbol: 'SOL', logo: <SolLogo />, amount: 150, price: 170, value: 25500, price24h: 165, history: [{ time: 'Jan', value: 15000 }, { time: 'Feb', value: 18000 }, { time: 'Mar', value: 22000 }, { time: 'Apr', value: 20000 }, { time: 'May', value: 26000 }, { time: 'Jun', value: 25500 }] },
    { id: '4', name: 'Tether', symbol: 'USDT', logo: <UsdtLogo />, amount: 5000, price: 1, value: 5000, price24h: 1, history: [{ time: 'Jan', value: 5000 }, { time: 'Feb', value: 5000 }, { time: 'Mar', value: 5000 }, { time: 'Apr', value: 5000 }, { time: 'May', value: 5000 }, { time: 'Jun', value: 5000 }] },
];

export const MOCK_ACTIVE_BOTS: ActiveBot[] = [
    { id: '1', name: 'ETH Momentum Bot', market: 'ETH/USDT', strategy: 'RSI Crossover', pnl: 1250.75, pnlPercent: 12.5, status: 'active', isRegimeAware: true, regimeStrategies: { 'Bull Volatile': 'Momentum Long', 'Ranging': 'Grid Trading', 'Bear Stable': 'Mean Reversion Short' }, sentimentScore: 0.65 },
    { id: '2', name: 'BTC Trend Follower', market: 'BTC/USDT', strategy: 'MACD Crossover', pnl: -340.50, pnlPercent: -3.4, status: 'active', sentimentScore: -0.21 },
    { id: '3', name: 'SOL Scalper', market: 'SOL/USDT', strategy: 'EMA Crossover', pnl: 880.00, pnlPercent: 8.8, status: 'active', sentimentScore: 0.15 },
    { id: '4', name: 'BTC LSTM Predictor', market: 'BTC/USDT', strategy: 'Custom ML Model', pnl: 450.20, pnlPercent: 4.5, status: 'active', customModelId: '1', sentimentScore: 0.05 },
];

export const MOCK_BACKTEST_RESULTS: BacktestResult[] = [
    { id: '1', market: 'BTC/USDT', strategy: 'RSI Crossover', timeframe: '4h', date: '2023-10-22', profitPercent: 52.4, maxDrawdown: 5.19, winRate: 62.5, sharpeRatio: 1.8, profit_percent: 52.4 },
    { id: '2', market: 'ETH/USDT', strategy: 'MACD Crossover', timeframe: '1h', date: '2023-10-21', profitPercent: 88.9, maxDrawdown: 25.1, winRate: 55.0, sharpeRatio: 1.2, profit_percent: 88.9 },
];

export const MOCK_STRATEGIES = [
    'RSI Crossover',
    'MACD Crossover',
    'EMA Crossover',
    'SMA Crossover',
    'Bollinger Bands',
    'Stochastic Oscillator',
    'Supertrend',
    'OBV',
    'Grid Trading',
    'Momentum Long',
    'Mean Reversion Short',
    'Custom ML Model',
    'Upload Custom Strategy'
];

export const MOCK_STRATEGY_PARAMS: Record<string, Record<string, { label: string; type: string; defaultValue: number; min?: number; max?: number; step?: number }>> = {
    'RSI Crossover': {
        period: { label: 'RSI Period', type: 'number', defaultValue: 14, min: 2, max: 50, step: 1 },
        overbought: { label: 'Overbought Threshold', type: 'number', defaultValue: 70, min: 50, max: 100, step: 1 },
        oversold: { label: 'Oversold Threshold', type: 'number', defaultValue: 30, min: 0, max: 50, step: 1 },
    },
    'MACD Crossover': {
        fastPeriod: { label: 'Fast EMA Period', type: 'number', defaultValue: 12, min: 2, max: 50, step: 1 },
        slowPeriod: { label: 'Slow EMA Period', type: 'number', defaultValue: 26, min: 10, max: 100, step: 1 },
        signalPeriod: { label: 'Signal Line Period', type: 'number', defaultValue: 9, min: 2, max: 50, step: 1 },
    },
    'EMA Crossover': {
        shortPeriod: { label: 'Short EMA Period', type: 'number', defaultValue: 9, min: 2, max: 50, step: 1 },
        longPeriod: { label: 'Long EMA Period', type: 'number', defaultValue: 21, min: 10, max: 100, step: 1 },
    },
    'SMA Crossover': {
        shortPeriod: { label: 'Short SMA Period', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
        longPeriod: { label: 'Long SMA Period', type: 'number', defaultValue: 50, min: 20, max: 200, step: 1 },
    },
    'Bollinger Bands': {
        period: { label: 'Lookback Period', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
        stdDev: { label: 'Standard Deviations', type: 'number', defaultValue: 2, min: 1, max: 4, step: 0.1 },
    },
    'Stochastic Oscillator': {
        kPeriod: { label: '%K Period', type: 'number', defaultValue: 14, min: 5, max: 50, step: 1 },
        slowingK: { label: 'Slowing %K Period', type: 'number', defaultValue: 3, min: 1, max: 20, step: 1 },
        dPeriod: { label: '%D Period', type: 'number', defaultValue: 3, min: 1, max: 20, step: 1 },
        overbought: { label: 'Overbought Threshold', type: 'number', defaultValue: 80, min: 50, max: 100, step: 1 },
        oversold: { label: 'Oversold Threshold', type: 'number', defaultValue: 20, min: 0, max: 50, step: 1 },
    },
    'Supertrend': {
        atrPeriod: { label: 'ATR Period', type: 'number', defaultValue: 10, min: 5, max: 50, step: 1 },
        factor: { label: 'ATR Factor', type: 'number', defaultValue: 3, min: 1, max: 10, step: 0.5 },
    },
    'OBV': {
        maPeriod: { label: 'OBV MA Period', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
    },
    'Grid Trading': {
        upperBound: { label: 'Upper Bound', type: 'number', defaultValue: 70000, step: 100 },
        lowerBound: { label: 'Lower Bound', type: 'number', defaultValue: 65000, step: 100 },
        grids: { label: 'Number of Grids', type: 'number', defaultValue: 10, min: 2, max: 100, step: 1 },
    },
    'Momentum Long': {
        period: { label: 'Lookback Period', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
        threshold: { label: 'Momentum Threshold %', type: 'number', defaultValue: 2, min: 1, max: 10, step: 0.5 },
    },
    'Mean Reversion Short': {
        period: { label: 'Lookback Period', type: 'number', defaultValue: 20, min: 5, max: 100, step: 1 },
        stdDev: { label: 'Std. Deviations', type: 'number', defaultValue: 2, min: 1, max: 4, step: 0.1 },
    },
    'Custom ML Model': {},
    'Upload Custom Strategy': {},
};

export const MOCK_STRATEGY_TEMPLATES: StrategyTemplate[] = [
    {
        name: 'RSI Crossover',
        title: 'RSI Momentum',
        description: 'A classic mean-reversion strategy. Buys when RSI enters the oversold territory and sells when it enters the overbought territory. Good for ranging markets.',
        tags: ['Mean Reversion', 'Oscillator', 'Ranging Market'],
    },
    {
        name: 'MACD Crossover',
        title: 'MACD Trend Following',
        description: 'A trend-following strategy that buys when the MACD line crosses above the signal line, and sells when it crosses below. Aims to capture sustained trends.',
        tags: ['Trend Following', 'Momentum', 'Trending Market'],
    },
    {
        name: 'EMA Crossover',
        title: 'Golden/Death Cross',
        description: 'Uses two Exponential Moving Averages (a short-period and a long-period). A buy signal is generated on a "golden cross" (short EMA crosses above long EMA), and a sell on a "death cross".',
        tags: ['Trend Following', 'Moving Average'],
    },
    {
        name: 'Bollinger Bands',
        title: 'Bollinger Bands Mean Reversion',
        description: 'Trades on the assumption that price will revert to the mean. It sells when price hits the upper Bollinger Band and buys when it hits the lower band.',
        tags: ['Mean Reversion', 'Volatility', 'Ranging Market'],
    },
    {
        name: 'Supertrend',
        title: 'Supertrend Follower',
        description: 'A straightforward trend-following indicator. It plots a line on the chart that flips above or below the price to signal changes in trend direction.',
        tags: ['Trend Following', 'Volatility'],
    },
];


export const PORTFOLIO_VALUE_DATA = [
    { name: 'Jan', value: 65000 }, { name: 'Feb', value: 71000 }, { name: 'Mar', value: 82000 },
    { name: 'Apr', value: 78000 }, { name: 'May', value: 95000 }, { name: 'Jun', value: 105000 },
];

export const PORTFOLIO_ALLOCATION_DATA = [
    { name: 'Bitcoin', value: 34000 }, { name: 'Ethereum', value: 35000 },
    { name: 'Solana', value: 25500 }, { name: 'Cash', value: 5000 },
];

export const EQUITY_CURVE_DATA = [
    { name: 'Start', value: 10000, profitPercent: 0, drawdown: 0, winRate: 0 },
    { name: 'W1', value: 10500, profitPercent: 5.0, drawdown: 0, winRate: 100.0 },
    { name: 'W2', value: 11200, profitPercent: 12.0, drawdown: 0, winRate: 100.0 },
    { name: 'W3', value: 10800, profitPercent: 8.0, drawdown: 3.57, winRate: 66.7 },
    { name: 'W4', value: 12000, profitPercent: 20.0, drawdown: 0, winRate: 75.0 },
    { name: 'W5', value: 11500, profitPercent: 15.0, drawdown: 4.17, winRate: 60.0 },
    { name: 'W6', value: 13500, profitPercent: 35.0, drawdown: 0, winRate: 66.7 },
    { name: 'W7', value: 12800, profitPercent: 28.0, drawdown: 5.19, winRate: 57.1 },
    { name: 'W8', value: 15240, profitPercent: 52.4, drawdown: 0, winRate: 62.5 },
];

export const PRICING_TIERS: PricingTier[] = [
    {
        name: "Hobbyist",
        price: "Free",
        priceUnit: "",
        features: ["1 Connected Exchange", "10 Backtests/month", "1 Active Bot (pre-made)", "Portfolio Tracking"],
        cta: "Start for Free",
        isFeatured: false,
    },
    {
        name: "Pro Trader",
        price: "$49",
        priceUnit: "/ mo",
        features: ["5 Connected Exchanges", "Unlimited Backtests", "10 Active Bots (custom)", "Advanced Analytics"],
        cta: "Go Pro",
        isFeatured: true,
    },
    {
        name: "Enterprise",
        price: "Contact Us",
        priceUnit: "",
        features: ["Everything in Pro", "Custom-built trading algorithms", "Personal consultation", "Dedicated support"],
        cta: "Contact Sales",
        isFeatured: false,
    }
];

// Candlestick chart data
const generateInitialCandleData = (startTime: number, numCandles: number): Candle[] => {
    const data: Candle[] = [];
    let lastClose = 68000;
    let currentTime = startTime;

    for (let i = 0; i < numCandles; i++) {
        const open = lastClose;
        const close = open + (Math.random() - 0.5) * 500;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        data.push({ time: currentTime, open, high, low, close });
        lastClose = close;
        currentTime += 60 * 1000; // 1 minute candles
    }
    return data;
};

export const MOCK_CANDLE_DATA: Candle[] = generateInitialCandleData(new Date().getTime() - 60 * 60 * 1000, 60);

export const generateNewCandle = (lastCandle: Candle): Candle => {
    const open = lastCandle.close;
    const close = open + (Math.random() - 0.5) * 300;
    const high = Math.max(open, close) + Math.random() * 150;
    const low = Math.min(open, close) - Math.random() * 150;
    return { time: lastCandle.time + 60 * 1000, open, high, low, close };
};

// Sentiment Engine Data
export const generateInitialSentimentData = (numPoints: number): SentimentData[] => {
    const data: SentimentData[] = [];
    let lastScore = 0.1; // Start slightly positive
    let currentTime = new Date().getTime() - numPoints * 3000;
    for (let i = 0; i < numPoints; i++) {
        const change = (Math.random() - 0.5) * 0.4;
        let newScore = lastScore + change;
        newScore = Math.max(-1, Math.min(1, newScore)); // Clamp between -1 and 1
        data.push({ time: currentTime, score: newScore });
        lastScore = newScore;
        currentTime += 3000;
    }
    return data;
};

export const generatePriceDataForSentiment = (sentimentData: SentimentData[], initialPrice: number, volatility: number): { time: number; price: number }[] => {
    let lastPrice = initialPrice;
    return sentimentData.map(sentimentPoint => {
        // Sentiment provides a slight directional bias, while random walk provides general volatility
        const sentimentInfluence = sentimentPoint.score * volatility * 0.5;
        const randomWalk = (Math.random() - 0.5) * volatility;
        const newPrice = lastPrice + sentimentInfluence + randomWalk;
        // Ensure price doesn't go below a reasonable threshold (e.g., 0)
        lastPrice = newPrice > 0 ? newPrice : lastPrice;
        return { time: sentimentPoint.time, price: lastPrice };
    });
};


export const generateNewSentimentPoint = (lastPoint: SentimentData): SentimentData => {
    const change = (Math.random() - 0.5) * 0.3;
    let newScore = lastPoint.score + change;
    newScore = Math.max(-1, Math.min(1, newScore)); // Clamp
    return { time: new Date().getTime(), score: newScore };
};

const mockHeadlines = [
    { text: "Bitcoin surges past $70,000 as institutional interest grows", sentiment: 'Positive' as SentimentLabel },
    { text: "Regulators announce crackdown on crypto exchanges, causing market uncertainty", sentiment: 'Negative' as SentimentLabel },
    { text: "Ethereum's new update promises lower fees and faster transactions", sentiment: 'Positive' as SentimentLabel },
    { text: "Solana network experiences another outage, developers working on a fix", sentiment: 'Negative' as SentimentLabel },
    { text: "Market analysts predict a stable period for major cryptocurrencies", sentiment: 'Neutral' as SentimentLabel },
    { text: "A new DeFi protocol on Ethereum locks in $100M in a week", sentiment: 'Positive' as SentimentLabel }
];

export const generateNewSentimentSource = (): SentimentSource => {
    const randomHeadline = mockHeadlines[Math.floor(Math.random() * mockHeadlines.length)];
    const sources: Array<'Twitter' | 'Reddit' | 'News'> = ['Twitter', 'Reddit', 'News'];
    return {
        id: `src_${new Date().getTime()}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        content: randomHeadline.text,
        sentiment: randomHeadline.sentiment,
        timestamp: new Date().toLocaleTimeString(),
    };
};

// Corporate Filings Data
const mockInsiders = [
    { name: 'Satya Nadella', role: 'CEO' }, { name: 'Elon Musk', role: 'CEO' }, { name: 'Tim Cook', role: 'CEO' },
    { name: 'Jensen Huang', role: 'CEO' }, { name: 'Sundar Pichai', role: 'CEO' }, { name: 'Amy Hood', role: 'CFO' },
];
const mockTickers = ['MSFT', 'TSLA', 'AAPL', 'NVDA', 'GOOGL'];

export const generateNewFiling = (watchlist: string[]): InsiderFiling => {
    const ticker = watchlist[Math.floor(Math.random() * watchlist.length)];
    const insider = mockInsiders[Math.floor(Math.random() * mockInsiders.length)];
    const transactionType = Math.random() > 0.4 ? 'Buy' : 'Sell';
    const shares = Math.floor(Math.random() * 5000) + 100;
    const sharePrice = Math.floor(Math.random() * 200) + 50;
    const totalValue = shares * sharePrice;

    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 5));

    return {
        id: `filing_${new Date().getTime()}`,
        ticker,
        insiderName: insider.name,
        insiderRole: insider.role,
        transactionType,
        transactionDate: date.toISOString().split('T')[0],
        shares,
        sharePrice,
        totalValue,
    };
};

// On-Chain Analyzer Data
export const generateOnChainMetricData = (numPoints: number, startValue: number, volatility: number, trend: number, isInteger = false, canBeNegative = false): OnChainMetric[] => {
    const data: OnChainMetric[] = [];
    let lastValue = startValue;
    let currentTime = new Date().getTime() - numPoints * 60 * 60 * 1000; // hourly points

    for (let i = 0; i < numPoints; i++) {
        let change = (Math.random() - 0.5) * volatility;
        if (!canBeNegative) {
            change = (Math.random() - 0.45) * volatility; // Skew towards positive
        }
        let newValue = lastValue + change + trend;
        if (!canBeNegative) {
            newValue = Math.max(0, newValue);
        }
        if (isInteger) {
            newValue = Math.round(newValue);
        }
        data.push({ time: currentTime, value: newValue });
        lastValue = newValue;
        currentTime += 60 * 60 * 1000; // 1 hour steps
    }
    return data;
};

export const MOCK_BTC_ONCHAIN_DATA = {
    exchangeFlow: generateOnChainMetricData(100, 0, 1000, 0, true, true), // Can be pos/neg
    whaleTransactions: generateOnChainMetricData(100, 50, 20, 0.1, true, false), // Only pos
    hashRate: generateOnChainMetricData(100, 500, 10, 0.5, false, false), // Only pos, TH/s
};

export const MOCK_ETH_ONCHAIN_DATA = {
    exchangeFlow: generateOnChainMetricData(100, 0, 8000, 0, true, true),
    whaleTransactions: generateOnChainMetricData(100, 150, 50, 0.2, true, false),
    hashRate: generateOnChainMetricData(100, 1000, 20, 1, false, false), // PH/s
};

// Market Regime Classifier Data
export const REGIME_DEFINITIONS: Record<MarketRegime, { description: string, color: string, textColor: string }> = {
    'Bull Volatile': {
        description: 'Strong upward trend with high price swings. High risk, high potential reward.',
        color: 'bg-brand-success',
        textColor: 'text-brand-success',
    },
    'Bull Stable': {
        description: 'Steady upward trend with low price swings. Good for trend-following strategies.',
        color: 'bg-brand-success-light',
        textColor: 'text-brand-success-light',
    },
    'Bear Volatile': {
        description: 'Strong downward trend with high price swings. High risk, potential for shorting.',
        color: 'bg-brand-danger',
        textColor: 'text-brand-danger',
    },
    'Bear Stable': {
        description: 'Steady downward trend with low price swings. Lower risk shorting opportunities.',
        color: 'bg-brand-danger-light',
        textColor: 'text-brand-danger-light',
    },
    'Ranging': {
        description: 'No clear trend, price is moving sideways. Best for mean-reversion strategies.',
        color: 'bg-brand-warning',
        textColor: 'text-brand-warning',
    }
};

export const generateRegimeData = (numPoints: number): RegimeDataPoint[] => {
    const data: RegimeDataPoint[] = [];
    let lastPrice = 68000;
    let currentTime = new Date().getTime() - numPoints * 60 * 60 * 1000; // Hourly data
    const regimes: MarketRegime[] = ['Bull Stable', 'Bull Volatile', 'Ranging', 'Bear Volatile', 'Bear Stable'];
    let currentRegime: MarketRegime = 'Bull Stable';

    for (let i = 0; i < numPoints; i++) {
        // Change regime every ~20 points
        if (i > 0 && i % 20 === 0) {
            currentRegime = regimes[Math.floor(Math.random() * regimes.length)];
        }

        let priceChange = 0;
        switch (currentRegime) {
            case 'Bull Volatile': priceChange = (Math.random() - 0.4) * 1000; break;
            case 'Bull Stable': priceChange = (Math.random() - 0.3) * 300; break;
            case 'Bear Volatile': priceChange = (Math.random() - 0.6) * 1000; break;
            case 'Bear Stable': priceChange = (Math.random() - 0.7) * 300; break;
            case 'Ranging': priceChange = (Math.random() - 0.5) * 400; break;
        }

        const newPrice = lastPrice + priceChange;
        data.push({ time: currentTime, price: newPrice, regime: currentRegime });
        lastPrice = newPrice;
        currentTime += 60 * 60 * 1000;
    }
    return data;
};

export const MOCK_REGIME_DATA = generateRegimeData(120); // 120 hours of data

// Correlation & Pairs Trading Data
export const MOCK_CORRELATION_ASSETS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
export const MOCK_CORRELATION_MATRIX = {
    'BTC': { 'BTC': 1.00, 'ETH': 0.85, 'SOL': 0.65, 'ADA': 0.55, 'DOT': 0.50 },
    'ETH': { 'BTC': 0.85, 'ETH': 1.00, 'SOL': 0.75, 'ADA': 0.65, 'DOT': 0.60 },
    'SOL': { 'BTC': 0.65, 'ETH': 0.75, 'SOL': 1.00, 'ADA': 0.80, 'DOT': 0.70 },
    'ADA': { 'BTC': 0.55, 'ETH': 0.65, 'SOL': 0.80, 'ADA': 1.00, 'DOT': 0.75 },
    'DOT': { 'BTC': 0.50, 'ETH': 0.60, 'SOL': 0.70, 'ADA': 0.75, 'DOT': 1.00 },
};

const generateSpreadHistory = (numPoints: number, mean: number, stdDev: number, currentZ: number): { time: number; value: number }[] => {
    const data = [];
    let currentTime = new Date().getTime() - numPoints * 60 * 60 * 1000;
    for (let i = 0; i < numPoints - 1; i++) {
        const value = mean + (Math.random() - 0.5) * stdDev * 3;
        data.push({ time: currentTime, value });
        currentTime += 60 * 60 * 1000;
    }
    // Add the current point
    data.push({ time: currentTime, value: mean + currentZ * stdDev });
    return data;
};

export const MOCK_COINTEGRATED_PAIRS: CointegratedPair[] = [
    { id: '1', pair: ['ETH', 'BTC'], cointegrationScore: 0.92, zScore: -2.15, signal: 'Buy Pair', spreadHistory: generateSpreadHistory(50, 0.055, 0.002, -2.15) },
    { id: '2', pair: ['SOL', 'ADA'], cointegrationScore: 0.88, zScore: 2.30, signal: 'Sell Pair', spreadHistory: generateSpreadHistory(50, 150, 8, 2.30) },
    { id: '3', pair: ['DOT', 'ADA'], cointegrationScore: 0.85, zScore: 1.1, signal: 'Hold', spreadHistory: generateSpreadHistory(50, 7.5, 0.5, 1.1) },
];

// Custom ML Models Data
export const MOCK_CUSTOM_MODELS: CustomMLModel[] = [
    {
        id: '1',
        name: 'BTC Price Predictor LSTM',
        modelType: 'LSTM',
        activeVersionId: 'v1.1',
        versions: [
            { id: 'v1.1', version: 1.1, fileName: 'btc_lstm_v1.1.h5', uploadDate: '2023-11-15', status: 'Ready', description: 'Retrained with recent volatility data.' },
            { id: 'v1.0', version: 1.0, fileName: 'btc_lstm_v1.h5', uploadDate: '2023-10-25', status: 'Ready', description: 'Initial stable release.' },
        ],
    },
    {
        id: '2',
        name: 'ETH Volatility Forecaster',
        modelType: 'Random Forest',
        activeVersionId: 'v1.0',
        versions: [
            { id: 'v1.0', version: 1.0, fileName: 'eth_rf_volatility.pkl', uploadDate: '2023-10-24', status: 'Ready', description: 'First version.' },
        ],
    },
    {
        id: '3',
        name: 'ARIMA Trend Model',
        modelType: 'ARIMA',
        activeVersionId: 'v1.0-processing',
        versions: [
            { id: 'v1.0-processing', version: 1.0, fileName: 'arima_trend.pkl', uploadDate: '2023-10-22', status: 'Processing', description: 'Initial upload.' },
        ],
    },
];

// Custom Indicator Studio
export const MOCK_INDICATOR_CODE = {
    'SMA': `#
# @params
# {
#   "period": {
#     "type": "number",
#     "label": "SMA Period",
#     "default": 20,
#     "min": 2,
#     "max": 200,
#     "step": 1
#   }
# }
# @params_end
#
import pandas as pd


def calculate(data, params):
    """
    Calculates the Simple Moving Average (SMA) for a given dataset.

    The function must be named 'calculate' and accept a pandas DataFrame
    of candle data and a 'params' dictionary containing UI parameter values.

    Args:
        data (pd.DataFrame): DataFrame with candle data, must include a 'close' column.
        params (dict): A dictionary of parameters, must include 'period'.

    Returns:
        pd.Series: A pandas Series containing the SMA values. The series is named
                   to be used as a plot label (e.g., 'SMA_20').
    """
    # Get the period from the params dictionary, with a default of 20
    period = int(params.get('period', 20))
    
    # Calculate the SMA on the 'close' price column
    indicator_values = data['close'].rolling(window=period).mean()
    
    # Return the result as a named pandas Series
    return pd.Series(indicator_values, name=f'SMA_{period}')
`,
    'RSI': `#
# @params
# {
#   "period": {
#     "type": "number",
#     "label": "RSI Period",
#     "default": 14,
#     "min": 2,
#     "max": 50,
#     "step": 1
#   }
# }
# @params_end
#
import pandas as pd


def calculate(data, params):
    """
    Calculates the Relative Strength Index (RSI) using a Simple Moving Average.

    Args:
        data (pd.DataFrame): DataFrame with candle data, including a 'close' column.
        params (dict): A dictionary of parameters, including 'period'.

    Returns:
        pd.Series: A pandas Series containing the RSI values, named for plotting.
    """
    period = int(params.get('period', 14))
    
    # Calculate price differences
    delta = data['close'].diff()
    
    # Calculate average gains and losses
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    
    # Calculate Relative Strength (RS)
    rs = gain / loss
    
    # Calculate RSI
    rsi = 100 - (100 / (1 + rs))
    
    return pd.Series(rsi, name=f'RSI_{period}')
`,
    'MACD': `#
# @params
# {
#   "fast_period": { "type": "number", "label": "Fast EMA Period", "default": 12, "min": 2, "max": 50, "step": 1 },
#   "slow_period": { "type": "number", "label": "Slow EMA Period", "default": 26, "min": 10, "max": 100, "step": 1 },
#   "signal_period": { "type": "number", "label": "Signal EMA Period", "default": 9, "min": 2, "max": 50, "step": 1 }
# }
# @params_end
#
import pandas as pd

def calculate(data, params):
    """
    Calculates the Moving Average Convergence Divergence (MACD).
    """
    fast_period = int(params.get('fast_period', 12))
    slow_period = int(params.get('slow_period', 26))
    signal_period = int(params.get('signal_period', 9))
    
    exp1 = data['close'].ewm(span=fast_period, adjust=False).mean()
    exp2 = data['close'].ewm(span=slow_period, adjust=False).mean()
    macd = exp1 - exp2
    signal = macd.ewm(span=signal_period, adjust=False).mean()
    
    return pd.Series(macd, name=f'MACD_{fast_period}_{slow_period}')
`,
    'Bollinger Bands': `#
# @params
# {
#   "period": { "type": "number", "label": "Lookback Period", "default": 20, "min": 2, "max": 100, "step": 1 },
#   "std_dev": { "type": "number", "label": "Standard Deviations", "default": 2, "min": 1, "max": 4, "step": 0.1 }
# }
# @params_end
#
import pandas as pd

def calculate(data, params):
    """
    Calculates Bollinger Bands (BBands).
    """
    period = int(params.get('period', 20))
    std_dev = float(params.get('std_dev', 2))
    
    middle_band = data['close'].rolling(window=period).mean()
    rolling_std = data['close'].rolling(window=period).std()
    
    upper_band = middle_band + (rolling_std * std_dev)
    lower_band = middle_band - (rolling_std * std_dev)

    return pd.Series(middle_band, name=f'BB_Middle_{period}')
`,
};

export const calculateSMA = (data: Candle[], period: number): (number | null)[] => {
    const sma: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(null);
        } else {
            const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
            sma.push(sum / period);
        }
    }
    return sma;
};


// Education Hub Data
export const EDUCATION_CONTENT: EducationResource[] = [
    // Getting Started
    { id: 'gs1', title: 'What is Quantitative Trading?', description: 'An introduction to the world of data-driven, systematic trading.', category: 'Getting Started', type: 'Concept' },
    { id: 'gs2', title: 'Setting Up Your First Bot', description: 'A step-by-step tutorial on creating and deploying a simple trading bot on the platform.', category: 'Getting Started', type: 'Article', link: '#' },
    { id: 'gs3', title: 'Understanding Backtesting', description: 'Learn why backtesting is crucial for validating a strategy before risking capital.', category: 'Getting Started', type: 'Concept' },
    // Blockchain Fundamentals
    { id: 'bf1', title: 'What is a Blockchain?', description: 'Learn the fundamental concepts behind distributed ledger technology.', category: 'Blockchain Fundamentals', type: 'Concept' },
    { id: 'bf2', title: 'Proof-of-Work vs. Proof-of-Stake', description: 'Understand the differences between the two major consensus mechanisms.', category: 'Blockchain Fundamentals', type: 'Article', link: 'https://ethereum.org/en/energy-consumption/' },
    { id: 'bf3', title: 'Smart Contracts Explained', description: 'A video explaining how smart contracts work on platforms like Ethereum.', category: 'Blockchain Fundamentals', type: 'Video', source: 'YouTube' },
    // Technical Analysis
    { id: 'ta1', title: 'Candlestick Charts', description: 'Learn to read price action through Open, High, Low, and Close data points to identify market sentiment.', category: 'Technical Analysis', type: 'Concept' },
    { id: 'ta2', title: 'Support & Resistance', description: 'Identify key price levels where the market is likely to pause or reverse.', category: 'Technical Analysis', type: 'Concept' },
    { id: 'ta3', title: 'Mastering the RSI Indicator', description: 'A deep dive into the Relative Strength Index for identifying overbought/oversold conditions.', category: 'Technical Analysis', type: 'Article', link: '#' },
    { id: 'ta4', title: 'MACD Explained', description: 'A video tutorial on using the MACD indicator to spot trend changes and momentum.', category: 'Technical Analysis', type: 'Video', link: '#', source: 'YouTube' },
    // DeFi (Decentralized Finance)
    { id: 'df1', title: 'What is DeFi?', description: 'An overview of the decentralized finance ecosystem and its core components.', category: 'DeFi (Decentralized Finance)', type: 'Article', link: 'https://a16zcrypto.com/posts/article/the-composability-of-defi/', source: 'a16z' },
    { id: 'df2', title: 'Yield Farming Guide', description: 'Learn strategies for maximizing returns on your crypto assets in DeFi.', category: 'DeFi (Decentralized Finance)', type: 'Course', link: '#', source: 'Binance Academy' },
    { id: 'df3', title: 'Automated Market Makers (AMMs)', description: 'Understand how decentralized exchanges like Uniswap and Curve work.', category: 'DeFi (Decentralized Finance)', type: 'Concept' },
    { id: 'df4', title: 'Intro to Lending & Borrowing', description: 'Explore protocols like Aave and Compound for decentralized lending.', category: 'DeFi (Decentralized Finance)', type: 'Concept' },
    // On-Chain Analysis
    { id: 'oc1', title: 'Intro to On-Chain Analysis', description: 'Learn to analyze blockchain data to gain market insights.', category: 'On-Chain Analysis', type: 'Article', link: '#', source: 'Glassnode' },
    { id: 'oc2', title: 'NVT Ratio', description: 'Using the Network Value to Transactions ratio to value a crypto-asset.', category: 'On-Chain Analysis', type: 'Concept' },
    { id: 'oc3', title: 'SOPR (Spent Output Profit Ratio)', description: 'Gauge market sentiment by analyzing whether holders are selling in profit or at a loss.', category: 'On-Chain Analysis', type: 'Concept' },
    // Risk Management
    { id: 'rm1', title: 'Position Sizing', description: 'Learn how to calculate the appropriate amount of capital to risk on a single trade.', category: 'Risk Management', type: 'Concept' },
    { id: 'rm2', title: 'Stop-Loss & Take-Profit', description: 'The most essential tools for managing risk. Predetermine your exit points for trades.', category: 'Risk Management', type: 'Concept' },
    { id: 'rm3', title: 'The Ultimate Guide to Risk Management', description: 'A comprehensive course on protecting your capital and ensuring long-term success.', category: 'Risk Management', type: 'Course', link: '#', source: 'Binance Academy' },
    // AI & ML
    { id: 'ai1', title: 'Intro to AI in Trading', description: 'Discover how Machine Learning can be used to find patterns and create predictive models.', category: 'AI & ML', type: 'Article', link: '#' },
    { id: 'ai2', title: 'What is an LSTM Model?', description: 'Understand the basics of Long Short-Term Memory networks, a popular choice for time-series forecasting.', category: 'AI & ML', type: 'Concept' },
    { id: 'ai3', title: 'Building a Custom ML Model', description: 'Learn how to upload and integrate your own trained models into the CosmoQuantAI platform.', category: 'AI & ML', type: 'Video', link: '#', source: 'YouTube' },
    // Trading Psychology
    { id: 'tp1', title: 'Trading in the Zone', description: 'A must-read book by Mark Douglas on mastering the mental game of trading.', category: 'Trading Psychology', type: 'Book', link: '#', source: 'Amazon' },
    { id: 'tp2', title: 'Understanding FOMO, FUD, and Greed', description: 'Learn to recognize and control the emotions that can lead to poor trading decisions.', category: 'Trading Psychology', type: 'Concept' },
    // NFTs & Web3
    { id: 'nft1', title: 'Introduction to NFTs', description: 'What are Non-Fungible Tokens and how do they work? A comprehensive guide.', category: 'NFTs & Web3', type: 'Article', link: 'https://ethereum.org/en/nft/' },
    { id: 'nft2', title: 'What is Web3?', description: 'Explore the concept of a decentralized internet built on blockchain.', category: 'NFTs & Web3', type: 'Concept' },
    // Security
    { id: 'sec1', title: 'How to Use a Hardware Wallet', description: 'A step-by-step guide to securing your crypto assets with a Ledger or Trezor.', category: 'Security', type: 'Article', link: '#' },
    { id: 'sec2', title: 'Spotting Phishing Scams', description: 'Learn to identify and avoid common scams targeting crypto users.', category: 'Security', type: 'Concept' },
    // Podcasts, Socials, and Tools
    { id: 'res1', title: 'Bankless Podcast', description: 'A leading podcast for exploring the frontiers of crypto finance.', category: 'DeFi (Decentralized Finance)', type: 'Podcast', link: 'https://www.bankless.com/', source: 'Bankless' },
    { id: 'res2', title: 'Cobie on X (Twitter)', description: 'Follow one of the most popular and insightful personalities in the crypto space.', category: 'Trading Psychology', type: 'Social', link: 'https://twitter.com/cobie', source: 'X / Twitter' },
    { id: 'res3', title: 'Dune Analytics', description: 'A powerful tool for exploring, visualizing, and sharing on-chain data.', category: 'On-Chain Analysis', type: 'Tool', link: 'https://dune.com/', source: 'Dune' },
    { id: 'res4', title: 'DeFi Llama', description: 'The largest TVL aggregator for DeFi, tracking total value locked across chains and protocols.', category: 'DeFi (Decentralized Finance)', type: 'Tool', link: 'https://defillama.com/', source: 'DeFiLlama' }
];

// Mock Data for ML Model Marketplace
const generateMonthlyPerformance = (): { month: string, profit: number }[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    for (let i = 0; i < 12; i++) {
        data.push({ month: months[i], profit: (Math.random() * 20) - 5 }); // Profit between -5% and +15%
    }
    return data;
};

export const MOCK_MARKETPLACE_MODELS: MarketplaceModel[] = [
    {
        id: 'm1',
        name: 'ETH Momentum Master',
        author: 'Quant Galore',
        description: 'A sophisticated model that identifies strong upward momentum in ETH/USDT on the 4-hour timeframe. It uses a combination of custom volatility and volume indicators to enter trades and a dynamic trailing stop for exits. Ideal for swing traders.',
        tags: ['Momentum', 'Swing Trading', 'Volatility'],
        asset: 'ETH/USDT',
        timeframe: '4h',
        performance: {
            winRate: 68.5,
            avgReturn: 3.2,
            sharpeRatio: 2.1,
            maxDrawdown: 14.8,
            last12Months: generateMonthlyPerformance(),
        },
        price: 99,
        subscriptionType: 'Monthly',
        reviews: [
            { id: 'r1', username: 'CryptoKing', rating: 5, comment: 'Incredibly reliable. Has been the core of my ETH strategy for 3 months.', date: '2023-10-15' },
            { id: 'r2', username: 'TraderJane', rating: 4, comment: 'Works well in trending markets, but be careful during choppy periods.', date: '2023-09-28' },
        ],
        avgRating: 4.5,
    },
    {
        id: 'm2',
        name: 'BTC Mean Reversion',
        author: 'Dr. Algo',
        description: 'This model specializes in identifying over-extended price moves for BTC/USDT on the 1-hour chart. It uses Bollinger Bands and a custom RSI to find statistically likely reversal points. Best suited for ranging markets.',
        tags: ['Mean Reversion', 'Scalping', 'Ranging Market'],
        asset: 'BTC/USDT',
        timeframe: '1h',
        performance: {
            winRate: 75.2,
            avgReturn: 0.8,
            sharpeRatio: 1.8,
            maxDrawdown: 8.5,
            last12Months: generateMonthlyPerformance(),
        },
        price: 75,
        subscriptionType: 'Monthly',
        reviews: [
            { id: 'r3', username: 'ScalpMaster', rating: 5, comment: 'Perfect for my short-term trading style. The high win rate is great for consistent gains.', date: '2023-11-01' },
            { id: 'r4', username: 'Hodler', rating: 3, comment: 'Not great for long-term holds, but does what it says.', date: '2023-10-22' },
        ],
        avgRating: 4.0,
    },
    {
        id: 'm3',
        name: 'SOL Breakout Hunter',
        author: 'Quant Galore',
        description: 'A high-risk, high-reward model designed to capture explosive breakout moves on SOL/USDT. It analyzes volume profiles and price action consolidation patterns to predict breakouts. Only for experienced traders.',
        tags: ['Breakout', 'High-Risk', 'Volatility'],
        asset: 'SOL/USDT',
        timeframe: '1h',
        performance: {
            winRate: 45.1,
            avgReturn: 8.5,
            sharpeRatio: 1.5,
            maxDrawdown: 25.2,
            last12Months: generateMonthlyPerformance(),
        },
        price: 499,
        subscriptionType: 'One-Time',
        reviews: [
            { id: 'r5', username: 'RiskTaker', rating: 5, comment: 'The wins are huge when they happen! Made back the cost in one trade.', date: '2023-10-05' },
        ],
        avgRating: 5.0,
    },
];

// MOCK DATA FOR REAL-TIME & FUNDAMENTAL TOOLS
const formatCurrency = (val: number) => `${(val / 1_000_000).toFixed(2)}M`;
export const MOCK_FINANCIALS: Record<string, FinancialStatementData> = {
    'AAPL': {
        income: [
            { metric: 'Total Revenue', '2023': formatCurrency(383285000000), '2022': formatCurrency(394328000000), '2021': formatCurrency(365817000000) },
            { metric: 'Cost of Revenue', '2023': formatCurrency(214137000000), '2022': formatCurrency(223546000000), '2021': formatCurrency(212981000000) },
            { metric: 'Gross Profit', '2023': formatCurrency(169148000000), '2022': formatCurrency(170782000000), '2021': formatCurrency(152836000000) },
            { metric: 'Operating Income', '2023': formatCurrency(114301000000), '2022': formatCurrency(119437000000), '2021': formatCurrency(108949000000) },
            { metric: 'Net Income', '2023': formatCurrency(96995000000), '2022': formatCurrency(99803000000), '2021': formatCurrency(9468000000) },
        ],
        balance: [
            { metric: 'Total Assets', '2023': formatCurrency(352583000000), '2022': formatCurrency(352755000000), '2021': formatCurrency(351002000000) },
            { metric: 'Total Liabilities', '2023': formatCurrency(290437000000), '2022': formatCurrency(302083000000), '2021': formatCurrency(287912000000) },
            { metric: 'Total Equity', '2023': formatCurrency(62146000000), '2022': formatCurrency(50672000000), '2021': formatCurrency(6309000000) },
        ],
        cashFlow: [
            { metric: 'Operating Cash Flow', '2023': formatCurrency(110543000000), '2022': formatCurrency(122151000000), '2021': formatCurrency(104038000000) },
            { metric: 'Capital Expenditure', '2023': formatCurrency(-10959000000), '2022': formatCurrency(-10708000000), '2021': formatCurrency(-11084000000) },
            { metric: 'Free Cash Flow', '2023': formatCurrency(99584000000), '2022': formatCurrency(111443000000), '2021': formatCurrency(92954000000) },
        ],
    },
    'TSLA': { // Mock data for Tesla
        income: [
            { metric: 'Total Revenue', '2023': formatCurrency(96773000000), '2022': formatCurrency(81462000000), '2021': formatCurrency(53823000000) },
            { metric: 'Gross Profit', '2023': formatCurrency(17660000000), '2022': formatCurrency(20853000000), '2021': formatCurrency(13606000000) },
            { metric: 'Net Income', '2023': formatCurrency(14999000000), '2022': formatCurrency(12556000000), '2021': formatCurrency(5519000000) },
        ],
        balance: [
            { metric: 'Total Assets', '2023': formatCurrency(106618000000), '2022': formatCurrency(82338000000), '2021': formatCurrency(62131000000) },
            { metric: 'Total Liabilities', '2023': formatCurrency(43009000000), '2022': formatCurrency(3644000000), '2021': formatCurrency(30548000000) },
        ],
        cashFlow: [
            { metric: 'Operating Cash Flow', '2023': formatCurrency(13256000000), '2022': formatCurrency(14724000000), '2021': formatCurrency(11497000000) },
            { metric: 'Free Cash Flow', '2023': formatCurrency(4356000000), '2022': formatCurrency(7568000000), '2021': formatCurrency(5015000000) },
        ],
    },
};

export const MOCK_ECONOMIC_CALENDAR: EconomicEvent[] = [
    { id: '1', time: '08:30 AM', event: 'Core CPI (MoM)', impact: 'High', actual: '0.3%', forecast: '0.3%', previous: '0.4%' },
    { id: '2', time: '10:00 AM', event: 'JOLTS Job Openings', impact: 'Medium', actual: '8.45M', forecast: '8.68M', previous: '8.75M' },
    { id: '3', time: '02:00 PM', event: 'FOMC Statement', impact: 'High', actual: '-', forecast: '-', previous: '-' },
    { id: '4', time: '04:30 PM', event: 'Crude Oil Inventories', impact: 'Low', actual: '1.36M', forecast: '-1.91M', previous: '-4.15M' },
];

export const MOCK_NEWS_FEED: Record<string, NewsArticle[]> = {
    'AAPL': [
        { id: 'a1', source: 'Reuters', headline: 'Apple supplier Foxconn\'s profit beats estimates on AI server demand', timestamp: '2h ago', link: '#' },
        { id: 'a2', source: 'Bloomberg', headline: 'Apple Plans to Unveil a Thinner iPhone in 2025', timestamp: '5h ago', link: '#' },
        { id: 'a3', source: 'WSJ', headline: 'Vision Pro Demand Cools, Presenting Apple With a New Challenge', timestamp: '1d ago', link: '#' },
    ],
    'TSLA': [
        { id: 't1', source: 'Reuters', headline: 'Tesla to lay off more than 10% of global workforce', timestamp: '3h ago', link: '#' },
        { id: 't2', source: 'CNBC', headline: 'Tesla asks shareholders to approve Musk\'s $56 billion pay package', timestamp: '8h ago', link: '#' },
        { id: 't3', source: 'TechCrunch', headline: 'FSD v12 update shows significant improvements in city driving', timestamp: '2d ago', link: '#' },
    ],
};

// MOCK DATA FOR QUANT SCREENER
export const MOCK_SCREENER_RESULTS: ScreenerResult[] = [
    { id: '1', ticker: 'AAPL', marketCap: 3200, peRatio: 32.5, dividendYield: 0.5, rsi: 55.2, volume: 54.3 },
    { id: '2', ticker: 'MSFT', marketCap: 3150, peRatio: 37.1, dividendYield: 0.7, rsi: 61.8, volume: 22.1 },
    { id: '3', ticker: 'GOOGL', marketCap: 2170, peRatio: 27.4, dividendYield: 0.0, rsi: 58.4, volume: 25.6 },
    { id: '4', ticker: 'AMZN', marketCap: 1900, peRatio: 51.3, dividendYield: 0.0, rsi: 65.1, volume: 38.9 },
    { id: '5', ticker: 'NVDA', marketCap: 2800, peRatio: 75.8, dividendYield: 0.1, rsi: 72.3, volume: 45.7 },
    { id: '6', ticker: 'JPM', marketCap: 570, peRatio: 11.9, dividendYield: 2.1, rsi: 48.9, volume: 12.5 },
    { id: '7', ticker: 'PFE', marketCap: 160, peRatio: 72.1, dividendYield: 5.9, rsi: 35.6, volume: 41.2 },
    { id: '8', ticker: 'TSLA', marketCap: 580, peRatio: 45.2, dividendYield: 0.0, rsi: 51.5, volume: 95.8 },
];

export const MOCK_SECTOR_PERFORMANCE: SectorPerformance[] = [
    { name: 'Technology', performance: 15.2 },
    { name: 'Communication Services', performance: 12.8 },
    { name: 'Financials', performance: 8.5 },
    { name: 'Health Care', performance: 5.1 },
    { name: 'Consumer Discretionary', performance: 2.3 },
    { name: 'Industrials', performance: 1.9 },
    { name: 'Real Estate', performance: -0.5 },
    { name: 'Consumer Staples', performance: -1.2 },
    { name: 'Utilities', performance: -3.4 },
    { name: 'Energy', performance: -5.8 },
];

// MOCK DATA FOR ALERTS & WATCHLIST
export const MOCK_WATCHLISTS: Watchlist[] = [
    { id: 'w1', name: 'My Crypto', assets: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'ADA/USDT'] },
    { id: 'w2', name: 'Tech Stocks', assets: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'] },
    { id: 'w3', name: 'Potential Shorts', assets: ['PFE', 'TSLA'] },
];

export const MOCK_ALERTS: Alert[] = [
    { id: 'a1', asset: 'BTC/USDT', condition: 'Price > $70,000', triggerType: 'Price', status: 'Active', notificationChannels: ['Email', 'Push'] },
    { id: 'a2', asset: 'ETH/USDT', condition: 'RSI(14) < 30', triggerType: 'RSI', status: 'Active', notificationChannels: ['Email'] },
    { id: 'a3', asset: 'TSLA', condition: 'Price < $170.00', triggerType: 'Price', status: 'Triggered', notificationChannels: ['SMS'] },
    { id: 'a4', asset: 'NVDA', condition: 'Volume Spike > 2x Avg', triggerType: 'Volume Spike', status: 'Active', notificationChannels: ['Push'] },
];

export const MOCK_ANALYST_RATINGS: Record<string, AnalystRating[]> = {
    'AAPL': [
        { id: 'ar1', firm: 'Morgan Stanley', rating: 'Overweight', priceTarget: 210, date: '2023-11-15' },
        { id: 'ar2', firm: 'Goldman Sachs', rating: 'Buy', priceTarget: 225, date: '2023-11-12' },
        { id: 'ar3', firm: 'J.P. Morgan', rating: 'Neutral', priceTarget: 195, date: '2023-11-10' },
        { id: 'ar4', firm: 'Bank of America', rating: 'Buy', priceTarget: 215, date: '2023-11-08' },
    ],
    'TSLA': [
        { id: 'tr1', firm: 'Morgan Stanley', rating: 'Overweight', priceTarget: 380, date: '2023-11-14' },
        { id: 'tr2', firm: 'Goldman Sachs', rating: 'Neutral', priceTarget: 248, date: '2023-11-11' },
        { id: 'tr3', firm: 'Wedbush', rating: 'Buy', priceTarget: 350, date: '2023-11-09' },
        { id: 'tr4', firm: 'Bernstein', rating: 'Underweight', priceTarget: 150, date: '2023-11-05' },
    ],
};

export const MOCK_RESEARCH_REPORTS: Record<string, ResearchReport[]> = {
    'AAPL': [
        { id: 'rr1', source: 'Seeking Alpha', title: 'Apple: The Vision Pro Is A Long-Term Bet', summary: 'While initial demand may be slow, the Vision Pro ecosystem represents a significant future growth driver for Apple...', date: '2023-11-16', link: '#' },
        { id: 'rr2', source: 'The Motley Fool', title: 'Is Apple Stock a Buy After Its Latest Earnings Report?', summary: 'Apple\'s services revenue continues to be a bright spot, offsetting some softness in iPhone sales...', date: '2023-11-05', link: '#' },
    ],
    'TSLA': [
        { id: 'rr3', source: 'Barron\'s', title: 'Tesla Stock Is a Buy. The Cybertruck Is Just One Reason.', summary: 'Upcoming catalysts, including the Cybertruck launch and FSD improvements, could re-ignite growth for the EV maker...', date: '2023-11-13', link: '#' },
        { id: 'rr4', source: 'Wall Street Journal', title: 'Competition Heats Up in the EV Market', summary: 'Tesla faces increasing competition from both legacy automakers and new EV startups, putting pressure on margins...', date: '2023-11-02', link: '#' },
    ],
};

// MOCK DATA FOR INSTITUTIONAL HOLDINGS
export const MOCK_GURUS = [
    { id: 'berkshire', name: 'Berkshire Hathaway', manager: 'Warren Buffett', portfolioValue: 313_000_000_000, stockCount: 41, latestFiling: '2023-11-14' },
    { id: 'ark', name: 'ARK Investment Management', manager: 'Cathie Wood', portfolioValue: 15_000_000_000, stockCount: 35, latestFiling: '2023-11-14' },
];

export const MOCK_HOLDINGS: Record<string, Holding[]> = {
    berkshire: [
        {
            ticker: 'AAPL', company: 'Apple Inc.', shares: 915560382, marketValue: 156760000000, portfolioPercentage: 50.08, action: 'Hold', change: 0,
            history: [
                { quarter: 'Q3 2022', shares: 890923366, action: 'Hold' },
                { quarter: 'Q4 2022', shares: 895136175, action: 'Added' },
                { quarter: 'Q1 2023', shares: 915560382, action: 'Added' },
                { quarter: 'Q2 2023', shares: 915560382, action: 'Hold' },
            ]
        },
        {
            ticker: 'BAC', company: 'Bank of America Corp', shares: 1032852006, marketValue: 28300000000, portfolioPercentage: 9.04, action: 'Hold', change: 0,
            history: [
                { quarter: 'Q3 2022', shares: 1020100606, action: 'Hold' },
                { quarter: 'Q4 2022', shares: 1010100606, action: 'Reduced' },
                { quarter: 'Q1 2023', shares: 1032852006, action: 'Hold' },
                { quarter: 'Q2 2023', shares: 1032852006, action: 'Hold' },
            ]
        },
        { ticker: 'AXP', company: 'American Express Co', shares: 151610700, marketValue: 22890000000, portfolioPercentage: 7.31, action: 'Hold', change: 0, history: [] },
        { ticker: 'KO', company: 'Coca-Cola Co', shares: 400000000, marketValue: 22400000000, portfolioPercentage: 7.16, action: 'Hold', change: 0, history: [] },
        { ticker: 'CVX', company: 'Chevron Corp', shares: 110257182, marketValue: 18600000000, portfolioPercentage: 5.94, action: 'Reduced', change: -14238572, history: [] },
        { ticker: 'OXY', company: 'Occidental Petroleum', shares: 224129192, marketValue: 13900000000, portfolioPercentage: 4.44, action: 'Added', change: 12431231, history: [] },
    ],
    ark: [
        {
            ticker: 'COIN', company: 'Coinbase Global Inc', shares: 8370000, marketValue: 1190000000, portfolioPercentage: 7.93, action: 'Added', change: 489768,
            history: [
                { quarter: 'Q3 2022', shares: 7500000, action: 'Hold' },
                { quarter: 'Q4 2022', shares: 7800000, action: 'Added' },
                { quarter: 'Q1 2023', shares: 7880232, action: 'Added' },
                { quarter: 'Q2 2023', shares: 8370000, action: 'Added' },
            ]
        },
        {
            ticker: 'TSLA', company: 'Tesla Inc', shares: 4890000, marketValue: 1180000000, portfolioPercentage: 7.86, action: 'Reduced', change: -56245,
            history: [
                { quarter: 'Q3 2022', shares: 5800000, action: 'Reduced' },
                { quarter: 'Q4 2022', shares: 5500000, action: 'Reduced' },
                { quarter: 'Q1 2023', shares: 4946245, action: 'Reduced' },
                { quarter: 'Q2 2023', shares: 4890000, action: 'Reduced' },
            ]
        },
        { ticker: 'ROKU', company: 'Roku Inc', shares: 10450000, marketValue: 978000000, portfolioPercentage: 6.52, action: 'Hold', change: 0, history: [] },
        { ticker: 'U', company: 'Unity Software Inc', shares: 26390000, marketValue: 792000000, portfolioPercentage: 5.28, action: 'Added', change: 1203941, history: [] },
        { ticker: 'ZM', company: 'Zoom Video Communications', shares: 11460000, marketValue: 778000000, portfolioPercentage: 5.18, action: 'Hold', change: 0, history: [] },
        { ticker: 'SQ', company: 'Block Inc', shares: 10790000, marketValue: 695000000, portfolioPercentage: 4.63, action: 'New', change: 10790000, history: [] },
    ]
};

export const MOCK_SECTOR_ALLOCATION: Record<string, any[]> = {
    berkshire: [
        { name: 'Information Technology', value: 51.5 },
        { name: 'Financials', value: 24.2 },
        { name: 'Consumer Staples', value: 9.8 },
        { name: 'Energy', value: 10.5 },
        { name: 'Other', value: 4.0 },
    ],
    ark: [
        { name: 'Information Technology', value: 35.1 },
        { name: 'Communication Services', value: 18.2 },
        { name: 'Financials', value: 15.8 },
        { name: 'Consumer Discretionary', value: 12.5 },
        { name: 'Health Care', value: 10.4 },
        { name: 'Other', value: 8.0 },
    ]
};

export const MOCK_AGGREGATE_MOVERS = {
    topBuys: [
        { ticker: 'GOOGL', company: 'Alphabet Inc.', totalValue: 2_500_000_000, funds: 15 },
        { ticker: 'AMZN', company: 'Amazon.com, Inc.', totalValue: 1_800_000_000, funds: 12 },
        { ticker: 'LQD', company: 'iShares iBoxx $ Inv Grade Corporate Bond ETF', totalValue: 1_200_000_000, funds: 8 },
    ],
    topSells: [
        { ticker: 'CVX', company: 'Chevron Corp', totalValue: 3_100_000_000, funds: 18 },
        { ticker: 'GM', company: 'General Motors', totalValue: 1_500_0.000, funds: 11 },
        { ticker: 'PYPL', company: 'PayPal Holdings, Inc.', totalValue: 950_000_000, funds: 22 },
    ]
};

// MOCK DATA FOR BLOCK TRADE DETECTOR
const tradeTickers = ['SPY', 'QQQ', 'TSLA', 'AAPL', 'NVDA', 'AMD', 'AMZN'];
const exchanges = ['NYSE', 'NASDAQ', 'ARCA', 'BATS'];
const conditions: BlockTrade['condition'][] = ['At Ask', 'At Bid', 'Between'];

export const generateBlockTrade = (): BlockTrade => {
    const ticker = tradeTickers[Math.floor(Math.random() * tradeTickers.length)];
    const price = Math.random() * 500 + 50;
    const size = Math.floor(Math.random() * 40000) + 10000; // 10k to 50k shares
    return {
        id: `trade-${Date.now()}-${Math.random()}`,
        ticker,
        time: new Date().toLocaleTimeString(),
        size,
        price,
        value: size * price,
        exchange: exchanges[Math.floor(Math.random() * exchanges.length)],
        condition: conditions[Math.floor(Math.random() * conditions.length)],
    };
};

export const generateDarkPoolPrint = (): DarkPoolPrint => {
    const ticker = tradeTickers[Math.floor(Math.random() * tradeTickers.length)];
    const totalVolume = Math.floor(Math.random() * 500000) + 100000;
    return {
        id: `dp-${Date.now()}-${ticker}`,
        ticker,
        time: new Date().toLocaleTimeString(),
        totalVolume,
        totalValue: totalVolume * (Math.random() * 500 + 50),
        numberOfTrades: Math.floor(Math.random() * 50) + 5,
    };
};

export const generateUnusualVolumeSpike = (): UnusualVolumeSpike => {
    const ticker = tradeTickers[Math.floor(Math.random() * tradeTickers.length)];
    const avgVolume = Math.floor(Math.random() * 2000000) + 500000;
    const volumeRatio = Math.random() * 8 + 2; // 2x to 10x
    return {
        ticker,
        currentVolume: avgVolume * volumeRatio,
        avgVolume,
        volumeRatio,
        lastPrice: Math.random() * 500 + 50,
    };
};

// MOCK DATA FOR UNUSUAL OPTIONS ACTIVITY
const optionableTickers = ['TSLA', 'AAPL', 'NVDA', 'AMD', 'AMZN', 'GOOGL', 'MSFT', 'SPY', 'QQQ'];
// FIX: Renamed 'tradeTypes' to 'unusualOptionTradeTypes' to resolve redeclaration error and correct its usage, fixing a type error.
const unusualOptionTradeTypes: UnusualOptionTrade['tradeType'][] = ['Sweep', 'Block', 'Split'];
const details: UnusualOptionTrade['details'][] = ['At Ask', 'Above Ask', 'At Bid', 'Below Bid', 'Mid-Market'];

export const generateUnusualOptionTrade = (): UnusualOptionTrade => {
    const ticker = optionableTickers[Math.floor(Math.random() * optionableTickers.length)];
    const type = Math.random() > 0.5 ? 'Call' : 'Put';
    const detail = details[Math.floor(Math.random() * details.length)];

    let sentiment: UnusualOptionTrade['sentiment'] = 'Neutral';
    if ((type === 'Call' && (detail.includes('Ask'))) || (type === 'Put' && (detail.includes('Bid')))) {
        sentiment = 'Bullish';
    } else if ((type === 'Put' && (detail.includes('Ask'))) || (type === 'Call' && (detail.includes('Bid')))) {
        sentiment = 'Bearish';
    }

    const d = new Date();
    d.setDate(d.getDate() + Math.floor(Math.random() * 60) + 7); // Expiry 1-8 weeks out
    const expiry = d.toISOString().split('T')[0];

    return {
        id: `uoa-${Date.now()}-${Math.random()}`,
        ticker,
        time: new Date().toLocaleTimeString(),
        strike: Math.round((Math.random() * 200 + 100) / 5) * 5, // Round to nearest 5
        expiry,
        type,
        volume: Math.floor(Math.random() * 5000) + 200,
        openInterest: Math.floor(Math.random() * 1000) + 50,
        premium: Math.floor(Math.random() * 4000000) + 100000, // $100k to $4.1M
        tradeType: unusualOptionTradeTypes[Math.floor(Math.random() * unusualOptionTradeTypes.length)],
        sentiment,
        details: detail,
    };
}

export const MOCK_TOKEN_UNLOCK_EVENTS: TokenUnlockEvent[] = [
    {
        id: '1',
        tokenName: 'Aptos',
        tokenSymbol: 'APT',
        logo: <AptosLogo />,
        unlockDate: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        unlockAmount: 4540000,
        unlockAmountUSD: 38500000,
        unlockPercentageOfCirculating: 1.05,
        impactScore: 8,
        description: "Monthly linear unlock for Community and Foundation.",
        vestingSchedule: Array.from({ length: 12 }, (_, i) => ({ date: new Date(2023, i, 12).toISOString(), unlockedPercentage: (i + 1) * 8.33 })),
        allocation: [
            { name: 'Community', value: 60 },
            { name: 'Foundation', value: 40 },
        ]
    },
    {
        id: '2',
        tokenName: 'Sui',
        tokenSymbol: 'SUI',
        logo: <SuiLogo />,
        unlockDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        unlockAmount: 34620000,
        unlockAmountUSD: 31800000,
        unlockPercentageOfCirculating: 1.42,
        impactScore: 6,
        description: "Series A & B investors unlock as part of the Community Access Program.",
        vestingSchedule: Array.from({ length: 12 }, (_, i) => ({ date: new Date(2023, i, 3).toISOString(), unlockedPercentage: (i + 1) * 8.33 })),
        allocation: [
            { name: 'Series A', value: 40 },
            { name: 'Series B', value: 30 },
            { name: 'Community', value: 30 },
        ]
    },
    {
        id: '3',
        tokenName: 'Sei',
        tokenSymbol: 'SEI',
        logo: <SeiLogo />,
        unlockDate: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        unlockAmount: 125000000,
        unlockAmountUSD: 60000000,
        unlockPercentageOfCirculating: 4.63,
        impactScore: 9,
        description: "Ecosystem and Foundation treasury unlock for future development and grants.",
        vestingSchedule: Array.from({ length: 12 }, (_, i) => ({ date: new Date(2023, i, 27).toISOString(), unlockedPercentage: (i + 1) * 8.33 })),
        allocation: [
            { name: 'Ecosystem', value: 70 },
            { name: 'Foundation', value: 30 },
        ]
    }
];

// FIX: Added missing mock data for Job Postings and Sample Jobs used in the Alternative Data screen.
export const MOCK_JOB_POSTINGS_DATA: { dept: string, openings: number }[] = [
    { dept: 'Engineering', openings: 450 },
    { dept: 'Data Science', openings: 220 },
    { dept: 'Quantitative Research', openings: 180 },
    { dept: 'Product', openings: 80 },
    { dept: 'Sales', openings: 120 },
];

export const MOCK_SAMPLE_JOBS: SampleJob[] = [
    { title: 'Senior Backend Engineer (Matching Engine)', department: 'Engineering' },
    { title: 'AI/ML Engineer - NLP Specialist', department: 'Data Science' },
    { title: 'Quantitative Researcher - HFT', department: 'Quantitative Research' },
    { title: 'Product Manager - API Integrations', department: 'Product' },
    { title: 'Institutional Sales Director', department: 'Sales' },
    { title: 'DevOps Engineer (Kubernetes & AWS)', department: 'Engineering' },
    { title: 'Data Scientist - Market Microstructure', department: 'Data Science' },
];

// FIX: Renamed 'tradeTypes' to 'mockTradeTypes' to avoid redeclaration conflict.
const mockTradeTypes: Array<'buy' | 'sell'> = ['buy', 'sell'];
export const generateTrade = (lastPrice: number): Trade => {
    const type = mockTradeTypes[Math.floor(Math.random() * mockTradeTypes.length)];
    return {
        id: `trade-${Date.now()}-${Math.random()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: lastPrice + (Math.random() - 0.5) * 5, // price variation
        amount: Math.random() * 0.5, // amount in base currency (e.g., BTC)
        type,
    };
};

export const SUPPORTED_EXCHANGES: Exchange[] = [
    { id: 'binance', name: 'Binance', logo: <BinanceLogo />, isConnected: true },
    { id: 'coinbase', name: 'Coinbase Pro', logo: <CoinbaseLogo />, isConnected: false },
    { id: 'kraken', name: 'Kraken', logo: <KrakenLogo />, isConnected: false },
    { id: 'kucoin', name: 'KuCoin', logo: <KucoinLogo />, isConnected: false },
];

export const MOCK_CMC_ARTICLES: CmcArticle[] = [
    { id: '1', title: 'Understanding the Bitcoin Halving', description: 'A deep dive into the mechanics and market impact of Bitcoin\'s supply reduction event.', link: '#' },
    { id: '2', title: 'Top 5 DeFi Trends to Watch in Q3 2024', description: 'Explore the latest innovations in decentralized finance, from liquid restaking to real-world assets.', link: '#' },
    { id: '3', title: 'How to Spot and Avoid Crypto Scams', description: 'A comprehensive guide to protecting your assets from phishing, rug pulls, and other common scams.', link: '#' },
    { id: '4', title: 'Layer 2 Scaling Solutions Explained', description: 'Learn how platforms like Arbitrum, Optimism, and Polygon are helping Ethereum scale.', link: '#' }
];

export const MOCK_CMC_TRENDING_COINS: CmcTrendingCoin[] = [
    { id: '1', name: 'Bitcoin', symbol: 'BTC', logo: <BtcLogo className="h-6 w-6" />, price: 68123.45, change24h: 1.25 },
    { id: '2', name: 'Ethereum', symbol: 'ETH', logo: <EthLogo className="h-6 w-6" />, price: 3543.21, change24h: -0.55 },
    { id: '3', name: 'Solana', symbol: 'SOL', logo: <SolLogo className="h-6 w-6" />, price: 171.88, change24h: 2.78 },
];

export const MOCK_CMC_GLOSSARY_TERMS: CmcGlossaryTerm[] = [
    { term: 'Gas', definition: 'A fee paid to execute transactions or smart contracts on the Ethereum blockchain.' },
    { term: 'Slippage', definition: 'The difference between the expected price of a trade and the price at which the trade is executed.' },
    { term: 'FOMO', definition: 'Fear Of Missing Out. An emotional reaction to the fear of missing a potentially profitable opportunity.' },
    { term: 'DEX', definition: 'Decentralized Exchange. A peer-to-peer marketplace where users can trade cryptocurrencies without a central intermediary.' },
    { term: 'HODL', definition: 'A term derived from a misspelling of "hold," referring to the strategy of holding onto cryptocurrency rather than selling it.' },
];

export const MOCK_CMC_LEARN_CAMPAIGNS: CmcLearnCampaign[] = [
    { id: '1', title: 'Learn About Polkadot & Earn DOT', project: 'Polkadot', logo: <PolkadotLogo />, reward: '$5 in DOT', link: '#' },
    { id: '2', title: 'What is Chainlink? Earn LINK', project: 'Chainlink', logo: <ChainlinkLogo />, reward: '$5 in LINK', link: '#' },
    { id: '3', title: 'Introduction to Aptos', project: 'Aptos', logo: <AptosLogo className="h-6 w-6" />, reward: '$3 in APT', link: '#' },
];

export const MOCK_CRYPTO_NEWS = [
    { id: 1, source: 'Bloomberg', text: "Bitcoin ETF inflows reach record high of $1.2B in single-day trading session.", sentiment: 'positive' },
    { id: 2, source: 'CoinDesk', text: "Ethereum core developers announce 'Pectra' upgrade timeline set for Q4 2024.", sentiment: 'neutral' },
    { id: 3, source: 'Reuters', text: "SEC signals openness to approving spot Solana ETF applications amid regulatory shift.", sentiment: 'positive' },
    { id: 4, source: 'The Block', text: "DeFi TVL surpasses $100B milestone for the first time since 2022.", sentiment: 'positive' },
    { id: 5, source: 'CNBC', text: "Fed Chair Powell suggests interest rate cuts may be delayed due to sticky inflation.", sentiment: 'negative' },
    { id: 6, source: 'Decrypt', text: "MicroStrategy acquires additional 12,000 BTC, holdings now exceed 1% of total supply.", sentiment: 'positive' }
];

// Icons
export const GeneralIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);
export const TradingIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
export const AlphaEngineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);
export const StudioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);
export const ChevronDownIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

export const ExpandIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" />
    </svg>
);

export const CollapseIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4V8m0 0h4M9 8l-5-5m16 5V4m0 0h-4m4 0l-5 5M9 20v-4m0 0h4m-4 0l-5 5m16-5v4m0 0h-4m4 0l-5-5" />
    </svg>
);


export const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
);
export const PortfolioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
);
export const BacktesterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
);
export const BotLabIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
);
export const AIFoundryIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94-1.28-.14-2.58.1-3.75.64M3.06 13c.46 4.17 3.77 7.48 7.94 7.94 1.28.14 2.58-.1 3.75-.64" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4V2m0 20v-2m8-10h2M2 12h2" />
    </svg>
);
export const MarketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);
export const SentimentIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const FilingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
export const InstitutionalHoldingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0v-4m0 4h5m0 0v-4" />
    </svg>
);
export const BlockTradeDetectorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
);
export const UnusualOptionsActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);
export const OnChainIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.536a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
);
export const LiquidationMapIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h11M3 10h18M3 14h14M3 18h8" />
    </svg>
);
export const RegimeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19C6.239 19 4 16.761 4 14c0-2.059 1.189-3.836 2.92-4.663a8.003 8.003 0 0110.16 0C18.811 10.164 20 11.941 20 14c0 2.761-2.239 5-5 5M12 19v-4m0-4a2 2 0 100-4 2 2 0 000 4zm-4 2a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
);
export const CorrelationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h4V4m12 8h-4v4m-2-2l-8-8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l-1.5 1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 4l-1.5 1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-1.5 1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 4l-4 4" />
    </svg>
);
export const TokenUnlockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11l-1 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l1 6" />
    </svg>
);
export const AlternativeDataIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364L15 15m-1.414-1.414a2 2 0 1 1 2.828-2.828 2 2 0 0 1-2.828 2.828z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 20v-2m0-14V2m-8 9H1m18 0h-2" />
    </svg>
);
export const MLModelIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75h4.5M9.75 17.25h4.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.51L15.49 8M8.51 8l3.49-3.49" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.49L15.49 16M8.51 16l3.49 3.49" />
    </svg>
);
export const IndicatorStudioIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
);
export const EducationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);
export const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
export const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
);
export const MLModelMarketplaceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);
export const RealTimeDataIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-4m3 4v-2m3 2v-4" />
    </svg>
);
export const QuantScreenerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-3-3-3 3" />
    </svg>
);
export const AlertsWatchlistIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);
export const AnalystResearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
);
export const PineScriptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
);
export const AssistantIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
export const Logo = ({ className }: { className?: string }) => (
    <div className={`flex items-center space-x-2 ${className}`}>
        <svg className="h-8 w-8 text-brand-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        <span className="font-bold text-2xl text-slate-900 dark:text-white">CosmoQuantAI</span>
    </div>
);

// New Icons for Homepage Redesign
export const IdeaIcon = ({ className = "h-10 w-10" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

export const TestIcon = ({ className = "h-10 w-10" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

export const DeployIcon = ({ className = "h-10 w-10" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

// New Icons for Blog Page
export const ArticleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
);
export const StrategyIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" /></svg>
);
export const TutorialIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const AnalysisIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
);
export const AiMlIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);

export const UserCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const CreditCardIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

export const KeyIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743z" />
    </svg>
);

// New icons for Education Hub
export const BookOpenIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

export const PlayIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const GlobeIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.293l.5-1.5m-.5 1.5l-1.5.5m1.5-.5l1.5-1.5m-1.5 1.5l-1.5-1.5M12 21a9 9 0 110-18 9 9 0 010 18z" />
    </svg>
);

export const PodcastIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

export const SocialIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.79 4 4 0 2.21-1.79 4-4 4-1.742 0-3.223-.835-3.772-2M12 12h.01M12 12v.01" />
    </svg>
);

export const ToolIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924-1.756-3.35 0a1.724 1.724 0 00-1.066 2.573c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const TaskManagerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);


// Blog Mock Data
export const MOCK_BLOG_POSTS: BlogPost[] = [
    { id: '1', title: 'Tutorial: Building Your First RSI Bot with AI Foundry', category: 'Tutorials', excerpt: 'Learn how to go from a simple English prompt to a live trading bot using our powerful AI tools in under 5 minutes.', imageUrl: 'https://via.placeholder.com/400x250', isFeatured: true, author: 'Jane Doe', date: 'June 15, 2024' },
    { id: '2', title: 'Deep Dive: Predicting Volatility with LSTM Models', category: 'AI & ML', excerpt: 'Explore the theory and practice behind using Long Short-Term Memory networks to forecast market volatility and improve your strategy.', imageUrl: 'https://via.placeholder.com/400x250', isFeatured: true, author: 'John Smith', date: 'June 12, 2024' },
    { id: '3', title: 'Market Analysis: Is a Crypto Summer Coming?', category: 'Market Analysis', excerpt: 'We analyze key on-chain metrics and macroeconomic indicators to gauge the likelihood of a sustained bull run in the coming months.', imageUrl: 'https://via.placeholder.com/400x250', isFeatured: true, author: 'Alex Johnson', date: 'June 10, 2024' },
    { id: '4', title: 'Mastering the Golden Cross Strategy', category: 'Strategies', excerpt: 'A comprehensive guide to identifying, backtesting, and deploying the classic Golden Cross trend-following strategy on our platform.', imageUrl: 'https://via.placeholder.com/400x250', isFeatured: false, author: 'Jane Doe', date: 'June 05, 2024' },
    { id: '5', title: 'Top 5 Risk Management Mistakes to Avoid', category: 'Strategies', excerpt: 'Learn from common pitfalls that plague even experienced traders. Protecting your capital is the first step to consistent profitability.', imageUrl: 'https://via.placeholder.com/400x250', isFeatured: false, author: 'Admin', date: 'May 28, 2024' },
    { id: '6', title: 'How to Use the Backtester for Portfolio-Level Analysis', category: 'Tutorials', excerpt: 'Go beyond single-asset backtesting. Discover how to simulate strategies across your entire portfolio for a more holistic view.', imageUrl: 'https://via.placeholder.com/400x250', isFeatured: false, author: 'John Smith', date: 'May 22, 2024' },
];

export const MOCK_STRATEGY_OF_THE_WEEK: StrategyOfTheWeek = {
    id: 'sotw1',
    title: 'Mean Reversion with Bollinger Bands',
    description: 'This strategy operates on the principle that prices tend to revert to their mean. It sells when the price hits the upper Bollinger Band and buys when it hits the lower band, making it ideal for ranging markets.',
    aiPrompt: 'Create a mean-reversion strategy on the 1-hour chart. Sell when price crosses above the upper Bollinger Band (20, 2) and buy when price crosses below the lower band.',
    results: {
        profit: 34.2,
        drawdown: 8.9,
    },
    imageUrl: 'https://via.placeholder.com/400x200/1E293B/FFFFFF?text=Chart+Placeholder',
};

export const MOCK_PORTFOLIO_PROJECTS: PortfolioProject[] = [
    {
        id: 'p1',
        title: 'AI-Powered Volatility Prediction for Options Trading',
        category: 'Machine Learning',
        description: 'Developed a custom LSTM model to forecast short-term volatility spikes in the SPX, allowing for more profitable options straddle strategies. The model was trained on historical VIX data, market volume, and macroeconomic indicators.',
        tags: ['Python', 'TensorFlow', 'Options', 'LSTM'],
        imageUrl: 'https://via.placeholder.com/400x250/1E293B/FFFFFF?text=Volatility+Model',
        metrics: [
            { label: 'Backtested Sharpe Ratio', value: '2.15' },
            { label: 'Profit Factor', value: '3.2' },
            { label: 'Max Drawdown', value: '-12.5%' },
        ],
    },
    {
        id: 'p2',
        title: 'Multi-Exchange Crypto Arbitrage Bot',
        category: 'High-Frequency Trading',
        description: 'A high-frequency arbitrage bot built in Rust that connects to Binance, Kraken, and Coinbase via WebSocket APIs to identify and execute on fleeting price discrepancies between exchanges. Includes a robust risk management module.',
        tags: ['Rust', 'WebSocket', 'Arbitrage', 'Crypto'],
        imageUrl: 'https://via.placeholder.com/400x250/1E293B/FFFFFF?text=Arbitrage+Bot',
        metrics: [
            { label: 'Average Daily Return', value: '0.8%' },
            { label: 'Execution Latency', value: '< 10ms' },
            { label: 'Win Rate', value: '85%' },
        ],
    },
    {
        id: 'p3',
        title: 'Regime-Aware Trend Following Strategy for Forex',
        category: 'Quantitative Strategy',
        description: 'A systematic trend-following strategy for major FX pairs (EUR/USD, GBP/USD). It uses a Markov-Switching model to classify the market into different volatility regimes and adjusts EMA crossover parameters accordingly.',
        tags: ['Python', 'Pandas', 'Forex', 'Market Regimes'],
        imageUrl: 'https://via.placeholder.com/400x250/1E293B/FFFFFF?text=FX+Strategy',
        metrics: [
            { label: 'CAGR', value: '18.2%' },
            { label: 'Sortino Ratio', value: '1.9' },
            { label: 'Max Drawdown', value: '-15.8%' },
        ],
    },
];

export const MOCK_CLIENT_TESTIMONIALS: ClientTestimonial[] = [
    {
        id: 't1',
        quote: "The custom algorithm developed for our fund has become a core part of our alpha generation. The professionalism and deep expertise were evident from day one. Highly recommended.",
        author: "Alex Johnson",
        role: "Founder, QuantumLeap Capital"
    },
    {
        id: 't2',
        quote: "Working with them was a game-changer. They took a complex idea for a market-making bot and turned it into a robust, profitable reality. The attention to detail in risk management was particularly impressive.",
        author: "Samantha Rivera",
        role: "Head of Algo Trading, DeFi Ventures"
    },
    {
        id: 't3',
        quote: "Not just a coder, but a true quant. They understood the nuances of the market and provided valuable insights that improved upon my initial strategy concept. The final product exceeded all expectations.",
        author: "David Chen",
        role: "Private Fund Manager"
    }
];

export const LstmIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>
);

export const RandomForestIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 0119.5 7.372l-8.552 8.552a.75.75 0 001.06 1.06l5.72-5.72a2.25 2.25 0 013.182 3.182l-5.483 5.483a.75.75 0 01-1.06-1.06l.75-.75z" />
    </svg>
);

export const ArimaIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-2.25M21 18l-3.75-2.25" />
    </svg>
);

export const OtherModelIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M21.75 12h-2.25m-1.666 5.834L16.5 16.5M4.5 12H2.25m1.666-5.834L5.25 7.5M7.5 15.666L5.25 17.25" />
    </svg>
);

export const CheckCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

export const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
);

export const ExclamationCircleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

// MOCK_CRYPTO_NEWS was duplicated here, removed.

export const VALID_TIMEFRAMES = [
    // Seconds
    "1s", "5s", "10s", "15s", "30s", "45s",

    // Minutes
    "1m", "3m", "5m", "15m", "30m", "45m",

    // Hours
    "1h", "2h", "3h", "4h", "6h", "8h", "12h",

    // Days & Weeks & Months
    "1d", "3d", "1w", "1M"
];
