import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { getIcon } from "@/lib/icons";
import type { IndustryGroup, PracticeGroup } from "@shared/schema";

export default function IndustryGroupDetail() {
  const { language, displayLanguage } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: industryGroup, isLoading, error } = useQuery<IndustryGroup>({
    queryKey: [`/api/industry-groups/${slug}`],
    enabled: !!slug,
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: 'industry_group',
    entityId: industryGroup?.id?.toString() || '',
    fields: {
      name: industryGroup?.name,
      nameEs: industryGroup?.nameEs,
      description: industryGroup?.description,
      descriptionEs: industryGroup?.descriptionEs,
      fullDescription: industryGroup?.fullDescription,
      fullDescriptionEs: industryGroup?.fullDescriptionEs,
    },
    enabled: !!industryGroup,
  });

  const translations: Record<string, {
    backToAll: string;
    contactUs: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    relatedServices: string;
    errorMessage: string;
    loading: string;
  }> = {
    en: {
      backToAll: "All Industry Groups",
      contactUs: "Contact Us",
      contactCta: "Contact our team",
      contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges in this industry.",
      emailUs: "Email Us",
      callUs: "Call Us",
      relatedServices: "Related Practice Areas",
      errorMessage: "Industry group not found",
      loading: "Loading...",
    },
    es: {
      backToAll: "Todas las Industrias",
      contactUs: "Contáctenos",
      contactCta: "Contacte a nuestro equipo",
      contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar los desafíos legales de esta industria.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      relatedServices: "Áreas de Práctica Relacionadas",
      errorMessage: "Industria no encontrada",
      loading: "Cargando...",
    },
    de: {
      backToAll: "Alle Branchengruppen",
      contactUs: "Kontakt",
      contactCta: "Kontaktieren Sie unser Team",
      contactSubtitle: "Lassen Sie unsere erfahrenen Anwälte Ihnen bei Ihren rechtlichen Herausforderungen in dieser Branche helfen.",
      emailUs: "E-Mail senden",
      callUs: "Anrufen",
      relatedServices: "Verwandte Praxisbereiche",
      errorMessage: "Branchengruppe nicht gefunden",
      loading: "Laden...",
    },
    zh: {
      backToAll: "所有行业组",
      contactUs: "联系我们",
      contactCta: "联系我们的团队",
      contactSubtitle: "让我们经验丰富的律师帮助您应对该行业的法律挑战。",
      emailUs: "发送邮件",
      callUs: "致电",
      relatedServices: "相关业务领域",
      errorMessage: "未找到行业组",
      loading: "加载中...",
    },
    ko: {
      backToAll: "모든 산업 그룹",
      contactUs: "문의하기",
      contactCta: "팀에 연락하기",
      contactSubtitle: "경험 풍부한 변호사가 이 산업의 법적 문제 해결을 도와드립니다.",
      emailUs: "이메일 보내기",
      callUs: "전화하기",
      relatedServices: "관련 업무 분야",
      errorMessage: "산업 그룹을 찾을 수 없습니다",
      loading: "로딩 중...",
    },
    ja: {
      backToAll: "すべての産業グループ",
      contactUs: "お問い合わせ",
      contactCta: "チームにお問い合わせ",
      contactSubtitle: "この産業における法的課題の解決を経験豊富な弁護士がお手伝いします。",
      emailUs: "メールを送る",
      callUs: "電話する",
      relatedServices: "関連業務分野",
      errorMessage: "産業グループが見つかりません",
      loading: "読み込み中...",
    },
    ar: {
      backToAll: "جميع مجموعات الصناعة",
      contactUs: "اتصل بنا",
      contactCta: "تواصل مع فريقنا",
      contactSubtitle: "دع محامينا ذوي الخبرة يساعدونك في تحدياتك القانونية في هذه الصناعة.",
      emailUs: "راسلنا",
      callUs: "اتصل بنا",
      relatedServices: "مجالات الممارسة ذات الصلة",
      errorMessage: "لم يتم العثور على مجموعة الصناعة",
      loading: "جاري التحميل...",
    },
    ru: {
      backToAll: "Все отраслевые группы",
      contactUs: "Свяжитесь с нами",
      contactCta: "Связаться с командой",
      contactSubtitle: "Позвольте нашим опытным юристам помочь вам с правовыми вопросами в этой отрасли.",
      emailUs: "Написать",
      callUs: "Позвонить",
      relatedServices: "Связанные практики",
      errorMessage: "Отраслевая группа не найдена",
      loading: "Загрузка...",
    },
    fr: {
      backToAll: "Tous les groupes sectoriels",
      contactUs: "Contactez-nous",
      contactCta: "Contactez notre équipe",
      contactSubtitle: "Laissez nos avocats expérimentés vous aider dans vos défis juridiques dans ce secteur.",
      emailUs: "Envoyer un email",
      callUs: "Appeler",
      relatedServices: "Domaines de pratique connexes",
      errorMessage: "Groupe sectoriel non trouvé",
      loading: "Chargement...",
    },
    it: {
      backToAll: "Tutti i gruppi industriali",
      contactUs: "Contattaci",
      contactCta: "Contatta il nostro team",
      contactSubtitle: "Lascia che i nostri avvocati esperti ti aiutino con le sfide legali in questo settore.",
      emailUs: "Invia email",
      callUs: "Chiama",
      relatedServices: "Aree di pratica correlate",
      errorMessage: "Gruppo industriale non trovato",
      loading: "Caricamento...",
    },
  };

  const t = translations[language] || translations.en;

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-group-error">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-gray-800 dark:text-white mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h2>
            <Link href="/industry-groups">
              <Button variant="outline" data-testid="button-back-to-industry-groups">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t.backToAll}
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-group-loading">
        <Header />
        <section className="pt-32 pb-12 bg-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-5 w-48 bg-white/20 mb-6" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-md bg-white/20" />
              <Skeleton className="h-12 w-64 bg-white/20" />
            </div>
          </div>
        </section>
        <main id="main-content" className="py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-4" />
            <Skeleton className="h-6 w-5/6 mb-4" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const IconComponent = industryGroup ? getIcon(industryGroup.iconName) : null;
  const displayName = translatedFields.name || industryGroup?.name;
  const displayDescription = translatedFields.fullDescription || translatedFields.description || industryGroup?.fullDescription || industryGroup?.description;

  const relatedPracticeGroups = practiceGroups?.slice(0, 4);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-industry-group-detail">
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-industry-group-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/industry-groups">
              <span 
                className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                data-testid="link-back-to-industry-groups"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToAll}
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {IconComponent && (
                <div className="w-16 h-16 rounded-md bg-white/10 flex items-center justify-center">
                  <IconComponent className="w-8 h-8 text-white" data-testid="icon-industry-group-detail" />
                </div>
              )}
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white"
                data-testid="text-industry-group-title"
              >
                {displayName}
                {isTranslating && (
                  <Loader2 className="inline-block w-5 h-5 ml-3 animate-spin text-white/60" />
                )}
              </h1>
            </div>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div 
              className="prose prose-lg dark:prose-invert max-w-none mb-16"
              data-testid="container-industry-group-description"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed text-justify sm:text-left">
                {displayDescription}
              </p>
            </div>
          </motion.div>

          {relatedPracticeGroups && relatedPracticeGroups.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-16"
              data-testid="section-related-services"
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6"
                data-testid="text-related-services-title"
              >
                {t.relatedServices}
              </h2>
              <div className="flex flex-wrap gap-3">
                {relatedPracticeGroups.map((practiceGroup) => (
                  <Link key={practiceGroup.id} href={`/practice-groups/${practiceGroup.slug}`}>
                    <Badge 
                      variant="secondary"
                      className="cursor-pointer text-sm px-4 py-2 rounded-md"
                      data-testid={`badge-related-practice-${practiceGroup.slug}`}
                    >
                      {language === "es" ? practiceGroup.nameEs : practiceGroup.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gray-50 dark:bg-gray-800 rounded-md p-8 lg:p-12"
            data-testid="section-contact-cta"
          >
            <h2 
              className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-3"
              data-testid="text-contact-cta-title"
            >
              {t.contactCta}
            </h2>
            <p 
              className="text-gray-600 dark:text-gray-400 mb-6"
              data-testid="text-contact-cta-subtitle"
            >
              {t.contactSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="rounded-md"
                data-testid="button-email-us"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t.emailUs}
              </Button>
              <Button 
                variant="outline"
                className="rounded-md"
                data-testid="button-call-us"
              >
                <Phone className="w-4 h-4 mr-2" />
                {t.callUs}
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
