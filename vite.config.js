import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // <-- AQUÍ REGRESAMOS EL DISEÑO
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(), // <-- AQUÍ LO ACTIVAMOS DE NUEVO
    react(),
    VitePWA({
      registerType: 'autoUpdate', 
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.png'],
      manifest: {
        name: 'Ventaja Adentro',
        short_name: 'Ventaja Adentro',
        description: 'Matchmaking y Ranking ELO para Tenis',
        theme_color: '#29C454', 
        background_color: '#F8F7F2', 
        display: 'standalone', 
        orientation: 'portrait', 
        icons: [
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})