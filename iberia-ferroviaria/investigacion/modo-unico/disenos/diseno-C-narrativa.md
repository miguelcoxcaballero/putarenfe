# Diseño C · «Tenfe»: un solo juego que no miente

**Línea de este diseño:** la verdad narrativa va primero. Cada una de las 412 grabaciones es una promesa que el motor tiene que cumplir. Por eso decido primero el calendario, el reparto de personajes, el modelo de hechos y el motor que elige qué diálogo suena. Sobre esa base construyo la red real, Trenespop, la rejugabilidad y la interfaz.

**Fuentes leídas:** los tres inventarios, las restricciones, las tres auditorías (y sus JSON), `segments.json`, `trains.json`, las reglas de infraestructura, la reutilización de Trenespop, las cuatro investigaciones de juegos y la síntesis. Además he comprobado en `proyecto/dist` los textos reales de `story.js`, `encounters.js`, `induction.js`, `tycoon.js`, `rescate-data.js`, `infra.js` y `main-menu.js`. No he tocado el repositorio.

**Cómo leerlo.** El §0 cabe en una pantalla. Del §2 al §11 van las decisiones D1–D10. El §7 (D6) es el núcleo y el más largo. Las cifras son el punto de partida para el equilibrado: las que salen en una voz grabada están marcadas con 🔒 y no se pueden cambiar.

---

## 0. En una pantalla

**El juego.** Hay un solo modo, «Partida», con una pantalla de «Nueva partida». En ella eliges:
- la situación de partida: *2022 · Tenfe real* (histórica, con el tutorial hablado), *2027 · Rescate* o una situación sembrada;
- una semilla;
- tu rasgo como presidente de Tenfe;
- la dificultad;
- y unas «Reglas de maqueta» opcionales, que sustituyen al antiguo modo libre.

Todo comparte el mismo motor, mapa, interfaz y guardado (`iberia-ferroviaria-v5`).

| | Decisión | Por qué, en una línea |
|---|---|---|
| D1 | Empieza en **enero de 2022** y el reloj avanza **por días** (⏸ ▶ ▶▶ ▶▶▶). Cada **lunes** pasa por el despacho y cada mes tiene su **cierre**. Elecciones reales el **23-7-2023** y después cada cuatro años, o antes si se adelantan. El 21-11-2023 Óscar sustituye a Raquel en el Ministerio. Veredicto en **2051** y después prórroga sin fin. La situación *2027 · Rescate* tiene su propio calendario. | Así siguen siendo verdad 407 de las 412 tomas: el tutorial de «Enero de 2022», las nueve decisiones históricas y el cierre mensual que explica la guía. |
| D2 | **Escala real del clásico en M€.** Se conservan la demanda y los costes del clásico. La OSP se cobra por tren-km y baja si fallan los esenciales (idea del rescate). Un impago da cinco salidas en lugar del préstamo automático, y las tarifas se actualizan con el IPC. | Las voces citan 4 M€, 0,3 M€, 18.000 € y 9.000 €. La escala pequeña del rescate no tiene ninguna voz grabada que defender. |
| D3 | **Red real por tramos.** Cada tramo tiene ancho, tensión (ninguna, 3 kV o 25 kV), velocidad máxima, vía única, mixta o doble, estado de la vía y etiquetas. Hay 13 obras con coste, plazo y modo de servicio. Las relaciones son las reales, y se pueden crear nuevas al estilo de Cities. | Es lo que pide R3, y es la única manera de que «la vía entre Ávila y Medina» o «la catenaria congelada en tres puertos» sean ciertas. |
| D4 | **20 modelos reales con nombre paródico** y una sola regla de etiquetas: ancho × energía × velocidad máxima × gálibo. Trenespop se abre desde una relación y agrupa los trenes en «✓ Pueden circular», «◐ Con cambiador» y «✗ No pueden», cada uno con su motivo. | Diésel, 3 kV, bitensión, bimodo, ancho variable y AVE de 25 kV se distinguen y se ven en el mapa. |
| D5 | Semilla, situación, rasgo, 0–3 modificadores, rivales con entrada sembrada, sucesos con causa situados en un tramo, agendas de los personajes, retos, hitos, reto semanal y prórroga. | Como en Tropico y Cities: cada partida es distinta por el estado del juego, no por tirar dados. |
| D6 | **Motor de verdad:** hechos → contrato por cada cuerpo grabado → director con cola, ventanas y revalidación → efectos con etiqueta visible → compromisos rastreados → memoria de cada personaje. Se retiran 5 cuerpos. Hacen falta **72 líneas nuevas** (≈ 1 h de CPU). | R2: si un diálogo dice algo, pasa. Si no hay nada cierto que decir, no suena nada. |
| D7 | **Se mantiene** casi todo lo bueno de cada modo. **Se van** las tres órdenes por semana, el ★ como moneda, «Delegar mes», la permutación de encuentros, el préstamo automático, el pago inmediato de las peticiones, las cajas dentro de cajas y la interfaz oscura del rescate. | Cada cosa que se va lo hace porque contradice una voz, un requisito del usuario o la claridad. |
| D8 | **Nueve préstamos de Airport CEO:** monitor de servicios, triaje de avisos, incidencias con plazo, nota y parte cuadrado, protocolos permanentes, notas en dos niveles con categoría, renegociación sin recargar, planos de obra, cajón de gestión de dos niveles como máximo y Operador del Año. | R6. |
| D9 | **Seis secciones** (Red, Flota, Dinero, Despacho, Progreso y Prensa), cada una con cinco pestañas como máximo. La ficha del objeto va a la derecha; la misión y «Siguiente», a la izquierda; los avisos se clasifican. Las frases de los paneles tienen como mucho 12 palabras. | R5. Además, el tutorial grabado nombra «Qué puede circular», «Competencia», «Investigación» y la «Agenda», así que esos nombres se quedan. |
| D10 | **Ocho fases** publicables. La fase 1 se hace en días: una sola «Nueva partida» con reglas de maqueta (el modo libre queda absorbido) y diálogos que hablan de lo que de verdad pasa. | R7. |

**Pitch para el jugador:**
> Enero de 2022. Te sientan en la presidencia de Tenfe con media flota parada, dos anchos de vía que no se hablan y nueve personajes que quieren cosas distintas. Diriges la red real: catenaria de 3 o de 25 kV, vía única o doble, Alvias que cambian de ancho y regionales diésel que nadie quiere jubilar. En Trenespop compras los trenes que de verdad pueden circular por ella. El reloj no se para: cada día salen los trenes reales, cada mes llegan el balance, las obras y las entregas, y cada cuatro años hay elecciones que ganas o pierdes según lo que hayas hecho. Todo lo que te dicen pasa. Si le prometes catenaria a Teruel, queda apuntado, y Paco vuelve si no cumples.

---

## 1. Principios

### 1.1 Cinco reglas de verdad
1. **Lo que se oye es cierto.** Cada cuerpo grabado tiene un contrato con tres partes: qué hechos tienen que ser verdad para que suene, qué afirma y qué hace cada opción. El director solo lo reproduce si el contrato se cumple en ese momento. Lo vuelve a comprobar justo antes de mostrarlo y al cargar una partida.
2. **El silencio vale más que una mentira.** Si ningún cuerpo es cierto, no suena nada. No hay relleno.
3. **Las etiquetas son acciones.** «Reducir la oferta» reduce la oferta. «Prometer catenaria» crea un compromiso con fecha. «Bajar tarifas» baja las tarifas. Cada efecto deja una marca visible en el objeto al que afecta, con su cuenta atrás.
4. **Los números de las voces son constantes del motor.** «Abrir cuesta 4 M€», «veinte maquinistas, 0,3 M€», «18.000 € el equipo»: una prueba compara cada cifra hablada con el valor del motor. Las cifras que cambian van en una línea escrita, sin voz, bajo el diálogo.
5. **Los dados solo están en dos sitios.** El primero es la semilla de la partida. El segundo son los riesgos cuya probabilidad se ve y depende del estado: el robo de cable en un tramo de 3 kV sin vigilancia, la avería de una unidad vieja. Cada tirada se siembra con la semilla, la fecha y el dominio, así que recargar la partida no cambia el resultado.

### 1.2 Tres reglas de diversión
1. **Siempre hay algo que mirar y algo que decidir.** Cada día pasan trenes e incidencias, cada mes hay un balance, cada año un acto y cada cuatro años unas elecciones.
2. **Las causas se ven.** Cualquier número abre su «¿Por qué?» con un máximo de cinco causas y un botón «Ir ›».
3. **Las partidas divergen.** La semilla, la situación, el rasgo, quién ocupa el Ministerio y qué personajes se enfadan contigo cambian la red que construyes.

---

## 2. D1 · Calendario, tiempo y turnos

### 2.1 Por qué 2022

Hay tres argumentos, de más a menos importante.

**1. El tutorial.**
- Son 50 tomas: 36 de inducción y 14 de respuesta. Dicen literalmente «Enero de 2022».
- Describen el bucle clásico: la jornada con avería, el equipo de 18.000 €, el parte y «al cerrar el mes llegan el balance, las entregas…».
- Presentan a Óscar como «hoy alcalde consultado».
- Solo son ciertas si la partida empieza en enero de 2022 con esa economía.

**2. La historia real.**
- Hay nueve decisiones históricas: burgos, discounts, Rossa, murcia, gauge, pajares, extremadura, s106 y futuretender.
- A ellas se suman el adelanto electoral (`event:election`, mayo de 2023) y los presupuestos prorrogados (`event:freeze`, 2024).
- Todas ocurren en fechas reales entre 2022 y 2026.

**3. El reparto.**
- Raquel es ministra en 2022–2023 y Óscar a partir de noviembre de 2023, igual que en la realidad.
- En la realidad, el nuevo ministro tomó posesión el 21-11-2023, ocho días antes de abrirse la Variante de Pajares, y la toma `decision:pajares` está grabada con la voz del sucesor.

**El rescate no se pierde.** Pasa a ser la situación *2027 · Rescate*, una partida de «¿Y si…?» con su propio calendario y reparto (§2.6). Allí son ciertas las dos tomas grabadas del rescate (`t-1`, `t-2`).

### 2.2 El reloj: por días, con pausa y tres velocidades

La unidad del motor es el **día**. El jugador elige la velocidad (como en Cities, Tropico o Airport CEO):

| Control | Qué se ve | Ritmo orientativo |
|---|---|---|
| ⏸ Pausa | Todo parado; mirar y comparar es gratis | — |
| ▶ Jornada | Los trenes reales del horario GTFS se mueven minuto a minuto; las incidencias salen en el mapa y se pueden atender | 1 día ≈ 18 s (60 min de juego por segundo) |
| ▶▶ Rápido | Los trenes aparecen como puntos sobre sus relaciones; las incidencias las resuelve el **protocolo** | 1 día ≈ 1,5 s |
| ▶▶▶ Muy rápido | Sin animación de trenes; el mapa muestra la ocupación | 1 día ≈ 0,4 s (un mes en ≈ 12 s) |

**Cuatro latidos con contenido.** Los cuatro son los mismos para el motor y para las voces.

| Latido | Qué pasa | Qué dice la voz que lo hace cierto |
|---|---|---|
| **Cada día** | <ul><li>A las 06:00 se aplican las aperturas históricas en su día exacto (Burgos el 21-7-2022).</li><li>Plan de servicio de la jornada, sacado del horario real.</li><li>Incidencias y picos de demanda.</li><li>Riesgos situados en tramos.</li><li>El parte del día se suma al libro del mes.</li></ul> | «Cada jornada avanza un día» 🔒 |
| **Cada lunes, 07:00** | <ul><li>El director narrativo elige como mucho una escena (encuentro, pacto o petición).</li><li>Los rivales ajustan su cuota.</li><li>Los grupos derivan un 7 % hacia su objetivo.</li></ul> | Las ventanas de los encuentros se cuentan en días (×7 respecto a la auditoría) |
| **Cierre de mes** | <ul><li>Balance (con el libro de los días), desgaste de la flota y de la vía.</li><li>Entregas, fases de obra, formación e investigación vencidas.</li><li>OSP y sus penalizaciones, rachas de los encargos, crédito.</li><li>Portada de la Gaceta, comprobación de hitos e **Informe del mes**.</li></ul> | «Al cerrar el mes llegan el balance, las entregas, las obras, la formación y la investigación que hayan vencido» 🔒 |
| **Elecciones** | Noche electoral: voto, resultado y reparto | §2.4 |

**La jornada deja de ser un impuesto.** La auditoría midió que en el clásico delegar el mes siempre salía mejor que jugarlo, por tres razones que se corrigen así:
- **«Delegar mes» desaparece.** Los días a ▶▶ o ▶▶▶ se simulan con las mismas tiradas sembradas que a ▶, y las incidencias se resuelven con el *protocolo* que hayas fijado (préstamo de Airport CEO, §9). Por ejemplo: «avería con más de 20 min: equipo; señal: esperar; con picos: refuerzo si hay unidad libre».
- **El parte del día alimenta el mes:**
  - la puntualidad mensual de cada relación es la fiabilidad analítica menos los minutos de retraso no atendidos de sus días;
  - los ingresos descuentan las circulaciones canceladas (huelgas, falta de maquinistas, cortes) y las devoluciones por retraso;
  - los picos atendidos pagan su bonificación.
- **Jugar a ▶ compensa, pero no es obligatorio.** Atiendes cada incidencia a tu manera y puedes cazar picos que el protocolo no ve. A cambio cuesta tiempo real. No hay ninguna jugada que domine a las demás.
- **Pausa automática configurable**, con todo activado por defecto en el tutorial:
  - con una decisión;
  - con un aviso crítico;
  - al final de cada jornada a ▶ (así es cierto «Termina la jornada… y pasa al día siguiente» 🔒);
  - al cerrar el mes, solo si el informe trae algo.

### 2.3 El horario real (GTFS) se queda

- `schedule.js` y `operations.servicePlan` siguen generando las circulaciones reales (L/S/D y festivos), recortadas a tu frecuencia.
- Las relaciones nuevas (regionales y media distancia, o las que crees tú) tienen salidas repartidas igual que hoy.
- El modo «Solo mirar los trenes» sigue en la portada.
- **Coste:** el plan se guarda en caché por `infra.ver` y los proyectos. A ▶▶▶ no se simula minuto a minuto; solo se agregan las circulaciones, los retrasos y las cancelaciones del día. Presupuesto de rendimiento: ≤ 5 ms por día simulado en un portátil normal (§12).

### 2.4 Legislaturas y elecciones (situación 2022)

| Fecha | Qué pasa | Voces que lo hacen cierto |
|---|---|---|
| 29-5-2023 | Pedro Sancho adelanta las elecciones (histórico) | `event:election` «He convocado elecciones, que me apetecía…» → compromiso de inaugurar algo antes del 16-7-2023 |
| 23-7-2023 | **Elecciones.** Voto = Σ media de 26 semanas de cada grupo × peso (regla del rescate). Ganar exige ≥ 50 % | `el-forecast` seis meses antes, `el-win` / `el-win-2` / `el-lose` (nuevas) |
| 21-11-2023 | Nuevo Gobierno. **Óscar del Puente** pasa a Transportes y Raquel sale (si ganaste) | `decision:pajares` (29-11-2023, voz del sucesor) |
| Julio de 2027, 2031, 2035, 2039, 2043, 2047 | Elecciones ordinarias cada cuatro años | `arc:4` («Se acercan las elecciones») dentro de los 12 meses previos |
| Cualquier año desde 2025 | **Adelanto** si la encuesta está en ≥ 52 % y han pasado ≥ 30 meses de legislatura. Se anuncia 8 semanas antes | `event:election` (se puede repetir, con 10 años de espera) |
| Tras ganar en 2047 | «El último gran mandato» | `decision:legacyvote` «Quedan cuatro años» 🔒: la legislatura 2047–2051 |
| Julio de 2051 | **Veredicto del plan** (puntuación, medallas, hemeroteca de promesas) | `veredicto-bien` / `veredicto-mal` (nuevas) |
| Después | **Prórroga** sin fin: siguen las elecciones cada cuatro años, los encuentros, los rivales y el mercado. Los actos ya están cerrados | `prorroga` (nueva) |

- **Perder unas elecciones termina la partida** («El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú»). Es la regla del rescate y mantiene ciertas las voces posteriores de Pedro Sancho.
  - En la dificultad Fácil la oposición resta 0 puntos.
  - En las reglas de maqueta se puede activar «Perder no termina» (sin medallas).
- **Cese.** Si la confianza del Gobierno se queda por debajo de 15 durante 6 cierres seguidos, Pedro te cesa (regla clásica). Hace falta la voz nueva `cesado`, porque `chapter:competition` avisa: «Si sale mal, ya sabes dónde está la puerta».

### 2.5 Reparto por fecha y por estado (situación 2022)

| Persona (clave) | Cargo mostrado | Desde | Hasta | Condición |
|---|---|---|---|---|
| Pedro Sancho (`president`) | Presidente del Gobierno | 1-2022 | siempre | Si pierde unas elecciones, se acaba la partida |
| Raquel Sanz (`minister`) | Ministra de Transportes | 1-2022 | 20-11-2023 | Vuelve solo con una **remodelación** (§7.11) |
| Óscar del Puente (`successor`) | **Alcalde de Pucela** (el «alcalde consultado» del tutorial) | 1-2022 | 20-11-2023 | Solo habla en la inducción |
| | Ministro de Transportes | 21-11-2023 | hasta una remodelación | |
| Charo Tijera (`treasury`) | Secretaria de Estado de Presupuestos | siempre | | |
| Benito Balasto (`adif`) | Jefe de obras de Adif | siempre | | Si lo cesas por un escándalo, calla 52 semanas y lo sustituye un «jefe en funciones» sin voz (los avisos de Adif salen por escrito) |
| Fermín Bogie (`workshop`) | Jefe de talleres | siempre | | |
| Marisa Andén (`riders`) | Portavoz de los viajeros | siempre | | Viaja en el **Norte** (Madrid–Ávila–Valladolid–León) |
| Paco Terruño (`mayor`) | Alcalde de Villanueva del Andén | siempre | | Pueblo de 412 habitantes 🔒 con «una estación preciosa sin trenes» 🔒 en el Norte, entre Ávila y Medina |
| Íñigo Asfalto (`rival`) | Autocares Meseta | siempre | | También es el **Conseguidor** de las cloacas |

**Cómo se usa el reparto.** Cada contrato de diálogo exige `enCargo(persona)`. Las ventanas de Raquel y de Óscar dejan de estar fijadas a mano (como hoy, `rescate.js:686`) y pasan a ser un hecho del estado.

### 2.6 La situación *2027 · Rescate* (y las sembradas)

**Premisa en la tarjeta:**
> «Diciembre de 2026: elecciones anticipadas. Pedro Sancho repite y devuelve a Raquel Sanz a Transportes con un plan de ocho años. Tenfe está en quiebra técnica.»

Es ficción declarada: las elecciones reales de 2027 todavía no han ocurrido.

- **Calendario:**
  - empieza el 4-1-2027;
  - elecciones en diciembre de 2030 y diciembre de 2034 (las semanas 208 y 416 del rescate);
  - veredicto en diciembre de 2034 y después prórroga.
- **Reparto:**
  - Raquel, ministra de 2027 a 2030;
  - Óscar, «exministro» sin voz, vuelve a Transportes en enero de 2031 si ganas.
- **Las voces grabadas son ciertas por diseño:**
  - `t-1` (Raquel): «Bienvenido a Tenfe… no hay dinero, no hay trenes y el Norte llega tarde… Tienes ocho años. Las primeras trece semanas deciden si llegas a la segunda.»
    - El plan dura 8 años.
    - La caja está en reserva mínima.
    - La flota útil es escasa.
    - El Norte tiene un historial rojo de 6 meses.
    - Si **no cumples la etapa 1 en 13 semanas, la partida termina** (línea nueva `s1-fallo`, con «Reintentar»).
  - `t-2` (Marisa): «Pincha en el corredor Norte del mapa. Ese que parpadea en rojo. Así llevamos meses.»
    - Parpadea el **trazo del Norte**, no todo el lienzo.
    - Su pestaña «Historia» enseña los seis meses anteriores en rojo, sembrados en el estado inicial.
- **Situaciones sembradas** (deuda, fondos europeos, huelga, herencia envenenada, año preelectoral): parten de la misma premisa de 2027 y cambian los parámetros (§6.2). Así `t-1` y `t-2` siguen siendo verdad en todas.
- **Aperturas históricas:** en las situaciones de 2027 la red empieza con toda la historia de 2022 a 2026 ya aplicada. Las decisiones con fecha anterior no suenan.

### 2.7 Qué decide el jugador en cada momento

Ya no hay «tres órdenes por semana».
- **Lo que limita** son los recursos físicos, todos a la vista:
  - caja y crédito;
  - unidades libres y compatibles;
  - maquinistas (contratar 20 cuesta 0,3 M€ 🔒 y la formación dura 3 meses 🔒);
  - frentes de obra (cuadrillas);
  - plazas de taller;
  - una sola investigación en curso 🔒.
- **Por qué no hay órdenes:**
  - es lo que hacen Cities y Tropico;
  - ninguna voz grabada habla de órdenes (la única era `t-6`, que no está grabada);
  - el reloj continuo no encaja con una cuota por turno.
- **La escasez se nota igual,** pero se explica sola: «No hay cuadrilla libre → Contratar contrata».

---

## 3. D2 · Escala del dinero y economía

### 3.1 Escala: millones de euros reales, la del clásico

**Por qué esta escala.** Las 412 tomas citan cifras de la escala clásica: abrir 4 M€, veinte maquinistas 0,3 M€, equipo 18.000 €, autobús 9.000 €, encargos de 18 y 26 M€, venta online 10 M€ y ERTMS 35 M€. Las 70 líneas del rescate solo tienen 3 grabadas, y ninguna cita cifras.

**Qué pasa con la escala del rescate.** No hay que cambiarle el número a ninguna voz: los valores del rescate pasan a la escala real.
- Las obras usan las fórmulas del clásico: por ejemplo, electrificar cuesta unas 40 veces más que en el rescate.
- Los trenes cuestan lo que pone `trains.json`: un regional nuevo, 5–9 M€; un AVE, 19–38 M€.

### 3.2 Demanda

Se mantiene el logit del clásico (`engine.metrics`): tren contra autobús, otros modos y rivales, más la capacidad. Hay cuatro cambios.

1. **El tiempo de viaje sale de la red real.** Es la suma de los minutos por tramo con la velocidad útil (§4.2) más 12 minutos por cada cambio de ancho. Si un tramo está limitado, la relación se vuelve más lenta y pierde cuota. Así «la vía cansada» cuesta viajeros.
2. **La satisfacción mueve la demanda.** Es la queja 3.4 del inventario. La demanda se multiplica por `0,85 + 0,3·sat/100`, que da ±15 %.
3. **Cada tipo de servicio tiene su tarifa de referencia.** Las mantiene `network.defaultFare`:
   - Alta velocidad (AVE): 0,095 €/km;
   - Alvia y media distancia: 0,082 €/km;
   - regional: 0,07 €/km.
   El producto no se elige: sale del tren asignado. Un tren de ancho fijo estándar a 300 km/h o más es «AVE»; uno de ancho variable es «Alvia»; uno ibérico de 140 km/h o más, «Media Distancia»; los demás, «Regional».
4. **Los viajeros de pie existen.** Si la ocupación pasa del 100 %, la demanda que no cabe se reparte: un 40 % viaja de pie (−satisfacción), un 40 % se va al autobús (+cuota de Íñigo) y un 20 % se pierde. Así son ciertos `decision:discounts` («que los viajeros vayan de pie») y `event:festival`.

### 3.3 Costes

| Partida | Regla | Cambio frente al clásico |
|---|---|---|
| Energía | tren-km × consumo del modelo × **índice de energía** según la tracción (eléctrico / gasóleo). Un bimodo usa gasóleo en la parte sin catenaria de su recorrido | Antes era un factor fijo por corredor. Ahora hay un **índice de 2022 de +70 % durante 12 meses** (histórico) que hace verdad `decision:energy` |
| Personal | Maquinistas × sueldo + contratados por encima de la plantilla (0,0015 M€/mes, como en el clásico) + personal de estación + cuadrillas | Se cobra el «+3 % de nómina» de la huelga (antes era gratis) |
| Mantenimiento | Por unidad, × (1 + 0,02 por año de edad por encima de 20) × deslizador de mantenimiento | La edad pesa |
| Canon | Por tren-km y tipo de tramo (LAV ×2,5) | Nuevo; la cifra real del canon es del orden de 3–10 €/tren-km |
| Conservación de vía | Por km de tramo usado × deslizador de vía | Viene del rescate; mueve el estado de la vía (§4.2) |
| Estructura | `(9 + unidades·0,035)·índice de costes`, como en el clásico | |
| Intereses | 0,4 % al mes sobre la deuda | |

### 3.4 Lo que paga el Estado

- **Transferencia base mensual:** 3,5 M€ con la política «Servicio público» y 2 M€ con la «Comercial». La elige `decision:inaugural` 🔒, que sigue siendo la primera decisión.
- **OSP por tren-km** en las relaciones de servicio público (Media Distancia, Regional y territorios): 2,2 o 1,6 €/tren-km según la política, como en el clásico.
- **Esenciales** (Norte, Levante y Sur, tanto en media distancia como en regional):
  - un mes con la puntualidad por debajo de 70 % resta el 12 % de la OSP de ese mes y suma un **leve**;
  - 3 leves en 12 meses hacen un **grave**;
  - 3 graves suponen la **retirada de la concesión**, que acaba la partida.
  - Viene del rescate y une la puntualidad con el dinero.
- **Contratos con fecha:**
  - el contrato rural de las comarcas (`decision:rural`, 5 años, con obligaciones, §7.6);
  - el contrato-programa de Charo (pacto);
  - las ventanas de fondos europeos (`event:eufunds`, la histórica de 2022 y otras sembradas).
- **Lo que deja de ser un regalo:**
  - los capítulos pagan solo al cumplir sus objetivos;
  - las peticiones pagan después de 3 cierres seguidos de servicio cumplido, lo que cierra el truco de +42 M€;
  - el dinero de una decisión solo llega si su texto lo implica, y si va con una condición, se devuelve cuando se incumple (§7.6).

### 3.5 Crédito, impago y quiebra

- **Línea de crédito:** un solo deslizador.
  - Su techo sube con los hitos y con la confianza de Hacienda.
  - Interés del 0,4 % al mes.
  - El contrato-programa la congela.
- **Ya no hay préstamo puente automático.** Si un cierre de mes deja la caja en negativo, se abre la decisión **Impago** (voz nueva `fin-impago`) con cinco salidas reales, cada una con su efecto calculado:
  - **vender** la unidad peor conservada, al precio depreciado;
  - **aplazar** una obra, que costará un 10 % más al retomarla;
  - **reestructurar** la deuda: los pagos de 3 meses se retrasan con un 8 % más y Hacienda pierde 6;
  - **recortar** servicios: un tren menos en la relación que más pierde, nunca dejando un esencial a cero;
  - **rescate de Hacienda:** una inyección con devoluciones y Hacienda pierde 8.

  Si una opción no haría nada, aparece desactivada y explica por qué.
- **Quiebra:** tres cierres seguidos en negativo después de haber pasado por un impago. Voz nueva `fin-quiebra`.

### 3.6 Inflación y tarifas

- Los costes suben un 2,05 % al año, como en el clásico.
- Cada enero llega la **Actualización de tarifas (IPC)**, activada por defecto.
- La política «Congelar tarifas» da +Viajeros y −Hacienda.
- Así se corrige la caída del clásico (+47 M€ al mes en 2037 frente a −31 M€ en 2050).

### 3.7 Arranque

| Situación | Caja | Deuda | Flota | Servicios abiertos |
|---|---|---|---|---|
| 2022 · Tenfe real | 500 M€, más 120 o 160 M€ de `inaugural` según la política | 0 | 80 unidades AVE y Alvia del clásico, más unas 50 eléctricas de media distancia y regional (449, 470, Civia y S120 en Galicia). **Ninguna diésel** (ver 🔒 abajo) | Los 8 del clásico y 8 de media distancia: Norte, Levante, Sur, Mediterráneo, Ebro, Galicia, Asturias por la Rampa y Cantabria. Extremadura (salvo el Alvia S730 a Badajoz), Teruel y Soria **no tienen tren de Tenfe**: los cubre Autocares Meseta |
| 2027 · Rescate | 60 M€ | 1.200 M€ con calendario de pagos | unas 30 unidades viejas: media distancia y algún Alvia | Norte, Levante y Sur; el Norte con el tramo Ávila–Medina al 44 % |

🔒 Dos cosas obligan a montar así la flota de 2022:
- `induction:infrastructure:briefing:2` dice: «Para una vía sin catenaria solo sirve **hoy** nuestro Alvia híbrido S730». Por eso las diésel 592, 594 y 599 solo aparecen en Trenespop a partir del mes 1.
- `chapter:recovery` dice: «Te dejo **media flota parada**». Por eso en el arranque al menos el 45 % de las unidades están sin servicio o en el taller.

### 3.8 Constantes que dicen las voces (protegidas por prueba)

| Constante | Valor | Voz |
|---|---|---|
| Abrir un servicio | 4 M€ | `induction:infrastructure:briefing:2`, `feedback:mandate:coverage` |
| Contratar maquinistas | lotes de 20, 0,3 M€; formación de 3 meses | `induction:people:*`, `feedback:people:*` |
| Investigación | Venta online 10 M€ y 4 meses; ERTMS 35 M€ y 12 meses; una sola en curso | `induction:competition:briefing:2` |
| Incidencia | equipo 18.000 € y retraso ×0,3; autobús 9.000 €; esperar 0 € | `induction:incident:*`, `voice-text-test` |
| Primer encargo | 18 meses; Servicio público 18 M€, con +Territorio; Apuesta comercial 26 M€, con +25 % de exigencia y +Hacienda | `induction:handoff:*` |
| Fondos europeos | obras de catenaria y de ancho al 60 % durante 24 meses | `event:eufunds` |
| Cola de fábrica | +18 meses a todos los pedidos nuevos | `decision:industry` |
| Contrato rural | 5 años | `decision:rural` |
| Política | actúa desde el primer día y cobra cada mes (**no hay subida gradual**) | `induction:competition:briefing:0` |

**Una corrección necesaria:** el primer encargo se mide como **crecimiento sobre la línea base de enero de 2022** (por ejemplo, +12 % de viajeros al mes sostenido 3 cierres, o +15 % en la comercial). Así los 18 meses son una tensión de verdad y no se gana solo en el primer cierre, como hoy.

---

## 4. D3 · La red

### 4.1 Modelo de tramo

Los datos salen de `assets/infra.js` (125 tramos y 90 nodos), corregidos con `segments.json` y ampliados en un archivo nuevo, `assets/red-real.js`.

```js
// estado de un tramo en s.infra.t[id]
{ g: 'ib'|'std'|'mixto',          // ancho
  e: 'no'|'3kv'|'25kv',           // electrificación y tensión
  v: 155,                          // velocidad de diseño (km/h)
  via: 'unica'|'mixta'|'doble',    // de segments.json
  estado: 0-100,                   // estado de la vía (viene del rescate, ahora por tramo)
  ltv: null|{v, desde, motivo},    // limitación temporal de velocidad
  senal: 'basica'|'ctc'|'ertms',
  galibo: 'normal'|'estrecho',
  tags: ['puerto','calor','trinchera','rampa','rural','costa'],
  b: true, cerrado: null|{hasta, motivo} }
```

**Correcciones obligatorias** (ya detectadas en los inventarios):
1. Convencional `pal-leo-c`: 123 km, ibérico, 3 kV, 155 km/h, doble vía.
2. Convencional `cor-sev-c`: 129 km, ibérico, 3 kV, 155 km/h, vía mixta.
3. Se separa `leo-pol` en **Rampa** (`leo-pol-r`: 108 km, ibérico, 3 kV, 115 km/h, etiquetas «puerto» y «rampa») y **Variante** (`leo-pol-v`: mixto, 25 kV, 220 km/h, que se abre el 29-11-2023 con el cambiador de Pola).
4. Se corrige el nodo `mot` (Motilla) a (−1,88; 39,56).
5. Se copian las velocidades y las longitudes de `segments.json`, incluida Teruel–Sagunt a 90 km/h.

**Etiquetas que hacen ciertas las voces:**

| Etiqueta | Tramos (ejemplos) | Voz o regla que la necesita |
|---|---|---|
| puerto | Madrid–Ávila (Guadarrama), Rampa de Pajares, Palencia–Santander (Pozazal), Bilbao–Miranda (Orduña), Ourense–Lubián (Padornelo) | `event:snow`: «la catenaria se ha congelado en tres puertos». Hay ≥ 3 puertos electrificados |
| calor | Córdoba–Sevilla, Linares–Córdoba, Mérida–Badajoz, LAV Madrid–Sevilla | `event:heatwave`, `decision:climate` («45 grados en Córdoba») |
| trinchera | Teruel–Sagunt, Palencia–Santander, Rampa | `ev-desprendimiento` (nueva) |
| rampa | Rampa de Pajares, Orduña, Pozazal | `ev-averia-rampa` (nueva): «en plena rampa» |
| túnel estrecho (gálibo) | Palencia–Santander, Rampa | reglas de BCBB y `decision:gauge` |
| rural | Torralba–Soria, Zaragoza–Teruel, Talavera–Plasencia y los tramos de vía única con poca población | `event:cows`, territorios |

### 4.2 Reglas

1. **Compatibilidad por etiquetas.**
   - El tren lleva `{anchos: ['ib'] | ['std'] | ['ib','std'] (variable), tensiones: ['3kv','25kv'], termico: 'no'|'diesel'|'bimodo'|'bateria', vmax, vmaxTermico, autonomia, galibo}`.
   - Entra en un tramo si se cumplen las tres condiciones:
     - el ancho del tramo está entre los suyos (un tramo mixto admite los dos);
     - tiene energía: la tensión del tramo está entre las suyas, o es térmico, o es bimodo, o es de batería y le llega la autonomía;
     - el gálibo cabe.
   - Un tren de ancho variable cambia de ancho solo en un nodo con cambiador (+12 min).
   - Es la función `compatibilidad()` de `reglas-infraestructura.md` §5, que reproduce el `plan()` clásico en sus 129 casos y añade la falta `'tension'`.
2. **Velocidad útil** = mín. de:
   - la velocidad de diseño del tramo, limitada por la LTV si la hay;
   - la velocidad máxima del tren;
   - 160 km/h, o la velocidad térmica del tren, si circula sin catenaria;
   - 220 km/h en 3 kV.

   La ficha dice qué tramo limita: «160 km/h · limita Navalmoral–Monfragüe».
3. **Capacidad.** Circulaciones al día por tramo: vía única 36, mixta 80, doble 220, LAV 260 (+20 % con ERTMS).
   - Por encima del 85 % de carga, la puntualidad baja hasta −10 en las relaciones que lo usan.
   - Al 100 %, ya no se puede subir la frecuencia, y el motivo aparece en el control: «Vía única Zaragoza–Teruel llena · Desdoblar ›».
4. **Estado de la vía.** Baja cada mes según los trenes, el tonelaje y la edad del tramo, y sube con el deslizador de conservación.

   | Estado | Efecto |
   |---|---|
   | ≥ 70 % | sin efecto |
   | 45–70 % | −puntualidad proporcional |
   | < 45 % | **LTV**: velocidad útil ×0,7 |
   | < 30 % | LTV a 60 km/h y riesgo de descarrilamiento leve (§6.5) |

   Es la «vía cansada» de `t-3` y de Benito.
5. **Señalización.** CTC o ERTMS por tramo: +capacidad y +3 de puntualidad. La investigación ERTMS 🔒 es una tecnología; la obra la instala tramo a tramo.

### 4.3 Catálogo de obras

Coste en M€ y plazo en meses, salvo el bateo. La fase de permisos ocupa el 10 % del plazo y no gasta cuadrillas; la obra, el 80 %; las pruebas, el 10 %.

| # | Obra | Coste | Plazo | Modos de servicio permitidos | Efecto |
|---|---|---|---|---|---|
| 1 | **Bateo intensivo** (nuevo) | 0,05/km | 2 + km/50 **semanas** | de noche (sin corte) | Estado +20 (hasta 80); quita la LTV |
| 2 | Renovación integral | 8 + 0,18/km | ⌈4 + km/40⌉ | por fases, autobuses o cortar | Estado 95; vuelve a la velocidad de diseño |
| 3 | Electrificar a 25 kV | 6 + 0,42/km | ⌊12 + km/10⌉ | por fases o autobuses | `e = '25kv'` |
| 4 | Electrificar a 3 kV | 6 + 0,50/km | ⌊12 + km/10⌉ | por fases o autobuses | `e = '3kv'`; empalma con un 3 kV vecino |
| 5 | **Pasar de 3 kV a 25 kV** (nueva) | 4 + 0,28/km | ⌊8 + km/15⌉ | por fases, autobuses o cortar | Los trenes solo de 3 kV dejan de poder pasar y se avisa antes de encargar |
| 6 | Tercer carril (ancho mixto) | 8 + 0,5/km | ⌊14 + km/9⌉ | por fases | `g = 'mixto'` |
| 7 | Ancho estándar | 5 + 0,3/km | ⌊8 + km/14⌉ | **solo cortar** | `g = 'std'` |
| 8 | **Quitar el carril ibérico** (nueva) | 2 + 0,08/km | 4 + km/30 | por fases | De mixto a estándar; exige que no quede ningún servicio ibérico |
| 9 | **Desdoblar** (nueva) | 10 + 1,4/km | ⌊18 + km/8⌉ | por fases | `via = 'doble'` |
| 10 | Cambiador de ancho | 18 | 10 | — | Un nodo donde confluyen tramos `std` e `ib` |
| 11 | **Señalización CTC / ERTMS** (nueva) | 2 + 0,25/km | 6 + km/30 | de noche | +capacidad, +puntualidad |
| 12 | **Gálibo** (nueva) | 15 + 0,9/km | 12 + km/10 | cortar o autobuses | Admite trenes anchos |
| 13 | Nueva línea de alta velocidad | km·1,1 + 25 | 42 + km/10 | — | Estándar, 25 kV, 300 km/h |
| — | Reabrir una parada | 1,2 | 4 | de noche | Una parada nueva en una relación (Villanueva del Andén) |
| — | Mejorar una estación | como en el clásico | | | Nivel 0–3 |

**Ejemplo de presupuesto** (es el del tutorial, aunque el tutorial no lo dice en voz alta): electrificar Torralba–Soria (93 km) a 25 kV cuesta 45 M€ y tarda 21 meses, por fases y sin corte.

**Modos de servicio durante la obra** (vienen del rescate; se aplican a las relaciones que pasan por el tramo):

| Modo | Plazo | Demanda | Puntualidad | Coste extra | Verdad que crea |
|---|---|---|---|---|---|
| Por fases | ×1,5 | 78 % | −9 | — | |
| Autobuses | ×1 | 55 % | se congela | autobuses contratados **a Autocares Meseta** | Íñigo contento: «Qué gusto da ver cómo trabajas para mi cuenta de resultados» |
| Cortar | ×0,85 | 0 | — | reputación −1 − n.º de servicios suspendidos | |

**Cuadrillas (frentes de obra):**
- Al empezar hay 3 en la situación 2022 y 2 en la de 2027. Se gana +1 en los hitos 3, 6 y 9.
- Se puede contratar una contrata (desde el hito 2) o firmar el pacto «Cuadrilla de Adif».
- Una obra ocupa sus cuadrillas solo durante la fase de obra. Si las pierde, se para y lo avisa.
- **Las cuadrillas libres hacen guardia.** Si no queda ninguna libre, la respuesta «Equipo» a una incidencia la presta una contrata al triple de precio. Así es cierto Benito: «Sin cuadrilla de guardia, la incidencia de las seis la arregla el Espíritu Santo».

**Retrasos con causa.** Ya no existe el 22 % de azar. Una obra se retrasa por estas causas, y cada una lo dice:
- la confianza de Territorio está por debajo de 25: +1 mes cada semestre, como en el clásico;
- un puerto en invierno (de diciembre a febrero): +2 semanas;
- `event:adifdelay` sobre **una** obra concreta;
- falta de caja: la obra se para;
- pruebas fallidas: 12 %, que baja con ERTMS y con el inspector… honrado.

### 4.4 Relaciones, líneas y corredores

- **Relaciones reales:**
  - las 91 del clásico (alta velocidad y Alvia, con horario GTFS);
  - unas 18 de media distancia y regional sobre los 11 corredores del rescate y sus variantes, por ejemplo Madrid–Ávila, Valladolid–León o Zaragoza–Teruel–València.
- **«Nueva relación»** (como las líneas de Cities):
  - pulsas un origen y un destino en el mapa, y si quieres una parada intermedia;
  - el planificador traza el camino por tramos y ancho;
  - la ficha enseña la tira de tramos con sus etiquetas, los modelos compatibles, las unidades necesarias y la previsión;
  - abrir cuesta 4 M€ 🔒.
- **Corredores con nombre.** Agrupan tramos para la interfaz y para las voces: Norte, Levante, Sur, Mediterráneo, Ebro, Galicia, Asturias, Cantabria, Extremadura, Teruel y Soria, más los ejes de alta velocidad. Así «el corredor Norte» de `t-2` o «tus corredores buenos» se pueden señalar en el mapa.
- **Esenciales:** Norte, Levante y Sur.
- **Territorios:** Extremadura, Teruel, Soria, Cantabria y las relaciones rurales del arco 3 del clásico (Salamanca, Badajoz, Soria, Lugo, Ferrol, Ávila, Jaén, Huelva y Algeciras).

---

## 5. D4 · Tipos de tren y Trenespop

### 5.1 Catálogo único

Sale de `trains.json` y de los modelos clásicos. Los identificadores clásicos (`s100`, `s112`, `s103`, `s130`, `s730`, `s120`, `s106f`, `s106v`, `av2030`) siguen existiendo para que las partidas guardadas migren.

| Clave | Serie real → marca paródica | Tipo | Ancho | Energía | km/h | Plazas | M€ nuevo | Plazo | Desde |
|---|---|---|---|---|---|---|---|---|---|
| s470 | 470 (reforma 440) → KAFKA | Regional | ib | 3 kV | 140 | 221 | solo usado, unos 0,5 | — | heredado |
| s463 | Civia 463 → KAFKA | Regional | ib | 3 kV | 120 | 184 | 5 | 18 | 2022 |
| s465 | Civia 465 → KAFKA | Regional | ib | 3 kV | 120 | 277 | 7 | 18 | 2022 |
| s449 | 449 → KAFKA | Media distancia | ib | 3 kV | 160 | 257 | 8 | 22 | 2022 |
| s480 | Civity 480 → KAFKA | Media distancia | ib | 3 + 25 kV | 200 | 256 | 9 | 24 | 2027 |
| s592 | «Camello» → Malstom | Media distancia | ib | diésel | 120 | 228 | solo usado | — | mes 1 en Trenespop |
| s594 | TRD → KAFKA | Media distancia | ib | diésel | 160 | 123 | solo usado | — | mes 1 |
| s599 | 599 → KAFKA | Media distancia | ib | diésel | 160 | 181 | 8 | 22 | mes 1 |
| dorfler_bmu | FLIRT bimodo → Dörfler | Media distancia | ib | 3 + 25 kV + diésel | 160 (140 en diésel) | 204 | 9 | 26 | 2028 |
| dorfler_akku | Akku → Dörfler (ficticio) | Regional | ib | 3 + 25 kV + batería (80 km) | 160 | 200 | 10 | 30 | tras investigar «Batería» |
| s120 | 120/121 → KAFKA | Alvia | variable | 3 + 25 kV | 250 | 238 | 16 | 26 | 2022 |
| s130 | 130 → Tardo | Alvia | variable | 3 + 25 kV | 250 | 299 | 25 | 28 | 2022 |
| s730 | 730 → Tardo | Alvia | variable | 3 + 25 kV + diésel | 250 (180 en diésel) | 262 | 30 | 30 | 2022 |
| s106v | Avril variable → Tardo | AVE/Alvia | variable | 3 + 25 kV | 330 | 507 | 32 | 38 | 2024 (pedido histórico) |
| s106f | Avril fijo → Tardo | AVE | std | 25 kV | 330 | 521 | 29 | 36 | 2024 (pedido histórico) |
| s100 | 100 → Malstom | AVE | std | 3 + 25 kV | 300 | 329 | solo heredado | — | 1992 |
| s112 | 112 → Tardo | AVE | std | 25 kV | 330 | 365 | 29 | 30 | 2022 |
| s103 | Velaro E → Schlimmens | AVE | std | 25 kV | 350 | 405 | 38 | 34 | 2022 |
| bcbb_hs | «Fuxing» → BCBB | AVE | std | 25 kV, **gálibo ancho** | 350 | 576 | 19 | 20 | 2029 |
| av2030 | Nueva generación (licitación) | AVE | std | 25 kV | 350 | 540 | 36 | 42 | tras `decision:futuretender` |

**Perfil de cada marca** (precio, plazo y fiabilidad base): Dörfler ×1,04, −4 meses, 0,97 · Schlimmens ×1,0, 0,95 · KAFKA ×1,0, 0,93 · Tardo ×1,0, 0,92 · Malstom ×0,95, 0,90 · BCBB ×0,76, −8 meses, 0,82.

**Fiabilidad de una unidad** = la de la marca × (1 − 0,004 por año por encima de 25) × f(estado).

### 5.2 Cómo se ve la compatibilidad

- **En la compra.** Trenespop se abre desde una relación o un corredor (tecla T con la ficha abierta). Se titula, por ejemplo, «Trenes para Extremadura · IB · 25 kV 209 km + sin catenaria 268 km · máx. 200» y agrupa los modelos:
  - **✓ Pueden circular** · minutos y tramo que limita;
  - **◐ Con cambiador** · +12 min;
  - **✗ No pueden** · primer motivo, por ejemplo «Ancho estándar: la vía es ibérica · Ver ancho variable ›» o «268 km sin catenaria · Ver obra ›».

  Comprar un tren incompatible es posible, porque puedes estar planeando una obra, pero hay que confirmarlo.
- **En cada anuncio:** «Circula en: Norte, Levante +2» o «No circula en tu red: ancho estándar».
- **En el mapa.** Al pasar por un modelo se pintan los tramos: verde si puede, ámbar si es con cambiador, gris si no.
- **La ficha de la relación** tiene la tira de tramos coloreada para el modelo elegido y el bloque **«Qué puede circular»** 🔒 (lo nombra el tutorial), con los motivos.
- **Herramienta «¿Puede pasar?»** (Red): eliges un modelo y dos estaciones; el mapa pinta el camino o el primer tramo que lo bloquea, con la obra que lo arreglaría.

### 5.3 Trenespop

| Tipo de anuncio | Reglas |
|---|---|
| **Nuevo de fábrica** | <ul><li>Uno por marca y modelo a la venta.</li><li>Paga el 30 % al pedir y el 70 % a cada entrega; «se entregan hasta dos unidades al mes», como en el clásico.</li><li>El plazo depende de la marca, la cartera de pedidos y `decision:industry`.</li><li>**Ya no hay un 28 % de retraso al azar**: los retrasos vienen de la cola de fábrica, que se ve.</li></ul> |
| **Usado** | <ul><li>1–3 anuncios a la semana, deterministas a partir de la semilla y la semana (`adsOfWeek`, de `trenespop-reutilizacion.md` §6).</li><li>Estado según la edad; precio según la edad y el estado; entrega en 0–6 meses.</li><li>La reventa se deprecia con la edad (se cierra el truco de comprar y revender).</li><li>Puede haber un señuelo incompatible: un ancho métrico o un 114 de ancho estándar.</li></ul> |
| **Oferta relámpago** | <ul><li>`event:secondhand` publica de verdad 4 S112 al 80 % por 60 M€.</li><li>Entrega inmediata y caduca a las 4 semanas.</li><li>Se aplican la compatibilidad y la reventa.</li></ul> |
| **Preestreno de marca** (OpenTTD) | <ul><li>1–2 al año, sembrado.</li><li>−25 % en 2 unidades a cambio de que la fiabilidad empiece en 0,62 y suba sola.</li><li>Si lo rechazas y OuiOui está activo, lo estrena el rival.</li></ul> |
| **Licitación** | <ul><li>`decision:futuretender` abre las pujas de 5 marcas con precio, plazo, tensiones y ancho.</li><li>Los 45 M€ de «Preparar la inversión» son la entrada reservada.</li><li>Se devuelven si en 6 meses no pides nada.</li></ul> |
| **Comisión** (cloacas) | <ul><li>Íñigo, como el Conseguidor, la ofrece en voz alta (`cor-comision`) para **ese** contrato.</li><li>Crea un secreto con importe, marca y testigos.</li></ul> |

**Lo que se aprovecha de `marketplace.js`:**
- la capa de presentación, con atributo e `id` parametrizables, como propone `trenespop-reutilizacion.md` §1;
- las marcas de `brands.js` (las 6 marcas tienen logotipo);
- las fotos de `assets/train-photos`.

### 5.4 Unidades, taller y maquinistas

**Unidades.**
- La flota pasa de **lotes a unidades con nombre**: «S-592 La Abuela», «S-449 Pucela».
- Cada una guarda su modelo, edad, estado, fiabilidad, averías, si alguien avisó de ella y en qué relación está.
- Al migrar una partida clásica, cada lote se reparte en unidades.

**Taller.**
- 2 plazas, más una por cada fase del megaproyecto «Gran Taller».
- La revisión de una unidad cuesta el 2 % de su precio más 0,1 M€, dura 3 semanas y la deja al 95 %.
- La reforma dura 5 meses, cuesta el 12 % del precio (como en el clásico) y añade wifi, portaequipajes o accesibilidad.
- Sin plaza libre, se forma cola.

**Averías.**
- Probabilidad diaria por unidad = (1 − fiabilidad) × f(estado) × (1 + rampa/calor del tramo).
- Siempre van **situadas** en una unidad y un tramo, y salen en el parte.
- Las averías silenciosas desaparecen.

**Maquinistas.**
- Necesidad = ⌈circulaciones diarias × 0,55⌉, como en el clásico, ahora con media distancia.
- Al empezar sobra plantilla 🔒 («Hoy sobra cobertura»).
- Se jubila 1 maquinista cada 2 meses.
- Se contrata en lotes de 20 por 0,3 M€ y con 3 meses de formación 🔒.
- Sin maquinistas, las circulaciones **se cancelan**: primero las primeras salidas y los corredores grandes, y nunca un esencial a cero.

---

## 6. D5 · Rejugabilidad: que ninguna partida sea igual

### 6.1 Pantalla «Nueva partida»

Es una sola pantalla con cinco filas (el boceto está en §10.7 G):
1. **Situación:** de 1 a 6 tarjetas, cada una con chips de caja, deuda, edad de la flota, % electrificado, apoyo y meses hasta las elecciones.
2. **Semilla:** un texto con un botón «Aleatoria» y el código para compartir, por ejemplo `TNF-7K2Q-RX41`. El mismo código sale en la pantalla final.
3. **Tu rasgo** como presidente de Tenfe: 1 de 8, cada uno con un más y un menos.
4. **Dificultad:** Fácil, Normal, Difícil o Infernal, y «Personalizar», que abre los deslizadores.
5. **Reglas de maqueta** (el antiguo modo libre): casillas con «Seleccionar todo». Si marcas cualquiera, aparece el aviso «Medallas desactivadas».

Debajo hay una línea con lo que trae la semilla, por ejemplo: «Norte y Sur cansados · alcaldesa de Cáceres hostil · OuiOui entra en el Levante en 2029».

### 6.2 Situaciones de partida

| Situación | Inicio | Caja / deuda | Lo que la distingue | Voces exclusivas |
|---|---|---|---|---|
| **2022 · Tenfe real** (por defecto; la primera vez trae el tutorial) | 1-1-2022 | 500 M€ / 0 | <ul><li>Historia real hasta 2026.</li><li>Cinco actos (los capítulos).</li><li>Raquel y luego Óscar.</li><li>Elecciones en 2023 y cada cuatro años.</li><li>Veredicto en 2051.</li></ul> | <ul><li>Las 50 del tutorial.</li><li>Las 9 decisiones históricas.</li><li>Los 5 capítulos.</li><li>Las líneas nuevas `veredicto-*` y `prorroga`.</li></ul> |
| **2027 · Rescate** | 4-1-2027 | 60 / 1.200 M€ | <ul><li>Quiebra técnica.</li><li>Prueba de 13 semanas.</li><li>Norte en rojo.</li><li>Cinco etapas.</li><li>Elecciones en 2030 y 2034.</li><li>Óscar vuelve en 2031.</li></ul> | <ul><li>`t-1` y `t-2` (grabadas).</li><li>`t-3` a `t-7`.</li><li>`stage-*`.</li><li>`s1-fallo`.</li><li>`end-*`.</li></ul> |
| 2027 · Crisis de deuda | 4-1-2027 | 30 / 1.700 M€ | Interés +1 punto; Hacienda empieza en 30 | las del rescate |
| 2027 · Fondos europeos | 4-1-2027 | 60 / 1.200 M€ | Subvención ×1,5 durante 2 años si dos corredores pasan a ancho estándar o a 25 kV | las del rescate |
| 2027 · Huelga general | 4-1-2027 | 60 / 1.200 M€ | Plantilla empieza en 25; huelga convocada para la semana 6 (`event:strike`) | las del rescate |
| 2027 · Herencia envenenada | 4-1-2027 | 45 / 1.400 M€ | Dos megaproyectos a medias con pagos pendientes; OuiOui ya está en el Levante | las del rescate |
| **Libre** (reglas de maqueta) | 2022 o 2027 | 500 / 1.500 / 5.000 M€ o ilimitada | Las mismas bases con casillas | se respetan las voces de la base elegida |

### 6.3 Qué decide la semilla

**En 2022 la historia hasta 2026 es fija:** aperturas, adelanto electoral, S106, entrada de YaIré. La semilla decide todo lo demás.

| Área | Qué sortea | Cuándo lo ve el jugador |
|---|---|---|
| Mercado | Anuncios de usados, ofertas relámpago, preestrenos de marca y pujas | Cada semana, en Trenespop |
| Personas | Las **2 agendas de 4** de cada personaje (§6.4); 2 alcaldes amigos y 2 hostiles; los candidatos de la dirección | Al conocerlos |
| Calendario (después de 2026) | Entrada de OuiOui y de YaIré en cada eje; 0–2 recesiones; la fuerza de la ola de calor de cada verano; la gran nevada (como mucho una por década); las ventanas de fondos europeos; la cola de fábrica | 12 meses por delante en Progreso › Calendario |
| Red (situaciones 2027) | Qué 3–5 tramos empiezan cansados (estado 35–60 %) | Al empezar |
| Retos | 3 de un banco de 20 | Al empezar, como medallas oscuras |
| Cartas | Cartas del Consejo de Ministros (§6.8) | Al repartirlas |
| Comarcas | Especialidad de cada comunidad (turismo, negocio, regional o alta velocidad), que cambia la demanda y las peticiones | En Red › Territorios |

### 6.4 Facciones (Tropico), con caras y agendas

| Grupo | Peso en el voto | Cara | Qué quiere | Si se le desatiende |
|---|---|---|---|---|
| Viajeros | 0,34 | Marisa | Puntualidad, plazas, tarifas razonables | Plataforma de afectados: −8 % de demanda en su corredor |
| Territorio | 0,20 | Paco | Tren en las comarcas, estaciones con personal, catenaria en Teruel, Soria y Extremadura | La OSP baja 1 M€ por trimestre |
| Plantilla | 0,20 | Fermín | Nómina, taller con capacidad, sin recortes | Huelga (`event:strike`) |
| Economía / Hacienda | 0,26 | Charo | Resultado ≥ 0, caja por encima de la reserva, gasto justificado | Costes ×1,15 y menos crédito |
| **Gobierno** (no vota: es tu jefe) | — | Pedro y quien esté en el Ministerio | Inauguraciones antes de votar, sin escándalos, encuestas | Cese si pasa 6 cierres por debajo de 15 |
| Adif (proveedor) | — | Benito | Plazos realistas y cuadrillas | Permisos +50 % durante un año si le guarda rencor |
| Competencia | — | Íñigo | Tus viajeros | Guerras de precio y extorsiones |

- **Voto** = Σ (media de 26 semanas del grupo × peso). Se gana con ≥ 50 %. Los pesos se mueven ±0,03 según la semilla.
- **«¿Por qué?»** en cada grupo muestra tres partes: gestión (las causas de su fórmula), comparación con la media europea (que sube con los años) y confianza (las promesas rotas y los escándalos la bajan).

**Agendas de los personajes.** Cada uno trae 2 de 4, sorteadas. Los pactos y las peticiones **aparecen cuando su disparador es cierto**, no con el 9 % semanal del rescate.

| Persona | Agenda (disparador → oferta) |
|---|---|
| Paco | <ul><li>Villanueva sin tren y Territorio < 45 → `decision:rural` (comarcas, 5 años).</li><li>Una obra en su comarca → «Sobre al alcalde» (cloacas).</li><li>Parada reabierta → `paco-inaugura`.</li><li>Elecciones a menos de un año → petición «tren temprano».</li></ul> |
| Fermín | <ul><li>Plantilla < 45 → `fermin-convenio`.</li><li>Taller lleno 8 semanas → «turno de noche».</li><li>Diciembre → `cor-mariscada`.</li><li>Flota con estado < 50 → petición «revisión».</li></ul> |
| Charo | <ul><li>Dos trimestres en negativo → `charo-contrato`.</li><li>Gasto injustificado → auditoría (`event:audit`).</li><li>Enero sin presupuestos → `event:freeze`.</li><li>Caja ≥ 6 M€ sin usar → petición «amortiza deuda».</li></ul> |
| Benito | <ul><li>Sin cuadrillas libres y vía < 50 → `benito-cuadrilla`.</li><li>Primera renovación → `cor-traviesas`.</li><li>Obra adelantada → `event:adifboost`.</li><li>Restos romanos → `event:adifdelay`.</li></ul> |
| Marisa | <ul><li>Esenciales < 80 y Viajeros < 40 → `marisa-carta`.</li><li>Ola de calor y unidad vieja → `ev-aire`.</li><li>Relación ≥ 95 % → `event:influencer`.</li><li>Equipaje con ocupación > 85 % → `event:luggage`.</li></ul> |
| Pedro | <ul><li>Territorio < 40 y elecciones a menos de 2 años → `pedro-cohesion`.</li><li>Encuesta ≥ 52 → adelanto electoral (`event:election`).</li><li>AVE ≥ 90 % → `event:royal`.</li><li>Tras ganar en 2047 → `decision:legacyvote`.</li></ul> |
| Raquel / Óscar | <ul><li>Elecciones a menos de 14 meses y sin inaugurar en 26 semanas → `raquel-inauguracion` o `oscar-tuits`.</li><li>Retraso viral → `event:tweet` (solo Óscar).</li><li>Sobrino → `cor-enchufe-*`.</li></ul> |
| Íñigo | <ul><li>Extremadura sin tren y Soria o Teruel sin servicio → `inigo-noagresion`.</li><li>Campaña de autobuses → `event:busprice`.</li><li>Pedido de BCBB → `cor-yate`.</li><li>Sospecha > 18 y fotos → `ext-inigo`.</li></ul> |

### 6.5 Sucesos con causa, situados en la red

Cada suceso tiene una causa que el jugador puede leer, un **sitio** (un tramo, una unidad, una relación o una estación) y una probabilidad que crece con esa causa y se ve en la ficha del sitio («Riesgo de robo de cable: medio»).
- Las tiradas se siembran con la semilla, el día y el dominio, así que recargar no cambia nada.
- El deslizador «Imprevistos» multiplica todos los riesgos por 0, 0,5, 1 o 1,5.
- En el primer trimestre de una partida solo hay sucesos de guion o del tutorial.

| Suceso (voz) | Solo si… (causa) | Sitio | Lo que pasa siempre (antes de elegir) |
|---|---|---|---|
| `event:cable` | Tramo con señalización básica (sin CTC ni ERTMS) y sin la política «Vigilancia»; el riesgo sube de noche y en tramos rurales | 1 tramo | «Esta noche se han llevado tres kilómetros de cable» → LTV ×0,7 y +incidencias de señal en ese tramo |
| `event:snow` | Gran nevada sembrada (diciembre–febrero, como mucho una por década) | Los 3 puertos electrificados con más tráfico | Sin tensión durante 14 días: los eléctricos no pasan y los bimodos sí, en diésel |
| `event:heatwave` | Día de ola de calor (calendario sembrado; en 2022, la de julio, que es real) | Tramos con etiqueta «calor» | Carriles a 60 °C: riesgo de deformación |
| `ev-aire` (nueva) | Ola de calor con ≥ 40 °C y una unidad con estado < 55 en un tramo con calor | 1 unidad | El aire acondicionado de esa unidad se estropea; la ocupación cae |
| `ev-averia-rampa` (nueva) | Avería de una unidad mientras sube un tramo con etiqueta «rampa» | 1 unidad + 1 tramo | La unidad queda tirada; la relación pierde ese tren |
| `ev-desprendimiento` (nueva) | Tramo con etiqueta «trinchera», estado < 50 y día de lluvia o invierno | 1 tramo | **Vía cortada desde que se anuncia** |
| `event:cows` | Tramo rural de vía única con un Alvia en servicio y sin vallado | 1 tramo + 1 Alvia | Un retraso de 40 minutos ya ocurrido |
| `event:strike` | Plantilla < 35 durante 4 semanas → convocatoria con 2 semanas de aviso (aparece en el calendario) | Toda la red | Huelga convocada en una fecha |
| `event:wifi` | La política «Wifi» desactivada y la flota de larga distancia con estado medio < 60 | Relaciones de larga distancia | Vídeo viral (−satisfacción) |
| `event:influencer` | Una relación con ≥ 95 % de puntualidad el mes anterior | Esa relación | +10 % de demanda en esa relación durante 6 meses, elijas lo que elijas |
| `event:festival` | Junio–julio | Relaciones turísticas | +10 % de demanda durante 3 meses, elijas lo que elijas |
| `event:busprice` | Campaña de Autocares Meseta (cada 18 meses, sembrada) | Relaciones con autobús | Billetes de autobús a 5 € durante 6 meses, **pase lo que pase** |
| `event:audit` | Pruebas de corrupción > 12, o 3 trimestres en negativo, o deuda/caja > 5 | Cuentas | El riesgo de multa depende de esas cifras, no de una moneda al aire |
| `event:freeze` | Enero sin presupuestos: **histórico en 2024**; después, cuando la encuesta es < 50 | Transferencias | −30 % de la transferencia durante 12 meses |
| `event:eufunds` | Ventana europea: histórica en junio de 2022 (NextGenerationEU); después, sembrada | Obras | Catenaria y ancho al 60 % durante 24 meses 🔒 |
| `event:secondhand` | Anuncio relámpago sembrado (2022–2030) | Trenespop | 4 S112 publicados |
| `event:workshopfire` | Taller lleno ≥ 8 semanas (sobrecarga) | Taller | −1 plaza de taller hasta reconstruir |
| `event:adifdelay` / `event:adifboost` | Hay una obra en la fase de obra (con ≥ 50 % hecho y sin retrasos, en el caso de boost) | **1 obra con nombre** | Se aplica a esa obra |
| `event:royal` | Una relación AVE con ≥ 90 % de puntualidad y una unidad libre | Esa relación | Visita; el éxito es probable en la medida de la puntualidad, con una tirada sembrada |
| `event:tweet` | Óscar en el Ministerio y una avería grande en una relación con mucho tráfico esta semana | Esa relación | Reto de una semana (§7.6) |
| `event:mayorchain` | Villanueva del Andén sin parada, Territorio < 50 y una agenda de Paco abierta | El tramo Ávila–Medina, a su paso por Villanueva | Paco se encadena a **su** vía: ese tramo va con precaución (−10 km/h) **mientras siga allí** |
| `event:teruel` | `zar-ter` o `ter-sag` sin catenaria y Territorio < 45 | Teruel | — |
| `event:luggage` | Larga distancia con ocupación > 85 % | Relaciones de larga distancia | — |

### 6.6 Rivales

| Rival | Entrada (situación 2022) | Comportamiento |
|---|---|---|
| **OuiOui** (`lowgo`) | Madrid–Barcelona desde el primer día (real); Madrid–València en octubre de 2022; Andalucía y Alicante en la fecha real que se confirme al implementar; después, sembrado (2027–2033) en los ejes donde tu puntualidad es más baja | <ul><li>Guerra de precios uno de cada tres semestres (clásico).</li><li>Revisa su estrategia cada 6 meses según tu tarifa.</li><li>Su cuota sube 2 puntos a la semana mientras tu puntualidad en esa relación está por debajo de 80, y baja 1 a la semana con 88 o más.</li></ul> |
| **YaIré** (`rossa`) | Madrid–Barcelona el 25-11-2022 (real, y lo anuncia `decision:Rossa`); València en diciembre de 2022; Andalucía en la primavera de 2023 | Calidad; promociones sembradas (hechos `yairePromo`) |
| **Autocares Meseta** (Íñigo) | Siempre, en las relaciones de menos de 400 km y en los territorios sin tren | <ul><li>Logit del autobús del clásico.</li><li>Campaña de 6 meses cada 18.</li><li>Cobra a Tenfe los autobuses de las obras.</li><li>Si le respondes con un descuento ≥ 10 % se anota `playerAnsweredBusWar`.</li></ul> |

- Con la regla de maqueta «Sin rivales» no entra ninguno, y las voces que los nombran quedan sin elegir.
- **Operador Ferroviario del Año** (Airport CEO, cada diciembre): una clasificación de 10 operadores europeos parodiados según puntualidad y satisfacción. Ganarlo da 2 M€, confianza +5 y la línea `operador-del-ano`. Quedar el último te lleva a la portada.

### 6.7 Objetivos: corto, medio y largo plazo

| Horizonte | Sistema | Fuente |
|---|---|---|
| Días | Incidencias con plazo y nota de la A a la F; picos de demanda | Clásico + Airport CEO |
| Semanas | Escenas del despacho; peticiones de los grupos (una abierta por grupo); ultimátum si un grupo pasa 4 semanas por debajo de 25 | Encuentros + Tropico |
| Meses | **Encargos** (los contratos del clásico, con los arcos como voz y 3 cierres seguidos cumplidos); **compromisos** (§7.8) | Clásico |
| Legislatura | **Actos** (los 5 capítulos de 2022) o **etapas** (las 5 del rescate de 2027), cada uno con plazo y consecuencia; elecciones; **Mitin** con promesas que se pueden comprobar | Clásico + rescate + Tropico |
| Partida | **12 hitos** con nombre y desbloqueos (Cities); megaproyectos por etapas (SimCity); 3 retos; unas 40 medallas; **hemeroteca** (% de promesas cumplidas); veredicto | Cities + rescate |
| Meta | Reto semanal (misma semilla, rasgo y 2 modificadores para todos, a partir de la semana ISO); código para compartir; prórroga | Mini Motorways + Cities |

**Actos (situación 2022).** El texto grabado de cada capítulo dice lo que pide, y los objetivos miden exactamente eso.

| Acto (voz) | Empieza | Objetivos (los cuenta el motor) | Plazo y consecuencia |
|---|---|---|---|
| I `chapter:recovery` (Raquel) | 1-2022 | +4 servicios abiertos sobre los del inicio, 2 peticiones cumplidas, 2 unidades revisadas o reformadas, 2 encargadas, y la caja nunca por debajo de 150 M€ («sin vaciar la caja») | Elecciones de 2023. Si falla: Gobierno −10 |
| II `chapter:competition` (Pedro) | En 2024, o antes si el Acto I está cumplido y ha pasado un año | +30 % de trenes al día, 1 cambiador construido, cuota frente a los rivales sin bajar, satisfacción 62 | Elecciones de 2027. Si falla: Gobierno −20 y «ya sabes dónde está la puerta» (§2.4) |
| III `chapter:mediterranean` (Óscar; Raquel con la línea nueva si hubo remodelación) | 2028 | **Servicio AVE funcionando** València–Barcelona, LAV de Almería terminada, 250 km de tercer carril o ancho estándar, ninguna inauguración sin catenaria | 2035 («si alguien te dice que esto se hace en dos años, bloquéalo») |
| IV `chapter:territory` (Óscar o Raquel) | 2035 | Soria, Teruel y Extremadura con catenaria; AVE en 30 ciudades; 1 línea nueva terminada | 2043 («antes de que me jubile») |
| V `chapter:legacy` (Pedro) | 2042 | 420 trenes al día, AVE en 40 ciudades, satisfacción 72, caja mayor que la deuda, ocupación de la red ≥ 60 % | Veredicto de 2051 |

**Hitos (Cities).**
- Se miden con la media de 4 meses de viajeros al mes, como múltiplos del arranque: de ×1,1 a ×3,0.
- Cada hito tiene nombre, tarjeta de recompensa y una **lista de desbloqueos generada desde los datos**:
  - nivel de investigación;
  - techo de crédito;
  - +1 cuadrilla;
  - megaproyectos;
  - el Conseguidor (desde el hito 2);
  - un hueco más de políticas en cada grupo (hito 5).
- Las tres primeras recompensas usan la voz `hito` («Hay gente en los andenes…»), que solo es cierta al principio.

**Megaproyectos.**
- Los 9 proyectos de alta velocidad del clásico: Almería, Y vasca, Burgos–Vitoria, Navarra, LAV Extremadura, Cartagena, Cantabria, Huelva y Cerdedo.
- Los 6 del rescate: Gran Taller, CTC, Corredor Mediterráneo, Teruel, Estación Central y **Monumento al Ministro**, que es de vanidad y hace verdad la frase de Charo sobre «otra escultura delante del apeadero».
- Se construyen por etapas, cada una con requisitos visibles, y cada etapa ya rinde.

**Consejo de Ministros.**
- Cada mes llegan dos cartas; eliges una o pasas y cobras 0,1 M€. No tienen voz.
- Cada carta tiene una sola línea de efecto, que el motor aplica, y solo menciona cosas que existen. Por ejemplo, «Licitación exprés: −30 % en tu próxima obra de catenaria».
- El mazo depende del estado, de la semilla y del rasgo de quien esté en el Ministerio.

### 6.8 Dificultad y reglas de maqueta (el modo libre absorbido)

**Dificultad.** Cuatro niveles, que ajustan:
- los fondos europeos;
- la exigencia de los grupos (umbral de ultimátum);
- la oposición (de −0 a −6 puntos en el voto);
- la pendiente de la media europea;
- los imprevistos (×0 a ×1,5);
- los sindicatos (umbral de huelga);
- los multiplicadores de interés, obra y mantenimiento.

**Puntuación.** Su multiplicador va de ×0,7 a ×1,6 y se ve mientras ajustas la dificultad.

**Reglas de maqueta.** Cada casilla quita las voces que dependen de ella (§7.4):
- Caja: 500, 1.500, 5.000 o ilimitada.
- Sin rivales.
- Sin elecciones, o perder no termina.
- Sin cese.
- Sin final (prórroga desde el principio).
- Sin imprevistos.
- Todo desbloqueado.
- Sin cloacas.
- Sin historia con fecha: las aperturas reales siguen ocurriendo, pero sus decisiones no suenan.
- Sin tutorial.

**Modificadores.**
- Cada partida puede llevar de 0 a 3, cada uno con su efecto en la puntuación:
  - Verano tórrido;
  - Solo diésel (sin obras de catenaria);
  - Ancho ibérico obligatorio;
  - Prensa hostil;
  - Austeridad;
  - Fabricante en quiebra;
  - OuiOui madrugador;
  - Tarifa social;
  - Ministerio en funciones;
  - Misterio de Moncloa (las cartas boca abajo).
- Ninguno contradice una voz: si un modificador desactiva un sistema, el director no elige las voces que dependen de él.

### 6.9 Dos partidas distintas

1. **`TNF-4R7Q` · 2022 · Tecnócrata · Verano tórrido.**
   - La historia hasta 2026 es igual que siempre.
   - A partir de ahí:
     - OuiOui entra en el Levante en 2029;
     - una recesión golpea en 2031;
     - Paco trae el contrato rural y Fermín, la paga extra;
     - la ola de calor de 2030 deja el Sur limitado a 160 km/h cada verano;
     - Óscar se pelea contigo en 2033 y Pedro remodela el Gobierno: Raquel vuelve y pronuncia el Acto IV.
   - Es una partida de vía y catenaria con veranos que castigan el Sur.
2. **`TNF-9K2M` · 2027 · Herencia envenenada · Ex-sindicalista · Prensa hostil.**
   - Extremadura y Galicia empiezan cansadas.
   - OuiOui ya está en el Levante.
   - Íñigo propone el pacto de no agresión en la semana 30; si aceptas, sale en portada en 2029 (`sc-pacto-meseta`).
   - Es una partida de dinero, rivales y cloacas.

---

## 7. D6 · El motor de verdad narrativa

### 7.1 Visión general

```
 estado s ──► HECHOS F (puro, sin azar, memorizado por tic)
                 │
                 ▼
  GUION: un CONTRATO por cada cuerpo grabado o línea nueva
  {cuándo, exige(F), afirma(F), instancia(F), opciones[{aplica, posible}], una, enfriamiento}
                 │
                 ▼
  DIRECTOR: momentos (día 06:00 · lunes 07:00 · cierre de mes)
  → candidatos → filtros (cargo, reglas, mecánicas, enfriamientos)
  → puntuación → cola → revalidación antes de mostrar → silencio si nada es cierto
                 │
                 ▼
  ESCENA: retrato (persona y ánimo del catálogo) + toma completa + línea «Dato» sin voz
          + opciones con el detalle calculado
                 │  (el jugador elige)
                 ▼
  EFECTOS con etiqueta y cuenta atrás ──► COMPROMISOS rastreados ──► MEMORIA de personajes
                 │                               │                        │
                 └──► DIARIO e INFORME del mes ◄─┴────── nuevos hechos ◄───┘ (cadenas)
```

### 7.2 El modelo de hechos (`hechos.js`)

**Reglas:**
- Es una función pura `hechos(s)`.
- Lee solo el estado y sus registros. Nunca tira dados ni escribe.
- Se memoriza por tic, y el director la vuelve a calcular justo antes de mostrar.
- Los nombres siguen el vocabulario de la auditoría de encuentros (`audit-encounters.json` → `facts`, `factHelpers`), con dos cambios:
  - las ventanas en semanas se pasan a días (×7);
  - «corredor» puede ser una relación o un corredor con nombre.

| Espacio | Hechos (ejemplos) |
|---|---|
| Tiempo | `fecha`, `diaSemana`, `festivo`, `semanaDelAño`, `ola(region)` (temperatura del día), `nevada`, `diasAElecciones`, `legislatura`, `enTutorial` |
| Reparto | `cargo(persona)`, `enCargo(persona)`, `diasEnCargo(persona)`, `cesado('adif')`, `ultimoAnimo[persona]`, `ultimoAnimoDia[persona]` |
| Red | `tramo(id)` con `{g, e, v, via, estado, ltv, cerrado, obra, tags, carga}`; `kmPor('e','25kv')`; `cambiador(nodo)`; `hayAVE`; `ciudadesAVE`; `sinCatenaria(corredor)` |
| Servicios | `rel(id)` con `{activa, unidades, frecuencia, ocupacion, perdidos, puntualidad, hist[], tarifa, tarifaRef, cuota{ouioui, yaire, bus}, neto13, esencial, territorio}`; `problemaResuelto(dias)`; `incidencias(dias)`; `cancelaciones(dias)` |
| Flota | `unidad(id)` con `{modelo, estado, edad, fiabilidad, averias[], avisada, enTaller, rel}`; `libresCompatibles(rel)`; `bajo45`; `reserva`; `colaTaller`; `vueltasTaller(dias)` |
| Personal | `maquinistas`, `necesidad`, `cobertura`, `coberturaProxSemana`, `horasExtraActivas`, `cuadrillasLibres` |
| Dinero | `caja`, `cajaMin(meses)` (previsión), `pagos(dias)`, `resultado(meses)`, `gasto4s`, `malUso4s`, `partidaPilotos` |
| Grupos | `grupo(g)` con `{valor, media26, delta8}`; `encuesta`, `encuestaDelta4s` |
| Obras | `terminadas(dias)`, `aLaPrimera(dias)`, `retrasadaHoy`, `aceleradas(dias)`, `comision`, `hitoGrandeObra`, `obraAMedias` |
| Narrativa | `log.ocurrio(id, dias)`; `compromisos.{abiertos, cumplidos(dias, quien), rotos(dias, quien)}`; `memoria(persona)`; `cadena(clave)`; `usado(cuerpo)` |
| Cloacas | `secretos[]` con `{tipo, importe, contrato, tramo, testigos, expuesto}`; `sospecha`; `pruebas`; `fase` |

**Registros que se guardan** (estado nuevo `s.narr`):

```js
s.narr = {
  log: [{dia, tipo, id, persona, animo, instancia, opcion, efectos:[ids], compromisos:[ids]}], // los últimos 400
  usados: {cuerpoId: [dias]},             // para «una» y los enfriamientos
  enfr: {persona:{}, personaAnimo:{}, personaTema:{}, tema:{}, instancia:{}},
  efectos: [{id, origen, tipo, objetivo, valor, desde, hasta, etiqueta, medida:{antes, despues}}],
  compromisos: [{id, origen, quien, comprueba:{tipo, args}, plazo, premio, castigo, estado, creado}],
  memoria: {persona: [{tipo:'favor'|'agravio'|'aviso'|'promesa', que, dia, peso}]},
  cadenas: {pacoPlantado: dia, ...},
  hist: {grupos:[], cuotas:[], puntRed:[]}  // series semanales para los deltas
}
```

### 7.3 Contratos del guion (`guion.js`)

**Reglas de construcción:**
1. **No se copia ningún texto.** El contrato apunta al `source` del catálogo (`decision:burgos`, `scene-adif-angry-2`, `induction:incident:briefing:1`…) o al id de una línea nueva (`LINES` de `rescate-data.js`). El cuerpo, la persona y el ánimo se leen de los módulos congelados (`DECISIONS`, `EVENTS`, `CHAPTERS`, `ARCS`, `ENCOUNTERS`, `INDUCTION_STAGES`).
   - Una prueba prohíbe que un módulo nuevo contenga 40 caracteres seguidos de un cuerpo del catálogo.
   - Así la suma de comprobación del catálogo (`6348984c…`) no se toca.
2. **Lo que sí se puede cambiar** está todo fuera del catálogo: títulos, opciones, efectos, `at` distinto de 0, `from`, `months`, `needsWorks` y el disparador. Aun así, `story.js` y `encounters.js` **no se editan**: `guion.js` los sustituye por id. Así no hay ningún riesgo de romper el orden de los arrays.
3. **Las cifras dinámicas nunca van en la voz.** Van en la línea «Dato» (sin voz, como máximo 20 palabras) y en el detalle de cada opción. Las calcula la misma función que luego aplica el efecto.

**Esquema:**

```js
export const CONTRATOS = {
  'decision:burgos': {
    momento: 'dia', cuando: {fecha:'2022-07-21', hasta:'2022-09-15'},  // ventana: si no cabe, no suena; nunca tarde
    exige: F => F.tramo('vdb-bur-av').b && F.cambiador('bur') && F.enCargo('minister'),
    afirma: ['LAV Venta de Baños–Burgos abierta', 'cambiador en Burgos'],   // se comprueba igual que exige
    instancia: F => ({rel:'madrid-burgos', libres: F.libresCompatibles('madrid-burgos')}),
    dato: (F,i) => `Madrid–Burgos · ${i.libres.length} unidades compatibles libres`,
    opciones: [
      {etiqueta:'Abrir el AVE a Burgos', posible:(F,i)=> i.libres.length ? true : 'No hay unidades AVE libres',
       detalle:(F,i)=> `4 M€ · 2 salidas · +10 % de demanda en Burgos, 6 meses`,
       aplica:(s,i)=> [abrirServicio(s,i.rel,{unidad:i.libres[0], frecuencia:2}),
                       efecto(s,{tipo:'demanda', objetivo:{ciudad:'bur'}, valor:.10, meses:6, etiqueta:'Lanzamiento Burgos'})]},
      {etiqueta:'Esperar a tener trenes',
       detalle:()=> 'Promesa: Madrid–Burgos en servicio antes de 6 meses',
       aplica:(s,i)=> [compromiso(s,{quien:'minister', comprueba:{tipo:'servicio', rel:i.rel}, meses:6,
                                      premio:{gobierno:+3}, castigo:{gobierno:-6, agravio:'minister'}})]}
    ],
    una: true
  },
  'event:teruel': {
    momento: 'lunes', exige: F => F.enCargo('mayor') && (F.tramo('zar-ter').e==='no' || F.tramo('ter-sag').e==='no')
                              && F.grupo('territorio').valor < 45 && !F.compromisos.abiertoDe('mayor','electrificar-teruel'),
    enfriamiento: {dias: 730},
    opciones: [
      {etiqueta:'Prometer catenaria', detalle:()=>'Empezar a electrificar un tramo de Teruel en 12 meses',
       aplica:(s)=> [compromiso(s,{id:'electrificar-teruel', quien:'mayor',
          comprueba:{tipo:'obraIniciada', obra:['electrificar25','electrificar3'], tramos:['zar-ter','ter-sag']}, meses:12,
          premio:{territorio:+10, favor:'mayor'}, castigo:{territorio:-15, agravio:'mayor'}})]},
      {etiqueta:'Pedírselo a los Reyes Magos', detalle:()=>'Territorio −2', aplica:(s)=> [grupo(s,'territorio',-2)]}
    ]
  },
  // Encuentros: un solo contrato genérico que combina el predicado del arranque y el del tema (§7.5)
};
```

### 7.4 El director (`director()` en `guion.js`)

**Momentos.** Hay tres:
- **06:00** de cada día: sucesos situados y fechas históricas;
- **lunes a las 07:00**: encuentros, pactos y peticiones;
- **cierre de mes**: actos, encargos, contrato rural, OSP y noche electoral.

**Prioridad**, de mayor a menor:
1. Decisiones de crisis con opciones: impago, huelga convocada, escándalo, extorsión, ultimátum.
2. Fechas históricas y de guion, dentro de su ventana.
3. Sucesos situados.
4. Actos y etapas.
5. Pactos, encargos y peticiones.
6. Encuentros.
7. Lo que no tiene voz (Gaceta, Trenter, avisos).

**Límites:**
- Como mucho **1 escena con voz al día** y **2 por semana**, salvo las crisis.
- Si coinciden el mismo día, se juntan en una sola pantalla. La «Noche electoral» reúne el resultado, la remodelación y el cambio de acto.
- Lo que no cabe se queda en cola **solo mientras dure su ventana**.

**Puertas que debe pasar cada contrato:**
- `enCargo(persona)` (§7.11);
- las reglas de maqueta (por ejemplo, «Sin rivales» elimina las escenas de Íñigo que hablan de su cuota);
- `mecanicas` (cada contrato declara qué sistemas necesita, como `['conductores','talleres']`, y si el sistema aún no existe en esa fase, el contrato no es elegible);
- los enfriamientos;
- `una`.

**Revalidación.**
- Justo antes de mostrar se vuelve a evaluar `exige` y `afirma`; si algo ya no es cierto, la escena se descarta en silencio y no queda anotada.
- Al cargar una partida se hace lo mismo con la cola.

**Silencio.** Si no hay candidatos, no suena nada. El ticker puede llevar un titular sin voz que **solo cuente hechos**.

```js
export function director(s, momento) {
  const F = hechos(s), cola = [];
  for (const [id, c] of entries(CONTRATOS)) {
    if (c.momento !== momento || !puertas(s, id, c, F)) continue;
    if (!c.exige(F) || !afirmaTodo(c, F)) continue;
    const i = c.instancia?.(F); if (c.instancia && !i) continue;
    if (!c.opciones.some(o => o.posible?.(F, i) !== false)) continue;   // nunca una escena sin salida
    cola.push({id, prioridad: c.prioridad ?? prioridadPorTipo(id), puntos: c.puntos?.(F, i) ?? 0, i});
  }
  if (momento === 'lunes') cola.push(...elegirEncuentro(s, F));        // §7.5: como mucho uno
  return ordenar(cola).filter(limites(s));                             // la interfaz llama a revalidar() antes de pintar
}
```

### 7.5 Los 315 encuentros

**Base.** Es el algoritmo de la auditoría (§6 de `auditoria-encuentros.md`), adaptado:
- Una escena solo sale si son ciertos **a la vez** el predicado del arranque (63) y el del tema (45), sobre la instancia elegida, y las dos opciones se pueden ejecutar.
- **Cuándo:** los lunes; nunca en las 5 primeras semanas de una partida; como mucho 1 cada 4 semanas; el objetivo es 1 cada 6 (unas 8–9 al año).
  - En la partida de 2022, que dura 29 años, salen unas 250 escenas para 310 cuerpos.
  - Cada cuerpo **suena una sola vez por partida**, así que cada partida suena distinta.
- **Disponibilidad:** `enCargo(persona)` sustituye a «Raquel hasta la semana 208». En 2022 Raquel es elegible de enero de 2022 a noviembre de 2023, y Óscar desde entonces (§7.11).
- **Enfriamientos:**
  - mismo cuerpo: nunca más;
  - misma persona y ánimo: 26 semanas;
  - misma persona y tema: 26;
  - mismo tema con cualquiera: 8;
  - misma persona: 8;
  - misma instancia: 13.
- **Ánimo:**
  - se elige primero el de un suceso, luego uno reciente, luego uno de estado y por último uno de actitud;
  - si hay empate, el menos usado;
  - «contento» y «orgulloso» exigen confianza del grupo ≥ 40;
  - «enfadado» y «decepcionado», ≤ 60.
- **Puntos:** 0,55 × gravedad de la instancia + 0,25 × interés de la persona por el tema + 0,20 × peso del nivel. Si el mejor saca menos de 0,45 y la última escena fue hace menos de 8 semanas, no sale nada.
- **Presentación:**
  - título `TOPICS[k]` («El turno imposible»…);
  - retrato con el ánimo del catálogo;
  - toma completa;
  - línea «Dato» con la instancia, por ejemplo «S-449 Pucela · estado 38 % · Norte»;
  - dos opciones con el detalle calculado.

**Efectos reales por tema**, en la escala de M€. Las etiquetas son las de `encounters.js`, que no forman parte del catálogo.

| Tema | Opción A: efecto real | Opción B: efecto real | Dónde se ve |
|---|---|---|---|
| 0 · El turno imposible | **«Pagar refuerzos este mes»:** horas extra durante 4 semanas en la relación nombrada. No se cancela ninguna circulación por falta de maquinistas, y si hay una unidad de reserva compatible, entra en servicio. Cuesta 4.000 € por circulación cubierta y día. Plantilla +4 | **«Ajustar turnos sin refuerzo»:** durante 4 semanas se cancelan las circulaciones sin maquinista (primero las primeras salidas, nunca un esencial a cero) o se mueve una unidad de la relación menos cargada. −2 de puntualidad en las dos. Plantilla −3 | Ficha de la relación («Horas extra · 3 sem»); Dinero; parte del día |
| 1 · Billetes de saldo | **«Campaña de descuentos»:** tarifa ×0,85 en las relaciones nombradas durante 13 semanas, con vuelta automática, más 0,4 M€ de publicidad. Antes de elegir se ve la previsión: ingresos, viajeros y cuota del rival antes y después. Viajeros +3, Hacienda −2. Anota `respondió` si es contra Íñigo | **«Proteger el margen»:** la tarifa no cambia y la campaña rival sigue con su fórmula. Hacienda +2, Viajeros −1 | Ficha («−15 % · 9 sem»); columna de cuota en el monitor |
| 2 · Tornillos o titulares | **«Revisión extraordinaria»:** la unidad nombrada va al taller (2 % de su precio + 0,1 M€; 3 semanas, o 2 con el contrato de mantenimiento) y vuelve al 95 %. Si su relación se quedara sin trenes y hay reserva compatible, se asigna sola. Plantilla +3. **Sustituye a la vieja `fleetcare`**, que daba +8 a toda la flota por 2 M€ | **«Seguir con el plan previsto»:** la avería de esa unidad es ×1,5 de probable durante 8 semanas (×2 si estrena una inauguración) y queda anotado que Fermín avisó de ella. Si luego se rompe, Fermín puede decir «Te avisé» (`workshop.disappointed`) | Ficha de la unidad; parte del día |
| 3 · El andén olvidado | **«Refuerzo de atención local»:** la estación nombrada tiene personal 26 semanas (0,003 M€ a la semana) y la demanda de sus relaciones sube ×1,03. Si la escena pide servicio, entra una unidad compatible o se abre la relación del territorio. Territorio +5 | **«Atención centralizada»:** información a distancia; demanda ×0,98 durante 26 semanas. Territorio −4 | Marcador de la estación en el mapa |
| 4 · El invento del mes | **«Financiar el piloto»:** se prueba la investigación nombrada en una relación durante 8 semanas, pagando el 30 % de su coste (de la *partida de pilotos* de Hacienda si existe). El efecto real se aplica **solo** en esa relación y al final llega un aviso con el resultado medido. Si la investigas en las 13 semanas siguientes, lo pagado se descuenta. Gobierno +3 | **«Pedir otra evaluación»:** sin coste; esa investigación no se puede pilotar en 13 semanas. Gobierno −2 | Investigación («Piloto en X · 6 sem»); aviso final |

**Retirados.** Son los 5 cuerpos que nunca pueden ser ciertos. Siguen en el catálogo y en el auditorio, pero no se eligen.
- `scene-adif-happy-0`
- `scene-adif-determined-2`
- `scene-workshop-happy-2`
- `scene-rival-surprised-1`
- `scene-successor-happy-0`

**Ventanas estrechas** (las 9 de `combosNarrow`): se aplican tal cual. Por ejemplo, `scene-riders-happy-0` solo sale si la primera salida cancelada no es del Norte, porque Marisa viaja en el Norte y dice que ha llegado a su hora.

**Cuándo se puede alcanzar cada grupo condicional**, según la fase que crea su mecánica (§11):

| Grupo (cuerpos) | Mecánica que necesita | Fase |
|---|---|---|
| Ministra y sucesor (70) | Cargo por fecha | 1 |
| Tema 1, descuentos y rivales (63), YaIré (7), Íñigo (35) | Descuento real con vuelta automática, promociones de YaIré, guerra de autobuses e historial de cuotas | 1 |
| Tema 2, unidad o lote gastado (63) | Revisión dirigida. En la fase 1 la instancia es el lote; en la 2, la unidad | 1 → 2 |
| Taller, tema 0 (7) y «el AVE de la foto» (7) | Plazas de taller y capa de media distancia con compatibilidad | 2 |
| Tema 0, maquinistas (49) | Cancelaciones ordenadas por día, jubilaciones y horas extra | 3 |
| Tema 3, estaciones (63) | Personal por estación | 4 |
| Alcalde, orgulloso y tema 3 con Villanueva (11) | Reabrir la parada de Paco | 5 |
| Adif, tema 0, cuadrilla de guardia (6) | Cuadrillas que hacen guardia | 6 |
| Tema 4, pilotos (63); Charo y el piloto con partida (2); app (7); Charo y la «escultura» (7) | Pilotos sobre la investigación, partida de pilotos, fallo de la app y Monumento | 6 |
| Sucesor preocupado por una filtración (5) | Secretos de las cloacas. Antes solo vale con el hecho «tren por debajo del 25 %» u «obra a medias» | 8 (parcial antes) |

**Arranques que dependen de sistemas posteriores** («etapa superada», «megaproyecto», «pacto cumplido»…): su predicado es falso hasta que el sistema existe, así que no salen. **Ningún arranque se fuerza.**

**Estimación de cobertura:** unos 120 cuerpos alcanzables en la fase 1, unos 220 en la fase 4 y los 310 en la fase 8.

### 7.6 Los 47 cuerpos que no son encuentros

Los disparadores de los sucesos están en §6.5. Aquí van las opciones (cuya etiqueta se puede cambiar) y lo que el motor hace con cada una.

**Decisiones (15)**

| Cuerpo | Cuándo suena | Opción A → efecto real | Opción B → efecto real | Compromiso o seguimiento |
|---|---|---|---|---|
| `inaugural` (Raquel) | 1-1-2022, o 4-1-2027 en el rescate | **Servicio público:** transferencia de 3,5 M€ al mes, OSP de 2,2 €/tren-km, Territorio +10 y 120 M€ de aportación | **Rentabilidad:** 2 M€ al mes, 1,6 €/tren-km, Hacienda +10 y 160 M€ | La política se puede volver a elegir tras cada elección ganada, como «nuevo contrato de gestión» |
| `energy` (Charo) | 1-3-2022 (crisis real); después, crisis de energía sembradas | **Contratar cobertura:** fija el índice de energía 12 meses; la prima es el 50 % de la exposición prevista (se ve) | **Rezar:** se aplica el índice +70 % durante 12 meses. **La crisis llega igual**, y el detalle muestra que B sale más caro 🔒 «la segunda, más» | — |
| `burgos` (Raquel) | 21-7-2022, el día que se abre | Abrir Madrid–Burgos con una unidad compatible libre (4 M€, +10 % durante 6 meses). Desactivada si no hay unidad, con el motivo | Esperar | Servicio en 6 meses; Gobierno ±; agravio |
| `discounts` (Raquel) | 1-9-2022 (abonos reales) | **Reforzar:** 65 M€ **con condición**: +1 salida por sentido en las 3 relaciones Alvia o de media distancia más llenas, o compra en Trenespop, antes de 3 meses; si no, se devuelven | **Ir tirando:** 25 M€ sin refuerzo; los viajeros de pie y la fuga al autobús se ven | La subida de demanda (+15 % durante 16 meses) **llega siempre** |
| `Rossa` (Pedro) | 1-11-2022 | **Competir en servicio:** 18 M€ y +3 de calidad en las relaciones con YaIré durante 24 meses | Que compitan: nada | YaIré entra el 25-11 pase lo que pase |
| `murcia` (Raquel) | 20-12-2022 | Abrir Madrid–Murcia (unidad compatible, +10 % durante 6 meses) | Esperar → petición de Murcia con plazo | — |
| `gauge` (Raquel) | 2-2023 (real) | **Revisar toda la flota:** 0,05 M€ por unidad; se comprueban el gálibo y la compatibilidad de las unidades y los pedidos, se marcan los que no caben y las unidades revisadas ganan +5 de estado | Reputación −2 | — |
| `pajares` (Óscar) | 29-11-2023 | **Lanzar los Alvia a Asturias:** se abre o refuerza Madrid–Oviedo/Gijón por la Variante con una unidad de ancho variable libre (+10 % durante 6 meses). Si no la hay, se abre Trenespop filtrado | Más adelante | Sin unidad: servicio en 6 meses. `arc:1` queda en cola |
| `extremadura` (Óscar) | 14-12-2023 | **Plan Extremadura:** empieza la obra de 25 kV en Madrid–Talavera–Plasencia; el Ministerio pone el 80 % | **Alvia decentes:** asigna S730 libres a Madrid–Badajoz o abre Trenespop con los bimodos | A: «Extremadura electrificada» antes del fin de obra + 6 meses |
| `s106` (Óscar) | 5-2024 | Relanzamiento: 15 M€ y +10 % durante 6 meses en las relaciones con S106 | A trabajar: 6 M€ para revisar las 10 unidades peores | Los S106 llegan poco a poco durante 18 meses 🔒 |
| `futuretender` (Óscar) | 3-2026 | **Preparar la inversión:** 45 M€ reservados como entrada; se devuelven si en 6 meses no hay pedido | Priorizar lo que hay: reputación +8 y sin nueva generación hasta la siguiente ventana | La licitación se abre siempre |
| `climate` (Pedro) | El primer verano desde 2030 en que Córdoba llega a 45 °C | **Plan de resiliencia:** 35 M€; las limitaciones y las incidencias por calor se reducen a la mitad para siempre | **Reducir la oferta:** −20 % de frecuencia cada verano en las relaciones que pasan por Córdoba, Sevilla o Badajoz; se pierde dinero, la puntualidad se mantiene | — |
| `rural` (Paco) | Villanueva sin tren, Territorio < 45, ≥ 3 ciudades rurales sin servicio, desde 2024 | **Firmar con las comarcas:** contrato de 5 años 🔒. Paga 6 M€ al mes **solo en los meses que se cumplen** ≥ 2 salidas por sentido y ≥ 80 % de puntualidad en la lista rural; obliga a **reabrir la parada de Villanueva** en 12 meses; con 3 incumplimientos seguidos se cancela y Territorio −15 | Seguir como estamos: Territorio −5; agravio de Paco | Contrato en Agenda; `paco-inaugura` cuando reabra |
| `industry` (Fermín) | Cola de fábrica sembrada (2038–2044) | **Reservar capacidad:** 45 M€; tus pedidos se libran de la cola 36 meses y los pendientes se adelantan 6 | Esperar | La cola de +18 meses 🔒 **llega a todos**; los usados no se ven afectados |
| `legacyvote` (Pedro) | Tras ganar las elecciones de 2047 | **Una red para todos:** 50 M€; promesa final de AVE en ≥ 40 ciudades y toda la lista rural servida | **Cuentas claras:** +50 M€ de presupuesto; promesa final de deuda < caja y resultado ≥ 0 en los últimos 12 meses | Se puntúa en el veredicto de 2051 |

**Sucesos (22)**

| Cuerpo | Opción A → efecto real | Opción B → efecto real |
|---|---|---|
| `cable` | Reponer ya: 9 M€, arreglado en 1 semana | A nuestro ritmo: 8 semanas de limitación en **ese** tramo |
| `strike` | Negociar: **+3 % de nómina que se cobra cada mes**, Plantilla +20, se desconvoca | Aguantar: 2 semanas con servicios mínimos (se cancela el 50 % de las circulaciones AVE y el 25 % de las de OSP); se pierden ingresos; Plantilla −10 |
| `wifi` | Wifi nuevo: 14 M€; la política Wifi gratis 2 años y +3 de calidad en larga distancia | Ya pasará: reputación −3 |
| `eufunds` | Plan de obras: abre Planos con los tramos que cumplen; con 2 obras firmadas en 6 meses, +10 % extra | Sin prisa. **El 60 % durante 24 meses se aplica en los dos casos** 🔒 |
| `freeze` | Aceptar el recorte: −30 % de la transferencia durante 12 meses | Protestar: −12 %, Gobierno −10 y reputación −3. **Nunca exige pagar por adelantado**, así que se acaba el bloqueo de la partida |
| `mayorchain` | Prometer un estudio: 3 M€; Paco se desencadena. A los 6 meses sale el estudio («parada AVE: 30 viajeros al día; parada regional: 400») y abre la petición «Reabrir Villanueva» | Ignorarlo: sigue encadenado 4 semanas más (precaución en el tramo), Territorio −5 y vuelve |
| `busprice` | Bajar tarifas un tiempo: −15 % durante 6 meses en las relaciones de menos de 400 km con autobús, y se anota la respuesta | Confiar en la velocidad: nada. **La campaña de 5 € ocurre en los dos casos** |
| `heatwave` | Limitar velocidades: 160 km/h en convencional y −20 % en LAV en los tramos con calor durante 8 semanas | Patrullas: 8 M€, sin limitación, con un riesgo residual de deformación de la vía |
| `snow` | Movilizar todo: 10 M€, el corte dura 3 días | Esperar al sol: 14 días sin tensión en los 3 puertos |
| `cows` | Vallar: 6 M€; las incidencias por animales se reducen a la mitad para siempre en los tramos rurales de vía única | Que se aparten: nada (el retraso ya ocurrió) |
| `secondhand` | Comprar: los 4 S112 al 80 % por 60 M€, con aviso de compatibilidad | No, gracias: el anuncio sigue 4 semanas |
| `workshopfire` | Reconstruir: 18 M€ | Apañarse: −1 plaza de taller y desgaste ×1,15 durante 6 meses |
| `influencer` | Contratarle: 5 M€; el efecto se amplía a todo el producto durante 3 meses | Dar las gracias: reputación +2. La subida en esa relación ocurre siempre |
| `festival` | Refuerzo de verano: +1 salida por sentido en las relaciones turísticas, con unidades libres (8 M€ + operación) | Que se llenen los autobuses: la demanda que no cabe se va a Íñigo |
| `audit` | Una consultora: 7 M€; el riesgo de multa baja un 70 % | Un abogado bueno: el riesgo depende de los trimestres en negativo y de las pruebas, con una tirada sembrada y **sin repetir** |
| `adifdelay` | Pagar para trabajar de noche: 12 M€, sin retraso | Esperar a los arqueólogos: +4 meses **en esa obra** |
| `adifboost` | Poner más dinero: ≈ 10 % de la obra, −3 meses | Al ritmo previsto |
| `royal` | Preparar el viaje: 6 M€ y una unidad AVE libre durante un día; sale bien con probabilidad igual a la puntualidad de la relación | Tren normal: probabilidad igual a la puntualidad − 10 |
| `election` | Inaugurar lo que haya: **solo** si algo terminó en las últimas 12 semanas o terminará antes de votar; voto +1 y Gobierno +10 | No hay nada que cortar: Gobierno −8 y promesa de inaugurar antes de la fecha |
| `tweet` | Refuerzo: prioridad «puntual» durante una semana y cuadrilla de guardia; reto de puntualidad ≥ 90 % esa semana: si sale, +3; si no, Gobierno −5 | Que tuitee: el reto se mide igual |
| `teruel` | Prometer catenaria: promesa de empezar a electrificar un tramo de Teruel en 12 meses (la tensión se elige al firmar) | Reyes Magos: Territorio −2 |
| `luggage` | Reformar los coches: 10 M€; reforma escalonada de las unidades de larga distancia y +1 de calidad durante 5 años | Seguir con el tetris: satisfacción −2 |

**Capítulos (5) y arcos (5).**
- Los capítulos están en §6.7: objetivos idénticos al texto, con plazo y consecuencia.
- Los arcos son la voz de los **encargos**:

| Arco | Solo se ofrece si… | Exigencias del encargo (las inspecciona el motor del clásico) |
|---|---|---|
| `arc:0` (Íñigo, sobre OuiOui) | OuiOui está en esa relación y en guerra de precios. Si no hay ninguna, el arco no se ofrece | Cuota ≥ X frente a OuiOui con margen ≥ 0 |
| `arc:1` (Benito) | Se ha abierto la Variante | Relación por `leo-pol-v` con ancho variable y ≥ N salidas |
| `arc:2` (Raquel) | Raquel está en el Ministerio | Relación mediterránea; en las fases 2–3, obra de tercer carril o de catenaria (que «une estaciones en el mapa») |
| `arc:3` (Paco) | Relación rural con autobús ≥ 30 % | Primera salida ≤ 07:00 («el autobús de las seis») y cuota de autobús < X |
| `arc:4` (Pedro) | Quedan ≤ 12 meses para las elecciones | Inaugurar o terminar algo antes de votar; recompensa: voto +2 |

### 7.7 El tutorial de 2022 (50 tomas): se queda entero

- **Mismas 9 etapas** y mismas comprobaciones del estado (`induction-runtime`). Cambia solo lo que hace falta para que siga siendo cierto:
  - **Nombres de la interfaz** que dice la voz, que se respetan (🔒):
    - «Qué puede circular», el bloque de la ficha de relación;
    - «Competencia», la pestaña Red › Competencia;
    - «Investigación», la pestaña Progreso › Investigación;
    - «Agenda», la pestaña Despacho › Agenda.
  - **Jornada:** «Comienza la jornada» = pulsar ▶. «Pasa al día siguiente» = la pausa automática al final del día y el botón «Siguiente día». El parte del día lo calcula ahora el motor (§2.2) y deja de ser «la previsión del mes repartida entre los días».
  - **Mandato:** la respuesta («caja / cobertura / ambas») se guarda como *prioridad de la dirección*. Decide las sugerencias de «Siguiente» y los valores iniciales del protocolo (cobertura → autobús; caja → esperar; ambas → equipo si el retraso pasa de 20 min). Deja de ser una pregunta sin efecto.
  - **Primer encargo:** crecimiento sobre la línea base (§3.8). Así «el plazo es de dieciocho meses» supone una tensión real.
  - **Óscar** aparece en la placa como «Alcalde de Pucela» hasta el 20-11-2023.
  - **Flota:** ninguna diésel en el mes 0 (§3.7).
  - Se mantiene el cambio de `inductionBriefing` por una línea genérica ya grabada.
- **En las situaciones de 2027 no hay inducción.** Hay una lista que se marca sola con el estado del juego (Airport CEO). Tiene «¿Por qué no se marca?» y «Saltar», y las voces `t-1` a `t-7`.

### 7.8 Compromisos: las promesas se apuntan

**De dónde salen:**
- opciones de decisiones y sucesos;
- pactos;
- peticiones aceptadas;
- promesas del **Mitin**;
- encargos;
- opciones A de encuentros con duración.

**Vocabulario cerrado de comprobaciones.** Todas se pueden calcular con `hechos`:

| Tipo | Ejemplo |
|---|---|
| `servicio(rel, {frecuencia ≥ n})` | Madrid–Burgos en servicio |
| `puntualidad(ambito, ≥ x, meses n)` | Norte, Levante y Sur ≥ 85 % durante 3 meses |
| `tramo(id, propiedad)` | `tal-pla.e ≠ 'no'` |
| `obraIniciada` / `obraTerminada(tipo, tramos, antes)` | Electrificar Teruel |
| `estacion(id, abierta \| personal)` | Reabrir Villanueva |
| `unidades(rel, ≥ n)` | 2 unidades en Madrid–Badajoz |
| `sinRecortes(ambito)` | Convenio con la plantilla |
| `cajaMin(x, continuo)` | Reserva de caja de la etapa 2 del rescate (se mira cada día, no solo al final) |
| `resultado ≥ 0 (trimestres m de n)` | Contrato-programa |
| `sinPrestamos` | Contrato-programa |
| `territoriosServidos(≥ n)` | Cohesión |
| `inaugurar(antes)` | Adelanto electoral, `raquel-inauguracion` |
| `noAbrir(ambito)` | Pacto con Autocares Meseta |
| `ciudadesAVE(≥ n)` | `legacyvote` |
| `cuota(rival, rel, ≤ x)` | `arc:0` |

**Ciclo de vida:**
- **abierto** → **en riesgo** (queda ≤ 25 % del plazo y no va camino de cumplirse; pasa a ser un aviso crítico si es de Gobierno o un ultimátum) → **cumplido** o **roto**.
- Al cerrarse se aplican el premio o el castigo, una entrada en la memoria del personaje (§7.9), una línea en el Diario y, si la Gaceta lo considera noticia, un titular.
- **Hemeroteca:** el porcentaje de promesas cumplidas entra en la puntuación y en el veredicto.
- **Dónde se ven:** en Despacho › Agenda (lista con barra de avance y plazo), como chip en el objeto (tramo, relación o estación) y en el retrato de la persona («Le prometiste catenaria · vence en 7 meses»).

### 7.9 Memoria de los personajes y cadenas

**Qué se anota.** Cada persona guarda sus entradas `favor`, `agravio`, `aviso` y `promesa`. Cada una pesa, caduca (se olvida en 2 años) y tiene un efecto mecánico.

| Agravio de… | Efecto real | Cuánto dura |
|---|---|---|
| Ministra o ministro | −5 % de OSP el trimestre siguiente; sin visitas ni ofertas de inauguración | 26 semanas |
| Adif (Benito) | Permisos de obra ×1,5 | 52 semanas |
| Alcalde (Paco) | El objetivo de Territorio baja 5; puede extorsionar **si existe un secreto con él de testigo** | Mientras dure |
| Talleres (Fermín) | El umbral de huelga sube 5 | Mientras dure |
| Viajeros (Marisa) | Viajeros −3 | Mientras dure |

**Cadenas.** Los arranques de los encuentros leen la memoria:
- **Avisos que se cumplen:** si Fermín avisó de una unidad (tema 2, opción B) y luego se rompe, puede sonar «Te avisé…» (`workshop.disappointed`).
- **Promesas rotas:** Paco «Nos prometiste futuro…» (`mayor.disappointed`) exige una promesa rota con él.
- **Promesas cumplidas:** Pedro «He vuelto a demostrar que soy imprescindible» exige que se haya cumplido algo suyo hace poco.
- **Contrapesos:** Benito «Otra promesa encima del barro» exige que hayas firmado algo mientras una obra va con retraso.

**El retrato de cada persona** abre una ventana con lo que recuerda: «Recuerda: le prometiste catenaria (oct 2024) · cesaste a su sobrino».

### 7.10 Consecuencias que se ven y se comprueban

- **Cada efecto es un registro** con origen (cuerpo y fecha), tipo, objetivo, valor, inicio, fin y etiqueta.
  - Aparece como chip con cuenta atrás en la ficha del objeto: «Lanzamiento Burgos · +10 % · 4 meses».
  - Al terminar se mide: «Terminó: +1.240 viajeros al mes (+11 %) frente a los 6 meses anteriores».
- **Diario** (Prensa › Diario). Una línea por decisión: «21-7-2022 · Raquel · El AVE llega a Burgos · Abrir el AVE a Burgos → Madrid–Burgos abierta, 2 salidas · resultado a los 6 meses: +11 %». Es el registro de coherencia que el jugador puede leer.
- **Informe del mes.** Una pantalla que solo sale si algo cruzó un umbral:
  - viajeros, ingresos y neto;
  - **«Consecuencias»** (efectos que terminaron y promesas que vencieron);
  - averías y obras;
  - lo que llega el mes siguiente.
- **«¿Por qué?»** en cada número lista hasta 5 causas, cada una con su origen («−9 · Obra Ávila–Medina por fases»).

### 7.11 El reparto: cargos por fecha y por estado

- `cargo(persona)` sale de una tabla por situación (§2.5, §2.6) más los cambios que provoca el estado:
  - **Elecciones ganadas:** sigue el reparto. **Perdidas:** termina la partida.
  - **Remodelación** (desde 2027). Pasa como mucho una vez por legislatura, cuando se cumplen las tres condiciones:
    - la confianza del Gobierno lleva 13 semanas por debajo de 25;
    - la encuesta está en ≥ 45 (el Gobierno aguanta);
    - quien está en el Ministerio te guarda un agravio.

    Pedro sacrifica al ministro en lugar de a ti y entra el otro (Raquel ↔ Óscar), con la voz nueva `remodelacion`. Quien entra tiene 26 semanas de «recién llegado», lo que hace cierto `successor.determined` («Vamos a poner orden»).
  - **Cese de Benito** (por escándalo): 52 semanas sin voz. Lo sustituye un jefe en funciones con avisos solo escritos y permisos ×1,25.
- **Voces del Ministerio si cambia quien lo ocupa:**
  - Los dos actos que dice el sucesor (III y IV) tienen variante grabada de Raquel (2 líneas nuevas).
  - Las líneas genéricas (`stage-pass`, `fin-retirada`, `cor-enchufe`, `sc-enchufe`) se graban con las dos voces.
  - **Nunca habla alguien que no ocupa el cargo.**
- **Cómo se dirigen al jugador:** «presidente de Tenfe» o «director». Por eso se retira `paco-estacion`, que le llama «Ministro» (§7.12).

### 7.12 Las líneas del rescate: qué se queda, qué se reescribe y qué se va

| Grupo | Líneas | Destino |
|---|---|---|
| Grabadas que se quedan | `t-1`, `t-2` | Situaciones 2027 (§2.6), con su mecánica literal: 13 semanas y el trazo del Norte |
| Grabada que se retira | `paco-estacion` | Llama «Ministro» al presidente de Tenfe y repite `decision:rural`. Se queda en el auditorio |
| Sustituidas por cuerpos clásicos grabados | `ev-cable`, `ev-nevada`, `ev-huelga`, `ev-auditoria`, `ev-viral`, `ev-calor` (parte del calor en la vía), `ev-fondos`, `ev-visita`, `ev-lowgo`, `ev-tuneles` | → `event:cable`, `snow`, `strike`, `audit`, `influencer`, `heatwave`, `eufunds`, `royal`, `decision:Rossa` / `event:busprice` / `arc:0`, y `decision:gauge` más un aviso escrito |
| Pasan a cartas o avisos sin voz | `pact-done`, `pact-broken`, `negotiate-ok`, `negotiate-no`, `milestone` (desde el hito 4), titulares | Sin voz; la reacción del personaje llega con sus encuentros (arranques de pacto cumplido o roto) |
| Se reescriben y se graban | Las demás: tutorial y etapas del rescate, pactos, cloacas, finanzas, elecciones y fin | §7.13 |

### 7.13 Líneas nuevas: 72

**Reglas:**
- Se graban con `build_rescate_voices.py` (mismo modelo, referencias, semilla y masterización).
- Sin cifras dinámicas.
- Solo afirman lo que garantiza su disparador.
- Su persona está en el cargo cuando suenan.
- Se trata de **congelar el texto antes de grabar en cada fase**, porque `--package` descarta la toma si cambian el texto, la persona o el ánimo.

| Fase | Id | Voz · ánimo | Cuándo suena (disparador) | Texto propuesto |
|---|---|---|---|---|
| 4 | `ev-averia-rampa` | Fermín · preocupado | Se rompe una unidad nombrada en un tramo con etiqueta «rampa» | «Se nos ha muerto un tren en plena rampa. Puedo arreglarlo deprisa con horas extra o meterlo en el taller como Dios manda. Tú decides cuánto lloramos.» |
| 4 | `ev-desprendimiento` | Benito · preocupado | Trinchera con estado < 50 y día de lluvia o invierno; el tramo **se corta al anunciarse** | «Desprendimiento de rocas en la trinchera. Nadie herido, pero la vía está cortada. Si me das una cuadrilla, lo despejo rápido; si no, esperamos a la contrata.» |
| 4 | `ev-aire` | Marisa · enfadada | Día con ≥ 40 °C y unidad con estado < 55 en un tramo con calor | «Cuarenta grados fuera y el aire acondicionado del tren en huelga. Hay gente abanicándose con el billete, y yo con la paciencia.» |
| 5 | `el-forecast` | Pedro · preocupado | 6 meses antes de votar | «Las encuestas están ahí. Mira qué grupos te sostienen y cuáles te van a dejar caer. Quedan pocos meses.» |
| 5 | `el-win` | Pedro · orgulloso | Ganas **y** la puntualidad de la red mejoró desde las elecciones anteriores | «Hemos ganado. Tú sigues en Tenfe, yo sigo en la Moncloa y todos seguimos llegando tarde, pero menos.» |
| 5 | `el-win-2` | Pedro · sorprendido | Ganas sin esa mejora | «Hemos ganado. No me preguntes cómo, que yo tampoco lo sé. Tú sigues en Tenfe: no lo desaproveches.» |
| 5 | `el-lose` | Pedro · decepcionado | Pierdes (termina la partida) | «Hemos perdido las elecciones. El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú.» |
| 5 | `remodelacion` | Pedro · decidido | Remodelación (§7.11) | «He cambiado de ministro. No es por ti. Bueno, un poco sí. Al nuevo trátalo bien, que también tiene micrófono.» |
| 5 | `acto3-raquel` | Raquel · enfadada | Empieza el Acto III con Raquel en el Ministerio | «He vuelto y el corredor mediterráneo sigue en los discursos. Quiero un AVE de València a Barcelona y alta velocidad en Almería. Tercer carril donde haga falta, y ni una cinta sin catenaria.» |
| 5 | `acto4-raquel` | Raquel · preocupada | Empieza el Acto IV con Raquel | «La España vaciada vuelve al telediario, y esta vez me miran a mí. Electrifica lo que siga con gasóleo, lleva el AVE a más ciudades y termina alguna línea nueva.» |
| 5 | `prorroga` | Pedro · orgulloso | Después del veredicto de 2051, en una partida que sigue | «Me presento otra vez. España me necesita, y tú necesitas a alguien que firme tus obras. Sigue.» |
| 5 | `veredicto-bien` | Pedro · contento | Veredicto de 2051 aprobado, con cuentas ≥ 0 | «Veintinueve años después, la red funciona y las cuentas no dan vergüenza. Lo anunciaré como mío. Tú sabes que no lo es, y con eso basta.» |
| 5 | `veredicto-mal` | Pedro · decepcionado | Veredicto de 2051 suspendido | «Se acabó el plan. La red que dejas no es la que prometimos, y eso ya no lo arregla ninguna foto. Firma aquí y apaga la luz.» |
| 5 | `cesado` | Pedro · enfadado | Gobierno < 15 durante 6 cierres | «Te avisé de dónde estaba la puerta. Recoge el despacho: viene otro a hacerlo peor con más entusiasmo.» |
| 5 | `fin-impago` | Charo · enfadada | Cierre de mes con caja < 0 | «No llegas a los pagos. Vende trenes, aplaza obras, renegocia la deuda, recorta servicios o pídeme un rescate. Todo tiene un precio, y lo pagarás más tarde.» |
| 5 | `fin-quiebra` | Charo · decepcionada | 3 cierres en negativo después de un impago | «Tres cierres sin poder pagar. Tenfe entra en concurso de acreedores. Yo ya lo había dicho.» |
| 5 | `fin-retirada-m` / `-s` | Raquel u Óscar · enfadados | 3 graves | «Demasiados incumplimientos graves. El Ministerio os retira la concesión. Recoge tus cosas.» (2 tomas) |
| 5 | `paco-inaugura` | Paco · orgulloso | Se reabre la parada de Villanueva | «Ya para el tren otra vez en Villanueva. Cuatrocientos doce vecinos, un andén y una banda que solo se sabe dos canciones. Presidente, esto no se olvida en las urnas.» |
| 5 | `fermin-convenio` | Fermín · decidido | Agenda: Plantilla < 45 | «La plantilla firma la paz si sube la nómina. Medio año sin huelgas. Y sin recortes, que nos conocemos.» |
| 5 | `charo-contrato` | Charo · preocupada | Agenda: 2 trimestres en negativo | «Te ofrezco un contrato-programa: más subvención cada trimestre. A cambio, cuentas en positivo y ni un préstamo más. Si me fallas, me lo devuelves con intereses y con auditoría.» (si fallas, auditoría **segura** e intereses del 4 %) |
| 5 | `benito-cuadrilla` | Benito · contento | Agenda: sin cuadrillas libres y vía < 50 | «Te presto una cuadrilla de Adif tres meses. Gratis. Bueno, gratis no: luego me pagas unos gastos de coordinación. Así funciona esto.» |
| 5 | `marisa-carta` | Marisa · decidida | Agenda: esenciales < 80 y Viajeros < 40 | «Firma una carta de compromisos: el Norte, el Levante y el Sur llegando a su hora. Si cumples, te aplaudimos. Si no, te reclamamos hasta el último billete.» |
| 5 | `raquel-inauguracion` | Raquel · orgullosa | Elecciones a menos de 14 meses; plazo **anterior a la votación** | «Necesito cortar una cinta antes de las elecciones. Me da igual qué: una obra, un andén, un banco del parque. Tú termina algo y yo pongo la sonrisa.» |
| 5 | `oscar-tuits` | Óscar · contento | Ídem, con Óscar | «Tengo un plan de comunicación: tres inauguraciones en seis meses. Tú pones las obras, yo pongo los tuits. Si no hay obras, también habrá tuits. Sobre ti.» |
| 5 | `pedro-cohesion` | Pedro · orgulloso | Territorio < 40, elecciones a menos de 2 años; la base se guarda al firmar | «España no se acaba en la Castellana. Te pago un buen pellizco si pones un tren diario en algún sitio que nadie sepa señalar en el mapa.» |
| 5 | `inigo-noagresion` | Íñigo · orgulloso | Extremadura sin tren, y Soria o Teruel sin servicio; **firmar crea un secreto** con Íñigo de testigo | «Te propongo un trato entre caballeros. Mis autocares te llevan gente a Soria y a Teruel. Tú te olvidas de Extremadura un año. Nadie tiene por qué enterarse.» |
| 6 | `hito` | Marisa · contenta | Hitos 1 a 3 | «Hay gente en los andenes. Gente de verdad, con maletas. Esto empieza a parecer una compañía ferroviaria.» |
| 6 | `mega-hecho` | Pedro · orgulloso | Termina un megaproyecto que no es el de vanidad | «Megaproyecto terminado. Esto sale en los libros de texto. O al menos en el telediario.» |
| 6 | `operador-del-ano` | Pedro · sorprendido | Ganas el premio anual | «¿Operador ferroviario del año? ¿Nosotros? Que no se entere nadie de cómo, que me lo creo y todo.» |
| 7 | `t-3` | Benito · decidido | Rescate, semana 1 | «Benito, de obras. El Norte se rompe entre Ávila y Medina: vía cansada y limitaciones de velocidad. Pulsa el tramo y pide un bateo; la renovación entera tarda meses. Elige cómo mantienes el servicio mientras tanto.» |
| 7 | `t-4` | Charo · preocupada | Primera obra presupuestada | «Charo, de Presupuestos. Antes de firmar, mira la cuenta: lo que cuesta ahora, lo que cuesta cada mes y lo que tienes que pagar pronto. La ayuda europea no se cobra hasta certificar la obra.» |
| 7 | `t-5` | Fermín · decidido | Abres Trenespop por primera vez | «Fermín, del taller. Un tren de segunda mano llega enseguida; uno nuevo tarda meses. Y un tren en revisión no circula. Si la vía sigue rota, un tren más es un tren más llegando tarde.» |
| 7 | `t-6` | Raquel · contenta | Primera pausa | «El reloj corre, pero puedes pararlo cuando quieras: mirar y comparar es gratis. Lo que firmas, se cumple. Y lo que prometes, se apunta.» |
| 7 | `t-7` | Raquel · orgullosa | Primer cierre de mes | «Primer mes cerrado: trenes, billetes, nóminas y obra. A partir de aquí decides tú. Yo vuelvo cuando haya foto.» |
| 7 | `stage-s1` | Raquel · decidida | Empieza la etapa 1 | «Primer trimestre. Que el Norte vuelva a llegar a su hora en trece semanas. Y paga todo: un impago en tu primer trimestre es un titular que no quiero leer.» |
| 7 | `stage-s2` | Charo · preocupada | Etapa 2: la reserva de caja se mira **cada día** | «Ahora los tres esenciales: Norte, Levante y Sur fiables antes de fin de año. Y la caja, siempre por encima de la reserva. Siempre: la miro cada semana.» |
| 7 | `stage-s3` | Pedro · orgulloso | Etapa 3: las **tres** condiciones cuentan | «Querido presidente de Tenfe: sanea las cuentas, cumple lo que prometas en campaña y gánanos las elecciones. Las tres cosas cuentan.» |
| 7 | `stage-s4` | Óscar · decidido | Etapa 4, con Óscar en el Ministerio | «Nuevo ministro, nuevas prioridades. Quiero tren en dos territorios olvidados y que OuiOui no se coma tus corredores buenos. Lo quiero en hilo y con fotos.» |
| 7 | `stage-s5` | Pedro · decidido | Etapa 5; **la placa existe** (un objeto en Atocha, en el mapa) | «Última legislatura. Cinco corredores fiables, nada de rescates y otras elecciones. Si lo consigues, te ponemos una placa en Atocha. Pequeña.» |
| 7 | `stage-fail` | Charo · decepcionada | Etapas 2–5 incumplidas | «No has cumplido el objetivo en plazo. Queda en tu expediente como incumplimiento grave. Al tercero, el Ministerio os retira la concesión.» |
| 7 | `stage-pass-m` | Raquel · orgullosa | Etapa superada con Raquel | «Objetivo cumplido. Lo voy a contar como si hubiera sido idea mía, que para eso estoy.» |
| 7 | `stage-pass-s` | Óscar · orgulloso | Etapa superada con Óscar | «Objetivo cumplido. Ya lo he tuiteado. Dos veces.» |
| 7 | `s1-fallo` | Raquel · decepcionada | Etapa 1 incumplida (termina el rescate, con «Reintentar») | «Trece semanas y el Norte sigue llegando tarde. Te lo dije el primer día: aquí se acaba tu rescate.» |
| 7 | `end-win` | Pedro · orgulloso | Veredicto de 2034 aprobado | «Ocho años, dos elecciones y una red que funciona sin rescates. Hay quien decía que era imposible. Tú lo has hecho, y yo lo voy a contar.» |
| 7 | `end-partial` | Charo · preocupada | Veredicto de 2034 parcial | «Has aguantado ocho años, pero lo prometido no está completo o la red no se paga sola. Te recordarán como el que casi lo arregla.» |
| 8 | `cor-comision` | Íñigo · orgulloso | Pedido nuevo a una marca; Íñigo, como Conseguidor | «Tengo un amigo en la fábrica que te ofrece una atención: un siete por ciento del contrato en una cuenta de Andorra. El contrato sube un poco, claro. Alguien lo tiene que pagar.» |
| 8 | `cor-traviesas` | Benito · contento | Primera renovación en fase de obra | «Te propongo una cosa. Certificamos dos kilómetros de traviesas que ya estaban puestas. Nadie las va a contar. La diferencia, a medias.» (**Tenfe paga** esos km) |
| 8 | `cor-yate` | Íñigo · contento | Pedido de BCBB con comisión | «Este fin de semana salgo en el yate con los de BCBB. Gambas, champán y una propuesta de contrato. Vente, que el mar no graba.» (la propuesta existe: un anuncio de BCBB con descuento) |
| 8 | `cor-enchufe-m` / `-s` | Raquel u Óscar · contentos | Agenda del Ministerio | «Mi sobrino Borja necesita trabajo. Es muy espabilado: sabe de todo un poco. Hazle jefe de cuadrilla y te debo una.» (2 tomas; si aceptas, **las obras van ×1,33 más lentas**) |
| 8 | `cor-mariscada` | Fermín · contento | Diciembre | «La cena de Navidad de la dirección: noventa mil euros en marisco. ¿Lo cargamos a «formación en seguridad»?» |
| 8 | `paco-sobre` | Paco · contento | Sobre al alcalde (Conseguidor) | «Lo del sobre, ni una palabra. Usted me arregla la comarca y yo le arreglo los permisos. Aquí las cosas se hacen como toda la vida.» (crea una promesa «arreglar la comarca») |
| 8 | `ext-inigo` | Íñigo · orgulloso | Secreto del yate sin publicar (**las fotos existen**) | «Tengo unas fotos tuyas muy bonitas. Si pagas, se quedan en mi cajón. Si no, en la portada del domingo.» |
| 8 | `ext-paco` | Paco · enfadado | Sobre a Paco **y** su promesa rota | «O me cumples lo de la comarca o le cuento a la prensa lo del sobre. Yo no tengo nada que perder. Tengo un pueblo de cuatrocientos doce habitantes.» |
| 8 | `ext-benito` | Benito · preocupado | Secreto de las traviesas y causa abierta | «Me han llamado del juzgado. Si me subes el sueldo, me acuerdo de muy pocas cosas. Si no, me acuerdo de todas.» (el sueldo extra es **mensual**) |
| 8 | `sc-traviesas` | Marisa · enfadada | Sale ese secreto | «Ha salido el caso Traviesas: pagaste kilómetros de vía que no existen. La gente quiere saber dónde está el dinero. Yo también.» |
| 8 | `sc-yate` | Marisa · sorprendida | Sale el secreto del yate | «Portada del domingo: tú en un yate con el fabricante chino y una langosta. Pie de foto: «Negociando a la baja».» |
| 8 | `sc-comision` | Marisa · enfadada | Sale una comisión que no es de BCBB | «Portada: comisiones en los contratos de trenes. Una cuenta en Andorra, tus iniciales y un fabricante muy agradecido.» |
| 8 | `sc-enchufe-m` / `-s` | Marisa · enfadada | Sale el enchufe | «El sobrino de la ministra es jefe de cuadrilla y no sabe lo que es una traviesa. Lo han grabado preguntando si el balasto se come.» / «…del ministro…» (2 tomas) |
| 8 | `sc-mariscada` | Marisa · enfadada | Sale la mariscada | «Noventa mil euros en marisco cargados a formación en seguridad. La formación consistía en abrir nécoras sin cortarse.» |
| 8 | `sc-sobres` | Marisa · enfadada | Salen sobres de alcalde, inspector o diputados | «Caso Sobres: dinero en mano a cambio de favores en tus obras. La Gaceta tiene una libreta con tus iniciales.» |
| 8 | `sc-pacto-meseta` | Marisa · enfadada | Sale el pacto con Íñigo | «Sale tu pacto con Autocares Meseta: tú te olvidabas de Extremadura y él te llenaba Soria y Teruel. Los extremeños ya saben por qué no les llegaba el tren.» |
| 8 | `sc-accidente` | Marisa · preocupada | Descarrilamiento leve **en el tramo** de una obra certificada sin pruebas | «Un tren ha descarrilado a poca velocidad en una obra recién certificada. No hay heridos, pero sí preguntas: alguien firmó las pruebas sin mirarlas.» |
| 8 | `sc-juez` | Charo · enfadada | Pillan el soborno al juez | «Han pillado el soborno al juez. Esto ya no es un escándalo, es una película. Y tú sales en el cartel.» |
| 8 | `sc-charo` | Charo · enfadada | Le ofreces un sobre a Charo | «¿Un sobre? ¿A mí? Acabo de reenviar tu oferta a la Fiscalía Anticorrupción con copia a mi madre.» |
| 8 | `jud-1` · `jud-2` | Charo · preocupada / enfadada | Fases 1 y 2 | Los textos actuales del rescate |
| 8 | `jud-3` · `jud-end` | Pedro · enfadado / decepcionado | Fase 3; condena (fin) | Los textos actuales del rescate |
| 8 | `jud-archivo` | Charo · sorprendida | Se archiva la causa | «Han archivado la causa. No me preguntes cómo, que prefiero no saberlo. Pero no tientes a la suerte dos veces.» |

**Cuentas.**
- Fase 4: 3. Fase 5: 24. Fase 6: 3. Fase 7: 16. Fase 8: 26.
- **Total: 72 líneas**, unos 60 minutos de CPU a 50 s cada una. El margen dentro del presupuesto (150) cubre repeticiones y variantes.
- **Etiqueta de publicación:** «412/412 + N/72» en el juego y en el auditorio.

### 7.14 Pruebas de verdad (bloquean la publicación)

| Prueba | Qué exige |
|---|---|
| `guion-completo` | Las 412 fuentes del catálogo y todas las `LINES` tienen un contrato o están en `RETIRADOS` (5 + `paco-estacion`). Una fuente sin contrato hace fallar la prueba |
| `verdad-fuzz` | Un robot con estrategias variadas juega 12 semillas de 2022 a 2040 y 6 del rescate de 2027 a 2034. En cada escena comprueba que `exige` y `afirma` son ciertos y que la persona está `enCargo`. Después de cada opción, que el cambio de estado contiene el efecto declarado. En cada vencimiento, que el compromiso se ha resuelto |
| `numeros-voz` | Cada constante de §3.8 es igual en el motor. Amplía `voice-text-test` |
| `sin-copias` | Ningún módulo nuevo contiene 40 caracteres seguidos de un cuerpo del catálogo |
| `presentacion` | Cada escena usa la persona y el ánimo del catálogo, y el `data-say` es el texto en bruto |
| `recarga` | Guardar en el día d, cargar y avanzar da el mismo resultado: las tiradas están sembradas por día |
| `alcance` | Es un informe, no bloquea. Mide qué cuerpos salieron al menos una vez en 40 partidas sembradas. Objetivo: ≥ 90 % de los no retirados cuando exista su mecánica |
| `extract-game-source` | La suma del catálogo sigue siendo `6348984c…` y hay 412 filas |

---

## 8. D7 · Qué se queda de cada modo y qué se va

### 8.1 De la campaña clásica

| Se queda (y cómo) | Se va o cambia (y por qué) |
|---|---|
| El planificador de red, `faultText` y «Qué puede circular» 🔒, ahora con tensión, gálibo y capacidad | **«Delegar mes»** y «Hasta el último tren» → velocidades con protocolo. Delegar dominaba sin jugar y esquivaba penalizaciones |
| El horario GTFS, los trenes en el mapa, el día y la noche con el sol real, el modo observador y los paneles de salidas | **La permutación de encuentros** (`tycoon.js:158`) → el director. Era «pulsar random» |
| Las aperturas históricas en su **día** exacto (se corrige el fallo del cambio de mes en `operations.js:232`) | **La tirada mensual del 32 %** de sucesos → riesgos con causa y sitio |
| Los **encargos**: requisitos inspeccionados en vivo, dos ramas, 3 cierres seguidos y comprobación del material antes de firmar. Son el mejor sistema «objetivo ↔ estado» | **El 22 % de retrasos de obra** y **el 28 % de retrasos de entrega** al azar → retrasos con causa (Territorio, invierno, cola de fábrica) |
| Los **capítulos** como actos, ahora con plazo y consecuencia | **El préstamo puente automático** → decisión de impago con 5 salidas |
| El logit de demanda (autobús y rivales), la tarifa como palanca y el índice de costes | **El pago inmediato de las peticiones** (truco de +42 M€) → se cobran tras 3 cierres cumplidos |
| Los rivales deterministas (entrada, guerras y revisiones) | **`fleetcare`** (+8 a toda la flota por 2 M€) → revisión dirigida por unidad |
| Maquinistas y formación de 3 meses 🔒; el modelo de incidencias del día; las respuestas de 18.000 € / 9.000 € 🔒 | **Las apuestas** a cara o cruz (auditoría, visita) → probabilidades a partir del estado, sembradas y sin repetir |
| Trenespop (usados, fábrica y estado) | **Una satisfacción que no mueve la demanda** → ahora la mueve |
| Ficha de ciudad con su perfil urbano, los +/− de frecuencia y las peticiones en su sitio | **La política fijada para siempre** → se vuelve a elegir tras cada elección ganada |
| Reparto, retratos y las 412 tomas; el tutorial de 9 etapas | **Ignorar la tensión** → tensión obligatoria |
| Políticas (con huecos) e investigación (una a la vez 🔒) | **«Trenes llenos» en todas las peticiones** (falso) → el dato real |
| Estaciones con niveles, la Gaceta y los logros (ahora medallas) | **Despacho con 4 pestañas × 5 subpestañas** → cajón de 2 niveles |

### 8.2 Del Rescate de Tenfe

| Se queda (y cómo) | Se va o cambia (y por qué) |
|---|---|
| Un motor puro y determinista, con la semilla en el estado y un robot de equilibrado | **Tres órdenes por semana.** No encaja con el reloj continuo ni con Cities o Tropico, y ninguna voz grabada la defiende. La escasez viene de los recursos físicos (§2.7) |
| **Presupuesto antes de comprometerse** con la misma regla que el motor (`workQuote`, `punctProjection`, `serviceQuote`, `cashProjection`, `plannedAid`) | **★ como moneda.** El tutorial grabado dice que la investigación cuesta dinero y tiempo 🔒. El ★ pasa a ser solo la *categoría* (1–5) que abre socios (§9) |
| **Causas a la vista** (`punctTarget().causes`, filas de `groupTargets`) → «¿Por qué?» | **Los 11 corredores abstractos y su escala de dinero** → relaciones reales sobre tramos; los corredores quedan como agrupaciones con nombre |
| **Misión → obstáculo → acción** → la columna Misión y la línea «Siguiente» | **«Lowgo»** → OuiOui (`lowgo` ya era su id) |
| Las paradas de «Avanzar» → razones de la pausa automática | **La interfaz de cristal oscuro sobre pergamino, el raíl de 11 páginas y las 8 píldoras de capas** → un solo lenguaje visual y 6 secciones |
| **Obras en 3 fases con 3 modos de servicio**; financiación prevista ligada a una obra | **Ofertas de pacto con un 9 % semanal** → agendas con disparador |
| **Pactos que se pueden comprobar** (beneficio, obligación, plazo y consecuencia), con 2 huecos | **El 20 % semanal de sucesos y las averías silenciosas** → riesgos situados que salen en el parte |
| **Impago con salidas** | **El informe semanal que no se enseñaba** → parte del día e Informe del mes |
| **Cloacas causales** (secretos, sospecha, pruebas y fases), ahora con registro de testigos | **Las líneas duplicadas sin grabar** → los cuerpos clásicos grabados (§7.12) |
| Megaproyectos por etapas con logros; hitos que abren sistemas | |
| Territorios: licencia → vía → tren diario | |
| Grupos con peso y media de 26 semanas; elecciones legibles | |
| Tutorial por acciones (ahora una lista que se marca sola en 2027); las 63 imágenes; la cadena de voces; los trenes y autobuses del mapa | |

### 8.3 Del modo libre

| Se queda | Se va |
|---|---|
| Caja de 500, 1.500 o 5.000 M€; rivales sí o no; sin fecha final; sin cese. Pasan a ser **reglas de maqueta** de la misma partida, más otras casillas (§6.8) | El modo aparte, su guardado que pisaba la campaña y el botón «Nueva partida» que arrancaba una campaña (fallo de `app.js:960`) |

---

## 9. D8 · Lo que tomamos de Airport CEO (nueve préstamos adaptados)

| # | En Airport CEO | En Tenfe | Qué aporta |
|---|---|---|---|
| 1 | **Monitor de vuelos** (tecla G): columnas agrupadas por color (identidad, horario, pasajeros, escala) y un contador de avisos con la causa al pasar el ratón | **Monitor de servicios** (Red › Servicios, tecla M). Una fila por relación, con las columnas agrupadas por color:<ul><li>blanco: punto de beneficio, nombre, producto, chips de ancho y tensión;</li><li>azul: unidades, salidas, ocupación;</li><li>amarillo: viajeros, sin plaza, puntualidad;</li><li>rojo: estado de la vía, taller, obras;</li><li>al final: neto de 3 meses, cuota de rivales y avisos.</li></ul>Al pasar por una fila, la relación parpadea en el mapa | Ver de un vistazo qué pierde dinero y qué llega tarde («una pieza débil lo retrasa todo») |
| 2 | **Triaje de avisos**: solo los críticos en la columna fija, el resto en una bandeja y marcas sobre el mundo | Hay tres sitios para los avisos (§10.5):<ul><li>como mucho 3 críticos en Misión;</li><li>la bandeja «Avisos», agrupada por objeto, cuyos avisos se borran solos cuando desaparece la causa;</li><li>marcadores en el mapa.</li></ul>No hay ajustes para silenciarlos | El jugador siempre sabe qué falla y dónde |
| 3 | **Emergencias** que aceptas o rechazas, con plazo, nota de la A a la F y un informe por correo (y su fallo: «A, sin multa» con una multa de 1,36 M) | **Incidencias con plazo y nota.** A ▶ tienes X minutos de juego para responder; si no, se aplica el protocolo. Al cerrarse, la Gaceta y el parte ponen una nota de la A a la F, y **la multa es exactamente la línea del libro de caja**, con enlace | Decidir en lugar de tirar dados; el informe cuadra con el dinero (regla de verdad 4) |
| 4 | **Planificador automático** con reglas *if* (que exige COO y CIO) | **Protocolo de incidencias** permanente:<ul><li>por tipo de incidencia y por retraso, con un tope de gasto diario;</li><li>se desbloquea por completo con el director de Operaciones;</li><li>al principio hay 3 reglas fijas que salen de tu prioridad del tutorial.</li></ul> | Hace que avanzar a ▶▶▶ sea justo y que la jornada no se convierta en un impuesto |
| 5 | **Notas en dos niveles** (de la semana y la media), **socios con estrellas** según tu nota | Cada grupo muestra «semana · media de 26 semanas». La **categoría ★ de Tenfe (1–5)** sale de la encuesta y abre pactos, preestrenos de marca y techo de crédito hasta tu ★ + 1. Los socios de 5★ pagan más pero exigen ≥ 90 % de puntualidad y castigan el doble | Que el apoyo no parezca aleatorio y que haya un dilema real |
| 6 | **Renegociación** con probabilidad visible, puntos y negociador automático (y el fallo: se ganaba recargando) | Cada pacto o encargo abre una **ventana cada 26 semanas**:<ul><li>deslizadores con la probabilidad de éxito en vivo;</li><li>**la tirada se guarda en el estado al abrirse**, así que recargar no la cambia;</li><li>contraoferta a mitad de camino, con 2 rondas como máximo;</li><li>una concesión a favor del otro siempre se acepta.</li></ul> | Habilidad y riesgo que se pueden leer, sin trampa |
| 7 | **Modo plano**: dibujar, ver el coste y construir después | **Planos de obra**: en el planificador se pintan los tramos de rojo (necesitan la obra) o azul (ya la tienen). «Añadir al plano» es gratis y deja una línea discontinua; se pueden comparar hasta 3 planos; «Encargar» convierte uno en obra | «Mirar es gratis», ahora en el mapa |
| 8 | **Panel de gestión** desde la izquierda, como mucho el 50 % de la pantalla y con 2 niveles de pestañas | **El cajón** (§10.3): 6 secciones con ≤ 5 pestañas, el mapa siempre visible y que se puede pulsar; solo Trenespop se ensancha al 70 % | Saber siempre dónde están las cosas |
| 9 | **Premio al Aeropuerto del Año** | **Operador Ferroviario del Año**: una clasificación de 10 operadores europeos parodiados cada diciembre (§6.6) | Una meta anual y sátira |

**Lo que no copiamos de Airport CEO:**
- correos que no se pueden quitar;
- interruptores escondidos;
- fallos silenciosos, como un arrastre que vuelve a su sitio sin explicación (aquí cada rechazo dice su causa y su remedio);
- un planificador automático que lo agrupa todo;
- negociaciones que se ganan recargando;
- notas sin consecuencias.

---

## 10. D9 · Interfaz: clara, mínima y con aspecto de juego de verdad

### 10.1 Reglas de estilo y de texto (se comprueban en las pruebas de interfaz)

1. **Un contenedor por panel.** Dentro solo hay filas, columnas alineadas, aire y filetes. Nunca una tarjeta dentro de otra ni una tesela con una lista dentro.
   - Prueba de DOM: ningún elemento con borde o fondo dentro de otro con borde o fondo, salvo los chips.
2. **Presupuesto de texto:**

   | Elemento | Límite |
   |---|---|
   | Título de panel | ≤ 3 palabras |
   | Línea «¿qué es esto?» bajo el título | ≤ 12 palabras, solo la primera vez que se abre |
   | Etiqueta de fila | ≤ 4 palabras |
   | Causas | con la forma «Objeto · valor · efecto» |
   | Escena | el cuerpo grabado, más una línea «Dato» sin voz de ≤ 20 palabras |
   | Opción | etiqueta de ≤ 4 palabras y detalle de ≤ 10 palabras con cifras |
   | «¿Por qué?» | ≤ 5 filas |

   Las explicaciones largas van a la **Guía (?)**.
3. **Los números van grandes y las etiquetas pequeñas.** Siempre con unidad: %, M€, k€/mes, viajeros/mes, semanas.
4. **Colores con un solo significado:**
   - verde: bien;
   - ámbar: ojo;
   - rojo: problema con acción;
   - azul: seleccionado o información;
   - naranja: renegociable;
   - gris: bloqueado o sin datos.
5. **Un solo lenguaje visual.**
   - El mapa es el de `map-v3`, iluminado por el sol real.
   - Los paneles son sólidos y oscuros (sin cristal ni desenfoque), con texto claro, cifras tabulares y un único color de acento.
   - Así se acaba la mezcla de cristal oscuro y pergamino.
6. **Antes → después** en cada acción, con las funciones de presupuesto, y con chips de grupo (+/−).
7. **Sin callejones sin salida.**
   - Lo bloqueado se ve con su candado, su motivo y su remedio: «Se desbloquea en el Hito 3 · faltan 41.000 viajeros/mes · Ver Progreso ›».
   - Cada acción rechazada contesta en el sitio con la causa y un botón de remedio.
8. **Nombres fijos por el tutorial grabado** 🔒: «Qué puede circular», «Competencia», «Investigación» y «Agenda».

### 10.2 Zonas de la pantalla (cada una tiene un trabajo)

| Zona | Siempre muestra | Nunca muestra |
|---|---|---|
| Barra superior | ≡ · **Caja** (y su variación en el mes) · **Apoyo** (encuesta) · **Puntualidad** de la red · **Trenes libres** · **Cuadrillas libres** │ **Avisos (n)** │ fecha · días para las elecciones · ? | Textos largos |
| Columna izquierda («Misión») | El acto o etapa con 2–4 condiciones que son exactamente las del motor; ≤ 3 críticos; los compromisos que vencen pronto; **SIGUIENTE** | Listas e historial |
| Esquina del mapa | **Capas ▾** con la leyenda de la capa o herramienta activa (3–5 colores y una frase) | — |
| Derecha | La **ficha** del objeto pulsado; se ensancha para Servicio u Obra | Páginas generales |
| Barra inferior | Hito ◔ · 1 Red · 2 Flota · 3 Dinero · 4 Despacho · 5 Progreso · 6 Prensa │ teletipo │ ⏸ ▶ ▶▶ ▶▶▶ · «cierre 31 mar» | Píldoras de capas |
| Cajón (por la izquierda, ≤ 50 %) | Una sección cada vez, con ≤ 5 pestañas | Un tercer nivel |

**Regla para el jugador:** «Lo que **haces** está en la ficha; lo que **consultas**, abajo».

### 10.3 Mapa de navegación (dos niveles como máximo)

```
MAPA (pantalla principal; nunca se cierra)
├─ Barra superior ··· ≡ · Caja · Apoyo · Puntualidad · Trenes · Cuadrillas │ Avisos (n) │ fecha · elecciones · ?
├─ Misión ··········· acto o etapa · condiciones · críticos (≤3) · compromisos que vencen · SIGUIENTE
├─ Capas ▾ ·········· Puntualidad · Ocupación · Ancho · Tensión · Velocidad útil · Estado de la vía · Rivales · Territorios
├─ Ficha (derecha) ·· relación · tramo · nodo/ciudad · unidad · obra · persona  ──► Servicio › · Obra › · Comprar ›
├─ Barra inferior ··· Hito ◔ │ 1 Red · 2 Flota · 3 Dinero · 4 Despacho · 5 Progreso · 6 Prensa │ teletipo │ ⏸ ▶ ▶▶ ▶▶▶
│
└─ CAJÓN (nivel 1 = sección, nivel 2 = pestaña)
   1 Red ······· Servicios (monitor, M) · Obras (y Planos) · Competencia🔒 · Territorios · Proyectos
   2 Flota ····· Trenes · Trenespop (70 %, T) · Pedidos · Taller · Personal
   3 Dinero ···· Mes · Previsión · Crédito · Tarifas
   4 Despacho ·· Agenda🔒 (encargos, peticiones, compromisos) · Apoyo · Pactos · Políticas · Conseguidor*
   5 Progreso ·· Acto · Hitos y medallas · Investigación🔒 · Calendario
   6 Prensa ···· Gaceta · Diario · Informes

MODALES (solo cuatro tipos, de uno en uno): Escena con opciones · Informe del mes · Tarjeta de hito · Noche electoral / Fin
GUÍA (?) ···· ayuda del panel abierto + buscador
MENÚ (≡) ···· guardar · exportar · sonido y voces · noticias por categoría · accesibilidad · reglas de la partida
* Con candado hasta el Hito 2 (o si «Sin cloacas»). Nunca se oculta.
```

**De dónde viene cada pantalla de hoy:**

| Hoy | En el modo único |
|---|---|
| Rescate › Finanzas, Clásico › Dirección › balance | Dinero |
| Rescate › Obras, Clásico › Obras | Red › Obras; se empieza desde la ficha del tramo |
| Rescate › Flota, Clásico › Trenes, Trenespop y Mis compras | Flota |
| Rescate › Pactos y Elecciones; Clásico › Despacho y encargos | Despacho |
| Rescate › Progreso, Tecnología y Megaobras; Clásico › Investigación y capítulos | Progreso; Red › Proyectos |
| Rescate › Cloacas | Despacho › Conseguidor |
| Rescate › Gaceta; Clásico › Gaceta y Diario | Prensa |
| Píldoras de capas, leyenda ausente | Capas ▾ con leyenda |
| Aviso «Semana N · ±X» | Informe del mes y Avisos |
| Barra de la jornada del clásico | Barra inferior (velocidad y reloj); el parte va a Prensa › Informes |

### 10.4 Qué abre cada clic en el mapa

| Pulsas | Se abre | Muestra | Acciones |
|---|---|---|---|
| Relación (trazo) | Su ficha | Producto, km, chips de ancho, tensión y velocidad útil; puntualidad, ocupación, viajeros, neto; tira de tramos; **Qué puede circular** 🔒; filas de problema | Servicio › · Obra › · Comprar › · pestañas Resumen · Trenes · Cuentas · Historia |
| Tramo (con zoom) | Ficha del tramo | Ancho, tensión, velocidad, vía, estado, limitación, carga, riesgos, obras | «Planear obra aquí» |
| Ciudad o estación | Ficha de la ciudad | Perfil urbano por horas, nivel de la estación, personal, peticiones, rivales | +/− salidas por destino, Mejorar estación, Personal |
| Unidad (tren) | Ficha de la unidad | Modelo, edad, estado, fiabilidad, punto de beneficio, «Fermín avisó…» | Revisión, Reasignar, Reformar, Vender |
| Marcador de aviso | La ficha del objeto, en esa fila | Causa y arreglo | El arreglo |
| Obra o plano | Obra en marcha o plano | Fase, semanas, pagado/total, modo de servicio | Acelerar, Cancelar / Encargar |
| Retrato (en cualquier sitio) | Ventana de la persona | Cargo de hoy, relación, **lo que recuerda**, sus pactos y promesas | Ver en Agenda |

### 10.5 Avisos

| Tipo | Ejemplos | Dónde | ¿Para el reloj? |
|---|---|---|---|
| Decisión | Escena con opciones, incidencia a ▶, impago, huelga, noche electoral | Ventana centrada; las del mismo día van en una sola pantalla | Sí |
| Crítico (≤ 3) | Un pago en ≤ 2 semanas que la caja prevista no cubre; un esencial por debajo de su objetivo con ≤ 3 semanas de plazo; un compromiso de Gobierno en riesgo; ultimátum; fase judicial ≥ imputación | Columna Misión, con marcador rojo en el objeto | Sí, una vez, con un aviso sonoro |
| Aviso | Vía < 45 %, unidad en taller, ocupación > 95 %, ventana de renegociación, petición nueva, efecto que termina | Bandeja «Avisos», agrupada por objeto y con filtros (Red · Dinero · Gente · Justicia); se borra sola | No |
| Noticia | Gaceta y Trenter (solo hechos, con «Fuente: …») | Teletipo, y se archiva en Prensa | No |
| Informe del mes | Resultado y «Consecuencias» | Pantalla después del cierre, **solo si algo cruzó un umbral**; si no, un enlace en el teletipo | Según el ajuste |

### 10.6 «Siguiente»: el jugador siempre sabe qué hacer

Es una línea con un botón «Ir ›». Elige lo primero que se cumpla de esta lista:
1. una decisión pendiente;
2. un aviso crítico (su arreglo);
3. un paso del tutorial o de la lista sin marcar;
4. el compromiso más atrasado para el tiempo que le queda;
5. la condición del acto o la etapa más atrasada (su mejor acción, sacada de los obstáculos con `action` del rescate);
6. una mejora con un beneficio claro, por ejemplo «Norte: 600 sin plaza → +1 tren (hay 2 S-449 libres)»;
7. «Todo en orden · ▶▶».

### 10.7 Bocetos

Las líneas marcan zonas, no bordes. Las cifras son de ejemplo.

**A. Pantalla principal (escritorio)**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ≡  € 412 M  +3,1/mes   Apoyo 53 %   Punt. 86 %   Trenes 7   Cuadr. 1/3      Avisos 4   14 mar 2023 · elecc. 131 d   ? │
├───────────────────────────────┬───────────────────────────────────────────────────┬──────────────────────┤
│ ACTO I · Volver a conectar    │ Capas: Tensión ▾                                  │ MADRID–SALAMANCA   × │
│ hasta las elecciones · 131 d  │ ■ 25 kV  ■ 3 kV  ■ sin catenaria  ┅ en obra       │ Alvia · 212 km       │
│                               │                                                   │ STD→IB · 25 kV · 250 │
│ Servicios nuevos   3/4  ▰▰▰▱  │                                                   │                      │
│ Peticiones         2/2  ✓     │                                                   │ 91 %   78 %   41 k   │
│ Unidades revisadas 1/2  ▰▰▱▱  │                M A P A                            │ punt.  ocup.  viaj.  │
│ Caja ≥ 150 M€      ✓ hoy      │    (trenes reales a ▶; marcador ! en Torralba)    │                      │
│                               │                                                   │ QUÉ PUEDE CIRCULAR   │
│ ! Promesa a Paco · 2 meses    │                                                   │ ✓ S-120  ✓ S-130     │
│   Catenaria Teruel · Ver ›    │                                                   │ ✓ S-730  ✗ S-112     │
│                               │                                                   │   ancho en Medina    │
│ SIGUIENTE                     │                                                   │                      │
│ Revisar S-100 (estado 41) Ir› │                                                   │ Servicio› Obra› Comprar› │
├───────────────────────────────┴───────────────────────────────────────────────────┴──────────────────────┤
│ ◔ Hito 2 · Vuelve a moverse    1 Red  2 Flota  3 Dinero  4 Despacho·2  5 Progreso  6 Prensa             │
│ Gaceta · «YaIré llena Atocha de rojo»                   ⏸  ▶  ▶▶  ▶▶▶   cierre 31 mar   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**B. Escena (diálogo con opciones).** Es una ventana, una sola caja con filas.

```
┌──────────────────────────────────────────────────────────────────┐
│ [retrato: Paco · enfadado]   Paco Terruño                       │
│                              Alcalde de Villanueva del Andén    │
│ ──────────────────────────────────────────────────────────────── │
│ «Le recuerdo, por si se le había olvidado, que Teruel existe.   │  ← toma grabada (subtítulo sincronizado)
│  Y Soria. Y mi pueblo… ¿Lo pone usted o se lo pido a los        │
│  Reyes Magos?»                                                   │
│                                                                  │
│ Dato · Zaragoza–Teruel–Sagunt: 320 km sin catenaria              │  ← sin voz, ≤ 20 palabras
│ ──────────────────────────────────────────────────────────────── │
│ Prometer catenaria                                               │
│   Obra empezada en 12 meses · Territorio +10 / −15               │
│ Pedírselo a los Reyes Magos                                      │
│   Territorio −2                                                  │
│                                              ↻ Volver a oír     │
└──────────────────────────────────────────────────────────────────┘
```

**C. Ficha de relación: Resumen y Servicio**, ≤ 30 % de ancho, con el mapa visible.

```
┌──────────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐
│ NORTE · Madrid–León (MD)                   × │   │ ‹ NORTE · SERVICIO                         × │
│ Esencial · 421 km · IB · 3 kV                │   │ Modelo     S-449 KAFKA ▾  (solo compatibles) │
│ Vel. útil 105 · limita Ávila–Medina (LTV)    │   │ Unidades   − ▰▰▰▱ +   3 · libres 1          │
│                                              │   │ Salidas    − 6 + al día por sentido          │
│  78 %     44 %      8,1 k      −0,4 M€       │   │ Tarifa     − 19 € +   demanda −6 %           │
│  punt.    vía       viaj/mes   neto/mes      │   │ Capacidad  Ávila–Medina 71 % de su vía      │
│                                              │   │                                              │
│ Mad ━━ Ávila ━━━ Medina ━ Vall ━ Pal ━━━ León│   │               ahora     con el cambio        │
│     72       38!        61    70     55      │   │ Ocupación     97 %      81 %                 │
│                                              │   │ Puntualidad   78 %      77 %                 │
│ ! Vía Ávila–Medina 38 % · −28   Bateo ›      │   │ Viajeros      8,1 k     8,9 k                │
│ ! 2 unidades en taller · −6     Taller ›     │   │ Neto/mes     −0,40     −0,29 M€              │
│ · 600 sin plaza                 +1 tren ›    │   │ Grupos        Viajeros +2 · Hacienda +1      │
│ ◷ Campaña −15 % · 9 sem (de Marisa, ago 22)  │   │                                              │
│ Servicio›   Obra›   Comprar›                 │   │ Solo presupuesto            Aplicar ›        │
│ Resumen · Trenes · Cuentas · Historia        │   └──────────────────────────────────────────────┘
└──────────────────────────────────────────────┘
```

**D. Flota › Trenespop, abierto desde Extremadura.** Es la única excepción al 70 %. El mapa sigue pintando por dónde puede circular cada modelo al pasar por él.

```
┌───────────────────────────────────────────────────────────────────────────┬──────────────────────────┐
│ Flota   Trenes · [Trenespop] · Pedidos · Taller · Personal              × │ MAPA                     │
│ Para EXTREMADURA · IB · sin catenaria 268 km + 25 kV 209 km · máx. 200    │ Extremadura resaltada    │
│ Energía Todas Eléct. Diésel Bimodo   Ancho Todos IB VAR STD   Nuevo Usado │ verde = puede            │
│ ───────────────────────────────────────────────────────────────────────── │ ámbar = con cambiador    │
│                                  plazas  km/h   M€/ud   llega    fiab.    │ gris  = no puede         │
│ ✓ PUEDEN CIRCULAR · 3                                                     │                          │
│   S-599 KAFKA        IB  DIÉSEL   181    160     8,0    22 m     ▰▰▰▰▱    │                          │
│   S-730 Tardo        VAR BIMODO   262  250/180  30,0    30 m     ▰▰▰▰▱    │                          │
│   S-592 usado 1984   IB  DIÉSEL   228    120     0,9    ahora    ▰▰▱▱▱    │                          │
│ ✗ NO PUEDEN · 4                                     [ ] mostrar           │                          │
│   S-449   IB 3 kV   268 km sin catenaria · Ver obra ›                     │                          │
│   S-112   STD 25 kV  Ancho estándar: la vía es ibérica · Ver VAR ›        │                          │
│ ───────────────────────────────────────────────────────────────────────── │                          │
│ S-730 Alvia bimodo · Tardo · nuevo                                        │                          │
│ Ruta Madrid ━ diésel 268 km ━ Plasencia ━ 25 kV 209 km ━ Badajoz          │                          │
│ Vel. útil 160 en diésel · limita Talavera–Plasencia                       │                          │
│ Uno más: +1.900 viaj/mes · +0,14 M€/mes · ocupación 97 → 82 %             │                          │
│ Cantidad − 1 +     Solo presupuesto        Comprar · señal 9,0 M€ ›       │                          │
└───────────────────────────────────────────────────────────────────────────┴──────────────────────────┘
```

**E. Obras y planos.** La ficha se ensancha al 60 % y el mapa pasa solo a la capa de la obra.

```
┌──────────────────────────────────┬─────────────────────────────────────────────────────────────────┐
│ MAPA · capa Tensión (sola)       │ ‹ TERUEL · OBRA                                       Planos 2 ›│
│   Zaragoza                       │ Bateo · Renovar · [Electrificar] · Ancho · Desdoblar · Señales  │
│     ┃ ROJO  (sin catenaria)      │ Tensión  ( ) 3 kV  (•) 25 kV                                    │
│   Teruel                         │ ⚠ Sagunt–València es 3 kV: harán falta trenes bitensión         │
│     ┃ ROJO                       │   Tramo                 km    M€     meses   modo               │
│   Sagunt                         │ ■ Zaragoza–Teruel      182   82,4    30      por fases  ✓       │
│     ┃ AZUL  (3 kV)               │ ■ Teruel–Sagunt        138   64,0    26      por fases  ○       │
│   València                       │                                                                 │
│                                  │ Durante la obra    meses   demanda   extra                      │
│ Leyenda                          │ ● Por fases          45      78 %      —                         │
│ ■ rojo = necesita la obra        │ ○ Autobuses          30      55 %     +1,1 M€ (a Autocares)      │
│ ■ azul = ya la tiene             │                                                                 │
│ ┅ plano guardado                 │ 2 cuadrillas · en servicio dic 2026 · ayuda prevista 11 M€      │
│ Esc cancelar · Intro encargar    │ Caja prevista mínima 96 M€ (sep 2025) ✓                         │
│                                  │                hoy        después                               │
│                                  │ Trenes que pueden  diésel   diésel + bitensión (S-120, S-480)   │
│                                  │ Vel. útil          160      160                                 │
│                                  │ Promesa a Paco     ✓ se cumple al empezar                       │
│                                  │ Añadir al plano      Comparar A·B        Encargar ›             │
└──────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

**F. Despacho › Agenda** (encargos, peticiones y compromisos), ≤ 50 %.

```
┌─────────────────────────────────────────────────────────┬────────────────────────────────┐
│ DESPACHO   [Agenda] · Apoyo · Pactos · Políticas · Conseguidor🔒                      × │ MAPA (se puede pulsar) │
│                                                         │                                │
│ ENCARGOS                                    plazo       │                                │
│ ◐ Mediterráneo (Raquel) · etapa 2/3   ▰▰▰▱  7 meses     │                                │
│   ✓ en servicio  ✓ 6 salidas  ✗ margen 5 % (falta 3)    │                                │
│ COMPROMISOS                                             │                                │
│ ! Catenaria en Teruel (Paco, oct 22)  ▰▱▱▱  2 meses     │                                │
│   empezar obra · si fallas Territorio −15     Planear › │                                │
│ ✓ Madrid–Burgos en servicio (Raquel)   cumplido         │                                │
│ ✗ Refuerzo Alvia (Raquel, sep 22)      roto · −65 M€    │                                │
│ PETICIONES                                              │                                │
│ · Soria · tren antes de las 7:00 · 0,9 M€ tras 3 meses  │                                │
│ · Plantilla · paga extra · +5                     Ver › │                                │
│                                                         │                                │
│ Hemeroteca: 14 de 17 promesas cumplidas (82 %)          │                                │
└─────────────────────────────────────────────────────────┴────────────────────────────────┘
```

**G. Nueva partida**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ NUEVA PARTIDA                                                                         ×  │
│ Situación                                                                                │
│  [2022 · Tenfe real ●]  [2027 · Rescate]  [2027 · Crisis de deuda]  [… 3 más]  [Libre]   │
│   500 M€ · flota 18 años · 63 % electrificado · elecciones jul 2023 · con tutorial       │
│ Semilla     TNF-7K2Q-RX41   ⟳ Aleatoria                                                  │
│   OuiOui en el Levante en 2029 · Paco trae el contrato rural · nevada en 2031            │
│ Tu rasgo    [Tecnócrata: obras −10 %, Plantilla −8] ▾                                     │
│ Dificultad  Fácil · [Normal] · Difícil · Infernal · Personalizar     puntuación ×1,0     │
│ Reglas de maqueta ▸ (cerradas)          Modificadores: ninguno ▾                          │
│                                                            Empezar en enero de 2022 ›   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**H. Informe del mes**, que solo sale si algo cruzó un umbral.

```
┌──────────────────────────────────────────────────────────────┐
│ MARZO 2023                                     neto +3,1 M€   │
│ Viajeros 612 k (+4 %) · Puntualidad 86 % · Satisfacción 61    │
│ CONSECUENCIAS                                                 │
│ ✓ Lanzamiento Burgos terminó · +11 % de viajeros              │
│ ✗ Refuerzo Alvia sin cumplir · se devuelven 65 M€             │
│ ! Fermín avisó del S-100 «Mancha» (ene) · averiado el 12      │
│ RED                                                           │
│ · Obra Torralba–Soria: pruebas en abril                        │
│ · 2 unidades S-106 entregadas                                 │
│ EL MES QUE VIENE                                              │
│ · Pago de la contrata 3,0 M€ · Elecciones en 4 meses          │
│                                       Diario ›     Seguir ▶   │
└──────────────────────────────────────────────────────────────┘
```

**I. Teléfono (390 px)**

```
┌──────────────────────────────┐
│ € 412 M · 53 % · 14 mar  ⋯  │  ← barra superior reducida; se toca para ver el resto
│ Siguiente: Revisar S-100  Ir›│  ← misión plegada en una línea
│                              │
│           M A P A            │  ← rótulos solo de lo seleccionado o crítico
│                              │
│ ┌──────────────────────────┐ │
│ │ NORTE · 78 % · 44 % vía  │ │  ← ficha como hoja inferior (media y entera)
│ │ Servicio› Obra› Comprar› │ │
│ └──────────────────────────┘ │
│ Red Flota Dinero Desp. Prog. Prensa  ▶▶ │
└──────────────────────────────┘
```

- El cajón ocupa la pantalla entera y tiene flecha de volver.
- Una pulsación larga hace lo mismo que pasar el ratón («¿Por qué?» y ayuda).
- Sin desplazamiento horizontal a 390 ni a 320 px, que es la prueba heredada de `rescate-ui-test`.

### 10.8 Teclado

| Tecla | Acción |
|---|---|
| Espacio | Pausa |
| 1 / 2 / 3 | ▶ / ▶▶ / ▶▶▶ |
| F1–F6 o Alt+1–6 | Secciones |
| M | Monitor |
| T | Trenespop filtrado |
| O / S | Obra / Servicio de la ficha |
| C | Capa siguiente |
| A | Avisos |
| N | Siguiente |
| Esc | Volver un nivel |
| ? | Ayuda |
| Mayús + clic | «Solo presupuesto» |

Cada descripción emergente dice su tecla.

---

## 11. D10 · Plan de implementación: ocho fases que se pueden jugar y publicar

**Reglas comunes a todas las fases (R7).** Cada fase termina con este procedimiento:
1. `node tools/build-web.mjs`.
2. Pruebas de Node, pruebas de verdad (§7.14) e interfaz con Playwright sobre la compilación web.
3. Commit en `main`, con el código fuente, el constructor, los recursos y un `release.json` exacto.
4. `node tools/verify-pages.mjs <URL> docs/pages-<ver>-https-proof.json`, conservando los fallos del primer intento.
5. Subir la versión en tres sitios a la vez: `build-web.mjs`, `main-menu.js` y `package.json`. Actualizar el README y `docs/PUBLICACION.md`. Cambiar el `?v=` de los enlaces.

Además:
- **Nunca** se editan `story.js`, `encounters.js`, `induction.js` ni `ARCS` de `tycoon.js`. Su comportamiento lo sustituye `guion.js` por id.
- Cada módulo nuevo se añade a `optionalBefore` de `tools/extract-game-source.mjs`, en orden de dependencias. Sus imports y exports van en una sola línea, sin `export default`.
- Cada `data-action` nueva necesita su receta en `sfx.js`, por la regla de `test.mjs` §11.

### Fase 1 · «Una partida que no miente» · tamaño S (≈ 1.500 líneas, 4–6 días)

**Lo que ve el jugador:**
- En la portada solo hay **«Continuar»** y **«Nueva partida»**. «Nueva partida» ofrece la situación 2022 con las **reglas de maqueta**: caja de 500, 1.500 o 5.000 M€, rivales, sin cese, sin final, historia con fecha y tutorial.
- **El modo libre deja de existir como modo aparte.**
- El Rescate sigue en una tarjeta: «Rescate de Tenfe (versión anterior · se integra en la fase 7)».
- **Encuentros elegidos según el estado:** tema 1 (rivales y descuentos), tema 2 (el lote más gastado), y el Ministerio según la fecha (Raquel hasta noviembre de 2023, Óscar después). Llevan línea «Dato» y efectos reales: un descuento que vuelve solo y una revisión dirigida que sustituye a `fleetcare`.
- **Las decisiones históricas suenan en su día exacto**, con opciones que hacen lo que dicen (§7.6) usando las mecánicas que ya hay:
  - abrir Burgos, Murcia o Asturias de verdad;
  - los 65 M€ de los abonos con condición;
  - la crisis de energía de 2022;
  - el plan de Extremadura (obra o S730);
  - la huelga que cancela circulaciones;
  - los autobuses a 5 €;
  - las promesas de Teruel y de las elecciones.
- **Los sucesos que todavía no se pueden situar** en un tramo (`cable`, `snow`, `heatwave`, `cows`) se quedan en silencio hasta la fase 4. Silencio antes que mentira.
- **Despacho › Compromisos** (versión 1) y un **Diario** con «→ consecuencia».

**Archivos:**
- Nuevos: `proyecto/dist/hechos.js` y `proyecto/dist/guion.js` (contratos, director y compromisos v1).
- Modificados:
  - `engine.js`: `pendingDecision` pasa a usar el director; se corrige `gameDate` en el cambio de mes; guardado v5 con migración desde v4 sin borrar `iberia-ferroviaria-v2`.
  - `tycoon.js`: se quita la permutación (`:158`); `freeGame` pasa a `s.reglas`.
  - `operations.js`: cambio de mes y cancelaciones por huelga.
  - `app.js`, `main-menu.js` (se mantiene el ancla `menu-departures-title`), `sfx.js` y `tools/extract-game-source.mjs`.

**Reutiliza:**
- todo el motor clásico;
- `induction.js` y sus 9 etapas, intactas;
- el contrato de encargos.

**Pruebas:**
- Nuevas:
  - `guion-test.mjs`: contratos del conjunto alcanzable y un `verdad-fuzz` ligero con 6 semillas de 2022 a 2030;
  - prueba de migración v4 → v5.
- Adaptadas:
  - `test.mjs` §11: en lugar de exigir base64 incrustado, que cada id del catálogo tenga una toma en el manifiesto y en `release.json`;
  - `tycoon-test` (libre → reglas; se conserva la integridad de los 315);
  - `rescate-ui-test` (la aserción de `begin` pasa a ser «nueva partida»);
  - `onboarding-ui-test` (título);
  - `voice-text-test` (tabla de §3.8).
- Se mantienen: música, ejecución de voz, presentación y paquete de voces.

**Voces:** 0.

**Publicación:** 4.1.0.

### Fase 2 · «La red real y sus trenes» · tamaño L (≈ 2.500 líneas, 8–12 días)

**Lo que ve el jugador:**
- Capas **Tensión, Ancho, Velocidad útil, Vía y Estado de la vía**, todas con leyenda.
- La **capa de media distancia y regional** (Norte, Levante, Sur, Mediterráneo, Ebro, Galicia, Asturias y Cantabria abiertas; Extremadura, Teruel y Soria sin tren de Tenfe).
- **20 modelos** con foto y marca, y **unidades con nombre**.
- **Trenespop abierto desde una relación** (✓/◐/✗ con el motivo) y la herramienta **«¿Puede pasar?»**.
- Las obras nuevas: bateo, de 3 a 25 kV con elección de tensión, desdoblar, quitar el carril ibérico, gálibo y señalización.
- Plazas de taller.
- Limitaciones de velocidad por el estado de la vía.

**Archivos:**
- Nuevos:
  - `assets/red-real.js`: los datos de `segments.json`, los tramos `pal-leo-c`, `cor-sev-c` y `leo-pol-r` y `-v`, la corrección de `mot` y las etiquetas;
  - `trenes.js`: catálogo, perfil y `compatibilidad()` de `reglas-infraestructura.md` §5;
  - `red-test.mjs`.
- Modificados:
  - `infra.js`: perfil con tensión, falta `'tension'`, velocidad útil, capacidad, estado, obras nuevas y cambiadores `changer || changerName`;
  - `engine.js`: de lotes a unidades con migración, energía por tracción, capacidad, media distancia y nueva relación;
  - `data.js` (correspondencia con `MODEL`), `network.js`, `marketplace.js` (vistas parametrizables y chips de compatibilidad, como en `trenespop-reutilizacion.md` §1), `map-v3.js` (capas y leyenda) y `app.js` (ficha de la relación).

**Reutiliza:**
- `plan`, `faultText`, `tramoWorks` y `pathCoords`;
- `adsOfWeek` del prototipo de Trenespop;
- fotos y marcas.

**Pruebas:**
- `test.mjs` §3: los 129 casos del clásico idénticos, más los casos nuevos:
  - Civia en Galicia ✗ (25 kV);
  - 599 en Extremadura ✓;
  - BCBB en Cantabria ✗ (gálibo);
  - S112 en Sagunt–Castelló ✗ (3 kV).
- `marketplace-test`, `campaign-test` (el robot ya tiene en cuenta la tensión) e `induction-test` (el diagnóstico de Salamanca y el presupuesto de Torralba–Soria se mantienen).
- `guion-test`: el tema 2 por unidad y los encuentros del taller.

**Voces:** 0.

**Publicación:** 4.2.0.

### Fase 3 · «El reloj corre: nueva interfaz» · tamaño L (≈ 3.000 líneas, 10–14 días)

**Lo que ve el jugador:**
- La pantalla de §10: barra superior, Misión con «Siguiente», ficha a la derecha, cajón de 6 × 5, avisos clasificados y **monitor de servicios**.
- **Tiempo continuo** (⏸ ▶ ▶▶ ▶▶▶) con **protocolo**.
- **El parte del día alimenta el mes** y llega el **Informe del mes**.
- Pausa automática, teclado y teléfono.
- El tutorial de 9 etapas se juega entero a ▶.

**Archivos:**
- Nuevos:
  - `ui-shell.js`, `ui-cajon.js` y `ui-fichas.js` (generan HTML y montan los componentes, con un solo despachador por raíz, `data-a`);
  - `calendario.js` (el tic diario y las velocidades);
  - los estilos en `style-v3.css`, o en un CSS nuevo añadido a la lista del constructor.
- Modificados:
  - `app.js`: monta el nuevo armazón y conserva la cadena exacta del aviso de voz;
  - `operations.js`: libro del día, orden de cancelación, protocolo y jubilaciones;
  - `engine.js`: el cierre se hace con el libro;
  - `tycoon-ui.js` e `induction-task-ui.js`: se pintan dentro de las pestañas, y el guía resalta el control real.

**Reutiliza:** `map-v3`, el sol, `city-art`, `faces`, `dialogue-presentation`, `Voices` (las líneas nuevas pasan por `Voices.speak` con el índice `clipId`), `music` (sus contextos `estacion`, `day`, `dusk` y `night`) y `sfx`.

**Pruebas:**
- Nueva `ui-unico-test.mjs` (Playwright):
  - zonas de la pantalla;
  - ≤ 2 niveles;
  - la regla de no anidar contenedores;
  - 390 y 320 px sin desplazamiento horizontal;
  - teclado;
  - el tutorial completo con pausa automática;
  - sin errores de JS;
  - capturas.
- Adaptadas: `operations-calendar-test` (días y años bisiestos).
- Retiradas, con sus archivos conservados: `observer-runtime-test`, `gameplay-ui-test` y `contract-progression-ui-test`. Las sustituye la nueva.

**Voces:** 0.

**Publicación:** 4.3.0.

### Fase 4 · «Imprevistos con causa y promesas que se cumplen» · tamaño M (≈ 1.500 líneas, 6–8 días)

**Lo que ve el jugador:**
- Sucesos situados (§6.5): cable en un tramo, nevada en 3 puertos, limitaciones por calor, desprendimiento, avería en rampa y aire acondicionado.
- El riesgo se ve en la ficha del tramo.
- **Calendario sembrado** a 12 meses.
- **Agenda completa** con los compromisos y la hemeroteca.
- **Memoria** en la ventana de cada personaje.
- Personal por estación (tema 3).
- «Consecuencias» en el informe.

**Archivos:**
- Nuevo: `sucesos.js`.
- Modificados: `guion.js` (los 22 sucesos completos), `hechos.js`, `infra.js` y `engine.js` (cortes de tensión temporales y limitaciones) y la interfaz (fichas y Agenda).

**Pruebas:**
- `sucesos-test.mjs`:
  - cada suceso solo ocurre si su causa es cierta;
  - siempre tiene sitio;
  - es determinista por semilla y día;
  - recargar da el mismo resultado.
- `promesas-test.mjs`: ciclo de vida, castigos aplicados y lo que se ve en la interfaz.

**Voces:** 3 (`ev-averia-rampa`, `ev-desprendimiento`, `ev-aire`), grabadas y empaquetadas. La etiqueta pasa a ser «412/412 + 3/72».

**Publicación:** 4.4.0.

### Fase 5 · «Política: grupos, elecciones, reparto y pactos» · tamaño L (≈ 2.500 líneas, 10–12 días)

**Lo que ve el jugador:**
- **Despacho › Apoyo** con las notas en dos niveles y la categoría ★.
- **Elecciones** de 2023 (las reales) y cada cuatro años, con adelantos y noche electoral.
- **Mitin** con promesas que se pueden comprobar.
- **Reparto por fecha**: Óscar es alcalde hasta 2023 y después ministro; puede haber remodelación.
- **Pactos** por agenda, con renegociación sin trampa.
- **Peticiones** sin truco.
- **Villanueva del Andén**: la parada se puede reabrir; contrato rural de Paco y `paco-inaugura`.
- **Actos** con plazo y consecuencia.
- **Cese**, **impago** con cinco salidas, **quiebra** y **retirada de la concesión** por leves y graves de la OSP.

**Archivos:**
- Nuevo: `politica.js`, que trae del rescate y adapta a la escala real:
  - pactos (`rescate.js:573-689`);
  - grupos y previsión (`:1000-1038`);
  - elección (`:1128-1136`);
  - impago (`:977-994`).
- Modificados: `tycoon.js` (disparadores de encargos y arcos, peticiones), `engine.js` (OSP), `rescate-data.js` (`LINES` +24) y `guion.js`.

**Pruebas:**
- `politica-test.mjs`:
  - fechas y fórmula del voto;
  - reparto por fecha;
  - **los términos que se enseñan son los que se aplican** (también en las versiones baratas);
  - la tirada de la negociación se guarda;
  - condiciones de la remodelación.
- `guion-test`: las ventanas de la ministra y del sucesor.
- Manifiesto de voces y filas con título en el auditorio.

**Voces:** 24.

**Publicación:** 4.5.0.

### Fase 6 · «Obras por fases, Planos y progreso» · tamaño M/L (≈ 2.000 líneas, 8–10 días)

**Lo que ve el jugador:**
- Obras con permisos, obra y pruebas, con **modo de servicio** y **cuadrillas que hacen guardia**.
- **Planos** con fantasma y comparación.
- **Investigación** por niveles: dinero y meses, una a la vez, con **pilotos** (tema 4) y partida de pilotos.
- **12 hitos** con tarjeta y lista de desbloqueos.
- **Megaproyectos** por etapas: 9 líneas de alta velocidad y 6 del rescate, entre ellos el Monumento.
- Medallas y **Operador del Año**.
- Fallo de la app en las semanas punta.

**Archivos:**
- Nuevo: `progreso.js`.
- Modificados: `infra.js` y `engine.js` (fases, modos, cuadrillas y retrasos con causa), `tycoon.js` (la investigación pasa a niveles), la interfaz (planificador) y `guion.js`.

**Pruebas:**
- `obras-test.mjs`: los presupuestos son lo que se aplica; los modos; las cuadrillas; los retrasos solo tienen causa.
- `progreso-test.mjs`: los desbloqueos salen de los datos; no hay forma de «farmear» hitos.
- `campaign-test`: un robot de 2022 a 2051 con acciones legales cierra los actos.

**Voces:** 3.

**Publicación:** 4.6.0.

### Fase 7 · «Rescate 2027 y situaciones» · tamaño M (≈ 1.800 líneas, 8–10 días)

**Lo que ve el jugador:**
- **Rescate 2027** como situación del motor único (`t-1`, `t-2`, etapas, prueba de 13 semanas).
- 4 variantes sembradas de 2027.
- Semilla y código para compartir.
- 8 rasgos y 10 modificadores.
- **Reto semanal**.
- «Libre» con todas las casillas.
- **El modo Rescate antiguo desaparece de la portada.** Su guardado `tenfe-rescate-v1` se convierte a la situación de 2027 cuando se puede; si no, se ofrece exportarlo con un aviso.

**Archivos:**
- Nuevo: `situaciones.js`, con los estados iniciales, rasgos, modificadores y código.
- Modificados: `main-menu.js` y las etiquetas de `tools/build-web.mjs`.
- Se sacan de la lista de compilación `rescate-ui.js`, `rescate-map.js` y `rescate.css`. Se conservan `rescate-data.js` (`LINES` e `IMAGES`) y los recursos.

**Pruebas:**
- `rescate-test` pasa a ser `situacion-rescate-test`: un robot con 6 semillas de 2027 a 2034 sobre el motor único, con las cifras sincronizadas con las voces.
- `rescate-ui-test` se integra en `ui-unico-test`: `t-1`, el parpadeo del trazo del Norte y el final a las 13 semanas.
- Conversión del guardado.
- Determinismo del reto semanal.

**Voces:** 16.

**Publicación:** 4.7.0.

### Fase 8 · «Cloacas, Gaceta y los 310 encuentros» · tamaño M (≈ 1.800 líneas, 8–10 días)

**Lo que ve el jugador:**
- **El Conseguidor**: un tablero de ofertas, secretos con testigos, extorsiones que nombran un secreto que existe, escándalos con la línea correcta y fases judiciales con su aviso.
- **Gaceta y Trenter** que solo cuentan hechos, con su «Fuente».
- Las mecánicas de encuentro que faltan.
- **Afinado** final.
- Auditorio con la columna «Dónde suena».

**Archivos:**
- Nuevos: `cloacas.js` (adaptado de `rescate.js:756-885`) y `gaceta.js`.
- Modificados: `guion.js` y la interfaz.

**Pruebas:**
- `cloacas-test.mjs` y `gaceta-test.mjs` (cada titular apunta a un registro del motor).
- **`verdad-fuzz` completo** (12 + 6 semillas) y el informe de `alcance`.
- `voice-listening-ui-test` adaptado a 412 + N filas.

**Voces:** 26.

**Publicación:** **5.0.0**.

**Suma:** unas 16.000 líneas en 62–82 días de trabajo, **72 voces** y 8 publicaciones. Las fases 1 y 2 ya resuelven las quejas más visibles: el modo único, los diálogos y el realismo.

---

## 12. Riesgos y preguntas abiertas

1. **Rendimiento a ▶▶▶.** Simular cada día con el plan GTFS puede costar demasiado.
   - Mitigación: caché por `infra.ver`, agregar las circulaciones sin pasar minuto a minuto y un presupuesto de ≤ 5 ms por día medido en las pruebas.
   - Alternativa: avanzar en bloques de 7 días a ▶▶▶ con el mismo libro.
2. **Romper la suma del catálogo.** Bastaría un cambio accidental en `story.js`, `encounters.js`, `induction.js` o `ARCS`.
   - Mitigación: no se editan nunca (`guion.js` los sustituye), la prueba `sin-copias` y `extract-game-source` en cada fase.
3. **Predicados equivocados.** 108 predicados de encuentros y 47 contratos dan muchas ocasiones de hacer sonar una frase falsa.
   - Mitigación: revalidar antes de mostrar, `verdad-fuzz`, el silencio como valor por defecto y la puerta `mecanicas` por fase.
4. **Equilibrio.** La escala real, la capa de media distancia, los riesgos y 29 años de partida son mucho que afinar.
   - Mitigación: un robot por fase y la telemetría del informe `alcance`.
   - Además, el primer encargo y los actos se miden **relativos al inicio**.
5. **Migrar las partidas guardadas.** De lotes a unidades, con tramos nuevos, se puede perder información.
   - Mitigación: clave nueva, la antigua nunca se borra, migración pura con prueba y opción de exportar.
6. **Producir las voces.**
   - El entorno de Qwen y los pesos están fuera de Git.
   - `--package` descarta las tomas cuyo texto, persona o ánimo cambian, así que **hay que congelar los textos por fase antes de grabar**.
   - Las etiquetas de publicación tienen que decir el recuento real: «412/412 + N/72».
7. **Herramientas de publicación.** Habrá que tocar la lista de `extract-game-source`, la de CSS, los «412» de las etiquetas y la clase `Rescate de Tenfe` del auditorio, siempre con metadatos exactos (AGENTS).
8. **Nombres de la interfaz que fija el tutorial** 🔒 («Qué puede circular», «Competencia», «Investigación», «Agenda»). Un rediseño que los cambie haría mentir 4 tomas.
9. **La remodelación** pide 2 líneas de Raquel para los actos III y IV. Si no se graban a tiempo, la remodelación se desactiva antes de 2035: no se quita la voz, se quita la mecánica.
10. **Las ventanas históricas** (Burgos, Murcia, Pajares…) pueden chocar con otra escena el mismo día. Se juntan en una pantalla. Si la ventana caduca, ese cuerpo no suena en esa partida, que es mejor que sonar tarde.
11. **Dos modos conviven hasta la fase 7** (el Rescate antiguo). Hay que comunicarlo en la tarjeta y mantener sus pruebas en verde mientras tanto.
12. **Petición reciente del usuario («sube lo que tengas a GitHub en cuanto puedas»).**
    - Este diseño vive en el *scratchpad*.
    - Al orquestador le toca hacer commit cuanto antes de la investigación de `investigacion/modo-unico/` y del diseño elegido, y publicar la fase 1 en cuanto pase las pruebas.
    - Como subagente de solo lectura, yo no he hecho ningún push.

**Preguntas para los jueces:**
- ¿La prueba de 13 semanas del Rescate termina la partida (es lo literal de `t-1`) o la deja intervenida? Este diseño elige lo literal, con «Reintentar».
- ¿Hace falta la remodelación (para dar más alcance a Raquel y más variedad) o basta el reparto histórico fijo?
- ¿El ★ se queda como categoría de 1 a 5, o se muestra como letra de la A a la E para no recordar a la moneda del rescate?
