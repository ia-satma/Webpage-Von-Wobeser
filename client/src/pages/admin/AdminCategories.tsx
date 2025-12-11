import { useEffect, useState, useMemo } from "react";
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
    validationNameEnRequired: "English name is required",
    validationNameEsRequired: "Spanish name is required",
    validationSlugRequired: "Slug is required",
    validationSlugFormat: "Only lowercase letters, numbers, and hyphens",
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
    validationNameEnRequired: "El nombre en inglés es requerido",
    validationNameEsRequired: "El nombre en español es requerido",
    validationSlugRequired: "El slug es requerido",
    validationSlugFormat: "Solo letras minúsculas, números y guiones",
  },
  de: {
    title: "Kategorien",
    back: "Zurück zum Dashboard",
    newCategory: "Neue Kategorie",
    editCategory: "Kategorie bearbeiten",
    nameEn: "Name (Englisch)",
    nameEnPlaceholder: "Kategoriename auf Englisch",
    nameEs: "Name (Spanisch)",
    nameEsPlaceholder: "Kategoriename auf Spanisch",
    slug: "Slug",
    slugPlaceholder: "kategorie-slug",
    slugDescription: "URL-freundliche Kennung. Nur Kleinbuchstaben, Zahlen und Bindestriche.",
    descriptionEn: "Beschreibung (Englisch)",
    descriptionEnPlaceholder: "Kurze Beschreibung auf Englisch",
    descriptionEs: "Beschreibung (Spanisch)",
    descriptionEsPlaceholder: "Kurze Beschreibung auf Spanisch",
    save: "Speichern",
    cancel: "Abbrechen",
    saving: "Wird gespeichert...",
    nameColumn: "Name",
    slugColumn: "Slug",
    actions: "Aktionen",
    noCategories: "Noch keine Kategorien",
    edit: "Bearbeiten",
    delete: "Löschen",
    confirmDelete: "Sind Sie sicher, dass Sie diese Kategorie löschen möchten?",
    saveSuccess: "Kategorie erfolgreich gespeichert",
    saveError: "Fehler beim Speichern der Kategorie",
    deleteSuccess: "Kategorie erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen der Kategorie",
    loading: "Wird geladen...",
    validationNameEnRequired: "Englischer Name ist erforderlich",
    validationNameEsRequired: "Spanischer Name ist erforderlich",
    validationSlugRequired: "Slug ist erforderlich",
    validationSlugFormat: "Nur Kleinbuchstaben, Zahlen und Bindestriche",
  },
  zh: {
    title: "分类",
    back: "返回仪表板",
    newCategory: "新建分类",
    editCategory: "编辑分类",
    nameEn: "名称（英文）",
    nameEnPlaceholder: "英文分类名称",
    nameEs: "名称（西班牙文）",
    nameEsPlaceholder: "西班牙文分类名称",
    slug: "Slug",
    slugPlaceholder: "分类-slug",
    slugDescription: "URL友好标识符。仅限小写字母、数字和连字符。",
    descriptionEn: "描述（英文）",
    descriptionEnPlaceholder: "英文简要描述",
    descriptionEs: "描述（西班牙文）",
    descriptionEsPlaceholder: "西班牙文简要描述",
    save: "保存",
    cancel: "取消",
    saving: "保存中...",
    nameColumn: "名称",
    slugColumn: "Slug",
    actions: "操作",
    noCategories: "暂无分类",
    edit: "编辑",
    delete: "删除",
    confirmDelete: "您确定要删除此分类吗？",
    saveSuccess: "分类保存成功",
    saveError: "保存分类失败",
    deleteSuccess: "分类删除成功",
    deleteError: "删除分类失败",
    loading: "加载中...",
    validationNameEnRequired: "英文名称必填",
    validationNameEsRequired: "西班牙文名称必填",
    validationSlugRequired: "Slug必填",
    validationSlugFormat: "仅限小写字母、数字和连字符",
  },
  ko: {
    title: "카테고리",
    back: "대시보드로 돌아가기",
    newCategory: "새 카테고리",
    editCategory: "카테고리 편집",
    nameEn: "이름 (영어)",
    nameEnPlaceholder: "영어 카테고리 이름",
    nameEs: "이름 (스페인어)",
    nameEsPlaceholder: "스페인어 카테고리 이름",
    slug: "슬러그",
    slugPlaceholder: "카테고리-슬러그",
    slugDescription: "URL 친화적 식별자. 소문자, 숫자 및 하이픈만 사용 가능합니다.",
    descriptionEn: "설명 (영어)",
    descriptionEnPlaceholder: "영어 간단한 설명",
    descriptionEs: "설명 (스페인어)",
    descriptionEsPlaceholder: "스페인어 간단한 설명",
    save: "저장",
    cancel: "취소",
    saving: "저장 중...",
    nameColumn: "이름",
    slugColumn: "슬러그",
    actions: "작업",
    noCategories: "아직 카테고리가 없습니다",
    edit: "편집",
    delete: "삭제",
    confirmDelete: "이 카테고리를 삭제하시겠습니까?",
    saveSuccess: "카테고리가 성공적으로 저장되었습니다",
    saveError: "카테고리 저장 실패",
    deleteSuccess: "카테고리가 성공적으로 삭제되었습니다",
    deleteError: "카테고리 삭제 실패",
    loading: "로딩 중...",
    validationNameEnRequired: "영어 이름은 필수입니다",
    validationNameEsRequired: "스페인어 이름은 필수입니다",
    validationSlugRequired: "슬러그는 필수입니다",
    validationSlugFormat: "소문자, 숫자 및 하이픈만 가능",
  },
  ja: {
    title: "カテゴリ",
    back: "ダッシュボードに戻る",
    newCategory: "新しいカテゴリ",
    editCategory: "カテゴリを編集",
    nameEn: "名前（英語）",
    nameEnPlaceholder: "英語のカテゴリ名",
    nameEs: "名前（スペイン語）",
    nameEsPlaceholder: "スペイン語のカテゴリ名",
    slug: "スラッグ",
    slugPlaceholder: "カテゴリ-スラッグ",
    slugDescription: "URL用識別子。小文字、数字、ハイフンのみ使用可能です。",
    descriptionEn: "説明（英語）",
    descriptionEnPlaceholder: "英語の簡単な説明",
    descriptionEs: "説明（スペイン語）",
    descriptionEsPlaceholder: "スペイン語の簡単な説明",
    save: "保存",
    cancel: "キャンセル",
    saving: "保存中...",
    nameColumn: "名前",
    slugColumn: "スラッグ",
    actions: "アクション",
    noCategories: "カテゴリがまだありません",
    edit: "編集",
    delete: "削除",
    confirmDelete: "このカテゴリを削除してもよろしいですか？",
    saveSuccess: "カテゴリが正常に保存されました",
    saveError: "カテゴリの保存に失敗しました",
    deleteSuccess: "カテゴリが正常に削除されました",
    deleteError: "カテゴリの削除に失敗しました",
    loading: "読み込み中...",
    validationNameEnRequired: "英語名は必須です",
    validationNameEsRequired: "スペイン語名は必須です",
    validationSlugRequired: "スラッグは必須です",
    validationSlugFormat: "小文字、数字、ハイフンのみ",
  },
  ar: {
    title: "الفئات",
    back: "العودة إلى لوحة التحكم",
    newCategory: "فئة جديدة",
    editCategory: "تعديل الفئة",
    nameEn: "الاسم (بالإنجليزية)",
    nameEnPlaceholder: "اسم الفئة بالإنجليزية",
    nameEs: "الاسم (بالإسبانية)",
    nameEsPlaceholder: "اسم الفئة بالإسبانية",
    slug: "الرابط المختصر",
    slugPlaceholder: "رابط-الفئة",
    slugDescription: "معرّف صديق للروابط. أحرف صغيرة وأرقام وشرطات فقط.",
    descriptionEn: "الوصف (بالإنجليزية)",
    descriptionEnPlaceholder: "وصف موجز بالإنجليزية",
    descriptionEs: "الوصف (بالإسبانية)",
    descriptionEsPlaceholder: "وصف موجز بالإسبانية",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    nameColumn: "الاسم",
    slugColumn: "الرابط المختصر",
    actions: "الإجراءات",
    noCategories: "لا توجد فئات حتى الآن",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد أنك تريد حذف هذه الفئة؟",
    saveSuccess: "تم حفظ الفئة بنجاح",
    saveError: "فشل في حفظ الفئة",
    deleteSuccess: "تم حذف الفئة بنجاح",
    deleteError: "فشل في حذف الفئة",
    loading: "جاري التحميل...",
    validationNameEnRequired: "الاسم بالإنجليزية مطلوب",
    validationNameEsRequired: "الاسم بالإسبانية مطلوب",
    validationSlugRequired: "الرابط المختصر مطلوب",
    validationSlugFormat: "أحرف صغيرة وأرقام وشرطات فقط",
  },
  ru: {
    title: "Категории",
    back: "Вернуться к панели",
    newCategory: "Новая категория",
    editCategory: "Редактировать категорию",
    nameEn: "Название (английский)",
    nameEnPlaceholder: "Название категории на английском",
    nameEs: "Название (испанский)",
    nameEsPlaceholder: "Название категории на испанском",
    slug: "Slug",
    slugPlaceholder: "slug-категории",
    slugDescription: "URL-дружественный идентификатор. Только строчные буквы, цифры и дефисы.",
    descriptionEn: "Описание (английский)",
    descriptionEnPlaceholder: "Краткое описание на английском",
    descriptionEs: "Описание (испанский)",
    descriptionEsPlaceholder: "Краткое описание на испанском",
    save: "Сохранить",
    cancel: "Отмена",
    saving: "Сохранение...",
    nameColumn: "Название",
    slugColumn: "Slug",
    actions: "Действия",
    noCategories: "Категорий пока нет",
    edit: "Редактировать",
    delete: "Удалить",
    confirmDelete: "Вы уверены, что хотите удалить эту категорию?",
    saveSuccess: "Категория успешно сохранена",
    saveError: "Не удалось сохранить категорию",
    deleteSuccess: "Категория успешно удалена",
    deleteError: "Не удалось удалить категорию",
    loading: "Загрузка...",
    validationNameEnRequired: "Английское название обязательно",
    validationNameEsRequired: "Испанское название обязательно",
    validationSlugRequired: "Slug обязателен",
    validationSlugFormat: "Только строчные буквы, цифры и дефисы",
  },
  fr: {
    title: "Catégories",
    back: "Retour au tableau de bord",
    newCategory: "Nouvelle catégorie",
    editCategory: "Modifier la catégorie",
    nameEn: "Nom (anglais)",
    nameEnPlaceholder: "Nom de la catégorie en anglais",
    nameEs: "Nom (espagnol)",
    nameEsPlaceholder: "Nom de la catégorie en espagnol",
    slug: "Slug",
    slugPlaceholder: "slug-categorie",
    slugDescription: "Identifiant compatible URL. Lettres minuscules, chiffres et tirets uniquement.",
    descriptionEn: "Description (anglais)",
    descriptionEnPlaceholder: "Brève description en anglais",
    descriptionEs: "Description (espagnol)",
    descriptionEsPlaceholder: "Brève description en espagnol",
    save: "Enregistrer",
    cancel: "Annuler",
    saving: "Enregistrement...",
    nameColumn: "Nom",
    slugColumn: "Slug",
    actions: "Actions",
    noCategories: "Aucune catégorie pour le moment",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cette catégorie ?",
    saveSuccess: "Catégorie enregistrée avec succès",
    saveError: "Échec de l'enregistrement de la catégorie",
    deleteSuccess: "Catégorie supprimée avec succès",
    deleteError: "Échec de la suppression de la catégorie",
    loading: "Chargement...",
    validationNameEnRequired: "Le nom en anglais est requis",
    validationNameEsRequired: "Le nom en espagnol est requis",
    validationSlugRequired: "Le slug est requis",
    validationSlugFormat: "Lettres minuscules, chiffres et tirets uniquement",
  },
  it: {
    title: "Categorie",
    back: "Torna alla dashboard",
    newCategory: "Nuova categoria",
    editCategory: "Modifica categoria",
    nameEn: "Nome (inglese)",
    nameEnPlaceholder: "Nome della categoria in inglese",
    nameEs: "Nome (spagnolo)",
    nameEsPlaceholder: "Nome della categoria in spagnolo",
    slug: "Slug",
    slugPlaceholder: "slug-categoria",
    slugDescription: "Identificatore compatibile URL. Solo lettere minuscole, numeri e trattini.",
    descriptionEn: "Descrizione (inglese)",
    descriptionEnPlaceholder: "Breve descrizione in inglese",
    descriptionEs: "Descrizione (spagnolo)",
    descriptionEsPlaceholder: "Breve descrizione in spagnolo",
    save: "Salva",
    cancel: "Annulla",
    saving: "Salvataggio...",
    nameColumn: "Nome",
    slugColumn: "Slug",
    actions: "Azioni",
    noCategories: "Nessuna categoria ancora",
    edit: "Modifica",
    delete: "Elimina",
    confirmDelete: "Sei sicuro di voler eliminare questa categoria?",
    saveSuccess: "Categoria salvata con successo",
    saveError: "Impossibile salvare la categoria",
    deleteSuccess: "Categoria eliminata con successo",
    deleteError: "Impossibile eliminare la categoria",
    loading: "Caricamento...",
    validationNameEnRequired: "Il nome in inglese è obbligatorio",
    validationNameEsRequired: "Il nome in spagnolo è obbligatorio",
    validationSlugRequired: "Lo slug è obbligatorio",
    validationSlugFormat: "Solo lettere minuscole, numeri e trattini",
  },
};

function createCategorySchema(t: typeof translations.en) {
  return z.object({
    name: z.string().min(1, t.validationNameEnRequired).max(100),
    nameEs: z.string().min(1, t.validationNameEsRequired).max(100),
    slug: z.string().min(1, t.validationSlugRequired).max(100).regex(/^[a-z0-9-]+$/, t.validationSlugFormat),
    description: z.string().max(500).optional(),
    descriptionEs: z.string().max(500).optional(),
  });
}

type CategoryFormData = z.infer<ReturnType<typeof createCategorySchema>>;

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
  const t = translations[language as keyof typeof translations] || translations.en;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);

  const categorySchema = useMemo(() => createCategorySchema(t), [t]);

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
