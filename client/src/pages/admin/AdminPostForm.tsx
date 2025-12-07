import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Send, Sparkles, Loader2 } from "lucide-react";
import type { BlogPost, BlogCategory } from "@shared/schema";

const translations = {
  en: {
    createTitle: "Create New Post",
    editTitle: "Edit Post",
    back: "Back to Posts",
    english: "English",
    spanish: "Spanish",
    seo: "SEO",
    titleLabel: "Title",
    titlePlaceholder: "Enter post title",
    slugLabel: "Slug",
    slugPlaceholder: "post-url-slug",
    slugDescription: "Auto-generated from English title. Only letters, numbers, and hyphens.",
    contentLabel: "Content",
    contentPlaceholder: "Write your post content here...",
    excerptLabel: "Excerpt",
    excerptPlaceholder: "Brief summary of the post",
    featuredImageLabel: "Featured Image URL",
    featuredImagePlaceholder: "https://example.com/image.jpg",
    categoryLabel: "Category",
    selectCategory: "Select a category",
    noCategory: "No category",
    statusLabel: "Status",
    draft: "Draft",
    published: "Published",
    metaTitleLabel: "Meta Title",
    metaTitlePlaceholder: "SEO title (max 70 characters)",
    metaDescriptionLabel: "Meta Description",
    metaDescriptionPlaceholder: "SEO description (max 160 characters)",
    saveDraft: "Save as Draft",
    publish: "Publish",
    saving: "Saving...",
    saveSuccess: "Post saved successfully",
    saveError: "Failed to save post",
    loading: "Loading...",
    required: "This field is required",
    suggestTranslation: "Suggest Translation",
    translating: "Translating...",
    translationSuccess: "Translation suggested with {confidence}% confidence",
    translationError: "Failed to suggest translation",
    noEnglishText: "Enter English text first",
  },
  es: {
    createTitle: "Crear Nuevo Post",
    editTitle: "Editar Post",
    back: "Volver a Posts",
    english: "Inglés",
    spanish: "Español",
    seo: "SEO",
    titleLabel: "Título",
    titlePlaceholder: "Ingrese el título del post",
    slugLabel: "Slug",
    slugPlaceholder: "url-del-post",
    slugDescription: "Generado automáticamente del título en inglés. Solo letras, números y guiones.",
    contentLabel: "Contenido",
    contentPlaceholder: "Escriba el contenido del post aquí...",
    excerptLabel: "Extracto",
    excerptPlaceholder: "Breve resumen del post",
    featuredImageLabel: "URL de Imagen Destacada",
    featuredImagePlaceholder: "https://ejemplo.com/imagen.jpg",
    categoryLabel: "Categoría",
    selectCategory: "Seleccione una categoría",
    noCategory: "Sin categoría",
    statusLabel: "Estado",
    draft: "Borrador",
    published: "Publicado",
    metaTitleLabel: "Meta Título",
    metaTitlePlaceholder: "Título SEO (máx 70 caracteres)",
    metaDescriptionLabel: "Meta Descripción",
    metaDescriptionPlaceholder: "Descripción SEO (máx 160 caracteres)",
    saveDraft: "Guardar Borrador",
    publish: "Publicar",
    saving: "Guardando...",
    saveSuccess: "Post guardado exitosamente",
    saveError: "Error al guardar el post",
    loading: "Cargando...",
    required: "Este campo es requerido",
    suggestTranslation: "Sugerir Traducción",
    translating: "Traduciendo...",
    translationSuccess: "Traducción sugerida con {confidence}% de confianza",
    translationError: "Error al sugerir traducción",
    noEnglishText: "Ingrese texto en inglés primero",
  },
};

const postFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  titleEs: z.string().min(1, "Spanish title is required").max(200),
  slug: z.string().min(1, "Slug is required").max(250).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  content: z.string().optional(),
  contentEs: z.string().optional(),
  excerpt: z.string().max(500).optional(),
  excerptEs: z.string().max(500).optional(),
  featuredImage: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  metaTitle: z.string().max(70).optional(),
  metaTitleEs: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
  metaDescriptionEs: z.string().max(160).optional(),
});

type PostFormData = z.infer<typeof postFormSchema>;

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TranslationField = "title" | "excerpt" | "content";

export default function AdminPostForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { language, displayLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[displayLanguage];

  const [translatingFields, setTranslatingFields] = useState<Record<TranslationField, boolean>>({
    title: false,
    excerpt: false,
    content: false,
  });

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const form = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      titleEs: "",
      slug: "",
      content: "",
      contentEs: "",
      excerpt: "",
      excerptEs: "",
      featuredImage: "",
      categoryId: "",
      status: "draft",
      metaTitle: "",
      metaTitleEs: "",
      metaDescription: "",
      metaDescriptionEs: "",
    },
  });

  const postQuery = useQuery<BlogPost>({
    queryKey: ["/api/admin/posts", id],
    queryFn: async () => {
      const res = await adminApiRequest("GET", `/api/admin/posts/${id}`);
      if (!res.ok) throw new Error("Failed to fetch post");
      return res.json();
    },
    enabled: isEditing && isAuthenticated,
  });

  const categoriesQuery = useQuery<BlogCategory[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (postQuery.data) {
      const post = postQuery.data;
      form.reset({
        title: post.title || "",
        titleEs: post.titleEs || "",
        slug: post.slug || "",
        content: post.content || "",
        contentEs: post.contentEs || "",
        excerpt: post.excerpt || "",
        excerptEs: post.excerptEs || "",
        featuredImage: post.featuredImage || "",
        categoryId: post.categoryId || "",
        status: post.status as "draft" | "published",
        metaTitle: post.metaTitle || "",
        metaTitleEs: post.metaTitleEs || "",
        metaDescription: post.metaDescription || "",
        metaDescriptionEs: post.metaDescriptionEs || "",
      });
    }
  }, [postQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData & { status: string }) => {
      const url = isEditing ? `/api/admin/posts/${id}` : "/api/admin/posts";
      const method = isEditing ? "PATCH" : "POST";
      
      const res = await adminApiRequest(method, url, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to save post");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.saveSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      setLocation("/admin/posts");
    },
    onError: (error: Error) => {
      toast({ 
        title: t.saveError, 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSave = (status: "draft" | "published") => {
    form.setValue("status", status);
    form.handleSubmit((data) => {
      saveMutation.mutate({ ...data, status });
    })();
  };

  const handleTitleChange = (value: string) => {
    form.setValue("title", value);
    if (!isEditing && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(value));
    }
  };

  const handleSuggestTranslation = async (field: TranslationField) => {
    const englishFieldMap = {
      title: "title",
      excerpt: "excerpt",
      content: "content",
    } as const;
    
    const spanishFieldMap = {
      title: "titleEs",
      excerpt: "excerptEs",
      content: "contentEs",
    } as const;

    const englishText = form.getValues(englishFieldMap[field]);
    
    if (!englishText || !englishText.trim()) {
      toast({
        title: t.noEnglishText,
        variant: "destructive",
      });
      return;
    }

    setTranslatingFields((prev) => ({ ...prev, [field]: true }));

    try {
      const response = await adminApiRequest("POST", "/api/translate/suggest", {
        originalText: englishText,
        targetLanguage: "es",
        existingTranslations: { en: englishText },
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const result = await response.json();
      const confidencePercent = Math.round(result.confidence * 100);

      form.setValue(spanishFieldMap[field], result.translation);

      toast({
        title: t.translationSuccess.replace("{confidence}", String(confidencePercent)),
      });
    } catch (error) {
      toast({
        title: t.translationError,
        variant: "destructive",
      });
    } finally {
      setTranslatingFields((prev) => ({ ...prev, [field]: false }));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.loading}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isEditing && postQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const categories = categoriesQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/posts">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              </Link>
              <h1 className="text-xl font-semibold" data-testid="text-page-title">
                {isEditing ? t.editTitle : t.createTitle}
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave("draft")}
                disabled={saveMutation.isPending}
                data-testid="button-save-draft"
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? t.saving : t.saveDraft}
              </Button>
              <Button
                onClick={() => handleSave("published")}
                disabled={saveMutation.isPending}
                data-testid="button-publish"
              >
                <Send className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? t.saving : t.publish}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form {...form}>
          <form className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.categoryLabel}</FormLabel>
                        <Select 
                          value={field.value || "__none__"} 
                          onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder={t.selectCategory} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="__none__" data-testid="option-no-category">
                              {t.noCategory}
                            </SelectItem>
                            {categories.map((cat) => (
                              <SelectItem 
                                key={cat.id} 
                                value={cat.id}
                                data-testid={`option-category-${cat.id}`}
                              >
                                {displayLanguage === "es" ? cat.nameEs : cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featuredImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.featuredImageLabel}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.featuredImagePlaceholder}
                            data-testid="input-featured-image"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>{t.slugLabel}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t.slugPlaceholder}
                          data-testid="input-slug"
                        />
                      </FormControl>
                      <FormDescription>{t.slugDescription}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="en" data-testid="tab-english">{t.english}</TabsTrigger>
                <TabsTrigger value="es" data-testid="tab-spanish">{t.spanish}</TabsTrigger>
                <TabsTrigger value="seo" data-testid="tab-seo">{t.seo}</TabsTrigger>
              </TabsList>

              <TabsContent value="en">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.english}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.titleLabel}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => handleTitleChange(e.target.value)}
                              placeholder={t.titlePlaceholder}
                              data-testid="input-title-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.excerptLabel}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t.excerptPlaceholder}
                              rows={2}
                              data-testid="textarea-excerpt-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.contentLabel}</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t.contentPlaceholder}
                              rows={12}
                              data-testid="textarea-content-en"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="es">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.spanish}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="titleEs"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>{t.titleLabel}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuggestTranslation("title")}
                              disabled={translatingFields.title}
                              data-testid="button-translate-title"
                              className="h-6 px-2 text-xs"
                            >
                              {translatingFields.title ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  {t.translating}
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  {t.suggestTranslation}
                                </>
                              )}
                            </Button>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.titlePlaceholder}
                              data-testid="input-title-es"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="excerptEs"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>{t.excerptLabel}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuggestTranslation("excerpt")}
                              disabled={translatingFields.excerpt}
                              data-testid="button-translate-excerpt"
                              className="h-6 px-2 text-xs"
                            >
                              {translatingFields.excerpt ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  {t.translating}
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  {t.suggestTranslation}
                                </>
                              )}
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t.excerptPlaceholder}
                              rows={2}
                              data-testid="textarea-excerpt-es"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contentEs"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel>{t.contentLabel}</FormLabel>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuggestTranslation("content")}
                              disabled={translatingFields.content}
                              data-testid="button-translate-content"
                              className="h-6 px-2 text-xs"
                            >
                              {translatingFields.content ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  {t.translating}
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mr-1 h-3 w-3" />
                                  {t.suggestTranslation}
                                </>
                              )}
                            </Button>
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder={t.contentPlaceholder}
                              rows={12}
                              data-testid="textarea-content-es"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo">
                <Card>
                  <CardHeader>
                    <CardTitle>{t.seo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.metaTitleLabel} (EN)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t.metaTitlePlaceholder}
                                maxLength={70}
                                data-testid="input-meta-title-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="metaTitleEs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.metaTitleLabel} (ES)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t.metaTitlePlaceholder}
                                maxLength={70}
                                data-testid="input-meta-title-es"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.metaDescriptionLabel} (EN)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t.metaDescriptionPlaceholder}
                                maxLength={160}
                                rows={3}
                                data-testid="textarea-meta-desc-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="metaDescriptionEs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.metaDescriptionLabel} (ES)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t.metaDescriptionPlaceholder}
                                maxLength={160}
                                rows={3}
                                data-testid="textarea-meta-desc-es"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </main>
    </div>
  );
}
