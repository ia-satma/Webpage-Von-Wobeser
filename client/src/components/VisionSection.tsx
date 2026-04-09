import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent } from "@shared/schema";
import type { LanguageCode } from "@shared/schema";

interface VisionContent {
  title: string;
  text: string;
  subtitle: string;
  subtext: string;
  errorMessage: string;
}

const content: Record<LanguageCode, VisionContent> = {
  en: {
    title: "A vision of the future, collaboration, and excellence",
    text: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco. This relocation marks a stage of growth, evolution, and consolidation, and represents a key investment in the firm's future. The new facilities are designed to maximize collaboration across all areas for the benefit of clients, ensuring the continued delivery of high-quality and integrated services, reaffirming the firm's commitment and philosophy of being where clients need us.",
    subtitle: "At the center of business and closer to our clients",
    subtext: "Our new offices are located in Mexico's most dynamic business hub and one of the most important in Latin America. Strategically positioned in the vibrant Polanco district, just steps away from the iconic Paseo de la Reforma, we ensure the proximity our clients need for agile and personalized support.",
    errorMessage: "Failed to load content",
  },
  es: {
    title: "Una visión de futuro, colaboración y excelencia",
    text: "Von Wobeser y Sierra ha completado la transición a sus nuevas oficinas en la dinámica zona de Campos Elíseos en Polanco. Esta reubicación marca una etapa de crecimiento, evolución y consolidación, y representa una inversión clave en el futuro de la firma. Las nuevas instalaciones están diseñadas para maximizar la colaboración en todas las áreas en beneficio de los clientes, asegurando la entrega continua de servicios de alta calidad e integrados, reafirmando el compromiso y la filosofía de la firma de estar donde los clientes nos necesitan.",
    subtitle: "En el centro de los negocios y más cerca de nuestros clientes",
    subtext: "Nuestras nuevas oficinas están ubicadas en el hub de negocios más dinámico de México y uno de los más importantes de América Latina. Estratégicamente posicionadas en el vibrante distrito de Polanco, a pasos del icónico Paseo de la Reforma, aseguramos la proximidad que nuestros clientes necesitan para un apoyo ágil y personalizado.",
    errorMessage: "Error al cargar contenido",
  },
  de: {
    title: "Eine Vision von Zukunft, Zusammenarbeit und Exzellenz",
    text: "Von Wobeser y Sierra hat den Umzug in neue Büros im dynamischen Gebiet Campos Elíseos in Polanco abgeschlossen. Diese Verlagerung markiert eine Phase des Wachstums, der Entwicklung und Konsolidierung und stellt eine wichtige Investition in die Zukunft der Kanzlei dar. Die neuen Einrichtungen sind darauf ausgelegt, die Zusammenarbeit in allen Bereichen zum Nutzen der Mandanten zu maximieren und die kontinuierliche Bereitstellung hochwertiger und integrierter Dienstleistungen zu gewährleisten.",
    subtitle: "Im Zentrum des Geschäfts und näher bei unseren Mandanten",
    subtext: "Unsere neuen Büros befinden sich im dynamischsten Geschäftszentrum Mexikos und einem der wichtigsten in Lateinamerika. Strategisch im lebhaften Stadtteil Polanco positioniert, nur wenige Schritte vom ikonischen Paseo de la Reforma entfernt, gewährleisten wir die Nähe, die unsere Mandanten für eine agile und personalisierte Unterstützung benötigen.",
    errorMessage: "Inhalt konnte nicht geladen werden",
  },
  zh: {
    title: "未来、协作与卓越的愿景",
    text: "Von Wobeser y Sierra 已完成向波兰科区充满活力的 Campos Eliseos 地区新办公室的搬迁。这次搬迁标志着公司进入成长、发展和巩固的新阶段，是对公司未来的关键投资。新设施旨在最大限度地促进各领域的协作，造福客户，确保持续提供高质量的综合服务，重申公司始终与客户同在的承诺和理念。",
    subtitle: "处于商业中心，更贴近我们的客户",
    subtext: "我们的新办公室位于墨西哥最具活力的商业中心，也是拉丁美洲最重要的商业中心之一。战略性地位于充满活力的波兰科区，距离标志性的改革大道仅几步之遥，我们确保为客户提供敏捷和个性化支持所需的便利。",
    errorMessage: "内容加载失败",
  },
  ko: {
    title: "미래, 협력, 그리고 탁월함의 비전",
    text: "Von Wobeser y Sierra는 폴랑코의 역동적인 캄포스 엘리세오스 지역에 위치한 새 사무실로의 이전을 완료했습니다. 이번 이전은 성장, 발전 및 통합의 단계를 나타내며 회사의 미래에 대한 핵심 투자입니다. 새로운 시설은 고객의 이익을 위해 모든 영역에서 협력을 극대화하고 고품질의 통합 서비스를 지속적으로 제공하도록 설계되었습니다.",
    subtitle: "비즈니스 중심에서 고객에게 더 가까이",
    subtext: "우리의 새 사무실은 멕시코에서 가장 역동적인 비즈니스 허브이자 라틴 아메리카에서 가장 중요한 곳 중 하나에 위치해 있습니다. 상징적인 레포르마 거리에서 불과 몇 걸음 떨어진 활기찬 폴랑코 지구에 전략적으로 위치하여 민첩하고 개인화된 지원을 위해 고객이 필요로 하는 근접성을 보장합니다.",
    errorMessage: "콘텐츠를 불러오지 못했습니다",
  },
  ja: {
    title: "未来、協力、そして卓越性のビジョン",
    text: "Von Wobeser y Sierraは、ポランコの活気あるカンポス・エリセオス地区の新オフィスへの移転を完了しました。この移転は、成長、進化、統合の段階を示し、事務所の将来への重要な投資を表しています。新しい施設は、クライアントの利益のためにすべての分野での協力を最大化し、高品質で統合されたサービスの継続的な提供を確保するよう設計されています。",
    subtitle: "ビジネスの中心に、クライアントにより近く",
    subtext: "私たちの新しいオフィスは、メキシコで最もダイナミックなビジネスハブであり、ラテンアメリカで最も重要な場所の一つに位置しています。象徴的なレフォルマ通りからわずか数歩の活気あるポランコ地区に戦略的に位置し、機敏でパーソナライズされたサポートのためにクライアントが必要とする近接性を確保しています。",
    errorMessage: "コンテンツの読み込みに失敗しました",
  },
  ar: {
    title: "رؤية للمستقبل والتعاون والتميز",
    text: "أكملت Von Wobeser y Sierra الانتقال إلى مكاتبها الجديدة في منطقة كامبوس إليسيوس الديناميكية في بولانكو. يمثل هذا النقل مرحلة من النمو والتطور والتوطيد، ويمثل استثماراً رئيسياً في مستقبل الشركة. تم تصميم المرافق الجديدة لتعظيم التعاون عبر جميع المجالات لصالح العملاء، مما يضمن استمرار تقديم خدمات عالية الجودة ومتكاملة.",
    subtitle: "في مركز الأعمال وأقرب إلى عملائنا",
    subtext: "تقع مكاتبنا الجديدة في أكثر مراكز الأعمال ديناميكية في المكسيك وأحد أهمها في أمريكا اللاتينية. تقع استراتيجياً في حي بولانكو النابض بالحياة، على بعد خطوات فقط من باسيو دي لا ريفورما الأيقوني، نضمن القرب الذي يحتاجه عملاؤنا للحصول على دعم سريع وشخصي.",
    errorMessage: "فشل في تحميل المحتوى",
  },
  ru: {
    title: "Видение будущего, сотрудничества и совершенства",
    text: "Von Wobeser y Sierra завершила переезд в новые офисы в динамичном районе Кампос Элисеос в Поланко. Этот переезд знаменует этап роста, эволюции и консолидации и представляет собой ключевые инвестиции в будущее фирмы. Новые помещения спроектированы для максимального сотрудничества во всех областях на благо клиентов, обеспечивая непрерывное предоставление высококачественных и интегрированных услуг.",
    subtitle: "В центре бизнеса и ближе к нашим клиентам",
    subtext: "Наши новые офисы расположены в самом динамичном деловом центре Мексики и одном из важнейших в Латинской Америке. Стратегически расположенные в оживленном районе Поланко, всего в нескольких шагах от знаменитого Пасео де ла Реформа, мы обеспечиваем близость, необходимую нашим клиентам для гибкой и персонализированной поддержки.",
    errorMessage: "Не удалось загрузить контент",
  },
  fr: {
    title: "Une vision d'avenir, de collaboration et d'excellence",
    text: "Von Wobeser y Sierra a achevé la transition vers ses nouveaux bureaux dans le quartier dynamique de Campos Elíseos à Polanco. Cette relocalisation marque une étape de croissance, d'évolution et de consolidation, et représente un investissement clé dans l'avenir du cabinet. Les nouvelles installations sont conçues pour maximiser la collaboration dans tous les domaines au bénéfice des clients, assurant la fourniture continue de services de haute qualité et intégrés.",
    subtitle: "Au cœur des affaires et plus proche de nos clients",
    subtext: "Nos nouveaux bureaux sont situés dans le centre d'affaires le plus dynamique du Mexique et l'un des plus importants d'Amérique latine. Stratégiquement positionnés dans le quartier animé de Polanco, à quelques pas de l'emblématique Paseo de la Reforma, nous assurons la proximité dont nos clients ont besoin pour un soutien agile et personnalisé.",
    errorMessage: "Échec du chargement du contenu",
  },
  it: {
    title: "Una visione di futuro, collaborazione ed eccellenza",
    text: "Von Wobeser y Sierra ha completato la transizione verso i nuovi uffici nella dinamica zona di Campos Elíseos a Polanco. Questo trasferimento segna una fase di crescita, evoluzione e consolidamento e rappresenta un investimento chiave nel futuro dello studio. Le nuove strutture sono progettate per massimizzare la collaborazione in tutte le aree a beneficio dei clienti, garantendo la continua fornitura di servizi di alta qualità e integrati.",
    subtitle: "Al centro degli affari e più vicini ai nostri clienti",
    subtext: "I nostri nuovi uffici si trovano nel centro commerciale più dinamico del Messico e uno dei più importanti dell'America Latina. Strategicamente posizionati nel vivace quartiere di Polanco, a pochi passi dall'iconico Paseo de la Reforma, garantiamo la vicinanza di cui i nostri clienti hanno bisogno per un supporto agile e personalizzato.",
    errorMessage: "Impossibile caricare il contenuto",
  },
};

export default function VisionSection() {
  const { language } = useLanguage();
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const t = content[language] || content.en;

  const title = siteContent?.visionTitle || t.title;

  if (error) {
    return (
      <section id="vision" className="py-20 lg:py-32 bg-white dark:bg-gray-900" data-testid="section-vision">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-vision-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="vision" className="py-20 lg:py-32 bg-white dark:bg-gray-900" data-testid="section-vision">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <Skeleton className="h-12 w-3/4 mx-auto mb-10" data-testid="skeleton-vision-title" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-2/3 mx-auto mb-16" />
          <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
          <Skeleton className="h-6 w-full mb-3" />
          <Skeleton className="h-6 w-4/5 mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="vision"
      className="py-20 lg:py-32 bg-white dark:bg-gray-900"
      data-testid="section-vision"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-gray-800 dark:text-white leading-tight mb-10 uppercase tracking-[0.12em]"
          data-testid="text-vision-title"
        >
          {title}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-serif text-gray-600 dark:text-gray-300 leading-relaxed mb-16"
          data-testid="text-vision-description"
        >
          {t.text}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-24 h-px bg-primary mx-auto mb-16"
          data-testid="divider-vision"
        />

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg md:text-xl font-heading font-light text-gray-800 dark:text-white mb-8 uppercase tracking-[0.12em]"
          data-testid="text-vision-subtitle"
        >
          {t.subtitle}
        </motion.h3>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg font-serif text-gray-600 dark:text-gray-300 leading-relaxed"
          data-testid="text-vision-subtext"
        >
          {t.subtext}
        </motion.p>
      </div>
    </section>
  );
}
