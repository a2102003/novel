import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Defines process.env for the geminiService which accesses process.env.API_KEY
    'process.env': process.env
  }
});