import { motion } from "framer-motion";
import { FileText, Scale, Globe, AlertTriangle, Users, Shield, Gavel, BookOpen, Bell, Phone, Mail, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Terms() {
  const { language, displayLanguage } = useLanguage();

  const content = {
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
El nombre VWS, el logotipo y todos los nombres, logotipos, nombres de productos y servicios, diseños y eslóganes relacionados son marcas registradas de Von Wobeser y Sierra, S.C. o sus afiliados. No puede usar dichas marcas sin el permiso previo por escrito de VWS. Todos los demás nombres, logotipos, nombres de productos y servicios, diseños y eslóganes en este Sitio Web son marcas registradas de sus respectivos propietarios.

Licencia Limitada:
Sujeto a estos Términos, VWS le otorga una licencia limitada, no exclusiva, intransferible y revocable para acceder y usar el Sitio Web y su Contenido únicamente para su uso personal y no comercial. Esta licencia no incluye:
• Cualquier reventa o uso comercial del Sitio Web o su Contenido
• Cualquier uso derivado del Sitio Web o su Contenido
• Cualquier descarga o copia de información de cuenta para el beneficio de otro
• Cualquier uso de minería de datos, robots o herramientas similares de recopilación y extracción de datos

Infracción de Derechos de Autor:
Si cree que algún Contenido del Sitio Web infringe sus derechos de autor, comuníquese con nosotros en info@vonwobeser.com con:
• Una descripción del trabajo con derechos de autor que afirma ha sido infringido
• Una descripción de dónde se encuentra el material en el Sitio Web
• Su información de contacto
• Una declaración de que tiene una creencia de buena fe de que el uso no está autorizado
• Una declaración, bajo pena de perjurio, de que la información es precisa y que usted es el propietario de los derechos de autor o está autorizado para actuar en nombre del propietario`
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

Cada situación legal es única y depende de hechos específicos. El resultado de cualquier asunto legal depende de muchos factores, incluyendo los hechos y circunstancias específicos involucrados, la ley aplicable y la jurisdicción en la que surge el asunto.

IMPORTANTE: No envíe información confidencial o sensible a VWS a través de este Sitio Web o por correo electrónico hasta que haya recibido confirmación por escrito de que se ha establecido una relación abogado-cliente. Cualquier información que nos envíe antes de dicha confirmación no será tratada como privilegiada o confidencial.

Si requiere asesoría legal:
Le recomendamos encarecidamente que consulte con un abogado calificado que pueda evaluar su situación específica y proporcionar orientación legal personalizada. Para contratar a VWS para servicios legales, comuníquese con nosotros directamente para programar una consulta y establecer formalmente una relación abogado-cliente.`
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

Hasta dicho compromiso formal:
• No existe privilegio abogado-cliente entre usted y VWS
• No se aplica ningún deber de confidencialidad a las comunicaciones
• VWS no tiene obligación de proporcionar asesoría legal o representación
• VWS puede representar a partes cuyos intereses sean adversos a los suyos
• La información que proporcione puede no ser tratada como confidencial

Comunicaciones:
Cualquier comunicación enviada a VWS a través de este Sitio Web, correo electrónico u otros medios antes del establecimiento de una relación abogado-cliente:
• No será tratada como privilegiada o confidencial
• Puede ser divulgada o utilizada por VWS según sea necesario
• No impide que VWS represente a otras partes con intereses adversos
• No crea ningún deber u obligación por parte de VWS

Clientes Potenciales:
Si está considerando contratar a VWS para representación legal, comuníquese con nosotros directamente por teléfono al +52 55 5258 1000 para discutir su asunto y el proceso para establecer formalmente una relación abogado-cliente.`
        },
        {
          id: "limitation-liability",
          icon: Shield,
          title: "6. Limitación de Responsabilidad",
          content: `EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE:

Descargo de Garantías:
EL SITIO WEB Y TODO EL CONTENIDO SE PROPORCIONAN "TAL CUAL" Y "SEGÚN DISPONIBILIDAD" SIN GARANTÍA DE NINGÚN TIPO, YA SEA EXPRESA, IMPLÍCITA, LEGAL O DE OTRO TIPO. VWS RECHAZA ESPECÍFICAMENTE TODAS LAS GARANTÍAS IMPLÍCITAS DE COMERCIABILIDAD, IDONEIDAD PARA UN PROPÓSITO PARTICULAR, TÍTULO Y NO INFRACCIÓN.

VWS no garantiza que:
• El Sitio Web estará disponible, será ininterrumpido, oportuno, seguro o libre de errores
• Los resultados que puedan obtenerse del uso del Sitio Web serán precisos o confiables
• La calidad de cualquier información o Contenido obtenido a través del Sitio Web cumplirá con sus expectativas
• Cualquier error en el Sitio Web será corregido

Limitación de Responsabilidad:
EN NINGÚN CASO VON WOBESER Y SIERRA, S.C., SUS SOCIOS, ABOGADOS, EMPLEADOS, AFILIADOS, AGENTES O LICENCIANTES SERÁN RESPONSABLES POR CUALQUIER DAÑO INDIRECTO, INCIDENTAL, ESPECIAL, CONSECUENTE, PUNITIVO O EJEMPLAR QUE SURJA DE O ESTÉ RELACIONADO CON:
• Su acceso o uso, o la incapacidad de acceder o usar, el Sitio Web
• Cualquier conducta o Contenido de cualquier tercero en el Sitio Web
• Cualquier Contenido obtenido del Sitio Web
• Acceso no autorizado, uso o alteración de sus transmisiones o Contenido
• Dependencia de cualquier información proporcionada en el Sitio Web
• Cualquier asunto legal o decisión tomada basándose en información del Sitio Web

Esta limitación se aplica independientemente de la teoría legal en la que se base el reclamo, si VWS ha sido advertido de la posibilidad de tales daños, e incluso si un remedio establecido aquí se encuentra que ha fallado en su propósito esencial.

Responsabilidad Máxima:
EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, LA RESPONSABILIDAD TOTAL DE VWS QUE SURJA DE O ESTÉ RELACIONADA CON ESTOS TÉRMINOS O EL SITIO WEB NO EXCEDERÁ CIEN PESOS MEXICANOS (MXN $100.00).`
        },
        {
          id: "governing-law",
          icon: Gavel,
          title: "7. Ley Aplicable",
          content: `Estos Términos y Condiciones, y cualquier disputa o reclamo que surja de o en conexión con ellos o su objeto o formación (incluyendo disputas o reclamos no contractuales), serán regidos e interpretados de acuerdo con las leyes de los Estados Unidos Mexicanos (México), sin tener en cuenta sus disposiciones sobre conflictos de leyes.

Ley Aplicable:
Las siguientes leyes y regulaciones mexicanas se aplican a estos Términos y al uso del Sitio Web:
• Código Civil Federal
• Código de Comercio
• Ley Federal de Protección al Consumidor
• Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)
• Ley de Firma Electrónica Avanzada
• Regulaciones aplicables y normas oficiales mexicanas (NOMs)

Usuarios Internacionales:
Si accede al Sitio Web desde fuera de México, lo hace bajo su propio riesgo y es responsable del cumplimiento de las leyes locales. El Sitio Web se opera desde México, y VWS no hace ninguna representación de que el Contenido sea apropiado o esté disponible para su uso en otras ubicaciones.

Nada en estos Términos se interpretará para:
• Someter a VWS a la jurisdicción de cualquier tribunal distinto al especificado aquí
• Renunciar a cualquier inmunidad o privilegio disponible para VWS bajo la ley aplicable
• Crear cualquier derecho en cualquier tercero

Cumplimiento:
Usted acepta cumplir con todas las leyes, estatutos, ordenanzas y regulaciones aplicables con respecto a su uso del Sitio Web y cualquier actividad realizada a través de o en conexión con el Sitio Web.`
        },
        {
          id: "dispute-resolution",
          icon: Scale,
          title: "8. Resolución de Controversias",
          content: `Cualquier disputa, controversia o reclamo que surja de o esté relacionado con estos Términos o el incumplimiento, terminación o validez de los mismos se resolverá de acuerdo con las siguientes disposiciones:

Negociación:
Antes de iniciar cualquier procedimiento formal de resolución de disputas, las partes acuerdan intentar de buena fe resolver cualquier disputa a través de negociación directa. Cualquiera de las partes puede iniciar negociaciones enviando notificación por escrito a la otra parte describiendo la disputa y proponiendo una resolución.

Mediación:
Si las negociaciones no logran resolver la disputa dentro de treinta (30) días calendario, cualquiera de las partes puede solicitar mediación ante un mediador certificado por el Centro de Justicia Alternativa del Poder Judicial de la Ciudad de México.

Jurisdicción y Competencia:
Cualquier acción legal o procedimiento que surja de o esté relacionado con estos Términos o el Sitio Web se presentará exclusivamente ante los tribunales federales o locales competentes ubicados en la Ciudad de México, México.

Al usar el Sitio Web, usted irrevocable e incondicionalmente:
• Se somete a la jurisdicción exclusiva de dichos tribunales
• Renuncia a cualquier objeción a la competencia de dichos tribunales
• Renuncia a cualquier reclamo de que dicho foro es inconveniente
• Acepta no iniciar ninguna acción o procedimiento en ninguna otra jurisdicción

Renuncia a Juicio por Jurado:
EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY APLICABLE, CADA PARTE RENUNCIA A CUALQUIER DERECHO A UN JUICIO POR JURADO EN CUALQUIER PROCEDIMIENTO LEGAL QUE SURJA DE O ESTÉ RELACIONADO CON ESTOS TÉRMINOS.

Renuncia a Acciones Colectivas:
Usted acepta que cualquier reclamo se presentará en su capacidad individual y no como demandante o miembro de una clase en cualquier supuesto procedimiento colectivo o representativo.`
        },
        {
          id: "modifications",
          icon: Bell,
          title: "9. Modificaciones a los Términos",
          content: `Von Wobeser y Sierra, S.C. se reserva el derecho, a su sola discreción, de modificar, enmendar o actualizar estos Términos y Condiciones en cualquier momento sin previo aviso.

Cómo se Comunican los Cambios:
• Los cambios materiales se indicarán actualizando la fecha de "Última actualización" en la parte superior de esta página
• Las modificaciones significativas pueden anunciarse mediante un aviso en la página de inicio del Sitio Web
• Para usuarios registrados o suscriptores, podemos enviar notificaciones por correo electrónico sobre cambios importantes

Sus Responsabilidades:
Es su responsabilidad revisar estos Términos periódicamente para mantenerse informado de las actualizaciones. Debe revisar esta página regularmente para asegurarse de estar al tanto de cualquier cambio.

Efecto del Uso Continuado:
Su uso continuado del Sitio Web después de la publicación de los Términos revisados significa que acepta y está de acuerdo con los cambios. Si no está de acuerdo con los nuevos Términos, debe dejar de usar el Sitio Web.

Historial de Versiones:
Mantenemos versiones anteriores de estos Términos para fines de referencia. Puede solicitar acceso a versiones anteriores comunicándose con nosotros en info@vonwobeser.com.

Divisibilidad:
Si alguna disposición de estos Términos es considerada por un tribunal u otro tribunal de jurisdicción competente como inválida, ilegal o inaplicable por cualquier razón, dicha disposición será eliminada o limitada en la medida mínima necesaria, y las disposiciones restantes de estos Términos continuarán en pleno vigor y efecto.

Acuerdo Completo:
Estos Términos, junto con la Política de Privacidad y cualquier otro aviso legal publicado por VWS en el Sitio Web, constituyen el acuerdo completo entre usted y VWS con respecto al uso del Sitio Web y reemplazan todas las comunicaciones anteriores o contemporáneas, ya sean electrónicas, orales o escritas.`
        },
        {
          id: "contact",
          icon: Phone,
          title: "10. Información de Contacto",
          content: `Si tiene alguna pregunta, inquietud o comentario con respecto a estos Términos y Condiciones o el Sitio Web, comuníquese con nosotros a través de los siguientes medios:

Von Wobeser y Sierra, S.C.

Dirección Postal:
Torre SOMA Chapultepec, Piso 18
Campos Elíseos 204, Colonia Polanco
C.P. 11560, Ciudad de México, México

Teléfono:
+52 55 5258 1000

Correo Electrónico:
Consultas Generales: info@vonwobeser.com
Consultas Legales y de Términos: legal@vonwobeser.com

Horario de Atención:
Lunes a viernes: 9:00 AM a 6:00 PM (hora de la Ciudad de México)
Excluyendo días festivos federales de México

Sitio Web:
www.vonwobeser.com

Tiempo de Respuesta:
Nos esforzamos por responder a todas las consultas dentro de cinco (5) días hábiles. Para asuntos urgentes, recomendamos comunicarse con nosotros por teléfono durante el horario de oficina.

Para consultas relacionadas con posible representación legal, comuníquese con nosotros por teléfono para discutir su asunto y el proceso para establecer una relación abogado-cliente formal.`
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
                  {language === "es" 
                    ? "Para consultas sobre estos términos y condiciones:"
                    : "For inquiries about these terms and conditions:"}
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
