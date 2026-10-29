import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';

function apiEventsDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'api-events-dev-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/api/events') {
          try {
            // Ensure server environment variable is available to handler
            process.env.APPS_SCRIPT_URL = env.APPS_SCRIPT_URL || env.VITE_APPS_SCRIPT_URL || '';
            const handlerModule = await server.ssrLoadModule('/api/events.ts');
            const handler = handlerModule.default;

            const resHelper = Object.assign(res, {
              status(code: number) {
                res.statusCode = code;
                return this;
              },
              json(data: unknown) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify(data));
                return this;
              },
            });

            return await handler(req, resHelper);
          } catch (err: unknown) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'error',
              message: err instanceof Error ? err.message : 'Internal dev server proxy error',
            }));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), apiEventsDevPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
