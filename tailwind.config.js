/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: {
					'50': '#f0f9ff',
					'100': '#e0f2fe',
					'200': '#bae6fd',
					'300': '#7dd3fc',
					'400': '#38bdf8',
					'500': '#0ea5e9',
					'600': '#0284c7',
					'700': '#0369a1',
					'800': '#075985',
					'900': '#0c4a6e',
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				wellness: {
					'50': '#f0fdf4',
					'100': '#dcfce7',
					'200': '#bbf7d0',
					'300': '#86efac',
					'400': '#4ade80',
					'500': '#22c55e',
					'600': '#16a34a',
					'700': '#15803d',
					'800': '#166534',
					'900': '#14532d'
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'var(--chart-1)',
					'2': 'var(--chart-2)',
					'3': 'var(--chart-3)',
					'4': 'var(--chart-4)',
					'5': 'var(--chart-5)'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					primaryForeground: 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					accentForeground: 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))'
				}
			},
			fontFamily: {
				sans: [
					'Noto Color Emoji',
					'Manrope',
					'sans-serif'
				]
			},
			fontSize: {
				xs: 'calc(var(--rateFontSize) * 0.75rem)',
				sm: 'calc(var(--rateFontSize) * 0.875rem)',
				base: 'calc(var(--rateFontSize) * 1rem)',
				lg: 'calc(var(--rateFontSize) * 1.125rem)',
				xl: 'calc(var(--rateFontSize) * 1.25rem)',
				'2xl': 'calc(var(--rateFontSize) * 1.5rem)',
				'3xl': 'calc(var(--rateFontSize) * 1.875rem)',
				'4xl': 'calc(var(--rateFontSize) * 2.25rem)',
				'5xl': 'calc(var(--rateFontSize) * 3rem)',
				'6xl': 'calc(var(--rateFontSize) * 3.75rem)',
				'7xl': 'calc(var(--rateFontSize) * 4.5rem)',
				'8xl': 'calc(var(--rateFontSize) * 6rem)',
				'9xl': 'calc(var(--rateFontSize) * 8rem)'
			},
			borderRadius: {
				lg: 'calc(var(--radius) + 4px)',
				md: 'calc(var(--radius) - 0px)',
				sm: 'calc(var(--radius) - 8px)',
			},
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				primaryForeground: 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				accentForeground: 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		require('@tailwindcss/typography')
	],
} 