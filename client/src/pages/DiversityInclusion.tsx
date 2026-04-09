import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Users,
  Heart,
  UserCheck,
  Target,
  TrendingUp,
  GraduationCap,
  Shield,
  BarChart3,
  UsersRound,
  HeartHandshake,
  Sparkles,
  Award,
  Scale,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DiversityInclusion() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Diversity & Inclusion",
      subtitle: "Building a more inclusive legal profession since 1986",
      foundingTitle: "Our Founding Commitment",
      foundingText1: "Since its founding in 1986, Von Wobeser y Sierra has been committed to creating an inclusive environment where talent thrives regardless of background, gender, or personal circumstances. This commitment was embedded in our firm's DNA from day one and continues to guide our practices today.",
      foundingText2: "We believe that diverse perspectives lead to better legal solutions. Our firm has consistently championed equality and inclusion, long before these became industry standards, recognizing that a diverse team is our greatest strength in serving clients with complex legal needs.",
      statsTitle: "Our Progress in Numbers",
      stats: [
        { value: "45%", label: "Women in the Firm", icon: UsersRound },
        { value: "35%", label: "Women Partners", icon: TrendingUp },
        { value: "50%", label: "Women in Leadership Roles", icon: Target },
        { value: "100%", label: "Equal Opportunity Commitment", icon: Shield },
      ],
      initiativesTitle: "Our Diversity Initiatives",
      initiativesSubtitle: "Concrete actions for a more equitable workplace",
      initiatives: [
        {
          icon: UserCheck,
          title: "Inclusive Hiring",
          text: "Our recruitment practices are designed to attract and evaluate candidates based solely on their skills, experience, and potential, ensuring equal opportunities for all regardless of gender, background, or personal circumstances.",
        },
        {
          icon: BarChart3,
          title: "Gender Equality",
          text: "We actively promote gender equality at all levels of the organization. Our programs support the advancement of women in leadership positions and ensure equitable compensation and growth opportunities.",
        },
        {
          icon: Sparkles,
          title: "Equal Opportunities",
          text: "Every team member has access to the same development resources, challenging assignments, and career advancement paths. We are committed to removing barriers and creating pathways for success for all.",
        },
        {
          icon: GraduationCap,
          title: "Mentorship Programs",
          text: "Our structured mentorship programs pair junior attorneys with experienced partners, fostering professional growth and ensuring that knowledge and opportunities are shared across all levels of our organization.",
        },
      ],
      proBonoTitle: "Diversity Through Pro Bono",
      proBonoText: "Our commitment to diversity extends beyond our firm walls. Through our pro bono practice, we provide legal services to underrepresented communities, support organizations fighting for equality, and contribute to access to justice initiatives that help level the playing field for all.",
      proBonoButton: "Learn About Our Pro Bono Work",
      commitmentTitle: "Our Ongoing Commitment",
      commitmentText: "Diversity and inclusion are not just policies at Von Wobeser y Sierra—they are core values that shape how we work, grow, and serve our clients. We continuously evaluate and improve our practices to ensure we remain at the forefront of creating a more equitable legal profession.",
      valuesTitle: "Inclusion Values",
      values: [
        { icon: Scale, title: "Equity", text: "Fair treatment and equal access to opportunities for all" },
        { icon: Heart, title: "Respect", text: "Honoring the dignity and unique contributions of every individual" },
        { icon: Users, title: "Belonging", text: "Creating a workplace where everyone feels valued and included" },
        { icon: Award, title: "Excellence", text: "Leveraging diverse perspectives to achieve the highest standards" },
      ],
      joinTitle: "Join Our Team",
      joinText: "Be part of a firm that values your unique perspective and supports your professional growth.",
      joinButton: "View Career Opportunities",
    },
    es: {
      title: "Diversidad e Inclusión",
      subtitle: "Construyendo una profesión legal más inclusiva desde 1986",
      foundingTitle: "Nuestro Compromiso Fundacional",
      foundingText1: "Desde su fundación en 1986, Von Wobeser y Sierra ha estado comprometido con crear un ambiente inclusivo donde el talento prospere sin importar antecedentes, género o circunstancias personales. Este compromiso fue incorporado en el ADN de nuestra firma desde el primer día y continúa guiando nuestras prácticas hoy.",
      foundingText2: "Creemos que las perspectivas diversas conducen a mejores soluciones legales. Nuestra firma ha defendido consistentemente la igualdad y la inclusión, mucho antes de que estos se convirtieran en estándares de la industria, reconociendo que un equipo diverso es nuestra mayor fortaleza para servir a clientes con necesidades legales complejas.",
      statsTitle: "Nuestro Progreso en Números",
      stats: [
        { value: "45%", label: "Mujeres en la Firma", icon: UsersRound },
        { value: "35%", label: "Mujeres Socias", icon: TrendingUp },
        { value: "50%", label: "Mujeres en Roles de Liderazgo", icon: Target },
        { value: "100%", label: "Compromiso con Igualdad de Oportunidades", icon: Shield },
      ],
      initiativesTitle: "Nuestras Iniciativas de Diversidad",
      initiativesSubtitle: "Acciones concretas para un lugar de trabajo más equitativo",
      initiatives: [
        {
          icon: UserCheck,
          title: "Contratación Inclusiva",
          text: "Nuestras prácticas de reclutamiento están diseñadas para atraer y evaluar candidatos basándose únicamente en sus habilidades, experiencia y potencial, asegurando igualdad de oportunidades para todos sin importar género, antecedentes o circunstancias personales.",
        },
        {
          icon: BarChart3,
          title: "Igualdad de Género",
          text: "Promovemos activamente la igualdad de género en todos los niveles de la organización. Nuestros programas apoyan el avance de mujeres en posiciones de liderazgo y aseguran compensación equitativa y oportunidades de crecimiento.",
        },
        {
          icon: Sparkles,
          title: "Igualdad de Oportunidades",
          text: "Cada miembro del equipo tiene acceso a los mismos recursos de desarrollo, asignaciones desafiantes y caminos de avance profesional. Estamos comprometidos a remover barreras y crear caminos hacia el éxito para todos.",
        },
        {
          icon: GraduationCap,
          title: "Programas de Mentoría",
          text: "Nuestros programas estructurados de mentoría emparejan a abogados junior con socios experimentados, fomentando el crecimiento profesional y asegurando que el conocimiento y las oportunidades se compartan en todos los niveles de nuestra organización.",
        },
      ],
      proBonoTitle: "Diversidad a Través del Pro Bono",
      proBonoText: "Nuestro compromiso con la diversidad se extiende más allá de las paredes de nuestra firma. A través de nuestra práctica pro bono, brindamos servicios legales a comunidades subrepresentadas, apoyamos organizaciones que luchan por la igualdad y contribuimos a iniciativas de acceso a la justicia que ayudan a nivelar el campo de juego para todos.",
      proBonoButton: "Conoce Nuestro Trabajo Pro Bono",
      commitmentTitle: "Nuestro Compromiso Continuo",
      commitmentText: "La diversidad e inclusión no son solo políticas en Von Wobeser y Sierra—son valores fundamentales que moldean cómo trabajamos, crecemos y servimos a nuestros clientes. Continuamente evaluamos y mejoramos nuestras prácticas para asegurar que estemos a la vanguardia en la creación de una profesión legal más equitativa.",
      valuesTitle: "Valores de Inclusión",
      values: [
        { icon: Scale, title: "Equidad", text: "Trato justo e igual acceso a oportunidades para todos" },
        { icon: Heart, title: "Respeto", text: "Honrar la dignidad y las contribuciones únicas de cada individuo" },
        { icon: Users, title: "Pertenencia", text: "Crear un lugar de trabajo donde todos se sientan valorados e incluidos" },
        { icon: Award, title: "Excelencia", text: "Aprovechar perspectivas diversas para alcanzar los más altos estándares" },
      ],
      joinTitle: "Únete a Nuestro Equipo",
      joinText: "Sé parte de una firma que valora tu perspectiva única y apoya tu crecimiento profesional.",
      joinButton: "Ver Oportunidades de Carrera",
    },
    de: {
      title: "Vielfalt & Inklusion",
      subtitle: "Für einen inklusiveren Rechtsberuf seit 1986",
      foundingTitle: "Unser Gründungsversprechen",
      foundingText1: "Seit seiner Gründung im Jahr 1986 hat sich Von Wobeser y Sierra der Schaffung eines inklusiven Umfelds verschrieben, in dem Talent unabhängig von Hintergrund, Geschlecht oder persönlichen Umständen gedeihen kann. Dieses Engagement war von Anfang an in der DNA unserer Kanzlei verankert und leitet unsere Praktiken bis heute.",
      foundingText2: "Wir glauben, dass unterschiedliche Perspektiven zu besseren rechtlichen Lösungen führen. Unsere Kanzlei hat sich konsequent für Gleichberechtigung und Inklusion eingesetzt, lange bevor diese zu Branchenstandards wurden, in der Erkenntnis, dass ein vielfältiges Team unsere größte Stärke bei der Betreuung von Mandanten mit komplexen rechtlichen Anforderungen ist.",
      statsTitle: "Unsere Fortschritte in Zahlen",
      stats: [
        { value: "45%", label: "Frauen in der Kanzlei", icon: UsersRound },
        { value: "35%", label: "Frauen als Partner", icon: TrendingUp },
        { value: "50%", label: "Frauen in Führungspositionen", icon: Target },
        { value: "100%", label: "Engagement für Chancengleichheit", icon: Shield },
      ],
      initiativesTitle: "Unsere Initiativen",
      initiativesSubtitle: "Konkrete Maßnahmen für einen gerechteren Arbeitsplatz",
      initiatives: [
        {
          icon: UserCheck,
          title: "Inklusive Einstellung",
          text: "Unsere Rekrutierungspraktiken sind darauf ausgelegt, Kandidaten ausschließlich auf der Grundlage ihrer Fähigkeiten, Erfahrungen und ihres Potenzials anzuziehen und zu bewerten, um Chancengleichheit für alle unabhängig von Geschlecht, Hintergrund oder persönlichen Umständen zu gewährleisten.",
        },
        {
          icon: BarChart3,
          title: "Geschlechtergleichstellung",
          text: "Wir fördern aktiv die Gleichstellung der Geschlechter auf allen Ebenen der Organisation. Unsere Programme unterstützen den Aufstieg von Frauen in Führungspositionen und gewährleisten eine gerechte Vergütung und Wachstumsmöglichkeiten.",
        },
        {
          icon: Sparkles,
          title: "Chancengleichheit",
          text: "Jedes Teammitglied hat Zugang zu denselben Entwicklungsressourcen, anspruchsvollen Aufgaben und Karrierewegen. Wir sind bestrebt, Barrieren abzubauen und Wege zum Erfolg für alle zu schaffen.",
        },
        {
          icon: GraduationCap,
          title: "Mentoring-Programme",
          text: "Unsere strukturierten Mentoring-Programme bringen Junior-Anwälte mit erfahrenen Partnern zusammen, fördern das berufliche Wachstum und stellen sicher, dass Wissen und Möglichkeiten auf allen Ebenen unserer Organisation geteilt werden.",
        },
      ],
      proBonoTitle: "Vielfalt durch Pro Bono",
      proBonoText: "Unser Engagement für Vielfalt geht über die Grenzen unserer Kanzlei hinaus. Durch unsere Pro-Bono-Praxis bieten wir Rechtsdienstleistungen für unterrepräsentierte Gemeinschaften, unterstützen Organisationen, die für Gleichberechtigung kämpfen, und tragen zu Initiativen für den Zugang zur Justiz bei, die allen gleiche Chancen ermöglichen.",
      proBonoButton: "Erfahren Sie mehr über unsere Pro-Bono-Arbeit",
      commitmentTitle: "Unser fortlaufendes Engagement",
      commitmentText: "Vielfalt und Inklusion sind bei Von Wobeser y Sierra nicht nur Richtlinien – sie sind Grundwerte, die unsere Arbeitsweise, unser Wachstum und unseren Dienst an unseren Mandanten prägen. Wir evaluieren und verbessern unsere Praktiken kontinuierlich, um sicherzustellen, dass wir an der Spitze der Schaffung eines gerechteren Rechtsberufs bleiben.",
      valuesTitle: "Werte der Inklusion",
      values: [
        { icon: Scale, title: "Gerechtigkeit", text: "Faire Behandlung und gleicher Zugang zu Möglichkeiten für alle" },
        { icon: Heart, title: "Respekt", text: "Die Würde und einzigartigen Beiträge jedes Einzelnen ehren" },
        { icon: Users, title: "Zugehörigkeit", text: "Einen Arbeitsplatz schaffen, an dem sich jeder wertgeschätzt und einbezogen fühlt" },
        { icon: Award, title: "Exzellenz", text: "Vielfältige Perspektiven nutzen, um höchste Standards zu erreichen" },
      ],
      joinTitle: "Werden Sie Teil unseres Teams",
      joinText: "Seien Sie Teil einer Kanzlei, die Ihre einzigartige Perspektive schätzt und Ihr berufliches Wachstum unterstützt.",
      joinButton: "Karrieremöglichkeiten ansehen",
    },
    zh: {
      title: "多元与包容",
      subtitle: "自1986年以来，致力于建设更加包容的法律行业",
      foundingTitle: "我们的创立承诺",
      foundingText1: "自1986年成立以来，Von Wobeser y Sierra一直致力于创造一个包容的环境，让人才无论背景、性别或个人情况如何都能蓬勃发展。这一承诺从第一天起就融入了我们事务所的基因，并继续指导着我们今天的实践。",
      foundingText2: "我们相信多元化的视角能带来更好的法律解决方案。我们的事务所一直倡导平等和包容，早在这些成为行业标准之前就已如此，因为我们认识到多元化的团队是我们为具有复杂法律需求的客户服务的最大优势。",
      statsTitle: "我们的进展数据",
      stats: [
        { value: "45%", label: "事务所女性比例", icon: UsersRound },
        { value: "35%", label: "女性合伙人", icon: TrendingUp },
        { value: "50%", label: "女性领导岗位", icon: Target },
        { value: "100%", label: "平等机会承诺", icon: Shield },
      ],
      initiativesTitle: "我们的倡议",
      initiativesSubtitle: "为更公平的工作场所采取的具体行动",
      initiatives: [
        {
          icon: UserCheck,
          title: "包容性招聘",
          text: "我们的招聘实践旨在仅根据候选人的技能、经验和潜力来吸引和评估候选人，确保所有人无论性别、背景或个人情况如何都能获得平等的机会。",
        },
        {
          icon: BarChart3,
          title: "性别平等",
          text: "我们在组织的各个层面积极促进性别平等。我们的项目支持女性晋升到领导岗位，并确保公平的薪酬和成长机会。",
        },
        {
          icon: Sparkles,
          title: "机会平等",
          text: "每位团队成员都能获得相同的发展资源、具有挑战性的任务和职业晋升途径。我们致力于消除障碍，为所有人创造成功之路。",
        },
        {
          icon: GraduationCap,
          title: "导师计划",
          text: "我们结构化的导师计划将初级律师与经验丰富的合伙人配对，促进职业成长，确保知识和机会在组织的各个层面得到共享。",
        },
      ],
      proBonoTitle: "通过公益实现多元化",
      proBonoText: "我们对多元化的承诺超越了事务所的围墙。通过我们的公益实践，我们为代表性不足的社区提供法律服务，支持为平等而奋斗的组织，并为帮助所有人获得公平竞争环境的司法援助倡议做出贡献。",
      proBonoButton: "了解我们的公益工作",
      commitmentTitle: "我们持续的承诺",
      commitmentText: "在Von Wobeser y Sierra，多元化和包容性不仅仅是政策——它们是塑造我们工作方式、成长方式和服务客户方式的核心价值观。我们不断评估和改进我们的实践，以确保我们始终走在创建更公平法律行业的前沿。",
      valuesTitle: "包容价值观",
      values: [
        { icon: Scale, title: "公平", text: "对所有人公平对待和平等获得机会" },
        { icon: Heart, title: "尊重", text: "尊重每个人的尊严和独特贡献" },
        { icon: Users, title: "归属感", text: "创造一个让每个人都感到被重视和被接纳的工作场所" },
        { icon: Award, title: "卓越", text: "利用多元化视角实现最高标准" },
      ],
      joinTitle: "加入我们的团队",
      joinText: "成为一家重视您独特视角并支持您职业成长的事务所的一员。",
      joinButton: "查看职业机会",
    },
    ko: {
      title: "다양성과 포용성",
      subtitle: "1986년부터 더 포용적인 법조계를 만들어 가고 있습니다",
      foundingTitle: "창립 정신",
      foundingText1: "1986년 설립 이래로 Von Wobeser y Sierra는 배경, 성별, 개인적 상황에 관계없이 재능이 꽃필 수 있는 포용적인 환경을 조성하기 위해 헌신해 왔습니다. 이러한 헌신은 첫날부터 우리 회사의 DNA에 새겨져 있으며 오늘날까지 우리의 관행을 이끌고 있습니다.",
      foundingText2: "우리는 다양한 관점이 더 나은 법률 솔루션으로 이어진다고 믿습니다. 우리 회사는 이러한 것들이 업계 표준이 되기 훨씬 전부터 평등과 포용을 일관되게 옹호해 왔으며, 다양한 팀이 복잡한 법적 요구를 가진 고객에게 서비스를 제공하는 데 있어 가장 큰 강점임을 인식하고 있습니다.",
      statsTitle: "수치로 보는 우리의 진전",
      stats: [
        { value: "45%", label: "회사 내 여성 비율", icon: UsersRound },
        { value: "35%", label: "여성 파트너", icon: TrendingUp },
        { value: "50%", label: "여성 리더십 역할", icon: Target },
        { value: "100%", label: "기회 균등 약속", icon: Shield },
      ],
      initiativesTitle: "다양성 이니셔티브",
      initiativesSubtitle: "더 공정한 직장을 위한 구체적인 조치",
      initiatives: [
        {
          icon: UserCheck,
          title: "포용적 채용",
          text: "우리의 채용 관행은 성별, 배경, 개인적 상황에 관계없이 오직 기술, 경험, 잠재력을 기반으로 후보자를 유치하고 평가하여 모든 사람에게 동등한 기회를 보장하도록 설계되었습니다.",
        },
        {
          icon: BarChart3,
          title: "성평등",
          text: "우리는 조직의 모든 수준에서 성평등을 적극적으로 촉진합니다. 우리의 프로그램은 여성의 리더십 직위 승진을 지원하고 공정한 보상과 성장 기회를 보장합니다.",
        },
        {
          icon: Sparkles,
          title: "기회 균등",
          text: "모든 팀원은 동일한 개발 자원, 도전적인 업무, 경력 발전 경로에 접근할 수 있습니다. 우리는 장벽을 제거하고 모든 사람을 위한 성공의 길을 만들기 위해 노력합니다.",
        },
        {
          icon: GraduationCap,
          title: "멘토링 프로그램",
          text: "우리의 체계적인 멘토링 프로그램은 주니어 변호사와 경험 많은 파트너를 연결하여 전문적 성장을 촉진하고 지식과 기회가 조직의 모든 수준에서 공유되도록 합니다.",
        },
      ],
      proBonoTitle: "프로보노를 통한 다양성",
      proBonoText: "다양성에 대한 우리의 헌신은 회사 밖으로 확장됩니다. 프로보노 활동을 통해 소외된 커뮤니티에 법률 서비스를 제공하고, 평등을 위해 싸우는 단체를 지원하며, 모든 사람에게 공정한 경쟁의 장을 마련하는 법률 접근성 이니셔티브에 기여합니다.",
      proBonoButton: "프로보노 활동 알아보기",
      commitmentTitle: "지속적인 헌신",
      commitmentText: "Von Wobeser y Sierra에서 다양성과 포용성은 단순한 정책이 아닙니다. 이는 우리가 일하고, 성장하고, 고객에게 서비스를 제공하는 방식을 형성하는 핵심 가치입니다. 우리는 더 공정한 법조계를 만드는 데 선두에 서기 위해 지속적으로 관행을 평가하고 개선합니다.",
      valuesTitle: "포용 가치",
      values: [
        { icon: Scale, title: "공정성", text: "모든 사람에게 공정한 대우와 동등한 기회 접근" },
        { icon: Heart, title: "존중", text: "모든 개인의 존엄성과 고유한 기여를 존중" },
        { icon: Users, title: "소속감", text: "모든 사람이 가치 있고 포함된다고 느끼는 직장 만들기" },
        { icon: Award, title: "탁월함", text: "다양한 관점을 활용하여 최고 수준 달성" },
      ],
      joinTitle: "팀에 합류하세요",
      joinText: "여러분의 고유한 관점을 소중히 여기고 전문적 성장을 지원하는 회사의 일원이 되세요.",
      joinButton: "채용 기회 보기",
    },
    ja: {
      title: "ダイバーシティ＆インクルージョン",
      subtitle: "1986年以来、より包括的な法律専門職の構築に取り組んでいます",
      foundingTitle: "創業時からの約束",
      foundingText1: "1986年の創業以来、Von Wobeser y Sierraは、背景、性別、個人的な状況に関係なく、才能が花開くことができる包括的な環境の創造に取り組んできました。この約束は創業初日から当事務所のDNAに組み込まれ、今日も私たちの実践を導いています。",
      foundingText2: "私たちは、多様な視点がより良い法的ソリューションにつながると信じています。当事務所は、これらが業界標準になるずっと前から一貫して平等と包括性を擁護してきました。多様なチームが複雑な法的ニーズを持つクライアントにサービスを提供する上での最大の強みであることを認識しています。",
      statsTitle: "数字で見る私たちの進歩",
      stats: [
        { value: "45%", label: "事務所の女性比率", icon: UsersRound },
        { value: "35%", label: "女性パートナー", icon: TrendingUp },
        { value: "50%", label: "リーダーシップ役職の女性", icon: Target },
        { value: "100%", label: "機会均等へのコミットメント", icon: Shield },
      ],
      initiativesTitle: "ダイバーシティへの取り組み",
      initiativesSubtitle: "より公平な職場のための具体的な行動",
      initiatives: [
        {
          icon: UserCheck,
          title: "インクルーシブな採用",
          text: "私たちの採用プラクティスは、性別、背景、個人的な状況に関係なく、スキル、経験、潜在能力のみに基づいて候補者を引き付け、評価し、すべての人に平等な機会を確保するよう設計されています。",
        },
        {
          icon: BarChart3,
          title: "ジェンダー平等",
          text: "組織のあらゆるレベルでジェンダー平等を積極的に推進しています。私たちのプログラムは、リーダーシップポジションへの女性の昇進を支援し、公平な報酬と成長機会を確保します。",
        },
        {
          icon: Sparkles,
          title: "機会均等",
          text: "すべてのチームメンバーが、同じ開発リソース、挑戦的な課題、キャリア昇進の道にアクセスできます。私たちは障壁を取り除き、すべての人のための成功への道を創造することに取り組んでいます。",
        },
        {
          icon: GraduationCap,
          title: "メンターシッププログラム",
          text: "私たちの体系的なメンターシッププログラムは、ジュニア弁護士と経験豊富なパートナーをペアリングし、専門的な成長を促進し、知識と機会が組織のすべてのレベルで共有されることを確保します。",
        },
      ],
      proBonoTitle: "プロボノを通じた多様性",
      proBonoText: "多様性への私たちのコミットメントは、事務所の壁を超えて広がっています。プロボノ活動を通じて、代表性の低いコミュニティに法的サービスを提供し、平等のために闘う組織を支援し、すべての人が公平な競争の場を得られるよう司法へのアクセスに貢献しています。",
      proBonoButton: "プロボノ活動について詳しく",
      commitmentTitle: "継続的なコミットメント",
      commitmentText: "Von Wobeser y Sierraにおいて、ダイバーシティとインクルージョンは単なる方針ではありません。それらは、私たちがどのように働き、成長し、クライアントにサービスを提供するかを形作る核心的な価値観です。私たちは、より公平な法律専門職の創造の最前線にいるために、継続的に実践を評価し改善しています。",
      valuesTitle: "インクルージョンの価値観",
      values: [
        { icon: Scale, title: "公平性", text: "すべての人への公平な扱いと機会への平等なアクセス" },
        { icon: Heart, title: "尊重", text: "すべての個人の尊厳とユニークな貢献を尊重" },
        { icon: Users, title: "帰属意識", text: "誰もが価値を感じ、受け入れられる職場の創造" },
        { icon: Award, title: "卓越性", text: "多様な視点を活用して最高水準を達成" },
      ],
      joinTitle: "チームに参加しませんか",
      joinText: "あなたのユニークな視点を大切にし、専門的な成長をサポートする事務所の一員になりましょう。",
      joinButton: "キャリア機会を見る",
    },
    ar: {
      title: "التنوع والشمول",
      subtitle: "بناء مهنة قانونية أكثر شمولاً منذ عام 1986",
      foundingTitle: "التزامنا التأسيسي",
      foundingText1: "منذ تأسيسها في عام 1986، التزمت Von Wobeser y Sierra بخلق بيئة شاملة حيث يمكن للمواهب أن تزدهر بغض النظر عن الخلفية أو الجنس أو الظروف الشخصية. تم تضمين هذا الالتزام في الحمض النووي لشركتنا منذ اليوم الأول ويستمر في توجيه ممارساتنا اليوم.",
      foundingText2: "نؤمن بأن وجهات النظر المتنوعة تؤدي إلى حلول قانونية أفضل. دافعت شركتنا باستمرار عن المساواة والشمول، قبل أن تصبح هذه معايير صناعية بوقت طويل، مدركين أن الفريق المتنوع هو أعظم قوتنا في خدمة العملاء ذوي الاحتياجات القانونية المعقدة.",
      statsTitle: "تقدمنا بالأرقام",
      stats: [
        { value: "45%", label: "النساء في الشركة", icon: UsersRound },
        { value: "35%", label: "شريكات", icon: TrendingUp },
        { value: "50%", label: "نساء في أدوار قيادية", icon: Target },
        { value: "100%", label: "الالتزام بتكافؤ الفرص", icon: Shield },
      ],
      initiativesTitle: "مبادرات التنوع",
      initiativesSubtitle: "إجراءات ملموسة لمكان عمل أكثر إنصافاً",
      initiatives: [
        {
          icon: UserCheck,
          title: "التوظيف الشامل",
          text: "تم تصميم ممارسات التوظيف لدينا لجذب وتقييم المرشحين بناءً فقط على مهاراتهم وخبراتهم وإمكاناتهم، مما يضمن تكافؤ الفرص للجميع بغض النظر عن الجنس أو الخلفية أو الظروف الشخصية.",
        },
        {
          icon: BarChart3,
          title: "المساواة بين الجنسين",
          text: "نحن نعزز المساواة بين الجنسين بنشاط على جميع مستويات المنظمة. تدعم برامجنا تقدم المرأة في المناصب القيادية وتضمن تعويضاً عادلاً وفرص نمو.",
        },
        {
          icon: Sparkles,
          title: "تكافؤ الفرص",
          text: "يتمتع كل عضو في الفريق بإمكانية الوصول إلى نفس موارد التطوير والمهام الصعبة ومسارات التقدم الوظيفي. نحن ملتزمون بإزالة الحواجز وخلق مسارات للنجاح للجميع.",
        },
        {
          icon: GraduationCap,
          title: "برامج الإرشاد",
          text: "تقوم برامج الإرشاد المنظمة لدينا بربط المحامين المبتدئين بالشركاء ذوي الخبرة، مما يعزز النمو المهني ويضمن مشاركة المعرفة والفرص عبر جميع مستويات منظمتنا.",
        },
      ],
      proBonoTitle: "التنوع من خلال العمل المجاني",
      proBonoText: "يمتد التزامنا بالتنوع إلى ما وراء جدران شركتنا. من خلال ممارستنا للعمل المجاني، نقدم خدمات قانونية للمجتمعات الممثلة تمثيلاً ناقصاً، وندعم المنظمات التي تناضل من أجل المساواة، ونساهم في مبادرات الوصول إلى العدالة التي تساعد في تحقيق تكافؤ الفرص للجميع.",
      proBonoButton: "تعرف على عملنا المجاني",
      commitmentTitle: "التزامنا المستمر",
      commitmentText: "التنوع والشمول ليسا مجرد سياسات في Von Wobeser y Sierra - إنهما قيم أساسية تشكل كيفية عملنا ونمونا وخدمة عملائنا. نقوم باستمرار بتقييم وتحسين ممارساتنا لضمان بقائنا في طليعة إنشاء مهنة قانونية أكثر إنصافاً.",
      valuesTitle: "قيم الشمول",
      values: [
        { icon: Scale, title: "الإنصاف", text: "معاملة عادلة ووصول متساوٍ للفرص للجميع" },
        { icon: Heart, title: "الاحترام", text: "تكريم كرامة ومساهمات كل فرد الفريدة" },
        { icon: Users, title: "الانتماء", text: "خلق مكان عمل يشعر فيه الجميع بالتقدير والاندماج" },
        { icon: Award, title: "التميز", text: "الاستفادة من وجهات النظر المتنوعة لتحقيق أعلى المعايير" },
      ],
      joinTitle: "انضم إلى فريقنا",
      joinText: "كن جزءاً من شركة تقدر منظورك الفريد وتدعم نموك المهني.",
      joinButton: "عرض فرص العمل",
    },
    ru: {
      title: "Разнообразие и инклюзивность",
      subtitle: "Строим более инклюзивную юридическую профессию с 1986 года",
      foundingTitle: "Наше основополагающее обязательство",
      foundingText1: "С момента основания в 1986 году Von Wobeser y Sierra стремится создать инклюзивную среду, где таланты могут процветать независимо от происхождения, пола или личных обстоятельств. Это обязательство было заложено в ДНК нашей фирмы с первого дня и продолжает направлять нашу практику сегодня.",
      foundingText2: "Мы верим, что разнообразие точек зрения ведёт к лучшим юридическим решениям. Наша фирма неизменно отстаивала равенство и инклюзивность задолго до того, как это стало отраслевыми стандартами, признавая, что разнообразная команда — наша главная сила в обслуживании клиентов со сложными юридическими потребностями.",
      statsTitle: "Наш прогресс в цифрах",
      stats: [
        { value: "45%", label: "Женщин в фирме", icon: UsersRound },
        { value: "35%", label: "Женщин-партнёров", icon: TrendingUp },
        { value: "50%", label: "Женщин на руководящих должностях", icon: Target },
        { value: "100%", label: "Приверженность равным возможностям", icon: Shield },
      ],
      initiativesTitle: "Наши инициативы по разнообразию",
      initiativesSubtitle: "Конкретные действия для более справедливого рабочего места",
      initiatives: [
        {
          icon: UserCheck,
          title: "Инклюзивный найм",
          text: "Наши методы найма разработаны для привлечения и оценки кандидатов исключительно на основе их навыков, опыта и потенциала, обеспечивая равные возможности для всех независимо от пола, происхождения или личных обстоятельств.",
        },
        {
          icon: BarChart3,
          title: "Гендерное равенство",
          text: "Мы активно продвигаем гендерное равенство на всех уровнях организации. Наши программы поддерживают продвижение женщин на руководящие должности и обеспечивают справедливую компенсацию и возможности роста.",
        },
        {
          icon: Sparkles,
          title: "Равные возможности",
          text: "Каждый член команды имеет доступ к одинаковым ресурсам развития, сложным заданиям и путям карьерного роста. Мы стремимся устранять барьеры и создавать пути к успеху для всех.",
        },
        {
          icon: GraduationCap,
          title: "Программы наставничества",
          text: "Наши структурированные программы наставничества объединяют младших юристов с опытными партнёрами, способствуя профессиональному росту и обеспечивая обмен знаниями и возможностями на всех уровнях организации.",
        },
      ],
      proBonoTitle: "Разнообразие через Pro Bono",
      proBonoText: "Наша приверженность разнообразию выходит за стены нашей фирмы. Через нашу практику pro bono мы предоставляем юридические услуги недостаточно представленным сообществам, поддерживаем организации, борющиеся за равенство, и вносим вклад в инициативы по обеспечению доступа к правосудию.",
      proBonoButton: "Узнайте о нашей Pro Bono работе",
      commitmentTitle: "Наше постоянное обязательство",
      commitmentText: "Разнообразие и инклюзивность — это не просто политика в Von Wobeser y Sierra, это основные ценности, которые формируют то, как мы работаем, растём и обслуживаем клиентов. Мы постоянно оцениваем и совершенствуем нашу практику, чтобы оставаться в авангарде создания более справедливой юридической профессии.",
      valuesTitle: "Ценности инклюзивности",
      values: [
        { icon: Scale, title: "Справедливость", text: "Справедливое отношение и равный доступ к возможностям для всех" },
        { icon: Heart, title: "Уважение", text: "Почитание достоинства и уникального вклада каждого человека" },
        { icon: Users, title: "Принадлежность", text: "Создание рабочего места, где каждый чувствует себя ценным и включённым" },
        { icon: Award, title: "Превосходство", text: "Использование разнообразных перспектив для достижения высочайших стандартов" },
      ],
      joinTitle: "Присоединяйтесь к нашей команде",
      joinText: "Станьте частью фирмы, которая ценит вашу уникальную перспективу и поддерживает ваш профессиональный рост.",
      joinButton: "Посмотреть вакансии",
    },
    fr: {
      title: "Diversité et Inclusion",
      subtitle: "Construire une profession juridique plus inclusive depuis 1986",
      foundingTitle: "Notre Engagement Fondateur",
      foundingText1: "Depuis sa fondation en 1986, Von Wobeser y Sierra s'est engagé à créer un environnement inclusif où les talents peuvent s'épanouir indépendamment de leur origine, de leur genre ou de leurs circonstances personnelles. Cet engagement fait partie de l'ADN de notre cabinet depuis le premier jour et continue de guider nos pratiques aujourd'hui.",
      foundingText2: "Nous croyons que les perspectives diverses mènent à de meilleures solutions juridiques. Notre cabinet a constamment défendu l'égalité et l'inclusion, bien avant que cela ne devienne des normes de l'industrie, reconnaissant qu'une équipe diversifiée est notre plus grande force pour servir des clients aux besoins juridiques complexes.",
      statsTitle: "Notre Progression en Chiffres",
      stats: [
        { value: "45%", label: "Femmes dans le Cabinet", icon: UsersRound },
        { value: "35%", label: "Femmes Associées", icon: TrendingUp },
        { value: "50%", label: "Femmes dans des Rôles de Direction", icon: Target },
        { value: "100%", label: "Engagement pour l'Égalité des Chances", icon: Shield },
      ],
      initiativesTitle: "Nos Initiatives de Diversité",
      initiativesSubtitle: "Actions concrètes pour un lieu de travail plus équitable",
      initiatives: [
        {
          icon: UserCheck,
          title: "Recrutement Inclusif",
          text: "Nos pratiques de recrutement sont conçues pour attirer et évaluer les candidats uniquement sur la base de leurs compétences, de leur expérience et de leur potentiel, garantissant l'égalité des chances pour tous, indépendamment du genre, de l'origine ou des circonstances personnelles.",
        },
        {
          icon: BarChart3,
          title: "Égalité des Genres",
          text: "Nous promouvons activement l'égalité des genres à tous les niveaux de l'organisation. Nos programmes soutiennent l'avancement des femmes à des postes de direction et garantissent une rémunération équitable et des opportunités de croissance.",
        },
        {
          icon: Sparkles,
          title: "Égalité des Chances",
          text: "Chaque membre de l'équipe a accès aux mêmes ressources de développement, aux missions stimulantes et aux parcours d'avancement professionnel. Nous nous engageons à éliminer les obstacles et à créer des voies vers le succès pour tous.",
        },
        {
          icon: GraduationCap,
          title: "Programmes de Mentorat",
          text: "Nos programmes de mentorat structurés associent les jeunes avocats à des associés expérimentés, favorisant la croissance professionnelle et garantissant que les connaissances et les opportunités sont partagées à tous les niveaux de notre organisation.",
        },
      ],
      proBonoTitle: "Diversité à travers le Pro Bono",
      proBonoText: "Notre engagement envers la diversité s'étend au-delà des murs de notre cabinet. À travers notre pratique pro bono, nous fournissons des services juridiques aux communautés sous-représentées, soutenons les organisations luttant pour l'égalité et contribuons aux initiatives d'accès à la justice.",
      proBonoButton: "Découvrez notre Travail Pro Bono",
      commitmentTitle: "Notre Engagement Continu",
      commitmentText: "La diversité et l'inclusion ne sont pas de simples politiques chez Von Wobeser y Sierra — ce sont des valeurs fondamentales qui façonnent notre façon de travailler, de grandir et de servir nos clients. Nous évaluons et améliorons continuellement nos pratiques pour rester à l'avant-garde de la création d'une profession juridique plus équitable.",
      valuesTitle: "Valeurs d'Inclusion",
      values: [
        { icon: Scale, title: "Équité", text: "Traitement équitable et accès égal aux opportunités pour tous" },
        { icon: Heart, title: "Respect", text: "Honorer la dignité et les contributions uniques de chaque individu" },
        { icon: Users, title: "Appartenance", text: "Créer un lieu de travail où chacun se sent valorisé et inclus" },
        { icon: Award, title: "Excellence", text: "Tirer parti des perspectives diverses pour atteindre les plus hauts standards" },
      ],
      joinTitle: "Rejoignez Notre Équipe",
      joinText: "Faites partie d'un cabinet qui valorise votre perspective unique et soutient votre croissance professionnelle.",
      joinButton: "Voir les Opportunités de Carrière",
    },
    it: {
      title: "Diversità e Inclusione",
      subtitle: "Costruire una professione legale più inclusiva dal 1986",
      foundingTitle: "Il Nostro Impegno Fondatore",
      foundingText1: "Dalla sua fondazione nel 1986, Von Wobeser y Sierra si è impegnata a creare un ambiente inclusivo in cui il talento possa prosperare indipendentemente dal background, dal genere o dalle circostanze personali. Questo impegno è stato incorporato nel DNA del nostro studio fin dal primo giorno e continua a guidare le nostre pratiche oggi.",
      foundingText2: "Crediamo che le prospettive diverse portino a soluzioni legali migliori. Il nostro studio ha costantemente sostenuto l'uguaglianza e l'inclusione, molto prima che diventassero standard di settore, riconoscendo che un team diversificato è la nostra più grande forza nel servire clienti con esigenze legali complesse.",
      statsTitle: "I Nostri Progressi in Numeri",
      stats: [
        { value: "45%", label: "Donne nello Studio", icon: UsersRound },
        { value: "35%", label: "Donne Partner", icon: TrendingUp },
        { value: "50%", label: "Donne in Ruoli di Leadership", icon: Target },
        { value: "100%", label: "Impegno per le Pari Opportunità", icon: Shield },
      ],
      initiativesTitle: "Le Nostre Iniziative per la Diversità",
      initiativesSubtitle: "Azioni concrete per un luogo di lavoro più equo",
      initiatives: [
        {
          icon: UserCheck,
          title: "Assunzioni Inclusive",
          text: "Le nostre pratiche di reclutamento sono progettate per attrarre e valutare i candidati basandosi esclusivamente sulle loro competenze, esperienza e potenziale, garantendo pari opportunità per tutti indipendentemente da genere, background o circostanze personali.",
        },
        {
          icon: BarChart3,
          title: "Parità di Genere",
          text: "Promuoviamo attivamente la parità di genere a tutti i livelli dell'organizzazione. I nostri programmi supportano l'avanzamento delle donne in posizioni di leadership e garantiscono compensi equi e opportunità di crescita.",
        },
        {
          icon: Sparkles,
          title: "Pari Opportunità",
          text: "Ogni membro del team ha accesso alle stesse risorse di sviluppo, incarichi stimolanti e percorsi di avanzamento di carriera. Ci impegniamo a rimuovere le barriere e a creare percorsi di successo per tutti.",
        },
        {
          icon: GraduationCap,
          title: "Programmi di Mentoring",
          text: "I nostri programmi di mentoring strutturati abbinano avvocati junior con partner esperti, favorendo la crescita professionale e garantendo che conoscenze e opportunità siano condivise a tutti i livelli della nostra organizzazione.",
        },
      ],
      proBonoTitle: "Diversità attraverso il Pro Bono",
      proBonoText: "Il nostro impegno per la diversità si estende oltre le mura del nostro studio. Attraverso la nostra pratica pro bono, forniamo servizi legali a comunità sottorappresentate, supportiamo organizzazioni che lottano per l'uguaglianza e contribuiamo a iniziative di accesso alla giustizia.",
      proBonoButton: "Scopri il Nostro Lavoro Pro Bono",
      commitmentTitle: "Il Nostro Impegno Continuo",
      commitmentText: "Diversità e inclusione non sono solo politiche presso Von Wobeser y Sierra — sono valori fondamentali che plasmano il modo in cui lavoriamo, cresciamo e serviamo i nostri clienti. Valutiamo e miglioriamo continuamente le nostre pratiche per rimanere all'avanguardia nella creazione di una professione legale più equa.",
      valuesTitle: "Valori di Inclusione",
      values: [
        { icon: Scale, title: "Equità", text: "Trattamento equo e pari accesso alle opportunità per tutti" },
        { icon: Heart, title: "Rispetto", text: "Onorare la dignità e i contributi unici di ogni individuo" },
        { icon: Users, title: "Appartenenza", text: "Creare un luogo di lavoro dove tutti si sentano valorizzati e inclusi" },
        { icon: Award, title: "Eccellenza", text: "Sfruttare prospettive diverse per raggiungere i più alti standard" },
      ],
      joinTitle: "Unisciti al Nostro Team",
      joinText: "Fai parte di uno studio che valorizza la tua prospettiva unica e supporta la tua crescita professionale.",
      joinButton: "Vedi Opportunità di Carriera",
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
    <div className="min-h-screen bg-background" data-testid="page-diversity-inclusion">
      <SEOHead page="diversityInclusion" language={language} />
      <Header />

      <section className="pt-32 pb-12 bg-[#AA1A2E]" data-testid="section-diversity-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <UsersRound className="w-10 h-10 text-white" />
            </div>
            <h1
              className="text-3xl md:text-4xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]"
              data-testid="text-diversity-title"
            >
              {t.title}
            </h1>
            <p
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-diversity-subtitle"
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20"
            data-testid="section-founding"
          >
            <h2 className="text-2xl font-heading font-light text-[#AA1A2E] mb-6 uppercase tracking-[0.12em]">
              {t.foundingTitle}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <p className="text-lg text-foreground leading-relaxed">
                {t.foundingText1}
              </p>
              <p className="text-lg text-foreground leading-relaxed">
                {t.foundingText2}
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mb-20"
            data-testid="section-stats"
          >
            <h2 className="text-2xl font-heading font-light text-[#AA1A2E] mb-8 text-center uppercase tracking-[0.12em]">
              {t.statsTitle}
            </h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {t.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="text-center bg-gradient-to-br from-[#AA1A2E]/5 to-[#AA1A2E]/10 dark:from-[#AA1A2E]/10 dark:to-[#AA1A2E]/20 rounded-md p-6"
                  data-testid={`stat-diversity-${index}`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#AA1A2E]/10 flex items-center justify-center mx-auto mb-3">
                    <stat.icon className="w-6 h-6 text-[#AA1A2E]" />
                  </div>
                  <div className="text-4xl font-light text-[#AA1A2E] mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-20"
            data-testid="section-values"
          >
            <h2 className="text-2xl font-heading font-light text-[#AA1A2E] mb-8 text-center uppercase tracking-[0.12em]">
              {t.valuesTitle}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.values.map((value, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-border text-center" data-testid={`card-value-${index}`}>
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-full bg-[#AA1A2E]/10 flex items-center justify-center mx-auto mb-4">
                        <value.icon className="w-7 h-7 text-[#AA1A2E]" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {value.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {value.text}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-20"
            data-testid="section-initiatives"
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl font-heading font-light text-[#AA1A2E] mb-4 uppercase tracking-[0.12em]">
                {t.initiativesTitle}
              </h2>
              <p className="text-lg text-muted-foreground" data-testid="text-initiatives-subtitle">
                {t.initiativesSubtitle}
              </p>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {t.initiatives.map((initiative, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="h-full rounded-md border border-border" data-testid={`card-initiative-${index}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#AA1A2E]/10 flex items-center justify-center flex-shrink-0">
                          <initiative.icon className="w-6 h-6 text-[#AA1A2E]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {initiative.title}
                          </h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {initiative.text}
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
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mb-20"
            data-testid="section-probono"
          >
            <Card className="rounded-md border border-border bg-gradient-to-br from-[#AA1A2E]/5 to-[#AA1A2E]/10 dark:from-[#AA1A2E]/10 dark:to-[#AA1A2E]/20">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <HeartHandshake className="w-8 h-8 text-[#AA1A2E]" />
                  <h2 className="text-xl font-heading font-light text-[#AA1A2E] uppercase tracking-[0.12em]">
                    {t.proBonoTitle}
                  </h2>
                </div>
                <p className="text-lg text-foreground leading-relaxed mb-6">
                  {t.proBonoText}
                </p>
                <Link href="/about">
                  <Button
                    variant="outline"
                    className="border-[#AA1A2E] text-[#AA1A2E] hover:bg-[#AA1A2E] hover:text-white"
                    data-testid="button-probono-learn-more"
                  >
                    {t.proBonoButton}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20 text-center"
            data-testid="section-commitment"
          >
            <h2 className="text-2xl font-heading font-light text-[#AA1A2E] mb-6 uppercase tracking-[0.12em]">
              {t.commitmentTitle}
            </h2>
            <p className="text-lg text-foreground leading-relaxed max-w-4xl mx-auto">
              {t.commitmentText}
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="bg-[#AA1A2E] rounded-md p-10 text-center"
            data-testid="section-join"
          >
            <h2 className="text-2xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]">
              {t.joinTitle}
            </h2>
            <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
              {t.joinText}
            </p>
            <Link href="/careers">
              <Button
                size="lg"
                className="bg-background text-[#AA1A2E] hover:bg-muted"
                data-testid="button-join-careers"
              >
                {t.joinButton}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
