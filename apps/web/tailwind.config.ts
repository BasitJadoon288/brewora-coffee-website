import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { espresso: '#3B2418', caramel: '#C58B52', cream: '#F5EBDD', charcoal: '#25201D' },
    fontFamily: { display: ['"Playfair Display"', 'Georgia', '"Times New Roman"', 'serif'], sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'] },
    boxShadow: { soft: '0 8px 30px rgba(59,36,24,0.10)' },
  } },
  plugins: [],
} satisfies Config;
