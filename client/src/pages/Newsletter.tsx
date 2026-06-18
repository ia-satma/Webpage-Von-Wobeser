import { Send, Loader2, Bell, FileText, Calendar, Briefcase, Archive, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PageHero,
  Section,
  SectionTitle,
  FeatureCard,
  FirmLabel,
  FirmError,
  FirmInput,
  FirmSubmit,
} from "@/components/firm";

interface NewsletterFormData {
  email: string;
  firstName?: string;
  lastName?: string;
}

const getNewsletterFormSchema = (language: string) => {
  const messages: Record<string, { emailRequired: string; emailInvalid: string }> = {
    en: {
      emailRequired: "Email is required",
      emailInvalid: "Please enter a valid email address",
    },
    es: {
      emailRequired: "El correo electrónico es requerido",
      emailInvalid: "Por favor ingrese una dirección de correo válida",
    },
    de: {
      emailRequired: "E-Mail-Adresse ist erforderlich",
      emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
    },
    zh: {
      emailRequired: "电子邮件地址为必填项",
      emailInvalid: "请输入有效的电子邮件地址",
    },
    ko: {
      emailRequired: "이메일 주소는 필수입니다",
      emailInvalid: "유효한 이메일 주소를 입력해 주세요",
    },
    ja: {
      emailRequired: "メールアドレスは必須です",
      emailInvalid: "有効なメールアドレスを入力してください",
    },
    ar: {
      emailRequired: "البريد الإلكتروني مطلوب",
      emailInvalid: "يرجى إدخال عنوان بريد إلكتروني صالح",
    },
    ru: {
      emailRequired: "Требуется адрес электронной почты",
      emailInvalid: "Пожалуйста, введите действительный адрес электронной почты",
    },
    fr: {
      emailRequired: "L'adresse e-mail est requise",
      emailInvalid: "Veuillez saisir une adresse e-mail valide",
    },
    it: {
      emailRequired: "L'indirizzo e-mail è obbligatorio",
      emailInvalid: "Inserisci un indirizzo e-mail valido",
    },
  };

  const t = messages[language] || messages.en;

  return z.object({
    email: z.string().min(1, t.emailRequired).email(t.emailInvalid),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });
};

export default function Newsletter() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const formSchema = getNewsletterFormSchema(language);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (data: NewsletterFormData) => {
      const response = await apiRequest("POST", "/api/newsletter", data);
      return response.json() as Promise<{ success: boolean; duplicate?: boolean; message?: string }>;
    },
    onSuccess: (result) => {
      const tToast = content[language] || content.en;
      if (result?.duplicate) {
        toast({
          title: tToast.toastDuplicateTitle,
          description: tToast.toastDuplicateDescription,
        });
        form.reset();
        return;
      }
      toast({
        title: tToast.toastSuccessTitle,
        description: tToast.toastSuccessDescription,
      });
      form.reset();
    },
    onError: () => {
      const tToast = content[language] || content.en;
      toast({
        title: tToast.toastErrorTitle,
        description: tToast.toastErrorDescription,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewsletterFormData) => {
    newsletterMutation.mutate(data);
  };

  const content = {
    en: {
      title: "Newsletter",
      subtitle: "Stay informed with the latest legal insights and firm updates",
      archivesTitle: "Past Newsletters",
      archivesSubtitle: "Access our previous editions and stay updated on our legal coverage.",
      archiveItem1Title: "Q4 2024 Legal Update",
      archiveItem1Date: "December 2024",
      archiveItem1Description: "Year-end review of significant legal developments in Mexico and key regulatory changes.",
      archiveItem2Title: "Q3 2024 Legal Update",
      archiveItem2Date: "September 2024",
      archiveItem2Description: "Analysis of tax reforms and corporate law amendments affecting businesses in Mexico.",
      archiveItem3Title: "Q2 2024 Legal Update",
      archiveItem3Date: "June 2024",
      archiveItem3Description: "Overview of energy sector regulations and environmental compliance requirements.",
      viewArchive: "View Newsletter",
      comingSoon: "Full archive coming soon",
      formTitle: "Subscribe to Our Newsletter",
      formSubtitle: "Join our mailing list to receive exclusive legal updates, industry insights, and firm news directly to your inbox.",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      firstNameLabel: "First Name (optional)",
      firstNamePlaceholder: "Enter your first name",
      lastNameLabel: "Last Name (optional)",
      lastNamePlaceholder: "Enter your last name",
      submit: "Subscribe",
      submitting: "Subscribing...",
      whatYouReceive: "What You'll Receive",
      benefit1Title: "Legal Updates",
      benefit1Description: "Stay current with important changes in Mexican law and regulations that may affect your business.",
      benefit2Title: "Industry Insights",
      benefit2Description: "In-depth analysis and commentary on legal developments across key sectors.",
      benefit3Title: "Event Invitations",
      benefit3Description: "Exclusive invitations to webinars, seminars, and networking events hosted by our firm.",
      benefit4Title: "Firm News",
      benefit4Description: "Learn about our latest achievements, new team members, and community involvement.",
      privacyNote: "We respect your privacy. Your information will never be shared with third parties. You can unsubscribe at any time.",
      frequency: "Newsletter Frequency",
      frequencyDescription: "Our newsletter is sent monthly, with occasional special editions for urgent legal developments.",
      toastDuplicateTitle: "Already subscribed",
      toastDuplicateDescription: "This email is already subscribed to our newsletter.",
      toastSuccessTitle: "Successfully subscribed!",
      toastSuccessDescription: "Thank you for subscribing to our newsletter.",
      toastErrorTitle: "Error",
      toastErrorDescription: "Failed to subscribe. Please try again.",
    },
    es: {
      title: "Boletines",
      subtitle: "Manténgase informado con los últimos insights legales y actualizaciones de la firma",
      archivesTitle: "Boletines Anteriores",
      archivesSubtitle: "Acceda a nuestras ediciones anteriores y manténgase informado sobre nuestra cobertura legal.",
      archiveItem1Title: "Actualización Legal Q4 2024",
      archiveItem1Date: "Diciembre 2024",
      archiveItem1Description: "Revisión de fin de año de los desarrollos legales significativos en México y cambios regulatorios clave.",
      archiveItem2Title: "Actualización Legal Q3 2024",
      archiveItem2Date: "Septiembre 2024",
      archiveItem2Description: "Análisis de reformas fiscales y enmiendas de derecho corporativo que afectan a empresas en México.",
      archiveItem3Title: "Actualización Legal Q2 2024",
      archiveItem3Date: "Junio 2024",
      archiveItem3Description: "Visión general de regulaciones del sector energético y requisitos de cumplimiento ambiental.",
      viewArchive: "Ver Boletín",
      comingSoon: "Archivo completo próximamente",
      formTitle: "Suscríbase a Nuestro Boletín",
      formSubtitle: "Únase a nuestra lista de correo para recibir actualizaciones legales exclusivas, insights de la industria y noticias de la firma directamente en su bandeja de entrada.",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ingrese su correo electrónico",
      firstNameLabel: "Nombre (opcional)",
      firstNamePlaceholder: "Ingrese su nombre",
      lastNameLabel: "Apellido (opcional)",
      lastNamePlaceholder: "Ingrese su apellido",
      submit: "Suscribirse",
      submitting: "Suscribiendo...",
      whatYouReceive: "Lo Que Recibirá",
      benefit1Title: "Actualizaciones Legales",
      benefit1Description: "Manténgase al día con cambios importantes en la ley y regulaciones mexicanas que pueden afectar su negocio.",
      benefit2Title: "Insights de la Industria",
      benefit2Description: "Análisis profundo y comentarios sobre desarrollos legales en sectores clave.",
      benefit3Title: "Invitaciones a Eventos",
      benefit3Description: "Invitaciones exclusivas a webinars, seminarios y eventos de networking organizados por nuestra firma.",
      benefit4Title: "Noticias de la Firma",
      benefit4Description: "Conozca nuestros últimos logros, nuevos miembros del equipo e involucramiento comunitario.",
      privacyNote: "Respetamos su privacidad. Su información nunca será compartida con terceros. Puede darse de baja en cualquier momento.",
      frequency: "Frecuencia del Boletín",
      frequencyDescription: "Nuestro boletín se envía mensualmente, con ediciones especiales ocasionales para desarrollos legales urgentes.",
      toastDuplicateTitle: "Ya estás suscrito",
      toastDuplicateDescription: "Este correo ya se encuentra registrado en nuestro boletín.",
      toastSuccessTitle: "¡Suscripción exitosa!",
      toastSuccessDescription: "Gracias por suscribirse a nuestro boletín.",
      toastErrorTitle: "Error",
      toastErrorDescription: "No se pudo completar la suscripción. Por favor intente de nuevo.",
    },
    de: {
      title: "Newsletter",
      subtitle: "Bleiben Sie über juristische Entwicklungen informiert",
      archivesTitle: "Frühere Newsletter",
      archivesSubtitle: "Zugriff auf unsere früheren Ausgaben und bleiben Sie über unsere rechtliche Berichterstattung auf dem Laufenden.",
      archiveItem1Title: "Q4 2024 Rechtliches Update",
      archiveItem1Date: "Dezember 2024",
      archiveItem1Description: "Jahresrückblick auf bedeutende rechtliche Entwicklungen in Mexiko und wichtige regulatorische Änderungen.",
      archiveItem2Title: "Q3 2024 Rechtliches Update",
      archiveItem2Date: "September 2024",
      archiveItem2Description: "Analyse von Steuerreformen und Änderungen des Gesellschaftsrechts, die Unternehmen in Mexiko betreffen.",
      archiveItem3Title: "Q2 2024 Rechtliches Update",
      archiveItem3Date: "Juni 2024",
      archiveItem3Description: "Überblick über Vorschriften im Energiesektor und Anforderungen zur Umwelt-Compliance.",
      viewArchive: "Newsletter ansehen",
      comingSoon: "Vollständiges Archiv kommt bald",
      formTitle: "Abonnieren Sie unseren Newsletter",
      formSubtitle: "Treten Sie unserer Mailingliste bei, um exklusive rechtliche Updates, Brancheneinblicke und Firmennachrichten direkt in Ihren Posteingang zu erhalten.",
      emailLabel: "E-Mail-Adresse",
      emailPlaceholder: "Geben Sie Ihre E-Mail-Adresse ein",
      firstNameLabel: "Vorname (optional)",
      firstNamePlaceholder: "Geben Sie Ihren Vornamen ein",
      lastNameLabel: "Nachname (optional)",
      lastNamePlaceholder: "Geben Sie Ihren Nachnamen ein",
      submit: "Abonnieren",
      submitting: "Wird abonniert...",
      whatYouReceive: "Was Sie erhalten werden",
      benefit1Title: "Rechtliche Updates",
      benefit1Description: "Bleiben Sie über wichtige Änderungen im mexikanischen Recht und Vorschriften auf dem Laufenden, die Ihr Geschäft betreffen könnten.",
      benefit2Title: "Brancheneinblicke",
      benefit2Description: "Tiefgehende Analysen und Kommentare zu rechtlichen Entwicklungen in Schlüsselbranchen.",
      benefit3Title: "Veranstaltungseinladungen",
      benefit3Description: "Exklusive Einladungen zu Webinaren, Seminaren und Networking-Veranstaltungen unserer Kanzlei.",
      benefit4Title: "Firmennachrichten",
      benefit4Description: "Erfahren Sie von unseren neuesten Erfolgen, neuen Teammitgliedern und unserem gesellschaftlichen Engagement.",
      privacyNote: "Wir respektieren Ihre Privatsphäre. Ihre Daten werden niemals an Dritte weitergegeben. Sie können sich jederzeit abmelden.",
      frequency: "Newsletter-Häufigkeit",
      frequencyDescription: "Unser Newsletter wird monatlich versendet, mit gelegentlichen Sonderausgaben für dringende rechtliche Entwicklungen.",
      toastDuplicateTitle: "Bereits abonniert",
      toastDuplicateDescription: "Diese E-Mail-Adresse ist bereits für unseren Newsletter registriert.",
      toastSuccessTitle: "Erfolgreich abonniert!",
      toastSuccessDescription: "Vielen Dank für Ihr Abonnement unseres Newsletters.",
      toastErrorTitle: "Fehler",
      toastErrorDescription: "Das Abonnement konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
    },
    zh: {
      title: "电子通讯",
      subtitle: "获取法律动态资讯",
      archivesTitle: "往期通讯",
      archivesSubtitle: "访问我们的往期版本，了解我们的法律报道。",
      archiveItem1Title: "2024年第四季度法律动态",
      archiveItem1Date: "2024年12月",
      archiveItem1Description: "墨西哥重要法律发展及关键监管变化的年终回顾。",
      archiveItem2Title: "2024年第三季度法律动态",
      archiveItem2Date: "2024年9月",
      archiveItem2Description: "影响墨西哥企业的税收改革和公司法修订分析。",
      archiveItem3Title: "2024年第二季度法律动态",
      archiveItem3Date: "2024年6月",
      archiveItem3Description: "能源行业法规和环境合规要求概述。",
      viewArchive: "查看通讯",
      comingSoon: "完整档案即将推出",
      formTitle: "订阅我们的通讯",
      formSubtitle: "加入我们的邮件列表，直接在收件箱中接收独家法律更新、行业见解和公司新闻。",
      emailLabel: "电子邮件地址",
      emailPlaceholder: "输入您的电子邮件地址",
      firstNameLabel: "名字（可选）",
      firstNamePlaceholder: "输入您的名字",
      lastNameLabel: "姓氏（可选）",
      lastNamePlaceholder: "输入您的姓氏",
      submit: "订阅",
      submitting: "订阅中...",
      whatYouReceive: "您将收到的内容",
      benefit1Title: "法律动态",
      benefit1Description: "了解可能影响您业务的墨西哥法律和法规的重要变化。",
      benefit2Title: "行业见解",
      benefit2Description: "对关键行业法律发展的深入分析和评论。",
      benefit3Title: "活动邀请",
      benefit3Description: "我们律所主办的网络研讨会、研讨会和社交活动的独家邀请。",
      benefit4Title: "公司新闻",
      benefit4Description: "了解我们的最新成就、新团队成员和社区参与。",
      privacyNote: "我们尊重您的隐私。您的信息绝不会与第三方共享。您可以随时取消订阅。",
      frequency: "通讯频率",
      frequencyDescription: "我们的通讯每月发送一次，偶尔会为紧急法律发展推出特别版。",
      toastDuplicateTitle: "您已订阅",
      toastDuplicateDescription: "此电子邮件已订阅我们的通讯。",
      toastSuccessTitle: "订阅成功！",
      toastSuccessDescription: "感谢您订阅我们的通讯。",
      toastErrorTitle: "错误",
      toastErrorDescription: "订阅未能完成。请重试。",
    },
    ko: {
      title: "뉴스레터",
      subtitle: "최신 법률 동향과 회사 소식을 받아보세요",
      archivesTitle: "이전 뉴스레터",
      archivesSubtitle: "이전 호에 접근하여 법률 보도를 확인하세요.",
      archiveItem1Title: "2024년 4분기 법률 업데이트",
      archiveItem1Date: "2024년 12월",
      archiveItem1Description: "멕시코의 중요한 법률 발전과 주요 규제 변화에 대한 연말 검토.",
      archiveItem2Title: "2024년 3분기 법률 업데이트",
      archiveItem2Date: "2024년 9월",
      archiveItem2Description: "멕시코 기업에 영향을 미치는 세제 개혁 및 회사법 개정 분석.",
      archiveItem3Title: "2024년 2분기 법률 업데이트",
      archiveItem3Date: "2024년 6월",
      archiveItem3Description: "에너지 부문 규정 및 환경 준수 요구 사항 개요.",
      viewArchive: "뉴스레터 보기",
      comingSoon: "전체 아카이브 곧 제공",
      formTitle: "뉴스레터 구독",
      formSubtitle: "메일링 리스트에 가입하여 독점 법률 업데이트, 업계 통찰력 및 회사 소식을 받아보세요.",
      emailLabel: "이메일 주소",
      emailPlaceholder: "이메일 주소를 입력하세요",
      firstNameLabel: "이름 (선택사항)",
      firstNamePlaceholder: "이름을 입력하세요",
      lastNameLabel: "성 (선택사항)",
      lastNamePlaceholder: "성을 입력하세요",
      submit: "구독",
      submitting: "구독 중...",
      whatYouReceive: "받으실 내용",
      benefit1Title: "법률 업데이트",
      benefit1Description: "비즈니스에 영향을 미칠 수 있는 멕시코 법률 및 규정의 중요한 변경 사항을 파악하세요.",
      benefit2Title: "업계 통찰력",
      benefit2Description: "주요 분야의 법률 발전에 대한 심층 분석과 논평.",
      benefit3Title: "이벤트 초대",
      benefit3Description: "당사가 주최하는 웨비나, 세미나 및 네트워킹 이벤트에 대한 독점 초대.",
      benefit4Title: "회사 소식",
      benefit4Description: "최신 성과, 새 팀원 및 커뮤니티 참여에 대해 알아보세요.",
      privacyNote: "귀하의 개인정보를 존중합니다. 귀하의 정보는 제3자와 절대 공유되지 않습니다. 언제든지 구독을 취소할 수 있습니다.",
      frequency: "뉴스레터 빈도",
      frequencyDescription: "뉴스레터는 매월 발송되며, 긴급한 법률 발전에 대한 특별판이 가끔 발행됩니다.",
      toastDuplicateTitle: "이미 구독 중입니다",
      toastDuplicateDescription: "이 이메일은 이미 뉴스레터에 등록되어 있습니다.",
      toastSuccessTitle: "구독 완료!",
      toastSuccessDescription: "뉴스레터를 구독해 주셔서 감사합니다.",
      toastErrorTitle: "오류",
      toastErrorDescription: "구독을 완료하지 못했습니다. 다시 시도해 주세요.",
    },
    ja: {
      title: "ニュースレター",
      subtitle: "最新の法律動向とファーム情報をお届けします",
      archivesTitle: "過去のニュースレター",
      archivesSubtitle: "過去の号にアクセスして、法律関連の報道をご覧ください。",
      archiveItem1Title: "2024年第4四半期 法律アップデート",
      archiveItem1Date: "2024年12月",
      archiveItem1Description: "メキシコの重要な法律動向と主要な規制変更の年末レビュー。",
      archiveItem2Title: "2024年第3四半期 法律アップデート",
      archiveItem2Date: "2024年9月",
      archiveItem2Description: "メキシコのビジネスに影響を与える税制改革と会社法改正の分析。",
      archiveItem3Title: "2024年第2四半期 法律アップデート",
      archiveItem3Date: "2024年6月",
      archiveItem3Description: "エネルギーセクター規制と環境コンプライアンス要件の概要。",
      viewArchive: "ニュースレターを見る",
      comingSoon: "完全なアーカイブ近日公開",
      formTitle: "ニュースレターを購読する",
      formSubtitle: "メーリングリストに登録して、法律の最新情報、業界インサイト、ファームニュースを直接受信箱にお届けします。",
      emailLabel: "メールアドレス",
      emailPlaceholder: "メールアドレスを入力",
      firstNameLabel: "名（任意）",
      firstNamePlaceholder: "名前を入力",
      lastNameLabel: "姓（任意）",
      lastNamePlaceholder: "姓を入力",
      submit: "購読",
      submitting: "購読中...",
      whatYouReceive: "お届けする内容",
      benefit1Title: "法律アップデート",
      benefit1Description: "ビジネスに影響を与える可能性のあるメキシコの法律・規制の重要な変更について最新情報をお届けします。",
      benefit2Title: "業界インサイト",
      benefit2Description: "主要セクターの法律動向に関する詳細な分析と解説。",
      benefit3Title: "イベント招待",
      benefit3Description: "当ファームが主催するウェビナー、セミナー、ネットワーキングイベントへの独占招待。",
      benefit4Title: "ファームニュース",
      benefit4Description: "最新の実績、新しいチームメンバー、コミュニティへの参加についてご紹介します。",
      privacyNote: "プライバシーを尊重します。お客様の情報は第三者と共有されることはありません。いつでも購読解除できます。",
      frequency: "ニュースレターの頻度",
      frequencyDescription: "ニュースレターは毎月配信され、緊急の法律動向については臨時特別号を発行することがあります。",
      toastDuplicateTitle: "すでに購読済みです",
      toastDuplicateDescription: "このメールアドレスはすでにニュースレターに登録されています。",
      toastSuccessTitle: "購読が完了しました！",
      toastSuccessDescription: "ニュースレターをご購読いただきありがとうございます。",
      toastErrorTitle: "エラー",
      toastErrorDescription: "購読を完了できませんでした。もう一度お試しください。",
    },
    ar: {
      title: "النشرة الإخبارية",
      subtitle: "ابق على اطلاع بأحدث الرؤى القانونية وتحديثات المكتب",
      archivesTitle: "النشرات الإخبارية السابقة",
      archivesSubtitle: "الوصول إلى إصداراتنا السابقة ومتابعة تغطيتنا القانونية.",
      archiveItem1Title: "تحديث قانوني للربع الرابع 2024",
      archiveItem1Date: "ديسمبر 2024",
      archiveItem1Description: "مراجعة نهاية العام للتطورات القانونية المهمة في المكسيك والتغييرات التنظيمية الرئيسية.",
      archiveItem2Title: "تحديث قانوني للربع الثالث 2024",
      archiveItem2Date: "سبتمبر 2024",
      archiveItem2Description: "تحليل الإصلاحات الضريبية وتعديلات قانون الشركات التي تؤثر على الأعمال في المكسيك.",
      archiveItem3Title: "تحديث قانوني للربع الثاني 2024",
      archiveItem3Date: "يونيو 2024",
      archiveItem3Description: "نظرة عامة على لوائح قطاع الطاقة ومتطلبات الامتثال البيئي.",
      viewArchive: "عرض النشرة الإخبارية",
      comingSoon: "الأرشيف الكامل قريباً",
      formTitle: "اشترك في نشرتنا الإخبارية",
      formSubtitle: "انضم إلى قائمتنا البريدية لتلقي التحديثات القانونية الحصرية ورؤى الصناعة وأخبار المكتب مباشرة في بريدك الإلكتروني.",
      emailLabel: "عنوان البريد الإلكتروني",
      emailPlaceholder: "أدخل عنوان بريدك الإلكتروني",
      firstNameLabel: "الاسم الأول (اختياري)",
      firstNamePlaceholder: "أدخل اسمك الأول",
      lastNameLabel: "اسم العائلة (اختياري)",
      lastNamePlaceholder: "أدخل اسم عائلتك",
      submit: "اشترك",
      submitting: "جارٍ الاشتراك...",
      whatYouReceive: "ما ستتلقاه",
      benefit1Title: "التحديثات القانونية",
      benefit1Description: "ابق على اطلاع بالتغييرات المهمة في القانون واللوائح المكسيكية التي قد تؤثر على عملك.",
      benefit2Title: "رؤى الصناعة",
      benefit2Description: "تحليل معمق وتعليقات حول التطورات القانونية في القطاعات الرئيسية.",
      benefit3Title: "دعوات الفعاليات",
      benefit3Description: "دعوات حصرية للندوات عبر الإنترنت والمؤتمرات وفعاليات التواصل التي يستضيفها مكتبنا.",
      benefit4Title: "أخبار المكتب",
      benefit4Description: "تعرف على أحدث إنجازاتنا وأعضاء الفريق الجدد ومشاركتنا المجتمعية.",
      privacyNote: "نحترم خصوصيتك. لن تتم مشاركة معلوماتك مع أطراف ثالثة أبداً. يمكنك إلغاء الاشتراك في أي وقت.",
      frequency: "تكرار النشرة الإخبارية",
      frequencyDescription: "يتم إرسال نشرتنا الإخبارية شهرياً، مع إصدارات خاصة عرضية للتطورات القانونية العاجلة.",
      toastDuplicateTitle: "أنت مشترك بالفعل",
      toastDuplicateDescription: "هذا البريد الإلكتروني مسجّل بالفعل في نشرتنا الإخبارية.",
      toastSuccessTitle: "تم الاشتراك بنجاح!",
      toastSuccessDescription: "شكراً لاشتراكك في نشرتنا الإخبارية.",
      toastErrorTitle: "خطأ",
      toastErrorDescription: "تعذّر إتمام الاشتراك. يرجى المحاولة مرة أخرى.",
    },
    ru: {
      title: "Рассылка",
      subtitle: "Будьте в курсе последних юридических новостей и обновлений фирмы",
      archivesTitle: "Предыдущие рассылки",
      archivesSubtitle: "Доступ к нашим предыдущим выпускам и актуальная информация о правовом освещении.",
      archiveItem1Title: "Правовое обновление за 4 квартал 2024",
      archiveItem1Date: "Декабрь 2024",
      archiveItem1Description: "Годовой обзор значительных правовых изменений в Мексике и ключевых регуляторных изменений.",
      archiveItem2Title: "Правовое обновление за 3 квартал 2024",
      archiveItem2Date: "Сентябрь 2024",
      archiveItem2Description: "Анализ налоговых реформ и поправок к корпоративному законодательству, затрагивающих бизнес в Мексике.",
      archiveItem3Title: "Правовое обновление за 2 квартал 2024",
      archiveItem3Date: "Июнь 2024",
      archiveItem3Description: "Обзор регулирования энергетического сектора и требований экологического соответствия.",
      viewArchive: "Просмотреть рассылку",
      comingSoon: "Полный архив скоро появится",
      formTitle: "Подпишитесь на нашу рассылку",
      formSubtitle: "Присоединяйтесь к нашему списку рассылки для получения эксклюзивных правовых обновлений, отраслевых аналитических материалов и новостей фирмы.",
      emailLabel: "Адрес электронной почты",
      emailPlaceholder: "Введите ваш адрес электронной почты",
      firstNameLabel: "Имя (необязательно)",
      firstNamePlaceholder: "Введите ваше имя",
      lastNameLabel: "Фамилия (необязательно)",
      lastNamePlaceholder: "Введите вашу фамилию",
      submit: "Подписаться",
      submitting: "Подписка...",
      whatYouReceive: "Что вы получите",
      benefit1Title: "Правовые обновления",
      benefit1Description: "Будьте в курсе важных изменений в мексиканском законодательстве и регулировании, которые могут повлиять на ваш бизнес.",
      benefit2Title: "Отраслевая аналитика",
      benefit2Description: "Углублённый анализ и комментарии по правовым изменениям в ключевых секторах.",
      benefit3Title: "Приглашения на мероприятия",
      benefit3Description: "Эксклюзивные приглашения на вебинары, семинары и сетевые мероприятия нашей фирмы.",
      benefit4Title: "Новости фирмы",
      benefit4Description: "Узнайте о наших последних достижениях, новых членах команды и участии в общественной деятельности.",
      privacyNote: "Мы уважаем вашу конфиденциальность. Ваша информация никогда не будет передана третьим лицам. Вы можете отписаться в любое время.",
      frequency: "Частота рассылки",
      frequencyDescription: "Наша рассылка отправляется ежемесячно, со случайными специальными выпусками для срочных правовых изменений.",
      toastDuplicateTitle: "Вы уже подписаны",
      toastDuplicateDescription: "Этот адрес электронной почты уже зарегистрирован в нашей рассылке.",
      toastSuccessTitle: "Подписка оформлена!",
      toastSuccessDescription: "Благодарим вас за подписку на нашу рассылку.",
      toastErrorTitle: "Ошибка",
      toastErrorDescription: "Не удалось оформить подписку. Пожалуйста, попробуйте снова.",
    },
    fr: {
      title: "Newsletter",
      subtitle: "Restez informé des dernières actualités juridiques et mises à jour du cabinet",
      archivesTitle: "Newsletters précédentes",
      archivesSubtitle: "Accédez à nos éditions précédentes et restez informé de notre couverture juridique.",
      archiveItem1Title: "Mise à jour juridique T4 2024",
      archiveItem1Date: "Décembre 2024",
      archiveItem1Description: "Bilan de fin d'année des développements juridiques significatifs au Mexique et des changements réglementaires clés.",
      archiveItem2Title: "Mise à jour juridique T3 2024",
      archiveItem2Date: "Septembre 2024",
      archiveItem2Description: "Analyse des réformes fiscales et des amendements au droit des sociétés affectant les entreprises au Mexique.",
      archiveItem3Title: "Mise à jour juridique T2 2024",
      archiveItem3Date: "Juin 2024",
      archiveItem3Description: "Aperçu des réglementations du secteur énergétique et des exigences de conformité environnementale.",
      viewArchive: "Voir la newsletter",
      comingSoon: "Archives complètes bientôt disponibles",
      formTitle: "Abonnez-vous à notre newsletter",
      formSubtitle: "Rejoignez notre liste de diffusion pour recevoir des mises à jour juridiques exclusives, des analyses sectorielles et des nouvelles du cabinet.",
      emailLabel: "Adresse e-mail",
      emailPlaceholder: "Entrez votre adresse e-mail",
      firstNameLabel: "Prénom (optionnel)",
      firstNamePlaceholder: "Entrez votre prénom",
      lastNameLabel: "Nom (optionnel)",
      lastNamePlaceholder: "Entrez votre nom",
      submit: "S'abonner",
      submitting: "Abonnement en cours...",
      whatYouReceive: "Ce que vous recevrez",
      benefit1Title: "Mises à jour juridiques",
      benefit1Description: "Restez informé des changements importants dans la loi et la réglementation mexicaines qui peuvent affecter votre entreprise.",
      benefit2Title: "Analyses sectorielles",
      benefit2Description: "Analyses approfondies et commentaires sur les développements juridiques dans les secteurs clés.",
      benefit3Title: "Invitations aux événements",
      benefit3Description: "Invitations exclusives aux webinaires, séminaires et événements de networking organisés par notre cabinet.",
      benefit4Title: "Actualités du cabinet",
      benefit4Description: "Découvrez nos dernières réalisations, les nouveaux membres de l'équipe et notre engagement communautaire.",
      privacyNote: "Nous respectons votre vie privée. Vos informations ne seront jamais partagées avec des tiers. Vous pouvez vous désabonner à tout moment.",
      frequency: "Fréquence de la newsletter",
      frequencyDescription: "Notre newsletter est envoyée mensuellement, avec des éditions spéciales occasionnelles pour les développements juridiques urgents.",
      toastDuplicateTitle: "Déjà abonné",
      toastDuplicateDescription: "Cette adresse e-mail est déjà inscrite à notre newsletter.",
      toastSuccessTitle: "Abonnement réussi !",
      toastSuccessDescription: "Merci de vous être abonné à notre newsletter.",
      toastErrorTitle: "Erreur",
      toastErrorDescription: "L'abonnement n'a pas pu être effectué. Veuillez réessayer.",
    },
    it: {
      title: "Newsletter",
      subtitle: "Rimani informato sugli ultimi aggiornamenti legali e novità dello studio",
      archivesTitle: "Newsletter precedenti",
      archivesSubtitle: "Accedi alle nostre edizioni precedenti e rimani aggiornato sulla nostra copertura legale.",
      archiveItem1Title: "Aggiornamento legale Q4 2024",
      archiveItem1Date: "Dicembre 2024",
      archiveItem1Description: "Riepilogo di fine anno degli sviluppi legali significativi in Messico e dei principali cambiamenti normativi.",
      archiveItem2Title: "Aggiornamento legale Q3 2024",
      archiveItem2Date: "Settembre 2024",
      archiveItem2Description: "Analisi delle riforme fiscali e delle modifiche al diritto societario che interessano le imprese in Messico.",
      archiveItem3Title: "Aggiornamento legale Q2 2024",
      archiveItem3Date: "Giugno 2024",
      archiveItem3Description: "Panoramica delle normative del settore energetico e dei requisiti di conformità ambientale.",
      viewArchive: "Visualizza newsletter",
      comingSoon: "Archivio completo in arrivo",
      formTitle: "Iscriviti alla nostra newsletter",
      formSubtitle: "Unisciti alla nostra mailing list per ricevere aggiornamenti legali esclusivi, approfondimenti del settore e notizie dello studio.",
      emailLabel: "Indirizzo e-mail",
      emailPlaceholder: "Inserisci il tuo indirizzo e-mail",
      firstNameLabel: "Nome (opzionale)",
      firstNamePlaceholder: "Inserisci il tuo nome",
      lastNameLabel: "Cognome (opzionale)",
      lastNamePlaceholder: "Inserisci il tuo cognome",
      submit: "Iscriviti",
      submitting: "Iscrizione in corso...",
      whatYouReceive: "Cosa riceverai",
      benefit1Title: "Aggiornamenti legali",
      benefit1Description: "Rimani aggiornato sui cambiamenti importanti nella legge e nelle normative messicane che potrebbero influenzare la tua attività.",
      benefit2Title: "Approfondimenti di settore",
      benefit2Description: "Analisi approfondite e commenti sugli sviluppi legali nei settori chiave.",
      benefit3Title: "Inviti agli eventi",
      benefit3Description: "Inviti esclusivi a webinar, seminari ed eventi di networking organizzati dal nostro studio.",
      benefit4Title: "Notizie dello studio",
      benefit4Description: "Scopri i nostri ultimi successi, i nuovi membri del team e il coinvolgimento nella comunità.",
      privacyNote: "Rispettiamo la tua privacy. Le tue informazioni non saranno mai condivise con terzi. Puoi annullare l'iscrizione in qualsiasi momento.",
      frequency: "Frequenza della newsletter",
      frequencyDescription: "La nostra newsletter viene inviata mensilmente, con edizioni speciali occasionali per sviluppi legali urgenti.",
      toastDuplicateTitle: "Già iscritto",
      toastDuplicateDescription: "Questa e-mail è già iscritta alla nostra newsletter.",
      toastSuccessTitle: "Iscrizione riuscita!",
      toastSuccessDescription: "Grazie per esserti iscritto alla nostra newsletter.",
      toastErrorTitle: "Errore",
      toastErrorDescription: "Non è stato possibile completare l'iscrizione. Riprova.",
    },
  };

  const t = content[language] || content.en;

  const benefits = [
    {
      icon: FileText,
      title: t.benefit1Title,
      description: t.benefit1Description,
    },
    {
      icon: Briefcase,
      title: t.benefit2Title,
      description: t.benefit2Description,
    },
    {
      icon: Calendar,
      title: t.benefit3Title,
      description: t.benefit3Description,
    },
    {
      icon: Bell,
      title: t.benefit4Title,
      description: t.benefit4Description,
    },
  ];

  return (
    <div data-testid="page-newsletter" className="vw-old">
      <SEOHead page="newsletter" language={language} />

      <PageHero
        eyebrow="Von Wobeser y Sierra"
        title={t.title}
        subtitle={t.subtitle}
        data-testid="section-newsletter-hero"
      />

      {/* Formulario de suscripción + beneficios */}
      <Section tone="white" data-testid="section-newsletter-form">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle data-testid="text-form-title">{t.formTitle}</SectionTitle>
            <p className="mb-8 font-sans text-vw-gray" data-testid="text-form-subtitle">
              {t.formSubtitle}
            </p>

            {/* TODO(W7): reCAPTCHA v3 — añadir token al submit cuando haya keys. */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              data-testid="form-newsletter"
              noValidate
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <FirmLabel htmlFor="nl-firstName">{t.firstNameLabel}</FirmLabel>
                  <FirmInput
                    id="nl-firstName"
                    placeholder={t.firstNamePlaceholder}
                    data-testid="input-firstname"
                    {...form.register("firstName")}
                  />
                </div>
                <div>
                  <FirmLabel htmlFor="nl-lastName">{t.lastNameLabel}</FirmLabel>
                  <FirmInput
                    id="nl-lastName"
                    placeholder={t.lastNamePlaceholder}
                    data-testid="input-lastname"
                    {...form.register("lastName")}
                  />
                </div>
              </div>

              <div>
                <FirmLabel htmlFor="nl-email">{t.emailLabel}</FirmLabel>
                <FirmInput
                  id="nl-email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  invalid={!!form.formState.errors.email}
                  data-testid="input-email"
                  {...form.register("email")}
                />
                <FirmError message={form.formState.errors.email?.message} />
              </div>

              <FirmSubmit disabled={newsletterMutation.isPending} data-testid="button-subscribe">
                {newsletterMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {t.submit}
                  </>
                )}
              </FirmSubmit>

              <p className="font-sans text-sm text-vw-gray" data-testid="text-privacy-note">
                {t.privacyNote}
              </p>
            </form>

            <div className="mt-8 border border-vw-graylight bg-white p-6" data-testid="card-frequency">
              <div className="mb-2 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-vw-red" aria-hidden="true" />
                <h3 className="font-serif text-lg text-vw-black" data-testid="text-frequency-title">
                  {t.frequency}
                </h3>
              </div>
              <p className="font-sans text-sm text-vw-gray" data-testid="text-frequency-description">
                {t.frequencyDescription}
              </p>
            </div>
          </div>

          <div>
            <SectionTitle data-testid="text-benefits-title">{t.whatYouReceive}</SectionTitle>
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <FeatureCard
                  key={index}
                  icon={benefit.icon}
                  title={benefit.title}
                  data-testid={`card-benefit-${index}`}
                >
                  {benefit.description}
                </FeatureCard>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Boletines anteriores */}
      <Section tone="gray" data-testid="section-newsletter-archives">
        <div className="mb-10 flex items-center gap-3">
          <Archive className="h-7 w-7 text-vw-red" aria-hidden="true" />
          <SectionTitle className="mb-0 border-b-0" data-testid="text-archives-title">
            {t.archivesTitle}
          </SectionTitle>
        </div>
        <p className="mb-10 max-w-2xl font-sans text-vw-gray" data-testid="text-archives-subtitle">
          {t.archivesSubtitle}
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { title: t.archiveItem1Title, date: t.archiveItem1Date, description: t.archiveItem1Description },
            { title: t.archiveItem2Title, date: t.archiveItem2Date, description: t.archiveItem2Description },
            { title: t.archiveItem3Title, date: t.archiveItem3Date, description: t.archiveItem3Description },
          ].map((archive, index) => (
            <div
              key={index}
              className="flex h-full flex-col border border-vw-graylight bg-white p-6"
              data-testid={`card-archive-${index}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-vw-red" aria-hidden="true" />
                <span className="vw-label text-[11px] text-vw-red" data-testid={`text-archive-date-${index}`}>
                  {archive.date}
                </span>
              </div>
              <h3 className="mb-2 font-serif text-lg text-vw-black" data-testid={`text-archive-title-${index}`}>
                {archive.title}
              </h3>
              <p className="mb-4 font-sans text-sm text-vw-gray" data-testid={`text-archive-description-${index}`}>
                {archive.description}
              </p>
              <a
                href={`mailto:info@vonwobeser.com?subject=${encodeURIComponent(language === "es" ? `Solicitud de Newsletter: ${archive.title}` : `Newsletter Request: ${archive.title}`)}`}
                className="vw-label mt-auto inline-flex items-center gap-2 text-[11px] text-vw-red transition-colors hover:text-vw-black"
                data-testid={`button-archive-view-${index}`}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t.viewArchive}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center font-sans text-sm text-vw-gray" data-testid="text-archives-coming-soon">
          {t.comingSoon}
        </p>
      </Section>
    </div>
  );
}
