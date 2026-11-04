# MatchIQ — identidad, experiencia y SEO

Fecha: 4 de noviembre de 2026. Alcance: frontend independiente; revisión local antes de desplegar.

Estado: cinco hitos aplicados. Marca IQ elegida como propuesta inicial; las otras composiciones se conservan para revisión. TypeScript, build y comprobación de HTML SEO correctos. Dieciséis pruebas E2E correctas en escritorio y móvil. Capturas en docs/previews y tres propuestas en docs/brand.

## Plan de trabajo

1. Identidad: conservar Barlow Condensed, lima y violeta; crear símbolo IQ y marca tipográfica, tres variantes de composición, versiones claras/oscuras, favicon e imagen social. SVG propios, sin escudos de terceros.
2. Interfaz: cabecera y portada más claras, mejor jerarquía de cifras, controles y estados de datos; corregir textos de «versión local» cuando la app está alojada.
3. Espera: esqueletos específicos por vista, spinner discreto, aviso de espera prolongada, cancelación/timeout y reintento. Conservar resultados anteriores al cambiar filtros y distinguirlos de la selección nueva. Accesibilidad y movimiento reducido.
4. Navegación y SEO: división/temporada en enlaces compartibles, metadatos por página, imagen social PNG, prerender de las tres rutas principales, robots y sitemap; raíz canónica en /inicio. Vistas con filtros y fichas dinámicas no indexables en esta fase. Rutas desconocidas con 404 real al alojar en Vercel.
5. Comprobación: TypeScript, build, metadatos HTML sin JavaScript, pruebas de interacción/errores/carga y revisión visual en escritorio y móvil. Documentar qué queda por medir en producción, sin prometer posiciones en buscadores.

## Criterios

- Marca legible en cabecera y símbolo reconocible a 32 px.
- No se inventan estadísticas ni porcentajes de progreso durante la carga.
- Los datos anteriores se identifican como tales mientras cambia la selección.
- Los enlaces compartidos seleccionan la misma división y temporada al abrirlos en otro navegador.
- Títulos, descripciones y vista social existen en el HTML de Inicio, Equipos y Comparador antes de ejecutar JavaScript.
- El build no necesita la API ni descarga datos deportivos.
- Revisar 390 px y escritorio; navegación por teclado y prefers-reduced-motion.

## Límites

Search Console necesita una cuenta del propietario y verificación del sitio. No se activa desde este cambio. Las fichas con estadísticas se mantienen en el cliente y noindex hasta disponer de una estrategia de contenido público y prerender específico. La publicación sigue pendiente de la prueba del usuario.

## Medición local

Lighthouse 13.6.0, una ejecución móvil simulada sobre la portada compilada: rendimiento 100, accesibilidad 100, buenas prácticas 100 y SEO 100. LCP 1,1 s, bloqueo total 20 ms y CLS 0,01. Se corrigió un salto de cabecera al aparecer el selector de división; la primera medición de CLS era 0,183. Son resultados de laboratorio local, no métricas de usuarios reales ni una garantía de puntuación en Vercel. Resumen conservado en docs/validation/lighthouse-summary.json.

Las pruebas verifican el prerender sin JavaScript, hidratación sin errores, carga diferida de gráficas, skeletons accesibles, estado anterior al cambiar filtros, reintento, espera prolongada, movimiento reducido, conservación de división/temporada, copia del enlace, error del catálogo, metadatos y 404. Los datos de esas pruebas son sintéticos. La revisión visual adicional consultó el backend público existente; no descargó CSV.
