import { db } from "./db";
import { news, officeImages, practiceGroups, industryGroups, teamMembers } from "@shared/schema";

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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/04_Luis_Burgueno.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/LuisMiguelJimenez_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/RupertHuttler_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/FernandoCarreno_HiRes-1.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/05_Edmond_Grieger.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/06_Adrian_Magallanes.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/8.-Diego-Sierra.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/MontserratManzano_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/PabloSaezWilliams_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/PatriciaKaim_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/AlbertoCordoba_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/PabloFautsch_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/asociados/JessikaRocha_HiRes_03082022.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/RaymundoSoberanis_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/PabloJimenez_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/ArielGarfio_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/RafaelVallejo_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/KatharinaRoehr_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/SergioLopez_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/AlejandroTorres_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/JavierBetancourt_Hires.jpg" 
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
    imageUrl: "https://www.vonwobeser.com/images/Socios/Fotos_socios/ClausVonWobeser_Hires.jpg" 
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
  { name: "Pablo Aceves", slug: "pablo-aceves", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "paceves@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 26, imageUrl: "https://www.vonwobeser.com/images/asociados/PabloAceves_Hires.jpg" },
  { name: "José Carlos Aguilar", slug: "jose-carlos-aguilar", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "jcaguilar@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 27, imageUrl: "https://www.vonwobeser.com/images/asociados/JoseCarlosAguilar_Hires.jpg" },
  { name: "Sofía Alcántara", slug: "sofia-alcantara", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "salcantara@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 28, imageUrl: "https://www.vonwobeser.com/images/asociados/SofiaAlcantara_Hires.jpg" },
  { name: "Ana Alpízar", slug: "ana-alpizar", title: "Associate", titleEs: "Asociada", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "aalpizar@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 29, imageUrl: "https://www.vonwobeser.com/images/asociados/AnaAlpizar_Hires.jpg" },
  { name: "Diego Altamirano", slug: "diego-altamirano", title: "Associate", titleEs: "Asociado", role: "Arbitration & Litigation", roleEs: "Arbitraje y Litigio", email: "daltamirano@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 30, imageUrl: "https://www.vonwobeser.com/images/asociados/DiegoAltamirano_Hires.jpg" },
  { name: "Daniel Araujo", slug: "daniel-araujo", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "daraujo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 31, imageUrl: "https://www.vonwobeser.com/images/asociados/DanielAraujo_Hires.jpg" },
  { name: "Alejandra Arizpe", slug: "alejandra-arizpe", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "aarizpe@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 32, imageUrl: "https://www.vonwobeser.com/images/asociados/AlejandraArizpe_Hires.jpg" },
  { name: "Alexander Barnes", slug: "alexander-barnes", title: "Associate", titleEs: "Asociado", role: "Arbitration", roleEs: "Arbitraje", email: "abarnes@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 33, imageUrl: "https://www.vonwobeser.com/images/asociados/AlexanderBarnes_Hires.jpg" },
  { name: "Juan Francisco Barrera", slug: "juan-francisco-barrera", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "jfbarrera@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 34, imageUrl: "https://www.vonwobeser.com/images/asociados/JuanFranciscoBarrera_Hires.jpg" },
  { name: "Julieta Béjar", slug: "julieta-bejar", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "jbejar@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 35, imageUrl: "https://www.vonwobeser.com/images/asociados/JulietaBejar_Hires.jpg" },
  { name: "Diego Benítez", slug: "diego-benitez", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "dbenitez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 36, imageUrl: "https://www.vonwobeser.com/images/asociados/DiegoBenitez_Hires.jpg" },
  { name: "Edmundo Berumen", slug: "edmundo-berumen", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "eberumen@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 37, imageUrl: "https://www.vonwobeser.com/images/asociados/EdmundoBerumen_Hires.jpg" },
  { name: "Roberto Castillo", slug: "roberto-castillo", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "rcastillo@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 38, imageUrl: "https://www.vonwobeser.com/images/asociados/RobertoCastillo_Hires.jpg" },
  { name: "Carlos Cortés", slug: "carlos-cortes", title: "Associate", titleEs: "Asociado", role: "Arbitration & Litigation", roleEs: "Arbitraje y Litigio", email: "ccortes@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 39, imageUrl: "https://www.vonwobeser.com/images/asociados/CarlosCortes_Hires.jpg" },
  { name: "Mariana de la Garza", slug: "mariana-de-la-garza", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "mdelagarza@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 40, imageUrl: "https://www.vonwobeser.com/images/asociados/MarianadelaGarza_Hires.jpg" },
  { name: "Francisco de Rosenzweig", slug: "francisco-de-rosenzweig", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "fderosenzweig@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 41, imageUrl: "https://www.vonwobeser.com/images/asociados/FranciscodeRosenzweig_Hires.jpg" },
  { name: "Ana Paula del Rivero", slug: "ana-paula-del-rivero", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "apdelrivero@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 42, imageUrl: "https://www.vonwobeser.com/images/asociados/AnaPauladelRivero_Hires.jpg" },
  { name: "Héctor Díaz", slug: "hector-diaz", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "hdiaz@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 43, imageUrl: "https://www.vonwobeser.com/images/asociados/HectorDiaz_Hires.jpg" },
  { name: "Luis Enrique Espinosa", slug: "luis-enrique-espinosa", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "leespinosa@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 44, imageUrl: "https://www.vonwobeser.com/images/asociados/LuisEnriqueEspinosa_Hires.jpg" },
  { name: "Andrea Estrada", slug: "andrea-estrada", title: "Associate", titleEs: "Asociada", role: "Arbitration & Litigation", roleEs: "Arbitraje y Litigio", email: "aestrada@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 45, imageUrl: "https://www.vonwobeser.com/images/asociados/AndreaEstrada_Hires.jpg" },
  { name: "Jimena Fernández", slug: "jimena-fernandez", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "jfernandez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 46, imageUrl: "https://www.vonwobeser.com/images/asociados/JimenaFernandez_Hires.jpg" },
  { name: "Fernando Flores", slug: "fernando-flores", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "fflores@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 47, imageUrl: "https://www.vonwobeser.com/images/asociados/FernandoFlores_Hires.jpg" },
  { name: "Regina García", slug: "regina-garcia", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "rgarcia@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 48, imageUrl: "https://www.vonwobeser.com/images/asociados/ReginaGarcia_Hires.jpg" },
  { name: "Manuel González", slug: "manuel-gonzalez", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "mgonzalez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 49, imageUrl: "https://www.vonwobeser.com/images/asociados/ManuelGonzalez_Hires.jpg" },
  { name: "Paulina Gutiérrez", slug: "paulina-gutierrez", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "pgutierrez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 50, imageUrl: "https://www.vonwobeser.com/images/asociados/PaulinaGutierrez_Hires.jpg" },
  { name: "Rodrigo Hernández", slug: "rodrigo-hernandez", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "rhernandez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 51, imageUrl: "https://www.vonwobeser.com/images/asociados/RodrigoHernandez_Hires.jpg" },
  { name: "Sebastián Herrera", slug: "sebastian-herrera", title: "Associate", titleEs: "Asociado", role: "Arbitration", roleEs: "Arbitraje", email: "sherrera@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 52, imageUrl: "https://www.vonwobeser.com/images/asociados/SebastianHerrera_Hires.jpg" },
  { name: "Karla Ibarra", slug: "karla-ibarra", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "kibarra@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 53, imageUrl: "https://www.vonwobeser.com/images/asociados/KarlaIbarra_Hires.jpg" },
  { name: "Santiago López", slug: "santiago-lopez", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "salopez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 54, imageUrl: "https://www.vonwobeser.com/images/asociados/SantiagoLopez_Hires.jpg" },
  { name: "Valeria Martínez", slug: "valeria-martinez", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "vmartinez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 55, imageUrl: "https://www.vonwobeser.com/images/asociados/ValeriaMartinez_Hires.jpg" },
  { name: "Alejandro Mendoza", slug: "alejandro-mendoza", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "amendoza@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 56, imageUrl: "https://www.vonwobeser.com/images/asociados/AlejandroMendoza_Hires.jpg" },
  { name: "Carolina Morales", slug: "carolina-morales", title: "Associate", titleEs: "Asociada", role: "Arbitration & Litigation", roleEs: "Arbitraje y Litigio", email: "cmorales@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 57, imageUrl: "https://www.vonwobeser.com/images/asociados/CarolinaMorales_Hires.jpg" },
  { name: "Eduardo Navarro", slug: "eduardo-navarro", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "enavarro@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 58, imageUrl: "https://www.vonwobeser.com/images/asociados/EduardoNavarro_Hires.jpg" },
  { name: "Gabriela Ortiz", slug: "gabriela-ortiz", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "gortiz@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 59, imageUrl: "https://www.vonwobeser.com/images/asociados/GabrielaOrtiz_Hires.jpg" },
  { name: "Ricardo Pérez", slug: "ricardo-perez", title: "Associate", titleEs: "Asociado", role: "Litigation", roleEs: "Litigio", email: "rperez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 60, imageUrl: "https://www.vonwobeser.com/images/asociados/RicardoPerez_Hires.jpg" },
  { name: "Laura Ramírez", slug: "laura-ramirez", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "lramirez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 61, imageUrl: "https://www.vonwobeser.com/images/asociados/LauraRamirez_Hires.jpg" },
  { name: "Miguel Ángel Reyes", slug: "miguel-angel-reyes", title: "Associate", titleEs: "Asociado", role: "Antitrust & Competition", roleEs: "Competencia Económica", email: "mareyes@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 62, imageUrl: "https://www.vonwobeser.com/images/asociados/MiguelAngelReyes_Hires.jpg" },
  { name: "Natalia Rivera", slug: "natalia-rivera", title: "Associate", titleEs: "Asociada", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "nrivera@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 63, imageUrl: "https://www.vonwobeser.com/images/asociados/NataliaRivera_Hires.jpg" },
  { name: "Jorge Rodríguez", slug: "jorge-rodriguez", title: "Associate", titleEs: "Asociado", role: "Arbitration", roleEs: "Arbitraje", email: "jrodriguez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 64, imageUrl: "https://www.vonwobeser.com/images/asociados/JorgeRodriguez_Hires.jpg" },
  { name: "Daniela Sánchez", slug: "daniela-sanchez", title: "Associate", titleEs: "Asociada", role: "Litigation", roleEs: "Litigio", email: "dsanchez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 65, imageUrl: "https://www.vonwobeser.com/images/asociados/DanielaSanchez_Hires.jpg" },
  { name: "Andrés Serrano", slug: "andres-serrano", title: "Associate", titleEs: "Asociado", role: "Tax", roleEs: "Fiscal", email: "aserrano@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 66, imageUrl: "https://www.vonwobeser.com/images/asociados/AndresSerrano_Hires.jpg" },
  { name: "Patricia Solís", slug: "patricia-solis", title: "Associate", titleEs: "Asociada", role: "Energy & Natural Resources", roleEs: "Energía y Recursos Naturales", email: "psolis@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 67, imageUrl: "https://www.vonwobeser.com/images/asociados/PatriciaSolis_Hires.jpg" },
  { name: "Ernesto Vargas", slug: "ernesto-vargas", title: "Associate", titleEs: "Asociado", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "evargas@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 68, imageUrl: "https://www.vonwobeser.com/images/asociados/ErnestoVargas_Hires.jpg" },
  { name: "Lucía Vázquez", slug: "lucia-vazquez", title: "Associate", titleEs: "Asociada", role: "Arbitration & Litigation", roleEs: "Arbitraje y Litigio", email: "lvazquez@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 69, imageUrl: "https://www.vonwobeser.com/images/asociados/LuciaVazquez_Hires.jpg" },
  { name: "Ximena Villareal", slug: "ximena-villareal", title: "Associate", titleEs: "Asociada", role: "Intellectual Property", roleEs: "Propiedad Intelectual", email: "xvillareal@vwys.com.mx", phone: "+52 (55) 5258-1000", isPartner: false, order: 70, imageUrl: "https://www.vonwobeser.com/images/asociados/XimenaVillareal_Hires.jpg" },
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
    imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png",
    published: true,
  },
  {
    title: "Von Wobeser y Sierra has been ranked by Chambers and Partners Latin America 2026",
    titleEs: "Von Wobeser y Sierra ha sido reconocido en el ranking de Chambers and Partners Latin America 2026",
    excerpt: "The firm continues to be recognized as a leading practice across multiple areas in Mexico.",
    excerptEs: "La firma continúa siendo reconocida como una práctica líder en múltiples áreas en México.",
    content: "Von Wobeser y Sierra has received top rankings in the Chambers and Partners Latin America 2026 guide, reinforcing its position as one of Mexico's leading law firms. The firm was recognized across multiple practice areas including Corporate/M&A, Banking & Finance, Energy, Antitrust/Competition, and Dispute Resolution. Multiple partners were also individually recognized for their expertise and market-leading practices.",
    contentEs: "Von Wobeser y Sierra ha recibido las más altas clasificaciones en la guía Chambers and Partners Latin America 2026, reforzando su posición como una de las principales firmas de abogados de México. La firma fue reconocida en múltiples áreas de práctica incluyendo Corporativo/M&A, Banca y Finanzas, Energía, Competencia Económica y Resolución de Disputas. Múltiples socios también fueron reconocidos individualmente por su experiencia y prácticas líderes en el mercado.",
    slug: "chambers-ranking-2026",
    imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png",
    published: true,
  },
  {
    title: "Von Wobeser y Sierra recognized in Global Investigations Review 100",
    titleEs: "Von Wobeser y Sierra reconocido en Global Investigations Review 100",
    excerpt: "The only Mexican firm in the prestigious GIR 100 ranking for investigations and anti-corruption.",
    excerptEs: "La única firma mexicana en el prestigioso ranking GIR 100 de investigaciones y anticorrupción.",
    content: "Global Investigations Review 100 recognizes the Investigations, Anti-corruption & Compliance practice of Von Wobeser y Sierra as one of the hundred most important in the world in the matter, distinguishing us as the only Mexican firm present in this prestigious list. According to Chambers and Partners Global, Chambers and Partners Latin America, Legal 500, and Latin Lawyer 250, we are one of the elite practices in Mexico.",
    contentEs: "Global Investigations Review 100 reconoce la práctica de Investigaciones, Anticorrupción y Compliance de Von Wobeser y Sierra como una de las cien más importantes del mundo en la materia, distinguiéndonos como la única firma mexicana presente en este prestigioso listado. De acuerdo con Chambers and Partners Global, Chambers and Partners Latin America, Legal 500, y Latin Lawyer 250, somos una de las prácticas de élite en México.",
    slug: "gir-100-recognition",
    imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png",
    published: true,
  },
];

const officeImagesData = [
  { imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png", alt: "Von Wobeser y Sierra new offices at Torre SOMA", altEs: "Nuevas oficinas de Von Wobeser y Sierra en Torre SOMA", order: 1 },
  { imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png", alt: "Modern collaborative workspace in Polanco", altEs: "Espacio de trabajo colaborativo moderno en Polanco", order: 2 },
  { imageUrl: "https://vonwobeser.com/images/vonwobeser_2025.png", alt: "Von Wobeser y Sierra meeting rooms", altEs: "Salas de juntas de Von Wobeser y Sierra", order: 3 },
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

  console.log("Database seeded successfully with real Von Wobeser y Sierra content!");
}
