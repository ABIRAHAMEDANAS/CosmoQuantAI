/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./screens/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                'brand-darkest': '#0F172A',       // slate-900
                'brand-dark': '#1E293B',          // slate-800
                'brand-primary': '#6366F1',       // indigo-500
                'brand-primary-hover': '#4F46E5', // indigo-600
                'brand-nav-active': '#312E81',   // indigo-800
                'brand-success': '#10B981',       // emerald-500
                'brand-success-light': '#6EE7B7', // emerald-300
                'brand-danger': '#F43F5E',        // rose-500
                'brand-danger-light': '#FDA4AF',  // rose-300
                'brand-warning': '#FBBF24',       // amber-400
                'brand-light': '#F8FAFC',         // slate-50
                'brand-border-dark': '#334155',   // slate-700
                'brand-border-light': '#E2E8F0',  // slate-200
                omni: {
                    bg: '#0B1120',      // Deep dark background
                    panel: '#1e293b',   // Panel background (slate-800)
                    accent: '#6366f1',  // Indigo-500 (Primary Accent)
                    success: '#10b981', // Emerald-500
                    warning: '#f59e0b', // Amber-500
                    danger: '#ef4444',  // Red-500
                    text: '#f8fafc',    // Slate-50
                    muted: '#94a3b8',   // Slate-400
                }
            },
            animation: {
                'marquee-slow': 'marquee 40s linear infinite',
                'fade-in-down': 'fadeInDown 0.5s ease-out',
                'fade-in-up': 'fadeInUp 0.5s ease-out',
                'modal-fade-in': 'fadeIn 0.3s ease-out',
                'modal-content-slide-down': 'slideDown 0.3s ease-out',
            },
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            },
            gridTemplateColumns: {
                // আগে ছিল 40px, এখন বাড়িয়ে 60px করা হলো
                '13': 'minmax(60px, 0.5fr) repeat(12, minmax(0, 1fr))',
            }
        }
    },
    plugins: [],
}
