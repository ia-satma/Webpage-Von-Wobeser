/**
 * Curación editorial acotada a los Artículos con extractos defectuosos detectados
 * el 26 de agosto de 2026. Los vacíos intencionales representan “solo fuente”:
 * se conserva la publicación verificable sin inventar un resumen.
 */
export type ArticleSummaryCuration = Readonly<{
  slug: string;
  excerpt: string;
  excerptEs: string;
  sourceUrl: string;
}>;

const legacyPublication = (legacyId: number, language: "en" | "es") =>
  `https://www.vonwobeser.com/index.php/${language === "en" ? "publication" : "publicacion"}/p_id-${legacyId}.html`;

const sourceOnly = (slug: string, sourceUrl: string): ArticleSummaryCuration => ({ slug, sourceUrl, excerpt: "", excerptEs: "" });

const legacySourceOnly = (legacyId: number, language: "en" | "es", slug: string) =>
  sourceOnly(slug, legacyPublication(legacyId, language));

export const ARTICLE_SUMMARY_CURATION_20260826: readonly ArticleSummaryCuration[] = [
  sourceOnly(
    "la-batalla-por-la-independencia-judicial-lecciones-del-sistema-interamericano",
    "https://eljuegodelacorte.nexos.com.mx/la-batalla-por-la-independencia-judicial-lecciones-del-sistema-interamericano/",
  ),
  sourceOnly(
    "daniela-pons-nexos-los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion",
    "https://anticorrupcion.nexos.com.mx/los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion-privada/",
  ),
  sourceOnly(
    "daniela-pons-nexos-los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion-2",
    "https://anticorrupcion.nexos.com.mx/los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion-privada/",
  ),
  legacySourceOnly(1832, "en", "comentarios-sobre-el-delito-de-defraudacion-fiscal-equiparada-relacionada-con-el"),
  legacySourceOnly(1831, "en", "prescripcion-penal-fiscal-thomson-reuters-2015"),
  legacySourceOnly(1830, "en", "politica-criminal-contemporanea-de-la-secretaria-de-hacienda-y-credito-publico-t"),
  legacySourceOnly(1829, "en", "blockchain-y-compliance-mundo-ejecutivo-2023"),
  legacySourceOnly(1828, "en", "la-tokenizacion-de-las-cosas-revista-del-ilustre-y-nacional-colegio-de-abogados-"),
  legacySourceOnly(1827, "en", "el-tratamiento-fiscal-de-las-criptomonedas-thomson-reuters-2022"),
  sourceOnly("las-criptomonedas-y-los-esquemas-ponzi-mit-sloan-2022", "https://mitsloanreview.mx/tag/esquemas-ponzi/"),
  sourceOnly("las-criptomonedas-y-su-transparente-blockchain-periodico-milenio-2021", "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/las-criptomonedas-y-su-transparente-blockchain"),
  legacySourceOnly(1824, "en", "responsabilidad-penal-de-la-empresa-y-del-abogado-thomson-reuters-2020"),
  legacySourceOnly(1823, "en", "el-lavado-de-dinero-y-las-criptomonedas-segunda-parte-thomson-reuters-2021"),
  legacySourceOnly(1822, "en", "el-lavado-de-dinero-y-las-criptomonedas-primera-parte-thomson-reuters-2020"),
  sourceOnly("el-concepto-de-organizacion-en-delincuencia-organizada-y-crimenes-de-lesa-humani", "https://www.aranzadilaley.es/tienda/todo-penal-internacional"),
  sourceOnly("la-evasion-fiscal-una-forma-de-corrupcion-periodico-milenio-2020", "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/la-evasion-fiscal-una-forma-de-corrupcion"),
  legacySourceOnly(1819, "en", "los-jueces-deben-pensar-en-las-victimas-periodico-milenio-2020"),
  sourceOnly("no-hay-crimen-perfecto-periodico-milenio-2020", "https://www.milenio.com/politica/lee-firmas-milenio-jueves-16-julio"),
  legacySourceOnly(1817, "es", "comentarios-sobre-el-delito-de-defraudacion-fiscal-equiparada-relacionada-con-el-2"),
  legacySourceOnly(1816, "es", "prescripcion-penal-fiscal-thomson-reuters-2015-2"),
  legacySourceOnly(1815, "es", "politica-criminal-contemporanea-de-la-secretaria-de-hacienda-y-credito-publico-t-2"),
  legacySourceOnly(1814, "es", "blockchain-y-compliance-mundo-ejecutivo-2023-2"),
  legacySourceOnly(1813, "es", "la-tokenizacion-de-las-cosas-revista-del-ilustre-y-nacional-colegio-de-abogados--2"),
  legacySourceOnly(1812, "es", "el-tratamiento-fiscal-de-las-criptomonedas-thomson-reuters-2022-2"),
  sourceOnly("las-criptomonedas-y-los-esquemas-ponzi-mit-sloan-2022-2", "https://mitsloanreview.mx/tag/esquemas-ponzi/"),
  sourceOnly("las-criptomonedas-y-su-transparente-blockchain-periodico-milenio-2021-2", "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/las-criptomonedas-y-su-transparente-blockchain"),
  legacySourceOnly(1809, "es", "responsabilidad-penal-de-la-empresa-y-del-abogado-thomson-reuters-2020-2"),
  legacySourceOnly(1808, "es", "el-lavado-de-dinero-y-las-criptomonedas-segunda-parte-thomson-reuters-2021-2"),
  legacySourceOnly(1807, "es", "el-lavado-de-dinero-y-las-criptomonedas-primera-parte-thomson-reuters-2020-2"),
  sourceOnly("el-concepto-de-organizacion-en-delincuencia-organizada-y-crimenes-de-lesa-humani-2", "https://www.aranzadilaley.es/tienda/todo-penal-internacional"),
  sourceOnly("la-evasion-fiscal-una-forma-de-corrupcion-periodico-milenio-2020-2", "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/la-evasion-fiscal-una-forma-de-corrupcion"),
  legacySourceOnly(1804, "es", "los-jueces-deben-pensar-en-las-victimas-periodico-milenio-2020-2"),
  sourceOnly("no-hay-crimen-perfecto-periodico-milenio-2020-2", "https://www.milenio.com/politica/lee-firmas-milenio-jueves-16-julio"),
  sourceOnly(
    "the-new-advertising-rules-for-prepackaged-foods",
    "https://eljuegodelacorte.nexos.com.mx/que-culpa-tiene-el-tigre-tono-las-nuevas-reglas-de-publicidad-en-alimentos-preenvasados/",
  ),
  sourceOnly(
    "las-nuevas-reglas-de-publicidad-en-alimentos-preenvasados",
    "https://eljuegodelacorte.nexos.com.mx/que-culpa-tiene-el-tigre-tono-las-nuevas-reglas-de-publicidad-en-alimentos-preenvasados/",
  ),
  {
    slug: "esg-en-la-industria-minera-mexicana-cuarta-parte",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2023/ESG4/23_05_22_MINERIA_ESG_ENG-Pt4-OK.pdf",
    excerpt: "This installment examines how greenhouse-gas emissions and energy efficiency shape the environmental dimension of ESG criteria in mining. It addresses ways projects can demonstrate the sustainability of their emissions.",
    excerptEs: "Esta entrega examina cómo las emisiones de gases de efecto invernadero y la eficiencia energética inciden en la dimensión ambiental de los criterios ESG en la minería. Aborda alternativas para que los proyectos acrediten la sostenibilidad de sus emisiones.",
  },
  {
    slug: "esg-in-the-mexican-mining-industry-part-four",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2023/ESG4/23_05_22_MINERIA_ESG_ENG-Pt4-OK.pdf",
    excerpt: "This installment examines how greenhouse-gas emissions and energy efficiency shape the environmental dimension of ESG criteria in mining. It addresses ways projects can demonstrate the sustainability of their emissions.",
    excerptEs: "Esta entrega examina cómo las emisiones de gases de efecto invernadero y la eficiencia energética inciden en la dimensión ambiental de los criterios ESG en la minería. Aborda alternativas para que los proyectos acrediten la sostenibilidad de sus emisiones.",
  },
  sourceOnly("una-vision-interdisciplinaria-en-el-combate-a-la-corrupcion-2", "https://www.vonwobeser.com/images/PDF_news/2023/vision_combate.pdf"),
  sourceOnly("una-vision-interdisciplinaria-en-el-combate-a-la-corrupcion", "https://www.vonwobeser.com/images/PDF_news/2023/vision_combate.pdf"),
  {
    slug: "esg-en-la-industria-minera-mexicana-tercera-parte",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2022/22_08_11_ESG_En-la-Industria-Minera-Mexicana-3_ENG.pdf",
    excerpt: "Part three reviews the four remaining environmental areas of the Responsible Mining Index for the mining industry. It examines risks and practices including operational noise and vibration.",
    excerptEs: "La tercera parte revisa los cuatro ejes ambientales restantes del Responsible Mining Index para la industria minera. Analiza riesgos y prácticas vinculados, entre otros aspectos, con el ruido y las vibraciones durante la operación.",
  },
  {
    slug: "esg-in-the-mexican-mining-industry-part-three",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2022/22_08_11_ESG_En-la-Industria-Minera-Mexicana-3_ENG.pdf",
    excerpt: "Part three reviews the four remaining environmental areas of the Responsible Mining Index for the mining industry. It examines risks and practices including operational noise and vibration.",
    excerptEs: "La tercera parte revisa los cuatro ejes ambientales restantes del Responsible Mining Index para la industria minera. Analiza riesgos y prácticas vinculados, entre otros aspectos, con el ruido y las vibraciones durante la operación.",
  },
  sourceOnly("preparate-para-el-proximo-cisne-2", "https://www.vonwobeser.com/images/PDF/2022/Preparate_Para_el_Proximo_Cisne1.pdf"),
  sourceOnly("preparate-para-el-proximo-cisne", "https://www.vonwobeser.com/images/PDF/2022/Preparate_Para_el_Proximo_Cisne1.pdf"),
  {
    slug: "esg-en-la-industria-minera-mexicana-segunda-parte",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2021/21_10_12_MINERIA_ESG_ING.pdf",
    excerpt: "Part two addresses mining’s economic relevance and the environmental impacts associated with its operation. It introduces the first environmental best-practice areas of the Responsible Mining Index.",
    excerptEs: "Esta segunda parte aborda la importancia económica de la minería y los impactos ambientales asociados a su operación. Presenta los primeros ejes de mejores prácticas ambientales del Responsible Mining Index.",
  },
  {
    slug: "esg-in-the-mexican-mining-industry-part-two",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2021/21_10_12_MINERIA_ESG_ING.pdf",
    excerpt: "Part two addresses mining’s economic relevance and the environmental impacts associated with its operation. It introduces the first environmental best-practice areas of the Responsible Mining Index.",
    excerptEs: "Esta segunda parte aborda la importancia económica de la minería y los impactos ambientales asociados a su operación. Presenta los primeros ejes de mejores prácticas ambientales del Responsible Mining Index.",
  },
  {
    slug: "el-rol-del-arbitraje-en-disputas-esg",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2021/21_11_12_ARBITRAJE_ESG_ING.pdf",
    excerpt: "The article examines the growing presence of ESG criteria in commercial and investment disputes. It explains how climate change, human rights and corporate responsibility are reflected in arbitration.",
    excerptEs: "El artículo examina la creciente presencia de criterios ESG en disputas comerciales y de inversión. Explica cómo el cambio climático, los derechos humanos y la responsabilidad empresarial se reflejan en el arbitraje.",
  },
  {
    slug: "the-role-of-arbitration-in-esg-disputes",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2021/21_11_12_ARBITRAJE_ESG_ING.pdf",
    excerpt: "The article examines the growing presence of ESG criteria in commercial and investment disputes. It explains how climate change, human rights and corporate responsibility are reflected in arbitration.",
    excerptEs: "El artículo examina la creciente presencia de criterios ESG en disputas comerciales y de inversión. Explica cómo el cambio climático, los derechos humanos y la responsabilidad empresarial se reflejan en el arbitraje.",
  },
  {
    slug: "esg-en-la-industria-minera-mexicana-primera-parte",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2021/21_10_12_MINERIA_ESG_ING.pdf",
    excerpt: "Part one introduces the evolution of ESG criteria and their relevance to the mining industry. It explains why companies must integrate environmental and social factors alongside financial results.",
    excerptEs: "La primera parte introduce la evolución de los criterios ESG y su relevancia para la industria minera. Expone por qué las empresas deben integrar factores ambientales y sociales además de los resultados financieros.",
  },
  {
    slug: "esg-in-the-mexican-mining-industry-first-section",
    sourceUrl: "https://www.vonwobeser.com/images/PDF_news/2021/21_10_12_MINERIA_ESG_ING.pdf",
    excerpt: "Part one introduces the evolution of ESG criteria and their relevance to the mining industry. It explains why companies must integrate environmental and social factors alongside financial results.",
    excerptEs: "La primera parte introduce la evolución de los criterios ESG y su relevancia para la industria minera. Expone por qué las empresas deben integrar factores ambientales y sociales además de los resultados financieros.",
  },
  sourceOnly("claus-von-wobeser-adrian-magallanes-getting-the-deal-through-investment-treaty-m", "https://www.vonwobeser.com/images/PDF_news/PDF_articles/2013/45-MexicoInvestmentTreaty.pdf"),
  sourceOnly("claus-von-wobeser-adrian-magallanes-getting-the-deal-through-investment-treaty-m-2", "https://www.vonwobeser.com/images/PDF_news/PDF_articles/2013/45-MexicoInvestmentTreaty.pdf"),
  sourceOnly("rodolfo-trampe-jorge-diaz-jose-palomar-getting-the-deal-through-outsourcing-mexi-2", "https://www.vonwobeser.com/images/PDF_news/2015/MexicoOutsourcingNov2013.pdf"),
  sourceOnly("rodolfo-trampe-jorge-diaz-jose-palomar-getting-the-deal-through-outsourcing-mexi", "https://www.vonwobeser.com/images/PDF_news/2015/MexicoOutsourcingNov2013.pdf"),
  sourceOnly("claus-von-wobeser-international-bar-association-guide-iba-arbitration-guide-mexi", "https://www.vonwobeser.com/images/PDF_news/2015/IBAMexicoChapterInternationalArbitrationGuide2013.pdf"),
  sourceOnly("claus-von-wobeser-international-bar-association-iba-guia-de-arbitraje-en-mexico", "https://www.vonwobeser.com/images/PDF_news/2015/IBAMexicoChapterInternationalArbitrationGuide2013.pdf"),
];

if (ARTICLE_SUMMARY_CURATION_20260826.length !== 55) {
  throw new Error(`Expected 55 curated Articles, found ${ARTICLE_SUMMARY_CURATION_20260826.length}.`);
}

if (new Set(ARTICLE_SUMMARY_CURATION_20260826.map((entry) => entry.slug)).size !== ARTICLE_SUMMARY_CURATION_20260826.length) {
  throw new Error("Article summary curation contains duplicate slugs.");
}
