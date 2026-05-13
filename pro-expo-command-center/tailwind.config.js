/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1440px' },
    },
    extend: {
      colors: {
        // Pro Expo brand tokens (firm)
        bg: '#0a1224',
        'bg-elev': '#0f1a30',
        'bg-elev-2': '#14213d',
        'bg-elev-3': '#1a2a4a',
        border: '#1f3050',
        text: '#e8ecf5',
        mute: '#8a9bb8',
        faint: '#5a6a85',
        magenta: '#FF4DB8',
        purple: '#6B3FD4',
        blue: '#1E4FB8',
        teal: '#3FD4C6',
        'teal-soft': '#5eead4',
        'teal-deep': '#2ba89e',
        // Semantic
        success: '#3FD4C6',
        warning: '#F5B544',
        danger: '#FF5A6A',
        info: '#5BA8FF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '14px',
        xl: '20px',
        '2xl': '28px',
      },
      boxShadow: {
        elev: '0 1px 2px rgba(0,0,0,.35), 0 8px 24px -8px rgba(0,0,0,.5)',
        glow: '0 0 0 1px rgba(63,212,198,.35), 0 0 24px -4px rgba(63,212,198,.45)',
        'glow-magenta': '0 0 0 1px rgba(255,77,184,.35), 0 0 24px -4px rgba(255,77,184,.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF4DB8 0%, #6B3FD4 50%, #1E4FB8 100%)',
        'teal-gradient': 'linear-gradient(135deg, #3FD4C6 0%, #2ba89e 100%)',
        'panel-grid':
          'radial-gradient(circle at 1px 1px, rgba(255,255,255,.04) 1px, transparent 0)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse_soft: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out',
        'slide-up': 'slide-up .3s ease-out',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-soft': 'pulse_soft 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
