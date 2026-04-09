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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlusCircle, Pencil, Trash2, Building2, Star, GripVertical } from "lucide-react";
import type { IndustryGroup } from "@shared/schema";

const translations = {
  en: {
    title: "Industry Groups",
    back: "Back to Dashboard",
    newIndustryGroup: "New Industry Group",
    editIndustryGroup: "Edit Industry Group",
    nameEn: "Name (English)",
    nameEnPlaceholder: "Industry group name in English",
    nameEs: "Name (Spanish)",
    nameEsPlaceholder: "Industry group name in Spanish",
    slug: "Slug",
    slugPlaceholder: "industry-group-slug",
    slugDescription: "URL-friendly identifier. Only lowercase letters, numbers, and hyphens.",
    descriptionEn: "Description (English)",
    descriptionEnPlaceholder: "Brief description in English",
    descriptionEs: "Description (Spanish)",
    descriptionEsPlaceholder: "Brief description in Spanish",
    fullDescriptionEn: "Full Description (English)",
    fullDescriptionEnPlaceholder: "Detailed description in English",
    fullDescriptionEs: "Full Description (Spanish)",
    fullDescriptionEsPlaceholder: "Detailed description in Spanish",
    icon: "Icon Name",
    iconPlaceholder: "Lucide icon name (e.g., Building2, Factory)",
    iconDescription: "Name of the Lucide icon to display",
    order: "Display Order",
    orderDescription: "Lower numbers appear first",
    featured: "Featured",
    featuredDescription: "Show this industry group prominently on the homepage",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    nameColumn: "Name",
    slugColumn: "Slug",
    orderColumn: "Order",
    featuredColumn: "Featured",
    actions: "Actions",
    noIndustryGroups: "No industry groups yet",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this industry group?",
    saveSuccess: "Industry group saved successfully",
    saveError: "Failed to save industry group",
    deleteSuccess: "Industry group deleted successfully",
    deleteError: "Failed to delete industry group",
    loading: "Loading...",
    totalGroups: "Total Industry Groups",
    featuredGroups: "Featured",
  },
  es: {
    title: "Grupos Industriales",
    back: "Volver al Dashboard",
    newIndustryGroup: "Nuevo Grupo Industrial",
    editIndustryGroup: "Editar Grupo Industrial",
    nameEn: "Nombre (Inglés)",
    nameEnPlaceholder: "Nombre del grupo en inglés",
    nameEs: "Nombre (Español)",
    nameEsPlaceholder: "Nombre del grupo en español",
    slug: "Slug",
    slugPlaceholder: "slug-grupo-industrial",
    slugDescription: "Identificador amigable para URL. Solo letras minúsculas, números y guiones.",
    descriptionEn: "Descripción (Inglés)",
    descriptionEnPlaceholder: "Breve descripción en inglés",
    descriptionEs: "Descripción (Español)",
    descriptionEsPlaceholder: "Breve descripción en español",
    fullDescriptionEn: "Descripción Completa (Inglés)",
    fullDescriptionEnPlaceholder: "Descripción detallada en inglés",
    fullDescriptionEs: "Descripción Completa (Español)",
    fullDescriptionEsPlaceholder: "Descripción detallada en español",
    icon: "Nombre del Icono",
    iconPlaceholder: "Nombre del icono Lucide (ej: Building2, Factory)",
    iconDescription: "Nombre del icono Lucide a mostrar",
    order: "Orden de Visualización",
    orderDescription: "Números menores aparecen primero",
    featured: "Destacado",
    featuredDescription: "Mostrar este grupo prominentemente en la página principal",
    save: "Guardar",
    cancel: "Cancelar",
    saving: "Guardando...",
    nameColumn: "Nombre",
    slugColumn: "Slug",
    orderColumn: "Orden",
    featuredColumn: "Destacado",
    actions: "Acciones",
    noIndustryGroups: "No hay grupos industriales aún",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Está seguro que desea eliminar este grupo industrial?",
    saveSuccess: "Grupo industrial guardado exitosamente",
    saveError: "Error al guardar el grupo industrial",
    deleteSuccess: "Grupo industrial eliminado exitosamente",
    deleteError: "Error al eliminar el grupo industrial",
    loading: "Cargando...",
    totalGroups: "Total Grupos Industriales",
    featuredGroups: "Destacados",
  },
  de: {
    title: "Branchengruppen",
    back: "Zurück zum Dashboard",
    newIndustryGroup: "Neue Branchengruppe",
    editIndustryGroup: "Branchengruppe bearbeiten",
    nameEn: "Name (Englisch)",
    nameEnPlaceholder: "Name der Branchengruppe auf Englisch",
    nameEs: "Name (Spanisch)",
    nameEsPlaceholder: "Name der Branchengruppe auf Spanisch",
    slug: "Slug",
    slugPlaceholder: "branchengruppe-slug",
    slugDescription: "URL-freundliche Kennung. Nur Kleinbuchstaben, Zahlen und Bindestriche.",
    descriptionEn: "Beschreibung (Englisch)",
    descriptionEnPlaceholder: "Kurze Beschreibung auf Englisch",
    descriptionEs: "Beschreibung (Spanisch)",
    descriptionEsPlaceholder: "Kurze Beschreibung auf Spanisch",
    fullDescriptionEn: "Vollständige Beschreibung (Englisch)",
    fullDescriptionEnPlaceholder: "Detaillierte Beschreibung auf Englisch",
    fullDescriptionEs: "Vollständige Beschreibung (Spanisch)",
    fullDescriptionEsPlaceholder: "Detaillierte Beschreibung auf Spanisch",
    icon: "Icon-Name",
    iconPlaceholder: "Lucide Icon-Name (z.B. Building2, Factory)",
    iconDescription: "Name des anzuzeigenden Lucide-Icons",
    order: "Anzeigereihenfolge",
    orderDescription: "Niedrigere Zahlen erscheinen zuerst",
    featured: "Hervorgehoben",
    featuredDescription: "Diese Branchengruppe prominent auf der Startseite anzeigen",
    save: "Speichern",
    cancel: "Abbrechen",
    saving: "Wird gespeichert...",
    nameColumn: "Name",
    slugColumn: "Slug",
    orderColumn: "Reihenfolge",
    featuredColumn: "Hervorgehoben",
    actions: "Aktionen",
    noIndustryGroups: "Noch keine Branchengruppen",
    edit: "Bearbeiten",
    delete: "Löschen",
    confirmDelete: "Sind Sie sicher, dass Sie diese Branchengruppe löschen möchten?",
    saveSuccess: "Branchengruppe erfolgreich gespeichert",
    saveError: "Fehler beim Speichern der Branchengruppe",
    deleteSuccess: "Branchengruppe erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen der Branchengruppe",
    loading: "Wird geladen...",
    totalGroups: "Gesamt Branchengruppen",
    featuredGroups: "Hervorgehoben",
  },
  zh: {
    title: "行业组",
    back: "返回仪表板",
    newIndustryGroup: "新建行业组",
    editIndustryGroup: "编辑行业组",
    nameEn: "名称（英文）",
    nameEnPlaceholder: "英文行业组名称",
    nameEs: "名称（西班牙文）",
    nameEsPlaceholder: "西班牙文行业组名称",
    slug: "Slug",
    slugPlaceholder: "行业组-slug",
    slugDescription: "URL友好标识符。仅限小写字母、数字和连字符。",
    descriptionEn: "描述（英文）",
    descriptionEnPlaceholder: "英文简要描述",
    descriptionEs: "描述（西班牙文）",
    descriptionEsPlaceholder: "西班牙文简要描述",
    fullDescriptionEn: "详细描述（英文）",
    fullDescriptionEnPlaceholder: "英文详细描述",
    fullDescriptionEs: "详细描述（西班牙文）",
    fullDescriptionEsPlaceholder: "西班牙文详细描述",
    icon: "图标名称",
    iconPlaceholder: "Lucide图标名称（如：Building2, Factory）",
    iconDescription: "要显示的Lucide图标名称",
    order: "显示顺序",
    orderDescription: "较小的数字优先显示",
    featured: "精选",
    featuredDescription: "在首页突出显示此行业组",
    save: "保存",
    cancel: "取消",
    saving: "保存中...",
    nameColumn: "名称",
    slugColumn: "Slug",
    orderColumn: "顺序",
    featuredColumn: "精选",
    actions: "操作",
    noIndustryGroups: "暂无行业组",
    edit: "编辑",
    delete: "删除",
    confirmDelete: "您确定要删除此行业组吗？",
    saveSuccess: "行业组保存成功",
    saveError: "保存行业组失败",
    deleteSuccess: "行业组删除成功",
    deleteError: "删除行业组失败",
    loading: "加载中...",
    totalGroups: "行业组总数",
    featuredGroups: "精选",
  },
  ko: {
    title: "산업 그룹",
    back: "대시보드로 돌아가기",
    newIndustryGroup: "새 산업 그룹",
    editIndustryGroup: "산업 그룹 편집",
    nameEn: "이름 (영어)",
    nameEnPlaceholder: "영어 산업 그룹 이름",
    nameEs: "이름 (스페인어)",
    nameEsPlaceholder: "스페인어 산업 그룹 이름",
    slug: "슬러그",
    slugPlaceholder: "산업-그룹-슬러그",
    slugDescription: "URL 친화적 식별자. 소문자, 숫자 및 하이픈만 사용 가능합니다.",
    descriptionEn: "설명 (영어)",
    descriptionEnPlaceholder: "영어 간단한 설명",
    descriptionEs: "설명 (스페인어)",
    descriptionEsPlaceholder: "스페인어 간단한 설명",
    fullDescriptionEn: "상세 설명 (영어)",
    fullDescriptionEnPlaceholder: "영어 상세 설명",
    fullDescriptionEs: "상세 설명 (스페인어)",
    fullDescriptionEsPlaceholder: "스페인어 상세 설명",
    icon: "아이콘 이름",
    iconPlaceholder: "Lucide 아이콘 이름 (예: Building2, Factory)",
    iconDescription: "표시할 Lucide 아이콘 이름",
    order: "표시 순서",
    orderDescription: "낮은 숫자가 먼저 표시됩니다",
    featured: "주요",
    featuredDescription: "홈페이지에서 이 산업 그룹을 강조 표시",
    save: "저장",
    cancel: "취소",
    saving: "저장 중...",
    nameColumn: "이름",
    slugColumn: "슬러그",
    orderColumn: "순서",
    featuredColumn: "주요",
    actions: "작업",
    noIndustryGroups: "아직 산업 그룹이 없습니다",
    edit: "편집",
    delete: "삭제",
    confirmDelete: "이 산업 그룹을 삭제하시겠습니까?",
    saveSuccess: "산업 그룹이 성공적으로 저장되었습니다",
    saveError: "산업 그룹 저장 실패",
    deleteSuccess: "산업 그룹이 성공적으로 삭제되었습니다",
    deleteError: "산업 그룹 삭제 실패",
    loading: "로딩 중...",
    totalGroups: "전체 산업 그룹",
    featuredGroups: "주요",
  },
  ja: {
    title: "業界グループ",
    back: "ダッシュボードに戻る",
    newIndustryGroup: "新しい業界グループ",
    editIndustryGroup: "業界グループを編集",
    nameEn: "名前（英語）",
    nameEnPlaceholder: "英語の業界グループ名",
    nameEs: "名前（スペイン語）",
    nameEsPlaceholder: "スペイン語の業界グループ名",
    slug: "スラッグ",
    slugPlaceholder: "業界グループ-スラッグ",
    slugDescription: "URL用識別子。小文字、数字、ハイフンのみ使用可能です。",
    descriptionEn: "説明（英語）",
    descriptionEnPlaceholder: "英語の簡単な説明",
    descriptionEs: "説明（スペイン語）",
    descriptionEsPlaceholder: "スペイン語の簡単な説明",
    fullDescriptionEn: "詳細説明（英語）",
    fullDescriptionEnPlaceholder: "英語の詳細説明",
    fullDescriptionEs: "詳細説明（スペイン語）",
    fullDescriptionEsPlaceholder: "スペイン語の詳細説明",
    icon: "アイコン名",
    iconPlaceholder: "Lucideアイコン名（例：Building2, Factory）",
    iconDescription: "表示するLucideアイコン名",
    order: "表示順",
    orderDescription: "小さい数字が先に表示されます",
    featured: "注目",
    featuredDescription: "ホームページでこの業界グループを目立たせて表示",
    save: "保存",
    cancel: "キャンセル",
    saving: "保存中...",
    nameColumn: "名前",
    slugColumn: "スラッグ",
    orderColumn: "順序",
    featuredColumn: "注目",
    actions: "アクション",
    noIndustryGroups: "業界グループがまだありません",
    edit: "編集",
    delete: "削除",
    confirmDelete: "この業界グループを削除してもよろしいですか？",
    saveSuccess: "業界グループが正常に保存されました",
    saveError: "業界グループの保存に失敗しました",
    deleteSuccess: "業界グループが正常に削除されました",
    deleteError: "業界グループの削除に失敗しました",
    loading: "読み込み中...",
    totalGroups: "業界グループの総数",
    featuredGroups: "注目",
  },
  ar: {
    title: "مجموعات الصناعة",
    back: "العودة إلى لوحة التحكم",
    newIndustryGroup: "مجموعة صناعية جديدة",
    editIndustryGroup: "تعديل مجموعة الصناعة",
    nameEn: "الاسم (بالإنجليزية)",
    nameEnPlaceholder: "اسم مجموعة الصناعة بالإنجليزية",
    nameEs: "الاسم (بالإسبانية)",
    nameEsPlaceholder: "اسم مجموعة الصناعة بالإسبانية",
    slug: "الرابط المختصر",
    slugPlaceholder: "رابط-مجموعة-الصناعة",
    slugDescription: "معرّف صديق للروابط. أحرف صغيرة وأرقام وشرطات فقط.",
    descriptionEn: "الوصف (بالإنجليزية)",
    descriptionEnPlaceholder: "وصف موجز بالإنجليزية",
    descriptionEs: "الوصف (بالإسبانية)",
    descriptionEsPlaceholder: "وصف موجز بالإسبانية",
    fullDescriptionEn: "الوصف الكامل (بالإنجليزية)",
    fullDescriptionEnPlaceholder: "وصف تفصيلي بالإنجليزية",
    fullDescriptionEs: "الوصف الكامل (بالإسبانية)",
    fullDescriptionEsPlaceholder: "وصف تفصيلي بالإسبانية",
    icon: "اسم الأيقونة",
    iconPlaceholder: "اسم أيقونة Lucide (مثل: Building2, Factory)",
    iconDescription: "اسم أيقونة Lucide المراد عرضها",
    order: "ترتيب العرض",
    orderDescription: "الأرقام الأصغر تظهر أولاً",
    featured: "مميز",
    featuredDescription: "عرض مجموعة الصناعة هذه بشكل بارز في الصفحة الرئيسية",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    nameColumn: "الاسم",
    slugColumn: "الرابط المختصر",
    orderColumn: "الترتيب",
    featuredColumn: "مميز",
    actions: "الإجراءات",
    noIndustryGroups: "لا توجد مجموعات صناعية حتى الآن",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد أنك تريد حذف مجموعة الصناعة هذه؟",
    saveSuccess: "تم حفظ مجموعة الصناعة بنجاح",
    saveError: "فشل في حفظ مجموعة الصناعة",
    deleteSuccess: "تم حذف مجموعة الصناعة بنجاح",
    deleteError: "فشل في حذف مجموعة الصناعة",
    loading: "جاري التحميل...",
    totalGroups: "إجمالي مجموعات الصناعة",
    featuredGroups: "المميزة",
  },
  ru: {
    title: "Отраслевые группы",
    back: "Вернуться к панели",
    newIndustryGroup: "Новая отраслевая группа",
    editIndustryGroup: "Редактировать отраслевую группу",
    nameEn: "Название (английский)",
    nameEnPlaceholder: "Название отраслевой группы на английском",
    nameEs: "Название (испанский)",
    nameEsPlaceholder: "Название отраслевой группы на испанском",
    slug: "Slug",
    slugPlaceholder: "slug-отраслевой-группы",
    slugDescription: "URL-дружественный идентификатор. Только строчные буквы, цифры и дефисы.",
    descriptionEn: "Описание (английский)",
    descriptionEnPlaceholder: "Краткое описание на английском",
    descriptionEs: "Описание (испанский)",
    descriptionEsPlaceholder: "Краткое описание на испанском",
    fullDescriptionEn: "Полное описание (английский)",
    fullDescriptionEnPlaceholder: "Подробное описание на английском",
    fullDescriptionEs: "Полное описание (испанский)",
    fullDescriptionEsPlaceholder: "Подробное описание на испанском",
    icon: "Имя иконки",
    iconPlaceholder: "Имя иконки Lucide (например: Building2, Factory)",
    iconDescription: "Имя отображаемой иконки Lucide",
    order: "Порядок отображения",
    orderDescription: "Меньшие числа отображаются первыми",
    featured: "Избранное",
    featuredDescription: "Показывать эту отраслевую группу на главной странице",
    save: "Сохранить",
    cancel: "Отмена",
    saving: "Сохранение...",
    nameColumn: "Название",
    slugColumn: "Slug",
    orderColumn: "Порядок",
    featuredColumn: "Избранное",
    actions: "Действия",
    noIndustryGroups: "Отраслевых групп пока нет",
    edit: "Редактировать",
    delete: "Удалить",
    confirmDelete: "Вы уверены, что хотите удалить эту отраслевую группу?",
    saveSuccess: "Отраслевая группа успешно сохранена",
    saveError: "Не удалось сохранить отраслевую группу",
    deleteSuccess: "Отраслевая группа успешно удалена",
    deleteError: "Не удалось удалить отраслевую группу",
    loading: "Загрузка...",
    totalGroups: "Всего отраслевых групп",
    featuredGroups: "Избранные",
  },
  fr: {
    title: "Groupes industriels",
    back: "Retour au tableau de bord",
    newIndustryGroup: "Nouveau groupe industriel",
    editIndustryGroup: "Modifier le groupe industriel",
    nameEn: "Nom (anglais)",
    nameEnPlaceholder: "Nom du groupe en anglais",
    nameEs: "Nom (espagnol)",
    nameEsPlaceholder: "Nom du groupe en espagnol",
    slug: "Slug",
    slugPlaceholder: "slug-groupe-industriel",
    slugDescription: "Identifiant compatible URL. Lettres minuscules, chiffres et tirets uniquement.",
    descriptionEn: "Description (anglais)",
    descriptionEnPlaceholder: "Brève description en anglais",
    descriptionEs: "Description (espagnol)",
    descriptionEsPlaceholder: "Brève description en espagnol",
    fullDescriptionEn: "Description complète (anglais)",
    fullDescriptionEnPlaceholder: "Description détaillée en anglais",
    fullDescriptionEs: "Description complète (espagnol)",
    fullDescriptionEsPlaceholder: "Description détaillée en espagnol",
    icon: "Nom de l'icône",
    iconPlaceholder: "Nom de l'icône Lucide (ex: Building2, Factory)",
    iconDescription: "Nom de l'icône Lucide à afficher",
    order: "Ordre d'affichage",
    orderDescription: "Les nombres plus petits apparaissent en premier",
    featured: "En vedette",
    featuredDescription: "Afficher ce groupe en évidence sur la page d'accueil",
    save: "Enregistrer",
    cancel: "Annuler",
    saving: "Enregistrement...",
    nameColumn: "Nom",
    slugColumn: "Slug",
    orderColumn: "Ordre",
    featuredColumn: "En vedette",
    actions: "Actions",
    noIndustryGroups: "Aucun groupe industriel pour le moment",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ce groupe industriel ?",
    saveSuccess: "Groupe industriel enregistré avec succès",
    saveError: "Échec de l'enregistrement du groupe industriel",
    deleteSuccess: "Groupe industriel supprimé avec succès",
    deleteError: "Échec de la suppression du groupe industriel",
    loading: "Chargement...",
    totalGroups: "Total groupes industriels",
    featuredGroups: "En vedette",
  },
  it: {
    title: "Gruppi industriali",
    back: "Torna alla dashboard",
    newIndustryGroup: "Nuovo gruppo industriale",
    editIndustryGroup: "Modifica gruppo industriale",
    nameEn: "Nome (inglese)",
    nameEnPlaceholder: "Nome del gruppo in inglese",
    nameEs: "Nome (spagnolo)",
    nameEsPlaceholder: "Nome del gruppo in spagnolo",
    slug: "Slug",
    slugPlaceholder: "slug-gruppo-industriale",
    slugDescription: "Identificatore compatibile URL. Solo lettere minuscole, numeri e trattini.",
    descriptionEn: "Descrizione (inglese)",
    descriptionEnPlaceholder: "Breve descrizione in inglese",
    descriptionEs: "Descrizione (spagnolo)",
    descriptionEsPlaceholder: "Breve descrizione in spagnolo",
    fullDescriptionEn: "Descrizione completa (inglese)",
    fullDescriptionEnPlaceholder: "Descrizione dettagliata in inglese",
    fullDescriptionEs: "Descrizione completa (spagnolo)",
    fullDescriptionEsPlaceholder: "Descrizione dettagliata in spagnolo",
    icon: "Nome icona",
    iconPlaceholder: "Nome icona Lucide (es: Building2, Factory)",
    iconDescription: "Nome dell'icona Lucide da visualizzare",
    order: "Ordine di visualizzazione",
    orderDescription: "I numeri più bassi appaiono per primi",
    featured: "In evidenza",
    featuredDescription: "Mostra questo gruppo in evidenza nella homepage",
    save: "Salva",
    cancel: "Annulla",
    saving: "Salvataggio...",
    nameColumn: "Nome",
    slugColumn: "Slug",
    orderColumn: "Ordine",
    featuredColumn: "In evidenza",
    actions: "Azioni",
    noIndustryGroups: "Nessun gruppo industriale ancora",
    edit: "Modifica",
    delete: "Elimina",
    confirmDelete: "Sei sicuro di voler eliminare questo gruppo industriale?",
    saveSuccess: "Gruppo industriale salvato con successo",
    saveError: "Impossibile salvare il gruppo industriale",
    deleteSuccess: "Gruppo industriale eliminato con successo",
    deleteError: "Impossibile eliminare il gruppo industriale",
    loading: "Caricamento...",
    totalGroups: "Totale gruppi industriali",
    featuredGroups: "In evidenza",
  },
};

const industryGroupSchema = z.object({
  name: z.string().min(1, "English name is required").max(200),
  nameEs: z.string().min(1, "Spanish name is required").max(200),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().min(1, "English description is required").max(500),
  descriptionEs: z.string().min(1, "Spanish description is required").max(500),
  fullDescription: z.string().max(5000).optional(),
  fullDescriptionEs: z.string().max(5000).optional(),
  iconName: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  imageUrl: z.string().max(500).optional(),
});

type IndustryGroupFormData = z.infer<typeof industryGroupSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminIndustryGroups() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IndustryGroup | null>(null);

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const form = useForm<IndustryGroupFormData>({
    resolver: zodResolver(industryGroupSchema),
    defaultValues: {
      name: "",
      nameEs: "",
      slug: "",
      description: "",
      descriptionEs: "",
      fullDescription: "",
      fullDescriptionEs: "",
      iconName: "",
      order: 0,
      imageUrl: "",
    },
  });

  const industryGroupsQuery = useQuery<IndustryGroup[]>({
    queryKey: ["/api/admin/industry-groups"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/industry-groups");
      if (!res.ok) throw new Error("Failed to fetch industry groups");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: IndustryGroupFormData) => {
      const url = editingGroup 
        ? `/api/admin/industry-groups/${editingGroup.id}` 
        : "/api/admin/industry-groups";
      const method = editingGroup ? "PUT" : "POST";
      
      const res = await adminApiRequest(method, url, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to save industry group");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.saveSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/industry-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/industry-groups"] });
      setIsDialogOpen(false);
      setEditingGroup(null);
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
    mutationFn: async (groupId: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/industry-groups/${groupId}`);
      if (!res.ok) throw new Error("Failed to delete industry group");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/industry-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/industry-groups"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleEdit = (group: IndustryGroup) => {
    setEditingGroup(group);
    form.reset({
      name: group.name,
      nameEs: group.nameEs,
      slug: group.slug,
      description: group.description,
      descriptionEs: group.descriptionEs,
      fullDescription: group.fullDescription || "",
      fullDescriptionEs: group.fullDescriptionEs || "",
      iconName: group.iconName || "",
      order: group.order || 0,
      imageUrl: group.imageUrl || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (groupId: string) => {
    if (window.confirm(t.confirmDelete)) {
      deleteMutation.mutate(groupId);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingGroup(null);
      form.reset();
    }
  };

  const handleNameChange = (value: string) => {
    form.setValue("name", value);
    if (!editingGroup && !form.getValues("slug")) {
      form.setValue("slug", generateSlug(value));
    }
  };

  const onSubmit = (data: IndustryGroupFormData) => {
    saveMutation.mutate(data);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg" data-testid="text-loading">{t.loading}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const industryGroups = industryGroupsQuery.data || [];
  const sortedGroups = [...industryGroups].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="min-h-screen bg-muted dark:bg-gray-900">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t.back}
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-industry-group">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.newIndustryGroup}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-dialog-title">
                    {editingGroup ? t.editIndustryGroup : t.newIndustryGroup}
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
                                rows={3}
                                data-testid="input-description-en"
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
                                rows={3}
                                data-testid="input-description-es"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.fullDescriptionEn}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t.fullDescriptionEnPlaceholder}
                                rows={4}
                                data-testid="input-full-description-en"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fullDescriptionEs"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.fullDescriptionEs}</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder={t.fullDescriptionEsPlaceholder}
                                rows={4}
                                data-testid="input-full-description-es"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="iconName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.icon}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t.iconPlaceholder}
                                data-testid="input-icon"
                              />
                            </FormControl>
                            <FormDescription>{t.iconDescription}</FormDescription>
                            <FormMessage />
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
                            <FormDescription>{t.orderDescription}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
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
                        data-testid="button-save"
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
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalGroups}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-count">
                {industryGroups.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {industryGroupsQuery.isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground" data-testid="text-no-groups">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {t.noIndustryGroups}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">{t.orderColumn}</TableHead>
                    <TableHead>{t.nameColumn}</TableHead>
                    <TableHead>{t.slugColumn}</TableHead>
                    <TableHead className="w-24 text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedGroups.map((group) => (
                    <TableRow key={group.id} data-testid={`row-industry-group-${group.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{group.order}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium" data-testid={`text-name-${group.id}`}>
                            {language === "es" ? group.nameEs : group.name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {language === "es" ? group.descriptionEs : group.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1" data-testid={`text-slug-${group.id}`}>
                          {group.slug}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(group)}
                            data-testid={`button-edit-${group.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(group.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${group.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
