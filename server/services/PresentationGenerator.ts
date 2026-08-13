import type { RenderOptions, RenderResult, SlideModel } from './presentation/contracts';
import { createDefaultPresentationDependencies } from './presentation/dependencies';
import { PresentationOutputPipeline } from './presentation/outputPipeline';

export type {
  PresentationTemplate,
  PresentationBranding,
  PresentationFormat,
  SlideLayout,
  SlideChart,
  SlideDiagram,
  SlideImage,
  SlideStatFigure,
  SlideStat,
  SlideQuote,
  SlideColumn,
  SlideModelSlide,
  SlideModel,
  RenderOptions,
  RenderResult,
} from './presentation/contracts';

/**
 * Fachada pública estable del motor de presentaciones.
 * El agente y las rutas continúan dependiendo únicamente de esta clase.
 */
export class PresentationGenerator {
  private readonly outputPipeline = new PresentationOutputPipeline(
    createDefaultPresentationDependencies(),
  );

  async renderAndSave(model: SlideModel, opts: RenderOptions): Promise<RenderResult> {
    return this.outputPipeline.renderAndSave(model, opts);
  }
}

export const presentationGenerator = new PresentationGenerator();
