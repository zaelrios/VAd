import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Se actualiza sola en los celulares cuando subes cambios
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.png'],
      manifest: {
        name: 'Ventaja Adentro',
        short_name: 'VAd.',
        description: 'Matchmaking y Ranking ELO para Tenis',
        theme_color: '#29C454', // El verde de la app para la barra superior
        background_color: '#F8F7F2', // El color hueso para la pantalla de carga
        display: 'standalone', // Esto es lo que quita la barra del navegador en el cel
        orientation: 'portrait', // Para que no se voltee si acuestan el celular
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