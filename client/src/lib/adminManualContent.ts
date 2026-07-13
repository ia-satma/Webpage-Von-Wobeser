import type { LucideIcon } from "lucide-react";
import {
  Newspaper, FileText, Users, FolderOpen, Briefcase, Building2, Calendar, Award,
  Settings, Images, Languages, ShieldCheck, Mail, Bot,
} from "lucide-react";

export interface AdminManualSection {
  id: string;
  title: string;
  icon: LucideIcon;
  whatIsIt: string;
  whatFor: string;
  steps: string[];
  relatedHref: string;
}

export const ADMIN_MANUAL_SECTIONS: AdminManualSection[] = [
  {
    id: "noticias",
    title: "Noticias",
    icon: Newspaper,
    whatIsIt: "El listado de comunicados y noticias del despacho que aparecen en el sitio público.",
    whatFor: "Mantener informados a clientes y visitantes sobre casos, reconocimientos y novedades de la firma.",
    steps: [
      "Entra a \"Noticias\" en el menú lateral.",
      "Haz clic en \"Nueva noticia\" para crear una, o en una existente para editarla.",
      "Escribe el título y el contenido; puedes usar el botón \"Traducir al inglés con IA\" para generar la versión en inglés automáticamente.",
      "Marca \"Destacar en portada\" si quieres que aparezca en el home, y guarda como borrador o publica directamente.",
    ],
    relatedHref: "/admin/news",
  },
  {
    id: "blog",
    title: "Blog / Artículos",
    icon: FileText,
    whatIsIt: "Entradas de blog y artículos de análisis legal, independientes de las noticias.",
    whatFor: "Publicar contenido más extenso de opinión o análisis que posiciona a la firma como experta en su área.",
    steps: [
      "Entra a \"Blog / Artículos\" en el menú lateral.",
      "Crea una nueva entrada o edita una existente.",
      "Asigna una categoría para que aparezca correctamente organizada en el sitio.",
      "Guarda como borrador o publica.",
    ],
    relatedHref: "/admin/posts",
  },
  {
    id: "equipo",
    title: "Abogados y equipo",
    icon: Users,
    whatIsIt: "Las fichas de perfil de socios, abogados y personal que se muestran en el sitio.",
    whatFor: "Mantener actualizada la información de contacto, biografía y especialidades de cada integrante.",
    steps: [
      "Entra a \"Abogados y equipo\".",
      "Haz clic en \"Nuevo abogado\" o selecciona uno existente para editarlo.",
      "Completa nombre, cargo, foto y biografía; marca las áreas de práctica y sectores/industrias que atiende.",
      "Guarda los cambios — el perfil se actualiza de inmediato en el sitio público.",
    ],
    relatedHref: "/admin/team",
  },
  {
    id: "categorias",
    title: "Categorías",
    icon: FolderOpen,
    whatIsIt: "Las etiquetas que organizan las noticias y entradas de blog por tema.",
    whatFor: "Que los visitantes puedan filtrar y encontrar contenido relacionado más fácilmente.",
    steps: [
      "Entra a \"Categorías\".",
      "Crea una nueva categoría con nombre en español (y su traducción al inglés).",
      "Asigna la categoría al crear o editar una noticia o artículo de blog.",
    ],
    relatedHref: "/admin/categories",
  },
  {
    id: "areas-practica",
    title: "Áreas de práctica",
    icon: Briefcase,
    whatIsIt: "Las especialidades legales que ofrece la firma (ej. Fiscal, Corporativo, Laboral).",
    whatFor: "Estructurar el sitio por especialidad y permitir asignar abogados y noticias a cada área.",
    steps: [
      "Entra a \"Áreas de práctica\".",
      "Crea una nueva área o edita una existente (nombre, descripción, imagen).",
      "Asigna abogados a esta área desde su ficha en \"Abogados y equipo\".",
    ],
    relatedHref: "/admin/practice-groups",
  },
  {
    id: "sectores",
    title: "Sectores / Industrias",
    icon: Building2,
    whatIsIt: "Los sectores económicos que atiende la firma (ej. Energía, Salud, Tecnología).",
    whatFor: "Mostrar experiencia por industria además de por área legal, útil para clientes que buscan por su giro.",
    steps: [
      "Entra a \"Sectores / Industrias\".",
      "Crea o edita un sector.",
      "Asigna abogados relevantes desde su ficha de equipo.",
    ],
    relatedHref: "/admin/industry-groups",
  },
  {
    id: "eventos",
    title: "Eventos",
    icon: Calendar,
    whatIsIt: "Conferencias, webinars y presentaciones del despacho.",
    whatFor: "Anunciar y dar seguimiento a la participación de la firma en eventos públicos.",
    steps: [
      "Entra a \"Eventos\".",
      "Crea un nuevo evento con fecha, lugar y descripción.",
      "Publícalo para que aparezca en el sitio.",
    ],
    relatedHref: "/admin/events",
  },
  {
    id: "reconocimientos",
    title: "Reconocimientos",
    icon: Award,
    whatIsIt: "Premios y rankings de la firma (Chambers, Legal 500, etc.).",
    whatFor: "Mostrar prestigio y credibilidad ante clientes potenciales.",
    steps: [
      "Entra a \"Reconocimientos\".",
      "Agrega un nuevo reconocimiento con el nombre del ranking/premio, año y logo si aplica.",
      "Se mostrará automáticamente en la sección correspondiente del sitio.",
    ],
    relatedHref: "/admin/recognitions",
  },
  {
    id: "configuracion",
    title: "Textos, video y logos",
    icon: Settings,
    whatIsIt: "Los textos e imágenes clave de la portada y páginas institucionales del sitio (hero, footer, video de fondo, logos).",
    whatFor: "Actualizar mensajes principales sin tocar código: el eslogan, el video del hero, datos de contacto del footer, etc.",
    steps: [
      "Entra a \"Textos, video y logos\".",
      "Ubica la sección que quieras editar (Portada, Footer, Contacto, Nosotros...).",
      "Modifica el texto o sube el nuevo archivo y guarda — el cambio se refleja de inmediato en el sitio público.",
    ],
    relatedHref: "/admin/site-config",
  },
  {
    id: "galeria",
    title: "Galería de imágenes",
    icon: Images,
    whatIsIt: "El banco de fotos de las oficinas y eventos que se usa en distintas secciones del sitio.",
    whatFor: "Mantener actualizado el material visual institucional sin depender de un desarrollador.",
    steps: [
      "Entra a \"Galería de imágenes\".",
      "Sube nuevas fotos con el botón correspondiente.",
      "Ordénalas arrastrándolas o elimina las que ya no apliquen.",
    ],
    relatedHref: "/admin/gallery",
  },
  {
    id: "traducciones",
    title: "Traducciones",
    icon: Languages,
    whatIsIt: "El panel que muestra qué contenido ya tiene versión en inglés y cuál falta.",
    whatFor: "Asegurar que el sitio en inglés esté al día con el contenido en español.",
    steps: [
      "Entra a \"Traducciones\".",
      "Revisa la lista de contenido pendiente de traducir.",
      "Usa el botón de traducción automática con IA o edita manualmente el texto en inglés.",
    ],
    relatedHref: "/admin/translations",
  },
  {
    id: "usuarios",
    title: "Usuarios y accesos",
    icon: ShieldCheck,
    whatIsIt: "El listado de personas con acceso al panel de administración y sus permisos.",
    whatFor: "Controlar quién puede editar cada área del sitio (solo administradores pueden gestionar esta sección).",
    steps: [
      "Entra a \"Usuarios y accesos\" (requiere rol de administrador).",
      "Crea un nuevo usuario o edita uno existente.",
      "Asigna su rol (Dueño/Admin/Editor/Marketing/Sistemas) según las áreas que debe poder tocar.",
    ],
    relatedHref: "/admin/users",
  },
  {
    id: "solicitudes",
    title: "Solicitudes recibidas",
    icon: Mail,
    whatIsIt: "Los mensajes enviados desde los formularios de contacto y de solicitud de pasantías del sitio.",
    whatFor: "No perder ningún mensaje de un cliente potencial o candidato a pasantía.",
    steps: [
      "Entra a \"Solicitudes recibidas\".",
      "Revisa los mensajes nuevos (se marcan como no leídos).",
      "Da seguimiento por correo o teléfono con los datos de contacto incluidos.",
    ],
    relatedHref: "/admin/submissions",
  },
  {
    id: "agentes-ia",
    title: "Agentes IA",
    icon: Bot,
    whatIsIt: "Los procesos automáticos de inteligencia artificial que ayudan a generar, revisar y difundir contenido.",
    whatFor: "Automatizar tareas repetitivas como redactar publicaciones para redes, boletines o alertas legales.",
    steps: [
      "Entra a \"Agentes IA\" (sección técnica, requiere permiso específico).",
      "Selecciona el agente que quieras ejecutar.",
      "Revisa el resultado generado antes de publicarlo — los agentes proponen borradores, no publican directamente.",
    ],
    relatedHref: "/admin/agents",
  },
];
