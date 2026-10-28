/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4338ca',
          hover: '#3730a3',
          light: '#6366f1',
          container: '#4338ca',
          fixed: '#e3dfff',
          'fixed-dim': '#c3c0ff'
        },
        surface: {
          DEFAULT: '#f8f9ff',
          card: '#ffffff',
          low: '#eff4ff',
          high: '#dce9ff',
          highest: '#d3e4fe',
          dim: '#cbdbf5'
        },
        tertiary: {
          DEFAULT: '#005e40',
          container: '#005e40',
          fixed: '#85f8c4',
          'fixed-dim': '#68dba9',
          'on-container': '#66daa8'
        },
        on: {
          surface: '#0b1c30',
          'surface-variant': '#464554',
          primary: '#ffffff',
          tertiary: '#ffffff'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 10px rgba(11, 28, 48, 0.04)',
        'card-hover': '0 12px 28px -4px rgba(11, 28, 48, 0.1)',
        'modal': '0 20px 45px -10px rgba(11, 28, 48, 0.25)',
      }
    },
  },
  plugins: [],
}
