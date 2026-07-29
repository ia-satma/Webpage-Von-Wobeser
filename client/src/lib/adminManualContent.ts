import type { LucideIcon } from "lucide-react";
import {
  Newspaper, FileText, Users, Briefcase, Building2, Award,
  Settings, MapPin, Languages, ShieldCheck, Mail, Bot, LineChart,
  Quote, Navigation,
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
    id: "testimonios",
    title: "Testimonios del home",
    icon: Quote,
    whatIsIt: "Las citas de firmas evaluadoras o clientes que rotan en el carrusel superior de la portada.",
    whatFor: "Mantener actualizada la prueba social del sitio en español e inglés.",
    steps: [
      "Entra a \"Testimonios del home\".",
      "Agrega o edita la cita en español e inglés, su fuente y el orden.",
      "Activa \"Destacado en el home\" y \"Publicado\" para mostrarla en el carrusel.",
      "Desactiva \"Publicado\" para retirarla sin borrar sus datos.",
    ],
    relatedHref: "/admin/testimonials",
  },
  {
    id: "configuracion",
    title: "Portada y contenido institucional",
    icon: Settings,
    whatIsIt: "Los textos e imágenes de la portada y de las páginas institucionales, organizados por sección.",
    whatFor: "Actualizar mensajes principales sin tocar código y sin recorrer un formulario interminable.",
    steps: [
      "Entra a \"Portada\" para editar Inicio, Carruseles, Contenido editorial, Newsletter o Noticias desde sus pestañas.",
      "Para Nuestra Firma, Contacto, Carrera, Pie de página u otra sección, usa su acceso directo en el menú lateral.",
      "En \"Pie de página\" puedes mostrar u ocultar Facebook, X/Twitter y LinkedIn de forma independiente sin borrar sus enlaces.",
      "Modifica el texto o sube el nuevo archivo y guarda — el cambio se refleja de inmediato en el sitio público.",
    ],
    relatedHref: "/admin/site-config",
  },
  {
    id: "navegacion",
    title: "Navegación y visibilidad",
    icon: Navigation,
    whatIsIt: "El control de los siete accesos principales del menú público en español e inglés.",
    whatFor: "Cambiar sus etiquetas o retirar temporalmente una opción del encabezado sin borrar contenido ni desactivar su URL.",
    steps: [
      "Entra a \"Navegación y visibilidad\" dentro de Configuración.",
      "Edita las etiquetas en español e inglés o usa el interruptor \"Visible en el menú\".",
      "Revisa las vistas ES/EN, confirma el resumen de cambios y guarda una sola vez.",
      "Inicio, búsqueda e idioma permanecen siempre visibles.",
    ],
    relatedHref: "/admin/navigation",
  },
  {
    id: "newsletter",
    title: "Suscriptores del Newsletter",
    icon: Mail,
    whatIsIt: "Los registros enviados desde el formulario de Newsletter de la portada.",
    whatFor: "Consultar nombre, correo, empresa, idioma, consentimiento y estado; también permite exportar la lista filtrada.",
    steps: [
      "Entra a \"Suscriptores del Newsletter\" dentro de Registros recibidos.",
      "Busca o filtra registros y activa o desactiva una suscripción sin eliminarla.",
      "Usa \"Exportar CSV\" para descargar el resultado del filtro actual.",
      "Los textos del formulario se editan en Portada → Newsletter.",
    ],
    relatedHref: "/admin/newsletter",
  },
  {
    id: "seo",
    title: "SEO — Analytics y verificación",
    icon: LineChart,
    whatIsIt: "La conexión del sitio con Google Analytics (GA4) y Google Search Console — las herramientas de Google para medir visitas y aparecer bien en los resultados de búsqueda.",
    whatFor: "Saber cuánta gente visita el sitio y qué páginas ve (GA4), y confirmarle a Google que el sitio es tuyo para acceder a datos de búsqueda (Search Console).",
    steps: [
      "Entra a \"SEO — Analytics y verificación\".",
      "Pega el Measurement ID de GA4 (formato G-XXXXXXX, lo da Google Analytics al crear la propiedad) y guarda.",
      "Si Google te pidió un código de verificación por meta tag para Search Console, pégalo en el segundo campo y guarda (no hace falta si ya verificaste el dominio por DNS en GoDaddy).",
      "A diferencia del resto del panel, estos dos campos NO se reflejan al instante — pide que se reinicie el servidor para que aparezcan en el sitio público.",
      "Si dejas un campo vacío, no se instala nada — el sitio no manda ningún dato a Google hasta que llenes el ID.",
    ],
    relatedHref: "/admin/site-config/seo",
  },
  {
    id: "oficinas",
    title: "Oficinas",
    icon: MapPin,
    whatIsIt: "El editor completo del micrositio bilingüe de Nuevas oficinas: textos, ubicación, videos, galería, comunicado y SEO.",
    whatFor: "Mantener la experiencia de oficinas actualizada sin alterar la estructura visual del espejo.",
    steps: [
      "Entra a \"Oficinas\" y selecciona la pestaña que quieras editar.",
      "Completa siempre las versiones en español e inglés de los textos.",
      "Usa las vistas previas ES/EN para revisar el resultado y después guarda los cambios.",
      "La galería conserva nueve posiciones; puedes sustituir y reordenar sus imágenes.",
    ],
    relatedHref: "/admin/offices",
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
      "Crea un nuevo usuario; el sistema generará una contraseña segura de 16 caracteres y la mostrará una sola vez.",
      "Comparte la contraseña por un canal seguro. Funcionará directamente y no exigirá cambiarla en el primer acceso.",
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
