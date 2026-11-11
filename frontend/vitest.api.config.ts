import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], test: { include: ['integration/**/*.test.tsx'], environment: 'jsdom', testTimeout: 60000 } });
