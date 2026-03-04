/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        accent: "#6C63FF",
        "accent-light": "#EEF0FF",
        "accent-dark": "#4B43D6",
        "bg-light": "#F5F6FA",
        surface: "#FFFFFF",
        surface2: "#F0F1F8",
        "bg-dark": "#0F0F1A",
        "surface-dark": "#1A1B2E",
        "surface2-dark": "#252640",
        "text-primary": "#1A1B2E",
        "text-secondary": "#6B6E8E",
        "text-tertiary": "#A0A3B8",
        "task-success": "#22C55E",
        "task-warning": "#F59E0B",
        "task-error": "#EF4444",
        "task-info": "#3B82F6",
        "border-light": "#E4E6F0",
        "border-dark": "#2E2F4A",
      },
      fontFamily: {
        sans: ["DMSans_400Regular", "sans-serif"],
        "sans-medium": ["DMSans_500Medium", "sans-serif"],
        "sans-bold": ["DMSans_700Bold", "sans-serif"],
      },
    },
  },
  plugins: [],
};