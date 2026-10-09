# Iberia Ferroviaria · «Tenfe»: especificación final del modo único

**Versión del documento:** 1.1 · 9 de octubre de 2026. La revisión 1.1 corrige los 15 huecos que encontró la revisión crítica (anexo C).
**Estado:** especificación para implementar. Sustituye a los tres diseños previos (A «simulación», B «Tropico y Cities», C «narrativa»).
**Base:** el diseño C, que ganó en las tres valoraciones (181 puntos frente a 164 y 161). Sobre él se injertan las mejores ideas de A y de B y se corrigen todos los puntos obligatorios de los jueces. El anexo A comprueba cada punto obligatorio y el anexo B dice de dónde viene cada idea.
**Fuentes:** los inventarios, las restricciones, las tres auditorías y sus JSON, `datos/segments.json`, `datos/trains.json`, las reglas de infraestructura, la reutilización de Trenespop, las cinco investigaciones de juegos y la síntesis. Además se han comprobado en `proyecto/dist` los textos reales de `story.js`, `induction.js`, `encounters.js`, `tycoon.js` (`ARCS`, `GROUPS`, `POLICIES`, `TECHS`) y `rescate-data.js` (`LINES`, `PACTS`), y las funciones de `engine.js`, `operations.js` y `tools/extract-game-source.mjs` que se citan. El repositorio no se ha tocado.

**Convenciones:**
- 🔒 marca una cifra, un nombre o una fecha que dice una voz grabada. Es una constante del motor; una prueba la compara con la voz, y ningún rasgo, modificador ni dificultad puede cambiarla.
- «Toma» es una grabación entera. Las 412 clásicas están congeladas byte a byte. Las nuevas se graban con `build_rescate_voices.py`.
- **F1…F9** son las fases del plan (§14). Cuando una regla dice «(F6)», esa regla llega en la fase 6; antes, lo que dependa de ella está en silencio.
- Las cifras sin 🔒 son el punto de partida del equilibrado. Las afina el robot de cada fase.
- Los identificadores técnicos van en inglés o en el español del código, tal como existen en el repositorio.

---

## 0. Qué cambia para el jugador

- **Un solo juego.** La portada tiene «Continuar» y «Nueva partida». Ya no hay campaña, modo libre y Rescate por separado.
- **Nueva partida en una pantalla.** Eliges la situación (*2022 · Tenfe real*, con el tutorial hablado, o *2027 · Rescate* y sus variantes), una semilla con un código para compartir, tu rasgo como presidente de Tenfe, la dificultad y, si quieres, las **reglas de maqueta** (caja grande, sin rivales, sin final…). Las reglas de maqueta son el antiguo modo libre.
- **Lo que se dice, pasa.** Un personaje solo habla cuando lo que dice es cierto en tu partida. Lo que eliges se ve en el mapa, en la ficha del tren o en el informe del mes, y las promesas quedan apuntadas en la Agenda. Si no hay nada cierto que decir, nadie habla.
- **La red es la real.** Cada tramo tiene su ancho, su catenaria (3 kV, 25 kV o ninguna), su velocidad, su vía única o doble y su estado. Un AVE de 25 kV no entra en una vía de 3 kV, un tren eléctrico no cruza Extremadura sin catenaria y una vía única se llena.
- **Trenespop sigue ahí.** Lo abres desde una línea y te separa los trenes que pueden circular, los que pueden con cambiador y los que no, con el motivo.
- **Gobiernas a gente, no solo vías.** Marisa, Paco, Fermín, Charo y Pedro (con su ministro) te piden cosas, te dan ultimátums y deciden en las elecciones si sigues en el cargo.
- **El tiempo corre como en Cities.** Pausa y tres velocidades: cada día salen los trenes del horario real, cada mes llega el balance y cada cuatro años hay elecciones.
- **Menús nuevos.** Seis secciones con cinco pestañas como mucho. Lo que pulsas abre su ficha a la derecha, y una línea, «Siguiente», te dice qué toca hacer.
- **Cada partida es distinta.** Semilla, situación, rasgo, modificadores, la obsesión secreta de cada líder, rivales, clima y ministro cambian lo que te encuentras. Y puedes seguir sin fin.
- **El Rescate 4.0 descansa un poco.** En la 4.1 sale de la portada, porque sus diálogos todavía no siguen la regla de «lo que se dice, pasa». Tu partida guardada no se borra: en ≡ › Partidas anteriores puedes exportarla, y en la 4.5 vuelve convertida en la situación *2027 · Rescate* del juego único.

**En qué orden llega** (cada paso se publica en cuanto pasa las pruebas):

| Versión | Lo que notarás |
|---|---|
| 4.1 | Una sola «Nueva partida» con semilla y reglas de maqueta. Ningún diálogo sale al azar. Informe del mes. El Rescate 4.0 se guarda hasta la 4.5 |
| 4.2 | Los diálogos dicen la verdad y sus opciones hacen lo que dicen. Promesas en la Agenda. Encuentros elegidos por lo que pasa |
| 4.3 | Catenaria de 3 o 25 kV, anchos, velocidades y estado de la vía reales. Veinte trenes reales en Trenespop, filtrados por la línea. Rasgos, dificultad y modificadores |
| 4.4 | Pantalla nueva: barra de estado, Misión con «Siguiente», ficha a la derecha, seis secciones, monitor de servicios, herramienta de líneas |
| 4.5 | Media Distancia (diésel, 3 kV, vía única). Elecciones de verdad. El Rescate de 2027 pasa a ser una situación del mismo juego |
| 4.6 | El reloj corre por días, con protocolo de incidencias. Cada tren tiene nombre, el taller tiene plazas |
| 4.7 | Facciones con líder y obsesión, ultimátums, pactos, Estatuto, políticas, Consejo de Ministros y mitin. Veredicto final y prórroga sin fin |
| 4.8 | Obras por fases con modos de servicio y cuadrillas, surcos en la vía, sucesos situados en su tramo, hitos con desbloqueos |
| 5.0 | Investigación con pilotos, megaproyectos, convenios con las comunidades, cloacas, Operador del Año, retos, medallas y Retos de legado |

---

## 1. Las decisiones en una tabla

| | Decisión | Por qué, en una línea |
|---|---|---|
| D1 | Empieza el **lunes 3-1-2022**. Hasta F5 el motor sigue siendo mensual con la jornada jugable; **desde F6 el reloj avanza por días** (⏸ ▶ ▶▶ ▶▶▶ ⏭), el director narrativo mira **cada lunes** y cada mes tiene su **cierre**. Elecciones reales el **23-7-2023** (adelantadas el 29-5-2023) y luego cada cuatro años desde la última votación, con **adelantos** posibles desde 2025; los plazos de los actos y el veredicto son **noches electorales**, no años fijos (§3.6). Óscar entra en Transportes el 21-11-2023. Veredicto al cerrar el «último gran mandato» (julio de 2051 si no hay adelantos) y después prórroga sin fin. *2027 · Rescate* es una situación con su propio calendario, sin adelantos hasta 2034 | Así siguen siendo ciertas las 50 tomas del tutorial («Enero de 2022», «Cada jornada avanza un día. Al cerrar el mes…») y las nueve decisiones históricas en su día exacto |
| D2 | **Escala real en M€ del clásico.** Se conserva el logit de demanda, y ahora la satisfacción y los viajeros de pie la mueven. La energía depende de la tracción en cada tramo, hay canon de Adif por tipo de tramo y OSP por tren-km con penalización de los esenciales. El préstamo automático desaparece: en su lugar hay un **impago con cinco salidas** | Las voces citan 4 M€, 0,3 M€, 18.000 €, 9.000 €, 10 M€ y 35 M€; la escala del rescate no tiene ninguna voz grabada que defender |
| D3 | **Red real por tramos.** Cada tramo tiene ancho, tensión, velocidad, vía, **estado** (con limitaciones temporales de velocidad, LTV) y **capacidad en surcos**. Hay 19 obras con fases, modos de servicio y cuadrillas, y Planos. Las líneas las traza el jugador sobre los tramos, como en Cities | Es lo que pide R3. El «Sin surcos libres en Encina–Xàtiva» de Airport CEO hace que la capacidad se entienda |
| D4 | **20 modelos reales con marca paródica**, sacados de `trains.json`, y una sola regla de compatibilidad: ancho × energía × gálibo. Trenespop se abre desde una línea y agrupa en ✓ / ◐ / ✗ con el motivo. La **Media Distancia** llega como contrato OSP después del tutorial | Diésel, 3 kV, bitensión, bimodo, ancho variable y AVE de 25 kV se distinguen en la compra y en el mapa, y las tomas del tutorial siguen siendo ciertas |
| D5 | Semilla con código, seis situaciones, 8 rasgos, dificultad, 10 modificadores, reglas de maqueta, **líderes con obsesión secreta**, peticiones dobles, ultimátums con castigo propio, sucesos con causa y sitio, 12 hitos con paquetes a elegir, reto semanal y prórroga | Como en Tropico y Cities: cada partida es distinta por lo que pasa en ella, no por tirar dados |
| D6 | **Motor de verdad.** Hechos → un contrato por cada cuerpo grabado → director con ventanas, puertas `mecanicas` y revalidación → efectos con etiqueta y cuenta atrás → compromisos → memoria de cada personaje. Se retiran 5 encuentros y `paco-estacion`. **82 líneas nuevas** | R2: si un diálogo dice algo, pasa. Si no hay nada cierto que decir, no suena nada |
| D7 | Se queda casi todo lo bueno de los tres modos. Se van las tres órdenes por semana, «Delegar mes», la permutación de encuentros, la tirada del 32 %, los dados del 22 % y del 28 %, el préstamo automático, la ★ como moneda, las cajas dentro de cajas y la interfaz de cristal oscuro del rescate | Cada cosa que se va contradice una voz, un requisito del usuario o la claridad |
| D8 | **15 préstamos de Airport CEO**: convenios con peticiones y estrellas, surcos como *stands*, monitor de servicios, triaje de avisos, incidencias con nota y multa cuadrada, protocolo, renegociación sin recargar, Planos, cajón de dos niveles, Operador del Año y otros. Además, Tropico, Cities y juegos de trenes | R6 |
| D9 | **Seis secciones**: Red, Flota, Dinero, Despacho, Progreso y Prensa, con 5 pestañas como máximo. Ficha a la derecha; Misión y «Siguiente», a la izquierda; avisos en tres niveles. Nunca más de 2 niveles, y una prueba del DOM prohíbe las cajas anidadas | R5. El tutorial grabado nombra «Qué puede circular», «Competencia», «Investigación» y «Agenda», así que esos nombres se quedan |
| D10 | **Un paso 0 y nueve fases publicables**, de unas 2.500 líneas como mucho. La 1 es pequeña: una sola «Nueva partida» con semilla y reglas de maqueta, y ningún diálogo al azar. El motor viejo del Rescate sale de la portada en F1 (su guardado se conserva) y el Rescate 2027 vuelve dentro del motor único en F5 | R7: «sube los updates al GitHub en cuanto tengas algo». R1 y R2: ninguna versión publicada lleva dos juegos ni un diálogo falso |

**Pitch para el jugador:**
> Lunes 3 de enero de 2022. Te sientan en la presidencia de Tenfe con media flota parada, dos anchos de vía que no se hablan y nueve personajes que quieren cosas distintas. Diriges la red real: catenaria de 3 o de 25 kV, vía única o doble, Alvias que cambian de ancho y regionales diésel que nadie quiere jubilar. En Trenespop compras los trenes que de verdad pueden circular por ella. El reloj no se para: cada día salen los trenes reales, cada mes llega el balance y cada cuatro años hay elecciones que ganas o pierdes según lo que hayas hecho. Todo lo que te dicen pasa. Si le prometes catenaria a Teruel, queda apuntado, y Paco vuelve si no cumples.

---

## 2. Principios

### 2.1 Cinco reglas de verdad (de C)

1. **Lo que se oye es cierto.** Cada cuerpo grabado tiene un contrato con tres partes: qué tiene que ser verdad para que suene, qué afirma y qué hace cada opción. Antes de mostrarlo se vuelve a comprobar, y también al cargar una partida.
2. **El silencio vale más que una mentira.** Si nada es cierto, no suena nada. Si una mecánica todavía no existe en la versión publicada, las voces que dependen de ella callan hasta que llegue (puerta `mecanicas`).
3. **Las etiquetas son acciones.** «Reducir la oferta» quita salidas; «Prometer catenaria» crea un compromiso con fecha; «Bajar tarifas» baja las tarifas. Cada efecto deja una marca visible en su objeto, con cuenta atrás. Ninguna opción se queda sin efecto observable o sin compromiso rastreado.
4. **Los números de las voces son constantes del motor** (🔒, §4.8). Las cifras que cambian van en una línea escrita sin voz, la línea «Dato».
5. **El azar solo vive en dos sitios:**
   - **la semilla de la partida;**
   - **los riesgos con causa visible**, como el robo de cable en un tramo de 3 kV sin vigilancia o la avería de una unidad vieja.

   Cada tirada se siembra con `(semilla, día, dominio, clave)`, así que recargar no cambia nada. Las apuestas y las negociaciones guardan su tirada en el estado al abrirse la escena.

### 2.2 Tres reglas de diversión

1. **Siempre hay algo que mirar y algo que decidir.** Cada día hay trenes e incidencias, cada lunes una escena posible, cada mes un balance, cada trimestre un Consejo de Ministros y cada cuatro años unas elecciones.
2. **Las causas se ven.** Cualquier número abre un «¿Por qué?» con un máximo de 5 causas y un botón «Ir ›». Lo calcula la misma función que dio el número.
3. **Las partidas divergen.** La semilla, la situación, el rasgo, quién ocupa el Ministerio, la obsesión de cada líder y quién se enfada contigo cambian la red que acabas construyendo.

### 2.3 Escasez real, no cupos

No hay órdenes ni firmas por turno: ninguna voz grabada las defiende y el reloj continuo no encaja con un cupo. Lo que limita al jugador está siempre a la vista:
- caja y crédito;
- unidades libres **y compatibles**;
- maquinistas (veinte cuestan 0,3 M€ 🔒 y se forman en 3 meses 🔒);
- cuadrillas (frentes de obra);
- plazas de taller;
- surcos libres en cada tramo;
- una sola investigación en curso 🔒;
- Favores ◆ (capital político, §7.8.9).

Cuando algo no se puede hacer, el control lo dice en su sitio y ofrece el remedio: «No hay cuadrilla libre · Contratar contrata ›».

### 2.4 Un símbolo, un significado

| Símbolo | Significa solo… |
|---|---|
| ★ (1–5) | La **clase de un convenio** con una comunidad autónoma. Sale de la satisfacción media de 8 semanas de sus viajeros (§10, préstamo 1) |
| ◆ | **Favores**: el capital político con el Gobierno. Se gana y se gasta (§7.8.9) |
| A–F | La **nota de una incidencia** al cerrarse (§10, préstamo 5) |
| 🔒 | Solo en este documento: constante que dice una voz grabada |
| Colores | Verde, bien · ámbar, ojo · rojo, problema con acción · azul, seleccionado o información · naranja, renegociable · gris, bloqueado o sin datos |

---

## 3. D1 · Calendario, tiempo y turno

### 3.1 Por qué 2022, y por qué también 2027

**2022 es la situación por defecto** porque es la única en la que el material grabado es cierto tal cual:
- Las **50 tomas del tutorial** (36 de inducción y 14 de respuesta) dicen «Enero de 2022», presentan a Óscar como «hoy alcalde consultado» y describen el bucle «jornada → parte → cierre de mes».
- Las **nueve decisiones históricas** (burgos, discounts, Rossa, murcia, gauge, pajares, extremadura, s106 y futuretender) tienen fecha real entre 2022 y 2026.
- El **reparto real**: Raquel es ministra hasta noviembre de 2023 y Óscar desde entonces. `decision:pajares` está grabada con la voz del sucesor y ocurre el 29-11-2023, ocho días después de su toma de posesión real.

**2027 · Rescate** es una situación de «¿Y si…?» con su propio calendario y reparto (§3.8). Es el único sitio donde son ciertas las dos tomas grabadas del rescate, `t-1` y `t-2`.

### 3.2 El reloj

**Cuándo llega.** El reloj por días llega en **F6**. De F1 a F5 el motor sigue siendo el mensual del clásico, con la jornada jugable de `operations.js` y el botón «Cerrar el mes»; el director narrativo evalúa entonces sus momentos al cerrar cada mes y en cada jornada que se juega (§8.4). Todo lo que sigue describe el reloj de F6.

La unidad del motor es el **día**. El jugador elige la velocidad, como en Cities, Tropico o Airport CEO.

| Control | Qué se ve | Ritmo orientativo |
|---|---|---|
| ⏸ Pausa | Todo parado. Mirar, comparar y presupuestar es gratis | — |
| ▶ Jornada | Los trenes del horario real (GTFS) se mueven minuto a minuto. Las incidencias salen en el mapa con su plazo para responder | 60 min de juego por segundo: una jornada (06:00–24:00) en unos 18 s |
| ▶▶ Rápido | Los trenes son puntos sobre sus líneas. Las incidencias las resuelve el **protocolo** (§3.3) | 1 día ≈ 1,5 s |
| ▶▶▶ Muy rápido | Sin trenes animados; el mapa enseña la ocupación | 1 día ≈ 0,4 s (un mes en unos 12 s) |
| ⏭ Hasta el próximo aviso | Corre a ▶▶▶ hasta el primer motivo de parada (§3.4) | — |

**Latidos.** El motor y las voces comparten estos cinco:

| Latido | Qué pasa | Voz que lo hace cierto |
|---|---|---|
| **Cada día, 06:00** | <ul><li>Se aplican las aperturas históricas en su día exacto: Burgos el 21-7-2022 (`infra.js:15-21`, `HISTORY`).</li><li>Se monta el plan de servicio del día desde la caché.</li><li>Se resuelven los riesgos situados en tramos (§7.9).</li><li>El director comprueba las escenas fechadas.</li></ul> | «Cada jornada avanza un día» 🔒 |
| **Durante el día** | Incidencias de la jornada (averías, señales, picos de demanda), cada una con un plazo para responder | `induction:incident:*` |
| **Cada día, 24:00** | El **parte del día** pasa al libro del mes: viajeros, ingresos, retrasos, cancelaciones y devoluciones | `induction:review:briefing:0` |
| **Lunes, 07:00** | <ul><li>El director elige como mucho una escena (encuentro, pacto o petición).</li><li>Deriva semanal de los grupos (7 % hacia su objetivo).</li><li>Rivales y autobús.</li><li>Anuncios de segunda mano de Trenespop.</li><li>Comprobación de compromisos y etapas.</li></ul> | Las ventanas de la auditoría de encuentros, en semanas |
| **Cierre de mes** | <ul><li>Balance a partir del libro de los días; desgaste de flota y vía.</li><li>Entregas, fases de obra, formación e investigación que hayan vencido.</li><li>OSP y sus penalizaciones; rachas de encargos y convenios; crédito.</li><li>Portada de la Gaceta, comprobación de hitos e **Informe del mes**.</li></ul> | «Al cerrar el mes llegan el balance, las entregas, las obras, la formación y la investigación que hayan vencido» 🔒 |

Además hay **cierres trimestrales** (Consejo de Ministros, §7.8.6), **anuales** (actualización de tarifas por IPC en enero; Operador del Año en diciembre) y la **noche electoral** (§7.8.8).

**Determinismo.** Las incidencias de cada día se generan al empezarlo con `rng(semilla, día, 'incidencias')`: día, hora, tramo o unidad y causa (idea de B). ▶ y ▶▶▶ consumen las mismas tiradas, así que avanzar rápido nunca cambia lo que pasa.

### 3.3 Que mirar la jornada no sea un impuesto

En el clásico, delegar el mes siempre salía mejor que jugarlo. Se corrige así:

- **«Delegar mes» y «Hasta el último tren» desaparecen** (F6). Los sustituyen las velocidades.
- **Protocolo de incidencias** (Airport CEO). Es un conjunto de reglas permanentes por tipo de incidencia, con un tope de gasto diario. Por ejemplo:
  - avería con más de 20 min de retraso → equipo;
  - fallo de señal → esperar;
  - pico de demanda → refuerzo si hay una unidad libre compatible.

  Sus valores iniciales salen de la respuesta del tutorial sobre el mandato, que deja de ser una pregunta sin efecto:
  - «cobertura» → autobús;
  - «caja» → esperar;
  - «ambas» → equipo si el retraso pasa de 20 min.
- **El parte del día alimenta el mes:**
  - la puntualidad mensual de cada relación es la fiabilidad analítica menos los minutos de retraso no atendidos de sus días;
  - los ingresos descuentan las circulaciones canceladas (huelga, falta de maquinistas, cortes) y las devoluciones;
  - los picos atendidos cobran su bonificación.
- **Jugar a ▶ compensa, pero no es obligatorio.** A ▶ puedes cambiar la respuesta del protocolo en cada incidencia y cazar picos que el protocolo no ve. Si respondes lo mismo que el protocolo, el mes sale idéntico.
  - Lo garantiza `jornada-test` (de A): misma semilla, ▶ con el protocolo y ▶▶▶ → libro del mes idéntico, y la suma de los partes es igual al mes.
- **Incidencias con plazo y nota** (Airport CEO):
  - A ▶, cada incidencia da X minutos de juego para responder; si no respondes, se aplica el protocolo.
  - Al cerrarse recibe una **nota de la A a la F** según los minutos evitados y el coste.
  - Si hay multa (inspección de la AESF tras una incidencia grave), su importe es **exactamente** la línea del libro de caja, con un enlace.

### 3.4 Pausa automática

Se configura en ≡ › Ajustes. En el tutorial vienen todas activadas.

| Motivo | Por defecto |
|---|---|
| Una escena con opciones (decisión, encuentro, pacto, petición) | sí |
| Un aviso crítico (§11.5) | sí |
| Fin de la jornada a ▶ (hace cierto «Termina la jornada… y pasa al día siguiente» 🔒) | sí |
| Cierre de mes, solo si el Informe del mes trae algo | sí |
| Una entrega, una obra terminada o un hito | no |
| Elecciones a 4 semanas o menos | sí |
| La caja prevista no cubre los pagos de las próximas 4 semanas | sí |
| Un compromiso vence en 2 semanas o menos | sí |

⏭ se para en cualquiera de ellos, aunque esté desactivado como pausa.

### 3.5 Rendimiento

- El plan del día se guarda en caché con la clave `(red.ver, servicios.ver, tipoDeDía)`. Los tipos de día son laborable, sábado, domingo o festivo, y víspera.
- A ▶▶ y ▶▶▶ no se simula minuto a minuto: se agregan circulaciones, retrasos y cancelaciones por relación.
- **Presupuesto:** mediana ≤ 5 ms por día simulado y p95 ≤ 15 ms en el entorno de pruebas. Lo mide `jornada-test`.
- **Alternativa** si se supera: ▶▶▶ avanza en bloques de 7 días con el mismo libro. Como las tiradas son por día, el resultado es idéntico, y la misma prueba lo comprueba.

### 3.6 Calendario de la situación 2022

| Fecha | Qué pasa | Voces que lo hacen cierto |
|---|---|---|
| Lun 3-1-2022 | Empieza la partida: `decision:inaugural` y después el tutorial de 9 etapas | `inaugural`, tutorial (50) |
| Al terminar el tutorial | Raquel ofrece el **contrato OSP de Media Distancia** (§6.6) | `osp-oferta-m` (nueva) |
| 1-3-2022 | Crisis de energía real | `decision:energy` |
| 1-6-2022 | Se abre la ventana de fondos europeos NextGenerationEU | `event:eufunds` |
| Julio de 2022 | Ola de calor real en los tramos con etiqueta «calor» | `event:heatwave` |
| 21-7-2022 | LAV Venta de Baños–Burgos con cambiador. Ventana hasta el 15-9 | `decision:burgos` |
| 1-9-2022 | Descuentos estatales: +15 % de demanda en Alvia y Media Distancia durante 16 meses, **pase lo que pase** | `decision:discounts` |
| 6-10-2022 | OuiOui entra en Madrid–València | — |
| 1-11-2022 | Aviso de YaIré; entra en Madrid–Barcelona el 25-11-2022 y en València el 16-12-2022 | `decision:Rossa` |
| 20-12-2022 | LAV de Murcia | `decision:murcia` |
| Febrero de 2023 | Noticia de trenes ajenos que no caben en los túneles del norte | `decision:gauge` |
| Primavera de 2023 | YaIré entra en Andalucía (fecha real que se confirma al implementar) | — |
| 29-5-2023 | Pedro adelanta las elecciones (histórico) | `event:election` |
| 17-6-2023 | Óscar deja la alcaldía. Su placa pasa a «Exalcalde de Pucela» y no habla | — |
| 23-7-2023 | **Elecciones generales** | `el-forecast` (6 meses antes), `el-win`, `el-win-2`, `el-lose` |
| 21-11-2023 | Nuevo Gobierno: **Óscar del Puente** pasa a Transportes y Raquel sale | — |
| 29-11-2023 | Variante de Pajares (ancho mixto, 25 kV) con cambiador en Pola de Lena | `decision:pajares` |
| 14-12-2023 | Catenaria de 25 kV de Plasencia a Badajoz | `decision:extremadura` |
| Enero de 2024 | Presupuestos prorrogados (histórico) | `event:freeze` |
| 21-5-2024 | El S106 entra en servicio; las 30 unidades llegan durante 18 meses 🔒 | `decision:s106` |
| 1-3-2026 | Licitación de la nueva generación | `decision:futuretender` |
| Cuatro años después de la última votación (julio de 2027 si no hay adelanto) | Elecciones ordinarias; si ganas, eliges ministro (§3.7) | `elige-ministro`, `arc:4` |
| Desde 2025 | **Adelanto** posible con las reglas del ciclo electoral (abajo). Se anuncia 8 semanas antes | `event:election` (con voz solo si han pasado 10 años desde la última vez que sonó; si no, tarjeta escrita, §8.4) |
| Primer verano desde 2030 con 45 °C en Córdoba | Crisis climática | `decision:climate` («Cuarenta y cinco grados» 🔒) |
| Entre 2038 y 2044 (sembrado) | Cola de fábrica de +18 meses para todos 🔒 | `decision:industry` |
| Tras ganar las primeras elecciones de 2047 o después | «El último gran mandato», con 4 años por delante 🔒. En ese mandato no hay adelanto | `decision:legacyvote` |
| La noche electoral que cierra ese mandato (julio de 2051 si nunca hubo adelanto; entre 2050 y 2054 si lo hubo) | **Veredicto del plan** | `veredicto-bien` / `veredicto-mal` |
| Después | **Prórroga sin fin**: elecciones, encuentros, rivales, Retos de legado | `prorroga` |

**Ciclo electoral** (situación 2022; F5). El motor guarda `elecciones.ultima` (fecha de la última votación) y calcula `elecciones.proxima`:
1. **Ordinarias:** la próxima es `ultima + 4 años`, el mismo mes. La primera es la histórica del 23-7-2023; si no hay adelantos, las siguientes caen en julio de 2027, 2031, 2035, 2039, 2043, 2047 y 2051.
2. **Adelanto.** Pedro lo convoca el primer lunes en que se cumplen a la vez:
   - es 2025 o después;
   - la encuesta está en 52 % o más;
   - han pasado 30 meses o más desde `ultima`;
   - no ha habido otro adelanto en los 8 años anteriores;
   - no es el «último gran mandato» (después de `decision:legacyvote`), porque su voz promete cuatro años 🔒.

   Se vota 8 semanas después y desde ahí corre un ciclo nuevo de 4 años. El adelanto sale en Progreso › Calendario desde el día en que se convoca y es un hecho del motor, no una tirada.
3. **Los plazos se miden en noches electorales**, nunca en años fijos. Cada acto se juzga en una noche electoral concreta (§7.11.1). Si un adelanto la acerca, Misión y la ficha del acto lo dicen desde la convocatoria («Se juzga en las elecciones del 12-3-2030, adelantadas»).
4. **Veredicto:** es la noche electoral que cierra el mandato de `legacyvote`. Sus voces no dicen años (§8.12), así que son ciertas caiga cuando caiga.
5. **Hasta F7**, sin veredicto con voz, la situación 2022 acaba como el clásico: al cerrar diciembre de 2050, con `ending: '2050'` y sin voz. Por eso `decision:legacyvote` («Quedan cuatro años») también espera a F7. **De F1 a F4** no hay elecciones; los plazos de los actos II a V son las fechas por defecto: julio de 2027, julio de 2035, julio de 2043 y diciembre de 2050.

**Qué fila depende de qué fase.** Las aperturas históricas, los rivales y las decisiones fechadas funcionan desde F1, salvo `discounts` (F2, con los viajeros de pie) y `gauge` (F3, con el gálibo); sus hechos ocurren igual, sin voz. Las elecciones, el adelanto y el contrato de Media Distancia llegan en F5; la elección de ministro, en F7; la ola de calor y la crisis climática, en F8 (sucesos con sitio). Hasta su fase, esas filas no suenan: por ejemplo, de F1 a F4 no hay elecciones en 2023 y `event:election` calla, pero el cambio de ministro del 21-11-2023 sí ocurre, porque es un hecho del calendario.

**Reglas de fin:**
- **Perder unas elecciones termina la partida**: «El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú». En Fácil la oposición resta 0 puntos. La regla de maqueta «Perder no termina» desactiva las medallas.
- **Cese:** si la confianza del Gobierno está por debajo de 15 durante 6 cierres seguidos, Pedro te cesa (voz `cesado`, F5; hasta entonces el cese del clásico sale sin voz). La primera vez que baja de 20 en la legislatura llega `gobierno-aviso` (F5), así que el «Te avisé» de `cesado` siempre es cierto.
- **Retirada de la concesión:** 3 incumplimientos graves de la OSP (§4.5).
- **Quiebra:** tres cierres seguidos en negativo después de un impago (§4.5).
- **Condena firme** en las cloacas (§7.8.10).

### 3.7 Reparto por fecha y por estado

| Persona (clave) | Cargo que se muestra | Desde | Hasta | Notas |
|---|---|---|---|---|
| Pedro Sancho (`president`) | Presidente del Gobierno | siempre | — | Si pierde, se acaba la partida |
| Raquel Sanz (`minister`) | Ministra de Transportes | 3-1-2022 | 20-11-2023 | Vuelve si la eliges tras unas elecciones ganadas o por remodelación (desde 2027) |
| Óscar del Puente (`successor`) | Alcalde de Pucela | 3-1-2022 | 16-6-2023 | Solo habla en la inducción («hoy alcalde consultado») |
| | Exalcalde, sin voz | 17-6-2023 | 20-11-2023 | |
| | Ministro de Transportes | 21-11-2023 | hasta que se elija a Raquel | |
| Charo Tijera (`treasury`) | Secretaria de Estado de Presupuestos | siempre | — | |
| Benito Balasto (`adif`) | Jefe de obras de Adif | siempre | hasta que lo ceses | Si lo cesas («Cesar a Benito» en un escándalo, §7.8.10), **no vuelve nunca**. Le sustituye **la nueva jefa de obras de Adif**, un personaje sin voz que solo escribe: sus avisos llegan como texto y con un retrato genérico. Desde ese día `enCargo('adif')` es falso para siempre, así que callan los 35 encuentros de Benito, `event:cable`, `snow`, `cows`, `heatwave`, `adifdelay`, `adifboost`, `benito-cuadrilla`, `cor-traviesas`, `ext-benito`, `t-3` y `ev-desprendimiento`. Cuando su mecánica ocurre, sale como tarjeta escrita (§8.4). La relación con Adif vuelve a 50 y los permisos van ×1,25 durante 26 semanas mientras la nueva jefa se instala |
| Fermín Bogie (`workshop`) | Jefe de talleres | siempre | — | |
| Marisa Andén (`riders`) | Portavoz de los viajeros | siempre | — | Viaja en el **Norte** (Madrid–Ávila–Valladolid–León) |
| Paco Terruño (`mayor`) | Alcalde de Villanueva del Andén | siempre | — | 412 habitantes 🔒 y «una estación preciosa sin trenes» 🔒, en el tramo Ávila–Medina |
| Íñigo Asfalto (`rival`) | Autocares Meseta | siempre | — | También es el **Conseguidor** de las cloacas |

**Cambios de ministro** (mezcla de B y C; llegan en F7):
1. **Elección tras ganar.** Después de cada elección ganada, ordinaria o adelantada (desde la de 2027 en la situación 2022; desde la de diciembre de 2030 en las de 2027), Pedro pregunta con quién quieres trabajar en Transportes: Raquel u Óscar.
   - Cada uno trae su agenda: Raquel, inauguraciones y territorio, con el pacto «inauguración»; Óscar, puntualidad y redes, con el pacto «tuits».
   - Voz `elige-ministro`. En la situación 2022, el cambio de 2023 lo fija la historia.
2. **Remodelación por estado** (C). Como mucho una por legislatura, cuando se cumplen a la vez:
   - la confianza del Gobierno lleva 13 semanas por debajo de 25;
   - la encuesta está en ≥ 45 (el Gobierno aguanta);
   - quien ocupa el Ministerio te guarda un agravio.

   Pedro sacrifica al ministro en tu lugar y entra el otro (voz `remodelacion`). Quien entra pasa 26 semanas como «recién llegado», lo que hace cierto `successor.determined` («Vamos a poner orden»).

**Cómo se usa:**
- Cada contrato de diálogo exige `enCargo(persona)`.
- **Nunca habla como ministro quien no lo es.**
- Las voces del Ministerio que pueden caer en cualquiera de los dos se graban por partida doble (`-m` y `-s`).
- Al jugador lo llaman «presidente de Tenfe» o «director». Por eso se retira `paco-estacion`, que le llama «Ministro».

### 3.8 La situación *2027 · Rescate* y sus variantes

**Tarjeta:**
> «Diciembre de 2026: elecciones anticipadas. Pedro Sancho repite y devuelve a Raquel Sanz a Transportes con un plan de ocho años. Tenfe está en quiebra técnica: para pagar deudas, Hacienda cedió la alta velocidad a OuiOui hasta 2030.»

Es ficción declarada: las elecciones reales de 2027 todavía no han ocurrido.

- **Calendario:**
  - empieza el lunes 4-1-2027;
  - elecciones en diciembre de 2030 y de 2034 (las semanas 208 y 416 del rescate), y después cada 4 años;
  - **sin adelantos hasta diciembre de 2034.** El plan de ocho años de `t-1` («Tienes ocho años») y las etapas s3 y s5, que se juzgan en esas dos votaciones, necesitan las fechas fijas, y también las voces `stage-s4-s` (enero de 2031) y `end-win` («Ocho años, dos elecciones»). En la prórroga rige el ciclo electoral general de §3.6;
  - veredicto en diciembre de 2034 (`end-win` / `end-partial`) y luego prórroga con los Actos IV y V (§7.11.1).
- **Reparto:** Raquel es ministra de 2027 a 2030. Tras ganar en diciembre de 2030 eliges ministro (F7); en F5 y F6, si ganas, entra Óscar, como en el rescate original.
- **Red:** toda la historia de 2022 a 2026 está aplicada. Las decisiones con fecha anterior no suenan.
- **Tenfe explota la Media Distancia; la alta velocidad es de OuiOui.**
  - Hacienda cedió a OuiOui la explotación de las relaciones AVE y Alvia hasta el 31-12-2030 para pagar deudas.
  - Desde el 1-1-2031 Tenfe puede volver a abrir cualquiera de esas relaciones como relación nueva (4 M€ 🔒) si tiene trenes compatibles y surcos libres. OuiOui sigue compitiendo en ellas.
- **Las voces grabadas son literalmente ciertas:**
  - `t-1` (Raquel): «no hay dinero, no hay trenes y el Norte llega tarde… Tienes ocho años. Las primeras trece semanas deciden si llegas a la segunda».
    - Caja de 60 M€ frente a una deuda de 1.200 M€.
    - Una sola unidad de reserva, y Trenespop arranca con dos anuncios de segunda mano compatibles con entrega ese mismo mes (lo necesita `t-5`).
    - El Norte al 62 %.
    - El plan acaba en diciembre de 2034: ocho años.
    - **Si la etapa 1 no se cumple el día 91 (domingo 4-4-2027, último día de la semana 13), la partida termina** (voz `s1-fallo`, con «Reintentar»). En F5, con el motor todavía mensual, se comprueba al cierre de marzo (miércoles 31-3-2027, que también cae dentro de la semana 13) con la puntualidad de marzo; desde F6, el día 91 con la media de 4 semanas.
  - `t-2` (Marisa): «Pincha en el corredor Norte del mapa. Ese que parpadea en rojo. Así llevamos meses».
    - Parpadea **solo el trazo del Norte**, que está por debajo del 70 %.
    - Su pestaña Historia trae sembrados los seis meses anteriores en rojo.
- **Variantes sembradas.** Comparten la premisa, así que `t-1` y `t-2` siguen siendo ciertas:

  | Variante | Cambia |
  |---|---|
  | Crisis de deuda | Caja de 30 M€; deuda de 1.700 M€; interés +0,1 puntos al mes; Hacienda empieza en 30 |
  | Fondos europeos | Subvención ×1,5 durante 2 años si dos relaciones pasan a ancho estándar o a 25 kV |
  | Huelga general | Plantilla empieza en 25; huelga convocada para la semana 6, anunciada en el calendario |
  | Herencia envenenada | Caja de 45 M€; deuda de 1.400 M€; dos obras grandes a medias con pagos pendientes (desde F9, dos etapas de megaproyecto); OuiOui ya compite en el Levante |

---

## 4. D2 · Escala del dinero y economía

### 4.1 Escala: millones de euros reales, la del clásico

- Las 412 tomas citan cifras de la escala clásica: abrir 4 M€, veinte maquinistas 0,3 M€, equipo 18.000 €, autobús 9.000 €, encargos de 18 y 26 M€, venta online 10 M€ y ERTMS 35 M€.
- De las 70 líneas del rescate solo hay 3 grabadas, y ninguna cita dinero. Por eso **se abandona la escala pequeña del rescate**. Sus reglas se pasan a la escala real:
  - las obras usan las fórmulas del clásico (§5.4);
  - los trenes cuestan lo que dice `trains.json`: un regional nuevo, de 5 a 9 M€; un AVE, de 19 a 38 M€.
- **Una sola caja.** Lo dice Charo en una voz grabada: «Una línea rentable puede financiar otra necesaria». El panel Dinero separa explotación, inversión y financiación.
- **Las funciones de `rescate.js` no se reutilizan tal cual.** Pactos, grupos, elecciones, cloacas, `workQuote` y `punctProjection` dependen de `s.corridors` y de las semanas. Se **portan** a relaciones, tramos, días y meses, cada una con sus pruebas de `rescate-test` traducidas.

### 4.2 Demanda

Se conserva el logit del clásico (`engine.metrics`): tren contra autobús, otros modos y rivales, con tope de capacidad. Hay siete cambios.

1. **El tiempo de viaje sale de la red real.**
   - Es la suma de los minutos de cada tramo a la velocidad útil (§5.3), con el factor comercial F.
   - Se añaden 2 min por cada parada intermedia y 12 por cada cambio de ancho (9 con el cambiador rápido).
   - F se calibra para que la **mediana de minutos del plan entre minutos reales del GTFS sea 1,00 ± 0,05** en las relaciones con horario real. Hoy da 0,75 con F = 0,84; el valor inicial es 0,72, y la prueba `calibracion-test` (de A) lo fija.
2. **La puntualidad pesa:** el término de fiabilidad del clásico pasa a usar la puntualidad real de las últimas 4 semanas de esa relación.
3. **La satisfacción mueve la demanda:** se multiplica por `0,85 + 0,3·satisfacción/100`, es decir, ±15 %.
4. **Viajeros de pie.** Si la ocupación pasa del 100 %, la demanda que no cabe se reparte así: el 40 % viaja de pie (resta satisfacción), el 40 % se va al autobús (cuota de Íñigo) y el 20 % se pierde. Así son ciertos `decision:discounts` («que los viajeros vayan de pie») y `event:festival`.
5. **Mercados:**
   - los 91 pares del clásico, 76 de ellos con horario real;
   - las 11 relaciones de Media Distancia;
   - para cualquier otro par, gravedad `110·√(pobA·pobB)`.
   - Cada parada intermedia suma el 50 % de la demanda de gravedad de esa ciudad hacia los extremos.
6. **Tipo de día:** laborable ×1,08, sábado ×0,78, domingo y festivo ×0,70.
7. **Producto y tarifa de referencia.** Salen del tren asignado y de la relación, y el jugador no los elige. Se aplica la primera fila que se cumple:

   | Producto | Cuándo | Tarifa de referencia |
   |---|---|---|
   | AVE | Tren de ancho fijo estándar con `vmax` de 300 km/h o más | 0,095 €/km |
   | Alvia | Tren de ancho variable (`VAR`) | 0,082 €/km |
   | Media Distancia | Tren ibérico en una relación de 100 km o más cuyas paradas están, de media, a 25 km o más. Las 11 relaciones del contrato OSP cumplen la regla con sus datos | 0,082 €/km |
   | Regional | Tren ibérico en cualquier otra relación (corta o con paradas cada pocos km) | 0,07 €/km |

   La velocidad del tren ibérico no cuenta: un 592 de 120 km/h en Soria hace Media Distancia y un 470 de 140 km/h en una relación de 60 km hace Regional. La columna «Uso habitual» de §6.1 solo describe dónde suele circular cada modelo.

### 4.3 Costes

| Partida | Regla | Cambio respecto al clásico |
|---|---|---|
| Energía | tren-km × consumo del modelo × **índice según la tracción usada en cada tramo**: 25 kV ×1,00; 3 kV ×1,08 (pérdidas); diésel ×2,2 por plaza-km con su propio índice. Un bimodo usa gasóleo en la parte sin catenaria de su recorrido | Antes era un factor fijo. **Índice eléctrico histórico:** ×1,6 de marzo a diciembre de 2022 y ×1,3 en 2023. Después, choques sembrados |
| Canon de Adif | 4,5 €/tren-km en LAV y 1,2 €/tren-km en convencional, más 60 € por parada en estación A y 30 € en estación B | Nuevo (de A) |
| Personal | Maquinistas: la plantilla base va incluida en la estructura y cada uno por encima cuesta 0,0015 M€ al mes (clásico). Más personal de estación (§6.3), horas extra y cuadrillas | La huelga negociada cobra de verdad su +3 % de nómina |
| Mantenimiento | Por unidad × (1 + 0,02 por año de edad por encima de 20) × deslizador de mantenimiento (50–150 %) | La edad pesa |
| Conservación de vía | Por km de tramo con servicio propio × deslizador de vía (50–150 %) | Mueve el estado de la vía (§5.3) |
| Estructura | `(9 + unidades·0,035) × índice de costes` | Como el clásico |
| Intereses | 0,4 % al mes sobre la deuda y lo dispuesto del crédito | |
| Autobuses de sustitución | Obras en modo «Autobuses» e incidencias respondidas con autobús (9.000 € 🔒). Se pagan a Autocares Meseta | Íñigo lo celebra («Qué gusto da ver cómo trabajas para mi cuenta de resultados») |
| Devoluciones | Con la política «Devoluciones por retraso» o tras el ultimátum de Viajeros | |

### 4.4 Ingresos

| Fuente | Regla |
|---|---|
| Billetes | Viajeros del día × tarifa, menos las devoluciones |
| Transferencia del Estado | 3,5 M€ al mes con la Misión «Servicio público» y 2 M€ con la «Comercial» (clásico, `engine.js:73`). La Misión la elige `decision:inaugural` 🔒 y es el artículo 1 del Estatuto (§7.8.7) |
| OSP por tren-km | En las relaciones que no son AVE: 2,2 €/tren-km con «Servicio público» y 1,6 con «Comercial» (`engine.js:66`) |
| Penalización de los esenciales | Norte, Levante y Sur de Media Distancia: un mes por debajo del 70 % resta el 12 % de su OSP de ese mes y suma un **leve**; 3 leves en 12 meses hacen un **grave** (§4.5) |
| Convenios autonómicos (F9) | Cada petición de servicio aceptada paga su cuota mensual **solo en los meses que cumple** su KPI con un margen de 5 puntos (§7.12) |
| Encargos | Premio al cumplir: 18 o 26 M€ el primero 🔒, y los de `tycoon.js` después. Se miden sobre la **red propia**: lo que trae el contrato de Media Distancia no cuenta (§6.6) |
| Fondos europeos | Durante una ventana, las obras de catenaria y de ancho cuestan el 60 % durante 24 meses 🔒 (`event:eufunds`). Además hay ayudas ligadas a una obra concreta, que se cobran **al certificar** y se enseñan antes como «financiación prevista» |
| Contrato rural (F3) | 6 M€ al mes durante 5 años 🔒, **solo en los meses que se cumple** (§8.6) |
| Peticiones (F1) | Cobran después de **3 cierres seguidos** con el servicio cumplido. Se acaba el truco de +42 M€ en el mes 0 |
| Premios | Actos, hitos, Operador del Año |
| Venta de unidades | precio × factor de edad × estado × 0,55, nunca por encima de lo pagado. Se acaba el truco de comprar y revender |

**Lo que deja de ser un regalo:**
- Los actos pagan solo cuando se cumplen sus objetivos.
- El dinero de una decisión llega solo si su texto lo implica. Si va con una condición, se devuelve cuando no se cumple (por ejemplo, los 65 M€ de `discounts`).

### 4.5 Crédito, impago, quiebra y retirada

- **Línea de crédito:** un solo deslizador.
  - Techo de 300 M€ en la situación 2022 y de 50 M€ en la de 2027. Sube con los hitos (§7.11.3) y con la confianza de Hacienda: ±20 %.
  - Interés del 0,4 % al mes.
  - El contrato-programa y la intervención de Hacienda la congelan.
- **Ya no hay préstamo puente automático** (F5; hasta entonces sigue el del clásico, que no tiene voz ni promete nada). Si un cierre de mes deja la caja en negativo, se abre la decisión **Impago** (voz `fin-impago`) con cinco salidas, cada una con su efecto calculado:
  1. **Vender** la unidad peor conservada al precio depreciado.
  2. **Aplazar** una obra, que costará un 10 % más al retomarla.
  3. **Reestructurar:** los pagos de 3 meses se retrasan con un 8 % más, y Hacienda −6.
  4. **Recortar** servicios: una salida menos en la relación que más pierde, sin dejar nunca un esencial a cero.
  5. **Rescate de Hacienda:** una inyección que cubre el descubierto más un mes de gastos (`G`, §8.2), a devolver en 24 meses al 0,4 % mensual; Hacienda −8 y queda anotado en `dinero.rescatesHacienda`. En las situaciones de 2027, la etapa 5 exige que no haya ninguno en sus 104 semanas (2033–2034) y `end-win`, que no haya ninguno en los ocho años del plan (2027–2034).

  Si una salida no haría nada, aparece desactivada con su motivo. El rescate de Hacienda siempre está disponible, así que **nunca hay una escena sin salida**.
- **Quiebra:** tres cierres seguidos en negativo después de un impago. Voz `fin-concurso`; fin de la partida.
- **Retirada de la concesión:** 3 graves acumulados, sea por la OSP o por etapas incumplidas en 2027. Voces `fin-retirada-m` y `fin-retirada-s`; fin de la partida.

### 4.6 Inflación y tarifas

- Los costes suben un 2,05 % al año, como en el clásico.
- La política **«Actualización de tarifas (IPC)»** viene activada y se aplica cada enero. Quitarla da +Viajeros y −Hacienda.
- Así se corrige la caída del clásico: +47 M€ al mes en 2037 frente a −31 M€ en 2050.
- La inflación se congela en 2050 (`economicYear`), también en la prórroga.

### 4.7 Arranques

| Situación | Caja | Deuda | Flota | Relaciones abiertas |
|---|---|---|---|---|
| **2022 · Tenfe real** | 500 M€, más 120 o 160 M€ de `inaugural` 🔒 | 0 | Las 80 unidades AVE y Alvia del clásico. 60 de ellas, sin servicio | Los 8 servicios del clásico (`START_SERVICE`, `engine.js:18`). La Media Distancia llega con el contrato OSP (§6.6) |
| **2027 · Rescate** | 60 M€ | 1.200 M€, con 25 M€ por trimestre más intereses | Unas 30 unidades de Media Distancia viejas (estado medio del 55 %, una de reserva) | Norte, Levante y Sur abiertos. Mediterráneo, Ebro, Galicia y Asturias, cerrados pero abribles. Extremadura, Teruel, Soria y Cantabria, cerrados y con la vía por debajo del 40 % |

En 2027, `inaugural` fija la Misión pero no da dinero: su línea de opción dice «sin aportación».

🔒 La flota de 2022 tiene que ser así por tres tomas grabadas:
- `induction:infrastructure:briefing:2`: «Para una vía sin catenaria solo sirve **hoy** nuestro Alvia híbrido S730». No hay ninguna diésel propia hasta el contrato OSP.
- `chapter:recovery`: «Te dejo **media flota parada**». Al empezar, 60 de 80 unidades están sin servicio.
- `induction:people:briefing:0`: «**Hoy sobra cobertura**». Hay 180 maquinistas frente a una necesidad de 29.

### 4.8 Constantes que dicen las voces (las protege `numeros-voz-test`)

| Constante | Valor en el motor | Voz o voces |
|---|---|---|
| Abrir un servicio | 4 M€ | `induction:infrastructure:briefing:2`, `feedback:mandate:coverage` |
| Contratar maquinistas | lotes de 20 por 0,3 M€; formación de 3 meses | `induction:people:*`, `feedback:people:*` |
| Investigación | Venta online, 10 M€ y 4 meses; ERTMS, 35 M€ y 12 meses; una sola en curso | `induction:competition:briefing:2` |
| Respuesta a una incidencia | Equipo 18.000 € (`RESPONSES.team.cost = .018`) y retraso ×0,3; autobús 9.000 €; esperar 0 € | `induction:incident:*` |
| Primer encargo | 18 meses; Servicio público 18 M€ y +Territorio; Apuesta comercial 26 M€, +25 % de exigencia y +Hacienda | `induction:handoff:*` |
| Fondos europeos | Obras de catenaria y de ancho al 60 % durante 24 meses, **elijas lo que elijas** | `event:eufunds` |
| Cola de fábrica | +18 meses en todos los pedidos nuevos | `decision:industry` |
| Contrato rural | 5 años | `decision:rural` |
| Villanueva del Andén | 412 habitantes; estación sin trenes | `decision:rural`, `paco-parada`, `ext-paco` |
| Llegada del S106 | 30 unidades durante 18 meses | `decision:s106` |
| Crisis climática | 45 °C en Córdoba | `decision:climate` |
| Aire acondicionado | Día con 40–44 °C | `ev-aire` |
| Política (carta de §7.8.7) | «Una política actúa ya y cobra cada mes»: efecto desde el primer día (×0,5 al principio, que sube con el tiempo desde F7) y coste mensual entero desde el primer mes | `induction:competition:briefing:0` |
| Torralba–Soria | Electrificarlo cuesta 44 M€ y tarda 21 meses. No lo dice ninguna voz, pero lo fijan el tutorial y `induction-test`. Por eso el tramo `trb-sor` conserva sus 90,8 km (§5.1) | interfaz del tutorial |
| Rescate | Plan de 8 años; prueba de 13 semanas (91 días) | `t-1` |
| Préstamo de una cuadrilla de Adif | 13 semanas («tres meses») | `benito-cuadrilla` |
| Convenio con la plantilla | 26 semanas («medio año») | `fermin-convenio` |
| Plan de comunicación | 3 inauguraciones en 26 semanas | `oscar-tuits` |
| Cese | 6 cierres seguidos por debajo de 15 | `cesado` |
| Ultimátum | Cuenta atrás de 13 semanas («tres meses») | `ult-*` |
| Mitin | 2 promesas | `mitin` |
| Comisión | 7 % del contrato | `cor-comision` |
| Mariscada | 90.000 € | `cor-mariscada`, `sc-mariscada` |
| Fechas históricas | Burgos en julio de 2022 (21-7); YaIré en noviembre de 2022 (25-11); Murcia el 20-12-2022; Pajares el 29-11-2023 con cambiador en Pola de Lena; S106 en mayo de 2024 | `decision:burgos`, `Rossa`, `murcia`, `pajares`, `s106` |
| Licitación | 30 trenes de alta velocidad y 10 opcionales | `decision:futuretender` |
| Recta final | Quedan 4 años desde las elecciones ganadas de 2047 o después hasta el veredicto | `decision:legacyvote` |
| Energía | Sin seguro (B) siempre cuesta más que con seguro (A): «la segunda, más» | `decision:energy` |
| Robo de cable | Reponer deprisa cuesta el doble que a nuestro ritmo (9 M€ frente a 4,5 M€) | `event:cable` |
| Nevada | Exactamente 3 puertos electrificados sin tensión | `event:snow` |
| Ola de calor | Día de ola de calor con los carriles a 60 °C en los tramos «calor» | `event:heatwave` |
| Campaña del autobús | Billetes a 5 € en todas las ciudades donde compite Autocares Meseta | `event:busprice` |
| Mitin (aviso) | Se anuncia 8 semanas antes de votar | `mitin` |
| Convenio de los maquinistas | La voz de la huelga solo suena si han pasado 10 años o más desde el último convenio firmado (`personal.ultimoConvenio`, que empieza 10 años antes del arranque) | `event:strike` («llevan diez años esperando el convenio») |
| Último gran mandato | Sin adelanto electoral después de `legacyvote` | `decision:legacyvote` («Quedan cuatro años») |
| Plan de ocho años | Sin adelanto electoral en las situaciones de 2027 hasta diciembre de 2034 | `t-1`, `end-win` |

**Primer encargo, corregido:** se mide como **crecimiento de la red propia sobre la línea base de enero de 2022**.
- Servicio público: +12 % de viajeros al mes, sostenido 3 cierres.
- Apuesta comercial: +15 % (12 × 1,25).
- **Red propia** = todo menos lo traspasado con el contrato de Media Distancia. Si se firma el contrato, al valor del mes se le resta la foto de lo traspasado (`traspasoMD.viajerosMes`, §6.6), y la línea base no cambia. Lo que el jugador haga crecer en esas relaciones sí cuenta; lo que trajo el traspaso, no.

Así los 18 meses son una tensión de verdad: el encargo deja de ganarse solo en el primer cierre, como pasa hoy (la red ya lleva 525.786 viajeros al mes), y tampoco se gana firmando un contrato. «El premio grande exige trabajo grande» (`feedback:handoff:commercial`) sigue siendo cierto.

**Regla:** las versiones negociadas de un pacto o de un encargo nunca cambian un número que diga una voz. Solo cambian lo que la voz no dice, como la recompensa o el plazo no citado.

---

## 5. D3 · La red

### 5.1 Modelo de tramo y datos

Los datos salen de `assets/infra.js` (125 tramos y 90 nodos, extraídos de OSM) y se corrigen con un **archivo superpuesto nuevo, `assets/red-real.js`**.
- **No se vuelve a generar `infra.js` con `tools/build_infra.py`**, porque su entrada OSM no está en el repositorio.
- El archivo superpuesto exporta `AJUSTES_TRAMO`, `TRAMOS_NUEVOS`, `NODOS_AJUSTE`, `ETIQUETAS`, `U0` y `CAPACIDAD_INICIAL`.

```js
// s.infra.t[id]: se amplía el estado clásico {g,e,v,b}
{ g: 'ib'|'std'|'mixto',            // ancho
  e: 'no'|'3kv'|'25kv',             // tensión
  v: 155,                            // velocidad de diseño (km/h)
  via: 'unica'|'mixta'|'doble',      // de segments.json; si falta, 'doble' marcado como provisional
  apartaderos: 0..2,                 // paquetes de apartaderos en vía única
  senal: 'antigua'|'ctc'|'ertms',
  galibo: 'normal'|'estrecho',
  estado: 0..100,                    // estado de la vía
  ltv: null|{v, motivo, desde},      // limitación temporal de velocidad
  u0: 0..0.6,                        // ocupación base de Cercanías y mercancías (provisional)
  tags: ['puerto','calor','trinchera','rampa','rural','nieve','robo','ganado','yacimiento'],
  b: true, cerrado: null|{hasta, motivo},
  obra: null|obraId }
```

**Correcciones obligatorias:**
1. Convencional nuevo `pal-leo-c`: 123 km, ibérico, 3 kV, 155 km/h, vía doble.
2. Convencional nuevo `cor-sev-c`: 129 km, ibérico, 3 kV, 155 km/h, vía mixta.
3. `leo-pol` se separa en dos:
   - **Rampa** `leo-pol-r`: 108 km, ibérico, 3 kV, 115 km/h, mixta; etiquetas «puerto», «rampa» y «trinchera»; gálibo estrecho.
   - **Variante** `leo-pol-v`: mixto, 25 kV, 220 km/h. Abre el 29-11-2023 con el cambiador de Pola.
4. El nodo `mot` (Motilla) pasa a (−1,88; 39,56).
5. Nodo **Villanueva del Andén** (`vda`) en el km 40 de `avi-med`. Tiene una estación con andén y sin parada de ningún tren («estación preciosa sin trenes» 🔒).
6. Velocidades, vía y tensión de `segments.json` en sus 11 corredores. **Los km de `segments.json` solo sustituyen a los de OSM si difieren más de un 5 %.** Así `trb-sor` conserva 90,8 km y su presupuesto de 44 M€ y 21 meses.
7. Migración de partidas guardadas (en `migrate`):
   - las claves de `s.infra.t` cambian (`leo-pol` → `-r` y `-v`);
   - se reescriben las vías de las relaciones;
   - la entrada de `HISTORY` del 29-11-2023 pasa a abrir `leo-pol-v`.
8. Cambiadores: `changer || changerName` (13 nodos).

Los tramos fuera de los 11 corredores verificados llevan `via`, `u0` y etiquetas **estimadas**, y su ficha lo dice: «dato provisional».

### 5.2 Etiquetas que hacen ciertas las voces

| Etiqueta | Tramos (ejemplos) | Para qué |
|---|---|---|
| puerto + nieve | Madrid–Ávila (Guadarrama), Rampa de Pajares, Palencia–Santander (Pozazal), Bilbao–Miranda (Orduña), Ourense–Lubián (Padornelo) | `event:snow`: «la catenaria se ha congelado en tres puertos». Hay 3 o más puertos electrificados |
| calor | Córdoba–Sevilla (convencional y LAV), Linares–Córdoba, Mérida–Badajoz, Madrid–Sevilla LAV | `event:heatwave`, `decision:climate`, `ev-aire` |
| trinchera | Teruel–Sagunt, Palencia–Santander, Rampa | `ev-desprendimiento` |
| rampa | Rampa de Pajares, Orduña, Pozazal, Guadarrama (Madrid–Ávila) | `ev-averia-rampa` («en plena rampa») |
| gálibo estrecho | Palencia–Santander, Rampa | BCBB no pasa; `decision:gauge` |
| rural | Torralba–Soria, Zaragoza–Teruel, Talavera–Plasencia y las vías únicas poco pobladas | `event:cows`, territorios |
| robo | Convencional de 3 kV periurbano con señalización antigua | `event:cable` |
| ganado | Vías únicas rurales sin vallar | `event:cows` |
| yacimiento | Tramos en Mérida, Tarragona, Córdoba, Zaragoza y Lugo | `event:adifdelay` («restos romanos») |

### 5.3 Reglas de la red

**1. Compatibilidad** (F3). La función `compatibilidad()` de `reglas-infraestructura.md` §5 reproduce el `plan()` clásico en sus 129 casos y se amplía.
- Perfil del tren: `{anchos: ['ib'] | ['std'] | ['ib','std'], tensiones: ['3kv','25kv'], termico: 'no'|'diesel'|'bimodo'|'bateria', vmax, vmaxTermico, autonomia, galibo}`.
- Un tren entra en un tramo si se cumplen las tres condiciones:
  - el ancho del tramo está entre los suyos (un tramo mixto admite los dos);
  - tiene energía: la tensión del tramo está entre las suyas, o es térmico o bimodo, o es de batería y el hueco sin catenaria no supera su autonomía;
  - el gálibo cabe.
- Un tren de ancho variable cambia de ancho solo en un nodo con cambiador (+12 min).
- Faltas que se enseñan:

  | Falta | Cuándo |
  |---|---|
  | `gauge` | Ancho distinto |
  | `changer` | Tren de ancho variable sin cambiador en ese nodo |
  | `elec` | Tren eléctrico en tramo sin catenaria |
  | `tension` | Tensión distinta: un S103 o un S112 en `sag-cas`, que es de 3 kV |
  | `galibo` | Tren ancho en un túnel estrecho |
  | `bateria` | Hueco sin catenaria mayor que la autonomía |
  | `closed` | Tramo cortado |
  | `build` | Tramo no construido |
  | `capacidad` | Sin surcos libres |
  | `detour` / `nopath` | Rodeo excesivo o sin camino |

**2. Velocidad útil** = el mínimo de:
- la velocidad de diseño del tramo, limitada por la LTV si la hay;
- la velocidad máxima del tren;
- 160 km/h, o la `vmaxTermico` del tren, si circula sin catenaria;
- 220 km/h en 3 kV.

La ficha dice qué tramo limita: «160 km/h · limita Navalmoral–Monfragüe».

**3. Capacidad en surcos** (F8; de A; equivalen a los *stands* de Airport CEO). Trenes al día, sumando los dos sentidos:

| Tipo de vía | Capacidad |
|---|---|
| LAV doble | 220 (×1,2 con ERTMS) |
| Convencional doble con CTC | 160 |
| Convencional doble con señalización antigua | 110 |
| Mixta (doble a tramos) | 90 |
| Vía única con apartaderos | 48, +12 por paquete (72 como máximo) |
| Vía única sin apartaderos | 30 |

- **Carga** = `(u0·cap + Σ salidas propias + salidas de los rivales) / cap`.
- Por debajo de 0,75, sin efecto.
- Entre 0,75 y 1,00, la puntualidad baja `(carga − 0,75)·40` puntos en las relaciones que usan el tramo.
- **Por encima de 1, el planificador no deja añadir la salida y lo dice:** «Sin surcos libres en Encina–Xàtiva (vía única, 30/30) · Apartaderos ›».
- En la ampliación 5.1, en las LAV con acuerdo marco contará además tu **cupo** (§5.6).

**4. Estado de la vía** (F3).
- Cada mes baja así: `Δ = −(0,3 + 0,8·carga + 0,15·[más de 30 años sin renovar]) × (2 − deslizador de vía)`.
- Lo suben el bateo y la renovación.

| Estado | Efecto |
|---|---|
| ≥ 70 % | Sin efecto |
| 45–70 % | Resta puntualidad en proporción |
| < 45 % | **LTV**: velocidad útil ×0,7 |
| < 30 % | LTV a 60 km/h y riesgo de descarrilamiento leve (§7.9) |

Es la «vía cansada» de Benito y de `t-3`.

**5. Señalización** (F8). CTC o ERTMS por tramo dan más capacidad y +3 de puntualidad. La investigación ERTMS 🔒 es la tecnología; la obra la instala tramo a tramo.

### 5.4 Obras

**Cuándo llega cada cosa.** Los dados del 22 % (retraso de obra) desaparecen en F1. El bateo y la reapertura de una parada llegan en F3, como obras sencillas sin fases; la renovación, la electrificación, el tercer carril, el ancho estándar, el cambiador y la mejora de estación ya existen en el clásico. Las fases, los modos de servicio, las cuadrillas, los retrasos con causa, los Planos y el resto del catálogo llegan en F8. Hasta F8, la columna «Disponible» que cita hitos no se aplica, porque esas obras todavía no existen.

**Catálogo.** Coste en M€ y plazo en meses, salvo donde se indica.

| # | Obra | Coste | Plazo | Modos de servicio | Efecto | Disponible |
|---|---|---|---|---|---|---|
| 1 | **Bateo intensivo** | 0,05/km | 2 + km/50 **semanas** | de noche, sin corte | Estado +20 (hasta 80); quita la LTV | desde el inicio |
| 2 | Renovación integral | 8 + 0,18·km | ⌈4 + km/40⌉ | por fases, autobuses o cortar | Estado 95; `v` sube hasta mín(220, v + 40) en convencional | inicio |
| 3 | Electrificar a 25 kV | 6 + 0,42·km | redondear(12 + km/10) | por fases o autobuses | `e = 25kv`. Avisa si los tramos vecinos son de 3 kV | inicio |
| 4 | Electrificar a 3 kV | 6 + 0,46·km | redondear(12 + km/10) | por fases o autobuses | `e = 3kv` | inicio |
| 5 | **Pasar de 3 kV a 25 kV** | 4 + 0,28·km | redondear(8 + km/15) | por fases nocturnas o cortar | `e = 25kv`. Antes de encargar, lista en rojo las unidades y relaciones que lo pierden | hito 4 |
| 6 | Tercer carril (ancho mixto) | 8 + 0,5·km | redondear(14 + km/9) | por fases | `g = mixto` | inicio |
| 7 | Ancho estándar | 5 + 0,3·km | redondear(8 + km/14) | **solo cortar** | `g = std`; los trenes ibéricos lo pierden | inicio |
| 8 | **Quitar el carril ibérico** | 2 + 0,08·km | redondear(4 + km/30) | por fases | De mixto a estándar. Exige que no quede ningún servicio ibérico | hito 4 |
| 9 | **Desdoblar** | 10 + 1,4·km | redondear(18 + km/8) | por fases (capacidad −35 %) | `via = doble` | hito 3 |
| 10 | **Apartaderos** (un paquete) | 3 + 0,06·km | 6 | de noche | +12 surcos en vía única (72 como máximo) | inicio |
| 11 | **Señalización CTC** | 2 + 0,15·km | redondear(6 + km/30) | de noche | Capacidad ×1,15 y +3 de puntualidad | inicio |
| 12 | **ERTMS en el tramo** | 3 + 0,15·km | redondear(8 + km/30) | de noche | +20 % de capacidad en LAV y +2 de puntualidad | tras investigar ERTMS |
| 13 | **Gálibo de túneles** | 15 + 0,6·km | 12 + km/10 | cortar o autobuses | `galibo = normal` | inicio |
| 14 | **Vallado** | 0,02·km | 2 | sin impacto | Las incidencias con animales bajan un 80 % en el tramo | inicio |
| 15 | Cambiador de ancho | 18 | 10 | — | Un nodo donde se tocan tramos `std` e `ib` | inicio |
| 16 | Reabrir una parada | 1,2 | 4 | de noche | Los trenes paran en una estación existente, como Villanueva | inicio |
| 17 | Apeadero nuevo | 3 | 5 | de noche | Parada nueva en una relación | hito 2 |
| 18 | Mejorar una estación (nivel 1–3) | como el clásico | — | — | +6 % de demanda por nivel | inicio |
| 19 | Nueva línea de alta velocidad trazada por el jugador | 25 + 1,1·km | 42 + km/10 | — | Estándar, 25 kV, 300 km/h | hito 5 |

Además están los **9 proyectos de alta velocidad del clásico** (Almería, Y vasca, Burgos–Vitoria, Navarra, LAV Extremadura, Cartagena, Cantabria, Huelva y Cerdedo). Siguen disponibles como hoy, desde su año mínimo y **sin hito**, y desde F9 se construyen por etapas (§7.11.5). También están los megaproyectos del rescate y el **plan de resiliencia al calor**, que solo aparece si lo eliges en `decision:climate`.

**Ningún objetivo pide algo bloqueado.** Si un acto, una etapa, un encargo, un pacto o un compromiso en vigor pide una obra, un proyecto o una tecnología que un hito todavía bloquea, queda desbloqueado para ese objetivo mientras dure. Por ejemplo, el Acto IV («termina alguna línea nueva») abre la obra 19 aunque no se tenga el hito 5. La tarjeta lo dice: «Desbloqueado por el Acto IV». `progreso-test` comprueba que, al empezar cada acto o etapa, cada objetivo tiene al menos un camino disponible en el estado de partida y en el plazo.

**Ejemplo del tutorial:** electrificar Torralba–Soria (90,8 km) a 25 kV cuesta 44 M€ y tarda 21 meses. Va por fases y sin corte.

**Fases de cada obra** (vienen del rescate):
- Permisos: 10 % del plazo, sin cuadrillas.
- Obra: 80 % del plazo, con cuadrillas.
- Pruebas: 10 % del plazo, sin cuadrillas. Fallan un 12 % de las veces (menos con ERTMS); saltárselas sobornando al inspector abre el riesgo de `sc-accidente`.

**Modos de servicio.** Se aplican a todas las relaciones que cruzan el tramo.

| Modo | Plazo | Demanda | Puntualidad | Coste extra | Lo que hace cierto |
|---|---|---|---|---|---|
| Por fases | ×1,5 | 78 % | −9 | — | Capacidad −35 % |
| Autobuses | ×1 | 55 % | se congela | autobuses contratados **a Autocares Meseta** | `rival.happy` («trabajas para mi cuenta de resultados») |
| Cortar | ×0,85 | 0 | — | reputación −1 − n.º de servicios suspendidos | Si hay otra ruta compatible, la relación se desvía |

**Cuadrillas (frentes de obra):**
- Hay 3 en la situación 2022 y 2 en la de 2027. Se gana una más en los hitos 3, 6 y 9.
- Desde el hito 2 se pueden contratar contratas por meses, a ×1,5 el coste de una propia. También existe el pacto «Cuadrilla de Adif».
- Una obra ocupa 1 cuadrilla (hasta 100 km) o 2 (más de 100 km), y solo durante la fase de obra. Si las pierde, se para y lo avisa.
- **Las cuadrillas libres hacen guardia.** La respuesta «Equipo» a una incidencia necesita una libre; si no hay ninguna, la presta una contrata por 54.000 € (el triple). Así es cierto Benito: «Sin cuadrilla de guardia, la incidencia de las seis la arregla el Espíritu Santo».

**Retrasos con causa.** Se acaba el 22 % al azar. Una obra solo se retrasa por una de estas causas, y la nombra:
- Territorio por debajo de 25: +1 mes de permisos por semestre;
- relación con Adif por debajo de 30: permisos ×1,5;
- puerto en invierno (diciembre a febrero): +2 semanas;
- `event:adifdelay` sobre **una** obra con nombre;
- falta de caja: la obra se para;
- pruebas fallidas: se repiten (+10 % del plazo).

**Aceleración:** pagar el 25 % del coste que falta quita el 25 % de la obra que queda (una sola regla). Queda anotado como «obra acelerada» para Benito y Charo.

**Planos** (Airport CEO):
- En el planificador de obra, los tramos que necesitan la obra se pintan en rojo y los que ya la tienen, en azul.
- «Añadir al plano» es gratis y deja una línea discontinua en el mapa.
- Se pueden comparar hasta 3 planos (por ejemplo, Teruel a 3 kV frente a Teruel a 25 kV con cambio de tensión en Sagunt).
- «Encargar» convierte un plano en obra.

**Presupuesto = aplicación.** El planificador enseña, calculados con la misma función que luego usa el motor (`workQuote` y `punctProjection` del rescate, pasados a tramos):
- coste, ayuda y caja mínima prevista;
- fecha de entrada en servicio y puntualidad antes y después;
- minutos ganados en cada relación;
- **los trenes que dejarán de poder circular**.

`obras-test` comprueba que lo que se enseña es lo que se aplica.

### 5.5 Relaciones, líneas y corredores

- **Relaciones reales:**
  - las 91 del clásico (alta velocidad y Alvia), 76 con horario GTFS;
  - las **11 de Media Distancia**, que son los corredores del rescate: Norte, Levante, Sur, Mediterráneo, Ebro, Galicia, Asturias (por la Rampa), Cantabria, Extremadura, Teruel y Soria. Tienen salidas repartidas entre las 06:30 y las 21:30.
- **Demanda de cualquier par** (F4, con la herramienta). La función `demandaPar(a, b, paradas)` de `engine.js` usa el mercado del clásico si existe y, si no, la gravedad de §4.2 punto 5, más el 50 % por cada parada intermedia. Es la misma función para la previsión y para el motor.
- **Horario de las líneas propias** (F4). En la jornada jugable, `operations.servicePlan` ya crea salidas repartidas para las relaciones sin GTFS. Ahora las genera con la **cadencia** de la línea (primera salida e intervalo, por sentido), su tiempo de viaje real y sus **paradas**. La clave de la caché incluye la versión de las relaciones. Las 11 relaciones de Media Distancia (F5) usan el mismo generador, con salidas entre las 06:30 y las 21:30.
- **Herramienta «Nueva línea»** (Cities; F4; tecla L, o «Nueva línea desde aquí» en la ficha de una ciudad):
  1. Pulsas el origen y el destino. Salen hasta **3 rutas alternativas**: la más rápida para el modelo elegido, la convencional y «por…».
  2. La **tira de ruta** pinta cada tramo según el modelo: verde puede, ámbar con cambiador, rojo no puede, con el motivo.
  3. Eliges el modelo (se resaltan los compatibles), las paradas, el exprés (sin paradas intermedias), las salidas al día, la cadencia (primera salida e intervalo, o la plantilla real del GTFS si existe) y la tarifa.
  4. **Debajo del botón se escriben los requisitos** (Airport CEO):
     - unidades libres compatibles: `⌈(2·viaje + 2·30 min) / intervalo⌉`, más una de reserva si hacen falta más de 6;
     - maquinistas;
     - surcos libres en cada tramo (desde F8);
     - «abrir cuesta 4 M€» 🔒.
  5. La previsión usa la misma función del motor: viajeros, ocupación, margen y puntualidad esperada con sus causas.
- **Corredores con nombre.** Agrupan tramos para la interfaz y para las voces, para poder señalar en el mapa «el corredor Norte» de `t-2` o «tus corredores buenos».
- **Esenciales:** Norte, Levante y Sur de Media Distancia.
- **Territorios:** Extremadura, Teruel, Soria, Cantabria y las relaciones rurales del arco 3 del clásico. Un territorio cuenta como **servido** si tiene 2 o más salidas por sentido y al menos el 55 % de puntualidad.
- **Villanueva del Andén.** Se vuelve parada con la obra «Reabrir una parada» o porque lo exige el contrato rural. Es la estación de Paco.

### 5.6 Concurso de capacidad en las LAV (de A; ampliación 5.1, fuera de las nueve fases)

- Cada 5 años, Adif reparte por concurso el **70 % de los surcos** de cada eje de alta velocidad (Madrid–Barcelona, Madrid–Levante, Madrid–Andalucía, Madrid–Norte y Madrid–Galicia) entre Tenfe, OuiOui y YaIré. El 30 % restante queda libre: el primero que lo pide se lo queda.
- **Calendario:**
  - situación 2022: valen los acuerdos reales hasta 2030; el primer concurso es en 2030, para 2031–2035;
  - situación 2027: el primero es en 2029, para 2030–2034.
- **La puja:** el jugador elige qué parte del cupo quiere (25, 50 o 70 %) y se compromete a un canon anual reservado y a usar como mínimo el 80 % de sus surcos. Si usa menos, paga una penalización.
- Los rivales pujan según su estrategia y tu puntualidad pasada.
- El resultado fija los **cupos** para 5 años. El planificador lo respeta: «Madrid–Barcelona: tu cupo, 48/48 surcos».
- **No entra en las nueve fases**: queda como primera ampliación después de la 5.0 (§14, «Después de la 5.0»). Hasta entonces, las LAV usan solo la capacidad física de §5.3, y los rivales ocupan surcos según sus salidas.

---

## 6. D4 · Tipos de tren y Trenespop

### 6.1 Catálogo único (`trenes.js`, generado desde `trains.json` y los modelos clásicos)

Se conservan los identificadores clásicos (`s100`, `s112`, `s103`, `s106f`, `s106v`, `av2030`, `s120`, `s130`, `s730`) para que las partidas guardadas y las pruebas migren. El campo `power` del clásico pasa a `tensiones` y `termico`.

| Clave | Serie real → marca | Uso habitual (no fija la tarifa; §4.2 punto 7) | Ancho | Energía | km/h | Plazas | M€ nueva | Plazo (meses) | Desde | Notas |
|---|---|---|---|---|---|---|---|---|---|---|
| `s470` | 470 (reforma de la 440) → KAFKA | Regional | IB | 3 kV | 140 | 221 | solo usada, ~0,5 | — | heredada | Fiabilidad −0,06; mantenimiento alto |
| `s463` | Civia 463 → KAFKA | Regional | IB | 3 kV | 120 | 184 | 5 | 18 | 2022 | |
| `s465` | Civia 465 → KAFKA | Regional | IB | 3 kV | 120 | 277 | 7 | 18 | 2022 | |
| `s449` | 449 → KAFKA | Media Distancia | IB | 3 kV | 160 | 257 | 8 | 22 | 2022 | Supuesto del juego: el taller puede **adaptarla a 2T** (1,5 M€, 6 meses) |
| `s480` | Civity 480 → KAFKA | Media Distancia | IB | 3 + 25 kV | 200 | 256 | 9 | 24 | 2027 | Bitensión (2T) |
| `s592` | 592 «camello» → Malstom | Media Distancia | IB | diésel | 120 | 228 | solo usada, ~0,6 | — | heredada | |
| `s594` | 594 TRD → KAFKA | Media Distancia | IB | diésel | 160 | 123 | solo usada, ~1 | — | heredada | Fiabilidad −0,05 |
| `s599` | 599 → KAFKA | Media Distancia | IB | diésel | 160 | 181 | 8 | 22 | 2022 | |
| `dorfler_bmu` | FLIRT bimodo → Dörfler | Media Distancia | IB | 3 + 25 kV + diésel | 160 (140 en diésel) | 204 | 9 | 26 | 2028 o tras investigar «Bimodo» | La bitensión es un supuesto nuestro |
| `dorfler_akku` | Akku → Dörfler (ficticio) | Regional | IB | 3 + 25 kV + batería (80 km) | 160 | 200 | 10 | 30 | tras investigar «Batería» | |
| `s120` | 120/121 → KAFKA | Alvia / Media Distancia | VAR | 3 + 25 kV | 250 (220 en 3 kV) | 238 | 16 | 26 | 2022 | |
| `s130` | 130 → Tardo | Alvia | VAR | 3 + 25 kV | 250 | 299 | 25 | 28 | 2022 | |
| `s730` | 730 → Tardo | Alvia | VAR | 3 + 25 kV + diésel | 250 (180 en diésel) | 262 | 30 | 30 | 2022 | Única unidad no eléctrica propia en enero de 2022 🔒 |
| `s106v` | 106 Avril variable → Tardo | AVE / Alvia | VAR | 3 + 25 kV | 330 | 507 | 32 | 38 | pedido histórico de 2024 | Llega con el contrato histórico (`decision:s106`) |
| `s106f` | 106 Avril fijo → Tardo | AVE | STD | 25 kV | 330 | 521 | 29 | 36 | pedido histórico de 2024 | No pasa por 3 kV ni por ancho ibérico |
| `s100` | 100 → Malstom | AVE | STD | 3 + 25 kV | 300 | 329 | solo heredada o usada | — | 1992 | |
| `s112` | 112 → Tardo | AVE | STD | 25 kV | 330 | 365 | 29 | 30 | 2022 | No pasa por 3 kV |
| `s103` | Velaro E → Schlimmens | AVE | STD | 25 kV | 350 | 405 | 38 | 34 | 2022 | No pasa por 3 kV |
| `bcbb_hs` | «Fuxing» → BCBB | AVE | STD | 25 kV · **gálibo ancho** | 350 | 576 | 19 | 20 | 2029 | Fiabilidad 0,82; riesgo político (Bruselas); el yate de las cloacas |
| `av2030` | Nueva generación → la marca que gane | AVE | STD (o VAR en la variante) | 25 kV (la variante VAR, 2T) | 350 | 540 | 36 | 42 | tras `decision:futuretender` | |

**Etiquetas iguales en toda la interfaz:**
- Ancho: `IB`, `STD` y `VAR`.
- Energía: `3 kV`, `25 kV`, `2T` (bitensión), `DSL`, `BIMODO` y `BAT`.
- También `VMAX` y `GÁLIBO ANCHO`.

Las mismas etiquetas salen en Trenespop, en la flota, en el selector de la herramienta Nueva línea y en la ficha del tramo.

### 6.2 Marcas y fiabilidad

| Marca | Precio | Plazo | Fiabilidad base | Carácter |
|---|---|---|---|---|
| Dörfler | ×1,04 | −4 meses | 0,97 | Bimodos puntuales y caros |
| Schlimmens | ×1,00 | — | 0,95 | Caro y fiable |
| KAFKA | ×1,00 | — | 0,93 | Fiable y de precio medio |
| Tardo | ×1,00 | cartera llena | 0,92 | Especialista en ancho variable |
| Malstom | ×0,95 | cartera enorme | 0,90 | |
| BCBB | ×0,76 | −8 meses | 0,82 | Barato y rápido, con riesgo político |

- **Fiabilidad de una unidad** = la de su marca × el ajuste de su modelo × (1 − 0,004 por cada año por encima de 25) × f(estado).
- Las 6 marcas tienen logotipo en `brands.js`. El constructor exige **exactamente 6 logotipos distintos**.

### 6.3 Unidades, taller, maquinistas y personal de estación

**Unidades con nombre** (F6).
- Cada lote del clásico guarda ahora sus unidades, cada una con nombre: «S-592 La Abuela», «S-449 Pucela». **El lote se queda** como agrupación (mismo modelo y mismo pedido), porque el tutorial lo nombra: «comprueba el lote y sus unidades libres» (`induction:infrastructure:briefing:2`). Hasta F6, las revisiones y las averías se aplican al lote.
- Cada unidad guarda su modelo, edad, estado, fiabilidad, averías, en qué relación está, si está en el taller y **quién avisó de ella y cuándo**.
- Al migrar, cada lote se reparte en unidades con una función pura. La prueba comprueba que se conservan los totales, los estados y las asignaciones, y también las reglas de compra: 30 % al pedir, 70 % a cada entrega y hasta 2 unidades al mes.

**Averías.**
- Probabilidad diaria por unidad = `(1 − fiabilidad) × 0,05/7 × (1 + (100 − estado)/50) × (1 + 0,5·[recorre una rampa o un tramo con calor en temporada])`.
- Siempre se sitúan en una unidad y un tramo, y salen en el parte del día.
- Las averías silenciosas desaparecen.

**Taller.**
- Plazas: 4 en la situación 2022 y 2 en la de 2027. Se suma una por cada etapa del megaproyecto Gran Taller y otra con el paquete «Taller propio».
- La **revisión** de una unidad cuesta el 1 % de su precio más 0,05 M€ (abajo), dura 3 semanas (2 con la investigación «Contrato de mantenimiento») y la deja al 95 %.
- La **reforma** dura 5 meses, cuesta el 12 % del precio (como en el clásico) y añade wifi, portaequipajes o accesibilidad.
- Las **adaptaciones**: la 449 a 2T (supuesto del juego, 1,5 M€ y 6 meses).
- Si no hay plaza libre, se forma cola. Con el taller lleno durante 8 semanas se puede ofrecer el «turno de noche» (+0,02 M€ a la semana, una semana menos por revisión y desgaste ×0,8) y crece el riesgo de `event:workshopfire`.
- **Coste de una revisión** = 1 % del precio nuevo del modelo + 0,05 M€ (un 449, 0,13 M€; un S730, 0,35 M€). **Coste esperado de una avería en línea** = arreglo rápido 0,15 M€ + remolque 0,05 M€ + 2 días de ingresos de esa unidad. Las dos cifras salen en el detalle de las opciones del tema 2 de los encuentros (§8.5).

**Cuadrillas** (F8; existen en el estado desde F6 con valor 0, sin uso):
- Una cuadrilla propia cuesta 0,05 M€ a la semana, trabaje o no (va en la línea «Cuadrillas» del panel Dinero).
- Una **contrata** cuesta 0,075 M€ a la semana (×1,5) y se contrata por meses desde el hito 2. Se contrata en Red › Obras (§11.3).
- La **guardia**: una cuadrilla libre atiende la respuesta «Equipo» a una incidencia por 18.000 € 🔒. Sin ninguna libre, la presta una contrata por 54.000 €.

**Maquinistas** (la bolsa existe desde el clásico; jubilaciones, horas extra y cancelaciones ordenadas llegan en F6).
- Necesidad = ⌈circulaciones diarias × 0,55⌉, como en el clásico (`tycoon.js:11`).
- Al empezar sobra plantilla 🔒: 180 frente a 29.
- El contrato de Media Distancia trae los maquinistas que necesita multiplicados por 1,05.
- **Jubilaciones:** se jubila uno el día 1 de cada mes par.
- **Contratar:** lotes de 20 por 0,3 M€ 🔒, con 3 meses 🔒 de formación.
- **Sin cobertura, se cancelan circulaciones**: primero las primeras salidas de las relaciones más grandes, y nunca se deja un esencial a cero. Cada cancelación sale en el parte.
- **Horas extra** (tema 0 de los encuentros, opción A): durante 4 semanas no se cancela nada en la relación nombrada, a 4.000 € por circulación cubierta y día.

**Personal de estación** (F6).
- **Categorías.** Las estaciones de capital de provincia y las de más de 40.000 viajeros al mes son de categoría A o B: siempre tienen personal de Adif y no entran en esta mecánica. Las demás estaciones con relaciones propias son de **categoría C**.
- Una estación C puede tener personal de Tenfe: 0,003 M€ a la semana, con un mínimo de 26 semanas, renovable.
- Con personal, la demanda de sus relaciones es ×1,03; con atención centralizada (la decisión explícita de no ponerlo, tema 3 opción B), ×0,98 durante 26 semanas.
- **Viajeros de una estación** = la suma, en sus relaciones, de los que suben y bajan en ella. Una estación C es **concurrida** si tiene 6.500 viajeros al mes o más (§8.2).
- **Accesibilidad.** Cada estación C tiene la marca `accesible` (sí o no; empieza en «no» salvo en las de nivel ≥ 1). La **obra menor de accesibilidad** la hace una contrata: 0,4 M€ y 2 semanas, **sin usar ninguna cuadrilla**. Deja la estación `accesible`, con +2 % de demanda permanente en sus relaciones. Se puede encargar desde la ficha de la estación, y la ofrece Benito en el tema 3 (§8.5).
- Lo necesitan el tema 3 de los encuentros («El andén olvidado») y la petición de Benito.

### 6.4 Cómo se ve la compatibilidad

- **Trenespop abierto desde una relación** (tecla T con la ficha abierta) se titula, por ejemplo, «Para Extremadura · IB · sin catenaria 268 km + 25 kV 209 km · máx. 200». Agrupa los modelos en tres bloques:
  - **✓ Pueden circular**, con los minutos y el tramo que limita;
  - **◐ Con cambiador** (+12 min);
  - **✗ No pueden**, con el primer motivo y el remedio: «Ancho estándar: la vía es ibérica · Ver VAR ›» o «268 km sin catenaria · Ver obra ›».

  Se puede comprar un tren incompatible, porque quizá estás planeando una obra, pero hay que confirmarlo.
- **En cada anuncio:** «Circula en: Norte, Levante +2» o «No circula en tu red: ancho estándar».
- **En el mapa:** al pasar el ratón por un modelo, cada tramo se pinta de verde si puede circular, ámbar si es con cambiador y gris si no.
- **En la ficha de la relación:** la tira de tramos coloreada para el modelo elegido y el bloque **«Qué puede circular»** 🔒, con los motivos.
- **Herramienta «¿Puede pasar?»** (Red, tecla P): eliges un modelo y dos estaciones, y el mapa pinta el camino o el primer tramo que lo bloquea, con la obra que lo arreglaría.
- **Barrido semanal:** si una obra o un traslado deja una unidad donde no puede circular, sale de la relación y se avisa. El planificador ya lo había anunciado antes de encargar.

### 6.5 Trenespop

| Tipo de anuncio | Reglas |
|---|---|
| **Nuevo de fábrica** (F1 sin dados; F6 con cartera) | <ul><li>Un anuncio por modelo a la venta.</li><li>Se paga el 30 % al pedir y el 70 % a cada entrega. Se entregan **hasta 2 unidades al mes**, como en el clásico.</li><li>Plazo = plazo base + cartera de la marca / su capacidad mensual.</li><li>**Se acaba el 28 % de retraso al azar:** solo hay retraso si la cartera crece después de pedir, y se anuncia con su causa («KAFKA acumula 60 unidades: tu pedido se retrasa 3 meses»).</li></ul> |
| **Usado** (F6; antes, el stock fijo del clásico) | <ul><li>De 1 a 3 anuncios a la semana, deterministas a partir de `(semilla, semana)` (`adsOfWeek`, de `trenespop-reutilizacion.md` §6). Mirar es gratis.</li><li>Estado según la edad; precio según edad y estado; entrega en 0–6 meses.</li><li>A veces sale un señuelo incompatible, como un ancho métrico.</li></ul> |
| **Stock** (F6) | Pedidos que otros operadores cancelaron. Llegan en 1–3 meses |
| **Oferta relámpago** | `event:secondhand` publica de verdad 4 S112 al 80 % por 60 M€, con entrega inmediata, aviso de compatibilidad y 4 semanas de plazo |
| **Preestreno de marca** (OpenTTD; F6) | 1 o 2 al año, sembrados: −25 % en 2 unidades a cambio de empezar con fiabilidad 0,62, que sube sola. Si lo rechazas y OuiOui está activo, lo estrena el rival |
| **Licitación** (F2) | `decision:futuretender` abre las pujas de 5 marcas con precio, plazo, tensiones y ancho |
| **Comisión** (cloacas, F9) | Íñigo, como Conseguidor, ofrece en voz alta (`cor-comision`) un 7 % 🔒 sobre **ese** pedido. Crea un secreto con importe, marca y testigos |
| **Alquiler** (F6) | 470 o 599 durante 13 semanas, sin señal |

**Lo que se aprovecha de `marketplace.js`:** la capa de presentación, con atributo, identificadores y formato de dinero como parámetros (`trenespop-reutilizacion.md` §1), las marcas de `brands.js` y las fotos de `assets/train-photos`.

### 6.6 Flota inicial y contrato OSP de Media Distancia (de A; F5)

**Situación 2022.** En enero, Tenfe solo tiene las 80 unidades AVE y Alvia del clásico. Así siguen siendo ciertas «solo sirve hoy nuestro Alvia híbrido S730», «media flota parada» y «hoy sobra cobertura».

- **El contrato OSP llega después del tutorial.** Raquel lo ofrece el primer lunes después de terminar la inducción o de saltarla (voz `osp-oferta-m`).
  - Es un **desbloqueo como los de Cities**: la Media Distancia de esta España paródica la gestiona hasta entonces «Tenfe Proximidad, en liquidación», una sociedad del Ministerio.
- **Si firmas, recibes:**
  - las 11 relaciones de Media Distancia (§5.5), con su horario sintético y su tarifa de referencia;
  - unas 52 unidades:

    | Modelo | Unidades | Dónde |
    |---|---|---|
    | 449 | 10 | Norte, Levante, Sur |
    | 470 | 12 | Norte, Mediterráneo, Ebro, Cantabria |
    | 463 y 465 | 8 | Mediterráneo, Ebro, Asturias |
    | 592 | 6 | Soria, Teruel |
    | 594 | 4 | Galicia |
    | 599 | 8 | Extremadura, Teruel, Galicia |
    | 121 (`s120`) | 4 | Galicia, a 25 kV ibérico |

  - los maquinistas que hacen falta, multiplicados por 1,05;
  - la OSP por tren-km y la **penalización de los esenciales**.
- **Los territorios empiezan mal servidos.** Extremadura, Teruel y Soria tienen 1 salida por sentido con diésel viejo; Cantabria, 2. Así hay trabajo de Territorio desde el principio, y es cierto «Ya no hay excusa para el tren de museo» (`decision:extremadura`).
- **Si rechazas,** el Ministerio la sigue gestionando sin que tú la controles, y te la vuelve a ofrecer cada 12 meses (`osp-oferta-m` u `osp-oferta-s`, según quién esté en el cargo).
  - Mientras tanto, todo lo que depende de la Media Distancia calla: Marisa en el Norte, los esenciales, los territorios.
- **El traspaso no regala objetivos.** Al firmar se guarda una foto, `traspasoMD = {dia, relaciones: [ids], circulacionesDia, viajerosMes}`, con los datos de los 3 meses anteriores de «Tenfe Proximidad». Cada relación traspasada lleva `origen: 'traspaso-md'`; las 8 iniciales llevan `origen: 'inicial'` y las que abre el jugador, `origen: 'propia'`. Con eso:
  - **Primer encargo** (§4.8): viajeros del mes − `traspasoMD.viajerosMes`, frente a la misma línea base de enero de 2022.
  - **Acto I** («12 servicios en marcha, +4 sobre los 8 iniciales»): solo cuentan las relaciones con `origen` `inicial` o `propia`. Las 11 traspasadas no suman; una relación de Media Distancia que el jugador abra después sí.
  - **Acto II** («260 circulaciones al día»): circulaciones diarias − `traspasoMD.circulacionesDia`. Las salidas que el jugador añada a las relaciones traspasadas sí cuentan.
  - **Hitos** (§7.11.3): la línea base se recalcula al firmar sumándole `traspasoMD.viajerosMes`.
  - La ficha de cada objetivo lo dice en una línea: «Sin contar lo traspasado: 9.400 de 61.000».
  - `partida-test` firma el contrato el primer lunes y comprueba que ni el encargo, ni el Acto I, ni el Acto II, ni un hito cambian de estado ese día.

**Situación 2027.** Unas 30 unidades de Media Distancia viejas (con nombre desde F6), casi todas asignadas y una de reserva («no hay trenes»). El Norte tiene 6 unidades y su vía entre Ávila y Medina está al 44 %, con LTV.

---

## 7. D5 · Rejugabilidad: que ninguna partida sea igual

### 7.1 Pantalla «Nueva partida»

Una sola pantalla con seis filas (boceto en §11.7 C). Situación, semilla y reglas de maqueta llegan en F1; rasgo, dificultad y modificadores, en F3:
1. **Situación:** tarjetas con chips de caja, deuda, edad de la flota, % electrificado, apoyo y meses hasta las elecciones.
2. **Semilla:** un texto, el botón «Aleatoria» y el **código para compartir**, que lleva situación, dificultad, rasgo, modificadores, reglas y semilla. Por ejemplo, `TNF-7K2Q-RX41-0H3M2A`. El mismo código sale en la pantalla final.
3. **Tu rasgo** como presidente de Tenfe: 1 de 8.
4. **Dificultad:** Fácil, Normal, Difícil o Infernal, y «Personalizar».
5. **Modificadores:** de 0 a 3.
6. **Reglas de maqueta** (el antiguo modo libre), plegadas. Si marcas cualquiera, aparece «Medallas y retos desactivados».

Debajo, una línea dice lo que trae la semilla sin destripar las agendas. Por ejemplo: «Norte y Sur cansados · una comunidad hostil · OuiOui madruga en el Levante».

### 7.2 Situaciones (2022 desde F1; las de 2027, en el motor único desde F5)

| Situación | Inicio | Caja / deuda | Lo que la distingue | Voces propias |
|---|---|---|---|---|
| **2022 · Tenfe real** (por defecto; la primera vez trae el tutorial) | 3-1-2022 | 500 / 0 | <ul><li>La historia real hasta 2026.</li><li>Cinco actos.</li><li>Raquel y después Óscar.</li><li>Elecciones en 2023 y cada cuatro años.</li><li>Contrato OSP de Media Distancia.</li><li>Veredicto al cerrar el «último gran mandato» (2051 si no hay adelantos).</li></ul> | <ul><li>Tutorial (50).</li><li>Las 9 decisiones históricas.</li><li>Los 5 capítulos.</li><li>`osp-oferta`.</li><li>`legacyvote`.</li><li>`veredicto-*`.</li></ul> |
| **2027 · Rescate** | 4-1-2027 | 60 / 1.200 | <ul><li>Quiebra técnica.</li><li>Prueba de 13 semanas.</li><li>El Norte en rojo.</li><li>Cinco etapas.</li><li>La alta velocidad es de OuiOui.</li><li>Elecciones en 2030 y 2034.</li></ul> | <ul><li>`t-1` a `t-7`.</li><li>`stage-*`.</li><li>`s1-fallo`.</li><li>`end-*`.</li></ul> |
| 2027 · Crisis de deuda | 4-1-2027 | 30 / 1.700 | Interés +0,1 puntos al mes; Hacienda empieza en 30 | las del rescate |
| 2027 · Fondos europeos | 4-1-2027 | 60 / 1.200 | Subvención ×1,5 durante 2 años si dos relaciones pasan a ancho estándar o a 25 kV | las del rescate |
| 2027 · Huelga general | 4-1-2027 | 60 / 1.200 | Plantilla en 25; huelga convocada para la semana 6 | las del rescate |
| 2027 · Herencia envenenada | 4-1-2027 | 45 / 1.400 | Dos obras grandes a medias con pagos pendientes; OuiOui ya compite en el Levante | las del rescate |

### 7.3 Qué decide la semilla

**En la situación 2022, la historia hasta 2026 es fija:** aperturas, adelanto electoral, entrada de los rivales, S106 y presupuestos prorrogados. La semilla decide todo lo demás:

| Área | Qué sortea | Cuándo lo ve el jugador |
|---|---|---|
| Mercado | Anuncios de usados, ofertas relámpago, preestrenos y pujas | Cada semana, en Trenespop |
| Personas | La **obsesión** de cada líder (1 de 3) y su **agenda** (2 de 4 disparadores) (§7.8.2); una comunidad amiga (+15) y una hostil (−15) | Al revelarse: con su primera petición o con una Audiencia |
| Calendario (después de 2026) | Entrada de OuiOui y YaIré en cada eje (±2 años); 0–2 recesiones; la fuerza de la ola de calor de cada verano; una gran nevada como mucho por década; ventanas de fondos europeos; la cola de fábrica (2038–2044); choques de energía | 12 meses por delante en Progreso › Calendario |
| Red (situaciones de 2027) | Qué 3–5 tramos empiezan cansados (35–60 %) | Al empezar, en la capa Estado |
| Demanda | 2 o 3 regiones en auge | Capa Viajeros |
| Política | Viento político de ±3 puntos en cada elección, anunciado un año antes; pesos de los grupos ±0,03 | Despacho › Apoyo |
| Retos | 3 de un banco de 20 | Al empezar, como medallas oscuras |
| Cartas | El mazo del Consejo de Ministros | Cada trimestre |
| Comarcas | La especialidad de cada comunidad (turismo, negocio, regional o alta velocidad), que cambia su demanda y sus peticiones | Red › Territorios |

**Formato del código:** `TNF-SSSS-SSSS-OOOOOO` en base 32 de Crockford (sin letras ambiguas). Los dos primeros bloques llevan la semilla (35 bits) y una suma de comprobación (5 bits). El tercero lleva las opciones (30 bits): situación (3), dificultad (2), rasgo (4, con «ninguno»), modificadores como máscara de 10 bits, reglas de maqueta como máscara de 10 bits y uno de reserva. Si todas las opciones son las de por defecto, el tercer bloque se omite. Si se personalizan los deslizadores, se añade un sufijo `-P…`. El reto semanal no necesita código: su semilla y sus opciones salen de la semana ISO.

### 7.4 Rasgos del presidente de Tenfe (elige 1; F3)

**Regla:** un rasgo nunca cambia una constante 🔒. La tarjeta solo enseña los efectos que ya existen en esa versión del juego (bandera `mecanicas`).

| Rasgo | A favor | En contra |
|---|---|---|
| Ferroviario de carrera | Plantilla +10; revisiones −20 % de coste | Gobierno −5 |
| Exbanquero | Interés −0,1 puntos al mes; Hacienda +10 | Plantilla −10 |
| Inaugurador compulsivo | Gobierno +4 por cada obra terminada | Obras +10 % |
| Tecnócrata | Obras −10 % | Territorio −8 |
| Tuitero | Viajeros +5; escándalos −20 % | Hacienda −5; sucesos virales ×1,5 |
| Negociador | Una contraoferta más al renegociar (3) | Los ultimátums duran 9 semanas en vez de 13 |
| Ecologista | Electrificar −10 %; una ventana de fondos europeos más | Energía diésel +15 % |
| Comisionista | Comisiones +5 puntos (cloacas) | Sospecha +50 % |

Ojo con «Negociador»: la voz `ult-*` dice «tres meses» 🔒. Con este rasgo, el ultimátum se comunica con una variante escrita y **sin voz**.

### 7.5 Dificultad (F3)

Cuatro preajustes de 6 deslizadores, más «Personalizar»:

| Deslizador | Fácil | Normal | Difícil | Infernal |
|---|---|---|---|---|
| Fondos europeos (ventanas) | +1 | 0 | −1 | −2 |
| Exigencia de los grupos (umbral de ultimátum) | 20 | 25 | 30 | 35 |
| Oposición (puntos que restan al voto) | 0 | −2 | −4 | −6 |
| Imprevistos (multiplicador de riesgo) | ×0,5 | ×1 | ×1,25 | ×1,5 |
| Sindicatos (umbral de huelga) | 30 | 35 | 40 | 45 |
| Listón europeo (pendiente anual) | ×0,7 | ×1 | ×1,2 | ×1,4 |
| Multiplicador de puntuación | ×0,8 | ×1,0 | ×1,25 | ×1,6 |

### 7.6 Modificadores (de 0 a 3; F3, cada uno cuando existe su sistema)

Ninguno cambia una constante 🔒. Si un modificador apaga un sistema, el director deja de elegir las voces que dependen de él.

| Modificador | Efecto | Puntuación |
|---|---|---|
| Verano tórrido | Olas de calor ×1,5 de fuerza | +10 % |
| Invierno largo | Ventana de nieve más larga | +5 % |
| Catenaria cara | Electrificar +50 % | +10 % |
| Ancho ibérico para siempre | Prohíbe la obra «Ancho estándar» (el tercer carril sí se permite) | +10 % |
| Prensa hostil | Escándalos y titulares negativos ×1,5 | +5 % |
| Austeridad | Obras y mantenimiento +25 %; demanda −10 % | +15 % |
| Fabricante en quiebra | Una marca cierra en un año sembrado: deja de aceptar pedidos y sus repuestos cuestan ×1,5 | +5 % |
| OuiOui madrugador | A partir de 2026, OuiOui entra en cada eje 2 años antes | +10 % |
| Tarifa social | Tarifas con tope en la de referencia; OSP +10 % | 0 % |
| Ministerio en funciones | Consejo de Ministros con una sola carta; transferencias −10 % | +10 % |

### 7.7 Reglas de maqueta (el modo libre, absorbido; F1)

- **Las casillas:**
  - caja: 500, 1.500, 5.000 M€ o ilimitada;
  - sin rivales;
  - sin elecciones, o «perder no termina»;
  - sin cese;
  - sin final (prórroga desde el principio);
  - sin imprevistos;
  - todo desbloqueado;
  - sin cloacas;
  - sin historia con fecha: las aperturas reales ocurren, pero sus decisiones no suenan;
  - sin tutorial.
- Hay un botón **«Seleccionar todo»**.
- **Cualquier casilla marcada convierte la partida en «Maqueta»**, sin medallas ni retos, como en Cities, donde los mods desactivan los logros.
- Cada casilla quita las voces que dependen de ella. Por ejemplo, con «Sin rivales» no se eligen las escenas de Íñigo sobre su cuota, y con «Caja ilimitada» no suenan `fin-impago` ni `fin-concurso`.

### 7.8 Facciones y Gobierno (Tropico; elecciones y grupos en F5, el resto en F7)

#### 7.8.1 Grupos, pesos y notas

| Grupo | Peso en el voto | Cara | Qué mide su objetivo | Si se le desatiende (ultimátum, §7.8.4) |
|---|---|---|---|---|
| Viajeros | 0,34 | Marisa | <ul><li>Puntualidad de las últimas 4 semanas, ponderada por viajeros.</li><li>Viajeros de pie.</li><li>Tarifa frente a la de referencia.</li><li>Incidencias.</li><li>Promesas a los viajeros.</li></ul> | **Reclamación colectiva**: devoluciones por retraso obligatorias durante 12 meses |
| Territorio | 0,20 | Paco | <ul><li>Territorios servidos.</li><li>Estaciones con personal.</li><li>Catenaria en los territorios.</li><li>Convenios cumplidos.</li><li>La parada de Villanueva.</li></ul> | **Moción en el Congreso**: OSP −15 % durante 12 meses |
| Plantilla | 0,20 | Fermín | <ul><li>Cobertura de maquinistas.</li><li>Horas extra crónicas.</li><li>Nómina.</li><li>Cola del taller.</li><li>Recortes.</li></ul> | **Huelga** (`event:strike`) con servicios mínimos reales: se cancela el 50 % de las circulaciones AVE y el 25 % de las OSP |
| Hacienda | 0,26 | Charo | <ul><li>Resultado de 12 meses.</li><li>Caja por encima de la reserva.</li><li>Deuda frente a ingresos.</li><li>Gasto injustificado.</li></ul> | **Intervención** durante 12 meses: crédito congelado y obras de más de 20 M€ bloqueadas |
| **Gobierno** (no vota: es tu jefe) | — | Pedro y quien ocupe el Ministerio | <ul><li>Inauguraciones de las últimas 26 semanas.</li><li>Encuesta.</li><li>Escándalos.</li><li>Compromisos con el Gobierno.</li><li>Puesto en el Operador del Año.</li></ul> | Sin ultimátum. «Último aviso» a 20 (`gobierno-aviso`) y **cese** con 6 cierres por debajo de 15 |
| Adif (proveedor) | — | Benito | Relación de 0 a 100 | Por debajo de 30, permisos ×1,5 durante un año |
| Competencia | — | Íñigo | Tu cuota frente al autobús | Guerras de precio y, en las cloacas, extorsiones |

- **Dinámica:** cada lunes, cada grupo se mueve un 7 % hacia su objetivo, como en el rescate. Con el motor mensual (F5) se aplica al cierre de mes como `1 − 0,93^semanas` del mes.
- **Notas en dos niveles** (Airport CEO): cada grupo enseña su valor de la semana y su media de 26 semanas. **La media es la que vota.**
- **«¿Por qué?» de cada grupo** tiene tres partes:
  - **gestión**: las causas de su fórmula, como «Norte 64 % −9 · tarifas +4»;
  - **listón europeo**: la comparación con la media europea, que sube cada año;
  - **confianza**: lo que restan las promesas rotas y los escándalos.

#### 7.8.2 Líderes: obsesión y agenda (B y C; F7)

Cada líder trae una **obsesión** (1 de 3, por semilla, oculta) y una **agenda** (2 de 4 disparadores de oferta, por semilla).
- La obsesión **duplica el peso** de un componente en la fórmula de su grupo.
- Se revela con su primera petición o pagando una **Audiencia** (§7.8.5).

| Líder | Obsesiones (1 de 3) | Agenda (2 de 4 disparadores → oferta) |
|---|---|---|
| Marisa | Puntualidad del Norte · Precios · Comodidad (wifi, maletas, aire) | <ul><li>Esenciales por debajo de 80 y Viajeros por debajo de 40 → `marisa-carta`.</li><li>Ola de calor con una unidad vieja → `ev-aire`.</li><li>Una relación con 95 % o más → `event:influencer`.</li><li>Ocupación de larga distancia por encima del 85 % → `event:luggage`.</li></ul> |
| Paco | Estación en Villanueva · Tren diario en las comarcas · Catenaria para la comarca | <ul><li>Villanueva sin parada y Territorio por debajo de 45 → `decision:rural` (desde 2024).</li><li>Una obra en su comarca → «sobre al alcalde» (cloacas).</li><li>Elecciones a menos de un año → petición «tren temprano».</li><li>Villanueva sin parada y Territorio por debajo de 50 → `event:mayorchain`.</li></ul> |
| Fermín | Convenio · Taller · Contratar | <ul><li>Plantilla por debajo de 45 → `fermin-convenio`.</li><li>Taller lleno 8 semanas → «turno de noche».</li><li>Diciembre → `cor-mariscada`.</li><li>Flota con estado medio por debajo de 50 → petición «revisión».</li></ul> |
| Charo | Deuda · Resultado · Colchón de caja | <ul><li>Dos trimestres en negativo → `charo-contrato`.</li><li>Gasto injustificado → `event:audit`.</li><li>Enero sin presupuestos → `event:freeze`.</li><li>Caja libre (caja − pagos de 13 semanas) de 2·G o más durante 8 semanas, con deuda → petición escrita «amortiza deuda» (G, §8.2: unos 55 M€ en 2022).</li></ul> |
| Benito | — (Adif no vota) | <ul><li>Sin cuadrillas libres y vía por debajo de 50 → `benito-cuadrilla`.</li><li>Primera renovación → `cor-traviesas`.</li><li>Obra adelantada → `event:adifboost`.</li><li>Tramo con yacimiento → `event:adifdelay`.</li></ul> Si se le cesa, su agenda desaparece con él (§3.7) |
| Pedro | Inauguraciones · Encuestas · Europa (ERTMS y puesto europeo) | <ul><li>Territorio por debajo de 40 y elecciones a menos de 2 años → `pedro-cohesion`.</li><li>Encuesta en 52 o más → adelanto (`event:election`).</li><li>AVE al 90 % o más → `event:royal`.</li><li>Tras ganar en 2047 → `decision:legacyvote`.</li></ul> |
| Raquel u Óscar | — (portavoces del Gobierno) | <ul><li>Elecciones a menos de 14 meses y sin inaugurar en 26 semanas → `raquel-inauguracion` u `oscar-tuits`.</li><li>Retraso viral → `event:tweet` (solo Óscar).</li><li>Sobrino → `cor-enchufe-m` o `-s`.</li></ul> |
| Íñigo | — | <ul><li>Extremadura y Soria o Teruel con una salida por sentido o menos → `inigo-noagresion`.</li><li>Empieza su campaña de autobuses → `event:busprice`.</li><li>Pedido a BCBB → `cor-yate`.</li><li>Sospecha por encima de 18 con fotos → `ext-inigo`.</li></ul> |

Los pactos y las peticiones **aparecen cuando su disparador es cierto**, no con el 9 % semanal del rescate.

**Antes y después de F7.** Hasta F7 no hay agendas: cada disparador de la tabla funciona solo por su condición (si su mecánica existe). Desde F7, de cada líder solo funcionan los 2 disparadores sorteados; un cuerpo clásico que no está en la agenda de una partida no suena en ella. Se excluyen del sorteo, y suenan siempre que su condición sea cierta, los hechos con fecha histórica (el adelanto electoral de 2023 y los presupuestos prorrogados de 2024) y `decision:legacyvote`. Es una de las razones por las que cada partida suena distinta, y la prueba `alcance` comprueba que en 40 semillas todos siguen saliendo.

#### 7.8.3 Peticiones dobles (B; F7)

- **Cuándo.** Una misma semana hay dos escenas ciertas, de dos personas distintas, que cumplen a la vez:
  - son **del mismo tema** y del mismo **asunto** (columna «Asunto» de la tabla de §8.5: `maquinistas`, `tarifa-rival`, `unidad`, `estacion` o `piloto`);
  - tienen **la misma instancia**: la misma relación, unidad, estación o tecnología, o, en `tarifa-rival`, un conjunto de relaciones que se solapa;
  - las dos personas **prefieren opciones opuestas** (columna «Prefiere» de §8.5).

  No hay una lista de parejas fijada a mano: salen de esa tabla. Las posibles son, por ejemplo, Marisa, Paco, Raquel o Pedro frente a Charo o Íñigo en `maquinistas`; Pedro u Óscar frente a Charo, Raquel, Fermín, Benito o Íñigo en `tarifa-rival`; Fermín, Marisa, Charo, Raquel o Paco frente a Íñigo en `unidad`; Marisa, Raquel, Benito o Paco frente a Íñigo en `estacion`; y cualquiera frente a Íñigo en `piloto`. Asuntos como `taller` (Fermín, tema 0), `guardia` (Benito, tema 0) o `reserva` (Fermín, tema 3) solo los tiene una persona, así que nunca forman pareja.
- **Qué pasa:** suenan las **dos tomas seguidas** y el jugador elige a quién atender. Hay dos opciones:
  - «Atender a X» aplica **la opción que prefiere X**, con los efectos de **su** fila en §8.5;
  - «Atender a Y» aplica la que prefiere Y, con los de la suya.
- **Efectos en la confianza:** quien es atendido gana +5 en su memoria (un favor) y el otro pierde −3 (un agravio). Se suman a los efectos de la fila.
- **Límites:** como mucho una petición doble cada 13 semanas. Se gastan los dos cuerpos, cada uno se oye una sola vez y los dos cuentan para los enfriamientos.
- **Ejemplo con cuerpos ya grabados** (asunto `maquinistas`, instancia «Norte»: faltan maquinistas y esta semana se ha cancelado la primera salida del Norte):
  - Marisa, enfadada (`scene-riders-angry-0`): «¡Vete tú a esperar tres horas de pie, caradura! El primer tren nos deja tirados si no hay relevo. No somos figurantes de tu horario.»
  - Charo, preocupada (`scene-treasury-worried-0`): «He visto la caja y se me ha cortado hasta el café. Las horas extra no se pagan con entusiasmo. Saca la cartera o ajusta la oferta.»
  - «Atender a Marisa» = su opción A: horas extra 4 semanas en el Norte, a 4.000 € por circulación cubierta y día.
  - «Atender a Charo» = su opción B: se retiran para siempre las salidas que no se pueden cubrir, empezando por las de menor neto por tren y sin dejar ningún esencial a cero.

#### 7.8.4 Ultimátums con castigo propio (B; F7)

- **Cuándo:** un grupo pasa 8 semanas por debajo del umbral de la dificultad (25 en Normal).
- **Cuenta atrás:** 13 semanas 🔒 («tres meses»). Se ve en Misión y en la ficha del grupo.
- **Se levanta** si el grupo sube a 35 o más, o si cumples la petición de su obsesión.
- **Si vence:** se aplica el castigo de la tabla de §7.8.1 durante 12 meses.
- **Voces:** `ult-viajeros`, `ult-territorio`, `ult-plantilla`, `ult-hacienda`. La de Plantilla anuncia una huelga que luego ocurre: con la voz de `event:strike` si no ha habido convenio en 10 años y, si lo ha habido, como tarjeta escrita «Huelga» con las mismas opciones (§7.9).

#### 7.8.5 Audiencia (F7)

- Cuesta 2 ◆ y se puede pedir una vez al año.
- Revela la obsesión de los dos grupos peor tratados y saca su petición si hay alguna escena cierta.
- Si no la hay, el juego lo dice: «Nadie tiene nada que pedirte ahora». El silencio es honesto.

#### 7.8.6 Consejo de Ministros (cada trimestre, sin voz; F7)

- **Cuándo:** el primer lunes de enero, abril, julio y octubre.
- **Qué ofrece:** 2 cartas; con el Gobierno en 70 o más, 3; por debajo de 35, una sola y con condiciones. Eliges una o pasas.
- **Carta extra:** cuesta 1 ◆.
- **Qué son las cartas:** una línea de efecto que el motor aplica, y que solo menciona cosas que existen. Ejemplos:
  - **Licitación exprés:** −30 % en tu próxima obra de catenaria; Adif −5.
  - **Préstamo blando:** +100 M€ de techo de crédito al 0,2 % durante 3 años.
  - **Lote cedido:** 2 unidades usadas compatibles con tu red; Plantilla −2.
  - **Adelanto de fondos:** la próxima ventana europea se abre ya.
  - **Ley de acompañamiento:** OSP +10 % durante 12 meses; Hacienda −5.
  - **Foto del ministro:** tu próxima inauguración vale el doble para el Gobierno.
- **Quién decide el mazo:** el estado, la semilla y quién ocupa el Ministerio (el mazo de Raquel premia inaugurar; el de Óscar, la puntualidad).

#### 7.8.7 Medidas: Estatuto y políticas (Tropico; F7)

**Estatuto de Tenfe.** Tiene 4 artículos y se puede revisar una vez por legislatura, después de ganar unas elecciones.

| Artículo | Opciones | Efecto |
|---|---|---|
| 1. Misión | Servicio público / Comercial | OSP de 2,2 o 1,6 €/tren-km y transferencia de 3,5 o 2 M€. Lo fija `decision:inaugural` 🔒 |
| 2. Tarifas | Social / Plana / Dinámica | Demanda +6 % y tarifa −8 % · referencia · ingresos +4 % y Viajeros −3 |
| 3. Mantenimiento | Propio / Mixto / Externalizado | Coste base · −1 % · −2 %, con desgaste y Plantilla − (la política clásica `outsource`) |
| 4. Transparencia | Opaca / Auditada / **Portal abierto** | Cloacas más baratas y escándalos peores · normal · **cloacas desactivadas**, Gobierno +3 y Bruselas + |

**Políticas** (las `POLICIES` del clásico, ahora en huecos).
- Son cartas que van en huecos: 3 al empezar, +1 en el hito 5 y +1 en el hito 9.
- **Ganan efecto con el tiempo:** ×0,5 al principio, ×1 a los 6 meses y ×1,25 a los 12 meses.
- Cada carta lleva chips de grupo (+/−).
- La voz `induction:competition:briefing:0` dice «Una política actúa ya y cobra cada mes» 🔒. Por eso el ×0,5 se aplica desde el primer día (actúa ya) y el coste mensual se cobra entero desde el primer mes.

**Lista de políticas:**
- Abono joven
- Wifi gratis
- Devoluciones por retraso
- AVArato (desde el hito 4)
- Prioridad puntualidad
- Vigilancia de cable
- Actualización de tarifas (IPC)
- Campaña de imagen (1 ◆ al mes)

#### 7.8.8 Elecciones (F5), mitin y elección de ministro (F7) y noche electoral

- **Voto** = Σ (media de 26 semanas de cada grupo × su peso) + viento político − oposición. **Se gana con 50 o más.**
- **Previsión:** se ve todo el tiempo en Despacho › Apoyo, con sus tres componentes. Seis meses antes de unas ordinarias, o el día en que se convoca un adelanto, suena `el-forecast`.
- **Mitin** (Tropico). Ocho semanas antes, Pedro te pide elegir **2 promesas** 🔒 de 6 que tengan sentido en ese momento (voz `mitin`). Ejemplos:
  - «Norte puntual»: Norte en 85 % o más durante 12 meses;
  - «Teruel eléctrico»: obra empezada en 24 meses;
  - «Billetes congelados»: 2 años sin subida;
  - «Tren a [territorio]»: servido en 18 meses;
  - «Sin rescates»: ningún rescate de Hacienda en la legislatura;
  - «AVE a [ciudad]»: en servicio en la legislatura.

  Cada promesa da +4 a su grupo al momento y pasa a ser un **compromiso** de la legislatura siguiente. Romperla cuesta Gobierno −10 y −8 a su grupo.
- **Noche electoral** (una sola pantalla): resultado (`el-win` si la puntualidad de la red mejoró desde las últimas elecciones; `el-win-2` si no; `el-lose`), elección de ministro y cambio de acto.

#### 7.8.9 Favores ◆ (capital político; F7)

| Se gana | Se gasta |
|---|---|
| +1 por cada mes con el Gobierno en 60 o más | Audiencia: 2 ◆ |
| +2 o +3 por hito | Un punto de negociación: 1 ◆ (+10 % de probabilidad) |
| +3 por acto o etapa cumplidos | Carta extra en el Consejo: 1 ◆ |
| +2 por pacto cumplido | Campaña de imagen: 1 ◆ al mes |
| +3 por ganar el Operador del Año | |

- Tope de 20.
- **Nunca** sirven para investigar, porque el tutorial dice que la investigación cuesta dinero y tiempo 🔒, ni para obras ni para trenes.

#### 7.8.10 Cloacas: el Conseguidor (F9)

- **Qué son:** un tablero de ofertas de Íñigo con su riesgo a la vista.
  - Las ofertas: comisión, traviesas, yate, enchufe, mariscada, sobres (alcalde, inspector, diputados, periodista), soborno al juez y sobre a Charo.
  - **Cuándo:** desde el hito 2. Nunca con la regla «Sin cloacas» ni con «Portal abierto».
- **Registro de secretos:** `{tipo, importe, contrato, tramo, testigos, expuesto}`.
  - **Solo extorsiona un testigo de ese secreto, y con su voz**: Paco, por el sobre; Íñigo, por las fotos del yate; Benito, por las traviesas.
  - Cada escándalo usa su propia línea (`sc-*`), y ningún secreto sale dos veces.
- **Sospecha y pruebas** suben con cada trato y bajan con Transparencia y con el tiempo.
- **Fases judiciales**, cada una con su aviso: diligencias (`jud-1`), imputación (`jud-2`), juicio oral (`jud-3`) y condena e inhabilitación, que acaba la partida (`jud-end`). Si se archiva, suena `jud-archivo`.
- **«Si sale mal, es el final»** es literal: el soborno al juez descubierto lleva directamente a la condena.
- Las tres técnicas de «fontanería» del rescate (contabilidad, abogados y destructora) son mejoras del Conseguidor, no investigación. Cuestan 3, 4 y 5 M€ de caja B y hacen esto: la sospecha baja 0,6 por semana en vez de 0,3; aparece la opción «Mandar a los abogados» en las extorsiones; y las pruebas caen −10 de una vez, una sola vez por partida.
- **Caja B:** lo que entra por comisiones y traviesas va a `cloacas.cajaB` y solo se gasta en el tablero. Pagar algo del tablero con caja A deja factura de «asesoría»: las pruebas de ese trato se multiplican por 1,8.

**Precios y efectos en escala real.** Es lo que enseña el tablero y lo que aplica el motor; `cloacas-test` comprueba que coinciden. La sospecha y las pruebas usan los números del rescate, porque no tienen unidades.

| Oferta (voz) | Cuándo aparece | Si aceptas | Riesgo | Secreto y testigos | Si rechazas |
|---|---|---|---|---|---|
| Comisión (`cor-comision`) | Al pedir unidades nuevas por 10 M€ o más | El contrato sube un 7 % 🔒 y ese 7 % entra en la caja B («una cuenta de Andorra») | Sospecha +6 · pruebas +5 | `comision` {marca, importe, pedido} · Íñigo y la marca | Nada |
| Traviesas (`cor-traviesas`) | Primera renovación en fase de obra | Tenfe paga 2 km de traviesas que ya estaban puestas: la obra cuesta 0,36 M€ más (2 × 0,18 M€/km) y 0,18 M€ van a la caja B | Sospecha +8 · pruebas +6 | `traviesas` {obra, tramo, importe} · Benito | Adif −2 |
| Yate (`cor-yate`) | Hay un anuncio de BCBB en Trenespop | −10 % en ese pedido de BCBB y 3 días de fotos | Sospecha +6 · pruebas +4 | `yate` {pedido} · Íñigo, que tiene las fotos | Nada |
| Enchufe (`cor-enchufe-m` / `-s`) | Está en la agenda del ministro o la ministra | Borja dirige una cuadrilla: sus obras duran ×1,33 mientras siga. +1 ◆ y Gobierno +4 | Sospecha +4 · pruebas +3 | `enchufe` · quien ocupa el Ministerio | Agravio del ministro (§8.9) |
| Mariscada (`cor-mariscada`) | Diciembre | −90.000 € 🔒 cargados a «formación en seguridad»; Plantilla +6 | Sospecha +3 · pruebas +3 | `mariscada` · Fermín | Cena en el bar de la estación: −10.000 €, Plantilla −2 |
| Sobre al alcalde (tablero; suena `paco-sobre` al aceptar) | Desde el hito 2, con una obra en una comarca | 1 M€: permisos municipales ×0,5 durante 8 semanas en esa comarca; Territorio +6. Nace la promesa «arreglar la comarca» (26 semanas) | Sospecha +7 · pruebas +6 | `sobres` {alcalde} · Paco | — |
| Sobre al inspector (tablero) | Una obra en pruebas | 0,8 M€: las pruebas de **esa** obra se dan por buenas esta semana | Sospecha +6 · pruebas +5. Riesgo de `sc-accidente` en ese tramo durante 26 semanas | `sobres` {inspector, obra} | — |
| Sobre al periodista (tablero) | Siempre | 1,5 M€: el próximo escándalo resta la mitad | Sospecha +5 · pruebas +4 | `sobres` {periodista} | — |
| Sobre a los diputados (tablero) | Siempre | 4 M€: +8 M€ en el próximo pago trimestral de la OSP | Sospecha +10 · pruebas +8 | `sobres` {diputados} | — |
| Sobre al sindicato (tablero) | Huelga convocada o Plantilla < 40 | 1,5 M€: se desconvoca la huelga y no se convoca otra en 13 semanas; Plantilla +8 | Sospecha +8 · pruebas +6 | `sobres` {delegado} | — |
| Soborno al juez (tablero) | Con una causa abierta | 5 M€: la causa retrocede una fase. La tirada se guarda al abrir el tablero: 30 % de que lo graben → `sc-juez` y **condena** («Si sale mal, es el final») | Sospecha +14 · pruebas +12 | `juez` | — |
| Sobre a Charo (tablero) | Siempre | 2,5 M€. Tirada guardada: 75 % lo denuncia → `sc-charo` y diligencias; 25 % acepta → +12 M€ el próximo trimestre | Sospecha +20 · pruebas +15 | `charo` | — |

**Extorsiones.** Solo extorsiona un testigo del secreto, con su voz, y como mucho una cada 20 semanas.

| Voz | Solo si… | Opciones |
|---|---|---|
| `ext-inigo` | Secreto `yate` sin publicar (las fotos existen) y sospecha por encima de 18 | **Pagar 3 M€** (de la caja B si llega; si no, de la caja A con factura: pruebas ×1,8): calla, y la próxima vez cuesta el doble · **No pagar**: sale `sc-yate` · **Mandar a los abogados** (con la mejora): tirada guardada al 50 %, calla o lo publica |
| `ext-paco` | Sobre a Paco **y** su promesa «arreglar la comarca» rota | **Cumplir lo de la comarca**: nuevo compromiso, obra empezada o servicio diario en su comarca en 26 semanas; si se vuelve a romper, sale `sc-sobres` sin más aviso · **No**: sale `sc-sobres` |
| `ext-benito` | Secreto `traviesas`, causa abierta y Benito en el cargo | **Subirle el sueldo**: 0,03 M€ al mes mientras siga en el cargo, en la línea «Personal» · **No**: declara, sale `sc-traviesas` y la causa sube una fase |

**Escándalos** (`sc-*`). Suena la línea del secreto expuesto, y ese secreto no vuelve a salir. Opciones:
- **Negarlo todo:** tirada guardada; el 40 % de las veces cuela (daño ×0,5) y si no, daño ×1,5.
- **Cesar a Benito:** solo si es testigo o responsable del secreto. Pruebas −10, Plantilla −4, y Benito se va para siempre (§3.7).
- **Comisión interna:** daño ×0,7 ahora y sospecha +10.
- **Comprar el silencio** del periodista: 1,5 M€ de caja B. Se acaba la noticia y el periodista pasa a ser otro testigo.

El daño de cada escándalo es el del rescate: Viajeros −`golpe`, Territorio −0,6·`golpe`, Plantilla −0,5·`golpe` y Hacienda −0,8·`golpe`, con un `golpe` de 7 a 18 según el caso.

### 7.9 Sucesos con causa, situados en la red (la columna «Fase» dice cuándo llega cada uno)

**Reglas de todos los sucesos:**
- Cada suceso tiene una **causa** que se puede leer, un **sitio** (tramo, unidad, relación o estación) y un **riesgo** que crece con esa causa y se ve en la ficha del sitio («Riesgo de robo de cable: medio»).
- Las tiradas se siembran con `(semilla, día, dominio)`.
- El deslizador «Imprevistos» multiplica los riesgos.
- En el primer trimestre de una partida solo hay sucesos de guion.
- **Lo que pasa siempre** ocurre antes de elegir y no depende de la opción.

| Suceso (voz) | Solo si… | Sitio | Pasa siempre | Fase |
|---|---|---|---|---|
| `event:cable` | Tramo de 3 kV con etiqueta «robo», señalización antigua y sin la política Vigilancia. El riesgo crece de noche | 1 tramo | «Se han llevado tres kilómetros de cable»: LTV ×0,7 e incidencias de señal en **ese** tramo | F8 |
| `event:snow` | Gran nevada sembrada (diciembre a febrero) con 3 o más puertos electrificados con servicio | Los 3 puertos con más tráfico | 14 días sin tensión: los eléctricos no pasan; los bimodos y los diésel, sí | F8 |
| `event:heatwave` | Día de ola de calor (en 2022, la de julio, que es real) con servicio por tramos «calor» | Esos tramos | Carriles a 60 °C: riesgo de deformación | F8 |
| `ev-aire` | Día con 40–44 °C 🔒 y una unidad con estado por debajo de 55 en un tramo «calor» | 1 unidad | Se estropea su aire acondicionado; su ocupación −20 % y Viajeros −1. Opciones en §8.6.1 | F8 |
| `ev-averia-rampa` | Avería de una unidad en un tramo «rampa» | 1 unidad y 1 tramo | La unidad queda tirada; la relación pierde ese tren. Opciones en §8.6.1: 2 días con horas extra o 21 en el taller | F6 |
| `ev-desprendimiento` | Tramo «trinchera» con estado por debajo de 50 en un día de lluvia o de invierno | 1 tramo | **Vía cortada desde que se anuncia**. Opciones en §8.6.1: 3 días con cuadrilla o 12 esperando a la contrata | F8 |
| `event:cows` | Vía única «ganado» sin vallar con un Alvia en servicio | 1 tramo y 1 Alvia | Un retraso de 40 min que ya ha ocurrido | F8 |
| `event:strike` | Plantilla por debajo del umbral de huelga durante 4 semanas, o castigo del ultimátum. Se convoca con 2 semanas de aviso y sale en el calendario. **Con voz solo si** han pasado 10 años o más desde el último convenio (`personal.ultimoConvenio`; lo ponen al día la opción «Negociar el convenio» y el pacto `fermin-convenio`); si no, tarjeta escrita «Huelga» con las mismas opciones | Toda la red | Huelga convocada en una fecha | F1 |
| `event:wifi` | Política Wifi apagada y flota de larga distancia con estado medio por debajo de 60 | Larga distancia | Vídeo viral: satisfacción − | F1 |
| `event:influencer` | Una relación con 95 % o más el mes anterior | Esa relación | +10 % de demanda durante 6 meses, **elijas lo que elijas** | F1 |
| `event:festival` | Junio o julio | Relaciones turísticas | +10 % de demanda durante 3 meses, **elijas lo que elijas** | F2 (su opción B manda la demanda que no cabe a los autobuses, y eso llega con los viajeros de pie) |
| `event:busprice` | Empieza la campaña de Autocares Meseta (6 meses cada 18, sembrada) | Relaciones de menos de 400 km con autobús | Billetes de autobús a 5 € durante 6 meses, **pase lo que pase** | F1 |
| `event:audit` | Pruebas de corrupción por encima de 12, o 3 trimestres en negativo, o deuda entre caja por encima de 5 | Cuentas | El riesgo de multa sale de esas cifras | F1 |
| `event:freeze` | Enero sin presupuestos: histórico en 2024; después, cuando la encuesta está por debajo de 50 tras unas elecciones | Transferencias | Recorte de la transferencia durante 12 meses | F1 |
| `event:eufunds` | Ventana europea: histórica en junio de 2022; después, sembrada | Obras | Catenaria y ancho al 60 % durante 24 meses 🔒 | F1 |
| `event:secondhand` | Anuncio relámpago sembrado (2022–2030) | Trenespop | Se publican 4 S112 | F1 |
| `event:workshopfire` | Taller lleno durante 8 semanas o más | Taller | −1 plaza hasta reconstruirlo | F6 |
| `event:adifdelay` / `event:adifboost` | Una obra en curso (en su fase de obra desde F8): para el retraso, en un tramo con etiqueta «yacimiento» (desde F3; en F1 y F2, cualquiera); para el adelanto, con el 50 % hecho y sin retrasos | **Una obra con nombre** | Solo afecta a esa obra | F1 |
| `event:royal` | Una relación AVE al 90 % o más y una unidad libre | Esa relación | La visita; sale bien con una probabilidad igual a su puntualidad, tirada sembrada | F1 |
| `event:tweet` | Óscar en el Ministerio y una avería grande esta semana en una relación con mucho tráfico | Esa relación | Reto de una semana | F6 |
| `event:mayorchain` | Villanueva sin parada, Territorio por debajo de 50 y año 2024 o posterior (desde F7, además, que esté en la agenda sorteada de Paco) | `avi-med`, en Villanueva | Paco se encadena a **su** vía: precaución (−10 km/h) mientras siga allí | F3 |
| `event:teruel` | `zar-ter` o `ter-sag` sin catenaria y Territorio por debajo de 45 | Teruel | — | F2 |
| `event:luggage` | Ocupación de larga distancia por encima del 85 % | Larga distancia | — | F1 |
| Descarrilamiento leve | Tramo por debajo del 30 %, u obra certificada sin pruebas | 1 tramo | Corte de 3 días e inspección de la AESF con nota y multa | F8 |

**Calendario sembrado** (Progreso › Calendario, 12 meses por delante): huelgas convocadas, olas de calor previstas, campañas de autobús, entrada de rivales, fin de los fondos, licitaciones y elecciones (también las adelantadas, desde que se convocan).

**Cuando un suceso se repite.** La mecánica de un suceso ocurre cada vez que su causa es cierta: huelgas posteriores (el ultimátum de Plantilla, la variante «Huelga general»), una campaña del autobús cada 18 meses, ventanas de fondos europeos, crisis de energía, nevadas, olas de calor cada verano, robos de cable… Lo que se limita es **la voz**, no el suceso:
1. Cada cuerpo de suceso tiene un **enfriamiento de voz** (tabla). Si su causa es cierta y el enfriamiento ha pasado, suena con su escena grabada.
2. Si la voz está en enfriamiento, o su texto ya no es cierto (la huelga con un convenio reciente, un jefe de Adif cesado…), sale una **tarjeta escrita**: título, una línea «Dato» y **las mismas opciones con los mismos efectos**, sin retrato que hable y sin audio.
3. Cada tarjeta escrita tiene la casilla **«Responder siempre así»** (el protocolo de Airport CEO). Si se marca, las siguientes repeticiones de ese suceso aplican esa opción sin parar el reloj y dejan una línea en el Informe del mes y en el Diario. La casilla se quita en Red › Servicios › Protocolo (§11.3). Las crisis (huelga, impago, escándalo, extorsión) nunca se automatizan.
4. Si la escena de una opción depende de algo que ya no existe (por ejemplo, un pacto que se cumplió), esa opción sale desactivada con su motivo, y siempre queda al menos una posible.

| Cuerpo | Enfriamiento de la voz | Notas |
|---|---|---|
| `event:strike` | 10 años desde el último convenio, y 4 desde la última vez que sonó | Su texto cita los diez años |
| `event:busprice` | 6 años | La campaña ocurre cada 18 meses |
| `event:eufunds` | 8 años | Cada ventana aplica su 60 % durante 24 meses 🔒 |
| `decision:energy` | 8 años | Crisis sembradas después de 2022: índice ×1,3 a ×1,6 durante 10 meses; la prima es el 50 % del sobrecoste previsto, así que «la segunda, más» 🔒 sigue siendo cierto |
| `event:heatwave` | 4 años | Hay ola cada verano con la fuerza que fija la semilla |
| `event:snow` | Una vez por partida | Dice «como no se recuerda»; las grandes nevadas siguientes, como mucho una por década, salen escritas |
| `event:cable`, `event:cows` | 6 años | |
| `event:freeze` | 8 años | |
| `event:festival` | 4 años | |
| `event:influencer`, `event:tweet`, `event:royal` | 6 años | |
| `event:wifi`, `event:luggage`, `event:audit` | 8 años | |
| `event:workshopfire` | 10 años | |
| `event:adifdelay`, `event:adifboost` | 6 años | |
| `event:election` | 10 años desde la última vez que sonó | El adelanto ocurre igual (§3.6) |
| `event:secondhand`, `event:teruel`, `event:mayorchain` | Una vez por partida | Son ofertas o promesas concretas |
| `ev-averia-rampa`, `ev-desprendimiento`, `ev-aire` | 2 años | Líneas nuevas (§8.6.1) |
| Decisiones con fecha (`burgos`, `murcia`, `pajares`…), `climate`, `industry`, `legacyvote` | Una vez por partida | Su hecho no se repite |

### 7.10 Rivales (F1; promociones de YaIré y su historial, F2)

| Rival | Entrada | Comportamiento |
|---|---|---|
| **OuiOui** (`lowgo`) | <ul><li>Madrid–Barcelona desde el primer día (real).</li><li>Madrid–València el 6-10-2022.</li><li>Andalucía y Alicante en su fecha real, que se confirma al implementar.</li><li>Desde 2026, sembrado en los ejes donde tu puntualidad es peor.</li><li>En 2027 tiene toda la alta velocidad.</li></ul> | <ul><li>Revisa su estrategia cada 6 meses según tu tarifa.</li><li>Guerra de precios un semestre de cada tres (×0,78).</li><li>Su cuota sube 2 puntos a la semana mientras tu puntualidad en esa relación está por debajo de 80, y baja 1 con 88 o más.</li><li>Ocupa surcos de LAV.</li></ul> |
| **YaIré** (`rossa`) | <ul><li>Madrid–Barcelona el 25-11-2022 (lo anuncia `decision:Rossa`).</li><li>València el 16-12-2022.</li><li>Andalucía en la primavera de 2023.</li></ul> | Calidad. **Promociones de 13 semanas** sembradas (hecho `yairePromo`), que hacen ciertas las tomas del tema 1 del sucesor |
| **Autocares Meseta** (Íñigo) | Siempre, en relaciones de menos de 400 km y en territorios mal servidos | <ul><li>El logit del autobús del clásico.</li><li>**Campaña de 6 meses cada 18**, anunciada en la Gaceta.</li><li>Cobra los autobuses de las obras.</li><li>Si respondes con un descuento del 10 % o más, se anota `playerAnsweredBusWar`.</li></ul> |

Con la regla «Sin rivales» no entra ninguno, y las voces que los nombran no se eligen.

### 7.11 Objetivos y progreso

**Horizontes:**

| Horizonte | Sistema |
|---|---|
| Días | Incidencias con plazo y nota de la A a la F; picos de demanda |
| Semanas | Escenas del despacho, peticiones (una abierta por grupo), ultimátums |
| Meses | Encargos, convenios y compromisos (§7.12) |
| Legislatura | Actos (2022) o etapas (2027), con plazo y consecuencia; elecciones; mitin |
| Partida | 12 hitos; megaproyectos; 3 retos; unas 40 medallas; hemeroteca de promesas; veredicto |
| Más allá | Reto semanal; código para compartir; prórroga con Retos de legado |

#### 7.11.1 Actos (situación 2022)

El texto grabado de cada capítulo dice lo que pide, y los objetivos miden **exactamente eso**: ni más ni menos (se sustituyen los `objectives` de `story.js` por id desde `guion.js`, sin tocar el archivo). Los objetivos y la recompensa existen desde F1, como en el clásico; el plazo y la consecuencia llegan en F2.

| Acto (voz) | Empieza | Objetivos (los cuenta el motor) | Frase grabada que los fija | Se juzga en… y consecuencia |
|---|---|---|---|---|
| I `chapter:recovery` (Raquel) | Al terminar o saltar el tutorial (enero de 2022) | <ul><li>12 servicios en marcha de la red propia (+4 sobre los 8 iniciales; las 11 relaciones traspasadas no cuentan, §6.6).</li><li>2 peticiones de ciudades atendidas.</li><li>2 trenes reformados o revisados.</li><li>2 trenes nuevos encargados.</li><li>La caja nunca por debajo de 150 M€.</li></ul> | «Pon trenes, atiende a los alcaldes, que llamarán, y encarga material sin vaciar la caja» · «media flota parada» | La noche electoral del 23-7-2023, que es histórica y fija. Si no se cumple: Gobierno −10 |
| II `chapter:competition` (Pedro) | 1-1-2024, o antes si el Acto I está cumplido y ha pasado un año | <ul><li>260 circulaciones al día de la red propia (sin las traspasadas, §6.6).</li><li>1 cambiador de ancho construido.</li><li>Viajeros de los últimos 12 meses por encima de los 12 anteriores.</li></ul> | «Pon más trenes, construye algún cambiador de ancho y deja de perder viajeros» | La **primera** noche electoral después de empezar el acto (julio de 2027 si no hay adelanto). Si no: Gobierno −20 («Si sale mal, ya sabes dónde está la puerta») |
| III `chapter:mediterranean` (Óscar, o `acto3-raquel` si está Raquel) | El 1 de enero siguiente a la noche que juzga el Acto II (2028 si no hay adelanto) | <ul><li>**Un servicio AVE circulando** entre València y Barcelona.</li><li>LAV Murcia–Almería terminada (el proyecto clásico `almeria`: 190 M€, 48 meses, desde 2027).</li><li>250 km pasados a tercer carril o a ancho estándar.</li><li>Ninguna relación inaugurada en el acto con tramos sin catenaria.</li></ul> | «Quiero un AVE de València a Barcelona y la alta velocidad en Almería. Pon tercer carril… y no me cortes una cinta sin catenaria» | La **segunda** noche electoral después de empezar (julio de 2035 si no hay adelanto). Nunca menos de 5 años después de empezar: si un adelanto la acercara más, se juzga en la siguiente («si alguien te dice que esto se hace en dos años, bloquéalo») |
| IV `chapter:territory` (Óscar, o `acto4-raquel`) | El 1 de enero siguiente a la noche que juzga el Acto III (2036 si no hay adelanto) | <ul><li>Soria, Teruel y Extremadura con catenaria en toda su relación.</li><li>AVE en 30 ciudades.</li><li>1 línea nueva de alta velocidad terminada: un proyecto clásico o una obra 19 (que el acto desbloquea, §5.4).</li></ul> | «Electrifica lo que siga con gasóleo, lleva el AVE a más ciudades y termina alguna línea nueva antes de que me jubile» | La segunda noche electoral después de empezar (julio de 2043 si no hay adelanto), con el mismo mínimo de 5 años |
| V `chapter:legacy` (Pedro) | El 1 de enero siguiente a la noche que juzga el Acto IV (2044), o un año antes si el Acto IV ya está cumplido | <ul><li>AVE en 40 ciudades.</li><li>Ocupación media de la red del 70 % o más («trenes llenos»).</li><li>Caja mayor que la deuda.</li></ul> | «AVE hasta en el último rincón con estación, trenes llenos y unas cuentas que no den vergüenza» | El veredicto (§3.6): la noche electoral que cierra el «último gran mandato» |

- **Fechas por defecto antes de F5.** Sin elecciones (F1–F4), los actos se juzgan el 23-7-2023, en julio de 2027, julio de 2035 y julio de 2043, y el V en diciembre de 2050. Sin veredicto con voz (hasta F7), el V se juzga en diciembre de 2050.
- **Adelantos.** La noche que juzga cada acto se recalcula cuando se convoca un adelanto. Misión y la ficha del acto lo dicen desde la convocatoria, con 8 semanas de margen.
- Al cumplir un acto se cobran las recompensas del clásico (100, 180, 260, 350 y 500 M€) y, desde F7, +3 ◆.
- En las situaciones de 2027, la prórroga después de 2034 sigue con los Actos IV y V, cuyos textos no llevan fecha.
- Con la regla de maqueta «Sin rivales», `chapter:competition` no suena (habla de YaIré y OuiOui) y el Acto II se muestra solo por escrito.

#### 7.11.2 Etapas (situaciones de 2027; F5)

| Etapa | Ventana | Objetivo (lo comprueba el motor) | Si no se cumple |
|---|---|---|---|
| s1 (`stage-s1`, Raquel) | 4-1-2027 → 4-4-2027 (91 días) | Norte con media de 4 semanas en 80 % o más el día 91, y ningún impago | **Fin del rescate** (`s1-fallo`), con «Reintentar» |
| s2 (`stage-s2`, Charo) | → 31-12-2027 | Norte, Levante y Sur en 80 % o más (media de 8 semanas), y la caja por encima de la reserva (20 M€) **cada lunes** | Grave (`stage-fail`) |
| s3 (`stage-s3`, Pedro) | 2028 → diciembre de 2030 | Resultado de 2030 en 0 o más, las 2 promesas del mitin cumplidas y las elecciones ganadas («las tres cosas cuentan»). En F5–F6 no hay mitin: la etapa tiene solo las otras dos condiciones y `stage-s3` no suena hasta F7 | Grave, o fin si se pierden las elecciones |
| s4 (`stage-s4-s` si entra Óscar; `stage-s4-m` si eliges seguir con Raquel, F7) | 2031 → 2032 | 2 territorios servidos y OuiOui con el 50 % o menos en los mercados de Levante y Sur | Grave |
| s5 (`stage-s5`, Pedro) | 2033 → diciembre de 2034 | 5 relaciones en 85 % o más, ningún rescate de Hacienda en 104 semanas y las elecciones ganadas. Al cumplirlo **aparece la placa en Atocha** (un objeto del mapa) | Grave, o fin |

Veredicto en diciembre de 2034: `end-win` si se cumplen s5 y las elecciones, el resultado del año es positivo y no hubo **ningún rescate de Hacienda en los ocho años** (2027–2034); si no, `end-partial`. Después, prórroga. En estas situaciones no hay adelantos electorales hasta ese veredicto (§3.8).

#### 7.11.3 Hitos (Cities; F8)

**Cómo se miden:**
- Con la media de 3 meses de viajeros al mes, como múltiplo de una línea base.
- Además hacen falta obras en servicio durante 6 meses o más.
- Las obras canceladas restan, así que no se pueden «farmear» (B).

**Qué da cada hito:** una tarjeta con su recompensa y una **lista de desbloqueos generada desde los datos**. Lo bloqueado se ve con un candado, el requisito y «Ir ›».

| # | Nombre | Umbral | Desbloquea |
|---|---|---|---|
| 1 | Apeadero | ×1,10 | Investigación de nivel 2; techo de crédito +100 M€; 2 ◆ |
| 2 | Andén | ×1,20 | Contratas de obra; apeaderos; el Conseguidor (F9); 2 ◆ |
| 3 | Estación | ×1,30 | +1 cuadrilla; obra «Desdoblar»; megaproyectos de nivel 1 (Gran Taller, Centro de Control, Monumento); 3 ◆ |
| 4 | Intercambiador | ×1,45 | **Paquete a elegir:** «Ferrocarril verde» (electrificar −15 % y Bruselas +) o «Velocidad» (LAV −10 % y Gobierno +). Obras 3→25 kV y quitar el carril ibérico; AVArato; crédito +200 M€ |
| 5 | Nudo | ×1,60 | Línea de alta velocidad trazada por el jugador (obra 19); +1 hueco de política; 3 ◆. Los 9 proyectos AV del clásico no dependen de hitos (§5.4) |
| 6 | Red regional | ×1,80 | +1 cuadrilla; investigación de nivel 3; Estación Central |
| 7 | Red nacional | ×2,00 | **Paquete a elegir:** «Taller propio» (+1 plaza y revisiones −20 %) o «Contratas» (cuadrillas contratadas al ×1,2) |
| 8 | Red ibérica | ×2,20 | Corredor Mediterráneo y Teruel (megaproyectos); crédito +300 M€ |
| 9 | Red europea | ×2,40 | +1 cuadrilla; +1 hueco de política |
| 10 | Referente | ×2,60 | **Paquete a elegir:** «Proximidad rural» (OSP rural +20 %) o «Ejes» (canon de LAV −15 %) |
| 11 | Leyenda | ×2,80 | Estación emblemática; 3 ◆ |
| 12 | Patrimonio | ×3,00 | Medalla de oro y «Seguir sin fin» desde ya |

- **El paquete que no eliges** se puede comprar más tarde al doble de su coste en M€ (B).
- **Desbloqueos que llegan después.** Investigación de nivel 2 y 3, megaproyectos y el Conseguidor existen desde F9. Si un hito ya se alcanzó antes, sus desbloqueos nuevos se conceden al cargar la partida con la versión que los trae. Nunca se quita nada que el jugador ya tenía, y nada de lo que el clásico ofrece hoy sin condiciones pasa a depender de un hito: obras de catenaria, ancho y cambiador, las 6 investigaciones clásicas y los 9 proyectos AV.
- **Un objetivo en vigor desbloquea lo que pide** (§5.4), aunque su hito no se haya alcanzado.
- La voz `hito` («Hay gente en los andenes…») solo suena en los hitos 1 a 3, que es cuando es cierta.

#### 7.11.4 Investigación (las 6 del clásico desde F1; niveles y pilotos en F9)

- **Una sola investigación en curso** 🔒, pagada con dinero y meses.
- **Tres niveles:** el 1 desde el inicio, el 2 con el hito 1 y el 3 con el hito 6. **Las 6 investigaciones del clásico están todas en el nivel 1**, con sus requisitos de hoy: nada que el clásico ofrece sin condiciones pasa a depender de un hito. Los niveles existen desde F9; hasta entonces, el árbol es el del clásico.

| Nivel | Tecnología | M€ / meses | Efecto | Se puede pilotar |
|---|---|---|---|---|
| 1 (clásica) | Venta online | 10 / 4 🔒 | +3 % de demanda | sí |
| 1 (clásica) | Programa de fidelización | 18 / 6 (pide Venta online) | +5 % de demanda | sí |
| 1 (clásica) | ERTMS | 35 / 12 🔒 | Tiempos −5 % y +2 de puntualidad; permite la obra ERTMS | sí |
| 1 (clásica) | Cambiador rápido | 25 / 8 (pide ERTMS) | Recupera 3 min por cada cambio de ancho | no |
| 1 (clásica) | Mantenimiento predictivo | 28 / 10 (pide Venta online) | Desgaste −20 % y operación −2 % | sí |
| 1 (clásica) | Hidrógeno para el Alvia híbrido | 65 / 18 (pide Predictivo y ERTMS) | Operación del S730 −8 % | no |
| 1 | Ultrasonidos de carril | 8 / 4 | El estado de la vía cae un 30 % menos | sí |
| 1 | Horarios cadenciados | 6 / 3 | +3 % de demanda en Media Distancia y +2 de puntualidad | sí |
| 2 | Regulación de tráfico | 24 / 8 | +10 % de capacidad en convencional | sí |
| 2 | Contrato de mantenimiento | 10 / 5 | Revisiones en 2 semanas | sí |
| 2 | App que funciona | 24 / 6 (pide Venta online) | Acaba con el fallo de la app en las semanas punta | sí |
| 2 | Tarificación dinámica | 16 / 5 | Permite la tarifa «Dinámica» del Estatuto | sí |
| 2 | Bimodo | 32 / 10 | Habilita el Dörfler BMU antes de 2028 | sí |
| 3 | Batería | 40 / 12 | Habilita el Dörfler Akku | no |
| 3 | Bateadora propia | 12 / 6 | Bateo −30 % de plazo | no |
| 3 | Usados certificados | 8 / 4 | Usados con +10 de fiabilidad | no |
| 3 | Comunicación de crisis | 6 / 4 | Escándalos −20 % | no |

**Pilotos** (tema 4 de los encuentros):
- Se paga el 30 % del coste para probar la tecnología 8 semanas en **una** relación: de 1,8 M€ (cadenciados) a 10,5 M€ (ERTMS). Al terminar llega un aviso con el resultado medido.
- Lo pagado se descuenta si la investigas en las 13 semanas siguientes.
- Hacienda reserva cada enero una **partida de pilotos** de **6 M€**, que caduca el 31 de diciembre. Un piloto se paga primero de la partida y el resto de la caja. Con 6 M€ caben los pilotos de cadenciados (1,8), ultrasonidos (2,4), venta online o contrato de mantenimiento (3), tarificación dinámica (4,8) y fidelización (5,4). Así es cierto «el piloto tiene presupuesto» (Charo, tema 4) aunque la caja general vaya mal: su predicado exige `partidaPilotos ≥ coste del piloto` de la tecnología que nombra (§8.5).

#### 7.11.5 Megaproyectos (SimCity; F9)

- **Los 6 del rescate:**
  - Gran Taller: +1 plaza de taller por cada etapa;
  - Centro de Control: puntualidad de la red +2;
  - Corredor Mediterráneo: tercer carril de Castelló a Tarragona;
  - Teruel: electrificación y renovación de Zaragoza–Teruel–Sagunt;
  - Estación Central de Madrid: demanda +4 %;
  - **Monumento al Ministro**: de vanidad. Gobierno +, sospecha +. Hace cierta la frase de Charo sobre «otra escultura delante del apeadero».
- **Los 9 proyectos de alta velocidad del clásico:** Almería, Y vasca, Burgos–Vitoria, Navarra, LAV Extremadura, Cartagena, Cantabria, Huelva y Cerdedo.
  - Cada uno tiene 5 etapas: Estudio y permisos, Plataforma, Montaje de vía, Electrificación y señalización, y Pruebas. El coste y el plazo totales son los del clásico (`data.js`, `PROJECTS`), repartidos 10/30/25/25/10 %.
  - Tienen el año mínimo del clásico (Almería, 2027) y **ningún hito**: los piden los Actos III y IV.
- Cada etapa pide requisitos que se ven, y **ya rinde algo** al terminarla. La obra se ve en el mapa (grúa, plataforma).
- Voz `mega-hecho` al terminar uno que no sea el de vanidad.

#### 7.11.6 Retos, medallas, Operador del Año, reto semanal y prórroga (reto semanal en F3; prórroga en F7; el resto en F9)

Todo esto se consulta en **Progreso › Logros** (§11.3): los 3 retos de la partida, las medallas, la clasificación del último Operador del Año, el Reto de legado del año y el código del reto semanal.

- **Retos:** 3 de un banco de 20, sembrados. Se ven como medallas oscuras que se doran al cumplirse. Ejemplos:
  - «Teruel con catenaria antes de 2030»;
  - «Vence a OuiOui en Madrid–Barcelona: un año con el 50 % de cuota o más»;
  - «Ni un diésel en Extremadura en 2035»;
  - «Cero sobres»;
  - «Norte al 90 % un año entero»;
  - «Villanueva con parada antes de 2025»;
  - «Sin préstamos hasta 2027».
- **Medallas:** unas 40. Son las 9 del clásico y las 22 del rescate, fusionadas, más algunas satíricas: «Puerta giratoria», «Ministro dimitido».
- **Operador Ferroviario del Año** (cada diciembre): una clasificación de 10 operadores europeos parodiados según puntualidad, satisfacción y resultado.
  - Ganarlo da 2 M€, Gobierno +5, 3 ◆ y la voz `operador-del-ano`.
  - Quedar el último sale en la portada de la Gaceta.
- **Reto semanal:** la misma semilla, rasgo y 2 modificadores para todos, sacados de la semana ISO. No hace falta servidor.
- **Prórroga:** después del veredicto siguen las elecciones, los encuentros, los rivales y el mercado. Cada año hay un **Reto de legado** y el listón europeo sigue subiendo. Un cuerpo ya oído puede volver a sonar cuando han pasado 10 años.

### 7.12 Acuerdos: encargos, convenios, pactos y peticiones

Cada tipo de acuerdo tiene un solo papel:

| Tipo | Quién lo ofrece | Qué es | Dónde se ve |
|---|---|---|---|
| **Encargo** | El Ministerio, con la voz de un arco (`ARCS`) | El contrato clásico de 3 etapas y dos ramas: requisitos que se inspeccionan, premio al cumplir 3 cierres seguidos. El primero es el del tutorial (F1, con cada arco solo si su condición es cierta) | Despacho › Agenda |
| **Convenio** (Airport CEO) | Cada comunidad autónoma | Un marco sin caducidad. Su **clase ★ (1–5)** sale de la satisfacción media de 8 semanas en sus relaciones (F9) | Red › Territorios |
| **Petición de servicio** | Una comunidad con convenio. Absorbe las peticiones de ciudades del clásico | Por ejemplo, «Madrid–Badajoz, 3 salidas al día, 85 % o más, tarifa de 35 € o menos, 0,9 M€ al mes, 36 meses». Se paga en los meses que cumple, con un margen de 5 puntos. Tres meses seguidos fallando: **rescisión**, y la comunidad pierde una ★. Como mucho 4 abiertas; nunca piden lo que ya tienes. Las de 4–5★ pagan más y castigan más (F9; hasta entonces, las peticiones de ciudades del clásico, que cobran tras 3 cierres) | Red › Territorios (oferta) y Despacho › Agenda (en curso) |
| **Pacto** | Un personaje, según su agenda | Beneficio, obligación, plazo y consecuencia: los 8 del rescate con voz, en escala real (tabla de §7.12.1; el de la estación de Paco pasa a `decision:rural`). Como mucho 2 activos (F7) | Despacho › Pactos y Agenda |
| **Compromiso** | Cualquier decisión, escena, mitin o pacto | La promesa que se rastrea (§8.8; F2) | Despacho › Agenda |

- **Renegociación** (Airport CEO; F7). Cada pacto, encargo o petición abre una ventana cada 26 semanas.
  - Deslizadores con la probabilidad en vivo; **la tirada se guarda en el estado al abrirse la ventana**.
  - Como mucho 2 contraofertas (3 con el rasgo Negociador). Después, la otra parte se cierra y pierde confianza (−5).
  - Una concesión a favor del otro siempre se acepta.
  - Cada punto de negociación cuesta 1 ◆.
- **Los arcos solo se ofrecen si su voz es cierta:**

  | Arco | Solo si… | Exigencias del encargo |
  |---|---|---|
  | `arc:0` (Íñigo, sobre OuiOui) | OuiOui está en esa relación y en guerra de precios | Cuota frente a OuiOui de X o más, con margen positivo |
  | `arc:1` (Benito) | La Variante de Pajares está abierta | Relación por `leo-pol-v`, con ancho variable y N salidas o más |
  | `arc:2` (Raquel) | Raquel está en el Ministerio | Relación mediterránea, más una obra de tercer carril o de catenaria («une estaciones en el mapa») |
  | `arc:3` (Paco) | Relación rural con un 30 % o más de autobús | Primera salida a las 07:00 o antes («el autobús de las seis») y cuota de autobús por debajo de X |
  | `arc:4` (Pedro) | Quedan 12 meses o menos para las elecciones | Inaugurar algo antes de votar. Premio: voto +2 |

#### 7.12.1 Los 8 pactos con voz (F7)

**Reglas comunes:**
- Un pacto se ofrece el lunes en que su disparador de agenda es cierto (§7.8.2) y la oferta dura 3 semanas.
- Como mucho hay 2 activos. Si llega una oferta con 2 activos, espera a que uno termine, mientras su disparador siga cierto.
- Un pacto rechazado no se vuelve a ofrecer hasta pasadas 40 semanas.
- La tarjeta enseña cinco líneas: al firmar, obligación, al cumplir, si incumples y si rechazas. **Son exactamente los efectos que aplica el motor**, y `facciones-test` lo comprueba en la versión normal y en la negociada.
- **Negociar** (§7.12): la tirada se guarda al abrir la ventana. La versión negociada **nunca cambia un número que diga la voz** (🔒); solo mejora lo que la voz no cita.
- Al firmar se guarda la **base** que el pacto necesita, por ejemplo los territorios no servidos ese día, para que la condición se tenga que cumplir después de firmar.
- Cumplir da un favor en la memoria de esa persona y +2 ◆. Incumplir deja un agravio (§8.9).

| Pacto (voz) | Al firmar | Obligación y plazo (comprobación de §8.8) | Al cumplir | Si incumples | Versión negociada | Si rechazas |
|---|---|---|---|---|---|---|
| `fermin-convenio` (Fermín) | Plantilla +10. `personal.ultimoConvenio` = hoy. Durante 26 semanas 🔒 («medio año») no se puede convocar huelga, y el ultimátum de Plantilla se congela | Nómina de personal +4 %, permanente, en la línea «Personal». `sinRecortes(red)` durante 26 semanas: no cerrar relaciones, no bajar más de un 10 % las salidas totales y no despedir cuadrillas | Plantilla +5 | Huelga de 2 semanas en tarjeta escrita «Huelga por el convenio roto», con servicios mínimos (se cancela el 50 % de las circulaciones AVE y el 25 % de las OSP). Plantilla −15. La subida de nómina se queda | Nómina +2 %, y Plantilla +5 al firmar | Plantilla −3 |
| `charo-contrato` (Charo) | Subvención extra de 6 M€ por trimestre, que se cobra al cierre de cada trimestre mientras dure | Durante 39 semanas: resultado ordinario ≥ 0 en 2 de los 3 trimestres (`resultado ≥ 0, 2 de 3`) y `sinPrestamos`: no disponer más crédito ni pedir rescate de Hacienda | Te quedas lo cobrado. Hacienda +6 | En cuanto falla (un préstamo, o el segundo trimestre negativo): devuelves todo lo cobrado **con intereses** del 0,4 % mensual desde cada cobro, en un pago a 2 semanas. **Auditoría segura**: a las 2 semanas se abre `event:audit` (o su tarjeta escrita), con el riesgo de multa calculado. Hacienda −6 | 4 M€ por trimestre | Hacienda −2 |
| `benito-cuadrilla` (Benito) | +1 cuadrilla de Adif durante 13 semanas 🔒 («tres meses»), sin coste semanal | Pagar 0,4 M€ de «gastos de coordinación» al vencer. Se cobran solos si hay caja | Adif +5 | Si al vencer no hay caja: permisos de obra ×1,5 durante 52 semanas. En los dos casos la cuadrilla se va al vencer; si estaba en una obra, esa obra se para hasta que haya otra, y se avisa con 2 semanas | 0,25 M€ de coordinación | Nada |
| `marisa-carta` (Marisa; necesita la Media Distancia) | Viajeros +12 | Norte, Levante y Sur con media de 4 semanas ≥ 85 % un mismo lunes, dentro de 20 semanas (`puntualidad(esenciales, ≥ 85)`) | «Te aplaudimos»: Viajeros +5 y titular a favor | «Te reclamamos hasta el último billete»: durante 13 semanas se devuelve el 100 % del billete de cada circulación de Norte, Levante o Sur que llegue con más de 15 min de retraso (línea «Devoluciones»). Viajeros −16 | Umbral del 80 %, y Viajeros +7 al firmar (la voz no da cifra) | Viajeros −3 |
| `raquel-inauguracion` (Raquel, en el cargo) | Gobierno +6 | `inaugurar` en 14 semanas y antes de votar: terminar una obra del catálogo o una etapa de megaproyecto, o abrir una relación nueva. Solo se ofrece si hay algo que pueda terminar en ese plazo | 10 M€ de presupuesto extra y Gobierno +4 | OSP −5 % el trimestre siguiente, Gobierno −6 y agravio de la ministra | Gobierno +4 al firmar y 6 M€ al cumplir | Gobierno −2 |
| `oscar-tuits` (Óscar, en el cargo) | Gobierno +6 y Viajeros +4 | 3 🔒 inauguraciones en 26 semanas 🔒 (obras terminadas, etapas de megaproyecto o relaciones nuevas). Solo se ofrece si 3 son posibles en el plazo | Gobierno +6 | El hilo del ministro: Viajeros −10, Gobierno −6, titular y agravio | Mismas cifras, que las dice la voz; también cuentan las mejoras de estación terminadas. Gobierno +3 y Viajeros +2 al firmar | Gobierno −2 |
| `pedro-cohesion` (Pedro) | Territorio +8. **Base:** lista de territorios no servidos ese día | En 30 semanas, un tren diario (al menos 1 salida por sentido todos los días durante 4 semanas seguidas) en un territorio de la base (`territoriosServidos` sobre la base) | «Un buen pellizco»: 25 M€ y Gobierno +4 | Territorio −10 y no hay dinero | 40 semanas y 18 M€ | Gobierno −2 |
| `inigo-noagresion` (Íñigo; nunca con «Sin cloacas» ni «Portal abierto») | +12 % de demanda en las relaciones de Soria y Teruel durante 52 semanas: sus autocares te llevan viajeros. Nace el secreto `pacto-meseta`, con Íñigo de testigo (registro desde F9; antes de F9 se crea al cargar) | `noReforzar(Extremadura)` durante 52 semanas 🔒 («un año»): ni abrir ni añadir salidas | Se acaba el +12 %. El secreto sigue y puede salir por la sospecha | Íñigo lo filtra: `sc-pacto-meseta` (desde F9; antes, un titular escrito y Territorio −8). Se acaba el +12 % | +15 % de demanda (el plazo lo dice la voz) | Nada |

### 7.13 Dos partidas distintas

1. **`TNF-4R7Q-2M9C-3A0F1K` · 2022 · Tecnócrata · Verano tórrido.**
   - La historia hasta 2026 es la de siempre.
   - Paco tiene la obsesión «catenaria para la comarca», y Fermín, «taller».
   - OuiOui llega al Levante en 2029 y hay una recesión en 2031.
   - La ola de calor de 2030 limita el Sur a 160 km/h cada verano y hace sonar `decision:climate`.
   - En las elecciones de 2031 eliges a Raquel, la mantienes en 2035 y en enero de 2036 abre el Acto IV con su voz (`acto4-raquel`).
   - Es una partida de vía y catenaria, con veranos que castigan el Sur.
2. **`TNF-9K2M-H4XR-7C2P0B` · 2027 · Herencia envenenada · Exbanquero · Prensa hostil.**
   - Extremadura y Galicia empiezan cansadas, y OuiOui ya compite en el Levante.
   - Íñigo propone el pacto de no agresión en la semana 30.
   - Si firmas y en 2028 reabres Extremadura antes de que pase el año, Íñigo lo filtra y sale en portada (`sc-pacto-meseta`).
   - El 1-1-2031 se acaba la cesión de la alta velocidad a OuiOui y vuelves a Madrid–València con unos Alvia de segunda mano de Trenespop, contra un OuiOui que ya está allí.
   - Es una partida de dinero, rivales y cloacas.

**Una historia que sale sola** (B). Así la cuenta el Informe del mes:
1. Fermín pide revisar el S-449 «Pucela», que sirve en el Norte con el estado al 38 % (tema 2), y eliges «Seguir con el plan previsto»: queda anotado que Fermín avisó de esa unidad.
2. Siete semanas después, el Pucela se avería subiendo Guadarrama (Madrid–Ávila, etiqueta «rampa»): suena `ev-averia-rampa`, eliges el arreglo rápido con horas extra y el Norte pierde ese tren el resto del día y dos días más (§8.6.1).
3. Al lunes siguiente el director puede elegir a Marisa enfadada con el tema 2 (`scene-riders-angry-2`: «¡Vete tú a esperar tres horas de pie, caradura! Un baño averiado no es una experiencia de viaje…»). Es cierto: hubo una cancelación grande en su corredor y una unidad del Norte está por debajo del 45 %.
4. Más adelante puede sonar Fermín decepcionado con el tema 2 (`scene-workshop-disappointed-2`: «Te avisé. Pero claro, qué sabrá el del mono de grasa…»), porque la unidad de la que avisó se ha roto y otra unidad del Norte sigue por debajo del 40 %.
5. El informe lo resume en una línea: «Pucela averiado en Guadarrama · Fermín te avisó en marzo».

---

## 8. D6 · El motor de verdad narrativa

### 8.1 Visión general

```
 estado s ──► HECHOS F  (función pura, sin azar; se memoriza por momento)
                 │
                 ▼
  GUION: un CONTRATO por cada cuerpo grabado o línea nueva
  {momento, cuando, exige(F), afirma, instancia(F), dato(F,i), opciones[{etiqueta, posible, detalle, aplica}],
   mecanicas[], una, enfriamiento, prioridad}
                 │
                 ▼
  DIRECTOR: momentos (06:00 · lunes 07:00 · cierre de mes · noche electoral)
  → candidatos → puertas (cargo, reglas, mecánicas, enfriamientos, «una») → puntuación → cola
  → revalidación justo antes de pintar → silencio si nada es cierto
                 │
                 ▼
  ESCENA: retrato (persona y ánimo del catálogo) + toma completa (data-say = raw)
          + línea «Dato» sin voz (≤ 20 palabras) + opciones con su detalle calculado
                 │  (el jugador elige)
                 ▼
  EFECTOS con etiqueta y cuenta atrás ──► COMPROMISOS rastreados ──► MEMORIA de personajes
                 │                                │                          │
                 └──► DIARIO e INFORME del mes ◄──┴──────── hechos nuevos ◄────┘  (cadenas)
```

### 8.2 Hechos (`hechos.js`)

- Es una función pura `hechos(s)`.
- Lee el estado y sus registros. **Nunca tira dados ni escribe.**
- Se memoriza por momento, y el director la recalcula justo antes de mostrar una escena.
- Usa el vocabulario de la auditoría de encuentros (`datos/audit-encounters.json`, `facts` y `factHelpers`) con tres cambios:
  1. las ventanas se cuentan en días (semanas × 7);
  2. donde decía «corredor» ahora vale una relación o un corredor con nombre;
  3. **los umbrales de dinero y de viajeros pasan a la escala real** (tabla de abajo). La auditoría los escribió en la escala del rescate, unas 8 veces más pequeña, y copiados tal cual darían aperturas que son casi siempre o casi nunca ciertas.

**Escala de los umbrales.** Los umbrales de caja se expresan en múltiplos de **G**, el gasto de explotación medio de los 3 últimos cierres (energía, personal, mantenimiento, canon, estructura e intereses; sin inversión). G se calcula en `hechos.js` y sale en Dinero › Mes. Al empezar vale unos 27 M€ al mes en 2022 (con la Media Distancia, unos 40) y unos 12–16 M€ en las situaciones de 2027. Así un umbral significa lo mismo en una red pequeña que en una grande. El robot de equilibrado de cada fase puede retocar los factores, pero no la forma.

| Hecho o umbral (auditoría, escala del rescate) | En el modo único | Lo usa |
|---|---|---|
| `cashMin13 ≥ 3 M€` y `ord8 ≥ 0` | `cajaMin(13 semanas) ≥ 1·G` y resultado de las 8 últimas semanas ≥ 0 | `treasury.happy` |
| `cashMin13 < 0 && spend4 ≥ 0,5` | `cajaMin(13) < 0` y `gasto4s ≥ 0,15·G` (compras, obras, megaproyectos, campañas y pilotos de 4 semanas) | `treasury.angry` |
| `due(4) > 0,6·cash && due(4) > 0,5`, o `cash < 1,5` | `pagos(4 semanas) > 0,6·caja` y `pagos(4) > 0,15·G`, o `caja < 0,5·G` | `treasury.worried` |
| `cash ≥ 6 && cash − due(13) ≥ 4`, sin obras ni megaproyecto ni gasto | `caja ≥ 2·G` y `caja − pagos(13) ≥ 1,2·G`, sin obras propias en curso, sin megaproyecto y con `gasto4s = 0` | `treasury.surprised` |
| `ord8 < 0,05` (o Hacienda < 50) | Resultado de las 8 últimas semanas < 0 (o Hacienda < 50) | Raquel, tema 1 |
| Agenda de Charo: «6 M€ sin usar» | `caja − pagos(13) ≥ 2·G` durante 8 semanas, con deuda > 0 | Petición «amortiza deuda» |
| `unstaffedBusy`: ≥ 1,5 k viajeros a la semana | Estación de categoría C sin personal con **6.500 viajeros al mes** o más (§6.3) | Temas 3 de Raquel y Marisa |
| `stationPax ≥ 1,5` (Benito, tema 3) | ≥ 6.500 viajeros al mes | Benito, tema 3 |
| `pax ≥ 3` (Marisa, tema 2) | Relación con **13.000 viajeros al mes** o más | Marisa, tema 2 |
| Fallo de la app con ≥ 30 k viajeros a la semana | Red con **500.000 viajeros al mes** o más (cierto desde enero de 2022) | `appGlitch`, Marisa, tema 4 |
| `pilotEarmark`: 0,4 M€ cada enero | **Partida de pilotos de 6 M€** cada enero (§7.11.4) | Charo, tema 4 |
| `pilotCost`: de 0,09 a 0,78 M€ | 30 % del coste de la tecnología: de 1,8 a 10,5 M€ | Tema 4 |
| `revisionCost` 0,18 M€; arreglo rápido 0,25 M€ | Revisión: 1 % del precio + 0,05 M€. Avería: 0,15 M€ de arreglo + 0,05 M€ de remolque + 2 días de ingresos (§6.3) | Tema 2 |
| Horas extra: 0,015 M€ por tren y semana | 4.000 € por circulación cubierta y día | Tema 0 |
| Personal de estación: 0,006 M€ a la semana | 0,003 M€ a la semana | Tema 3 |
| Obra menor de accesibilidad: 0,25 M€ | 0,4 M€, 2 semanas, por contrata (§6.3) | Benito, tema 3 |
| Contrata `CREW.sub`: 0,09 M€ a la semana | 0,075 M€ a la semana (§6.3) | Benito, tema 0 |
| Inspección de vía: máx(0,1; 0,0003·km) M€ | máx(0,1; 0,0015·km) M€ (el Norte, 421 km: 0,63 M€) | Benito, tema 2 |
| Publicidad de una campaña de descuentos: 0,05 M€ | 0,4 M€ | Tema 1 |
| Puesta a punto del clima: 0,08 M€ por tren | 0,15 M€ por unidad | Óscar, tema 2 |
| Maquinistas: necesidad = trenes × 3,5; contratar a 0,015 M€ con 13 semanas; una baja cada 8 semanas | Necesidad = ⌈circulaciones diarias × 0,55⌉; lotes de 20 por 0,3 M€ 🔒 con 3 meses 🔒; una jubilación el día 1 de cada mes par (§6.3) | Tema 0 |
| Campaña del autobús: 26 semanas cada 78 | 6 meses cada 18 (clásico) | Íñigo |

`numeros-voz-test` no cubre esta tabla, porque ninguna de estas cifras la dice una voz. La cubre `verdad-fuzz`: en 12 semillas, cada apertura de Charo debe salir al menos una vez y ninguna debe ser cierta más del 60 % de los lunes.

| Espacio | Hechos (ejemplos) |
|---|---|
| Tiempo | `fecha`, `diaSemana`, `festivo`, `temperatura(region)`, `nevada`, `diasAElecciones`, `legislatura`, `enTutorial`, `situacion` |
| Reparto | `cargo(persona)`, `enCargo(persona)`, `diasEnCargo(persona)`, `cesado('adif')`, `ultimoAnimo[persona]`, `ultimoAnimoDia[persona]` |
| Red | `tramo(id)` con `{g, e, v, via, estado, ltv, cerrado, obra, tags, carga}`; `kmPor('e','25kv')`; `cambiador(nodo)`; `ciudadesAVE`; `sinCatenaria(corredor)`; `parada('vda')` |
| Servicios | `rel(id)` con `{activa, unidades, salidas, ocupacion, sinPlaza, puntualidad, hist[], tarifa, tarifaRef, cuota{ouioui, yaire, bus}, neto13, esencial, territorio}`; `problemaResuelto(dias)`; `incidencias(dias)`; `cancelaciones(dias)` |
| Flota | `unidad(id)` con `{modelo, estado, edad, fiab, averias[], avisadaPor, enTaller, rel}`; `libresCompatibles(rel)`; `bajo45`; `reserva`; `colaTaller`; `vueltasTaller(dias)` |
| Personal | `maquinistas`, `necesidad`, `cobertura`, `coberturaProxSemana`, `horasExtraActivas`, `cuadrillasLibres`, `estacionConPersonal(n)` |
| Dinero | `caja`, `cajaMin(semanas)` (previsión), `pagos(semanas)`, `resultado(meses)`, `gasto4s`, `malUso4s`, `partidaPilotos` |
| Grupos | `grupo(g)` con `{valor, media26, delta8}`; `gobierno`; `encuesta`; `encuestaDelta4s`; `favores` |
| Obras | `terminadas(dias)`, `aLaPrimera(dias)`, `retrasadaHoy`, `aceleradas(dias)`, `obraAMedias`, `hitoGrandeObra`, `promesaImposible` |
| Rivales | `ouiouiGuerra(rel)`, `yairePromo`, `campanaBus`, `respondioBus`, `cuotaBusDelta8` |
| Narrativa | `log.ocurrio(id, dias)`; `compromisos.{abiertos, cumplidos(dias, quien), rotos(dias, quien)}`; `memoria(persona)`; `cadena(clave)`; `usado(cuerpo)` |
| Cloacas | `secretos[]` con `{tipo, importe, contrato, tramo, testigos, expuesto}`; `sospecha`; `pruebas`; `faseJudicial` |

**Registros que se guardan** (bloque nuevo `s.narr`):

```js
s.narr = {
  log: [{dia, tipo, id, persona, animo, instancia, opcion, efectos:[ids], compromisos:[ids]}],   // los últimos 400
  usados: {cuerpoId: [dias]},                    // para «una» y para los enfriamientos
  enfr: {persona:{}, personaAnimo:{}, personaTema:{}, tema:{}, instancia:{}, doble: null},
  efectos: [{id, origen, tipo, objetivo, valor, desde, hasta, etiqueta, medida:{antes, despues}}],
  compromisos: [{id, origen, quien, comprueba:{tipo, args}, plazo, premio, castigo, estado, creado}],
  memoria: {persona: [{tipo:'favor'|'agravio'|'aviso'|'promesa', que, dia, peso}]},
  cadenas: {pacoPlantado: dia, /* … */},
  hist: {grupos:[], cuotas:[], puntRed:[]},      // series semanales para calcular deltas
  tiradas: {escenaId: valor}                      // apuestas y negociaciones: se tiran una vez
}
```

### 8.3 Contratos del guion (`guion.js`)

**Reglas de construcción:**
1. **No se copia ningún texto.** El contrato apunta a la fuente del catálogo (`decision:burgos`, `encounter:scene-adif-angry-2`, `induction:incident:briefing:1`…) o al id de una línea nueva de `LINES`. Cuerpo, persona y ánimo se leen de los módulos congelados (`DECISIONS`, `EVENTS`, `CHAPTERS`, `ARCS`, `ENCOUNTERS`, `INDUCTION_STAGES`).
   - La prueba `sin-copias` prohíbe que un módulo nuevo contenga 40 caracteres seguidos de un cuerpo del catálogo.
2. **`story.js`, `encounters.js`, `induction.js` y los `ARCS` de `tycoon.js` no se editan nunca.** Ni sus campos ni el orden de sus arrays.
   - `guion.js` **sustituye por id** los títulos, las opciones, los efectos, los disparadores y los `at` distintos de 0.
   - La suma del catálogo (`6348984c…`, 412 filas) se comprueba en cada compilación.
3. **Las cifras que cambian nunca van en la voz.** Van en la línea «Dato» y en el detalle de cada opción, y las calcula la misma función que luego aplica el efecto.
4. **Cada contrato declara las `mecanicas` que necesita** (por ejemplo, `['maquinistas','talleres']`). Si el sistema aún no existe en esa fase o lo apaga una regla de maqueta, el contrato no se puede elegir. **Silencio antes que mentira.**

```js
export const CONTRATOS = {
  'decision:burgos': {
    momento: 'dia', cuando: {desde: '2022-07-21', hasta: '2022-09-15'},     // ventana: si no cabe, no suena; nunca tarde
    mecanicas: [],
    exige: F => F.tramo('vdb-bur').b && F.cambiador('bur') && F.enCargo('minister'),
    afirma: ['LAV Venta de Baños–Burgos abierta', 'cambiador en Burgos'],    // se comprueban igual que exige
    instancia: F => ({rel: 'madrid-burgos', libres: F.libresCompatibles('madrid-burgos')}),
    dato: (F, i) => `Madrid–Burgos · ${i.libres.length} unidades compatibles libres`,
    opciones: [
      {etiqueta: 'Abrir el AVE a Burgos', posible: (F, i) => i.libres.length ? true : 'No hay unidades AVE libres',
       detalle: (F, i) => '4 M€ · 2 salidas · +10 % de demanda en Burgos, 6 meses',
       aplica: (s, i) => [abrirServicio(s, i.rel, {unidad: i.libres[0], salidas: 2}),
                          efecto(s, {tipo: 'demanda', objetivo: {ciudad: 'bur'}, valor: .10, meses: 6, etiqueta: 'Lanzamiento Burgos'})]},
      {etiqueta: 'Esperar a tener trenes', detalle: () => 'Promesa: Madrid–Burgos en servicio antes de 6 meses',
       aplica: (s, i) => [compromiso(s, {quien: 'minister', comprueba: {tipo: 'servicio', rel: i.rel}, meses: 6,
                                         premio: {gobierno: +3}, castigo: {gobierno: -6, agravio: 'minister'}})]}
    ],
    una: true
  },
  // …un contrato por cada una de las 97 fuentes que no son encuentros y por cada línea nueva.
  // Los 315 encuentros comparten un contrato genérico que combina el predicado de la apertura y el del tema (§8.5).
};
```

### 8.4 El director (`director()` en `guion.js`)

**Momentos:**
- **06:00 de cada día:** fechas históricas, sucesos situados y crisis.
- **Lunes a las 07:00:** encuentros, peticiones dobles, pactos y peticiones.
- **Cierre de mes:** actos o etapas, encargos, convenios, contrato rural, OSP e Informe.
- **Noche electoral.**

**Correspondencia por fases:**
- De F1 a F5 el motor todavía es mensual y la jornada se juega a mano. El momento «día» se evalúa en cada jornada que el jugador juega, y además al cierre de mes con todos los días del mes, en orden.
- El momento «lunes» se evalúa en el cierre de mes, contando las semanas que han pasado.
- Las **ventanas** garantizan que una escena nunca suena antes de su hecho ni fuera de plazo. Por ejemplo, Burgos abre el 21 de julio y su escena puede sonar al cierre de julio, que sigue dentro de la ventana.
- Desde F6, con el reloj por días, los momentos son exactos.

**Prioridad**, de mayor a menor:
1. Crisis con opciones: impago, huelga convocada, escándalo, extorsión, ultimátum.
2. Fechas históricas y de guion dentro de su ventana.
3. Sucesos situados.
4. Actos, etapas y noche electoral.
5. Pactos, encargos, convenios y peticiones.
6. Encuentros y peticiones dobles.
7. Lo que no tiene voz: Gaceta, avisos.

**Límites:**
- Como mucho **una escena con voz al día y dos a la semana**. Las crisis no cuentan.
- Las escenas del mismo día se juntan en una sola pantalla.
- Lo que no cabe espera en cola **solo mientras dure su ventana**.

**Puertas que pasa cada contrato:**
- `enCargo(persona)`;
- las reglas de maqueta y los modificadores;
- `mecanicas`;
- los enfriamientos;
- **la voz y su enfriamiento.** Cada contrato declara `voz: {una: true}` o `voz: {cadaAnios: n}`, y `s.narr.voz[cuerpo]` guarda el último día en que sonó:
  - encuentros, decisiones con fecha, actos y líneas de un solo uso: una vez por partida, o una vez cada 10 años en la prórroga;
  - sucesos: el enfriamiento de la tabla de §7.9.

  Cuando la mecánica vuelve a ocurrir y la voz no puede sonar (porque está en enfriamiento o porque su texto ya no es cierto), el director no la descarta: emite una **tarjeta escrita** con las mismas opciones y efectos (§7.9, «Cuando un suceso se repite»). Así una repetición nunca se queda sin decisión, ni con una voz que repite algo que ya no es verdad. Los encuentros no tienen tarjeta escrita: si su cuerpo ya sonó, se elige otro o no sale nada;
- **al menos una opción posible**: si ninguna se puede ejecutar, la escena no sale (nunca hay escena sin salida);
- las situaciones: lo fechado en 2022–2026 no suena en 2027, `t-*` no suena en 2022, y `legacyvote` solo suena en la situación 2022 y nunca con «Sin final» (en las de 2027 el plan ya tuvo su veredicto en 2034).

**Revalidación:**
- Justo antes de pintar, `exige` y `afirma` se vuelven a evaluar. Si ya no se cumplen, la escena se descarta en silencio y no queda anotada.
- Al cargar una partida se hace lo mismo con la cola.

**Silencio:** si no hay candidatos, no suena nada. El teletipo puede llevar un titular sin voz que **solo cuente hechos**.

**Alcance de la regla «ningún diálogo falso».** Vale para todo lo que publica cada versión: el juego único, sus tarjetas escritas, sus titulares y sus avisos. El motor viejo del Rescate 4.0 **no se publica desde F1** (§14, F1): sale de la portada y de la compilación, y su guardado se conserva para convertirlo en F5. Así ninguna versión publica sus contradicciones auditadas (`ev-huelga`, `ev-viral`, `ev-tuneles`, `ev-desprendimiento`, `negotiate-no`, `stage-pass`, `cor-enchufe`, `sc-yate`, la consecuencia de `t-1`) ni sus tiradas del 20 % semanal de sucesos y del 9 % semanal de ofertas de pacto. La sala de escucha (`dialogos.html`) es un archivo de tomas, no una partida: allí siguen todas, con las retiradas marcadas como tales.

```js
export function director(s, momento) {
  const F = hechos(s), cola = [];
  for (const [id, c] of Object.entries(CONTRATOS)) {
    if (c.momento !== momento || !puertas(s, id, c, F)) continue;
    if (!c.exige(F) || !afirmaTodo(c, F)) continue;
    const i = c.instancia?.(F); if (c.instancia && !i) continue;
    if (!c.opciones.some(o => (o.posible?.(F, i) ?? true) === true)) continue;   // nunca una escena sin salida
    cola.push({id, prioridad: c.prioridad ?? prioridadPorTipo(id), puntos: c.puntos?.(F, i) ?? 0, i});
  }
  if (momento === 'lunes') cola.push(...elegirEncuentro(s, F));                // §8.5: como mucho uno, o una petición doble
  return ordenar(cola).filter(limites(s));                                      // la interfaz llama a revalidar() antes de pintar
}
```

### 8.5 Los 315 encuentros

**Base:** el algoritmo del §6 de `auditoria-encuentros.md`, adaptado.
- Una escena solo sale si **a la vez** son ciertos el predicado de su apertura (63) y el de su tema (45) sobre la instancia elegida, y las dos opciones se pueden ejecutar.
- **Cuándo:** los lunes. Nunca en las 5 primeras semanas de una partida ni con una decisión pendiente. Como mucho una cada 4 semanas; el objetivo es una cada 6 (unas 8 o 9 al año).
- **Quién:** la puerta `enCargo(persona)` sustituye a la vieja regla «Raquel hasta la semana 208».
- **Enfriamientos:**

  | Mismo… | Espera |
  |---|---|
  | cuerpo | nunca más (10 años en la prórroga) |
  | persona y ánimo | 26 semanas |
  | persona y tema | 26 semanas |
  | tema, con cualquiera | 8 semanas |
  | persona | 8 semanas |
  | instancia | 13 semanas |

- **Ánimo:**
  - se prefiere el de un suceso, luego uno reciente, luego uno de estado y por último uno de actitud;
  - si empatan, el menos usado;
  - «contento» y «orgulloso» exigen que la confianza del grupo de esa persona sea de 40 o más;
  - «enfadado» y «decepcionado», de 60 o menos.
  - Grupo de cada persona: Pedro, Raquel y Óscar → Gobierno; Charo → Hacienda; Fermín → Plantilla; Marisa → Viajeros; Paco → Territorio. Benito e Íñigo no tienen esta guarda.
- **Puntos** = 0,55 × gravedad de la instancia + 0,25 × interés de la persona por el tema + 0,20 × peso del nivel del ánimo (suceso 1; reciente 0,8; estado 0,6; actitud 0,4). Los intereses son los de la auditoría.
  - Si la mejor escena saca menos de 0,45 y la última fue hace menos de 8 semanas, no sale nada.
- **Petición doble** (§7.8.3; F7): si las dos mejores escenas son del mismo tema y de un par opuesto, y no hubo otra doble en 13 semanas, salen las dos juntas.
- **Presentación:**
  - título `TOPICS[k]` («El turno imposible»…);
  - retrato con el ánimo del catálogo;
  - la toma completa;
  - la línea «Dato» con la instancia: «S-449 Pucela · estado 38 % · Norte»;
  - dos opciones con su detalle calculado.

**Efectos reales: una fila por persona y tema** (de `auditoria-encuentros.md` §5, pasada a la escala real). Cada uno de los 45 cuerpos de tema dice una cosa distinta, así que cada pareja persona·tema tiene su propio predicado, su instancia y sus dos efectos. No basta con un juego de efectos por tema: «Puedo inspeccionar la vía ahora» no es revisar un tren, y «Necesito manos en el turno de noche» no son horas extra de maquinistas.
- **Etiquetas.** Por defecto son las de `encounters.js` (`OPTIONS`, que no forman parte del catálogo): «Pagar refuerzos este mes» / «Ajustar turnos sin refuerzo», «Campaña de descuentos» / «Proteger el margen», «Revisión extraordinaria» / «Seguir con el plan previsto», «Refuerzo de atención local» / «Atención centralizada» y «Financiar el piloto» / «Pedir otra evaluación». Cuando la acción de una fila es otra, `guion.js` sustituye la etiqueta por persona y tema, con 4 palabras como máximo. En la tabla, esas etiquetas van entre comillas.
- **Bloques comunes.** Las celdas los citan entre corchetes:
  - **[HorasExtra]** Durante 4 semanas no se cancela ninguna circulación por falta de maquinistas en el ámbito de la instancia. Cuesta 4.000 € por circulación cubierta y día, contando solo las que se habrían cancelado; va en la línea «Horas extra». No contrata a nadie: el aviso «Faltan N maquinistas» sigue, con «cubierto hasta el d/m» y su remedio «Contratar 20 · 0,3 M€ · 3 meses». Plantilla +4, y Viajeros +2 si había cancelaciones. Mientras dura, `horasExtraActivas` es cierto y no vuelve a salir ningún tema 0 de maquinistas.
  - **[Cancelar]** Durante 4 semanas, o hasta tener cobertura, se cancelan las circulaciones sin maquinista: primero las primeras salidas, primero las relaciones grandes y nunca un esencial a cero. Se devuelve el 50 % del billete a sus viajeros y las demás relaciones pierden 2 puntos de puntualidad (turnos estirados). Plantilla −3.
  - **[Retirar]** Se quitan para siempre las salidas que no se pueden cubrir, empezando por las de menor neto por tren y sin dejar ningún esencial a cero. Las unidades pasan a la reserva. No hay cancelaciones ni fatiga. Viajeros −2.
  - **[Descuento]** Tarifa ×0,85 durante 13 semanas en las relaciones de la instancia, con vuelta automática y cuenta atrás en su ficha, más 0,4 M€ de publicidad. Antes de elegir se ve la previsión de billetes, viajeros y cuota del rival. Viajeros +3, Hacienda −2.
  - **[Margen]** La tarifa no cambia; la campaña del rival sigue su curso y su cuota se mueve con la fórmula, y la ficha dice «‹rival› X % ↑». Hacienda +2, Viajeros −1.
  - **[Revisión]** La unidad nombrada va al taller: 1 % de su precio + 0,05 M€; 3 semanas, 2 con «Contrato de mantenimiento»; cola si no hay plaza. Vuelve al 95 %. Si su relación se queda sin trenes, entra la reserva compatible. Plantilla +3. **Sustituye a `fleetcare`.** Hasta F6 actúa sobre el lote: una unidad del lote sale 3 semanas y el estado del lote sube como si esa unidad volviera al 95 %.
  - **[SinRevisión]** La unidad sigue en servicio con su probabilidad de avería ×1,5 durante 8 semanas, y queda anotado quién avisó (`avisadaPor`) y cuándo. Viajeros −2.
  - **[Personal]** La estación nombrada, de categoría C, tiene personal 26 semanas renovables, a 0,003 M€ a la semana. Sus relaciones tienen demanda ×1,03 y el mapa marca la estación con las semanas que quedan. Territorio +5, Viajeros +1.
  - **[Centralizada]** La estación sigue sin personal y sus relaciones tienen demanda ×0,98 durante 26 semanas. Territorio −4.
  - **[Piloto]** La tecnología nombrada se prueba 8 semanas en una relación por el 30 % de su coste, pagado primero de la partida de pilotos. Sus efectos se aplican solo allí. Al final llega un aviso con lo medido frente a las 8 semanas anteriores de esa relación, y lo pagado se descuenta si la investigas en las 13 semanas siguientes. Gobierno +3.
  - **[Evaluación]** Sin coste; esa tecnología no se puede pilotar en 13 semanas. Gobierno −2.
- **Asunto** agrupa las filas cuyas opciones son acciones excluyentes sobre el mismo tipo de objeto, y **Prefiere** es la opción que pide el texto de esa persona. Las dos columnas deciden las peticiones dobles (§7.8.3).
- **Fase** es la del tema. La fase de cada cuerpo es la **mayor** entre la de su tema y la de su apertura. Las aperturas que hablan de encuestas o elecciones llegan en F5; las de pactos y memoria, en F7; las que exigen cuadrillas, como «Dame medios y aparta» de Benito, en F8; y las de secretos, en F9.

| Persona · tema (cuerpo del tema) | Cierto si… (escala real, §8.2) | Instancia | Opción A → efecto | Opción B → efecto | Asunto · prefiere | Fase |
|---|---|---|---|---|---|---|
| Pedro · 0 «Quiero más salidas en hora punta. Y maquinistas…» | Una relación con ocupación ≥ 100 % y ≥ 5 % sin plaza, una unidad libre compatible y maquinistas − necesidad < 4 (no llegan para otro tren); sin horas extra activas | Esa relación y esa unidad | La unidad libre entra en esa relación 4 semanas, con [HorasExtra] para su tripulación y su coste normal de operación | Se mueve 1 unidad compatible desde la relación menos cargada que tenga 2 o más, durante 4 semanas; −2 de puntualidad en las dos; Plantilla −3 | maquinistas · A | F6 |
| Pedro · 1 «OuiOui se está llevando la foto…» | Cuota de OuiOui ≥ 15 % en alguna relación propia | Las relaciones con OuiOui | [Descuento] | [Margen] | tarifa-rival · A | F2 |
| Pedro · 2 «No puedo inaugurar un tren que se queda tirado…» | Una apertura (relación nueva o fin de obra con servicio) en ≤ 4 semanas, con su unidad prevista por debajo del 50 % o con fiabilidad ≤ 0,78 | La apertura y su unidad | [Revisión] de esa unidad. Si no hay reserva compatible, la apertura se aplaza lo que dure la revisión, y se ve antes de elegir | La apertura sale en su fecha; la unidad tiene avería ×2 sus 2 primeras semanas. Si se avería: Gobierno −3, titular «El tren de la inauguración se queda tirado antes del canapé» y anotado en la memoria | unidad · A | F2 |
| Pedro · 3 «En esa comarca también hay urnas…» | Elecciones en ≤ 52 semanas y un territorio que se puede abrir (vía ≥ 40 % y una unidad libre compatible) o servido con 1 unidad o menos | Esa relación de territorio | «Tren y atención»: abrir la relación (4 M€ 🔒) o añadirle 1 unidad compatible, más [Personal] en su estación principal | [Centralizada] en su estación principal, sin tren nuevo | territorio · A | F6 |
| Pedro · 4 «Necesito una mejora que funcione antes de ponerle mi nombre.» | Elecciones en ≤ 52 semanas y alguna tecnología pilotable | La de efecto más visible (cadenciados, fidelización o regulación), en la relación con más viajeros | [Piloto] | [Evaluación] | piloto · A | F9 |
| Raquel · 0 «La nueva oferta necesita turnos…» | Servicio añadido en las 4 últimas semanas y cobertura < 1 hoy o la semana próxima; sin horas extra | El servicio añadido | [HorasExtra] | [Cancelar] | maquinistas · A | F6 |
| Raquel · 1 «Bajar precios queda estupendo hasta que Charo…» | Guerra de OuiOui, promoción de YaIré o campaña del autobús, **y** resultado de las 8 últimas semanas < 0 o Hacienda < 50 | Las relaciones afectadas | [Descuento], con Hacienda −4 en vez de −2 | [Margen] | tarifa-rival · B | F2 |
| Raquel · 2 «El taller pide una revisión extra…» | Alguna unidad en servicio por debajo del 45 % | La peor | [Revisión] | [SinRevisión]; avisa el taller (memoria de Fermín) | unidad · A | F2 |
| Raquel · 3 «Podemos reforzar la atención de esa estación…» | Una estación concurrida sin personal (≥ 6.500 viajeros al mes) | La más concurrida | [Personal] | [Centralizada] | estacion · A | F6 |
| Raquel · 4 «Los técnicos tienen un piloto listo…» | Alguna tecnología pilotable | La más barata, en la relación con más viajeros | [Piloto] | [Evaluación] | piloto · A | F9 |
| Óscar · 0 «El horario está inflado…» | Cobertura < 0,95; sin horas extra | La red | [HorasExtra] en toda la red | [Retirar] («dejar de vender humo»); Plantilla −1 | maquinistas · A | F6 |
| Óscar · 1 «YaIré ha anunciado promoción…» | Una promoción de YaIré empezada hace ≤ 4 semanas en una relación propia | Las relaciones con YaIré | [Descuento] | [Margen] | tarifa-rival · A | F2 |
| Óscar · 2 «Otro vídeo del aire acondicionado muerto…» | Semanas 23 a 34 del año, alguna unidad en servicio por debajo del 55 % en un tramo «calor», y `ev-aire` (o su tarjeta) ocurrió en las 52 semanas anteriores | Hasta 3 unidades por debajo del 55 % | «Poner a punto el clima»: cada unidad sale 1 semana y cuesta 0,15 M€; ese verano `ev-aire` no puede tocarlas | Si antes de la semana 35 ocurre `ev-aire` en una de ellas: Viajeros −4 y titular «Otro vídeo del aire acondicionado muerto» | aire · A | F8 |
| Óscar · 3 «El alcalde amenaza con plantarse en el ministerio…» | Agravio de Paco, o Territorio < 35, o Paco habló enfadado o decidido en las 8 semanas anteriores | La estación de Paco: Villanueva si es parada; si no, la principal de un territorio | [Personal], y se borra el agravio de Paco | [Centralizada]. Paco se planta: Territorio −6 más, titular «El alcalde de Villanueva acampa en el ministerio» y cadena `pacoPlantado` (Paco decidido puede sonar 2 semanas después) | alcalde · A | F6 |
| Óscar · 4 «Quiero datos de verdad…» | Pilotable de datos: regulación, ERTMS, predictivo, app o tarificación dinámica | Esa tecnología, en la relación con más incidencias | [Piloto]; mientras dura, la ficha de la relación enseña puntualidad por hora y riesgo de avería | [Evaluación] | piloto · A | F9 |
| Charo · 0 «Las horas extra no se pagan con entusiasmo…» | Cobertura < 1; sin horas extra | La red | [HorasExtra] | [Retirar] («ajusta la oferta»); Hacienda +2 | maquinistas · B | F6 |
| Charo · 1 «Cada descuento tiene que salir de algún sitio…» | Guerra de OuiOui, promoción de YaIré, campaña del autobús o alguna tarifa ≥ 1,15 × la de referencia | Las relaciones con presión | [Descuento], con Hacienda −3 | [Margen] | tarifa-rival · B | F2 |
| Charo · 2 «La revisión cuesta menos que el rescate…» | Una unidad en servicio por debajo del 40 %, caja ≥ coste de su revisión y **coste de la revisión < coste esperado de una avería** (§6.3) | Esa unidad | [Revisión]; el detalle enseña las dos cifras | [SinRevisión] | unidad · A | F2 |
| Charo · 3 «Ese pueblo necesita atención, no otra escultura…» | Una etapa del Monumento pagada en las 26 semanas anteriores y una estación de territorio sin personal | Esa estación | [Personal] | [Centralizada] | estacion · A | F9 |
| Charo · 4 «El piloto tiene presupuesto…» | Una tecnología pilotable cuyo piloto cabe entero en la partida de pilotos (§7.11.4) | Esa tecnología, pagada de la partida | [Piloto]; si el efecto medido sale negativo, Hacienda −5 («te meto dentro») | [Evaluación]; la partida sigue hasta el 31 de diciembre | piloto · A | F9 |
| Benito · 0 «Sin cuadrilla de guardia…» | 0 cuadrillas libres y (vía abierta mínima < 60 % o ≥ 1 incidencia en 4 semanas) | La red | «Contratar guardia este mes»: una contrata de guardia 4 semanas (0,075 M€ a la semana, 0,3 M€) que no trabaja en obras. La respuesta «Equipo» cuesta 18.000 € 🔒 en vez de 54.000 y el retraso de las incidencias baja ×0,5. La primera sale en el parte: «La cuadrilla de guardia lo resuelve en una hora» | «Sin guardia»: retraso de las incidencias ×1,5 durante 4 semanas en relaciones con vía por debajo del 60 %. La primera sale como «Incidencia de las 6:00 en X sin cuadrilla de guardia» | guardia · A | F8 |
| Benito · 1 «Si llenas el tren de ofertas y no refuerzas el andén…» | Guerra, promoción o campaña, y una relación afectada con ocupación ≥ 90 % | Esa relación | [Descuento]; la previsión enseña la penalización por atasco, −mín(10; (carga − 1)·25) puntos de puntualidad, ×1,5 si la relación tiene vía única (desde F3) | [Margen] | tarifa-rival · B | F2 |
| Benito · 2 «Puedo inspeccionar la vía ahora…» | Un tramo con servicio por debajo del 55 %, sin obra, y ≥ 1 cuadrilla libre | Ese tramo (el peor) | «Inspeccionar la vía ahora»: 1 cuadrilla 1 semana, por máx(0,1; 0,0015·km) M€. Estado +4 (tope 98) y 13 semanas sin incidencias de vía en ese tramo | Si en 13 semanas el tramo baja del 45 %, salta una LTV a 60 km/h y sus relaciones pierden 10 puntos de puntualidad 2 semanas; titular «Nadie lo había previsto» | via · A | F8 |
| Benito · 3 «La estación necesita acceso y personal…» | Una estación C de nivel 0, sin personal, no `accesible` y con ≥ 6.500 viajeros al mes | Esa estación | «Personal y acceso»: [Personal] más la obra menor de accesibilidad por contrata (0,4 M€, 2 semanas, **sin cuadrilla**), que la deja `accesible` con +2 % de demanda permanente | [Centralizada] | estacion · A | F6 |
| Benito · 4 «Tenemos sensores para detectar fallos…» | Ultrasonidos pilotable | La relación con peor vía | [Piloto] de ultrasonidos (2,4 M€): la vía de esa relación se degrada un 30 % menos durante 8 semanas | [Evaluación] | piloto · A | F9 |
| Fermín · 0 «Necesito manos en el turno de noche…» | Cola de taller ≥ 1, o ≥ 2 unidades por debajo del 50 % con el taller lleno | El taller | «Pagar el turno de noche»: 4 semanas a 0,02 M€ a la semana. Las revisiones que entren duran 1 semana menos (mínimo 1) y el desgaste baja ×0,8. Plantilla +4 | «Que espere la cola»: las revisiones que entren en 4 semanas duran 1 semana más y las unidades por debajo del 50 % tienen avería ×1,25 durante 4 semanas. Plantilla −3 | taller · A | F6 |
| Fermín · 1 «Los billetes baratos llenan los coches…» | Guerra, promoción o campaña, y una relación afectada cuyas unidades tienen un estado medio por debajo del 60 % | Esa relación | [Descuento], con desgaste ×1,15 de sus unidades mientras dure | [Margen] | tarifa-rival · B | F2 |
| Fermín · 2 «O cambiamos la pieza ahora…» | Una unidad en servicio por debajo del 40 % | La peor | [Revisión] | [SinRevisión]; avisa Fermín | unidad · A | F2 |
| Fermín · 3 «El material de reserva también llega a provincias…» | Hay AVE en servicio; una relación de territorio servida tiene una unidad en el taller o no tiene reserva; y hay una unidad libre **compatible** con esa relación (ancho, energía y gálibo, §5.3) | Esa relación y esa unidad | «Mandar la reserva»: la unidad pasa a reserva de esa relación (1 semana de traslado, sin coste) y sus unidades tienen prioridad en el taller (−1 semana por revisión) durante 26 semanas. Territorio +5 | «La reserva, con el AVE»: la unidad no se mueve. Territorio −4 | reserva · A | F6 |
| Fermín · 4 «La diagnosis nueva ve la avería…» | Mantenimiento predictivo pilotable | La relación con más averías en 26 semanas | [Piloto] predictivo (8,4 M€): sus unidades tienen avería ×0,6 durante 8 semanas; aviso final «N averías frente a M esperadas» | [Evaluación] | piloto · A | F9 |
| Marisa · 0 «El primer tren nos deja tirados si no hay relevo…» | Cobertura < 1 y, en las 2 últimas semanas, una primera salida cancelada en un esencial; sin horas extra | Ese esencial | [HorasExtra] en ese esencial | [Cancelar]. Además, la primera salida de ese esencial sigue cancelada 4 semanas (sus viajeros −8 %). Viajeros −3 | maquinistas · A | F6 |
| Marisa · 1 «El precio de ayer no se parece al de hoy…» | Tarificación dinámica activa, o la tarifa del Norte (o de la relación con más cambios) cambió 2 o más veces en 8 semanas | El Norte o esa relación | «Fijar el precio»: se suspende la dinámica en esa relación y la tarifa queda ×0,85 durante 13 semanas. Viajeros +3, Hacienda −2 | «Proteger el margen»: sigue la dinámica. Viajeros −3 | tarifa-dinamica · A | F2 |
| Marisa · 2 «Un baño averiado no es una experiencia de viaje…» | Una unidad en servicio por debajo del 50 % en una relación con ≥ 13.000 viajeros al mes | Esa unidad | [Revisión] | [SinRevisión] | unidad · A | F2 |
| Marisa · 3 «La estación está vacía de personal…» | Una estación concurrida sin personal | Esa estación | [Personal] | [Centralizada] | estacion · A | F6 |
| Marisa · 4 «Si la aplicación vuelve a perder el billete…» | Sin «App que funciona», un fallo de la app en las 26 semanas anteriores y la app pilotable | La app, en el Norte (o en la relación con más viajeros si no hay Norte) | [Piloto] de la app (7,2 M€): ningún fallo en esa relación durante el piloto | [Evaluación]; en el próximo fallo de semana punta, Viajeros −3 | piloto · A | F9 |
| Paco · 0 «El tren de primera hora es el que lleva a la gente al trabajo…» | Cobertura < 1 y, en 2 semanas, una primera salida cancelada en una relación de territorio | Esa relación | [HorasExtra] en esa relación | [Cancelar]. El primer tren de ese territorio sigue cancelado 4 semanas (sus viajeros −15 %). Territorio −4 | maquinistas · A | F6 |
| Paco · 1 «Un billete de ida cuesta una compra semanal…» | Una relación de territorio abierta con ocupación < 40 % y tarifa ≥ la de referencia | Esa relación | «Tarifa rural»: tarifa ×0,80 durante 26 semanas. Territorio +4, Viajeros +1 | «Proteger el margen»: la tarifa no cambia. Territorio −4 | tarifa-rural · A | F5 |
| Paco · 2 «Aquí también se estropean trenes…» | Una relación de territorio servida con una unidad por debajo del 45 % o con una avería en 4 semanas | Esa unidad | [Revisión] | [SinRevisión]; Territorio −3 | unidad · A | F5 |
| Paco · 3 «Quiero atención en la estación…» | Villanueva es parada y no tiene personal | Villanueva del Andén | [Personal] | [Centralizada] | estacion · A | F6 |
| Paco · 4 «Si el sistema funciona aquí…» | Un territorio servido y una pilotable entre ERTMS, regulación, predictivo y ultrasonidos, o bimodo si esa relación tiene tramos sin catenaria | Esa tecnología en esa relación | [Piloto]; con bimodo, la energía diésel de esa relación baja un 30 % | [Evaluación]; Territorio −2 | piloto · A | F9 |
| Íñigo · 0 «Refuerza turnos, hombre…» | Cobertura < 1 y cancelaciones en 2 semanas en una relación donde compite el autobús | Esa relación | [HorasExtra] | [Cancelar]; los viajeros de los trenes cancelados pasan al autobús («A Autocares Meseta: N mil») | maquinistas · B | F6 |
| Íñigo · 1 «He puesto una oferta obscena…» | Campaña del autobús empezada hace ≤ 4 semanas y sin respuesta | Las relaciones con autobús | [Descuento]; anota `respondioBus` | [Margen]: la campaña (autobús ×0,78) sigue sus 6 meses y la cuota del autobús crece con el logit | tarifa-rival · B | F2 |
| Íñigo · 2 «Cada avería tuya me paga una rueda…» | Una avería en 4 semanas y alguna unidad por debajo del 45 % | La peor | [Revisión] | [SinRevisión]; si se avería, sus viajeros perdidos van al autobús | unidad · B | F6 |
| Íñigo · 3 «Donde tú ves cuatro vecinos…» | Un territorio con cuota del autobús ≥ 50 % que no está servido o cuya estación principal no tiene personal | Esa relación y su estación | [Personal], como punto de venta local: cuota del autobús −5 puntos | [Centralizada]; cuota del autobús +5 puntos | estacion · B | F6 |
| Íñigo · 4 «Si tú no pruebas esa mejora, la pruebo yo…» | Pilotable cadenciados, fidelización, app o tarificación dinámica, y campaña del autobús o cuota del autobús ≥ 30 % en alguna relación | Esa tecnología | [Piloto] | [Evaluación]. Autocares Meseta la adopta: utilidad del autobús +5 % durante 26 semanas y titular «Autocares Meseta estrena…» | piloto · B | F9 |

`guion-completo` comprueba que las 45 filas existen, con un predicado, una instancia y dos efectos. `efectos` comprueba que cada opción cambia el objeto nombrado en la instancia, no otro.

**Retirados.** Son 5 cuerpos que nunca pueden ser ciertos. Siguen en el catálogo y en el auditorio, pero no se eligen:
- `scene-adif-happy-0`
- `scene-adif-determined-2`
- `scene-workshop-happy-2`
- `scene-rival-surprised-1`
- `scene-successor-happy-0`

**Ventanas estrechas:** se aplican las 9 de `combosNarrow` (auditoría, §7.3). Por ejemplo, `scene-riders-happy-0` solo suena si la primera salida cancelada no es del Norte. `scene-adif-determined-3` es posible porque la obra de accesibilidad de la fila «Benito · 3» la hace una contrata y no usa cuadrilla. Su apertura («Dame medios y aparta») exige 0 cuadrillas libres, así que suena desde F8.

**Qué se puede oír en cada fase** (§14). En F1 todos los encuentros callan: se quita la permutación y todavía no hay selector. Desde F2, la columna «Fase» de la tabla, combinada con la fase de la apertura, dice cuándo puede sonar cada cuerpo. Además, los 35 cuerpos de Raquel solo suenan con Raquel en el cargo (2022–2023, o desde F7 si se la elige), y los de Óscar, con Óscar en el cargo.

**Cobertura estimada:** unos 70 cuerpos alcanzables en F2, 100 en F5, 215 en F6, 235 en F7, 265 en F8 y los 310 en F9. Ninguna apertura se fuerza: si su sistema no existe, su predicado es falso.

### 8.6 Los 47 cuerpos que no son encuentros (tabla para `guion.js`)

**Reglas comunes:**
- Los disparadores de los sucesos están en §7.9.
- Las etiquetas y los efectos de las opciones se pueden cambiar; el cuerpo, la persona y el ánimo, no.
- **Lo exógeno pasa siempre**, antes de elegir, y no depende de la opción.
- **Una opción nunca promete lo que la versión publicada no rastrea.** En F1 todavía no hay compromisos: donde la tabla dice «Promesa», la opción de F1 se llama «Más adelante» y su único efecto es Gobierno −2. Desde F2 pasa a ser la promesa de la tabla.
- La columna «Fase» dice desde cuándo puede sonar el cuerpo. Antes, calla.

**Decisiones (15)**

| Cuerpo | Cuándo suena | Opción A → efecto real | Opción B → efecto real | Fase |
|---|---|---|---|---|
| `inaugural` (Raquel) | 3-1-2022, antes del tutorial; 4-1-2027 después de `t-2` | **Servicio público:** Misión pública (3,5 M€ al mes; OSP de 2,2 €/tren-km); Territorio +10; +120 M€ (solo en 2022) | **Disciplina comercial:** Misión comercial (2 M€; 1,6 €/tren-km); Hacienda +10; +160 M€ (solo en 2022) | F1 |
| `energy` (Charo) | 1-3-2022. Después, crisis sembradas: con voz si han pasado 8 años desde que sonó y, si no, tarjeta escrita con las mismas opciones (§7.9) | **Pagar el seguro de precio:** el índice de energía se queda en 1,0 durante 12 meses. La prima es el 50 % del sobrecoste previsto, y se ve en el detalle | **Rezar:** se paga el índice (×1,6 de marzo a diciembre de 2022). La crisis llega igual, y el detalle enseña que B cuesta el doble de la prima: «la segunda, más» 🔒 | F2 |
| `burgos` (Raquel) | 21-7-2022, con ventana hasta el 15-9 | **Abrir el AVE a Burgos:** Madrid–Burgos con una unidad compatible libre: 4 M€, 2 salidas y +10 % durante 6 meses. Sin unidad, desactivada con el motivo | **Esperar a tener trenes:** promesa de Madrid–Burgos en servicio en 6 meses (Gobierno +3 / −6 y agravio) | F1 |
| `discounts` (Raquel) | 1-9-2022. La demanda sube **siempre**: +15 % en Alvia (y en Media Distancia si es tuya) durante 16 meses | **Reforzar con la ayuda:** +65 M€ y, en el acto, +1 salida por sentido en las 3 relaciones Alvia más llenas, con unidades libres compatibles. Si no hay unidades para las 3, la opción dice cuántas faltan y sale desactivada | **Que vayan de pie:** +25 M€. Los viajeros de pie y la fuga al autobús se ven en la ficha | F2 (los viajeros de pie llegan en F2; en F1 la escena calla y la subida de demanda ocurre igual, sin dinero) |
| `Rossa` (Pedro) | 1-11-2022. YaIré entra el 25-11 **siempre** | **Competir en servicio:** −18 M€; calidad +3 en las relaciones con YaIré durante 24 meses | **Proteger la caja:** Hacienda +2; se abre la pestaña Competencia con YaIré marcada | F1 |
| `murcia` (Raquel) | 20-12-2022, con ventana hasta el 15-2-2023 | **Abrir Madrid–Murcia** con una unidad compatible (+10 % durante 6 meses) | **Esperar:** promesa de Murcia en servicio en 6 meses | F1 |
| `gauge` (Raquel) | Febrero de 2023 | **Revisar toda la flota:** 0,05 M€ por unidad. Se comprueban gálibo y compatibilidad de unidades y pedidos, se marcan los que no caben y las unidades revisadas ganan +5 de estado | **No es nuestro:** Gobierno −2 | F3 (el gálibo existe desde F3; en F1 y F2 calla) |
| `pajares` (Óscar) | 29-11-2023, con Óscar en el cargo | **Lanzar los Alvia a Asturias:** abre o refuerza Madrid–Oviedo y Gijón por la Variante con una unidad de ancho variable libre (+10 % durante 6 meses). Sin unidad, abre Trenespop filtrado | **Esperar a tener trenes:** promesa de 6 meses; `arc:1` queda en cola | F1 |
| `extremadura` (Óscar) | 14-12-2023 | **Plan Extremadura:** empieza la obra real de 25 kV en Madrid–Talavera–Plasencia (268 km); el Ministerio paga el 80 %. Desde F2, promesa «Extremadura electrificada» antes del fin de obra + 6 meses | **Alvia decentes:** asigna S730 libres a Madrid–Badajoz, o abre Trenespop con los bimodos y (desde F2) una promesa de 6 meses | F1 |
| `s106` (Óscar) | Mayo de 2024 (21-5). Llegan 30 unidades durante 18 meses 🔒, **siempre** | **Celebrarlo:** 15 M€; +10 % durante 6 meses en las relaciones con S106 | **Ponerse a trabajar:** 6 M€; las 10 unidades más gastadas pasan revisión (+10 de estado; por lote hasta F6, por unidad y con cola de taller desde F6) | F1 |
| `futuretender` (Óscar) | 1-3-2026. **Siempre** se abren el catálogo de la nueva generación y la licitación en Trenespop | **Preparar la inversión:** 45 M€ reservados como entrada; se devuelven si en 6 meses no hay pedido | **Priorizar lo que hay:** Viajeros +3, Hacienda +3 | F2 |
| `climate` (Pedro) | El primer verano desde 2030 con un día de 45 °C 🔒 en Córdoba y servicio por tramos «calor» | **Reforzar el mantenimiento:** 35 M€; las limitaciones y las incidencias por calor se reducen a la mitad para siempre | **Reducir la oferta:** −20 % de salidas cada verano (junio a septiembre) en las relaciones por Córdoba, Sevilla o Badajoz. Se pierde dinero y se mantiene la puntualidad | F8 |
| `rural` (Paco) | Villanueva sin parada, Territorio por debajo de 45 y 3 o más ciudades rurales sin servicio; desde 2024 | **Firmar con las comarcas:** contrato de 5 años 🔒. Paga 6 M€ al mes **solo en los meses que se cumplen** 2 salidas por sentido o más y el 80 % de puntualidad en la lista rural. Obliga a **reabrir Villanueva** en 12 meses. Con 3 incumplimientos seguidos se cancela, y Territorio −15 | **Mantener las manos libres:** Territorio −5; agravio de Paco | F3 |
| `industry` (Fermín) | Cola sembrada (2038–2044): +18 meses en todos los pedidos nuevos 🔒, **siempre** | **Pagar para colarnos:** 45 M€; tus pedidos se libran de la cola 36 meses y los pendientes se adelantan 6 | **Esperar con cinta americana:** desgaste de la flota ×1,1 mientras dure la cola (los usados no se ven afectados) | F1 |
| `legacyvote` (Pedro) | Tras ganar unas elecciones en 2047 o después (no con «Sin final») | **Una red para todos:** 50 M€; compromiso final de AVE en 40 ciudades o más y toda la lista rural servida | **Cuentas claras:** +50 M€; compromiso final de deuda menor que la caja y resultado positivo en los últimos 12 meses | F7 (llega con el veredicto: hasta F7 la partida acaba en diciembre de 2050 y «Quedan cuatro años» sería falso) |

**Sucesos (22)**

| Cuerpo | Opción A → efecto real | Opción B → efecto real | Fase |
|---|---|---|---|
| `cable` | **Reponer deprisa:** 9 M€; arreglado en 1 semana («pagar el doble» 🔒) | **A nuestro ritmo:** 4,5 M€; 8 semanas de LTV en **ese** tramo | F8 |
| `strike` | **Negociar el convenio:** +3 % de nómina que se cobra cada mes; Plantilla +20; se desconvoca; `personal.ultimoConvenio` = hoy (desde entonces, la voz calla 10 años y las huelgas salen como tarjeta escrita) | **Aguantar el pulso:** 2 semanas de servicios mínimos: se cancela el 50 % de las circulaciones AVE y el 25 % de las OSP, se pierden esos ingresos y Plantilla −10 | F1 |
| `wifi` | **Wifi nuevo en toda la flota:** 14 M€; la política Wifi gratis queda activa y sin coste durante 2 años; calidad +3 en larga distancia | **Pedir paciencia:** Viajeros −3 | F1 |
| `eufunds` | **Plan de obras:** abre Planos (desde F8) o la lista de obras con los tramos que cumplen; si firmas 2 obras en 6 meses, +10 % de ayuda | **Sin prisa:** Hacienda +1. **El 60 % durante 24 meses se aplica en los dos casos** 🔒 | F1 |
| `freeze` | **Aceptarlo:** transferencia −30 % durante 12 meses | **Protestar en la prensa:** −12 % durante 12 meses y Gobierno −10. **Nunca hay que pagar por adelantado**, así que se acaba el bloqueo | F1 |
| `mayorchain` | **Prometerle un estudio:** 3 M€; Paco se desencadena. A los 6 meses sale el estudio («parada AVE: 30 viajeros al día; parada regional: 400») y abre la petición «Reabrir Villanueva» | **Ignorarlo:** sigue encadenado 4 semanas más, con precaución (−10 km/h) en su tramo; Territorio −5, y vuelve | F3 |
| `busprice` | **Bajar tarifas un tiempo:** −15 % durante 6 meses en las relaciones de menos de 400 km con autobús; anota la respuesta | **Confiar en la velocidad:** Hacienda +1. **La campaña de 5 € ocurre en los dos casos** | F1 |
| `heatwave` | **Patrullas y riego de vía:** 8 M€, sin limitación y con un riesgo residual de deformación | **Limitar velocidades:** 160 km/h en convencional y −20 % en LAV en los tramos «calor» durante 8 semanas. Cambian los tiempos de viaje | F8 |
| `snow` | **Movilizar todo:** 10 M€; el corte dura 3 días | **Esperar al deshielo:** 14 días sin tensión en los 3 puertos | F8 |
| `cows` | **Vallar los tramos rurales:** 6 M€; obra de vallado en las vías únicas rurales; incidencias con animales −80 % | **Esperar, como dice Benito:** Adif +2; el riesgo sigue igual y se ve en la ficha del tramo | F8 |
| `secondhand` | **Comprarlos:** los 4 S112 al 80 % por 60 M€, con aviso de compatibilidad | **No, gracias:** el anuncio sigue 4 semanas en Trenespop | F1 |
| `workshopfire` | **Reconstruir ya:** 18 M€ | **Apañarse:** −1 plaza de taller y desgaste ×1,15 durante 6 meses | F6 |
| `influencer` | **Aprovechar el tirón:** 5 M€; el efecto se extiende a todo el producto durante 3 meses | **Disfrutarlo en silencio:** Gobierno +2. La subida en esa relación ocurre siempre | F1 |
| `festival` | **Refuerzo de verano:** una salida más por sentido en las relaciones turísticas, con unidades libres (8 M€ + operación) | **Lo de siempre:** la demanda que no cabe se va a los autobuses de Íñigo (su cuota sube y se ve) | F2 |
| `audit` | **Un abogado bueno:** 3 M€; si hay multa, se queda en la mitad | **Una consultora:** 7 M€; el riesgo de multa baja un 70 %. En los dos casos el riesgo sale de los trimestres en negativo y de las pruebas de corrupción; la tirada se guarda al abrir la escena (multa de 20 M€ y Hacienda −4 si sale mal) | F1 |
| `adifdelay` | **Pagar el turno de noche:** 12 M€, sin retraso | **Esperar a los arqueólogos:** +4 meses en **esa** obra | F1 |
| `adifboost` | **Poner más dinero:** cerca del 10 % del coste de la obra; −3 meses en **esa** obra | **A su ritmo:** Adif +2 | F1 |
| `royal` | **Tren especial impecable:** 6 M€ y una unidad AVE libre durante un día. Sale bien con probabilidad igual a la puntualidad de la relación | **Que viaje como todo el mundo:** probabilidad igual a la puntualidad − 10. En los dos casos, Gobierno +5 o −5, con la tirada guardada al abrir la escena | F1 |
| `election` | **Inaugurar lo que haya:** solo si algo terminó en las últimas 12 semanas o terminará antes de votar; voto +1 y Gobierno +10 | **No hay nada que cortar:** Gobierno −8 y promesa de inaugurar algo antes de la fecha de la votación | F5. Suena en el adelanto histórico del 29-5-2023 y en un adelanto posterior solo si han pasado 10 años desde que sonó; si no, tarjeta escrita (§3.6, §7.9) |
| `tweet` | **Refuerzo de puntualidad:** 8 M€; prioridad «puntual» y cuadrilla de guardia durante 1 semana. Reto: la red al 90 % o más esa semana; si sale, +3; si no, Gobierno −5 | **Que se le pase:** el reto se mide igual, sin refuerzo | F6 |
| `teruel` | **Prometer catenaria:** promesa de empezar a electrificar un tramo de Teruel en 12 meses (la tensión se elige al firmar). Si se cumple, Territorio +10 y un favor; si no, Territorio −15 y un agravio | **Pedírselo a los Reyes Magos:** Territorio −2 | F2 |
| `luggage` | **Reformar los coches:** 10 M€; reforma escalonada de las unidades de larga distancia y calidad +1 durante 5 años | **Seguir con el tetris:** satisfacción −2 | F1 |

**Capítulos (5) y arcos (5).**
- Los capítulos son los actos de §7.11.1: objetivos idénticos a su texto (F1), plazo y consecuencia (F2).
- Los arcos son la voz de los encargos y solo se ofrecen si su condición es cierta (§7.12): `arc:0`, `arc:1`, `arc:2` y `arc:3` desde F1; `arc:4` («Se acercan las elecciones») desde F5, cuando hay elecciones.

#### 8.6.1 Opciones de las líneas nuevas que piden una decisión

Todas las líneas nuevas de §8.12 que plantean una elección tienen aquí sus opciones. Las etiquetas tienen 4 palabras como máximo y el detalle lo calcula la misma función que aplica el efecto. `efectos-test` y `facciones-test` las recorren todas. Las líneas que solo anuncian algo (etapas, avisos, fases judiciales, finales, hitos) llevan un único botón «Entendido» y su consecuencia ya visible.

| Línea | Lo que pasa siempre (antes de elegir) | Opción A → efecto | Opción B → efecto | Notas |
|---|---|---|---|---|
| `osp-oferta-m` / `-s` | — | «Firmar el contrato»: lo de §6.6 (11 relaciones, unas 52 unidades, maquinistas ×1,05, OSP por tren-km y penalización de los esenciales) y la foto `traspasoMD` | «Ahora no»: el Ministerio la sigue gestionando y la vuelve a ofrecer a los 12 meses. Gobierno −2 | Mientras no se firme, callan las voces que dependen de la Media Distancia |
| `fin-impago` | La caja está en negativo al cierre | Las cinco salidas de §4.5, cada una con lo que recupera; las que no harían nada salen desactivadas con el motivo | — | El rescate de Hacienda siempre está disponible |
| `elige-ministro` | Elecciones ganadas | «Raquel Sanz»: entra (o sigue), con su mazo del Consejo y su pacto de agenda | «Óscar del Puente»: lo mismo | Si eliges a quien ya está, la etiqueta dice «Seguir con…» |
| `mitin` | Faltan 8 semanas para votar | Elegir 2 🔒 de las 6 promesas que tienen sentido ese día (§7.8.8). Cada una da +4 a su grupo y abre un compromiso para la legislatura siguiente | — | Sin elegir no se cierra; «Prometer lo de siempre» elige las 2 más baratas de cumplir |
| `ev-averia-rampa` (Fermín) | La unidad con nombre queda tirada en el tramo «rampa»: sus circulaciones de ese día se cancelan (se devuelve el 50 % del billete) y el tramo pierde 10 puntos de puntualidad ese día, hasta que llega el remolque (0,05 M€) | «Arreglo rápido»: horas extra, 0,15 M€. La unidad vuelve **en 2 días** con estado = máx(estado, 60) y fiabilidad ×0,8 durante 8 semanas; no ocupa plaza de taller. Detalle: «2 días sin el tren» | «Al taller»: [Revisión] completa. Vuelve al 95 % en **21 días** (14 con «Contrato de mantenimiento»), más la cola si no hay plaza. Detalle: «21 días sin el tren (+ N de cola)» | En las dos, si hay una reserva compatible libre entra sola y el detalle lo dice. Si la unidad arreglada deprisa se rompe otra vez en 8 semanas, queda anotado (`arregloRapidoRepite`) |
| `ev-desprendimiento` (Benito) | El tramo «trinchera» queda **cortado desde el anuncio**. Las relaciones que lo cruzan se desvían si hay otra ruta compatible (con su tiempo nuevo) o se suspenden; si el protocolo dice «autobús», ponen autobuses de Autocares Meseta (9.000 € 🔒 por día y relación) | «Dar una cuadrilla»: corte de **3 días** y 0,2 M€. Usa 1 cuadrilla 1 semana: una libre si la hay; si no, la de la obra en fase de obra con más margen, que se para esa semana (el detalle nombra la obra y su nueva fecha). Siempre es posible, porque hay al menos 2 cuadrillas propias | «Esperar a la contrata»: corte de **12 días** y 0,45 M€, sin usar cuadrilla | Después, si el tramo sigue por debajo del 50 %, el riesgo sigue alto y la ficha ofrece «Renovar ›» |
| `ev-aire` (Marisa) | Se estropea el aire de esa unidad: su ocupación baja un 20 % y Viajeros −1 | «Retirarla y repararla»: sale 3 días por 0,05 M€; si hay reserva compatible, entra | «Que siga circulando»: sigue con −20 % de ocupación y Viajeros −1 cada semana hasta su próxima revisión | Queda anotado para Óscar, tema 2 |
| Pactos (`fermin-convenio`, `charo-contrato`, `benito-cuadrilla`, `marisa-carta`, `raquel-inauguracion`, `oscar-tuits`, `pedro-cohesion`, `inigo-noagresion`) | — | «Firmar» | «Rechazar» | Y «Negociar», con la tirada guardada. Las cinco líneas de cada tarjeta están en §7.12.1 |
| Cloacas (`cor-*`, `paco-sobre`, `ext-*`, `sc-*`) | — | Las de §7.8.10 | Las de §7.8.10 | — |
| `s1-fallo` | Se acaba el rescate | «Reintentar»: partida nueva con la misma semilla y las mismas opciones | «Salir» al menú | — |
| `veredicto-bien`, `end-win` | — | «Seguir»: suena `prorroga` y empieza la prórroga sin fin | «Terminar»: pantalla final con el código de la partida | `veredicto-mal` y `end-partial` solo tienen «Terminar»; con la regla «Sin final» no suenan |
| `ult-*` | Empieza la cuenta atrás de 13 semanas 🔒 | «Entendido» | — | La cuenta atrás y el castigo salen en Misión y en Despacho › Apoyo |

### 8.7 El tutorial de 2022 (50 tomas): se queda entero

- **Mismas 9 etapas y mismas comprobaciones** de `induction-runtime`. Solo cambia lo necesario para que siga siendo cierto:
  - **Nombres de la interfaz** que dicen las voces (🔒): «Qué puede circular» (bloque de la ficha de relación), «Competencia» (Red › Competencia), «Investigación» (Progreso › Investigación) y «Agenda» (Despacho › Agenda, donde está el encargo: «Lee el encargo de Agenda»).
  - **La jornada:** «Comienza la jornada» es pulsar ▶. «Pon pausa» es ⏸. «Pasa al día siguiente» es la pausa automática al final del día y su botón «Siguiente día». El parte lo calcula el motor (§3.3) y deja de ser «la previsión del mes repartida entre los días».
  - **Mandato:** la respuesta («caja», «cobertura» o «ambas») se guarda como prioridad de la dirección. Decide las sugerencias de «Siguiente» y los valores iniciales del protocolo.
  - **Primer encargo:** se mide como crecimiento sobre la línea base (§4.8).
  - **Óscar** sale en la placa como «Alcalde de Pucela» (lo dice la voz: «hoy alcalde consultado»). La placa sigue la realidad: alcalde hasta el 16-6-2023, «exalcalde» hasta el 20-11-2023 y ministro desde el 21-11-2023. Antes de esa fecha no habla como ministro.
  - **El lote:** «Para Salamanca comprueba el lote y sus unidades libres» sigue siendo cierto porque la flota se agrupa en lotes también después de F6 (§6.3).
  - **Flota:** la del clásico; la Media Distancia llega después (§6.6).
- **Retomar la guía solo mientras sea verdad.** Varias tomas solo son ciertas a principios de 2022: «Enero de 2022», «Soy Óscar del Puente, hoy alcalde consultado», «Hoy sobra cobertura», «solo sirve hoy nuestro Alvia híbrido S730» y «En 2022 no han entrado todos en todas partes». El clásico deja retomar la guía desde Ayuda («retoma esta guía desde Ayuda»); aquí el botón **«Retomar la guía»** solo aparece si se cumple a la vez:
  - la situación es 2022, sin la regla «Sin tutorial»;
  - la fecha es anterior al 1-1-2023 (y, por tanto, anterior al 17-6-2023, cuando Óscar deja la alcaldía, y al 21-11-2023);
  - **no se ha firmado el contrato de Media Distancia**, y la única unidad propia no eléctrica sigue siendo el S730;
  - la cobertura de maquinistas es ≥ 1, porque una toma dice «Hoy sobra cobertura».

  Además, el director revalida cada toma antes de que suene, como cualquier otro contrato (`exige` por toma). Si una deja de ser cierta a mitad de la guía, esa etapa se muestra sin voz y con un texto neutro de la Guía (?).

  Fuera de esa ventana, Ayuda dice «La guía hablada era la de enero de 2022» y ofrece la **Guía (?)** escrita, que no habla de fechas. Las 50 tomas siguen en la sala de escucha. El texto escrito «retoma esta guía desde Ayuda» del cuadro de tareas, que comprueba `induction-test`, solo se enseña dentro de la ventana; fuera, el cuadro dice «Consulta la Guía (?)».
- **En las situaciones de 2027 no hay inducción.** Hay una **lista que se marca sola** con el estado del juego (Airport CEO), con «¿Por qué no se marca?», «Saltar» y las voces `t-1` a `t-7`.

### 8.8 Compromisos: las promesas se apuntan (F2)

**De dónde salen:**
- opciones de decisiones, sucesos y encuentros con duración;
- pactos;
- peticiones y convenios aceptados;
- promesas del mitin;
- encargos.

**Vocabulario cerrado de comprobaciones.** Todas se pueden calcular con `hechos`:

| Tipo | Ejemplo |
|---|---|
| `servicio(rel, {salidas ≥ n})` | Madrid–Burgos en servicio |
| `puntualidad(ambito, ≥ x, meses n)` | Norte, Levante y Sur al 85 % o más durante 3 meses |
| `tramo(id, propiedad)` | `tal-pla.e ≠ 'no'` |
| `obraIniciada` / `obraTerminada(tipo, tramos, antes)` | Electrificar Teruel |
| `estacion(id, parada \| personal)` | Reabrir Villanueva |
| `unidades(rel, ≥ n)` | 2 unidades en Madrid–Badajoz |
| `sinRecortes(ambito)` | Convenio con la plantilla |
| `cajaMin(x, cadaLunes)` | Reserva de caja de la etapa 2 |
| `resultado ≥ 0 (trimestres m de n)` | Contrato-programa |
| `sinPrestamos` · `sinRescates` | Contrato-programa · etapa 5 |
| `territoriosServidos(≥ n)` | Cohesión |
| `inaugurar(antes)` | Adelanto electoral, `raquel-inauguracion` |
| `noReforzar(rel)` | Pacto con Autocares Meseta |
| `ciudadesAVE(≥ n)` | `legacyvote` |
| `cuota(rival, rel, ≤ x)` | `arc:0` |
| `tarifaSinSubir(meses)` | Mitin: «Billetes congelados» |

**Ciclo de vida:**
- **abierto** → **en riesgo** (queda el 25 % del plazo o menos y no va camino de cumplirse; si es del Gobierno o un ultimátum, pasa a aviso crítico) → **cumplido** o **roto**.
- Al cerrarse se aplica el premio o el castigo, se anota en la memoria del personaje (§8.9), se escribe una línea en el Diario y, si es noticia, sale un titular.
- **Hemeroteca:** el porcentaje de promesas cumplidas entra en la puntuación y en el veredicto.
- **Dónde se ven:**
  - en Despacho › Agenda, con barra de avance y plazo;
  - como chip en el objeto (tramo, relación o estación);
  - en la ventana del personaje: «Le prometiste catenaria · vence en 7 meses».

### 8.9 Memoria de los personajes, cadenas e historias (se anota desde F2; los efectos de la tabla, desde F7)

**Qué se anota.** Cada persona guarda entradas de cuatro tipos: `favor`, `agravio`, `aviso` y `promesa`. Cada una tiene un peso, se olvida a los 2 años y tiene un efecto mecánico:

| Agravio de… | Efecto real | Cuánto dura |
|---|---|---|
| Ministra o ministro | OSP −5 % el trimestre siguiente; no hay visitas ni ofertas de inauguración; cuenta para la remodelación | 26 semanas |
| Adif (Benito) | Permisos de obra ×1,5 | 52 semanas |
| Alcalde (Paco) | El objetivo de Territorio baja 5; puede extorsionar **si existe un secreto del que sea testigo** | mientras dure |
| Talleres (Fermín) | El umbral de huelga sube 5 | mientras dure |
| Viajeros (Marisa) | Viajeros −3 | mientras dure |

**Cadenas.** Las aperturas de los encuentros leen la memoria:
- **Avisos que se cumplen:** si Fermín avisó de una unidad y después se rompe, puede sonar «Te avisé…» (`workshop.disappointed`).
- **Promesas rotas:** Paco dice «Nos prometiste futuro…» (`mayor.disappointed`) solo si hay una promesa rota con él.
- **Promesas cumplidas:** Pedro dice «He vuelto a demostrar que soy imprescindible» solo si se ha cumplido hace poco algo suyo.
- **Contrapesos:** Benito dice «Otra promesa encima del barro» solo si has firmado algo mientras una obra va con retraso.

El retrato de cada persona abre una ventana con lo que recuerda: «Recuerda: le prometiste catenaria (oct 2024) · cesaste a su sobrino».

### 8.10 Consecuencias que se ven y se comprueban

- **Cada efecto es un registro** con origen (cuerpo y fecha), tipo, objetivo, valor, inicio, fin y etiqueta.
  - Aparece como chip con cuenta atrás en la ficha de su objeto: «Lanzamiento Burgos · +10 % · 4 meses».
  - Cuando termina, se mide: «Terminó: +1.240 viajeros al mes (+11 %) frente a los 6 meses anteriores».
- **Diario** (Prensa › Diario), una línea por decisión. Por ejemplo: «21-7-2022 · Raquel · El AVE llega a Burgos · Abrir el AVE a Burgos → Madrid–Burgos abierta, 2 salidas · a los 6 meses: +11 %».
- **Informe del mes** (B y C). Solo se abre si algo cruzó un umbral; si no, queda un enlace en el teletipo. Trae:
  - números: viajeros, ingresos y resultado;
  - **«Tus decisiones»**: efectos que terminaron con su medida y promesas que vencieron;
  - **«Pasó»**: averías, cortes y obras, con su causa (por ejemplo, «Pucela averiado en la Rampa · Fermín te avisó en marzo»);
  - grupos con su variación;
  - **«Viene»**: lo que llega el mes siguiente.
- **«¿Por qué?»** en cada número enseña hasta 5 causas con su origen: «−9 · Obra Ávila–Medina por fases».
- **La Gaceta y Trenter solo cuentan hechos** (F2). Cada titular apunta a un registro del motor y dice su «Fuente». Si todo va bien, no hay titular negativo de relleno.

### 8.11 Las líneas del rescate: qué se queda, qué se reescribe y qué se va

| Grupo | Líneas | Destino |
|---|---|---|
| Grabadas que se quedan | `t-1`, `t-2` | Situaciones de 2027 (§3.8), con su mecánica literal |
| Grabada que se retira | `paco-estacion` | Llama «Ministro» al presidente de Tenfe y repite `decision:rural`. Se queda en el auditorio, marcada «retirada» |
| Sustituidas por cuerpos clásicos ya grabados | `ev-cable`, `ev-nevada`, `ev-huelga`, `ev-auditoria`, `ev-viral`, `ev-fondos`, `ev-visita`, `ev-lowgo`, `ev-tuneles` | Pasan a `event:cable`, `snow`, `strike`, `audit`, `influencer`, `eufunds` y `royal`; `decision:Rossa`, `event:busprice` o `arc:0`; y `decision:gauge` con un aviso escrito |
| Pasan a avisos sin voz | `pact-done`, `pact-broken`, `negotiate-ok`, `negotiate-no` | La reacción del personaje llega con sus encuentros (aperturas de pacto cumplido o roto). Así se resuelve que Íñigo dijera todos los «no» |
| Se renombran y se reescriben | `ev-calor` → `ev-aire`; `ev-averia` → `ev-averia-rampa`; `milestone` → `hito`; `mega-done` → `mega-hecho`; `stage-pass` → `-m` / `-s`; `stage-s4` → `-m` / `-s`; `fin-retirada` → `-m` / `-s`; `fin-quiebra` → `fin-concurso`; `cor-enchufe` y `sc-enchufe` → `-m` / `-s`; **`paco-inaugura` → `paco-parada`** (se graba en F3, antes de que se puedan reescribir los ids viejos) | §8.12 |
| Se reescriben con su mismo id (en F5) | Tutorial (`t-3` a `t-7`) y etapas del rescate, pactos, `ev-desprendimiento`, cloacas, `fin-impago` y elecciones | §8.12 |
| Nuevas sin precedente | `osp-oferta-m`/`-s`, `el-win-2`, `gobierno-aviso`, `cesado`, `s1-fallo`, `elige-ministro`, `remodelacion`, `mitin`, `ult-*`, `acto3-raquel`, `acto4-raquel`, `veredicto-*`, `prorroga`, `operador-del-ano`, `sc-comision`, `sc-pacto-meseta`, `sc-accidente`, `jud-archivo` | §8.12 |

**Regla de convivencia** (F1 a F4). El motor viejo del rescate ya no se publica desde F1, pero `rescate.js` y `rescate-test.mjs` siguen en el repositorio hasta F5 como fuente del port, y `rescate-test` lee los textos de `LINES`. Por eso, de F1 a F4, **las 70 entradas viejas de `LINES` no se tocan**, y toda línea nueva que se grabe antes de F5 lleva un **id nuevo**: es el caso de `paco-parada` en F3. En F5, cuando `rescate-test` pasa a ser `situacion-rescate-test`, se borran las entradas sustituidas y se reescriben las que conservan su id. `build_rescate_voices.py --package` descarta cualquier toma cuyo texto, persona o ánimo cambie, así que ninguna toma vieja se publica con un texto nuevo.

### 8.12 Líneas nuevas: 82

**Reglas:**
- Van al catálogo `LINES` de `proyecto/dist/rescate-data.js` (se mantiene el archivo, porque `build_rescate_voices.py` lo lee de ahí) y se graban con `build_rescate_voices.py`: mismo modelo Qwen, mismas referencias, semilla 424242 y misma masterización.
- **Se graban en la fase en la que su mecánica queda completa**, con el texto congelado antes de grabar: `--package` descarta una toma si cambian el texto, la persona o el ánimo. Si una línea no llega grabada, sale como subtítulo, nunca con `speechSynthesis`, y la etiqueta lo cuenta.
- Ninguna lleva cifras que cambien. Las que llevan una cifra (🔒) la tienen como constante del motor en §4.8.
- Solo afirman lo que garantiza su disparador, y su persona está en el cargo cuando suenan.
- Al jugador se le llama «presidente de Tenfe», «presidente» o «director». Nunca «ministro».
- Con estas 82, `LINES` queda **desde F5** con 85 entradas: 2 grabadas que se conservan (`t-1`, `t-2`), 1 grabada retirada que sigue en el auditorio con la marca «retirada» (`paco-estacion`) y 82 nuevas. Las demás líneas antiguas se borran o se sustituyen por cuerpos clásicos ya grabados (§8.11).
- **Recuento de publicación**, en el juego y en el auditorio: «412/412 + N/M». N son las tomas publicadas en el manifiesto de `rescate-voces` y M es el número de entradas de `LINES`, que es el `expected` que escribe `build_rescate_voices.py --package`. Por fases:

  | Versión | Entradas de `LINES` (M) | Grabadas (N) | Etiqueta |
  |---|---|---|---|
  | 4.1 y 4.2 | 70 (las del rescate, intactas) | 3 (`t-1`, `t-2`, `paco-estacion`) | «412/412 + 3/70» |
  | 4.3 y 4.4 | 71 (+ `paco-parada`) | 4 | «412/412 + 4/71» |
  | 4.5 | 85 (se borran las sustituidas, entre ellas `paco-inaugura`, y entran las 82 nuevas con su texto final) | 30 | «412/412 + 30/85» |
  | 4.6 | 85 | 32 | «412/412 + 32/85» |
  | 4.7 | 85 | 53 | «412/412 + 53/85» |
  | 4.8 | 85 | 57 | «412/412 + 57/85» |
  | 5.0 | 85 | 85 | «412/412 + 85/85» |

  La etiqueta del juego y la de la sala de escucha se generalizan en **F1** (`tools/build-web.mjs`, líneas 192-196 y 225), porque ya en la 4.1 tienen que decir «+ 3/70». Si una fase publica menos tomas de las previstas, la etiqueta dice las reales.

| Fase | Id | Voz · ánimo | Cuándo suena (disparador) | Texto |
|---|---|---|---|---|
| F3 | `paco-parada` (id nuevo; `paco-inaugura` se borra en F5) | Paco · orgulloso | Termina la obra «Reabrir una parada» en Villanueva y al menos un tren para allí | «Ya para el tren otra vez en Villanueva. Cuatrocientos doce vecinos, un andén y una banda que solo se sabe dos canciones. Presidente, esto no se olvida en las urnas.» |
| F5 | `osp-oferta-m` | Raquel · decidida | Primer lunes tras terminar o saltar el tutorial (2022), con Raquel en el cargo; después, cada 12 meses si se rechazó | «La Media Distancia la lleva una sociedad del Ministerio que está en liquidación. Te la ofrezco: trenes viejos, subvención por kilómetro y tres corredores que no pueden llegar tarde. Piénsalo, pero no mucho.» |
| F5 | `osp-oferta-s` | Óscar · decidido | La misma oferta repetida con Óscar en el cargo | «La Media Distancia sigue sin dueño y yo sigo recibiendo quejas. Te la ofrezco otra vez: trenes viejos, subvención por kilómetro y tres corredores que no pueden llegar tarde.» |
| F5 | `el-forecast` | Pedro · preocupado | 26 semanas antes de unas elecciones ordinarias, o el día en que se convoca un adelanto | «Las encuestas están ahí. Mira qué grupos te sostienen y cuáles te van a dejar caer. Quedan pocos meses.» |
| F5 | `el-win` | Pedro · orgulloso | Elecciones ganadas **y** la puntualidad media de la red es mayor que en las anteriores (o que al empezar, si son las primeras) | «Hemos ganado. Tú sigues en Tenfe, yo sigo en la Moncloa y todos seguimos llegando tarde, pero menos.» |
| F5 | `el-win-2` | Pedro · sorprendido | Elecciones ganadas sin esa mejora | «Hemos ganado. No me preguntes cómo, que yo tampoco lo sé. Tú sigues en Tenfe: no lo desaproveches.» |
| F5 | `el-lose` | Pedro · decepcionado | Elecciones perdidas (fin de la partida). Con la regla «Perder no termina» no suena | «Hemos perdido las elecciones. El nuevo Gobierno ya tiene su presidente para Tenfe. Y no eres tú.» |
| F5 | `gobierno-aviso` | Pedro · preocupado | La confianza del Gobierno baja de 20 por primera vez en la legislatura | «Me llegan quejas tuyas hasta en el desayuno. Si esto sigue así, busco a otro. Ya sabes dónde está la puerta.» |
| F5 | `cesado` | Pedro · enfadado | Gobierno por debajo de 15 durante 6 cierres seguidos (fin). `gobierno-aviso` ya sonó antes | «Te avisé de dónde estaba la puerta. Recoge el despacho: viene otro a hacerlo peor con más entusiasmo.» |
| F5 | `fin-impago` | Charo · enfadada | Cierre de mes con la caja en negativo; abre la decisión de impago con sus cinco salidas | «No llegas a los pagos. Tienes cinco salidas y ninguna es gratis. Elige la que menos duela hoy, porque todas se pagan después.» |
| F5 | `fin-concurso` | Charo · decepcionada | Tres cierres seguidos en negativo después de un impago (fin) | «Tres cierres sin poder pagar. Tenfe entra en concurso de acreedores. Yo ya lo había dicho.» |
| F5 | `fin-retirada-m` | Raquel · enfadada | Tercer incumplimiento grave con Raquel en el cargo (fin) | «Demasiados incumplimientos graves. El Ministerio os retira la concesión. Recoge tus cosas.» |
| F5 | `fin-retirada-s` | Óscar · enfadado | Lo mismo con Óscar en el cargo (fin) | «Demasiados incumplimientos graves. El Ministerio os retira la concesión. Recoge tus cosas.» |
| F5 | `t-3` | Benito · decidido | Rescate: primer lunes, después de `t-2` | «Benito, de obras. El Norte se rompe entre Ávila y Medina: vía cansada y limitaciones de velocidad. Pulsa el tramo y pide un bateo, que se hace de noche. La renovación entera tarda meses.» |
| F5 | `t-4` | Charo · preocupada | Rescate: primera vez que abres el presupuesto de una obra o de una compra | «Charo, de Presupuestos. Antes de firmar, mira la cuenta: lo que cuesta ahora, lo que cuesta cada mes y lo que tienes que pagar pronto. Si no llegas a los pagos, no firmes.» |
| F5 | `t-5` | Fermín · decidido | Rescate: primera vez que abres Trenespop | «Fermín, del taller. Un tren de segunda mano puede llegar este mismo mes; uno nuevo tarda más de un año. Y un tren en revisión no circula. Si la vía sigue rota, un tren más es un tren más llegando tarde.» |
| F5 | `t-7` | Raquel · orgullosa | Rescate: primer cierre de mes | «Primer mes cerrado: trenes, billetes, nóminas y obra. A partir de aquí decides tú. Yo vuelvo cuando haya foto.» |
| F5 | `stage-s1` | Raquel · decidida | Rescate: empieza la etapa 1 | «Primer trimestre. Que el Norte vuelva a llegar a su hora en trece semanas. Y paga todo: un impago en tu primer trimestre es un titular que no quiero leer.» |
| F5 | `stage-s2` | Charo · preocupada | Empieza la etapa 2. La reserva de caja se comprueba en cada movimiento de caja (y cada lunes desde F6) | «Ahora los tres esenciales: Norte, Levante y Sur fiables antes de fin de año. Y la caja, siempre por encima de la reserva. Siempre: la miro cada semana.» |
| F5 | `stage-s4-s` | Óscar · decidido | Empieza la etapa 4 con Óscar recién llegado al Ministerio (enero de 2031) | «Nuevo ministro, nuevas prioridades. Quiero tren en dos territorios olvidados y que OuiOui no se coma tus corredores buenos. Lo quiero en hilo y con fotos.» |
| F5 | `stage-s5` | Pedro · decidido | Empieza la etapa 5 (enero de 2033). La placa existe como objeto del mapa en Atocha | «Última legislatura. Cinco corredores fiables, nada de rescates y otras elecciones. Si lo consigues, te ponemos una placa en Atocha. Pequeña.» |
| F5 | `stage-fail` | Charo · decepcionada | Vence una etapa 2–5 sin cumplirse (cuenta como grave) | «No has cumplido el objetivo en plazo. Queda en tu expediente como incumplimiento grave. Al tercero, el Ministerio os retira la concesión.» |
| F5 | `stage-pass-m` | Raquel · orgullosa | Etapa cumplida con Raquel en el cargo | «Objetivo cumplido. Lo voy a contar como si hubiera sido idea mía, que para eso estoy.» |
| F5 | `stage-pass-s` | Óscar · orgulloso | Etapa cumplida con Óscar en el cargo | «Objetivo cumplido. Ya lo he tuiteado. Dos veces.» |
| F5 | `s1-fallo` | Raquel · decepcionada | La etapa 1 vence sin cumplirse (fin del rescate, con «Reintentar») | «Trece semanas y no has cumplido. Te lo dije el primer día: aquí se acaba tu rescate.» |
| F5 | `end-win` | Pedro · orgulloso | Diciembre de 2034: etapa 5 cumplida, elecciones ganadas y resultado del año ≥ 0 | «Ocho años, dos elecciones y una red que funciona sin rescates. Hay quien decía que era imposible. Tú lo has hecho, y yo lo voy a contar.» |
| F5 | `end-partial` | Charo · preocupada | Diciembre de 2034, elecciones ganadas pero sin `end-win` | «Has aguantado ocho años, pero lo prometido no está completo o la red no se paga sola. Te recordarán como el que casi lo arregla.» |
| F6 | `t-6` | Raquel · contenta | Rescate: primera vez que pones pausa | «El reloj corre, pero puedes pararlo cuando quieras: mirar y comparar es gratis. Lo que firmas, se cumple. Y lo que prometes, se apunta.» |
| F6 | `ev-averia-rampa` | Fermín · preocupado | Se avería una unidad con nombre en un tramo con etiqueta «rampa» | «Se nos ha muerto un tren en plena rampa. Puedo arreglarlo deprisa con horas extra o meterlo en el taller como Dios manda. Tú decides cuánto lloramos.» |
| F7 | `elige-ministro` | Pedro · contento | Noche electoral ganada, ordinaria o adelantada (desde la de 2027 en la situación 2022; desde la de diciembre de 2030 en las de 2027) | «Ganadas las elecciones, toca Gobierno. ¿Con quién quieres trabajar en Transportes? Elige bien, que luego no se devuelven.» |
| F7 | `remodelacion` | Pedro · decidido | Remodelación por estado (§3.7): Gobierno 13 semanas por debajo de 25, encuesta ≥ 45 y agravio del ministro | «He cambiado el Ministerio de Transportes. No es por ti. Bueno, un poco sí. Trata bien a quien llega, que también tiene micrófono.» |
| F7 | `mitin` | Pedro · decidido | 8 semanas antes de unas elecciones (ordinarias o adelantadas) | «Mitin en ocho semanas. Necesito dos promesas que la gente entienda y que tú puedas cumplir. Yo las apunto, y ellos también.» |
| F7 | `ult-viajeros` | Marisa · enfadada | Ultimátum de Viajeros (§7.8.4) | «Tres meses. Si en tres meses no llegáis a vuestra hora, os reclamamos cada retraso en los tribunales. Y vamos a ganar.» |
| F7 | `ult-territorio` | Paco · enfadado | Ultimátum de Territorio | «Le doy tres meses. Si las comarcas siguen olvidadas, llevo una moción al Congreso y le recortan la subvención. Amigos allí tengo más que trenes.» |
| F7 | `ult-plantilla` | Fermín · enfadado | Ultimátum de Plantilla | «Tres meses, ni uno más. Si no hay convenio ni manos, los maquinistas paran. Y esta vez va en serio.» |
| F7 | `ult-hacienda` | Charo · enfadada | Ultimátum de Hacienda | «Tres meses para ordenar las cuentas. Si no, intervengo: ni un euro de crédito y ni una obra grande sin mi firma.» |
| F7 | `acto3-raquel` | Raquel · enfadada | Empieza el Acto III con Raquel en el Ministerio (volvió tras 2023) | «He vuelto y el corredor mediterráneo sigue en los discursos. Quiero un AVE de València a Barcelona y alta velocidad en Almería. Tercer carril donde haga falta, y ni una cinta sin catenaria.» |
| F7 | `acto4-raquel` | Raquel · preocupada | Empieza el Acto IV con Raquel en el Ministerio | «La España vaciada vuelve al telediario, y esta vez me miran a mí. Electrifica lo que siga con gasóleo, lleva el AVE a más ciudades y termina alguna línea nueva.» |
| F7 | `stage-s3` | Pedro · orgulloso | Rescate: empieza la etapa 3 (enero de 2028), ya con mitin | «Querido presidente de Tenfe: sanea las cuentas, cumple lo que prometas en campaña y gánanos las elecciones. Las tres cosas cuentan.» |
| F7 | `stage-s4-m` | Raquel · decidida | Empieza la etapa 4 con Raquel elegida para seguir tras ganar en 2030 | «Seguimos. Ahora quiero tren en dos territorios olvidados y que OuiOui no se coma tus corredores buenos. Y lo quiero con fotos.» |
| F7 | `veredicto-bien` | Pedro · contento | La noche electoral que cierra el «último gran mandato» (situación 2022; julio de 2051 si no hubo adelantos): elecciones ganadas, Acto V cumplido y resultado de 12 meses ≥ 0 | «Desde aquel enero de 2022 hasta hoy: la red funciona y las cuentas no dan vergüenza. Lo anunciaré como mío. Tú sabes que no lo es, y con eso basta.» |
| F7 | `veredicto-mal` | Pedro · decepcionado | Esa misma noche electoral sin esas condiciones (fin, sin prórroga) | «Se acabó el plan. La red que dejas no es la que prometimos, y eso ya no lo arregla ninguna foto. Firma aquí y apaga la luz.» |
| F7 | `prorroga` | Pedro · orgulloso | Tras `veredicto-bien` o `end-win`, si el jugador elige «Seguir» | «Me presento otra vez. España me necesita, y tú necesitas a alguien que firme tus obras. Sigue.» |
| F7 | `fermin-convenio` | Fermín · decidido | Agenda de Fermín: Plantilla por debajo de 45 | «La plantilla firma la paz si sube la nómina. Medio año sin huelgas. Y sin recortes, que nos conocemos.» |
| F7 | `charo-contrato` | Charo · preocupada | Agenda de Charo: dos trimestres seguidos en negativo | «Te ofrezco un contrato-programa: más subvención cada trimestre. A cambio, cuentas en positivo y ni un préstamo más. Si me fallas, me lo devuelves con intereses y con auditoría.» |
| F7 | `marisa-carta` | Marisa · decidida | Agenda de Marisa: esenciales por debajo de 80 y Viajeros por debajo de 40 | «Firma una carta de compromisos: el Norte, el Levante y el Sur llegando a su hora. Si cumples, te aplaudimos. Si no, te reclamamos hasta el último billete.» |
| F7 | `raquel-inauguracion` | Raquel · orgullosa | Raquel en el cargo, elecciones a menos de 14 meses y nada inaugurado en 26 semanas | «Necesito cortar una cinta antes de las elecciones. Me da igual qué: una obra, un andén, un banco del parque. Tú termina algo y yo pongo la sonrisa.» |
| F7 | `oscar-tuits` | Óscar · contento | Lo mismo con Óscar | «Tengo un plan de comunicación: tres inauguraciones en seis meses. Tú pones las obras, yo pongo los tuits. Si no hay obras, también habrá tuits. Sobre ti.» |
| F7 | `pedro-cohesion` | Pedro · orgulloso | Territorio por debajo de 40 y elecciones a menos de 2 años | «España no se acaba en la Castellana. Te pago un buen pellizco si pones un tren diario en algún sitio que nadie sepa señalar en el mapa.» |
| F7 | `inigo-noagresion` | Íñigo · orgulloso | Extremadura con una salida por sentido o menos, y Soria o Teruel igual. Firmar crea un secreto con Íñigo de testigo (registro desde F9; en una partida anterior se crea al cargar) | «Te propongo un trato entre caballeros. Mis autocares te llevan gente a Soria y a Teruel. Tú te olvidas de Extremadura un año. Nadie tiene por qué enterarse.» |
| F8 | `ev-desprendimiento` | Benito · preocupado | Tramo «trinchera» con estado por debajo de 50 en un día de lluvia o de invierno; el tramo **queda cortado** al anunciarse | «Desprendimiento de rocas en la trinchera. Nadie herido, pero la vía está cortada. Si me das una cuadrilla, lo despejo rápido; si no, esperamos a la contrata.» |
| F8 | `ev-aire` | Marisa · enfadada | Día con 40–44 °C y una unidad con estado por debajo de 55 en un tramo «calor» | «Cuarenta grados fuera y el aire acondicionado del tren en huelga. Hay gente abanicándose con el billete, y yo con la paciencia.» |
| F8 | `benito-cuadrilla` | Benito · contento | Agenda de Benito: ninguna cuadrilla libre y una vía por debajo de 50 | «Te presto una cuadrilla de Adif tres meses. Gratis. Bueno, gratis no: luego me pagas unos gastos de coordinación. Así funciona esto.» |
| F8 | `hito` | Marisa · contenta | Hitos 1 a 3 (después, la tarjeta sale sin voz) | «Hay gente en los andenes. Gente de verdad, con maletas. Esto empieza a parecer una compañía ferroviaria.» |
| F9 | `mega-hecho` | Pedro · orgulloso | Termina un megaproyecto que no es el Monumento | «Megaproyecto terminado. Esto sale en los libros de texto. O al menos en el telediario.» |
| F9 | `operador-del-ano` | Pedro · sorprendido | Diciembre: Tenfe gana el Operador Ferroviario del Año | «¿Operador ferroviario del año? ¿Nosotros? Que no se entere nadie de cómo, que me lo creo y todo.» |
| F9 | `cor-comision` | Íñigo · orgulloso | Pedido nuevo a una marca, con Íñigo como Conseguidor | «Tengo un amigo en la fábrica que te ofrece una atención: un siete por ciento del contrato en una cuenta de Andorra. El contrato sube un poco, claro. Alguien lo tiene que pagar.» |
| F9 | `cor-traviesas` | Benito · contento | Primera renovación en fase de obra (si aceptas, **Tenfe paga** esos kilómetros y nace un secreto) | «Te propongo una cosa. Certificamos dos kilómetros de traviesas que ya estaban puestas. Nadie las va a contar. La diferencia, a medias.» |
| F9 | `cor-yate` | Íñigo · contento | Hay un anuncio de BCBB en Trenespop; la propuesta existe (anuncio con descuento) | «Este fin de semana salgo en el yate con los de BCBB. Gambas, champán y una propuesta de contrato. Vente, que el mar no graba.» |
| F9 | `cor-enchufe-m` | Raquel · contenta | Agenda del Ministerio con Raquel (si aceptas, las obras van ×1,33 más lentas) | «Mi sobrino Borja necesita trabajo. Es muy espabilado: sabe de todo un poco. Hazle jefe de cuadrilla y te debo una.» |
| F9 | `cor-enchufe-s` | Óscar · contento | Lo mismo con Óscar | «Mi sobrino Borja necesita trabajo. Es muy espabilado: sabe de todo un poco. Hazle jefe de cuadrilla y te debo una.» |
| F9 | `cor-mariscada` | Fermín · contento | Diciembre | «La cena de Navidad de la dirección: noventa mil euros en marisco. ¿Lo cargamos a «formación en seguridad»?» |
| F9 | `paco-sobre` | Paco · contento | Aceptas el sobre al alcalde (crea la promesa «arreglar la comarca» y un secreto) | «Lo del sobre, ni una palabra. Usted me arregla la comarca y yo le arreglo los permisos. Aquí las cosas se hacen como toda la vida.» |
| F9 | `ext-inigo` | Íñigo · orgulloso | Secreto del yate sin publicar (**las fotos existen** en el registro) | «Tengo unas fotos tuyas muy bonitas. Si pagas, se quedan en mi cajón. Si no, en la portada del domingo.» |
| F9 | `ext-paco` | Paco · enfadado | Sobre a Paco **y** su promesa rota | «O me cumples lo de la comarca o le cuento a la prensa lo del sobre. Yo no tengo nada que perder. Tengo un pueblo de cuatrocientos doce habitantes.» |
| F9 | `ext-benito` | Benito · preocupado | Secreto de las traviesas y causa abierta (el sueldo extra es **mensual**) | «Me han llamado del juzgado. Si me subes el sueldo, me acuerdo de muy pocas cosas. Si no, me acuerdo de todas.» |
| F9 | `sc-traviesas` | Marisa · enfadada | Sale el secreto de las traviesas | «Ha salido el caso Traviesas: pagaste kilómetros de vía que no existen. La gente quiere saber dónde está el dinero. Yo también.» |
| F9 | `sc-yate` | Marisa · sorprendida | Sale el secreto del yate | «Portada del domingo: tú en un yate con el fabricante chino y una langosta. Pie de foto: «Negociando a la baja».» |
| F9 | `sc-comision` | Marisa · enfadada | Sale una comisión que no es de BCBB | «Portada: comisiones en los contratos de trenes. Una cuenta en Andorra, tus iniciales y un fabricante muy agradecido.» |
| F9 | `sc-enchufe-m` | Marisa · enfadada | Sale el enchufe del sobrino de la ministra | «El sobrino de la ministra es jefe de cuadrilla y no sabe lo que es una traviesa. Lo han grabado preguntando si el balasto se come.» |
| F9 | `sc-enchufe-s` | Marisa · enfadada | Sale el enchufe del sobrino del ministro | «El sobrino del ministro es jefe de cuadrilla y no sabe lo que es una traviesa. Lo han grabado preguntando si el balasto se come.» |
| F9 | `sc-mariscada` | Marisa · enfadada | Sale la mariscada | «Noventa mil euros en marisco cargados a formación en seguridad. La formación consistía en abrir nécoras sin cortarse.» |
| F9 | `sc-sobres` | Marisa · enfadada | Salen sobres al alcalde, al inspector o a diputados | «Caso Sobres: dinero en mano a cambio de favores en tus obras. La Gaceta tiene una libreta con tus iniciales.» |
| F9 | `sc-pacto-meseta` | Marisa · enfadada | Sale el pacto con Íñigo | «Sale tu pacto con Autocares Meseta: tú te olvidabas de Extremadura y él te llenaba Soria y Teruel. Los extremeños ya saben por qué no les llegaba el tren.» |
| F9 | `sc-accidente` | Marisa · preocupada | Descarrilamiento leve **en el tramo** de una obra certificada sin pruebas | «Un tren ha descarrilado a poca velocidad en una obra recién certificada. No hay heridos, pero sí preguntas: alguien firmó las pruebas sin mirarlas.» |
| F9 | `sc-juez` | Charo · enfadada | Pillan el soborno al juez (lleva a la condena) | «Han pillado el soborno al juez. Esto ya no es un escándalo, es una película. Y tú sales en el cartel.» |
| F9 | `sc-charo` | Charo · enfadada | Le ofreces un sobre a Charo | «¿Un sobre? ¿A mí? Acabo de reenviar tu oferta a la Fiscalía Anticorrupción con copia a mi madre.» |
| F9 | `jud-1` | Charo · preocupada | Fase judicial 1: diligencias | «Un juzgado ha abierto diligencias previas. Todavía no te han llamado. Todavía.» |
| F9 | `jud-2` | Charo · enfadada | Fase 2: imputación | «Estás imputado. Cada semana que pase, los viajeros y los diputados te mirarán peor.» |
| F9 | `jud-3` | Pedro · enfadado | Fase 3: juicio oral | «Juicio oral. No te conozco. No te he conocido nunca. ¿Quién eres?» |
| F9 | `jud-end` | Pedro · decepcionado | Condena e inhabilitación (fin) | «Condenado e inhabilitado. Tenfe pasa a manos de un comisario de Hacienda. Lo siento mucho. Bueno, no tanto.» |
| F9 | `jud-archivo` | Charo · sorprendida | Se archiva la causa | «Han archivado la causa. No me preguntes cómo, que prefiero no saberlo. Pero no tientes a la suerte dos veces.» |

**Cuentas por fase:** F3: 1 · F5: 26 · F6: 2 · F7: 21 · F8: 4 · F9: 28. **Total: 82 líneas**, unos 70 minutos de CPU a 50 s cada una. Quedan 68 de margen dentro del presupuesto de 150 para repeticiones y para variantes de las líneas que más se repiten (B), después de la 5.0.

### 8.13 Pruebas de verdad (bloquean la publicación)

| Prueba | Qué exige | Desde |
|---|---|---|
| `guion-completo` | Las 412 fuentes del catálogo y todas las `LINES` tienen un contrato o están en `RETIRADOS` (5 encuentros + `paco-estacion`). Cada contrato declara sus `mecanicas`, su fase y su enfriamiento de voz. Existen las 45 filas persona·tema de §8.5 y las opciones de §8.6.1. Una fuente sin contrato hace fallar la prueba | F1 (filas de encuentros desde F2) |
| `sin-copias` | Ningún módulo nuevo contiene 40 caracteres seguidos de un cuerpo del catálogo | F1 |
| `numeros-voz` | Cada constante de §4.8 es igual en el motor. Amplía `voice-text-test` | F1 |
| `silencio` | Un robot juega 6 semillas de 2022 a 2030 y ningún cuerpo cuyas `mecanicas` no existen en la versión suena nunca | F1 |
| `verdad-fuzz` | Un robot con estrategias variadas juega semillas de 2022 (6 en F2; 12 desde F5, hasta 2040) y de 2027 (6 desde F5, hasta 2034). En cada escena comprueba que `exige` y `afirma` son ciertos y que la persona está `enCargo`. Después de cada opción, que el estado contiene el efecto declarado. En cada vencimiento, que el compromiso se ha resuelto | F2 |
| `efectos` | Cada opción de cada escena y de cada tarjeta escrita cambia el estado en 8 días o menos, o abre un compromiso, y lo cambia **en el objeto que nombra su instancia** (la vía en «Inspeccionar la vía», el taller en «Pagar el turno de noche»…). Ninguna escena sale con todas sus opciones imposibles | F2 |
| `presentacion` | Cada escena usa la persona y el ánimo del catálogo, y el `data-say` es el texto en bruto | F2 |
| `recarga` | Guardar en el día d, cargar y seguir da el mismo resultado: las tiradas van sembradas por día y las apuestas guardan la suya | F1 |
| `alcance` | Informe, no bloquea. Mide qué cuerpos sonaron al menos una vez en 40 partidas sembradas. Objetivo: ≥ 90 % de los no retirados cuyas mecánicas existen | F2 |
| `extract-game-source` | La suma del catálogo sigue siendo `6348984c…` y hay 412 filas. Corre en cada compilación | siempre |

---

## 9. D7 · Qué se queda de cada modo y qué se va

### 9.1 De la campaña clásica

| Se queda (y cómo) | Se va o cambia (y por qué) |
|---|---|
| La red de 125 tramos y el planificador (`infra.plan`, `faultText`) con el bloque «Qué puede circular» 🔒, ahora con tensión, gálibo, estado y capacidad (F3, F8) | **«Delegar mes»** y «Hasta el último tren» → velocidades con protocolo (F6). Delegar dominaba sin jugar y esquivaba penalizaciones |
| El horario GTFS, los trenes en el mapa, el día y la noche con el sol real, «Mirar los trenes» y los paneles de salidas | **La permutación de encuentros** (`tycoon.js:158`) → el director (F1 la quita; F2 trae el selector). Era «pulsar random» |
| Las aperturas históricas en su **día** exacto, con el fallo del cambio de mes corregido (`operations.js:232`, F1) | **La tirada mensual del 32 %** de sucesos (`engine.js:158`) → riesgos con causa y sitio (F1 la quita) |
| Los **encargos**: requisitos inspeccionados en vivo, dos ramas, 3 cierres seguidos y comprobación del material. Es el mejor sistema «objetivo ↔ estado» que había | **Los dados del 22 %** (retraso de obra) **y del 28 %** (retraso de entrega) → retrasos con causa: Territorio, invierno, cola de fábrica (F1 los quita) |
| Los **capítulos** como actos, con objetivos iguales a su texto, plazo y consecuencia (F1–F2) | **El préstamo puente automático** → impago con 5 salidas (F5) |
| El logit de demanda (autobús y rivales), la tarifa como palanca y el índice de costes | **El pago inmediato de las peticiones** (truco de +42 M€) → se cobran tras 3 cierres cumplidos (F1) |
| Rivales deterministas: entrada, guerras y revisiones | **`fleetcare`** (+8 a toda la flota por 2 M€) → revisión dirigida (F2 por lote, F6 por unidad) |
| Maquinistas con formación de 3 meses 🔒; incidencias de la jornada; respuestas de 18.000 € y 9.000 € 🔒 | **Las apuestas** que se repetían hasta ganar (auditoría, visita) → probabilidad que sale del estado, con la tirada guardada (F1) |
| Trenespop: tienda, fotos, marcas, usados, fábrica, 30 % / 70 % y 2 unidades al mes | **Una satisfacción que no movía la demanda** → ahora la mueve (F2) |
| Ficha de ciudad con su perfil urbano, los +/− de frecuencia y las peticiones en su sitio | **La política fijada para siempre** → Estatuto revisable tras cada elección ganada (F7) |
| El reparto, los retratos y las 412 tomas; el tutorial de 9 etapas | **Ignorar la tensión** → tensión obligatoria (F3) |
| Políticas e investigación (una a la vez 🔒) | **«Trenes llenos» en todas las peticiones** (falso) → el dato real |
| Estaciones con niveles, la Gaceta y los logros (ahora medallas) | **El Despacho de 4 pestañas × 5 subpestañas** → cajón de 2 niveles (F4) |
| La escala de dinero en M€ | Los textos de la portada y del README que prometen «modo libre» y «cinco capítulos 2022–2050» como modos aparte |

### 9.2 Del Rescate de Tenfe

| Se queda (y cómo) | Se va o cambia (y por qué) |
|---|---|
| Un motor puro y determinista, con la semilla en el estado y un robot de equilibrado | **Tres órdenes por semana.** No encaja con el reloj continuo ni con Cities o Tropico, y ninguna voz grabada la defiende (la única era `t-6`, sin grabar). La escasez viene de recursos físicos (§2.3) |
| **Presupuesto antes de comprometerse** con la misma regla que el motor (`workQuote`, `punctProjection`, `serviceQuote`, `cashProjection`, `plannedAid`), **portado** a tramos, días y meses con sus pruebas | **★ como moneda.** El tutorial grabado dice que la investigación cuesta dinero y tiempo 🔒. La ★ pasa a ser solo la clase de un convenio; el capital político es ◆ |
| **Causas a la vista** (`punctTarget().causes`, filas de `groupTargets`) → «¿Por qué?» | **Los 11 corredores abstractos y su escala de dinero** → relaciones de Media Distancia sobre tramos reales; los corredores quedan como agrupaciones con nombre |
| **Misión → obstáculo → acción** → la columna Misión y la línea «Siguiente» | **«Lowgo»** → OuiOui (`lowgo` ya era su id) |
| Las paradas de «Avanzar» → motivos de la pausa automática y de ⏭ | **El cristal oscuro sobre pergamino, el raíl de 11 páginas y las 8 píldoras de capas** → un solo lenguaje visual y 6 secciones |
| **Obras en 3 fases con 3 modos de servicio**; ayuda prevista ligada a una obra (F8) | **Ofertas de pacto con un 9 % semanal** → agendas con disparador (F7) |
| **Pactos comprobables** (beneficio, obligación, plazo y consecuencia), 2 a la vez | **El 20 % semanal de sucesos y las averías silenciosas** → riesgos situados que salen en el parte |
| **Impago con salidas** | **El informe semanal que nunca se enseñaba** → parte del día e Informe del mes |
| **Cloacas causales** (secretos, sospecha, pruebas y fases), ahora con registro de testigos (F9) | **Las líneas duplicadas sin grabar** → los cuerpos clásicos ya grabados (§8.11) |
| Megaproyectos por etapas; hitos que abren sistemas | **El guardado `tenfe-rescate-v1` como partida aparte** → se convierte a `iberia-ferroviaria-v5` (F5); la clave vieja no se borra |
| Territorios: licencia → vía ≥ 40 % → tren diario (situaciones 2027) | **El motor viejo como modo aparte.** Sale de la portada y de la compilación en F1 (no se publica con contradicciones de F1 a F4); su guardado se conserva y se convierte en F5 |
| Grupos con peso y media de 26 semanas; elecciones legibles | |
| Tutorial por acciones (lista que se marca sola), las 63 imágenes, las voces `t-1` y `t-2`, trenes y autobuses en el mapa | |

### 9.3 Del modo libre

| Se queda | Se va |
|---|---|
| Caja de 500, 1.500 o 5.000 M€ (o ilimitada), rivales sí o no, sin fecha final y sin cese: son **reglas de maqueta** de la misma partida, con más casillas (§7.7) | El modo aparte, su guardado que pisaba la campaña y el botón «Nueva partida» que arrancaba una campaña (fallo de `app.js:960`) |
| Juego sin fin y el logro «Más allá de 2050» (como medalla de la prórroga) | Las medallas en maqueta: cualquier casilla las desactiva, y se avisa |

---

## 10. D8 · Lo que tomamos de Airport CEO (y de Tropico, Cities y los juegos de trenes)

### 10.1 Airport CEO: 15 préstamos adaptados

| # | En Airport CEO | En Tenfe | Qué aporta | Fase |
|---|---|---|---|---|
| 1 | **Contratos marco con aerolíneas**, que luego ofrecen vuelos; **clases en estrellas** ligadas a la nota | **Convenios con las comunidades.** Cada comunidad tiene un convenio sin caducidad y una **clase ★ (1–5)** que sale de la satisfacción media de 8 semanas de sus viajeros. Manda **peticiones de servicio** («Madrid–Badajoz, 3 salidas al día, 85 % o más, tarifa de 35 € o menos, 0,9 M€ al mes, 36 meses»). Se cobran los meses que se cumple el KPI, con 5 puntos de margen; 3 meses seguidos fallando, rescisión y −1 ★. Las de 4–5★ pagan más y castigan más. Absorben las peticiones de ciudades del clásico | El bucle central de Airport CEO, con dilema real | F9 |
| 2 | **Stands** limitados: un vuelo sin stand no se puede asignar | **Surcos por tramo** (§5.3). El planificador no deja añadir una salida sin capacidad y dice dónde: «Sin surcos libres en Encina–Xàtiva (vía única, 30/30) · Apartaderos ›» | La capacidad se entiende sin manual | F8 |
| 3 | **Monitor de vuelos** (G): columnas agrupadas por color y contador de avisos con la causa | **Monitor de servicios** (Red › Servicios, tecla M). Una fila por relación: blanco (punto de beneficio, nombre, producto, chips de ancho y tensión), azul (unidades, salidas, ocupación), amarillo (viajeros, sin plaza, puntualidad), rojo (estado de vía, taller, obras), y al final neto de 3 meses, cuota de rivales y avisos. La causa sale al pasar el ratón: «Faltan 2 maquinistas · `ter-sag` a 90 · el convenio de Aragón exige 85 %» | Ver de un vistazo qué pierde dinero y qué llega tarde | F4 |
| 4 | **Notificaciones**: tras el fracaso de los correos, solo lo crítico en la columna y el resto en una bandeja | **Triaje de avisos en tres niveles** (§11.5): como mucho 3 críticos en Misión, la bandeja «Avisos» agrupada por objeto que se vacía sola, y marcadores en el mapa | El jugador sabe qué falla y dónde | F4 |
| 5 | **Emergencias** con plazo, nota de la A a la F e informe (cuyo fallo era «A, sin multa» con una multa de 1,36 M) | **Incidencias con plazo y nota.** A ▶ hay X minutos de juego para responder; si no, actúa el protocolo. Al cerrarse, nota de la A a la F y, si hay multa de la AESF, **el importe es exactamente la línea del libro de caja**, con enlace | Decidir en lugar de tirar dados; el informe cuadra con el dinero | F6 |
| 6 | **Planificador automático** con reglas | **Protocolo de incidencias** permanente por tipo y retraso, con tope de gasto diario. Sus valores iniciales salen de la prioridad elegida en el tutorial | Avanzar a ▶▶▶ es justo y la jornada no es un impuesto | F6 |
| 7 | **Notas en dos niveles** (semana y media) | Cada grupo enseña «semana · media de 26 semanas»; la media es la que vota (§7.8.1) | El apoyo no parece aleatorio | F5 |
| 8 | **Renegociación** con probabilidad visible y puntos (y su fallo: se ganaba recargando) | Ventana cada 26 semanas, deslizadores con la probabilidad en vivo, **tirada guardada al abrirse**, 2 contraofertas como mucho, cada punto cuesta 1 ◆, una concesión a favor del otro siempre se acepta | Habilidad y riesgo legibles, sin trampa | F7 |
| 9 | **Modo plano**: dibujar, ver el coste y construir después | **Planos de obra**: rojo (necesita la obra) y azul (ya la tiene) en el mapa; «Añadir al plano» gratis, línea discontinua, hasta 3 planos comparados, «Encargar» | «Mirar es gratis», ahora en el mapa | F8 |
| 10 | **Panel de gestión** desde la izquierda, ≤ 50 %, 2 niveles | **El cajón** (§11.3): 6 secciones con ≤ 5 pestañas y el mapa siempre visible; solo Trenespop llega al 70 % | Saber siempre dónde están las cosas | F4 |
| 11 | **Aeropuerto del Año** | **Operador Ferroviario del Año**: 10 operadores europeos parodiados cada diciembre, por puntualidad, satisfacción y resultado | Una meta anual y sátira | F9 |
| 12 | **Tutorial** con pasos que se marcan solos | En 2027, **lista que se marca sola** con el estado del motor, «¿Por qué no se marca?» y «Saltar». En 2022, el tutorial grabado ya comprueba el estado (`induction-runtime`) | Aprender jugando | F5 |
| 13 | **Requisitos escritos** y botón apagado con el motivo | Debajo de cada botón de abrir o de obra, los requisitos (unidades, maquinistas, surcos, 4 M€ 🔒) con ✓ o ✗; si falta algo, el botón dice qué y ofrece el remedio | Nunca un fallo silencioso | F4 |
| 14 | **Análisis de rutas** | **«¿Puede pasar?»**: un modelo y dos estaciones; el mapa pinta el camino o el primer tramo que lo impide, con la obra que lo arreglaría | La compatibilidad se entiende en el mapa | F3 |
| 15 | **Partida nueva** con ficha y casillas; logros desactivados en modo libre | **Nueva partida** en una pantalla con situación, semilla, rasgo, dificultad y reglas de maqueta con «Seleccionar todo»; cualquier casilla desactiva medallas y retos | El modo libre deja de ser un modo | F1 |

**Lo que no copiamos de Airport CEO:** correos que no se pueden quitar, interruptores escondidos, fallos silenciosos (un arrastre que vuelve a su sitio sin explicación), el planificador que lo agrupa todo en oleadas, negociaciones que se ganan recargando, notas sin consecuencias, información repartida en cinco canales y menús de tres niveles.

### 10.2 Tropico

| En Tropico | En Tenfe | Fase |
|---|---|---|
| Facciones con líder, exigencias y elecciones | Cinco grupos (cuatro votan) con cara grabada; elecciones con mitin (§7.8) | F5, F7 |
| Exigencias que cambian por partida | **Obsesión secreta** de cada líder (1 de 3) y **agenda** (2 de 4 disparadores) | F7 |
| Ultimátums | Ultimátum con **castigo propio** por grupo y cuenta atrás de 13 semanas 🔒 | F7 |
| Constitución y edictos | **Estatuto** de 4 artículos y **Políticas** en huecos que ganan efecto con el tiempo | F7 |
| El Broker | **El Conseguidor** (Íñigo) con tablero de ofertas y riesgo visible | F9 |
| Almanaque con causas | «¿Por qué?» en cada número; tres partes en cada grupo | F2, F5 |
| Rasgos del presidente, dificultad que multiplica la puntuación | 8 rasgos y 4 dificultades con multiplicador | F3 |
| Calendario de sucesos anunciados | Progreso › Calendario, 12 meses por delante | F4, F8 |

### 10.3 Cities: Skylines (I y II)

| En Cities | En Tenfe | Fase |
|---|---|---|
| Hitos con nombre que desbloquean herramientas; en CS2, paquetes a elegir | 12 hitos medidos con media de 3 meses y obras en servicio; paquetes a elegir en los hitos 4, 7 y 10 | F8 |
| Capas de información que se encienden solas con la herramienta | Capas ▾ con leyenda; Trenespop enciende la capa de compatibilidad y el planificador de obra, la de la obra | F3, F4 |
| Herramienta de líneas de transporte | «Nueva línea» con 3 rutas, paradas, exprés, cadencia y requisitos | F4 |
| Presupuestos por servicio con deslizador | Mantenimiento (ya existe en el clásico) y conservación de vía (nueva) al 50–150 %, con antes → después | F3 |
| Modo libre con mods que desactivan logros | Reglas de maqueta que desactivan medallas | F1 |
| Juego sin fin | Prórroga y Retos de legado | F7, F9 |

### 10.4 Juegos de trenes y otros

| De… | En Tenfe | Fase |
|---|---|---|
| Transport Fever 2 | Tira de ruta coloreada por tramo y por modelo, antes de comprar | F3 |
| OpenTTD | Preestreno de marca: un año de exclusiva a cambio de fiabilidad baja al principio; punto de beneficio por línea | F6, F4 |
| Mini Motorways y Mini Metro | Modificadores con nombre, reto semanal, Consejo de Ministros (elegir 1 de 2 cartas) | F3, F7 |
| Railway Empire 2 | Fábricas con cartera y plazo que se ve | F6 |

---

## 11. D9 · Interfaz: clara, mínima y con aspecto de juego de verdad

La pantalla nueva llega entera en **F4**. De F1 a F3 se mantiene la interfaz del clásico con tres cambios: la portada y la «Nueva partida» nuevas (F1), el Informe del mes (F1) y las capas y Trenespop con compatibilidad (F3). Los bocetos de §11.7 muestran el estado de la 5.0; en cada versión, **la barra superior solo enseña los recursos que ya existen** (las cuadrillas, por ejemplo, aparecen en F8).

### 11.1 Reglas de estilo y de texto (las comprueban las pruebas de interfaz)

1. **Un contenedor por panel.** Dentro solo hay filas, columnas alineadas, aire y filetes. Nunca una tarjeta dentro de otra ni una tesela con una lista dentro.
   - Prueba de DOM (`ui-unico-test`): ningún elemento con borde o fondo propio dentro de otro con borde o fondo, salvo los chips (`.chip`) y los retratos.
2. **Presupuesto de texto:**

   | Elemento | Límite |
   |---|---|
   | Título de panel | ≤ 3 palabras |
   | Línea «¿qué es esto?» bajo el título | ≤ 12 palabras, solo la primera vez que se abre |
   | Etiqueta de fila o de botón | ≤ 4 palabras |
   | Nombre de sección | 1 palabra |
   | Causa | «Objeto · valor · efecto», ≤ 60 caracteres |
   | Escena | el cuerpo grabado + una línea «Dato» sin voz de ≤ 20 palabras |
   | Opción | etiqueta de ≤ 4 palabras y detalle de ≤ 10 palabras con cifras |
   | «¿Por qué?» | ≤ 5 filas |
   | Párrafos | ninguno fuera de las escenas y de la Guía (?) |

   Una prueba recorre los paneles y falla si un texto supera su límite. Las explicaciones largas van a la **Guía (?)**.
3. **Los números van grandes y las etiquetas pequeñas.** Siempre con unidad: %, M€, k€/mes, viajeros/mes, semanas. Cifras tabulares.
4. **Colores con un solo significado** (§2.4): verde bien · ámbar ojo · rojo problema con acción · azul seleccionado o información · naranja renegociable · gris bloqueado o sin datos. Un solo color de acento: vino Tenfe.
5. **Un solo lenguaje visual.** El mapa de `map-v3`, iluminado por el sol real; paneles sólidos y oscuros, sin cristal ni desenfoque, con texto claro. Se acaba la mezcla de cristal oscuro y pergamino del rescate.
6. **Antes → después** en cada acción, calculado con las funciones de presupuesto del motor, y chips de grupo (+/−).
7. **Sin callejones sin salida.** Lo bloqueado se ve con su candado, su motivo y su remedio: «Se desbloquea en el Hito 3 · faltan 41.000 viajeros/mes · Ver Progreso ›». Cada acción rechazada contesta en su sitio con la causa y un botón de remedio.
8. **Nombres fijos por el tutorial grabado** 🔒: «Qué puede circular», «Competencia», «Investigación» y «Agenda». «Comienza la jornada» es ▶ y «pasa al día siguiente» es el botón «Siguiente día» de la pausa del final de la jornada.

### 11.2 Zonas de la pantalla (cada una tiene un trabajo)

| Zona | Siempre muestra | Nunca muestra |
|---|---|---|
| Barra superior | ≡ · **Caja** (y su variación en el mes) · **Apoyo** (encuesta, desde F5) · **Puntualidad** de la red · **Trenes libres** · **Cuadrillas libres** (desde F8) │ **Avisos (n)** │ fecha · días para las elecciones · ? | Textos largos |
| Columna izquierda («Misión») | El acto o la etapa con 2–4 condiciones, que son exactamente las del motor; como mucho 3 críticos; los compromisos que vencen pronto; **SIGUIENTE** | Listas e historial |
| Esquina del mapa | **Capas ▾** con la leyenda de la capa o de la herramienta activa (3–5 colores y una frase) y las dos herramientas del mapa: **Nueva línea** (L) y **¿Puede pasar?** (P) | Otra cosa |
| Derecha | La **ficha** del objeto pulsado; se ensancha para Servicio, Obra o Nueva línea | Páginas generales |
| Barra inferior | Hito ◔ · 1 Red · 2 Flota · 3 Dinero · 4 Despacho · 5 Progreso · 6 Prensa │ teletipo │ ⏸ ▶ ▶▶ ▶▶▶ ⏭ · «cierre 31 mar» (hasta F6: «Comienza la jornada» y «Cerrar el mes») | Píldoras de capas |
| Cajón (por la izquierda, ≤ 50 %) | Una sección cada vez, con ≤ 5 pestañas | Un tercer nivel |

**Regla para el jugador:** «Lo que **haces** está en la ficha; lo que **consultas**, abajo».

### 11.3 Mapa de navegación (dos niveles como máximo)

```
MAPA (pantalla principal; nunca se cierra)
├─ Barra superior ··· ≡ · Caja · Apoyo · Puntualidad · Trenes · Cuadrillas │ Avisos (n) │ fecha · elecciones · ?
├─ Misión ··········· acto o etapa · condiciones · críticos (≤3) · compromisos que vencen · SIGUIENTE
├─ Capas ▾ ·········· Puntualidad · Ocupación · Ancho · Tensión · Velocidad útil · Estado de la vía · Carga · Riesgos · Rivales · Territorios
│                     + herramientas: Nueva línea (L) · ¿Puede pasar? (P)
├─ Ficha (derecha) ·· relación · tramo · nodo/ciudad · unidad · obra · persona  ──► Servicio › · Obra › · Comprar ›
├─ Barra inferior ··· Hito ◔ │ 1 Red · 2 Flota · 3 Dinero · 4 Despacho · 5 Progreso · 6 Prensa │ teletipo │ ⏸ ▶ ▶▶ ▶▶▶ ⏭
│
└─ CAJÓN (nivel 1 = sección, nivel 2 = pestaña)
   1 Red ······· Servicios (monitor, M; primera fila: Protocolo) · Obras (Planos; primera fila: Cuadrillas y contratas) · Competencia🔒 · Territorios (convenios) · Proyectos
   2 Flota ····· Trenes · Trenespop (70 %, T) · Pedidos · Taller · Personal
   3 Dinero ···· Mes · Previsión · Crédito · Tarifas · Presupuestos
   4 Despacho ·· Agenda🔒 · Apoyo · Pactos · Políticas · Conseguidor*
   5 Progreso ·· Acto · Hitos · Investigación🔒 · Calendario · Logros
   6 Prensa ···· Gaceta · Diario · Informes

MODALES (cuatro tipos, de uno en uno): Escena con opciones (decisión, encuentro, petición doble, suceso,
          Consejo de Ministros, mitin) · Informe del mes · Tarjeta de hito · Noche electoral / Fin
GUÍA (?) ···· ayuda del panel abierto + buscador
MENÚ (≡) ···· guardar · exportar · partidas anteriores · Ajustes · reglas de la partida (solo lectura) · salir a la portada
             Ajustes = una sola página con filas: sonido y voces · pausas automáticas (§3.4) · accesibilidad · noticias por categoría
* Con candado hasta el Hito 2 (o con «Sin cloacas» o «Portal abierto»). Nunca se oculta.
```

- **Agenda** 🔒 reúne lo que el jugador debe o puede firmar con plazo: el encargo por firmar (el tutorial dice «Lee el encargo de Agenda»), encargos en curso, compromisos, peticiones aceptadas y pactos activos, ordenados por vencimiento. **Pactos** reúne las ofertas de pacto y la renegociación. **Apoyo** reúne grupos, encuesta, elecciones, Audiencia y mitin. **Políticas** reúne el Estatuto y las cartas de política.
- Ninguna sección pasa de 5 pestañas; una prueba cuenta las pestañas de cada sección.
- **Filas fijas de cabecera** (no son un tercer nivel: son la primera fila del mismo panel, sin caja propia):
  - **Red › Servicios › Protocolo** (F6): «Avería > 20 min → Equipo ▾ · Señal → Esperar ▾ · Pico → Refuerzo ▾ · tope 60.000 €/día ▾», más las respuestas fijadas con «Responder siempre así» en las tarjetas de sucesos (§7.9), cada una con su ✕ para quitarla. La ventana de una incidencia a ▶ tiene el enlace «Cambiar protocolo ›», que lleva aquí.
  - **Red › Obras › Cuadrillas** (F8): «Cuadrillas 1/3 libres · 1 contrata hasta may · Contratar contrata ›» y las cuadrillas prestadas por Adif. El indicador de cuadrillas de la barra superior abre esta pestaña.

**¿Dónde está…?** La Guía (?) tiene este índice con buscador; cada fila lleva a su sitio con «Ir ›».

| Busco… | Está en… |
|---|---|
| Abrir, cambiar o cerrar un servicio; tarifa de una relación | Ficha de la relación › Servicio › (o Red › Servicios) |
| Trazar una línea nueva | Herramienta Nueva línea (L), en la esquina del mapa; o la ficha de una ciudad › «Nueva línea desde aquí» |
| Saber si un tren puede ir por un sitio | Herramienta ¿Puede pasar? (P); bloque «Qué puede circular» 🔒 de la ficha de la relación |
| Comprar trenes, usados, alquiler, licitación | Flota › Trenespop (T), o «Comprar ›» en una ficha |
| Pedidos y entregas | Flota › Pedidos |
| Revisiones, cola del taller, turno de noche, reformas | Flota › Taller; ficha de la unidad |
| Maquinistas, formación, horas extra, personal de estación | Flota › Personal; ficha de la estación |
| Cuadrillas, contratas, cuadrilla prestada | Red › Obras (primera fila) |
| Protocolo de incidencias y respuestas automáticas | Red › Servicios (primera fila) |
| Pausas automáticas, sonido, voces, accesibilidad | ≡ › Ajustes |
| Obras, Planos | Ficha del tramo › «Planear obra aquí»; Red › Obras |
| Megaproyectos y proyectos de alta velocidad | Red › Proyectos |
| Convenios y peticiones de las comunidades | Red › Territorios; las aceptadas, en Despacho › Agenda |
| Rivales y cuotas | Red › Competencia 🔒 |
| Caja, previsión, crédito, impago | Dinero › Mes / Previsión / Crédito |
| Deslizadores de mantenimiento y de vía | Dinero › Presupuestos |
| Encargo, compromisos, promesas, hemeroteca | Despacho › Agenda 🔒 |
| Grupos, encuesta, elecciones, Audiencia, mitin | Despacho › Apoyo |
| Ofertas de pacto y renegociación | Despacho › Pactos |
| Estatuto y políticas | Despacho › Políticas |
| El Conseguidor y la caja B | Despacho › Conseguidor |
| Acto o etapa | Misión (izquierda); Progreso › Acto |
| Hitos y paquetes | Progreso › Hitos; el anillo ◔ de la barra inferior |
| Investigación y pilotos | Progreso › Investigación 🔒 |
| Lo que viene en 12 meses | Progreso › Calendario |
| Retos, medallas, Operador del Año, Retos de legado, reto semanal | Progreso › Logros |
| Gaceta, Diario de decisiones, Informes del mes y partes del día | Prensa › Gaceta / Diario / Informes |
| Lo que recuerda un personaje | Su retrato, en cualquier sitio |
| Retomar la guía del tutorial | Guía (?) › «Retomar la guía» (solo en su ventana, §8.7) |
| Reglas de maqueta de esta partida | ≡ › Reglas de la partida |
| Partida guardada del Rescate 4.0 | ≡ › Partidas anteriores (F1–F4: exportar; desde F5: convertir y jugar) |

**De dónde viene cada pantalla de hoy:**

| Hoy | En el modo único |
|---|---|
| Rescate › Finanzas; Clásico › Dirección › balance | Dinero |
| Rescate › Obras; Clásico › Obras | Red › Obras (se empieza desde la ficha del tramo) |
| Rescate › Flota; Clásico › Trenes, Trenespop y Mis compras | Flota |
| Rescate › Pactos y Elecciones; Clásico › Despacho y encargos | Despacho |
| Rescate › Progreso, Tecnología y Megaobras; Clásico › Investigación y capítulos | Progreso; Red › Proyectos |
| Rescate › Cloacas | Despacho › Conseguidor |
| Rescate › Gaceta; Clásico › Gaceta y Diario | Prensa |
| Clásico › peticiones de ciudades | Chinchetas en el mapa y Despacho › Agenda; desde F9, Red › Territorios |
| Píldoras de capas sin leyenda | Capas ▾ con leyenda |
| Aviso «Semana N · ±X» | Informe del mes y Avisos |
| Barra de la jornada del clásico | Barra inferior (velocidad y reloj); el parte va a Prensa › Informes |

### 11.4 Qué abre cada clic en el mapa

| Pulsas | Se abre | Muestra | Acciones |
|---|---|---|---|
| Relación (trazo) | Su ficha | Producto, km, chips de ancho, tensión y velocidad útil; puntualidad, ocupación, viajeros, neto; tira de tramos; **Qué puede circular** 🔒; filas de problema con su arreglo; efectos activos con cuenta atrás | Servicio › · Obra › · Comprar › · pestañas Resumen · Trenes · Cuentas · Historia |
| Tramo (con zoom) | Ficha del tramo | Ancho, tensión, velocidad, vía, estado, LTV, carga de surcos, riesgos, obras, «dato provisional» si no viene de `segments.json` | «Planear obra aquí» |
| Ciudad o estación | Ficha de la ciudad | Perfil urbano por horas, nivel de la estación, personal, peticiones, rivales | +/− salidas por destino · Mejorar estación · Personal · Nueva línea desde aquí |
| Unidad (tren) | Ficha de la unidad | Modelo, edad, estado, fiabilidad, punto de beneficio, «Fermín avisó en marzo» | Revisión · Reasignar · Reformar · Vender |
| Marcador de aviso | La ficha del objeto, en esa fila | Causa y arreglo | El arreglo |
| Obra o plano | La obra en marcha o el plano | Fase, semanas, pagado/total, modo de servicio | Acelerar · Cancelar / Encargar |
| Retrato (en cualquier sitio) | Ventana de la persona | Cargo de hoy, relación, **lo que recuerda**, sus pactos y promesas, obsesión si está revelada | Ver en Agenda |

### 11.5 Avisos

| Tipo | Ejemplos | Dónde | ¿Para el reloj? |
|---|---|---|---|
| Decisión | Escena con opciones, incidencia a ▶, impago, huelga, Consejo de Ministros, noche electoral | Ventana centrada; las del mismo día van en una sola pantalla | Sí |
| Crítico (≤ 3) | Un pago en ≤ 2 semanas que la caja prevista no cubre; un esencial por debajo de su objetivo con ≤ 3 semanas de plazo; un compromiso de Gobierno en riesgo; ultimátum; fase judicial ≥ imputación | Columna Misión, con marcador rojo en el objeto | Sí, una vez, con un aviso sonoro |
| Aviso | Vía por debajo del 45 %, unidad en taller, ocupación por encima del 95 %, ventana de renegociación, petición nueva, efecto que termina | Bandeja «Avisos», agrupada por objeto y con filtros (Red · Dinero · Gente · Justicia); se borra sola cuando la causa desaparece | No |
| Noticia | Gaceta y Trenter (solo hechos, con «Fuente: …») | Teletipo; se archiva en Prensa | No |
| Informe del mes | Resultado, «Tus decisiones», «Pasó», «Viene» | Pantalla tras el cierre, **solo si algo cruzó un umbral**; si no, un enlace en el teletipo | Según el ajuste |

No hay ajustes para silenciar los críticos: si molestan, es que hay que arreglar algo.

### 11.6 «Siguiente»: el jugador siempre sabe qué hacer

Una línea con un botón «Ir ›». Elige lo primero que se cumpla:
1. una decisión pendiente;
2. un aviso crítico (su arreglo);
3. un paso del tutorial o de la lista de 2027 sin marcar;
4. el compromiso más atrasado para el tiempo que le queda;
5. la condición del acto o de la etapa más atrasada, con su mejor acción (los obstáculos con `action` del rescate, portados);
6. una mejora con un beneficio claro, por ejemplo «Norte: 600 sin plaza → +1 tren (hay 2 S-449 libres)»;
7. «Todo en orden · ▶▶».

### 11.7 Bocetos

Las líneas marcan zonas, no bordes. Las cifras son de ejemplo y el estado es el de la 5.0.

**A. Pantalla principal (escritorio)**

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ≡  € 412 M  +3,1/mes   Apoyo 53 %   Punt. 86 %   Trenes 7   Cuadr. 1/3      Avisos 4   14 mar 2023 · elecc. 131 d   ? │
├───────────────────────────────┬───────────────────────────────────────────────────┬──────────────────────┤
│ ACTO I · Volver a conectar    │ Capas: Tensión ▾                                  │ MADRID–SALAMANCA   × │
│ hasta las elecciones · 131 d  │ ■ 25 kV  ■ 3 kV  ■ sin catenaria  ┅ en obra       │ Alvia · 212 km       │
│                               │                                                   │ STD→IB · 25 kV · 250 │
│ Servicios       11/12  ▰▰▰▱   │                                                   │                      │
│ Peticiones       2/2   ✓      │                                                   │ 91 %   78 %   41 k   │
│ Trenes reformados 1/2  ▰▰▱▱   │                M A P A                            │ punt.  ocup.  viaj.  │
│ Caja ≥ 150 M€          ✓ hoy  │    (trenes reales a ▶; marcador ! en Torralba)    │                      │
│                               │                                                   │ QUÉ PUEDE CIRCULAR   │
│ ! Promesa a Paco · 2 meses    │                                                   │ ✓ S-120  ✓ S-130     │
│   Catenaria Teruel · Ver ›    │                                                   │ ✓ S-730  ✗ S-112     │
│                               │                                                   │   ancho en Medina    │
│ SIGUIENTE                     │                                                   │                      │
│ Reformar S-100 (estado 41) Ir›│                                                   │ Servicio› Obra› Comprar› │
├───────────────────────────────┴───────────────────────────────────────────────────┴──────────────────────┤
│ ◔ Hito 2 · Andén    1 Red  2 Flota  3 Dinero  4 Despacho·2  5 Progreso  6 Prensa                       │
│ Gaceta · «YaIré llena Atocha de rojo»                        ⏸  ▶  ▶▶  ▶▶▶  ⏭   cierre 31 mar   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

**B. Escena: petición doble (F7).** Una ventana, una sola caja con filas. Mismo asunto (`maquinistas`) y misma instancia (el Norte).

```
┌──────────────────────────────────────────────────────────────────────────┐
│ PETICIÓN DOBLE · El turno imposible                                       │
│ [Marisa · enfadada]  «¡Vete tú a esperar tres horas de pie, caradura! El │
│                       primer tren nos deja tirados si no hay relevo. No  │
│                       somos figurantes de tu horario.»              ↻    │
│ [Charo · preocupada] «He visto la caja y se me ha cortado hasta el café. │
│                       Las horas extra no se pagan con entusiasmo. Saca   │
│                       la cartera o ajusta la oferta.»               ↻    │
│ Dato · Norte · faltan 6 maquinistas · 07:05 cancelado 2 días              │  ← sin voz, ≤ 20 palabras
│ ──────────────────────────────────────────────────────────────────────── │
│ Atender a Marisa                                                          │
│   Horas extra 4 sem · 0,34 M€ · Marisa +5 · Charo −3                      │
│ Atender a Charo                                                           │
│   −3 salidas/día para siempre · Charo +5 · Marisa −3                      │
└──────────────────────────────────────────────────────────────────────────┘
```

**C. Nueva partida (F1; rasgo, dificultad y modificadores desde F3)**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ¿Adónde vamos?                                                                        ×  │  ← ancla del constructor
│ Situación                                                                                │
│  [2022 · Tenfe real ●]  [2027 · Rescate]  [2027 · Crisis de deuda]  [… 3 más]            │
│   500 M€ · flota 18 años · 63 % electrificado · elecciones jul 2023 · con tutorial       │
│ Semilla     TNF-7K2Q-RX41-0H3M2A   ⟳ Aleatoria   ⧉ Copiar                                │
│   Norte y Sur cansados · una comunidad hostil · OuiOui madruga en el Levante             │
│ Tu rasgo    [Tecnócrata: obras −10 %, Territorio −8] ▾                                   │
│ Dificultad  Fácil · [Normal] · Difícil · Infernal · Personalizar     puntuación ×1,0     │
│ Modificadores: ninguno ▾          Reglas de maqueta ▸ (cerradas)                         │
│                                                            Empezar en enero de 2022 ›   │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**D. Ficha de relación: Resumen y Servicio**, ≤ 30 % de ancho, con el mapa visible.

```
┌──────────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐
│ NORTE · Madrid–León (MD)                   × │   │ ‹ NORTE · SERVICIO                         × │
│ Esencial · 421 km · IB · 3 kV                │   │ Modelo     S-449 KAFKA ▾  (solo compatibles) │
│ Vel. útil 105 · limita Ávila–Medina (LTV)    │   │ Unidades   − ▰▰▰▱ +   3 · libres 1          │
│                                              │   │ Salidas    − 6 + al día por sentido          │
│  78 %     44 %      8,1 k      −0,4 M€       │   │ Tarifa     − 19 € +   demanda −6 %           │
│  punt.    vía       viaj/mes   neto/mes      │   │ Surcos     Ávila–Medina 71 % de su vía       │
│                                              │   │                                              │
│ Mad ━━ Ávila ━━━ Medina ━ Vall ━ Pal ━━━ León│   │               ahora     con el cambio        │
│     72       38!        61    70     55      │   │ Ocupación     97 %      81 %                 │
│                                              │   │ Puntualidad   78 %      77 %                 │
│ ! Vía Ávila–Medina 38 % · −28   Bateo ›      │   │ Viajeros      8,1 k     8,9 k                │
│ ! 2 unidades en taller · −6     Taller ›     │   │ Neto/mes     −0,40     −0,29 M€              │
│ · 600 sin plaza                 +1 tren ›    │   │ Grupos        Viajeros +2 · Hacienda +1      │
│ ◷ Descuento −15 % · 9 sem (Marisa, ago 22)   │   │                                              │
│ Servicio›   Obra›   Comprar›                 │   │ Solo presupuesto            Aplicar ›        │
│ Resumen · Trenes · Cuentas · Historia        │   └──────────────────────────────────────────────┘
└──────────────────────────────────────────────┘
```

**E. Flota › Trenespop, abierto desde Extremadura.** Es la única excepción al 50 % (llega al 70 %). Al pasar por un modelo, el mapa pinta por dónde puede circular.

```
┌───────────────────────────────────────────────────────────────────────────┬──────────────────────────┐
│ Flota   Trenes · [Trenespop] · Pedidos · Taller · Personal              × │ MAPA                     │
│ Para EXTREMADURA · IB · sin catenaria 268 km + 25 kV 209 km · máx. 200    │ Extremadura resaltada    │
│ Energía Todas Eléct. Diésel Bimodo   Ancho Todos IB VAR STD   Nuevo Usado │ verde = puede            │
│ ───────────────────────────────────────────────────────────────────────── │ ámbar = con cambiador    │
│                                  plazas  km/h   M€/ud   llega    fiab.    │ gris  = no puede         │
│ ✓ PUEDEN CIRCULAR · 3                                                     │                          │
│   S-599 KAFKA        IB  DSL      181    160     8,0    22 m     ▰▰▰▰▱    │                          │
│   S-730 Tardo        VAR BIMODO   262  250/180  30,0    30 m     ▰▰▰▰▱    │                          │
│   S-592 usado 1984   IB  DSL      228    120     0,9    este mes ▰▰▱▱▱    │                          │
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

**F. Obras y Planos (F8).** La ficha se ensancha al 60 % y el mapa pasa a la capa de la obra.

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
│                                  │ Promesa a Paco     ✓ se cumple al empezar                       │
│                                  │ Añadir al plano      Comparar A·B        Encargar ›             │
└──────────────────────────────────┴─────────────────────────────────────────────────────────────────┘
```

**G. Despacho › Agenda** 🔒 (≤ 50 %, con el mapa visible y que se puede pulsar).

```
┌─────────────────────────────────────────────────────────┐
│ DESPACHO   [Agenda] · Apoyo · Pactos · Políticas · Conseguidor🔒                     × │
│                                                         │
│ POR FIRMAR                                  plazo       │
│ · Encargo «Volver a conectar» (Pedro)       firma ›     │
│ EN CURSO                                                │
│ ◐ Mediterráneo (Raquel) · etapa 2/3   ▰▰▰▱  7 meses     │
│   ✓ en servicio  ✓ 6 salidas  ✗ margen 5 % (falta 3)    │
│ ! Catenaria en Teruel (Paco, oct 22)  ▰▱▱▱  2 meses     │
│   empezar obra · si fallas Territorio −15     Planear › │
│ ✓ Madrid–Burgos en servicio (Raquel)   cumplido         │
│ ✗ Murcia en servicio (Raquel, dic 22)  roto · Gob. −6   │
│ · Soria · tren antes de las 7:00 · cobra tras 3 meses   │
│                                                         │
│ Hemeroteca: 14 de 17 promesas cumplidas (82 %)          │
└─────────────────────────────────────────────────────────┘
```

**H. Despacho › Apoyo (F5; líderes y Audiencia desde F7)**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ DESPACHO   Agenda · [Apoyo] · Pactos · Políticas · Conseguidor🔒       × │
│ Elecciones 23-7-2023 · previsión 51,2 %  (grupos 49 · viento +2,2)      │
│                       semana  media 26 s                                 │
│ [Marisa]  Viajeros      48 ▼     52     quiere: puntualidad del Norte   │
│           Norte 64 % −9 · tarifas +4 · de pie −2                ¿Por qué?│
│ [Paco]    Territorio    41 ▲     38     quiere: ?        Audiencia 2 ◆ ›│
│           ⚠ ULTIMÁTUM 9 semanas → moción en el Congreso (OSP −15 %)     │
│ [Fermín]  Plantilla     62       60                                      │
│ [Charo]   Hacienda      55       57     quiere: resultado ≥ 0            │
│ [Pedro]   Gobierno      58       —      ministro: Óscar del Puente       │
│ ──────────────────────────────────────────────────────────────────────── │
│ ◆ 6 favores                         Preparar mitin › (8 semanas antes)   │
└──────────────────────────────────────────────────────────────────────────┘
```

**I. Red › Servicios: el monitor (M)**

```
┌ RED   [Servicios] · Obras · Competencia · Territorios · Proyectos ─── Producto ▾  ☐ Solo con avisos ┐
│ RELACIÓN            MODELO │ SAL  UDS   MAQ │ VIAJ/DÍA  OCUP  SIN PLAZA │ PUNT 4s  VÍA  │ NETO 3m  │ ⚠ │
│ ● Madrid–Barcelona  S-112  │ 14   9/9   ✓   │ 8.120     96 %  640       │ 95 %     —    │ +6,3     │   │
│ ● Madrid–València   S-103  │  6   4/4   ✓   │ 3.900     88 %  120       │ 92 %     —    │ +2,7     │ 1 │
│ ● Madrid–Badajoz    S-730  │  3   3/3   ✓   │   610     54 %    0       │ 79 %    61 %  │ −0,6     │ 2 │
│ ● Zaragoza–Teruel   S-599  │  2   2/2   ✗   │   340     41 %    0       │ 72 %    48 %  │ −1,1     │ 3 │
│ (columnas por color: identidad · recursos · viajeros · operación · dinero; ● como el punto de OpenTTD) │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Al pasar el ratón por el «3» de Zaragoza–Teruel: «Faltan 2 maquinistas (se cancela la primera salida) · `ter-sag` a 90 km/h · la petición de Aragón exige 85 %».

**J. Nueva línea (F4)**, que se abre al pulsar dos ciudades con la herramienta.

```
┌ NUEVA LÍNEA · Madrid → Salamanca ──────────────────────────────────────────────── ‹ Red ┐
│ Ruta     (•) Por Medina          ( ) Por Ávila                                            │
│ ████████████████████◆██████████   mad ─ LAV · STD · 25 kV · 300 ─ med ◆ ─ IB · 25 kV · 160 ─ sal │
│ Modelo   S-130 · Alvia · VAR · 2T · 250          libres 10                     [Cambiar ▾] │
│ Qué puede circular   S-103 ✗ ancho en med–sal   S-130 ✓ 1 h 34   S-730 ✓ 1 h 41           │
│ Salidas  − 4 +   cada 3 h desde 07:05      Tarifa  − 32 € +      Paradas  Ávila ☐ Medina ☑ │
│ ───────────────────────────────────────────────────────────────────────────────────────── │
│ 9.400 viaj/mes     71 % ocupación     +0,21 M€/mes     91 % puntualidad (◆ −1,5 · vía −2) │
│ Necesita  3 trenes ✓ · 14 maquinistas ✓ · surcos ✓ · 4 M€ ✓                              │
│                                                    [Solo presupuesto]   [Abrir · 4 M€]   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**K. Informe del mes** (solo sale si algo cruzó un umbral)

```
┌──────────────────────────────────────────────────────────────┐
│ MARZO 2023                                     neto +3,1 M€   │
│ Viajeros 612 k (+4 %) · Puntualidad 86 % · Satisfacción 61    │
│ TUS DECISIONES                                                │
│ ✓ Lanzamiento Burgos terminó · +11 % de viajeros              │
│ ✗ Murcia en servicio: promesa rota · Gobierno −6              │
│ PASÓ                                                          │
│ ! Pucela averiado en Guadarrama · Fermín te avisó en enero    │
│ · Obra Torralba–Soria: pruebas en abril                       │
│ · 2 unidades S-106 entregadas                                 │
│ GRUPOS   Viajeros 48 ▼3 · Territorio 41 ▲2 · Hacienda 55      │
│ VIENE                                                         │
│ · Pago de la contrata 3,0 M€ · Elecciones en 4 meses          │
│                                       Diario ›     Seguir ▶   │
└──────────────────────────────────────────────────────────────┘
```

**L. Teléfono (390 px)**

```
┌──────────────────────────────┐
│ € 412 M · 53 % · 14 mar  ⋯  │  ← barra superior reducida; se toca para ver el resto
│ Siguiente: Reformar S-100 Ir›│  ← misión plegada en una línea
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
- Sin desplazamiento horizontal a 390 ni a 320 px (prueba heredada de `rescate-ui-test`).

### 11.8 Teclado

| Tecla | Acción |
|---|---|
| Espacio | Pausa |
| 1 / 2 / 3 | ▶ / ▶▶ / ▶▶▶ (F6) |
| F1–F6 o Alt+1–6 | Secciones |
| M | Monitor |
| T | Trenespop filtrado por la relación seleccionada |
| L | Nueva línea |
| P | ¿Puede pasar? |
| O / S | Obra / Servicio de la ficha |
| C / Mayús+C | Capa siguiente / anterior |
| A | Avisos |
| N | Ir a «Siguiente» |
| Esc | Volver un nivel: herramienta → ficha → cajón |
| ? | Ayuda del panel abierto |
| Mayús + clic | «Solo presupuesto» en cualquier compra u obra |

Cada descripción emergente dice su tecla.

---

## 12. Modelo de estado (guardado `iberia-ferroviaria-v5`)

**Principio:** el estado v5 **amplía** el estado clásico v4 (`engine.initialState`, `engine.js:23`), no lo sustituye. Se conservan sus campos y sus nombres (`month`, `cash`, `debt`, `routes`, `fleet`, `orders`, `projects`, `infra`, `tycoon`, `stations`, `requests`, `flags`, `chapter`, `claimed`, `decided`, `log`, `history`, `tutorial`, `ops`…), para que `metrics`, `balance`, `infra.plan` y el tutorial sigan funcionando. Lo nuevo va en bloques propios. Cada fase sube `rev` y añade sus campos con valores por defecto (§13.2).

```js
s = {
  version: 5, rev: 1..9,                 // rev = fase que escribió la partida por última vez
  // ── Partida (F1) ──────────────────────────────────────────────────────────────────────────
  partida: {
    situacion: '2022' | '2027' | '2027-deuda' | '2027-fondos' | '2027-huelga' | '2027-herencia',
    semilla: 0..2^35-1, codigo: 'TNF-SSSS-SSSS-OOOOOO', // §7.3: semilla + suma + opciones
    rasgo: null | 'ferroviario'|'exbanquero'|'inaugurador'|'tecnocrata'|'tuitero'|'negociador'|'ecologista'|'comisionista', // F3
    dificultad: {preset: 'facil'|'normal'|'dificil'|'infernal'|'personal', fondos, exigencia, oposicion, imprevistos, sindicatos, liston}, // F3
    modificadores: [],                                   // ≤ 3, F3
    reglas: {caja: 500|1500|5000|'ilimitada', sinRivales, sinElecciones, perderNoTermina, sinCese, sinFinal,
             sinImprevistos, todoDesbloqueado, sinCloacas, sinHistoria, sinTutorial},
    maqueta: bool,                                        // true si alguna regla está marcada → sin medallas ni retos
    retoSemanal: null | 'AAAA-Www'                        // F3
  },
  dia: int,                               // días desde el 1-1-2022 (absoluto en todas las situaciones). month se deriva
  azar: {tiradas: {clave: valor}},        // apuestas y negociaciones: se tira una vez y se guarda (F1)
  // ── Red (F3; surcos y obras por fases en F8) ──────────────────────────────────────────────
  infra: { t: {[id]: {g, e, v, b,                      // los del clásico
                      via, apartaderos, senal, galibo, estado, ltv, u0, tags, cerrado, obra}},
           nodos: {[id]: {cambiador, parada, personal, categoria:'A'|'B'|'C', accesible}}, ver },   // categoria y accesible en F6
  relaciones: [{id, a, b, via:[tramoId], paradas:[nodo], producto, modelo, salidas, cadencia:{primera, intervalo},
                tarifa, expres, osp, esencial, territorio, abierta, origen:'inicial'|'traspaso-md'|'propia',
                hist:[{semana, punt, viaj, neto}]}], // F4 (las 91 del clásico migran desde routes); origen desde F1 en routes[]
  // ── Flota y personal ─────────────────────────────────────────────────────────────────────
  fleet: [{...loteClasico, unidades: [{n, nombre, estado, fiab, rel, enTaller, avisadaPor, averias:[{dia, tramo}]}]}], // unidades en F6
  taller: {plazas, cola:[unidadRef], turnoNoche: null|{hasta}},                                      // F6
  personal: {maquinistas, formacion:[{n, listo}], horasExtra:[{rel, hasta}], ultimoConvenio: dia,          // ultimoConvenio desde F1
             estaciones: {[nodo]: {hasta}}, centralizadas: {[nodo]: {hasta}},
             cuadrillas: {propias, contratas:[{hasta}], prestadas:[{hasta, pacto}], guardia: null|{hasta}}},  // F6 / F8
  mercado: {anunciosSemana, carteras:{[marca]: unidades}, preestrenos:[], licitacion:null|{...}},                    // F2 / F6
  // ── Dinero (F2–F5) ───────────────────────────────────────────────────────────────────────
  dinero: {credito:{techo, dispuesto}, indiceEnergia, coberturaEnergia: null|{hasta},
           libroMes:{ingresos, costes, osp, devoluciones, cancelaciones}, libroDias:[...],          // libroDias en F6
           impagos:[{dia}], rescatesHacienda:[{dia}], leves:[{dia}], graves:[{dia}]},
  osp: {mision:'publica'|'comercial', contratoMD: null|{firmado, rechazos:[dia]},                                  // MD en F5
       traspasoMD: null|{dia, relaciones:[id], circulacionesDia, viajerosMes}},                                     // foto al firmar (§6.6)
  // ── Obras (F8) ───────────────────────────────────────────────────────────────────────────
  obras: [{id, tipo, tramos, fase:'permisos'|'obra'|'pruebas', inicio, finPrevisto, coste, pagado, modo, cuadrillas,
           ayudaPrevista, retrasos:[{causa, dias}], acelerada, pruebasSaltadas}],
  planos: [{id, obras:[...], creado}],
  // ── Política (F5 y F7) ───────────────────────────────────────────────────────────────────
  grupos: {viajeros:{v, hist26}, territorio:{...}, plantilla:{...}, hacienda:{...}, gobierno:{v, hist26}},   // de tycoon.groups
  reparto: {transporte:'minister'|'successor', desde, recienLlegado: null|{hasta}, adifCesado: null|dia},       // adifCesado: Benito no vuelve (§3.7)
  elecciones: {ultima, proxima, adelantos:[{convocada, fecha}], ultimoMandato: bool, viento,
               historial:[{fecha, voto, ganada, puntRed, adelantada}], legislatura},                          // §3.6
  lideres: {[persona]: {obsesion, revelada, agenda:[disparadorId, disparadorId]}},                            // F7
  estatuto: {mision, tarifas, mantenimiento, transparencia}, politicas: {huecos, activas:[{id, desde}]},       // F7
  favores: 0..20, ultimatums: [{grupo, desde, vence}], consejo: {proximo, cartas:[...]},                       // F7
  acuerdos: {encargos: [...tycoon.contracts], pactos:[{id, version:'normal'|'negociada', firmado, vence, estado, base, tirada, cobrado}],
             convenios: {[comunidad]: {estrellas, satisf8, peticiones:[{id, kpi, cuota, hasta, malos}]}}},      // pactos F7, convenios F9
  // ── Progreso ─────────────────────────────────────────────────────────────────────────────
  progreso: {acto, etapa: null|{id, desde, vence}, hitos:{alcanzados:[n], paquetes:{4:'verde'|'velocidad', ...}, base},
             investigacion:{actual, hecho:[], pilotos:[{tec, rel, hasta, pagado, resultado}], partidaPilotos, enfriamiento:{[tec]: hasta}},
             megaproyectos:{[id]: {etapa, pagado}}, retos:[{id, hecho}], medallas:[], hemeroteca:{cumplidas, total}},
  rivales: {ouioui:{ejes, guerra}, yaire:{ejes, promo}, bus:{campana:{desde, hasta}|null, respondio}},
  cloacas: {secretos:[{id, tipo, importe, contrato, tramo, testigos:[persona], expuesto}], sospecha, pruebas, fase,
            cajaB, mejoras:[], extorsiones:[{quien, secreto, dia, pagoMensual}]},                                  // F9
  // ── Narrativa (F1 mínima, F2 completa) ───────────────────────────────────────────────────
  narr: { ... §8.2 ..., voz:{[cuerpo]: dia} },  // log, usados, enfriamientos, efectos, compromisos, memoria, cadenas, hist, tiradas; voz: último día con voz (§8.4)
  // ── Interfaz y tutorial ──────────────────────────────────────────────────────────────────
  tutorial: {...},                        // el de induction-runtime, sin cambios
  lista2027: {pasos:{[id]: bool}},        // F5
  reloj: {velocidad, protocolo:{averia:{umbral, respuesta}, senal, pico, topeDiario, sucesos:{[cuerpo]: opcion}}, pausas:{...}}  // F6; sucesos = «Responder siempre así» (§7.9)
}
```

**Lo que no se guarda:** cachés (`planCache`, servicio del día), avisos (se recalculan), «Siguiente» (se recalcula), la ficha abierta y el cajón (eso va a `localStorage` aparte, como preferencia).

---

## 13. Compilación, guardado y pruebas

### 13.1 Reglas de compilación (en todas las fases)

1. **No se edita nunca** `story.js`, `encounters.js`, `induction.js` ni el array `ARCS` de `tycoon.js`: ni cuerpos, ni personas, ni ánimos, ni ids, ni el orden, ni qué decisión tiene `at:0`. Su comportamiento lo sustituye `guion.js` por id. El resto de `tycoon.js` (por ejemplo, `tick` y la línea 158) sí se puede tocar.
2. **`node tools/extract-game-source.mjs`** corre en cada compilación y debe seguir dando la suma `6348984c…` con 412 filas.
3. **Anclas que no se tocan:** `<h2 id="menu-departures-title">¿Adónde vamos?</h2>` una sola vez en `main-menu.js` (es el título de la fila «Situación» de la Nueva partida); la cadena exacta del aviso de voz en `app.js`; las dos líneas de `voice.js` (`const decoded = …` y `const entry = …`); `const CLIPS = {};`; exactamente 6 logotipos distintos en `brands.js`.
4. **Módulos nuevos:** imports y exports con nombre en una sola línea, sin `export default`, sin `export *`, sin `import()`. Se añaden a `optionalBefore` de `tools/extract-game-source.mjs`, en orden de dependencias. Quedará así al final del plan:

   | Antes de… | Módulos nuevos, en este orden | Fase de cada uno |
   |---|---|---|
   | `data.js` | `brands.js` (ya estaba), `azar.js` | F1 |
   | `infra.js` | `assets/red-real.js`, `trenes.js` | F3 |
   | `tycoon.js` | `marketplace.js` (ya estaba) | — |
   | `map-v3.js` (después de `operations.js`) | `assets/rescate-art.js`, `assets/rescate-voices.js`, `rescate-data.js` (se adelantan en F1, porque `guion.js` lee `LINES`), `hechos.js`, `compromisos.js`, `politica.js`, `flota.js`, `obras.js`, `sucesos.js`, `progreso.js`, `cloacas.js`, `gaceta.js`, `guion.js`, `situaciones.js`, `partida.js`, `calendario.js` | F1: `hechos` (mínimo), `guion` (v0), `partida` · F2: `compromisos`, `gaceta` · F5: `politica`, `situaciones` · F6: `flota`, `calendario` · F8: `obras`, `sucesos` · F9: `progreso`, `cloacas` |
   | `app.js` | `nueva-partida-ui.js`, `informe-ui.js`, `ui-shell.js`, `ui-cajon.js`, `ui-fichas.js` | F1: los dos primeros · F4: los demás |

   `rescate.js`, `rescate-map.js` y `rescate-ui.js` salen de la lista **en F1**, y `rescate.css` sale de la lista de estilos: el motor viejo deja de publicarse. Los archivos se conservan en el repositorio hasta que F5 termina de portarlos, y `rescate-test.mjs` los sigue probando en Node. Las entradas de `main-menu.js` y `app.js` que abrían el rescate se quitan en F1. `rescate-data.js` y sus dos recursos (`assets/rescate-art.js` y `assets/rescate-voices.js`) se quedan, porque `guion.js` lee `LINES` y la 2027 usará `IMAGES`.

   **Regla de orden:** el empaquetador evalúa los módulos en este orden y un módulo que importa otro posterior recibe `undefined`. Por eso ningún módulo de la lista base (`engine.js`, `operations.js`, `tycoon.js`…) importa un módulo nuevo que vaya después. La orquestación la hacen `app.js` (hasta F5) y `calendario.js` (desde F6): llaman al director de `guion.js`, ponen la escena en cola y después llaman al motor.
5. **CSS nuevo:** `tenfe.css` (F4), que se añade a la lista de estilos del extractor (`extract-game-source.mjs:64-73`) y, como opcional, a `dist/index.html`. `rescate.css` sale de la lista en F1. Ningún `url()` a `assets/rescate/*.webp`: las imágenes se ponen con `<img>`.
6. **Un solo despachador de clics** en la raíz de la interfaz nueva (`data-a`, F4). Cada `data-a` y cada `data-action` tiene su receta en `sfx.js`; la regla de `test.mjs` §11 se amplía a `data-a`.
7. **Voces:** los audios de las 412 tomas no se regeneran. Las líneas nuevas se graban fuera de Git con `build_rescate_voices.py --model … --stage …` y se publican con `--package`. Todo pasa por `Voices.speak`: las líneas de `LINES` se indexan en tiempo de ejecución por `clipId(persona, texto)`, así hay un solo reproductor con atenuación de la música, subtítulos y el aviso de toma que falta. Nunca `speechSynthesis`.
8. **Etiquetas de recuento** en el juego y en el auditorio: «412/412 + N/M», con M = número de entradas de `LINES` (§8.12: 70 en F1–F2, 71 en F3–F4 y 85 desde F5). Se generalizan en **F1** los «412» fijos de `build-web.mjs` (líneas 192-196) y la cola de la línea 225, que hoy añade «· Rescate de Tenfe: N/M» solo al auditorio, para que las dos páginas digan lo mismo. `release.json` gana `newLines: {recorded: N, expected: M}`.
9. **Auditorio:** en F9, cada fila tiene un título de verdad y una columna «Dónde suena» que sale de un archivo de metadatos nuevo, `web-source/donde-suena.json`, que `build-web.mjs` mezcla al pintar. **No se toca `web-source/dialogue-catalogue.json`**: su `kind` forma parte de lo que protege la suma.
10. **Versión** en los tres sitios a la vez: `tools/build-web.mjs` (línea 298, hoy `4.0.0` fijo), `main-menu.js` («Versión 4.0.0») y `package.json`. Se actualizan el README y `docs/PUBLICACION.md` para que no prometan «modo libre» ni modos aparte. Se cambia el `?v=` de los enlaces.

### 13.2 Guardado y migraciones

- **Clave nueva:** `localStorage['iberia-ferroviaria-v5']`, con `version: 5` y `rev`. **Nunca se borran** `iberia-ferroviaria-v2` ni `tenfe-rescate-v1`.
- **De v4 a v5** (F1, `migrarV4aV5`, función pura con prueba): copia el estado clásico, crea `partida` (situación 2022, `semilla` = `s.seed` de entonces, reglas de maqueta si era modo libre: `tycoon.mode === 'free'` → caja original, `sinRivales` si no había rivales, sin final, sin cese, sin historia con fecha, sin tutorial, `maqueta: true`), crea `narr` vacío, `dia` desde `month` y `ops.day`, `personal.ultimoConvenio` 10 años antes del arranque (o el día del convenio si la partida ya negoció una huelga) y `origen` en cada relación (`inicial` las 8 de `START_SERVICE`; `propia` las demás abiertas). La portada ofrece «Continuar la partida anterior» si solo existe la clave vieja, y la convierte sin borrarla.
- **El modo libre dentro del motor** (F1). `T.freeGame(s, caja, rivales)` se conserva con la misma firma y validación, y ahora escribe las reglas equivalentes en `s.partida.reglas`. `partida.js` la llama con el resto de reglas. `s.tycoon.mode` se mantiene como **campo derivado**: vale `'free'` si la partida tiene «Sin final», y `'campaign'` si no. Así siguen valiendo, sin reescribirse a ciegas, el código que mira `mode === 'free'` (`effectiveMonth`, `pendingDecision`, `chapterReady`, campaña del autobús, peticiones) y las pruebas que construyen `{tycoon: {mode: 'free'}}`. Ese código se reescribe sobre `reglas` en F2.
- **El guardado del Rescate 4.0 de F1 a F4.** `tenfe-rescate-v1` no se toca. Si existe, ≡ › Partidas anteriores lo lista con su fecha y semana, el botón «Exportar JSON» y una línea: «Vuelve como situación 2027 en la 4.5». No se puede jugar con el motor viejo, porque ya no se publica (§8.4).
- **De `tenfe-rescate-v1` a v5** (F5, `migrarRescate`): semana → `dia`; corredores → relaciones de Media Distancia y estado de sus tramos; flota (ofertas `OFFER`) → modelos del catálogo; grupos, pactos y cloacas se guardan (los pactos esperan a F7 y las cloacas a F9, sin perderse); el dinero se convierte con dos factores fijos que llevan el arranque del rescate (caja 12, deuda 18) al de la situación 2027 de §4.7 (caja 60 M€, deuda 1.200 M€): caja ×5 y deuda ×66,7; lo que ya estaba pedido o en obra se vuelve a presupuestar con las fórmulas reales, y la diferencia se anota en el Diario. Si algo no se puede convertir, se ofrece exportar el JSON viejo con un aviso de una línea.
- **Entre fases** (`subirRev`): cada fase añade sus campos con valores por defecto y nunca quita nada. Reglas para partidas que ya pasaron una fecha cuando llega la mecánica:
  - lo que una versión nueva añade se activa **desde el momento de cargar**; nunca se aplica hacia atrás un castigo;
  - los premios que ya se habrían ganado (hitos, desbloqueos de hito) se conceden al cargar;
  - si una partida de 2022 ya pasó el 23-7-2023 sin elecciones (F1–F4), se da por ganada esa votación y la siguiente es julio de 2027;
  - un pacto de no agresión firmado antes de F9 crea su secreto al cargar.
- **Exportar e importar** siguen como hoy (JSON de hasta 6 MB), con la clave nueva.

### 13.3 Pruebas: qué se crea, qué se adapta y qué se retira

| Prueba | Qué comprueba | Fase |
|---|---|---|
| `test.mjs` (adaptada) | §6 y §11 en F1 (tabla de abajo); sfx para cada acción (también `data-a` desde F4); retratos 9×7. Las secciones «solo AVE y Alvia» (`:18-29`) se adaptan en F3 al catálogo de 20 modelos; la regla «sin Media Distancia en `story.js`» se mantiene (habla de textos congelados). En F4 se quita su `import` de `observer-runtime-test` | F1, F3, F4 |
| `onboarding-ui-test` (adaptada) | Título «Tenfe 2022–2050»; entrada por «Nueva partida»; los cuatro clics en `free-setup` (líneas 338, 529, 535 y 561) pasan a «Nueva partida › Reglas de maqueta» | F1 |
| `partida-test` (nueva) | Opciones → estado; código de ida y vuelta; reglas de maqueta; migración v4 → v5 sin pérdidas; las claves viejas siguen ahí | F1 |
| `guion-completo`, `sin-copias`, `numeros-voz`, `silencio`, `recarga` (nuevas) | §8.13 | F1 |
| `rescate-ui-test` | **Se retira en F1**, porque prueba la interfaz del motor viejo, que deja de publicarse. Vuelve en F5 como `situacion-rescate-ui-test`: entra por la situación 2027 del motor único, con `t-1`, el parpadeo solo del trazo del Norte, el fin en la semana 13 y 390 px sin desplazamiento horizontal. `rescate-test.mjs` (Node) sigue en `npm test` hasta F5, porque `rescate.js` sigue en el repositorio | F1, F5 |
| `tycoon-test` (adaptada) | Se queda la integridad de los 315 encuentros; se quita lo que dependa de la permutación; la línea 29 sigue usando `T.freeGame`, que se conserva (§13.2) | F1 |
| `verdad-fuzz`, `efectos`, `presentacion`, `alcance` (nuevas) | §8.13 | F2 |
| `compromisos-test` (nueva) | Ciclo de vida, castigos aplicados, chips en la interfaz | F2 |
| `red-test` (nueva) | Los 129 casos del `plan()` clásico dan lo mismo; casos nuevos: Civia en Galicia ✗ (25 kV), 599 en Extremadura ✓, 730 en Madrid–Badajoz ✓ a 180 en diésel, BCBB en Cantabria ✗ (gálibo), S112 en Sagunt–Castelló ✗ (3 kV); LTV por estado; Torralba–Soria sigue a 44 M€ y 21 meses | F3 |
| `calibracion-test` (nueva, de A) | Mediana de minutos del plan entre minutos del GTFS = 1,00 ± 0,05 en las relaciones con horario real | F3 |
| `marketplace-test`, `campaign-test`, `induction-test` (adaptadas) | Reglas de compra (30 %/70 %, 2 al mes, compra fallida atómica) con el catálogo nuevo; el robot respeta la tensión; el diagnóstico de Salamanca y «solo sirve hoy nuestro Alvia híbrido S730» siguen siendo ciertos | F3 |
| `ui-unico-test` (nueva, Playwright) | Zonas; ≤ 2 niveles; ≤ 5 pestañas por sección; ninguna caja dentro de otra (DOM); presupuesto de texto; 390 y 320 px sin desplazamiento horizontal; teclado; tutorial completo con los nombres 🔒; sin errores de JS; capturas | F4 |
| `observer-runtime-test`, `gameplay-ui-test`, `contract-progression-ui-test` | En F1 se **adaptan** (tabla de abajo). En F4 se retiran del conjunto obligatorio, porque recortan funciones de la interfaz vieja de `app.js`: los archivos se conservan y sus comprobaciones de desbordamiento pasan a `ui-unico-test`. `ui-test.mjs` y las tres pruebas históricas de voz (`voice-game-ui-test` y compañía) ya estaban rotas o fijadas a versiones antiguas y no están en el conjunto obligatorio; también pulsan `free-setup`. Se retiran en F4 sin reescribirlas como si pasaran | F1, F4 |
| `lineas-test` (nueva) | `demandaPar` da el mercado del clásico donde existe y la gravedad donde no; el horario sintético de una línea propia tiene tantas salidas como su cadencia, con sus paradas; los requisitos que se ven debajo del botón son los que comprueba el motor (unidades, maquinistas, 4 M€ 🔒) | F4 |
| `politica-test` (nueva) | Fechas; voto = Σ medias × pesos + viento − oposición; perder termina; reparto por fecha; cese con aviso previo; impago con 5 salidas, ninguna sin efecto. **Ciclo electoral**: el adelanto solo se convoca con sus cinco condiciones; nunca en el último gran mandato ni en las situaciones de 2027 antes de 2035; los plazos de los actos se mueven con él y nunca quedan a menos de 5 años del inicio en los actos III y IV | F5 |
| `situacion-rescate-test` (de `rescate-test`) | Robot con 6 semillas de 2027 a 2034 en el motor único; `t-1` y `t-2` ciertos; etapa 1 en la semana 13; las cifras de las voces del rescate siguen el motor; conversión de `tenfe-rescate-v1` | F5 |
| `jornada-test` (nueva, de A) | Misma semilla: ▶ con el protocolo y ▶▶▶ dan el mismo libro del mes; la suma de los partes es el mes; mediana ≤ 5 ms y p95 ≤ 15 ms por día simulado; en bloques de 7 días el resultado es idéntico | F6 |
| `flota-test` (nueva) | Migración de lotes a unidades: totales, estados y asignaciones conservados; reglas de compra intactas; `supplyOptions` de los encargos igual; anuncios de usados deterministas por semana | F6 |
| `operations-calendar-test` (adaptada) | Días, años bisiestos y calendario después de 2050 con el reloj nuevo | F6 |
| `facciones-test` (nueva) | Lo que se enseña en un pacto es lo que se aplica (también en la versión negociada); la tirada se guarda; 2 contraofertas como mucho; ultimátum → castigo; remodelación solo con sus tres condiciones; nunca habla como ministro quien no lo es | F7 |
| `obras-test` (nueva) | Presupuesto = lo aplicado; fases y modos; cuadrillas y guardia; retrasos solo con causa nombrada; el planificador rechaza por surcos y dice dónde; pasar a 25 kV saca a los trenes de solo 3 kV con aviso previo | F8 |
| `sucesos-test` (nueva) | Cada suceso solo ocurre si su causa es cierta, siempre tiene sitio, es determinista por semilla y día y no cambia al recargar. **Repeticiones**: dentro del enfriamiento de la voz sale la tarjeta escrita con las mismas opciones y efectos; «Responder siempre así» aplica la opción sin parar el reloj y deja su línea en el informe; `event:strike` nunca suena con voz si hubo un convenio en los 10 años anteriores | F8 |
| `progreso-test` (nueva) | Los desbloqueos salen de los datos; no se pueden inflar hitos (media de 3 meses y obras canceladas que restan); paquetes y su compra al doble. **Objetivos alcanzables**: al empezar cada acto y cada etapa, cada objetivo tiene al menos un camino disponible (ninguno pide algo bloqueado por un hito, §5.4), y las 6 investigaciones y los 9 proyectos AV del clásico no dependen de hitos | F8, F9 |
| `cloacas-test`, `gaceta-test` (nuevas) | Cada secreto tiene procedencia y testigos; solo extorsiona un testigo de ese secreto; ningún secreto sale dos veces; cada titular apunta a un registro del motor | F9 |
| `voice-listening-ui-test` (adaptada) | `dialogos.html` de la web con 412 + 85 filas, títulos y «Dónde suena» | F9 |
| `bot-test` (nueva, de B) | En las dos situaciones y varias semillas y dificultades, un robot competente gana y uno pasivo pierde | F9 |
| Se mantienen | `music-test` (los 4 contextos de música siguen saliendo del reloj), `voice-runtime-test`, `dialogue-presentation-test`, `current-voice-pack-test`, `voice-text-test` (ampliada por `numeros-voz`) | siempre |

**F1: qué hay que tocar para que `npm test` y las pruebas de interfaz pasen.** Hoy `npm test` ejecuta `rescate-test.mjs`, `test.mjs` y `campaign-test.mjs`. `test.mjs` encadena además `tycoon-test`, `induction-test`, `music-test`, `operations-calendar-test`, `observer-runtime-test`, `voice-runtime-test`, `dialogue-presentation-test` y `current-voice-pack-test`. El conjunto obligatorio de F1 es `npm test`, más `tycoon-contract-test`, `marketplace-test`, las pruebas nuevas de F1 y las tres de Playwright de la tabla.

| Prueba | Qué falla con F1 | Cómo se adapta en F1 |
|---|---|---|
| `test.mjs` §6 (`:96-100`) | Exige ≥ 12 sucesos al azar en 120 meses, ≥ 9 distintos y todas las `DECISIONS` con `at < 120` decididas. En F1 desaparece la tirada del 32 % y callan `energy`, `discounts`, `gauge`, `futuretender` y `climate` | Robot de 120 meses con 6 semillas: (a) cada suceso que sale tiene su `exige` cierto ese día; (b) ninguna decisión suena fuera de su ventana; (c) las decisiones que el guion marca como calladas en F1 no suenan, y su hecho exógeno, si es histórico, ocurre igual; (d) cada decisión activa en F1 cuya ventana cae en la partida suena o queda saltada con su motivo en el log. Se mantienen «nueve personajes con retrato» y «≥ 20 sucesos en el catálogo» |
| `test.mjs` §11 | Exige audio en base64 dentro del HTML | Cada id del catálogo tiene toma en `web-source/manifest-source.json` y fila en `release.json` |
| `tycoon-test` (`:29`) y `tycoon-contract-test` (`:45`) | Llaman a `T.freeGame(free, 5000, false)` | Nada: `freeGame` se conserva con la misma firma (§13.2). `tycoon-contract-test` cambia la meta del primer encargo (crecimiento sobre la línea base, §4.8) |
| `induction-test` (`:121`, `:127`) | `:127` usa `freeGame`; `:121` busca «retoma esta guía desde Ayuda» | `:127`, nada. `:121` se ejecuta con la fecha dentro de la ventana de §8.7 y se añade el caso de fuera de la ventana («Consulta la Guía (?)») |
| `operations-calendar-test` | Construye `{tycoon: {mode: 'free'}}` | Nada en F1, porque `mode` sigue como campo derivado. Se reescribe en F6 con el reloj nuevo |
| `observer-runtime-test` | Recorta funciones de `app.js` por sus anclas | Nada en F1: F1 no toca `currentMinute`, `frame` ni `renderDaybar`. Se retira en F4 |
| `campaign-test` | Su robot cuenta con los objetivos viejos de los capítulos y con los sucesos al azar | El robot persigue los objetivos de §7.11.1 (red propia, AVE València–Barcelona, Almería, tercer carril, catenaria en Soria, Teruel y Extremadura) y sigue llegando a diciembre de 2050 con los 5 actos cobrados y `ending: '2050'` |
| `rescate-test` | Nada: `rescate.js` sigue en el repositorio | Sigue en `npm test` hasta F5 |
| `gameplay-ui-test` (`:26`, `:53`) | Pulsa `free-setup`, `#freeCash` y `free-begin` | «Nueva partida» › «Reglas de maqueta» › caja 5.000 › «Empezar». `:53` (`tycoon.mode = 'free'`) sigue valiendo |
| `contract-progression-ui-test` | Comprueba las metas del primer encargo clásico | Metas nuevas (+12 % / +15 % sobre la base); sigue sin enseñar «18 M€» ni «26 M€» después de firmar (`:70`) |
| `onboarding-ui-test` | Título y `free-setup` | Ver la tabla de arriba |
| `rescate-ui-test` | La interfaz que prueba deja de publicarse | Se retira (ver arriba) |

**Cada fase termina igual** (AGENTS.md y `docs/PUBLICACION.md`):
1. Si hay voces: grabarlas fuera de Git y `--package`.
2. `node tools/build-web.mjs`.
3. Pruebas de Node, pruebas de verdad y Playwright contra la compilación web, en verde. Un fallo nunca se reescribe como si hubiera pasado a la primera.
4. Commit en `main` con el código fuente, el constructor, los recursos y un `release.json` exacto; push.
5. `node tools/verify-pages.mjs <URL> docs/pages-<versión>-https-proof.json`, conservando los fallos del primer intento.
6. Versión en los tres sitios, README, `docs/PUBLICACION.md` y `?v=` al día, con el recuento real de voces.

---

## 14. D10 · Plan de implementación: un paso 0 y nueve fases que se juegan y se publican solas

**Reglas comunes:**
- Cada fase tiene un titular visible, se juega entera, pasa sus pruebas y se publica con el procedimiento de §13.3 (build, pruebas, commit, push, `verify-pages`, versión y recuento real de voces).
- **Ninguna fase publica un diálogo falso ni una opción sin efecto.** Lo que todavía no es cierto, calla (`mecanicas`).
- Ninguna fase pasa de unas 2.500 líneas en el estilo del repositorio. Si una se alarga, se publica en dos entregas (por ejemplo, 4.5.0 y 4.5.1), cada una con sus pruebas en verde.
- Las voces de una fase se graban con el texto congelado; si no llegan a tiempo, la fase sale con subtítulos y el recuento lo dice.

| Fase | Versión | Titular | Tamaño | Voces |
|---|---|---|---|---|
| 0 | — | Publicar este documento | 0 líneas de juego | 0 |
| F1 | 4.1.0 | Una sola partida | ~1.500 | 0 |
| F2 | 4.2.0 | Lo que se dice, pasa | ~2.500 | 0 |
| F3 | 4.3.0 | Vía y trenes reales | ~2.400 | 1 |
| F4 | 4.4.0 | Pantalla nueva | ~2.500 | 0 |
| F5 | 4.5.0 | Media Distancia, elecciones y Rescate 2027 | ~2.500 | 26 |
| F6 | 4.6.0 | El reloj corre y los trenes tienen nombre | ~2.400 | 2 |
| F7 | 4.7.0 | Gobierno y facciones | ~2.500 | 21 |
| F8 | 4.8.0 | Obras, surcos, sucesos e hitos | ~2.500 | 4 |
| F9 | 5.0.0 | Progreso, convenios y cloacas | ~2.400 | 28 |

**Total:** unas 21.200 líneas, 82 voces nuevas y diez publicaciones (el paso 0 y nueve versiones del juego).

### Paso 0 · Publicar el diseño (en cuanto se apruebe)

- Copiar este documento a `investigacion/modo-unico/MODO-UNICO.md` y enlazarlo en el `README.md` de esa carpeta.
- Commit y push a `main`. No cambia el juego: no hace falta reconstruir ni subir la versión.
- Responde al «sube lo que tengas a GitHub en cuanto puedas». La investigación y el `release.json` con las 63 fotos del rescate ya están publicados (`5e83509`, `d047414`).

### F1 · «Una sola partida» · 4.1.0 · ~1.500 líneas · 0 voces

**Lo que ve el jugador:**
- Portada: **Continuar · Nueva partida · Mirar los trenes · Escuchar los diálogos**. El modo libre deja de existir como modo aparte.
- **Nueva partida** en una pantalla: situación *2022 · Tenfe real*; **semilla y código** para compartir; **reglas de maqueta** (caja de 500, 1.500 o 5.000 M€ o ilimitada, sin rivales, sin cese, sin final, sin imprevistos, sin historia con fecha y sin tutorial; «Seleccionar todo»; cualquier casilla quita las medallas).
- **El Rescate 4.0 sale de la portada y de la compilación.** Su guardado `tenfe-rescate-v1` se conserva: ≡ › Partidas anteriores lo lista con «Exportar JSON» y la línea «Vuelve como situación 2027 en la 4.5». Así ninguna versión publica sus diálogos contradictorios ni sus tiradas semanales (§8.4), y desde la 4.1 solo hay un juego (R1).
- **Ningún diálogo al azar.** Desaparecen la permutación de encuentros (`tycoon.js:158`), la tirada del 32 % (`engine.js:158`) y los dados del 22 % y del 28 %. Las apuestas guardan su tirada.
- **Los encuentros callan** hasta F2. Solo suenan los cuerpos que ya son ciertos con lo que existe:
  - las decisiones `inaugural`, `burgos`, `Rossa`, `murcia`, `pajares`, `extremadura`, `s106` e `industry`, con las opciones de la columna F1 de §8.6;
  - los sucesos `strike` (con la guarda del convenio), `wifi`, `eufunds`, `freeze`, `busprice`, `secondhand`, `influencer`, `audit`, `adifdelay`, `adifboost`, `royal` y `luggage`.

  `discounts` y `festival` esperan a F2 porque hablan de viajeros de pie y de fuga al autobús; `gauge` espera a F3, cuando hay gálibo. Mientras tanto, sus hechos exógenos (la subida de demanda de los descuentos estatales) ocurren igual, sin voz y sin dinero. Las decisiones históricas suenan **en su día exacto, dentro de su ventana** (se arregla el cambio de mes de `operations.js:232`). Los arcos solo se ofrecen si su condición es cierta (`arc:4` calla).
- **La guía del tutorial** solo se puede retomar dentro de su ventana (§8.7).
- Arreglos: las peticiones cobran tras 3 cierres; el primer encargo se mide sobre la red propia y la línea base de enero de 2022 (+12 % / +15 %); `freeze` ya no bloquea; la huelga cancela circulaciones de verdad; el autobús a 5 € llega siempre; los objetivos de los actos son los de §7.11.1, con los plazos por defecto.
- **Informe del mes** v1: viajeros, ingresos, neto y lo que ha vencido (balance, entregas, obras, formación, investigación).
- Recuento de voces en las dos páginas: «412/412 + 3/70».

**Archivos:**
- Nuevos: `azar.js` (`tirada(s, dominio, clave)` = hash de semilla, día, dominio y clave), `partida.js` (opciones, código TNF, reglas, `migrarV4aV5`), `hechos.js` (mínimo: fecha, reparto por fecha, `ultimoConvenio`, ventana del tutorial y lo que piden los contratos de F1), `guion.js` v0 (tabla de las 412 fuentes y las 70 `LINES` con `activo` / `silencio` / `retirado`, `mecanicas`, ventanas, enfriamientos de voz y las opciones de F1; director mínimo para decisiones y sucesos), `nueva-partida-ui.js`, `informe-ui.js`.
- Modificados:
  - `main-menu.js`: portada sin la tarjeta del rescate; el ancla «¿Adónde vamos?» pasa a titular la fila Situación.
  - `app.js`: nueva partida, guardado en `iberia-ferroviaria-v5`, arreglo de `app.js:960`, ≡ › Partidas anteriores, sin la entrada del rescate. La cadena del aviso de voz queda intacta.
  - `engine.js`: `pendingDecision` deja de elegir y devuelve la escena que el director ya puso en cola; fin de la tirada del 32 %; `validateSave` v5; fuera los dados de entrega y de obra; `freeze`; peticiones.
  - `tycoon.js`: sin permutación; `freeGame` se conserva y escribe `partida.reglas`; `mode` pasa a ser derivado; primer encargo sobre la red propia; `ARCS` sin tocar.
  - `operations.js`: cambio de mes y huelga.
  - `sfx.js`: recetas de las acciones nuevas.
  - `tools/extract-game-source.mjs`: módulos nuevos en `optionalBefore`; fuera `rescate.js`, `rescate-map.js`, `rescate-ui.js` y `rescate.css`; `rescate-data.js` y sus dos recursos se adelantan detrás de `operations.js`.
  - `tools/build-web.mjs`: versión y etiquetas «412/412 + N/M» (§13.1 punto 8).
  - `package.json`.

**Reutiliza:** todo el motor clásico, el tutorial de 9 etapas intacto y los encargos.

**Pruebas:** la tabla «F1» de §13.3 (`test.mjs` §6 y §11, `tycoon-test`, `tycoon-contract-test`, `induction-test`, `campaign-test`, `gameplay-ui-test`, `contract-progression-ui-test` y `onboarding-ui-test` adaptadas; `rescate-ui-test` retirada); nuevas: `partida-test` (con la migración v4 → v5 y `freeGame` → reglas), `guion-completo`, `sin-copias`, `numeros-voz`, `silencio` (6 semillas, 2022–2030) y `recarga`.

### F2 · «Lo que se dice, pasa» · 4.2.0 · ~2.500 líneas · 0 voces

**Lo que ve el jugador:**
- Cada escena tiene su **línea «Dato»** (sin voz) y opciones con detalle calculado que hacen lo que dicen.
- **Encuentros elegidos por el estado** (§8.5), con los efectos de su fila persona·tema: ministra y sucesor según la fecha (Raquel hasta el 20-11-2023 y Óscar después; Óscar «alcalde» en la placa), descuentos reales con vuelta automática, promociones de YaIré, campaña del autobús y revisión dirigida por lote. Unos 70 cuerpos ya pueden sonar.
- **Compromisos** en Despacho › Agenda (la del clásico, con barra y plazo), con chip en el objeto; las promesas de `burgos`, `murcia`, `pajares`, `extremadura`, `teruel` y `futuretender` se rastrean. Suenan también `energy` (índice de energía real de 2022 y seguro) y `teruel`.
- **Diario** de decisiones con su consecuencia, **Informe del mes** completo («Tus decisiones», «Pasó», «Viene») y **Gaceta** que solo cuenta hechos, con su fuente.
- Los actos tienen **plazo y consecuencia**; la satisfacción mueve la demanda; aparecen los viajeros de pie y la fuga al autobús. Con ellos suenan `decision:discounts` y `event:festival`.
- Las repeticiones de los sucesos salen como **tarjeta escrita** con «Responder siempre así» (§7.9); el código que miraba `tycoon.mode` pasa a mirar `partida.reglas`.

**Archivos:**
- Nuevos: `compromisos.js`, `gaceta.js`.
- Modificados: `hechos.js` (vocabulario completo de §8.2), `guion.js` (contratos de los 97 cuerpos que no son encuentros, contrato genérico de encuentros, director con ventanas, puertas y revalidación), `engine.js` (demanda con satisfacción y viajeros de pie, índice de energía, descuentos con vuelta, revisión dirigida en lugar de `fleetcare`), `tycoon.js` (rivales: promociones de YaIré e historial de cuotas; selector en lugar del índice), `tycoon-ui.js` (Agenda y Diario), `app.js` (presentación de escenas: retrato, toma, Dato, opciones).

**Reutiliza:** el algoritmo de `auditoria-encuentros.md` §6 y su JSON de predicados; `dialogue-presentation.js`; `Voices`.

**Pruebas:** `verdad-fuzz` (6 semillas, 2022–2030), `efectos`, `presentacion`, `alcance` (informe), `compromisos-test`; `voice-text-test` ampliada.

### F3 · «Vía y trenes reales» · 4.3.0 · ~2.400 líneas · 1 voz

**Lo que ve el jugador:**
- **Catenaria de 3 o 25 kV** obligatoria: un S103 o un S112 ya no pasan por Sagunt–Castelló. Tramos convencionales reales en el Norte, el Sur y Pajares (Rampa y Variante). Velocidad útil (220 km/h en 3 kV, 160 sin catenaria) con el tramo que limita.
- **Estado de la vía** con LTV, **bateo** y renovación.
- Capas **Tensión, Ancho, Velocidad útil, Vía y Estado**, cada una con su leyenda.
- **Veinte trenes reales** con marca paródica; **Trenespop abierto desde una relación** con ✓ / ◐ / ✗ y el motivo; la capa de compatibilidad se enciende sola; herramienta **«¿Puede pasar?»**.
- **Villanueva del Andén** aparece en el mapa entre Ávila y Medina, con «una estación preciosa sin trenes»: se puede reabrir la parada. Suenan `decision:rural`, `event:mayorchain` y, al reabrirla, `paco-parada`.
- Con el gálibo ya modelado suena `decision:gauge` (febrero de 2023).
- En la Nueva partida aparecen **rasgo, dificultad y modificadores** (solo los que tocan sistemas que ya existen) y el **reto semanal**.

**Archivos:**
- Nuevos: `assets/red-real.js` (ajustes de `segments.json`, `pal-leo-c`, `cor-sev-c`, `leo-pol-r` y `leo-pol-v`, nodo `mot`, nodo `vda`, etiquetas, vía y `u0` provisionales), `trenes.js` (catálogo de §6.1, perfiles, marcas y `compatibilidad()` de `reglas-infraestructura.md` §5).
- `rescate-data.js`: se **añade** la entrada `paco-parada` a `LINES`. Las 70 viejas no se tocan (§8.11).
- Modificados: `infra.js` (perfil con tensión, faltas `tension`, `galibo`, `bateria`; velocidad útil; estado y LTV; bateo y reapertura de parada; `changer || changerName`), `engine.js` (tiempo de viaje con el factor calibrado; migración de claves de `s.infra.t`, de las vías de las relaciones y de la entrada de `HISTORY` del 29-11-2023), `data.js` (correspondencia de `MODELS`), `marketplace.js` (vistas con atributo e ids como parámetros, chips, ✓◐✗), `map-v3.js` (capas y leyendas), `app.js` (ficha de relación con «Qué puede circular» ampliado, ficha de tramo), `partida.js` y `nueva-partida-ui.js` (rasgos, dificultad, modificadores, reto semanal).

**Reutiliza:** `plan`, `faultText`, `tramoWorks`, `pathCoords`; `speedColor` de `rescate-map.js`; fotos y logotipos.

**Pruebas:** `red-test`, `calibracion-test`, `marketplace-test`, `campaign-test` (el robot respeta la tensión), `induction-test`, `test.mjs` (catálogo), `partida-test` (ningún rasgo ni modificador cambia una constante 🔒).

**Voces:** `paco-parada` (1), un id nuevo, así que no hay ninguna toma vieja con su texto. Recuento «412/412 + 4/71»: `LINES` tiene las 70 entradas viejas más esta. La etiqueta ya se generalizó en F1.

### F4 · «Pantalla nueva» · 4.4.0 · ~2.500 líneas · 0 voces

**Lo que ve el jugador:**
- La interfaz de §11: barra superior, Misión con «Siguiente», ficha a la derecha, cajón de 6 secciones con ≤ 5 pestañas, Capas ▾ con leyenda, avisos en tres niveles y **monitor de servicios** (M).
- **Nueva línea** al estilo de Cities, con rutas alternativas, paradas, exprés, cadencia y los requisitos escritos debajo del botón. Funciona entre **cualquier par** de ciudades: la demanda sale de `demandaPar` (mercado del clásico o gravedad, §5.5), y sus trenes salen en la jornada jugable con un **horario sintético** hecho con su cadencia y sus paradas.
- Calendario y **Logros** en Progreso (los logros del clásico, ahora medallas, y el código del reto semanal); ≡ › **Ajustes** con las pausas automáticas; el índice **«¿Dónde está…?»** en la Guía (?); teclado; diseño para teléfono.
- El tutorial de 9 etapas se juega entero con los nombres que dicen las voces 🔒. Sigue el motor mensual con jornada jugable («Comienza la jornada», «Cerrar el mes»).

**Archivos:**
- Nuevos: `ui-shell.js`, `ui-cajon.js`, `ui-fichas.js` (HTML y montaje, un solo despachador `data-a`), `tenfe.css` (añadido a la lista de estilos del extractor).
- Modificados: `app.js` (monta el armazón nuevo y va vaciando sus escuchas globales; conserva la cadena del aviso de voz), `tycoon-ui.js` e `induction-task-ui.js` (se pintan dentro de las pestañas y el guía resalta el control real), `map-v3.js` (marcadores de aviso, resaltado al pasar por una fila), `sfx.js` (recetas de `data-a`), `engine.js` (relaciones a partir de `routes`, nueva línea y `demandaPar`: mercado del clásico o gravedad `110·√(pobA·pobB)` más el 50 % por parada), `operations.js` (`servicePlan`: horario sintético de las relaciones sin GTFS a partir de `cadencia` y `paradas`; la clave de la caché incluye la versión de las relaciones), `test.mjs` (fuera el `import` de `observer-runtime-test`).

**Reutiliza:** `map-v3`, el sol, `city-art`, `faces`, `dialogue-presentation`, `Voices`, `music` (contextos `estacion`, `day`, `dusk` y `night`) y `sfx`.

**Pruebas:** `ui-unico-test` (nueva, con el recuento de pestañas, el índice «¿Dónde está…?» que lleva a cada sitio y ≡ › Ajustes); `lineas-test` (nueva); `test.mjs` §11 con `data-a`; retirada de `observer-runtime-test`, `gameplay-ui-test` y `contract-progression-ui-test` del conjunto obligatorio.

### F5 · «Media Distancia, elecciones y Rescate 2027» · 4.5.0 · ~2.500 líneas · 26 voces

**Lo que ve el jugador:**
- En 2022, al acabar el tutorial, Raquel ofrece el **contrato OSP de Media Distancia** (§6.6): 11 relaciones sobre tramos reales con diésel, 3 kV, 25 kV en Galicia y vía única, unas 52 unidades viejas, OSP por tren-km y la **penalización de los esenciales** (leves, graves y retirada). Si lo rechazas, vuelve a ofrecerse cada 12 meses. Lo traspasado no cuenta para el primer encargo, los Actos I y II ni los hitos (foto `traspasoMD`, §6.6).
- **Elecciones de verdad:** el adelanto del 29-5-2023 (`event:election`), las del 23-7-2023 y después el **ciclo electoral** de §3.6 (cada cuatro años desde la última votación, con adelantos posibles desde 2025), con noche electoral. Los actos II a V se juzgan en su noche electoral. Perder termina la partida. Grupos con «semana · media de 26 semanas» y su «¿Por qué?»; aviso de cese y cese con voz; `arc:4`. `legacyvote` espera a F7, con el veredicto.
- **Impago con cinco salidas** en lugar del préstamo automático; concurso de acreedores.
- **El Rescate de 2027 entra en el motor único** (§3.8): las cinco situaciones de 2027, `t-1` y `t-2` literalmente ciertos (8 años, prueba de 13 semanas, solo el trazo del Norte parpadea con su historial rojo), lista de pasos que se marca sola, etapas 1, 2, 4 y 5 completas y etapa 3 sin la condición del mitin (que llega en F7). Sin adelantos electorales hasta 2034. ≡ › Partidas anteriores ofrece convertir el `tenfe-rescate-v1` guardado (sin borrarlo) y seguir jugándolo en el motor único.

**Archivos:**
- Nuevos: `politica.js` (grupos, previsión, elecciones, reparto por fecha y por resultado, cese; portado de `rescate.js:1000-1038` y `:1128-1136` a meses y relaciones, con sus pruebas traducidas), `situaciones.js` (estados iniciales de 2022 y de las cinco de 2027, `migrarRescate`).
- Modificados: `engine.js` (relaciones de Media Distancia, OSP y esenciales, impago, quiebra y retirada), `assets/red-real.js` (relaciones de Media Distancia y horario sintético 06:30–21:30), `guion.js` (contratos de las 26 voces), `rescate-data.js` (`LINES` final de 85 entradas: se borran las sustituidas, `paco-inaugura` entre ellas; se reescriben con su mismo id las que lo conservan, ahora que `rescate-test` deja de leerlas; entran las 82 nuevas con su texto final), `main-menu.js` y `partida.js` (situaciones de 2027), `ui-cajon.js` (Despacho › Apoyo), `package.json` (`npm test` cambia `rescate-test.mjs` por `situacion-rescate-test.mjs`). `tools/build-web.mjs` no cambia: la etiqueta ya cuenta M desde F1 y pasa a decir «+ 30/85».

**Reutiliza:** las reglas de elecciones, impago, etapas y territorios del rescate (portadas, no copiadas tal cual), sus 63 imágenes y las tomas `t-1` y `t-2`.

**Pruebas:** `politica-test` (con el ciclo electoral); `situacion-rescate-test` (6 semillas, 2027–2034, sustituye a `rescate-test`); `situacion-rescate-ui-test` (Playwright, la heredera de `rescate-ui-test`); conversión de `tenfe-rescate-v1`; `partida-test` con el traspaso de Media Distancia (firmar no cambia el estado del encargo, de los actos ni de los hitos); `verdad-fuzz` amplía a 12 semillas de 2022 y 6 de 2027.

**Voces (26):** `osp-oferta-m`, `osp-oferta-s`, `el-forecast`, `el-win`, `el-win-2`, `el-lose`, `gobierno-aviso`, `cesado`, `fin-impago`, `fin-concurso`, `fin-retirada-m`, `fin-retirada-s`, `t-3`, `t-4`, `t-5`, `t-7`, `stage-s1`, `stage-s2`, `stage-s4-s`, `stage-s5`, `stage-fail`, `stage-pass-m`, `stage-pass-s`, `s1-fallo`, `end-win`, `end-partial`. Recuento «412/412 + 30/85».

### F6 · «El reloj corre y los trenes tienen nombre» · 4.6.0 · ~2.400 líneas · 2 voces

**Lo que ve el jugador:**
- **Tiempo continuo** ⏸ ▶ ▶▶ ▶▶▶ ⏭ con **protocolo de incidencias**, pausa automática configurable e **incidencias con plazo y nota A–F**. Desaparece «Delegar mes». El parte de cada día alimenta el mes.
- **Cada tren tiene nombre** dentro de su lote; averías situadas en una unidad y un tramo; **taller con plazas**, cola y turno de noche; reformas y adaptaciones.
- **Maquinistas** que se jubilan, horas extra y cancelaciones ordenadas; **personal de estación** con categorías y la marca `accesible` (obra menor de accesibilidad por contrata). Con eso suenan los temas 0 (salvo el de Benito, que necesita cuadrillas) y 3 de los encuentros, la reserva a provincias de Fermín y los temas 2 por unidad: unos 215 cuerpos alcanzables.
- **Protocolo** en Red › Servicios, con las respuestas fijadas desde las tarjetas escritas.
- **Trenespop vivo:** usados cada semana, stock, carteras de fábrica con retraso que se ve, preestrenos de marca y alquiler.
- Suenan `event:tweet` (reto de una semana), `event:workshopfire` y `ev-averia-rampa`, con sus dos opciones de §8.6.1 (2 días con horas extra o 21 en el taller).

**Archivos:**
- Nuevos: `calendario.js` (tic diario, velocidades, protocolo, libro del día, motivos de parada), `flota.js` (unidades, taller, maquinistas, estaciones, mercado semanal).
- Modificados: `operations.js` (plan del día en caché por `(red.ver, servicios.ver, tipoDeDía)`, agregación a ▶▶▶, incidencias sembradas por día), `engine.js` (el cierre de mes consume el libro de los días), `marketplace.js` (anuncios semanales, cartera), `guion.js`, `ui-shell.js` (controles de tiempo), `ui-fichas.js` (ficha de unidad).

**Pruebas:** `jornada-test` (equivalencia y presupuesto ≤ 5 ms por día), `flota-test` (migración de lotes a unidades sin perder nada y con las reglas de compra intactas), `operations-calendar-test` adaptada, `ui-unico-test` ampliada (tutorial a ▶ con pausa al final de la jornada).

**Voces (2):** `t-6`, `ev-averia-rampa`. Recuento «412/412 + 32/85».

### F7 · «Gobierno y facciones» · 4.7.0 · ~2.500 líneas · 21 voces

**Lo que ve el jugador:**
- Cada líder tiene una **obsesión** secreta y una **agenda**; las ofertas de pacto aparecen cuando su disparador es cierto. **Peticiones dobles**, **ultimátums** con castigo propio, **Audiencia**, **Consejo de Ministros** cada trimestre, **Estatuto** y **Políticas** que ganan efecto con el tiempo, **Favores ◆**.
- **Mitin** ocho semanas antes de votar, con dos promesas que se rastrean; **elección de ministro** tras ganar y **remodelación** por estado; los Actos III y IV con Raquel tienen su voz.
- **Pactos** (los 8 del rescate con voz) con la tarjeta de §7.12.1 y renegociación sin trampa.
- **Memoria** de los personajes con efectos (agravios y favores).
- En 2027, la etapa 3 completa; en 2022, `decision:legacyvote` y el veredicto en la noche electoral que cierra el «último gran mandato» (julio de 2051 si no hubo adelantos) y la prórroga. Hasta aquí la partida 2022 acababa como el clásico, en diciembre de 2050.

**Archivos:**
- Nuevos: ninguno grande; se amplía `politica.js` (pactos portados de `rescate.js:573-689` a la escala real de §7.12.1, ultimátums, Consejo, Estatuto, políticas, favores, mitin, remodelación, veredicto con fecha electoral).
- Modificados: `guion.js` (agendas, peticiones dobles, memoria con efectos), `tycoon.js` (políticas en huecos con rampa; `POLICIES` se conserva), `ui-cajon.js` (Despacho › Apoyo, Pactos y Políticas), `rescate-data.js` (`LINES`).

**Pruebas:** `facciones-test` (las cinco líneas de cada pacto de §7.12.1, en las versiones normal y negociada, son las que aplica el motor; peticiones dobles solo con el mismo asunto y la misma instancia); `verdad-fuzz` con pactos y ministros cambiantes.

**Voces (21):** `elige-ministro`, `remodelacion`, `mitin`, `ult-viajeros`, `ult-territorio`, `ult-plantilla`, `ult-hacienda`, `acto3-raquel`, `acto4-raquel`, `stage-s3`, `stage-s4-m`, `veredicto-bien`, `veredicto-mal`, `prorroga`, `fermin-convenio`, `charo-contrato`, `marisa-carta`, `raquel-inauguracion`, `oscar-tuits`, `pedro-cohesion`, `inigo-noagresion`. Recuento «412/412 + 53/85».

### F8 · «Obras, surcos, sucesos e hitos» · 4.8.0 · ~2.500 líneas · 4 voces

**Lo que ve el jugador:**
- **Obras por fases** (permisos, obra, pruebas) con **modos de servicio** (por fases, autobuses de Íñigo, cortar) y **cuadrillas** que también hacen guardia, con contratas en Red › Obras; el resto del catálogo de §5.4 (3 → 25 kV, desdoblar, apartaderos, CTC, ERTMS por tramo, gálibo, vallado, quitar el carril ibérico, apeaderos); retrasos solo con causa; aceleración; **Planos** comparables.
- **Surcos**: carga por tramo y rechazo con su motivo («Sin surcos libres en Encina–Xàtiva»), también en la herramienta de líneas.
- **Sucesos con sitio** (§7.9): robo de cable, gran nevada en tres puertos, ola de calor, vacas, desprendimiento, aire acondicionado, crisis climática, descarrilamiento leve; riesgo visible en la ficha del tramo; calendario sembrado a 12 meses.
- **12 hitos** con tarjeta, lista de desbloqueos y paquetes a elegir en los hitos 4, 7 y 10. Nada del clásico pasa a depender de un hito, y un objetivo en vigor desbloquea lo que pide (§5.4).
- Con las cuadrillas suenan los temas 0 y 2 de Benito (guardia e inspección de vía) y el tema 2 de Óscar (clima), además de `ev-desprendimiento` y `ev-aire` con sus opciones de §8.6.1.

**Archivos:**
- Nuevos: `obras.js` (fases, modos, cuadrillas, presupuesto = aplicación; `workQuote` y `punctProjection` del rescate portados a tramos), `sucesos.js` (riesgos, calendario sembrado).
- Modificados: `infra.js` (obras nuevas y capacidad), `engine.js`, `operations.js` (incidencias por tramo y sucesos del día), `map-v3.js` (obra en su tramo, fantasma de plano, capas Carga y Riesgos), `ui-fichas.js` (planificador de obra), `guion.js`, `progreso.js` empieza aquí con los hitos.

**Pruebas:** `obras-test`, `sucesos-test`, `progreso-test` (hitos).

**Voces (4):** `ev-desprendimiento`, `ev-aire`, `benito-cuadrilla`, `hito`. Recuento «412/412 + 57/85».

### F9 · «Progreso, convenios y cloacas» · 5.0.0 · ~2.400 líneas · 28 voces

**Lo que ve el jugador:**
- **Investigación** en tres niveles (las 6 del clásico con su coste grabado 🔒 y las del rescate) con **pilotos** y partida de pilotos; el fallo de la app en las semanas punta hasta investigar «App que funciona».
- **Megaproyectos** por etapas (Gran Taller, Centro de Control, Corredor Mediterráneo, Teruel, Estación Central, Monumento y los 9 proyectos de alta velocidad).
- **Convenios con las comunidades** (★ y peticiones de servicio al estilo Airport CEO), que absorben las peticiones de ciudades.
- **El Conseguidor** (Íñigo): comisiones, traviesas, yate, enchufe, mariscada y sobres, con los precios en escala real de §7.8.10, secretos, testigos, extorsiones, escándalos y fases judiciales; Transparencia «portal abierto». Si cesas a Benito, no vuelve (§3.7).
- **Retos** (3 de 20), **medallas**, **Operador Ferroviario del Año** y **Retos de legado** en la prórroga.
- El auditorio enseña títulos y «Dónde suena». Documentación al día y versión **5.0.0**.

**Archivos:**
- Nuevos: `cloacas.js` (portado de `rescate.js:756-885` con registro de testigos), y se completa `progreso.js` (investigación, pilotos, megaproyectos, retos, medallas, Operador del Año).
- Modificados: `guion.js`, `engine.js` (peticiones de servicio y convenios), `ui-cajon.js` (Progreso, Red › Territorios y Proyectos, Despacho › Conseguidor), `web-source/donde-suena.json` y `tools/build-web.mjs` (auditorio), README y `docs/PUBLICACION.md`.

**Pruebas:** `cloacas-test`, `gaceta-test`, `progreso-test` completa, `bot-test`, `voice-listening-ui-test` adaptada, `verdad-fuzz` completo y el informe de `alcance` (objetivo: ≥ 90 % de los 310 cuerpos que se pueden elegir).

**Voces (28):** `mega-hecho`, `operador-del-ano` y las 26 de las cloacas (§8.12). Recuento final «412/412 + 85/85».

### Después de la 5.0 (fuera de las nueve fases)

- **Concurso de capacidad en las LAV** cada 5 años entre Tenfe, OuiOui y YaIré (§5.6, de A).
- **Horario real de Media Distancia** (GTFS) en lugar del sintético, si hay datos.
- **Variantes de voz** para las líneas que más se repiten (B), con el margen de 68 líneas del presupuesto.
- Más situaciones sembradas de 2027.

---

## 15. Riesgos y cómo se cubren

1. **Rendimiento del reloj a ▶▶▶.** Simular cada día con el plan GTFS puede costar demasiado. Caché del plan por `(red.ver, servicios.ver, tipoDeDía)`, agregación por relación sin pasar minuto a minuto y presupuesto medido en `jornada-test` (mediana ≤ 5 ms, p95 ≤ 15 ms por día). Si se supera: bloques de 7 días con el mismo libro y las mismas tiradas por día, que dan el mismo resultado.
2. **Romper la suma del catálogo.** Bastaría un cambio accidental en `story.js`, `encounters.js`, `induction.js` o `ARCS`. No se editan nunca; `guion.js` los sustituye por id; `sin-copias` y `extract-game-source` corren en cada compilación.
3. **Predicados equivocados.** 108 predicados de encuentros y unos 130 contratos dan muchas ocasiones de que suene algo falso. Revalidación antes de mostrar y al cargar, silencio por defecto, puerta `mecanicas` por fase y `verdad-fuzz`.
4. **Una F1 que suena más callada y sin Rescate.** En F1 los encuentros y varios sucesos callan, y el Rescate 4.0 sale de la portada. Es deliberado (silencio antes que mentira, y un solo juego). Los encuentros vuelven en F2 (unos 70) y crecen en cada fase; el Rescate vuelve en F5 como situación, con el guardado convertido. La nota de la versión lo explica y ≡ › Partidas anteriores deja exportar el guardado.
5. **Equilibrio.** Escala real, Media Distancia, riesgos y 29 años de partida son mucho que afinar. Robot por fase, telemetría de `alcance`, primer encargo e hitos medidos sobre una línea base, y `bot-test` (gana el competente, pierde el pasivo).
6. **Migrar partidas.** Los cambios de tramos (F3), de lotes a unidades (F6) y del rescate (F5) pueden perder datos. Clave nueva, las viejas nunca se borran, migraciones puras con prueba y exportación con aviso si algo no se puede convertir. La de unidades va en una fase distinta de la de la interfaz.
7. **Producción de voces.** El entorno de Qwen y los pesos están fuera de Git (hace falta un venv con `proyecto/tools/requirements-qwen-voices.txt`). `--package` descarta las tomas cuyo texto, persona o ánimo cambian: los textos se congelan por fase antes de grabar. Si no llegan, la fase sale con subtítulos y el recuento real.
8. **Herramientas de publicación.** Hay que tocar `optionalBefore`, la lista de CSS, los «412» fijos de las etiquetas y la versión fija de `build-web.mjs`, siempre con metadatos exactos (AGENTS).
9. **Nombres de la interfaz que fija el tutorial** 🔒 («Qué puede circular», «Competencia», «Investigación», «Agenda»). `ui-unico-test` los busca en la pantalla.
10. **Ventanas históricas que chocan** (Burgos, Murcia, Pajares…). Se juntan en una pantalla el mismo día. Si una ventana caduca sin poder sonar, ese cuerpo no suena en esa partida: mejor que sonar tarde.
11. **Datos provisionales.** `segments.json` cubre 11 corredores; en el resto, la vía, `u0` y las etiquetas son estimaciones y la ficha lo dice.
12. **La remodelación y los actos con Raquel** necesitan `acto3-raquel` y `acto4-raquel`. Si no se graban en F7, la elección de ministro ofrece solo a Óscar hasta que estén: se quita la mecánica, no se fuerza la voz.
13. **Umbrales reescalados.** Las aperturas de Charo, el personal de estación y los pilotos usan umbrales relativos a G (§8.2). Si el equilibrado los deja casi siempre ciertos o casi nunca, `verdad-fuzz` lo detecta (cada apertura de Charo sale al menos una vez en 12 semillas y nunca es cierta más del 60 % de los lunes) y se retocan los factores, no la forma.
14. **Adelantos electorales.** Mueven los plazos de los actos. Se limitan (uno cada 8 años, nunca en el último mandato ni en el plan de 2027), se anuncian 8 semanas antes y los actos III y IV nunca se juzgan a menos de 5 años de empezar.

---

## Anexo A · Comprobación de los puntos obligatorios de los jueces

| Punto obligatorio (jueces) | Cómo lo cumple este documento |
|---|---|
| El motor viejo del rescate no puede quedarse en la portada hasta la última fase; mientras siga, rotulado como versión anterior; portar 2027 a mitad del plan | El motor viejo **sale de la portada y de la compilación en F1**, así que ninguna versión publica sus contradicciones (§8.4). Su guardado se conserva y se exporta desde ≡ › Partidas anteriores. El rescate vuelve dentro del motor único en **F5** (de nueve), con el guardado convertido (§14, §13.2) |
| Semilla, código y reglas de maqueta en F1; rasgos y modificadores poco después | F1 (semilla, código, maqueta); F3 (rasgos, dificultad, modificadores, reto semanal) |
| Quitar en F1 la permutación de encuentros, la tirada del 32 % y las apuestas repetibles; lo que no tiene mecánica, en silencio con `mecanicas` | F1 (§14) y `silencio` (§8.13); columna «Fase» en §7.9, §8.5 y §8.6 |
| Nada de cupos artificiales de órdenes o firmas | §2.3: escasez de caja, crédito, unidades compatibles, maquinistas, cuadrillas, taller, surcos y una investigación a la vez |
| No editar los campos con suma ni el orden de los arrays; sustituir por id en `guion.js`; prueba `sin-copias`; suma en cada compilación | §8.3, §13.1 (puntos 1 y 2), §8.13 |
| Un ministro o un sucesor solo habla si ocupa el cargo esa fecha; Óscar no es ministro antes del 21-11-2023; `paco-estacion` se retira o se regraba | §3.7 y §8.7 (placa de alcalde hasta el 16-6-2023, «exalcalde» hasta el 20-11-2023); `paco-estacion` retirada (§8.11) |
| Cada cifra de una voz grabada es una constante del motor con prueba; las cifras que cambian, solo en la línea «Dato» | §4.8 y `numeros-voz` (incluye 4 M€; 0,3 M€ y 3 meses; 18.000 € y ×0,3; 9.000 €; 10 M€ y 4 meses; 35 M€ y 12 meses; 18 meses, 18/26 M€ y +25 %; Torralba–Soria 44 M€ y 21 meses; 60 % durante 24 meses; 45 °C) |
| Cada opción deja un efecto visible o un compromiso; lo exógeno pasa siempre; ninguna escena con todas las opciones bloqueadas por falta de caja | §2.1, §8.6 (reglas comunes, columna «pasa siempre»), director (§8.4: «al menos una opción posible»), `efectos` (§8.13), impago con rescate siempre disponible (§4.5) |
| Un símbolo, un significado | §2.4: ★ solo clase de convenio; ◆ capital político; A–F nota de incidencia |
| Ninguna fase mucho mayor de unas 2.500 líneas; cada fase jugable, probada, con versión, publicada y verificada, con su recuento real de voces | §14 (tabla con tamaños de 1.500 a 2.500 y recuento «412/412 + N/M» por fase, §8.12), §13.3 (procedimiento) |
| Interfaz: 2 niveles, unas 6 secciones, límites de pestañas respetados, prueba de DOM contra cajas anidadas, sin desplazamiento a 390 y 320 px, nombres del tutorial | §11.1–§11.3 (6 secciones con ≤ 5 pestañas, comprobado por prueba), `ui-unico-test` (§13.3) |
| Si el reloj va por días, presupuesto medido por día y prueba de que ▶ con protocolo = ▶▶▶ | §3.5 y `jornada-test` (F6) |
| Guardado en `iberia-ferroviaria-v5` con migración pura y probada desde v2/v4 y `tenfe-rescate-v1`; nunca borrar las claves viejas | §13.2 (F1 y F5), `partida-test`, `situacion-rescate-test` |
| El rescate de 2027 mantiene `t-1` y `t-2` literalmente: 8 años, prueba de 13 semanas con consecuencia real y solo el Norte parpadeando | §3.8 y §7.11.2 (fin con «Reintentar» en la semana 13; parpadea solo el trazo del Norte con historial rojo de 6 meses) |
| No depender de `build_infra.py`; capa superpuesta; migrar claves de `s.infra.t`, vías y la entrada de `HISTORY` del 29-11-2023 | §5.1 (`assets/red-real.js`, punto 7 de las correcciones), F3 |
| `npm test` en verde antes de F1: `test.mjs` §11 con manifiesto y `release.json`; título de `onboarding-ui-test`; recetas `sfx` para cada acción nueva, también del despachador nuevo | F1 y F4 (§14), §13.1 punto 6, §13.3 |
| Anclas del constructor, `optionalBefore` en orden, imports de una línea, CSS en la lista | §13.1 (puntos 3 a 5, con la tabla final de `optionalBefore`) |
| Revalidar antes de mostrar y al cargar; silencio por defecto | §8.4 |
| En 2022 siguen siendo ciertos «Enero de 2022», «hoy alcalde consultado», «Hoy sobra cobertura» (también con Media Distancia), «solo sirve hoy nuestro Alvia híbrido S730», «media flota parada» y las cifras del tutorial | §4.7 (flota de enero sin diésel propio, 60 de 80 unidades paradas, 180 maquinistas frente a 29), §6.6 (la Media Distancia trae sus maquinistas ×1,05), §8.7 |
| Nombres de la interfaz y «Comienza la jornada» / «pasa al día siguiente» con controles reales | §11.1 punto 8, §8.7 |
| Todo el azar sembrado por semilla, día y dominio; recargar no cambia nada; apuestas y negociaciones con tirada guardada; sin dados del 22, 28 y 32 % | §2.1 regla 5, `azar.js` (F1), `recarga` |
| Pasar de lotes a unidades con migración pura que conserve las reglas de compra, `supplyOptions` y la campaña; no en la misma fase que la interfaz | F6 (la interfaz es F4), `flota-test`; el lote se conserva como agrupación (§6.3) |
| Rendimiento del tic diario con caché por versión de red y tipo de día, agregación y presupuesto en pruebas; bloques de 7 días si hace falta | §3.5, `jornada-test` |
| Líneas nuevas sin cifras dinámicas; textos congelados por fase; ≤ 150; etiquetas con el recuento real | §8.12 (82 líneas; recuento «412/412 + N/M», con M = 70, 71 y 85 según la fase) |
| No decir que las funciones de `rescate.js` se reutilizan tal cual: portarlas con sus pruebas | §4.1 y F5/F7/F8/F9 (portadas con sus pruebas traducidas) |
| Ninguna fase deja una voz grabada falsa ni una opción sin efecto | Reglas comunes de §14 y pruebas de §8.13 |
| Hechos exógenos que pasan siempre: fondos europeos (40 % durante 2 años), descuentos, fiestas, autobuses a 5 €, entrada de YaIré el 25-11-2022, cola de 18 meses | §8.6 (`eufunds`, `discounts`, `festival`, `busprice`, `Rossa`, `industry`) |
| `decision:climate` a 45 °C, no a 44 | §4.8 y §8.6 |
| Un jefe de Adif cesado calla | §3.7: Benito cesado no vuelve nunca; le sustituye una jefa de obras sin voz que solo escribe, y todas las voces de Benito callan (lo que ocurre sale como tarjeta escrita) |
| Villanueva y Paco coherentes: 412 habitantes, «estación preciosa sin trenes», `mayorchain` encadenado a la vía de su pueblo, `paco-inaugura` sustituida por `paco-parada` | §5.1 punto 5, §7.9 (`mayorchain` en `avi-med`, junto a Villanueva), §8.12 (`paco-parada` y `ext-paco` con 412) |
| No tocar `kind` en `web-source/dialogue-catalogue.json`; «Dónde suena» en metadatos aparte | §13.1 punto 9 (`web-source/donde-suena.json`) |
| Tutorial: el único tren propio no eléctrico en enero de 2022 es el S730; el primer encargo se mide sobre la base de enero de 2022; «al cerrar el mes llegan…» con un cierre de mes real | §4.7, §4.8, §3.2 |
| Ninguna apuesta repetible; `freeze` nunca exige pagar por adelantado | §8.6 (`audit`, `royal`, `freeze`) |
| Decisiones históricas en su día exacto dentro de una ventana, saltadas antes que tardías; arreglar `operations.js:232` | §8.4, §8.6, F1 |
| Unas líneas sin grabar solo con subtítulos, nunca con síntesis; anclas del menú y del aviso de voz; exactamente 6 logotipos | §8.12, §13.1 puntos 3 y 7 |

## Anexo B · De dónde viene cada idea

| Idea | Origen |
|---|---|
| Contratos de verdad por cuerpo, director con ventanas y revalidación, `mecanicas`, compromisos, memoria y cadenas, Diario, «Dato», reparto por fecha, retirada de `paco-estacion`, 6 secciones con ≤ 5 pestañas, prueba de DOM, «Siguiente», triaje, Planos, bocetos | C (base) |
| Surcos como *stands*, monitor de servicios con columnas por color, contrato OSP de Media Distancia tras el tutorial, energía por tracción y canon por tramo, calibración contra el GTFS, `jornada-test`, convenios con estrellas y peticiones de servicio, discurso de campaña concreto, concurso de capacidad (después de la 5.0) | A |
| Paso 0 de publicación, semilla y código en F1, obsesiones de los líderes, peticiones dobles, ultimátums con castigo propio, elección de ministro tras ganar, Estatuto y políticas que ganan efecto, hitos con paquetes a elegir, Consejo de Ministros, historia emergente en el informe, capa superpuesta de tramos, `bot-test`, variantes de voz (después de la 5.0) | B |
| Escala de M€, logit de demanda, encargos, tutorial grabado, horario GTFS, aperturas históricas, Trenespop | Campaña clásica |
| Presupuesto antes de firmar, obras en 3 fases con modos de servicio, pactos, elecciones con grupos, cloacas, megaproyectos, misión → obstáculo → acción, `t-1` y `t-2` | Rescate de Tenfe |
| Caja elegible, rivales sí o no, sin final, sin cese | Modo libre (ahora reglas de maqueta) |
| Algoritmo de selección de encuentros, predicados, 5 retirados, 9 ventanas estrechas, 17 grupos condicionales | `auditoria-encuentros.md` |
| Correcciones de las 97 voces de historia y tutorial; fallo del cambio de mes; trucos medidos | `auditoria-historia.md`, `inventario-campana-clasica.md` |
| Tramos reales, catálogo de trenes y regla de compatibilidad | `segments.json`, `trains.json`, `reglas-infraestructura.md`, `trenespop-reutilizacion.md` |

## Anexo C · Huecos de la revisión crítica y dónde se corrigen (versión 1.1)

| # | Hueco | Corrección |
|---|---|---|
| 1 | Las opciones de los encuentros usaban un juego de efectos por tema, y varias líneas grabadas hacían otra cosa (Benito 0, 2 y 3; Fermín 0 y 3; el ejemplo de petición doble) | §8.5: una fila por persona y tema (45) con predicado, instancia, efectos, asunto y preferencia en escala real, y etiquetas propias donde la acción cambia. §6.3: estaciones con categoría y marca `accesible`, y obra menor de accesibilidad por contrata. §7.8.3: las peticiones dobles exigen el mismo asunto y la misma instancia, con un ejemplo nuevo (Marisa y Charo, maquinistas del Norte) y su boceto en §11.7 B |
| 2 | El contrato de Media Distancia ganaba solo el primer encargo y el Acto I | §6.6: foto `traspasoMD` y `origen` por relación. §4.8 y §7.11.1: encargo, Acto I, Acto II e hitos se miden sobre la red propia. `partida-test` lo comprueba |
| 3 | Los adelantos electorales no movían plazos ni frases fijas | §3.6: ciclo electoral con reglas de adelanto, plazos en noches electorales y veredicto móvil. §3.8 y §7.11.2: sin adelantos en 2027 hasta 2034. §7.11.1: actos juzgados en noches electorales. §8.12: el veredicto ya no dice «Veintinueve años». §7.9 y §8.6: `event:election` con voz cada 10 años y tarjeta escrita en medio |
| 4 | Umbrales de dinero de la auditoría en escala del rescate; la partida de pilotos no alcanzaba para ningún piloto | §8.2: tabla de umbrales en escala real relativos a G. §7.11.4: partida de pilotos de 6 M€. §7.8.2: la agenda de Charo, en escala real |
| 5 | Las pruebas de F1 no podían quedar en verde | §13.3, tabla «F1»: `test.mjs` §6 y §11, `freeGame` conservado y `mode` derivado, `induction-test`, `tycoon-contract-test`, `campaign-test`, `gameplay-ui-test`, `contract-progression-ui-test` y `onboarding-ui-test` adaptadas en F1 |
| 6 | Líneas nuevas que piden decidir sin opciones; pactos y cloacas sin cifras | §8.6.1 (`ev-averia-rampa`, `ev-desprendimiento`, `ev-aire`, `osp-oferta`, `elige-ministro`, `mitin`…). §7.12.1: los 8 pactos con las cinco líneas. §7.8.10: precios, extorsiones y escándalos en escala real |
| 7 | La huelga podía sonar justo después de un convenio, y las repeticiones no tenían decisión | §7.9 «Cuando un suceso se repite»: enfriamientos de voz, tarjeta escrita con las mismas opciones y «Responder siempre así». `event:strike` con la guarda de 10 años (§4.8) |
| 8 | La guía del tutorial se podía retomar cuando sus tomas ya eran falsas | §8.7: «Retomar la guía» solo dentro de su ventana y con revalidación de cada toma |
| 9 | `paco-inaugura` se reescribía con su mismo id en F3, y el recuento era incorrecto | §8.11 y §8.12: id nuevo `paco-parada`; recuento por fase «412/412 + N/M» con M = 70, 71 y 85; etiqueta generalizada en F1 |
| 10 | El motor viejo del rescate se publicaba de F1 a F4 con diálogos contradictorios | §8.4 (alcance de la regla) y §14 F1: el motor viejo sale de la portada y de la compilación en F1; el guardado se conserva y se convierte en F5 |
| 11 | Contradicciones internas (rescates de la etapa 5, producto Media Distancia, fases de `discounts`, `festival` y `gauge`, concurso de 2029 en un ejemplo) | §4.5 y §7.11.2 (rescates: 104 semanas en s5 y ocho años en `end-win`); §4.2 punto 7 y §6.1 (producto por relación); §7.9, §8.6 y §14 (fases F2 y F3); §7.13 (ejemplo sin concurso) |
| 12 | Actos que pedían cosas bloqueadas por hitos | §5.4, §7.11.3 a §7.11.5: las 6 investigaciones y los 9 proyectos AV del clásico no dependen de hitos, y un objetivo en vigor desbloquea lo que pide; `progreso-test` lo comprueba |
| 13 | La navegación no situaba el protocolo, los ajustes, los logros ni las contratas | §11.3: ≡ › Ajustes, filas de cabecera de Protocolo y Cuadrillas, pestaña Progreso › Logros e índice «¿Dónde está…?» |
| 14 | «Nueva línea» sin demanda de cualquier par ni horario para la jornada | §5.5 y §14 F4: `demandaPar`, horario sintético en `operations.js` y `lineas-test` |
| 15 | Benito cesado volvía a hablar como jefe de Adif | §3.7: no vuelve; le sustituye una jefa de obras sin voz y todas sus voces callan |

