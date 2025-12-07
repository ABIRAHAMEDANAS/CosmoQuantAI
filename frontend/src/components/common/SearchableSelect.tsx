import React, { useState, useRef, useEffect, useMemo } from 'react';

interface SearchableSelectProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = "Select...", disabled = false, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // ক্লিক বাইরে হলে ড্রপডাউন বন্ধ করা
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // সার্চ ফিল্টার
    const filteredOptions = useMemo(() => {
        return options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [options, searchQuery]);

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full text-left bg-white dark:bg-brand-dark/50 border ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-brand-border-light dark:border-brand-border-dark rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white flex justify-between items-center focus:ring-2 focus:ring-brand-primary`}
            >
                <span className="truncate">{value || placeholder}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-hidden flex flex-col animate-fade-in-down">
                    {/* সার্চ বার */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-inherit">
                        <input
                            type="text"
                            placeholder="Search pair..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent rounded text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-primary outline-none"
                            autoFocus
                        />
                    </div>

                    {/* অপশন লিস্ট */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt);
                                        setIsOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-brand-primary/20 text-slate-700 dark:text-gray-200 transition-colors ${value === opt ? 'bg-brand-primary/10 text-brand-primary font-semibold' : ''}`}
                                >
                                    {opt}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-xs text-gray-500">No results found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
