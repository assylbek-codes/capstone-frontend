/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6", // Blue
        secondary: "#10B981", // Green
        accent: "#F59E0B", // Amber
        background: "#F9FAFB", // Light Gray
        text: "#1F2937", // Dark Gray
        error: "#EF4444", // Red
        success: "#10B981", // Green
        warning: "#F59E0B", // Amber
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
    },
  },
  plugins: [],
} 