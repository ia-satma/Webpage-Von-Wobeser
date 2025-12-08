import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { SiteContent } from "@shared/schema";

type SupportedLanguage = "en" | "es" | "de" | "zh" | "ko" | "ja" | "ar" | "ru" | "fr" | "it";

interface MapSectionProps {
  language: string;
}

export default function MapSection({ language }: MapSectionProps) {
  const { data: siteContent, isLoading, error } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const content: Record<SupportedLanguage, {
    title: string;
    subtitle: string;
    building: string;
    street: string;
    access: string;
    city: string;
    addressLabel: string;
    phoneLabel: string;
    phone: string;
    emailLabel: string;
    email: string;
    directions: string;
    viewMap: string;
    officeHours: string;
    errorMessage: string;
  }> = {
    en: {
      title: siteContent?.locationTitle || "Our Location",
      subtitle: "Visit Us",
      building: "Torre SOMA Chapultepec Floor 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Access via Arquímedes No. 10",
      city: "C.P. 11560, Mexico City",
      addressLabel: "Address",
      phoneLabel: "Phone",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "Email",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Get Directions",
      viewMap: "View on Map",
      officeHours: "Office Hours",
      errorMessage: "Failed to load location information",
    },
    es: {
      title: "Nuestra Ubicación",
      subtitle: "Visítenos",
      building: "Torre SOMA Chapultepec Piso 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Acceso por Arquímedes N.° 10",
      city: "C.P. 11560, Ciudad de México",
      addressLabel: "Dirección",
      phoneLabel: "Teléfono",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "Correo electrónico",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Obtener Direcciones",
      viewMap: "Ver en el mapa",
      officeHours: "Horario de atención",
      errorMessage: "Error al cargar información de ubicación",
    },
    de: {
      title: "Unser Standort",
      subtitle: "Besuchen Sie uns",
      building: "Torre SOMA Chapultepec Etage 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Zugang über Arquímedes Nr. 10",
      city: "C.P. 11560, Mexiko-Stadt",
      addressLabel: "Adresse",
      phoneLabel: "Telefon",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "E-Mail",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Wegbeschreibung",
      viewMap: "Auf Karte anzeigen",
      officeHours: "Öffnungszeiten",
      errorMessage: "Standortinformationen konnten nicht geladen werden",
    },
    zh: {
      title: "我们的位置",
      subtitle: "欢迎拜访",
      building: "Torre SOMA Chapultepec 18楼",
      street: "Campos Elíseos 204, Polanco",
      access: "通过Arquímedes No. 10进入",
      city: "邮编 11560, 墨西哥城",
      addressLabel: "地址",
      phoneLabel: "电话",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "电子邮件",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "获取路线",
      viewMap: "在地图上查看",
      officeHours: "办公时间",
      errorMessage: "无法加载位置信息",
    },
    ko: {
      title: "위치",
      subtitle: "방문해 주세요",
      building: "Torre SOMA Chapultepec 18층",
      street: "Campos Elíseos 204, Polanco",
      access: "Arquímedes No. 10을 통해 출입",
      city: "우편번호 11560, 멕시코시티",
      addressLabel: "주소",
      phoneLabel: "전화",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "이메일",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "길찾기",
      viewMap: "지도에서 보기",
      officeHours: "업무 시간",
      errorMessage: "위치 정보를 불러오지 못했습니다",
    },
    ja: {
      title: "所在地",
      subtitle: "お越しください",
      building: "Torre SOMA Chapultepec 18階",
      street: "Campos Elíseos 204, Polanco",
      access: "Arquímedes No. 10からアクセス",
      city: "郵便番号 11560, メキシコシティ",
      addressLabel: "住所",
      phoneLabel: "電話",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "メール",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "道順を見る",
      viewMap: "地図で見る",
      officeHours: "営業時間",
      errorMessage: "位置情報の読み込みに失敗しました",
    },
    ar: {
      title: "موقعنا",
      subtitle: "قم بزيارتنا",
      building: "Torre SOMA Chapultepec الطابق 18",
      street: "Campos Elíseos 204, Polanco",
      access: "الدخول عبر Arquímedes رقم 10",
      city: "الرمز البريدي 11560، مدينة مكسيكو",
      addressLabel: "العنوان",
      phoneLabel: "الهاتف",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "البريد الإلكتروني",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "الحصول على الاتجاهات",
      viewMap: "عرض على الخريطة",
      officeHours: "ساعات العمل",
      errorMessage: "فشل في تحميل معلومات الموقع",
    },
    ru: {
      title: "Наше местоположение",
      subtitle: "Посетите нас",
      building: "Torre SOMA Chapultepec, этаж 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Вход через Arquímedes № 10",
      city: "Почтовый индекс 11560, Мехико",
      addressLabel: "Адрес",
      phoneLabel: "Телефон",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "Эл. почта",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Проложить маршрут",
      viewMap: "Показать на карте",
      officeHours: "Часы работы",
      errorMessage: "Не удалось загрузить информацию о местоположении",
    },
    fr: {
      title: "Notre emplacement",
      subtitle: "Rendez-nous visite",
      building: "Torre SOMA Chapultepec, 18e étage",
      street: "Campos Elíseos 204, Polanco",
      access: "Accès par Arquímedes n° 10",
      city: "C.P. 11560, Mexico",
      addressLabel: "Adresse",
      phoneLabel: "Téléphone",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "E-mail",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Itinéraire",
      viewMap: "Voir sur la carte",
      officeHours: "Heures d'ouverture",
      errorMessage: "Impossible de charger les informations de localisation",
    },
    it: {
      title: "La nostra sede",
      subtitle: "Vieni a trovarci",
      building: "Torre SOMA Chapultepec, Piano 18",
      street: "Campos Elíseos 204, Polanco",
      access: "Accesso da Arquímedes n. 10",
      city: "C.P. 11560, Città del Messico",
      addressLabel: "Indirizzo",
      phoneLabel: "Telefono",
      phone: siteContent?.phone || "+52 55 5258 1000",
      emailLabel: "E-mail",
      email: siteContent?.email || "info@vonwobeser.com",
      directions: "Indicazioni stradali",
      viewMap: "Visualizza sulla mappa",
      officeHours: "Orari di apertura",
      errorMessage: "Impossibile caricare le informazioni sulla posizione",
    },
  };

  const currentLang = (language in content ? language : "en") as SupportedLanguage;
  const t = content[currentLang];

  const googleMapsUrl = "https://www.google.com/maps/dir//Von+Wobeser+y+Sierra,+S.C.+Campos+El%C3%ADseos+204+Polanco,+Miguel+Hidalgo+11560+Ciudad+de+M%C3%A9xico,+CDMX/@19.427554,-99.1927585,16z";
  const embedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6792799936887!2d-99.19494!3d19.427554!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d200c4e25d79b5%3A0x73edbb0d14f88dde!2sVon%20Wobeser%20y%20Sierra%2C%20S.C.!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

  if (error) {
    return (
      <section id="location" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800" data-testid="section-location">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400" data-testid="text-location-error">{t.errorMessage}</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section id="location" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800" data-testid="section-location">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <Skeleton className="h-10 w-64 mx-auto mb-12" data-testid="skeleton-location-title" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <Skeleton className="lg:col-span-3 aspect-[16/10] lg:min-h-[400px]" />
            <div className="lg:col-span-2">
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="location"
      className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-800"
      data-testid="section-location"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-heading font-light text-[#AC162C] tracking-wide text-center mb-12"
          data-testid="text-location-title"
        >
          {t.title}
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-3 aspect-[16/10] lg:aspect-auto lg:min-h-[400px] rounded-none overflow-hidden shadow-lg"
          >
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Von Wobeser y Sierra Location"
              data-testid="iframe-map"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 flex flex-col justify-center"
          >
            <div className="bg-white dark:bg-gray-900 p-8 lg:p-10 shadow-sm" data-testid="card-contact-info">
              <div className="flex items-start gap-4 mb-8">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" data-testid="icon-location" />
                <div data-testid="text-address">
                  <p className="font-medium text-gray-800 dark:text-white mb-1">{t.building}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t.street}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t.access}</p>
                  <p className="text-gray-600 dark:text-gray-300">{t.city}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" data-testid="icon-phone" />
                <a
                  href={`tel:${t.phone.replace(/\s/g, "")}`}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-phone"
                >
                  {t.phone}
                </a>
              </div>

              <div className="flex items-center gap-4 mb-10">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" data-testid="icon-email" />
                <a
                  href={`mailto:${t.email}`}
                  className="text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
                  data-testid="link-email"
                >
                  {t.email}
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full rounded-none bg-primary hover:bg-primary/90 text-white"
                  data-testid="button-directions"
                >
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <MapPin className="w-4 h-4 mr-2" />
                    {t.directions}
                  </a>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-none border-gray-300 dark:border-gray-600"
                  data-testid="button-view-map"
                >
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t.viewMap}
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
