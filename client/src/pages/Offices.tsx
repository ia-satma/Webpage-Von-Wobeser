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

export default function Offices() {
  const { language, displayLanguage } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<OfficeImage | null>(null);

  const { data: officeImages, isLoading: imagesLoading } = useQuery<OfficeImage[]>({
    queryKey: ["/api/office-images"],
  });

  const content = {
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
    },
  };

  const t = content[displayLanguage];

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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-offices">
      <SEOHead page="offices" language={displayLanguage} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-offices-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-offices-title"
            >
              {t.heroTitle}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
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
            <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-8 text-center">
              {t.mainOfficeTitle}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="order-2 lg:order-1">
                <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-office-info">
                  <CardContent className="p-6 lg:p-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-1" data-testid="text-building-name">
                          {t.buildingName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400" data-testid="text-floor">{t.floor}</p>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-6">
                      <div className="flex items-start gap-3" data-testid="text-full-address">
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-gray-700 dark:text-gray-300">
                          <p>{t.address}</p>
                          <p>{t.colony}</p>
                          <p>{t.postalCode}</p>
                          <p>{t.city}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                        <div className="text-gray-700 dark:text-gray-300">
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
                        <div className="text-gray-700 dark:text-gray-300">
                          <span className="text-sm text-gray-500">Fax: </span>
                          <span data-testid="text-fax">{t.fax}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                        <a 
                          href={`mailto:${t.email}`}
                          className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                          data-testid="link-email"
                        >
                          {t.email}
                        </a>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                      <div className="flex items-start gap-3 mb-2">
                        <Clock className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-white mb-1">{t.officeHoursTitle}</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm" data-testid="text-office-hours">{t.officeHours}</p>
                          <p className="text-gray-500 dark:text-gray-500 text-sm">{t.saturdayHours}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                      <h4 className="font-medium text-gray-800 dark:text-white mb-4">{t.amenitiesTitle}</h4>
                      <div className="space-y-3">
                        {t.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-3" data-testid={`amenity-${index}`}>
                            <amenity.icon className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 text-sm">{amenity.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      className="w-full rounded-md mt-4" 
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
                  className="w-full h-[400px] lg:h-full min-h-[400px] rounded-md overflow-hidden border border-gray-200 dark:border-gray-700"
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
            className="mb-20 bg-gray-50 dark:bg-gray-800 rounded-md p-8 lg:p-12"
            data-testid="section-directions"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-4">
                  {t.directionsTitle}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  {t.directionsText}
                </p>
              </div>
              <div>
                <h4 className="flex items-center gap-2 font-medium text-gray-800 dark:text-white mb-4">
                  <Landmark className="w-5 h-5 text-primary" />
                  {t.landmarksTitle}
                </h4>
                <ul className="space-y-2">
                  {t.landmarks.map((landmark, index) => (
                    <li key={index} className="flex items-center gap-3 text-gray-600 dark:text-gray-400" data-testid={`landmark-${index}`}>
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
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.galleryTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.gallerySubtitle}
              </p>
            </div>

            {imagesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-testid="skeleton-gallery">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[4/3] rounded-md" />
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
                    className="aspect-[4/3] rounded-md overflow-hidden cursor-pointer group"
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
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.facilitiesTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.facilitiesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-meeting-rooms">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {t.meetingRoomsTitle}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {t.meetingRoomsDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-video-conferencing">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Video className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {t.videoConferencingTitle}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {t.videoConferencingDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-client-hospitality">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Coffee className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {t.clientHospitalityTitle}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {t.clientHospitalityDesc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="h-full rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-accessibility">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Accessibility className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {t.accessibilityTitle}
                      </h3>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
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
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mb-20"
            data-testid="section-transportation"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-heading font-light text-gray-800 dark:text-white mb-4">
                {t.transportTitle}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                {t.transportSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-metro">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Train className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {t.metroTitle}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {t.metroDesc}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-parking">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ParkingCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {t.parkingTitle}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {t.parkingDesc}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-taxi">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Car className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                      {t.taxiTitle}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {t.taxiDesc}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center bg-primary rounded-md p-10 lg:p-16"
            data-testid="section-contact-cta"
          >
            <h2 className="text-3xl font-heading font-light text-white mb-4">
              {t.contactCtaTitle}
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-8">
              {t.contactCtaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="secondary" 
                className="rounded-md bg-white text-primary hover:bg-white/90"
                asChild
                data-testid="button-contact"
              >
                <Link href="/contact">
                  <Mail className="w-4 h-4 mr-2" />
                  {t.contactButton}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="rounded-md border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                asChild
                data-testid="button-schedule"
              >
                <a href="mailto:info@vonwobeser.com?subject=Meeting%20Request">
                  <Clock className="w-4 h-4 mr-2" />
                  {t.scheduleButton}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </motion.section>
        </div>
      </main>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
          data-testid="modal-image-lightbox"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-5xl max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.imageUrl}
              alt={language === "es" ? selectedImage.altEs : selectedImage.alt}
              className="max-w-full max-h-[90vh] object-contain rounded-md"
              data-testid="img-lightbox"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-close-lightbox"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
            <p className="text-center text-white/80 mt-4 text-sm">
              {language === "es" ? selectedImage.altEs : selectedImage.alt}
            </p>
          </motion.div>
        </div>
      )}

      <Footer />
    </div>
  );
}
