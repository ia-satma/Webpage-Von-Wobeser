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
import { ArrowLeft, PlusCircle, Pencil, Trash2, Briefcase, Star, GripVertical } from "lucide-react";
import type { PracticeGroup } from "@shared/schema";

const translations = {
  en: {
    title: "Practice Groups",
    back: "Back to Dashboard",
    newPracticeGroup: "New Practice Group",
    editPracticeGroup: "Edit Practice Group",
    nameEn: "Name (English)",
    nameEnPlaceholder: "Practice group name in English",
    nameEs: "Name (Spanish)",
    nameEsPlaceholder: "Practice group name in Spanish",
    slug: "Slug",
    slugPlaceholder: "practice-group-slug",
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
    iconPlaceholder: "Lucide icon name (e.g., Scale, Building)",
    iconDescription: "Name of the Lucide icon to display",
    order: "Display Order",
    orderDescription: "Lower numbers appear first",
    featured: "Featured",
    featuredDescription: "Show this practice group prominently on the homepage",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    nameColumn: "Name",
    slugColumn: "Slug",
    orderColumn: "Order",
    featuredColumn: "Featured",
    actions: "Actions",
    noPracticeGroups: "No practice groups yet",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this practice group?",
    saveSuccess: "Practice group saved successfully",
    saveError: "Failed to save practice group",
    deleteSuccess: "Practice group deleted successfully",
    deleteError: "Failed to delete practice group",
    loading: "Loading...",
    totalGroups: "Total Practice Groups",
    featuredGroups: "Featured",
    validationNameEnRequired: "English name is required",
    validationNameEsRequired: "Spanish name is required",
    validationSlugRequired: "Slug is required",
    validationSlugFormat: "Only lowercase letters, numbers, and hyphens",
    validationDescriptionEnRequired: "English description is required",
    validationDescriptionEsRequired: "Spanish description is required",
    fetchError: "Failed to fetch practice groups",
  },
  es: {
    title: "Áreas de Práctica",
    back: "Volver al Dashboard",
    newPracticeGroup: "Nueva Área de Práctica",
    editPracticeGroup: "Editar Área de Práctica",
    nameEn: "Nombre (Inglés)",
    nameEnPlaceholder: "Nombre del área en inglés",
    nameEs: "Nombre (Español)",
    nameEsPlaceholder: "Nombre del área en español",
    slug: "Slug",
    slugPlaceholder: "slug-area-practica",
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
    iconPlaceholder: "Nombre del icono Lucide (ej: Scale, Building)",
    iconDescription: "Nombre del icono Lucide a mostrar",
    order: "Orden de Visualización",
    orderDescription: "Números menores aparecen primero",
    featured: "Destacado",
    featuredDescription: "Mostrar esta área prominentemente en la página principal",
    save: "Guardar",
    cancel: "Cancelar",
    saving: "Guardando...",
    nameColumn: "Nombre",
    slugColumn: "Slug",
    orderColumn: "Orden",
    featuredColumn: "Destacado",
    actions: "Acciones",
    noPracticeGroups: "No hay áreas de práctica aún",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Está seguro que desea eliminar esta área de práctica?",
    saveSuccess: "Área de práctica guardada exitosamente",
    saveError: "Error al guardar el área de práctica",
    deleteSuccess: "Área de práctica eliminada exitosamente",
    deleteError: "Error al eliminar el área de práctica",
    loading: "Cargando...",
    totalGroups: "Total Áreas de Práctica",
    featuredGroups: "Destacadas",
    validationNameEnRequired: "El nombre en inglés es obligatorio",
    validationNameEsRequired: "El nombre en español es obligatorio",
    validationSlugRequired: "El slug es obligatorio",
    validationSlugFormat: "Solo letras minúsculas, números y guiones",
    validationDescriptionEnRequired: "La descripción en inglés es obligatoria",
    validationDescriptionEsRequired: "La descripción en español es obligatoria",
    fetchError: "Error al cargar las áreas de práctica",
  },
  de: {
    title: "Praxisgruppen",
    back: "Zurück zum Dashboard",
    newPracticeGroup: "Neue Praxisgruppe",
    editPracticeGroup: "Praxisgruppe bearbeiten",
    nameEn: "Name (Englisch)",
    nameEnPlaceholder: "Name der Praxisgruppe auf Englisch",
    nameEs: "Name (Spanisch)",
    nameEsPlaceholder: "Name der Praxisgruppe auf Spanisch",
    slug: "Slug",
    slugPlaceholder: "praxisgruppe-slug",
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
    iconPlaceholder: "Lucide Icon-Name (z.B. Scale, Building)",
    iconDescription: "Name des anzuzeigenden Lucide-Icons",
    order: "Anzeigereihenfolge",
    orderDescription: "Niedrigere Zahlen erscheinen zuerst",
    featured: "Hervorgehoben",
    featuredDescription: "Diese Praxisgruppe prominent auf der Startseite anzeigen",
    save: "Speichern",
    cancel: "Abbrechen",
    saving: "Wird gespeichert...",
    nameColumn: "Name",
    slugColumn: "Slug",
    orderColumn: "Reihenfolge",
    featuredColumn: "Hervorgehoben",
    actions: "Aktionen",
    noPracticeGroups: "Noch keine Praxisgruppen",
    edit: "Bearbeiten",
    delete: "Löschen",
    confirmDelete: "Sind Sie sicher, dass Sie diese Praxisgruppe löschen möchten?",
    saveSuccess: "Praxisgruppe erfolgreich gespeichert",
    saveError: "Fehler beim Speichern der Praxisgruppe",
    deleteSuccess: "Praxisgruppe erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen der Praxisgruppe",
    loading: "Wird geladen...",
    totalGroups: "Gesamt Praxisgruppen",
    featuredGroups: "Hervorgehoben",
    validationNameEnRequired: "Englischer Name ist erforderlich",
    validationNameEsRequired: "Spanischer Name ist erforderlich",
    validationSlugRequired: "Slug ist erforderlich",
    validationSlugFormat: "Nur Kleinbuchstaben, Zahlen und Bindestriche",
    validationDescriptionEnRequired: "Englische Beschreibung ist erforderlich",
    validationDescriptionEsRequired: "Spanische Beschreibung ist erforderlich",
    fetchError: "Fehler beim Laden der Praxisgruppen",
  },
  zh: {
    title: "业务领域",
    back: "返回仪表板",
    newPracticeGroup: "新建业务领域",
    editPracticeGroup: "编辑业务领域",
    nameEn: "名称（英文）",
    nameEnPlaceholder: "英文业务领域名称",
    nameEs: "名称（西班牙文）",
    nameEsPlaceholder: "西班牙文业务领域名称",
    slug: "Slug",
    slugPlaceholder: "业务领域-slug",
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
    iconPlaceholder: "Lucide图标名称（如：Scale, Building）",
    iconDescription: "要显示的Lucide图标名称",
    order: "显示顺序",
    orderDescription: "较小的数字优先显示",
    featured: "精选",
    featuredDescription: "在首页突出显示此业务领域",
    save: "保存",
    cancel: "取消",
    saving: "保存中...",
    nameColumn: "名称",
    slugColumn: "Slug",
    orderColumn: "顺序",
    featuredColumn: "精选",
    actions: "操作",
    noPracticeGroups: "暂无业务领域",
    edit: "编辑",
    delete: "删除",
    confirmDelete: "您确定要删除此业务领域吗？",
    saveSuccess: "业务领域保存成功",
    saveError: "保存业务领域失败",
    deleteSuccess: "业务领域删除成功",
    deleteError: "删除业务领域失败",
    loading: "加载中...",
    totalGroups: "业务领域总数",
    featuredGroups: "精选",
    validationNameEnRequired: "英文名称为必填项",
    validationNameEsRequired: "西班牙文名称为必填项",
    validationSlugRequired: "Slug为必填项",
    validationSlugFormat: "仅限小写字母、数字和连字符",
    validationDescriptionEnRequired: "英文描述为必填项",
    validationDescriptionEsRequired: "西班牙文描述为必填项",
    fetchError: "加载业务领域失败",
  },
  ko: {
    title: "업무 분야",
    back: "대시보드로 돌아가기",
    newPracticeGroup: "새 업무 분야",
    editPracticeGroup: "업무 분야 편집",
    nameEn: "이름 (영어)",
    nameEnPlaceholder: "영어 업무 분야 이름",
    nameEs: "이름 (스페인어)",
    nameEsPlaceholder: "스페인어 업무 분야 이름",
    slug: "슬러그",
    slugPlaceholder: "업무-분야-슬러그",
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
    iconPlaceholder: "Lucide 아이콘 이름 (예: Scale, Building)",
    iconDescription: "표시할 Lucide 아이콘 이름",
    order: "표시 순서",
    orderDescription: "낮은 숫자가 먼저 표시됩니다",
    featured: "주요",
    featuredDescription: "홈페이지에서 이 업무 분야를 강조 표시",
    save: "저장",
    cancel: "취소",
    saving: "저장 중...",
    nameColumn: "이름",
    slugColumn: "슬러그",
    orderColumn: "순서",
    featuredColumn: "주요",
    actions: "작업",
    noPracticeGroups: "아직 업무 분야가 없습니다",
    edit: "편집",
    delete: "삭제",
    confirmDelete: "이 업무 분야를 삭제하시겠습니까?",
    saveSuccess: "업무 분야가 성공적으로 저장되었습니다",
    saveError: "업무 분야 저장 실패",
    deleteSuccess: "업무 분야가 성공적으로 삭제되었습니다",
    deleteError: "업무 분야 삭제 실패",
    loading: "로딩 중...",
    totalGroups: "전체 업무 분야",
    featuredGroups: "주요",
    validationNameEnRequired: "영어 이름은 필수입니다",
    validationNameEsRequired: "스페인어 이름은 필수입니다",
    validationSlugRequired: "슬러그는 필수입니다",
    validationSlugFormat: "소문자, 숫자 및 하이픈만 사용 가능",
    validationDescriptionEnRequired: "영어 설명은 필수입니다",
    validationDescriptionEsRequired: "스페인어 설명은 필수입니다",
    fetchError: "업무 분야 로드 실패",
  },
  ja: {
    title: "業務分野",
    back: "ダッシュボードに戻る",
    newPracticeGroup: "新しい業務分野",
    editPracticeGroup: "業務分野を編集",
    nameEn: "名前（英語）",
    nameEnPlaceholder: "英語の業務分野名",
    nameEs: "名前（スペイン語）",
    nameEsPlaceholder: "スペイン語の業務分野名",
    slug: "スラッグ",
    slugPlaceholder: "業務分野-スラッグ",
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
    iconPlaceholder: "Lucideアイコン名（例：Scale, Building）",
    iconDescription: "表示するLucideアイコン名",
    order: "表示順",
    orderDescription: "小さい数字が先に表示されます",
    featured: "注目",
    featuredDescription: "ホームページでこの業務分野を目立たせて表示",
    save: "保存",
    cancel: "キャンセル",
    saving: "保存中...",
    nameColumn: "名前",
    slugColumn: "スラッグ",
    orderColumn: "順序",
    featuredColumn: "注目",
    actions: "アクション",
    noPracticeGroups: "業務分野がまだありません",
    edit: "編集",
    delete: "削除",
    confirmDelete: "この業務分野を削除してもよろしいですか？",
    saveSuccess: "業務分野が正常に保存されました",
    saveError: "業務分野の保存に失敗しました",
    deleteSuccess: "業務分野が正常に削除されました",
    deleteError: "業務分野の削除に失敗しました",
    loading: "読み込み中...",
    totalGroups: "業務分野の総数",
    featuredGroups: "注目",
    validationNameEnRequired: "英語名は必須です",
    validationNameEsRequired: "スペイン語名は必須です",
    validationSlugRequired: "スラッグは必須です",
    validationSlugFormat: "小文字、数字、ハイフンのみ使用可能",
    validationDescriptionEnRequired: "英語の説明は必須です",
    validationDescriptionEsRequired: "スペイン語の説明は必須です",
    fetchError: "業務分野の読み込みに失敗しました",
  },
  ar: {
    title: "مجالات الممارسة",
    back: "العودة إلى لوحة التحكم",
    newPracticeGroup: "مجال ممارسة جديد",
    editPracticeGroup: "تعديل مجال الممارسة",
    nameEn: "الاسم (بالإنجليزية)",
    nameEnPlaceholder: "اسم مجال الممارسة بالإنجليزية",
    nameEs: "الاسم (بالإسبانية)",
    nameEsPlaceholder: "اسم مجال الممارسة بالإسبانية",
    slug: "الرابط المختصر",
    slugPlaceholder: "رابط-مجال-الممارسة",
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
    iconPlaceholder: "اسم أيقونة Lucide (مثل: Scale, Building)",
    iconDescription: "اسم أيقونة Lucide المراد عرضها",
    order: "ترتيب العرض",
    orderDescription: "الأرقام الأصغر تظهر أولاً",
    featured: "مميز",
    featuredDescription: "عرض مجال الممارسة هذا بشكل بارز في الصفحة الرئيسية",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    nameColumn: "الاسم",
    slugColumn: "الرابط المختصر",
    orderColumn: "الترتيب",
    featuredColumn: "مميز",
    actions: "الإجراءات",
    noPracticeGroups: "لا توجد مجالات ممارسة حتى الآن",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد أنك تريد حذف مجال الممارسة هذا؟",
    saveSuccess: "تم حفظ مجال الممارسة بنجاح",
    saveError: "فشل في حفظ مجال الممارسة",
    deleteSuccess: "تم حذف مجال الممارسة بنجاح",
    deleteError: "فشل في حذف مجال الممارسة",
    loading: "جاري التحميل...",
    totalGroups: "إجمالي مجالات الممارسة",
    featuredGroups: "المميزة",
    validationNameEnRequired: "الاسم بالإنجليزية مطلوب",
    validationNameEsRequired: "الاسم بالإسبانية مطلوب",
    validationSlugRequired: "الرابط المختصر مطلوب",
    validationSlugFormat: "أحرف صغيرة وأرقام وشرطات فقط",
    validationDescriptionEnRequired: "الوصف بالإنجليزية مطلوب",
    validationDescriptionEsRequired: "الوصف بالإسبانية مطلوب",
    fetchError: "فشل في تحميل مجالات الممارسة",
  },
  ru: {
    title: "Практики",
    back: "Вернуться к панели",
    newPracticeGroup: "Новая практика",
    editPracticeGroup: "Редактировать практику",
    nameEn: "Название (английский)",
    nameEnPlaceholder: "Название практики на английском",
    nameEs: "Название (испанский)",
    nameEsPlaceholder: "Название практики на испанском",
    slug: "Slug",
    slugPlaceholder: "slug-практики",
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
    iconPlaceholder: "Имя иконки Lucide (например: Scale, Building)",
    iconDescription: "Имя отображаемой иконки Lucide",
    order: "Порядок отображения",
    orderDescription: "Меньшие числа отображаются первыми",
    featured: "Избранное",
    featuredDescription: "Показывать эту практику на главной странице",
    save: "Сохранить",
    cancel: "Отмена",
    saving: "Сохранение...",
    nameColumn: "Название",
    slugColumn: "Slug",
    orderColumn: "Порядок",
    featuredColumn: "Избранное",
    actions: "Действия",
    noPracticeGroups: "Практик пока нет",
    edit: "Редактировать",
    delete: "Удалить",
    confirmDelete: "Вы уверены, что хотите удалить эту практику?",
    saveSuccess: "Практика успешно сохранена",
    saveError: "Не удалось сохранить практику",
    deleteSuccess: "Практика успешно удалена",
    deleteError: "Не удалось удалить практику",
    loading: "Загрузка...",
    totalGroups: "Всего практик",
    featuredGroups: "Избранные",
    validationNameEnRequired: "Название на английском обязательно",
    validationNameEsRequired: "Название на испанском обязательно",
    validationSlugRequired: "Slug обязателен",
    validationSlugFormat: "Только строчные буквы, цифры и дефисы",
    validationDescriptionEnRequired: "Описание на английском обязательно",
    validationDescriptionEsRequired: "Описание на испанском обязательно",
    fetchError: "Не удалось загрузить практики",
  },
  fr: {
    title: "Domaines de pratique",
    back: "Retour au tableau de bord",
    newPracticeGroup: "Nouveau domaine de pratique",
    editPracticeGroup: "Modifier le domaine de pratique",
    nameEn: "Nom (anglais)",
    nameEnPlaceholder: "Nom du domaine en anglais",
    nameEs: "Nom (espagnol)",
    nameEsPlaceholder: "Nom du domaine en espagnol",
    slug: "Slug",
    slugPlaceholder: "slug-domaine-pratique",
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
    iconPlaceholder: "Nom de l'icône Lucide (ex: Scale, Building)",
    iconDescription: "Nom de l'icône Lucide à afficher",
    order: "Ordre d'affichage",
    orderDescription: "Les nombres plus petits apparaissent en premier",
    featured: "En vedette",
    featuredDescription: "Afficher ce domaine en évidence sur la page d'accueil",
    save: "Enregistrer",
    cancel: "Annuler",
    saving: "Enregistrement...",
    nameColumn: "Nom",
    slugColumn: "Slug",
    orderColumn: "Ordre",
    featuredColumn: "En vedette",
    actions: "Actions",
    noPracticeGroups: "Aucun domaine de pratique pour le moment",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer ce domaine de pratique ?",
    saveSuccess: "Domaine de pratique enregistré avec succès",
    saveError: "Échec de l'enregistrement du domaine de pratique",
    deleteSuccess: "Domaine de pratique supprimé avec succès",
    deleteError: "Échec de la suppression du domaine de pratique",
    loading: "Chargement...",
    totalGroups: "Total domaines de pratique",
    featuredGroups: "En vedette",
    validationNameEnRequired: "Le nom en anglais est requis",
    validationNameEsRequired: "Le nom en espagnol est requis",
    validationSlugRequired: "Le slug est requis",
    validationSlugFormat: "Lettres minuscules, chiffres et tirets uniquement",
    validationDescriptionEnRequired: "La description en anglais est requise",
    validationDescriptionEsRequired: "La description en espagnol est requise",
    fetchError: "Échec du chargement des domaines de pratique",
  },
  it: {
    title: "Aree di pratica",
    back: "Torna alla dashboard",
    newPracticeGroup: "Nuova area di pratica",
    editPracticeGroup: "Modifica area di pratica",
    nameEn: "Nome (inglese)",
    nameEnPlaceholder: "Nome dell'area in inglese",
    nameEs: "Nome (spagnolo)",
    nameEsPlaceholder: "Nome dell'area in spagnolo",
    slug: "Slug",
    slugPlaceholder: "slug-area-pratica",
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
    iconPlaceholder: "Nome icona Lucide (es: Scale, Building)",
    iconDescription: "Nome dell'icona Lucide da visualizzare",
    order: "Ordine di visualizzazione",
    orderDescription: "I numeri più bassi appaiono per primi",
    featured: "In evidenza",
    featuredDescription: "Mostra questa area in evidenza nella homepage",
    save: "Salva",
    cancel: "Annulla",
    saving: "Salvataggio...",
    nameColumn: "Nome",
    slugColumn: "Slug",
    orderColumn: "Ordine",
    featuredColumn: "In evidenza",
    actions: "Azioni",
    noPracticeGroups: "Nessuna area di pratica ancora",
    edit: "Modifica",
    delete: "Elimina",
    confirmDelete: "Sei sicuro di voler eliminare questa area di pratica?",
    saveSuccess: "Area di pratica salvata con successo",
    saveError: "Impossibile salvare l'area di pratica",
    deleteSuccess: "Area di pratica eliminata con successo",
    deleteError: "Impossibile eliminare l'area di pratica",
    loading: "Caricamento...",
    totalGroups: "Totale aree di pratica",
    featuredGroups: "In evidenza",
    validationNameEnRequired: "Il nome in inglese è obbligatorio",
    validationNameEsRequired: "Il nome in spagnolo è obbligatorio",
    validationSlugRequired: "Lo slug è obbligatorio",
    validationSlugFormat: "Solo lettere minuscole, numeri e trattini",
    validationDescriptionEnRequired: "La descrizione in inglese è obbligatoria",
    validationDescriptionEsRequired: "La descrizione in spagnolo è obbligatoria",
    fetchError: "Impossibile caricare le aree di pratica",
  },
};

const createPracticeGroupSchema = (t: typeof translations.en) => z.object({
  name: z.string().min(1, t.validationNameEnRequired).max(200),
  nameEs: z.string().min(1, t.validationNameEsRequired).max(200),
  slug: z.string().min(1, t.validationSlugRequired).max(100).regex(/^[a-z0-9-]+$/, t.validationSlugFormat),
  description: z.string().min(1, t.validationDescriptionEnRequired).max(500),
  descriptionEs: z.string().min(1, t.validationDescriptionEsRequired).max(500),
  fullDescription: z.string().max(5000).optional(),
  fullDescriptionEs: z.string().max(5000).optional(),
  iconName: z.string().max(50).optional(),
  order: z.number().int().min(0).default(0),
  imageUrl: z.string().max(500).optional(),
});

type PracticeGroupFormData = z.infer<ReturnType<typeof createPracticeGroupSchema>>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminPracticeGroups() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PracticeGroup | null>(null);

  useEffect(() => {
    if (!authLoading) {
      requireAuth();
    }
  }, [authLoading, requireAuth]);

  const practiceGroupSchema = createPracticeGroupSchema(t);
  
  const form = useForm<PracticeGroupFormData>({
    resolver: zodResolver(practiceGroupSchema),
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

  const practiceGroupsQuery = useQuery<PracticeGroup[]>({
    queryKey: ["/api/admin/practice-groups"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/practice-groups");
      if (!res.ok) throw new Error(t.fetchError);
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PracticeGroupFormData) => {
      const url = editingGroup 
        ? `/api/admin/practice-groups/${editingGroup.id}` 
        : "/api/admin/practice-groups";
      const method = editingGroup ? "PUT" : "POST";
      
      const res = await adminApiRequest(method, url, data);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || t.saveError);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.saveSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/practice-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-groups"] });
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
      const res = await adminApiRequest("DELETE", `/api/admin/practice-groups/${groupId}`);
      if (!res.ok) throw new Error(t.deleteError);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.deleteSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/practice-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/practice-groups"] });
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleEdit = (group: PracticeGroup) => {
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

  const onSubmit = (data: PracticeGroupFormData) => {
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

  const practiceGroups = practiceGroupsQuery.data || [];
  const sortedGroups = [...practiceGroups].sort((a, b) => (a.order || 0) - (b.order || 0));

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
                <Briefcase className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold" data-testid="text-page-title">
                  {t.title}
                </h1>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-practice-group">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t.newPracticeGroup}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle data-testid="text-dialog-title">
                    {editingGroup ? t.editPracticeGroup : t.newPracticeGroup}
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
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-count">
                {practiceGroups.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {practiceGroupsQuery.isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedGroups.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground" data-testid="text-no-groups">
                <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                {t.noPracticeGroups}
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
                    <TableRow key={group.id} data-testid={`row-practice-group-${group.id}`}>
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
