import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          critical: '#dc2626',
          high: '#ea580c',
          medium: '#2563eb',
          low: '#16a34a',
        },
      },
    },
  },
  plugins: [],
};

export default config;