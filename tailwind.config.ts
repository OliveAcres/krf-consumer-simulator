import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        krf: {
          yellow: "#FFE200",
          forest: "#00411E",
          "forest-light": "#006B32",
        },
      },
    },
  },
  plugins: [],
};
export default config;
