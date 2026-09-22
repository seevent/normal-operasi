import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import netlify from '@netlify/vite-plugin-tanstack-start'
import basicSsl from '@vitejs/plugin-basic-ssl'

const config = defineConfig({
  plugins: [
    basicSsl(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    netlify(),
    tanstackStart(),
    viteReact(),
  ],
  server: {
    https: true,
  },
  ssr: {
    noExternal: ['konva', 'react-konva', 'use-image'],
  },
})

export default config
