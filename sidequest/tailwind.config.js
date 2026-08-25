/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1120",
        cyan: "#22D3EE",
        purple: "#A855F7",
      },
    },
  },
  plugins: [],
}
