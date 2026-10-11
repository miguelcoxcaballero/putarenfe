# Auditoría visual de la UI en partida: Tenfe Conexiones 6.5.2

Build publicado (`iberia-ferroviaria/index.html`, commit `c903d0a`, igual a `proyecto/dist`), servido en `http://127.0.0.1:8150/`. Sesión completa con Playwright y Chromium 1194 (swiftshader), con voces activadas como un jugador real, a **1440×900, 1280×720 y 390×844**. El recorrido: portada → Nueva partida → los 9 pasos de la guía (con capturas antes y después de cada acción) → pantalla en reposo → capas del mapa → fichas de ciudad, relación y tramo → las 6 secciones y sus 23 pestañas o subpestañas → Trenes Pop y su ficha de compra → lote y reforma de tren → taller de vías → Despacho/consejo → Cerrar turno → suceso ilustrado → jornada con incidencia → parte del día → Guardar, Ayuda, Música → portada en partida y Opciones → partida sin guía (panel de bienvenida) → Continuar.

Las capturas enlazadas están en esta carpeta; el resto de la sesión quedó fuera del repositorio.

- Capturas e informe JSON por paso: `shots/<ancho>x<alto>/NNN-nombre.png|json`, con `reports.json` y `summary.txt` en cada carpeta. Primeras pasadas conservadas: `shots-1440x900-run1/` y `shots-390x844-run1/`.
- Comprobador reutilizable: `checker.mjs`. Conductor de la sesión: `drive.mjs` (`node drive.mjs 1440x900`). Tablas: `report.mjs`. Desbordes de la barra inferior y del HUD en móvil: `navcheck.mjs`.
- Nota: para abrir Trenes Pop la prueba sube la caja a 2000 M€. Las capturas posteriores muestran esa caja artificial.

---

## 1. Lo que más falla (por gravedad)

1. **La guía desenfoca cajas que salen a la vez y las tapa con su propia caja.** Las sombras de la guía (`#tour-shades i`, `backdrop-filter: blur(3px) brightness(.8)`, z-index 40) quedan encima de los mensajes narrados (`#toast`, z 30), de la píldora de incidencias (`.alert-pill`, z 8) y del panel de bienvenida (z 8). Cuando un mensaje coincide con un paso de la guía, sale borroso y la caja de la guía lo tapa casi entero:
   - 1440: en el paso 8, tras responder, el mensaje queda **100 % borroso y tapado al 83 %** por la caja de la guía ([1440](shots/1440x900/019-guia-8-day-respondida.png)). En el paso 9 aceptado, el mensaje queda **100 % borroso** ([1440](shots/1440x900/023-guia-9-handoff-aceptado.png)).
   - 390: en el paso 7, «Plan de servicio actualizado» queda **100 % borroso y tapado al 75 %** ([390](shots/390x844/016-guia-7-infrastructure-abierta.png)). También queda borroso en el paso 8 ([390](shots/390x844/019-guia-8-day-respondida.png)) y en el 9, con un 75 % borroso y la mitad tapada ([390](shots/390x844/023-guia-9-handoff-aceptado.png)).
   - Al pulsar «Aplicar plan» o «Abrir servicio», el mensaje narrado cae **encima del panel resaltado**: 48.555 px², el 93 % del mensaje sobre el inspector. Su borde izquierdo queda bajo el desenfoque ([1440](shots/1440x900/009-guia-3-offer-aplicado.png), [1440](shots/1440x900/016-guia-7-infrastructure-abierta.png)).
2. **El control que pide la guía no se ve sin desplazarse.** La guía resalta el panel entero, no el control. En 1440 y 1280:
   - Paso 3: salidas, tarifa y «Aplicar plan» quedan bajo el pliegue del inspector ([1440](shots/1440x900/007-guia-3-offer.png)). El `scrollIntoView` de `focusTutorial` no sobrevive al re-render.
   - Paso 7: el selector de material solo se ve al 10 % y el resto no se ve ([1440](shots/1440x900/014-guia-7-infrastructure.png)).
   - Paso 8, parte: «Siguiente jornada» queda bajo el pliegue del diálogo ([1440](shots/1440x900/020-guia-8-day-parte.png)).
   - Paso 9: los botones para aceptar el encargo quedan bajo un banner y bajo el bloque «Elige el ritmo de tu gestión», que tiene su propio botón «Delegar mes» ([1440](shots/1440x900/022-guia-9-handoff.png)).
   - En 390: la fila Madrid — València queda fuera de la zona visible ([390](shots/390x844/005-guia-2-network.png)), «Aplicar plan» se ve al 13 % ([390](shots/390x844/007-guia-3-offer.png)) y las respuestas a la incidencia al 23 % ([390](shots/390x844/018-guia-8-day-incidencia.png)).
3. **Los mensajes narrados se apilan sin límite.** Cada uno ocupa unas 25–40 palabras y repite el texto en un bloque «Detalle». Siguen en pantalla hasta que termina la voz y 4,2 s más. Tras «Cerrar turno» se ven 3 o 4 a la vez ([1440](shots/1440x900/083-suceso-ilustrado.png), [1440](shots/1440x900/085-suceso-resuelto.png)).
   - En escritorio tapan los botones de zoom y el mapa. En 1280×720, cuatro mensajes antiguos («Turno cerrado», «Decisión aplicada» ×2…) siguen en pantalla durante la jornada y **tapan el 99 % de «Capas» y del zoom**, junto a la píldora de incidencia ([1280](shots/1280x720/089-jornada-alerta-incidencia.png)).
   - En móvil **tapan por completo las opciones del suceso**, el 50 % del cajón ([390](shots/390x844/084-suceso-opciones.png)).
   - Duplican avisos: la píldora de incidencia y el mensaje «Tenemos una incidencia… / Detalle: Fallo de tracción» salen a la vez ([`shots-1440x900-run1/091-jornada-reproduciendo-30x.png`](shots-1440x900-run1/091-jornada-reproduciendo-30x.png), [1440](shots/1440x900/092-jornada-reproduciendo-30x.png)), y «Decisión aplicada a tu compañía» sale dos veces ([1440](shots/1440x900/089-jornada-alerta-incidencia.png)).
4. **El objetivo no está claro.**
   - El único «qué hago ahora» es el botón «Siguiente» al final del panel de misión. Compite con cinco retos de nombre poético sin requisito («Algo que queda», «Prometer, cumplir, repetir»), con una frase de relleno, con el encargo «En marcha» y con una petición de ciudad.
   - Durante la guía, «Siguiente: Escuchar al consejo» contradice el botón de la guía, «Explorar mi red» ([1440](shots/1440x900/003-guia-1-welcome.png)). Después, «Abrir León — Gijón» no tiene que ver con el encargo activo, Madrid — Alicante ([1440](shots/1440x900/034-ficha-ciudad-madrid.png)).
   - **El panel de misión desaparece con cualquier menú abierto**, y con cualquier ficha si la pantalla mide menos de 1200 px de ancho.
   - En móvil, el panel se corta a 170 px y «Siguiente» queda oculto ([390](shots/390x844/003-guia-1-welcome.png)).
   - **En 1280×720, la leyenda tapa la parte baja del panel de misión** (6.576 px², la leyenda queda encima). El panel también se recorta por su altura máxima, `calc(100vh - 308px)`, así que **«Siguiente» no se ve sin desplazarse dentro del panel** ([1280](shots/1280x720/026-pantalla-principal-sin-paneles.png)).
5. **Bloqueo en móvil: la ficha de ciudad mide 7.647 px de alto y su parte superior queda en y = −6.968.** La cabecera y el botón × quedan fuera de la pantalla y la ficha no se puede cerrar ([390](shots/390x844/034-ficha-ciudad-madrid.png)).
6. **Paneles que tapan herramientas.**
   - En escritorio, cualquier ficha tapa el 100 % de «Capas» y del zoom (12.691 px²). El cajón tapa la leyenda (30.240 px²).
   - En móvil, el cajón tapa por completo «Capas» y el zoom. Tras la guía, el Despacho se queda abierto y no deja abrir «Capas» (primera pasada, `shots-390x844-run1/ERR-025-capas-open.png`).
   - Los mensajes narrados tapan el zoom (hasta 17.149 px² en móvil).
7. **Pestañas dentro de pestañas, y las pegajosas se tapan entre sí.** Red tiene una fila de pestañas (Servicios/Jornada/Obras/Horarios/Competencia) y otra dentro (Todas/AVE/Alvia/Sin tren todavía). Al desplazarse, la fila interior se pega encima de la de sección. Hay que volver arriba para cambiar de sección. Con el cajón desplazado 900 px, el centro de la pestaña «Jornada» lo ocupa el botón «Alvia» de la fila interior y `page.click` agota el tiempo ([evidencia-pestanas-pegajosas-1440.png](evidencia-pestanas-pegajosas-1440.png), `node evidence.mjs`).
8. **El botón principal de cada diálogo queda bajo el pliegue, también en 1440.** Pasa en «Firmar pedido» de Trenes Pop ([1440](shots/1440x900/072-trenespop-ficha-compra.png)), «Comparar reforma» del lote ([1440](shots/1440x900/073-flota-ficha-lote.png)), «Confirmar reforma» ([1440](shots/1440x900/074-reforma-tren.png)), «Adjudicar mejora» del taller ([1440](shots/1440x900/078-taller-vias-propuesta.png)) y «Siguiente jornada» del parte. Este último se ve en 1440 en partida normal ([1440](shots/1440x900/093-jornada-parte.png)), pero no con la guía dentro del diálogo ([1440](shots/1440x900/020-guia-8-day-parte.png)), ni en 1280×720 ([1280](shots/1280x720/093-jornada-parte.png)), ni en 390.
9. **Tres verbos para avanzar y tres unidades de tiempo.**
   - Verbos: «Cerrar turno» en la barra de jornada, «Delegar mes» en el Despacho y «Comienza la jornada» con su ▶ al lado.
   - Unidades: «Resultado / turno» en el HUD, frente a «Resultado mensual», «Cuenta del mes», «Viajeros / mes», «+0,34 M€/mes», «24 meses · Turno 25» y «La caja se actualiza al cerrar el mes».
10. **Móvil.**
    - «Ayuda» y «Menú» quedan escondidos en la barra inferior: mide 428 px y caben 372.
    - La etiqueta «Resultado / turno» mide 70 px en una celda de 65 y se monta sobre «Apoyo» ([390](shots/390x844/026-pantalla-principal-sin-paneles.png)).
    - Las pestañas de Red se cortan en «Comp…».
    - La insignia del Despacho sustituye a su etiqueta ([390](shots/390x844/100-bienvenida-sin-guia.png)).
11. **Textos de otra versión.**
    - La Ayuda en partida es la antigua: «Un día, un turno», «cumple los capítulos para recibir dinero», 185 palabras ([1440](shots/1440x900/096-menu-ayuda.png)).
    - El HUD dice «Iberia Ferroviaria · Conexiones · al mando de Tenfe», la portada «Tenfe Conexiones» y la música «Música de Iberia Ferroviaria».
12. **Ruido general.**
    - Pantalla base sin paneles en 1440: **unas 116 palabras y 23 números**, más unas 10 horas pintadas en el lienzo de la línea de tiempo. Con un cajón o una ficha abiertos: **150–260 palabras y 25–41 números**.
    - Cada cajón repite el nombre de la sección con un antetítulo («Servicios, vías y horarios / Red», «Objetivos abiertos desde el primer turno / Progreso»).
    - Columnas siempre vacías: «Trenes / día» muestra «—» en las 98 filas.
    - Etiquetas AVE/ALVIA/HÍBRIDO bajo cada relación.
    - «Escuchar diálogo» escrito bajo el botón de escuchar.
    - Reloj 06:30 en el HUD fuera de la jornada.
    - Línea de tiempo, velocidades y ▶ visibles en la preparación, cuando no hacen nada.

**Lo que funciona y conviene mantener:**
- el mapa como pantalla principal;
- la píldora de incidencias arriba en el centro con «Decidir»;
- Trenes Pop, una parodia coherente con estilo propio;
- el anillo y el desenfoque como idea, siempre que no desenfoquen cajas que salen a la vez;
- «Guía · N / 9»;
- el resaltado de la frase que se está diciendo;
- el suceso ilustrado dentro del Despacho;
- el Dinero, sobrio.

No hay errores de JavaScript (`pageerror` y `console.error` vacíos en las tres resoluciones). No hay desbordamiento horizontal de página en 390 (`scrollWidth = 390` en todos los pasos). El único desborde está dentro de la barra inferior, que se desplaza en horizontal.

### Pantalla esencial que sale del inventario

- **Siempre visible:**
  - el mapa;
  - un HUD de una línea: «Turno N», Caja con el resultado por turno al lado y Apoyo;
  - **una píldora de objetivo fija**, con el texto de `nextAction()` y su botón, visible también con menús abiertos y en móvil;
  - «Capas ▾» y ⌂;
  - la barra inferior con 5 secciones y un «☰ Menú» (Guardar, Sonido, Ayuda, Salir);
  - un solo botón para avanzar: «Cerrar turno», con «Jugar jornada» como secundario.
- **Según el contexto:**
  - reloj, línea de tiempo, velocidades y ▶, solo con la jornada en curso;
  - píldora de incidencia;
  - **un único** mensaje narrado a la vez, sin «Detalle», en una zona reservada que no pise la guía, el panel resaltado ni «Capas».
- **En menús:**
  - retos con requisito y progreso (Progreso);
  - encargo activo y peticiones de ciudad (Despacho);
  - puntualidad y trenes libres (Progreso/Flota);
  - leyenda (dentro de «Capas»);
  - cuenta atrás de urnas y equilibrio del consejo (Despacho → Apoyo);
  - detalles de la relación (desplegable en la ficha).
- **En la guía:**
  - hueco y anillo sobre el control concreto, no sobre el panel;
  - desplazar ese control a la vista antes de pintar las sombras;
  - colocar la caja de la guía lejos del control **y** de cualquier mensaje o píldora;
  - mensajes y píldora por encima de las sombras (z > 40) o retenidos hasta el paso siguiente.

---

## 2. La guía, paso a paso

Leyenda: **¿Claro en 2 s?** indica si, mirando la pantalla 2 segundos, se sabe qué hacer y dónde. Todos los pasos llevan la caja de la guía (retrato, nombre, ▷, ×, título, texto, estado y botón siguiente) en una posición que se calcula en cada paso. Las sombras desenfocan todo lo que queda fuera del panel resaltado.

| # | Paso (`data-step-id`) | Panel resaltado | Lo que pide | ¿El control se ve? | Solapes y desenfoques | ¿Claro en 2 s? ¿Dónde? |
|---|---|---|---|---|---|---|
| 1 | welcome ([1440](shots/1440x900/003-guia-1-welcome.png) · [390](shots/390x844/003-guia-1-welcome.png)) | `#mission` | Leer el objetivo y pulsar «Explorar mi red» | Sí | 390: la caja de la guía cubre la barra de jornada (30.668 px²) | **No en cuanto al objetivo.** El botón de la guía está claro, pero el panel de misión ofrece otro «Siguiente» («Escuchar al consejo») y cinco retos sin requisito. En 390, «Siguiente» queda fuera del panel recortado. |
| 2 | network ([1440](shots/1440x900/005-guia-2-network.png) · [1280](shots/1280x720/005-guia-2-network.png) · [390](shots/390x844/005-guia-2-network.png)) | `#drawer` (Red) | Pulsar Madrid — València | 1440: sí, en la 3.ª fila. 1280×720 y 390: **no**, hay que desplazar | El cajón tapa la leyenda | 1440: **sí**. 1280 y 390: **no**. |
| 2b | tras elegir ([1440](shots/1440x900/006-guia-2-network-elegida.png)) | pasa a `#inspector` | «Preparar el servicio →» | Sí | El inspector tapa «Capas» y el zoom (100 %) | Sí |
| 3 | offer ([1440](shots/1440x900/007-guia-3-offer.png) · [390](shots/390x844/007-guia-3-offer.png)) | `#inspector` | Subir salidas, cambiar la tarifa y «Aplicar plan» | 1440: **no**, los tres controles bajo el pliegue. 390: el formulario sí, «Aplicar plan» al 13 % | Tras aplicar, el mensaje queda sobre el inspector (93 %) con su borde borroso ([1440](shots/1440x900/009-guia-3-offer-aplicado.png)) | **No.** El jugador tiene que descubrir que hay que desplazar el inspector. |
| 4 | decisions ([1440](shots/1440x900/010-guia-4-decisions.png) · [390](shots/390x844/010-guia-4-decisions.png)) | `#drawer` (Despacho/Agenda) | Elegir una opción del consejo | 1440: sí. 390: opciones al 59 % | — | Sí en 1440. A medias en 390. |
| 5 | people ([1440](shots/1440x900/012-guia-5-people.png)) | `#drawer` (Políticas) | Comparar maquinistas: 180 disponibles frente a 15 necesarios | No hay nada que hacer: el botón siguiente ya está activo | — | Sí, pero el paso no aporta nada: la pestaña se llama «Políticas» y el contenido «Personal…». |
| 6 | research ([1440](shots/1440x900/013-guia-6-research.png)) | `#drawer` (Progreso/Investigación) | Mirar investigaciones | Los «Investigar» quedan bajo el pliegue y no son obligatorios | — | Sí (paso informativo) |
| 7 | infrastructure ([1440](shots/1440x900/014-guia-7-infrastructure.png) · [390](shots/390x844/014-guia-7-infrastructure.png)) | `#inspector` (Madrid — Salamanca) | Elegir material, frecuencia y abrir por 4 M€ | 1440: material al 10 %, frecuencia y botón no visibles. 390: botón al 12 % | 1440: mensaje sobre el inspector. 390: **mensaje 100 % borroso tras la caja de la guía** ([390](shots/390x844/016-guia-7-infrastructure-abierta.png)) | **No** |
| 8 | day ([1440](shots/1440x900/017-guia-8-day.png)) | `#daybar` | «Comienza la jornada» | Sí, pero dentro de una barra resaltada entera que también ofrece «Cerrar turno» | — | A medias: el anillo rodea toda la barra |
| 8b | incidencia ([1440](shots/1440x900/018-guia-8-day-incidencia.png) · [390](shots/390x844/018-guia-8-day-incidencia.png)) | `#drawer` (Red/Jornada) | Elegir una respuesta | 1440: sí. 390: **23 %** | — | 1440: sí. 390: no. |
| 8c | tras responder ([1440](shots/1440x900/019-guia-8-day-respondida.png)) | `#daybar` | «Hasta el último tren» | Sí | **Mensaje 100 % borroso y tapado al 83 % por la caja de la guía** | Sí la acción. El mensaje no se puede leer. |
| 8d | parte ([1440](shots/1440x900/020-guia-8-day-parte.png) · [390](shots/390x844/020-guia-8-day-parte.png)) | diálogo (la caja de la guía entra en el diálogo) | «Siguiente jornada» | **No**, en ninguna resolución | La guía y una tarjeta narrada del mismo personaje (Marisa Andén) se apilan. El titular «El último tren ha llegado.» sale dos veces. | **No** |
| 9 | handoff ([1440](shots/1440x900/022-guia-9-handoff.png) · [390](shots/390x844/022-guia-9-handoff.png)) | `#drawer` (Agenda) | Aceptar un encargo | **No**: los botones del encargo están bajo el banner y bajo «Elige el ritmo… [Delegar mes]» | 390: la caja de la guía cubre la barra de jornada | **No.** Además, «Delegar mes» parece la acción principal. |
| fin | tras la guía ([1440](shots/1440x900/024-tras-guia.png) · [390](shots/390x844/024-tras-guia.png)) | — | — | — | 1440: el Despacho se queda abierto a mitad de página («El equilibrio del consejo»). 390: dos mensajes tapan el 50 % del cajón. | **No.** No hay objetivo visible: el panel de misión está oculto porque hay un cajón abierto. |

Otros detalles de la guía:

- El «×» de la caja significa «Pausar guía» y parece «cerrar».
- El estado «Listo para seguir» / «Hazlo en el panel marcado» sobra: el botón activo o inactivo ya lo dice.
- El antetítulo «Guía · 3 / 9» es útil y conviene mantenerlo.
- El anillo resalta el contenedor entero (inspector o cajón), no el control concreto.
- La caja de la guía se coloca **sin tener en cuenta** los mensajes ni la píldora.

---

## 3. Juego normal: ¿se ve el objetivo?

| Momento | Captura | ¿Claro en 2 s? | ¿Dónde está el objetivo? ¿Qué lo tapa? |
|---|---|---|---|
| Pantalla principal sin paneles | [1440](shots/1440x900/026-pantalla-principal-sin-paneles.png) · [1280](shots/1280x720/026-pantalla-principal-sin-paneles.png) · [390](shots/390x844/026-pantalla-principal-sin-paneles.png) | **No** | El botón «Siguiente» está al final del panel de misión (y ≈ 530–585 en 1440). Compite con el HUD (5 cifras), con dos botones principales en la barra de jornada y con 5 retos. **En 1280×720 la leyenda lo tapa y el panel lo recorta.** En móvil el panel se corta antes de «Siguiente». |
| Cualquier sección abierta | p. ej. [1440](shots/1440x900/037-menu-network-routes.png) | **No** | El panel de misión se oculta. Ningún elemento recuerda el objetivo. |
| Ficha de ciudad o de relación | [1440](shots/1440x900/034-ficha-ciudad-madrid.png) · [1440](shots/1440x900/035-ficha-relacion.png) · [390](shots/390x844/035-ficha-relacion.png) | A medias | En 1440 y 1280 el panel de misión sigue visible a la izquierda, pero la ficha tapa «Capas» y el zoom. Por debajo de 1200 px de ancho (390) el panel se oculta y la ficha ocupa la pantalla. |
| Cerrar turno → suceso | [1440](shots/1440x900/082-tras-cerrar-turno.png) · [1440](shots/1440x900/083-suceso-ilustrado.png) · [390](shots/390x844/084-suceso-opciones.png) | 1440: a medias. 390: **no** | El Despacho se abre solo con el suceso, pero sus opciones quedan bajo el pliegue (12 % visible) y 3–4 mensajes se apilan al lado. En 390 los mensajes tapan el suceso. |
| Suceso resuelto | [1440](shots/1440x900/085-suceso-resuelto.png) | No | El cajón vuelve al banner de la Agenda. Hay 4 mensajes en pantalla y el 4.º se corta. |
| Jornada con incidencia | [1440](shots/1440x900/089-jornada-alerta-incidencia.png) · [1440](shots/1440x900/092-jornada-reproduciendo-30x.png) | **Sí** (escritorio) | La píldora de arriba con «Decidir» funciona bien. Le sobra el mensaje duplicado. |
| Centro de control | [1440](shots/1440x900/090-jornada-centro-control.png) | Sí | Las respuestas están visibles en escritorio. Sobran las cifras de cabecera (reloj, en circulación, programadas, puntualidad, primera/última). |
| Parte del día | [1440](shots/1440x900/093-jornada-parte.png) · [1280](shots/1280x720/093-jornada-parte.png) · [390](shots/390x844/093-jornada-parte.png) | 1440: sí. 1280 y 390: **no** | «Siguiente jornada» queda bajo el pliegue en 1280×720 y en móvil, y también en 1440 cuando la guía ocupa la parte de arriba del diálogo. |
| Diálogos de compra, reforma y taller | [1440](shots/1440x900/072-trenespop-ficha-compra.png) · [1440](shots/1440x900/074-reforma-tren.png) · [1440](shots/1440x900/078-taller-vias-propuesta.png) | No | El botón de confirmar queda bajo el pliegue. En el taller, los selectores también. |
| Bienvenida sin guía o al continuar | [1440](shots/1440x900/100-bienvenida-sin-guia.png) · [390](shots/390x844/100-bienvenida-sin-guia.png) · [1440](shots/1440x900/103-bienvenida-continuar.png) | Sí («Vamos a dirigir →») | Tapa el panel de misión, que es justo donde está el objetivo. No hay solapes problemáticos. |

---

## 4. Inventario de elementos en partida

**Veredictos.** ESENCIAL: siempre visible. MENÚ: pasa a un menú, pestaña o desplegable. QUITAR: redundante o ruido. Las palabras y los números son los visibles en 1440 salvo que se indique otra cosa. «Ctx» significa que solo se muestra en su contexto.

### 4.1 Capa base (siempre en pantalla)

Recuento de la pantalla en reposo ([1440](shots/1440x900/026-pantalla-principal-sin-paneles.png)): HUD 25/8, misión 56/6, barra de jornada 13/9 (más ~10 horas pintadas en el lienzo), leyenda 15/0, barra inferior 6/0 y «Capas» 1/0. **Total: 116 palabras y 23 números.** En 1280×720: 103/22, porque el HUD oculta el texto de la marca. En 390×844: 91/12, de los que 37 palabras son un mensaje narrado que sigue en pantalla.

| Elemento | Dónde | Qué muestra | Pal./núm. | Para qué | Veredicto | Motivo |
|---|---|---|---|---|---|---|
| Marca del HUD: logo, «Iberia Ferroviaria» y «Conexiones · al mando de Tenfe» | HUD, izquierda | Nombre del juego | 6/0 | Decoración | **QUITAR** (el logo puede servir de botón del menú) | No informa. Choca con «Tenfe Conexiones» de la portada. |
| «Turno N · tu red en marcha» | HUD | Turno | 5/1 | Saber en qué turno estás | **ESENCIAL** solo «Turno N» | «tu red en marcha» es relleno |
| «12 turnos hasta las urnas» | HUD | Cuenta atrás electoral | 4/1 | Elecciones | **MENÚ** (Despacho/Apoyo). En el HUD solo cuando falten ≤3 turnos | No hace falta en cada turno |
| Sol y reloj «06:30» | HUD | Hora de la jornada | 0/1 | Jornada en curso | **Ctx**: solo durante la jornada, en su barra | En la preparación no significa nada |
| Caja | HUD | 436,0 M€ | 1/1 | Recurso principal | **ESENCIAL** | — |
| Resultado / turno | HUD | −3,04 M€ en rojo | 3/1 | Si ganas o pierdes dinero | **ESENCIAL**, fusionado con Caja (p. ej. «436 M€ ▼3,0») | Ahorra una columna y la etiqueta larga que se monta en móvil |
| Apoyo % | HUD | 53,9 % | 1/1 | Ganar elecciones | **ESENCIAL** (compacto) | Es una condición de derrota |
| Puntualidad % | HUD | 87,8 % | 1/1 | Reto 1 y jornada | **MENÚ** (Progreso/Jornada) | Ya aparece en el parte y en los retos |
| Trenes libres | HUD | 33 | 2/1 | Flota disponible | **MENÚ** (Flota) | Solo importa al planificar un servicio, y la ficha ya lo muestra |
| Barra inferior: Red, Flota, Dinero, Despacho, Progreso, Prensa | Abajo | 6 secciones con icono y nombre | 6/0 | Navegación | **ESENCIAL**, mejor 5: Prensa dentro de Despacho o Progreso | Menos opciones. Prensa es solo lectura. |
| Insignias de la barra | Red (incidencias), Despacho (asuntos) | Número | 0/1–2 | Avisar de algo pendiente | **ESENCIAL** | En móvil la insignia sustituye a la etiqueta |
| Música, Guardar, Ayuda y Menú (4 iconos) | Abajo a la derecha | Iconos | 0/0 | Sistema | **MENÚ**: un único «☰ Menú» de pausa con Guardar, Sonido, Ayuda y Salir | 4 iconos sin texto. En 390, Ayuda y Menú quedan fuera de pantalla. |
| «Capas ▾» | Arriba a la derecha | Desplegable con 6 capas | 1/0 | Cambiar de mapa | **ESENCIAL** (compacto) | Que ningún panel lo tape. Hoy lo tapan las fichas y los mensajes. |
| Zoom: +, − y ⌂ | Bajo «Capas» | 3 botones | 0/0 | Mover el mapa | + y − **QUITAR** (rueda o pellizco); ⌂ **ESENCIAL** | Siempre tapados por las fichas |
| Panel de misión: antetítulo «Conexiones · turno N» | Izquierda | Repite el turno | 3/1 | — | **QUITAR** | Repite el HUD |
| Panel de misión: título «Un país por conectar» | Izquierda | Lema | 4/0 | Decoración | **QUITAR** | — |
| Panel de misión: «0/5 retos · 0/2 mandatos» | Izquierda | Progreso global | 4/4 | Meta de la partida | **ESENCIAL** (una línea) | — |
| Panel de misión: 5 retos con ○ y ✓ duplicados | Izquierda | Nombres poéticos | ~20/0 | Meta | **MENÚ** (Progreso → Mandato), con requisito y progreso (p. ej. «Abre 2 conexiones rurales 0/2») | El nombre no dice qué hacer. Dos marcadores por fila. |
| Panel de misión: frase «Tu red, tus tarifas…» | Izquierda | Relleno | 11/0 | — | **QUITAR** | — |
| Panel de misión: «En marcha: Poner el corredor… 0/3 · 24 meses» | Izquierda | Encargo activo | 7/3 | Compromiso | **MENÚ** (Despacho), o integrado en el objetivo cuando sea lo más urgente | Compite con «Siguiente» |
| Panel de misión: **«Siguiente: [acción]»** | Al final del panel | Una acción con botón | 2–4/0 | **El objetivo de ahora** | **ESENCIAL y principal**: una píldora fija y siempre visible, también con menús abiertos y en móvil | Es lo único que dice qué hacer. Hoy queda escondido. |
| Panel de misión: peticiones de ciudad («Lleida +19 M€») | Izquierda | 1–2 botones | 1/1 | Encargos de ciudad | **MENÚ** (Despacho/Agenda). En el mapa ya hay un pin «!» | Ruido en la capa base |
| Leyenda | Abajo a la izquierda | 8 símbolos y «Pulsa una ciudad» | 15/0 | Leer el mapa | **MENÚ** (dentro de «Capas»). Visible solo en capas técnicas | La tapa el cajón. En 1280×720 tapa la parte baja del panel de misión, justo donde está el objetivo. Se entiende sin ella. |
| Barra de jornada: «Preparación» | Abajo | Fase | 1/0 | Fase del día | **ESENCIAL** si se integra en el botón principal | — |
| Barra de jornada: «06:30 → 02:11 +1» | Abajo | Ventana horaria | 0/3 | — | **QUITAR** (MENÚ en Red → Jornada) | Números sin decisión asociada |
| Barra de jornada: «28 circulaciones · 0 en autobús» | Abajo | Recuento | 3/2 | — | **MENÚ** (Red → Jornada) | — |
| Barra de jornada: línea de tiempo (lienzo con horas e incidencias) | Abajo | Gráfico del día | ~10 horas en el lienzo | Seguir la jornada | **Ctx**: solo con la jornada en curso | En la preparación no hace nada |
| Barra de jornada: 1×/3×/10×/30× y ▶ | Abajo | Velocidad y reproducir | 0/4 | Jornada | **Ctx**: solo con la jornada en curso | ▶ equivale a «Comienza la jornada» |
| Barra de jornada: «Comienza la jornada» | Abajo | Botón principal | 3/0 | Jugar el día | **ESENCIAL** (secundario) | — |
| Barra de jornada: «Cerrar turno» | Abajo | Botón | 2/0 | Avanzar | **ESENCIAL**, el único verbo para avanzar | Quitar «Delegar mes» del Despacho |
| Mensaje narrado (`#toast > .narration-toast`) | Abajo a la derecha (móvil: centro) | Retrato, nombre, cargo, ▷ Escuchar, texto, bloque «Detalle», × | 25–40 cada uno; 3–4 apilados = 80–150 | Contar lo que pasa | **ESENCIAL**, pero **uno a la vez**, sin «Detalle» duplicado, con una cola, y nunca encima de la guía, del panel resaltado ni de «Capas» | Hoy se apila, tapa y queda borroso bajo la guía |
| Píldora de incidencia o pico de demanda (`.alert-pill`) | Arriba en el centro | «Fallo de tracción · Madrid — Badajoz [Decidir]» | 6/0 | Interrumpir la jornada | **ESENCIAL** | Bien resuelta. Quitar el mensaje duplicado. Hoy queda bajo las sombras de la guía (z 8). |

### 4.2 Guía y bienvenida

| Elemento | Dónde | Qué muestra | Pal./núm. | Para qué | Veredicto | Motivo |
|---|---|---|---|---|---|---|
| Caja de la guía (`#coach`): retrato y nombre | Junto al panel resaltado | Personaje | 2/0 | Quién habla (texto grabado) | **ESENCIAL** | — |
| Caja de la guía: «Tu primer turno» / «Guía · N / 9» | Caja | Progreso | 3/2 | Saber cuánto falta | **ESENCIAL** (compacto) | — |
| Caja de la guía: ▷ | Caja | Volver a escuchar | 0/0 | Voz | **ESENCIAL** | — |
| Caja de la guía: × (pausar) | Caja | Pausar la guía | 0/0 | Salir de la guía | **ESENCIAL** con otro icono o la palabra «Pausar» | Parece «cerrar» |
| Caja de la guía: título y texto | Caja | Instrucción grabada (CONGELADA) | 30–45 | Instrucción | **ESENCIAL** | No se puede cambiar el texto |
| Caja de la guía: «Listo para seguir» / «Hazlo en el panel marcado» | Pie de la caja | Estado | 3–5/0 | — | **QUITAR** | El estado del botón ya lo dice |
| Caja de la guía: botón siguiente | Pie de la caja | Acción | 2–4/0 | Avanzar | **ESENCIAL** | — |
| Sombras (`#tour-shades i`, desenfoque) | Toda la pantalla salvo el hueco | Desenfoque | — | Centrar la atención | **ESENCIAL**, pero sin desenfocar cajas que salen a la vez (o subirlas por encima: z > 40) y con hueco sobre el **control**, no sobre el panel | Causa de la queja del usuario |
| Anillo (`#spot`) | Alrededor del panel | Marco rosa | — | Señalar | **ESENCIAL**, ajustado al control | Hoy rodea paneles enteros |
| Bienvenida (`#entry-welcome`): imagen, «Bienvenido a Conexiones», título, narración y botón | Sobre el panel de misión | 44 pal. en 390 | — | Empezar | **ESENCIAL** (un solo momento) | Que no tape el objetivo |

### 4.3 Fichas (`#inspector`)

| Elemento | Qué muestra | Pal./núm. visibles | Veredicto | Motivo |
|---|---|---|---|---|
| Relación: antetítulo y título con etiqueta | «Relación en servicio», AVE Madrid — València | 4/0 | **ESENCIAL** solo el nombre y su color | El antetítulo sobra |
| Relación: estado, «Horario oficial — / sin horario: lo pones tú», «Longitud 398 km» | Datos | 8/2 | **MENÚ** (desplegable «Detalles») | Tapa el formulario |
| Relación: «Qué puede circular» (3 tarjetas AVE/Alvia/híbrido) | Compatibilidad | 9/6 | **MENÚ** (desplegable) o un icono junto al material | 3 tarjetas grandes antes del formulario |
| Relación: histograma de salidas | Gráfico | ~7 números | **MENÚ** | — |
| Relación: **Plan de servicio** (material, salidas, tarifa, previsión, Aplicar/Abrir) | Formulario | 20/10 | **ESENCIAL** y **arriba del todo** | Es lo que pide la guía y hoy queda bajo el pliegue |
| Relación: previsión (5 cifras) | Trenes necesarios y disponibles, circulaciones, viajeros, ocupación, M€/mes, variación | 15/8 | **ESENCIAL** reducido a: resultado/turno, trenes necesarios y libres, y el motivo si no se puede | Demasiadas cifras |
| Relación: «Mejorar servicio · 12 M€ / Nivel 0/3» | Mejora | 5/3 | **MENÚ** (Detalles) | — |
| Relación: «Frente a la carretera» (barras y 3 %) y figuras (viajeros, ocupación, resultado) | Análisis | 12/6 | **MENÚ** (Detalles) | — |
| Relación: «Ver sus trenes» y «Encuadrar» | Botones | 4/0 | «Ver sus trenes» **MENÚ**. «Encuadrar» **QUITAR** (el mapa ya se centra) | — |
| Ciudad: cabecera ilustrada con habitantes, 3 cifras y lista de conexiones con −/+ y Detalles, estación, próximas salidas | Muy larga | 47/16 en 1440, 52/9 en 390 | **ESENCIAL**: nombre y conexiones con −/+. **MENÚ**: habitantes, cifras, estación, salidas | **En 390 desborda 7.647 px y no se puede cerrar** |
| Tramo: foto, ancho, tensión, velocidad, «Diseñar mejora de vía», obras posibles | Ficha | 36/4 | **ESENCIAL**: foto y «Diseñar mejora». El resto, **MENÚ** | — |

### 4.4 Cajón de secciones (`#drawer`)

Común a todas las secciones: cabecera con antetítulo y título, × y pestañas pegajosas. **QUITAR** el antetítulo, que repite la sección («Servicios, vías y horarios», «Decisiones y compromisos», «Caja, compromisos y previsión», «Objetivos abiertos desde el primer turno», «Lo que ocurrió en tu red»). **Una sola fila de pestañas**: los filtros interiores van a un desplegable.

| Sección → pestaña | Captura 1440 | Visible (pal./núm.) | Qué tiene | Veredicto y motivo |
|---|---|---|---|---|
| Red → Servicios | [1440](shots/1440x900/037-menu-network-routes.png) | 86/16 | 2 filas de pestañas, búsqueda, estado, «Relación nueva», frase de ayuda, tabla de 5 columnas con etiquetas | **ESENCIAL** la lista (nombre, estado, resultado). **QUITAR** la columna «Trenes / día» (vacía), las etiquetas AVE/ALVIA/HÍBRIDO y la frase «98 relaciones · pulsa un nombre…». Los filtros, a un desplegable. |
| Red → Jornada | [1440](shots/1440x900/039-menu-network-ops.png) | 79/11 | 5 cifras, aviso, incidencias, prioridad de explotación, «Pausar ante incidencias», próximas salidas | **ESENCIAL**: las incidencias con sus respuestas. **MENÚ** (ajustes de la jornada): prioridad y pausa automática. **QUITAR**: las 5 cifras de cabecera y la frase de «Delegar mes». |
| Red → Obras (4 subpestañas) | [1440](shots/1440x900/040-menu-network-works.png) | 85–123/2–13 | 3 botones de capa, 4 subpestañas, tablas | **MENÚ** como está, pero sin los 3 botones de capa duplicados (ya están en «Capas») y sin textos largos |
| Red → Horarios | [1440](shots/1440x900/045-menu-network-timetables.png) | 50/10 | Pestañas por tipo de día con recuentos, 4 cifras, búsqueda, estaciones | **MENÚ** (modo observación). **QUITAR** las 4 cifras. |
| Red → Competencia | [1440](shots/1440x900/047-menu-network-rivals.png) | 61/10 | Rivales por relación | **MENÚ** |
| Flota → Mi parque | [1440](shots/1440x900/048-menu-fleet-fleet.png) | 65/19 | 4 cifras, tabla con fotos y estado, enlace al taller | **ESENCIAL** la tabla. **QUITAR** las 4 cifras («Unidades», «AVE», «Alvia + regionales», «Libres»). |
| Flota → Reformas | [1440](shots/1440x900/049-menu-fleet-refits.png) | 75/5 | Taller de interiores | **MENÚ**. La comparación sale vacía en los modelos sin foto ([1440](shots/1440x900/074-reforma-tren.png)). |
| Flota → Trenes Pop | [1440](shots/1440x900/050-menu-fleet-market.png) | 48/1 | Tienda parodia, con su propio estilo | **MENÚ**, se mantiene: es un mundo propio coherente |
| Flota → Pedidos | [1440](shots/1440x900/051-menu-fleet-orders.png) | 70/9 | Pedidos y contratos heredados | **MENÚ** |
| Dinero | [1440](shots/1440x900/052-menu-finance.png) | 60/11 | 4 cifras, cuenta del mes, gráfico, préstamos, mantenimiento, 3 meses de previsión | **MENÚ**, se mantiene. Cambiar «mes» por «turno». Las cifras de cabecera repiten el HUD. |
| Despacho → Agenda | [1440](shots/1440x900/054-menu-story-agenda.png) · [1440](shots/1440x900/055-menu-story-agenda-medio.png) | 113/7 | Decisión del consejo y suceso arriba (si los hay). Banner «Un plan para el próximo mes» con 3 cifras. Bloque «Elige el ritmo» con **«Delegar mes»**. Encargos. «Próximos pasos». «El equilibrio del consejo» con 5 tarjetas y «Negociar · 8 M€». Historial. | **ESENCIAL** lo pendiente: decisión, suceso y encargos, en ese orden. **QUITAR** el banner, «Elige el ritmo» con «Delegar mes» y «Próximos pasos». El equilibrio del consejo, a **MENÚ** (Apoyo). |
| Despacho → Apoyo | [1440](shots/1440x900/056-menu-story-apoyo.png) | 22/1 | Foto, encuesta, urnas, grupos | **MENÚ**. Aquí van la cuenta atrás de las urnas y el equilibrio del consejo. |
| Despacho → Pactos | [1440](shots/1440x900/057-menu-story-pactos.png) | 86/11 | 2 pactos | **MENÚ** |
| Despacho → Políticas | [1440](shots/1440x900/058-menu-story-people.png) | 74/11 | Personal y políticas | **MENÚ**. Titular la pestaña «Personal». |
| Despacho → Cloacas | [1440](shots/1440x900/059-menu-story-cloacas.png) | 44/4 | Atajo ilegal | **MENÚ** |
| Progreso → Mandato | [1440](shots/1440x900/060-menu-progress-campaign.png) | 81/1 | 5 tarjetas de reto con foto y un bloque «Cómo se juega» | **MENÚ**: cada reto con requisito y progreso numérico (0/2, 0/3…). «Cómo se juega» va a Ayuda. |
| Progreso → Hitos, Investigación, Megaproyectos | [1440](shots/1440x900/062-menu-progress-hitos.png) · [1440](shots/1440x900/063-menu-progress-research.png) · [1440](shots/1440x900/065-menu-progress-proyectos.png) | 56–93/3–15 | Tarjetas con fotos grandes | **MENÚ**. Fotos más pequeñas, para que el botón de cada tarjeta quede a la vista. |
| Prensa → Gaceta, Diario, Informes | [1440](shots/1440x900/067-menu-press-paper.png) · [1440](shots/1440x900/069-menu-press-journal.png) · [1440](shots/1440x900/070-menu-press-reports.png) | 27–72 | Noticias e informes | **MENÚ** (dentro de Despacho o de Progreso como «Noticias»). Es el sitio para el historial de mensajes narrados en lugar de apilarlos. |

### 4.5 Diálogos

| Diálogo | Captura | Pal./núm. | Veredicto y motivo |
|---|---|---|---|
| Parte del día | [1440](shots/1440x900/093-jornada-parte.png) | 114/17 | **ESENCIAL**: anillo de puntualidad, resultado del día y «Siguiente jornada» **arriba**. **QUITAR**: la tarjeta narrada que repite el titular y el aviso «La caja se actualiza al cerrar el mes». La tabla, a **MENÚ** (desplegable). |
| Decisión del consejo (cajón o diálogo) | [1440](shots/1440x900/010-guia-4-decisions.png) | 75/2 | **ESENCIAL**. **QUITAR** el antetítulo «Consejo de dirección · decisión pendiente» y el texto «Escuchar diálogo» bajo el botón. |
| Suceso ilustrado | [1440](shots/1440x900/083-suceso-ilustrado.png) | ~40 | **ESENCIAL**. La imagen, más baja, para que las opciones (hoy al 12 %) se vean. |
| Trenes Pop: ficha de compra | [1440](shots/1440x900/072-trenespop-ficha-compra.png) | 66/6 | **ESENCIAL** «Firmar pedido» a la vista (hoy queda bajo el pliegue) |
| Lote de flota | [1440](shots/1440x900/073-flota-ficha-lote.png) | 43/6 | Botones a la vista, sin la vista 3D por encima |
| Reforma | [1440](shots/1440x900/074-reforma-tren.png) | 58/3 | Comparador vacío sin foto: ocultarlo. Botón de confirmar a la vista. |
| Taller de vías | [1440](shots/1440x900/078-taller-vias-propuesta.png) | 102/3 | **ESENCIAL** la imagen comparada y los 3 selectores **junto a ella**. **QUITAR** «Ilustración de la configuración…». Los textos de Ahora y Después, compactos. |
| Guardar | [1440](shots/1440x900/095-menu-guardar.png) | 56/0 | **MENÚ** (dentro de «☰ Menú») |
| Ayuda | [1440](shots/1440x900/096-menu-ayuda.png) | 185/3 | **MENÚ**, con **texto actualizado a Conexiones** (hoy habla de capítulos). Debe ser breve. |
| Música | [1440](shots/1440x900/097-menu-musica.png) | 82/21 | **MENÚ** («Sonido»: volúmenes de música, voces y efectos, y la lista de pistas sin pulsaciones por minuto) |
| Portada en partida y Opciones | [1440](shots/1440x900/098-portada-en-partida.png) · [1440](shots/1440x900/099-portada-opciones.png) | 32–49 | Correcto. «Opciones» (volúmenes) debería estar también en partida. |

---

## 5. Datos del comprobador (por paso y resolución)

Columnas: palabras y números visibles (dentro de la pantalla y de los paneles con desplazamiento). Solapes entre cajas de primer nivel, sin contar el anidamiento ni un diálogo modal sobre la capa base. Cajas que salen a la vez y quedan desenfocadas o tapadas (mensajes, píldora, bienvenida, guía, fichas o cajón que no sea el resaltado). Controles pedidos que no se ven, quedan tapados o asoman menos del 60 %. Desborde horizontal de página.

Nota sobre «Pasos con solapes»: casi todos son solapes estructurales que se repiten en cada paso. Son el cajón sobre la leyenda (30.240 px²), cualquier ficha sobre «Capas» y el zoom (12.691 px²) y, en 1280×720, la leyenda sobre el panel de misión (6.576 px²). Las columnas de la derecha recogen lo grave: cajas borrosas o tapadas y controles invisibles.

| Resolución | Pasos | Palabras (media / máx.) | Números (media / máx.) | Pasos con solapes | Pasos con caja borrosa o tapada a la vez | Pasos con control pedido no visible | Pasos con desborde horizontal |
|---|---:|---|---|---:|---:|---:|---:|
| 1440×900 | 103 | 147 / 256 | 24 / 41 | 76 | 2 | 10 | 0 |
| 1280×720 | 103 | 121 / 197 | 21 / 38 | 99 | 2 | 15 | 0 |
| 390×844 | 103 | 95 / 170 | 16 / 29 | 93 | 14 | 17 | 0 |

### 1440×900

| Paso | Palabras | Números | Solapes (px²) | Cajas borrosas/tapadas a la vez | Control pedido no visible/tapado | Desborde |
|---|---:|---:|---|---|---|---|
| [001-portada](shots/1440x900/001-portada.png) | 37 | 4 |  |  |  |  |
| [002-nueva-partida](shots/1440x900/002-nueva-partida.png) | 45 | 0 |  |  |  |  |
| [003-guia-1-welcome](shots/1440x900/003-guia-1-welcome.png) | 154 | 22 |  |  |  |  |
| [004-guia-1-welcome-t3s](shots/1440x900/004-guia-1-welcome-t3s.png) | 154 | 22 |  |  |  |  |
| [005-guia-2-network](shots/1440x900/005-guia-2-network.png) | 188 | 36 | #drawer ∩ #legend 30240 |  |  |  |
| [006-guia-2-network-elegida](shots/1440x900/006-guia-2-network-elegida.png) | 185 | 34 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [007-guia-3-offer](shots/1440x900/007-guia-3-offer.png) | 193 | 34 | div.map-tools ∩ #inspector 12691 |  | `#frequency` hay que desplazar<br>`#fare` hay que desplazar<br>`#routeForm [type="submit"]` invisible |  |
| [008-guia-3-offer-plan](shots/1440x900/008-guia-3-offer-plan.png) | 203 | 41 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [009-guia-3-offer-aplicado](shots/1440x900/009-guia-3-offer-aplicado.png) | 213 | 41 | #inspector ∩ #toast 48555<br>div.map-tools ∩ #inspector 12691 |  |  |  |
| [010-guia-4-decisions](shots/1440x900/010-guia-4-decisions.png) | 178 | 22 | #drawer ∩ #legend 30240 |  |  |  |
| [011-guia-4-decisions-resueltas](shots/1440x900/011-guia-4-decisions-resueltas.png) | 216 | 27 | #drawer ∩ #legend 30240 |  |  |  |
| [012-guia-5-people](shots/1440x900/012-guia-5-people.png) | 171 | 31 | #drawer ∩ #legend 30240 |  |  |  |
| [013-guia-6-research](shots/1440x900/013-guia-6-research.png) | 160 | 35 | #drawer ∩ #legend 30240 |  |  |  |
| [014-guia-7-infrastructure](shots/1440x900/014-guia-7-infrastructure.png) | 208 | 33 | div.map-tools ∩ #inspector 12691 |  | `#routeFleet` 10% visible<br>`#frequency` hay que desplazar<br>`#routeForm [type="submit"]` invisible |  |
| [015-guia-7-infrastructure-plan](shots/1440x900/015-guia-7-infrastructure-plan.png) | 195 | 40 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [016-guia-7-infrastructure-abierta](shots/1440x900/016-guia-7-infrastructure-abierta.png) | 208 | 39 | #inspector ∩ #toast 48555<br>div.map-tools ∩ #inspector 12691 |  |  |  |
| [017-guia-8-day](shots/1440x900/017-guia-8-day.png) | 150 | 24 |  |  |  |  |
| [018-guia-8-day-incidencia](shots/1440x900/018-guia-8-day-incidencia.png) | 162 | 33 | #drawer ∩ #legend 30240 |  |  |  |
| [019-guia-8-day-respondida](shots/1440x900/019-guia-8-day-respondida.png) | 155 | 25 | #toast ∩ #coach 42330 | #toast: 100% borrosa 83% tapada |  |  |
| [020-guia-8-day-parte](shots/1440x900/020-guia-8-day-parte.png) | 113 | 19 |  |  | `#modal [data-action="day-next"]` invisible |  |
| [021-guia-8-day-siguiente](shots/1440x900/021-guia-8-day-siguiente.png) | 148 | 24 |  |  |  |  |
| [022-guia-9-handoff](shots/1440x900/022-guia-9-handoff.png) | 216 | 27 | #drawer ∩ #legend 30240 |  | `[data-action="tycoon-public"]` invisible |  |
| [023-guia-9-handoff-aceptado](shots/1440x900/023-guia-9-handoff-aceptado.png) | 214 | 36 | #drawer ∩ #legend 30240 | #toast: 100% borrosa  |  |  |
| [024-tras-guia](shots/1440x900/024-tras-guia.png) | 195 | 34 | #drawer ∩ #legend 30240 |  |  |  |
| [025-pantalla-principal-reposo](shots/1440x900/025-pantalla-principal-reposo.png) | 156 | 34 | #drawer ∩ #legend 30240 |  |  |  |
| [026-pantalla-principal-sin-paneles](shots/1440x900/026-pantalla-principal-sin-paneles.png) | 116 | 23 |  |  |  |  |
| [027-capas-desplegable](shots/1440x900/027-capas-desplegable.png) | 124 | 23 |  |  |  |  |
| [028-capa-real](shots/1440x900/028-capa-real.png) | 161 | 19 |  |  |  |  |
| [029-capa-gauge](shots/1440x900/029-capa-gauge.png) | 162 | 23 |  |  |  |  |
| [030-capa-power](shots/1440x900/030-capa-power.png) | 158 | 25 |  |  |  |  |
| [031-capa-speed](shots/1440x900/031-capa-speed.png) | 159 | 29 |  |  |  |  |
| [032-capa-works](shots/1440x900/032-capa-works.png) | 110 | 23 |  |  |  |  |
| [033-capa-network](shots/1440x900/033-capa-network.png) | 116 | 23 |  |  |  |  |
| [034-ficha-ciudad-madrid](shots/1440x900/034-ficha-ciudad-madrid.png) | 163 | 39 | div.map-tools ∩ #inspector.wide 8232 |  |  |  |
| [035-ficha-relacion](shots/1440x900/035-ficha-relacion.png) | 155 | 33 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [036-ficha-relacion-abajo](shots/1440x900/036-ficha-relacion-abajo.png) | 164 | 41 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [037-menu-network-routes](shots/1440x900/037-menu-network-routes.png) | 148 | 33 | #drawer ∩ #legend 30240 |  |  |  |
| [038-menu-network-routes-medio](shots/1440x900/038-menu-network-routes-medio.png) | 140 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [039-menu-network-ops](shots/1440x900/039-menu-network-ops.png) | 144 | 28 | #drawer ∩ #legend 30240 |  |  |  |
| [040-menu-network-works](shots/1440x900/040-menu-network-works.png) | 169 | 30 | #drawer ∩ #legend 30240 |  |  |  |
| [041-menu-network-works-conv](shots/1440x900/041-menu-network-works-conv.png) | 169 | 30 | #drawer ∩ #legend 30240 |  |  |  |
| [042-menu-network-works-changers](shots/1440x900/042-menu-network-works-changers.png) | 145 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [043-menu-network-works-projects](shots/1440x900/043-menu-network-works-projects.png) | 183 | 29 | #drawer ∩ #legend 30240 |  |  |  |
| [044-menu-network-works-running](shots/1440x900/044-menu-network-works-running.png) | 99 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [045-menu-network-timetables](shots/1440x900/045-menu-network-timetables.png) | 110 | 28 | #drawer ∩ #legend 30240 |  |  |  |
| [046-menu-network-timetables-estacion](shots/1440x900/046-menu-network-timetables-estacion.png) | 107 | 37 | #drawer ∩ #legend 30240 |  |  |  |
| [047-menu-network-rivals](shots/1440x900/047-menu-network-rivals.png) | 121 | 27 | #drawer ∩ #legend 30240 |  |  |  |
| [048-menu-fleet-fleet](shots/1440x900/048-menu-fleet-fleet.png) | 125 | 36 | #drawer ∩ #legend 30240 |  |  |  |
| [049-menu-fleet-refits](shots/1440x900/049-menu-fleet-refits.png) | 135 | 22 | #drawer ∩ #legend 30240 |  |  |  |
| [050-menu-fleet-market](shots/1440x900/050-menu-fleet-market.png) | 117 | 18 | #drawer.trenespop-drawer ∩ #legend 30240<br>div.map-tools ∩ #drawer.trenespop-drawer 12099 |  |  |  |
| [051-menu-fleet-orders](shots/1440x900/051-menu-fleet-orders.png) | 130 | 26 | #drawer ∩ #legend 30240 |  |  |  |
| [052-menu-finance](shots/1440x900/052-menu-finance.png) | 120 | 28 | #drawer ∩ #legend 30240 |  |  |  |
| [053-menu-finance-abajo](shots/1440x900/053-menu-finance-abajo.png) | 131 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [054-menu-story-agenda](shots/1440x900/054-menu-story-agenda.png) | 173 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [055-menu-story-agenda-medio](shots/1440x900/055-menu-story-agenda-medio.png) | 144 | 29 | #drawer ∩ #legend 30240 |  |  |  |
| [056-menu-story-apoyo](shots/1440x900/056-menu-story-apoyo.png) | 82 | 18 | #drawer ∩ #legend 30240 |  |  |  |
| [057-menu-story-pactos](shots/1440x900/057-menu-story-pactos.png) | 146 | 28 | #drawer ∩ #legend 30240 |  |  |  |
| [058-menu-story-people](shots/1440x900/058-menu-story-people.png) | 134 | 28 | #drawer ∩ #legend 30240 |  |  |  |
| [059-menu-story-cloacas](shots/1440x900/059-menu-story-cloacas.png) | 104 | 21 | #drawer ∩ #legend 30240 |  |  |  |
| [060-menu-progress-campaign](shots/1440x900/060-menu-progress-campaign.png) | 141 | 18 | #drawer ∩ #legend 30240 |  |  |  |
| [061-menu-progress-campaign-medio](shots/1440x900/061-menu-progress-campaign-medio.png) | 128 | 20 | #drawer ∩ #legend 30240 |  |  |  |
| [062-menu-progress-hitos](shots/1440x900/062-menu-progress-hitos.png) | 116 | 28 | #drawer ∩ #legend 30240 |  |  |  |
| [063-menu-progress-research](shots/1440x900/063-menu-progress-research.png) | 122 | 32 | #drawer ∩ #legend 30240 |  |  |  |
| [064-menu-progress-research-medio](shots/1440x900/064-menu-progress-research-medio.png) | 110 | 27 | #drawer ∩ #legend 30240 |  |  |  |
| [065-menu-progress-proyectos](shots/1440x900/065-menu-progress-proyectos.png) | 153 | 20 | #drawer ∩ #legend 30240 |  |  |  |
| [066-menu-progress-proyectos-medio](shots/1440x900/066-menu-progress-proyectos-medio.png) | 136 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [067-menu-press-paper](shots/1440x900/067-menu-press-paper.png) | 87 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [068-menu-press-paper-medio](shots/1440x900/068-menu-press-paper-medio.png) | 87 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [069-menu-press-journal](shots/1440x900/069-menu-press-journal.png) | 132 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [070-menu-press-reports](shots/1440x900/070-menu-press-reports.png) | 100 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [071-trenespop-catalogo](shots/1440x900/071-trenespop-catalogo.png) | 117 | 18 | #drawer.trenespop-drawer ∩ #legend 30240<br>div.map-tools ∩ #drawer.trenespop-drawer 12099 |  |  |  |
| [072-trenespop-ficha-compra](shots/1440x900/072-trenespop-ficha-compra.png) | 66 | 6 | #drawer.trenespop-drawer ∩ #legend 30240<br>div.map-tools ∩ #drawer.trenespop-drawer 12099 |  | `#modal [data-action="confirm-buy"]` invisible |  |
| [073-flota-ficha-lote](shots/1440x900/073-flota-ficha-lote.png) | 43 | 6 | #drawer ∩ #legend 30240 |  | `#modal [data-action="refit-detail"]` invisible |  |
| [074-reforma-tren](shots/1440x900/074-reforma-tren.png) | 58 | 3 | #drawer ∩ #legend 30240 |  | `#modal [data-action="refit-confirm"]` invisible |  |
| [075-reforma-tren-abajo](shots/1440x900/075-reforma-tren-abajo.png) | 58 | 3 | #drawer ∩ #legend 30240 |  |  |  |
| [076-ficha-tramo](shots/1440x900/076-ficha-tramo.png) | 153 | 27 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [077-taller-vias](shots/1440x900/077-taller-vias.png) | 95 | 4 | div.map-tools ∩ #inspector 12691 |  | `[data-action="track-confirm"]` invisible |  |
| [078-taller-vias-propuesta](shots/1440x900/078-taller-vias-propuesta.png) | 102 | 3 | div.map-tools ∩ #inspector 12691 |  | `[data-action="track-confirm"]` invisible |  |
| [079-taller-vias-abajo](shots/1440x900/079-taller-vias-abajo.png) | 102 | 3 | div.map-tools ∩ #inspector 12691 |  |  |  |
| [080-despacho-agenda](shots/1440x900/080-despacho-agenda.png) | 173 | 24 | #drawer ∩ #legend 30240 |  | `.desk-decision [data-action="decision"]` no existe |  |
| [081-despacho-agenda-tras-consejo](shots/1440x900/081-despacho-agenda-tras-consejo.png) | 173 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [082-tras-cerrar-turno](shots/1440x900/082-tras-cerrar-turno.png) | 174 | 20 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 3816 |  |  |  |
| [083-suceso-ilustrado](shots/1440x900/083-suceso-ilustrado.png) | 174 | 20 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 3816 |  | `[data-action="game-event"]` 12% visible |  |
| [084-suceso-opciones](shots/1440x900/084-suceso-opciones.png) | 182 | 22 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 3816 |  |  |  |
| [085-suceso-resuelto](shots/1440x900/085-suceso-resuelto.png) | 256 | 26 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 6346 |  |  |  |
| [086-suceso-resuelto-t3s](shots/1440x900/086-suceso-resuelto-t3s.png) | 256 | 26 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 6346 |  |  |  |
| [087-reposo-turno-2](shots/1440x900/087-reposo-turno-2.png) | 193 | 25 | div.map-tools ∩ #toast 6346 |  |  |  |
| [088-jornada-en-curso](shots/1440x900/088-jornada-en-curso.png) | 194 | 25 | div.map-tools ∩ #toast 6346 |  |  |  |
| [089-jornada-alerta-incidencia](shots/1440x900/089-jornada-alerta-incidencia.png) | 187 | 24 | div.map-tools ∩ #toast 6346 |  |  |  |
| [090-jornada-centro-control](shots/1440x900/090-jornada-centro-control.png) | 191 | 31 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 6346 |  |  |  |
| [091-jornada-respondida](shots/1440x900/091-jornada-respondida.png) | 189 | 30 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 6346 |  |  |  |
| [092-jornada-reproduciendo-30x](shots/1440x900/092-jornada-reproduciendo-30x.png) | 155 | 24 |  |  |  |  |
| [093-jornada-parte](shots/1440x900/093-jornada-parte.png) | 114 | 17 |  |  |  |  |
| [094-jornada-siguiente](shots/1440x900/094-jornada-siguiente.png) | 116 | 23 |  |  |  |  |
| [095-menu-guardar](shots/1440x900/095-menu-guardar.png) | 56 | 0 |  |  |  |  |
| [096-menu-ayuda](shots/1440x900/096-menu-ayuda.png) | 185 | 3 |  |  |  |  |
| [097-menu-musica](shots/1440x900/097-menu-musica.png) | 82 | 21 |  |  |  |  |
| [098-portada-en-partida](shots/1440x900/098-portada-en-partida.png) | 32 | 5 |  |  |  |  |
| [099-portada-opciones](shots/1440x900/099-portada-opciones.png) | 49 | 1 |  |  |  |  |
| [100-bienvenida-sin-guia](shots/1440x900/100-bienvenida-sin-guia.png) | 153 | 22 |  |  |  |  |
| [101-bienvenida-sin-guia-t4s](shots/1440x900/101-bienvenida-sin-guia-t4s.png) | 153 | 22 |  |  |  |  |
| [102-reposo-sin-guia](shots/1440x900/102-reposo-sin-guia.png) | 108 | 22 |  |  |  |  |
| [103-bienvenida-continuar](shots/1440x900/103-bienvenida-continuar.png) | 140 | 23 |  |  |  |  |

### 1280×720

| Paso | Palabras | Números | Solapes (px²) | Cajas borrosas/tapadas a la vez | Control pedido no visible/tapado | Desborde |
|---|---:|---:|---|---|---|---|
| [001-portada](shots/1280x720/001-portada.png) | 37 | 4 |  |  |  |  |
| [002-nueva-partida](shots/1280x720/002-nueva-partida.png) | 45 | 0 |  |  |  |  |
| [003-guia-1-welcome](shots/1280x720/003-guia-1-welcome.png) | 145 | 21 | #mission ∩ #legend 6576 |  |  |  |
| [004-guia-1-welcome-t3s](shots/1280x720/004-guia-1-welcome-t3s.png) | 145 | 21 | #mission ∩ #legend 6576 |  |  |  |
| [005-guia-2-network](shots/1280x720/005-guia-2-network.png) | 150 | 25 | #drawer ∩ #legend 30240 |  | `#drawer [data-action="route"][data-id="m` hay que desplazar |  |
| [006-guia-2-network-elegida](shots/1280x720/006-guia-2-network-elegida.png) | 170 | 31 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  |  |  |
| [007-guia-3-offer](shots/1280x720/007-guia-3-offer.png) | 178 | 31 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  | `#frequency` invisible<br>`#fare` invisible<br>`#routeForm [type="submit"]` invisible |  |
| [008-guia-3-offer-plan](shots/1280x720/008-guia-3-offer-plan.png) | 178 | 35 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  | `#routeForm [type="submit"]` hay que desplazar |  |
| [009-guia-3-offer-aplicado](shots/1280x720/009-guia-3-offer-aplicado.png) | 197 | 38 | #inspector ∩ #toast 48555<br>div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  |  |  |
| [010-guia-4-decisions](shots/1280x720/010-guia-4-decisions.png) | 152 | 20 | #drawer ∩ #legend 30240 |  | `.desk-decision [data-action="decision"]` 55% visible |  |
| [011-guia-4-decisions-resueltas](shots/1280x720/011-guia-4-decisions-resueltas.png) | 178 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [012-guia-5-people](shots/1280x720/012-guia-5-people.png) | 150 | 30 | #drawer ∩ #legend 30240 |  |  |  |
| [013-guia-6-research](shots/1280x720/013-guia-6-research.png) | 130 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [014-guia-7-infrastructure](shots/1280x720/014-guia-7-infrastructure.png) | 184 | 30 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  | `#routeFleet` hay que desplazar<br>`#frequency` invisible<br>`#routeForm [type="submit"]` invisible |  |
| [015-guia-7-infrastructure-plan](shots/1280x720/015-guia-7-infrastructure-plan.png) | 175 | 36 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  | `#routeForm [type="submit"]` hay que desplazar |  |
| [016-guia-7-infrastructure-abierta](shots/1280x720/016-guia-7-infrastructure-abierta.png) | 189 | 36 | #inspector ∩ #toast 48555<br>div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  |  |  |
| [017-guia-8-day](shots/1280x720/017-guia-8-day.png) | 141 | 23 | #mission ∩ #legend 6576 |  |  |  |
| [018-guia-8-day-incidencia](shots/1280x720/018-guia-8-day-incidencia.png) | 138 | 32 | #drawer ∩ #legend 30240 |  |  |  |
| [019-guia-8-day-respondida](shots/1280x720/019-guia-8-day-respondida.png) | 146 | 24 | #toast ∩ #coach 42330<br>#mission ∩ #legend 6576 | #toast: 100% borrosa 83% tapada |  |  |
| [020-guia-8-day-parte](shots/1280x720/020-guia-8-day-parte.png) | 94 | 12 | #mission ∩ #legend 6576 |  | `#modal [data-action="day-next"]` invisible |  |
| [021-guia-8-day-siguiente](shots/1280x720/021-guia-8-day-siguiente.png) | 139 | 23 | #mission ∩ #legend 6576 |  |  |  |
| [022-guia-9-handoff](shots/1280x720/022-guia-9-handoff.png) | 173 | 24 | #drawer ∩ #legend 30240 |  | `[data-action="tycoon-public"]` invisible |  |
| [023-guia-9-handoff-aceptado](shots/1280x720/023-guia-9-handoff-aceptado.png) | 172 | 31 | #drawer ∩ #legend 30240 | #toast: 100% borrosa  |  |  |
| [024-tras-guia](shots/1280x720/024-tras-guia.png) | 134 | 29 | #drawer ∩ #legend 30240 |  |  |  |
| [025-pantalla-principal-reposo](shots/1280x720/025-pantalla-principal-reposo.png) | 114 | 29 | #drawer ∩ #legend 30240 |  |  |  |
| [026-pantalla-principal-sin-paneles](shots/1280x720/026-pantalla-principal-sin-paneles.png) | 103 | 22 | #mission ∩ #legend 6576 |  |  |  |
| [027-capas-desplegable](shots/1280x720/027-capas-desplegable.png) | 111 | 22 | #mission ∩ #legend 6576 |  |  |  |
| [028-capa-real](shots/1280x720/028-capa-real.png) | 148 | 18 | #mission ∩ #legend 6576 |  |  |  |
| [029-capa-gauge](shots/1280x720/029-capa-gauge.png) | 149 | 22 | #mission ∩ #legend 6302 |  |  |  |
| [030-capa-power](shots/1280x720/030-capa-power.png) | 145 | 24 | #mission ∩ #legend 6302 |  |  |  |
| [031-capa-speed](shots/1280x720/031-capa-speed.png) | 101 | 28 | #mission ∩ #legend 6302 |  |  |  |
| [032-capa-works](shots/1280x720/032-capa-works.png) | 97 | 22 | #mission ∩ #legend 822 |  |  |  |
| [033-capa-network](shots/1280x720/033-capa-network.png) | 103 | 22 | #mission ∩ #legend 6576 |  |  |  |
| [034-ficha-ciudad-madrid](shots/1280x720/034-ficha-ciudad-madrid.png) | 130 | 32 | div.map-tools ∩ #inspector.wide 8232<br>#mission ∩ #legend 6576 |  |  |  |
| [035-ficha-relacion](shots/1280x720/035-ficha-relacion.png) | 136 | 30 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  |  |  |
| [036-ficha-relacion-abajo](shots/1280x720/036-ficha-relacion-abajo.png) | 132 | 30 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6576 |  |  |  |
| [037-menu-network-routes](shots/1280x720/037-menu-network-routes.png) | 110 | 22 | #drawer ∩ #legend 30240 |  |  |  |
| [038-menu-network-routes-medio](shots/1280x720/038-menu-network-routes-medio.png) | 113 | 22 | #drawer ∩ #legend 30240 |  |  |  |
| [039-menu-network-ops](shots/1280x720/039-menu-network-ops.png) | 112 | 23 | #drawer ∩ #legend 30240 |  |  |  |
| [040-menu-network-works](shots/1280x720/040-menu-network-works.png) | 129 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [041-menu-network-works-conv](shots/1280x720/041-menu-network-works-conv.png) | 129 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [042-menu-network-works-changers](shots/1280x720/042-menu-network-works-changers.png) | 119 | 18 | #drawer ∩ #legend 30240 |  |  |  |
| [043-menu-network-works-projects](shots/1280x720/043-menu-network-works-projects.png) | 136 | 23 | #drawer ∩ #legend 30240 |  |  |  |
| [044-menu-network-works-running](shots/1280x720/044-menu-network-works-running.png) | 92 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [045-menu-network-timetables](shots/1280x720/045-menu-network-timetables.png) | 88 | 26 | #drawer ∩ #legend 30240 |  |  |  |
| [046-menu-network-timetables-estacion](shots/1280x720/046-menu-network-timetables-estacion.png) | 89 | 27 | #drawer ∩ #legend 30240 |  |  |  |
| [047-menu-network-rivals](shots/1280x720/047-menu-network-rivals.png) | 98 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [048-menu-fleet-fleet](shots/1280x720/048-menu-fleet-fleet.png) | 109 | 31 | #drawer ∩ #legend 30240 |  |  |  |
| [049-menu-fleet-refits](shots/1280x720/049-menu-fleet-refits.png) | 128 | 22 | #drawer ∩ #legend 30240 |  |  |  |
| [050-menu-fleet-market](shots/1280x720/050-menu-fleet-market.png) | 110 | 18 | #drawer.trenespop-drawer ∩ #legend 30240<br>div.map-tools ∩ #drawer.trenespop-drawer 12099 |  |  |  |
| [051-menu-fleet-orders](shots/1280x720/051-menu-fleet-orders.png) | 104 | 23 | #drawer ∩ #legend 30240 |  |  |  |
| [052-menu-finance](shots/1280x720/052-menu-finance.png) | 91 | 25 | #drawer ∩ #legend 30240 |  |  |  |
| [053-menu-finance-abajo](shots/1280x720/053-menu-finance-abajo.png) | 103 | 22 | #drawer ∩ #legend 30240 |  |  |  |
| [054-menu-story-agenda](shots/1280x720/054-menu-story-agenda.png) | 132 | 21 | #drawer ∩ #legend 30240 |  |  |  |
| [055-menu-story-agenda-medio](shots/1280x720/055-menu-story-agenda-medio.png) | 118 | 25 | #drawer ∩ #legend 30240 |  |  |  |
| [056-menu-story-apoyo](shots/1280x720/056-menu-story-apoyo.png) | 63 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [057-menu-story-pactos](shots/1280x720/057-menu-story-pactos.png) | 116 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [058-menu-story-people](shots/1280x720/058-menu-story-people.png) | 113 | 27 | #drawer ∩ #legend 30240 |  |  |  |
| [059-menu-story-cloacas](shots/1280x720/059-menu-story-cloacas.png) | 63 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [060-menu-progress-campaign](shots/1280x720/060-menu-progress-campaign.png) | 99 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [061-menu-progress-campaign-medio](shots/1280x720/061-menu-progress-campaign-medio.png) | 101 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [062-menu-progress-hitos](shots/1280x720/062-menu-progress-hitos.png) | 100 | 24 | #drawer ∩ #legend 30240 |  |  |  |
| [063-menu-progress-research](shots/1280x720/063-menu-progress-research.png) | 92 | 21 | #drawer ∩ #legend 30240 |  |  |  |
| [064-menu-progress-research-medio](shots/1280x720/064-menu-progress-research-medio.png) | 103 | 27 | #drawer ∩ #legend 30240 |  |  |  |
| [065-menu-progress-proyectos](shots/1280x720/065-menu-progress-proyectos.png) | 126 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [066-menu-progress-proyectos-medio](shots/1280x720/066-menu-progress-proyectos-medio.png) | 106 | 21 | #drawer ∩ #legend 30240 |  |  |  |
| [067-menu-press-paper](shots/1280x720/067-menu-press-paper.png) | 80 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [068-menu-press-paper-medio](shots/1280x720/068-menu-press-paper-medio.png) | 80 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [069-menu-press-journal](shots/1280x720/069-menu-press-journal.png) | 101 | 19 | #drawer ∩ #legend 30240 |  |  |  |
| [070-menu-press-reports](shots/1280x720/070-menu-press-reports.png) | 93 | 17 | #drawer ∩ #legend 30240 |  |  |  |
| [071-trenespop-catalogo](shots/1280x720/071-trenespop-catalogo.png) | 110 | 18 | #drawer.trenespop-drawer ∩ #legend 30240<br>div.map-tools ∩ #drawer.trenespop-drawer 12099 |  |  |  |
| [072-trenespop-ficha-compra](shots/1280x720/072-trenespop-ficha-compra.png) | 19 | 1 | #drawer.trenespop-drawer ∩ #legend 30240<br>div.map-tools ∩ #drawer.trenespop-drawer 12099 |  | `#modal [data-action="confirm-buy"]` invisible |  |
| [073-flota-ficha-lote](shots/1280x720/073-flota-ficha-lote.png) | 32 | 2 | #drawer ∩ #legend 30240 |  | `#modal [data-action="refit-detail"]` invisible |  |
| [074-reforma-tren](shots/1280x720/074-reforma-tren.png) | 38 | 1 | #drawer ∩ #legend 30240 |  | `#modal [data-action="refit-confirm"]` invisible |  |
| [075-reforma-tren-abajo](shots/1280x720/075-reforma-tren-abajo.png) | 38 | 1 | #drawer ∩ #legend 30240 |  |  |  |
| [076-ficha-tramo](shots/1280x720/076-ficha-tramo.png) | 119 | 24 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6302 |  |  |  |
| [077-taller-vias](shots/1280x720/077-taller-vias.png) | 49 | 0 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6302 |  | `[data-action="track-confirm"]` invisible |  |
| [078-taller-vias-propuesta](shots/1280x720/078-taller-vias-propuesta.png) | 53 | 0 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6302 |  | `[data-action="track-confirm"]` invisible |  |
| [079-taller-vias-abajo](shots/1280x720/079-taller-vias-abajo.png) | 53 | 0 | div.map-tools ∩ #inspector 12691<br>#mission ∩ #legend 6302 |  |  |  |
| [080-despacho-agenda](shots/1280x720/080-despacho-agenda.png) | 132 | 21 | #drawer ∩ #legend 30240 |  | `.desk-decision [data-action="decision"]` no existe |  |
| [081-despacho-agenda-tras-consejo](shots/1280x720/081-despacho-agenda-tras-consejo.png) | 132 | 21 | #drawer ∩ #legend 30240 |  |  |  |
| [082-tras-cerrar-turno](shots/1280x720/082-tras-cerrar-turno.png) | 131 | 20 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  |  |  |
| [083-suceso-ilustrado](shots/1280x720/083-suceso-ilustrado.png) | 131 | 20 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  | `[data-action="game-event"]` hay que desplazar |  |
| [084-suceso-opciones](shots/1280x720/084-suceso-opciones.png) | 174 | 23 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  |  |  |
| [085-suceso-resuelto](shots/1280x720/085-suceso-resuelto.png) | 186 | 24 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  |  |  |
| [086-suceso-resuelto-t3s](shots/1280x720/086-suceso-resuelto-t3s.png) | 186 | 24 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  |  |  |
| [087-reposo-turno-2](shots/1280x720/087-reposo-turno-2.png) | 168 | 24 | div.map-tools ∩ #toast 12520<br>#mission ∩ #legend 6576 |  |  |  |
| [088-jornada-en-curso](shots/1280x720/088-jornada-en-curso.png) | 169 | 24 | div.map-tools ∩ #toast 12520<br>#mission ∩ #legend 6576 |  |  |  |
| [089-jornada-alerta-incidencia](shots/1280x720/089-jornada-alerta-incidencia.png) | 156 | 23 | div.map-tools ∩ #toast 12520<br>#mission ∩ #legend 6576 |  |  |  |
| [090-jornada-centro-control](shots/1280x720/090-jornada-centro-control.png) | 149 | 30 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  |  |  |
| [091-jornada-respondida](shots/1280x720/091-jornada-respondida.png) | 155 | 27 | #drawer ∩ #legend 30240<br>div.map-tools ∩ #toast 12520 |  |  |  |
| [092-jornada-reproduciendo-30x](shots/1280x720/092-jornada-reproduciendo-30x.png) | 104 | 22 | #mission ∩ #legend 6576 |  |  |  |
| [093-jornada-parte](shots/1280x720/093-jornada-parte.png) | 109 | 17 | #mission ∩ #legend 6576 |  | `#modal [data-action="day-next"]` invisible |  |
| [094-jornada-siguiente](shots/1280x720/094-jornada-siguiente.png) | 103 | 22 | #mission ∩ #legend 6576 |  |  |  |
| [095-menu-guardar](shots/1280x720/095-menu-guardar.png) | 56 | 0 | #mission ∩ #legend 6576 |  |  |  |
| [096-menu-ayuda](shots/1280x720/096-menu-ayuda.png) | 170 | 2 | #mission ∩ #legend 6576 |  |  |  |
| [097-menu-musica](shots/1280x720/097-menu-musica.png) | 65 | 16 | #mission ∩ #legend 6576 |  |  |  |
| [098-portada-en-partida](shots/1280x720/098-portada-en-partida.png) | 32 | 5 | #mission ∩ #legend 6576 |  |  |  |
| [099-portada-opciones](shots/1280x720/099-portada-opciones.png) | 38 | 0 | #mission ∩ #legend 6576 |  |  |  |
| [100-bienvenida-sin-guia](shots/1280x720/100-bienvenida-sin-guia.png) | 144 | 21 | #legend ∩ #entry-welcome.entry-welcome 13888<br>#mission ∩ #legend 6576<br>#daybar ∩ #entry-welcome.entry-welcome 4228 |  |  |  |
| [101-bienvenida-sin-guia-t4s](shots/1280x720/101-bienvenida-sin-guia-t4s.png) | 144 | 21 | #legend ∩ #entry-welcome.entry-welcome 13888<br>#mission ∩ #legend 6576<br>#daybar ∩ #entry-welcome.entry-welcome 4228 |  |  |  |
| [102-reposo-sin-guia](shots/1280x720/102-reposo-sin-guia.png) | 99 | 21 | #mission ∩ #legend 6576 |  |  |  |
| [103-bienvenida-continuar](shots/1280x720/103-bienvenida-continuar.png) | 131 | 22 | #legend ∩ #entry-welcome.entry-welcome 10153<br>#mission ∩ #legend 6576 |  |  |  |

### 390×844

| Paso | Palabras | Números | Solapes (px²) | Cajas borrosas/tapadas a la vez | Control pedido no visible/tapado | Desborde |
|---|---:|---:|---|---|---|---|
| [001-portada](shots/390x844/001-portada.png) | 37 | 4 |  |  |  |  |
| [002-nueva-partida](shots/390x844/002-nueva-partida.png) | 45 | 0 |  |  |  |  |
| [003-guia-1-welcome](shots/390x844/003-guia-1-welcome.png) | 99 | 13 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #coach 6162 |  |  |  |
| [004-guia-1-welcome-t3s](shots/390x844/004-guia-1-welcome-t3s.png) | 99 | 13 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #coach 6162 |  |  |  |
| [005-guia-2-network](shots/390x844/005-guia-2-network.png) | 107 | 15 | #daybar ∩ #coach 30575<br>div.map-tools ∩ #drawer 30400<br>div.map-tools ∩ #coach 5067 |  | `#drawer [data-action="route"][data-id="m` hay que desplazar |  |
| [006-guia-2-network-elegida](shots/390x844/006-guia-2-network-elegida.png) | 96 | 22 | #daybar ∩ #coach 30575<br>div.map-tools ∩ #inspector 30400<br>div.map-tools ∩ #coach 5067 |  |  |  |
| [007-guia-3-offer](shots/390x844/007-guia-3-offer.png) | 104 | 26 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #inspector 30400<br>div.map-tools ∩ #coach 6162 |  | `#routeForm [type="submit"]` 13% visible |  |
| [008-guia-3-offer-plan](shots/390x844/008-guia-3-offer-plan.png) | 104 | 26 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #inspector 30400<br>div.map-tools ∩ #coach 6162 |  | `#routeForm [type="submit"]` 13% visible |  |
| [009-guia-3-offer-aplicado](shots/390x844/009-guia-3-offer-aplicado.png) | 115 | 26 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #inspector 30400<br>#toast ∩ #coach 29684<br>div.map-tools ∩ #toast 7672<br>div.map-tools ∩ #coach 6162<br>#inspector ∩ #toast 1086 | #toast: 100% borrosa 75% tapada |  |  |
| [010-guia-4-decisions](shots/390x844/010-guia-4-decisions.png) | 131 | 15 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #drawer 30400<br>div.map-tools ∩ #coach 6162 |  | `.desk-decision [data-action="decision"]` 59% visible |  |
| [011-guia-4-decisions-resueltas](shots/390x844/011-guia-4-decisions-resueltas.png) | 143 | 18 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #drawer 30400<br>div.map-tools ∩ #coach 6162 |  |  |  |
| [012-guia-5-people](shots/390x844/012-guia-5-people.png) | 108 | 21 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #drawer 30400<br>div.map-tools ∩ #coach 6162 |  |  |  |
| [013-guia-6-research](shots/390x844/013-guia-6-research.png) | 102 | 18 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #drawer 30400<br>div.map-tools ∩ #coach 6162 |  |  |  |
| [014-guia-7-infrastructure](shots/390x844/014-guia-7-infrastructure.png) | 110 | 21 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #inspector 30400<br>div.map-tools ∩ #coach 6162 |  | `#routeFleet` hay que desplazar<br>`#frequency` hay que desplazar<br>`#routeForm [type="submit"]` invisible |  |
| [015-guia-7-infrastructure-plan](shots/390x844/015-guia-7-infrastructure-plan.png) | 101 | 27 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #inspector 30400<br>div.map-tools ∩ #coach 6162 |  | `#routeForm [type="submit"]` 12% visible |  |
| [016-guia-7-infrastructure-abierta](shots/390x844/016-guia-7-infrastructure-abierta.png) | 112 | 27 | #daybar ∩ #coach 30668<br>div.map-tools ∩ #inspector 30400<br>#toast ∩ #coach 29684<br>div.map-tools ∩ #toast 7672<br>div.map-tools ∩ #coach 6162<br>#inspector ∩ #toast 1086 | #toast: 100% borrosa 75% tapada |  |  |
| [017-guia-8-day](shots/390x844/017-guia-8-day.png) | 106 | 15 | #mission ∩ #coach 41160<br>div.map-tools ∩ #coach 13163<br>div.map-tools ∩ #toast 7672 | #toast: 100% borrosa  |  |  |
| [018-guia-8-day-incidencia](shots/390x844/018-guia-8-day-incidencia.png) | 97 | 25 | #daybar ∩ #coach 30575<br>div.map-tools ∩ #drawer 30400<br>div.map-tools ∩ #coach 5067 |  | `#drawer [data-action="respond"]` 23% visible |  |
| [019-guia-8-day-respondida](shots/390x844/019-guia-8-day-respondida.png) | 97 | 16 | #mission ∩ #coach 41160<br>div.map-tools ∩ #coach 12033<br>div.map-tools ∩ #toast 7672 | #toast: 100% borrosa  |  |  |
| [020-guia-8-day-parte](shots/390x844/020-guia-8-day-parte.png) | 93 | 12 | div.map-tools ∩ #toast 7672 |  | `#modal [data-action="day-next"]` invisible |  |
| [021-guia-8-day-siguiente](shots/390x844/021-guia-8-day-siguiente.png) | 93 | 15 | #coach ∩ #mission 41160<br>#coach ∩ div.map-tools 13163 |  |  |  |
| [022-guia-9-handoff](shots/390x844/022-guia-9-handoff.png) | 143 | 18 | #coach ∩ #daybar 30668<br>div.map-tools ∩ #drawer 30400<br>#coach ∩ div.map-tools 6162 |  | `[data-action="tycoon-public"]` invisible |  |
| [023-guia-9-handoff-aceptado](shots/390x844/023-guia-9-handoff-aceptado.png) | 133 | 16 | #coach ∩ #daybar 30668<br>div.map-tools ∩ #drawer 30400<br>#coach ∩ #toast 29684<br>div.map-tools ∩ #toast 8832<br>#drawer ∩ #toast 7602<br>#coach ∩ div.map-tools 6162 | #toast: 75% borrosa 50% tapada |  |  |
| [024-tras-guia](shots/390x844/024-tras-guia.png) | 130 | 16 | #drawer ∩ #toast 96292<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 17149 | #drawer: 50% tapada |  |  |
| [025-pantalla-principal-reposo](shots/390x844/025-pantalla-principal-reposo.png) | 130 | 16 | #drawer ∩ #toast 96292<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 17149 | #drawer: 50% tapada |  |  |
| [026-pantalla-principal-sin-paneles](shots/390x844/026-pantalla-principal-sin-paneles.png) | 91 | 12 | div.map-tools ∩ #toast 17149 |  |  |  |
| [027-capas-desplegable](shots/390x844/027-capas-desplegable.png) | 81 | 12 | div.map-tools ∩ #toast 8832 |  |  |  |
| [028-capa-real](shots/390x844/028-capa-real.png) | 112 | 12 | div.map-tools ∩ #toast 21764 |  |  |  |
| [029-capa-gauge](shots/390x844/029-capa-gauge.png) | 117 | 12 | div.map-tools ∩ #toast 21764 |  |  |  |
| [030-capa-power](shots/390x844/030-capa-power.png) | 98 | 12 | div.map-tools ∩ #toast 13571 |  |  |  |
| [031-capa-speed](shots/390x844/031-capa-speed.png) | 98 | 12 | div.map-tools ∩ #toast 13571 |  |  |  |
| [032-capa-works](shots/390x844/032-capa-works.png) | 54 | 12 |  |  |  |  |
| [033-capa-network](shots/390x844/033-capa-network.png) | 54 | 12 |  |  |  |  |
| [034-ficha-ciudad-madrid](shots/390x844/034-ficha-ciudad-madrid.png) | 78 | 20 | div.map-tools ∩ #inspector.wide 38890<br>header ∩ #inspector.wide 29920 |  |  |  |
| [035-ficha-relacion](shots/390x844/035-ficha-relacion.png) | 65 | 21 | div.map-tools ∩ #inspector 38890 |  |  |  |
| [036-ficha-relacion-abajo](shots/390x844/036-ficha-relacion-abajo.png) | 74 | 29 | div.map-tools ∩ #inspector 38890 |  |  |  |
| [037-menu-network-routes](shots/390x844/037-menu-network-routes.png) | 86 | 16 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [038-menu-network-routes-medio](shots/390x844/038-menu-network-routes-medio.png) | 83 | 15 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [039-menu-network-ops](shots/390x844/039-menu-network-ops.png) | 81 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [040-menu-network-works](shots/390x844/040-menu-network-works.png) | 96 | 13 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [041-menu-network-works-conv](shots/390x844/041-menu-network-works-conv.png) | 96 | 13 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [042-menu-network-works-changers](shots/390x844/042-menu-network-works-changers.png) | 91 | 12 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [043-menu-network-works-projects](shots/390x844/043-menu-network-works-projects.png) | 106 | 16 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [044-menu-network-works-running](shots/390x844/044-menu-network-works-running.png) | 63 | 11 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [045-menu-network-timetables](shots/390x844/045-menu-network-timetables.png) | 63 | 20 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [046-menu-network-timetables-estacion](shots/390x844/046-menu-network-timetables-estacion.png) | 63 | 22 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [047-menu-network-rivals](shots/390x844/047-menu-network-rivals.png) | 81 | 21 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [048-menu-fleet-fleet](shots/390x844/048-menu-fleet-fleet.png) | 82 | 20 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [049-menu-fleet-refits](shots/390x844/049-menu-fleet-refits.png) | 101 | 16 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [050-menu-fleet-market](shots/390x844/050-menu-fleet-market.png) | 101 | 25 | div.map-tools ∩ #drawer.trenespop-drawer 37754<br>header ∩ #drawer.trenespop-drawer 28860<br>#drawer.trenespop-drawer ∩ #daybar 25160 |  |  |  |
| [051-menu-fleet-orders](shots/390x844/051-menu-fleet-orders.png) | 96 | 20 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [052-menu-finance](shots/390x844/052-menu-finance.png) | 79 | 19 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [053-menu-finance-abajo](shots/390x844/053-menu-finance-abajo.png) | 91 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [054-menu-story-agenda](shots/390x844/054-menu-story-agenda.png) | 110 | 15 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [055-menu-story-agenda-medio](shots/390x844/055-menu-story-agenda-medio.png) | 87 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [056-menu-story-apoyo](shots/390x844/056-menu-story-apoyo.png) | 71 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [057-menu-story-pactos](shots/390x844/057-menu-story-pactos.png) | 93 | 18 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [058-menu-story-people](shots/390x844/058-menu-story-people.png) | 86 | 21 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [059-menu-story-cloacas](shots/390x844/059-menu-story-cloacas.png) | 88 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [060-menu-progress-campaign](shots/390x844/060-menu-progress-campaign.png) | 79 | 11 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [061-menu-progress-campaign-medio](shots/390x844/061-menu-progress-campaign-medio.png) | 74 | 13 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [062-menu-progress-hitos](shots/390x844/062-menu-progress-hitos.png) | 82 | 22 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [063-menu-progress-research](shots/390x844/063-menu-progress-research.png) | 73 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [064-menu-progress-research-medio](shots/390x844/064-menu-progress-research-medio.png) | 59 | 17 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [065-menu-progress-proyectos](shots/390x844/065-menu-progress-proyectos.png) | 104 | 13 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [066-menu-progress-proyectos-medio](shots/390x844/066-menu-progress-proyectos-medio.png) | 100 | 18 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [067-menu-press-paper](shots/390x844/067-menu-press-paper.png) | 53 | 11 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [068-menu-press-paper-medio](shots/390x844/068-menu-press-paper-medio.png) | 53 | 11 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [069-menu-press-journal](shots/390x844/069-menu-press-journal.png) | 96 | 13 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [070-menu-press-reports](shots/390x844/070-menu-press-reports.png) | 65 | 11 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [071-trenespop-catalogo](shots/390x844/071-trenespop-catalogo.png) | 101 | 25 | div.map-tools ∩ #drawer.trenespop-drawer 37754<br>header ∩ #drawer.trenespop-drawer 28860<br>#drawer.trenespop-drawer ∩ #daybar 25160 |  |  |  |
| [072-trenespop-ficha-compra](shots/390x844/072-trenespop-ficha-compra.png) | 80 | 11 | div.map-tools ∩ #drawer.trenespop-drawer 37754<br>header ∩ #drawer.trenespop-drawer 28860<br>#drawer.trenespop-drawer ∩ #daybar 25160 |  | `#modal [data-action="confirm-buy"]` invisible |  |
| [073-flota-ficha-lote](shots/390x844/073-flota-ficha-lote.png) | 52 | 9 | div.map-tools ∩ #drawer 38890 |  | `#modal [data-action="refit-detail"]` invisible |  |
| [074-reforma-tren](shots/390x844/074-reforma-tren.png) | 73 | 5 | div.map-tools ∩ #drawer 38890 |  | `#modal [data-action="refit-confirm"]` invisible |  |
| [075-reforma-tren-abajo](shots/390x844/075-reforma-tren-abajo.png) | 73 | 5 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [076-ficha-tramo](shots/390x844/076-ficha-tramo.png) | 60 | 15 | div.map-tools ∩ #inspector 38890 |  |  |  |
| [077-taller-vias](shots/390x844/077-taller-vias.png) | 103 | 4 | div.map-tools ∩ #inspector 38890 |  | `[data-action="track-confirm"]` invisible |  |
| [078-taller-vias-propuesta](shots/390x844/078-taller-vias-propuesta.png) | 110 | 3 | div.map-tools ∩ #inspector 38890 |  | `[data-action="track-confirm"]` invisible |  |
| [079-taller-vias-abajo](shots/390x844/079-taller-vias-abajo.png) | 110 | 3 | div.map-tools ∩ #inspector 38890 |  |  |  |
| [080-despacho-agenda](shots/390x844/080-despacho-agenda.png) | 110 | 15 | div.map-tools ∩ #drawer 38890 |  | `.desk-decision [data-action="decision"]` no existe |  |
| [081-despacho-agenda-tras-consejo](shots/390x844/081-despacho-agenda-tras-consejo.png) | 110 | 15 | div.map-tools ∩ #drawer 38890 |  |  |  |
| [082-tras-cerrar-turno](shots/390x844/082-tras-cerrar-turno.png) | 125 | 14 | #drawer ∩ #toast 122209<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 21764 | #drawer: 50% tapada |  |  |
| [083-suceso-ilustrado](shots/390x844/083-suceso-ilustrado.png) | 125 | 14 | #drawer ∩ #toast 122209<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 21764 | #drawer: 50% tapada | `[data-action="game-event"]` tapado 49% visible |  |
| [084-suceso-opciones](shots/390x844/084-suceso-opciones.png) | 129 | 15 | #drawer ∩ #toast 122209<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 21764 | #drawer: 50% tapada | `[data-action="game-event"]` tapado  |  |
| [085-suceso-resuelto](shots/390x844/085-suceso-resuelto.png) | 170 | 17 | #drawer ∩ #toast 122209<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 21764 | #drawer: 50% tapada |  |  |
| [086-suceso-resuelto-t3s](shots/390x844/086-suceso-resuelto-t3s.png) | 170 | 17 | #drawer ∩ #toast 122209<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 21764 | #drawer: 50% tapada |  |  |
| [087-reposo-turno-2](shots/390x844/087-reposo-turno-2.png) | 110 | 13 | div.map-tools ∩ #toast 21764 |  |  |  |
| [088-jornada-en-curso](shots/390x844/088-jornada-en-curso.png) | 94 | 13 | div.map-tools ∩ #toast 21764 |  |  |  |
| [089-jornada-alerta-incidencia](shots/390x844/089-jornada-alerta-incidencia.png) | 94 | 13 | div.map-tools ∩ #toast 21764 |  | `.alert-pill [data-action="open-incidents` no existe |  |
| [090-jornada-centro-control](shots/390x844/090-jornada-centro-control.png) | 100 | 19 | #drawer ∩ #toast 122209<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 21764 | #drawer: 50% tapada | `#drawer [data-action="respond"]` no existe |  |
| [091-jornada-respondida](shots/390x844/091-jornada-respondida.png) | 95 | 20 | #drawer ∩ #toast 103894<br>div.map-tools ∩ #drawer 38890<br>div.map-tools ∩ #toast 18503 | #drawer: 50% tapada |  |  |
| [092-jornada-reproduciendo-30x](shots/390x844/092-jornada-reproduciendo-30x.png) | 85 | 12 | div.map-tools ∩ #toast 12507<br>header ∩ div.alert-pill 6588<br>#mission ∩ div.alert-pill 4037<br>div.map-tools ∩ div.alert-pill 1080 |  |  |  |
| [093-jornada-parte](shots/390x844/093-jornada-parte.png) | 70 | 15 | div.map-tools ∩ #toast 12507<br>header ∩ div.alert-pill 6588<br>#mission ∩ div.alert-pill 4037<br>div.map-tools ∩ div.alert-pill 1080 |  | `#modal [data-action="day-next"]` invisible |  |
| [094-jornada-siguiente](shots/390x844/094-jornada-siguiente.png) | 86 | 12 | div.map-tools ∩ #toast 12507<br>header ∩ div.alert-pill 6588<br>#mission ∩ div.alert-pill 4037<br>div.map-tools ∩ div.alert-pill 1080 |  |  |  |
| [095-menu-guardar](shots/390x844/095-menu-guardar.png) | 55 | 0 |  |  |  |  |
| [096-menu-ayuda](shots/390x844/096-menu-ayuda.png) | 165 | 2 |  |  |  |  |
| [097-menu-musica](shots/390x844/097-menu-musica.png) | 75 | 19 |  |  |  |  |
| [098-portada-en-partida](shots/390x844/098-portada-en-partida.png) | 32 | 5 |  |  |  |  |
| [099-portada-opciones](shots/390x844/099-portada-opciones.png) | 41 | 0 |  |  |  |  |
| [100-bienvenida-sin-guia](shots/390x844/100-bienvenida-sin-guia.png) | 96 | 13 | #mission ∩ #entry-welcome.entry-welcome 41650<br>div.map-tools ∩ #entry-welcome.entry-welcome 31545 |  |  |  |
| [101-bienvenida-sin-guia-t4s](shots/390x844/101-bienvenida-sin-guia-t4s.png) | 96 | 13 | #mission ∩ #entry-welcome.entry-welcome 41650<br>div.map-tools ∩ #entry-welcome.entry-welcome 31545 |  |  |  |
| [102-reposo-sin-guia](shots/390x844/102-reposo-sin-guia.png) | 52 | 13 |  |  |  |  |
| [103-bienvenida-continuar](shots/390x844/103-bienvenida-continuar.png) | 84 | 14 | #mission ∩ #entry-welcome.entry-welcome 41650<br>div.map-tools ∩ #entry-welcome.entry-welcome 28519 |  |  |  |


---

## 6. Para la siguiente fase (restricciones verificadas en el código)

- **Textos congelados.** No se toca ningún texto grabado:
  - la guía de `TOUR_STEPS` en `app.js`, que es narración;
  - `narration-data.js`;
  - las tarjetas `N.card` y los mensajes de `narrator.toast`;
  - los diálogos del consejo y los sucesos.
  Sí se puede mostrar u ocultar el bloque «Detalle» (es texto de UI, no grabado), cambiar el tamaño, la posición y el orden de las cajas, y limitar la cola visible.
- **Cadenas que el publicador busca.**
  - `tools/extract-game-source.mjs` exige `<footer class="menu-council">` en `main-menu.js`.
  - Exige también las dos cadenas `toast('No se ha podido reproducir la voz…')` y `toast('Esta voz aún está en producción…')` en `voice.js`, y `NARRATION_VOICES[id]` y `await response.arrayBuffer()`.
- **Puntos de enganche ya disponibles.**
  - `U.nextAction(s)` / `J.nextAction(s)` devuelven {label, action}: sirven para la píldora de objetivo permanente.
  - `J.CHALLENGES[i].text` es el requisito corto de cada reto, que puede sustituir al nombre poético.
  - `positionTour()` calcula el hueco y la posición de la caja de la guía: ahí hay que esquivar `#toast` y `.alert-pill` y apuntar al control concreto (`#routeForm`, `[data-action=tycoon-public]`, `[data-action=day-next]`).
  - `narrator.toast()` crea las tarjetas, y `#toast` tiene z-index 30 frente a las sombras de la guía, con 40.
- **Comprobador.**
  - `checker.mjs` exporta `launch()`, `check(page, label, {outDir, focus:[selectores], screenshot})`, `summarize(report)` y `problems(report, {allowOverlap:[[reA, reB]], ignoreFocus:[]})`. Este último devuelve `[]` si la pantalla está limpia y sirve para hacer asserts.
  - Cada informe incluye `overlaps` (kind `issue` o `modal-cover`), `containers[].blurredPct/coveredPct/concurrent`, `dimGroups`, `words`, `numbers`, `perContainer`, `overflow`, `offscreen`, `focus[]` (visible, `shownPct`, `coveredBy`, `blurred`) y `guide` (paso, caja, anillo, objetivo, `coachOverTarget`).
  - Termina las animaciones finitas antes de medir.
  - En máquinas compartidas conviene la guarda de mapa estático de `drive.mjs`, la misma que usa `onboarding-ui-test.mjs` con `QA_STATIC_MAP`.
