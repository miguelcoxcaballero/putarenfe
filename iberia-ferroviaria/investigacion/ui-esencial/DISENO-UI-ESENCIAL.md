# UI esencial · Tenfe: Conexiones 6.6

Especificación de rediseño de la interfaz **dentro de la partida**. Base: `main` @ `bae2876` (6.5.2). Su código de juego es idéntico a `c903d0a` (`bae2876` solo añade `investigacion/ui-esencial/`), y `main` coincide con `origin/main`, así que el código nuevo de ChatGPT ya está incluido. Fuentes:

- Auditoría visual: `scratchpad/ui/audit/visual.md` (copia en el repo: `iberia-ferroviaria/investigacion/ui-esencial/auditoria-visual.md`).
- Mapa de código: `scratchpad/ui/audit/code.md` (copia: `investigacion/ui-esencial/mapa-codigo-ui.md`).
- Comprobador reutilizable: `investigacion/ui-esencial/checker.mjs`.

Todas las rutas de código son relativas a `iberia-ferroviaria/proyecto/dist/` salvo que se diga otra cosa. Los números de línea son los de `c903d0a` (iguales en `bae2876`).

**Revisión crítica (aplicada en este documento).** Respecto al primer borrador: sin desenfoque en ningún sitio (la guía y los diálogos solo oscurecen); sin pastilla de urnas en la barra superior (pasa a la franja cuando importa); insignias como punto, sin número; la franja tiene en cuenta el encargo firmado y las urnas; la caja de la guía ya no repite la instrucción (la dice la franja) y su botón siguiente solo aparece cuando el paso está listo; presupuestos de texto por fila y por «resto»; modo apaisado de teléfono, zonas seguras y objetivos táctiles de 44 px; tabla de teclado y cierre; estados vacíos; claves de plegables compartidas; formato único de cifras; y un cuarto paquete (D) solo para pruebas.

---

## 0. En diez líneas

1. **Una franja de objetivo fija** (`#mission`) arriba en el centro: qué hacer ahora, en una frase que es un botón, y cinco puntos que abren los retos. Nunca se oculta: ni con menús abiertos, ni en el móvil, ni durante la guía. Solo la tapa un diálogo.
2. **Barra superior mínima**: «Turno N», Caja con su tendencia y Apoyo. Nada más: sin marca, sin reloj fuera de la jornada, sin puntualidad, sin trenes libres y sin cuenta atrás de urnas.
3. **Banda inferior única**: navegación de 6 entradas (Red, Flota, Dinero, Despacho, Progreso, Menú) y, a su derecha, los controles del turno. «Cerrar turno» es la acción principal. La línea de tiempo y las velocidades solo existen con la jornada en marcha.
4. **Un único sistema de zonas** con tokens CSS: ninguna caja de primer nivel se superpone a otra en 1440×900, 1280×720, 390×844, 320×640 ni en el teléfono apaisado (844×390). Los paneles empiezan bajo la barra superior y terminan sobre la banda inferior. Los controles del mapa se apartan de las fichas.
5. **Un mensaje narrado cada vez**, compacto, en una zona reservada que nunca pisa paneles, guía ni controles. Como mucho tres esperan en cola. Todos quedan en el historial (Progreso → Noticias → Mensajes).
6. **Las alertas de jornada viven en la franja de objetivo**: desaparece la píldora flotante. Lo pendiente se marca con un punto en su sección, sin número.
7. **Paneles con cabecera de una línea, ≤ 5 pestañas fijas fuera del desplazamiento y un solo nivel de desplegable.** Sin antetítulos, sin párrafos de introducción, sin tarjetas dentro de tarjetas. Lo secundario, plegado.
8. **El botón principal de cada diálogo se ve siempre** (pie fijo). El formulario que pide la guía está arriba de su ficha.
9. **Guía**: mismas frases grabadas. El hueco descubre el panel y el anillo señala el control exacto. La instrucción corta vive en la franja. La caja de la guía muestra quién habla, el progreso, el texto grabado y, cuando el paso está listo, un único botón. Nada se desenfoca: el fondo solo se oscurece, y **nunca** el coach, el panel del paso, la franja de objetivo, un mensaje o un diálogo abiertos a la vez. El coach se coloca esquivando todas esas cajas.
10. **Pruebas automáticas** que lo garantizan en las cuatro resoluciones (y un recorrido corto en apaisado) y en cada paso de la guía: solapes, oscurecido sin desenfoque, objetivo visible y presupuestos de texto y cifras.

---

## 1. Principios

1.1 **Lo esencial, siempre; lo demás, cuando se pide.** En pantalla fija solo hay: mapa, estado (turno, caja, apoyo), objetivo, navegación y la acción del turno. Todo lo demás vive en una sección, una pestaña, un plegable o un desplegable que el jugador abre.

1.2 **El objetivo nunca se pierde.** En cualquier momento (sin paneles, con un cajón, con una ficha, en móvil, durante la guía, durante la jornada) hay una sola línea que dice qué hacer ahora y deja hacerlo con un clic. Solo un diálogo modal (un momento) la tapa. Cuando hay un compromiso firmado, la franja lo tiene en cuenta (§2.7): el objetivo nunca contradice lo que el jugador ya ha prometido.

1.3 **Una caja no contiene cajas.** Dentro de un panel o diálogo, el contenido se separa con espacio y filas con una línea fina, nunca con tarjetas con borde o fondo propio. Excepciones permitidas: fotos/miniaturas y las fichas de producto de Trenes Pop (es una tienda con estilo propio).

1.4 **Una cifra solo si decide algo.** Se muestra un número cuando el jugador decide con él (¿me lo puedo permitir?, ¿cuántos trenes me faltan?, ¿cuánto me falta para el reto?). El resto pasa a «Detalles».

1.5 **Presupuesto de texto.**
- Etiquetas de botón y pestaña: ≤ 2 palabras (botones de acción compuesta, como «Abrir servicio · 4 M€» o «Aceptar servicio público», ≤ 4).
- Título de panel: ≤ 3 palabras. Sin antetítulo (kicker) ni subtítulo.
- Contexto: como mucho una línea corta por bloque. Lo demás, al desplegar. El atributo `title` solo repite o amplía algo que ya se puede leer al tocar (en el teléfono no hay ratón): nunca es el único sitio de un dato.
- Filas de lista: ≤ 8 palabras y ≤ 3 cifras por fila.
- Los textos grabados (diálogos, narraciones, opciones del consejo y de los sucesos) no cuentan en el presupuesto y no se tocan.

1.6 **Un verbo para avanzar.** «Cerrar turno» avanza la partida. «Comienza la jornada» juega un día (opcional). Desaparecen «Delegar mes» y «Delegar mes y comprobar progreso» de la Agenda, y el ▶ fuera de la jornada. Una sola unidad de tiempo en la interfaz: **turno** («/turno», «turnos»); nada de «/mes» en etiquetas de UI.

1.7 **Nada tapa a nada.** Hay zonas fijas (sección 2) con un solo juego de tokens. Las cajas de primer nivel nunca se intersecan. Los desplegables son transitorios: pueden pasar sobre el mapa o un panel, nunca sobre la barra superior, la franja de objetivo, la banda inferior, el coach ni un mensaje.

1.8 **Nada se desenfoca.** Ni la guía ni los diálogos usan `backdrop-filter` ni `filter: blur`: el fondo solo se oscurece. Lo que señala la guía, y cualquier caja que salga a la vez (un mensaje, un diálogo), se ve nítido y se puede pulsar.

1.9 **Lo congelado no se toca.** Textos grabados, hablante, emoción, id y orden (`story.js`, textos de `induction.js`, `encounters.js`, `tycoon.js ARCS`, `narration-data.js`, `rescate-data.js LINES`, el `id`, `person`, `title` y `text` de cada `TOUR_STEPS` y las tres variantes del paso `day`, y los 46 mensajes literales de `app.js`: 22 de `toast('…')` y 24 como último argumento de `act(…, '…')`, que la narración reconoce por su texto exacto). Comprobación: `node iberia-ferroviaria/proyecto/tools/voice_dialogues.mjs | sha256sum` = `6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f`. Las frases grabadas nombran lugares de la UI («Red → Jornada», «Despacho», «Agenda», «laboratorio», «Plan de servicio», «previsión», «Aplicar plan», «Abrir servicio · 4 M€», «Comienza la jornada», «Hasta el último tren», «Siguiente jornada», «el parte», «Ayuda», «Trenes Pop», «el objetivo»): esos nombres siguen visibles.

1.10 **Aspecto de juego, no de documento.**
- Paleta del bloque «Tenfe 5» (oscura) con un solo acento para la acción principal (`--wine`) y oro para alertas (`--gold-2`). Rojo/verde solo para tendencias.
- Escala tipográfica: 11 / 13 / 15 / 17 / 22 px. Números tabulares. Sin mayúsculas espaciadas salvo en las pestañas.
- Radio 8 px, sombra única `--shadow`, borde 1 px `--rule`. Nada de raíles decorativos ni cabeceras de esmalte marrón (legado 2.0).
- Iconos del set `ICONS` de `app.js`; icono + 1 palabra en la navegación.
- Foco de teclado visible en todo lo pulsable (`:focus-visible`, contorno 2 px del acento).

1.11 **Formato único de cifras.** Un solo formateador: `money()` y `signed()` de `app.js` (los cambia A; B, C y D los usan y no inventan otro):
- Dinero: «436 M€» (sin decimales desde 100 M€), «12,4 M€» (un decimal entre 1 y 100), «0,34 M€» (dos decimales solo por debajo de 1 M€). Las etiquetas que ya trae el motor («18 mil €» en las respuestas a incidencias) se quedan como vienen.
- Tendencias con signo (`signed()`): «+1,9 M€», «−0,34 M€». En la barra superior, solo flecha y valor con un decimal: «▼3,0».
- Porcentajes enteros: «54 %». Tarifas enteras: «45 €».
- Tiempo: «Turno N» y «N turnos». La hora «07:45» solo con la jornada en marcha. Ninguna fecha de calendario en la partida (ni en el parte).
- Recuentos grandes (viajeros, tren-km) solo dentro de «Detalles».

---

## 2. La pantalla siempre visible

### 2.1 Modos y tokens

Tres modos, decididos solo por CSS (y leídos por JS a través de una clase en `body`):

| Modo | Consulta | Disposición |
|---|---|---|
| **Escritorio** | el resto | barra superior y franja en la misma fila; banda inferior de una fila |
| **Apaisado bajo** (teléfono girado, ventanas bajas) | `(max-height: 500px) and (min-width: 600px)` | la de escritorio con tokens compactos y navegación solo con iconos |
| **Teléfono** | `(max-width: 860px) and (min-height: 501px), (max-width: 599px)` | franja en su propia fila; acciones del turno y navegación en dos filas; paneles como hojas |

`layoutChrome()` (paquete A) pone `body.ui-phone` cuando `matchMedia(PHONE_MQ).matches`, con `const PHONE_MQ='(max-width: 860px) and (min-height: 501px), (max-width: 599px)'` declarada una sola vez junto a las constantes de `app.js`. Ningún otro código usa `innerWidth` para decidir el modo: la guía y los paquetes B/C/D leen `document.body.classList.contains('ui-phone')`.

Todos los tamaños salen de estos tokens, definidos en `:root` al final de `style-v3.css` (paquete A). Nadie usa números mágicos para colocar cajas (hoy la guía usa 102/100/90 px). Las zonas seguras del teléfono (`viewport-fit=cover` ya está en `index.html`) entran en los márgenes.

```css
:root{
 --g:12px;           /* margen exterior */
 --g-top:max(var(--g), env(safe-area-inset-top));
 --g-bottom:max(var(--g), env(safe-area-inset-bottom));
 --gap:10px;         /* separación entre cajas (≥ 8: la prueba de narración exige 8 px entre mensaje y banda) */
 --top-h:52px;       /* barra superior */
 --obj-h:0px; --obj-gap:0px;   /* fila propia de la franja de objetivo (solo teléfono) */
 --nav-h:64px;       /* banda inferior */
 --act-h:0px; --act-gap:0px;   /* fila propia de acciones del turno (solo teléfono) */
 --nav-w:440px;      /* ancho fijo de la navegación en escritorio */
 --hud-l:140px;      /* hueco izquierdo de la barra superior («Turno 12», «Fin del mandato») */
 --hud-r:280px;      /* hueco derecho (Caja, Apoyo) */
 --drawer-w:min(640px,calc(100vw - 2*var(--g)));
 --insp-w:min(400px,calc(100vw - 2*var(--g)));
 --msg-w:380px;      /* ancho de la tarjeta de mensaje en modo libre */
 --msg-zone:104px;   /* alto de la zona de mensajes (obstáculo permanente para el coach en escritorio) */
 --msg-h:0px;        /* reserva activa de mensaje (modo reserva, lo pone layoutChrome) */
 --msg-left:var(--g);/* borde izquierdo del área libre del mapa (lo pone layoutChrome) */
 --guide-h:0px;      /* reserva del coach acoplado (teléfono o último recurso, lo pone la guía) */
 --tap:36px;         /* lado mínimo de × y controles pequeños (44 en teléfono) */
 --safe-top:calc(var(--g-top) + var(--top-h) + var(--obj-gap) + var(--obj-h) + var(--gap));
 --safe-bottom:calc(var(--g-bottom) + var(--nav-h) + var(--act-gap) + var(--act-h) + var(--gap));
 /* escala z (dentro de #game) */
 --z-map:0; --z-map-ui:10; --z-panel:20; --z-chrome:30; --z-pop:40;
 --z-dim:50; --z-lift:52; --z-ring:54; --z-coach:56;
}
@media (max-height:500px) and (min-width:600px){:root{
 --g:8px; --gap:8px; --top-h:44px; --nav-h:52px; --nav-w:300px; --hud-l:110px; --hud-r:230px; --msg-zone:84px; --msg-w:320px;
}}
@media (max-width:860px) and (min-height:501px), (max-width:599px){:root{
 --g:8px; --gap:8px; --top-h:44px; --obj-h:44px; --obj-gap:6px;
 --nav-h:58px; --act-h:52px; --act-gap:6px; --tap:44px;
}}
/* Teléfono con guía: la navegación y la fila de acciones se retiran salvo en el paso de jornada */
@media (max-width:860px) and (min-height:501px), (max-width:599px){
 body.guided-turn{--nav-h:0px;--act-gap:0px;--act-h:0px}
 body.guided-turn.guide-day{--act-h:52px}
}
```

Valores resultantes (sin zonas seguras):

| Resolución | Barra superior | Área principal (paneles) | Banda inferior |
|---|---|---|---|
| 1440×900 | y 12–64 | y 74–814 (740 px) | y 824–888 |
| 1280×720 | y 12–64 | y 74–634 (560 px) | y 644–708 |
| 844×390 (apaisado) | y 8–52 | y 60–322 (262 px) | y 330–382 |
| 390×844 | y 8–52, objetivo 58–102 | y 110–712 (602 px) | acciones 720–772, navegación 778–836 |
| 320×640 | ídem | y 110–508 (398 px) | acciones 516–568, navegación 574–632 |

En teléfono `--gap` vale 8 px (no 6): `narracion-ui-test.mjs` exige que el mensaje quede al menos 8 px por encima de `#daybar` también a 390 px.

En apaisado bajo la navegación muestra solo iconos (la palabra queda en `aria-label` y como texto oculto visualmente), 6 × 48 px; el cajón y la ficha usan los mismos tokens que en escritorio y la guía se acopla abajo (§5.5).

### 2.2 Escritorio y apaisado bajo

```
 1440×900
┌────────────────┐   ┌──────────────────────────────────────────┐   ┌──────────────────────────┐
│ Turno 3        │   │ ◎ Abre Madrid — Soria      ●●○○○ ▾      │   │ Caja 436 M€ ▼3,0  Apoyo 54 %│  y 12–64
└────────────────┘   └──────────────────────────────────────────┘   └──────────────────────────┘
 .hud-turn               #mission (centrada en el hueco libre)          #resources
┌──────────── #drawer (640) ──────────────┐                                          ┌─────────┐
│ Red                                   × │                                          │ Capas ▾ │ .map-tools
│ Servicios Jornada Obras Horarios Compet.│                                          │   ⌂     │ (se aparta a la
├─────────────────────────────────────────┤                M A P A                   └─────────┘  izquierda de la
│ [Buscar ciudad] [Tipo ▾] [Estado ▾] [+] │                                                        ficha si hay una)
│ Madrid — Barcelona  3 salidas  +1,9 M€  │
│ Madrid — Sevilla    3 salidas  +0,9 M€  │       ┌ mensaje (zona de mensajes, 1 a la vez) ┐
│ …                                       │       │ [▣] Raquel Sanz            ▷  ×        │
└─────────────────────────────────────────┘       │ Hemos cumplido otro objetivo del…      │
                                                  └────────────────────────────────────────┘
┌──────────────── #navigation (440) ───────────────┐ ┌──────────── #daybar ─────────────────────┐
│  Red   Flota  Dinero Despacho Progreso │  ☰ Menú │ │  [▶ Comienza la jornada]  [Cerrar turno] │  y 824–888
└──────────────────────────────────────────────────┘ └──────────────────────────────────────────┘
```

Durante la jornada la barra de turno ocupa todo el ancho restante:

```
┌──── #navigation ────┐ ┌──────────────────────── #daybar ─────────────────────────────────────────┐
│ Red Flota … ☰ Menú  │ │ 07:45  ▁▂▅▇▅▃▂▁▂▅▇▆▃▁ (línea de tiempo)   1× 3× 10× 30×  ❚❚  [Hasta el último tren] │
└─────────────────────┘ └──────────────────────────────────────────────────────────────────────────┘
```

Posiciones (escritorio; en apaisado bajo, las mismas con sus tokens):

| Caja | left | right | top | bottom | Tamaño |
|---|---|---|---|---|---|
| `.hud` (contenedor transparente, `pointer-events:none`) | g | g | g | — | alto `--top-h` |
| `.hud-turn` | g | — | g | — | ancho auto ≤ `--hud-l` |
| `#resources` | — | g | g | — | ancho auto ≤ `--hud-r` |
| `#mission` | g + hud-l + gap | g + hud-r + gap | g | — | `width:fit-content; max-width:640px; margin-inline:auto`, alto `--top-h` |
| `#navigation` | g | — | — | g | ancho `--nav-w`, alto `--nav-h` |
| `#daybar` | preparación/cierre: auto (pegado a la derecha, `width:fit-content`); jornada: g + nav-w + gap | g | — | g | alto `--nav-h` |
| `.map-tools` | — | g (o g + insp-w + gap con ficha) | safe-top | — | ancho auto; oculto con Trenes Pop a ancho completo y durante la guía (`body.guided-turn .map-tools{visibility:hidden}`: el mapa está inerte y ningún paso usa Capas) |
| `#drawer` | g | — (Trenes Pop: g) | safe-top | safe-bottom + msg-h + guide-h | ancho `--drawer-w` |
| `#inspector` (también la ficha de ciudad, sin la variante `.wide` que hoy cambia su altura) | — | g | safe-top | safe-bottom + msg-h + guide-h | ancho `--insp-w` |
| `#toast` (fuera de `#game`) | `--msg-left` | — | — | safe-bottom + guide-h | ancho `min(--msg-w, área libre − 2·gap)` |
| `#coach` | algoritmo §5.5 | | | | ancho `min(340px, 100vw − 2g)` |
| `#entry-welcome` | centrada en el viewport | | safe-top | — | ancho `min(400px, 100vw − 2g)`, alto ≤ área principal |

### 2.3 Teléfono

```
 390×844
┌────────────────────────────────────────┐
│ Turno 3            436 M€ ▼3,0  · 54 % │  .hud (una caja) y 8–52
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ ◎ Abre Madrid — Soria        ●●○○○ ▾  │  #mission y 58–102
└────────────────────────────────────────┘
                        ┌──────────┬────┐  y 110–154 (.map-tools en fila; oculto con el cajón,
            M A P A     │ Capas ▾  │ ⌂  │   un desplegable, la bienvenida o la guía)
                        └──────────┴────┘
┌────────────────────────────────────────┐
│ [▣] Raquel Sanz               ▷   ×    │  mensaje (1 a la vez)
│ Hemos cumplido otro objetivo del…      │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ [▶ Comienza la jornada] [Cerrar turno] │  #daybar y 720–772
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│  Red  Flota Dinero Despacho Progreso ☰ │  #navigation y 778–836
└────────────────────────────────────────┘
```

Cajón abierto en teléfono (hoja entera entre la franja de objetivo y las acciones del turno):

```
┌ Turno 3            436 M€ ▼3,0 · 54 % ┐
┌ ◎ Abre Madrid — Soria        ●●○○○ ▾ ┐
┌───────────────────────────────────────┐ y 110
│ Red                                 × │ (cabecera y pestañas fijas)
│ SERVICIOS JORNADA OBRAS HORARIOS COMP.│ (fila de pestañas con desplazamiento horizontal propio)
│ ...contenido con su propio scroll...  │
└───────────────────────────────────────┘ y 712 (− msg-h si hay mensaje)
┌ [mensaje, si lo hay: la hoja se acorta 80 px] ┐
┌ [▶ Comienza la jornada] [Cerrar turno]       ┐
┌  Red  Flota Dinero Despacho Progreso ☰        ┐
```

Ficha abierta en teléfono (media hoja anclada abajo; el mapa con la selección sigue visible encima):

```
┌ Turno 3            436 M€ ▼3,0 · 54 % ┐
┌ ◎ Abre Madrid — Soria        ●●○○○ ▾ ┐
            M A P A (selección centrada)       Capas ▾ / ⌂ siguen visibles
┌───────────────────────────────────────┐ y ≈ 273 en 390×844
│ AVE Madrid — València               × │
│ ...plan de servicio, con scroll...    │
└───────────────────────────────────────┘ y 712
┌ [▶ Comienza la jornada] [Cerrar turno]       ┐
┌  Red  Flota Dinero Despacho Progreso ☰        ┐
```

En teléfono, `.map-tools` es una fila (Capas ▾ y ⌂ uno al lado del otro, 44 px de alto, y 110–154) y reserva `--tools-h: 52px` (44 + gap). Altura de la ficha en teléfono: `bottom: calc(var(--safe-bottom) + var(--msg-h) + var(--guide-h))` y `height: min(calc(100dvh − var(--safe-top) − var(--tools-h) − var(--safe-bottom) − var(--msg-h) − var(--guide-h)), max(320px, 52dvh))`, así que nunca toca los controles del mapa. Durante la guía (`body.guided-turn`: controles ocultos, `--tools-h: 0px`) ocupa todo el alto disponible. La cabecera nunca sale de la pantalla porque la ficha nunca empieza por encima de `--safe-top`.

Posiciones (teléfono):

| Caja | left | right | top | bottom | Tamaño |
|---|---|---|---|---|---|
| `.hud` (una caja con fondo) | g | g | g | — | alto `--top-h` |
| `#mission` | g | g | g + top-h + obj-gap | — | alto `--obj-h` |
| `#navigation` | g | g | — | g | alto `--nav-h`, 6 columnas iguales |
| `#daybar` | g | g | — | g + nav-h + act-gap | alto `--act-h` |
| `.map-tools` | — | g | safe-top | — | oculto con el cajón abierto, con un desplegable abierto y durante la guía; visible con la media hoja de ficha |
| `#drawer` | g | g | safe-top | safe-bottom + msg-h + guide-h | hoja entera; cabecera y pestañas fijas |
| `#inspector` | g | g | auto | safe-bottom + msg-h + guide-h | media hoja (fórmula de arriba); la cabecera nunca sale de pantalla |
| `#toast` | g | g | — | safe-bottom + guide-h | alto ≤ 76 px |
| `#coach` (guía) | g | g | — | safe-bottom | `max-height:min(240px,38dvh)` |
| `#entry-welcome` | g | g | safe-top | — | sin imagen; alto ≤ área principal |

En 320×640 caben las 6 entradas de navegación (6 × 50 px) y la barra superior en una línea («Turno 3» · «436 M€ ▼3,0» · «54 %»). Por debajo de 360 px de ancho se ocultan las palabras «Caja» y «Apoyo» (quedan en `aria-label`); el orden fijo de la barra (Turno · dinero · porcentaje) y el color dicen qué es cada cifra.

**Teléfono, reglas táctiles**: todo control mide al menos `--tap` (44 px) de lado o de alto (× de paneles y mensajes, ▷, «Pausar», pestañas, filas pulsables, − y + de la ficha de ciudad); las pestañas que no caben se desplazan en horizontal dentro de su fila (nunca se cortan con «Comp…»); sin desbordamiento horizontal de página; ningún dato vive solo en `title`.

### 2.4 Escala z

Dentro de `#game` (que es un contexto de apilamiento por ser `position:fixed`):

| z | Capa | Elementos |
|---|---|---|
| 0 | mapa | `canvas#map` |
| 10 | controles del mapa | `.map-tools` |
| 20 | paneles | `#drawer`, `#inspector` (excluyentes entre sí, como hoy) |
| 30 | armazón | `.hud`, `#mission`, `#navigation`, `#daybar`, `#entry-welcome` |
| 40 | desplegables | panel de objetivo, popover de Menú, lista de Capas (viven dentro de su caja: `.map-tools` sube a 40 mientras Capas está abierto) |
| 50 | oscurecido de la guía (sin desenfoque) | `#tour-shades` (4 `<i>`) |
| 52 | elevados sobre el oscurecido | `.hud` y `#mission` durante la guía (y cualquier caja del paso que quede fuera del hueco), con `.tour-lift` |
| 54 | anillo | `#spot.tour-ring` |
| 56 | coach | `#coach.tour-coach` |

Fuera de `#game`: `#toast` (z 70, siempre por encima de todo `#game`, así que un mensaje nunca queda bajo el oscurecido) y `dialog#modal` (capa superior del navegador). El fondo del diálogo oscurece sin desenfocar: `dialog#modal::backdrop{background:rgba(11,17,26,.6);backdrop-filter:none}` (A, en `style-v3.css`; C quita el `blur` de `dialog#modal.tour-dialog::backdrop` en `induction.css`). Con un diálogo abierto, la bandeja `#toast` se oculta (`body:has(dialog#modal[open]) #toast{visibility:hidden}`) para que ningún mensaje quede emborronado detrás del fondo; vuelve al cerrarlo (§2.10).

**Cambio clave:** `#tour-shades`, `#spot` y `#coach` se añaden **dentro de `#game`** (hoy van a `body`), para que la escala z compare directamente con los paneles y se puedan elevar la barra superior y la franja por encima del oscurecido.

### 2.5 Reglas de colisión (obligatorias)

1. **Cajas de primer nivel** (las que comprueba la prueba de solapes): `.hud-turn`, `#resources` (escritorio y apaisado) o `.hud` (teléfono); `#mission`; `#navigation`; `#daybar`; `.map-tools`; `#drawer`; `#inspector`; cada `#toast .narration-toast` visible; `#coach`; `#entry-welcome`. Ningún par se interseca (tolerancia 1 px²).
2. **Desplegables** (`#mission .obj-panel`, `#menu-pop`, `.map-layers[open] .layer-switch`): pueden pasar sobre el mapa o un panel; no pueden intersecar el armazón (barra superior, franja, banda inferior), el coach ni un mensaje. Solo uno abierto a la vez: abrir uno cierra los otros. Mientras hay uno abierto, la bandeja de mensajes se oculta (`body.ui-pop #toast{visibility:hidden}`). Se cierran con: clic fuera (el clic no se consume y hace lo suyo), Esc, volver a pulsar su botón, o elegir una de sus entradas.
3. **Paneles**: nunca por encima de `safe-top` ni por debajo de `safe-bottom` (+ reservas). La ficha de ciudad no crece hacia arriba (hoy en 390 su cabecera queda en y = −6.968 y no se puede cerrar).
4. **Controles del mapa**: con ficha abierta en escritorio o apaisado, se desplazan a la izquierda de la ficha. En teléfono son una fila bajo la franja: se ocultan con el cajón abierto, con un desplegable abierto, con la bienvenida y durante la guía; con la media hoja de ficha se quedan (la ficha no sube hasta ellos, §2.3). Con Trenes Pop a ancho completo se ocultan. Durante la guía se ocultan en todos los modos.
5. **Mensajes**: en *modo libre* se colocan abajo a la izquierda del área libre del mapa (entre paneles). Si no hay mensaje no reservan nada. Pasan a *modo reserva* cuando hay un mensaje visible y el área libre mide menos de 340 px (escritorio: cajón de 640 en pantallas ≤ 1000 px, Trenes Pop) o, en teléfono, cuando hay un panel abierto. En modo reserva `--msg-h` vale 88 px (escritorio y apaisado) / 80 px (teléfono), los paneles se acortan esa altura y la tarjeta ocupa la fila liberada de lado a lado.
6. **Coach**: obstáculos fijos = barra superior, franja de objetivo y su panel abierto, banda inferior, zona de mensajes (aunque esté vacía, en escritorio) y cualquier mensaje visible. En teléfono y en apaisado se acopla abajo y reserva `--guide-h`; los paneles y la bandeja se recolocan encima (§5.5).
7. **Bienvenida**: sale con todos los paneles cerrados; cualquier acción (`data-action`) salvo `welcome-close`, `narration-replay` y `narration-dismiss` (esas tres ya están exceptuadas hoy en `app.js:1488`), un clic en el mapa o abrir un panel la retira; `welcome-close` también. En teléfono, mientras se ve, los controles del mapa se ocultan (`body:has(#entry-welcome) .map-tools{display:none}`), igual que con un desplegable abierto (`body.ui-pop .map-tools{visibility:hidden}`).
8. **Diálogos**: `dialog#modal` es un momento: oscurece la partida (sin desenfoque) y oculta la bandeja de mensajes. Dentro, el botón principal está en un pie fijo y se ve sin desplazarse en las cinco resoluciones de prueba.
9. **Cajón y ficha son excluyentes**: abrir un cajón (también con `tycoon-tab`, `tenfe-next` o las teclas 1–5) cierra la ficha; elegir algo en el mapa cierra el cajón (como hoy). Entre 861 y 1080 px no caben los dos.

Implementación (paquete A): `layoutChrome()` en `app.js` pone en `body` las clases `ui-phone`, `ui-drawer`, `ui-inspector`, `ui-wide-drawer` (Trenes Pop), `ui-msg-reserve`, `ui-pop` y en `document.documentElement` las variables `--msg-left` y `--msg-h`. Se llama desde `render()`, en `resize`, en el evento `toggle` de `details.map-layers`, desde `narrator.onTray` y, para no depender de que cada camino llame a `render()` (hoy `pick()`, `navigate()` y `case 'tycoon-tab'` solo repintan una parte), desde un `MutationObserver` sobre los atributos `class` de `#drawer` e `#inspector` y la lista de hijos de `#toast`, agrupado en un `requestAnimationFrame`. Todo lo demás es CSS con los tokens.

### 2.6 Barra superior

| Escritorio y apaisado | Teléfono |
|---|---|
| Izquierda (`.hud-turn`): **«Turno 3»** (al terminar: «Fin del mandato»). Nada más. | Una sola caja: «Turno 3» a la izquierda; Caja + tendencia + Apoyo a la derecha. |
| Derecha (`#resources`): **Caja** «436 M€» con la tendencia por turno al lado («▼3,0» en rojo, «▲1,2» en verde, `title="Resultado por turno: −3,0 M€"`); **Apoyo** «54 %» (rojo si < 50). Caja abre Dinero; Apoyo abre Despacho → Apoyo. | Igual; por debajo de 360 px sin las palabras «Caja» y «Apoyo». |

Formato según §1.11. Fuera: marca «Iberia Ferroviaria · Conexiones · al mando de Tenfe», «· tu red en marcha», la cuenta atrás «N turnos hasta las urnas» (pasa a la franja de objetivo cuando el apoyo peligra, §2.7, y siempre está en el panel de objetivo y en Despacho → Apoyo), sol y reloj (pasan a la barra de turno durante la jornada), Puntualidad (panel de objetivo, reto 1) y Trenes libres (Flota y selector de material de la ficha).

Marcado nuevo en `index.html` (paquete A; ids que conservan su función):

```html
<header class="hud">
 <div class="hud-turn"><strong id="date">Turno 1</strong></div>
 <div id="resources" class="resources"></div>
</header>
```

Se eliminan `.brand`, `.when`, `#dateShort`, `#dayKind` y `.clock`/`#sun`/`#clock` del HUD (el reloj vive en `#daybar` durante la jornada; `renderClock()` comprueba que `#clock` exista y sigue actualizando `body[data-sky]`). Ninguna prueba ni otro módulo usa `#dayKind` como elemento (`observer-runtime-test.mjs` usa la función `O.dayKind`). El `aria-label` del `canvas#map` cambia «usa la rueda o los botones para ampliar» por «usa la rueda, el pellizco o las teclas + y − para ampliar».

`renderHud()` y `renderMission()` se ejecutan cada segundo durante la jornada (`frame`): solo escriben `innerHTML` cuando el HTML generado cambia (comparan con el último), para no parpadear ni robar el foco.

### 2.7 Franja de objetivo (`#mission`)

`aside#mission` se conserva (es el objetivo del paso 1 de la guía y parte del encuadre del mapa) y pasa a ser la franja.

```
┌────────────────────────────────────────────────────────┐
│ ◎  Abre Madrid — Soria                    ●●○○○  ▾    │
└────────────────────────────────────────────────────────┘
  └── button.obj-go [data-action=tenfe-next] ──┘ └─ button.obj-more [data-action=objective] ┘
```

```html
<aside id="mission" class="objective" data-state="normal">
 <button class="obj-go" data-action="tenfe-next" title="Abre Madrid — Soria"><span class="obj-ico" aria-hidden="true">◎</span><span class="obj-label">Abre Madrid — Soria</span></button>
 <button class="obj-more" data-action="objective" aria-expanded="false" aria-controls="obj-panel" aria-label="Retos del mandato: 1 de 5"><i class="on"></i><i></i><i></i><i></i><i></i><span aria-hidden="true">▾</span></button>
 <div id="obj-panel" class="obj-panel" hidden>…</div>
</aside>
```

La etiqueta ocupa una línea con elipsis en escritorio y apaisado, y hasta dos líneas (13 px) dentro de los 44 px de la franja en teléfono; el texto completo va en `title` y se lee entero al abrir el panel. Los cinco puntos no llevan cifra: el paso 1 de la guía abre el panel y enseña qué son; el `aria-label` dice «Retos del mandato: N de 5».

**Estados** (`data-state`), en orden de prioridad:

| Estado | Cuándo | Icono | Etiqueta (≤ 48 caracteres) | Clic en la etiqueta | Puntos ▾ |
|---|---|---|---|---|---|
| `guide` | guía activa | ◎ | «Guía · {guideInstruction()}» (§5.3) | `tutorial-focus` (vuelve a poner la guía en su sitio) | ocultos (en el paso 1 la guía abre el panel sin ▾) |
| `alert` | jornada en curso con una incidencia alcanzada y sin resolver | glifo de la incidencia | «Fallo de tracción · Madrid — Badajoz» | botón «Decidir» → `open-incidents` | ocultos |
| `surge` | pico de demanda en los últimos 12 s | ⚡ | «Pico de demanda · Lleida» | botón «Ver ciudad» → `city` | ocultos |
| `urgent` | `U.nextAction(s).tone==='urgent'` (suceso, consejo, urnas en peligro, encargo a ≤ 3 turnos) | ! (oro) | la de `U.nextAction` | `tenfe-next` | visibles |
| `normal` | resto | ◎ | `U.nextAction(s).label` | `tenfe-next` | visibles |
| `ended` | mandato terminado | ★ | «Ver tu legado» | `tenfe-next` | visibles |

Desaparece `.alert-pill`. `showAlert()` ya no crea la píldora: guarda el pico (`surgeAlert`, 12 s) y repinta la franja; la incidencia se deduce del estado (`state.ops`). La narración de la alerta (`incident-alert` / `surge-alert`) **suena sin tarjeta** (la franja ya lo muestra), para no duplicar; con un cajón abierto tampoco sale el `toast` de texto de hoy («Incidencia: … Revisa Jornada para decidir.»): la franja y el punto de Red bastan.

**Qué hacer ahora.** La franja usa `U.nextAction(s)` (`tenfe.js:230`), que para partidas de Conexiones delega en `J.nextAction(s)` (`conexiones.js:205`). Las etiquetas no están grabadas. Se reescriben en imperativo, ≤ 48 caracteres, y cada resultado lleva `{label, action, rank, tone?, fold?, ...}`. `J.nextAction` implementa las filas que solo necesitan datos de Conexiones; `U.nextAction` (que ya importa `T` y tiene `E`) inserta las filas 4a y 4b según `rank` y devuelve la de menor rango:

| rank | Condición | Etiqueta | Acción | Dónde |
|---|---|---|---|---|
| 1 | `s.ended` | Ver tu legado | `navigate` progress | J |
| 2 | suceso pendiente (`s.tenfe.game.event`) | Decide el suceso del turno (`tone:'urgent'`) | `tycoon-tab` agenda | J |
| 3 | decisión del consejo pendiente | Escucha al consejo (`urgent`) | `tycoon-tab` agenda | J |
| 4 | encargo ofrecido | Elige un encargo | `tycoon-tab` agenda | J |
| 4a | urnas en ≤ 3 turnos (`max(1, J.electionMonth(s) − s.month) ≤ 3`) y `U.forecast(s) < 50` | Gana apoyo: urnas en N turnos (`urgent`) | `tycoon-tab` apoyo | U |
| 4b | encargo activo de proyecto con algún requisito sin cumplir (`T.contractDetails(s,q,q.branch,r=>E.metrics(s,r)).requirements.find(x=>!x.done)`) | según el requisito: `active` «Encargo: abre {ruta}», `frequency` «Encargo: más salidas en {ruta}», `fare` «Encargo: baja la tarifa de {ruta}», `station` «Encargo: mejora la estación de {ciudad}», `level` «Encargo: mejora el servicio {ruta}», `staff` «Encargo: forma maquinistas», `margin`/`networkMargin` «Encargo: mejora el margen de {ruta}», `occupancy` «Encargo: llena más plazas en {ruta}», `punctuality` «Encargo: más puntualidad en {ruta}»; `tone:'urgent'` si `q.until − s.month ≤ 3` | la del requisito (`route`/`city`/`tycoon-tab` con su `id`) | U |
| 5 | pacto de investigación sin progreso | Abre el laboratorio | `tycoon-tab` research | J |
| 6 | reto s2 pendiente y hay una relación rural cerrada | Abre {relación} | `route` id | J |
| 7 | reto s1 pendiente | Sube la puntualidad al 85 % | `navigate` ops, `fold:'ops-settings'` | J |
| 8 | reto s3 pendiente | Logra margen positivo | `navigate` finance, `fold:'fin-account'` | J |
| 9 | reto s4 pendiente | Cumple un acuerdo | `tycoon-tab` pactos | J |
| 10 | reto s5 pendiente | Pon en marcha un megaproyecto | `progress-tab` proyectos | J |
| 11 | retos completos, mandatos < 2 | Gana las elecciones | `tycoon-tab` apoyo | J |
| 12 | resto | Revisa tu red | `navigate` network | J |

`{ruta}` es el nombre corto de la relación (`E.routeName`); si la etiqueta pasa de 48 caracteres se corta con elipsis en pantalla, pero `label` se devuelve completa. El manejador `tenfe-next` (`app.js:1511`) acepta además `action:'progress-tab'` (`ui.progressTab=id; screen='progress'`), `action:'city'` (como `case 'city'`) y, si el resultado trae `fold`, hace `ui.details.add(fold)` antes de pintar, para que el jugador caiga justo en el control que importa.

**Panel de objetivo** (desplegable de un nivel, z 40; escritorio: centrado bajo la franja, ancho 380 px, alto máximo = área principal − `--msg-zone`; teléfono: ancho completo bajo la franja, alto máximo hasta `--safe-bottom` + `--guide-h`):

```
┌ Retos del mandato ───────────────────────┐
│ ✓ Puntualidad del 85 %            87 %  │
│ ○ 2 conexiones rurales nuevas      0/2  │
│ ○ 3 turnos con margen positivo     1/3  │
│ ○ Cumple 2 acuerdos                0/2  │
│ ○ Un megaproyecto en servicio  fase 1/4 │
│ ─────────────────────────────────────── │
│ Elecciones en 11 turnos · mandatos 0/2  │
│ Encargo: Madrid — Alicante   23 turnos ›│  (fila entera = botón → Agenda; solo si hay encargo activo)
│ Siguiente jugada: Escucha al consejo    │  (solo durante la guía, texto sin botón)
│ [Retomar la guía]                       │  (solo con la guía en pausa)
└──────────────────────────────────────────┘
```

- Cada fila de reto: icono de estado, requisito corto (`GOAL_LABEL`), progreso alineado a la derecha; el nombre poético del reto va en `title` y en Progreso → Mandato (donde también se lee al tocar). Las filas de reto no son botones.
- «Siguiente jugada» solo aparece durante la guía (la frase grabada del paso 1 habla de «una propuesta para tu siguiente jugada»), en gris y sin botón, para no competir con el botón de la guía.
- Se cierra con clic fuera, Esc o volviendo a pulsar ▾ (fuera de la guía). Su estado (`objectiveOpen`) sobrevive a los repintados.
- Encargo → `tycoon-tab` agenda; «Retomar la guía» → `tutorial-start`.

**API nueva en `conexiones.js`** (paquete A; la usa también B en Progreso → Mandato):

```js
export const GOAL_LABEL = {s1:'Puntualidad del 85 %', s2:'2 conexiones rurales nuevas', s3:'3 turnos con margen positivo', s4:'Cumple 2 acuerdos', s5:'Un megaproyecto en servicio'};
// goals(s) → {retos:[{id,name,label,done,value,target,unit,reward}], done, mandates:{won,target:2,turnsToVote}}
//  s1: value = round(E.balance(s).punctuality), target 85, unit '%'
//  s2: value = clamp(rural(s).length − s.tenfe.ruralBase, 0, 2), target 2
//  s3: value = min(s.tenfe.game.profit, 3), target 3
//  s4: value = min(pactos ganados + s.tycoon.completed, 2), target 2
//  s5: value = máxima fase de los megaproyectos (sin 'monumento'), target 4, unit 'fase'
//  done = g.challenges.includes(id); turnsToVote = max(1, electionMonth(s) − s.month)
```

### 2.8 Mapa y controles

- **«Capas ▾»**: se mantiene `details.map-layers` con sus 6 `button[data-layer]` estáticos (sus manejadores se enlazan una sola vez en `app.js:1700` y no se pueden volver a pintar). Elegir una capa cierra el desplegable (como hoy). Con una capa distinta de «Tu red», el resumen dice su nombre («Anchos ▾»).
- **Leyenda**: `#legend` se mueve **dentro** de `details.map-layers`, debajo de los botones: la leyenda completa de la capa activa, sin frases de ayuda («Pulsa una ciudad», «Pulsa un tramo…» fuera). Con una capa técnica (Anchos, Electrificación, Velocidad, Obras) se ve además `#legendMini` **debajo** del desplegable, dentro de `.map-tools`: las 3–4 primeras muestras de esa misma lista, sin texto extra. Con «Tu red» u «Horario real» no hay `#legendMini`. `renderLegend()` pinta los dos.
- **⌂** (`#resetMap`) se mantiene. **Se quitan + y −** (`#zoomIn`, `#zoomOut`): rueda, pellizco y teclas +/− siguen funcionando. Sus manejadores (`app.js:1701–1702`) se eliminan.
- En escritorio `.map-tools` es una columna (Capas ▾, ⌂, leyenda mini); en teléfono, una fila de 44 px (§2.3).
- La pista flotante del mapa al pasar el ratón (`drawHover`) se queda: no ocupa sitio.

### 2.9 Banda inferior

**Navegación (`#navigation`)**: 6 entradas, icono encima y una palabra debajo (en apaisado bajo, solo icono).

| Entrada | `data-*` | Punto de aviso |
|---|---|---|
| Red | `navigate` network | incidencias alcanzadas sin resolver |
| Flota | `navigate` fleet | — |
| Dinero | `navigate` finance | — |
| Despacho | `navigate` story | `directionCount(state) > 0`, suceso o decisión del consejo pendiente |
| Progreso | `navigate` progress | — |
| Menú | `menu-open` (nuevo) | — |

- El aviso es un **punto** dorado de 8 px en la esquina del icono, **sin número** (el número no decide nada; el recuento va en el `aria-label`: «Despacho, 2 asuntos pendientes»). Nunca sustituye a la etiqueta (hoy pasa en teléfono).
- **Prensa desaparece de la navegación**: pasa a Progreso → Noticias (`ALIASES.press = ['progress','progressTab','news']`, `ALIASES.archive = ['progress','progressTab','news']`).
- **Popover de Menú** (`#menu-pop`, dentro de `#navigation`, se abre hacia arriba desde «Menú», ancho 220 px; siempre está en el DOM y se muestra con `hidden=false`): Guardar (`save-dialog`), Ayuda (`help`), Sonido (`music`, con `id="musicBtn"`: lo pulsa `audio-salida-ui-test.mjs` tras abrir Menú), Salir al menú (`menu-home`). Desaparecen los cuatro iconos sueltos (música, guardar, ayuda, menú). `renderMusicButton()` deja de reescribir el contenido de `#musicBtn` (la etiqueta es siempre «Sonido») y sigue actualizando los botones del diálogo. Al abrirlo, el foco va a «Guardar»; flechas arriba/abajo recorren las entradas; Esc lo cierra y devuelve el foco a «Menú».

**Barra de turno (`#daybar`)** — conserva el id y `renderDaybar()` (ojo: esta función se ejecuta en una vm en `observer-runtime-test.mjs`, §7.A):

| Fase | Contenido |
|---|---|
| preparación | `[▶ Comienza la jornada]` (secundario, `day-start`) · `[Cerrar turno]` (principal, `skip-month`, con el `title` de `delegationHint`) |
| jornada en curso | reloj «07:45» (`#clock`) · línea de tiempo (solo con viewport ≥ 1200 px) · `1× 3× 10× 30×` (con viewport < 1100 px, en apaisado bajo y en teléfono: un solo botón que rota, `speed` con `data-id` del siguiente índice; `renderDaybar` pinta los dos y el CSS muestra uno con media queries, nunca con `innerWidth`) · `❚❚/▶` (`play`) · `[Hasta el último tren]` (principal, `day-end`) |
| jornada cerrada | `[Ver parte del día]` (principal, `day-review`) · `[Cerrar turno]` (secundario) |
| observación (capa real) | «Observación del horario real» · tipo de día · línea de tiempo · velocidades · `▶` (sin `day-*` ni `skip-month`, como exige la prueba) |

Fuera: rótulo de fase («Preparación», «Jornada en curso»), «06:30 → 02:11 +1», «28 circulaciones · 0 en autobús», el ▶ fuera de la jornada. Durante la guía, «Cerrar turno» se ve apagado (`body.guided-turn #daybar [data-action="skip-month"]{opacity:.4;pointer-events:none}`); el aviso grabado de la guía sigue saliendo por teclado/otros caminos.

### 2.10 Avisos: dónde va cada cosa

| Tipo | Dónde | Cómo |
|---|---|---|
| Algo que hay que hacer ahora (suceso, consejo, incidencia, pico, urnas en peligro, encargo a punto de vencer) | Franja de objetivo | estados `urgent`, `alert`, `surge` |
| Algo pendiente en una sección | Punto en su entrada de navegación | Red, Despacho |
| Voz de un personaje (narración) | Bandeja de mensajes | **uno visible**; cola de 3 como máximo; historial en Progreso → Noticias → Mensajes |
| Errores («Necesitas 4 M€…») | Bandeja de mensajes | igual que una narración (son mensajes grabados); en la ficha de relación, además, el motivo en rojo en la previsión (como hoy) |
| Mensajes con un diálogo abierto | Dentro del diálogo, justo antes de `.actions` | `modal-toast` como hoy, pero insertado antes del pie fijo (hoy se añade al final de `.content`, debajo de los botones) |

**Tarjeta de mensaje** (`#toast .narration-toast`, sin cambiar el marcado de `card()` que leen las pruebas):

```
┌──────────────────────────────────────────┐
│ [▣] Raquel Sanz                 +2  ▷  × │  retrato 32×38, nombre, «+2» en cola, escuchar, cerrar
│ Hemos cumplido otro objetivo del mandato.│  texto grabado, 3 líneas como máximo (completo al
│ Revisa el premio y el siguiente reto…    │  pasar el ratón, al enfocar, al tocar o mientras habla)
│ Objetivo cumplido · +25 M€               │  detalle en una línea, solo si trae una cifra
└──────────────────────────────────────────┘
```

Reglas de la bandeja (paquete A, `narration-runtime.js` + `narration.css`):

- **Una visible**: solo se ve el primer hijo de `#toast` (`#toast .narration-toast:not(:first-child){display:none}`).
- **Una nueva tarjeta pasa delante** (`prepend`) si la visible ya no habla (terminó su voz, no tiene voz o las voces están silenciadas): la anterior se retira y queda en el historial. **Si la visible está hablando, la nueva espera** detrás. Al empezar a hablar una tarjeta en espera, se pasa al principio, así texto y voz coinciden siempre.
- **Cola de 3**: si ya esperan 3, la más antigua en espera se retira sin mostrarse (su voz se cancela) y queda en el historial.
- **Caducidad**: 4,2 s tras terminar su voz, o 6 s si no tiene voz o están silenciadas; cuenta desde que la tarjeta **se muestra**, no desde que se crea. Pasar el ratón o el foco por la tarjeta detiene la cuenta.
- «+N» (`span.narration-more` en la cabecera de la tarjeta visible) dice cuántas esperan; sin cola no se pinta.
- Ocultos en la tarjeta: cargo del personaje (`small`), la etiqueta «Detalle», la palabra «Escuchar» (queda el ▷ con su `aria-label`). El detalle solo se ve si contiene una cifra (`has-figure`).
- Con un desplegable abierto (`body.ui-pop`) o un diálogo abierto, la bandeja se oculta; la cuenta de caducidad sigue y lo que caduque queda en el historial.
- `narrator.log` ya guarda cada mensaje: alimenta el historial (Progreso → Noticias → Mensajes).

### 2.11 Bienvenida (`#entry-welcome`)

- Contenido: imagen (solo escritorio, 120 px de alto), la cabecera de narración (`N.header`: retrato, nombre, ▷), el texto grabado y el botón «Vamos a dirigir →» / «Volver a mi red →» (`welcome-close`). **Fuera** el antetítulo («Bienvenido a Conexiones» / «Turno N») y el titular «Un país por conectar.» / «De nuevo al mando.»: repiten lo que dice la voz. El `aria-label` de la sección se queda.
- Escritorio y apaisado: arriba en el centro (top = `safe-top`), ancho `min(400px, 100vw − 2g)`. Teléfono: ancho completo bajo la franja, sin imagen.
- Mientras se ve, la franja de objetivo hace un pulso suave (CSS de A: `body:has(#entry-welcome) #mission{animation:obj-attn 1.5s 2}`; nada con `prefers-reduced-motion`): la frase grabada habla del objetivo y de «tu primera jugada».

### 2.12 Teclado, cierre y foco

| Entrada | Efecto | Dueño |
|---|---|---|
| Esc con un campo enfocado | quita el foco (como hoy) | A |
| Esc con un diálogo abierto | lo cierra salvo decisión pendiente o partida sin empezar (como hoy, manejador del `dialog`) | — |
| Esc con un desplegable abierto (panel de objetivo fuera del paso 1 de la guía, Menú, Capas) | cierra ese desplegable y nada más, **también durante la guía** | A |
| Esc durante la guía (sin desplegable) | pausa la guía (como hoy) | A (línea `if(tut)…` del `keydown`, precedida por el cierre de desplegables) |
| Esc con ficha o cajón | los cierra (como hoy) | A |
| Esc sin nada abierto | abre/cierra el Menú (como la pausa de un juego) | A |
| 1–5 | abren Red, Flota, Dinero, Despacho, Progreso (6 deja de hacer nada) | A |
| T | Flota → Trenes Pop (como hoy) | A |
| Espacio | con la red en preparación, comienza la jornada; en jornada, pausa/reanuda (como hoy) | A |
| + / − | acercar / alejar el mapa (como hoy) | A |
| Clic fuera de un desplegable | lo cierra sin consumir el clic | A |
| La entrada de navegación de la sección abierta | cierra el cajón (como hoy) | A |
| Clic en el mapa vacío | cierra la ficha (como hoy) y retira la bienvenida | C (`pick`) |
| × de cajón, ficha, mensaje, diálogo | cierra | B (marcado), A (mensaje) |

Foco: al abrir un cajón o una ficha por teclado, el foco va a su `×`; al cerrarlos, vuelve a la entrada de navegación o al mapa. Al cambiar de paso, la guía enfoca `#coach` (`tabindex="-1"`, sin desplazar); cuando aparece el botón siguiente no roba el foco (el jugador puede estar escribiendo la tarifa). La Ayuda resume las teclas en un plegable «Teclas» (§3.5).

## 3. Inventario: decisión elemento a elemento

Leyenda: **FIJO** = siempre visible; **CTX** = solo en su contexto; **MENÚ → dónde**; **FUERA** = se elimina.

### 3.1 Capa base

| Elemento hoy | Decisión | Detalle |
|---|---|---|
| Logo + «Iberia Ferroviaria» + «Conexiones · al mando de Tenfe» | FUERA | la marca está en la portada |
| «Turno N · tu red en marcha» | FIJO «Turno N» | |
| «12 turnos hasta las urnas» | MENÚ → panel de objetivo y Despacho → Apoyo · CTX → franja «Gana apoyo: urnas en N turnos» si faltan ≤ 3 y el apoyo es < 50 | sin pastilla en la barra |
| Sol + reloj 06:30 | CTX → barra de turno durante la jornada | |
| Caja | FIJO | |
| Resultado / turno | FIJO fusionado con Caja («▼3,0») | etiqueta larga fuera |
| Apoyo % | FIJO | |
| Puntualidad % | MENÚ → panel de objetivo (reto 1), Red → Jornada (fold), parte del día | |
| Trenes libres | MENÚ → Flota → Mi parque y selector de material de la ficha | |
| Navegación de 6 secciones | FIJO 5 secciones + Menú | Prensa → Progreso → Noticias |
| Insignias con número (Red, Despacho) | FIJO como punto sin número | el recuento, en `aria-label` |
| Música, Guardar, Ayuda, Menú (4 iconos) | MENÚ → popover «Menú» | |
| «Capas ▾» | FIJO | nunca tapado |
| Zoom + y − | FUERA | rueda, pellizco, teclas |
| ⌂ | FIJO | |
| Panel de misión: antetítulo «Conexiones · turno N» | FUERA | |
| Panel de misión: «Un país por conectar» | FUERA | |
| Panel de misión: «0/5 retos · 0/2 mandatos» | FIJO como 5 puntos en la franja; cifras en el panel de objetivo | |
| Panel de misión: 5 retos con ○ y ✓ | MENÚ → panel de objetivo (requisito + progreso) y Progreso → Mandato | |
| Panel de misión: frase «Tu red, tus tarifas…» | FUERA | |
| Panel de misión: «En marcha: … 0/3 · 24 meses» | MENÚ → panel de objetivo (una fila pulsable) y Despacho → Agenda · CTX → franja «Encargo: …» mientras le falte un requisito | |
| Panel de misión: «Siguiente: [acción]» | **FIJO: es la franja de objetivo** | |
| Panel de misión: peticiones de ciudad | MENÚ → Despacho → Agenda («Peticiones») y pin «!» del mapa | |
| Leyenda | MENÚ → dentro de Capas (`#legend`); CTX → `#legendMini` bajo Capas en capas técnicas | sin «Pulsa una ciudad» |
| Barra de jornada: «Preparación» | FUERA | |
| «06:30 → 02:11 +1» | MENÚ → Red → Jornada (fold «Jornada») | |
| «28 circulaciones · 0 en autobús» | MENÚ → Red → Jornada (fold) | |
| Línea de tiempo | CTX jornada en curso (viewport ≥ 1200 px) | |
| 1×/3×/10×/30× y ▶ | CTX jornada en curso | ▶ fuera en preparación |
| «Comienza la jornada» | FIJO secundario | |
| «Cerrar turno» | FIJO principal | único verbo para avanzar |
| Mensajes narrados apilados | FIJO uno cada vez (§2.10) | |
| Píldora de incidencia / pico | FUERA → estados de la franja | |

### 3.2 Guía y bienvenida

| Elemento | Decisión |
|---|---|
| Retrato, nombre, ▷ | se quedan |
| «Tu primer turno» / «Guía · N / 9» | 9 puntos de progreso bajo el nombre del personaje (`aria-label="Paso N de 9"`); la palabra «Guía» está en la franja |
| × (pausar) | botón «⏸ Pausar» (`tutorial-skip`) |
| Título (h2) | se queda igual |
| Texto grabado | igual, intocable |
| «Listo para seguir» / «Hazlo en el panel marcado» | FUERA. La instrucción corta vive solo en la franja («Guía · …»); el coach no la repite |
| Botón siguiente | solo aparece cuando el paso está listo, con un pulso suave; mientras no lo está no se pinta (un botón apagado con otra acción, como «Elegir mi primer encargo» durante toda la jornada, confunde) |
| Sombras con desenfoque sobre todo | oscurecido del fondo **sin desenfoque**; participantes nítidos (§5.2) |
| Anillo alrededor del panel entero | anillo sobre el **control** del paso; el hueco descubre el panel |
| Bienvenida sobre el panel de misión | arriba en el centro; no tapa nada (§2.11) |
| Bienvenida: antetítulo y titular | FUERA (la voz ya lo dice) |
| Controles del mapa durante la guía | ocultos (el mapa está inerte) |

### 3.3 Fichas (`#inspector`)

| Ficha · elemento | Decisión |
|---|---|
| Relación: antetítulo «Relación en servicio» | FUERA (el estado va en Detalles) |
| Relación: título con chip AVE/Alvia | se queda (cabecera) |
| Relación: estado, horario oficial, longitud, trayecto, pico | MENÚ → fold «Detalles» |
| Relación: «Qué puede circular» (3 tarjetas) | MENÚ → «Detalles», una línea por tipo con ✓/✗ y el motivo |
| Relación: histograma | MENÚ → «Detalles» |
| Relación: **Plan de servicio** | **arriba del todo**, sin desplazar |
| Relación: previsión (8 cifras) | 2 cifras: «+0,3 M€/turno · necesita 2 trenes»; si no se puede, el motivo en rojo en su lugar («Faltan 2 trenes libres…», con «Compra uno que sí»). Los libres ya se leen en el selector de material |
| Relación: opción del selector «S103 · AVE Velaro · 6 libres · 78 %» | «AVE Velaro · 6 libres»; el estado solo si está por debajo del 50 % («· gastado»); las opciones incompatibles siguen apagadas con su motivo |
| Relación: «Salidas por sentido: 2 de 12» | etiqueta «Salidas por sentido» y el número actual junto al deslizador; el máximo lo dice el propio deslizador |
| Relación: «Mejorar servicio · 12 M€ / Nivel 0/3» | MENÚ → fold «Mejorar» |
| Relación: frente a la carretera, viajeros, ocupación, resultado | MENÚ → «Detalles» |
| Relación: «Ver sus trenes» | MENÚ → «Detalles» |
| Relación: «Encuadrar» | FUERA (el mapa ya se centra) |
| Ciudad: cabecera ilustrada con habitantes y 3 cifras | FUERA la ilustración grande; habitantes y cifras → fold «Datos» |
| Ciudad: peticiones, incidencias, picos | arriba, una fila cada una con su botón |
| Ciudad: conexiones con − / + | se quedan como filas con selector numérico «− 3 +» (chip, destino, −, salidas, +) sin tarjeta; «Detalles» por fila FUERA (el nombre abre la relación); relaciones cerradas: «Abrir» (`open-route`) en lugar del selector |
| Ciudad: estación y próximas salidas | MENÚ → folds «Estación» y «Salidas» |
| Tramo: foto | se queda, 120 px |
| Tramo: ancho, tensión, velocidad | una línea («Ibérico · 3 kV · 160 km/h») |
| Tramo: «Diseñar mejora de vía» | botón principal |
| Tramo: obras posibles | MENÚ → fold «Obras» |
| Tren, estación, obra, nodo | misma cabecera; lo esencial arriba, lo demás en «Detalles» |

### 3.4 Cajón de secciones (`#drawer`)

| Sección → pestaña | Decisión |
|---|---|
| Todas: antetítulo + subtítulo de cabecera | FUERA |
| Todas: pestañas pegajosas dentro del desplazamiento | las pestañas pasan a la cabecera fija (fuera del scroll) |
| Red → Servicios: fila interior Todas/AVE/Alvia/Sin tren | → desplegable «Tipo» en la barra de filtros |
| Red → Servicios: «98 relaciones · pulsa un nombre…» | FUERA |
| Red → Servicios: columnas km, Trenes / día (vacía), Viajeros / mes; chips AVE/ALVIA/HÍBRIDO; «En servicio · 3/12 por sentido» | FUERA; quedan tres columnas sin cabecera de tabla: chip + relación, salidas («3 salidas», «Por abrir» o «Suspendida») y resultado («+1,9 M€» o «—») |
| Red → Jornada: 5 cifras de cabecera | FUERA; reloj y ventana en fold «Jornada» |
| Red → Jornada: aviso «Delegar mes…» | FUERA |
| Red → Jornada: incidencias con respuestas | arriba |
| Red → Jornada: prioridad y pausa ante incidencias | fold «Ajustes» |
| Red → Jornada: próximas salidas | fold «Próximas salidas» |
| Red → Obras: 4 subpestañas + 3 botones de capa | → desplegable «Vista»; botones de capa FUERA (están en Capas) |
| Red → Horarios: tipo de día con recuentos + 4 cifras | → desplegable «Día» sin recuentos; cifras FUERA |
| Red → Competencia | se queda sin párrafo de introducción |
| Flota → Mi parque: 4 cifras | FUERA; filas con miniatura, modelo, «6 de 12 libres» y estado en palabra («Bien» ≥ 60 %, «Gastado» 30–59 %, «Necesita reforma» < 30 %, «En taller»); el porcentaje exacto, en la ficha del lote |
| Flota → Reformas | se queda; comparador vacío sin foto FUERA |
| Flota → Trenes Pop | se queda (mundo propio) respetando las zonas |
| Flota → Pedidos | se queda |
| Dinero: 4 cifras que repiten el HUD | FUERA; «mes» → «turno» |
| Dinero: cuenta, gráfico, préstamos, mantenimiento, previsión | gráfico arriba; el resto en folds |
| Despacho → Agenda: banner «Un plan para el próximo mes» + 3 cifras | FUERA |
| Despacho → Agenda: «Elige el ritmo de tu gestión» + «Delegar mes» | FUERA |
| Despacho → Agenda: «Próximos pasos» | FUERA (lo hace la franja de objetivo) |
| Despacho → Agenda: «El equilibrio del consejo» | MENÚ → Despacho → Apoyo |
| Despacho → Agenda: orden | decisión → suceso → encargos → peticiones de ciudad → historial (fold) |
| Despacho → Políticas | pestaña «Personal» (id `people`) |
| Despacho → Apoyo | encuesta («54 %»), «Elecciones en N turnos», grupos como barras sin cifra (la confianza exacta en la ficha del grupo o en `title`, nunca solo ahí: la barra ya lo dice) y «Negociar · 8 M€» por grupo |
| Progreso → Mandato: 5 tarjetas con foto grande + «Cómo se juega» | filas con miniatura 64 px, requisito, progreso y premio; «Cómo se juega» → Ayuda |
| Progreso → Hitos, Investigación, Megaproyectos | fotos de 96 px para que el botón de cada fila se vea |
| Prensa → Gaceta, Diario, Informes | Progreso → Noticias con desplegable «Vista»: Gaceta · Diario · Informes · Mensajes |

### 3.5 Diálogos

| Diálogo | Decisión |
|---|---|
| Parte del día | h1 «Parte del día», sin fecha ni antetítulo (hoy «Parte de la jornada · mar, 1 feb 2022» y un h1 que repite la frase grabada); anillo de puntualidad + «Resultado del día −0,1 M€» + «Incidencias resueltas: 1 de 2» (la línea no sale si no hubo incidencias); tabla → fold «Detalles de la jornada»; aviso «La caja se actualiza al cerrar el mes» FUERA; pie fijo [Siguiente jornada] [Volver al mapa] |
| Decisión del consejo (diálogo y Agenda) | antetítulo «Consejo de dirección · decisión pendiente» FUERA; texto «Escuchar diálogo» bajo el botón FUERA (queda ▷ con `aria-label`) |
| Suceso ilustrado | imagen de 160 px de alto como máximo para que las opciones se vean |
| Trenes Pop: ficha de compra | pie fijo con «Firmar pedido» |
| Lote de flota | botones visibles sin la vista 3D por encima (vista 3D bajo los botones o plegada) |
| Reforma | comparador oculto si no hay foto; pie fijo con «Confirmar reforma» |
| Taller de vías | imagen comparada con los 3 selectores al lado (escritorio) o debajo (teléfono); «Ilustración de la configuración…» FUERA; pie fijo con «Adjudicar mejora» |
| Guardar | texto de una línea |
| Ayuda | reescrita para Conexiones con el texto fijado en §4.4 (≤ 80 palabras), plegable «Teclas», conserva `<ol class="method">`, «Trenes Pop» en el texto, la línea de créditos y el botón «Retomar primer turno»/«Hacer el turno guiado»/«Consultar la guía» (`tutorial-start`) |
| Música | «Sonido», con la disposición de «Opciones» de la portada (que conserva su título): título «Sonido», sin antetítulo; volúmenes de música, voces y efectos arriba; «Banda sonora» plegada (`details.menu-music-library`) con la lista de pistas sin pulsaciones por minuto; conserva `#musicVolume`, `#voiceVolume`, `#sfxVolume`, `#musicMode`, `.tracks`, `music-toggle`, `music-next`, `music-play`, `voice-toggle`, `sfx-toggle`, `audio-reset` y `close-modal` |
| Tarjeta narrada que `narrator.modal()` añade tras el h1 | compacta (retrato 28, sin cargo) y **omitida durante la guía** |

### 3.6 Cifras que se ocultan (resumen)

Puntualidad y trenes libres del HUD · toda cuenta atrás de urnas en la barra superior · reloj fuera de la jornada · números de las insignias (→ punto) · «0/5 · 0/2» (→ puntos) · «+19 M€» de peticiones en la capa base · ventana horaria y circulaciones de la barra · horas pintadas de la línea de tiempo fuera de la jornada · km, trenes/día, viajeros/mes y «/12» por fila en Red · 5 cifras de Jornada · 4 de Horarios · 4 de Mi parque y el porcentaje de estado por fila · 4 de Dinero · 3 del banner de Agenda · confianza numérica de los grupos · código de serie y estado (%) en el selector de material · «de 12» de las salidas · horario oficial, longitud, trayecto, pico, tiempos de las 3 tarjetas, histograma, cuotas, viajeros, ocupación y trenes libres repetidos en la ficha de relación · habitantes y 3 cifras de la ficha de ciudad · fecha del parte · circulaciones, tren-km, viajeros, primera/última, retrasos y línea con más trenes del parte (→ «Detalles de la jornada») · pulsaciones por minuto de la música.

### 3.7 Textos que se quitan (para la prueba de presupuesto)

«Iberia Ferroviaria», «al mando de Tenfe», «tu red en marcha», «turnos hasta las urnas» (en la barra superior), «Un país por conectar» (en la capa base y en la bienvenida), «Bienvenido a Conexiones», «De nuevo al mando», «Tu red, tus tarifas y tus decisiones…», «Pulsa una ciudad», «Pulsa un tramo», «Listo para seguir», «Hazlo en el panel marcado», «Tu primer turno», «Escuchar diálogo», «Detalle», «Un plan para el próximo mes.», «Elige el ritmo de tu gestión», «Próximos pasos», «Delegar mes», «La caja se actualiza al cerrar el mes.», «Ilustración de la configuración», «Cinco retos, una compañía» + «Cómo se juega» en Progreso, «Parte de la jornada ·», todos los antetítulos de cajón, ficha, diálogo y bienvenida, la ayuda antigua («Un día, un turno», «capítulos»), «Música de Iberia Ferroviaria», «/mes» y «mensual» en etiquetas de UI.

## 4. Menús y paneles

### 4.1 Reglas comunes

1. **Cabecera de una línea** (48 px): título (≤ 3 palabras) + `×` (`--tap` de lado: 36 px, 44 en teléfono). Cajón: `<header><h1>Red</h1><button class="close" data-action="close-drawer" aria-label="Cerrar">×</button></header>`; ficha: igual con `close-inspector` y el chip de la relación delante del título.
2. **Pestañas** (≤ 5, ≤ 2 palabras) en la cabecera, debajo del título, **fuera del desplazamiento**. Nunca dos filas de pestañas. En teléfono, la fila mide 44 px y se desplaza en horizontal si no cabe (sin cortar palabras).
3. **Un solo nivel de desplegable**: filtros como `<select>` en una barra de filtros (búsqueda + 1–2 selects + 1 botón); información secundaria como `<details class="fold" data-key="…">` con un resumen de 1–2 palabras y, si acaso, una cifra alineada a la derecha. Un fold no contiene otro fold ni pestañas. Todos los folds empiezan cerrados salvo que su clave esté en `ui.details`; las claves son las de §4.6.
4. **Sin tarjetas dentro**: filas separadas por `1px solid var(--rule)`; nada de fondo o borde por bloque (salvo fotos y fichas de Trenes Pop).
5. **Solo el cuerpo se desplaza** (`.body`); la cabecera y las pestañas no. En la ficha, la cabecera no sale nunca de la pantalla.
6. **Cierre**: `×`, Esc, la misma entrada de navegación, otra entrada, clic en el mapa vacío (fichas).
7. **Estados vacíos**: una línea, con el texto exacto de §4.5; si la sección vacía es un bloque dentro de una pestaña (Peticiones, Encargos, Historial), el bloque entero desaparece.
8. **Diálogos**: `max-height: calc(100dvh − 32px)`; `.content` se desplaza; `.actions` es un pie fijo (`position:sticky; bottom:0` con fondo); botón principal a la izquierda. El botón principal se ve sin desplazar en 1440×900, 1280×720, 844×390, 390×844 y 320×640. Sin antetítulo (`.kicker`) en ningún diálogo de la partida.
9. **Folds que sobreviven al repintado**: `fold(key, label, html)` (paquete A) pinta `<details class="fold" data-key="${key}" ${ui.details.has(key)?'open':''}>`; un manejador de clic en `summary` guarda el estado en `ui.details` y suena (`toggleOn`/`toggleOff`). Todo `<summary>` tiene sonido.

### 4.2 Mapa de navegación

| Navegación | Pestañas (≤ 5) | Filtros (1 nivel) |
|---|---|---|
| Red | Servicios · Jornada · Obras · Horarios · Competencia | Servicios: Buscar ciudad · Tipo (Todas / AVE / Alvia / Sin tren) · Estado · [+ Relación nueva]; Obras: Vista (Vías y catenaria / Cambiadores / Proyectos / En marcha); Horarios: Día (Laborable / Sábado / Domingo) · Buscar estación |
| Flota | Mi parque · Reformas · Trenes Pop · Pedidos | Reformas: Taller / Catálogo (los dos botones `refit-view` de hoy); Trenes Pop: sus filtros |
| Dinero | — | folds: Cuenta del turno · Préstamos · Mantenimiento · Previsión |
| Despacho | Agenda · Apoyo · Pactos · Personal · Cloacas | — |
| Progreso | Mandato · Hitos · Investigación · Megaproyectos · Noticias | Noticias: Vista (Gaceta / Diario / Informes / Mensajes) |
| Menú (popover) | Guardar · Ayuda · Sonido · Salir al menú | — |

Los `data-action` y ids que usan las pruebas se conservan: `net-view` (routes, ops, works, timetables, rivals), `fleet-tab` (fleet, refits, market, orders), `tycoon-tab` (agenda, apoyo, pactos, people, cloacas, research, market, paper), `progress-tab` (campaign, hitos, research, proyectos y el nuevo `news`), `refit-view`, `market-family`, `#drawer [data-action="route"][data-id="madrid-valencia"]`, `#drawer [data-action="respond"]`, `.desk-decision [data-action="decision"]`, `tycoon-public`, `.game-research article` (18), `.game-megas article` (6), `tenfe-mega`, `tenfe-pact`. Los botones `route-tab`, `works-tab`, `tt-type` y `press-tab` dejan de pintarse (sus `case` y sus recetas de sonido se quedan); los selects nuevos se manejan en el `change` del documento (que ya suena para cualquier `<select>`).

### 4.3 Bocetos de los paneles más cargados

**Red → Servicios (escritorio, cajón 640 px)**

```
┌ Red                                                         × ┐
│ SERVICIOS  JORNADA  OBRAS  HORARIOS  COMPETENCIA              │
├───────────────────────────────────────────────────────────────┤
│ [Buscar ciudad……………]  [Todas ▾] [Cualquier estado ▾] [Relación nueva] │
│ ───────────────────────────────────────────────────────────── │
│ AVE  Madrid — Barcelona              3 salidas      +1,9 M€   │
│ AVE  Madrid — Sevilla                3 salidas      +0,9 M€   │
│ AVE  Madrid — València               3 salidas      +0,3 M€   │
│ ALV  Madrid — Badajoz                2 salidas      +0,4 M€   │
│ ALV  León — Gijón                    Por abrir         —      │
│ …                                                             │
└───────────────────────────────────────────────────────────────┘
```

Fila entera pulsable (`data-action="route"` en el nombre, como hoy, y el resto de la fila reenvía el clic). Sin cabecera de tabla, sin pista de desplazamiento.

**Red → Jornada (jornada en curso)**

```
┌ Red                                                         × ┐
│ SERVICIOS  JORNADA  OBRAS  HORARIOS  COMPETENCIA              │
├───────────────────────────────────────────────────────────────┤
│ ⚙ Fallo de tracción · Madrid — Badajoz              Pendiente │
│ [Movilizar equipo · 18 mil €] [Plan por carretera · 9 mil €]  │
│ [Esperar la resolución ordinaria]                             │
│ ───────────────────────────────────────────────────────────── │
│ ▸ Jornada                                              96 %   │  (puntualidad; dentro: reloj, en circulación, programadas, primera/última)
│ ▸ Ajustes                                                     │  (#dayPriority, #autoPause)
│ ▸ Próximas salidas                                            │
└───────────────────────────────────────────────────────────────┘
```

Sin jornada en curso y sin incidencias, la pestaña muestra solo los tres plegables. Las etiquetas de respuesta vienen del motor; se acortan solo si no están grabadas.

**Despacho → Agenda**

```
┌ Despacho                                                    × ┐
│ AGENDA  APOYO  PACTOS  PERSONAL  CLOACAS                      │
├───────────────────────────────────────────────────────────────┤
│ [▣] Pedro Sancho                                          ▷   │  decisión del consejo (si la hay)
│ Título de la decisión                                         │
│ Texto grabado de la decisión…                                 │
│ [Opción 1 — detalle]                                          │
│ [Opción 2 — detalle]                                          │
│ ───────────────────────────────────────────────────────────── │
│ [foto ≤160 px]  El cobre se va de excursión                   │  suceso (si lo hay; título grabado)
│ Benito Balasto ▷  texto grabado…   [opción] [opción]          │
│ ───────────────────────────────────────────────────────────── │
│ Encargos                                                      │
│ [▣] Poner el corredor en marcha            Decide en 12 turnos│
│ «Que OuiOui venda billetes…» ▷                                │
│ Servicio público   Premio 30 M€   [Aceptar servicio público]  │  ← .contract-branches
│ Apuesta comercial  Premio 26 M€   [Aceptar apuesta comercial] │
│ ▸ Condiciones                                                 │
│ ───────────────────────────────────────────────────────────── │
│ Peticiones de ciudad                                          │
│ Lleida                                           +19 M€   ›   │  (fila = botón `city`)
│ ▸ Historial del mandato                                       │
└───────────────────────────────────────────────────────────────┘
```

Agenda sin nada pendiente: «Nada pendiente. Cierra el turno cuando quieras.» y, debajo, el plegable del historial.

**Ficha de relación**

```
┌ AVE  Madrid — València                     × ┐
│ Plan de servicio                              │
│ Material   [AVE Velaro · 6 libres ▾]          │
│ Salidas por sentido   ●──────○──────    3     │
│ Tarifa     [ 45 ] €                           │
│ Previsión  +0,3 M€/turno · necesita 2 trenes  │
│ [Aplicar plan]  [Suspender]                   │
│ ───────────────────────────────────────────── │
│ ▸ Detalles                                    │
│ ▸ Mejorar                             12 M€   │
└───────────────────────────────────────────────┘
```

Relación cerrada: el mismo formulario con «Abrir servicio · 4 M€» en lugar de «Aplicar plan» y sin «Suspender».

**Ficha de ciudad (teléfono, media hoja)**

```
┌ Madrid                                    × ┐  ← cabecera fija, nunca fuera de pantalla
│ ! Petición: más salidas a Lleida          › │  (fila = botón)
│ Conexiones                                  │
│ AVE Barcelona                  [−]  3  [+]  │
│ AVE Sevilla                    [−]  3  [+]  │
│ ALV Badajoz                    [−]  2  [+]  │
│ ALV Soria                         [Abrir]   │
│ ▸ Estación                        nivel 2   │
│ ▸ Datos                                     │
│ ▸ Salidas                                   │
└─────────────────────────────────────────────┘
```

**Parte del día**

```
┌ Parte del día                                     ┐
│ [▣] Marisa Andén  ▷  El último tren ha llegado…  │  (tarjeta narrada compacta; omitida en la guía)
│   ( 89 % )   Resultado del día        −0,1 M€     │
│ puntualidad  Incidencias resueltas:   1 de 2      │
│ ▸ Detalles de la jornada                          │
├───────────────────────────────────────────────────┤
│ [Siguiente jornada]  [Volver al mapa]             │  pie fijo
└───────────────────────────────────────────────────┘
```

**Popover de Menú y panel de objetivo**: ver §2.9 y §2.7.

### 4.4 Reglas por sección (contenido, paquete B)

- **Red**: filas de una línea; el nombre abre la ficha (`route`). «Relación nueva» abre su diálogo como hoy. Competencia: una fila por relación con tu tarifa, frecuencia y margen; rivales en una línea.
- **Flota**: Mi parque como filas (miniatura, modelo, «6 de 12 libres», estado en palabra). El acceso al taller, como botón de la fila.
- **Dinero**: gráfico + «Resultado por turno» arriba; folds para cuenta, préstamos (`borrow`/`repay`), mantenimiento (`#maintenance`) y previsión de 3 turnos.
- **Despacho**: Agenda según el boceto. Apoyo: encuesta, «Elecciones en N turnos», grupos (barra sin cifra) con «Negociar · 8 M€». Pactos, Personal (con «Maquinistas» y «Necesarios» visibles en una sola línea `.figures`: los pide la guía), Cloacas sin párrafos de introducción.
- **Progreso**: Mandato con filas de reto (usa `J.goals`), mandatos y elecciones; Hitos; Investigación (18 `article` en `.game-research`); Megaproyectos (6 `article` en `.game-megas`); Noticias con el desplegable «Vista».
- **Trenes Pop**: se mantiene su estilo; cumple las zonas (no tapa la barra superior, la franja ni la banda inferior) y su pie de compra es fijo.
- **Ayuda** (`help()`, texto exacto, 70 palabras):

```html
<div class="content"><h1>Cómo se juega</h1><ol class="method">
<li><b>Sigue el objetivo.</b> La franja de arriba dice qué hacer ahora; púlsala.</li>
<li><b>Conecta ciudades.</b> Pulsa una relación, elige tren, salidas y tarifa, y aplica el plan.</li>
<li><b>Vías compatibles.</b> El AVE pide ancho estándar y catenaria; el Alvia cambia de ancho. Mejora tramos desde su ficha.</li>
<li><b>Trenes Pop.</b> Compra material en Flota.</li>
<li><b>Cierra el turno.</b> Se liquidan cuentas, obras y encargos. Cumple cinco retos y gana dos mandatos.</li></ol>
${fold('help-keys','Teclas','<p class="small"><kbd>Espacio</kbd> jornada · <kbd>1</kbd>–<kbd>5</kbd> secciones · <kbd>T</kbd> Trenes Pop · <kbd>+</kbd>/<kbd>−</kbd> zoom · <kbd>Esc</kbd> cerrar o menú</p>')}
<div class="actions"><button class="btn primary" data-action="close-modal">Entendido</button><button class="btn" data-action="tutorial-start">${…etiqueta actual…}</button></div>
<p class="credits">…línea de créditos actual…</p></div>
```

### 4.5 Estados vacíos (texto exacto, una línea)

| Lugar | Texto |
|---|---|
| Red → Servicios con un filtro sin resultados | «Ninguna relación con ese filtro.» |
| Red → Jornada sin incidencias | (sin bloque; solo los plegables) |
| Red → Obras, vista «En marcha» vacía | «Ninguna obra en marcha.» |
| Red → Horarios, búsqueda sin resultados | «Ninguna estación con ese nombre.» |
| Flota → Pedidos vacío | «Sin pedidos en curso.» |
| Flota → Reformas, taller sin unidades libres | «No hay unidades libres para reformar.» |
| Despacho → Agenda sin decisión, suceso, encargos ni peticiones | «Nada pendiente. Cierra el turno cuando quieras.» |
| Despacho → Pactos sin pactos | «Sin pactos abiertos.» |
| Progreso → Mandato con los cinco retos cumplidos | «Retos completos. Gana las elecciones.» |
| Progreso → Noticias → Gaceta / Diario / Informes vacíos | «Aún no hay noticias.» |
| Progreso → Noticias → Mensajes vacío | «Aún no hay mensajes.» |
| Ficha de ciudad sin conexiones | «Sin conexiones todavía.» |
| Peticiones de ciudad, encargos, historial vacíos | el bloque no se pinta |

### 4.6 Claves de plegables (contrato entre A, B y C)

`fold(key,…)` usa siempre estas claves; A las abre desde la franja (`fold` de `nextAction`) y la guía no depende de ninguna:

| Lugar | Claves |
|---|---|
| Red → Jornada | `ops-day` (Jornada), `ops-settings` (Ajustes), `ops-departures` (Próximas salidas) |
| Dinero | `fin-account` (Cuenta del turno), `fin-loans` (Préstamos), `fin-maint` (Mantenimiento), `fin-forecast` (Previsión) |
| Ficha de relación | `route-details` (Detalles), `route-upgrade` (Mejorar) |
| Ficha de ciudad | `city-station` (Estación), `city-data` (Datos), `city-departures` (Salidas) |
| Ficha de tramo | `tramo-works` (Obras) |
| Fichas de tren, estación, obra y nodo | `{tipo}-details` (Detalles) |
| Despacho → Agenda | `agenda-conditions-${q.id}` (Condiciones de cada encargo), `agenda-history` (Historial del mandato) |
| Parte del día | `report-details` (Detalles de la jornada) |
| Ayuda | `help-keys` (Teclas) |

`details.menu-music-library` (Sonido) y `details.map-layers` (Capas) no usan `fold()`: conservan su marcado.

---

## 5. La guía (tutorial)

### 5.1 Qué no cambia

- Los 9 pasos, su orden, `id`, `person`, `title` y `text` de `TOUR_STEPS` (`app.js:444–454`) y las tres variantes del paso `day` (`app.js:565`): byte a byte. Deben seguir cumpliendo `N.keyForText(text)` (si no, `renderCoach` lanza «Mensaje sin personaje»).
- El estado `state.tutorial` versión 2, `validInduction` (`induction-runtime.js:60–63`), las condiciones `ready` de cada paso y el número de pasos.
- Lo que fijan las pruebas: `#coach` con `data-step-id`, `[data-action="tutorial-skip"]` siempre, `[data-action="tutorial-next"]` en cuanto el paso está listo (las pruebas lo pulsan justo después de la acción del paso; Playwright espera a que aparezca); `#tour-shades` con exactamente 4 `<i>`; `#spot`; `#modal #coach` en el parte; los tres se borran al pausar y al terminar; `function positionTour()` existe literalmente en `app.js`.

### 5.2 Modelo de foco: hueco, anillo, participantes

- **Hueco**: el rectángulo del contenedor del paso (cajón, ficha, barra de turno, franja de objetivo con su panel). Queda sin oscurecer.
- **Anillo** (`#spot`): rodea el **control** que hay que tocar (la fila Madrid — València, el formulario del plan, la respuesta a la avería, «Comienza la jornada»…), +4 px. Antes de medirlo, el control se trae a la vista dentro de su panel (`scrollIntoView({block:'nearest'})`, una vez por paso y subpaso, no en cada fotograma, para no pelear con el desplazamiento del jugador). Si el selector del anillo no encuentra un elemento visible (el jugador filtró la lista, por ejemplo), no hay anillo; pulsar la franja (`tutorial-focus`) restablece el panel y sus filtros. Cuando el paso está listo, el anillo desaparece y aparece el botón siguiente del coach con un pulso.
- **Oscurecido** (`#tour-shades`, 4 `<i>` alrededor del hueco, z 50): `background: rgba(11,17,26,.55)`, **sin `backdrop-filter` ni `filter`**, `pointer-events: none` (un hueco desfasado no puede volver a tapar el clic: la causa del fallo actual de `conexiones-ui-test`). Cubre toda la pantalla salvo el hueco; la barra superior y la franja de objetivo quedan por encima porque reciben `.tour-lift` (z 52). La interacción con el fondo se bloquea con `inert`.
- **Participantes nítidos e interactivos**: el contenedor del hueco, el coach, la franja de objetivo y su panel, cada mensaje (`#toast` está fuera de `#game` y por encima), cualquier diálogo abierto.
- **Nítida pero inerte**: la barra superior (`.hud`, con `.tour-lift`): se lee, pero sus botones (Caja, Apoyo) no hacen nada durante la guía, para que nadie se salga del paso por accidente.
- **Inertes y oscurecidos**: el resto de hijos de `#game` (mapa, navegación, barra de turno si no es el hueco, el panel que no toca). Los controles del mapa están ocultos. El bucle de `inert` salta `#coach`, `#tour-shades`, `#spot` y `#mission`.
- **Sin transiciones** en hueco, anillo y coach (solo una entrada de opacidad de 120 ms). Se recalcula en cada `render`, en `frame` (como hoy, con la cadena de geometría como guarda), en `resize`, en el `scroll` del cuerpo del panel del hueco y con un `ResizeObserver` sobre hueco y coach. Durante la guía el cajón no se anima al entrar (`body.guided-turn #drawer{animation:none}`).
- **Objetivo oculto**: si el contenedor del paso está oculto o mide 0×0 (el jugador abrió otra relación o cerró la ficha), se llama a `focusTutorial()` (como mucho una vez cada 500 ms). Así desaparece el callejón sin salida que mide la auditoría.

### 5.3 Pasos: hueco, anillo e instrucción

Campos nuevos de UI en cada objeto de `TOUR_STEPS` (no tocan `text`): `focus` (selector del hueco), `ring` (selector del control, o `null`) y `do` (instrucción, ≤ 7 palabras). El texto `next` se acorta a ≤ 4 palabras (la flecha « →» la añade `renderCoach`).

**Instrucción vigente** (`guideInstruction()`, paquete C; la franja la muestra como «Guía · …»): si el paso **no** está listo, el `do` del paso o subpaso; si **está** listo, «Pulsa «{next}»». Así la franja dice siempre lo único que hay que tocar.

| # | `id` | Hueco | Anillo | `do` (no listo) | `next` |
|---|---|---|---|---|---|
| 1 | welcome | `#mission` + su panel (la guía lo abre) | `#mission .obj-panel` | «Mira tu objetivo» (listo desde el principio: la franja dice «Pulsa «Explorar mi red»») | Explorar mi red |
| 2 | network | `#drawer` (Red → Servicios) | `#drawer [data-action="route"][data-id="madrid-valencia"]` | «Pulsa Madrid — València» | Preparar el servicio |
| 2b | network (relación elegida) | `#inspector` | `null` | (listo) | |
| 3 | offer | `#inspector` | `#routeForm` | «Ajusta salidas y tarifa; «Aplicar plan»» | Ir al Despacho |
| 4 | decisions | `#drawer` (Despacho → Agenda) | `#drawer .desk-decision .desk-options` | «Elige una opción del consejo» | Revisar la plantilla |
| 5 | people | `#drawer` (Despacho → Personal) | `#drawer .figures` (maquinistas / necesarios) | «Compara disponibles y necesarios» (listo desde el principio) | Comparar inversiones |
| 6 | research | `#drawer` (Progreso → Investigación) | `#drawer .game-research article` (el primero) | «Mira las investigaciones» (listo desde el principio) | Continuar con la red |
| 7 | infrastructure | `#inspector` (Madrid — Salamanca) | `#routeForm` | «Elige material; «Abrir servicio»» | Poner trenes en marcha |
| 8a | day · preparación | `#daybar` | `#daybar [data-action="day-start"]` | «Pulsa «Comienza la jornada»» | Elegir mi primer encargo |
| 8b | day · avería sin resolver | `#drawer` (Red → Jornada) | primer `#drawer [data-action="respond"]:not([disabled])` y su fila | «Elige una respuesta a la avería» | |
| 8c | day · avería resuelta | `#daybar` | `#daybar [data-action="day-end"]` | «Pulsa «Hasta el último tren»» | |
| 8d | day · parte | `dialog#modal` | clase `.tour-control` en `#modal [data-action="day-next"]` | «Pulsa «Siguiente jornada»» | |
| 8e | day · de vuelta en preparación (listo) | `#daybar` | `null` | (listo) | |
| 9 | handoff | `#drawer` (Despacho → Agenda) | `#drawer .contract-branches` del primer encargo ofrecido | «Acepta un encargo» | El mando es tuyo |

Con la Agenda sin banner ni «Elige el ritmo», los botones del encargo quedan arriba; el anillo los trae a la vista igualmente.

### 5.4 La caja de la guía (coach)

```
┌───────────────────────────────────────────┐
│ [▣] Charo Tijera             ▷   ⏸ Pausar │
│     ● ● ● ○ ○ ○ ○ ○ ○                     │  9 puntos bajo el nombre (aria-label «Paso 3 de 9»)
│ Haz que València funcione mejor           │  título (h2, igual que hoy)
│ En el plan de servicio, añade una salida  │  texto grabado con la frase
│ por sentido y cambia la tarifa. La        │  que suena resaltada
│ previsión muestra el coste y los trenes   │
│ necesarios; pulsa «Aplicar plan» cuando   │
│ te convenza.                              │
│                        [Ir al Despacho →] │  solo cuando el paso está listo, con pulso
└───────────────────────────────────────────┘
```

- Una sola caja (sin cajas dentro). Ancho `min(340px, 100vw − 2g)`.
- Cabecera: retrato, nombre y, debajo del nombre, `.tour-dots` con 9 `<i>` (`.done` los pasados, `.now` el actual; `role="img"`, `aria-label="Paso N de 9"`); a la derecha ▷ (`N.controls`) y «⏸ Pausar» (`tutorial-skip`, con texto visible).
- Sin línea de instrucción: la instrucción está en la franja, y repetirla es justo el texto de más del que se queja el jugador. Fuera «Tu primer turno», «Guía · N / 9», «Listo para seguir» y «Hazlo en el panel marcado».
- Pie: solo el botón siguiente, y solo cuando el paso está listo (`.tour-ready`, pulso de 2 ciclos). Mientras no lo está, el coach no tiene pie.
- **Compacto** (`.compact`, teléfono, apaisado o falta de sitio): retrato 28 px, título 15 px, texto 12 px con 4 líneas y desplazamiento propio; el botón a la derecha del título cuando aparece.
- **En el diálogo** (`.in-dialog`, parte del día): franja compacta al principio de `.content` (retrato, nombre, ▷, Pausar y el texto grabado en 3 líneas); sin título ni botón siguiente; la tarjeta de `narrator.modal()` no se inserta durante la guía, así que no hay dos personajes hablando.

### 5.5 Colocación del coach (sin tapar nunca el control ni otras cajas)

Escritorio (`placeCoach()`):

```
S  = área segura: x ∈ [g, innerWidth − g], y ∈ [safe-top, innerHeight − safe-bottom]
H  = hueco + 12 px;  R = anillo + 8 px (si no hay anillo, R = H)
O  = obstáculos + 8 px: franja de objetivo y su panel abierto,
     zona de mensajes (abajo a la izquierda del área libre, alto --msg-zone, aunque esté vacía),
     cada mensaje visible, desplegables abiertos
candidatos (en orden):
  1. a la derecha de H, con top = R.top − 24 (ajustado a S); si corta un obstáculo, se desliza
     hacia abajo hasta quedar bajo él (si sigue cabiendo en S)
  2. a la izquierda de H, igual
  3. debajo de H, centrado en R.x
  4. encima de H, centrado en R.x   (paso day: encima de la banda y a la derecha de la zona de mensajes)
  5. esquinas de S: arriba-derecha, arriba-izquierda, abajo-derecha, abajo-izquierda
para modo en [normal, compacto]:
  para cada candidato: si cabe en S y no corta H, ni R, ni O → colocar y terminar
último recurso: acoplar abajo como en teléfono (reserva --guide-h) y volver a traer R a la vista
```

Teléfono y apaisado bajo: siempre acoplado y compacto (`.docked.compact`): `left: g; right: g; bottom: safe-bottom; max-height: min(240px, 38dvh)`. La guía pone `--guide-h = alto del coach + gap` en `document.documentElement`; paneles y bandeja suben (CSS de A). En teléfono la navegación y la fila de acciones se retiran durante la guía, salvo la fila de acciones en el paso `day` (`body.guide-day`). El control del anillo se trae a la vista dentro del panel acortado. En el paso 1, el panel de objetivo llega como mucho hasta el coach (A limita su alto con `--guide-h`).

### 5.6 Mensajes durante la guía

- Escritorio: salen en su zona de mensajes, que el coach esquiva siempre (§5.5). Están fuera de `#game` y por encima del oscurecido: nunca borrosos, nunca bajo el coach, su ▷ y su × se pueden pulsar.
- Teléfono y apaisado: salen encima del coach acoplado (`bottom: safe-bottom + guide-h`); el panel se acorta `--msg-h` mientras se vea el mensaje.
- Las noticias de turno siguen sin salir durante la guía (`narrator.updates(..., {skip: !!tut})`, como hoy).

### 5.7 Pausa, reanudación y final

- Pausa: «⏸ Pausar» o Esc sin desplegable abierto (como hoy) → `suspendTutorial()` → mensaje grabado «Guía en pausa. Puedes retomarla desde Ayuda.».
- Reanudar: Menú → Ayuda → «Retomar primer turno» (`tutorial-start`, exigido por la frase grabada) y, mientras siga en pausa, «Retomar la guía» en el panel de objetivo.
- Final: `endTutorial()` cierra cajón y ficha (`screen = inspect = null`), cierra el panel de objetivo, devuelve la franja a su estado normal (que normalmente pasará a «Encargo: …» con el encargo recién aceptado) y deja hablar «El mando es tuyo…» en la bandeja. (Hoy el Despacho se queda abierto a media página.)

### 5.8 Foco y movimiento

- Al cambiar de paso, el foco va a `#coach` (`tabindex="-1"`, `preventScroll`); el botón siguiente no roba el foco al aparecer.
- Con `prefers-reduced-motion: reduce`, sin pulsos (anillo, botón, franja) ni entrada de opacidad.

---

## 6. Garantías automáticas

Todo lo de esta sección es del **paquete D**. Las pruebas nuevas se escriben contra los contratos de §2–§5 y §7.0 en paralelo con A, B y C, y se hacen pasar sobre el árbol integrado.

### 6.0 Línea base

Antes de nada, D crea un árbol de trabajo de la base (`git worktree add <scratchpad>/ui-base bae2876`) y ejecuta allí, una a una, todas las suites `*-ui-test.mjs` de §6.5 para saber cuáles pasan hoy. Regla de la puerta: **toda suite que pasa en la base sigue pasando**, las nuevas pasan, y las que ya fallaban en la base no se tocan (se anotan en el informe con su primer error). También fija desde la base, con `git show bae2876:iberia-ferroviaria/proyecto/dist/<archivo>`, los hashes y listas de §6.3.

### 6.1 `proyecto/tools/ui-check.mjs` (nuevo)

Port del comprobador de la auditoría (`investigacion/ui-esencial/checker.mjs`) con la lista de cajas de §2.5. Exporta funciones que se evalúan dentro de la página:

- `boxes(page)` → cajas de primer nivel visibles (display, visibility, opacidad > 0,05, área > 0, recortadas al viewport), según el modo que diga `body.ui-phone`: sin ella `.hud-turn`, `#resources`; con ella `.hud`; siempre `#mission`, `#navigation`, `#daybar`, `.map-tools`, `#drawer`, `#inspector`, cada `#toast .narration-toast`, `#coach`, `#entry-welcome`. Desplegables aparte.
- `overlaps(page)` → pares de cajas con intersección > 1 px²; desplegables contra armazón, coach y mensajes. Con un diálogo abierto, solo se comprueba el interior del diálogo.
- `noBlur(page)` → ningún elemento visible del documento tiene `backdrop-filter` distinto de `none` ni `filter` con `blur`, incluido `dialog#modal::backdrop` (con `getComputedStyle(modal,'::backdrop')`).
- `dimmed(page, participants)` → para cada participante, hasta 40 puntos de muestra (centro de cada control interactivo y de cada bloque de texto visible): `document.elementsFromPoint` no tiene por encima ningún elemento ajeno al participante; opacidad efectiva ≥ 0,9 en el participante y sus antepasados; ni `inert` (salvo `.hud`, que se exige nítida pero puede estar inerte).
- `objective(page)` → `#mission` visible, dentro del viewport, `elementFromPoint` en su centro cae dentro de él, `.obj-label` con 3–60 caracteres y sin desbordar su caja más de dos líneas.
- `focus(page, ringSel)` → el control está visible y sin tapar; o bien ≥ 90 % de su área está dentro del viewport y de su contenedor con desplazamiento, o bien (si es más alto que la parte visible del contenedor) ocupa ≥ 90 % de esa parte visible empezando por su borde superior; `#spot` lo contiene; el coach no corta ni el anillo ni el hueco (escritorio) ni ningún mensaje.
- `text(page, scope, {exclude})` → palabras y cifras visibles (mismo criterio de la auditoría), separando **filas** (`tbody tr`, `.row`, `li` dentro del ámbito) del **resto**, y excluyendo textos grabados: `[data-say]`, `.narration-card p`, `.desk-decision p`, `.game-event p`, `.say-s`, `.choice` y el catálogo `.trenespop`.

### 6.2 `proyecto/ui-esencial-ui-test.mjs` (nuevo)

Playwright (importa `process.env.PLAYWRIGHT_MODULE || '/opt/node-tools/node_modules/playwright/index.mjs'`, Chromium de `CHROMIUM_PATH` o `ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1`, argumentos `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --autoplay-policy=no-user-gesture-required`). Sirve `process.env.UI_ROOT` (por defecto `iberia-ferroviaria/`, la build publicada; durante el desarrollo, `UI_ROOT=iberia-ferroviaria/proyecto/dist`) con un servidor propio como `conexiones-ui-test.mjs`. Usa `reducedMotion: 'reduce'` y la guarda de mapa estático (`QA_STATIC_MAP`) de `onboarding-ui-test.mjs`/`drive.mjs` para no depender de la carga de la máquina. Capturas a `outputs/tenfe-qa/ui-esencial/` (ignorado por git).

Resoluciones: **1440×900, 1280×720, 390×844, 320×640** para todo; **844×390** para los recorridos 2 (pantalla base, Red → Servicios, ficha de relación, panel de objetivo, Menú) y 1 (pasos 1–3). En cada estado se ejecutan `overlaps = []` y `noBlur = []`.

1. **Guía completa** (semilla fija): en cada paso y subpaso de §5.3, antes y después de la acción: `overlaps = []`; `dimmed(participantes) = []`; `objective` correcto con la etiqueta empezando por «Guía · » y, si el paso está listo, terminando en «{next}»»; `focus(ring)` correcto; `[data-action="tutorial-next"]` ausente si el paso no está listo y presente si lo está; una sola tarjeta de mensaje visible como mucho; el coach dentro del viewport; Caja y Apoyo no responden (inertes). Tras «Aplicar plan» y «Abrir servicio» (sale un mensaje), las mismas aserciones con el mensaje visible. En el parte: `#modal #coach` = 1, ninguna `.narration-card` insertada por `narrator.modal`, `[data-action="day-next"]` visible sin desplazar, `#toast` oculto. Esc con el Menú cerrado pausa; pausa con «Pausar» → `#coach,#tour-shades,#spot` = 0; reanudar desde «Retomar la guía» del panel de objetivo; terminar → sin cajón ni ficha abiertos, franja fuera del estado `guide`.
2. **Partida sin guía**: bienvenida (sin solapes, sin antetítulo ni titular, controles del mapa ocultos en teléfono); pantalla base: presupuesto de §6.4; cada sección de la navegación y cada pestaña (con desplazamiento hasta el final del cuerpo); cada ficha (ciudad Madrid, relación, tramo, tren); panel de objetivo, popover de Menú y Capas abiertos (uno cierra al otro; clic fuera y Esc los cierran); Cerrar turno → suceso (franja en `urgent`); jornada con incidencia (franja en `alert`, sin `.alert-pill`, punto en Red), respuesta, «Hasta el último tren», parte; Trenes Pop ficha (`confirm-buy` visible sin desplazar), lote (`refit-detail`), reforma (`refit-confirm`), taller de vías (`track-confirm`), Guardar (`save-now`), Ayuda (`tutorial-start`), Sonido (`#musicVolume`). En cada estado: `objective` correcto (salvo con diálogo), botones principales visibles. Un clic en la franja en estado normal abre el destino de `U.nextAction` (comprobar `screen`/`inspect`).
3. **Estrés de mensajes**: con cajón abierto, con ficha abierta y sin paneles, con voces activas se inyectan 4 mensajes con textos grabados (`railwayGame.narrator.toast('Plan de servicio actualizado.')`, `'Material enviado al taller.'`, `'Investigación financiada.'`, `'No hay caja suficiente.'` con `{error:true}`): exactamente 1 `.narration-toast` visible, «+N» presente mientras la primera habla, ningún solape, ▷ y × pulsables; al cerrar una aparece la siguiente. Con voces silenciadas, cada mensaje nuevo sustituye al visible al momento.
4. **Teléfono**: sin desbordamiento horizontal (`scrollWidth ≤ innerWidth`); las 6 entradas de navegación dentro del viewport; la cabecera de la ficha de ciudad dentro del viewport y su × pulsable; todo control interactivo visible mide ≥ 44 px de lado menor salvo enlaces de texto; la fila de pestañas de Red no corta ninguna etiqueta (se desplaza).
5. **Teclado**: 1–5 abren las secciones; Esc cierra desplegable → ficha/cajón → abre el Menú; con el Menú abierto, flechas mueven el foco y Esc lo cierra devolviendo el foco a «Menú»; Espacio comienza la jornada.

### 6.3 `proyecto/ui-esencial-test.mjs` (nuevo, node; se añade a `npm test`)

- `PAGES` tiene 5 claves; `ALIASES.press` y `ALIASES.archive` llevan a progress/news.
- `index.html` no contiene `class="brand"`, `id="zoomIn"`, `id="zoomOut"`, `id="dateShort"` ni `id="dayKind"`; contiene `id="mission"`, `id="resetMap"`, `data-layer="speed"`, `id="legend"` dentro de `details class="map-layers"`.
- `sfx.js ACTIONS` tiene `objective` y `menu-open`.
- Ningún CSS de `dist/` que cargue `index.html` contiene `blur(`.
- Cada `TOUR_STEPS[i]` tiene `focus`, `ring` (cadena o `null`) y `do` con ≤ 7 palabras; `next` ≤ 4 palabras; los `text` siguen resolviendo con `keyForText`; `id`, `person`, `title` y `text` son idénticos a los de `bae2876` (extraídos con una expresión regular de `git show bae2876:…/app.js`).
- `voice_dialogues.mjs` sigue dando `6348984c…098f`; el sha256 de `JSON.stringify(STATIC_MESSAGES)` y de `JSON.stringify(MESSAGES)` de `narration-data.js` es el de la base; los 46 mensajes literales de `app.js` de la base (22 de `toast('…')` y 24 de `act(…, '…')`) siguen presentes.
- `conexiones.js`/`tenfe.js`: `J.goals()` devuelve 5 retos con `value ≤ target`; `U.nextAction()` devuelve `{label, action, rank}` con `label` de 3–60 caracteres en partidas sembradas en distintos turnos (turno 1, tras aceptar un encargo, con suceso, con urnas a 2 turnos y apoyo < 50, con el mandato terminado), y la fila esperada en cada una (rangos 4b, 2, 4a, 1).

### 6.4 Presupuestos (aserciones de `ui-esencial-ui-test.mjs`)

| Ámbito | Palabras | Cifras |
|---|---|---|
| Pantalla base sin paneles (preparación) | ≤ 28 | ≤ 5 |
| Barra superior | ≤ 6 | ≤ 4 |
| Franja de objetivo | ≤ 10 | ≤ 2 |
| Cada etiqueta de navegación | 1 (0 en apaisado bajo) | 0 |
| Cada pestaña | ≤ 2 | 0 |
| Cabecera de panel o diálogo | ≤ 3 (sin `.kicker`) | 0 |
| Botones (excepto `.choice`) | ≤ 4 | — |
| Primera pantalla de un cajón, **resto** (todo menos filas y textos grabados; 1440×900) | ≤ 30 | ≤ 4 |
| Primera pantalla de un cajón, **cada fila** | ≤ 8 | ≤ 3 |
| Primera pantalla de una ficha, **resto** (1440×900) | ≤ 40 | ≤ 8 |
| Primera pantalla de una ficha, **cada fila** | ≤ 8 | ≤ 3 |
| Caja de la guía (sin el texto grabado ni el título) | ≤ 8 | 0 |
| Mensajes visibles | 1 como máximo, sin «Detalle» visible | — |
| Textos prohibidos visibles en partida | los de §3.7 | — |

Las pestañas de Trenes Pop (`.trenespop`) y las fichas de producto quedan fuera de las cifras de fila (son una tienda con su estilo), pero no de solapes ni de desenfoque. (Comparación: hoy la pantalla base tiene 116 palabras y 23 cifras; un cajón, 150–260 palabras y 25–41 cifras.)

### 6.5 Pruebas existentes que hay que actualizar (paquete D)

| Prueba | Cambio |
|---|---|
| `conexiones-ui-test.mjs` | quitar `press` de la lista de secciones (línea 41) y comprobar Progreso → Noticias (`progress-tab` `news`); las aserciones de la guía siguen (`#tour-shades i` = 4, `#coach [data-action="tutorial-next"]`, `data-step-id`, `#modal #coach` = 1, `#modal .induction-dialog` = 0, `#coach,#tour-shades,#spot` = 0); quitar cualquier dependencia de clics sobre sombras |
| `mapa-voces-ui-test.mjs` | `#zoomIn` (línea 70) → `page.keyboard.press('+')` con la misma comprobación de zoom; `#resetMap` se queda |
| `audio-salida-ui-test.mjs` | las dos pulsaciones de `#musicBtn` (líneas 118 y 136) van precedidas de `await page.locator('[data-action="menu-open"]').click()`; el resto (ids de volumen, `audio-reset`, `close-modal`) sigue igual |
| `narracion-ui-test.mjs` | la colocación (mensaje ≥ 8 px sobre `#daybar`) debe pasar tal cual a 1440 y 390; adaptar solo si una tarjeta en espera rompe un localizador estricto (usar `:visible` o `.first()`) |
| `fabricantes-ui-test.mjs`, `train-refit-ui-test.mjs`, `menu-inicio-ui-test.mjs` | sin cambios previstos (`menu-inicio` usa `#modal [data-action=menu-home]`, `welcome-close`, `.menu-music-library summary` y `/Trenes Pop/` en «Cómo jugar»: todo se conserva); si falla un selector, se adapta sin perder la intención |
| `tenfe-ui-test.mjs`, `gameplay-ui-test.mjs`, `red-ui-test.mjs`, `onboarding-ui-test.mjs`, `nueva-partida-ui-test.mjs`, `contract-progression-ui-test.mjs`, `ui-test.mjs`, `rescate-ui-test.mjs` y las `voice-*-ui-test.mjs` | solo si pasaban en la base (§6.0): entonces se adaptan sin perder la intención; si ya fallaban, no se tocan |
| Node: `test.mjs` §11, `observer-runtime-test.mjs`, `induction-test.mjs`, `verdad-test.mjs`, `tycoon-contract-test.mjs`, `tenfe-test.mjs`, `marketplace-test.mjs`, `narration-test.mjs`, `train-refit-test.mjs`, `conexiones-test.mjs` | deben pasar **sin cambios** (A, B y C conservan lo que fijan) |

### 6.6 Puerta de regresión (orden)

```
cd iberia-ferroviaria/proyecto
npm test                                        # incluye ui-esencial-test.mjs
node observer-runtime-test.mjs && node induction-test.mjs && node verdad-test.mjs && node tycoon-contract-test.mjs
node tools/voice_dialogues.mjs | sha256sum      # 6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f
node ../tools/build-web.mjs                     # reconstruye index.html publicado (también valida el extractor)
# una a una (swiftshader satura 4 núcleos):
node ui-esencial-ui-test.mjs; node conexiones-ui-test.mjs; node narracion-ui-test.mjs; node mapa-voces-ui-test.mjs
node audio-salida-ui-test.mjs; node fabricantes-ui-test.mjs; node train-refit-ui-test.mjs; node menu-inicio-ui-test.mjs
# y cualquier otra *-ui-test.mjs que pasara en la base (§6.0)
```

Las suites que hacen `import {chromium} from 'playwright'` necesitan el resolvedor: `NODE_OPTIONS="--import file:///tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/tools/pw-register.mjs"` (ya existe) o un enlace local `node_modules/playwright` (ignorado por git).

---

## 7. Paquetes de implementación

### 7.0 Contratos compartidos (fijos para trabajar en paralelo)

Cuatro paquetes con archivos y funciones disjuntos: **A** armazón, **B** contenido de paneles, fichas y diálogos, **C** guía y bienvenida, **D** pruebas. A, B y C trabajan a la vez contra estos contratos; D escribe las pruebas a la vez y las hace pasar sobre el árbol integrado.

- **Tokens y escala z**: §2.1 y §2.4, en `:root` al final de `style-v3.css` (A). B, C y D solo los consumen.
- **Modo**: `const PHONE_MQ` en `app.js` (A) y la clase `body.ui-phone` que pone `layoutChrome()`. Nadie más decide el modo con `innerWidth`.
- **Clases de estado en `body`** (A, `layoutChrome()`): `ui-phone`, `ui-drawer`, `ui-inspector`, `ui-wide-drawer`, `ui-msg-reserve`, `ui-pop`; existentes: `guided-turn` (C la sigue poniendo en `tutorialChrome`), nueva `guide-day` (C, en el paso `day`). Variables en `document.documentElement`: `--msg-left`, `--msg-h` (A), `--guide-h` (C); `--tools-h` es CSS de A.
- **Clases de la guía** (C las define en `induction.css`): `.tour-coach`, `.compact`, `.in-dialog`, `.docked`, `.tour-dots`, `.tour-lift`, `.tour-ring`, `.tour-control`, `.tour-ready`.
- **Helpers de A en `app.js`**: `fold(key, label, html)` y `ui.details` (Set); `layoutChrome()`; la variable `objectiveOpen` (C la pone a `true` en el paso 1 y a `false` al salir de él) y `renderMission()`; en `conexiones.js` `J.goals(s)` y `J.GOAL_LABEL`; en `tenfe.js` `U.nextAction(s)` con `rank`, `tone` y `fold` (§2.7).
- **Helpers de C en `app.js`**: `guideInstruction()` devuelve la instrucción vigente (§5.3); A la usa en la franja con `typeof guideInstruction==='function' ? guideInstruction() : (TOUR_STEPS[tut.step].do || TOUR_STEPS[tut.step].title)`.
- **Marcado de paneles (B lo pinta, A lo estiliza)**: cajón `<header><h1>Red</h1><button class="close" data-action="close-drawer" aria-label="Cerrar">×</button><div class="tabs" role="tablist">…</div></header><div class="body">…</div>` (la fila `.tabs` solo si hay pestañas); ficha `<header><h2>…chip + título…</h2><button class="close" data-action="close-inspector" aria-label="Cerrar">×</button></header><div class="body">…</div>`, también para la ciudad (con `class="city-title"` en su `h2`; sin `.wide` ni `.close.floating`). Filas de lista: `tbody tr`, `.row` o `li` (así las cuenta D). Diálogos: `.content` con el contenido y, dentro, `.actions` como último hijo con el botón principal primero.
- **Lo que C necesita de B**: `#routeForm` como primer bloque de la ficha de relación (con `#routeFleet`, `#frequency`, `#fare`, `#routePreview` y el botón de envío dentro); `.contract-branches` con los dos botones de aceptar cerca del principio de la Agenda; `.figures` con «Maquinistas» y «Necesarios» en Personal; `.game-research article` en Investigación; `[data-action="respond"]` en Red → Jornada; `#modal [data-action="day-next"]` dentro del pie fijo `.actions` del parte; `.report-head` en el parte.
- **Lo que C necesita de A**: la franja en estado `guide` (§2.7); `#mission` nunca oculto; `narrator.modal()` no inserta su tarjeta con `body.guided-turn`; en teléfono, navegación y fila de acciones ocultas con `body.guided-turn` salvo `body.guide-day`; `.map-tools` ocultos con `body.guided-turn`; paneles y bandeja que se apartan con `--guide-h`; `#toast` oculto con un diálogo abierto.
- **Claves de plegables**: §4.6. **Estados vacíos**: §4.5. **Formato de cifras**: §1.11.
- **Cascada CSS**: orden de carga `style-v3` → `main-menu` → `induction` → `train-refit` → `narration` → `marketplace` → `paneles` (el extractor concatena `style-v3, main-menu, induction, marketplace, train-refit, narration` y B añade `paneles` al final). A usa selectores con id para el marco (ganan a reglas de clase posteriores); A borra de `narration.css` las reglas `.tour-coach…`, `.tour-narration` y `.entry-welcome…`, y C las redefine en `induction.css` con prefijo `#coach`/`#entry-welcome`; B quita de `marketplace.css` el posicionamiento de `.trenespop-drawer` y sobrescribe desde `paneles.css` las reglas de contenido de `induction.css` (desk-decision, game-event, taller de vías); C borra de `induction.css` la regla de teléfono `bottom:300px` de los paneles en la guía y todo `blur`. Ningún paquete usa `backdrop-filter` ni `filter: blur` (§1.8).
- **`data-action` nuevos** (A los da de alta todos en `sfx.js ACTIONS`): `objective: 'tab'`, `menu-open: 'nav'`. Ningún otro paquete crea acciones nuevas: B usa `<select>` (suenan por el `pointerdown` de formularios y el `change` del documento) y `<details>` (suenan por el manejador de `summary` de A); C usa `tutorial-focus` y `tutorial-start`, que ya existen. Toda acción que aparezca en `app.js`, `main-menu.js` o `nueva-partida.js` necesita receta (`test.mjs` §11).
- **Puntos de inserción en el despachador de clics** (`app.js:1483–1643`), para no pisarse: A añade sus `case` justo después de `case 'navigate'`; B, después de `case 'press-tab'`; C, dentro del bloque `tutorial-*`. En el `change` del documento (`app.js:1673`), B añade sus selects tras la línea de `routeStatus`.
- **Propiedad de funciones de `app.js`**:
  - **A**: constantes iniciales (`money`, `signed`, `ICONS` + icono `menu`, `PAGES`, `ALIASES`, `PHONE_MQ` nueva), `ui` (añade `details`), variables nuevas (`objectiveOpen`, `menuPop`, `surgeAlert`), las opciones del `RailMap` (`isVisible`, `getViewport`), `renderMusicButton`, `icon`, `fold` (nuevo), `showAlert`, `render`, `renderBoard`, `layoutChrome` (nuevo, tras `renderBoard`), `renderHud`, `renderClock`, `renderNav`, `renderMission`, `ongoingHTML` (borrar), `renderLegend`, `renderDaybar`, `navigate` (solo cerrar desplegables), `resetSessionView` (solo quitar `.alert-pill` y reiniciar `objectiveOpen`, `menuPop`, `surgeAlert`), `case 'tenfe-next'`, `case 'navigate'`, `case 'open-incidents'`, la línea `.alert-pill` de `case 'city'`, sus `case` nuevos, el cierre de desplegables al inicio del manejador de clics, el manejador de `summary`, los manejadores estáticos de capas y zoom (`app.js:1700–1703`), el `keydown` principal (`app.js:1704`), el `resize` y el `MutationObserver` de `layoutChrome`.
  - **B**: `header`, `renderDrawer`, todas las páginas (`opsPage`, `networkPage`, `redPage`, `trainsPage`, `fleetPage`, `marketPage`, `worksPage`, `timetablesPage`, `financePage`, `drawChart`, `moneyPage`, `officePage`, `progressPage`, `pressPage`, `archivePage`, `storyPage`, `deskDecisionHTML`, `councilVoice`), `renderInspector` (marcado de cabecera y `.wide`), todas las fichas (`routeInspector`, `updatePreview`, `hourHistogram`, `optionRow`, `trainInspector`, `stationInspector`, `workInspector`, `cityInspector` `app.js:406–438`, `tramoInspector`, `nodeInspector`), los diálogos (`dayReport`, `fleetDetail`, `refitDialog`, `purchaseDialog`, `marketListingDialog`, `newLineDialog`, `serviceDialog`, `saveDialog`, `help`, `musicDialog`, `trackDialog`, `workDialog`, `showDecision`, `showTenfeUpdate`, `menuGuide`, `realTripModal`, `showLegacy`), `case 'tycoon-tab'` (enrutado de `paper` a Noticias), `case 'press-tab'`, `case 'progress-tab'` (acepta `news`), sus `case` nuevos tras `case 'press-tab'` y sus selects en el `change`.
  - **C**: `TOUR_STEPS` (solo campos de UI y `next`), `clearCoach`, `tutorialChrome`, `startTutorial`, `suspendTutorial`, `endTutorial`, `tutorialNext`, `tutorialMark`, `focusTutorial`, `tutorialIncident`, `tourTarget`, `positionTour`, `placeCoach` y `guideInstruction` (nuevas, en la sección de la guía), `renderCoach`, `showWelcome`, las dos guardas de la guía del manejador de clics (`app.js:1489–1490`), los `case 'tutorial-*'`, y en `pick()` solo la retirada de `#entry-welcome`.
  - **D**: nada en `app.js`.
- **Propiedad de archivos**:
  - A: `index.html` (cuerpo, líneas 4–19 salvo `<head>`), `style-v3.css`, `narration.css`, `narration-runtime.js`, `sfx.js`, `conexiones.js`, `tenfe.js` (solo `nextAction`).
  - B: `paneles.css` (nuevo), `marketplace.css`, `train-refit.css`, `tenfe-ui.js`, `conexiones-ui.js`, `tycoon-ui.js`, `marketplace.js`, `train-refit.js`, `track-preview.js`, la línea de `<head>` de `index.html` (añade `<link rel="stylesheet" href="paneles.css">` justo antes de `</head>`), `iberia-ferroviaria/tools/extract-game-source.mjs` (solo concatenar `paneles.css` al final del CSS y `replaceOne` de su `<link>`) y `proyecto/build.mjs` (concatenar `paneles.css` y quitar su `<link>`).
  - C: `induction.css`; `induction-runtime.js` solo si fuera imprescindible (no debería).
  - D: `proyecto/tools/ui-check.mjs`, `proyecto/ui-esencial-ui-test.mjs`, `proyecto/ui-esencial-test.mjs` (nuevos), `proyecto/package.json` (solo el script `test`), y todas las ediciones de `*-test.mjs` existentes.
  - Nadie toca: `main-menu.css`, `main-menu.js` (salvo el orquestador para la versión), `story.js`, `induction.js`, `encounters.js`, `tycoon.js`, `narration-data.js`, `rescate-data.js`, `voice.js`.
- **Cadenas del publicador que no se tocan**: en `app.js`, una sola vez, `onerror: () => { clear();toast('No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.'); }`; en `main-menu.js`, una vez, `<footer class="menu-council">`; en `voice.js`, `NARRATION_VOICES[id]` y `await response.arrayBuffer()`; en `index.html`, una vez cada una: los `<link>` de `style-v3.css`, `main-menu.css`, `induction.css`, `train-refit.css`, `narration.css`, `marketplace.css`, `<script>globalThis.IBERIA_SAMPLE_BASE = 'assets/';</script>`, `<script type="module" src="app.js"></script>` y `</body>`. Sintaxis de módulo admitida por el extractor: imports de una línea, `export function|const|let|class`, sin `export default`, sin `import()` dinámico; ningún archivo JS nuevo en `dist/` (el extractor tiene una lista fija). Sin enlaces `http(s)://` en `app.js` ni `index.html` (`test.mjs` §8). Solo `url('assets/…')` con comillas simples en CSS.
- **Integración**: A, B, C y D en paralelo, cada uno en su rama o árbol de trabajo; el orquestador integra en el orden A → B → C → D (los conflictos, si los hay, son de proximidad en el despachador de clics de `app.js`: se resuelven conservando los dos lados). Después ejecuta la puerta de §6.6, sube la versión a 6.6.0 (`main-menu.js` «Versión», `proyecto/package.json`, `tools/build-web.mjs` `version`), reconstruye con `node iberia-ferroviaria/tools/build-web.mjs` y actualiza `docs/CONEXIONES.md` (sección de interfaz).

### 7.A Armazón: barra superior, objetivo, navegación, barra de turno, zonas, mensajes y teclado

PAQUETE A · Armazón: barra superior, franja de objetivo, navegación y Menú, barra de turno, sistema de zonas (escritorio, apaisado y teléfono), mensajes narrados y teclado.

Lee antes /tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/ui/UI-ESENCIAL.md: §1, §2 entero (2.1–2.12), §3.1, §3.6–3.7, §4.6, §6.4 y §7.0. Repo /home/user/putarenfe, rama main (base bae2876, código igual a c903d0a); fuente editable en iberia-ferroviaria/proyecto/dist/ (las rutas de abajo son relativas a ella). No toques ningún texto grabado (§1.9: diálogos, narraciones, el `text`/`title` de TOUR_STEPS, los 46 mensajes literales de app.js (22 de toast('…') y 24 como último argumento de act(…, '…'))) ni las cadenas que busca el publicador (§7.0).

ARCHIVOS TUYOS: index.html (solo el cuerpo, líneas 4–19; la línea de <head> la toca B), style-v3.css, narration.css, narration-runtime.js, sfx.js, conexiones.js, tenfe.js (solo nextAction). En app.js, SOLO: constantes iniciales (money, signed, ICONS, PAGES, ALIASES y la nueva PHONE_MQ), el objeto ui (+details), variables nuevas objectiveOpen/menuPop/surgeAlert, las opciones del RailMap (isVisible, getViewport), renderMusicButton, icon(), fold() (nueva), showAlert, render, renderBoard, layoutChrome (nueva, justo después de renderBoard), renderHud, renderClock, renderNav, renderMission, ongoingHTML (bórrala), renderLegend, renderDaybar, navigate (solo para cerrar desplegables), resetSessionView (solo quitar la línea de .alert-pill y reiniciar objectiveOpen/menuPop/surgeAlert), `case 'tenfe-next'`, `case 'navigate'`, `case 'open-incidents'`, la referencia a .alert-pill de `case 'city'`, tus case nuevos (justo después de `case 'navigate'`), el cierre de desplegables al principio del manejador de clics, un manejador nuevo de clic en <summary>, los manejadores estáticos de capas y zoom (app.js:1700–1703), el keydown principal (app.js:1704), un listener de resize y un MutationObserver. No edites funciones de B (páginas, fichas, diálogos, header, renderDrawer, renderInspector) ni de C (TOUR_STEPS, guía, showWelcome, guardas de la guía, pick). No edites ningún *-test.mjs (son de D).

1. index.html (cuerpo). HUD de §2.6: `<header class="hud"><div class="hud-turn"><strong id="date">Turno 1</strong></div><div id="resources" class="resources"></div></header>`. Elimina .brand, .when, #dateShort, #dayKind, .clock, #sun, #clock, #zoomIn y #zoomOut. Dentro de `details.map-layers`, tras `.layer-switch`, mueve `<div id="legend" class="legend"></div>`; tras el `details`, añade `<div id="legendMini" class="legend-mini" hidden></div>`. Conserva los 6 `button[data-layer]` estáticos, #resetMap, aside#mission, #inspector, #drawer, #daybar, #navigation, #toast y dialog#modal. Cambia el aria-label del canvas#map («usa la rueda, el pellizco o las teclas + y − para ampliar»). Cada ancla del extractor sigue apareciendo exactamente una vez.

2. style-v3.css. Añade al final un bloque «/* 6.6 Esencial — armazón */». Usa selectores con id (#mission, #drawer, #inspector, #navigation, #daybar, #toast…) para el marco: así ganan a las reglas de clase de los CSS que se cargan después. Contenido:
 a) Tokens, consultas de los tres modos y escala z de §2.1/§2.4 tal cual (zonas seguras con env(safe-area-inset-*), --tap 36/44, teléfono con --gap 8, teléfono con guía sin navegación ni fila de acciones salvo body.guide-day, apaisado bajo con tokens compactos).
 b) Posiciones de las tablas de §2.2 y §2.3: .hud (escritorio/apaisado: contenedor transparente con pointer-events:none e hijos con pointer-events:auto; teléfono: una caja con fondo), .hud-turn, #resources, #mission (escritorio: left calc(g+hud-l+gap), right calc(g+hud-r+gap), width fit-content, max-width 640px, margin-inline auto; teléfono: fila propia), #navigation (escritorio ancho --nav-w; apaisado solo iconos con la palabra oculta visualmente; teléfono 6 columnas iguales), #daybar (escritorio a la derecha con width fit-content; left calc(g+nav-w+gap) en jornada; teléfono fila de acciones), .map-tools (escritorio columna; teléfono fila de 44 px y --tools-h 52px), #drawer, #inspector (escritorio: mismo top y ancho también para la ciudad, neutraliza .inspector.wide; teléfono: media hoja con la fórmula de §2.3, entera durante body.guided-turn), #toast (modo libre: left var(--msg-left), bottom calc(var(--safe-bottom) + var(--guide-h)), ancho min(var(--msg-w), área libre); modo reserva body.ui-msg-reserve: de lado a lado entre --g y alto var(--msg-h) − var(--gap)). Paneles: top var(--safe-top) y bottom calc(var(--safe-bottom) + var(--msg-h) + var(--guide-h)).
 c) Marco de paneles con el marcado del contrato de §7.0: fondo sólido, borde 1 px, radio 8, #drawer>header e #inspector>header de 48 px (título 17 px y × de var(--tap)), `#drawer>header .tabs` en una segunda fila fuera del desplazamiento (sin sticky; en teléfono 44 px con desplazamiento horizontal propio y sin cortar palabras), .body con scroll propio. El contenido de .body es de B. Marco del diálogo: ancho, max-height calc(100dvh − 32px) de dialog#modal y `dialog#modal::backdrop{background:rgba(11,17,26,.6);backdrop-filter:none}` (el interior y el pie fijo son de B).
 d) Franja y panel de objetivo (§2.7): estados por data-state (guide, alert, surge, urgent, normal, ended), puntos (5 `i`, .on), chevron, etiqueta en una línea con elipsis (en teléfono hasta dos líneas de 13 px dentro de los 44 px), panel #obj-panel (escritorio centrado bajo la franja, 380 px, alto máximo = área principal − --msg-zone; teléfono ancho completo, alto máximo hasta --safe-bottom + --guide-h), z var(--z-pop). Pulso de atención: `body:has(#entry-welcome) #mission{animation:obj-attn 1.5s 2}`.
 e) Navegación: icono encima y una palabra debajo, 6 entradas, separador antes de Menú, punto de aviso de 8 px en la esquina del icono (sin número; nunca sustituye la etiqueta), popover #menu-pop que abre hacia arriba (220 px, z var(--z-pop)).
 f) Barra de turno por fases (§2.9): .btn.primary en Cerrar turno (preparación), Hasta el último tren (jornada) y Ver parte del día (cerrada); ▶ Comienza la jornada como secundario; línea de tiempo solo con viewport ≥ 1200 px y en jornada; grupo de 4 velocidades con viewport ≥ 1100 px fuera del apaisado, botón rotatorio en el resto; `body.guided-turn #daybar [data-action="skip-month"]{opacity:.4;pointer-events:none}`. Todo con media queries.
 g) Capas: #legend dentro del desplegable (leyenda completa de la capa); #legendMini bajo el desplegable solo con capa técnica. Los desplegables viven dentro de su caja (#mission z 30, #navigation z 30, .map-tools z 10): sube `.map-tools:has(.map-layers[open])` a z var(--z-pop).
 h) Clases de body: ui-inspector desplaza .map-tools a la izquierda de la ficha (escritorio y apaisado); ui-wide-drawer (Trenes Pop) oculta .map-tools y el cajón va de --g a --g; en teléfono ui-drawer oculta .map-tools (con la media hoja de ficha se quedan); `body.ui-pop #toast{visibility:hidden}`; `body:has(dialog#modal[open]) #toast{visibility:hidden}`; `body.guided-turn .map-tools{visibility:hidden}`; en teléfono `body.ui-pop .map-tools{visibility:hidden}` y `body:has(#entry-welcome) .map-tools{display:none}`; en teléfono con guía #navigation oculto y #daybar oculto salvo body.guide-day.
 i) Neutraliza las reglas antiguas que rompen el teléfono: .map-tools estirada a ≤760 (columna invisible de 68 px que se traga los clics), `.inspector.wide{top:auto}` a ≤760 (ficha de ciudad fuera de pantalla), #mission de 170 px, recursos de 7 px, .rail con 4 iconos que desbordan.
 j) Quita todo `backdrop-filter`/`blur` de style-v3.css (hoy en .hud, .layer-switch, .mission, .daybar, el fondo del diálogo y .close.floating): el armazón usa fondos sólidos de la paleta «Tenfe 5».
 k) Borra reglas muertas tras comprobar con grep que ninguna plantilla las usa: .coach, .spot antiguo, .segmented, .mandate-card, .chapters, .story, .credit, .mission .requests, .brand, .alert-pill, .legend posicionada, .when, .daykind, .tenfe-next, .tenfe-live-promise, .tenfe-city-request (si alguna clase sigue en una plantilla de B, por ejemplo nextHTML en el informe mensual, consérvala).
 l) :focus-visible con contorno de 2 px del acento en todo lo pulsable; prefers-reduced-motion sin animaciones.

3. conexiones.js y tenfe.js (§2.7). En conexiones.js añade `export const GOAL_LABEL` y `export function goals(s)` exactamente como §2.7, y reescribe `nextAction(s)` con las filas «J» de la tabla de §2.7 (imperativo, ≤ 48 caracteres, siempre `{label, action, rank, ...}`, `tone:'urgent'` en suceso y consejo; s1 → `{action:'navigate', screen:'ops', fold:'ops-settings', rank:7}`; s3 → `{action:'navigate', screen:'finance', fold:'fin-account', rank:8}`; s4 → `{action:'tycoon-tab', id:'pactos', rank:9}`; s5 → `{action:'progress-tab', id:'proyectos', rank:10}`; resto como la tabla). En tenfe.js, rama `J.isNew(s)` de `nextAction`: toma la de J; si su rank > 4, calcula la fila 4a (urnas en ≤ 3 turnos y `forecast(s) < 50`) y la 4b (primer requisito sin cumplir del encargo activo de proyecto, con `T.contractDetails(s,q,q.branch,r=>E.metrics(s,r))`, etiqueta según el tipo de requisito, acción e id del propio requisito, urgent si quedan ≤ 3 turnos) y devuelve la de menor rank. tenfe-test exige que `U.nextAction(s).action` exista; B usa goals() en Progreso → Mandato.

4. app.js (solo tus funciones).
 - money/signed (§1.11): `money = x => n(x, Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 1 ? 1 : 2) + ' M€'` y signed igual con signo. PAGES = {network:'Red', fleet:'Flota', finance:'Dinero', story:'Despacho', progress:'Progreso'}; ALIASES.press = ['progress','progressTab','news'] y ALIASES.archive = ['progress','progressTab','news'] (B pinta la pestaña news); ICONS.menu = '<path d="M4 7h16M4 12h16M4 17h16"/>'; ui.details = new Set(); `const PHONE_MQ='(max-width: 860px) and (min-height: 501px), (max-width: 599px)'`.
 - fold(key,label,html) → `<details class="fold" data-key="${key}" ${ui.details.has(key)?'open':''}><summary>${label}</summary>${html}</details>` (junto a icon()). Manejador de clic en <summary> (document, fase de captura): suena sfx 'toggleOn'/'toggleOff' según el estado previo y, si el <details> tiene data-key, actualiza ui.details. Así todo plegable (también Capas y la Banda sonora) suena y sobrevive al repintado.
 - RailMap: isVisible usa body.ui-phone en vez de innerWidth<=760; getViewport: left 12, right innerWidth−20, top = max(.hud bottom, #mission bottom, .map-tools bottom si está visible en teléfono)+14, bottom = min(#daybar top, #navigation top, top de la ficha en teléfono si está abierta)−16 (mapa-voces exige que el encuadre contenga mad, bcn, aco, mal, cad y sev).
 - renderHud (§2.6): «Turno N» en #date (fin: «Fin del mandato»); #resources con dos botones: Caja (`data-action="navigate" data-screen="finance"`, formato §1.11 y la tendencia ▲/▼ con un decimal en verde/rojo, `title` «Resultado por turno: …») y Apoyo (`data-action="tycoon-tab" data-id="apoyo"`, entero, rojo < 50). Etiquetas «Caja» y «Apoyo» ocultas visualmente por debajo de 360 px (quedan en aria-label). Solo escribe innerHTML si cambia. renderClock: no falla si #clock no existe y sigue actualizando body[data-sky].
 - renderNav: 5 secciones + «Menú» (`data-action="menu-open"`, icono menu, aria-expanded); puntos de aviso: Red = incidencias alcanzadas sin resolver, Despacho = directionCount(state) > 0 o suceso o decisión pendiente; sin número (el recuento en aria-label). #menu-pop siempre en el DOM dentro de #navigation, `hidden` salvo con menuPop: Guardar (save-dialog), Ayuda (help), Sonido (`id="musicBtn"` data-action="music"), Salir al menú (menu-home). renderMusicButton ya no reescribe #musicBtn (etiqueta fija «Sonido»), sigue actualizando audio-activate y los botones del diálogo.
 - renderMission (§2.7): franja con sus estados. guide cuando `tut`: «Guía · ${guideInstruction()}» (con el respaldo del contrato) y `data-action="tutorial-focus"`, sin puntos ni ▾ (en el paso 1 C pone objectiveOpen=true y el panel se ve sin ▾). alert cuando state.ops.phase==='running' y hay una incidencia alcanzada sin resolver: «${reason} · ${ruta}» + botón «Decidir» (open-incidents). surge mientras surgeAlert no caduque: «${reason} · ${ciudad}» + «Ver ciudad» (city). urgent/normal/ended con U.nextAction(state) y `data-action="tenfe-next"`; puntos y ▾ (`data-action="objective"`, aria-expanded, aria-label «Retos del mandato: N de 5»). Panel #obj-panel si objectiveOpen: título «Retos del mandato», 5 filas de J.goals (icono, GOAL_LABEL, progreso; title = nombre poético; «fase N/4» en s5), «Elecciones en N turnos · mandatos N/2», encargo activo como fila-botón «Encargo: {ruta} · N turnos ›» (tycoon-tab agenda), «Siguiente jugada: …» en gris sin botón solo si tut, «Retomar la guía» (tutorial-start) si state.tutorial?.suspended && !state.tutorial.done. No se oculta nunca con la partida empezada (solo si !state.started). Escribe innerHTML y data-state solo si cambian; no sobrescribas className.
 - renderLegend: #legend (dentro de Capas) con la leyenda completa de la capa sin frases de ayuda; #legendMini con las 3–4 primeras muestras solo en gauge/power/speed/works (hidden en el resto); actualiza el texto del summary de Capas con el nombre de la capa (o «Capas» en Tu red).
 - renderDaybar (§2.9). OJO: observer-runtime-test.mjs ejecuta en una vm el rango `function renderDaybar() {` … `function navigate(to) {`, y también `function frame(t) {` … `function checkIncidents() {` y `function currentMinute() {` … `function viewTrips() {`. Dentro de renderDaybar solo puedes usar identificadores del contexto de esa prueba (state, O, E, S, layer, playing, speedIndex, SPEEDS, clock, n, realTrips, dayType, plan, $, document.body.dataset…): nada de esc, icon, J, U, tut, fold, innerWidth, matchMedia, document.body.classList ni helpers nuevos (un SVG literal o el carácter ▶ sí). SPEEDS puede tener solo 2 entradas en la prueba. En capa real: contiene «Observación del horario real» y ningún data-action day-start/day-end/day-review/skip-month. Conserva #timeline, #timelineCanvas y drawTimeline. Pinta `<strong id="clock">` solo en jornada. Pinta el grupo de velocidades y además `<button class="speed-cycle" data-action="speed" data-id="${(speedIndex+1)%SPEEDS.length}">${SPEEDS[speedIndex][1]}</button>`; el CSS enseña uno. Quita rótulo de fase, ventana horaria y recuentos. Mantén el title de delegationHint en Cerrar turno. No metas funciones nuevas dentro de esos tres rangos ni llamadas nuevas en frame() (renderHud y renderMission ya se llaman cada segundo en jornada).
 - showAlert: sin .alert-pill. Picos → `surgeAlert={x, until:performance.now()+12000}`; incidencias: se deducen del estado; en ambos casos renderMission() y renderNav(), y la narración incident-alert/surge-alert suena sin tarjeta con `narrator.say(key)`; con un cajón abierto ya no sale el toast de texto. `case 'open-incidents'`: navigate('ops') sin tocar .alert-pill; `case 'city'`: quita su línea de .alert-pill; resetSessionView: quita la suya y reinicia objectiveOpen=false, menuPop=false, surgeAlert=null.
 - layoutChrome() (nueva, tras renderBoard): ui-phone por matchMedia(PHONE_MQ); mide el cajón y la ficha visibles; área libre = [borde derecho del cajón + gap o g, borde izquierdo de la ficha − gap o innerWidth − g]; hay mensaje = existe `#toast .narration-toast` visible. Pone en body: ui-drawer, ui-inspector, ui-wide-drawer (#drawer con .trenespop-drawer), ui-msg-reserve (hay mensaje y área libre < 340 px, o teléfono con panel abierto), ui-pop (objectiveOpen fuera de la guía || menuPop || .map-layers[open]); y en document.documentElement: --msg-left (px del área libre) y --msg-h (88 px escritorio/apaisado, 80 px teléfono en reserva; 0 si no). Llámala desde render() (antes de renderCoach), en resize, en el evento toggle de details.map-layers, desde narrator.onTray y desde un MutationObserver (attributes class de #drawer e #inspector, childList de #toast) agrupado en requestAnimationFrame.
 - render(): renderHud, renderNav, renderMission, renderLegend, renderDaybar, cajón, renderInspector, renderBoard, layoutChrome, renderCoach, narrator.updates/sync.
 - Despachador: al principio del manejador de clics, un clic fuera de #mission cierra objectiveOpen (salvo en el paso 1 de la guía), fuera de #navigation cierra menuPop y fuera de .map-tools quita `open` de details.map-layers (sin consumir el clic); un clic en una entrada de #menu-pop cierra menuPop antes de ejecutar su acción. Abrir un desplegable cierra los otros dos. `case 'objective'`: alterna objectiveOpen (no hace nada con tut) → renderMission + layoutChrome. `case 'menu-open'`: alterna menuPop → renderNav + layoutChrome y enfoca la primera entrada. `case 'tenfe-next'`: además de lo actual, `progress-tab` → ui.progressTab=id; screen='progress'; `city` → como case 'city'; si trae fold → ui.details.add(fold); abrir un cajón pone inspect=null.
 - Teclado (§2.12): 1–5 abren secciones (6 ya no); T, Espacio y +/− como hoy; con #menu-pop abierto, flechas arriba/abajo mueven el foco entre sus entradas; Esc: con un campo enfocado, quita el foco (como hoy); con un desplegable abierto (panel de objetivo fuera de la guía, Menú o Capas) lo cierra y termina — esta comprobación va ANTES de la línea `if(tut){if(event.key==='Escape')suspendTutorial();return;}`, que se queda tal cual; después, ficha/cajón como hoy; sin nada abierto, abre/cierra el Menú y devuelve el foco a «Menú» al cerrarlo. Tras abrir una sección con 1–5, el foco va al × del cajón; al cerrarla con Esc, vuelve a su entrada de navegación.
 - Borra los manejadores de #zoomIn/#zoomOut (app.js:1701–1702); conserva +/− del teclado, la rueda y #resetMap.

5. narration-runtime.js (§2.10). Bandeja de uno: solo se ve el primer hijo de #toast (CSS). toast(): si la tarjeta visible no está hablando (terminó su voz, no tiene o las voces están silenciadas), la nueva se pone delante (prepend) y la anterior se retira; si la visible está hablando, la nueva espera detrás; con más de 3 en espera, retira la más antigua en espera y cancela su voz. En pump(), si la petición tiene toastInstance, mueve su nodo al principio de la bandeja para que texto y voz coincidan. La caducidad empieza cuando la tarjeta pasa a ser la visible: 4,2 s tras terminar su voz, 6 s si no tiene o están silenciadas; :hover/:focus-within la detienen (no programes el temporizador en la creación de una tarjeta en espera). updateTray() pinta «+N» (span.narration-more dentro de la cabecera de la tarjeta visible) y llama a `this.onTray?.()`. positionTray() deja de escribir `bottom` en línea (lo hace style-v3.css) sin romper sync(). Nuevo método say(key): encola la voz sin tarjeta (where 'toast', prioridad 20). toast() añade la clase has-figure al nodo si el texto de detalle contiene una cifra. Con un diálogo abierto, la tarjeta modal-toast se inserta antes de `.actions` del diálogo si existe (si no, al final de .content, como hoy); releaseModalToasts() aplica al devolverlas a #toast la misma regla de «una visible / cola de 3». modal() no inserta su tarjeta ni encola su voz cuando document.body.classList.contains('guided-turn'). No cambies el marcado de card(), header() ni controls(), ni las claves de detección de modal(): las pruebas leen .narration-speaker strong, [data-action="narration-replay"], [data-action="narration-dismiss"], [data-narration-key], .narration-card [data-say] y #toast .narration-card. narration-test.mjs (toastKey, newsKey, keyForText) debe seguir pasando.

6. narration.css. Tarjeta compacta (§2.10): retrato 32×38; cargo (`small`) oculto en #toast; la palabra «Escuchar» oculta visualmente en #toast (queda ▷ con su aria-label); `.narration-details>span{display:none}`; `.narration-toast:not(.has-figure) .narration-details{display:none}`; detalle en una línea; texto a 3 líneas salvo .talking, :hover y :focus-within; `#toast .narration-toast:not(:first-child){display:none}`; #toast sin max-height de pila ni bottom fijo (lo coloca style-v3.css); ▷ y × de var(--tap); tarjeta dentro de diálogos compacta (retrato 28, sin cargo, sin borde propio). Borra de este archivo las reglas `.tour-coach …`, `.tour-narration` y `.entry-welcome …` (y la parte `.tour-coach.talking` de la regla del retrato): C las redefine en induction.css con prefijo #coach / #entry-welcome.

7. sfx.js: añade al final `Object.assign(ACTIONS,{'objective':'tab','menu-open':'nav'});`.

PRUEBAS. Ejecuta y mantén verdes sin editarlas: `npm test` en iberia-ferroviaria/proyecto (incluye test.mjs §11: toda acción con receta), `node observer-runtime-test.mjs`, `node narration-test.mjs`, `node tenfe-test.mjs`, `node conexiones-test.mjs`, y `node iberia-ferroviaria/proyecto/tools/voice_dialogues.mjs | sha256sum` = 6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f. Comprueba a mano o con iberia-ferroviaria/investigacion/ui-esencial/checker.mjs, sirviendo con `python3 -m http.server <puerto> --bind 127.0.0.1 --directory iberia-ferroviaria` y abriendo /proyecto/dist/index.html, a 1440×900, 1280×720, 844×390, 390×844 y 320×640: pantalla base ≤ 28 palabras y ≤ 5 cifras; ningún solape con cajón, ficha, ficha de ciudad, Trenes Pop, desplegables abiertos y mensajes; la franja de objetivo visible con cualquier panel; el mensaje queda ≥ 8 px por encima de #daybar; un solo mensaje visible; ningún blur; sin desbordamiento horizontal en teléfono; teclado según §2.12. Rompe a sabiendas (D las actualiza): `mapa-voces-ui-test.mjs` (#zoomIn), `conexiones-ui-test.mjs` (press en la navegación) y `audio-salida-ui-test.mjs` (#musicBtn dentro del Menú). En tu informe final lista los selectores que cambian para C y D: sin #zoomIn/#zoomOut/#dayKind/#dateShort, sin `press` en la navegación, sin .alert-pill, #clock solo en jornada, #legend dentro de Capas y #legendMini, #resources como div con dos botones, #menu-pop con #musicBtn, nuevas acciones objective/menu-open, clases de body (ui-phone…) y variables expuestas, y la forma de U.nextAction.

Pruebas existentes que A debe mantener verdes sin editarlas: `test.mjs` §11, `observer-runtime-test.mjs`, `narration-test.mjs`, `tenfe-test.mjs`, `conexiones-test.mjs`. Rompe a sabiendas (D las actualiza): `mapa-voces-ui-test.mjs` (`#zoomIn`), `conexiones-ui-test.mjs` (`press` en la navegación) y `audio-salida-ui-test.mjs` (`#musicBtn` dentro del Menú).

### 7.B Paneles, fichas y diálogos: recorte de contenido

PAQUETE B · Paneles, fichas y diálogos: recorte de contenido, pestañas de una fila en la cabecera, desplegables de un nivel, filas en lugar de tarjetas, estados vacíos y botón principal siempre visible.

Lee antes /tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/ui/UI-ESENCIAL.md: §1, §3.3–3.7, §4 entero (4.1–4.6), §6.4 y §7.0. Repo /home/user/putarenfe, rama main (base bae2876, código igual a c903d0a); fuente en iberia-ferroviaria/proyecto/dist/ (rutas relativas a ella). No toques ningún texto grabado (§1.9): textos de diálogo, narraciones, títulos y etiquetas de las opciones del consejo y de los sucesos (vienen de story.js/encounters.js), ni los 46 mensajes literales de app.js (22 de toast('…') y 24 como último argumento de act(…, '…')).

ARCHIVOS TUYOS: paneles.css (nuevo), marketplace.css, train-refit.css, tenfe-ui.js, conexiones-ui.js, tycoon-ui.js, marketplace.js, train-refit.js, track-preview.js; en index.html SOLO la línea de <head> (añade `<link rel="stylesheet" href="paneles.css">` justo antes de `</head>`, una sola vez, después del de marketplace.css); en iberia-ferroviaria/tools/extract-game-source.mjs SOLO dos líneas: `css+='\n'+read('paneles.css');` tras la de narration.css y `html=replaceOne(html,'<link rel="stylesheet" href="paneles.css">','','panels stylesheet link');` junto a las otras; en proyecto/build.mjs, concatenar paneles.css al CSS y quitar su <link>. En app.js, SOLO: header, renderDrawer, todas las páginas (opsPage, networkPage, redPage, trainsPage, fleetPage, marketPage, worksPage, timetablesPage, financePage, drawChart, moneyPage, officePage, progressPage, pressPage, archivePage, storyPage, deskDecisionHTML, councilVoice), renderInspector (marcado de cabecera y la clase .wide), las fichas (routeInspector, updatePreview, hourHistogram, optionRow, trainInspector, stationInspector, workInspector, cityInspector app.js:406–438, tramoInspector, nodeInspector), los diálogos (dayReport, fleetDetail, refitDialog, purchaseDialog, marketListingDialog, newLineDialog, serviceDialog, saveDialog, help, musicDialog, trackDialog, workDialog, showDecision, showTenfeUpdate, menuGuide, realTripModal, showLegacy), `case 'tycoon-tab'`, `case 'press-tab'`, `case 'progress-tab'`, tus case nuevos justo después de `case 'press-tab'` (no hacen falta acciones nuevas), y tus selects en el listener `change` del documento justo tras la línea de routeStatus. No toques las funciones de A (HUD, franja, navegación, barra de turno, layoutChrome, render, narration-runtime, sayButton/syncSayButtons) ni las de C (guía, bienvenida, pick). paneles.css se carga el último: pon ahí tus reglas de contenido y las que sobrescriben las de contenido de induction.css (desk-decision, game-event, taller de vías) en vez de editar induction.css (es de C). No posiciones el armazón ni la guía (A y C). Sin `backdrop-filter` ni `blur` en ningún sitio. Solo `url('assets/…')` con comillas simples. No edites ningún *-test.mjs (son de D).

Contratos que usas de A (§7.0): fold(key,label,html) y ui.details (plegables que suenan y sobreviven al repintado; si aún no existe al empezar, define un respaldo local idéntico y avisa), con las claves exactas de §4.6; J.goals(s) y J.GOAL_LABEL en conexiones.js; ALIASES.press/archive → progress + progressTab 'news'; PAGES sin press. El marco del panel (cabecera de 48 px, fila de pestañas fuera del scroll, .body con scroll) y el fondo del diálogo los estiliza A; tú pintas exactamente el marcado del contrato de §7.0.

1. Reglas comunes (§4.1). header(title) (acepta y descarta los parámetros antiguos de antetítulo y texto) → `<header><h1>${title}</h1><button class="close" data-action="close-drawer" aria-label="Cerrar">×</button>${tabs}</header>` con `tabs` = `<div class="tabs" role="tablist">…</div>` o vacío. Cada página devuelve [head, body] con las pestañas dentro de head, fuera de .body. Ni antetítulo (.kicker), ni subtítulo, ni párrafo de introducción en ninguna pestaña, ficha o diálogo de la partida. Una sola fila de pestañas (≤ 5, ≤ 2 palabras). Filtros como `<select>` en una barra (búsqueda + 1–2 selects + 1 botón); lo secundario en fold() con resumen de 1–2 palabras y, como mucho, una cifra a la derecha. Sin tarjetas con borde o fondo dentro de los paneles (filas `.row`, `tbody tr` o `li` con línea fina), salvo fotos y fichas de Trenes Pop. Presupuestos de §6.4: «resto» del cajón ≤ 30 palabras y ≤ 4 cifras, de la ficha ≤ 40 y ≤ 8, cada fila ≤ 8 palabras y ≤ 3 cifras. Formato de cifras de §1.11 (un decimal como mucho; «turno», nunca «mes»/«mensual» en etiquetas). Estados vacíos con el texto exacto de §4.5. renderDrawer mantiene la restauración del scroll y del foco, drawChart, syncSayButtons, councilVoice y narrator.events; el envoltorio .table-scroll solo para tablas de 4 o más columnas visibles. Cajón y ficha excluyentes: cualquier camino que abra el cajón (también `case 'tycoon-tab'`) pone inspect=null.

2. Red (§3.4, §4.3). Servicios: barra con `#routeSearch`, `<select id="routeFamily">` (all «Todas», AVE, Alvia, new «Sin tren todavía» → ui.routeTab; renderDrawer(true) en el change), `#routeStatus` y el botón «Relación nueva» (new-service); filas sin cabecera de tabla: chip + nombre (`data-action="route" data-id`, la fila entera reenvía el clic al nombre), salidas («3 salidas», «Por abrir» o «Suspendida») y resultado («+1,9 M€» o «—»); fuera km, chips AVE/ALVIA/HÍBRIDO, Trenes/día, Viajeros/mes, «/12 por sentido», la frase «N relaciones · pulsa…» y la pista de desplazamiento. Conserva `#drawer [data-action="route"][data-id="madrid-valencia"]` (la guía y las pruebas lo pulsan). Jornada: incidencias con sus `data-action="respond"` arriba; fold `ops-day` «Jornada» con la puntualidad a la derecha (dentro: reloj, en circulación, programadas, primera/última en una línea), fold `ops-settings` «Ajustes» (#dayPriority, #autoPause, mismos ids), fold `ops-departures` «Próximas salidas»; fuera las 5 cifras de cabecera y el aviso de «Delegar mes»; el aviso de falta de maquinistas queda como una fila con su botón. Obras: `<select id="worksView">` → ui.worksTab (sustituye las 4 subpestañas works-tab); fuera los 3 botones de capa. Horarios: `<select id="ttDay">` → ui.ttType (sin recuentos), búsqueda de estación; fuera las 4 cifras. Competencia (tycoonPage 'market'): sin párrafo, una fila por relación. La pestaña «Jornada» se sigue llamando así (la frase grabada dice «Red → Jornada»).

3. Flota. Mi parque: fuera las 4 cifras; filas (miniatura, modelo, «6 de 12 libres», estado en palabra: «Bien» ≥ 60 %, «Gastado» 30–59 %, «Necesita reforma» < 30 %, «En taller») con el acceso al taller como botón de fila; el porcentaje exacto, en la ficha del lote. Reformas: se quedan los dos botones refit-view (Taller/Catálogo); el comparador se oculta si el modelo no tiene foto. Trenes Pop: mantiene su estilo y su `.tp-game-strip` (debe seguir existiendo `.tp-game-strip [data-action="fleet-tab"][data-id="fleet"]`); quita de marketplace.css cualquier posicionamiento de `.trenespop-drawer` (top/bottom/left/width, también el de ≤760 que tapa el HUD): el marco a ancho completo lo pone A con body.ui-wide-drawer. Pedidos: sin párrafo.

4. Dinero. Fuera las 4 cifras de cabecera que repiten el HUD; gráfico + «Resultado por turno» arriba; folds `fin-account` «Cuenta del turno», `fin-loans` «Préstamos» (borrow/repay), `fin-maint` «Mantenimiento» (#maintenance), `fin-forecast` «Previsión» (3 turnos). Cambia «mes»/«mensual» por «turno» en las etiquetas de UI (no en textos grabados).

5. Despacho (§4.3). Pestañas Agenda, Apoyo, Pactos, Personal (id people; hoy «Políticas»), Cloacas. Agenda en este orden: decisión del consejo (deskDecisionHTML sin el antetítulo «Consejo de dirección · decisión pendiente», sin el cargo y sin el elemento .say-caption: queda el nombre y el botón ▷ con aria-label; syncSayButtons no se toca porque ya no encuentra .say-caption), suceso (JUI.eventHTML sin antetítulo; imagen ≤ 160 px de alto en paneles.css), Encargos, Peticiones de ciudad (de state.requests, cada una como fila-botón `data-action="city"` con «Ciudad» y «+N M€» o «k de 3 cierres» a la derecha), fold `agenda-history` «Historial del mandato» (sin recuento en el resumen). Sin nada pendiente: «Nada pendiente. Cierra el turno cuando quieras.». En tycoon-ui.js quita el banner «Un plan para el próximo mes» y sus cifras, la sección «Elige el ritmo de tu gestión» con su botón skip-month, «Próximos pasos» y el `skip-month` «Delegar mes y comprobar progreso» de contract-next; mueve «El equilibrio del consejo» (grupos, «Negociar · 8 M€») a Apoyo junto a la encuesta y «Elecciones en N turnos», con los grupos como barras sin cifra. Encargos compactos: cabecera (retrato 40, título, «Decide en N turnos» o «N turnos» si está activo), la línea grabada con su ▷ (no pintes `data-say-text` ni texto visible en el botón say; conserva data-action="say", aria-label y title), y para los ofrecidos dos filas visibles «Servicio público · Premio N M€ · [Aceptar servicio público]» y «Apuesta comercial · Premio N M€ · [Aceptar apuesta comercial]» dentro de `.contract-branches` (la guía pone su anillo ahí y la prueba pulsa tycoon-public); requisitos, material, bonus y penalización en fold `agenda-conditions-${q.id}` «Condiciones». Deben seguir apareciendo en el HTML de tycoonPage (aunque sea dentro de un <details> cerrado) los textos que fija tycoon-contract-test.mjs: «Margen del servicio» y «Ocupación de plazas» (etiquetas de requisitos), `Objetivo opcional · +${reward} M€` (resumen del bonus), «Historial del mandato» y la fecha when(s,q.month); y no deben aparecer «Tarifa máxima» en la rama pública ni «Servicio preparado.» con requisitos sin cumplir. Personal: conserva `.figures` con «Maquinistas» y «Necesarios» visibles arriba, en una sola línea sin tarjetas (la guía los señala). Pactos y Cloacas sin párrafos de introducción; Pactos vacío: «Sin pactos abiertos.».

6. Progreso. Pestañas Mandato, Hitos, Investigación, Megaproyectos, Noticias (progress-tab news). Mandato (JUI.campaignHTML): filas con miniatura 64 px, GOAL_LABEL, progreso de J.goals («fase N/4» en s5), premio y estado, con el nombre poético en la propia fila (segunda línea pequeña) para que se lea al tocar; mandatos y elecciones; fuera «Cinco retos, una compañía» y el bloque «Cómo se juega» (va a Ayuda); con los cinco cumplidos: «Retos completos. Gana las elecciones.». Hitos, Investigación y Megaproyectos con fotos de 96 px y el botón de cada fila visible; conserva 18 `article` dentro de `.game-research`, 6 dentro de `.game-megas`, y los botones game-research/tycoon-research/tenfe-mega con sus data-id. Noticias: `<select id="newsView">` con paper «Gaceta», journal «Diario», reports «Informes», messages «Mensajes»; Gaceta = JUI.newsHTML (las `.game-event` siguen ahí), Diario = archivePage, Informes = N.card('turn-report') + TenfeUI.reportHTML, Mensajes = últimos 30 registros de narrator.log con phase 'queued' y where 'toast'/'modal-toast', del más nuevo al más viejo (retrato pequeño, nombre, texto); vacíos: «Aún no hay noticias.» / «Aún no hay mensajes.». `case 'press-tab'` y `case 'tycoon-tab'` con id 'paper' llevan a Progreso → Noticias; `case 'progress-tab'` acepta news. pressPage puede quedarse como alias interno.

7. Fichas (§3.3, bocetos de §4.3). renderInspector: cabecera `<header><h2>${title}</h2><button class="close" data-action="close-inspector" aria-label="Cerrar">×</button></header>` sin antetítulo, también para la ciudad (h2 con class="city-title"; deja de poner .wide; desaparecen el × flotante y la cabecera ilustrada grande). Relación: el formulario `#routeForm` primero (Material #routeFleet con opciones «AVE Velaro · 6 libres», el estado solo si < 50 % «· gastado», incompatibles apagadas con su motivo; «Salidas por sentido» #frequency con #freqOut mostrando solo el número actual; «Tarifa» #fare; «Previsión» #routePreview; y el pie de botones), con las etiquetas exactas «Plan de servicio», «Aplicar plan», «Abrir servicio · 4 M€» y «Suspender»; updatePreview muestra 2 datos: «+0,3 M€/turno · necesita 2 trenes» (o el motivo en rojo si no se puede; conserva el enlace «Compra uno que sí» con market-route); folds `route-details` «Detalles» (estado, longitud, trayecto, qué puede circular en una línea por tipo con ✓/✗ y motivo, histograma, frente a la carretera, viajeros, ocupación, «Ver sus trenes») y `route-upgrade` «Mejorar» con el coste a la derecha (upgrade y nivel); fuera «Encuadrar». Ciudad: peticiones/incidencias/picos arriba (cada una como fila-botón), conexiones como filas con selector «− N +» (chip, destino con data-action route, freq-down, salidas, freq-up; cerradas con «Abrir» open-route), folds `city-station` «Estación» (station-up, nivel a la derecha), `city-data` «Datos» (habitantes y cifras) y `city-departures` «Salidas»; sin conexiones: «Sin conexiones todavía.»; conserva en app.js el literal exacto `Ocupación ${n(mt.occupancy * 100)} %` (verdad-test lo busca con una expresión regular; puede ir en «Datos») y no reintroduzcas «Trenes llenos». Tramo: foto de 120 px, una línea «ancho · tensión · velocidad», botón principal «Diseñar mejora de vía» (track-designer, único en el DOM), fold `tramo-works` «Obras» con los botones work. Tren, estación, obra y nodo: misma cabecera, lo esencial arriba y lo demás en fold `${tipo}-details` «Detalles». Todos los botones pequeños de las fichas (− +, ×) miden var(--tap).

8. Diálogos (§3.5). En paneles.css: `dialog#modal .modal:not(.main-menu-shell) .actions{position:sticky;bottom:0;…}` con fondo y separación, y el contenido desplazable; el botón principal de cada diálogo está dentro de .actions y se ve sin desplazar a 1440×900, 1280×720, 844×390, 390×844 y 320×640: day-next, confirm-buy, refit-detail (lote), refit-confirm, track-confirm, confirm-service, confirm-line, save-now. Sin .kicker en ningún diálogo de la partida. dayReport: h1 «Parte del día» sin fecha (la frase «El último tren ha llegado.» ya la dice la narración), conserva `.report-head` (clave de narración), anillo de puntualidad + «Resultado del día» + «Incidencias resueltas: a de b» (omitida si no hubo), tabla en fold `report-details` «Detalles de la jornada», fuera el aviso «La caja se actualiza al cerrar el mes», pie [Siguiente jornada] [Volver al mapa]. showDecision: fuera la línea de antetítulo, el cargo y el elemento .say-caption. Suceso: imagen ≤ 160 px. Trenes Pop ficha: imagen más baja y «Firmar pedido» en el pie fijo. Lote (fleetDetail): botones antes de la vista 3D o con la vista plegada. Reforma: comparador oculto sin foto. Taller de vías (trackDialog): imagen comparada con los 3 selectores al lado en escritorio y debajo en teléfono; fuera «Ilustración de la configuración…»; conserva `.track-options button` (9), `.track-proposal .track-photo[data-lanes][data-gauge][data-power]`, `.track-scene .track-photo` (2) y track-confirm. help(): exactamente el texto de §4.4 (70 palabras, contiene «Trenes Pop» como pide menu-inicio-ui-test), con `<ol class="method">` (detecta la narración help-info), el fold `help-keys` «Teclas», los botones close-modal y tutorial-start con sus etiquetas actuales («Retomar primer turno»/«Hacer el turno guiado»/«Consultar la guía») y la línea de créditos de datos. saveDialog: una línea de texto; conserva #importSave, save-now y export. musicDialog: en la partida, la misma disposición que «Opciones» de la portada (que conserva su título «Opciones»): título «Sonido» sin antetítulo, volúmenes y conmutadores de música, voces y efectos arriba, «Banda sonora» siempre dentro de `details.menu-music-library` cerrado por defecto con la lista sin pulsaciones por minuto; conserva #musicVolume, #voiceVolume, #sfxVolume, #musicMode, .tracks, music-toggle, music-next, music-play, voice-toggle, sfx-toggle, audio-reset y close-modal (los usan audio-salida-ui-test y menu-inicio-ui-test). No cambies las clases que usa narrator.modal() para elegir su narración: .report-head, .refit-modal, .track-modal, .trenespop-modal, #buyQty, #lineA, #svcA, [data-action="tenfe-shortcut-confirm"], #importSave, .method, .tenfe-news-modal, .tenfe-month-report.

9. Selectores y textos que deben sobrevivir (pruebas): conexiones-ui (progress-tab research/proyectos, .game-research article = 18, game-research[data-id=cadenciados], .game-megas article = 6, tenfe-mega[data-id=control], tycoon-tab pactos/agenda, tenfe-pact[data-id=investigacion], .desk-decision [data-action=decision], #modal [data-action=decision], .game-event e img, game-event, Trenes Pop: .trenespop, market-family[data-id=Regional], market-listing[data-id=new-r599], #buyQty, confirm-buy, #drawer.trenespop-drawer #marketRoute, .tp-fit), train-refit-ui (#drawer .tabs [data-action="fleet-tab"][data-id="refits"] — las pestañas siguen dentro de #drawer aunque estén en la cabecera —, .refit-lots img, refit-view catalogue, .refit-catalogue article = 14 e img = 28, interior-preview, #modal .refit-photo, [data-refit-slider], .refit-scene con --refit-split, .refit-references, #refitQty, refit-confirm, refit-detail), fabricantes-ui (#marketMaker, .tp-card[data-listing], .tp-photo img, .tp-detail-photo img, #modal [data-action=close-modal], #drawer .body sin desbordamiento), mapa-voces (#inspector .city-title en la ficha de ciudad; #inspector [data-action=route]; close-inspector; .desk-decision .say-btn visible con aria-pressed; .desk-decision .say-s.on), narracion-ui (`.game-event [data-action="narration-replay"]`, `.game-event` con data-narration-key), menu-inicio-ui (`.menu-music-library summary`, `.tracks`, `#musicVolume`, voice-toggle, «Trenes Pop» en menuGuide), marketplace-test y tenfe-test (cadenas de Trenes Pop: Trenespop, BCBB, ids de selects, data-listing, «Todas las unidades entran en tu parque al pagar.», id="marketRoute", «✗ Sagunt — València: 3 kV», «✓ Circula», marketRouteCount, «Circula en N de M relaciones», «Solo 25 kV», «Gasóleo · 180 km/h», tp-fit), tycoon-contract-test (§5 de este brief), verdad-test (literal de ocupación), train-refit-test (previewHTML con el nombre del modelo; quoteHTML(...).disabled sin caja). Strict mode de Playwright: track-designer, track-confirm, confirm-buy, refit-confirm, day-next, close-drawer, close-inspector, #buyQty, #frequency, #fare y #routeFleet deben seguir siendo únicos en el DOM.

PRUEBAS. Mantén verdes sin editarlas: `npm test`, `node tycoon-contract-test.mjs`, `node verdad-test.mjs`, `node tenfe-test.mjs`, `node marketplace-test.mjs`, `node train-refit-test.mjs`, y `node iberia-ferroviaria/tools/build-web.mjs` debe seguir construyendo (valida el extractor con paneles.css). Verifica a mano o con iberia-ferroviaria/investigacion/ui-esencial/checker.mjs (sirviendo iberia-ferroviaria con python3 -m http.server y abriendo /proyecto/dist/index.html) cada sección, pestaña, ficha y diálogo a 1440×900 y 390×844 con los presupuestos de §6.4 y los botones principales visibles sin desplazar. Lista en tu informe final los selectores que cambian para D: pestañas en la cabecera, selects #routeFamily/#worksView/#ttDay/#newsView, Noticias en Progreso, fichas sin antetítulo ni .wide, h1 del parte, botones say sin texto, filas .row, estados vacíos y claves de fold usadas. Verifica que `node iberia-ferroviaria/proyecto/tools/voice_dialogues.mjs | sha256sum` sigue en 6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f.

Pruebas existentes que B debe mantener verdes sin editarlas: `tycoon-contract-test.mjs`, `verdad-test.mjs`, `tenfe-test.mjs`, `marketplace-test.mjs`, `train-refit-test.mjs`, el extractor (`build-web.mjs`) y los selectores de `conexiones-ui`, `train-refit-ui`, `fabricantes-ui`, `mapa-voces-ui`, `narracion-ui`, `menu-inicio-ui` y `audio-salida-ui` listados en el punto 9 y en el punto 8.

### 7.C Guía y bienvenida

PAQUETE C · Guía (presentación del tutorial) y bienvenida: hueco, anillo, oscurecido sin desenfoque, caja de la guía y su colocación sin solapes, en escritorio, apaisado y teléfono.

Lee antes /tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/ui/UI-ESENCIAL.md: §1.7–1.9, §2.1, §2.4, §2.5, §2.7 (estado guide de la franja y panel de objetivo), §2.10 (mensajes), §2.11, §2.12, §5 entero (5.1–5.8), §6.1–§6.2 (lo que comprobará D) y §7.0. Repo /home/user/putarenfe, rama main (base bae2876, código igual a c903d0a); fuente en iberia-ferroviaria/proyecto/dist/. Los diálogos de la guía están grabados y NO se cambian: id, person, title y text de cada TOUR_STEPS (app.js:444–454) y las tres variantes del paso day (app.js:565) quedan byte a byte (deben seguir resolviendo con N.keyForText; si no, renderCoach lanza «Mensaje sin personaje»). Tampoco cambian el número de pasos, las condiciones ready ni validInduction.

ARCHIVOS TUYOS: induction.css; induction-runtime.js solo si fuera imprescindible (no debería). En app.js, SOLO: TOUR_STEPS (campos de UI nuevos y el texto `next`), clearCoach, tutorialChrome, startTutorial, suspendTutorial, endTutorial, tutorialNext, tutorialMark, focusTutorial, tutorialIncident, tourTarget, positionTour (el literal `function positionTour()` debe seguir existiendo: induction-test), placeCoach y guideInstruction (nuevas, en la sección de la guía), renderCoach, showWelcome, las dos guardas de la guía del manejador de clics (app.js:1489–1490), los `case 'tutorial-*'`, y en pick() solo añadir la retirada de #entry-welcome (salvo con linePicking). No toques funciones de A (HUD, franja, navegación, barra de turno, layoutChrome, render, keydown, narration-runtime) ni de B (páginas, fichas, diálogos). No edites ningún *-test.mjs (son de D).

Contratos (§7.0): A define en style-v3.css los tokens (--g, --gap, --safe-top, --safe-bottom, --msg-zone, --msg-left, --guide-h…) y la escala z (--z-chrome 30, --z-dim 50, --z-lift 52, --z-ring 54, --z-coach 56); A pone body.ui-phone (teléfono) y oculta .map-tools con body.guided-turn; A pinta la franja #mission en estado guide con «Guía · ${guideInstruction()}» y `data-action="tutorial-focus"`; A expone la variable objectiveOpen (abre el panel de objetivo) y renderMission(); A hace que narrator.modal() no inserte su tarjeta durante body.guided-turn y oculta #toast con un diálogo abierto; A oculta en teléfono la navegación y la fila de acciones durante body.guided-turn salvo con body.guide-day, y aparta paneles y bandeja con --guide-h. B deja «Siguiente jornada» en el pie fijo .actions del parte, el formulario #routeForm arriba de la ficha, .figures en Personal y los botones del encargo dentro de .contract-branches cerca del principio de la Agenda. Tú pones body.guide-day, la variable --guide-h y las clases .tour-*. Modo: usa document.body.classList.contains('ui-phone') y, para el apaisado bajo, matchMedia('(max-height: 500px) and (min-width: 600px)'); nunca innerWidth<=600 como hoy.

1. TOUR_STEPS (§5.3): añade a cada objeto los campos de UI `focus`, `ring` (cadena o null) y `do` de la tabla de §5.3 (instrucción ≤ 7 palabras, con «» como la narración) y acorta `next` a ≤ 4 palabras («Poner trenes en marcha»; la flecha « →» la sigue añadiendo renderCoach). guideInstruction() devuelve: si el paso está listo (tourReady()), «Pulsa «${next}»»; si no, el `do` vigente, incluidos los subpasos de day (preparación → «Pulsa «Comienza la jornada»», avería sin resolver → «Elige una respuesta a la avería», resuelta → «Pulsa «Hasta el último tren»», parte → «Pulsa «Siguiente jornada»»). Una función interna stageFocus() devuelve {focus, ring} vigentes (2b: #inspector sin anillo; day según fase; 8d: el diálogo; 8e: #daybar sin anillo).

2. Modelo de foco (§5.2). #tour-shades (con exactamente 4 <i>), #spot y #coach se añaden DENTRO de #game (hoy a body). Las sombras rodean el hueco y cubren el resto de la pantalla, con `pointer-events:none`, `background:rgba(11,17,26,.55)`, SIN backdrop-filter ni filter, z var(--z-dim). .hud y #mission reciben .tour-lift (z var(--z-lift)) para quedar nítidos por encima del oscurecido; .hud además queda inerte (Caja y Apoyo no responden durante la guía); #mission nunca es inerte. inert en los demás hijos de #game que no participan (el bucle salta #coach, #tour-shades, #spot y #mission); participantes nunca inertes: contenedor del hueco, #mission (y su panel), #coach, el diálogo abierto. #toast está fuera de #game y queda por encima: no lo toques. Anillo: trae el control a la vista dentro de su panel (`scrollIntoView({block:'nearest'})`) una vez por paso y subpaso (no en cada fotograma), y rodéalo (+4 px), z var(--z-ring), pointer-events none, pulso de 2 ciclos (sin animación con prefers-reduced-motion). Si el selector del anillo no encuentra un elemento visible, no hay anillo (sin errores). Cuando el paso está listo, oculta el anillo y pinta el botón siguiente con .tour-ready (pulso). En el diálogo, sin sombras ni anillo: clase .tour-control en `#modal [data-action="day-next"]`. Sin transiciones en hueco, anillo y coach (solo una entrada de opacidad de 120 ms); recalcula en render, en frame (como hoy, con la cadena de geometría como guarda; no añadas llamadas nuevas a frame()), en resize, en el scroll del .body del panel del hueco y con un ResizeObserver sobre hueco y coach; `body.guided-turn #drawer{animation:none}`. Contenedor oculto o de 0×0 → focusTutorial() (como mucho una vez cada 500 ms): desaparece el callejón sin salida de elegir otra relación o cerrar la ficha. tutorial-focus restablece además los filtros de Red en el paso 2 (como hoy focusTutorial).

3. Coach (§5.4). Conserva #coach (aside, class tour-coach, tabindex="-1") con data-step-id, `[data-action="tutorial-skip"]`, N.controls(key), el h2 con el título y `p[data-say]` con N.speechHTML(key). Cabecera: retrato, nombre y debajo .tour-dots (9 <i>, .done los pasados, .now el actual, role img, aria-label «Paso N de 9»); a la derecha ▷ y el botón «⏸ Pausar» (tutorial-skip, texto visible, var(--tap) de alto). Sin línea de instrucción (la dice la franja). Pie: solo `[data-action="tutorial-next"]` (`${next} →`), y solo cuando el paso está listo; mientras no lo está, no se pinta (las pruebas lo pulsan justo después de completar la acción del paso y Playwright espera a que aparezca). Fuera «Tu primer turno», «Guía · N / 9», «Listo para seguir» y «Hazlo en el panel marcado». Variantes: .compact (retrato 28, título 15 px, texto 12 px con 4 líneas y scroll propio, botón a la derecha del título), .docked (teléfono y apaisado bajo), .in-dialog (parte del día: franja compacta al principio de .content con retrato, nombre, ▷, Pausar y el texto en 3 líneas; sin título ni botón). Una sola caja, sin cajas dentro. Al cambiar de paso, foco a #coach (preventScroll); al aparecer el botón no robes el foco. Todos los estilos del coach y de la bienvenida en induction.css con prefijo #coach / #entry-welcome (A borra de narration.css las reglas .tour-coach/.entry-welcome; con el prefijo de id ganas igualmente). Borra de induction.css la regla de ≤600 `body.guided-turn #drawer,#inspector{bottom:300px}` (ahora manda --guide-h), las transiciones de sombras, anillo y coach, y todo blur (`#tour-shades` y `dialog#modal.tour-dialog::backdrop`).

4. placeCoach() (§5.5). Escritorio: área segura S desde --safe-top hasta innerHeight − --safe-bottom y entre --g y innerWidth − --g (lee los tokens con getComputedStyle(document.documentElement)); H = hueco + 12; R = anillo + 8 (sin anillo, R = H); obstáculos O (+8): #mission y #obj-panel si está abierto, la zona de mensajes (rect abajo a la izquierda del área libre: left = --msg-left, bottom = --safe-bottom, alto --msg-zone, ancho min(--msg-w, área libre); siempre, aunque no haya mensaje), cada `#toast .narration-toast` visible, desplegables abiertos. Candidatos: derecha de H (top = R.top − 24, ajustado a S; si corta un obstáculo, deslízalo hacia abajo hasta quedar bajo él si sigue cabiendo), izquierda de H (igual), debajo de H centrado en R, encima de H centrado en R, y las cuatro esquinas de S; prueba en modo normal y luego .compact; elige el primero que cabe en S y no corta H, R ni O. Último recurso: acoplar como en teléfono. Teléfono y apaisado bajo: siempre .docked y .compact, left/right --g, bottom --safe-bottom, max-height min(240px, 38dvh); pon `--guide-h` = alto del coach + gap en document.documentElement (A acorta paneles y sube la bandeja con esa variable); en el paso day pon body.guide-day (A muestra entonces la fila de acciones en teléfono). clearCoach borra --guide-h, body.guide-day, .tour-lift, .tour-control, .tour-ready y el inert de .hud.

5. Pasos especiales. Paso 1 (welcome): focusTutorial pone objectiveOpen=true (variable de A) y renderMission(); el hueco es la unión de #mission y #mission .obj-panel; al cambiar de paso, objectiveOpen=false. Paso 8d (parte): el coach entra en `#modal .content` como .in-dialog (la prueba exige `#modal #coach` = 1); no hay segunda tarjeta narrada (A la omite en la guía). Paso 9: el anillo sobre la primera `#drawer .contract-branches` de un encargo ofrecido. startTutorial(): además de lo de hoy, objectiveOpen=false antes de focusTutorial (el paso 1 lo vuelve a abrir). endTutorial(): screen=null, inspect=null, objectiveOpen=false, render(), y el mensaje grabado «El mando es tuyo…» como hoy. suspendTutorial(): como hoy (mensaje «Guía en pausa…»); reanudación desde Menú → Ayuda (tutorial-start) y desde «Retomar la guía» del panel de objetivo (lo pinta A; comprueba que startTutorial funciona desde ahí). La guarda de skip-month durante la guía se queda. La pausa con Esc la gestiona A en el keydown (primero cierra desplegables).

6. Bienvenida (§2.11): showWelcome conserva N.header, el texto grabado y el botón (no cambies las claves welcome/welcome-resume ni su N.header/N.speechHTML; narracion-ui-test lee `#entry-welcome .narration-speaker strong`; menu-inicio y audio-salida pulsan `[data-action="welcome-close"]` y `#entry-welcome [data-action="narration-replay"]`), pero quita el antetítulo (.kicker) y el h2 («Un país por conectar.» / «De nuevo al mando.»); la imagen solo en escritorio y apaisado. En induction.css: escritorio top var(--safe-top), centrada (left 50%, translateX(−50%)), ancho min(400px, 100vw − 2·--g), imagen de 120 px de alto con object-fit cover, z var(--z-chrome), sin blur; teléfono left/right --g, top var(--safe-top), sin imagen, alto máximo el del área principal con scroll propio. pick() retira #entry-welcome al pulsar el mapa (las acciones ya la retiran, salvo welcome-close, narration-replay y narration-dismiss, como hoy).

7. Verificación. Ejecuta y mantén verdes sin editarlas: `npm test`, `node induction-test.mjs`, `node observer-runtime-test.mjs` y `node iberia-ferroviaria/proyecto/tools/voice_dialogues.mjs | sha256sum` = 6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f. Recorre la guía completa a mano o con iberia-ferroviaria/investigacion/ui-esencial/checker.mjs (sirviendo iberia-ferroviaria con `python3 -m http.server <puerto> --bind 127.0.0.1` y abriendo /proyecto/dist/index.html; Chromium y argumentos de §6.2) a 1440×900, 1280×720, 844×390, 390×844 y 320×640, antes y después de cada acción: ningún solape entre cajas de primer nivel; nada borroso; el control del anillo visible sin desplazar; el coach sin tapar hueco, anillo, franja ni mensajes; un mensaje (por ejemplo tras «Aplicar plan») nítido y pulsable; el botón siguiente solo cuando el paso está listo; «Siguiente jornada» visible sin desplazar en el parte. Ejecuta también, sin editarlas, `conexiones-ui-test.mjs` y `narracion-ui-test.mjs` (con NODE_OPTIONS="--import file:///tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/tools/pw-register.mjs" si importan 'playwright'); si fallan solo por selectores que D actualiza (press en la navegación), anótalo; si fallan por la guía, arréglalo. En tu informe final lista para D: los campos nuevos de TOUR_STEPS, guideInstruction(), la ausencia del botón siguiente hasta listo, las clases .tour-* y cuándo se ponen, y cualquier caja de A o B que impida cumplir §5 (con caja, resolución, paso y captura).

Pruebas existentes que C debe mantener verdes sin editarlas: `induction-test.mjs` (literal `function positionTour()`), `observer-runtime-test.mjs` (sin llamadas nuevas en `frame`), `test.mjs` §11 y las aserciones de guía de `conexiones-ui-test.mjs` y `narracion-ui-test.mjs` (`#tour-shades i` = 4, `#coach [data-action="tutorial-next"]`, `data-step-id`, `#modal #coach` = 1, `#coach,#tour-shades,#spot` = 0 al pausar y al terminar).

### 7.D Pruebas automáticas

PAQUETE D · Garantías automáticas: línea base, comprobador de solapes/desenfoque/objetivo/presupuestos, prueba de interfaz esencial en cinco resoluciones, prueba estática en node y actualización de las pruebas existentes.

Lee antes /tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/ui/UI-ESENCIAL.md entero, con atención a §2 (cajas, zonas, estados de la franja, mensajes, teclado), §4.5–4.6, §5 (guía), §6 entero (6.0–6.6) y §7.0. Repo /home/user/putarenfe, rama main (base bae2876, código igual a c903d0a); proyecto en iberia-ferroviaria/proyecto/. Escribes las pruebas contra los contratos del documento mientras A, B y C implementan; al final las haces pasar sobre el árbol integrado.

ARCHIVOS TUYOS: proyecto/tools/ui-check.mjs (nuevo), proyecto/ui-esencial-ui-test.mjs (nuevo), proyecto/ui-esencial-test.mjs (nuevo), proyecto/package.json (solo añadir `&& node ui-esencial-test.mjs` al final del script `test`) y TODAS las ediciones de *-test.mjs existentes. No toques nada de proyecto/dist/ ni las herramientas de publicación. Las capturas van a outputs/tenfe-qa/ui-esencial/ (ignorado por git; compruébalo con git check-ignore y, si no lo está, no las añadas al commit).

1. Línea base (§6.0). Crea un árbol de trabajo de la base: `git -C /home/user/putarenfe worktree add /tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/ui-base bae2876`. Allí, una a una (swiftshader satura 4 núcleos), ejecuta todas las *-ui-test.mjs de §6.5 con NODE_OPTIONS="--import file:///tmp/claude-0/-home-user/c6eeaca5-1c4f-5640-be06-45b3acf7366c/scratchpad/tools/pw-register.mjs" cuando importen 'playwright', y anota cuáles pasan y el primer error de las que no. Desde la base (`git show bae2876:iberia-ferroviaria/proyecto/dist/app.js`, `…/narration-data.js`) calcula y fija como constantes en ui-esencial-test.mjs: el sha256 de JSON.stringify(STATIC_MESSAGES) y de JSON.stringify(MESSAGES) de narration-data.js; la lista de los 46 mensajes literales de app.js (22 primeros argumentos literales de `toast('…')` y 24 últimos argumentos literales de `act(…, '…')`); y los `{id, person, title, text}` de los 9 TOUR_STEPS. Al terminar, retira el árbol de trabajo (`git worktree remove`).

2. tools/ui-check.mjs (§6.1): port de iberia-ferroviaria/investigacion/ui-esencial/checker.mjs con boxes, overlaps, noBlur, dimmed, objective, focus y text exactamente como §6.1 (lista de cajas según body.ui-phone; desplegables aparte; con diálogo abierto solo su interior; noBlur sobre todo elemento visible y sobre dialog#modal::backdrop; focus con la regla «≥ 90 % visible, o llena ≥ 90 % de la parte visible del contenedor desde su borde superior»; text separando filas `tbody tr`/`.row`/`li` del resto y excluyendo textos grabados `[data-say]`, `.narration-card p`, `.desk-decision p`, `.game-event p`, `.say-s`, `.choice` y `.trenespop`). Funciones puras que reciben `page` y devuelven listas de problemas (vacía = bien), para usarlas con assert.deepEqual(…, []) y con mensajes que nombren caja, resolución y paso.

3. ui-esencial-ui-test.mjs (§6.2 y §6.4): Playwright importado de process.env.PLAYWRIGHT_MODULE o /opt/node-tools/node_modules/playwright/index.mjs, Chromium de CHROMIUM_PATH o `ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome | head -1`, argumentos --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --autoplay-policy=no-user-gesture-required; servidor HTTP propio de process.env.UI_ROOT (por defecto iberia-ferroviaria/, la build publicada; para desarrollar, UI_ROOT=iberia-ferroviaria/proyecto/dist) como conexiones-ui-test.mjs; reducedMotion 'reduce' y la guarda de mapa estático de onboarding-ui-test/drive.mjs (QA_STATIC_MAP). Resoluciones 1440×900, 1280×720, 390×844 y 320×640 para los cinco recorridos de §6.2 (guía completa paso a paso, partida sin guía por todas las secciones/pestañas/fichas/diálogos, estrés de 4 mensajes con textos grabados, teléfono y teclado), y 844×390 para el recorrido corto de §6.2; overlaps y noBlur en cada estado; presupuestos de §6.4 (pantalla base ≤ 28 palabras y ≤ 5 cifras; barra superior ≤ 6/≤ 4; franja ≤ 10/≤ 2; cajón resto ≤ 30/≤ 4 y fila ≤ 8/≤ 3; ficha resto ≤ 40/≤ 8; caja de la guía sin texto grabado ≤ 8 palabras; textos prohibidos de §3.7). Imprime un resumen por resolución y guarda una captura por estado que falle. Si una aserción nueva falla por una caja de A, B o C, describe el fallo con la caja, la resolución, el paso y la captura en tu informe; no relajes el umbral.

4. ui-esencial-test.mjs (node, §6.3), añadido al final del script `test` de package.json: todas las comprobaciones estáticas de §6.3, incluidos los valores fijados en el punto 1, el sha256 de la salida estándar de `node tools/voice_dialogues.mjs` (ejecutada con child_process) = 6348984c61499234ecf0965f976591250f106948968b600bc4325c514884098f, ningún `blur(` en los CSS que carga index.html, y U.nextAction en las partidas sembradas de §6.3 (usa el motor real: E, J, U, T con bind como en tenfe-test.mjs).

5. Pruebas existentes (§6.5). conexiones-ui-test.mjs: quita 'press' de la lista de secciones (línea 41) y comprueba Progreso → Noticias (progress-tab news); conserva `#tour-shades i` = 4, `#coach [data-action="tutorial-next"]`, data-step-id, `#modal #coach` = 1, `#modal .induction-dialog` = 0 y `#coach,#tour-shades,#spot` = 0. mapa-voces-ui-test.mjs: `#zoomIn` (línea 70) → `page.keyboard.press('+')` y la misma comprobación de zoom; #resetMap se queda. audio-salida-ui-test.mjs: antes de cada `page.locator('#musicBtn').click()` (líneas 118 y 136), `await page.locator('[data-action="menu-open"]').click()`. narracion-ui-test.mjs: la comprobación de colocación (mensaje ≥ 8 px sobre #daybar) debe pasar tal cual en 1440 y 390; adapta solo si una tarjeta en espera rompe un localizador estricto. fabricantes, train-refit y menu-inicio: sin cambios salvo selector roto. Del resto (tenfe-ui, gameplay-ui, red-ui, onboarding-ui, nueva-partida-ui, contract-progression-ui, ui-test, rescate-ui, voice-*-ui): solo si pasaban en la base, adáptalas sin perder la intención; si ya fallaban, no las toques.

6. Puerta (§6.6), sobre el árbol integrado (A+B+C), en este orden: `npm test`; `node observer-runtime-test.mjs && node induction-test.mjs && node verdad-test.mjs && node tycoon-contract-test.mjs`; `node tools/voice_dialogues.mjs | sha256sum`; `node ../tools/build-web.mjs`; y una a una ui-esencial-ui-test (primero con UI_ROOT=iberia-ferroviaria/proyecto/dist y después con la build publicada), conexiones-ui, narracion-ui, mapa-voces-ui, audio-salida-ui, fabricantes-ui, train-refit-ui, menu-inicio-ui y cualquier otra *-ui-test.mjs que pasara en la base. Mientras A, B y C no estén integrados, desarrolla contra proyecto/dist con lo que haya y marca como pendientes las aserciones que dependan de su trabajo; no las desactives. En tu informe final: la tabla de la línea base, el resultado de cada suite, y cada fallo restante con caja, resolución, paso y captura.

Pruebas que D crea: `tools/ui-check.mjs`, `ui-esencial-ui-test.mjs`, `ui-esencial-test.mjs`. Pruebas que D actualiza: `conexiones-ui-test.mjs`, `mapa-voces-ui-test.mjs`, `audio-salida-ui-test.mjs`, `narracion-ui-test.mjs` (si hace falta), las que pasaban en la base y se rompan por un selector, y `package.json` (script `test`).
