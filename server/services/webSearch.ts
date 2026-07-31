import { getImageClient, getTextModel, hasDedicatedImageClient } from '../openai';

/**
 * Búsqueda web con la herramienta NATIVA de OpenAI (Responses API + tool `web_search`).
 * Usa la API key REAL de OpenAI (la misma dedicada a imágenes; el proxy de Replit NO soporta
 * herramientas ni la Responses API, por eso se pega contra api.openai.com).
 *
 * Devuelve un resumen con datos + fuentes, o '' si no hay key real o la llamada falla — el
 * llamador decide qué hacer con la cadena vacía (seguir solo con el material compartido).
 */
export async function webSearchSummary(query: string): Promise<string> {
  const q = (query || '').trim();
  if (!q) return '';
  if (!hasDedicatedImageClient()) {
    console.warn('[webSearch] Sin API key real de OpenAI (OPENAI_IMAGE_API_KEY/OPENAI_API_KEY) → búsqueda web omitida.');
    return '';
  }
  try {
    const client: any = getImageClient();
    const res: any = await client.responses.create({
      model: process.env.OPENAI_SEARCH_MODEL || getTextModel(),
      tools: [{ type: 'web_search' }],
      input:
        `Investiga en la web información RECIENTE y verificable sobre: ${q}. ` +
        `Devuelve un resumen conciso (máximo ~400 palabras) con datos, cifras y hechos concretos, ` +
        `y al final una lista de FUENTES (título + URL). Si no encuentras información relevante, dilo claramente.`,
    });
    // output_text es el atajo del SDK; si no viene, se arma desde output[].content[].text.
    const text: string =
      res?.output_text ||
      (Array.isArray(res?.output)
        ? res.output
            .map((o: any) => (Array.isArray(o?.content) ? o.content.map((c: any) => c?.text || '').join('') : ''))
            .join('\n')
        : '');
    return (text || '').trim();
  } catch (e: any) {
    console.warn('[webSearch] falló:', e?.message || e);
    return '';
  }
}
