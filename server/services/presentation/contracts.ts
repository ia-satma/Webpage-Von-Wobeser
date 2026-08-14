import type { GeneratedPresentation } from '../../../shared/schema';


// --- Tipos del modelo (exportados; los consume el agente) ---
export type PresentationTemplate = 'vonwobeser' | 'minimal' | 'dark';
export type PresentationBranding = 'vonwobeser' | 'custom';
export type PresentationFormat = 'pptx' | 'pdf' | 'png';
export type SlideLayout = 'section' | 'bullets' | 'closing' | 'image' | 'chart' | 'diagram' | 'stat' | 'quote' | 'twocolumn';

export interface SlideChart {
  type: 'bar' | 'line' | 'pie';
  categories: string[];
  series: { name: string; values: number[] }[];
  unit?: string;
  insight?: string;   // "lectura clave" para el riel del gráfico (opcional)
}
export interface SlideDiagram {
  kind: 'flow' | 'steps' | 'list';
  nodes: string[];
}
export interface SlideImage {
  prompt?: string;
  url?: string;
  caption?: string;
}
export interface SlideStatFigure {
  value: string;   // "45%", "3", "$120M"
  unit?: string;
  label: string;
  note?: string;
}
export interface SlideStat { figures: SlideStatFigure[] }  // 1, 2 o 3
export interface SlideQuote { text: string; attribution?: string; role?: string }
export interface SlideColumn { heading: string; points: string[] }

export interface SlideModelSlide {
  layout: SlideLayout;
  title: string;
  kicker?: string;       // eyebrow en mayúsculas
  bullets?: string[];
  notes?: string;
  image?: SlideImage;
  chart?: SlideChart;
  diagram?: SlideDiagram;
  stat?: SlideStat;
  quote?: SlideQuote;
  columns?: SlideColumn[];
}
export interface SlideModel {
  title: string;
  subtitle?: string;
  slides: SlideModelSlide[];
}

export interface RenderOptions {
  template: PresentationTemplate;
  branding: PresentationBranding;
  lang: string;
  formats: PresentationFormat[];
  customLogoUrl?: string | null;
  customPrimaryColor?: string | null;
  topic?: string;
  sourceDocs?: string[];
  engine?: string;
}
export interface RenderResult {
  success: boolean;
  presentation?: GeneratedPresentation;
  error?: string;
}
