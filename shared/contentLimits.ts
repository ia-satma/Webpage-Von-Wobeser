// Límites del editor del CMS. La base usa columnas `text`, por lo que estos
// límites existen únicamente para dar una protección razonable en el formulario
// sin bloquear el contenido editorial oficial ni el HTML semántico que produce
// el editor enriquecido.
export const practiceContentLimits = {
  introduction: 1_000,
  body: 12_000,
} as const;
