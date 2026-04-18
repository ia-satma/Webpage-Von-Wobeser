import { motion } from "framer-motion";
import { Link } from "wouter";
import { 
  Heart, 
  Scale, 
  Users, 
  Globe2, 
  Building2, 
  HandHeart,
  Gavel,
  Shield,
  Handshake,
  Award,
  TrendingUp,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { NumberedCard } from "@/components/editorial";

export default function ProBono() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Pro Bono",
      subtitle: "Committed to making justice accessible to all",
      commitmentTitle: "35+ Years of Pro Bono Commitment",
      commitmentText1: "Since 1989, Von Wobeser y Sierra has been at the forefront of pro bono legal services in Mexico. Our firm was among the first in the country to establish a formal pro bono program, reflecting our deep commitment to social responsibility and access to justice.",
      commitmentText2: "Our attorneys dedicate thousands of hours annually to pro bono matters, providing high-quality legal representation to individuals and organizations that could not otherwise afford it. This commitment is not just a program—it is a core value embedded in our firm's culture.",
      areasTitle: "Areas of Pro Bono Practice",
      areasSubtitle: "We focus our efforts where we can make the greatest impact",
      areas: [
        { 
          icon: Building2, 
          title: "NGO Support", 
          text: "We provide comprehensive legal advice to non-profit organizations, helping them with governance, compliance, tax matters, and operational challenges so they can focus on their mission."
        },
        { 
          icon: Shield, 
          title: "Human Rights", 
          text: "Our attorneys work on cases involving fundamental rights and liberties, collaborating with human rights organizations to protect vulnerable populations and advocate for systemic change."
        },
        { 
          icon: Gavel, 
          title: "Access to Justice", 
          text: "We represent individuals who cannot afford legal counsel in critical matters, ensuring that economic circumstances do not prevent anyone from receiving fair legal representation."
        },
        { 
          icon: HandHeart, 
          title: "Social Impact Organizations", 
          text: "We support foundations, charities, and social enterprises with legal structuring, contracts, and regulatory compliance to maximize their positive impact on society."
        },
        { 
          icon: BookOpen, 
          title: "Legal Education", 
          text: "Our attorneys participate in legal literacy programs, educating communities about their rights and how to navigate the legal system effectively."
        },
        { 
          icon: Globe2, 
          title: "Environmental Causes", 
          text: "We advise environmental organizations on regulatory matters, conservation initiatives, and sustainability projects that benefit communities and ecosystems."
        },
      ],
      statsTitle: "Our Pro Bono Impact",
      stats: [
        { value: "35+", label: "Years of Pro Bono Work" },
        { value: "5,000+", label: "Pro Bono Hours Annually" },
        { value: "100+", label: "Organizations Supported" },
        { value: "50+", label: "Attorneys Participating" },
      ],
      participationTitle: "How Our Lawyers Participate",
      participationSubtitle: "Every attorney at Von Wobeser y Sierra is encouraged to contribute",
      participationIntro: "Pro bono work is an integral part of professional development at our firm. We believe that giving back not only serves our community but also enriches our attorneys' skills and perspectives.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Dedicated Pro Bono Committee", 
          text: "A specialized committee coordinates our pro bono efforts, matching attorneys with matters that align with their expertise and interests while ensuring quality representation."
        },
        { 
          icon: Handshake, 
          title: "Strategic Partnerships", 
          text: "We collaborate with legal aid organizations, universities, and other law firms to maximize our collective impact and address complex challenges that require diverse expertise."
        },
        { 
          icon: Award, 
          title: "Recognition Program", 
          text: "We recognize and celebrate attorneys who make outstanding contributions to pro bono work, reinforcing its importance to our firm's culture and values."
        },
        { 
          icon: TrendingUp, 
          title: "Professional Development", 
          text: "Pro bono matters offer unique learning opportunities, allowing junior attorneys to handle significant responsibilities under the guidance of experienced mentors."
        },
      ],
      ctaTitle: "Partner With Us",
      ctaText: "If you represent a non-profit organization or know of a worthy cause that could benefit from pro bono legal assistance, we encourage you to reach out. Together, we can work toward a more just society.",
      contactButton: "Contact Us",
      learnMoreAbout: "Learn More About Our Firm",
    },
    es: {
      title: "Pro Bono",
      subtitle: "Comprometidos con hacer la justicia accesible para todos",
      commitmentTitle: "Más de 35 Años de Compromiso Pro Bono",
      commitmentText1: "Desde 1989, Von Wobeser y Sierra ha estado a la vanguardia de los servicios legales pro bono en México. Nuestra firma fue una de las primeras en el país en establecer un programa pro bono formal, reflejando nuestro profundo compromiso con la responsabilidad social y el acceso a la justicia.",
      commitmentText2: "Nuestros abogados dedican miles de horas anualmente a asuntos pro bono, brindando representación legal de alta calidad a individuos y organizaciones que de otro modo no podrían pagarla. Este compromiso no es solo un programa—es un valor fundamental arraigado en la cultura de nuestra firma.",
      areasTitle: "Áreas de Práctica Pro Bono",
      areasSubtitle: "Enfocamos nuestros esfuerzos donde podemos generar el mayor impacto",
      areas: [
        { 
          icon: Building2, 
          title: "Apoyo a ONGs", 
          text: "Brindamos asesoría legal integral a organizaciones sin fines de lucro, ayudándolas con gobernanza, cumplimiento, asuntos fiscales y desafíos operativos para que puedan enfocarse en su misión."
        },
        { 
          icon: Shield, 
          title: "Derechos Humanos", 
          text: "Nuestros abogados trabajan en casos que involucran derechos y libertades fundamentales, colaborando con organizaciones de derechos humanos para proteger a poblaciones vulnerables y abogar por cambios sistémicos."
        },
        { 
          icon: Gavel, 
          title: "Acceso a la Justicia", 
          text: "Representamos a individuos que no pueden pagar asesoría legal en asuntos críticos, asegurando que las circunstancias económicas no impidan a nadie recibir representación legal justa."
        },
        { 
          icon: HandHeart, 
          title: "Organizaciones de Impacto Social", 
          text: "Apoyamos a fundaciones, organizaciones benéficas y empresas sociales con estructuración legal, contratos y cumplimiento regulatorio para maximizar su impacto positivo en la sociedad."
        },
        { 
          icon: BookOpen, 
          title: "Educación Legal", 
          text: "Nuestros abogados participan en programas de alfabetización legal, educando a las comunidades sobre sus derechos y cómo navegar el sistema legal de manera efectiva."
        },
        { 
          icon: Globe2, 
          title: "Causas Ambientales", 
          text: "Asesoramos a organizaciones ambientales en asuntos regulatorios, iniciativas de conservación y proyectos de sostenibilidad que benefician a comunidades y ecosistemas."
        },
      ],
      statsTitle: "Nuestro Impacto Pro Bono",
      stats: [
        { value: "35+", label: "Años de Trabajo Pro Bono" },
        { value: "5,000+", label: "Horas Pro Bono Anuales" },
        { value: "100+", label: "Organizaciones Apoyadas" },
        { value: "50+", label: "Abogados Participantes" },
      ],
      participationTitle: "Cómo Participan Nuestros Abogados",
      participationSubtitle: "Cada abogado en Von Wobeser y Sierra está invitado a contribuir",
      participationIntro: "El trabajo pro bono es parte integral del desarrollo profesional en nuestra firma. Creemos que retribuir no solo sirve a nuestra comunidad sino que también enriquece las habilidades y perspectivas de nuestros abogados.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Comité Pro Bono Dedicado", 
          text: "Un comité especializado coordina nuestros esfuerzos pro bono, asignando abogados a asuntos que se alinean con su experiencia e intereses mientras asegura representación de calidad."
        },
        { 
          icon: Handshake, 
          title: "Alianzas Estratégicas", 
          text: "Colaboramos con organizaciones de asistencia legal, universidades y otras firmas de abogados para maximizar nuestro impacto colectivo y abordar desafíos complejos que requieren experiencia diversa."
        },
        { 
          icon: Award, 
          title: "Programa de Reconocimiento", 
          text: "Reconocemos y celebramos a los abogados que hacen contribuciones sobresalientes al trabajo pro bono, reforzando su importancia para la cultura y valores de nuestra firma."
        },
        { 
          icon: TrendingUp, 
          title: "Desarrollo Profesional", 
          text: "Los asuntos pro bono ofrecen oportunidades únicas de aprendizaje, permitiendo a los abogados junior manejar responsabilidades significativas bajo la guía de mentores experimentados."
        },
      ],
      ctaTitle: "Asóciese Con Nosotros",
      ctaText: "Si usted representa a una organización sin fines de lucro o conoce una causa valiosa que podría beneficiarse de asistencia legal pro bono, le invitamos a comunicarse con nosotros. Juntos, podemos trabajar hacia una sociedad más justa.",
      contactButton: "Contáctenos",
      learnMoreAbout: "Conozca Más Sobre Nuestra Firma",
    },
    de: {
      title: "Pro Bono",
      subtitle: "Engagiert für Gerechtigkeit und Zugang zum Recht für alle",
      commitmentTitle: "Über 35 Jahre Pro-Bono-Engagement",
      commitmentText1: "Seit 1989 steht Von Wobeser y Sierra an der Spitze der Pro-Bono-Rechtsdienstleistungen in Mexiko. Unsere Kanzlei war eine der ersten im Land, die ein formelles Pro-Bono-Programm einrichtete, was unser tiefes Engagement für soziale Verantwortung und Zugang zur Justiz widerspiegelt.",
      commitmentText2: "Unsere Anwälte widmen jährlich Tausende von Stunden Pro-Bono-Angelegenheiten und bieten hochwertige rechtliche Vertretung für Einzelpersonen und Organisationen, die sich dies sonst nicht leisten könnten. Dieses Engagement ist nicht nur ein Programm – es ist ein Grundwert, der in der Kultur unserer Kanzlei verankert ist.",
      areasTitle: "Bereiche der Pro-Bono-Praxis",
      areasSubtitle: "Wir konzentrieren unsere Bemühungen dort, wo wir die größte Wirkung erzielen können",
      areas: [
        { 
          icon: Building2, 
          title: "NGO-Unterstützung", 
          text: "Wir bieten umfassende Rechtsberatung für gemeinnützige Organisationen und helfen ihnen bei Governance, Compliance, Steuerangelegenheiten und operativen Herausforderungen, damit sie sich auf ihre Mission konzentrieren können."
        },
        { 
          icon: Shield, 
          title: "Menschenrechte", 
          text: "Unsere Anwälte arbeiten an Fällen, die Grundrechte und Freiheiten betreffen, und arbeiten mit Menschenrechtsorganisationen zusammen, um gefährdete Bevölkerungsgruppen zu schützen und für systemische Veränderungen einzutreten."
        },
        { 
          icon: Gavel, 
          title: "Zugang zur Justiz", 
          text: "Wir vertreten Personen, die sich keinen Rechtsbeistand in kritischen Angelegenheiten leisten können, und stellen sicher, dass wirtschaftliche Umstände niemanden daran hindern, eine faire rechtliche Vertretung zu erhalten."
        },
        { 
          icon: HandHeart, 
          title: "Soziale Organisationen", 
          text: "Wir unterstützen Stiftungen, Wohltätigkeitsorganisationen und Sozialunternehmen bei der rechtlichen Strukturierung, Verträgen und regulatorischer Compliance, um ihre positive Wirkung auf die Gesellschaft zu maximieren."
        },
        { 
          icon: BookOpen, 
          title: "Rechtsbildung", 
          text: "Unsere Anwälte nehmen an Programmen zur Rechtskompetenz teil und informieren Gemeinschaften über ihre Rechte und wie sie das Rechtssystem effektiv nutzen können."
        },
        { 
          icon: Globe2, 
          title: "Umweltanliegen", 
          text: "Wir beraten Umweltorganisationen in regulatorischen Angelegenheiten, Naturschutzinitiativen und Nachhaltigkeitsprojekten, die Gemeinschaften und Ökosystemen zugutekommen."
        },
      ],
      statsTitle: "Unsere Pro-Bono-Wirkung",
      stats: [
        { value: "35+", label: "Jahre Pro-Bono-Arbeit" },
        { value: "5.000+", label: "Pro-Bono-Stunden jährlich" },
        { value: "100+", label: "Unterstützte Organisationen" },
        { value: "50+", label: "Teilnehmende Anwälte" },
      ],
      participationTitle: "Wie unsere Anwälte teilnehmen",
      participationSubtitle: "Jeder Anwalt bei Von Wobeser y Sierra ist eingeladen, sich zu engagieren",
      participationIntro: "Pro-Bono-Arbeit ist ein integraler Bestandteil der beruflichen Entwicklung in unserer Kanzlei. Wir glauben, dass Zurückgeben nicht nur unserer Gemeinschaft dient, sondern auch die Fähigkeiten und Perspektiven unserer Anwälte bereichert.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Spezielles Pro-Bono-Komitee", 
          text: "Ein spezialisiertes Komitee koordiniert unsere Pro-Bono-Bemühungen und ordnet Anwälten Fälle zu, die ihrer Expertise und ihren Interessen entsprechen, während eine qualitativ hochwertige Vertretung gewährleistet wird."
        },
        { 
          icon: Handshake, 
          title: "Strategische Partnerschaften", 
          text: "Wir arbeiten mit Rechtshilfeorganisationen, Universitäten und anderen Anwaltskanzleien zusammen, um unsere kollektive Wirkung zu maximieren und komplexe Herausforderungen anzugehen, die vielfältige Expertise erfordern."
        },
        { 
          icon: Award, 
          title: "Anerkennungsprogramm", 
          text: "Wir erkennen und würdigen Anwälte an, die herausragende Beiträge zur Pro-Bono-Arbeit leisten, und unterstreichen damit deren Bedeutung für die Kultur und Werte unserer Kanzlei."
        },
        { 
          icon: TrendingUp, 
          title: "Berufliche Entwicklung", 
          text: "Pro-Bono-Fälle bieten einzigartige Lernmöglichkeiten und ermöglichen es Junior-Anwälten, bedeutende Verantwortung unter Anleitung erfahrener Mentoren zu übernehmen."
        },
      ],
      ctaTitle: "Partner werden",
      ctaText: "Wenn Sie eine gemeinnützige Organisation vertreten oder eine würdige Sache kennen, die von Pro-Bono-Rechtshilfe profitieren könnte, laden wir Sie ein, uns zu kontaktieren. Gemeinsam können wir an einer gerechteren Gesellschaft arbeiten.",
      contactButton: "Kontaktieren Sie uns",
      learnMoreAbout: "Erfahren Sie mehr über unsere Kanzlei",
    },
    zh: {
      title: "公益服务",
      subtitle: "致力于让所有人都能获得司法公正",
      commitmentTitle: "超过35年的公益法律服务承诺",
      commitmentText1: "自1989年以来，Von Wobeser y Sierra一直走在墨西哥公益法律服务的前沿。我们的事务所是该国最早建立正式公益项目的事务所之一，这反映了我们对社会责任和司法公正的深刻承诺。",
      commitmentText2: "我们的律师每年投入数千小时从事公益工作，为那些原本无法负担法律服务的个人和组织提供高质量的法律代理。这种承诺不仅仅是一个项目——它是植根于我们事务所文化的核心价值观。",
      areasTitle: "公益实践领域",
      areasSubtitle: "我们将努力集中在能够产生最大影响的领域",
      areas: [
        { 
          icon: Building2, 
          title: "非营利组织支持", 
          text: "我们为非营利组织提供全面的法律咨询，帮助它们处理治理、合规、税务事项和运营挑战，使它们能够专注于自己的使命。"
        },
        { 
          icon: Shield, 
          title: "人权保护", 
          text: "我们的律师处理涉及基本权利和自由的案件，与人权组织合作保护弱势群体并倡导系统性变革。"
        },
        { 
          icon: Gavel, 
          title: "司法援助", 
          text: "我们代理那些在关键事务中无力聘请律师的个人，确保经济状况不会阻止任何人获得公平的法律代理。"
        },
        { 
          icon: HandHeart, 
          title: "社会影响组织", 
          text: "我们在法律架构、合同和监管合规方面支持基金会、慈善机构和社会企业，以最大化它们对社会的积极影响。"
        },
        { 
          icon: BookOpen, 
          title: "法律教育", 
          text: "我们的律师参与法律普及项目，教育社区了解他们的权利以及如何有效地使用法律系统。"
        },
        { 
          icon: Globe2, 
          title: "环境保护事业", 
          text: "我们为环保组织提供监管事务、保护倡议和可持续发展项目方面的咨询，使社区和生态系统受益。"
        },
      ],
      statsTitle: "我们的公益影响",
      stats: [
        { value: "35+", label: "年公益工作历史" },
        { value: "5,000+", label: "年度公益服务小时" },
        { value: "100+", label: "支持的组织数量" },
        { value: "50+", label: "参与的律师人数" },
      ],
      participationTitle: "律师如何参与",
      participationSubtitle: "Von Wobeser y Sierra的每位律师都被鼓励参与贡献",
      participationIntro: "公益工作是我们事务所专业发展不可或缺的一部分。我们相信，回馈社会不仅服务于我们的社区，也丰富了我们律师的技能和视野。",
      participationAspects: [
        { 
          icon: Users, 
          title: "专门的公益委员会", 
          text: "一个专业委员会协调我们的公益工作，将律师与符合其专业知识和兴趣的案件匹配，同时确保高质量的代理服务。"
        },
        { 
          icon: Handshake, 
          title: "战略合作伙伴关系", 
          text: "我们与法律援助组织、大学和其他律师事务所合作，以最大化我们的集体影响力，解决需要多元专业知识的复杂挑战。"
        },
        { 
          icon: Award, 
          title: "表彰项目", 
          text: "我们表彰和赞扬在公益工作中做出杰出贡献的律师，强化其对我们事务所文化和价值观的重要性。"
        },
        { 
          icon: TrendingUp, 
          title: "职业发展", 
          text: "公益案件提供独特的学习机会，使初级律师能够在经验丰富的导师指导下承担重要责任。"
        },
      ],
      ctaTitle: "与我们合作",
      ctaText: "如果您代表非营利组织或知道可能受益于公益法律援助的有价值的事业，我们鼓励您与我们联系。让我们共同努力，创建一个更公正的社会。",
      contactButton: "联系我们",
      learnMoreAbout: "了解更多关于我们事务所",
    },
    ko: {
      title: "프로보노",
      subtitle: "모든 사람이 정의에 접근할 수 있도록 헌신합니다",
      commitmentTitle: "35년 이상의 프로보노 헌신",
      commitmentText1: "1989년부터 Von Wobeser y Sierra는 멕시코에서 프로보노 법률 서비스의 선두에 서 왔습니다. 우리 회사는 국내 최초로 공식 프로보노 프로그램을 설립한 회사 중 하나로, 사회적 책임과 정의에 대한 접근에 대한 깊은 헌신을 반영합니다.",
      commitmentText2: "우리 변호사들은 매년 수천 시간을 프로보노 업무에 헌신하여, 그렇지 않으면 비용을 감당할 수 없는 개인과 단체에 고품질 법률 대리를 제공합니다. 이 헌신은 단순한 프로그램이 아니라 우리 회사 문화에 뿌리 내린 핵심 가치입니다.",
      areasTitle: "프로보노 실무 분야",
      areasSubtitle: "가장 큰 영향을 미칠 수 있는 곳에 노력을 집중합니다",
      areas: [
        { 
          icon: Building2, 
          title: "NGO 지원", 
          text: "비영리 단체에 종합적인 법률 자문을 제공하여 거버넌스, 컴플라이언스, 세무 문제 및 운영상의 도전을 돕고 그들이 사명에 집중할 수 있도록 합니다."
        },
        { 
          icon: Shield, 
          title: "인권", 
          text: "우리 변호사들은 기본권과 자유와 관련된 사건을 담당하며, 인권 단체와 협력하여 취약 계층을 보호하고 체계적인 변화를 옹호합니다."
        },
        { 
          icon: Gavel, 
          title: "정의에 대한 접근", 
          text: "중요한 문제에서 법률 상담을 받을 여력이 없는 개인을 대리하여 경제적 상황이 누구도 공정한 법적 대리를 받는 것을 방해하지 않도록 합니다."
        },
        { 
          icon: HandHeart, 
          title: "사회적 영향 조직", 
          text: "재단, 자선 단체 및 사회적 기업이 사회에 미치는 긍정적 영향을 극대화할 수 있도록 법적 구조화, 계약 및 규제 준수를 지원합니다."
        },
        { 
          icon: BookOpen, 
          title: "법률 교육", 
          text: "우리 변호사들은 법률 문해력 프로그램에 참여하여 지역 사회에 그들의 권리와 법률 시스템을 효과적으로 이용하는 방법을 교육합니다."
        },
        { 
          icon: Globe2, 
          title: "환경 보호 활동", 
          text: "지역 사회와 생태계에 도움이 되는 규제 문제, 보존 이니셔티브 및 지속 가능성 프로젝트에 대해 환경 단체에 자문합니다."
        },
      ],
      statsTitle: "프로보노 영향",
      stats: [
        { value: "35+", label: "년 프로보노 활동" },
        { value: "5,000+", label: "연간 프로보노 시간" },
        { value: "100+", label: "지원한 단체" },
        { value: "50+", label: "참여 변호사" },
      ],
      participationTitle: "변호사 참여 방법",
      participationSubtitle: "Von Wobeser y Sierra의 모든 변호사가 기여하도록 권장됩니다",
      participationIntro: "프로보노 활동은 우리 회사에서 전문적 발전의 필수적인 부분입니다. 우리는 사회 환원이 지역 사회에 봉사할 뿐만 아니라 변호사들의 기술과 관점을 풍부하게 한다고 믿습니다.",
      participationAspects: [
        { 
          icon: Users, 
          title: "전담 프로보노 위원회", 
          text: "전문 위원회가 프로보노 노력을 조정하여 변호사들을 그들의 전문 지식과 관심사에 맞는 사건과 매칭하면서 양질의 대리를 보장합니다."
        },
        { 
          icon: Handshake, 
          title: "전략적 파트너십", 
          text: "법률 지원 단체, 대학 및 다른 로펌과 협력하여 집단적 영향력을 극대화하고 다양한 전문 지식이 필요한 복잡한 도전을 해결합니다."
        },
        { 
          icon: Award, 
          title: "인정 프로그램", 
          text: "프로보노 활동에 뛰어난 기여를 한 변호사들을 인정하고 축하하며, 우리 회사의 문화와 가치에 대한 중요성을 강화합니다."
        },
        { 
          icon: TrendingUp, 
          title: "전문성 개발", 
          text: "프로보노 사건은 독특한 학습 기회를 제공하여 주니어 변호사들이 경험 많은 멘토의 지도 하에 중요한 책임을 맡을 수 있게 합니다."
        },
      ],
      ctaTitle: "파트너가 되세요",
      ctaText: "비영리 단체를 대표하거나 프로보노 법률 지원의 혜택을 받을 수 있는 가치 있는 사업을 알고 계시다면 연락해 주시기 바랍니다. 함께 더 정의로운 사회를 만들어 나갈 수 있습니다.",
      contactButton: "문의하기",
      learnMoreAbout: "회사에 대해 더 알아보기",
    },
    ja: {
      title: "プロボノ",
      subtitle: "すべての人に正義へのアクセスを提供することに尽力しています",
      commitmentTitle: "35年以上のプロボノへの取り組み",
      commitmentText1: "1989年以来、Von Wobeser y Sierraはメキシコにおけるプロボノ法律サービスの最前線に立ってきました。当事務所は国内で初めて正式なプロボノプログラムを設立した事務所の一つであり、社会的責任と司法へのアクセスへの深いコミットメントを反映しています。",
      commitmentText2: "当事務所の弁護士は毎年数千時間をプロボノ案件に捧げ、そうでなければ費用を負担できない個人や組織に質の高い法的代理を提供しています。このコミットメントは単なるプログラムではなく、当事務所の文化に根ざした核心的な価値観です。",
      areasTitle: "プロボノ実務分野",
      areasSubtitle: "最も大きなインパクトを与えられる分野に注力しています",
      areas: [
        { 
          icon: Building2, 
          title: "NGO支援", 
          text: "非営利団体にガバナンス、コンプライアンス、税務、運営上の課題について包括的な法的アドバイスを提供し、彼らがミッションに集中できるよう支援しています。"
        },
        { 
          icon: Shield, 
          title: "人権", 
          text: "当事務所の弁護士は基本的権利と自由に関わる案件に取り組み、人権団体と協力して脆弱な人々を保護し、システム的な変革を提唱しています。"
        },
        { 
          icon: Gavel, 
          title: "司法へのアクセス", 
          text: "重要な問題で法的助言を受ける余裕のない個人を代理し、経済的な事情が誰も公正な法的代理を受けることを妨げないようにしています。"
        },
        { 
          icon: HandHeart, 
          title: "ソーシャルインパクト組織", 
          text: "財団、慈善団体、社会的企業が社会に与えるプラスの影響を最大化できるよう、法的構造化、契約、規制遵守を支援しています。"
        },
        { 
          icon: BookOpen, 
          title: "法教育", 
          text: "当事務所の弁護士は法的リテラシープログラムに参加し、コミュニティに権利と法制度の効果的な利用方法について教育しています。"
        },
        { 
          icon: Globe2, 
          title: "環境活動", 
          text: "コミュニティと生態系に恩恵をもたらす規制事項、保全イニシアチブ、サステナビリティプロジェクトについて環境団体にアドバイスしています。"
        },
      ],
      statsTitle: "プロボノの影響",
      stats: [
        { value: "35+", label: "年のプロボノ活動" },
        { value: "5,000+", label: "年間プロボノ時間" },
        { value: "100+", label: "支援した団体" },
        { value: "50+", label: "参加弁護士" },
      ],
      participationTitle: "弁護士の参加方法",
      participationSubtitle: "Von Wobeser y Sierraのすべての弁護士が貢献することを奨励されています",
      participationIntro: "プロボノ活動は当事務所における専門的発展の不可欠な部分です。社会貢献はコミュニティに奉仕するだけでなく、弁護士のスキルと視野を豊かにすると信じています。",
      participationAspects: [
        { 
          icon: Users, 
          title: "専門プロボノ委員会", 
          text: "専門委員会がプロボノ活動を調整し、弁護士を彼らの専門知識と関心に合った案件とマッチングしながら、質の高い代理を確保しています。"
        },
        { 
          icon: Handshake, 
          title: "戦略的パートナーシップ", 
          text: "法律扶助組織、大学、他の法律事務所と協力して、集団的な影響力を最大化し、多様な専門知識を必要とする複雑な課題に取り組んでいます。"
        },
        { 
          icon: Award, 
          title: "表彰プログラム", 
          text: "プロボノ活動に優れた貢献をした弁護士を表彰・称賛し、当事務所の文化と価値観にとっての重要性を強調しています。"
        },
        { 
          icon: TrendingUp, 
          title: "専門的成長", 
          text: "プロボノ案件はユニークな学習機会を提供し、ジュニア弁護士が経験豊富なメンターの指導の下で重要な責任を担うことを可能にしています。"
        },
      ],
      ctaTitle: "パートナーになりませんか",
      ctaText: "非営利団体を代表されている方、またはプロボノ法律支援から恩恵を受けられる価値ある活動をご存知の方は、ぜひお問い合わせください。共により公正な社会の実現に向けて取り組みましょう。",
      contactButton: "お問い合わせ",
      learnMoreAbout: "当事務所についてもっと知る",
    },
    ar: {
      title: "العمل التطوعي",
      subtitle: "ملتزمون بجعل العدالة في متناول الجميع",
      commitmentTitle: "أكثر من 35 عاماً من الالتزام بالعمل التطوعي",
      commitmentText1: "منذ عام 1989، كانت Von Wobeser y Sierra في طليعة الخدمات القانونية التطوعية في المكسيك. كانت شركتنا من أوائل الشركات في البلاد التي أنشأت برنامجاً رسمياً للعمل التطوعي، مما يعكس التزامنا العميق بالمسؤولية الاجتماعية والوصول إلى العدالة.",
      commitmentText2: "يكرس محامونا آلاف الساعات سنوياً للقضايا التطوعية، ويقدمون تمثيلاً قانونياً عالي الجودة للأفراد والمنظمات الذين لا يستطيعون تحمل تكاليفها. هذا الالتزام ليس مجرد برنامج - إنه قيمة أساسية متجذرة في ثقافة شركتنا.",
      areasTitle: "مجالات الممارسة التطوعية",
      areasSubtitle: "نركز جهودنا حيث يمكننا تحقيق أكبر تأثير",
      areas: [
        { 
          icon: Building2, 
          title: "دعم المنظمات غير الحكومية", 
          text: "نقدم استشارات قانونية شاملة للمنظمات غير الربحية، ونساعدها في الحوكمة والامتثال والشؤون الضريبية والتحديات التشغيلية حتى تتمكن من التركيز على مهمتها."
        },
        { 
          icon: Shield, 
          title: "حقوق الإنسان", 
          text: "يعمل محامونا على قضايا تتعلق بالحقوق والحريات الأساسية، ويتعاونون مع منظمات حقوق الإنسان لحماية الفئات الضعيفة والدعوة إلى التغيير الهيكلي."
        },
        { 
          icon: Gavel, 
          title: "الوصول إلى العدالة", 
          text: "نمثل الأفراد الذين لا يستطيعون تحمل تكاليف المستشار القانوني في المسائل الحرجة، مما يضمن ألا تمنع الظروف الاقتصادية أي شخص من الحصول على تمثيل قانوني عادل."
        },
        { 
          icon: HandHeart, 
          title: "منظمات الأثر الاجتماعي", 
          text: "ندعم المؤسسات والجمعيات الخيرية والمؤسسات الاجتماعية في الهيكلة القانونية والعقود والامتثال التنظيمي لتعظيم تأثيرها الإيجابي على المجتمع."
        },
        { 
          icon: BookOpen, 
          title: "التعليم القانوني", 
          text: "يشارك محامونا في برامج محو الأمية القانونية، ويثقفون المجتمعات حول حقوقهم وكيفية التعامل مع النظام القانوني بفعالية."
        },
        { 
          icon: Globe2, 
          title: "القضايا البيئية", 
          text: "نقدم المشورة للمنظمات البيئية بشأن المسائل التنظيمية ومبادرات الحفظ ومشاريع الاستدامة التي تفيد المجتمعات والنظم البيئية."
        },
      ],
      statsTitle: "تأثيرنا التطوعي",
      stats: [
        { value: "+35", label: "سنة من العمل التطوعي" },
        { value: "+5,000", label: "ساعة تطوعية سنوياً" },
        { value: "+100", label: "منظمة مدعومة" },
        { value: "+50", label: "محامي مشارك" },
      ],
      participationTitle: "كيف يشارك محامونا",
      participationSubtitle: "كل محامٍ في Von Wobeser y Sierra مدعو للمساهمة",
      participationIntro: "العمل التطوعي جزء لا يتجزأ من التطوير المهني في شركتنا. نعتقد أن العطاء لا يخدم مجتمعنا فحسب، بل يثري أيضاً مهارات محامينا ووجهات نظرهم.",
      participationAspects: [
        { 
          icon: Users, 
          title: "لجنة تطوعية مخصصة", 
          text: "تنسق لجنة متخصصة جهودنا التطوعية، وتطابق المحامين مع القضايا التي تتوافق مع خبراتهم واهتماماتهم مع ضمان تمثيل عالي الجودة."
        },
        { 
          icon: Handshake, 
          title: "شراكات استراتيجية", 
          text: "نتعاون مع منظمات المساعدة القانونية والجامعات وشركات المحاماة الأخرى لتعظيم تأثيرنا الجماعي ومعالجة التحديات المعقدة التي تتطلب خبرات متنوعة."
        },
        { 
          icon: Award, 
          title: "برنامج التقدير", 
          text: "نعترف ونحتفي بالمحامين الذين يقدمون مساهمات متميزة في العمل التطوعي، مما يعزز أهميته لثقافة وقيم شركتنا."
        },
        { 
          icon: TrendingUp, 
          title: "التطوير المهني", 
          text: "توفر القضايا التطوعية فرص تعلم فريدة، مما يسمح للمحامين المبتدئين بتحمل مسؤوليات كبيرة تحت إشراف مرشدين ذوي خبرة."
        },
      ],
      ctaTitle: "شاركنا",
      ctaText: "إذا كنت تمثل منظمة غير ربحية أو تعرف قضية جديرة يمكن أن تستفيد من المساعدة القانونية التطوعية، نشجعك على التواصل معنا. معاً، يمكننا العمل نحو مجتمع أكثر عدالة.",
      contactButton: "اتصل بنا",
      learnMoreAbout: "تعرف على المزيد عن شركتنا",
    },
    ru: {
      title: "Pro Bono",
      subtitle: "Приверженность доступности правосудия для всех",
      commitmentTitle: "Более 35 лет Pro Bono деятельности",
      commitmentText1: "С 1989 года Von Wobeser y Sierra находится в авангарде pro bono юридических услуг в Мексике. Наша фирма была одной из первых в стране, кто создал официальную программу pro bono, что отражает нашу глубокую приверженность социальной ответственности и доступу к правосудию.",
      commitmentText2: "Наши юристы ежегодно посвящают тысячи часов pro bono делам, обеспечивая качественное юридическое представительство для физических лиц и организаций, которые иначе не могли бы себе это позволить. Это обязательство — не просто программа, это основная ценность, укоренённая в культуре нашей фирмы.",
      areasTitle: "Области Pro Bono практики",
      areasSubtitle: "Мы концентрируем усилия там, где можем оказать наибольшее влияние",
      areas: [
        { 
          icon: Building2, 
          title: "Поддержка НКО", 
          text: "Мы предоставляем комплексные юридические консультации некоммерческим организациям, помогая им в вопросах управления, соответствия требованиям, налогообложения и операционных задач, чтобы они могли сосредоточиться на своей миссии."
        },
        { 
          icon: Shield, 
          title: "Права человека", 
          text: "Наши юристы работают над делами, связанными с фундаментальными правами и свободами, сотрудничая с правозащитными организациями для защиты уязвимых групп населения и содействия системным изменениям."
        },
        { 
          icon: Gavel, 
          title: "Доступ к правосудию", 
          text: "Мы представляем людей, которые не могут позволить себе юридическую помощь в критических вопросах, обеспечивая, чтобы экономические обстоятельства не мешали никому получить справедливое юридическое представительство."
        },
        { 
          icon: HandHeart, 
          title: "Организации социального воздействия", 
          text: "Мы поддерживаем фонды, благотворительные организации и социальные предприятия в юридической структуризации, контрактах и регуляторном соответствии для максимизации их положительного влияния на общество."
        },
        { 
          icon: BookOpen, 
          title: "Правовое просвещение", 
          text: "Наши юристы участвуют в программах правовой грамотности, обучая сообщества их правам и эффективному использованию правовой системы."
        },
        { 
          icon: Globe2, 
          title: "Экологические инициативы", 
          text: "Мы консультируем экологические организации по регуляторным вопросам, инициативам по сохранению природы и проектам устойчивого развития, которые приносят пользу сообществам и экосистемам."
        },
      ],
      statsTitle: "Наше Pro Bono влияние",
      stats: [
        { value: "35+", label: "Лет Pro Bono работы" },
        { value: "5,000+", label: "Pro Bono часов ежегодно" },
        { value: "100+", label: "Поддержанных организаций" },
        { value: "50+", label: "Участвующих юристов" },
      ],
      participationTitle: "Как участвуют наши юристы",
      participationSubtitle: "Каждый юрист Von Wobeser y Sierra приглашён к участию",
      participationIntro: "Pro bono работа является неотъемлемой частью профессионального развития в нашей фирме. Мы верим, что отдача обществу не только служит нашему сообществу, но и обогащает навыки и перспективы наших юристов.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Специализированный Pro Bono комитет", 
          text: "Специализированный комитет координирует наши pro bono усилия, подбирая юристам дела, соответствующие их экспертизе и интересам, обеспечивая при этом качественное представительство."
        },
        { 
          icon: Handshake, 
          title: "Стратегические партнёрства", 
          text: "Мы сотрудничаем с организациями правовой помощи, университетами и другими юридическими фирмами для максимизации нашего коллективного влияния и решения сложных задач, требующих разнообразной экспертизы."
        },
        { 
          icon: Award, 
          title: "Программа признания", 
          text: "Мы признаём и отмечаем юристов, делающих выдающийся вклад в pro bono работу, подчёркивая её важность для культуры и ценностей нашей фирмы."
        },
        { 
          icon: TrendingUp, 
          title: "Профессиональное развитие", 
          text: "Pro bono дела предлагают уникальные возможности для обучения, позволяя младшим юристам брать на себя значительную ответственность под руководством опытных наставников."
        },
      ],
      ctaTitle: "Станьте партнёром",
      ctaText: "Если вы представляете некоммерческую организацию или знаете о достойном деле, которому может помочь pro bono юридическая помощь, мы приглашаем вас связаться с нами. Вместе мы можем работать над созданием более справедливого общества.",
      contactButton: "Связаться с нами",
      learnMoreAbout: "Узнать больше о нашей фирме",
    },
    fr: {
      title: "Pro Bono",
      subtitle: "Engagés à rendre la justice accessible à tous",
      commitmentTitle: "Plus de 35 ans d'engagement Pro Bono",
      commitmentText1: "Depuis 1989, Von Wobeser y Sierra est à l'avant-garde des services juridiques pro bono au Mexique. Notre cabinet a été parmi les premiers du pays à établir un programme pro bono formel, reflétant notre profond engagement envers la responsabilité sociale et l'accès à la justice.",
      commitmentText2: "Nos avocats consacrent des milliers d'heures par an aux affaires pro bono, fournissant une représentation juridique de haute qualité aux individus et organisations qui ne pourraient pas se le permettre autrement. Cet engagement n'est pas qu'un programme — c'est une valeur fondamentale ancrée dans la culture de notre cabinet.",
      areasTitle: "Domaines de Pratique Pro Bono",
      areasSubtitle: "Nous concentrons nos efforts là où nous pouvons avoir le plus d'impact",
      areas: [
        { 
          icon: Building2, 
          title: "Soutien aux ONG", 
          text: "Nous fournissons des conseils juridiques complets aux organisations à but non lucratif, les aidant en matière de gouvernance, conformité, questions fiscales et défis opérationnels pour qu'elles puissent se concentrer sur leur mission."
        },
        { 
          icon: Shield, 
          title: "Droits de l'Homme", 
          text: "Nos avocats travaillent sur des affaires impliquant les droits et libertés fondamentaux, collaborant avec des organisations de droits humains pour protéger les populations vulnérables et plaider pour un changement systémique."
        },
        { 
          icon: Gavel, 
          title: "Accès à la Justice", 
          text: "Nous représentons les individus qui ne peuvent pas se permettre un conseil juridique dans des affaires critiques, garantissant que les circonstances économiques n'empêchent personne de recevoir une représentation juridique équitable."
        },
        { 
          icon: HandHeart, 
          title: "Organisations d'Impact Social", 
          text: "Nous soutenons les fondations, organisations caritatives et entreprises sociales dans la structuration juridique, les contrats et la conformité réglementaire pour maximiser leur impact positif sur la société."
        },
        { 
          icon: BookOpen, 
          title: "Éducation Juridique", 
          text: "Nos avocats participent à des programmes d'alphabétisation juridique, éduquant les communautés sur leurs droits et comment naviguer efficacement dans le système juridique."
        },
        { 
          icon: Globe2, 
          title: "Causes Environnementales", 
          text: "Nous conseillons les organisations environnementales sur les questions réglementaires, les initiatives de conservation et les projets de durabilité qui bénéficient aux communautés et aux écosystèmes."
        },
      ],
      statsTitle: "Notre Impact Pro Bono",
      stats: [
        { value: "35+", label: "Années de Travail Pro Bono" },
        { value: "5 000+", label: "Heures Pro Bono par An" },
        { value: "100+", label: "Organisations Soutenues" },
        { value: "50+", label: "Avocats Participants" },
      ],
      participationTitle: "Comment nos avocats participent",
      participationSubtitle: "Chaque avocat chez Von Wobeser y Sierra est encouragé à contribuer",
      participationIntro: "Le travail pro bono fait partie intégrante du développement professionnel dans notre cabinet. Nous croyons que redonner sert non seulement notre communauté mais enrichit également les compétences et perspectives de nos avocats.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Comité Pro Bono Dédié", 
          text: "Un comité spécialisé coordonne nos efforts pro bono, associant les avocats à des affaires correspondant à leur expertise et leurs intérêts tout en garantissant une représentation de qualité."
        },
        { 
          icon: Handshake, 
          title: "Partenariats Stratégiques", 
          text: "Nous collaborons avec des organisations d'aide juridique, des universités et d'autres cabinets d'avocats pour maximiser notre impact collectif et relever des défis complexes nécessitant une expertise diversifiée."
        },
        { 
          icon: Award, 
          title: "Programme de Reconnaissance", 
          text: "Nous reconnaissons et célébrons les avocats qui apportent des contributions exceptionnelles au travail pro bono, renforçant son importance pour la culture et les valeurs de notre cabinet."
        },
        { 
          icon: TrendingUp, 
          title: "Développement Professionnel", 
          text: "Les affaires pro bono offrent des opportunités d'apprentissage uniques, permettant aux avocats juniors d'assumer des responsabilités significatives sous la guidance de mentors expérimentés."
        },
      ],
      ctaTitle: "Devenez Partenaire",
      ctaText: "Si vous représentez une organisation à but non lucratif ou connaissez une cause méritante qui pourrait bénéficier d'une assistance juridique pro bono, nous vous encourageons à nous contacter. Ensemble, nous pouvons œuvrer pour une société plus juste.",
      contactButton: "Nous Contacter",
      learnMoreAbout: "En Savoir Plus Sur Notre Cabinet",
    },
    it: {
      title: "Pro Bono",
      subtitle: "Impegnati a rendere la giustizia accessibile a tutti",
      commitmentTitle: "Oltre 35 anni di impegno Pro Bono",
      commitmentText1: "Dal 1989, Von Wobeser y Sierra è all'avanguardia dei servizi legali pro bono in Messico. Il nostro studio è stato tra i primi nel paese a istituire un programma pro bono formale, riflettendo il nostro profondo impegno verso la responsabilità sociale e l'accesso alla giustizia.",
      commitmentText2: "I nostri avvocati dedicano migliaia di ore ogni anno a questioni pro bono, fornendo rappresentanza legale di alta qualità a individui e organizzazioni che altrimenti non potrebbero permettersela. Questo impegno non è solo un programma — è un valore fondamentale radicato nella cultura del nostro studio.",
      areasTitle: "Aree di Pratica Pro Bono",
      areasSubtitle: "Concentriamo i nostri sforzi dove possiamo avere il maggior impatto",
      areas: [
        { 
          icon: Building2, 
          title: "Supporto alle ONG", 
          text: "Forniamo consulenza legale completa alle organizzazioni non profit, aiutandole con governance, conformità, questioni fiscali e sfide operative affinché possano concentrarsi sulla loro missione."
        },
        { 
          icon: Shield, 
          title: "Diritti Umani", 
          text: "I nostri avvocati lavorano su casi che coinvolgono diritti e libertà fondamentali, collaborando con organizzazioni per i diritti umani per proteggere le popolazioni vulnerabili e sostenere il cambiamento sistemico."
        },
        { 
          icon: Gavel, 
          title: "Accesso alla Giustizia", 
          text: "Rappresentiamo individui che non possono permettersi un consulente legale in questioni critiche, garantendo che le circostanze economiche non impediscano a nessuno di ricevere una rappresentanza legale equa."
        },
        { 
          icon: HandHeart, 
          title: "Organizzazioni a Impatto Sociale", 
          text: "Supportiamo fondazioni, enti di beneficenza e imprese sociali nella strutturazione legale, contratti e conformità normativa per massimizzare il loro impatto positivo sulla società."
        },
        { 
          icon: BookOpen, 
          title: "Educazione Legale", 
          text: "I nostri avvocati partecipano a programmi di alfabetizzazione legale, educando le comunità sui loro diritti e su come navigare efficacemente nel sistema legale."
        },
        { 
          icon: Globe2, 
          title: "Cause Ambientali", 
          text: "Consigliamo organizzazioni ambientali su questioni normative, iniziative di conservazione e progetti di sostenibilità che beneficiano comunità ed ecosistemi."
        },
      ],
      statsTitle: "Il Nostro Impatto Pro Bono",
      stats: [
        { value: "35+", label: "Anni di Lavoro Pro Bono" },
        { value: "5.000+", label: "Ore Pro Bono Annuali" },
        { value: "100+", label: "Organizzazioni Supportate" },
        { value: "50+", label: "Avvocati Partecipanti" },
      ],
      participationTitle: "Come partecipano i nostri avvocati",
      participationSubtitle: "Ogni avvocato di Von Wobeser y Sierra è incoraggiato a contribuire",
      participationIntro: "Il lavoro pro bono è parte integrante dello sviluppo professionale nel nostro studio. Crediamo che restituire non solo serva la nostra comunità ma arricchisca anche le competenze e le prospettive dei nostri avvocati.",
      participationAspects: [
        { 
          icon: Users, 
          title: "Comitato Pro Bono Dedicato", 
          text: "Un comitato specializzato coordina i nostri sforzi pro bono, abbinando gli avvocati a questioni che si allineano con la loro competenza e i loro interessi garantendo al contempo una rappresentanza di qualità."
        },
        { 
          icon: Handshake, 
          title: "Partnership Strategiche", 
          text: "Collaboriamo con organizzazioni di assistenza legale, università e altri studi legali per massimizzare il nostro impatto collettivo e affrontare sfide complesse che richiedono competenze diverse."
        },
        { 
          icon: Award, 
          title: "Programma di Riconoscimento", 
          text: "Riconosciamo e celebriamo gli avvocati che danno contributi eccezionali al lavoro pro bono, rafforzando la sua importanza per la cultura e i valori del nostro studio."
        },
        { 
          icon: TrendingUp, 
          title: "Sviluppo Professionale", 
          text: "Le questioni pro bono offrono opportunità di apprendimento uniche, permettendo agli avvocati junior di gestire responsabilità significative sotto la guida di mentori esperti."
        },
      ],
      ctaTitle: "Diventa Partner",
      ctaText: "Se rappresenti un'organizzazione non profit o conosci una causa meritevole che potrebbe beneficiare dell'assistenza legale pro bono, ti incoraggiamo a contattarci. Insieme, possiamo lavorare verso una società più giusta.",
      contactButton: "Contattaci",
      learnMoreAbout: "Scopri di Più Sul Nostro Studio",
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
    <div className="min-h-screen bg-background" data-testid="page-pro-bono">
      <SEOHead page="proBono" language={language} />
      <Header />

      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-pro-bono-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <Heart className="w-10 h-10 text-primary" />
            </motion.div>
            <div className="h-0.5 w-12 bg-primary mx-auto mb-6" />
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-heading font-light text-white mb-6 uppercase tracking-[0.15em]"
              data-testid="text-pro-bono-title"
            >
              {t.title}
            </h1>
            <p
              className="text-base md:text-lg text-white/60 max-w-3xl mx-auto font-light leading-relaxed"
              data-testid="text-pro-bono-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content">
        <section className="py-20 lg:py-24" data-testid="section-commitment">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="h-0.5 w-8 bg-primary" />
                <h2 className="text-2xl md:text-3xl font-heading font-light text-foreground uppercase tracking-[0.12em]">
                  {t.commitmentTitle}
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <p className="text-lg text-foreground leading-relaxed">
                  {t.commitmentText1}
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {t.commitmentText2}
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24 bg-secondary/50" data-testid="section-areas">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <p className="font-support text-xs uppercase tracking-[0.2em] text-primary mb-4" data-testid="text-areas-subtitle">
                {t.areasSubtitle}
              </p>
              <h2 className="text-2xl md:text-3xl font-heading font-light text-foreground uppercase tracking-[0.12em] mb-4">
                {t.areasTitle}
              </h2>
              <div className="h-0.5 w-12 bg-primary mx-auto" />
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {t.areas.map((area, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <NumberedCard
                    index={index}
                    title={area.title}
                    body={area.text}
                    dataTestid={`card-area-${index}`}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="bg-[#1a1a19] py-16 lg:py-20" data-testid="section-stats">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl md:text-3xl font-heading font-light text-white uppercase tracking-[0.12em]">
                {t.statsTitle}
              </h2>
              <div className="h-0.5 w-12 bg-primary mx-auto mt-4" />
            </motion.div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center"
                  data-testid={`stat-${index}`}
                >
                  <p className="text-4xl lg:text-5xl font-heading text-primary mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-white/60 uppercase tracking-wider font-support">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24" data-testid="section-participation">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]">
                {t.participationTitle}
              </h2>
              <div className="h-0.5 w-12 bg-primary mx-auto mb-6" />
              <p className="text-lg text-primary font-medium mb-4" data-testid="text-participation-subtitle">
                {t.participationSubtitle}
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl mx-auto" data-testid="text-participation-intro">
                {t.participationIntro}
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.participationAspects.map((aspect, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <NumberedCard
                    index={index}
                    title={aspect.title}
                    body={aspect.text}
                    dataTestid={`card-participation-${index}`}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-20 lg:py-24 bg-[#1a1a19]" data-testid="section-cta">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Scale className="w-10 h-10 text-primary mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-heading font-light text-white uppercase tracking-[0.12em] mb-4">
                {t.ctaTitle}
              </h2>
              <div className="h-0.5 w-12 bg-primary mx-auto mb-8" />
              <p className="text-lg text-white/60 leading-relaxed mb-10" data-testid="text-cta-description">
                {t.ctaText}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/contact">
                  <Button size="lg" className="rounded-none" data-testid="button-contact">
                    <Heart className="w-4 h-4 mr-2" />
                    {t.contactButton}
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="rounded-none border-white/20 text-white hover:bg-white/10" data-testid="button-learn-more">
                    {t.learnMoreAbout}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
