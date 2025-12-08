import { motion } from "framer-motion";
import { FileText, Scale, Globe, AlertTriangle, Users, Shield, Gavel, BookOpen, Bell, Phone, Mail, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

type SupportedLanguage = 'en' | 'es' | 'de' | 'zh' | 'ko' | 'ja' | 'ar' | 'ru' | 'fr' | 'it';

export default function Terms() {
  const { language, displayLanguage } = useLanguage();

  const content: Record<SupportedLanguage, {
    title: string;
    subtitle: string;
    lastUpdated: string;
    sections: Array<{
      id: string;
      icon: typeof FileText;
      title: string;
      content: string;
    }>;
  }> = {
    en: {
      title: "Terms and Conditions",
      subtitle: "Please read these terms carefully before using our website",
      lastUpdated: "Last updated: December 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. Acceptance of Terms",
          content: `By accessing and using the website of Von Wobeser y Sierra, S.C. (hereinafter "VWS," "the Firm," "we," "us," or "our"), located at www.vonwobeser.com (hereinafter "the Website"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions of Use (hereinafter "Terms").

If you do not agree with any part of these Terms, you must immediately discontinue use of the Website. Your continued use of the Website constitutes your acceptance of these Terms and any modifications thereto.

These Terms constitute a legally binding agreement between you (hereinafter "User," "you," or "your") and VWS. We reserve the right to modify, update, or change these Terms at any time without prior notice.

By using this Website, you represent and warrant that:
• You are at least 18 years of age or the legal age of majority in your jurisdiction
• You have the legal capacity to enter into binding agreements
• You will comply with all applicable laws and regulations while using this Website
• All information you provide is accurate, current, and complete`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. Use of Website",
          content: `The Website is provided for informational purposes only. The content on this Website is intended to provide general information about VWS, its legal services, practice areas, and professional team.

Permitted Uses:
• Browsing and viewing content for personal, non-commercial informational purposes
• Contacting VWS through provided contact forms and information
• Downloading publicly available materials for personal reference
• Sharing links to Website content through legitimate means

Prohibited Uses:
You agree NOT to use the Website to:
• Violate any applicable local, state, national, or international law or regulation
• Transmit any material that is defamatory, offensive, or otherwise objectionable
• Impersonate any person or entity or misrepresent your affiliation with any person or entity
• Interfere with or disrupt the Website or servers or networks connected to the Website
• Attempt to gain unauthorized access to any portion of the Website, other accounts, or computer systems
• Collect or harvest any personally identifiable information from the Website
• Use any robot, spider, scraper, or other automated means to access the Website
• Introduce viruses, malware, or other harmful code
• Reproduce, duplicate, copy, sell, resell, or exploit any portion of the Website for commercial purposes without express written permission

VWS reserves the right to terminate or restrict your access to the Website for any violation of these Terms.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. Intellectual Property Rights",
          content: `All content on this Website, including but not limited to text, graphics, logos, images, photographs, videos, audio clips, data compilations, software, icons, and the selection and arrangement thereof (collectively, "Content"), is the exclusive property of Von Wobeser y Sierra, S.C. or its content suppliers and is protected by Mexican and international copyright, trademark, patent, trade secret, and other intellectual property laws.

Trademarks:
The VWS name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of Von Wobeser y Sierra, S.C. or its affiliates. You may not use such marks without the prior written permission of VWS. All other names, logos, product and service names, designs, and slogans on this Website are the trademarks of their respective owners.

Limited License:
Subject to these Terms, VWS grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Website and its Content for your personal, non-commercial use only. This license does not include:
• Any resale or commercial use of the Website or its Content
• Any derivative use of the Website or its Content
• Any downloading or copying of account information for the benefit of another
• Any use of data mining, robots, or similar data gathering and extraction tools

Copyright Infringement:
If you believe that any Content on the Website infringes your copyright, please contact us at info@vonwobeser.com with:
• A description of the copyrighted work you claim has been infringed
• A description of where the material is located on the Website
• Your contact information
• A statement that you have a good faith belief that the use is not authorized
• A statement, under penalty of perjury, that the information is accurate and that you are the copyright owner or authorized to act on behalf of the owner`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. Disclaimer of Legal Advice",
          content: `IMPORTANT NOTICE: The information contained on this Website is provided for general informational and educational purposes only and does NOT constitute legal advice.

Nothing on this Website should be construed as:
• Legal advice or legal opinion on any specific facts or circumstances
• An offer or invitation to provide legal services
• A solicitation for legal representation
• A guarantee or prediction of any particular legal outcome

The legal information provided on this Website:
• May not be applicable to your particular situation or jurisdiction
• May not reflect the most current legal developments
• Should not be relied upon as a substitute for legal advice from a qualified attorney
• Does not create an attorney-client relationship between you and VWS

Each legal situation is unique and fact-specific. The outcome of any legal matter depends on many factors, including the specific facts and circumstances involved, the applicable law, and the jurisdiction in which the matter arises.

IMPORTANT: Do not send confidential or sensitive information to VWS through this Website or via email until you have received written confirmation that an attorney-client relationship has been established. Any information you send to us before such confirmation will not be treated as privileged or confidential.

If you require legal advice:
We strongly encourage you to consult with a qualified attorney who can evaluate your specific situation and provide tailored legal guidance. To engage VWS for legal services, please contact us directly to schedule a consultation and formally establish an attorney-client relationship.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. No Attorney-Client Relationship",
          content: `Your use of this Website, including browsing Content, submitting contact forms, sending emails, or downloading materials, does NOT create an attorney-client relationship between you and Von Wobeser y Sierra, S.C. or any of its attorneys.

An attorney-client relationship with VWS is only established when:
• VWS has formally agreed in writing to represent you
• A signed engagement letter or retainer agreement has been executed
• Appropriate conflict of interest checks have been completed
• Payment arrangements have been made (where applicable)
• VWS has confirmed in writing that it has undertaken representation of your matter

Until such formal engagement:
• No attorney-client privilege exists between you and VWS
• No duty of confidentiality applies to communications
• VWS has no obligation to provide legal advice or representation
• VWS may represent parties whose interests are adverse to yours
• Information you provide may not be treated as confidential

Communications:
Any communication sent to VWS through this Website, email, or other means before the establishment of an attorney-client relationship:
• Will not be treated as privileged or confidential
• May be disclosed or used by VWS as necessary
• Does not prevent VWS from representing other parties with adverse interests
• Does not create any duties or obligations on the part of VWS

Potential Clients:
If you are considering engaging VWS for legal representation, please contact us directly by telephone at +52 55 5258 1000 to discuss your matter and the process for formally establishing an attorney-client relationship.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Limitation of Liability",
          content: `TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW:

Disclaimer of Warranties:
THE WEBSITE AND ALL CONTENT ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. VWS SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

VWS does not warrant that:
• The Website will be available, uninterrupted, timely, secure, or error-free
• The results that may be obtained from use of the Website will be accurate or reliable
• The quality of any information or Content obtained through the Website will meet your expectations
• Any errors on the Website will be corrected

Limitation of Liability:
IN NO EVENT SHALL VON WOBESER Y SIERRA, S.C., ITS PARTNERS, ATTORNEYS, EMPLOYEES, AFFILIATES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES ARISING OUT OF OR RELATING TO:
• Your access to or use of, or inability to access or use, the Website
• Any conduct or Content of any third party on the Website
• Any Content obtained from the Website
• Unauthorized access, use, or alteration of your transmissions or Content
• Reliance on any information provided on the Website
• Any legal matter or decision made based on information from the Website

This limitation applies regardless of the legal theory upon which the claim is based, whether VWS has been advised of the possibility of such damages, and even if a remedy set forth herein is found to have failed its essential purpose.

Maximum Liability:
TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE AGGREGATE LIABILITY OF VWS ARISING OUT OF OR RELATED TO THESE TERMS OR THE WEBSITE SHALL NOT EXCEED ONE HUNDRED MEXICAN PESOS (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Governing Law",
          content: `These Terms and Conditions, and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims), shall be governed by and construed in accordance with the laws of the United Mexican States (Mexico), without regard to its conflict of law provisions.

Applicable Law:
The following Mexican laws and regulations apply to these Terms and the use of the Website:
• Federal Civil Code (Código Civil Federal)
• Federal Commerce Code (Código de Comercio)
• Federal Consumer Protection Law (Ley Federal de Protección al Consumidor)
• Federal Law on Protection of Personal Data Held by Private Parties (LFPDPPP)
• General Law of Electronic Signatures (Ley de Firma Electrónica Avanzada)
• Applicable regulations and official Mexican standards (NOMs)

International Users:
If you access the Website from outside Mexico, you do so at your own risk and are responsible for compliance with local laws. The Website is operated from Mexico, and VWS makes no representations that the Content is appropriate or available for use in other locations.

Nothing in these Terms shall be construed to:
• Subject VWS to the jurisdiction of any court other than as specified herein
• Waive any immunity or privilege available to VWS under applicable law
• Create any rights in any third party

Compliance:
You agree to comply with all applicable laws, statutes, ordinances, and regulations regarding your use of the Website and any activities conducted through or in connection with the Website.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Dispute Resolution",
          content: `Any dispute, controversy, or claim arising out of or relating to these Terms or the breach, termination, or validity thereof shall be resolved in accordance with the following provisions:

Negotiation:
Before initiating any formal dispute resolution procedure, the parties agree to attempt in good faith to resolve any dispute through direct negotiation. Either party may initiate negotiations by sending written notice to the other party describing the dispute and proposing a resolution.

Mediation:
If negotiations fail to resolve the dispute within thirty (30) calendar days, either party may request mediation before a mediator certified by the Mexico City Mediation and Conciliation Center (Centro de Justicia Alternativa del Poder Judicial de la Ciudad de México).

Jurisdiction and Venue:
Any legal action or proceeding arising out of or relating to these Terms or the Website shall be brought exclusively in the competent federal or local courts located in Mexico City (Ciudad de México), Mexico.

By using the Website, you irrevocably and unconditionally:
• Submit to the exclusive jurisdiction of such courts
• Waive any objection to the laying of venue in such courts
• Waive any claim that such forum is inconvenient
• Agree not to commence any action or proceeding in any other jurisdiction

Waiver of Jury Trial:
TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, EACH PARTY WAIVES ANY RIGHT TO A JURY TRIAL IN ANY LEGAL PROCEEDING ARISING OUT OF OR RELATING TO THESE TERMS.

Class Action Waiver:
You agree that any claims shall be brought in your individual capacity and not as a plaintiff or class member in any purported class or representative proceeding.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Modifications to Terms",
          content: `Von Wobeser y Sierra, S.C. reserves the right, at its sole discretion, to modify, amend, or update these Terms and Conditions at any time without prior notice.

How Changes Are Communicated:
• Material changes will be indicated by updating the "Last updated" date at the top of this page
• Significant modifications may be announced through a notice on the Website's homepage
• For registered users or subscribers, we may send email notifications of important changes

Your Responsibilities:
It is your responsibility to review these Terms periodically to stay informed of updates. You should check this page regularly to ensure you are aware of any changes.

Effect of Continued Use:
Your continued use of the Website following the posting of revised Terms means that you accept and agree to the changes. If you do not agree to the new Terms, you must stop using the Website.

Version History:
We maintain previous versions of these Terms for reference purposes. You may request access to prior versions by contacting us at info@vonwobeser.com.

Severability:
If any provision of these Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal, or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent necessary, and the remaining provisions of these Terms will continue in full force and effect.

Entire Agreement:
These Terms, together with the Privacy Policy and any other legal notices published by VWS on the Website, constitute the entire agreement between you and VWS concerning the use of the Website and supersede all prior or contemporaneous communications, whether electronic, oral, or written.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Contact Information",
          content: `If you have any questions, concerns, or comments regarding these Terms and Conditions or the Website, please contact us through the following means:

Von Wobeser y Sierra, S.C.

Mailing Address:
Torre SOMA Chapultepec, Floor 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexico City, Mexico

Telephone:
+52 55 5258 1000

Email:
General Inquiries: info@vonwobeser.com
Legal and Terms Inquiries: legal@vonwobeser.com

Office Hours:
Monday to Friday: 9:00 AM to 6:00 PM (Mexico City time)
Excluding Mexican federal holidays

Website:
www.vonwobeser.com

Response Time:
We strive to respond to all inquiries within five (5) business days. For urgent matters, we recommend contacting us by telephone during office hours.

For inquiries related to potential legal representation, please contact us by telephone to discuss your matter and the process for establishing a formal attorney-client relationship.`
        }
      ]
    },
    es: {
      title: "Términos y Condiciones",
      subtitle: "Por favor lea estos términos cuidadosamente antes de usar nuestro sitio web",
      lastUpdated: "Última actualización: Diciembre 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. Aceptación de los Términos",
          content: `Al acceder y utilizar el sitio web de Von Wobeser y Sierra, S.C. (en adelante "VWS," "la Firma," "nosotros" o "nuestro"), ubicado en www.vonwobeser.com (en adelante "el Sitio Web"), usted reconoce que ha leído, comprendido y acepta estar obligado por estos Términos y Condiciones de Uso (en adelante "Términos").

Si no está de acuerdo con alguna parte de estos Términos, debe dejar de usar el Sitio Web inmediatamente. Su uso continuado del Sitio Web constituye su aceptación de estos Términos y cualquier modificación a los mismos.

Estos Términos constituyen un acuerdo legalmente vinculante entre usted (en adelante "Usuario," "usted" o "su") y VWS. Nos reservamos el derecho de modificar, actualizar o cambiar estos Términos en cualquier momento sin previo aviso.

Al usar este Sitio Web, usted declara y garantiza que:
• Tiene al menos 18 años de edad o la mayoría de edad legal en su jurisdicción
• Tiene la capacidad legal para celebrar acuerdos vinculantes
• Cumplirá con todas las leyes y regulaciones aplicables mientras usa este Sitio Web
• Toda la información que proporcione es precisa, actual y completa`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. Uso del Sitio Web",
          content: `El Sitio Web se proporciona únicamente con fines informativos. El contenido de este Sitio Web tiene como objetivo proporcionar información general sobre VWS, sus servicios legales, áreas de práctica y equipo profesional.

Usos Permitidos:
• Navegar y ver contenido para fines informativos personales y no comerciales
• Contactar a VWS a través de los formularios de contacto e información proporcionados
• Descargar materiales públicamente disponibles para referencia personal
• Compartir enlaces al contenido del Sitio Web a través de medios legítimos

Usos Prohibidos:
Usted acepta NO usar el Sitio Web para:
• Violar cualquier ley o regulación local, estatal, nacional o internacional aplicable
• Transmitir cualquier material que sea difamatorio, ofensivo o de otro modo objetable
• Hacerse pasar por cualquier persona o entidad o tergiversar su afiliación con cualquier persona o entidad
• Interferir con o interrumpir el Sitio Web o los servidores o redes conectados al Sitio Web
• Intentar obtener acceso no autorizado a cualquier parte del Sitio Web, otras cuentas o sistemas informáticos
• Recopilar o cosechar cualquier información de identificación personal del Sitio Web
• Usar cualquier robot, araña, raspador u otros medios automatizados para acceder al Sitio Web
• Introducir virus, malware u otro código dañino
• Reproducir, duplicar, copiar, vender, revender o explotar cualquier parte del Sitio Web con fines comerciales sin permiso expreso por escrito

VWS se reserva el derecho de terminar o restringir su acceso al Sitio Web por cualquier violación de estos Términos.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. Derechos de Propiedad Intelectual",
          content: `Todo el contenido de este Sitio Web, incluyendo pero no limitado a texto, gráficos, logotipos, imágenes, fotografías, videos, clips de audio, compilaciones de datos, software, íconos, y la selección y disposición de los mismos (colectivamente, "Contenido"), es propiedad exclusiva de Von Wobeser y Sierra, S.C. o sus proveedores de contenido y está protegido por las leyes de derechos de autor, marcas registradas, patentes, secretos comerciales y otras leyes de propiedad intelectual mexicanas e internacionales.

Marcas Registradas:
El nombre VWS, el logotipo y todos los nombres, logotipos, nombres de productos y servicios, diseños y eslóganes relacionados son marcas registradas de Von Wobeser y Sierra, S.C. o sus afiliados. No puede usar dichas marcas sin el permiso previo por escrito de VWS.

Licencia Limitada:
Sujeto a estos Términos, VWS le otorga una licencia limitada, no exclusiva, intransferible y revocable para acceder y usar el Sitio Web y su Contenido únicamente para su uso personal y no comercial.

Infracción de Derechos de Autor:
Si cree que algún Contenido del Sitio Web infringe sus derechos de autor, comuníquese con nosotros en info@vonwobeser.com.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. Descargo de Responsabilidad sobre Asesoría Legal",
          content: `AVISO IMPORTANTE: La información contenida en este Sitio Web se proporciona únicamente con fines informativos y educativos generales y NO constituye asesoría legal.

Nada en este Sitio Web debe interpretarse como:
• Asesoría legal u opinión legal sobre hechos o circunstancias específicas
• Una oferta o invitación para proporcionar servicios legales
• Una solicitud de representación legal
• Una garantía o predicción de cualquier resultado legal particular

La información legal proporcionada en este Sitio Web:
• Puede no ser aplicable a su situación o jurisdicción particular
• Puede no reflejar los desarrollos legales más recientes
• No debe ser utilizada como sustituto de asesoría legal de un abogado calificado
• No crea una relación abogado-cliente entre usted y VWS

IMPORTANTE: No envíe información confidencial o sensible a VWS a través de este Sitio Web o por correo electrónico hasta que haya recibido confirmación por escrito de que se ha establecido una relación abogado-cliente.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. No Existe Relación Abogado-Cliente",
          content: `Su uso de este Sitio Web, incluyendo navegar por el Contenido, enviar formularios de contacto, enviar correos electrónicos o descargar materiales, NO crea una relación abogado-cliente entre usted y Von Wobeser y Sierra, S.C. o cualquiera de sus abogados.

Una relación abogado-cliente con VWS solo se establece cuando:
• VWS ha aceptado formalmente por escrito representarlo
• Se ha ejecutado una carta de compromiso o contrato de representación firmado
• Se han completado las verificaciones apropiadas de conflictos de interés
• Se han hecho los arreglos de pago (cuando corresponda)
• VWS ha confirmado por escrito que ha asumido la representación de su asunto

Si está considerando contratar a VWS para representación legal, comuníquese con nosotros directamente por teléfono al +52 55 5258 1000.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Limitación de Responsabilidad",
          content: `EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE:

Descargo de Garantías:
EL SITIO WEB Y TODO EL CONTENIDO SE PROPORCIONAN "TAL CUAL" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍA DE NINGÚN TIPO, YA SEA EXPRESA, IMPLÍCITA, LEGAL O DE OTRO TIPO.

Limitación de Responsabilidad:
EN NINGÚN CASO VON WOBESER Y SIERRA, S.C., SUS SOCIOS, ABOGADOS, EMPLEADOS, AFILIADOS, AGENTES O LICENCIANTES SERÁN RESPONSABLES POR CUALQUIER DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE, PUNITIVO O EJEMPLAR.

Responsabilidad Máxima:
EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, LA RESPONSABILIDAD TOTAL DE VWS NO EXCEDERÁ CIEN PESOS MEXICANOS (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Ley Aplicable",
          content: `Estos Términos y Condiciones serán regidos e interpretados de acuerdo con las leyes de los Estados Unidos Mexicanos (México), sin tener en cuenta sus disposiciones sobre conflictos de leyes.

Ley Aplicable:
Las siguientes leyes y regulaciones mexicanas se aplican a estos Términos:
• Código Civil Federal
• Código de Comercio
• Ley Federal de Protección al Consumidor
• Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)

Usuarios Internacionales:
Si accede al Sitio Web desde fuera de México, lo hace bajo su propio riesgo y es responsable del cumplimiento de las leyes locales.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Resolución de Controversias",
          content: `Cualquier disputa, controversia o reclamo que surja de o esté relacionado con estos Términos se resolverá de acuerdo con las siguientes disposiciones:

Negociación:
Las partes acuerdan intentar de buena fe resolver cualquier disputa a través de negociación directa.

Mediación:
Si las negociaciones no logran resolver la disputa dentro de treinta (30) días calendario, cualquiera de las partes puede solicitar mediación.

Jurisdicción y Competencia:
Cualquier acción legal se presentará exclusivamente ante los tribunales federales o locales competentes ubicados en la Ciudad de México, México.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Modificaciones a los Términos",
          content: `Von Wobeser y Sierra, S.C. se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento sin previo aviso.

Cómo se Comunican los Cambios:
• Los cambios materiales se indicarán actualizando la fecha de "Última actualización"
• Las modificaciones significativas pueden anunciarse mediante un aviso en la página de inicio del Sitio Web

Es su responsabilidad revisar estos Términos periódicamente para mantenerse informado de las actualizaciones.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Información de Contacto",
          content: `Si tiene alguna pregunta sobre estos Términos y Condiciones, comuníquese con nosotros:

Von Wobeser y Sierra, S.C.

Dirección Postal:
Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Ciudad de México, México

Teléfono: +52 55 5258 1000
Correo Electrónico: info@vonwobeser.com
Sitio Web: www.vonwobeser.com

Horario de Atención:
Lunes a viernes: 9:00 AM a 6:00 PM (hora de la Ciudad de México)`
        }
      ]
    },
    de: {
      title: "Nutzungsbedingungen",
      subtitle: "Bitte lesen Sie diese Bedingungen sorgfältig durch, bevor Sie unsere Website nutzen",
      lastUpdated: "Zuletzt aktualisiert: Dezember 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. Annahme der Bedingungen",
          content: `Durch den Zugriff auf und die Nutzung der Website von Von Wobeser y Sierra, S.C. (nachfolgend "VWS", "die Kanzlei", "wir", "uns" oder "unser") unter www.vonwobeser.com (nachfolgend "die Website") bestätigen Sie, dass Sie diese Nutzungsbedingungen (nachfolgend "Bedingungen") gelesen und verstanden haben und sich an diese gebunden fühlen.

Wenn Sie mit einem Teil dieser Bedingungen nicht einverstanden sind, müssen Sie die Nutzung der Website sofort einstellen. Ihre fortgesetzte Nutzung der Website stellt Ihre Zustimmung zu diesen Bedingungen und etwaigen Änderungen dar.

Diese Bedingungen stellen eine rechtsverbindliche Vereinbarung zwischen Ihnen (nachfolgend "Nutzer", "Sie" oder "Ihr") und VWS dar. Wir behalten uns das Recht vor, diese Bedingungen jederzeit ohne vorherige Ankündigung zu ändern, zu aktualisieren oder zu modifizieren.

Mit der Nutzung dieser Website erklären und garantieren Sie, dass:
• Sie mindestens 18 Jahre alt sind oder das gesetzliche Volljährigkeitsalter in Ihrer Rechtsordnung erreicht haben
• Sie die rechtliche Fähigkeit haben, verbindliche Vereinbarungen einzugehen
• Sie alle anwendbaren Gesetze und Vorschriften bei der Nutzung dieser Website einhalten werden
• Alle von Ihnen bereitgestellten Informationen korrekt, aktuell und vollständig sind`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. Nutzung der Website",
          content: `Die Website wird ausschließlich zu Informationszwecken bereitgestellt. Der Inhalt dieser Website soll allgemeine Informationen über VWS, ihre Rechtsdienstleistungen, Praxisbereiche und das professionelle Team liefern.

Erlaubte Nutzungen:
• Durchsuchen und Anzeigen von Inhalten für persönliche, nicht-kommerzielle Informationszwecke
• Kontaktaufnahme mit VWS über bereitgestellte Kontaktformulare und Informationen
• Herunterladen öffentlich verfügbarer Materialien für persönliche Referenzen
• Teilen von Links zu Website-Inhalten auf legitime Weise

Verbotene Nutzungen:
Sie stimmen zu, die Website NICHT zu nutzen, um:
• Gegen geltende lokale, staatliche, nationale oder internationale Gesetze oder Vorschriften zu verstoßen
• Material zu übertragen, das verleumderisch, beleidigend oder anderweitig anstößig ist
• Sich als eine Person oder Organisation auszugeben oder Ihre Zugehörigkeit falsch darzustellen
• Die Website oder die mit ihr verbundenen Server oder Netzwerke zu stören oder zu beeinträchtigen
• Unbefugten Zugriff auf Teile der Website, andere Konten oder Computersysteme zu erlangen

VWS behält sich das Recht vor, Ihren Zugang zur Website bei Verstößen gegen diese Bedingungen zu beenden oder einzuschränken.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. Geistiges Eigentum",
          content: `Alle Inhalte auf dieser Website, einschließlich, aber nicht beschränkt auf Texte, Grafiken, Logos, Bilder, Fotografien, Videos, Audioclips, Datenzusammenstellungen, Software, Icons und deren Auswahl und Anordnung (zusammenfassend "Inhalte"), sind das ausschließliche Eigentum von Von Wobeser y Sierra, S.C. oder ihrer Inhaltslieferanten und sind durch mexikanische und internationale Urheberrechts-, Marken-, Patent-, Geschäftsgeheimnis- und andere geistige Eigentumsgesetze geschützt.

Marken:
Der Name VWS, das Logo und alle verwandten Namen, Logos, Produkt- und Servicenamen, Designs und Slogans sind Marken von Von Wobeser y Sierra, S.C. oder ihren verbundenen Unternehmen. Sie dürfen diese Marken nicht ohne vorherige schriftliche Genehmigung von VWS verwenden.

Beschränkte Lizenz:
Vorbehaltlich dieser Bedingungen gewährt Ihnen VWS eine beschränkte, nicht-exklusive, nicht übertragbare, widerrufliche Lizenz zum Zugriff auf und zur Nutzung der Website und ihrer Inhalte ausschließlich für Ihren persönlichen, nicht-kommerziellen Gebrauch.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. Haftungsausschluss für Rechtsberatung",
          content: `WICHTIGER HINWEIS: Die auf dieser Website enthaltenen Informationen werden ausschließlich zu allgemeinen Informations- und Bildungszwecken bereitgestellt und stellen KEINE Rechtsberatung dar.

Nichts auf dieser Website sollte als:
• Rechtsberatung oder rechtliche Stellungnahme zu bestimmten Fakten oder Umständen verstanden werden
• Angebot oder Einladung zur Erbringung von Rechtsdienstleistungen
• Aufforderung zur rechtlichen Vertretung
• Garantie oder Vorhersage eines bestimmten rechtlichen Ergebnisses

Die auf dieser Website bereitgestellten rechtlichen Informationen:
• Sind möglicherweise nicht auf Ihre spezielle Situation oder Rechtsordnung anwendbar
• Spiegeln möglicherweise nicht die aktuellsten rechtlichen Entwicklungen wider
• Sollten nicht als Ersatz für die Rechtsberatung durch einen qualifizierten Anwalt verwendet werden
• Begründen kein Mandatsverhältnis zwischen Ihnen und VWS

WICHTIG: Senden Sie keine vertraulichen oder sensiblen Informationen an VWS über diese Website oder per E-Mail, bis Sie eine schriftliche Bestätigung erhalten haben, dass ein Mandatsverhältnis begründet wurde.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. Kein Mandatsverhältnis",
          content: `Ihre Nutzung dieser Website, einschließlich des Durchsuchens von Inhalten, der Übermittlung von Kontaktformularen, des Sendens von E-Mails oder des Herunterladens von Materialien, begründet KEIN Mandatsverhältnis zwischen Ihnen und Von Wobeser y Sierra, S.C. oder einem ihrer Anwälte.

Ein Mandatsverhältnis mit VWS wird nur begründet, wenn:
• VWS schriftlich formell zugestimmt hat, Sie zu vertreten
• Ein unterzeichnetes Mandatsschreiben oder eine Honorarvereinbarung abgeschlossen wurde
• Entsprechende Interessenkonfliktprüfungen abgeschlossen wurden
• Zahlungsvereinbarungen getroffen wurden (sofern zutreffend)
• VWS schriftlich bestätigt hat, dass sie die Vertretung Ihrer Angelegenheit übernommen hat

Bis zu einer solchen formellen Beauftragung:
• Besteht kein Anwalt-Mandanten-Privileg zwischen Ihnen und VWS
• Gilt keine Vertraulichkeitspflicht für Mitteilungen
• Hat VWS keine Verpflichtung, Rechtsberatung oder Vertretung zu leisten

Bei Interesse an einer rechtlichen Vertretung durch VWS kontaktieren Sie uns bitte direkt telefonisch unter +52 55 5258 1000.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Haftungsbeschränkung",
          content: `IM GRÖSSTMÖGLICHEN UMFANG, DER NACH GELTENDEM RECHT ZULÄSSIG IST:

Gewährleistungsausschluss:
DIE WEBSITE UND ALLE INHALTE WERDEN "WIE BESEHEN" UND "WIE VERFÜGBAR" OHNE JEGLICHE GEWÄHRLEISTUNG BEREITGESTELLT, SEI ES AUSDRÜCKLICH, STILLSCHWEIGEND, GESETZLICH ODER ANDERWEITIG.

VWS gewährleistet nicht, dass:
• Die Website verfügbar, ununterbrochen, rechtzeitig, sicher oder fehlerfrei sein wird
• Die Ergebnisse, die aus der Nutzung der Website erzielt werden können, genau oder zuverlässig sein werden
• Die Qualität der Informationen oder Inhalte Ihren Erwartungen entspricht

Haftungsbeschränkung:
IN KEINEM FALL HAFTEN VON WOBESER Y SIERRA, S.C., IHRE PARTNER, ANWÄLTE, MITARBEITER, VERBUNDENEN UNTERNEHMEN, VERTRETER ODER LIZENZGEBER FÜR INDIREKTE, ZUFÄLLIGE, BESONDERE, FOLGE-, STRAF- ODER BEISPIELHAFTE SCHÄDEN.

Maximale Haftung:
IM GRÖSSTMÖGLICHEN UMFANG, DER NACH DEM GESETZ ZULÄSSIG IST, ÜBERSTEIGT DIE GESAMTHAFTUNG VON VWS NICHT EINHUNDERT MEXIKANISCHE PESOS (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Anwendbares Recht",
          content: `Diese Nutzungsbedingungen sowie alle Streitigkeiten oder Ansprüche, die sich aus oder in Zusammenhang mit ihnen oder ihrem Gegenstand oder ihrer Entstehung ergeben (einschließlich außervertraglicher Streitigkeiten oder Ansprüche), unterliegen den Gesetzen der Vereinigten Mexikanischen Staaten (Mexiko) und werden nach diesen ausgelegt, ohne Berücksichtigung der Kollisionsnormen.

Anwendbares Recht:
Die folgenden mexikanischen Gesetze und Vorschriften gelten für diese Bedingungen:
• Bundeszivilgesetzbuch (Código Civil Federal)
• Bundeshandelsgesetzbuch (Código de Comercio)
• Bundesverbraucherschutzgesetz (Ley Federal de Protección al Consumidor)
• Bundesdatenschutzgesetz (LFPDPPP)

Internationale Nutzer:
Wenn Sie von außerhalb Mexikos auf die Website zugreifen, tun Sie dies auf eigenes Risiko und sind für die Einhaltung der örtlichen Gesetze verantwortlich.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Streitbeilegung",
          content: `Jede Streitigkeit, Kontroverse oder jeder Anspruch, der sich aus diesen Bedingungen oder deren Verletzung, Beendigung oder Gültigkeit ergibt oder damit zusammenhängt, wird gemäß den folgenden Bestimmungen beigelegt:

Verhandlung:
Vor Einleitung eines formellen Streitbeilegungsverfahrens vereinbaren die Parteien, in gutem Glauben zu versuchen, jede Streitigkeit durch direkte Verhandlung zu lösen.

Mediation:
Wenn die Verhandlungen die Streitigkeit nicht innerhalb von dreißig (30) Kalendertagen beilegen, kann jede Partei eine Mediation beantragen.

Gerichtsstand und Zuständigkeit:
Jede rechtliche Maßnahme oder jedes Verfahren wird ausschließlich bei den zuständigen Bundes- oder Ortsgerichten in Mexiko-Stadt (Ciudad de México), Mexiko, eingeleitet.

Verzicht auf Sammelklage:
Sie stimmen zu, dass alle Ansprüche in Ihrer individuellen Eigenschaft und nicht als Kläger oder Mitglied einer Sammelklage geltend gemacht werden.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Änderungen der Bedingungen",
          content: `Von Wobeser y Sierra, S.C. behält sich das Recht vor, diese Nutzungsbedingungen nach eigenem Ermessen jederzeit ohne vorherige Ankündigung zu ändern, zu ergänzen oder zu aktualisieren.

Wie Änderungen mitgeteilt werden:
• Wesentliche Änderungen werden durch Aktualisierung des Datums "Zuletzt aktualisiert" am oberen Rand dieser Seite angezeigt
• Bedeutende Änderungen können durch einen Hinweis auf der Startseite der Website angekündigt werden

Ihre Verantwortlichkeiten:
Es liegt in Ihrer Verantwortung, diese Bedingungen regelmäßig zu überprüfen, um über Aktualisierungen informiert zu bleiben.

Wirkung der fortgesetzten Nutzung:
Ihre fortgesetzte Nutzung der Website nach der Veröffentlichung überarbeiteter Bedingungen bedeutet, dass Sie die Änderungen akzeptieren und ihnen zustimmen.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Kontakt",
          content: `Bei Fragen, Bedenken oder Kommentaren zu diesen Nutzungsbedingungen oder der Website kontaktieren Sie uns bitte:

Von Wobeser y Sierra, S.C.

Postanschrift:
Torre SOMA Chapultepec, 18. Stock
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexiko-Stadt, Mexiko

Telefon: +52 55 5258 1000
E-Mail: info@vonwobeser.com
Website: www.vonwobeser.com

Öffnungszeiten:
Montag bis Freitag: 9:00 bis 18:00 Uhr (Ortszeit Mexiko-Stadt)
Außer an mexikanischen Feiertagen`
        }
      ]
    },
    zh: {
      title: "使用条款",
      subtitle: "在使用我们的网站之前，请仔细阅读这些条款",
      lastUpdated: "最后更新：2024年12月",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. 接受条款",
          content: `通过访问和使用Von Wobeser y Sierra, S.C.（以下简称"VWS"、"本所"、"我们"或"我们的"）的网站www.vonwobeser.com（以下简称"本网站"），您确认已阅读、理解并同意受这些使用条款（以下简称"条款"）的约束。

如果您不同意这些条款的任何部分，您必须立即停止使用本网站。您继续使用本网站即表示您接受这些条款及其任何修改。

这些条款构成您（以下简称"用户"、"您"或"您的"）与VWS之间具有法律约束力的协议。我们保留随时修改、更新或更改这些条款的权利，恕不另行通知。

使用本网站，即表示您声明并保证：
• 您已年满18周岁或达到您所在司法管辖区的法定成年年龄
• 您具有签订具有约束力协议的法律行为能力
• 您在使用本网站时将遵守所有适用的法律法规
• 您提供的所有信息均准确、最新且完整`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. 网站使用",
          content: `本网站仅供参考之用。本网站的内容旨在提供有关VWS、其法律服务、业务领域和专业团队的一般信息。

允许的使用：
• 为个人、非商业信息目的浏览和查看内容
• 通过提供的联系表格和信息联系VWS
• 下载公开可用的材料供个人参考
• 通过合法方式分享网站内容的链接

禁止的使用：
您同意不使用本网站：
• 违反任何适用的地方、州、国家或国际法律或法规
• 传输任何诽谤、冒犯性或其他令人反感的材料
• 冒充任何人或实体或虚假陈述您与任何人或实体的关联
• 干扰或中断本网站或与本网站连接的服务器或网络
• 试图未经授权访问本网站的任何部分、其他账户或计算机系统
• 收集或获取本网站上的任何个人身份信息

VWS保留在您违反这些条款时终止或限制您访问本网站的权利。`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. 知识产权",
          content: `本网站上的所有内容，包括但不限于文本、图形、徽标、图像、照片、视频、音频剪辑、数据汇编、软件、图标及其选择和排列（统称"内容"），均为Von Wobeser y Sierra, S.C.或其内容供应商的专有财产，受墨西哥和国际版权、商标、专利、商业秘密和其他知识产权法律的保护。

商标：
VWS名称、徽标及所有相关名称、徽标、产品和服务名称、设计和标语均为Von Wobeser y Sierra, S.C.或其关联公司的商标。未经VWS事先书面许可，您不得使用此类商标。

有限许可：
根据这些条款，VWS授予您有限的、非排他性的、不可转让的、可撤销的许可，仅供您个人、非商业使用而访问和使用本网站及其内容。`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. 免责声明",
          content: `重要声明：本网站所含信息仅供一般信息和教育目的，不构成法律建议。

本网站上的任何内容均不应被解释为：
• 关于任何特定事实或情况的法律建议或法律意见
• 提供法律服务的要约或邀请
• 寻求法律代理的请求
• 对任何特定法律结果的保证或预测

本网站提供的法律信息：
• 可能不适用于您的特定情况或司法管辖区
• 可能不反映最新的法律发展
• 不应作为合格律师法律建议的替代
• 不会在您与VWS之间建立律师-客户关系

重要提示：在收到书面确认已建立律师-客户关系之前，请勿通过本网站或电子邮件向VWS发送机密或敏感信息。`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. 无律师-客户关系",
          content: `您使用本网站，包括浏览内容、提交联系表格、发送电子邮件或下载材料，不会在您与Von Wobeser y Sierra, S.C.或其任何律师之间建立律师-客户关系。

与VWS的律师-客户关系仅在以下情况下建立：
• VWS正式书面同意代理您
• 已签署委托书或聘用协议
• 已完成适当的利益冲突检查
• 已安排付款事宜（如适用）
• VWS已书面确认其已承担您事务的代理

在正式委托之前：
• 您与VWS之间不存在律师-客户特权
• 通信不适用保密义务
• VWS没有提供法律建议或代理的义务

如果您正在考虑聘请VWS进行法律代理，请直接致电+52 55 5258 1000与我们联系。`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. 责任限制",
          content: `在适用法律允许的最大范围内：

保证免责声明：
本网站和所有内容均按"原样"和"可用"基础提供，不提供任何形式的保证，无论是明示的、暗示的、法定的还是其他形式的。

VWS不保证：
• 本网站将可用、不间断、及时、安全或无错误
• 使用本网站可能获得的结果将准确或可靠
• 通过本网站获得的任何信息或内容的质量将满足您的期望

责任限制：
在任何情况下，VON WOBESER Y SIERRA, S.C.、其合伙人、律师、员工、关联公司、代理人或许可人均不对任何间接、附带、特殊、后果性、惩罚性或惩戒性损害承担责任。

最大责任：
在法律允许的最大范围内，VWS的总责任不超过一百墨西哥比索（MXN $100.00）。`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. 适用法律",
          content: `这些条款及其引起的或与之相关的任何争议或索赔（包括非合同争议或索赔）应受墨西哥合众国法律管辖并据此解释，不考虑其法律冲突条款。

适用法律：
以下墨西哥法律和法规适用于这些条款和本网站的使用：
• 联邦民法典
• 联邦商法典
• 联邦消费者保护法
• 私人持有个人数据保护联邦法（LFPDPPP）

国际用户：
如果您从墨西哥境外访问本网站，您需自行承担风险并负责遵守当地法律。本网站从墨西哥运营，VWS不保证其内容适用于或可在其他地区使用。`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. 争议解决",
          content: `因这些条款或其违反、终止或有效性而产生的任何争议、争论或索赔应根据以下规定解决：

协商：
在启动任何正式争议解决程序之前，双方同意真诚地尝试通过直接协商解决任何争议。

调解：
如果协商未能在三十（30）个日历日内解决争议，任何一方可以请求调解。

管辖权和审判地：
任何法律诉讼或程序应专门在墨西哥城（Ciudad de México）有管辖权的联邦或地方法院提起。

集体诉讼弃权：
您同意以个人身份而非作为任何所谓的集体或代表诉讼的原告或成员提出任何索赔。`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. 条款修改",
          content: `Von Wobeser y Sierra, S.C.保留自行决定随时修改、修订或更新这些条款的权利，恕不另行通知。

变更通知方式：
• 重大变更将通过更新本页顶部的"最后更新"日期来表示
• 重要修改可能会通过网站主页上的通知公布

您的责任：
您有责任定期查看这些条款以了解更新。您应定期检查此页面，以确保您了解任何变更。

继续使用的效果：
您在修订条款发布后继续使用本网站意味着您接受并同意这些变更。如果您不同意新条款，您必须停止使用本网站。`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. 联系方式",
          content: `如果您对这些条款或本网站有任何问题、疑虑或意见，请通过以下方式联系我们：

Von Wobeser y Sierra, S.C.

邮寄地址：
Torre SOMA Chapultepec, 18楼
Campos Elíseos 204, Colonia Polanco
C.P. 11560, 墨西哥城, 墨西哥

电话：+52 55 5258 1000
电子邮件：info@vonwobeser.com
网站：www.vonwobeser.com

办公时间：
周一至周五：上午9:00至下午6:00（墨西哥城时间）
墨西哥联邦节假日除外`
        }
      ]
    },
    ko: {
      title: "이용약관",
      subtitle: "웹사이트를 사용하기 전에 이 약관을 주의 깊게 읽어주세요",
      lastUpdated: "최종 업데이트: 2024년 12월",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. 약관 동의",
          content: `Von Wobeser y Sierra, S.C.(이하 "VWS", "본 법인", "당사" 또는 "당사의")의 웹사이트 www.vonwobeser.com(이하 "웹사이트")에 접속하고 사용함으로써, 귀하는 이 이용약관(이하 "약관")을 읽고 이해했으며 이에 구속되는 것에 동의합니다.

이 약관의 어떤 부분에도 동의하지 않는 경우, 즉시 웹사이트 사용을 중단해야 합니다. 웹사이트를 계속 사용하면 이 약관 및 그 수정사항에 대한 동의를 의미합니다.

이 약관은 귀하(이하 "사용자", "귀하" 또는 "귀하의")와 VWS 간의 법적 구속력이 있는 계약을 구성합니다. 당사는 사전 통지 없이 언제든지 이 약관을 수정, 업데이트 또는 변경할 권리를 보유합니다.

이 웹사이트를 사용함으로써 귀하는 다음을 진술하고 보증합니다:
• 귀하는 최소 18세 이상이거나 관할 지역의 법정 성인 연령에 도달했습니다
• 귀하는 구속력 있는 계약을 체결할 법적 능력이 있습니다
• 귀하는 이 웹사이트를 사용하는 동안 모든 관련 법률 및 규정을 준수합니다
• 귀하가 제공하는 모든 정보는 정확하고 최신이며 완전합니다`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. 웹사이트 사용",
          content: `웹사이트는 정보 제공 목적으로만 제공됩니다. 이 웹사이트의 콘텐츠는 VWS, 법률 서비스, 업무 분야 및 전문 팀에 대한 일반 정보를 제공하기 위한 것입니다.

허용되는 사용:
• 개인적, 비상업적 정보 목적으로 콘텐츠 탐색 및 보기
• 제공된 연락처 양식 및 정보를 통해 VWS에 연락
• 개인 참조용으로 공개적으로 이용 가능한 자료 다운로드
• 합법적인 수단을 통해 웹사이트 콘텐츠 링크 공유

금지되는 사용:
귀하는 웹사이트를 다음 목적으로 사용하지 않는 것에 동의합니다:
• 적용 가능한 지역, 주, 국가 또는 국제 법률 또는 규정 위반
• 명예훼손적, 공격적 또는 기타 불쾌한 자료 전송
• 다른 사람이나 단체를 사칭하거나 소속을 허위로 표시
• 웹사이트 또는 연결된 서버나 네트워크 방해 또는 중단
• 웹사이트의 일부, 다른 계정 또는 컴퓨터 시스템에 대한 무단 접근 시도

VWS는 이 약관 위반 시 귀하의 웹사이트 접근을 종료하거나 제한할 권리를 보유합니다.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. 지적 재산권",
          content: `텍스트, 그래픽, 로고, 이미지, 사진, 비디오, 오디오 클립, 데이터 편집물, 소프트웨어, 아이콘 및 그 선택과 배열을 포함하되 이에 국한되지 않는 이 웹사이트의 모든 콘텐츠(총칭하여 "콘텐츠")는 Von Wobeser y Sierra, S.C. 또는 그 콘텐츠 공급업체의 독점 재산이며 멕시코 및 국제 저작권, 상표, 특허, 영업 비밀 및 기타 지적 재산권법에 의해 보호됩니다.

상표:
VWS 이름, 로고 및 모든 관련 이름, 로고, 제품 및 서비스 이름, 디자인 및 슬로건은 Von Wobeser y Sierra, S.C. 또는 그 계열사의 상표입니다. VWS의 사전 서면 허가 없이 이러한 상표를 사용할 수 없습니다.

제한적 라이선스:
이 약관에 따라 VWS는 귀하에게 개인적, 비상업적 사용만을 위해 웹사이트 및 그 콘텐츠에 접근하고 사용할 수 있는 제한적, 비독점적, 양도 불가능, 취소 가능한 라이선스를 부여합니다.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. 면책 조항",
          content: `중요 공지: 이 웹사이트에 포함된 정보는 일반적인 정보 및 교육 목적으로만 제공되며 법률 자문을 구성하지 않습니다.

이 웹사이트의 어떤 내용도 다음으로 해석되어서는 안 됩니다:
• 특정 사실이나 상황에 대한 법률 자문 또는 법적 의견
• 법률 서비스 제공 제안 또는 초대
• 법적 대리 요청
• 특정 법적 결과에 대한 보증 또는 예측

이 웹사이트에서 제공되는 법률 정보:
• 귀하의 특정 상황이나 관할권에 적용되지 않을 수 있습니다
• 가장 최근의 법률 발전을 반영하지 않을 수 있습니다
• 자격을 갖춘 변호사의 법률 자문을 대신할 수 없습니다
• 귀하와 VWS 간에 변호사-의뢰인 관계를 형성하지 않습니다

중요: 변호사-의뢰인 관계가 수립되었다는 서면 확인을 받기 전까지 이 웹사이트나 이메일을 통해 VWS에 기밀 또는 민감한 정보를 보내지 마십시오.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. 변호사-의뢰인 관계 부존재",
          content: `콘텐츠 탐색, 연락처 양식 제출, 이메일 발송 또는 자료 다운로드를 포함한 이 웹사이트 사용은 귀하와 Von Wobeser y Sierra, S.C. 또는 그 변호사 간에 변호사-의뢰인 관계를 형성하지 않습니다.

VWS와의 변호사-의뢰인 관계는 다음 경우에만 수립됩니다:
• VWS가 귀하를 대리하기로 서면으로 공식 동의한 경우
• 서명된 위임장 또는 수임 계약이 체결된 경우
• 적절한 이해 충돌 검토가 완료된 경우
• 지불 방법이 정해진 경우 (해당되는 경우)
• VWS가 귀하의 사안에 대한 대리를 맡았음을 서면으로 확인한 경우

공식 위임 전까지:
• 귀하와 VWS 간에 변호사-의뢰인 특권이 존재하지 않습니다
• 통신에 비밀 유지 의무가 적용되지 않습니다
• VWS는 법률 자문이나 대리를 제공할 의무가 없습니다

VWS의 법적 대리를 고려하고 있다면 +52 55 5258 1000으로 직접 전화하여 문의하세요.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. 책임 제한",
          content: `관련 법률이 허용하는 최대 범위 내에서:

보증의 부인:
웹사이트 및 모든 콘텐츠는 명시적, 묵시적, 법적 또는 기타 어떠한 종류의 보증도 없이 "있는 그대로" 및 "이용 가능한 대로" 제공됩니다.

VWS는 다음을 보증하지 않습니다:
• 웹사이트가 이용 가능하고, 중단 없이, 적시에, 안전하게 또는 오류 없이 작동할 것
• 웹사이트 사용으로 얻은 결과가 정확하거나 신뢰할 수 있을 것
• 웹사이트를 통해 얻은 정보나 콘텐츠의 품질이 귀하의 기대를 충족할 것

책임 제한:
VON WOBESER Y SIERRA, S.C., 그 파트너, 변호사, 직원, 계열사, 대리인 또는 라이선스 제공자는 어떤 경우에도 간접적, 부수적, 특별, 결과적, 징벌적 또는 예시적 손해에 대해 책임을 지지 않습니다.

최대 책임:
법률이 허용하는 최대 범위 내에서 VWS의 총 책임은 백 멕시코 페소(MXN $100.00)를 초과하지 않습니다.`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. 준거법",
          content: `이 약관 및 이와 관련하여 발생하는 모든 분쟁 또는 청구(비계약적 분쟁 또는 청구 포함)는 법률 충돌 조항에 관계없이 멕시코 합중국 법률에 의해 규율되고 해석됩니다.

준거법:
다음 멕시코 법률 및 규정이 이 약관 및 웹사이트 사용에 적용됩니다:
• 연방 민법전
• 연방 상법전
• 연방 소비자 보호법
• 민간 개인정보 보호에 관한 연방법(LFPDPPP)

국제 사용자:
멕시코 외부에서 웹사이트에 접속하는 경우, 귀하는 자신의 위험을 감수하고 현지 법률 준수에 대한 책임을 집니다.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. 분쟁 해결",
          content: `이 약관 또는 그 위반, 종료 또는 유효성과 관련하여 발생하는 모든 분쟁, 논쟁 또는 청구는 다음 조항에 따라 해결됩니다:

협상:
공식적인 분쟁 해결 절차를 시작하기 전에, 당사자들은 직접 협상을 통해 분쟁을 선의로 해결하려고 시도하기로 동의합니다.

조정:
협상으로 삼십(30) 일력일 이내에 분쟁이 해결되지 않으면, 어느 당사자든 조정을 요청할 수 있습니다.

관할권 및 재판지:
모든 법적 조치 또는 절차는 멕시코시티(Ciudad de México), 멕시코에 있는 관할 연방 또는 지방 법원에서만 제기되어야 합니다.

집단 소송 포기:
귀하는 모든 청구가 개인 자격으로만 제기되고 집단 또는 대표 소송의 원고나 구성원으로는 제기되지 않는 것에 동의합니다.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. 약관 수정",
          content: `Von Wobeser y Sierra, S.C.는 단독 재량으로 사전 통지 없이 언제든지 이 약관을 수정, 개정 또는 업데이트할 권리를 보유합니다.

변경 사항 통지 방법:
• 중요한 변경 사항은 이 페이지 상단의 "최종 업데이트" 날짜를 업데이트하여 표시됩니다
• 중요한 수정 사항은 웹사이트 홈페이지의 공지를 통해 발표될 수 있습니다

귀하의 책임:
업데이트에 대한 정보를 유지하기 위해 이 약관을 정기적으로 검토하는 것은 귀하의 책임입니다.

계속 사용의 효과:
수정된 약관 게시 후 웹사이트를 계속 사용하면 변경 사항을 수락하고 동의하는 것을 의미합니다. 새 약관에 동의하지 않는 경우, 웹사이트 사용을 중단해야 합니다.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. 연락처",
          content: `이 약관 또는 웹사이트에 대한 질문, 우려 사항 또는 의견이 있으시면 다음을 통해 연락해 주세요:

Von Wobeser y Sierra, S.C.

우편 주소:
Torre SOMA Chapultepec, 18층
Campos Elíseos 204, Colonia Polanco
C.P. 11560, 멕시코시티, 멕시코

전화: +52 55 5258 1000
이메일: info@vonwobeser.com
웹사이트: www.vonwobeser.com

영업 시간:
월요일~금요일: 오전 9:00 ~ 오후 6:00 (멕시코시티 시간)
멕시코 연방 공휴일 제외`
        }
      ]
    },
    ja: {
      title: "利用規約",
      subtitle: "ウェブサイトをご利用になる前に、これらの規約をよくお読みください",
      lastUpdated: "最終更新：2024年12月",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. 規約の承諾",
          content: `Von Wobeser y Sierra, S.C.（以下「VWS」、「当事務所」、「当社」または「当社の」）のウェブサイトwww.vonwobeser.com（以下「本ウェブサイト」）にアクセスし使用することにより、お客様はこの利用規約（以下「規約」）を読み、理解し、これに拘束されることに同意したことを認めます。

これらの規約のいずれかの部分に同意されない場合は、直ちに本ウェブサイトの使用を中止してください。本ウェブサイトの継続的な使用は、これらの規約およびその変更への同意を意味します。

これらの規約は、お客様（以下「ユーザー」、「お客様」または「お客様の」）とVWS間の法的拘束力のある契約を構成します。当社は、事前の通知なしにいつでもこれらの規約を変更、更新、または修正する権利を留保します。

本ウェブサイトを使用することにより、お客様は以下を表明し保証します：
• お客様は18歳以上または管轄区域の法定成人年齢に達しています
• お客様は拘束力のある契約を締結する法的能力を有しています
• お客様は本ウェブサイトの使用中、すべての適用される法律および規制を遵守します
• お客様が提供するすべての情報は正確、最新、完全です`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. ウェブサイトの利用",
          content: `本ウェブサイトは情報提供のみを目的として提供されています。本ウェブサイトのコンテンツは、VWS、その法律サービス、業務分野、および専門チームに関する一般的な情報を提供することを目的としています。

許可される使用：
• 個人的、非商業的な情報目的でコンテンツを閲覧および表示すること
• 提供された連絡フォームおよび情報を通じてVWSに連絡すること
• 個人的な参照のために公開されている資料をダウンロードすること
• 正当な手段を通じてウェブサイトコンテンツへのリンクを共有すること

禁止される使用：
お客様は、本ウェブサイトを以下の目的で使用しないことに同意します：
• 適用される地方、州、国内、または国際的な法律または規制への違反
• 名誉毀損的、攻撃的、またはその他の不快な資料の送信
• 他人または団体になりすますこと、または所属を偽ること
• 本ウェブサイトまたは接続されたサーバーやネットワークへの干渉または妨害
• 本ウェブサイトの一部、他のアカウント、またはコンピュータシステムへの不正アクセスの試み

VWSは、これらの規約に違反した場合、お客様の本ウェブサイトへのアクセスを終了または制限する権利を留保します。`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. 知的財産権",
          content: `テキスト、グラフィック、ロゴ、画像、写真、動画、音声クリップ、データ編集物、ソフトウェア、アイコン、およびそれらの選択と配置を含むがこれに限定されない本ウェブサイト上のすべてのコンテンツ（総称して「コンテンツ」）は、Von Wobeser y Sierra, S.C.またはそのコンテンツ供給者の独占的財産であり、メキシコおよび国際的な著作権、商標、特許、営業秘密、およびその他の知的財産法によって保護されています。

商標：
VWSの名称、ロゴ、およびすべての関連する名称、ロゴ、製品およびサービス名、デザイン、スローガンは、Von Wobeser y Sierra, S.C.またはその関連会社の商標です。VWSの事前の書面による許可なく、これらの商標を使用することはできません。

限定的ライセンス：
これらの規約に従い、VWSはお客様に、個人的、非商業的使用のみを目的として本ウェブサイトおよびそのコンテンツにアクセスし使用するための限定的、非独占的、譲渡不能、取り消し可能なライセンスを付与します。`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. 免責事項",
          content: `重要なお知らせ：本ウェブサイトに含まれる情報は、一般的な情報提供および教育目的のみで提供されており、法的助言を構成するものではありません。

本ウェブサイト上のいかなる内容も、以下のように解釈されるべきではありません：
• 特定の事実または状況に関する法的助言または法的意見
• 法的サービスを提供する申し出または招待
• 法的代理の勧誘
• 特定の法的結果の保証または予測

本ウェブサイトで提供される法的情報：
• お客様の特定の状況または管轄区域に適用されない場合があります
• 最新の法的発展を反映していない場合があります
• 資格のある弁護士からの法的助言の代わりとして使用すべきではありません
• お客様とVWS間に弁護士-依頼人関係を形成しません

重要：弁護士-依頼人関係が確立されたことの書面による確認を受けるまで、本ウェブサイトまたは電子メールを通じてVWSに機密情報または機微情報を送信しないでください。`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. 弁護士-依頼人関係の不存在",
          content: `コンテンツの閲覧、連絡フォームの送信、電子メールの送信、または資料のダウンロードを含む本ウェブサイトの使用は、お客様とVon Wobeser y Sierra, S.C.またはその弁護士との間に弁護士-依頼人関係を形成するものではありません。

VWSとの弁護士-依頼人関係は、以下の場合にのみ確立されます：
• VWSがお客様を代理することに書面で正式に同意した場合
• 署名された委任状または顧問契約が締結された場合
• 適切な利益相反チェックが完了した場合
• 支払いの取り決めがなされた場合（該当する場合）
• VWSがお客様の案件の代理を引き受けたことを書面で確認した場合

正式な委任まで：
• お客様とVWS間に弁護士-依頼人特権は存在しません
• 通信に守秘義務は適用されません
• VWSは法的助言または代理を提供する義務を負いません

VWSによる法的代理を検討されている場合は、+52 55 5258 1000まで直接お電話ください。`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. 責任の制限",
          content: `適用法が許容する最大限の範囲において：

保証の否認：
本ウェブサイトおよびすべてのコンテンツは、明示的、黙示的、法定的、またはその他のいかなる種類の保証もなく、「現状のまま」および「利用可能な状態で」提供されます。

VWSは以下を保証しません：
• 本ウェブサイトが利用可能で、中断なく、タイムリーで、安全で、またはエラーがないこと
• 本ウェブサイトの使用から得られる結果が正確または信頼できること
• 本ウェブサイトを通じて取得された情報またはコンテンツの品質がお客様の期待を満たすこと

責任の制限：
いかなる場合も、VON WOBESER Y SIERRA, S.C.、そのパートナー、弁護士、従業員、関連会社、代理人、またはライセンサーは、間接的、付随的、特別、結果的、懲罰的、または懲戒的損害について責任を負いません。

最大責任：
法律が許容する最大限の範囲において、VWSの総責任は100メキシコペソ（MXN $100.00）を超えないものとします。`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. 準拠法",
          content: `これらの規約、およびそれらに関連して生じるあらゆる紛争または請求（非契約的紛争または請求を含む）は、法の抵触に関する規定に関係なく、メキシコ合衆国の法律に準拠し、それに従って解釈されるものとします。

準拠法：
以下のメキシコの法律および規制がこれらの規約および本ウェブサイトの使用に適用されます：
• 連邦民法典
• 連邦商法典
• 連邦消費者保護法
• 民間個人データ保護に関する連邦法（LFPDPPP）

海外ユーザー：
メキシコ国外から本ウェブサイトにアクセスする場合、お客様は自己の責任で行い、現地の法律の遵守に責任を負います。`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. 紛争解決",
          content: `これらの規約またはその違反、終了、または有効性に起因するまたは関連するすべての紛争、論争、または請求は、以下の規定に従って解決されるものとします：

交渉：
正式な紛争解決手続きを開始する前に、当事者は直接交渉を通じて誠意を持って紛争を解決するよう試みることに同意します。

調停：
交渉で30暦日以内に紛争が解決しない場合、いずれかの当事者が調停を要求することができます。

管轄権および裁判地：
すべての法的訴訟または手続きは、メキシコシティ（Ciudad de México）、メキシコにある管轄権を有する連邦または地方裁判所においてのみ提起されるものとします。

集団訴訟の放棄：
お客様は、すべての請求が個人の資格でのみ行われ、集団または代表訴訟の原告またはメンバーとしては行われないことに同意します。`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. 規約の変更",
          content: `Von Wobeser y Sierra, S.C.は、独自の裁量により、事前の通知なしにいつでもこれらの規約を変更、修正、または更新する権利を留保します。

変更の通知方法：
• 重要な変更は、このページの上部にある「最終更新」日を更新することによって示されます
• 重要な変更は、ウェブサイトのホームページでの告知を通じて発表される場合があります

お客様の責任：
更新情報を把握するために、これらの規約を定期的に確認することはお客様の責任です。

継続使用の効果：
改訂された規約の投稿後に本ウェブサイトを継続して使用することは、変更を受け入れ同意することを意味します。新しい規約に同意されない場合は、本ウェブサイトの使用を中止する必要があります。`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. お問い合わせ",
          content: `これらの規約または本ウェブサイトに関するご質問、ご懸念、またはコメントがございましたら、以下を通じてお問い合わせください：

Von Wobeser y Sierra, S.C.

郵送先住所：
Torre SOMA Chapultepec, 18階
Campos Elíseos 204, Colonia Polanco
C.P. 11560, メキシコシティ, メキシコ

電話：+52 55 5258 1000
メール：info@vonwobeser.com
ウェブサイト：www.vonwobeser.com

営業時間：
月曜日〜金曜日：午前9:00〜午後6:00（メキシコシティ時間）
メキシコの祝日を除く`
        }
      ]
    },
    ar: {
      title: "الشروط والأحكام",
      subtitle: "يرجى قراءة هذه الشروط بعناية قبل استخدام موقعنا الإلكتروني",
      lastUpdated: "آخر تحديث: ديسمبر 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. قبول الشروط",
          content: `من خلال الوصول إلى واستخدام موقع Von Wobeser y Sierra, S.C. (المشار إليها فيما بعد بـ "VWS" أو "الشركة" أو "نحن" أو "لنا") الموجود على www.vonwobeser.com (المشار إليه فيما بعد بـ "الموقع الإلكتروني")، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بشروط وأحكام الاستخدام هذه (المشار إليها فيما بعد بـ "الشروط").

إذا كنت لا توافق على أي جزء من هذه الشروط، يجب عليك التوقف فوراً عن استخدام الموقع الإلكتروني. يعتبر استمرارك في استخدام الموقع الإلكتروني بمثابة موافقتك على هذه الشروط وأي تعديلات عليها.

تشكل هذه الشروط اتفاقية ملزمة قانونياً بينك (المشار إليك فيما بعد بـ "المستخدم" أو "أنت" أو "الخاص بك") وبين VWS. نحتفظ بالحق في تعديل أو تحديث أو تغيير هذه الشروط في أي وقت دون إشعار مسبق.

باستخدام هذا الموقع الإلكتروني، فإنك تقر وتضمن أنك:
• تبلغ من العمر 18 عاماً على الأقل أو سن الرشد القانوني في ولايتك القضائية
• لديك الأهلية القانونية للدخول في اتفاقيات ملزمة
• ستلتزم بجميع القوانين واللوائح المعمول بها أثناء استخدام هذا الموقع الإلكتروني
• جميع المعلومات التي تقدمها دقيقة وحالية وكاملة`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. استخدام الموقع الإلكتروني",
          content: `يتم توفير الموقع الإلكتروني لأغراض إعلامية فقط. يهدف المحتوى الموجود على هذا الموقع الإلكتروني إلى تقديم معلومات عامة حول VWS وخدماتها القانونية ومجالات ممارستها وفريقها المهني.

الاستخدامات المسموح بها:
• تصفح وعرض المحتوى لأغراض معلوماتية شخصية وغير تجارية
• الاتصال بـ VWS من خلال نماذج الاتصال والمعلومات المقدمة
• تحميل المواد المتاحة للجمهور كمرجع شخصي
• مشاركة روابط محتوى الموقع الإلكتروني من خلال وسائل مشروعة

الاستخدامات المحظورة:
توافق على عدم استخدام الموقع الإلكتروني من أجل:
• انتهاك أي قانون أو لائحة محلية أو حكومية أو وطنية أو دولية معمول بها
• نقل أي مواد تشهيرية أو مسيئة أو غير لائقة بأي شكل آخر
• انتحال شخصية أي شخص أو كيان أو تحريف انتمائك لأي شخص أو كيان
• التدخل في أو تعطيل الموقع الإلكتروني أو الخوادم أو الشبكات المتصلة بالموقع الإلكتروني
• محاولة الوصول غير المصرح به إلى أي جزء من الموقع الإلكتروني أو الحسابات الأخرى أو أنظمة الكمبيوتر

تحتفظ VWS بالحق في إنهاء أو تقييد وصولك إلى الموقع الإلكتروني بسبب أي انتهاك لهذه الشروط.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. حقوق الملكية الفكرية",
          content: `جميع المحتويات الموجودة على هذا الموقع الإلكتروني، بما في ذلك على سبيل المثال لا الحصر النصوص والرسومات والشعارات والصور والفيديوهات ومقاطع الصوت وتجميعات البيانات والبرامج والأيقونات واختيارها وترتيبها (يُشار إليها مجتمعة بـ "المحتوى")، هي ملكية حصرية لـ Von Wobeser y Sierra, S.C. أو موردي محتواها ومحمية بموجب قوانين حقوق النشر والعلامات التجارية وبراءات الاختراع والأسرار التجارية وغيرها من قوانين الملكية الفكرية المكسيكية والدولية.

العلامات التجارية:
اسم VWS والشعار وجميع الأسماء والشعارات وأسماء المنتجات والخدمات والتصاميم والشعارات ذات الصلة هي علامات تجارية مملوكة لـ Von Wobeser y Sierra, S.C. أو الشركات التابعة لها. لا يجوز لك استخدام هذه العلامات دون الحصول على إذن كتابي مسبق من VWS.

الترخيص المحدود:
وفقاً لهذه الشروط، تمنحك VWS ترخيصاً محدوداً وغير حصري وغير قابل للتحويل وقابل للإلغاء للوصول إلى الموقع الإلكتروني ومحتواه واستخدامهما لاستخدامك الشخصي وغير التجاري فقط.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. إخلاء المسؤولية القانونية",
          content: `إشعار هام: المعلومات الواردة في هذا الموقع الإلكتروني مقدمة لأغراض إعلامية وتعليمية عامة فقط ولا تشكل استشارة قانونية.

لا ينبغي تفسير أي شيء في هذا الموقع الإلكتروني على أنه:
• استشارة قانونية أو رأي قانوني حول أي حقائق أو ظروف محددة
• عرض أو دعوة لتقديم خدمات قانونية
• طلب للتمثيل القانوني
• ضمان أو توقع لأي نتيجة قانونية معينة

المعلومات القانونية المقدمة في هذا الموقع الإلكتروني:
• قد لا تنطبق على وضعك الخاص أو ولايتك القضائية
• قد لا تعكس أحدث التطورات القانونية
• لا ينبغي الاعتماد عليها كبديل عن الاستشارة القانونية من محامٍ مؤهل
• لا تنشئ علاقة محامي-موكل بينك وبين VWS

هام: لا ترسل معلومات سرية أو حساسة إلى VWS من خلال هذا الموقع الإلكتروني أو عبر البريد الإلكتروني حتى تتلقى تأكيداً كتابياً بأن علاقة المحامي-الموكل قد تم تأسيسها.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. عدم وجود علاقة محامي-موكل",
          content: `استخدامك لهذا الموقع الإلكتروني، بما في ذلك تصفح المحتوى أو إرسال نماذج الاتصال أو إرسال رسائل البريد الإلكتروني أو تحميل المواد، لا ينشئ علاقة محامي-موكل بينك وبين Von Wobeser y Sierra, S.C. أو أي من محاميها.

يتم تأسيس علاقة المحامي-الموكل مع VWS فقط عندما:
• توافق VWS رسمياً وكتابياً على تمثيلك
• يتم تنفيذ خطاب تكليف أو اتفاقية توكيل موقعة
• يتم إكمال فحوصات تضارب المصالح المناسبة
• يتم ترتيب شروط الدفع (حيثما ينطبق)
• تؤكد VWS كتابياً أنها تولت تمثيل قضيتك

حتى هذا التكليف الرسمي:
• لا يوجد امتياز المحامي-الموكل بينك وبين VWS
• لا ينطبق واجب السرية على الاتصالات
• ليس لدى VWS أي التزام بتقديم استشارة قانونية أو تمثيل

إذا كنت تفكر في تكليف VWS بالتمثيل القانوني، يرجى الاتصال بنا مباشرة على الهاتف +52 55 5258 1000.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. تحديد المسؤولية",
          content: `إلى أقصى حد يسمح به القانون المعمول به:

إخلاء المسؤولية من الضمانات:
يتم تقديم الموقع الإلكتروني وجميع المحتويات "كما هي" و"كما هي متاحة" دون أي ضمان من أي نوع، سواء كان صريحاً أو ضمنياً أو قانونياً أو غير ذلك.

لا تضمن VWS أن:
• سيكون الموقع الإلكتروني متاحاً ومستمراً وفي الوقت المناسب وآمناً أو خالياً من الأخطاء
• ستكون النتائج التي قد يتم الحصول عليها من استخدام الموقع الإلكتروني دقيقة أو موثوقة
• ستلبي جودة أي معلومات أو محتوى تم الحصول عليه من خلال الموقع الإلكتروني توقعاتك

تحديد المسؤولية:
في أي حال من الأحوال، لن تكون VON WOBESER Y SIERRA, S.C. أو شركاؤها أو محاموها أو موظفوها أو الشركات التابعة لها أو وكلاؤها أو المرخصون لها مسؤولين عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية أو تأديبية.

الحد الأقصى للمسؤولية:
إلى الحد الأقصى الذي يسمح به القانون، لن تتجاوز المسؤولية الإجمالية لـ VWS مائة بيزو مكسيكي (100.00 MXN $).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. القانون الحاكم",
          content: `تخضع هذه الشروط والأحكام وأي نزاع أو مطالبة تنشأ عنها أو تتعلق بها أو بموضوعها أو تشكيلها (بما في ذلك النزاعات أو المطالبات غير التعاقدية) لقوانين الولايات المكسيكية المتحدة (المكسيك) ويتم تفسيرها وفقاً لها، دون مراعاة أحكام تنازع القوانين.

القانون المعمول به:
تنطبق القوانين واللوائح المكسيكية التالية على هذه الشروط واستخدام الموقع الإلكتروني:
• القانون المدني الفيدرالي
• قانون التجارة الفيدرالي
• قانون حماية المستهلك الفيدرالي
• القانون الفيدرالي لحماية البيانات الشخصية (LFPDPPP)

المستخدمون الدوليون:
إذا كنت تصل إلى الموقع الإلكتروني من خارج المكسيك، فأنت تفعل ذلك على مسؤوليتك الخاصة وأنت مسؤول عن الامتثال للقوانين المحلية.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. حل النزاعات",
          content: `أي نزاع أو خلاف أو مطالبة تنشأ عن هذه الشروط أو تتعلق بها أو بانتهاكها أو إنهائها أو صلاحيتها يتم حلها وفقاً للأحكام التالية:

التفاوض:
قبل البدء في أي إجراء رسمي لحل النزاعات، يوافق الطرفان على محاولة حل أي نزاع بحسن نية من خلال التفاوض المباشر.

الوساطة:
إذا فشلت المفاوضات في حل النزاع خلال ثلاثين (30) يوماً تقويمياً، يجوز لأي طرف طلب الوساطة.

الاختصاص القضائي ومكان التقاضي:
يجب رفع أي دعوى قانونية أو إجراء حصرياً أمام المحاكم الفيدرالية أو المحلية المختصة الموجودة في مدينة مكسيكو (Ciudad de México)، المكسيك.

التنازل عن الدعوى الجماعية:
أنت توافق على أن أي مطالبات يجب أن تُقدم بصفتك الفردية وليس كمدعٍ أو عضو في أي إجراء جماعي أو تمثيلي مزعوم.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. تعديلات على الشروط",
          content: `تحتفظ Von Wobeser y Sierra, S.C. بالحق، وفقاً لتقديرها الخاص، في تعديل أو تغيير أو تحديث هذه الشروط والأحكام في أي وقت دون إشعار مسبق.

كيفية الإبلاغ عن التغييرات:
• ستتم الإشارة إلى التغييرات الجوهرية من خلال تحديث تاريخ "آخر تحديث" في أعلى هذه الصفحة
• قد يتم الإعلان عن التعديلات الهامة من خلال إشعار على الصفحة الرئيسية للموقع الإلكتروني

مسؤولياتك:
تقع على عاتقك مسؤولية مراجعة هذه الشروط بشكل دوري للبقاء على اطلاع بالتحديثات.

تأثير الاستخدام المستمر:
يعني استمرارك في استخدام الموقع الإلكتروني بعد نشر الشروط المعدلة أنك تقبل وتوافق على التغييرات. إذا كنت لا توافق على الشروط الجديدة، يجب عليك التوقف عن استخدام الموقع الإلكتروني.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. معلومات الاتصال",
          content: `إذا كان لديك أي أسئلة أو مخاوف أو تعليقات بشأن هذه الشروط والأحكام أو الموقع الإلكتروني، يرجى الاتصال بنا من خلال الوسائل التالية:

Von Wobeser y Sierra, S.C.

العنوان البريدي:
Torre SOMA Chapultepec، الطابق 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560، مدينة مكسيكو، المكسيك

الهاتف: +52 55 5258 1000
البريد الإلكتروني: info@vonwobeser.com
الموقع الإلكتروني: www.vonwobeser.com

ساعات العمل:
من الاثنين إلى الجمعة: 9:00 صباحاً إلى 6:00 مساءً (بتوقيت مدينة مكسيكو)
باستثناء العطلات الفيدرالية المكسيكية`
        }
      ]
    },
    ru: {
      title: "Условия использования",
      subtitle: "Пожалуйста, внимательно прочитайте эти условия перед использованием нашего веб-сайта",
      lastUpdated: "Последнее обновление: Декабрь 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. Принятие условий",
          content: `Получая доступ и используя веб-сайт Von Wobeser y Sierra, S.C. (далее «VWS», «Фирма», «мы», «нас» или «наш»), расположенный по адресу www.vonwobeser.com (далее «Веб-сайт»), вы подтверждаете, что прочитали, поняли и согласны соблюдать настоящие Условия использования (далее «Условия»).

Если вы не согласны с какой-либо частью этих Условий, вы должны немедленно прекратить использование Веб-сайта. Продолжение использования Веб-сайта означает ваше принятие этих Условий и любых их изменений.

Эти Условия представляют собой юридически обязывающее соглашение между вами (далее «Пользователь», «вы» или «ваш») и VWS. Мы оставляем за собой право изменять, обновлять или модифицировать эти Условия в любое время без предварительного уведомления.

Используя этот Веб-сайт, вы заявляете и гарантируете, что:
• Вам исполнилось не менее 18 лет или вы достигли совершеннолетия в вашей юрисдикции
• У вас есть правоспособность заключать обязательные соглашения
• Вы будете соблюдать все применимые законы и правила при использовании этого Веб-сайта
• Вся предоставляемая вами информация является точной, актуальной и полной`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. Использование сайта",
          content: `Веб-сайт предоставляется исключительно в информационных целях. Содержимое этого Веб-сайта предназначено для предоставления общей информации о VWS, её юридических услугах, областях практики и профессиональной команде.

Разрешённое использование:
• Просмотр контента в личных, некоммерческих информационных целях
• Связь с VWS через предоставленные контактные формы и информацию
• Загрузка общедоступных материалов для личного использования
• Обмен ссылками на контент Веб-сайта законными способами

Запрещённое использование:
Вы соглашаетесь НЕ использовать Веб-сайт для:
• Нарушения любого применимого местного, государственного, национального или международного закона или правила
• Передачи любых материалов, которые являются клеветническими, оскорбительными или иным образом неприемлемыми
• Выдачи себя за другое лицо или организацию или искажения вашей принадлежности к любому лицу или организации
• Вмешательства в работу или нарушения работы Веб-сайта или серверов или сетей, подключённых к Веб-сайту
• Попытки получить несанкционированный доступ к любой части Веб-сайта, другим учётным записям или компьютерным системам

VWS оставляет за собой право прекратить или ограничить ваш доступ к Веб-сайту в случае нарушения этих Условий.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. Интеллектуальная собственность",
          content: `Весь контент на этом Веб-сайте, включая, но не ограничиваясь текстом, графикой, логотипами, изображениями, фотографиями, видео, аудиоклипами, компиляциями данных, программным обеспечением, иконками и их выбором и расположением (совместно именуемый «Контент»), является исключительной собственностью Von Wobeser y Sierra, S.C. или её поставщиков контента и защищён мексиканскими и международными законами об авторском праве, товарных знаках, патентах, коммерческой тайне и другими законами об интеллектуальной собственности.

Товарные знаки:
Название VWS, логотип и все связанные названия, логотипы, названия продуктов и услуг, дизайны и слоганы являются товарными знаками Von Wobeser y Sierra, S.C. или её аффилированных лиц. Вы не можете использовать эти знаки без предварительного письменного разрешения VWS.

Ограниченная лицензия:
С учётом этих Условий VWS предоставляет вам ограниченную, неисключительную, непередаваемую, отзывную лицензию на доступ и использование Веб-сайта и его Контента исключительно для вашего личного, некоммерческого использования.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. Отказ от ответственности",
          content: `ВАЖНОЕ УВЕДОМЛЕНИЕ: Информация, содержащаяся на этом Веб-сайте, предоставляется исключительно в общих информационных и образовательных целях и НЕ является юридической консультацией.

Ничто на этом Веб-сайте не следует толковать как:
• Юридическую консультацию или юридическое заключение по каким-либо конкретным фактам или обстоятельствам
• Предложение или приглашение к оказанию юридических услуг
• Ходатайство о юридическом представительстве
• Гарантию или прогноз какого-либо конкретного юридического результата

Юридическая информация, представленная на этом Веб-сайте:
• Может быть неприменима к вашей конкретной ситуации или юрисдикции
• Может не отражать самые последние правовые изменения
• Не должна использоваться вместо юридической консультации квалифицированного адвоката
• Не создаёт отношений адвокат-клиент между вами и VWS

ВАЖНО: Не отправляйте конфиденциальную или чувствительную информацию в VWS через этот Веб-сайт или по электронной почте, пока не получите письменное подтверждение того, что отношения адвокат-клиент были установлены.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. Отсутствие отношений адвокат-клиент",
          content: `Использование вами этого Веб-сайта, включая просмотр Контента, отправку контактных форм, отправку электронных писем или загрузку материалов, НЕ создаёт отношений адвокат-клиент между вами и Von Wobeser y Sierra, S.C. или любым из её адвокатов.

Отношения адвокат-клиент с VWS устанавливаются только когда:
• VWS официально согласилась в письменной форме представлять ваши интересы
• Подписано соглашение о юридическом обслуживании или договор о представительстве
• Проведена надлежащая проверка на конфликт интересов
• Достигнуты договорённости об оплате (где применимо)
• VWS подтвердила в письменной форме, что взяла на себя представительство по вашему делу

До такого официального поручения:
• Между вами и VWS не существует адвокатской тайны
• К сообщениям не применяется обязанность конфиденциальности
• VWS не обязана предоставлять юридическую консультацию или представительство

Если вы рассматриваете возможность привлечения VWS для юридического представительства, пожалуйста, свяжитесь с нами напрямую по телефону +52 55 5258 1000.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Ограничение ответственности",
          content: `В МАКСИМАЛЬНОЙ СТЕПЕНИ, РАЗРЕШЁННОЙ ПРИМЕНИМЫМ ЗАКОНОДАТЕЛЬСТВОМ:

Отказ от гарантий:
ВЕБ-САЙТ И ВЕСЬ КОНТЕНТ ПРЕДОСТАВЛЯЮТСЯ «КАК ЕСТЬ» И «ПО МЕРЕ ДОСТУПНОСТИ» БЕЗ КАКИХ-ЛИБО ГАРАНТИЙ, ЯВНЫХ, ПОДРАЗУМЕВАЕМЫХ, УСТАНОВЛЕННЫХ ЗАКОНОМ ИЛИ ИНЫХ.

VWS не гарантирует, что:
• Веб-сайт будет доступен, бесперебойен, своевременен, безопасен или безошибочен
• Результаты, которые могут быть получены от использования Веб-сайта, будут точными или надёжными
• Качество любой информации или Контента, полученного через Веб-сайт, будет соответствовать вашим ожиданиям

Ограничение ответственности:
НИ ПРИ КАКИХ ОБСТОЯТЕЛЬСТВАХ VON WOBESER Y SIERRA, S.C., ЕЁ ПАРТНЁРЫ, АДВОКАТЫ, СОТРУДНИКИ, АФФИЛИРОВАННЫЕ ЛИЦА, АГЕНТЫ ИЛИ ЛИЦЕНЗИАРЫ НЕ НЕСУТ ОТВЕТСТВЕННОСТИ ЗА ЛЮБЫЕ КОСВЕННЫЕ, СЛУЧАЙНЫЕ, ОСОБЫЕ, ПОСЛЕДУЮЩИЕ, ШТРАФНЫЕ ИЛИ ПРИМЕРНЫЕ УБЫТКИ.

Максимальная ответственность:
В МАКСИМАЛЬНОЙ СТЕПЕНИ, РАЗРЕШЁННОЙ ЗАКОНОМ, СОВОКУПНАЯ ОТВЕТСТВЕННОСТЬ VWS НЕ ПРЕВЫШАЕТ СТО МЕКСИКАНСКИХ ПЕСО (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Применимое право",
          content: `Настоящие Условия и любой спор или претензия, возникающие из них или в связи с ними, их предметом или формированием (включая внедоговорные споры или претензии), регулируются и толкуются в соответствии с законодательством Мексиканских Соединённых Штатов (Мексика), без учёта положений о коллизии права.

Применимое право:
Следующие мексиканские законы и нормативные акты применяются к настоящим Условиям и использованию Веб-сайта:
• Федеральный гражданский кодекс
• Федеральный торговый кодекс
• Федеральный закон о защите прав потребителей
• Федеральный закон о защите персональных данных (LFPDPPP)

Международные пользователи:
Если вы получаете доступ к Веб-сайту из-за пределов Мексики, вы делаете это на свой страх и риск и несёте ответственность за соблюдение местных законов.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Разрешение споров",
          content: `Любой спор, разногласие или претензия, возникающие из настоящих Условий или связанные с ними, их нарушением, прекращением или действительностью, разрешаются в соответствии со следующими положениями:

Переговоры:
Перед началом любой официальной процедуры разрешения споров стороны соглашаются добросовестно пытаться разрешить любой спор путём прямых переговоров.

Медиация:
Если переговоры не приведут к разрешению спора в течение тридцати (30) календарных дней, любая из сторон может запросить медиацию.

Юрисдикция и место рассмотрения:
Любой судебный иск или разбирательство должны подаваться исключительно в компетентные федеральные или местные суды, расположенные в Мехико (Ciudad de México), Мексика.

Отказ от коллективного иска:
Вы соглашаетесь, что любые претензии будут предъявляться в вашем индивидуальном качестве, а не в качестве истца или члена какого-либо предполагаемого группового или представительского разбирательства.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Изменения условий",
          content: `Von Wobeser y Sierra, S.C. оставляет за собой право по своему усмотрению изменять, дополнять или обновлять настоящие Условия в любое время без предварительного уведомления.

Как сообщается об изменениях:
• Существенные изменения будут указаны путём обновления даты «Последнее обновление» в верхней части этой страницы
• Значительные изменения могут быть объявлены посредством уведомления на главной странице Веб-сайта

Ваши обязанности:
Вы несёте ответственность за периодическую проверку этих Условий, чтобы быть в курсе обновлений.

Эффект продолжения использования:
Продолжение использования Веб-сайта после публикации пересмотренных Условий означает, что вы принимаете и соглашаетесь с изменениями. Если вы не согласны с новыми Условиями, вы должны прекратить использование Веб-сайта.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Контакты",
          content: `Если у вас есть вопросы, замечания или комментарии относительно настоящих Условий или Веб-сайта, пожалуйста, свяжитесь с нами:

Von Wobeser y Sierra, S.C.

Почтовый адрес:
Torre SOMA Chapultepec, 18 этаж
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Мехико, Мексика

Телефон: +52 55 5258 1000
Электронная почта: info@vonwobeser.com
Веб-сайт: www.vonwobeser.com

Часы работы:
Понедельник – пятница: 9:00 – 18:00 (по времени Мехико)
За исключением мексиканских федеральных праздников`
        }
      ]
    },
    fr: {
      title: "Conditions d'utilisation",
      subtitle: "Veuillez lire attentivement ces conditions avant d'utiliser notre site web",
      lastUpdated: "Dernière mise à jour : Décembre 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. Acceptation des conditions",
          content: `En accédant et en utilisant le site web de Von Wobeser y Sierra, S.C. (ci-après « VWS », « le Cabinet », « nous », « notre » ou « nos »), situé à www.vonwobeser.com (ci-après « le Site Web »), vous reconnaissez avoir lu, compris et accepté d'être lié par les présentes Conditions d'utilisation (ci-après « Conditions »).

Si vous n'êtes pas d'accord avec une partie de ces Conditions, vous devez immédiatement cesser d'utiliser le Site Web. Votre utilisation continue du Site Web constitue votre acceptation de ces Conditions et de toute modification y apportée.

Ces Conditions constituent un accord juridiquement contraignant entre vous (ci-après « Utilisateur », « vous » ou « votre ») et VWS. Nous nous réservons le droit de modifier, mettre à jour ou changer ces Conditions à tout moment sans préavis.

En utilisant ce Site Web, vous déclarez et garantissez que :
• Vous avez au moins 18 ans ou l'âge légal de la majorité dans votre juridiction
• Vous avez la capacité juridique de conclure des accords contraignants
• Vous respecterez toutes les lois et réglementations applicables lors de l'utilisation de ce Site Web
• Toutes les informations que vous fournissez sont exactes, actuelles et complètes`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. Utilisation du site web",
          content: `Le Site Web est fourni uniquement à des fins d'information. Le contenu de ce Site Web est destiné à fournir des informations générales sur VWS, ses services juridiques, ses domaines de pratique et son équipe professionnelle.

Utilisations autorisées :
• Naviguer et consulter le contenu à des fins d'information personnelle et non commerciale
• Contacter VWS via les formulaires de contact et les informations fournis
• Télécharger des documents publiquement disponibles pour référence personnelle
• Partager des liens vers le contenu du Site Web par des moyens légitimes

Utilisations interdites :
Vous acceptez de NE PAS utiliser le Site Web pour :
• Violer toute loi ou réglementation locale, étatique, nationale ou internationale applicable
• Transmettre tout matériel diffamatoire, offensant ou autrement répréhensible
• Usurper l'identité d'une personne ou d'une entité ou déformer votre affiliation avec une personne ou une entité
• Interférer avec ou perturber le Site Web ou les serveurs ou réseaux connectés au Site Web
• Tenter d'accéder sans autorisation à toute partie du Site Web, à d'autres comptes ou à des systèmes informatiques

VWS se réserve le droit de mettre fin ou de restreindre votre accès au Site Web pour toute violation de ces Conditions.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. Propriété intellectuelle",
          content: `Tout le contenu de ce Site Web, y compris mais sans s'y limiter les textes, graphiques, logos, images, photographies, vidéos, clips audio, compilations de données, logiciels, icônes, et leur sélection et arrangement (collectivement, le « Contenu »), est la propriété exclusive de Von Wobeser y Sierra, S.C. ou de ses fournisseurs de contenu et est protégé par les lois mexicaines et internationales sur le droit d'auteur, les marques, les brevets, les secrets commerciaux et autres droits de propriété intellectuelle.

Marques :
Le nom VWS, le logo et tous les noms, logos, noms de produits et services, designs et slogans associés sont des marques de Von Wobeser y Sierra, S.C. ou de ses affiliés. Vous ne pouvez pas utiliser ces marques sans l'autorisation écrite préalable de VWS.

Licence limitée :
Sous réserve de ces Conditions, VWS vous accorde une licence limitée, non exclusive, non transférable et révocable pour accéder et utiliser le Site Web et son Contenu uniquement pour votre usage personnel et non commercial.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. Exclusion de conseil juridique",
          content: `AVIS IMPORTANT : Les informations contenues sur ce Site Web sont fournies uniquement à des fins d'information générale et d'éducation et NE constituent PAS un conseil juridique.

Rien sur ce Site Web ne doit être interprété comme :
• Un conseil juridique ou un avis juridique sur des faits ou des circonstances spécifiques
• Une offre ou une invitation à fournir des services juridiques
• Une sollicitation pour une représentation juridique
• Une garantie ou une prédiction d'un résultat juridique particulier

Les informations juridiques fournies sur ce Site Web :
• Peuvent ne pas être applicables à votre situation particulière ou à votre juridiction
• Peuvent ne pas refléter les développements juridiques les plus récents
• Ne doivent pas être utilisées comme substitut aux conseils juridiques d'un avocat qualifié
• Ne créent pas de relation avocat-client entre vous et VWS

IMPORTANT : N'envoyez pas d'informations confidentielles ou sensibles à VWS via ce Site Web ou par e-mail tant que vous n'avez pas reçu une confirmation écrite qu'une relation avocat-client a été établie.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. Absence de relation avocat-client",
          content: `Votre utilisation de ce Site Web, y compris la navigation dans le Contenu, la soumission de formulaires de contact, l'envoi d'e-mails ou le téléchargement de documents, NE crée PAS de relation avocat-client entre vous et Von Wobeser y Sierra, S.C. ou l'un de ses avocats.

Une relation avocat-client avec VWS n'est établie que lorsque :
• VWS a formellement accepté par écrit de vous représenter
• Une lettre d'engagement ou un contrat de représentation signé a été exécuté
• Les vérifications appropriées des conflits d'intérêts ont été effectuées
• Les modalités de paiement ont été convenues (le cas échéant)
• VWS a confirmé par écrit qu'elle a entrepris la représentation de votre affaire

Jusqu'à cet engagement formel :
• Aucun privilège avocat-client n'existe entre vous et VWS
• Aucune obligation de confidentialité ne s'applique aux communications
• VWS n'a aucune obligation de fournir des conseils juridiques ou une représentation

Si vous envisagez d'engager VWS pour une représentation juridique, veuillez nous contacter directement par téléphone au +52 55 5258 1000.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Limitation de responsabilité",
          content: `DANS TOUTE LA MESURE PERMISE PAR LA LOI APPLICABLE :

Exclusion de garanties :
LE SITE WEB ET TOUT LE CONTENU SONT FOURNIS « EN L'ÉTAT » ET « SELON DISPONIBILITÉ » SANS GARANTIE D'AUCUNE SORTE, QU'ELLE SOIT EXPRESSE, IMPLICITE, LÉGALE OU AUTRE.

VWS ne garantit pas que :
• Le Site Web sera disponible, ininterrompu, ponctuel, sécurisé ou exempt d'erreurs
• Les résultats qui peuvent être obtenus de l'utilisation du Site Web seront exacts ou fiables
• La qualité de toute information ou Contenu obtenu via le Site Web répondra à vos attentes

Limitation de responsabilité :
EN AUCUN CAS VON WOBESER Y SIERRA, S.C., SES ASSOCIÉS, AVOCATS, EMPLOYÉS, AFFILIÉS, AGENTS OU CONCÉDANTS DE LICENCE NE SERONT RESPONSABLES DE TOUT DOMMAGE INDIRECT, ACCESSOIRE, SPÉCIAL, CONSÉCUTIF, PUNITIF OU EXEMPLAIRE.

Responsabilité maximale :
DANS TOUTE LA MESURE PERMISE PAR LA LOI, LA RESPONSABILITÉ TOTALE DE VWS NE DÉPASSERA PAS CENT PESOS MEXICAINS (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Loi applicable",
          content: `Ces Conditions et tout litige ou réclamation en découlant ou s'y rapportant, leur objet ou leur formation (y compris les litiges ou réclamations non contractuels), seront régis et interprétés conformément aux lois des États-Unis du Mexique (Mexique), sans tenir compte de ses dispositions relatives aux conflits de lois.

Loi applicable :
Les lois et règlements mexicains suivants s'appliquent à ces Conditions et à l'utilisation du Site Web :
• Code civil fédéral
• Code de commerce fédéral
• Loi fédérale sur la protection des consommateurs
• Loi fédérale sur la protection des données personnelles (LFPDPPP)

Utilisateurs internationaux :
Si vous accédez au Site Web depuis l'extérieur du Mexique, vous le faites à vos propres risques et êtes responsable du respect des lois locales.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Résolution des litiges",
          content: `Tout litige, controverse ou réclamation découlant de ces Conditions ou s'y rapportant, ou à leur violation, résiliation ou validité, sera résolu conformément aux dispositions suivantes :

Négociation :
Avant d'engager toute procédure formelle de résolution des litiges, les parties conviennent de tenter de bonne foi de résoudre tout litige par négociation directe.

Médiation :
Si les négociations ne parviennent pas à résoudre le litige dans un délai de trente (30) jours calendaires, l'une ou l'autre des parties peut demander une médiation.

Juridiction et lieu :
Toute action en justice ou procédure sera engagée exclusivement devant les tribunaux fédéraux ou locaux compétents situés à Mexico (Ciudad de México), Mexique.

Renonciation aux recours collectifs :
Vous acceptez que toute réclamation soit présentée en votre capacité individuelle et non en tant que plaignant ou membre de tout prétendu recours collectif ou représentatif.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Modifications des conditions",
          content: `Von Wobeser y Sierra, S.C. se réserve le droit, à sa seule discrétion, de modifier, amender ou mettre à jour ces Conditions à tout moment sans préavis.

Comment les changements sont communiqués :
• Les changements importants seront indiqués par la mise à jour de la date « Dernière mise à jour » en haut de cette page
• Les modifications significatives peuvent être annoncées par un avis sur la page d'accueil du Site Web

Vos responsabilités :
Il est de votre responsabilité de consulter périodiquement ces Conditions pour rester informé des mises à jour.

Effet de l'utilisation continue :
Votre utilisation continue du Site Web après la publication des Conditions révisées signifie que vous acceptez et êtes d'accord avec les changements. Si vous n'acceptez pas les nouvelles Conditions, vous devez cesser d'utiliser le Site Web.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Contact",
          content: `Si vous avez des questions, des préoccupations ou des commentaires concernant ces Conditions ou le Site Web, veuillez nous contacter :

Von Wobeser y Sierra, S.C.

Adresse postale :
Torre SOMA Chapultepec, 18e étage
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Mexico, Mexique

Téléphone : +52 55 5258 1000
E-mail : info@vonwobeser.com
Site web : www.vonwobeser.com

Heures d'ouverture :
Lundi au vendredi : 9h00 à 18h00 (heure de Mexico)
Hors jours fériés fédéraux mexicains`
        }
      ]
    },
    it: {
      title: "Termini e Condizioni",
      subtitle: "Si prega di leggere attentamente questi termini prima di utilizzare il nostro sito web",
      lastUpdated: "Ultimo aggiornamento: Dicembre 2024",
      sections: [
        {
          id: "acceptance",
          icon: FileText,
          title: "1. Accettazione dei termini",
          content: `Accedendo e utilizzando il sito web di Von Wobeser y Sierra, S.C. (di seguito "VWS", "lo Studio", "noi", "ci" o "nostro"), situato su www.vonwobeser.com (di seguito "il Sito Web"), riconosci di aver letto, compreso e di accettare di essere vincolato da questi Termini e Condizioni d'uso (di seguito "Termini").

Se non sei d'accordo con qualsiasi parte di questi Termini, devi interrompere immediatamente l'uso del Sito Web. L'uso continuato del Sito Web costituisce la tua accettazione di questi Termini e di eventuali modifiche.

Questi Termini costituiscono un accordo legalmente vincolante tra te (di seguito "Utente", "tu" o "tuo") e VWS. Ci riserviamo il diritto di modificare, aggiornare o cambiare questi Termini in qualsiasi momento senza preavviso.

Utilizzando questo Sito Web, dichiari e garantisci che:
• Hai almeno 18 anni o l'età legale della maggiore età nella tua giurisdizione
• Hai la capacità giuridica di stipulare accordi vincolanti
• Rispetterai tutte le leggi e i regolamenti applicabili durante l'utilizzo di questo Sito Web
• Tutte le informazioni che fornisci sono accurate, attuali e complete`
        },
        {
          id: "website-use",
          icon: Globe,
          title: "2. Utilizzo del sito web",
          content: `Il Sito Web è fornito esclusivamente a scopo informativo. Il contenuto di questo Sito Web è destinato a fornire informazioni generali su VWS, i suoi servizi legali, aree di pratica e team professionale.

Usi consentiti:
• Navigare e visualizzare i contenuti per scopi informativi personali e non commerciali
• Contattare VWS tramite i moduli di contatto e le informazioni fornite
• Scaricare materiali pubblicamente disponibili per riferimento personale
• Condividere link ai contenuti del Sito Web attraverso mezzi legittimi

Usi vietati:
Accetti di NON utilizzare il Sito Web per:
• Violare qualsiasi legge o regolamento locale, statale, nazionale o internazionale applicabile
• Trasmettere materiale diffamatorio, offensivo o altrimenti discutibile
• Impersonare qualsiasi persona o entità o travisare la tua affiliazione con qualsiasi persona o entità
• Interferire con o interrompere il Sito Web o i server o le reti connesse al Sito Web
• Tentare di ottenere accesso non autorizzato a qualsiasi parte del Sito Web, altri account o sistemi informatici

VWS si riserva il diritto di terminare o limitare il tuo accesso al Sito Web per qualsiasi violazione di questi Termini.`
        },
        {
          id: "intellectual-property",
          icon: BookOpen,
          title: "3. Proprietà intellettuale",
          content: `Tutti i contenuti di questo Sito Web, inclusi ma non limitati a testi, grafica, loghi, immagini, fotografie, video, clip audio, compilazioni di dati, software, icone e la loro selezione e disposizione (collettivamente, "Contenuto"), sono proprietà esclusiva di Von Wobeser y Sierra, S.C. o dei suoi fornitori di contenuti e sono protetti dalle leggi messicane e internazionali sul diritto d'autore, marchi, brevetti, segreti commerciali e altre leggi sulla proprietà intellettuale.

Marchi:
Il nome VWS, il logo e tutti i nomi, loghi, nomi di prodotti e servizi, design e slogan correlati sono marchi di Von Wobeser y Sierra, S.C. o delle sue affiliate. Non puoi utilizzare tali marchi senza il previo consenso scritto di VWS.

Licenza limitata:
Fatti salvi questi Termini, VWS ti concede una licenza limitata, non esclusiva, non trasferibile e revocabile per accedere e utilizzare il Sito Web e il suo Contenuto esclusivamente per il tuo uso personale e non commerciale.`
        },
        {
          id: "no-legal-advice",
          icon: AlertTriangle,
          title: "4. Esclusione di consulenza legale",
          content: `AVVISO IMPORTANTE: Le informazioni contenute in questo Sito Web sono fornite solo a scopo informativo e didattico generale e NON costituiscono consulenza legale.

Nulla in questo Sito Web deve essere interpretato come:
• Consulenza legale o parere legale su fatti o circostanze specifiche
• Un'offerta o un invito a fornire servizi legali
• Una sollecitazione per la rappresentanza legale
• Una garanzia o previsione di un particolare risultato legale

Le informazioni legali fornite su questo Sito Web:
• Potrebbero non essere applicabili alla tua particolare situazione o giurisdizione
• Potrebbero non riflettere gli sviluppi legali più recenti
• Non dovrebbero essere utilizzate come sostituto della consulenza legale di un avvocato qualificato
• Non creano un rapporto avvocato-cliente tra te e VWS

IMPORTANTE: Non inviare informazioni riservate o sensibili a VWS tramite questo Sito Web o via e-mail fino a quando non avrai ricevuto conferma scritta che un rapporto avvocato-cliente è stato stabilito.`
        },
        {
          id: "no-attorney-client",
          icon: Users,
          title: "5. Assenza di rapporto avvocato-cliente",
          content: `Il tuo utilizzo di questo Sito Web, inclusa la navigazione dei Contenuti, l'invio di moduli di contatto, l'invio di e-mail o il download di materiali, NON crea un rapporto avvocato-cliente tra te e Von Wobeser y Sierra, S.C. o alcuno dei suoi avvocati.

Un rapporto avvocato-cliente con VWS viene stabilito solo quando:
• VWS ha formalmente accettato per iscritto di rappresentarti
• È stata eseguita una lettera di incarico o un contratto di rappresentanza firmato
• Sono stati completati i controlli appropriati sui conflitti di interesse
• Sono stati stabiliti gli accordi di pagamento (dove applicabile)
• VWS ha confermato per iscritto di aver assunto la rappresentanza della tua questione

Fino a tale incarico formale:
• Non esiste alcun privilegio avvocato-cliente tra te e VWS
• Nessun obbligo di riservatezza si applica alle comunicazioni
• VWS non ha alcun obbligo di fornire consulenza legale o rappresentanza

Se stai considerando di incaricare VWS per la rappresentanza legale, contattaci direttamente per telefono al +52 55 5258 1000.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Limitazione di responsabilità",
          content: `NELLA MISURA MASSIMA CONSENTITA DALLA LEGGE APPLICABILE:

Esclusione di garanzie:
IL SITO WEB E TUTTI I CONTENUTI SONO FORNITI "COSÌ COME SONO" E "COME DISPONIBILI" SENZA GARANZIE DI ALCUN TIPO, SIANO ESSE ESPLICITE, IMPLICITE, LEGALI O DI ALTRO TIPO.

VWS non garantisce che:
• Il Sito Web sarà disponibile, ininterrotto, tempestivo, sicuro o privo di errori
• I risultati che possono essere ottenuti dall'uso del Sito Web saranno accurati o affidabili
• La qualità di qualsiasi informazione o Contenuto ottenuto tramite il Sito Web soddisferà le tue aspettative

Limitazione di responsabilità:
IN NESSUN CASO VON WOBESER Y SIERRA, S.C., I SUOI PARTNER, AVVOCATI, DIPENDENTI, AFFILIATI, AGENTI O LICENZIATARI SARANNO RESPONSABILI PER DANNI INDIRETTI, INCIDENTALI, SPECIALI, CONSEQUENZIALI, PUNITIVI O ESEMPLARI.

Responsabilità massima:
NELLA MISURA MASSIMA CONSENTITA DALLA LEGGE, LA RESPONSABILITÀ AGGREGATA DI VWS NON SUPERERÀ CENTO PESOS MESSICANI (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Legge applicabile",
          content: `Questi Termini e Condizioni e qualsiasi controversia o reclamo derivante da essi o ad essi correlato, il loro oggetto o la loro formazione (incluse controversie o reclami non contrattuali), saranno regolati e interpretati in conformità con le leggi degli Stati Uniti Messicani (Messico), senza riguardo alle sue disposizioni sui conflitti di leggi.

Legge applicabile:
Le seguenti leggi e regolamenti messicani si applicano a questi Termini e all'uso del Sito Web:
• Codice Civile Federale
• Codice di Commercio Federale
• Legge Federale sulla Protezione dei Consumatori
• Legge Federale sulla Protezione dei Dati Personali (LFPDPPP)

Utenti internazionali:
Se accedi al Sito Web dall'esterno del Messico, lo fai a tuo rischio e sei responsabile del rispetto delle leggi locali.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Risoluzione delle controversie",
          content: `Qualsiasi controversia, disputa o reclamo derivante da questi Termini o ad essi correlato, o alla loro violazione, risoluzione o validità, sarà risolta in conformità con le seguenti disposizioni:

Negoziazione:
Prima di avviare qualsiasi procedura formale di risoluzione delle controversie, le parti concordano di tentare in buona fede di risolvere qualsiasi controversia attraverso la negoziazione diretta.

Mediazione:
Se le negoziazioni non riescono a risolvere la controversia entro trenta (30) giorni di calendario, ciascuna parte può richiedere la mediazione.

Giurisdizione e foro:
Qualsiasi azione legale o procedimento sarà avviato esclusivamente presso i tribunali federali o locali competenti situati a Città del Messico (Ciudad de México), Messico.

Rinuncia all'azione collettiva:
Accetti che qualsiasi reclamo sarà presentato nella tua capacità individuale e non come querelante o membro di qualsiasi presunta azione collettiva o rappresentativa.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Modifiche ai termini",
          content: `Von Wobeser y Sierra, S.C. si riserva il diritto, a sua esclusiva discrezione, di modificare, emendare o aggiornare questi Termini e Condizioni in qualsiasi momento senza preavviso.

Come vengono comunicati i cambiamenti:
• I cambiamenti materiali saranno indicati aggiornando la data "Ultimo aggiornamento" in cima a questa pagina
• Modifiche significative possono essere annunciate tramite un avviso sulla homepage del Sito Web

Le tue responsabilità:
È tua responsabilità rivedere periodicamente questi Termini per rimanere informato sugli aggiornamenti.

Effetto dell'uso continuato:
Il tuo uso continuato del Sito Web dopo la pubblicazione dei Termini rivisti significa che accetti e concordi con le modifiche. Se non accetti i nuovi Termini, devi smettere di utilizzare il Sito Web.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Contatto",
          content: `Se hai domande, dubbi o commenti riguardo a questi Termini e Condizioni o al Sito Web, contattaci:

Von Wobeser y Sierra, S.C.

Indirizzo postale:
Torre SOMA Chapultepec, 18° piano
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Città del Messico, Messico

Telefono: +52 55 5258 1000
E-mail: info@vonwobeser.com
Sito web: www.vonwobeser.com

Orari di ufficio:
Da lunedì a venerdì: 9:00 - 18:00 (ora di Città del Messico)
Escluse le festività federali messicane`
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
    en: "For inquiries about these terms and conditions:",
    es: "Para consultas sobre estos términos y condiciones:",
    de: "Bei Fragen zu diesen Nutzungsbedingungen:",
    zh: "如对这些条款有疑问：",
    ko: "이 약관에 관한 문의:",
    ja: "これらの規約に関するお問い合わせ：",
    ar: "للاستفسارات حول هذه الشروط والأحكام:",
    ru: "По вопросам об этих условиях:",
    fr: "Pour toute question sur ces conditions:",
    it: "Per domande su questi termini:"
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-terms">
      <SEOHead page="terms" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-terms-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-4">
              <Scale className="w-12 h-12 text-white/90" />
            </div>
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-terms-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto mb-4"
              data-testid="text-terms-subtitle"
            >
              {t.subtitle}
            </p>
            <p 
              className="text-sm text-white/70"
              data-testid="text-terms-updated"
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
                data-testid={`section-terms-${section.id}`}
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
                <Scale className="w-10 h-10 text-primary mx-auto mb-4" />
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {contactText[displayLanguage as SupportedLanguage] || contactText.en}
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                  <a 
                    href="mailto:info@vonwobeser.com"
                    className="flex items-center gap-2 text-primary hover:underline"
                    data-testid="link-terms-email"
                  >
                    <Mail className="w-4 h-4" />
                    info@vonwobeser.com
                  </a>
                  <span className="hidden sm:inline text-gray-400">|</span>
                  <a 
                    href="tel:+525552581000"
                    className="flex items-center gap-2 text-primary hover:underline"
                    data-testid="link-terms-phone"
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
