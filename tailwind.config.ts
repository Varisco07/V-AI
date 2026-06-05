import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        vari: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          dark: '#0D0D14',
          darker: '#07070F',
          surface: '#12121C',
          card: '#16162A',
          card2: '#1C1C30',
          light: '#F1F1FF',
          muted: '#6B6B8A',
          border: '#1E1E35',
          'border-bright': '#2E2E50',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle at top left, rgba(99,102,241,0.08) 0%, transparent 60%)',
        'gradient-mesh': 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(6,182,212,0.04) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        glow: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0,0,0,0.3)',
        'glow': '0 0 20px rgba(99,102,241,0.3)',
        'glow-lg': '0 0 40px rgba(99,102,241,0.4)',
        'glow-cyan': '0 0 20px rgba(6,182,212,0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },
  plugins: [],
}
export default config