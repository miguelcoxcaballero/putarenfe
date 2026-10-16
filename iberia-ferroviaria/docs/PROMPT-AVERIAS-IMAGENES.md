# Prompt para ChatGPT: imágenes de averías, autobuses y Autocares Meseta

Copia desde aquí hasta el final y pégalo en ChatGPT (con el conector de GitHub activado).

---

Necesito que generes y subas al repositorio de GitHub **miguelcoxcaballero/putarenfe** (rama `main`) las imágenes de la nueva mecánica de averías del juego Iberia Ferroviaria: cuando un tren se queda tirado, el jugador decide entre dejar a los viajeros a su suerte, mandar sus propios autobuses de Tenfe (que compra en Trenes Pop) o pagar a Autocares Meseta, la empresa de autocares del rival Íñigo Asfalto. Son 4 imágenes.

## Referencias de estilo (míralas antes de empezar, están en el propio repositorio)
- Fotos de trenes del juego: `iberia-ferroviaria/proyecto/dist/assets/train-photos/` (por ejemplo `103.webp`, `120.webp`, `465.webp`) y sus copias en `iberia-ferroviaria/assets/fotos/`. Todas comparten el mismo taller: vigas azules, grúa amarilla, suelo gris con líneas amarillas, luz natural.
- Fotos del modo Rescate: `iberia-ferroviaria/proyecto/dist/assets/rescate/` (por ejemplo `evento-averia.webp`, `tren-bcbb.webp`). Mismo acabado fotográfico y cinematográfico.
- Librea de la compañía ficticia **Tenfe**: blanco con franja morada y el rótulo «tenfe» en minúsculas, como en esas fotos.
- **Autocares Meseta (AUME)** es una parodia de ALSA: autocares azul oscuro con una franja blanca y el rótulo «aume» en minúsculas, redondo y grueso, en blanco sobre el azul (en el juego el logotipo es un rótulo azul `#1b4db3` con un punto amarillo `#f5b400`). No uses el nombre ni el logotipo reales de ALSA.

## Estilo común
- Fotografía realista y cinematográfica, luz natural cálida, colores ricos, España reconocible. Mismo nivel de calidad que las fotos de referencia.
- Sin textos legibles ni logotipos reales, salvo los rótulos «tenfe» y «aume» que pide cada descripción. Sin marcas de agua.
- No retrates a personas reales ni caras reconocibles; la gente que aparezca debe ser anónima.
- Formato WebP, calidad ~80, peso orientativo 120–350 KB. Tamaño en píxeles indicado en cada imagen.

## Dónde subirlas (las dos rutas, mismos bytes)
1. `iberia-ferroviaria/proyecto/dist/assets/rescate/<nombre>.webp` (fuente editable)
2. `iberia-ferroviaria/assets/rescate/<nombre>.webp` (web publicada)

Usa exactamente estos nombres en minúsculas. El juego las carga solo por el nombre: no hace falta tocar código. Haz un único commit en `main` («Imágenes de averías y Autocares Meseta») sin modificar ningún otro archivo, y no fuerces el historial.

## Las cuatro imágenes
- **autobus-tenfe.webp** (1536×1024): Autocar moderno de dos ejes (tipo Irizar i6), blanco con la franja morada de Tenfe y el rótulo «tenfe» en minúsculas en el lateral, aparcado en el MISMO taller de vigas azules, grúa amarilla y suelo gris con líneas amarillas que las fotos de trenes. Vista de tres cuartos frontal, puerta cerrada, sin personas. Es la foto del anuncio en Trenes Pop y de la ficha de flota.
- **autobus-aume.webp** (1280×720): Autocar azul oscuro de Autocares Meseta con franja blanca y el rótulo «aume» en blanco, parado en una carretera comarcal junto a un terraplén ferroviario; arriba, en la vía, un tren blanco con franja morada de Tenfe detenido con las luces de emergencia; viajeros con maletas bajando por un camino hacia el autocar. Meseta castellana, tarde de sol bajo. Se ve cuando el jugador paga a Íñigo.
- **autobus-tenfe-rescate.webp** (1280×720): Dos autocares blancos con franja morada de Tenfe recogiendo viajeros en una carretera junto a un tren blanco y morado detenido en la vía, al amanecer, con niebla baja. Se ve cuando el jugador manda sus propios autobuses.
- **viajeros-tirados.webp** (1280×720): Decenas de viajeros con maletas sentados y de pie junto a un tren blanco con franja morada parado en mitad del campo, sin autobús ni carretera a la vista, atardecer, cielo naranja, actitud de cansancio y enfado. Se ve cuando el jugador los deja a su suerte.

Cuando termines, dime el SHA del commit y el peso de cada archivo.
