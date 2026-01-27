import type { Config } from "tailwindcss"

const config = {
  darkMode: 'class',
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
        '2xl': '1400px',
        // Custom breakpoints from template
        '2xsm': '375px',
        'xsm': '425px',
        '3xl': '2000px',
      }
    },
    extend: {
      fontFamily: {
        // Add Outfit font, ensure it's loaded in globals.css or layout
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        // Shadcn/ui colors
        "navbar-background": "hsl(var(--navbar-background))",
        "hero-background": "hsl(var(--hero-background))",
        "features-background": "hsl(var(--features-background))",

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
        },

        // Custom template colors
        // Mapping direct hex or var(--color-...)
        // Some colors from template globals.css
        'brand-25': 'var(--color-brand-25)',
        'brand-50': 'var(--color-brand-50)',
        'brand-100': 'var(--color-brand-100)',
        'brand-200': 'var(--color-brand-200)',
        'brand-300': 'var(--color-brand-300)',
        'brand-400': 'var(--color-brand-400)',
        'brand-500': 'var(--color-brand-500)',
        'brand-600': 'var(--color-brand-600)',
        'brand-700': 'var(--color-brand-700)',
        'brand-800': 'var(--color-brand-800)',
        'brand-900': 'var(--color-brand-900)',
        'brand-950': 'var(--color-brand-950)',

        'blue-light-25': 'var(--color-blue-light-25)',
        'blue-light-50': 'var(--color-blue-light-50)',
        'blue-light-100': 'var(--color-blue-light-100)',
        'blue-light-200': 'var(--color-blue-light-200)',
        'blue-light-300': 'var(--color-blue-light-300)',
        'blue-light-400': 'var(--color-blue-light-400)',
        'blue-light-500': 'var(--color-blue-light-500)',
        'blue-light-600': 'var(--color-blue-light-600)',
        'blue-light-700': 'var(--color-blue-light-700)',
        'blue-light-800': 'var(--color-blue-light-800)',
        'blue-light-900': 'var(--color-blue-light-900)',
        'blue-light-950': 'var(--color-blue-light-950)',

        'gray-25': 'var(--color-gray-25)',
        'gray-50': 'var(--color-gray-50)',
        'gray-100': 'var(--color-gray-100)',
        'gray-200': 'var(--color-gray-200)',
        'gray-300': 'var(--color-gray-300)',
        'gray-400': 'var(--color-gray-400)',
        'gray-500': 'var(--color-gray-500)',
        'gray-600': 'var(--color-gray-600)',
        'gray-700': 'var(--color-gray-700)',
        'gray-800': 'var(--color-gray-800)',
        'gray-900': 'var(--color-gray-900)',
        'gray-950': 'var(--color-gray-950)',
        'gray-dark': 'var(--color-gray-dark)',

        'orange-25': 'var(--color-orange-25)',
        'orange-50': 'var(--color-orange-50)',
        'orange-100': 'var(--color-orange-100)',
        'orange-200': 'var(--color-orange-200)',
        'orange-300': 'var(--color-orange-300)',
        'orange-400': 'var(--color-orange-400)',
        'orange-500': 'var(--color-orange-500)',
        'orange-600': 'var(--color-orange-600)',
        'orange-700': 'var(--color-orange-700)',
        'orange-800': 'var(--color-orange-800)',
        'orange-900': 'var(--color-orange-900)',
        'orange-950': 'var(--color-orange-950)',

        'success-25': 'var(--color-success-25)',
        'success-50': 'var(--color-success-50)',
        'success-100': 'var(--color-success-100)',
        'success-200': 'var(--color-success-200)',
        'success-300': 'var(--color-success-300)',
        'success-400': 'var(--color-success-400)',
        'success-500': 'var(--color-success-500)',
        'success-600': 'var(--color-success-600)',
        'success-700': 'var(--color-success-700)',
        'success-800': 'var(--color-success-800)',
        'success-900': 'var(--color-success-900)',
        'success-950': 'var(--color-success-950)',

        'error-25': 'var(--color-error-25)',
        'error-50': 'var(--color-error-50)',
        'error-100': 'var(--color-error-100)',
        'error-200': 'var(--color-error-200)',
        'error-300': 'var(--color-error-300)',
        'error-400': 'var(--color-error-400)',
        'error-500': 'var(--color-error-500)',
        'error-600': 'var(--color-error-600)',
        'error-700': 'var(--color-error-700)',
        'error-800': 'var(--color-error-800)',
        'error-900': 'var(--color-error-900)',
        'error-950': 'var(--color-error-950)',

        'warning-25': 'var(--color-warning-25)',
        'warning-50': 'var(--color-warning-50)',
        'warning-100': 'var(--color-warning-100)',
        'warning-200': 'var(--color-warning-200)',
        'warning-300': 'var(--color-warning-300)',
        'warning-400': 'var(--color-warning-400)',
        'warning-500': 'var(--color-warning-500)',
        'warning-600': 'var(--color-warning-600)',
        'warning-700': 'var(--color-warning-700)',
        'warning-800': 'var(--color-warning-800)',
        'warning-900': 'var(--color-warning-900)',
        'warning-950': 'var(--color-warning-950)',

        // Theme specific colors
        'theme-pink-500': 'var(--color-theme-pink-500)',
        'theme-purple-500': 'var(--color-theme-purple-500)',

        // Template colors mapped to Shadcn names for easier integration
        // These might override shadcn defaults, review carefully
        'brand': {
          DEFAULT: 'var(--color-brand-500)',
          foreground: 'var(--color-white)', // Assuming white foreground for brand
        },
        'gray': {
          '25': 'var(--color-gray-25)',
          '50': 'var(--color-gray-50)',
          '100': 'var(--color-gray-100)',
          '200': 'var(--color-gray-200)',
          '300': 'var(--color-gray-300)',
          '400': 'var(--color-gray-400)',
          '500': 'var(--color-gray-500)',
          '600': 'var(--color-gray-600)',
          '700': 'var(--color-gray-700)',
          '800': 'var(--color-gray-800)',
          '900': 'var(--color-gray-900)',
          '950': 'var(--color-gray-950)',
          'dark': 'var(--color-gray-dark)',
        },
        'success': {
          DEFAULT: 'var(--color-success-500)',
          foreground: 'var(--color-white)',
        },
        'error': {
          DEFAULT: 'var(--color-error-500)',
          foreground: 'var(--color-white)',
        },
        'warning': {
          DEFAULT: 'var(--color-warning-500)',
          foreground: 'var(--color-white)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        // Add template's border radius if different
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