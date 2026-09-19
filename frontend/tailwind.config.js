/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(214.3 31.8% 91.4%)",
        navy: {
          900: "#0b1329",
          800: "#132144",
          700: "#1b2e5e",
        },
      },
    },
  },
  plugins: [],
}
