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
        paper: "#F9F8F6",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#666660",
          subtle: "#8C8C84",
        },
        line: {
          DEFAULT: "#E5E5E0",
          strong: "#D2D2CA",
        },
        olive: {
          DEFAULT: "#3D4F3D",
          deep: "#2C3A2C",
          soft: "#EEF1ED",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        none: "none",
        hairline: "0 1px 0 0 #E5E5E0",
      },
      transitionDuration: {
        150: "150ms",
      },
      transitionTimingFunction: {
        editorial: "ease",
      },
    },
  },
  plugins: [],
};

export default config;