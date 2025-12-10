import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, User, Loader2 } from "lucide-react";
import type { TeamMember } from "@shared/schema";

const translations = {
  en: {
    createTitle: "Create Team Member",
    editTitle: "Edit Team Member",
    back: "Back to Team",
    save: "Save",
    saving: "Saving...",
    create: "Create",
    creating: "Creating...",
    basicInfo: "Basic Information",
    contactInfo: "Contact Information",
    biography: "Biography",
    settings: "Settings",
    name: "Full Name",
    slug: "URL Slug",
    slugHint: "Used in URLs (e.g., 'john-doe')",
    title: "Title (English)",
    titleEs: "Title (Spanish)",
    role: "Role (English)",
    roleEs: "Role (Spanish)",
    email: "Email",
    phone: "Phone",
    linkedinUrl: "LinkedIn URL",
    imageUrl: "Profile Image URL",
    bio: "Biography (English)",
    bioEs: "Biography (Spanish)",
    isPartner: "Is Partner",
    order: "Display Order",
    createSuccess: "Team member created successfully",
    updateSuccess: "Team member updated successfully",
    error: "An error occurred",
    requiredField: "This field is required",
    loading: "Loading...",
  },
  es: {
    createTitle: "Crear Miembro del Equipo",
    editTitle: "Editar Miembro del Equipo",
    back: "Volver al Equipo",
    save: "Guardar",
    saving: "Guardando...",
    create: "Crear",
    creating: "Creando...",
    basicInfo: "Información Básica",
    contactInfo: "Información de Contacto",
    biography: "Biografía",
    settings: "Configuración",
    name: "Nombre Completo",
    slug: "URL Slug",
    slugHint: "Usado en URLs (ej. 'juan-perez')",
    title: "Título (Inglés)",
    titleEs: "Título (Español)",
    role: "Rol (Inglés)",
    roleEs: "Rol (Español)",
    email: "Correo Electrónico",
    phone: "Teléfono",
    linkedinUrl: "URL de LinkedIn",
    imageUrl: "URL de Imagen de Perfil",
    bio: "Biografía (Inglés)",
    bioEs: "Biografía (Español)",
    isPartner: "Es Socio",
    order: "Orden de Visualización",
    createSuccess: "Miembro del equipo creado exitosamente",
    updateSuccess: "Miembro del equipo actualizado exitosamente",
    error: "Ocurrió un error",
    requiredField: "Este campo es requerido",
    loading: "Cargando...",
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

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isEditMode && memberLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/team">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {isEditMode ? t.editTitle : t.createTitle}
            </h1>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.basicInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.name}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onBlur={() => {
                              field.onBlur();
                              if (!form.getValues("slug")) {
                                generateSlug();
                              }
                            }}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.slug}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-slug" />
                        </FormControl>
                        <p className="text-sm text-muted-foreground">{t.slugHint}</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.title}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="titleEs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.titleEs}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-title-es" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.role}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Partner">Partner</SelectItem>
                            <SelectItem value="Of Counsel">Of Counsel</SelectItem>
                            <SelectItem value="Counsel">Counsel</SelectItem>
                            <SelectItem value="Senior Associate">Senior Associate</SelectItem>
                            <SelectItem value="Associate">Associate</SelectItem>
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
                        <FormLabel>{t.roleEs}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-role-es">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Socio">Socio</SelectItem>
                            <SelectItem value="Of Counsel">Of Counsel</SelectItem>
                            <SelectItem value="Counsel">Counsel</SelectItem>
                            <SelectItem value="Asociado Senior">Asociado Senior</SelectItem>
                            <SelectItem value="Asociado">Asociado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.contactInfo}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.email}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-email" />
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
                        <FormLabel>{t.phone}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.linkedinUrl}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-linkedin" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.imageUrl}</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-image" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.biography}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.bio}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          className="resize-none"
                          data-testid="textarea-bio"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bioEs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.bioEs}</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={6}
                          className="resize-none"
                          data-testid="textarea-bio-es"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.settings}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isPartner"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">{t.isPartner}</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
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
                        <FormLabel>{t.order}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-order"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/admin/team">
                <Button type="button" variant="outline" data-testid="button-cancel">
                  {t.back}
                </Button>
              </Link>
              <Button type="submit" disabled={isPending} data-testid="button-submit">
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
          </form>
        </Form>
      </div>
    </div>
  );
}
