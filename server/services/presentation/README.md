# Motor de presentaciones

`PresentationGenerator.ts` es la fachada pública estable. El agente y las rutas no deben importar
los módulos internos de este directorio.

- `contracts.ts`: modelo y opciones públicas.
- `designSystem.ts`: sistema MERIDIANO, tipografía, paleta y geometría SVG.
- `dataVisuals.ts`: gráficas y diagramas SVG.
- `slideRenderers.ts`: portada y nueve layouts.
- `assets.ts`: resolución segura, rasterización y composición de imágenes.
- `pptxRenderer.ts`: PPTX editable, charts nativos y notas.
- `pdfRenderer.ts`: PDF construido a partir de PNG.
- `dependencies.ts`: dependencias productivas e inyección para pruebas.
- `outputPipeline.ts`: selección de formatos, persistencia e historial.

## Hallazgo heredado diferido

El flujo histórico registra cada archivo local después de terminar su escritura y, para PPTX,
después de incrustar las fuentes. Si la escritura crea un archivo parcial o la incrustación falla
antes de ese registro, la limpieza compensatoria no conoce todavía esa ruta y podría quedar un
archivo local huérfano. No se corrigió durante esta modularización porque cambiaría el
comportamiento funcional; debe atenderse como una corrección independiente con una prueba de
fallo durante escritura/incrustación.
