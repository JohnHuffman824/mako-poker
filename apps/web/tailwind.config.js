/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./index.html',
		'./src/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			colors: {
				// Mako theme colors
				mako: {
					teal: {
						light: 'rgba(182, 231, 255, 1)',
						DEFAULT: 'rgba(125, 185, 216, 1)',
						dark: 'rgba(69, 140, 176, 1)',
					},
					control: 'rgba(69, 140, 176, 0.8)',
					overlay: 'rgba(66, 81, 88, 0.4)',
					felt: {
						light: '#225740',
						DEFAULT: '#1c4b38',
						dark: '#184232',
					},
					wood: {
						light: '#e7b182',
						dark: '#e1a159',
					},
					stats: {
						light: 'rgba(237, 88, 62, 1)',
						dark: 'rgba(203, 73, 51, 1)',
					},
				},
			},
			fontFamily: {
				'sf-compact': [
					'SF Compact Rounded',
					'-apple-system',
					'BlinkMacSystemFont',
					'system-ui',
					'sans-serif',
				],
				heebo: ['Heebo', 'sans-serif'],
			},
			borderRadius: {
				'pill': '1000px',
			},
			boxShadow: {
				'card': '0px 10px 15px -3px rgba(0,0,0,0.1), ' +
								'0px 4px 6px -4px rgba(0,0,0,0.1)',
				'table': '5px 5px 4px 0px rgba(0,0,0,0.5)',
			},
		},
	},
	plugins: [],
}
