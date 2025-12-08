import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, ExternalLink, Linkedin, Building2, Send, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SiteContent, ContactFormData } from "@shared/schema";
import { practiceAreas } from "@shared/schema";

const getContactFormSchema = (language: "es" | "en") => {
  const messages = {
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

  const t = messages[language];

  return z.object({
    fullName: z.string().min(1, t.fullNameRequired),
    email: z.string().min(1, t.emailRequired).email(t.emailInvalid),
    phone: z.string().optional(),
    company: z.string().optional(),
    practiceArea: z.string().optional(),
    message: z.string().min(1, t.messageRequired),
  });
};

export default function Contact() {
  const { language, displayLanguage } = useLanguage();
  const { toast } = useToast();

  const { data: siteContent, isLoading } = useQuery<SiteContent>({
    queryKey: ["/api/site-content"],
  });

  const formSchema = getContactFormSchema(displayLanguage);

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

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await apiRequest("POST", "/api/contact", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "¡Mensaje enviado!" : "Message sent!",
        description: language === "es" 
          ? "Nos pondremos en contacto con usted pronto." 
          : "We will get back to you soon.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo enviar el mensaje. Por favor intente de nuevo." 
          : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  const content = {
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
      germanDesk: "German Desk",
      germanDeskInfo: "Specialized German-speaking legal services for German, Austrian, and Swiss clients doing business in Mexico.",
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
      germanDesk: "German Desk",
      germanDeskInfo: "Servicios legales especializados para clientes alemanes, austriacos y suizos que hacen negocios en México.",
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

  const t = content[displayLanguage];

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.6610687689834!2d-99.19441!3d19.4325!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85d1ff5f5c0c3e1b%3A0x7c0c7c7c7c7c7c7c!2sTorre%20SOMA%20Chapultepec!5e0!3m2!1sen!2smx!4v1700000000000!5m2!1sen!2smx";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-contact">
      <SEOHead page="contact" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-contact-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-contact-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-contact-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-16"
            data-testid="section-contact-form"
          >
            <Card className="rounded-md border border-gray-200 dark:border-gray-700">
              <CardContent className="p-8">
                <div className="mb-8">
                  <h2 
                    className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-2"
                    data-testid="text-form-title"
                  >
                    {t.formTitle}
                  </h2>
                  <p 
                    className="text-gray-600 dark:text-gray-400"
                    data-testid="text-form-subtitle"
                  >
                    {t.formSubtitle}
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-contact">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-fullname">{t.fullName}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t.fullNamePlaceholder} 
                                {...field} 
                                data-testid="input-fullname"
                              />
                            </FormControl>
                            <FormMessage data-testid="error-fullname" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-email">{t.emailLabel}</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder={t.emailPlaceholder} 
                                {...field} 
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage data-testid="error-email" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-phone">{t.phoneLabel}</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel"
                                placeholder={t.phonePlaceholder} 
                                {...field} 
                                data-testid="input-phone"
                              />
                            </FormControl>
                            <FormMessage data-testid="error-phone" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel data-testid="label-company">{t.companyLabel}</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={t.companyPlaceholder} 
                                {...field} 
                                data-testid="input-company"
                              />
                            </FormControl>
                            <FormMessage data-testid="error-company" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="practiceArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-practice-area">{t.practiceAreaLabel}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-practice-area">
                                <SelectValue placeholder={t.practiceAreaPlaceholder} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent data-testid="select-practice-area-content">
                              {practiceAreas.map((area) => (
                                <SelectItem 
                                  key={area.value} 
                                  value={area.value}
                                  data-testid={`option-practice-area-${area.value}`}
                                >
                                  {language === "es" ? area.es : area.en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage data-testid="error-practice-area" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-message">{t.messageLabel}</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder={t.messagePlaceholder} 
                              className="min-h-[120px]"
                              {...field} 
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage data-testid="error-message" />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full md:w-auto rounded-md"
                      disabled={contactMutation.isPending}
                      data-testid="button-submit-contact"
                    >
                      {contactMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t.submitting}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {t.submit}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 
                className="text-2xl font-heading font-light text-gray-800 dark:text-white mb-6"
                data-testid="text-offices-title"
              >
                {t.officesTitle}
              </h2>
              
              <Card className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden" data-testid="card-main-office">
                <div className="aspect-video w-full">
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
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-1" data-testid="text-office-name">
                        {t.mainOffice}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t.building}, {t.floor}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                      <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-office-address">
                        <p>{t.street}</p>
                        <p>{t.colony}</p>
                        <p>{t.city}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                      <a 
                        href={`tel:${t.phone.replace(/\s/g, '')}`}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                        data-testid="link-office-phone"
                      >
                        {t.phone}
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <a 
                        href={`mailto:${t.email}`}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                        data-testid="link-office-email"
                      >
                        {t.email}
                      </a>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-office-hours">
                        <p className="font-medium">{t.hours}</p>
                        <p>{t.hoursDetails}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="w-full rounded-md"
                    asChild
                    data-testid="button-get-directions"
                  >
                    <a 
                      href="https://www.google.com/maps/dir//Torre+SOMA+Chapultepec,+Campos+Elíseos+204,+Polanco,+11560+Ciudad+de+México,+CDMX,+Mexico"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {t.getDirections}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-8"
            >
              <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" data-testid="card-contact-cta">
                <CardContent className="p-8">
                  <h3 
                    className="text-xl font-heading font-light text-gray-800 dark:text-white mb-4"
                    data-testid="text-contact-cta-title"
                  >
                    {t.contactUs}
                  </h3>
                  <div className="flex flex-col gap-3">
                    <Button 
                      className="w-full rounded-md"
                      asChild
                      data-testid="button-send-email"
                    >
                      <a href={`mailto:${t.email}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        {t.sendEmail}
                      </a>
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full rounded-md"
                      asChild
                      data-testid="button-call-us"
                    >
                      <a href={`tel:${t.phone.replace(/\s/g, '')}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        {t.callUs}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-german-desk">
                <CardContent className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">🇩🇪</span>
                    </div>
                    <h3 
                      className="text-xl font-heading font-light text-gray-800 dark:text-white"
                      data-testid="text-german-desk-title"
                    >
                      {t.germanDesk}
                    </h3>
                  </div>
                  <p 
                    className="text-gray-600 dark:text-gray-400 text-sm"
                    data-testid="text-german-desk-info"
                  >
                    {t.germanDeskInfo}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-md border border-gray-200 dark:border-gray-700" data-testid="card-connect">
                <CardContent className="p-8">
                  <h3 
                    className="text-xl font-heading font-light text-gray-800 dark:text-white mb-2"
                    data-testid="text-connect-title"
                  >
                    {t.connectTitle}
                  </h3>
                  <p 
                    className="text-gray-600 dark:text-gray-400 text-sm mb-6"
                    data-testid="text-connect-subtitle"
                  >
                    {t.connectSubtitle}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="outline"
                      className="w-full rounded-md justify-start"
                      asChild
                      data-testid="button-linkedin"
                    >
                      <a 
                        href="https://www.linkedin.com/company/von-wobeser-y-sierra/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="w-4 h-4 mr-3" />
                        {t.linkedinText}
                      </a>
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full rounded-md justify-start"
                      asChild
                      data-testid="button-website"
                    >
                      <a 
                        href="https://www.vonwobeser.com"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-3" />
                        {t.websiteText}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
