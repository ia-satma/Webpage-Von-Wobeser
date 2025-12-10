import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  ArrowLeft, 
  Save, 
  User, 
  Loader2, 
  Briefcase, 
  Mail, 
  Phone, 
  Linkedin, 
  Image, 
  FileText, 
  Settings, 
  ChevronRight,
  Sparkles,
  Globe,
  Award,
  CheckCircle2
} from "lucide-react";
import type { TeamMember } from "@shared/schema";

const translations = {
  en: {
    createTitle: "Create Team Member",
    editTitle: "Edit Team Member",
    createSubtitle: "Add a new lawyer or professional to the firm",
    editSubtitle: "Update lawyer information and biography",
    back: "Back to Team",
    save: "Save Changes",
    saving: "Saving...",
    create: "Create Member",
    creating: "Creating...",
    cancel: "Cancel",
    basicInfo: "Basic Information",
    basicInfoDesc: "Name, position and profile details",
    contactInfo: "Contact",
    contactInfoDesc: "Email, phone and social profiles",
    biography: "Biography",
    biographyDesc: "Professional background in both languages",
    settings: "Settings",
    settingsDesc: "Display options and ordering",
    name: "Full Name",
    nameHint: "As it appears on business cards",
    slug: "URL Identifier",
    slugHint: "Auto-generated from name (e.g., 'maria-garcia')",
    title: "Professional Title",
    titleHint: "E.g., 'Partner - Corporate & M&A'",
    titleEs: "Professional Title (Spanish)",
    role: "Position",
    roleEs: "Position (Spanish)",
    email: "Email Address",
    phone: "Phone Number",
    phoneHint: "Include country code (+52)",
    linkedinUrl: "LinkedIn Profile",
    linkedinHint: "Full URL to LinkedIn profile",
    imageUrl: "Profile Photo URL",
    imageHint: "Square image, minimum 400x400px",
    bio: "Biography (English)",
    bioHint: "Professional background, education, notable cases",
    bioEs: "Biography (Spanish)",
    isPartner: "Partner Status",
    isPartnerDesc: "Mark this person as a Partner of the firm",
    order: "Display Order",
    orderHint: "Lower numbers appear first",
    createSuccess: "Team member created successfully",
    updateSuccess: "Team member updated successfully",
    error: "An error occurred",
    requiredField: "Required",
    loading: "Loading...",
    preview: "Preview",
    noImage: "No image",
    tabs: {
      general: "General",
      contact: "Contact",
      bio: "Biography",
      settings: "Settings"
    },
    roles: {
      partner: "Partner",
      ofCounsel: "Of Counsel",
      counsel: "Counsel",
      seniorAssociate: "Senior Associate",
      associate: "Associate"
    },
    rolesEs: {
      partner: "Socio",
      ofCounsel: "Of Counsel",
      counsel: "Counsel",
      seniorAssociate: "Asociado Senior",
      associate: "Asociado"
    }
  },
  es: {
    createTitle: "Crear Miembro del Equipo",
    editTitle: "Editar Miembro del Equipo",
    createSubtitle: "Agregar un nuevo abogado o profesional al despacho",
    editSubtitle: "Actualizar información y biografía del abogado",
    back: "Volver al Equipo",
    save: "Guardar Cambios",
    saving: "Guardando...",
    create: "Crear Miembro",
    creating: "Creando...",
    cancel: "Cancelar",
    basicInfo: "Información Básica",
    basicInfoDesc: "Nombre, puesto y detalles del perfil",
    contactInfo: "Contacto",
    contactInfoDesc: "Correo, teléfono y redes sociales",
    biography: "Biografía",
    biographyDesc: "Trayectoria profesional en ambos idiomas",
    settings: "Configuración",
    settingsDesc: "Opciones de visualización y orden",
    name: "Nombre Completo",
    nameHint: "Como aparece en tarjetas de presentación",
    slug: "Identificador URL",
    slugHint: "Generado automáticamente del nombre (ej. 'maria-garcia')",
    title: "Título Profesional",
    titleHint: "Ej. 'Socio - Corporativo & Fusiones'",
    titleEs: "Título Profesional (Español)",
    role: "Posición",
    roleEs: "Posición (Español)",
    email: "Correo Electrónico",
    phone: "Número Telefónico",
    phoneHint: "Incluir código de país (+52)",
    linkedinUrl: "Perfil de LinkedIn",
    linkedinHint: "URL completa del perfil de LinkedIn",
    imageUrl: "URL de Foto de Perfil",
    imageHint: "Imagen cuadrada, mínimo 400x400px",
    bio: "Biografía (Inglés)",
    bioHint: "Trayectoria profesional, educación, casos notables",
    bioEs: "Biografía (Español)",
    isPartner: "Estatus de Socio",
    isPartnerDesc: "Marcar a esta persona como Socio del despacho",
    order: "Orden de Visualización",
    orderHint: "Números menores aparecen primero",
    createSuccess: "Miembro del equipo creado exitosamente",
    updateSuccess: "Miembro del equipo actualizado exitosamente",
    error: "Ocurrió un error",
    requiredField: "Requerido",
    loading: "Cargando...",
    preview: "Vista Previa",
    noImage: "Sin imagen",
    tabs: {
      general: "General",
      contact: "Contacto",
      bio: "Biografía",
      settings: "Configuración"
    },
    roles: {
      partner: "Partner",
      ofCounsel: "Of Counsel",
      counsel: "Counsel",
      seniorAssociate: "Senior Associate",
      associate: "Associate"
    },
    rolesEs: {
      partner: "Socio",
      ofCounsel: "Of Counsel",
      counsel: "Counsel",
      seniorAssociate: "Asociado Senior",
      associate: "Asociado"
    }
  },
};

const teamMemberFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  title: z.string().min(1, "Title is required"),
  titleEs: z.string().min(1, "Spanish title is required"),
  role: z.string().min(1, "Role is required"),
  roleEs: z.string().min(1, "Spanish role is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional(),
  bioEs: z.string().optional(),
  isPartner: z.boolean().default(false),
  order: z.coerce.number().min(0).default(0),
});

type TeamMemberFormData = z.infer<typeof teamMemberFormSchema>;

export default function AdminTeamForm() {
  const { language } = useLanguage();
  const { token, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const isEditMode = !!params.id;

  const t = translations[language as keyof typeof translations] || translations.en;

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      title: "",
      titleEs: "",
      role: "",
      roleEs: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      imageUrl: "",
      bio: "",
      bioEs: "",
      isPartner: false,
      order: 0,
    },
  });

  const watchedValues = form.watch();
  const imageUrl = form.watch("imageUrl");
  const name = form.watch("name");

  const { data: member, isLoading: memberLoading, isError: memberError } = useQuery<TeamMember>({
    queryKey: ["/api/admin/team", params.id],
    queryFn: async () => {
      const response = await adminApiRequest("GET", `/api/admin/team/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to load team member");
      }
      return response.json();
    },
    enabled: isEditMode && isAuthenticated && !!token,
    retry: 1,
  });

  useEffect(() => {
    if (memberError) {
      toast({ title: t.error, description: "Could not load team member", variant: "destructive" });
      navigate("/admin/team");
    }
  }, [memberError, navigate, toast, t.error]);

  useEffect(() => {
    if (member) {
      form.reset({
        name: member.name || "",
        slug: member.slug || "",
        title: member.title || "",
        titleEs: member.titleEs || "",
        role: member.role || "",
        roleEs: member.roleEs || "",
        email: member.email || "",
        phone: member.phone || "",
        linkedinUrl: member.linkedinUrl || "",
        imageUrl: member.imageUrl || "",
        bio: member.bio || "",
        bioEs: member.bioEs || "",
        isPartner: member.isPartner || false,
        order: member.order || 0,
      });
    }
  }, [member, form]);

  const handleApiError = async (response: Response) => {
    const errorData = await response.json();
    if (errorData.details && Array.isArray(errorData.details)) {
      errorData.details.forEach((err: { path?: string[]; message?: string }) => {
        if (err.path && err.path.length > 0) {
          const fieldName = err.path[0] as keyof TeamMemberFormData;
          form.setError(fieldName, { type: "server", message: err.message || "Invalid value" });
        }
      });
      throw new Error(t.error);
    }
    throw new Error(errorData.error || "Failed");
  };

  const createMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await adminApiRequest("POST", "/api/admin/team", data);
      if (!response.ok) {
        await handleApiError(response);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.createSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      navigate("/admin/team");
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.error, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await adminApiRequest("PUT", `/api/admin/team/${params.id}`, data);
      if (!response.ok) {
        await handleApiError(response);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t.updateSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      navigate("/admin/team");
    },
    onError: (error: Error) => {
      toast({ title: error.message || t.error, variant: "destructive" });
    },
  });

  const onSubmit = (data: TeamMemberFormData) => {
    const cleanData = {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      linkedinUrl: data.linkedinUrl || null,
      imageUrl: data.imageUrl || null,
      bio: data.bio || null,
      bioEs: data.bioEs || null,
    };

    if (isEditMode) {
      updateMutation.mutate(cleanData as TeamMemberFormData);
    } else {
      createMutation.mutate(cleanData as TeamMemberFormData);
    }
  };

  const generateSlug = () => {
    const name = form.getValues("name");
    if (name) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      form.setValue("slug", slug);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F8F8]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-[#AA1A2E] border-t-transparent rounded-full" />
          <p className="text-[#54565B] font-medium">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isEditMode && memberLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="container mx-auto px-6 py-8 max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-none" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-[400px] w-full rounded-none" />
            </div>
            <div>
              <Skeleton className="h-[300px] w-full rounded-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <div className="bg-white border-b border-[#D9D8D7] sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/team">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-none hover:bg-[#F8F8F8]"
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-5 h-5 text-[#54565B]" />
                </Button>
              </Link>
              
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm">
                <Link href="/admin/dashboard">
                  <span className="text-[#878A8E] hover:text-[#54565B] transition-colors cursor-pointer">
                    Admin
                  </span>
                </Link>
                <ChevronRight className="w-4 h-4 text-[#BBBBBB]" />
                <Link href="/admin/team">
                  <span className="text-[#878A8E] hover:text-[#54565B] transition-colors cursor-pointer">
                    {language === "es" ? "Equipo" : "Team"}
                  </span>
                </Link>
                <ChevronRight className="w-4 h-4 text-[#BBBBBB]" />
                <span className="text-[#1D1D1B] font-medium">
                  {isEditMode ? (member?.name || t.editTitle) : t.createTitle}
                </span>
              </nav>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/admin/team">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="rounded-none border-[#D9D8D7] text-[#54565B] hover:bg-[#F8F8F8]"
                  data-testid="button-cancel"
                >
                  {t.cancel}
                </Button>
              </Link>
              <Button 
                type="submit"
                form="team-member-form"
                disabled={isPending}
                className="rounded-none bg-[#AA1A2E] hover:bg-[#8a1525] text-white min-w-[140px]"
                data-testid="button-submit"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isEditMode ? t.saving : t.creating}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEditMode ? t.save : t.create}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Form {...form}>
                <form 
                  id="team-member-form"
                  onSubmit={form.handleSubmit(onSubmit)} 
                  className="space-y-6"
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full justify-start bg-white border border-[#D9D8D7] rounded-none p-1 h-auto">
                      <TabsTrigger 
                        value="general" 
                        className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
                      >
                        <User className="w-4 h-4 mr-2" />
                        {t.tabs.general}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="contact"
                        className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {t.tabs.contact}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="bio"
                        className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        {t.tabs.bio}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="settings"
                        className="rounded-none data-[state=active]:bg-[#AA1A2E] data-[state=active]:text-white px-6 py-2.5"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {t.tabs.settings}
                      </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.basicInfo}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.basicInfoDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    {t.name}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="María García López"
                                      onBlur={() => {
                                        field.onBlur();
                                        if (!form.getValues("slug")) {
                                          generateSlug();
                                        }
                                      }}
                                      data-testid="input-name"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.nameHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="slug"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    {t.slug}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E] font-mono text-sm"
                                      data-testid="input-slug" 
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.slugHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator className="bg-[#D9D8D7]" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#878A8E]" />
                                    {t.title}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="Partner - Corporate & M&A"
                                      data-testid="input-title" 
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.titleHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="titleEs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-[#878A8E]" />
                                    {t.titleEs}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="Socio - Corporativo & Fusiones"
                                      data-testid="input-title-es" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#878A8E]" />
                                    {t.role}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-none border-[#D9D8D7]" data-testid="select-role">
                                        <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-none">
                                      <SelectItem value="Partner">{t.roles.partner}</SelectItem>
                                      <SelectItem value="Of Counsel">{t.roles.ofCounsel}</SelectItem>
                                      <SelectItem value="Counsel">{t.roles.counsel}</SelectItem>
                                      <SelectItem value="Senior Associate">{t.roles.seniorAssociate}</SelectItem>
                                      <SelectItem value="Associate">{t.roles.associate}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="roleEs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Briefcase className="w-4 h-4 text-[#878A8E]" />
                                    {t.roleEs}
                                    <Badge variant="destructive" className="rounded-none text-[10px] px-1.5 py-0">
                                      {t.requiredField}
                                    </Badge>
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-none border-[#D9D8D7]" data-testid="select-role-es">
                                        <SelectValue placeholder={language === "es" ? "Seleccionar..." : "Select..."} />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-none">
                                      <SelectItem value="Socio">{t.rolesEs.partner}</SelectItem>
                                      <SelectItem value="Of Counsel">{t.rolesEs.ofCounsel}</SelectItem>
                                      <SelectItem value="Counsel">{t.rolesEs.counsel}</SelectItem>
                                      <SelectItem value="Asociado Senior">{t.rolesEs.seniorAssociate}</SelectItem>
                                      <SelectItem value="Asociado">{t.rolesEs.associate}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Contact Tab */}
                    <TabsContent value="contact" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <Mail className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.contactInfo}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.contactInfoDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#878A8E]" />
                                    {t.email}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="email" 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="mgarcia@vfrlaw.com"
                                      data-testid="input-email" 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#878A8E]" />
                                    {t.phone}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="+52 55 1234 5678"
                                      data-testid="input-phone" 
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.phoneHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <Separator className="bg-[#D9D8D7]" />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="linkedinUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Linkedin className="w-4 h-4 text-[#878A8E]" />
                                    {t.linkedinUrl}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="https://linkedin.com/in/..."
                                      data-testid="input-linkedin" 
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.linkedinHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Image className="w-4 h-4 text-[#878A8E]" />
                                    {t.imageUrl}
                                  </FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E]"
                                      placeholder="https://example.com/photo.jpg"
                                      data-testid="input-image" 
                                    />
                                  </FormControl>
                                  <FormDescription className="text-[#878A8E] text-xs">
                                    {t.imageHint}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Biography Tab */}
                    <TabsContent value="bio" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.biography}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.biographyDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-[#878A8E]" />
                                  {t.bio}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={8}
                                    className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E] resize-none"
                                    placeholder="Professional experience, education, notable cases..."
                                    data-testid="textarea-bio"
                                  />
                                </FormControl>
                                <FormDescription className="text-[#878A8E] text-xs">
                                  {t.bioHint}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Separator className="bg-[#D9D8D7]" />

                          <FormField
                            control={form.control}
                            name="bioEs"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-[#878A8E]" />
                                  {t.bioEs}
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    rows={8}
                                    className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E] resize-none"
                                    placeholder="Experiencia profesional, educación, casos notables..."
                                    data-testid="textarea-bio-es"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* AI Translation hint */}
                          <div className="flex items-center gap-3 p-4 bg-[#F0F7FF] border border-[#CCE0FF]">
                            <Sparkles className="w-5 h-5 text-blue-600" />
                            <p className="text-sm text-blue-800">
                              {language === "es" 
                                ? "Consejo: Nuestros agentes de IA pueden traducir automáticamente las biografías a los 10 idiomas soportados."
                                : "Tip: Our AI agents can automatically translate biographies to all 10 supported languages."}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="mt-6">
                      <Card className="rounded-none border-[#D9D8D7]">
                        <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA]">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#AA1A2E]/10 flex items-center justify-center">
                              <Settings className="w-5 h-5 text-[#AA1A2E]" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-[#1D1D1B]">{t.settings}</CardTitle>
                              <CardDescription className="text-[#878A8E]">{t.settingsDesc}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <FormField
                            control={form.control}
                            name="isPartner"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between p-4 border border-[#D9D8D7] bg-white">
                                <div className="space-y-1">
                                  <FormLabel className="text-[#1D1D1B] font-medium flex items-center gap-2">
                                    <Award className="w-4 h-4 text-[#AA1A2E]" />
                                    {t.isPartner}
                                  </FormLabel>
                                  <FormDescription className="text-[#878A8E] text-sm">
                                    {t.isPartnerDesc}
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-[#AA1A2E]"
                                    data-testid="switch-partner"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-[#1D1D1B] font-medium">{t.order}</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="rounded-none border-[#D9D8D7] focus:border-[#AA1A2E] focus:ring-[#AA1A2E] w-32"
                                    data-testid="input-order"
                                  />
                                </FormControl>
                                <FormDescription className="text-[#878A8E] text-xs">
                                  {t.orderHint}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </form>
              </Form>
            </motion.div>
          </div>

          {/* Sidebar - Preview */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="sticky top-24"
            >
              <Card className="rounded-none border-[#D9D8D7] overflow-hidden">
                <CardHeader className="border-b border-[#D9D8D7] bg-[#FAFAFA] py-4">
                  <CardTitle className="text-sm font-medium text-[#878A8E] uppercase tracking-wide">
                    {t.preview}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Profile Preview */}
                  <div className="p-6 text-center border-b border-[#D9D8D7]">
                    <Avatar className="w-28 h-28 mx-auto mb-4 rounded-none">
                      <AvatarImage src={imageUrl || undefined} alt={name} className="object-cover" />
                      <AvatarFallback className="rounded-none bg-[#AA1A2E] text-white text-2xl font-bold">
                        {name ? getInitials(name) : <User className="w-10 h-10" />}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold text-[#1D1D1B] mb-1">
                      {watchedValues.name || (language === "es" ? "Nombre del Abogado" : "Lawyer Name")}
                    </h3>
                    <p className="text-[#AA1A2E] font-medium mb-1">
                      {language === "es" ? watchedValues.titleEs : watchedValues.title}
                    </p>
                    <p className="text-[#878A8E] text-sm">
                      {language === "es" ? watchedValues.roleEs : watchedValues.role}
                    </p>
                    
                    {watchedValues.isPartner && (
                      <Badge className="mt-3 rounded-none bg-[#AA1A2E] text-white">
                        <Award className="w-3 h-3 mr-1" />
                        {language === "es" ? "Socio" : "Partner"}
                      </Badge>
                    )}
                  </div>

                  {/* Contact Preview */}
                  <div className="p-4 space-y-3">
                    {watchedValues.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="w-4 h-4 text-[#878A8E]" />
                        <span className="text-[#54565B] truncate">{watchedValues.email}</span>
                      </div>
                    )}
                    {watchedValues.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-[#878A8E]" />
                        <span className="text-[#54565B]">{watchedValues.phone}</span>
                      </div>
                    )}
                    {watchedValues.linkedinUrl && (
                      <div className="flex items-center gap-3 text-sm">
                        <Linkedin className="w-4 h-4 text-[#878A8E]" />
                        <span className="text-[#54565B] truncate">LinkedIn Profile</span>
                      </div>
                    )}
                  </div>

                  {/* Completion Status */}
                  <div className="p-4 bg-[#FAFAFA] border-t border-[#D9D8D7]">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-[#54565B]">
                        {language === "es" ? "Progreso del perfil" : "Profile Progress"}
                      </span>
                    </div>
                    <div className="w-full bg-[#D9D8D7] h-2">
                      <div 
                        className="bg-[#AA1A2E] h-2 transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, 
                            (watchedValues.name ? 15 : 0) +
                            (watchedValues.title ? 15 : 0) +
                            (watchedValues.titleEs ? 10 : 0) +
                            (watchedValues.role ? 10 : 0) +
                            (watchedValues.roleEs ? 10 : 0) +
                            (watchedValues.email ? 10 : 0) +
                            (watchedValues.imageUrl ? 10 : 0) +
                            (watchedValues.bio ? 10 : 0) +
                            (watchedValues.bioEs ? 10 : 0)
                          )}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
