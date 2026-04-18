import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, Linkedin, AlertCircle, Download, GraduationCap, Globe2, Award, FileText, Briefcase, Scale, Users, BookOpen, Building2, Languages, Newspaper, Calendar, ArrowRight, Trophy, Star, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PersonJsonLd, BreadcrumbJsonLd } from "@/components/JsonLdSchema";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedContent } from "@/hooks/useTranslatedContent";
import { LeadParagraph } from "@/components/editorial";
import type { TeamMember, PracticeGroup, IndustryGroup, Education, Affiliation, Ranking, Publication, RepresentativeMatter, BarAdmission, News, LanguageCode } from "@shared/schema";

function NewsImageWithFallback({ 
  src, 
  alt, 
  className 
}: { 
  src: string; 
  alt: string; 
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError || !src) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className}`}>
        <span className="text-4xl font-heading font-light text-muted-foreground/60 tracking-[0.18em]">
          VWS
        </span>
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}

function RelatedTeamMemberCard({
  relatedMember,
  language,
  getInitials,
}: {
  relatedMember: TeamMember;
  language: LanguageCode;
  getInitials: (name: string) => string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: relatedMember.id.toString(),
    fields: { title: relatedMember.titleEs || relatedMember.title, titleEs: relatedMember.titleEs },
    enabled: language !== 'es',
  });

  const displayTitle = language === 'es'
    ? relatedMember.titleEs
    : (translatedFields.title || relatedMember.titleEs || relatedMember.title);

  return (
    <Link href={`/team/${relatedMember.slug}`}>
      <div
        className="group relative flex items-center gap-4 py-4 px-3 cursor-pointer hover-elevate"
        data-testid={`card-related-member-${relatedMember.slug}`}
      >
        <span
          aria-hidden="true"
          className="absolute start-0 top-1/2 -translate-y-1/2 w-[2px] h-0 bg-primary transition-all duration-200 group-hover:h-8"
        />
        <Avatar className="w-12 h-12 shrink-0">
          <AvatarImage
            src={relatedMember.imageUrl || undefined}
            alt={relatedMember.name}
          />
          <AvatarFallback className="bg-muted text-foreground text-sm">
            {getInitials(relatedMember.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {relatedMember.name}
          </p>
          <p className="text-xs text-muted-foreground truncate uppercase tracking-[0.12em]">
            {displayTitle}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EducationItemTranslated({
  edu,
  index,
  language,
  memberId,
}: {
  edu: Education;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_edu_${index}`,
    fields: { 
      degree: edu.degreeEs || edu.degree,
      degreeEs: edu.degreeEs,
    },
    enabled: language !== 'es',
  });

  const displayDegree = language === 'es' && edu.degreeEs
    ? edu.degreeEs
    : (translatedFields.degree || edu.degreeEs || edu.degree);

  const displaySchool = language === 'es' && edu.schoolEs ? edu.schoolEs : edu.school;

  return (
    <div 
      className="border-l-2 border-[#AA1A2E] pl-4 py-1"
      data-testid={`item-education-${index}`}
    >
      <p className="text-lg font-medium text-foreground">
        {displayDegree}
      </p>
      <p className="text-muted-foreground">
        {displaySchool}
        {edu.year && <span className="ml-2 text-sm">({edu.year})</span>}
      </p>
    </div>
  );
}

function PracticeGroupBadge({
  group,
  language,
}: {
  group: PracticeGroup;
  language: LanguageCode;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'practice_group',
    entityId: group.id.toString(),
    fields: { name: group.nameEs || group.name, nameEs: group.nameEs },
    enabled: language !== 'es',
  });

  const displayName = language === 'es'
    ? (group.nameEs || group.name)
    : (translatedFields.name || group.nameEs || group.name);

  return (
    <Link href={`/practice-groups/${group.slug}`}>
      <Badge
        variant="outline"
        className="rounded-none cursor-pointer py-2 px-4 no-default-hover-elevate no-default-active-elevate transition-colors duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
        data-testid={`badge-practice-group-${group.slug}`}
      >
        {displayName}
      </Badge>
    </Link>
  );
}

function IndustryGroupBadge({
  group,
  language,
}: {
  group: IndustryGroup;
  language: LanguageCode;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'industry_group',
    entityId: group.id.toString(),
    fields: { name: group.nameEs || group.name, nameEs: group.nameEs },
    enabled: language !== 'es',
  });

  const displayName = language === 'es'
    ? (group.nameEs || group.name)
    : (translatedFields.name || group.nameEs || group.name);

  return (
    <Link href={`/industry-groups/${group.slug}`}>
      <Badge
        variant="outline"
        className="rounded-none cursor-pointer py-2 px-4 no-default-hover-elevate no-default-active-elevate transition-colors duration-200 hover:bg-primary hover:text-primary-foreground hover:border-primary"
        data-testid={`badge-industry-group-${group.slug}`}
      >
        {displayName}
      </Badge>
    </Link>
  );
}

function RankingItemTranslated({
  ranking,
  index,
  language,
  memberId,
  isTiered,
  getPublicationIcon,
}: {
  ranking: Ranking;
  index: number;
  language: LanguageCode;
  memberId: string;
  isTiered: boolean;
  getPublicationIcon: (publication: string) => JSX.Element;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_ranking_${index}`,
    fields: { 
      ranking: ranking.rankingEs || ranking.ranking,
      rankingEs: ranking.rankingEs,
      area: ranking.areaEs || ranking.area,
      areaEs: ranking.areaEs,
    },
    enabled: language !== 'es',
  });

  const displayRanking = language === 'es' && ranking.rankingEs
    ? ranking.rankingEs
    : (translatedFields.ranking || ranking.rankingEs || ranking.ranking);

  const displayArea = language === 'es' && ranking.areaEs
    ? ranking.areaEs
    : (translatedFields.area || ranking.areaEs || ranking.area);

  if (isTiered) {
    return (
      <Card 
        className="border border-border bg-card rounded-none overflow-visible"
        data-testid={`card-ranking-tiered-${index}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getPublicationIcon(ranking.publication)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">
                {ranking.publication}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge 
                  variant="outline"
                  className="rounded-none text-[10px] uppercase tracking-[0.18em] border-[#AA1A2E] text-[#AA1A2E]"
                  data-testid={`badge-ranking-band-${index}`}
                >
                  {displayRanking}
                </Badge>
                {ranking.year && (
                  <Badge 
                    variant="outline" 
                    className="rounded-none text-[10px] uppercase tracking-[0.18em]"
                  >
                    {ranking.year}
                  </Badge>
                )}
              </div>
              {displayArea && (
                <p className="text-sm text-muted-foreground mt-2">
                  {displayArea}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="flex items-center gap-3 p-3 bg-card rounded-none border border-border"
      data-testid={`item-ranking-simple-${index}`}
    >
      <div className="flex-shrink-0">
        {getPublicationIcon(ranking.publication)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {ranking.publication}
        </p>
        {ranking.year && (
          <p className="text-xs text-muted-foreground">
            {ranking.year}
          </p>
        )}
      </div>
    </div>
  );
}

function PublicationItemTranslated({
  pub,
  index,
  language,
  memberId,
  viewPublicationText,
}: {
  pub: Publication;
  index: number;
  language: LanguageCode;
  memberId: string;
  viewPublicationText: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_pub_${index}`,
    fields: { 
      title: pub.titleEs || pub.title,
      titleEs: pub.titleEs,
    },
    enabled: language !== 'es',
  });

  const displayTitle = language === 'es' && pub.titleEs
    ? pub.titleEs
    : (translatedFields.title || pub.titleEs || pub.title);

  return (
    <div 
      className="border-l-2 border-[#AA1A2E] pl-4 py-1"
      data-testid={`item-publication-${index}`}
    >
      <p className="text-foreground font-medium">
        {displayTitle}
      </p>
      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
        {pub.journal && <span>{pub.journal}</span>}
        {pub.year && <span>• {pub.year}</span>}
        {pub.url && (
          <a 
            href={pub.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {viewPublicationText}
          </a>
        )}
      </div>
    </div>
  );
}

function AffiliationItemTranslated({
  affiliation,
  index,
  language,
  memberId,
}: {
  affiliation: Affiliation;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_affil_${index}`,
    fields: { 
      organization: affiliation.organizationEs || affiliation.organization,
      organizationEs: affiliation.organizationEs,
      role: affiliation.roleEs || affiliation.role,
      roleEs: affiliation.roleEs,
    },
    enabled: language !== 'es',
  });

  const displayOrganization = language === 'es' && affiliation.organizationEs
    ? affiliation.organizationEs
    : (translatedFields.organization || affiliation.organizationEs || affiliation.organization);

  const displayRole = affiliation.role
    ? (language === 'es' && affiliation.roleEs
        ? affiliation.roleEs
        : (translatedFields.role || affiliation.roleEs || affiliation.role))
    : null;

  return (
    <div 
      className="flex items-start gap-3"
      data-testid={`item-affiliation-${index}`}
    >
      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      <div>
        <p className="text-foreground">
          {displayOrganization}
        </p>
        {displayRole && (
          <p className="text-sm text-muted-foreground">
            {displayRole}
          </p>
        )}
      </div>
    </div>
  );
}

function BarAdmissionItemTranslated({
  admission,
  index,
  language,
  memberId,
}: {
  admission: BarAdmission;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_bar_${index}`,
    fields: { 
      jurisdiction: admission.jurisdictionEs || admission.jurisdiction,
      jurisdictionEs: admission.jurisdictionEs,
    },
    enabled: language !== 'es',
  });

  const displayJurisdiction = language === 'es' && admission.jurisdictionEs
    ? admission.jurisdictionEs
    : (translatedFields.jurisdiction || admission.jurisdictionEs || admission.jurisdiction);

  return (
    <Badge 
      variant="secondary"
      className="rounded-none py-2 px-4"
      data-testid={`badge-bar-admission-${index}`}
    >
      {displayJurisdiction}
      {admission.year && <span className="ml-1 opacity-70">({admission.year})</span>}
    </Badge>
  );
}

function LanguageItemTranslated({
  lang,
  index,
  language,
  memberId,
}: {
  lang: string;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_lang_${index}`,
    fields: { 
      language: lang,
    },
    enabled: language !== 'es',
  });

  const displayLanguage = language === 'es'
    ? lang
    : (translatedFields.language || lang);

  return (
    <Badge 
      variant="outline"
      className="rounded-none py-2 px-4"
      data-testid={`badge-language-${index}`}
    >
      {displayLanguage}
    </Badge>
  );
}

function RepresentativeMatterTranslated({
  matter,
  index,
  language,
  memberId,
}: {
  matter: RepresentativeMatter;
  index: number;
  language: LanguageCode;
  memberId: string;
}) {
  const { translatedFields } = useTranslatedContent({
    contentType: 'team_member',
    entityId: `${memberId}_matter_${index}`,
    fields: { 
      description: matter.descriptionEs || matter.description,
      descriptionEs: matter.descriptionEs,
    },
    enabled: language !== 'es',
  });

  const displayDescription = language === 'es' && matter.descriptionEs
    ? matter.descriptionEs
    : (translatedFields.description || matter.descriptionEs || matter.description);

  return (
    <div 
      className="flex items-start gap-3"
      data-testid={`item-representative-matter-${index}`}
    >
      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
      <div>
        <p className="text-foreground">
          {displayDescription}
        </p>
        {(matter.client || matter.year) && (
          <p className="text-sm text-muted-foreground mt-1">
            {matter.client && <span>{matter.client}</span>}
            {matter.client && matter.year && <span> • </span>}
            {matter.year && <span>{matter.year}</span>}
          </p>
        )}
      </div>
    </div>
  );
}

export default function TeamMemberDetail() {
  const { language } = useLanguage();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: member, isLoading, error } = useQuery<TeamMember>({
    queryKey: [`/api/team/${slug}`],
    enabled: !!slug,
  });

  const { data: practiceGroups } = useQuery<PracticeGroup[]>({
    queryKey: ["/api/practice-groups"],
  });

  const { data: industryGroups } = useQuery<IndustryGroup[]>({
    queryKey: ["/api/industry-groups"],
  });

  const { data: allTeamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: relatedNews } = useQuery<News[]>({
    queryKey: ['/api/team', slug, 'news'],
    enabled: !!slug,
  });

  const { translatedFields, isTranslating } = useTranslatedContent({
    contentType: 'team_member',
    entityId: member?.id?.toString() || '',
    fields: { 
      title: member?.titleEs || member?.title, 
      titleEs: member?.titleEs,
      role: member?.roleEs || member?.role, 
      roleEs: member?.roleEs,
      bio: member?.bioEs || member?.bio,
      bioEs: member?.bioEs,
    },
    enabled: !!member && !!member.bio && language !== 'es',
  });

  const content: Record<string, {
    backToAll: string;
    partner: string;
    ofCounsel: string;
    associate: string;
    contactInfo: string;
    practiceAreas: string;
    industryGroups: string;
    biography: string;
    education: string;
    barAdmissions: string;
    languages: string;
    affiliations: string;
    rankings: string;
    publications: string;
    representativeMatters: string;
    experience: string;
    contactCta: string;
    contactSubtitle: string;
    emailUs: string;
    callUs: string;
    downloadVCard: string;
    errorMessage: string;
    loading: string;
    relatedTeam: string;
    viewProfile: string;
    relatedNews: string;
    readMore: string;
    featuredRecognition: string;
    totalRecognitions: string;
    topPublications: string;
    tieredRankings: string;
    otherRecognitions: string;
    band: string;
    viewPublication: string;
    positions: {
      foundingPartner: string;
      partner: string;
      ofCounsel: string;
      seniorAssociate: string;
      associate: string;
    };
  }> = {
    en: {
      backToAll: "All Team Members",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associate",
      contactInfo: "Contact Information",
      practiceAreas: "Practice Areas",
      industryGroups: "Industry Groups",
      biography: "Biography",
      education: "Education",
      barAdmissions: "Bar Admissions",
      languages: "Languages",
      affiliations: "Professional Affiliations",
      rankings: "Rankings & Recognition",
      publications: "Publications",
      representativeMatters: "Representative Matters",
      experience: "Professional Experience",
      contactCta: "Get in touch",
      contactSubtitle: "Connect with our team to discuss how we can assist with your legal needs.",
      emailUs: "Send Email",
      callUs: "Call",
      downloadVCard: "Download vCard",
      errorMessage: "Team member not found",
      loading: "Loading...",
      relatedTeam: "Related Team Members",
      viewProfile: "View Profile",
      relatedNews: "Latest News & Articles",
      readMore: "Read More",
      featuredRecognition: "Featured Recognition",
      totalRecognitions: "Total Recognitions",
      topPublications: "Top Publications",
      tieredRankings: "Tiered Rankings",
      otherRecognitions: "Other Recognitions",
      band: "Band",
      viewPublication: "View Publication",
      positions: {
        foundingPartner: "Founding Partner",
        partner: "Partner",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Senior Associate",
        associate: "Associate",
      },
    },
    es: {
      backToAll: "Todos los Miembros",
      partner: "Socio",
      ofCounsel: "Of Counsel",
      associate: "Asociado",
      contactInfo: "Información de Contacto",
      practiceAreas: "Áreas de Práctica",
      industryGroups: "Grupos Industriales",
      biography: "Biografía",
      education: "Formación Académica",
      barAdmissions: "Admisiones al Colegio",
      languages: "Idiomas",
      affiliations: "Afiliaciones Profesionales",
      rankings: "Rankings y Reconocimientos",
      publications: "Publicaciones",
      representativeMatters: "Asuntos Representativos",
      experience: "Experiencia Profesional",
      contactCta: "Contáctenos",
      contactSubtitle: "Conéctese con nuestro equipo para discutir cómo podemos ayudarle con sus necesidades legales.",
      emailUs: "Enviar Email",
      callUs: "Llamar",
      downloadVCard: "Descargar vCard",
      errorMessage: "Miembro del equipo no encontrado",
      loading: "Cargando...",
      relatedTeam: "Equipo Relacionado",
      viewProfile: "Ver Perfil",
      relatedNews: "Últimas Noticias y Artículos",
      readMore: "Leer Más",
      featuredRecognition: "Reconocimiento Destacado",
      totalRecognitions: "Total de Reconocimientos",
      topPublications: "Publicaciones Principales",
      tieredRankings: "Rankings por Nivel",
      otherRecognitions: "Otros Reconocimientos",
      band: "Banda",
      viewPublication: "Ver Publicación",
      positions: {
        foundingPartner: "Socio Fundador",
        partner: "Socio",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Asociado Senior",
        associate: "Asociado",
      },
    },
    de: {
      backToAll: "Zurück zum Team",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associate",
      contactInfo: "Kontakt",
      practiceAreas: "Praxisbereiche",
      industryGroups: "Branchengruppen",
      biography: "Biografie",
      education: "Ausbildung",
      barAdmissions: "Zulassungen",
      languages: "Sprachen",
      affiliations: "Berufsverbände",
      rankings: "Rankings & Auszeichnungen",
      publications: "Publikationen",
      representativeMatters: "Referenzmandate",
      experience: "Erfahrung",
      contactCta: "Kontakt aufnehmen",
      contactSubtitle: "Kontaktieren Sie unser Team, um zu besprechen, wie wir Ihnen helfen können.",
      emailUs: "E-Mail senden",
      callUs: "Anrufen",
      downloadVCard: "VCard herunterladen",
      errorMessage: "Teammitglied nicht gefunden",
      loading: "Wird geladen...",
      relatedTeam: "Weitere Teammitglieder",
      viewProfile: "Profil anzeigen",
      relatedNews: "Aktuelle Nachrichten & Artikel",
      readMore: "Mehr lesen",
      featuredRecognition: "Hervorgehobene Anerkennung",
      totalRecognitions: "Gesamte Anerkennungen",
      topPublications: "Top-Publikationen",
      tieredRankings: "Ranking-Einstufungen",
      otherRecognitions: "Weitere Auszeichnungen",
      band: "Band",
      viewPublication: "Publikation ansehen",
      positions: {
        foundingPartner: "Gründungspartner",
        partner: "Partner",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Senior Associate",
        associate: "Associate",
      },
    },
    zh: {
      backToAll: "返回团队",
      partner: "合伙人",
      ofCounsel: "法律顾问",
      associate: "律师",
      contactInfo: "联系方式",
      practiceAreas: "业务领域",
      industryGroups: "行业领域",
      biography: "简介",
      education: "教育背景",
      barAdmissions: "执业资格",
      languages: "语言",
      affiliations: "专业协会",
      rankings: "排名与认可",
      publications: "出版物",
      representativeMatters: "代表案例",
      experience: "工作经历",
      contactCta: "联系我们",
      contactSubtitle: "联系我们的团队，讨论我们如何协助您的法律需求。",
      emailUs: "发送邮件",
      callUs: "电话联系",
      downloadVCard: "下载名片",
      errorMessage: "未找到团队成员",
      loading: "加载中...",
      relatedTeam: "相关团队成员",
      viewProfile: "查看简介",
      relatedNews: "最新新闻与文章",
      readMore: "阅读更多",
      featuredRecognition: "重点认可",
      totalRecognitions: "认可总数",
      topPublications: "主要出版物",
      tieredRankings: "分级排名",
      otherRecognitions: "其他认可",
      band: "等级",
      viewPublication: "查看出版物",
      positions: {
        foundingPartner: "创始合伙人",
        partner: "合伙人",
        ofCounsel: "法律顾问",
        seniorAssociate: "高级律师",
        associate: "律师",
      },
    },
    ko: {
      backToAll: "팀으로 돌아가기",
      partner: "파트너",
      ofCounsel: "고문",
      associate: "어소시에이트",
      contactInfo: "연락처",
      practiceAreas: "업무 분야",
      industryGroups: "산업 분야",
      biography: "약력",
      education: "학력",
      barAdmissions: "변호사 자격",
      languages: "사용 언어",
      affiliations: "전문 협회",
      rankings: "순위 및 인정",
      publications: "출판물",
      representativeMatters: "대표 사건",
      experience: "경력",
      contactCta: "연락하기",
      contactSubtitle: "법률 서비스에 대해 상담하려면 저희 팀에 연락해 주세요.",
      emailUs: "이메일 보내기",
      callUs: "전화하기",
      downloadVCard: "명함 다운로드",
      errorMessage: "팀원을 찾을 수 없습니다",
      loading: "로딩 중...",
      relatedTeam: "관련 팀원",
      viewProfile: "프로필 보기",
      relatedNews: "최신 뉴스 및 기사",
      readMore: "더 읽기",
      featuredRecognition: "주요 인정",
      totalRecognitions: "총 인정",
      topPublications: "주요 출판물",
      tieredRankings: "등급별 순위",
      otherRecognitions: "기타 인정",
      band: "등급",
      viewPublication: "출판물 보기",
      positions: {
        foundingPartner: "창립 파트너",
        partner: "파트너",
        ofCounsel: "고문",
        seniorAssociate: "시니어 어소시에이트",
        associate: "어소시에이트",
      },
    },
    ja: {
      backToAll: "チームに戻る",
      partner: "パートナー",
      ofCounsel: "オブ・カウンセル",
      associate: "アソシエイト",
      contactInfo: "連絡先",
      practiceAreas: "取扱分野",
      industryGroups: "業界グループ",
      biography: "経歴",
      education: "学歴",
      barAdmissions: "弁護士資格",
      languages: "使用言語",
      affiliations: "所属団体",
      rankings: "ランキング・受賞歴",
      publications: "出版物",
      representativeMatters: "代表的案件",
      experience: "経験",
      contactCta: "お問い合わせ",
      contactSubtitle: "法務ニーズについてご相談ください。",
      emailUs: "メールを送る",
      callUs: "電話する",
      downloadVCard: "名刺をダウンロード",
      errorMessage: "チームメンバーが見つかりません",
      loading: "読み込み中...",
      relatedTeam: "関連チームメンバー",
      viewProfile: "プロフィールを見る",
      relatedNews: "最新ニュース・記事",
      readMore: "続きを読む",
      featuredRecognition: "注目の評価",
      totalRecognitions: "評価総数",
      topPublications: "主要出版物",
      tieredRankings: "段階別ランキング",
      otherRecognitions: "その他の評価",
      band: "バンド",
      viewPublication: "出版物を見る",
      positions: {
        foundingPartner: "創立パートナー",
        partner: "パートナー",
        ofCounsel: "オブ・カウンセル",
        seniorAssociate: "シニアアソシエイト",
        associate: "アソシエイト",
      },
    },
    ar: {
      backToAll: "العودة للفريق",
      partner: "شريك",
      ofCounsel: "مستشار قانوني",
      associate: "محامي",
      contactInfo: "معلومات الاتصال",
      practiceAreas: "مجالات الممارسة",
      industryGroups: "المجموعات الصناعية",
      biography: "السيرة الذاتية",
      education: "التعليم",
      barAdmissions: "تراخيص المحاماة",
      languages: "اللغات",
      affiliations: "العضويات المهنية",
      rankings: "التصنيفات والتقدير",
      publications: "المنشورات",
      representativeMatters: "القضايا التمثيلية",
      experience: "الخبرة",
      contactCta: "تواصل معنا",
      contactSubtitle: "تواصل مع فريقنا لمناقشة كيف يمكننا المساعدة في احتياجاتك القانونية.",
      emailUs: "إرسال بريد إلكتروني",
      callUs: "اتصل",
      downloadVCard: "تحميل بطاقة العمل",
      errorMessage: "لم يتم العثور على عضو الفريق",
      loading: "جاري التحميل...",
      relatedTeam: "أعضاء الفريق ذوو الصلة",
      viewProfile: "عرض الملف الشخصي",
      relatedNews: "آخر الأخبار والمقالات",
      readMore: "اقرأ المزيد",
      featuredRecognition: "التقدير المميز",
      totalRecognitions: "إجمالي التقديرات",
      topPublications: "أهم المنشورات",
      tieredRankings: "التصنيفات حسب المستوى",
      otherRecognitions: "تقديرات أخرى",
      band: "الفئة",
      viewPublication: "عرض المنشور",
      positions: {
        foundingPartner: "شريك مؤسس",
        partner: "شريك",
        ofCounsel: "مستشار قانوني",
        seniorAssociate: "محامي أول",
        associate: "محامي",
      },
    },
    ru: {
      backToAll: "Назад к команде",
      partner: "Партнёр",
      ofCounsel: "Советник",
      associate: "Юрист",
      contactInfo: "Контакты",
      practiceAreas: "Области практики",
      industryGroups: "Отраслевые группы",
      biography: "Биография",
      education: "Образование",
      barAdmissions: "Адвокатские лицензии",
      languages: "Языки",
      affiliations: "Профессиональные ассоциации",
      rankings: "Рейтинги и признание",
      publications: "Публикации",
      representativeMatters: "Показательные дела",
      experience: "Опыт",
      contactCta: "Связаться с нами",
      contactSubtitle: "Свяжитесь с нашей командой, чтобы обсудить ваши юридические потребности.",
      emailUs: "Отправить email",
      callUs: "Позвонить",
      downloadVCard: "Скачать визитку",
      errorMessage: "Член команды не найден",
      loading: "Загрузка...",
      relatedTeam: "Связанные члены команды",
      viewProfile: "Посмотреть профиль",
      relatedNews: "Последние новости и статьи",
      readMore: "Читать далее",
      featuredRecognition: "Главное признание",
      totalRecognitions: "Всего признаний",
      topPublications: "Ведущие публикации",
      tieredRankings: "Уровневые рейтинги",
      otherRecognitions: "Другие признания",
      band: "Уровень",
      viewPublication: "Смотреть публикацию",
      positions: {
        foundingPartner: "Учредитель",
        partner: "Партнёр",
        ofCounsel: "Советник",
        seniorAssociate: "Старший юрист",
        associate: "Юрист",
      },
    },
    fr: {
      backToAll: "Retour à l'équipe",
      partner: "Associé",
      ofCounsel: "Of Counsel",
      associate: "Collaborateur",
      contactInfo: "Coordonnées",
      practiceAreas: "Domaines de pratique",
      industryGroups: "Groupes sectoriels",
      biography: "Biographie",
      education: "Formation",
      barAdmissions: "Inscriptions au barreau",
      languages: "Langues",
      affiliations: "Affiliations professionnelles",
      rankings: "Classements et distinctions",
      publications: "Publications",
      representativeMatters: "Affaires représentatives",
      experience: "Expérience",
      contactCta: "Nous contacter",
      contactSubtitle: "Contactez notre équipe pour discuter de vos besoins juridiques.",
      emailUs: "Envoyer un email",
      callUs: "Appeler",
      downloadVCard: "Télécharger vCard",
      errorMessage: "Membre de l'équipe introuvable",
      loading: "Chargement...",
      relatedTeam: "Membres de l'équipe associés",
      viewProfile: "Voir le profil",
      relatedNews: "Dernières actualités et articles",
      readMore: "Lire la suite",
      featuredRecognition: "Reconnaissance mise en avant",
      totalRecognitions: "Total des reconnaissances",
      topPublications: "Principales publications",
      tieredRankings: "Classements par niveau",
      otherRecognitions: "Autres distinctions",
      band: "Bande",
      viewPublication: "Voir la publication",
      positions: {
        foundingPartner: "Associé fondateur",
        partner: "Associé",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Collaborateur senior",
        associate: "Collaborateur",
      },
    },
    it: {
      backToAll: "Torna al team",
      partner: "Partner",
      ofCounsel: "Of Counsel",
      associate: "Associato",
      contactInfo: "Contatti",
      practiceAreas: "Aree di pratica",
      industryGroups: "Settori industriali",
      biography: "Biografia",
      education: "Formazione",
      barAdmissions: "Iscrizioni all'albo",
      languages: "Lingue",
      affiliations: "Affiliazioni professionali",
      rankings: "Classifiche e riconoscimenti",
      publications: "Pubblicazioni",
      representativeMatters: "Casi rappresentativi",
      experience: "Esperienza",
      contactCta: "Contattaci",
      contactSubtitle: "Contatta il nostro team per discutere delle tue esigenze legali.",
      emailUs: "Invia email",
      callUs: "Chiama",
      downloadVCard: "Scarica vCard",
      errorMessage: "Membro del team non trovato",
      loading: "Caricamento...",
      relatedTeam: "Membri del team correlati",
      viewProfile: "Visualizza profilo",
      relatedNews: "Ultime notizie e articoli",
      readMore: "Leggi di più",
      featuredRecognition: "Riconoscimento in evidenza",
      totalRecognitions: "Riconoscimenti totali",
      topPublications: "Pubblicazioni principali",
      tieredRankings: "Classifiche per livello",
      otherRecognitions: "Altri riconoscimenti",
      band: "Fascia",
      viewPublication: "Vedi pubblicazione",
      positions: {
        foundingPartner: "Partner fondatore",
        partner: "Partner",
        ofCounsel: "Of Counsel",
        seniorAssociate: "Senior Associate",
        associate: "Associato",
      },
    },
  };

  const t = content[language] || content.en;

  const formatDate = (date: string | Date | null) => {
    if (!date) return '';
    const d = new Date(date);
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-MX',
      de: 'de-DE',
      zh: 'zh-CN',
      ko: 'ko-KR',
      ja: 'ja-JP',
      ar: 'ar-SA',
      ru: 'ru-RU',
      fr: 'fr-FR',
      it: 'it-IT',
    };
    return d.toLocaleDateString(localeMap[language] || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const getSeniorityLabel = () => {
    if (member?.isPartner) return t.partner;
    if (member?.title === "Of Counsel") return t.ofCounsel;
    return t.associate;
  };

  const handleDownloadVCard = () => {
    if (member) {
      window.location.href = `/api/team/${member.slug}/vcard?lang=${language}`;
    }
  };

  const relatedMembers = allTeamMembers?.filter(m => 
    m.id !== member?.id && 
    ((m.isPartner && member?.isPartner) || 
     (m.title === member?.title))
  ).slice(0, 4);

  const getPublicationIcon = (_publication: string) => (
    <span
      aria-hidden="true"
      className="inline-block w-1.5 h-1.5 bg-[#AA1A2E] mt-1.5"
    />
  );

  const getPublicationPriority = (publication: string): number => {
    const pubLower = publication.toLowerCase();
    if (pubLower.includes("chambers")) return 1;
    if (pubLower.includes("legal 500")) return 2;
    if (pubLower.includes("who's who") || pubLower.includes("whos who")) return 3;
    if (pubLower.includes("iflr")) return 4;
    if (pubLower.includes("benchmark")) return 5;
    return 10;
  };

  const processedRankings = useMemo(() => {
    if (!member?.rankings || member.rankings.length === 0) return null;
    
    const rankings = member.rankings as Ranking[];
    
    const tieredRankings = rankings.filter(r => r.ranking && r.ranking.trim() !== "");
    const simpleRankings = rankings.filter(r => !r.ranking || r.ranking.trim() === "");
    
    const sortedTiered = [...tieredRankings].sort((a, b) => {
      const prioA = getPublicationPriority(a.publication);
      const prioB = getPublicationPriority(b.publication);
      if (prioA !== prioB) return prioA - prioB;
      const bandA = a.ranking?.match(/\d+/)?.[0];
      const bandB = b.ranking?.match(/\d+/)?.[0];
      if (bandA && bandB) return parseInt(bandA) - parseInt(bandB);
      return 0;
    });

    const uniquePublications = Array.from(new Set(rankings.map(r => r.publication)));
    const topPublications = uniquePublications
      .sort((a, b) => getPublicationPriority(a) - getPublicationPriority(b))
      .slice(0, 3);
    
    return {
      tieredRankings: sortedTiered,
      simpleRankings,
      totalCount: rankings.length,
      topPublications,
    };
  }, [member?.rankings]);

  const getMemberEducation = () => {
    if (!member?.education || member.education.length === 0) return undefined;
    return (member.education as Education[]).map(edu => ({
      school: language === "es" && edu.schoolEs ? edu.schoolEs : edu.school,
      degree: language === "es" && edu.degreeEs ? edu.degreeEs : edu.degree,
      year: edu.year
    }));
  };

  const getMemberKnowsAbout = () => {
    const areas: string[] = [];
    if (practiceGroups && member) {
      practiceGroups.forEach(pg => {
        areas.push(language === "es" ? pg.nameEs : pg.name);
      });
    }
    return areas.length > 0 ? areas.slice(0, 10) : undefined;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background" data-testid="page-team-member-error">
        <Header />
        <div className="pt-32 pb-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-heading text-foreground mb-4" data-testid="text-error-title">
              {t.errorMessage}
            </h2>
            <Link href="/team">
              <Button variant="outline" data-testid="button-back-to-team">
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
      <div className="min-h-screen bg-background" data-testid="page-team-member-loading">
        <Header />
        <section className="pt-36 pb-20 bg-[#1a1a19]">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Skeleton className="h-5 w-48 bg-white/10 mb-6" />
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Skeleton className="h-32 w-32 rounded-full bg-white/10" />
              <div className="text-center md:text-left">
                <Skeleton className="h-10 w-64 bg-white/10 mb-3" />
                <Skeleton className="h-6 w-48 bg-white/10 mb-2" />
                <Skeleton className="h-5 w-32 bg-white/10" />
              </div>
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

  const displayTitle = language === 'es'
    ? (member?.titleEs || member?.title)
    : language === 'en'
      ? member?.title
      : (translatedFields.title || null);
  
  const displayRole = language === 'es'
    ? (member?.roleEs || member?.role)
    : language === 'en'
      ? member?.role
      : (translatedFields.role || null);
  
  const displayBio = language === 'es'
    ? (member?.bioEs || member?.bio)
    : language === 'en'
      ? member?.bio
      : (translatedFields.bio || null);

  return (
    <div className="min-h-screen bg-background" data-testid="page-team-member-detail">
      <Header />
      
      {member && (
        <>
          <PersonJsonLd
            name={member.name}
            jobTitle={displayTitle || member.title}
            email={member.email}
            telephone={member.phone}
            imageUrl={member.imageUrl}
            url={`https://www.vonwobeser.com/team/${member.slug}`}
            linkedinUrl={member.linkedinUrl}
            education={getMemberEducation()}
            languages={member.languages as string[] | undefined}
            knowsAbout={getMemberKnowsAbout()}
            language={language}
          />
          <BreadcrumbJsonLd
            items={[
              { name: language === "es" ? "Inicio" : "Home", url: "https://www.vonwobeser.com" },
              { name: language === "es" ? "Equipo" : "Team", url: "https://www.vonwobeser.com/team" },
              { name: member.name, url: `https://www.vonwobeser.com/team/${member.slug}` }
            ]}
            language={language}
          />
        </>
      )}
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-team-member-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Link href="/team">
              <span 
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 cursor-pointer text-sm"
                data-testid="link-back-to-team"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.backToAll}
              </span>
            </Link>
            <div className="flex flex-col md:flex-row items-stretch gap-0">
              <div
                className="relative aspect-square w-full md:w-[280px] lg:w-[320px] shrink-0 overflow-hidden"
                data-testid="container-profile-photo"
              >
                {member?.imageUrl ? (
                  <>
                    <img
                      src={member.imageUrl}
                      alt={member?.name}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      data-testid="img-profile-photo"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1a1a19]/10 to-[#1a1a19]/70"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a19]/40"
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-white/10 text-white text-6xl font-light"
                    data-testid="avatar-fallback"
                  >
                    {member?.name ? getInitials(member.name) : ''}
                  </div>
                )}
              </div>
              <div
                aria-hidden="true"
                className="hidden md:block w-px shrink-0 bg-[#AA1A2E]/20"
              />
              <div
                aria-hidden="true"
                className="md:hidden h-px w-full bg-[#AA1A2E]/20"
              />
              <div className="flex-1 min-w-0 text-center md:text-left px-6 py-8 md:px-10 md:py-10">
                <div className="h-px w-10 bg-[#AA1A2E] mb-4 mx-auto md:mx-0" aria-hidden="true" />
                <div className="flex flex-col md:flex-row items-center gap-3 mb-3">
                  <h1 
                    className="text-2xl md:text-3xl lg:text-4xl font-heading font-light text-white uppercase tracking-[0.12em]"
                    data-testid="text-team-member-name"
                  >
                    {member?.name}
                  </h1>
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-0 rounded-none"
                    data-testid="badge-seniority"
                  >
                    {getSeniorityLabel()}
                  </Badge>
                </div>
                <p 
                  className="text-xl text-white/90 font-medium mb-2"
                  data-testid="text-team-member-title"
                >
                  {displayTitle}
                  {isTranslating && (
                    <Loader2 className="inline-block w-4 h-4 ml-2 animate-spin text-white/60" />
                  )}
                </p>
                <p 
                  className="text-lg text-white/85 mb-6"
                  data-testid="text-team-member-role"
                >
                  {displayRole}
                </p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {member?.email && (
                    <Button 
                      variant="secondary"
                      className="rounded-none bg-card/20 hover:bg-white/30 text-white border-0"
                      asChild
                      data-testid="button-email"
                    >
                      <a href={`mailto:${member.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {member.email}
                      </a>
                    </Button>
                  )}
                  {member?.phone && (
                    <Button 
                      variant="secondary"
                      className="rounded-none bg-card/20 hover:bg-white/30 text-white border-0"
                      asChild
                      data-testid="button-phone"
                    >
                      <a href={`tel:${member.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {member.phone}
                      </a>
                    </Button>
                  )}
                  {member?.linkedinUrl && (
                    <Button 
                      variant="secondary"
                      size="icon"
                      className="rounded-none bg-card/20 hover:bg-white/30 text-white border-0"
                      asChild
                      data-testid="button-linkedin"
                    >
                      <a href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="secondary"
                    className="rounded-none bg-card text-primary hover:bg-white/90"
                    onClick={handleDownloadVCard}
                    data-testid="button-download-vcard"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.downloadVCard}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              {(displayBio || ((member?.bio || member?.bioEs) && isTranslating)) && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  data-testid="section-biography"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-biography-title"
                  >
                    <FileText className="w-6 h-6 text-primary" />
                    {t.biography}
                    {isTranslating && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
                    )}
                  </h2>
                  <div data-testid="container-biography">
                    {displayBio ? (() => {
                      const paragraphs = displayBio.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
                      const [first, ...rest] = paragraphs.length ? paragraphs : [displayBio];
                      return (
                        <LeadParagraph
                          firstParagraph={first}
                          restParagraphs={rest}
                          testId="lead-biography"
                        />
                      );
                    })() : (
                      <div className="flex items-center gap-2 text-muted-foreground italic">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span data-testid="text-translation-pending">
                          {language === 'de' ? 'Übersetzung lädt...' :
                           language === 'zh' ? '翻译加载中...' :
                           language === 'ko' ? '번역 로딩 중...' :
                           language === 'ja' ? '翻訳を読み込み中...' :
                           language === 'ar' ? 'جاري تحميل الترجمة...' :
                           language === 'ru' ? 'Загрузка перевода...' :
                           language === 'fr' ? 'Traduction en cours...' :
                           language === 'it' ? 'Caricamento traduzione...' :
                           'Loading translation...'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {processedRankings && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  data-testid="section-rankings"
                >
                  <div className="rounded-none p-6 border border-border bg-card">
                    <div className="mb-6">
                      <div className="h-px w-10 bg-[#AA1A2E] mb-4" aria-hidden="true" />
                      <h2
                        className="text-xl font-heading font-light text-foreground flex items-center gap-3 uppercase tracking-[0.12em]"
                        data-testid="text-rankings-title"
                      >
                        <span>{t.rankings}</span>
                        <Badge
                          variant="outline"
                          className="ml-auto rounded-none text-xs uppercase tracking-[0.15em] border-[#AA1A2E] text-[#AA1A2E]"
                          data-testid="badge-rankings-count"
                        >
                          {processedRankings.totalCount}
                        </Badge>
                      </h2>
                    </div>

                    {processedRankings.tieredRankings.length > 0 && (
                      <div className="mb-6" data-testid="container-tiered-rankings">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-4">
                          {t.tieredRankings}
                        </h3>
                        <div className="space-y-3">
                          {processedRankings.tieredRankings.map((ranking, index) => (
                            <RankingItemTranslated
                              key={index}
                              ranking={ranking}
                              index={index}
                              language={language}
                              memberId={member?.id?.toString() || ''}
                              isTiered={true}
                              getPublicationIcon={getPublicationIcon}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {processedRankings.simpleRankings.length > 0 && (
                      <div data-testid="container-simple-rankings">
                        {processedRankings.tieredRankings.length > 0 && (
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-4">
                            {t.otherRecognitions}
                          </h3>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {processedRankings.simpleRankings.map((ranking, index) => (
                            <RankingItemTranslated
                              key={index}
                              ranking={ranking}
                              index={processedRankings.tieredRankings.length + index}
                              language={language}
                              memberId={member?.id?.toString() || ''}
                              isTiered={false}
                              getPublicationIcon={getPublicationIcon}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {practiceGroups && practiceGroups.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  data-testid="section-practice-areas"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-practice-areas-title"
                  >
                    <Briefcase className="w-6 h-6 text-primary" />
                    {t.practiceAreas}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {practiceGroups.slice(0, 8).map((group) => (
                      <PracticeGroupBadge
                        key={group.id}
                        group={group}
                        language={language}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {industryGroups && industryGroups.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  data-testid="section-industry-groups"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-industry-groups-title"
                  >
                    <Globe2 className="w-6 h-6 text-primary" />
                    {t.industryGroups}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {industryGroups.slice(0, 6).map((group) => (
                      <IndustryGroupBadge
                        key={group.id}
                        group={group}
                        language={language}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.education && member.education.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  data-testid="section-education"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-education-title"
                  >
                    <GraduationCap className="w-6 h-6 text-primary" />
                    {t.education}
                  </h2>
                  <div className="space-y-4">
                    {(member.education as Education[]).map((edu, index) => (
                      <EducationItemTranslated
                        key={index}
                        edu={edu}
                        index={index}
                        language={language}
                        memberId={member.id.toString()}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.barAdmissions && member.barAdmissions.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                  data-testid="section-bar-admissions"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-bar-admissions-title"
                  >
                    <Scale className="w-6 h-6 text-primary" />
                    {t.barAdmissions}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {(member.barAdmissions as BarAdmission[]).map((admission, index) => (
                      <BarAdmissionItemTranslated
                        key={index}
                        admission={admission}
                        index={index}
                        language={language}
                        memberId={member.id.toString()}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.languages && member.languages.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  data-testid="section-languages"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-languages-title"
                  >
                    <Languages className="w-6 h-6 text-primary" />
                    {t.languages}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {(member.languages as string[]).map((lang, index) => (
                      <LanguageItemTranslated
                        key={index}
                        lang={lang}
                        index={index}
                        language={language}
                        memberId={member.id.toString()}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.affiliations && member.affiliations.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.55 }}
                  data-testid="section-affiliations"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-affiliations-title"
                  >
                    <Users className="w-6 h-6 text-primary" />
                    {t.affiliations}
                  </h2>
                  <div className="space-y-3">
                    {(member.affiliations as Affiliation[]).map((affiliation, index) => (
                      <AffiliationItemTranslated
                        key={index}
                        affiliation={affiliation}
                        index={index}
                        language={language}
                        memberId={member.id.toString()}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.publications && member.publications.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.65 }}
                  data-testid="section-publications"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-publications-title"
                  >
                    <BookOpen className="w-6 h-6 text-primary" />
                    {t.publications}
                  </h2>
                  <div className="space-y-4">
                    {(member.publications as Publication[]).map((pub, index) => (
                      <PublicationItemTranslated
                        key={index}
                        pub={pub}
                        index={index}
                        language={language}
                        memberId={member.id.toString()}
                        viewPublicationText={t.viewPublication}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.representativeMatters && member.representativeMatters.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  data-testid="section-representative-matters"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-representative-matters-title"
                  >
                    <Briefcase className="w-6 h-6 text-primary" />
                    {t.representativeMatters}
                  </h2>
                  <div className="space-y-3">
                    {(member.representativeMatters as RepresentativeMatter[]).map((matter, index) => (
                      <RepresentativeMatterTranslated
                        key={index}
                        matter={matter}
                        index={index}
                        language={language}
                        memberId={member.id.toString()}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {member?.experience && member.experience.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.75 }}
                  data-testid="section-experience"
                >
                  <h2 
                    className="text-xl font-heading font-light text-foreground mb-6 flex items-center gap-3 uppercase tracking-[0.12em]"
                    data-testid="text-experience-title"
                  >
                    <Building2 className="w-6 h-6 text-primary" />
                    {t.experience}
                  </h2>
                  <div className="space-y-4">
                    {(member.experience as any[]).map((exp, index) => (
                      <div 
                        key={index}
                        className="border-l-2 border-[#AA1A2E] pl-4 py-1"
                        data-testid={`item-experience-${index}`}
                      >
                        <p className="text-lg font-medium text-foreground">
                          {language === "es" && exp.positionEs ? exp.positionEs : exp.position}
                        </p>
                        <p className="text-muted-foreground">
                          {exp.company}
                          {(exp.startYear || exp.endYear) && (
                            <span className="ml-2 text-sm">
                              ({exp.startYear}{exp.endYear ? ` - ${exp.endYear}` : ' - Present'})
                            </span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            <div className="space-y-8">
              {processedRankings && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="rounded-none p-6 border border-border bg-card"
                  data-testid="section-featured-recognition"
                >
                  <div className="mb-4">
                    <div className="h-px w-10 bg-[#AA1A2E] mb-4" aria-hidden="true" />
                    <h2 
                      className="text-lg font-heading font-light text-foreground uppercase tracking-[0.12em]"
                      data-testid="text-featured-recognition-title"
                    >
                      {t.featuredRecognition}
                    </h2>
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-4">
                    <span 
                      className="text-4xl font-heading font-light text-[#AA1A2E]"
                      style={{ fontFeatureSettings: '"lnum"' }}
                      data-testid="text-total-recognitions-count"
                    >
                      {processedRankings.totalCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t.totalRecognitions}
                    </span>
                  </div>
                  
                  {processedRankings.topPublications.length > 0 && (
                    <div data-testid="container-top-publications">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.18em] mb-2">
                        {t.topPublications}
                      </p>
                      <div className="space-y-2">
                        {processedRankings.topPublications.map((pub, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 text-sm text-foreground"
                            data-testid={`item-top-publication-${index}`}
                          >
                            {getPublicationIcon(pub)}
                            <span className="truncate">{pub}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-muted rounded-none p-6"
                data-testid="section-contact-cta"
              >
                <h2 
                  className="text-xl font-heading font-light text-foreground mb-3"
                  data-testid="text-contact-cta-title"
                >
                  {t.contactCta}
                </h2>
                <p 
                  className="text-sm text-muted-foreground mb-6"
                  data-testid="text-contact-cta-subtitle"
                >
                  {t.contactSubtitle}
                </p>
                <div className="flex flex-col gap-3">
                  {member?.email && (
                    <Button 
                      className="w-full rounded-none"
                      asChild
                      data-testid="button-email-contact"
                    >
                      <a href={`mailto:${member.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.emailUs}
                      </a>
                    </Button>
                  )}
                  {member?.phone && (
                    <Button 
                      variant="outline"
                      className="w-full rounded-none"
                      asChild
                      data-testid="button-call-contact"
                    >
                      <a href={`tel:${member.phone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {t.callUs}
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="w-full rounded-none"
                    onClick={handleDownloadVCard}
                    data-testid="button-download-vcard-sidebar"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t.downloadVCard}
                  </Button>
                </div>
              </motion.section>

              {relatedMembers && relatedMembers.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  data-testid="section-related-team"
                >
                  <div className="mb-6">
                    <span
                      aria-hidden="true"
                      className="block w-10 h-[2px] bg-primary mb-3"
                    />
                    <h2
                      className="text-xs font-medium text-foreground uppercase tracking-[0.12em]"
                      data-testid="text-related-team-title"
                    >
                      {t.relatedTeam}
                    </h2>
                  </div>
                  <div className="divide-y border-y border-border">
                    {relatedMembers.map((relatedMember) => (
                      <RelatedTeamMemberCard
                        key={relatedMember.id}
                        relatedMember={relatedMember}
                        language={language}
                        getInitials={getInitials}
                      />
                    ))}
                  </div>
                </motion.section>
              )}
            </div>
          </div>
        </div>

        {relatedNews && relatedNews.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 pt-12 border-t border-border"
            data-testid="section-related-news"
          >
            <div className="max-w-6xl mx-auto">
              <h2 
                className="text-xl font-heading font-light text-foreground mb-8 flex items-center gap-3 uppercase tracking-[0.12em]"
                data-testid="text-related-news-title"
              >
                <Newspaper className="w-6 h-6 text-primary" />
                {t.relatedNews}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedNews.map((article) => (
                  <motion.div 
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4 }}
                  >
                    <Link href={`/news/${article.slug}`}>
                      <Card
                        className="group h-full rounded-none overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer bg-card"
                        data-testid={`card-related-news-${article.slug}`}
                      >
                        <div className="relative h-48 overflow-hidden bg-muted">
                          <NewsImageWithFallback
                            src={article.imageUrl || ""}
                            alt={language === "es" ? article.titleEs : article.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          {article.category && (
                            <span 
                              className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-primary text-white rounded"
                              data-testid={`badge-news-category-${article.slug}`}
                            >
                              {language === "es" ? article.categoryEs : article.category?.charAt(0).toUpperCase() + article.category?.slice(1)}
                            </span>
                          )}
                        </div>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="w-4 h-4" />
                            <span data-testid={`text-news-date-${article.slug}`}>
                              {formatDate(article.date)}
                            </span>
                          </div>
                          <h3 
                            className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2"
                            data-testid={`text-news-title-${article.slug}`}
                          >
                            {language === "es" ? article.titleEs : article.title}
                          </h3>
                          <p 
                            className="text-muted-foreground text-sm line-clamp-3 mb-4"
                            data-testid={`text-news-excerpt-${article.slug}`}
                          >
                            {language === "es" ? article.excerptEs : article.excerpt}
                          </p>
                          <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
                            {t.readMore}
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  );
}
