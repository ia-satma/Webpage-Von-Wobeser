import { useEffect, useState } from "react";
import { AdminPageHelp } from "@/components/admin/AdminPageHelp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { useLocation, useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ConfirmChangesDialog, fmtValue, type Change } from "@/components/admin/ConfirmChangesDialog";
import { TranslateButton } from "@/components/admin/TranslateButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Save, Settings, Loader2, ArrowLeft, ArrowUpRight, ImageIcon, Landmark, HeartHandshake, Sparkles, Lock, Briefcase, GraduationCap, Mail, LineChart, PanelBottom, Volume2, type LucideIcon } from "lucide-react";

type Field = {
  key: string;
  label: string;
  help?: string;
  bilingual?: boolean;
  media?: "image" | "video";
  multiline?: boolean;
  rows?: number;
  control?: "switch" | "number";
  defaultValue?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  patternError?: string;
};
type FieldGroup = { title?: string; fields: Field[] };
type SiteConfigPage = { title: string; description: string; icon: LucideIcon; groups: FieldGroup[] };

/**
 * Cada sección de "Configuración del sitio" es su propia pantalla (ruta
 * /admin/site-config/:section), enlazada directo desde el grupo del sidebar al que
 * pertenece (Nuestra Firma/Capacidades/Carrera/Contacto/etc — ver client/src/lib/adminNav.ts).
 * "portada" (sin :section) reúne únicamente el home. Navegación, pie y voz viven en
 * pantallas separadas para que la edición cotidiana no sea una página interminable.
 */
const PAGES: Record<string, SiteConfigPage> = {
  portada: {
    title: "Portada",
    description: "Edita el inicio por bloques. Cada pestaña conserva sus cambios mientras navegas entre ellas.",
    icon: Settings,
    groups: [
      {
        title: "Portada (home)",
        fields: [
          { key: "hero_video", label: "Video maestro del hero", media: "video", help: "Sube MP4, WebM, OGV o MOV de hasta 200 MB, o pega un enlace de YouTube/Vimeo. Los archivos locales generan automáticamente versiones optimizadas para escritorio y móvil, además del póster; los enlaces externos usan el reproductor seguro del proveedor." },
          { key: "hero_video_mobile", label: "Video optimizado para móvil", media: "video", help: "Se genera automáticamente desde un archivo maestro local. También puedes sustituirlo por otro archivo o por un enlace de YouTube/Vimeo." },
          { key: "hero_video_poster", label: "Póster del video", media: "image", help: "Debe coincidir con el primer fotograma visible para evitar parpadeos durante la carga." },
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
          { key: "home_diversity_title", label: "Diversidad — título", bilingual: true },
          { key: "home_diversity_body", label: "Diversidad — texto", bilingual: true, multiline: true },
          { key: "home_probono_title", label: "Pro Bono — título", bilingual: true },
          { key: "home_probono_body", label: "Pro Bono — texto", bilingual: true, multiline: true },
          { key: "home_about_title", label: "Acerca de nosotros — título", bilingual: true },
          { key: "home_vision_label", label: "Visión — etiqueta", bilingual: true },
          { key: "home_vision_body", label: "Visión — texto", bilingual: true, multiline: true },
          { key: "home_mission_label", label: "Misión — etiqueta", bilingual: true },
          { key: "home_mission_body", label: "Misión — texto", bilingual: true, multiline: true },
          { key: "home_values_label", label: "Valores — etiqueta", bilingual: true },
          { key: "home_values_body", label: "Valores — texto (separa cada valor con una línea en blanco)", bilingual: true, multiline: true, rows: 12 },
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
          { key: "footer_twitter_visible", label: "Mostrar X / Twitter", control: "switch", help: "Puedes ocultarlo sin borrar ni modificar su enlace." },
          { key: "footer_twitter", label: "Twitter / X (URL)" },
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
        title: "Hero",
        fields: [
          { key: "firm_landing_hero_visible", label: "Mostrar sección", control: "switch", help: "Ocultarla no elimina sus textos ni medios." },
          { key: "firm_landing_hero_order", label: "Orden", control: "number", help: "Cero mantiene el hero al inicio de la landing." },
          { key: "firm_landing_eyebrow", label: "Etiqueta superior", bilingual: true },
          { key: "firm_landing_title", label: "Título principal", bilingual: true },
          { key: "firm_landing_subtitle", label: "Subtítulo", bilingual: true, multiline: true },
          { key: "firm_landing_hero_image", label: "Imagen principal / póster", media: "image", bilingual: true, help: "Utiliza por defecto una fotografía panorámica de Nuevas Oficinas. También se usa como póster cuando hay un video." },
          { key: "firm_landing_hero_video", label: "Video principal (opcional)", media: "video", bilingual: true, help: "Puedes subir un archivo o pegar un enlace de YouTube/Vimeo. Si lo dejas vacío, se muestra la imagen principal." },
          { key: "firm_landing_hero_alt", label: "Descripción accesible del medio", bilingual: true },
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
          { key: "firm_landing_stat_2_value", label: "Abogados — cifra opcional", help: "Vacío = cuenta automáticamente los abogados publicados." },
          { key: "firm_landing_stat_2_label", label: "Abogados — etiqueta", bilingual: true },
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
        fields: [
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
    description: "Textos y galería de video de la página. Si dejas un campo de texto vacío, se muestra el original.",
    icon: Sparkles,
    groups: [
      {
        fields: [
          { key: "page_diversity_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_diversity_body", label: "Texto adicional", help: "Se muestra ARRIBA de la galería de video, sin borrarla. Déjalo vacío si no quieres agregar nada.", bilingual: true, multiline: true },
        ],
      },
      {
        title: "Galería de video",
        fields: [
          { key: "page_diversity_video_main", label: "Video principal", media: "video", help: "El video que se reproduce por defecto al entrar a la página. Puedes subir un archivo o pegar un enlace de YouTube/Vimeo." },
          { key: "page_diversity_video_1", label: "Video — miniatura 1", media: "video" },
          { key: "page_diversity_video_2", label: "Video — miniatura 2", media: "video" },
          { key: "page_diversity_video_3", label: "Video — miniatura 3", media: "video" },
          { key: "page_diversity_video_4", label: "Video — miniatura 4", media: "video" },
          { key: "page_diversity_video_5", label: "Video — miniatura 5", media: "video" },
          { key: "page_diversity_video_6", label: "Video — miniatura 6", media: "video" },
          { key: "page_diversity_video_7", label: "Video — miniatura 7", media: "video" },
        ],
      },
      {
        title: "Imágenes del carrusel de video",
        fields: [
          { key: "page_diversity_thumb_main", label: "Miniatura principal", media: "image" },
          { key: "page_diversity_thumb_1", label: "Imagen — miniatura 1", media: "image" },
          { key: "page_diversity_thumb_2", label: "Imagen — miniatura 2", media: "image" },
          { key: "page_diversity_thumb_3", label: "Imagen — miniatura 3", media: "image" },
          { key: "page_diversity_thumb_4", label: "Imagen — miniatura 4", media: "image" },
          { key: "page_diversity_thumb_5", label: "Imagen — miniatura 5", media: "image" },
          { key: "page_diversity_thumb_6", label: "Imagen — miniatura 6", media: "image" },
          { key: "page_diversity_thumb_7", label: "Imagen — miniatura 7", media: "image" },
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
    description: "Documento legal (LFPDPPP). Si lo dejas vacío, se muestra el texto original.",
    icon: Lock,
    groups: [
      {
        fields: [
          { key: "page_privacy_body", label: "Texto completo", help: "Edítalo si cambia el domicilio, el responsable de los datos u otro dato de cumplimiento.", bilingual: true, multiline: true, rows: 14 },
        ],
      },
    ],
  },
  capacidades: {
    title: "Introducción de Capacidades",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: Briefcase,
    groups: [
      {
        fields: [
          { key: "page_capabilities_body", label: "Introducción", bilingual: true, multiline: true },
        ],
      },
    ],
  },
  carrera: {
    title: "Carrera en VWyS",
    description: "Si lo dejas vacío, se muestra el texto original de la página.",
    icon: GraduationCap,
    groups: [
      {
        fields: [
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
          { key: "page_contact_intro", label: "Introducción", bilingual: true, multiline: true },
          { key: "page_contact_body", label: "Dirección / texto", bilingual: true, multiline: true },
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
          { key: "contact_form_practice_label", label: "Campo — área de interés", bilingual: true },
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

// El resumen conserva en la base los bloques extensos de la primera propuesta, pero
// el panel muestra únicamente lo que realmente se renderiza en la landing breve.
const firmSummaryPage = PAGES["resumen-firma"];
const firmSummaryLinkGroup: FieldGroup = {
  title: "Enlaces finales",
  fields: firmSummaryPage.groups[6].fields.filter((field) => field.key.startsWith("firm_landing_cta_")),
};
firmSummaryPage.groups = [
  firmSummaryPage.groups[0],
  firmSummaryPage.groups[1],
  firmSummaryPage.groups[2],
  firmSummaryPage.groups[3],
  firmSummaryLinkGroup,
  firmSummaryPage.groups[7],
];

type ConfigMap = Record<string, { value: string; valueEs: string; type: string }>;
type CarouselGroup = {
  id: string;
  slug: string;
  name: string;
  nameEs: string;
  imageUrl?: string | null;
  order?: number | null;
  published?: boolean | null;
};
const HOME_TAB_LABELS = ["Inicio", "Carruseles", "Contenido editorial", "Newsletter", "Noticias"];
const FIRM_TAB_LABELS = ["Hero", "Resumen", "Cifras", "Valores", "Enlaces", "SEO"];

export default function AdminSiteConfig() {
  const { isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const { section: rawSection } = useParams<{ section?: string }>();
  const section = rawSection && PAGES[rawSection] ? rawSection : "portada";
  const page = PAGES[section];
  const { toast } = useToast();
  const [draft, setDraft] = useState<Record<string, { value: string; valueEs: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ key: string; changes: Change[] } | null>(null);
  const [homeTab, setHomeTab] = useState("0");

  useEffect(() => {
    // Only redirect once auth has finished loading (avoids a flash-redirect).
    if (!authLoading && !isAuthenticated) setLocation("/admin/login");
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => setHomeTab("0"), [section]);

  const { data, isLoading, refetch } = useQuery<ConfigMap>({
    queryKey: ["/api/admin/site-config"],
    queryFn: async () => (await adminApiRequest("GET", "/api/admin/site-config")).json(),
    enabled: isAuthenticated,
  });

  const practiceCarouselQuery = useQuery<CarouselGroup[]>({
    queryKey: ["/api/admin/practice-groups"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/practice-groups");
      if (!response.ok) throw new Error("No se pudieron cargar las prácticas.");
      return response.json();
    },
    enabled: isAuthenticated && section === "portada",
  });

  const industryCarouselQuery = useQuery<CarouselGroup[]>({
    queryKey: ["/api/admin/industry-groups"],
    queryFn: async () => {
      const response = await adminApiRequest("GET", "/api/admin/industry-groups");
      if (!response.ok) throw new Error("No se pudieron cargar los grupos por industria.");
      return response.json();
    },
    enabled: isAuthenticated && section === "portada",
  });

  useEffect(() => {
    if (data) {
      const next: Record<string, { value: string; valueEs: string }> = {};
      for (const [k, v] of Object.entries(data)) next[k] = { value: v.value || "", valueEs: v.valueEs || "" };
      setDraft(next);
    }
  }, [data]);

  const set = (key: string, field: "value" | "valueEs", val: string) =>
    setDraft((d) => ({ ...d, [key]: { ...(d[key] || { value: "", valueEs: "" }), [field]: val } }));

  const save = async (key: string) => {
    setSaving(key);
    try {
      const d = draft[key] || { value: "", valueEs: "" };
      const shouldOptimizeHero = key === "hero_video"
        && /^\/(?:uploads|images)\/.+\.(?:mp4|webm|mov|ogv)$/i.test(d.value)
        && !/home-hero-(?:desktop|mobile)-v\d+\.mp4$/i.test(d.value)
        && !/\/hero-[a-f0-9]+-desktop\.mp4$/i.test(d.value);
      if (shouldOptimizeHero) {
        const optimized = await adminApiRequest("POST", "/api/admin/media/hero-variants", { mediaPath: d.value });
        if (!optimized.ok) {
          const body = await optimized.json().catch(() => ({}));
          toast({
            title: "No se pudo optimizar",
            description: body.error || "El video anterior continúa publicado.",
            variant: "destructive",
          });
          return;
        }
        const variants = await optimized.json();
        setDraft((current) => ({
          ...current,
          hero_video: { value: variants.desktopPath, valueEs: variants.desktopPath },
          hero_video_mobile: { value: variants.mobilePath, valueEs: variants.mobilePath },
          hero_video_poster: { value: variants.posterPath, valueEs: variants.posterPath },
        }));
        toast({
          title: "Video optimizado y publicado",
          description: "Se generaron las versiones de escritorio, móvil y el póster sin modificar el archivo maestro.",
        });
        refetch();
        return;
      }
      const res = await adminApiRequest("PUT", `/api/admin/site-config/${key}`, { value: d.value, valueEs: d.valueEs });
      if (res.ok) {
        const response = await res.json().catch(() => ({}));
        if (key === "site_favicon") {
          window.dispatchEvent(new CustomEvent("vwb:favicon-change", {
            detail: typeof response.favicon === "string" ? response.favicon : d.value,
          }));
        }
        toast({ title: "Guardado", description: "El cambio ya está reflejado en el sitio." });
        refetch();
      } else {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    } finally {
      setSaving(null);
    }
  };

  const requestSave = (f: { key: string; label: string; bilingual?: boolean }) => {
    const orig = (data && data[f.key]) || { value: "", valueEs: "" };
    const d = draft[f.key] || { value: "", valueEs: "" };
    const changes: Change[] = [];
    if (fmtValue(orig.value) !== fmtValue(d.value))
      changes.push({ label: f.bilingual ? `${f.label} (inglés)` : f.label, before: fmtValue(orig.value), after: fmtValue(d.value) });
    if (f.bilingual && fmtValue(orig.valueEs) !== fmtValue(d.valueEs))
      changes.push({ label: `${f.label} (español)`, before: fmtValue(orig.valueEs), after: fmtValue(d.valueEs) });
    setConfirm({ key: f.key, changes });
  };

  const renderGroup = (group: FieldGroup, i: number) => (
    <Card key={group.title ?? i}>
      {group.title && (
        <CardHeader>
          <CardTitle className="text-base">{group.title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {group.fields.map((f) => {
          const currentValue = draft[f.key]?.value ?? "";
          const switchFallback = f.defaultValue === false ? "false" : "true";
          const invalid = !!f.pattern && !!currentValue && !f.pattern.test(currentValue);
          return (
          <div key={f.key} className="space-y-2">
            <Label className="font-medium">{f.label}</Label>
            {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
            {invalid && <p className="text-xs text-destructive" data-testid={`error-${f.key}`}>{f.patternError || "Formato inválido."}</p>}
            {f.control === "switch" ? (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-3">
                <Switch
                  checked={(draft[f.key]?.value || switchFallback).toLowerCase() !== "false"}
                  onCheckedChange={(checked) => {
                    const next = checked ? "true" : "false";
                    set(f.key, "value", next);
                    set(f.key, "valueEs", next);
                  }}
                  data-testid={`input-${f.key}`}
                />
                <span className="text-sm text-muted-foreground">
                  {(draft[f.key]?.value || switchFallback).toLowerCase() !== "false" ? "Visible en la página" : "Oculta, pero conserva su contenido"}
                </span>
              </div>
            ) : f.control === "number" ? (
              <Input
                type="number"
                min={f.min ?? 0}
                max={f.max}
                step={1}
                value={draft[f.key]?.value ?? ""}
                onChange={(e) => {
                  set(f.key, "value", e.target.value);
                  set(f.key, "valueEs", e.target.value);
                }}
                className="max-w-32"
                data-testid={`input-${f.key}`}
              />
            ) : f.key === "image_engine" ? (
              <select
                value={draft[f.key]?.value ?? "openai"}
                onChange={(e) => set(f.key, "value", e.target.value)}
                data-testid={`input-${f.key}`}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                <option value="openai">OpenAI · DALL-E 3 (principal — usa tu API, ~$0.04/imagen)</option>
                <option value="cloudflare">Cloudflare (gratis — requiere credenciales de Cloudflare)</option>
              </select>
            ) : f.key === "image_aspect" ? (
              <select
                value={draft[f.key]?.value ?? "1:1"}
                onChange={(e) => set(f.key, "value", e.target.value)}
                data-testid={`input-${f.key}`}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
              >
                <option value="1:1">Cuadrada · 1:1 (1024×1024)</option>
                <option value="16:9">Horizontal · 16:9 (1792×1024) — portadas</option>
                <option value="9:16">Vertical · 9:16 (1024×1792) — historias</option>
              </select>
            ) : f.media ? (
              <div className="space-y-1">
                {f.bilingual && <p className="text-xs font-medium text-muted-foreground">Medio en inglés</p>}
                <ImageUpload value={draft[f.key]?.value ?? ""} onChange={(v) => set(f.key, "value", v)} kind={f.media} />
              </div>
            ) : f.multiline && f.key.startsWith("page_") ? (
              <RichTextEditor rows={f.rows ?? 3} value={draft[f.key]?.value ?? ""} onChange={(html) => set(f.key, "value", html)} data-testid={`input-${f.key}`} />
            ) : f.multiline ? (
              <Textarea rows={f.rows ?? 3} value={draft[f.key]?.value ?? ""} onChange={(e) => set(f.key, "value", e.target.value)} data-testid={`input-${f.key}`} />
            ) : (
              <Input value={draft[f.key]?.value ?? ""} onChange={(e) => set(f.key, "value", e.target.value)} placeholder={f.bilingual ? "Texto en inglés" : ""} data-testid={`input-${f.key}`} />
            )}
            {f.bilingual && (
              f.media ? (
                <div className="space-y-1 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Medio en español</p>
                  <ImageUpload value={draft[f.key]?.valueEs ?? ""} onChange={(v) => set(f.key, "valueEs", v)} kind={f.media} />
                </div>
              ) : f.multiline && f.key.startsWith("page_") ? (
                <RichTextEditor rows={f.rows ?? 3} value={draft[f.key]?.valueEs ?? ""} onChange={(html) => set(f.key, "valueEs", html)} placeholder="Texto en español" data-testid={`input-${f.key}-es`} />
              ) : f.multiline ? (
                <Textarea rows={f.rows ?? 3} value={draft[f.key]?.valueEs ?? ""} onChange={(e) => set(f.key, "valueEs", e.target.value)} placeholder="Texto en español" data-testid={`input-${f.key}-es`} />
              ) : (
                <Input value={draft[f.key]?.valueEs ?? ""} onChange={(e) => set(f.key, "valueEs", e.target.value)} placeholder="Texto en español" data-testid={`input-${f.key}-es`} />
              )
            )}
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => requestSave(f)} disabled={saving === f.key || invalid} data-testid={`save-${f.key}`}>
                {saving === f.key ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
              {f.bilingual && (
                <TranslateButton getSource={() => ({ value: draft[f.key]?.valueEs ?? "" })} onApply={(t) => { if (t.value != null) set(f.key, "value", t.value); }} />
              )}
            </div>
          </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const visibleCarouselItems = (items?: CarouselGroup[]) =>
    [...(items || [])]
      .filter((item) => item.published !== false && item.slug !== "german-desk")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const renderCarouselCollection = (
    title: string,
    items: CarouselGroup[] | undefined,
    loading: boolean,
    error: unknown,
    manageHref: string,
  ) => {
    const visibleItems = visibleCarouselItems(items);
    const imageCount = visibleItems.filter((item) => item.imageUrl).length;

    return (
      <section className="space-y-3" aria-label={`Imágenes del carrusel de ${title.toLowerCase()}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium">{title}</h3>
            {!loading && !error && (
              <p className="text-xs text-muted-foreground">
                {imageCount} de {visibleItems.length} tarjetas con imagen
              </p>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={manageHref}>
              Administrar <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando imágenes…
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            No fue posible cargar estas imágenes. Puedes administrarlas desde el botón superior.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibleItems.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-lg border bg-card">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={`Imagen del carrusel de ${item.nameEs || item.name}`}
                    loading="lazy"
                    className="h-24 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center gap-2 bg-muted text-xs text-muted-foreground">
                    <ImageIcon className="h-4 w-4" /> Sin imagen
                  </div>
                )}
                <p className="line-clamp-2 min-h-12 px-3 py-2 text-xs font-medium">
                  {item.nameEs || item.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderCarouselPreview = () => (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base">Imágenes actuales de los carruseles</CardTitle>
        <CardDescription>
          Vista previa de las imágenes publicadas en la portada. Para sustituir una imagen, usa “Administrar” en la sección correspondiente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {renderCarouselCollection(
          "Prácticas",
          practiceCarouselQuery.data,
          practiceCarouselQuery.isLoading,
          practiceCarouselQuery.error,
          "/admin/practice-groups",
        )}
        {renderCarouselCollection(
          "Grupos de práctica por industria",
          industryCarouselQuery.data,
          industryCarouselQuery.isLoading,
          industryCarouselQuery.error,
          "/admin/industry-groups",
        )}
      </CardContent>
    </Card>
  );

  const renderFirmPreview = () => (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="text-base">Previsualizar resumen institucional</CardTitle>
        <CardDescription>
          Revisa la landing pública en ambos idiomas. Los textos, medios y visibilidad guardados se reflejan de inmediato.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href="/acerca-de" target="_blank" rel="noopener noreferrer">
            Ver español <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/about" target="_blank" rel="noopener noreferrer">
            View English <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {section !== "portada" && (
          <Link href="/admin/site-config" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-site-config">
            <ArrowLeft className="h-3.5 w-3.5" /> Configuración
          </Link>
        )}

        <AdminPageHeader title={page.title} description={page.description} icon={page.icon} />

        <AdminPageHelp pageId={section === "seo" ? "seo" : "configuracion"} manualSectionId={section === "seo" ? "seo" : "configuracion"}>
          {section === "seo"
            ? "A diferencia del resto del panel, estos dos campos NO se reflejan al instante: necesitas reiniciar el servidor después de guardarlos para que aparezcan en el sitio."
            : "Los cambios se reflejan en el sitio al instante."}
        </AdminPageHelp>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
        ) : section === "portada" || section === "resumen-firma" ? (
          <Tabs value={homeTab} onValueChange={setHomeTab} className="space-y-5">
            {section === "resumen-firma" && renderFirmPreview()}
            <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto p-1" aria-label={section === "resumen-firma" ? "Secciones del resumen institucional" : "Secciones de la portada"}>
              {page.groups.map((group, i) => (
                <TabsTrigger key={group.title ?? i} value={String(i)} className="shrink-0" data-testid={`tab-home-${i}`}>
                  {(section === "resumen-firma" ? FIRM_TAB_LABELS : HOME_TAB_LABELS)[i] || group.title || `Sección ${i + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>
            {page.groups.map((group, i) => (
              <TabsContent key={group.title ?? i} value={String(i)} className="mt-0">
                {i === 1 && renderCarouselPreview()}
                {renderGroup(group, i)}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          page.groups.map(renderGroup)
        )}
      </main>

      <ConfirmChangesDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        changes={confirm?.changes || []}
        loading={saving === confirm?.key}
        onConfirm={async () => {
          if (confirm) await save(confirm.key);
          setConfirm(null);
        }}
      />
    </div>
  );
}
