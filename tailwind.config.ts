import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#166534", dark: "#14532d", light: "#dcfce7", soft: "#f0fdf4" },
      },
    },
  },
  plugins: [],
};
export default config;
