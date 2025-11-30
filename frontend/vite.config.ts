import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // পরিবেশ ভেরিয়েবলগুলো লোড করি
  const env = loadEnv(mode, process.cwd(), '');

  // লজিক: যদি এনভায়রনমেন্ট ভেরিয়েবলে URL থাকে সেটা নিবে, না থাকলে লোকালহোস্ট
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';

  console.log(`🚀 Proxy targeting: ${backendUrl}`); // কনসোলে দেখার জন্য

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});