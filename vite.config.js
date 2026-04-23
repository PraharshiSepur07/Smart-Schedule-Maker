import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appMode = String(env.VITE_APP_MODE || 'dev').toLowerCase() === 'demo' ? 'demo' : 'dev'
  const port = 5174
  const strictPort = appMode === 'demo'

  if (command === 'serve') {
    const modeLabel = appMode === 'demo' ? 'DEMO' : 'DEV'
    const strictLabel = strictPort ? 'strict' : 'flexible'
    console.log(`Running in ${modeLabel} mode on port ${port} (${strictLabel})`)
  }

  return {
    plugins: [
      react(),
      {
        name: 'demo-port-guard-message',
        configureServer(server) {
          server.httpServer?.once('error', (err) => {
            if (appMode === 'demo' && err?.code === 'EADDRINUSE') {
              console.error('Port 5174 is required for DEMO mode (Google OAuth). Please free the port and restart.')
            }
          })
        },
      },
    ],
    server: {
      port,
      strictPort,
    },
  }
})
