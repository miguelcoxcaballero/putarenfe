# Iberia Ferroviaria · un solo juego

La campaña, el modo libre y el Rescate de Tenfe se van fusionando en un único modo de juego. El diseño completo y el plan de fases están en [`investigacion/modo-unico/ESPECIFICACION.md`](../investigacion/modo-unico/ESPECIFICACION.md). Cada fase se publica en cuanto pasa las pruebas.

## 4.1 · Una sola partida

**Portada.** Solo dos botones: «Nueva partida» y, si hay algo guardado, «Continuar», que dice qué partida es y dónde va (por ejemplo «La herencia · marzo de 2023») y abre la más reciente.

**Nueva partida.** Una pantalla con tres arranques:
- **2022 · La herencia** (recomendado): la red real desde enero de 2022, con el turno guiado hablado.
- **2027 · El rescate**: el Rescate de Tenfe 4.0. Su motor aún es el anterior; en la fase 5 pasa al motor único.
- **Maqueta**: el antiguo modo libre, con sus reglas en la misma tarjeta (presupuesto de 500, 1.500 o 5.000 M€ y rivales sí o no).

Hay un campo **Semilla**: si lo dejas vacío, el juego genera un código; la misma semilla da la misma partida y se ve en Guardar o en el menú Partida. Antes de sustituir una partida guardada del mismo tipo, pregunta. Nunca borra las demás.

**Lo que se dice, pasa.**
- Los 315 encuentros ya no salen por turno: un personaje solo habla si su estado de ánimo y el problema del que habla son ciertos en tu partida, y lo que eliges cae sobre el tren, la línea o la estación que nombra. El cuadro dice en una línea de qué caso se trata. Si no hay nada cierto que decir, nadie habla. No se repite nunca el mismo diálogo en una partida.
- Las apuestas (auditoría y visita del Rey) se deciden una sola vez: recargar no cambia el resultado.
- Ninguna decisión se queda sin opción jugable: si falta caja, la opción más barata se paga a plazos.
- Las peticiones de las ciudades pagan cuando has mantenido el servicio tres cierres de mes; la ficha enseña la ocupación real.
- El primer encargo se mide por encima de lo que la red ya llevaba al firmarlo.
- Burgos, Murcia, Pajares y Extremadura se anuncian después de que sus obras abren de verdad, en su día real.
- Cada opción hace lo que dice: servicios mínimos, bajada temporal de tarifas, recorte de oferta con calor, refuerzo de los Alvia (o desactivado con el motivo), wifi, cobertura energética, limitación de velocidad y vallado. Las promesas (Plan Extremadura, catenaria a Teruel, Alvia a Asturias) se comprueban cada mes.

**Red real.**
- **La tensión cuenta.** Los AVE de 25 kV (S103, S112, AV 2030) no entran en vías de 3 kV; S100, S106, S120, S130 y S730 son bitensión, y el S730 cruza sin catenaria con gasóleo a 180 km/h. El motivo sale escrito: «Sagunt — València: 3 kV».
- **Tramos nuevos**, trazados sobre OpenStreetMap: Palencia — León convencional por Sahagún, Córdoba — Sevilla convencional por Palma y Lora del Río, y la Rampa de Pajares separada de la Variante (que sigue abriendo el 29 de noviembre de 2023).
- Motilla corregida: Madrid — València pasa de 499 a 391 km. Velocidades corregidas en once tramos con datos reales (Teruel — Sagunt 90, Venta de Baños — Palencia 130, Madrid — Guadalajara 160…).
- Capa **Velocidad** en el mapa y leyenda de electrificación que separa 25 kV alterna y 3 kV continua.
- **Trenespop** filtra con «Circula en»: cada tren dice ✓ o ✗ con el motivo, la ficha cuenta en cuántas relaciones puede ir, y «Compra uno que sí» abre la tienda ya filtrada.
- Las partidas guardadas de la 4.0 se migran: se añaden los tramos nuevos y, si un servicio se queda sin tren compatible, se le asigna otro o se suspende con aviso.

**Voces.** Los 412 diálogos grabados no cambian ni una letra; el rescate tiene 3 de sus 70 líneas grabadas.
