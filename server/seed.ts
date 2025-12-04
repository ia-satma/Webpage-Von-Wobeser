import { db } from "./db";
import { news, officeImages, practiceGroups, industryGroups, teamMembers, representativeMatters, adminUsers } from "@shared/schema";
import { hashPassword } from "./auth";

const practiceGroupsData = [
  { 
    name: "Corporate, Mergers & Acquisitions", 
    nameEs: "Corporativo, Fusiones y Adquisiciones", 
    slug: "corporate-ma", 
    description: "First-tier practice with experts across all legal areas, providing comprehensive M&A and corporate services.", 
    descriptionEs: "Práctica de primer nivel con expertos en todas las áreas jurídicas, brindando servicios integrales de M&A y corporativo.",
    fullDescription: "Von Wobeser y Sierra practices a first-tier Corporate, Mergers & Acquisitions practice. With experts across a very wide range of legal areas, the firm has the capacity and structure to quickly assemble multidisciplinary teams tailored to each transaction and corporate matter. We are, in the most precise sense of the idea, a full-service firm. The firm's corporate, mergers and acquisitions lawyers work hand in hand with the firm's tax, labor, real estate, anti-corruption, antitrust, intellectual property, regulatory, dispute and litigation experts to provide comprehensive, high-quality services. With six partners and more than twenty-five lawyers, the practice brings together a wealth of experience and reaches a degree of sophistication that few firms in Mexico can match.",
    fullDescriptionEs: "Von Wobeser y Sierra ejerce una práctica de Corporativo, Fusiones y Adquisiciones de primer orden. Con expertos en una muy amplia gama de áreas jurídicas, el despacho tiene la capacidad y la estructura necesarias para integrar rápidamente equipos multidisciplinarios a la medida de cada transacción y asunto corporativo que así lo requiera. Somos, en el sentido más preciso de la idea, una firma de servicio completo. Los abogados de corporativo, fusiones y adquisiciones trabajan mano a mano con los expertos de la firma en derecho fiscal, laboral, inmobiliario, anticorrupción, competencia económica, propiedad intelectual, regulatorio, disputas y litigios, y otras áreas de especialidad para proporcionar servicios integrales de muy alta calidad. Con seis socios y más de veinticinco abogados, la práctica reúne un acervo de experiencia y alcanza un grado de sofisticación que pocas firmas en México pueden igualar.",
    iconName: "briefcase", 
    order: 1 
  },
  { 
    name: "Antitrust & Competition", 
    nameEs: "Competencia Económica", 
    slug: "antitrust-competition", 
    description: "Mexico's most notable antitrust practice, involved in over 50% of investigations.", 
    descriptionEs: "La práctica de competencia económica más notable de México, involucrada en más del 50% de las investigaciones.",
    fullDescription: "The Antitrust & Competition practice of Von Wobeser y Sierra is the most notable of its kind in Mexico. We participate in more than 50% of investigations. Likewise, we play a prominent role in merger notifications. Our clients feel safe with us: all the matters we intervened in during 2018 and 2019 were resolved in their favor. Indeed, the practice has been involved in more than half of the investigations that the Federal Economic Competition Commission has processed in the last ten years. This has allowed us to accumulate extensive experience in handling the most complex and sophisticated investigations, with satisfactory results for our clients.",
    fullDescriptionEs: "La práctica de Competencia Económica de Von Wobeser y Sierra es la más notable de su tipo en México. Participamos en más del 50% de las investigaciones. Asimismo, jugamos un papel sobresaliente en las notificaciones de concentraciones. Nuestros clientes se sienten seguros con nosotros: todos los asuntos en los que intervenimos durante 2018 y 2019 se resolvieron a su favor. En efecto, la práctica ha estado involucrada en más de la mitad de las investigaciones que ha tramitado la Comisión Federal de Competencia Económica en los últimos diez años. Esto nos ha permitido acumular una amplia experiencia en la tramitación de las más complejas y sofisticadas investigaciones, con resultados satisfactorios para nuestros clientes.",
    iconName: "scale", 
    order: 2 
  },
  { 
    name: "Arbitration", 
    nameEs: "Arbitraje", 
    slug: "arbitration", 
    description: "Mexico's first choice for representing companies in the most complex and high-profile arbitration proceedings.", 
    descriptionEs: "La primera opción en México para representar empresas en los procedimientos arbitrales más complejos y de alto perfil.",
    fullDescription: "Von Wobeser y Sierra, S.C. has become the first choice in Mexico for representing companies in the most complex and high-profile arbitration proceedings. Having represented our clients in many of the paradigmatic arbitration cases of the last decades, the firm has acquired a track record and level of experience without equivalent in the Mexican forum. The Arbitration Practice at Von Wobeser y Sierra, S.C. includes more than 25 lawyers, carefully selected from the best law schools in Mexico, the United States and Europe, who are admitted to practice in various jurisdictions and have experience working for the best law firms in New York, Washington, DC, Paris and Beijing. The team is one of the largest of its kind in the Mexican market, being perfectly equipped to handle the most complex and demanding cases.",
    fullDescriptionEs: "Von Wobeser y Sierra, S.C. se ha convertido en la primera opción en México para representar empresas en los procedimientos arbitrales más complejos y de alto perfil. Habiendo representado a nuestros clientes en muchos de los casos paradigmáticos de arbitraje de las últimas décadas, la firma ha adquirido un historial y nivel de experiencia sin equivalente en el foro mexicano. La Práctica de Arbitraje en Von Wobeser y Sierra, S.C. incluye más de 25 abogados, seleccionados cuidadosamente de las mejores escuelas de derecho en México, los Estados Unidos y Europa, quienes están admitidos para ejercer en varias jurisdicciones y cuentan con experiencia trabajando para los mejores despachos de abogados en Nueva York, Washington, DC, París y Beijing.",
    iconName: "gavel", 
    order: 3 
  },
  { 
    name: "Litigation", 
    nameEs: "Litigio", 
    slug: "litigation", 
    description: "Elite litigation team with over 30 lawyers and an 88% success rate before all courts.", 
    descriptionEs: "Equipo de litigio de élite con más de 30 abogados y una tasa de éxito del 88% ante todos los tribunales.",
    fullDescription: "Over more than 30 years, Von Wobeser y Sierra, S.C. has assembled a broad and diverse team of elite litigators, carefully selected from the best law schools in Mexico, the United States and Europe. Team members are admitted to practice in various jurisdictions and have experience working at the best law firms in New York, Washington, DC, Paris and Beijing. With more than 30 lawyers, our dispute resolution practice is one of the largest of its kind in the Mexican market and consistently appears in the highest category of all recognized legal directories. Von Wobeser y Sierra, S.C. has established itself as the first choice of many leading companies worldwide to represent them in their most complex and strategic litigation.",
    fullDescriptionEs: "A lo largo de más de 30 años, Von Wobeser y Sierra, S.C. ha integrado un equipo amplio y diverso de abogados litigantes de élite, seleccionados cuidadosamente de las mejores escuelas de derecho de México, Estados Unidos y Europa. Los miembros del equipo están admitidos para ejercer en varias jurisdicciones y tienen experiencia trabajando en los mejores despachos de abogados en Nueva York, Washington, DC, París y Beijing. Con más de 30 abogados, nuestra práctica de resolución de disputas es una de las más grandes de su tipo en el mercado mexicano y aparece constantemente en la categoría más alta de todos los directorios legales reconocidos.",
    iconName: "gavel", 
    order: 4 
  },
  { 
    name: "Investigations, Anti-corruption & Compliance", 
    nameEs: "Investigaciones, Anticorrupción y Compliance", 
    slug: "investigations-anticorruption", 
    description: "The only Mexican firm in the Global Investigations Review 100, providing specialized anti-corruption advisory.", 
    descriptionEs: "La única firma mexicana en Global Investigations Review 100, brindando asesoría especializada en anticorrupción.",
    fullDescription: "Through specialized anti-corruption and regulatory compliance advisory, Von Wobeser y Sierra ensures that its clients can comply with Mexican laws and regulations in the matter. We offer practical and effective solutions that are always based on a strategic vision. Most of the companies we assist have an international presence. The Von Wobeser y Sierra team has a solid track record in anti-corruption and regulatory compliance matters: from due diligence to the investigation of complex corruption problems in companies, including the preparation of codes of ethics and the implementation of anti-corruption programs that ensure compliance with all applicable regulations, in balance with the current business environment.",
    fullDescriptionEs: "Mediante asesoría especializada en anticorrupción y cumplimiento normativo, Von Wobeser y Sierra se asegura de que sus clientes puedan cumplir con las leyes y regulaciones mexicanas en la materia. Ofrecemos soluciones prácticas y efectivas que siempre se basan en una visión estratégica. La mayoría de las empresas a las que asistimos tienen presencia internacional. El equipo de Von Wobeser y Sierra cuenta con una sólida trayectoria en asuntos relacionados con la anticorrupción y el cumplimiento normativo: desde las debidas diligencias hasta la investigación de problemas complejos de corrupción en las empresas, incluyendo la elaboración de códigos de ética y la implementación de programas anticorrupción.",
    iconName: "shield-check", 
    order: 5 
  },
  { 
    name: "Bankruptcy & Restructuring", 
    nameEs: "Concursos Mercantiles y Reestructuración", 
    slug: "bankruptcy-restructuring", 
    description: "Recognized among the 100 best firms worldwide in restructuring matters by Global Restructuring Review.", 
    descriptionEs: "Reconocidos entre las 100 mejores firmas del mundo en materia de reestructuras por Global Restructuring Review.",
    fullDescription: "The Bankruptcy & Restructuring practice of Von Wobeser y Sierra is characterized by its participation in the most relevant proceedings of its kind in the country. We represent our clients from the point of view of both the debtor seeking a solution for its business and the creditor who needs to recover its credits. In recent years, Von Wobeser y Sierra has formed a team of lawyers who are experts in insolvencies, restructuring procedures and judicial bankruptcy proceedings. Our goal has been to provide the firm's clients with comprehensive advice and representation, that is, one that includes both legal expertise and a solid understanding of finance and business.",
    fullDescriptionEs: "La práctica de Concursos Mercantiles y Reestructuración de Von Wobeser y Sierra se caracteriza por su participación en los procedimientos más relevantes del país en su tipo. Representamos a nuestros clientes desde el punto de vista tanto del deudor que busca una solución para su negocio como del acreedor que necesita recuperar sus créditos. En los últimos años, Von Wobeser y Sierra ha formado un equipo de abogados expertos en insolvencias, procedimientos de reestructuras y procedimientos judiciales de concursos mercantiles. Nuestra meta ha sido brindar a los clientes del despacho una asesoría y una representación integral.",
    iconName: "refresh-cw", 
    order: 6 
  },
  { 
    name: "Banking & Finance", 
    nameEs: "Bancario y Financiero", 
    slug: "banking-finance", 
    description: "Comprehensive financial services including project finance, acquisition finance, and restructuring.", 
    descriptionEs: "Servicios financieros integrales incluyendo financiamiento de proyectos, adquisiciones y reestructuración.",
    iconName: "landmark", 
    order: 7 
  },
  { 
    name: "Energy & Natural Resources", 
    nameEs: "Energía y Recursos Naturales", 
    slug: "energy-natural-resources", 
    description: "One of the few firms in Mexico with a dedicated Energy & Natural Resources practice group.", 
    descriptionEs: "Una de las pocas firmas en México con un grupo de práctica dedicado a Energía y Recursos Naturales.",
    fullDescription: "Von Wobeser y Sierra is one of the few firms in Mexico with an Energy & Natural Resources industry practice group. The group is made up of partners and lawyers specialized in multiple fields. Thus, we can offer our clients comprehensive and sophisticated advice that allows them to successfully develop their projects in the sector. Aware of the growing importance of energy and natural resources in Mexico, our lawyers have accumulated extensive experience in each of the relevant facets of the industry. The group identifies itself as a comprehensive and robust business ally for its clients.",
    fullDescriptionEs: "Von Wobeser y Sierra es una de las pocas firmas en México con un grupo de práctica de industria de Energía y Recursos Naturales. El grupo lo integran socios y abogados especializados en múltiples campos. Así, podemos ofrecer a nuestros clientes una asesoría integral y sofisticada que les permite desarrollar con éxito sus proyectos en el sector. Conscientes de la importancia creciente de la energía y los recursos naturales en México, nuestros abogados han acumulado una gran experiencia en cada una de las facetas relevantes de la industria.",
    iconName: "zap", 
    order: 8 
  },
  { 
    name: "ESG (Environmental, Social & Corporate Governance)", 
    nameEs: "ESG (Ambiental, Social y Gobierno Corporativo)", 
    slug: "esg", 
    description: "Comprehensive ESG advisory integrating environmental, social and governance considerations.", 
    descriptionEs: "Asesoría integral en ESG integrando consideraciones ambientales, sociales y de gobierno corporativo.",
    iconName: "leaf", 
    order: 9 
  },
  { 
    name: "Real Estate", 
    nameEs: "Inmobiliario", 
    slug: "real-estate", 
    description: "Acquisitions, development, financing, and comprehensive real estate transactions.", 
    descriptionEs: "Adquisiciones, desarrollo, financiamiento y transacciones inmobiliarias integrales.",
    iconName: "building", 
    order: 10 
  },
  { 
    name: "Intellectual Property", 
    nameEs: "Propiedad Intelectual", 
    slug: "intellectual-property", 
    description: "Patents, trademarks, copyrights, and technology licensing.", 
    descriptionEs: "Patentes, marcas, derechos de autor y licenciamiento de tecnología.",
    iconName: "lightbulb", 
    order: 11 
  },
  { 
    name: "Labor & Employment", 
    nameEs: "Laboral", 
    slug: "labor-employment", 
    description: "Employment law, labor relations, and workplace compliance.", 
    descriptionEs: "Derecho laboral, relaciones laborales y cumplimiento en el lugar de trabajo.",
    iconName: "users", 
    order: 12 
  },
  { 
    name: "Tax", 
    nameEs: "Fiscal", 
    slug: "tax", 
    description: "Tax planning, controversies, and compliance for corporate and individual clients.", 
    descriptionEs: "Planeación fiscal, controversias y cumplimiento para clientes corporativos e individuales.",
    iconName: "calculator", 
    order: 13 
  },
  { 
    name: "International Trade", 
    nameEs: "Comercio Exterior", 
    slug: "international-trade", 
    description: "Trade remedies, customs, and international commerce regulations.", 
    descriptionEs: "Remedios comerciales, aduanas y regulaciones de comercio internacional.",
    iconName: "globe", 
    order: 14 
  },
  { 
    name: "Telecommunications, Media & Technology", 
    nameEs: "Telecomunicaciones, Medios y Tecnología", 
    slug: "telecommunications-media-technology", 
    description: "Regulatory, transactional and litigation services for TMT sector.", 
    descriptionEs: "Servicios regulatorios, transaccionales y de litigio para el sector TMT.",
    iconName: "monitor", 
    order: 15 
  },
  { 
    name: "Environmental", 
    nameEs: "Ambiental", 
    slug: "environmental", 
    description: "Environmental compliance, permitting, and sustainability matters.", 
    descriptionEs: "Cumplimiento ambiental, permisos y asuntos de sustentabilidad.",
    iconName: "leaf", 
    order: 16 
  },
  { 
    name: "Administrative Law", 
    nameEs: "Derecho Administrativo", 
    slug: "administrative-law", 
    description: "Government procurement, public bidding, and administrative litigation.", 
    descriptionEs: "Contratación pública, licitaciones y litigio administrativo.",
    iconName: "file-text", 
    order: 17 
  },
  { 
    name: "German Desk", 
    nameEs: "Desk Alemán", 
    slug: "german-desk", 
    description: "Specialized team serving German-speaking clients with German, Austrian and Mexican lawyers.", 
    descriptionEs: "Equipo especializado atendiendo clientes de habla alemana con abogados alemanes, austriacos y mexicanos.",
    iconName: "globe", 
    order: 18 
  },
];

const industryGroupsData = [
  { 
    name: "Automotive, Mobility & Manufacturing", 
    nameEs: "Automotriz, Movilidad y Manufactura", 
    slug: "automotive-mobility-manufacturing", 
    description: "Comprehensive support for OEMs, suppliers, and mobility companies.", 
    descriptionEs: "Apoyo integral para OEMs, proveedores y empresas de movilidad.",
    iconName: "car", 
    order: 1 
  },
  { 
    name: "Consumer Goods", 
    nameEs: "Bienes de Consumo", 
    slug: "consumer-goods", 
    description: "Retailers, consumer goods manufacturers, and e-commerce businesses.", 
    descriptionEs: "Minoristas, fabricantes de bienes de consumo y negocios de comercio electrónico.",
    iconName: "shopping-bag", 
    order: 2 
  },
  { 
    name: "Energy & Natural Resources", 
    nameEs: "Energía y Recursos Naturales", 
    slug: "energy-natural-resources-industry", 
    description: "Comprehensive legal services across the energy value chain including hydrocarbons, renewables, and mining.", 
    descriptionEs: "Servicios legales integrales en toda la cadena de valor energética incluyendo hidrocarburos, renovables y minería.",
    fullDescription: "Von Wobeser y Sierra is one of the few firms in Mexico with an Energy & Natural Resources industry practice group. The group is made up of partners and lawyers specialized in multiple fields. Thus, we can offer our clients comprehensive and sophisticated advice that allows them to successfully develop their projects in the sector. The group identifies itself as a comprehensive and robust business ally for its clients. With decades of combined practice, it is qualified to favorably accompany ventures and activities in hydrocarbons; energy, including renewables and clean energy (wind, solar, hydroelectric, geothermal, cogeneration and nuclear), and natural resources (such as mining, water and waste management).",
    fullDescriptionEs: "Von Wobeser y Sierra es una de las pocas firmas en México con un grupo de práctica de industria de Energía y Recursos Naturales. El grupo lo integran socios y abogados especializados en múltiples campos. Así, podemos ofrecer a nuestros clientes una asesoría integral y sofisticada que les permite desarrollar con éxito sus proyectos en el sector. El grupo se identifica como un aliado de negocios integral y robusto para sus clientes. Con décadas de práctica combinada, está calificado para acompañar favorablemente emprendimientos y actividades en hidrocarburos; energías, incluidas las renovables y limpias (eólica, solar, hidroeléctrica, geotérmica, de cogeneración y nuclear), y recursos naturales (como minería, agua y gestión de residuos).",
    iconName: "zap", 
    order: 3 
  },
  { 
    name: "Pharmaceutical & Life Sciences", 
    nameEs: "Farmacéutica y Ciencias de la Salud", 
    slug: "pharmaceutical-life-sciences", 
    description: "Pharmaceuticals, medical devices, biotechnology, and healthcare providers.", 
    descriptionEs: "Farmacéuticas, dispositivos médicos, biotecnología y proveedores de salud.",
    fullDescription: "The Pharmaceutical & Life Sciences industry practice group brings together multidisciplinary experience and knowledge around the needs of the firm's clients. Backed by solid track records, the group's lawyers study the industry from within, stay abreast of its innovations and constantly refine their legal instruments to be able to effectively meet the sector's requirements. The advice provided by the firm to leading industry companies covers the most relevant areas of specialty. We have assisted our clients in all types of corporate and commercial matters, including mergers and acquisitions (M&A), commercial distribution agreements, trademark portfolio purchases, biotechnology project financing and joint ventures for the joint development of medical products.",
    fullDescriptionEs: "El grupo de práctica de industria de Farmacéutica y Ciencias de la Salud conjunta experiencia y conocimiento multidisciplinario alrededor de las necesidades de los clientes del despacho. Respaldados por sólidas trayectorias, los abogados del grupo estudian la industria desde dentro, se mantienen al tanto de sus innovaciones y afinan constantemente sus instrumentos legales para poder atender eficazmente los requerimientos del sector. La asesoría que brinda el despacho a empresas líderes de la industria comprende las áreas de especialidad más relevantes. Hemos asistido a nuestros clientes en todo tipo de asuntos corporativos y comerciales, incluyendo fusiones y adquisiciones (M&A), acuerdos de distribución comercial, compra de portafolios de marcas, financiamiento de proyectos biotecnológicos y joint ventures para el desarrollo conjunto de productos médicos.",
    iconName: "heart-pulse", 
    order: 4 
  },
  { 
    name: "Financial Services", 
    nameEs: "Servicios Financieros", 
    slug: "financial-services", 
    description: "Banks, insurance companies, fintech, and investment funds.", 
    descriptionEs: "Bancos, aseguradoras, fintech y fondos de inversión.",
    iconName: "dollar-sign", 
    order: 5 
  },
  { 
    name: "Real Estate", 
    nameEs: "Inmobiliario", 
    slug: "real-estate-industry", 
    description: "Real estate developers, investors, and operators.", 
    descriptionEs: "Desarrolladores inmobiliarios, inversionistas y operadores.",
    iconName: "building", 
    order: 6 
  },
  { 
    name: "Technology", 
    nameEs: "Tecnología", 
    slug: "technology-industry", 
    description: "Tech companies, startups, and digital transformation.", 
    descriptionEs: "Empresas tecnológicas, startups y transformación digital.",
    iconName: "monitor", 
    order: 7 
  },
];

const teamMembersData = [
  { 
    name: "Luis Burgueño", 
    slug: "luis-burgueno", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Executive Committee Member", 
    roleEs: "Miembro del Comité Ejecutivo", 
    bio: "Luis is a partner at Von Wobeser y Sierra. He has more than thirty years of experience in mergers and acquisitions (M&A), corporate matters and transactions in general. He is a member of the firm's Executive Committee, co-leader of the Energy & Natural Resources industry practice group and is part of the ESG (Environmental, Social and Corporate Governance) practice group. His corporate practice is diverse and covers, above all, mergers and acquisitions and corporate and commercial transactions in general.",
    bioEs: "Luis es socio de Von Wobeser y Sierra. Cuenta con más de treinta años de experiencia en fusiones y adquisiciones (M&A), asuntos corporativos y transacciones en general. Es miembro del Comité Ejecutivo de la firma, colíder del grupo de práctica de industria de Energía y Recursos Naturales y forma parte del grupo de práctica ESG (Ambiental, Social y Gobierno Corporativo). Su práctica corporativa es diversa y abarca, sobre todo, fusiones y adquisiciones y transacciones corporativas y comerciales en general.",
    email: "lburgueno@vwys.com.mx", 
    phone: "+52 (55) 5258-1003",
    isPartner: true, 
    order: 1, 
    imageUrl: "/partner_photos/luis_burgueno.jpg",
    education: [
      { school: "Universidad Nacional Autónoma de México (UNAM)", schoolEs: "Universidad Nacional Autónoma de México (UNAM)", degree: "Law Degree (Licenciatura en Derecho)", degreeEs: "Licenciatura en Derecho", year: "1987" },
      { school: "Universidad Panamericana", schoolEs: "Universidad Panamericana", degree: "Master in Business Law", degreeEs: "Maestría en Derecho Empresarial", year: "1992" }
    ],
    barAdmissions: [
      { jurisdiction: "Mexico", jurisdictionEs: "México", year: "1988" }
    ],
    languages: ["Spanish", "English", "German"],
    affiliations: [
      { organization: "International Bar Association (IBA)", organizationEs: "Asociación Internacional de Abogados (IBA)", role: "Member", roleEs: "Miembro" },
      { organization: "Barra Mexicana Colegio de Abogados", organizationEs: "Barra Mexicana Colegio de Abogados", role: "Active Member", roleEs: "Miembro Activo" }
    ],
    rankings: [
      { publication: "Chambers and Partners", ranking: "Band 1", rankingEs: "Banda 1", year: "2024", area: "Corporate/M&A", areaEs: "Corporativo/M&A" },
      { publication: "Legal 500", ranking: "Leading Individual", rankingEs: "Abogado Líder", year: "2024", area: "Commercial, Corporate and M&A", areaEs: "Comercial, Corporativo y M&A" }
    ],
    publications: [
      { title: "M&A Trends in Mexican Energy Sector", titleEs: "Tendencias de M&A en el Sector Energético Mexicano", journal: "Latin Lawyer", year: "2023" },
      { title: "Corporate Governance Best Practices", titleEs: "Mejores Prácticas de Gobierno Corporativo", journal: "International Financial Law Review", year: "2022" }
    ],
    representativeMatters: [
      { description: "Advised on $2.5 billion acquisition of major Mexican energy company", descriptionEs: "Asesoró en adquisición de $2.5 mil millones de importante empresa energética mexicana", year: "2023" },
      { description: "Lead counsel in cross-border joint venture for renewable energy project", descriptionEs: "Abogado principal en joint venture transfronterizo para proyecto de energía renovable", year: "2022" }
    ]
  },
  { 
    name: "Luis Miguel Jiménez", 
    slug: "luis-miguel-jimenez", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Tax Practice", 
    roleEs: "Práctica Fiscal", 
    email: "lmjimenez@vwys.com.mx", 
    phone: "+52 (55) 5258-1058",
    isPartner: true, 
    order: 2, 
    imageUrl: "/partner_photos/luis_miguel_jimenez.jpg" 
  },
  { 
    name: "Rupert Hüttler", 
    slug: "rupert-huttler", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "German Desk Leader", 
    roleEs: "Líder del Desk Alemán", 
    email: "rhuettler@vwys.com.mx", 
    phone: "+52 (55) 5258-1038",
    isPartner: true, 
    order: 3, 
    imageUrl: "/partner_photos/rupert_huttler.jpg" 
  },
  { 
    name: "Fernando Carreño", 
    slug: "fernando-carreno", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Executive Committee Member, Antitrust & Competition Head", 
    roleEs: "Miembro del Comité Ejecutivo, Líder de Competencia Económica", 
    bio: "Fernando is a partner at Von Wobeser y Sierra. With more than fifteen years of experience, he leads the Antitrust & Competition practice, is a key member of the Corporate, Mergers & Acquisitions area, and is part of the firm's Executive Committee. He also is a member of the ESG (Environmental, Social and Corporate Governance) practice group. His solid track record includes advising top-tier companies, including leading companies that are part of the Fortune 500 list.",
    bioEs: "Fernando es socio de Von Wobeser y Sierra. Con más de quince años de experiencia, encabeza la práctica de Competencia Económica, es un integrante clave del área de Corporativo, Fusiones y Adquisiciones, y forma parte del Comité Ejecutivo de la firma. También es integrante del grupo de práctica ESG (Ambiental, Social y Gobierno Corporativo). Su sólida trayectoria comprende la asesoría a compañías de primer nivel, incluyendo empresas líderes que forman parte de la lista Fortune 500.",
    email: "fcarreno@vwys.com.mx", 
    phone: "+52 (55) 5258-1042",
    isPartner: true, 
    order: 4, 
    imageUrl: "/partner_photos/fernando_carreno.jpg" 
  },
  { 
    name: "Edmond Frederic Grieger", 
    slug: "edmond-grieger", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Energy & Natural Resources", 
    roleEs: "Energía y Recursos Naturales", 
    email: "egrieger@vwys.com.mx", 
    phone: "+52 (55) 5258-1048",
    isPartner: true, 
    order: 5, 
    imageUrl: "/partner_photos/edmond_grieger.jpg" 
  },
  { 
    name: "Adrián Magallanes", 
    slug: "adrian-magallanes", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Arbitration & Litigation", 
    roleEs: "Arbitraje y Litigio", 
    email: "amagallanes@vwys.com.mx", 
    phone: "+52 (55) 5258-1077",
    isPartner: true, 
    order: 6, 
    imageUrl: "/partner_photos/adrian_magallanes.jpg" 
  },
  { 
    name: "Diego Sierra", 
    slug: "diego-sierra", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Co-leader Arbitration & Litigation, Investigations, Anti-corruption & Compliance", 
    roleEs: "Colíder de Arbitraje y Litigio, Investigaciones, Anticorrupción y Compliance", 
    bio: "Diego is co-leader of the Arbitration and Litigation practices at Von Wobeser y Sierra. He also leads the Anti-Corruption and Compliance, and Bankruptcy & Restructuring practices, and is part of the ESG (Environmental, Social and Corporate Governance) practice group. Diego has advised Fortune 500 companies on anti-corruption matters, due diligence, litigation, arbitration and insolvency, and has participated in some of the most relevant anti-corruption investigations and Foreign Corrupt Practices Act (FCPA) enforcement actions of recent years in Mexico.",
    bioEs: "Diego es colíder de las prácticas de Arbitraje y Litigio en Von Wobeser y Sierra. Asimismo, dirige las prácticas de Anticorrupción y Compliance, y Concursos Mercantiles y Reestructuración, y forma parte del grupo de práctica ESG (Ambiental, Social y Gobierno Corporativo). Diego ha asesorado a compañías de Fortune 500 en asuntos de anticorrupción, due diligence, litigio, arbitraje e insolvencia, y ha participado en algunas de las investigaciones anticorrupción y de aplicación de la Foreign Corrupt Practices Act más relevantes de los últimos años en México.",
    email: "dsierra@vwys.com.mx", 
    phone: "+52 (55) 5258-1039",
    isPartner: true, 
    order: 7, 
    imageUrl: "/partner_photos/diego_sierra.jpg" 
  },
  { 
    name: "Montserrat Manzano", 
    slug: "montserrat-manzano", 
    title: "Partner", 
    titleEs: "Socia", 
    role: "Arbitration & Litigation", 
    roleEs: "Arbitraje y Litigio", 
    email: "mmanzano@vwys.com.mx", 
    phone: "+52 (55) 5258-1018",
    isPartner: true, 
    order: 8, 
    imageUrl: "/partner_photos/montserrat_manzano.jpg" 
  },
  { 
    name: "Pablo Saez Williams", 
    slug: "pablo-saez-williams", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Corporate, M&A & Real Estate", 
    roleEs: "Corporativo, M&A e Inmobiliario", 
    email: "psaez@vwys.com.mx", 
    phone: "+52 (55) 5258-1085",
    isPartner: true, 
    order: 9, 
    imageUrl: "/partner_photos/pablo_saez_williams.jpg" 
  },
  { 
    name: "Patricia Kaim", 
    slug: "patricia-kaim", 
    title: "Partner", 
    titleEs: "Socia", 
    role: "Intellectual Property & Pharmaceutical", 
    roleEs: "Propiedad Intelectual y Farmacéutica", 
    email: "pkaim@vwys.com.mx", 
    phone: "+52 (55) 5258-1038",
    isPartner: true, 
    order: 10, 
    imageUrl: "/partner_photos/patricia_kaim.jpg" 
  },
  { 
    name: "Alberto Córdoba", 
    slug: "alberto-cordoba", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Corporate & M&A", 
    roleEs: "Corporativo y M&A", 
    email: "acordoba@vwys.com.mx", 
    phone: "+52 (55) 5258-1016",
    isPartner: true, 
    order: 11, 
    imageUrl: "/partner_photos/alberto_cordoba.jpg" 
  },
  { 
    name: "Pablo Fautsch", 
    slug: "pablo-fautsch", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Arbitration, Litigation & Bankruptcy", 
    roleEs: "Arbitraje, Litigio y Concursos Mercantiles", 
    email: "pfautsch@vwys.com.mx", 
    phone: "+52 (55) 5258-1072",
    isPartner: true, 
    order: 12, 
    imageUrl: "/partner_photos/pablo_fautsch.jpg" 
  },
  { 
    name: "Jessika Rocha", 
    slug: "jessika-rocha", 
    title: "Partner", 
    titleEs: "Socia", 
    role: "Litigation, Arbitration, Investigations & Bankruptcy", 
    roleEs: "Litigio, Arbitraje, Investigaciones y Concursos Mercantiles", 
    bio: "Jessika Rocha is a partner at Von Wobeser y Sierra. With more than twenty years of experience, she is part of the Litigation; Arbitration; Investigations, Anti-Corruption & Compliance, and Bankruptcy & Restructuring practices. She is also a member of the Consumer Goods industry group. She has participated in commercial and administrative litigation before Mexican local and federal courts. Her experience includes representing national and international clients from various sectors in commercial, administrative, constitutional and civil litigation, as well as class actions.",
    bioEs: "Jessika Rocha es socia de Von Wobeser y Sierra. Con más de veinte años de experiencia, forma parte de las prácticas de Litigio; Arbitraje; Investigaciones, Anticorrupción y Compliance, y Concursos Mercantiles y Reestructuración. También es integrante del grupo de industria de Bienes de Consumo. Ha participado en litigios de índole comercial y administrativa ante tribunales mexicanos locales y federales. Su experiencia incluye la representación de clientes nacionales e internacionales de diversos sectores en juicios comerciales, contenciosos administrativos, constitucionales y civiles, así como acciones colectivas.",
    email: "jrocha@vwys.com.mx", 
    phone: "+52 (55) 5258-1076",
    isPartner: true, 
    order: 13, 
    imageUrl: "/partner_photos/jessika_rocha.jpg" 
  },
  { 
    name: "Raymundo Soberanis", 
    slug: "raymundo-soberanis", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Arbitration, Litigation & Investigations", 
    roleEs: "Arbitraje, Litigio e Investigaciones", 
    email: "rsoberanis@vwys.com.mx", 
    phone: "+52 (55) 5258-1059",
    isPartner: true, 
    order: 14, 
    imageUrl: "/partner_photos/raymundo_soberanis.jpg" 
  },
  { 
    name: "Pablo Jiménez", 
    slug: "pablo-jimenez", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Corporate & M&A Co-Leader", 
    roleEs: "Colíder de Corporativo y M&A", 
    email: "pjimenez@vwys.com.mx", 
    phone: "+52 (55) 5258-1016",
    isPartner: true, 
    order: 15, 
    imageUrl: "/partner_photos/pablo_jimenez.jpg" 
  },
  { 
    name: "Ariel Garfio", 
    slug: "ariel-garfio", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Energy & Natural Resources", 
    roleEs: "Energía y Recursos Naturales", 
    email: "agarfio@vwys.com.mx", 
    phone: "+52 (55) 5258-1007",
    isPartner: true, 
    order: 16, 
    imageUrl: "/partner_photos/ariel_garfio.jpg" 
  },
  { 
    name: "Rafael Vallejo", 
    slug: "rafael-vallejo", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Tax Practice", 
    roleEs: "Práctica Fiscal", 
    email: "rvallejo@vwys.com.mx", 
    phone: "+52 (55) 5258-1014",
    isPartner: true, 
    order: 17, 
    imageUrl: "/partner_photos/rafael_vallejo.jpg" 
  },
  { 
    name: "Katharina Roehr", 
    slug: "katharina-roehr", 
    title: "Partner", 
    titleEs: "Socia", 
    role: "German Desk & Corporate", 
    roleEs: "Desk Alemán y Corporativo", 
    email: "kroehr@vwys.com.mx", 
    phone: "+52 (55) 5258-1023",
    isPartner: true, 
    order: 18, 
    imageUrl: "/partner_photos/katharina_roehr.jpg" 
  },
  { 
    name: "Sergio López", 
    slug: "sergio-lopez", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Antitrust & Competition", 
    roleEs: "Competencia Económica", 
    email: "slopez@vwys.com.mx", 
    phone: "+52 (55) 5258-1042",
    isPartner: true, 
    order: 19, 
    imageUrl: "/partner_photos/sergio_lopez.jpg" 
  },
  { 
    name: "Alejandro Torres", 
    slug: "alejandro-torres", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Corporate & M&A", 
    roleEs: "Corporativo y M&A", 
    email: "ajtorres@vwys.com.mx", 
    phone: "+52 (55) 5258-1072",
    isPartner: true, 
    order: 20, 
    imageUrl: "/partner_photos/alejandro_torres.jpg" 
  },
  { 
    name: "Javier Betancourt", 
    slug: "javier-betancourt", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Corporate & M&A", 
    roleEs: "Corporativo y M&A", 
    email: "jbetancourt@vwys.com.mx", 
    phone: "+52 (55) 5258-1085",
    isPartner: true, 
    order: 21, 
    imageUrl: "/partner_photos/javier_betancourt.jpg" 
  },
  { 
    name: "Adrián Castillo", 
    slug: "adrian-castillo", 
    title: "Partner", 
    titleEs: "Socio", 
    role: "Tax Practice", 
    roleEs: "Práctica Fiscal", 
    email: "adcastillo@vwys.com.mx", 
    phone: "+52 (55) 5258-1014",
    isPartner: true, 
    order: 22, 
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/AdrianCastillo_Hires.jpg" 
  },
  { 
    name: "Claus von Wobeser", 
    slug: "claus-von-wobeser", 
    title: "Of Counsel", 
    titleEs: "Of Counsel", 
    role: "Founding Partner, Arbitration & Litigation Expert", 
    roleEs: "Socio Fundador, Experto en Arbitraje y Litigio", 
    bio: "Claus von Wobeser is a founding partner of Von Wobeser y Sierra. The practice is led by one of the most prominent arbitration practitioners in the world, who has served as vice-president of the ICC International Court of Arbitration, co-chair of the IBA Arbitration Committee and as president of the Arbitration Commission of the Mexican Chapter of the ICC.",
    bioEs: "Claus von Wobeser es socio fundador de Von Wobeser y Sierra. La práctica es dirigida por uno de los más destacados practicantes de arbitraje del mundo, quien se ha desempeñado como vicepresidente de la Corte Internacional de Arbitraje de la ICC, copresidente del Comité de Arbitraje de la IBA y como presidente de la Comisión de Arbitraje del Capítulo Mexicano de la ICC.",
    email: "cvonwobeser@vwys.com.mx", 
    phone: "+52 (55) 5258-1000",
    isPartner: false, 
    order: 23, 
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/ClausVonWobeser_Hires.jpg",
    education: [
      { school: "Universidad Nacional Autónoma de México (UNAM)", schoolEs: "Universidad Nacional Autónoma de México (UNAM)", degree: "Law Degree (Licenciatura en Derecho)", degreeEs: "Licenciatura en Derecho", year: "1976" },
      { school: "University of Freiburg, Germany", schoolEs: "Universidad de Friburgo, Alemania", degree: "Dr. iur. (Doctorate in Law)", degreeEs: "Dr. iur. (Doctorado en Derecho)", year: "1983" },
      { school: "Harvard Law School", schoolEs: "Escuela de Derecho de Harvard", degree: "LL.M. (Master of Laws)", degreeEs: "LL.M. (Maestría en Derecho)", year: "1979" }
    ],
    barAdmissions: [
      { jurisdiction: "Mexico", jurisdictionEs: "México", year: "1977" },
      { jurisdiction: "New York", jurisdictionEs: "Nueva York", year: "1981" }
    ],
    languages: ["Spanish", "English", "German", "French"],
    affiliations: [
      { organization: "ICC International Court of Arbitration", organizationEs: "Corte Internacional de Arbitraje de la ICC", role: "Former Vice-President", roleEs: "Ex-Vicepresidente" },
      { organization: "International Bar Association (IBA)", organizationEs: "Asociación Internacional de Abogados (IBA)", role: "Former Co-Chair, Arbitration Committee", roleEs: "Ex-Copresidente, Comité de Arbitraje" },
      { organization: "ICC Mexico Arbitration Commission", organizationEs: "Comisión de Arbitraje de ICC México", role: "Former President", roleEs: "Ex-Presidente" },
      { organization: "ICDR (International Centre for Dispute Resolution)", organizationEs: "ICDR (Centro Internacional para Resolución de Disputas)", role: "Arbitrator", roleEs: "Árbitro" }
    ],
    rankings: [
      { publication: "Chambers Global", ranking: "Star Individual", rankingEs: "Individuo Estrella", year: "2024", area: "Dispute Resolution: Arbitration", areaEs: "Resolución de Disputas: Arbitraje" },
      { publication: "Who's Who Legal", ranking: "Global Elite Thought Leader", rankingEs: "Líder de Pensamiento Global de Élite", year: "2024", area: "Arbitration", areaEs: "Arbitraje" },
      { publication: "Legal 500", ranking: "Hall of Fame", rankingEs: "Salón de la Fama", year: "2024", area: "Dispute Resolution", areaEs: "Resolución de Disputas" }
    ],
    publications: [
      { title: "International Commercial Arbitration in Latin America", titleEs: "Arbitraje Comercial Internacional en América Latina", journal: "Oxford University Press", year: "2020" },
      { title: "The Enforcement of Foreign Arbitral Awards in Mexico", titleEs: "La Ejecución de Laudos Arbitrales Extranjeros en México", journal: "ICC Dispute Resolution Bulletin", year: "2018" },
      { title: "Investment Arbitration in NAFTA: Evolution and Perspectives", titleEs: "Arbitraje de Inversión en el TLCAN: Evolución y Perspectivas", journal: "Arbitration International", year: "2015" }
    ],
    representativeMatters: [
      { description: "Lead arbitrator in billion-dollar energy infrastructure dispute", descriptionEs: "Árbitro principal en disputa de infraestructura energética de miles de millones de dólares", year: "2023" },
      { description: "Represented multinational corporation in ICSID proceedings against Latin American state", descriptionEs: "Representó a corporación multinacional en procedimientos CIADI contra estado latinoamericano", year: "2022" },
      { description: "Advised on landmark constitutional challenge regarding Mexican energy reform", descriptionEs: "Asesoró en histórico desafío constitucional sobre reforma energética mexicana", year: "2021" }
    ],
    experience: [
      { company: "Von Wobeser y Sierra, S.C.", position: "Founding Partner", positionEs: "Socio Fundador", startYear: "1986" },
      { company: "Harvard Law School", position: "Visiting Scholar", positionEs: "Académico Visitante", startYear: "1982", endYear: "1983" }
    ]
  },
  { 
    name: "Javier Lizardi", 
    slug: "javier-lizardi", 
    title: "Of Counsel", 
    titleEs: "Of Counsel", 
    role: "Corporate, M&A & Pharmaceutical Co-Leader", 
    roleEs: "Colíder de Corporativo, M&A y Farmacéutica", 
    email: "jlizardi@vwys.com.mx", 
    phone: "+52 (55) 5258-1000",
    isPartner: false, 
    order: 24, 
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/JavierLizardi_Hires.jpg" 
  },
  { 
    name: "Fernando Moreno", 
    slug: "fernando-moreno", 
    title: "Of Counsel", 
    titleEs: "Of Counsel", 
    role: "Arbitration & Energy", 
    roleEs: "Arbitraje y Energía", 
    email: "fmoreno@vwys.com.mx", 
    phone: "+52 (55) 5258-1000",
    isPartner: false, 
    order: 25, 
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/FernandoMoreno_Hires.jpg" 
  },
  // Associates
  { name: "Adrian Martinez", slug: "adrian-martinez", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "amartinez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 26, imageUrl: "/associate_photos/adrian_martinez.jpg" },
  { name: "Adrian Rodriguez", slug: "adrian-rodriguez", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "arodriguez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 27, imageUrl: "/associate_photos/adrian_rodriguez.jpg" },
  { name: "Alejandra Arizpe", slug: "alejandra-arizpe", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "aarizpe@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 28, imageUrl: "/associate_photos/alejandra_arizpe.jpg" },
  { name: "Alejandro Perez", slug: "alejandro-perez", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "aperez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 29, imageUrl: "/associate_photos/alejandro_perez.jpg" },
  { name: "Alejandro Torres", slug: "alejandro-torres", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "atorres@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 30, imageUrl: "/associate_photos/alejandro_torres.jpg" },
  { name: "Alexa Mendivil", slug: "alexa-mendivil", title: "Associate", titleEs: "Asociada", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "amendivil@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 31, imageUrl: "/associate_photos/alexa_mendivil.jpg" },
  { name: "Alexander Barnes", slug: "alexander-barnes", title: "Associate", titleEs: "Asociado", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "abarnes@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 32, imageUrl: "/associate_photos/alexander_barnes.jpg" },
  { name: "Alfonso Lenero", slug: "alfonso-lenero", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "alenero@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 33, imageUrl: "/associate_photos/alfonso_lenero.jpg" },
  { name: "Alondra Marin", slug: "alondra-marin", title: "Associate", titleEs: "Asociada", role: "Labor & Employment", roleEs: "Laboral", email: "amarin@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 34, imageUrl: "/associate_photos/alondra_marin.jpg" },
  { name: "Amanda Ibanez", slug: "amanda-ibanez", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "aibanez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 35, imageUrl: "/associate_photos/amanda_ibanez.jpg" },
  { name: "Ana Alpizar", slug: "ana-alpizar", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "aalpizar@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 36, imageUrl: "/associate_photos/ana_alpizar.jpg" },
  { name: "Ana Ruiz", slug: "ana-ruiz", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "aruiz@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 37, imageUrl: "/associate_photos/ana_ruiz.jpg" },
  { name: "Ana Victoria Guevara", slug: "ana-victoria-guevara", title: "Associate", titleEs: "Asociada", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "aguevara@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 38, imageUrl: "/associate_photos/ana_victoria_guevara.jpg" },
  { name: "Andoni Garza", slug: "andoni-garza", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "agarza@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 39, imageUrl: "/associate_photos/andoni_garza.jpg" },
  { name: "Andres Jimenez", slug: "andres-jimenez", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "ajimenez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 40, imageUrl: "/associate_photos/andres_jimenez.jpg" },
  { name: "Anna Maria Brandstadter", slug: "anna-maria-brandstadter", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "abrandstadter@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 41, imageUrl: "/associate_photos/anna_maria_brandstadter.jpg" },
  { name: "Arturo Hernandez", slug: "arturo-hernandez", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "ahernandez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 42, imageUrl: "/associate_photos/arturo_hernandez.jpg" },
  { name: "Carlos Cazares", slug: "carlos-cazares", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "ccazares@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 43, imageUrl: "/associate_photos/carlos_cazares.jpg" },
  { name: "Carlos Cevallos", slug: "carlos-cevallos", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "ccevallos@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 44, imageUrl: "/associate_photos/carlos_cevallos.jpg" },
  { name: "Carlos Ugalde", slug: "carlos-ugalde", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "cugalde@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 45, imageUrl: "/associate_photos/carlos_ugalde.jpg" },
  { name: "Carolina Camacho", slug: "carolina-camacho", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "ccamacho@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 46, imageUrl: "/associate_photos/carolina_camacho.jpg" },
  { name: "Christian Ramirez", slug: "christian-ramirez", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "cramirez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 47, imageUrl: "/associate_photos/christian_ramirez.jpg" },
  { name: "Christopher Wilkerson", slug: "christopher-wilkerson", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "cwilkerson@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 48, imageUrl: "/associate_photos/christopher_wilkerson.jpg" },
  { name: "Cinthya Gonzalez", slug: "cinthya-gonzalez", title: "Associate", titleEs: "Asociada", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "cgonzalez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 49, imageUrl: "/associate_photos/cinthya_gonzalez.jpg" },
  { name: "Cynthia Osio", slug: "cynthia-osio", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "cosio@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 50, imageUrl: "/associate_photos/cynthia_osio.jpg" },
  { name: "Daniel Araujo", slug: "daniel-araujo", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "daraujo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 51, imageUrl: "/associate_photos/daniel_araujo.jpg" },
  { name: "Daniela Pons", slug: "daniela-pons", title: "Associate", titleEs: "Asociada", role: "Labor & Employment", roleEs: "Laboral", email: "dpons@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 52, imageUrl: "/associate_photos/daniela_pons.jpg" },
  { name: "Dario Figueroa", slug: "dario-figueroa", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "dfigueroa@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 53, imageUrl: "/associate_photos/dario_figueroa.jpg" },
  { name: "David Fainsod", slug: "david-fainsod", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "dfainsod@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 54, imageUrl: "/associate_photos/david_fainsod.jpg" },
  { name: "Deborah Luengo", slug: "deborah-luengo", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "dluengo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 55, imageUrl: "/associate_photos/deborah_luengo.jpg" },
  { name: "Diego Altamirano", slug: "diego-altamirano", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "daltamirano@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 56, imageUrl: "/associate_photos/diego_altamirano.jpg" },
  { name: "Diego Benitez", slug: "diego-benitez", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "dbenitez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 57, imageUrl: "/associate_photos/diego_benitez.jpg" },
  { name: "Diego Lozada", slug: "diego-lozada", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "dlozada@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 58, imageUrl: "/associate_photos/diego_lozada.jpg" },
  { name: "Dolores Jimenez", slug: "dolores-jimenez", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "djimenez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 59, imageUrl: "/associate_photos/dolores_jimenez.jpg" },
  { name: "Edmundo Berumen", slug: "edmundo-berumen", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "eberumen@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 60, imageUrl: "/associate_photos/edmundo_berumen.jpg" },
  { name: "Eduardo Estrada", slug: "eduardo-estrada", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "eestrada@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 61, imageUrl: "/associate_photos/eduardo_estrada.jpg" },
  { name: "Efren Sanchez", slug: "efren-sanchez", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "esanchez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 62, imageUrl: "/associate_photos/efren_sanchez.jpg" },
  { name: "Eliana Gonzalez", slug: "eliana-gonzalez", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "egonzalez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 63, imageUrl: "/associate_photos/eliana_gonzalez.jpg" },
  { name: "Elias Jalife", slug: "elias-jalife", title: "Associate", titleEs: "Asociado", role: "Arbitration", roleEs: "Arbitraje", email: "ejalife@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 64, imageUrl: "/associate_photos/elias_jalife.jpg" },
  { name: "Ernesto Palomares", slug: "ernesto-palomares", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "epalomares@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 65, imageUrl: "/associate_photos/ernesto_palomares.jpg" },
  { name: "Eugenio Chinchillas", slug: "eugenio-chinchillas", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "echinchillas@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 66, imageUrl: "/associate_photos/eugenio_chinchillas.jpg" },
  { name: "Fernando Mancilla", slug: "fernando-mancilla", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "fmancilla@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 67, imageUrl: "/associate_photos/fernando_mancilla.jpg" },
  { name: "Gabriela Negrete", slug: "gabriela-negrete", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "gnegrete@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 68, imageUrl: "/associate_photos/gabriela_negrete.jpg" },
  { name: "Gaston Hinojosa", slug: "gaston-hinojosa", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "ghinojosa@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 69, imageUrl: "/associate_photos/gaston_hinojosa.jpg" },
  { name: "Gustavo Padilla", slug: "gustavo-padilla", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "gpadilla@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 70, imageUrl: "/associate_photos/gustavo_padilla.jpg" },
  { name: "Gustavo Vaca", slug: "gustavo-vaca", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "gvaca@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 71, imageUrl: "/associate_photos/gustavo_vaca.jpg" },
  { name: "Hector Sanchez", slug: "hector-sanchez", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "hsanchez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 72, imageUrl: "/associate_photos/hector_sanchez.jpg" },
  { name: "Ileana Pantiga", slug: "ileana-pantiga", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "ipantiga@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 73, imageUrl: "/associate_photos/ileana_pantiga.jpg" },
  { name: "Jaime Antonio Sanchez", slug: "jaime-antonio-sanchez", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "jsanchez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 74, imageUrl: "/associate_photos/jaime_antonio_sanchez.jpg" },
  { name: "Joel Dominguez", slug: "joel-dominguez", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "jdominguez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 75, imageUrl: "/associate_photos/joel_dominguez.jpg" },
  { name: "Jorge Vazquez", slug: "jorge-vazquez", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "jvazquez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 76, imageUrl: "/associate_photos/jorge_vazquez.jpg" },
  { name: "Jose Antonio Gomez", slug: "jose-antonio-gomez", title: "Associate", titleEs: "Asociado", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "jgomez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 77, imageUrl: "/associate_photos/jose_antonio_gomez.jpg" },
  { name: "Jose Carlos Aguilar", slug: "jose-carlos-aguilar", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "jaguilar@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 78, imageUrl: "/associate_photos/jose_carlos_aguilar.jpg" },
  { name: "Jose Luis Ortega", slug: "jose-luis-ortega", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "jortega@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 79, imageUrl: "/associate_photos/jose_luis_ortega.jpg" },
  { name: "Juan Francisco Barrera", slug: "juan-francisco-barrera", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "jbarrera@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 80, imageUrl: "/associate_photos/juan_francisco_barrera.jpg" },
  { name: "Juan Manuel Moran", slug: "juan-manuel-moran", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "jmoran@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 81, imageUrl: "/associate_photos/juan_manuel_moran.jpg" },
  { name: "Julieta Bejar", slug: "julieta-bejar", title: "Associate", titleEs: "Asociado", role: "Arbitration", roleEs: "Arbitraje", email: "jbejar@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 82, imageUrl: "/associate_photos/julieta_bejar.jpg" },
  { name: "Laura Maldonado", slug: "laura-maldonado", title: "Associate", titleEs: "Asociada", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "lmaldonado@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 83, imageUrl: "/associate_photos/laura_maldonado.jpg" },
  { name: "Libna Macias", slug: "libna-macias", title: "Associate", titleEs: "Asociada", role: "Tax", roleEs: "Fiscal", email: "lmacias@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 84, imageUrl: "/associate_photos/libna_macias.jpg" },
  { name: "Liliana Perez", slug: "liliana-perez", title: "Associate", titleEs: "Asociada", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "lperez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 85, imageUrl: "/associate_photos/liliana_perez.jpg" },
  { name: "Maria Garcia", slug: "maria-garcia", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "mgarcia@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 86, imageUrl: "/associate_photos/maria_garcia.jpg" },
  { name: "Mariana Gomez Vallin", slug: "mariana-gomez-vallin", title: "Associate", titleEs: "Asociada", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "mvallin@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 87, imageUrl: "/associate_photos/mariana_gomez_vallin.jpg" },
  { name: "Mario Lugo", slug: "mario-lugo", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "mlugo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 88, imageUrl: "/associate_photos/mario_lugo.jpg" },
  { name: "Max Morales", slug: "max-morales", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "mmorales@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 89, imageUrl: "/associate_photos/max_morales.jpg" },
  { name: "Melissa Cruz", slug: "melissa-cruz", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "mcruz@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 90, imageUrl: "/associate_photos/melissa_cruz.jpg" },
  { name: "Mercedes Jimenez Roel", slug: "mercedes-jimenez-roel", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "mroel@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 91, imageUrl: "/associate_photos/mercedes_jimenez_roel.jpg" },
  { name: "Michael Schreiber", slug: "michael-schreiber", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "mschreiber@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 92, imageUrl: "/associate_photos/michael_schreiber.jpg" },
  { name: "Montserrat Garcia", slug: "montserrat-garcia", title: "Associate", titleEs: "Asociada", role: "Tax", roleEs: "Fiscal", email: "mgarcia@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 93, imageUrl: "/associate_photos/montserrat_garcia.jpg" },
  { name: "Pablo Aceves", slug: "pablo-aceves", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "paceves@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 94, imageUrl: "/associate_photos/pablo_aceves.jpg" },
  { name: "Paola Hernandez", slug: "paola-hernandez", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "phernandez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 95, imageUrl: "/associate_photos/paola_hernandez.jpg" },
  { name: "Patricio Reyes Retana", slug: "patricio-reyes-retana", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "pretana@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 96, imageUrl: "/associate_photos/patricio_reyes_retana.jpg" },
  { name: "Raul Chaidez", slug: "raul-chaidez", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "rchaidez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 97, imageUrl: "/associate_photos/raul_chaidez.jpg" },
  { name: "Raul Quintero", slug: "raul-quintero", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "rquintero@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 98, imageUrl: "/associate_photos/raul_quintero.jpg" },
  { name: "Regina Castillo", slug: "regina-castillo", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "rcastillo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 99, imageUrl: "/associate_photos/regina_castillo.jpg" },
  { name: "Regina Forte", slug: "regina-forte", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "rforte@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 100, imageUrl: "/associate_photos/regina_forte.jpg" },
  { name: "Regina Godinez", slug: "regina-godinez", title: "Associate", titleEs: "Asociada", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "rgodinez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 101, imageUrl: "/associate_photos/regina_godinez.jpg" },
  { name: "Regina Gonzalez", slug: "regina-gonzalez", title: "Associate", titleEs: "Asociada", role: "Tax", roleEs: "Fiscal", email: "rgonzalez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 102, imageUrl: "/associate_photos/regina_gonzalez.jpg" },
  { name: "Ricardo Rosas", slug: "ricardo-rosas", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "rrosas@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 103, imageUrl: "/associate_photos/ricardo_rosas.jpg" },
  { name: "Roberto Flores", slug: "roberto-flores", title: "Associate", titleEs: "Asociado", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "rflores@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 104, imageUrl: "/associate_photos/roberto_flores.jpg" },
  { name: "Rocio Vega", slug: "rocio-vega", title: "Associate", titleEs: "Asociada", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "rvega@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 105, imageUrl: "/associate_photos/rocio_vega.jpg" },
  { name: "Rodrigo Garcia", slug: "rodrigo-garcia", title: "Associate", titleEs: "Asociado", role: "Labor & Employment", roleEs: "Laboral", email: "rgarcia@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 106, imageUrl: "/associate_photos/rodrigo_garcia.jpg" },
  { name: "Ruben Villegas", slug: "ruben-villegas", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "rvillegas@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 107, imageUrl: "/associate_photos/ruben_villegas.jpg" },
  { name: "Santiago Torres", slug: "santiago-torres", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "storres@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 108, imageUrl: "/associate_photos/santiago_torres.jpg" },
  { name: "Sara Ortiz", slug: "sara-ortiz", title: "Associate", titleEs: "Asociada", role: "Arbitration", roleEs: "Arbitraje", email: "sortiz@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 109, imageUrl: "/associate_photos/sara_ortiz.jpg" },
  { name: "Sarah Gibert", slug: "sarah-gibert", title: "Associate", titleEs: "Asociada", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "sgibert@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 110, imageUrl: "/associate_photos/sarah_gibert.jpg" },
  { name: "Sofia Alcantara", slug: "sofia-alcantara", title: "Associate", titleEs: "Asociada", role: "Tax", roleEs: "Fiscal", email: "salcantara@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 111, imageUrl: "/associate_photos/sofia_alcantara.jpg" },
  { name: "Sofia Reyes", slug: "sofia-reyes", title: "Associate", titleEs: "Asociada", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "sreyes@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 112, imageUrl: "/associate_photos/sofia_reyes.jpg" },
  { name: "Stefania Lopardo", slug: "stefania-lopardo", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "slopardo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 113, imageUrl: "/associate_photos/stefania_lopardo.jpg" },
  { name: "Victor Delgado", slug: "victor-delgado", title: "Associate", titleEs: "Asociado", role: "Banking & Finance", roleEs: "Bancario y Financiero", email: "vdelgado@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 114, imageUrl: "/associate_photos/victor_delgado.jpg" },
  { name: "Virginia Cornett", slug: "virginia-cornett", title: "Associate", titleEs: "Asociada", role: "Labor & Employment", roleEs: "Laboral", email: "vcornett@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 115, imageUrl: "/associate_photos/virginia_cornett.jpg" },
];

const newsData = [
  {
    title: "Von Wobeser y Sierra completes transition to new offices: a strategic investment in the firm's future",
    titleEs: "Von Wobeser y Sierra completa transición a sus nuevas oficinas: una inversión estratégica en el futuro de la firma",
    excerpt: "The firm has completed its move to new offices in the dynamic Campos Elíseos area in Polanco.",
    excerptEs: "La firma ha completado su mudanza a nuevas oficinas en la dinámica zona de Campos Elíseos en Polanco.",
    content: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco. This relocation materializes a stage of growth, evolution and consolidation, and represents a key investment in the firm's future. The new facilities are designed to maximize collaboration between all areas for the benefit of its clients to continue offering a high-quality and integrated service, reaffirming the firm's commitment and its philosophy of being where clients need them. The new offices are located in the most dynamic business center in Mexico and one of the most important in Latin America. Strategically located in the vibrant Polanco area, steps from the iconic Paseo de la Reforma Avenue, they ensure the closeness that clients need for agile and personalized support.",
    contentEs: "Von Wobeser y Sierra ha completado la transición a sus nuevas oficinas en la dinámica zona de Campos Elíseos en Polanco. Esta reubicación materializa una etapa de crecimiento, evolución y consolidación, y representa una inversión clave en el futuro de la firma. Las nuevas instalaciones están diseñadas para maximizar la colaboración entre todas las áreas en beneficio de sus clientes para seguir ofreciendo un servicio de alta calidad e integrado, reafirmando el compromiso del despacho y su filosofía de estar donde los clientes lo necesitan. Las nuevas oficinas se encuentran ubicadas en el centro de negocios más dinámico de México y en uno de los más importantes en América Latina. Estratégicamente ubicados en la vibrante zona de Polanco, a pasos de la icónica Avenida Paseo de la Reforma, aseguran la cercanía que los clientes necesitan para un acompañamiento ágil y personalizado.",
    slug: "new-offices-transition",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    published: true,
    category: "press",
    categoryEs: "Prensa",
  },
  {
    title: "Von Wobeser y Sierra has been ranked by Chambers and Partners Latin America 2026",
    titleEs: "Von Wobeser y Sierra ha sido reconocido en el ranking de Chambers and Partners Latin America 2026",
    excerpt: "The firm continues to be recognized as a leading practice across multiple areas in Mexico.",
    excerptEs: "La firma continúa siendo reconocida como una práctica líder en múltiples áreas en México.",
    content: "Von Wobeser y Sierra has received top rankings in the Chambers and Partners Latin America 2026 guide, reinforcing its position as one of Mexico's leading law firms. The firm was recognized across multiple practice areas including Corporate/M&A, Banking & Finance, Energy, Antitrust/Competition, and Dispute Resolution. Multiple partners were also individually recognized for their expertise and market-leading practices.",
    contentEs: "Von Wobeser y Sierra ha recibido las más altas clasificaciones en la guía Chambers and Partners Latin America 2026, reforzando su posición como una de las principales firmas de abogados de México. La firma fue reconocida en múltiples áreas de práctica incluyendo Corporativo/M&A, Banca y Finanzas, Energía, Competencia Económica y Resolución de Disputas. Múltiples socios también fueron reconocidos individualmente por su experiencia y prácticas líderes en el mercado.",
    slug: "chambers-ranking-2026",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    published: true,
    category: "rankings",
    categoryEs: "Rankings",
  },
  {
    title: "Von Wobeser y Sierra recognized in Global Investigations Review 100",
    titleEs: "Von Wobeser y Sierra reconocido en Global Investigations Review 100",
    excerpt: "The only Mexican firm in the prestigious GIR 100 ranking for investigations and anti-corruption.",
    excerptEs: "La única firma mexicana en el prestigioso ranking GIR 100 de investigaciones y anticorrupción.",
    content: "Global Investigations Review 100 recognizes the Investigations, Anti-corruption & Compliance practice of Von Wobeser y Sierra as one of the hundred most important in the world in the matter, distinguishing us as the only Mexican firm present in this prestigious list. According to Chambers and Partners Global, Chambers and Partners Latin America, Legal 500, and Latin Lawyer 250, we are one of the elite practices in Mexico.",
    contentEs: "Global Investigations Review 100 reconoce la práctica de Investigaciones, Anticorrupción y Compliance de Von Wobeser y Sierra como una de las cien más importantes del mundo en la materia, distinguiéndonos como la única firma mexicana presente en este prestigioso listado. De acuerdo con Chambers and Partners Global, Chambers and Partners Latin America, Legal 500, y Latin Lawyer 250, somos una de las prácticas de élite en México.",
    slug: "gir-100-recognition",
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    published: true,
    category: "rankings",
    categoryEs: "Rankings",
  },
];

const officeImagesData = [
  { imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png", alt: "Von Wobeser y Sierra new offices at Torre SOMA", altEs: "Nuevas oficinas de Von Wobeser y Sierra en Torre SOMA", order: 1 },
  { imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png", alt: "Modern collaborative workspace in Polanco", altEs: "Espacio de trabajo colaborativo moderno en Polanco", order: 2 },
  { imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png", alt: "Von Wobeser y Sierra meeting rooms", altEs: "Salas de juntas de Von Wobeser y Sierra", order: 3 },
];

const representativeMattersData = [
  {
    title: "Acquisition of Major Telecommunications Company",
    titleEs: "Adquisición de Importante Empresa de Telecomunicaciones",
    description: "Advised a Fortune 500 company on the $3.2 billion acquisition of a leading Mexican telecommunications operator, including regulatory approvals and antitrust filings.",
    descriptionEs: "Asesoramos a una empresa Fortune 500 en la adquisición de $3.2 mil millones de un operador de telecomunicaciones líder en México, incluyendo aprobaciones regulatorias y presentaciones de competencia económica.",
    client: "Confidential Client",
    clientEs: "Cliente Confidencial",
    year: 2024,
    practiceAreaSlug: "corporate-ma",
    industrySlug: "technology-industry",
    isHighlight: true,
    order: 1,
  },
  {
    title: "International Arbitration Victory in Energy Dispute",
    titleEs: "Victoria en Arbitraje Internacional en Disputa Energética",
    description: "Successfully represented a multinational energy company in ICC arbitration proceedings, securing a $500 million award in a complex infrastructure dispute.",
    descriptionEs: "Representamos exitosamente a una empresa energética multinacional en procedimientos de arbitraje ICC, obteniendo un laudo de $500 millones en una compleja disputa de infraestructura.",
    client: "International Energy Corporation",
    clientEs: "Corporación Energética Internacional",
    year: 2024,
    practiceAreaSlug: "arbitration",
    industrySlug: "energy-natural-resources-industry",
    isHighlight: true,
    order: 2,
  },
  {
    title: "Landmark Antitrust Defense in Automotive Sector",
    titleEs: "Defensa Histórica en Competencia Económica en Sector Automotriz",
    description: "Defended a leading automotive manufacturer against cartel allegations before COFECE, resulting in complete exoneration and establishing important precedents.",
    descriptionEs: "Defendimos a un fabricante automotriz líder contra alegaciones de cártel ante COFECE, logrando exoneración completa y estableciendo precedentes importantes.",
    client: "Confidential Client",
    clientEs: "Cliente Confidencial",
    year: 2024,
    practiceAreaSlug: "antitrust-competition",
    industrySlug: "automotive-mobility-manufacturing",
    isHighlight: true,
    order: 3,
  },
  {
    title: "Cross-Border M&A in Pharmaceutical Industry",
    titleEs: "M&A Transfronteriza en Industria Farmacéutica",
    description: "Advised on the $1.8 billion cross-border acquisition of Mexican pharmaceutical laboratories by a European healthcare conglomerate.",
    descriptionEs: "Asesoramos en la adquisición transfronteriza de $1.8 mil millones de laboratorios farmacéuticos mexicanos por un conglomerado europeo de salud.",
    client: "European Healthcare Group",
    clientEs: "Grupo Europeo de Salud",
    year: 2023,
    practiceAreaSlug: "corporate-ma",
    industrySlug: "pharmaceutical-life-sciences",
    isHighlight: true,
    order: 4,
  },
  {
    title: "Major Restructuring of Retail Chain",
    titleEs: "Reestructuración Mayor de Cadena Minorista",
    description: "Led the comprehensive restructuring of one of Mexico's largest retail chains, involving $2 billion in debt and over 500 creditors.",
    descriptionEs: "Lideramos la reestructuración integral de una de las cadenas minoristas más grandes de México, involucrando $2 mil millones en deuda y más de 500 acreedores.",
    client: "Confidential Client",
    clientEs: "Cliente Confidencial",
    year: 2023,
    practiceAreaSlug: "bankruptcy-restructuring",
    industrySlug: "consumer-goods",
    isHighlight: true,
    order: 5,
  },
  {
    title: "FCPA Investigation and Settlement",
    titleEs: "Investigación y Acuerdo FCPA",
    description: "Represented a multinational corporation in internal investigation and DOJ negotiations, achieving favorable settlement in significant FCPA matter.",
    descriptionEs: "Representamos a una corporación multinacional en investigación interna y negociaciones con el DOJ, logrando un acuerdo favorable en un caso significativo de FCPA.",
    client: "Confidential Client",
    clientEs: "Cliente Confidencial",
    year: 2023,
    practiceAreaSlug: "investigations-anticorruption",
    industrySlug: "financial-services",
    isHighlight: true,
    order: 6,
  },
  {
    title: "Syndicated Loan for Infrastructure Project",
    titleEs: "Crédito Sindicado para Proyecto de Infraestructura",
    description: "Structured and negotiated a $750 million syndicated loan for a major infrastructure project, involving multiple international financial institutions.",
    descriptionEs: "Estructuramos y negociamos un crédito sindicado de $750 millones para un importante proyecto de infraestructura, involucrando múltiples instituciones financieras internacionales.",
    client: "International Infrastructure Fund",
    clientEs: "Fondo Internacional de Infraestructura",
    year: 2023,
    practiceAreaSlug: "banking-finance",
    industrySlug: "financial-services",
    isHighlight: false,
    order: 7,
  },
  {
    title: "Renewable Energy Project Development",
    titleEs: "Desarrollo de Proyecto de Energía Renovable",
    description: "Advised on the development and financing of a 500MW solar energy project, including land acquisition, permits, and power purchase agreements.",
    descriptionEs: "Asesoramos en el desarrollo y financiamiento de un proyecto de energía solar de 500MW, incluyendo adquisición de terrenos, permisos y contratos de compra de energía.",
    client: "Global Renewable Energy Developer",
    clientEs: "Desarrollador Global de Energía Renovable",
    year: 2023,
    practiceAreaSlug: "energy-natural-resources",
    industrySlug: "energy-natural-resources-industry",
    isHighlight: false,
    order: 8,
  },
  {
    title: "Commercial Litigation Victory in Contract Dispute",
    titleEs: "Victoria en Litigio Comercial en Disputa Contractual",
    description: "Obtained favorable judgment in complex commercial litigation involving breach of distribution agreements with damages exceeding $200 million.",
    descriptionEs: "Obtuvimos sentencia favorable en litigio comercial complejo involucrando incumplimiento de acuerdos de distribución con daños superiores a $200 millones.",
    client: "Confidential Client",
    clientEs: "Cliente Confidencial",
    year: 2022,
    practiceAreaSlug: "litigation",
    industrySlug: "consumer-goods",
    isHighlight: false,
    order: 9,
  },
  {
    title: "Tax Controversy Resolution",
    titleEs: "Resolución de Controversia Fiscal",
    description: "Successfully resolved major tax controversy with SAT involving transfer pricing adjustments of over $150 million, achieving substantial reduction.",
    descriptionEs: "Resolvimos exitosamente una importante controversia fiscal con el SAT involucrando ajustes de precios de transferencia de más de $150 millones, logrando reducción sustancial.",
    client: "Multinational Manufacturing Company",
    clientEs: "Empresa Manufacturera Multinacional",
    year: 2022,
    practiceAreaSlug: "tax",
    industrySlug: "automotive-mobility-manufacturing",
    isHighlight: false,
    order: 10,
  },
  {
    title: "Major Real Estate Development Transaction",
    titleEs: "Transacción de Desarrollo Inmobiliario Mayor",
    description: "Advised on $400 million mixed-use development project, including land acquisition, construction financing, and commercial leasing.",
    descriptionEs: "Asesoramos en proyecto de desarrollo de uso mixto de $400 millones, incluyendo adquisición de terreno, financiamiento de construcción y arrendamiento comercial.",
    client: "Real Estate Investment Trust",
    clientEs: "Fideicomiso de Inversión Inmobiliaria",
    year: 2022,
    practiceAreaSlug: "real-estate",
    industrySlug: "real-estate-industry",
    isHighlight: false,
    order: 11,
  },
  {
    title: "Patent Infringement Defense",
    titleEs: "Defensa en Infracción de Patentes",
    description: "Successfully defended a technology company against patent infringement claims valued at $80 million, securing dismissal of all claims.",
    descriptionEs: "Defendimos exitosamente a una empresa de tecnología contra reclamaciones de infracción de patentes valuadas en $80 millones, logrando la desestimación de todas las reclamaciones.",
    client: "Technology Corporation",
    clientEs: "Corporación de Tecnología",
    year: 2022,
    practiceAreaSlug: "intellectual-property",
    industrySlug: "technology-industry",
    isHighlight: false,
    order: 12,
  },
  {
    title: "Collective Labor Agreement Negotiation",
    titleEs: "Negociación de Contrato Colectivo de Trabajo",
    description: "Negotiated collective bargaining agreements for a major manufacturing company with over 15,000 employees across multiple facilities.",
    descriptionEs: "Negociamos contratos colectivos de trabajo para una importante empresa manufacturera con más de 15,000 empleados en múltiples instalaciones.",
    client: "Confidential Client",
    clientEs: "Cliente Confidencial",
    year: 2022,
    practiceAreaSlug: "labor-employment",
    industrySlug: "automotive-mobility-manufacturing",
    isHighlight: false,
    order: 13,
  },
  {
    title: "Trade Remedy Investigation",
    titleEs: "Investigación de Remedio Comercial",
    description: "Represented steel producers in antidumping investigation, successfully obtaining protective duties against unfair import practices.",
    descriptionEs: "Representamos a productores de acero en investigación antidumping, obteniendo exitosamente aranceles de protección contra prácticas de importación desleales.",
    client: "Mexican Steel Producers Association",
    clientEs: "Asociación Mexicana de Productores de Acero",
    year: 2021,
    practiceAreaSlug: "international-trade",
    industrySlug: "automotive-mobility-manufacturing",
    isHighlight: false,
    order: 14,
  },
  {
    title: "TMT Sector Merger Approval",
    titleEs: "Aprobación de Fusión en Sector TMT",
    description: "Secured regulatory approval for complex merger in telecommunications sector, navigating IFT and COFECE requirements.",
    descriptionEs: "Obtuvimos aprobación regulatoria para fusión compleja en sector de telecomunicaciones, navegando requisitos del IFT y COFECE.",
    client: "Telecommunications Company",
    clientEs: "Empresa de Telecomunicaciones",
    year: 2021,
    practiceAreaSlug: "telecommunications-media-technology",
    industrySlug: "technology-industry",
    isHighlight: false,
    order: 15,
  },
  {
    title: "Environmental Permitting for Mining Project",
    titleEs: "Permisos Ambientales para Proyecto Minero",
    description: "Obtained all necessary environmental permits and approvals for a large-scale mining operation, including SEMARNAT authorizations.",
    descriptionEs: "Obtuvimos todos los permisos y aprobaciones ambientales necesarios para una operación minera a gran escala, incluyendo autorizaciones de SEMARNAT.",
    client: "International Mining Company",
    clientEs: "Empresa Minera Internacional",
    year: 2021,
    practiceAreaSlug: "environmental",
    industrySlug: "energy-natural-resources-industry",
    isHighlight: false,
    order: 16,
  },
  {
    title: "Government Contract Award Defense",
    titleEs: "Defensa de Adjudicación de Contrato Gubernamental",
    description: "Successfully defended contract award in administrative litigation, protecting a $120 million infrastructure concession.",
    descriptionEs: "Defendimos exitosamente adjudicación de contrato en litigio administrativo, protegiendo una concesión de infraestructura de $120 millones.",
    client: "Infrastructure Company",
    clientEs: "Empresa de Infraestructura",
    year: 2021,
    practiceAreaSlug: "administrative-law",
    industrySlug: "real-estate-industry",
    isHighlight: false,
    order: 17,
  },
  {
    title: "German Automotive Company Market Entry",
    titleEs: "Entrada al Mercado de Empresa Automotriz Alemana",
    description: "Advised a major German automotive manufacturer on its market entry strategy, including joint venture structuring and regulatory compliance.",
    descriptionEs: "Asesoramos a un importante fabricante automotriz alemán en su estrategia de entrada al mercado, incluyendo estructuración de joint venture y cumplimiento regulatorio.",
    client: "German Automotive Manufacturer",
    clientEs: "Fabricante Automotriz Alemán",
    year: 2021,
    practiceAreaSlug: "german-desk",
    industrySlug: "automotive-mobility-manufacturing",
    isHighlight: false,
    order: 18,
  },
  {
    title: "ESG Framework Implementation",
    titleEs: "Implementación de Marco ESG",
    description: "Developed comprehensive ESG compliance framework for a major financial institution, including sustainability reporting and governance policies.",
    descriptionEs: "Desarrollamos marco integral de cumplimiento ESG para una importante institución financiera, incluyendo reportes de sustentabilidad y políticas de gobierno corporativo.",
    client: "Leading Mexican Bank",
    clientEs: "Banco Mexicano Líder",
    year: 2024,
    practiceAreaSlug: "esg",
    industrySlug: "financial-services",
    isHighlight: false,
    order: 19,
  },
];

export async function seed() {
  console.log("Seeding database with real Von Wobeser y Sierra content...");

  const existingNews = await db.select().from(news);
  if (existingNews.length === 0) {
    console.log("Seeding news...");
    await db.insert(news).values(newsData);
  }

  const existingImages = await db.select().from(officeImages);
  if (existingImages.length === 0) {
    console.log("Seeding office images...");
    await db.insert(officeImages).values(officeImagesData);
  }

  const existingPracticeGroups = await db.select().from(practiceGroups);
  if (existingPracticeGroups.length === 0) {
    console.log("Seeding practice groups...");
    await db.insert(practiceGroups).values(practiceGroupsData);
  }

  const existingIndustryGroups = await db.select().from(industryGroups);
  if (existingIndustryGroups.length === 0) {
    console.log("Seeding industry groups...");
    await db.insert(industryGroups).values(industryGroupsData);
  }

  const existingTeamMembers = await db.select().from(teamMembers);
  if (existingTeamMembers.length === 0) {
    console.log("Seeding team members...");
    await db.insert(teamMembers).values(teamMembersData);
  }

  const existingRepresentativeMatters = await db.select().from(representativeMatters);
  if (existingRepresentativeMatters.length === 0) {
    console.log("Seeding representative matters...");
    await db.insert(representativeMatters).values(representativeMattersData);
  }

  // Seed default admin user
  const existingAdminUsers = await db.select().from(adminUsers);
  if (existingAdminUsers.length === 0) {
    console.log("Seeding default admin user...");
    const passwordHash = await hashPassword("Admin123!");
    await db.insert(adminUsers).values({
      username: "admin",
      email: "admin@vonwobeser.com",
      passwordHash,
      role: "super_admin",
      isActive: true,
    });
    console.log("Default admin user created: username='admin', password='Admin123!'");
  }

  console.log("Database seeded successfully with real Von Wobeser y Sierra content!");
}
