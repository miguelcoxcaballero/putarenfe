# Airport CEO (Apoapsis Studios / Apog Labs): investigación para «Iberia Ferroviaria»

> Fuentes primarias: wiki oficial (airportceo.wiki.gg), blogs de desarrollo oficiales (airportceo.com), notas de parche de Steam (API de noticias de Steam, app 673610), ficha y reseñas de Steam, guías y foros de Steam y del foro oficial de Apog Labs. Se cita cada dato. Cuando dos fuentes dicen cosas distintas, lo indico.
> Fecha de consulta: 9-10-2026. Versión actual del juego: 1.1-3 (24-1-2026).

---

## 0. Ficha rápida

| | |
|---|---|
| Género | Tycoon de aeropuerto en 2D, vista cenital, simulación de agentes (pasajeros, empleados, vehículos, aviones) |
| Estudio | Apoapsis Studios, ahora Apog Labs (Malmö); 2 desarrolladores al principio y 3 al final ([DB 159](https://www.airportceo.com/post/dev-blog-159-airport-ceo-1-0)) |
| Fechas | Acceso anticipado el 28-9-2017; 1.0 el 4-3-2021 ([wiki](https://airportceo.wiki.gg/wiki/Airport_CEO)). DLC: Supersonic (gratis, 2021), Vintage (24-6-2021), Beasts of the East (14-1-2022) y Helicopters (19-10-2023, versión 1.1-0) |
| Precio | 24,99 $ ([Steam](https://store.steampowered.com/app/673610/Airport_CEO/)) |
| Reseñas | En inglés, 4.977 reseñas con un 82,5 % positivas, «Muy positivas» ([API de reseñas de Steam](https://store.steampowered.com/appreviews/673610?json=1)). Los desarrolladores daban «alrededor del 85 %» en 2021 ([DB 159](https://www.airportceo.com/post/dev-blog-159-airport-ceo-1-0)) |
| Jugadores | Unos 25.000 CEO distintos al mes y unos 2.300 al día cuando salió la 1.0 (notas de la 1.0, [noticias de Steam](https://store.steampowered.com/news/app/673610)) |

**Resumen del diseño en una frase:** empiezas con un campo vacío y algo de dinero; levantas una pista y aparcamientos para avionetas (aviación general, GA); investigas la licencia comercial; construyes la terminal; firmas contratos marco con aerolíneas, que te ofrecen vuelos; los colocas en el planificador; prestas servicios en escala (combustible, equipaje, catering…); y las **calificaciones** del aeropuerto deciden qué socios, de cuántas estrellas, quieren trabajar contigo.

---

## 1. Bucle principal

1. **Arranque.** Pausar, firmar un contrato de construcción y desplegar los contratistas (Gestión → Operaciones → Construcción) ([guía paso a paso](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).
2. **Aviación general (GA), primera fuente de ingresos.** Pista pequeña, rampas, calle de rodaje, al menos 5 aparcamientos (*stands*) pequeños, torre de control y abrir el aeropuerto. Las avionetas llegan sin vuelos programados y pagan por hora de aparcamiento ([wiki GA](https://airportceo.wiki.gg/wiki/General_Aviation), [wiki Flights](https://airportceo.wiki.gg/wiki/Flights)).
3. **Servicios GA.** Contrato de combustible, depósito de Avgas, camión cisterna y activar el servicio en Operaciones ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).
4. **I+D.** Se contratan administrativos, que investigan en sus mesas. La primera gran meta es la **Licencia Comercial**; de ella cuelgan los permisos de aviones medianos y grandes, los vuelos nocturnos, etc. ([wiki R&D](https://airportceo.wiki.gg/wiki/R_%26_D_Panel), [DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)).
5. **Terminal comercial.** Mostradores de facturación, control de seguridad, zona segura, puerta de embarque, salida y personal que los atienda ([wiki Flights](https://airportceo.wiki.gg/wiki/Flights)).
6. **Aerolíneas.** Se firma un contrato marco; la aerolínea ofrece vuelos sueltos o recurrentes y tú los colocas en el planificador (a mano o en automático) ([DB 100](https://www.airportceo.com/post/dev-blog-100-celebrating-100-devlogs-alpha-25-deployed-and-interview-with-mitchell)).
7. **Escala.** Cada vuelo pide servicios: ronda de rampa, equipaje, combustible, catering, limpieza, remolque y deshielo. Cada servicio prestado se cobra ([wiki Airlines](https://airportceo.wiki.gg/wiki/Airlines), [wiki Turnaround](https://airportceo.wiki.gg/wiki/Turnaround_Services)).
8. **Calificaciones.** La puntualidad, el trato y la seguridad mueven las notas; las medias deciden cuánto tráfico llega, de qué categoría de estrellas son los socios y si conservas la licencia ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update), [DB 151](https://www.airportceo.com/post/dev-blog-151-businesses-and-contracts)).
9. **Riesgo.** Emergencias activas (aterrizajes de emergencia), pasivas (crisis del combustible, huelgas, pandemia) y «ocurridas» (contrabando detectado en destino), con multas, calificación con letra e informe por correo ([DB 153](https://www.airportceo.com/post/dev-blog-153-emergencies)).
10. **Ampliar:** comprar zonas del mapa, abrir más terminales, sumar la zona internacional y acercarse al máximo de unos 350 vuelos al día ([reseña de 247 h](https://steamcommunity.com/profiles/76561198110273258/recommended/673610/)).

**Tiempo:** la economía cobra y paga **cada hora de juego** ([DB 40](https://www.airportceo.com/post/dev-blog-40-contracts-a-new-aircraft-construction-iteration)). Un «año» de juego son **12 días**, que es el ritmo del premio al Aeropuerto del Año ([wiki Email](https://airportceo.wiki.gg/wiki/Email)). Hay pausa y velocidades ×1, ×2 y ×3, y de noche, si el aeropuerto está vacío, se puede saltar a las 06:00 ([How To Play](https://airportceo.wiki.gg/wiki/How_To_Play)).

---

## 2. Contratos y negociación

### 2.1 Tipos de contrato (pestaña Economía → Contratos)
Todos siguen el mismo patrón: una tarjeta de empresa con su nota en estrellas, su director, sus condiciones y un botón para aceptar ([wiki Contracts](https://airportceo.wiki.gg/wiki/Contracts)).

| Tipo | Condiciones |
|---|---|
| **Construcción** | Cuota inicial, cuota por cada llamada, salario por hora y número máximo de contratistas. Se llaman y se despiden en Operaciones → Construcción con +/−; con Ctrl se cambian de 10 en 10. Cobran mientras están en servicio. Consejo: esperar media hora al principio porque puede aparecer una oferta mejor ([wiki Contracts](https://airportceo.wiki.gg/wiki/Contracts), [wiki Operations](https://airportceo.wiki.gg/wiki/Operations), [General Tips](https://airportceo.wiki.gg/wiki/General_Tips)) |
| **Combustible** | Cuota inicial y precio por litro. Entrega automática cuando el depósito baja de un porcentaje que fija el contrato. Solo puede haber uno activo. Tres clases ([wiki Fuel](https://airportceo.wiki.gg/wiki/Fuel)): 2★ a 0,005/0,01 $/L (Avgas/Jet A-1) y 200.000 L por entrega; 3★ a 0,004/0,009 y 400.000 L; 4★ a 0,003/0,006 y 800.000 L. El pedido automático se puede desactivar (Beta 3) |
| **Aerolínea** | Contrato marco **sin caducidad**: fija precios y condiciones generales, pero no el número de vuelos ([DB 97](https://www.airportceo.com/post/dev-blog-97-alpha-24-deployed-airline-livery-modding-enabled-steam-cloud-saves-enabled-and-the-future-of-the-airline-contract-system), [DB 100](https://www.airportceo.com/post/dev-blog-100-celebrating-100-devlogs-alpha-25-deployed-and-interview-with-mitchell)) |
| **Franquicia** (tiendas y restaurantes) | Alquiler más un porcentaje de las ventas; pide una sala de cierto tamaño. Desde la Alpha 36 no caduca. El objetivo de ventas se mide **cada día**: si se cumple hay bonificación y, si no, no hay castigo, pero el contrato se rompe si pasan cinco días sin cumplir un objetivo diario ([DB 151](https://www.airportceo.com/post/dev-blog-151-businesses-and-contracts)). Un jugador habla de 7 días ([hilo](https://steamcommunity.com/app/673610/discussions/0/2965019884823757693/)) |
| **Catering y deshielo** | Suministro de comida y de líquido anticongelante ([wiki Contracts](https://airportceo.wiki.gg/wiki/Contracts)) |
| **Banco** | Préstamos (§6) |

### 2.2 Clases en estrellas ligadas a la nota del aeropuerto (Alpha 36)
- Cada empresa tiene de 1★ a 5★. La categoría a la que puedes optar depende de la **media de la calificación total del aeropuerto**: con nota baja solo te ofrecen 1-2★ ([DB 151](https://www.airportceo.com/post/dev-blog-151-businesses-and-contracts)).
- Las flotas siguen esa clase: las aerolíneas de 1-2★ no traen aviones grandes y las de 4-5★ no traen pequeños ([DB 151](https://www.airportceo.com/post/dev-blog-151-businesses-and-contracts)). La [wiki de Airlines](https://airportceo.wiki.gg/wiki/Airlines) lista las 24 aerolíneas con su clase y su flota; Maple, por ejemplo, es 5★ con A220, A380, 737 y 787.
- Las aerolíneas de mods valen 2★ si no se indica otra cosa, para que un aeropuerto con nota baja no se quede sin ofertas ([DB 151](https://www.airportceo.com/post/dev-blog-151-businesses-and-contracts)).
- **Crítica de jugadores:** «¿Por qué iba a firmar con un socio de 1★ si uno de 4-5★ es mucho más barato?» ([reseña de 475 h, 240 votos útiles](https://steamcommunity.com/profiles/76561198060003577/recommended/673610/)). La clase alta domina siempre a la baja, así que no hay dilema.

### 2.3 Del contrato marco al vuelo
- Una vez firmado, la aerolínea **ofrece vuelos** sueltos o recurrentes según lo satisfecha que esté. Hay un **margen de 1 hora**: si el vuelo sale dentro de él, la satisfacción sube; si se pasa, baja ([DB 100](https://www.airportceo.com/post/dev-blog-100-celebrating-100-devlogs-alpha-25-deployed-and-interview-with-mitchell)).
- La relación mejora con cada avión que sale a su hora y empeora con cada cancelación o salida tardía. A más relación, más vuelos ([wiki Airlines](https://airportceo.wiki.gg/wiki/Airlines)).
- Según el diseño publicado, si la nota baja de cierto umbral la aerolínea puede **rescindir el contrato marco**; si sube, puede mejorar los precios base y ofrecer vuelos de más estrellas ([DB 97](https://www.airportceo.com/post/dev-blog-97-alpha-24-deployed-airline-livery-modding-enabled-steam-cloud-saves-enabled-and-the-future-of-the-airline-contract-system)).
- **Satisfacción inicial:** un jugador dice que todas empiezan en el 25 % ([hilo](https://steamcommunity.com/app/673610/discussions/0/5073860311961890876)); en 2017 el registro de cambios decía «todas empiezan en el 50 %» ([DB 79](https://www.airportceo.com/post/dev-blog-79-steam-direct-update-and-a-new-flight-planner)). Las dos fuentes no coinciden.
- **Vuelos con estrellas (Alpha 25):** cada vuelo vale de 1★ a 5★ según las instalaciones y servicios del aeropuerto. Al pulsar la estrella grande del planificador se veía qué construir para subir de categoría ([DB 100](https://www.airportceo.com/post/dev-blog-100-celebrating-100-devlogs-alpha-25-deployed-and-interview-with-mitchell)). En la Alpha 34 se quitó ese detalle a la espera de rehacerlo ([notas de la Alpha 34](https://steamdb.info/patchnotes/4624710/)).
- **Mezcla de tamaños:** un deslizador fija qué porcentaje de las ofertas futuras será de aviones pequeños, medianos o grandes (60/40, por ejemplo) ([DB 100](https://www.airportceo.com/post/dev-blog-100-celebrating-100-devlogs-alpha-25-deployed-and-interview-with-mitchell)).
- **Requisitos que se notan:** las aerolíneas piden un número de mostradores de facturación; si faltan, se cancelan vuelos ([hilo](https://steamcommunity.com/app/673610/discussions/0/1489987633997713081/)). Desde la Beta 3, las tarjetas de contrato tienen botones de aceptar y rechazar rápidos.

### 2.4 Renegociación con puntos (Alpha 36, «Contract negotiations»)
Diseño ([DB 151](https://www.airportceo.com/post/dev-blog-151-businesses-and-contracts)):
- Cada contrato tiene un **periodo de renegociación**. Un aeropuerto con buena nota acumula **puntos de negociación** de dos tipos: generales, que valen para cualquier contrato, y **de empresa**, que solo valen para ese contrato.
- Asignar puntos a una oferta sube la probabilidad de que la acepten. Los puntos **se gastan** aunque la oferta se rechace.
- Hay un **autonegociador**, que reparte los puntos solo (el CFO lo hace si se activa).

Interfaz ([hilo 1](https://steamcommunity.com/app/673610/discussions/0/598529977568245869/), [hilo 2](https://steamcommunity.com/app/673610/discussions/0/2944746708993921464/)):
- Avisa un **correo de un directivo**.
- En Economía → Contratos aceptados, los contratos renegociables salen **en naranja**; los demás, en verde.
- El botón «Aceptar» de la tarjeta pasa a ser «**Negociar**» y abre una ventanita con deslizadores de precio (por tamaño de avión, en las aerolíneas) y la asignación de puntos.
- Hay que tener el contrato un tiempo antes de poder renegociarlo.

Números que observan los jugadores (aproximados, según el autor) ([hilo](https://steamcommunity.com/app/673610/discussions/0/3075369490065225067/)):
- Puntos de la relación con la empresa (5) más puntos por el prestigio del aeropuerto (10) = 15.
- Pedir un +50 % sale con un 10 % de probabilidad; pedir un +40 %, con un 35 %.

**Problemas** ([mismo hilo](https://steamcommunity.com/app/673610/discussions/0/3075369490065225067/)):
- Si la oferta se rechaza, **sigue el contrato anterior** aunque fuera una ganga tuya conseguida por suerte. Se puede repetir hasta acertar cargando la partida, y pedir de más no tiene castigo.
- Los jugadores proponen una **cadena de contraofertas**: como mucho 2 rondas y, después, la empresa se va; y que una rebaja propia sin subir nada se acepte siempre.
- Entre los elogios: «el modo de negociación está muy bien hecho» ([reseña de 475 h](https://steamcommunity.com/profiles/76561198060003577/recommended/673610/)). Entre las críticas: la interfaz estaba rota ([reseña](https://steamcommunity.com/profiles/76561197985590072/recommended/673610/)). La versión 1.0-36 ajustó los puntos, y un fallo registrado era que «el panel de contratos no explica cómo se ganan los puntos» (MERCURY-45344).

**Negociación salarial con el sindicato (Alpha 36):** existe (ACEO-28435), pero un veterano de 976 h dice que el programa de I+D «Relación con los sindicatos» casi no hace nada ([reseña](https://steamcommunity.com/profiles/76561197970939117/recommended/673610/)).

### 2.5 Tasas y su efecto en la relación
- La pestaña **Tasas** (pide un CFO) tiene un deslizador **global** por tipo de tasa: aterrizaje, manejo de pasajeros, combustible, aseos… Cada contrato tiene su tarifa base, pero el deslizador permite ajustar el margen sin renegociar ([DB 39](https://www.airportceo.com/post/dev-blog-39-improved-taxiway-building-economy-panel-aircraft-voting), [wiki Economy](https://airportceo.wiki.gg/wiki/Economy)).
- Cobrar de más empeora la relación y puede acabar en rescisión; cobrar de menos la mejora y atrae negocio por el «boca a boca» ([DB 39](https://www.airportceo.com/post/dev-blog-39-improved-taxiway-building-economy-panel-aircraft-voting)).
- Los jugadores lo confirman: subir el manejo de pasajeros y de equipaje baja la nota de las aerolíneas comerciales ([reseña](https://steamcommunity.com/profiles/76561197978876159/recommended/673610/)).
- En la guía del modo Extremo, el truco es contratar un CFO y poner al máximo todas las tasas de GA: las avionetas no se quejan ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2387840605)).

### 2.6 Penalizaciones y rescisión
- Un retraso de más de 1 h, una cancelación o cerrar un *stand* con vuelos asignados (eso los cancela todos) castigan la relación. Los jugadores describen el último caso como «un golpe de reputación tremendo» ([hilo](https://steamcommunity.com/app/673610/discussions/0/2915472677725396563/)). Los *stands* avisan antes de borrar las reservas ([wiki Stand](https://airportceo.wiki.gg/wiki/Stand)).
- Rescindir un contrato de aerolínea con vuelos activos es engorroso: «cierra el *stand*» es el truco ([hilo](https://steamcommunity.com/app/673610/discussions/0/598528666219071440/)); «hay que cancelar avión por avión cada día de la semana» ([reseña](https://steamcommunity.com/profiles/76561198147845779/recommended/673610/)).
- Hay quien pide multas explícitas en el contrato, del tipo «95 % de salidas puntuales o 1 M$ de multa». Hoy, aunque una aerolínea esté al 0 %, puedes seguir atendiendo a las demás sin consecuencias ([hilo](https://steamcommunity.com/app/673610/discussions/0/2965019884823757693/)).

---

## 3. El planificador de vuelos y el monitor de vuelos

### 3.1 Planificador (tecla F; botón abajo a la izquierda)
Hace falta torre de control ([wiki Flight Planner](https://airportceo.wiki.gg/wiki/Flight_Planner)).

**Disposición:**
- **A la izquierda**, los logotipos de las aerolíneas con contrato. Al pulsar uno salen sus vuelos sin asignar, que se pueden filtrar por tamaño de avión (Alpha 34).
- **Las filas son los *stands***, generadas solas a partir de los que son válidos: activados, con permiso comercial, conectados a seguridad y a la calle de rodaje. Cada fila lleva su nombre, A1, C1…, que se cambia en el panel del *stand* ([DB 79](https://www.airportceo.com/post/dev-blog-79-steam-direct-update-and-a-new-flight-planner)).
- **Arriba, pestañas de día**: hoy y los 6 siguientes. Se pasó de un desplegable a pestañas porque lo pidió la comunidad ([DB 79](https://www.airportceo.com/post/dev-blog-79-steam-direct-update-and-a-new-flight-planner)).
- **Arriba a la derecha**, la separación mínima entre vuelos, que también usa el planificador automático ([hilo](https://steamcommunity.com/app/673610/discussions/0/3563973555481346473)).
- En el engranaje de cada fila: ajustes del *stand* (internacional, vuelos nocturnos y si entra en el planificador automático) ([wiki Stand](https://airportceo.wiki.gg/wiki/Stand)).

**Funcionamiento:**
- Se arrastra un vuelo a un hueco permitido; sale una **casilla de confirmación** y, una vez marcada, el vuelo queda fijo salvo que se rompa el contrato ([wiki Flight Planner](https://airportceo.wiki.gg/wiki/Flight_Planner)).
- El juego impide lo imposible: un *stand* de tamaño distinto al del avión, o mover un vuelo que ya se acerca ([DB 79](https://www.airportceo.com/post/dev-blog-79-steam-direct-update-and-a-new-flight-planner)).

**Reglas con números** ([wiki Flight Planner](https://airportceo.wiki.gg/wiki/Flight_Planner)):
- Antelación mínima de 3 h según la wiki; en la letra pequeña, 1 h en puertas pequeñas y 3 h en grandes.
- Aterrizajes desde las 05:00 y despegues hasta las 22:00, salvo con la investigación «Vuelos nocturnos».
- Un vuelo suelto se puede programar como mucho 6 días antes; los recurrentes se repiten a la misma hora cada semana.
- Los *stands* remotos suman **45 minutos** por el traslado ([wiki Stand](https://airportceo.wiki.gg/wiki/Stand)).

**Planificador automático:**
- Exige tener en el consejo a un **COO y un CIO**. Coloca cada vuelo en el siguiente hueco libre. Los propios desarrolladores bromean: «es solo un puñado de reglas *if*» ([DB 100](https://www.airportceo.com/post/dev-blog-100-celebrating-100-devlogs-alpha-25-deployed-and-interview-with-mitchell)).
- Se puede activar *stand* por *stand* (Alpha 34).

**Quejas:**
- El automático hace que todos los aviones lleguen a la vez, en oleadas ([hilo](https://steamcommunity.com/app/673610/discussions/0/3108018050523511287/)).
- En aeropuertos grandes deja huecos vacíos aunque haya vuelos ([hilo](https://steamcommunity.com/app/673610/discussions/0/3829791007700283290)).
- Superpone vuelos que se pisan en una misma puerta, lo que provoca retrasos en cadena ([hilo](https://steamcommunity.com/app/673610/discussions/0/3563973555481346473)).
- A mano, «avión por avión, día por día, 7 días, franja de 3 h a franja de 3 h… imposible con más de 5 puertas» ([reseña](https://steamcommunity.com/profiles/76561198147845779/recommended/673610/)).
- **Fallo silencioso:** si arrastras un vuelo de avión pequeño a un *stand* mediano, el vuelo vuelve a la lista sin explicación ([hilo](https://steamcommunity.com/app/673610/discussions/0/2381701715730228497/)). «Los vuelos desaparecen del planificador sin ningún aviso» ([reseña](https://steamcommunity.com/profiles/76561198126241299/recommended/673610/)).

**Consejo de los jugadores:** dejar 60-70 min entre vuelos y una franja nocturna sin vuelos para que los retrasos se absorban ([hilo](https://steamcommunity.com/app/673610/discussions/0/3563973555481346473)).

### 3.2 Monitor de proceso de vuelo (tecla G)
Es la tabla de diagnóstico de cada vuelo en curso, con las **columnas agrupadas por color** ([wiki Flight monitor](https://airportceo.wiki.gg/wiki/Flight_monitor), [DB 107](https://www.airportceo.com/post/dev-blog-107-discord-ama-new-ui-progress-update-devlog-changes)):
- **Blanco (identidad):** número de vuelo, aerolínea e icono de tamaño. Los medianos llevan 2 motores y los grandes 4; se tuvieron que diferenciar mejor en la Alpha 34.
- **Azul (horario):** *stand*, estado (*En ruta*, *Retrasado*, *Aterrizado hh:mm*, *A su hora*, *Vaya a la puerta*, *Embarcando*, *Embarque cerrado*, *Rodando*, *Remolque*), pasajeros de salida y de llegada, y horas de llegada, de estancia y de salida.
- **Amarillo (pasajeros):** llegados al aeropuerto, facturados, en seguridad, desembarcados y embarcados.
- **Rojo (escala):** % de la ronda de servicio, equipaje descargado y cargado, combustible, catering y limpieza.
- **Avisos:** una columna a la derecha con un contador (0, 1…); al pasar el ratón se ve cuál es el problema.

Desde la Alpha 36, si varios vuelos tienen avisos críticos, aparece un **signo de exclamación rojo sobre el botón** del monitor y, al pasar el ratón por el contador de un vuelo, se ven todas sus notificaciones juntas ([DB 152](https://www.airportceo.com/post/dev-blog-152-notifications-tooling-and-steam-achievements)).

Para qué sirve: «una sola pieza débil retrasa todo»; la tabla dice cuál ([wiki Flight monitor](https://airportceo.wiki.gg/wiki/Flight_monitor)).

---

## 4. Personal

**Pestaña Personal** del panel de gestión ([wiki Staff](https://airportceo.wiki.gg/wiki/Staff)):
- Subsección **Candidatos**: se filtra por tipo y con deslizadores de habilidad. Cada candidato es único (nombre, aspecto, sueldo pedido y habilidad). Botón verde «Contratar». La habilidad sale en color y lo sensato es contratar «verdes».
- Subsección **Plantilla**: despedir, **formar** (botón azul; sube la habilidad a cambio de más sueldo y un pequeño coste) y **localizar** en el mapa.
- Subsección **Consejo de dirección**.
- Los empleados llegan físicamente al aeropuerto por carretera o transporte público.

**Tipos y sueldos por hora** ([wiki Staff](https://airportceo.wiki.gg/wiki/Staff)):

| Puesto | Sueldo | Qué hace |
|---|---|---|
| Agente de pasajeros | 7–9 $ | Su habilidad influye en la satisfacción |
| Agente de seguridad | 11–16 $ | A más habilidad, menos contrabando |
| Agente de rampa | 8–15 $ | |
| Administrativo | 5–50 $ | Investiga y lleva programas |
| Limpiador | 1–10 $ | |
| Técnico | 11–16 $ | |
| CFO | 80–120 $ | Desbloquea la pestaña Tasas |
| CIO | 75–115 $ | Desbloquea datos y gráficos |
| COO | 75–90 $ | Repara solo los *stands* |
| Director de RR. HH. | 70–90 $ | Desbloquea la pestaña Salarios |
| Director de compras | 25–35 $ | |
| Director de estrategia | 65–85 $ | |

- COO + CIO desbloquean el planificador automático.
- **Productividad (Alpha 34):** una sola variable de habilidad más la productividad del momento, que depende de dos necesidades, energía y baño. Los directivos dan bonificaciones; un director de RR. HH. productivo da hasta **+5 %** de productividad a todos ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)). Los administrativos y directivos tienen horario de oficina y se van a casa.
- **Plantillas por *stand*:** un *stand* pequeño necesita 2 agentes de rampa; uno mediano, 4 y un vehículo por servicio; uno grande, 6 y 2 camiones de catering ([wiki Stand](https://airportceo.wiki.gg/wiki/Stand)). Un control de seguridad pequeño pide 1 agente; uno mediano, 4; uno grande, 5 ([wiki Security](https://airportceo.wiki.gg/wiki/Security)).
- **Faltas de personal:** las tarjetas de estadísticas de empleados y vehículos de la barra inferior muestran una **exclamación** cuando falta gente (Beta 1.1-0). La felicidad del personal aparece en la pestaña desde la 1.0-15.

**Críticas:**
- «Esperar a que aparezcan candidatos es una molestia que no añade nada.»
- «El consejo (CFO, COO, RR. HH.) se contrata una vez y ya; no aporta experiencia» ([reseña](https://steamcommunity.com/profiles/76561197994948302/recommended/673610/)).
- «RR. HH. es tonto: contratas a los mejores y listo. Hay turnos, pero no hacen nada» ([reseña de 475 h](https://steamcommunity.com/profiles/76561198060003577/recommended/673610/)).

---

## 5. I+D, programas, licencias y calificación del aeropuerto

### 5.1 Proyectos de I+D (Alpha 34)
- Se abren en Gestión → Operaciones → I+D. Lo hacen los administrativos, que trabajan en horario laboral y necesitan mesa, acceso al aeropuerto y sala de personal ([wiki R&D](https://airportceo.wiki.gg/wiki/R_%26_D_Panel)).
- El **árbol** tiene grupos con niveles 1-5 ([wiki R&D](https://airportceo.wiki.gg/wiki/R_%26_D_Panel)):
  - **Licencia comercial**, de la que salen el permiso de aviones medianos (luego el cargador de cinta), el de aviones grandes, los vuelos nocturnos (luego la iluminación avanzada de pista), el permiso de plantas superiores y la **Licencia comercial ampliada** (metro, limpieza de cabina, catering, automatización, Licencia comercial definitiva, varias terminales y servicios en *stands* remotos).
  - **Equipaje:** seguridad de niveles 1, 2 y 3, bandejas basculantes y cintas rápidas.
  - Franquicias de tiendas y de cafeterías (luego restaurantes de calidad), y unidades de emergencia.
  - **Combustible:** Jet A-1, camiones, depósitos medianos y tanques.
  - **Otros:** mantenimiento preventivo e ingeniería estructural.
- Las investigaciones dan **permisos**. La licencia comercial **se puede retirar** si la nota de seguridad media es mala ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)).
- Por qué se hizo: «que el veterano sienta que va hacia una meta y que el novato aprenda lo básico antes de lanzarse a un aeropuerto internacional» ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)).

### 5.2 Programas
- Dan un efecto fijo, no un desbloqueo ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update), [wiki R&D](https://airportceo.wiki.gg/wiki/R_%26_D_Panel)).
- Cada uno admite **hasta 5 administrativos**, y su eficacia **crece cuanto más tiempo lleva activo**: una barra verde lo muestra.
- Hay 3 grupos de 4 programas y **solo 2 activos por grupo**:

| Grupo 1 | Grupo 2 | Grupo 3 |
|---|---|---|
| Rebaja del mantenimiento | Investigación más rápida | Relación con aerolíneas |
| Rebaja de salarios | Satisfacción del pasajero | Alerta de seguridad alta |
| Rebaja de reparaciones | Productividad del personal | Descuentos de proveedores |
| Construcción más rápida | Márketing (atrae visitantes) | Relación con sindicatos |

### 5.3 Calificación del aeropuerto (Alpha 34)
- **4 notas principales: GA, aerolínea, pasajero y seguridad.** Cada una se compone de varias notas secundarias. Antes de tener la licencia comercial solo cuenta la de GA ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)).
- Las secundarias del pasajero incluyen limpieza, trato del personal, tiempo de cola, haber embarcado a tiempo y otras ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)). La lista de factores que recopilan los jugadores: precios razonables, pocos retrasos, tiendas y comida suficientes, colas cortas en seguridad, transporte público, poco caminar (pasillos rodantes), asientos y aseos, escáner de equipaje, patrullas, decoración y felicidad del personal ([hilo](https://steamcommunity.com/app/673610/discussions/0/3484123157240812416/)).
- **Nota actual y nota media**: la actual va moviendo la media, y **la media es la que cuenta**:
  - una buena media de GA trae más tráfico de GA («los pilotos hablan mucho»);
  - una buena media de aerolínea trae más vuelos;
  - una buena media de pasajero trae más tráfico y más franquicias;
  - una mala media de seguridad trae multas y la retirada del permiso ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update)).
- **Interfaz:** abajo a la derecha. Al pasar el ratón por el icono del aeropuerto se abre el panel completo; por el icono de una nota, solo sus secundarias; y por una secundaria, **una ventanita que explica de qué depende y qué puedes hacer** ([DB 142](https://www.airportceo.com/post/dev-blog-142-the-r-d-update), [notas de la Alpha 34](https://steamdb.info/patchnotes/4624710/)).
- **Aeropuerto del Año:** cada año de juego (12 días) llega un correo con los 10 mejores aeropuertos por felicidad media. El ganador cobra **2.000.000 $**, y el tuyo solo sale si ganas ([wiki Email](https://airportceo.wiki.gg/wiki/Email)).
- **Lo que no funciona:**
  - «La calificación parece aleatoria; sé que no lo es, pero lo parece» ([reseña](https://steamcommunity.com/profiles/76561197994948302/recommended/673610/)).
  - «Ninguna explicación de por qué las aerolíneas te quieren o no» ([reseña](https://steamcommunity.com/profiles/76561198009195938/recommended/673610/)).
  - «La nota del aeropuerto parece tan poco importante que no motiva nada» ([reseña de 475 h](https://steamcommunity.com/profiles/76561198060003577/recommended/673610/)).
  - «Rechacé todas las emergencias y las multas no me hacen ni cosquillas» ([reseña de 185 h](https://steamcommunity.com/profiles/76561197972261644/recommended/673610/)).

  Conclusión: la estructura en dos niveles con ayuda al pasar el ratón es buena, pero **las consecuencias son flojas** y **los saltos de nota no dicen la causa**.

---

## 6. Finanzas

**Pestaña Economía**, con cinco subpestañas de color bajo el título: Presupuesto, Tasas, Salarios, Préstamos y Contratos. La de Contratos es la azul, la última a la derecha, y tiene filtros debajo ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111), [wiki Economy](https://airportceo.wiki.gg/wiki/Economy)).

- **Presupuesto:**
  - Ingresos: gasto de los pasajeros, pagos de las aerolíneas (embarque, combustible, aterrizaje, hangar), franquicias y aparcamiento.
  - Gastos: obras (construcción, contratistas, operación y reparación), sueldos, vehículos, préstamos e **impuestos**.
  - Las barras de ingresos y de gastos llevan el total (Alpha 34). Se puede desplegar Ingresos → Aviones para ver tasas de uso y de aparcamiento ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).
- **Fuentes de dinero de un vuelo** ([wiki Flights](https://airportceo.wiki.gg/wiki/Flights)): tasa de pista (se cobra dos veces, al aterrizar y al despegar), desembarque, servicios de escala, embarque y **aparcamiento**, que es «la principal fuente de dinero del juego». La cifra del planificador es el mínimo; el vuelo siempre deja más.
- **Préstamos:**
  - Tres tipos de banco, cada uno con su importe, interés y plazo ([DB 39](https://www.airportceo.com/post/dev-blog-39-improved-taxiway-building-economy-panel-aircraft-voting)).
  - No se pueden pedir con el juego en pausa ni **con saldo negativo**. Se pueden devolver de una vez y se pagan **por hora** ([wiki Economy](https://airportceo.wiki.gg/wiki/Economy)).
  - Importes que ven los jugadores: de 150.000 a 250.000 $ al principio y hasta 1,9 M$ ([hilo](https://steamcommunity.com/app/673610/discussions/0/3075369490065225067/)). Se pide que crezcan con la nota del aeropuerto.
- **Datos y gráficos:** con un CIO se ven líneas de pasajeros, ingresos, gastos y saldo en tiempo real ([DB 111](https://www.airportceo.com/post/dev-blog-111-the-new-ui-released-alpha-27-7-feature-voting-round-1-closed-and-launching-the-development-of-the-airport-ceo-mod-tool)). En el diseño de 2016, el panel «Dashboard» tenía **widgets que decían «Sin conexión…»** hasta construir la estación meteorológica o contratar al responsable: no hay información gratis ([DB 42](https://www.airportceo.com/post/dev-blog-42-a-large-runway-the-dashboard-panel-construction-serialization-more)).
- **Informes por correo:** el CFO (economía) y el COO (operaciones) mandan un resumen del día anterior a las 09:00 ([wiki Email](https://airportceo.wiki.gg/wiki/Email)). Molesta que no se puedan desactivar ([reseña](https://steamcommunity.com/profiles/76561198147845779/recommended/673610/)) y que den «sabor a trabajo de verdad» ([reseña](https://steamcommunity.com/profiles/76561198009195938/recommended/673610/)).
- **Equilibrio:** «el dinero es lo más fácil, como en todos los simuladores» ([reseña de 247 h](https://steamcommunity.com/profiles/76561198110273258/recommended/673610/)). «Contrato a los empleados más caros, compro los vehículos más caros, nunca negocio… y nado en dinero en Difícil» ([reseña de 185 h](https://steamcommunity.com/profiles/76561197972261644/recommended/673610/)). La 1.0-10 corrigió el abuso del alquiler de franquicias y de las joyerías: en un aeropuerto pequeño, la joyería daba 447.000 de 710.000 de ingresos ([hilo](https://steamcommunity.com/app/673610/discussions/0/2965019884823757693/)).

---

## 7. Operaciones y cómo avisa de los fallos

### 7.1 Pestaña Operaciones
Tiene tres subpestañas de color: Resumen, I+D y Construcción, esta última naranja ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).

**Resumen:** interruptores agrupados ([wiki Operations](https://airportceo.wiki.gg/wiki/Operations)):
- **Aeropuerto:** abierto o cerrado; admitir GA.
- **Luces:** hora de encendido y de apagado.
- **Pistas:** repartir las salidas entre todas o usar la más cercana.
- **Equipaje:** con servicio, el equipaje va por facturación y bodega; sin él, el pasajero lo lleva encima.
- **Mantenimiento:** limpieza y reparaciones preventivas; reparación automática de *stands* y pistas (Alpha 34).
- **Servicios de escala**, cada uno **con sus requisitos escritos debajo**. Por ejemplo, el repostaje de Jet A-1 pide depósito de Jet A-1, 1 camión y contrato de combustible.
- **Vuelos nocturnos** (Alpha 34) y prohibir la entrada de visitantes si el programa de márketing está activo (Beta 6).

### 7.2 Sistemas físicos
- **Combustible:**
  - Depósito pequeño de 30.000 L; mediano de 200.000 L, al que se le pueden añadir hasta 6 tanques de 40.000 L ([wiki Fuel](https://airportceo.wiki.gg/wiki/Fuel)).
  - Una cochera de vehículos guarda 20 vehículos, cuesta 10.000 $ y su mantenimiento son 20 $; un aparcamiento de servicio guarda 7, cuesta 4.000 $ y su mantenimiento son 10 $ ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).
- **Seguridad:** controles, escáneres de equipaje de niveles 1-3, patrullas a pie y en vehículo (estas ahuyentan animales) y controles de vehículos entre la carretera pública y la de servicio ([wiki Security](https://airportceo.wiki.gg/wiki/Security)).
- **Clima real:** el tiempo sale de datos históricos reales (8.760 horas al año por punto de medida) y hay 4 climas (polar, templado, tropical y desierto). Al elegir el sitio del aeropuerto se ven los datos del clima ([DB 157](https://www.airportceo.com/post/dev-blog-157-airport-ceo-celebrates-three-years-in-early-access), Beta 3).

### 7.3 Emergencias (Alpha 36)
Hay tres clases ([DB 153](https://www.airportceo.com/post/dev-blog-153-emergencies)):
- **Activas:** atadas a un avión, un objeto o una persona, con una cadena de acciones.
  - Llegan como **aviso que puedes aceptar o rechazar**. Hay 7 de llegada (fallo de motor o de equipo, meteorología, combustible, médica, seguridad y avión ambulancia) y 3 de salida (avión no apto, choque con aves, reventón).
  - Un vuelo comercial de emergencia hay que **llevarlo a un *stand* en menos de 30 minutos** desde que se acepta.
  - Al terminar se pone **nota con letra**: el Estado espera una A, con el 100 % hecho, y si se hace a medias la multa es menor.
  - Rechazar o hacerlo mal trae multas fuertes y baja la nota de seguridad. La wiki da 25.000 $ por no atender un choque con aves ([wiki Emergencies](https://airportceo.wiki.gg/wiki/Emergencies)).
- **Pasivas:** cambian el entorno durante unos días y no tienen contramedida directa. Son la crisis del combustible (2-5 días de precios altos), la huelga, la avería de señalización ferroviaria, el volcán, el temporal, la pandemia y el crac económico.
  - Se aguantan con **varias estrategias**: tener dinero guardado, subir tasas (y perder relación) o haber hecho acopio antes en depósitos ([DB 153](https://www.airportceo.com/post/dev-blog-153-emergencies)).
- **Ocurridas:** se descubren en destino (equipaje peligroso, deshielo mal hecho, pasajeros conflictivos). Traen multa inmediata, menos nota de seguridad y correo del Gobierno.

**Cuándo y cuántas:**
- No hay emergencias **hasta tener la licencia comercial** y unas horas de juego.
- Su frecuencia depende de la dificultad: en Fácil son muy raras y en Extremo, muy frecuentes ([notas de la Alpha 36](https://store.steampowered.com/news/app/673610)). En total hay «hasta 24 tipos».
- El informe llega por correo días después, con el grado, el nivel, las consecuencias y sugerencias ([wiki Email](https://airportceo.wiki.gg/wiki/Email)).

**Quejas:** consecuencias pequeñas para quien rechaza ([reseña](https://steamcommunity.com/profiles/76561197972261644/recommended/673610/)) y un informe con «grado A, sin multa» llegado a la vez que una multa de 1.364.509 $ ([reseña](https://steamcommunity.com/profiles/76561197978876159/recommended/673610/)). Es exactamente el tipo de incoherencia entre diálogo y motor que queremos evitar.

---

## 8. Capas e información en el mapa

- **Teclas** ([How To Play](https://airportceo.wiki.gg/wiki/How_To_Play)):
  - Z zonas, H salas, U colas, Y flechas de las cintas, C sentido de la pista y calles de rodaje.
  - Tab abre el panel de gestión en la última pestaña usada; F el planificador; G el monitor.
  - F1 ayuda (una imagen anotada de la interfaz); F3 lo abre todo; F4 oculta la interfaz.
  - B demoler; Ctrl demuele solo ese tipo de objeto.
  - P o Espacio pausan; 1, 2 y 3 son las velocidades.
- **Capas de datos sobre el mundo** (beta) ([notas de Beta 4/5/6](https://store.steampowered.com/news/app/673610)):
  - transitabilidad (dónde pueden andar las personas);
  - mapas de calor de pasajeros de llegada y de salida;
  - mapa de calor de congestión de aviones;
  - texto de zona y área (Alpha 35);
  - opacidad de las zonas ajustable (Alpha 36).
- **Herramientas de diagnóstico (Alpha 36)** ([DB 152](https://www.airportceo.com/post/dev-blog-152-notifications-tooling-and-steam-achievements)):
  - **Lector de zonas:** al pasar el ratón por una casilla dice su zona y a qué área segura, internacional o terminal pertenece.
  - **Análisis de rutas:** eliges tipo de agente, origen y destino, y te dice si hay camino. Pinta la ruta en **verde** o, en **rojo**, el intento fallido más cercano, y saca un informe. Sirve para pasajeros, empleados, seguridad, contratistas, equipaje, vehículos y aviones.
  - Motivo declarado: muchos informes de «fallo de rutas» eran en realidad diseños mal hechos que el jugador no podía diagnosticar.
- **Panel de contexto (Beta 4):** una leyenda que explica los controles y símbolos **de la acción que estás haciendo**. «Si dudas de qué estás mirando, échale un vistazo.»
- **Modo planificación (Beta 3):** se puede dibujar cualquier objeto como plano y construirlo después.
- **Fichas al pulsar un objeto:**
  - La de pista o *stand* tiene un interruptor de abierto o cerrado arriba a la derecha y los tipos de avión admitidos. Dice si tiene conexión con la pista de llegada y la de salida, **en verde, o en rojo si falta**.
  - Lleva los servicios pedidos y el tipo de *stand* ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).
  - Las de baggage bay muestran cuántas conexiones de *stand* quedan (1.0-7).
- **Menú de clic derecho (Alpha 27):** renombrar, cambiar color, ver limpieza y estado, mandar a un limpiador o técnico y mover (Beta 2) ([DB 111](https://www.airportceo.com/post/dev-blog-111-the-new-ui-released-alpha-27-7-feature-voting-round-1-closed-and-launching-the-development-of-the-airport-ceo-mod-tool)). Desde la 1.1-0, «C» copia lo que está bajo el ratón.

---

## 9. Notificaciones: historia de un fracaso corregido

- **Alpha 27 (2018):**
  - Las notificaciones ocupaban una columna a la izquierda y podían investigarse; había ajustes para silenciar tipos o agruparlas por gravedad ([DB 111](https://www.airportceo.com/post/dev-blog-111-the-new-ui-released-alpha-27-7-feature-voting-round-1-closed-and-launching-the-development-of-the-airport-ceo-mod-tool)).
  - Antes, en la interfaz vieja, salían «exclamaciones rojas sobre objetos **sin ningún texto** que explicara el problema» y había una lista de «cientos de tareas en orden cronológico» que no servía a nadie ([DB 106](https://www.airportceo.com/post/dev-blog-106-a-new-aircraft-the-new-ui-sprint-progress-steam-workshop-integration-and-rendering-performance)).
- **Diagnóstico de los propios desarrolladores (DB 152):** los avisos de rutas inundaban la columna, y «cuando lo habitual es desactivar un sistema nada más empezar, algo va mal»; «el exceso de notificaciones hace que el jugador las ignore». Muchos «fallos» que se reportaban eran diseños rotos que el jugador **no había podido ver** ([DB 152](https://www.airportceo.com/post/dev-blog-152-notifications-tooling-and-steam-achievements)).
- **Rediseño (Alpha 36):** el principio pasa a ser «**la atención del jugador es un bien escasísimo**» ([DB 152](https://www.airportceo.com/post/dev-blog-152-notifications-tooling-and-steam-achievements)).
  1. En la columna fija de la izquierda solo entran avisos **críticos** o muy informativos sobre el aeropuerto entero. El resto va a un **panel de revisión**, y se quitan los ajustes de silenciar porque ya no hacen falta.
  2. Los agentes (pasajeros, empleados) ya no lanzan avisos en la columna. Lanzan **avisos en el mundo**, en el sitio exacto donde está el problema: una cajita roja que **al pasar el ratón** dice la causa y **al pulsarla** abre el detalle. «La posición del aviso ya da contexto.»
  3. Los avisos de cada vuelo se agrupan en su fila del monitor, con un contador y una exclamación sobre el botón.
- **Lo que sigue mal según los jugadores:**
  - «Las notificaciones son aleatorias, abundantes y tan escondidas que olvidas que existen… pero los correos de informes diarios sí los ves, y no se pueden quitar» ([reseña](https://steamcommunity.com/profiles/76561198147845779/recommended/673610/)).
  - «La información está repartida entre notificaciones, correos, tutoriales en el teléfono y ventanas emergentes: no hay coherencia» ([reseña](https://steamcommunity.com/profiles/76561197994948302/recommended/673610/)).
  - «Los avisos no ayudan a resolver nada» ([reseña](https://steamcommunity.com/profiles/76561197994862441/recommended/673610/)).
  - «Te dice que revises muros y zonas, pero no **señala dónde** está el fallo» ([reseña](https://steamcommunity.com/profiles/76561198010816691/recommended/673610/)).
  - El correo llega a un tope y deja de avisar: «¿Querías saber si acabó la investigación? Compruébalo a mano» ([reseña](https://steamcommunity.com/profiles/76561197985590072/recommended/673610/)).
  - Los correos de spam de «Dr William Monroe», con un filtro antispam que había que comprar, se quitaron por molestos ([wiki Email](https://airportceo.wiki.gg/wiki/Email), [reseña](https://steamcommunity.com/profiles/76561198147493582/recommended/673610/)).

---

## 10. Tutorial, partida nueva, dificultad, modo libre y ajustes

### 10.1 Partida nueva ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111))
1. Crear el personaje CEO.
2. Elegir un punto en el **mapa del mundo**. Se ve una ficha del sitio: aeropuertos nacionales de la región (de 1 a unos 750), clima, frecuencia de deshielo, temperatura, lluvia, viento, humedad, nubosidad y presión. Cuantos menos aeropuertos nacionales haya, más vuelos internacionales; en Schengen, toda la zona cuenta como nacional ([wiki International Zone](https://airportceo.wiki.gg/wiki/International_Zone)).
3. Nombre del aeropuerto, código de 3 letras y logotipo.
4. **Modo libre** (*sandbox*), con un engranaje de reglas: fondos ilimitados, sin emergencias, sin animales, sin simulación económica, sin simulación de obra, todos los proyectos desbloqueados, todas las zonas compradas y vuelos ilimitados. Desde la Beta 1.1-0 cada partida puede tener sus propias reglas.
5. Mapa grande (Beta 3).
6. **Dificultad «Airport Management Mode»** de Fácil a Extremo. Fácil empieza con **3.000.000 $** y emergencias raras ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)); Extremo con **500.000 $** ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2387840605)). En una versión antigua, la más difícil daba 250.000 $ ([hilo](https://steamcommunity.com/app/673610/discussions/0/1729828401668327087/)).
7. Arrancar.

- Las **zonas del mapa** se compran por áreas; en la guía, desde 750.000 $ cada una. Se introdujo para el rendimiento y como meta ([DB 103](https://www.airportceo.com/post/dev-blog-103-alpha-25-5-the-peformance-sprint-and-unlockable-areas)).
- **Los logros se desactivan** para siempre en esa partida si se usa el modo libre, la obra sin simular, la consola F9 o el panel F10 ([DB 152](https://www.airportceo.com/post/dev-blog-152-notifications-tooling-and-steam-achievements)). Al principio hubo 38 logros en cuatro categorías: aviones y escalas, agentes, gestión y economía, y taller y comunidad.
- La comunidad pidió más opciones: tamaños de infraestructura al inicio, emergencias sí o no, I+D sí o no, dinero exacto, tamaño del mapa y un botón «seleccionar todo» para no perder 10 minutos configurando ([foro](https://forum.apoglabs.com/t/new-game-options-configurable-sandbox/17268)).

### 10.2 Tutorial (panel interactivo desde la Alpha 30; terminado en la Beta 7)
- **Fases:** Aeródromo pequeño → Aeropuerto regional → Aeropuerto internacional ([guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111)).
- **Dos modos:**
  - explicación con texto y diagrama;
  - **lista de comprobación**, junto a la X del panel. «ES TREMENDAMENTE ÚTIL: si un punto no se marca, es que te falta algo.»
- Los puntos **se marcan solos** al cumplirse en el juego; hay un botón para **saltar un paso** (Alpha 25).
- El tutorial está también en el panel de gestión, a la derecha del todo. Hay una opción de que el panel se abra al completar un paso.
- Empieza con un **correo de la alcaldesa o alcalde** dando la bienvenida ([wiki Email](https://airportceo.wiki.gg/wiki/Email)).
- **Fallos que salen en el registro de cambios:**
  - pasos que no avanzan;
  - pasos que se completan solos;
  - pasos que piden cosas antes de haberlas investigado (por ejemplo, ACEO-22016: «no indica que antes hay que investigar Aviones medianos»);
  - imágenes desfasadas;
  - atajos de teclado mal puestos.
- **Opinión:**
  - «El tutorial está completo pero es pasivo: solo texto e imágenes» ([reseña](https://steamcommunity.com/profiles/76561197970293432/recommended/673610/)).
  - «Hay que ir y volver al tutorial para no saltarte un interruptor escondido y preguntarte por qué no aterriza nadie en todo el día» ([reseña](https://steamcommunity.com/profiles/76561197994862441/recommended/673610/)).
  - «Tutorial escaso; hacen falta YouTube, Reddit y la comunidad» ([reseña](https://steamcommunity.com/profiles/76561198009195938/recommended/673610/)).

### 10.3 Ajustes ([wiki Game Settings](https://airportceo.wiki.gg/wiki/Game_Settings))
- Autoguardado cada 5-60 min; unidades métricas o imperiales; 15 monedas; reloj de 12 o 24 h.
- **Volver a velocidad normal cuando pasa algo**; empezar en pausa.
- **Pasajeros por vuelo** del 0 al 100 %: menos ingresos a cambio de más rendimiento.
- Arrastrar con dos clics; reglas de *stands* internacionales; Schengen.
- Conectar solas las puertas de embarque; adornos de temporada; quitar el límite de escaleras.
- Teclas configurables, con un botón para volver a las de serie.

---

## 11. Mods y rejugabilidad

- **Mods** ([wiki Modding](https://airportceo.wiki.gg/wiki/Modding)):
  - **De empresas** en JSON más texturas: aerolíneas, combustible, deshielo, catering, franquicias, constructoras y **bancos**. Es el tipo más común y el más apoyado por los desarrolladores.
  - Plantillas de construcción que se suben desde el propio juego.
  - Logotipos de aeropuerto, productos de tienda, pegatinas y mods de código (inyección).
  - Steam Workshop está integrado (Alpha 27) y hay un límite práctico de unos 50 mods por VRAM.
  - Hasta el clima se puede modificar.
  - La herramienta comunitaria ACEOMM juntó casi 2.000 empresas y una base de datos de más de 14.000 aeropuertos reales ([DB 111](https://www.airportceo.com/post/dev-blog-111-the-new-ui-released-alpha-27-7-feature-voting-round-1-closed-and-launching-the-development-of-the-airport-ceo-mod-tool)).
- **Lo que da variedad hoy:**
  - el sitio en el mundo, que cambia el clima y la proporción de vuelos internacionales;
  - la dificultad, con la frecuencia de emergencias;
  - las reglas del modo libre;
  - las rutas reales (Alpha 34);
  - las aerolíneas de mods;
  - y, sobre todo, el diseño del propio aeropuerto: «no hay un único diseño correcto» ([reseña](https://steamcommunity.com/profiles/76561198367471798/recommended/673610/)); «muy rejugable, solo limitado por tu creatividad» ([reseña de un probador que trabaja en un aeropuerto](https://steamcommunity.com/profiles/76561198005957236/recommended/673610/)).
- **Lo que falta (la queja de fondo):**
  - «A las pocas horas de cada partida me pierdo: no tengo propósito; la decisión más importante es si el váter va en horizontal o en vertical» ([reseña de 185 h, 132 votos útiles](https://steamcommunity.com/profiles/76561197972261644/recommended/673610/)).
  - «Una vez construido un aeropuerto, el reto se acabó» ([reseña](https://steamcommunity.com/profiles/76561198136081171/recommended/673610/)).
  - «Rejugabilidad mínima: el aeropuerto no se puede ampliar fuera de una partida. Pido un sistema de **subvenciones** con metas a largo plazo y poder **vender el aeropuerto** y empezar otro con más dinero» ([reseña](https://steamcommunity.com/profiles/76561198006686917/recommended/673610/)).
  - «Elegir Juneau (Alaska) o Nueva York da el mismo escenario: solo cambia el país» ([reseña](https://steamcommunity.com/profiles/76561198110367711/recommended/673610/)).
  - Achaque técnico: con 35.000 o más pasajeros, el juego se arrastra.

---

## 12. Estructura de la interfaz

### 12.1 Distribución de la pantalla (1.0)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [panel superior: aprobación manual de vuelos GA (ACEO-63, guía GA)]   │
│┌────────┐                                                            │
││AVISOS  │       MUNDO (vista cenital; avisos rojos sobre agentes)     │
││críticos│                                                            │
││(columna│   ┌────────────── PANEL DE GESTIÓN (Tab) ───────────┐      │
││izq.)   │   │ entra por la izquierda, ≤50 % de la pantalla     │      │
│└────────┘   │ iconos de pestaña · subpestañas de color · lista │      │
│             └──────────────────────────────────────────────────┘      │
│ [BARRA DE CONSTRUCCIÓN: categorías con iconos amarillos]             │
│ [PANEL INFERIOR GRIS: fecha y hora · velocidad · planificador F ·     │
│  monitor G · pasajeros/equipaje/aviones/personal/vehículos (con !) ·  │
│  herramientas: demoler, zonas, rutas, lector de zonas, patrullas]     │
│                                           [NOTAS: aeropuerto + 4]     │
└──────────────────────────────────────────────────────────────────────┘
```

De dónde sale este esquema:
- [Guía](https://steamcommunity.com/sharedfiles/filedetails/?id=2802326111): «hay dos zonas principales: la barra de abajo con los iconos para construir, casi toda amarilla, con una barra gris debajo; y el Tab o panel de gestión»; la velocidad está «abajo a la izquierda».
- [DB 111](https://www.airportceo.com/post/dev-blog-111-the-new-ui-released-alpha-27-7-feature-voting-round-1-closed-and-launching-the-development-of-the-airport-ceo-mod-tool): «la información se concentra en la parte baja de la pantalla».
- [Notas de la Alpha 34](https://steamdb.info/patchnotes/4624710/): las notas, «abajo a la derecha».
- [DB 152](https://www.airportceo.com/post/dev-blog-152-notifications-tooling-and-steam-achievements): la columna de avisos de la izquierda.
- Alpha 36: el panel inferior de interacción lleva estadísticas de pasajeros, equipaje y aviones, y el acceso a la oferta y demanda de tareas; las herramientas están junto a la de demoler.
- [Guía GA](https://airportceo.wiki.gg/wiki/General_Aviation): las GA se aprueban a mano «desde el panel de control de la barra superior».

### 12.2 Panel de gestión
- **Concepto:** «tu centro de mando, como una tableta». **Entra desde la izquierda y ocupa el 50 % de la pantalla** para que sigas viendo el aeropuerto. Solo los paneles muy complejos, como el planificador, pasan de ahí. «Así sientes que sigues *dentro* del juego» ([DB 38](https://www.airportceo.com/post/dev-blog-38-upgrade-system-the-management-panel)).
- **Reglas de la interfaz nueva** ([DB 106](https://www.airportceo.com/post/dev-blog-106-a-new-aircraft-the-new-ui-sprint-progress-steam-workshop-integration-and-rendering-performance), [DB 111](https://www.airportceo.com/post/dev-blog-111-the-new-ui-released-alpha-27-7-feature-voting-round-1-closed-and-launching-the-development-of-the-airport-ceo-mod-tool)):
  - profundidad máxima de **dos niveles de pestañas**;
  - **mover el ratón lo menos posible**;
  - un solo panel a la vez y no varios repartidos por la pantalla;
  - muchas **ventanitas al pasar el ratón** («explicar qué hace un elemento con poco espacio»);
  - iconos comprensibles con descripción en vez de «cadenas largas de texto»;
  - estilo claro y minimalista;
  - un experto en usabilidad y un grupo de jugadores veteranos lo revisaron antes de publicarlo.
- **Lo que se corrigió de la versión vieja** ([DB 106](https://www.airportceo.com/post/dev-blog-106-a-new-aircraft-the-new-ui-sprint-progress-steam-workshop-integration-and-rendering-performance)): «menús en horizontal y en vertical, con tres niveles de pestañas, en media pantalla pequeña: imposible orientarse».
- **Pestañas** (a la izquierda; el orden es aproximado; se abren con Tab en la última usada):
  - **Panel del CEO / Resumen:** widgets del tiempo, correo, actividad, incidentes y caja; mapa; clima local.
  - **Correo:** marcar, abrir, guardar, borrar, marcar como no leído y buscar ([DB 38](https://www.airportceo.com/post/dev-blog-38-upgrade-system-the-management-panel)).
  - **Personal:** candidatos, plantilla y consejo.
  - **Economía:** Presupuesto, Tasas, Salarios, Préstamos y Contratos (5 subpestañas de color).
  - **Operaciones:** Resumen, I+D y Construcción (3 subpestañas de color).
  - **Vehículos y compras:** con filtros por icono.
  - **Datos:** pide un CIO.
  - **Tutorial:** a la derecha del todo.

### 12.3 Colores e iconos
- **Verde:** bien, conectado, contrato vigente o empleado con buena habilidad.
- **Rojo:** cerrado, sin conexión o problema (las cajas rojas en el mundo y las exclamaciones).
- **Naranja:** contrato listo para renegociar.
- **Azul:** formar.
- **Monitor de vuelos:** blanco para la identidad, azul para el horario, amarillo para los pasajeros y rojo para la escala.
- **Planificador:** avión de 2 motores para los medianos y de 4 para los grandes; los pequeños tienen su propio símbolo.
- **Calificación:** estrellas de 1 a 5 en empresas, vuelos y aeropuerto.
- **Rutas:** verde si se encuentra el camino, rojo para el intento fallido más cercano.
- Hay una opción de opacidad para las capas de zonas.

### 12.4 Cómo encuentra el jugador las cosas (y dónde falla)
**Lo que funciona:**
- cada cosa tiene una tecla (Tab, F, G, Z, H, U, Y, C, B, F1);
- la imagen de ayuda anotada con F1;
- los paneles al pulsar un objeto, con su interruptor de abierto o cerrado y su conexión en verde o rojo;
- la lista de requisitos debajo de cada servicio;
- el panel de contexto;
- el planificador como única puerta de entrada de los vuelos.

**Lo que falla:**
- **interruptores escondidos**: abrir el aeropuerto, permitir GA, abrir la pista y marcar los tipos de avión admitidos. Si falta uno, no aterriza nada y **nadie te dice cuál**;
- el menú de construcción tiene tres niveles: grupo, tipo y variante ([reseña](https://steamcommunity.com/profiles/76561197960792316/recommended/673610/));
- iconos sin explicar, como los que indican qué carreteras necesita cada edificio ([reseña](https://steamcommunity.com/profiles/76561197970293432/recommended/673610/));
- la información repartida en cinco canales (§9).

---

## 13. Qué alaban y qué critican los jugadores (resumen)

**Alaban:**
- ver funcionar el aeropuerto («satisfactorio, parece uno de verdad»);
- la profundidad de la escala (servicios bien representados);
- el sistema de negociación;
- el planificador, que da sensación de mando;
- la libertad de diseño;
- los mods;
- la claridad de algunos paneles («la interfaz es excelente, se nota el análisis lógico» ([reseña de 2017](https://steamcommunity.com/profiles/76561198136421655/recommended/673610/)); «controles suaves y menús fáciles de navegar» ([reseña](https://steamcommunity.com/profiles/76561198055780740/recommended/673610/))).

**Critican:**
1. Errores de rutas.
2. **Falta de propósito o metas** a medio y largo plazo.
3. Diagnóstico pobre («por qué no funciona»).
4. Tutorial pasivo.
5. Información dispersa y correos inútiles.
6. Notas opacas y con pocas consecuencias.
7. Planificador automático torpe y planificación manual tediosa.
8. Dinero demasiado fácil a la larga.
9. Rendimiento con aeropuertos grandes.

---

## 14. Qué nos llevamos a «Iberia Ferroviaria» (traducción a tren)

Mapeo de conceptos:

| Airport CEO | Iberia Ferroviaria |
|---|---|
| Aeropuerto | Red de Tenfe |
| Aerolínea | Cliente o patrocinador de un servicio: comunidad autónoma, ayuntamiento, Ministerio (OSP), o marca y operador privado para las franquicias |
| *Stand* o puerta | Surco o franja de capacidad de un corredor |
| Vuelo | Servicio semanal (relación) |
| Escala | Preparación del tren: limpieza, mantenimiento, tripulación, cafetería |
| Licencia comercial | Concesión o licencia de la AESF |
| Calificación | Las 4 notas de Tenfe |
| Fabricantes, combustible, constructoras | Trenespop, suministro eléctrico y cuadrillas |

Las ideas concretas, con su valor y coste, están en el campo `steal` de la salida estructurada. Las más importantes:

1. **Notas en dos niveles:** 4 notas principales (Viajeros, Gobierno y OSP, Territorios y alcaldes, Seguridad y regulador), cada una con 3-5 secundarias. Dar la **nota de la semana** y la **media de 8 semanas**. La media es la que abre pactos, ofertas de fabricantes y licencias. Al pasar el ratón, cada secundaria explica «de qué depende y qué puedo hacer».
2. **Ofertas por categoría en estrellas según la media.** Así un pacto o una oferta de Trenespop de 4-5★ solo aparece con nota alta. Para que haya dilema, cada categoría debe tener su pega: los socios de 5★ exigen más puntualidad y castigan más.
3. **Convenio marco y peticiones semanales:** se firma una vez con cada territorio, que luego manda **peticiones de servicio** que se aceptan o se rechazan. Hay que dar margen de puntualidad y castigar las cancelaciones.
4. **Renegociación con puntos y probabilidad visible**, pero **sin repetir hasta acertar**: como mucho 2 contraofertas y después la otra parte se cierra (y se enfada). Las rebajas propias se aceptan siempre. Hay autonegociador.
5. **Monitor de corredores con columnas por color** y contador de avisos con explicación al pasar el ratón: es el «por qué va mal esto».
6. **Avisos con prioridad:** solo los críticos en la columna fija (máximo 3); el resto en la bandeja del Diario o del correo; avisos **sobre el mapa**, en el corredor o la estación, con la causa al pasar el ratón y la ficha al pulsar. Los informes semanales de los directivos, en una sola línea y desactivables.
7. **Diagnóstico de rutas:** «¿Puede ir un tren de tipo X de A a B?» pinta en verde el camino o en rojo el primer tramo incompatible y dice el motivo: ancho, tensión, sin electrificar u obra.
8. **Leyenda de contexto** para la capa y la herramienta activas.
9. **Modo plano** para las obras: se dibujan, se ve el coste y la capacidad, y luego se encargan.
10. **Programas** con 2 activos de 4 por grupo y eficacia que crece semana a semana.
11. **Emergencias** que se aceptan o se rechazan, nota con letra e informe que cuadra **exactamente** con la multa aplicada. Crisis pasivas con varias salidas posibles.
12. **Premio anual** «Operador Ferroviario del Año», con un top 10 de operadores europeos parodiados.
13. **Partida nueva** con ficha de la región, dificultad Fácil-Extremo (dinero inicial y frecuencia de incidencias), reglas del modo libre por casillas con «seleccionar todo», y logros desactivados en modo libre.
14. **Tutorial con lista de comprobación** que se marca sola a partir del estado del motor, un «¿por qué no se marca?» y un botón para saltar el paso.
15. **Panel de gestión a la izquierda, ≤50 % de la pantalla**, con 2 niveles como máximo y el mapa siempre visible.
16. **Servicios con sus requisitos escritos debajo** y apagados con el motivo si falta algo.

**Lo que NO hay que copiar:**
- correos de spam o de informes que no se pueden quitar;
- interruptores escondidos sin aviso;
- fallos silenciosos (un arrastre que vuelve sin explicación);
- planificador automático que agrupa todo a la vez;
- negociación que se gana repitiendo;
- notas sin consecuencias visibles;
- información en cinco canales distintos;
- menús de construcción de tres niveles;
- informes que dicen «A, sin multa» mientras el motor te cobra 1,3 M.
