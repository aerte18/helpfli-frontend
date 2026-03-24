/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)',
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        helpfli: {
          indigo: '#4F46E5',
          purple: '#9333EA',
          emerald: '#10B981',
          orange: '#F97316',
          graphite: '#1F2937',
          light: '#F3F4F6',
        },
      },
      boxShadow: {
        soft: '0 6px 16px rgba(79,70,229,0.10)',
        'soft-emerald': '0 6px 16px rgba(16,185,129,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        'helpfli-gradient': 'linear-gradient(90deg, #4F46E5 0%, #9333EA 100%)',
      },
    },
  },
  plugins: [],
}