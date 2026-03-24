/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👇 ADICIONE ESTA LINHA OBRIGATORIAMENTE
  darkMode: 'class',

  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
