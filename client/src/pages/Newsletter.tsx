import { motion } from "framer-motion";
import { Mail, Send, Loader2, CheckCircle, Bell, FileText, Calendar, Briefcase, Archive, ExternalLink } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsletterFormData {
  email: string;
  firstName?: string;
  lastName?: string;
}

const getNewsletterFormSchema = (language: "es" | "en") => {
  const messages = {
    en: {
      emailRequired: "Email is required",
      emailInvalid: "Please enter a valid email address",
    },
    es: {
      emailRequired: "El correo electrónico es requerido",
      emailInvalid: "Por favor ingrese una dirección de correo válida",
    },
  };

  const t = messages[language];

  return z.object({
    email: z.string().min(1, t.emailRequired).email(t.emailInvalid),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  });
};

export default function Newsletter() {
  const { language, displayLanguage } = useLanguage();
  const { toast } = useToast();

  const formSchema = getNewsletterFormSchema(displayLanguage);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  const newsletterMutation = useMutation({
    mutationFn: async (data: NewsletterFormData) => {
      const response = await apiRequest("POST", "/api/newsletter", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: language === "es" ? "¡Suscripción exitosa!" : "Successfully subscribed!",
        description: language === "es" 
          ? "Gracias por suscribirse a nuestro boletín." 
          : "Thank you for subscribing to our newsletter.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: language === "es" ? "Error" : "Error",
        description: language === "es" 
          ? "No se pudo completar la suscripción. Por favor intente de nuevo." 
          : "Failed to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NewsletterFormData) => {
    newsletterMutation.mutate(data);
  };

  const content = {
    en: {
      title: "Newsletter",
      subtitle: "Stay informed with the latest legal insights and firm updates",
      archivesTitle: "Past Newsletters",
      archivesSubtitle: "Access our previous editions and stay updated on our legal coverage.",
      archiveItem1Title: "Q4 2024 Legal Update",
      archiveItem1Date: "December 2024",
      archiveItem1Description: "Year-end review of significant legal developments in Mexico and key regulatory changes.",
      archiveItem2Title: "Q3 2024 Legal Update",
      archiveItem2Date: "September 2024",
      archiveItem2Description: "Analysis of tax reforms and corporate law amendments affecting businesses in Mexico.",
      archiveItem3Title: "Q2 2024 Legal Update",
      archiveItem3Date: "June 2024",
      archiveItem3Description: "Overview of energy sector regulations and environmental compliance requirements.",
      viewArchive: "View Newsletter",
      comingSoon: "Full archive coming soon",
      formTitle: "Subscribe to Our Newsletter",
      formSubtitle: "Join our mailing list to receive exclusive legal updates, industry insights, and firm news directly to your inbox.",
      emailLabel: "Email Address",
      emailPlaceholder: "Enter your email address",
      firstNameLabel: "First Name (optional)",
      firstNamePlaceholder: "Enter your first name",
      lastNameLabel: "Last Name (optional)",
      lastNamePlaceholder: "Enter your last name",
      submit: "Subscribe",
      submitting: "Subscribing...",
      whatYouReceive: "What You'll Receive",
      benefit1Title: "Legal Updates",
      benefit1Description: "Stay current with important changes in Mexican law and regulations that may affect your business.",
      benefit2Title: "Industry Insights",
      benefit2Description: "In-depth analysis and commentary on legal developments across key sectors.",
      benefit3Title: "Event Invitations",
      benefit3Description: "Exclusive invitations to webinars, seminars, and networking events hosted by our firm.",
      benefit4Title: "Firm News",
      benefit4Description: "Learn about our latest achievements, new team members, and community involvement.",
      privacyNote: "We respect your privacy. Your information will never be shared with third parties. You can unsubscribe at any time.",
      frequency: "Newsletter Frequency",
      frequencyDescription: "Our newsletter is sent monthly, with occasional special editions for urgent legal developments.",
    },
    es: {
      title: "Boletines",
      subtitle: "Manténgase informado con los últimos insights legales y actualizaciones de la firma",
      archivesTitle: "Boletines Anteriores",
      archivesSubtitle: "Acceda a nuestras ediciones anteriores y manténgase informado sobre nuestra cobertura legal.",
      archiveItem1Title: "Actualización Legal Q4 2024",
      archiveItem1Date: "Diciembre 2024",
      archiveItem1Description: "Revisión de fin de año de los desarrollos legales significativos en México y cambios regulatorios clave.",
      archiveItem2Title: "Actualización Legal Q3 2024",
      archiveItem2Date: "Septiembre 2024",
      archiveItem2Description: "Análisis de reformas fiscales y enmiendas de derecho corporativo que afectan a empresas en México.",
      archiveItem3Title: "Actualización Legal Q2 2024",
      archiveItem3Date: "Junio 2024",
      archiveItem3Description: "Visión general de regulaciones del sector energético y requisitos de cumplimiento ambiental.",
      viewArchive: "Ver Boletín",
      comingSoon: "Archivo completo próximamente",
      formTitle: "Suscríbase a Nuestro Boletín",
      formSubtitle: "Únase a nuestra lista de correo para recibir actualizaciones legales exclusivas, insights de la industria y noticias de la firma directamente en su bandeja de entrada.",
      emailLabel: "Correo Electrónico",
      emailPlaceholder: "Ingrese su correo electrónico",
      firstNameLabel: "Nombre (opcional)",
      firstNamePlaceholder: "Ingrese su nombre",
      lastNameLabel: "Apellido (opcional)",
      lastNamePlaceholder: "Ingrese su apellido",
      submit: "Suscribirse",
      submitting: "Suscribiendo...",
      whatYouReceive: "Lo Que Recibirá",
      benefit1Title: "Actualizaciones Legales",
      benefit1Description: "Manténgase al día con cambios importantes en la ley y regulaciones mexicanas que pueden afectar su negocio.",
      benefit2Title: "Insights de la Industria",
      benefit2Description: "Análisis profundo y comentarios sobre desarrollos legales en sectores clave.",
      benefit3Title: "Invitaciones a Eventos",
      benefit3Description: "Invitaciones exclusivas a webinars, seminarios y eventos de networking organizados por nuestra firma.",
      benefit4Title: "Noticias de la Firma",
      benefit4Description: "Conozca nuestros últimos logros, nuevos miembros del equipo e involucramiento comunitario.",
      privacyNote: "Respetamos su privacidad. Su información nunca será compartida con terceros. Puede darse de baja en cualquier momento.",
      frequency: "Frecuencia del Boletín",
      frequencyDescription: "Nuestro boletín se envía mensualmente, con ediciones especiales ocasionales para desarrollos legales urgentes.",
    },
  };

  const t = content[displayLanguage];

  const benefits = [
    {
      icon: FileText,
      title: t.benefit1Title,
      description: t.benefit1Description,
    },
    {
      icon: Briefcase,
      title: t.benefit2Title,
      description: t.benefit2Description,
    },
    {
      icon: Calendar,
      title: t.benefit3Title,
      description: t.benefit3Description,
    },
    {
      icon: Bell,
      title: t.benefit4Title,
      description: t.benefit4Description,
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" data-testid="page-newsletter">
      <SEOHead page="newsletter" language={language} />
      <Header />
      
      <section className="pt-32 pb-12 bg-primary" data-testid="section-newsletter-hero">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 
              className="text-4xl md:text-5xl font-heading font-light text-white mb-4"
              data-testid="text-newsletter-title"
            >
              {t.title}
            </h1>
            <p 
              className="text-lg text-white/90 max-w-2xl mx-auto"
              data-testid="text-newsletter-subtitle"
            >
              {t.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main id="main-content" className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              data-testid="section-newsletter-form"
            >
              <Card className="rounded-md border border-gray-200 dark:border-gray-700">
                <CardContent className="p-8">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <h2 
                        className="text-2xl font-heading font-light text-[#AC162C] dark:text-white"
                        data-testid="text-form-title"
                      >
                        {t.formTitle}
                      </h2>
                    </div>
                    <p 
                      className="text-gray-600 dark:text-gray-400"
                      data-testid="text-form-subtitle"
                    >
                      {t.formSubtitle}
                    </p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-newsletter">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-firstname">{t.firstNameLabel}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.firstNamePlaceholder} 
                                  {...field} 
                                  data-testid="input-firstname"
                                />
                              </FormControl>
                              <FormMessage data-testid="error-firstname" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel data-testid="label-lastname">{t.lastNameLabel}</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder={t.lastNamePlaceholder} 
                                  {...field} 
                                  data-testid="input-lastname"
                                />
                              </FormControl>
                              <FormMessage data-testid="error-lastname" />
                            </FormItem>
                          )}
                        />
                      </div>

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

                      <Button 
                        type="submit" 
                        className="w-full rounded-md bg-[#AC162C] hover:bg-[#841A1A]"
                        disabled={newsletterMutation.isPending}
                        data-testid="button-subscribe"
                      >
                        {newsletterMutation.isPending ? (
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

                      <p 
                        className="text-sm text-gray-500 dark:text-gray-400 text-center"
                        data-testid="text-privacy-note"
                      >
                        {t.privacyNote}
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8"
              >
                <Card className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" data-testid="card-frequency">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 
                        className="text-lg font-heading font-light text-gray-800 dark:text-white"
                        data-testid="text-frequency-title"
                      >
                        {t.frequency}
                      </h3>
                    </div>
                    <p 
                      className="text-sm text-gray-600 dark:text-gray-400"
                      data-testid="text-frequency-description"
                    >
                      {t.frequencyDescription}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <h2 
                className="text-2xl font-heading font-light text-[#AC162C] dark:text-white mb-6"
                data-testid="text-benefits-title"
              >
                {t.whatYouReceive}
              </h2>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  >
                    <Card 
                      className="rounded-md border border-gray-200 dark:border-gray-700"
                      data-testid={`card-benefit-${index}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <benefit.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 
                              className="font-semibold text-gray-800 dark:text-white mb-1"
                              data-testid={`text-benefit-title-${index}`}
                            >
                              {benefit.title}
                            </h3>
                            <p 
                              className="text-sm text-gray-600 dark:text-gray-400"
                              data-testid={`text-benefit-description-${index}`}
                            >
                              {benefit.description}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16"
            data-testid="section-newsletter-archives"
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Archive className="w-8 h-8 text-primary" />
                <h2 
                  className="text-2xl font-heading font-light text-[#AC162C] dark:text-white"
                  data-testid="text-archives-title"
                >
                  {t.archivesTitle}
                </h2>
              </div>
              <p 
                className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                data-testid="text-archives-subtitle"
              >
                {t.archivesSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: t.archiveItem1Title, date: t.archiveItem1Date, description: t.archiveItem1Description },
                { title: t.archiveItem2Title, date: t.archiveItem2Date, description: t.archiveItem2Description },
                { title: t.archiveItem3Title, date: t.archiveItem3Date, description: t.archiveItem3Description },
              ].map((archive, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                >
                  <Card 
                    className="rounded-md border border-gray-200 dark:border-gray-700 h-full"
                    data-testid={`card-archive-${index}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-primary" />
                        <span 
                          className="text-sm text-primary font-medium"
                          data-testid={`text-archive-date-${index}`}
                        >
                          {archive.date}
                        </span>
                      </div>
                      <h3 
                        className="font-semibold text-gray-800 dark:text-white mb-2"
                        data-testid={`text-archive-title-${index}`}
                      >
                        {archive.title}
                      </h3>
                      <p 
                        className="text-sm text-gray-600 dark:text-gray-400 mb-4"
                        data-testid={`text-archive-description-${index}`}
                      >
                        {archive.description}
                      </p>
                      <button 
                        className="inline-flex items-center gap-2 text-sm text-primary hover:text-[#841A1A] transition-colors cursor-not-allowed opacity-50"
                        disabled
                        data-testid={`button-archive-view-${index}`}
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t.viewArchive}
                      </button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <p 
              className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8"
              data-testid="text-archives-coming-soon"
            >
              {t.comingSoon}
            </p>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
