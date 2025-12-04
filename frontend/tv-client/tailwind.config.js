/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        'tv-xs': '2rem',
        'tv-sm': '3rem',
        'tv-base': '4rem',
        'tv-lg': '5rem',
        'tv-xl': '6rem',
        'tv-2xl': '8rem',
        'tv-3xl': '10rem',
      },
      colors: {
        tv: {
          bg: '#000000',
          text: '#FFFFFF',
          accent: '#FFD700',
          score: '#00FF00',
        },
      },
    },
  },
  plugins: [],
}

