# Prompt para generar los diálogos y las voces de las averías

Los cuatro mensajes de la mecánica de averías ya están escritos dentro del juego, en `proyecto/dist/narration-data.js` (claves `breakdown-alert`, `breakdown-aume`, `breakdown-abandon` y `breakdown-ownbus`). El texto que se graba tiene que ser **exactamente** ese: el juego reproduce una grabación por mensaje y comprueba que el texto grabado coincide con el publicado. Si quieres cambiar una frase, cámbiala primero en ese archivo y vuelve a generar su voz.

Copia desde aquí hasta el final y pégalo en ChatGPT (o en la sesión que tenga acceso al repositorio y al entorno de voces).

---

Trabaja en el repositorio **miguelcoxcaballero/putarenfe**, carpeta `iberia-ferroviaria/`. Lee antes `proyecto/tools/VOICE-DIRECTION.md` y `AGENTS.md`: las 412 grabaciones de diálogos están congeladas y no se tocan. Lo que te pido son **mensajes narrados** (el otro catálogo, el de avisos del equipo, que se genera con `proyecto/tools/build_narration_voices.py`).

## 1. Los cuatro mensajes nuevos

| Clave | Personaje | Emoción | Texto (literal) |
| --- | --- | --- | --- |
| `breakdown-alert` | `adif` · Benito Balasto, jefe de infraestructuras | `worried` | Tren parado en plena vía: avería de material. El viajero espera una solución y el reloj no se para. |
| `breakdown-aume` | `rival` · Íñigo Asfalto, empresario de Neguri, dueño de Autocares Meseta | `proud` | Jajaja. ¿Otro tren tirado, compañero? Tranquilo, que para eso está Autocares Meseta. Mis autocares ya van a recoger a tus viajeros. La factura te la mando al despacho, y a cada uno le doy una tarjeta, por si se cansan de esperar trenes. |
| `breakdown-abandon` | `riders` · Marisa Andén, portavoz de los viajeros | `angry` | Le habla Marisa Andén. Trescientas personas en mitad del campo, sin tren, sin autobús y sin noticias. Esto no se olvida: ni en la encuesta ni en las urnas. |
| `breakdown-ownbus` | `workshop` · Fermín Bogie, jefe de talleres | `determined` | Autobuses de la casa en camino. Los viajeros llegan por carretera y el tren, al taller. Al menos esta vez no le hemos dado el gusto al de los autocares. |

Cómo suena cada uno (para dirigir la interpretación, no para cambiar el texto):
- **Íñigo Asfalto** se ríe de verdad al principio (una carcajada corta, no un «jajaja» leído), habla con suficiencia, acento del norte suave, ritmo rápido y amable, como quien te hace un favor que te va a costar caro. Es el mismo personaje de «Soy Íñigo Asfalto, de Autocares Meseta: en mi familia vasca llamamos oportunidad a los viajeros que un iluminado deja sin tren».
- **Marisa Andén** está indignada pero contenida: frases cortas, sin gritar, con la amenaza final muy clara.
- **Fermín Bogie** es seco y resolutivo; la última frase lleva una pizca de orgullo.
- **Benito Balasto** avisa con preocupación profesional, sin dramatizar.

## 2. Generar las grabaciones

Desde `iberia-ferroviaria/proyecto`, con Node 22 y el entorno Qwen activado (`source /workspace/tools/qwen-venv/bin/activate`), usando el modelo fijado y el pack de referencias actual (`investigacion/voces/referencias-qwen-3.6.3/prompts.json`, que ya contiene a `adif`, `rival`, `riders` y `workshop`):

```sh
python tools/build_narration_voices.py --prepare --model /tmp/qwen3-tts-0.6b
python tools/build_narration_voices.py --model /tmp/qwen3-tts-0.6b --stage ../investigacion/voces/narracion-averias --shards 1 --shard 0
python tools/build_narration_voices.py --model /tmp/qwen3-tts-0.6b --stage ../investigacion/voces/narracion-averias --package
```

El generador solo infiere los mensajes que aún no tienen toma válida (los 126 anteriores ya están en `dist/assets/narracion/`), con la misma semilla `424242`, precisión `mixed-bf16-talker` y el mastering del paquete actual. Cada toma debe terminar con EOS y pasar la validación; si una no sale, el script reintenta con las semillas siguientes. No cambies modelo, referencias, semilla ni mastering.

`--package` reescribe `dist/assets/narration-voices.js` y `dist/assets/narracion/manifest.json` con **las 130 tomas** (126 + 4). Comprueba después:

```sh
node narration-test.mjs
node test.mjs
node ../tools/build-web.mjs
```

y que `release.json` indica `narration.recorded = narration.messages = 130`. Hasta que esas cuatro tomas existan, el juego publica las 126 grabadas, marca las cuatro nuevas como pendientes en `release.json` y muestra su texto con subtítulos.

## 3. Publicar

Un solo commit en `main` que incluya la fuente editable (`proyecto/dist/assets/narracion/`, `proyecto/dist/assets/narration-voices.js`), los archivos publicados que genere `tools/build-web.mjs` (`assets/`, `index.html`, `dialogos.html`, `release.json`, `web-source/`) y los informes del stage. No subas pesos del modelo, cachés ni WAV intermedios. Después, comprueba las páginas públicas con `node tools/verify-pages.mjs`.

## 4. Si quieres más variantes (opcional)

Puedes proponer dos frases más por personaje para una futura versión, en el mismo tono y con la misma longitud (dos o tres oraciones, sin cifras concretas ni nombres de ciudades). Entrégalas en una tabla igual que la de arriba, pero **no las añadas al juego ni las grabes**: primero se incorporan a `narration-data.js` con su clave y después se generan, para que texto y voz coincidan siempre.
