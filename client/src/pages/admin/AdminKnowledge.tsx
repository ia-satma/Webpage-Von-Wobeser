import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth, adminApiRequest } from "@/lib/adminAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  BookOpen,
  Brain, 
  Languages,
  Plus,
  Search,
  RefreshCw,
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Tag,
  Clock,
  BarChart3,
  Filter
} from "lucide-react";
import { Link, useLocation } from "wouter";

const translations = {
  en: {
    title: "Knowledge Base Management",
    subtitle: "Manage AI agent knowledge documents for translation, legal glossary, and workflows",
    checkingAuth: "Checking authentication...",
    refresh: "Refresh",
    bulkUpload: "Bulk Upload",
    addDocument: "Add Document",
    searchDocuments: "Search documents...",
    filterByCategory: "Filter by category",
    filterByAgent: "Filter by agent",
    allCategories: "All Categories",
    allAgents: "All Agents",
    all: "All",
    knowledgeDocuments: "Knowledge Documents",
    documentsFound: "document(s) found",
    noDocumentsFound: "No knowledge documents found. Click \"Add Document\" to create one.",
    titleKey: "Title/Key",
    category: "Category",
    agent: "Agent",
    language: "Language",
    usage: "Usage",
    updated: "Updated",
    actions: "Actions",
    addKnowledgeDocument: "Add Knowledge Document",
    addDocumentDescription: "Create a new knowledge document for AI agents to learn from.",
    editKnowledgeDocument: "Edit Knowledge Document",
    editDocumentDescription: "Update the knowledge document information.",
    selectCategory: "Select category",
    selectAgent: "Select agent",
    selectLanguage: "Select language",
    agentType: "Agent Type",
    contentValue: "Content / Value",
    contentPlaceholder: "Enter the knowledge content, definition, or pattern...",
    titlePlaceholder: "e.g., 'due_diligence' or 'Translation Pattern: Legal Terms'",
    languageOptional: "Language (optional)",
    none: "None",
    confidence: "Confidence (0-100)",
    cancel: "Cancel",
    createDocument: "Create Document",
    updateDocument: "Update Document",
    bulkUploadKnowledge: "Bulk Upload Knowledge",
    bulkUploadDescription: "Upload multiple knowledge entries at once. Format: one entry per line, use pipe (|) to separate key and value.",
    dataKeyValuePerLine: "Data (key|value per line)",
    uploadAll: "Upload All",
    deleteKnowledgeDocument: "Delete Knowledge Document",
    deleteConfirmation: "Are you sure you want to delete",
    deleteWarning: "This action cannot be undone.",
    delete: "Delete",
    documentCreated: "Knowledge document created",
    documentUpdated: "Knowledge document updated",
    documentDeleted: "Knowledge document deleted",
    createFailed: "Failed to create document",
    updateFailed: "Failed to update document",
    deleteFailed: "Failed to delete document",
    bulkUploadComplete: "Bulk upload complete",
    documentsCreated: "documents created",
    bulkUploadFailed: "Bulk upload failed",
    legalGlossary: "Legal Glossary",
    translationPattern: "Translation Pattern",
    contentTemplate: "Content Template",
    seoRule: "SEO Rule",
    workflow: "Workflow",
    articleFormatter: "Article Formatter",
    metadataLinker: "Metadata Linker",
    polyglotTranslator: "Polyglot Translator",
    contentAuditor: "Content Auditor",
    contentAnalyzer: "Content Analyzer",
    seoOptimizer: "SEO Optimizer",
    websiteAuditor: "Website Auditor",
    imageSuggestion: "Image Suggestion",
    categoryAgent: "Category Agent",
    spanish: "Spanish",
    english: "English",
    german: "German",
    chinese: "Chinese",
    korean: "Korean",
    japanese: "Japanese",
    french: "French",
    italian: "Italian",
    portuguese: "Portuguese",
    russian: "Russian",
  },
  es: {
    title: "Gestión de Base de Conocimiento",
    subtitle: "Gestionar documentos de conocimiento de agentes IA para traducción, glosario legal y flujos de trabajo",
    checkingAuth: "Verificando autenticación...",
    refresh: "Actualizar",
    bulkUpload: "Carga Masiva",
    addDocument: "Agregar Documento",
    searchDocuments: "Buscar documentos...",
    filterByCategory: "Filtrar por categoría",
    filterByAgent: "Filtrar por agente",
    allCategories: "Todas las Categorías",
    allAgents: "Todos los Agentes",
    all: "Todos",
    knowledgeDocuments: "Documentos de Conocimiento",
    documentsFound: "documento(s) encontrado(s)",
    noDocumentsFound: "No se encontraron documentos. Haga clic en \"Agregar Documento\" para crear uno.",
    titleKey: "Título/Clave",
    category: "Categoría",
    agent: "Agente",
    language: "Idioma",
    usage: "Uso",
    updated: "Actualizado",
    actions: "Acciones",
    addKnowledgeDocument: "Agregar Documento de Conocimiento",
    addDocumentDescription: "Crear un nuevo documento de conocimiento para que los agentes IA aprendan.",
    editKnowledgeDocument: "Editar Documento de Conocimiento",
    editDocumentDescription: "Actualizar la información del documento de conocimiento.",
    selectCategory: "Seleccionar categoría",
    selectAgent: "Seleccionar agente",
    selectLanguage: "Seleccionar idioma",
    agentType: "Tipo de Agente",
    contentValue: "Contenido / Valor",
    contentPlaceholder: "Ingrese el contenido de conocimiento, definición o patrón...",
    titlePlaceholder: "ej., 'due_diligence' o 'Patrón de Traducción: Términos Legales'",
    languageOptional: "Idioma (opcional)",
    none: "Ninguno",
    confidence: "Confianza (0-100)",
    cancel: "Cancelar",
    createDocument: "Crear Documento",
    updateDocument: "Actualizar Documento",
    bulkUploadKnowledge: "Carga Masiva de Conocimiento",
    bulkUploadDescription: "Suba múltiples entradas de conocimiento a la vez. Formato: una entrada por línea, use pipe (|) para separar clave y valor.",
    dataKeyValuePerLine: "Datos (clave|valor por línea)",
    uploadAll: "Subir Todo",
    deleteKnowledgeDocument: "Eliminar Documento de Conocimiento",
    deleteConfirmation: "¿Está seguro de que desea eliminar",
    deleteWarning: "Esta acción no se puede deshacer.",
    delete: "Eliminar",
    documentCreated: "Documento de conocimiento creado",
    documentUpdated: "Documento de conocimiento actualizado",
    documentDeleted: "Documento de conocimiento eliminado",
    createFailed: "Error al crear documento",
    updateFailed: "Error al actualizar documento",
    deleteFailed: "Error al eliminar documento",
    bulkUploadComplete: "Carga masiva completada",
    documentsCreated: "documentos creados",
    bulkUploadFailed: "Error en carga masiva",
    legalGlossary: "Glosario Legal",
    translationPattern: "Patrón de Traducción",
    contentTemplate: "Plantilla de Contenido",
    seoRule: "Regla SEO",
    workflow: "Flujo de Trabajo",
    articleFormatter: "Formateador de Artículos",
    metadataLinker: "Enlazador de Metadatos",
    polyglotTranslator: "Traductor Políglota",
    contentAuditor: "Auditor de Contenido",
    contentAnalyzer: "Analizador de Contenido",
    seoOptimizer: "Optimizador SEO",
    websiteAuditor: "Auditor de Sitio Web",
    imageSuggestion: "Sugerencia de Imagen",
    categoryAgent: "Agente de Categoría",
    spanish: "Español",
    english: "Inglés",
    german: "Alemán",
    chinese: "Chino",
    korean: "Coreano",
    japanese: "Japonés",
    french: "Francés",
    italian: "Italiano",
    portuguese: "Portugués",
    russian: "Ruso",
  },
  de: {
    title: "Wissensdatenbank-Verwaltung",
    subtitle: "KI-Agenten-Wissensdokumente für Übersetzung, Rechtsglossar und Workflows verwalten",
    checkingAuth: "Authentifizierung wird überprüft...",
    refresh: "Aktualisieren",
    bulkUpload: "Massenupload",
    addDocument: "Dokument hinzufügen",
    searchDocuments: "Dokumente suchen...",
    filterByCategory: "Nach Kategorie filtern",
    filterByAgent: "Nach Agent filtern",
    allCategories: "Alle Kategorien",
    allAgents: "Alle Agenten",
    all: "Alle",
    knowledgeDocuments: "Wissensdokumente",
    documentsFound: "Dokument(e) gefunden",
    noDocumentsFound: "Keine Wissensdokumente gefunden. Klicken Sie auf \"Dokument hinzufügen\", um eines zu erstellen.",
    titleKey: "Titel/Schlüssel",
    category: "Kategorie",
    agent: "Agent",
    language: "Sprache",
    usage: "Nutzung",
    updated: "Aktualisiert",
    actions: "Aktionen",
    addKnowledgeDocument: "Wissensdokument hinzufügen",
    addDocumentDescription: "Erstellen Sie ein neues Wissensdokument, von dem KI-Agenten lernen können.",
    editKnowledgeDocument: "Wissensdokument bearbeiten",
    editDocumentDescription: "Aktualisieren Sie die Wissensdokument-Informationen.",
    selectCategory: "Kategorie auswählen",
    selectAgent: "Agent auswählen",
    selectLanguage: "Sprache auswählen",
    agentType: "Agententyp",
    contentValue: "Inhalt / Wert",
    contentPlaceholder: "Geben Sie den Wissensinhalt, die Definition oder das Muster ein...",
    titlePlaceholder: "z.B. 'due_diligence' oder 'Übersetzungsmuster: Rechtsbegriffe'",
    languageOptional: "Sprache (optional)",
    none: "Keine",
    confidence: "Konfidenz (0-100)",
    cancel: "Abbrechen",
    createDocument: "Dokument erstellen",
    updateDocument: "Dokument aktualisieren",
    bulkUploadKnowledge: "Wissen-Massenupload",
    bulkUploadDescription: "Laden Sie mehrere Wissenseinträge gleichzeitig hoch. Format: ein Eintrag pro Zeile, verwenden Sie Pipe (|) zur Trennung von Schlüssel und Wert.",
    dataKeyValuePerLine: "Daten (Schlüssel|Wert pro Zeile)",
    uploadAll: "Alle hochladen",
    deleteKnowledgeDocument: "Wissensdokument löschen",
    deleteConfirmation: "Sind Sie sicher, dass Sie löschen möchten",
    deleteWarning: "Diese Aktion kann nicht rückgängig gemacht werden.",
    delete: "Löschen",
    documentCreated: "Wissensdokument erstellt",
    documentUpdated: "Wissensdokument aktualisiert",
    documentDeleted: "Wissensdokument gelöscht",
    createFailed: "Fehler beim Erstellen des Dokuments",
    updateFailed: "Fehler beim Aktualisieren des Dokuments",
    deleteFailed: "Fehler beim Löschen des Dokuments",
    bulkUploadComplete: "Massenupload abgeschlossen",
    documentsCreated: "Dokumente erstellt",
    bulkUploadFailed: "Massenupload fehlgeschlagen",
    legalGlossary: "Rechtsglossar",
    translationPattern: "Übersetzungsmuster",
    contentTemplate: "Inhaltsvorlage",
    seoRule: "SEO-Regel",
    workflow: "Workflow",
    articleFormatter: "Artikel-Formatierer",
    metadataLinker: "Metadaten-Verknüpfer",
    polyglotTranslator: "Polyglot-Übersetzer",
    contentAuditor: "Inhalts-Prüfer",
    contentAnalyzer: "Inhalts-Analysator",
    seoOptimizer: "SEO-Optimierer",
    websiteAuditor: "Website-Prüfer",
    imageSuggestion: "Bildvorschlag",
    categoryAgent: "Kategorie-Agent",
    spanish: "Spanisch",
    english: "Englisch",
    german: "Deutsch",
    chinese: "Chinesisch",
    korean: "Koreanisch",
    japanese: "Japanisch",
    french: "Französisch",
    italian: "Italienisch",
    portuguese: "Portugiesisch",
    russian: "Russisch",
  },
  zh: {
    title: "知识库管理",
    subtitle: "管理用于翻译、法律词汇表和工作流的AI代理知识文档",
    checkingAuth: "正在检查身份验证...",
    refresh: "刷新",
    bulkUpload: "批量上传",
    addDocument: "添加文档",
    searchDocuments: "搜索文档...",
    filterByCategory: "按类别筛选",
    filterByAgent: "按代理筛选",
    allCategories: "所有类别",
    allAgents: "所有代理",
    all: "全部",
    knowledgeDocuments: "知识文档",
    documentsFound: "个文档已找到",
    noDocumentsFound: "未找到知识文档。点击「添加文档」创建一个。",
    titleKey: "标题/键",
    category: "类别",
    agent: "代理",
    language: "语言",
    usage: "使用次数",
    updated: "更新时间",
    actions: "操作",
    addKnowledgeDocument: "添加知识文档",
    addDocumentDescription: "创建一个供AI代理学习的新知识文档。",
    editKnowledgeDocument: "编辑知识文档",
    editDocumentDescription: "更新知识文档信息。",
    selectCategory: "选择类别",
    selectAgent: "选择代理",
    selectLanguage: "选择语言",
    agentType: "代理类型",
    contentValue: "内容/值",
    contentPlaceholder: "输入知识内容、定义或模式...",
    titlePlaceholder: "例如：'due_diligence' 或 '翻译模式：法律术语'",
    languageOptional: "语言（可选）",
    none: "无",
    confidence: "置信度 (0-100)",
    cancel: "取消",
    createDocument: "创建文档",
    updateDocument: "更新文档",
    bulkUploadKnowledge: "批量上传知识",
    bulkUploadDescription: "一次上传多个知识条目。格式：每行一个条目，使用管道符 (|) 分隔键和值。",
    dataKeyValuePerLine: "数据（每行键|值）",
    uploadAll: "全部上传",
    deleteKnowledgeDocument: "删除知识文档",
    deleteConfirmation: "您确定要删除",
    deleteWarning: "此操作无法撤消。",
    delete: "删除",
    documentCreated: "知识文档已创建",
    documentUpdated: "知识文档已更新",
    documentDeleted: "知识文档已删除",
    createFailed: "创建文档失败",
    updateFailed: "更新文档失败",
    deleteFailed: "删除文档失败",
    bulkUploadComplete: "批量上传完成",
    documentsCreated: "个文档已创建",
    bulkUploadFailed: "批量上传失败",
    legalGlossary: "法律词汇表",
    translationPattern: "翻译模式",
    contentTemplate: "内容模板",
    seoRule: "SEO规则",
    workflow: "工作流",
    articleFormatter: "文章格式化器",
    metadataLinker: "元数据链接器",
    polyglotTranslator: "多语言翻译器",
    contentAuditor: "内容审核器",
    contentAnalyzer: "内容分析器",
    seoOptimizer: "SEO优化器",
    websiteAuditor: "网站审核器",
    imageSuggestion: "图片建议",
    categoryAgent: "类别代理",
    spanish: "西班牙语",
    english: "英语",
    german: "德语",
    chinese: "中文",
    korean: "韩语",
    japanese: "日语",
    french: "法语",
    italian: "意大利语",
    portuguese: "葡萄牙语",
    russian: "俄语",
  },
  ko: {
    title: "지식 기반 관리",
    subtitle: "번역, 법률 용어집 및 워크플로우를 위한 AI 에이전트 지식 문서 관리",
    checkingAuth: "인증 확인 중...",
    refresh: "새로고침",
    bulkUpload: "대량 업로드",
    addDocument: "문서 추가",
    searchDocuments: "문서 검색...",
    filterByCategory: "카테고리별 필터",
    filterByAgent: "에이전트별 필터",
    allCategories: "모든 카테고리",
    allAgents: "모든 에이전트",
    all: "전체",
    knowledgeDocuments: "지식 문서",
    documentsFound: "개의 문서 발견",
    noDocumentsFound: "지식 문서를 찾을 수 없습니다. \"문서 추가\"를 클릭하여 생성하세요.",
    titleKey: "제목/키",
    category: "카테고리",
    agent: "에이전트",
    language: "언어",
    usage: "사용량",
    updated: "업데이트됨",
    actions: "작업",
    addKnowledgeDocument: "지식 문서 추가",
    addDocumentDescription: "AI 에이전트가 학습할 새 지식 문서를 생성합니다.",
    editKnowledgeDocument: "지식 문서 편집",
    editDocumentDescription: "지식 문서 정보를 업데이트합니다.",
    selectCategory: "카테고리 선택",
    selectAgent: "에이전트 선택",
    selectLanguage: "언어 선택",
    agentType: "에이전트 유형",
    contentValue: "내용/값",
    contentPlaceholder: "지식 내용, 정의 또는 패턴을 입력하세요...",
    titlePlaceholder: "예: 'due_diligence' 또는 '번역 패턴: 법률 용어'",
    languageOptional: "언어 (선택사항)",
    none: "없음",
    confidence: "신뢰도 (0-100)",
    cancel: "취소",
    createDocument: "문서 생성",
    updateDocument: "문서 업데이트",
    bulkUploadKnowledge: "지식 대량 업로드",
    bulkUploadDescription: "여러 지식 항목을 한 번에 업로드합니다. 형식: 줄당 하나의 항목, 파이프(|)를 사용하여 키와 값을 구분합니다.",
    dataKeyValuePerLine: "데이터 (줄당 키|값)",
    uploadAll: "전체 업로드",
    deleteKnowledgeDocument: "지식 문서 삭제",
    deleteConfirmation: "정말 삭제하시겠습니까",
    deleteWarning: "이 작업은 취소할 수 없습니다.",
    delete: "삭제",
    documentCreated: "지식 문서가 생성되었습니다",
    documentUpdated: "지식 문서가 업데이트되었습니다",
    documentDeleted: "지식 문서가 삭제되었습니다",
    createFailed: "문서 생성 실패",
    updateFailed: "문서 업데이트 실패",
    deleteFailed: "문서 삭제 실패",
    bulkUploadComplete: "대량 업로드 완료",
    documentsCreated: "개의 문서 생성됨",
    bulkUploadFailed: "대량 업로드 실패",
    legalGlossary: "법률 용어집",
    translationPattern: "번역 패턴",
    contentTemplate: "콘텐츠 템플릿",
    seoRule: "SEO 규칙",
    workflow: "워크플로우",
    articleFormatter: "기사 포맷터",
    metadataLinker: "메타데이터 링커",
    polyglotTranslator: "다국어 번역기",
    contentAuditor: "콘텐츠 감사기",
    contentAnalyzer: "콘텐츠 분석기",
    seoOptimizer: "SEO 최적화기",
    websiteAuditor: "웹사이트 감사기",
    imageSuggestion: "이미지 제안",
    categoryAgent: "카테고리 에이전트",
    spanish: "스페인어",
    english: "영어",
    german: "독일어",
    chinese: "중국어",
    korean: "한국어",
    japanese: "일본어",
    french: "프랑스어",
    italian: "이탈리아어",
    portuguese: "포르투갈어",
    russian: "러시아어",
  },
  ja: {
    title: "ナレッジベース管理",
    subtitle: "翻訳、法律用語集、ワークフロー用のAIエージェントナレッジドキュメントを管理",
    checkingAuth: "認証を確認中...",
    refresh: "更新",
    bulkUpload: "一括アップロード",
    addDocument: "ドキュメント追加",
    searchDocuments: "ドキュメントを検索...",
    filterByCategory: "カテゴリでフィルター",
    filterByAgent: "エージェントでフィルター",
    allCategories: "すべてのカテゴリ",
    allAgents: "すべてのエージェント",
    all: "すべて",
    knowledgeDocuments: "ナレッジドキュメント",
    documentsFound: "件のドキュメントが見つかりました",
    noDocumentsFound: "ナレッジドキュメントが見つかりません。「ドキュメント追加」をクリックして作成してください。",
    titleKey: "タイトル/キー",
    category: "カテゴリ",
    agent: "エージェント",
    language: "言語",
    usage: "使用回数",
    updated: "更新日",
    actions: "操作",
    addKnowledgeDocument: "ナレッジドキュメント追加",
    addDocumentDescription: "AIエージェントが学習するための新しいナレッジドキュメントを作成します。",
    editKnowledgeDocument: "ナレッジドキュメント編集",
    editDocumentDescription: "ナレッジドキュメント情報を更新します。",
    selectCategory: "カテゴリを選択",
    selectAgent: "エージェントを選択",
    selectLanguage: "言語を選択",
    agentType: "エージェントタイプ",
    contentValue: "コンテンツ/値",
    contentPlaceholder: "ナレッジコンテンツ、定義、またはパターンを入力...",
    titlePlaceholder: "例: 'due_diligence' または '翻訳パターン: 法律用語'",
    languageOptional: "言語（オプション）",
    none: "なし",
    confidence: "信頼度 (0-100)",
    cancel: "キャンセル",
    createDocument: "ドキュメント作成",
    updateDocument: "ドキュメント更新",
    bulkUploadKnowledge: "ナレッジ一括アップロード",
    bulkUploadDescription: "複数のナレッジエントリを一度にアップロードします。形式: 1行につき1エントリ、パイプ (|) でキーと値を区切ります。",
    dataKeyValuePerLine: "データ（1行ごとにキー|値）",
    uploadAll: "すべてアップロード",
    deleteKnowledgeDocument: "ナレッジドキュメント削除",
    deleteConfirmation: "本当に削除しますか",
    deleteWarning: "この操作は元に戻せません。",
    delete: "削除",
    documentCreated: "ナレッジドキュメントが作成されました",
    documentUpdated: "ナレッジドキュメントが更新されました",
    documentDeleted: "ナレッジドキュメントが削除されました",
    createFailed: "ドキュメントの作成に失敗しました",
    updateFailed: "ドキュメントの更新に失敗しました",
    deleteFailed: "ドキュメントの削除に失敗しました",
    bulkUploadComplete: "一括アップロード完了",
    documentsCreated: "件のドキュメントが作成されました",
    bulkUploadFailed: "一括アップロード失敗",
    legalGlossary: "法律用語集",
    translationPattern: "翻訳パターン",
    contentTemplate: "コンテンツテンプレート",
    seoRule: "SEOルール",
    workflow: "ワークフロー",
    articleFormatter: "記事フォーマッター",
    metadataLinker: "メタデータリンカー",
    polyglotTranslator: "多言語翻訳者",
    contentAuditor: "コンテンツ監査者",
    contentAnalyzer: "コンテンツ分析者",
    seoOptimizer: "SEO最適化者",
    websiteAuditor: "ウェブサイト監査者",
    imageSuggestion: "画像提案",
    categoryAgent: "カテゴリエージェント",
    spanish: "スペイン語",
    english: "英語",
    german: "ドイツ語",
    chinese: "中国語",
    korean: "韓国語",
    japanese: "日本語",
    french: "フランス語",
    italian: "イタリア語",
    portuguese: "ポルトガル語",
    russian: "ロシア語",
  },
  ar: {
    title: "إدارة قاعدة المعرفة",
    subtitle: "إدارة وثائق معرفة وكلاء الذكاء الاصطناعي للترجمة والمسرد القانوني وسير العمل",
    checkingAuth: "جارٍ التحقق من المصادقة...",
    refresh: "تحديث",
    bulkUpload: "تحميل جماعي",
    addDocument: "إضافة مستند",
    searchDocuments: "البحث في المستندات...",
    filterByCategory: "تصفية حسب الفئة",
    filterByAgent: "تصفية حسب الوكيل",
    allCategories: "جميع الفئات",
    allAgents: "جميع الوكلاء",
    all: "الكل",
    knowledgeDocuments: "وثائق المعرفة",
    documentsFound: "مستند(ات) موجودة",
    noDocumentsFound: "لم يتم العثور على وثائق معرفة. انقر على \"إضافة مستند\" لإنشاء واحد.",
    titleKey: "العنوان/المفتاح",
    category: "الفئة",
    agent: "الوكيل",
    language: "اللغة",
    usage: "الاستخدام",
    updated: "تم التحديث",
    actions: "الإجراءات",
    addKnowledgeDocument: "إضافة وثيقة معرفة",
    addDocumentDescription: "إنشاء وثيقة معرفة جديدة ليتعلم منها وكلاء الذكاء الاصطناعي.",
    editKnowledgeDocument: "تعديل وثيقة المعرفة",
    editDocumentDescription: "تحديث معلومات وثيقة المعرفة.",
    selectCategory: "اختر الفئة",
    selectAgent: "اختر الوكيل",
    selectLanguage: "اختر اللغة",
    agentType: "نوع الوكيل",
    contentValue: "المحتوى/القيمة",
    contentPlaceholder: "أدخل محتوى المعرفة أو التعريف أو النمط...",
    titlePlaceholder: "مثال: 'due_diligence' أو 'نمط الترجمة: المصطلحات القانونية'",
    languageOptional: "اللغة (اختياري)",
    none: "لا شيء",
    confidence: "الثقة (0-100)",
    cancel: "إلغاء",
    createDocument: "إنشاء مستند",
    updateDocument: "تحديث المستند",
    bulkUploadKnowledge: "تحميل جماعي للمعرفة",
    bulkUploadDescription: "تحميل عدة إدخالات معرفة مرة واحدة. التنسيق: إدخال واحد لكل سطر، استخدم الشريط (|) للفصل بين المفتاح والقيمة.",
    dataKeyValuePerLine: "البيانات (مفتاح|قيمة لكل سطر)",
    uploadAll: "تحميل الكل",
    deleteKnowledgeDocument: "حذف وثيقة المعرفة",
    deleteConfirmation: "هل أنت متأكد أنك تريد حذف",
    deleteWarning: "لا يمكن التراجع عن هذا الإجراء.",
    delete: "حذف",
    documentCreated: "تم إنشاء وثيقة المعرفة",
    documentUpdated: "تم تحديث وثيقة المعرفة",
    documentDeleted: "تم حذف وثيقة المعرفة",
    createFailed: "فشل في إنشاء المستند",
    updateFailed: "فشل في تحديث المستند",
    deleteFailed: "فشل في حذف المستند",
    bulkUploadComplete: "اكتمل التحميل الجماعي",
    documentsCreated: "مستندات تم إنشاؤها",
    bulkUploadFailed: "فشل التحميل الجماعي",
    legalGlossary: "المسرد القانوني",
    translationPattern: "نمط الترجمة",
    contentTemplate: "قالب المحتوى",
    seoRule: "قاعدة SEO",
    workflow: "سير العمل",
    articleFormatter: "منسق المقالات",
    metadataLinker: "رابط البيانات الوصفية",
    polyglotTranslator: "المترجم متعدد اللغات",
    contentAuditor: "مدقق المحتوى",
    contentAnalyzer: "محلل المحتوى",
    seoOptimizer: "محسن SEO",
    websiteAuditor: "مدقق الموقع",
    imageSuggestion: "اقتراح الصورة",
    categoryAgent: "وكيل الفئة",
    spanish: "الإسبانية",
    english: "الإنجليزية",
    german: "الألمانية",
    chinese: "الصينية",
    korean: "الكورية",
    japanese: "اليابانية",
    french: "الفرنسية",
    italian: "الإيطالية",
    portuguese: "البرتغالية",
    russian: "الروسية",
  },
  ru: {
    title: "Управление базой знаний",
    subtitle: "Управление документами знаний AI-агентов для перевода, юридического глоссария и рабочих процессов",
    checkingAuth: "Проверка аутентификации...",
    refresh: "Обновить",
    bulkUpload: "Массовая загрузка",
    addDocument: "Добавить документ",
    searchDocuments: "Поиск документов...",
    filterByCategory: "Фильтр по категории",
    filterByAgent: "Фильтр по агенту",
    allCategories: "Все категории",
    allAgents: "Все агенты",
    all: "Все",
    knowledgeDocuments: "Документы знаний",
    documentsFound: "документ(ов) найдено",
    noDocumentsFound: "Документы знаний не найдены. Нажмите \"Добавить документ\", чтобы создать.",
    titleKey: "Заголовок/Ключ",
    category: "Категория",
    agent: "Агент",
    language: "Язык",
    usage: "Использование",
    updated: "Обновлено",
    actions: "Действия",
    addKnowledgeDocument: "Добавить документ знаний",
    addDocumentDescription: "Создать новый документ знаний для обучения AI-агентов.",
    editKnowledgeDocument: "Редактировать документ знаний",
    editDocumentDescription: "Обновить информацию документа знаний.",
    selectCategory: "Выберите категорию",
    selectAgent: "Выберите агента",
    selectLanguage: "Выберите язык",
    agentType: "Тип агента",
    contentValue: "Содержимое/Значение",
    contentPlaceholder: "Введите содержимое знаний, определение или шаблон...",
    titlePlaceholder: "напр., 'due_diligence' или 'Шаблон перевода: Юридические термины'",
    languageOptional: "Язык (опционально)",
    none: "Нет",
    confidence: "Уверенность (0-100)",
    cancel: "Отмена",
    createDocument: "Создать документ",
    updateDocument: "Обновить документ",
    bulkUploadKnowledge: "Массовая загрузка знаний",
    bulkUploadDescription: "Загрузите несколько записей знаний одновременно. Формат: одна запись на строку, используйте вертикальную черту (|) для разделения ключа и значения.",
    dataKeyValuePerLine: "Данные (ключ|значение на строку)",
    uploadAll: "Загрузить все",
    deleteKnowledgeDocument: "Удалить документ знаний",
    deleteConfirmation: "Вы уверены, что хотите удалить",
    deleteWarning: "Это действие нельзя отменить.",
    delete: "Удалить",
    documentCreated: "Документ знаний создан",
    documentUpdated: "Документ знаний обновлен",
    documentDeleted: "Документ знаний удален",
    createFailed: "Не удалось создать документ",
    updateFailed: "Не удалось обновить документ",
    deleteFailed: "Не удалось удалить документ",
    bulkUploadComplete: "Массовая загрузка завершена",
    documentsCreated: "документов создано",
    bulkUploadFailed: "Массовая загрузка не удалась",
    legalGlossary: "Юридический глоссарий",
    translationPattern: "Шаблон перевода",
    contentTemplate: "Шаблон контента",
    seoRule: "Правило SEO",
    workflow: "Рабочий процесс",
    articleFormatter: "Форматировщик статей",
    metadataLinker: "Связыватель метаданных",
    polyglotTranslator: "Полиглот-переводчик",
    contentAuditor: "Аудитор контента",
    contentAnalyzer: "Анализатор контента",
    seoOptimizer: "SEO-оптимизатор",
    websiteAuditor: "Аудитор сайта",
    imageSuggestion: "Предложение изображения",
    categoryAgent: "Агент категорий",
    spanish: "Испанский",
    english: "Английский",
    german: "Немецкий",
    chinese: "Китайский",
    korean: "Корейский",
    japanese: "Японский",
    french: "Французский",
    italian: "Итальянский",
    portuguese: "Португальский",
    russian: "Русский",
  },
  fr: {
    title: "Gestion de la base de connaissances",
    subtitle: "Gérer les documents de connaissances des agents IA pour la traduction, le glossaire juridique et les flux de travail",
    checkingAuth: "Vérification de l'authentification...",
    refresh: "Actualiser",
    bulkUpload: "Téléchargement en masse",
    addDocument: "Ajouter un document",
    searchDocuments: "Rechercher des documents...",
    filterByCategory: "Filtrer par catégorie",
    filterByAgent: "Filtrer par agent",
    allCategories: "Toutes les catégories",
    allAgents: "Tous les agents",
    all: "Tous",
    knowledgeDocuments: "Documents de connaissances",
    documentsFound: "document(s) trouvé(s)",
    noDocumentsFound: "Aucun document de connaissances trouvé. Cliquez sur \"Ajouter un document\" pour en créer un.",
    titleKey: "Titre/Clé",
    category: "Catégorie",
    agent: "Agent",
    language: "Langue",
    usage: "Utilisation",
    updated: "Mis à jour",
    actions: "Actions",
    addKnowledgeDocument: "Ajouter un document de connaissances",
    addDocumentDescription: "Créer un nouveau document de connaissances pour l'apprentissage des agents IA.",
    editKnowledgeDocument: "Modifier le document de connaissances",
    editDocumentDescription: "Mettre à jour les informations du document de connaissances.",
    selectCategory: "Sélectionner la catégorie",
    selectAgent: "Sélectionner l'agent",
    selectLanguage: "Sélectionner la langue",
    agentType: "Type d'agent",
    contentValue: "Contenu/Valeur",
    contentPlaceholder: "Entrez le contenu de connaissances, la définition ou le modèle...",
    titlePlaceholder: "ex. 'due_diligence' ou 'Modèle de traduction: Termes juridiques'",
    languageOptional: "Langue (optionnel)",
    none: "Aucun",
    confidence: "Confiance (0-100)",
    cancel: "Annuler",
    createDocument: "Créer le document",
    updateDocument: "Mettre à jour le document",
    bulkUploadKnowledge: "Téléchargement en masse de connaissances",
    bulkUploadDescription: "Téléchargez plusieurs entrées de connaissances à la fois. Format: une entrée par ligne, utilisez le pipe (|) pour séparer la clé et la valeur.",
    dataKeyValuePerLine: "Données (clé|valeur par ligne)",
    uploadAll: "Tout télécharger",
    deleteKnowledgeDocument: "Supprimer le document de connaissances",
    deleteConfirmation: "Êtes-vous sûr de vouloir supprimer",
    deleteWarning: "Cette action est irréversible.",
    delete: "Supprimer",
    documentCreated: "Document de connaissances créé",
    documentUpdated: "Document de connaissances mis à jour",
    documentDeleted: "Document de connaissances supprimé",
    createFailed: "Échec de la création du document",
    updateFailed: "Échec de la mise à jour du document",
    deleteFailed: "Échec de la suppression du document",
    bulkUploadComplete: "Téléchargement en masse terminé",
    documentsCreated: "documents créés",
    bulkUploadFailed: "Échec du téléchargement en masse",
    legalGlossary: "Glossaire juridique",
    translationPattern: "Modèle de traduction",
    contentTemplate: "Modèle de contenu",
    seoRule: "Règle SEO",
    workflow: "Flux de travail",
    articleFormatter: "Formateur d'articles",
    metadataLinker: "Lieur de métadonnées",
    polyglotTranslator: "Traducteur polyglotte",
    contentAuditor: "Auditeur de contenu",
    contentAnalyzer: "Analyseur de contenu",
    seoOptimizer: "Optimiseur SEO",
    websiteAuditor: "Auditeur de site web",
    imageSuggestion: "Suggestion d'image",
    categoryAgent: "Agent de catégorie",
    spanish: "Espagnol",
    english: "Anglais",
    german: "Allemand",
    chinese: "Chinois",
    korean: "Coréen",
    japanese: "Japonais",
    french: "Français",
    italian: "Italien",
    portuguese: "Portugais",
    russian: "Russe",
  },
  it: {
    title: "Gestione Base di Conoscenza",
    subtitle: "Gestisci i documenti di conoscenza degli agenti IA per traduzione, glossario legale e flussi di lavoro",
    checkingAuth: "Verifica autenticazione...",
    refresh: "Aggiorna",
    bulkUpload: "Caricamento massivo",
    addDocument: "Aggiungi documento",
    searchDocuments: "Cerca documenti...",
    filterByCategory: "Filtra per categoria",
    filterByAgent: "Filtra per agente",
    allCategories: "Tutte le categorie",
    allAgents: "Tutti gli agenti",
    all: "Tutti",
    knowledgeDocuments: "Documenti di conoscenza",
    documentsFound: "documento/i trovato/i",
    noDocumentsFound: "Nessun documento di conoscenza trovato. Clicca su \"Aggiungi documento\" per crearne uno.",
    titleKey: "Titolo/Chiave",
    category: "Categoria",
    agent: "Agente",
    language: "Lingua",
    usage: "Utilizzo",
    updated: "Aggiornato",
    actions: "Azioni",
    addKnowledgeDocument: "Aggiungi documento di conoscenza",
    addDocumentDescription: "Crea un nuovo documento di conoscenza per l'apprendimento degli agenti IA.",
    editKnowledgeDocument: "Modifica documento di conoscenza",
    editDocumentDescription: "Aggiorna le informazioni del documento di conoscenza.",
    selectCategory: "Seleziona categoria",
    selectAgent: "Seleziona agente",
    selectLanguage: "Seleziona lingua",
    agentType: "Tipo di agente",
    contentValue: "Contenuto/Valore",
    contentPlaceholder: "Inserisci il contenuto della conoscenza, definizione o pattern...",
    titlePlaceholder: "es. 'due_diligence' o 'Pattern di traduzione: Termini legali'",
    languageOptional: "Lingua (opzionale)",
    none: "Nessuno",
    confidence: "Confidenza (0-100)",
    cancel: "Annulla",
    createDocument: "Crea documento",
    updateDocument: "Aggiorna documento",
    bulkUploadKnowledge: "Caricamento massivo conoscenza",
    bulkUploadDescription: "Carica più voci di conoscenza contemporaneamente. Formato: una voce per riga, usa pipe (|) per separare chiave e valore.",
    dataKeyValuePerLine: "Dati (chiave|valore per riga)",
    uploadAll: "Carica tutto",
    deleteKnowledgeDocument: "Elimina documento di conoscenza",
    deleteConfirmation: "Sei sicuro di voler eliminare",
    deleteWarning: "Questa azione non può essere annullata.",
    delete: "Elimina",
    documentCreated: "Documento di conoscenza creato",
    documentUpdated: "Documento di conoscenza aggiornato",
    documentDeleted: "Documento di conoscenza eliminato",
    createFailed: "Creazione documento fallita",
    updateFailed: "Aggiornamento documento fallito",
    deleteFailed: "Eliminazione documento fallita",
    bulkUploadComplete: "Caricamento massivo completato",
    documentsCreated: "documenti creati",
    bulkUploadFailed: "Caricamento massivo fallito",
    legalGlossary: "Glossario legale",
    translationPattern: "Pattern di traduzione",
    contentTemplate: "Template di contenuto",
    seoRule: "Regola SEO",
    workflow: "Flusso di lavoro",
    articleFormatter: "Formattatore articoli",
    metadataLinker: "Collegatore metadati",
    polyglotTranslator: "Traduttore poliglotta",
    contentAuditor: "Revisore contenuti",
    contentAnalyzer: "Analizzatore contenuti",
    seoOptimizer: "Ottimizzatore SEO",
    websiteAuditor: "Revisore sito web",
    imageSuggestion: "Suggerimento immagine",
    categoryAgent: "Agente categoria",
    spanish: "Spagnolo",
    english: "Inglese",
    german: "Tedesco",
    chinese: "Cinese",
    korean: "Coreano",
    japanese: "Giapponese",
    french: "Francese",
    italian: "Italiano",
    portuguese: "Portoghese",
    russian: "Russo",
  },
};

interface KnowledgeDocument {
  id: string;
  agentType: string;
  category: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const KNOWLEDGE_CATEGORIES = [
  { value: "legal_glossary", labelKey: "legalGlossary", icon: BookOpen },
  { value: "translation_pattern", labelKey: "translationPattern", icon: Languages },
  { value: "content_template", labelKey: "contentTemplate", icon: FileText },
  { value: "seo_rule", labelKey: "seoRule", icon: BarChart3 },
  { value: "workflow", labelKey: "workflow", icon: Clock },
] as const;

const AGENT_TYPES = [
  { value: "formatter", labelKey: "articleFormatter" },
  { value: "metadata_linker", labelKey: "metadataLinker" },
  { value: "polyglot_translator", labelKey: "polyglotTranslator" },
  { value: "content_auditor", labelKey: "contentAuditor" },
  { value: "content_analyzer", labelKey: "contentAnalyzer" },
  { value: "seo_optimizer", labelKey: "seoOptimizer" },
  { value: "website_auditor", labelKey: "websiteAuditor" },
  { value: "image_suggestion", labelKey: "imageSuggestion" },
  { value: "category_agent", labelKey: "categoryAgent" },
] as const;

const LANGUAGE_OPTIONS = [
  { value: "es", labelKey: "spanish" },
  { value: "en", labelKey: "english" },
  { value: "de", labelKey: "german" },
  { value: "zh", labelKey: "chinese" },
  { value: "ko", labelKey: "korean" },
  { value: "ja", labelKey: "japanese" },
  { value: "fr", labelKey: "french" },
  { value: "it", labelKey: "italian" },
  { value: "pt", labelKey: "portuguese" },
  { value: "ru", labelKey: "russian" },
] as const;

const knowledgeFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(1, "Title/Key is required"),
  content: z.string().min(1, "Content is required"),
  agentType: z.string().min(1, "Agent type is required"),
  language: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
});

type KnowledgeFormData = z.infer<typeof knowledgeFormSchema>;

const bulkUploadSchema = z.object({
  category: z.string().min(1, "Category is required"),
  agentType: z.string().min(1, "Agent type is required"),
  data: z.string().min(1, "Data is required"),
});

type BulkUploadData = z.infer<typeof bulkUploadSchema>;

export default function AdminKnowledge() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, token } = useAdminAuth();
  const { language } = useLanguage();
  const t = translations[language as keyof typeof translations] || translations.en;
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");

  const form = useForm<KnowledgeFormData>({
    resolver: zodResolver(knowledgeFormSchema),
    defaultValues: {
      category: "",
      title: "",
      content: "",
      agentType: "",
      language: "",
      confidence: 80,
    },
  });

  const bulkForm = useForm<BulkUploadData>({
    resolver: zodResolver(bulkUploadSchema),
    defaultValues: {
      category: "legal_glossary",
      agentType: "polyglot_translator",
      data: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: documents, isLoading, refetch } = useQuery<KnowledgeDocument[]>({
    queryKey: ["/api/admin/knowledge"],
    queryFn: async () => {
      const res = await adminApiRequest("GET", "/api/admin/knowledge");
      return res.json();
    },
    enabled: isAuthenticated && !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (data: KnowledgeFormData) => {
      const res = await adminApiRequest("POST", "/api/admin/knowledge", {
        ...data,
        metadata: {
          language: data.language,
          confidence: data.confidence,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.documentCreated });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsAddModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({ title: t.createFailed, description: String(error), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: KnowledgeFormData }) => {
      const res = await adminApiRequest("PUT", `/api/admin/knowledge/${id}`, {
        ...data,
        metadata: {
          language: data.language,
          confidence: data.confidence,
        },
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.documentUpdated });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsEditModalOpen(false);
      setSelectedDocument(null);
      form.reset();
    },
    onError: (error) => {
      toast({ title: t.updateFailed, description: String(error), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await adminApiRequest("DELETE", `/api/admin/knowledge/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t.documentDeleted });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
    },
    onError: (error) => {
      toast({ title: t.deleteFailed, description: String(error), variant: "destructive" });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (data: BulkUploadData) => {
      const lines = data.data.split("\n").filter(line => line.trim());
      const items = lines.map(line => {
        const [key, ...valueParts] = line.split("|");
        return {
          category: data.category,
          agentType: data.agentType,
          title: key?.trim() || "",
          content: valueParts.join("|").trim() || key?.trim() || "",
          metadata: {},
        };
      }).filter(item => item.title && item.content);
      
      const res = await adminApiRequest("POST", "/api/admin/knowledge/bulk", { items });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: t.bulkUploadComplete, description: `${data.created || 0} ${t.documentsCreated}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/knowledge"] });
      setIsBulkModalOpen(false);
      bulkForm.reset();
    },
    onError: (error) => {
      toast({ title: t.bulkUploadFailed, description: String(error), variant: "destructive" });
    },
  });

  const handleEdit = useCallback((doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    form.reset({
      category: doc.category,
      title: doc.title,
      content: doc.content,
      agentType: doc.agentType,
      language: doc.metadata?.language || "",
      confidence: doc.metadata?.confidence || 80,
    });
    setIsEditModalOpen(true);
  }, [form]);

  const handleDelete = useCallback((doc: KnowledgeDocument) => {
    setSelectedDocument(doc);
    setIsDeleteDialogOpen(true);
  }, []);

  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesAgent = filterAgent === "all" || doc.agentType === filterAgent;
    const matchesTab = activeTab === "all" || doc.category === activeTab;
    return matchesSearch && matchesCategory && matchesAgent && matchesTab;
  }) || [];

  const documentsByCategory = KNOWLEDGE_CATEGORIES.map(cat => ({
    ...cat,
    count: documents?.filter(d => d.category === cat.value).length || 0,
  }));

  const totalDocuments = documents?.length || 0;

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t.checkingAuth}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin-knowledge">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                {t.title}
              </h1>
              <p className="text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              data-testid="button-refresh-knowledge"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.refresh}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsBulkModalOpen(true)}
              data-testid="button-bulk-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t.bulkUpload}
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                form.reset();
                setIsAddModalOpen(true);
              }}
              data-testid="button-add-knowledge"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.addDocument}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5 mb-6">
          {documentsByCategory.map((cat) => {
            const Icon = cat.icon;
            return (
              <Card 
                key={cat.value} 
                className={`cursor-pointer transition-colors ${activeTab === cat.value ? 'border-primary' : ''}`}
                onClick={() => setActiveTab(cat.value)}
                data-testid={`card-category-${cat.value}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">{t[cat.labelKey as keyof typeof t]}</span>
                    </div>
                    <Badge variant="secondary">{cat.count}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchDocuments}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                  data-testid="input-search-knowledge"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-category">
                    <SelectValue placeholder={t.filterByCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allCategories}</SelectItem>
                    {KNOWLEDGE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{t[cat.labelKey as keyof typeof t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterAgent} onValueChange={setFilterAgent}>
                  <SelectTrigger className="w-[180px]" data-testid="select-filter-agent">
                    <SelectValue placeholder={t.filterByAgent} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.allAgents}</SelectItem>
                    {AGENT_TYPES.map(agent => (
                      <SelectItem key={agent.value} value={agent.value}>{t[agent.labelKey as keyof typeof t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList data-testid="tabs-knowledge-categories">
            <TabsTrigger value="all" data-testid="tab-all">
              {t.all} ({totalDocuments})
            </TabsTrigger>
            {KNOWLEDGE_CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} data-testid={`tab-${cat.value}`}>
                {t[cat.labelKey as keyof typeof t]}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  {t.knowledgeDocuments}
                </CardTitle>
                <CardDescription>
                  {filteredDocuments.length} {t.documentsFound}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t.noDocumentsFound}
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.titleKey}</TableHead>
                          <TableHead>{t.category}</TableHead>
                          <TableHead>{t.agent}</TableHead>
                          <TableHead>{t.language}</TableHead>
                          <TableHead>{t.usage}</TableHead>
                          <TableHead>{t.updated}</TableHead>
                          <TableHead className="text-right">{t.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDocuments.map((doc) => {
                          const catLabelKey = KNOWLEDGE_CATEGORIES.find(c => c.value === doc.category)?.labelKey;
                          const agentLabelKey = AGENT_TYPES.find(a => a.value === doc.agentType)?.labelKey;
                          const langLabelKey = LANGUAGE_OPTIONS.find(l => l.value === doc.metadata?.language)?.labelKey;
                          return (
                          <TableRow key={doc.id} data-testid={`row-knowledge-${doc.id}`}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {doc.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {catLabelKey ? t[catLabelKey as keyof typeof t] : doc.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {agentLabelKey ? t[agentLabelKey as keyof typeof t] : doc.agentType}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {doc.metadata?.language && (
                                <Badge variant="outline">
                                  {langLabelKey ? t[langLabelKey as keyof typeof t] : doc.metadata.language}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{doc.usageCount}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(doc)}
                                  data-testid={`button-edit-${doc.id}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(doc)}
                                  data-testid={`button-delete-${doc.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.addKnowledgeDocument}</DialogTitle>
              <DialogDescription>
                {t.addDocumentDescription}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.category}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-category">
                              <SelectValue placeholder={t.selectCategory} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KNOWLEDGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{t[cat.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.agentType}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-agent">
                              <SelectValue placeholder={t.selectAgent} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGENT_TYPES.map(agent => (
                              <SelectItem key={agent.value} value={agent.value}>{t[agent.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.titleKey}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t.titlePlaceholder} data-testid="input-add-title" />
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
                      <FormLabel>{t.contentValue}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={t.contentPlaceholder}
                          className="min-h-[150px]"
                          data-testid="textarea-add-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.languageOptional}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-add-language">
                              <SelectValue placeholder={t.selectLanguage} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{t.none}</SelectItem>
                            {LANGUAGE_OPTIONS.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>{t[lang.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.confidence}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-add-confidence"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-add">
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.createDocument}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.editKnowledgeDocument}</DialogTitle>
              <DialogDescription>
                {t.editDocumentDescription}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => selectedDocument && updateMutation.mutate({ id: selectedDocument.id, data }))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.category}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-category">
                              <SelectValue placeholder={t.selectCategory} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KNOWLEDGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{t[cat.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.agentType}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-agent">
                              <SelectValue placeholder={t.selectAgent} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGENT_TYPES.map(agent => (
                              <SelectItem key={agent.value} value={agent.value}>{t[agent.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.titleKey}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-title" />
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
                      <FormLabel>{t.contentValue}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[150px]"
                          data-testid="textarea-edit-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.languageOptional}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-language">
                              <SelectValue placeholder={t.selectLanguage} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">{t.none}</SelectItem>
                            {LANGUAGE_OPTIONS.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>{t[lang.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confidence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.confidence}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={100} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-edit-confidence"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} data-testid="button-submit-edit">
                    {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.updateDocument}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t.bulkUploadKnowledge}</DialogTitle>
              <DialogDescription>
                {t.bulkUploadDescription}
              </DialogDescription>
            </DialogHeader>
            <Form {...bulkForm}>
              <form onSubmit={bulkForm.handleSubmit((data) => bulkUploadMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={bulkForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.category}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bulk-category">
                              <SelectValue placeholder={t.selectCategory} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {KNOWLEDGE_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{t[cat.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={bulkForm.control}
                    name="agentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.agentType}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-bulk-agent">
                              <SelectValue placeholder={t.selectAgent} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AGENT_TYPES.map(agent => (
                              <SelectItem key={agent.value} value={agent.value}>{t[agent.labelKey as keyof typeof t]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={bulkForm.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.dataKeyValuePerLine}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder={`due_diligence|Debida diligencia: Proceso de investigación exhaustiva
merger|Fusión: Combinación de dos o más empresas
acquisition|Adquisición: Compra de una empresa por otra`}
                          className="min-h-[200px] font-mono text-sm"
                          data-testid="textarea-bulk-data"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsBulkModalOpen(false)}>
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={bulkUploadMutation.isPending} data-testid="button-submit-bulk">
                    {bulkUploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t.uploadAll}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.deleteKnowledgeDocument}</AlertDialogTitle>
              <AlertDialogDescription>
                {t.deleteConfirmation} "{selectedDocument?.title}"? {t.deleteWarning}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedDocument && deleteMutation.mutate(selectedDocument.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
