import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        bg:        '#F7F8FA',
        surface:   '#FFFFFF',
        'surface-2': '#F2F4F8',
        line:      '#E5E7EB',
        'line-2':   '#D1D5DB',
        ink:       { DEFAULT: '#0F172A', 2: '#475569', 3: '#94A3B8' },
        accent:    { DEFAULT: '#2563EB', soft: '#DBEAFE' },
        ok:        '#10B981',
        warn:      '#F59E0B',
        danger:    '#EF4444',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.02)',
      },
    },
  },
  plugins: [typography],
} satisfies Config;
