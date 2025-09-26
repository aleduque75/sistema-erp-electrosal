import type { Config } from "tailwindcss"

const config = {
  darkMode: ['[data-theme*="dark"]'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			badgeYellow: {
  				light: 'hsl(48 96% 89%)', // bg-yellow-100
  				dark: 'hsl(48 96% 29%)',  // bg-yellow-800
  				textLight: 'hsl(48 96% 29%)', // text-yellow-800
  				textDark: 'hsl(48 96% 89%)',  // text-yellow-100
  			},
  			badgeBlue: {
  				light: 'hsl(210 40% 96.1%)', // bg-blue-100 (usando secondary do shadcn/ui como base)
  				dark: 'hsl(217.2 32.6% 17.5%)', // bg-blue-800 (usando secondary do shadcn/ui como base)
  				textLight: 'hsl(215.4 16.3% 46.9%)', // text-blue-800
  				textDark: 'hsl(210 40% 98%)', // text-blue-100
  			},
  			badgeOrange: {
  				light: 'hsl(27 87% 90%)', // bg-orange-100
  				dark: 'hsl(27 87% 30%)',  // bg-orange-800
  				textLight: 'hsl(27 87% 30%)', // text-orange-800
  				textDark: 'hsl(27 87% 90%)',  // text-orange-100
  			},
  			badgeGreen: {
  				light: 'hsl(142.1 76.2% 36.3%)', // bg-green-100 (usando success do shadcn/ui como base)
  				dark: 'hsl(142.1 76.2% 16.3%)', // bg-green-800 (usando success do shadcn/ui como base)
  				textLight: 'hsl(142.1 76.2% 16.3%)', // text-green-800
  				textDark: 'hsl(142.1 76.2% 36.3%)', // text-green-100
  			},
  			badgeRed: {
  				light: 'hsl(0 84.2% 60.2%)', // bg-red-100 (usando destructive do shadcn/ui como base)
  				dark: 'hsl(0 62.8% 30.6%)',  // bg-red-800 (usando destructive do shadcn/ui como base)
  				textLight: 'hsl(0 62.8% 30.6%)', // text-red-800
  				textDark: 'hsl(0 84.2% 60.2%)',  // text-red-100
  			},
  			badgePurple: {
  				light: 'hsl(270 80% 90%)', // bg-purple-100
  				dark: 'hsl(270 80% 20%)',  // bg-purple-800
  				textLight: 'hsl(270 80% 20%)', // text-purple-800
  				textDark: 'hsl(270 80% 90%)',  // text-purple-100
  			},
  			badgeGray: {
  				light: 'hsl(210 40% 96.1%)', // bg-gray-100 (usando secondary do shadcn/ui como base)
  				dark: 'hsl(217.2 32.6% 17.5%)', // bg-gray-800 (usando secondary do shadcn/ui como base)
  				textLight: 'hsl(215.4 16.3% 46.9%)', // text-gray-800
  				textDark: 'hsl(210 40% 98%)', // text-gray-100
  			},
  			fuchsia: {
  				'50': '#fdf4ff',
  				'100': '#fae8ff',
  				'200': '#f5d0fe',
  				'300': '#f0abfc',
  				'400': '#e879f9',
  				'500': '#d946ef',
  				'600': '#c026d3',
  				'700': '#a21caf',
  				'800': '#86198f',
  				'900': '#701a75',
  				'950': '#4a044e'
  			},
  			danger: '#ef4444',
  			success: '#22c55e',
  			info: '#3b82f6',
  			warning: '#f59e0b',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config