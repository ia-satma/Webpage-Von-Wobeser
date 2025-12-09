import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { X, Shield, BarChart3, Settings2, Megaphone } from 'lucide-react';

interface CookieBannerProps {
  language: "en" | "es" | "de" | "zh" | "ko" | "ja" | "ar" | "ru" | "fr" | "it";
}

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functionality: boolean;
  marketing: boolean;
}

const STORAGE_KEY = 'vwb_cookie_preferences';

export default function CookieBanner({ language }: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functionality: false,
    marketing: false,
  });

  useEffect(() => {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);
    if (!savedPreferences) {
      const timer = setTimeout(() => setVisible(true), 2000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences({ ...parsed, essential: true });
      } catch {
        setVisible(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    setVisible(false);
    setShowPreferences(false);
  };

  const acceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      functionality: true,
      marketing: true,
    };
    savePreferences(allAccepted);
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  const openPreferences = () => {
    setShowPreferences(true);
  };

  const closePreferences = () => {
    setShowPreferences(false);
  };

  const togglePreference = (key: keyof CookiePreferences) => {
    if (key === 'essential') return;
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const content: Record<string, {
    message: string;
    privacy: string;
    configure: string;
    accept: string;
    preferencesTitle: string;
    preferencesDescription: string;
    savePreferences: string;
    acceptAllButton: string;
    categories: {
      essential: { title: string; description: string; alwaysOn: string };
      analytics: { title: string; description: string };
      functionality: { title: string; description: string };
      marketing: { title: string; description: string };
    };
  }> = {
    en: {
      message: "We use our own and third-party cookies to improve our services and show you advertising related to your preferences by analyzing your browsing habits.",
      privacy: "View Privacy Policy",
      configure: "Configure",
      accept: "Accept all",
      preferencesTitle: "Cookie Preferences",
      preferencesDescription: "Manage your cookie preferences below. You can enable or disable different types of cookies. Essential cookies are always active as they are necessary for the website to function properly.",
      savePreferences: "Save Preferences",
      acceptAllButton: "Accept All",
      categories: {
        essential: {
          title: "Essential Cookies",
          description: "These cookies are strictly necessary for the website to function properly. They enable basic functions like page navigation, secure access, and session management. The website cannot function properly without these cookies.",
          alwaysOn: "Always active",
        },
        analytics: {
          title: "Analytics Cookies",
          description: "These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. They help us measure traffic, identify popular pages, and improve user experience.",
        },
        functionality: {
          title: "Functionality Cookies",
          description: "These cookies enable enhanced functionality and personalization, such as remembering your language preferences, region settings, and customized layouts. Without these cookies, some features may not be available.",
        },
        marketing: {
          title: "Marketing Cookies",
          description: "These cookies are used to deliver advertisements more relevant to you and your interests. They may be used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.",
        },
      },
    },
    es: {
      message: "Utilizamos cookies propias y de terceros para mejorar nuestros servicios y mostrarle publicidad relacionada con sus preferencias mediante el análisis de sus hábitos de navegación.",
      privacy: "Ver Política de Privacidad",
      configure: "Configurar",
      accept: "Aceptar todas",
      preferencesTitle: "Preferencias de Cookies",
      preferencesDescription: "Gestione sus preferencias de cookies a continuación. Puede habilitar o deshabilitar diferentes tipos de cookies. Las cookies esenciales siempre están activas ya que son necesarias para el correcto funcionamiento del sitio web.",
      savePreferences: "Guardar Preferencias",
      acceptAllButton: "Aceptar Todas",
      categories: {
        essential: {
          title: "Cookies Esenciales",
          description: "Estas cookies son estrictamente necesarias para el funcionamiento del sitio web. Permiten funciones básicas como la navegación de páginas, acceso seguro y gestión de sesiones. El sitio web no puede funcionar correctamente sin estas cookies.",
          alwaysOn: "Siempre activas",
        },
        analytics: {
          title: "Cookies de Análisis",
          description: "Estas cookies nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web recopilando información de forma anónima. Nos ayudan a medir el tráfico, identificar páginas populares y mejorar la experiencia del usuario.",
        },
        functionality: {
          title: "Cookies de Funcionalidad",
          description: "Estas cookies permiten funcionalidades mejoradas y personalización, como recordar sus preferencias de idioma, configuración regional y diseños personalizados. Sin estas cookies, algunas funciones pueden no estar disponibles.",
        },
        marketing: {
          title: "Cookies de Marketing",
          description: "Estas cookies se utilizan para mostrar anuncios más relevantes para usted y sus intereses. Pueden usarse para limitar el número de veces que ve un anuncio y ayudar a medir la efectividad de las campañas publicitarias.",
        },
      },
    },
    de: {
      message: "Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern. Durch die Nutzung unserer Website stimmen Sie unserer Verwendung von Cookies zu.",
      privacy: "Mehr erfahren",
      configure: "Ablehnen",
      accept: "Akzeptieren",
      preferencesTitle: "Cookie-Einstellungen",
      preferencesDescription: "Verwalten Sie unten Ihre Cookie-Einstellungen. Sie können verschiedene Arten von Cookies aktivieren oder deaktivieren. Essentielle Cookies sind immer aktiv, da sie für das ordnungsgemäße Funktionieren der Website erforderlich sind.",
      savePreferences: "Einstellungen speichern",
      acceptAllButton: "Alle akzeptieren",
      categories: {
        essential: {
          title: "Essentielle Cookies",
          description: "Diese Cookies sind für das ordnungsgemäße Funktionieren der Website unbedingt erforderlich. Sie ermöglichen grundlegende Funktionen wie Seitennavigation, sicheren Zugang und Sitzungsverwaltung. Die Website kann ohne diese Cookies nicht ordnungsgemäß funktionieren.",
          alwaysOn: "Immer aktiv",
        },
        analytics: {
          title: "Analyse-Cookies",
          description: "Diese Cookies helfen uns zu verstehen, wie Besucher mit unserer Website interagieren, indem sie Informationen anonym sammeln und melden. Sie helfen uns, den Traffic zu messen, beliebte Seiten zu identifizieren und die Benutzererfahrung zu verbessern.",
        },
        functionality: {
          title: "Funktionalitäts-Cookies",
          description: "Diese Cookies ermöglichen erweiterte Funktionalität und Personalisierung, wie das Speichern Ihrer Spracheinstellungen, regionalen Einstellungen und benutzerdefinierten Layouts. Ohne diese Cookies sind einige Funktionen möglicherweise nicht verfügbar.",
        },
        marketing: {
          title: "Marketing-Cookies",
          description: "Diese Cookies werden verwendet, um Ihnen und Ihren Interessen relevantere Werbung zu liefern. Sie können verwendet werden, um die Häufigkeit der Werbeanzeigen zu begrenzen und die Wirksamkeit von Werbekampagnen zu messen.",
        },
      },
    },
    zh: {
      message: "我们使用 Cookie 来改善您在我们网站上的体验。继续使用我们的网站即表示您同意我们使用 Cookie。",
      privacy: "了解更多",
      configure: "拒绝",
      accept: "接受",
      preferencesTitle: "Cookie 偏好设置",
      preferencesDescription: "在下方管理您的 Cookie 偏好设置。您可以启用或禁用不同类型的 Cookie。必要 Cookie 始终处于活动状态，因为它们对于网站正常运行是必需的。",
      savePreferences: "保存偏好设置",
      acceptAllButton: "全部接受",
      categories: {
        essential: {
          title: "必要 Cookie",
          description: "这些 Cookie 对于网站正常运行是绝对必要的。它们支持基本功能，如页面导航、安全访问和会话管理。没有这些 Cookie，网站无法正常运行。",
          alwaysOn: "始终活动",
        },
        analytics: {
          title: "分析 Cookie",
          description: "这些 Cookie 通过匿名收集和报告信息，帮助我们了解访问者如何与我们的网站互动。它们帮助我们衡量流量、识别热门页面并改善用户体验。",
        },
        functionality: {
          title: "功能 Cookie",
          description: "这些 Cookie 支持增强的功能和个性化，例如记住您的语言偏好、地区设置和自定义布局。没有这些 Cookie，某些功能可能不可用。",
        },
        marketing: {
          title: "营销 Cookie",
          description: "这些 Cookie 用于向您投放与您和您的兴趣更相关的广告。它们可用于限制您看到广告的次数，并帮助衡量广告活动的效果。",
        },
      },
    },
    ko: {
      message: "당사 웹사이트에서 더 나은 경험을 제공하기 위해 쿠키를 사용합니다. 당사 웹사이트를 사용하면 쿠키 사용에 동의하는 것입니다.",
      privacy: "자세히 알아보기",
      configure: "거부",
      accept: "수락",
      preferencesTitle: "쿠키 환경설정",
      preferencesDescription: "아래에서 쿠키 환경설정을 관리하세요. 다양한 유형의 쿠키를 활성화하거나 비활성화할 수 있습니다. 필수 쿠키는 웹사이트가 제대로 작동하는 데 필요하므로 항상 활성화되어 있습니다.",
      savePreferences: "환경설정 저장",
      acceptAllButton: "모두 수락",
      categories: {
        essential: {
          title: "필수 쿠키",
          description: "이 쿠키는 웹사이트가 제대로 작동하는 데 반드시 필요합니다. 페이지 탐색, 보안 액세스, 세션 관리와 같은 기본 기능을 지원합니다. 이 쿠키가 없으면 웹사이트가 제대로 작동하지 않습니다.",
          alwaysOn: "항상 활성",
        },
        analytics: {
          title: "분석 쿠키",
          description: "이 쿠키는 익명으로 정보를 수집하고 보고하여 방문자가 웹사이트와 어떻게 상호작용하는지 이해하는 데 도움을 줍니다. 트래픽을 측정하고, 인기 페이지를 식별하고, 사용자 경험을 개선하는 데 도움이 됩니다.",
        },
        functionality: {
          title: "기능 쿠키",
          description: "이 쿠키는 언어 기본 설정, 지역 설정, 맞춤 레이아웃 기억과 같은 향상된 기능 및 개인화를 가능하게 합니다. 이 쿠키가 없으면 일부 기능을 사용할 수 없을 수 있습니다.",
        },
        marketing: {
          title: "마케팅 쿠키",
          description: "이 쿠키는 귀하와 귀하의 관심사에 더 관련성 있는 광고를 제공하는 데 사용됩니다. 광고를 보는 횟수를 제한하고 광고 캠페인의 효과를 측정하는 데 사용될 수 있습니다.",
        },
      },
    },
    ja: {
      message: "当サイトでは、ユーザー体験向上のためにCookieを使用しています。当サイトを利用することで、Cookieの使用に同意したものとみなされます。",
      privacy: "詳しく見る",
      configure: "拒否する",
      accept: "同意する",
      preferencesTitle: "Cookie設定",
      preferencesDescription: "以下でCookieの設定を管理できます。さまざまな種類のCookieを有効または無効にできます。必須Cookieは、ウェブサイトが正常に機能するために必要なため、常に有効です。",
      savePreferences: "設定を保存",
      acceptAllButton: "すべて同意",
      categories: {
        essential: {
          title: "必須Cookie",
          description: "これらのCookieは、ウェブサイトが正常に機能するために厳密に必要です。ページナビゲーション、安全なアクセス、セッション管理などの基本機能を有効にします。これらのCookieがないと、ウェブサイトは正常に機能しません。",
          alwaysOn: "常に有効",
        },
        analytics: {
          title: "分析Cookie",
          description: "これらのCookieは、匿名で情報を収集・報告することで、訪問者がウェブサイトとどのようにやり取りしているかを理解するのに役立ちます。トラフィックの測定、人気ページの特定、ユーザー体験の向上に役立ちます。",
        },
        functionality: {
          title: "機能Cookie",
          description: "これらのCookieは、言語設定、地域設定、カスタマイズされたレイアウトの記憶など、拡張機能とパーソナライゼーションを可能にします。これらのCookieがないと、一部の機能が利用できない場合があります。",
        },
        marketing: {
          title: "マーケティングCookie",
          description: "これらのCookieは、お客様とお客様の興味に関連性の高い広告を配信するために使用されます。広告の表示回数を制限し、広告キャンペーンの効果を測定するために使用される場合があります。",
        },
      },
    },
    ar: {
      message: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. باستخدام موقعنا، فإنك توافق على استخدامنا لملفات تعريف الارتباط.",
      privacy: "اعرف المزيد",
      configure: "رفض",
      accept: "قبول",
      preferencesTitle: "تفضيلات ملفات تعريف الارتباط",
      preferencesDescription: "قم بإدارة تفضيلات ملفات تعريف الارتباط أدناه. يمكنك تفعيل أو تعطيل أنواع مختلفة من ملفات تعريف الارتباط. ملفات تعريف الارتباط الأساسية نشطة دائمًا لأنها ضرورية لعمل الموقع بشكل صحيح.",
      savePreferences: "حفظ التفضيلات",
      acceptAllButton: "قبول الكل",
      categories: {
        essential: {
          title: "ملفات تعريف الارتباط الأساسية",
          description: "هذه الملفات ضرورية للغاية لعمل الموقع بشكل صحيح. إنها تتيح الوظائف الأساسية مثل التنقل بين الصفحات والوصول الآمن وإدارة الجلسات. لا يمكن للموقع العمل بشكل صحيح بدون هذه الملفات.",
          alwaysOn: "نشط دائمًا",
        },
        analytics: {
          title: "ملفات تعريف الارتباط التحليلية",
          description: "تساعدنا هذه الملفات على فهم كيفية تفاعل الزوار مع موقعنا من خلال جمع المعلومات والإبلاغ عنها بشكل مجهول. تساعدنا في قياس حركة المرور وتحديد الصفحات الشائعة وتحسين تجربة المستخدم.",
        },
        functionality: {
          title: "ملفات تعريف الارتباط الوظيفية",
          description: "تتيح هذه الملفات وظائف محسنة وتخصيصًا، مثل تذكر تفضيلات اللغة وإعدادات المنطقة والتخطيطات المخصصة. بدون هذه الملفات، قد لا تتوفر بعض الميزات.",
        },
        marketing: {
          title: "ملفات تعريف الارتباط التسويقية",
          description: "تُستخدم هذه الملفات لتقديم إعلانات أكثر صلة بك وباهتماماتك. يمكن استخدامها للحد من عدد مرات مشاهدة الإعلان والمساعدة في قياس فعالية الحملات الإعلانية.",
        },
      },
    },
    ru: {
      message: "Мы используем файлы cookie для улучшения вашего опыта на нашем сайте. Используя наш сайт, вы соглашаетесь на использование файлов cookie.",
      privacy: "Узнать больше",
      configure: "Отклонить",
      accept: "Принять",
      preferencesTitle: "Настройки Cookie",
      preferencesDescription: "Управляйте своими предпочтениями cookie ниже. Вы можете включить или отключить различные типы cookie. Необходимые cookie всегда активны, так как они необходимы для правильной работы сайта.",
      savePreferences: "Сохранить настройки",
      acceptAllButton: "Принять все",
      categories: {
        essential: {
          title: "Необходимые Cookie",
          description: "Эти cookie строго необходимы для правильной работы сайта. Они обеспечивают базовые функции, такие как навигация по страницам, безопасный доступ и управление сессией. Сайт не может правильно работать без этих cookie.",
          alwaysOn: "Всегда активны",
        },
        analytics: {
          title: "Аналитические Cookie",
          description: "Эти cookie помогают нам понять, как посетители взаимодействуют с нашим сайтом, собирая и сообщая информацию анонимно. Они помогают нам измерять трафик, определять популярные страницы и улучшать пользовательский опыт.",
        },
        functionality: {
          title: "Функциональные Cookie",
          description: "Эти cookie обеспечивают расширенную функциональность и персонализацию, такую как запоминание ваших языковых предпочтений, региональных настроек и пользовательских макетов. Без этих cookie некоторые функции могут быть недоступны.",
        },
        marketing: {
          title: "Маркетинговые Cookie",
          description: "Эти cookie используются для показа более релевантной рекламы вам и вашим интересам. Они могут использоваться для ограничения количества показов рекламы и измерения эффективности рекламных кампаний.",
        },
      },
    },
    fr: {
      message: "Nous utilisons des cookies pour améliorer votre expérience sur notre site. En utilisant notre site, vous acceptez notre utilisation des cookies.",
      privacy: "En savoir plus",
      configure: "Refuser",
      accept: "Accepter",
      preferencesTitle: "Préférences de Cookies",
      preferencesDescription: "Gérez vos préférences de cookies ci-dessous. Vous pouvez activer ou désactiver différents types de cookies. Les cookies essentiels sont toujours actifs car ils sont nécessaires au bon fonctionnement du site.",
      savePreferences: "Enregistrer les préférences",
      acceptAllButton: "Tout accepter",
      categories: {
        essential: {
          title: "Cookies Essentiels",
          description: "Ces cookies sont strictement nécessaires au bon fonctionnement du site. Ils permettent des fonctions de base comme la navigation, l'accès sécurisé et la gestion des sessions. Le site ne peut pas fonctionner correctement sans ces cookies.",
          alwaysOn: "Toujours actifs",
        },
        analytics: {
          title: "Cookies Analytiques",
          description: "Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site en collectant et rapportant des informations de manière anonyme. Ils nous aident à mesurer le trafic, identifier les pages populaires et améliorer l'expérience utilisateur.",
        },
        functionality: {
          title: "Cookies de Fonctionnalité",
          description: "Ces cookies permettent des fonctionnalités améliorées et une personnalisation, comme mémoriser vos préférences de langue, paramètres régionaux et mises en page personnalisées. Sans ces cookies, certaines fonctionnalités peuvent ne pas être disponibles.",
        },
        marketing: {
          title: "Cookies Marketing",
          description: "Ces cookies sont utilisés pour diffuser des publicités plus pertinentes pour vous et vos intérêts. Ils peuvent être utilisés pour limiter le nombre de fois où vous voyez une publicité et aider à mesurer l'efficacité des campagnes publicitaires.",
        },
      },
    },
    it: {
      message: "Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito. Utilizzando il nostro sito, accetti il nostro utilizzo dei cookie.",
      privacy: "Scopri di più",
      configure: "Rifiuta",
      accept: "Accetta",
      preferencesTitle: "Preferenze Cookie",
      preferencesDescription: "Gestisci le tue preferenze sui cookie qui sotto. Puoi abilitare o disabilitare diversi tipi di cookie. I cookie essenziali sono sempre attivi poiché sono necessari per il corretto funzionamento del sito.",
      savePreferences: "Salva preferenze",
      acceptAllButton: "Accetta tutti",
      categories: {
        essential: {
          title: "Cookie Essenziali",
          description: "Questi cookie sono strettamente necessari per il corretto funzionamento del sito. Abilitano funzioni di base come la navigazione, l'accesso sicuro e la gestione delle sessioni. Il sito non può funzionare correttamente senza questi cookie.",
          alwaysOn: "Sempre attivi",
        },
        analytics: {
          title: "Cookie Analitici",
          description: "Questi cookie ci aiutano a capire come i visitatori interagiscono con il nostro sito raccogliendo e riportando informazioni in modo anonimo. Ci aiutano a misurare il traffico, identificare le pagine popolari e migliorare l'esperienza utente.",
        },
        functionality: {
          title: "Cookie di Funzionalità",
          description: "Questi cookie consentono funzionalità avanzate e personalizzazione, come ricordare le tue preferenze linguistiche, impostazioni regionali e layout personalizzati. Senza questi cookie, alcune funzionalità potrebbero non essere disponibili.",
        },
        marketing: {
          title: "Cookie di Marketing",
          description: "Questi cookie vengono utilizzati per fornire pubblicità più pertinenti a te e ai tuoi interessi. Possono essere utilizzati per limitare il numero di volte in cui vedi un annuncio e aiutare a misurare l'efficacia delle campagne pubblicitarie.",
        },
      },
    },
  };

  const t = content[language] || content.en;

  const categoryConfig = [
    { key: 'essential' as const, icon: Shield, disabled: true },
    { key: 'analytics' as const, icon: BarChart3, disabled: false },
    { key: 'functionality' as const, icon: Settings2, disabled: false },
    { key: 'marketing' as const, icon: Megaphone, disabled: false },
  ];

  return (
    <AnimatePresence>
      {visible && !showPreferences && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-0 left-0 w-full bg-[#1a1a1a] text-white p-6 z-[60] border-t border-[#AA1A2E] shadow-2xl"
          data-testid="banner-cookie-consent"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-300 flex-1">
              <p>
                {t.message}
                <a 
                  href="/privacy-policy" 
                  className="underline text-[#AA1A2E] ml-1 hover:text-white transition-colors"
                  data-testid="link-privacy-policy"
                >
                  {t.privacy}
                </a>.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <button 
                onClick={openPreferences}
                className="min-h-[44px] px-4 py-2 text-sm border border-white/20 hover:bg-white/10 transition-colors touch-manipulation"
                data-testid="button-cookie-configure"
              >
                {t.configure}
              </button>
              <button 
                onClick={acceptAll}
                className="min-h-[44px] px-6 py-2 text-sm bg-[#AA1A2E] text-white font-medium hover:bg-[#8A1525] transition-colors touch-manipulation"
                data-testid="button-cookie-accept"
              >
                {t.accept}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {showPreferences && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          data-testid="modal-cookie-preferences-overlay"
          onClick={closePreferences}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-[#1a1a1a] text-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#AA1A2E]/30"
            data-testid="modal-cookie-preferences"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold" data-testid="text-preferences-title">
                {t.preferencesTitle}
              </h2>
              <button
                onClick={closePreferences}
                className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center hover:bg-white/10 transition-colors touch-manipulation"
                data-testid="button-close-preferences"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-sm text-gray-400 mb-6" data-testid="text-preferences-description">
                {t.preferencesDescription}
              </p>

              <div className="space-y-4">
                {categoryConfig.map(({ key, icon: Icon, disabled }) => {
                  const category = t.categories[key];
                  return (
                    <div
                      key={key}
                      className="border border-white/10 p-4 hover:border-white/20 transition-colors"
                      data-testid={`card-cookie-${key}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-10 h-10 flex items-center justify-center bg-[#AA1A2E]/20 text-[#AA1A2E]">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-2">
                            <h3 className="font-medium text-white" data-testid={`text-cookie-title-${key}`}>
                              {category.title}
                            </h3>
                            <div className="shrink-0 flex items-center gap-2">
                              {disabled ? (
                                <span 
                                  className="text-xs text-[#AA1A2E] font-medium"
                                  data-testid={`text-cookie-always-on-${key}`}
                                >
                                  {(category as typeof t.categories.essential).alwaysOn}
                                </span>
                              ) : (
                                <Switch
                                  checked={preferences[key]}
                                  onCheckedChange={() => togglePreference(key)}
                                  disabled={disabled}
                                  data-testid={`switch-cookie-${key}`}
                                  className="data-[state=checked]:bg-[#AA1A2E]"
                                />
                              )}
                            </div>
                          </div>
                          <p 
                            className="text-sm text-gray-400 leading-relaxed"
                            data-testid={`text-cookie-description-${key}`}
                          >
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-white/10">
              <button
                onClick={saveCustomPreferences}
                className="flex-1 min-h-[44px] px-6 py-3 text-sm border border-white/20 hover:bg-white/10 transition-colors font-medium touch-manipulation"
                data-testid="button-save-preferences"
              >
                {t.savePreferences}
              </button>
              <button
                onClick={acceptAll}
                className="flex-1 min-h-[44px] px-6 py-3 text-sm bg-[#AA1A2E] text-white font-medium hover:bg-[#8A1525] transition-colors touch-manipulation"
                data-testid="button-accept-all-preferences"
              >
                {t.acceptAllButton}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
