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

Importar este repositorio. Root Directory: raíz (./), NO apps/web. vercel.json fija instalación, build y salida apps/web/dist. El build prerenderiza Inicio, Equipos y Comparador. / redirige a /inicio; fichas de equipo/partido usan la aplicación React, y otras rutas inexistentes devuelven 404.html. Mantener el comando de build de la raíz (pnpm build), que incluye el prerender.

1. Desplegar primero el backend de demostración en Cloudflare.
2. Configurar VITE_API_BASE_URL=https://TU-WORKER.workers.dev/api/v1 en Vercel.
3. Configurar la URL exacta del frontend en MATCHIQ_ALLOWED_ORIGINS del backend y redesplegar ese backend.
4. Desplegar o reconstruir el front tras cambiar su variable pública. Comprobar /inicio, /comparador, /equipos y recargar una ficha directamente.

Mientras esté pendiente la licencia de CSV, usar el backend en modo demo para una web pública. Un repositorio privado no protege por sí mismo una web o API desplegada.

## Validación y contratos

pnpm check ejecuta TypeScript, build y comprobaciones del HTML SEO. pnpm test:e2e ejecuta 16 recorridos en escritorio y móvil contra fixtures ficticias, sin backend ni credenciales; primero ejecutar pnpm exec playwright install chromium --only-shell. GitHub Actions ejecuta ambas comprobaciones; no despliega. packages/shared está copiado también en matchiq-backend: mantener ambos contratos idénticos al cambiarlos (huella en shared-contract.json). La separación conserva workspaces internos, pero no depende de carpetas fuera de este repositorio. Licencias de fuentes e iconos en docs/licenses.

## Identidad, cargas y SEO v0.3

Plan aplicado en IMPROVEMENTS.md y dirección visual actualizada en design.md. Marca principal IQ + MATCHIQ, tres composiciones en docs/brand/proposals.png, SVG claros/oscuros/monocromos, iconos e imagen social en apps/web/public/brand. pnpm brand:build regenera los archivos de identidad; no es necesario para cada build.

Esqueletos por pantalla, espera prolongada, timeout, reintento y actualizaciones que identifican los resultados anteriores. Las divisiones y temporadas se comparten por URL; ya no dependen de localStorage. Las gráficas se cargan bajo demanda.

VITE_SITE_URL define el dominio canónico (por defecto https://matchiq-frontend.vercel.app). Cambiarlo si se adopta otro dominio y reconstruir. Sitemap, robots, títulos, descripciones, OG/Twitter y JSON-LD de WebSite se generan sin consultar la API. Las vistas con filtros y fichas dinámicas permanecen noindex en esta fase; Search Console y la indexación efectiva requieren comprobar el despliegue del propietario. La API y los derechos de sus datos conservan sus propios requisitos.

## Probar el build local

pnpm preview sirve el build en http://127.0.0.1:4175/inicio. Para consultar el backend público desde esta vista previa, configurar MATCHIQ_PREVIEW_API_URL con https://matchiq-backend.hxmmer26.workers.dev/api/v1 en la terminal antes de arrancarlo. Ese proxy es solo para la revisión local. En Vercel se sigue usando VITE_API_BASE_URL.

En desarrollo con pnpm dev se usa el proxy local habitual. El prerender, robots y sitemap se comprueban con pnpm build y pnpm preview. Los cambios de esta revisión no se han desplegado automáticamente.
