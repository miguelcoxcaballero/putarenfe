// Whole messages spoken by the existing cast. Technical figures remain separate from dialogue bodies.
import {EVENTS} from './conexiones.js';
export const STATIC_MESSAGES={
  "breakdown-alert": {
    "person": "adif",
    "text": "Tren parado en plena vía: avería de material. El viajero espera una solución y el reloj no se para.",
    "kind": "aviso",
    "mood": "worried"
  },
  "breakdown-aume": {
    "person": "rival",
    "text": "Jajaja. ¿Otro tren tirado, compañero? Tranquilo, que para eso está Autocares Meseta. Mis autocares ya van a recoger a tus viajeros. La factura te la mando al despacho, y a cada uno le doy una tarjeta, por si se cansan de esperar trenes.",
    "kind": "aviso",
    "mood": "proud"
  },
  "breakdown-abandon": {
    "person": "riders",
    "text": "Le habla Marisa Andén. Trescientas personas en mitad del campo, sin tren, sin autobús y sin noticias. Esto no se olvida: ni en la encuesta ni en las urnas.",
    "kind": "aviso",
    "mood": "angry"
  },
  "breakdown-ownbus": {
    "person": "workshop",
    "text": "Autobuses de la casa en camino. Los viajeros llegan por carretera y el tren, al taller. Al menos esta vez no le hemos dado el gusto al de los autocares.",
    "kind": "aviso",
    "mood": "determined"
  },
  "guide-welcome": {
    "person": "minister",
    "text": "Esta es tu compañía: las vías, los trenes y las cuentas que vas a transformar. Aquí tienes el objetivo de tu mandato y una propuesta para tu siguiente jugada.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-network": {
    "person": "adif",
    "text": "Esta es la misma Red que usarás durante toda la partida. Pulsa Madrid — València para abrir su ficha y preparar tu primera mejora.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-offer": {
    "person": "treasury",
    "text": "En el plan de servicio, añade una salida por sentido y cambia la tarifa. La previsión muestra el coste y los trenes necesarios; pulsa «Aplicar plan» cuando te convenza.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-decisions": {
    "person": "president",
    "text": "El consejo trabaja aquí, en tu Despacho. Lee cada propuesta y elige la opción que quieras sostener: sus efectos se aplican a esta misma compañía.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-people": {
    "person": "workshop",
    "text": "Compara los disponibles con los necesarios antes de ampliar. Formar personal tarda tres turnos; contratar es opcional si la reserva ya cubre tu oferta.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-research": {
    "person": "successor",
    "text": "Este es tu laboratorio real. Compara las investigaciones ilustradas y sus requisitos. La innovación llega jugando; puedes investigar o reservarla para después.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-infrastructure": {
    "person": "mayor",
    "text": "Salamanca admite un Alvia compatible por la vía existente. Elige material con unidades libres, revisa la previsión y abre el servicio: cuesta 4 M€.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-day": {
    "person": "riders",
    "text": "Comienza la jornada. Atiende la avería en Red → Jornada, avanza hasta el último tren y consulta el parte. Después prepara el día siguiente.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-handoff": {
    "person": "president",
    "text": "Esta es tu Agenda. Compara objetivo, premio y plazo; acepta el encargo que puedas cumplir. La guía termina y el compromiso sigue en tu partida.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-day-review": {
    "person": "riders",
    "text": "Este es el parte real del día. Revisa qué pasó y pulsa «Siguiente jornada» para preparar el próximo turno.",
    "kind": "guía",
    "mood": "determined"
  },
  "guide-day-running": {
    "person": "riders",
    "text": "Esta es una incidencia de tu jornada. Compara las respuestas y decide cuánto invertir en resolverla.",
    "kind": "guía",
    "mood": "worried"
  },
  "guide-day-resolved": {
    "person": "riders",
    "text": "La respuesta ya está aplicada. Pulsa «Hasta el último tren» para comprobar cómo terminó la jornada.",
    "kind": "guía",
    "mood": "determined"
  },
  "welcome": {
    "person": "minister",
    "text": "Recibes una red a medio gas. Conecta ciudades, decide qué promesas cumplir y haz que cada tren merezca el viaje. Cinco retos y dos mandatos: elige tu primera jugada.",
    "kind": "bienvenida",
    "mood": "determined"
  },
  "welcome-resume": {
    "person": "minister",
    "text": "Tu red, tus trenes y tus compromisos siguen aquí. Revisa el objetivo y elige tu próxima jugada.",
    "kind": "bienvenida",
    "mood": "determined"
  },
  "voice-error": {
    "person": "minister",
    "text": "No se ha podido reproducir la voz. Puedes seguir leyendo el diálogo o volver a escucharlo.",
    "kind": "aviso",
    "mood": "determined"
  },
  "saved": {
    "person": "minister",
    "text": "Partida guardada en este navegador.",
    "kind": "aviso",
    "mood": "determined"
  },
  "save-error": {
    "person": "minister",
    "text": "El navegador no permite guardar aquí. Exporta la partida.",
    "kind": "aviso",
    "mood": "determined"
  },
  "guide-paused": {
    "person": "minister",
    "text": "Guía en pausa. Puedes retomarla desde Ayuda.",
    "kind": "aviso",
    "mood": "determined"
  },
  "guide-done": {
    "person": "president",
    "text": "El mando es tuyo. Tu red y tu primer encargo siguen en marcha.",
    "kind": "aviso",
    "mood": "determined"
  },
  "line-origin": {
    "person": "adif",
    "text": "Origen elegido. Pulsa la ciudad de destino.",
    "kind": "aviso",
    "mood": "determined"
  },
  "line-other": {
    "person": "adif",
    "text": "Elige otra ciudad para el destino.",
    "kind": "aviso",
    "mood": "determined"
  },
  "ended": {
    "person": "president",
    "text": "Tu mandato ha terminado.",
    "kind": "aviso",
    "mood": "determined"
  },
  "event-pending": {
    "person": "minister",
    "text": "Resuelve el suceso antes de iniciar otra jornada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "no-legacy": {
    "person": "minister",
    "text": "No hay un rescate anterior válido guardado.",
    "kind": "aviso",
    "mood": "determined"
  },
  "guide-close": {
    "person": "minister",
    "text": "Termina el primer turno o páusalo antes de delegar el mes.",
    "kind": "aviso",
    "mood": "determined"
  },
  "guide-incident": {
    "person": "workshop",
    "text": "Atiende la avería antes de cerrar esta jornada de iniciación.",
    "kind": "aviso",
    "mood": "determined"
  },
  "legacy-restored": {
    "person": "minister",
    "text": "Partida recuperada. El original sigue guardado.",
    "kind": "aviso",
    "mood": "determined"
  },
  "event-choose": {
    "person": "minister",
    "text": "Elige cómo resolver el suceso del turno.",
    "kind": "aviso",
    "mood": "determined"
  },
  "cash-held": {
    "person": "treasury",
    "text": "Caja conservada. Podrás financiar proyectos cuando hayas comprobado el margen.",
    "kind": "aviso",
    "mood": "determined"
  },
  "line-map": {
    "person": "adif",
    "text": "Pulsa dos ciudades del mapa para trazar la línea. Escape cancela.",
    "kind": "aviso",
    "mood": "determined"
  },
  "exported": {
    "person": "minister",
    "text": "Partida exportada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "imported": {
    "person": "minister",
    "text": "Partida importada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "event-applied": {
    "person": "minister",
    "text": "Decisión aplicada a tu compañía.",
    "kind": "aviso",
    "mood": "determined"
  },
  "research-funded": {
    "person": "successor",
    "text": "Investigación financiada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "track-funded": {
    "person": "adif",
    "text": "Mejora adjudicada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "contract-accepted": {
    "person": "president",
    "text": "Compromiso aceptado. Revisa los requisitos y su fecha límite en la agenda.",
    "kind": "aviso",
    "mood": "determined"
  },
  "funds-received": {
    "person": "treasury",
    "text": "Financiación recibida.",
    "kind": "aviso",
    "mood": "determined"
  },
  "pact-signed": {
    "person": "president",
    "text": "Pacto firmado. Cumple los requisitos antes del plazo.",
    "kind": "aviso",
    "mood": "determined"
  },
  "phase-funded": {
    "person": "adif",
    "text": "Fase encargada. Puedes gestionar tu red mientras avanza.",
    "kind": "aviso",
    "mood": "determined"
  },
  "shortcut-signed": {
    "person": "treasury",
    "text": "Adjudicación firmada. La inspección revisará el expediente.",
    "kind": "aviso",
    "mood": "determined"
  },
  "money-returned": {
    "person": "treasury",
    "text": "Fondos restituidos.",
    "kind": "aviso",
    "mood": "determined"
  },
  "legal-review": {
    "person": "treasury",
    "text": "Revisión jurídica encargada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "chapter-funded": {
    "person": "treasury",
    "text": "Financiación recibida. Tu siguiente etapa está preparada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "station-upgraded": {
    "person": "mayor",
    "text": "Estación mejorada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "work-funded": {
    "person": "adif",
    "text": "Obra adjudicada. Ya hay máquinas en la vía.",
    "kind": "aviso",
    "mood": "determined"
  },
  "service-created": {
    "person": "adif",
    "text": "Relación creada. Ahora ponle trenes.",
    "kind": "aviso",
    "mood": "determined"
  },
  "service-closed": {
    "person": "riders",
    "text": "Servicio suspendido. El material queda libre.",
    "kind": "aviso",
    "mood": "determined"
  },
  "upgrade-funded": {
    "person": "adif",
    "text": "Mejora contratada. Termina en cuatro meses.",
    "kind": "aviso",
    "mood": "determined"
  },
  "refit-started": {
    "person": "workshop",
    "text": "Material enviado al taller.",
    "kind": "aviso",
    "mood": "determined"
  },
  "refit-started-legacy": {
    "person": "workshop",
    "text": "Material enviado a reforma.",
    "kind": "aviso",
    "mood": "determined"
  },
  "sold": {
    "person": "treasury",
    "text": "Venta completada.",
    "kind": "aviso",
    "mood": "determined"
  },
  "bought-used": {
    "person": "workshop",
    "text": "Compra completada. Los trenes ya están en tu parque.",
    "kind": "aviso",
    "mood": "determined"
  },
  "bought-new": {
    "person": "workshop",
    "text": "Pedido firmado. Revisa el envío en Mis compras.",
    "kind": "aviso",
    "mood": "determined"
  },
  "project-funded": {
    "person": "adif",
    "text": "Obra adjudicada. Ahora a esperar.",
    "kind": "aviso",
    "mood": "determined"
  },
  "line-funded": {
    "person": "adif",
    "text": "Línea adjudicada. Nos vemos en la inauguración.",
    "kind": "aviso",
    "mood": "determined"
  },
  "loan": {
    "person": "treasury",
    "text": "Financiación de 100 M€ recibida.",
    "kind": "aviso",
    "mood": "determined"
  },
  "repaid": {
    "person": "treasury",
    "text": "100 M€ amortizados.",
    "kind": "aviso",
    "mood": "determined"
  },
  "service-updated": {
    "person": "riders",
    "text": "Plan de servicio actualizado.",
    "kind": "aviso",
    "mood": "determined"
  },
  "response-team": {
    "person": "workshop",
    "text": "Reduce la demora al 30 %.",
    "kind": "aviso",
    "mood": "determined"
  },
  "response-bus": {
    "person": "riders",
    "text": "Mantiene la demora, pero protege la satisfacción del viajero.",
    "kind": "aviso",
    "mood": "determined"
  },
  "response-wait": {
    "person": "adif",
    "text": "Sin coste inmediato.",
    "kind": "aviso",
    "mood": "determined"
  },
  "turn-closed": {
    "person": "treasury",
    "text": "Turno cerrado. Cuentas liquidadas.",
    "kind": "aviso",
    "mood": "determined"
  },
  "month-closed": {
    "person": "treasury",
    "text": "Mes cerrado. Cuentas liquidadas.",
    "kind": "aviso",
    "mood": "determined"
  },
  "finance-result": {
    "person": "treasury",
    "text": "He actualizado las cuentas. Aquí tienes el importe y las condiciones de la operación.",
    "kind": "novedad",
    "mood": "determined"
  },
  "service-result": {
    "person": "riders",
    "text": "El cambio en el servicio está preparado. Revisa aquí las salidas y los trenes disponibles.",
    "kind": "novedad",
    "mood": "determined"
  },
  "training-result": {
    "person": "workshop",
    "text": "Los nuevos maquinistas están en formación. Aquí tienes cuántos se incorporan y cuándo estarán listos.",
    "kind": "novedad",
    "mood": "determined"
  },
  "research-result": {
    "person": "successor",
    "text": "La investigación tiene financiación. Puedes seguir su avance y consultar la fecha prevista.",
    "kind": "novedad",
    "mood": "determined"
  },
  "policy-result": {
    "person": "president",
    "text": "La política de la compañía ha cambiado. Aquí tienes la medida que acabas de aplicar.",
    "kind": "novedad",
    "mood": "determined"
  },
  "request-started": {
    "person": "mayor",
    "text": "El compromiso con el territorio está en marcha. Mantén el servicio durante el plazo acordado para cobrar el premio.",
    "kind": "novedad",
    "mood": "determined"
  },
  "request-lost": {
    "person": "mayor",
    "text": "No hemos mantenido el servicio acordado. El territorio pierde la promesa y la compañía, el premio.",
    "kind": "novedad",
    "mood": "determined"
  },
  "surge-success": {
    "person": "riders",
    "text": "El refuerzo ha llegado a tiempo. Hemos atendido a los viajeros y la compañía recibe una bonificación.",
    "kind": "novedad",
    "mood": "determined"
  },
  "surge-alert": {
    "person": "riders",
    "text": "Necesitamos un refuerzo de trenes. Revisa esta ciudad en el mapa y prepara el servicio antes de que pase la oportunidad.",
    "kind": "novedad",
    "mood": "determined"
  },
  "incident-alert": {
    "person": "workshop",
    "text": "Tenemos una incidencia en la jornada. Revisa el tren afectado y elige cómo vamos a resolverla.",
    "kind": "novedad",
    "mood": "determined"
  },
  "real-timetable": {
    "person": "adif",
    "text": "Estás observando el horario real. Puedes mirar los trenes y recorrer la red sin gastar dinero de tu compañía.",
    "kind": "novedad",
    "mood": "determined"
  },
  "error-money": {
    "person": "treasury",
    "text": "No puedo aprobar esta operación con la caja disponible. Revisa el coste y nuestras cuentas.",
    "kind": "aviso",
    "mood": "worried"
  },
  "error-fleet": {
    "person": "workshop",
    "text": "No tengo el material necesario para esta operación. Revisa las unidades libres y su compatibilidad.",
    "kind": "aviso",
    "mood": "worried"
  },
  "error-network": {
    "person": "adif",
    "text": "Hay un problema con la infraestructura o el recorrido. Revisa el detalle antes de dar salida al tren.",
    "kind": "aviso",
    "mood": "worried"
  },
  "error-invalid": {
    "person": "minister",
    "text": "Esta operación necesita una corrección. Te dejo el motivo para que puedas resolverlo y volver a intentarlo.",
    "kind": "aviso",
    "mood": "worried"
  },
  "error-save": {
    "person": "minister",
    "text": "No he podido recuperar esa partida. Revisa el archivo y conserva tu copia antes de volver a intentarlo.",
    "kind": "aviso",
    "mood": "worried"
  },
  "day-report": {
    "person": "riders",
    "text": "El último tren ha llegado. Este es el parte de la jornada: puntualidad, viajeros e incidencias. Comprueba qué ha funcionado antes de preparar el siguiente día.",
    "kind": "informe",
    "mood": "determined"
  },
  "turn-report": {
    "person": "treasury",
    "text": "He cerrado las cuentas del turno. Aquí tienes el resultado de la operación, la caja y los avances de tu compañía.",
    "kind": "informe",
    "mood": "determined"
  },
  "research-finished": {
    "person": "successor",
    "text": "La investigación ha terminado. Su mejora ya está aplicada a nuestra red.",
    "kind": "novedad",
    "mood": "determined"
  },
  "phase-finished": {
    "person": "adif",
    "text": "La cuadrilla ha terminado esta fase. Revisa el proyecto y prepara el siguiente paso.",
    "kind": "novedad",
    "mood": "determined"
  },
  "project-finished": {
    "person": "adif",
    "text": "El megaproyecto ya está en servicio. Su mejora empieza a contar en la operación de la red.",
    "kind": "novedad",
    "mood": "determined"
  },
  "pact-won": {
    "person": "president",
    "text": "Hemos cumplido el pacto. La compañía recibe el premio y el consejo reconoce el compromiso.",
    "kind": "novedad",
    "mood": "determined"
  },
  "pact-lost": {
    "person": "president",
    "text": "No hemos cumplido el pacto. Hay que asumir las consecuencias y revisar qué podemos prometer.",
    "kind": "novedad",
    "mood": "determined"
  },
  "milestone": {
    "person": "riders",
    "text": "Cada vez viaja más gente con nosotros. Este hito aporta financiación e innovación para seguir mejorando la red.",
    "kind": "novedad",
    "mood": "determined"
  },
  "challenge-won": {
    "person": "minister",
    "text": "Hemos cumplido otro objetivo del mandato. Revisa el premio y el siguiente reto de la compañía.",
    "kind": "novedad",
    "mood": "determined"
  },
  "election-won": {
    "person": "president",
    "text": "Las urnas renuevan nuestro mandato. Tenemos otra oportunidad para hacer que el país llegue.",
    "kind": "novedad",
    "mood": "determined"
  },
  "election-lost": {
    "person": "president",
    "text": "Las urnas piden un cambio. Revisa los resultados y escucha lo que necesita la red.",
    "kind": "novedad",
    "mood": "determined"
  },
  "victory": {
    "person": "president",
    "text": "Has completado los cinco retos y ganado dos mandatos. La red que dejas merece continuar. Puedes seguir jugando y ampliándola.",
    "kind": "novedad",
    "mood": "determined"
  },
  "defeat": {
    "person": "minister",
    "text": "Otro consejo toma el mando. Tu red y tus informes siguen disponibles para revisar la estrategia y volver a intentarlo.",
    "kind": "novedad",
    "mood": "determined"
  },
  "scandal-open": {
    "person": "treasury",
    "text": "El expediente ha salido a la luz. Los fondos irregulares cuestan apoyo y tendremos que responder por ellos.",
    "kind": "novedad",
    "mood": "determined"
  },
  "scandal-sentence": {
    "person": "treasury",
    "text": "Ha llegado la sentencia. Debemos devolver los fondos y pagar la multa. Aquí tienes el importe y sus consecuencias.",
    "kind": "novedad",
    "mood": "determined"
  },
  "shortcut-info": {
    "person": "treasury",
    "text": "Esta financiación deja un expediente. Habrá una inspección y, después, restitución y multa. Revisa los importes y los plazos antes de aceptar.",
    "kind": "novedad",
    "mood": "determined"
  },
  "save-info": {
    "person": "minister",
    "text": "La partida se guarda en este navegador. Exporta una copia para llevarla a otro equipo o importa una partida que ya tengas.",
    "kind": "novedad",
    "mood": "determined"
  },
  "help-info": {
    "person": "minister",
    "text": "Conecta ciudades, prepara vías compatibles y compra material en Trenes Pop. Resuelve los sucesos y cierra el turno jugando una jornada o delegando su operación. Cinco retos y dos mandatos completan la partida.",
    "kind": "novedad",
    "mood": "determined"
  },
  "refit-info": {
    "person": "workshop",
    "text": "Compara el interior actual con la reforma. Elige unidades libres y revisa el coste antes de enviarlas al taller. Volverán renovadas tras cinco turnos.",
    "kind": "novedad",
    "mood": "determined"
  },
  "track-info": {
    "person": "adif",
    "text": "Compara la vía actual y la mejora propuesta. El ancho, la catenaria y el número de vías cambian lo que puede circular. Revisa el corte, el coste y el plazo antes de adjudicar.",
    "kind": "novedad",
    "mood": "determined"
  },
  "purchase-info": {
    "person": "workshop",
    "text": "Antes de comprar, comprueba el ancho, la tracción y las plazas del tren. Revisa el precio, las unidades y las condiciones de entrega en Trenes Pop.",
    "kind": "novedad",
    "mood": "determined"
  },
  "line-info": {
    "person": "adif",
    "text": "Traza la nueva línea entre dos ciudades. Revisa su longitud, su coste y el plazo de obra antes de adjudicarla.",
    "kind": "novedad",
    "mood": "determined"
  },
  "service-info": {
    "person": "adif",
    "text": "Elige origen y destino. La red buscará por dónde puede circular cada tren. Después podrás asignar material y preparar el servicio.",
    "kind": "novedad",
    "mood": "determined"
  },
  "message-info": {
    "person": "minister",
    "text": "Te traigo una actualización de la compañía. Revisa aquí el detalle antes de decidir tu siguiente jugada.",
    "kind": "novedad",
    "mood": "determined"
  }
};
export const EVENT_PEOPLE={
  "evento-auditoria": "treasury",
  "evento-averia": "workshop",
  "evento-cable": "adif",
  "evento-calor": "riders",
  "evento-desprendimiento": "adif",
  "evento-fondos": "minister",
  "evento-huelga": "workshop",
  "evento-lowgo": "rival",
  "evento-nevada": "adif",
  "evento-tuneles": "adif",
  "evento-viral": "riders",
  "evento-visita": "minister",
  "territorio-extremadura": "mayor",
  "territorio-soria": "mayor",
  "territorio-teruel": "mayor",
  "territorio-cantabria": "mayor",
  "tren-bcbb": "workshop",
  "tren-dorfler": "workshop",
  "impago": "treasury",
  "cloacas": "treasury",
  "extorsion": "treasury",
  "juzgado": "treasury"
};
export const MESSAGES={...STATIC_MESSAGES,...Object.fromEntries(EVENTS.map(event=>['event-'+event.id,{person:EVENT_PEOPLE[event.id]||(event.id.startsWith('escandalo-')?'treasury':'minister'),text:event.body,mood:'worried',kind:'suceso'}]))};
