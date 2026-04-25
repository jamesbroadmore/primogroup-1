/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'forest-green': '#1B4332',
        'gold': '#D4AF37',
        'cream': '#F5F1E8',
        'charcoal': '#2C2C2C',
        'sage-green': '#52B788',
        'warm-beige': '#FAF6F0',
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
