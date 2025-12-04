import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { z } from "zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlusCircle, Pencil, Trash2, FolderOpen } from "lucide-react";
import type { BlogCategory } from "@shared/schema";

const translations = {
  en: {
    title: "Categories",
    back: "Back to Dashboard",
    newCategory: "New Category",
    editCategory: "Edit Category",
    nameEn: "Name (English)",
    nameEnPlaceholder: "Category name in English",
    nameEs: "Name (Spanish)",
    nameEsPlaceholder: "Category name in Spanish",
    slug: "Slug",
    slugPlaceholder: "category-slug",
    slugDescription: "URL-friendly identifier. Only lowercase letters, numbers, and hyphens.",
    descriptionEn: "Description (English)",
    descriptionEnPlaceholder: "Brief description in English",
    descriptionEs: "Description (Spanish)",
    descriptionEsPlaceholder: "Brief description in Spanish",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    nameColumn: "Name",
    slugColumn: "Slug",
    actions: "Actions",
    noCategories: "No categories yet",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this category?",
    saveSuccess: "Category saved successfully",
    saveError: "Failed to save category",
    deleteSuccess: "Category deleted successfully",
    deleteError: "Failed to delete category",
    loading: "Loading...",
  },
  es: {
    title: "Categorías",
    back: "Volver al Dashboard",
    newCategory: "Nueva Categoría",
    editCategory: "Editar Categoría",
    nameEn: "Nombre (Inglés)",
    nameEnPlaceholder: "Nombre de la categoría en inglés",
    nameEs: "Nombre (Español)",
    nameEsPlaceholder: "Nombre de la categoría en español",
    slug: "Slug",
    slugPlaceholder: "slug-categoria",
    slugDescription: "Identificador amigable para URL. Solo letras minúsculas, números y guiones.",
    descriptionEn: "Descripción (Inglés)",
    descriptionEnPlaceholder: "Breve descripción en inglés",
    descriptionEs: "Descripción (Español)",
    descriptionEsPlaceholder: "Breve descripción en español",
    save: "Guardar",
    cancel: "Cancelar",
    saving: "Guardando...",
    nameColumn: "Nombre",
    slugColumn: "Slug",
    actions: "Acciones",
    noCategories: "No hay categorías aún",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Está seguro que desea eliminar esta categoría?",
    saveSuccess: "Categoría guardada exitosamente",
    saveError: "Error al guardar la categoría",
    deleteSuccess: "Categoría eliminada exitosamente",
    deleteError: "Error al eliminar la categoría",
    loading: "Cargando...",
  },
};

const categorySchema = z.object({
  name: z.string().min(1, "English name is required").max(100),
  nameEs: z.string().min(1, "Spanish name is required").max(100),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  descriptionEs: z.string().max(500).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategories() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      nameEs: "",
      slug: "",
      description: "",
      descriptionEs: "",
    },
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

  const saveMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}` 
        : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";
      
      const res = await adminApiRequest(method, url, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to save category");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.saveSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ 
        title: t.saveError, 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/categories/${categoryId}`);
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleEdit = (category: BlogCategory) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      nameEs: category.nameEs,
      slug: category.slug,
      description: category.description || "",
      descriptionEs: category.descriptionEs || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(categoryId);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingCategory(null);
      form.reset();
    }
  };

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingCategory && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(value));
    }
  };

  const onSubmit = (data: CategoryFormData) => {
    saveMutation.mutate(data);
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

  const categories = categoriesQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-category">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.newCategory}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle data-testid="text-dialog-title">
                    {editingCategory ? t.editCategory : t.newCategory}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.nameEn}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder={t.nameEnPlaceholder}
                                data-testid="input-name-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nameEs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.nameEs}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t.nameEsPlaceholder}
                                data-testid="input-name-es"
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
                        <FormItem>
                          <FormLabel>{t.slug}</FormLabel>
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

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.descriptionEn}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t.descriptionEnPlaceholder}
                                rows={2}
                                data-testid="textarea-desc-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="descriptionEs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.descriptionEs}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t.descriptionEsPlaceholder}
                                rows={2}
                                data-testid="textarea-desc-es"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        data-testid="button-cancel"
                      >
                        {t.cancel}
                      </Button>
                      <Button
                        type="submit"
                        disabled={saveMutation.isPending}
                        data-testid="button-save-category"
                      >
                        {saveMutation.isPending ? t.saving : t.save}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="pt-6">
            {categoriesQuery.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-categories">
                {t.noCategories}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.nameColumn}</TableHead>
                    <TableHead>{t.slugColumn}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                      <TableCell className="font-medium" data-testid={`text-name-${category.id}`}>
                        {language === "es" ? category.nameEs : category.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-slug-${category.id}`}>
                        {category.slug}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                            data-testid={`button-edit-${category.id}`}
                            title={t.edit}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${category.id}`}
                            title={t.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
