# Fuente y continuidad del avance

El estado disponible se describe en el [README del juego](../README.md): **261/412 grabaciones**, guía completa de 50 audios y 28 diálogos de Paco con la referencia real de Torrente. El cierre de la producción, la revisión de las discrepancias y las pruebas finales siguen pendientes.

La fuente editable está en [`proyecto`](../proyecto/). El catálogo hablado actual se conserva en [`investigacion/voces/dialogos-3.6.3.json`](../investigacion/voces/dialogos-3.6.3.json) y las referencias en [`investigacion/voces/referencias-qwen-3.6.3`](../investigacion/voces/referencias-qwen-3.6.3/). El catálogo contiene los 412 cuerpos completos, incluidas las 31 introducciones originales; la referencia real de Paco y las otras ocho referencias conservadas tienen su procedencia y SHA registrados.

Las páginas [del juego](../index.html) y [del auditorio](../dialogos.html) pertenecen a esta carpeta. Sus grabaciones proceden del reparto continuo actual, con una toma por intervención, sin los fragmentos antiguos ni síntesis del navegador. Los cuerpos sin audio permanecen disponibles como texto. Servir la web no ejecuta el generador de voces.

Los documentos y manifiestos de las fuentes conservan fases anteriores de trabajo. Sus recuentos y pruebas corresponden a los archivos y fechas que identifican; una prueba parcial histórica no certifica este avance ni las 412 tomas finales. La construcción de la entrega completa exige el catálogo actual cerrado antes de reemplazar el paquete final.

Para probar las páginas localmente, sirve la raíz de `putarenfe` con `python3 -m http.server 8080 --bind 127.0.0.1` y abre `/iberia-ferroviaria/` o `/iberia-ferroviaria/dialogos.html`. El guardado usa el `localStorage` de ese origen. La aplicación de Renfe conserva su ubicación en la raíz del repositorio.
