# Contexto vigente — Von Wobeser y Sierra

Última actualización: **2026-08-12 CST**.

Este archivo es el punto de entrada para continuar el proyecto. El detalle técnico, decisiones,
errores corregidos, verificación y pendientes se encuentra en
[`docs/CONTEXT-2026-08-12.md`](docs/CONTEXT-2026-08-12.md).

## Estado breve

- Fuente de verdad: `ia-satma/Webpage-Von-Wobeser`, rama `main`.
- Sitio público: espejo editorial servido y enriquecido por Express.
- Administración: aplicación React bajo `/admin/*`.
- Datos: PostgreSQL de desarrollo y producción administrados desde Replit.
- Archivos persistentes: Replit App Storage; PostgreSQL conserva rutas y metadatos.
- Tipografía editorial vigente: **Gelasio** para introducciones y títulos, e **Inter** para
  cuerpo e interfaz.
- Idiomas: español e inglés con rutas, `canonical`, `hreflang` y selector compartidos.
- Contenido canónico: 18 prácticas, 7 industrias y 133 perfiles oficiales bilingües;
  el directorio conserva además 9 perfiles propios para un total de 142 publicados.
- Handoff al cliente: detección de instalación, restauración completa cifrada y creación
  segura del Dueño desde Replit Secrets; una Database nueva muestra una pantalla de
  instalación en vez de fallar el deployment.
- Validación más reciente documentada: TypeScript, build y **240/240 pruebas de seguridad**.

## Reglas de continuidad

1. No incluir contraseñas, tokens, cadenas de conexión ni valores de Secrets en Git o notas.
2. No volver a almacenar cargas en el filesystem efímero como fuente única.
3. Todo contenido nuevo debe heredar Gelasio/Inter; el editor elimina familias pegadas.
4. No ejecutar migraciones destructivas ni pruebas invasivas contra producción.
5. Los historiales de imágenes, audios y presentaciones son permanentes e inmutables.
6. Antes de cerrar un lote: `npm run check`, `npm run test:security`, `npm run build` y
   `git diff --check`.
7. La aceptación final requiere recorrido humano ES/EN, móvil/escritorio y panel, además de
   retroalimentación del cliente.
8. Para una cuenta Replit nueva, usar `npm run handoff:status -- --directory=.handoff` y
   después `npm run handoff:install`; nunca pegar valores de Secrets en Shell, Git o chat.
