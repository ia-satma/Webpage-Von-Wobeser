import { eq } from "drizzle-orm";
import { db } from "../db";
import { siteConfig } from "@shared/schema";

export type ConfigMap = Record<string, { value: string; valueEs: string; type: string }>;

const CURRENT_HERO_MEDIA = {
  desktop: "/images/hero-092c5875ed80af62-desktop.mp4",
  mobile: "/images/hero-092c5875ed80af62-mobile.mp4",
  poster: "/images/hero-092c5875ed80af62-poster.webp",
} as const;

/** Default site-config keys for the editable parts of the mirror frontend. */
const DEFAULTS: Array<{ key: string; value: string; valueEs?: string; type: string; category: string; description: string }> = [
  { key: "site_favicon", value: "/favicon-512x512.png", type: "url", category: "seo", description: "Favicon global del sitio y del panel administrativo" },
  { key: "hero_video", value: CURRENT_HERO_MEDIA.desktop, type: "url", category: "home", description: "Video optimizado de alta calidad del hero para escritorio" },
  { key: "hero_video_mobile", value: CURRENT_HERO_MEDIA.mobile, type: "url", category: "home", description: "Video optimizado de alta calidad del hero para móvil" },
  { key: "hero_video_poster", value: CURRENT_HERO_MEDIA.poster, type: "url", category: "home", description: "Póster del primer fotograma real del hero" },
  { key: "hero_practice_link", value: "/about", valueEs: "/acerca-de", type: "url", category: "home", description: "Destino bilingüe al hacer clic en el video del hero" },
  { key: "home_experience_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar la frase de años de experiencia en la portada" },
  { key: "home_experience", value: "Von Wobeser y Sierra, S.C. has more than forty years of experience.", valueEs: "Von Wobeser y Sierra, S.C. cuenta con más de cuarenta años de experiencia.", type: "text", category: "home", description: "Frase de experiencia de la portada" },
  { key: "home_team_stats_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar las cifras del equipo en la portada" },
  { key: "home_team_stats", value: "We have more than 180 legal team members (including 26 partners, 6 of counsel, and 8 counsel) and legal interns, plus administrative staff.", valueEs: "Tenemos más de 180 integrantes del equipo legal (incluyendo 26 socios, 6 of counsel y 8 consejeros) y pasantes, más el personal administrativo.", type: "text", category: "home", description: "Cifras del equipo en la portada" },
  { key: "home_practices_label", value: "Practices", valueEs: "Prácticas", type: "text", category: "home", description: "Etiqueta del carrusel de prácticas" },
  { key: "home_industries_label", value: "Industry Practice Groups", valueEs: "Grupos de práctica por industria", type: "text", category: "home", description: "Etiqueta del carrusel de industrias" },
  { key: "home_recognitions_title", value: "RECOGNITIONS", valueEs: "RECONOCIMIENTOS", type: "text", category: "home", description: "Título de reconocimientos en portada" },
  { key: "home_recognitions_intro", value: "Von Wobeser y Sierra, S.C. has been recognized internationally by various institutions, including:", valueEs: "Von Wobeser y Sierra, S.C. ha sido reconocido a nivel internacional por diversas instituciones, entre ellas:", type: "text", category: "home", description: "Introducción de reconocimientos en portada" },
  { key: "home_recognitions_body_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar el texto detallado de instituciones reconocedoras en la portada" },
  { key: "home_recognitions_body", value: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GRR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers and Benchmark Litigation, among others.", valueEs: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GRR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers y Benchmark Litigation, entre otras.", type: "text", category: "home", description: "Texto de reconocimientos en portada" },
  { key: "home_diversity_title", value: "DIVERSITY & INCLUSION", valueEs: "DIVERSIDAD E INCLUSIÓN", type: "text", category: "home", description: "Título de diversidad en portada" },
  { key: "home_diversity_body", value: "Since its founding in 1986, our partners set out to create an inclusive firm.", valueEs: "Desde su fundación en 1986, nuestros socios se propusieron crear un despacho incluyente.", type: "text", category: "home", description: "Texto de diversidad en portada" },
  { key: "home_probono_title", value: "PRO BONO", valueEs: "PRO BONO", type: "text", category: "home", description: "Título Pro Bono en portada" },
  { key: "home_probono_body", value: "For more than 35 years, our firm has actively supported the Pro Bono cause.", valueEs: "Durante más de 35 años, nuestra firma ha apoyado la causa Pro Bono.", type: "text", category: "home", description: "Texto Pro Bono en portada" },
  { key: "home_about_title", value: "ABOUT US", valueEs: "ACERCA DE NOSOTROS", type: "text", category: "home", description: "Título Acerca de nosotros en portada" },
  { key: "home_vision_label", value: "Vision", valueEs: "Visión", type: "text", category: "home", description: "Etiqueta Visión en portada" },
  { key: "home_vision_body", value: "To be the law firm of reference for the most complex and challenging legal matters in Mexico.", valueEs: "Ser el despacho de referencia para los asuntos legales más complejos y desafiantes de México.", type: "text", category: "home", description: "Texto Visión en portada" },
  { key: "home_mission_label", value: "Mission", valueEs: "Misión", type: "text", category: "home", description: "Etiqueta Misión en portada" },
  { key: "home_mission_body", value: "To solve our clients’ legal matters with the highest quality services, prioritizing their interests and the success of their business, through an expert and solution-oriented team.", valueEs: "Resolver los asuntos legales de nuestros clientes con servicios de la más alta calidad, priorizando sus intereses y el éxito de sus negocios, a través de un equipo experto y orientado a brindar soluciones.", type: "text", category: "home", description: "Texto Misión en portada" },
  { key: "home_values_label", value: "Values", valueEs: "Valores", type: "text", category: "home", description: "Etiqueta Valores en portada" },
  { key: "home_values_body", value: "Integrity: We do what we say we will do. We conduct ourselves under the highest ethical standards. Acting the right way makes things endure. We work with clarity and transparency.\n\nExcellence: We excel in the quality of our legal services. We are driven by client service. We want to exceed client expectations with effective and innovative solutions.\n\nCommitment: We strive to understand our client, their business and their environment. We seek the best results by placing the client's interest first. We face challenges with effort and the will to overcome them.\n\nAgility: We like to be where the action is. We offer an integral and timely service, seeking to add value. We always want to learn and develop new skills. We recognize the value of innovation and disruptive thinking.\n\nDiversity: Nothing is more important than our team. We build a highly skilled and diverse team. Diversity enriches our perspective and strengthens our practice.", valueEs: "Integridad: Hacemos lo que decimos. Nos conducimos bajo los estándares éticos más altos. Actuar de la manera correcta permite que las cosas perduren. Trabajamos con claridad y transparencia.\n\nExcelencia: Sobresalimos con la calidad de nuestros servicios legales. Nos impulsa una vocación de servicio. Queremos superar las expectativas del cliente con soluciones efectivas e innovadoras.\n\nCompromiso: Nos esforzamos por entender a nuestro cliente, su negocio y su entorno. Buscamos los mejores resultados anteponiendo el interés del cliente. Enfrentamos los retos con esfuerzo y voluntad de superarlos.\n\nAgilidad: Nos gusta estar en donde está la acción. Ofrecemos un servicio integral y oportuno, buscando agregar valor. Queremos aprender y desarrollar nuevas habilidades, siempre. Reconocemos el valor de innovar y pensar en forma disruptiva.\n\nDiversidad: Nada es más importante que nuestro equipo. Construimos un equipo altamente preparado y diverso. La diversidad enriquece nuestra perspectiva y fortalece nuestra práctica.", type: "text", category: "home", description: "Valores institucionales en portada" },
  { key: "banner_title", value: "WE GO WHERE CLIENTS NEED US", valueEs: "VAMOS DONDE EL CLIENTE NOS NECESITA", type: "text", category: "home", description: "Título del banner rojo (home)" },
  { key: "banner_subtitle", value: "New offices of Von Wobeser y Sierra", valueEs: "Nuevas oficinas de Von Wobeser y Sierra", type: "text", category: "home", description: "Subtítulo del banner rojo (home)" },
  // Micrositio bilingüe de Nuevas oficinas. Se guarda en site_config para aprovechar
  // la edición bilingüe y el sembrado no destructivo que ya usa el resto del espejo.
  { key: "office_published", value: "true", type: "select", category: "offices", description: "Publicar el micrositio de Nuevas oficinas" },
  { key: "office_header_logo", value: "/images/vw40.png", type: "url", category: "offices", description: "Logo del encabezado del micrositio" },
  { key: "office_home_label", value: "HOME", valueEs: "INICIO", type: "text", category: "offices", description: "Texto del acceso al inicio en el encabezado" },
  { key: "office_footer_logo", value: "/img/vw40b.png", type: "url", category: "offices", description: "Logo blanco del pie del micrositio" },
  { key: "office_banner_image", value: "/img/Banner/03.jpg", type: "url", category: "offices", description: "Imagen de fondo del banner del micrositio" },
  { key: "office_hero_title", value: "WE GO WHERE CLIENTS\nNEED US", valueEs: "VAMOS A DONDE LOS CLIENTES\nNOS NECESITAN", type: "text", category: "offices", description: "Título principal" },
  { key: "office_hero_subtitle", value: "New offices of Von Wobeser y Sierra", valueEs: "Nuevas oficinas de Von Wobeser y Sierra", type: "text", category: "offices", description: "Subtítulo principal" },
  { key: "office_scroll_label", value: "scroll", valueEs: "scroll", type: "text", category: "offices", description: "Etiqueta del indicador de desplazamiento" },
  { key: "office_vision_title", value: "A vision of the future,\ncollaboration, and excellence", valueEs: "Una visión de futuro,\ncolaboración y excelencia", type: "text", category: "offices", description: "Título de la sección de visión" },
  { key: "office_vision_body", value: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco. This relocation marks a stage of growth, evolution, and consolidation, and represents a key investment in the firm’s future. The new facilities are designed to maximize collaboration across all areas for the benefit of clients, ensuring the continued delivery of high-quality and integrated services, reaffirming the firm’s commitment and philosophy of being where clients need them.", valueEs: "Von Wobeser y Sierra ha completado la transición a sus nuevas oficinas en la dinámica zona de Campos Elíseos en Polanco. Esta reubicación materializa una etapa de crecimiento, evolución y consolidación, y representa una inversión clave en el futuro de la firma. Las nuevas instalaciones están diseñadas para maximizar la colaboración entre todas las áreas en beneficio de sus clientes para seguir ofreciendo un servicio de alta calidad e integrado, reafirmando el compromiso del despacho y su filosofía de estar donde los clientes lo necesitan.", type: "text", category: "offices", description: "Texto de la sección de visión" },
  { key: "office_location_title", value: "At the center of business and closer to our clients", valueEs: "En el centro de los negocios y más cerca de nuestros clientes", type: "text", category: "offices", description: "Título de la sección de ubicación" },
  { key: "office_location_body", value: "Our new offices are located in Mexico’s most dynamic business hub and one of the most important in Latin America. Strategically positioned in the vibrant Polanco district, just steps away from the iconic Paseo de la Reforma, we ensure the proximity our clients need for agile and personalized support.", valueEs: "Nuestras nuevas oficinas se encuentran ubicadas en el centro de negocios más dinámico de México y en uno de los más importantes en América Latina. Estratégicamente ubicados en la vibrante zona de Polanco, a pasos de la icónica Avenida Paseo de la Reforma, aseguramos la cercanía que nuestros clientes necesitan para un acompañamiento ágil y personalizado.", type: "text", category: "offices", description: "Texto de la sección de ubicación" },
  { key: "office_collaboration_title", value: "Collaboration,\ntechnology\nand well-being", valueEs: "Colaboración,\ntecnología y\nbienestar", type: "text", category: "offices", description: "Título de colaboración" },
  { key: "office_collaboration_intro", value: "Designed by Gensler, one of the most influential architecture and design firms worldwide, the new offices cover more than 5,300 square meters distributed over six levels.", valueEs: "Diseñada por Gensler, una de las firmas de arquitectura y diseño más influyentes a nivel global, las nuevas oficinas cuentan con más de 5,300 metros cuadrados distribuidos en seis niveles.", type: "text", category: "offices", description: "Primer texto de colaboración" },
  { key: "office_collaboration_highlight", value: "The design is conceived to maximize collaboration among our 18 legal practice groups and 7 industry groups.", valueEs: "El diseño está concebido para maximizar la colaboración entre nuestros 18 grupos de práctica legales y 7 grupos de industria.", type: "text", category: "offices", description: "Texto destacado de colaboración" },
  { key: "office_collaboration_body", value: "In its initial stage, the facilities offer capacity for more than 300 workstations, 16 meeting rooms, flexible spaces for social and academic activities with capacity for 250 people, and a panoramic terrace with privileged views of iconic Mexico City landmarks such as Chapultepec Forest and Campo Militar Marte.", valueEs: "En su etapa inicial, las instalaciones ofrecen capacidad para más de 300 lugares de trabajo, 16 salas de reuniones, espacios flexibles para actividades sociales y académicas con capacidad para 250 personas, y una terraza panorámica con vistas privilegiadas a sitios emblemáticos de la Ciudad de México, como el Bosque de Chapultepec y el Campo Militar Marte.", type: "text", category: "offices", description: "Texto final de colaboración" },
  { key: "office_stat_1_value", value: "5,300 m²", type: "text", category: "offices", description: "Primera cifra rotativa" },
  { key: "office_stat_1_label", value: "", valueEs: "", type: "text", category: "offices", description: "Etiqueta de la primera cifra" },
  { key: "office_stat_2_value", value: "300+", type: "text", category: "offices", description: "Segunda cifra rotativa" },
  { key: "office_stat_2_label", value: "workstations", valueEs: "lugares de trabajo", type: "text", category: "offices", description: "Etiqueta de la segunda cifra" },
  { key: "office_stat_3_value", value: "16", type: "text", category: "offices", description: "Tercera cifra rotativa" },
  { key: "office_stat_3_label", value: "meeting rooms", valueEs: "salas de reuniones", type: "text", category: "offices", description: "Etiqueta de la tercera cifra" },
  { key: "office_quote", value: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity that translates into excellent service.", valueEs: "La reubicación de nuestras oficinas responde a dos objetivos inseparables: primero, estar más cerca de nuestros clientes; y, segundo, ofrecer a nuestro equipo un espacio diseñado para fomentar la colaboración y la productividad que se reflejen en un servicio de excelencia.", type: "text", category: "offices", description: "Cita institucional" },
  { key: "office_quote_author", value: "Fernando Carreño", valueEs: "Fernando Carreño", type: "text", category: "offices", description: "Autor de la cita" },
  { key: "office_quote_role", value: "Partner and member of the Executive Committee", valueEs: "Socio e integrante del Comité Ejecutivo", type: "text", category: "offices", description: "Cargo del autor" },
  { key: "office_address_title", value: "New office address", valueEs: "Nueva dirección:", type: "text", category: "offices", description: "Título de dirección" },
  { key: "office_map_embed", value: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6491595383595!2d-99.19533342532635!3d19.42755904084297!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d200c4e25d79b5%3A0x73edbb0d14f88dde!2sVon%20Wobeser%20y%20Sierra%2C%20S.C.!5e0!3m2!1sen!2smx!4v1763594023907!5m2!1sen!2smx", type: "url", category: "offices", description: "URL del mapa incrustado" },
  { key: "office_map_directions", value: "https://www.google.com/maps/dir/?api=1&destination=19.427559,-99.195333", type: "url", category: "offices", description: "URL para abrir indicaciones" },
  { key: "office_press_label", value: "To download the press release click here", valueEs: "Descarga el comunicado de prensa aquí", type: "text", category: "offices", description: "Texto de descarga del comunicado" },
  { key: "office_press_pdf", value: "/images/PDF_news/2025/2025-11-24-New-Offices.pdf", valueEs: "/images/PDF_news/2025/2025-11-24-Nuevas-Oficinas.pdf", type: "url", category: "offices", description: "Comunicado de prensa bilingüe" },
  { key: "office_linkedin", value: "https://mx.linkedin.com/company/von-wobeser-y-sierra-s.c.", type: "url", category: "offices", description: "LinkedIn del micrositio" },
  { key: "office_x", value: "https://x.com/VWySOficial", type: "url", category: "offices", description: "X del micrositio" },
  { key: "office_follow_label", value: "Follow Us", valueEs: "Síguenos", type: "text", category: "offices", description: "Etiqueta de redes sociales" },
  { key: "office_seo_title", value: "New offices | Von Wobeser y Sierra", valueEs: "Nuevas oficinas | Von Wobeser y Sierra", type: "text", category: "offices", description: "Título SEO" },
  { key: "office_seo_description", value: "Discover Von Wobeser y Sierra’s new offices in Polanco, Mexico City.", valueEs: "Conoce las nuevas oficinas de Von Wobeser y Sierra en Polanco, Ciudad de México.", type: "text", category: "offices", description: "Descripción SEO" },
  { key: "office_seo_image", value: "/img/Banner/03.jpg", type: "url", category: "offices", description: "Imagen social del micrositio" },
  ...Array.from({ length: 6 }, (_, index) => ({
    key: `office_video_${index + 1}`,
    value: `/img/videos/video${index + 1}.mp4`,
    type: "url",
    category: "offices",
    description: `Video ${index + 1} del recorrido de oficinas`,
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    key: `office_video_thumb_${index + 1}`,
    value: `/img/miniaturas/miniatura_${index + 1}.jpg`,
    type: "url",
    category: "offices",
    description: `Miniatura del video ${index + 1}`,
  })),
  ...Array.from({ length: 6 }, (_, index) => ({
    key: `office_video_alt_${index + 1}`,
    value: `Office video ${index + 1}`,
    valueEs: `Video de oficinas ${index + 1}`,
    type: "text",
    category: "offices",
    description: `Texto alternativo del video ${index + 1}`,
  })),
  { key: "newsletter_title", value: "Subscribe", valueEs: "Suscríbete", type: "text", category: "home", description: "Título de Newsletter en portada" },
  { key: "newsletter_description", value: "Receive legal analysis, publications and news from Von Wobeser y Sierra directly in your inbox.", valueEs: "Recibe en tu correo análisis jurídicos, publicaciones y novedades de Von Wobeser y Sierra.", type: "text", category: "home", description: "Descripción de Newsletter en portada" },
  { key: "newsletter_eyebrow", value: "", valueEs: "", type: "text", category: "home", description: "Etiqueta superior opcional del Newsletter" },
  { key: "newsletter_name_label", value: "Name", valueEs: "Nombre", type: "text", category: "home", description: "Etiqueta del campo nombre" },
  { key: "newsletter_email_label", value: "Email address", valueEs: "Correo electrónico", type: "text", category: "home", description: "Etiqueta del campo correo" },
  { key: "newsletter_company_label", value: "Company", valueEs: "Empresa", type: "text", category: "home", description: "Etiqueta del campo empresa" },
  { key: "newsletter_privacy_intro", value: "I have read and accept the", valueEs: "He leído y acepto el", type: "text", category: "home", description: "Texto previo al enlace de privacidad" },
  { key: "newsletter_privacy_link", value: "Privacy Notice", valueEs: "Aviso de Privacidad", type: "text", category: "home", description: "Texto del enlace de privacidad" },
  { key: "newsletter_privacy_path", value: "/privacy", valueEs: "/aviso", type: "url", category: "home", description: "Destino del Aviso de Privacidad" },
  { key: "newsletter_required", value: "Please complete the required fields and accept the Privacy Notice.", valueEs: "Completa los campos obligatorios y acepta el Aviso de Privacidad.", type: "text", category: "home", description: "Mensaje de validación del Newsletter" },
  { key: "newsletter_cta", value: "SUBSCRIBE", valueEs: "SUSCRIBIRME", type: "text", category: "home", description: "Botón de Newsletter en portada" },
  { key: "newsletter_success", value: "Thank you. Your subscription has been received.", valueEs: "Gracias. Hemos recibido tu suscripción.", type: "text", category: "home", description: "Mensaje de éxito de Newsletter" },
  { key: "newsletter_error", value: "We could not process your request. Please try again.", valueEs: "No pudimos procesar tu solicitud. Inténtalo de nuevo.", type: "text", category: "home", description: "Mensaje de error de Newsletter" },
  { key: "home_news_title", value: "News", valueEs: "Noticias", type: "text", category: "home", description: "Título del carrusel de noticias" },
  { key: "home_news_more", value: "SEE MORE", valueEs: "VER MÁS", type: "text", category: "home", description: "CTA del carrusel de noticias" },
  { key: "home_news_previous", value: "Previous news", valueEs: "Noticias anteriores", type: "text", category: "home", description: "Etiqueta accesible para noticias anteriores" },
  { key: "home_news_next", value: "Next news", valueEs: "Siguientes noticias", type: "text", category: "home", description: "Etiqueta accesible para noticias siguientes" },
  { key: "home_news_minimize", value: "Minimize news", valueEs: "Minimizar noticias", type: "text", category: "home", description: "Etiqueta para minimizar noticias" },
  { key: "home_news_expand", value: "Show news", valueEs: "Mostrar noticias", type: "text", category: "home", description: "Etiqueta para mostrar noticias" },
  { key: "home_news_pages", value: "5", valueEs: "5", type: "number", category: "home", description: "Número de páginas del carrusel de noticias (1–10)" },
  { key: "nav_firm", value: "Our Firm", valueEs: "Nuestra Firma", type: "text", category: "navigation", description: "Etiqueta del menú Nuestra Firma" },
  { key: "nav_attorneys", value: "Attorneys", valueEs: "Abogados", type: "text", category: "navigation", description: "Etiqueta del menú Abogados" },
  { key: "nav_practices", value: "Practices", valueEs: "Prácticas", type: "text", category: "navigation", description: "Etiqueta del menú Prácticas" },
  { key: "nav_industries", value: "Industry groups", valueEs: "Grupos de práctica por industria", type: "text", category: "navigation", description: "Etiqueta del menú Industrias" },
  { key: "nav_publications", value: "Publications", valueEs: "Publicaciones", type: "text", category: "navigation", description: "Etiqueta del menú Publicaciones" },
  { key: "nav_careers", value: "Careers at VWyS", valueEs: "Carrera en VWyS", type: "text", category: "navigation", description: "Etiqueta del menú Carrera" },
  { key: "nav_contact", value: "Contact", valueEs: "Contacto", type: "text", category: "navigation", description: "Etiqueta del menú Contacto" },
  { key: "nav_search", value: "Search", valueEs: "Buscar", type: "text", category: "navigation", description: "Etiqueta accesible del buscador" },
  ...["firm", "attorneys", "practices", "industries", "publications", "careers", "contact"].map((id) => ({
    key: `nav_visible_${id}`,
    value: "true",
    valueEs: "true",
    type: "boolean",
    category: "navigation",
    description: `Visibilidad global ES/EN del acceso ${id} en el menú público`,
  })),
  { key: "active_languages", value: "es,en", type: "json", category: "translations", description: "Idiomas a los que se traduce el contenido (lista separada por comas). El traductor solo genera estos idiomas por defecto." },
  { key: "image_engine", value: "openai", type: "select", category: "translations", description: "Motor de imágenes: 'openai' usa gpt-image-2 con fallbacks compatibles; 'cloudflare' requiere sus propias credenciales. Escribe uno de los dos." },
  { key: "image_aspect", value: "1:1", type: "select", category: "translations", description: "Formato de las imágenes generadas: '1:1' (cuadrada), '16:9' (horizontal) o '9:16' (vertical)." },
  { key: "site_url", value: "https://www.vonwobeser.com", type: "url", category: "seo", description: "URL pública del sitio (para canonical, Open Graph y datos estructurados). Cámbiala si el dominio final es otro." },
  { key: "ga4_measurement_id", value: "", type: "text", category: "seo", description: "Google Analytics 4 — Measurement ID (formato G-XXXXXXX). Vacío = no se instala GA4 todavía." },
  { key: "google_site_verification", value: "", type: "text", category: "seo", description: "Google Search Console — código de verificación por meta tag (el valor de content=\"...\" que da Google). No hace falta si verificas por DNS." },
  { key: "tts_voice", value: "", type: "text", category: "voice", description: "Voz de marca para el agente de voz (OpenAI TTS) — boletín/redes/alertas convertidos a audio. Voces válidas: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse. Vacío = usa \"alloy\" por defecto." },
  // Pie de página (aparece en todas las páginas dinámicas). Editable por el cliente.
  { key: "footer_firm", value: "Von Wobeser y Sierra, S.C.", type: "text", category: "footer", description: "Nombre de la firma (pie de página)" },
  { key: "footer_address", value: "SOMA Chapultepec Tower, 18th floor. Campos Elíseos 204, Polanco\nEntrance on Arquímedes Street No. 10, 11550 Mexico City", valueEs: "Torre SOMA Chapultepec, piso 18. Campos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.° 10, C.P. 11550, Ciudad de México", type: "text", category: "footer", description: "Dirección bilingüe del pie de página (una línea por renglón)" },
  { key: "footer_phone", value: "+52 (55) 5258 1000", type: "text", category: "footer", description: "Teléfono del pie de página" },
  { key: "footer_website", value: "vonwobeser.com", type: "text", category: "footer", description: "Sitio web / correo mostrado en el pie" },
  { key: "footer_facebook_visible", value: "true", type: "boolean", category: "footer", description: "Mostrar Facebook en el pie de página" },
  { key: "footer_facebook", value: "https://www.facebook.com/Von-Wobeser-Sierra-SC-1655250134508590/about/?ref=page_internal", type: "url", category: "footer", description: "Enlace de Facebook (pie de página)" },
  { key: "footer_twitter_visible", value: "true", type: "boolean", category: "footer", description: "Mostrar Twitter/X en el pie de página" },
  { key: "footer_twitter", value: "https://twitter.com/VWySOficial", type: "url", category: "footer", description: "Enlace de Twitter/X (pie de página)" },
  { key: "footer_linkedin_visible", value: "true", type: "boolean", category: "footer", description: "Mostrar LinkedIn en el pie de página" },
  { key: "footer_linkedin", value: "https://mx.linkedin.com/company/von-wobeser-y-sierra", type: "url", category: "footer", description: "Enlace de LinkedIn (pie de página)" },
  { key: "footer_esr_image", value: "/templates/beez3/img/esr.jpg", type: "url", category: "footer", description: "Imagen del distintivo ESR" },
  { key: "footer_esr_alt", value: "Socially Responsible Company", valueEs: "Empresa Socialmente Responsable", type: "text", category: "footer", description: "Texto alternativo bilingüe del distintivo ESR" },
  // Landing bilingüe de Nuestra Firma. Los dos campos históricos se conservan como la
  // introducción y el cuerpo de Historia para no perder ninguna edición administrativa previa.
  { key: "page_firm_intro", value: "Von Wobeser y Sierra was founded in 1986 with excellence and integrity as its cornerstones. Today, our multidisciplinary team provides comprehensive legal advice across the firm’s practices and industry groups.", valueEs: "Von Wobeser y Sierra nació en 1986 con la excelencia y la integridad como piedras angulares. Hoy, nuestro equipo multidisciplinario brinda asesoría jurídica integral a través de las prácticas y grupos por industria de la firma.", type: "text", category: "pages", description: "Nuestra Firma — introducción de Historia" },
  { key: "page_firm_body", value: "The business and legal community recognizes our team for its experience, expertise and ability to advise leading companies throughout their development in Mexico and abroad.\n\nWe work as a strategic partner, combining preventive and solution-oriented counsel with an in-depth understanding of each client’s business and its most relevant legal matters.", valueEs: "El medio empresarial y legal reconoce a nuestro equipo por su experiencia, especialización y capacidad para asesorar a compañías líderes durante su desarrollo en México y en el extranjero.\n\nTrabajamos como un socio estratégico, combinando asesoría preventiva y resolutiva con un entendimiento profundo del negocio de cada cliente y de sus asuntos legales más relevantes.", type: "text", category: "pages", description: "Nuestra Firma — cuerpo de Historia" },
  { key: "firm_landing_hero_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar el hero de Nuestra Firma" },
  { key: "firm_landing_hero_order", value: "0", type: "number", category: "firm", description: "Orden del hero de Nuestra Firma" },
  { key: "firm_landing_eyebrow", value: "Von Wobeser y Sierra", valueEs: "Von Wobeser y Sierra", type: "text", category: "firm", description: "Nuestra Firma — etiqueta del hero" },
  { key: "firm_landing_title", value: "Von Wobeser y Sierra", valueEs: "Von Wobeser y Sierra", type: "text", category: "firm", description: "Resumen institucional — título principal" },
  { key: "firm_landing_subtitle", value: "More than forty years of legal excellence in Mexico", valueEs: "Más de cuarenta años de excelencia jurídica en México", type: "text", category: "firm", description: "Nuestra Firma — subtítulo principal" },
  { key: "firm_landing_hero_image", value: "/img/Collage/collage_02.jpg", type: "url", category: "firm", description: "Resumen institucional — imagen principal reutilizada de Nuevas Oficinas" },
  { key: "firm_landing_hero_video", value: "", type: "url", category: "firm", description: "Nuestra Firma — video principal opcional" },
  { key: "firm_landing_hero_alt", value: "Boardroom at the new Von Wobeser y Sierra offices", valueEs: "Sala de consejo de las nuevas oficinas de Von Wobeser y Sierra", type: "text", category: "firm", description: "Resumen institucional — texto alternativo del hero" },
  { key: "firm_landing_scroll_label", value: "Discover VWyS", valueEs: "Conoce VWyS", type: "text", category: "firm", description: "Resumen institucional — etiqueta de desplazamiento" },

  { key: "firm_landing_history_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar Historia" },
  { key: "firm_landing_history_order", value: "10", type: "number", category: "firm", description: "Orden de Historia" },
  { key: "firm_landing_history_title", value: "At a glance", valueEs: "En breve", type: "text", category: "firm", description: "Resumen institucional — título" },
  { key: "firm_landing_history_since", value: "Since 1986", valueEs: "Desde 1986", type: "text", category: "firm", description: "Nuestra Firma — fecha destacada de Historia" },
  { key: "firm_landing_history_intro", value: "Founded in 1986, Von Wobeser y Sierra combines legal excellence, integrity and a multidisciplinary approach to advise clients on their most relevant matters in Mexico.", valueEs: "Fundada en 1986, Von Wobeser y Sierra combina excelencia jurídica, integridad y un enfoque multidisciplinario para asesorar a sus clientes en sus asuntos más relevantes en México.", type: "text", category: "firm", description: "Resumen institucional — introducción" },
  { key: "firm_landing_history_body", value: "We work as a strategic partner, providing preventive and solution-oriented counsel based on an in-depth understanding of each client’s business.", valueEs: "Trabajamos como un socio estratégico, brindando asesoría preventiva y resolutiva a partir de un entendimiento profundo del negocio de cada cliente.", type: "text", category: "firm", description: "Resumen institucional — presentación breve" },
  { key: "firm_landing_history_image", value: "/img/Collage/collage_07.jpg", type: "url", category: "firm", description: "Resumen institucional — imagen secundaria reutilizada de Nuevas Oficinas" },
  { key: "firm_landing_history_image_alt", value: "Collaboration area at the Von Wobeser y Sierra offices", valueEs: "Área de colaboración en las oficinas de Von Wobeser y Sierra", type: "text", category: "firm", description: "Resumen institucional — texto alternativo de la imagen secundaria" },

  { key: "firm_landing_stats_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar cifras" },
  { key: "firm_landing_stats_order", value: "20", type: "number", category: "firm", description: "Orden de cifras" },
  { key: "firm_landing_stats_title", value: "Our firm in numbers", valueEs: "Nuestra firma en cifras", type: "text", category: "firm", description: "Nuestra Firma — título de cifras" },
  { key: "firm_landing_stat_1_value", value: "40+", type: "text", category: "firm", description: "Nuestra Firma — cifra de experiencia" },
  { key: "firm_landing_stat_1_label", value: "Years of experience", valueEs: "Años de experiencia", type: "text", category: "firm", description: "Nuestra Firma — etiqueta de experiencia" },
  { key: "firm_landing_stat_2_value", value: "", type: "text", category: "firm", description: "Nuestra Firma — cifra opcional de abogados; vacío usa la base" },
  { key: "firm_landing_stat_2_label", value: "Attorneys", valueEs: "Abogados", type: "text", category: "firm", description: "Nuestra Firma — etiqueta de abogados" },
  { key: "firm_landing_stat_3_value", value: "", type: "text", category: "firm", description: "Nuestra Firma — cifra opcional de prácticas; vacío usa la base" },
  { key: "firm_landing_stat_3_label", value: "Legal practices", valueEs: "Prácticas legales", type: "text", category: "firm", description: "Nuestra Firma — etiqueta de prácticas" },
  { key: "firm_landing_stat_4_value", value: "", type: "text", category: "firm", description: "Nuestra Firma — cifra opcional de industrias; vacío usa la base" },
  { key: "firm_landing_stat_4_label", value: "Industry practice groups", valueEs: "Grupos de práctica por industria", type: "text", category: "firm", description: "Nuestra Firma — etiqueta de industrias" },

  { key: "firm_landing_values_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar Valores" },
  { key: "firm_landing_values_order", value: "30", type: "number", category: "firm", description: "Orden de Valores" },
  { key: "firm_landing_values_title", value: "Our values", valueEs: "Nuestros valores", type: "text", category: "firm", description: "Nuestra Firma — título de Valores" },
  { key: "firm_landing_values_intro", value: "The principles that guide our work and our relationship with clients.", valueEs: "Los principios que guían nuestro trabajo y nuestra relación con los clientes.", type: "text", category: "firm", description: "Nuestra Firma — introducción de Valores" },
  ...[
    ["Integrity", "Integridad", "We do what we say, work with clarity and uphold the highest ethical standards.", "Hacemos lo que decimos, trabajamos con claridad y nos conducimos bajo los estándares éticos más altos."],
    ["Excellence", "Excelencia", "We pursue the highest quality in our legal services and seek effective, innovative solutions.", "Buscamos la más alta calidad en nuestros servicios jurídicos y soluciones efectivas e innovadoras."],
    ["Commitment", "Compromiso", "We place the client’s interests first and work to understand their business and environment.", "Anteponemos el interés del cliente y trabajamos para comprender su negocio y su entorno."],
    ["Agility", "Agilidad", "We provide comprehensive and timely counsel that adds value to every matter.", "Brindamos asesoría integral y oportuna que agrega valor a cada asunto."],
    ["Diversity", "Diversidad", "A highly prepared and diverse team enriches our perspective and strengthens our practice.", "Un equipo altamente preparado y diverso enriquece nuestra perspectiva y fortalece nuestra práctica."],
  ].flatMap(([title, titleEs, body, bodyEs], index) => [
    { key: `firm_landing_value_${index + 1}_title`, value: title, valueEs: titleEs, type: "text", category: "firm", description: `Nuestra Firma — valor ${index + 1}` },
    { key: `firm_landing_value_${index + 1}_body`, value: body, valueEs: bodyEs, type: "text", category: "firm", description: `Nuestra Firma — descripción del valor ${index + 1}` },
  ]),

  { key: "firm_landing_culture_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar Cultura" },
  { key: "firm_landing_culture_order", value: "40", type: "number", category: "firm", description: "Orden de Cultura" },
  { key: "firm_landing_culture_title", value: "Our culture", valueEs: "Nuestra cultura", type: "text", category: "firm", description: "Nuestra Firma — título de Cultura" },
  { key: "firm_landing_culture_subtitle", value: "Professional rigor, collaboration and continuous learning", valueEs: "Rigor profesional, colaboración y aprendizaje continuo", type: "text", category: "firm", description: "Nuestra Firma — subtítulo de Cultura" },
  { key: "firm_landing_culture_intro", value: "We cultivate an environment in which legal talent works across disciplines, shares knowledge and develops solutions for complex matters.", valueEs: "Cultivamos un entorno en el que el talento jurídico trabaja entre disciplinas, comparte conocimiento y desarrolla soluciones para asuntos complejos.", type: "text", category: "firm", description: "Nuestra Firma — introducción de Cultura" },
  { key: "firm_landing_culture_image", value: "/img/Collage/collage_03.jpg", type: "url", category: "firm", description: "Nuestra Firma — imagen de Cultura" },
  { key: "firm_landing_culture_image_alt", value: "Architecture in Mexico City", valueEs: "Arquitectura en la Ciudad de México", type: "text", category: "firm", description: "Nuestra Firma — texto alternativo de Cultura" },
  ...[
    ["Modern workplace", "Espacios de trabajo modernos", "Facilities conceived to promote collaboration, creativity and well-being.", "Instalaciones concebidas para promover la colaboración, la creatividad y el bienestar."],
    ["Team collaboration", "Colaboración en equipo", "Our practices and industry groups combine specialized perspectives to provide comprehensive counsel.", "Nuestras prácticas y grupos por industria combinan perspectivas especializadas para brindar asesoría integral."],
    ["Professional development", "Desarrollo profesional", "Continuous learning, mentoring and professional growth are central to the development of our team.", "El aprendizaje continuo, la mentoría y el crecimiento profesional son centrales para el desarrollo de nuestro equipo."],
    ["Community involvement", "Participación comunitaria", "Our Pro Bono work and collaboration with civil society extend our impact beyond client matters.", "Nuestro trabajo Pro Bono y la colaboración con la sociedad civil extienden nuestro impacto más allá de los asuntos de clientes."],
    ["Sustainable performance", "Desempeño sostenible", "We seek working practices that support consistent excellence and the well-being of our people.", "Buscamos prácticas de trabajo que favorezcan la excelencia constante y el bienestar de nuestra gente."],
    ["Innovation mindset", "Mentalidad de innovación", "We value initiative, technology and new approaches that improve the way we deliver legal services.", "Valoramos la iniciativa, la tecnología y nuevas formas de mejorar la prestación de nuestros servicios jurídicos."],
  ].flatMap(([title, titleEs, body, bodyEs], index) => [
    { key: `firm_landing_culture_${index + 1}_title`, value: title, valueEs: titleEs, type: "text", category: "firm", description: `Nuestra Firma — aspecto cultural ${index + 1}` },
    { key: `firm_landing_culture_${index + 1}_body`, value: body, valueEs: bodyEs, type: "text", category: "firm", description: `Nuestra Firma — descripción cultural ${index + 1}` },
  ]),

  { key: "firm_landing_diversity_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar Diversidad" },
  { key: "firm_landing_diversity_order", value: "50", type: "number", category: "firm", description: "Orden de Diversidad" },
  { key: "firm_landing_diversity_title", value: "Diversity & inclusion", valueEs: "Diversidad e inclusión", type: "text", category: "firm", description: "Nuestra Firma — título de Diversidad" },
  { key: "firm_landing_diversity_subtitle", value: "Different perspectives strengthen our firm", valueEs: "Las perspectivas diferentes fortalecen nuestra firma", type: "text", category: "firm", description: "Nuestra Firma — subtítulo de Diversidad" },
  { key: "firm_landing_diversity_intro", value: "We are committed to an inclusive workplace where every person is valued, respected and able to develop their potential.", valueEs: "Estamos comprometidos con un entorno incluyente en el que cada persona sea valorada, respetada y pueda desarrollar su potencial.", type: "text", category: "firm", description: "Nuestra Firma — introducción de Diversidad" },
  { key: "firm_landing_diversity_commitment", value: "Diversity is a core value that shapes how we work, grow and serve our clients. We continually review our practices to contribute to a more equitable legal profession.", valueEs: "La diversidad es un valor central que define cómo trabajamos, crecemos y servimos a nuestros clientes. Revisamos continuamente nuestras prácticas para contribuir a una profesión jurídica más equitativa.", type: "text", category: "firm", description: "Nuestra Firma — compromiso de Diversidad" },
  { key: "firm_landing_diversity_cta", value: "Learn about our commitment", valueEs: "Conoce nuestro compromiso", type: "text", category: "firm", description: "Nuestra Firma — CTA de Diversidad" },
  { key: "firm_landing_diversity_path", value: "/our-firm/diversity", valueEs: "/nuestra-firma/diversidad", type: "url", category: "firm", description: "Nuestra Firma — destino de Diversidad" },
  ...[
    ["Inclusive recruitment", "Contratación incluyente", "We evaluate talent through skills, experience and potential, promoting equal opportunities.", "Evaluamos el talento por sus capacidades, experiencia y potencial, promoviendo la igualdad de oportunidades."],
    ["Gender equality", "Igualdad de género", "We promote the development and participation of women at every level of the organization.", "Promovemos el desarrollo y la participación de las mujeres en todos los niveles de la organización."],
    ["Equal opportunities", "Igualdad de oportunidades", "Our people have access to development resources, challenging matters and professional growth.", "Nuestra gente tiene acceso a recursos de desarrollo, asuntos desafiantes y crecimiento profesional."],
    ["Inclusive workplace", "Entorno incluyente", "We foster a respectful environment in which differences are valued and every voice can be heard.", "Fomentamos un entorno respetuoso en el que se valoran las diferencias y todas las voces pueden ser escuchadas."],
  ].flatMap(([title, titleEs, body, bodyEs], index) => [
    { key: `firm_landing_diversity_${index + 1}_title`, value: title, valueEs: titleEs, type: "text", category: "firm", description: `Nuestra Firma — iniciativa de diversidad ${index + 1}` },
    { key: `firm_landing_diversity_${index + 1}_body`, value: body, valueEs: bodyEs, type: "text", category: "firm", description: `Nuestra Firma — descripción de diversidad ${index + 1}` },
  ]),

  { key: "firm_landing_rankings_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar Reconocimientos" },
  { key: "firm_landing_rankings_order", value: "60", type: "number", category: "firm", description: "Orden de Reconocimientos" },
  { key: "firm_landing_rankings_title", value: "Rankings & recognition", valueEs: "Reconocimientos", type: "text", category: "firm", description: "Nuestra Firma — título de Reconocimientos" },
  { key: "firm_landing_rankings_intro", value: "The firm and its attorneys are consistently recognized by leading international legal directories.", valueEs: "La firma y sus abogados son reconocidos constantemente por los principales directorios jurídicos internacionales.", type: "text", category: "firm", description: "Nuestra Firma — introducción de Reconocimientos" },
  { key: "firm_landing_rankings_empty", value: "Recognition records can be managed from the administration panel.", valueEs: "Los reconocimientos pueden administrarse desde el panel.", type: "text", category: "firm", description: "Nuestra Firma — mensaje sin Reconocimientos" },

  { key: "firm_landing_pathways_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar Pro Bono y Carrera" },
  { key: "firm_landing_pathways_order", value: "70", type: "number", category: "firm", description: "Orden de Pro Bono y Carrera" },
  { key: "firm_landing_probono_title", value: "Pro Bono", valueEs: "Pro Bono", type: "text", category: "firm", description: "Nuestra Firma — título Pro Bono" },
  { key: "firm_landing_probono_text", value: "For more than 35 years, our firm has supported access to justice through legal services for people and organizations that need them.", valueEs: "Durante más de 35 años, nuestra firma ha apoyado el acceso a la justicia mediante servicios jurídicos para personas y organizaciones que los necesitan.", type: "text", category: "firm", description: "Nuestra Firma — texto Pro Bono" },
  { key: "firm_landing_probono_cta", value: "Discover our Pro Bono work", valueEs: "Conoce nuestro trabajo Pro Bono", type: "text", category: "firm", description: "Nuestra Firma — CTA Pro Bono" },
  { key: "firm_landing_probono_path", value: "/our-firm/our-firm-probono", valueEs: "/nuestra-firma/probono", type: "url", category: "firm", description: "Nuestra Firma — destino Pro Bono" },
  { key: "firm_landing_careers_title", value: "Careers", valueEs: "Carrera en VWyS", type: "text", category: "firm", description: "Nuestra Firma — título Carrera" },
  { key: "firm_landing_careers_text", value: "Build your career alongside a team that combines legal excellence, collaboration and continuous learning.", valueEs: "Desarrolla tu carrera junto a un equipo que combina excelencia jurídica, colaboración y aprendizaje continuo.", type: "text", category: "firm", description: "Nuestra Firma — texto Carrera" },
  { key: "firm_landing_careers_cta", value: "Explore opportunities", valueEs: "Conoce las oportunidades", type: "text", category: "firm", description: "Nuestra Firma — CTA Carrera" },
  { key: "firm_landing_careers_path", value: "/careers", valueEs: "/bolsa-de-trabajo", type: "url", category: "firm", description: "Nuestra Firma — destino Carrera" },

  { key: "firm_landing_cta_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar enlaces finales" },
  { key: "firm_landing_cta_order", value: "80", type: "number", category: "firm", description: "Orden de enlaces finales" },
  { key: "firm_landing_cta_title", value: "How can we help?", valueEs: "¿Cómo podemos ayudarte?", type: "text", category: "firm", description: "Nuestra Firma — título del CTA final" },
  { key: "firm_landing_cta_text", value: "Meet our team, explore our capabilities or contact us.", valueEs: "Conoce a nuestro equipo, explora nuestras capacidades o ponte en contacto.", type: "text", category: "firm", description: "Nuestra Firma — texto del CTA final" },
  { key: "firm_landing_cta_1_label", value: "Our attorneys", valueEs: "Nuestros abogados", type: "text", category: "firm", description: "Nuestra Firma — primer CTA" },
  { key: "firm_landing_cta_1_path", value: "/attorneys?lang=en", valueEs: "/attorneys", type: "url", category: "firm", description: "Nuestra Firma — destino del primer CTA" },
  { key: "firm_landing_cta_2_label", value: "Legal practices", valueEs: "Prácticas legales", type: "text", category: "firm", description: "Nuestra Firma — segundo CTA" },
  { key: "firm_landing_cta_2_path", value: "/capabilities/practices", valueEs: "/capacidades/practicas", type: "url", category: "firm", description: "Nuestra Firma — destino del segundo CTA" },
  { key: "firm_landing_cta_3_label", value: "Contact", valueEs: "Contacto", type: "text", category: "firm", description: "Nuestra Firma — tercer CTA" },
  { key: "firm_landing_cta_3_path", value: "/contact", valueEs: "/contacto", type: "url", category: "firm", description: "Nuestra Firma — destino del tercer CTA" },

  { key: "firm_landing_seo_title", value: "Von Wobeser y Sierra | Mexican law firm", valueEs: "Von Wobeser y Sierra | Firma legal en México", type: "text", category: "firm", description: "Resumen institucional — título SEO" },
  { key: "firm_landing_seo_description", value: "Learn about Von Wobeser y Sierra, a Mexican law firm founded in 1986 and recognized for legal excellence, integrity and comprehensive counsel.", valueEs: "Conoce a Von Wobeser y Sierra, firma mexicana fundada en 1986 y reconocida por su excelencia jurídica, integridad y asesoría integral.", type: "text", category: "firm", description: "Nuestra Firma — descripción SEO" },
  { key: "firm_landing_seo_image", value: "/img/Collage/collage_02.jpg", type: "url", category: "firm", description: "Resumen institucional — imagen para compartir" },
  { key: "firm_landing_canonical", value: "/about", valueEs: "/acerca-de", type: "url", category: "firm", description: "Resumen institucional — canonical bilingüe" },
  { key: "firm_landing_social_title", value: "Von Wobeser y Sierra | Mexican law firm", valueEs: "Von Wobeser y Sierra | Firma legal en México", type: "text", category: "firm", description: "Resumen institucional — título para redes sociales" },
  { key: "firm_landing_social_description", value: "More than forty years of legal excellence, integrity and comprehensive counsel in Mexico.", valueEs: "Más de cuarenta años de excelencia jurídica, integridad y asesoría integral en México.", type: "text", category: "firm", description: "Nuestra Firma — descripción para redes sociales" },
  { key: "page_contact_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Contacto — texto de introducción" },
  { key: "page_contact_body", value: "", valueEs: "", type: "text", category: "pages", description: "Contacto — dirección / texto principal" },
  { key: "contact_form_title", value: "Send us a message", valueEs: "Envíanos un mensaje", type: "text", category: "pages", description: "Contacto — título del formulario" },
  { key: "contact_form_description", value: "Share your details and the area in which you need advice. Our team will contact you.", valueEs: "Déjanos tus datos y el área en la que necesitas asesoría. Nuestro equipo se pondrá en contacto contigo.", type: "text", category: "pages", description: "Contacto — descripción del formulario" },
  { key: "contact_form_name_label", value: "Full name", valueEs: "Nombre completo", type: "text", category: "pages", description: "Contacto — etiqueta Nombre" },
  { key: "contact_form_email_label", value: "Email", valueEs: "Correo electrónico", type: "text", category: "pages", description: "Contacto — etiqueta Correo" },
  { key: "contact_form_phone_label", value: "Phone (optional)", valueEs: "Teléfono (opcional)", type: "text", category: "pages", description: "Contacto — etiqueta Teléfono" },
  { key: "contact_form_company_label", value: "Company (optional)", valueEs: "Empresa (opcional)", type: "text", category: "pages", description: "Contacto — etiqueta Empresa" },
  { key: "contact_form_practice_label", value: "Area of interest (optional)", valueEs: "Área de interés (opcional)", type: "text", category: "pages", description: "Contacto — etiqueta Área de interés" },
  { key: "contact_form_message_label", value: "Message", valueEs: "Mensaje", type: "text", category: "pages", description: "Contacto — etiqueta Mensaje" },
  { key: "contact_form_select_label", value: "Select an option", valueEs: "Selecciona una opción", type: "text", category: "pages", description: "Contacto — opción vacía del selector" },
  { key: "contact_form_submit_label", value: "Send message", valueEs: "Enviar mensaje", type: "text", category: "pages", description: "Contacto — texto del botón" },
  { key: "contact_form_sending_label", value: "Sending…", valueEs: "Enviando…", type: "text", category: "pages", description: "Contacto — texto durante el envío" },
  { key: "contact_form_required_message", value: "Please fill in name, email and message.", valueEs: "Completa nombre, correo y mensaje.", type: "text", category: "pages", description: "Contacto — validación de campos obligatorios" },
  { key: "contact_form_invalid_email_message", value: "Enter a valid email address.", valueEs: "Escribe un correo electrónico válido.", type: "text", category: "pages", description: "Contacto — validación de correo" },
  { key: "contact_form_success_message", value: "Thank you, your message was sent successfully.", valueEs: "Gracias, tu mensaje fue enviado correctamente.", type: "text", category: "pages", description: "Contacto — mensaje de éxito" },
  { key: "contact_form_error_message", value: "Your message could not be sent. Please try again.", valueEs: "No fue posible enviar tu mensaje. Intenta de nuevo.", type: "text", category: "pages", description: "Contacto — mensaje de error" },
  { key: "contact_form_network_error_message", value: "We could not connect. Check your connection and try again.", valueEs: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.", type: "text", category: "pages", description: "Contacto — mensaje de error de red" },
  { key: "contact_form_privacy_intro", value: "I have read and accept the", valueEs: "He leído y acepto el", type: "text", category: "pages", description: "Contacto — texto previo al aviso de privacidad" },
  { key: "contact_form_privacy_link", value: "Privacy Notice", valueEs: "Aviso de Privacidad", type: "text", category: "pages", description: "Contacto — texto del enlace de privacidad" },
  { key: "contact_form_privacy_path", value: "/privacy", valueEs: "/aviso", type: "url", category: "pages", description: "Contacto — destino del aviso de privacidad" },
  { key: "page_careers_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Carrera en VWyS — párrafo de introducción" },
  { key: "page_careers_body", value: "", valueEs: "", type: "text", category: "pages", description: "Carrera en VWyS — cuerpo del texto" },
  { key: "page_interns_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — introducción" },
  { key: "page_interns_summer_title", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — título del programa de verano" },
  { key: "page_interns_summer_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — descripción del programa de verano" },
  { key: "page_interns_offer_title", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — título de beneficios" },
  { key: "page_interns_offer_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — beneficios" },
  { key: "page_probono_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Pro Bono — párrafo de introducción" },
  { key: "page_probono_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pro Bono — cuerpo del texto" },
  { key: "page_capabilities_body", value: "", valueEs: "", type: "text", category: "pages", description: "Capacidades — párrafo de introducción" },
  { key: "page_privacy_body", value: "", valueEs: "", type: "text", category: "pages", description: "Aviso de Privacidad — texto completo" },
  { key: "page_diversity_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Diversidad e Inclusión — párrafo de introducción" },
  { key: "page_diversity_body", value: "", valueEs: "", type: "text", category: "pages", description: "Diversidad e Inclusión — texto adicional (se muestra arriba de la galería de video, no la reemplaza)" },
  // Galería de video de Diversidad e Inclusión: 1 video principal + 7 miniaturas que lo
  // reemplazan al hacer clic. No son bilingües (es el mismo archivo para ES/EN). Los valores
  // por defecto son las rutas originales de la plantilla capturada (algunas de las miniaturas
  // no tienen archivo real en este espejo — igual que en la plantilla original sin editar).
  { key: "page_diversity_video_main", value: "/images/vw_vid_02.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video principal" },
  { key: "page_diversity_video_1", value: "/images/vid_01.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 1" },
  { key: "page_diversity_video_2", value: "/images/vid_02.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 2" },
  { key: "page_diversity_video_3", value: "/images/vid_03.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 3" },
  { key: "page_diversity_video_4", value: "/images/vid_04.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 4" },
  { key: "page_diversity_video_5", value: "/images/vid_05.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 5" },
  { key: "page_diversity_video_6", value: "/images/vid_06.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 6" },
  { key: "page_diversity_video_7", value: "/images/vid_07.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video miniatura 7" },
  { key: "page_diversity_thumb_main", value: "/images/thumb_main_vid.png", type: "url", category: "pages", description: "Diversidad e Inclusión — miniatura principal" },
  ...Array.from({ length: 7 }, (_, index) => ({
    key: `page_diversity_thumb_${index + 1}`,
    value: "/images/thumb_main_vid.png",
    type: "url",
    category: "pages",
    description: `Diversidad e Inclusión — imagen de miniatura ${index + 1}`,
  })),
  { key: "page_diversity_logo_1", value: "/images/equidadMx.png", type: "url", category: "pages", description: "Diversidad e Inclusión — logotipo aliado 1" },
  { key: "page_diversity_logo_2", value: "/images/abogadas_bn.png", type: "url", category: "pages", description: "Diversidad e Inclusión — logotipo aliado 2" },
  { key: "page_diversity_logo_3", value: "/images/ERA.jpg", type: "url", category: "pages", description: "Diversidad e Inclusión — logotipo aliado 3" },
  { key: "page_probono_logo_1", value: "/images/probono_new.png", type: "url", category: "pages", description: "Pro Bono — logotipo 1" },
  { key: "page_probono_logo_2", value: "/images/trf_logo_rgb.jpg", type: "url", category: "pages", description: "Pro Bono — logotipo 2" },
  { key: "page_probono_logo_3", value: "/images/PROBONOMX_blanco.png", type: "url", category: "pages", description: "Pro Bono — logotipo 3" },
  { key: "page_probono_logo_4", value: "/images/probono_new_2.png", type: "url", category: "pages", description: "Pro Bono — logotipo 4" },
];

// Claves de texto largo/prosa (páginas institucionales) elegibles para el editor de texto
// enriquecido — derivado de DEFAULTS en vez de una lista aparte, así se mantiene sincronizado
// automáticamente. Excluye las claves de video/URL (galería de Diversidad) y los textos cortos
// del home/footer (banner, teléfono, redes) que no necesitan formato.
const RICH_TEXT_CONFIG_KEYS = new Set(
  DEFAULTS.filter((d) => d.category === "pages" && d.type === "text").map((d) => d.key),
);

export function isRichTextConfigKey(key: string): boolean {
  return RICH_TEXT_CONFIG_KEYS.has(key);
}

export function isOfficeConfigKey(key: string): boolean {
  return key.startsWith("office_");
}

// Caché en memoria del site-config: antes se hacía SELECT * en CADA render del
// espejo. Se cachea con TTL corto y se invalida al escribir (upsert/seed).
let _configCache: { map: ConfigMap; at: number } | null = null;
const CONFIG_TTL_MS = 60_000;

/** Fuerza recargar el site-config en la próxima lectura. */
export function invalidateConfigCache(): void {
  _configCache = null;
}

/** Returns all site-config as a {key: {value, valueEs, type}} map (cacheada). */
export async function getConfigMap(): Promise<ConfigMap> {
  if (_configCache && Date.now() - _configCache.at < CONFIG_TTL_MS) return _configCache.map;
  const rows = await db.select().from(siteConfig);
  const map: ConfigMap = {};
  for (const r of rows) map[r.key] = { value: r.value ?? "", valueEs: r.valueEs ?? "", type: r.type };
  _configCache = { map, at: Date.now() };
  return map;
}

/** Insert any missing default keys (non-destructive). */
export async function seedConfigDefaults(): Promise<void> {
  const existing = new Set((await db.select({ key: siteConfig.key }).from(siteConfig)).map((r) => r.key));
  const missing = DEFAULTS.filter((d) => !existing.has(d.key));
  if (missing.length) {
    await db.insert(siteConfig).values(
      missing.map((d) => ({ key: d.key, value: d.value, valueEs: d.valueEs ?? d.value, type: d.type, category: d.category, description: d.description })),
    );
  }

  // Publica el video 2026 entregado por el cliente únicamente cuando cada campo
  // conserva un recurso predeterminado anterior. Los medios personalizados que
  // se hayan elegido desde administración permanecen intactos.
  const legacyHeroMedia: Record<string, { current: string; legacy: Set<string> }> = {
    hero_video: {
      current: CURRENT_HERO_MEDIA.desktop,
      legacy: new Set(["", "/images/dron_2026_40.mp4", "/images/home-hero-desktop-v1.mp4", "/images/home-hero-desktop-v2.mp4"]),
    },
    hero_video_mobile: {
      current: CURRENT_HERO_MEDIA.mobile,
      legacy: new Set(["", "/images/home-hero-mobile-v1.mp4", "/images/home-hero-mobile-v2.mp4"]),
    },
    hero_video_poster: {
      current: CURRENT_HERO_MEDIA.poster,
      legacy: new Set(["", "/images/home-hero-poster-v1.webp", "/images/home-hero-poster-v2.webp"]),
    },
  };
  let heroMediaUpdated = false;
  for (const [key, media] of Object.entries(legacyHeroMedia)) {
    const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    if (!current || !media.legacy.has(current.value || "") || !media.legacy.has(current.valueEs || "")) continue;
    await db.update(siteConfig)
      .set({ value: media.current, valueEs: media.current, updatedAt: new Date() })
      .where(eq(siteConfig.key, key));
    heroMediaUpdated = true;
  }

  // Migración conservadora del único valor histórico que mezclaba ambos idiomas.
  // Solo se toca cuando sigue siendo EXACTAMENTE el default anterior; una dirección
  // editada por el cliente nunca se sobreescribe.
  const legacyAddress = "Torre SOMA Chapultepec 18th floor. Campos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.° 10, C.P. 11550, Ciudad de México";
  const footerDefault = DEFAULTS.find((d) => d.key === "footer_address")!;
  const [footerAddress] = await db.select().from(siteConfig).where(eq(siteConfig.key, "footer_address"));
  let footerUpdated = false;
  if (footerAddress && footerAddress.value === legacyAddress && (!footerAddress.valueEs || footerAddress.valueEs === legacyAddress)) {
    await db.update(siteConfig)
      .set({ value: footerDefault.value, valueEs: footerDefault.valueEs, updatedAt: new Date() })
      .where(eq(siteConfig.key, "footer_address"));
    footerUpdated = true;
  }

  // El resumen institucional ahora vive separado de Nuestra Firma. Solo se migran los
  // destinos exactos usados por versiones anteriores; cualquier URL elegida se respeta.
  const [heroLink] = await db.select().from(siteConfig).where(eq(siteConfig.key, "hero_practice_link"));
  let heroLinkUpdated = false;
  if (
    heroLink
    && (
      (heroLink.value === "/practice/arbitration" && (!heroLink.valueEs || heroLink.valueEs === "/practice/arbitration"))
      || (heroLink.value === "/our-firm" && heroLink.valueEs === "/nuestra-firma")
    )
  ) {
    await db.update(siteConfig)
      .set({ value: "/about", valueEs: "/acerca-de", updatedAt: new Date() })
      .where(eq(siteConfig.key, "hero_practice_link"));
    heroLinkUpdated = true;
  }

  // La primera versión del resumen reutilizaba nombres y canonical de Nuestra Firma.
  // Se actualizan solo los defaults exactos para mantener separadas ambas experiencias.
  let landingRouteUpdated = false;
  const landingLegacyPairs: Array<[string, string, string, string, string]> = [
    ["firm_landing_title", "Our Firm", "Nuestra Firma", "Von Wobeser y Sierra", "Von Wobeser y Sierra"],
    ["firm_landing_scroll_label", "Discover our firm", "Conoce nuestra firma", "Discover VWyS", "Conoce VWyS"],
    ["firm_landing_hero_alt", "Aerial view of Mexico City", "Vista aérea de la Ciudad de México", "Boardroom at the new Von Wobeser y Sierra offices", "Sala de consejo de las nuevas oficinas de Von Wobeser y Sierra"],
    ["firm_landing_canonical", "/our-firm", "/nuestra-firma", "/about", "/acerca-de"],
    ["firm_landing_seo_title", "Our Firm | Von Wobeser y Sierra", "Nuestra Firma | Von Wobeser y Sierra", "Von Wobeser y Sierra | Mexican law firm", "Von Wobeser y Sierra | Firma legal en México"],
    ["firm_landing_social_title", "Our Firm | Von Wobeser y Sierra", "Nuestra Firma | Von Wobeser y Sierra", "Von Wobeser y Sierra | Mexican law firm", "Von Wobeser y Sierra | Firma legal en México"],
  ];
  for (const [key, oldEn, oldEs, nextEn, nextEs] of landingLegacyPairs) {
    const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    if (current?.value !== oldEn || current.valueEs !== oldEs) continue;
    await db.update(siteConfig)
      .set({ value: nextEn, valueEs: nextEs, updatedAt: new Date() })
      .where(eq(siteConfig.key, key));
    landingRouteUpdated = true;
  }

  // La primera versión del resumen usaba la toma aérea genérica del home. Se sustituye
  // únicamente cuando conserva ese valor exacto, de modo que cualquier medio seleccionado
  // posteriormente desde administración permanezca intacto.
  for (const key of ["firm_landing_hero_image", "firm_landing_seo_image"]) {
    const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    if (current?.value !== "/images/home-hero.jpg" || (current.valueEs && current.valueEs !== "/images/home-hero.jpg")) continue;
    await db.update(siteConfig)
      .set({
        value: "/img/Collage/collage_02.jpg",
        valueEs: "/img/Collage/collage_02.jpg",
        updatedAt: new Date(),
      })
      .where(eq(siteConfig.key, key));
    landingRouteUpdated = true;
  }

  // Las instalaciones anteriores ya tenían page_firm_* pero nacían vacías para usar el HTML
  // capturado. Ahora son la fuente editable de Historia: se completan únicamente los idiomas
  // vacíos o el texto legacy que todavía mencionaba Desk/Best Lawyers. Cualquier otro contenido
  // escrito desde el panel se conserva.
  let firmCopyUpdated = false;
  for (const key of ["page_firm_intro", "page_firm_body"]) {
    const fallback = DEFAULTS.find((item) => item.key === key);
    const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    if (!fallback || !current) continue;
    const obsolete = (value: string | null | undefined) => {
      const normalized = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").toLowerCase();
      return key === "page_firm_intro"
        ? /\bdesk\b|1952|70 (?:years|años)|seven decades|siete décadas|three decades|tres décadas|19 (?:legal )?practices|19 prácticas/.test(normalized)
        : /best lawyers|benchmark litigation|fortune 50|dow jones|chambers and partners global/.test(normalized);
    };
    const keepEn = current.value?.trim() && !obsolete(current.value);
    const keepEs = current.valueEs?.trim() && !obsolete(current.valueEs);
    if (keepEn && keepEs) continue;
    await db.update(siteConfig)
      .set({
        value: keepEn ? current.value : fallback.value,
        valueEs: keepEs ? current.valueEs : fallback.valueEs ?? fallback.value,
        updatedAt: new Date(),
      })
      .where(eq(siteConfig.key, key));
    firmCopyUpdated = true;
  }

  // Normaliza únicamente el título español que se sembró con el anglicismo anterior.
  // Una edición distinta hecha por el cliente se conserva intacta.
  const [rankingTitle] = await db.select().from(siteConfig).where(eq(siteConfig.key, "firm_landing_rankings_title"));
  let rankingTitleUpdated = false;
  if (rankingTitle?.valueEs === "Rankings y reconocimientos") {
    await db.update(siteConfig)
      .set({ valueEs: "Reconocimientos", updatedAt: new Date() })
      .where(eq(siteConfig.key, "firm_landing_rankings_title"));
    rankingTitleUpdated = true;
  }

  // Actualiza el tono y la propuesta editorial del Newsletter solo cuando cada
  // idioma conserva exactamente el texto predeterminado anterior. Una edición
  // distinta hecha desde el panel se mantiene sin cambios.
  let newsletterCopyUpdated = false;
  const newsletterLegacyCopy: Array<[string, string, string, string, string]> = [
    ["newsletter_title", "Stay informed", "Manténgase informado", "Subscribe", "Suscríbete"],
    [
      "newsletter_description",
      "Receive relevant legal updates, publications and firm news directly in your inbox.",
      "Reciba novedades legales, publicaciones y noticias de la firma directamente en su correo.",
      "Receive legal analysis, publications and news from Von Wobeser y Sierra directly in your inbox.",
      "Recibe en tu correo análisis jurídicos, publicaciones y novedades de Von Wobeser y Sierra.",
    ],
    [
      "newsletter_required",
      "Please complete the required fields and accept the Privacy Notice.",
      "Complete los campos obligatorios y acepte el Aviso de Privacidad.",
      "Please complete the required fields and accept the Privacy Notice.",
      "Completa los campos obligatorios y acepta el Aviso de Privacidad.",
    ],
    [
      "newsletter_success",
      "Thank you. Your subscription has been received.",
      "Gracias. Hemos recibido su suscripción.",
      "Thank you. Your subscription has been received.",
      "Gracias. Hemos recibido tu suscripción.",
    ],
    [
      "newsletter_error",
      "We could not process your request. Please try again.",
      "No pudimos procesar su solicitud. Inténtelo de nuevo.",
      "We could not process your request. Please try again.",
      "No pudimos procesar tu solicitud. Inténtalo de nuevo.",
    ],
  ];
  for (const [key, oldEn, oldEs, nextEn, nextEs] of newsletterLegacyCopy) {
    const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    if (!current) continue;
    const value = current.value === oldEn ? nextEn : current.value;
    const valueEs = current.valueEs === oldEs ? nextEs : current.valueEs;
    if (value === current.value && valueEs === current.valueEs) continue;
    await db.update(siteConfig)
      .set({ value, valueEs, updatedAt: new Date() })
      .where(eq(siteConfig.key, key));
    newsletterCopyUpdated = true;
  }

  if (missing.length || heroMediaUpdated || footerUpdated || heroLinkUpdated || landingRouteUpdated || firmCopyUpdated || rankingTitleUpdated || newsletterCopyUpdated) invalidateConfigCache();
}

/** Upsert one key (used by the admin endpoint). */
export async function upsertConfig(key: string, value: string, valueEs?: string): Promise<void> {
  const [existing] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
  if (existing) {
    await db.update(siteConfig).set({ value, valueEs: valueEs ?? existing.valueEs, updatedAt: new Date() }).where(eq(siteConfig.key, key));
  } else {
    await db.insert(siteConfig).values({ key, value, valueEs: valueEs ?? value, type: "text", category: "general" });
  }
  invalidateConfigCache();
}

/** Publica las tres variantes del hero como una sola operación de configuración. */
export async function setHeroMediaConfig(
  desktopPath: string,
  mobilePath: string,
  posterPath: string,
): Promise<void> {
  const values = [
    { key: "hero_video", value: desktopPath, description: "Video optimizado del hero para escritorio" },
    { key: "hero_video_mobile", value: mobilePath, description: "Video optimizado del hero para móvil" },
    { key: "hero_video_poster", value: posterPath, description: "Póster optimizado del hero" },
  ];
  await db.transaction(async (transaction) => {
    for (const item of values) {
      await transaction
        .insert(siteConfig)
        .values({
          key: item.key,
          value: item.value,
          valueEs: item.value,
          type: "url",
          category: "home",
          description: item.description,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: siteConfig.key,
          set: {
            value: item.value,
            valueEs: item.value,
            type: "url",
            category: "home",
            description: item.description,
            updatedAt: new Date(),
          },
        });
    }
  });
  invalidateConfigCache();
}

export function cfg(map: ConfigMap, key: string, lang: "en" | "es"): string {
  const c = map[key];
  if (!c) return "";
  return lang === "es" ? c.valueEs || c.value : c.value;
}

/** Boolean site-config helper. Missing keys remain enabled for backwards compatibility. */
export function isConfigEnabled(map: ConfigMap, key: string, defaultValue = true): boolean {
  const raw = map[key]?.value?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw !== "false";
}
