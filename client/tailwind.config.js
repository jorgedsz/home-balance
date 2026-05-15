/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e1116',
        card: '#161a22',
        cardHover: '#1c2230',
        border: '#222937',
        text: '#e7ecf3',
        muted: '#7d8898',
        accent: '#5eead4'
      }
    }
  },
  plugins: []
};
