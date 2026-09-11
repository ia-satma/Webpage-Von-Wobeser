import {
  Briefcase,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  LineChart,
  Lock,
  Mail,
  Newspaper,
  PanelBottom,
  Settings,
  Sparkles,
  UsersRound,
  Volume2,
} from "lucide-react";
import type { SiteConfigPageDefinition } from "./contracts";

export const PAGES: Record<string, SiteConfigPageDefinition> = {
  portada: {
    title: "Portada",
    description: "Edita el inicio por bloques. Cada pestaña conserva sus cambios mientras navegas entre ellas.",
    icon: Settings,
    groups: [
      {
        title: "Portada (home)",
        fields: [
          { key: "hero_video_master", label: "Video maestro del hero", media: "video", help: "Sube MP4 (H.264 recomendado), WebM, OGV o MOV de hasta 200 MB. El maestro, sus derivados y el póster se verifican en App Storage antes de publicarse. El video anterior se mantiene disponible en el historial de abajo." },
          { key: "hero_video_previous_master", label: "Historial — video anterior del hero", media: "video", help: "Respaldo persistente en App Storage. No se publica ni se elimina. Para recuperarlo en el futuro, selecciónalo arriba como Video maestro del hero y usa “Generar / regenerar Full HD”." },
          { key: "hero_practice_link", label: "Destino del video del hero", bilingual: true, help: "Inglés: /about. Español: /acerca-de." },
          { key: "home_experience_visible", label: "Mostrar frase de experiencia", control: "switch", defaultValue: false, help: "Permite ocultar el bloque sin borrar su texto en español ni en inglés." },
          { key: "home_experience", label: "Frase — años de experiencia", bilingual: true },
          { key: "home_team_stats_visible", label: "Mostrar cifras del equipo", control: "switch", defaultValue: false, help: "Permite ocultar el bloque sin borrar sus cifras ni traducciones." },
          { key: "home_team_stats", label: "Frase — cifras del equipo", bilingual: true, multiline: true },
          { key: "banner_title", label: "Banner — título", help: "Texto grande del banner rojo.", bilingual: true },
          { key: "banner_subtitle", label: "Banner — subtítulo", bilingual: true },
        ],
      },
      {
        title: "Carruseles de prácticas e industrias",
        fields: [
          { key: "home_practices_label", label: "Carrusel de prácticas — etiqueta", bilingual: true, help: "Los nombres, imágenes, orden y publicación de cada tarjeta se editan en Prácticas." },
          { key: "home_industries_label", label: "Carrusel de industrias — etiqueta", bilingual: true, help: "Los nombres, imágenes, orden y publicación de cada tarjeta se editan en Grupos por industria." },
        ],
      },
      {
        title: "Secciones editoriales del home",
        fields: [
          { key: "home_recognitions_title", label: "Reconocimientos — título", bilingual: true },
          { key: "home_recognitions_intro", label: "Reconocimientos — introducción", bilingual: true, multiline: true },
          { key: "home_recognitions_body_visible", label: "Mostrar listado detallado de reconocimientos", control: "switch", defaultValue: false, help: "Oculta solamente el párrafo largo; el título, la introducción y el carrusel de logotipos permanecen visibles." },
          { key: "home_recognitions_body", label: "Reconocimientos — texto", bilingual: true, multiline: true },
          { key: "home_diversity_visible", label: "Mostrar Diversidad e Inclusión en la portada", control: "switch", defaultValue: false, help: "El bloque queda oculto sin borrar sus textos ni afectar su página. Actívalo si el cliente desea recuperarlo en el Home." },
          { key: "home_diversity_title", label: "Diversidad — título", bilingual: true },
          { key: "home_diversity_body", label: "Diversidad — texto", bilingual: true, multiline: true },
          { key: "home_probono_visible", label: "Mostrar Pro Bono en la portada", control: "switch", defaultValue: false, help: "El bloque queda oculto sin borrar sus textos ni afectar su página. Actívalo si el cliente desea recuperarlo en el Home." },
          { key: "home_probono_title", label: "Pro Bono — título", bilingual: true },
          { key: "home_probono_body", label: "Pro Bono — texto", bilingual: true, multiline: true },
          {
            key: "home_about_layout",
            label: "Visión, misión y valores — diseño",
            control: "select",
            options: [
              { value: "editorial", label: "Editorial — retícula de valores" },
              { value: "classic", label: "Clásico — diseño anterior" },
            ],
            help: "Editorial es el nuevo diseño. Clásico recupera el bloque anterior sin modificar ninguno de sus textos.",
          },
          { key: "home_about_editorial_title", label: "Visión, misión y valores — título editorial", bilingual: true },
          { key: "home_about_editorial_intro", label: "Visión, misión y valores — introducción editorial", bilingual: true, multiline: true },
          { key: "home_about_title", label: "Acerca de nosotros — título", bilingual: true },
          { key: "home_vision_label", label: "Visión — etiqueta", bilingual: true },
          { key: "home_vision_body", label: "Visión — texto", bilingual: true, multiline: true },
          { key: "home_mission_label", label: "Misión — etiqueta", bilingual: true },
          { key: "home_mission_body", label: "Misión — texto", bilingual: true, multiline: true },
          { key: "home_values_label", label: "Valores — etiqueta", bilingual: true },
          { key: "home_values_body", label: "Valores — texto (separa cada valor con una línea en blanco)", bilingual: true, multiline: true, rows: 12 },
          { key: "home_location_visible", label: "Mostrar ubicación en la portada", control: "switch", defaultValue: true, help: "Usa la misma dirección, teléfono, correo, mapa e indicaciones de Contacto y Oficinas; no duplica datos." },
        ],
      },
      {
        title: "Newsletter (home)",
        fields: [
          { key: "newsletter_title", label: "Newsletter — título", bilingual: true },
          { key: "newsletter_description", label: "Newsletter — descripción", bilingual: true, multiline: true },
          { key: "newsletter_eyebrow", label: "Newsletter — etiqueta superior", bilingual: true },
          { key: "newsletter_name_label", label: "Campo — nombre", bilingual: true },
          { key: "newsletter_email_label", label: "Campo — correo", bilingual: true },
          { key: "newsletter_company_label", label: "Campo — empresa", bilingual: true },
          { key: "newsletter_privacy_intro", label: "Privacidad — texto previo", bilingual: true },
          { key: "newsletter_privacy_link", label: "Privacidad — texto del enlace", bilingual: true },
          { key: "newsletter_privacy_path", label: "Privacidad — destino", bilingual: true, help: "Inglés: /privacy. Español: /aviso." },
          { key: "newsletter_required", label: "Newsletter — mensaje de campos obligatorios", bilingual: true },
          { key: "newsletter_cta", label: "Newsletter — botón", bilingual: true },
          { key: "newsletter_success", label: "Newsletter — mensaje de éxito", bilingual: true },
          { key: "newsletter_error", label: "Newsletter — mensaje de error", bilingual: true },
        ],
      },
      {
        title: "Noticias de portada",
        fields: [
          { key: "home_news_title", label: "Título", bilingual: true },
          { key: "home_news_more", label: "CTA global — ver más", bilingual: true, help: "Se aplica a los enlaces VER MÁS / SEE MORE de todo el espejo." },
          { key: "home_news_previous", label: "Accesibilidad — anterior", bilingual: true },
          { key: "home_news_next", label: "Accesibilidad — siguiente", bilingual: true },
          { key: "home_news_minimize", label: "Accesibilidad — minimizar", bilingual: true },
          { key: "home_news_expand", label: "Accesibilidad — mostrar", bilingual: true },
          { key: "home_news_pages", label: "Número de páginas", control: "number", min: 1, max: 10, help: "Cada página muestra dos noticias. Si hay menos noticias publicadas, se muestran solo las disponibles." },
        ],
      },
    ],
  },
  footer: {
    title: "Pie de página",
    description: "Datos institucionales, acreditaciones y redes sociales que aparecen al final de las páginas del espejo.",
    icon: PanelBottom,
    groups: [
      {
        title: "Datos institucionales",
        fields: [
          { key: "footer_firm", label: "Nombre de la firma", help: "Aparece en el pie de página del sitio." },
          { key: "footer_address", label: "Dirección", help: "Una línea por renglón.", multiline: true, bilingual: true },
          { key: "footer_phone", label: "Teléfono" },
          { key: "footer_website", label: "Sitio web / correo" },
        ],
      },
      {
        title: "Redes sociales",
        fields: [
          { key: "footer_facebook_visible", label: "Mostrar Facebook", control: "switch", help: "Puedes ocultarlo sin borrar ni modificar su enlace." },
          { key: "footer_facebook", label: "Facebook (URL)" },
          { key: "footer_twitter_visible", label: "Mostrar X", control: "switch", help: "Puedes ocultarlo sin borrar ni modificar su enlace." },
          { key: "footer_twitter", label: "X (URL)" },
          { key: "footer_linkedin_visible", label: "Mostrar LinkedIn", control: "switch", help: "Puedes ocultarlo sin borrar ni modificar su enlace." },
          { key: "footer_linkedin", label: "LinkedIn (URL)" },
        ],
      },
      {
        title: "Acreditación",
        fields: [
          { key: "footer_esr_image", label: "Distintivo ESR", media: "image", help: "Imagen que aparece como acreditación junto al bloque legal." },
          { key: "footer_esr_alt", label: "Distintivo ESR — texto alternativo", bilingual: true },
        ],
      },
    ],
  },
  voz: {
    title: "Voz corporativa",
    description: "Configuración técnica de la voz utilizada por OpenAI TTS.",
    icon: Volume2,
    groups: [
      {
        fields: [
          { key: "tts_voice", label: "Voz de marca", help: "Voces válidas: alloy, ash, ballad, coral, echo, fable, onyx, nova, sage, shimmer, verse. Vacío = usa alloy por defecto." },
        ],
      },
    ],
  },
  seo: {
    title: "SEO — Analytics y verificación",
    description: "Administra el favicon y conecta Google Analytics (GA4) y Google Search Console.",
    icon: LineChart,
    groups: [
      {
        title: "Identidad del navegador",
        fields: [
          { key: "site_favicon", label: "Favicon del sitio", media: "image", help: "Usa un PNG o WebP cuadrado con transparencia. El sistema conserva el canal transparente y no agrega fondo. El cambio se aplica al guardar, sin reiniciar el servidor." },
        ],
      },
      {
        title: "Medición y verificación",
        fields: [
          { key: "ga4_measurement_id", label: "Google Analytics (GA4) — Measurement ID", help: "Formato G-XXXXXXX, lo da Google Analytics al crear la propiedad. Vacío = no se instala GA4 todavía. Requiere reiniciar el servidor para tomar efecto.", pattern: /^G-[A-Z0-9]+$/i, patternError: "El Measurement ID debe tener el formato G-XXXXXXX (lo copias de Google Analytics, no lo inventes)." },
          { key: "google_site_verification", label: "Google Search Console — código de verificación", help: "El valor de content=\"...\" que da Google al verificar por meta tag. No hace falta si ya verificaste por DNS en GoDaddy. Requiere reiniciar el servidor para tomar efecto." },
        ],
      },
    ],
  },
  firma: {
    title: "Nuestra Firma",
    description: "Edita el contenido de la página original conservando el diseño del espejo.",
    icon: Landmark,
    groups: [
      {
        fields: [
          { key: "page_firm_intro", label: "Introducción", bilingual: true, multiline: true, rows: 6 },
          { key: "page_firm_body", label: "Presentación de la firma", bilingual: true, multiline: true, rows: 9 },
        ],
      },
    ],
  },
  "resumen-firma": {
    title: "Resumen institucional",
    description: "Landing breve que se abre exclusivamente al hacer clic en el video del home.",
    icon: Landmark,
    groups: [
      {
        title: "Encabezado e imagen institucional",
        fields: [
          { key: "firm_landing_hero_visible", label: "Mostrar encabezado e imagen", control: "switch", help: "Ocultarla no elimina sus textos ni medios." },
          { key: "firm_landing_hero_order", label: "Orden del encabezado", control: "number", help: "Cero mantiene el encabezado al inicio de la landing." },
          { key: "firm_landing_eyebrow", label: "Etiqueta editorial", bilingual: true },
          { key: "firm_landing_title", label: "Título principal", bilingual: true },
          { key: "firm_landing_subtitle", label: "Subtítulo", bilingual: true, multiline: true },
          { key: "firm_landing_hero_image", label: "Fotografía panorámica / póster", media: "image", bilingual: true, help: "Se muestra después de “En breve” y antes de “Nuestra firma en cifras”. También se usa como póster cuando hay un video." },
          { key: "firm_landing_hero_video", label: "Video panorámico (opcional)", media: "video", bilingual: true, help: "Puedes subir un archivo o pegar un enlace de YouTube/Vimeo. Si lo dejas vacío, se muestra la fotografía panorámica." },
          { key: "firm_landing_hero_alt", label: "Descripción accesible de la fotografía o video", bilingual: true },
          { key: "firm_landing_scroll_label", label: "Indicador para seguir leyendo", bilingual: true },
        ],
      },
      {
        title: "Historia",
        fields: [
          { key: "firm_landing_history_visible", label: "Mostrar sección", control: "switch" },
          { key: "firm_landing_history_order", label: "Orden", control: "number", help: "Un número menor coloca esta sección antes que las demás." },
          { key: "firm_landing_history_title", label: "Título", bilingual: true },
          { key: "firm_landing_history_since", label: "Etiqueta de fecha", bilingual: true },
          { key: "firm_landing_history_intro", label: "Introducción breve", bilingual: true, multiline: true, rows: 4 },
          { key: "firm_landing_history_body", label: "Presentación breve", bilingual: true, multiline: true, rows: 5 },
          { key: "firm_landing_history_image", label: "Fotografía de apoyo", media: "image", bilingual: true, help: "Utiliza por defecto otra fotografía de la galería de Nuevas Oficinas." },
          { key: "firm_landing_history_image_alt", label: "Descripción accesible de la fotografía", bilingual: true },
        ],
      },
      {
        title: "Cifras",
        fields: [
          { key: "firm_landing_stats_visible", label: "Mostrar sección", control: "switch" },
          { key: "firm_landing_stats_order", label: "Orden", control: "number" },
          { key: "firm_landing_stats_title", label: "Título", bilingual: true },
          { key: "firm_landing_stat_1_value", label: "Años de experiencia — cifra", help: "Ejemplo: 40+." },
          { key: "firm_landing_stat_1_label", label: "Años de experiencia — etiqueta", bilingual: true },
          { key: "firm_landing_stat_2_value", label: "Equipo legal — cifra", help: "Valor editorial actual: Más de 180." },
          { key: "firm_landing_stat_2_label", label: "Equipo legal — etiqueta", bilingual: true },
          { key: "firm_landing_stat_3_value", label: "Prácticas — cifra opcional", help: "Vacío = cuenta automáticamente las prácticas publicadas." },
          { key: "firm_landing_stat_3_label", label: "Prácticas — etiqueta", bilingual: true },
          { key: "firm_landing_stat_4_value", label: "Grupos por industria — cifra opcional", help: "Vacío = cuenta automáticamente los grupos publicados." },
          { key: "firm_landing_stat_4_label", label: "Grupos por industria — etiqueta", bilingual: true },
        ],
      },
      {
        title: "Valores",
        fields: [
          { key: "firm_landing_values_visible", label: "Mostrar sección", control: "switch" },
          { key: "firm_landing_values_order", label: "Orden", control: "number" },
          { key: "firm_landing_values_title", label: "Título", bilingual: true },
          { key: "firm_landing_values_intro", label: "Introducción", bilingual: true, multiline: true },
          ...Array.from({ length: 5 }, (_, index) => [
            { key: `firm_landing_value_${index + 1}_title`, label: `Valor ${index + 1} — título`, bilingual: true },
            { key: `firm_landing_value_${index + 1}_body`, label: `Valor ${index + 1} — descripción`, bilingual: true, multiline: true },
          ]).flat(),
        ],
      },
      {
        title: "Cultura",
        fields: [
          { key: "firm_landing_culture_visible", label: "Mostrar sección", control: "switch" },
          { key: "firm_landing_culture_order", label: "Orden", control: "number" },
          { key: "firm_landing_culture_title", label: "Título", bilingual: true },
          { key: "firm_landing_culture_subtitle", label: "Subtítulo", bilingual: true },
          { key: "firm_landing_culture_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "firm_landing_culture_image", label: "Imagen", media: "image", bilingual: true },
          { key: "firm_landing_culture_image_alt", label: "Texto alternativo de la imagen", bilingual: true },
          ...Array.from({ length: 6 }, (_, index) => [
            { key: `firm_landing_culture_${index + 1}_title`, label: `Aspecto ${index + 1} — título`, bilingual: true },
            { key: `firm_landing_culture_${index + 1}_body`, label: `Aspecto ${index + 1} — descripción`, bilingual: true, multiline: true },
          ]).flat(),
        ],
      },
      {
        title: "Diversidad y reconocimientos",
        fields: [
          { key: "firm_landing_diversity_visible", label: "Mostrar Diversidad", control: "switch" },
          { key: "firm_landing_diversity_order", label: "Orden de Diversidad", control: "number" },
          { key: "firm_landing_diversity_title", label: "Diversidad — título", bilingual: true },
          { key: "firm_landing_diversity_subtitle", label: "Diversidad — subtítulo", bilingual: true },
          { key: "firm_landing_diversity_intro", label: "Diversidad — introducción", bilingual: true, multiline: true },
          { key: "firm_landing_diversity_commitment", label: "Diversidad — compromiso", bilingual: true, multiline: true },
          { key: "firm_landing_diversity_cta", label: "Diversidad — enlace", bilingual: true },
          { key: "firm_landing_diversity_path", label: "Diversidad — destino", bilingual: true },
          ...Array.from({ length: 4 }, (_, index) => [
            { key: `firm_landing_diversity_${index + 1}_title`, label: `Iniciativa ${index + 1} — título`, bilingual: true },
            { key: `firm_landing_diversity_${index + 1}_body`, label: `Iniciativa ${index + 1} — descripción`, bilingual: true, multiline: true },
          ]).flat(),
          { key: "firm_landing_rankings_visible", label: "Mostrar Reconocimientos", control: "switch", help: "Los registros, logotipos y años se administran en Contenido complementario → Reconocimientos." },
          { key: "firm_landing_rankings_order", label: "Orden de Reconocimientos", control: "number" },
          { key: "firm_landing_rankings_title", label: "Reconocimientos — título", bilingual: true },
          { key: "firm_landing_rankings_intro", label: "Reconocimientos — introducción", bilingual: true, multiline: true },
          { key: "firm_landing_rankings_empty", label: "Reconocimientos — mensaje cuando no hay registros", bilingual: true, multiline: true },
        ],
      },
      {
        title: "Pro Bono, Carrera y enlaces finales",
        fields: [
          { key: "firm_landing_pathways_visible", label: "Mostrar Pro Bono y Carrera", control: "switch" },
          { key: "firm_landing_pathways_order", label: "Orden de Pro Bono y Carrera", control: "number" },
          { key: "firm_landing_probono_title", label: "Pro Bono — título", bilingual: true },
          { key: "firm_landing_probono_text", label: "Pro Bono — texto", bilingual: true, multiline: true },
          { key: "firm_landing_probono_cta", label: "Pro Bono — enlace", bilingual: true },
          { key: "firm_landing_probono_path", label: "Pro Bono — destino", bilingual: true },
          { key: "firm_landing_careers_title", label: "Carrera — título", bilingual: true },
          { key: "firm_landing_careers_text", label: "Carrera — texto", bilingual: true, multiline: true },
          { key: "firm_landing_careers_cta", label: "Carrera — enlace", bilingual: true },
          { key: "firm_landing_careers_path", label: "Carrera — destino", bilingual: true },
          { key: "firm_landing_cta_visible", label: "Mostrar enlaces finales", control: "switch" },
          { key: "firm_landing_cta_order", label: "Orden de enlaces finales", control: "number" },
          { key: "firm_landing_cta_title", label: "Cierre — título", bilingual: true },
          { key: "firm_landing_cta_text", label: "Cierre — descripción", bilingual: true, multiline: true },
          ...Array.from({ length: 3 }, (_, index) => [
            { key: `firm_landing_cta_${index + 1}_label`, label: `Enlace ${index + 1} — etiqueta`, bilingual: true },
            { key: `firm_landing_cta_${index + 1}_path`, label: `Enlace ${index + 1} — destino`, bilingual: true },
          ]).flat(),
        ],
      },
      {
        title: "SEO",
        fields: [
          { key: "firm_landing_seo_title", label: "Título SEO", bilingual: true },
          { key: "firm_landing_seo_description", label: "Descripción SEO", bilingual: true, multiline: true },
          { key: "firm_landing_seo_image", label: "Imagen para redes sociales", media: "image", bilingual: true },
          { key: "firm_landing_canonical", label: "URL canonical", bilingual: true, help: "Usa /about en inglés y /acerca-de en español, salvo que SEO requiera otra URL." },
          { key: "firm_landing_social_title", label: "Título para redes sociales", bilingual: true },
          { key: "firm_landing_social_description", label: "Descripción para redes sociales", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  probono: {
    title: "Pro Bono",
    description: "Textos y logotipos de la página. Si dejas un texto vacío, se muestra el contenido original.",
    icon: HeartHandshake,
    groups: [
      {
        title: "Encabezado",
        fields: [
          { key: "page_probono_eyebrow", label: "Etiqueta editorial", bilingual: true },
          { key: "page_probono_title", label: "Título principal", bilingual: true },
          { key: "page_probono_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_probono_body", label: "Cuerpo", bilingual: true, multiline: true },
        ],
      },
      {
        title: "Logotipos y reconocimientos",
        fields: [
          { key: "page_probono_logo_1", label: "Logotipo 1", media: "image" },
          { key: "page_probono_logo_2", label: "Logotipo 2", media: "image" },
          { key: "page_probono_logo_3", label: "Logotipo 3", media: "image" },
          { key: "page_probono_logo_4", label: "Logotipo 4", media: "image" },
        ],
      },
    ],
  },
  diversidad: {
    title: "Diversidad e Inclusión",
    description: "Textos y carrusel de video de Diversidad e Inclusión. Los videos de Nuevas oficinas no se reutilizan aquí.",
    icon: Sparkles,
    groups: [
      {
        title: "Encabezado",
        fields: [
          { key: "page_diversity_eyebrow", label: "Etiqueta editorial", bilingual: true },
          { key: "page_diversity_title", label: "Título principal", bilingual: true },
          { key: "page_diversity_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_diversity_body", label: "Texto adicional", help: "Se muestra ARRIBA de la galería de video, sin borrarla. Déjalo vacío si no quieres agregar nada.", bilingual: true, multiline: true },
        ],
      },
      {
        title: "Galería de video",
        fields: [
          { key: "page_diversity_video_main", label: "Video principal", media: "video", help: "El video que se reproduce por defecto al entrar a la página. Puedes subir un archivo o pegar un enlace de YouTube/Vimeo." },
          { key: "page_diversity_video_1", label: "Video 1", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
          { key: "page_diversity_video_2", label: "Video 2", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
          { key: "page_diversity_video_3", label: "Video 3", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
          { key: "page_diversity_video_4", label: "Video 4", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
          { key: "page_diversity_video_5", label: "Video 5", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
          { key: "page_diversity_video_6", label: "Video 6", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
          { key: "page_diversity_video_7", label: "Video 7", media: "video", help: "Video del carrusel de Diversidad e Inclusión." },
        ],
      },
      {
        title: "Imágenes del carrusel de video",
        fields: [
          { key: "page_diversity_thumb_main", label: "Miniatura del video principal", media: "image", help: "Fotograma del video. Puedes reemplazarlo por otro desde aquí." },
          { key: "page_diversity_thumb_1", label: "Miniatura del video 1", media: "image" },
          { key: "page_diversity_thumb_2", label: "Miniatura del video 2", media: "image" },
          { key: "page_diversity_thumb_3", label: "Miniatura del video 3", media: "image" },
          { key: "page_diversity_thumb_4", label: "Miniatura del video 4", media: "image" },
          { key: "page_diversity_thumb_5", label: "Miniatura del video 5", media: "image" },
          { key: "page_diversity_thumb_6", label: "Miniatura del video 6", media: "image" },
          { key: "page_diversity_thumb_7", label: "Miniatura del video 7", media: "image" },
        ],
      },
      {
        title: "Logotipos aliados",
        fields: [
          { key: "page_diversity_logo_1", label: "Logotipo 1", media: "image" },
          { key: "page_diversity_logo_2", label: "Logotipo 2", media: "image" },
          { key: "page_diversity_logo_3", label: "Logotipo 3", media: "image" },
        ],
      },
    ],
  },
  privacidad: {
    title: "Aviso de Privacidad",
    description: "Documento legal (LFPDPPP). El aviso vigente se administra en español e inglés desde este módulo.",
    icon: Lock,
    groups: [
      {
        fields: [
          { key: "page_privacy_body", label: "Texto completo", help: "Aviso VWyS 2026. Puedes editar ambos idiomas; conserva el marcador [___] hasta que Legal defina el medio de comunicación de modificaciones. La traducción automática está deshabilitada para este texto legal.", bilingual: true, multiline: true, rows: 18, allowAutoTranslation: false },
          { key: "page_talent_privacy_body", label: "Aviso de Privacidad para Candidaturas", help: "Exclusivo de los formularios de Talento. Es el texto oficial en español entregado por Legal; no sustituye el Aviso general ni debe traducirse sin una versión aprobada.", multiline: true, rows: 18, allowAutoTranslation: false },
        ],
      },
    ],
  },
  capacidades: {
    title: "Introducción de Capacidades",
    description: "Edita la introducción de Capacidades y las cabeceras editoriales de Prácticas e Industrias.",
    icon: Briefcase,
    groups: [
      {
        title: "Listado de Prácticas",
        fields: [
          { key: "page_practices_eyebrow", label: "Prácticas — etiqueta editorial", bilingual: true, help: "Se muestra en Inter, como la etiqueta de Contacto." },
          { key: "page_practices_title", label: "Áreas de Práctica — título principal", bilingual: true, help: "Se muestra en Gelasio y con capitalización normal, no en mayúsculas sostenidas." },
          { key: "page_practices_description", label: "Áreas de Práctica — subtítulo opcional", bilingual: true, multiline: true, help: "Déjalo vacío para no mostrar un subtítulo en el listado público." },
        ],
      },
      {
        title: "Listado de Industrias",
        fields: [
          { key: "page_industries_eyebrow", label: "Industrias — etiqueta editorial", bilingual: true, help: "Se muestra en Inter, como la etiqueta de Contacto." },
          { key: "page_industries_title", label: "Industrias — título principal", bilingual: true, help: "Se muestra en Gelasio y con capitalización normal, no en mayúsculas sostenidas." },
          { key: "page_industries_description", label: "Industrias — introducción", bilingual: true, multiline: true },
        ],
      },
      {
        fields: [
          { key: "page_capabilities_body", label: "Introducción", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  perspectivas: {
    title: "Perspectivas",
    description: "Textos bilingües de la portada que reúne artículos, eventos, reconocimientos, comunicaciones, análisis y Sala de prensa.",
    icon: Newspaper,
    groups: [
      {
        fields: [
          { key: "page_perspectives_title", label: "Título", bilingual: true },
          { key: "page_perspectives_intro", label: "Introducción editorial", bilingual: true, multiline: true, rows: 6 },
        ],
      },
    ],
  },
  "alcance-internacional": {
    title: "Alcance internacional",
    description: "Contenido editorial bilingüe de la página. El menú solo la muestra cuando estos textos están completos y existe una alianza publicada.",
    icon: Globe2,
    groups: [
      {
        fields: [
          { key: "page_international_title", label: "Título", bilingual: true },
          { key: "page_international_intro", label: "Introducción", bilingual: true, multiline: true, rows: 5 },
          { key: "page_international_body", label: "Cuerpo editorial", bilingual: true, multiline: true, rows: 12 },
        ],
      },
    ],
  },
  vacantes: {
    title: "Portada de Vacantes",
    description: "Textos bilingües que acompañan el listado de puestos publicados y vigentes.",
    icon: GraduationCap,
    groups: [
      {
        fields: [
          { key: "page_openings_title", label: "Título", bilingual: true },
          { key: "page_openings_intro", label: "Introducción", bilingual: true, multiline: true, rows: 6 },
        ],
      },
    ],
  },
  alumni: {
    title: "Alumni — capacidad futura",
    description: "Prepara el contenido bilingüe sin exponerlo. La página permanece en 404/noindex hasta completar los textos y autorizar su publicación expresamente.",
    icon: UsersRound,
    groups: [
      {
        fields: [
          { key: "page_alumni_title", label: "Título", bilingual: true },
          { key: "page_alumni_intro", label: "Introducción", bilingual: true, multiline: true, rows: 5 },
          { key: "page_alumni_body", label: "Cuerpo editorial", bilingual: true, multiline: true, rows: 12 },
          { key: "page_alumni_published", label: "Autorizar publicación de Alumni", control: "switch", defaultValue: false, help: "Esta autorización no basta por sí sola: también se requiere contenido bilingüe completo y activar el destino en Navegación." },
        ],
      },
    ],
  },
  carrera: {
    title: "Carrera",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: GraduationCap,
    groups: [
      {
        fields: [
          { key: "page_careers_title", label: "Título principal", bilingual: true, help: "Se muestra como el H1 de la página pública de Carrera." },
          { key: "page_careers_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_careers_body", label: "Cuerpo", bilingual: true, multiline: true },
        ],
      },
      {
        title: "Programa de Pasantes",
        fields: [
          { key: "page_interns_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_interns_summer_title", label: "Programa de verano — título", bilingual: true, multiline: true },
          { key: "page_interns_summer_body", label: "Programa de verano — descripción", bilingual: true, multiline: true },
          { key: "page_interns_offer_title", label: "Qué ofrecemos — título", bilingual: true, multiline: true },
          { key: "page_interns_offer_body", label: "Qué ofrecemos — contenido", bilingual: true, multiline: true, rows: 8 },
        ],
      },
    ],
  },
  contacto: {
    title: "Contacto",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: Mail,
    groups: [
      {
        title: "Información y ubicación",
        fields: [
          { key: "page_contact_eyebrow", label: "Etiqueta editorial", bilingual: true, help: "Se muestra con el estilo institucional de RECONOCIMIENTOS." },
          { key: "page_contact_title", label: "Título principal", bilingual: true },
          { key: "page_contact_description", label: "Descripción", bilingual: true, multiline: true },
          { key: "page_contact_email", label: "Correo público", bilingual: true },
          { key: "page_contact_phone", label: "Teléfono público", bilingual: true },
          { key: "page_contact_address", label: "Dirección", bilingual: true, multiline: true, help: "Una línea por renglón." },
        ],
      },
      {
        title: "Mapa compartido",
        fields: [
          {
            key: "office_map_embed",
            label: "URL del mapa incrustado",
            multiline: true,
            rows: 3,
            help: "Un único mapa para Contacto, la portada y Nuevas oficinas. Usa únicamente el enlace HTTPS de inserción de Google Maps.",
          },
          {
            key: "office_map_directions",
            label: "URL para obtener indicaciones",
            help: "Este enlace se usa en los botones de indicaciones y de ver el mapa en las tres páginas.",
          },
        ],
      },
      {
        title: "Formulario",
        fields: [
          { key: "contact_form_title", label: "Título", bilingual: true },
          { key: "contact_form_description", label: "Descripción", bilingual: true, multiline: true },
          { key: "contact_form_name_label", label: "Campo — nombre", bilingual: true },
          { key: "contact_form_email_label", label: "Campo — correo", bilingual: true },
          { key: "contact_form_phone_label", label: "Campo — teléfono", bilingual: true },
          { key: "contact_form_company_label", label: "Campo — empresa", bilingual: true },
          { key: "contact_form_country_label", label: "Campo — país", bilingual: true },
          { key: "contact_form_practice_label", label: "Campo — área de asesoría", bilingual: true },
          { key: "contact_form_select_label", label: "Selector — opción inicial", bilingual: true },
          { key: "contact_form_message_label", label: "Campo — mensaje", bilingual: true },
          { key: "contact_form_submit_label", label: "Botón — enviar", bilingual: true },
          { key: "contact_form_sending_label", label: "Botón — enviando", bilingual: true },
          { key: "contact_form_privacy_intro", label: "Privacidad — texto previo", bilingual: true },
          { key: "contact_form_privacy_link", label: "Privacidad — texto del enlace", bilingual: true },
          { key: "contact_form_privacy_path", label: "Privacidad — destino", bilingual: true, help: "Inglés: /privacy. Español: /aviso." },
        ],
      },
      {
        title: "Validación y respuestas",
        fields: [
          { key: "contact_form_required_message", label: "Campos obligatorios", bilingual: true },
          { key: "contact_form_invalid_email_message", label: "Correo inválido", bilingual: true },
          { key: "contact_form_success_message", label: "Mensaje de éxito", bilingual: true },
          { key: "contact_form_error_message", label: "Error del servidor", bilingual: true },
          { key: "contact_form_network_error_message", label: "Error de conexión", bilingual: true },
        ],
      },
    ],
  },
};

// La landing institucional y "Nuestra Firma" comparten un único editor. La ruta
// anterior se conserva únicamente como alias interno para enlaces administrativos
// existentes, pero ya no presenta una segunda configuración.
const firmLandingPage = PAGES["resumen-firma"];
PAGES.firma = {
  ...PAGES.firma,
  description: "Edita la landing institucional, su contenido bilingüe, medios, secciones, enlaces y SEO desde un solo lugar.",
  groups: [
    {
      title: "Perfiles de asociados",
      fields: [
        { key: "associate_experience_visible", label: "Mostrar años de experiencia", control: "switch", defaultValue: false, help: "Afecta únicamente a los perfiles públicos de Asociados. Al apagarlo se ocultan las oraciones con años de experiencia, pero los textos bilingües se conservan para reactivarlos después." },
      ],
    },
    ...firmLandingPage.groups.map((group) => ({
      ...group,
      fields: group.fields.map((field) => {
        if (field.key === "firm_landing_history_intro") {
          return { ...field, key: "page_firm_intro", label: "Introducción institucional", rows: 6 };
        }
        if (field.key === "firm_landing_history_body") {
          return { ...field, key: "page_firm_body", label: "Presentación institucional", rows: 9 };
        }
        return field;
      }),
    })),
  ],
};

export const HOME_TAB_LABELS = [
  "Inicio",
  "Carruseles",
  "Contenido editorial",
  "Newsletter",
  "Noticias",
];

export const FIRM_TAB_LABELS = [
  "Hero",
  "Historia",
  "Cifras",
  "Valores",
  "Cultura",
  "Diversidad y reconocimientos",
  "Pro Bono y Carrera",
  "SEO",
];
