import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5fb',
          100: '#d4e5f4',
          200: '#a8c9e8',
          300: '#6fa3d4',
          400: '#3d7ab8',
          500: '#1f5c9a',
          600: '#0D3E71',
          700: '#0a325c',
          800: '#072544',
          900: '#041a30'
        },
        accent: {
          50: '#e6fcfd',
          100: '#ccf7f9',
          200: '#99eef3',
          300: '#5ee0e8',
          400: '#33d4dc',
          500: '#00C2CB',
          600: '#00a8b0',
          700: '#008893'
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b'
        }
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(2, 6, 23, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

export default config
