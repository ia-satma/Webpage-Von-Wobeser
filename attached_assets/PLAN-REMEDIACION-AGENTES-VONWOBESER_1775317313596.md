# Plan de Remediacion — Sistema de Agentes Von Wobeser & Sierra

## Contexto
Auditoria runtime del sitio vonwobeser.satma.mx confirmo 5 bugs activos (2 CRITICAL, 3 MEDIUM).
Score actual estimado: 78/100. Target post-fix: ~92/100.

Evidencia recopilada con WebFetch contra produccion live:
- GET /generated-images/article-*-gemini-*.png retorna HTML del SPA, no PNG
- GET /api/agents/status muestra que DALL-E fallo, Gemini genero imagen pero no se sirve
- Website auditor: 2 runs, 0 critical findings (imposible con 165+ paginas, checker fake)
- Jobs de image_suggestion y category_agent corren via queue pero no via /run/ API directa

---

## FIX 1: Imagenes generadas no accesibles (CRITICAL)

**Archivo:** server/routes.ts
**Problema:** /generated-images/*.png retorna HTML del SPA en vez del PNG real. La imagen existe en el filesystem pero el SPA catch-all la intercepta.
**Evidencia:** GET /generated-images/article-8538474c-...-gemini-1775296399015.png devuelve Content-Type: text/html

**Cambio (linea ~209):**

Reemplazar:
```typescript
// Serve AI-generated images with Von Wobeser branding
app.use('/generated-images', express.static(path.join(process.cwd(), 'public', 'generated-images')));
```

Con:
```typescript
// Serve AI-generated images with Von Wobeser branding
const generatedImagesDir = path.join(process.cwd(), 'public', 'generated-images');
if (!fs.existsSync(generatedImagesDir)) {
  fs.mkdirSync(generatedImagesDir, { recursive: true });
}

// Explicit route handler (belt-and-suspenders vs SPA fallback)
app.get('/generated-images/:filename', (req, res) => {
  const filePath = path.join(generatedImagesDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: 'Image not found' });
});

app.use('/generated-images', express.static(generatedImagesDir));
```

fs y path ya estan importados en lineas 7-8, no se necesitan imports nuevos.

**Verificacion:** GET a /generated-images/article-8538474c-2c4b-4beb-b1f9-6a012a04ecf1-gemini-1775296399015.png debe retornar Content-Type: image/png.

---

## FIX 2: DALL-E roto, Gemini como primario (CRITICAL)

**Archivo:** server/services/SmartImageGenerator.ts
**Problema:** generateImage() intenta DALL-E 3 primero (lineas 293-331), falla con error 400, desperdicia ~20s en retries con backoff, y luego cae a Gemini que si funciona.
**Evidencia:** Job 2f4243ad muestra engine: "gemini", retryCount: 2 — los retries fueron DALL-E fallando.

**Cambio en generateImage() (lineas 278-379):**

Reestructurar el cascade completo. Reemplazar todo el metodo generateImage con:

```typescript
async generateImage(originalPrompt: string, articleId: string): Promise<ImageGenerationResult> {
  this.transparencyLog = [];
  this.log(`Starting smart image generation for article ${articleId}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const result: ImageGenerationResult = {
    success: false,
    engine: 'placeholder',
    originalPrompt,
    promptWasSanitized: false,
    retryCount: 0,
    transparencyLog: [],
  };

  const brandEnhancedPrompt = `${originalPrompt}. Style: Professional corporate legal, color scheme featuring deep burgundy red (#AA1A2E) with white and dark gray accents. Sharp geometric edges, no rounded corners. Sophisticated and elegant composition suitable for a prestigious law firm.`;

  // Step 1: Gemini (primary)
  this.log('Step 1: Attempting Gemini image generation (primary)...');
  const geminiResult = await this.callGeminiImageGen(brandEnhancedPrompt);
  result.retryCount++;

  if (geminiResult.buffer) {
    try {
      const filename = `article-${articleId}-gemini-${Date.now()}.png`;
      const outputPath = path.join(OUTPUT_DIR, filename);

      await this.overlayLogo(geminiResult.buffer, outputPath);

      result.success = true;
      result.engine = 'gemini';
      result.imageUrl = `/generated-images/${filename}`;
      this.log(`SUCCESS: Gemini image saved with logo overlay: ${result.imageUrl}`);
    } catch (saveErr: any) {
      this.log(`Gemini image save failed: ${saveErr.message}`);
    }
  } else {
    this.log(`Gemini failed: ${geminiResult.error}. Trying with sanitized prompt...`);

    // Try sanitized prompt with Gemini
    const { sanitized, wasSanitized, changes } = this.sanitizePromptForContentPolicy(originalPrompt);
    if (wasSanitized) {
      result.sanitizedPrompt = sanitized;
      result.promptWasSanitized = true;
      this.log(`Prompt sanitized. Changes: ${changes.join(', ')}`);

      const sanitizedResult = await this.callGeminiImageGen(sanitized);
      result.retryCount++;

      if (sanitizedResult.buffer) {
        try {
          const filename = `article-${articleId}-gemini-${Date.now()}.png`;
          const outputPath = path.join(OUTPUT_DIR, filename);

          await this.overlayLogo(sanitizedResult.buffer, outputPath);

          result.success = true;
          result.engine = 'gemini';
          result.imageUrl = `/generated-images/${filename}`;
          this.log(`SUCCESS: Gemini image (sanitized) saved: ${result.imageUrl}`);
        } catch (saveErr: any) {
          this.log(`Gemini sanitized image save failed: ${saveErr.message}`);
        }
      }
    }
  }

  // Step 2: Placeholder SVG fallback
  if (!result.success) {
    this.log('Step 2: Gemini failed. Assigning placeholder image.');
    result.engine = 'placeholder';
    result.imageUrl = '/placeholder-article.svg';
    result.success = true;
    result.errorMessage = geminiResult.error || 'All image generation engines failed';
  }

  result.transparencyLog = [...this.transparencyLog];

  const summaryLog = result.success
    ? `Image generated using ${result.engine.toUpperCase()}${result.promptWasSanitized ? ' (prompt sanitized for safety)' : ''}`
    : `Image generation failed: ${result.errorMessage}`;

  this.log(summaryLog);

  return result;
}
```

Tambien cambiar el log en callGeminiImageGen (linea 252): de "as fallback" a solo "Attempting Gemini image generation..."

NO borrar callDalle3() — dejarlo intacto por si DALL-E se reactiva en el futuro. Solo se deja de llamar.

**Verificacion:** Trigger image_suggestion. Transparency log debe mostrar "Step 1: Gemini" sin mencion de DALL-E. Tiempo de ejecucion debe bajar de ~25s a ~5s.

---

## FIX 3: SEO Optimizer no persiste slug/excerpt (MEDIUM)

**Archivo:** server/agents/specialized/SEOOptimizerAgent.ts
**Problema:** El agente genera suggestedSlug, metaDescription, metaDescriptionEs pero solo escribe title y titleEs a la DB (lineas 86-98). Los otros campos se tiran.
**Schema confirmado:** slug (text, unique), excerpt (text), excerptEs (text) existen en tabla news.

**Cambio en lineas 86-98:**

Reemplazar el bloque:
```typescript
if (applyChanges && optimization.seoScore > currentSeoScore) {
  const updates: Record<string, unknown> = {};

  if (optimization.optimizedTitle && optimization.optimizedTitle !== article.title) {
    updates.title = optimization.optimizedTitle;
  }
  if (optimization.optimizedTitleEs && optimization.optimizedTitleEs !== article.titleEs) {
    updates.titleEs = optimization.optimizedTitleEs;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(news).set(updates).where(eq(news.id, articleId));
  }
}
```

Con:
```typescript
if (applyChanges && optimization.seoScore > currentSeoScore) {
  const updates: Record<string, unknown> = {};

  if (optimization.optimizedTitle && optimization.optimizedTitle !== article.title) {
    updates.title = optimization.optimizedTitle;
  }
  if (optimization.optimizedTitleEs && optimization.optimizedTitleEs !== article.titleEs) {
    updates.titleEs = optimization.optimizedTitleEs;
  }
  if (optimization.suggestedSlug && optimization.suggestedSlug !== article.slug) {
    // Verify slug uniqueness before applying
    const [existing] = await db.select({ id: news.id }).from(news)
      .where(eq(news.slug, optimization.suggestedSlug));
    if (!existing || existing.id === articleId) {
      updates.slug = optimization.suggestedSlug;
    }
  }
  if (optimization.metaDescription && optimization.metaDescription !== article.excerpt) {
    updates.excerpt = optimization.metaDescription;
  }
  if (optimization.metaDescriptionEs && optimization.metaDescriptionEs !== article.excerptEs) {
    updates.excerptEs = optimization.metaDescriptionEs;
  }

  if (Object.keys(updates).length > 0) {
    await db.update(news).set(updates).where(eq(news.id, articleId));
  }
}
```

**Verificacion:** POST /api/agents/run/seo_optimizer con { "articleId": "<any-id>", "applyChanges": true }. Luego GET el articulo y confirmar que slug, excerpt, excerptEs se actualizaron.

---

## FIX 4: 2 agentes sin route en API directa (MEDIUM)

**Archivo:** server/agents/api/agentRoutes.ts
**Problema:** El switch en /run/:agentType (linea 96) tiene 6 cases pero falta image_suggestion y category_agent. Los agentes estan registrados en el orchestrator y funcionan via queue, pero no via API directa.
**Exports confirmados:** imageSuggestionAgent (ImageSuggestionAgent.ts:154), categoryAgent (CategoryAgent.ts:211).

**Cambio 1 — Agregar imports despues de linea 12:**
```typescript
import { imageSuggestionAgent } from '../specialized/ImageSuggestionAgent';
import { categoryAgent } from '../specialized/CategoryAgent';
```

**Cambio 2 — Agregar cases al switch antes del default (~linea 114):**
```typescript
case 'image_suggestion':
  result = await imageSuggestionAgent.execute(context, payload);
  break;
case 'category_agent':
  result = await categoryAgent.execute(context, payload);
  break;
```

**Verificacion:** POST /api/agents/run/image_suggestion con { "articleId": "<any-id>" }. Debe retornar resultado del agente, no "Unknown agent type".

---

## FIX 5: Link checker fake en Website Auditor (MEDIUM)

**Archivo:** server/agents/specialized/WebsiteAuditorAgent.ts
**Problema:** checkImageUrl() (lineas 634-648) retorna true para cualquier URL que empiece con http:// o https:// sin verificar si realmente existe. Resultado: 0 critical findings en auditorias.
**Evidencia:** 2 auditorias (134 y 228 findings), ambas con 0 critical — estadisticamente imposible en un sitio con 165+ paginas.

**Cambio en lineas 634-648:**

Reemplazar:
```typescript
private async checkImageUrl(url: string): Promise<boolean> {
  try {
    if (url.startsWith('/')) {
      return true;
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}
```

Con:
```typescript
private async checkImageUrl(url: string): Promise<boolean> {
  try {
    if (url.startsWith('/')) return true;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeout);
        return response.ok;
      } catch {
        clearTimeout(timeout);
        return false;
      }
    }
    return false;
  } catch { return false; }
}
```

**Verificacion:** POST /api/agents/audit. Findings deben incluir broken links reales con severity: "critical". El count de critical ya no debe ser 0.

---

## Orden de ejecucion (aplicar uno por uno, testear entre cada fix)

| Paso | Fix | Archivo | Riesgo | Test |
|------|-----|---------|--------|------|
| 1 | FIX 1 | routes.ts | Bajo | GET a imagen existente debe ser PNG |
| 2 | FIX 2 | SmartImageGenerator.ts | Bajo | Generar imagen, log sin DALL-E |
| 3 | FIX 4 | agentRoutes.ts | Bajo | POST /run/image_suggestion funciona |
| 4 | FIX 3 | SEOOptimizerAgent.ts | Bajo | Run SEO, slug/excerpt en DB |
| 5 | FIX 5 | WebsiteAuditorAgent.ts | Bajo | Audit, critical > 0 |

## Notas importantes
- Cada fix es independiente — si uno falla, los demas siguen funcionando
- Ningun fix elimina funcionalidad existente, solo agrega/corrige
- callDalle3() se preserva intacto (solo se deja de llamar) por si se reactiva
- No se tocan schemas de DB, no se necesitan migraciones
- fs y path ya estan importados en routes.ts (lineas 7-8)
- fetch es global en Node 18+ (Replit lo tiene)
