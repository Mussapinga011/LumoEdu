import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        // Configurar KaTeX como externo (carregado via CDN)
        rollupOptions: {
            external: ['katex'],
            output: {
                manualChunks: {
                    // React e dependências principais
                    'react-vendor': [
                        'react',
                        'react-dom',
                        'react-router-dom'
                    ],
                    // Bibliotecas de UI
                    'ui-vendor': [
                        'lucide-react',
                        'clsx',
                        'zustand'
                    ],
                    // Outras bibliotecas
                    'utils-vendor': [
                        'react-rewards',
                        'date-fns'
                    ]
                }
            }
        },
        // Aumentar limite de warning para evitar avisos desnecessários
        chunkSizeWarningLimit: 600,
        // Otimizar minificação
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true, // Remover console.logs em produção
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.debug', 'console.info']
            }
        }
    }
});
