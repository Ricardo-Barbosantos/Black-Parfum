/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#070707",
        graphite: "#141414",
        gold: "#c9a84c",
        champagne: "#f4e7c3",
      },
      fontFamily: {
        display: ["var(--font-cinzel)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 24px 80px rgba(0, 0, 0, 0.45)",
      },
    },
  },
  plugins: [],
};
