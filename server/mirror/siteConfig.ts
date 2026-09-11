import { eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import { db } from "../db";
import { siteConfig } from "@shared/schema";
import { getMirrorDir } from "./config";
import {
  persistPublicMediaFiles,
  persistentMediaStorageStatus,
  type PublicMediaFile,
} from "../media/persistentMedia";
import { getEditorialTypographyForEntities } from "../editorialTypography";
import { typographyAttribute, type TypographyStyles } from "@shared/editorialTypography";
import {
  DEFAULT_CLASSIC_NAVIGATION_CONFIGURATION,
  DEFAULT_NAVIGATION_CONFIGURATION,
  DEFAULT_NAVIGATION_PRESET,
} from "@shared/navigation";
import {
  DEFAULT_ATTORNEY_DIRECTORY_PRESET,
  DEFAULT_FOOTER_PRESET,
} from "@shared/publicAppearance";
import {
  PRIVACY_NOTICE_VWYS_2026_EN,
  PRIVACY_NOTICE_VWYS_2026_ES,
  PRIVACY_NOTICE_VWYS_2026_MIGRATION_KEY,
  PRIVACY_NOTICE_VWYS_2026_PREVIOUS_VERSION_KEY,
  PRIVACY_NOTICE_VWYS_2026_SOURCE,
} from "../content/privacyNoticeVwys2026";
import { TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES, TALENT_PRIVACY_NOTICE_CANDIDATES_2026_SOURCE } from "../content/talentPrivacyNoticeCandidates2026";

export type ConfigMap = Record<string, { value: string; valueEs: string; type: string; typography?: TypographyStyles }>;

/** El video que estaba activo antes del cambio solicitado el 25 de agosto.
 * Se conserva íntegro y queda disponible desde Administración como respaldo. */
const PREVIOUS_HERO_MEDIA = {
  master: "/images/hero-20260810-fullhd-master.mp4",
  desktop: "/images/hero-20260810-fullhd-desktop.mp4",
  mobile: "/images/hero-20260821-hd-mobile-v2.mp4",
  poster: "/images/hero-20260810-fullhd-poster.webp",
} as const;

/**
 * Video histórico de la portada anterior. Sus derivados no amplifican ni
 * inventan detalle del original 960×540: usan escalado Lanczos y bitrate alto
 * para evitar una segunda degradación al servir escritorio y móvil.
 */
const CURRENT_HERO_MEDIA = {
  master: "/images/dron_2026_40.mp4",
  desktop: "/images/hero-20260825-dron-fullhd-desktop.mp4",
  mobile: "/images/hero-20260825-dron-hd-mobile.mp4",
  poster: "/images/hero-20260825-dron-poster.webp",
} as const;

/**
 * Rutas administradas y persistentes de ambos juegos de medios. Los nombres
 * deterministas evitan duplicados en App Storage y permiten auditar o restaurar
 * el hero previo desde Administración sin depender del disco del despliegue.
 */
const PERSISTENT_CURRENT_HERO_MEDIA = {
  master: "/uploads/hero/masters/hero-master-dron-20260825.mp4",
  desktop: "/uploads/hero/hero-dron-20260825-desktop.mp4",
  mobile: "/uploads/hero/hero-dron-20260825-mobile.mp4",
  poster: "/uploads/hero/hero-dron-20260825-poster.webp",
} as const;

const PERSISTENT_PREVIOUS_HERO_MEDIA = {
  master: "/uploads/hero/masters/hero-master-previous-20260810.mp4",
  desktop: "/uploads/hero/hero-previous-20260810-desktop.mp4",
  mobile: "/uploads/hero/hero-previous-20260810-mobile.mp4",
  poster: "/uploads/hero/hero-previous-20260810-poster.webp",
} as const;

const HERO_VIDEO_HISTORY_MIGRATION_KEY = "hero_video_dron_2026_activation_v1";
const HERO_VIDEO_APP_STORAGE_MIGRATION_KEY = "hero_video_app_storage_archive_v1";
const HERO_VIDEO_PREVIOUS_MASTER_KEY = "hero_video_previous_master";
const HERO_VIDEO_PREVIOUS_DESKTOP_KEY = "hero_video_previous_desktop";
const HERO_VIDEO_PREVIOUS_MOBILE_KEY = "hero_video_previous_mobile";
const HERO_VIDEO_PREVIOUS_POSTER_KEY = "hero_video_previous_poster";

/** Default site-config keys for the editable parts of the mirror frontend. */
const DEFAULTS: Array<{ key: string; value: string; valueEs?: string; type: string; category: string; description: string }> = [
  { key: "cookie_consent_version", value: "1.2", type: "text", category: "privacy", description: "Versión del consentimiento de cookies" },
  { key: "cookie_consent_validity_months", value: "6", type: "number", category: "privacy", description: "Vigencia del consentimiento en meses" },
  { key: "ga4_enabled", value: "false", type: "boolean", category: "privacy", description: "Activar GA4 únicamente después del consentimiento" },
  { key: "leadinfo_site_id", value: "", type: "text", category: "privacy", description: "Leadinfo — Site ID; vacío mantiene el rastreador completamente inactivo" },
  { key: "leadinfo_enabled", value: "false", type: "boolean", category: "privacy", description: "Leadinfo — activar únicamente con Site ID válido, revisión legal y consentimiento" },
  { key: "leadinfo_disclosure_reviewed", value: "false", type: "boolean", category: "privacy", description: "Leadinfo — confirmación de revisión del aviso de privacidad y cookies" },
  { key: "leadinfo_activation_revision", value: "0", type: "number", category: "privacy", description: "Leadinfo — revisión interna para solicitar un consentimiento nuevo tras cada activación" },
  { key: "cookie_banner_title", value: "Your privacy, your choice", valueEs: "Tu privacidad, tu decisión", type: "text", category: "privacy", description: "Título del panel de cookies" },
  { key: "cookie_banner_body", value: "We use essential cookies to operate this site. With your permission, we also use analytics and external content.", valueEs: "Usamos cookies esenciales para operar este sitio. Con tu autorización, también usamos analítica y contenido externo.", type: "text", category: "privacy", description: "Descripción del panel de cookies" },
  { key: "cookie_accept_all", value: "Accept all", valueEs: "Aceptar todas", type: "text", category: "privacy", description: "Botón aceptar cookies" },
  { key: "cookie_reject_optional", value: "Reject non-essential", valueEs: "Rechazar no esenciales", type: "text", category: "privacy", description: "Botón rechazar cookies opcionales" },
  { key: "cookie_configure", value: "Configure", valueEs: "Configurar", type: "text", category: "privacy", description: "Botón configurar cookies" },
  { key: "cookie_preferences_title", value: "Cookie preferences", valueEs: "Preferencias de cookies", type: "text", category: "privacy", description: "Título del configurador" },
  { key: "cookie_preferences_body", value: "Choose which optional technologies may be used. You can change this decision at any time.", valueEs: "Elige qué tecnologías opcionales pueden utilizarse. Puedes cambiar esta decisión en cualquier momento.", type: "text", category: "privacy", description: "Descripción del configurador" },
  { key: "cookie_essential_description", value: "Required for security, administrative sessions and basic site operation.", valueEs: "Necesarias para seguridad, sesiones administrativas y funcionamiento básico del sitio.", type: "text", category: "privacy", description: "Descripción de cookies esenciales" },
  { key: "cookie_analytics_description", value: "Aggregate usage statistics through Google Analytics 4.", valueEs: "Estadísticas agregadas de uso mediante Google Analytics 4.", type: "text", category: "privacy", description: "Descripción de analítica" },
  { key: "cookie_leadinfo_description", value: "Allows Leadinfo to identify visits from companies based on IP addresses and provide business visit analytics.", valueEs: "Permite a Leadinfo identificar visitas de empresas con base en direcciones IP y proporcionar analítica de visitas empresariales.", type: "text", category: "privacy", description: "Descripción de identificación de empresas" },
  { key: "cookie_external_description", value: "YouTube and Vimeo content.", valueEs: "Contenido de YouTube y Vimeo.", type: "text", category: "privacy", description: "Descripción de contenido externo" },
  { key: "site_favicon", value: "/favicon-512x512.png", type: "url", category: "seo", description: "Favicon global del sitio y del panel administrativo" },
  { key: "hero_video_master", value: CURRENT_HERO_MEDIA.master, type: "url", category: "home", description: "Archivo maestro original del hero" },
  { key: "hero_video", value: CURRENT_HERO_MEDIA.desktop, type: "url", category: "home", description: "Video Full HD optimizado del hero para escritorio" },
  { key: "hero_video_mobile", value: CURRENT_HERO_MEDIA.mobile, type: "url", category: "home", description: "Video HD optimizado del hero para móvil" },
  { key: "hero_video_poster", value: CURRENT_HERO_MEDIA.poster, type: "url", category: "home", description: "Póster del primer fotograma real del hero" },
  // Historial administrable: no se renderiza en el sitio. Sus cuatro rutas
  // permiten recuperar el hero anterior sin depender de un archivo externo.
  { key: HERO_VIDEO_PREVIOUS_MASTER_KEY, value: PREVIOUS_HERO_MEDIA.master, type: "url", category: "home", description: "Respaldo — archivo maestro del video anterior del hero" },
  { key: HERO_VIDEO_PREVIOUS_DESKTOP_KEY, value: PREVIOUS_HERO_MEDIA.desktop, type: "url", category: "home", description: "Respaldo — video anterior de escritorio del hero" },
  { key: HERO_VIDEO_PREVIOUS_MOBILE_KEY, value: PREVIOUS_HERO_MEDIA.mobile, type: "url", category: "home", description: "Respaldo — video anterior móvil del hero" },
  { key: HERO_VIDEO_PREVIOUS_POSTER_KEY, value: PREVIOUS_HERO_MEDIA.poster, type: "url", category: "home", description: "Respaldo — póster anterior del hero" },
  { key: "hero_practice_link", value: "/about", valueEs: "/acerca-de", type: "url", category: "home", description: "Destino bilingüe al hacer clic en el video del hero" },
  { key: "home_experience_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar la frase de años de experiencia en la portada" },
  { key: "home_experience", value: "Von Wobeser y Sierra, S.C. has more than forty years of experience.", valueEs: "Von Wobeser y Sierra, S.C. cuenta con más de cuarenta años de experiencia.", type: "text", category: "home", description: "Frase de experiencia de la portada" },
  { key: "associate_experience_visible", value: "false", valueEs: "false", type: "boolean", category: "pages", description: "Mostrar en los perfiles de Asociados las oraciones que indican años de experiencia" },
  { key: "home_team_stats_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar las cifras del equipo en la portada" },
  { key: "home_team_stats", value: "We have more than 180 legal team members (including 26 partners, 6 of counsel, and 8 counsel) and legal interns, plus administrative staff.", valueEs: "Tenemos más de 180 integrantes del equipo legal (incluyendo 26 socios, 6 of counsel y 8 consejeros) y pasantes, más el personal administrativo.", type: "text", category: "home", description: "Cifras del equipo en la portada" },
  { key: "home_practices_label", value: "Practices", valueEs: "Prácticas", type: "text", category: "home", description: "Etiqueta del carrusel de prácticas" },
  { key: "home_industries_label", value: "Industry Practice Groups", valueEs: "Grupos de práctica por industria", type: "text", category: "home", description: "Etiqueta del carrusel de industrias" },
  { key: "home_recognitions_title", value: "RECOGNITIONS", valueEs: "RECONOCIMIENTOS", type: "text", category: "home", description: "Título de reconocimientos en portada" },
  { key: "home_recognitions_intro", value: "Von Wobeser y Sierra, S.C. has been recognized internationally by various institutions, including:", valueEs: "Von Wobeser y Sierra, S.C. ha sido reconocido a nivel internacional por diversas instituciones, entre ellas:", type: "text", category: "home", description: "Introducción de reconocimientos en portada" },
  { key: "home_recognitions_body_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar el texto detallado de instituciones reconocedoras en la portada" },
  { key: "home_recognitions_body", value: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GRR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers and Benchmark Litigation, among others.", valueEs: "Chambers & Partners Global, Chambers & Partners Latin America, Legal 500, Latin Lawyer 250, Global Arbitration Review (GAR 100), Global Competition Review (GCR 100), Global Investigations Review (GIR 100), Global Restructuring Review (GRR), Lexology Index, Latin America Corporate Counsel Association (LACCA), IFLR 1000, Best Lawyers y Benchmark Litigation, entre otras.", type: "text", category: "home", description: "Texto de reconocimientos en portada" },
  { key: "home_diversity_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar el bloque de Diversidad e Inclusión en la portada" },
  { key: "home_diversity_title", value: "DIVERSITY & INCLUSION", valueEs: "DIVERSIDAD E INCLUSIÓN", type: "text", category: "home", description: "Título de diversidad en portada" },
  { key: "home_diversity_body", value: "Since its founding in 1986, our partners set out to create an inclusive firm.", valueEs: "Desde su fundación en 1986, nuestros socios se propusieron crear un despacho incluyente.", type: "text", category: "home", description: "Texto de diversidad en portada" },
  { key: "home_probono_visible", value: "false", valueEs: "false", type: "boolean", category: "home", description: "Mostrar el bloque Pro Bono en la portada" },
  { key: "home_probono_title", value: "PRO BONO", valueEs: "PRO BONO", type: "text", category: "home", description: "Título Pro Bono en portada" },
  { key: "home_probono_body", value: "For more than 35 years, our firm has actively supported the Pro Bono cause.", valueEs: "Durante más de 35 años, nuestra firma ha apoyado la causa Pro Bono.", type: "text", category: "home", description: "Texto Pro Bono en portada" },
  { key: "home_about_layout", value: "editorial", valueEs: "editorial", type: "select", category: "home", description: "Diseño de Visión, Misión y Valores en portada: editorial o clásico" },
  { key: "home_about_editorial_title", value: "Vision, mission and values", valueEs: "Visión, misión y valores", type: "text", category: "home", description: "Título del diseño editorial de Visión, Misión y Valores" },
  { key: "home_about_editorial_intro", value: "The principles that guide our work and our relationship with clients.", valueEs: "Los principios que guían nuestro trabajo y nuestra relación con nuestros clientes.", type: "text", category: "home", description: "Introducción del diseño editorial de Visión, Misión y Valores" },
  { key: "home_about_title", value: "ABOUT US", valueEs: "ACERCA DE NOSOTROS", type: "text", category: "home", description: "Título Acerca de nosotros en portada" },
  { key: "home_vision_label", value: "Vision", valueEs: "Visión", type: "text", category: "home", description: "Etiqueta Visión en portada" },
  { key: "home_vision_body", value: "To be the law firm of reference for the most complex and challenging legal matters in Mexico.", valueEs: "Ser el despacho de referencia para los asuntos legales más complejos y desafiantes de México.", type: "text", category: "home", description: "Texto Visión en portada" },
  { key: "home_mission_label", value: "Mission", valueEs: "Misión", type: "text", category: "home", description: "Etiqueta Misión en portada" },
  { key: "home_mission_body", value: "To solve our clients’ legal matters with the highest quality services, prioritizing their interests and the success of their business, through an expert and solution-oriented team.", valueEs: "Resolver los asuntos legales de nuestros clientes con servicios de la más alta calidad, priorizando sus intereses y el éxito de sus negocios, a través de un equipo experto y orientado a brindar soluciones.", type: "text", category: "home", description: "Texto Misión en portada" },
  { key: "home_values_label", value: "Values", valueEs: "Valores", type: "text", category: "home", description: "Etiqueta Valores en portada" },
  { key: "home_values_body", value: "Integrity: We do what we say we will do. We conduct ourselves under the highest ethical standards. Acting the right way makes things endure. We work with clarity and transparency.\n\nExcellence: We excel in the quality of our legal services. We are driven by client service. We want to exceed client expectations with effective and innovative solutions.\n\nCommitment: We strive to understand our client, their business and their environment. We seek the best results by placing the client's interest first. We face challenges with effort and the will to overcome them.\n\nAgility: We like to be where the action is. We offer an integral and timely service, seeking to add value. We always want to learn and develop new skills. We recognize the value of innovation and disruptive thinking.\n\nDiversity: Nothing is more important than our team. We build a highly skilled and diverse team. Diversity enriches our perspective and strengthens our practice.", valueEs: "Integridad: Hacemos lo que decimos. Nos conducimos bajo los estándares éticos más altos. Actuar de la manera correcta permite que las cosas perduren. Trabajamos con claridad y transparencia.\n\nExcelencia: Sobresalimos con la calidad de nuestros servicios legales. Nos impulsa una vocación de servicio. Queremos superar las expectativas del cliente con soluciones efectivas e innovadoras.\n\nCompromiso: Nos esforzamos por entender a nuestro cliente, su negocio y su entorno. Buscamos los mejores resultados anteponiendo el interés del cliente. Enfrentamos los retos con esfuerzo y voluntad de superarlos.\n\nAgilidad: Nos gusta estar en donde está la acción. Ofrecemos un servicio integral y oportuno, buscando agregar valor. Queremos aprender y desarrollar nuevas habilidades, siempre. Reconocemos el valor de innovar y pensar en forma disruptiva.\n\nDiversidad: Nada es más importante que nuestro equipo. Construimos un equipo altamente preparado y diverso. La diversidad enriquece nuestra perspectiva y fortalece nuestra práctica.", type: "text", category: "home", description: "Valores institucionales en portada" },
  { key: "home_location_visible", value: "true", valueEs: "true", type: "boolean", category: "home", description: "Mostrar la ubicación compartida de Contacto en la portada" },
  { key: "banner_title", value: "We go where clients need us", valueEs: "Vamos a donde los clientes nos necesitan", type: "text", category: "home", description: "Título del banner rojo (home)" },
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
  { key: "office_map_directions", value: "https://www.google.com/maps/dir/?api=1&destination=Campos%20El%C3%ADseos%20204%2C%20Polanco%2C%20Polanco%20IV%20Secc%2C%20Miguel%20Hidalgo%2C%2011550%20Ciudad%20de%20M%C3%A9xico%2C%20CDMX", type: "url", category: "offices", description: "URL para abrir indicaciones" },
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
  { key: "newsletter_description", value: "Stay up to date on legal and regulatory changes relevant to your business.", valueEs: "Mantente al día sobre los cambios legales y regulatorios relevantes para tu negocio.", type: "text", category: "home", description: "Descripción de Newsletter en portada" },
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
  { key: "nav_industries", value: "Industries", valueEs: "Industrias", type: "text", category: "navigation", description: "Etiqueta del menú Industrias" },
  { key: "nav_publications", value: "Publications", valueEs: "Publicaciones", type: "text", category: "navigation", description: "Etiqueta del menú Publicaciones" },
  { key: "nav_careers", value: "Careers at VWyS", valueEs: "Carrera en VWyS", type: "text", category: "navigation", description: "Etiqueta del menú Carrera" },
  { key: "nav_contact", value: "Contact", valueEs: "Contacto", type: "text", category: "navigation", description: "Etiqueta del menú Contacto" },
  { key: "nav_search", value: "Search", valueEs: "Buscar", type: "text", category: "navigation", description: "Etiqueta accesible del buscador" },
  {
    key: "nav_structure_v2",
    value: JSON.stringify(DEFAULT_NAVIGATION_CONFIGURATION),
    valueEs: JSON.stringify(DEFAULT_NAVIGATION_CONFIGURATION),
    type: "json",
    category: "navigation",
    description: "Jerarquía versionada del menú público VWyS",
  },
  // Marca interna y de un solo uso: permite aplicar con seguridad la decisión
  // editorial de ocultar Reconocimientos de Insights en instalaciones ya
  // publicadas, sin sobrescribir una activación posterior desde Administración.
  {
    key: "nav_recognitions_visibility_migration_v1",
    value: "pending",
    valueEs: "pending",
    type: "text",
    category: "internal",
    description: "Migración interna de visibilidad para Reconocimientos de Insights",
  },
  // Marca interna y de un solo uso: conserva solo Artículos, Comunicaciones y
  // Suscríbete en Insights. Los demás destinos no se eliminan y el panel puede
  // reactivarlos posteriormente.
  {
    key: "nav_insights_destinations_visibility_migration_v2",
    value: "pending",
    valueEs: "pending",
    type: "text",
    category: "internal",
    description: "Migración interna de visibilidad para destinos de Insights",
  },
  // Marca interna y de un solo uso para retirar temporalmente dos destinos de
  // Nuestra firma que hoy comparten la misma landing. Sus rutas y controles
  // permanecen disponibles para una activación futura desde Administración.
  {
    key: "nav_firm_destinations_visibility_migration_v1",
    value: "pending",
    valueEs: "pending",
    type: "text",
    category: "internal",
    description: "Migración interna de visibilidad para destinos de Nuestra firma",
  },
  {
    key: "nav_classic_structure_v2",
    value: JSON.stringify(DEFAULT_CLASSIC_NAVIGATION_CONFIGURATION),
    valueEs: JSON.stringify(DEFAULT_CLASSIC_NAVIGATION_CONFIGURATION),
    type: "json",
    category: "navigation",
    description: "Respaldo administrable del menú clásico VWyS sobre las rutas actuales",
  },
  {
    key: "nav_active_preset",
    value: DEFAULT_NAVIGATION_PRESET,
    valueEs: DEFAULT_NAVIGATION_PRESET,
    type: "select",
    category: "navigation",
    description: "Preset activo del menú público: definitivo 2026 o clásico VWyS",
  },
  {
    key: "footer_active_preset",
    value: DEFAULT_FOOTER_PRESET,
    valueEs: DEFAULT_FOOTER_PRESET,
    type: "select",
    category: "footer",
    description: "Diseño activo del pie público: central 2026 o clásico VWyS",
  },
  {
    key: "attorney_directory_active_preset",
    value: DEFAULT_ATTORNEY_DIRECTORY_PRESET,
    valueEs: DEFAULT_ATTORNEY_DIRECTORY_PRESET,
    type: "select",
    category: "pages",
    description: "Diseño activo del buscador público de abogados: editorial 2026 o clásico VWyS",
  },
  ...["firm", "attorneys", "practices", "industries", "publications", "careers", "contact"].map((id) => ({
    key: `nav_visible_${id}`,
    value: "true",
    valueEs: "true",
    type: "boolean",
    category: "navigation",
    description: `Visibilidad global ES/EN del acceso ${id} en el menú público`,
  })),
  { key: "page_perspectives_title", value: "Insights", valueEs: "Insights", type: "text", category: "pages", description: "Insights — título" },
  { key: "page_perspectives_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Perspectivas — introducción editorial bilingüe" },
  { key: "page_international_title", value: "International reach", valueEs: "Alcance internacional", type: "text", category: "pages", description: "Alcance internacional — título" },
  { key: "page_international_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Alcance internacional — introducción bilingüe" },
  { key: "page_international_body", value: "", valueEs: "", type: "text", category: "pages", description: "Alcance internacional — cuerpo bilingüe" },
  { key: "page_openings_title", value: "Openings", valueEs: "Vacantes", type: "text", category: "pages", description: "Vacantes — título" },
  { key: "page_openings_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Vacantes — introducción bilingüe" },
  { key: "page_alumni_title", value: "Alumni", valueEs: "Alumni", type: "text", category: "pages", description: "Alumni — título futuro" },
  { key: "page_alumni_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Alumni — introducción bilingüe futura" },
  { key: "page_alumni_body", value: "", valueEs: "", type: "text", category: "pages", description: "Alumni — cuerpo bilingüe futuro" },
  { key: "page_alumni_published", value: "false", valueEs: "false", type: "boolean", category: "pages", description: "Publicación expresa de Alumni" },
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
  { key: "footer_facebook_visible", value: "false", type: "boolean", category: "footer", description: "Mostrar Facebook en el pie de página" },
  { key: "footer_facebook", value: "https://www.facebook.com/Von-Wobeser-Sierra-SC-1655250134508590/about/?ref=page_internal", type: "url", category: "footer", description: "Enlace de Facebook (pie de página)" },
  { key: "footer_twitter_visible", value: "true", type: "boolean", category: "footer", description: "Mostrar X en el pie de página" },
  { key: "footer_twitter", value: "https://x.com/VWySOficial", type: "url", category: "footer", description: "Enlace de X (pie de página)" },
  { key: "footer_linkedin_visible", value: "true", type: "boolean", category: "footer", description: "Mostrar LinkedIn en el pie de página" },
  { key: "footer_linkedin", value: "https://mx.linkedin.com/company/von-wobeser-y-sierra", type: "url", category: "footer", description: "Enlace de LinkedIn (pie de página)" },
  { key: "footer_esr_image", value: "/templates/beez3/img/esr.jpg", type: "url", category: "footer", description: "Imagen del distintivo ESR" },
  { key: "footer_esr_alt", value: "Socially Responsible Company", valueEs: "Empresa Socialmente Responsable", type: "text", category: "footer", description: "Texto alternativo bilingüe del distintivo ESR" },
  // Landing bilingüe de Nuestra Firma. Los dos campos históricos se conservan como la
  // introducción y el cuerpo de Historia para no perder ninguna edición administrativa previa.
  { key: "page_firm_intro", value: "Von Wobeser y Sierra was founded in 1986 with excellence and integrity as its cornerstones. Today, our multidisciplinary team provides comprehensive legal advice across the firm’s practices and industry groups.", valueEs: "Von Wobeser y Sierra nació en 1986 con la excelencia y la integridad como piedras angulares. Hoy, nuestro equipo multidisciplinario brinda asesoría jurídica integral a través de las prácticas y grupos por industria de la firma.", type: "text", category: "pages", description: "Nuestra Firma — introducción de Historia" },
  { key: "page_firm_body", value: "The business and legal community recognizes our team for its experience, expertise and ability to advise leading companies throughout their development in Mexico and abroad.\n\nWe work as a strategic partner, combining preventive and solution-oriented counsel with an in-depth understanding of each client’s business and its most relevant legal matters.", valueEs: "El medio empresarial y legal reconoce a nuestro equipo por su experiencia, especialización y capacidad para asesorar a compañías líderes durante su desarrollo en México y en el extranjero.\n\nTrabajamos como un socio estratégico, combinando asesoría preventiva y resolutiva con un entendimiento profundo del negocio de cada cliente y de sus asuntos legales más relevantes.", type: "text", category: "pages", description: "Nuestra Firma — cuerpo de Historia" },
  { key: "firm_landing_hero_visible", value: "true", type: "boolean", category: "firm", description: "Mostrar el encabezado e imagen de Nuestra Firma" },
  { key: "firm_landing_hero_order", value: "0", type: "number", category: "firm", description: "Orden del encabezado de Nuestra Firma" },
  { key: "firm_landing_eyebrow", value: "Our firm", valueEs: "Nuestra firma", type: "text", category: "firm", description: "Nuestra Firma — etiqueta editorial" },
  { key: "firm_landing_title", value: "Von Wobeser y Sierra", valueEs: "Von Wobeser y Sierra", type: "text", category: "firm", description: "Nuestra Firma — título editorial principal" },
  { key: "firm_landing_subtitle", value: "More than forty years of legal excellence in Mexico", valueEs: "Más de cuarenta años de excelencia jurídica en México", type: "text", category: "firm", description: "Nuestra Firma — descripción editorial" },
  { key: "firm_landing_hero_image", value: "/img/Collage/collage_02.jpg", type: "url", category: "firm", description: "Nuestra Firma — fotografía panorámica antes de Cifras" },
  { key: "firm_landing_hero_video", value: "", type: "url", category: "firm", description: "Nuestra Firma — video panorámico opcional antes de Cifras" },
  { key: "firm_landing_hero_alt", value: "Boardroom at the new Von Wobeser y Sierra offices", valueEs: "Sala de consejo de las nuevas oficinas de Von Wobeser y Sierra", type: "text", category: "firm", description: "Nuestra Firma — texto alternativo de la fotografía panorámica" },
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
  { key: "firm_landing_stat_2_value", value: "More than 180", valueEs: "Más de 180", type: "text", category: "firm", description: "Nuestra Firma — cifra de integrantes del equipo legal" },
  { key: "firm_landing_stat_2_label", value: "Legal team members", valueEs: "Integrantes del equipo legal", type: "text", category: "firm", description: "Nuestra Firma — etiqueta de integrantes del equipo legal" },
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
  { key: "firm_landing_cta_2_label", value: "Practices", valueEs: "Prácticas", type: "text", category: "firm", description: "Nuestra Firma — segundo CTA" },
  { key: "firm_landing_cta_2_path", value: "/capabilities/practices", valueEs: "/capacidades/practicas", type: "url", category: "firm", description: "Nuestra Firma — destino del segundo CTA" },
  { key: "firm_landing_cta_3_label", value: "Industries", valueEs: "Industrias", type: "text", category: "firm", description: "Nuestra Firma — tercer CTA" },
  { key: "firm_landing_cta_3_path", value: "/capabilities/industries", valueEs: "/capacidades/industrias", type: "url", category: "firm", description: "Nuestra Firma — destino del tercer CTA" },
  { key: "firm_landing_cta_4_label", value: "Contact", valueEs: "Contacto", type: "text", category: "firm", description: "Nuestra Firma — cuarto CTA" },
  { key: "firm_landing_cta_4_path", value: "/contact", valueEs: "/contacto", type: "url", category: "firm", description: "Nuestra Firma — destino del cuarto CTA" },

  { key: "firm_landing_seo_title", value: "Von Wobeser y Sierra | Mexican law firm", valueEs: "Von Wobeser y Sierra | Firma legal en México", type: "text", category: "firm", description: "Resumen institucional — título SEO" },
  { key: "firm_landing_seo_description", value: "Learn about Von Wobeser y Sierra, a Mexican law firm founded in 1986 and recognized for legal excellence, integrity and comprehensive counsel.", valueEs: "Conoce a Von Wobeser y Sierra, firma mexicana fundada en 1986 y reconocida por su excelencia jurídica, integridad y asesoría integral.", type: "text", category: "firm", description: "Nuestra Firma — descripción SEO" },
  { key: "firm_landing_seo_image", value: "/img/Collage/collage_02.jpg", type: "url", category: "firm", description: "Resumen institucional — imagen para compartir" },
  { key: "firm_landing_canonical", value: "/about", valueEs: "/acerca-de", type: "url", category: "firm", description: "Resumen institucional — canonical bilingüe" },
  { key: "firm_landing_social_title", value: "Von Wobeser y Sierra | Mexican law firm", valueEs: "Von Wobeser y Sierra | Firma legal en México", type: "text", category: "firm", description: "Resumen institucional — título para redes sociales" },
  { key: "firm_landing_social_description", value: "More than forty years of legal excellence, integrity and comprehensive counsel in Mexico.", valueEs: "Más de cuarenta años de excelencia jurídica, integridad y asesoría integral en México.", type: "text", category: "firm", description: "Nuestra Firma — descripción para redes sociales" },
  { key: "page_contact_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Contacto — texto de introducción" },
  { key: "page_contact_body", value: "", valueEs: "", type: "text", category: "pages", description: "Contacto — dirección / texto principal" },
  { key: "page_contact_eyebrow", value: "CONTACT", valueEs: "CONTACTO", type: "text", category: "pages", description: "Contacto — etiqueta editorial" },
  { key: "page_contact_title", value: "We are here to help", valueEs: "Estamos aquí para ayudarte", type: "text", category: "pages", description: "Contacto — título principal" },
  { key: "page_contact_description", value: "Contact us or visit our offices in Mexico City.", valueEs: "Ponte en contacto con nosotros o visita nuestras oficinas en Ciudad de México.", type: "text", category: "pages", description: "Contacto — texto introductorio" },
  { key: "page_contact_email", value: "info@vwys.com.mx", valueEs: "info@vwys.com.mx", type: "text", category: "pages", description: "Contacto — correo público" },
  { key: "page_contact_phone", value: "+52 (55) 5258 1000", valueEs: "+52 (55) 5258 1000", type: "text", category: "pages", description: "Contacto — teléfono público" },
  { key: "page_contact_address", value: "Torre SOMA Chapultepec, 18th floor\n204 Campos Elíseos, Polanco\nAccess via 10 Arquímedes Street\nC.P. 11550, Mexico City", valueEs: "Torre SOMA Chapultepec, piso 18\nCampos Elíseos 204, Polanco\nAcceso por Calle Arquímedes N.º 10\nC.P. 11550, Ciudad de México", type: "text", category: "pages", description: "Contacto — dirección pública, una línea por renglón" },
  { key: "contact_form_title", value: "Send us a message", valueEs: "Envíanos un mensaje", type: "text", category: "pages", description: "Contacto — título del formulario" },
  { key: "contact_form_description", value: "Share your details and tell us how we can help. Our team will contact you.", valueEs: "Déjanos tus datos y cuéntanos cómo podemos ayudarte. Nuestro equipo se pondrá en contacto contigo.", type: "text", category: "pages", description: "Contacto — descripción del formulario" },
  { key: "contact_form_name_label", value: "Full name", valueEs: "Nombre completo", type: "text", category: "pages", description: "Contacto — etiqueta Nombre" },
  { key: "contact_form_email_label", value: "Email", valueEs: "Correo electrónico", type: "text", category: "pages", description: "Contacto — etiqueta Correo" },
  { key: "contact_form_phone_label", value: "Phone (optional)", valueEs: "Teléfono (opcional)", type: "text", category: "pages", description: "Contacto — etiqueta Teléfono" },
  { key: "contact_form_company_label", value: "Company (optional)", valueEs: "Empresa (opcional)", type: "text", category: "pages", description: "Contacto — etiqueta Empresa" },
  { key: "contact_form_country_label", value: "Country", valueEs: "País", type: "text", category: "pages", description: "Contacto — etiqueta País" },
  { key: "contact_form_practice_label", value: "Advisory area (optional)", valueEs: "Área de asesoría (opcional)", type: "text", category: "pages", description: "Contacto — etiqueta Área de asesoría" },
  { key: "contact_form_message_label", value: "Message", valueEs: "Mensaje", type: "text", category: "pages", description: "Contacto — etiqueta Mensaje" },
  { key: "contact_form_select_label", value: "Select an option", valueEs: "Selecciona una opción", type: "text", category: "pages", description: "Contacto — opción vacía del selector" },
  { key: "contact_form_submit_label", value: "Send message", valueEs: "Enviar mensaje", type: "text", category: "pages", description: "Contacto — texto del botón" },
  { key: "contact_form_sending_label", value: "Sending…", valueEs: "Enviando…", type: "text", category: "pages", description: "Contacto — texto durante el envío" },
  { key: "contact_form_required_message", value: "Please fill in name, email, country and message, and accept the Privacy Notice.", valueEs: "Completa nombre, correo, país y mensaje, y acepta el Aviso de Privacidad.", type: "text", category: "pages", description: "Contacto — validación de campos obligatorios" },
  { key: "contact_form_invalid_email_message", value: "Enter a valid email address.", valueEs: "Escribe un correo electrónico válido.", type: "text", category: "pages", description: "Contacto — validación de correo" },
  { key: "contact_form_success_message", value: "Thank you, your message was sent successfully.", valueEs: "Gracias, tu mensaje fue enviado correctamente.", type: "text", category: "pages", description: "Contacto — mensaje de éxito" },
  { key: "contact_form_error_message", value: "Your message could not be sent. Please try again.", valueEs: "No fue posible enviar tu mensaje. Intenta de nuevo.", type: "text", category: "pages", description: "Contacto — mensaje de error" },
  { key: "contact_form_network_error_message", value: "We could not connect. Check your connection and try again.", valueEs: "No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.", type: "text", category: "pages", description: "Contacto — mensaje de error de red" },
  { key: "contact_form_privacy_intro", value: "I have read and accept the", valueEs: "He leído y acepto el", type: "text", category: "pages", description: "Contacto — texto previo al aviso de privacidad" },
  { key: "contact_form_privacy_link", value: "Privacy Notice", valueEs: "Aviso de Privacidad", type: "text", category: "pages", description: "Contacto — texto del enlace de privacidad" },
  { key: "contact_form_privacy_path", value: "/privacy", valueEs: "/aviso", type: "url", category: "pages", description: "Contacto — destino del aviso de privacidad" },
  { key: "page_careers_title", value: "Your career at Von Wobeser y Sierra", valueEs: "Tu carrera en Von Wobeser y Sierra", type: "text", category: "pages", description: "Carrera — título principal" },
  { key: "page_careers_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Carrera — párrafo de introducción" },
  { key: "page_careers_body", value: "<p>We are a firm in constant growth, with a culture and environment that promotes your potential, consolidating new skills and values.</p><p>Through our career plan, which consists of creating, training and retaining the best talent, we offer professional and personal development which is optimal.</p>", valueEs: "<p>Somos un despacho en constante crecimiento, con una cultura y ambiente que promuevan tu potencial, consolidando nuevas habilidades y valores.</p><p>A través de nuestro plan de carrera, el cual consiste en crear, formar y retener el mejor talento, te ofrecemos un desarrollo profesional y personal óptimo.</p>", type: "text", category: "pages", description: "Carrera — cuerpo del texto" },
  { key: "page_interns_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — introducción" },
  { key: "page_interns_summer_title", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — título del programa de verano" },
  { key: "page_interns_summer_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — descripción del programa de verano" },
  { key: "page_interns_offer_title", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — título de beneficios" },
  { key: "page_interns_offer_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pasantes — beneficios" },
  { key: "page_probono_eyebrow", value: "Our firm", valueEs: "Nuestra firma", type: "text", category: "pages", description: "Pro Bono — etiqueta editorial" },
  { key: "page_probono_title", value: "Pro Bono", valueEs: "Pro Bono", type: "text", category: "pages", description: "Pro Bono — título principal" },
  { key: "page_probono_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Pro Bono — párrafo de introducción" },
  { key: "page_probono_body", value: "", valueEs: "", type: "text", category: "pages", description: "Pro Bono — cuerpo del texto" },
  { key: "page_capabilities_body", value: "", valueEs: "", type: "text", category: "pages", description: "Capacidades — párrafo de introducción" },
  { key: "page_practices_eyebrow", value: "Practices", valueEs: "Prácticas", type: "text", category: "pages", description: "Prácticas — etiqueta editorial" },
  { key: "page_practices_title", value: "Practice Areas", valueEs: "Áreas de Práctica", type: "text", category: "pages", description: "Áreas de Práctica — título principal" },
  { key: "page_practices_description", value: "", valueEs: "", type: "text", category: "pages", description: "Áreas de Práctica — subtítulo opcional" },
  { key: "page_industries_eyebrow", value: "Industries", valueEs: "Industrias", type: "text", category: "pages", description: "Industrias — etiqueta editorial" },
  { key: "page_industries_title", value: "Our industries", valueEs: "Nuestras industrias", type: "text", category: "pages", description: "Industrias — título principal" },
  { key: "page_industries_description", value: "Explore the industry groups with which we address the specific needs of every sector.", valueEs: "Conoce los grupos de práctica con los que atendemos las necesidades específicas de cada industria.", type: "text", category: "pages", description: "Industrias — texto introductorio" },
  { key: "page_privacy_body", value: PRIVACY_NOTICE_VWYS_2026_EN, valueEs: PRIVACY_NOTICE_VWYS_2026_ES, type: "text", category: "pages", description: "Aviso de Privacidad — texto completo (VWyS!636089.3)" },
  { key: "page_talent_privacy_body", value: TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES, valueEs: TALENT_PRIVACY_NOTICE_CANDIDATES_2026_ES, type: "text", category: "pages", description: `Aviso de Privacidad para Candidaturas — texto oficial en español (${TALENT_PRIVACY_NOTICE_CANDIDATES_2026_SOURCE})` },
  { key: "page_diversity_eyebrow", value: "Our firm", valueEs: "Nuestra firma", type: "text", category: "pages", description: "Diversidad e Inclusión — etiqueta editorial" },
  { key: "page_diversity_title", value: "Diversity & inclusion", valueEs: "Diversidad e inclusión", type: "text", category: "pages", description: "Diversidad e Inclusión — título principal" },
  { key: "page_diversity_intro", value: "", valueEs: "", type: "text", category: "pages", description: "Diversidad e Inclusión — párrafo de introducción" },
  { key: "page_diversity_body", value: "", valueEs: "", type: "text", category: "pages", description: "Diversidad e Inclusión — texto adicional (se muestra arriba de la galería de video, no la reemplaza)" },
  // Diversidad conserva su video principal y los siete videos de su carrusel
  // original. Nunca reutiliza el recorrido de Nuevas oficinas.
  { key: "page_diversity_video_main", value: "/images/vw_vid_02.mp4", type: "url", category: "pages", description: "Diversidad e Inclusión — video principal" },
  ...Array.from({ length: 7 }, (_, index) => {
    const number = index + 1;
    return {
      key: `page_diversity_video_${number}`,
      value: `/images/vid_0${number}.mp4`,
      type: "url",
      category: "pages",
      description: `Diversidad e Inclusión — video ${number} del carrusel`,
    };
  }),
  { key: "page_diversity_thumb_main", value: "/images/diversity-thumbnails/main.jpg", type: "url", category: "pages", description: "Diversidad e Inclusión — miniatura del video principal" },
  ...Array.from({ length: 7 }, (_, index) => ({
    key: `page_diversity_thumb_${index + 1}`,
    value: `/images/diversity-thumbnails/video-${index + 1}.jpg`,
    type: "url",
    category: "pages",
    description: `Diversidad e Inclusión — miniatura del video ${index + 1}`,
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

/**
 * Copia no pública de la configuración que alimentaba la primera landing de la
 * firma. Se guarda una sola vez para que el cliente pueda recuperar sus textos
 * desde administración sin volver a exponer las rutas antiguas.
 */
const FIRM_PREVIOUS_VERSION_KEY = "firm_landing_previous_version";

type FirmPreviousVersion = {
  capturedAt: string;
  content: Record<string, { value: string; valueEs: string }>;
};

function parseFirmPreviousVersion(raw: string | null | undefined): FirmPreviousVersion | null {
  if (!raw?.trim()) return null;
  try {
    const candidate = JSON.parse(raw) as Partial<FirmPreviousVersion>;
    if (!candidate || typeof candidate !== "object" || !candidate.content || typeof candidate.content !== "object") return null;
    const content = Object.fromEntries(
      Object.entries(candidate.content).flatMap(([key, entry]) => {
        if (!key.startsWith("firm_landing_") || !entry || typeof entry !== "object") return [];
        const item = entry as { value?: unknown; valueEs?: unknown };
        return [[key, { value: String(item.value ?? ""), valueEs: String(item.valueEs ?? "") }]];
      }),
    );
    return Object.keys(content).length ? { capturedAt: String(candidate.capturedAt || ""), content } : null;
  } catch {
    return null;
  }
}

async function ensureFirmPreviousVersion(): Promise<boolean> {
  const [existing] = await db.select({ value: siteConfig.value }).from(siteConfig).where(eq(siteConfig.key, FIRM_PREVIOUS_VERSION_KEY));
  // Un respaldo existente nunca se reemplaza: aunque un valor histórico fuese
  // inválido, conservarlo es más seguro que destruir la única copia disponible.
  if (existing) return false;

  const rows = await db.select().from(siteConfig);
  const content = Object.fromEntries(
    rows
      .filter((row) => row.key.startsWith("firm_landing_") && row.key !== FIRM_PREVIOUS_VERSION_KEY)
      .map((row) => [row.key, { value: row.value ?? "", valueEs: row.valueEs ?? "" }]),
  );
  if (!Object.keys(content).length) return false;

  await db.insert(siteConfig).values({
    key: FIRM_PREVIOUS_VERSION_KEY,
    value: JSON.stringify({ capturedAt: new Date().toISOString(), content } satisfies FirmPreviousVersion),
    valueEs: "",
    type: "json",
    category: "firm",
    description: "Respaldo interno de la versión anterior de la landing institucional",
  }).onConflictDoNothing({ target: siteConfig.key });
  return true;
}

/**
 * Publica una sola vez el Aviso de Privacidad 2026 entregado por la firma.
 * Antes de reemplazar el texto histórico conserva ambos idiomas en una clave
 * interna. El marcador evita que futuros arranques reemplacen cambios hechos
 * conscientemente desde Administración.
 */
async function ensurePrivacyNoticeVwys2026(): Promise<boolean> {
  const [migration] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, PRIVACY_NOTICE_VWYS_2026_MIGRATION_KEY));
  if (migration?.value === "complete") return false;

  const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, "page_privacy_body"));
  const capturedAt = new Date().toISOString();
  const previous = {
    capturedAt,
    source: PRIVACY_NOTICE_VWYS_2026_SOURCE,
    content: {
      value: current?.value ?? "",
      valueEs: current?.valueEs ?? "",
    },
  };

  await db.transaction(async (tx) => {
    // El respaldo se crea únicamente si aún no existe. Si hay dos arranques
    // concurrentes, ninguno puede sobrescribir la primera copia histórica.
    await tx.insert(siteConfig).values({
      key: PRIVACY_NOTICE_VWYS_2026_PREVIOUS_VERSION_KEY,
      value: JSON.stringify(previous),
      valueEs: "",
      type: "json",
      category: "privacy",
      description: "Respaldo interno previo al Aviso de Privacidad VWyS 2026",
      updatedAt: new Date(),
    }).onConflictDoNothing({ target: siteConfig.key });

    await tx.insert(siteConfig).values({
      key: "page_privacy_body",
      value: PRIVACY_NOTICE_VWYS_2026_EN,
      valueEs: PRIVACY_NOTICE_VWYS_2026_ES,
      type: "text",
      category: "pages",
      description: `Aviso de Privacidad — texto completo (${PRIVACY_NOTICE_VWYS_2026_SOURCE})`,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteConfig.key,
      set: {
        value: PRIVACY_NOTICE_VWYS_2026_EN,
        valueEs: PRIVACY_NOTICE_VWYS_2026_ES,
        type: "text",
        category: "pages",
        description: `Aviso de Privacidad — texto completo (${PRIVACY_NOTICE_VWYS_2026_SOURCE})`,
        updatedAt: new Date(),
      },
    });

    await tx.insert(siteConfig).values({
      key: PRIVACY_NOTICE_VWYS_2026_MIGRATION_KEY,
      value: "complete",
      valueEs: "complete",
      type: "text",
      category: "internal",
      description: `Migración interna del Aviso de Privacidad ${PRIVACY_NOTICE_VWYS_2026_SOURCE}`,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteConfig.key,
      set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
    });
  });
  return true;
}

/**
 * Activa una sola vez el video histórico autorizado para la portada y conserva
 * la selección vigente en claves de historial. El marcador hace que una futura
 * elección del administrador nunca sea reemplazada por un reinicio.
 */
async function ensureLegacyDronHeroVideo(): Promise<boolean> {
  const [migration] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, HERO_VIDEO_HISTORY_MIGRATION_KEY));
  if (migration?.value === "complete") return false;

  const activeKeys = ["hero_video_master", "hero_video", "hero_video_mobile", "hero_video_poster"] as const;
  const activeRows = await Promise.all(activeKeys.map(async (key) => {
    const [row] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    return [key, row] as const;
  }));
  const active = Object.fromEntries(activeRows) as Record<(typeof activeKeys)[number], typeof activeRows[number][1]>;

  const alreadyUsingDron = active.hero_video_master?.value === CURRENT_HERO_MEDIA.master
    && active.hero_video?.value === CURRENT_HERO_MEDIA.desktop
    && active.hero_video_mobile?.value === CURRENT_HERO_MEDIA.mobile
    && active.hero_video_poster?.value === CURRENT_HERO_MEDIA.poster;
  const previousDefaultFor = (key: typeof activeKeys[number]) => PREVIOUS_HERO_MEDIA[
    key === "hero_video_master" ? "master" : key === "hero_video" ? "desktop" : key === "hero_video_mobile" ? "mobile" : "poster"
  ];

  await db.transaction(async (tx) => {
    if (!alreadyUsingDron) {
      const historyPairs = [
        [HERO_VIDEO_PREVIOUS_MASTER_KEY, "hero_video_master", "Respaldo — archivo maestro del video anterior del hero"],
        [HERO_VIDEO_PREVIOUS_DESKTOP_KEY, "hero_video", "Respaldo — video anterior de escritorio del hero"],
        [HERO_VIDEO_PREVIOUS_MOBILE_KEY, "hero_video_mobile", "Respaldo — video anterior móvil del hero"],
        [HERO_VIDEO_PREVIOUS_POSTER_KEY, "hero_video_poster", "Respaldo — póster anterior del hero"],
      ] as const;
      for (const [historyKey, activeKey, description] of historyPairs) {
        const previous = active[activeKey];
        const value = previous?.value || previousDefaultFor(activeKey);
        const valueEs = previous?.valueEs || previous?.value || previousDefaultFor(activeKey);
        await tx.insert(siteConfig).values({
          key: historyKey,
          value,
          valueEs,
          type: "url",
          category: "home",
          description,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value, valueEs, type: "url", category: "home", description, updatedAt: new Date() },
        });
      }

      const activePairs = [
        ["hero_video_master", CURRENT_HERO_MEDIA.master, "Archivo maestro del hero"],
        ["hero_video", CURRENT_HERO_MEDIA.desktop, "Video Full HD optimizado del hero para escritorio"],
        ["hero_video_mobile", CURRENT_HERO_MEDIA.mobile, "Video HD optimizado del hero para móvil"],
        ["hero_video_poster", CURRENT_HERO_MEDIA.poster, "Póster del primer fotograma real del hero"],
      ] as const;
      for (const [key, value, description] of activePairs) {
        await tx.insert(siteConfig).values({
          key,
          value,
          valueEs: value,
          type: "url",
          category: "home",
          description,
          updatedAt: new Date(),
        }).onConflictDoUpdate({
          target: siteConfig.key,
          set: { value, valueEs: value, type: "url", category: "home", description, updatedAt: new Date() },
        });
      }
    }

    await tx.insert(siteConfig).values({
      key: HERO_VIDEO_HISTORY_MIGRATION_KEY,
      value: "complete",
      valueEs: "complete",
      type: "text",
      category: "internal",
      description: "Migración interna: activa el video histórico dron 2026 y preserva el hero anterior",
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteConfig.key,
      set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
    });
  });
  return !alreadyUsingDron;
}

const HERO_ACTIVE_MEDIA_KEYS = ["hero_video_master", "hero_video", "hero_video_mobile", "hero_video_poster"] as const;
const HERO_PREVIOUS_MEDIA_KEYS = [
  HERO_VIDEO_PREVIOUS_MASTER_KEY,
  HERO_VIDEO_PREVIOUS_DESKTOP_KEY,
  HERO_VIDEO_PREVIOUS_MOBILE_KEY,
  HERO_VIDEO_PREVIOUS_POSTER_KEY,
] as const;

type HeroMediaPaths = {
  readonly master: string;
  readonly desktop: string;
  readonly mobile: string;
  readonly poster: string;
};

function heroMediaValuesMatch(
  values: Record<string, string | undefined>,
  keys: readonly string[],
  media: HeroMediaPaths,
): boolean {
  return values[keys[0]] === media.master
    && values[keys[1]] === media.desktop
    && values[keys[2]] === media.mobile
    && values[keys[3]] === media.poster;
}

function heroMediaValuesAreManaged(
  values: Record<string, string | undefined>,
  keys: readonly string[],
): boolean {
  return keys.every((key) => values[key]?.startsWith("/uploads/") === true);
}

/**
 * Resuelve una fuente estática del espejo sin permitir traversal. Estos son
 * valores internos fijos, pero se valida la raíz como defensa adicional antes
 * de copiar los archivos a la zona temporal de App Storage.
 */
function staticHeroMediaSource(publicPath: string): string {
  if (!publicPath.startsWith("/images/")) throw new Error("Invalid static hero media path");
  const mirrorDirectory = path.resolve(getMirrorDir());
  const source = path.resolve(mirrorDirectory, `.${publicPath}`);
  if (!source.startsWith(`${mirrorDirectory}${path.sep}`)) {
    throw new Error("Static hero media path escapes mirror directory");
  }
  return source;
}

/** Igual que la fuente, la ruta destino está limitada a uploads administrados. */
function managedHeroMediaDestination(publicPath: string): string {
  const prefix = "/uploads/";
  if (!publicPath.startsWith(prefix)) throw new Error("Invalid managed hero media path");
  const uploadsDirectory = path.resolve(process.cwd(), "uploads");
  const destination = path.resolve(uploadsDirectory, publicPath.slice(prefix.length));
  if (!destination.startsWith(`${uploadsDirectory}${path.sep}`)) {
    throw new Error("Managed hero media path escapes uploads directory");
  }
  return destination;
}

async function stageHeroMediaForPersistentStorage(
  sourceMedia: HeroMediaPaths,
  destinationMedia: HeroMediaPaths,
): Promise<PublicMediaFile[]> {
  const pairs = [
    [sourceMedia.master, destinationMedia.master],
    [sourceMedia.desktop, destinationMedia.desktop],
    [sourceMedia.mobile, destinationMedia.mobile],
    [sourceMedia.poster, destinationMedia.poster],
  ] as const;

  return Promise.all(pairs.map(async ([sourcePublicPath, destinationPublicPath]) => {
    const source = staticHeroMediaSource(sourcePublicPath);
    const destination = managedHeroMediaDestination(destinationPublicPath);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(source, destination);
    return { absolutePath: destination, publicPath: destinationPublicPath };
  }));
}

/**
 * Convierte los dos videos iniciales del hero en medios administrados.
 *
 * Solo escribe site_config después de que App Storage confirma el lote completo.
 * Si App Storage no está disponible, el sitio sigue sirviendo los archivos
 * empaquetados y la próxima ejecución vuelve a intentarlo: nunca quedan rutas
 * públicas apuntando a un objeto inexistente.
 */
async function ensureHeroMediaInPersistentStorage(): Promise<boolean> {
  const [migration] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, HERO_VIDEO_APP_STORAGE_MIGRATION_KEY));
  if (migration?.value === "complete") return false;

  const keys = [...HERO_ACTIVE_MEDIA_KEYS, ...HERO_PREVIOUS_MEDIA_KEYS];
  const rows = await Promise.all(keys.map(async (key) => {
    const [row] = await db.select({ value: siteConfig.value }).from(siteConfig).where(eq(siteConfig.key, key));
    return [key, row?.value] as const;
  }));
  const values = Object.fromEntries(rows) as Record<string, string | undefined>;

  const activeIsStatic = heroMediaValuesMatch(values, HERO_ACTIVE_MEDIA_KEYS, CURRENT_HERO_MEDIA);
  const previousIsStatic = heroMediaValuesMatch(values, HERO_PREVIOUS_MEDIA_KEYS, PREVIOUS_HERO_MEDIA);
  const activeIsManaged = heroMediaValuesAreManaged(values, HERO_ACTIVE_MEDIA_KEYS);
  const previousIsManaged = heroMediaValuesAreManaged(values, HERO_PREVIOUS_MEDIA_KEYS);

  // Una selección distinta del administrador nunca se reemplaza. Las rutas
  // /uploads ya siguen el flujo normal, que persiste antes de guardar cambios.
  if (!activeIsStatic && !activeIsManaged) return false;
  if (!previousIsStatic && !previousIsManaged) return false;

  if (activeIsManaged && previousIsManaged) {
    await db.insert(siteConfig).values({
      key: HERO_VIDEO_APP_STORAGE_MIGRATION_KEY,
      value: "complete",
      valueEs: "complete",
      type: "text",
      category: "internal",
      description: "Migración interna: ambos juegos de video del hero están verificados en App Storage",
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteConfig.key,
      set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
    });
    return true;
  }

  const storage = await persistentMediaStorageStatus();
  if (!storage.available || storage.provider !== "replit_app_storage") {
    // En desarrollo local los archivos /images son intencionalmente válidos.
    // En producción se reintentará en el siguiente arranque, sin fallar la web.
    console.warn("Hero media persistence pending: App Storage is unavailable");
    return false;
  }

  const files = [
    ...(activeIsStatic
      ? await stageHeroMediaForPersistentStorage(CURRENT_HERO_MEDIA, PERSISTENT_CURRENT_HERO_MEDIA)
      : []),
    ...(previousIsStatic
      ? await stageHeroMediaForPersistentStorage(PREVIOUS_HERO_MEDIA, PERSISTENT_PREVIOUS_HERO_MEDIA)
      : []),
  ];

  try {
    const persisted = await persistPublicMediaFiles(files);
    if (!persisted.persisted) {
      console.warn("Hero media persistence pending: App Storage did not confirm the media batch");
      return false;
    }
  } catch {
    // La función de persistencia limpia cualquier lote parcial. Conservamos las
    // rutas estáticas activas y no exponemos detalles de infraestructura en logs.
    console.warn("Hero media persistence pending: App Storage transfer failed");
    return false;
  }

  await db.transaction(async (tx) => {
    const updates = [
      ...(activeIsStatic
        ? [
          ["hero_video_master", PERSISTENT_CURRENT_HERO_MEDIA.master, "Archivo maestro persistente del hero"],
          ["hero_video", PERSISTENT_CURRENT_HERO_MEDIA.desktop, "Video Full HD persistente del hero para escritorio"],
          ["hero_video_mobile", PERSISTENT_CURRENT_HERO_MEDIA.mobile, "Video HD persistente del hero para móvil"],
          ["hero_video_poster", PERSISTENT_CURRENT_HERO_MEDIA.poster, "Póster persistente del hero"],
        ] as const
        : []),
      ...(previousIsStatic
        ? [
          [HERO_VIDEO_PREVIOUS_MASTER_KEY, PERSISTENT_PREVIOUS_HERO_MEDIA.master, "Respaldo persistente — archivo maestro del video anterior del hero"],
          [HERO_VIDEO_PREVIOUS_DESKTOP_KEY, PERSISTENT_PREVIOUS_HERO_MEDIA.desktop, "Respaldo persistente — video anterior de escritorio del hero"],
          [HERO_VIDEO_PREVIOUS_MOBILE_KEY, PERSISTENT_PREVIOUS_HERO_MEDIA.mobile, "Respaldo persistente — video anterior móvil del hero"],
          [HERO_VIDEO_PREVIOUS_POSTER_KEY, PERSISTENT_PREVIOUS_HERO_MEDIA.poster, "Respaldo persistente — póster anterior del hero"],
        ] as const
        : []),
    ];

    for (const [key, value, description] of updates) {
      await tx.insert(siteConfig).values({
        key,
        value,
        valueEs: value,
        type: "url",
        category: "home",
        description,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value, valueEs: value, type: "url", category: "home", description, updatedAt: new Date() },
      });
    }

    await tx.insert(siteConfig).values({
      key: HERO_VIDEO_APP_STORAGE_MIGRATION_KEY,
      value: "complete",
      valueEs: "complete",
      type: "text",
      category: "internal",
      description: "Migración interna: ambos juegos de video del hero están verificados en App Storage",
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: siteConfig.key,
      set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
    });
  });
  return true;
}

export async function getFirmPreviousVersion(): Promise<FirmPreviousVersion | null> {
  const [row] = await db.select({ value: siteConfig.value }).from(siteConfig).where(eq(siteConfig.key, FIRM_PREVIOUS_VERSION_KEY));
  return parseFirmPreviousVersion(row?.value);
}

export async function restoreFirmPreviousVersion(): Promise<boolean> {
  const previous = await getFirmPreviousVersion();
  if (!previous) return false;
  await db.transaction(async (tx) => {
    for (const [key, content] of Object.entries(previous.content)) {
      await tx.update(siteConfig)
        .set({ value: content.value, valueEs: content.valueEs, updatedAt: new Date() })
        .where(eq(siteConfig.key, key));
    }
    // La landing canónica ahora muestra page_firm_*. Al restaurar una versión
    // anterior, reflejamos su historia también en estos dos campos sin volver a
    // publicar las rutas anteriores.
    for (const [legacyKey, activeKey] of [
      ["firm_landing_history_intro", "page_firm_intro"],
      ["firm_landing_history_body", "page_firm_body"],
    ] as const) {
      const content = previous.content[legacyKey];
      if (!content) continue;
      await tx.insert(siteConfig).values({
        key: activeKey,
        value: content.value,
        valueEs: content.valueEs,
        type: "text",
        category: "pages",
        description: "Nuestra Firma — contenido restaurado desde la versión anterior",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: content.value, valueEs: content.valueEs, updatedAt: new Date() },
      });
    }
  });
  invalidateConfigCache();
  return true;
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
  const typography = await getEditorialTypographyForEntities("site_config", rows.map((row) => row.key));
  const map: ConfigMap = {};
  for (const r of rows) map[r.key] = { value: r.value ?? "", valueEs: r.valueEs ?? "", type: r.type, typography: typography.get(r.key) };
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

  // El subdestino de Reconocimientos de Insights está listo como ruta, pero no
  // cuenta todavía con publicaciones. Al aplicar esta decisión una sola vez se
  // oculta en los dos presets guardados; más adelante el administrador podrá
  // activarlo de forma explícita cuando exista contenido, sin que un reinicio
  // del servidor vuelva a cambiar su decisión.
  const [recognitionsVisibilityMigration] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, "nav_recognitions_visibility_migration_v1"));
  let recognitionsNavigationUpdated = false;
  if (recognitionsVisibilityMigration?.value !== "complete") {
    const navigationKeys = ["nav_structure_v2", "nav_classic_structure_v2"] as const;
    await db.transaction(async (tx) => {
      for (const key of navigationKeys) {
        const [current] = await tx
          .select({ value: siteConfig.value, valueEs: siteConfig.valueEs })
          .from(siteConfig)
          .where(eq(siteConfig.key, key));
        if (!current?.value) continue;
        try {
          const configuration = JSON.parse(current.value) as {
            items?: Array<{ id?: string; children?: Array<{ id?: string; visible?: boolean }> }>;
          };
          const recognitions = configuration.items
            ?.find((item) => item.id === "perspectives")
            ?.children?.find((child) => child.id === "perspectives-recognitions");
          if (!recognitions || recognitions.visible === false) continue;
          recognitions.visible = false;
          const next = JSON.stringify(configuration);
          await tx.update(siteConfig)
            .set({ value: next, valueEs: next, updatedAt: new Date() })
            .where(eq(siteConfig.key, key));
          recognitionsNavigationUpdated = true;
        } catch {
          // Una configuración inválida ya utiliza el fallback seguro de
          // navegación; nunca se reemplaza a ciegas durante el arranque.
        }
      }
      await tx.insert(siteConfig).values({
        key: "nav_recognitions_visibility_migration_v1",
        value: "complete",
        valueEs: "complete",
        type: "text",
        category: "internal",
        description: "Migración interna de visibilidad para Reconocimientos de Insights",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
      });
    });
  }

  // La navegación de Insights conserva temporalmente Artículos,
  // Comunicaciones y Suscríbete. Se aplica una sola vez a ambos presets
  // guardados: ninguna ruta ni contenido se borra, y cada interruptor sigue
  // disponible en Administración para una reactivación futura.
  const [insightsDestinationsVisibilityMigration] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, "nav_insights_destinations_visibility_migration_v2"));
  let insightsDestinationsNavigationUpdated = false;
  if (insightsDestinationsVisibilityMigration?.value !== "complete") {
    const navigationKeys = ["nav_structure_v2", "nav_classic_structure_v2"] as const;
    const hiddenInsightsDestinations = new Set([
      "perspectives-events",
      "perspectives-recognitions",
      "perspectives-analysis",
      "perspectives-press",
    ]);
    await db.transaction(async (tx) => {
      for (const key of navigationKeys) {
        const [current] = await tx
          .select({ value: siteConfig.value, valueEs: siteConfig.valueEs })
          .from(siteConfig)
          .where(eq(siteConfig.key, key));
        if (!current?.value) continue;
        try {
          const configuration = JSON.parse(current.value) as {
            items?: Array<{
              id?: string;
              children?: Array<{ id?: string; labelEs?: string; labelEn?: string; visible?: boolean }>;
            }>;
          };
          const insights = configuration.items?.find((item) => item.id === "perspectives");
          if (!insights?.children) continue;
          let changed = false;
          for (const child of insights.children) {
            if (hiddenInsightsDestinations.has(child.id || "") && child.visible !== false) {
              child.visible = false;
              changed = true;
            }
            if (child.id === "perspectives-subscribe" && child.visible !== true) {
              child.visible = true;
              changed = true;
            }
            // El preset clásico usaba la etiqueta histórica “Noticias” para
            // Comunicaciones. Solo se normaliza ese par exacto de defaults;
            // cualquier redacción personalizada desde Administración prevalece.
            if (child.id === "perspectives-communications" && child.labelEs === "Noticias" && child.labelEn === "News") {
              child.labelEs = "Comunicaciones";
              child.labelEn = "Communications";
              changed = true;
            }
          }
          if (!changed) continue;
          const next = JSON.stringify(configuration);
          await tx.update(siteConfig)
            .set({ value: next, valueEs: next, updatedAt: new Date() })
            .where(eq(siteConfig.key, key));
          insightsDestinationsNavigationUpdated = true;
        } catch {
          // Una configuración inválida conserva su fallback seguro de
          // navegación; nunca se sobrescribe durante el arranque.
        }
      }
      await tx.insert(siteConfig).values({
        key: "nav_insights_destinations_visibility_migration_v2",
        value: "complete",
        valueEs: "complete",
        type: "text",
        category: "internal",
        description: "Migración interna de visibilidad para destinos de Insights",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
      });
    });
  }

  // Propuesta de valor y Reconocimientos de Nuestra firma llevan hoy a la
  // misma landing. Se ocultan una sola vez en los presets guardados, sin borrar
  // rutas ni contenido, y sin revertir una reactivación administrativa futura.
  const [firmDestinationsVisibilityMigration] = await db
    .select({ value: siteConfig.value })
    .from(siteConfig)
    .where(eq(siteConfig.key, "nav_firm_destinations_visibility_migration_v1"));
  let firmDestinationsNavigationUpdated = false;
  if (firmDestinationsVisibilityMigration?.value !== "complete") {
    const navigationKeys = ["nav_structure_v2", "nav_classic_structure_v2"] as const;
    await db.transaction(async (tx) => {
      for (const key of navigationKeys) {
        const [current] = await tx
          .select({ value: siteConfig.value, valueEs: siteConfig.valueEs })
          .from(siteConfig)
          .where(eq(siteConfig.key, key));
        if (!current?.value) continue;
        try {
          const configuration = JSON.parse(current.value) as {
            items?: Array<{ id?: string; children?: Array<{ id?: string; visible?: boolean }> }>;
          };
          const firm = configuration.items?.find((item) => item.id === "firm");
          if (!firm?.children) continue;
          let changed = false;
          for (const childId of ["firm-value", "firm-recognitions"]) {
            const child = firm.children.find((entry) => entry.id === childId);
            if (child && child.visible !== false) {
              child.visible = false;
              changed = true;
            }
          }
          if (!changed) continue;
          const next = JSON.stringify(configuration);
          await tx.update(siteConfig)
            .set({ value: next, valueEs: next, updatedAt: new Date() })
            .where(eq(siteConfig.key, key));
          firmDestinationsNavigationUpdated = true;
        } catch {
          // Una configuración inválida conserva el fallback seguro; no se
          // reemplaza a ciegas durante el arranque.
        }
      }
      await tx.insert(siteConfig).values({
        key: "nav_firm_destinations_visibility_migration_v1",
        value: "complete",
        valueEs: "complete",
        type: "text",
        category: "internal",
        description: "Migración interna de visibilidad para destinos de Nuestra firma",
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: siteConfig.key,
        set: { value: "complete", valueEs: "complete", updatedAt: new Date() },
      });
    });
  }

  // Debe ejecutarse antes de cualquier normalización de la landing. Así la copia
  // conserva exactamente la versión que el público veía antes de consolidarla.
  const firmPreviousVersionCreated = await ensureFirmPreviousVersion();
  const privacyNoticeUpdated = await ensurePrivacyNoticeVwys2026();
  const legacyDronHeroActivated = await ensureLegacyDronHeroVideo();
  const heroMediaPersisted = await ensureHeroMediaInPersistentStorage();

  // Publica el video 2026 entregado por el cliente únicamente cuando cada campo
  // conserva un recurso predeterminado anterior. Los medios personalizados que
  // se hayan elegido desde administración permanecen intactos.
  const legacyHeroMedia: Record<string, { current: string; legacy: Set<string> }> = {
    hero_video: {
      current: CURRENT_HERO_MEDIA.desktop,
      legacy: new Set(["", "/images/dron_2026_40.mp4", "/images/home-hero-desktop-v1.mp4", "/images/home-hero-desktop-v2.mp4", "/images/hero-092c5875ed80af62-desktop.mp4"]),
    },
    hero_video_mobile: {
      current: CURRENT_HERO_MEDIA.mobile,
      // Las variantes previas eran presets móviles del sitio. Solo se migran
      // esas rutas exactas; una selección hecha desde Administración conserva
      // siempre el archivo que eligió la firma.
      legacy: new Set(["", "/images/home-hero-mobile-v1.mp4", "/images/home-hero-mobile-v2.mp4", "/images/hero-092c5875ed80af62-mobile.mp4", "/images/hero-20260810-fullhd-mobile.mp4", "/images/hero-20260821-hd-mobile.mp4"]),
    },
    hero_video_poster: {
      current: CURRENT_HERO_MEDIA.poster,
      legacy: new Set(["", "/images/home-hero-poster-v1.webp", "/images/home-hero-poster-v2.webp", "/images/hero-092c5875ed80af62-poster.webp"]),
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

  // La franja de Nuevas oficinas deja de usar mayúsculas sostenidas y recupera
  // la redacción bilingüe aprobada. Solo se sustituyen las variantes exactas
  // de los defaults históricos; cualquier edición posterior del CMS prevalece.
  const bannerDefault = DEFAULTS.find((item) => item.key === "banner_title")!;
  const [bannerTitle] = await db.select().from(siteConfig).where(eq(siteConfig.key, "banner_title"));
  let bannerCopyUpdated = false;
  if (bannerTitle) {
    const legacyEnglish = new Set(["WE GO WHERE CLIENTS NEED US"]);
    const legacySpanish = new Set(["VAMOS DONDE EL CLIENTE NOS NECESITA", "VAMOS A DONDE LOS CLIENTES NOS NECESITAN"]);
    const value = legacyEnglish.has(bannerTitle.value || "") ? bannerDefault.value : bannerTitle.value;
    const valueEs = legacySpanish.has(bannerTitle.valueEs || "") ? bannerDefault.valueEs ?? bannerDefault.value : bannerTitle.valueEs;
    if (value !== bannerTitle.value || valueEs !== bannerTitle.valueEs) {
      await db.update(siteConfig)
        .set({ value, valueEs, updatedAt: new Date() })
        .where(eq(siteConfig.key, "banner_title"));
      bannerCopyUpdated = true;
    }
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
    ["firm_landing_eyebrow", "Von Wobeser y Sierra", "Von Wobeser y Sierra", "Our firm", "Nuestra firma"],
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
      "newsletter_description",
      "Receive legal analysis, publications and news from Von Wobeser y Sierra directly in your inbox.",
      "Recibe en tu correo análisis jurídicos, publicaciones y novedades de Von Wobeser y Sierra.",
      "Stay up to date on legal and regulatory changes relevant to your business.",
      "Mantente al día sobre los cambios legales y regulatorios relevantes para tu negocio.",
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

  // Lleva el formulario de Contacto al copy comercial aprobado únicamente
  // cuando todavía conserva los textos predeterminados anteriores.
  let contactCopyUpdated = false;
  const contactLegacyCopy: Array<[string, string, string, string, string]> = [
    [
      "contact_form_description",
      "Share your details and the area in which you need advice. Our team will contact you.",
      "Déjanos tus datos y el área en la que necesitas asesoría. Nuestro equipo se pondrá en contacto contigo.",
      "Share your details and tell us how we can help. Our team will contact you.",
      "Déjanos tus datos y cuéntanos cómo podemos ayudarte. Nuestro equipo se pondrá en contacto contigo.",
    ],
    [
      "contact_form_practice_label",
      "Area of interest (optional)",
      "Área de interés (opcional)",
      "Advisory area (optional)",
      "Área de asesoría (opcional)",
    ],
    [
      "contact_form_required_message",
      "Please fill in name, email and message.",
      "Completa nombre, correo y mensaje.",
      "Please fill in name, email, country and message, and accept the Privacy Notice.",
      "Completa nombre, correo, país y mensaje, y acepta el Aviso de Privacidad.",
    ],
  ];
  for (const [key, oldEn, oldEs, nextEn, nextEs] of contactLegacyCopy) {
    const [current] = await db.select().from(siteConfig).where(eq(siteConfig.key, key));
    if (!current) continue;
    const value = current.value === oldEn ? nextEn : current.value;
    const valueEs = current.valueEs === oldEs ? nextEs : current.valueEs;
    if (value === current.value && valueEs === current.valueEs) continue;
    await db.update(siteConfig)
      .set({ value, valueEs, updatedAt: new Date() })
      .where(eq(siteConfig.key, key));
    contactCopyUpdated = true;
  }

  if (missing.length || recognitionsNavigationUpdated || insightsDestinationsNavigationUpdated || firmDestinationsNavigationUpdated || firmPreviousVersionCreated || privacyNoticeUpdated || legacyDronHeroActivated || heroMediaPersisted || heroMediaUpdated || bannerCopyUpdated || footerUpdated || heroLinkUpdated || landingRouteUpdated || firmCopyUpdated || rankingTitleUpdated || newsletterCopyUpdated || contactCopyUpdated) invalidateConfigCache();
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
  masterPath: string,
  desktopPath: string,
  mobilePath: string,
  posterPath: string,
): Promise<void> {
  const values = [
    { key: "hero_video_master", value: masterPath, description: "Archivo maestro original del hero" },
    { key: "hero_video", value: desktopPath, description: "Video Full HD optimizado del hero para escritorio" },
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

/** Atributo para el HTML de texto visible; `auto` conserva la plantilla. */
export function cfgTypographyAttribute(map: ConfigMap, key: string, lang: "en" | "es"): Record<string, string> {
  return typographyAttribute(map[key]?.typography, lang === "es" ? "valueEs" : "value", lang);
}

/** Boolean site-config helper. Missing keys remain enabled for backwards compatibility. */
export function isConfigEnabled(map: ConfigMap, key: string, defaultValue = true): boolean {
  const raw = map[key]?.value?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw !== "false";
}
