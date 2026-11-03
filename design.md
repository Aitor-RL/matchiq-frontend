# MatchIQ — Dirección visual

Estado: implementada una muestra funcional v0.1 para revisión del usuario. Fecha: 3 de noviembre de 2026.

## Concepto


Un panel de análisis de fútbol con personalidad de publicación deportiva: titulares fuertes, estructura compacta y estadísticas fáciles de leer.

La referencia aportada inspira la tipografía condensada e inclinada, bordes negros, sombras sin desenfoque, esquinas redondeadas y bloques de color. Crear una identidad propia para MatchIQ; no reutilizar logos, ilustraciones o composición exacta del sitio de referencia.

Esta propuesta adopta una base clara como la captura, revisando el tema oscuro del documento original. El color y la tipografía se validarán antes de construir pantallas completas.

## Tipografía

### Titulares y navegación

Propuesta: **Barlow Condensed ExtraBold Italic**, peso 800; probar Black Italic 900 para el logotipo tipográfico.

Es una aproximación visual al estilo de la imagen. No se ha identificado con certeza la fuente original.

- Logotipo: MATCHIQ, 30–36 px, peso 900, cursiva.
- Título de página: 40–56 px en escritorio; 32–36 px en móvil.
- Títulos de sección: 24–30 px.
- Navegación y acciones principales: 18–20 px.
- Mayúsculas en titulares y acciones breves; sin espaciado excesivo.
- Usar archivos de cursiva reales, sin inclinar artificialmente toda la interfaz.

Ejemplos de texto para la prueba: «EL PARTIDO, EN DATOS», «COMPARAR EQUIPOS», «ÚLTIMOS 10 PARTIDOS», «ESTADÍSTICAS» y «ÁRBITROS».

Fuente y variantes: https://fonts.google.com/specimen/Barlow+Condensed
Metadatos oficiales: https://github.com/google/fonts/blob/main/ofl/barlowcondensed/METADATA.pb

### Texto y números

Propuesta: **Barlow**, sin cursiva, para párrafos, filtros, tablas y estadísticas. Fallback: Arial, sans-serif.

- Texto principal: 16 px, interlineado 1,5.
- Texto secundario: 14 px; evitar menos de 12 px.
- Etiquetas: 14–16 px, peso 600.
- Valores destacados: 32–48 px, peso 700, sin cursiva.
- Números tabulares para alinear marcadores, porcentajes y columnas; verificar soporte en los archivos elegidos.
- Formato español: 2,4 goles, 58 %, fechas legibles y periodo explícito.

Autohospedar WOFF2 cuando se implemente y conservar las licencias. Cargar únicamente pesos necesarios con font-display: swap. Verificar acentos, ñ y estabilidad del diseño durante la carga.

## Paleta propuesta

| Token | Valor | Uso |
| --- | --- | --- |
| background | #E8E9E5 | Fondo general gris cálido |
| surface | #FFFFFF | Tarjetas y tablas |
| surface-muted | #F2F3EF | Filtros, filas alternas y bloques auxiliares |
| ink | #111111 | Texto, bordes e iconos |
| ink-muted | #51564F | Metadatos y textos secundarios |
| brand | #C5F451 | Acción principal y marca |
| compare | #7544DB | Segundo equipo y comparaciones |
| success | #167344 | Estado positivo sobre fondo claro |
| warning-bg | #FFE7A3 | Cobertura parcial o información pendiente |
| danger | #B42338 | Errores y acciones destructivas |

El verde lima identifica MatchIQ. El violeta distingue al segundo equipo en comparaciones. El fucsia de la captura puede estudiarse como variante, pero no es el acento elegido inicialmente.

Usar texto negro sobre verde lima y texto blanco sobre violeta, sujeto a comprobación de contraste. En gráficas, acompañar los colores con leyendas, etiquetas y trazos distinguibles.

## Formas, bordes y sombras

- Borde principal: 2 px sólido en ink.
- Radio: 12 px en botones y controles; 18–22 px en tarjetas.
- Sombra de botones: 3 px 3 px 0 ink.
- Sombra de tarjetas destacadas: 4 px 4 px 0 ink.
- Tablas y tarjetas de información secundaria: sin sombra o con menor énfasis.
- Iconos de línea consistente, tamaño 20–24 px, con texto en acciones importantes.
- Franjas diagonales discretas únicamente en alguna cabecera de sección; nunca debajo de tablas o textos largos.

No saturar todas las superficies con color o sombras. El espacio de lectura y los números deben dominar el panel.

## Distribución

- Contenedor máximo aproximado: 1440 px.
- Márgenes: 24–32 px en escritorio y 16 px en móvil.
- Escala de separación: 4, 8, 12, 16, 24, 32 y 48 px.
- Cabecera: marca, navegación principal y estado de datos.
- Navegación MVP: Inicio, Equipos y Comparador. Incorporar otras secciones cuando funcionen.
- Cabecera de página: título, contexto de competición/temporada y filtros relevantes.
- Evitar una gran portada promocional que retrase el acceso a las estadísticas.

En móvil, apilar el comparador, mantener etiquetas al lado de cifras y dar desplazamiento horizontal solo a tablas que lo requieran. Ningún control debe quedar fuera de pantalla.

## Primera pantalla a validar

Propuesta: **Comparador**, porque permite evaluar tipografía, filtros, tarjetas, cifras y gráficas en una sola vista.

1. Cabecera MATCHIQ y navegación.
2. Título «COMPARA EL JUEGO» con explicación breve.
3. Selectores de dos equipos, competición, temporada y últimos 5/10/20 encuentros.
4. Dos tarjetas de equipo, identificadas con verde y violeta.
5. Filas alineadas de goles a favor, goles en contra y victorias.
6. Una gráfica de tendencias sencilla con alternativa textual.
7. Pie de contexto con muestra válida, origen y actualización.

La primera muestra visual utiliza seis clubes ficticios: Bruma FC, Unión Faro, Racing Sierra, Deportivo Norte, Sporting Delta y Atlético Atlas. Se muestra una franja persistente «Datos sintéticos» y etiquetas «Ficticio». Todas sus cifras pertenecen a un conjunto de prueba; no se asocian a clubes reales.

## Componentes

### Botones y filtros

- Primario: fondo lima, texto negro y borde negro.
- Secundario: fondo blanco y borde negro.
- Seleccionado: icono o marca junto con cambio de color.
- Pulsado: desplazamiento visual de 1–2 px y reducción de sombra.
- Deshabilitado: texto explicativo cuando la razón no sea evidente.
- Área táctil de al menos 44 × 44 px.

### Tarjeta estadística

Debe contener nombre de la métrica, valor, unidad, número de partidos válidos y periodo. Ejemplo sintético: «Goles a favor / 1,8 por partido / 8 de 10 partidos con dato».

Mostrar «Sin datos» o «—» para ausencias; no sustituirlas por cero. Un cero válido debe seguir mostrándose como cero.

### Tablas y gráficas

- Cifras alineadas y ordenación comprensible.
- Verde y violeta identifican equipos, sin implicar que un equipo sea mejor en todas las métricas.
- Ejes, unidades, periodo y leyenda visibles.
- No interpolar ausencia de datos como si fuera un valor real.
- Separar visualmente temporadas y estados de partido.
- No mostrar indicadores de confianza o probabilidades sin cálculo validado.

### Estados de datos

- Cargando: esqueletos estables sin inventar números.
- Vacío: explicar qué filtro no tiene resultados y permitir corregirlo.
- Error: mensaje breve y reintento cuando proceda.
- Cobertura parcial: aviso con número de partidos válidos.
- Datos históricos: temporada visible; no etiquetar como «en directo».
- Cuota agotada: conservar datos persistidos y explicar la fecha de actualización.

## Accesibilidad y movimiento

- Validar contraste WCAG AA para texto y controles antes de aprobar la paleta.
- Foco visible de dos tonos que destaque tanto sobre blanco como sobre lima y violeta.
- Navegación completa por teclado y etiquetas accesibles en selectores.
- Estados comunicados con texto e icono además de color.
- Animaciones de 120–180 ms; respetar prefers-reduced-motion.
- Sin marquesinas en movimiento ni franjas de promoción como las de una tienda.

## Criterio de aceptación visual

- El usuario valida la muestra antes de extender el diseño.
- Titulares próximos al carácter de la referencia y cifras legibles.
- Una comparación se entiende en móvil sin depender de colores.
- Revisar 360 px, 768 px y escritorio, además de zoom al 200 %.
- Los datos sintéticos, errores y ausencias se reconocen sin ambigüedad.

## Decisiones pendientes

1. Confirmar Barlow Condensed ExtraBold Italic en una muestra renderizada.
2. Confirmar lima + violeta sobre base clara, o revisar el acento hacia fucsia.
3. Ajustar densidad después de ver el comparador en móvil y escritorio.
