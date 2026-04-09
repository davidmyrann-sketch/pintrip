/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#080812',
        surface:  '#10101E',
        card:     '#181830',
        gold:     '#F5A623',
        coral:    '#FF6464',
        mint:     '#00D2C8',
        purple:   '#8B5CF6',
        'text-1': '#F5F5F0',
        'text-2': '#A0A0B0',
        'text-3': '#606070',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
