import type { Config } from 'tailwindcss';
export default { content: ['./index.html','./src/**/*.{ts,tsx}'], theme: { extend: { colors: { cinema:'#07090E', panel:'#0F1420', line:'#1E2638' } } }, plugins: [] } satisfies Config;
