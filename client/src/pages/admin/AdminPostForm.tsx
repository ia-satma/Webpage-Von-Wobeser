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
import { ArrowLeft, Save, Send, Sparkles, Loader2, Globe, Search, CheckCircle, AlertTriangle, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    translateAllLanguages: "Translate to All Languages",
    translatingAll: "Translating...",
    translateAllSuccess: "Translation to all languages initiated successfully",
    translateAllError: "Failed to translate to all languages",
    analyzeContent: "Analyze Content",
    analyzing: "Analyzing...",
    analyzeSuccess: "Content analysis completed",
    analyzeError: "Failed to analyze content",
    analysisResults: "Content Analysis Results",
    seoRecommendations: "SEO Recommendations",
    keywords: "Keywords",
    titleSuggestion: "Title Suggestion",
    metaDescSuggestion: "Meta Description",
    headingImprovements: "Heading Improvements",
    contentGaps: "Content Gaps",
    categories: "Categories",
    primaryCategory: "Primary",
    secondaryCategories: "Secondary",
    spellingGrammar: "Spelling & Grammar",
    noIssuesFound: "No issues found",
    lawyersMentioned: "Lawyers Mentioned",
    noLawyersFound: "No lawyers mentioned",
    legalBranches: "Legal Branches",
    industries: "Industries",
    qualityScore: "Quality Score",
    closeAnalysis: "Close",
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
    translateAllLanguages: "Traducir a Todos los Idiomas",
    translatingAll: "Traduciendo...",
    translateAllSuccess: "Traducción a todos los idiomas iniciada exitosamente",
    translateAllError: "Error al traducir a todos los idiomas",
    analyzeContent: "Analizar Contenido",
    analyzing: "Analizando...",
    analyzeSuccess: "Análisis de contenido completado",
    analyzeError: "Error al analizar contenido",
    analysisResults: "Resultados del Análisis",
    seoRecommendations: "Recomendaciones SEO",
    keywords: "Palabras Clave",
    titleSuggestion: "Sugerencia de Título",
    metaDescSuggestion: "Meta Descripción",
    headingImprovements: "Mejoras de Encabezados",
    contentGaps: "Brechas de Contenido",
    categories: "Categorías",
    primaryCategory: "Principal",
    secondaryCategories: "Secundarias",
    spellingGrammar: "Ortografía y Gramática",
    noIssuesFound: "Sin problemas encontrados",
    lawyersMentioned: "Abogados Mencionados",
    noLawyersFound: "Sin abogados mencionados",
    legalBranches: "Ramas Legales",
    industries: "Industrias",
    qualityScore: "Puntuación de Calidad",
    closeAnalysis: "Cerrar",
  },
  de: {
    createTitle: "Neuen Beitrag erstellen",
    editTitle: "Beitrag bearbeiten",
    back: "Zurück zu Beiträgen",
    english: "Englisch",
    spanish: "Spanisch",
    seo: "SEO",
    titleLabel: "Titel",
    titlePlaceholder: "Titel des Beitrags eingeben",
    slugLabel: "Slug",
    slugPlaceholder: "beitrags-url-slug",
    slugDescription: "Automatisch aus dem englischen Titel generiert. Nur Buchstaben, Zahlen und Bindestriche.",
    contentLabel: "Inhalt",
    contentPlaceholder: "Schreiben Sie hier Ihren Beitragsinhalt...",
    excerptLabel: "Auszug",
    excerptPlaceholder: "Kurze Zusammenfassung des Beitrags",
    featuredImageLabel: "URL des Hauptbildes",
    featuredImagePlaceholder: "https://beispiel.de/bild.jpg",
    categoryLabel: "Kategorie",
    selectCategory: "Kategorie auswählen",
    noCategory: "Keine Kategorie",
    statusLabel: "Status",
    draft: "Entwurf",
    published: "Veröffentlicht",
    metaTitleLabel: "Meta-Titel",
    metaTitlePlaceholder: "SEO-Titel (max. 70 Zeichen)",
    metaDescriptionLabel: "Meta-Beschreibung",
    metaDescriptionPlaceholder: "SEO-Beschreibung (max. 160 Zeichen)",
    saveDraft: "Als Entwurf speichern",
    publish: "Veröffentlichen",
    saving: "Wird gespeichert...",
    saveSuccess: "Beitrag erfolgreich gespeichert",
    saveError: "Fehler beim Speichern des Beitrags",
    loading: "Wird geladen...",
    required: "Dieses Feld ist erforderlich",
    suggestTranslation: "Übersetzung vorschlagen",
    translating: "Übersetzen...",
    translationSuccess: "Übersetzung mit {confidence}% Konfidenz vorgeschlagen",
    translationError: "Fehler beim Vorschlagen der Übersetzung",
    noEnglishText: "Geben Sie zuerst englischen Text ein",
    translateAllLanguages: "In alle Sprachen übersetzen",
    translatingAll: "Übersetzen...",
    translateAllSuccess: "Übersetzung in alle Sprachen erfolgreich gestartet",
    translateAllError: "Fehler beim Übersetzen in alle Sprachen",
    analyzeContent: "Inhalt analysieren",
    analyzing: "Analysiere...",
    analyzeSuccess: "Inhaltsanalyse abgeschlossen",
    analyzeError: "Analyse fehlgeschlagen",
    analysisResults: "Analyseergebnisse",
    seoRecommendations: "SEO-Empfehlungen",
    keywords: "Schlüsselwörter",
    titleSuggestion: "Titelvorschlag",
    metaDescSuggestion: "Meta-Beschreibung",
    headingImprovements: "Überschriftenverbesserungen",
    contentGaps: "Inhaltslücken",
    categories: "Kategorien",
    primaryCategory: "Primär",
    secondaryCategories: "Sekundär",
    spellingGrammar: "Rechtschreibung & Grammatik",
    noIssuesFound: "Keine Probleme gefunden",
    lawyersMentioned: "Erwähnte Anwälte",
    noLawyersFound: "Keine Anwälte erwähnt",
    legalBranches: "Rechtsbereiche",
    industries: "Branchen",
    qualityScore: "Qualitätsbewertung",
    closeAnalysis: "Schließen",
  },
  zh: {
    createTitle: "创建新文章",
    editTitle: "编辑文章",
    back: "返回文章列表",
    english: "英语",
    spanish: "西班牙语",
    seo: "SEO",
    titleLabel: "标题",
    titlePlaceholder: "输入文章标题",
    slugLabel: "网址标识",
    slugPlaceholder: "文章-url-标识",
    slugDescription: "自动从英文标题生成。只允许字母、数字和连字符。",
    contentLabel: "内容",
    contentPlaceholder: "在此处编写文章内容...",
    excerptLabel: "摘要",
    excerptPlaceholder: "文章简要概述",
    featuredImageLabel: "特色图片URL",
    featuredImagePlaceholder: "https://example.com/image.jpg",
    categoryLabel: "分类",
    selectCategory: "选择分类",
    noCategory: "无分类",
    statusLabel: "状态",
    draft: "草稿",
    published: "已发布",
    metaTitleLabel: "元标题",
    metaTitlePlaceholder: "SEO标题（最多70个字符）",
    metaDescriptionLabel: "元描述",
    metaDescriptionPlaceholder: "SEO描述（最多160个字符）",
    saveDraft: "保存为草稿",
    publish: "发布",
    saving: "保存中...",
    saveSuccess: "文章保存成功",
    saveError: "保存文章失败",
    loading: "加载中...",
    required: "此字段为必填",
    suggestTranslation: "建议翻译",
    translating: "翻译中...",
    translationSuccess: "翻译建议置信度为 {confidence}%",
    translationError: "翻译建议失败",
    noEnglishText: "请先输入英文文本",
    translateAllLanguages: "翻译成所有语言",
    translatingAll: "翻译中...",
    translateAllSuccess: "已成功启动所有语言翻译",
    translateAllError: "翻译到所有语言失败",
    analyzeContent: "分析内容",
    analyzing: "分析中...",
    analyzeSuccess: "内容分析完成",
    analyzeError: "分析失败",
    analysisResults: "分析结果",
    seoRecommendations: "SEO建议",
    keywords: "关键词",
    titleSuggestion: "标题建议",
    metaDescSuggestion: "元描述",
    headingImprovements: "标题改进",
    contentGaps: "内容缺口",
    categories: "分类",
    primaryCategory: "主要",
    secondaryCategories: "次要",
    spellingGrammar: "拼写和语法",
    noIssuesFound: "未发现问题",
    lawyersMentioned: "提到的律师",
    noLawyersFound: "未提到律师",
    legalBranches: "法律领域",
    industries: "行业",
    qualityScore: "质量评分",
    closeAnalysis: "关闭",
  },
  ko: {
    createTitle: "새 게시물 작성",
    editTitle: "게시물 편집",
    back: "게시물 목록으로",
    english: "영어",
    spanish: "스페인어",
    seo: "SEO",
    titleLabel: "제목",
    titlePlaceholder: "게시물 제목을 입력하세요",
    slugLabel: "슬러그",
    slugPlaceholder: "게시물-url-슬러그",
    slugDescription: "영어 제목에서 자동 생성됩니다. 문자, 숫자, 하이픈만 사용 가능합니다.",
    contentLabel: "내용",
    contentPlaceholder: "여기에 게시물 내용을 작성하세요...",
    excerptLabel: "발췌",
    excerptPlaceholder: "게시물 간략 요약",
    featuredImageLabel: "대표 이미지 URL",
    featuredImagePlaceholder: "https://example.com/image.jpg",
    categoryLabel: "카테고리",
    selectCategory: "카테고리 선택",
    noCategory: "카테고리 없음",
    statusLabel: "상태",
    draft: "임시 저장",
    published: "게시됨",
    metaTitleLabel: "메타 제목",
    metaTitlePlaceholder: "SEO 제목 (최대 70자)",
    metaDescriptionLabel: "메타 설명",
    metaDescriptionPlaceholder: "SEO 설명 (최대 160자)",
    saveDraft: "임시 저장",
    publish: "게시",
    saving: "저장 중...",
    saveSuccess: "게시물이 성공적으로 저장되었습니다",
    saveError: "게시물 저장 실패",
    loading: "로딩 중...",
    required: "이 필드는 필수입니다",
    suggestTranslation: "번역 제안",
    translating: "번역 중...",
    translationSuccess: "{confidence}% 신뢰도로 번역이 제안되었습니다",
    translationError: "번역 제안 실패",
    noEnglishText: "먼저 영어 텍스트를 입력하세요",
    translateAllLanguages: "모든 언어로 번역",
    translatingAll: "번역 중...",
    translateAllSuccess: "모든 언어로 번역이 성공적으로 시작되었습니다",
    translateAllError: "모든 언어로 번역 실패",
    analyzeContent: "콘텐츠 분석",
    analyzing: "분석 중...",
    analyzeSuccess: "콘텐츠 분석 완료",
    analyzeError: "분석 실패",
    analysisResults: "분석 결과",
    seoRecommendations: "SEO 권장사항",
    keywords: "키워드",
    titleSuggestion: "제목 제안",
    metaDescSuggestion: "메타 설명",
    headingImprovements: "제목 개선",
    contentGaps: "콘텐츠 격차",
    categories: "카테고리",
    primaryCategory: "주요",
    secondaryCategories: "부수적",
    spellingGrammar: "맞춤법 및 문법",
    noIssuesFound: "문제 없음",
    lawyersMentioned: "언급된 변호사",
    noLawyersFound: "언급된 변호사 없음",
    legalBranches: "법률 분야",
    industries: "산업",
    qualityScore: "품질 점수",
    closeAnalysis: "닫기",
  },
  ja: {
    createTitle: "新しい記事を作成",
    editTitle: "記事を編集",
    back: "記事一覧に戻る",
    english: "英語",
    spanish: "スペイン語",
    seo: "SEO",
    titleLabel: "タイトル",
    titlePlaceholder: "記事のタイトルを入力",
    slugLabel: "スラッグ",
    slugPlaceholder: "記事-url-スラッグ",
    slugDescription: "英語のタイトルから自動生成されます。文字、数字、ハイフンのみ使用可能です。",
    contentLabel: "コンテンツ",
    contentPlaceholder: "ここに記事の内容を書いてください...",
    excerptLabel: "抜粋",
    excerptPlaceholder: "記事の簡潔な要約",
    featuredImageLabel: "アイキャッチ画像URL",
    featuredImagePlaceholder: "https://example.com/image.jpg",
    categoryLabel: "カテゴリ",
    selectCategory: "カテゴリを選択",
    noCategory: "カテゴリなし",
    statusLabel: "ステータス",
    draft: "下書き",
    published: "公開済み",
    metaTitleLabel: "メタタイトル",
    metaTitlePlaceholder: "SEOタイトル（最大70文字）",
    metaDescriptionLabel: "メタ説明",
    metaDescriptionPlaceholder: "SEO説明（最大160文字）",
    saveDraft: "下書きとして保存",
    publish: "公開",
    saving: "保存中...",
    saveSuccess: "記事が正常に保存されました",
    saveError: "記事の保存に失敗しました",
    loading: "読み込み中...",
    required: "このフィールドは必須です",
    suggestTranslation: "翻訳を提案",
    translating: "翻訳中...",
    translationSuccess: "{confidence}%の信頼度で翻訳が提案されました",
    translationError: "翻訳の提案に失敗しました",
    noEnglishText: "まず英語のテキストを入力してください",
    translateAllLanguages: "すべての言語に翻訳",
    translatingAll: "翻訳中...",
    translateAllSuccess: "すべての言語への翻訳が正常に開始されました",
    translateAllError: "すべての言語への翻訳に失敗しました",
    analyzeContent: "コンテンツを分析",
    analyzing: "分析中...",
    analyzeSuccess: "コンテンツ分析完了",
    analyzeError: "分析に失敗しました",
    analysisResults: "分析結果",
    seoRecommendations: "SEO推奨事項",
    keywords: "キーワード",
    titleSuggestion: "タイトル提案",
    metaDescSuggestion: "メタ説明",
    headingImprovements: "見出しの改善",
    contentGaps: "コンテンツのギャップ",
    categories: "カテゴリ",
    primaryCategory: "主要",
    secondaryCategories: "副次的",
    spellingGrammar: "スペルと文法",
    noIssuesFound: "問題なし",
    lawyersMentioned: "言及された弁護士",
    noLawyersFound: "弁護士の言及なし",
    legalBranches: "法律分野",
    industries: "業界",
    qualityScore: "品質スコア",
    closeAnalysis: "閉じる",
  },
  ar: {
    createTitle: "إنشاء مقالة جديدة",
    editTitle: "تعديل المقالة",
    back: "العودة إلى المقالات",
    english: "الإنجليزية",
    spanish: "الإسبانية",
    seo: "تحسين محركات البحث",
    titleLabel: "العنوان",
    titlePlaceholder: "أدخل عنوان المقالة",
    slugLabel: "الرابط المختصر",
    slugPlaceholder: "رابط-المقالة",
    slugDescription: "يتم إنشاؤه تلقائياً من العنوان الإنجليزي. الأحرف والأرقام والشرطات فقط.",
    contentLabel: "المحتوى",
    contentPlaceholder: "اكتب محتوى المقالة هنا...",
    excerptLabel: "المقتطف",
    excerptPlaceholder: "ملخص موجز للمقالة",
    featuredImageLabel: "رابط الصورة المميزة",
    featuredImagePlaceholder: "https://example.com/image.jpg",
    categoryLabel: "الفئة",
    selectCategory: "اختر فئة",
    noCategory: "بدون فئة",
    statusLabel: "الحالة",
    draft: "مسودة",
    published: "منشور",
    metaTitleLabel: "عنوان الميتا",
    metaTitlePlaceholder: "عنوان SEO (بحد أقصى 70 حرفاً)",
    metaDescriptionLabel: "وصف الميتا",
    metaDescriptionPlaceholder: "وصف SEO (بحد أقصى 160 حرفاً)",
    saveDraft: "حفظ كمسودة",
    publish: "نشر",
    saving: "جاري الحفظ...",
    saveSuccess: "تم حفظ المقالة بنجاح",
    saveError: "فشل في حفظ المقالة",
    loading: "جاري التحميل...",
    required: "هذا الحقل مطلوب",
    suggestTranslation: "اقتراح ترجمة",
    translating: "جاري الترجمة...",
    translationSuccess: "تم اقتراح الترجمة بثقة {confidence}%",
    translationError: "فشل في اقتراح الترجمة",
    noEnglishText: "أدخل النص الإنجليزي أولاً",
    translateAllLanguages: "ترجمة إلى جميع اللغات",
    translatingAll: "جاري الترجمة...",
    translateAllSuccess: "تم بدء الترجمة إلى جميع اللغات بنجاح",
    translateAllError: "فشل في الترجمة إلى جميع اللغات",
    analyzeContent: "تحليل المحتوى",
    analyzing: "جاري التحليل...",
    analyzeSuccess: "اكتمل تحليل المحتوى",
    analyzeError: "فشل التحليل",
    analysisResults: "نتائج التحليل",
    seoRecommendations: "توصيات SEO",
    keywords: "الكلمات المفتاحية",
    titleSuggestion: "اقتراح العنوان",
    metaDescSuggestion: "الوصف التعريفي",
    headingImprovements: "تحسينات العناوين",
    contentGaps: "فجوات المحتوى",
    categories: "الفئات",
    primaryCategory: "أساسي",
    secondaryCategories: "ثانوي",
    spellingGrammar: "الإملاء والقواعد",
    noIssuesFound: "لم يتم العثور على مشاكل",
    lawyersMentioned: "المحامون المذكورون",
    noLawyersFound: "لم يذكر محامون",
    legalBranches: "الفروع القانونية",
    industries: "الصناعات",
    qualityScore: "درجة الجودة",
    closeAnalysis: "إغلاق",
  },
  ru: {
    createTitle: "Создать новую запись",
    editTitle: "Редактировать запись",
    back: "Назад к записям",
    english: "Английский",
    spanish: "Испанский",
    seo: "SEO",
    titleLabel: "Заголовок",
    titlePlaceholder: "Введите заголовок записи",
    slugLabel: "Слаг",
    slugPlaceholder: "url-слаг-записи",
    slugDescription: "Автоматически генерируется из английского заголовка. Только буквы, цифры и дефисы.",
    contentLabel: "Контент",
    contentPlaceholder: "Напишите содержание записи здесь...",
    excerptLabel: "Выдержка",
    excerptPlaceholder: "Краткое описание записи",
    featuredImageLabel: "URL главного изображения",
    featuredImagePlaceholder: "https://example.com/image.jpg",
    categoryLabel: "Категория",
    selectCategory: "Выберите категорию",
    noCategory: "Без категории",
    statusLabel: "Статус",
    draft: "Черновик",
    published: "Опубликовано",
    metaTitleLabel: "Мета-заголовок",
    metaTitlePlaceholder: "SEO-заголовок (макс. 70 символов)",
    metaDescriptionLabel: "Мета-описание",
    metaDescriptionPlaceholder: "SEO-описание (макс. 160 символов)",
    saveDraft: "Сохранить как черновик",
    publish: "Опубликовать",
    saving: "Сохранение...",
    saveSuccess: "Запись успешно сохранена",
    saveError: "Не удалось сохранить запись",
    loading: "Загрузка...",
    required: "Это поле обязательно",
    suggestTranslation: "Предложить перевод",
    translating: "Перевод...",
    translationSuccess: "Перевод предложен с уверенностью {confidence}%",
    translationError: "Не удалось предложить перевод",
    noEnglishText: "Сначала введите текст на английском",
    translateAllLanguages: "Перевести на все языки",
    translatingAll: "Перевод...",
    translateAllSuccess: "Перевод на все языки успешно запущен",
    translateAllError: "Не удалось перевести на все языки",
    analyzeContent: "Анализировать контент",
    analyzing: "Анализ...",
    analyzeSuccess: "Анализ контента завершен",
    analyzeError: "Ошибка анализа",
    analysisResults: "Результаты анализа",
    seoRecommendations: "Рекомендации SEO",
    keywords: "Ключевые слова",
    titleSuggestion: "Предложение заголовка",
    metaDescSuggestion: "Мета-описание",
    headingImprovements: "Улучшения заголовков",
    contentGaps: "Пробелы в контенте",
    categories: "Категории",
    primaryCategory: "Основная",
    secondaryCategories: "Вторичные",
    spellingGrammar: "Орфография и грамматика",
    noIssuesFound: "Проблем не найдено",
    lawyersMentioned: "Упомянутые юристы",
    noLawyersFound: "Юристы не упомянуты",
    legalBranches: "Области права",
    industries: "Отрасли",
    qualityScore: "Оценка качества",
    closeAnalysis: "Закрыть",
  },
  fr: {
    createTitle: "Créer un nouvel article",
    editTitle: "Modifier l'article",
    back: "Retour aux articles",
    english: "Anglais",
    spanish: "Espagnol",
    seo: "SEO",
    titleLabel: "Titre",
    titlePlaceholder: "Entrez le titre de l'article",
    slugLabel: "Slug",
    slugPlaceholder: "slug-url-article",
    slugDescription: "Généré automatiquement à partir du titre anglais. Uniquement lettres, chiffres et tirets.",
    contentLabel: "Contenu",
    contentPlaceholder: "Écrivez le contenu de votre article ici...",
    excerptLabel: "Extrait",
    excerptPlaceholder: "Bref résumé de l'article",
    featuredImageLabel: "URL de l'image mise en avant",
    featuredImagePlaceholder: "https://exemple.com/image.jpg",
    categoryLabel: "Catégorie",
    selectCategory: "Sélectionnez une catégorie",
    noCategory: "Sans catégorie",
    statusLabel: "Statut",
    draft: "Brouillon",
    published: "Publié",
    metaTitleLabel: "Méta titre",
    metaTitlePlaceholder: "Titre SEO (max 70 caractères)",
    metaDescriptionLabel: "Méta description",
    metaDescriptionPlaceholder: "Description SEO (max 160 caractères)",
    saveDraft: "Enregistrer comme brouillon",
    publish: "Publier",
    saving: "Enregistrement...",
    saveSuccess: "Article enregistré avec succès",
    saveError: "Échec de l'enregistrement de l'article",
    loading: "Chargement...",
    required: "Ce champ est requis",
    suggestTranslation: "Suggérer une traduction",
    translating: "Traduction...",
    translationSuccess: "Traduction suggérée avec {confidence}% de confiance",
    translationError: "Échec de la suggestion de traduction",
    noEnglishText: "Entrez d'abord le texte en anglais",
    translateAllLanguages: "Traduire dans toutes les langues",
    translatingAll: "Traduction...",
    translateAllSuccess: "Traduction vers toutes les langues lancée avec succès",
    translateAllError: "Échec de la traduction vers toutes les langues",
    analyzeContent: "Analyser le contenu",
    analyzing: "Analyse...",
    analyzeSuccess: "Analyse du contenu terminée",
    analyzeError: "Échec de l'analyse",
    analysisResults: "Résultats de l'analyse",
    seoRecommendations: "Recommandations SEO",
    keywords: "Mots-clés",
    titleSuggestion: "Suggestion de titre",
    metaDescSuggestion: "Méta description",
    headingImprovements: "Améliorations des titres",
    contentGaps: "Lacunes de contenu",
    categories: "Catégories",
    primaryCategory: "Principale",
    secondaryCategories: "Secondaires",
    spellingGrammar: "Orthographe et grammaire",
    noIssuesFound: "Aucun problème trouvé",
    lawyersMentioned: "Avocats mentionnés",
    noLawyersFound: "Aucun avocat mentionné",
    legalBranches: "Branches juridiques",
    industries: "Industries",
    qualityScore: "Score de qualité",
    closeAnalysis: "Fermer",
  },
  it: {
    createTitle: "Crea nuovo articolo",
    editTitle: "Modifica articolo",
    back: "Torna agli articoli",
    english: "Inglese",
    spanish: "Spagnolo",
    seo: "SEO",
    titleLabel: "Titolo",
    titlePlaceholder: "Inserisci il titolo dell'articolo",
    slugLabel: "Slug",
    slugPlaceholder: "slug-url-articolo",
    slugDescription: "Generato automaticamente dal titolo inglese. Solo lettere, numeri e trattini.",
    contentLabel: "Contenuto",
    contentPlaceholder: "Scrivi il contenuto dell'articolo qui...",
    excerptLabel: "Estratto",
    excerptPlaceholder: "Breve riepilogo dell'articolo",
    featuredImageLabel: "URL immagine in evidenza",
    featuredImagePlaceholder: "https://esempio.com/immagine.jpg",
    categoryLabel: "Categoria",
    selectCategory: "Seleziona una categoria",
    noCategory: "Nessuna categoria",
    statusLabel: "Stato",
    draft: "Bozza",
    published: "Pubblicato",
    metaTitleLabel: "Meta titolo",
    metaTitlePlaceholder: "Titolo SEO (max 70 caratteri)",
    metaDescriptionLabel: "Meta descrizione",
    metaDescriptionPlaceholder: "Descrizione SEO (max 160 caratteri)",
    saveDraft: "Salva come bozza",
    publish: "Pubblica",
    saving: "Salvataggio...",
    saveSuccess: "Articolo salvato con successo",
    saveError: "Impossibile salvare l'articolo",
    loading: "Caricamento...",
    required: "Questo campo è obbligatorio",
    suggestTranslation: "Suggerisci traduzione",
    translating: "Traduzione in corso...",
    translationSuccess: "Traduzione suggerita con {confidence}% di affidabilità",
    translationError: "Impossibile suggerire la traduzione",
    noEnglishText: "Inserisci prima il testo in inglese",
    translateAllLanguages: "Traduci in tutte le lingue",
    translatingAll: "Traduzione...",
    translateAllSuccess: "Traduzione in tutte le lingue avviata con successo",
    translateAllError: "Impossibile tradurre in tutte le lingue",
    analyzeContent: "Analizza contenuto",
    analyzing: "Analisi...",
    analyzeSuccess: "Analisi del contenuto completata",
    analyzeError: "Analisi fallita",
    analysisResults: "Risultati dell'analisi",
    seoRecommendations: "Raccomandazioni SEO",
    keywords: "Parole chiave",
    titleSuggestion: "Suggerimento titolo",
    metaDescSuggestion: "Meta descrizione",
    headingImprovements: "Miglioramenti intestazioni",
    contentGaps: "Lacune di contenuto",
    categories: "Categorie",
    primaryCategory: "Principale",
    secondaryCategories: "Secondarie",
    spellingGrammar: "Ortografia e grammatica",
    noIssuesFound: "Nessun problema trovato",
    lawyersMentioned: "Avvocati menzionati",
    noLawyersFound: "Nessun avvocato menzionato",
    legalBranches: "Rami legali",
    industries: "Industrie",
    qualityScore: "Punteggio qualità",
    closeAnalysis: "Chiudi",
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
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading, requireAuth } = useAdminAuth();
  const { toast } = useToast();
  const t = translations[language as keyof typeof translations] || translations.en;

  const [translatingFields, setTranslatingFields] = useState<Record<TranslationField, boolean>>({
    title: false,
    excerpt: false,
    content: false,
  });

  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

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

  const translateAllMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", "/api/agents/run/polyglot_translator", {
        contentType: "blog_post",
        entityId: id,
        fields: ["title", "content", "excerpt"],
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to translate");
      }
      return res.json();
    },
    onMutate: () => {
      setIsTranslatingAll(true);
    },
    onSuccess: () => {
      toast({ title: t.translateAllSuccess });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts", id] });
    },
    onError: (error: Error) => {
      toast({
        title: t.translateAllError,
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTranslatingAll(false);
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await adminApiRequest("POST", `/api/agents/analyze/${id}`, {});
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Failed to analyze");
      }
      return res.json();
    },
    onMutate: () => {
      setIsAnalyzing(true);
    },
    onSuccess: (data) => {
      toast({ title: t.analyzeSuccess });
      if (data.success && data.data?.analysis) {
        setAnalysisResult(data.data.analysis);
        setShowAnalysisDialog(true);
      }
    },
    onError: (error: Error) => {
      toast({
        title: t.analyzeError,
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAnalyzing(false);
    },
  });

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
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => analyzeMutation.mutate()}
                    disabled={isAnalyzing || saveMutation.isPending}
                    data-testid="button-analyze-content"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    {isAnalyzing ? t.analyzing : t.analyzeContent}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => translateAllMutation.mutate()}
                    disabled={isTranslatingAll || saveMutation.isPending}
                    data-testid="button-translate-all"
                  >
                    {isTranslatingAll ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Globe className="mr-2 h-4 w-4" />
                    )}
                    {isTranslatingAll ? t.translatingAll : t.translateAllLanguages}
                  </Button>
                </>
              )}
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
                                {language === "es" ? cat.nameEs : cat.name}
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

      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t.analysisResults}
              {analysisResult?.qualityScore !== undefined && (
                <Badge 
                  variant={analysisResult.qualityScore >= 70 ? "default" : "destructive"}
                  className="ml-2"
                >
                  {t.qualityScore}: {analysisResult.qualityScore}/100
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {analysisResult?.analysisTimestamp && new Date(analysisResult.analysisTimestamp).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {analysisResult && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {t.seoRecommendations}
                  </h3>
                  <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-none">
                    <div>
                      <span className="font-medium">{t.keywords}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysisResult.seoRecommendations?.keywords?.map((kw: string, i: number) => (
                          <Badge key={i} variant="secondary">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    {analysisResult.seoRecommendations?.titleSuggestion && (
                      <div>
                        <span className="font-medium">{t.titleSuggestion}:</span>
                        <p className="text-sm mt-1">{analysisResult.seoRecommendations.titleSuggestion}</p>
                      </div>
                    )}
                    {analysisResult.seoRecommendations?.metaDescription && (
                      <div>
                        <span className="font-medium">{t.metaDescSuggestion}:</span>
                        <p className="text-sm mt-1">{analysisResult.seoRecommendations.metaDescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">{t.categories}</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">{t.primaryCategory}:</span>
                      <Badge className="ml-2">{analysisResult.categories?.primary}</Badge>
                    </div>
                    {analysisResult.categories?.secondary?.length > 0 && (
                      <div>
                        <span className="font-medium">{t.secondaryCategories}:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {analysisResult.categories.secondary.map((cat: string, i: number) => (
                            <Badge key={i} variant="outline">{cat}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    {analysisResult.spellingGrammar?.length > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {t.spellingGrammar}
                  </h3>
                  {analysisResult.spellingGrammar?.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.spellingGrammar.map((issue: any, i: number) => (
                        <div key={i} className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-none">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{issue.type}</Badge>
                            <span className="line-through text-red-500">{issue.original}</span>
                            <span className="mx-2">→</span>
                            <span className="text-green-600">{issue.correction}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{issue.explanation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-green-600">{t.noIssuesFound}</p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">{t.lawyersMentioned}</h3>
                  {analysisResult.lawyersMentioned?.length > 0 ? (
                    <div className="space-y-2">
                      {analysisResult.lawyersMentioned.map((lawyer: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge>{lawyer.name}</Badge>
                          {lawyer.role && <span className="text-sm text-muted-foreground">({lawyer.role})</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t.noLawyersFound}</p>
                  )}
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{t.legalBranches}</h3>
                    <div className="space-y-2">
                      {analysisResult.legalBranches?.primary?.map((branch: string, i: number) => (
                        <Badge key={i} className="mr-1">{branch}</Badge>
                      ))}
                      {analysisResult.legalBranches?.secondary?.map((branch: string, i: number) => (
                        <Badge key={i} variant="outline" className="mr-1">{branch}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-3">{t.industries}</h3>
                    <div className="space-y-2">
                      <Badge>{analysisResult.industries?.primary}</Badge>
                      {analysisResult.industries?.secondary?.map((ind: string, i: number) => (
                        <Badge key={i} variant="outline" className="ml-1">{ind}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAnalysisDialog(false)}
              data-testid="button-close-analysis"
            >
              <X className="mr-2 h-4 w-4" />
              {t.closeAnalysis}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
