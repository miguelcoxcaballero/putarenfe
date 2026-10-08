# Iberia Ferroviaria

The user requested that this project and every playable update live in
`miguelcoxcaballero/putarenfe`, under `iberia-ferroviaria/`, with commits and
GitHub Pages publication. Preserve the Renfe viewer in the repository root.

GitHub Pages serves `main:/`. Publish the game as `index.html` and the listening
room as `dialogos.html` in this directory. Verify the public HTTPS pages and
their current assets after pushing a ready update. Commit the editable source,
builder, published assets and accurate release metadata together.

Audio files contain one complete recording per dialogue. The game and listening
room must share the same current recordings. Keep old sentence clips and browser
speech synthesis out of published builds. Mark partial releases with their actual
recorded count; a complete release requires all 412 current dialogue bodies.

Keep model weights, RAW generation caches, full reference videos, credentials and
temporary downloads outside Git. Preserve voice and dialogue provenance. Startup
must not regenerate voices or download models automatically.

Editable game source is in `proyecto/`. Publication tooling and web templates are
separate from active neural production; do not modify a running producer's
catalogue, reference pack, source or stage. Follow the actual current production
records when rebuilding voices rather than copying historical process IDs.
