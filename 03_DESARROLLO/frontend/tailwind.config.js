/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#050507',
          card: 'rgba(26, 26, 30, 0.65)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#0A84FF',
          accentHover: '#0071E3',
          green: '#30D158',
          purple: '#BF5AF2',
          orange: '#FF9F0A',
          red: '#FF453A',
          subtext: '#86868B',
          text: '#F5F5F7'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '40px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'apple-glow': '0 0 50px -10px rgba(10, 132, 255, 0.3)',
      }
    },
  },
  plugins: [],
}
