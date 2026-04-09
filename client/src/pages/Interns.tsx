import { motion } from "framer-motion";
import { 
  GraduationCap, 
  Briefcase, 
  Clock, 
  Calendar,
  Target,
  Lightbulb,
  Users,
  Heart,
  BookOpen,
  Mail,
  ArrowRight,
  CheckCircle2,
  Building2,
  Scale,
  HandHeart,
  Award,
  TrendingUp,
  Shield,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function Interns() {
  const { language } = useLanguage();

  const content = {
    en: {
      heroTitle: "Internship Program",
      heroSubtitle: "Launch your legal career at one of Mexico's most prestigious law firms. Gain hands-on experience and develop essential skills alongside industry leaders.",
      applyNow: "Apply Now",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Program Overview",
      programOverviewSubtitle: "Two pathways to start your legal career",
      summerProgramTitle: "Summer Internship",
      summerProgramDescription: "Our summer internship program runs from June to August, offering law students an intensive experience during their academic break. Summer interns participate in ongoing matters across multiple practice areas, attend training sessions, and gain exposure to various aspects of legal practice.",
      summerProgramDuration: "Duration: 10-12 weeks (June - August)",
      permanentProgramTitle: "Permanent Internship",
      permanentProgramDescription: "Our permanent internship program is designed for law students in their final years who can dedicate part-time or full-time hours throughout the academic year. Permanent interns develop deeper expertise in specific practice areas and may transition to full-time associate positions upon graduation.",
      permanentProgramDuration: "Duration: 6-12 months (flexible schedule)",

      whatYouLearnTitle: "What You'll Learn",
      whatYouLearnSubtitle: "Comprehensive development for aspiring legal professionals",
      learningAreas: [
        { icon: Scale, title: "Work Dynamics", text: "Experience real-world legal work by supporting partners and associates on active matters. Learn how a top-tier law firm operates day-to-day." },
        { icon: Users, title: "Diversity & Inclusion", text: "Understand our commitment to D&I through training sessions and participation in firm initiatives. Experience a workplace where every voice matters." },
        { icon: BookOpen, title: "Legal Research", text: "Master legal research methodologies, case analysis, and the preparation of legal memoranda using cutting-edge tools and databases." },
        { icon: Briefcase, title: "Client Service", text: "Develop client-facing skills by participating in meetings, preparing client deliverables, and understanding relationship management." },
        { icon: Lightbulb, title: "Professional Ethics", text: "Learn the ethical standards and best practices that guide the legal profession in Mexico and internationally." },
        { icon: Building2, title: "Firm Culture", text: "Immerse yourself in our collaborative culture, network with attorneys at all levels, and build lasting professional relationships." },
      ],

      requirementsTitle: "Requirements",
      requirementsSubtitle: "What we look for in our interns",
      requirements: [
        "Currently enrolled in a law program at an accredited university",
        "Students in their 3rd year or higher preferred",
        "Strong academic record (minimum 8.5 GPA or equivalent)",
        "Excellent written and verbal communication skills in Spanish",
        "Proficiency in English (intermediate to advanced level preferred)",
        "Demonstrated interest in corporate law, litigation, or related fields",
        "Strong analytical and problem-solving abilities",
        "Availability for minimum 20 hours per week (permanent program)",
      ],

      applicationProcessTitle: "Application Process",
      applicationProcessSubtitle: "How to join our internship program",
      applicationSteps: [
        { step: "1", title: "Submit Application", text: "Send your CV, cover letter, academic transcripts, and two professional or academic references to our recruitment team." },
        { step: "2", title: "Initial Review", text: "Our HR team reviews all applications and selects candidates for the next stage based on qualifications and fit." },
        { step: "3", title: "Interview Process", text: "Selected candidates participate in interviews with HR and attorneys from relevant practice areas." },
        { step: "4", title: "Offer & Onboarding", text: "Successful candidates receive an offer and begin our comprehensive onboarding program." },
      ],

      benefitsTitle: "Benefits of Interning at Von Wobeser",
      benefitsSubtitle: "Invest in your future with us",
      benefits: [
        { icon: Award, title: "Prestigious Experience", text: "Add experience at a top-ranked Mexican law firm to your resume. Our reputation opens doors." },
        { icon: GraduationCap, title: "Mentorship Program", text: "Receive guidance from experienced attorneys who invest in your professional development." },
        { icon: TrendingUp, title: "Career Growth", text: "Many of our associates started as interns. Outstanding performers may receive full-time offers." },
        { icon: Shield, title: "Competitive Stipend", text: "Receive a competitive monthly stipend that recognizes the value of your contributions." },
        { icon: Users, title: "Professional Network", text: "Build connections with leading legal professionals, clients, and peers that last throughout your career." },
        { icon: HandHeart, title: "Flexible Arrangements", text: "We work with you to balance your internship with academic commitments." },
      ],

      ctaTitle: "Ready to Start Your Legal Career?",
      ctaSubtitle: "Take the first step towards joining one of Mexico's leading law firms",
      ctaInstructions: "Send your application materials to:",
      ctaNote: "Please include 'Internship Application - [Your Name]' in your email subject line. We review applications on a rolling basis and will contact qualified candidates for interviews.",
      sendApplication: "Send Application",
      viewCareers: "View All Careers",
      contactTitle: "Questions?",
      contactText: "Have questions about our internship program? Reach out to our recruitment team.",
    },
    es: {
      heroTitle: "Programa de Pasantes",
      heroSubtitle: "Inicia tu carrera legal en una de las firmas de abogados más prestigiosas de México. Obtén experiencia práctica y desarrolla habilidades esenciales junto a líderes de la industria.",
      applyNow: "Aplicar Ahora",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Descripción del Programa",
      programOverviewSubtitle: "Dos caminos para iniciar tu carrera legal",
      summerProgramTitle: "Pasantía de Verano",
      summerProgramDescription: "Nuestro programa de pasantías de verano se desarrolla de junio a agosto, ofreciendo a los estudiantes de derecho una experiencia intensiva durante su receso académico. Los pasantes de verano participan en asuntos activos en múltiples áreas de práctica, asisten a sesiones de capacitación y obtienen exposición a diversos aspectos de la práctica legal.",
      summerProgramDuration: "Duración: 10-12 semanas (junio - agosto)",
      permanentProgramTitle: "Pasantía Permanente",
      permanentProgramDescription: "Nuestro programa de pasantías permanentes está diseñado para estudiantes de derecho en sus últimos años que pueden dedicar horas parciales o completas durante el año académico. Los pasantes permanentes desarrollan experiencia más profunda en áreas de práctica específicas y pueden transitar a posiciones de tiempo completo como asociados al graduarse.",
      permanentProgramDuration: "Duración: 6-12 meses (horario flexible)",

      whatYouLearnTitle: "Lo Que Aprenderás",
      whatYouLearnSubtitle: "Desarrollo integral para futuros profesionales legales",
      learningAreas: [
        { icon: Scale, title: "Dinámica de Trabajo", text: "Experimenta el trabajo legal real apoyando a socios y asociados en asuntos activos. Aprende cómo opera una firma de primer nivel día a día." },
        { icon: Users, title: "Diversidad e Inclusión", text: "Comprende nuestro compromiso con D&I a través de sesiones de capacitación y participación en iniciativas de la firma. Experimenta un lugar de trabajo donde cada voz importa." },
        { icon: BookOpen, title: "Investigación Legal", text: "Domina metodologías de investigación legal, análisis de casos y preparación de memorándums legales usando herramientas y bases de datos de vanguardia." },
        { icon: Briefcase, title: "Servicio al Cliente", text: "Desarrolla habilidades de cara al cliente participando en reuniones, preparando entregables y entendiendo la gestión de relaciones." },
        { icon: Lightbulb, title: "Ética Profesional", text: "Aprende los estándares éticos y mejores prácticas que guían la profesión legal en México e internacionalmente." },
        { icon: Building2, title: "Cultura de la Firma", text: "Sumérgete en nuestra cultura colaborativa, establece contactos con abogados de todos los niveles y construye relaciones profesionales duraderas." },
      ],

      requirementsTitle: "Requisitos",
      requirementsSubtitle: "Lo que buscamos en nuestros pasantes",
      requirements: [
        "Actualmente inscrito en un programa de derecho en una universidad acreditada",
        "Se prefieren estudiantes de 3er año o superior",
        "Excelente expediente académico (mínimo 8.5 de promedio o equivalente)",
        "Excelentes habilidades de comunicación escrita y verbal en español",
        "Dominio del inglés (nivel intermedio a avanzado preferido)",
        "Interés demostrado en derecho corporativo, litigio o campos relacionados",
        "Fuertes habilidades analíticas y de resolución de problemas",
        "Disponibilidad mínima de 20 horas por semana (programa permanente)",
      ],

      applicationProcessTitle: "Proceso de Aplicación",
      applicationProcessSubtitle: "Cómo unirte a nuestro programa de pasantías",
      applicationSteps: [
        { step: "1", title: "Enviar Solicitud", text: "Envía tu CV, carta de presentación, expediente académico y dos referencias profesionales o académicas a nuestro equipo de reclutamiento." },
        { step: "2", title: "Revisión Inicial", text: "Nuestro equipo de RH revisa todas las solicitudes y selecciona candidatos para la siguiente etapa basándose en calificaciones y compatibilidad." },
        { step: "3", title: "Proceso de Entrevistas", text: "Los candidatos seleccionados participan en entrevistas con RH y abogados de las áreas de práctica relevantes." },
        { step: "4", title: "Oferta e Inducción", text: "Los candidatos exitosos reciben una oferta y comienzan nuestro programa integral de inducción." },
      ],

      benefitsTitle: "Beneficios de una Pasantía en Von Wobeser",
      benefitsSubtitle: "Invierte en tu futuro con nosotros",
      benefits: [
        { icon: Award, title: "Experiencia Prestigiosa", text: "Agrega experiencia en una firma mexicana de primer nivel a tu currículum. Nuestra reputación abre puertas." },
        { icon: GraduationCap, title: "Programa de Mentoría", text: "Recibe orientación de abogados experimentados que invierten en tu desarrollo profesional." },
        { icon: TrendingUp, title: "Crecimiento Profesional", text: "Muchos de nuestros asociados comenzaron como pasantes. Los mejores desempeños pueden recibir ofertas de tiempo completo." },
        { icon: Shield, title: "Beca Competitiva", text: "Recibe una beca mensual competitiva que reconoce el valor de tus contribuciones." },
        { icon: Users, title: "Red Profesional", text: "Construye conexiones con profesionales legales líderes, clientes y colegas que duran toda tu carrera." },
        { icon: HandHeart, title: "Arreglos Flexibles", text: "Trabajamos contigo para equilibrar tu pasantía con compromisos académicos." },
      ],

      ctaTitle: "¿Listo para Iniciar tu Carrera Legal?",
      ctaSubtitle: "Da el primer paso para unirte a una de las firmas de abogados líderes de México",
      ctaInstructions: "Envía tus materiales de aplicación a:",
      ctaNote: "Por favor incluye 'Solicitud de Pasantía - [Tu Nombre]' en el asunto del correo. Revisamos solicitudes de manera continua y contactaremos a los candidatos calificados para entrevistas.",
      sendApplication: "Enviar Solicitud",
      viewCareers: "Ver Todas las Carreras",
      contactTitle: "¿Preguntas?",
      contactText: "¿Tienes preguntas sobre nuestro programa de pasantías? Contacta a nuestro equipo de reclutamiento.",
    },
    de: {
      heroTitle: "Praktikantenprogramm",
      heroSubtitle: "Starten Sie Ihre juristische Karriere bei einer der renommiertesten Anwaltskanzleien Mexikos. Sammeln Sie praktische Erfahrungen und entwickeln Sie wesentliche Fähigkeiten an der Seite von Branchenführern.",
      applyNow: "Jetzt bewerben",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Programmübersicht",
      programOverviewSubtitle: "Zwei Wege, um Ihre juristische Karriere zu beginnen",
      summerProgramTitle: "Sommerpraktikum",
      summerProgramDescription: "Unser Sommerpraktikumsprogramm läuft von Juni bis August und bietet Jurastudenten eine intensive Erfahrung während ihrer akademischen Pause. Sommerpraktikanten arbeiten an laufenden Mandaten in verschiedenen Praxisbereichen, nehmen an Schulungen teil und erhalten Einblicke in verschiedene Aspekte der Rechtspraxis.",
      summerProgramDuration: "Dauer: 10-12 Wochen (Juni - August)",
      permanentProgramTitle: "Dauerpraktikum",
      permanentProgramDescription: "Unser Dauerpraktikumsprogramm richtet sich an Jurastudenten in ihren letzten Jahren, die während des akademischen Jahres Teilzeit- oder Vollzeitstunden widmen können. Dauerpraktikanten entwickeln tiefere Expertise in spezifischen Praxisbereichen und können nach dem Abschluss in Vollzeit-Associate-Positionen wechseln.",
      permanentProgramDuration: "Dauer: 6-12 Monate (flexibler Zeitplan)",

      whatYouLearnTitle: "Was Sie lernen werden",
      whatYouLearnSubtitle: "Umfassende Entwicklung für angehende Juristen",
      learningAreas: [
        { icon: Scale, title: "Arbeitsdynamik", text: "Erleben Sie echte juristische Arbeit, indem Sie Partner und Associates bei aktiven Mandaten unterstützen. Lernen Sie, wie eine erstklassige Kanzlei im Alltag funktioniert." },
        { icon: Users, title: "Vielfalt & Inklusion", text: "Verstehen Sie unser Engagement für D&I durch Schulungen und Teilnahme an Kanzleiinitiativen. Erleben Sie einen Arbeitsplatz, an dem jede Stimme zählt." },
        { icon: BookOpen, title: "Juristische Recherche", text: "Beherrschen Sie juristische Recherchemethoden, Fallanalysen und die Erstellung von Rechtsgutachten mit modernsten Tools und Datenbanken." },
        { icon: Briefcase, title: "Mandantenservice", text: "Entwickeln Sie kundenorientierte Fähigkeiten durch Teilnahme an Meetings, Vorbereitung von Mandantenunterlagen und Verständnis des Beziehungsmanagements." },
        { icon: Lightbulb, title: "Berufsethik", text: "Lernen Sie die ethischen Standards und Best Practices, die den Rechtsberuf in Mexiko und international leiten." },
        { icon: Building2, title: "Kanzleikultur", text: "Tauchen Sie ein in unsere kollaborative Kultur, vernetzen Sie sich mit Anwälten auf allen Ebenen und bauen Sie dauerhafte berufliche Beziehungen auf." },
      ],

      requirementsTitle: "Anforderungen",
      requirementsSubtitle: "Was wir bei unseren Praktikanten suchen",
      requirements: [
        "Derzeit in einem Jurastudium an einer akkreditierten Universität eingeschrieben",
        "Studenten im 3. Jahr oder höher bevorzugt",
        "Starke akademische Leistung (Mindestdurchschnitt 8,5 oder gleichwertig)",
        "Ausgezeichnete schriftliche und mündliche Kommunikationsfähigkeiten in Spanisch",
        "Englischkenntnisse (mittleres bis fortgeschrittenes Niveau bevorzugt)",
        "Nachgewiesenes Interesse an Unternehmensrecht, Prozessführung oder verwandten Bereichen",
        "Starke analytische Fähigkeiten und Problemlösungskompetenz",
        "Verfügbarkeit für mindestens 20 Stunden pro Woche (Dauerprogramm)",
      ],

      applicationProcessTitle: "Bewerbungsprozess",
      applicationProcessSubtitle: "So treten Sie unserem Praktikantenprogramm bei",
      applicationSteps: [
        { step: "1", title: "Bewerbung einreichen", text: "Senden Sie Ihren Lebenslauf, Anschreiben, akademische Zeugnisse und zwei berufliche oder akademische Referenzen an unser Rekrutierungsteam." },
        { step: "2", title: "Erstprüfung", text: "Unser HR-Team prüft alle Bewerbungen und wählt Kandidaten für die nächste Phase basierend auf Qualifikationen und Eignung aus." },
        { step: "3", title: "Interviewprozess", text: "Ausgewählte Kandidaten nehmen an Interviews mit HR und Anwälten aus relevanten Praxisbereichen teil." },
        { step: "4", title: "Angebot & Onboarding", text: "Erfolgreiche Kandidaten erhalten ein Angebot und beginnen unser umfassendes Onboarding-Programm." },
      ],

      benefitsTitle: "Vorteile eines Praktikums bei Von Wobeser",
      benefitsSubtitle: "Investieren Sie in Ihre Zukunft mit uns",
      benefits: [
        { icon: Award, title: "Prestigeträchtige Erfahrung", text: "Fügen Sie Erfahrung bei einer erstklassigen mexikanischen Kanzlei Ihrem Lebenslauf hinzu. Unser Ruf öffnet Türen." },
        { icon: GraduationCap, title: "Mentorenprogramm", text: "Erhalten Sie Anleitung von erfahrenen Anwälten, die in Ihre berufliche Entwicklung investieren." },
        { icon: TrendingUp, title: "Karrierewachstum", text: "Viele unserer Associates begannen als Praktikanten. Herausragende Leistungsträger können Vollzeitangebote erhalten." },
        { icon: Shield, title: "Wettbewerbsfähiges Stipendium", text: "Erhalten Sie ein wettbewerbsfähiges monatliches Stipendium, das den Wert Ihrer Beiträge anerkennt." },
        { icon: Users, title: "Berufliches Netzwerk", text: "Bauen Sie Verbindungen zu führenden Rechtsexperten, Mandanten und Kollegen auf, die Ihre gesamte Karriere überdauern." },
        { icon: HandHeart, title: "Flexible Regelungen", text: "Wir arbeiten mit Ihnen zusammen, um Ihr Praktikum mit akademischen Verpflichtungen in Einklang zu bringen." },
      ],

      ctaTitle: "Bereit, Ihre juristische Karriere zu starten?",
      ctaSubtitle: "Machen Sie den ersten Schritt, um einer der führenden Anwaltskanzleien Mexikos beizutreten",
      ctaInstructions: "Senden Sie Ihre Bewerbungsunterlagen an:",
      ctaNote: "Bitte geben Sie 'Praktikumsbewerbung - [Ihr Name]' in der E-Mail-Betreffzeile an. Wir prüfen Bewerbungen laufend und werden qualifizierte Kandidaten für Interviews kontaktieren.",
      sendApplication: "Bewerbung senden",
      viewCareers: "Alle Karrieren anzeigen",
      contactTitle: "Fragen?",
      contactText: "Haben Sie Fragen zu unserem Praktikantenprogramm? Wenden Sie sich an unser Rekrutierungsteam.",
    },
    zh: {
      heroTitle: "实习生计划",
      heroSubtitle: "在墨西哥最负盛名的律师事务所之一开启您的法律职业生涯。与行业领袖一起获得实践经验并发展必要技能。",
      applyNow: "立即申请",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "项目概述",
      programOverviewSubtitle: "开启法律职业生涯的两种途径",
      summerProgramTitle: "暑期实习",
      summerProgramDescription: "我们的暑期实习项目从六月至八月进行，为法学院学生在学术假期期间提供密集的体验。暑期实习生参与多个业务领域的正在进行的事务，参加培训课程，并接触法律实践的各个方面。",
      summerProgramDuration: "时长：10-12周（六月至八月）",
      permanentProgramTitle: "长期实习",
      permanentProgramDescription: "我们的长期实习项目专为能够在学年期间投入兼职或全职时间的高年级法学院学生设计。长期实习生在特定业务领域发展更深入的专业知识，毕业后可能转为全职律师职位。",
      permanentProgramDuration: "时长：6-12个月（灵活安排）",

      whatYouLearnTitle: "您将学到什么",
      whatYouLearnSubtitle: "为有志法律专业人士提供全面发展",
      learningAreas: [
        { icon: Scale, title: "工作动态", text: "通过支持合伙人和律师处理正在进行的事务，体验真实的法律工作。了解顶级律师事务所的日常运作方式。" },
        { icon: Users, title: "多元化与包容", text: "通过培训课程和参与事务所活动了解我们对D&I的承诺。体验一个每个声音都重要的工作场所。" },
        { icon: BookOpen, title: "法律研究", text: "使用尖端工具和数据库掌握法律研究方法论、案例分析和法律备忘录的准备。" },
        { icon: Briefcase, title: "客户服务", text: "通过参与会议、准备客户交付物和理解关系管理来发展面向客户的技能。" },
        { icon: Lightbulb, title: "职业道德", text: "学习指导墨西哥和国际法律行业的道德标准和最佳实践。" },
        { icon: Building2, title: "事务所文化", text: "沉浸在我们的协作文化中，与各级律师建立联系，建立持久的专业关系。" },
      ],

      requirementsTitle: "要求",
      requirementsSubtitle: "我们在实习生中寻找什么",
      requirements: [
        "目前就读于认可大学的法学专业",
        "优先考虑三年级或以上学生",
        "优秀的学业成绩（最低平均分8.5或同等水平）",
        "优秀的西班牙语书面和口头沟通能力",
        "英语熟练程度（优先考虑中高级水平）",
        "对公司法、诉讼或相关领域表现出浓厚兴趣",
        "强大的分析和解决问题能力",
        "每周至少20小时可用（长期项目）",
      ],

      applicationProcessTitle: "申请流程",
      applicationProcessSubtitle: "如何加入我们的实习生计划",
      applicationSteps: [
        { step: "1", title: "提交申请", text: "将您的简历、求职信、成绩单和两份专业或学术推荐信发送给我们的招聘团队。" },
        { step: "2", title: "初步审核", text: "我们的人力资源团队审核所有申请，并根据资质和匹配度选择进入下一阶段的候选人。" },
        { step: "3", title: "面试流程", text: "入选候选人将与人力资源部门和相关业务领域的律师进行面试。" },
        { step: "4", title: "录用与入职", text: "成功的候选人将收到录用通知并开始我们全面的入职培训计划。" },
      ],

      benefitsTitle: "在Von Wobeser实习的好处",
      benefitsSubtitle: "与我们一起投资您的未来",
      benefits: [
        { icon: Award, title: "享有盛誉的经验", text: "在简历中添加顶级墨西哥律师事务所的工作经验。我们的声誉为您打开大门。" },
        { icon: GraduationCap, title: "导师计划", text: "获得经验丰富的律师的指导，他们投资于您的专业发展。" },
        { icon: TrendingUp, title: "职业成长", text: "我们的许多律师都是从实习生开始的。表现出色者可能会收到全职工作邀请。" },
        { icon: Shield, title: "有竞争力的津贴", text: "获得有竞争力的月度津贴，以认可您贡献的价值。" },
        { icon: Users, title: "专业网络", text: "与领先的法律专业人士、客户和同行建立持续整个职业生涯的联系。" },
        { icon: HandHeart, title: "灵活安排", text: "我们与您合作，平衡实习与学业承诺。" },
      ],

      ctaTitle: "准备好开始您的法律职业生涯了吗？",
      ctaSubtitle: "迈出加入墨西哥领先律师事务所的第一步",
      ctaInstructions: "将您的申请材料发送至：",
      ctaNote: "请在电子邮件主题行中注明'实习申请 - [您的姓名]'。我们持续审核申请，并将联系符合条件的候选人进行面试。",
      sendApplication: "发送申请",
      viewCareers: "查看所有职位",
      contactTitle: "有问题？",
      contactText: "对我们的实习生计划有疑问？请联系我们的招聘团队。",
    },
    ko: {
      heroTitle: "인턴십 프로그램",
      heroSubtitle: "멕시코에서 가장 권위 있는 로펌 중 하나에서 법률 경력을 시작하세요. 업계 리더들과 함께 실무 경험을 쌓고 필수 기술을 개발하세요.",
      applyNow: "지금 신청",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "프로그램 개요",
      programOverviewSubtitle: "법률 경력을 시작하는 두 가지 경로",
      summerProgramTitle: "여름 인턴십",
      summerProgramDescription: "여름 인턴십 프로그램은 6월부터 8월까지 진행되며, 법학과 학생들에게 학기 휴식 기간 동안 집중적인 경험을 제공합니다. 여름 인턴은 여러 업무 분야의 진행 중인 사건에 참여하고, 교육 세션에 참석하며, 법률 실무의 다양한 측면을 경험합니다.",
      summerProgramDuration: "기간: 10-12주 (6월 - 8월)",
      permanentProgramTitle: "정규 인턴십",
      permanentProgramDescription: "정규 인턴십 프로그램은 학년 동안 파트타임 또는 풀타임으로 근무할 수 있는 고학년 법학과 학생들을 위해 설계되었습니다. 정규 인턴은 특정 업무 분야에서 더 깊은 전문성을 개발하며, 졸업 후 정규직 어소시에이트 직위로 전환할 수 있습니다.",
      permanentProgramDuration: "기간: 6-12개월 (유연한 일정)",

      whatYouLearnTitle: "배우게 될 내용",
      whatYouLearnSubtitle: "미래 법률 전문가를 위한 종합적인 개발",
      learningAreas: [
        { icon: Scale, title: "업무 역학", text: "파트너와 어소시에이트를 지원하며 진행 중인 사건에서 실제 법률 업무를 경험하세요. 최고 수준의 로펌이 일상적으로 어떻게 운영되는지 배우세요." },
        { icon: Users, title: "다양성과 포용", text: "교육 세션과 회사 이니셔티브 참여를 통해 D&I에 대한 우리의 약속을 이해하세요. 모든 목소리가 중요한 직장을 경험하세요." },
        { icon: BookOpen, title: "법률 연구", text: "최첨단 도구와 데이터베이스를 사용하여 법률 연구 방법론, 사례 분석 및 법률 메모 작성을 마스터하세요." },
        { icon: Briefcase, title: "고객 서비스", text: "회의 참여, 고객 결과물 준비 및 관계 관리 이해를 통해 고객 대면 기술을 개발하세요." },
        { icon: Lightbulb, title: "직업 윤리", text: "멕시코와 국제적으로 법률 직업을 안내하는 윤리 기준과 모범 사례를 배우세요." },
        { icon: Building2, title: "회사 문화", text: "협력적인 문화에 몰입하고, 모든 수준의 변호사들과 네트워크를 형성하며, 지속적인 전문적 관계를 구축하세요." },
      ],

      requirementsTitle: "요건",
      requirementsSubtitle: "인턴에게 원하는 자질",
      requirements: [
        "공인 대학교 법학 프로그램에 현재 재학 중",
        "3학년 이상 학생 우대",
        "우수한 학업 성적 (최소 평점 8.5 또는 동등)",
        "스페인어 우수한 서면 및 구두 의사소통 능력",
        "영어 능숙도 (중급에서 고급 수준 우대)",
        "기업법, 소송 또는 관련 분야에 대한 입증된 관심",
        "강력한 분석 및 문제 해결 능력",
        "주당 최소 20시간 가능 (정규 프로그램)",
      ],

      applicationProcessTitle: "지원 절차",
      applicationProcessSubtitle: "인턴십 프로그램 참여 방법",
      applicationSteps: [
        { step: "1", title: "지원서 제출", text: "이력서, 자기소개서, 성적증명서 및 두 개의 전문적 또는 학술적 추천서를 채용팀에 보내주세요." },
        { step: "2", title: "초기 검토", text: "HR 팀이 모든 지원서를 검토하고 자격과 적합성에 따라 다음 단계 후보자를 선발합니다." },
        { step: "3", title: "면접 과정", text: "선발된 후보자는 HR 및 관련 업무 분야 변호사들과 면접에 참여합니다." },
        { step: "4", title: "제안 및 온보딩", text: "성공적인 후보자는 제안을 받고 종합적인 온보딩 프로그램을 시작합니다." },
      ],

      benefitsTitle: "Von Wobeser 인턴십의 혜택",
      benefitsSubtitle: "우리와 함께 미래에 투자하세요",
      benefits: [
        { icon: Award, title: "명망 있는 경험", text: "이력서에 최고 수준의 멕시코 로펌 경험을 추가하세요. 우리의 명성이 문을 열어줍니다." },
        { icon: GraduationCap, title: "멘토십 프로그램", text: "전문적 발전에 투자하는 경험 많은 변호사들로부터 지도를 받으세요." },
        { icon: TrendingUp, title: "경력 성장", text: "우리 어소시에이트 중 많은 이들이 인턴으로 시작했습니다. 뛰어난 성과자는 정규직 제안을 받을 수 있습니다." },
        { icon: Shield, title: "경쟁력 있는 수당", text: "귀하의 기여 가치를 인정하는 경쟁력 있는 월 수당을 받으세요." },
        { icon: Users, title: "전문 네트워크", text: "경력 전반에 걸쳐 지속되는 선도적인 법률 전문가, 고객 및 동료들과의 연결을 구축하세요." },
        { icon: HandHeart, title: "유연한 조정", text: "인턴십과 학업 의무의 균형을 맞출 수 있도록 함께 협력합니다." },
      ],

      ctaTitle: "법률 경력을 시작할 준비가 되셨나요?",
      ctaSubtitle: "멕시코 최고의 로펌 중 하나에 합류하는 첫 걸음을 내딛으세요",
      ctaInstructions: "지원 자료를 다음으로 보내주세요:",
      ctaNote: "이메일 제목에 '인턴십 지원 - [귀하의 이름]'을 포함해 주세요. 지원서를 지속적으로 검토하며 자격을 갖춘 후보자에게 면접을 위해 연락드립니다.",
      sendApplication: "지원서 보내기",
      viewCareers: "모든 채용 보기",
      contactTitle: "질문이 있으신가요?",
      contactText: "인턴십 프로그램에 대해 궁금한 점이 있으시면 채용팀에 문의하세요.",
    },
    ja: {
      heroTitle: "インターンシッププログラム",
      heroSubtitle: "メキシコで最も権威ある法律事務所の一つで法律キャリアをスタートさせましょう。業界リーダーと共に実践経験を積み、必要なスキルを身につけてください。",
      applyNow: "今すぐ応募",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "プログラム概要",
      programOverviewSubtitle: "法律キャリアを始める2つの道",
      summerProgramTitle: "サマーインターンシップ",
      summerProgramDescription: "サマーインターンシッププログラムは6月から8月まで実施され、法学部生に学期休暇中の集中的な経験を提供します。サマーインターンは複数の業務分野の進行中の案件に参加し、トレーニングセッションに出席し、法律実務の様々な側面を経験します。",
      summerProgramDuration: "期間：10〜12週間（6月〜8月）",
      permanentProgramTitle: "通年インターンシップ",
      permanentProgramDescription: "通年インターンシッププログラムは、学年を通じてパートタイムまたはフルタイムの時間を捧げることができる最終学年の法学部生を対象としています。通年インターンは特定の業務分野でより深い専門知識を身につけ、卒業後にフルタイムのアソシエイト職に移行する可能性があります。",
      permanentProgramDuration: "期間：6〜12ヶ月（フレキシブルスケジュール）",

      whatYouLearnTitle: "学べること",
      whatYouLearnSubtitle: "法律専門家を目指す方のための総合的な育成",
      learningAreas: [
        { icon: Scale, title: "業務ダイナミクス", text: "パートナーやアソシエイトをサポートし、進行中の案件で実際の法律業務を経験してください。トップクラスの法律事務所が日々どのように運営されているかを学びましょう。" },
        { icon: Users, title: "ダイバーシティ＆インクルージョン", text: "トレーニングセッションや事務所のイニシアチブへの参加を通じて、D&Iへの取り組みを理解してください。すべての声が大切にされる職場を体験しましょう。" },
        { icon: BookOpen, title: "リーガルリサーチ", text: "最先端のツールやデータベースを使用して、法律調査方法論、判例分析、法的意見書の作成をマスターしてください。" },
        { icon: Briefcase, title: "クライアントサービス", text: "会議への参加、クライアント向け成果物の作成、関係管理の理解を通じて、クライアント対応スキルを身につけてください。" },
        { icon: Lightbulb, title: "職業倫理", text: "メキシコおよび国際的に法律専門家を導く倫理基準とベストプラクティスを学びましょう。" },
        { icon: Building2, title: "事務所文化", text: "協力的な文化に浸り、あらゆるレベルの弁護士とネットワークを築き、永続的な専門的関係を構築してください。" },
      ],

      requirementsTitle: "要件",
      requirementsSubtitle: "インターンに求める資質",
      requirements: [
        "認定大学の法学プログラムに現在在籍中",
        "3年生以上の学生を優先",
        "優秀な学業成績（最低GPA 8.5または同等）",
        "スペイン語での優れた書面および口頭コミュニケーション能力",
        "英語能力（中級から上級レベル優先）",
        "企業法、訴訟、または関連分野への実証された関心",
        "優れた分析力と問題解決能力",
        "週最低20時間の対応可能（通年プログラム）",
      ],

      applicationProcessTitle: "応募プロセス",
      applicationProcessSubtitle: "インターンシッププログラムへの参加方法",
      applicationSteps: [
        { step: "1", title: "応募書類提出", text: "履歴書、カバーレター、成績証明書、2通の職業的または学術的推薦状を採用チームに送付してください。" },
        { step: "2", title: "初期審査", text: "人事チームがすべての応募書類を審査し、資格と適性に基づいて次の段階の候補者を選抜します。" },
        { step: "3", title: "面接プロセス", text: "選抜された候補者は、人事部門と関連業務分野の弁護士との面接に参加します。" },
        { step: "4", title: "オファー＆オンボーディング", text: "合格した候補者はオファーを受け取り、包括的なオンボーディングプログラムを開始します。" },
      ],

      benefitsTitle: "Von Wobeserでインターンする特典",
      benefitsSubtitle: "私たちと共に未来に投資しましょう",
      benefits: [
        { icon: Award, title: "名門での経験", text: "履歴書にトップクラスのメキシコ法律事務所での経験を追加しましょう。私たちの評判が扉を開きます。" },
        { icon: GraduationCap, title: "メンターシッププログラム", text: "あなたの専門的成長に投資する経験豊富な弁護士からの指導を受けてください。" },
        { icon: TrendingUp, title: "キャリア成長", text: "私たちのアソシエイトの多くはインターンからスタートしました。優秀な成績者はフルタイムのオファーを受ける可能性があります。" },
        { icon: Shield, title: "競争力のある報酬", text: "あなたの貢献の価値を認める競争力のある月額報酬を受け取れます。" },
        { icon: Users, title: "プロフェッショナルネットワーク", text: "キャリアを通じて続く、業界をリードする法律専門家、クライアント、同僚とのつながりを構築してください。" },
        { icon: HandHeart, title: "柔軟な対応", text: "インターンシップと学業の両立をサポートするため、一緒に調整いたします。" },
      ],

      ctaTitle: "法律キャリアを始める準備はできましたか？",
      ctaSubtitle: "メキシコを代表する法律事務所の一員になる第一歩を踏み出しましょう",
      ctaInstructions: "応募書類の送付先：",
      ctaNote: "メールの件名に「インターンシップ応募 - [お名前]」を含めてください。応募書類は随時審査し、資格のある候補者には面接のご連絡をいたします。",
      sendApplication: "応募書類を送る",
      viewCareers: "すべての採用情報を見る",
      contactTitle: "ご質問はありますか？",
      contactText: "インターンシッププログラムについてご質問がございましたら、採用チームまでお問い合わせください。",
    },
    ar: {
      heroTitle: "برنامج التدريب",
      heroSubtitle: "ابدأ مسيرتك القانونية في واحدة من أعرق مكاتب المحاماة في المكسيك. اكتسب خبرة عملية وطوّر المهارات الأساسية جنباً إلى جنب مع قادة الصناعة.",
      applyNow: "قدم الآن",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "نظرة عامة على البرنامج",
      programOverviewSubtitle: "مساران لبدء مسيرتك القانونية",
      summerProgramTitle: "التدريب الصيفي",
      summerProgramDescription: "يمتد برنامج التدريب الصيفي لدينا من يونيو إلى أغسطس، مما يوفر لطلاب القانون تجربة مكثفة خلال عطلتهم الأكاديمية. يشارك المتدربون الصيفيون في القضايا الجارية عبر مجالات ممارسة متعددة، ويحضرون جلسات تدريبية، ويكتسبون خبرة في جوانب مختلفة من الممارسة القانونية.",
      summerProgramDuration: "المدة: 10-12 أسبوعاً (يونيو - أغسطس)",
      permanentProgramTitle: "التدريب الدائم",
      permanentProgramDescription: "تم تصميم برنامج التدريب الدائم لدينا لطلاب القانون في سنواتهم الأخيرة الذين يمكنهم تخصيص ساعات بدوام جزئي أو كامل طوال العام الأكاديمي. يطور المتدربون الدائمون خبرة أعمق في مجالات ممارسة محددة وقد ينتقلون إلى وظائف محامين بدوام كامل عند التخرج.",
      permanentProgramDuration: "المدة: 6-12 شهراً (جدول مرن)",

      whatYouLearnTitle: "ما ستتعلمه",
      whatYouLearnSubtitle: "تطوير شامل للمهنيين القانونيين الطموحين",
      learningAreas: [
        { icon: Scale, title: "ديناميكيات العمل", text: "جرّب العمل القانوني الحقيقي من خلال دعم الشركاء والمحامين في القضايا الجارية. تعلم كيف يعمل مكتب محاماة من الدرجة الأولى يومياً." },
        { icon: Users, title: "التنوع والشمول", text: "افهم التزامنا بالتنوع والشمول من خلال جلسات التدريب والمشاركة في مبادرات المكتب. جرّب بيئة عمل يُهم فيها كل صوت." },
        { icon: BookOpen, title: "البحث القانوني", text: "أتقن منهجيات البحث القانوني وتحليل القضايا وإعداد المذكرات القانونية باستخدام أحدث الأدوات وقواعد البيانات." },
        { icon: Briefcase, title: "خدمة العملاء", text: "طوّر مهارات التعامل مع العملاء من خلال المشاركة في الاجتماعات وإعداد المخرجات للعملاء وفهم إدارة العلاقات." },
        { icon: Lightbulb, title: "الأخلاقيات المهنية", text: "تعلم المعايير الأخلاقية وأفضل الممارسات التي توجه المهنة القانونية في المكسيك ودولياً." },
        { icon: Building2, title: "ثقافة المكتب", text: "انغمس في ثقافتنا التعاونية، وتواصل مع المحامين على جميع المستويات، وابنِ علاقات مهنية دائمة." },
      ],

      requirementsTitle: "المتطلبات",
      requirementsSubtitle: "ما نبحث عنه في متدربينا",
      requirements: [
        "مسجل حالياً في برنامج قانون في جامعة معتمدة",
        "يُفضل طلاب السنة الثالثة أو أعلى",
        "سجل أكاديمي قوي (الحد الأدنى 8.5 معدل تراكمي أو ما يعادله)",
        "مهارات ممتازة في التواصل الكتابي والشفهي بالإسبانية",
        "إتقان اللغة الإنجليزية (يُفضل المستوى المتوسط إلى المتقدم)",
        "اهتمام مُثبت بقانون الشركات أو التقاضي أو المجالات ذات الصلة",
        "قدرات تحليلية وحل مشكلات قوية",
        "التوفر لمدة 20 ساعة على الأقل أسبوعياً (البرنامج الدائم)",
      ],

      applicationProcessTitle: "عملية التقديم",
      applicationProcessSubtitle: "كيفية الانضمام إلى برنامج التدريب لدينا",
      applicationSteps: [
        { step: "1", title: "تقديم الطلب", text: "أرسل سيرتك الذاتية وخطاب التقديم والنصوص الأكاديمية ومرجعين مهنيين أو أكاديميين إلى فريق التوظيف لدينا." },
        { step: "2", title: "المراجعة الأولية", text: "يراجع فريق الموارد البشرية جميع الطلبات ويختار المرشحين للمرحلة التالية بناءً على المؤهلات والملاءمة." },
        { step: "3", title: "عملية المقابلة", text: "يشارك المرشحون المختارون في مقابلات مع الموارد البشرية ومحامين من مجالات الممارسة ذات الصلة." },
        { step: "4", title: "العرض والتأهيل", text: "يتلقى المرشحون الناجحون عرضاً ويبدأون برنامج التأهيل الشامل لدينا." },
      ],

      benefitsTitle: "فوائد التدريب في Von Wobeser",
      benefitsSubtitle: "استثمر في مستقبلك معنا",
      benefits: [
        { icon: Award, title: "خبرة مرموقة", text: "أضف خبرة في مكتب محاماة مكسيكي رفيع المستوى إلى سيرتك الذاتية. سمعتنا تفتح الأبواب." },
        { icon: GraduationCap, title: "برنامج الإرشاد", text: "احصل على توجيه من محامين ذوي خبرة يستثمرون في تطويرك المهني." },
        { icon: TrendingUp, title: "النمو المهني", text: "بدأ كثير من محامينا كمتدربين. قد يحصل المتميزون على عروض بدوام كامل." },
        { icon: Shield, title: "مكافأة تنافسية", text: "احصل على مكافأة شهرية تنافسية تعترف بقيمة مساهماتك." },
        { icon: Users, title: "شبكة مهنية", text: "ابنِ علاقات مع محترفين قانونيين رائدين وعملاء وزملاء تستمر طوال حياتك المهنية." },
        { icon: HandHeart, title: "ترتيبات مرنة", text: "نعمل معك لتحقيق التوازن بين تدريبك والتزاماتك الأكاديمية." },
      ],

      ctaTitle: "هل أنت مستعد لبدء مسيرتك القانونية؟",
      ctaSubtitle: "اتخذ الخطوة الأولى للانضمام إلى واحدة من مكاتب المحاماة الرائدة في المكسيك",
      ctaInstructions: "أرسل مواد طلبك إلى:",
      ctaNote: "يرجى تضمين 'طلب تدريب - [اسمك]' في سطر موضوع البريد الإلكتروني. نراجع الطلبات بشكل مستمر وسنتواصل مع المرشحين المؤهلين لإجراء المقابلات.",
      sendApplication: "إرسال الطلب",
      viewCareers: "عرض جميع الوظائف",
      contactTitle: "أسئلة؟",
      contactText: "هل لديك أسئلة حول برنامج التدريب لدينا؟ تواصل مع فريق التوظيف لدينا.",
    },
    ru: {
      heroTitle: "Программа стажировки",
      heroSubtitle: "Начните свою юридическую карьеру в одной из самых престижных юридических фирм Мексики. Получите практический опыт и развивайте необходимые навыки вместе с лидерами отрасли.",
      applyNow: "Подать заявку",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Обзор программы",
      programOverviewSubtitle: "Два пути для начала вашей юридической карьеры",
      summerProgramTitle: "Летняя стажировка",
      summerProgramDescription: "Наша программа летней стажировки проходит с июня по август, предлагая студентам юридических факультетов интенсивный опыт во время академических каникул. Летние стажеры участвуют в текущих делах в различных практических областях, посещают учебные сессии и получают представление о различных аспектах юридической практики.",
      summerProgramDuration: "Продолжительность: 10-12 недель (июнь - август)",
      permanentProgramTitle: "Постоянная стажировка",
      permanentProgramDescription: "Наша программа постоянной стажировки предназначена для студентов юридических факультетов последних курсов, которые могут посвящать неполный или полный рабочий день в течение учебного года. Постоянные стажеры развивают более глубокую экспертизу в конкретных практических областях и могут перейти на полноценную должность юриста после окончания учебы.",
      permanentProgramDuration: "Продолжительность: 6-12 месяцев (гибкий график)",

      whatYouLearnTitle: "Чему вы научитесь",
      whatYouLearnSubtitle: "Всестороннее развитие для будущих юристов",
      learningAreas: [
        { icon: Scale, title: "Рабочая динамика", text: "Получите опыт реальной юридической работы, помогая партнерам и юристам в текущих делах. Узнайте, как работает ведущая юридическая фирма изо дня в день." },
        { icon: Users, title: "Разнообразие и инклюзивность", text: "Поймите нашу приверженность D&I через учебные сессии и участие в инициативах фирмы. Ощутите рабочую среду, где каждый голос важен." },
        { icon: BookOpen, title: "Юридические исследования", text: "Освойте методологии юридических исследований, анализ дел и подготовку юридических меморандумов с использованием современных инструментов и баз данных." },
        { icon: Briefcase, title: "Обслуживание клиентов", text: "Развивайте навыки работы с клиентами, участвуя во встречах, готовя материалы для клиентов и понимая управление отношениями." },
        { icon: Lightbulb, title: "Профессиональная этика", text: "Изучите этические стандарты и лучшие практики, которые направляют юридическую профессию в Мексике и на международном уровне." },
        { icon: Building2, title: "Культура фирмы", text: "Погрузитесь в нашу культуру сотрудничества, налаживайте связи с юристами всех уровней и стройте прочные профессиональные отношения." },
      ],

      requirementsTitle: "Требования",
      requirementsSubtitle: "Что мы ищем в наших стажерах",
      requirements: [
        "В настоящее время обучается на юридической программе в аккредитованном университете",
        "Предпочтение отдается студентам 3 курса и старше",
        "Высокая академическая успеваемость (минимальный средний балл 8.5 или эквивалент)",
        "Отличные навыки письменного и устного общения на испанском языке",
        "Владение английским языком (предпочтительно средний или продвинутый уровень)",
        "Продемонстрированный интерес к корпоративному праву, судебным процессам или смежным областям",
        "Сильные аналитические способности и умение решать проблемы",
        "Доступность минимум 20 часов в неделю (постоянная программа)",
      ],

      applicationProcessTitle: "Процесс подачи заявки",
      applicationProcessSubtitle: "Как присоединиться к нашей программе стажировки",
      applicationSteps: [
        { step: "1", title: "Подать заявку", text: "Отправьте свое резюме, сопроводительное письмо, академические справки и две профессиональные или академические рекомендации нашей команде по подбору персонала." },
        { step: "2", title: "Первоначальный отбор", text: "Наша команда HR рассматривает все заявки и выбирает кандидатов для следующего этапа на основе квалификации и соответствия." },
        { step: "3", title: "Процесс собеседования", text: "Отобранные кандидаты участвуют в собеседованиях с HR и юристами из соответствующих практических областей." },
        { step: "4", title: "Предложение и адаптация", text: "Успешные кандидаты получают предложение и начинают нашу комплексную программу адаптации." },
      ],

      benefitsTitle: "Преимущества стажировки в Von Wobeser",
      benefitsSubtitle: "Инвестируйте в свое будущее вместе с нами",
      benefits: [
        { icon: Award, title: "Престижный опыт", text: "Добавьте в резюме опыт работы в ведущей мексиканской юридической фирме. Наша репутация открывает двери." },
        { icon: GraduationCap, title: "Программа наставничества", text: "Получите руководство от опытных юристов, которые инвестируют в ваше профессиональное развитие." },
        { icon: TrendingUp, title: "Карьерный рост", text: "Многие из наших юристов начинали как стажеры. Выдающиеся сотрудники могут получить предложения о постоянной работе." },
        { icon: Shield, title: "Конкурентная стипендия", text: "Получайте конкурентную ежемесячную стипендию, которая признает ценность вашего вклада." },
        { icon: Users, title: "Профессиональная сеть", text: "Стройте связи с ведущими юристами, клиентами и коллегами, которые будут длиться всю вашу карьеру." },
        { icon: HandHeart, title: "Гибкие условия", text: "Мы работаем с вами, чтобы сбалансировать стажировку с академическими обязательствами." },
      ],

      ctaTitle: "Готовы начать свою юридическую карьеру?",
      ctaSubtitle: "Сделайте первый шаг к присоединению к одной из ведущих юридических фирм Мексики",
      ctaInstructions: "Отправьте материалы заявки на:",
      ctaNote: "Пожалуйста, укажите 'Заявка на стажировку - [Ваше имя]' в теме письма. Мы рассматриваем заявки на постоянной основе и свяжемся с квалифицированными кандидатами для собеседования.",
      sendApplication: "Отправить заявку",
      viewCareers: "Все вакансии",
      contactTitle: "Вопросы?",
      contactText: "Есть вопросы о нашей программе стажировки? Свяжитесь с нашей командой по подбору персонала.",
    },
    fr: {
      heroTitle: "Programme de stage",
      heroSubtitle: "Lancez votre carrière juridique dans l'un des cabinets d'avocats les plus prestigieux du Mexique. Acquérez une expérience pratique et développez des compétences essentielles aux côtés des leaders du secteur.",
      applyNow: "Postuler maintenant",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Aperçu du programme",
      programOverviewSubtitle: "Deux voies pour démarrer votre carrière juridique",
      summerProgramTitle: "Stage d'été",
      summerProgramDescription: "Notre programme de stage d'été se déroule de juin à août, offrant aux étudiants en droit une expérience intensive pendant leurs vacances académiques. Les stagiaires d'été participent à des dossiers en cours dans plusieurs domaines de pratique, assistent à des sessions de formation et s'exposent à divers aspects de la pratique juridique.",
      summerProgramDuration: "Durée : 10-12 semaines (juin - août)",
      permanentProgramTitle: "Stage permanent",
      permanentProgramDescription: "Notre programme de stage permanent est conçu pour les étudiants en droit en dernière année qui peuvent consacrer des heures à temps partiel ou à temps plein tout au long de l'année académique. Les stagiaires permanents développent une expertise plus approfondie dans des domaines de pratique spécifiques et peuvent évoluer vers des postes d'associé à temps plein après l'obtention de leur diplôme.",
      permanentProgramDuration: "Durée : 6-12 mois (horaire flexible)",

      whatYouLearnTitle: "Ce que vous apprendrez",
      whatYouLearnSubtitle: "Développement complet pour les futurs professionnels du droit",
      learningAreas: [
        { icon: Scale, title: "Dynamique de travail", text: "Vivez le travail juridique réel en soutenant les associés et les avocats sur des dossiers actifs. Apprenez comment fonctionne un cabinet d'avocats de premier plan au quotidien." },
        { icon: Users, title: "Diversité et inclusion", text: "Comprenez notre engagement envers la D&I à travers des sessions de formation et la participation aux initiatives du cabinet. Vivez un environnement de travail où chaque voix compte." },
        { icon: BookOpen, title: "Recherche juridique", text: "Maîtrisez les méthodologies de recherche juridique, l'analyse de cas et la préparation de mémorandums juridiques en utilisant des outils et des bases de données de pointe." },
        { icon: Briefcase, title: "Service client", text: "Développez des compétences orientées client en participant aux réunions, en préparant les livrables clients et en comprenant la gestion des relations." },
        { icon: Lightbulb, title: "Éthique professionnelle", text: "Apprenez les normes éthiques et les meilleures pratiques qui guident la profession juridique au Mexique et à l'international." },
        { icon: Building2, title: "Culture du cabinet", text: "Immergez-vous dans notre culture collaborative, réseautez avec des avocats à tous les niveaux et construisez des relations professionnelles durables." },
      ],

      requirementsTitle: "Exigences",
      requirementsSubtitle: "Ce que nous recherchons chez nos stagiaires",
      requirements: [
        "Actuellement inscrit dans un programme de droit dans une université accréditée",
        "Étudiants en 3e année ou plus préférés",
        "Excellent dossier académique (moyenne minimale de 8,5 ou équivalent)",
        "Excellentes compétences en communication écrite et orale en espagnol",
        "Maîtrise de l'anglais (niveau intermédiaire à avancé préféré)",
        "Intérêt démontré pour le droit des affaires, le contentieux ou les domaines connexes",
        "Fortes capacités analytiques et de résolution de problèmes",
        "Disponibilité minimum de 20 heures par semaine (programme permanent)",
      ],

      applicationProcessTitle: "Processus de candidature",
      applicationProcessSubtitle: "Comment rejoindre notre programme de stage",
      applicationSteps: [
        { step: "1", title: "Soumettre la candidature", text: "Envoyez votre CV, lettre de motivation, relevés de notes et deux références professionnelles ou académiques à notre équipe de recrutement." },
        { step: "2", title: "Examen initial", text: "Notre équipe RH examine toutes les candidatures et sélectionne les candidats pour l'étape suivante en fonction des qualifications et de l'adéquation." },
        { step: "3", title: "Processus d'entretien", text: "Les candidats sélectionnés participent à des entretiens avec les RH et des avocats des domaines de pratique pertinents." },
        { step: "4", title: "Offre et intégration", text: "Les candidats retenus reçoivent une offre et commencent notre programme d'intégration complet." },
      ],

      benefitsTitle: "Avantages d'un stage chez Von Wobeser",
      benefitsSubtitle: "Investissez dans votre avenir avec nous",
      benefits: [
        { icon: Award, title: "Expérience prestigieuse", text: "Ajoutez une expérience dans un cabinet d'avocats mexicain de premier plan à votre CV. Notre réputation ouvre des portes." },
        { icon: GraduationCap, title: "Programme de mentorat", text: "Recevez des conseils d'avocats expérimentés qui investissent dans votre développement professionnel." },
        { icon: TrendingUp, title: "Évolution de carrière", text: "Beaucoup de nos associés ont commencé comme stagiaires. Les performances exceptionnelles peuvent recevoir des offres à temps plein." },
        { icon: Shield, title: "Indemnité compétitive", text: "Recevez une indemnité mensuelle compétitive qui reconnaît la valeur de vos contributions." },
        { icon: Users, title: "Réseau professionnel", text: "Construisez des connexions avec des professionnels du droit de premier plan, des clients et des pairs qui durent tout au long de votre carrière." },
        { icon: HandHeart, title: "Arrangements flexibles", text: "Nous travaillons avec vous pour équilibrer votre stage avec vos engagements académiques." },
      ],

      ctaTitle: "Prêt à démarrer votre carrière juridique ?",
      ctaSubtitle: "Faites le premier pas pour rejoindre l'un des cabinets d'avocats leaders du Mexique",
      ctaInstructions: "Envoyez vos documents de candidature à :",
      ctaNote: "Veuillez inclure 'Candidature de stage - [Votre nom]' dans l'objet de votre email. Nous examinons les candidatures en continu et contacterons les candidats qualifiés pour des entretiens.",
      sendApplication: "Envoyer la candidature",
      viewCareers: "Voir toutes les carrières",
      contactTitle: "Questions ?",
      contactText: "Vous avez des questions sur notre programme de stage ? Contactez notre équipe de recrutement.",
    },
    it: {
      heroTitle: "Programma di tirocinio",
      heroSubtitle: "Inizia la tua carriera legale presso uno degli studi legali più prestigiosi del Messico. Acquisisci esperienza pratica e sviluppa competenze essenziali al fianco dei leader del settore.",
      applyNow: "Candidati ora",
      applyEmail: "reclutamiento@vonwobeser.com",
      
      programOverviewTitle: "Panoramica del programma",
      programOverviewSubtitle: "Due percorsi per iniziare la tua carriera legale",
      summerProgramTitle: "Tirocinio estivo",
      summerProgramDescription: "Il nostro programma di tirocinio estivo si svolge da giugno ad agosto, offrendo agli studenti di giurisprudenza un'esperienza intensiva durante la pausa accademica. I tirocinanti estivi partecipano a casi in corso in diverse aree di pratica, frequentano sessioni di formazione e acquisiscono esposizione a vari aspetti della pratica legale.",
      summerProgramDuration: "Durata: 10-12 settimane (giugno - agosto)",
      permanentProgramTitle: "Tirocinio permanente",
      permanentProgramDescription: "Il nostro programma di tirocinio permanente è progettato per studenti di giurisprudenza negli ultimi anni che possono dedicare ore part-time o full-time durante l'anno accademico. I tirocinanti permanenti sviluppano competenze più approfondite in aree di pratica specifiche e possono passare a posizioni di associato a tempo pieno dopo la laurea.",
      permanentProgramDuration: "Durata: 6-12 mesi (orario flessibile)",

      whatYouLearnTitle: "Cosa imparerai",
      whatYouLearnSubtitle: "Sviluppo completo per aspiranti professionisti legali",
      learningAreas: [
        { icon: Scale, title: "Dinamiche lavorative", text: "Sperimenta il lavoro legale reale supportando partner e associati in casi attivi. Impara come funziona quotidianamente uno studio legale di primo livello." },
        { icon: Users, title: "Diversità e inclusione", text: "Comprendi il nostro impegno per D&I attraverso sessioni di formazione e partecipazione alle iniziative dello studio. Vivi un ambiente di lavoro dove ogni voce conta." },
        { icon: BookOpen, title: "Ricerca legale", text: "Padroneggia le metodologie di ricerca legale, l'analisi dei casi e la preparazione di memorandum legali utilizzando strumenti e database all'avanguardia." },
        { icon: Briefcase, title: "Servizio clienti", text: "Sviluppa competenze orientate al cliente partecipando a riunioni, preparando deliverable per i clienti e comprendendo la gestione delle relazioni." },
        { icon: Lightbulb, title: "Etica professionale", text: "Impara gli standard etici e le migliori pratiche che guidano la professione legale in Messico e a livello internazionale." },
        { icon: Building2, title: "Cultura dello studio", text: "Immergiti nella nostra cultura collaborativa, fai networking con avvocati a tutti i livelli e costruisci relazioni professionali durature." },
      ],

      requirementsTitle: "Requisiti",
      requirementsSubtitle: "Cosa cerchiamo nei nostri tirocinanti",
      requirements: [
        "Attualmente iscritto a un programma di giurisprudenza presso un'università accreditata",
        "Preferenza per studenti del 3° anno o superiore",
        "Ottimo curriculum accademico (media minima 8,5 o equivalente)",
        "Eccellenti capacità di comunicazione scritta e orale in spagnolo",
        "Conoscenza dell'inglese (livello intermedio-avanzato preferito)",
        "Interesse dimostrato per il diritto societario, il contenzioso o campi correlati",
        "Forti capacità analitiche e di problem-solving",
        "Disponibilità minima di 20 ore settimanali (programma permanente)",
      ],

      applicationProcessTitle: "Processo di candidatura",
      applicationProcessSubtitle: "Come partecipare al nostro programma di tirocinio",
      applicationSteps: [
        { step: "1", title: "Invia candidatura", text: "Invia il tuo CV, lettera di presentazione, trascrizioni accademiche e due referenze professionali o accademiche al nostro team di reclutamento." },
        { step: "2", title: "Revisione iniziale", text: "Il nostro team HR esamina tutte le candidature e seleziona i candidati per la fase successiva in base alle qualifiche e all'idoneità." },
        { step: "3", title: "Processo di colloquio", text: "I candidati selezionati partecipano a colloqui con HR e avvocati delle aree di pratica pertinenti." },
        { step: "4", title: "Offerta e onboarding", text: "I candidati idonei ricevono un'offerta e iniziano il nostro programma di onboarding completo." },
      ],

      benefitsTitle: "Vantaggi del tirocinio presso Von Wobeser",
      benefitsSubtitle: "Investi nel tuo futuro con noi",
      benefits: [
        { icon: Award, title: "Esperienza prestigiosa", text: "Aggiungi al tuo curriculum un'esperienza presso uno studio legale messicano di primo livello. La nostra reputazione apre le porte." },
        { icon: GraduationCap, title: "Programma di mentoring", text: "Ricevi la guida di avvocati esperti che investono nel tuo sviluppo professionale." },
        { icon: TrendingUp, title: "Crescita professionale", text: "Molti dei nostri associati hanno iniziato come tirocinanti. Le performance eccezionali possono ricevere offerte a tempo pieno." },
        { icon: Shield, title: "Compenso competitivo", text: "Ricevi un compenso mensile competitivo che riconosce il valore dei tuoi contributi." },
        { icon: Users, title: "Network professionale", text: "Costruisci connessioni con professionisti legali di spicco, clienti e colleghi che durano per tutta la carriera." },
        { icon: HandHeart, title: "Accordi flessibili", text: "Lavoriamo con te per bilanciare il tirocinio con gli impegni accademici." },
      ],

      ctaTitle: "Pronto a iniziare la tua carriera legale?",
      ctaSubtitle: "Fai il primo passo per entrare in uno degli studi legali leader del Messico",
      ctaInstructions: "Invia i tuoi materiali di candidatura a:",
      ctaNote: "Per favore includi 'Candidatura tirocinio - [Il tuo nome]' nell'oggetto dell'email. Esaminiamo le candidature su base continua e contatteremo i candidati qualificati per i colloqui.",
      sendApplication: "Invia candidatura",
      viewCareers: "Vedi tutte le carriere",
      contactTitle: "Domande?",
      contactText: "Hai domande sul nostro programma di tirocinio? Contatta il nostro team di reclutamento.",
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
    <div className="min-h-screen bg-background" data-testid="page-interns">
      <SEOHead page="interns" language={language} />
      <Header />
      
      <section className="pt-32 pb-16 bg-primary" data-testid="section-interns-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-3xl md:text-4xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]"
              data-testid="text-interns-title"
            >
              {t.heroTitle}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-3xl mx-auto mb-8"
              data-testid="text-interns-subtitle"
            >
              {t.heroSubtitle}
            </p>
            <Button 
              className="rounded-md"
              variant="secondary"
              size="lg"
              asChild
              data-testid="button-hero-apply"
            >
              <a href={`mailto:${t.applyEmail}?subject=Internship Application`}>
                <GraduationCap className="w-5 h-5 mr-2" />
                {t.applyNow}
              </a>
            </Button>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-20"
            data-testid="section-program-overview"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-[#AA1A2E] mb-4 uppercase tracking-[0.12em]"
                data-testid="text-program-overview-title"
              >
                {t.programOverviewTitle}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t.programOverviewSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="rounded-md border border-border" data-testid="card-summer-program">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-foreground">
                    <Calendar className="w-6 h-6 text-primary" />
                    {t.summerProgramTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t.summerProgramDescription}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {t.summerProgramDuration}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-border" data-testid="card-permanent-program">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl font-heading font-light text-foreground">
                    <Briefcase className="w-6 h-6 text-primary" />
                    {t.permanentProgramTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    {t.permanentProgramDescription}
                  </p>
                  <Badge variant="secondary" className="text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {t.permanentProgramDuration}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-what-you-learn"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-[#AA1A2E] mb-4 uppercase tracking-[0.12em]"
                data-testid="text-what-you-learn-title"
              >
                {t.whatYouLearnTitle}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.whatYouLearnSubtitle}
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.learningAreas.map((area, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-md border border-border h-full"
                    data-testid={`card-learning-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <area.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {area.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {area.text}
                          </p>
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
            data-testid="section-requirements"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-[#AA1A2E] mb-4 uppercase tracking-[0.12em]"
                data-testid="text-requirements-title"
              >
                {t.requirementsTitle}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.requirementsSubtitle}
              </p>
            </div>

            <Card className="rounded-md border border-border bg-muted" data-testid="card-requirements">
              <CardContent className="p-8">
                <motion.ul 
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {t.requirements.map((requirement, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-3"
                      variants={itemVariants}
                      data-testid={`requirement-${index}`}
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{requirement}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-20"
            data-testid="section-application-process"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-[#AA1A2E] mb-4 uppercase tracking-[0.12em]"
                data-testid="text-application-process-title"
              >
                {t.applicationProcessTitle}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.applicationProcessSubtitle}
              </p>
            </div>

            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {t.applicationSteps.map((step, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card 
                    className="rounded-md border border-border h-full text-center"
                    data-testid={`card-step-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                        {step.step}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.text}
                      </p>
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
            data-testid="section-benefits"
          >
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-heading font-light text-[#AA1A2E] mb-4 uppercase tracking-[0.12em]"
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
                  <Card 
                    className="rounded-md border border-border h-full"
                    data-testid={`card-benefit-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <benefit.icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {benefit.text}
                          </p>
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
            className="mb-12"
            data-testid="section-cta"
          >
            <Card className="rounded-md border border-border bg-primary text-white overflow-hidden">
              <CardContent className="p-8 lg:p-12 text-center">
                <h2 
                  className="text-xl md:text-2xl font-heading font-light mb-4 uppercase tracking-[0.12em]"
                  data-testid="text-cta-title"
                >
                  {t.ctaTitle}
                </h2>
                <p className="text-lg text-white/90 max-w-2xl mx-auto mb-6">
                  {t.ctaSubtitle}
                </p>
                <p className="text-white/80 mb-2">
                  {t.ctaInstructions}
                </p>
                <p className="text-xl font-semibold mb-6">
                  {t.applyEmail}
                </p>
                <p className="text-sm text-white/70 max-w-2xl mx-auto mb-8">
                  {t.ctaNote}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="secondary"
                    size="lg"
                    className="rounded-md"
                    asChild
                    data-testid="button-cta-apply"
                  >
                    <a href={`mailto:${t.applyEmail}?subject=Internship Application`}>
                      <Mail className="w-5 h-5 mr-2" />
                      {t.sendApplication}
                    </a>
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    className="rounded-md bg-card/10 border-white/20 text-white hover:bg-white/20"
                    asChild
                    data-testid="button-view-careers"
                  >
                    <Link href="/careers">
                      <ArrowRight className="w-5 h-5 mr-2" />
                      {t.viewCareers}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            data-testid="section-contact"
          >
            <Card className="rounded-md border border-border" data-testid="card-contact">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {t.contactTitle}
                  </h3>
                  <p className="text-muted-foreground">
                    {t.contactText}
                  </p>
                </div>
                <Button 
                  className="rounded-md whitespace-nowrap"
                  asChild
                  data-testid="button-contact-email"
                >
                  <a href={`mailto:${t.applyEmail}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    {t.applyEmail}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
