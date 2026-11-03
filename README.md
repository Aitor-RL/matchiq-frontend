# MatchIQ — Frontend

React, TypeScript, Tailwind y Vite. Repositorio independiente: incluye packages/shared, no requiere el repositorio del backend para instalar o compilar.

## Desarrollo

Node 22.12+ y pnpm 10.29.3. Ejecutar desde la raíz de ESTE repositorio:

~~~sh
pnpm install --frozen-lockfile
pnpm dev
~~~

Abrir http://127.0.0.1:5173. Para pruebas locales, arrancar el backend por separado en el puerto 3001; Vite hace proxy de /api. Copiar .env.example a .env solo si se necesita cambiar VITE_API_BASE_URL. Esa variable es pública e incluye /api/v1; nunca poner claves en variables VITE_.

## Vercel

Importar este repositorio. Root Directory: raíz (./), NO apps/web. vercel.json fija instalación, build y salida apps/web/dist, además del fallback de rutas React.

1. Desplegar primero el backend de demostración en Cloudflare.
2. Configurar VITE_API_BASE_URL=https://TU-WORKER.workers.dev/api/v1 en Vercel.
3. Configurar la URL exacta del frontend en MATCHIQ_ALLOWED_ORIGINS del backend y redesplegar ese backend.
4. Desplegar o reconstruir el front tras cambiar su variable pública. Comprobar /inicio, /comparador, /equipos y recargar una ficha directamente.

Mientras esté pendiente la licencia de CSV, usar el backend en modo demo para una web pública. Un repositorio privado no protege por sí mismo una web o API desplegada.

## Validación y contratos

pnpm check ejecuta TypeScript y build. GitHub Actions repite esa comprobación; no despliega. packages/shared está copiado también en matchiq-backend: mantener ambos contratos idénticos al cambiarlos (huella en shared-contract.json). La separación conserva workspaces internos, pero no depende de carpetas fuera de este repositorio. Licencias de fuentes e iconos en docs/licenses.
