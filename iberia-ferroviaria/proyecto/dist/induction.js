// Primer turno: primero entender, después actuar y por último comprobar el resultado.
// Los cuestionarios son ensayos comentados: nunca modifican dinero ni reputación.
// Las acciones de servicio, personal, políticas e investigación sí usan las reglas del juego.
export const INDUCTION_STAGES = [
  {
    id: 'mandate', title: 'Un despacho, ocho servicios y demasiadas promesas',
    briefing: [
      {who: 'minister', mood: 'determined', text: 'A ver, director: antes de las fotos toca decidir qué vas a proteger.\n\nElige qué protegerás primero: la caja, la cobertura o ambas. Enero de 2022; soy Raquel Sanz y tú diriges la empresa. Después prepararemos una jornada real, decisión por decisión. La inauguración absurda puede esperar; yo tengo experiencia.'},
      {who: 'president', mood: 'proud', text: 'Pedro Sancho, presidente. Quiero trenes útiles y cuentas defendibles. La foto ya la pongo yo. Tu reto es decidir qué merece dinero y comprobar después si ha funcionado; prometerlo todo es mi especialidad, no la tuya.'},
      {who: 'treasury', mood: 'worried', text: 'Charo Tijera. La caja paga inversiones, pero las frecuencias y las políticas también generan costes cada mes. Una línea rentable puede financiar otra necesaria. Antes de tocar nada, elige qué vas a proteger en este primer turno.'},
    ],
    objective: 'Elige tu prioridad y lee qué sacrificas.',
    hint: 'Las tres prioridades son válidas. Este ensayo orienta tu estrategia; todavía no gasta ni cambia servicios.',
    choice: {
      prompt: 'Tienes recursos limitados. ¿Qué regla usarás para decidir?',
      options: [
        {id: 'balanced', correct: true, title: 'Caja y servicio juntos', text: 'Reforzar donde existe demanda y reservar recursos para las conexiones menos rentables.', feedback: 'Un buen punto de partida: una línea fuerte ayuda a sostener cobertura. Aun así, compara ocupación, beneficio y recursos; ningún criterio sustituye mirar los números.', effect: {}},
        {id: 'coverage', correct: true, title: 'Conectar antes que ganar', text: 'Priorizar ciudades sin servicio aunque el margen de esas líneas sea menor.', feedback: 'Es una estrategia legítima de servicio público. Necesita financiación: abrir cuesta 4 M€ y después hay operación mensual. No confundas una necesidad social con una inversión gratuita.', effect: {}},
        {id: 'margin', correct: true, title: 'Asegurar el margen', text: 'Concentrar el primer esfuerzo en relaciones que puedan mantener la caja.', feedback: 'Has elegido cuidar la caja; ahora toca mirar a quién dejas esperando.\n\nProtege las cuentas y permite invertir después. Su coste es político y territorial: las ciudades abandonadas siguen reclamando trenes y la confianza de sus representantes importa.', effect: {}},
      ],
    },
    debrief: [
      {who: 'rival', mood: 'happy', text: 'Tu prioridad está elegida; la caja sigue igual. Antes de abrir servicios, comprueba qué tren admite la vía. Soy Íñigo Asfalto, de Autocares Meseta: en mi familia vasca llamamos oportunidad a los viajeros que un iluminado deja sin tren.'},
    ],
  },
  {
    id: 'diagnosis', title: 'La vía decide qué tren cabe',
    briefing: [
      {who: 'adif', mood: 'determined', text: 'Baje al plano, director: Salamanca necesita ruedas compatibles, no otro discurso.\n\nAbre Madrid–Salamanca y lee «Qué puede circular». Consulta también sus anchos y electricidad. Soy Benito Balasto, Adif: un tren debe cumplir ambos requisitos en todo el recorrido. Pintar la línea de rojo no la convierte en alta velocidad, por mucho que vote el alcalde.'},
      {who: 'riders', mood: 'worried', text: 'Marisa Andén, viajeros. A Salamanca queremos llegar, no escuchar un discurso sobre el futuro. Si un servicio está cerrado, averigua si faltan trenes, horario o infraestructura. Son problemas distintos, aunque vuestra megafonía los llame «causas ajenas».'},
      {who: 'workshop', mood: 'determined', text: 'Fermín Bogie, talleres. El AVE tiene ancho estándar fijo y necesita catenaria. Un Alvia de ancho variable cambia en instalaciones preparadas. El S130 sigue necesitando electricidad; el S730 híbrido puede usar diésel. «Alvia» no significa magia, carajo.'},
    ],
    objective: 'Comprueba qué tren puede llegar a Salamanca.',
    hint: 'Lee «Qué puede circular» en Madrid–Salamanca. Consulta «Anchos» y «Electrificación» y responde al diagnóstico.',
    choice: {
      prompt: 'La relación combina ancho estándar e ibérico mediante un cambiador y dispone de catenaria. ¿Qué evita una obra innecesaria?',
      correct: 'variable',
      options: [
        {id: 'fixed', correct: false, title: 'Poner cualquier AVE', text: 'Como el primer tramo es de alta velocidad, el AVE puede hacer todo el viaje.', feedback: 'Has mirado sólo el primer tramo, lumbreras; el recorrido no acaba cuando te conviene.\n\nEl primer tramo no basta: el AVE de ancho fijo no puede seguir por vía ibérica. Debes comprobar el recorrido completo, incluidos los cambios de ancho.', effect: {}},
        {id: 'variable', correct: true, title: 'Asignar un Alvia eléctrico compatible', text: 'Usar un tren de ancho variable y el cambiador existente.', feedback: 'Exacto: el Alvia eléctrico puede aprovechar ambos anchos y la catenaria. Aún debes comprobar unidades disponibles y frecuencia antes de abrir. Has diagnosticado material, no comprado una obra.', effect: {}},
        {id: 'diesel', correct: false, title: 'El diésel resuelve el ancho', text: 'Asignar un tren por su motor, sin comprobar sus ruedas.', feedback: 'Está mezclando el motor con las ruedas; vamos a deshacer esa chapuza.\n\nEl motor y el ancho son requisitos independientes. El S730 funciona aquí porque también es de ancho variable, no porque queme diésel. Reserva su capacidad híbrida para recorridos donde hace falta.', effect: {}},
      ],
    },
    debrief: [
      {who: 'mayor', mood: 'surprised', text: 'Salamanca admite un Alvia eléctrico mediante el cambiador existente: no necesita una obra para empezar. Soy Paco Terruño, alcalde. Antes de prometer otro túnel, asigne un tren compatible. Nos ahorraríamos veinte años y una colección de ministros con tijeras.'},
    ],
  },
  {
    id: 'offer', title: 'València: una salida más no se paga sola',
    briefing: [
      {who: 'treasury', mood: 'determined', text: 'Vamos con València: las salidas extra también pasan por mi calculadora.\n\nEn Madrid–València, aumenta al menos una salida por sentido y cambia la tarifa. Mira beneficio, ocupación y unidades antes de aplicar el plan. Más trenes cuestan dinero; rebajar billetes a ciegas no es gestión, es subvencionar tu propia ocurrencia.'},
      {who: 'rival', mood: 'proud', text: 'En Madrid–València mi autobús también vende billetes. Más frecuencia te hace atractivo; una tarifa menor también. Pero si añades trenes vacíos y regalas el billete, no me derrotas: te haces mi becario financiero.'},
      {who: 'riders', mood: 'angry', text: 'No queremos doce trenes saliendo a la misma hora ni un precio de atraco. Ajusta la oferta pensando en quién viaja. Un tren lleno no siempre pide una rebaja; a veces pide otra salida y menos codazos.'},
    ],
    objective: 'Aplica más salidas y una tarifa nueva en València.',
    hint: 'Ajusta «Salidas por sentido» y «Tarifa», revisa la previsión y aplica el plan. Mover los controles todavía no cambia el servicio.',
    debrief: [
      {who: 'minister', mood: 'proud', text: 'El nuevo plan está aplicado. Has cambiado ingresos previstos, costes y trenes necesarios; comprueba el resultado al circular. La previsión orienta, no garantiza beneficios. Ahora revisa el personal: los trenes no los conduce mi gabinete, aunque algunos se crean capaces.'},
    ],
  },
  {
    id: 'people', title: 'Maquinistas: calcula antes de contratar',
    briefing: [
      {who: 'workshop', mood: 'worried', text: 'A ver, chaval: una cabina no se rellena a golpe de contrato.\n\nCompara maquinistas disponibles y necesarios. Hoy sobra cobertura: no necesitas contratar. Si una ampliación supera la reserva, forma personal tres meses antes. Contratar veinte cuesta 0,3 M€; puedes probarlo, pero contratar porque sí sería una gilipollez con nómina.'},
      {who: 'president', mood: 'determined', text: 'Director, el calendario de personal también manda; mis promesas ya tienen otro departamento.\n\nSi amplías dentro de tres meses, planifica hoy. Los alumnos no conducen mañana: prometer horarios antes de disponer de personal produce cancelaciones. Las promesas sin recursos me las dejas a mí, que llevo más años practicando.'},
      {who: 'mayor', mood: 'angry', text: 'Oiga, estamos contando trenes y conductores, no promesas del ministerio.\n\nPues apunte el plazo y mire también la flota. A mi pueblo no le vale un horario de mentira. Puede tener cien conductores y ningún tren libre, o cien trenes y nadie que los conduzca. Dos formas caras de hacer el imbécil.'},
    ],
    objective: 'Comprueba la cobertura y planifica la formación.',
    hint: 'Compara disponibles, necesarios y alumnos; responde cuándo formarías a quien falte. Contratar veinte es opcional: cuesta 0,3 M€ y tarda tres meses.',
    choice: {
      prompt: 'Si quieres ampliar la oferta al comenzar el cuarto mes, ¿cómo preparas el personal?',
      correct: 'pipeline',
      options: [
        {id: 'instant', correct: false, title: 'Contratar el día anterior', text: 'Los nuevos contratos cubrirán las salidas inmediatamente.', feedback: 'A ver, chaval: el contrato no conduce ni con mucha fe.\n\nLa contratación abre formación, no una cabina lista. El plazo es de tres meses; ampliar sin cobertura provoca cancelaciones aunque tengas trenes y dinero.', effect: {}},
        {id: 'pipeline', correct: true, title: 'Formar con tres meses de antelación', text: 'Preparar el personal que falte y comprobar recursos antes de ampliar.', feedback: 'Ese es el orden: demanda prevista, unidades, personal y fecha de apertura. Si tu reserva ya cubre la ampliación, no necesitas contratar. Si faltan maquinistas, calcula cuántos, el plazo de formación y sus costes recurrentes.', effect: {}},
        {id: 'all', correct: false, title: 'Contratar lo máximo siempre', text: 'Una plantilla enorme eliminará todos los límites de crecimiento.', feedback: 'Una reserva se calcula; contratar a lo bestia sólo luce en la nómina.\n\nLa plantilla extra cobra cada mes y no crea trenes ni electrifica vías. Una reserva razonable ayuda; una contratación masiva sin plan reduce el dinero disponible para resolver otros límites.', effect: {}},
      ],
    },
    debrief: [
      {who: 'treasury', mood: 'worried', text: 'Mantener la reserva actual cubre estos servicios. Si contrataste alumnos, estarán disponibles en tres meses y sumarán costes mensuales. La regla es cubrir lo que falta con antelación. Una plantilla enorme sin plan solo me da más gastos que recortar.'},
    ],
  },
  {
    id: 'competition', title: 'Elegir una ventaja también cuesta',
    briefing: [
      {who: 'successor', mood: 'determined', text: 'Antes de comprar otra ocurrencia, vamos a separar sus costes y sus plazos.\n\nCompara competencia, políticas e investigación antes de gastar. Soy Óscar del Puente, hoy alcalde consultado. Una política actúa ya y cobra cada mes; una investigación paga ahora y tarda. Puedes conservar la caja: no te obligaré a comprar otro PowerPoint con siglas.'},
      {who: 'rival', mood: 'determined', text: 'Vamos con la competencia: comprueba que el enemigo está allí antes de declararle una guerra.\n\nAbre «Competencia» y compara una relación donde ya haya rival ferroviario. OuiOui aprieta precios; YaIré vende calidad. En 2022 no han entrado todos en todas partes. No rebajes toda tu red para responder a un enemigo que todavía no está.'},
      {who: 'minister', mood: 'determined', text: 'Ahora vienen los inventos; financiar una idea no la convierte en servicio mañana.\n\nDespués abre «Investigación». Venta online cuesta diez millones y tarda cuatro meses; ERTMS, treinta y cinco y doce meses. La primera atrae demanda; la segunda mejora tiempos y puntualidad. Puedes financiar un proyecto o esperar. Solo cabe una investigación en curso.'},
    ],
    objective: 'Compara alternativas e invierte o conserva caja.',
    hint: 'Consulta «Competencia», «Personal y políticas» e «Investigación». Después activa una medida, financia un proyecto o elige «Conservar caja».',
    debrief: [
      {who: 'successor', mood: 'surprised', text: 'Ya has comparado coste, efecto y plazo. Invierte cuando resuelva un problema concreto; esperar también es una decisión. El wifi no arregla la catenaria y ERTMS no cambia el ancho. Las siglas son ingeniería, no un conjuro para tapar chapuzas.'},
    ],
  },
  {
    id: 'infrastructure', title: 'Abrir Salamanca y presupuestar Soria',
    briefing: [
      {who: 'mayor', mood: 'worried', text: 'Oiga, quiero distinguir el tren de hoy de la excavadora de mañana.\n\nAbra Salamanca con un Alvia compatible y consulte cuánto cuesta electrificar Torralba–Soria. No adjudique esa obra todavía: basta leer precio y plazo. Quiero un tren útil hoy y un presupuesto para mañana, no otra excavadora contratada para la foto.'},
      {who: 'adif', mood: 'determined', text: 'Tenemos dos encargos, director: prestar un servicio y poner precio a la obra.\n\nAhora usa tu diagnóstico: abre Madrid–Salamanca con un Alvia compatible. Luego inspecciona la falta de catenaria del ramal hacia Soria y pide presupuesto de electrificación. Son dos encargos distintos: operar hoy y preparar una inversión para mañana.'},
      {who: 'workshop', mood: 'angry', text: 'Vamos a Salamanca, chaval; antes de prometer horarios, mira qué tienes en la flota.\n\nPara Salamanca comprueba el lote y sus unidades libres; abrir cuesta cuatro millones. Para una vía sin catenaria solo sirve hoy nuestro Alvia híbrido S730, si también cumple el ancho. Un S130 eléctrico no vive de buenas intenciones, coño.'},
    ],
    objective: 'Abre Salamanca y presupuesta la catenaria de Soria.',
    hint: 'Abre Salamanca con el Alvia compatible. Consulta el presupuesto de Soria; leerlo no adjudica la obra.',
    choice: {
      prompt: 'Un tramo es de ancho ibérico y no tiene catenaria. ¿Qué resuelve únicamente electrificarlo?',
      correct: 'power',
      options: [
        {id: 'ave', correct: false, title: 'Lo convierte en una vía para AVE', text: 'Al recibir electricidad ya cumple todos los requisitos.', feedback: 'Oiga, ha mezclado enchufes y ruedas; vamos por partes.\n\nLa catenaria resuelve la alimentación, no el ancho. El AVE sigue necesitando ancho estándar o mixto en todo su recorrido, además de electricidad.', effect: {}},
        {id: 'power', correct: true, title: 'Permite usar material eléctrico compatible con el ancho', text: 'El ancho sigue siendo ibérico; el requisito de energía cambia.', feedback: 'Correcto: electrificar no cambia las ruedas ni el ancho. Un Alvia eléctrico puede aprovechar la obra si el recorrido y los cambiadores también son compatibles.', effect: {}},
        {id: 'speed', correct: false, title: 'Garantiza alta velocidad automáticamente', text: 'Todos los trenes podrán circular a 300 km/h.', feedback: 'Oiga, ese tren corre lo que permitan la vía y el material, no su discurso.\n\nNi la catenaria ni cambiar el ancho garantizan 300 kilómetros por hora. La velocidad depende del trazado, los límites de infraestructura y el material. Una renovación tiene su propio efecto y presupuesto.', effect: {}},
      ],
    },
    debrief: [
      {who: 'riders', mood: 'happy', text: 'Salamanca tiene servicio; Soria, un presupuesto que puedes comparar. Electrificar permitiría material eléctrico compatible, pero conservaría el ancho ibérico. Has separado abrir trenes de construir vías. Mucho más útil que prometer un AVE en una carretera, como ciertos lumbreras.'},
    ],
  },
  {
    id: 'incident', title: 'El plan encuentra la primera avería',
    briefing: [
      {who: 'workshop', mood: 'worried', text: 'A ver, que la jornada también trae averías; elija qué problema quiere reducir.\n\nComienza la jornada y atiende la avería. El equipo cuesta 18.000 euros y reduce la demora; el autobús cuesta 9.000 y protege al viajero; esperar ahorra ahora y conserva el retraso. Elige qué importa más. La avería no se arregla soplando, coño.'},
      {who: 'adif', mood: 'determined', text: 'Aquí se pagan efectos distintos: reducir demora y cuidar al viajero.\n\nMovilizar el equipo reduce la demora al treinta por ciento y cuesta 18.000 euros. El plan alternativo cuesta 9.000 y protege la satisfacción; esperar evita el pago inmediato y conserva toda la demora. Son efectos distintos, no tres botones decorativos.'},
      {who: 'successor', mood: 'angry', text: 'Con una incidencia delante, primero se lee el parte; después se presume.\n\nPon pausa si hace falta, decide y reanuda. Primero confirma qué ocurre y a qué circulación afecta. Después elige: puntualidad, atención al viajero o caja. Si contestas «todo controlado» sin leer el parte, te bloqueo yo antes de que lo hagan los pasajeros.'},
    ],
    objective: 'Comienza la jornada y resuelve la avería.',
    hint: 'Pulsa «Comenzar jornada». En la incidencia, compara coste y efecto de las respuestas y elige una. Puedes pausar el reloj para decidir.',
    debrief: [
      {who: 'president', mood: 'surprised', text: 'La respuesta ya está aplicada: has cambiado la demora o la atención al viajero, o has aceptado el retraso. Revisa el parte para comprobarlo. Una consecuencia medida vale más que decir «todo controlado»; esa frase ya la rellena mi gabinete.'},
    ],
  },
  {
    id: 'review', title: 'Cerrar el día sin perder el mes de vista',
    briefing: [
      {who: 'riders', mood: 'determined', text: '¡Oye, director, que el día termina con un parte, no con otra excusa!\n\nTermina la jornada, lee viajeros, ingresos y puntualidad en el parte y pasa al día siguiente. Es un resultado diario; las cuentas completas se liquidan al cerrar el mes. Mira qué mejoró y qué falló, que nosotros no vivimos de vuestros titulares.'},
      {who: 'treasury', mood: 'worried', text: 'Hay una cuenta para el día y otra para el mes; no las mezcles, lumbreras.\n\nCada jornada avanza un día. Al cerrar el mes llegan el balance, las entregas, las obras, la formación y la investigación que hayan vencido. Si contrataste alumnos, seguirán esperando su plazo: terminar hoy no lo convierte en tres meses.'},
      {who: 'mayor', mood: 'determined', text: 'Oiga, antes de cerrar el día quiero saber qué ha mejorado de verdad.\n\nAntes de pasar a la siguiente jornada, mira si tu refuerzo ayudó y qué quedó pendiente. Si hay un pico de demanda, puede pedir más frecuencia dentro de un plazo. Los viajeros no te premian por haber pulsado un botón; te premian por llegar.'},
    ],
    objective: 'Lee el parte y pasa al siguiente día.',
    hint: 'Pulsa «Hasta el último tren», consulta el parte y elige «Siguiente jornada». Un día no completa los plazos mensuales.',
    debrief: [
      {who: 'adif', mood: 'proud', text: 'Ya has preparado, ejecutado y comprobado un turno. Usa el siguiente para corregir la oferta; los plazos siguen avanzando con el calendario. Las obras no terminan porque el alcalde proteste tres veces. Lo he comprobado: protesta muchísimo y siguen ahí.'},
    ],
  },
  {
    id: 'handoff', title: 'Tu primer compromiso con fecha de entrega',
    briefing: [
      {who: 'president', mood: 'determined', text: 'Llega la hora de firmar, director; la foto sola no cobra el premio.\n\nLee el encargo de Agenda y acepta la rama que puedas cumplir. Servicio público exige menos; la apuesta comercial paga más y exige un 25 % adicional. El plazo es de dieciocho meses. El premio llega al cumplir, no al prometer; una crueldad que en política evitamos.'},
      {who: 'minister', mood: 'worried', text: 'Vamos con el premio: hay dos ramas y ninguna paga por posar.\n\nServicio público paga dieciocho millones si cumples y favorece a Territorio. La apuesta comercial paga veintiséis, exige un veinticinco por ciento más y favorece a Hacienda. El premio se cobra al cumplir; el botón de aceptar no imprime billetes.'},
      {who: 'successor', mood: 'proud', text: 'Director, con el primer encargo empieza el trabajo de verdad.\n\nAcepta la rama que puedas sostener, con un plan que use oferta, personal e inversiones. Luego el mando es tuyo. Los rivales cambiarán precios, las ciudades pedirán servicios y llegarán decisiones nuevas. Gobernar exige revisar, no resolver una lista una sola vez.'},
    ],
    objective: 'Elige y acepta tu primer encargo.',
    hint: 'Lee objetivo, plazo y penalización. Decide entre «Servicio público» y «Apuesta comercial» y acepta la rama real del encargo.',
    choice: {
      prompt: 'Con el encargo firmado, ¿qué estrategia puedes sostener?',
      options: [
        {id: 'public', correct: true, title: 'Servicio público', text: 'Objetivo de partida, premio de 18 M€ y apoyo de Territorio.', feedback: 'Ya ha firmado servicio público; ahora vienen los viajeros y el calendario.\n\nEs el compromiso más accesible de las dos ramas. El apoyo territorial también tiene valor: no solo importa el premio. Tu firma ya está en el encargo. Ahora cumple el objetivo dentro del plazo: el premio llega al terminar, no al prometer.', effect: {}},
        {id: 'commercial', correct: true, title: 'Apuesta comercial', text: 'Objetivo un 25 % mayor, premio de 26 M€ y apoyo de Hacienda.', feedback: 'Ya ha firmado la apuesta comercial; el premio grande exige trabajo grande.\n\nOfrece un premio mayor a cambio de exigir más dentro del mismo plazo. El encargo ya está firmado. Comprueba que la capacidad, la demanda y tu caja sostienen el esfuerzo antes de gastar para cumplirlo.', effect: {}},
      ],
    },
    debrief: [
      {who: 'rival', mood: 'determined', text: 'El encargo tiene fecha y tu plan sigue en la partida. Revisa demanda, recursos y confianza antes de ampliar. Nos veremos en los precios y en los titulares. Procura que el siguiente viajero me elija por gusto, no porque un señor con despacho haya olvidado poner su tren.'},
    ],
  },
];

// También permite incluir toda la inducción en el catálogo de voces y verificar el reparto.
export const inductionLines = () => INDUCTION_STAGES.flatMap(stage => [...stage.briefing, ...stage.debrief]);
