import { db } from "./db";
import { news, officeImages, practiceGroups, industryGroups, teamMembers } from "@shared/schema";

const practiceGroupsData = [
  { name: "Antitrust & Competition", nameEs: "Competencia Econ\u00f3mica", slug: "antitrust-competition", description: "We advise on merger control, cartel investigations, and competition compliance.", descriptionEs: "Asesoramos en control de concentraciones, investigaciones de c\u00e1rteles y cumplimiento de competencia.", iconName: "scale", order: 1 },
  { name: "Arbitration", nameEs: "Arbitraje", slug: "arbitration", description: "Resolution of complex commercial and investment disputes through arbitration.", descriptionEs: "Resoluci\u00f3n de disputas comerciales y de inversi\u00f3n complejas a trav\u00e9s del arbitraje.", iconName: "gavel", order: 2 },
  { name: "Banking & Finance", nameEs: "Banca y Finanzas", slug: "banking-finance", description: "Comprehensive financial services including project finance, acquisition finance, and restructuring.", descriptionEs: "Servicios financieros integrales incluyendo financiamiento de proyectos, adquisiciones y reestructuraci\u00f3n.", iconName: "landmark", order: 3 },
  { name: "Capital Markets", nameEs: "Mercados de Capitales", slug: "capital-markets", description: "Securities offerings, IPOs, and regulatory compliance for capital markets transactions.", descriptionEs: "Ofertas de valores, OPIs y cumplimiento regulatorio para transacciones de mercados de capitales.", iconName: "trending-up", order: 4 },
  { name: "Corporate & M&A", nameEs: "Corporativo y M&A", slug: "corporate-ma", description: "Mergers, acquisitions, joint ventures, and corporate restructurings.", descriptionEs: "Fusiones, adquisiciones, empresas conjuntas y reestructuraciones corporativas.", iconName: "briefcase", order: 5 },
  { name: "Energy & Natural Resources", nameEs: "Energ\u00eda y Recursos Naturales", slug: "energy-natural-resources", description: "Oil & gas, electricity, renewables, and mining legal services.", descriptionEs: "Servicios legales de petr\u00f3leo y gas, electricidad, renovables y miner\u00eda.", iconName: "zap", order: 6 },
  { name: "Environmental", nameEs: "Ambiental", slug: "environmental", description: "Environmental compliance, permitting, and sustainability matters.", descriptionEs: "Cumplimiento ambiental, permisos y asuntos de sustentabilidad.", iconName: "leaf", order: 7 },
  { name: "Intellectual Property", nameEs: "Propiedad Intelectual", slug: "intellectual-property", description: "Patents, trademarks, copyrights, and technology licensing.", descriptionEs: "Patentes, marcas, derechos de autor y licenciamiento de tecnolog\u00eda.", iconName: "lightbulb", order: 8 },
  { name: "International Trade", nameEs: "Comercio Internacional", slug: "international-trade", description: "Trade remedies, customs, and international commerce regulations.", descriptionEs: "Remedios comerciales, aduanas y regulaciones de comercio internacional.", iconName: "globe", order: 9 },
  { name: "Labor & Employment", nameEs: "Laboral", slug: "labor-employment", description: "Employment law, labor relations, and workplace compliance.", descriptionEs: "Derecho laboral, relaciones laborales y cumplimiento en el lugar de trabajo.", iconName: "users", order: 10 },
  { name: "Litigation", nameEs: "Litigio", slug: "litigation", description: "Civil, commercial, and constitutional litigation before all courts.", descriptionEs: "Litigio civil, comercial y constitucional ante todos los tribunales.", iconName: "gavel", order: 11 },
  { name: "Private Equity", nameEs: "Capital Privado", slug: "private-equity", description: "Fund formation, investments, and portfolio company matters.", descriptionEs: "Formaci\u00f3n de fondos, inversiones y asuntos de empresas de portafolio.", iconName: "trending-up", order: 12 },
  { name: "Real Estate", nameEs: "Inmobiliario", slug: "real-estate", description: "Acquisitions, development, financing, and real estate transactions.", descriptionEs: "Adquisiciones, desarrollo, financiamiento y transacciones inmobiliarias.", iconName: "building", order: 13 },
  { name: "Regulatory", nameEs: "Regulatorio", slug: "regulatory", description: "Regulatory compliance across multiple sectors and government relations.", descriptionEs: "Cumplimiento regulatorio en m\u00faltiples sectores y relaciones gubernamentales.", iconName: "file-text", order: 14 },
  { name: "Restructuring & Insolvency", nameEs: "Reestructura e Insolvencia", slug: "restructuring-insolvency", description: "Corporate reorganizations, bankruptcy, and debt restructuring.", descriptionEs: "Reorganizaciones corporativas, quiebras y reestructura de deuda.", iconName: "refresh-cw", order: 15 },
  { name: "Tax", nameEs: "Fiscal", slug: "tax", description: "Tax planning, controversies, and compliance for corporate and individual clients.", descriptionEs: "Planeaci\u00f3n fiscal, controversias y cumplimiento para clientes corporativos e individuales.", iconName: "calculator", order: 16 },
  { name: "Technology & Data Privacy", nameEs: "Tecnolog\u00eda y Privacidad", slug: "technology-data-privacy", description: "Data protection, cybersecurity, and technology transactions.", descriptionEs: "Protecci\u00f3n de datos, ciberseguridad y transacciones tecnol\u00f3gicas.", iconName: "shield", order: 17 },
  { name: "White Collar Defense", nameEs: "Defensa Penal Corporativa", slug: "white-collar-defense", description: "Criminal defense, investigations, and compliance programs.", descriptionEs: "Defensa penal, investigaciones y programas de cumplimiento.", iconName: "shield-check", order: 18 },
];

const industryGroupsData = [
  { name: "Aerospace & Defense", nameEs: "Aeroespacial y Defensa", slug: "aerospace-defense", description: "Legal services for aerospace manufacturers, defense contractors, and aviation.", descriptionEs: "Servicios legales para fabricantes aeroespaciales, contratistas de defensa y aviaci\u00f3n.", iconName: "plane", order: 1 },
  { name: "Automotive", nameEs: "Automotriz", slug: "automotive", description: "Comprehensive support for OEMs, suppliers, and mobility companies.", descriptionEs: "Apoyo integral para OEMs, proveedores y empresas de movilidad.", iconName: "car", order: 2 },
  { name: "Financial Services", nameEs: "Servicios Financieros", slug: "financial-services", description: "Banks, insurance companies, fintech, and investment funds.", descriptionEs: "Bancos, aseguradoras, fintech y fondos de inversi\u00f3n.", iconName: "dollar-sign", order: 3 },
  { name: "Infrastructure", nameEs: "Infraestructura", slug: "infrastructure", description: "Transportation, public works, and infrastructure development projects.", descriptionEs: "Transporte, obras p\u00fablicas y proyectos de desarrollo de infraestructura.", iconName: "construction", order: 4 },
  { name: "Life Sciences & Healthcare", nameEs: "Ciencias de la Vida y Salud", slug: "life-sciences-healthcare", description: "Pharmaceuticals, medical devices, biotechnology, and healthcare providers.", descriptionEs: "Farmac\u00e9uticas, dispositivos m\u00e9dicos, biotecnolog\u00eda y proveedores de salud.", iconName: "heart-pulse", order: 5 },
  { name: "Technology, Media & Telecom", nameEs: "Tecnolog\u00eda, Medios y Telecomunicaciones", slug: "technology-media-telecom", description: "Tech companies, media groups, and telecommunications operators.", descriptionEs: "Empresas tecnol\u00f3gicas, grupos de medios y operadores de telecomunicaciones.", iconName: "monitor", order: 6 },
  { name: "Retail & Consumer Products", nameEs: "Retail y Productos de Consumo", slug: "retail-consumer-products", description: "Retailers, consumer goods manufacturers, and e-commerce businesses.", descriptionEs: "Minoristas, fabricantes de bienes de consumo y negocios de comercio electr\u00f3nico.", iconName: "shopping-bag", order: 7 },
];

const teamMembersData = [
  { name: "Claus von Wobeser", slug: "claus-von-wobeser", title: "Senior Partner", titleEs: "Socio Senior", role: "Founding Partner", roleEs: "Socio Fundador", email: "cvonwobeser@vonwobeser.com", isPartner: true, order: 1, imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" },
  { name: "Fernando Carre\u00f1o", slug: "fernando-carreno", title: "Partner", titleEs: "Socio", role: "Executive Committee Member", roleEs: "Miembro del Comit\u00e9 Ejecutivo", email: "fcarreno@vonwobeser.com", isPartner: true, order: 2, imageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face" },
  { name: "Eduardo Rivadeneyra", slug: "eduardo-rivadeneyra", title: "Partner", titleEs: "Socio", role: "Corporate & M&A Practice Head", roleEs: "L\u00edder de Pr\u00e1ctica Corporativo y M&A", email: "erivadeneyra@vonwobeser.com", isPartner: true, order: 3, imageUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face" },
  { name: "Luis Burgue\u00f1o", slug: "luis-burgueno", title: "Partner", titleEs: "Socio", role: "Energy Practice Head", roleEs: "L\u00edder de Pr\u00e1ctica de Energ\u00eda", email: "lburgueno@vonwobeser.com", isPartner: true, order: 4, imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face" },
  { name: "Montserrat Maqueda", slug: "montserrat-maqueda", title: "Partner", titleEs: "Socia", role: "Antitrust & Competition Head", roleEs: "L\u00edder de Competencia Econ\u00f3mica", email: "mmaqueda@vonwobeser.com", isPartner: true, order: 5, imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face" },
  { name: "Alejandro Ogarrio", slug: "alejandro-ogarrio", title: "Partner", titleEs: "Socio", role: "Banking & Finance Head", roleEs: "L\u00edder de Banca y Finanzas", email: "aogarrio@vonwobeser.com", isPartner: true, order: 6, imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&crop=face" },
  { name: "Diana Pineda", slug: "diana-pineda", title: "Partner", titleEs: "Socia", role: "Labor & Employment Head", roleEs: "L\u00edder de Pr\u00e1ctica Laboral", email: "dpineda@vonwobeser.com", isPartner: true, order: 7, imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face" },
  { name: "Ricardo Le\u00f3n", slug: "ricardo-leon", title: "Partner", titleEs: "Socio", role: "Litigation Head", roleEs: "L\u00edder de Litigio", email: "rleon@vonwobeser.com", isPartner: true, order: 8, imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face" },
  { name: "Andrea Rodr\u00edguez", slug: "andrea-rodriguez", title: "Senior Associate", titleEs: "Asociada Senior", role: "Corporate & M&A", roleEs: "Corporativo y M&A", email: "arodriguez@vonwobeser.com", isPartner: false, order: 9, imageUrl: "https://images.unsplash.com/photo-1598550874175-4d0ef436c909?w=400&h=400&fit=crop&crop=face" },
  { name: "Carlos Mendoza", slug: "carlos-mendoza", title: "Associate", titleEs: "Asociado", role: "Energy & Natural Resources", roleEs: "Energ\u00eda y Recursos Naturales", email: "cmendoza@vonwobeser.com", isPartner: false, order: 10, imageUrl: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop&crop=face" },
];

const newsData = [
  {
    title: "Von Wobeser y Sierra completes transition to new offices: a strategic investment in the firm's future",
    titleEs: "Von Wobeser y Sierra completa la transici\u00f3n a nuevas oficinas: una inversi\u00f3n estrat\u00e9gica en el futuro de la firma",
    excerpt: "The firm has completed the move to its new location in Polanco.",
    excerptEs: "La firma ha completado la mudanza a su nueva ubicaci\u00f3n en Polanco.",
    content: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos El\u00edseos area in Polanco. This relocation marks a stage of growth, evolution, and consolidation, and represents a key investment in the firm's future. The new facilities are designed to maximize collaboration across all areas for the benefit of clients, ensuring the continued delivery of high-quality and integrated services.",
    contentEs: "Von Wobeser y Sierra ha completado la transici\u00f3n a sus nuevas oficinas en la din\u00e1mica zona de Campos El\u00edseos en Polanco. Esta reubicaci\u00f3n marca una etapa de crecimiento, evoluci\u00f3n y consolidaci\u00f3n, y representa una inversi\u00f3n clave en el futuro de la firma. Las nuevas instalaciones est\u00e1n dise\u00f1adas para maximizar la colaboraci\u00f3n en todas las \u00e1reas en beneficio de los clientes, asegurando la entrega continua de servicios de alta calidad e integrados.",
    slug: "new-offices-transition",
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    published: true,
  },
  {
    title: "Von Wobeser y Sierra has been ranked by Chambers and Partners Latin America 2026",
    titleEs: "Von Wobeser y Sierra ha sido clasificada por Chambers and Partners Latin America 2026",
    excerpt: "The firm continues to be recognized as a leading practice in Mexico.",
    excerptEs: "La firma contin\u00faa siendo reconocida como una pr\u00e1ctica l\u00edder en M\u00e9xico.",
    content: "Von Wobeser y Sierra has received top rankings in the Chambers and Partners Latin America 2026 guide, reinforcing its position as one of Mexico's leading law firms. The firm was recognized across multiple practice areas including Corporate/M&A, Banking & Finance, and Energy.",
    contentEs: "Von Wobeser y Sierra ha recibido las m\u00e1s altas clasificaciones en la gu\u00eda Chambers and Partners Latin America 2026, reforzando su posici\u00f3n como una de las principales firmas de abogados de M\u00e9xico. La firma fue reconocida en m\u00faltiples \u00e1reas de pr\u00e1ctica incluyendo Corporativo/M&A, Banca y Finanzas, y Energ\u00eda.",
    slug: "chambers-ranking-2026",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    published: true,
  },
  {
    title: "Leading practice groups recognized in international rankings",
    titleEs: "Grupos de pr\u00e1ctica l\u00edderes reconocidos en rankings internacionales",
    excerpt: "Multiple practice areas receive top-tier recognition.",
    excerptEs: "M\u00faltiples \u00e1reas de pr\u00e1ctica reciben reconocimiento de primer nivel.",
    content: "Von Wobeser y Sierra's practice groups continue to receive international recognition for their excellence in legal services. The firm's Antitrust, Corporate, Energy, and Tax practices have all been highlighted in recent rankings.",
    contentEs: "Los grupos de pr\u00e1ctica de Von Wobeser y Sierra contin\u00faan recibiendo reconocimiento internacional por su excelencia en servicios legales. Las pr\u00e1cticas de Competencia, Corporativo, Energ\u00eda y Fiscal de la firma han sido destacadas en rankings recientes.",
    slug: "international-rankings",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    published: true,
  },
];

const officeImagesData = [
  { imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80", alt: "Modern office collaborative workspace", altEs: "Espacio de trabajo colaborativo moderno", order: 1 },
  { imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Office meeting room with city views", altEs: "Sala de juntas con vistas a la ciudad", order: 2 },
  { imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Modern reception area", altEs: "\u00c1rea de recepci\u00f3n moderna", order: 3 },
];

export async function seed() {
  console.log("Seeding database...");

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

  console.log("Database seeded successfully!");
}
