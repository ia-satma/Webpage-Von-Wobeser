import { MapPin, Phone, Mail, Clock, ExternalLink, Linkedin, Send, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PageHero,
  Section,
  SectionTitle,
  FirmLabel,
  FirmError,
  FirmInput,
  FirmTextarea,
  FirmSelect,
  FirmSubmit,
} from "@/components/firm";
import type { ContactFormData, LanguageCode } from "@shared/schema";
import { practiceAreas } from "@shared/schema";

const validationMessages: Record<LanguageCode, {
  fullNameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  messageRequired: string;
}> = {
  en: {
    fullNameRequired: "Full name is required",
    emailRequired: "Email is required",
    emailInvalid: "Please enter a valid email address",
    messageRequired: "Message is required",
  },
  es: {
    fullNameRequired: "El nombre completo es requerido",
    emailRequired: "El correo electrónico es requerido",
    emailInvalid: "Por favor ingrese una dirección de correo válida",
    messageRequired: "El mensaje es requerido",
  },
};

const getContactFormSchema = (language: LanguageCode) => {
  const t = validationMessages[language] || validationMessages.en;

  return z.object({
    fullName: z.string().min(1, t.fullNameRequired),
    email: z.string().min(1, t.emailRequired).email(t.emailInvalid),
    phone: z.string().optional(),
    company: z.string().optional(),
    practiceArea: z.string().optional(),
    message: z.string().min(1, t.messageRequired),
  });
};

const toastMessages: Record<LanguageCode, {
  successTitle: string;
  successDescription: string;
  errorTitle: string;
  errorDescription: string;
}> = {
  en: {
    successTitle: "Message sent!",
    successDescription: "We will get back to you soon.",
    errorTitle: "Error",
    errorDescription: "Failed to send message. Please try again.",
  },
  es: {
    successTitle: "¡Mensaje enviado!",
    successDescription: "Nos pondremos en contacto con usted pronto.",
    errorTitle: "Error",
    errorDescription: "No se pudo enviar el mensaje. Por favor intente de nuevo.",
  },
};

export default function Contact() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const formSchema = getContactFormSchema(language);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      company: "",
      practiceArea: "",
      message: "",
    },
  });

  const toastT = toastMessages[language] || toastMessages.en;

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: toastT.successTitle,
        description: toastT.successDescription,
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: toastT.errorTitle,
        description: toastT.errorDescription,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  const content: Record<LanguageCode, {
    title: string;
    subtitle: string;
    officesTitle: string;
    mainOffice: string;
    building: string;
    floor: string;
    street: string;
    colony: string;
    city: string;
    phone: string;
    fax: string;
    email: string;
    hours: string;
    hoursDetails: string;
    getDirections: string;
    connectTitle: string;
    connectSubtitle: string;
    linkedinText: string;
    websiteText: string;
    contactUs: string;
    sendEmail: string;
    callUs: string;
    formTitle: string;
    formSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    practiceAreaLabel: string;
    practiceAreaPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
  }> = {
    en: {
      title: "Contact Us",
      subtitle: "Get in touch with our team of legal experts",
      officesTitle: "Our Offices",
      mainOffice: "Main Office - Mexico City",
      building: "Torre SOMA Chapultepec",
      floor: "Floor 18",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Mexico City, Mexico",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Office Hours",
      hoursDetails: "Monday - Friday: 9:00 AM - 7:00 PM (CST)",
      getDirections: "Get Directions",
      connectTitle: "Connect With Us",
      connectSubtitle: "Follow us on social media and stay updated on the latest legal developments",
      linkedinText: "Follow us on LinkedIn",
      websiteText: "Visit our website",
      contactUs: "Contact Us",
      sendEmail: "Send Email",
      callUs: "Call Us",
      formTitle: "Send Us a Message",
      formSubtitle: "Fill out the form below and we will get back to you as soon as possible.",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      emailLabel: "Email",
      emailPlaceholder: "Enter your email address",
      phoneLabel: "Phone (optional)",
      phonePlaceholder: "Enter your phone number",
      companyLabel: "Company/Organization (optional)",
      companyPlaceholder: "Enter your company name",
      practiceAreaLabel: "Practice Area of Interest (optional)",
      practiceAreaPlaceholder: "Select a practice area",
      messageLabel: "Message",
      messagePlaceholder: "How can we help you?",
      submit: "Send Message",
      submitting: "Sending...",
    },
    es: {
      title: "Contáctenos",
      subtitle: "Póngase en contacto con nuestro equipo de expertos legales",
      officesTitle: "Nuestras Oficinas",
      mainOffice: "Oficina Principal - Ciudad de México",
      building: "Torre SOMA Chapultepec",
      floor: "Piso 18",
      street: "Campos Elíseos 204",
      colony: "Colonia Polanco",
      city: "C.P. 11560, Ciudad de México, México",
      phone: "+52 55 5258 1000",
      fax: "+52 55 5258 1098",
      email: "info@vonwobeser.com",
      hours: "Horario de Oficina",
      hoursDetails: "Lunes - Viernes: 9:00 AM - 7:00 PM (CST)",
      getDirections: "Cómo Llegar",
      connectTitle: "Conéctese Con Nosotros",
      connectSubtitle: "Síganos en redes sociales y manténgase informado sobre los últimos desarrollos legales",
      linkedinText: "Síguenos en LinkedIn",
      websiteText: "Visite nuestro sitio web",
      contactUs: "Contáctenos",
      sendEmail: "Enviar Email",
      callUs: "Llámenos",
      formTitle: "Envíenos un Mensaje",
      formSubtitle: "Complete el formulario a continuación y nos pondremos en contacto con usted lo antes posible.",
      fullName: "Nombre Completo",
      fullNamePlaceholder: "Ingrese su nombre completo",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ingrese su correo electrónico",
      phoneLabel: "Teléfono (opcional)",
      phonePlaceholder: "Ingrese su número de teléfono",
      companyLabel: "Empresa/Organización (opcional)",
      companyPlaceholder: "Ingrese el nombre de su empresa",
      practiceAreaLabel: "Área de Práctica de Interés (opcional)",
      practiceAreaPlaceholder: "Seleccione un área de práctica",
      messageLabel: "Mensaje",
      messagePlaceholder: "¿Cómo podemos ayudarle?",
      submit: "Enviar Mensaje",
      submitting: "Enviando...",
    },
  };

  const t = content[language] || content.en;

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6610687689834!2d-99.19441!3d19.4325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff5f5c0c3e1b%3A0x7c0c7c7c7c7c7c7c!2sTorre%20SOMA%20Chapultepec!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

  return (
    <div data-testid="page-contact" className="vw-old">
      <SEOHead page="contact" language={language} />

      <PageHero
        eyebrow="Von Wobeser y Sierra"
        title={t.title}
        subtitle={t.subtitle}
        data-testid="section-contact-hero"
      />

      {/* Intro: correo y teléfono directos (réplica del contacto viejo) */}
      <Section tone="white" size="compact" data-testid="section-contact-intro">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="font-sans text-lg leading-relaxed text-vw-gray">
              {t.formSubtitle}
            </p>
            <div className="mt-6 space-y-3">
              <a
                href={`mailto:${t.email}`}
                className="flex items-center gap-3 font-sans text-vw-black transition-colors hover:text-vw-red"
                data-testid="link-intro-email"
              >
                <Mail className="h-5 w-5 text-vw-red" aria-hidden="true" />
                {t.email}
              </a>
              <a
                href={`tel:${t.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 font-sans text-vw-black transition-colors hover:text-vw-red"
                data-testid="link-intro-phone"
              >
                <Phone className="h-5 w-5 text-vw-red" aria-hidden="true" />
                {t.phone}
              </a>
            </div>
          </div>
          <div className="border-l-0 md:border-l md:border-vw-graylight md:pl-10">
            <div className="vw-label mb-3 text-[11px] text-vw-gray">
              {t.mainOffice}
            </div>
            <div className="flex items-start gap-3 font-sans text-vw-gray">
              <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
              <div>
                <p>{t.building}, {t.floor}</p>
                <p>{t.street}</p>
                <p>{t.colony}</p>
                <p>{t.city}</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 font-sans text-vw-gray">
              <Clock className="mt-1 h-5 w-5 flex-shrink-0 text-vw-red" aria-hidden="true" />
              <div>
                <p className="text-vw-black">{t.hours}</p>
                <p>{t.hoursDetails}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Formulario funcional */}
      <Section tone="gray" data-testid="section-contact-form">
        <SectionTitle data-testid="text-form-title">{t.formTitle}</SectionTitle>
        <p className="mb-8 max-w-2xl font-sans text-vw-gray" data-testid="text-form-subtitle">
          {t.formSubtitle}
        </p>

        {/* TODO(W7): reCAPTCHA v3 — añadir token al submit cuando haya keys. */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-3xl space-y-6"
          data-testid="form-contact"
          noValidate
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <FirmLabel htmlFor="contact-fullName">{t.fullName}</FirmLabel>
              <FirmInput
                id="contact-fullName"
                placeholder={t.fullNamePlaceholder}
                invalid={!!form.formState.errors.fullName}
                data-testid="input-fullname"
                {...form.register("fullName")}
              />
              <FirmError message={form.formState.errors.fullName?.message} />
            </div>
            <div>
              <FirmLabel htmlFor="contact-email">{t.emailLabel}</FirmLabel>
              <FirmInput
                id="contact-email"
                type="email"
                placeholder={t.emailPlaceholder}
                invalid={!!form.formState.errors.email}
                data-testid="input-email"
                {...form.register("email")}
              />
              <FirmError message={form.formState.errors.email?.message} />
            </div>
            <div>
              <FirmLabel htmlFor="contact-phone">{t.phoneLabel}</FirmLabel>
              <FirmInput
                id="contact-phone"
                type="tel"
                placeholder={t.phonePlaceholder}
                data-testid="input-phone"
                {...form.register("phone")}
              />
            </div>
            <div>
              <FirmLabel htmlFor="contact-company">{t.companyLabel}</FirmLabel>
              <FirmInput
                id="contact-company"
                placeholder={t.companyPlaceholder}
                data-testid="input-company"
                {...form.register("company")}
              />
            </div>
          </div>

          <div>
            <FirmLabel htmlFor="contact-practiceArea">{t.practiceAreaLabel}</FirmLabel>
            <FirmSelect
              id="contact-practiceArea"
              data-testid="select-practice-area"
              defaultValue=""
              {...form.register("practiceArea")}
            >
              <option value="" disabled>
                {t.practiceAreaPlaceholder}
              </option>
              {practiceAreas.map((area) => (
                <option key={area.value} value={area.value}>
                  {language === "es" ? area.es : area.en}
                </option>
              ))}
            </FirmSelect>
          </div>

          <div>
            <FirmLabel htmlFor="contact-message">{t.messageLabel}</FirmLabel>
            <FirmTextarea
              id="contact-message"
              placeholder={t.messagePlaceholder}
              invalid={!!form.formState.errors.message}
              data-testid="textarea-message"
              {...form.register("message")}
            />
            <FirmError message={form.formState.errors.message?.message} />
          </div>

          <FirmSubmit disabled={contactMutation.isPending} data-testid="button-submit-contact">
            {contactMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {t.submitting}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                {t.submit}
              </>
            )}
          </FirmSubmit>
        </form>
      </Section>

      {/* Mapa */}
      <Section tone="white" data-testid="section-contact-map">
        <SectionTitle data-testid="text-offices-title">{t.officesTitle}</SectionTitle>
        <div className="aspect-video w-full overflow-hidden border border-vw-graylight">
          <iframe
            src={googleMapsUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Von Wobeser y Sierra Office Location"
            data-testid="iframe-google-map"
          />
        </div>
        <a
          href="https://www.google.com/maps/dir//Torre+SOMA+Chapultepec,+Campos+El%C3%ADseos+204,+Polanco,+11560+Ciudad+de+M%C3%A9xico,+CDMX,+Mexico"
          target="_blank"
          rel="noopener noreferrer"
          className="vw-label mt-5 inline-flex items-center gap-2 text-xs text-vw-red transition-colors hover:text-vw-black"
          data-testid="button-get-directions"
        >
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {t.getDirections}
        </a>
      </Section>

      {/* Conectar */}
      <Section tone="gray" data-testid="section-contact-connect">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border border-vw-graylight bg-white p-8" data-testid="card-connect">
            <h3 className="mb-2 font-serif text-2xl text-vw-black" data-testid="text-connect-title">
              {t.connectTitle}
            </h3>
            <p className="mb-6 font-sans text-vw-gray" data-testid="text-connect-subtitle">
              {t.connectSubtitle}
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://www.linkedin.com/company/von-wobeser-y-sierra/"
                target="_blank"
                rel="noopener noreferrer"
                className="vw-label inline-flex items-center gap-3 text-xs text-vw-gray transition-colors hover:text-vw-red"
                data-testid="button-linkedin"
              >
                <Linkedin className="h-4 w-4" aria-hidden="true" />
                {t.linkedinText}
              </a>
              <a
                href="https://www.vonwobeser.com"
                target="_blank"
                rel="noopener noreferrer"
                className="vw-label inline-flex items-center gap-3 text-xs text-vw-gray transition-colors hover:text-vw-red"
                data-testid="button-website"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                {t.websiteText}
              </a>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
