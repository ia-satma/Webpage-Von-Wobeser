import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
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
  Wifi,
  ParkingCircle,
  Navigation,
  ExternalLink,
  ArrowRight,
  Landmark
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-offices">
      <SEOHead page="offices" language={language} />
      <Header />
      
      <section className="pt-36 pb-20 bg-[#1a1a19]" data-testid="section-offices-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="h-0.5 w-12 bg-primary mx-auto mb-6" />
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-5 uppercase tracking-[0.15em]"
              data-testid="text-offices-title"
            >
              {t.heroTitle}
            </h1>
            <p 
              className="text-base text-white/60 max-w-2xl mx-auto"
              data-testid="text-offices-subtitle"
            >
              {t.heroSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-20"
            data-testid="section-main-office"
          >
            <h2 className="text-2xl font-heading font-light text-foreground mb-8 text-center uppercase tracking-[0.12em]">
              {t.mainOfficeTitle}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="order-2 lg:order-1">
                <Card className="h-full rounded-none border border-border" data-testid="card-office-info">
                  <CardContent className="p-6 lg:p-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-1" data-testid="text-building-name">
                          {t.buildingName}
                        </h3>
                        <p className="text-muted-foreground" data-testid="text-floor">{t.floor}</p>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-border pt-6">
                      <div className="flex items-start gap-3" data-testid="text-full-address">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-foreground">
                          <p>{t.address}</p>
                          <p>{t.colony}</p>
                          <p>{t.postalCode}</p>
                          <p>{t.city}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="text-foreground">
                          <a 
                            href={`tel:${t.phone.replace(/\s/g, "")}`} 
                            className="hover:text-primary transition-colors"
                            data-testid="link-phone"
                          >
                            {t.phone}
                          </a>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="text-foreground">
                          <span className="text-sm text-gray-500">Fax: </span>
                          <span data-testid="text-fax">{t.fax}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                        <a 
                          href={`mailto:${t.email}`}
                          className="text-foreground hover:text-primary transition-colors"
                          data-testid="link-email"
                        >
                          {t.email}
                        </a>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <div className="flex items-start gap-3 mb-2">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-foreground mb-1">{t.officeHoursTitle}</h4>
                          <p className="text-muted-foreground text-sm" data-testid="text-office-hours">{t.officeHours}</p>
                          <p className="text-gray-500 dark:text-gray-500 text-sm">{t.saturdayHours}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h4 className="font-medium text-foreground mb-4">{t.amenitiesTitle}</h4>
                      <div className="space-y-3">
                        {t.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-3" data-testid={`amenity-${index}`}>
                            <amenity.icon className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground text-sm">{amenity.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full rounded-none mt-4" 
                      asChild
                      data-testid="button-directions"
                    >
                      <a 
                        href={googleMapsDirectionsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        {t.getDirections}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="order-1 lg:order-2">
                <div 
                  className="w-full h-[400px] lg:h-full min-h-[400px] rounded-none overflow-hidden border border-border"
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
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-20 bg-muted rounded-none p-8 lg:p-12"
            data-testid="section-directions"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]">
                  {t.directionsTitle}
                </h3>
                <p className="text-foreground leading-relaxed mb-6">
                  {t.directionsText}
                </p>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-medium text-foreground mb-4">
                  <Landmark className="w-5 h-5 text-primary" />
                  {t.landmarksTitle}
                </h4>
                <ul className="space-y-2">
                  {t.landmarks.map((landmark, index) => (
                    <li key={index} className="flex items-center gap-3 text-muted-foreground" data-testid={`landmark-${index}`}>
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      {landmark}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-20"
            data-testid="section-gallery"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]">
                {t.galleryTitle}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.gallerySubtitle}
              </p>
            </div>

            {imagesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="skeleton-gallery">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[4/3] rounded-none" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="grid-gallery">
                {officeImages?.map((image, index) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="aspect-[4/3] rounded-none overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedImage(image)}
                    data-testid={`gallery-image-${image.id}`}
                  >
                    <img
                      src={image.imageUrl}
                      alt={language === "es" ? image.altEs : image.alt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>

          <motion.section
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mb-20"
            data-testid="section-facilities"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]">
                {t.facilitiesTitle}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.facilitiesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-none border border-border" data-testid="card-meeting-rooms">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {t.meetingRoomsTitle}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t.meetingRoomsDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-none border border-border" data-testid="card-video-conferencing">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Video className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {t.videoConferencingTitle}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t.videoConferencingDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-none border border-border" data-testid="card-client-hospitality">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coffee className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {t.clientHospitalityTitle}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t.clientHospitalityDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-none border border-border" data-testid="card-accessibility">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Accessibility className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {t.accessibilityTitle}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {t.accessibilityDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-20"
            data-testid="section-transport"
          >
            <div className="text-center mb-10">
              <h2 className="text-2xl font-heading font-light text-foreground mb-4 uppercase tracking-[0.12em]">
                {t.transportTitle}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t.transportSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-none border border-border" data-testid="card-metro">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Train className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t.metroTitle}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.metroDesc}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-none border border-border" data-testid="card-parking">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ParkingCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t.parkingTitle}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.parkingDesc}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-none border border-border" data-testid="card-taxi">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Car className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {t.taxiTitle}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t.taxiDesc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-primary rounded-none p-8 lg:p-12 text-center"
            data-testid="section-contact-cta"
          >
            <h2 className="text-2xl font-heading font-light text-white mb-4 uppercase tracking-[0.12em]">
              {t.contactCtaTitle}
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">
              {t.contactCtaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="rounded-none gap-2"
                  data-testid="button-contact"
                >
                  {t.contactButton}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-none gap-2 border-white text-white hover:bg-white/10"
                  data-testid="button-schedule"
                >
                  {t.scheduleButton}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.section>
        </div>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="modal-image-lightbox"
        >
          <div className="relative max-w-5xl w-full">
            <img
              src={selectedImage.imageUrl}
              alt={language === "es" ? selectedImage.altEs : selectedImage.alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-none"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
              data-testid="button-close-lightbox"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
