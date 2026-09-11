/**
 * Public routes for the nine PDFs retained from the retired platform.
 *
 * These are paths in the new application, never remote URLs. Their source
 * provenance, object names and checksums live in legacy-archive/manifest.json
 * (a private migration record, not a public runtime dependency).
 */
const LEGACY_PUBLICATION_PDF_ROOT = "/uploads/legacy-publications";

export const LEGACY_PUBLICATION_PDF_PATHS = Object.freeze({
  arbitrationGuide: `${LEGACY_PUBLICATION_PDF_ROOT}/iba-mexico-arbitration-guide-2013.pdf`,
  investmentTreaty: `${LEGACY_PUBLICATION_PDF_ROOT}/mexico-investment-treaty.pdf`,
  outsourcing: `${LEGACY_PUBLICATION_PDF_ROOT}/mexico-outsourcing-2013.pdf`,
  miningEsgPartOneAndTwo: `${LEGACY_PUBLICATION_PDF_ROOT}/mining-esg-parts-one-and-two.pdf`,
  arbitrationEsg: `${LEGACY_PUBLICATION_PDF_ROOT}/arbitration-esg.pdf`,
  miningEsgPartThree: `${LEGACY_PUBLICATION_PDF_ROOT}/mining-esg-part-three.pdf`,
  miningEsgPartFour: `${LEGACY_PUBLICATION_PDF_ROOT}/mining-esg-part-four.pdf`,
  antiCorruption: `${LEGACY_PUBLICATION_PDF_ROOT}/vision-combate-corrupcion.pdf`,
  nextBlackSwan: `${LEGACY_PUBLICATION_PDF_ROOT}/preparate-para-el-proximo-cisne.pdf`,
});

const knownPaths = new Set<string>(Object.values(LEGACY_PUBLICATION_PDF_PATHS));

export function isLegacyPublicationPdfPath(value: unknown): value is string {
  return typeof value === "string" && knownPaths.has(value);
}
