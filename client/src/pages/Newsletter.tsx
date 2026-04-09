import { motion } from "framer-motion";
import { Mail, Send, Loader2, CheckCircle, Bell, FileText, Calendar, Briefcase, Archive, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsletterFormData {
  email: string;
  firstName?: string;
  lastName?: string;
}

const getNewsletterFormSchema = (language: "es" | "en") => {
  const messages = {
    en: {
      emailRequired: "Email is required",
      emailInvalid: "Please enter a valid email address",
    },
    es: {
      emailRequired: "El correo electrónico es requerido",
      emailInvalid: "Por favor ingrese una dirección de correo válida",
    },
  };

  const t = messages[language];

  return z.object({
    email: z.string().min(1, t.emailRequired).email(t.emailInvalid),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });
};

export default function Newsletter() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const formLanguage = language === "es" ? "es" : "en";
  const formSchema = getNewsletterFormSchema(formLanguage);

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
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "¡Suscripción exitosa!" : "Successfully subscribed!",
        description: language === "es" 
          ? "Gracias por suscribirse a nuestro boletín." 
          : "Thank you for subscribing to our newsletter.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo completar la suscripción. Por favor intente de nuevo." 
          : "Failed to subscribe. Please try again.",
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
    <div className="min-h-screen bg-background" data-testid="page-newsletter">
      <SEOHead page="newsletter" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-newsletter-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-3xl md:text-4xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]"
              data-testid="text-newsletter-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-newsletter-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              data-testid="section-newsletter-form"
            >
              <Card className="rounded-md border border-border">
                <CardContent className="p-8">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <h2 
                        className="text-xl font-heading font-light text-[#AA1A2E] dark:text-white uppercase tracking-[0.12em]"
                        data-testid="text-form-title"
                      >
                        {t.formTitle}
                      </h2>
                    </div>
                    <p 
                      className="text-muted-foreground"
                      data-testid="text-form-subtitle"
                    >
                      {t.formSubtitle}
                    </p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-newsletter">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-firstname">{t.firstNameLabel}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.firstNamePlaceholder} 
                                  {...field} 
                                  data-testid="input-firstname"
                                />
                              </FormControl>
                              <FormMessage data-testid="error-firstname" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-lastname">{t.lastNameLabel}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.lastNamePlaceholder} 
                                  {...field} 
                                  data-testid="input-lastname"
                                />
                              </FormControl>
                              <FormMessage data-testid="error-lastname" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-email">{t.emailLabel}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder={t.emailPlaceholder} 
                                {...field} 
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage data-testid="error-email" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full rounded-md bg-[#AA1A2E] hover:bg-[#8A1525]"
                        disabled={newsletterMutation.isPending}
                        data-testid="button-subscribe"
                      >
                        {newsletterMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t.submitting}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t.submit}
                          </>
                        )}
                      </Button>

                      <p 
                        className="text-sm text-muted-foreground text-center"
                        data-testid="text-privacy-note"
                      >
                        {t.privacyNote}
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8"
              >
                <Card className="rounded-md border border-border bg-muted" data-testid="card-frequency">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 
                        className="text-lg font-heading font-light text-foreground"
                        data-testid="text-frequency-title"
                      >
                        {t.frequency}
                      </h3>
                    </div>
                    <p 
                      className="text-sm text-muted-foreground"
                      data-testid="text-frequency-description"
                    >
                      {t.frequencyDescription}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 
                className="text-xl font-heading font-light text-[#AA1A2E] dark:text-white mb-6 uppercase tracking-[0.12em]"
                data-testid="text-benefits-title"
              >
                {t.whatYouReceive}
              </h2>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  >
                    <Card 
                      className="rounded-md border border-border"
                      data-testid={`card-benefit-${index}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <benefit.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 
                              className="font-semibold text-foreground mb-1"
                              data-testid={`text-benefit-title-${index}`}
                            >
                              {benefit.title}
                            </h3>
                            <p 
                              className="text-sm text-muted-foreground"
                              data-testid={`text-benefit-description-${index}`}
                            >
                              {benefit.description}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
            data-testid="section-newsletter-archives"
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Archive className="w-8 h-8 text-primary" />
                <h2 
                  className="text-xl font-heading font-light text-[#AA1A2E] dark:text-white uppercase tracking-[0.12em]"
                  data-testid="text-archives-title"
                >
                  {t.archivesTitle}
                </h2>
              </div>
              <p 
                className="text-muted-foreground max-w-2xl mx-auto"
                data-testid="text-archives-subtitle"
              >
                {t.archivesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: t.archiveItem1Title, date: t.archiveItem1Date, description: t.archiveItem1Description },
                { title: t.archiveItem2Title, date: t.archiveItem2Date, description: t.archiveItem2Description },
                { title: t.archiveItem3Title, date: t.archiveItem3Date, description: t.archiveItem3Description },
              ].map((archive, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  <Card 
                    className="rounded-md border border-border h-full"
                    data-testid={`card-archive-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <span 
                          className="text-sm text-primary font-medium"
                          data-testid={`text-archive-date-${index}`}
                        >
                          {archive.date}
                        </span>
                      </div>
                      <h3 
                        className="font-semibold text-foreground mb-2"
                        data-testid={`text-archive-title-${index}`}
                      >
                        {archive.title}
                      </h3>
                      <p 
                        className="text-sm text-muted-foreground mb-4"
                        data-testid={`text-archive-description-${index}`}
                      >
                        {archive.description}
                      </p>
                      <a 
                        href={`mailto:info@vonwobeser.com?subject=${encodeURIComponent(language === 'es' ? `Solicitud de Newsletter: ${archive.title}` : `Newsletter Request: ${archive.title}`)}`}
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-[#8A1525] transition-colors"
                        data-testid={`button-archive-view-${index}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t.viewArchive}
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p 
              className="text-center text-sm text-muted-foreground mt-8"
              data-testid="text-archives-coming-soon"
            >
              {t.comingSoon}
            </p>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
