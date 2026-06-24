import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  Car,
  Train,
  Accessibility,
  Video,
  Users,
  Coffee,
  Navigation,
  ExternalLink,
  ArrowRight,
  Landmark,
  ParkingCircle,
  Wifi,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PageHero,
  Section,
  SectionTitle,
  FeatureCard,
} from "@/components/firm";
import type { OfficeImage } from "@shared/schema";

interface AmenityItem {
  icon: typeof Building2;
  text: string;
}

interface OfficeContent {
  heroTitle: string;
  heroSubtitle: string;
  mainOfficeTitle: string;
  buildingName: string;
  floor: string;
  address: string;
  colony: string;
  postalCode: string;
  city: string;
  phone: string;
  fax: string;
  email: string;
  officeHoursTitle: string;
  officeHours: string;
  saturdayHours: string;
  getDirections: string;
  amenitiesTitle: string;
  amenities: AmenityItem[];
  directionsTitle: string;
  directionsText: string;
  landmarksTitle: string;
  landmarks: string[];
  galleryTitle: string;
  gallerySubtitle: string;
  facilitiesTitle: string;
  facilitiesSubtitle: string;
  meetingRoomsTitle: string;
  meetingRoomsDesc: string;
  videoConferencingTitle: string;
  videoConferencingDesc: string;
  clientHospitalityTitle: string;
  clientHospitalityDesc: string;
  accessibilityTitle: string;
  accessibilityDesc: string;
  transportTitle: string;
  transportSubtitle: string;
  metroTitle: string;
  metroDesc: string;
  parkingTitle: string;
  parkingDesc: string;
  taxiTitle: string;
  taxiDesc: string;
  contactCtaTitle: string;
  contactCtaSubtitle: string;
  contactButton: string;
  scheduleButton: string;
  headquarters: string;
  viewOnMap: string;
}

export default function Offices() {
  const { language } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<OfficeImage | null>(null);
  // Accesibilidad del lightbox: foco al botón de cierre y restauración al cerrar
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Cerrar el lightbox con Escape y gestionar el foco mientras hay imagen seleccionada
  useEffect(() => {
    if (!selectedImage) return;

    // Recordar el elemento enfocado antes de abrir para restaurarlo al cerrar
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Mover el foco al botón de cierre al abrir
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
        return;
      }
      // Focus trap simple: mantener el foco dentro del modal (solo está el botón de cierre)
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restaurar el foco al elemento que abrió el lightbox
      previouslyFocusedRef.current?.focus();
    };
  }, [selectedImage]);

  const { data: officeImages, isLoading: imagesLoading } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
  });

  const content: Record<string, OfficeContent> = {
    en: {
      heroTitle: "Our Offices",
      heroSubtitle: "Visit us at our modern facilities in Mexico City",
      mainOfficeTitle: "Mexico City Headquarters",
      buildingName: "Torre SOMA Chapultepec",
      floor: "Floor 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "Mexico City, Mexico",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "Office Hours",
      officeHours: "Monday - Friday: 9:00 AM - 7:00 PM (CST)",
      saturdayHours: "Saturday - Sunday: Closed",
      getDirections: "Get Directions",
      amenitiesTitle: "Building Amenities",
      amenities: [
        { icon: Building2, text: "Premium Class A office building" },
        { icon: Wifi, text: "High-speed fiber optic connectivity" },
        { icon: Coffee, text: "Executive cafeteria and lounge areas" },
        { icon: ParkingCircle, text: "Underground parking with 24/7 security" },
      ],
      directionsTitle: "How to Get There",
      directionsText: "Torre SOMA Chapultepec is located in the heart of Polanco, one of Mexico City's most prestigious business and residential districts. The building is easily accessible from all major highways and public transportation.",
      landmarksTitle: "Nearby Landmarks",
      landmarks: [
        "Chapultepec Castle (2 min drive)",
        "Museo Nacional de Antropología (5 min drive)",
        "Paseo de la Reforma (1 min walk)",
        "Polanco shopping district (5 min walk)",
      ],
      galleryTitle: "Office Gallery",
      gallerySubtitle: "Explore our modern, collaborative workspace designed for excellence",
      facilitiesTitle: "Our Facilities",
      facilitiesSubtitle: "State-of-the-art amenities for our clients and team",
      meetingRoomsTitle: "Meeting Rooms",
      meetingRoomsDesc: "16 fully equipped meeting rooms ranging from intimate client consultation spaces to large conference halls, all featuring advanced presentation technology and comfortable furnishings.",
      videoConferencingTitle: "Video Conferencing",
      videoConferencingDesc: "Cutting-edge video conferencing facilities enabling seamless communication with clients and partners worldwide, with dedicated technical support staff.",
      clientHospitalityTitle: "Client Hospitality",
      clientHospitalityDesc: "Executive reception areas with premium catering services, private client lounges, and VIP parking for our distinguished guests.",
      accessibilityTitle: "Accessibility",
      accessibilityDesc: "Full wheelchair accessibility throughout our offices, including accessible restrooms, elevators, and reserved parking spaces.",
      transportTitle: "Transportation",
      transportSubtitle: "Multiple convenient options to reach our offices",
      metroTitle: "Metro",
      metroDesc: "The nearest metro station is Auditorio (Line 7), approximately 10 minutes walking distance. Alternatively, Polanco station (Line 7) is also accessible.",
      parkingTitle: "Parking",
      parkingDesc: "Underground parking is available in Torre SOMA with validated parking for clients. Additional public parking is available nearby at Antara Fashion Hall and Palacio de Hierro Polanco.",
      taxiTitle: "Taxi / Uber",
      taxiDesc: "Request your ride to 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. The building has a designated drop-off area at the main entrance on Campos Elíseos.",
      contactCtaTitle: "Ready to Visit?",
      contactCtaSubtitle: "Schedule a meeting with our team or contact us for more information about our legal services.",
      contactButton: "Contact Us",
      scheduleButton: "Schedule a Meeting",
      headquarters: "Headquarters",
      viewOnMap: "View on Map",
    },
    es: {
      heroTitle: "Nuestras Oficinas",
      heroSubtitle: "Visítenos en nuestras modernas instalaciones en la Ciudad de México",
      mainOfficeTitle: "Oficinas Centrales en Ciudad de México",
      buildingName: "Torre SOMA Chapultepec",
      floor: "Piso 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "Ciudad de México, México",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "Horario de Oficina",
      officeHours: "Lunes - Viernes: 9:00 AM - 7:00 PM (CST)",
      saturdayHours: "Sábado - Domingo: Cerrado",
      getDirections: "Cómo Llegar",
      amenitiesTitle: "Amenidades del Edificio",
      amenities: [
        { icon: Building2, text: "Edificio de oficinas Clase A Premium" },
        { icon: Wifi, text: "Conectividad de fibra óptica de alta velocidad" },
        { icon: Coffee, text: "Cafetería ejecutiva y áreas de descanso" },
        { icon: ParkingCircle, text: "Estacionamiento subterráneo con seguridad 24/7" },
      ],
      directionsTitle: "Cómo Llegar",
      directionsText: "Torre SOMA Chapultepec está ubicada en el corazón de Polanco, uno de los distritos comerciales y residenciales más prestigiosos de la Ciudad de México. El edificio es fácilmente accesible desde todas las principales autopistas y transporte público.",
      landmarksTitle: "Puntos de Referencia Cercanos",
      landmarks: [
        "Castillo de Chapultepec (2 min en auto)",
        "Museo Nacional de Antropología (5 min en auto)",
        "Paseo de la Reforma (1 min caminando)",
        "Zona comercial de Polanco (5 min caminando)",
      ],
      galleryTitle: "Galería de Oficinas",
      gallerySubtitle: "Explore nuestro moderno espacio de trabajo colaborativo diseñado para la excelencia",
      facilitiesTitle: "Nuestras Instalaciones",
      facilitiesSubtitle: "Amenidades de última generación para nuestros clientes y equipo",
      meetingRoomsTitle: "Salas de Juntas",
      meetingRoomsDesc: "16 salas de juntas completamente equipadas que van desde espacios íntimos de consulta con clientes hasta grandes salas de conferencias, todas con tecnología avanzada de presentación y mobiliario confortable.",
      videoConferencingTitle: "Videoconferencias",
      videoConferencingDesc: "Instalaciones de videoconferencia de última generación que permiten una comunicación fluida con clientes y socios en todo el mundo, con personal de soporte técnico dedicado.",
      clientHospitalityTitle: "Hospitalidad para Clientes",
      clientHospitalityDesc: "Áreas de recepción ejecutivas con servicios de catering premium, salones privados para clientes y estacionamiento VIP para nuestros distinguidos visitantes.",
      accessibilityTitle: "Accesibilidad",
      accessibilityDesc: "Accesibilidad completa para sillas de ruedas en todas nuestras oficinas, incluyendo baños accesibles, elevadores y espacios de estacionamiento reservados.",
      transportTitle: "Transporte",
      transportSubtitle: "Múltiples opciones convenientes para llegar a nuestras oficinas",
      metroTitle: "Metro",
      metroDesc: "La estación de metro más cercana es Auditorio (Línea 7), aproximadamente a 10 minutos caminando. Alternativamente, la estación Polanco (Línea 7) también es accesible.",
      parkingTitle: "Estacionamiento",
      parkingDesc: "Estacionamiento subterráneo disponible en Torre SOMA con estacionamiento validado para clientes. Estacionamiento público adicional disponible cerca en Antara Fashion Hall y Palacio de Hierro Polanco.",
      taxiTitle: "Taxi / Uber",
      taxiDesc: "Solicite su viaje a 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. El edificio tiene un área designada para descenso en la entrada principal sobre Campos Elíseos.",
      contactCtaTitle: "¿Listo para Visitarnos?",
      contactCtaSubtitle: "Programe una reunión con nuestro equipo o contáctenos para más información sobre nuestros servicios legales.",
      contactButton: "Contáctenos",
      scheduleButton: "Programar una Reunión",
      headquarters: "Sede Central",
      viewOnMap: "Ver en el Mapa",
    },
    de: {
      heroTitle: "Unsere Büros",
      heroSubtitle: "Besuchen Sie uns in unseren modernen Einrichtungen in Mexiko-Stadt",
      mainOfficeTitle: "Hauptsitz Mexiko-Stadt",
      buildingName: "Torre SOMA Chapultepec",
      floor: "Etage 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "Mexiko-Stadt, Mexiko",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "Öffnungszeiten",
      officeHours: "Montag - Freitag: 9:00 - 19:00 Uhr (CST)",
      saturdayHours: "Samstag - Sonntag: Geschlossen",
      getDirections: "Anfahrt",
      amenitiesTitle: "Gebäudeausstattung",
      amenities: [
        { icon: Building2, text: "Premium Klasse A Bürogebäude" },
        { icon: Wifi, text: "Hochgeschwindigkeits-Glasfaserverbindung" },
        { icon: Coffee, text: "Executive-Cafeteria und Loungebereiche" },
        { icon: ParkingCircle, text: "Tiefgarage mit 24/7-Sicherheit" },
      ],
      directionsTitle: "Anfahrt",
      directionsText: "Torre SOMA Chapultepec befindet sich im Herzen von Polanco, einem der prestigeträchtigsten Geschäfts- und Wohnviertel von Mexiko-Stadt. Das Gebäude ist leicht von allen Hauptautobahnen und öffentlichen Verkehrsmitteln erreichbar.",
      landmarksTitle: "Sehenswürdigkeiten in der Nähe",
      landmarks: [
        "Schloss Chapultepec (2 Min. Fahrt)",
        "Nationales Museum für Anthropologie (5 Min. Fahrt)",
        "Paseo de la Reforma (1 Min. zu Fuß)",
        "Einkaufsviertel Polanco (5 Min. zu Fuß)",
      ],
      galleryTitle: "Bürogalerie",
      gallerySubtitle: "Erkunden Sie unseren modernen, kollaborativen Arbeitsraum, der für Exzellenz konzipiert ist",
      facilitiesTitle: "Unsere Einrichtungen",
      facilitiesSubtitle: "Modernste Ausstattung für unsere Mandanten und unser Team",
      meetingRoomsTitle: "Konferenzräume",
      meetingRoomsDesc: "16 voll ausgestattete Konferenzräume, von intimen Beratungsräumen bis hin zu großen Konferenzsälen, alle mit fortschrittlicher Präsentationstechnologie und komfortabler Einrichtung.",
      videoConferencingTitle: "Videokonferenzen",
      videoConferencingDesc: "Modernste Videokonferenzeinrichtungen für nahtlose Kommunikation mit Mandanten und Partnern weltweit, mit dediziertem technischen Support.",
      clientHospitalityTitle: "Mandantenbetreuung",
      clientHospitalityDesc: "Executive-Empfangsbereiche mit Premium-Catering-Service, private Mandanten-Lounges und VIP-Parkplätze für unsere geschätzten Gäste.",
      accessibilityTitle: "Barrierefreiheit",
      accessibilityDesc: "Vollständige Rollstuhlzugänglichkeit in unseren gesamten Büros, einschließlich barrierefreier Toiletten, Aufzüge und reservierter Parkplätze.",
      transportTitle: "Anreise",
      transportSubtitle: "Mehrere bequeme Optionen, um unsere Büros zu erreichen",
      metroTitle: "Metro",
      metroDesc: "Die nächste Metrostation ist Auditorio (Linie 7), etwa 10 Gehminuten entfernt. Alternativ ist auch die Station Polanco (Linie 7) erreichbar.",
      parkingTitle: "Parken",
      parkingDesc: "Tiefgarage im Torre SOMA mit validiertem Parken für Mandanten. Zusätzliche öffentliche Parkplätze in der Nähe bei Antara Fashion Hall und Palacio de Hierro Polanco.",
      taxiTitle: "Taxi / Uber",
      taxiDesc: "Bestellen Sie Ihre Fahrt zu 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. Das Gebäude hat eine ausgewiesene Abholzone am Haupteingang an der Campos Elíseos.",
      contactCtaTitle: "Bereit für einen Besuch?",
      contactCtaSubtitle: "Vereinbaren Sie ein Treffen mit unserem Team oder kontaktieren Sie uns für weitere Informationen über unsere Rechtsdienstleistungen.",
      contactButton: "Kontaktieren Sie uns",
      scheduleButton: "Termin vereinbaren",
      headquarters: "Hauptsitz",
      viewOnMap: "Auf Karte anzeigen",
    },
    zh: {
      heroTitle: "我们的办公室",
      heroSubtitle: "欢迎访问我们在墨西哥城的现代化设施",
      mainOfficeTitle: "墨西哥城总部",
      buildingName: "Torre SOMA Chapultepec",
      floor: "18层",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "墨西哥城，墨西哥",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "办公时间",
      officeHours: "周一至周五：上午9:00 - 下午7:00 (CST)",
      saturdayHours: "周六至周日：休息",
      getDirections: "获取路线",
      amenitiesTitle: "大楼设施",
      amenities: [
        { icon: Building2, text: "高端A级办公楼" },
        { icon: Wifi, text: "高速光纤连接" },
        { icon: Coffee, text: "行政餐厅和休息区" },
        { icon: ParkingCircle, text: "24/7安保地下停车场" },
      ],
      directionsTitle: "如何到达",
      directionsText: "Torre SOMA Chapultepec位于Polanco中心地带，这是墨西哥城最负盛名的商业和住宅区之一。从所有主要高速公路和公共交通均可轻松到达该建筑。",
      landmarksTitle: "附近地标",
      landmarks: [
        "查普尔特佩克城堡（车程2分钟）",
        "国家人类学博物馆（车程5分钟）",
        "改革大道（步行1分钟）",
        "Polanco购物区（步行5分钟）",
      ],
      galleryTitle: "办公室图库",
      gallerySubtitle: "探索我们为卓越而设计的现代化协作工作空间",
      facilitiesTitle: "我们的设施",
      facilitiesSubtitle: "为我们的客户和团队提供最先进的设施",
      meetingRoomsTitle: "会议室",
      meetingRoomsDesc: "16间设备齐全的会议室，从私密的客户咨询空间到大型会议厅，均配备先进的演示技术和舒适的家具。",
      videoConferencingTitle: "视频会议",
      videoConferencingDesc: "最先进的视频会议设施，可与全球客户和合作伙伴进行无缝沟通，并配有专业的技术支持人员。",
      clientHospitalityTitle: "客户接待",
      clientHospitalityDesc: "行政接待区提供高级餐饮服务、私人客户休息室以及为尊贵客人提供的贵宾停车位。",
      accessibilityTitle: "无障碍设施",
      accessibilityDesc: "办公室全区域轮椅无障碍通行，包括无障碍洗手间、电梯和预留停车位。",
      transportTitle: "交通",
      transportSubtitle: "多种便捷方式到达我们的办公室",
      metroTitle: "地铁",
      metroDesc: "最近的地铁站是Auditorio（7号线），步行约10分钟。或者，Polanco站（7号线）也可到达。",
      parkingTitle: "停车",
      parkingDesc: "Torre SOMA提供地下停车场，客户可享受停车验证服务。附近的Antara Fashion Hall和Palacio de Hierro Polanco也有公共停车场。",
      taxiTitle: "出租车 / Uber",
      taxiDesc: "请将目的地设为'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'。大楼在Campos Elíseos主入口处设有专门的下车区。",
      contactCtaTitle: "准备好访问了吗？",
      contactCtaSubtitle: "与我们的团队安排会议，或联系我们了解更多关于我们法律服务的信息。",
      contactButton: "联系我们",
      scheduleButton: "安排会议",
      headquarters: "总部",
      viewOnMap: "在地图上查看",
    },
    ko: {
      heroTitle: "사무실",
      heroSubtitle: "멕시코시티의 현대적인 시설을 방문해 주세요",
      mainOfficeTitle: "멕시코시티 본사",
      buildingName: "Torre SOMA Chapultepec",
      floor: "18층",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "멕시코시티, 멕시코",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "영업 시간",
      officeHours: "월요일 - 금요일: 오전 9:00 - 오후 7:00 (CST)",
      saturdayHours: "토요일 - 일요일: 휴무",
      getDirections: "길 찾기",
      amenitiesTitle: "건물 편의시설",
      amenities: [
        { icon: Building2, text: "프리미엄 A급 오피스 빌딩" },
        { icon: Wifi, text: "초고속 광섬유 연결" },
        { icon: Coffee, text: "임원 카페테리아 및 라운지" },
        { icon: ParkingCircle, text: "24시간 보안 지하 주차장" },
      ],
      directionsTitle: "오시는 길",
      directionsText: "Torre SOMA Chapultepec은 멕시코시티에서 가장 권위 있는 비즈니스 및 주거 지구 중 하나인 Polanco의 중심부에 위치해 있습니다. 모든 주요 고속도로와 대중교통에서 쉽게 접근할 수 있습니다.",
      landmarksTitle: "인근 랜드마크",
      landmarks: [
        "차풀테펙 성 (차로 2분)",
        "국립 인류학 박물관 (차로 5분)",
        "레포르마 대로 (도보 1분)",
        "폴랑코 쇼핑 지구 (도보 5분)",
      ],
      galleryTitle: "사무실 갤러리",
      gallerySubtitle: "탁월함을 위해 설계된 현대적이고 협업적인 작업 공간을 탐색하세요",
      facilitiesTitle: "시설",
      facilitiesSubtitle: "고객과 팀을 위한 최첨단 편의시설",
      meetingRoomsTitle: "회의실",
      meetingRoomsDesc: "친밀한 고객 상담 공간부터 대형 컨퍼런스홀까지 첨단 프레젠테이션 기술과 편안한 가구를 갖춘 16개의 완비된 회의실.",
      videoConferencingTitle: "화상 회의",
      videoConferencingDesc: "전 세계 고객 및 파트너와 원활한 소통을 가능하게 하는 최첨단 화상 회의 시설과 전담 기술 지원 직원.",
      clientHospitalityTitle: "고객 환대",
      clientHospitalityDesc: "프리미엄 케이터링 서비스가 제공되는 임원 리셉션 구역, 프라이빗 고객 라운지, 귀빈을 위한 VIP 주차장.",
      accessibilityTitle: "접근성",
      accessibilityDesc: "접근 가능한 화장실, 엘리베이터, 예약 주차 공간을 포함한 사무실 전체의 완전한 휠체어 접근성.",
      transportTitle: "교통",
      transportSubtitle: "사무실에 도착하는 다양한 편리한 옵션",
      metroTitle: "지하철",
      metroDesc: "가장 가까운 지하철역은 Auditorio (7호선)으로 도보 약 10분 거리입니다. Polanco역 (7호선)도 이용 가능합니다.",
      parkingTitle: "주차",
      parkingDesc: "Torre SOMA에서 고객을 위한 검증된 주차가 가능한 지하 주차장을 이용할 수 있습니다. 근처 Antara Fashion Hall과 Palacio de Hierro Polanco에서 추가 공공 주차가 가능합니다.",
      taxiTitle: "택시 / Uber",
      taxiDesc: "'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'로 차량을 요청하세요. 건물에는 Campos Elíseos의 정문에 지정된 하차 구역이 있습니다.",
      contactCtaTitle: "방문 준비가 되셨나요?",
      contactCtaSubtitle: "저희 팀과의 미팅을 예약하거나 법률 서비스에 대한 자세한 정보를 문의해 주세요.",
      contactButton: "문의하기",
      scheduleButton: "미팅 예약",
      headquarters: "본사",
      viewOnMap: "지도에서 보기",
    },
    ja: {
      heroTitle: "オフィス",
      heroSubtitle: "メキシコシティの最新設備でお待ちしております",
      mainOfficeTitle: "メキシコシティ本社",
      buildingName: "Torre SOMA Chapultepec",
      floor: "18階",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "メキシコシティ、メキシコ",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "営業時間",
      officeHours: "月曜日〜金曜日：午前9:00〜午後7:00（CST）",
      saturdayHours: "土曜日〜日曜日：休業",
      getDirections: "道順を見る",
      amenitiesTitle: "ビル設備",
      amenities: [
        { icon: Building2, text: "プレミアムクラスAオフィスビル" },
        { icon: Wifi, text: "高速光ファイバー接続" },
        { icon: Coffee, text: "エグゼクティブカフェテリアとラウンジエリア" },
        { icon: ParkingCircle, text: "24時間セキュリティ付き地下駐車場" },
      ],
      directionsTitle: "アクセス",
      directionsText: "Torre SOMA Chapultepecは、メキシコシティで最も権威あるビジネス・住宅地区の一つであるポランコの中心部に位置しています。主要高速道路および公共交通機関から簡単にアクセスできます。",
      landmarksTitle: "近くのランドマーク",
      landmarks: [
        "チャプルテペック城（車で2分）",
        "国立人類学博物館（車で5分）",
        "レフォルマ通り（徒歩1分）",
        "ポランコショッピング地区（徒歩5分）",
      ],
      galleryTitle: "オフィスギャラリー",
      gallerySubtitle: "卓越性のために設計されたモダンで協調的なワークスペースをご覧ください",
      facilitiesTitle: "施設",
      facilitiesSubtitle: "お客様とチームのための最先端の設備",
      meetingRoomsTitle: "会議室",
      meetingRoomsDesc: "プライベートなクライアント相談スペースから大規模な会議ホールまで、高度なプレゼンテーション技術と快適な家具を備えた16の完備された会議室。",
      videoConferencingTitle: "ビデオ会議",
      videoConferencingDesc: "世界中のクライアントやパートナーとのシームレスなコミュニケーションを可能にする最先端のビデオ会議設備と専任の技術サポートスタッフ。",
      clientHospitalityTitle: "クライアントホスピタリティ",
      clientHospitalityDesc: "プレミアムケータリングサービス付きのエグゼクティブレセプションエリア、プライベートクライアントラウンジ、VIP駐車場。",
      accessibilityTitle: "アクセシビリティ",
      accessibilityDesc: "バリアフリートイレ、エレベーター、予約駐車スペースを含む、オフィス全体での完全な車椅子アクセス。",
      transportTitle: "交通",
      transportSubtitle: "オフィスへの便利なアクセス方法",
      metroTitle: "地下鉄",
      metroDesc: "最寄りの地下鉄駅はAuditorio（7号線）で、徒歩約10分です。または、Polanco駅（7号線）も利用可能です。",
      parkingTitle: "駐車場",
      parkingDesc: "Torre SOMAには、お客様向けのバリデーション駐車可能な地下駐車場があります。近くのAntara Fashion HallやPalacio de Hierro Polancoでも公共駐車場を利用できます。",
      taxiTitle: "タクシー / Uber",
      taxiDesc: "'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'へ配車を依頼してください。建物にはCampos Elíseosのメインエントランスに専用の降車エリアがあります。",
      contactCtaTitle: "訪問の準備はできましたか？",
      contactCtaSubtitle: "私たちのチームとのミーティングをスケジュールするか、法的サービスの詳細についてお問い合わせください。",
      contactButton: "お問い合わせ",
      scheduleButton: "ミーティングを予約",
      headquarters: "本社",
      viewOnMap: "地図で見る",
    },
    ar: {
      heroTitle: "مكاتبنا",
      heroSubtitle: "زورونا في مرافقنا الحديثة في مدينة مكسيكو",
      mainOfficeTitle: "المقر الرئيسي في مدينة مكسيكو",
      buildingName: "Torre SOMA Chapultepec",
      floor: "الطابق 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "مدينة مكسيكو، المكسيك",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "ساعات العمل",
      officeHours: "الاثنين - الجمعة: 9:00 صباحاً - 7:00 مساءً (CST)",
      saturdayHours: "السبت - الأحد: مغلق",
      getDirections: "احصل على الاتجاهات",
      amenitiesTitle: "مرافق المبنى",
      amenities: [
        { icon: Building2, text: "مبنى مكاتب من الدرجة الأولى" },
        { icon: Wifi, text: "اتصال ألياف ضوئية عالي السرعة" },
        { icon: Coffee, text: "كافيتريا تنفيذية ومناطق صالة" },
        { icon: ParkingCircle, text: "موقف سيارات تحت الأرض مع أمن على مدار الساعة" },
      ],
      directionsTitle: "كيفية الوصول",
      directionsText: "يقع Torre SOMA Chapultepec في قلب بولانكو، أحد أرقى المناطق التجارية والسكنية في مدينة مكسيكو. يمكن الوصول إلى المبنى بسهولة من جميع الطرق السريعة الرئيسية ووسائل النقل العام.",
      landmarksTitle: "المعالم القريبة",
      landmarks: [
        "قلعة تشابولتيبيك (دقيقتان بالسيارة)",
        "المتحف الوطني للأنثروبولوجيا (5 دقائق بالسيارة)",
        "باسيو دي لا ريفورما (دقيقة واحدة سيراً)",
        "منطقة تسوق بولانكو (5 دقائق سيراً)",
      ],
      galleryTitle: "معرض المكتب",
      gallerySubtitle: "استكشف مساحة العمل الحديثة والتعاونية المصممة للتميز",
      facilitiesTitle: "مرافقنا",
      facilitiesSubtitle: "مرافق متطورة لعملائنا وفريقنا",
      meetingRoomsTitle: "غرف الاجتماعات",
      meetingRoomsDesc: "16 غرفة اجتماعات مجهزة بالكامل تتراوح من مساحات استشارات العملاء الخاصة إلى قاعات المؤتمرات الكبيرة، جميعها مزودة بتقنية عرض متقدمة وأثاث مريح.",
      videoConferencingTitle: "مؤتمرات الفيديو",
      videoConferencingDesc: "مرافق مؤتمرات فيديو متطورة تتيح التواصل السلس مع العملاء والشركاء في جميع أنحاء العالم، مع طاقم دعم تقني مخصص.",
      clientHospitalityTitle: "ضيافة العملاء",
      clientHospitalityDesc: "مناطق استقبال تنفيذية مع خدمات تموين متميزة، وصالات خاصة للعملاء، ومواقف سيارات VIP لضيوفنا المميزين.",
      accessibilityTitle: "إمكانية الوصول",
      accessibilityDesc: "إمكانية وصول كاملة للكراسي المتحركة في جميع أنحاء مكاتبنا، بما في ذلك الحمامات والمصاعد ومواقف السيارات المحجوزة.",
      transportTitle: "المواصلات",
      transportSubtitle: "خيارات متعددة مريحة للوصول إلى مكاتبنا",
      metroTitle: "المترو",
      metroDesc: "أقرب محطة مترو هي Auditorio (الخط 7)، على بعد حوالي 10 دقائق سيراً على الأقدام. بدلاً من ذلك، يمكن الوصول إلى محطة Polanco (الخط 7) أيضاً.",
      parkingTitle: "مواقف السيارات",
      parkingDesc: "يتوفر موقف سيارات تحت الأرض في Torre SOMA مع تصديق لمواقف العملاء. تتوفر مواقف سيارات عامة إضافية بالقرب من Antara Fashion Hall و Palacio de Hierro Polanco.",
      taxiTitle: "تاكسي / أوبر",
      taxiDesc: "اطلب رحلتك إلى 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. يحتوي المبنى على منطقة إنزال مخصصة عند المدخل الرئيسي على Campos Elíseos.",
      contactCtaTitle: "مستعد للزيارة؟",
      contactCtaSubtitle: "حدد موعداً لاجتماع مع فريقنا أو اتصل بنا للحصول على مزيد من المعلومات حول خدماتنا القانونية.",
      contactButton: "اتصل بنا",
      scheduleButton: "جدولة اجتماع",
      headquarters: "المقر الرئيسي",
      viewOnMap: "عرض على الخريطة",
    },
    ru: {
      heroTitle: "Наши офисы",
      heroSubtitle: "Посетите нас в наших современных помещениях в Мехико",
      mainOfficeTitle: "Штаб-квартира в Мехико",
      buildingName: "Torre SOMA Chapultepec",
      floor: "Этаж 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "Мехико, Мексика",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "Часы работы",
      officeHours: "Понедельник - Пятница: 9:00 - 19:00 (CST)",
      saturdayHours: "Суббота - Воскресенье: Закрыто",
      getDirections: "Как добраться",
      amenitiesTitle: "Удобства здания",
      amenities: [
        { icon: Building2, text: "Офисное здание премиум-класса А" },
        { icon: Wifi, text: "Высокоскоростное оптоволоконное соединение" },
        { icon: Coffee, text: "Кафетерий и лаунж-зоны для руководителей" },
        { icon: ParkingCircle, text: "Подземная парковка с охраной 24/7" },
      ],
      directionsTitle: "Как добраться",
      directionsText: "Torre SOMA Chapultepec расположен в самом сердце Поланко, одного из самых престижных деловых и жилых районов Мехико. До здания легко добраться со всех основных автомагистралей и на общественном транспорте.",
      landmarksTitle: "Ближайшие достопримечательности",
      landmarks: [
        "Замок Чапультепек (2 мин на машине)",
        "Национальный музей антропологии (5 мин на машине)",
        "Paseo de la Reforma (1 мин пешком)",
        "Торговый район Поланко (5 мин пешком)",
      ],
      galleryTitle: "Галерея офиса",
      gallerySubtitle: "Изучите наше современное рабочее пространство для совместной работы, созданное для достижения превосходства",
      facilitiesTitle: "Наши помещения",
      facilitiesSubtitle: "Современное оборудование для наших клиентов и команды",
      meetingRoomsTitle: "Переговорные комнаты",
      meetingRoomsDesc: "16 полностью оборудованных переговорных комнат от небольших помещений для консультаций до больших конференц-залов с передовыми презентационными технологиями и комфортной мебелью.",
      videoConferencingTitle: "Видеоконференции",
      videoConferencingDesc: "Современные средства видеоконференцсвязи для бесперебойного общения с клиентами и партнерами по всему миру с выделенным техническим персоналом.",
      clientHospitalityTitle: "Гостеприимство для клиентов",
      clientHospitalityDesc: "Представительские приемные с услугами премиум-кейтеринга, приватные клиентские лаунжи и VIP-парковка для наших уважаемых гостей.",
      accessibilityTitle: "Доступность",
      accessibilityDesc: "Полная доступность для инвалидных колясок во всех офисах, включая доступные туалеты, лифты и зарезервированные парковочные места.",
      transportTitle: "Транспорт",
      transportSubtitle: "Несколько удобных способов добраться до наших офисов",
      metroTitle: "Метро",
      metroDesc: "Ближайшая станция метро — Auditorio (Линия 7), примерно в 10 минутах ходьбы. Также доступна станция Polanco (Линия 7).",
      parkingTitle: "Парковка",
      parkingDesc: "Подземная парковка в Torre SOMA с валидацией для клиентов. Дополнительная публичная парковка рядом в Antara Fashion Hall и Palacio de Hierro Polanco.",
      taxiTitle: "Такси / Uber",
      taxiDesc: "Укажите адрес 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. У здания есть специальная зона высадки у главного входа на Campos Elíseos.",
      contactCtaTitle: "Готовы посетить нас?",
      contactCtaSubtitle: "Запланируйте встречу с нашей командой или свяжитесь с нами для получения дополнительной информации о наших юридических услугах.",
      contactButton: "Связаться с нами",
      scheduleButton: "Запланировать встречу",
      headquarters: "Штаб-квартира",
      viewOnMap: "На карте",
    },
    fr: {
      heroTitle: "Nos Bureaux",
      heroSubtitle: "Visitez-nous dans nos installations modernes à Mexico",
      mainOfficeTitle: "Siège social de Mexico",
      buildingName: "Torre SOMA Chapultepec",
      floor: "Étage 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "Mexico, Mexique",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "Heures d'ouverture",
      officeHours: "Lundi - Vendredi : 9h00 - 19h00 (CST)",
      saturdayHours: "Samedi - Dimanche : Fermé",
      getDirections: "Obtenir l'itinéraire",
      amenitiesTitle: "Équipements du bâtiment",
      amenities: [
        { icon: Building2, text: "Immeuble de bureaux Premium Classe A" },
        { icon: Wifi, text: "Connectivité fibre optique haut débit" },
        { icon: Coffee, text: "Cafétéria exécutive et espaces lounge" },
        { icon: ParkingCircle, text: "Parking souterrain avec sécurité 24h/24" },
      ],
      directionsTitle: "Comment s'y rendre",
      directionsText: "Torre SOMA Chapultepec est situé au cœur de Polanco, l'un des quartiers d'affaires et résidentiels les plus prestigieux de Mexico. Le bâtiment est facilement accessible depuis toutes les principales autoroutes et transports en commun.",
      landmarksTitle: "Points de repère à proximité",
      landmarks: [
        "Château de Chapultepec (2 min en voiture)",
        "Musée national d'anthropologie (5 min en voiture)",
        "Paseo de la Reforma (1 min à pied)",
        "Quartier commerçant de Polanco (5 min à pied)",
      ],
      galleryTitle: "Galerie du bureau",
      gallerySubtitle: "Explorez notre espace de travail moderne et collaboratif conçu pour l'excellence",
      facilitiesTitle: "Nos installations",
      facilitiesSubtitle: "Équipements de pointe pour nos clients et notre équipe",
      meetingRoomsTitle: "Salles de réunion",
      meetingRoomsDesc: "16 salles de réunion entièrement équipées allant des espaces de consultation intime aux grandes salles de conférence, toutes dotées de technologie de présentation avancée et de mobilier confortable.",
      videoConferencingTitle: "Vidéoconférence",
      videoConferencingDesc: "Installations de vidéoconférence de pointe permettant une communication fluide avec les clients et partenaires du monde entier, avec une équipe de support technique dédiée.",
      clientHospitalityTitle: "Hospitalité client",
      clientHospitalityDesc: "Espaces de réception exécutifs avec services de restauration premium, salons clients privés et parking VIP pour nos invités distingués.",
      accessibilityTitle: "Accessibilité",
      accessibilityDesc: "Accessibilité complète en fauteuil roulant dans tous nos bureaux, y compris les toilettes accessibles, les ascenseurs et les places de parking réservées.",
      transportTitle: "Transport",
      transportSubtitle: "Plusieurs options pratiques pour rejoindre nos bureaux",
      metroTitle: "Métro",
      metroDesc: "La station de métro la plus proche est Auditorio (Ligne 7), à environ 10 minutes à pied. La station Polanco (Ligne 7) est également accessible.",
      parkingTitle: "Stationnement",
      parkingDesc: "Parking souterrain disponible à Torre SOMA avec validation pour les clients. Parking public supplémentaire à proximité à Antara Fashion Hall et Palacio de Hierro Polanco.",
      taxiTitle: "Taxi / Uber",
      taxiDesc: "Demandez votre course vers 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. Le bâtiment dispose d'une zone de dépose désignée à l'entrée principale sur Campos Elíseos.",
      contactCtaTitle: "Prêt à nous rendre visite ?",
      contactCtaSubtitle: "Planifiez une réunion avec notre équipe ou contactez-nous pour plus d'informations sur nos services juridiques.",
      contactButton: "Contactez-nous",
      scheduleButton: "Planifier une réunion",
      headquarters: "Siège social",
      viewOnMap: "Voir sur la carte",
    },
    it: {
      heroTitle: "I Nostri Uffici",
      heroSubtitle: "Visitateci nelle nostre strutture moderne a Città del Messico",
      mainOfficeTitle: "Sede centrale di Città del Messico",
      buildingName: "Torre SOMA Chapultepec",
      floor: "Piano 18",
      address: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      postalCode: "C.P. 11560",
      city: "Città del Messico, Messico",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      officeHoursTitle: "Orari di ufficio",
      officeHours: "Lunedì - Venerdì: 9:00 - 19:00 (CST)",
      saturdayHours: "Sabato - Domenica: Chiuso",
      getDirections: "Ottieni indicazioni",
      amenitiesTitle: "Servizi dell'edificio",
      amenities: [
        { icon: Building2, text: "Edificio per uffici Premium Classe A" },
        { icon: Wifi, text: "Connettività in fibra ottica ad alta velocità" },
        { icon: Coffee, text: "Caffetteria executive e aree lounge" },
        { icon: ParkingCircle, text: "Parcheggio sotterraneo con sicurezza 24/7" },
      ],
      directionsTitle: "Come arrivare",
      directionsText: "Torre SOMA Chapultepec si trova nel cuore di Polanco, uno dei quartieri commerciali e residenziali più prestigiosi di Città del Messico. L'edificio è facilmente raggiungibile da tutte le principali autostrade e trasporti pubblici.",
      landmarksTitle: "Punti di riferimento nelle vicinanze",
      landmarks: [
        "Castello di Chapultepec (2 min in auto)",
        "Museo Nazionale di Antropologia (5 min in auto)",
        "Paseo de la Reforma (1 min a piedi)",
        "Quartiere commerciale di Polanco (5 min a piedi)",
      ],
      galleryTitle: "Galleria dell'ufficio",
      gallerySubtitle: "Esplora il nostro spazio di lavoro moderno e collaborativo progettato per l'eccellenza",
      facilitiesTitle: "Le nostre strutture",
      facilitiesSubtitle: "Servizi all'avanguardia per i nostri clienti e il team",
      meetingRoomsTitle: "Sale riunioni",
      meetingRoomsDesc: "16 sale riunioni completamente attrezzate che vanno da spazi di consultazione intimi a grandi sale conferenze, tutte dotate di tecnologia di presentazione avanzata e arredi confortevoli.",
      videoConferencingTitle: "Videoconferenza",
      videoConferencingDesc: "Strutture di videoconferenza all'avanguardia che consentono una comunicazione fluida con clienti e partner in tutto il mondo, con personale di supporto tecnico dedicato.",
      clientHospitalityTitle: "Ospitalità clienti",
      clientHospitalityDesc: "Aree reception executive con servizi di catering premium, lounge private per i clienti e parcheggio VIP per i nostri ospiti distinti.",
      accessibilityTitle: "Accessibilità",
      accessibilityDesc: "Piena accessibilità per sedie a rotelle in tutti i nostri uffici, inclusi bagni accessibili, ascensori e posti auto riservati.",
      transportTitle: "Trasporti",
      transportSubtitle: "Molteplici opzioni comode per raggiungere i nostri uffici",
      metroTitle: "Metro",
      metroDesc: "La stazione della metropolitana più vicina è Auditorio (Linea 7), a circa 10 minuti a piedi. In alternativa, è accessibile anche la stazione Polanco (Linea 7).",
      parkingTitle: "Parcheggio",
      parkingDesc: "Parcheggio sotterraneo disponibile a Torre SOMA con convalida parcheggio per i clienti. Parcheggio pubblico aggiuntivo disponibile nelle vicinanze presso Antara Fashion Hall e Palacio de Hierro Polanco.",
      taxiTitle: "Taxi / Uber",
      taxiDesc: "Richiedi la tua corsa a 'Torre SOMA Chapultepec, Campos Elíseos 204, Polanco'. L'edificio ha un'area di discesa designata all'ingresso principale su Campos Elíseos.",
      contactCtaTitle: "Pronti a visitarci?",
      contactCtaSubtitle: "Programmate un incontro con il nostro team o contattateci per maggiori informazioni sui nostri servizi legali.",
      contactButton: "Contattaci",
      scheduleButton: "Programma un incontro",
      headquarters: "Sede centrale",
      viewOnMap: "Vedi sulla mappa",
    },
  };

  const t = content[language] || content.en;

  const googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.661068768984!2d-99.19441!3d19.4325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff5f5c0c3e1b%3A0x7c0c7c7c7c7c7c7c!2sTorre%20SOMA%20Chapultepec!5e0!3m2!1ses!2smx!4v1700000000000!5m2!1ses!2smx";
  const googleMapsDirectionsUrl = "https://www.google.com/maps/dir//Torre+SOMA+Chapultepec,+Campos+El%C3%ADseos+204,+Polanco,+11560+Ciudad+de+M%C3%A9xico,+CDMX,+Mexico";

  return (
    <div data-testid="page-offices" className="vw-old">
      <SEOHead page="offices" language={language} />

      <PageHero
        eyebrow="Von Wobeser y Sierra"
        title={t.heroTitle}
        subtitle={t.heroSubtitle}
        data-testid="section-offices-hero"
      />

      {/* Oficina principal: info + mapa */}
      <Section tone="white" data-testid="section-main-office">
        <SectionTitle>{t.mainOfficeTitle}</SectionTitle>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="order-2 border border-vw-graylight bg-white p-6 lg:order-1 lg:p-8" data-testid="card-office-info">
            <div className="mb-6 flex items-start gap-4">
              <Building2 className="mt-1 h-6 w-6 flex-shrink-0 text-vw-red" aria-hidden="true" />
              <div>
                <h3 className="font-serif text-xl text-vw-black" data-testid="text-building-name">
                  {t.buildingName}
                </h3>
                <p className="font-sans text-vw-gray" data-testid="text-floor">{t.floor}</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-vw-graylight pt-6">
              <div className="flex items-start gap-3" data-testid="text-full-address">
                <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
                <div className="font-sans text-vw-gray">
                  <p>{t.address}</p>
                  <p>{t.colony}</p>
                  <p>{t.postalCode}</p>
                  <p>{t.city}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
                <a
                  href={`tel:${t.phone.replace(/\s/g, "")}`}
                  className="font-sans text-vw-black transition-colors hover:text-vw-red"
                  data-testid="link-phone"
                >
                  {t.phone}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 flex-shrink-0 text-vw-graylight" aria-hidden="true" />
                <span className="font-sans text-vw-gray">
                  Fax: <span data-testid="text-fax">{t.fax}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
                <a
                  href={`mailto:${t.email}`}
                  className="font-sans text-vw-black transition-colors hover:text-vw-red"
                  data-testid="link-email"
                >
                  {t.email}
                </a>
              </div>
            </div>

            <div className="mt-6 border-t border-vw-graylight pt-6">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
                <div className="font-sans">
                  <p className="text-vw-black">{t.officeHoursTitle}</p>
                  <p className="text-sm text-vw-gray" data-testid="text-office-hours">{t.officeHours}</p>
                  <p className="text-sm text-vw-gray">{t.saturdayHours}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-vw-graylight pt-6">
              <p className="vw-label mb-4 text-[11px] text-vw-gray">{t.amenitiesTitle}</p>
              <div className="space-y-3">
                {t.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-3" data-testid={`amenity-${index}`}>
                    <amenity.icon className="h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
                    <span className="font-sans text-sm text-vw-gray">{amenity.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vw-label mt-6 inline-flex items-center gap-2 rounded-none bg-vw-red px-8 py-3.5 text-xs text-white transition-colors hover:bg-vw-black"
              data-testid="button-directions"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              {t.getDirections}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="order-1 lg:order-2">
            <div
              className="h-[400px] w-full overflow-hidden border border-vw-graylight lg:h-full lg:min-h-[400px]"
              data-testid="container-map"
            >
              <iframe
                src={googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Von Wobeser y Sierra Office Location"
                data-testid="iframe-google-maps"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Cómo llegar + puntos de referencia */}
      <Section tone="gray" data-testid="section-directions">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2">
          <div>
            <SectionTitle>{t.directionsTitle}</SectionTitle>
            <p className="font-sans text-lg leading-relaxed text-vw-gray">{t.directionsText}</p>
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-vw-red" aria-hidden="true" />
              <span className="vw-label text-[11px] text-vw-gray">{t.landmarksTitle}</span>
            </div>
            <ul className="space-y-2">
              {t.landmarks.map((landmark, index) => (
                <li
                  key={index}
                  className="flex items-center gap-3 font-sans text-vw-gray"
                  data-testid={`landmark-${index}`}
                >
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-vw-red" aria-hidden="true" />
                  {landmark}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Galería */}
      <Section tone="white" data-testid="section-gallery">
        <SectionTitle>{t.galleryTitle}</SectionTitle>
        <p className="mb-8 max-w-2xl font-sans text-vw-gray">{t.gallerySubtitle}</p>

        {imagesLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid="skeleton-gallery">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[4/3] bg-[#e8e8e8]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" data-testid="grid-gallery">
            {officeImages?.map((image) => (
              <button
                key={image.id}
                type="button"
                className="group aspect-[4/3] cursor-pointer overflow-hidden"
                onClick={() => setSelectedImage(image)}
                data-testid={`gallery-image-${image.id}`}
              >
                <img
                  src={image.imageUrl}
                  alt={language === "es" ? image.altEs : image.alt}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </Section>

      {/* Instalaciones */}
      <Section tone="gray" data-testid="section-facilities">
        <SectionTitle>{t.facilitiesTitle}</SectionTitle>
        <p className="mb-8 max-w-2xl font-sans text-vw-gray">{t.facilitiesSubtitle}</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FeatureCard icon={Users} title={t.meetingRoomsTitle} data-testid="card-meeting-rooms">
            {t.meetingRoomsDesc}
          </FeatureCard>
          <FeatureCard icon={Video} title={t.videoConferencingTitle} data-testid="card-video-conferencing">
            {t.videoConferencingDesc}
          </FeatureCard>
          <FeatureCard icon={Coffee} title={t.clientHospitalityTitle} data-testid="card-client-hospitality">
            {t.clientHospitalityDesc}
          </FeatureCard>
          <FeatureCard icon={Accessibility} title={t.accessibilityTitle} data-testid="card-accessibility">
            {t.accessibilityDesc}
          </FeatureCard>
        </div>
      </Section>

      {/* Transporte */}
      <Section tone="white" data-testid="section-transport">
        <SectionTitle>{t.transportTitle}</SectionTitle>
        <p className="mb-8 max-w-2xl font-sans text-vw-gray">{t.transportSubtitle}</p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard icon={Train} title={t.metroTitle} data-testid="card-metro">
            {t.metroDesc}
          </FeatureCard>
          <FeatureCard icon={ParkingCircle} title={t.parkingTitle} data-testid="card-parking">
            {t.parkingDesc}
          </FeatureCard>
          <FeatureCard icon={Car} title={t.taxiTitle} data-testid="card-taxi">
            {t.taxiDesc}
          </FeatureCard>
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-vw-black py-16 md:py-24" data-testid="section-contact-cta">
        <div className="vw-wrap text-center">
          <h2 className="mb-4 font-serif text-3xl text-white md:text-4xl">{t.contactCtaTitle}</h2>
          <p className="mx-auto mb-10 max-w-2xl font-sans text-lg leading-relaxed text-white/70">
            {t.contactCtaSubtitle}
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="vw-label inline-flex items-center justify-center gap-2 rounded-none bg-vw-red px-8 py-3.5 text-xs text-white transition-colors hover:bg-white hover:text-vw-black"
              data-testid="button-contact"
            >
              {t.contactButton}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="vw-label inline-flex items-center justify-center gap-2 rounded-none border border-white/40 px-8 py-3.5 text-xs text-white transition-colors hover:border-vw-red hover:text-vw-red"
              data-testid="button-schedule"
            >
              {t.scheduleButton}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Lightbox de galería */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={language === "es" ? selectedImage.altEs : selectedImage.alt}
          data-testid="modal-image-lightbox"
        >
          <div className="relative w-full max-w-5xl">
            <img
              src={selectedImage.imageUrl}
              alt={language === "es" ? selectedImage.altEs : selectedImage.alt}
              className="h-auto max-h-[80vh] w-full object-contain"
            />
            <button
              ref={closeButtonRef}
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={language === "es" ? "Cerrar" : "Close"}
              data-testid="button-close-lightbox"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
