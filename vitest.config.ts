import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({plugins:[react()],test:{environment:'jsdom',setupFiles:['./tests/React/setup.ts'],include:['tests/React/**/*.test.tsx']}});
