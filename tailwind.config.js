/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#43a047",
          dark: "#2e7d32",
          forest: "#2d7d32",
          mint: "#e8f5e9",
        },
        /** Sunshine Coast Council */
        scc: {
          teal: "#00A99D",
          blue: "#00548B",
          charcoal: "#333333",
          muted: "#808080",
          wash: "#F4FBFA",
          ice: "#F0F9FF",
        },
        think: {
          green: "#1B9E4B",
          "green-dark": "#0F6B32",
        },
      },
    },
  },
  plugins: [],
};
