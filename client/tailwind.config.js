/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F0F10',
        surface: '#1A1A1E',
        border: '#2C2C30',
        primary: '#7F5AF0',
        accent: '#FF8906',
        success: '#2CB67D',
        warning: '#F0A202',
        danger: '#EF4565',
        text: '#E5E7EB',
        muted: '#94A1B2',
        white: '#FFFFFF',
        blue: '#2563eb',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
      },
      borderRadius: {
        xl: '1rem',
        lg: '0.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
} 