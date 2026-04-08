import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <--- ESTE ES EL NUEVO CABLE

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // <--- CONECTAMOS EL CABLE
  ],
})