import { describe, it, expect, vi, afterEach } from "vitest";
import { legalCouncilService } from "./LegalCouncilService";

// El Consejo Legal hace 3 llamadas a OpenAI por artículo. Este test verifica el
// opt-out de costo: con LEGAL_COUNCIL_ENABLED=false NO se llama a OpenAI y el
// artículo pasa con un veredicto neutral (approved / none).
describe("LegalCouncilService — opt-out de costo", () => {
  afterEach(() => {
    delete process.env.LEGAL_COUNCIL_ENABLED;
    vi.restoreAllMocks();
  });

  it("con LEGAL_COUNCIL_ENABLED=false no llama a OpenAI y devuelve approved/none", async () => {
    process.env.LEGAL_COUNCIL_ENABLED = "false";
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const verdict = await legalCouncilService.evaluateArticle("contenido de prueba");

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(verdict.overallStatus).toBe("approved");
    expect(verdict.riskFlag).toBe("none");
  });
});
