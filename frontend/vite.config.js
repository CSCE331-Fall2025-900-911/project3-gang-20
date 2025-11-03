import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // Configure Vite to use the React plugin
  plugins: [react()],
  
  // Set the base path for assets if deploying to a non-root path (optional, but good practice)
  base: './', 
  
  // Define the output directory to be 'dist' (default for Vite)
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});