/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color - Black (30%)
        hipaPrimary: {
          DEFAULT: "#000000",
          light: "#1a1a1a",
          dark: "#000000",
        },
        // Beige 60% - Main backgrounds
        hipa: {
          beige: "#f5f5dc",
          beigeLight: "#faebd7",
          beigeDark: "#e8e4c9",
        },
        // Black 30% - Text and borders
        hipaBlack: {
          DEFAULT: "#1a1a1a",
          light: "#2d2d2d",
          dark: "#000000",
        },
        // Skyblue 5% - Accents
        hipaSky: {
          DEFAULT: "#87ceeb",
          light: "#b0e0f0",
          dark: "#5bbce4",
        },
        // Green 5% - Actions/success
        hipaGreen: {
          DEFAULT: "#16a34a",
          light: "#22c55e",
          dark: "#15803d",
        },
        primary: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#016099",
        },
        secondary: {
          50: "#faf5ff",
          500: "#7c3aed",
          600: "#6b21a8",
          700: "#581c87",
        },
        success: {
          50: "#f0fdf4",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        warning: {
          50: "#fffbeb",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },
        error: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        neutral: {
          50: "#f9fafb",
          500: "#6b7280",
          600: "#4b5563",
          700: "#1f2937",
        },
        beige: {
          50: "#f5f5dc",
          100: "#f0ebd8",
          200: "#e6dbc3",
          300: "#d9c9a8",
          400: "#cbb38a",
          500: "#be9c6b",
          600: "#a8824f",
          700: "#8c6a3f",
          800: "#705533",
          900: "#544227",
        },
        antique: {
          white: "#faebd7",
          100: "#f5ebe0",
          200: "#edd9c4",
          300: "#e3c5a5",
          400: "#d8ae83",
          500: "#cd9661",
          600: "#b87d4a",
          700: "#96633c",
          800: "#784e32",
          900: "#5c3d29",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
        full: "9999px",
      },
      spacing: {
        14: "3.5rem",
        18: "4.5rem",
        20: "5rem",
        22: "5.5rem",
        28: "7rem",
        32: "8rem",
        36: "9rem",
        40: "10rem",
        44: "11rem",
        48: "12rem",
        52: "13rem",
        56: "14rem",
        60: "15rem",
        64: "16rem",
        72: "18rem",
        80: "20rem",
        96: "24rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
