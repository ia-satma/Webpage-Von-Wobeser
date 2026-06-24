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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, PlusCircle, Pencil, Trash2, Calendar as CalendarIcon, MapPin, Video, Users, Clock, Star, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@shared/schema";

const eventTypeOptions = [
  { value: "seminar", labelKey: "seminar" as const },
  { value: "conference", labelKey: "conference" as const },
  { value: "webinar", labelKey: "webinar" as const },
  { value: "workshop", labelKey: "workshop" as const },
] as const;

const translations = {
  en: {
    title: "Events",
    back: "Back to Dashboard",
    newEvent: "New Event",
    editEvent: "Edit Event",
    titleEn: "Title (English)",
    titleEnPlaceholder: "Event title in English",
    titleEs: "Title (Spanish)",
    titleEsPlaceholder: "Event title in Spanish",
    type: "Event Type",
    typePlaceholder: "Select event type",
    date: "Start Date",
    endDate: "End Date",
    location: "Location (English)",
    locationPlaceholder: "Event location in English",
    locationEs: "Location (Spanish)",
    locationEsPlaceholder: "Event location in Spanish",
    descriptionEn: "Description (English)",
    descriptionEnPlaceholder: "Event description in English",
    descriptionEs: "Description (Spanish)",
    descriptionEsPlaceholder: "Event description in Spanish",
    registrationUrl: "Registration URL",
    registrationUrlPlaceholder: "https://example.com/register",
    featured: "Featured",
    featuredDescription: "Show this event prominently",
    published: "Published",
    publishedDescription: "Make this event visible on the website",
    save: "Save",
    cancel: "Cancel",
    saving: "Saving...",
    dateColumn: "Date",
    titleColumn: "Title",
    typeColumn: "Type",
    locationColumn: "Location",
    statusColumn: "Status",
    actions: "Actions",
    noEvents: "No events found",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this event?",
    confirmDeleteTitle: "Delete Event",
    confirmDeleteDescription: "This action cannot be undone. This will permanently delete the event.",
    saveSuccess: "Event saved successfully",
    saveError: "Failed to save event",
    deleteSuccess: "Event deleted successfully",
    deleteError: "Failed to delete event",
    loading: "Loading...",
    totalEvents: "Total Events",
    upcoming: "Upcoming",
    filterByType: "Filter by type",
    allTypes: "All Types",
    filterByDate: "Filter by date",
    startDate: "Start date",
    endDateFilter: "End date",
    clearFilters: "Clear Filters",
    draft: "Draft",
    publishedStatus: "Published",
    seminar: "Seminar",
    conference: "Conference",
    webinar: "Webinar",
    workshop: "Workshop",
  },
  es: {
    title: "Eventos",
    back: "Volver al Dashboard",
    newEvent: "Nuevo Evento",
    editEvent: "Editar Evento",
    titleEn: "Título (Inglés)",
    titleEnPlaceholder: "Título del evento en inglés",
    titleEs: "Título (Español)",
    titleEsPlaceholder: "Título del evento en español",
    type: "Tipo de Evento",
    typePlaceholder: "Seleccionar tipo de evento",
    date: "Fecha de Inicio",
    endDate: "Fecha de Fin",
    location: "Ubicación (Inglés)",
    locationPlaceholder: "Ubicación del evento en inglés",
    locationEs: "Ubicación (Español)",
    locationEsPlaceholder: "Ubicación del evento en español",
    descriptionEn: "Descripción (Inglés)",
    descriptionEnPlaceholder: "Descripción del evento en inglés",
    descriptionEs: "Descripción (Español)",
    descriptionEsPlaceholder: "Descripción del evento en español",
    registrationUrl: "URL de Registro",
    registrationUrlPlaceholder: "https://ejemplo.com/registro",
    featured: "Destacado",
    featuredDescription: "Mostrar este evento prominentemente",
    published: "Publicado",
    publishedDescription: "Hacer visible este evento en el sitio web",
    save: "Guardar",
    cancel: "Cancelar",
    saving: "Guardando...",
    dateColumn: "Fecha",
    titleColumn: "Título",
    typeColumn: "Tipo",
    locationColumn: "Ubicación",
    statusColumn: "Estado",
    actions: "Acciones",
    noEvents: "No se encontraron eventos",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Está seguro que desea eliminar este evento?",
    confirmDeleteTitle: "Eliminar Evento",
    confirmDeleteDescription: "Esta acción no se puede deshacer. Esto eliminará permanentemente el evento.",
    saveSuccess: "Evento guardado exitosamente",
    saveError: "Error al guardar el evento",
    deleteSuccess: "Evento eliminado exitosamente",
    deleteError: "Error al eliminar el evento",
    loading: "Cargando...",
    totalEvents: "Total Eventos",
    upcoming: "Próximos",
    filterByType: "Filtrar por tipo",
    allTypes: "Todos los Tipos",
    filterByDate: "Filtrar por fecha",
    startDate: "Fecha inicio",
    endDateFilter: "Fecha fin",
    clearFilters: "Limpiar Filtros",
    draft: "Borrador",
    publishedStatus: "Publicado",
    seminar: "Seminario",
    conference: "Conferencia",
    webinar: "Webinar",
    workshop: "Taller",
  },
  de: {
    title: "Veranstaltungen",
    back: "Zurück zum Dashboard",
    newEvent: "Neue Veranstaltung",
    editEvent: "Veranstaltung bearbeiten",
    titleEn: "Titel (Englisch)",
    titleEnPlaceholder: "Veranstaltungstitel auf Englisch",
    titleEs: "Titel (Spanisch)",
    titleEsPlaceholder: "Veranstaltungstitel auf Spanisch",
    type: "Veranstaltungstyp",
    typePlaceholder: "Veranstaltungstyp auswählen",
    date: "Startdatum",
    endDate: "Enddatum",
    location: "Ort (Englisch)",
    locationPlaceholder: "Veranstaltungsort auf Englisch",
    locationEs: "Ort (Spanisch)",
    locationEsPlaceholder: "Veranstaltungsort auf Spanisch",
    descriptionEn: "Beschreibung (Englisch)",
    descriptionEnPlaceholder: "Veranstaltungsbeschreibung auf Englisch",
    descriptionEs: "Beschreibung (Spanisch)",
    descriptionEsPlaceholder: "Veranstaltungsbeschreibung auf Spanisch",
    registrationUrl: "Registrierungs-URL",
    registrationUrlPlaceholder: "https://beispiel.com/registrieren",
    featured: "Hervorgehoben",
    featuredDescription: "Diese Veranstaltung prominent anzeigen",
    published: "Veröffentlicht",
    publishedDescription: "Diese Veranstaltung auf der Website sichtbar machen",
    save: "Speichern",
    cancel: "Abbrechen",
    saving: "Wird gespeichert...",
    dateColumn: "Datum",
    titleColumn: "Titel",
    typeColumn: "Typ",
    locationColumn: "Ort",
    statusColumn: "Status",
    actions: "Aktionen",
    noEvents: "Keine Veranstaltungen gefunden",
    edit: "Bearbeiten",
    delete: "Löschen",
    confirmDelete: "Sind Sie sicher, dass Sie diese Veranstaltung löschen möchten?",
    confirmDeleteTitle: "Veranstaltung löschen",
    confirmDeleteDescription: "Diese Aktion kann nicht rückgängig gemacht werden. Die Veranstaltung wird dauerhaft gelöscht.",
    saveSuccess: "Veranstaltung erfolgreich gespeichert",
    saveError: "Fehler beim Speichern der Veranstaltung",
    deleteSuccess: "Veranstaltung erfolgreich gelöscht",
    deleteError: "Fehler beim Löschen der Veranstaltung",
    loading: "Wird geladen...",
    totalEvents: "Gesamt Veranstaltungen",
    upcoming: "Kommende",
    filterByType: "Nach Typ filtern",
    allTypes: "Alle Typen",
    filterByDate: "Nach Datum filtern",
    startDate: "Startdatum",
    endDateFilter: "Enddatum",
    clearFilters: "Filter löschen",
    draft: "Entwurf",
    publishedStatus: "Veröffentlicht",
    seminar: "Seminar",
    conference: "Konferenz",
    webinar: "Webinar",
    workshop: "Workshop",
  },
  zh: {
    title: "活动",
    back: "返回仪表板",
    newEvent: "新建活动",
    editEvent: "编辑活动",
    titleEn: "标题（英文）",
    titleEnPlaceholder: "英文活动标题",
    titleEs: "标题（西班牙文）",
    titleEsPlaceholder: "西班牙文活动标题",
    type: "活动类型",
    typePlaceholder: "选择活动类型",
    date: "开始日期",
    endDate: "结束日期",
    location: "地点（英文）",
    locationPlaceholder: "英文活动地点",
    locationEs: "地点（西班牙文）",
    locationEsPlaceholder: "西班牙文活动地点",
    descriptionEn: "描述（英文）",
    descriptionEnPlaceholder: "英文活动描述",
    descriptionEs: "描述（西班牙文）",
    descriptionEsPlaceholder: "西班牙文活动描述",
    registrationUrl: "报名链接",
    registrationUrlPlaceholder: "https://example.com/register",
    featured: "精选",
    featuredDescription: "突出显示此活动",
    published: "已发布",
    publishedDescription: "在网站上显示此活动",
    save: "保存",
    cancel: "取消",
    saving: "保存中...",
    dateColumn: "日期",
    titleColumn: "标题",
    typeColumn: "类型",
    locationColumn: "地点",
    statusColumn: "状态",
    actions: "操作",
    noEvents: "未找到活动",
    edit: "编辑",
    delete: "删除",
    confirmDelete: "您确定要删除此活动吗？",
    confirmDeleteTitle: "删除活动",
    confirmDeleteDescription: "此操作无法撤销。这将永久删除该活动。",
    saveSuccess: "活动保存成功",
    saveError: "保存活动失败",
    deleteSuccess: "活动删除成功",
    deleteError: "删除活动失败",
    loading: "加载中...",
    totalEvents: "活动总数",
    upcoming: "即将举行",
    filterByType: "按类型筛选",
    allTypes: "所有类型",
    filterByDate: "按日期筛选",
    startDate: "开始日期",
    endDateFilter: "结束日期",
    clearFilters: "清除筛选",
    draft: "草稿",
    publishedStatus: "已发布",
    seminar: "研讨会",
    conference: "会议",
    webinar: "网络研讨会",
    workshop: "工作坊",
  },
  ko: {
    title: "이벤트",
    back: "대시보드로 돌아가기",
    newEvent: "새 이벤트",
    editEvent: "이벤트 편집",
    titleEn: "제목 (영어)",
    titleEnPlaceholder: "영어 이벤트 제목",
    titleEs: "제목 (스페인어)",
    titleEsPlaceholder: "스페인어 이벤트 제목",
    type: "이벤트 유형",
    typePlaceholder: "이벤트 유형 선택",
    date: "시작일",
    endDate: "종료일",
    location: "장소 (영어)",
    locationPlaceholder: "영어 이벤트 장소",
    locationEs: "장소 (스페인어)",
    locationEsPlaceholder: "스페인어 이벤트 장소",
    descriptionEn: "설명 (영어)",
    descriptionEnPlaceholder: "영어 이벤트 설명",
    descriptionEs: "설명 (스페인어)",
    descriptionEsPlaceholder: "스페인어 이벤트 설명",
    registrationUrl: "등록 URL",
    registrationUrlPlaceholder: "https://example.com/register",
    featured: "주요",
    featuredDescription: "이 이벤트를 강조 표시",
    published: "게시됨",
    publishedDescription: "웹사이트에서 이 이벤트를 표시",
    save: "저장",
    cancel: "취소",
    saving: "저장 중...",
    dateColumn: "날짜",
    titleColumn: "제목",
    typeColumn: "유형",
    locationColumn: "장소",
    statusColumn: "상태",
    actions: "작업",
    noEvents: "이벤트를 찾을 수 없습니다",
    edit: "편집",
    delete: "삭제",
    confirmDelete: "이 이벤트를 삭제하시겠습니까?",
    confirmDeleteTitle: "이벤트 삭제",
    confirmDeleteDescription: "이 작업은 취소할 수 없습니다. 이벤트가 영구적으로 삭제됩니다.",
    saveSuccess: "이벤트가 성공적으로 저장되었습니다",
    saveError: "이벤트 저장 실패",
    deleteSuccess: "이벤트가 성공적으로 삭제되었습니다",
    deleteError: "이벤트 삭제 실패",
    loading: "로딩 중...",
    totalEvents: "전체 이벤트",
    upcoming: "예정된",
    filterByType: "유형별 필터",
    allTypes: "모든 유형",
    filterByDate: "날짜별 필터",
    startDate: "시작일",
    endDateFilter: "종료일",
    clearFilters: "필터 지우기",
    draft: "초안",
    publishedStatus: "게시됨",
    seminar: "세미나",
    conference: "컨퍼런스",
    webinar: "웨비나",
    workshop: "워크숍",
  },
  ja: {
    title: "イベント",
    back: "ダッシュボードに戻る",
    newEvent: "新しいイベント",
    editEvent: "イベントを編集",
    titleEn: "タイトル（英語）",
    titleEnPlaceholder: "英語のイベントタイトル",
    titleEs: "タイトル（スペイン語）",
    titleEsPlaceholder: "スペイン語のイベントタイトル",
    type: "イベントタイプ",
    typePlaceholder: "イベントタイプを選択",
    date: "開始日",
    endDate: "終了日",
    location: "場所（英語）",
    locationPlaceholder: "英語のイベント場所",
    locationEs: "場所（スペイン語）",
    locationEsPlaceholder: "スペイン語のイベント場所",
    descriptionEn: "説明（英語）",
    descriptionEnPlaceholder: "英語のイベント説明",
    descriptionEs: "説明（スペイン語）",
    descriptionEsPlaceholder: "スペイン語のイベント説明",
    registrationUrl: "登録URL",
    registrationUrlPlaceholder: "https://example.com/register",
    featured: "注目",
    featuredDescription: "このイベントを目立たせて表示",
    published: "公開",
    publishedDescription: "このイベントをウェブサイトに表示",
    save: "保存",
    cancel: "キャンセル",
    saving: "保存中...",
    dateColumn: "日付",
    titleColumn: "タイトル",
    typeColumn: "タイプ",
    locationColumn: "場所",
    statusColumn: "ステータス",
    actions: "アクション",
    noEvents: "イベントが見つかりません",
    edit: "編集",
    delete: "削除",
    confirmDelete: "このイベントを削除してもよろしいですか？",
    confirmDeleteTitle: "イベント削除",
    confirmDeleteDescription: "この操作は元に戻せません。イベントは完全に削除されます。",
    saveSuccess: "イベントが正常に保存されました",
    saveError: "イベントの保存に失敗しました",
    deleteSuccess: "イベントが正常に削除されました",
    deleteError: "イベントの削除に失敗しました",
    loading: "読み込み中...",
    totalEvents: "イベント総数",
    upcoming: "今後の",
    filterByType: "タイプでフィルター",
    allTypes: "すべてのタイプ",
    filterByDate: "日付でフィルター",
    startDate: "開始日",
    endDateFilter: "終了日",
    clearFilters: "フィルターをクリア",
    draft: "下書き",
    publishedStatus: "公開中",
    seminar: "セミナー",
    conference: "カンファレンス",
    webinar: "ウェビナー",
    workshop: "ワークショップ",
  },
  ar: {
    title: "الفعاليات",
    back: "العودة إلى لوحة التحكم",
    newEvent: "فعالية جديدة",
    editEvent: "تعديل الفعالية",
    titleEn: "العنوان (بالإنجليزية)",
    titleEnPlaceholder: "عنوان الفعالية بالإنجليزية",
    titleEs: "العنوان (بالإسبانية)",
    titleEsPlaceholder: "عنوان الفعالية بالإسبانية",
    type: "نوع الفعالية",
    typePlaceholder: "اختر نوع الفعالية",
    date: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    location: "الموقع (بالإنجليزية)",
    locationPlaceholder: "موقع الفعالية بالإنجليزية",
    locationEs: "الموقع (بالإسبانية)",
    locationEsPlaceholder: "موقع الفعالية بالإسبانية",
    descriptionEn: "الوصف (بالإنجليزية)",
    descriptionEnPlaceholder: "وصف الفعالية بالإنجليزية",
    descriptionEs: "الوصف (بالإسبانية)",
    descriptionEsPlaceholder: "وصف الفعالية بالإسبانية",
    registrationUrl: "رابط التسجيل",
    registrationUrlPlaceholder: "https://example.com/register",
    featured: "مميز",
    featuredDescription: "عرض هذه الفعالية بشكل بارز",
    published: "منشور",
    publishedDescription: "جعل هذه الفعالية مرئية على الموقع",
    save: "حفظ",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    dateColumn: "التاريخ",
    titleColumn: "العنوان",
    typeColumn: "النوع",
    locationColumn: "الموقع",
    statusColumn: "الحالة",
    actions: "الإجراءات",
    noEvents: "لم يتم العثور على فعاليات",
    edit: "تعديل",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد أنك تريد حذف هذه الفعالية؟",
    confirmDeleteTitle: "حذف الفعالية",
    confirmDeleteDescription: "لا يمكن التراجع عن هذا الإجراء. سيتم حذف الفعالية نهائياً.",
    saveSuccess: "تم حفظ الفعالية بنجاح",
    saveError: "فشل في حفظ الفعالية",
    deleteSuccess: "تم حذف الفعالية بنجاح",
    deleteError: "فشل في حذف الفعالية",
    loading: "جاري التحميل...",
    totalEvents: "إجمالي الفعاليات",
    upcoming: "القادمة",
    filterByType: "تصفية حسب النوع",
    allTypes: "جميع الأنواع",
    filterByDate: "تصفية حسب التاريخ",
    startDate: "تاريخ البدء",
    endDateFilter: "تاريخ الانتهاء",
    clearFilters: "مسح المرشحات",
    draft: "مسودة",
    publishedStatus: "منشور",
    seminar: "ندوة",
    conference: "مؤتمر",
    webinar: "ندوة عبر الإنترنت",
    workshop: "ورشة عمل",
  },
  ru: {
    title: "Мероприятия",
    back: "Вернуться к панели",
    newEvent: "Новое мероприятие",
    editEvent: "Редактировать мероприятие",
    titleEn: "Название (английский)",
    titleEnPlaceholder: "Название мероприятия на английском",
    titleEs: "Название (испанский)",
    titleEsPlaceholder: "Название мероприятия на испанском",
    type: "Тип мероприятия",
    typePlaceholder: "Выберите тип мероприятия",
    date: "Дата начала",
    endDate: "Дата окончания",
    location: "Место (английский)",
    locationPlaceholder: "Место мероприятия на английском",
    locationEs: "Место (испанский)",
    locationEsPlaceholder: "Место мероприятия на испанском",
    descriptionEn: "Описание (английский)",
    descriptionEnPlaceholder: "Описание мероприятия на английском",
    descriptionEs: "Описание (испанский)",
    descriptionEsPlaceholder: "Описание мероприятия на испанском",
    registrationUrl: "URL регистрации",
    registrationUrlPlaceholder: "https://example.com/register",
    featured: "Избранное",
    featuredDescription: "Показывать это мероприятие на видном месте",
    published: "Опубликовано",
    publishedDescription: "Сделать это мероприятие видимым на сайте",
    save: "Сохранить",
    cancel: "Отмена",
    saving: "Сохранение...",
    dateColumn: "Дата",
    titleColumn: "Название",
    typeColumn: "Тип",
    locationColumn: "Место",
    statusColumn: "Статус",
    actions: "Действия",
    noEvents: "Мероприятия не найдены",
    edit: "Редактировать",
    delete: "Удалить",
    confirmDelete: "Вы уверены, что хотите удалить это мероприятие?",
    confirmDeleteTitle: "Удалить мероприятие",
    confirmDeleteDescription: "Это действие нельзя отменить. Мероприятие будет удалено навсегда.",
    saveSuccess: "Мероприятие успешно сохранено",
    saveError: "Не удалось сохранить мероприятие",
    deleteSuccess: "Мероприятие успешно удалено",
    deleteError: "Не удалось удалить мероприятие",
    loading: "Загрузка...",
    totalEvents: "Всего мероприятий",
    upcoming: "Предстоящие",
    filterByType: "Фильтр по типу",
    allTypes: "Все типы",
    filterByDate: "Фильтр по дате",
    startDate: "Дата начала",
    endDateFilter: "Дата окончания",
    clearFilters: "Очистить фильтры",
    draft: "Черновик",
    publishedStatus: "Опубликовано",
    seminar: "Семинар",
    conference: "Конференция",
    webinar: "Вебинар",
    workshop: "Воркшоп",
  },
  fr: {
    title: "Événements",
    back: "Retour au tableau de bord",
    newEvent: "Nouvel événement",
    editEvent: "Modifier l'événement",
    titleEn: "Titre (anglais)",
    titleEnPlaceholder: "Titre de l'événement en anglais",
    titleEs: "Titre (espagnol)",
    titleEsPlaceholder: "Titre de l'événement en espagnol",
    type: "Type d'événement",
    typePlaceholder: "Sélectionner le type d'événement",
    date: "Date de début",
    endDate: "Date de fin",
    location: "Lieu (anglais)",
    locationPlaceholder: "Lieu de l'événement en anglais",
    locationEs: "Lieu (espagnol)",
    locationEsPlaceholder: "Lieu de l'événement en espagnol",
    descriptionEn: "Description (anglais)",
    descriptionEnPlaceholder: "Description de l'événement en anglais",
    descriptionEs: "Description (espagnol)",
    descriptionEsPlaceholder: "Description de l'événement en espagnol",
    registrationUrl: "URL d'inscription",
    registrationUrlPlaceholder: "https://exemple.com/inscription",
    featured: "En vedette",
    featuredDescription: "Afficher cet événement en évidence",
    published: "Publié",
    publishedDescription: "Rendre cet événement visible sur le site",
    save: "Enregistrer",
    cancel: "Annuler",
    saving: "Enregistrement...",
    dateColumn: "Date",
    titleColumn: "Titre",
    typeColumn: "Type",
    locationColumn: "Lieu",
    statusColumn: "Statut",
    actions: "Actions",
    noEvents: "Aucun événement trouvé",
    edit: "Modifier",
    delete: "Supprimer",
    confirmDelete: "Êtes-vous sûr de vouloir supprimer cet événement ?",
    confirmDeleteTitle: "Supprimer l'événement",
    confirmDeleteDescription: "Cette action est irréversible. L'événement sera définitivement supprimé.",
    saveSuccess: "Événement enregistré avec succès",
    saveError: "Échec de l'enregistrement de l'événement",
    deleteSuccess: "Événement supprimé avec succès",
    deleteError: "Échec de la suppression de l'événement",
    loading: "Chargement...",
    totalEvents: "Total événements",
    upcoming: "À venir",
    filterByType: "Filtrer par type",
    allTypes: "Tous les types",
    filterByDate: "Filtrer par date",
    startDate: "Date de début",
    endDateFilter: "Date de fin",
    clearFilters: "Effacer les filtres",
    draft: "Brouillon",
    publishedStatus: "Publié",
    seminar: "Séminaire",
    conference: "Conférence",
    webinar: "Webinaire",
    workshop: "Atelier",
  },
  it: {
    title: "Eventi",
    back: "Torna alla dashboard",
    newEvent: "Nuovo evento",
    editEvent: "Modifica evento",
    titleEn: "Titolo (inglese)",
    titleEnPlaceholder: "Titolo dell'evento in inglese",
    titleEs: "Titolo (spagnolo)",
    titleEsPlaceholder: "Titolo dell'evento in spagnolo",
    type: "Tipo di evento",
    typePlaceholder: "Seleziona il tipo di evento",
    date: "Data di inizio",
    endDate: "Data di fine",
    location: "Luogo (inglese)",
    locationPlaceholder: "Luogo dell'evento in inglese",
    locationEs: "Luogo (spagnolo)",
    locationEsPlaceholder: "Luogo dell'evento in spagnolo",
    descriptionEn: "Descrizione (inglese)",
    descriptionEnPlaceholder: "Descrizione dell'evento in inglese",
    descriptionEs: "Descrizione (spagnolo)",
    descriptionEsPlaceholder: "Descrizione dell'evento in spagnolo",
    registrationUrl: "URL di registrazione",
    registrationUrlPlaceholder: "https://esempio.com/registrazione",
    featured: "In evidenza",
    featuredDescription: "Mostra questo evento in evidenza",
    published: "Pubblicato",
    publishedDescription: "Rendi questo evento visibile sul sito",
    save: "Salva",
    cancel: "Annulla",
    saving: "Salvataggio...",
    dateColumn: "Data",
    titleColumn: "Titolo",
    typeColumn: "Tipo",
    locationColumn: "Luogo",
    statusColumn: "Stato",
    actions: "Azioni",
    noEvents: "Nessun evento trovato",
    edit: "Modifica",
    delete: "Elimina",
    confirmDelete: "Sei sicuro di voler eliminare questo evento?",
    confirmDeleteTitle: "Elimina evento",
    confirmDeleteDescription: "Questa azione non può essere annullata. L'evento verrà eliminato definitivamente.",
    saveSuccess: "Evento salvato con successo",
    saveError: "Impossibile salvare l'evento",
    deleteSuccess: "Evento eliminato con successo",
    deleteError: "Impossibile eliminare l'evento",
    loading: "Caricamento...",
    totalEvents: "Totale eventi",
    upcoming: "Prossimi",
    filterByType: "Filtra per tipo",
    allTypes: "Tutti i tipi",
    filterByDate: "Filtra per data",
    startDate: "Data di inizio",
    endDateFilter: "Data di fine",
    clearFilters: "Cancella filtri",
    draft: "Bozza",
    publishedStatus: "Pubblicato",
    seminar: "Seminario",
    conference: "Conferenza",
    webinar: "Webinar",
    workshop: "Workshop",
  },
};

const eventSchema = z.object({
  title: z.string().min(1, "English title is required").max(200),
  titleEs: z.string().min(1, "Spanish title is required").max(200),
  eventType: z.string().min(1, "Event type is required"),
  date: z.date({ required_error: "Start date is required" }),
  endDate: z.date().optional().nullable(),
  location: z.string().max(200).optional(),
  locationEs: z.string().max(200).optional(),
  description: z.string().min(1, "English description is required").max(5000),
  descriptionEs: z.string().min(1, "Spanish description is required").max(5000),
  externalUrl: z.string().url().optional().or(z.literal("")),
  isHighlight: z.boolean().default(false),
  published: z.boolean().default(true),
});

type EventFormData = z.infer<typeof eventSchema>;

export default function AdminEvents() {
  const { language } = useLanguage();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();

  const t = translations[language as keyof typeof translations] || translations.en;

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      titleEs: "",
      eventType: "conference",
      date: new Date(),
      endDate: null,
      location: "",
      locationEs: "",
      description: "",
      descriptionEs: "",
      externalUrl: "",
      isHighlight: false,
      published: true,
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
    // queryFn explícito: adminApiRequest adjunta el token Bearer que exige
    // authMiddleware en /api/admin/events. Sin él, el queryFn por defecto omite
    // el token y la ruta responde 401, por lo que la lista nunca cargaba.
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const payload = {
        ...data,
        date: data.date.toISOString(),
        endDate: data.endDate ? data.endDate.toISOString() : null,
        externalUrl: data.externalUrl || null,
        location: data.location || null,
        locationEs: data.locationEs || null,
      };
      
      if (editingEvent) {
        const res = await adminApiRequest("PUT", `/api/admin/events/${editingEvent.id}`, payload);
        if (!res.ok) throw new Error("Failed to update event");
        return res.json();
      } else {
        const res = await adminApiRequest("POST", "/api/admin/events", payload);
        if (!res.ok) throw new Error("Failed to create event");
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: t.saveSuccess });
      setIsDialogOpen(false);
      setEditingEvent(null);
      form.reset();
    },
    onError: () => {
      toast({ title: t.saveError, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/events/${id}`);
      if (!res.ok) throw new Error("Failed to delete event");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: t.deleteSuccess });
      setDeleteDialogOpen(false);
      setEventToDelete(null);
    },
    onError: () => {
      toast({ title: t.deleteError, variant: "destructive" });
    },
  });

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    form.reset({
      title: event.title,
      titleEs: event.titleEs,
      eventType: event.eventType || "conference",
      date: event.date ? new Date(event.date) : new Date(),
      endDate: event.endDate ? new Date(event.endDate) : null,
      location: event.location || "",
      locationEs: event.locationEs || "",
      description: event.description,
      descriptionEs: event.descriptionEs,
      externalUrl: event.externalUrl || "",
      isHighlight: event.isHighlight || false,
      published: event.published ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (eventToDelete) {
      deleteMutation.mutate(eventToDelete.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingEvent(null);
    form.reset();
  };

  const clearFilters = () => {
    setFilterType("all");
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
  };

  const filteredEvents = events
    ?.filter((event) => {
      if (filterType !== "all" && event.eventType !== filterType) return false;
      if (filterStartDate && event.date && new Date(event.date) < filterStartDate) return false;
      if (filterEndDate && event.date && new Date(event.date) > filterEndDate) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    }) || [];

  const upcomingCount = events?.filter((e) => e.date && new Date(e.date) >= new Date()).length || 0;

  const getEventTypeLabel = (type: string | null) => {
    const typeKey = type as keyof typeof t;
    if (typeKey && t[typeKey]) {
      return t[typeKey] as string;
    }
    return type || "";
  };

  const getEventTypeIcon = (type: string | null) => {
    switch (type) {
      case "webinar":
        return <Video className="h-4 w-4" />;
      case "conference":
      case "seminar":
        return <Users className="h-4 w-4" />;
      case "workshop":
        return <Clock className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="admin-events-page">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.title}</h1>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingEvent(null);
                  form.reset();
                }}
                className="bg-primary hover:bg-[#8B1525] rounded-none"
                data-testid="button-new-event"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                {t.newEvent}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none">
              <DialogHeader>
                <DialogTitle data-testid="text-dialog-title">
                  {editingEvent ? t.editEvent : t.newEvent}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.titleEn}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.titleEnPlaceholder}
                              className="rounded-none"
                              data-testid="input-title"
                            />
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
                            <Input
                              {...field}
                              placeholder={t.titleEsPlaceholder}
                              className="rounded-none"
                              data-testid="input-title-es"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.type}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none" data-testid="select-event-type">
                              <SelectValue placeholder={t.typePlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {t[option.labelKey]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t.date}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal rounded-none"
                                  data-testid="button-date-picker"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : t.date}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>{t.endDate}</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal rounded-none"
                                  data-testid="button-end-date-picker"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : t.endDate}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.location}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.locationPlaceholder}
                              className="rounded-none"
                              data-testid="input-location"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="locationEs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.locationEs}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t.locationEsPlaceholder}
                              className="rounded-none"
                              data-testid="input-location-es"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                            className="rounded-none min-h-[100px]"
                            data-testid="textarea-description"
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
                            className="rounded-none min-h-[100px]"
                            data-testid="textarea-description-es"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="externalUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.registrationUrl}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t.registrationUrlPlaceholder}
                            className="rounded-none"
                            data-testid="input-registration-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="isHighlight"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-none">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">{t.featured}</FormLabel>
                            <FormDescription>{t.featuredDescription}</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-featured"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between p-4 border rounded-none">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">{t.published}</FormLabel>
                            <FormDescription>{t.publishedDescription}</FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-published"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDialogClose}
                      className="rounded-none"
                      data-testid="button-cancel"
                    >
                      {t.cancel}
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="bg-primary hover:bg-[#8B1525] rounded-none"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.totalEvents}</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-events">
                {events?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
              <CardTitle className="text-sm font-medium">{t.upcoming}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-upcoming-events">
                {upcomingCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-none">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full sm:w-[180px] rounded-none" data-testid="select-filter-type">
                  <SelectValue placeholder={t.filterByType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.allTypes}</SelectItem>
                  {eventTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t[option.labelKey]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-none" data-testid="button-filter-start-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, "PP") : t.startDate}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="rounded-none" data-testid="button-filter-end-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, "PP") : t.endDateFilter}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {(filterType !== "all" || filterStartDate || filterEndDate) && (
                  <Button variant="ghost" onClick={clearFilters} className="rounded-none" data-testid="button-clear-filters">
                    {t.clearFilters}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8" data-testid="text-no-events">
                {t.noEvents}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.dateColumn}</TableHead>
                      <TableHead>{t.titleColumn}</TableHead>
                      <TableHead>{t.typeColumn}</TableHead>
                      <TableHead>{t.locationColumn}</TableHead>
                      <TableHead>{t.statusColumn}</TableHead>
                      <TableHead className="text-right">{t.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.id} data-testid={`row-event-${event.id}`}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            {event.date ? format(new Date(event.date), "PP") : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {event.isHighlight && <Star className="h-4 w-4 text-yellow-500" />}
                            <span className="font-medium" data-testid={`text-event-title-${event.id}`}>
                              {language === "es" ? event.titleEs : event.title}
                            </span>
                            {event.externalUrl && (
                              <a
                                href={event.externalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-none gap-1">
                            {getEventTypeIcon(event.eventType)}
                            {getEventTypeLabel(event.eventType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {language === "es"
                                ? event.locationEs || event.location || "-"
                                : event.location || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={event.published ? "default" : "secondary"}
                            className="rounded-none"
                          >
                            {event.published ? t.publishedStatus : t.draft}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(event)}
                              data-testid={`button-edit-${event.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(event)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${event.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="rounded-none">
            <DialogHeader>
              <DialogTitle data-testid="text-delete-dialog-title">{t.confirmDeleteTitle}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground" data-testid="text-delete-dialog-description">
              {t.confirmDeleteDescription}
            </p>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                className="rounded-none"
                data-testid="button-cancel-delete"
              >
                {t.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="rounded-none"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? t.loading : t.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
