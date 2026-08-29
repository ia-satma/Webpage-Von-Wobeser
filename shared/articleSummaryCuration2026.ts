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
  /** URLs de la curación anterior que pueden sustituirse de forma segura por la fuente directa. */
  replaceableSourceUrls?: readonly string[];
}>;

const legacyPublication = (legacyId: number, language: "en" | "es") =>
  `https://www.vonwobeser.com/index.php/${language === "en" ? "publication" : "publicacion"}?p_id=${legacyId}`;

const sourceOnly = (slug: string, sourceUrl: string): ArticleSummaryCuration => ({ slug, sourceUrl, excerpt: "", excerptEs: "" });

const summary = (
  slug: string,
  sourceUrl: string,
  excerpt: string,
  excerptEs: string,
  replaceableSourceUrls?: readonly string[],
): ArticleSummaryCuration => ({
  slug,
  sourceUrl,
  excerpt,
  excerptEs,
  ...(replaceableSourceUrls ? { replaceableSourceUrls } : {}),
});

const legacySourceOnly = (legacyId: number, language: "en" | "es", slug: string) =>
  sourceOnly(slug, legacyPublication(legacyId, language));

export const ARTICLE_SUMMARY_CURATION_20260826: readonly ArticleSummaryCuration[] = [
  summary(
    "la-batalla-por-la-independencia-judicial-lecciones-del-sistema-interamericano",
    "https://eljuegodelacorte.nexos.com.mx/la-batalla-por-la-independencia-judicial-lecciones-del-sistema-interamericano/",
    "The article reviews the Inter-American Court's decision in Gutiérrez Navas et al. v. Honduras, where the arbitrary removal of constitutional judges was held to violate judicial independence. It draws lessons for preserving judicial tenure, due process and the separation of powers in Mexico.",
    "El texto revisa la sentencia Gutiérrez Navas y otros vs. Honduras de la Corte Interamericana, que consideró que la destitución arbitraria de magistrados vulneró la independencia judicial. Extrae lecciones para proteger la estabilidad de los juzgadores, el debido proceso y la división de poderes en México.",
  ),
  summary(
    "daniela-pons-nexos-los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion",
    "https://anticorrupcion.nexos.com.mx/los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion-privada/",
    "The authors argue that businesses benefit from combating private corruption through substantive integrity policies, internal controls and accountability. These measures can reduce losses, strengthen operations and allow affected companies to seek redress.",
    "Las autoras sostienen que las empresas se benefician de combatir la corrupción privada mediante políticas de integridad sustantivas, controles internos y rendición de cuentas. Estas medidas pueden reducir pérdidas, fortalecer operaciones y permitir a las empresas afectadas reclamar la reparación del daño.",
  ),
  summary(
    "daniela-pons-nexos-los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion-2",
    "https://anticorrupcion.nexos.com.mx/los-empresarios-son-beneficiarios-del-combate-a-la-corrupcion-privada/",
    "The authors argue that businesses benefit from combating private corruption through substantive integrity policies, internal controls and accountability. These measures can reduce losses, strengthen operations and allow affected companies to seek redress.",
    "Las autoras sostienen que las empresas se benefician de combatir la corrupción privada mediante políticas de integridad sustantivas, controles internos y rendición de cuentas. Estas medidas pueden reducir pérdidas, fortalecer operaciones y permitir a las empresas afectadas reclamar la reparación del daño.",
  ),
  legacySourceOnly(1832, "en", "comentarios-sobre-el-delito-de-defraudacion-fiscal-equiparada-relacionada-con-el"),
  legacySourceOnly(1831, "en", "prescripcion-penal-fiscal-thomson-reuters-2015"),
  legacySourceOnly(1830, "en", "politica-criminal-contemporanea-de-la-secretaria-de-hacienda-y-credito-publico-t"),
  summary(
    "blockchain-y-compliance-mundo-ejecutivo-2023",
    "https://mundoejecutivo.com.mx/economia/blockchain-compliance-evolucion-cumplimiento/",
    "It explores blockchain as an immutable, decentralized record for documenting compliance evidence and limiting the manipulation or concealment of relevant information. It describes a Mexican pharmaceutical-sector implementation to register reports, transactions, events and complaints.",
    "Explora blockchain como un registro inalterable y descentralizado para documentar evidencia de cumplimiento y limitar la manipulación u ocultamiento de información relevante. Describe una implementación en el sector farmacéutico mexicano para registrar reportes, transacciones, eventos y quejas.",
    [legacyPublication(1829, "en")],
  ),
  legacySourceOnly(1828, "en", "la-tokenizacion-de-las-cosas-revista-del-ilustre-y-nacional-colegio-de-abogados-"),
  legacySourceOnly(1827, "en", "el-tratamiento-fiscal-de-las-criptomonedas-thomson-reuters-2022"),
  summary(
    "las-criptomonedas-y-los-esquemas-ponzi-mit-sloan-2022",
    "https://mitsloanreview.mx/nft-bitcoin-crypto-blockchain/como-prevenir-fraudes-con-criptomonedas/",
    "The piece explains how Ponzi and pyramid schemes exploit interest in cryptoassets, often by offering purported high returns without a genuine underlying investment. It highlights regulatory coordination, user education and transaction-tracing tools as safeguards against fraud.",
    "El texto explica cómo los esquemas Ponzi y piramidales aprovechan el interés por los criptoactivos, con frecuencia al ofrecer rendimientos elevados sin una inversión subyacente real. Destaca la coordinación regulatoria, la educación de las personas usuarias y las herramientas de rastreo como salvaguardas frente al fraude.",
    ["https://mitsloanreview.mx/tag/esquemas-ponzi/"],
  ),
  summary(
    "las-criptomonedas-y-su-transparente-blockchain-periodico-milenio-2021",
    "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/las-criptomonedas-y-su-transparente-blockchain",
    "It explains how public blockchain records make cryptocurrency transactions traceable, even though wallet holders may not be immediately identified. The article describes how that transparency can assist investigations and the tracing of illicit funds.",
    "Explica cómo los registros públicos de blockchain hacen rastreables las transacciones con criptomonedas, aun cuando las personas titulares de las carteras no se identifiquen de inmediato. El artículo describe cómo esa transparencia puede apoyar investigaciones y el seguimiento de recursos ilícitos.",
  ),
  legacySourceOnly(1824, "en", "responsabilidad-penal-de-la-empresa-y-del-abogado-thomson-reuters-2020"),
  legacySourceOnly(1823, "en", "el-lavado-de-dinero-y-las-criptomonedas-segunda-parte-thomson-reuters-2021"),
  legacySourceOnly(1822, "en", "el-lavado-de-dinero-y-las-criptomonedas-primera-parte-thomson-reuters-2020"),
  sourceOnly("el-concepto-de-organizacion-en-delincuencia-organizada-y-crimenes-de-lesa-humani", "https://www.aranzadilaley.es/tienda/todo-penal-internacional"),
  summary(
    "la-evasion-fiscal-una-forma-de-corrupcion-periodico-milenio-2020",
    "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/la-evasion-fiscal-una-forma-de-corrupcion",
    "The article frames tax evasion as a form of corruption because it diverts resources intended for public spending to private benefit. It links tax contributions to shared services and collective welfare.",
    "El artículo presenta la evasión fiscal como una forma de corrupción porque desvía a beneficio privado recursos destinados al gasto público. Vincula las contribuciones fiscales con los servicios compartidos y el bienestar colectivo.",
  ),
  summary(
    "los-jueces-deben-pensar-en-las-victimas-periodico-milenio-2020",
    "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/los-jueces-deben-pensar-en-las-victimas",
    "It questions judicial criteria that exclude financial information from criminal investigations on privacy grounds, arguing they can leave victims unprotected. It calls for criminal proceedings to prioritize truth, repair and the protection of victims over formalism.",
    "Cuestiona criterios judiciales que excluyen información financiera de investigaciones penales por motivos de privacidad, al considerar que pueden dejar desprotegidas a las víctimas. Propone que el proceso penal privilegie la verdad, la reparación y la protección de las víctimas sobre el formalismo.",
    [legacyPublication(1819, "en")],
  ),
  summary(
    "no-hay-crimen-perfecto-periodico-milenio-2020",
    "https://www.milenio.com/politica/lee-firmas-milenio-jueves-16-julio",
    "The column explains that fictitious companies and layered schemes used in tax evasion leave financial trails that investigators can follow. It argues that greed and the movement of resources ultimately create evidence against those responsible.",
    "La columna explica que las empresas fantasma y los esquemas por capas usados en la evasión fiscal dejan rastros financieros que las autoridades pueden seguir. Sostiene que la ambición y el movimiento de recursos terminan por generar evidencia contra las personas responsables.",
  ),
  legacySourceOnly(1817, "es", "comentarios-sobre-el-delito-de-defraudacion-fiscal-equiparada-relacionada-con-el-2"),
  legacySourceOnly(1816, "es", "prescripcion-penal-fiscal-thomson-reuters-2015-2"),
  legacySourceOnly(1815, "es", "politica-criminal-contemporanea-de-la-secretaria-de-hacienda-y-credito-publico-t-2"),
  summary(
    "blockchain-y-compliance-mundo-ejecutivo-2023-2",
    "https://mundoejecutivo.com.mx/economia/blockchain-compliance-evolucion-cumplimiento/",
    "It explores blockchain as an immutable, decentralized record for documenting compliance evidence and limiting the manipulation or concealment of relevant information. It describes a Mexican pharmaceutical-sector implementation to register reports, transactions, events and complaints.",
    "Explora blockchain como un registro inalterable y descentralizado para documentar evidencia de cumplimiento y limitar la manipulación u ocultamiento de información relevante. Describe una implementación en el sector farmacéutico mexicano para registrar reportes, transacciones, eventos y quejas.",
    [legacyPublication(1814, "es")],
  ),
  legacySourceOnly(1813, "es", "la-tokenizacion-de-las-cosas-revista-del-ilustre-y-nacional-colegio-de-abogados--2"),
  legacySourceOnly(1812, "es", "el-tratamiento-fiscal-de-las-criptomonedas-thomson-reuters-2022-2"),
  summary(
    "las-criptomonedas-y-los-esquemas-ponzi-mit-sloan-2022-2",
    "https://mitsloanreview.mx/nft-bitcoin-crypto-blockchain/como-prevenir-fraudes-con-criptomonedas/",
    "The piece explains how Ponzi and pyramid schemes exploit interest in cryptoassets, often by offering purported high returns without a genuine underlying investment. It highlights regulatory coordination, user education and transaction-tracing tools as safeguards against fraud.",
    "El texto explica cómo los esquemas Ponzi y piramidales aprovechan el interés por los criptoactivos, con frecuencia al ofrecer rendimientos elevados sin una inversión subyacente real. Destaca la coordinación regulatoria, la educación de las personas usuarias y las herramientas de rastreo como salvaguardas frente al fraude.",
    ["https://mitsloanreview.mx/tag/esquemas-ponzi/"],
  ),
  summary(
    "las-criptomonedas-y-su-transparente-blockchain-periodico-milenio-2021-2",
    "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/las-criptomonedas-y-su-transparente-blockchain",
    "It explains how public blockchain records make cryptocurrency transactions traceable, even though wallet holders may not be immediately identified. The article describes how that transparency can assist investigations and the tracing of illicit funds.",
    "Explica cómo los registros públicos de blockchain hacen rastreables las transacciones con criptomonedas, aun cuando las personas titulares de las carteras no se identifiquen de inmediato. El artículo describe cómo esa transparencia puede apoyar investigaciones y el seguimiento de recursos ilícitos.",
  ),
  legacySourceOnly(1809, "es", "responsabilidad-penal-de-la-empresa-y-del-abogado-thomson-reuters-2020-2"),
  legacySourceOnly(1808, "es", "el-lavado-de-dinero-y-las-criptomonedas-segunda-parte-thomson-reuters-2021-2"),
  legacySourceOnly(1807, "es", "el-lavado-de-dinero-y-las-criptomonedas-primera-parte-thomson-reuters-2020-2"),
  sourceOnly("el-concepto-de-organizacion-en-delincuencia-organizada-y-crimenes-de-lesa-humani-2", "https://www.aranzadilaley.es/tienda/todo-penal-internacional"),
  summary(
    "la-evasion-fiscal-una-forma-de-corrupcion-periodico-milenio-2020-2",
    "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/la-evasion-fiscal-una-forma-de-corrupcion",
    "The article frames tax evasion as a form of corruption because it diverts resources intended for public spending to private benefit. It links tax contributions to shared services and collective welfare.",
    "El artículo presenta la evasión fiscal como una forma de corrupción porque desvía a beneficio privado recursos destinados al gasto público. Vincula las contribuciones fiscales con los servicios compartidos y el bienestar colectivo.",
  ),
  summary(
    "los-jueces-deben-pensar-en-las-victimas-periodico-milenio-2020-2",
    "https://www.milenio.com/opinion/ricardo-cacho/columna-ricardo-cacho/los-jueces-deben-pensar-en-las-victimas",
    "It questions judicial criteria that exclude financial information from criminal investigations on privacy grounds, arguing they can leave victims unprotected. It calls for criminal proceedings to prioritize truth, repair and the protection of victims over formalism.",
    "Cuestiona criterios judiciales que excluyen información financiera de investigaciones penales por motivos de privacidad, al considerar que pueden dejar desprotegidas a las víctimas. Propone que el proceso penal privilegie la verdad, la reparación y la protección de las víctimas sobre el formalismo.",
    [legacyPublication(1804, "es")],
  ),
  summary(
    "no-hay-crimen-perfecto-periodico-milenio-2020-2",
    "https://www.milenio.com/politica/lee-firmas-milenio-jueves-16-julio",
    "The column explains that fictitious companies and layered schemes used in tax evasion leave financial trails that investigators can follow. It argues that greed and the movement of resources ultimately create evidence against those responsible.",
    "La columna explica que las empresas fantasma y los esquemas por capas usados en la evasión fiscal dejan rastros financieros que las autoridades pueden seguir. Sostiene que la ambición y el movimiento de recursos terminan por generar evidencia contra las personas responsables.",
  ),
  summary(
    "the-new-advertising-rules-for-prepackaged-foods",
    "https://eljuegodelacorte.nexos.com.mx/que-culpa-tiene-el-tigre-tono-las-nuevas-reglas-de-publicidad-en-alimentos-preenvasados/",
    "The article reviews Mexico's 2023 prohibition on using animated characters to advertise products with warning labels. It assesses the measure under a proportionality test, weighing public-health aims against commercial expression and freedom of trade.",
    "El artículo revisa la prohibición mexicana de 2023 de usar personajes animados para anunciar productos con sellos de advertencia. Evalúa la medida mediante un test de proporcionalidad, al ponderar los fines de salud pública frente a la expresión comercial y la libertad de comercio.",
  ),
  summary(
    "las-nuevas-reglas-de-publicidad-en-alimentos-preenvasados",
    "https://eljuegodelacorte.nexos.com.mx/que-culpa-tiene-el-tigre-tono-las-nuevas-reglas-de-publicidad-en-alimentos-preenvasados/",
    "The article reviews Mexico's 2023 prohibition on using animated characters to advertise products with warning labels. It assesses the measure under a proportionality test, weighing public-health aims against commercial expression and freedom of trade.",
    "El artículo revisa la prohibición mexicana de 2023 de usar personajes animados para anunciar productos con sellos de advertencia. Evalúa la medida mediante un test de proporcionalidad, al ponderar los fines de salud pública frente a la expresión comercial y la libertad de comercio.",
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
  summary(
    "una-vision-interdisciplinaria-en-el-combate-a-la-corrupcion-2",
    "https://www.vonwobeser.com/images/PDF_news/2023/vision_combate.pdf",
    "This UNAM collective volume brings together interdisciplinary analyses of corruption in Mexico, from the National Anti-Corruption System and public contracting to transparency, accountability, competition and prevention.",
    "Este volumen colectivo de la UNAM reúne análisis interdisciplinarios sobre la corrupción en México, desde el Sistema Nacional Anticorrupción y las contrataciones públicas hasta la transparencia, la rendición de cuentas, la competencia y la prevención.",
  ),
  summary(
    "una-vision-interdisciplinaria-en-el-combate-a-la-corrupcion",
    "https://www.vonwobeser.com/images/PDF_news/2023/vision_combate.pdf",
    "This UNAM collective volume brings together interdisciplinary analyses of corruption in Mexico, from the National Anti-Corruption System and public contracting to transparency, accountability, competition and prevention.",
    "Este volumen colectivo de la UNAM reúne análisis interdisciplinarios sobre la corrupción en México, desde el Sistema Nacional Anticorrupción y las contrataciones públicas hasta la transparencia, la rendición de cuentas, la competencia y la prevención.",
  ),
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
  summary(
    "preparate-para-el-proximo-cisne-2",
    "https://www.vonwobeser.com/images/PDF/2022/Preparate_Para_el_Proximo_Cisne1.pdf",
    "The article treats climate change as a major systemic risk and argues that organizations should prioritize strategies to address it. It presents ESG management as a tool to identify, monitor and communicate related risks and opportunities.",
    "El artículo aborda el cambio climático como un riesgo sistémico relevante y sostiene que las organizaciones deben priorizar estrategias para enfrentarlo. Presenta la gestión ESG como una herramienta para identificar, monitorear y comunicar los riesgos y oportunidades relacionados.",
  ),
  summary(
    "preparate-para-el-proximo-cisne",
    "https://www.vonwobeser.com/images/PDF/2022/Preparate_Para_el_Proximo_Cisne1.pdf",
    "The article treats climate change as a major systemic risk and argues that organizations should prioritize strategies to address it. It presents ESG management as a tool to identify, monitor and communicate related risks and opportunities.",
    "El artículo aborda el cambio climático como un riesgo sistémico relevante y sostiene que las organizaciones deben priorizar estrategias para enfrentarlo. Presenta la gestión ESG como una herramienta para identificar, monitorear y comunicar los riesgos y oportunidades relacionados.",
  ),
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
  summary(
    "claus-von-wobeser-adrian-magallanes-getting-the-deal-through-investment-treaty-m",
    "https://www.vonwobeser.com/images/PDF_news/PDF_articles/2013/45-MexicoInvestmentTreaty.pdf",
    "This country guide outlines Mexico's foreign-investment framework, including treaties, domestic rules, sector restrictions and routes for resolving investor-state disputes. It also covers institutions involved in investment promotion and regulation.",
    "Esta guía de país presenta el marco mexicano de inversión extranjera, incluidos los tratados, las reglas internas, las restricciones sectoriales y las vías para resolver controversias entre inversionistas y el Estado. También aborda las instituciones encargadas de promover y regular la inversión.",
  ),
  summary(
    "claus-von-wobeser-adrian-magallanes-getting-the-deal-through-investment-treaty-m-2",
    "https://www.vonwobeser.com/images/PDF_news/PDF_articles/2013/45-MexicoInvestmentTreaty.pdf",
    "This country guide outlines Mexico's foreign-investment framework, including treaties, domestic rules, sector restrictions and routes for resolving investor-state disputes. It also covers institutions involved in investment promotion and regulation.",
    "Esta guía de país presenta el marco mexicano de inversión extranjera, incluidos los tratados, las reglas internas, las restricciones sectoriales y las vías para resolver controversias entre inversionistas y el Estado. También aborda las instituciones encargadas de promover y regular la inversión.",
  ),
  summary(
    "rodolfo-trampe-jorge-diaz-jose-palomar-getting-the-deal-through-outsourcing-mexi-2",
    "https://www.vonwobeser.com/images/PDF_news/2015/MexicoOutsourcingNov2013.pdf",
    "This guide distinguishes specialized outsourcing services from personnel subcontracting in Mexico and reviews their legal consequences. It surveys applicable labor, civil and sector-specific rules, including risks of employer liability.",
    "Esta guía distingue los servicios especializados de outsourcing de la subcontratación de personal en México y revisa sus consecuencias jurídicas. Examina reglas laborales, civiles y sectoriales aplicables, incluidos los riesgos de responsabilidad para la empresa beneficiaria.",
  ),
  summary(
    "rodolfo-trampe-jorge-diaz-jose-palomar-getting-the-deal-through-outsourcing-mexi",
    "https://www.vonwobeser.com/images/PDF_news/2015/MexicoOutsourcingNov2013.pdf",
    "This guide distinguishes specialized outsourcing services from personnel subcontracting in Mexico and reviews their legal consequences. It surveys applicable labor, civil and sector-specific rules, including risks of employer liability.",
    "Esta guía distingue los servicios especializados de outsourcing de la subcontratación de personal en México y revisa sus consecuencias jurídicas. Examina reglas laborales, civiles y sectoriales aplicables, incluidos los riesgos de responsabilidad para la empresa beneficiaria.",
  ),
  summary(
    "claus-von-wobeser-international-bar-association-guide-iba-arbitration-guide-mexi",
    "https://www.vonwobeser.com/images/PDF_news/2015/IBAMexicoChapterInternationalArbitrationGuide2013.pdf",
    "This guide describes the legal framework and practice of arbitration in Mexico, addressing agreements, arbitrability, appointment of arbitrators, evidence, awards and enforcement. It covers domestic and international proceedings under the Mexican Commerce Code and applicable conventions.",
    "Esta guía describe el marco jurídico y la práctica del arbitraje en México, incluidos los convenios arbitrales, la arbitrabilidad, el nombramiento de árbitros, la prueba, los laudos y su ejecución. Abarca procedimientos nacionales e internacionales conforme al Código de Comercio y los convenios aplicables.",
  ),
  summary(
    "claus-von-wobeser-international-bar-association-iba-guia-de-arbitraje-en-mexico",
    "https://www.vonwobeser.com/images/PDF_news/2015/IBAMexicoChapterInternationalArbitrationGuide2013.pdf",
    "This guide describes the legal framework and practice of arbitration in Mexico, addressing agreements, arbitrability, appointment of arbitrators, evidence, awards and enforcement. It covers domestic and international proceedings under the Mexican Commerce Code and applicable conventions.",
    "Esta guía describe el marco jurídico y la práctica del arbitraje en México, incluidos los convenios arbitrales, la arbitrabilidad, el nombramiento de árbitros, la prueba, los laudos y su ejecución. Abarca procedimientos nacionales e internacionales conforme al Código de Comercio y los convenios aplicables.",
  ),
];

if (ARTICLE_SUMMARY_CURATION_20260826.length !== 55) {
  throw new Error(`Expected 55 curated Articles, found ${ARTICLE_SUMMARY_CURATION_20260826.length}.`);
}

if (new Set(ARTICLE_SUMMARY_CURATION_20260826.map((entry) => entry.slug)).size !== ARTICLE_SUMMARY_CURATION_20260826.length) {
  throw new Error("Article summary curation contains duplicate slugs.");
}
