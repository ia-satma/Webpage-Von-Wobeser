import { motion } from "framer-motion";
import { 
  Users, 
  GraduationCap, 
  Heart, 
  Scale, 
  Briefcase, 
  Clock, 
  TrendingUp, 
  Award, 
  BookOpen, 
  Building2, 
  MapPin, 
  Mail, 
  ArrowRight, 
  Calendar,
  Target,
  Lightbulb,
  Shield,
  HandHeart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { NumberedCard } from "@/components/editorial";

export default function Careers() {
  const { language } = useLanguage();

  const content = {
    en: {
      heroTitle: "Build Your Career With Us",
      heroSubtitle: "Join one of Mexico's leading law firms and be part of a team that values excellence, integrity, and professional growth.",
      whyJoinTitle: "Why Join Von Wobeser y Sierra",
      whyJoinSubtitle: "Discover what makes us a great place to work",
      cultureTitle: "Our Culture",
      cultureText: "At Von Wobeser y Sierra, we foster a collaborative and inclusive environment where every team member can thrive. With over 70 years of excellence, we combine tradition with innovation to deliver exceptional legal services. Our culture emphasizes teamwork, mutual respect, and a commitment to the highest ethical standards.",
      valuesTitle: "Our Core Values",
      values: [
        { icon: Scale, title: "Excellence", text: "We strive for the highest quality in everything we do" },
        { icon: Heart, title: "Integrity", text: "Ethical conduct guides all our professional relationships" },
        { icon: Users, title: "Collaboration", text: "We work together as a unified team to achieve success" },
        { icon: Lightbulb, title: "Innovation", text: "We embrace new ideas and approaches to solve challenges" },
      ],
      environmentTitle: "Work Environment",
      environmentText: "Our modern offices in Torre SOMA Chapultepec offer a dynamic and inspiring workspace. We believe in work-life balance and provide flexible arrangements to support our team members' well-being. Join a firm where your voice matters and your contributions are recognized.",
      benefitsTitle: "Benefits & Perks",
      benefitsSubtitle: "We take care of our team",
      benefits: [
        { icon: TrendingUp, title: "Competitive Compensation", text: "Market-leading salaries and performance bonuses" },
        { icon: GraduationCap, title: "Professional Development", text: "Continuous learning opportunities and career advancement" },
        { icon: Clock, title: "Work-Life Balance", text: "Flexible schedules and hybrid work options" },
        { icon: Shield, title: "Health Benefits", text: "Comprehensive medical, dental, and vision coverage" },
        { icon: BookOpen, title: "Training Programs", text: "In-house training and external certification support" },
        { icon: HandHeart, title: "Mentorship", text: "Guidance from experienced partners and senior attorneys" },
      ],
      positionsTitle: "Open Positions",
      positionsSubtitle: "Explore current opportunities at our firm",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "We are seeking talented attorneys with 2-5 years of experience in corporate law, M&A, or commercial transactions to join our growing team.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Join our internship program and gain hands-on experience working alongside leading legal professionals in various practice areas.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Support our litigation team with legal research, document preparation, and case management in a fast-paced environment.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Internship Program",
      internshipSubtitle: "Launch your legal career with us",
      internshipOverviewTitle: "Program Overview",
      internshipOverviewText: "Our internship program is designed to provide law students with comprehensive, hands-on experience in one of Mexico's most prestigious law firms. Interns work directly with partners and senior associates on real cases and transactions, gaining invaluable practical knowledge.",
      internshipDurationTitle: "Duration & Requirements",
      internshipDuration: [
        "Program duration: 6-12 months",
        "Law students in their final years or recent graduates",
        "Strong academic record from accredited law schools",
        "Excellent written and verbal communication skills",
        "Proficiency in Spanish and English preferred",
      ],
      internshipLearningTitle: "What You'll Learn",
      internshipLearning: [
        "Legal research and analysis techniques",
        "Document drafting and review",
        "Client communication and relationship management",
        "Courtroom and arbitration procedures",
        "Corporate transactions and due diligence",
        "Professional ethics and best practices",
      ],
      applyTitle: "How to Apply",
      applySubtitle: "Take the first step towards your future with us",
      applyInstructions: "To apply for any position or our internship program, please send your CV, cover letter, and academic transcripts to:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Please include the position title in your email subject line. We review all applications carefully and will contact qualified candidates for interviews.",
      contactCardTitle: "Careers Contact",
      contactCardText: "Have questions about opportunities at Von Wobeser y Sierra?",
      sendApplication: "Send Application",
      viewDetails: "View Details",
      apply: "Apply Now",
    },
    es: {
      heroTitle: "Construye Tu Carrera Con Nosotros",
      heroSubtitle: "Únete a una de las firmas de abogados líderes en México y sé parte de un equipo que valora la excelencia, la integridad y el crecimiento profesional.",
      whyJoinTitle: "Por Qué Trabajar en Von Wobeser y Sierra",
      whyJoinSubtitle: "Descubre lo que nos hace un excelente lugar para trabajar",
      cultureTitle: "Nuestra Cultura",
      cultureText: "En Von Wobeser y Sierra, fomentamos un ambiente colaborativo e inclusivo donde cada miembro del equipo puede prosperar. Con más de 70 años de excelencia, combinamos tradición con innovación para brindar servicios legales excepcionales. Nuestra cultura enfatiza el trabajo en equipo, el respeto mutuo y el compromiso con los más altos estándares éticos.",
      valuesTitle: "Nuestros Valores Fundamentales",
      values: [
        { icon: Scale, title: "Excelencia", text: "Nos esforzamos por la más alta calidad en todo lo que hacemos" },
        { icon: Heart, title: "Integridad", text: "La conducta ética guía todas nuestras relaciones profesionales" },
        { icon: Users, title: "Colaboración", text: "Trabajamos juntos como un equipo unificado para lograr el éxito" },
        { icon: Lightbulb, title: "Innovación", text: "Adoptamos nuevas ideas y enfoques para resolver desafíos" },
      ],
      environmentTitle: "Ambiente de Trabajo",
      environmentText: "Nuestras oficinas modernas en Torre SOMA Chapultepec ofrecen un espacio de trabajo dinámico e inspirador. Creemos en el equilibrio entre vida y trabajo y proporcionamos arreglos flexibles para apoyar el bienestar de nuestro equipo. Únete a una firma donde tu voz importa y tus contribuciones son reconocidas.",
      benefitsTitle: "Beneficios y Prestaciones",
      benefitsSubtitle: "Cuidamos de nuestro equipo",
      benefits: [
        { icon: TrendingUp, title: "Compensación Competitiva", text: "Salarios líderes en el mercado y bonos por desempeño" },
        { icon: GraduationCap, title: "Desarrollo Profesional", text: "Oportunidades continuas de aprendizaje y avance profesional" },
        { icon: Clock, title: "Balance Vida-Trabajo", text: "Horarios flexibles y opciones de trabajo híbrido" },
        { icon: Shield, title: "Beneficios de Salud", text: "Cobertura médica, dental y de visión completa" },
        { icon: BookOpen, title: "Programas de Capacitación", text: "Capacitación interna y apoyo para certificaciones externas" },
        { icon: HandHeart, title: "Mentoría", text: "Guía de socios experimentados y abogados senior" },
      ],
      positionsTitle: "Posiciones Abiertas",
      positionsSubtitle: "Explora las oportunidades actuales en nuestra firma",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "We are seeking talented attorneys with 2-5 years of experience in corporate law, M&A, or commercial transactions to join our growing team.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Join our internship program and gain hands-on experience working alongside leading legal professionals in various practice areas.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Support our litigation team with legal research, document preparation, and case management in a fast-paced environment.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Programa de Pasantías",
      internshipSubtitle: "Inicia tu carrera legal con nosotros",
      internshipOverviewTitle: "Descripción del Programa",
      internshipOverviewText: "Nuestro programa de pasantías está diseñado para proporcionar a los estudiantes de derecho una experiencia práctica integral en una de las firmas de abogados más prestigiosas de México. Los pasantes trabajan directamente con socios y asociados senior en casos y transacciones reales, obteniendo un conocimiento práctico invaluable.",
      internshipDurationTitle: "Duración y Requisitos",
      internshipDuration: [
        "Duración del programa: 6-12 meses",
        "Estudiantes de derecho en sus últimos años o recién graduados",
        "Excelente expediente académico de escuelas de derecho acreditadas",
        "Excelentes habilidades de comunicación escrita y verbal",
        "Dominio del español e inglés preferido",
      ],
      internshipLearningTitle: "Lo Que Aprenderás",
      internshipLearning: [
        "Técnicas de investigación y análisis legal",
        "Redacción y revisión de documentos",
        "Comunicación con clientes y gestión de relaciones",
        "Procedimientos judiciales y de arbitraje",
        "Transacciones corporativas y due diligence",
        "Ética profesional y mejores prácticas",
      ],
      applyTitle: "Cómo Aplicar",
      applySubtitle: "Da el primer paso hacia tu futuro con nosotros",
      applyInstructions: "Para aplicar a cualquier posición o a nuestro programa de pasantías, por favor envía tu CV, carta de presentación y expediente académico a:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Por favor incluye el título del puesto en el asunto de tu correo electrónico. Revisamos todas las aplicaciones cuidadosamente y contactaremos a los candidatos calificados para entrevistas.",
      contactCardTitle: "Contacto de Carreras",
      contactCardText: "¿Tienes preguntas sobre oportunidades en Von Wobeser y Sierra?",
      sendApplication: "Enviar Solicitud",
      viewDetails: "Ver Detalles",
      apply: "Aplicar Ahora",
    },
    de: {
      heroTitle: "Gestalten Sie Ihre Karriere bei uns",
      heroSubtitle: "Werden Sie Teil eines der führenden Anwaltskanzleien Mexikos und gehören Sie zu einem Team, das Exzellenz, Integrität und berufliches Wachstum schätzt.",
      whyJoinTitle: "Warum bei uns arbeiten?",
      whyJoinSubtitle: "Entdecken Sie, was uns zu einem großartigen Arbeitsplatz macht",
      cultureTitle: "Unsere Kultur",
      cultureText: "Bei Von Wobeser y Sierra fördern wir ein kollaboratives und inklusives Umfeld, in dem jedes Teammitglied gedeihen kann. Mit über 70 Jahren Exzellenz verbinden wir Tradition mit Innovation, um außergewöhnliche Rechtsdienstleistungen zu erbringen. Unsere Kultur betont Teamarbeit, gegenseitigen Respekt und das Engagement für höchste ethische Standards.",
      valuesTitle: "Unsere Grundwerte",
      values: [
        { icon: Scale, title: "Exzellenz", text: "Wir streben nach höchster Qualität in allem, was wir tun" },
        { icon: Heart, title: "Integrität", text: "Ethisches Verhalten leitet alle unsere beruflichen Beziehungen" },
        { icon: Users, title: "Zusammenarbeit", text: "Wir arbeiten als vereintes Team zusammen, um Erfolg zu erzielen" },
        { icon: Lightbulb, title: "Innovation", text: "Wir begrüßen neue Ideen und Ansätze zur Lösung von Herausforderungen" },
      ],
      environmentTitle: "Arbeitsumgebung",
      environmentText: "Unsere modernen Büros im Torre SOMA Chapultepec bieten einen dynamischen und inspirierenden Arbeitsplatz. Wir glauben an Work-Life-Balance und bieten flexible Regelungen zur Unterstützung des Wohlbefindens unserer Teammitglieder. Treten Sie einer Kanzlei bei, in der Ihre Stimme zählt und Ihre Beiträge anerkannt werden.",
      benefitsTitle: "Vorteile",
      benefitsSubtitle: "Wir kümmern uns um unser Team",
      benefits: [
        { icon: TrendingUp, title: "Wettbewerbsfähige Vergütung", text: "Marktführende Gehälter und Leistungsprämien" },
        { icon: GraduationCap, title: "Berufliche Entwicklung", text: "Kontinuierliche Lernmöglichkeiten und Karriereförderung" },
        { icon: Clock, title: "Work-Life-Balance", text: "Flexible Arbeitszeiten und hybride Arbeitsoptionen" },
        { icon: Shield, title: "Gesundheitsleistungen", text: "Umfassende medizinische, zahnärztliche und Augenversorgung" },
        { icon: BookOpen, title: "Schulungsprogramme", text: "Interne Schulungen und Unterstützung für externe Zertifizierungen" },
        { icon: HandHeart, title: "Mentoring", text: "Begleitung durch erfahrene Partner und Senior-Anwälte" },
      ],
      positionsTitle: "Offene Stellen",
      positionsSubtitle: "Erkunden Sie aktuelle Möglichkeiten in unserer Kanzlei",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Wir suchen talentierte Anwälte mit 2-5 Jahren Erfahrung im Gesellschaftsrecht, M&A oder Handelsgeschäften für unser wachsendes Team.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Nehmen Sie an unserem Praktikumsprogramm teil und sammeln Sie praktische Erfahrungen an der Seite führender Rechtsexperten in verschiedenen Fachbereichen.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Unterstützen Sie unser Prozessteam bei Rechtsrecherchen, Dokumentenvorbereitung und Fallmanagement in einem dynamischen Umfeld.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Praktikumsprogramm",
      internshipSubtitle: "Starten Sie Ihre juristische Karriere bei uns",
      internshipOverviewTitle: "Programmübersicht",
      internshipOverviewText: "Unser Praktikumsprogramm bietet Jurastudenten umfassende praktische Erfahrungen in einer der renommiertesten Anwaltskanzleien Mexikos. Praktikanten arbeiten direkt mit Partnern und Senior Associates an echten Fällen und Transaktionen und gewinnen unschätzbare praktische Kenntnisse.",
      internshipDurationTitle: "Dauer & Anforderungen",
      internshipDuration: [
        "Programmdauer: 6-12 Monate",
        "Jurastudenten in den letzten Studienjahren oder Absolventen",
        "Ausgezeichnete akademische Leistungen von akkreditierten Rechtsfakultäten",
        "Hervorragende schriftliche und mündliche Kommunikationsfähigkeiten",
        "Spanisch- und Englischkenntnisse bevorzugt",
      ],
      internshipLearningTitle: "Was Sie lernen werden",
      internshipLearning: [
        "Rechtsrecherche- und Analysetechniken",
        "Dokumentenerstellung und -prüfung",
        "Kundenkommunikation und Beziehungsmanagement",
        "Gerichts- und Schiedsverfahren",
        "Unternehmenstransaktionen und Due Diligence",
        "Berufsethik und Best Practices",
      ],
      applyTitle: "So bewerben Sie sich",
      applySubtitle: "Machen Sie den ersten Schritt in Ihre Zukunft bei uns",
      applyInstructions: "Um sich für eine Position oder unser Praktikumsprogramm zu bewerben, senden Sie bitte Ihren Lebenslauf, Ihr Anschreiben und Ihre akademischen Zeugnisse an:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Bitte geben Sie den Stellentitel in der Betreffzeile Ihrer E-Mail an. Wir prüfen alle Bewerbungen sorgfältig und kontaktieren qualifizierte Kandidaten für Vorstellungsgespräche.",
      contactCardTitle: "Karriere-Kontakt",
      contactCardText: "Haben Sie Fragen zu Möglichkeiten bei Von Wobeser y Sierra?",
      sendApplication: "Bewerbung senden",
      viewDetails: "Details anzeigen",
      apply: "Jetzt bewerben",
    },
    zh: {
      heroTitle: "与我们共创事业",
      heroSubtitle: "加入墨西哥领先的律师事务所之一，成为重视卓越、诚信和职业发展的团队的一员。",
      whyJoinTitle: "为什么加入我们?",
      whyJoinSubtitle: "了解是什么让我们成为一个理想的工作场所",
      cultureTitle: "我们的文化",
      cultureText: "在Von Wobeser y Sierra，我们营造一个协作和包容的环境，让每位团队成员都能茁壮成长。凭借70多年的卓越历史，我们将传统与创新相结合，提供卓越的法律服务。我们的文化强调团队合作、相互尊重和对最高道德标准的承诺。",
      valuesTitle: "我们的核心价值观",
      values: [
        { icon: Scale, title: "卓越", text: "我们在所做的一切中追求最高质量" },
        { icon: Heart, title: "诚信", text: "道德行为指导我们所有的职业关系" },
        { icon: Users, title: "协作", text: "我们作为一个统一的团队共同努力取得成功" },
        { icon: Lightbulb, title: "创新", text: "我们拥抱新思想和新方法来解决挑战" },
      ],
      environmentTitle: "工作环境",
      environmentText: "我们位于Torre SOMA Chapultepec的现代化办公室提供充满活力和灵感的工作空间。我们相信工作与生活的平衡，并提供灵活的安排来支持团队成员的福祉。加入一家您的声音很重要、您的贡献得到认可的公司。",
      benefitsTitle: "福利待遇",
      benefitsSubtitle: "我们关心我们的团队",
      benefits: [
        { icon: TrendingUp, title: "有竞争力的薪酬", text: "市场领先的薪资和绩效奖金" },
        { icon: GraduationCap, title: "职业发展", text: "持续的学习机会和职业晋升" },
        { icon: Clock, title: "工作生活平衡", text: "灵活的工作时间和混合工作选择" },
        { icon: Shield, title: "健康福利", text: "全面的医疗、牙科和视力保险" },
        { icon: BookOpen, title: "培训项目", text: "内部培训和外部认证支持" },
        { icon: HandHeart, title: "导师制", text: "经验丰富的合伙人和高级律师的指导" },
      ],
      positionsTitle: "开放职位",
      positionsSubtitle: "探索我们公司目前的机会",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "我们正在寻找在公司法、并购或商业交易方面拥有2-5年经验的优秀律师加入我们不断壮大的团队。",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "加入我们的实习项目，与各执业领域的顶级法律专业人士一起工作，获得实践经验。",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "在快节奏的环境中支持我们的诉讼团队进行法律研究、文件准备和案件管理。",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "实习项目",
      internshipSubtitle: "与我们一起开启您的法律职业生涯",
      internshipOverviewTitle: "项目概述",
      internshipOverviewText: "我们的实习项目旨在为法学院学生提供在墨西哥最负盛名的律师事务所之一获得全面实践经验的机会。实习生直接与合伙人和高级律师合作处理真实案件和交易，获得宝贵的实践知识。",
      internshipDurationTitle: "期限和要求",
      internshipDuration: [
        "项目期限：6-12个月",
        "法学院最后几年的学生或应届毕业生",
        "来自认可法学院的优秀学术成绩",
        "出色的书面和口头沟通能力",
        "精通西班牙语和英语者优先",
      ],
      internshipLearningTitle: "您将学到什么",
      internshipLearning: [
        "法律研究和分析技术",
        "文件起草和审查",
        "客户沟通和关系管理",
        "法庭和仲裁程序",
        "公司交易和尽职调查",
        "职业道德和最佳实践",
      ],
      applyTitle: "如何申请",
      applySubtitle: "迈出与我们共创未来的第一步",
      applyInstructions: "如需申请任何职位或我们的实习项目，请将您的简历、求职信和成绩单发送至：",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "请在电子邮件主题行中注明职位名称。我们会仔细审核所有申请，并联系符合条件的候选人进行面试。",
      contactCardTitle: "招聘联系人",
      contactCardText: "对Von Wobeser y Sierra的机会有疑问吗？",
      sendApplication: "发送申请",
      viewDetails: "查看详情",
      apply: "立即申请",
    },
    ko: {
      heroTitle: "우리와 함께 경력을 쌓으세요",
      heroSubtitle: "멕시코 최고의 로펌 중 하나에 합류하여 탁월함, 정직성 및 전문적 성장을 중시하는 팀의 일원이 되세요.",
      whyJoinTitle: "왜 우리와 함께해야 할까요?",
      whyJoinSubtitle: "우리가 훌륭한 직장인 이유를 알아보세요",
      cultureTitle: "우리의 문화",
      cultureText: "Von Wobeser y Sierra에서는 모든 팀원이 성장할 수 있는 협력적이고 포용적인 환경을 조성합니다. 70년 이상의 우수성을 바탕으로 전통과 혁신을 결합하여 탁월한 법률 서비스를 제공합니다. 우리의 문화는 팀워크, 상호 존중, 최고의 윤리적 기준에 대한 헌신을 강조합니다.",
      valuesTitle: "핵심 가치",
      values: [
        { icon: Scale, title: "탁월함", text: "우리는 모든 일에서 최고의 품질을 추구합니다" },
        { icon: Heart, title: "정직성", text: "윤리적 행동이 모든 전문적 관계를 이끕니다" },
        { icon: Users, title: "협력", text: "우리는 성공을 위해 하나의 팀으로 함께 일합니다" },
        { icon: Lightbulb, title: "혁신", text: "우리는 도전을 해결하기 위한 새로운 아이디어와 접근 방식을 수용합니다" },
      ],
      environmentTitle: "근무 환경",
      environmentText: "Torre SOMA Chapultepec에 위치한 우리의 현대적인 사무실은 역동적이고 영감을 주는 작업 공간을 제공합니다. 우리는 일과 삶의 균형을 믿으며 팀원들의 웰빙을 지원하기 위한 유연한 근무 방식을 제공합니다. 여러분의 목소리가 중요하고 기여가 인정받는 회사에 합류하세요.",
      benefitsTitle: "복리후생",
      benefitsSubtitle: "우리는 팀을 소중히 여깁니다",
      benefits: [
        { icon: TrendingUp, title: "경쟁력 있는 보상", text: "업계 최고 수준의 급여와 성과 보너스" },
        { icon: GraduationCap, title: "전문성 개발", text: "지속적인 학습 기회와 경력 발전" },
        { icon: Clock, title: "워라밸", text: "유연한 일정과 하이브리드 근무 옵션" },
        { icon: Shield, title: "건강 혜택", text: "종합적인 의료, 치과 및 안과 보험" },
        { icon: BookOpen, title: "교육 프로그램", text: "사내 교육 및 외부 자격증 지원" },
        { icon: HandHeart, title: "멘토링", text: "경험 많은 파트너와 선임 변호사의 지도" },
      ],
      positionsTitle: "채용 공고",
      positionsSubtitle: "우리 회사의 현재 기회를 살펴보세요",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "기업법, M&A 또는 상업 거래 분야에서 2-5년 경력을 가진 유능한 변호사를 찾고 있습니다.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "인턴십 프로그램에 참여하여 다양한 실무 분야에서 최고의 법률 전문가들과 함께 실무 경험을 쌓으세요.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "빠르게 변화하는 환경에서 법률 연구, 문서 준비 및 사건 관리로 소송 팀을 지원합니다.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "인턴십 프로그램",
      internshipSubtitle: "우리와 함께 법률 경력을 시작하세요",
      internshipOverviewTitle: "프로그램 개요",
      internshipOverviewText: "우리의 인턴십 프로그램은 법학도들에게 멕시코에서 가장 권위 있는 로펌 중 하나에서 포괄적인 실무 경험을 제공하도록 설계되었습니다. 인턴들은 파트너 및 시니어 어소시에이트와 직접 협력하여 실제 사건과 거래를 처리하며 귀중한 실무 지식을 얻습니다.",
      internshipDurationTitle: "기간 및 요구사항",
      internshipDuration: [
        "프로그램 기간: 6-12개월",
        "법학과 마지막 학년 학생 또는 최근 졸업생",
        "인가된 로스쿨의 우수한 학업 성적",
        "뛰어난 서면 및 구두 의사소통 능력",
        "스페인어와 영어 능숙자 우대",
      ],
      internshipLearningTitle: "배우게 될 것들",
      internshipLearning: [
        "법률 연구 및 분석 기술",
        "문서 작성 및 검토",
        "고객 커뮤니케이션 및 관계 관리",
        "법정 및 중재 절차",
        "기업 거래 및 실사",
        "직업 윤리 및 모범 사례",
      ],
      applyTitle: "지원 방법",
      applySubtitle: "우리와 함께하는 미래를 향한 첫 걸음을 내딛으세요",
      applyInstructions: "모든 직위 또는 인턴십 프로그램에 지원하려면 이력서, 자기소개서 및 성적증명서를 다음 주소로 보내주세요:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "이메일 제목에 직위명을 포함해 주세요. 모든 지원서를 신중하게 검토하고 자격을 갖춘 후보자에게 면접을 위해 연락드리겠습니다.",
      contactCardTitle: "채용 문의",
      contactCardText: "Von Wobeser y Sierra의 기회에 대해 궁금한 점이 있으신가요?",
      sendApplication: "지원서 보내기",
      viewDetails: "상세 보기",
      apply: "지금 지원하기",
    },
    ja: {
      heroTitle: "私たちと一緒にキャリアを築きましょう",
      heroSubtitle: "メキシコを代表する法律事務所の一つに参加し、卓越性、誠実さ、そしてプロフェッショナルな成長を重視するチームの一員になりませんか。",
      whyJoinTitle: "なぜ私たちと働くべきか",
      whyJoinSubtitle: "私たちが素晴らしい職場である理由をご覧ください",
      cultureTitle: "私たちの文化",
      cultureText: "Von Wobeser y Sierraでは、すべてのチームメンバーが成長できる協力的で包括的な環境を育んでいます。70年以上の卓越した実績を持ち、伝統と革新を組み合わせて卓越した法律サービスを提供しています。私たちの文化は、チームワーク、相互尊重、そして最高の倫理基準へのコミットメントを強調しています。",
      valuesTitle: "コアバリュー",
      values: [
        { icon: Scale, title: "卓越性", text: "私たちは行うすべてのことにおいて最高の品質を追求します" },
        { icon: Heart, title: "誠実さ", text: "倫理的な行動がすべての専門的な関係を導きます" },
        { icon: Users, title: "協力", text: "私たちは統一されたチームとして成功を達成するために協力します" },
        { icon: Lightbulb, title: "革新", text: "私たちは課題を解決するための新しいアイデアとアプローチを受け入れます" },
      ],
      environmentTitle: "職場環境",
      environmentText: "Torre SOMA Chapultepecにある私たちの近代的なオフィスは、ダイナミックでインスピレーションを与える職場を提供しています。私たちはワークライフバランスを信じており、チームメンバーの健康をサポートするための柔軟な勤務形態を提供しています。あなたの声が大切にされ、貢献が認められる事務所に参加してください。",
      benefitsTitle: "福利厚生",
      benefitsSubtitle: "私たちはチームを大切にします",
      benefits: [
        { icon: TrendingUp, title: "競争力のある報酬", text: "業界トップレベルの給与とパフォーマンスボーナス" },
        { icon: GraduationCap, title: "キャリア開発", text: "継続的な学習機会とキャリアアップ" },
        { icon: Clock, title: "ワークライフバランス", text: "柔軟なスケジュールとハイブリッドワークオプション" },
        { icon: Shield, title: "健康保険", text: "包括的な医療、歯科、眼科保険" },
        { icon: BookOpen, title: "研修プログラム", text: "社内研修と外部資格取得支援" },
        { icon: HandHeart, title: "メンターシップ", text: "経験豊富なパートナーとシニア弁護士による指導" },
      ],
      positionsTitle: "募集職種",
      positionsSubtitle: "当事務所の現在の求人をご覧ください",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "企業法、M&A、または商取引において2〜5年の経験を持つ優秀な弁護士を募集しています。",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "インターンシッププログラムに参加し、様々な実務分野で一流の法律専門家と共に実践的な経験を積んでください。",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "ダイナミックな環境で法的調査、文書作成、ケース管理を通じて訴訟チームをサポートしてください。",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "インターンシッププログラム",
      internshipSubtitle: "私たちと一緒に法律キャリアをスタート",
      internshipOverviewTitle: "プログラム概要",
      internshipOverviewText: "当インターンシッププログラムは、メキシコで最も権威のある法律事務所の一つで、法学生に包括的な実践経験を提供するよう設計されています。インターンはパートナーやシニアアソシエイトと直接協力して実際の案件や取引に携わり、貴重な実践的知識を得ることができます。",
      internshipDurationTitle: "期間と要件",
      internshipDuration: [
        "プログラム期間：6〜12ヶ月",
        "法学部最終学年の学生または新卒者",
        "認定ロースクールの優秀な学業成績",
        "優れた文書および口頭コミュニケーション能力",
        "スペイン語と英語の能力があれば尚可",
      ],
      internshipLearningTitle: "学べること",
      internshipLearning: [
        "法的調査と分析技術",
        "文書作成とレビュー",
        "クライアントコミュニケーションと関係管理",
        "法廷および仲裁手続き",
        "企業取引とデューデリジェンス",
        "職業倫理とベストプラクティス",
      ],
      applyTitle: "応募方法",
      applySubtitle: "私たちと共に歩む未来への第一歩を踏み出しましょう",
      applyInstructions: "いずれかの職種またはインターンシッププログラムに応募するには、履歴書、カバーレター、成績証明書を以下のメールアドレスにお送りください：",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "メールの件名に職種名を記載してください。すべての応募書類を慎重に審査し、資格のある候補者には面接のご連絡をいたします。",
      contactCardTitle: "採用担当連絡先",
      contactCardText: "Von Wobeser y Sierraでの機会についてご質問がありますか？",
      sendApplication: "応募書類を送信",
      viewDetails: "詳細を見る",
      apply: "今すぐ応募",
    },
    ar: {
      heroTitle: "ابنِ مسيرتك المهنية معنا",
      heroSubtitle: "انضم إلى واحدة من أبرز شركات المحاماة في المكسيك وكن جزءًا من فريق يقدر التميز والنزاهة والنمو المهني.",
      whyJoinTitle: "لماذا تعمل معنا؟",
      whyJoinSubtitle: "اكتشف ما يجعلنا مكان عمل رائع",
      cultureTitle: "ثقافتنا",
      cultureText: "في Von Wobeser y Sierra، نعزز بيئة تعاونية وشاملة حيث يمكن لكل عضو في الفريق أن يزدهر. مع أكثر من 70 عامًا من التميز، نجمع بين التقاليد والابتكار لتقديم خدمات قانونية استثنائية. تؤكد ثقافتنا على العمل الجماعي والاحترام المتبادل والالتزام بأعلى المعايير الأخلاقية.",
      valuesTitle: "قيمنا الأساسية",
      values: [
        { icon: Scale, title: "التميز", text: "نسعى لتحقيق أعلى جودة في كل ما نقوم به" },
        { icon: Heart, title: "النزاهة", text: "السلوك الأخلاقي يوجه جميع علاقاتنا المهنية" },
        { icon: Users, title: "التعاون", text: "نعمل معًا كفريق موحد لتحقيق النجاح" },
        { icon: Lightbulb, title: "الابتكار", text: "نتبنى أفكارًا ومناهج جديدة لحل التحديات" },
      ],
      environmentTitle: "بيئة العمل",
      environmentText: "توفر مكاتبنا الحديثة في Torre SOMA Chapultepec مساحة عمل ديناميكية وملهمة. نؤمن بالتوازن بين العمل والحياة ونوفر ترتيبات مرنة لدعم رفاهية أعضاء فريقنا. انضم إلى شركة حيث صوتك مهم ومساهماتك معترف بها.",
      benefitsTitle: "المزايا والمكافآت",
      benefitsSubtitle: "نحن نهتم بفريقنا",
      benefits: [
        { icon: TrendingUp, title: "تعويضات تنافسية", text: "رواتب رائدة في السوق ومكافآت أداء" },
        { icon: GraduationCap, title: "التطوير المهني", text: "فرص تعلم مستمرة وتقدم وظيفي" },
        { icon: Clock, title: "التوازن بين العمل والحياة", text: "جداول مرنة وخيارات عمل هجينة" },
        { icon: Shield, title: "المزايا الصحية", text: "تغطية طبية وأسنان ورؤية شاملة" },
        { icon: BookOpen, title: "برامج التدريب", text: "تدريب داخلي ودعم للشهادات الخارجية" },
        { icon: HandHeart, title: "الإرشاد", text: "توجيه من شركاء ومحامين كبار ذوي خبرة" },
      ],
      positionsTitle: "الوظائف المتاحة",
      positionsSubtitle: "استكشف الفرص الحالية في شركتنا",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "نبحث عن محامين موهوبين لديهم 2-5 سنوات من الخبرة في قانون الشركات أو الاندماج والاستحواذ أو المعاملات التجارية للانضمام إلى فريقنا المتنامي.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "انضم إلى برنامج التدريب لدينا واكتسب خبرة عملية في العمل جنبًا إلى جنب مع كبار المحترفين القانونيين في مختلف مجالات الممارسة.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "دعم فريق التقاضي لدينا في البحث القانوني وإعداد المستندات وإدارة القضايا في بيئة سريعة الإيقاع.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "برنامج التدريب",
      internshipSubtitle: "ابدأ مسيرتك القانونية معنا",
      internshipOverviewTitle: "نظرة عامة على البرنامج",
      internshipOverviewText: "تم تصميم برنامج التدريب لدينا لتزويد طلاب القانون بخبرة عملية شاملة في واحدة من أرقى شركات المحاماة في المكسيك. يعمل المتدربون مباشرة مع الشركاء والمحامين الكبار على قضايا ومعاملات حقيقية، ويكتسبون معرفة عملية لا تقدر بثمن.",
      internshipDurationTitle: "المدة والمتطلبات",
      internshipDuration: [
        "مدة البرنامج: 6-12 شهرًا",
        "طلاب القانون في سنواتهم الأخيرة أو الخريجون الجدد",
        "سجل أكاديمي قوي من كليات القانون المعتمدة",
        "مهارات اتصال كتابية وشفوية ممتازة",
        "يفضل إجادة الإسبانية والإنجليزية",
      ],
      internshipLearningTitle: "ما ستتعلمه",
      internshipLearning: [
        "تقنيات البحث والتحليل القانوني",
        "صياغة ومراجعة المستندات",
        "التواصل مع العملاء وإدارة العلاقات",
        "إجراءات المحكمة والتحكيم",
        "معاملات الشركات والفحص النافي للجهالة",
        "الأخلاقيات المهنية وأفضل الممارسات",
      ],
      applyTitle: "كيفية التقديم",
      applySubtitle: "اتخذ الخطوة الأولى نحو مستقبلك معنا",
      applyInstructions: "للتقدم لأي وظيفة أو برنامج التدريب لدينا، يرجى إرسال سيرتك الذاتية ورسالة التغطية والنصوص الأكاديمية إلى:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "يرجى تضمين عنوان الوظيفة في سطر موضوع بريدك الإلكتروني. نراجع جميع الطلبات بعناية وسنتواصل مع المرشحين المؤهلين للمقابلات.",
      contactCardTitle: "جهة اتصال التوظيف",
      contactCardText: "هل لديك أسئلة حول الفرص في Von Wobeser y Sierra؟",
      sendApplication: "إرسال الطلب",
      viewDetails: "عرض التفاصيل",
      apply: "قدم الآن",
    },
    ru: {
      heroTitle: "Постройте свою карьеру вместе с нами",
      heroSubtitle: "Присоединяйтесь к одной из ведущих юридических фирм Мексики и станьте частью команды, которая ценит совершенство, честность и профессиональный рост.",
      whyJoinTitle: "Почему стоит работать у нас?",
      whyJoinSubtitle: "Узнайте, что делает нас отличным местом для работы",
      cultureTitle: "Наша культура",
      cultureText: "В Von Wobeser y Sierra мы создаём совместную и инклюзивную среду, где каждый член команды может развиваться. С более чем 70-летней историей превосходства мы сочетаем традиции с инновациями для предоставления исключительных юридических услуг. Наша культура подчёркивает командную работу, взаимное уважение и приверженность высочайшим этическим стандартам.",
      valuesTitle: "Наши основные ценности",
      values: [
        { icon: Scale, title: "Совершенство", text: "Мы стремимся к высочайшему качеству во всём, что делаем" },
        { icon: Heart, title: "Честность", text: "Этичное поведение направляет все наши профессиональные отношения" },
        { icon: Users, title: "Сотрудничество", text: "Мы работаем вместе как единая команда для достижения успеха" },
        { icon: Lightbulb, title: "Инновации", text: "Мы принимаем новые идеи и подходы для решения задач" },
      ],
      environmentTitle: "Рабочая среда",
      environmentText: "Наши современные офисы в Torre SOMA Chapultepec предлагают динамичное и вдохновляющее рабочее пространство. Мы верим в баланс между работой и личной жизнью и предоставляем гибкие условия для поддержки благополучия членов нашей команды. Присоединяйтесь к фирме, где ваш голос имеет значение, а ваш вклад признаётся.",
      benefitsTitle: "Преимущества и льготы",
      benefitsSubtitle: "Мы заботимся о нашей команде",
      benefits: [
        { icon: TrendingUp, title: "Конкурентная компенсация", text: "Лидирующие на рынке зарплаты и премии за результаты" },
        { icon: GraduationCap, title: "Профессиональное развитие", text: "Постоянные возможности обучения и карьерного роста" },
        { icon: Clock, title: "Баланс работы и жизни", text: "Гибкий график и варианты гибридной работы" },
        { icon: Shield, title: "Медицинское страхование", text: "Комплексное медицинское, стоматологическое и офтальмологическое покрытие" },
        { icon: BookOpen, title: "Программы обучения", text: "Внутреннее обучение и поддержка внешней сертификации" },
        { icon: HandHeart, title: "Наставничество", text: "Руководство от опытных партнёров и старших юристов" },
      ],
      positionsTitle: "Открытые вакансии",
      positionsSubtitle: "Изучите текущие возможности в нашей фирме",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Мы ищем талантливых юристов с 2-5 годами опыта в корпоративном праве, M&A или коммерческих сделках для присоединения к нашей растущей команде.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Присоединяйтесь к нашей программе стажировки и получите практический опыт работы с ведущими юридическими специалистами в различных областях практики.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Поддерживайте нашу команду судебных разбирательств в юридических исследованиях, подготовке документов и управлении делами в динамичной среде.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Программа стажировки",
      internshipSubtitle: "Начните свою юридическую карьеру с нами",
      internshipOverviewTitle: "Обзор программы",
      internshipOverviewText: "Наша программа стажировки разработана для предоставления студентам-юристам комплексного практического опыта в одной из самых престижных юридических фирм Мексики. Стажёры работают непосредственно с партнёрами и старшими сотрудниками над реальными делами и сделками, получая бесценные практические знания.",
      internshipDurationTitle: "Продолжительность и требования",
      internshipDuration: [
        "Продолжительность программы: 6-12 месяцев",
        "Студенты юридических факультетов последних курсов или недавние выпускники",
        "Отличная академическая успеваемость в аккредитованных юридических школах",
        "Отличные письменные и устные коммуникативные навыки",
        "Владение испанским и английским языками приветствуется",
      ],
      internshipLearningTitle: "Чему вы научитесь",
      internshipLearning: [
        "Техники юридических исследований и анализа",
        "Составление и проверка документов",
        "Общение с клиентами и управление отношениями",
        "Судебные и арбитражные процедуры",
        "Корпоративные сделки и due diligence",
        "Профессиональная этика и лучшие практики",
      ],
      applyTitle: "Как подать заявку",
      applySubtitle: "Сделайте первый шаг к своему будущему с нами",
      applyInstructions: "Чтобы подать заявку на любую должность или нашу программу стажировки, пожалуйста, отправьте ваше резюме, сопроводительное письмо и академические справки на:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Пожалуйста, укажите название должности в теме письма. Мы внимательно рассматриваем все заявки и свяжемся с квалифицированными кандидатами для собеседования.",
      contactCardTitle: "Контакт отдела кадров",
      contactCardText: "Есть вопросы о возможностях в Von Wobeser y Sierra?",
      sendApplication: "Отправить заявку",
      viewDetails: "Подробнее",
      apply: "Подать заявку",
    },
    fr: {
      heroTitle: "Construisez votre carrière avec nous",
      heroSubtitle: "Rejoignez l'un des principaux cabinets d'avocats du Mexique et faites partie d'une équipe qui valorise l'excellence, l'intégrité et le développement professionnel.",
      whyJoinTitle: "Pourquoi nous rejoindre?",
      whyJoinSubtitle: "Découvrez ce qui fait de nous un excellent lieu de travail",
      cultureTitle: "Notre Culture",
      cultureText: "Chez Von Wobeser y Sierra, nous favorisons un environnement collaboratif et inclusif où chaque membre de l'équipe peut s'épanouir. Avec plus de 70 ans d'excellence, nous combinons tradition et innovation pour fournir des services juridiques exceptionnels. Notre culture met l'accent sur le travail d'équipe, le respect mutuel et l'engagement envers les normes éthiques les plus élevées.",
      valuesTitle: "Nos Valeurs Fondamentales",
      values: [
        { icon: Scale, title: "Excellence", text: "Nous visons la plus haute qualité dans tout ce que nous faisons" },
        { icon: Heart, title: "Intégrité", text: "Une conduite éthique guide toutes nos relations professionnelles" },
        { icon: Users, title: "Collaboration", text: "Nous travaillons ensemble en équipe unie pour réussir" },
        { icon: Lightbulb, title: "Innovation", text: "Nous adoptons de nouvelles idées et approches pour résoudre les défis" },
      ],
      environmentTitle: "Environnement de Travail",
      environmentText: "Nos bureaux modernes dans la Torre SOMA Chapultepec offrent un espace de travail dynamique et inspirant. Nous croyons à l'équilibre travail-vie personnelle et proposons des arrangements flexibles pour soutenir le bien-être de nos collaborateurs. Rejoignez un cabinet où votre voix compte et vos contributions sont reconnues.",
      benefitsTitle: "Avantages",
      benefitsSubtitle: "Nous prenons soin de notre équipe",
      benefits: [
        { icon: TrendingUp, title: "Rémunération Compétitive", text: "Salaires leaders du marché et primes de performance" },
        { icon: GraduationCap, title: "Développement Professionnel", text: "Opportunités d'apprentissage continu et avancement de carrière" },
        { icon: Clock, title: "Équilibre Vie-Travail", text: "Horaires flexibles et options de travail hybride" },
        { icon: Shield, title: "Avantages Santé", text: "Couverture médicale, dentaire et optique complète" },
        { icon: BookOpen, title: "Programmes de Formation", text: "Formation interne et soutien aux certifications externes" },
        { icon: HandHeart, title: "Mentorat", text: "Accompagnement par des associés expérimentés et des avocats seniors" },
      ],
      positionsTitle: "Postes Ouverts",
      positionsSubtitle: "Explorez les opportunités actuelles dans notre cabinet",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Nous recherchons des avocats talentueux avec 2-5 ans d'expérience en droit des sociétés, fusions-acquisitions ou transactions commerciales pour rejoindre notre équipe en croissance.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Rejoignez notre programme de stage et acquérez une expérience pratique en travaillant aux côtés de professionnels juridiques de premier plan dans divers domaines de pratique.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Soutenez notre équipe contentieuse dans la recherche juridique, la préparation de documents et la gestion des dossiers dans un environnement dynamique.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Programme de Stage",
      internshipSubtitle: "Lancez votre carrière juridique avec nous",
      internshipOverviewTitle: "Aperçu du Programme",
      internshipOverviewText: "Notre programme de stage est conçu pour offrir aux étudiants en droit une expérience pratique complète dans l'un des cabinets d'avocats les plus prestigieux du Mexique. Les stagiaires travaillent directement avec les associés et collaborateurs seniors sur des affaires et transactions réelles, acquérant des connaissances pratiques inestimables.",
      internshipDurationTitle: "Durée et Exigences",
      internshipDuration: [
        "Durée du programme : 6-12 mois",
        "Étudiants en droit en dernières années ou jeunes diplômés",
        "Excellent dossier académique des facultés de droit accréditées",
        "Excellentes compétences en communication écrite et orale",
        "Maîtrise de l'espagnol et de l'anglais souhaitée",
      ],
      internshipLearningTitle: "Ce que vous apprendrez",
      internshipLearning: [
        "Techniques de recherche et d'analyse juridique",
        "Rédaction et révision de documents",
        "Communication client et gestion des relations",
        "Procédures judiciaires et d'arbitrage",
        "Transactions d'entreprise et due diligence",
        "Éthique professionnelle et meilleures pratiques",
      ],
      applyTitle: "Comment Postuler",
      applySubtitle: "Faites le premier pas vers votre avenir avec nous",
      applyInstructions: "Pour postuler à tout poste ou à notre programme de stage, veuillez envoyer votre CV, lettre de motivation et relevés de notes à :",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Veuillez inclure le titre du poste dans l'objet de votre email. Nous examinons attentivement toutes les candidatures et contacterons les candidats qualifiés pour des entretiens.",
      contactCardTitle: "Contact Carrières",
      contactCardText: "Des questions sur les opportunités chez Von Wobeser y Sierra ?",
      sendApplication: "Envoyer la Candidature",
      viewDetails: "Voir les Détails",
      apply: "Postuler Maintenant",
    },
    it: {
      heroTitle: "Costruisci la tua carriera con noi",
      heroSubtitle: "Unisciti a uno dei principali studi legali del Messico e fai parte di un team che valorizza l'eccellenza, l'integrità e la crescita professionale.",
      whyJoinTitle: "Perché lavorare con noi?",
      whyJoinSubtitle: "Scopri cosa ci rende un ottimo posto di lavoro",
      cultureTitle: "La Nostra Cultura",
      cultureText: "In Von Wobeser y Sierra, promuoviamo un ambiente collaborativo e inclusivo in cui ogni membro del team può prosperare. Con oltre 70 anni di eccellenza, combiniamo tradizione e innovazione per fornire servizi legali eccezionali. La nostra cultura enfatizza il lavoro di squadra, il rispetto reciproco e l'impegno verso i più alti standard etici.",
      valuesTitle: "I Nostri Valori Fondamentali",
      values: [
        { icon: Scale, title: "Eccellenza", text: "Puntiamo alla massima qualità in tutto ciò che facciamo" },
        { icon: Heart, title: "Integrità", text: "Una condotta etica guida tutte le nostre relazioni professionali" },
        { icon: Users, title: "Collaborazione", text: "Lavoriamo insieme come un team unito per raggiungere il successo" },
        { icon: Lightbulb, title: "Innovazione", text: "Accogliamo nuove idee e approcci per risolvere le sfide" },
      ],
      environmentTitle: "Ambiente di Lavoro",
      environmentText: "I nostri moderni uffici nella Torre SOMA Chapultepec offrono uno spazio di lavoro dinamico e stimolante. Crediamo nell'equilibrio tra lavoro e vita privata e offriamo accordi flessibili per supportare il benessere dei membri del nostro team. Unisciti a uno studio dove la tua voce conta e i tuoi contributi sono riconosciuti.",
      benefitsTitle: "Benefit e Vantaggi",
      benefitsSubtitle: "Ci prendiamo cura del nostro team",
      benefits: [
        { icon: TrendingUp, title: "Compensi Competitivi", text: "Stipendi leader di mercato e bonus legati alle performance" },
        { icon: GraduationCap, title: "Sviluppo Professionale", text: "Opportunità di apprendimento continuo e avanzamento di carriera" },
        { icon: Clock, title: "Equilibrio Vita-Lavoro", text: "Orari flessibili e opzioni di lavoro ibrido" },
        { icon: Shield, title: "Benefit Sanitari", text: "Copertura medica, dentale e oculistica completa" },
        { icon: BookOpen, title: "Programmi di Formazione", text: "Formazione interna e supporto per certificazioni esterne" },
        { icon: HandHeart, title: "Mentoring", text: "Guida da partner esperti e avvocati senior" },
      ],
      positionsTitle: "Posizioni Aperte",
      positionsSubtitle: "Esplora le opportunità attuali nel nostro studio",
      positions: [
        {
          title: "Associate Attorney",
          titleEs: "Abogado Asociado",
          department: "Corporate Law",
          departmentEs: "Derecho Corporativo",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Cerchiamo avvocati di talento con 2-5 anni di esperienza in diritto societario, M&A o transazioni commerciali per unirsi al nostro team in crescita.",
          descriptionEs: "Buscamos abogados talentosos con 2-5 años de experiencia en derecho corporativo, M&A o transacciones comerciales para unirse a nuestro equipo.",
        },
        {
          title: "Legal Intern / Pasante",
          titleEs: "Pasante de Derecho",
          department: "Multiple Areas",
          departmentEs: "Múltiples Áreas",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Internship",
          typeEs: "Pasantía",
          description: "Unisciti al nostro programma di tirocinio e acquisisci esperienza pratica lavorando a fianco di professionisti legali di primo piano in varie aree di pratica.",
          descriptionEs: "Únete a nuestro programa de pasantías y obtén experiencia práctica trabajando junto a profesionales legales líderes en diversas áreas.",
        },
        {
          title: "Paralegal",
          titleEs: "Paralegal",
          department: "Litigation",
          departmentEs: "Litigio",
          location: "Mexico City",
          locationEs: "Ciudad de México",
          type: "Full-time",
          typeEs: "Tiempo completo",
          description: "Supporta il nostro team di contenzioso nella ricerca legale, preparazione documenti e gestione dei casi in un ambiente dinamico.",
          descriptionEs: "Apoya a nuestro equipo de litigio con investigación legal, preparación de documentos y gestión de casos en un ambiente dinámico.",
        },
      ],
      internshipTitle: "Programma di Tirocinio",
      internshipSubtitle: "Inizia la tua carriera legale con noi",
      internshipOverviewTitle: "Panoramica del Programma",
      internshipOverviewText: "Il nostro programma di tirocinio è progettato per fornire agli studenti di giurisprudenza un'esperienza pratica completa in uno degli studi legali più prestigiosi del Messico. I tirocinanti lavorano direttamente con partner e collaboratori senior su casi e transazioni reali, acquisendo conoscenze pratiche inestimabili.",
      internshipDurationTitle: "Durata e Requisiti",
      internshipDuration: [
        "Durata del programma: 6-12 mesi",
        "Studenti di giurisprudenza negli ultimi anni o neolaureati",
        "Eccellente curriculum accademico da facoltà di giurisprudenza accreditate",
        "Eccellenti capacità di comunicazione scritta e orale",
        "Padronanza dello spagnolo e dell'inglese preferita",
      ],
      internshipLearningTitle: "Cosa Imparerai",
      internshipLearning: [
        "Tecniche di ricerca e analisi legale",
        "Redazione e revisione di documenti",
        "Comunicazione con i clienti e gestione delle relazioni",
        "Procedure giudiziarie e arbitrali",
        "Transazioni aziendali e due diligence",
        "Etica professionale e best practice",
      ],
      applyTitle: "Come Candidarsi",
      applySubtitle: "Fai il primo passo verso il tuo futuro con noi",
      applyInstructions: "Per candidarsi a qualsiasi posizione o al nostro programma di tirocinio, invia il tuo CV, lettera di presentazione e certificati accademici a:",
      applyEmail: "reclutamiento@vonwobeser.com",
      applyNote: "Includi il titolo della posizione nell'oggetto della tua email. Esaminiamo attentamente tutte le candidature e contatteremo i candidati qualificati per i colloqui.",
      contactCardTitle: "Contatto Carriere",
      contactCardText: "Hai domande sulle opportunità in Von Wobeser y Sierra?",
      sendApplication: "Invia Candidatura",
      viewDetails: "Vedi Dettagli",
      apply: "Candidati Ora",
    },
  };

  const t = content[language as keyof typeof content] || content.en;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-careers">
      <SEOHead page="careers" language={language} />
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-careers-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="h-0.5 w-12 bg-primary mx-auto mb-6" />
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-5 uppercase tracking-[0.15em]"
              data-testid="text-careers-title"
            >
              {t.heroTitle}
            </h1>
            <p 
              className="text-base text-white/60 max-w-3xl mx-auto mb-8"
              data-testid="text-careers-subtitle"
            >
              {t.heroSubtitle}
            </p>
            <Button 
              className="rounded-none"
              variant="default"
              size="lg"
              asChild
              data-testid="button-hero-apply"
            >
              <a href={`mailto:${t.applyEmail}`}>
                <Briefcase className="w-5 h-5 mr-2" />
                {t.apply}
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-20"
            data-testid="section-why-join"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]"
                data-testid="text-why-join-title"
              >
                {t.whyJoinTitle}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t.whyJoinSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <Card className="rounded-none border border-border" data-testid="card-culture">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-light text-foreground uppercase tracking-[0.1em]">
                    <Building2 className="w-6 h-6 text-primary" />
                    {t.cultureTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-justify hyphens-auto">
                    {t.cultureText}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-none border border-border" data-testid="card-environment">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-light text-foreground uppercase tracking-[0.1em]">
                    <Target className="w-6 h-6 text-primary" />
                    {t.environmentTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-justify hyphens-auto">
                    {t.environmentText}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-none border border-border bg-muted" data-testid="card-values">
              <CardHeader>
                <CardTitle className="text-lg font-heading font-light text-foreground text-center uppercase tracking-[0.1em]">
                  {t.valuesTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {t.values.map((value, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      data-testid={`card-value-${index}`}
                    >
                      <NumberedCard
                        index={index}
                        title={value.title}
                        body={value.text}
                        icon={value.icon}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-benefits"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]"
                data-testid="text-benefits-title"
              >
                {t.benefitsTitle}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.benefitsSubtitle}
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.benefits.map((benefit, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <NumberedCard
                    index={index}
                    title={benefit.title}
                    body={benefit.text}
                    icon={benefit.icon}
                    dataTestid={`card-benefit-${index}`}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-positions"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]"
                data-testid="text-positions-title"
              >
                {t.positionsTitle}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.positionsSubtitle}
              </p>
            </div>

            <motion.div 
              className="space-y-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.positions.map((position, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-none border border-border"
                    data-testid={`card-position-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-xl font-light uppercase tracking-[0.12em] text-foreground">
                              {language === "es" ? position.titleEs : position.title}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {language === "es" ? position.typeEs : position.type}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {language === "es" ? position.departmentEs : position.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {language === "es" ? position.locationEs : position.location}
                            </span>
                          </div>
                          <p className="text-muted-foreground">
                            {language === "es" ? position.descriptionEs : position.description}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Button 
                            className="rounded-none w-full lg:w-auto"
                            asChild
                            data-testid={`button-apply-position-${index}`}
                          >
                            <a href={`mailto:reclutamiento@vonwobeser.com?subject=${encodeURIComponent(language === "es" ? position.titleEs : position.title)}`}>
                              {t.apply}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-internship"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]"
                data-testid="text-internship-title"
              >
                {t.internshipTitle}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.internshipSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card 
                className="rounded-none border border-border lg:col-span-2"
                data-testid="card-internship-overview"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-lg font-heading font-light text-foreground uppercase tracking-[0.1em]">
                    <GraduationCap className="w-6 h-6 text-primary" />
                    {t.internshipOverviewTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-6 text-justify hyphens-auto">
                    {t.internshipOverviewText}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        {t.internshipDurationTitle}
                      </h4>
                      <ul className="space-y-2">
                        {t.internshipDuration.map((item, index) => (
                          <li 
                            key={index} 
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        {t.internshipLearningTitle}
                      </h4>
                      <ul className="space-y-2">
                        {t.internshipLearning.map((item, index) => (
                          <li 
                            key={index} 
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="rounded-none border border-white/10 bg-[#1a1a19] text-white"
                data-testid="card-internship-cta"
              >
                <CardContent className="p-8 flex flex-col justify-center h-full">
                  <GraduationCap className="w-12 h-12 mb-6 text-primary" />
                  <h3 className="text-xl font-heading font-light mb-4">
                    {language === "es" ? "¿Listo para comenzar?" : "Ready to get started?"}
                  </h3>
                  <p className="text-white/60 mb-6">
                    {language === "es" 
                      ? "Aplica a nuestro programa de pasantías y da el primer paso en tu carrera legal."
                      : "Apply to our internship program and take the first step in your legal career."
                    }
                  </p>
                  <Button 
                    variant="default"
                    className="rounded-none w-full"
                    asChild
                    data-testid="button-internship-apply"
                  >
                    <a href={`mailto:reclutamiento@vonwobeser.com?subject=${encodeURIComponent(language === "es" ? "Programa de Pasantías" : "Internship Program")}`}>
                      {t.apply}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12"
            data-testid="section-apply"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 
                  className="text-2xl md:text-3xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]"
                  data-testid="text-apply-title"
                >
                  {t.applyTitle}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {t.applySubtitle}
                </p>
                <Card className="rounded-none border border-border bg-muted" data-testid="card-apply-instructions">
                  <CardContent className="p-8">
                    <p className="text-muted-foreground mb-4">
                      {t.applyInstructions}
                    </p>
                    <a 
                      href={`mailto:${t.applyEmail}`}
                      className="inline-flex items-center gap-2 text-xl font-semibold text-primary hover:underline mb-4"
                      data-testid="link-apply-email"
                    >
                      <Mail className="w-5 h-5" />
                      {t.applyEmail}
                    </a>
                    <p className="text-sm text-muted-foreground">
                      {t.applyNote}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card 
                  className="rounded-none border border-border h-full"
                  data-testid="card-careers-contact"
                >
                  <CardContent className="p-8">
                    <h3 className="text-base font-heading font-light text-foreground mb-2 uppercase tracking-[0.1em]">
                      {t.contactCardTitle}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {t.contactCardText}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Mail className="w-5 h-5 text-primary" />
                        <a 
                          href={`mailto:${t.applyEmail}`}
                          className="hover:text-primary transition-colors"
                          data-testid="link-contact-email"
                        >
                          {t.applyEmail}
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin className="w-5 h-5 text-primary" />
                        <span>
                          {language === "es" ? "Ciudad de México" : "Mexico City"}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="rounded-none w-full mt-6"
                      asChild
                      data-testid="button-send-application"
                    >
                      <a href={`mailto:${t.applyEmail}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.sendApplication}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
