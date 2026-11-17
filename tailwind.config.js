/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--border)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-fg': 'var(--accent-foreground)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        card: '1.25rem',
        field: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(43, 37, 35, 0.05), 0 12px 28px -18px rgba(43, 37, 35, 0.35)',
        float: '0 -6px 24px -12px rgba(43, 37, 35, 0.28)',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      maxWidth: {
        app: '768px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(120%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-up': {
          from: { transform: 'translateY(24px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fade-in 160ms ease-out',
        'sheet-up': 'sheet-up 200ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
