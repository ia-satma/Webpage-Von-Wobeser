import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

import collage01 from "@assets/collage_01.jpg";
import collage02 from "@assets/collage_02.jpg";
import collage03 from "@assets/collage_03.jpg";
import collage04 from "@assets/collage_04.jpg";
import collage05 from "@assets/collage_05.jpg";
import collage06 from "@assets/collage_06.jpg";
import collage07 from "@assets/collage_07.jpg";
import collage08 from "@assets/collage_08.jpg";
import collage09 from "@assets/collage_09.jpg";
import heroOffice from "@assets/hero_office.jpg";
import logoHD from "@assets/vonwobeser_logo_2025_full.png";

interface NewOfficesPopupProps {
  language: "en" | "es" | "de" | "zh" | "ko" | "ja" | "ar" | "ru" | "fr" | "it";
}

const STORAGE_KEY = "newOfficesPopupShown";

const content: Record<string, {
  heroTitle: string;
  heroSubtitle: string;
  scroll: string;
  visionTitle: string;
  visionText: string;
  centerTitle: string;
  centerText: string;
  collabTitle: string;
  collabText: string;
  collabText2: string;
  workplacesNum: string;
  workplacesLabel: string;
  capacityText: string;
  quoteText: string;
  quoteAuthor: string;
  quoteRole: string;
  addressTitle: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  close: string;
  officeInterior: string;
}> = {
  en: {
    heroTitle: "WE GO WHERE CLIENTS NEED US",
    heroSubtitle: "New offices of Von Wobeser y Sierra",
    scroll: "scroll",
    visionTitle: "A vision of the future, collaboration, and excellence",
    visionText: "Von Wobeser y Sierra has completed the transition to its new offices in the dynamic Campos Elíseos area in Polanco. This relocation marks a stage of growth, evolution, and consolidation, and represents a key investment in the firm's future. The new facilities are designed to maximize collaboration across all areas for the benefit of clients, ensuring the continued delivery of high-quality and integrated services, reaffirming the firm's commitment and philosophy of being where clients need them.",
    centerTitle: "At the center of business and closer to our clients",
    centerText: "Our new offices are located in Mexico's most dynamic business hub and one of the most important in Latin America. Strategically positioned in the vibrant Polanco district, just steps away from the iconic Paseo de la Reforma, we ensure the proximity our clients need for agile and personalized support.",
    collabTitle: "Collaboration, technology and well-being",
    collabText: "Designed by Gensler, one of the most influential architecture and design firms worldwide, the new offices cover more than 5,300 square meters distributed over six levels.",
    collabText2: "The design is conceived to maximize collaboration among our 18 legal practice groups and 7 industry groups.",
    workplacesNum: "300+",
    workplacesLabel: "workplaces",
    capacityText: "In its initial stage, the facilities offer capacity for more than 300 workstations, 16 meeting rooms, flexible spaces for social and academic activities with capacity for 250 people, and a panoramic terrace with privileged views of iconic Mexico City landmarks such as Chapultepec Forest and Campo Militar Marte.",
    quoteText: "The relocation of our offices responds to two inseparable goals: first, being closer to our clients; and second, offering our team a space designed to foster collaboration and productivity that translates into excellent service.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Partner and member of the Executive Committee",
    addressTitle: "New office address",
    addressLine1: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco",
    addressLine2: "Access via Arquímedes N.° 10",
    addressLine3: "C.P. 11560, Ciudad de México.",
    close: "Close",
    officeInterior: "Office interior",
  },
  es: {
    heroTitle: "VAMOS A DONDE NOS NECESITAN NUESTROS CLIENTES",
    heroSubtitle: "Nuevas oficinas de Von Wobeser y Sierra",
    scroll: "scroll",
    visionTitle: "Una visión del futuro, colaboración y excelencia",
    visionText: "Von Wobeser y Sierra ha completado la transición a sus nuevas oficinas en la dinámica zona de Campos Elíseos en Polanco. Esta reubicación marca una etapa de crecimiento, evolución y consolidación, y representa una inversión clave en el futuro de la firma. Las nuevas instalaciones están diseñadas para maximizar la colaboración en todas las áreas en beneficio de los clientes, asegurando la entrega continua de servicios de alta calidad e integrados, reafirmando el compromiso y filosofía de la firma de estar donde los clientes los necesitan.",
    centerTitle: "En el centro de los negocios y más cerca de nuestros clientes",
    centerText: "Nuestras nuevas oficinas se encuentran en el centro de negocios más dinámico de México y uno de los más importantes de América Latina. Estratégicamente ubicadas en el vibrante distrito de Polanco, a solo pasos de la icónica Avenida Paseo de la Reforma, aseguramos la cercanía que nuestros clientes necesitan para un apoyo ágil y personalizado.",
    collabTitle: "Colaboración, tecnología y bienestar",
    collabText: "Diseñadas por Gensler, una de las firmas de arquitectura y diseño más influyentes del mundo, las nuevas oficinas abarcan más de 5,300 metros cuadrados distribuidos en seis niveles.",
    collabText2: "El diseño está concebido para maximizar la colaboración entre nuestros 18 grupos de práctica legal y 7 grupos industriales.",
    workplacesNum: "300+",
    workplacesLabel: "estaciones de trabajo",
    capacityText: "En su etapa inicial, las instalaciones ofrecen capacidad para más de 300 estaciones de trabajo, 16 salas de juntas, espacios flexibles para actividades sociales y académicas con capacidad para 250 personas, y una terraza panorámica con vistas privilegiadas de lugares emblemáticos de la Ciudad de México como el Bosque de Chapultepec y el Campo Militar Marte.",
    quoteText: "La reubicación de nuestras oficinas responde a dos objetivos inseparables: primero, estar más cerca de nuestros clientes; y segundo, ofrecer a nuestro equipo un espacio diseñado para fomentar la colaboración y productividad que se traduce en un servicio excelente.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Socio y miembro del Comité Ejecutivo",
    addressTitle: "Nueva dirección de oficinas",
    addressLine1: "Torre SOMA Chapultepec Piso 18. Campos Elíseos 204, Polanco",
    addressLine2: "Acceso por Arquímedes N.° 10",
    addressLine3: "C.P. 11560, Ciudad de México.",
    close: "Cerrar",
    officeInterior: "Interior de oficina",
  },
  de: {
    heroTitle: "WIR GEHEN DORTHIN, WO UNSERE MANDANTEN UNS BRAUCHEN",
    heroSubtitle: "Neue Büros von Von Wobeser y Sierra",
    scroll: "scrollen",
    visionTitle: "Eine Vision der Zukunft, Zusammenarbeit und Exzellenz",
    visionText: "Von Wobeser y Sierra hat den Umzug in seine neuen Büros im dynamischen Viertel Campos Elíseos in Polanco abgeschlossen. Dieser Umzug markiert eine Phase des Wachstums, der Entwicklung und Konsolidierung und stellt eine wichtige Investition in die Zukunft der Kanzlei dar. Die neuen Räumlichkeiten sind darauf ausgelegt, die Zusammenarbeit in allen Bereichen zum Wohle der Mandanten zu maximieren und die kontinuierliche Erbringung hochwertiger und integrierter Dienstleistungen sicherzustellen, was das Engagement und die Philosophie der Kanzlei unterstreicht, dort zu sein, wo die Mandanten sie brauchen.",
    centerTitle: "Im Zentrum des Geschäftslebens und näher bei unseren Mandanten",
    centerText: "Unsere neuen Büros befinden sich im dynamischsten Geschäftszentrum Mexikos und einem der wichtigsten in Lateinamerika. Strategisch günstig im lebhaften Stadtteil Polanco gelegen, nur wenige Schritte vom legendären Paseo de la Reforma entfernt, gewährleisten wir die Nähe, die unsere Mandanten für eine agile und persönliche Betreuung benötigen.",
    collabTitle: "Zusammenarbeit, Technologie und Wohlbefinden",
    collabText: "Die neuen Büros wurden von Gensler, einem der einflussreichsten Architektur- und Designbüros weltweit, entworfen und erstrecken sich über mehr als 5.300 Quadratmeter auf sechs Etagen.",
    collabText2: "Das Design ist darauf ausgelegt, die Zusammenarbeit zwischen unseren 18 Rechtsgebietsgruppen und 7 Branchengruppen zu maximieren.",
    workplacesNum: "300+",
    workplacesLabel: "Arbeitsplätze",
    capacityText: "In der ersten Phase bieten die Räumlichkeiten Platz für mehr als 300 Arbeitsplätze, 16 Besprechungsräume, flexible Räume für gesellschaftliche und akademische Veranstaltungen mit einer Kapazität von 250 Personen sowie eine Panoramaterrasse mit privilegiertem Blick auf Wahrzeichen von Mexiko-Stadt wie den Chapultepec-Wald und den Campo Militar Marte.",
    quoteText: "Der Umzug unserer Büros folgt zwei untrennbaren Zielen: erstens, näher bei unseren Mandanten zu sein; und zweitens, unserem Team einen Raum zu bieten, der die Zusammenarbeit und Produktivität fördert, was sich in exzellentem Service niederschlägt.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Partner und Mitglied des Exekutivkomitees",
    addressTitle: "Neue Büroadresse",
    addressLine1: "Torre SOMA Chapultepec Etage 18. Campos Elíseos 204, Polanco",
    addressLine2: "Zugang über Arquímedes Nr. 10",
    addressLine3: "C.P. 11560, Mexiko-Stadt.",
    close: "Schließen",
    officeInterior: "Büroeinrichtung",
  },
  zh: {
    heroTitle: "我们到客户需要我们的地方去",
    heroSubtitle: "Von Wobeser y Sierra 新办公室",
    scroll: "滚动",
    visionTitle: "未来、协作与卓越的愿景",
    visionText: "Von Wobeser y Sierra 已完成向波兰科 Campos Elíseos 动态区域新办公室的搬迁。此次搬迁标志着增长、发展和巩固的新阶段，代表着对公司未来的重要投资。新设施旨在最大限度地促进各领域的协作，以造福客户，确保持续提供高质量和综合服务，重申公司在客户需要时随时到场的承诺和理念。",
    centerTitle: "位于商业中心，更贴近我们的客户",
    centerText: "我们的新办公室位于墨西哥最具活力的商业中心，也是拉丁美洲最重要的商业中心之一。我们位于充满活力的波兰科区，距离标志性的改革大道仅几步之遥，确保为客户提供敏捷和个性化支持所需的便利性。",
    collabTitle: "协作、技术与福祉",
    collabText: "新办公室由全球最具影响力的建筑设计公司之一 Gensler 设计，占地超过 5,300 平方米，分布在六层楼中。",
    collabText2: "该设计旨在最大限度地促进我们 18 个法律实践小组和 7 个行业小组之间的协作。",
    workplacesNum: "300+",
    workplacesLabel: "工作站",
    capacityText: "在初始阶段，设施可容纳 300 多个工作站、16 个会议室、可容纳 250 人的社交和学术活动灵活空间，以及可欣赏墨西哥城地标性建筑（如查普尔特佩克森林和马尔特军营）特权景观的全景露台。",
    quoteText: "我们办公室的搬迁响应两个不可分割的目标：首先，更接近我们的客户；其次，为我们的团队提供一个旨在促进协作和生产力的空间，从而转化为卓越的服务。",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "合伙人兼执行委员会成员",
    addressTitle: "新办公室地址",
    addressLine1: "Torre SOMA Chapultepec 18 楼. Campos Elíseos 204, Polanco",
    addressLine2: "通过 Arquímedes 10 号进入",
    addressLine3: "邮编 11560, 墨西哥城.",
    close: "关闭",
    officeInterior: "办公室内部",
  },
  ko: {
    heroTitle: "고객이 필요로 하는 곳으로 갑니다",
    heroSubtitle: "Von Wobeser y Sierra 새 사무소",
    scroll: "스크롤",
    visionTitle: "미래, 협업 및 우수성의 비전",
    visionText: "Von Wobeser y Sierra는 폴랑코의 역동적인 Campos Elíseos 지역에 새 사무소로의 이전을 완료했습니다. 이번 이전은 성장, 발전 및 통합의 단계를 나타내며, 회사 미래에 대한 핵심 투자를 의미합니다. 새 시설은 고객의 이익을 위해 모든 영역에서 협업을 극대화하고, 고품질의 통합 서비스를 지속적으로 제공하며, 고객이 필요로 할 때 함께하겠다는 회사의 약속과 철학을 재확인합니다.",
    centerTitle: "비즈니스의 중심에서 고객과 더 가깝게",
    centerText: "새 사무소는 멕시코에서 가장 역동적인 비즈니스 허브이자 라틴 아메리카에서 가장 중요한 곳 중 하나에 위치해 있습니다. 상징적인 레포르마 대로에서 불과 몇 걸음 떨어진 활기찬 폴랑코 지구에 전략적으로 위치하여 민첩하고 개인화된 지원을 위해 고객이 필요로 하는 근접성을 보장합니다.",
    collabTitle: "협업, 기술 및 웰빙",
    collabText: "세계에서 가장 영향력 있는 건축 및 디자인 회사 중 하나인 Gensler가 설계한 새 사무소는 6개 층에 걸쳐 5,300평방미터 이상을 차지합니다.",
    collabText2: "설계는 18개 법률 실무 그룹과 7개 산업 그룹 간의 협업을 극대화하도록 구상되었습니다.",
    workplacesNum: "300+",
    workplacesLabel: "작업 공간",
    capacityText: "초기 단계에서 시설은 300개 이상의 워크스테이션, 16개의 회의실, 250명 수용 가능한 사회 및 학술 활동을 위한 유연한 공간, 차풀테펙 숲과 캄포 밀리타르 마르테와 같은 멕시코시티의 상징적인 랜드마크가 보이는 파노라마 테라스를 제공합니다.",
    quoteText: "사무소 이전은 두 가지 불가분의 목표에 부응합니다: 첫째, 고객과 더 가까이; 둘째, 우리 팀에게 협업과 생산성을 촉진하여 우수한 서비스로 이어지는 공간을 제공하는 것입니다.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "파트너 및 집행위원회 위원",
    addressTitle: "새 사무소 주소",
    addressLine1: "Torre SOMA Chapultepec 18층. Campos Elíseos 204, Polanco",
    addressLine2: "Arquímedes N.° 10으로 접근",
    addressLine3: "우편번호 11560, 멕시코시티.",
    close: "닫기",
    officeInterior: "사무실 내부",
  },
  ja: {
    heroTitle: "クライアントが必要とする場所へ",
    heroSubtitle: "Von Wobeser y Sierra 新オフィス",
    scroll: "スクロール",
    visionTitle: "未来、協力、卓越性のビジョン",
    visionText: "Von Wobeser y Sierraは、ポランコの活気あるCampos Elíseos地区にある新オフィスへの移転を完了しました。この移転は成長、進化、統合の段階を示し、事務所の将来への重要な投資を表しています。新施設は、クライアントの利益のためにすべての分野での協力を最大化し、高品質で統合されたサービスの継続的な提供を確保し、クライアントが必要とする場所にいるという事務所のコミットメントと哲学を再確認するよう設計されています。",
    centerTitle: "ビジネスの中心で、クライアントにより近く",
    centerText: "新オフィスは、メキシコで最もダイナミックなビジネスハブであり、ラテンアメリカで最も重要な場所の1つに位置しています。象徴的なレフォルマ通りからわずか数歩の活気あるポランコ地区に戦略的に位置し、俊敏でパーソナライズされたサポートに必要な近接性を確保しています。",
    collabTitle: "協力、テクノロジー、ウェルビーイング",
    collabText: "世界で最も影響力のある建築・デザイン事務所の1つであるGenslerが設計した新オフィスは、6フロアにわたって5,300平方メートル以上をカバーしています。",
    collabText2: "デザインは、18の法務実践グループと7の産業グループ間の協力を最大化するよう構想されています。",
    workplacesNum: "300+",
    workplacesLabel: "ワークプレイス",
    capacityText: "初期段階では、施設は300以上のワークステーション、16の会議室、250人収容可能な社会的・学術的活動のための柔軟なスペース、チャプルテペックの森やカンポ・ミリタール・マルテなどメキシコシティの象徴的なランドマークを望むパノラマテラスを提供します。",
    quoteText: "オフィスの移転は、2つの不可分の目標に応えています：第一に、クライアントにより近づくこと；第二に、優れたサービスにつながる協力と生産性を促進するスペースをチームに提供することです。",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "パートナー兼執行委員会メンバー",
    addressTitle: "新オフィス住所",
    addressLine1: "Torre SOMA Chapultepec 18階. Campos Elíseos 204, Polanco",
    addressLine2: "Arquímedes N.° 10からアクセス",
    addressLine3: "郵便番号 11560, メキシコシティ.",
    close: "閉じる",
    officeInterior: "オフィス内装",
  },
  ar: {
    heroTitle: "نذهب حيث يحتاجنا عملاؤنا",
    heroSubtitle: "المكاتب الجديدة لـ Von Wobeser y Sierra",
    scroll: "تمرير",
    visionTitle: "رؤية للمستقبل والتعاون والتميز",
    visionText: "أكملت Von Wobeser y Sierra الانتقال إلى مكاتبها الجديدة في منطقة Campos Elíseos الديناميكية في بولانكو. يمثل هذا الانتقال مرحلة من النمو والتطور والتوحيد، ويمثل استثماراً رئيسياً في مستقبل الشركة. تم تصميم المرافق الجديدة لتحقيق أقصى قدر من التعاون في جميع المجالات لصالح العملاء، وضمان استمرار تقديم خدمات عالية الجودة ومتكاملة، مما يؤكد التزام الشركة وفلسفتها في التواجد حيث يحتاجها العملاء.",
    centerTitle: "في قلب الأعمال وأقرب إلى عملائنا",
    centerText: "تقع مكاتبنا الجديدة في أكثر مراكز الأعمال ديناميكية في المكسيك وواحدة من أهم المراكز في أمريكا اللاتينية. تقع استراتيجياً في حي بولانكو النابض بالحياة، على بعد خطوات قليلة من شارع باسيو دي لا ريفورما الشهير، نضمن القرب الذي يحتاجه عملاؤنا للحصول على دعم سريع وشخصي.",
    collabTitle: "التعاون والتكنولوجيا والرفاهية",
    collabText: "صممت شركة Gensler، إحدى أكثر شركات الهندسة المعمارية والتصميم تأثيراً في العالم، المكاتب الجديدة التي تغطي أكثر من 5,300 متر مربع موزعة على ستة مستويات.",
    collabText2: "تم تصميم المكاتب لتحقيق أقصى قدر من التعاون بين مجموعات الممارسة القانونية الـ 18 ومجموعات الصناعة الـ 7.",
    workplacesNum: "+300",
    workplacesLabel: "مكان عمل",
    capacityText: "في مرحلتها الأولية، توفر المرافق سعة لأكثر من 300 محطة عمل، و16 غرفة اجتماعات، ومساحات مرنة للأنشطة الاجتماعية والأكاديمية بسعة 250 شخصاً، وتراس بانورامي بإطلالات مميزة على معالم مدينة مكسيكو الشهيرة مثل غابة تشابولتيبيك وكامبو ميليتار مارتي.",
    quoteText: "يستجيب نقل مكاتبنا لهدفين لا ينفصلان: أولاً، أن نكون أقرب إلى عملائنا؛ وثانياً، أن نقدم لفريقنا مساحة مصممة لتعزيز التعاون والإنتاجية التي تترجم إلى خدمة ممتازة.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "شريك وعضو اللجنة التنفيذية",
    addressTitle: "عنوان المكتب الجديد",
    addressLine1: "Torre SOMA Chapultepec الطابق 18. Campos Elíseos 204, Polanco",
    addressLine2: "الدخول عبر Arquímedes رقم 10",
    addressLine3: "الرمز البريدي 11560، مدينة مكسيكو.",
    close: "إغلاق",
    officeInterior: "مناطق المكتب الداخلية",
  },
  ru: {
    heroTitle: "МЫ ИДЁМ ТУДА, ГДЕ НУЖНЫ НАШИМ КЛИЕНТАМ",
    heroSubtitle: "Новые офисы Von Wobeser y Sierra",
    scroll: "прокрутить",
    visionTitle: "Видение будущего, сотрудничества и совершенства",
    visionText: "Von Wobeser y Sierra завершила переезд в новые офисы в динамичном районе Campos Elíseos в Поланко. Этот переезд знаменует этап роста, развития и консолидации и представляет собой ключевые инвестиции в будущее фирмы. Новые помещения спроектированы для максимизации сотрудничества во всех областях на благо клиентов, обеспечивая непрерывное предоставление высококачественных и интегрированных услуг, подтверждая приверженность и философию фирмы быть там, где клиенты нуждаются в ней.",
    centerTitle: "В центре бизнеса и ближе к нашим клиентам",
    centerText: "Наши новые офисы расположены в самом динамичном деловом центре Мексики и одном из важнейших в Латинской Америке. Стратегически расположенные в оживлённом районе Поланко, всего в нескольких шагах от легендарного Пасео-де-ла-Реформа, мы обеспечиваем близость, необходимую нашим клиентам для оперативной и персонализированной поддержки.",
    collabTitle: "Сотрудничество, технологии и благополучие",
    collabText: "Новые офисы, спроектированные Gensler, одной из самых влиятельных архитектурных и дизайнерских фирм в мире, занимают более 5 300 квадратных метров, распределённых на шести уровнях.",
    collabText2: "Дизайн задуман для максимизации сотрудничества между нашими 18 группами юридической практики и 7 отраслевыми группами.",
    workplacesNum: "300+",
    workplacesLabel: "рабочих мест",
    capacityText: "На начальном этапе помещения предлагают более 300 рабочих станций, 16 переговорных комнат, гибкие пространства для социальных и академических мероприятий вместимостью до 250 человек, а также панорамную террасу с привилегированным видом на знаковые достопримечательности Мехико, такие как лес Чапультепек и Кампо Милитар Марте.",
    quoteText: "Переезд наших офисов отвечает двум неразделимым целям: во-первых, быть ближе к нашим клиентам; во-вторых, предоставить нашей команде пространство, способствующее сотрудничеству и продуктивности, что выражается в превосходном сервисе.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Партнёр и член Исполнительного комитета",
    addressTitle: "Адрес нового офиса",
    addressLine1: "Torre SOMA Chapultepec Этаж 18. Campos Elíseos 204, Polanco",
    addressLine2: "Вход через Arquímedes № 10",
    addressLine3: "Почтовый индекс 11560, Мехико.",
    close: "Закрыть",
    officeInterior: "Интерьер офиса",
  },
  fr: {
    heroTitle: "NOUS ALLONS LÀ OÙ NOS CLIENTS ONT BESOIN DE NOUS",
    heroSubtitle: "Nouveaux bureaux de Von Wobeser y Sierra",
    scroll: "défiler",
    visionTitle: "Une vision du futur, de la collaboration et de l'excellence",
    visionText: "Von Wobeser y Sierra a achevé la transition vers ses nouveaux bureaux dans le quartier dynamique de Campos Elíseos à Polanco. Ce déménagement marque une étape de croissance, d'évolution et de consolidation, et représente un investissement clé dans l'avenir du cabinet. Les nouvelles installations sont conçues pour maximiser la collaboration dans tous les domaines au profit des clients, assurant la fourniture continue de services de haute qualité et intégrés, réaffirmant l'engagement et la philosophie du cabinet d'être là où les clients ont besoin de lui.",
    centerTitle: "Au centre des affaires et plus proche de nos clients",
    centerText: "Nos nouveaux bureaux sont situés dans le centre d'affaires le plus dynamique du Mexique et l'un des plus importants d'Amérique latine. Stratégiquement positionnés dans le quartier animé de Polanco, à quelques pas du légendaire Paseo de la Reforma, nous garantissons la proximité dont nos clients ont besoin pour un soutien agile et personnalisé.",
    collabTitle: "Collaboration, technologie et bien-être",
    collabText: "Conçus par Gensler, l'un des cabinets d'architecture et de design les plus influents au monde, les nouveaux bureaux couvrent plus de 5 300 mètres carrés répartis sur six niveaux.",
    collabText2: "Le design est conçu pour maximiser la collaboration entre nos 18 groupes de pratique juridique et 7 groupes sectoriels.",
    workplacesNum: "300+",
    workplacesLabel: "postes de travail",
    capacityText: "Dans sa phase initiale, les installations offrent une capacité de plus de 300 postes de travail, 16 salles de réunion, des espaces flexibles pour des activités sociales et académiques pouvant accueillir 250 personnes, et une terrasse panoramique avec des vues privilégiées sur des sites emblématiques de Mexico tels que la forêt de Chapultepec et le Campo Militar Marte.",
    quoteText: "Le déménagement de nos bureaux répond à deux objectifs inséparables : premièrement, être plus proche de nos clients ; et deuxièmement, offrir à notre équipe un espace conçu pour favoriser la collaboration et la productivité qui se traduit par un excellent service.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Associé et membre du Comité exécutif",
    addressTitle: "Nouvelle adresse des bureaux",
    addressLine1: "Torre SOMA Chapultepec Étage 18. Campos Elíseos 204, Polanco",
    addressLine2: "Accès par Arquímedes N° 10",
    addressLine3: "C.P. 11560, Mexico.",
    close: "Fermer",
    officeInterior: "Intérieur du bureau",
  },
  it: {
    heroTitle: "ANDIAMO DOVE I CLIENTI HANNO BISOGNO DI NOI",
    heroSubtitle: "Nuovi uffici di Von Wobeser y Sierra",
    scroll: "scorri",
    visionTitle: "Una visione del futuro, collaborazione ed eccellenza",
    visionText: "Von Wobeser y Sierra ha completato la transizione verso i suoi nuovi uffici nella dinamica zona di Campos Elíseos a Polanco. Questo trasferimento segna una fase di crescita, evoluzione e consolidamento, e rappresenta un investimento chiave nel futuro dello studio. Le nuove strutture sono progettate per massimizzare la collaborazione in tutte le aree a beneficio dei clienti, garantendo la fornitura continua di servizi di alta qualità e integrati, riaffermando l'impegno e la filosofia dello studio di essere dove i clienti ne hanno bisogno.",
    centerTitle: "Al centro degli affari e più vicini ai nostri clienti",
    centerText: "I nostri nuovi uffici si trovano nel centro commerciale più dinamico del Messico e uno dei più importanti dell'America Latina. Strategicamente posizionati nel vivace quartiere di Polanco, a pochi passi dall'iconico Paseo de la Reforma, garantiamo la vicinanza di cui i nostri clienti hanno bisogno per un supporto agile e personalizzato.",
    collabTitle: "Collaborazione, tecnologia e benessere",
    collabText: "Progettati da Gensler, uno degli studi di architettura e design più influenti al mondo, i nuovi uffici coprono più di 5.300 metri quadrati distribuiti su sei livelli.",
    collabText2: "Il design è concepito per massimizzare la collaborazione tra i nostri 18 gruppi di pratica legale e 7 gruppi industriali.",
    workplacesNum: "300+",
    workplacesLabel: "postazioni di lavoro",
    capacityText: "Nella sua fase iniziale, le strutture offrono una capacità di oltre 300 postazioni di lavoro, 16 sale riunioni, spazi flessibili per attività sociali e accademiche con una capacità di 250 persone, e una terrazza panoramica con viste privilegiate su luoghi iconici di Città del Messico come il Bosco di Chapultepec e il Campo Militar Marte.",
    quoteText: "Il trasferimento dei nostri uffici risponde a due obiettivi inscindibili: primo, essere più vicini ai nostri clienti; e secondo, offrire al nostro team uno spazio progettato per favorire la collaborazione e la produttività che si traduce in un servizio eccellente.",
    quoteAuthor: "Fernando Carreño",
    quoteRole: "Partner e membro del Comitato Esecutivo",
    addressTitle: "Nuovo indirizzo degli uffici",
    addressLine1: "Torre SOMA Chapultepec Piano 18. Campos Elíseos 204, Polanco",
    addressLine2: "Accesso da Arquímedes N.° 10",
    addressLine3: "C.P. 11560, Città del Messico.",
    close: "Chiudi",
    officeInterior: "Interni dell'ufficio",
  },
};

const collageImages = [
  collage01,
  collage02,
  collage03,
  collage04,
  collage05,
  collage06,
  collage07,
  collage08,
  collage09,
];

const GOOGLE_MAPS_URL = "https://www.google.com/maps/dir//Von+Wobeser+y+Sierra,+S.C.+Campos+El%C3%ADseos+204+Polanco,+Miguel+Hidalgo+11560+Ciudad+de+M%C3%A9xico,+CDMX/@19.427554,-99.1927585,16z";

export default function NewOfficesPopup({ language }: NewOfficesPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasShown = localStorage.getItem(STORAGE_KEY);
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const t = content[language] || content.en;

  const scrollToContent = () => {
    const contentArea = document.getElementById("popup-content");
    if (contentArea) {
      contentArea.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[95vh] p-0 gap-0 rounded-none overflow-hidden flex flex-col"
        data-testid="dialog-new-offices"
      >
        <VisuallyHidden>
          <DialogTitle>{t.heroTitle}</DialogTitle>
          <DialogDescription>{t.heroSubtitle}</DialogDescription>
        </VisuallyHidden>
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <img
            src={logoHD}
            alt="Von Wobeser"
            width={318}
            height={70}
            className="h-6 md:h-8 w-auto"
            style={{ imageRendering: "crisp-edges" }}
            data-testid="img-popup-logo"
          />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {language.toUpperCase()}
          </span>
        </div>

        <div
          id="popup-content"
          className="flex-1 overflow-y-auto"
          data-testid="popup-content-area"
        >
          <div
            className="relative min-h-[60vh] flex items-center justify-center"
            style={{
              backgroundImage: `url(${heroOffice})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            data-testid="popup-hero-section"
          >
            <div className="absolute inset-0 bg-black/40" />
            <div className="relative z-10 text-center px-6 py-12">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-light text-white leading-tight mb-4"
                data-testid="text-popup-hero-title"
              >
                {t.heroTitle}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg md:text-xl text-white/90"
                data-testid="text-popup-hero-subtitle"
              >
                {t.heroSubtitle}
              </motion.p>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                onClick={scrollToContent}
                className="mt-8 flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors mx-auto cursor-pointer min-h-[44px] min-w-[44px] p-2 touch-manipulation"
                data-testid="button-popup-scroll"
              >
                <span className="text-xs tracking-widest uppercase">{t.scroll}</span>
                <ChevronDown className="w-5 h-5 animate-bounce" />
              </motion.button>
            </div>
          </div>

          <div className="bg-white px-6 md:px-12 py-12 space-y-12">
            <section className="max-w-3xl mx-auto text-center" data-testid="section-vision">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.visionTitle}
              </h3>
              <p className="text-gray-600 leading-relaxed font-serif">
                {t.visionText}
              </p>
            </section>

            <section className="max-w-3xl mx-auto text-center" data-testid="section-center">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.centerTitle}
              </h3>
              <p className="text-gray-600 leading-relaxed font-serif">
                {t.centerText}
              </p>
            </section>

            <section className="max-w-3xl mx-auto text-center" data-testid="section-collaboration">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.collabTitle}
              </h3>
              <p className="text-gray-600 leading-relaxed font-serif mb-4">
                {t.collabText}
              </p>
              <p className="text-gray-600 leading-relaxed font-serif mb-8">
                {t.collabText2}
              </p>
              <div className="flex flex-col items-center mb-8">
                <span className="text-5xl md:text-6xl font-heading font-light text-[#AC162C]">
                  {t.workplacesNum}
                </span>
                <span className="text-sm text-gray-500 uppercase tracking-wider mt-2">
                  {t.workplacesLabel}
                </span>
              </div>
              <p className="text-gray-600 leading-relaxed font-serif">
                {t.capacityText}
              </p>
            </section>

            <section className="py-8" data-testid="section-collage">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                {collageImages.map((img, index) => (
                  <div
                    key={index}
                    className={`overflow-hidden ${index === 0 || index === 5 ? "row-span-2" : ""}`}
                    data-testid={`img-collage-${index}`}
                  >
                    <img
                      src={img}
                      alt={`${t.officeInterior} ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="max-w-3xl mx-auto text-center py-8 border-t border-b border-gray-200" data-testid="section-quote">
              <div className="text-4xl text-[#AC162C] opacity-30 mb-4">"</div>
              <blockquote className="text-xl md:text-2xl font-serif italic text-gray-700 leading-relaxed mb-6">
                "{t.quoteText}"
              </blockquote>
              <div className="text-sm text-gray-500">
                <p className="font-medium text-gray-700">– {t.quoteAuthor}</p>
                <p>{t.quoteRole}</p>
              </div>
            </section>

            <section className="max-w-3xl mx-auto text-center" data-testid="section-address">
              <h3 className="text-2xl md:text-3xl font-heading font-light text-gray-800 mb-6">
                {t.addressTitle}
              </h3>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-col items-center gap-2 min-h-[44px] p-4 text-gray-600 hover:text-[#AC162C] transition-colors group touch-manipulation"
                data-testid="link-popup-address"
              >
                <MapPin className="w-8 h-8 text-[#AC162C] group-hover:scale-110 transition-transform" />
                <div className="leading-relaxed">
                  <p>{t.addressLine1}</p>
                  <p>{t.addressLine2}</p>
                  <p>{t.addressLine3}</p>
                </div>
              </a>
            </section>
          </div>
        </div>

        <div className="bg-[#AC162C] p-4 flex-shrink-0">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="w-full text-white hover:text-white hover:bg-white/10 text-base font-medium tracking-wider uppercase"
            data-testid="button-close-popup"
          >
            {t.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
