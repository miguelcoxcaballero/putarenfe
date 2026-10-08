La web publicada está en `../index.html`; la sala de escucha, en `../dialogos.html`. Ambos usan las mismas tomas completas de `../assets/voces/`. `../release.json` indica cuántos diálogos están grabados y conserva sus SHA-256. Una versión parcial mantiene los diálogos pendientes con subtítulos; nunca recupera las voces antiguas.

Desde la carpeta `iberia-ferroviaria`, reconstruir la versión ya guardada sin los HTML autónomos grandes:

```sh
node tools/build-web.mjs
```

El constructor lee los módulos, estilos y recursos editables de `proyecto/dist`. También puedes ejecutar `npm run web:build` desde `proyecto`. Si cambias un diálogo, el constructor se detiene hasta que exista una nueva grabación completa validada; los cambios de interfaz y estilos se reflejan al reconstruir.

Incorporar una nueva captura física del mismo catálogo y reparto:

```sh
node tools/build-web.mjs --manifest /ruta/captura/manifest.json --audio-stage /ruta/captura
```

El script comprueba el catálogo pronunciado, el modelo, las nueve referencias, el texto completo, EOS y el SHA de cada MP3 antes de publicar el mapa compartido. Un manifiesto aceptado queda guardado para las siguientes reconstrucciones. Los archivos llevan el hash en el nombre para que una actualización no reutilice audio de la caché anterior; conserva también los archivos de la versión anterior durante la actualización. Las plantillas y los recursos de `web-source/` permiten reconstruir la web sin un archivo HTML de más de 100 MiB. No contienen las tomas antiguas, modelos ni audio RAW.

Para crear las plantillas desde otra pareja de HTML congelados y verificados:

```sh
node tools/build-web.mjs --game /ruta/juego.html --auditorio /ruta/dialogos.html --snapshot /ruta/captura --game-sha SHA256_JUEGO --auditorio-sha SHA256_DIALOGOS
```

Para probar las rutas relativas localmente:

```sh
python -m http.server 8080 --directory .
```

Abre `http://localhost:8080/`. La web carga el MP3 al pulsar escuchar; necesita una conexión al servidor. Las verificaciones estáticas del constructor no sustituyen una prueba real del navegador ni una escucha humana.
