import { motion } from "framer-motion";
import { Shield, FileText, Lock, Mail, Phone, Building2, Clock, Users, Database, Globe, Cookie, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PrivacyPolicy() {
  const { language, displayLanguage } = useLanguage();

  const content = {
    en: {
      title: "Privacy Policy",
      subtitle: "Protection of your personal data under Mexican law (LFPDPPP)",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          id: "data-controller",
          icon: Building2,
          title: "1. Data Controller Identification",
          content: `Von Wobeser y Sierra, S.C. (hereinafter "VWS" or "the Firm"), with address at Torre SOMA Chapultepec, Floor 18, Campos Elíseos 204, Colonia Polanco, C.P. 11560, Mexico City, Mexico, is responsible for the collection, use, storage, and protection of your personal data in accordance with the Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP) and its Regulations.

For any questions regarding this Privacy Policy or the exercise of your ARCO rights (Access, Rectification, Cancellation, and Opposition), you may contact our Data Protection Officer at:

Email: privacidad@vonwobeser.com
Phone: +52 55 5258 1000
Address: Torre SOMA Chapultepec, Floor 18, Campos Elíseos 204, Polanco, C.P. 11560, Mexico City`
        },
        {
          id: "purposes",
          icon: FileText,
          title: "2. Purpose of Data Collection",
          content: `VWS collects and processes your personal data for the following purposes:

Primary Purposes (necessary for the legal relationship):
• Providing legal services and advice
• Managing the attorney-client relationship
• Billing and invoicing for services rendered
• Complying with legal and regulatory obligations
• Managing litigation and legal proceedings on your behalf
• Conducting conflict of interest checks
• Internal administration and record-keeping

Secondary Purposes (not essential but beneficial):
• Sending newsletters, legal updates, and firm communications
• Inviting you to events, seminars, and conferences
• Conducting client satisfaction surveys
• Marketing and promotional activities
• Statistical and analytical purposes

If you do not wish your data to be processed for secondary purposes, you may express your opposition by contacting us at privacidad@vonwobeser.com or by checking the corresponding box in our consent forms.`
        },
        {
          id: "data-types",
          icon: Database,
          title: "3. Types of Personal Data Collected",
          content: `Depending on your relationship with VWS, we may collect the following categories of personal data:

Identification Data:
• Full name, date and place of birth, nationality
• Government-issued ID numbers (INE, passport, CURP, RFC)
• Photographs and biometric data (when required)
• Signature

Contact Data:
• Home and business addresses
• Telephone numbers (landline and mobile)
• Email addresses
• Social media profiles (if voluntarily provided)

Professional and Employment Data:
• Educational background and professional qualifications
• Employment history and current position
• Professional licenses and certifications
• Bar association memberships

Financial and Tax Data:
• Bank account information
• Tax identification numbers
• Billing information
• Payment history

Sensitive Data (collected only when strictly necessary and with express consent):
• Health information (for insurance or litigation matters)
• Ethnic or racial origin (for specific legal cases)
• Political opinions, religious beliefs (when relevant to legal matters)
• Biometric data for identification purposes

We do not collect personal data from minors without the express consent of their parents or legal guardians.`
        },
        {
          id: "legal-basis",
          icon: Shield,
          title: "4. Legal Basis for Processing",
          content: `The processing of your personal data is based on one or more of the following legal grounds:

• Consent: Your express consent provided through signed consent forms, digital acceptance, or continued use of our services after being informed of this Privacy Policy.

• Contractual Necessity: Processing necessary for the performance of a legal services contract or to take steps at your request prior to entering into such a contract.

• Legal Obligation: Processing necessary to comply with Mexican laws and regulations, including but not limited to anti-money laundering laws, tax regulations, and professional ethics rules.

• Legitimate Interest: Processing necessary for the legitimate interests pursued by VWS, such as fraud prevention, network and information security, and business development, provided such interests are not overridden by your rights and freedoms.

• Vital Interest: In exceptional circumstances, processing necessary to protect the vital interests of you or another person.`
        },
        {
          id: "retention",
          icon: Clock,
          title: "5. Data Retention Periods",
          content: `VWS retains your personal data for the period necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law.

Specific retention periods:

• Client files and legal documents: 10 years after the conclusion of the matter, in compliance with bar association requirements and statute of limitations periods.

• Financial and tax records: 5 years, as required by Mexican tax laws (Código Fiscal de la Federación).

• Marketing and communications data: Until you withdraw consent or request deletion, with periodic reviews every 3 years.

• Job applicant data: 2 years after the conclusion of the recruitment process, unless you are hired.

• Website and cookie data: As specified in the Cookie Policy section below.

After the applicable retention period, your personal data will be securely destroyed or anonymized.`
        },
        {
          id: "arco-rights",
          icon: Users,
          title: "6. Your ARCO Rights",
          content: `Under the LFPDPPP, you have the following rights regarding your personal data:

Access: You have the right to know what personal data we hold about you and to obtain a copy of such data.

Rectification: You have the right to request the correction of your personal data if it is inaccurate, incomplete, or outdated.

Cancellation: You have the right to request the deletion of your personal data from our records when you consider that it is not being processed in accordance with applicable laws, or when the purposes for which it was collected have been fulfilled.

Opposition: You have the right to oppose the processing of your personal data for specific purposes, particularly those related to marketing and promotional activities.

Additionally, you may:
• Revoke consent previously granted for the processing of your data
• Limit the use or disclosure of your personal data
• Request the portability of your data in a structured, commonly used format`
        },
        {
          id: "exercise-rights",
          icon: Mail,
          title: "7. How to Exercise Your Rights",
          content: `To exercise your ARCO rights or any other rights under the LFPDPPP, please submit a written request to our Data Protection Officer containing:

1. Your full name and contact information (address and email)
2. A copy of an official ID to verify your identity
3. A clear description of the right(s) you wish to exercise
4. Any documents supporting your request
5. The preferred format for receiving your information (if applicable)

Submit your request to:

Email: privacidad@vonwobeser.com
Mail: Attn: Data Protection Officer
Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, Floor 18
Campos Elíseos 204, Polanco
C.P. 11560, Mexico City, Mexico

Response timeline:
• We will acknowledge receipt of your request within 5 business days
• We will respond to your request within 20 business days from receipt
• If your request is approved, the changes will be implemented within 15 business days

If you are not satisfied with our response, you may file a complaint with the National Institute for Transparency, Access to Information, and Personal Data Protection (INAI) at www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Third-Party Transfers",
          content: `VWS may transfer your personal data to third parties in the following circumstances:

Transfers requiring consent:
• To affiliated law firms or correspondent attorneys in other jurisdictions for the purpose of providing legal services
• To marketing and communication service providers for promotional activities
• To event organizers when you register for VWS-sponsored events

Transfers not requiring consent (as permitted by Article 37 of the LFPDPPP):
• To courts, tribunals, and government authorities when required by law or legal proceedings
• To regulatory bodies and professional associations as part of our compliance obligations
• To parent companies, subsidiaries, or affiliates under common control, sharing the same privacy policies
• When necessary to fulfill a contract in your interest
• In cases of emergency where your vital interests are at stake

International transfers:
When your data is transferred to countries outside of Mexico, we ensure that adequate safeguards are in place, including contractual clauses and the recipient's commitment to privacy principles equivalent to Mexican law.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Cookie Policy",
          content: `Our website uses cookies and similar technologies to enhance your browsing experience. Cookies are small text files stored on your device that help us analyze website traffic, remember your preferences, and improve functionality.

Types of cookies we use:

Essential Cookies: Necessary for the website to function properly. These cannot be disabled.

Analytics Cookies: Help us understand how visitors interact with our website by collecting anonymous information (e.g., Google Analytics).

Functionality Cookies: Remember your preferences such as language settings and display options.

Marketing Cookies: Used to track visitors across websites to display relevant advertisements.

Managing cookies:
You can control and manage cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of our website.

For more information about cookies and how to manage them, please visit www.allaboutcookies.org.

Third-party cookies:
We may use third-party services that set their own cookies, including:
• Google Analytics for website traffic analysis
• LinkedIn for social media integration
• Other analytics and marketing platforms

These third parties have their own privacy policies governing the use of their cookies.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Security Measures",
          content: `VWS implements comprehensive administrative, technical, and physical security measures to protect your personal data against loss, unauthorized access, damage, alteration, or disclosure.

Administrative measures:
• Designation of a Data Protection Officer
• Internal policies and procedures for data handling
• Staff training on data protection and confidentiality
• Regular audits and compliance reviews
• Incident response procedures

Technical measures:
• Encryption of sensitive data in transit and at rest
• Secure access controls and authentication mechanisms
• Firewalls and intrusion detection systems
• Regular security updates and vulnerability assessments
• Secure backup and recovery procedures

Physical measures:
• Restricted access to facilities housing personal data
• Security systems including surveillance and access logs
• Secure document storage and disposal
• Clean desk policies

Despite our best efforts, no method of transmission over the Internet or electronic storage is 100% secure. If you have reason to believe that your personal data has been compromised, please contact us immediately at privacidad@vonwobeser.com.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Changes to This Privacy Policy",
          content: `VWS reserves the right to modify this Privacy Policy at any time to reflect changes in our data processing practices, legal requirements, or for other operational or legal reasons.

How we notify you of changes:
• Significant changes will be communicated via email to our clients and contacts
• Updates will be posted on our website with the new effective date
• For material changes affecting your rights, we may request renewed consent

We encourage you to periodically review this Privacy Policy to stay informed about how we protect your personal data.

This Privacy Policy was last updated on December 2024 and supersedes all previous versions.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Contact Information",
          content: `For any questions, concerns, or requests regarding this Privacy Policy or our data protection practices, please contact:

Data Protection Officer
Von Wobeser y Sierra, S.C.

Address:
Torre SOMA Chapultepec, Floor 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexico City, Mexico

Email: privacidad@vonwobeser.com
Phone: +52 55 5258 1000

Office Hours: Monday to Friday, 9:00 AM to 6:00 PM (Mexico City time)

For general inquiries about our legal services:
Email: info@vonwobeser.com
Website: www.vonwobeser.com`
        }
      ]
    },
    es: {
      title: "Aviso de Privacidad",
      subtitle: "Protección de sus datos personales conforme a la ley mexicana (LFPDPPP)",
      lastUpdated: "Última actualización: Diciembre 2024",
      sections: [
        {
          id: "data-controller",
          icon: Building2,
          title: "1. Identificación del Responsable",
          content: `Von Wobeser y Sierra, S.C. (en adelante "VWS" o "la Firma"), con domicilio en Torre SOMA Chapultepec, Piso 18, Campos Elíseos 204, Colonia Polanco, C.P. 11560, Ciudad de México, México, es responsable de la recopilación, uso, almacenamiento y protección de sus datos personales de conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y su Reglamento.

Para cualquier consulta relacionada con este Aviso de Privacidad o el ejercicio de sus derechos ARCO (Acceso, Rectificación, Cancelación y Oposición), puede contactar a nuestro Oficial de Protección de Datos en:

Correo electrónico: privacidad@vonwobeser.com
Teléfono: +52 55 5258 1000
Dirección: Torre SOMA Chapultepec, Piso 18, Campos Elíseos 204, Polanco, C.P. 11560, Ciudad de México`
        },
        {
          id: "purposes",
          icon: FileText,
          title: "2. Finalidades del Tratamiento",
          content: `VWS recopila y trata sus datos personales para las siguientes finalidades:

Finalidades Primarias (necesarias para la relación jurídica):
• Prestación de servicios legales y asesoría
• Gestión de la relación abogado-cliente
• Facturación y cobro por servicios prestados
• Cumplimiento de obligaciones legales y regulatorias
• Gestión de litigios y procedimientos legales en su nombre
• Realización de verificaciones de conflictos de interés
• Administración interna y mantenimiento de registros

Finalidades Secundarias (no esenciales pero beneficiosas):
• Envío de boletines, actualizaciones legales y comunicaciones de la firma
• Invitaciones a eventos, seminarios y conferencias
• Realización de encuestas de satisfacción del cliente
• Actividades de mercadotecnia y promoción
• Fines estadísticos y analíticos

Si no desea que sus datos sean tratados para finalidades secundarias, puede manifestar su oposición contactándonos en privacidad@vonwobeser.com o marcando la casilla correspondiente en nuestros formularios de consentimiento.`
        },
        {
          id: "data-types",
          icon: Database,
          title: "3. Tipos de Datos Personales Recabados",
          content: `Dependiendo de su relación con VWS, podemos recopilar las siguientes categorías de datos personales:

Datos de Identificación:
• Nombre completo, fecha y lugar de nacimiento, nacionalidad
• Números de identificación oficial (INE, pasaporte, CURP, RFC)
• Fotografías y datos biométricos (cuando sea necesario)
• Firma

Datos de Contacto:
• Domicilio particular y de trabajo
• Números telefónicos (fijo y móvil)
• Direcciones de correo electrónico
• Perfiles de redes sociales (si se proporcionan voluntariamente)

Datos Profesionales y Laborales:
• Formación académica y cualificaciones profesionales
• Historial laboral y puesto actual
• Licencias y certificaciones profesionales
• Membresías en colegios de abogados

Datos Financieros y Fiscales:
• Información de cuentas bancarias
• Números de identificación fiscal
• Información de facturación
• Historial de pagos

Datos Sensibles (recopilados solo cuando sea estrictamente necesario y con consentimiento expreso):
• Información de salud (para asuntos de seguros o litigios)
• Origen étnico o racial (para casos legales específicos)
• Opiniones políticas, creencias religiosas (cuando sean relevantes para asuntos legales)
• Datos biométricos para fines de identificación

No recopilamos datos personales de menores de edad sin el consentimiento expreso de sus padres o tutores legales.`
        },
        {
          id: "legal-basis",
          icon: Shield,
          title: "4. Fundamento Legal para el Tratamiento",
          content: `El tratamiento de sus datos personales se basa en uno o más de los siguientes fundamentos legales:

• Consentimiento: Su consentimiento expreso proporcionado mediante formularios de consentimiento firmados, aceptación digital o uso continuado de nuestros servicios después de ser informado de este Aviso de Privacidad.

• Necesidad Contractual: Tratamiento necesario para la ejecución de un contrato de servicios legales o para tomar medidas a su solicitud antes de celebrar dicho contrato.

• Obligación Legal: Tratamiento necesario para cumplir con leyes y regulaciones mexicanas, incluyendo pero no limitado a leyes contra el lavado de dinero, regulaciones fiscales y reglas de ética profesional.

• Interés Legítimo: Tratamiento necesario para los intereses legítimos perseguidos por VWS, como prevención de fraude, seguridad de redes e información y desarrollo empresarial, siempre que dichos intereses no prevalezcan sobre sus derechos y libertades.

• Interés Vital: En circunstancias excepcionales, tratamiento necesario para proteger los intereses vitales de usted u otra persona.`
        },
        {
          id: "retention",
          icon: Clock,
          title: "5. Plazos de Conservación de Datos",
          content: `VWS conserva sus datos personales durante el período necesario para cumplir con las finalidades descritas en este Aviso de Privacidad, a menos que la ley exija o permita un período de conservación más prolongado.

Plazos de conservación específicos:

• Expedientes de clientes y documentos legales: 10 años después de la conclusión del asunto, en cumplimiento con los requisitos de colegios de abogados y plazos de prescripción.

• Registros financieros y fiscales: 5 años, según lo requerido por las leyes fiscales mexicanas (Código Fiscal de la Federación).

• Datos de mercadotecnia y comunicaciones: Hasta que retire su consentimiento o solicite la eliminación, con revisiones periódicas cada 3 años.

• Datos de solicitantes de empleo: 2 años después de la conclusión del proceso de reclutamiento, a menos que sea contratado.

• Datos del sitio web y cookies: Según se especifica en la sección de Política de Cookies a continuación.

Después del período de conservación aplicable, sus datos personales serán destruidos de manera segura o anonimizados.`
        },
        {
          id: "arco-rights",
          icon: Users,
          title: "6. Sus Derechos ARCO",
          content: `Conforme a la LFPDPPP, usted tiene los siguientes derechos respecto a sus datos personales:

Acceso: Tiene derecho a conocer qué datos personales tenemos sobre usted y a obtener una copia de dichos datos.

Rectificación: Tiene derecho a solicitar la corrección de sus datos personales si son inexactos, incompletos o están desactualizados.

Cancelación: Tiene derecho a solicitar la eliminación de sus datos personales de nuestros registros cuando considere que no están siendo tratados conforme a la legislación aplicable, o cuando las finalidades para las cuales fueron recabados se hayan cumplido.

Oposición: Tiene derecho a oponerse al tratamiento de sus datos personales para finalidades específicas, particularmente aquellas relacionadas con actividades de mercadotecnia y promoción.

Adicionalmente, puede:
• Revocar el consentimiento previamente otorgado para el tratamiento de sus datos
• Limitar el uso o divulgación de sus datos personales
• Solicitar la portabilidad de sus datos en un formato estructurado y de uso común`
        },
        {
          id: "exercise-rights",
          icon: Mail,
          title: "7. Cómo Ejercer sus Derechos",
          content: `Para ejercer sus derechos ARCO o cualquier otro derecho bajo la LFPDPPP, por favor presente una solicitud por escrito a nuestro Oficial de Protección de Datos que contenga:

1. Su nombre completo e información de contacto (domicilio y correo electrónico)
2. Copia de una identificación oficial para verificar su identidad
3. Una descripción clara del derecho(s) que desea ejercer
4. Cualquier documento que apoye su solicitud
5. El formato preferido para recibir su información (si aplica)

Envíe su solicitud a:

Correo electrónico: privacidad@vonwobeser.com
Correo postal: Attn: Oficial de Protección de Datos
Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Polanco
C.P. 11560, Ciudad de México, México

Plazos de respuesta:
• Acusaremos recibo de su solicitud dentro de 5 días hábiles
• Responderemos a su solicitud dentro de 20 días hábiles a partir de la recepción
• Si su solicitud es aprobada, los cambios se implementarán dentro de 15 días hábiles

Si no está satisfecho con nuestra respuesta, puede presentar una queja ante el Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales (INAI) en www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Transferencias a Terceros",
          content: `VWS puede transferir sus datos personales a terceros en las siguientes circunstancias:

Transferencias que requieren consentimiento:
• A despachos de abogados afiliados o corresponsales en otras jurisdicciones para la prestación de servicios legales
• A proveedores de servicios de mercadotecnia y comunicación para actividades promocionales
• A organizadores de eventos cuando se registre para eventos patrocinados por VWS

Transferencias que no requieren consentimiento (según lo permitido por el Artículo 37 de la LFPDPPP):
• A tribunales y autoridades gubernamentales cuando lo exija la ley o procedimientos legales
• A organismos reguladores y asociaciones profesionales como parte de nuestras obligaciones de cumplimiento
• A sociedades matrices, subsidiarias o afiliadas bajo control común, que compartan las mismas políticas de privacidad
• Cuando sea necesario para cumplir un contrato en su interés
• En casos de emergencia donde sus intereses vitales estén en juego

Transferencias internacionales:
Cuando sus datos sean transferidos a países fuera de México, nos aseguramos de que existan salvaguardas adecuadas, incluyendo cláusulas contractuales y el compromiso del destinatario con principios de privacidad equivalentes a la ley mexicana.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Política de Cookies",
          content: `Nuestro sitio web utiliza cookies y tecnologías similares para mejorar su experiencia de navegación. Las cookies son pequeños archivos de texto almacenados en su dispositivo que nos ayudan a analizar el tráfico del sitio web, recordar sus preferencias y mejorar la funcionalidad.

Tipos de cookies que utilizamos:

Cookies Esenciales: Necesarias para que el sitio web funcione correctamente. Estas no pueden ser desactivadas.

Cookies de Análisis: Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web recopilando información anónima (por ejemplo, Google Analytics).

Cookies de Funcionalidad: Recuerdan sus preferencias como configuración de idioma y opciones de visualización.

Cookies de Marketing: Se utilizan para rastrear visitantes en sitios web para mostrar anuncios relevantes.

Gestión de cookies:
Puede controlar y gestionar las cookies a través de la configuración de su navegador. Tenga en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad de nuestro sitio web.

Para más información sobre las cookies y cómo gestionarlas, visite www.allaboutcookies.org.

Cookies de terceros:
Podemos utilizar servicios de terceros que establecen sus propias cookies, incluyendo:
• Google Analytics para análisis del tráfico del sitio web
• LinkedIn para integración con redes sociales
• Otras plataformas de análisis y marketing

Estos terceros tienen sus propias políticas de privacidad que rigen el uso de sus cookies.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Medidas de Seguridad",
          content: `VWS implementa medidas de seguridad administrativas, técnicas y físicas integrales para proteger sus datos personales contra pérdida, acceso no autorizado, daño, alteración o divulgación.

Medidas administrativas:
• Designación de un Oficial de Protección de Datos
• Políticas y procedimientos internos para el manejo de datos
• Capacitación del personal en protección de datos y confidencialidad
• Auditorías regulares y revisiones de cumplimiento
• Procedimientos de respuesta a incidentes

Medidas técnicas:
• Cifrado de datos sensibles en tránsito y en reposo
• Controles de acceso seguros y mecanismos de autenticación
• Firewalls y sistemas de detección de intrusiones
• Actualizaciones regulares de seguridad y evaluaciones de vulnerabilidades
• Procedimientos seguros de respaldo y recuperación

Medidas físicas:
• Acceso restringido a instalaciones que albergan datos personales
• Sistemas de seguridad incluyendo vigilancia y registros de acceso
• Almacenamiento y destrucción segura de documentos
• Políticas de escritorio limpio

A pesar de nuestros mejores esfuerzos, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. Si tiene razones para creer que sus datos personales han sido comprometidos, contáctenos inmediatamente en privacidad@vonwobeser.com.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Cambios a este Aviso de Privacidad",
          content: `VWS se reserva el derecho de modificar este Aviso de Privacidad en cualquier momento para reflejar cambios en nuestras prácticas de procesamiento de datos, requisitos legales u otras razones operativas o legales.

Cómo le notificamos los cambios:
• Los cambios significativos serán comunicados por correo electrónico a nuestros clientes y contactos
• Las actualizaciones serán publicadas en nuestro sitio web con la nueva fecha de vigencia
• Para cambios materiales que afecten sus derechos, podemos solicitar consentimiento renovado

Le recomendamos revisar periódicamente este Aviso de Privacidad para mantenerse informado sobre cómo protegemos sus datos personales.

Este Aviso de Privacidad fue actualizado por última vez en diciembre de 2024 y reemplaza todas las versiones anteriores.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Información de Contacto",
          content: `Para cualquier pregunta, inquietud o solicitud relacionada con este Aviso de Privacidad o nuestras prácticas de protección de datos, contacte a:

Oficial de Protección de Datos
Von Wobeser y Sierra, S.C.

Dirección:
Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Ciudad de México, México

Correo electrónico: privacidad@vonwobeser.com
Teléfono: +52 55 5258 1000

Horario de atención: Lunes a viernes, 9:00 AM a 6:00 PM (hora de la Ciudad de México)

Para consultas generales sobre nuestros servicios legales:
Correo electrónico: info@vonwobeser.com
Sitio web: www.vonwobeser.com`
        }
      ]
    }
  };

  const t = content[displayLanguage];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-privacy-policy">
      <SEOHead page="privacyPolicy" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-privacy-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <Shield className="w-12 h-12 text-white/90" />
            </div>
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-privacy-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto mb-4"
              data-testid="text-privacy-subtitle"
            >
              {t.subtitle}
            </p>
            <p 
              className="text-sm text-white/70"
              data-testid="text-privacy-updated"
            >
              {t.lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {t.sections.map((section, index) => (
              <motion.div 
                key={section.id} 
                variants={itemVariants}
                data-testid={`section-privacy-${section.id}`}
              >
                <Card className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <section.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h2 
                        className="text-xl font-heading font-medium text-gray-800 dark:text-white"
                        data-testid={`text-section-title-${section.id}`}
                      >
                        {section.title}
                      </h2>
                    </div>
                    <div className="p-6">
                      <div 
                        className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line"
                        data-testid={`text-section-content-${section.id}`}
                      >
                        {section.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <Card className="rounded-md border border-primary/20 bg-primary/5 dark:bg-primary/10">
              <CardContent className="p-8">
                <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {language === "es" 
                    ? "Para ejercer sus derechos ARCO o hacer consultas sobre privacidad:"
                    : "To exercise your ARCO rights or make privacy inquiries:"}
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <a 
                    href="mailto:privacidad@vonwobeser.com"
                    className="flex items-center gap-2 text-primary hover:underline"
                    data-testid="link-privacy-email"
                  >
                    <Mail className="w-4 h-4" />
                    privacidad@vonwobeser.com
                  </a>
                  <span className="hidden sm:inline text-gray-400">|</span>
                  <a 
                    href="tel:+525552581000"
                    className="flex items-center gap-2 text-primary hover:underline"
                    data-testid="link-privacy-phone"
                  >
                    <Phone className="w-4 h-4" />
                    +52 55 5258 1000
                  </a>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
