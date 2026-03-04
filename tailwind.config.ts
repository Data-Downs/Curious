import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
      },
      colors: {
        curious: {
          50: "#faf8f5",
          100: "#f0ebe3",
          200: "#e0d5c6",
          300: "#c9b8a2",
          400: "#b39b7e",
          500: "#a18565",
          600: "#8a6e53",
          700: "#725a46",
          800: "#5f4b3d",
          900: "#504036",
          950: "#2c211c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
