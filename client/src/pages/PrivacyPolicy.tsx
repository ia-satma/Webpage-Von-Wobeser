import { motion } from "framer-motion";
import { Shield, FileText, Database, Eye, Lock, Cookie, AlertCircle, Phone, Mail, Globe, Users, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

type SupportedLanguage = 'en' | 'es' | 'de' | 'zh' | 'ko' | 'ja' | 'ar' | 'ru' | 'fr' | 'it';

export default function PrivacyPolicy() {
  const { language } = useLanguage();

  const content: Record<SupportedLanguage, {
    title: string;
    subtitle: string;
    lastUpdated: string;
    sections: Array<{
      id: string;
      icon: typeof Shield;
      title: string;
      content: string;
    }>;
  }> = {
    en: {
      title: "Privacy Policy",
      subtitle: "How we collect, use, and protect your personal data",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. Introduction",
          content: `Von Wobeser y Sierra, S.C. ("VWS," "we," "us," or "our") is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website www.vonwobeser.com (the "Website") or interact with our services.

This Privacy Policy complies with the Federal Law on Protection of Personal Data Held by Private Parties (Ley Federal de Protección de Datos Personales en Posesión de los Particulares, "LFPDPPP") and its Regulations, as well as other applicable Mexican data protection laws and international best practices.

By accessing or using our Website, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with our policies and practices, please do not use our Website.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. Data Controller",
          content: `The data controller responsible for your personal data is:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, Floor 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexico City, Mexico

For privacy-related inquiries:
Email: privacidad@vonwobeser.com
Phone: +52 55 5258 1000

Our Data Protection Officer can be contacted at the above address for any questions regarding this Privacy Policy or the exercise of your data protection rights.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. Personal Data We Collect",
          content: `We may collect and process the following categories of personal data:

Identification Data:
• Full name, title, and professional position
• Contact information (email address, phone number, mailing address)
• Company or organization name
• Professional credentials and affiliations

Communication Data:
• Correspondence and communications with VWS
• Inquiries submitted through our contact forms
• Subscription preferences for newsletters and publications

Technical Data:
• IP address and device information
• Browser type and version
• Operating system
• Pages visited and time spent on our Website
• Referral source and navigation patterns

Professional Data:
• Legal matters and case-related information (for clients)
• Professional background and expertise areas
• Business relationships and referrals

We do not intentionally collect sensitive personal data (such as racial or ethnic origin, political opinions, religious beliefs, health information, or biometric data) unless strictly necessary for legal representation and with your explicit consent.`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. How We Use Your Data",
          content: `We use your personal data for the following purposes:

Primary Purposes (require no additional consent):
• To provide legal services and professional advice
• To respond to your inquiries and communications
• To manage our attorney-client relationships
• To comply with legal and regulatory obligations
• To administer and protect our Website and systems

Secondary Purposes (may require consent):
• To send newsletters, publications, and legal updates
• To invite you to events, seminars, and conferences
• To conduct surveys and gather feedback on our services
• To send marketing communications about our practice areas
• To analyze Website usage and improve user experience

Legal Bases for Processing:
Under applicable law, we process your data based on:
• Performance of a contract or pre-contractual measures
• Compliance with legal obligations
• Our legitimate interests (where not overridden by your rights)
• Your explicit consent (where required)

You may opt out of secondary purposes at any time by contacting us at privacidad@vonwobeser.com.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. Data Retention",
          content: `We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, unless a longer retention period is required or permitted by law.

Retention Periods:
• Client files and legal matters: 10 years after case closure (as required by professional regulations)
• General inquiries and communications: 3 years from last contact
• Newsletter subscriptions: Until you unsubscribe
• Website analytics data: 2 years
• Accounting and billing records: As required by tax and fiscal regulations (typically 5-10 years)

After the applicable retention period, we will securely delete or anonymize your personal data.

Upon termination of the attorney-client relationship, we may retain certain information as required by professional ethics rules, applicable laws, or for the establishment, exercise, or defense of legal claims.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. Data Sharing and Disclosure",
          content: `We may share your personal data with the following categories of recipients:

Within VWS:
• Partners, attorneys, and professional staff involved in your matter
• Administrative and support personnel as necessary
• Other offices of VWS for coordination of services

Third Parties:
• Courts, tribunals, and regulatory authorities (as required by legal proceedings)
• Other law firms or professionals collaborating on your matter (with your consent)
• Service providers (IT, hosting, communication platforms) under strict confidentiality agreements
• Professional auditors and insurers as required

International Transfers:
When we transfer your data outside Mexico, we ensure appropriate safeguards are in place, including:
• Contractual clauses ensuring equivalent protection
• Transfers to countries with adequate data protection laws
• Your explicit consent for specific transfers

We never sell your personal data to third parties for marketing purposes.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. Your ARCO Rights",
          content: `Under Mexican law, you have the following rights regarding your personal data (known as ARCO rights):

Access (Acceso):
You may request confirmation of whether we process your personal data and access to such data, including the purposes of processing and categories of data involved.

Rectification (Rectificación):
You may request correction of inaccurate or incomplete personal data.

Cancellation (Cancelación):
You may request deletion of your personal data when it is no longer necessary for the purposes for which it was collected, or when you withdraw consent.

Opposition (Oposición):
You may object to the processing of your personal data for specific purposes, particularly for marketing and secondary purposes.

To Exercise Your Rights:
Submit a written request to:
Email: privacidad@vonwobeser.com
Address: Torre SOMA Chapultepec, Floor 18
Campos Elíseos 204, Polanco
C.P. 11560, Mexico City, Mexico

Response Times:
• We will acknowledge your request within 5 business days
• We will respond to your request within 20 business days from receipt
• If your request is approved, changes will be implemented within 15 business days

If you are not satisfied with our response, you may file a complaint with the National Institute for Transparency, Access to Information, and Personal Data Protection (INAI) at www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Third-Party Transfers",
          content: `VWS may transfer your personal data to third parties in the following circumstances:

Transfers Requiring Consent:
• To affiliated law firms or correspondents in other jurisdictions for legal service delivery
• To marketing and communications service providers for promotional activities
• To event organizers when you register for VWS-sponsored events

Transfers Not Requiring Consent (as permitted by Article 37 of LFPDPPP):
• To courts and government authorities when required by law or legal proceedings
• To regulatory bodies and professional associations as part of our compliance obligations
• To parent companies, subsidiaries, or affiliates under common control, sharing the same privacy policies
• When necessary to fulfill a contract in your interest
• In emergency cases where your vital interests are at stake

International Transfers:
When your data is transferred to countries outside Mexico, we ensure appropriate safeguards are in place, including contractual clauses and the recipient's commitment to privacy principles equivalent to Mexican law.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Cookies Policy",
          content: `Our Website uses cookies and similar technologies to enhance your browsing experience. Cookies are small text files stored on your device that help us analyze website traffic, remember your preferences, and improve functionality.

Types of Cookies We Use:

Essential Cookies: Necessary for the Website to function properly. These cannot be disabled.

Analytics Cookies: Help us understand how visitors interact with our Website by collecting anonymous information (e.g., Google Analytics).

Functionality Cookies: Remember your preferences such as language settings and display options.

Marketing Cookies: Used to track visitors across websites to display relevant advertisements.

Managing Cookies:
You can control and manage cookies through your browser settings. Note that disabling certain cookies may affect the functionality of our Website.

For more information about cookies and how to manage them, visit www.allaboutcookies.org.

Third-Party Cookies:
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

Administrative Measures:
• Designation of a Data Protection Officer
• Internal policies and procedures for data handling
• Personnel training on data protection and confidentiality
• Regular audits and compliance reviews
• Incident response procedures

Technical Measures:
• Encryption of sensitive data in transit and at rest
• Secure access controls and authentication mechanisms
• Firewalls and intrusion detection systems
• Regular security updates and vulnerability assessments
• Secure backup and recovery procedures

Physical Measures:
• Restricted access to facilities housing personal data
• Security systems including surveillance and access logs
• Secure document storage and destruction
• Clean desk policies

Despite our best efforts, no method of transmission over the Internet or electronic storage is 100% secure. If you have reason to believe your personal data has been compromised, please contact us immediately at privacidad@vonwobeser.com.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Changes to This Privacy Policy",
          content: `VWS reserves the right to modify this Privacy Policy at any time to reflect changes in our data processing practices, legal requirements, or other operational or legal reasons.

How We Notify You of Changes:
• Significant changes will be communicated by email to our clients and contacts
• Updates will be posted on our Website with the new effective date
• For material changes affecting your rights, we may request renewed consent

We encourage you to periodically review this Privacy Policy to stay informed about how we protect your personal data.

This Privacy Policy was last updated in December 2024 and supersedes all previous versions.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Contact Information",
          content: `For any questions, concerns, or requests related to this Privacy Policy or our data protection practices, please contact:

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
      subtitle: "Cómo recopilamos, utilizamos y protegemos sus datos personales",
      lastUpdated: "Última actualización: Diciembre 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. Introducción",
          content: `Von Wobeser y Sierra, S.C. ("VWS", "nosotros" o "nuestro") se compromete a proteger su privacidad y garantizar la seguridad de sus datos personales. Este Aviso de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos su información cuando visita nuestro sitio web www.vonwobeser.com (el "Sitio Web") o interactúa con nuestros servicios.

Este Aviso de Privacidad cumple con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares ("LFPDPPP") y su Reglamento, así como con otras leyes mexicanas de protección de datos aplicables y las mejores prácticas internacionales.

Al acceder o utilizar nuestro Sitio Web, usted reconoce que ha leído, comprendido y acepta estar sujeto a este Aviso de Privacidad.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. Responsable del Tratamiento",
          content: `El responsable del tratamiento de sus datos personales es:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Ciudad de México, México

Para consultas relacionadas con privacidad:
Correo electrónico: privacidad@vonwobeser.com
Teléfono: +52 55 5258 1000`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. Datos Personales que Recopilamos",
          content: `Podemos recopilar y tratar las siguientes categorías de datos personales:

Datos de Identificación:
• Nombre completo, título y cargo profesional
• Información de contacto (correo electrónico, teléfono, dirección postal)
• Nombre de la empresa u organización
• Credenciales y afiliaciones profesionales

Datos de Comunicación:
• Correspondencia y comunicaciones con VWS
• Consultas enviadas a través de nuestros formularios de contacto
• Preferencias de suscripción a boletines y publicaciones

Datos Técnicos:
• Dirección IP e información del dispositivo
• Tipo y versión del navegador
• Sistema operativo
• Páginas visitadas y tiempo de permanencia en nuestro Sitio Web`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. Uso de sus Datos",
          content: `Utilizamos sus datos personales para los siguientes fines:

Finalidades Primarias (no requieren consentimiento adicional):
• Para proporcionar servicios legales y asesoría profesional
• Para responder a sus consultas y comunicaciones
• Para gestionar nuestras relaciones con clientes
• Para cumplir con obligaciones legales y regulatorias

Finalidades Secundarias (pueden requerir consentimiento):
• Para enviar boletines, publicaciones y actualizaciones legales
• Para invitarlo a eventos, seminarios y conferencias
• Para realizar encuestas y recopilar comentarios sobre nuestros servicios
• Para enviar comunicaciones de marketing sobre nuestras áreas de práctica

Puede optar por no recibir comunicaciones para finalidades secundarias contactándonos en privacidad@vonwobeser.com.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. Conservación de Datos",
          content: `Conservamos sus datos personales solo durante el tiempo necesario para cumplir con los fines para los que fueron recopilados, a menos que la ley exija o permita un período de retención más largo.

Períodos de Retención:
• Expedientes de clientes y asuntos legales: 10 años después del cierre del caso
• Consultas generales y comunicaciones: 3 años desde el último contacto
• Suscripciones a boletines: Hasta que se dé de baja
• Datos analíticos del sitio web: 2 años
• Registros contables y de facturación: Según lo requerido por las regulaciones fiscales`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. Compartición de Datos",
          content: `Podemos compartir sus datos personales con las siguientes categorías de destinatarios:

Dentro de VWS:
• Socios, abogados y personal profesional involucrado en su asunto
• Personal administrativo y de apoyo según sea necesario

Terceros:
• Tribunales y autoridades regulatorias (según lo requieran los procedimientos legales)
• Otros despachos de abogados o profesionales que colaboren en su asunto (con su consentimiento)
• Proveedores de servicios (TI, hosting, plataformas de comunicación) bajo estrictos acuerdos de confidencialidad

Nunca vendemos sus datos personales a terceros con fines de marketing.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. Sus Derechos ARCO",
          content: `Conforme a la legislación mexicana, usted tiene los siguientes derechos sobre sus datos personales (conocidos como derechos ARCO):

Acceso: Puede solicitar confirmación de si tratamos sus datos personales y acceder a dichos datos.

Rectificación: Puede solicitar la corrección de datos personales inexactos o incompletos.

Cancelación: Puede solicitar la eliminación de sus datos personales cuando ya no sean necesarios.

Oposición: Puede oponerse al tratamiento de sus datos personales para fines específicos.

Para Ejercer sus Derechos:
Envíe una solicitud por escrito a:
Correo electrónico: privacidad@vonwobeser.com
Dirección: Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Polanco
C.P. 11560, Ciudad de México, México`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Transferencias a Terceros",
          content: `VWS puede transferir sus datos personales a terceros en las siguientes circunstancias:

Transferencias que requieren consentimiento:
• A despachos de abogados afiliados o corresponsales en otras jurisdicciones
• A proveedores de servicios de mercadotecnia y comunicación

Transferencias que no requieren consentimiento (según el Artículo 37 de la LFPDPPP):
• A tribunales y autoridades gubernamentales cuando lo exija la ley
• A organismos reguladores y asociaciones profesionales

Transferencias internacionales:
Cuando sus datos sean transferidos a países fuera de México, nos aseguramos de que existan salvaguardas adecuadas.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Política de Cookies",
          content: `Nuestro sitio web utiliza cookies y tecnologías similares para mejorar su experiencia de navegación.

Tipos de cookies que utilizamos:

Cookies Esenciales: Necesarias para que el sitio web funcione correctamente.

Cookies de Análisis: Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.

Cookies de Funcionalidad: Recuerdan sus preferencias como configuración de idioma.

Cookies de Marketing: Se utilizan para mostrar anuncios relevantes.

Gestión de cookies:
Puede controlar y gestionar las cookies a través de la configuración de su navegador.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Medidas de Seguridad",
          content: `VWS implementa medidas de seguridad administrativas, técnicas y físicas integrales para proteger sus datos personales.

Medidas administrativas:
• Designación de un Oficial de Protección de Datos
• Políticas y procedimientos internos para el manejo de datos
• Capacitación del personal en protección de datos

Medidas técnicas:
• Cifrado de datos sensibles
• Controles de acceso seguros
• Firewalls y sistemas de detección de intrusiones

Medidas físicas:
• Acceso restringido a instalaciones
• Sistemas de seguridad incluyendo vigilancia`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Cambios a este Aviso de Privacidad",
          content: `VWS se reserva el derecho de modificar este Aviso de Privacidad en cualquier momento.

Cómo le notificamos los cambios:
• Los cambios significativos serán comunicados por correo electrónico
• Las actualizaciones serán publicadas en nuestro sitio web

Le recomendamos revisar periódicamente este Aviso de Privacidad.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Información de Contacto",
          content: `Para cualquier pregunta relacionada con este Aviso de Privacidad, contacte a:

Oficial de Protección de Datos
Von Wobeser y Sierra, S.C.

Dirección:
Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Ciudad de México, México

Correo electrónico: privacidad@vonwobeser.com
Teléfono: +52 55 5258 1000

Horario de atención: Lunes a viernes, 9:00 AM a 6:00 PM (hora de la Ciudad de México)`
        }
      ]
    },
    de: {
      title: "Datenschutzrichtlinie",
      subtitle: "Wie wir Ihre personenbezogenen Daten erfassen, verwenden und schützen",
      lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. Einleitung",
          content: `Von Wobeser y Sierra, S.C. („VWS", „wir", „uns" oder „unser") verpflichtet sich, Ihre Privatsphäre zu schützen und die Sicherheit Ihrer personenbezogenen Daten zu gewährleisten. Diese Datenschutzrichtlinie erläutert, wie wir Ihre Informationen erfassen, verwenden, offenlegen und schützen, wenn Sie unsere Website www.vonwobeser.com (die „Website") besuchen oder mit unseren Diensten interagieren.

Diese Datenschutzrichtlinie entspricht dem Bundesgesetz zum Schutz personenbezogener Daten in Privatbesitz (LFPDPPP) und seinen Vorschriften sowie anderen anwendbaren mexikanischen Datenschutzgesetzen und internationalen Best Practices.

Durch den Zugriff auf oder die Nutzung unserer Website erkennen Sie an, dass Sie diese Datenschutzrichtlinie gelesen und verstanden haben und sich an diese gebunden fühlen.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. Verantwortlicher",
          content: `Der für Ihre personenbezogenen Daten verantwortliche Datenverantwortliche ist:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18. Stock
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexiko-Stadt, Mexiko

Für datenschutzbezogene Anfragen:
E-Mail: privacidad@vonwobeser.com
Telefon: +52 55 5258 1000

Unser Datenschutzbeauftragter kann unter der oben genannten Adresse für Fragen zu dieser Datenschutzrichtlinie kontaktiert werden.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. Datenerhebung",
          content: `Wir können die folgenden Kategorien personenbezogener Daten erfassen und verarbeiten:

Identifikationsdaten:
• Vollständiger Name, Titel und berufliche Position
• Kontaktinformationen (E-Mail-Adresse, Telefonnummer, Postanschrift)
• Firmen- oder Organisationsname
• Berufliche Qualifikationen und Zugehörigkeiten

Kommunikationsdaten:
• Korrespondenz und Kommunikation mit VWS
• Über unsere Kontaktformulare übermittelte Anfragen
• Abonnementpräferenzen für Newsletter und Publikationen

Technische Daten:
• IP-Adresse und Geräteinformationen
• Browsertyp und -version
• Besuchte Seiten und Verweildauer auf unserer Website`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. Datenverwendung",
          content: `Wir verwenden Ihre personenbezogenen Daten für folgende Zwecke:

Primäre Zwecke (erfordern keine zusätzliche Einwilligung):
• Zur Erbringung von Rechtsdienstleistungen und professioneller Beratung
• Zur Beantwortung Ihrer Anfragen und Kommunikation
• Zur Verwaltung unserer Mandantenbeziehungen
• Zur Einhaltung rechtlicher und regulatorischer Verpflichtungen

Sekundäre Zwecke (können Einwilligung erfordern):
• Zum Versenden von Newslettern, Publikationen und rechtlichen Updates
• Zur Einladung zu Veranstaltungen, Seminaren und Konferenzen
• Zur Durchführung von Umfragen und Sammlung von Feedback
• Zum Versenden von Marketingkommunikation über unsere Praxisbereiche

Sie können der Verarbeitung für sekundäre Zwecke jederzeit widersprechen, indem Sie uns unter privacidad@vonwobeser.com kontaktieren.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. Datenspeicherung",
          content: `Wir speichern Ihre personenbezogenen Daten nur so lange, wie es für die Erfüllung der Zwecke erforderlich ist, für die sie erhoben wurden, es sei denn, eine längere Aufbewahrungsfrist ist gesetzlich vorgeschrieben oder erlaubt.

Aufbewahrungsfristen:
• Mandantenakten und Rechtssachen: 10 Jahre nach Fallabschluss
• Allgemeine Anfragen und Kommunikation: 3 Jahre ab letztem Kontakt
• Newsletter-Abonnements: Bis zur Abmeldung
• Website-Analysedaten: 2 Jahre
• Buchhaltungs- und Rechnungsunterlagen: Gemäß Steuervorschriften

Nach Ablauf der geltenden Aufbewahrungsfrist werden wir Ihre personenbezogenen Daten sicher löschen oder anonymisieren.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. Datenweitergabe",
          content: `Wir können Ihre personenbezogenen Daten an folgende Empfängerkategorien weitergeben:

Innerhalb von VWS:
• Partner, Anwälte und Fachpersonal, die an Ihrer Angelegenheit beteiligt sind
• Verwaltungs- und Supportpersonal nach Bedarf

Dritte:
• Gerichte, Tribunale und Regulierungsbehörden (wie von Rechtsverfahren gefordert)
• Andere Anwaltskanzleien oder Fachleute, die an Ihrer Angelegenheit mitarbeiten (mit Ihrer Zustimmung)
• Dienstleister unter strengen Vertraulichkeitsvereinbarungen

Internationale Übertragungen:
Bei der Übertragung Ihrer Daten außerhalb Mexikos stellen wir sicher, dass angemessene Schutzmaßnahmen vorhanden sind.

Wir verkaufen Ihre personenbezogenen Daten niemals an Dritte zu Marketingzwecken.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. Ihre Rechte",
          content: `Nach mexikanischem Recht haben Sie folgende Rechte bezüglich Ihrer personenbezogenen Daten (ARCO-Rechte):

Zugang (Acceso):
Sie können eine Bestätigung anfordern, ob wir Ihre personenbezogenen Daten verarbeiten und Zugang zu diesen Daten erhalten.

Berichtigung (Rectificación):
Sie können die Berichtigung unrichtiger oder unvollständiger personenbezogener Daten verlangen.

Löschung (Cancelación):
Sie können die Löschung Ihrer personenbezogenen Daten verlangen, wenn sie für die Zwecke, für die sie erhoben wurden, nicht mehr erforderlich sind.

Widerspruch (Oposición):
Sie können der Verarbeitung Ihrer personenbezogenen Daten für bestimmte Zwecke widersprechen.

Zur Ausübung Ihrer Rechte:
E-Mail: privacidad@vonwobeser.com
Adresse: Torre SOMA Chapultepec, 18. Stock, Mexiko-Stadt`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Übertragungen an Dritte",
          content: `VWS kann Ihre personenbezogenen Daten unter folgenden Umständen an Dritte übertragen:

Übertragungen, die Einwilligung erfordern:
• An verbundene Anwaltskanzleien oder Korrespondenten in anderen Ländern
• An Marketing- und Kommunikationsdienstleister

Übertragungen, die keine Einwilligung erfordern:
• An Gerichte und Regierungsbehörden, wenn gesetzlich vorgeschrieben
• An Aufsichtsbehörden und Berufsverbände

Internationale Übertragungen:
Bei der Übertragung Ihrer Daten in Länder außerhalb Mexikos stellen wir sicher, dass angemessene Schutzmaßnahmen vorhanden sind, einschließlich Vertragsklauseln und der Verpflichtung des Empfängers zu Datenschutzprinzipien, die dem mexikanischen Recht entsprechen.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Cookie-Richtlinie",
          content: `Unsere Website verwendet Cookies und ähnliche Technologien, um Ihr Browsing-Erlebnis zu verbessern. Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden.

Arten von Cookies, die wir verwenden:

Essentielle Cookies: Notwendig für die ordnungsgemäße Funktion der Website.

Analyse-Cookies: Helfen uns zu verstehen, wie Besucher mit unserer Website interagieren.

Funktions-Cookies: Merken sich Ihre Präferenzen wie Spracheinstellungen.

Marketing-Cookies: Werden verwendet, um relevante Werbung anzuzeigen.

Cookie-Verwaltung:
Sie können Cookies über Ihre Browsereinstellungen kontrollieren und verwalten. Beachten Sie, dass das Deaktivieren bestimmter Cookies die Funktionalität unserer Website beeinträchtigen kann.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Datensicherheit",
          content: `VWS implementiert umfassende administrative, technische und physische Sicherheitsmaßnahmen zum Schutz Ihrer personenbezogenen Daten.

Administrative Maßnahmen:
• Benennung eines Datenschutzbeauftragten
• Interne Richtlinien und Verfahren für den Umgang mit Daten
• Schulung des Personals zu Datenschutz und Vertraulichkeit
• Regelmäßige Audits und Compliance-Überprüfungen

Technische Maßnahmen:
• Verschlüsselung sensibler Daten
• Sichere Zugriffskontrollen und Authentifizierungsmechanismen
• Firewalls und Intrusion-Detection-Systeme

Physische Maßnahmen:
• Eingeschränkter Zugang zu Einrichtungen mit personenbezogenen Daten
• Sicherheitssysteme einschließlich Überwachung

Trotz unserer besten Bemühungen ist keine Übertragungsmethode über das Internet zu 100% sicher. Wenn Sie Grund zu der Annahme haben, dass Ihre Daten kompromittiert wurden, kontaktieren Sie uns bitte sofort.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Änderungen dieser Richtlinie",
          content: `VWS behält sich das Recht vor, diese Datenschutzrichtlinie jederzeit zu ändern.

Wie wir Sie über Änderungen informieren:
• Wesentliche Änderungen werden per E-Mail an unsere Kunden und Kontakte kommuniziert
• Updates werden auf unserer Website mit dem neuen Gültigkeitsdatum veröffentlicht
• Bei wesentlichen Änderungen, die Ihre Rechte betreffen, können wir eine erneute Einwilligung einholen

Wir empfehlen Ihnen, diese Datenschutzrichtlinie regelmäßig zu überprüfen.

Diese Datenschutzrichtlinie wurde zuletzt im Dezember 2024 aktualisiert.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Kontakt",
          content: `Bei Fragen, Bedenken oder Anfragen zu dieser Datenschutzrichtlinie kontaktieren Sie bitte:

Datenschutzbeauftragter
Von Wobeser y Sierra, S.C.

Adresse:
Torre SOMA Chapultepec, 18. Stock
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexiko-Stadt, Mexiko

E-Mail: privacidad@vonwobeser.com
Telefon: +52 55 5258 1000

Öffnungszeiten: Montag bis Freitag, 9:00 bis 18:00 Uhr (Ortszeit Mexiko-Stadt)

Für allgemeine Anfragen zu unseren Rechtsdienstleistungen:
E-Mail: info@vonwobeser.com
Website: www.vonwobeser.com`
        }
      ]
    },
    zh: {
      title: "隐私政策",
      subtitle: "我们如何收集、使用和保护您的个人数据",
      lastUpdated: "最后更新：2024年12月",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. 简介",
          content: `Von Wobeser y Sierra, S.C.（"VWS"、"我们"或"我们的"）致力于保护您的隐私并确保您个人数据的安全。本隐私政策解释了当您访问我们的网站www.vonwobeser.com（"网站"）或与我们的服务互动时，我们如何收集、使用、披露和保护您的信息。

本隐私政策符合《私人持有个人数据保护联邦法》（LFPDPPP）及其条例，以及其他适用的墨西哥数据保护法律和国际最佳实践。

通过访问或使用我们的网站，您确认已阅读、理解并同意受本隐私政策的约束。如果您不同意我们的政策和做法，请不要使用我们的网站。`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. 数据控制者",
          content: `负责您个人数据的数据控制者是：

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18楼
Campos Elíseos 204, Colonia Polanco
C.P. 11560, 墨西哥城, 墨西哥

隐私相关咨询：
电子邮件：privacidad@vonwobeser.com
电话：+52 55 5258 1000

如对本隐私政策或行使您的数据保护权利有任何疑问，可通过上述地址联系我们的数据保护官。`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. 数据收集",
          content: `我们可能收集和处理以下类别的个人数据：

身份数据：
• 全名、头衔和职业职位
• 联系信息（电子邮件地址、电话号码、邮寄地址）
• 公司或组织名称
• 专业资质和从属关系

通信数据：
• 与VWS的往来信函
• 通过我们的联系表格提交的咨询
• 新闻通讯和出版物的订阅偏好

技术数据：
• IP地址和设备信息
• 浏览器类型和版本
• 操作系统
• 访问的页面和在我们网站上的停留时间

我们不会故意收集敏感个人数据，除非为法律代理所严格必需并征得您的明确同意。`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. 数据使用",
          content: `我们将您的个人数据用于以下目的：

主要目的（不需要额外同意）：
• 提供法律服务和专业建议
• 回复您的咨询和通信
• 管理我们的律师-客户关系
• 遵守法律和监管义务
• 管理和保护我们的网站和系统

次要目的（可能需要同意）：
• 发送新闻通讯、出版物和法律更新
• 邀请您参加活动、研讨会和会议
• 进行调查并收集对我们服务的反馈
• 发送关于我们业务领域的营销通信

您可以随时通过联系privacidad@vonwobeser.com选择退出次要目的。`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. 数据保留",
          content: `我们仅在完成收集目的所必需的时间内保留您的个人数据，除非法律要求或允许更长的保留期限。

保留期限：
• 客户档案和法律事务：案件结案后10年
• 一般咨询和通信：最后联系后3年
• 新闻通讯订阅：直到您取消订阅
• 网站分析数据：2年
• 会计和账单记录：根据税务法规要求

在适用的保留期限到期后，我们将安全地删除或匿名化您的个人数据。`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. 数据共享",
          content: `我们可能与以下类别的接收者共享您的个人数据：

在VWS内部：
• 参与您事务的合伙人、律师和专业人员
• 必要时的行政和支持人员
• VWS其他办公室以协调服务

第三方：
• 法院、法庭和监管机构（根据法律程序要求）
• 与您的事务合作的其他律师事务所或专业人员（经您同意）
• 在严格保密协议下的服务提供商

国际传输：
当我们将您的数据传输到墨西哥境外时，我们确保有适当的保障措施。

我们从不出于营销目的将您的个人数据出售给第三方。`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. 您的权利",
          content: `根据墨西哥法律，您对个人数据享有以下权利（称为ARCO权利）：

访问权（Acceso）：
您可以要求确认我们是否处理您的个人数据并获取该数据的访问权。

更正权（Rectificación）：
您可以要求更正不准确或不完整的个人数据。

删除权（Cancelación）：
当数据不再需要用于收集目的时，您可以要求删除您的个人数据。

反对权（Oposición）：
您可以反对为特定目的处理您的个人数据，特别是营销目的。

行使您的权利：
请将书面请求提交至：
电子邮件：privacidad@vonwobeser.com
地址：Torre SOMA Chapultepec, 18楼，墨西哥城

如果您对我们的回复不满意，可以向国家透明度、信息获取和个人数据保护研究所（INAI）提出投诉：www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. 第三方传输",
          content: `VWS可能在以下情况下将您的个人数据传输给第三方：

需要同意的传输：
• 向其他司法管辖区的附属律师事务所或通讯员提供法律服务
• 向营销和通信服务提供商进行促销活动
• 当您注册VWS赞助的活动时向活动组织者传输

不需要同意的传输（根据LFPDPPP第37条）：
• 当法律或法律程序要求时向法院和政府当局传输
• 作为我们合规义务的一部分向监管机构和专业协会传输
• 向拥有相同隐私政策的母公司、子公司或关联公司传输

国际传输：
当您的数据传输到墨西哥境外国家时，我们确保有适当的保障措施，包括合同条款和接收方对与墨西哥法律同等隐私原则的承诺。`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Cookie政策",
          content: `我们的网站使用Cookie和类似技术来增强您的浏览体验。Cookie是存储在您设备上的小型文本文件，帮助我们分析网站流量、记住您的偏好并改进功能。

我们使用的Cookie类型：

必要Cookie：网站正常运行所必需的。这些不能被禁用。

分析Cookie：通过收集匿名信息帮助我们了解访问者如何与我们的网站互动（例如Google Analytics）。

功能Cookie：记住您的偏好，如语言设置和显示选项。

营销Cookie：用于跨网站跟踪访问者以显示相关广告。

管理Cookie：
您可以通过浏览器设置控制和管理Cookie。请注意，禁用某些Cookie可能会影响我们网站的功能。`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. 安全措施",
          content: `VWS实施全面的行政、技术和物理安全措施，以保护您的个人数据免受丢失、未经授权的访问、损坏、更改或披露。

行政措施：
• 指定数据保护官
• 数据处理的内部政策和程序
• 对员工进行数据保护和保密培训
• 定期审计和合规审查
• 事件响应程序

技术措施：
• 传输和存储中敏感数据的加密
• 安全的访问控制和身份验证机制
• 防火墙和入侵检测系统
• 定期安全更新和漏洞评估

物理措施：
• 限制对存放个人数据设施的访问
• 包括监控和访问日志的安全系统

尽管我们尽了最大努力，但没有任何互联网传输方法或电子存储方法是100%安全的。如果您有理由相信您的个人数据已被泄露，请立即联系我们。`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. 政策变更",
          content: `VWS保留随时修改本隐私政策的权利，以反映我们数据处理实践、法律要求或其他运营或法律原因的变化。

我们如何通知您变更：
• 重大变更将通过电子邮件通知我们的客户和联系人
• 更新将发布在我们的网站上，并注明新的生效日期
• 对于影响您权利的重大变更，我们可能会要求重新同意

我们鼓励您定期查看本隐私政策，以了解我们如何保护您的个人数据。

本隐私政策最后更新于2024年12月，取代所有以前的版本。`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. 联系方式",
          content: `如对本隐私政策或我们的数据保护做法有任何问题、疑虑或请求，请联系：

数据保护官
Von Wobeser y Sierra, S.C.

地址：
Torre SOMA Chapultepec, 18楼
Campos Elíseos 204, Colonia Polanco
C.P. 11560, 墨西哥城, 墨西哥

电子邮件：privacidad@vonwobeser.com
电话：+52 55 5258 1000

办公时间：周一至周五，上午9:00至下午6:00（墨西哥城时间）

如需了解我们的法律服务：
电子邮件：info@vonwobeser.com
网站：www.vonwobeser.com`
        }
      ]
    },
    ko: {
      title: "개인정보 처리방침",
      subtitle: "개인 데이터를 수집, 사용 및 보호하는 방법",
      lastUpdated: "최종 업데이트: 2024년 12월",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. 소개",
          content: `Von Wobeser y Sierra, S.C.("VWS", "당사", "저희" 또는 "우리의")는 귀하의 개인정보를 보호하고 개인 데이터의 보안을 보장하기 위해 노력합니다. 이 개인정보 처리방침은 귀하가 당사 웹사이트 www.vonwobeser.com("웹사이트")을 방문하거나 당사 서비스와 상호작용할 때 귀하의 정보를 수집, 사용, 공개 및 보호하는 방법을 설명합니다.

이 개인정보 처리방침은 개인정보 보호에 관한 연방법(LFPDPPP) 및 그 규정, 기타 적용 가능한 멕시코 데이터 보호법 및 국제 모범 사례를 준수합니다.

당사 웹사이트에 접속하거나 사용함으로써 귀하는 이 개인정보 처리방침을 읽고, 이해하고, 이에 구속되는 것에 동의합니다.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. 데이터 관리자",
          content: `귀하의 개인 데이터를 책임지는 데이터 관리자는:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18층
Campos Elíseos 204, Colonia Polanco
C.P. 11560, 멕시코시티, 멕시코

개인정보 관련 문의:
이메일: privacidad@vonwobeser.com
전화: +52 55 5258 1000

이 개인정보 처리방침 또는 데이터 보호 권리 행사에 관한 질문이 있으시면 위 주소로 당사 데이터 보호 책임자에게 연락하실 수 있습니다.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. 수집하는 데이터",
          content: `당사는 다음 범주의 개인 데이터를 수집하고 처리할 수 있습니다:

식별 데이터:
• 성명, 직함 및 직위
• 연락처 정보(이메일 주소, 전화번호, 우편 주소)
• 회사 또는 조직명
• 전문 자격 및 소속

통신 데이터:
• VWS와의 서신 및 통신
• 연락처 양식을 통해 제출된 문의
• 뉴스레터 및 간행물 구독 선호도

기술 데이터:
• IP 주소 및 장치 정보
• 브라우저 유형 및 버전
• 운영 체제
• 방문한 페이지 및 웹사이트 체류 시간

당사는 법적 대리에 꼭 필요하고 귀하의 명시적 동의가 있는 경우를 제외하고 민감한 개인 데이터를 의도적으로 수집하지 않습니다.`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. 데이터 사용",
          content: `당사는 다음 목적으로 귀하의 개인 데이터를 사용합니다:

주요 목적(추가 동의 불필요):
• 법률 서비스 및 전문 조언 제공
• 귀하의 문의 및 통신에 응답
• 변호사-의뢰인 관계 관리
• 법적 및 규제 의무 준수
• 웹사이트 및 시스템 관리 및 보호

부수적 목적(동의가 필요할 수 있음):
• 뉴스레터, 간행물 및 법률 업데이트 발송
• 이벤트, 세미나 및 컨퍼런스 초대
• 서비스에 대한 설문조사 및 피드백 수집
• 업무 분야에 관한 마케팅 커뮤니케이션 발송

privacidad@vonwobeser.com으로 연락하여 언제든지 부수적 목적에서 제외될 수 있습니다.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. 데이터 보유",
          content: `당사는 법률에 의해 더 긴 보유 기간이 요구되거나 허용되지 않는 한, 개인 데이터를 수집 목적을 달성하는 데 필요한 기간 동안만 보유합니다.

보유 기간:
• 의뢰인 파일 및 법적 사안: 사건 종결 후 10년
• 일반 문의 및 통신: 마지막 연락 후 3년
• 뉴스레터 구독: 구독 취소 시까지
• 웹사이트 분석 데이터: 2년
• 회계 및 청구 기록: 세금 및 재정 규정에 따라 요구되는 대로

해당 보유 기간이 지나면 귀하의 개인 데이터를 안전하게 삭제하거나 익명화합니다.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. 데이터 공유",
          content: `당사는 다음 범주의 수신자와 귀하의 개인 데이터를 공유할 수 있습니다:

VWS 내부:
• 귀하의 사안에 관여하는 파트너, 변호사 및 전문 직원
• 필요에 따른 행정 및 지원 인력
• 서비스 조정을 위한 VWS의 다른 사무소

제3자:
• 법원, 재판소 및 규제 기관(법적 절차에 따라 요구되는 경우)
• 귀하의 사안에 협력하는 다른 법률 사무소 또는 전문가(귀하의 동의 하에)
• 엄격한 비밀 유지 계약 하의 서비스 제공업체

국제 전송:
멕시코 외부로 데이터를 전송할 때 적절한 보호 조치가 마련되어 있는지 확인합니다.

당사는 마케팅 목적으로 귀하의 개인 데이터를 제3자에게 판매하지 않습니다.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. 귀하의 권리",
          content: `멕시코 법률에 따라 귀하는 개인 데이터에 관해 다음과 같은 권리를 가집니다(ARCO 권리):

접근권(Acceso):
당사가 귀하의 개인 데이터를 처리하는지 확인을 요청하고 해당 데이터에 접근할 수 있습니다.

정정권(Rectificación):
부정확하거나 불완전한 개인 데이터의 정정을 요청할 수 있습니다.

삭제권(Cancelación):
수집 목적에 더 이상 필요하지 않은 경우 개인 데이터의 삭제를 요청할 수 있습니다.

반대권(Oposición):
특정 목적, 특히 마케팅 및 부수적 목적을 위한 개인 데이터 처리에 반대할 수 있습니다.

권리 행사:
서면 요청을 제출하세요:
이메일: privacidad@vonwobeser.com
주소: Torre SOMA Chapultepec, 18층, 멕시코시티

당사의 응답에 만족하지 못하시면 국가 투명성, 정보 접근 및 개인 데이터 보호 연구소(INAI)에 불만을 제기할 수 있습니다: www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. 제3자 전송",
          content: `VWS는 다음 상황에서 귀하의 개인 데이터를 제3자에게 전송할 수 있습니다:

동의가 필요한 전송:
• 법률 서비스 제공을 위해 다른 관할권의 제휴 법률 사무소 또는 통신원에게
• 홍보 활동을 위한 마케팅 및 커뮤니케이션 서비스 제공업체에게
• VWS 후원 이벤트 등록 시 이벤트 주최자에게

동의가 필요하지 않은 전송(LFPDPPP 제37조에 따라 허용):
• 법률 또는 법적 절차에 의해 요구될 때 법원 및 정부 기관에
• 규정 준수 의무의 일환으로 규제 기관 및 전문 협회에
• 동일한 개인정보 보호정책을 공유하는 공동 지배 하의 모회사, 자회사 또는 계열사에

국제 전송:
귀하의 데이터가 멕시코 외부 국가로 전송될 때, 계약 조항 및 수신자의 멕시코 법률과 동등한 개인정보 보호 원칙에 대한 약속을 포함한 적절한 보호 조치가 마련되어 있는지 확인합니다.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. 쿠키 정책",
          content: `당사 웹사이트는 브라우징 경험을 향상시키기 위해 쿠키 및 유사한 기술을 사용합니다. 쿠키는 장치에 저장되는 작은 텍스트 파일로, 웹사이트 트래픽 분석, 선호도 기억 및 기능 개선에 도움이 됩니다.

사용하는 쿠키 유형:

필수 쿠키: 웹사이트가 제대로 작동하는 데 필요합니다. 비활성화할 수 없습니다.

분석 쿠키: 익명 정보를 수집하여 방문자가 웹사이트와 상호작용하는 방식을 이해하는 데 도움이 됩니다(예: Google Analytics).

기능 쿠키: 언어 설정 및 표시 옵션과 같은 선호도를 기억합니다.

마케팅 쿠키: 관련 광고를 표시하기 위해 웹사이트 전체에서 방문자를 추적하는 데 사용됩니다.

쿠키 관리:
브라우저 설정을 통해 쿠키를 제어하고 관리할 수 있습니다. 특정 쿠키를 비활성화하면 웹사이트 기능에 영향을 줄 수 있습니다.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. 보안 조치",
          content: `VWS는 귀하의 개인 데이터를 손실, 무단 접근, 손상, 변경 또는 공개로부터 보호하기 위해 포괄적인 행정적, 기술적, 물리적 보안 조치를 구현합니다.

행정적 조치:
• 데이터 보호 책임자 지정
• 데이터 처리를 위한 내부 정책 및 절차
• 데이터 보호 및 기밀 유지에 관한 직원 교육
• 정기 감사 및 규정 준수 검토
• 사고 대응 절차

기술적 조치:
• 전송 및 저장 시 민감한 데이터 암호화
• 안전한 접근 제어 및 인증 메커니즘
• 방화벽 및 침입 탐지 시스템
• 정기적인 보안 업데이트 및 취약성 평가

물리적 조치:
• 개인 데이터가 있는 시설에 대한 접근 제한
• 감시 및 접근 로그를 포함한 보안 시스템

최선을 다하고 있지만, 인터넷을 통한 전송이나 전자 저장 방법은 100% 안전하지 않습니다. 개인 데이터가 손상되었다고 믿을 만한 이유가 있으면 즉시 연락해 주세요.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. 정책 변경",
          content: `VWS는 데이터 처리 관행, 법적 요구 사항 또는 기타 운영 또는 법적 이유의 변경을 반영하기 위해 언제든지 이 개인정보 처리방침을 수정할 권리를 보유합니다.

변경 사항 통지 방법:
• 중요한 변경 사항은 고객 및 연락처에 이메일로 전달됩니다
• 업데이트는 새로운 시행일과 함께 웹사이트에 게시됩니다
• 귀하의 권리에 영향을 미치는 중대한 변경의 경우, 갱신된 동의를 요청할 수 있습니다

귀하의 개인 데이터를 어떻게 보호하는지 알 수 있도록 이 개인정보 처리방침을 정기적으로 검토하시기 바랍니다.

이 개인정보 처리방침은 2024년 12월에 마지막으로 업데이트되었으며 모든 이전 버전을 대체합니다.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. 연락처",
          content: `이 개인정보 처리방침 또는 데이터 보호 관행에 관한 질문, 우려 사항 또는 요청이 있으시면 연락해 주세요:

데이터 보호 책임자
Von Wobeser y Sierra, S.C.

주소:
Torre SOMA Chapultepec, 18층
Campos Elíseos 204, Colonia Polanco
C.P. 11560, 멕시코시티, 멕시코

이메일: privacidad@vonwobeser.com
전화: +52 55 5258 1000

영업 시간: 월요일~금요일, 오전 9:00 ~ 오후 6:00 (멕시코시티 시간)

법률 서비스에 관한 일반 문의:
이메일: info@vonwobeser.com
웹사이트: www.vonwobeser.com`
        }
      ]
    },
    ja: {
      title: "プライバシーポリシー",
      subtitle: "お客様の個人データの収集、使用、保護方法について",
      lastUpdated: "最終更新：2024年12月",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. はじめに",
          content: `Von Wobeser y Sierra, S.C.（「VWS」、「当事務所」、「当社」または「私たち」）は、お客様のプライバシーを保護し、個人データのセキュリティを確保することに努めています。このプライバシーポリシーは、お客様が当社のウェブサイトwww.vonwobeser.com（「ウェブサイト」）を訪問したり、当社のサービスとやり取りする際に、お客様の情報をどのように収集、使用、開示、保護するかを説明するものです。

このプライバシーポリシーは、民間個人データ保護連邦法（LFPDPPP）およびその規則、その他の適用されるメキシコのデータ保護法、国際的なベストプラクティスに準拠しています。

当社のウェブサイトにアクセスまたは使用することにより、お客様はこのプライバシーポリシーを読み、理解し、これに拘束されることに同意したことを認めます。`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. データ管理者",
          content: `お客様の個人データを管理するデータ管理者は：

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18階
Campos Elíseos 204, Colonia Polanco
C.P. 11560, メキシコシティ, メキシコ

プライバシーに関するお問い合わせ：
メール：privacidad@vonwobeser.com
電話：+52 55 5258 1000

このプライバシーポリシーまたはデータ保護権の行使に関するご質問は、上記住所にある当社のデータ保護責任者にお問い合わせください。`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. 収集するデータ",
          content: `当社は以下のカテゴリーの個人データを収集し、処理する場合があります：

識別データ：
• 氏名、役職、職位
• 連絡先情報（メールアドレス、電話番号、郵送先住所）
• 会社または組織名
• 専門資格および所属

通信データ：
• VWSとの通信
• お問い合わせフォームを通じて送信されたお問い合わせ
• ニュースレターおよび出版物の購読設定

技術データ：
• IPアドレスおよびデバイス情報
• ブラウザの種類とバージョン
• オペレーティングシステム
• 訪問したページとウェブサイトでの滞在時間

当社は、法的代理に厳密に必要であり、お客様の明示的な同意がある場合を除き、機密性の高い個人データを意図的に収集しません。`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. データの使用",
          content: `当社はお客様の個人データを以下の目的で使用します：

主要目的（追加の同意は不要）：
• 法律サービスおよび専門的アドバイスの提供
• お客様のお問い合わせおよびコミュニケーションへの対応
• 弁護士-依頼人関係の管理
• 法的および規制上の義務の遵守
• ウェブサイトおよびシステムの管理と保護

副次的目的（同意が必要な場合があります）：
• ニュースレター、出版物、法律の最新情報の送信
• イベント、セミナー、カンファレンスへの招待
• サービスに関する調査およびフィードバックの収集
• 業務分野に関するマーケティングコミュニケーションの送信

privacidad@vonwobeser.comにご連絡いただくことで、いつでも副次的目的からオプトアウトできます。`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. データの保持",
          content: `当社は、法律によりより長い保持期間が要求または許可されない限り、収集された目的を達成するために必要な期間のみお客様の個人データを保持します。

保持期間：
• 依頼人ファイルおよび法的案件：案件終了後10年
• 一般的なお問い合わせおよびコミュニケーション：最後の連絡から3年
• ニュースレターの購読：購読解除まで
• ウェブサイト分析データ：2年
• 会計および請求記録：税務および財務規制の要件に従う

該当する保持期間が過ぎた後、当社はお客様の個人データを安全に削除または匿名化します。`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. データの共有",
          content: `当社は、以下のカテゴリーの受領者とお客様の個人データを共有する場合があります：

VWS内：
• お客様の案件に関与するパートナー、弁護士、専門スタッフ
• 必要に応じた管理およびサポート担当者
• サービス調整のためのVWSの他のオフィス

第三者：
• 裁判所、審判所、規制当局（法的手続きに必要な場合）
• お客様の案件に協力する他の法律事務所または専門家（お客様の同意を得て）
• 厳格な機密保持契約の下でのサービスプロバイダー

国際転送：
メキシコ国外にデータを転送する場合、適切な保護措置が講じられていることを確認します。

当社はマーケティング目的でお客様の個人データを第三者に販売することはありません。`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. お客様の権利",
          content: `メキシコ法の下で、お客様は個人データに関して以下の権利を有します（ARCO権利）：

アクセス権（Acceso）：
当社がお客様の個人データを処理しているかどうかの確認を要求し、そのデータへのアクセスを得ることができます。

訂正権（Rectificación）：
不正確または不完全な個人データの訂正を要求できます。

消去権（Cancelación）：
収集された目的に必要なくなった場合、個人データの削除を要求できます。

異議申立権（Oposición）：
特定の目的、特にマーケティングおよび副次的目的のための個人データの処理に異議を唱えることができます。

権利の行使：
書面による要求を以下に提出してください：
メール：privacidad@vonwobeser.com
住所：Torre SOMA Chapultepec, 18階、メキシコシティ

当社の対応にご満足いただけない場合は、国立透明性・情報アクセス・個人データ保護研究所（INAI）に苦情を申し立てることができます：www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. 第三者への転送",
          content: `VWSは以下の状況でお客様の個人データを第三者に転送する場合があります：

同意が必要な転送：
• 法律サービス提供のため、他の管轄区域の提携法律事務所または通信員へ
• 販促活動のためのマーケティングおよびコミュニケーションサービスプロバイダーへ
• VWSが後援するイベントに登録する際、イベント主催者へ

同意が不要な転送（LFPDPPP第37条により許可）：
• 法律または法的手続きにより要求される場合、裁判所および政府機関へ
• コンプライアンス義務の一環として、規制機関および専門団体へ
• 同じプライバシーポリシーを共有する共同支配下の親会社、子会社、または関連会社へ

国際転送：
お客様のデータがメキシコ国外の国に転送される場合、契約条項およびメキシコ法と同等のプライバシー原則への受領者のコミットメントを含む適切な保護措置が講じられていることを確認します。`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Cookieポリシー",
          content: `当社のウェブサイトは、ブラウジング体験を向上させるためにCookieおよび類似の技術を使用しています。Cookieは、ウェブサイトのトラフィックを分析し、設定を記憶し、機能を向上させるのに役立つ、お客様のデバイスに保存される小さなテキストファイルです。

使用するCookieの種類：

必須Cookie：ウェブサイトが正しく機能するために必要です。これらは無効にできません。

分析Cookie：匿名情報を収集することで、訪問者がウェブサイトとどのようにやり取りしているかを理解するのに役立ちます。

機能Cookie：言語設定や表示オプションなどの設定を記憶します。

マーケティングCookie：関連する広告を表示するためにウェブサイト全体で訪問者を追跡するために使用されます。

Cookieの管理：
ブラウザの設定を通じてCookieを制御および管理できます。特定のCookieを無効にすると、ウェブサイトの機能に影響を与える場合があることにご注意ください。`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. セキュリティ対策",
          content: `VWSは、お客様の個人データを紛失、不正アクセス、損傷、改ざん、または開示から保護するための包括的な管理的、技術的、物理的なセキュリティ対策を実施しています。

管理的対策：
• データ保護責任者の指定
• データ取り扱いに関する内部ポリシーと手順
• データ保護と機密保持に関する従業員研修
• 定期的な監査とコンプライアンスレビュー
• インシデント対応手順

技術的対策：
• 転送中および保存中の機密データの暗号化
• 安全なアクセス制御と認証メカニズム
• ファイアウォールと侵入検知システム
• 定期的なセキュリティアップデートと脆弱性評価

物理的対策：
• 個人データを保管する施設へのアクセス制限
• 監視とアクセスログを含むセキュリティシステム

最善を尽くしていますが、インターネットを介した送信方法や電子ストレージは100％安全ではありません。個人データが侵害されたと思われる理由がある場合は、すぐにご連絡ください。`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. ポリシーの変更",
          content: `VWSは、データ処理慣行、法的要件、その他の運営上または法的理由の変更を反映するために、いつでもこのプライバシーポリシーを変更する権利を留保します。

変更の通知方法：
• 重要な変更は、お客様およびコンタクトにメールで通知されます
• 更新は新しい発効日とともにウェブサイトに掲載されます
• お客様の権利に影響を与える重大な変更については、同意の更新をお願いする場合があります

当社がお客様の個人データをどのように保護しているかについて常に情報を得るために、このプライバシーポリシーを定期的に確認することをお勧めします。

このプライバシーポリシーは2024年12月に最終更新され、以前のすべてのバージョンに代わるものです。`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. お問い合わせ",
          content: `このプライバシーポリシーまたは当社のデータ保護慣行に関するご質問、ご懸念、またはご要望がございましたら、以下にお問い合わせください：

データ保護責任者
Von Wobeser y Sierra, S.C.

住所：
Torre SOMA Chapultepec, 18階
Campos Elíseos 204, Colonia Polanco
C.P. 11560, メキシコシティ, メキシコ

メール：privacidad@vonwobeser.com
電話：+52 55 5258 1000

営業時間：月曜日〜金曜日、午前9:00〜午後6:00（メキシコシティ時間）

当社の法律サービスに関する一般的なお問い合わせ：
メール：info@vonwobeser.com
ウェブサイト：www.vonwobeser.com`
        }
      ]
    },
    ar: {
      title: "سياسة الخصوصية",
      subtitle: "كيف نجمع ونستخدم ونحمي بياناتك الشخصية",
      lastUpdated: "آخر تحديث: ديسمبر 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. مقدمة",
          content: `تلتزم Von Wobeser y Sierra, S.C. ("VWS" أو "نحن" أو "لنا") بحماية خصوصيتك وضمان أمان بياناتك الشخصية. توضح سياسة الخصوصية هذه كيف نجمع ونستخدم ونفصح ونحمي معلوماتك عند زيارة موقعنا الإلكتروني www.vonwobeser.com ("الموقع الإلكتروني") أو التفاعل مع خدماتنا.

تتوافق سياسة الخصوصية هذه مع القانون الفيدرالي لحماية البيانات الشخصية المملوكة للجهات الخاصة (LFPDPPP) ولوائحه، بالإضافة إلى قوانين حماية البيانات المكسيكية الأخرى المعمول بها وأفضل الممارسات الدولية.

بالوصول إلى موقعنا الإلكتروني أو استخدامه، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بسياسة الخصوصية هذه.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. المسؤول عن البيانات",
          content: `المسؤول عن بياناتك الشخصية هو:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec، الطابق 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560، مدينة مكسيكو، المكسيك

للاستفسارات المتعلقة بالخصوصية:
البريد الإلكتروني: privacidad@vonwobeser.com
الهاتف: +52 55 5258 1000

يمكن الاتصال بمسؤول حماية البيانات لدينا على العنوان أعلاه لأي أسئلة تتعلق بسياسة الخصوصية هذه أو ممارسة حقوق حماية البيانات الخاصة بك.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. جمع البيانات",
          content: `قد نجمع ونعالج الفئات التالية من البيانات الشخصية:

بيانات التعريف:
• الاسم الكامل والمسمى الوظيفي والموقع المهني
• معلومات الاتصال (عنوان البريد الإلكتروني، رقم الهاتف، العنوان البريدي)
• اسم الشركة أو المنظمة
• المؤهلات المهنية والانتماءات

بيانات الاتصال:
• المراسلات والاتصالات مع VWS
• الاستفسارات المقدمة من خلال نماذج الاتصال الخاصة بنا
• تفضيلات الاشتراك في النشرات الإخبارية والمنشورات

البيانات التقنية:
• عنوان IP ومعلومات الجهاز
• نوع المتصفح والإصدار
• نظام التشغيل
• الصفحات التي تمت زيارتها والوقت المستغرق على موقعنا الإلكتروني

نحن لا نجمع عمداً بيانات شخصية حساسة إلا إذا كانت ضرورية للتمثيل القانوني وبموافقتك الصريحة.`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. استخدام البيانات",
          content: `نستخدم بياناتك الشخصية للأغراض التالية:

الأغراض الأساسية (لا تتطلب موافقة إضافية):
• لتقديم الخدمات القانونية والاستشارات المهنية
• للرد على استفساراتك واتصالاتك
• لإدارة علاقاتنا مع العملاء
• للامتثال للالتزامات القانونية والتنظيمية
• لإدارة وحماية موقعنا الإلكتروني وأنظمتنا

الأغراض الثانوية (قد تتطلب موافقة):
• لإرسال النشرات الإخبارية والمنشورات والتحديثات القانونية
• لدعوتك إلى الفعاليات والندوات والمؤتمرات
• لإجراء استطلاعات وجمع التعليقات على خدماتنا
• لإرسال اتصالات تسويقية حول مجالات ممارستنا

يمكنك الانسحاب من الأغراض الثانوية في أي وقت عن طريق الاتصال بنا على privacidad@vonwobeser.com.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. الاحتفاظ بالبيانات",
          content: `نحتفظ ببياناتك الشخصية فقط طالما كان ذلك ضرورياً لتحقيق الأغراض التي جُمعت من أجلها، ما لم يكن القانون يتطلب أو يسمح بفترة احتفاظ أطول.

فترات الاحتفاظ:
• ملفات العملاء والمسائل القانونية: 10 سنوات بعد إغلاق القضية
• الاستفسارات العامة والاتصالات: 3 سنوات من آخر اتصال
• اشتراكات النشرة الإخبارية: حتى إلغاء الاشتراك
• بيانات تحليلات الموقع: سنتان
• سجلات المحاسبة والفواتير: حسب ما تتطلبه لوائح الضرائب والمالية

بعد انتهاء فترة الاحتفاظ المعمول بها، سنقوم بحذف بياناتك الشخصية بشكل آمن أو إخفاء هويتها.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. مشاركة البيانات",
          content: `قد نشارك بياناتك الشخصية مع الفئات التالية من المستلمين:

داخل VWS:
• الشركاء والمحامون والموظفون المهنيون المشاركون في شأنك
• الموظفون الإداريون والدعم حسب الضرورة
• مكاتب VWS الأخرى لتنسيق الخدمات

أطراف ثالثة:
• المحاكم والهيئات التنظيمية (حسب متطلبات الإجراءات القانونية)
• مكاتب المحاماة أو المهنيين الآخرين المتعاونين في شأنك (بموافقتك)
• مقدمو الخدمات بموجب اتفاقيات سرية صارمة

التحويلات الدولية:
عندما ننقل بياناتك خارج المكسيك، نضمن وجود ضمانات مناسبة.

نحن لا نبيع أبداً بياناتك الشخصية لأطراف ثالثة لأغراض التسويق.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. حقوقك",
          content: `بموجب القانون المكسيكي، لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية (المعروفة باسم حقوق ARCO):

حق الوصول (Acceso):
يمكنك طلب تأكيد ما إذا كنا نعالج بياناتك الشخصية والوصول إلى هذه البيانات.

حق التصحيح (Rectificación):
يمكنك طلب تصحيح البيانات الشخصية غير الدقيقة أو غير المكتملة.

حق الإلغاء (Cancelación):
يمكنك طلب حذف بياناتك الشخصية عندما لم تعد ضرورية للأغراض التي جُمعت من أجلها.

حق المعارضة (Oposición):
يمكنك الاعتراض على معالجة بياناتك الشخصية لأغراض محددة، وخاصة لأغراض التسويق.

لممارسة حقوقك:
قدم طلباً كتابياً إلى:
البريد الإلكتروني: privacidad@vonwobeser.com
العنوان: Torre SOMA Chapultepec، الطابق 18، مدينة مكسيكو

إذا لم تكن راضياً عن ردنا، يمكنك تقديم شكوى إلى المعهد الوطني للشفافية والوصول إلى المعلومات وحماية البيانات الشخصية (INAI) على www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. التحويلات إلى أطراف ثالثة",
          content: `قد تنقل VWS بياناتك الشخصية إلى أطراف ثالثة في الظروف التالية:

التحويلات التي تتطلب موافقة:
• إلى مكاتب المحاماة التابعة أو المراسلين في ولايات قضائية أخرى لتقديم الخدمات القانونية
• إلى مقدمي خدمات التسويق والاتصالات للأنشطة الترويجية
• إلى منظمي الفعاليات عند التسجيل في الفعاليات التي ترعاها VWS

التحويلات التي لا تتطلب موافقة (وفقاً للمادة 37 من LFPDPPP):
• إلى المحاكم والسلطات الحكومية عندما يتطلبها القانون أو الإجراءات القانونية
• إلى الهيئات التنظيمية والجمعيات المهنية كجزء من التزامات الامتثال لدينا
• إلى الشركات الأم أو الشركات التابعة أو المنتسبة تحت سيطرة مشتركة

التحويلات الدولية:
عندما يتم نقل بياناتك إلى دول خارج المكسيك، نضمن وجود ضمانات مناسبة، بما في ذلك البنود التعاقدية والتزام المتلقي بمبادئ الخصوصية المكافئة للقانون المكسيكي.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. سياسة ملفات تعريف الارتباط",
          content: `يستخدم موقعنا الإلكتروني ملفات تعريف الارتباط والتقنيات المماثلة لتحسين تجربة التصفح الخاصة بك. ملفات تعريف الارتباط هي ملفات نصية صغيرة مخزنة على جهازك تساعدنا في تحليل حركة مرور الموقع وتذكر تفضيلاتك وتحسين الوظائف.

أنواع ملفات تعريف الارتباط التي نستخدمها:

ملفات تعريف الارتباط الأساسية: ضرورية لعمل الموقع بشكل صحيح. لا يمكن تعطيلها.

ملفات تعريف الارتباط التحليلية: تساعدنا على فهم كيفية تفاعل الزوار مع موقعنا من خلال جمع معلومات مجهولة الهوية.

ملفات تعريف الارتباط الوظيفية: تتذكر تفضيلاتك مثل إعدادات اللغة وخيارات العرض.

ملفات تعريف الارتباط التسويقية: تستخدم لتتبع الزوار عبر المواقع لعرض الإعلانات ذات الصلة.

إدارة ملفات تعريف الارتباط:
يمكنك التحكم في ملفات تعريف الارتباط وإدارتها من خلال إعدادات متصفحك. لاحظ أن تعطيل ملفات تعريف الارتباط معينة قد يؤثر على وظائف موقعنا.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. إجراءات الأمان",
          content: `تنفذ VWS إجراءات أمان إدارية وتقنية ومادية شاملة لحماية بياناتك الشخصية من الفقدان أو الوصول غير المصرح به أو الضرر أو التغيير أو الإفصاح.

الإجراءات الإدارية:
• تعيين مسؤول حماية البيانات
• السياسات والإجراءات الداخلية للتعامل مع البيانات
• تدريب الموظفين على حماية البيانات والسرية
• عمليات التدقيق المنتظمة ومراجعات الامتثال
• إجراءات الاستجابة للحوادث

الإجراءات التقنية:
• تشفير البيانات الحساسة أثناء النقل وأثناء التخزين
• ضوابط الوصول الآمنة وآليات المصادقة
• جدران الحماية وأنظمة كشف التسلل
• تحديثات الأمان المنتظمة وتقييمات الثغرات

الإجراءات المادية:
• تقييد الوصول إلى المرافق التي تحتوي على بيانات شخصية
• أنظمة الأمان بما في ذلك المراقبة وسجلات الوصول

على الرغم من جهودنا القصوى، لا توجد طريقة نقل عبر الإنترنت أو تخزين إلكتروني آمنة بنسبة 100%. إذا كان لديك سبب للاعتقاد بأن بياناتك الشخصية قد تعرضت للخطر، يرجى الاتصال بنا فوراً.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. التغييرات على السياسة",
          content: `تحتفظ VWS بالحق في تعديل سياسة الخصوصية هذه في أي وقت لتعكس التغييرات في ممارسات معالجة البيانات لدينا أو المتطلبات القانونية أو أسباب تشغيلية أو قانونية أخرى.

كيف نبلغك بالتغييرات:
• سيتم إبلاغ التغييرات الجوهرية عبر البريد الإلكتروني لعملائنا وجهات الاتصال
• سيتم نشر التحديثات على موقعنا الإلكتروني مع تاريخ السريان الجديد
• بالنسبة للتغييرات الجوهرية التي تؤثر على حقوقك، قد نطلب موافقة متجددة

نشجعك على مراجعة سياسة الخصوصية هذه بشكل دوري للبقاء على اطلاع بكيفية حماية بياناتك الشخصية.

تم تحديث سياسة الخصوصية هذه آخر مرة في ديسمبر 2024 وتحل محل جميع الإصدارات السابقة.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. معلومات الاتصال",
          content: `لأي أسئلة أو مخاوف أو طلبات تتعلق بسياسة الخصوصية هذه أو ممارسات حماية البيانات لدينا، يرجى الاتصال بـ:

مسؤول حماية البيانات
Von Wobeser y Sierra, S.C.

العنوان:
Torre SOMA Chapultepec، الطابق 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560، مدينة مكسيكو، المكسيك

البريد الإلكتروني: privacidad@vonwobeser.com
الهاتف: +52 55 5258 1000

ساعات العمل: الاثنين إلى الجمعة، 9:00 صباحاً إلى 6:00 مساءً (بتوقيت مدينة مكسيكو)

للاستفسارات العامة حول خدماتنا القانونية:
البريد الإلكتروني: info@vonwobeser.com
الموقع الإلكتروني: www.vonwobeser.com`
        }
      ]
    },
    ru: {
      title: "Политика конфиденциальности",
      subtitle: "Как мы собираем, используем и защищаем ваши персональные данные",
      lastUpdated: "Последнее обновление: Декабрь 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. Введение",
          content: `Von Wobeser y Sierra, S.C. («VWS», «мы», «нас» или «наш») обязуется защищать вашу конфиденциальность и обеспечивать безопасность ваших персональных данных. Настоящая Политика конфиденциальности объясняет, как мы собираем, используем, раскрываем и защищаем вашу информацию, когда вы посещаете наш веб-сайт www.vonwobeser.com («Веб-сайт») или взаимодействуете с нашими услугами.

Настоящая Политика конфиденциальности соответствует Федеральному закону о защите персональных данных (LFPDPPP) и его нормативным актам, а также другим применимым мексиканским законам о защите данных и международным лучшим практикам.

Получая доступ к нашему Веб-сайту или используя его, вы подтверждаете, что прочитали, поняли и соглашаетесь соблюдать настоящую Политику конфиденциальности.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. Контролёр данных",
          content: `Контролёром ваших персональных данных является:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18 этаж
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Мехико, Мексика

По вопросам конфиденциальности:
Электронная почта: privacidad@vonwobeser.com
Телефон: +52 55 5258 1000

С нашим Сотрудником по защите данных можно связаться по указанному выше адресу для решения любых вопросов, касающихся настоящей Политики конфиденциальности или осуществления ваших прав на защиту данных.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. Сбор данных",
          content: `Мы можем собирать и обрабатывать следующие категории персональных данных:

Идентификационные данные:
• Полное имя, должность и профессиональное положение
• Контактная информация (адрес электронной почты, номер телефона, почтовый адрес)
• Название компании или организации
• Профессиональные квалификации и принадлежность

Коммуникационные данные:
• Переписка и коммуникации с VWS
• Запросы, отправленные через наши контактные формы
• Предпочтения подписки на информационные бюллетени и публикации

Технические данные:
• IP-адрес и информация об устройстве
• Тип и версия браузера
• Операционная система
• Посещённые страницы и время, проведённое на нашем Веб-сайте

Мы не собираем намеренно чувствительные персональные данные, если это не строго необходимо для юридического представительства и с вашего явного согласия.`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. Использование данных",
          content: `Мы используем ваши персональные данные для следующих целей:

Основные цели (не требуют дополнительного согласия):
• Для предоставления юридических услуг и профессиональных консультаций
• Для ответа на ваши запросы и коммуникации
• Для управления нашими отношениями адвокат-клиент
• Для соблюдения юридических и нормативных обязательств
• Для администрирования и защиты нашего Веб-сайта и систем

Второстепенные цели (могут требовать согласия):
• Для отправки информационных бюллетеней, публикаций и правовых обновлений
• Для приглашения на мероприятия, семинары и конференции
• Для проведения опросов и сбора отзывов о наших услугах
• Для отправки маркетинговых сообщений о наших практических областях

Вы можете отказаться от второстепенных целей в любое время, связавшись с нами по адресу privacidad@vonwobeser.com.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. Хранение данных",
          content: `Мы храним ваши персональные данные только столько времени, сколько необходимо для достижения целей, для которых они были собраны, если законом не требуется или не разрешён более длительный срок хранения.

Сроки хранения:
• Клиентские дела и юридические вопросы: 10 лет после закрытия дела
• Общие запросы и коммуникации: 3 года с последнего контакта
• Подписки на информационные бюллетени: До отмены подписки
• Аналитические данные веб-сайта: 2 года
• Бухгалтерские и платёжные записи: В соответствии с требованиями налогового законодательства

По истечении применимого срока хранения мы безопасно удалим или анонимизируем ваши персональные данные.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. Передача данных",
          content: `Мы можем делиться вашими персональными данными со следующими категориями получателей:

Внутри VWS:
• Партнёры, адвокаты и профессиональные сотрудники, участвующие в вашем деле
• Административный и вспомогательный персонал по мере необходимости
• Другие офисы VWS для координации услуг

Третьи стороны:
• Суды, трибуналы и регулирующие органы (по требованию судебных разбирательств)
• Другие юридические фирмы или специалисты, сотрудничающие по вашему делу (с вашего согласия)
• Поставщики услуг на основе строгих соглашений о конфиденциальности

Международные передачи:
При передаче ваших данных за пределы Мексики мы обеспечиваем наличие соответствующих защитных мер.

Мы никогда не продаём ваши персональные данные третьим лицам в маркетинговых целях.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. Ваши права",
          content: `В соответствии с мексиканским законодательством вы имеете следующие права в отношении ваших персональных данных (известные как права ARCO):

Доступ (Acceso):
Вы можете запросить подтверждение того, обрабатываем ли мы ваши персональные данные, и получить доступ к ним.

Исправление (Rectificación):
Вы можете запросить исправление неточных или неполных персональных данных.

Удаление (Cancelación):
Вы можете запросить удаление ваших персональных данных, когда они больше не нужны для целей, для которых были собраны.

Возражение (Oposición):
Вы можете возразить против обработки ваших персональных данных для определённых целей, особенно для маркетинга.

Для осуществления своих прав:
Отправьте письменный запрос по адресу:
Электронная почта: privacidad@vonwobeser.com
Адрес: Torre SOMA Chapultepec, 18 этаж, Мехико

Если вы не удовлетворены нашим ответом, вы можете подать жалобу в Национальный институт прозрачности, доступа к информации и защиты персональных данных (INAI): www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Передача третьим сторонам",
          content: `VWS может передавать ваши персональные данные третьим сторонам в следующих обстоятельствах:

Передачи, требующие согласия:
• Аффилированным юридическим фирмам или корреспондентам в других юрисдикциях для оказания юридических услуг
• Поставщикам маркетинговых и коммуникационных услуг для рекламной деятельности
• Организаторам мероприятий при регистрации на мероприятия, спонсируемые VWS

Передачи, не требующие согласия (в соответствии со статьёй 37 LFPDPPP):
• Судам и государственным органам, когда этого требует закон или судебные разбирательства
• Регулирующим органам и профессиональным ассоциациям в рамках наших обязательств по соблюдению требований
• Материнским компаниям, дочерним компаниям или аффилированным лицам под общим контролем

Международные передачи:
При передаче ваших данных в страны за пределами Мексики мы обеспечиваем наличие соответствующих защитных мер, включая договорные положения и обязательство получателя соблюдать принципы конфиденциальности, эквивалентные мексиканскому законодательству.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Политика в отношении файлов cookie",
          content: `Наш Веб-сайт использует файлы cookie и аналогичные технологии для улучшения вашего опыта просмотра. Файлы cookie — это небольшие текстовые файлы, сохраняемые на вашем устройстве, которые помогают нам анализировать трафик веб-сайта, запоминать ваши предпочтения и улучшать функциональность.

Типы используемых файлов cookie:

Необходимые файлы cookie: Необходимы для правильной работы Веб-сайта. Их нельзя отключить.

Аналитические файлы cookie: Помогают нам понять, как посетители взаимодействуют с нашим Веб-сайтом, собирая анонимную информацию.

Функциональные файлы cookie: Запоминают ваши предпочтения, такие как языковые настройки и параметры отображения.

Маркетинговые файлы cookie: Используются для отслеживания посетителей на веб-сайтах с целью показа релевантной рекламы.

Управление файлами cookie:
Вы можете контролировать и управлять файлами cookie через настройки браузера. Обратите внимание, что отключение определённых файлов cookie может повлиять на функциональность нашего Веб-сайта.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Меры безопасности",
          content: `VWS применяет комплексные административные, технические и физические меры безопасности для защиты ваших персональных данных от потери, несанкционированного доступа, повреждения, изменения или раскрытия.

Административные меры:
• Назначение Сотрудника по защите данных
• Внутренние политики и процедуры обработки данных
• Обучение персонала по вопросам защиты данных и конфиденциальности
• Регулярные аудиты и проверки соответствия
• Процедуры реагирования на инциденты

Технические меры:
• Шифрование конфиденциальных данных при передаче и хранении
• Безопасные средства контроля доступа и механизмы аутентификации
• Брандмауэры и системы обнаружения вторжений
• Регулярные обновления безопасности и оценки уязвимостей

Физические меры:
• Ограниченный доступ к помещениям с персональными данными
• Системы безопасности, включая видеонаблюдение и журналы доступа

Несмотря на наши усилия, ни один метод передачи через Интернет или электронного хранения не является на 100% безопасным. Если у вас есть основания полагать, что ваши персональные данные были скомпрометированы, немедленно свяжитесь с нами.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Изменения политики",
          content: `VWS оставляет за собой право изменять настоящую Политику конфиденциальности в любое время для отражения изменений в наших практиках обработки данных, правовых требованиях или других операционных или юридических причинах.

Как мы уведомляем вас об изменениях:
• Существенные изменения будут сообщены по электронной почте нашим клиентам и контактам
• Обновления будут опубликованы на нашем Веб-сайте с новой датой вступления в силу
• Для существенных изменений, затрагивающих ваши права, мы можем запросить обновлённое согласие

Мы рекомендуем вам периодически просматривать настоящую Политику конфиденциальности, чтобы быть в курсе того, как мы защищаем ваши персональные данные.

Настоящая Политика конфиденциальности была в последний раз обновлена в декабре 2024 года и заменяет все предыдущие версии.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Контактная информация",
          content: `По любым вопросам, замечаниям или запросам, связанным с настоящей Политикой конфиденциальности или нашими практиками защиты данных, обращайтесь:

Сотрудник по защите данных
Von Wobeser y Sierra, S.C.

Адрес:
Torre SOMA Chapultepec, 18 этаж
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Мехико, Мексика

Электронная почта: privacidad@vonwobeser.com
Телефон: +52 55 5258 1000

Часы работы: Понедельник – пятница, 9:00 – 18:00 (по времени Мехико)

По общим вопросам о наших юридических услугах:
Электронная почта: info@vonwobeser.com
Веб-сайт: www.vonwobeser.com`
        }
      ]
    },
    fr: {
      title: "Politique de confidentialité",
      subtitle: "Comment nous collectons, utilisons et protégeons vos données personnelles",
      lastUpdated: "Dernière mise à jour : Décembre 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. Introduction",
          content: `Von Wobeser y Sierra, S.C. (« VWS », « nous », « notre » ou « nos ») s'engage à protéger votre vie privée et à assurer la sécurité de vos données personnelles. Cette Politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site web www.vonwobeser.com (le « Site Web ») ou interagissez avec nos services.

Cette Politique de confidentialité est conforme à la Loi fédérale sur la protection des données personnelles (LFPDPPP) et à ses règlements, ainsi qu'aux autres lois mexicaines applicables en matière de protection des données et aux meilleures pratiques internationales.

En accédant à notre Site Web ou en l'utilisant, vous reconnaissez avoir lu, compris et accepté d'être lié par cette Politique de confidentialité.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. Responsable du traitement",
          content: `Le responsable du traitement de vos données personnelles est :

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18e étage
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexico, Mexique

Pour les demandes liées à la confidentialité :
E-mail : privacidad@vonwobeser.com
Téléphone : +52 55 5258 1000

Notre Délégué à la protection des données peut être contacté à l'adresse ci-dessus pour toute question concernant cette Politique de confidentialité ou l'exercice de vos droits en matière de protection des données.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. Données collectées",
          content: `Nous pouvons collecter et traiter les catégories suivantes de données personnelles :

Données d'identification :
• Nom complet, titre et poste professionnel
• Coordonnées (adresse e-mail, numéro de téléphone, adresse postale)
• Nom de l'entreprise ou de l'organisation
• Qualifications et affiliations professionnelles

Données de communication :
• Correspondance et communications avec VWS
• Demandes soumises via nos formulaires de contact
• Préférences d'abonnement aux newsletters et publications

Données techniques :
• Adresse IP et informations sur l'appareil
• Type et version du navigateur
• Système d'exploitation
• Pages visitées et temps passé sur notre Site Web

Nous ne collectons pas intentionnellement de données personnelles sensibles sauf si cela est strictement nécessaire pour la représentation juridique et avec votre consentement explicite.`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. Utilisation des données",
          content: `Nous utilisons vos données personnelles aux fins suivantes :

Finalités primaires (ne nécessitent pas de consentement supplémentaire) :
• Pour fournir des services juridiques et des conseils professionnels
• Pour répondre à vos demandes et communications
• Pour gérer nos relations avocat-client
• Pour respecter les obligations légales et réglementaires
• Pour administrer et protéger notre Site Web et nos systèmes

Finalités secondaires (peuvent nécessiter un consentement) :
• Pour envoyer des newsletters, publications et mises à jour juridiques
• Pour vous inviter à des événements, séminaires et conférences
• Pour mener des enquêtes et recueillir des commentaires sur nos services
• Pour envoyer des communications marketing sur nos domaines de pratique

Vous pouvez vous désinscrire des finalités secondaires à tout moment en nous contactant à privacidad@vonwobeser.com.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. Conservation des données",
          content: `Nous conservons vos données personnelles uniquement pendant la durée nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées, sauf si une période de conservation plus longue est requise ou permise par la loi.

Périodes de conservation :
• Dossiers clients et affaires juridiques : 10 ans après la clôture du dossier
• Demandes générales et communications : 3 ans à compter du dernier contact
• Abonnements aux newsletters : Jusqu'à votre désabonnement
• Données d'analyse du site web : 2 ans
• Documents comptables et de facturation : Selon les exigences fiscales

Après l'expiration de la période de conservation applicable, nous supprimerons ou anonymiserons vos données personnelles de manière sécurisée.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. Partage des données",
          content: `Nous pouvons partager vos données personnelles avec les catégories suivantes de destinataires :

Au sein de VWS :
• Associés, avocats et personnel professionnel impliqués dans votre affaire
• Personnel administratif et de support selon les besoins
• Autres bureaux de VWS pour la coordination des services

Tiers :
• Tribunaux et autorités réglementaires (selon les exigences des procédures judiciaires)
• Autres cabinets d'avocats ou professionnels collaborant sur votre affaire (avec votre consentement)
• Prestataires de services sous accords de confidentialité stricts

Transferts internationaux :
Lorsque nous transférons vos données en dehors du Mexique, nous nous assurons que des garanties appropriées sont en place.

Nous ne vendons jamais vos données personnelles à des tiers à des fins marketing.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. Vos droits",
          content: `En vertu de la loi mexicaine, vous disposez des droits suivants concernant vos données personnelles (droits ARCO) :

Accès (Acceso) :
Vous pouvez demander la confirmation du traitement de vos données personnelles et y accéder.

Rectification (Rectificación) :
Vous pouvez demander la correction de données personnelles inexactes ou incomplètes.

Suppression (Cancelación) :
Vous pouvez demander la suppression de vos données personnelles lorsqu'elles ne sont plus nécessaires aux fins pour lesquelles elles ont été collectées.

Opposition (Oposición) :
Vous pouvez vous opposer au traitement de vos données personnelles pour des finalités spécifiques, notamment le marketing.

Pour exercer vos droits :
Soumettez une demande écrite à :
E-mail : privacidad@vonwobeser.com
Adresse : Torre SOMA Chapultepec, 18e étage, Mexico

Si vous n'êtes pas satisfait de notre réponse, vous pouvez déposer une plainte auprès de l'Institut national de transparence, d'accès à l'information et de protection des données personnelles (INAI) : www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Transferts à des tiers",
          content: `VWS peut transférer vos données personnelles à des tiers dans les circonstances suivantes :

Transferts nécessitant un consentement :
• Aux cabinets d'avocats affiliés ou correspondants dans d'autres juridictions pour la fourniture de services juridiques
• Aux prestataires de services marketing et communication pour des activités promotionnelles
• Aux organisateurs d'événements lors de votre inscription à des événements parrainés par VWS

Transferts ne nécessitant pas de consentement (conformément à l'article 37 de la LFPDPPP) :
• Aux tribunaux et autorités gouvernementales lorsque la loi l'exige
• Aux organismes de réglementation et associations professionnelles dans le cadre de nos obligations de conformité
• Aux sociétés mères, filiales ou affiliées sous contrôle commun

Transferts internationaux :
Lorsque vos données sont transférées vers des pays en dehors du Mexique, nous nous assurons que des garanties appropriées sont en place, y compris des clauses contractuelles et l'engagement du destinataire à respecter des principes de confidentialité équivalents à la loi mexicaine.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Politique des cookies",
          content: `Notre Site Web utilise des cookies et des technologies similaires pour améliorer votre expérience de navigation. Les cookies sont de petits fichiers texte stockés sur votre appareil qui nous aident à analyser le trafic du site web, à mémoriser vos préférences et à améliorer les fonctionnalités.

Types de cookies que nous utilisons :

Cookies essentiels : Nécessaires au bon fonctionnement du Site Web. Ils ne peuvent pas être désactivés.

Cookies analytiques : Nous aident à comprendre comment les visiteurs interagissent avec notre Site Web en collectant des informations anonymes.

Cookies de fonctionnalité : Mémorisent vos préférences telles que les paramètres de langue et les options d'affichage.

Cookies marketing : Utilisés pour suivre les visiteurs sur les sites web afin d'afficher des publicités pertinentes.

Gestion des cookies :
Vous pouvez contrôler et gérer les cookies via les paramètres de votre navigateur. Notez que la désactivation de certains cookies peut affecter la fonctionnalité de notre Site Web.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Mesures de sécurité",
          content: `VWS met en œuvre des mesures de sécurité administratives, techniques et physiques complètes pour protéger vos données personnelles contre la perte, l'accès non autorisé, les dommages, l'altération ou la divulgation.

Mesures administratives :
• Désignation d'un Délégué à la protection des données
• Politiques et procédures internes pour le traitement des données
• Formation du personnel sur la protection des données et la confidentialité
• Audits réguliers et examens de conformité
• Procédures de réponse aux incidents

Mesures techniques :
• Chiffrement des données sensibles en transit et au repos
• Contrôles d'accès sécurisés et mécanismes d'authentification
• Pare-feu et systèmes de détection d'intrusion
• Mises à jour de sécurité régulières et évaluations des vulnérabilités

Mesures physiques :
• Accès restreint aux installations hébergeant des données personnelles
• Systèmes de sécurité incluant la surveillance et les journaux d'accès

Malgré nos meilleurs efforts, aucune méthode de transmission sur Internet ou de stockage électronique n'est sécurisée à 100 %. Si vous avez des raisons de croire que vos données personnelles ont été compromises, veuillez nous contacter immédiatement.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Modifications de la politique",
          content: `VWS se réserve le droit de modifier cette Politique de confidentialité à tout moment pour refléter les changements dans nos pratiques de traitement des données, les exigences légales ou d'autres raisons opérationnelles ou juridiques.

Comment nous vous informons des changements :
• Les changements significatifs seront communiqués par e-mail à nos clients et contacts
• Les mises à jour seront publiées sur notre Site Web avec la nouvelle date d'entrée en vigueur
• Pour les changements matériels affectant vos droits, nous pouvons demander un consentement renouvelé

Nous vous encourageons à consulter périodiquement cette Politique de confidentialité pour rester informé de la manière dont nous protégeons vos données personnelles.

Cette Politique de confidentialité a été mise à jour pour la dernière fois en décembre 2024 et remplace toutes les versions précédentes.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Contact",
          content: `Pour toute question, préoccupation ou demande relative à cette Politique de confidentialité ou à nos pratiques de protection des données, veuillez contacter :

Délégué à la protection des données
Von Wobeser y Sierra, S.C.

Adresse :
Torre SOMA Chapultepec, 18e étage
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexico, Mexique

E-mail : privacidad@vonwobeser.com
Téléphone : +52 55 5258 1000

Heures d'ouverture : Lundi au vendredi, 9h00 à 18h00 (heure de Mexico)

Pour les demandes générales concernant nos services juridiques :
E-mail : info@vonwobeser.com
Site web : www.vonwobeser.com`
        }
      ]
    },
    it: {
      title: "Informativa sulla privacy",
      subtitle: "Come raccogliamo, utilizziamo e proteggiamo i tuoi dati personali",
      lastUpdated: "Ultimo aggiornamento: Dicembre 2024",
      sections: [
        {
          id: "introduction",
          icon: Shield,
          title: "1. Introduzione",
          content: `Von Wobeser y Sierra, S.C. ("VWS", "noi", "ci" o "nostro") si impegna a proteggere la tua privacy e a garantire la sicurezza dei tuoi dati personali. Questa Informativa sulla privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo le tue informazioni quando visiti il nostro sito web www.vonwobeser.com (il "Sito Web") o interagisci con i nostri servizi.

Questa Informativa sulla privacy è conforme alla Legge federale sulla protezione dei dati personali (LFPDPPP) e ai suoi regolamenti, nonché ad altre leggi messicane applicabili in materia di protezione dei dati e alle migliori pratiche internazionali.

Accedendo o utilizzando il nostro Sito Web, riconosci di aver letto, compreso e accettato di essere vincolato da questa Informativa sulla privacy.`
        },
        {
          id: "data-controller",
          icon: Building2,
          title: "2. Titolare del trattamento",
          content: `Il titolare del trattamento dei tuoi dati personali è:

Von Wobeser y Sierra, S.C.
Torre SOMA Chapultepec, 18° piano
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Città del Messico, Messico

Per richieste relative alla privacy:
E-mail: privacidad@vonwobeser.com
Telefono: +52 55 5258 1000

Il nostro Responsabile della protezione dei dati può essere contattato all'indirizzo sopra indicato per qualsiasi domanda riguardante questa Informativa sulla privacy o l'esercizio dei tuoi diritti in materia di protezione dei dati.`
        },
        {
          id: "data-collected",
          icon: Database,
          title: "3. Dati raccolti",
          content: `Possiamo raccogliere e trattare le seguenti categorie di dati personali:

Dati identificativi:
• Nome completo, titolo e posizione professionale
• Informazioni di contatto (indirizzo e-mail, numero di telefono, indirizzo postale)
• Nome dell'azienda o dell'organizzazione
• Qualifiche e affiliazioni professionali

Dati di comunicazione:
• Corrispondenza e comunicazioni con VWS
• Richieste inviate tramite i nostri moduli di contatto
• Preferenze di iscrizione a newsletter e pubblicazioni

Dati tecnici:
• Indirizzo IP e informazioni sul dispositivo
• Tipo e versione del browser
• Sistema operativo
• Pagine visitate e tempo trascorso sul nostro Sito Web

Non raccogliamo intenzionalmente dati personali sensibili a meno che non sia strettamente necessario per la rappresentanza legale e con il tuo consenso esplicito.`
        },
        {
          id: "data-use",
          icon: Eye,
          title: "4. Utilizzo dei dati",
          content: `Utilizziamo i tuoi dati personali per le seguenti finalità:

Finalità primarie (non richiedono consenso aggiuntivo):
• Per fornire servizi legali e consulenza professionale
• Per rispondere alle tue richieste e comunicazioni
• Per gestire i nostri rapporti avvocato-cliente
• Per adempiere agli obblighi legali e normativi
• Per amministrare e proteggere il nostro Sito Web e i nostri sistemi

Finalità secondarie (potrebbero richiedere consenso):
• Per inviare newsletter, pubblicazioni e aggiornamenti legali
• Per invitarti a eventi, seminari e conferenze
• Per condurre sondaggi e raccogliere feedback sui nostri servizi
• Per inviare comunicazioni di marketing sulle nostre aree di pratica

Puoi rinunciare alle finalità secondarie in qualsiasi momento contattandoci a privacidad@vonwobeser.com.`
        },
        {
          id: "data-retention",
          icon: FileText,
          title: "5. Conservazione dei dati",
          content: `Conserviamo i tuoi dati personali solo per il tempo necessario a raggiungere le finalità per cui sono stati raccolti, a meno che un periodo di conservazione più lungo sia richiesto o consentito dalla legge.

Periodi di conservazione:
• Fascicoli clienti e questioni legali: 10 anni dopo la chiusura del caso
• Richieste generali e comunicazioni: 3 anni dall'ultimo contatto
• Iscrizioni alle newsletter: Fino alla cancellazione
• Dati analitici del sito web: 2 anni
• Documenti contabili e di fatturazione: Come richiesto dalle normative fiscali

Dopo la scadenza del periodo di conservazione applicabile, elimineremo o anonimizzeremo in modo sicuro i tuoi dati personali.`
        },
        {
          id: "data-sharing",
          icon: Users,
          title: "6. Condivisione dei dati",
          content: `Possiamo condividere i tuoi dati personali con le seguenti categorie di destinatari:

All'interno di VWS:
• Partner, avvocati e personale professionale coinvolti nella tua pratica
• Personale amministrativo e di supporto secondo necessità
• Altri uffici di VWS per il coordinamento dei servizi

Terze parti:
• Tribunali e autorità di regolamentazione (come richiesto da procedimenti legali)
• Altri studi legali o professionisti che collaborano alla tua pratica (con il tuo consenso)
• Fornitori di servizi con rigorosi accordi di riservatezza

Trasferimenti internazionali:
Quando trasferiamo i tuoi dati al di fuori del Messico, ci assicuriamo che siano in atto garanzie adeguate.

Non vendiamo mai i tuoi dati personali a terzi per scopi di marketing.`
        },
        {
          id: "arco-rights",
          icon: Shield,
          title: "7. I tuoi diritti",
          content: `Ai sensi della legge messicana, hai i seguenti diritti riguardo ai tuoi dati personali (diritti ARCO):

Accesso (Acceso):
Puoi richiedere la conferma del trattamento dei tuoi dati personali e accedervi.

Rettifica (Rectificación):
Puoi richiedere la correzione di dati personali inesatti o incompleti.

Cancellazione (Cancelación):
Puoi richiedere la cancellazione dei tuoi dati personali quando non sono più necessari per le finalità per cui sono stati raccolti.

Opposizione (Oposición):
Puoi opporti al trattamento dei tuoi dati personali per finalità specifiche, in particolare per il marketing.

Per esercitare i tuoi diritti:
Invia una richiesta scritta a:
E-mail: privacidad@vonwobeser.com
Indirizzo: Torre SOMA Chapultepec, 18° piano, Città del Messico

Se non sei soddisfatto della nostra risposta, puoi presentare un reclamo all'Istituto nazionale per la trasparenza, l'accesso alle informazioni e la protezione dei dati personali (INAI): www.inai.org.mx`
        },
        {
          id: "transfers",
          icon: Globe,
          title: "8. Trasferimenti a terzi",
          content: `VWS può trasferire i tuoi dati personali a terzi nelle seguenti circostanze:

Trasferimenti che richiedono consenso:
• A studi legali affiliati o corrispondenti in altre giurisdizioni per la fornitura di servizi legali
• A fornitori di servizi di marketing e comunicazione per attività promozionali
• Agli organizzatori di eventi quando ti registri per eventi sponsorizzati da VWS

Trasferimenti che non richiedono consenso (come consentito dall'articolo 37 della LFPDPPP):
• A tribunali e autorità governative quando richiesto dalla legge o da procedimenti legali
• A organismi di regolamentazione e associazioni professionali nell'ambito dei nostri obblighi di conformità
• A società madri, controllate o affiliate sotto controllo comune

Trasferimenti internazionali:
Quando i tuoi dati vengono trasferiti in paesi al di fuori del Messico, ci assicuriamo che siano in atto garanzie adeguate, incluse clausole contrattuali e l'impegno del destinatario ai principi di privacy equivalenti alla legge messicana.`
        },
        {
          id: "cookies",
          icon: Cookie,
          title: "9. Politica sui cookie",
          content: `Il nostro Sito Web utilizza cookie e tecnologie simili per migliorare la tua esperienza di navigazione. I cookie sono piccoli file di testo memorizzati sul tuo dispositivo che ci aiutano ad analizzare il traffico del sito web, ricordare le tue preferenze e migliorare la funzionalità.

Tipi di cookie che utilizziamo:

Cookie essenziali: Necessari per il corretto funzionamento del Sito Web. Non possono essere disabilitati.

Cookie analitici: Ci aiutano a capire come i visitatori interagiscono con il nostro Sito Web raccogliendo informazioni anonime.

Cookie di funzionalità: Ricordano le tue preferenze come le impostazioni della lingua e le opzioni di visualizzazione.

Cookie di marketing: Utilizzati per tracciare i visitatori sui siti web per visualizzare annunci pertinenti.

Gestione dei cookie:
Puoi controllare e gestire i cookie tramite le impostazioni del tuo browser. Tieni presente che la disabilitazione di alcuni cookie potrebbe influire sulla funzionalità del nostro Sito Web.`
        },
        {
          id: "security",
          icon: Lock,
          title: "10. Misure di sicurezza",
          content: `VWS implementa misure di sicurezza amministrative, tecniche e fisiche complete per proteggere i tuoi dati personali da perdita, accesso non autorizzato, danni, alterazione o divulgazione.

Misure amministrative:
• Designazione di un Responsabile della protezione dei dati
• Politiche e procedure interne per la gestione dei dati
• Formazione del personale sulla protezione dei dati e la riservatezza
• Audit regolari e verifiche di conformità
• Procedure di risposta agli incidenti

Misure tecniche:
• Crittografia dei dati sensibili in transito e a riposo
• Controlli di accesso sicuri e meccanismi di autenticazione
• Firewall e sistemi di rilevamento delle intrusioni
• Aggiornamenti di sicurezza regolari e valutazioni delle vulnerabilità

Misure fisiche:
• Accesso limitato alle strutture che ospitano dati personali
• Sistemi di sicurezza inclusa sorveglianza e registri di accesso

Nonostante i nostri migliori sforzi, nessun metodo di trasmissione su Internet o di archiviazione elettronica è sicuro al 100%. Se hai motivo di credere che i tuoi dati personali siano stati compromessi, contattaci immediatamente.`
        },
        {
          id: "changes",
          icon: AlertCircle,
          title: "11. Modifiche all'informativa",
          content: `VWS si riserva il diritto di modificare questa Informativa sulla privacy in qualsiasi momento per riflettere i cambiamenti nelle nostre pratiche di trattamento dei dati, nei requisiti legali o per altri motivi operativi o legali.

Come ti informiamo delle modifiche:
• Le modifiche significative saranno comunicate via e-mail ai nostri clienti e contatti
• Gli aggiornamenti saranno pubblicati sul nostro Sito Web con la nuova data di entrata in vigore
• Per modifiche sostanziali che influiscono sui tuoi diritti, potremmo richiedere un consenso rinnovato

Ti incoraggiamo a rivedere periodicamente questa Informativa sulla privacy per rimanere informato su come proteggiamo i tuoi dati personali.

Questa Informativa sulla privacy è stata aggiornata l'ultima volta a dicembre 2024 e sostituisce tutte le versioni precedenti.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "12. Contatti",
          content: `Per qualsiasi domanda, dubbio o richiesta relativa a questa Informativa sulla privacy o alle nostre pratiche di protezione dei dati, contattaci:

Responsabile della protezione dei dati
Von Wobeser y Sierra, S.C.

Indirizzo:
Torre SOMA Chapultepec, 18° piano
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Città del Messico, Messico

E-mail: privacidad@vonwobeser.com
Telefono: +52 55 5258 1000

Orari di ufficio: Lunedì a venerdì, 9:00 - 18:00 (ora di Città del Messico)

Per richieste generali sui nostri servizi legali:
E-mail: info@vonwobeser.com
Sito web: www.vonwobeser.com`
        }
      ]
    }
  };

  const t = content[language as SupportedLanguage] || content.en;

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

  const contactText: Record<SupportedLanguage, string> = {
    en: "To exercise your ARCO rights or make privacy inquiries:",
    es: "Para ejercer sus derechos ARCO o hacer consultas sobre privacidad:",
    de: "Zur Ausübung Ihrer ARCO-Rechte oder für Datenschutzanfragen:",
    zh: "如需行使您的ARCO权利或进行隐私咨询：",
    ko: "ARCO 권리를 행사하거나 개인정보 관련 문의:",
    ja: "ARCO権利の行使またはプライバシーに関するお問い合わせ：",
    ar: "لممارسة حقوق ARCO الخاصة بك أو الاستفسارات المتعلقة بالخصوصية:",
    ru: "Для осуществления прав ARCO или запросов о конфиденциальности:",
    fr: "Pour exercer vos droits ARCO ou faire des demandes de confidentialité :",
    it: "Per esercitare i tuoi diritti ARCO o fare richieste sulla privacy:"
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
            {t.sections.map((section) => (
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
                  {contactText[language as keyof typeof contactText] || contactText.en}
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
