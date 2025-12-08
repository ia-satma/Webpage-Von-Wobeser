import { motion } from "framer-motion";
import { Quote, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent, LanguageCode } from "@shared/schema";

interface QuoteContent {
  quote: string;
  author: string;
  role: string;
  errorMessage: string;
}

const content: Record<LanguageCode, QuoteContent> = {
  en: {
    quote: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity that translates into excellent service.",
    author: "Fernando Carreño",
    role: "Partner and member of the Executive Committee",
    errorMessage: "Failed to load quote",
  },
  es: {
    quote: "La reubicación de nuestras oficinas responde a dos objetivos inseparables: primero, estar más cerca de nuestros clientes; y segundo, ofrecer a nuestro equipo un espacio diseñado para fomentar la colaboración y productividad que se traduce en un excelente servicio.",
    author: "Fernando Carreño",
    role: "Socio y miembro del Comité Ejecutivo",
    errorMessage: "Error al cargar cita",
  },
  de: {
    quote: "Der Umzug unserer Büros verfolgt zwei untrennbare Ziele: erstens, näher bei unseren Mandanten zu sein; und zweitens, unserem Team einen Raum zu bieten, der die Zusammenarbeit und Produktivität fördert, was sich in exzellentem Service niederschlägt.",
    author: "Fernando Carreño",
    role: "Partner und Mitglied des Exekutivkomitees",
    errorMessage: "Zitat konnte nicht geladen werden",
  },
  zh: {
    quote: "我们办公室的搬迁响应了两个密不可分的目标：首先，更接近我们的客户；其次，为我们的团队提供一个旨在促进协作和生产力的空间，从而转化为卓越的服务。",
    author: "Fernando Carreño",
    role: "合伙人兼执行委员会成员",
    errorMessage: "引用加载失败",
  },
  ko: {
    quote: "사무실 이전은 두 가지 분리할 수 없는 목표에 부응합니다: 첫째, 고객에게 더 가까이 다가가는 것; 둘째, 팀에게 협력과 생산성을 촉진하여 우수한 서비스로 이어지는 공간을 제공하는 것입니다.",
    author: "Fernando Carreño",
    role: "파트너 및 집행위원회 위원",
    errorMessage: "인용구를 불러오지 못했습니다",
  },
  ja: {
    quote: "オフィスの移転は、二つの切り離せない目標に応えるものです。第一に、クライアントにより近づくこと、第二に、協力と生産性を促進し、優れたサービスにつながる空間をチームに提供することです。",
    author: "Fernando Carreño",
    role: "パートナー兼執行委員会メンバー",
    errorMessage: "引用の読み込みに失敗しました",
  },
  ar: {
    quote: "انتقال مكاتبنا يستجيب لهدفين لا ينفصلان: أولاً، أن نكون أقرب إلى عملائنا؛ وثانياً، تقديم مساحة لفريقنا مصممة لتعزيز التعاون والإنتاجية التي تترجم إلى خدمة ممتازة.",
    author: "Fernando Carreño",
    role: "شريك وعضو في اللجنة التنفيذية",
    errorMessage: "فشل في تحميل الاقتباس",
  },
  ru: {
    quote: "Переезд наших офисов отвечает двум неразрывным целям: во-первых, быть ближе к нашим клиентам; во-вторых, предоставить нашей команде пространство, способствующее сотрудничеству и продуктивности, что выражается в превосходном обслуживании.",
    author: "Fernando Carreño",
    role: "Партнер и член Исполнительного комитета",
    errorMessage: "Не удалось загрузить цитату",
  },
  fr: {
    quote: "La relocalisation de nos bureaux répond à deux objectifs inséparables : premièrement, être plus proches de nos clients ; et deuxièmement, offrir à notre équipe un espace conçu pour favoriser la collaboration et la productivité qui se traduit par un excellent service.",
    author: "Fernando Carreño",
    role: "Associé et membre du Comité Exécutif",
    errorMessage: "Échec du chargement de la citation",
  },
  it: {
    quote: "Il trasferimento dei nostri uffici risponde a due obiettivi inscindibili: primo, essere più vicini ai nostri clienti; secondo, offrire al nostro team uno spazio progettato per favorire la collaborazione e la produttività che si traduce in un servizio eccellente.",
    author: "Fernando Carreño",
    role: "Partner e membro del Comitato Esecutivo",
    errorMessage: "Impossibile caricare la citazione",
  },
};

export default function QuoteSection() {
  const { language } = useLanguage();
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const t = content[language] || content.en;

  const quote = siteContent?.quoteText || t.quote;
  const author = siteContent?.quoteAuthor || t.author;
  const role = siteContent?.quoteRole || t.role;

  if (error) {
    return (
      <section id="quote" className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800" data-testid="section-quote">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-quote-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="quote" className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800" data-testid="section-quote">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <Skeleton className="w-12 h-12 mx-auto mb-8 rounded-full" data-testid="skeleton-quote-icon" />
          <Skeleton className="h-8 w-full mb-3" />
          <Skeleton className="h-8 w-full mb-3" />
          <Skeleton className="h-8 w-3/4 mx-auto mb-10" />
          <Skeleton className="w-16 h-px mx-auto mb-6" />
          <Skeleton className="h-6 w-40 mx-auto mb-2" />
          <Skeleton className="h-4 w-60 mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section
      id="quote"
      className="py-20 lg:py-28 bg-gray-100 dark:bg-gray-800"
      data-testid="section-quote"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Quote className="w-12 h-12 text-primary/30 mx-auto mb-8" data-testid="icon-quote" />
          
          <blockquote
            className="text-xl md:text-2xl lg:text-3xl font-heading font-light text-gray-700 dark:text-gray-200 leading-relaxed mb-10"
            data-testid="text-quote"
          >
            "{quote}"
          </blockquote>

          <div className="flex flex-col items-center">
            <div className="w-16 h-px bg-primary mb-6" data-testid="divider-quote" />
            <p
              className="text-lg font-medium text-gray-800 dark:text-white"
              data-testid="text-quote-author"
            >
              {author}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1" data-testid="text-quote-role">
              {role}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
