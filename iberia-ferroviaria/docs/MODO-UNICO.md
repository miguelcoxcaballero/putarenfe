# Tenfe 5.0 · una sola compañía

La campaña de 2022 y el rescate de 2027 comparten `engine.js`, la red física, la flota, Trenespop, las cuentas y el guardado. La portada crea una sola campaña. No carga `rescate.js`, `rescate-ui.js` ni su mapa separado.

## Lo que se integra

- Red de ancho, tensión y velocidad; trenes en circulación y horarios oficiales del clásico.
- Material regional y corredores convencionales para los territorios del rescate.
- Encargos, decisiones narrativas y las 412 grabaciones del clásico.
- Hitos de viajeros, pactos con obligaciones y plazos, proyectos por fases y efectos verificables.
- Media electoral de seis cierres mensuales: Viajeros 34 %, Territorios 20 %, Plantilla 20 %, Economía 26 %.
- Etapa de rescate desde 2027, elecciones en diciembre de 2030 y 2034, y continuación del legado hasta 2050.
- Cloacas con expediente causal: la adjudicación aporta 45 M€, la inspección llega seis meses después y la sentencia después de doce. Restituir o pedir revisión tiene un coste visible.
- Informe mensual, previsión de pedidos, objetivo y acción siguiente sobre la partida actual.

El rescate se considera superado tras dos elecciones ganadas, dos conexiones rurales nuevas, margen mensual no negativo y ningún crédito puente en los últimos 24 meses. La interfaz enseña cada condición. No hay cupo semanal de órdenes ni otra moneda para investigar: la escasez está en la caja, el material, los maquinistas y los plazos.

## Interfaz

Seis secciones: Red, Flota, Dinero, Despacho, Progreso y Prensa. El mapa permanece como superficie principal; las acciones se realizan en las fichas y los cajones. «Capas» agrupa las herramientas visuales. Trenes Pop conserva su tienda y sus fotografías.

## Guardados y audio

La clave de la campaña clásica se conserva y el estado nuevo añade `tenfe.version=1`, validado al importar. La antigua clave `tenfe-rescate-v1` se conserva. La conversión muestra sus límites: economía ×30, vías reales y horario replanteado; las obras y expedientes originales quedan en una copia íntegra exportable.

Los 412 cuerpos hablados no cambian. La publicación reutiliza las mismas tomas completas del auditorio. Las pantallas nuevas no inventan grabaciones ni usan síntesis del navegador.

## Comprobación

`tenfe-test.mjs` cubre compatibilidad, compra de regionales, pactos, hitos, fases, elecciones deterministas, corrupción, continuidad de 2027 y conversión de guardados. `tenfe-ui-test.mjs` recorre la publicación compilada en Chromium, ejecuta compras y decisiones, cierra meses y continúa la partida en escritorio y móvil. Se conserva el resultado real de GitHub Actions y sus capturas.
