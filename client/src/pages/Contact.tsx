import { MapPin, Phone, Mail, Clock, ExternalLink, Linkedin, Send, Loader2 } from "lucide-react";
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
  FirmLabel,
  FirmError,
  FirmInput,
  FirmTextarea,
  FirmSelect,
  FirmSubmit,
} from "@/components/firm";
import type { ContactFormData, LanguageCode } from "@shared/schema";
import { practiceAreas } from "@shared/schema";

const validationMessages: Record<LanguageCode, {
  fullNameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  messageRequired: string;
}> = {
  en: {
    fullNameRequired: "Full name is required",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    messageRequired: "Message is required",
  },
  es: {
    fullNameRequired: "El nombre completo es requerido",
    emailRequired: "El correo electrónico es requerido",
    emailInvalid: "Por favor ingrese una dirección de correo válida",
    messageRequired: "El mensaje es requerido",
  },
  de: {
    fullNameRequired: "Name ist erforderlich",
    emailRequired: "E-Mail ist erforderlich",
    emailInvalid: "Ungültige E-Mail-Adresse",
    messageRequired: "Nachricht ist erforderlich",
  },
  zh: {
    fullNameRequired: "姓名是必填项",
    emailRequired: "电子邮件是必填项",
    emailInvalid: "请输入有效的电子邮件地址",
    messageRequired: "留言是必填项",
  },
  ko: {
    fullNameRequired: "이름은 필수입니다",
    emailRequired: "이메일은 필수입니다",
    emailInvalid: "유효한 이메일 주소를 입력하세요",
    messageRequired: "메시지는 필수입니다",
  },
  ja: {
    fullNameRequired: "氏名は必須です",
    emailRequired: "メールアドレスは必須です",
    emailInvalid: "有効なメールアドレスを入力してください",
    messageRequired: "メッセージは必須です",
  },
  ar: {
    fullNameRequired: "الاسم الكامل مطلوب",
    emailRequired: "البريد الإلكتروني مطلوب",
    emailInvalid: "يرجى إدخال عنوان بريد إلكتروني صالح",
    messageRequired: "الرسالة مطلوبة",
  },
  ru: {
    fullNameRequired: "Имя обязательно для заполнения",
    emailRequired: "Электронная почта обязательна",
    emailInvalid: "Пожалуйста, введите действительный адрес электронной почты",
    messageRequired: "Сообщение обязательно для заполнения",
  },
  fr: {
    fullNameRequired: "Le nom complet est requis",
    emailRequired: "L'e-mail est requis",
    emailInvalid: "Veuillez entrer une adresse e-mail valide",
    messageRequired: "Le message est requis",
  },
  it: {
    fullNameRequired: "Il nome completo è obbligatorio",
    emailRequired: "L'e-mail è obbligatoria",
    emailInvalid: "Inserisci un indirizzo e-mail valido",
    messageRequired: "Il messaggio è obbligatorio",
  },
};

const getContactFormSchema = (language: LanguageCode) => {
  const t = validationMessages[language] || validationMessages.en;

  return z.object({
    fullName: z.string().min(1, t.fullNameRequired),
    email: z.string().min(1, t.emailRequired).email(t.emailInvalid),
    phone: z.string().optional(),
    company: z.string().optional(),
    practiceArea: z.string().optional(),
    message: z.string().min(1, t.messageRequired),
  });
};

const toastMessages: Record<LanguageCode, {
  successTitle: string;
  successDescription: string;
  errorTitle: string;
  errorDescription: string;
}> = {
  en: {
    successTitle: "Message sent!",
    successDescription: "We will get back to you soon.",
    errorTitle: "Error",
    errorDescription: "Failed to send message. Please try again.",
  },
  es: {
    successTitle: "¡Mensaje enviado!",
    successDescription: "Nos pondremos en contacto con usted pronto.",
    errorTitle: "Error",
    errorDescription: "No se pudo enviar el mensaje. Por favor intente de nuevo.",
  },
  de: {
    successTitle: "Nachricht erfolgreich gesendet!",
    successDescription: "Wir werden uns bald bei Ihnen melden.",
    errorTitle: "Fehler",
    errorDescription: "Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.",
  },
  zh: {
    successTitle: "消息发送成功！",
    successDescription: "我们会尽快与您联系。",
    errorTitle: "错误",
    errorDescription: "发送消息时出错。请重试。",
  },
  ko: {
    successTitle: "메시지가 전송되었습니다!",
    successDescription: "곧 연락드리겠습니다.",
    errorTitle: "오류",
    errorDescription: "메시지 전송에 실패했습니다. 다시 시도해 주세요.",
  },
  ja: {
    successTitle: "メッセージが送信されました！",
    successDescription: "まもなくご連絡いたします。",
    errorTitle: "エラー",
    errorDescription: "メッセージの送信に失敗しました。もう一度お試しください。",
  },
  ar: {
    successTitle: "تم إرسال الرسالة!",
    successDescription: "سنتواصل معك قريباً.",
    errorTitle: "خطأ",
    errorDescription: "فشل في إرسال الرسالة. يرجى المحاولة مرة أخرى.",
  },
  ru: {
    successTitle: "Сообщение успешно отправлено!",
    successDescription: "Мы свяжемся с вами в ближайшее время.",
    errorTitle: "Ошибка",
    errorDescription: "Ошибка при отправке сообщения. Пожалуйста, попробуйте снова.",
  },
  fr: {
    successTitle: "Message envoyé !",
    successDescription: "Nous vous répondrons bientôt.",
    errorTitle: "Erreur",
    errorDescription: "Échec de l'envoi du message. Veuillez réessayer.",
  },
  it: {
    successTitle: "Messaggio inviato con successo!",
    successDescription: "Ti risponderemo al più presto.",
    errorTitle: "Errore",
    errorDescription: "Errore nell'invio del messaggio. Riprova.",
  },
};

export default function Contact() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const formSchema = getContactFormSchema(language);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      practiceArea: "",
      message: "",
    },
  });

  const toastT = toastMessages[language] || toastMessages.en;

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: toastT.successTitle,
        description: toastT.successDescription,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: toastT.errorTitle,
        description: toastT.errorDescription,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  const content: Record<LanguageCode, {
    title: string;
    subtitle: string;
    officesTitle: string;
    mainOffice: string;
    building: string;
    floor: string;
    street: string;
    colony: string;
    city: string;
    phone: string;
    fax: string;
    email: string;
    hours: string;
    hoursDetails: string;
    getDirections: string;
    connectTitle: string;
    connectSubtitle: string;
    linkedinText: string;
    websiteText: string;
    germanDesk: string;
    germanDeskInfo: string;
    contactUs: string;
    sendEmail: string;
    callUs: string;
    formTitle: string;
    formSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    practiceAreaLabel: string;
    practiceAreaPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
  }> = {
    en: {
      title: "Contact Us",
      subtitle: "Get in touch with our team of legal experts",
      officesTitle: "Our Offices",
      mainOffice: "Main Office - Mexico City",
      building: "Torre SOMA Chapultepec",
      floor: "Floor 18",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Mexico City, Mexico",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Office Hours",
      hoursDetails: "Monday - Friday: 9:00 AM - 7:00 PM (CST)",
      getDirections: "Get Directions",
      connectTitle: "Connect With Us",
      connectSubtitle: "Follow us on social media and stay updated on the latest legal developments",
      linkedinText: "Follow us on LinkedIn",
      websiteText: "Visit our website",
      germanDesk: "German Desk",
      germanDeskInfo: "Specialized German-speaking legal services for German, Austrian, and Swiss clients doing business in Mexico.",
      contactUs: "Contact Us",
      sendEmail: "Send Email",
      callUs: "Call Us",
      formTitle: "Send Us a Message",
      formSubtitle: "Fill out the form below and we will get back to you as soon as possible.",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      emailLabel: "Email",
      emailPlaceholder: "Enter your email address",
      phoneLabel: "Phone (optional)",
      phonePlaceholder: "Enter your phone number",
      companyLabel: "Company/Organization (optional)",
      companyPlaceholder: "Enter your company name",
      practiceAreaLabel: "Practice Area of Interest (optional)",
      practiceAreaPlaceholder: "Select a practice area",
      messageLabel: "Message",
      messagePlaceholder: "How can we help you?",
      submit: "Send Message",
      submitting: "Sending...",
    },
    es: {
      title: "Contáctenos",
      subtitle: "Póngase en contacto con nuestro equipo de expertos legales",
      officesTitle: "Nuestras Oficinas",
      mainOffice: "Oficina Principal - Ciudad de México",
      building: "Torre SOMA Chapultepec",
      floor: "Piso 18",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Ciudad de México, México",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Horario de Oficina",
      hoursDetails: "Lunes - Viernes: 9:00 AM - 7:00 PM (CST)",
      getDirections: "Cómo Llegar",
      connectTitle: "Conéctese Con Nosotros",
      connectSubtitle: "Síganos en redes sociales y manténgase informado sobre los últimos desarrollos legales",
      linkedinText: "Síguenos en LinkedIn",
      websiteText: "Visite nuestro sitio web",
      germanDesk: "German Desk",
      germanDeskInfo: "Servicios legales especializados para clientes alemanes, austriacos y suizos que hacen negocios en México.",
      contactUs: "Contáctenos",
      sendEmail: "Enviar Email",
      callUs: "Llámenos",
      formTitle: "Envíenos un Mensaje",
      formSubtitle: "Complete el formulario a continuación y nos pondremos en contacto con usted lo antes posible.",
      fullName: "Nombre Completo",
      fullNamePlaceholder: "Ingrese su nombre completo",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ingrese su correo electrónico",
      phoneLabel: "Teléfono (opcional)",
      phonePlaceholder: "Ingrese su número de teléfono",
      companyLabel: "Empresa/Organización (opcional)",
      companyPlaceholder: "Ingrese el nombre de su empresa",
      practiceAreaLabel: "Área de Práctica de Interés (opcional)",
      practiceAreaPlaceholder: "Seleccione un área de práctica",
      messageLabel: "Mensaje",
      messagePlaceholder: "¿Cómo podemos ayudarle?",
      submit: "Enviar Mensaje",
      submitting: "Enviando...",
    },
    de: {
      title: "Kontakt",
      subtitle: "Nehmen Sie Kontakt mit unserem Team von Rechtsexperten auf",
      officesTitle: "Unsere Büros",
      mainOffice: "Hauptsitz Mexiko-Stadt",
      building: "Torre SOMA Chapultepec",
      floor: "18. Stock",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Mexiko-Stadt, Mexiko",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Öffnungszeiten",
      hoursDetails: "Montag - Freitag: 9:00 - 19:00 Uhr (CST)",
      getDirections: "Anfahrt",
      connectTitle: "Verbinden Sie sich mit uns",
      connectSubtitle: "Folgen Sie uns in den sozialen Medien und bleiben Sie über die neuesten rechtlichen Entwicklungen informiert",
      linkedinText: "Folgen Sie uns auf LinkedIn",
      websiteText: "Besuchen Sie unsere Website",
      germanDesk: "German Desk",
      germanDeskInfo: "Spezialisierte deutschsprachige Rechtsdienstleistungen für deutsche, österreichische und Schweizer Kunden mit Geschäftstätigkeit in Mexiko.",
      contactUs: "Kontakt",
      sendEmail: "E-Mail senden",
      callUs: "Rufen Sie uns an",
      formTitle: "Senden Sie uns eine Nachricht",
      formSubtitle: "Füllen Sie das Formular aus und wir werden uns so schnell wie möglich bei Ihnen melden.",
      fullName: "Name",
      fullNamePlaceholder: "Geben Sie Ihren vollständigen Namen ein",
      emailLabel: "E-Mail",
      emailPlaceholder: "Geben Sie Ihre E-Mail-Adresse ein",
      phoneLabel: "Telefon (optional)",
      phonePlaceholder: "Geben Sie Ihre Telefonnummer ein",
      companyLabel: "Unternehmen (optional)",
      companyPlaceholder: "Geben Sie Ihren Firmennamen ein",
      practiceAreaLabel: "Praxisbereich (optional)",
      practiceAreaPlaceholder: "Wählen Sie einen Praxisbereich",
      messageLabel: "Nachricht",
      messagePlaceholder: "Wie können wir Ihnen helfen?",
      submit: "Nachricht senden",
      submitting: "Wird gesendet...",
    },
    zh: {
      title: "联系我们",
      subtitle: "与我们的法律专家团队取得联系",
      officesTitle: "我们的办公室",
      mainOffice: "墨西哥城总部",
      building: "Torre SOMA Chapultepec",
      floor: "18层",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, 墨西哥城, 墨西哥",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "办公时间",
      hoursDetails: "周一至周五: 9:00 AM - 7:00 PM (CST)",
      getDirections: "获取路线",
      connectTitle: "与我们联系",
      connectSubtitle: "关注我们的社交媒体，了解最新的法律动态",
      linkedinText: "在LinkedIn上关注我们",
      websiteText: "访问我们的网站",
      germanDesk: "德国服务台",
      germanDeskInfo: "为在墨西哥开展业务的德国、奥地利和瑞士客户提供专业的德语法律服务。",
      contactUs: "联系我们",
      sendEmail: "发送电子邮件",
      callUs: "致电我们",
      formTitle: "给我们留言",
      formSubtitle: "填写以下表格，我们会尽快与您联系。",
      fullName: "姓名",
      fullNamePlaceholder: "请输入您的姓名",
      emailLabel: "电子邮件",
      emailPlaceholder: "请输入您的电子邮件地址",
      phoneLabel: "电话 (可选)",
      phonePlaceholder: "请输入您的电话号码",
      companyLabel: "公司 (可选)",
      companyPlaceholder: "请输入您的公司名称",
      practiceAreaLabel: "业务领域 (可选)",
      practiceAreaPlaceholder: "选择业务领域",
      messageLabel: "留言",
      messagePlaceholder: "我们能如何帮助您？",
      submit: "发送消息",
      submitting: "发送中...",
    },
    ko: {
      title: "문의하기",
      subtitle: "법률 전문가 팀에 문의하세요",
      officesTitle: "사무소 위치",
      mainOffice: "멕시코시티 본사",
      building: "Torre SOMA Chapultepec",
      floor: "18층",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, 멕시코시티, 멕시코",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "업무 시간",
      hoursDetails: "월요일 - 금요일: 오전 9:00 - 오후 7:00 (CST)",
      getDirections: "길찾기",
      connectTitle: "소셜 미디어",
      connectSubtitle: "소셜 미디어를 팔로우하고 최신 법률 동향을 확인하세요",
      linkedinText: "LinkedIn에서 팔로우",
      websiteText: "웹사이트 방문",
      germanDesk: "독일 데스크",
      germanDeskInfo: "멕시코에서 사업을 하는 독일, 오스트리아, 스위스 고객을 위한 전문 독일어 법률 서비스.",
      contactUs: "문의하기",
      sendEmail: "이메일 보내기",
      callUs: "전화하기",
      formTitle: "메시지 보내기",
      formSubtitle: "아래 양식을 작성해 주시면 최대한 빨리 연락드리겠습니다.",
      fullName: "이름",
      fullNamePlaceholder: "성함을 입력하세요",
      emailLabel: "이메일",
      emailPlaceholder: "이메일 주소를 입력하세요",
      phoneLabel: "전화번호 (선택사항)",
      phonePlaceholder: "전화번호를 입력하세요",
      companyLabel: "회사명 (선택사항)",
      companyPlaceholder: "회사명을 입력하세요",
      practiceAreaLabel: "관심 업무 분야 (선택사항)",
      practiceAreaPlaceholder: "업무 분야를 선택하세요",
      messageLabel: "메시지",
      messagePlaceholder: "어떻게 도와드릴까요?",
      submit: "메시지 전송",
      submitting: "전송 중...",
    },
    ja: {
      title: "お問い合わせ",
      subtitle: "法律専門家チームにお問い合わせください",
      officesTitle: "オフィス",
      mainOffice: "メキシコシティ本社",
      building: "Torre SOMA Chapultepec",
      floor: "18階",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, メキシコシティ, メキシコ",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "営業時間",
      hoursDetails: "月曜日〜金曜日: 9:00 AM - 7:00 PM (CST)",
      getDirections: "アクセス",
      connectTitle: "ソーシャルメディア",
      connectSubtitle: "ソーシャルメディアをフォローして、最新の法務情報をご確認ください",
      linkedinText: "LinkedInでフォロー",
      websiteText: "ウェブサイトを訪問",
      germanDesk: "ドイツデスク",
      germanDeskInfo: "メキシコでビジネスを行うドイツ、オーストリア、スイスのお客様向けの専門的なドイツ語法務サービス。",
      contactUs: "お問い合わせ",
      sendEmail: "メールを送信",
      callUs: "電話する",
      formTitle: "メッセージを送信",
      formSubtitle: "以下のフォームにご記入ください。できるだけ早くご連絡いたします。",
      fullName: "氏名",
      fullNamePlaceholder: "氏名を入力してください",
      emailLabel: "メールアドレス",
      emailPlaceholder: "メールアドレスを入力してください",
      phoneLabel: "電話番号 (任意)",
      phonePlaceholder: "電話番号を入力してください",
      companyLabel: "会社名 (任意)",
      companyPlaceholder: "会社名を入力してください",
      practiceAreaLabel: "ご関心のある業務分野 (任意)",
      practiceAreaPlaceholder: "業務分野を選択してください",
      messageLabel: "メッセージ",
      messagePlaceholder: "どのようにお手伝いできますか？",
      submit: "メッセージを送信",
      submitting: "送信中...",
    },
    ar: {
      title: "اتصل بنا",
      subtitle: "تواصل مع فريقنا من الخبراء القانونيين",
      officesTitle: "مكاتبنا",
      mainOffice: "المقر الرئيسي - مكسيكو سيتي",
      building: "Torre SOMA Chapultepec",
      floor: "الطابق 18",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, مكسيكو سيتي, المكسيك",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "ساعات العمل",
      hoursDetails: "الإثنين - الجمعة: 9:00 صباحًا - 7:00 مساءً (CST)",
      getDirections: "الحصول على الاتجاهات",
      connectTitle: "تواصل معنا",
      connectSubtitle: "تابعنا على وسائل التواصل الاجتماعي وابق على اطلاع بآخر التطورات القانونية",
      linkedinText: "تابعنا على LinkedIn",
      websiteText: "زيارة موقعنا",
      germanDesk: "المكتب الألماني",
      germanDeskInfo: "خدمات قانونية متخصصة باللغة الألمانية للعملاء الألمان والنمساويين والسويسريين الذين يمارسون الأعمال في المكسيك.",
      contactUs: "اتصل بنا",
      sendEmail: "إرسال بريد إلكتروني",
      callUs: "اتصل بنا",
      formTitle: "أرسل لنا رسالة",
      formSubtitle: "املأ النموذج أدناه وسنتواصل معك في أقرب وقت ممكن.",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "أدخل عنوان بريدك الإلكتروني",
      phoneLabel: "الهاتف (اختياري)",
      phonePlaceholder: "أدخل رقم هاتفك",
      companyLabel: "الشركة (اختياري)",
      companyPlaceholder: "أدخل اسم شركتك",
      practiceAreaLabel: "مجال الممارسة (اختياري)",
      practiceAreaPlaceholder: "اختر مجال الممارسة",
      messageLabel: "الرسالة",
      messagePlaceholder: "كيف يمكننا مساعدتك؟",
      submit: "إرسال الرسالة",
      submitting: "جاري الإرسال...",
    },
    ru: {
      title: "Контакты",
      subtitle: "Свяжитесь с нашей командой юридических экспертов",
      officesTitle: "Наши офисы",
      mainOffice: "Штаб-квартира в Мехико",
      building: "Torre SOMA Chapultepec",
      floor: "18 этаж",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Мехико, Мексика",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Часы работы",
      hoursDetails: "Понедельник - Пятница: 9:00 - 19:00 (CST)",
      getDirections: "Как добраться",
      connectTitle: "Связаться с нами",
      connectSubtitle: "Подписывайтесь на нас в социальных сетях и будьте в курсе последних юридических новостей",
      linkedinText: "Подписаться в LinkedIn",
      websiteText: "Посетить наш сайт",
      germanDesk: "Немецкий отдел",
      germanDeskInfo: "Специализированные юридические услуги на немецком языке для немецких, австрийских и швейцарских клиентов, ведущих бизнес в Мексике.",
      contactUs: "Связаться с нами",
      sendEmail: "Отправить письмо",
      callUs: "Позвонить нам",
      formTitle: "Напишите нам",
      formSubtitle: "Заполните форму ниже, и мы свяжемся с вами как можно скорее.",
      fullName: "Имя",
      fullNamePlaceholder: "Введите ваше полное имя",
      emailLabel: "Эл. почта",
      emailPlaceholder: "Введите ваш адрес электронной почты",
      phoneLabel: "Телефон (необязательно)",
      phonePlaceholder: "Введите ваш номер телефона",
      companyLabel: "Компания (необязательно)",
      companyPlaceholder: "Введите название вашей компании",
      practiceAreaLabel: "Область практики (необязательно)",
      practiceAreaPlaceholder: "Выберите область практики",
      messageLabel: "Сообщение",
      messagePlaceholder: "Чем мы можем вам помочь?",
      submit: "Отправить сообщение",
      submitting: "Отправка...",
    },
    fr: {
      title: "Contactez-nous",
      subtitle: "Entrez en contact avec notre équipe d'experts juridiques",
      officesTitle: "Nos bureaux",
      mainOffice: "Siège social - Mexico",
      building: "Torre SOMA Chapultepec",
      floor: "18ème étage",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Mexico, Mexique",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Heures d'ouverture",
      hoursDetails: "Lundi - Vendredi: 9h00 - 19h00 (CST)",
      getDirections: "Itinéraire",
      connectTitle: "Restez connectés",
      connectSubtitle: "Suivez-nous sur les réseaux sociaux et restez informés des dernières évolutions juridiques",
      linkedinText: "Suivez-nous sur LinkedIn",
      websiteText: "Visitez notre site web",
      germanDesk: "Bureau allemand",
      germanDeskInfo: "Services juridiques spécialisés en langue allemande pour les clients allemands, autrichiens et suisses faisant des affaires au Mexique.",
      contactUs: "Contactez-nous",
      sendEmail: "Envoyer un e-mail",
      callUs: "Appelez-nous",
      formTitle: "Envoyez-nous un message",
      formSubtitle: "Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.",
      fullName: "Nom complet",
      fullNamePlaceholder: "Entrez votre nom complet",
      emailLabel: "E-mail",
      emailPlaceholder: "Entrez votre adresse e-mail",
      phoneLabel: "Téléphone (facultatif)",
      phonePlaceholder: "Entrez votre numéro de téléphone",
      companyLabel: "Entreprise (facultatif)",
      companyPlaceholder: "Entrez le nom de votre entreprise",
      practiceAreaLabel: "Domaine de pratique (facultatif)",
      practiceAreaPlaceholder: "Sélectionnez un domaine de pratique",
      messageLabel: "Message",
      messagePlaceholder: "Comment pouvons-nous vous aider?",
      submit: "Envoyer le message",
      submitting: "Envoi en cours...",
    },
    it: {
      title: "Contatti",
      subtitle: "Mettiti in contatto con il nostro team di esperti legali",
      officesTitle: "I nostri uffici",
      mainOffice: "Sede centrale Città del Messico",
      building: "Torre SOMA Chapultepec",
      floor: "18° piano",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Città del Messico, Messico",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Orari di apertura",
      hoursDetails: "Lunedì - Venerdì: 9:00 - 19:00 (CST)",
      getDirections: "Indicazioni stradali",
      connectTitle: "Connettiti con noi",
      connectSubtitle: "Seguici sui social media e rimani aggiornato sugli ultimi sviluppi legali",
      linkedinText: "Seguici su LinkedIn",
      websiteText: "Visita il nostro sito web",
      germanDesk: "German Desk",
      germanDeskInfo: "Servizi legali specializzati in lingua tedesca per clienti tedeschi, austriaci e svizzeri che operano in Messico.",
      contactUs: "Contattaci",
      sendEmail: "Invia e-mail",
      callUs: "Chiamaci",
      formTitle: "Inviaci un messaggio",
      formSubtitle: "Compila il modulo sottostante e ti risponderemo il prima possibile.",
      fullName: "Nome",
      fullNamePlaceholder: "Inserisci il tuo nome completo",
      emailLabel: "E-mail",
      emailPlaceholder: "Inserisci il tuo indirizzo e-mail",
      phoneLabel: "Telefono (opzionale)",
      phonePlaceholder: "Inserisci il tuo numero di telefono",
      companyLabel: "Azienda (opzionale)",
      companyPlaceholder: "Inserisci il nome della tua azienda",
      practiceAreaLabel: "Area di pratica (opzionale)",
      practiceAreaPlaceholder: "Seleziona un'area di pratica",
      messageLabel: "Messaggio",
      messagePlaceholder: "Come possiamo aiutarti?",
      submit: "Invia messaggio",
      submitting: "Invio in corso...",
    },
  };

  const t = content[language] || content.en;

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6610687689834!2d-99.19441!3d19.4325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff5f5c0c3e1b%3A0x7c0c7c7c7c7c7c7c!2sTorre%20SOMA%20Chapultepec!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

  return (
    <div data-testid="page-contact" className="vw-old">
      <SEOHead page="contact" language={language} />

      <PageHero
        eyebrow="Von Wobeser y Sierra"
        title={t.title}
        subtitle={t.subtitle}
        data-testid="section-contact-hero"
      />

      {/* Intro: correo y teléfono directos (réplica del contacto viejo) */}
      <Section tone="white" size="compact" data-testid="section-contact-intro">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="font-sans text-lg leading-relaxed text-vw-gray">
              {t.formSubtitle}
            </p>
            <div className="mt-6 space-y-3">
              <a
                href={`mailto:${t.email}`}
                className="flex items-center gap-3 font-sans text-vw-black transition-colors hover:text-vw-red"
                data-testid="link-intro-email"
              >
                <Mail className="h-5 w-5 text-vw-red" aria-hidden="true" />
                {t.email}
              </a>
              <a
                href={`tel:${t.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 font-sans text-vw-black transition-colors hover:text-vw-red"
                data-testid="link-intro-phone"
              >
                <Phone className="h-5 w-5 text-vw-red" aria-hidden="true" />
                {t.phone}
              </a>
            </div>
          </div>
          <div className="border-l-0 md:border-l md:border-vw-graylight md:pl-10">
            <div className="vw-label mb-3 text-[11px] text-vw-gray">
              {t.mainOffice}
            </div>
            <div className="flex items-start gap-3 font-sans text-vw-gray">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
              <div>
                <p>{t.building}, {t.floor}</p>
                <p>{t.street}</p>
                <p>{t.colony}</p>
                <p>{t.city}</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 font-sans text-vw-gray">
              <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
              <div>
                <p className="text-vw-black">{t.hours}</p>
                <p>{t.hoursDetails}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Formulario funcional */}
      <Section tone="gray" data-testid="section-contact-form">
        <SectionTitle data-testid="text-form-title">{t.formTitle}</SectionTitle>
        <p className="mb-8 max-w-2xl font-sans text-vw-gray" data-testid="text-form-subtitle">
          {t.formSubtitle}
        </p>

        {/* TODO(W7): reCAPTCHA v3 — añadir token al submit cuando haya keys. */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-3xl space-y-6"
          data-testid="form-contact"
          noValidate
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <FirmLabel htmlFor="contact-fullName">{t.fullName}</FirmLabel>
              <FirmInput
                id="contact-fullName"
                placeholder={t.fullNamePlaceholder}
                invalid={!!form.formState.errors.fullName}
                data-testid="input-fullname"
                {...form.register("fullName")}
              />
              <FirmError message={form.formState.errors.fullName?.message} />
            </div>
            <div>
              <FirmLabel htmlFor="contact-email">{t.emailLabel}</FirmLabel>
              <FirmInput
                id="contact-email"
                type="email"
                placeholder={t.emailPlaceholder}
                invalid={!!form.formState.errors.email}
                data-testid="input-email"
                {...form.register("email")}
              />
              <FirmError message={form.formState.errors.email?.message} />
            </div>
            <div>
              <FirmLabel htmlFor="contact-phone">{t.phoneLabel}</FirmLabel>
              <FirmInput
                id="contact-phone"
                type="tel"
                placeholder={t.phonePlaceholder}
                data-testid="input-phone"
                {...form.register("phone")}
              />
            </div>
            <div>
              <FirmLabel htmlFor="contact-company">{t.companyLabel}</FirmLabel>
              <FirmInput
                id="contact-company"
                placeholder={t.companyPlaceholder}
                data-testid="input-company"
                {...form.register("company")}
              />
            </div>
          </div>

          <div>
            <FirmLabel htmlFor="contact-practiceArea">{t.practiceAreaLabel}</FirmLabel>
            <FirmSelect
              id="contact-practiceArea"
              data-testid="select-practice-area"
              defaultValue=""
              {...form.register("practiceArea")}
            >
              <option value="" disabled>
                {t.practiceAreaPlaceholder}
              </option>
              {practiceAreas.map((area) => (
                <option key={area.value} value={area.value}>
                  {language === "es" ? area.es : area.en}
                </option>
              ))}
            </FirmSelect>
          </div>

          <div>
            <FirmLabel htmlFor="contact-message">{t.messageLabel}</FirmLabel>
            <FirmTextarea
              id="contact-message"
              placeholder={t.messagePlaceholder}
              invalid={!!form.formState.errors.message}
              data-testid="textarea-message"
              {...form.register("message")}
            />
            <FirmError message={form.formState.errors.message?.message} />
          </div>

          <FirmSubmit disabled={contactMutation.isPending} data-testid="button-submit-contact">
            {contactMutation.isPending ? (
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
        </form>
      </Section>

      {/* Mapa */}
      <Section tone="white" data-testid="section-contact-map">
        <SectionTitle data-testid="text-offices-title">{t.officesTitle}</SectionTitle>
        <div className="aspect-video w-full overflow-hidden border border-vw-graylight">
          <iframe
            src={googleMapsUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Von Wobeser y Sierra Office Location"
            data-testid="iframe-google-map"
          />
        </div>
        <a
          href="https://www.google.com/maps/dir//Torre+SOMA+Chapultepec,+Campos+El%C3%ADseos+204,+Polanco,+11560+Ciudad+de+M%C3%A9xico,+CDMX,+Mexico"
          target="_blank"
          rel="noopener noreferrer"
          className="vw-label mt-5 inline-flex items-center gap-2 text-xs text-vw-red transition-colors hover:text-vw-black"
          data-testid="button-get-directions"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {t.getDirections}
        </a>
      </Section>

      {/* German Desk + conectar */}
      <Section tone="gray" data-testid="section-contact-connect">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border border-vw-graylight bg-white p-8" data-testid="card-german-desk">
            <h3 className="mb-3 font-serif text-2xl text-vw-black" data-testid="text-german-desk-title">
              {t.germanDesk}
            </h3>
            <p className="font-sans text-vw-gray" data-testid="text-german-desk-info">
              {t.germanDeskInfo}
            </p>
          </div>
          <div className="border border-vw-graylight bg-white p-8" data-testid="card-connect">
            <h3 className="mb-2 font-serif text-2xl text-vw-black" data-testid="text-connect-title">
              {t.connectTitle}
            </h3>
            <p className="mb-6 font-sans text-vw-gray" data-testid="text-connect-subtitle">
              {t.connectSubtitle}
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.linkedin.com/company/von-wobeser-y-sierra/"
                target="_blank"
                rel="noopener noreferrer"
                className="vw-label inline-flex items-center gap-3 text-xs text-vw-gray transition-colors hover:text-vw-red"
                data-testid="button-linkedin"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                {t.linkedinText}
              </a>
              <a
                href="https://www.vonwobeser.com"
                target="_blank"
                rel="noopener noreferrer"
                className="vw-label inline-flex items-center gap-3 text-xs text-vw-gray transition-colors hover:text-vw-red"
                data-testid="button-website"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t.websiteText}
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
