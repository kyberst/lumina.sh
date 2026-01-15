
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  server: {
    port: 5173
  },
  build: {
    // Esto permite el uso de top-level await en el bundle final
    target: 'esnext' 
  },
  optimizeDeps: {
    exclude: ['@surrealdb/wasm'], // WASM modules often need exclusion from optimization
    esbuildOptions: {
      // Esto asegura que las dependencias (como SurrealDB) se procesen correctamente
      target: 'esnext'
    }
  }
})
