import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Globe2, 
  Building2, 
  Briefcase, 
  ArrowRight,
  Users,
  Scale,
  Car,
  Pill,
  Zap,
  Handshake,
  GraduationCap,
  Award,
  MapPin,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { NumberedCard } from "@/components/editorial";

export default function GermanDesk() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "German Desk",
      subtitle: "Your trusted legal partner for German and Austrian businesses in Mexico",
      experienceTitle: "Over 34 Years of Experience",
      experienceText1: "For more than 34 years, Von Wobeser y Sierra has been the trusted legal advisor for German and Austrian companies establishing and expanding their operations in Mexico. Our German Desk provides specialized legal services tailored to the unique needs of German-speaking clients.",
      experienceText2: "We understand the business culture, legal expectations, and communication preferences of German and Austrian companies. This deep understanding, combined with our expertise in Mexican law, positions us as the ideal bridge between European business practices and the Mexican legal landscape.",
      teamTitle: "Our German-Speaking Team",
      teamSubtitle: "Attorneys with roots in Germany and Austria",
      teamIntro: "Our German Desk is staffed by attorneys who have received their legal education in Germany and Austria, bringing authentic insight into European legal frameworks and business practices. This bilingual and bicultural expertise ensures seamless communication and culturally informed legal counsel.",
      teamHighlights: [
        { icon: GraduationCap, title: "German & Austrian Legal Education", text: "Our attorneys have studied law in Germany and Austria, providing firsthand knowledge of European legal principles and practices." },
        { icon: Globe2, title: "Bilingual Communication", text: "Fluent in German, English, and Spanish, our team ensures clear and precise communication at every stage of your legal matters." },
        { icon: Handshake, title: "Cultural Understanding", text: "We bridge the gap between German business culture and Mexican legal practice, ensuring your expectations are met with precision and professionalism." },
        { icon: Award, title: "Recognized Excellence", text: "Our German Desk has been recognized by leading legal directories for its outstanding service to German and Austrian clients." },
      ],
      servicesTitle: "Core Practice Areas",
      servicesSubtitle: "Comprehensive legal solutions for your business in Mexico",
      services: [
        { icon: Building2, title: "Corporate & M&A", text: "Formation, restructuring, mergers, acquisitions, and corporate governance for your Mexican operations." },
        { icon: Briefcase, title: "Foreign Investment", text: "Regulatory compliance, investment structuring, and market entry strategies for German and Austrian investors." },
        { icon: Car, title: "Automotive Industry", text: "Specialized counsel for the automotive sector, including supply chain, manufacturing, and distribution agreements." },
        { icon: Pill, title: "Pharmaceutical & Healthcare", text: "Regulatory matters, licensing, and commercial transactions in the pharmaceutical and healthcare industries." },
        { icon: Zap, title: "Energy & Infrastructure", text: "Legal support for energy projects, infrastructure investments, and regulatory compliance." },
        { icon: Scale, title: "Commercial Litigation", text: "Dispute resolution, arbitration, and litigation services to protect your business interests in Mexico." },
      ],
      differentiatorTitle: "Why Choose Our German Desk?",
      differentiatorSubtitle: "Cultural understanding as our key differentiator",
      differentiatorIntro: "What sets our German Desk apart is our genuine understanding of German and Austrian business culture. We don't just speak your language—we understand your expectations for precision, thoroughness, and reliability. Our attorneys anticipate your needs and deliver legal services that align with the high standards you expect.",
      differentiatorPoints: [
        { icon: Clock, title: "Punctuality & Reliability", text: "We respect your time and deliver on our commitments with German precision." },
        { icon: Users, title: "Direct Communication", text: "Clear, straightforward communication without unnecessary complexity or delays." },
        { icon: Scale, title: "Thoroughness", text: "Comprehensive analysis and attention to detail in every matter we handle." },
        { icon: MapPin, title: "Local Expertise", text: "Deep knowledge of Mexican law combined with understanding of your home legal system." },
      ],
      statsTitle: "German Desk by the Numbers",
      stats: [
        { value: "34+", label: "Years of Experience" },
        { value: "100+", label: "German & Austrian Clients Served" },
        { value: "5", label: "German-Speaking Attorneys" },
        { value: "Band 1", label: "Chambers Latin America Ranking" },
      ],
      ctaTitle: "Partner with Us",
      ctaText: "Discover how our German Desk can support your business objectives in Mexico. Contact our team for a consultation.",
      viewPractice: "View German Desk Practice",
      contactUs: "Contact Us",
      learnMore: "Learn More",
    },
    es: {
      title: "German Desk",
      subtitle: "Su socio legal de confianza para empresas alemanas y austriacas en México",
      experienceTitle: "Más de 34 Años de Experiencia",
      experienceText1: "Durante más de 34 años, Von Wobeser y Sierra ha sido el asesor legal de confianza para empresas alemanas y austriacas que establecen y expanden sus operaciones en México. Nuestro German Desk proporciona servicios legales especializados adaptados a las necesidades únicas de clientes de habla alemana.",
      experienceText2: "Entendemos la cultura empresarial, las expectativas legales y las preferencias de comunicación de las empresas alemanas y austriacas. Esta profunda comprensión, combinada con nuestra experiencia en derecho mexicano, nos posiciona como el puente ideal entre las prácticas comerciales europeas y el panorama legal mexicano.",
      teamTitle: "Nuestro Equipo de Habla Alemana",
      teamSubtitle: "Abogados con raíces en Alemania y Austria",
      teamIntro: "Nuestro German Desk cuenta con abogados que han recibido su educación legal en Alemania y Austria, aportando una visión auténtica de los marcos legales y prácticas comerciales europeas. Esta experiencia bilingüe y bicultural garantiza una comunicación fluida y un asesoramiento legal culturalmente informado.",
      teamHighlights: [
        { icon: GraduationCap, title: "Educación Legal Alemana y Austriaca", text: "Nuestros abogados han estudiado derecho en Alemania y Austria, proporcionando conocimiento de primera mano de los principios y prácticas legales europeos." },
        { icon: Globe2, title: "Comunicación Bilingüe", text: "Fluidos en alemán, inglés y español, nuestro equipo asegura una comunicación clara y precisa en cada etapa de sus asuntos legales." },
        { icon: Handshake, title: "Entendimiento Cultural", text: "Cerramos la brecha entre la cultura empresarial alemana y la práctica legal mexicana, asegurando que sus expectativas se cumplan con precisión y profesionalismo." },
        { icon: Award, title: "Excelencia Reconocida", text: "Nuestro German Desk ha sido reconocido por los principales directorios legales por su destacado servicio a clientes alemanes y austriacos." },
      ],
      servicesTitle: "Áreas de Práctica Principales",
      servicesSubtitle: "Soluciones legales integrales para su negocio en México",
      services: [
        { icon: Building2, title: "Corporativo y M&A", text: "Constitución, reestructuración, fusiones, adquisiciones y gobierno corporativo para sus operaciones en México." },
        { icon: Briefcase, title: "Inversión Extranjera", text: "Cumplimiento regulatorio, estructuración de inversiones y estrategias de entrada al mercado para inversionistas alemanes y austriacos." },
        { icon: Car, title: "Industria Automotriz", text: "Asesoría especializada para el sector automotriz, incluyendo cadena de suministro, manufactura y acuerdos de distribución." },
        { icon: Pill, title: "Farmacéutico y Salud", text: "Asuntos regulatorios, licencias y transacciones comerciales en las industrias farmacéutica y de salud." },
        { icon: Zap, title: "Energía e Infraestructura", text: "Apoyo legal para proyectos de energía, inversiones en infraestructura y cumplimiento regulatorio." },
        { icon: Scale, title: "Litigio Comercial", text: "Resolución de disputas, arbitraje y servicios de litigio para proteger sus intereses comerciales en México." },
      ],
      differentiatorTitle: "¿Por Qué Elegir Nuestro German Desk?",
      differentiatorSubtitle: "El entendimiento cultural como nuestro diferenciador clave",
      differentiatorIntro: "Lo que distingue a nuestro German Desk es nuestra genuina comprensión de la cultura empresarial alemana y austriaca. No solo hablamos su idioma—entendemos sus expectativas de precisión, minuciosidad y confiabilidad. Nuestros abogados anticipan sus necesidades y entregan servicios legales que se alinean con los altos estándares que usted espera.",
      differentiatorPoints: [
        { icon: Clock, title: "Puntualidad y Confiabilidad", text: "Respetamos su tiempo y cumplimos nuestros compromisos con precisión alemana." },
        { icon: Users, title: "Comunicación Directa", text: "Comunicación clara y directa sin complejidad ni retrasos innecesarios." },
        { icon: Scale, title: "Minuciosidad", text: "Análisis integral y atención al detalle en cada asunto que manejamos." },
        { icon: MapPin, title: "Experiencia Local", text: "Profundo conocimiento del derecho mexicano combinado con entendimiento de su sistema legal de origen." },
      ],
      statsTitle: "German Desk en Números",
      stats: [
        { value: "34+", label: "Años de Experiencia" },
        { value: "100+", label: "Clientes Alemanes y Austriacos Atendidos" },
        { value: "5", label: "Abogados de Habla Alemana" },
        { value: "Banda 1", label: "Ranking Chambers Latin America" },
      ],
      ctaTitle: "Asóciese con Nosotros",
      ctaText: "Descubra cómo nuestro German Desk puede apoyar sus objetivos de negocio en México. Contacte a nuestro equipo para una consulta.",
      viewPractice: "Ver Práctica German Desk",
      contactUs: "Contáctenos",
      learnMore: "Conocer Más",
    },
    de: {
      title: "German Desk",
      subtitle: "Ihre Brücke zwischen Deutschland und Mexiko",
      experienceTitle: "Über 34 Jahre Erfahrung",
      experienceText1: "Seit mehr als 34 Jahren ist Von Wobeser y Sierra der vertrauenswürdige Rechtsberater für deutsche und österreichische Unternehmen, die ihre Geschäftstätigkeit in Mexiko aufbauen und erweitern. Unser German Desk bietet spezialisierte Rechtsdienstleistungen, die auf die besonderen Bedürfnisse deutschsprachiger Mandanten zugeschnitten sind.",
      experienceText2: "Wir verstehen die Geschäftskultur, die rechtlichen Erwartungen und die Kommunikationspräferenzen deutscher und österreichischer Unternehmen. Dieses tiefe Verständnis, kombiniert mit unserer Expertise im mexikanischen Recht, positioniert uns als ideale Brücke zwischen europäischen Geschäftspraktiken und der mexikanischen Rechtslandschaft.",
      teamTitle: "Unser deutschsprachiges Team",
      teamSubtitle: "Anwälte mit Wurzeln in Deutschland und Österreich",
      teamIntro: "Unser German Desk ist mit Anwälten besetzt, die ihre juristische Ausbildung in Deutschland und Österreich absolviert haben und authentische Einblicke in europäische Rechtsrahmen und Geschäftspraktiken mitbringen. Diese zweisprachige und bikulturelle Expertise gewährleistet nahtlose Kommunikation und kulturell fundierte Rechtsberatung.",
      teamHighlights: [
        { icon: GraduationCap, title: "Deutsche und österreichische Rechtsausbildung", text: "Unsere Anwälte haben in Deutschland und Österreich Jura studiert und bringen fundierte Kenntnisse europäischer Rechtsprinzipien und -praktiken mit." },
        { icon: Globe2, title: "Zweisprachige Kommunikation", text: "Fließend in Deutsch, Englisch und Spanisch, gewährleistet unser Team klare und präzise Kommunikation in jeder Phase Ihrer Rechtsangelegenheiten." },
        { icon: Handshake, title: "Kulturelles Verständnis", text: "Wir überbrücken die Kluft zwischen deutscher Geschäftskultur und mexikanischer Rechtspraxis und stellen sicher, dass Ihre Erwartungen mit Präzision und Professionalität erfüllt werden." },
        { icon: Award, title: "Anerkannte Exzellenz", text: "Unser German Desk wurde von führenden Rechtsverzeichnissen für seinen hervorragenden Service für deutsche und österreichische Mandanten ausgezeichnet." },
      ],
      servicesTitle: "Kernpraxisbereiche",
      servicesSubtitle: "Umfassende Rechtslösungen für Ihr Geschäft in Mexiko",
      services: [
        { icon: Building2, title: "Gesellschaftsrecht & M&A", text: "Gründung, Restrukturierung, Fusionen, Übernahmen und Corporate Governance für Ihre mexikanischen Geschäftstätigkeiten." },
        { icon: Briefcase, title: "Auslandsinvestitionen", text: "Regulatorische Compliance, Investitionsstrukturierung und Markteintrittsstrategien für deutsche und österreichische Investoren." },
        { icon: Car, title: "Automobilindustrie", text: "Spezialisierte Beratung für den Automobilsektor, einschließlich Lieferkette, Fertigung und Vertriebsvereinbarungen." },
        { icon: Pill, title: "Pharma & Gesundheitswesen", text: "Regulatorische Angelegenheiten, Lizenzierung und kommerzielle Transaktionen in der Pharma- und Gesundheitsbranche." },
        { icon: Zap, title: "Energie & Infrastruktur", text: "Rechtliche Unterstützung für Energieprojekte, Infrastrukturinvestitionen und regulatorische Compliance." },
        { icon: Scale, title: "Handelsstreitigkeiten", text: "Streitbeilegung, Schiedsverfahren und Prozessführung zum Schutz Ihrer Geschäftsinteressen in Mexiko." },
      ],
      differentiatorTitle: "Warum unser German Desk wählen?",
      differentiatorSubtitle: "Kulturelles Verständnis als unser Schlüsselmerkmal",
      differentiatorIntro: "Was unser German Desk auszeichnet, ist unser echtes Verständnis der deutschen und österreichischen Geschäftskultur. Wir sprechen nicht nur Ihre Sprache – wir verstehen Ihre Erwartungen an Präzision, Gründlichkeit und Zuverlässigkeit. Unsere Anwälte antizipieren Ihre Bedürfnisse und liefern Rechtsdienstleistungen, die den hohen Standards entsprechen, die Sie erwarten.",
      differentiatorPoints: [
        { icon: Clock, title: "Pünktlichkeit & Zuverlässigkeit", text: "Wir respektieren Ihre Zeit und halten unsere Zusagen mit deutscher Präzision ein." },
        { icon: Users, title: "Direkte Kommunikation", text: "Klare, unkomplizierte Kommunikation ohne unnötige Komplexität oder Verzögerungen." },
        { icon: Scale, title: "Gründlichkeit", text: "Umfassende Analyse und Liebe zum Detail in jeder Angelegenheit, die wir bearbeiten." },
        { icon: MapPin, title: "Lokale Expertise", text: "Tiefgreifende Kenntnisse des mexikanischen Rechts kombiniert mit Verständnis Ihres heimischen Rechtssystems." },
      ],
      statsTitle: "German Desk in Zahlen",
      stats: [
        { value: "34+", label: "Jahre Erfahrung" },
        { value: "100+", label: "Deutsche und österreichische Mandanten betreut" },
        { value: "5", label: "Deutschsprachige Anwälte" },
        { value: "Band 1", label: "Chambers Latin America Ranking" },
      ],
      ctaTitle: "Werden Sie unser Partner",
      ctaText: "Entdecken Sie, wie unser German Desk Ihre Geschäftsziele in Mexiko unterstützen kann. Kontaktieren Sie unser Team für eine Beratung.",
      viewPractice: "German Desk Praxis ansehen",
      contactUs: "Kontakt",
      learnMore: "Mehr erfahren",
    },
    zh: {
      title: "德国业务部",
      subtitle: "连接德国与墨西哥的桥梁",
      experienceTitle: "超过34年的经验",
      experienceText1: "34年来，Von Wobeser y Sierra一直是德国和奥地利企业在墨西哥设立和扩展业务的可信赖法律顾问。我们的德国业务部提供专业的法律服务，针对德语客户的独特需求量身定制。",
      experienceText2: "我们理解德国和奥地利企业的商业文化、法律期望和沟通偏好。这种深刻的理解，结合我们在墨西哥法律方面的专业知识，使我们成为欧洲商业惯例与墨西哥法律环境之间的理想桥梁。",
      teamTitle: "我们的德语团队",
      teamSubtitle: "来自德国和奥地利的律师",
      teamIntro: "我们的德国业务部由在德国和奥地利接受法律教育的律师组成，他们对欧洲法律框架和商业惯例有着真实的洞察力。这种双语和双文化的专业知识确保了无缝沟通和文化知情的法律咨询。",
      teamHighlights: [
        { icon: GraduationCap, title: "德国和奥地利法律教育", text: "我们的律师在德国和奥地利学习法律，提供欧洲法律原则和实践的第一手知识。" },
        { icon: Globe2, title: "双语沟通", text: "精通德语、英语和西班牙语，我们的团队确保在您法律事务的每个阶段进行清晰准确的沟通。" },
        { icon: Handshake, title: "文化理解", text: "我们弥合德国商业文化与墨西哥法律实践之间的差距，确保您的期望以精确和专业的方式得到满足。" },
        { icon: Award, title: "公认的卓越", text: "我们的德国业务部因其对德国和奥地利客户的杰出服务而受到领先法律目录的认可。" },
      ],
      servicesTitle: "核心业务领域",
      servicesSubtitle: "为您在墨西哥的业务提供全面的法律解决方案",
      services: [
        { icon: Building2, title: "公司与并购", text: "为您在墨西哥的业务提供设立、重组、合并、收购和公司治理服务。" },
        { icon: Briefcase, title: "外国投资", text: "为德国和奥地利投资者提供监管合规、投资结构和市场进入策略。" },
        { icon: Car, title: "汽车行业", text: "为汽车行业提供专业咨询，包括供应链、制造和分销协议。" },
        { icon: Pill, title: "制药与医疗保健", text: "制药和医疗保健行业的监管事务、许可和商业交易。" },
        { icon: Zap, title: "能源与基础设施", text: "为能源项目、基础设施投资和监管合规提供法律支持。" },
        { icon: Scale, title: "商业诉讼", text: "争议解决、仲裁和诉讼服务，保护您在墨西哥的商业利益。" },
      ],
      differentiatorTitle: "为什么选择我们的德国业务部？",
      differentiatorSubtitle: "文化理解是我们的关键差异化优势",
      differentiatorIntro: "使我们德国业务部与众不同的是我们对德国和奥地利商业文化的真正理解。我们不仅会说您的语言——我们理解您对精确、彻底和可靠的期望。我们的律师预见您的需求，提供符合您所期望的高标准的法律服务。",
      differentiatorPoints: [
        { icon: Clock, title: "守时与可靠", text: "我们尊重您的时间，以德国式的精准履行承诺。" },
        { icon: Users, title: "直接沟通", text: "清晰、直接的沟通，没有不必要的复杂性或延迟。" },
        { icon: Scale, title: "彻底性", text: "在我们处理的每个事项中进行全面分析和关注细节。" },
        { icon: MapPin, title: "本地专业知识", text: "深入了解墨西哥法律，同时理解您本国的法律体系。" },
      ],
      statsTitle: "德国业务部数据",
      stats: [
        { value: "34+", label: "年经验" },
        { value: "100+", label: "服务的德国和奥地利客户" },
        { value: "5", label: "德语律师" },
        { value: "Band 1", label: "Chambers Latin America排名" },
      ],
      ctaTitle: "与我们合作",
      ctaText: "了解我们的德国业务部如何支持您在墨西哥的业务目标。联系我们的团队进行咨询。",
      viewPractice: "查看德国业务部实践",
      contactUs: "联系我们",
      learnMore: "了解更多",
    },
    ko: {
      title: "독일 데스크",
      subtitle: "독일과 멕시코를 잇는 신뢰할 수 있는 법률 파트너",
      experienceTitle: "34년 이상의 경험",
      experienceText1: "34년 이상 Von Wobeser y Sierra는 멕시코에서 사업을 설립하고 확장하는 독일 및 오스트리아 기업들의 신뢰받는 법률 자문사였습니다. 저희 독일 데스크는 독일어권 고객의 고유한 요구에 맞춘 전문 법률 서비스를 제공합니다.",
      experienceText2: "우리는 독일 및 오스트리아 기업의 비즈니스 문화, 법적 기대 및 커뮤니케이션 선호도를 이해합니다. 멕시코 법률에 대한 전문 지식과 결합된 이 깊은 이해는 유럽 비즈니스 관행과 멕시코 법률 환경 사이의 이상적인 가교 역할을 합니다.",
      teamTitle: "독일어를 구사하는 팀",
      teamSubtitle: "독일과 오스트리아에 뿌리를 둔 변호사",
      teamIntro: "저희 독일 데스크는 독일과 오스트리아에서 법률 교육을 받은 변호사들로 구성되어 있으며, 유럽 법적 프레임워크와 비즈니스 관행에 대한 진정한 통찰력을 제공합니다. 이 이중 언어 및 이중 문화 전문 지식은 원활한 커뮤니케이션과 문화적으로 정보에 입각한 법률 자문을 보장합니다.",
      teamHighlights: [
        { icon: GraduationCap, title: "독일 및 오스트리아 법률 교육", text: "저희 변호사들은 독일과 오스트리아에서 법학을 공부하여 유럽 법률 원칙과 관행에 대한 직접적인 지식을 제공합니다." },
        { icon: Globe2, title: "이중 언어 커뮤니케이션", text: "독일어, 영어, 스페인어에 능통한 저희 팀은 법률 문제의 모든 단계에서 명확하고 정확한 커뮤니케이션을 보장합니다." },
        { icon: Handshake, title: "문화적 이해", text: "독일 비즈니스 문화와 멕시코 법률 관행 사이의 격차를 해소하여 정확성과 전문성으로 기대에 부응합니다." },
        { icon: Award, title: "인정받는 우수성", text: "저희 독일 데스크는 독일 및 오스트리아 고객에 대한 탁월한 서비스로 주요 법률 디렉토리의 인정을 받았습니다." },
      ],
      servicesTitle: "핵심 업무 영역",
      servicesSubtitle: "멕시코 비즈니스를 위한 포괄적인 법률 솔루션",
      services: [
        { icon: Building2, title: "기업법 & M&A", text: "멕시코 사업을 위한 설립, 구조조정, 합병, 인수 및 기업 거버넌스." },
        { icon: Briefcase, title: "외국인 투자", text: "독일 및 오스트리아 투자자를 위한 규제 준수, 투자 구조화 및 시장 진입 전략." },
        { icon: Car, title: "자동차 산업", text: "공급망, 제조 및 유통 계약을 포함한 자동차 부문 전문 자문." },
        { icon: Pill, title: "제약 및 헬스케어", text: "제약 및 헬스케어 산업의 규제 문제, 라이선스 및 상업 거래." },
        { icon: Zap, title: "에너지 및 인프라", text: "에너지 프로젝트, 인프라 투자 및 규제 준수를 위한 법률 지원." },
        { icon: Scale, title: "상업 소송", text: "멕시코에서 비즈니스 이익을 보호하기 위한 분쟁 해결, 중재 및 소송 서비스." },
      ],
      differentiatorTitle: "왜 저희 독일 데스크를 선택해야 할까요?",
      differentiatorSubtitle: "문화적 이해가 핵심 차별화 요소입니다",
      differentiatorIntro: "저희 독일 데스크를 차별화하는 것은 독일과 오스트리아 비즈니스 문화에 대한 진정한 이해입니다. 저희는 귀하의 언어만 구사하는 것이 아니라 정확성, 철저함, 신뢰성에 대한 귀하의 기대를 이해합니다. 저희 변호사들은 귀하의 요구를 예측하고 귀하가 기대하는 높은 기준에 부합하는 법률 서비스를 제공합니다.",
      differentiatorPoints: [
        { icon: Clock, title: "시간 엄수 및 신뢰성", text: "저희는 귀하의 시간을 존중하고 독일식 정확성으로 약속을 이행합니다." },
        { icon: Users, title: "직접적인 커뮤니케이션", text: "불필요한 복잡성이나 지연 없이 명확하고 직접적인 커뮤니케이션." },
        { icon: Scale, title: "철저함", text: "저희가 처리하는 모든 문제에서 포괄적인 분석과 세부 사항에 대한 주의." },
        { icon: MapPin, title: "현지 전문 지식", text: "귀하의 본국 법률 시스템에 대한 이해와 결합된 멕시코 법률에 대한 깊은 지식." },
      ],
      statsTitle: "독일 데스크 현황",
      stats: [
        { value: "34+", label: "년 경험" },
        { value: "100+", label: "서비스한 독일 및 오스트리아 고객" },
        { value: "5", label: "독일어 구사 변호사" },
        { value: "Band 1", label: "Chambers Latin America 순위" },
      ],
      ctaTitle: "저희와 파트너가 되세요",
      ctaText: "저희 독일 데스크가 멕시코에서 귀하의 비즈니스 목표를 어떻게 지원할 수 있는지 알아보세요. 상담을 위해 저희 팀에 문의하세요.",
      viewPractice: "독일 데스크 업무 보기",
      contactUs: "문의하기",
      learnMore: "자세히 알아보기",
    },
    ja: {
      title: "ジャーマンデスク",
      subtitle: "ドイツとメキシコを結ぶ信頼できる法律パートナー",
      experienceTitle: "34年以上の経験",
      experienceText1: "34年以上にわたり、Von Wobeser y Sierraはメキシコで事業を設立・拡大するドイツ・オーストリア企業の信頼できる法律顧問として活動してきました。当社のジャーマンデスクは、ドイツ語圏のクライアントの独自のニーズに合わせた専門的な法律サービスを提供しています。",
      experienceText2: "当社は、ドイツ・オーストリア企業のビジネス文化、法的期待、コミュニケーションの好みを理解しています。メキシコ法の専門知識と組み合わされたこの深い理解により、当社はヨーロッパのビジネス慣行とメキシコの法的環境との理想的な架け橋となっています。",
      teamTitle: "ドイツ語を話すチーム",
      teamSubtitle: "ドイツとオーストリアにルーツを持つ弁護士",
      teamIntro: "当社のジャーマンデスクは、ドイツとオーストリアで法律教育を受けた弁護士で構成されており、ヨーロッパの法的枠組みとビジネス慣行に関する本物の洞察力をもたらします。このバイリンガルかつバイカルチャーの専門知識により、シームレスなコミュニケーションと文化的に配慮された法的助言が保証されます。",
      teamHighlights: [
        { icon: GraduationCap, title: "ドイツ・オーストリアの法律教育", text: "当社の弁護士はドイツとオーストリアで法律を学び、ヨーロッパの法的原則と慣行に関する直接的な知識を提供します。" },
        { icon: Globe2, title: "バイリンガルコミュニケーション", text: "ドイツ語、英語、スペイン語に堪能な当社チームは、法的問題のあらゆる段階で明確で正確なコミュニケーションを保証します。" },
        { icon: Handshake, title: "文化的理解", text: "ドイツのビジネス文化とメキシコの法的慣行のギャップを埋め、正確さとプロフェッショナリズムでお客様の期待に応えます。" },
        { icon: Award, title: "認められた卓越性", text: "当社のジャーマンデスクは、ドイツ・オーストリアのクライアントへの優れたサービスにより、主要な法律ディレクトリから認められています。" },
      ],
      servicesTitle: "主要業務分野",
      servicesSubtitle: "メキシコでのビジネスのための包括的な法的ソリューション",
      services: [
        { icon: Building2, title: "企業法・M&A", text: "メキシコ事業のための設立、再編、合併、買収、コーポレートガバナンス。" },
        { icon: Briefcase, title: "外国投資", text: "ドイツ・オーストリアの投資家のための規制遵守、投資構造化、市場参入戦略。" },
        { icon: Car, title: "自動車産業", text: "サプライチェーン、製造、流通契約を含む自動車セクターの専門アドバイス。" },
        { icon: Pill, title: "製薬・ヘルスケア", text: "製薬・ヘルスケア業界における規制事項、ライセンス、商業取引。" },
        { icon: Zap, title: "エネルギー・インフラ", text: "エネルギープロジェクト、インフラ投資、規制遵守のための法的サポート。" },
        { icon: Scale, title: "商事訴訟", text: "メキシコにおけるビジネス利益を保護するための紛争解決、仲裁、訴訟サービス。" },
      ],
      differentiatorTitle: "なぜ当社のジャーマンデスクを選ぶのか？",
      differentiatorSubtitle: "文化的理解が主要な差別化要因です",
      differentiatorIntro: "当社のジャーマンデスクを際立たせるのは、ドイツとオーストリアのビジネス文化に対する真の理解です。私たちはお客様の言語を話すだけでなく、正確さ、徹底さ、信頼性に対するお客様の期待を理解しています。当社の弁護士はお客様のニーズを予測し、お客様が期待する高い基準に沿った法的サービスを提供します。",
      differentiatorPoints: [
        { icon: Clock, title: "時間厳守と信頼性", text: "お客様の時間を尊重し、ドイツ式の正確さでコミットメントを果たします。" },
        { icon: Users, title: "直接的なコミュニケーション", text: "不必要な複雑さや遅延のない、明確で率直なコミュニケーション。" },
        { icon: Scale, title: "徹底性", text: "私たちが扱うすべての案件において、包括的な分析と細部への注意。" },
        { icon: MapPin, title: "現地の専門知識", text: "お客様の母国の法制度に対する理解と組み合わされたメキシコ法の深い知識。" },
      ],
      statsTitle: "ジャーマンデスクの数字",
      stats: [
        { value: "34+", label: "年の経験" },
        { value: "100+", label: "サービスを提供したドイツ・オーストリアのクライアント" },
        { value: "5", label: "ドイツ語を話す弁護士" },
        { value: "Band 1", label: "Chambers Latin Americaランキング" },
      ],
      ctaTitle: "私たちとパートナーになりましょう",
      ctaText: "当社のジャーマンデスクがメキシコでのビジネス目標をどのようにサポートできるかをご覧ください。ご相談は当社チームにお問い合わせください。",
      viewPractice: "ジャーマンデスク業務を見る",
      contactUs: "お問い合わせ",
      learnMore: "詳細を見る",
    },
    ar: {
      title: "المكتب الألماني",
      subtitle: "شريكك القانوني الموثوق للشركات الألمانية والنمساوية في المكسيك",
      experienceTitle: "أكثر من 34 عاماً من الخبرة",
      experienceText1: "لأكثر من 34 عاماً، كان Von Wobeser y Sierra المستشار القانوني الموثوق للشركات الألمانية والنمساوية التي تؤسس وتوسع عملياتها في المكسيك. يقدم مكتبنا الألماني خدمات قانونية متخصصة مصممة خصيصاً للاحتياجات الفريدة للعملاء الناطقين بالألمانية.",
      experienceText2: "نحن نفهم ثقافة الأعمال والتوقعات القانونية وتفضيلات التواصل للشركات الألمانية والنمساوية. هذا الفهم العميق، جنباً إلى جنب مع خبرتنا في القانون المكسيكي، يضعنا كجسر مثالي بين الممارسات التجارية الأوروبية والمشهد القانوني المكسيكي.",
      teamTitle: "فريقنا الناطق بالألمانية",
      teamSubtitle: "محامون بجذور في ألمانيا والنمسا",
      teamIntro: "يتكون مكتبنا الألماني من محامين تلقوا تعليمهم القانوني في ألمانيا والنمسا، مما يوفر رؤية حقيقية للأطر القانونية الأوروبية والممارسات التجارية. تضمن هذه الخبرة ثنائية اللغة والثقافة تواصلاً سلساً ومشورة قانونية مطلعة ثقافياً.",
      teamHighlights: [
        { icon: GraduationCap, title: "التعليم القانوني الألماني والنمساوي", text: "درس محامونا القانون في ألمانيا والنمسا، مما يوفر معرفة مباشرة بالمبادئ والممارسات القانونية الأوروبية." },
        { icon: Globe2, title: "التواصل ثنائي اللغة", text: "يتقن فريقنا الألمانية والإنجليزية والإسبانية، مما يضمن تواصلاً واضحاً ودقيقاً في كل مرحلة من مراحل شؤونك القانونية." },
        { icon: Handshake, title: "الفهم الثقافي", text: "نسد الفجوة بين ثقافة الأعمال الألمانية والممارسة القانونية المكسيكية، لضمان تلبية توقعاتك بدقة واحترافية." },
        { icon: Award, title: "التميز المعترف به", text: "تم الاعتراف بمكتبنا الألماني من قبل الدلائل القانونية الرائدة لخدمته المتميزة للعملاء الألمان والنمساويين." },
      ],
      servicesTitle: "مجالات الممارسة الرئيسية",
      servicesSubtitle: "حلول قانونية شاملة لأعمالك في المكسيك",
      services: [
        { icon: Building2, title: "الشركات والاندماج والاستحواذ", text: "التأسيس وإعادة الهيكلة والاندماج والاستحواذ وحوكمة الشركات لعملياتك في المكسيك." },
        { icon: Briefcase, title: "الاستثمار الأجنبي", text: "الامتثال التنظيمي وهيكلة الاستثمار واستراتيجيات دخول السوق للمستثمرين الألمان والنمساويين." },
        { icon: Car, title: "صناعة السيارات", text: "استشارات متخصصة لقطاع السيارات، بما في ذلك سلسلة التوريد والتصنيع واتفاقيات التوزيع." },
        { icon: Pill, title: "الأدوية والرعاية الصحية", text: "الشؤون التنظيمية والترخيص والمعاملات التجارية في صناعات الأدوية والرعاية الصحية." },
        { icon: Zap, title: "الطاقة والبنية التحتية", text: "الدعم القانوني لمشاريع الطاقة واستثمارات البنية التحتية والامتثال التنظيمي." },
        { icon: Scale, title: "التقاضي التجاري", text: "حل النزاعات والتحكيم وخدمات التقاضي لحماية مصالحك التجارية في المكسيك." },
      ],
      differentiatorTitle: "لماذا تختار مكتبنا الألماني؟",
      differentiatorSubtitle: "الفهم الثقافي هو ميزتنا التنافسية الرئيسية",
      differentiatorIntro: "ما يميز مكتبنا الألماني هو فهمنا الحقيقي لثقافة الأعمال الألمانية والنمساوية. نحن لا نتحدث لغتك فحسب - بل نفهم توقعاتك للدقة والشمولية والموثوقية. يتوقع محامونا احتياجاتك ويقدمون خدمات قانونية تتوافق مع المعايير العالية التي تتوقعها.",
      differentiatorPoints: [
        { icon: Clock, title: "الالتزام بالمواعيد والموثوقية", text: "نحترم وقتك ونفي بالتزاماتنا بدقة ألمانية." },
        { icon: Users, title: "التواصل المباشر", text: "تواصل واضح ومباشر دون تعقيد أو تأخير غير ضروري." },
        { icon: Scale, title: "الشمولية", text: "تحليل شامل واهتمام بالتفاصيل في كل مسألة نتعامل معها." },
        { icon: MapPin, title: "الخبرة المحلية", text: "معرفة عميقة بالقانون المكسيكي مع فهم لنظامك القانوني المحلي." },
      ],
      statsTitle: "المكتب الألماني بالأرقام",
      stats: [
        { value: "34+", label: "سنة من الخبرة" },
        { value: "100+", label: "عميل ألماني ونمساوي تمت خدمتهم" },
        { value: "5", label: "محامون ناطقون بالألمانية" },
        { value: "Band 1", label: "تصنيف Chambers Latin America" },
      ],
      ctaTitle: "كن شريكنا",
      ctaText: "اكتشف كيف يمكن لمكتبنا الألماني دعم أهداف عملك في المكسيك. اتصل بفريقنا للحصول على استشارة.",
      viewPractice: "عرض ممارسة المكتب الألماني",
      contactUs: "اتصل بنا",
      learnMore: "اعرف المزيد",
    },
    ru: {
      title: "Немецкий отдел",
      subtitle: "Ваш надежный юридический партнер для немецких и австрийских компаний в Мексике",
      experienceTitle: "Более 34 лет опыта",
      experienceText1: "Более 34 лет Von Wobeser y Sierra является доверенным юридическим консультантом для немецких и австрийских компаний, создающих и расширяющих свою деятельность в Мексике. Наш Немецкий отдел предоставляет специализированные юридические услуги, адаптированные к уникальным потребностям немецкоязычных клиентов.",
      experienceText2: "Мы понимаем деловую культуру, юридические ожидания и коммуникационные предпочтения немецких и австрийских компаний. Это глубокое понимание в сочетании с нашей экспертизой в мексиканском праве позиционирует нас как идеальный мост между европейскими деловыми практиками и мексиканским правовым ландшафтом.",
      teamTitle: "Наша немецкоязычная команда",
      teamSubtitle: "Адвокаты с корнями в Германии и Австрии",
      teamIntro: "Наш Немецкий отдел укомплектован адвокатами, получившими юридическое образование в Германии и Австрии, что обеспечивает подлинное понимание европейских правовых рамок и деловых практик. Эта двуязычная и бикультурная экспертиза обеспечивает бесперебойную коммуникацию и культурно обоснованные юридические консультации.",
      teamHighlights: [
        { icon: GraduationCap, title: "Немецкое и австрийское юридическое образование", text: "Наши адвокаты изучали право в Германии и Австрии, что дает им непосредственное знание европейских правовых принципов и практик." },
        { icon: Globe2, title: "Двуязычная коммуникация", text: "Свободно владея немецким, английским и испанским языками, наша команда обеспечивает четкую и точную коммуникацию на каждом этапе ваших юридических вопросов." },
        { icon: Handshake, title: "Культурное понимание", text: "Мы преодолеваем разрыв между немецкой деловой культурой и мексиканской юридической практикой, гарантируя, что ваши ожидания будут выполнены с точностью и профессионализмом." },
        { icon: Award, title: "Признанное превосходство", text: "Наш Немецкий отдел получил признание ведущих юридических справочников за выдающийся сервис для немецких и австрийских клиентов." },
      ],
      servicesTitle: "Основные области практики",
      servicesSubtitle: "Комплексные юридические решения для вашего бизнеса в Мексике",
      services: [
        { icon: Building2, title: "Корпоративное право и M&A", text: "Создание, реструктуризация, слияния, поглощения и корпоративное управление для ваших мексиканских операций." },
        { icon: Briefcase, title: "Иностранные инвестиции", text: "Регуляторное соответствие, структурирование инвестиций и стратегии выхода на рынок для немецких и австрийских инвесторов." },
        { icon: Car, title: "Автомобильная промышленность", text: "Специализированные консультации для автомобильного сектора, включая цепочку поставок, производство и дистрибуторские соглашения." },
        { icon: Pill, title: "Фармацевтика и здравоохранение", text: "Регуляторные вопросы, лицензирование и коммерческие сделки в фармацевтической и медицинской отраслях." },
        { icon: Zap, title: "Энергетика и инфраструктура", text: "Юридическая поддержка энергетических проектов, инфраструктурных инвестиций и регуляторного соответствия." },
        { icon: Scale, title: "Коммерческие споры", text: "Разрешение споров, арбитраж и судебные услуги для защиты ваших деловых интересов в Мексике." },
      ],
      differentiatorTitle: "Почему выбирают наш Немецкий отдел?",
      differentiatorSubtitle: "Культурное понимание как наше ключевое отличие",
      differentiatorIntro: "Что отличает наш Немецкий отдел — это наше подлинное понимание немецкой и австрийской деловой культуры. Мы не просто говорим на вашем языке — мы понимаем ваши ожидания точности, тщательности и надежности. Наши адвокаты предугадывают ваши потребности и предоставляют юридические услуги, соответствующие высоким стандартам, которые вы ожидаете.",
      differentiatorPoints: [
        { icon: Clock, title: "Пунктуальность и надежность", text: "Мы уважаем ваше время и выполняем обязательства с немецкой точностью." },
        { icon: Users, title: "Прямая коммуникация", text: "Ясная, прямая коммуникация без лишней сложности или задержек." },
        { icon: Scale, title: "Тщательность", text: "Всесторонний анализ и внимание к деталям в каждом вопросе, который мы ведем." },
        { icon: MapPin, title: "Местная экспертиза", text: "Глубокое знание мексиканского права в сочетании с пониманием вашей родной правовой системы." },
      ],
      statsTitle: "Немецкий отдел в цифрах",
      stats: [
        { value: "34+", label: "лет опыта" },
        { value: "100+", label: "обслуженных немецких и австрийских клиентов" },
        { value: "5", label: "немецкоязычных адвокатов" },
        { value: "Band 1", label: "рейтинг Chambers Latin America" },
      ],
      ctaTitle: "Станьте нашим партнером",
      ctaText: "Узнайте, как наш Немецкий отдел может поддержать ваши бизнес-цели в Мексике. Свяжитесь с нашей командой для консультации.",
      viewPractice: "Посмотреть практику Немецкого отдела",
      contactUs: "Связаться с нами",
      learnMore: "Узнать больше",
    },
    fr: {
      title: "German Desk",
      subtitle: "Votre partenaire juridique de confiance pour les entreprises allemandes et autrichiennes au Mexique",
      experienceTitle: "Plus de 34 ans d'expérience",
      experienceText1: "Depuis plus de 34 ans, Von Wobeser y Sierra est le conseiller juridique de confiance des entreprises allemandes et autrichiennes qui établissent et développent leurs opérations au Mexique. Notre German Desk fournit des services juridiques spécialisés adaptés aux besoins uniques des clients germanophones.",
      experienceText2: "Nous comprenons la culture d'entreprise, les attentes juridiques et les préférences de communication des entreprises allemandes et autrichiennes. Cette compréhension approfondie, combinée à notre expertise en droit mexicain, nous positionne comme le pont idéal entre les pratiques commerciales européennes et le paysage juridique mexicain.",
      teamTitle: "Notre équipe germanophone",
      teamSubtitle: "Avocats avec des racines en Allemagne et en Autriche",
      teamIntro: "Notre German Desk est composé d'avocats qui ont reçu leur formation juridique en Allemagne et en Autriche, apportant une vision authentique des cadres juridiques européens et des pratiques commerciales. Cette expertise bilingue et biculturelle assure une communication fluide et des conseils juridiques culturellement informés.",
      teamHighlights: [
        { icon: GraduationCap, title: "Formation juridique allemande et autrichienne", text: "Nos avocats ont étudié le droit en Allemagne et en Autriche, fournissant une connaissance directe des principes et pratiques juridiques européens." },
        { icon: Globe2, title: "Communication bilingue", text: "Maîtrisant l'allemand, l'anglais et l'espagnol, notre équipe assure une communication claire et précise à chaque étape de vos affaires juridiques." },
        { icon: Handshake, title: "Compréhension culturelle", text: "Nous comblons le fossé entre la culture d'entreprise allemande et la pratique juridique mexicaine, garantissant que vos attentes soient satisfaites avec précision et professionnalisme." },
        { icon: Award, title: "Excellence reconnue", text: "Notre German Desk a été reconnu par les principaux annuaires juridiques pour son service exceptionnel aux clients allemands et autrichiens." },
      ],
      servicesTitle: "Domaines de pratique principaux",
      servicesSubtitle: "Solutions juridiques complètes pour votre entreprise au Mexique",
      services: [
        { icon: Building2, title: "Droit des sociétés et M&A", text: "Constitution, restructuration, fusions, acquisitions et gouvernance d'entreprise pour vos opérations mexicaines." },
        { icon: Briefcase, title: "Investissement étranger", text: "Conformité réglementaire, structuration des investissements et stratégies d'entrée sur le marché pour les investisseurs allemands et autrichiens." },
        { icon: Car, title: "Industrie automobile", text: "Conseils spécialisés pour le secteur automobile, y compris la chaîne d'approvisionnement, la fabrication et les accords de distribution." },
        { icon: Pill, title: "Pharmaceutique et santé", text: "Questions réglementaires, licences et transactions commerciales dans les industries pharmaceutique et de la santé." },
        { icon: Zap, title: "Énergie et infrastructure", text: "Support juridique pour les projets énergétiques, les investissements en infrastructure et la conformité réglementaire." },
        { icon: Scale, title: "Contentieux commercial", text: "Résolution des litiges, arbitrage et services de contentieux pour protéger vos intérêts commerciaux au Mexique." },
      ],
      differentiatorTitle: "Pourquoi choisir notre German Desk?",
      differentiatorSubtitle: "La compréhension culturelle comme notre différenciateur clé",
      differentiatorIntro: "Ce qui distingue notre German Desk est notre véritable compréhension de la culture d'entreprise allemande et autrichienne. Nous ne parlons pas seulement votre langue — nous comprenons vos attentes en matière de précision, de rigueur et de fiabilité. Nos avocats anticipent vos besoins et fournissent des services juridiques alignés sur les normes élevées que vous attendez.",
      differentiatorPoints: [
        { icon: Clock, title: "Ponctualité et fiabilité", text: "Nous respectons votre temps et honorons nos engagements avec une précision allemande." },
        { icon: Users, title: "Communication directe", text: "Communication claire et directe sans complexité ni retards inutiles." },
        { icon: Scale, title: "Rigueur", text: "Analyse complète et attention aux détails dans chaque dossier que nous traitons." },
        { icon: MapPin, title: "Expertise locale", text: "Connaissance approfondie du droit mexicain combinée à la compréhension de votre système juridique national." },
      ],
      statsTitle: "German Desk en chiffres",
      stats: [
        { value: "34+", label: "années d'expérience" },
        { value: "100+", label: "clients allemands et autrichiens servis" },
        { value: "5", label: "avocats germanophones" },
        { value: "Band 1", label: "classement Chambers Latin America" },
      ],
      ctaTitle: "Devenez notre partenaire",
      ctaText: "Découvrez comment notre German Desk peut soutenir vos objectifs commerciaux au Mexique. Contactez notre équipe pour une consultation.",
      viewPractice: "Voir la pratique German Desk",
      contactUs: "Nous contacter",
      learnMore: "En savoir plus",
    },
    it: {
      title: "German Desk",
      subtitle: "Il vostro partner legale di fiducia per le aziende tedesche e austriache in Messico",
      experienceTitle: "Oltre 34 anni di esperienza",
      experienceText1: "Da oltre 34 anni, Von Wobeser y Sierra è il consulente legale di fiducia per le aziende tedesche e austriache che stabiliscono ed espandono le loro operazioni in Messico. Il nostro German Desk fornisce servizi legali specializzati su misura per le esigenze uniche dei clienti di lingua tedesca.",
      experienceText2: "Comprendiamo la cultura aziendale, le aspettative legali e le preferenze di comunicazione delle aziende tedesche e austriache. Questa profonda comprensione, combinata con la nostra esperienza nel diritto messicano, ci posiziona come il ponte ideale tra le pratiche commerciali europee e il panorama legale messicano.",
      teamTitle: "Il nostro team di lingua tedesca",
      teamSubtitle: "Avvocati con radici in Germania e Austria",
      teamIntro: "Il nostro German Desk è composto da avvocati che hanno ricevuto la loro formazione giuridica in Germania e Austria, portando una visione autentica dei quadri giuridici europei e delle pratiche commerciali. Questa competenza bilingue e biculturale garantisce una comunicazione fluida e una consulenza legale culturalmente informata.",
      teamHighlights: [
        { icon: GraduationCap, title: "Formazione giuridica tedesca e austriaca", text: "I nostri avvocati hanno studiato legge in Germania e Austria, fornendo una conoscenza diretta dei principi e delle pratiche legali europee." },
        { icon: Globe2, title: "Comunicazione bilingue", text: "Fluenti in tedesco, inglese e spagnolo, il nostro team garantisce una comunicazione chiara e precisa in ogni fase delle vostre questioni legali." },
        { icon: Handshake, title: "Comprensione culturale", text: "Colmiamo il divario tra la cultura aziendale tedesca e la pratica legale messicana, garantendo che le vostre aspettative siano soddisfatte con precisione e professionalità." },
        { icon: Award, title: "Eccellenza riconosciuta", text: "Il nostro German Desk è stato riconosciuto dalle principali directory legali per il suo servizio eccezionale ai clienti tedeschi e austriaci." },
      ],
      servicesTitle: "Aree di pratica principali",
      servicesSubtitle: "Soluzioni legali complete per la vostra attività in Messico",
      services: [
        { icon: Building2, title: "Diritto societario e M&A", text: "Costituzione, ristrutturazione, fusioni, acquisizioni e governance aziendale per le vostre operazioni messicane." },
        { icon: Briefcase, title: "Investimenti esteri", text: "Conformità normativa, strutturazione degli investimenti e strategie di ingresso nel mercato per investitori tedeschi e austriaci." },
        { icon: Car, title: "Industria automobilistica", text: "Consulenza specializzata per il settore automobilistico, inclusa la catena di fornitura, la produzione e gli accordi di distribuzione." },
        { icon: Pill, title: "Farmaceutica e sanità", text: "Questioni normative, licenze e transazioni commerciali nelle industrie farmaceutica e sanitaria." },
        { icon: Zap, title: "Energia e infrastrutture", text: "Supporto legale per progetti energetici, investimenti infrastrutturali e conformità normativa." },
        { icon: Scale, title: "Contenzioso commerciale", text: "Risoluzione delle controversie, arbitrato e servizi di contenzioso per proteggere i vostri interessi commerciali in Messico." },
      ],
      differentiatorTitle: "Perché scegliere il nostro German Desk?",
      differentiatorSubtitle: "La comprensione culturale come nostro elemento distintivo",
      differentiatorIntro: "Ciò che distingue il nostro German Desk è la nostra genuina comprensione della cultura aziendale tedesca e austriaca. Non parliamo solo la vostra lingua — comprendiamo le vostre aspettative di precisione, completezza e affidabilità. I nostri avvocati anticipano le vostre esigenze e forniscono servizi legali allineati agli alti standard che vi aspettate.",
      differentiatorPoints: [
        { icon: Clock, title: "Puntualità e affidabilità", text: "Rispettiamo il vostro tempo e manteniamo i nostri impegni con precisione tedesca." },
        { icon: Users, title: "Comunicazione diretta", text: "Comunicazione chiara e diretta senza complessità o ritardi inutili." },
        { icon: Scale, title: "Accuratezza", text: "Analisi completa e attenzione ai dettagli in ogni questione che gestiamo." },
        { icon: MapPin, title: "Competenza locale", text: "Profonda conoscenza del diritto messicano combinata con la comprensione del vostro sistema giuridico nazionale." },
      ],
      statsTitle: "German Desk in numeri",
      stats: [
        { value: "34+", label: "anni di esperienza" },
        { value: "100+", label: "clienti tedeschi e austriaci serviti" },
        { value: "5", label: "avvocati di lingua tedesca" },
        { value: "Band 1", label: "classifica Chambers Latin America" },
      ],
      ctaTitle: "Diventa nostro partner",
      ctaText: "Scopri come il nostro German Desk può supportare i tuoi obiettivi aziendali in Messico. Contatta il nostro team per una consulenza.",
      viewPractice: "Vedi la pratica German Desk",
      contactUs: "Contattaci",
      learnMore: "Scopri di più",
    },
  };

  const t = content[language] || content.en;

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
    <div className="min-h-screen bg-background overflow-x-hidden" data-testid="page-german-desk">
      <SEOHead page="germanDesk" language={language} />
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-german-desk-hero">
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
              data-testid="text-german-desk-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-base text-white/60 max-w-2xl mx-auto"
              data-testid="text-german-desk-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
            data-testid="section-experience"
          >
            <h2 className="text-2xl font-heading font-light text-foreground mb-6 uppercase tracking-[0.12em]" data-testid="text-experience-title">
              {t.experienceTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-foreground leading-relaxed text-justify" data-testid="text-experience-1">
                {t.experienceText1}
              </p>
              <p className="text-lg text-foreground leading-relaxed text-justify" data-testid="text-experience-2">
                {t.experienceText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-20"
            data-testid="section-team"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]" data-testid="text-team-title">
                {t.teamTitle}
              </h2>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-team-subtitle">
                {t.teamSubtitle}
              </p>
              <p className="text-lg text-foreground leading-relaxed text-justify max-w-4xl mx-auto" data-testid="text-team-intro">
                {t.teamIntro}
              </p>
            </div>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
            viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.teamHighlights.map((highlight, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <NumberedCard
                    index={index}
                    title={highlight.title}
                    body={highlight.text}
                    icon={highlight.icon}
                    dataTestid={`card-team-highlight-${index}`}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-20"
            data-testid="section-services"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]" data-testid="text-services-title">
                {t.servicesTitle}
              </h2>
              <p className="text-lg text-muted-foreground" data-testid="text-services-subtitle">
                {t.servicesSubtitle}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.services.map((service, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <NumberedCard
                    index={index}
                    title={service.title}
                    body={service.text}
                    icon={service.icon}
                    dataTestid={`card-service-${index}`}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-none p-4 sm:p-6 md:p-10"
            data-testid="section-differentiator"
          >
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Handshake className="w-8 h-8 text-primary" />
                <h2 className="text-2xl font-heading font-light text-foreground uppercase tracking-[0.12em]" data-testid="text-differentiator-title">
                  {t.differentiatorTitle}
                </h2>
              </div>
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-differentiator-subtitle">
                {t.differentiatorSubtitle}
              </p>
              <p className="text-lg text-foreground leading-relaxed text-justify max-w-4xl mx-auto" data-testid="text-differentiator-intro">
                {t.differentiatorIntro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.differentiatorPoints.map((point, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <NumberedCard
                    index={index}
                    title={point.title}
                    body={point.text}
                    icon={point.icon}
                    dataTestid={`card-differentiator-${index}`}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20"
            data-testid="section-stats"
          >
            <h2 className="text-2xl font-heading font-light text-foreground mb-8 text-center uppercase tracking-[0.12em]" data-testid="text-stats-title">
              {t.statsTitle}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                  data-testid={`stat-german-desk-${index}`}
                >
                  <div className="text-4xl md:text-5xl font-light text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mb-10"
            data-testid="section-cta"
          >
            <Card className="rounded-none border border-border bg-muted">
              <CardContent className="p-8 text-center">
                <h2 className="text-xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]" data-testid="text-cta-title">
                  {t.ctaTitle}
                </h2>
                <p className="text-lg text-foreground mb-8 max-w-2xl mx-auto" data-testid="text-cta-description">
                  {t.ctaText}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/practice-groups/german-desk">
                    <Button size="lg" className="gap-2" data-testid="button-view-practice">
                      {t.viewPractice}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="gap-2" data-testid="button-contact-us">
                      {t.contactUs}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
