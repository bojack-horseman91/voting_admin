import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Declare process for Node environment to satisfy TypeScript without @types/node
declare const process: any;

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TypeScript error about 'cwd' property not existing on type 'Process'
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173
    },
    define: {
      // Prevents 'process is not defined' error in browser and injects API_KEY
      'process.env': {
        API_KEY: env.API_KEY,
        IMGBB_KEY: env.IMGBB_KEY
      }
    }
  };
});