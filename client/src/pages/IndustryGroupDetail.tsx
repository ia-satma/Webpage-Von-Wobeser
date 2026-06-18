import { Link, useParams } from "wouter";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { isNativeLanguage } from "@/lib/translationUtils";
import { useFadeOnScroll } from "@/hooks/useFadeOnScroll";
import {
  CapabilityHero,
  CapabilityProse,
  SectionTitle,
  CapabilityContactCta,
} from "@/components/capabilities";
import type { IndustryGroup, PracticeGroup } from "@shared/schema";

/**
 * IndustryGroupDetail — detalle de industria en el look viejo.
 *
 * Conserva el data-fetching: `/api/industry-groups/:slug` + `/api/practice-groups`
 * (para las prácticas relacionadas) y la traducción campo a campo.
 */

interface RelatedPracticeRowProps {
  practiceGroup: PracticeGroup;
  language: string;
}

function RelatedPracticeRow({ practiceGroup, language }: RelatedPracticeRowProps) {
  const { translatedFields } = useTranslatedContent({
    contentType: "practice_group",
    entityId: practiceGroup.id.toString(),
    fields: {
      name: practiceGroup.name,
      nameEs: practiceGroup.nameEs,
    },
    enabled: !isNativeLanguage(language),
  });

  const displayName = translatedFields.name || practiceGroup.name;

  return (
    <li data-testid={`related-practice-${practiceGroup.slug}`}>
      <Link
        href={`/practice-groups/${practiceGroup.slug}`}
        className="group flex items-center justify-between gap-4 border-l-2 border-l-vw-red/40 bg-white py-4 pl-5 pr-3 transition-colors hover:border-l-vw-red"
      >
        <span className="min-w-0 truncate font-serif text-base text-vw-black transition-colors group-hover:text-vw-red">
          {displayName}
        </span>
        <span className="shrink-0 vw-label text-[10px] text-vw-gray">
          {language === "es" ? "Ver" : "View"} →
        </span>
      </Link>
    </li>
  );
}

export default function IndustryGroupDetail() {
  const { language } = useLanguage();
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
    contentType: "industry_group",
    entityId: industryGroup?.id?.toString() || "",
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

  const relatedRef = useFadeOnScroll<HTMLDivElement>();

  const translations: Record<string, {
    backToAll: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    relatedServices: string;
    errorMessage: string;
    aboutIndustry: string;
  }> = {
    en: { backToAll: "All Industry Groups", contactCta: "Contact our team", contactSubtitle: "Let our experienced attorneys help you navigate your legal challenges in this industry.", emailUs: "Email Us", callUs: "Call Us", relatedServices: "Related Practice Areas", errorMessage: "Industry group not found", aboutIndustry: "About This Industry" },
    es: { backToAll: "Todas las Industrias", contactCta: "Contacte a nuestro equipo", contactSubtitle: "Permita que nuestros abogados experimentados le ayuden a navegar los desafíos legales de esta industria.", emailUs: "Enviar Email", callUs: "Llamar", relatedServices: "Áreas de Práctica Relacionadas", errorMessage: "Industria no encontrada", aboutIndustry: "Acerca de esta Industria" },
    de: { backToAll: "Zurück zu Branchen", contactCta: "Kontaktieren Sie unser Team", contactSubtitle: "Lassen Sie unsere erfahrenen Anwälte Ihnen bei Ihren rechtlichen Herausforderungen in dieser Branche helfen.", emailUs: "E-Mail senden", callUs: "Anrufen", relatedServices: "Verwandte Praxisbereiche", errorMessage: "Branche nicht gefunden", aboutIndustry: "Über diese Branche" },
    zh: { backToAll: "返回行业", contactCta: "联系我们的团队", contactSubtitle: "让我们经验丰富的律师帮助您应对该行业的法律挑战。", emailUs: "发送邮件", callUs: "致电", relatedServices: "相关业务领域", errorMessage: "未找到行业", aboutIndustry: "关于该行业" },
    ko: { backToAll: "산업으로 돌아가기", contactCta: "팀에 연락하기", contactSubtitle: "경험 풍부한 변호사가 이 산업의 법적 문제 해결을 도와드립니다.", emailUs: "이메일 보내기", callUs: "전화하기", relatedServices: "관련 업무 분야", errorMessage: "산업을 찾을 수 없습니다", aboutIndustry: "이 산업에 대해" },
    ja: { backToAll: "業界に戻る", contactCta: "チームにお問い合わせ", contactSubtitle: "この産業における法的課題の解決を経験豊富な弁護士がお手伝いします。", emailUs: "メールを送る", callUs: "電話する", relatedServices: "関連取扱分野", errorMessage: "業界が見つかりません", aboutIndustry: "この業界について" },
    ar: { backToAll: "العودة إلى القطاعات", contactCta: "تواصل مع فريقنا", contactSubtitle: "دع محامينا ذوي الخبرة يساعدونك في تحدياتك القانونية في هذه الصناعة.", emailUs: "راسلنا", callUs: "اتصل بنا", relatedServices: "مجالات الممارسة ذات الصلة", errorMessage: "القطاع غير موجود", aboutIndustry: "عن هذا القطاع" },
    ru: { backToAll: "Назад к отраслям", contactCta: "Связаться с командой", contactSubtitle: "Позвольте нашим опытным юристам помочь вам с правовыми вопросами в этой отрасли.", emailUs: "Написать", callUs: "Позвонить", relatedServices: "Связанные практики", errorMessage: "Отрасль не найдена", aboutIndustry: "Об этой отрасли" },
    fr: { backToAll: "Retour aux secteurs", contactCta: "Contactez notre équipe", contactSubtitle: "Laissez nos avocats expérimentés vous aider dans vos défis juridiques dans ce secteur.", emailUs: "Envoyer un email", callUs: "Appeler", relatedServices: "Domaines de pratique connexes", errorMessage: "Secteur non trouvé", aboutIndustry: "À propos de ce secteur" },
    it: { backToAll: "Torna ai settori", contactCta: "Contatta il nostro team", contactSubtitle: "Lascia che i nostri avvocati esperti ti aiutino con le sfide legali in questo settore.", emailUs: "Invia email", callUs: "Chiama", relatedServices: "Aree di pratica correlate", errorMessage: "Settore non trovato", aboutIndustry: "Su questo settore" },
  };

  const t = translations[language] || translations.en;

  if (error) {
    return (
      <div data-testid="page-industry-group-error">
        <div className="vw-wrap py-24 text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-vw-graylight" />
          <h2 className="mb-6 font-serif text-2xl text-vw-black" data-testid="text-error-title">
            {t.errorMessage}
          </h2>
          <Link
            href="/industry-groups"
            className="inline-flex items-center gap-2 vw-label text-xs text-vw-red"
            data-testid="button-back-to-industry-groups"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.backToAll}
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div data-testid="page-industry-group-loading">
        <div className="vw-wrap py-24">
          <div className="mb-6 h-5 w-48 animate-pulse bg-vw-graylight/50" />
          <div className="h-12 w-64 animate-pulse bg-vw-graylight/50" />
          <div className="mt-10 space-y-4">
            <div className="h-6 w-full animate-pulse bg-vw-graylight/40" />
            <div className="h-6 w-3/4 animate-pulse bg-vw-graylight/40" />
            <div className="h-6 w-5/6 animate-pulse bg-vw-graylight/40" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = translatedFields.name || industryGroup?.name || "";
  const displayDescription =
    translatedFields.fullDescription ||
    translatedFields.description ||
    industryGroup?.fullDescription ||
    industryGroup?.description;

  const relatedPracticeGroups = practiceGroups?.slice(0, 4);

  return (
    <div data-testid="page-industry-group-detail">
      <CapabilityHero
        eyebrow={t.aboutIndustry}
        title={displayName}
        backLabel={t.backToAll}
        backHref="/industry-groups"
        trailing={
          isTranslating ? (
            <Loader2 className="h-5 w-5 animate-spin text-vw-gray" aria-hidden="true" />
          ) : undefined
        }
        testId="section-industry-group-hero"
      />

      {displayDescription && (
        <CapabilityProse
          text={displayDescription}
          testId="section-industry-group-description"
        />
      )}

      {relatedPracticeGroups && relatedPracticeGroups.length > 0 && (
        <section className="bg-vw-graylight/20 py-16 lg:py-20" data-testid="section-related-services">
          <div className="vw-wrap max-w-4xl">
            <div ref={relatedRef} className="vw-fade">
              <SectionTitle testId="text-related-services-title">
                {t.relatedServices}
              </SectionTitle>
              <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="list-related-practices">
                {relatedPracticeGroups.map((practiceGroup) => (
                  <RelatedPracticeRow
                    key={practiceGroup.id}
                    practiceGroup={practiceGroup}
                    language={language}
                  />
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <CapabilityContactCta
        title={t.contactCta}
        subtitle={t.contactSubtitle}
        emailLabel={t.emailUs}
        callLabel={t.callUs}
      />
    </div>
  );
}
