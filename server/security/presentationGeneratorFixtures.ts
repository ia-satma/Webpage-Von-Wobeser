import type {
  PresentationTemplate,
  RenderOptions,
  SlideModel,
} from '../services/PresentationGenerator';

export const FIXTURE_IMAGE_URL =
  '/generated-images/article-8538474c-2c4b-4beb-b1f9-6a012a04ecf1-gemini-1774236375318.png';

export const REPRESENTATIVE_PRESENTATION: SlideModel = {
  title: 'Panorama jurídico 2026',
  subtitle: 'Riesgos, oportunidades y siguientes pasos',
  slides: [
    {
      layout: 'section',
      kicker: '01 · Contexto',
      title: 'Un entorno que exige decisiones claras',
      bullets: ['La regulación evoluciona con rapidez.'],
      notes: 'Nota de sección para el expositor.',
    },
    {
      layout: 'bullets',
      kicker: 'Hallazgos',
      title: 'Prioridades para el consejo',
      bullets: [
        'Alinear la estrategia jurídica con el negocio.',
        'Preparar evidencia y responsables internos.',
        'Medir riesgos y oportunidades trimestralmente.',
      ],
    },
    {
      layout: 'stat',
      kicker: 'Cifras clave',
      title: 'Indicadores',
      stat: {
        figures: [
          { value: '45%', label: 'Exposición', note: 'Escenario base' },
          { value: '3', label: 'Frentes', note: 'Acción inmediata' },
          { value: '$120M', label: 'Valor', note: 'Monto estimado' },
        ],
      },
    },
    {
      layout: 'chart',
      kicker: 'Evolución',
      title: 'Impacto estimado por frente',
      chart: {
        type: 'bar',
        categories: ['Fiscal', 'Laboral', 'Competencia'],
        series: [
          { name: 'Escenario base', values: [-12, 25, 38] },
          { name: 'Escenario alto', values: [-6, 34, 51] },
        ],
        unit: '%',
        insight: 'La exposición positiva se concentra en competencia y laboral.',
      },
    },
    {
      layout: 'diagram',
      kicker: 'Ruta',
      title: 'Proceso recomendado',
      diagram: {
        kind: 'flow',
        nodes: ['Diagnóstico', 'Priorización', 'Ejecución', 'Seguimiento'],
      },
    },
    {
      layout: 'image',
      kicker: 'Equipo',
      title: 'Acompañamiento especializado',
      bullets: ['Coordinación multidisciplinaria', 'Comunicación ejecutiva'],
      image: {
        url: FIXTURE_IMAGE_URL,
        caption: 'Equipo Von Wobeser y Sierra',
      },
    },
    {
      layout: 'quote',
      title: 'Principio rector',
      quote: {
        text: 'La anticipación convierte la complejidad en una ventaja.',
        attribution: 'Von Wobeser y Sierra',
        role: 'Perspectiva institucional',
      },
    },
    {
      layout: 'twocolumn',
      kicker: 'Plan',
      title: 'Acciones coordinadas',
      columns: [
        { heading: 'Ahora', points: ['Validar supuestos', 'Asignar responsables'] },
        { heading: 'Después', points: ['Ejecutar controles', 'Reportar avances'] },
      ],
    },
    {
      layout: 'closing',
      kicker: 'Contacto',
      title: 'Gracias',
      bullets: ['Estamos listos para acompañarle.'],
    },
  ],
};

export function presentationOptions(template: PresentationTemplate): RenderOptions {
  return {
    template,
    branding: 'vonwobeser',
    lang: 'es',
    formats: ['pptx', 'pdf', 'png'],
    topic: 'Panorama jurídico 2026',
    sourceDocs: ['fuente-controlada.pdf'],
    engine: 'test-native',
  };
}
