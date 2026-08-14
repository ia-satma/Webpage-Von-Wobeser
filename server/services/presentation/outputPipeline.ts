import type { PublicMediaFile } from '../../media/persistentMedia';
import type { RenderOptions, RenderResult, SlideModel } from './contracts';
import type { PresentationGeneratorDependencies } from './dependencies';

function truncate(value: string, maximum: number): string {
  return value && value.length > maximum
    ? `${value.slice(0, maximum - 1).trimEnd()}…`
    : value;
}

export class PresentationOutputPipeline {
  constructor(private readonly dependencies: PresentationGeneratorDependencies) {}

  async renderAndSave(model: SlideModel, options: RenderOptions): Promise<RenderResult> {
    const generatedFiles: PublicMediaFile[] = [];
    let persistedObjectNames: string[] = [];
    const deps = this.dependencies;

    try {
      if (!model || !model.title || !Array.isArray(model.slides) || model.slides.length === 0) {
        return { success: false, error: 'El modelo de diapositivas está vacío o es inválido.' };
      }
      if (!deps.existsSync(deps.outputDirectory)) deps.makeDirectory(deps.outputDirectory);

      const logo = await deps.resolveLogo(options);
      const theme = deps.makeTheme(options, logo);
      const lang: 'en' | 'es' = options.lang === 'en' ? 'en' : 'es';
      const configuration = await deps.loadConfiguration();
      const firm = deps.configurationValue(configuration, 'footer_firm', lang) || 'Von Wobeser y Sierra, S.C.';
      const site = deps.configurationValue(configuration, 'site_url', lang) || 'https://www.vonwobeser.com';
      const phone = deps.configurationValue(configuration, 'footer_phone', lang) || '';
      const address = deps.configurationValue(configuration, 'footer_address', lang) || 'Ciudad de México';
      const siteWithoutProtocol = site.replace(/^https?:\/\//, '');
      const footer = firm;
      const documentKicker = lang === 'en' ? 'Presentation · 2026' : 'Presentación · 2026';
      const closingFooter = `${firm} · ${siteWithoutProtocol}`;
      const contact = [
        { label: lang === 'en' ? 'Offices' : 'Oficinas', value: truncate(address, 44) },
        { label: 'Web', value: siteWithoutProtocol },
        ...(phone ? [{ label: lang === 'en' ? 'Phone' : 'Teléfono', value: phone }] : []),
      ];

      const stamp = `${deps.now()}-${deps.random().toString(36).slice(2, 8)}`;
      const baseName = `pres-${stamp}`;
      const formats = options.formats && options.formats.length
        ? options.formats
        : ['pptx', 'pdf', 'png'] as const;
      const total = model.slides.length + 1;
      const slides = deps.buildSlides(
        model,
        theme,
        footer,
        documentKicker,
        closingFooter,
        contact,
      );

      let pptxUrl: string | null = null;
      let pdfUrl: string | null = null;
      const pngUrls: string[] = [];
      const needPng = formats.includes('png');
      const needPdf = formats.includes('pdf');
      const pngBuffers: Buffer[] = [];

      if (needPng || needPdf) {
        for (let index = 0; index < slides.length; index += 1) {
          const png = await deps.rasterize(slides[index].build);
          pngBuffers.push(png);
          if (needPng) {
            const filename = `${baseName}-slide-${index + 1}.png`;
            const absolutePath = deps.joinPath(deps.outputDirectory, filename);
            const publicPath = `/generated-presentations/${filename}`;
            deps.writeFile(absolutePath, png);
            generatedFiles.push({ absolutePath, publicPath });
            pngUrls.push(publicPath);
          }
        }
        deps.log(`Renderizadas ${pngBuffers.length} diapositivas a PNG`);
      }

      if (needPdf && pngBuffers.length) {
        const bytes = await deps.createPdf(pngBuffers);
        const filename = `${baseName}.pdf`;
        const absolutePath = deps.joinPath(deps.outputDirectory, filename);
        const publicPath = `/generated-presentations/${filename}`;
        deps.writeFile(absolutePath, bytes);
        generatedFiles.push({ absolutePath, publicPath });
        pdfUrl = publicPath;
        deps.log('PDF generado');
      }

      if (formats.includes('pptx')) {
        const pptx = await deps.buildPptx(
          model,
          theme,
          footer,
          documentKicker,
          contact,
          closingFooter,
          total,
        );
        const filename = `${baseName}.pptx`;
        const absolutePath = deps.joinPath(deps.outputDirectory, filename);
        const publicPath = `/generated-presentations/${filename}`;
        await pptx.writeFile({ fileName: absolutePath });
        await deps.embedFonts(absolutePath);
        generatedFiles.push({ absolutePath, publicPath });
        pptxUrl = publicPath;
        deps.log('PPTX generado');
      }

      const persistence = await deps.persistFiles(generatedFiles);
      persistedObjectNames = persistence.objectNames;
      const presentation = await deps.createHistory({
        title: model.title,
        topic: options.topic || null,
        template: options.template,
        branding: options.branding,
        lang: options.lang,
        slideCount: total,
        pptxUrl,
        pdfUrl,
        pngUrls,
        sourceDocs: options.sourceDocs || [],
        engine: options.engine || 'openai+native',
      });
      return { success: true, presentation };
    } catch (error: any) {
      await deps.deletePersistentObjects(persistedObjectNames);
      for (const generatedFile of generatedFiles) {
        try {
          deps.removeFile(generatedFile.absolutePath);
        } catch {
          // El archivo quizá no llegó a escribirse o ya fue limpiado.
        }
      }
      deps.logError(error);
      if (deps.isPersistentStorageUnavailable(error)) {
        return {
          success: false,
          error: 'App Storage no está disponible. La presentación no se guardó para evitar que se pierda al publicar.',
        };
      }
      return { success: false, error: error?.message || 'Falló la generación de la presentación.' };
    }
  }
}
